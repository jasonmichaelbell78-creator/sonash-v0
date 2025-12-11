import { db } from "../firebase"
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore"
import { logger, maskIdentifier } from "../logger"
import { assertUserScope, validateUserDocumentPath } from "../security/firestore-validation"

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
        assertUserScope({ userId: uid })
        const docRef = doc(db, `users/${uid}`)
        validateUserDocumentPath(uid, `users/${uid}`)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            return docSnap.data() as UserProfile
        }
        return null
    } catch (error) {
        logger.error("Error getting user profile", { userId: maskIdentifier(uid), error })
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
        assertUserScope({ userId: uid })
        validateUserDocumentPath(uid, `users/${uid}`)
        await setDoc(doc(db, `users/${uid}`), newUser)
        return newUser
    } catch (error) {
        logger.error("Error creating user profile", { userId: maskIdentifier(uid), error })
        throw error
    }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
        assertUserScope({ userId: uid })
        const docRef = doc(db, `users/${uid}`)
        validateUserDocumentPath(uid, `users/${uid}`)
        await setDoc(
            docRef,
            {
                ...data,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        )
    } catch (error) {
        logger.error("Error updating user profile", { userId: maskIdentifier(uid), error })
        throw error
    }
}
