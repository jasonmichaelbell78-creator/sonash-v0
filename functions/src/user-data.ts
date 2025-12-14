import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logSecurityEvent } from "./security-logger";

/**
 * User Data Management Cloud Functions
 * 
 * Provides GDPR-compliant data export and account deletion.
 * All operations are server-side for security.
 */

interface ExportResult {
    profile: admin.firestore.DocumentData | null;
    dailyLogs: admin.firestore.DocumentData[];
    exportedAt: string;
}

/**
 * Export all user data as JSON
 * 
 * GDPR Article 20 - Right to data portability
 */
export const exportUserData = onCall(
    {
        enforceAppCheck: true,
        cors: true,
    },
    async (request) => {
        // Verify authentication
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "You must be signed in to export data");
        }

        const userId = request.auth.uid;

        logSecurityEvent(
            "DATA_EXPORT_REQUESTED",
            "exportUserData",
            "User requested data export",
            { userId, severity: "INFO" }
        );

        try {
            const db = admin.firestore();

            // Get user profile
            const profileDoc = await db.collection("users").doc(userId).get();
            const profile = profileDoc.exists ? (profileDoc.data() ?? null) : null;

            // Get all daily logs
            const logsSnapshot = await db
                .collection("users")
                .doc(userId)
                .collection("daily_logs")
                .orderBy("id", "desc")
                .get();

            const dailyLogs = logsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            const exportData: ExportResult = {
                profile,
                dailyLogs,
                exportedAt: new Date().toISOString(),
            };

            logSecurityEvent(
                "DATA_EXPORT_SUCCESS",
                "exportUserData",
                `Exported ${dailyLogs.length} journal entries`,
                { userId, severity: "INFO" }
            );

            return {
                success: true,
                data: exportData,
            };
        } catch (error) {
            logSecurityEvent(
                "DATA_EXPORT_FAILURE",
                "exportUserData",
                "Failed to export user data",
                { userId, metadata: { error: String(error) }, captureToSentry: true }
            );

            throw new HttpsError("internal", "Failed to export data. Please try again.");
        }
    }
);

/**
 * Permanently delete all user data and account
 * 
 * GDPR Article 17 - Right to erasure
 */
export const deleteUserAccount = onCall(
    {
        enforceAppCheck: true,
        cors: true,
    },
    async (request) => {
        // Verify authentication
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "You must be signed in to delete your account");
        }

        const userId = request.auth.uid;
        const { confirmation } = request.data as { confirmation?: string };

        // Require explicit confirmation
        if (confirmation !== "DELETE") {
            throw new HttpsError(
                "failed-precondition",
                "You must type 'DELETE' to confirm account deletion"
            );
        }

        logSecurityEvent(
            "ACCOUNT_DELETE_REQUESTED",
            "deleteUserAccount",
            "User requested account deletion",
            { userId, severity: "WARNING" }
        );

        try {
            const db = admin.firestore();

            // Delete all daily logs
            const logsSnapshot = await db
                .collection("users")
                .doc(userId)
                .collection("daily_logs")
                .get();

            const batch = db.batch();
            logsSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Delete user profile
            batch.delete(db.collection("users").doc(userId));

            // Execute batch delete
            await batch.commit();

            // Delete Firebase Auth account
            await admin.auth().deleteUser(userId);

            logSecurityEvent(
                "ACCOUNT_DELETE_SUCCESS",
                "deleteUserAccount",
                `Deleted account with ${logsSnapshot.size} journal entries`,
                { userId, severity: "WARNING" }
            );

            return {
                success: true,
                message: "Your account and all data have been permanently deleted",
            };
        } catch (error) {
            logSecurityEvent(
                "ACCOUNT_DELETE_FAILURE",
                "deleteUserAccount",
                "Failed to delete user account",
                { userId, metadata: { error: String(error) }, captureToSentry: true }
            );

            throw new HttpsError("internal", "Failed to delete account. Please try again.");
        }
    }
);
