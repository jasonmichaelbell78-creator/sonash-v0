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
  type Timestamp,
} from "firebase/firestore"
import { assertUserScope, validateUserDocumentPath } from "./security/firestore-validation"
import { logger as defaultLogger, maskIdentifier } from "./logger"

// Types
export interface DailyLog {
  id?: string // Date string YYYY-MM-DD
  date: string
  content: string
  mood: string | null
  cravings: boolean
  used: boolean
  updatedAt?: Timestamp
}

const getTodayUtcDateId = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
  }).format(new Date())

export interface TodayLogResult {
  log: DailyLog | null
  error: unknown | null
}

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

  return {
    // Save or update a daily log entry
    async saveDailyLog(userId: string, data: Partial<DailyLog>) {
      deps.assertUserScope({ userId })
      try {
        // Generate today's date string as ID (YYYY-MM-DD)
        const today = getTodayUtcDateId()
        const targetPath = `users/${userId}/daily_logs/${today}`
        deps.validateUserDocumentPath(userId, targetPath)
        const docRef = deps.doc(deps.db, targetPath)

        // Merge true allows us to update fields independently (e.g., autosave journal separate from check-in)
        await deps.setDoc(
          docRef,
          {
            ...data,
            id: today,
            updatedAt: deps.serverTimestamp(),
          },
          { merge: true }
        )
      } catch (error) {
        deps.logger.error("Failed to save daily log", { userId: maskIdentifier(userId), error })
        throw error
      }
    },

    // Get today's log if it exists
    async getTodayLog(userId: string): Promise<TodayLogResult> {
      deps.assertUserScope({ userId })
      try {
        const today = getTodayUtcDateId()
        const targetPath = `users/${userId}/daily_logs/${today}`
        deps.validateUserDocumentPath(userId, targetPath)
        const docRef = deps.doc(deps.db, targetPath)
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
    async getHistory(userId: string): Promise<{ entries: DailyLog[]; error: unknown | null }> {
      deps.assertUserScope({ userId })
      try {
        const collectionPath = `users/${userId}/daily_logs`
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
