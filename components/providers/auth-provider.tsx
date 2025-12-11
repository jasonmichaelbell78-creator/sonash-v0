"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { auth } from "@/lib/firebase"
import { User, onAuthStateChanged, signInAnonymously } from "firebase/auth"
import { FirestoreService, DailyLog } from "@/lib/firestore-service"
import { getUserProfile, UserProfile } from "@/lib/db/users"

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    loading: boolean
    todayLog: DailyLog | null
    refreshTodayLog: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    todayLog: null,
    refreshTodayLog: async () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [todayLog, setTodayLog] = useState<DailyLog | null>(null)

    const refreshTodayLog = async () => {
        if (user) {
            const log = await FirestoreService.getTodayLog(user.uid)
            setTodayLog(log)
        }
    }

    useEffect(() => {
        let profileUnsubscribe: (() => void) | null = null

        const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser)

            // Clean up previous profile listener if any
            if (profileUnsubscribe) {
                profileUnsubscribe()
                profileUnsubscribe = null
            }

            if (currentUser) {
                try {
                    // Dynamic import to keep bundle small if needed, consistent with other usage
                    const { onSnapshot, doc } = await import("firebase/firestore")
                    const { db } = await import("@/lib/firebase")

                    // Subscribe to real-time profile updates
                    profileUnsubscribe = onSnapshot(
                        doc(db, "users", currentUser.uid),
                        (docSnap) => {
                            if (docSnap.exists()) {
                                setProfile(docSnap.data() as UserProfile)
                            } else {
                                setProfile(null)
                            }
                            setLoading(false)
                        },
                        (error) => {
                            console.error("Error fetching user profile:", error)
                            setLoading(false)
                        }
                    )

                    // Also fetch today's log (keeping this one-time for now, or could stream it too)
                    await refreshTodayLog()
                } catch (error) {
                    console.error("Error setting up profile listener:", error)
                    setLoading(false)
                }
            } else {
                setProfile(null)
                setTodayLog(null)
                setLoading(false)
            }
        })

        return () => {
            authUnsubscribe()
            if (profileUnsubscribe) profileUnsubscribe()
        }
    }, [])

    return (
        <AuthContext.Provider value={{ user, profile, loading, todayLog, refreshTodayLog }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
