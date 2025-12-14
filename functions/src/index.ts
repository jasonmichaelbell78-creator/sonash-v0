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
import { dailyLogSchema } from "./schemas";
import { ZodError } from "zod";

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
        // Enforce App Check for bot protection
        // consumeAppCheckToken: true, // TODO: Re-enable after debugging token issues
    },
    async (request) => {
        const { data, app, auth } = request;

        // 1. Authenticate user
        if (!auth) {
            throw new HttpsError(
                "unauthenticated",
                "You must be signed in to call this function."
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

        // 4. Validate input data using Zod
        let validatedData;
        try {
            validatedData = dailyLogSchema.parse(data);
        } catch (error) {
            if (error instanceof ZodError) {
                // Return the first validation error message
                throw new HttpsError(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    "invalid-argument",
                    "Validation failed: " + (error as any).errors.map((e: { message: string }) => e.message).join(", ")
                );
            }
            throw error;
        }

        const { date, content, mood, cravings, used } = validatedData;

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
            // Log error for monitoring
            console.error("Failed to save daily log:", error);

            throw new HttpsError(
                "internal",
                "Failed to save journal. Please try again."
            );
        }
    }
);
