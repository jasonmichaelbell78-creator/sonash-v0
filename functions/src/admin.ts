/**
 * Admin Cloud Functions
 *
 * Server-side admin operations with proper authorization
 * Prevents client-side manipulation and bypassing security rules
 */

import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { z } from "zod";
import { logSecurityEvent } from "./security-logger";
import { FirestoreRateLimiter } from "./firestore-rate-limiter";

/**
 * SEC-001: Firebase Secrets for Sentry Integration
 * API token is stored in GCP Secret Manager (sensitive)
 * Org/Project are loaded from functions/.env (non-sensitive)
 * Set token via: firebase functions:secrets:set SENTRY_API_TOKEN
 */
const sentryApiToken = defineSecret("SENTRY_API_TOKEN");
import {
  meetingSchema,
  soberLivingSchema,
  quoteSchema,
  type MeetingData,
  type SoberLivingData,
  type QuoteData,
} from "./schemas";

/**
 * CANON-0015: Rate limiter for admin operations
 * More permissive than user endpoints (30 req/60s) but still protected
 * Prevents compromised admin accounts from mass operations
 */
const adminRateLimiter = new FirestoreRateLimiter({
  points: 30, // Max 30 requests
  duration: 60, // Per 60 seconds
});

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
 * Helper: Verify user has admin claim and apply rate limiting
 * CANON-0015: Admin endpoints now have rate limiting protection
 */
async function requireAdmin(request: CallableRequest, operationName: string = "admin_operation") {
  if (!request.auth) {
    logSecurityEvent("AUTH_FAILURE", operationName, "Unauthenticated admin request attempted");
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if (request.auth.token.admin !== true) {
    logSecurityEvent(
      "AUTHORIZATION_FAILURE",
      operationName,
      "Non-admin user attempted admin operation",
      { userId: request.auth.uid }
    );
    throw new HttpsError("permission-denied", "Admin privileges required");
  }

  // CANON-0015: Apply rate limiting to admin operations
  try {
    await adminRateLimiter.consume(request.auth.uid, operationName);
  } catch (rateLimitError) {
    // Log detailed error server-side for debugging
    const internalMessage =
      rateLimitError instanceof Error ? rateLimitError.message : "Rate limit exceeded";

    logSecurityEvent("RATE_LIMIT_EXCEEDED", operationName, internalMessage, {
      userId: request.auth.uid,
    });

    // Return generic message to client (prevent information leakage)
    throw new HttpsError("resource-exhausted", "Too many requests. Please try again later.");
  }

  // Log successful admin authentication for audit trail
  logSecurityEvent(
    "ADMIN_ACTION",
    operationName,
    "Admin authentication and rate limit check passed",
    { userId: request.auth.uid, severity: "INFO" }
  );
}

function sanitizeSentryTitle(title: string) {
  const redactedEmail = title.replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    "[redacted-email]"
  );
  const redactedPhone = redactedEmail.replace(
    /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    "[redacted-phone]"
  );
  const redactedTokens = redactedPhone.replace(/\b[a-f0-9]{32,}\b/gi, "[redacted-token]");
  return redactedTokens;
}

/**
 * Admin: Save Meeting
 */
export const adminSaveMeeting = onCall<SaveMeetingRequest>(async (request) => {
  await requireAdmin(request, "adminSaveMeeting");

  // Validate input
  let validated;
  try {
    validated = meetingSchema.parse(request.data.meeting);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // SECURITY: Don't expose detailed schema validation errors to clients
      // Log details server-side for debugging, return generic message to client
      logSecurityEvent("VALIDATION_FAILURE", "adminSaveMeeting", "Meeting validation failed", {
        userId: request.auth?.uid,
        metadata: { fieldCount: error.issues.length },
      });
      throw new HttpsError(
        "invalid-argument",
        "Invalid meeting data. Please check all required fields."
      );
    }
    throw error;
  }

  // Generate ID if not provided - use Firestore auto-ID for collision resistance
  const id = validated.id || admin.firestore().collection("meetings").doc().id;

  // Save to Firestore
  try {
    await admin
      .firestore()
      .collection("meetings")
      .doc(id)
      .set({
        ...validated,
        id, // Place after spread to ensure id is not overwritten by validated.id
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    logSecurityEvent("ADMIN_ACTION", "adminSaveMeeting", "Meeting saved by admin", {
      userId: request.auth?.uid,
      severity: "INFO",
      metadata: { meetingId: id },
    });

    return { success: true, id };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminSaveMeeting", "Failed to save meeting", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to save meeting");
  }
});

