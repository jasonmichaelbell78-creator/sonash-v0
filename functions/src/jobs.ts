/**
 * Background Jobs System
 *
 * Provides job wrapper for status tracking and scheduled job definitions
 */

import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logSecurityEvent } from "./security-logger";
import { cleanupOldRateLimits as cleanupRateLimitsCore } from "./firestore-rate-limiter";

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

        logSecurityEvent(
            "JOB_SUCCESS",
            jobId,
            `Job completed successfully in ${duration}ms`,
            { severity: "INFO", metadata: { duration, jobName } }
        );
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

        logSecurityEvent(
            "JOB_FAILURE",
            jobId,
            `Job failed: ${errorMessage}`,
            {
                severity: "ERROR",
                metadata: { duration, jobName, error: errorMessage },
                captureToSentry: true
            }
        );

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
        await runJob(
            "cleanupOldRateLimits",
            "Cleanup Rate Limits",
            async () => {
                await cleanupRateLimitsCore();
            }
        );
    }
);
