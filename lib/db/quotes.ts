import { db } from "../firebase"
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"

export interface Quote {
    id: string
    text: string
    author?: string
    source?: string
    tags?: string[]
    scheduledDate?: string // YYYY-MM-DD
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

    // Deterministically get a quote for a specific date
    // Note: This requires fetching all quotes first. For <1000 items, this is fine.
    // Optimization: Cache this list in React Query or LocalStorage
    getQuoteForToday: (quotes: Quote[]) => {
        if (quotes.length === 0) return null

        // 1. Check for a specifically scheduled quote for today
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD (local/UTC edge case note: this uses UTC date relative to ISO. Better to use local if client-side?)
        // Let's rely on local client time for now as this runs on client
        const localTodayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time

        const scheduledQuote = quotes.find(q => q.scheduledDate === localTodayStr)
        if (scheduledQuote) return scheduledQuote

        // 2. Fallback to rotation logic with REMAINING quotes (exclude those that are scheduled for *any* date? Or just use general pool?)
        // Better to exclude *all* scheduled quotes from the random rotation so they don't appear twice randomly.
        const generalPool = quotes.filter(q => !q.scheduledDate)

        if (generalPool.length === 0) return quotes[0] // Fallback if EVERYTHING is scheduled

        // Use today's date string to seed the random choice
        const startOfYear = new Date(today.getFullYear(), 0, 0)
        const diff = today.getTime() - startOfYear.getTime()
        const oneDay = 1000 * 60 * 60 * 24
        const dayOfYear = Math.floor(diff / oneDay)

        const index = dayOfYear % generalPool.length
        return generalPool[index]
    }
}
