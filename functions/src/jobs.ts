/**
 * Background Jobs System
 *
 * Provides job wrapper for status tracking and scheduled job definitions
 *
 * Jobs:
 * - cleanupOldRateLimits: Daily cleanup of expired rate limit documents
 * - cleanupOldDailyLogs: Daily cleanup of old daily check-in documents (>30 days)
 * - cleanupOrphanedStorageFiles: Weekly cleanup of unreferenced storage files
 * - generateUsageAnalytics: Daily aggregation of usage statistics
 * - pruneSecurityEvents: Weekly archival of old security logs (>90 days)
 * - healthCheckNotifications: Periodic system health monitoring (every 6 hours)
 */

import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logSecurityEvent, hashUserId } from "./security-logger";
import type { File, Bucket } from "@google-cloud/storage";

// ============================================================================
// Helper Types
// ============================================================================

interface FileProcessResult {
  deleted: boolean;
  error: boolean;
}

interface HealthCheckResult {
  status: "healthy" | "warning" | "critical";
  message: string;
}

type OverallStatus = "healthy" | "warning" | "critical";

// ============================================================================
// Storage Cleanup Helpers
// ============================================================================

/**
 * Extracts and validates userId from a storage file path.
 * Expected format: user-uploads/{userId}/...
 * Returns null if path is invalid or userId is empty.
 * Review #193: Filter empty segments, check for .. anywhere in path
 */
function extractUserIdFromPath(filePath: string): string | null {
  // Filter empty segments to handle leading/trailing/repeated slashes
  const pathParts = filePath.split("/").filter(Boolean);
  if (pathParts.length < 2) return null;

  // Security: Reject path traversal attempts anywhere in the path
  if (pathParts.some((p) => p === "." || p === "..")) return null;

  if (pathParts[0] !== "user-uploads") return null;

  const userId = pathParts[1];
  if (!userId || typeof userId !== "string") return null;

  // Firebase Auth UIDs are typically >= 20 chars and use URL-safe characters
  // This prevents malformed IDs from being used in database queries
  if (!/^[A-Za-z0-9_-]{20,}$/.test(userId)) return null;

  return userId;
}

/**
 * Checks if a file is older than the specified age threshold.
 * Returns false if metadata is unavailable.
 */
async function isFileOlderThan(file: File, daysOld: number): Promise<boolean> {
  const metadata = await file.getMetadata();
  const timeCreated = metadata[0].timeCreated;
  if (!timeCreated) return false;

  const createTime = new Date(timeCreated);
  const threshold = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return createTime < threshold;
}

/**
 * Checks if a storage file is referenced by any journal entry.
 * Uses stable imagePath reference only (no URL substring fallback).
 */
async function isFileReferencedInJournal(
  file: File,
  userId: string,
  db: FirebaseFirestore.Firestore
): Promise<boolean> {
  // Use structured path to prevent path traversal vulnerabilities (Review #184 - Qodo security)
  const journalByPathRef = db
    .collection("users")
    .doc(userId)
    .collection("journal")
    .where("data.imagePath", "==", file.name)
    .limit(1);

  const snapshot = await journalByPathRef.get();
  return !snapshot.empty;
}

/**
 * Processes a single storage file for orphan cleanup.
 * Returns whether the file was deleted or encountered an error.
 */
async function processStorageFile(
  file: File,
  existingUserIds: Set<string>,
  db: FirebaseFirestore.Firestore,
  onError: () => void
): Promise<FileProcessResult> {
  try {
    const userId = extractUserIdFromPath(file.name);
    if (!userId) return { deleted: false, error: false };

    // User doesn't exist - delete immediately
    if (!existingUserIds.has(userId)) {
      await file.delete();
      return { deleted: true, error: false };
    }

    // Check if file is referenced in journal
    const isReferenced = await isFileReferencedInJournal(file, userId, db);
    if (isReferenced) return { deleted: false, error: false };

    // File appears orphaned - check age before deleting (7-day safety buffer)
    const isOldEnough = await isFileOlderThan(file, 7);
    if (isOldEnough) {
      await file.delete();
      return { deleted: true, error: false };
    }

    return { deleted: false, error: false };
  } catch (fileError) {
    onError();
    const errorType = fileError instanceof Error ? fileError.name : "UnknownError";
    const structuredLog = {
      severity: "WARNING",
      message: "Storage cleanup per-file error",
      error: { type: errorType },
      timestamp: new Date().toISOString(),
    };
    console.error(JSON.stringify(structuredLog));
    return { deleted: false, error: true };
  }
}

