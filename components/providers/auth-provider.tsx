"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, User, signInAnonymously } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthContextType {
    user: User | null
    loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user)
            setLoading(false)
        })

        // Auto sign-in anonymously for MVP if not logged in
        // This removes friction for testing "My Journal" immediately
        if (!auth.currentUser) {
            signInAnonymously(auth).catch((error) => {
                console.error("Auto-signin failed", error)
            })
        }

        return () => unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
