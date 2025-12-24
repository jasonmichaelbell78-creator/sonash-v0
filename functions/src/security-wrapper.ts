/**
 * Security Wrapper for Cloud Functions
 *
 * Provides reusable security checks for all Cloud Functions:
 * - Authentication verification
 * - Rate limiting
 * - App Check verification
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

interface SecurityOptions<T> {
    /**
     * Function name for logging and rate limiting
     */
    functionName: string;

    /**
     * Rate limiter instance (optional, skips rate limiting if not provided)
     */
    rateLimiter?: FirestoreRateLimiter;

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
        validationSchema,
        requireAppCheck = true,
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

    // 2. Check rate limit (if rate limiter provided)
    if (rateLimiter) {
        try {
            await rateLimiter.consume(userId, functionName);
        } catch (rateLimitError) {
            const errorMessage = rateLimitError instanceof Error
                ? rateLimitError.message
                : "Rate limit exceeded";

            logSecurityEvent(
                "RATE_LIMIT_EXCEEDED",
                functionName,
                errorMessage,
                { userId }
            );
            throw new HttpsError(
                "resource-exhausted",
                errorMessage
            );
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
