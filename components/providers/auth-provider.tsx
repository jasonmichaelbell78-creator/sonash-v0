"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react"
import { auth } from "../../lib/firebase"
import { User, onAuthStateChanged, signInAnonymously } from "firebase/auth"
import type { DocumentSnapshot, FirestoreError } from "firebase/firestore"
import { FirestoreService, DailyLog } from "../../lib/firestore-service"
import { UserProfile } from "../../lib/db/users"
import { logger, maskIdentifier } from "../../lib/logger"

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    loading: boolean
    todayLog: DailyLog | null
    todayLogError: string | null
    profileError: string | null
    profileNotFound: boolean
    refreshTodayLog: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    todayLog: null,
    todayLogError: null,
    profileError: null,
    profileNotFound: false,
    refreshTodayLog: async () => { },
})

export const refreshTodayLogForUser = async (
    firestoreService: typeof FirestoreService,
    userId: string,
    setTodayLog: (log: DailyLog | null) => void,
    setTodayLogError: (message: string | null) => void,
) => {
    const result = await firestoreService.getTodayLog(userId)
    setTodayLog(result.log)
    setTodayLogError(result.error ? "Failed to load today's log" : null)
}

export const ensureAnonymousSession = async (
    authInstance: typeof auth,
    setProfileError: (message: string | null) => void,
    setLoading: (value: boolean) => void,
    signIn: typeof signInAnonymously = signInAnonymously,
) => {
    try {
        await signIn(authInstance)
    } catch (error) {
        logger.error("Error starting anonymous session", { error })
        setProfileError("Failed to start anonymous session")
    } finally {
        setLoading(false)
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
    const [todayLogError, setTodayLogError] = useState<string | null>(null)
    const [profileError, setProfileError] = useState<string | null>(null)
    const [profileNotFound, setProfileNotFound] = useState(false)

    // Use ref to track previous profile data to avoid unnecessary re-renders
    const previousProfileRef = useRef<UserProfile | null>(null)

    const refreshTodayLog = useCallback(async () => {
        if (user) {
            await refreshTodayLogForUser(FirestoreService, user.uid, setTodayLog, setTodayLogError)
        }
    }, [user])

    /**
     * Shallow equality check for profile data
     * Much faster than JSON.stringify (O(n) vs O(n*m) for nested objects)
     */
    const isProfileEqual = (a: UserProfile | null, b: UserProfile | null): boolean => {
        if (a === b) return true
        if (!a || !b) return false

        // Compare top-level keys
        const keysA = Object.keys(a) as Array<keyof UserProfile>
        const keysB = Object.keys(b) as Array<keyof UserProfile>

        if (keysA.length !== keysB.length) return false

        // Shallow comparison (works for UserProfile since it's mostly primitives)
        return keysA.every(key => a[key] === b[key])
    }

    // Memoized snapshot handler with efficient data diffing
    const handleProfileSnapshot = useCallback((docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile

            // Only update state if data actually changed (reduces re-renders)
            if (!isProfileEqual(data, previousProfileRef.current)) {
                previousProfileRef.current = data
                setProfile(data)
                setProfileNotFound(false)
            }
        } else {
            if (previousProfileRef.current !== null) {
                previousProfileRef.current = null
                setProfile(null)
                setProfileNotFound(true)
            }
        }
        setLoading(false)
    }, [])

    const handleProfileError = useCallback((currentUserId: string) => (error: FirestoreError) => {
        logger.error("Error fetching user profile", {
            userId: maskIdentifier(currentUserId),
            error,
        })
        setProfileError("Failed to load profile")
        setLoading(false)
    }, [])

    useEffect(() => {
        let profileUnsubscribe: (() => void) | null = null
        const firestorePromise = Promise.all([
            import("firebase/firestore"),
            import("@/lib/firebase"),
        ])
            .then(([firestore, firebase]) => ({
                onSnapshot: firestore.onSnapshot,
                doc: firestore.doc,
                db: firebase.db,
            }))
            .catch((error) => {
                logger.error("Error loading Firestore modules", { error })
                throw error
            })

        const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser)
            setProfileError(null)
            setProfileNotFound(false)

            // Clean up previous profile listener if any
            if (profileUnsubscribe) {
                profileUnsubscribe()
                profileUnsubscribe = null
            }

            if (currentUser) {
                try {
                    const { onSnapshot, doc, db } = await firestorePromise

                    // Subscribe to real-time profile updates with memoized handler
                    profileUnsubscribe = onSnapshot(
                        doc(db, "users", currentUser.uid),
                        handleProfileSnapshot,
                        handleProfileError(currentUser.uid)
                    )

                    // Also fetch today's log
                    try {
                        await refreshTodayLog()
                    } catch (logError) {
                        logger.error("Error fetching today's log", {
                            userId: maskIdentifier(currentUser.uid),
                            error: logError,
                        })
                        setTodayLogError("Failed to load today's log")
                    }
                } catch (error) {
                    logger.error("Error setting up profile listener", {
                        userId: maskIdentifier(currentUser.uid),
                        error,
                    })
                    setProfileError("Failed to start profile listener")
                    setLoading(false)
                }
            } else {
                setProfile(null)
                setTodayLog(null)
                setTodayLogError(null)
                setLoading(true)
                try {
                    await ensureAnonymousSession(auth, setProfileError, setLoading)
                } catch (error) {
                    // ensureAnonymousSession already handles errors internally
                    // This catch is just a safety net for unexpected errors
                    logger.error("Unexpected error in anonymous session setup", { error })
                    setLoading(false)
                }
            }
        })

        return () => {
            authUnsubscribe()
            if (profileUnsubscribe) profileUnsubscribe()
        }
    }, [handleProfileSnapshot, handleProfileError, refreshTodayLog])

    return (
        <AuthContext.Provider value={{ user, profile, loading, todayLog, todayLogError, refreshTodayLog, profileError, profileNotFound }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
