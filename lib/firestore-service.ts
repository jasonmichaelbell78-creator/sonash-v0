import { db } from "./firebase"
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    orderBy,
    Timestamp,
    limit
} from "firebase/firestore"

// Types
export interface DailyLog {
    id?: string // Date string YYYY-MM-DD
    date: string
    content: string
    mood: string | null
    cravings: boolean
    used: boolean
    timestamp: any
}

export const FirestoreService = {
    // Save or update a daily log entry
    async saveDailyLog(userId: string, data: Partial<DailyLog>) {
        // Generate today's date string as ID (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0]
        const docRef = doc(db, `users/${userId}/daily_logs/${today}`)

        // Merge true allows us to update fields independently (e.g., autosave journal separate from check-in)
        await setDoc(docRef, {
            ...data,
            id: today,
            updatedAt: Timestamp.now()
        }, { merge: true })
    },

    // Get today's log if it exists
    async getTodayLog(userId: string) {
        const today = new Date().toISOString().split('T')[0]
        const docRef = doc(db, `users/${userId}/daily_logs/${today}`)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            return docSnap.data() as DailyLog
        }
        return null
    },

    // Get history of logs
    async getHistory(userId: string) {
        const logsRef = collection(db, `users/${userId}/daily_logs`)
        const q = query(logsRef, orderBy("id", "desc"), limit(30))
        const querySnapshot = await getDocs(q)

        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        })) as DailyLog[]
    }
}
