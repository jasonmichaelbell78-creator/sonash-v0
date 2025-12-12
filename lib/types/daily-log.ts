/**
 * Canonical DailyLog type definition
 *
 * IMPORTANT: This is the single source of truth for DailyLog.
 * All modules should import from here to prevent type divergence.
 */

import type { Timestamp } from "firebase/firestore"

/**
 * Daily log entry structure for recovery tracking
 */
export interface DailyLog {
  id?: string // Date string YYYY-MM-DD (used as document ID)
  date: string // Human-readable date for display
  content: string // Journal entry text
  mood: string | null // Mood identifier (e.g., "great", "struggling")
  cravings: boolean // Whether user experienced cravings
  used: boolean // Whether user used substances
  updatedAt?: Timestamp // Last update timestamp from Firestore
}

/**
 * Result type for operations that return a DailyLog
 */
export interface DailyLogResult {
  log: DailyLog | null
  error: unknown | null
}

/**
 * Result type for operations that return multiple DailyLogs
 */
export interface DailyLogHistoryResult {
  entries: DailyLog[]
  error: unknown | null
}