/**
 * Admin: Delete Meeting
 */
export const adminDeleteMeeting = onCall<DeleteMeetingRequest>(async (request) => {
  await requireAdmin(request, "adminDeleteMeeting");

  const { meetingId } = request.data;

  if (!meetingId) {
    throw new HttpsError("invalid-argument", "Meeting ID required");
  }

  try {
    await admin.firestore().collection("meetings").doc(meetingId).delete();

    logSecurityEvent("ADMIN_ACTION", "adminDeleteMeeting", "Meeting deleted by admin", {
      userId: request.auth?.uid,
      severity: "INFO",
      metadata: { meetingId },
    });

    return { success: true };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminDeleteMeeting", "Failed to delete meeting", {
      userId: request.auth?.uid,
      metadata: { meetingId, error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to delete meeting");
  }
});

/**
 * Admin: Save Sober Living Home
 */
export const adminSaveSoberLiving = onCall<SaveSoberLivingRequest>(async (request) => {
  await requireAdmin(request, "adminSaveSoberLiving");

  // Validate input
  let validated;
  try {
    validated = soberLivingSchema.parse(request.data.home);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // SECURITY: Don't expose detailed schema validation errors to clients
      logSecurityEvent(
        "VALIDATION_FAILURE",
        "adminSaveSoberLiving",
        "Sober living validation failed",
        {
          userId: request.auth?.uid,
          metadata: { fieldCount: error.issues.length },
        }
      );
      throw new HttpsError(
        "invalid-argument",
        "Invalid sober living data. Please check all required fields."
      );
    }
    throw error;
  }

  // Generate ID if not provided - use Firestore auto-ID for collision resistance
  const id = validated.id || admin.firestore().collection("sober_living").doc().id;

  try {
    await admin
      .firestore()
      .collection("sober_living")
      .doc(id)
      .set({
        ...validated,
        // SECURITY: Place id AFTER spread to prevent client-provided id from overwriting
        id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    logSecurityEvent("ADMIN_ACTION", "adminSaveSoberLiving", "Sober living home saved by admin", {
      userId: request.auth?.uid,
      severity: "INFO",
      metadata: { homeId: id },
    });

    return { success: true, id };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminSaveSoberLiving", "Failed to save sober living home", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to save sober living home");
  }
});

/**
 * Admin: Delete Sober Living Home
 */
export const adminDeleteSoberLiving = onCall<DeleteSoberLivingRequest>(async (request) => {
  await requireAdmin(request, "adminDeleteSoberLiving");

  const { homeId } = request.data;

  if (!homeId) {
    throw new HttpsError("invalid-argument", "Home ID required");
  }

  try {
    await admin.firestore().collection("sober_living").doc(homeId).delete();

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
      {
        userId: request.auth?.uid,
        metadata: { homeId, error: String(error) },
        captureToSentry: true,
      }
    );
    throw new HttpsError("internal", "Failed to delete sober living home");
  }
});

/**
 * Admin: Save Quote
 */
