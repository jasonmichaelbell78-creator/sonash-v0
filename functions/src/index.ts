/**
 * Cloud Functions for SoNash Recovery Notebook
 * 
 * Server-side rate limiting and validation for critical operations
 * Cannot be bypassed by client-side modifications
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { RateLimiterMemory } from "rate-limiter-flexible";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Global options: Limit concurrent instances to control costs
setGlobalOptions({ maxInstances: 10 });

// Rate limiter: 10 requests per minute per user
// This runs in-memory and resets when function cold-starts
// For production, consider using Firestore-based limiter
const saveDailyLogLimiter = new RateLimiterMemory({
    points: 10, // Number of requests
    duration: 60, // Per 60 seconds
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
        consumeAppCheckToken: true,
    },
    async (request) => {
        const { data, auth, app } = request;

        // 1. Verify authentication
        if (!auth) {
            throw new HttpsError(
                "unauthenticated",
                "Must be authenticated to save journal"
            );
        }

        const userId = auth.uid;

        // 2. Check rate limit (server-side, cannot be bypassed)
        try {
            await saveDailyLogLimiter.consume(userId);
        } catch (error) {
            throw new HttpsError(
                "resource-exhausted",
                "Too many requests. Please wait 60 seconds before trying again.",
                { retryAfter: 60 }
            );
        }

        // 3. Verify App Check token (bot protection)
        if (!app) {
            throw new HttpsError(
                "failed-precondition",
                "App Check verification failed. Please refresh the page."
            );
        }

        // 4. Validate input data
        const { date, content, mood, cravings, used } = data;

        if (!date || typeof date !== "string") {
            throw new HttpsError(
                "invalid-argument",
                "Date is required and must be a string"
            );
        }

        if (typeof content !== "string") {
            throw new HttpsError(
                "invalid-argument",
                "Content must be a string"
            );
        }

        // Date format validation: STRICTLY enforce YYYY-MM-DD format
        // Removed support for readable format to prevent inconsistencies
        if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Return more detailed error in development
            const isDev = process.env.FUNCTIONS_EMULATOR === "true" || 
                         process.env.NODE_ENV === "development";
            
            const errorMsg = isDev 
                ? `Invalid date format. Expected YYYY-MM-DD but received: "${date}"`
                : "Invalid date format. Expected YYYY-MM-DD.";
            
            throw new HttpsError(
                "invalid-argument",
                errorMsg
            );
        }

        // Content length validation (max 50KB)
        if (content.length > 50000) {
            throw new HttpsError(
                "invalid-argument",
                "Content too large. Maximum 50KB."
            );
        }

        // 5. Server-side authorization check
        if (data.userId && data.userId !== userId) {
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

            return {
                success: true,
                message: "Journal saved successfully",
            };
        } catch (error) {
            // Log error for monitoring with more details
            const isDev = process.env.FUNCTIONS_EMULATOR === "true" || 
                         process.env.NODE_ENV === "development";
            
            if (isDev) {
                console.error("Failed to save daily log:", {
                    error,
                    userId,
                    date: data.date,
                    contentLength: data.content?.length,
                    errorMessage: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
            } else {
                console.error("Failed to save daily log:", error);
            }

            throw new HttpsError(
                "internal",
                isDev 
                    ? `Failed to save journal: ${error instanceof Error ? error.message : 'Unknown error'}`
                    : "Failed to save journal. Please try again."
            );
        }
    }
);
