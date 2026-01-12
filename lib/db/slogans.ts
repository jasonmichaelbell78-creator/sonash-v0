import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
    getTimeOfDay,
    getRotatedItemForNow,
    type TimeOfDay,
    type SchedulableItem
} from "@/lib/utils/time-rotation"

export interface Slogan extends SchedulableItem {
    text: string
    author: string
    source?: string
    scheduledDate?: string // YYYY-MM-DD format for specific date assignment
    scheduledTimeOfDay?: TimeOfDay // Optional: specific time of day
    createdAt?: Timestamp
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
     * CANON-0017: Delegates to shared time-rotation utility
     */
    getTimeOfDay,

    /**
     * Get slogan for current time (3x daily hybrid rotation)
     * CANON-0017: Delegates to shared time-rotation utility
     *
     * Priority:
     * 1. Scheduled for today's date + specific time of day
     * 2. Scheduled for today's date (any time)
     * 3. Rotation based on time of day (morning/afternoon/evening)
     */
    getSloganForNow: (slogans: Slogan[]): Slogan | null => getRotatedItemForNow(slogans)
}
