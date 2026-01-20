/**
 * Admin Cloud Functions
 *
 * Server-side admin operations with proper authorization
 * Prevents client-side manipulation and bypassing security rules
 */

import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { z } from "zod";
import { logSecurityEvent, hashUserId, redactSensitiveMetadata } from "./security-logger";
import { FirestoreRateLimiter } from "./firestore-rate-limiter";

/**
 * SEC-001: Firebase Secrets for Sentry Integration
 * API token is stored in GCP Secret Manager (sensitive)
 * Org/Project are loaded via defineString for deployment safety
 * Set token via: firebase functions:secrets:set SENTRY_API_TOKEN
 * Set org/project in functions/.env.local or via Firebase console
 */
const sentryApiToken = defineSecret("SENTRY_API_TOKEN");
const sentryOrg = defineString("SENTRY_ORG");
const sentryProject = defineString("SENTRY_PROJECT");
import {
  meetingSchema,
  soberLivingSchema,
  quoteSchema,
  type MeetingData,
  type SoberLivingData,
  type QuoteData,
} from "./schemas";

/**
 * Convert non-serializable values to JSON-safe format
 * ROBUSTNESS: Firestore Timestamps, Dates, etc. need conversion for callable responses
 */
function toJsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  // Firestore Timestamp-like objects
  if (typeof value === "object" && value && "toDate" in (value as Record<string, unknown>)) {
    const maybeToDate = (value as { toDate?: () => Date }).toDate;
    if (typeof maybeToDate === "function") {
      return maybeToDate.call(value).toISOString();
    }
  }

  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) return value.map(toJsonSafe);

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, toJsonSafe(v)])
    );
  }

  return value;
}

// ============================================================================
// User Search Helpers (for adminSearchUsers complexity reduction)
// ============================================================================

/**
 * User search result structure
 */
interface UserSearchResult {
  uid: string;
  email: string | null;
  nickname: string;
  disabled: boolean;
  lastActive: string | null;
  createdAt: string | null;
}

/**
 * Build a UserSearchResult from Firestore and Auth data
 */
async function buildUserSearchResult(
  uid: string,
  userData: FirebaseFirestore.DocumentData | null,
  authGetter: () => Promise<admin.auth.UserRecord>
): Promise<UserSearchResult | null> {
  try {
    const authUser = await authGetter();
    return {
      uid,
      email: authUser.email || null,
      nickname: userData?.nickname || "Anonymous",
      disabled: authUser.disabled || false,
      lastActive: userData?.lastActive?.toDate().toISOString() || null,
      createdAt: userData?.createdAt?.toDate().toISOString() || null,
    };
  } catch (error) {
    // Log error for debugging (Review #184 - Qodo: Robust Error Handling)
    // Don't log full error message to avoid PII leakage from auth errors
    console.warn(
      `buildUserSearchResult failed for uid=${hashUserId(uid)}:`,
      error instanceof Error ? error.name : "Unknown error"
    );
    return null;
  }
}

/**
 * Search for user by UID (exact match, case-sensitive)
 */
async function searchUserByUid(
  uid: string,
  db: FirebaseFirestore.Firestore
): Promise<UserSearchResult | null> {
  if (uid.length < 20) return null;

  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) return null;

  return buildUserSearchResult(userDoc.id, userDoc.data() ?? null, () => admin.auth().getUser(uid));
}

/**
 * Search for user by email (case-insensitive via Firebase Auth)
 */
async function searchUserByEmail(
  email: string,
  db: FirebaseFirestore.Firestore
): Promise<UserSearchResult | null> {
  if (!email.includes("@")) return null;

  try {
    const authUser = await admin.auth().getUserByEmail(email);
    const userDoc = await db.collection("users").doc(authUser.uid).get();
    return buildUserSearchResult(
      authUser.uid,
      userDoc.exists ? (userDoc.data() ?? null) : null,
      () => Promise.resolve(authUser)
    );
  } catch (error) {
    // Review #187: Log unexpected errors for debugging, but don't expose to caller
    // auth/user-not-found is expected and not logged to avoid noise
    const code = (error as { code?: string })?.code;
    if (code !== "auth/user-not-found") {
      console.warn("searchUserByEmail unexpected error:", sanitizeErrorMessage(error));
    }
    return null;
  }
}

/**
 * Search for users by nickname (exact and prefix match)
 */
async function searchUsersByNickname(
  nickname: string,
  limit: number,
  db: FirebaseFirestore.Firestore,
  existingUids: Set<string>
): Promise<UserSearchResult[]> {
  const results: UserSearchResult[] = [];

  // Exact match first
  const exactResults = await db
    .collection("users")
    .where("nickname", "==", nickname)
    .limit(limit)
    .get();

  for (const doc of exactResults.docs) {
    if (existingUids.has(doc.id)) continue;
    const result = await buildUserSearchResult(doc.id, doc.data(), () =>
      admin.auth().getUser(doc.id)
    );
    if (result) {
      results.push(result);
      existingUids.add(doc.id);
    }
  }

  // Prefix match for additional results
  const prefixResults = await db
    .collection("users")
    .where("nickname", ">=", nickname)
    .where("nickname", "<=", nickname + "\uf8ff")
    .limit(limit)
    .get();

  for (const doc of prefixResults.docs) {
    if (existingUids.has(doc.id)) continue;
    const result = await buildUserSearchResult(doc.id, doc.data(), () =>
      admin.auth().getUser(doc.id)
    );
    if (result) {
      results.push(result);
      existingUids.add(doc.id);
    }
  }

  return results;
}

// ============================================================================
// Pagination Helpers (for adminListUsers complexity reduction)
// ============================================================================

/**
 * Build cursor value for pagination with proper type handling.
 * Returns sentinel values for null/missing fields to prevent cursor errors.
 */
function buildCursorValue(
  rawValue: unknown,
  fieldName: string,
  sortOrder: "asc" | "desc"
): admin.firestore.Timestamp | string {
  const isTimestampField = fieldName === "createdAt" || fieldName === "lastActive";

  if (isTimestampField) {
    // Prefer duck-typing to avoid cross-module instanceof issues
    const maybeTs = rawValue as { toMillis?: () => number } | null;
    if (maybeTs && typeof maybeTs.toMillis === "function") {
      return admin.firestore.Timestamp.fromMillis(maybeTs.toMillis());
    }
    if (rawValue instanceof Date) {
      return admin.firestore.Timestamp.fromDate(rawValue);
    }
    // Sentinel timestamp: min for asc, max for desc
    return sortOrder === "asc"
      ? admin.firestore.Timestamp.fromMillis(0)
      : admin.firestore.Timestamp.fromMillis(253402300799000); // year 9999
  }

  // For string fields (nickname), return string or sentinel
  if (typeof rawValue === "string") {
    return rawValue;
  }
  return sortOrder === "asc" ? "" : "\uf8ff";
}

/**
 * Batch fetch auth users and return a Map for O(1) lookup.
 */
async function batchFetchAuthUsers(
  uids: string[],
  onError: (error: unknown) => void
): Promise<Map<string, admin.auth.UserRecord>> {
  const authByUid = new Map<string, admin.auth.UserRecord>();
  if (uids.length === 0) return authByUid;

  // Split into batches of 100 (Firebase Auth API limit)
  const batches: string[][] = [];
  for (let i = 0; i < uids.length; i += 100) {
    batches.push(uids.slice(i, i + 100));
  }

  for (const batch of batches) {
    try {
      const authResult = await admin.auth().getUsers(batch.map((uid) => ({ uid })));
      authResult.users.forEach((u) => authByUid.set(u.uid, u));
    } catch (error) {
      onError(error);
      throw new HttpsError("internal", "Failed to fetch user authentication details");
    }
  }

  return authByUid;
}

