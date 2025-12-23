/**
 * Admin Cloud Functions
 *
 * Server-side admin operations with proper authorization
 * Prevents client-side manipulation and bypassing security rules
 */

import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { z } from "zod";
import { logSecurityEvent } from "./security-logger";

// Validation schemas
const MeetingSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(200),
    type: z.enum(["AA", "NA", "CA", "Smart", "Al-Anon"]),
    day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
    time: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
    address: z.string().min(1).max(500),
    neighborhood: z.string().min(1).max(100),
    coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }).optional(),
});

const SoberLivingSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(200),
    address: z.string().min(1).max(500),
    neighborhood: z.string().min(1).max(100),
    phone: z.string().max(20).optional(),
    gender: z.enum(["Men", "Women", "Both"]).optional(),
    coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }).optional(),
});

const QuoteSchema = z.object({
    id: z.string().optional(),
    text: z.string().min(1).max(1000),
    author: z.string().max(200).optional(),
    type: z.string().max(100).optional(),
});

// Request data types
type MeetingData = z.infer<typeof MeetingSchema>;
type SoberLivingData = z.infer<typeof SoberLivingSchema>;
type QuoteData = z.infer<typeof QuoteSchema>;

interface SaveMeetingRequest {
    meeting: MeetingData;
}

interface DeleteMeetingRequest {
    meetingId: string;
}

interface SaveSoberLivingRequest {
    home: SoberLivingData;
}

interface DeleteSoberLivingRequest {
    homeId: string;
}

interface SaveQuoteRequest {
    quote: QuoteData;
}

interface DeleteQuoteRequest {
    quoteId: string;
}

/**
 * Helper: Verify user has admin claim
 */
function requireAdmin(request: CallableRequest) {
    if (!request.auth) {
        logSecurityEvent(
            "AUTH_FAILURE",
            "admin_operation",
            "Unauthenticated admin request attempted"
        );
        throw new HttpsError("unauthenticated", "Authentication required");
    }

    if (request.auth.token.admin !== true) {
        logSecurityEvent(
            "AUTHORIZATION_FAILURE",
            "admin_operation",
            "Non-admin user attempted admin operation",
            { userId: request.auth.uid }
        );
        throw new HttpsError("permission-denied", "Admin privileges required");
    }
}

/**
 * Admin: Save Meeting
 */
