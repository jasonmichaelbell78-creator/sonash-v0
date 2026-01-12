/**
 * Database abstraction interface
 *
 * This interface defines the contract for all database operations,
 * making it easy to swap implementations (e.g., Firestore, Supabase, MongoDB)
 * and improve testability by allowing mock implementations.
 */

import type { DailyLog } from "../types/daily-log";

// Re-export DailyLog for consumers of this module
export type { DailyLog };

/**
 * Result type for operations that may fail
 */
export interface OperationResult<T> {
  data: T | null;
  error: unknown | null;
}

/**
 * Core database interface for the application
 */
export interface IDatabase {
  /**
   * Save or update a daily log entry
   * @param userId - User ID who owns the log
   * @param data - Partial log data to save (merged with existing)
   * @throws Error if rate limit exceeded or operation fails
   */
  saveDailyLog(userId: string, data: Partial<DailyLog>): Promise<void>;

  /**
   * Get today's log for a user
   * @param userId - User ID
   * @returns Result with log data or error
   */
  getTodayLog(userId: string): Promise<OperationResult<DailyLog>>;

  /**
   * Get historical log entries for a user
   * @param userId - User ID
   * @param limit - Maximum number of entries to return (default: 30)
   * @returns Result with array of log entries or error
   */
  getHistory(userId: string, limit?: number): Promise<OperationResult<DailyLog[]>>;
}

/**
 * Real-time listener callback for database changes
 */
export type DatabaseListener<T> = (data: T | null) => void;

/**
 * Unsubscribe function returned by listeners
 */
export type UnsubscribeFunction = () => void;

/**
 * Extended database interface with real-time capabilities
 */
export interface IDatabaseWithRealtime extends IDatabase {
  /**
   * Subscribe to real-time updates for today's log
   * @param userId - User ID
   * @param onData - Callback when data changes
   * @param onError - Callback when error occurs
   * @returns Unsubscribe function to stop listening
   */
  subscribeToDailyLog(
    userId: string,
    dateId: string,
    onData: DatabaseListener<DailyLog>,
    onError: (error: Error) => void
  ): Promise<UnsubscribeFunction>;
}