// ============================================================================
// User Deletion Helpers
// ============================================================================

/**
 * Helper: Delete all documents in a subcollection
 * Uses batched deletes for efficiency
 */
async function deleteSubcollection(
  db: admin.firestore.Firestore,
  collectionPath: string
): Promise<number> {
  let deleted = 0;
  let hasMore = true;

  while (hasMore) {
    const snapshot = await db.collection(collectionPath).limit(500).get();

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    deleted += snapshot.size;
    hasMore = snapshot.size === 500;
  }

  return deleted;
}

/**
 * Deletes all storage files for a user.
 * Non-fatal: logs warning on failure but doesn't throw.
 * Review #193: Implement pagination to delete ALL files, not just first page
 */
async function deleteUserStorageFiles(uid: string, bucket: Bucket): Promise<void> {
  try {
    let pageToken: string | undefined;

    // Review #195: Bounded parallelism to avoid timeouts on large user folders
    const DELETE_CONCURRENCY = 20;

    do {
      // Review #194: Use nextQuery (2nd element) for pageToken, not response (3rd element)
      const [files, nextQuery] = await bucket.getFiles({
        prefix: `user-uploads/${uid}/`,
        pageToken,
        autoPaginate: false,
      });

      // Review #195: Delete files in parallel batches instead of sequentially
      // Review #196: Log partial deletion failures for observability
      for (let i = 0; i < files.length; i += DELETE_CONCURRENCY) {
        const chunk = files.slice(i, i + DELETE_CONCURRENCY);
        const results = await Promise.allSettled(chunk.map((f) => f.delete()));

        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length > 0) {
          logSecurityEvent("JOB_WARNING", "hardDeleteSoftDeletedUsers", "Partial storage delete", {
            severity: "WARNING",
            metadata: {
              userIdHash: hashUserId(uid),
              failures: failures.length,
              errorTypes: failures
                .slice(0, 5)
                .map((f) =>
                  f.status === "rejected" && f.reason instanceof Error
                    ? f.reason.name
                    : "UnknownError"
                ),
              truncated: failures.length > 5,
            },
          });
        }
      }

      // Review #195: Guard against infinite loop if token doesn't advance
      // Review #196: Log when pagination stalls for debugging
      const nextPageToken = (nextQuery as { pageToken?: string } | undefined)?.pageToken;
      if (nextPageToken && nextPageToken === pageToken) {
        logSecurityEvent(
          "JOB_WARNING",
          "hardDeleteSoftDeletedUsers",
          "Storage pagination stalled",
          {
            severity: "WARNING",
            metadata: { userIdHash: hashUserId(uid) },
          }
        );
        break;
      }
      pageToken = nextPageToken;
    } while (pageToken);
  } catch (storageError) {
    const errorType = storageError instanceof Error ? storageError.name : "UnknownError";
    if (errorType !== "NotFoundError") {
      logSecurityEvent("JOB_WARNING", "hardDeleteSoftDeletedUsers", "Storage cleanup warning", {
        severity: "WARNING",
        metadata: { userIdHash: hashUserId(uid), errorType },
      });
    }
  }
}

/**
 * Deletes a Firebase Auth account.
 * Ignores "user-not-found" errors (user may have been deleted already).
 * Re-throws other errors to prevent orphaned auth accounts.
 */
async function deleteUserAuthAccount(uid: string): Promise<void> {
  try {
    await admin.auth().deleteUser(uid);
  } catch (authError) {
    const errorCode =
      typeof authError === "object" && authError !== null && "code" in authError
        ? String((authError as { code?: unknown }).code)
        : null;

    if (errorCode !== "auth/user-not-found") {
      throw authError;
    }
    logSecurityEvent("JOB_INFO", "hardDeleteSoftDeletedUsers", "Auth account already deleted", {
      severity: "INFO",
      metadata: { userIdHash: hashUserId(uid) },
    });
  }
}

/**
 * Performs complete hard deletion for a single user.
 * Deletes subcollections, storage files, auth account, and user document.
 * Note: deleteSubcollection is defined later in this file.
 */
