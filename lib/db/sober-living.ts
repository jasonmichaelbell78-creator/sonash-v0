import { db } from "../firebase"
import { collection, query, getDocs, doc, writeBatch, updateDoc, deleteDoc, addDoc } from "firebase/firestore"

export interface SoberLivingHome {
    id: string
    name: string
    address: string
    gender: "Men" | "Women"
    phone: string
    website?: string
    heroImage?: string
    neighborhood?: string
    coordinates?: { lat: number; lng: number }
    notes?: string
    [key: string]: unknown
}

const COLLECTION = "sober_living"

export const SoberLivingService = {
    getAllHomes: async (): Promise<SoberLivingHome[]> => {
        const q = query(collection(db, COLLECTION))
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SoberLivingHome))
    },

    addHome: async (home: Omit<SoberLivingHome, "id">) => {
        return await addDoc(collection(db, COLLECTION), home)
    },

    updateHome: async (id: string, data: Partial<SoberLivingHome>) => {
        const ref = doc(db, COLLECTION, id)
        await updateDoc(ref, data)
    },

    deleteHome: async (id: string) => {
        await deleteDoc(doc(db, COLLECTION, id))
    },

    // Seed initial data
    seedInitialHomes: async (homes: SoberLivingHome[]) => {
        const batch = writeBatch(db)

        // Delete existing (optional, or just append?)
        // For safety, let's just add new ones or overwrite by ID if we provided IDs.
        // But since we generate IDs, let's assume we want to Clear First if this is a "Reset"

        const q = query(collection(db, COLLECTION))
        const snapshot = await getDocs(q)
        snapshot.docs.forEach((d) => batch.delete(d.ref))

        homes.forEach((home) => {
            const ref = doc(collection(db, COLLECTION)) // Auto ID
            // If home.id is generic "temp", ignore it. Or use it? 
            // Better to let Firestore generate IDs for new collection
            const { id: _id, ...data } = home
            batch.set(ref, data)
        })

        await batch.commit()
    }
}