export const adminSaveQuote = onCall<SaveQuoteRequest>(async (request) => {
  await requireAdmin(request, "adminSaveQuote");

  // Validate input
  let validated;
  try {
    validated = quoteSchema.parse(request.data.quote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // SECURITY: Don't expose detailed schema validation errors to clients
      logSecurityEvent("VALIDATION_FAILURE", "adminSaveQuote", "Quote validation failed", {
        userId: request.auth?.uid,
        metadata: { fieldCount: error.issues.length },
      });
      throw new HttpsError(
        "invalid-argument",
        "Invalid quote data. Please check all required fields."
      );
    }
    throw error;
  }

  // Generate ID if not provided - use Firestore auto-ID for collision resistance
  const id = validated.id || admin.firestore().collection("daily_quotes").doc().id;

  try {
    await admin
      .firestore()
      .collection("daily_quotes")
      .doc(id)
      .set({
        ...validated,
        // SECURITY: Place id AFTER spread to prevent client-provided id from overwriting
        id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    logSecurityEvent("ADMIN_ACTION", "adminSaveQuote", "Quote saved by admin", {
      userId: request.auth?.uid,
      severity: "INFO",
      metadata: { quoteId: id },
    });

    return { success: true, id };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminSaveQuote", "Failed to save quote", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to save quote");
  }
});

/**
 * Admin: Delete Quote
 */
export const adminDeleteQuote = onCall<DeleteQuoteRequest>(async (request) => {
  await requireAdmin(request, "adminDeleteQuote");

  const { quoteId } = request.data;

  if (!quoteId) {
    throw new HttpsError("invalid-argument", "Quote ID required");
  }

  try {
    await admin.firestore().collection("daily_quotes").doc(quoteId).delete();

    logSecurityEvent("ADMIN_ACTION", "adminDeleteQuote", "Quote deleted by admin", {
      userId: request.auth?.uid,
      severity: "INFO",
      metadata: { quoteId },
    });

    return { success: true };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminDeleteQuote", "Failed to delete quote", {
      userId: request.auth?.uid,
      metadata: { quoteId, error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to delete quote");
  }
});

/**
 * Admin: Health Check
 * Tests connectivity to core Firebase services
 */
export const adminHealthCheck = onCall(async (request) => {
  await requireAdmin(request, "adminHealthCheck");

  const health = {
    firestore: false,
    auth: false,
    timestamp: new Date().toISOString(),
  };

  // Test Firestore connectivity
  try {
    await admin
      .firestore()
      .collection("_health")
      .doc("ping")
      .set({ lastCheck: admin.firestore.FieldValue.serverTimestamp() });
    health.firestore = true;
  } catch (error) {
    logSecurityEvent("HEALTH_CHECK_FAILURE", "adminHealthCheck", "Firestore health check failed", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
    });
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
        logSecurityEvent("HEALTH_CHECK_FAILURE", "adminHealthCheck", "Auth health check failed", {
          userId: request.auth?.uid,
          metadata: { error: String(error) },
        });
      }
    }
  }

  return health;
});

/**
 * Admin: Get Dashboard Stats
 * Returns system metrics for the admin dashboard
 */
