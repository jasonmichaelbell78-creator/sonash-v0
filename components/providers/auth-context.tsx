"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { auth } from "@/lib/firebase"
import { User, onAuthStateChanged, signInAnonymously } from "firebase/auth"
import { logger } from "@/lib/logger"
import { shouldShowLinkPrompt } from "@/lib/auth/account-linking"

/**
 * AuthContext - Core authentication state
 * 
 * Contains only auth-related state that rarely changes:
 * - user: Firebase User object
 * - loading: Initial auth state loading
 * - isAnonymous: Whether user is anonymous
 * - showLinkPrompt: Whether to show account linking prompt
 */

interface AuthContextType {
    user: User | null
    loading: boolean
    isAnonymous: boolean
    showLinkPrompt: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAnonymous: false,
    showLinkPrompt: false,
})

export const ensureAnonymousSession = async (
    authInstance: typeof auth,
    setLoading: (value: boolean) => void,
    signIn: typeof signInAnonymously = signInAnonymously,
) => {
    try {
        await signIn(authInstance)
    } catch (error) {
        logger.error("Error starting anonymous session", { error })
    } finally {
        setLoading(false)
    }
}

interface AuthProviderProps {
    children: ReactNode
    onUserChange?: (user: User | null) => void
}

export function AuthProvider({ children, onUserChange }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser)
            onUserChange?.(currentUser)

            if (!currentUser) {
                setLoading(true)
                await ensureAnonymousSession(auth, setLoading)
            } else {
                setLoading(false)
            }
        })

        return unsubscribe
    }, [onUserChange])

    // Computed values
    const isAnonymous = user?.isAnonymous ?? false
    const showLinkPrompt = shouldShowLinkPrompt(user)

    return (
        <AuthContext.Provider value={{ user, loading, isAnonymous, showLinkPrompt }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuthCore = () => useContext(AuthContext)
