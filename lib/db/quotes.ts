import { db } from "../firebase"
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"

export interface Quote {
    id: string
    text: string
    author?: string
    source?: string
    tags?: string[]
    scheduledDate?: string // YYYY-MM-DD
    scheduledTimeOfDay?: 'morning' | 'afternoon' | 'evening' // Optional: specific time of day
    createdAt?: Timestamp
    [key: string]: unknown
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
     */
    getTimeOfDay: (): 'morning' | 'afternoon' | 'evening' => {
        const hour = new Date().getHours()
        if (hour < 12) return 'morning'      // 12 AM - 11:59 AM
        if (hour < 18) return 'afternoon'    // 12 PM - 5:59 PM
        return 'evening'                      // 6 PM - 11:59 PM
    },

    /**
     * Get quote for current time (3x daily hybrid rotation)
     * Priority:
     * 1. Scheduled for today's date + specific time of day
     * 2. Scheduled for today's date (any time)
     * 3. Rotation based on time of day (morning/afternoon/evening)
     */
    getQuoteForNow: (quotes: Quote[]) => {
        if (quotes.length === 0) return null

        const today = new Date()
        const localTodayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
        const timeOfDay = QuotesService.getTimeOfDay()

        // 1. Check for quote scheduled for today + specific time of day
        const exactScheduled = quotes.find(q =>
            q.scheduledDate === localTodayStr && q.scheduledTimeOfDay === timeOfDay
        )
        if (exactScheduled) return exactScheduled

        // 2. Check for quote scheduled for today (any time)
        const todayScheduled = quotes.find(q =>
            q.scheduledDate === localTodayStr && !q.scheduledTimeOfDay
        )
        if (todayScheduled) return todayScheduled

        // 3. Fallback to rotation based on time of day
        // Exclude scheduled quotes from general pool
        const generalPool = quotes.filter(q => !q.scheduledDate)

        if (generalPool.length === 0) return quotes[0] // Fallback if EVERYTHING is scheduled

        // Use date + time of day to create a unique seed for 3x daily rotation
        const startOfYear = new Date(today.getFullYear(), 0, 0)
        const diff = today.getTime() - startOfYear.getTime()
        const oneDay = 1000 * 60 * 60 * 24
        const dayOfYear = Math.floor(diff / oneDay)

        // Create a unique index for each time period (3 per day)
        const timeOfDayIndex = timeOfDay === 'morning' ? 0 : timeOfDay === 'afternoon' ? 1 : 2
        const combinedSeed = (dayOfYear * 3) + timeOfDayIndex

        const index = combinedSeed % generalPool.length
        return generalPool[index]
    },

    // Backward compatibility alias
    getQuoteForToday: (quotes: Quote[]) => QuotesService.getQuoteForNow(quotes)
}
