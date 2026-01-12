/**
 * Firestore Service Module
 *
 * Provides a centralized interface for all Firestore database operations.
 * Implements security validation, rate limiting, and Cloud Function integration.
 *
 * @module lib/firestore-service
 *
 * @example
 * import { FirestoreService } from '@/lib/firestore-service'
 *
 * // Save daily log via Cloud Function
 * await FirestoreService.saveDailyLog(userId, { content: 'Today was...', mood: 'hopeful' })
 *
 * // Get today's log
 * const { log, error } = await FirestoreService.getTodayLog(userId)
 *
 * @see {@link lib/security/firestore-validation} for security utilities
 * @see {@link lib/utils/rate-limiter} for rate limiting configuration
 */
import { db as defaultDb } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { assertUserScope, validateUserDocumentPath } from "./security/firestore-validation";
import { logger as defaultLogger, maskIdentifier } from "./logger";
import { saveDailyLogLimiter, readLimiter } from "./utils/rate-limiter";
import { buildPath, QUERY_LIMITS } from "./constants";
import { getTodayDateId } from "./utils/date-utils";
import { retryCloudFunction } from "./utils/retry";
import { getRecaptchaToken } from "./recaptcha";
import {
  getCloudFunctionErrorMessage,
  isCloudFunctionError,
  type HandleErrorOptions,
} from "./utils/callable-errors";
import type { DailyLog, DailyLogResult, DailyLogHistoryResult } from "./types/daily-log";

/**
 * Shared error handler for Cloud Function calls in FirestoreService.
 * Consolidates duplicate error handling logic from saveDailyLog and saveNotebookJournalEntry.
 * CANON-0006: Reduces code duplication.
 */
