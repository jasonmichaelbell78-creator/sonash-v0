import { db } from "../firebase"
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"
import {
    getTimeOfDay,
    getRotatedItemForNow,
    type TimeOfDay,
    type SchedulableItem
} from "@/lib/utils/time-rotation"

export interface Quote extends SchedulableItem {
    text: string
    author?: string
    source?: string
    tags?: string[]
    scheduledDate?: string // YYYY-MM-DD
    scheduledTimeOfDay?: TimeOfDay // Optional: specific time of day
    createdAt?: Timestamp
}

const COLLECTION = "daily_quotes"

export const QuotesService = {
    getAllQuotes: async (): Promise<Quote[]> => {
        const q = query(collection(db, COLLECTION))
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote))
    },

    addQuote: async (quote: Omit<Quote, "id">) => {
        return await addDoc(collection(db, COLLECTION), {
            ...quote,
            createdAt: Timestamp.now()
        })
    },

    updateQuote: async (id: string, data: Partial<Quote>) => {
        const ref = doc(db, COLLECTION, id)
        await updateDoc(ref, data)
    },

    deleteQuote: async (id: string) => {
        await deleteDoc(doc(db, COLLECTION, id))
    },

    /**
     * Get time of day based on current hour
     * CANON-0017: Delegates to shared time-rotation utility
     */
    getTimeOfDay,

    /**
     * Get quote for current time (3x daily hybrid rotation)
     * CANON-0017: Delegates to shared time-rotation utility
     *
     * Priority:
     * 1. Scheduled for today's date + specific time of day
     * 2. Scheduled for today's date (any time)
     * 3. Rotation based on time of day (morning/afternoon/evening)
     */
    getQuoteForNow: (quotes: Quote[]) => getRotatedItemForNow(quotes),

    // Backward compatibility alias
    getQuoteForToday: (quotes: Quote[]) => getRotatedItemForNow(quotes)
}
