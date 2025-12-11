import { db } from "./firebase"
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
import { logger, maskIdentifier } from "./logger"

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

export const FirestoreService = {
  // Save or update a daily log entry
  async saveDailyLog(userId: string, data: Partial<DailyLog>) {
    assertUserScope({ userId })
    try {
      // Generate today's date string as ID (YYYY-MM-DD)
      const today = getTodayUtcDateId()
      const targetPath = `users/${userId}/daily_logs/${today}`
      validateUserDocumentPath(userId, targetPath)
      const docRef = doc(db, targetPath)

      // Merge true allows us to update fields independently (e.g., autosave journal separate from check-in)
      await setDoc(
        docRef,
        {
          ...data,
          id: today,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    } catch (error) {
      logger.error("Failed to save daily log", { userId: maskIdentifier(userId), error })
      throw error
    }
  },

  // Get today's log if it exists
  async getTodayLog(userId: string): Promise<TodayLogResult> {
    assertUserScope({ userId })
    try {
      const today = getTodayUtcDateId()
      const targetPath = `users/${userId}/daily_logs/${today}`
      validateUserDocumentPath(userId, targetPath)
      const docRef = doc(db, targetPath)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { log: docSnap.data() as DailyLog, error: null }
      }
      return { log: null, error: null }
    } catch (error) {
      logger.error("Failed to retrieve today's log", { userId: maskIdentifier(userId), error })
      return { log: null, error }
    }
  },

  // Get history of logs
  async getHistory(userId: string): Promise<{ entries: DailyLog[]; error: unknown | null }> {
    assertUserScope({ userId })
    try {
      const collectionPath = `users/${userId}/daily_logs`
      validateUserDocumentPath(userId, collectionPath)
      const logsRef = collection(db, collectionPath)
      const q = query(logsRef, orderBy("id", "desc"), limit(30))
      const querySnapshot = await getDocs(q)

      return {
        entries:
          querySnapshot.docs.map((logDoc) => ({
            ...logDoc.data(),
            id: logDoc.id,
          })) as DailyLog[],
        error: null,
      }
    } catch (error) {
      logger.error("Failed to load journal history", { userId: maskIdentifier(userId), error })
      return { entries: [], error }
    }
  },
}
