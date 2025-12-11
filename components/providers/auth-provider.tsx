"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react"
import { auth } from "../../lib/firebase"
import { User, onAuthStateChanged, signInAnonymously } from "firebase/auth"
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
    const previousProfileRef = useRef<string | null>(null)

    const refreshTodayLog = useCallback(async () => {
        if (user) {
            await refreshTodayLogForUser(FirestoreService, user.uid, setTodayLog, setTodayLogError)
        }
    }, [user])

    // Memoized snapshot handler with data diffing
    const handleProfileSnapshot = useCallback((docSnap: any) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile
            const dataString = JSON.stringify(data)

            // Only update state if data actually changed (reduces re-renders)
            if (dataString !== previousProfileRef.current) {
                previousProfileRef.current = dataString
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

    const handleProfileError = useCallback((currentUserId: string) => (error: any) => {
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