export const adminSaveMeeting = onCall<SaveMeetingRequest>(
    async (request) => {
        requireAdmin(request);

        // Validate input
        let validated;
        try {
            validated = MeetingSchema.parse(request.data.meeting);
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new HttpsError(
                    "invalid-argument",
                    "Validation failed: " + error.issues.map((e) => e.message).join(", ")
                );
            }
            throw error;
        }

        // Generate ID if not provided
        const id = validated.id || `meeting_${Date.now()}`;

        // Save to Firestore
        try {
            await admin.firestore()
                .collection("meetings")
                .doc(id)
                .set({
                    id,
                    ...validated,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

            logSecurityEvent(
                "ADMIN_ACTION",
                "adminSaveMeeting",
                "Meeting saved by admin",
                { userId: request.auth?.uid, severity: "INFO", metadata: { meetingId: id } }
            );

            return { success: true, id };
        } catch (error) {
            logSecurityEvent(
                "ADMIN_ERROR",
                "adminSaveMeeting",
                "Failed to save meeting",
                { userId: request.auth?.uid, metadata: { error: String(error) }, captureToSentry: true }
            );
            throw new HttpsError("internal", "Failed to save meeting");
        }
    }
);

/**
 * Admin: Delete Meeting
 */
export const adminDeleteMeeting = onCall<DeleteMeetingRequest>(
    async (request) => {
        requireAdmin(request);

        const { meetingId } = request.data;

        if (!meetingId) {
            throw new HttpsError("invalid-argument", "Meeting ID required");
        }

        try {
            await admin.firestore()
                .collection("meetings")
                .doc(meetingId)
                .delete();

            logSecurityEvent(
                "ADMIN_ACTION",
                "adminDeleteMeeting",
                "Meeting deleted by admin",
                { userId: request.auth?.uid, severity: "INFO", metadata: { meetingId } }
            );

            return { success: true };
        } catch (error) {
            logSecurityEvent(
                "ADMIN_ERROR",
                "adminDeleteMeeting",
                "Failed to delete meeting",
                { userId: request.auth?.uid, metadata: { meetingId, error: String(error) }, captureToSentry: true }
            );
            throw new HttpsError("internal", "Failed to delete meeting");
        }
    }
);

/**
 * Admin: Save Sober Living Home
 */
export const adminSaveSoberLiving = onCall<SaveSoberLivingRequest>(
    async (request) => {
        requireAdmin(request);

        // Validate input
        let validated;
        try {
            validated = SoberLivingSchema.parse(request.data.home);
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new HttpsError(
                    "invalid-argument",
                    "Validation failed: " + error.issues.map((e) => e.message).join(", ")
                );
            }
            throw error;
        }

        // Generate ID if not provided
        const id = validated.id || `home_${Date.now()}`;

        try {
            await admin.firestore()
                .collection("sober_living")
                .doc(id)
                .set({
                    id,
                    ...validated,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

            logSecurityEvent(
                "ADMIN_ACTION",
                "adminSaveSoberLiving",
                "Sober living home saved by admin",
                { userId: request.auth?.uid, severity: "INFO", metadata: { homeId: id } }
            );

            return { success: true, id };
        } catch (error) {
            logSecurityEvent(
                "ADMIN_ERROR",
                "adminSaveSoberLiving",
                "Failed to save sober living home",
                { userId: request.auth?.uid, metadata: { error: String(error) }, captureToSentry: true }
            );
            throw new HttpsError("internal", "Failed to save sober living home");
        }
    }
);

/**
 * Admin: Delete Sober Living Home
 */
export const adminDeleteSoberLiving = onCall<DeleteSoberLivingRequest>(
    async (request) => {
        requireAdmin(request);

        const { homeId } = request.data;

        if (!homeId) {
            throw new HttpsError("invalid-argument", "Home ID required");
        }

        try {
            await admin.firestore()
                .collection("sober_living")
                .doc(homeId)
                .delete();

            logSecurityEvent(
                "ADMIN_ACTION",
                "adminDeleteSoberLiving",
                "Sober living home deleted by admin",
                { userId: request.auth?.uid, severity: "INFO", metadata: { homeId } }
            );

            return { success: true };
        } catch (error) {
            logSecurityEvent(
                "ADMIN_ERROR",
                "adminDeleteSoberLiving",
                "Failed to delete sober living home",
                { userId: request.auth?.uid, metadata: { homeId, error: String(error) }, captureToSentry: true }
            );
            throw new HttpsError("internal", "Failed to delete sober living home");
        }
    }
);

/**
 * Admin: Save Quote
 */
export const adminSaveQuote = onCall<SaveQuoteRequest>(
    async (request) => {
        requireAdmin(request);

        // Validate input
        let validated;
        try {
            validated = QuoteSchema.parse(request.data.quote);
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new HttpsError(
                    "invalid-argument",
                    "Validation failed: " + error.issues.map((e) => e.message).join(", ")
                );
            }
            throw error;
        }

        // Generate ID if not provided
        const id = validated.id || `quote_${Date.now()}`;

        try {
            await admin.firestore()
                .collection("daily_quotes")
                .doc(id)
                .set({
                    id,
                    ...validated,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

            logSecurityEvent(
                "ADMIN_ACTION",
                "adminSaveQuote",
                "Quote saved by admin",
                { userId: request.auth?.uid, severity: "INFO", metadata: { quoteId: id } }
            );

            return { success: true, id };
        } catch (error) {
            logSecurityEvent(
                "ADMIN_ERROR",
                "adminSaveQuote",
                "Failed to save quote",
                { userId: request.auth?.uid, metadata: { error: String(error) }, captureToSentry: true }
            );
            throw new HttpsError("internal", "Failed to save quote");
        }
    }
);

/**
 * Admin: Delete Quote
 */
export const adminDeleteQuote = onCall<DeleteQuoteRequest>(
    async (request) => {
        requireAdmin(request);

        const { quoteId } = request.data;

        if (!quoteId) {
            throw new HttpsError("invalid-argument", "Quote ID required");
        }

        try {
            await admin.firestore()
                .collection("daily_quotes")
                .doc(quoteId)
                .delete();

            logSecurityEvent(
                "ADMIN_ACTION",
                "adminDeleteQuote",
                "Quote deleted by admin",
                { userId: request.auth?.uid, severity: "INFO", metadata: { quoteId } }
            );

            return { success: true };
        } catch (error) {
            logSecurityEvent(
                "ADMIN_ERROR",
                "adminDeleteQuote",
                "Failed to delete quote",
                { userId: request.auth?.uid, metadata: { quoteId, error: String(error) }, captureToSentry: true }
            );
            throw new HttpsError("internal", "Failed to delete quote");
        }
    }
);

/**
 * Admin: Health Check
 * Tests connectivity to core Firebase services
 */
export const adminHealthCheck = onCall(
    {
        enforceAppCheck: true,
        consumeAppCheckToken: true,
    },
    async (request) => {
        requireAdmin(request);

        const health = {
            firestore: false,
            auth: false,
            timestamp: new Date().toISOString(),
        };

        // Test Firestore connectivity
        try {
            await admin.firestore()
                .collection("_health")
                .doc("ping")
                .set({ lastCheck: admin.firestore.FieldValue.serverTimestamp() });
            health.firestore = true;
        } catch (error) {
            logSecurityEvent(
                "HEALTH_CHECK_FAILURE",
                "adminHealthCheck",
                "Firestore health check failed",
                { userId: request.auth?.uid, metadata: { error: String(error) } }
            );
        }

        // Test Auth connectivity
        try {
            await admin.auth().getUser(request.auth?.uid || "");
            health.auth = true;
        } catch (error) {
            // This is expected to fail if UID is invalid, but it tests connectivity
            if (request.auth?.uid) {
                try {
                    await admin.auth().getUser(request.auth.uid);
                    health.auth = true;
                } catch {
                    // Auth service is down
                    logSecurityEvent(
                        "HEALTH_CHECK_FAILURE",
                        "adminHealthCheck",
                        "Auth health check failed",
                        { userId: request.auth?.uid, metadata: { error: String(error) } }
                    );
                }
            }
        }

        return health;
    }
);

/**
 * Admin: Get Dashboard Stats
 * Returns system metrics for the admin dashboard
 */
export const adminGetDashboardStats = onCall(
    {
        enforceAppCheck: true,
        consumeAppCheckToken: true,
    },
    async (request) => {
        requireAdmin(request);

        try {
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Get total users count
            const usersSnapshot = await admin.firestore()
                .collection("users")
                .count()
                .get();
            const totalUsers = usersSnapshot.data().count;

            // Get active users by lastActive timestamp
            const activeUsers24h = await admin.firestore()
                .collection("users")
                .where("lastActive", ">=", admin.firestore.Timestamp.fromDate(yesterday))
                .count()
                .get();

            const activeUsers7d = await admin.firestore()
                .collection("users")
                .where("lastActive", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
                .count()
                .get();

            const activeUsers30d = await admin.firestore()
                .collection("users")
                .where("lastActive", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
                .count()
                .get();

            // Get recent signups (last 10)
            const recentSignupsSnapshot = await admin.firestore()
                .collection("users")
                .orderBy("createdAt", "desc")
                .limit(10)
                .get();

            const recentSignups = recentSignupsSnapshot.docs.map(doc => ({
                id: doc.id,
                nickname: doc.data().nickname || "Anonymous",
                createdAt: doc.data().createdAt?.toDate().toISOString() || null,
                authProvider: doc.data().authProvider || "unknown",
            }));

            // Get recent logs (last 10 from admin_logs if it exists)
            let recentLogs: Array<{ id: string; event: string; level: string; timestamp: string; details: string }> = [];
            try {
                const logsSnapshot = await admin.firestore()
                    .collection("admin_logs")
                    .orderBy("timestamp", "desc")
                    .limit(10)
                    .get();

                recentLogs = logsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    event: doc.data().event || "",
                    level: doc.data().level || "info",
                    timestamp: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString(),
                    details: doc.data().details || "",
                }));
            } catch {
                // admin_logs collection doesn't exist yet - that's okay
            }

            // Get background jobs status (if admin_jobs exists)
            let jobStatuses: Array<{ id: string; name: string; lastRunStatus: string; lastRun: string | null }> = [];
            try {
                const jobsSnapshot = await admin.firestore()
                    .collection("admin_jobs")
                    .get();

                jobStatuses = jobsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name || doc.id,
                    lastRunStatus: doc.data().lastRunStatus || "unknown",
                    lastRun: doc.data().lastRun?.toDate().toISOString() || null,
                }));
            } catch {
                // admin_jobs collection doesn't exist yet - that's okay
            }

            return {
                activeUsers: {
                    last24h: activeUsers24h.data().count,
                    last7d: activeUsers7d.data().count,
                    last30d: activeUsers30d.data().count,
                },
                totalUsers,
                recentSignups,
                recentLogs,
                jobStatuses,
                generatedAt: new Date().toISOString(),
            };
        } catch (error) {
            logSecurityEvent(
                "ADMIN_ERROR",
                "adminGetDashboardStats",
                "Failed to get dashboard stats",
                { userId: request.auth?.uid, metadata: { error: String(error) }, captureToSentry: true }
            );
            throw new HttpsError("internal", "Failed to get dashboard stats");
        }
    }
);