// ============================================================================
// Rate Limit Helpers (for adminGetRateLimitStatus complexity reduction)
// ============================================================================

/**
 * Normalize various timestamp formats to milliseconds.
 * Handles Firestore Timestamp, number (ms), Date, and ISO string.
 * @returns milliseconds since epoch, or NaN if invalid
 */
function normalizeTimestampToMs(rawValue: unknown): number {
  // Firestore Timestamp with toMillis method
  if (typeof (rawValue as { toMillis?: () => number })?.toMillis === "function") {
    return (rawValue as { toMillis: () => number }).toMillis();
  }
  // Already milliseconds number
  if (typeof rawValue === "number") {
    return rawValue;
  }
  // Native Date object
  if (rawValue instanceof Date) {
    return rawValue.getTime();
  }
  // ISO string format
  if (typeof rawValue === "string") {
    return Date.parse(rawValue);
  }
  return Number.NaN;
}

/**
 * Aggregate rate limits by type for summary statistics.
 */
function aggregateRateLimitsByType(
  limits: Array<{ type: string; isBlocked: boolean }>
): Record<string, { total: number; blocked: number }> {
  const byType: Record<string, { total: number; blocked: number }> = {};
  for (const limit of limits) {
    if (!byType[limit.type]) {
      byType[limit.type] = { total: 0, blocked: 0 };
    }
    byType[limit.type].total++;
    if (limit.isBlocked) {
      byType[limit.type].blocked++;
    }
  }
  return byType;
}

// ============================================================================
// Privilege Helpers (for adminSetUserPrivilege complexity reduction)
// ============================================================================

/**
 * Get user's previous privilege type from Firestore.
 * Returns "free" as fallback if user doesn't exist or privilege is invalid.
 */
async function getPreviousPrivilegeType(
  uid: string,
  db: admin.firestore.Firestore
): Promise<string> {
  // Wrap in try-catch to handle Firestore read failures gracefully (Review #184 - Qodo)
  try {
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return "free";
    }
    const rawPrivilegeType = (userSnap.data() as Record<string, unknown> | undefined)
      ?.privilegeType;
    if (typeof rawPrivilegeType === "string" && rawPrivilegeType) {
      return rawPrivilegeType;
    }
    return "free";
  } catch {
    // Default to "free" on read failures to avoid disrupting the parent operation
    return "free";
  }
}

// ============================================================================
// Storage Stats Helpers (for adminGetStorageStats complexity reduction)
// ============================================================================

/**
 * Extract user ID from storage path if it follows users/{userId}/... pattern.
 */
function extractUserIdFromPath(path: string): string | null {
  const pathParts = path.split("/");
  if (pathParts[0] === "users" && pathParts[1]) {
    return pathParts[1];
  }
  return null;
}

/**
 * Extract file extension from file name.
 * Returns "unknown" for files without valid extensions.
 */
function extractFileExtension(fileName: string): string {
  const baseName = fileName.split("/").pop() ?? "";
  const dotIndex = baseName.lastIndexOf(".");
  if (dotIndex > 0 && dotIndex < baseName.length - 1) {
    return baseName.slice(dotIndex + 1).toLowerCase();
  }
  return "unknown";
}

/**
 * Find orphaned storage files (files belonging to non-existent users).
 * Checks users in batches of 10.
 */
async function findOrphanedStorageFiles(
  userFiles: Record<string, { count: number; size: number }>,
  db: admin.firestore.Firestore
): Promise<{ count: number; size: number }> {
  const userIds = Object.keys(userFiles);
  let orphanedCount = 0;
  let orphanedSize = 0;

  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10);
    const userDocs = await Promise.all(batch.map((uid) => db.collection("users").doc(uid).get()));

    userDocs.forEach((doc, idx) => {
      if (!doc.exists) {
        const userId = batch[idx];
        orphanedCount += userFiles[userId].count;
        orphanedSize += userFiles[userId].size;
      }
    });
  }

  return { count: orphanedCount, size: orphanedSize };
}

// ============================================================================
// Collection Stats Helpers (for adminGetCollectionStats complexity reduction)
// ============================================================================

/**
 * Estimate subcollection document counts by sampling users.
 * Returns total estimated docs and whether subcollections were found.
 */
async function estimateUserSubcollections(
  db: admin.firestore.Firestore,
  userCount: number
): Promise<{ hasSubcollections: boolean; estimate: number }> {
  const sampleUsers = await db.collection("users").limit(5).get();
  const subcollectionNames = ["journal", "daily_logs", "inventoryEntries"];
  const subcollectionCounts: Record<string, number[]> = {};

  for (const name of subcollectionNames) {
    subcollectionCounts[name] = [];
  }

  // Sample subcollection counts from each user
  for (const userDoc of sampleUsers.docs) {
    for (const subColName of subcollectionNames) {
      try {
        const subCount = await db.collection(`users/${userDoc.id}/${subColName}`).count().get();
        subcollectionCounts[subColName].push(subCount.data().count);
      } catch {
        // Subcollection might not exist for this user
      }
    }
  }

  // Calculate averages and estimate totals
  const estimates = Object.values(subcollectionCounts)
    .filter((counts) => counts.length > 0)
    .map((counts) => {
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
      return Math.round(avg * userCount);
    });

  if (estimates.length === 0) {
    return { hasSubcollections: false, estimate: 0 };
  }

  return {
    hasSubcollections: true,
    estimate: estimates.reduce((a, b) => a + b, 0),
  };
}

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
 * Review #187: Sanitize error messages to prevent PII leakage in logs.
 * Firebase/Admin SDK error strings can include identifiers or contextual details.
 */
