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
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser)

            if (currentUser) {
                // Fetch user profile
                try {
                    const userProfile = await getUserProfile(currentUser.uid)
                    setProfile(userProfile)

                    // Also fetch today's log while we're at it
                    await refreshTodayLog()
                } catch (error) {
                    console.error("Error fetching user data:", error)
                }
            } else {
                setProfile(null)
                setTodayLog(null)

                // Removed auto-sign-in anonymous for now to force the clear "Sign In" flow we planned
                // We can add it back if we want "Guest Mode" later
            }

            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{ user, profile, loading, todayLog, refreshTodayLog }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
