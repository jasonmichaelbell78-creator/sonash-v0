/**
 * Security Wrapper for Cloud Functions
 *
 * Provides reusable security checks for all Cloud Functions:
 * - Authentication verification
 * - Rate limiting
 * - App Check verification
 * - reCAPTCHA Enterprise verification
 * - Input validation with Zod
 * - Authorization checks
 * - Security event logging
 *
 * @module functions/src/security-wrapper
 */

import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { ZodSchema, ZodError } from "zod";
import { FirestoreRateLimiter } from "./firestore-rate-limiter";
import { logSecurityEvent } from "./security-logger";
import { verifyRecaptchaToken } from "./recaptcha-verify";

interface SecurityOptions<T> {
    /**
     * Function name for logging and rate limiting
     */
    functionName: string;

    /**
     * Rate limiter instance by userId (optional, skips rate limiting if not provided)
     */
    rateLimiter?: FirestoreRateLimiter;

    /**
     * CANON-0036: IP-based rate limiter (optional, secondary defense against account cycling)
     * Applied in addition to userId-based rate limiting
     */
    ipRateLimiter?: FirestoreRateLimiter;

    /**
     * Zod schema for input validation (optional, skips validation if not provided)
     */
    validationSchema?: ZodSchema<T>;

    /**
     * Whether to require App Check token (default: true)
     * Set to false only for non-production environments or admin functions
     */
    requireAppCheck?: boolean;

    /**
     * Expected reCAPTCHA action (optional, skips reCAPTCHA if not provided)
     * When set, requires and verifies a reCAPTCHA token in the request data
     */
    recaptchaAction?: string;

    /**
     * Whether to perform userId authorization check (default: true)
     * Ensures data.userId (if present) matches auth.uid
     */
    authorizeUserId?: boolean;
}

interface SecureCallableContext<T> {
    /**
     * Validated and typed input data
     */
    data: T;

    /**
     * Authenticated user ID
     */
    userId: string;

    /**
     * Original request object (for advanced use cases)
     */
    request: CallableRequest;
}

/**
 * Wrapper function that applies all security checks before executing handler
 *
 * @param request - The Cloud Function request object
 * @param options - Security configuration options
 * @param handler - The business logic handler to execute after security checks
 * @returns Promise resolving to the handler's return value
 * @throws HttpsError if any security check fails
 *
 * @example
 * export const saveDailyLog = onCall<DailyLogData>(
 *   async (request) => withSecurityChecks(
 *     request,
 *     {
 *       functionName: 'saveDailyLog',
 *       rateLimiter: saveDailyLogLimiter,
 *       validationSchema: dailyLogSchema,
 *     },
 *     async ({ data, userId }) => {
 *       // Your business logic here
 *       await admin.firestore().collection('users').doc(userId)...
 *       return { success: true };
 *     }
 *   )
 * );
 */