function handleCloudFunctionCallError(
  error: unknown,
  userId: string,
  logger: typeof defaultLogger,
  options: HandleErrorOptions & { operation: string }
): never {
  const maskedUserId = maskIdentifier(userId);

  // Debug: Log error code only (not full object) in development
  if (process.env.NODE_ENV === "development") {
    console.error(
      `❌ Cloud Function error during ${options.operation}:`,
      isCloudFunctionError(error) ? error.code : "non-CF-error"
    );
  }

  // Log error with appropriate severity based on error type
  if (isCloudFunctionError(error)) {
    if (error.code === "functions/resource-exhausted") {
      logger.warn("Rate limit exceeded", { userId: maskedUserId });
    } else if (error.code === "functions/invalid-argument") {
      logger.error("Invalid data sent to Cloud Function", {
        userId: maskedUserId,
        code: error.code,
      });
    } else {
      logger.error("Cloud Function call failed", {
        userId: maskedUserId,
        code: error.code,
      });
    }
  } else {
    logger.error("Cloud Function call failed", {
      userId: maskedUserId,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
  }

  // Extract user-friendly message using consolidated utility
  const errorMessage = getCloudFunctionErrorMessage(error, options);
  // Preserve original error for debugging (Error.cause is ES2022)
  throw new Error(errorMessage, { cause: error });
}

// Re-export types for backwards compatibility
export type { DailyLog, DailyLogHistoryResult };
export type TodayLogResult = DailyLogResult;

type FirestoreDependencies = {
  db: typeof defaultDb;
  assertUserScope: typeof assertUserScope;
  validateUserDocumentPath: typeof validateUserDocumentPath;
  collection: typeof collection;
  doc: typeof doc;
  setDoc: typeof setDoc;
  getDoc: typeof getDoc;
  getDocs: typeof getDocs;
  query: typeof query;
  orderBy: typeof orderBy;
  limit: typeof limit;
  serverTimestamp: typeof serverTimestamp;
  logger: typeof defaultLogger;
};

const defaultDeps: FirestoreDependencies = {
  db: defaultDb,
  assertUserScope,
  validateUserDocumentPath,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  logger: defaultLogger,
};

/**
 * Factory function to create a Firestore service instance.
 * Allows dependency injection for testing.
 *
 * @param overrides - Optional dependency overrides for testing
 * @returns Firestore service instance with all database operations
 */
export const createFirestoreService = (overrides: Partial<FirestoreDependencies> = {}) => {
  const deps = { ...defaultDeps, ...overrides };

  const ensureValidUser = (userId: string) => {
    if (!userId?.trim()) {
      throw new Error("User ID is required for Firestore operations.");
    }
  };

  const rateLimitError = (
    limiter: typeof saveDailyLogLimiter,
    label: "Save" | "Read",
    userId: string
  ) => {
    if (limiter.canMakeRequest()) return null;

    const waitTime = Math.ceil(limiter.getTimeUntilNextRequest() / 1000);
    deps.logger.warn(`${label} rate limit exceeded`, { userId: maskIdentifier(userId), waitTime });
    return new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
  };

  const getValidatedDocRef = (userId: string, dateId: string) => {
    const targetPath = buildPath.dailyLog(userId, dateId);
    deps.validateUserDocumentPath(userId, targetPath);
    return deps.doc(deps.db, targetPath);
  };

  return {
    /**
     * Save/Update a daily log entry via Cloud Function
     * Enforces server-side validation and rate limiting.
     *
     * @param userId - ID of the user owning the log
     * @param data - Partial log data to save
     * @throws {Error} If validation fails or rate limit exceeded
     */
    async saveDailyLog(userId: string, data: Partial<DailyLog>) {
      ensureValidUser(userId);
      deps.assertUserScope({ userId });

      const rateError = rateLimitError(saveDailyLogLimiter, "Save", userId);
      if (rateError) throw rateError;

      try {
        // Get reCAPTCHA token for bot protection
        const recaptchaToken = await getRecaptchaToken("save_daily_log");

        // Call Cloud Function for server-side rate limiting and validation
        // This cannot be bypassed by client-side modifications
        const { getFunctions, httpsCallable } = await import("firebase/functions");
        const functions = getFunctions();
        const saveDailyLogFn = httpsCallable(functions, "saveDailyLog");

        // CRITICAL: Always use YYYY-MM-DD format for date (document ID format)
        const todayId = getTodayDateId(); // e.g., "2025-12-13"

        const payload: Record<string, unknown> = {
          userId,
          date: todayId, // Use document ID format, not display format
          content: data.content || "",
          mood: data.mood || null,
          cravings: data.cravings,
          used: data.used,
          recaptchaToken, // Include for server-side verification
        };

        // The Cloud Function may reject nulls; omit fields when neutral
        if (payload.cravings === null || payload.cravings === undefined) {
          delete payload.cravings;
        }
        if (payload.used === null || payload.used === undefined) {
          delete payload.used;
        }
        if (payload.mood === null || payload.mood === undefined) {
          delete payload.mood;
        }

        deps.logger.info("Calling Cloud Function", {
          userId: maskIdentifier(userId),
          date: todayId,
          hasContent: !!data.content,
        });

        // Debug: Log sanitized payload (development only)
        // Mask content field to prevent sensitive journal data from leaking
        if (process.env.NODE_ENV === "development") {
          const sanitizedPayload = {
            ...payload,
            content: payload.content ? `(${(payload.content as string).length} chars)` : "(empty)",
          };
          console.log("📤 Sending to Cloud Function:", JSON.stringify(sanitizedPayload, null, 2));
        }

        // Retry Cloud Function call with exponential backoff for network failures
        await retryCloudFunction(saveDailyLogFn, payload, {
          maxRetries: 3,
          functionName: "saveDailyLog",
        });

        deps.logger.info("Daily log saved via Cloud Function", {
          userId: maskIdentifier(userId),
        });
      } catch (error: unknown) {
        handleCloudFunctionCallError(error, userId, deps.logger, {
          operation: "saveDailyLog",
          customMessages: {
            "functions/resource-exhausted":
              "You're saving too quickly. Please wait 60 seconds and try again.",
            "functions/unauthenticated": "Please sign in to save your journal.",
            "functions/failed-precondition": "Security check failed. Please refresh the page.",
          },
          defaultMessage: "Couldn't save your journal right now. Please try again in a moment.",
        });
      }
    },

    // Get today's log if it exists
    /**
     * Retrieve the daily log for the current date
     *
     * @param userId - ID of the user
     * @returns Object containing the log (if found) or error
     */
    async getTodayLog(userId: string): Promise<TodayLogResult> {
      ensureValidUser(userId);
      deps.assertUserScope({ userId });

      const rateError = rateLimitError(readLimiter, "Read", userId);
      if (rateError) {
        return { log: null, error: rateError };
      }

      try {
        const today = getTodayDateId();
        const docRef = getValidatedDocRef(userId, today);
        const docSnap = await deps.getDoc(docRef);

        if (docSnap.exists()) {
          return { log: docSnap.data() as DailyLog, error: null };
        }
        return { log: null, error: null };
      } catch (error: unknown) {
        // Permission denied is expected for new anonymous users without a profile
        const isPermissionDenied =
          error instanceof Error &&
          (error.message.includes("permission-denied") ||
            error.message.includes("Missing or insufficient permissions"));

        if (isPermissionDenied) {
          // Don't log as error - this is expected for new users
          return { log: null, error: null };
        }

        deps.logger.error("Failed to retrieve today's log", {
          userId: maskIdentifier(userId),
          error,
        });
        return { log: null, error };
      }
    },

    // Get history of logs
    async getHistory(userId: string): Promise<DailyLogHistoryResult> {
      ensureValidUser(userId);
      deps.assertUserScope({ userId });

      try {
        const logsRef = deps.collection(deps.db, buildPath.dailyLogsCollection(userId));
        const q = deps.query(
          logsRef,
          deps.orderBy("dateId", "desc"),
          deps.limit(QUERY_LIMITS.HISTORY_MAX)
        );
        const snapshot = await deps.getDocs(q);

        const entries = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as DailyLog
        );

        return { entries, error: null };
      } catch (error) {
        deps.logger.error("Failed to fetch history", { userId: maskIdentifier(userId), error });
        return { entries: [], error };
      }
    },

    // Get inventory entries history
    async getInventoryEntries(userId: string, limitCount = 50) {
      ensureValidUser(userId);
      deps.assertUserScope({ userId });

      try {
        const entriesRef = deps.collection(deps.db, buildPath.inventoryEntries(userId));
        const q = deps.query(
          entriesRef,
          deps.orderBy("createdAt", "desc"),
          deps.limit(limitCount || QUERY_LIMITS.INVENTORY_MAX)
        );
        const snapshot = await deps.getDocs(q);

        const entries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return { entries, error: null };
      } catch (error) {
        deps.logger.error("Failed to fetch inventory entries", {
          userId: maskIdentifier(userId),
          error,
        });
        return { entries: [], error };
      }
    },

    // Save an inventory entry (Spot Check, Night Review, etc.)
    // UPDATED: Now uses Cloud Function for server-side validation and rate limiting
    async saveInventoryEntry(
      userId: string,
      entry: {
        type: "spot-check" | "night-review" | "gratitude" | "step-1-worksheet";
        data: Record<string, unknown>;
        tags?: string[];
      }
    ) {
      ensureValidUser(userId);
      deps.assertUserScope({ userId });

      try {
        // Get reCAPTCHA token for bot protection
        const recaptchaToken = await getRecaptchaToken("save_inventory");

        // Call Cloud Function instead of direct Firestore write
        // This provides rate limiting (10 req/min) and server-side validation
        const { getFunctions, httpsCallable } = await import("firebase/functions");
        const functions = getFunctions();
        const saveInventoryFn = httpsCallable(functions, "saveInventoryEntry");

        const result = await saveInventoryFn({
          userId, // Will be validated server-side
          type: entry.type,
          data: entry.data,
          tags: entry.tags || [],
          recaptchaToken, // Include for server-side verification
        });

        const response = result.data as { success: boolean; entryId: string };
        deps.logger.info("Inventory entry saved via Cloud Function", {
          userId: maskIdentifier(userId),
          type: entry.type,
          entryId: response.entryId,
        });
        return response.entryId;
      } catch (error) {
        deps.logger.error("Failed to save inventory entry", {
          userId: maskIdentifier(userId),
          error,
        });
        throw error;
      }
    },

    // DEPRECATED: Use hooks/use-journal.ts:addEntry instead
    // Thin wrapper for backward compatibility - routes through Cloud Function
    async saveNotebookJournalEntry(
      userId: string,
      entry: {
        type:
          | "mood"
          | "daily-log"
          | "spot-check"
          | "night-review"
          | "gratitude"
          | "free-write"
          | "meeting-note"
          | "check-in"
          | "inventory"
          | "step-1-worksheet";
        data: Record<string, unknown>;
        isPrivate?: boolean;
      }
    ) {
      ensureValidUser(userId);
      deps.assertUserScope({ userId });

      try {
        // Get reCAPTCHA token for bot protection
        const recaptchaToken = await getRecaptchaToken("save_journal_entry");

        const { getFunctions, httpsCallable } = await import("firebase/functions");
        const functions = getFunctions();
        const saveJournalFn = httpsCallable(functions, "saveJournalEntry");

        const today = getTodayDateId();

        const payload = {
          userId,
          type: entry.type,
          data: entry.data,
          dateLabel: today,
          isPrivate: entry.isPrivate ?? true,
          recaptchaToken, // Include for server-side verification
        };

        // Retry Cloud Function call with exponential backoff for network failures
        const result = await retryCloudFunction(saveJournalFn, payload, {
          maxRetries: 3,
          functionName: "saveJournalEntry",
        });

        const response = result.data as { success: boolean; entryId: string };
        deps.logger.info("Notebook journal entry saved via Cloud Function", {
          userId: maskIdentifier(userId),
          type: entry.type,
          entryId: response.entryId,
        });
        return response.entryId;
      } catch (error: unknown) {
        handleCloudFunctionCallError(error, userId, deps.logger, {
          operation: "saveNotebookJournalEntry",
          customMessages: {
            "functions/resource-exhausted":
              "You're saving too quickly. Please wait 60 seconds and try again.",
            "functions/unauthenticated": "Please sign in to save your journal.",
            "functions/failed-precondition": "Security check failed. Please refresh the page.",
          },
          defaultMessage: "Couldn't save your journal right now. Please try again in a moment.",
        });
      }
    },
  };
};

export const FirestoreService = createFirestoreService();
