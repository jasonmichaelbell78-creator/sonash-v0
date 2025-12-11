/**
 * Date utility functions for SoNash
 *
 * IMPORTANT: All date ID generation for daily logs MUST use getTodayDateId()
 * to ensure consistency across the application.
 */

/**
 * Generates a consistent date ID for daily logs
 * Format: YYYY-MM-DD (UTC timezone)
 *
 * This function is used as the document ID in Firestore daily_logs collection.
 * All components that interact with daily logs should use this function.
 *
 * @returns {string} Date string in YYYY-MM-DD format (UTC)
 *
 * @example
 * const dateId = getTodayDateId()
 * // Returns: "2025-12-11"
 */
export function getTodayDateId(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
  }).format(new Date())
}

/**
 * Formats a date for display to users (not for database operations)
 *
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string like "Wednesday, Dec 11"
 *
 * @example
 * const display = formatDateForDisplay(new Date())
 * // Returns: "Wednesday, Dec 11"
 */
export function formatDateForDisplay(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
}

/**
 * Parses a date ID (YYYY-MM-DD) to a Date object
 *
 * @param {string} dateId - Date string in YYYY-MM-DD format
 * @returns {Date} Date object
 *
 * @example
 * const date = parseDateId("2025-12-11")
 */
export function parseDateId(dateId: string): Date {
  return new Date(dateId + "T00:00:00Z")
}

/**
 * Validates if a string is a valid date ID (YYYY-MM-DD format)
 *
 * @param {string} dateId - String to validate
 * @returns {boolean} True if valid date ID format
 *
 * @example
 * isValidDateId("2025-12-11") // true
 * isValidDateId("12/11/2025") // false
 */
export function isValidDateId(dateId: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateId)
}
