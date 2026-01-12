/**
 * useJournal Hook
 *
 * Provides journal entry management with real-time synchronization.
 *
 * ## Security Architecture (CANON-0043)
 *
 * This hook uses a **Cloud Functions-only validation** strategy:
 *
 * 1. **Server-side validation**: All input validation happens in Cloud Functions
 *    using Zod schemas (see functions/src/schemas.ts)
 *
 * 2. **No client-side pre-validation**: The client prepares data and sends it
 *    directly to Cloud Functions. Server errors are propagated to the UI.
 *
 * 3. **Rate limiting**: Server-side enforcement (10 req/60s for saves, 20 req/60s
 *    for deletes). Client-side limiters exist for UX feedback only.
 *
 * 4. **Why this approach**:
 *    - Single source of truth for validation logic
 *    - Simpler client code (no duplicate validation)
 *    - Server is the security boundary (client can't be trusted)
 *
 * Trade-off: Slightly slower feedback (requires network round-trip), but
 * Cloud Functions are fast (<500ms) and return clear error messages.
 *
 * See: docs/EIGHT_PHASE_REFACTOR_PLAN.md (CANON-0043 section)
 */
import { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "@/lib/firebase";
import { JournalEntry, JournalEntryType } from "@/types/journal";
import { QUERY_LIMITS } from "@/lib/constants";
import { retryCloudFunction } from "@/lib/utils/retry";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { handleCloudFunctionError } from "@/lib/utils/callable-errors";
import { useAuthCore } from "@/components/providers/auth-context";
import { logger } from "@/lib/logger";

// Helper to check for "Today" and "Yesterday"
export const getRelativeDateLabel = (dateString: string) => {
  // Use local time for date comparison to match user's perspective
  const now = new Date();
  const today = now.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toLocaleDateString("en-CA");

  if (dateString === today) return "Today";
  if (dateString === yesterday) return "Yesterday";

  // Return formatted date (e.g., "Dec 15, 2025")
  // Using dateString explicitly to avoid timezone shifts
  const [year, month, day] = dateString.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);

  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Sanitize text to prevent XSS in searchable content
// Strips HTML tags and dangerous characters while preserving readable text
function sanitizeForSearch(text: string): string {
  return (
    text
      // Remove script/style blocks first (so their contents are removed too)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      // Remove remaining HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove potentially dangerous patterns (event handlers, javascript:, data:)
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/data:text\/html/gi, "")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Generate searchable text from entry data for full-text search
// SECURITY: All text is sanitized to prevent stored XSS if rendered in admin panels
export function generateSearchableText(
  type: JournalEntryType,
  data: Record<string, unknown>
): string {
  const parts: string[] = [];

  // SAFETY: Use Array.isArray guards to prevent runtime errors from malformed data
  const items = Array.isArray(data.items) ? data.items : [];
  const feelings = Array.isArray(data.feelings) ? data.feelings : [];
  const absolutes = Array.isArray(data.absolutes) ? data.absolutes : [];

  switch (type) {
    case "daily-log":
      parts.push(sanitizeForSearch(String(data.content || "")));
      break;
    case "gratitude":
      items.forEach((item) => parts.push(sanitizeForSearch(String(item))));
      break;
    case "spot-check":
      parts.push(sanitizeForSearch(String(data.action || "")));
      feelings.forEach((f) => parts.push(sanitizeForSearch(String(f))));
      absolutes.forEach((a) => parts.push(sanitizeForSearch(String(a))));
      break;
    case "night-review":
      parts.push(sanitizeForSearch(String(data.step4_gratitude || "")));
      parts.push(sanitizeForSearch(String(data.step4_surrender || "")));
      if (data.step3_reflections && typeof data.step3_reflections === "object") {
        Object.values(data.step3_reflections as Record<string, unknown>).forEach((v: unknown) =>
          parts.push(sanitizeForSearch(String(v || "")))
        );
      }
      break;
    case "free-write":
    case "meeting-note":
      parts.push(sanitizeForSearch(String(data.title || "")));
      parts.push(sanitizeForSearch(String(data.content || "")));
      break;
    case "mood":
      parts.push(sanitizeForSearch(String(data.note || "")));
      break;
    case "inventory":
      parts.push(sanitizeForSearch(String(data.resentments || "")));
      parts.push(sanitizeForSearch(String(data.dishonesty || "")));
      parts.push(sanitizeForSearch(String(data.apologies || "")));
      parts.push(sanitizeForSearch(String(data.successes || "")));
      break;
  }

  return parts.filter(Boolean).join(" ").toLowerCase().trim();
}

// Generate auto-tags from entry type and data
export function generateTags(type: JournalEntryType, data: Record<string, unknown>): string[] {
  const tags: string[] = [type];

  // Mood-based tags
  if (data.mood) tags.push(`mood-${data.mood}`);

  // Status tags
  if (data.cravings) tags.push("cravings");
  if (data.used) tags.push("relapse");

  // Feeling tags (from spot-check)
  if (data.feelings && Array.isArray(data.feelings)) {
    tags.push(...data.feelings.map((f: string) => f.toLowerCase()));
  }

  // Absolute tags (from spot-check)
  if (data.absolutes && Array.isArray(data.absolutes)) {
    tags.push(...data.absolutes.map((a: string) => a.toLowerCase()));
  }

  return [...new Set(tags)]; // Deduplicate
}

/**
 * React hook that provides the current user's journal entries, grouped views, loading state, and actions to add or soft-delete entries.
 *
 * The hook subscribes to the authenticated user's journal and keeps a realtime list and grouped index up to the configured query limit.
 *
 * @returns An object with:
 *  - `entries`: The raw array of journal entries for the current user.
 *  - `groupedEntries`: Entries organized by relative date labels (e.g., "Today", "Yesterday", or formatted dates).
 *  - `loading`: `true` while the initial fetch or auth resolution is in progress, `false` afterwards.
 *  - `addEntry(type, data, isPrivate?)`: Async function to save a new journal entry; returns `{ success: boolean; error?: string }`.
 *  - `crumplePage(entryId)`: Async function to soft-delete an entry by id; returns `{ success: boolean; error?: string }`.
 */
export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [journalLoading, setJournalLoading] = useState(true);
  const [groupedEntries, setGroupedEntries] = useState<Record<string, JournalEntry[]>>({});

  // CANON-0044/CANON-0026: Consume user from AuthContext instead of creating
  // redundant onAuthStateChanged listener. This eliminates memory leak potential
  // and reduces unnecessary re-renders.
  const { user, loading: authLoading } = useAuthCore();

  useEffect(() => {
    // Wait for auth to resolve before setting up Firestore listener
    if (authLoading) {
      return;
    }

    if (!user) {
      setJournalLoading(false);
      setEntries([]);
      setGroupedEntries({});
      return;
    }

    // Reset loading state when starting/restarting subscription for new user
    // This prevents showing stale data during user change
    setJournalLoading(true);

    // QUERY: Get entries for this user, ordered by newest first
    // Note: Using simple query without where clause to avoid composite index requirement
    // Client-side will filter out soft-deleted entries
    // PERFORMANCE: Limit to 100 entries initially to prevent unbounded fetches
    const q = query(
      collection(db, `users/${user.uid}/journal`),
      orderBy("createdAt", "desc"),
      limit(QUERY_LIMITS.JOURNAL_MAX)
    );

    // REAL-TIME LISTENER
    const unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        const fetchedEntries: JournalEntry[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          // Filter out soft-deleted entries client-side
          if (data.isSoftDeleted) return;

          // CANON-0042: Validate timestamps - skip entries with missing/invalid timestamps
          // All entries should have valid Firestore Timestamps from Cloud Functions
          if (!data.createdAt?.toMillis || !data.updatedAt?.toMillis) {
            logger.warn(`Skipping journal entry ${doc.id}: missing or invalid timestamps`, {
              hasCreatedAt: !!data.createdAt,
              hasUpdatedAt: !!data.updatedAt,
              createdAtHasToMillis: !!data.createdAt?.toMillis,
              updatedAtHasToMillis: !!data.updatedAt?.toMillis,
            });
            return;
          }

          fetchedEntries.push({
            id: doc.id,
            ...data,
            // Convert Firestore Timestamp to millis for consistent client-side typing
            createdAt: data.createdAt.toMillis(),
            updatedAt: data.updatedAt.toMillis(),
          } as JournalEntry);
        });

        setEntries(fetchedEntries);

        // GROUPING LOGIC (The "Index" for your notebook)
        const groups: Record<string, JournalEntry[]> = {};
        fetchedEntries.forEach((entry) => {
          // SECURITY: Validate dateLabel format before grouping
          // Expected format: YYYY-MM-DD (e.g., "2025-01-15")
          const dateLabel = entry.dateLabel;
          if (
            !dateLabel ||
            typeof dateLabel !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(dateLabel)
          ) {
            // Skip entries with invalid dateLabel to prevent grouping errors
            logger.warn(`Skipping journal entry ${entry.id}: invalid dateLabel format`, {
              dateLabel: typeof dateLabel === "string" ? dateLabel.slice(0, 20) : typeof dateLabel,
            });
            return;
          }
          const label = getRelativeDateLabel(dateLabel);
          if (!groups[label]) groups[label] = [];
          groups[label].push(entry);
        });

        setGroupedEntries(groups);
        setJournalLoading(false);
      },
      (error) => {
        // CANON-0076: Log error type only - don't expose raw error objects (PII/security risk)
        logger.error("Error fetching journal entries", {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorCode: (error as { code?: string })?.code,
        });
        setJournalLoading(false);
      }
    );

    return () => unsubscribeSnapshot();
  }, [user, authLoading]);

  // ACTION: Tuck Away (Save) a new entry with metadata
  // Memoized to prevent infinite re-renders when used in component useCallback deps
  const addEntry = useCallback(
    async (
      type: JournalEntryType,
      data: Record<string, unknown>,
      isPrivate: boolean = true
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // Use user from AuthContext (already validated above)
        if (!user) {
          return {
            success: false,
            error: "Must be signed in to write in journal.",
          };
        }

        const today = new Date();
        const dateLabel = today.toLocaleDateString("en-CA"); // "YYYY-MM-DD" local

        // Generate searchable text
        const searchableText = generateSearchableText(type, data);

        // Generate auto-tags
        const tags = generateTags(type, data);

        // Denormalized fields for efficient querying
        const denormalized: Record<string, unknown> = {};
        if ("cravings" in data) denormalized.hasCravings = data.cravings;
        if ("used" in data) denormalized.hasUsed = data.used;
        if ("mood" in data) denormalized.mood = data.mood;

        // Get reCAPTCHA token for bot protection
        const recaptchaToken = await getRecaptchaToken("save_journal_entry");

        // Call Cloud Function instead of direct Firestore write
        // This ensures rate limiting, App Check, and validation are enforced server-side
        const functions = getFunctions();
        const saveJournalEntry = httpsCallable(functions, "saveJournalEntry");

        // Retry Cloud Function call with exponential backoff for network failures
        await retryCloudFunction(
          saveJournalEntry,
          {
            type,
            data,
            dateLabel,
            isPrivate,
            searchableText,
            tags,
            ...denormalized,
            recaptchaToken, // Include for server-side verification
          },
          { maxRetries: 3, functionName: "saveJournalEntry" }
        );

        return { success: true };
      } catch (error: unknown) {
        // Use consolidated error handling utility (CANON-0006)
        return handleCloudFunctionError(error, {
          operation: "save journal entry",
          defaultMessage: "Failed to save entry. Please try again.",
        });
      }
    },
    [user]
  );

  // ACTION: Crumple Page (Soft Delete)
  // Memoized to prevent infinite re-renders
  const crumplePage = useCallback(
    async (entryId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        // Use user from AuthContext (already validated above)
        if (!user) {
          return {
            success: false,
            error: "Must be signed in to delete entries.",
          };
        }

        // Get reCAPTCHA token for bot protection
        const recaptchaToken = await getRecaptchaToken("delete_journal_entry");

        // Call Cloud Function instead of direct Firestore write
        // This ensures rate limiting, App Check, and validation are enforced server-side
        const functions = getFunctions();
        const softDeleteEntry = httpsCallable(functions, "softDeleteJournalEntry");

        // Retry Cloud Function call with exponential backoff for network failures
        await retryCloudFunction(
          softDeleteEntry,
          {
            entryId,
            recaptchaToken, // Include for server-side verification
          },
          { maxRetries: 3, functionName: "softDeleteJournalEntry" }
        );

        return { success: true };
      } catch (error: unknown) {
        // Use consolidated error handling utility (CANON-0006)
        return handleCloudFunctionError(error, {
          operation: "delete journal entry",
          customMessages: {
            "functions/not-found": "Entry not found or already deleted.",
          },
          defaultMessage: "Failed to delete entry. Please try again.",
        });
      }
    },
    [user]
  );

  // Combine auth loading state with journal loading state for consumers
  const loading = authLoading || journalLoading;

  return {
    entries, // Raw list
    groupedEntries, // Organized for the UI (Today, Yesterday, etc.)
    loading,
    addEntry,
    crumplePage,
  };
}
