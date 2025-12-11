import { db } from "../firebase"
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore"
import { z } from "zod"
import { logger, maskIdentifier } from "../logger"
import { assertUserScope, validateUserDocumentPath } from "../security/firestore-validation"
import { isFirestoreTimestamp } from "../types/firebase-types"

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

// Zod schema for validation
const TimestampSchema = z.custom<Timestamp>((val) => {
    return val === null || isFirestoreTimestamp(val)
}, "Must be a valid Firestore Timestamp")

const UserProfileSchema = z.object({
    uid: z.string().min(1, "UID is required"),
    email: z.string().email("Must be a valid email").nullable(),
    nickname: z.string().min(1, "Nickname is required").max(50, "Nickname must be 50 characters or less"),
    cleanStart: TimestampSchema.nullable(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
    preferences: z.object({
        theme: z.literal("blue"),
        largeText: z.boolean(),
        simpleLanguage: z.boolean(),
    }),
})

const PartialUserProfileUpdateSchema = z.object({
    email: z.string().email().nullable().optional(),
    nickname: z.string().min(1).max(50).optional(),
    cleanStart: TimestampSchema.nullable().optional(),
    preferences: z.object({
        theme: z.literal("blue"),
        largeText: z.boolean(),
        simpleLanguage: z.boolean(),
    }).partial().optional(),
})

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

        // Validate input data
        const validatedData = PartialUserProfileUpdateSchema.parse(data)

        const docRef = doc(db, `users/${uid}`)
        validateUserDocumentPath(uid, `users/${uid}`)
        await setDoc(
            docRef,
            {
                ...validatedData,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        )
    } catch (error) {
        if (error instanceof z.ZodError) {
            logger.error("Invalid user profile data", {
                userId: maskIdentifier(uid),
                errors: error.errors
            })
            throw new Error("Invalid user profile data: " + error.errors.map(e => e.message).join(", "))
        }
        logger.error("Error updating user profile", { userId: maskIdentifier(uid), error })
        throw error
    }
}
