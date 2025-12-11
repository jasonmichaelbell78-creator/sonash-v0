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
  AUTO_SAVE: 5000, // 5 seconds
  SEARCH: 300, // 300ms
} as const

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  SAVE_DAILY_LOG: {
    MAX_CALLS: 10,
    WINDOW_MS: 60000, // 1 minute
  },
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
} as const
