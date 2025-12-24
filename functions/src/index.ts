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
import { dailyLogSchema, journalEntrySchema, inventoryEntrySchema } from "./schemas";
import { ZodError } from "zod";
import { initSentry, logSecurityEvent } from "./security-logger";
import { FirestoreRateLimiter } from "./firestore-rate-limiter";

// Type-safe interface for migration merge data
interface MigrationMergeData {
    migratedFrom: string;
    migratedAt: admin.firestore.FieldValue;
    soberDate?: admin.firestore.Timestamp;
    // Future fields can be added here as needed
}

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

// Initialize rate limiter for journal entries
const saveJournalEntryLimiter = new FirestoreRateLimiter({
    points: 10,    // Max 10 requests
    duration: 60,  // Per 60 seconds
});

interface JournalEntryData {
    userId?: string;
    type: string;
    data: Record<string, unknown>;
    dateLabel: string;
    isPrivate?: boolean;
    searchableText?: string;
    tags?: string[];
    hasCravings?: boolean;
    hasUsed?: boolean;
    mood?: string | null;
}

/**
 * Callable Function: Save Journal Entry with Rate Limiting
 * 
 * Security Layers:
 * 1. Authentication required (context.auth)
 * 2. Rate limiting (10 req/min per user)
 * 3. App Check verification (context.app)
 * 4. Input validation (Zod schema)
 * 5. Authorization (user can only write own data)
 * 6. Server-side timestamp (prevents clock manipulation)
 */
