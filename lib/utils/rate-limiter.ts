/**
 * Client-side rate limiter to prevent API abuse
 *
 * NOTE: This is client-side only and can be bypassed.
 * For production, use Firebase App Check + Cloud Functions rate limiting
 */

import { RATE_LIMITS } from "../constants"

interface RateLimitConfig {
  maxCalls: number  // Maximum number of calls
  windowMs: number  // Time window in milliseconds
}

class RateLimiter {
  private calls: number[] = []
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  /**
   * Check if a request can be made based on rate limit
   * @returns true if request is allowed, false if rate limit exceeded
   */
  canMakeRequest(): boolean {
    const now = Date.now()

    // Remove calls outside the time window
    this.calls = this.calls.filter(time => now - time < this.config.windowMs)

    // Check if we're at the limit
    if (this.calls.length >= this.config.maxCalls) {
      return false
    }

    // Record this call
    this.calls.push(now)
    return true
  }

  /**
   * Get time until next request is allowed (in milliseconds)
   * @returns milliseconds until next request, or 0 if request is allowed now
   */
  getTimeUntilNextRequest(): number {
    if (this.calls.length < this.config.maxCalls) {
      return 0
    }

    const oldestCall = this.calls[0]
    const timeElapsed = Date.now() - oldestCall
    return Math.max(0, this.config.windowMs - timeElapsed)
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.calls = []
  }
}

// Export pre-configured rate limiters for common operations
// Uses centralized constants from lib/constants.ts
//
// NOTE: These client-side limiters are for UX feedback only.
// The actual security enforcement happens server-side in Cloud Functions.
// See functions/src/index.ts for server-side rate limits.
export const saveDailyLogLimiter = new RateLimiter({
  maxCalls: RATE_LIMITS.SAVE_DAILY_LOG.MAX_CALLS,
  windowMs: RATE_LIMITS.SAVE_DAILY_LOG.WINDOW_MS,
})

export const authLimiter = new RateLimiter({
  maxCalls: RATE_LIMITS.AUTH.MAX_CALLS,
  windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
})

export const readLimiter = new RateLimiter({
  maxCalls: RATE_LIMITS.READ.MAX_CALLS,
  windowMs: RATE_LIMITS.READ.WINDOW_MS,
})

/**
 * Rate limiter for journal soft delete (crumplePage) operations
 * Matches server-side: 20 req/60s in functions/src/index.ts (lines 235-238)
 */
export const softDeleteJournalLimiter = new RateLimiter({
  maxCalls: RATE_LIMITS.SOFT_DELETE_JOURNAL.MAX_CALLS,
  windowMs: RATE_LIMITS.SOFT_DELETE_JOURNAL.WINDOW_MS,
})

/**
 * Rate limiter for anonymous user data migration
 * Matches server-side: 5 req/300s in functions/src/index.ts (lines 445-448)
 * Very restrictive since migration is a one-time, expensive operation
 */
export const migrateUserDataLimiter = new RateLimiter({
  maxCalls: RATE_LIMITS.MIGRATE_USER_DATA.MAX_CALLS,
  windowMs: RATE_LIMITS.MIGRATE_USER_DATA.WINDOW_MS,
})

// Export the class for custom rate limiters
export { RateLimiter }
export type { RateLimitConfig }