export const adminGetDashboardStats = onCall(async (request) => {
  await requireAdmin(request, "adminGetDashboardStats");

  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total users count
    const usersSnapshot = await admin.firestore().collection("users").count().get();
    const totalUsers = usersSnapshot.data().count;

    // Get active users by lastActive timestamp
    const activeUsers24h = await admin
      .firestore()
      .collection("users")
      .where("lastActive", ">=", admin.firestore.Timestamp.fromDate(yesterday))
      .count()
      .get();

    const activeUsers7d = await admin
      .firestore()
      .collection("users")
      .where("lastActive", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .count()
      .get();

    const activeUsers30d = await admin
      .firestore()
      .collection("users")
      .where("lastActive", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .count()
      .get();

    // Get recent signups (last 10)
    const recentSignupsSnapshot = await admin
      .firestore()
      .collection("users")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const recentSignups = recentSignupsSnapshot.docs.map((doc) => ({
      id: doc.id,
      nickname: doc.data().nickname || "Anonymous",
      createdAt: doc.data().createdAt?.toDate().toISOString() || null,
      authProvider: doc.data().authProvider || "unknown",
    }));

    // Get recent logs (last 10 from admin_logs if it exists)
    let recentLogs: Array<{
      id: string;
      event: string;
      level: string;
      timestamp: string;
      details: string;
    }> = [];
    try {
      const logsSnapshot = await admin
        .firestore()
        .collection("admin_logs")
        .orderBy("timestamp", "desc")
        .limit(10)
        .get();

      recentLogs = logsSnapshot.docs.map((doc) => ({
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
    let jobStatuses: Array<{
      id: string;
      name: string;
      lastRunStatus: string;
      lastRun: string | null;
    }> = [];
    try {
      const jobsSnapshot = await admin.firestore().collection("admin_jobs").get();

      jobStatuses = jobsSnapshot.docs.map((doc) => ({
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
    logSecurityEvent("ADMIN_ERROR", "adminGetDashboardStats", "Failed to get dashboard stats", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to get dashboard stats");
  }
});

/**
 * Admin: Search Users
 * Search users by email, UID, or nickname
 */
interface SearchUsersRequest {
  query: string;
  limit?: number;
}

export const adminSearchUsers = onCall<SearchUsersRequest>(async (request) => {
  await requireAdmin(request, "adminSearchUsers");

  const { query, limit: rawLimit = 20 } = request.data;

  // SECURITY: Validate and clamp limit to prevent DoS via unbounded queries
  const MAX_LIMIT = 100;
  const MIN_LIMIT = 1;
  const limit =
    typeof rawLimit === "number" && Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.floor(rawLimit), MIN_LIMIT), MAX_LIMIT)
      : 20;

  if (!query || query.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Search query is required");
  }

  // SECURITY: Don't log raw search queries that may contain PII (emails, UIDs)
  // Log only sanitized metadata for audit purposes
  logSecurityEvent("ADMIN_ACTION", "adminSearchUsers", "Admin performed user search", {
    userId: request.auth?.uid,
    metadata: {
      queryLength: query.trim().length,
      queryType: query.includes("@") ? "email" : "text",
    },
  });

  try {
    const results: Array<{
      uid: string;
      email: string | null;
      nickname: string;
      disabled: boolean;
      lastActive: string | null;
      createdAt: string | null;
    }> = [];

    const searchQuery = query.trim().toLowerCase();
    const db = admin.firestore();

    // Search by UID (exact match)
    if (searchQuery.length >= 20) {
      try {
        const userDoc = await db.collection("users").doc(query).get();
        if (userDoc.exists) {
          const userData = userDoc.data()!;
          const authUser = await admin.auth().getUser(query);
          results.push({
            uid: userDoc.id,
            email: authUser.email || null,
            nickname: userData.nickname || "Anonymous",
            disabled: authUser.disabled || false,
            lastActive: userData.lastActive?.toDate().toISOString() || null,
            createdAt: userData.createdAt?.toDate().toISOString() || null,
          });
        }
      } catch {
        // Not a valid UID, continue to other searches
      }
    }

    // Search by email
    if (searchQuery.includes("@")) {
      try {
        const authUser = await admin.auth().getUserByEmail(query);
        const userDoc = await db.collection("users").doc(authUser.uid).get();
        const userData = userDoc.exists ? userDoc.data()! : {};

        if (!results.find((u) => u.uid === authUser.uid)) {
          results.push({
            uid: authUser.uid,
            email: authUser.email || null,
            nickname: userData.nickname || "Anonymous",
            disabled: authUser.disabled || false,
            lastActive: userData.lastActive?.toDate().toISOString() || null,
            createdAt: userData.createdAt?.toDate().toISOString() || null,
          });
        }
      } catch {
        // User not found by email
      }
    }

    // Search by nickname (partial match)
    const nicknameResults = await db
      .collection("users")
      .where("nickname", ">=", searchQuery)
      .where("nickname", "<=", searchQuery + "\uf8ff")
      .limit(limit)
      .get();

    for (const doc of nicknameResults.docs) {
      if (results.find((u) => u.uid === doc.id)) continue;

      const userData = doc.data();
      try {
        const authUser = await admin.auth().getUser(doc.id);
        results.push({
          uid: doc.id,
          email: authUser.email || null,
          nickname: userData.nickname || "Anonymous",
          disabled: authUser.disabled || false,
          lastActive: userData.lastActive?.toDate().toISOString() || null,
          createdAt: userData.createdAt?.toDate().toISOString() || null,
        });
      } catch {
        // Auth user not found, skip
      }
    }

    return {
      results: results.slice(0, limit),
      total: results.length,
    };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminSearchUsers", "Failed to search users", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to search users");
  }
});

/**
 * Admin: Get User Detail
 * Returns detailed user profile and activity timeline
 */
interface GetUserDetailRequest {
  uid: string;
  activityLimit?: number;
}

export const adminGetUserDetail = onCall<GetUserDetailRequest>(async (request) => {
  await requireAdmin(request, "adminGetUserDetail");

  // SECURITY: Validate request.data exists before destructuring
  const requestData =
    request.data && typeof request.data === "object" ? request.data : ({} as GetUserDetailRequest);
  const { uid, activityLimit: rawActivityLimit = 30 } = requestData;

  // SECURITY: Clamp activityLimit to prevent expensive reads / DoS
  const MAX_ACTIVITY_LIMIT = 100;
  const MIN_ACTIVITY_LIMIT = 1;
  const activityLimit =
    typeof rawActivityLimit === "number" && Number.isFinite(rawActivityLimit)
      ? Math.min(Math.max(Math.floor(rawActivityLimit), MIN_ACTIVITY_LIMIT), MAX_ACTIVITY_LIMIT)
      : 30;

  if (!uid) {
    throw new HttpsError("invalid-argument", "User ID is required");
  }

  // SECURITY: Don't log target UID in message - use metadata only
  logSecurityEvent("ADMIN_ACTION", "adminGetUserDetail", "Admin viewed user detail", {
    userId: request.auth?.uid,
    metadata: { targetUid: uid },
  });

  try {
    const db = admin.firestore();

    // Get user auth data
    const authUser = await admin.auth().getUser(uid);

    // Get user profile
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const userData = userDoc.data()!;

    // Get journal entries (last N)
    const journalSnapshot = await db
      .collection(`users/${uid}/journal`)
      .where("isSoftDeleted", "==", false)
      .orderBy("createdAt", "desc")
      .limit(activityLimit)
      .get();

    const journalEntries = journalSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: "journal",
        date: data.createdAt?.toDate().toISOString() || null,
        dateLabel: data.dateLabel || null,
        entryType: data.type || "unknown",
        mood: data.mood || null,
        hasCravings: data.hasCravings || false,
        hasUsed: data.hasUsed || false,
      };
    });

    // Get daily logs (last N)
    const dailyLogsSnapshot = await db
      .collection(`users/${uid}/daily_logs`)
      .orderBy("date", "desc")
      .limit(activityLimit)
      .get();

    const dailyLogs = dailyLogsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: "daily_log",
        date: data.updatedAt?.toDate().toISOString() || null,
        dateLabel: data.date || null,
        mood: data.mood || null,
        cravings: data.cravings || false,
        used: data.used || false,
      };
    });

    // Merge and sort activity by date
    const recentActivity = [...journalEntries, ...dailyLogs]
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, activityLimit);

    // Get inventory count
    const inventorySnapshot = await db.collection(`users/${uid}/inventoryEntries`).count().get();

    return {
      profile: {
        uid: authUser.uid,
        email: authUser.email || null,
        emailVerified: authUser.emailVerified,
        disabled: authUser.disabled,
        createdAt: authUser.metadata.creationTime,
        lastSignIn: authUser.metadata.lastSignInTime,
        provider: authUser.providerData[0]?.providerId || "anonymous",
        nickname: userData.nickname || "Anonymous",
        soberDate: userData.soberDate?.toDate().toISOString() || null,
        lastActive: userData.lastActive?.toDate().toISOString() || null,
        adminNotes: userData.adminNotes || null,
        isAdmin: userData.isAdmin || false,
      },
      stats: {
        totalJournalEntries: journalSnapshot.size,
        totalCheckIns: dailyLogsSnapshot.size,
        totalInventory: inventorySnapshot.data().count,
      },
      recentActivity,
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;

    logSecurityEvent("ADMIN_ERROR", "adminGetUserDetail", "Failed to get user detail", {
      userId: request.auth?.uid,
      metadata: { error: String(error), targetUid: uid },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to get user detail");
  }
});

/**
 * Admin: Update User
 * Allows admin to update specific user fields
 */
interface UpdateUserRequest {
  uid: string;
  updates: {
    adminNotes?: string;
    nickname?: string;
  };
}

export const adminUpdateUser = onCall<UpdateUserRequest>(async (request) => {
  await requireAdmin(request, "adminUpdateUser");

  const { uid, updates } = request.data;

  if (!uid) {
    throw new HttpsError("invalid-argument", "User ID is required");
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw new HttpsError("invalid-argument", "No updates provided");
  }

  // SECURITY: Don't log full updates payload (may contain sensitive adminNotes)
  // Log only field names being updated for audit trail
  logSecurityEvent("ADMIN_ACTION", "adminUpdateUser", "Admin updated user", {
    userId: request.auth?.uid,
    metadata: { targetUid: uid, updatedFields: Object.keys(updates) },
  });

  try {
    const db = admin.firestore();
    const userRef = db.collection("users").doc(uid);

    const allowedUpdates: Record<string, unknown> = {};

    if (updates.adminNotes !== undefined) {
      allowedUpdates.adminNotes = updates.adminNotes;
    }

    if (updates.nickname !== undefined) {
      allowedUpdates.nickname = updates.nickname;
    }

    allowedUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await userRef.update(allowedUpdates);

    return { success: true, message: "User updated successfully" };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminUpdateUser", "Failed to update user", {
      userId: request.auth?.uid,
      metadata: { error: String(error), targetUid: uid },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to update user");
  }
});

/**
 * Admin: Disable/Enable User
 * Disables or enables a user account
 */
interface DisableUserRequest {
  uid: string;
  disabled: boolean;
  reason?: string;
}

export const adminDisableUser = onCall<DisableUserRequest>(async (request) => {
  await requireAdmin(request, "adminDisableUser");

  const { uid, disabled, reason } = request.data;

  if (!uid) {
    throw new HttpsError("invalid-argument", "User ID is required");
  }

  // SECURITY: Don't log reason field - it may contain PII or sensitive details
  // Log only sanitized metadata for audit trail
  logSecurityEvent(
    "ADMIN_ACTION",
    "adminDisableUser",
    `Admin ${disabled ? "disabled" : "enabled"} user`,
    {
      userId: request.auth?.uid,
      metadata: { targetUid: uid, disabled, hasReason: !!reason },
      severity: "WARNING",
    }
  );

  try {
    // Update Firebase Auth
    await admin.auth().updateUser(uid, { disabled });

    // Revoke refresh tokens if disabling
    if (disabled) {
      await admin.auth().revokeRefreshTokens(uid);
    }

    // Update Firestore user document
    const db = admin.firestore();
    await db
      .collection("users")
      .doc(uid)
      .update({
        disabled,
        disabledReason: reason || null,
        disabledAt: disabled ? admin.firestore.FieldValue.serverTimestamp() : null,
        disabledBy: request.auth?.uid || null,
      });

    return {
      success: true,
      message: `User ${disabled ? "disabled" : "enabled"} successfully`,
    };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminDisableUser", "Failed to disable/enable user", {
      userId: request.auth?.uid,
      metadata: { error: String(error), targetUid: uid },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to update user status");
  }
});

/**
 * Admin: Trigger Background Job
 * Allows admin to manually trigger a background job
 */
interface TriggerJobRequest {
  jobId: string;
}

export const adminTriggerJob = onCall<TriggerJobRequest>(async (request) => {
  await requireAdmin(request, "adminTriggerJob");

  const { jobId } = request.data;

  if (!jobId) {
    throw new HttpsError("invalid-argument", "Job ID is required");
  }

  logSecurityEvent("ADMIN_ACTION", "adminTriggerJob", `Admin manually triggered job: ${jobId}`, {
    userId: request.auth?.uid,
    metadata: { jobId },
    severity: "INFO",
  });

  try {
    // Import job runner dynamically to avoid circular dependencies
    const { runJob } = await import("./jobs.js");
    const { cleanupOldRateLimits } = await import("./firestore-rate-limiter.js");

    // Map job IDs to their implementations
    const jobMap: Record<string, { name: string; fn: () => Promise<void> }> = {
      cleanupOldRateLimits: {
        name: "Cleanup Rate Limits",
        fn: async () => {
          await cleanupOldRateLimits();
        },
      },
    };

    const job = jobMap[jobId];
    if (!job) {
      throw new HttpsError("not-found", `Job not found: ${jobId}`);
    }

    // Run the job with tracking
    await runJob(jobId, job.name, job.fn);

    return {
      success: true,
      message: `Job ${jobId} completed successfully`,
    };
  } catch (error) {
    // If error is already an HttpsError, rethrow it
    if (error instanceof HttpsError) throw error;

    logSecurityEvent("ADMIN_ERROR", "adminTriggerJob", "Failed to trigger job", {
      userId: request.auth?.uid,
      metadata: { error: String(error), jobId },
      captureToSentry: true,
    });

    // SECURITY: Don't expose internal error details to client
    throw new HttpsError("internal", "Failed to run job. Please try again or contact support.");
  }
});

/**
 * Admin: Get All Jobs Status
 * Returns status of all registered background jobs
 */
export const adminGetJobsStatus = onCall(async (request) => {
  await requireAdmin(request, "adminGetJobsStatus");

  try {
    const db = admin.firestore();

    // Get all job documents from admin_jobs collection
    const jobsSnapshot = await db.collection("admin_jobs").get();

    const jobs = jobsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || doc.id,
        lastRunStatus: data.lastRunStatus || "never",
        lastRun: data.lastRun?.toDate().toISOString() || null,
        lastSuccessRun: data.lastSuccessRun?.toDate().toISOString() || null,
        lastRunDuration: data.lastRunDuration || null,
        lastError: data.lastError || null,
      };
    });

    // Add any registered jobs that haven't run yet
    const registeredJobs = [
      {
        id: "cleanupOldRateLimits",
        name: "Cleanup Rate Limits",
        schedule: "Daily at 3 AM CT",
        description: "Removes expired rate limit documents",
      },
    ];

    const allJobs = registeredJobs.map((registered) => {
      const existingJob = jobs.find((j) => j.id === registered.id);
      return {
        ...registered,
        lastRunStatus: existingJob?.lastRunStatus || "never",
        lastRun: existingJob?.lastRun || null,
        lastSuccessRun: existingJob?.lastSuccessRun || null,
        lastRunDuration: existingJob?.lastRunDuration || null,
        lastError: existingJob?.lastError || null,
      };
    });

    return { jobs: allJobs };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminGetJobsStatus", "Failed to get jobs status", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to get jobs status");
  }
});

