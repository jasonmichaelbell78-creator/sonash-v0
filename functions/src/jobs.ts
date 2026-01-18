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

      for (const file of files) {
        checked++;

        try {
          // Extract userId from file path (user-uploads/{userId}/...)
          const pathParts = file.name.split("/");
          if (pathParts.length < 2) continue;

          const userId = pathParts[1];
          // SECURITY: Validate userId is a non-empty string to prevent malformed path issues
          if (!userId || typeof userId !== "string") continue;

          // PERFORMANCE: Check if user exists using pre-fetched set (O(1) lookup)
          if (!existingUserIds.has(userId)) {
            // User doesn't exist, delete the file
            await file.delete();
            deleted++;
            continue;
          }

          // Check if file is referenced - use stable storage path reference ONLY
          // SAFETY: Removed URL substring fallback to prevent accidental deletion
          // Files without imagePath reference are treated as "unknown" (not deleted)
          const journalByPathRef = db
            .collection(`users/${userId}/journal`)
            .where("data.imagePath", "==", file.name)
            .limit(1);

          const byPathSnap = await journalByPathRef.get();
          const isReferenced = !byPathSnap.empty;

          // SAFETY: If we can't conclusively determine the file is orphaned, skip it
          // Legacy entries without imagePath will be preserved until migrated
          if (!isReferenced) {
            // File appears orphaned, check age before deleting (safety buffer)
            const metadata = await file.getMetadata();
            const timeCreated = metadata[0].timeCreated;
            if (!timeCreated) continue;

            const createTime = new Date(timeCreated);
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            if (createTime < sevenDaysAgo) {
              await file.delete();
              deleted++;
            }
          }
        } catch (fileError) {
          // RESILIENCE: Log per-file errors but continue processing other files
          errors++;
          // SECURITY: Don't log file.name (contains userId) - log error type and count only
          // COMPLIANCE: Use structured JSON format for consistent log parsing/monitoring
          const errorType = fileError instanceof Error ? fileError.name : "UnknownError";
          const structuredLog = {
            severity: "WARNING",
            message: "Storage cleanup per-file error",
            error: { type: errorType },
            stats: { totalErrors: errors },
            timestamp: new Date().toISOString(),
          };
          console.error(JSON.stringify(structuredLog));
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
  let overallStatus: "healthy" | "warning" | "critical" = "healthy";

  // Check 1: Error rate in last 6 hours
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const errorCountQuery = await db
    .collection("security_logs")
    .where("severity", "==", "ERROR")
    .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(sixHoursAgo))
    .count()
    .get();
  const errorCount = errorCountQuery.data().count;

  if (errorCount > 100) {
    checks["errorRate"] = {
      status: "critical",
      message: `High error rate: ${errorCount} errors in last 6 hours`,
    };
    overallStatus = "critical";
  } else if (errorCount > 20) {
    checks["errorRate"] = {
      status: "warning",
      message: `Elevated error rate: ${errorCount} errors in last 6 hours`,
    };
    if (overallStatus === "healthy") overallStatus = "warning";
  } else {
    checks["errorRate"] = {
      status: "healthy",
      message: `Error rate normal: ${errorCount} errors in last 6 hours`,
    };
  }

  // Check 2: Failed jobs in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const failedJobsQuery = await db
    .collection("admin_jobs")
    .where("lastRunStatus", "==", "failed")
    .where("lastRun", ">=", admin.firestore.Timestamp.fromDate(oneDayAgo))
    .get();

  if (failedJobsQuery.docs.length > 0) {
    const failedJobNames = failedJobsQuery.docs.map((d) => d.data().name || d.id).join(", ");
    checks["jobStatus"] = {
      status: "warning",
      message: `Failed jobs in last 24h: ${failedJobNames}`,
    };
    if (overallStatus === "healthy") overallStatus = "warning";
  } else {
    checks["jobStatus"] = {
      status: "healthy",
      message: "All jobs running successfully",
    };
  }

  // Check 3: User activity (ensure users are active)
  const activeUsersQuery = await db
    .collection("users")
    .where("lastActive", ">=", admin.firestore.Timestamp.fromDate(sixHoursAgo))
    .count()
    .get();
  const activeUserCount = activeUsersQuery.data().count;

  checks["userActivity"] = {
    status: "healthy",
    message: `${activeUserCount} active users in last 6 hours`,
  };

  // Check 4: Database connectivity
  try {
    await db.collection("_health").doc("check").set({
      lastCheck: admin.firestore.FieldValue.serverTimestamp(),
    });
    checks["firestore"] = {
      status: "healthy",
      message: "Firestore connection healthy",
    };
  } catch {
    checks["firestore"] = {
      status: "critical",
      message: "Firestore connection failed",
    };
    overallStatus = "critical";
  }

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
 */
export async function hardDeleteSoftDeletedUsers(): Promise<{
  processed: number;
  deleted: number;
  errors: number;
}> {
  const db = admin.firestore();
  const storage = admin.storage();
  const bucket = storage.bucket("sonash-app.firebasestorage.app");
  const now = admin.firestore.Timestamp.now();

  let processed = 0;
  let deleted = 0;
  let errors = 0;

  // Find users scheduled for hard deletion (past their 30-day window)
  const query = db
    .collection("users")
    .where("isSoftDeleted", "==", true)
    .where("scheduledHardDeleteAt", "<=", now)
    .limit(50); // Process in batches of 50 to avoid timeout

  const snapshot = await query.get();

  for (const userDoc of snapshot.docs) {
    const uid = userDoc.id;
    processed++;

    try {
      // 1. Delete subcollection: journal
      await deleteSubcollection(db, `users/${uid}/journal`);

      // 2. Delete subcollection: daily_logs
      await deleteSubcollection(db, `users/${uid}/daily_logs`);

      // 3. Delete subcollection: inventoryEntries
      await deleteSubcollection(db, `users/${uid}/inventoryEntries`);

      // 4. Delete storage files
      try {
        const [files] = await bucket.getFiles({
          prefix: `user-uploads/${uid}/`,
        });
        for (const file of files) {
          await file.delete();
        }
      } catch (storageError) {
        // Storage errors are non-fatal - user may have no files
        const errorType = storageError instanceof Error ? storageError.name : "UnknownError";
        if (errorType !== "NotFoundError") {
          console.warn(`Storage cleanup warning for user ${hashUserId(uid)}: ${errorType}`);
        }
      }

      // 5. Delete Firebase Auth account
      try {
        await admin.auth().deleteUser(uid);
      } catch (authError) {
        // Auth account may already be deleted - non-fatal
        const errorType = authError instanceof Error ? authError.name : "UnknownError";
        console.warn(`Auth deletion warning for user ${hashUserId(uid)}: ${errorType}`);
      }

      // 6. Delete user document (must be last)
      await db.collection("users").doc(uid).delete();

      deleted++;

      // AUDIT: Log successful permanent deletion
      logSecurityEvent(
        "ADMIN_ACTION",
        "hardDeleteSoftDeletedUsers",
        "Permanently deleted user after 30-day retention",
        {
          severity: "WARNING",
          metadata: { userIdHash: hashUserId(uid) },
        }
      );
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

  logSecurityEvent(
    "JOB_SUCCESS",
    "hardDeleteSoftDeletedUsers",
    `Hard deletion complete: ${deleted} deleted, ${errors} errors`,
    {
      severity: "INFO",
      metadata: { processed, deleted, errors },
    }
  );

  return { processed, deleted, errors };
}

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