function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  // Redact emails
  let sanitized = raw.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]");
  // Redact Firebase UIDs (typically 28 alphanumeric chars)
  sanitized = sanitized.replace(/\b[a-zA-Z0-9]{28}\b/g, "[redacted-uid]");
  // Redact long hex tokens
  sanitized = sanitized.replace(/\b[a-f0-9]{32,}\b/gi, "[redacted-token]");
  // Truncate to reasonable length
  return sanitized.length > 200 ? sanitized.slice(0, 200) + "..." : sanitized;
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

  const trimmedQuery = query.trim();

  // SECURITY: Don't log raw search queries that may contain PII (emails, UIDs)
  logSecurityEvent("ADMIN_ACTION", "adminSearchUsers", "Admin performed user search", {
    userId: request.auth?.uid,
    metadata: {
      queryLength: trimmedQuery.length,
      queryType: trimmedQuery.includes("@") ? "email" : "text",
    },
  });

  try {
    const results: UserSearchResult[] = [];
    const existingUids = new Set<string>();
    const db = admin.firestore();

    // Search by UID (exact match, case-sensitive)
    const uidResult = await searchUserByUid(trimmedQuery, db);
    if (uidResult) {
      results.push(uidResult);
      existingUids.add(uidResult.uid);
    }

    // Search by email (case-insensitive via Firebase Auth)
    const emailResult = await searchUserByEmail(trimmedQuery, db);
    if (emailResult && !existingUids.has(emailResult.uid)) {
      results.push(emailResult);
      existingUids.add(emailResult.uid);
    }

    // Search by nickname (exact and prefix match)
    const nicknameResults = await searchUsersByNickname(trimmedQuery, limit, db, existingUids);
    results.push(...nicknameResults);

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

  // SECURITY: Hash target UID to prevent PII exposure in logs
  logSecurityEvent("ADMIN_ACTION", "adminGetUserDetail", "Admin viewed user detail", {
    userId: request.auth?.uid,
    metadata: { targetUidHash: hashUserId(uid) },
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
        privilegeType: userData.privilegeType || "free",
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
      metadata: { error: String(error), targetUidHash: hashUserId(uid) },
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
    metadata: { targetUidHash: hashUserId(uid), updatedFields: Object.keys(updates) },
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
      metadata: { error: String(error), targetUidHash: hashUserId(uid) },
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
  // Log only sanitized metadata for audit trail (hash targetUid)
  logSecurityEvent(
    "ADMIN_ACTION",
    "adminDisableUser",
    `Admin ${disabled ? "disabled" : "enabled"} user`,
    {
      userId: request.auth?.uid,
      metadata: { targetUidHash: hashUserId(uid), disabled, hasReason: !!reason },
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
      metadata: { error: String(error), targetUidHash: hashUserId(uid) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to update user status");
  }
});

/**
 * Admin: Soft-Delete User
 * Marks a user for deletion with 30-day retention period
 * Disables auth account and revokes tokens immediately
 *
 * SECURITY: Requires admin privilege, blocks self-deletion
 * VALIDATION: Uses zod for input validation with length limits
 * ROLLBACK: Re-enables auth if Firestore write fails
 * AUDIT: Logs security event with hashed user ID
 */
interface SoftDeleteUserRequest {
  uid: string;
  reason?: string;
}

// Input validation schema for soft-delete
const softDeleteSchema = z.object({
  uid: z.string().trim().min(1, "User ID is required").max(128, "User ID too long"),
  reason: z.string().trim().max(500, "Reason too long").optional(),
});

export const adminSoftDeleteUser = onCall<SoftDeleteUserRequest>(async (request) => {
  await requireAdmin(request, "adminSoftDeleteUser");

  // VALIDATION: Validate and sanitize input
  const parseResult = softDeleteSchema.safeParse(request.data);
  if (!parseResult.success) {
    throw new HttpsError(
      "invalid-argument",
      parseResult.error.issues[0]?.message || "Invalid input"
    );
  }
  const { uid } = parseResult.data;
  const reason = parseResult.data.reason?.length ? parseResult.data.reason : undefined;

  // SECURITY: Block self-deletion
  if (request.auth?.uid && uid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "Admins cannot delete their own account");
  }

  // SECURITY: Log audit event (hash targetUid to avoid PII in logs)
  logSecurityEvent("ADMIN_ACTION", "adminSoftDeleteUser", "Admin soft-deleted user", {
    userId: request.auth?.uid,
    metadata: { targetUidHash: hashUserId(uid), hasReason: !!reason },
    severity: "WARNING",
  });

  const db = admin.firestore();

  try {
    // Check if user exists and is not already soft-deleted
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const userData = userDoc.data();
    if (userData?.isSoftDeleted) {
      throw new HttpsError("failed-precondition", "User is already scheduled for deletion");
    }

    // Calculate scheduled hard delete date (30 days from now)
    const now = new Date();
    const scheduledHardDeleteAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // OPERATION ORDER: Firestore first (source of truth), then Auth
    // This ensures consistent rollback if Auth operations fail
    await db
      .collection("users")
      .doc(uid)
      .update({
        isSoftDeleted: true,
        softDeletedAt: admin.firestore.FieldValue.serverTimestamp(),
        softDeletedBy: request.auth?.uid || null,
        scheduledHardDeleteAt: admin.firestore.Timestamp.fromDate(scheduledHardDeleteAt),
        softDeleteReason: reason || null,
        // Also set disabled fields for consistency
        disabled: true,
        disabledAt: admin.firestore.FieldValue.serverTimestamp(),
        disabledBy: request.auth?.uid || null,
      });

    // Apply Auth changes after Firestore is consistent
    // ROLLBACK: If Auth changes fail, revert Firestore flags
    try {
      await admin.auth().updateUser(uid, { disabled: true });
      await admin.auth().revokeRefreshTokens(uid);
    } catch (authError) {
      // ROLLBACK: Revert Firestore soft-delete fields
      await db.collection("users").doc(uid).update({
        isSoftDeleted: false,
        softDeletedAt: null,
        softDeletedBy: null,
        scheduledHardDeleteAt: null,
        softDeleteReason: null,
        disabled: false,
        disabledAt: null,
        disabledBy: null,
      });
      throw authError;
    }

    return {
      success: true,
      message: "User scheduled for deletion in 30 days",
      scheduledHardDeleteAt: scheduledHardDeleteAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;

    logSecurityEvent("ADMIN_ERROR", "adminSoftDeleteUser", "Failed to soft-delete user", {
      userId: request.auth?.uid,
      metadata: { error: String(error), targetUidHash: hashUserId(uid) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to soft-delete user");
  }
});

/**
 * Admin: Undelete User
 * Restores a soft-deleted user before the 30-day retention expires
 * Re-enables auth account
 *
 * SECURITY: Requires admin privilege
 * VALIDATION: Uses zod for input validation with length limits
 * ATOMICITY: Uses Firestore transaction to check expiry and update atomically
 * ROLLBACK: Reverts Firestore if auth restore fails
 * AUDIT: Logs security event with hashed user ID
 */
interface UndeleteUserRequest {
  uid: string;
}

// Input validation schema for undelete
const undeleteSchema = z.object({
  uid: z.string().trim().min(1, "User ID is required").max(128, "User ID too long"),
});

export const adminUndeleteUser = onCall<UndeleteUserRequest>(async (request) => {
  await requireAdmin(request, "adminUndeleteUser");

  // VALIDATION: Validate and sanitize input (consistent with adminSoftDeleteUser)
  const parseResult = undeleteSchema.safeParse(request.data);
  if (!parseResult.success) {
    throw new HttpsError(
      "invalid-argument",
      parseResult.error.issues[0]?.message || "Invalid input"
    );
  }
  const { uid } = parseResult.data;

  // SECURITY: Log audit event
  logSecurityEvent("ADMIN_ACTION", "adminUndeleteUser", "Admin restored soft-deleted user", {
    userId: request.auth?.uid,
    metadata: { targetUidHash: hashUserId(uid) },
    severity: "INFO",
  });

  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();

  // ROLLBACK STATE: Type for original values captured in transaction
  interface OriginalSoftDeleteFields {
    softDeletedAt: admin.firestore.Timestamp | null;
    softDeletedBy: string | null;
    scheduledHardDeleteAt: admin.firestore.Timestamp | null;
    softDeleteReason: string | null;
    disabledAt: admin.firestore.Timestamp | null;
    disabledBy: string | null;
    disabledReason: string | null;
  }

  // Use object wrapper to allow mutation inside transaction callback
  const rollbackState: { original: OriginalSoftDeleteFields | null } = { original: null };

  try {
    // ATOMICITY: Use transaction to check expiry and update in one atomic operation
    await db.runTransaction(async (tx) => {
      const userRef = db.collection("users").doc(uid);
      const userDoc = await tx.get(userRef);

      if (!userDoc.exists) {
        throw new HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data();
      if (!userData?.isSoftDeleted) {
        throw new HttpsError("failed-precondition", "User is not scheduled for deletion");
      }

      // EXPIRY CHECK: Block restores after retention period expires
      const scheduled = userData.scheduledHardDeleteAt as
        | admin.firestore.Timestamp
        | null
        | undefined;
      if (!scheduled || scheduled.toMillis() <= now.toMillis()) {
        throw new HttpsError(
          "failed-precondition",
          "User can no longer be restored (retention period expired)"
        );
      }

      // CAPTURE: Store original values for potential rollback
      rollbackState.original = {
        softDeletedAt: userData.softDeletedAt ?? null,
        softDeletedBy: userData.softDeletedBy ?? null,
        scheduledHardDeleteAt: userData.scheduledHardDeleteAt ?? null,
        softDeleteReason: userData.softDeleteReason ?? null,
        disabledAt: userData.disabledAt ?? null,
        disabledBy: userData.disabledBy ?? null,
        disabledReason: userData.disabledReason ?? null,
      };

      // Update within transaction
      tx.update(userRef, {
        isSoftDeleted: false,
        softDeletedAt: null,
        softDeletedBy: null,
        scheduledHardDeleteAt: null,
        softDeleteReason: null,
        // Also clear disabled fields
        disabled: false,
        disabledAt: null,
        disabledBy: null,
        disabledReason: null,
      });
    });

    // Re-enable Firebase Auth account after Firestore is consistent
    // ROLLBACK: If auth restore fails, revert Firestore to original state
    try {
      await admin.auth().updateUser(uid, { disabled: false });
    } catch (authError) {
      // FULL ROLLBACK: Restore all original soft-delete fields
      const orig = rollbackState.original;
      await db
        .collection("users")
        .doc(uid)
        .update({
          isSoftDeleted: true,
          softDeletedAt: orig?.softDeletedAt ?? admin.firestore.FieldValue.serverTimestamp(),
          softDeletedBy: orig?.softDeletedBy ?? null,
          scheduledHardDeleteAt: orig?.scheduledHardDeleteAt ?? null,
          softDeleteReason: orig?.softDeleteReason ?? null,
          disabled: true,
          disabledAt: orig?.disabledAt ?? admin.firestore.FieldValue.serverTimestamp(),
          disabledBy: orig?.disabledBy ?? null,
          disabledReason: orig?.disabledReason ?? null,
        });
      throw authError;
    }

    return {
      success: true,
      message: "User restored successfully",
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;

    logSecurityEvent("ADMIN_ERROR", "adminUndeleteUser", "Failed to restore soft-deleted user", {
      userId: request.auth?.uid,
      metadata: { error: String(error), targetUidHash: hashUserId(uid) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to restore user");
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
    // Import job runner and job functions dynamically to avoid circular dependencies
    const {
      runJob,
      cleanupOldDailyLogs,
      cleanupOrphanedStorageFiles,
      generateUsageAnalytics,
      pruneSecurityEvents,
      healthCheckNotifications,
    } = await import("./jobs.js");
    const { cleanupOldRateLimits } = await import("./firestore-rate-limiter.js");

    // Map job IDs to their implementations
    const jobMap: Record<string, { name: string; fn: () => Promise<void> }> = {
      cleanupOldRateLimits: {
        name: "Cleanup Rate Limits",
        fn: async () => {
          await cleanupOldRateLimits();
        },
      },
      cleanupOldDailyLogs: {
        name: "Cleanup Old Daily Logs",
        fn: async () => {
          await cleanupOldDailyLogs();
        },
      },
      // Backward-compat alias for old job ID
      cleanupOldSessions: {
        name: "Cleanup Old Sessions (legacy)",
        fn: async () => {
          await cleanupOldDailyLogs();
        },
      },
      cleanupOrphanedStorageFiles: {
        name: "Cleanup Orphaned Storage Files",
        fn: async () => {
          await cleanupOrphanedStorageFiles();
        },
      },
      generateUsageAnalytics: {
        name: "Generate Usage Analytics",
        fn: async () => {
          await generateUsageAnalytics();
        },
      },
      pruneSecurityEvents: {
        name: "Prune Security Events",
        fn: async () => {
          await pruneSecurityEvents();
        },
      },
      healthCheckNotifications: {
        name: "Health Check Notifications",
        fn: async () => {
          await healthCheckNotifications();
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
    // These must match the job IDs used in runJob() calls in jobs.ts
    const registeredJobs = [
      {
        id: "cleanupOldRateLimits",
        name: "Cleanup Rate Limits",
        schedule: "Daily at 3 AM CT",
        description: "Removes expired rate limit documents",
      },
      {
        id: "cleanupOldDailyLogs",
        name: "Cleanup Old Daily Logs",
        schedule: "Daily at 4 AM CT",
        description: "Deletes documents from daily_logs collection group older than 30 days (A10)",
      },
      {
        id: "cleanupOrphanedStorageFiles",
        name: "Cleanup Orphaned Storage",
        schedule: "Sundays at 2 AM CT",
        description: "Removes storage files for deleted users older than 7 days (A11)",
      },
      {
        id: "generateUsageAnalytics",
        name: "Generate Usage Analytics",
        schedule: "Daily at 1 AM CT",
        description: "Generates daily usage statistics for admin dashboard (A12)",
      },
      {
        id: "pruneSecurityEvents",
        name: "Prune Security Events",
        schedule: "Sundays at 3 AM CT",
        description: "Removes security log events older than 90 days (A13)",
      },
      {
        id: "healthCheckNotifications",
        name: "Health Check",
        schedule: "Every 6 hours",
        description: "Monitors system health and logs warnings/errors (A14)",
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
  userCount: number;
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

  // SEC-001: Access all config via .value() for deployment safety
  const token = sentryApiToken.value();
  const org = sentryOrg.value();
  const project = sentryProject.value();

  if (!token || !org || !project) {
    throw new HttpsError("failed-precondition", "Sentry integration is not configured");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    // Fetch issues from project - this endpoint works with project slug
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
      userCount?: number;
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
      userCount: issue.userCount || 0,
      lastSeen: issue.lastSeen || null,
      firstSeen: issue.firstSeen || null,
      shortId: issue.shortId || "N/A",
      level: issue.level || null,
      status: issue.status || null,
      permalink: issue.permalink || `https://sentry.io/organizations/${org}/issues/`,
    }));

    // Calculate stats from issues (sum of event counts)
    const totalEvents24h = issues.reduce((sum, issue) => sum + issue.count, 0);

    return {
      summary: {
        totalEvents24h,
        totalEventsPrev24h: 0, // Not available without events-stats API
        trendPct: 0, // Not available without events-stats API
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

/**
 * Admin: List Users with Pagination
 * Returns a paginated list of users for the Users tab
 * Supports sorting by: createdAt (default), lastActive, nickname
 */
interface ListUsersRequest {
  limit?: number;
  startAfterUid?: string;
  sortBy?: "createdAt" | "lastActive" | "nickname";
  sortOrder?: "asc" | "desc";
}

interface ListUsersResponse {
  users: Array<{
    uid: string;
    email: string | null;
    nickname: string;
    disabled: boolean;
    lastActive: string | null;
    createdAt: string | null;
  }>;
  hasMore: boolean;
  nextCursor: string | null;
}

/**
 * Admin: Get System Logs
 * Returns recent security events and GCP Cloud Logging deep links
 */
interface GetLogsRequest {
  limit?: number;
  severity?: "ERROR" | "WARNING" | "INFO";
}

interface LogEntry {
  id: string;
  type: string;
  severity: "INFO" | "WARNING" | "ERROR";
  functionName: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export const adminGetLogs = onCall<GetLogsRequest>(async (request) => {
  await requireAdmin(request, "adminGetLogs");

  const { limit: rawLimit = 50, severity } = request.data || {};

  // SECURITY: Validate and clamp limit
  const MAX_LIMIT = 100;
  const MIN_LIMIT = 1;
  const limit =
    typeof rawLimit === "number" && Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.floor(rawLimit), MIN_LIMIT), MAX_LIMIT)
      : 50;

  try {
    const db = admin.firestore();

    // Build query for security_logs collection - conditionally add severity filter
    let query: admin.firestore.Query = db.collection("security_logs");

    // Add severity filter if provided (validated against allowed values)
    if (severity && ["ERROR", "WARNING", "INFO"].includes(severity)) {
      query = query.where("severity", "==", severity);
    }

    // Apply ordering and limit
    query = query.orderBy("timestamp", "desc").limit(limit);

    const snapshot = await query.get();

    const logs: LogEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      // ROBUSTNESS: Validate metadata is a plain object before redaction
      // Prevents type violations in API response if metadata is corrupt
      const rawMetadata = data.metadata;
      // ROBUSTNESS: Convert Timestamps to ISO strings, then redact sensitive keys
      // Double-check output remains an object after transformation
      const safeMetadata = (() => {
        if (!rawMetadata || typeof rawMetadata !== "object" || Array.isArray(rawMetadata)) {
          return undefined;
        }
        const converted = toJsonSafe(
          redactSensitiveMetadata(rawMetadata as Record<string, unknown>)
        );
        // Verify toJsonSafe didn't return non-object (edge case protection)
        return converted && typeof converted === "object" && !Array.isArray(converted)
          ? (converted as Record<string, unknown>)
          : undefined;
      })();

      // ROBUSTNESS: Clamp severity to allowed values
      const rawSeverity = data.severity;
      const safeSeverity: "INFO" | "WARNING" | "ERROR" =
        rawSeverity === "ERROR" || rawSeverity === "WARNING" || rawSeverity === "INFO"
          ? rawSeverity
          : "INFO";

      return {
        id: doc.id,
        type: data.type || "UNKNOWN",
        severity: safeSeverity,
        functionName: data.functionName || "unknown",
        message: data.message || "",
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
        // SECURITY: Defense-in-depth - redact metadata even though write-time redaction exists
        // Protects against bugs in write-time redaction and legacy data
        metadata: safeMetadata,
      };
    });

    // Generate GCP Cloud Logging deep links
    // Format: https://console.cloud.google.com/logs/query;query=QUERY;storageScope=project;timeRange=PT24H?project=PROJECT_ID
    // Note: project must be a query param (after ?), timeRange as path param for 24h window
    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "sonash-app";
    const baseUrl = `https://console.cloud.google.com/logs/query`;

    // URL-encode query strings for GCP Logs Explorer
    const encodeQuery = (query: string) => encodeURIComponent(query);

    // Build URL with proper GCP format: path params with ; then query params with ?
    const buildGcpUrl = (query: string) =>
      `${baseUrl};query=${encodeQuery(query)};storageScope=project;timeRange=PT24H?project=${projectId}`;

    const gcpLinks = {
      allLogs: buildGcpUrl(`resource.type="cloud_function"`),
      errors: buildGcpUrl(`resource.type="cloud_function" severity=ERROR`),
      warnings: buildGcpUrl(`resource.type="cloud_function" severity>=WARNING`),
      security: buildGcpUrl(`resource.type="cloud_function" jsonPayload.securityEvent.type:*`),
      auth: buildGcpUrl(
        `resource.type="cloud_function" jsonPayload.securityEvent.type=~"AUTH|AUTHORIZATION"`
      ),
      admin: buildGcpUrl(`resource.type="cloud_function" jsonPayload.securityEvent.type=~"ADMIN"`),
    };

    // AUDIT: Log successful access to security logs for compliance traceability
    logSecurityEvent("ADMIN_ACTION", "adminGetLogs", "Admin viewed security logs", {
      userId: request.auth?.uid,
      metadata: { logsCount: logs.length, severity: severity || "all" },
      storeInFirestore: true, // Store INFO events for audit trail
    });

    return {
      logs,
      gcpLinks,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminGetLogs", "Failed to get logs", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to get logs");
  }
});

/**
 * Admin: Get Privilege Types
 * Returns all available privilege types for the system
 * ALWAYS includes built-in types (free, premium, admin) merged with custom types
 */

// Privilege type structure
interface PrivilegeType {
  id: string;
  name: string;
  description: string;
  features: string[];
  isDefault?: boolean;
}

// Built-in privilege types that are always guaranteed to exist
const BUILT_IN_PRIVILEGE_TYPES: PrivilegeType[] = [
  {
    id: "free",
    name: "Free",
    description: "Standard free tier with basic features",
    features: ["daily_check_in", "basic_journal", "meetings_view"],
    isDefault: true,
  },
  {
    id: "premium",
    name: "Premium",
    description: "Full access to all features",
    features: [
      "daily_check_in",
      "unlimited_journal",
      "meetings_view",
      "inventory_tracking",
      "export_data",
      "priority_support",
    ],
    isDefault: false,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Full system access including admin panel",
    features: ["*"],
    isDefault: false,
  },
];

export const adminGetPrivilegeTypes = onCall(async (request) => {
  await requireAdmin(request, "adminGetPrivilegeTypes");

  try {
    const db = admin.firestore();
    const privilegesDoc = await db.collection("system").doc("privileges").get();

    if (!privilegesDoc.exists) {
      // Return default privilege types if not configured
      return { types: [...BUILT_IN_PRIVILEGE_TYPES] };
    }

    const data = privilegesDoc.data();
    const storedTypes = Array.isArray(data?.types) ? data.types : [];

    // ROBUSTNESS: Validate and sanitize custom types from Firestore
    // Filters out malformed entries and ensures consistent shape
    const customTypes: PrivilegeType[] = storedTypes
      .filter(
        (t: unknown): t is PrivilegeType =>
          !!t &&
          typeof t === "object" &&
          "id" in t &&
          typeof (t as PrivilegeType).id === "string" &&
          !!(t as PrivilegeType).id &&
          !["free", "premium", "admin"].includes((t as PrivilegeType).id) &&
          "name" in t &&
          typeof (t as PrivilegeType).name === "string" &&
          Array.isArray((t as PrivilegeType).features)
      )
      .map((t) => ({
        id: t.id,
        name: t.name,
        description: typeof t.description === "string" ? t.description : "",
        features: t.features.filter((f) => typeof f === "string"),
        isDefault: !!t.isDefault,
      }));

    // Merge built-in and custom types, ensure only one default
    const merged = [...BUILT_IN_PRIVILEGE_TYPES, ...customTypes];
    const defaultId = merged.find((t) => t.isDefault)?.id ?? "free";

    return { types: normalizePrivilegeDefaults(merged, defaultId) };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminGetPrivilegeTypes", "Failed to get privilege types", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to get privilege types");
  }
});

/**
 * Admin: Save Privilege Type
 * Creates or updates a privilege type
 */
interface SavePrivilegeTypeRequest {
  privilegeType: {
    id: string;
    name: string;
    description: string;
    features: string[];
    isDefault?: boolean;
  };
}

// Schema validation for privilege type inputs
const privilegeTypeSchema = z.object({
  id: z
    .string()
    .min(1, "ID is required")
    .max(50, "ID must be 50 characters or less")
    .regex(/^[a-z0-9_-]+$/, "ID must be lowercase alphanumeric with hyphens/underscores"),
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").default(""),
  features: z.array(z.string().max(100)).max(50, "Maximum 50 features allowed").default([]),
  isDefault: z.boolean().optional(),
});

/**
 * Normalize privilege type defaults - ensures only one type is marked as default
 * @param types - Array of privilege types
 * @param newDefaultId - ID of the new default type (if setting a default)
 * @returns Normalized array with only one default
 */
function normalizePrivilegeDefaults(
  types: PrivilegeType[],
  newDefaultId?: string
): PrivilegeType[] {
  if (!newDefaultId) return types;
  return types.map((t) => ({
    ...t,
    isDefault: t.id === newDefaultId,
  }));
}

export const adminSavePrivilegeType = onCall<SavePrivilegeTypeRequest>(async (request) => {
  await requireAdmin(request, "adminSavePrivilegeType");

  const { privilegeType } = request.data;

  if (!privilegeType || !privilegeType.id || !privilegeType.name) {
    throw new HttpsError("invalid-argument", "Privilege type ID and name are required");
  }

  // SECURITY: Validate privilege type with schema
  const parseResult = privilegeTypeSchema.safeParse(privilegeType);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(", ");
    throw new HttpsError("invalid-argument", `Invalid privilege type: ${errorMessages}`);
  }
  const validatedType = parseResult.data;

  // SECURITY: Prevent modifying any built-in types
  if (["admin", "free", "premium"].includes(validatedType.id)) {
    throw new HttpsError("permission-denied", "Cannot modify built-in privilege types");
  }

  logSecurityEvent("ADMIN_ACTION", "adminSavePrivilegeType", "Admin saved privilege type", {
    userId: request.auth?.uid,
    metadata: { privilegeTypeId: validatedType.id },
    severity: "INFO",
    storeInFirestore: true,
  });

  try {
    const db = admin.firestore();
    const privilegesRef = db.collection("system").doc("privileges");

    // CONCURRENCY: Use transaction to prevent race conditions
    await db.runTransaction(async (transaction) => {
      const privilegesDoc = await transaction.get(privilegesRef);

      let types: Array<{
        id: string;
        name: string;
        description: string;
        features: string[];
        isDefault?: boolean;
      }> = [];

      if (privilegesDoc.exists) {
        const stored = privilegesDoc.data()?.types;
        // ROBUSTNESS: Validate that types field is actually an array to prevent runtime errors
        types = Array.isArray(stored) ? stored : [];
      }

      // Find and update existing type or add new one
      const existingIndex = types.findIndex((t) => t.id === validatedType.id);
      if (existingIndex >= 0) {
        types[existingIndex] = validatedType;
      } else {
        types.push(validatedType);
      }

      // Normalize defaults - ensures only one type is marked as default
      if (validatedType.isDefault) {
        types = normalizePrivilegeDefaults(types, validatedType.id);
      }

      transaction.set(privilegesRef, {
        types,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { success: true, id: validatedType.id };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminSavePrivilegeType", "Failed to save privilege type", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to save privilege type");
  }
});

/**
 * Admin: Delete Privilege Type
 * Deletes a custom privilege type
 */
interface DeletePrivilegeTypeRequest {
  privilegeTypeId: string;
}

export const adminDeletePrivilegeType = onCall<DeletePrivilegeTypeRequest>(async (request) => {
  await requireAdmin(request, "adminDeletePrivilegeType");

  const { privilegeTypeId } = request.data;

  if (!privilegeTypeId) {
    throw new HttpsError("invalid-argument", "Privilege type ID is required");
  }

  // Prevent deleting built-in types
  if (["admin", "premium", "free"].includes(privilegeTypeId)) {
    throw new HttpsError("permission-denied", "Cannot delete built-in privilege types");
  }

  logSecurityEvent("ADMIN_ACTION", "adminDeletePrivilegeType", "Admin deleted privilege type", {
    userId: request.auth?.uid,
    metadata: { privilegeTypeId },
    severity: "WARNING",
    storeInFirestore: true,
  });

  try {
    const db = admin.firestore();
    const privilegesRef = db.collection("system").doc("privileges");
    const privilegesDoc = await privilegesRef.get();

    if (!privilegesDoc.exists) {
      throw new HttpsError("not-found", "Privilege types not configured");
    }

    // SAFETY: Block deletion if any users still have this privilege type assigned
    const usersWithPrivilege = await db
      .collection("users")
      .where("privilegeType", "==", privilegeTypeId)
      .limit(1)
      .get();

    if (!usersWithPrivilege.empty) {
      throw new HttpsError(
        "failed-precondition",
        "Cannot delete privilege type while it is assigned to users"
      );
    }

    // ROBUSTNESS: Use Array.isArray guard for corrupt data protection
    const storedTypes = privilegesDoc.data()?.types;
    let types = Array.isArray(storedTypes) ? storedTypes : [];
    types = types.filter(
      (t: { id: string; name: string; description: string; features: string[] }) =>
        t.id !== privilegeTypeId
    );

    await privilegesRef.update({ types, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logSecurityEvent("ADMIN_ERROR", "adminDeletePrivilegeType", "Failed to delete privilege type", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to delete privilege type");
  }
});

/**
 * Admin: Set User Privilege
 * Assigns a privilege type to a user
 */
interface SetUserPrivilegeRequest {
  uid: string;
  privilegeTypeId: string;
}

export const adminSetUserPrivilege = onCall<SetUserPrivilegeRequest>(async (request) => {
  await requireAdmin(request, "adminSetUserPrivilege");

  const { uid, privilegeTypeId } = request.data;

  if (!uid || !privilegeTypeId) {
    throw new HttpsError("invalid-argument", "User ID and privilege type ID are required");
  }

  // SECURITY: Hash targetUid to prevent PII exposure in logs
  logSecurityEvent("ADMIN_ACTION", "adminSetUserPrivilege", "Admin set user privilege", {
    userId: request.auth?.uid,
    metadata: { targetUidHash: hashUserId(uid), privilegeTypeId },
    severity: "INFO",
    storeInFirestore: true,
  });

  try {
    const db = admin.firestore();

    // Verify privilege type exists
    const privilegesDoc = await db.collection("system").doc("privileges").get();
    const storedTypes = privilegesDoc.data()?.types;
    // ROBUSTNESS: Guard against malformed Firestore data
    const types = Array.isArray(storedTypes) ? storedTypes : [];
    const privilegeType = types.find(
      (t: { id: string; name: string; description: string; features: string[] }) =>
        t.id === privilegeTypeId
    );

    // Allow setting to default types even if not in DB
    if (!privilegeType && !["admin", "premium", "free"].includes(privilegeTypeId)) {
      throw new HttpsError("not-found", "Privilege type not found");
    }

    // SECURITY: Asymmetric fail-safe order for privilege changes
    // - GRANT admin: Firestore first, then claims (prevents dangling admin if Firestore fails)
    // - REVOKE admin: Claims first, then Firestore (fail-closed: user loses access immediately)
    const authUser = await admin.auth().getUser(uid);
    const currentClaims = authUser.customClaims || {};

    // ATOMICITY: Store previous privilege for accurate rollback (not hardcoded "free")
    const userRef = db.collection("users").doc(uid);
    const prevPrivilegeType = await getPreviousPrivilegeType(uid, db);

    if (privilegeTypeId === "admin") {
      // GRANTING admin: Write Firestore FIRST, then set claims
      // If Firestore fails, user won't get admin claims (fail-safe)
      // ROBUSTNESS: Use set() with merge to handle case where user doc doesn't exist
      await userRef.set(
        {
          privilegeType: privilegeTypeId,
          privilegeUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          privilegeUpdatedBy: request.auth?.uid,
        },
        { merge: true }
      );

      try {
        await admin.auth().setCustomUserClaims(uid, { ...currentClaims, admin: true });
      } catch (claimsError) {
        // ATOMICITY: Roll back to ACTUAL previous privilege, not hardcoded "free"
        await userRef.set(
          {
            privilegeType: prevPrivilegeType,
            privilegeUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            privilegeUpdatedBy: request.auth?.uid,
          },
          { merge: true }
        );
        throw claimsError;
      }
    } else {
      // REVOKING admin (or setting non-admin): Remove claim FIRST, then Firestore
      // If Firestore fails, user already lost admin access (fail-closed)
      if (currentClaims.admin) {
        await admin.auth().setCustomUserClaims(uid, { ...currentClaims, admin: null });
      }
      // ROBUSTNESS: Use set() with merge to handle case where user doc doesn't exist
      await userRef.set(
        {
          privilegeType: privilegeTypeId,
          privilegeUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          privilegeUpdatedBy: request.auth?.uid,
        },
        { merge: true }
      );
    }

    return { success: true, message: `User privilege set to ${privilegeTypeId}` };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logSecurityEvent("ADMIN_ERROR", "adminSetUserPrivilege", "Failed to set user privilege", {
      userId: request.auth?.uid,
      metadata: { error: String(error), targetUidHash: hashUserId(uid) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to set user privilege");
  }
});

export const adminListUsers = onCall<ListUsersRequest>(async (request) => {
  await requireAdmin(request, "adminListUsers");

  const {
    limit: rawLimit = 20,
    startAfterUid,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = request.data || {};

  // SECURITY: Validate and clamp limit
  const MAX_LIMIT = 50;
  const MIN_LIMIT = 1;
  const limit =
    typeof rawLimit === "number" && Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.floor(rawLimit), MIN_LIMIT), MAX_LIMIT)
      : 20;

  // Validate sortBy to prevent injection
  const allowedSortFields = ["createdAt", "lastActive", "nickname"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const safeSortOrder: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";

  logSecurityEvent("ADMIN_ACTION", "adminListUsers", "Admin listed users", {
    userId: request.auth?.uid,
    metadata: { limit, sortBy: safeSortBy, sortOrder: safeSortOrder, hasCursor: !!startAfterUid },
  });

  try {
    const db = admin.firestore();

    // Build query with deterministic tie-breaker for stable pagination
    let query = db
      .collection("users")
      .orderBy(safeSortBy, safeSortOrder)
      .orderBy(admin.firestore.FieldPath.documentId(), safeSortOrder)
      .limit(limit + 1); // Fetch one extra to check if there's more

    // Apply cursor if provided
    if (startAfterUid) {
      const cursorDoc = await db.collection("users").doc(startAfterUid).get();
      if (cursorDoc.exists) {
        const cursorData = cursorDoc.data() as Record<string, unknown> | undefined;
        const sortValue = buildCursorValue(cursorData?.[safeSortBy], safeSortBy, safeSortOrder);
        query = query.startAfter(sortValue, cursorDoc.id);
      }
    }

    const snapshot = await query.get();

    // Check if there are more results
    const hasMore = snapshot.docs.length > limit;
    const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

    // Batch fetch auth users
    const uids = docs.map((d) => d.id);
    const authByUid = await batchFetchAuthUsers(uids, (error) => {
      logSecurityEvent("ADMIN_ERROR", "adminListUsers", "Batch auth fetch failed", {
        userId: request.auth?.uid,
        // Review #187: Sanitize error to prevent PII leakage in logs
        metadata: { error: sanitizeErrorMessage(error), uidsCount: uids.length },
        captureToSentry: true,
      });
    });

    // Build user list with batched auth data
    const users: ListUsersResponse["users"] = docs.map((doc) => {
      const userData = doc.data();
      const authUser = authByUid.get(doc.id);

      return {
        uid: doc.id,
        email: authUser?.email || null,
        nickname: userData.nickname || "Anonymous",
        disabled: authUser?.disabled || false,
        lastActive: userData.lastActive?.toDate().toISOString() || null,
        createdAt: userData.createdAt?.toDate().toISOString() || null,
      };
    });

    return {
      users,
      hasMore,
      nextCursor: hasMore && docs.length > 0 ? docs[docs.length - 1].id : null,
    };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminListUsers", "Failed to list users", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to list users");
  }
});

// ============================================================================
// QUICK WIN FUNCTIONS - Admin Dashboard Enhancements
// ============================================================================

/**
 * Admin: Send Password Reset Email
 * Sends a password reset email to a user using Firebase Auth REST API
 *
 * Note: The Admin SDK's generatePasswordResetLink() only generates a link but doesn't
 * send an email. We use the Firebase Auth REST API to actually send the email.
 */
interface SendPasswordResetRequest {
  email: string;
}

// Web API Key for Firebase Auth REST API calls
// Stored in GCP Secret Manager even though it's technically a "public" key
// This prevents abuse via direct API calls if the repo is compromised
// Set via: firebase functions:secrets:set AUTH_REST_API_KEY
const authApiKey = defineSecret("AUTH_REST_API_KEY");

export const adminSendPasswordReset = onCall<SendPasswordResetRequest>(
  { secrets: [authApiKey] },
  async (request) => {
    await requireAdmin(request, "adminSendPasswordReset");

    const { email } = request.data;

    if (!email || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "Valid email is required");
    }

    // First verify the user exists using Admin SDK
    try {
      await admin.auth().getUserByEmail(email);
    } catch (error) {
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === "auth/user-not-found") {
        throw new HttpsError("not-found", "No user found with this email address");
      }
      throw error;
    }

    try {
      // Use Firebase Auth REST API to send password reset email
      // This actually sends the email using Firebase's built-in email templates
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);

      let response: Response;
      try {
        response = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${authApiKey.value()}`,
          {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              requestType: "PASSWORD_RESET",
              email: email,
            }),
          }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = (errorData as { error?: { message?: string } })?.error?.message;

        // Handle specific Firebase Auth errors
        if (errorMessage === "EMAIL_NOT_FOUND") {
          throw new HttpsError("not-found", "No user found with this email address");
        }

        throw new Error(`Firebase Auth API error: ${errorMessage || response.status}`);
      }

      // Log success only after email was actually sent
      logSecurityEvent(
        "ADMIN_ACTION",
        "adminSendPasswordReset",
        "Admin sent password reset email",
        {
          userId: request.auth?.uid,
          metadata: { targetEmailHash: hashUserId(email.trim().toLowerCase()) },
          severity: "INFO",
          storeInFirestore: true,
        }
      );

      return {
        success: true,
        message: "Password reset email sent successfully",
      };
    } catch (error) {
      // Don't log if it's already an HttpsError (already handled)
      if (error instanceof HttpsError) {
        throw error;
      }

      // SECURITY: Sanitize error to avoid leaking API key from URL
      // Only log error name/code, never full message which could contain secrets
      const safeErrorInfo =
        error instanceof Error
          ? { name: error.name, code: (error as { code?: string }).code }
          : { type: typeof error };
      logSecurityEvent("ADMIN_ERROR", "adminSendPasswordReset", "Failed to send password reset", {
        userId: request.auth?.uid,
        metadata: { error: safeErrorInfo },
        captureToSentry: true,
      });
      throw new HttpsError("internal", "Failed to send password reset email");
    }
  }
);

/**
 * Admin: Get Storage Statistics
 * Returns storage usage statistics
 */
export const adminGetStorageStats = onCall(async (request) => {
  await requireAdmin(request, "adminGetStorageStats");

  logSecurityEvent("ADMIN_ACTION", "adminGetStorageStats", "Admin requested storage stats", {
    userId: request.auth?.uid,
    severity: "INFO",
  });

  try {
    const bucket = admin.storage().bucket();

    // Get files with bounded pagination to prevent timeout/memory issues
    // Safety cap at 10,000 files - adjust based on operational limits
    const MAX_FILES = 10000;
    const files: Array<{ name: string; metadata: { size?: string | number } }> = [];
    let pageToken: string | undefined;

    do {
      const [page, , resp] = await bucket.getFiles({
        autoPaginate: false,
        maxResults: Math.min(1000, MAX_FILES - files.length),
        pageToken,
      });

      files.push(...page);
      pageToken = (resp as { nextPageToken?: string } | undefined)?.nextPageToken;

      if (files.length >= MAX_FILES) break;
    } while (pageToken);

    const truncated = files.length >= MAX_FILES;

    let totalSize = 0;
    let fileCount = 0;
    const userFiles: Record<string, { count: number; size: number }> = {};
    const fileTypes: Record<string, { count: number; size: number }> = {};

    for (const file of files) {
      const metadata = file.metadata;
      const parsedSize = parseInt(String(metadata.size || "0"), 10);
      const size = Number.isNaN(parsedSize) ? 0 : parsedSize;
      totalSize += size;
      fileCount++;

      // Extract user ID from path using helper
      const userId = extractUserIdFromPath(file.name);
      if (userId) {
        if (!userFiles[userId]) {
          userFiles[userId] = { count: 0, size: 0 };
        }
        userFiles[userId].count++;
        userFiles[userId].size += size;
      }

      // Track file types using helper
      const ext = extractFileExtension(file.name);
      if (!fileTypes[ext]) {
        fileTypes[ext] = { count: 0, size: 0 };
      }
      fileTypes[ext].count++;
      fileTypes[ext].size += size;
    }

    // Find orphaned files using helper
    const db = admin.firestore();
    const orphaned = await findOrphanedStorageFiles(userFiles, db);

    return {
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      fileCount,
      userCount: Object.keys(userFiles).length,
      orphanedFiles: {
        count: orphaned.count,
        size: orphaned.size,
        sizeFormatted: formatBytes(orphaned.size),
      },
      fileTypes: Object.entries(fileTypes)
        .map(([ext, data]) => ({
          extension: ext,
          count: data.count,
          size: data.size,
          sizeFormatted: formatBytes(data.size),
        }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 10),
      truncated, // True if we hit the 10,000 file safety cap
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminGetStorageStats", "Failed to get storage stats", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to get storage statistics");
  }
});

/**
 * Helper: Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Admin: Get Rate Limit Status
 * Returns current rate limit status for monitoring
 */
export const adminGetRateLimitStatus = onCall(async (request) => {
  await requireAdmin(request, "adminGetRateLimitStatus");

  logSecurityEvent("ADMIN_ACTION", "adminGetRateLimitStatus", "Admin requested rate limit status", {
    userId: request.auth?.uid,
    severity: "INFO",
  });

  try {
    const db = admin.firestore();
    const now = Date.now();

    // Get recent rate limit documents
    const rateLimitsSnapshot = await db
      .collection("rate_limits")
      .orderBy("updatedAt", "desc")
      .limit(100)
      .get();

    const activeLimits: Array<{
      key: string;
      type: string;
      points: number;
      maxPoints: number;
      resetAt: string;
      isBlocked: boolean;
    }> = [];

    const expiredCount = { count: 0 };

    for (const doc of rateLimitsSnapshot.docs) {
      const data = doc.data();

      // Normalize timestamp using extracted helper
      const resetAtMs = normalizeTimestampToMs(data.resetAt);

      // Skip entries with invalid timestamps
      if (!Number.isFinite(resetAtMs)) {
        continue;
      }

      if (resetAtMs < now) {
        expiredCount.count++;
        continue;
      }

      // Parse the key to determine type
      const keyParts = doc.id.split(":");
      const type = keyParts[0] || "unknown";

      // Create Date and validate it can be serialized
      // Out-of-range timestamps can cause toISOString() to throw
      const resetDate = new Date(resetAtMs);
      if (Number.isNaN(resetDate.getTime())) {
        continue;
      }

      activeLimits.push({
        key: doc.id,
        type,
        points: data.points || 0,
        maxPoints: data.maxPoints || 10,
        resetAt: resetDate.toISOString(),
        isBlocked: (data.points || 0) >= (data.maxPoints || 10),
      });
    }

    // Sort by points descending (most rate-limited first)
    activeLimits.sort((a, b) => b.points - a.points);

    // Aggregate counts by type using extracted helper
    const byType = aggregateRateLimitsByType(activeLimits);

    return {
      activeLimits: activeLimits.slice(0, 50), // Return top 50
      totalActive: activeLimits.length,
      totalBlocked: activeLimits.filter((l) => l.isBlocked).length,
      expiredPendingCleanup: expiredCount.count,
      byType: Object.entries(byType).map(([type, data]) => ({
        type,
        ...data,
      })),
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminGetRateLimitStatus", "Failed to get rate limit status", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to get rate limit status");
  }
});

/**
 * Admin: Clear Rate Limit
 * Manually clears rate limit for a specific key
 */
interface ClearRateLimitRequest {
  key: string;
}

export const adminClearRateLimit = onCall<ClearRateLimitRequest>(async (request) => {
  await requireAdmin(request, "adminClearRateLimit");

  const { key } = request.data;

  if (!key) {
    throw new HttpsError("invalid-argument", "Rate limit key is required");
  }

  // SECURITY: Validate key format to prevent path traversal and DoS abuse
  // Rate limit keys should be alphanumeric with colons/underscores/hyphens only
  if (key.includes("/") || key.includes("\\")) {
    throw new HttpsError("invalid-argument", "Invalid rate limit key format");
  }
  if (key.length > 256) {
    throw new HttpsError("invalid-argument", "Invalid rate limit key format");
  }
  if (!/^[a-z0-9:_-]+$/i.test(key)) {
    throw new HttpsError("invalid-argument", "Invalid rate limit key format");
  }

  // Hash key for logging to avoid exposing potential PII (user IDs, IPs, emails)
  const hashedKey = hashUserId(key);

  logSecurityEvent("ADMIN_ACTION", "adminClearRateLimit", "Admin cleared rate limit", {
    userId: request.auth?.uid,
    metadata: { rateLimitKeyHash: hashedKey },
    severity: "WARNING",
    storeInFirestore: true,
  });

  try {
    const db = admin.firestore();
    await db.collection("rate_limits").doc(key).delete();

    return { success: true, message: "Rate limit cleared successfully" };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminClearRateLimit", "Failed to clear rate limit", {
      userId: request.auth?.uid,
      metadata: { error: String(error), rateLimitKeyHash: hashedKey },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to clear rate limit");
  }
});

/**
 * Admin: Get Collection Statistics
 * Returns document counts and estimated sizes for all collections
 */
export const adminGetCollectionStats = onCall(async (request) => {
  await requireAdmin(request, "adminGetCollectionStats");

  logSecurityEvent("ADMIN_ACTION", "adminGetCollectionStats", "Admin requested collection stats", {
    userId: request.auth?.uid,
    severity: "INFO",
  });

  try {
    const db = admin.firestore();

    // Collections to analyze
    const collections = [
      { name: "users", isUserData: true },
      { name: "meetings", isUserData: false },
      { name: "sober_living", isUserData: false },
      { name: "daily_quotes", isUserData: false },
      { name: "recovery_glossary", isUserData: false },
      { name: "slogans", isUserData: false },
      { name: "quick_links", isUserData: false },
      { name: "prayers", isUserData: false },
      { name: "rate_limits", isUserData: false },
      { name: "admin_jobs", isUserData: false },
      { name: "security_logs", isUserData: false },
      { name: "system", isUserData: false },
    ];

    const stats: Array<{
      collection: string;
      count: number;
      hasSubcollections?: boolean;
      subcollectionEstimate?: number;
    }> = [];

    for (const col of collections) {
      try {
        // Use count() for efficient counting (Firestore aggregation)
        const countSnapshot = await db.collection(col.name).count().get();
        const count = countSnapshot.data().count;

        const colStat: {
          collection: string;
          count: number;
          hasSubcollections?: boolean;
          subcollectionEstimate?: number;
        } = {
          collection: col.name,
          count: count,
        };

        // For users collection, estimate subcollection counts using helper
        if (col.name === "users" && count > 0) {
          const subResult = await estimateUserSubcollections(db, count);
          if (subResult.hasSubcollections) {
            colStat.hasSubcollections = true;
            colStat.subcollectionEstimate = subResult.estimate;
          }
        }

        stats.push(colStat);
      } catch {
        // Collection might not exist
        stats.push({
          collection: col.name,
          count: 0,
        });
      }
    }

    // Calculate totals
    const totalDocuments = stats.reduce((sum, s) => sum + s.count, 0);
    const totalSubcollectionDocs = stats
      .filter((s) => s.hasSubcollections)
      .reduce((sum, s) => sum + (s.subcollectionEstimate || 0), 0);

    return {
      collections: stats,
      totals: {
        collections: stats.length,
        documents: totalDocuments,
        estimatedSubcollectionDocuments: totalSubcollectionDocs,
        estimatedTotal: totalDocuments + totalSubcollectionDocs,
      },
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logSecurityEvent("ADMIN_ERROR", "adminGetCollectionStats", "Failed to get collection stats", {
      userId: request.auth?.uid,
      metadata: { error: String(error) },
      captureToSentry: true,
    });
    throw new HttpsError("internal", "Failed to get collection statistics");
  }
});
