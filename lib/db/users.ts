import { db } from "../firebase"
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore"

export interface UserProfile {
    uid: string
    email: string | null
    nickname: string
    cleanStart: Timestamp | null
    createdAt: Timestamp
    updatedAt: Timestamp
    preferences: {
        theme: "blue"
        largeText: boolean
        simpleLanguage: boolean
    }
}

// Default preferences
const defaultPreferences = {
    theme: "blue" as const,
    largeText: false,
    simpleLanguage: false,
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
        const docRef = doc(db, `users/${uid}`)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            return docSnap.data() as UserProfile
        }
        return null
    } catch (error) {
        console.error("Error getting user profile:", error)
        return null
    }
}

export async function createUserProfile(uid: string, email: string | null, nickname?: string): Promise<UserProfile> {
    const now = serverTimestamp() as Timestamp

    const newUser: UserProfile = {
        uid,
        email,
        nickname: nickname || email?.split("@")[0] || "Friend",
        cleanStart: null,
        createdAt: now,
        updatedAt: now,
        preferences: defaultPreferences,
    }

    try {
        await setDoc(doc(db, `users/${uid}`), newUser)
        return newUser
    } catch (error) {
        console.error("Error creating user profile:", error)
        throw error
    }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
        const docRef = doc(db, `users/${uid}`)
        await setDoc(
            docRef,
            {
                ...data,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        )
    } catch (error) {
        console.error("Error updating user profile:", error)
        throw error
    }
}
