/**
 * Cloud Functions for SoNash Recovery Notebook
 * 
 * Server-side rate limiting and validation for critical operations
 * Cannot be bypassed by client-side modifications
 * 
 * Security Features:
 * - Sentry error monitoring (initialized at module load)
 * - Structured audit logging for security events
 * - Rate limiting (10 req/min per user)
 * - App Check verification
 * - Zod schema validation
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { dailyLogSchema } from "./schemas";
import { ZodError } from "zod";
import { initSentry, logSecurityEvent } from "./security-logger";
import { FirestoreRateLimiter } from "./firestore-rate-limiter";

// Initialize Sentry for error monitoring (runs once at cold start)
const SENTRY_DSN = process.env.SENTRY_DSN;
if (SENTRY_DSN) {
    initSentry(SENTRY_DSN);
}

// Initialize Firebase Admin SDK
admin.initializeApp();

// Global options: Limit concurrent instances to control costs
setGlobalOptions({ maxInstances: 10 });

// Firestore-based rate limiter: Persists across function instances and cold starts
// Prevents bypass through horizontal scaling or cold start resets
const saveDailyLogLimiter = new FirestoreRateLimiter({
    points: 10,    // Max 10 requests
    duration: 60,  // Per 60 seconds
});

interface DailyLogData {
    userId: string;
    date: string;
    content: string;
    mood?: string | null;
    cravings?: boolean;
    used?: boolean;
}

/**
 * Callable Function: Save Daily Log with Rate Limiting
 * 
 * Security Layers:
 * 1. Authentication required (context.auth)
 * 2. Rate limiting (10 req/min per user)
 * 3. App Check verification (context.app)
 * 4. Input validation
 * 5. Authorization (user can only write own data)
 * 6. Server-side timestamp (prevents clock manipulation)
 */
export const saveDailyLog = onCall<DailyLogData>(
    {
        // Enforce App Check for bot protection
        // IAM role 'firebaseappcheck.tokenVerifier' added to service account
        enforceAppCheck: true,
        consumeAppCheckToken: true,
    },
    async (request) => {
        const { data, app, auth } = request;

        // 1. Authenticate user
        if (!auth) {
            logSecurityEvent(
                "AUTH_FAILURE",
                "saveDailyLog",
                "Unauthenticated request attempted"
            );
            throw new HttpsError(
                "unauthenticated",
                "You must be signed in to call this function."
            );
        }

        const userId = auth.uid;

        // 2. Check rate limit (server-side, cannot be bypassed)
        // Uses Firestore for persistence across function instances
        try {
            await saveDailyLogLimiter.consume(userId, "saveDailyLog");
        } catch (rateLimitError) {
            const errorMessage = rateLimitError instanceof Error
                ? rateLimitError.message
                : "Rate limit exceeded (10 req/min)";

            logSecurityEvent(
                "RATE_LIMIT_EXCEEDED",
                "saveDailyLog",
                errorMessage,
                { userId }
            );
            throw new HttpsError(
                "resource-exhausted",
                errorMessage
            );
        }

        // 3. Verify App Check token (bot protection)
        if (!app) {
            logSecurityEvent(
                "APP_CHECK_FAILURE",
                "saveDailyLog",
                "App Check token missing or invalid",
                { userId }
            );
            throw new HttpsError(
                "failed-precondition",
                "App Check verification failed. Please refresh the page."
            );
        }

        // 4. Validate input data using Zod
        let validatedData;
        try {
            validatedData = dailyLogSchema.parse(data);
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.issues.map((e) => e.message).join(", ");
                logSecurityEvent(
                    "VALIDATION_FAILURE",
                    "saveDailyLog",
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

        const { date, content, mood, cravings, used } = validatedData;

        // 5. Server-side authorization check
        if (data.userId && data.userId !== userId) {
            logSecurityEvent(
                "AUTHORIZATION_FAILURE",
                "saveDailyLog",
                "Attempted to write to another user's data",
                { userId, metadata: { attemptedUserId: data.userId } }
            );
            throw new HttpsError(
                "permission-denied",
                "Cannot write to another user's data"
            );
        }

        // 6. Save to Firestore using Admin SDK (bypasses security rules)
        try {
            const docRef = admin
                .firestore()
                .collection("users")
                .doc(userId)
                .collection("daily_logs")
                .doc(date);

            await docRef.set(
                {
                    date,
                    content,
                    mood: mood || null,
                    cravings: cravings || false,
                    used: used || false,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            logSecurityEvent(
                "SAVE_SUCCESS",
                "saveDailyLog",
                "Journal saved successfully",
                { userId, severity: "INFO" }
            );

            return {
                success: true,
                message: "Journal saved successfully",
            };
        } catch (error) {
            logSecurityEvent(
                "SAVE_FAILURE",
                "saveDailyLog",
                "Failed to save to Firestore",
                { userId, metadata: { error: String(error) }, captureToSentry: true }
            );

            throw new HttpsError(
                "internal",
                "Failed to save journal. Please try again."
            );
        }
    }
);

// Export admin functions (server-side validation & authorization)
export {
    adminSaveMeeting,
    adminDeleteMeeting,
    adminSaveSoberLiving,
    adminDeleteSoberLiving,
    adminSaveQuote,
    adminDeleteQuote,
} from "./admin";

// Export rate limiter cleanup function (should be run daily via Cloud Scheduler)
export { cleanupOldRateLimits } from "./firestore-rate-limiter";
