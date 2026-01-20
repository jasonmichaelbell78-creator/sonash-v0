/**
 * useDailyQuote Hook
 *
 * CANON-0023, CANON-0051, CANON-0073: Consolidated daily quote fetching
 *
 * Provides a single source of truth for the daily quote, eliminating
 * duplicate fetch logic across DailyQuoteCard variants.
 *
 * Features:
 * - Single fetch shared across all components using the hook
 * - Caches quote in module state to prevent redundant fetches
 * - Handles loading and error states
 * - Uses QuotesService for date-based rotation
 */
import { useState, useEffect } from "react";
import { QuotesService, type Quote } from "@/lib/db/quotes";
import { logger } from "@/lib/logger";

// Module-level cache to prevent redundant fetches across components
let cachedQuote: Quote | null = null;
let cacheDate: string | null = null;
let fetchPromise: Promise<Quote | null> | null = null;

/**
 * Get today's date string for cache invalidation
 */
function getTodayString(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
}

/**
 * Clear cache to force a fresh quote fetch.
 * Used for manual refresh and midnight auto-refresh.
 */
function clearQuoteCache(): void {
  cachedQuote = null;
  cacheDate = null;
  fetchPromise = null;
}

/**
 * Fetch and cache the daily quote
 * Returns cached quote if already fetched today
 */
async function fetchDailyQuote(): Promise<Quote | null> {
  const today = getTodayString();

  // Return cached result if already fetched today (even if result was null/empty)
  // This prevents redundant fetches when no quotes are available
  if (cacheDate === today) {
    return cachedQuote;
  }

  // If a fetch is already in progress, return that promise
  if (fetchPromise) {
    return fetchPromise;
  }

  // Start new fetch
  fetchPromise = (async () => {
    try {
      const allQuotes = await QuotesService.getAllQuotes();

      if (allQuotes.length === 0) {
        cachedQuote = null;
        cacheDate = today;
        return null;
      }

      const todayQuote = QuotesService.getQuoteForToday(allQuotes);
      cachedQuote = todayQuote;
      cacheDate = today;
      return todayQuote;
    } catch (error) {
      logger.error("Failed to fetch daily quote", {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      });
      // Cache the failure to prevent repeated fetch attempts during outages
      cachedQuote = null;
      cacheDate = today;
      return null;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export interface UseDailyQuoteResult {
  /** The current daily quote, or null if not loaded or unavailable */
  quote: Quote | null;
  /** True while the quote is being fetched */
  loading: boolean;
  /** Refresh the quote (clears cache and re-fetches) */
  refresh: () => void;
}

/**
 * Hook for accessing the daily quote
 *
 * @returns Object with quote, loading state, and refresh function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { quote, loading } = useDailyQuote();
 *
 *   if (loading) return <Spinner />;
 *   if (!quote) return null;
 *
 *   return <p>"{quote.text}" — {quote.author}</p>;
 * }
 * ```
 */
export function useDailyQuote(): UseDailyQuoteResult {
  // Only use cache if it's from today (prevents stale data on initial render)
  const today = getTodayString();
  const hasValidCacheForToday = cacheDate === today;

  const [quote, setQuote] = useState<Quote | null>(hasValidCacheForToday ? cachedQuote : null);
  // Only show loading if we haven't fetched for today yet
  const [loading, setLoading] = useState(!hasValidCacheForToday);

  useEffect(() => {
    let mounted = true;

    // If we have a valid cache for today (even if null), use it immediately
    const today = getTodayString();
    if (cacheDate === today) {
      setQuote(cachedQuote);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    // Otherwise, fetch
    setLoading(true);
    fetchDailyQuote().then((fetchedQuote) => {
      if (mounted) {
        setQuote(fetchedQuote);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Schedule automatic refresh shortly after midnight for long-lived sessions
  // This ensures the quote updates even if the user doesn't refresh the page
  useEffect(() => {
    // Only schedule if window is available (client-side)
    if (globalThis.window === undefined) {
      return undefined;
    }

    let currentTimer: number | undefined;
    let cancelled = false;

    // Handler for midnight refresh - extracted to reduce nesting
    const handleMidnightRefresh = async () => {
      clearQuoteCache();
      if (cancelled) return;

      setLoading(true);
      try {
        const newQuote = await fetchDailyQuote();
        if (cancelled) return;
        setQuote(newQuote);
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (!cancelled) scheduleNextRefresh();
    };

    // Schedule next midnight refresh
    const scheduleNextRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 5, 0); // 5 seconds after midnight to avoid edge timing
      const msUntilMidnight = nextMidnight.getTime() - now.getTime();
      currentTimer = globalThis.window.setTimeout(handleMidnightRefresh, msUntilMidnight);
    };

    scheduleNextRefresh();
    return () => {
      cancelled = true;
      if (currentTimer !== undefined) globalThis.window.clearTimeout(currentTimer);
    };
  }, []);

  const refresh = () => {
    // Clear cache and trigger re-fetch
    clearQuoteCache();
    setLoading(true);
    fetchDailyQuote()
      .then(setQuote)
      .finally(() => setLoading(false));
  };

  return { quote, loading, refresh };
}
