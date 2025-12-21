import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Slogan {
    id: string
    text: string
    author: string
    source?: string
    scheduledDate?: string // YYYY-MM-DD format for specific date assignment
    scheduledTimeOfDay?: 'morning' | 'afternoon' | 'evening' // Optional: specific time of day
    createdAt?: Timestamp
    [key: string]: unknown
}

const COLLECTION_NAME = "slogans"

/**
 * Slogans Service - Firestore CRUD operations
 * Used by admin panel for managing daily recovery slogans
 * Supports hybrid rotation: scheduled + 3x daily time-based rotation
 */
export const SlogansService = {
    /**
     * Get all slogans
     */
    async getAllSlogans(): Promise<Slogan[]> {
        const ref = collection(db, COLLECTION_NAME)
        const snapshot = await getDocs(ref)
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Slogan))
    },

    /**
     * Add a new slogan
     */
    async addSlogan(data: Omit<Slogan, "id">): Promise<string> {
        const ref = collection(db, COLLECTION_NAME)
        const docRef = doc(ref)
        await setDoc(docRef, {
            ...data,
            createdAt: Timestamp.now(),
        })
        return docRef.id
    },

    /**
     * Update existing slogan
     */
    async updateSlogan(id: string, data: Partial<Slogan>): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id)
        await updateDoc(docRef, data)
    },

    /**
     * Delete slogan
     */
    async deleteSlogan(id: string): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id)
        await deleteDoc(docRef)
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
     * Get slogan for current time (3x daily hybrid rotation)
     * Priority: 
     * 1. Scheduled for today's date + specific time of day
     * 2. Scheduled for today's date (any time)
     * 3. Rotation based on time of day (morning/afternoon/evening)
     */
    getSloganForNow: (slogans: Slogan[]): Slogan | null => {
        if (slogans.length === 0) return null

        const today = new Date()
        const todayStr = today.toLocaleDateString('en-CA') // YYYY-MM-DD in local time
        const timeOfDay = SlogansService.getTimeOfDay()

        // 1. Check for slogan scheduled for today + specific time of day
        const exactScheduled = slogans.find(s =>
            s.scheduledDate === todayStr && s.scheduledTimeOfDay === timeOfDay
        )
        if (exactScheduled) return exactScheduled

        // 2. Check for slogan scheduled for today (any time)
        const todayScheduled = slogans.find(s =>
            s.scheduledDate === todayStr && !s.scheduledTimeOfDay
        )
        if (todayScheduled) return todayScheduled

        // 3. Fallback to rotation based on time of day
        // Exclude scheduled slogans from general pool
        const generalPool = slogans.filter(s => !s.scheduledDate)

        if (generalPool.length === 0) return slogans[0] // Fallback if everything is scheduled

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
    }
}
