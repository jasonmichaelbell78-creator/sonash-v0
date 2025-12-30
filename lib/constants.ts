/**
 * Application-wide constants
 */

/**
 * LocalStorage keys used throughout the application
 */
export const STORAGE_KEYS = {
  JOURNAL_TEMP: "sonash_journal_temp",
  READING_PREF: "sonash_reading_pref",
} as const

/**
 * Days of the week
 */
export const DAYS = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
} as const

/**
 * Day order for sorting (1 = Monday, 7 = Sunday)
 */
export const DAY_ORDER: Record<string, number> = {
  [DAYS.MONDAY]: 1,
  [DAYS.TUESDAY]: 2,
  [DAYS.WEDNESDAY]: 3,
  [DAYS.THURSDAY]: 4,
  [DAYS.FRIDAY]: 5,
  [DAYS.SATURDAY]: 6,
  [DAYS.SUNDAY]: 7,
} as const

/**
 * Meeting types
 */
export const MEETING_TYPES = {
  AA: "AA",
  NA: "NA",
  SMART: "Smart",
  AL_ANON: "Al-Anon",
} as const

/**
 * Reading preferences
 */
export const READING_PREFS = {
  AA: "AA",
  NA: "NA",
} as const

/**
 * Debounce delays (in milliseconds)
 */
export const DEBOUNCE_DELAYS = {
  AUTO_SAVE: 1000, // 1 second - quick save for better UX
  SEARCH: 300, // 300ms
} as const

/**
 * Firestore query limits
 */
export const QUERY_LIMITS = {
  HISTORY_MAX: 30, // Max history entries to fetch
  JOURNAL_MAX: 100, // Max journal entries to fetch
  INVENTORY_MAX: 50, // Max inventory entries to fetch
} as const

/**
 * Rate limiting configuration
 * All rate limits use a sliding window approach
 */
export const RATE_LIMITS = {
  SAVE_DAILY_LOG: {
    MAX_CALLS: 10,
    WINDOW_MS: 60000, // 10 calls per minute
  },
  SAVE_JOURNAL: {
    MAX_CALLS: 10,
    WINDOW_MS: 60000, // 10 calls per minute
  },
  SAVE_INVENTORY: {
    MAX_CALLS: 10,
    WINDOW_MS: 60000, // 10 calls per minute
  },
  /**
   * Soft delete operations (crumplePage)
   * Matches server-side: 20 req/60s in functions/src/index.ts (softDeleteJournalEntry)
   * More lenient than saves since deletions are less frequent
   */
  SOFT_DELETE_JOURNAL: {
    MAX_CALLS: 20,
    WINDOW_MS: 60000, // 20 calls per minute
  },
  /**
   * Anonymous user data migration
   * Matches server-side: 5 req/300s in functions/src/index.ts (migrateAnonymousUserData)
   * Very restrictive since migration is a one-time, expensive operation
   */
  MIGRATE_USER_DATA: {
    MAX_CALLS: 5,
    WINDOW_MS: 300000, // 5 calls per 5 minutes
  },
  AUTH: {
    MAX_CALLS: 5,
    WINDOW_MS: 60000, // 5 calls per minute
  },
  READ: {
    MAX_CALLS: 30,
    WINDOW_MS: 60000, // 30 reads per minute
  },
} as const

/**
 * Timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  NETWORK_REQUEST: 5000, // 5 seconds for network requests
  DEBOUNCE_SHORT: 300, // 300ms for search/filter debounce
  DEBOUNCE_MEDIUM: 1000, // 1 second for auto-save
  RETRY_DELAY_BASE: 1000, // Base delay for exponential backoff (1s, 2s, 4s...)
} as const

/**
 * Firestore collection paths
 */
export const FIRESTORE_COLLECTIONS = {
  USERS: "users",
  DAILY_LOGS: "daily_logs",
  MEETINGS: "meetings",
  CONTACTS: "contacts",
  JOURNAL_ENTRIES: "journalEntries",
} as const

/**
 * Helper functions for building Firestore paths
 */
export const buildPath = {
  userDoc: (userId: string) => `${FIRESTORE_COLLECTIONS.USERS}/${userId}`,
  dailyLog: (userId: string, dateId: string) =>
    `${FIRESTORE_COLLECTIONS.USERS}/${userId}/${FIRESTORE_COLLECTIONS.DAILY_LOGS}/${dateId}`,
  dailyLogsCollection: (userId: string) =>
    `${FIRESTORE_COLLECTIONS.USERS}/${userId}/${FIRESTORE_COLLECTIONS.DAILY_LOGS}`,
  inventoryEntry: (userId: string, entryId: string) =>
    `${FIRESTORE_COLLECTIONS.USERS}/${userId}/inventoryEntries/${entryId}`,
  inventoryEntries: (userId: string) =>
    `${FIRESTORE_COLLECTIONS.USERS}/${userId}/inventoryEntries`,
} as const