export async function withSecurityChecks<TInput, TOutput>(
    request: CallableRequest,
    options: SecurityOptions<TInput>,
    handler: (context: SecureCallableContext<TInput>) => Promise<TOutput>
): Promise<TOutput> {
    const {
        functionName,
        rateLimiter,
        ipRateLimiter,
        validationSchema,
        requireAppCheck = true,
        recaptchaAction,
        authorizeUserId = true,
    } = options;

    // 1. Authenticate user
    if (!request.auth) {
        logSecurityEvent(
            "AUTH_FAILURE",
            functionName,
            "Unauthenticated request attempted"
        );
        throw new HttpsError(
            "unauthenticated",
            "You must be signed in to call this function."
        );
    }

    const userId = request.auth.uid;

    // 2. Check user-based rate limit (if rate limiter provided)
    if (rateLimiter) {
        try {
            await rateLimiter.consume(userId, functionName);
        } catch (rateLimitError) {
            // Log detailed error server-side for debugging
            const internalMessage = rateLimitError instanceof Error
                ? rateLimitError.message
                : "Rate limit exceeded";

            logSecurityEvent(
                "RATE_LIMIT_EXCEEDED",
                functionName,
                internalMessage,
                { userId }
            );

            // Return generic message to client (prevent information leakage)
            throw new HttpsError(
                "resource-exhausted",
                "Too many requests. Please try again later."
            );
        }
    }

    // 2.5. CANON-0036: Check IP-based rate limit (secondary defense against account cycling)
    // NOTE: IP from X-Forwarded-For can be spoofed in some deployments. This is a secondary
    // defense layer - primary protection is per-user rate limiting above.
    if (ipRateLimiter) {
        // Get client IP from Cloud Functions request
        // request.rawRequest.ip is the recommended approach (set by Cloud Functions)
        const clientIp = request.rawRequest?.ip;

        if (clientIp) {
            try {
                await ipRateLimiter.consumeByIp(clientIp, functionName);
            } catch (rateLimitError) {
                // Log detailed error server-side for debugging
                const internalMessage = rateLimitError instanceof Error
                    ? rateLimitError.message
                    : "Rate limit exceeded";

                logSecurityEvent(
                    "RATE_LIMIT_EXCEEDED",
                    functionName,
                    `IP-based rate limit: ${internalMessage}`,
                    { userId, metadata: { clientIp } }
                );

                // Return generic message to client (prevent information leakage)
                throw new HttpsError(
                    "resource-exhausted",
                    "Too many requests. Please try again later."
                );
            }
        }
    }

    // 3. Verify App Check token (if required)
    if (requireAppCheck && !request.app) {
        logSecurityEvent(
            "APP_CHECK_FAILURE",
            functionName,
            "App Check token missing or invalid",
            { userId }
        );
        throw new HttpsError(
            "failed-precondition",
            "App Check verification failed. Please refresh the page."
        );
    }

    // 3.5. Verify reCAPTCHA token (if action specified)
    // CANON-0008/CANON-0035: Fail-closed enforcement - reject missing tokens unless
    // explicitly bypassed in dev/test environments
    if (recaptchaAction) {
        const dataWithToken = request.data as { recaptchaToken?: string };
        const token = dataWithToken.recaptchaToken;

        // Check for explicit bypass (dev/test environments only)
        // SECURITY: Bypass only allowed when ALL conditions are true:
        // 1. RECAPTCHA_BYPASS=true is explicitly set
        // 2. Running in Firebase emulator OR not in production
        // This prevents accidental bypass in production deployments
        const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
        const isProduction = process.env.NODE_ENV === 'production';
        const bypassRequested = process.env.RECAPTCHA_BYPASS === 'true';
        const allowBypass = bypassRequested && (isEmulator || !isProduction);

        if (!token || token.trim() === '') {
            if (allowBypass) {
                // Dev/test bypass - log but don't block
                logSecurityEvent(
                    "RECAPTCHA_BYPASSED",
                    functionName,
                    "reCAPTCHA bypassed (RECAPTCHA_BYPASS=true) - emulator/dev mode only",
                    {
                        userId,
                        severity: "WARNING",
                        metadata: { action: recaptchaAction, isEmulator, isProduction }
                    }
                );
            } else {
                // Production: Fail-closed - reject missing tokens
                logSecurityEvent(
                    "RECAPTCHA_MISSING_TOKEN",
                    functionName,
                    "Request rejected: reCAPTCHA token required",
                    {
                        userId,
                        metadata: { action: recaptchaAction }
                    }
                );
                throw new HttpsError(
                    "failed-precondition",
                    "Security verification required. Please refresh the page and try again."
                );
            }
        } else {
            // Verify token if present
            await verifyRecaptchaToken(token, recaptchaAction, userId);
        }
    }

    // 4. Validate input data using Zod (if schema provided)
    let validatedData: TInput;
    if (validationSchema) {
        try {
            validatedData = validationSchema.parse(request.data);
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.issues.map((e) => e.message).join(", ");
                logSecurityEvent(
                    "VALIDATION_FAILURE",
                    functionName,
                    `Zod validation failed: ${errorMessages}`,
                    { userId, metadata: { issues: error.issues } }
                );
                throw new HttpsError(
                    "invalid-argument",
                    "Validation failed: " + errorMessages
                );
            }
            throw error;
        }
    } else {
        // No validation schema, pass data through as-is
        validatedData = request.data as TInput;
    }

    // 5. Server-side authorization check (if enabled)
    if (authorizeUserId) {
        const dataWithUserId = request.data as { userId?: string };
        if (dataWithUserId.userId && dataWithUserId.userId !== userId) {
            logSecurityEvent(
                "AUTHORIZATION_FAILURE",
                functionName,
                "Attempted to write to another user's data",
                { userId, metadata: { attemptedUserId: dataWithUserId.userId } }
            );
            throw new HttpsError(
                "permission-denied",
                "Cannot write to another user's data"
            );
        }
    }

    // Execute the handler with validated context
    return handler({
        data: validatedData,
        userId,
        request,
    });
}
