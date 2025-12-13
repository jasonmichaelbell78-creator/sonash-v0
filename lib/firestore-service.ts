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
import type { DailyLog, DailyLogResult, DailyLogHistoryResult } from "./types/daily-log"

// Re-export types for backwards compatibility
export type { DailyLog, DailyLogHistoryResult }
export type TodayLogResult = DailyLogResult

// Get today's date ID in local timezone (YYYY-MM-DD format)
// IMPORTANT: Must match the timezone used in the UI (formatDateForDisplay)
// to prevent saving to wrong day
const getTodayLocalDateId = () =>
  new Intl.DateTimeFormat("en-CA").format(new Date())

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

        // Cloud Function expects: { userId, date, content, mood, cravings, used }
        await saveDailyLogFn({
          userId,
          date: data.id || getTodayLocalDateId(),
          content: data.content || "",
          mood: data.mood || null,
          cravings: data.cravings || false,
          used: data.used || false,
        })

        deps.logger.info("Daily log saved via Cloud Function", { userId: maskIdentifier(userId) })
      } catch (error: any) {
        // Handle specific Cloud Function errors
        if (error.code === "functions/resource-exhausted") {
          deps.logger.warn("Rate limit exceeded", { userId: maskIdentifier(userId) })
          throw new Error("You're saving too quickly. Please wait 60 seconds and try again.")
        }

        if (error.code === "functions/unauthenticated") {
          throw new Error("You must be signed in to save your journal.")
        }

        if (error.code === "functions/failed-precondition") {
          throw new Error("Security verification failed. Please refresh the page and try again.")
        }

        deps.logger.error("Failed to save daily log", { userId: maskIdentifier(userId), error })
        throw new Error("Failed to save journal. Please try again.")
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
        const today = getTodayLocalDateId()
        const docRef = getValidatedDocRef(userId, today)
        const docSnap = await deps.getDoc(docRef)

        if (docSnap.exists()) {
          return { log: docSnap.data() as DailyLog, error: null }
        }
        return { log: null, error: null }
      } catch (error) {
        deps.logger.error("Failed to retrieve today's log", { userId: maskIdentifier(userId), error })
        return { log: null, error }
      }
    },

    // Get history of logs
    async getHistory(userId: string): Promise<DailyLogHistoryResult> {
      ensureValidUser(userId)
      deps.assertUserScope({ userId })

      const rateError = rateLimitError(readLimiter, "Read", userId)
      if (rateError) {
        return { entries: [], error: rateError }
      }

      try {
        const collectionPath = buildPath.dailyLogsCollection(userId)
        deps.validateUserDocumentPath(userId, collectionPath)
        const logsRef = deps.collection(deps.db, collectionPath)
        const q = deps.query(logsRef, deps.orderBy("id", "desc"), deps.limit(30))
        const querySnapshot = await deps.getDocs(q)

        return {
          entries:
            querySnapshot.docs.map((logDoc) => ({
              ...logDoc.data(),
              id: logDoc.id,
            })) as DailyLog[],
          error: null,
        }
      } catch (error) {
        deps.logger.error("Failed to load journal history", { userId: maskIdentifier(userId), error })
        return { entries: [], error }
      }
    },
  }
}

export const FirestoreService = createFirestoreService()