interface SentryIssueSummary {
  title: string;
  count: number;
  lastSeen: string | null;
  firstSeen: string | null;
  shortId: string;
  level: string | null;
  status: string | null;
  permalink: string;
}

export const adminGetSentryErrorSummary = onCall({ secrets: [sentryApiToken] }, async (request) => {
  await requireAdmin(request, "adminGetSentryErrorSummary");

  logSecurityEvent(
    "ADMIN_ACTION",
    "adminGetSentryErrorSummary",
    "Admin requested Sentry error summary",
    { userId: request.auth?.uid, severity: "INFO" }
  );

  // SEC-001: Access token via .value(), org/project from env vars
  const token = sentryApiToken.value();
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;

  if (!token || !org || !project) {
    throw new HttpsError("failed-precondition", "Sentry integration is not configured");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const statsUrl = new URL(`https://sentry.io/api/0/organizations/${org}/events-stats/`);
    statsUrl.searchParams.set("project", project);
    statsUrl.searchParams.set("interval", "1h");
    statsUrl.searchParams.set("statsPeriod", "48h");

    const statsResponse = await fetch(statsUrl.toString(), { headers });
    if (!statsResponse.ok) {
      throw new Error(`Sentry stats API failed: ${statsResponse.status}`);
    }

    const statsPayload = await statsResponse.json();
    const statsData: Array<[number, number | number[]]> = Array.isArray(statsPayload?.data)
      ? statsPayload.data
      : [];
    const buckets = statsData.map((entry) => {
      const rawValue = entry[1];
      if (Array.isArray(rawValue)) {
        return Number(rawValue[0] ?? 0);
      }
      return Number(rawValue ?? 0);
    });
    const last24h = buckets.slice(-24).reduce((sum, value) => sum + value, 0);
    const prev24h = buckets.slice(-48, -24).reduce((sum, value) => sum + value, 0);
    const trendPct =
      prev24h === 0 ? (last24h === 0 ? 0 : 100) : ((last24h - prev24h) / prev24h) * 100;

    const issuesUrl = new URL(`https://sentry.io/api/0/projects/${org}/${project}/issues/`);
    issuesUrl.searchParams.set("limit", "20");
    issuesUrl.searchParams.set("sort", "freq");
    issuesUrl.searchParams.set("statsPeriod", "24h");

    const issuesResponse = await fetch(issuesUrl.toString(), { headers });
    if (!issuesResponse.ok) {
      throw new Error(`Sentry issues API failed: ${issuesResponse.status}`);
    }

    const issuesPayload: Array<{
      title?: string;
      count?: string;
      lastSeen?: string;
      firstSeen?: string;
      shortId?: string;
      level?: string;
      status?: string;
      permalink?: string;
    }> = await issuesResponse.json();

    const issues: SentryIssueSummary[] = issuesPayload.map((issue) => ({
      title: sanitizeSentryTitle(issue.title || "Unknown error"),
      count: Number(issue.count || 0),
      lastSeen: issue.lastSeen || null,
      firstSeen: issue.firstSeen || null,
      shortId: issue.shortId || "N/A",
      level: issue.level || null,
      status: issue.status || null,
      permalink: issue.permalink || `https://sentry.io/organizations/${org}/issues/`,
    }));

    return {
      summary: {
        totalEvents24h: last24h,
        totalEventsPrev24h: prev24h,
        trendPct: Number(trendPct.toFixed(1)),
        issueCount: issues.length,
      },
      issues,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logSecurityEvent(
      "ADMIN_ERROR",
      "adminGetSentryErrorSummary",
      "Failed to fetch Sentry error summary",
      { userId: request.auth?.uid, metadata: { error: String(error) }, captureToSentry: true }
    );
    throw new HttpsError("internal", "Failed to fetch Sentry error summary");
  }
});
