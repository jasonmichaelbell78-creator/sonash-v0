"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { auth } from "@/lib/firebase"
import { User, onAuthStateChanged, signInAnonymously } from "firebase/auth"
import { FirestoreService, DailyLog } from "@/lib/firestore-service"
import { UserProfile } from "@/lib/db/users"

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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
    const [todayLogError, setTodayLogError] = useState<string | null>(null)
    const [profileError, setProfileError] = useState<string | null>(null)
    const [profileNotFound, setProfileNotFound] = useState(false)

    const refreshTodayLog = async () => {
        if (user) {
            const result = await FirestoreService.getTodayLog(user.uid)
            setTodayLog(result.log)
            setTodayLogError(result.error ? "Failed to load today's log" : null)
        }
    }

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
                console.error("Error loading Firestore modules:", error)
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

                    // Subscribe to real-time profile updates
                    profileUnsubscribe = onSnapshot(
                        doc(db, "users", currentUser.uid),
                        (docSnap) => {
                            if (docSnap.exists()) {
                                setProfile(docSnap.data() as UserProfile)
                                setProfileNotFound(false)
                            } else {
                                setProfile(null)
                                setProfileNotFound(true)
                            }
                            setLoading(false)
                        },
                        (error) => {
                            console.error("Error fetching user profile:", error)
                            setProfileError("Failed to load profile")
                            setLoading(false)
                        }
                    )

                    // Also fetch today's log (keeping this one-time for now, or could stream it too)
                    try {
                        await refreshTodayLog()
                    } catch (logError) {
                        console.error("Error fetching today's log:", logError)
                        setTodayLogError("Failed to load today's log")
                    }
                } catch (error) {
                    console.error("Error setting up profile listener:", error)
                    setProfileError("Failed to start profile listener")
                    setLoading(false)
                }
            } else {
                setProfile(null)
                setTodayLog(null)
                setTodayLogError(null)
                setLoading(true)
                try {
                    await signInAnonymously(auth)
                } catch (error) {
                    console.error("Error starting anonymous session:", error)
                    setProfileError("Failed to start anonymous session")
                    setLoading(false)
                }
            }
        })

        return () => {
            authUnsubscribe()
            if (profileUnsubscribe) profileUnsubscribe()
        }
    }, [])

    return (
        <AuthContext.Provider value={{ user, profile, loading, todayLog, todayLogError, refreshTodayLog, profileError, profileNotFound }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
