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

export const FirestoreService = {
  // Save or update a daily log entry
  async saveDailyLog(userId: string, data: Partial<DailyLog>) {
    try {
      // Generate today's date string as ID (YYYY-MM-DD)
      const today = new Date().toISOString().split("T")[0]
      const docRef = doc(db, `users/${userId}/daily_logs/${today}`)

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
      console.error("Failed to save daily log", error)
    }
  },

  // Get today's log if it exists
  async getTodayLog(userId: string) {
    try {
      const today = new Date().toISOString().split("T")[0]
      const docRef = doc(db, `users/${userId}/daily_logs/${today}`)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return docSnap.data() as DailyLog
      }
      return null
    } catch (error) {
      console.error("Failed to retrieve today's log", error)
      return null
    }
  },

  // Get history of logs
  async getHistory(userId: string) {
    try {
      const logsRef = collection(db, `users/${userId}/daily_logs`)
      const q = query(logsRef, orderBy("id", "desc"), limit(30))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((logDoc) => ({
        ...logDoc.data(),
        id: logDoc.id,
      })) as DailyLog[]
    } catch (error) {
      console.error("Failed to load journal history", error)
      return []
    }
  },
}