export const saveJournalEntry = onCall<JournalEntryData>(
    async (request) => {
        const { data, app, auth } = request;

        // 1. Authenticate user
        if (!auth) {
            logSecurityEvent(
                "AUTH_FAILURE",
                "saveJournalEntry",
                "Unauthenticated request attempted"
            );
            throw new HttpsError(
                "unauthenticated",
                "You must be signed in to call this function."
            );
        }

        const userId = auth.uid;

        // 2. Check rate limit (server-side, cannot be bypassed)
        try {
            await saveJournalEntryLimiter.consume(userId, "saveJournalEntry");
        } catch (rateLimitError) {
            const errorMessage = rateLimitError instanceof Error
                ? rateLimitError.message
                : "Rate limit exceeded (10 req/min)";

            logSecurityEvent(
                "RATE_LIMIT_EXCEEDED",
                "saveJournalEntry",
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
                "saveJournalEntry",
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
            validatedData = journalEntrySchema.parse(data);
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.issues.map((e) => e.message).join(", ");
                logSecurityEvent(
                    "VALIDATION_FAILURE",
                    "saveJournalEntry",
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

        const { type, data: entryData, dateLabel, isPrivate, searchableText, tags, hasCravings, hasUsed, mood } = validatedData;

        // 5. Server-side authorization check
        if (data.userId && data.userId !== userId) {
            logSecurityEvent(
                "AUTHORIZATION_FAILURE",
                "saveJournalEntry",
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
                .collection("journal")
                .doc(); // Auto-generate ID

            const journalEntry: Record<string, unknown> = {
                userId,
                type,
                data: entryData,
                dateLabel,
                isPrivate: isPrivate !== undefined ? isPrivate : true,
                isSoftDeleted: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            // Add optional fields if present
            if (searchableText) journalEntry.searchableText = searchableText;
            if (tags) journalEntry.tags = tags;
            if (hasCravings !== undefined) journalEntry.hasCravings = hasCravings;
            if (hasUsed !== undefined) journalEntry.hasUsed = hasUsed;
            if (mood !== undefined) journalEntry.mood = mood;

            await docRef.set(journalEntry);

            logSecurityEvent(
                "SAVE_SUCCESS",
                "saveJournalEntry",
                "Journal entry saved successfully",
                { userId, severity: "INFO" }
            );

            return {
                success: true,
                message: "Journal entry saved successfully",
                entryId: docRef.id,
            };
        } catch (error) {
            logSecurityEvent(
                "SAVE_FAILURE",
                "saveJournalEntry",
                "Failed to save to Firestore",
                { userId, metadata: { error: String(error) }, captureToSentry: true }
            );

            throw new HttpsError(
                "internal",
                "Failed to save journal entry. Please try again."
            );
        }
    }
);


// Initialize rate limiter for inventory entries
const saveInventoryEntryLimiter = new FirestoreRateLimiter({
    points: 10,    // Max 10 inventory entries
    duration: 60,  // Per minute (same as journal/daily log)
});

/**
 * Callable Function: Save Inventory Entry
 *
 * Saves spot-check, night-review, and gratitude inventory entries
 * with server-side validation and rate limiting.
 *
 * Security Layers:
 * 1. Authentication required
 * 2. Rate limiting (10 req/min)
 * 3. App Check verification
 * 4. Zod schema validation
 * 5. Authorization (write own data only)
 * 6. Audit logging
 */
export const saveInventoryEntry = onCall<typeof inventoryEntrySchema>(
    async (request) => {
        const { data, app, auth } = request;

        // 1. Authentication check
        if (!auth) {
            logSecurityEvent(
                "AUTH_FAILURE",
                "saveInventoryEntry",
                "Unauthenticated request"
            );
            throw new HttpsError(
                "unauthenticated",
                "You must be signed in to save inventory entries."
            );
        }

        const userId = auth.uid;

        // 2. Rate limit check (10 req/min)
        try {
            await saveInventoryEntryLimiter.consume(userId, "saveInventoryEntry");
        } catch (rateLimitError) {
            const errorMessage = rateLimitError instanceof Error
                ? rateLimitError.message
                : "Too many requests. Please try again later.";
            logSecurityEvent(
                "RATE_LIMIT_EXCEEDED",
                "saveInventoryEntry",
                errorMessage,
                { userId }
            );
            throw new HttpsError("resource-exhausted", errorMessage);
        }

        // 3. Verify App Check token (bot protection)
        if (!app) {
            logSecurityEvent(
                "APP_CHECK_FAILURE",
                "saveInventoryEntry",
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
            validatedData = inventoryEntrySchema.parse(data);
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.issues.map((e) => e.message).join(", ");
                logSecurityEvent(
                    "VALIDATION_FAILURE",
                    "saveInventoryEntry",
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

        const { type, data: entryData, tags, userId: requestUserId } = validatedData;

        // 5. Server-side authorization check
        if (requestUserId && requestUserId !== userId) {
            logSecurityEvent(
                "AUTHORIZATION_FAILURE",
                "saveInventoryEntry",
                "Attempted to write to another user's data",
                { userId, metadata: { attemptedUserId: requestUserId } }
            );
            throw new HttpsError(
                "permission-denied",
                "Cannot write to another user's data"
            );
        }

        // Helper to remove undefined values (Firestore doesn't support them)
        const sanitizeData = (data: unknown): unknown => {
            if (Array.isArray(data)) {
                return data.map(sanitizeData);
            }
            if (data !== null && typeof data === 'object') {
                return Object.entries(data as Record<string, unknown>).reduce(
                    (acc: Record<string, unknown>, [key, value]) => {
                        if (value !== undefined) {
                            acc[key] = sanitizeData(value);
                        }
                        return acc;
                    },
                    {} as Record<string, unknown>
                );
            }
            return data;
        };

        // 6. Save to Firestore using Admin SDK (bypasses security rules)
        try {
            const docRef = admin
                .firestore()
                .collection("users")
                .doc(userId)
                .collection("inventoryEntries")
                .doc(); // Auto-generate ID

            // Get today's date in YYYY-MM-DD format (UTC)
            const now = new Date();
            const dateId = now.toISOString().split('T')[0];

            const inventoryEntry: Record<string, unknown> = {
                id: docRef.id,
                userId,
                type,
                data: sanitizeData(entryData),
                tags: tags || [],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                dateId, // For easy querying by day
            };

            await docRef.set(inventoryEntry);

            logSecurityEvent(
                "SAVE_SUCCESS",
                "saveInventoryEntry",
                "Inventory entry saved successfully",
                { userId, severity: "INFO", metadata: { type } }
            );

            return {
                success: true,
                message: "Inventory entry saved successfully",
                entryId: docRef.id,
            };
        } catch (error) {
            logSecurityEvent(
                "SAVE_FAILURE",
                "saveInventoryEntry",
                "Failed to save to Firestore",
                { userId, metadata: { error: String(error) }, captureToSentry: true }
            );

            throw new HttpsError(
                "internal",
                "Failed to save inventory entry. Please try again."
            );
        }
    }
);


// Initialize rate limiter for migration operations
const migrateDataLimiter = new FirestoreRateLimiter({
    points: 5,     // Max 5 migrations
    duration: 300, // Per 5 minutes (migrations are expensive)
});

interface MigrationData {
    anonymousUid: string;
    targetUid: string;
}

/**
 * Callable Function: Migrate Anonymous User Data
 * 
 * Migrates all data from an anonymous account to a permanent account
 * before account linking. Prevents data loss when credentials already exist.
 * 
 * Security Layers:
 * 1. Authentication required
 * 2. Rate limiting (5 req/5min)
 * 3. App Check verification
 * 4. Authorization (caller must be source or target)
 * 5. Batch writes for atomicity
 * 6. Audit logging
 */
export const migrateAnonymousUserData = onCall<MigrationData>(
    async (request) => {
        const { data, app, auth } = request;

        if (!auth) {
            logSecurityEvent("AUTH_FAILURE", "migrateAnonymousUserData", "Unauthenticated request");
            throw new HttpsError("unauthenticated", "You must be signed in to call this function.");
        }

        const userId = auth.uid;

        // Rate limit check
        try {
            await migrateDataLimiter.consume(userId, "migrateAnonymousUserData");
        } catch (rateLimitError) {
            const errorMessage = rateLimitError instanceof Error
                ? rateLimitError.message
                : "Rate limit exceeded (5 req/5min)";
            logSecurityEvent("RATE_LIMIT_EXCEEDED", "migrateAnonymousUserData", errorMessage, { userId });
            throw new HttpsError("resource-exhausted", errorMessage);
        }

        // App Check verification
        if (!app) {
            logSecurityEvent("APP_CHECK_FAILURE", "migrateAnonymousUserData", "App Check token invalid", { userId });
            throw new HttpsError("failed-precondition", "App Check verification failed. Please refresh the page.");
        }

        // Validate input
        if (!data.anonymousUid || !data.targetUid) {
            throw new HttpsError("invalid-argument", "Both anonymousUid and targetUid are required");
        }

        // Authorization: caller must be source OR target user
        if (userId !== data.anonymousUid && userId !== data.targetUid) {
            logSecurityEvent("AUTHORIZATION_FAILURE", "migrateAnonymousUserData", "Unauthorized migration attempt",
                { userId, metadata: { anonymousUid: data.anonymousUid, targetUid: data.targetUid } });
            throw new HttpsError("permission-denied", "Cannot migrate data between other users' accounts");
        }

        // Verify anonymous user exists
        const db = admin.firestore();
        const anonymousUserDoc = await db.collection("users").doc(data.anonymousUid).get();

        if (!anonymousUserDoc.exists) {
            throw new HttpsError("not-found", "Anonymous user not found");
        }

        try {
            // Batch chunking to handle >500 operations (Firestore limit)
            const BATCH_LIMIT = 499; // Stay under 500 to be safe
            let batch = db.batch();
            let operationCount = 0;
            let totalDocs = 0;
            const batches: FirebaseFirestore.WriteBatch[] = [batch];

            // Helper function to add operation to batch with chunking
            const addToBatch = async (
                ref: FirebaseFirestore.DocumentReference,
                data: FirebaseFirestore.DocumentData,
                options?: FirebaseFirestore.SetOptions
            ) => {
                if (operationCount >= BATCH_LIMIT) {
                    // Current batch is full, create a new one
                    batch = db.batch();
                    batches.push(batch);
                    operationCount = 0;
                }
                batch.set(ref, data, options || {});
                operationCount++;
                totalDocs++;
            };

            // Migrate journal entries
            const journalSnapshot = await db.collection(`users/${data.anonymousUid}/journal`).get();
            for (const doc of journalSnapshot.docs) {
                const targetRef = db.doc(`users/${data.targetUid}/journal/${doc.id}`);
                await addToBatch(targetRef, doc.data(), { merge: true });
            }

            // Migrate daily logs
            const dailyLogsSnapshot = await db.collection(`users/${data.anonymousUid}/daily_logs`).get();
            for (const doc of dailyLogsSnapshot.docs) {
                const targetRef = db.doc(`users/${data.targetUid}/daily_logs/${doc.id}`);
                await addToBatch(targetRef, doc.data(), { merge: true });
            }

            // Migrate inventory entries
            const inventorySnapshot = await db.collection(`users/${data.anonymousUid}/inventoryEntries`).get();
            for (const doc of inventorySnapshot.docs) {
                const targetRef = db.doc(`users/${data.targetUid}/inventoryEntries/${doc.id}`);
                await addToBatch(targetRef, doc.data(), { merge: true });
            }

            // Merge user profile metadata with smart conflict resolution
            // STRATEGY: Prefer target account data (usually more accurate)
            // Only use anonymous data if target account lacks that field
            const anonymousProfile = anonymousUserDoc.data();
            if (anonymousProfile) {
                const targetProfileRef = db.doc(`users/${data.targetUid}`);

                // Fetch target profile to check for existing data
                const targetProfileDoc = await targetProfileRef.get();
                const targetProfile = targetProfileDoc.data();

                const mergeData: MigrationMergeData = {
                    // Always add migration metadata
                    migratedFrom: data.anonymousUid,
                    migratedAt: admin.firestore.FieldValue.serverTimestamp(),
                };

                // SMART MERGE: Only use anonymous data if target doesn't have it
                // This prevents overwriting important data like sobriety dates
                if (anonymousProfile.soberDate && !targetProfile?.soberDate) {
                    mergeData.soberDate = anonymousProfile.soberDate;
                }
                // Add other fields as needed in the future
                // if (anonymousProfile.someField && !targetProfile?.someField) {
                //     mergeData.someField = anonymousProfile.someField;
                // }

                await addToBatch(targetProfileRef, mergeData, { merge: true });
            }

            // Execute all batches sequentially with error tracking
            // Note: Not fully atomic across batches - if a later batch fails,
            // earlier batches cannot be rolled back (Firestore limitation).
            // We track partial success to provide detailed error information.
            let committedBatches = 0;
            try {
                for (let i = 0; i < batches.length; i++) {
                    await batches[i].commit();
                    committedBatches++;
                }
            } catch (batchError) {
                // Partial migration occurred - some batches succeeded, others failed
                logSecurityEvent("PARTIAL_MIGRATION_FAILURE", "migrateAnonymousUserData",
                    `Migration partially failed: ${committedBatches}/${batches.length} batches committed`,
                    {
                        metadata: {
                            anonymousUid: data.anonymousUid,
                            targetUid: data.targetUid,
                            totalBatches: batches.length,
                            successfulBatches: committedBatches,
                            failedAtBatch: committedBatches + 1,
                            error: String(batchError),
                        },
                        captureToSentry: true
                    }
                );

                // Throw with detailed information about partial success
                throw new HttpsError(
                    "internal",
                    `Migration partially completed: ${committedBatches}/${batches.length} batches succeeded. Some data may not have been transferred.`
                );
            }

            logSecurityEvent("DATA_MIGRATION_SUCCESS", "migrateAnonymousUserData",
                `Migrated ${totalDocs} documents successfully`,
                {
                    severity: "INFO",
                    metadata: {
                        anonymousUid: data.anonymousUid,
                        targetUid: data.targetUid,
                        journalEntries: journalSnapshot.size,
                        dailyLogs: dailyLogsSnapshot.size,
                        inventoryEntries: inventorySnapshot.size,
                    }
                }
            );

            return {
                success: true,
                migratedItems: {
                    journal: journalSnapshot.size,
                    dailyLogs: dailyLogsSnapshot.size,
                    inventory: inventorySnapshot.size,
                    total: totalDocs,
                },
            };
        } catch (error) {
            logSecurityEvent("DATA_MIGRATION_FAILURE", "migrateAnonymousUserData", "Migration failed",
                {
                    metadata: {
                        anonymousUid: data.anonymousUid,
                        targetUid: data.targetUid,
                        error: String(error)
                    },
                    captureToSentry: true
                });
            throw new HttpsError("internal", "Failed to migrate data. Please try again.");
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
    adminHealthCheck,
    adminGetDashboardStats,
    adminSearchUsers,
    adminGetUserDetail,
    adminUpdateUser,
    adminDisableUser,
    adminTriggerJob,
    adminGetJobsStatus,
    adminGetSentryErrorSummary,
} from "./admin";

// Export scheduled jobs
export { scheduledCleanupRateLimits } from "./jobs";
