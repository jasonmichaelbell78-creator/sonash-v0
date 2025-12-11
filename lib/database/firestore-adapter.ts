/**
 * Firestore implementation of the database interface
 *
 * This adapter wraps the existing FirestoreService and provides
 * a clean interface for database operations, making it easy to
 * test and potentially swap implementations.
 */

import { FirestoreService } from "../firestore-service"
import type {
  IDatabase,
  IDatabaseWithRealtime,
  DailyLog,
  OperationResult,
  DatabaseListener,
  UnsubscribeFunction,
} from "./database-interface"
import { onSnapshot, doc } from "firebase/firestore"
import { db } from "../firebase"
import { buildPath } from "../constants"
import { logger, maskIdentifier } from "../logger"

/**
 * Firestore adapter implementing the database interface
 */
export class FirestoreAdapter implements IDatabaseWithRealtime {
  /**
   * Save or update a daily log entry
   */
  async saveDailyLog(userId: string, data: Partial<DailyLog>): Promise<void> {
    return FirestoreService.saveDailyLog(userId, data)
  }

  /**
   * Get today's log for a user
   */
  async getTodayLog(userId: string): Promise<OperationResult<DailyLog>> {
    const result = await FirestoreService.getTodayLog(userId)
    return {
      data: result.log,
      error: result.error,
    }
  }

  /**
   * Get historical log entries for a user
   */
  async getHistory(
    userId: string,
    limit: number = 30
  ): Promise<OperationResult<DailyLog[]>> {
    const result = await FirestoreService.getHistory(userId)
    return {
      data: result.entries,
      error: result.error,
    }
  }

  /**
   * Subscribe to real-time updates for a daily log
   */
  async subscribeToDailyLog(
    userId: string,
    dateId: string,
    onData: DatabaseListener<DailyLog>,
    onError: (error: Error) => void
  ): Promise<UnsubscribeFunction> {
    try {
      const docRef = doc(db, buildPath.dailyLog(userId, dateId))

      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            onData(docSnap.data() as DailyLog)
          } else {
            onData(null)
          }
        },
        (error) => {
          logger.error("Real-time listener error", {
            userId: maskIdentifier(userId),
            dateId,
            error,
          })
          onError(error as Error)
        }
      )

      return unsubscribe
    } catch (error) {
      logger.error("Failed to set up real-time listener", {
        userId: maskIdentifier(userId),
        dateId,
        error,
      })
      throw error
    }
  }
}

/**
 * Default database instance
 * Use this throughout the application for consistency
 */
export const database: IDatabaseWithRealtime = new FirestoreAdapter()