async function performHardDeleteForUser(
  uid: string,
  db: FirebaseFirestore.Firestore,
  bucket: Bucket
): Promise<void> {
  // 1-3. Delete subcollections
  await deleteSubcollection(db, `users/${uid}/journal`);
  await deleteSubcollection(db, `users/${uid}/daily_logs`);
  await deleteSubcollection(db, `users/${uid}/inventoryEntries`);

  // 4. Delete storage files (non-fatal)
  await deleteUserStorageFiles(uid, bucket);

  // 5. Delete auth account (fatal if not "user-not-found")
  await deleteUserAuthAccount(uid);

  // 6. Delete user document (must be last)
  await db.collection("users").doc(uid).delete();

  logSecurityEvent(
    "ADMIN_ACTION",
    "hardDeleteSoftDeletedUsers",
    "Permanently deleted user after 30-day retention",
    { severity: "WARNING", metadata: { userIdHash: hashUserId(uid) } }
  );
}

/**
 * Job wrapper for status tracking
 * Uses set({ merge: true }) to handle first-run case when document doesn't exist
 * Includes nested error handling to preserve original errors
 */
export async function runJob(
  jobId: string,
  jobName: string,
  jobFn: () => Promise<void>
): Promise<void> {
  const db = admin.firestore();
  const jobRef = db.doc(`admin_jobs/${jobId}`);
  const startTime = Date.now();

  // Initialize job document (handles first-run case)
  await jobRef.set(
    {
      name: jobName,
      lastRunStatus: "running",
      lastRun: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  let jobError: unknown = null;

  try {
    // Execute the job
    await jobFn();

    const duration = Date.now() - startTime;

    // Update with success status
    await jobRef.set(
      {
        lastRunStatus: "success",
        lastRunDuration: duration,
        lastError: null,
        lastSuccessRun: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    logSecurityEvent("JOB_SUCCESS", jobId, `Job completed successfully in ${duration}ms`, {
      severity: "INFO",
      metadata: { duration, jobName },
    });
  } catch (error) {
    jobError = error; // Capture the original error
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Nested try/catch to prevent losing original error
    try {
      await jobRef.set(
        {
          lastRunStatus: "failed",
          lastRunDuration: duration,
          lastError: errorMessage,
        },
        { merge: true }
      );
    } catch (updateError) {
      console.error(`Failed to update job status for ${jobId}`, updateError);
    }

    logSecurityEvent("JOB_FAILURE", jobId, `Job failed: ${errorMessage}`, {
      severity: "ERROR",
      metadata: { duration, jobName, error: errorMessage },
      captureToSentry: true,
    });

    // Re-throw the original error
    throw jobError;
  }
}

/**
 * Scheduled Job: Cleanup Old Rate Limits
 * Runs daily at 3 AM Central Time (9 AM UTC)
 * Removes rate limit documents older than their TTL
 */
export const scheduledCleanupRateLimits = onSchedule(
  {
    schedule: "0 9 * * *", // 9 AM UTC = 3 AM CT
    timeZone: "UTC",
    retryCount: 3,
  },
  async () => {
    await runJob("cleanupOldRateLimits", "Cleanup Rate Limits", async () => {
      await cleanupOldRateLimits();
    });
  }
);

/**
 * A10: Cleanup Old Daily Check-in Logs
 * Removes old daily check-in documents (>30 days old) from users/{uid}/daily_logs
 * Schedule: Daily at 4 AM CT (10 AM UTC)
 * Uses collectionGroup query for efficient cross-user cleanup
 */
export async function cleanupOldDailyLogs(): Promise<{ deleted: number }> {
  const db = admin.firestore();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgoTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

  let deleted = 0;
  let hasMore = true;

  // Use collectionGroup query to find all old daily_logs across all users
  // This avoids the N+1 pattern of iterating through each user
  // STABILITY: Added orderBy for deterministic pagination
  while (hasMore) {
    const oldLogsQuery = db
      .collectionGroup("daily_logs")
      .where("updatedAt", "<", thirtyDaysAgoTimestamp)
      .orderBy("updatedAt", "asc")
      .limit(500); // Process in batches of 500

    const snapshot = await oldLogsQuery.get();

    if (snapshot.empty) {
      hasMore = false;
      continue;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    deleted += snapshot.size;
    hasMore = snapshot.size === 500; // Continue if we processed a full batch
  }

  logSecurityEvent(
    "JOB_SUCCESS",
    "cleanupOldDailyLogs",
    `Cleaned up ${deleted} old daily check-in docs`,
    {
      severity: "INFO",
      metadata: { deleted },
    }
  );

  return { deleted };
}

// Backward-compatible export alias for existing scheduled job references
export const cleanupOldSessions = cleanupOldDailyLogs;

export const scheduledCleanupOldDailyLogs = onSchedule(
  {
    schedule: "0 10 * * *", // 10 AM UTC = 4 AM CT
    timeZone: "UTC",
    retryCount: 3,
  },
  async () => {
    await runJob("cleanupOldDailyLogs", "Cleanup Old Daily Logs", async () => {
      await cleanupOldDailyLogs();
    });
  }
);

// Backward-compatible export for existing admin triggers
export const scheduledCleanupOldSessions = scheduledCleanupOldDailyLogs;

/**
 * A11: Cleanup Orphaned Storage Files
 * Removes Storage files not referenced by Firestore documents
 * Schedule: Weekly on Sundays at 2 AM CT (8 AM UTC)
 * PERFORMANCE: Pre-fetches user IDs using listDocuments() (no document reads)
 * SAFETY: Only deletes files with exact path match (no URL substring fallback)
 * RESILIENCE: Per-item error handling - single file failures don't abort the job
 *
 * SECURITY NOTE: This job assumes Storage rules enforce user-uploads/{userId}/ prefixes.
 * Verify Storage ACLs restrict writes to user's own prefix before relying on this cleanup.
 */
export async function cleanupOrphanedStorageFiles(): Promise<{
  checked: number;
  deleted: number;
  errors: number;
}> {
  const storage = admin.storage();
  const db = admin.firestore();
  // FIREBASE: Explicitly specify bucket - default bucket() uses appspot.com not firebasestorage.app
  const bucket = storage.bucket("sonash-app.firebasestorage.app");

  let checked = 0;
  let deleted = 0;
  let errors = 0;

  try {
    // PERFORMANCE: Use listDocuments() to get only IDs without reading document data
    const userRefs = await db.collection("users").listDocuments();
    const existingUserIds = new Set(userRefs.map((ref) => ref.id));

    // SCALABILITY: Paginate storage listing to prevent OOM on large file sets
    let pageToken: string | undefined;
    let prevPageToken: string | undefined;

    do {
      const [files, nextQuery] = await bucket.getFiles({
        prefix: "user-uploads/",
        maxResults: 500,
        pageToken,
      });

      // Review #195: Process files concurrently in batches to prevent timeouts
      const PROCESS_CONCURRENCY = 10;

      for (let i = 0; i < files.length; i += PROCESS_CONCURRENCY) {
        const chunk = files.slice(i, i + PROCESS_CONCURRENCY);
        checked += chunk.length;

        const chunkResults = await Promise.all(
          chunk.map((file) =>
            processStorageFile(file, existingUserIds, db, () => {
              errors++;
            })
          )
        );

        for (const r of chunkResults) {
          if (r.deleted) deleted++;
        }
      }

      // SAFETY: Prevent infinite loop if pageToken doesn't change
      prevPageToken = pageToken;
      pageToken = nextQuery?.pageToken;
      if (pageToken && pageToken === prevPageToken) break;
    } while (pageToken);

    logSecurityEvent(
      "JOB_SUCCESS",
      "cleanupOrphanedStorageFiles",
      `Checked ${checked} files, deleted ${deleted} orphaned, ${errors} errors`,
      { severity: "INFO", metadata: { checked, deleted, errors } }
    );
  } catch (error) {
    logSecurityEvent(
      "JOB_FAILURE",
      "cleanupOrphanedStorageFiles",
      `Error cleaning storage: ${error}`,
      { severity: "ERROR", metadata: { error: String(error) }, captureToSentry: true }
    );
    throw error;
  }

  return { checked, deleted, errors };
}

export const scheduledCleanupOrphanedStorageFiles = onSchedule(
  {
    schedule: "0 8 * * 0", // 8 AM UTC on Sundays = 2 AM CT
    timeZone: "UTC",
    retryCount: 2,
  },
  async () => {
    await runJob("cleanupOrphanedStorageFiles", "Cleanup Orphaned Storage Files", async () => {
      await cleanupOrphanedStorageFiles();
    });
  }
);

/**
 * A12: Generate Usage Analytics
 * Aggregates daily stats: active users, API calls, errors
 * Schedule: Daily at 1 AM CT (7 AM UTC)
 * Uses Promise.all for parallel query execution
 */
export async function generateUsageAnalytics(): Promise<{
  date: string;
  activeUsers: number;
  newUsers: number;
  journalEntries: number;
  checkIns: number;
}> {
  const db = admin.firestore();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dateId = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD
  const yesterdayTimestamp = admin.firestore.Timestamp.fromDate(yesterday);

  // Run all count queries in parallel for better performance
  const [activeUsersQuery, newUsersQuery, journalEntriesQuery, checkInsQuery] = await Promise.all([
    // Count active users (users with lastActive in last 24 hours)
    db.collection("users").where("lastActive", ">=", yesterdayTimestamp).count().get(),

    // Count new users (created in last 24 hours)
    db.collection("users").where("createdAt", ">=", yesterdayTimestamp).count().get(),

    // Count journal entries created (estimated from security logs)
    db
      .collection("security_logs")
      .where("type", "==", "SAVE_SUCCESS")
      .where("functionName", "==", "saveJournalEntry")
      .where("timestamp", ">=", yesterdayTimestamp)
      .count()
      .get(),

    // Count check-ins
    db
      .collection("security_logs")
      .where("type", "==", "SAVE_SUCCESS")
      .where("functionName", "==", "saveDailyLog")
      .where("timestamp", ">=", yesterdayTimestamp)
      .count()
      .get(),
  ]);

  const activeUsers = activeUsersQuery.data().count;
  const newUsers = newUsersQuery.data().count;
  const journalEntries = journalEntriesQuery.data().count;
  const checkIns = checkInsQuery.data().count;

  // Store analytics
  await db.collection("analytics_daily").doc(dateId).set({
    date: dateId,
    activeUsers,
    newUsers,
    journalEntries,
    checkIns,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logSecurityEvent("JOB_SUCCESS", "generateUsageAnalytics", `Generated analytics for ${dateId}`, {
    severity: "INFO",
    metadata: { dateId, activeUsers, newUsers, journalEntries, checkIns },
  });

  return { date: dateId, activeUsers, newUsers, journalEntries, checkIns };
}

export const scheduledGenerateUsageAnalytics = onSchedule(
  {
    schedule: "0 7 * * *", // 7 AM UTC = 1 AM CT
    timeZone: "UTC",
    retryCount: 3,
  },
  async () => {
    await runJob("generateUsageAnalytics", "Generate Usage Analytics", async () => {
      await generateUsageAnalytics();
    });
  }
);

/**
 * A13: Prune Security Events
 * Archives/deletes security audit logs older than 90 days
 * Schedule: Weekly on Sundays at 3 AM CT (9 AM UTC)
 */
export async function pruneSecurityEvents(): Promise<{ deleted: number }> {
  const db = admin.firestore();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  let deleted = 0;
  let hasMore = true;

  while (hasMore) {
    // STABILITY: Added orderBy for deterministic batching
    const oldLogsQuery = db
      .collection("security_logs")
      .where("timestamp", "<", admin.firestore.Timestamp.fromDate(ninetyDaysAgo))
      .orderBy("timestamp", "asc")
      .limit(500);

    const snapshot = await oldLogsQuery.get();

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = db.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    deleted += snapshot.docs.length;

    // Continue if we got a full batch
    hasMore = snapshot.docs.length === 500;
  }

  logSecurityEvent(
    "JOB_SUCCESS",
    "pruneSecurityEvents",
    `Pruned ${deleted} security events older than 90 days`,
    { severity: "INFO", metadata: { deleted } }
  );

  return { deleted };
}

export const scheduledPruneSecurityEvents = onSchedule(
  {
    schedule: "0 9 * * 0", // 9 AM UTC on Sundays = 3 AM CT
    timeZone: "UTC",
    retryCount: 2,
  },
  async () => {
    await runJob("pruneSecurityEvents", "Prune Security Events", async () => {
      await pruneSecurityEvents();
    });
  }
);

// ============================================================================
// Health Check Helpers
// ============================================================================

/**
 * Updates overall status to the more severe level
 */
function updateOverallStatus(current: OverallStatus, checkStatus: OverallStatus): OverallStatus {
  if (checkStatus === "critical") return "critical";
  if (checkStatus === "warning" && current === "healthy") return "warning";
  return current;
}

/**
 * Check error rate in last 6 hours
 */
async function checkErrorRateHealth(
  db: FirebaseFirestore.Firestore,
  sixHoursAgo: Date
): Promise<HealthCheckResult> {
  const errorCountQuery = await db
    .collection("security_logs")
    .where("severity", "==", "ERROR")
    .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(sixHoursAgo))
    .count()
    .get();
  const errorCount = errorCountQuery.data().count;

  if (errorCount > 100) {
    return {
      status: "critical",
      message: `High error rate: ${errorCount} errors in last 6 hours`,
    };
  }
  if (errorCount > 20) {
    return {
      status: "warning",
      message: `Elevated error rate: ${errorCount} errors in last 6 hours`,
    };
  }
  return {
    status: "healthy",
    message: `Error rate normal: ${errorCount} errors in last 6 hours`,
  };
}

/**
 * Check for failed jobs in last 24 hours
 */
async function checkJobStatusHealth(
  db: FirebaseFirestore.Firestore,
  oneDayAgo: Date
): Promise<HealthCheckResult> {
  const failedJobsQuery = await db
    .collection("admin_jobs")
    .where("lastRunStatus", "==", "failed")
    .where("lastRun", ">=", admin.firestore.Timestamp.fromDate(oneDayAgo))
    .get();

  if (failedJobsQuery.docs.length > 0) {
    const failedJobNames = failedJobsQuery.docs.map((d) => d.data().name || d.id).join(", ");
    return {
      status: "warning",
      message: `Failed jobs in last 24h: ${failedJobNames}`,
    };
  }
  return {
    status: "healthy",
    message: "All jobs running successfully",
  };
}

/**
 * Check user activity in last 6 hours
 */
async function checkUserActivityHealth(
  db: FirebaseFirestore.Firestore,
  sixHoursAgo: Date
): Promise<HealthCheckResult> {
  const activeUsersQuery = await db
    .collection("users")
    .where("lastActive", ">=", admin.firestore.Timestamp.fromDate(sixHoursAgo))
    .count()
    .get();
  const activeUserCount = activeUsersQuery.data().count;

  return {
    status: "healthy",
    message: `${activeUserCount} active users in last 6 hours`,
  };
}

/**
 * Check Firestore connectivity
 */
async function checkFirestoreHealth(db: FirebaseFirestore.Firestore): Promise<HealthCheckResult> {
  try {
    await db.collection("_health").doc("check").set({
      lastCheck: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
      status: "healthy",
      message: "Firestore connection healthy",
    };
  } catch {
    return {
      status: "critical",
      message: "Firestore connection failed",
    };
  }
}

/**
 * A14: Health Check Notifications
 * Monitors system health: Firebase quotas, error rates, job status
 * Schedule: Every 6 hours
 */
export async function healthCheckNotifications(): Promise<{
  status: "healthy" | "warning" | "critical";
  checks: Record<string, { status: string; message: string }>;
}> {
  const db = admin.firestore();
  const checks: Record<string, { status: string; message: string }> = {};
  let overallStatus: OverallStatus = "healthy";

  // Time thresholds
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Run all health checks using extracted helpers
  const errorRateResult = await checkErrorRateHealth(db, sixHoursAgo);
  checks["errorRate"] = errorRateResult;
  overallStatus = updateOverallStatus(overallStatus, errorRateResult.status);

  const jobStatusResult = await checkJobStatusHealth(db, oneDayAgo);
  checks["jobStatus"] = jobStatusResult;
  overallStatus = updateOverallStatus(overallStatus, jobStatusResult.status);

  const userActivityResult = await checkUserActivityHealth(db, sixHoursAgo);
  checks["userActivity"] = userActivityResult;
  overallStatus = updateOverallStatus(overallStatus, userActivityResult.status);

  const firestoreResult = await checkFirestoreHealth(db);
  checks["firestore"] = firestoreResult;
  overallStatus = updateOverallStatus(overallStatus, firestoreResult.status);

  // Store health check result
  await db.collection("system").doc("health").set({
    lastCheck: admin.firestore.FieldValue.serverTimestamp(),
    status: overallStatus,
    checks,
  });

  // Log result
  const severityMap = { healthy: "INFO", warning: "WARNING", critical: "ERROR" } as const;
  logSecurityEvent(
    overallStatus === "critical" ? "JOB_FAILURE" : "JOB_SUCCESS",
    "healthCheckNotifications",
    `Health check completed: ${overallStatus}`,
    {
      severity: severityMap[overallStatus],
      metadata: { status: overallStatus, checks },
      captureToSentry: overallStatus === "critical",
    }
  );

  return { status: overallStatus, checks };
}

export const scheduledHealthCheckNotifications = onSchedule(
  {
    schedule: "0 */6 * * *", // Every 6 hours
    timeZone: "UTC",
    retryCount: 3,
  },
  async () => {
    await runJob("healthCheckNotifications", "Health Check Notifications", async () => {
      await healthCheckNotifications();
    });
  }
);

/**
 * Cleanup Old Rate Limits
 * Reimplemented here to avoid circular dependency
 * Loops until all expired documents are deleted
 */
async function cleanupOldRateLimits(): Promise<{ deleted: number }> {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.fromDate(new Date());

  let deleted = 0;
  let hasMore = true;

  while (hasMore) {
    const snapshot = await db
      .collection("rate_limits")
      .where("expiresAt", "<", now)
      .limit(500)
      .get();

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    deleted += snapshot.size;
    hasMore = snapshot.size === 500; // Continue if we got a full batch
  }

  return { deleted };
}

/**
 * Hard Delete Soft-Deleted Users
 * Permanently deletes users whose 30-day retention period has expired
 * Schedule: Daily at 5 AM UTC
 *
 * Deletion order (to handle foreign key-like dependencies):
 * 1. Delete subcollection: users/{uid}/journal
 * 2. Delete subcollection: users/{uid}/daily_logs
 * 3. Delete subcollection: users/{uid}/inventoryEntries
 * 4. Delete storage files: user-uploads/{uid}/*
 * 5. Delete Firebase Auth account
 * 6. Delete user document: users/{uid}
 *
 * SAFETY: Each user deletion is wrapped in try/catch to prevent single failures from aborting the job
 * AUDIT: Logs security event for each deleted user (with hashed UID)
 * COMPLETENESS: Processes in batches until all eligible users are deleted (not just first 50)
 */
export async function hardDeleteSoftDeletedUsers(): Promise<{
  processed: number;
  deleted: number;
  errors: number;
}> {
  const db = admin.firestore();
  const bucket = admin.storage().bucket();
  const now = admin.firestore.Timestamp.now();

  let processed = 0;
  let deleted = 0;
  let errors = 0;

  // COMPLETENESS: Process in batches with cursor-based pagination
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  while (true) {
    // Find users scheduled for hard deletion (past their 30-day window)
    let query = db
      .collection("users")
      .where("isSoftDeleted", "==", true)
      .where("scheduledHardDeleteAt", "<=", now)
      .orderBy("scheduledHardDeleteAt", "asc")
      .limit(50);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) break;

    // Process each user using extracted helper
    for (const userDoc of snapshot.docs) {
      const uid = userDoc.id;
      processed++;

      try {
        await performHardDeleteForUser(uid, db, bucket);
        deleted++;
      } catch (error) {
        errors++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logSecurityEvent(
          "JOB_FAILURE",
          "hardDeleteSoftDeletedUsers",
          `Failed to permanently delete user: ${errorMessage}`,
          {
            severity: "ERROR",
            metadata: { userIdHash: hashUserId(uid), error: errorMessage },
            captureToSentry: true,
          }
        );
      }
    }

    // CURSOR PAGINATION: Update cursor for next batch
    lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
    if (snapshot.size < 50) break;
  }

  logSecurityEvent(
    "JOB_SUCCESS",
    "hardDeleteSoftDeletedUsers",
    `Hard deletion complete: ${deleted} deleted, ${errors} errors`,
    { severity: "INFO", metadata: { processed, deleted, errors } }
  );

  return { processed, deleted, errors };
}

export const scheduledHardDeleteSoftDeletedUsers = onSchedule(
  {
    schedule: "0 5 * * *", // 5 AM UTC daily
    timeZone: "UTC",
    retryCount: 3,
    timeoutSeconds: 540, // 9 minutes (job may process many users)
  },
  async () => {
    await runJob("hardDeleteSoftDeletedUsers", "Hard Delete Soft-Deleted Users", async () => {
      await hardDeleteSoftDeletedUsers();
    });
  }
);
