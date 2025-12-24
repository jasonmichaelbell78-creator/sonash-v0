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
import { db as defaultDb } from "./firebase"
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
} from "firebase/firestore"
import { assertUserScope, validateUserDocumentPath } from "./security/firestore-validation"
import { logger as defaultLogger, maskIdentifier } from "./logger"
import { saveDailyLogLimiter, readLimiter } from "./utils/rate-limiter"
import { buildPath } from "./constants"
import { getTodayDateId } from "./utils/date-utils"
import type { DailyLog, DailyLogResult, DailyLogHistoryResult } from "./types/daily-log"

// Re-export types for backwards compatibility
export type { DailyLog, DailyLogHistoryResult }
export type TodayLogResult = DailyLogResult

type FirestoreDependencies = {
  db: typeof defaultDb
  assertUserScope: typeof assertUserScope
  validateUserDocumentPath: typeof validateUserDocumentPath
  collection: typeof collection
  doc: typeof doc
  setDoc: typeof setDoc
  getDoc: typeof getDoc
  getDocs: typeof getDocs
  query: typeof query
  orderBy: typeof orderBy
  limit: typeof limit
  serverTimestamp: typeof serverTimestamp
  logger: typeof defaultLogger
}

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
}

/**
 * Factory function to create a Firestore service instance.
 * Allows dependency injection for testing.
 * 
 * @param overrides - Optional dependency overrides for testing
 * @returns Firestore service instance with all database operations
 */
