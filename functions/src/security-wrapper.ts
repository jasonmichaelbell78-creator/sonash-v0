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

// ============================================================================
// Security Check Helpers (extracted for cognitive complexity reduction)
// ============================================================================

/**
 * Check user-based rate limit
 */
async function checkUserRateLimit(
  rateLimiter: FirestoreRateLimiter | undefined,
  userId: string,
  functionName: string
): Promise<void> {
  if (!rateLimiter) return;

  try {
    await rateLimiter.consume(userId, functionName);
  } catch (rateLimitError) {
    const internalMessage =
      rateLimitError instanceof Error ? rateLimitError.message : "Rate limit exceeded";
    logSecurityEvent("RATE_LIMIT_EXCEEDED", functionName, internalMessage, { userId });
    throw new HttpsError("resource-exhausted", "Too many requests. Please try again later.");
  }
}

/**
 * Check IP-based rate limit (CANON-0036: secondary defense against account cycling)
 */
async function checkIpRateLimit(
  ipRateLimiter: FirestoreRateLimiter | undefined,
  request: CallableRequest,
  userId: string,
  functionName: string
): Promise<void> {
  if (!ipRateLimiter) return;

  const clientIp = request.rawRequest?.ip;
  if (!clientIp) return;

  try {
    await ipRateLimiter.consumeByIp(clientIp, functionName);
  } catch (rateLimitError) {
    const internalMessage =
      rateLimitError instanceof Error ? rateLimitError.message : "Rate limit exceeded";
    logSecurityEvent(
      "RATE_LIMIT_EXCEEDED",
      functionName,
      `IP-based rate limit: ${internalMessage}`,
      {
        userId,
        metadata: { clientIp },
        captureToSentry: false, // Don't send raw IP addresses to third-party services
      }
    );
    throw new HttpsError("resource-exhausted", "Too many requests. Please try again later.");
  }
}

/**
 * Verify App Check token
 */
function verifyAppCheck(
  request: CallableRequest,
  requireAppCheck: boolean,
  userId: string,
  functionName: string
): void {
  if (requireAppCheck && !request.app) {
    logSecurityEvent("APP_CHECK_FAILURE", functionName, "App Check token missing or invalid", {
      userId,
    });
    throw new HttpsError(
      "failed-precondition",
      "App Check verification failed. Please refresh the page."
    );
  }
}

/**
 * Handle reCAPTCHA verification with emulator bypass support
 */
async function handleRecaptchaVerification(
  request: CallableRequest,
  recaptchaAction: string | undefined,
  userId: string,
  functionName: string
): Promise<void> {
  if (!recaptchaAction) return;

  const dataWithToken = request.data as { recaptchaToken?: string };
  const token = dataWithToken.recaptchaToken;

  // Check for explicit bypass (Firebase emulator only)
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
  const bypassRequested = process.env.RECAPTCHA_BYPASS === "true";
  const allowBypass = bypassRequested && isEmulator;

  if (!token || token.trim() === "") {
    if (allowBypass) {
      logSecurityEvent(
        "RECAPTCHA_BYPASSED",
        functionName,
        "reCAPTCHA bypassed (RECAPTCHA_BYPASS=true) - emulator only",
        {
          userId,
          severity: "WARNING",
          metadata: { action: recaptchaAction, isEmulator },
        }
      );
    } else {
      logSecurityEvent(
        "RECAPTCHA_MISSING_TOKEN",
        functionName,
        "Request rejected: reCAPTCHA token required",
        {
          userId,
          metadata: { action: recaptchaAction },
        }
      );
      throw new HttpsError(
        "failed-precondition",
        "Security verification required. Please refresh the page and try again."
      );
    }
  } else {
    await verifyRecaptchaToken(token, recaptchaAction, userId);
  }
}

/**
 * Validate input data using Zod schema
 */
function validateInputData<T>(
  request: CallableRequest,
  validationSchema: ZodSchema<T> | undefined,
  userId: string,
  functionName: string
): T {
  if (!validationSchema) {
    return request.data as T;
  }

  try {
    return validationSchema.parse(request.data);
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.issues.map((e) => e.message).join(", ");
      logSecurityEvent(
        "VALIDATION_FAILURE",
        functionName,
        `Zod validation failed: ${errorMessages}`,
        {
          userId,
          metadata: { issues: error.issues },
        }
      );
      throw new HttpsError("invalid-argument", "Validation failed: " + errorMessages);
    }
    throw error;
  }
}

/**
 * Check userId authorization (ensure user can only access their own data)
 */
function checkUserIdAuthorization(
  request: CallableRequest,
  authorizeUserId: boolean,
  userId: string,
  functionName: string
): void {
  if (!authorizeUserId) return;

  const dataWithUserId = request.data as { userId?: string };
  if (dataWithUserId.userId && dataWithUserId.userId !== userId) {
    logSecurityEvent(
      "AUTHORIZATION_FAILURE",
      functionName,
      "Attempted to write to another user's data",
      {
        userId,
        metadata: { attemptedUserId: dataWithUserId.userId },
      }
    );
    throw new HttpsError("permission-denied", "Cannot write to another user's data");
  }
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
    logSecurityEvent("AUTH_FAILURE", functionName, "Unauthenticated request attempted");
    throw new HttpsError("unauthenticated", "You must be signed in to call this function.");
  }

  const userId = request.auth.uid;

  // 2. Check rate limits using extracted helpers
  await checkUserRateLimit(rateLimiter, userId, functionName);
  await checkIpRateLimit(ipRateLimiter, request, userId, functionName);

  // 3. Verify App Check token
  verifyAppCheck(request, requireAppCheck, userId, functionName);

  // 4. Verify reCAPTCHA token
  await handleRecaptchaVerification(request, recaptchaAction, userId, functionName);

  // 5. Validate input data using Zod
  const validatedData = validateInputData<TInput>(request, validationSchema, userId, functionName);

  // 6. Check userId authorization
  checkUserIdAuthorization(request, authorizeUserId, userId, functionName);

  // Execute the handler with validated context
  return handler({
    data: validatedData,
    userId,
    request,
  });
}