export const createFirestoreService = (overrides: Partial<FirestoreDependencies> = {}) => {
  const deps = { ...defaultDeps, ...overrides }

  const ensureValidUser = (userId: string) => {
    if (!userId?.trim()) {
      throw new Error("User ID is required for Firestore operations.")
    }
  }

  const rateLimitError = (limiter: typeof saveDailyLogLimiter, label: "Save" | "Read", userId: string) => {
    if (limiter.canMakeRequest()) return null

    const waitTime = Math.ceil(limiter.getTimeUntilNextRequest() / 1000)
    deps.logger.warn(`${label} rate limit exceeded`, { userId: maskIdentifier(userId), waitTime })
    return new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`)
  }

  const getValidatedDocRef = (userId: string, dateId: string) => {
    const targetPath = buildPath.dailyLog(userId, dateId)
    deps.validateUserDocumentPath(userId, targetPath)
    return deps.doc(deps.db, targetPath)
  }

  return {
    // Save or update a daily log entry
    async saveDailyLog(userId: string, data: Partial<DailyLog>) {
      ensureValidUser(userId)
      deps.assertUserScope({ userId })

      const rateError = rateLimitError(saveDailyLogLimiter, "Save", userId)
      if (rateError) throw rateError

      try {
        // Call Cloud Function for server-side rate limiting and validation
        // This cannot be bypassed by client-side modifications
        const { getFunctions, httpsCallable } = await import("firebase/functions")
        const functions = getFunctions()
        const saveDailyLogFn = httpsCallable(functions, "saveDailyLog")

        // CRITICAL: Always use YYYY-MM-DD format for date (document ID format)
        const todayId = getTodayDateId() // e.g., "2025-12-13"

        const payload: Record<string, unknown> = {
          userId,
          date: todayId, // Use document ID format, not display format
          content: data.content || "",
          mood: data.mood || null,
          cravings: data.cravings,
          used: data.used,
        }

        // The Cloud Function may reject nulls; omit fields when neutral
        if (payload.cravings === null || payload.cravings === undefined) {
          delete payload.cravings
        }
        if (payload.used === null || payload.used === undefined) {
          delete payload.used
        }
        if (payload.mood === null || payload.mood === undefined) {
          delete payload.mood
        }

        deps.logger.info("Calling Cloud Function", {
          userId: maskIdentifier(userId),
          date: todayId,
          hasContent: !!data.content,
        })

        await saveDailyLogFn(payload)

        deps.logger.info("Daily log saved via Cloud Function", {
          userId: maskIdentifier(userId),
        })
      } catch (error: unknown) {
        // Handle specific Cloud Function errors with user-friendly messages
        interface CloudFunctionError {
          code?: string
          message?: string
        }
        const err = error as CloudFunctionError
        if (err.code === "functions/resource-exhausted") {
          deps.logger.warn("Rate limit exceeded", { userId: maskIdentifier(userId) })
          throw new Error("You're saving too quickly. Please wait 60 seconds and try again.")
        }

        if (err.code === "functions/invalid-argument") {
          deps.logger.error("Invalid data sent to Cloud Function", {
            userId: maskIdentifier(userId),
            error: err.message,
          })
          // Use the detailed error message from the Cloud Function
          throw new Error(err.message || "Invalid journal data. Please refresh and try again.")
        }

        if (err.code === "functions/unauthenticated") {
          throw new Error("Please sign in to save your journal.")
        }

        if (err.code === "functions/failed-precondition") {
          throw new Error(`Security check failed (App Check): ${err.message}`)
        }

        // Generic error for unexpected failures
        deps.logger.error("Cloud Function call failed", {
          userId: maskIdentifier(userId),
          error: err,
          code: err.code,
        })
        throw new Error("Couldn't save your journal right now. Please try again in a moment.")
      }
    },

    // Get today's log if it exists
    async getTodayLog(userId: string): Promise<TodayLogResult> {
      ensureValidUser(userId)
      deps.assertUserScope({ userId })

      const rateError = rateLimitError(readLimiter, "Read", userId)
      if (rateError) {
        return { log: null, error: rateError }
      }

      try {
        const today = getTodayDateId()
        const docRef = getValidatedDocRef(userId, today)
        const docSnap = await deps.getDoc(docRef)

        if (docSnap.exists()) {
          return { log: docSnap.data() as DailyLog, error: null }
        }
        return { log: null, error: null }
      } catch (error: unknown) {
        // Permission denied is expected for new anonymous users without a profile
        const isPermissionDenied = error instanceof Error &&
          (error.message.includes("permission-denied") || error.message.includes("Missing or insufficient permissions"))

        if (isPermissionDenied) {
          // Don't log as error - this is expected for new users
          return { log: null, error: null }
        }

        deps.logger.error("Failed to retrieve today's log", { userId: maskIdentifier(userId), error })
        return { log: null, error }
      }
    },

    // Get history of logs
    async getHistory(userId: string): Promise<DailyLogHistoryResult> {
      ensureValidUser(userId)
      deps.assertUserScope({ userId })

      try {
        const logsRef = deps.collection(deps.db, buildPath.dailyLogsCollection(userId))
        const q = deps.query(logsRef, deps.orderBy("dateId", "desc"), deps.limit(30))
        const snapshot = await deps.getDocs(q)

        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as DailyLog))

        return { entries, error: null }
      } catch (error) {
        deps.logger.error("Failed to fetch history", { userId: maskIdentifier(userId), error })
        return { entries: [], error }
      }
    },

    // Get inventory entries history
    async getInventoryEntries(userId: string, limitCount = 50) {
      ensureValidUser(userId)
      deps.assertUserScope({ userId })

      try {
        const entriesRef = deps.collection(deps.db, buildPath.inventoryEntries(userId))
        const q = deps.query(entriesRef, deps.orderBy("createdAt", "desc"), deps.limit(limitCount))
        const snapshot = await deps.getDocs(q)

        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        return { entries, error: null }
      } catch (error) {
        deps.logger.error("Failed to fetch inventory entries", { userId: maskIdentifier(userId), error })
        return { entries: [], error }
      }
    },

    // Save an inventory entry (Spot Check, Night Review, etc.)
    // UPDATED: Now uses Cloud Function for server-side validation and rate limiting
    async saveInventoryEntry(userId: string, entry: {
      type: 'spot-check' | 'night-review' | 'gratitude';
      data: Record<string, unknown>;
      tags?: string[];
    }) {
      ensureValidUser(userId)
      deps.assertUserScope({ userId })

      try {
        // Call Cloud Function instead of direct Firestore write
        // This provides rate limiting (10 req/min) and server-side validation
        const { getFunctions, httpsCallable } = await import("firebase/functions")
        const functions = getFunctions()
        const saveInventoryFn = httpsCallable(functions, "saveInventoryEntry")

        const result = await saveInventoryFn({
          userId, // Will be validated server-side
          type: entry.type,
          data: entry.data,
          tags: entry.tags || [],
        })

        const response = result.data as { success: boolean; entryId: string }
        deps.logger.info("Inventory entry saved via Cloud Function", {
          userId: maskIdentifier(userId),
          type: entry.type,
          entryId: response.entryId
        })
        return response.entryId
      } catch (error) {
        deps.logger.error("Failed to save inventory entry", {
          userId: maskIdentifier(userId),
          error
        })
        throw error
      }
    },

    // Save a generic journal entry (growth work, notes, etc.)
    async saveJournalEntry(userId: string, entry: { title: string; content: string; type: string; tags: string[] }) {
      ensureValidUser(userId)
      deps.assertUserScope({ userId })

      try {
        // We use a separate collection for individual entries that allows multiple per day
        const collectionPath = `users/${userId}/journalEntries`
        deps.validateUserDocumentPath(userId, collectionPath)

        const entriesRef = deps.collection(deps.db, collectionPath)
        const newDocRef = deps.doc(entriesRef) // Auto-ID

        const payload = {
          id: newDocRef.id,
          userId,
          ...entry,
          createdAt: deps.serverTimestamp(),
          updatedAt: deps.serverTimestamp(),
        }

        await deps.setDoc(newDocRef, payload)
        deps.logger.info("Journal entry saved", { userId: maskIdentifier(userId), type: entry.type })
        return newDocRef.id
      } catch (error) {
        deps.logger.error("Failed to save journal entry", { userId: maskIdentifier(userId), error })
        throw error
      }
    },

    // Save a journal entry from notebook inputs (mood, cravings, used, notes, etc.)
    async saveNotebookJournalEntry(userId: string, entry: {
      type: 'mood' | 'daily-log' | 'spot-check' | 'night-review' | 'gratitude' | 'free-write' | 'meeting-note' | 'check-in' | 'inventory';
      data: Record<string, unknown>;
      isPrivate?: boolean;
    }) {
      ensureValidUser(userId)
      deps.assertUserScope({ userId })

      try {
        const { addDoc } = await import("firebase/firestore")
        const collectionPath = `users/${userId}/journal`
        deps.validateUserDocumentPath(userId, collectionPath)

        const entriesRef = deps.collection(deps.db, collectionPath)
        const today = getTodayDateId()

        const payload = {
          userId,
          type: entry.type,
          dateLabel: today,
          isPrivate: entry.isPrivate ?? true,
          isSoftDeleted: false,
          data: entry.data,
          createdAt: deps.serverTimestamp(),
          updatedAt: deps.serverTimestamp(),
        }

        const docRef = await addDoc(entriesRef, payload)
        deps.logger.info("Notebook journal entry saved", {
          userId: maskIdentifier(userId),
          type: entry.type
        })
        return docRef.id
      } catch (error) {
        deps.logger.error("Failed to save notebook journal entry", {
          userId: maskIdentifier(userId),
          error
        })
        throw error
      }
    }
  }
}

export const FirestoreService = createFirestoreService()
