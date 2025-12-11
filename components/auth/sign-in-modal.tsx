"use client"

import { useState } from "react"
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { motion } from "framer-motion"
import { X, Loader2 } from "lucide-react"
import { logger } from "@/lib/logger"

interface SignInModalProps {
    onClose: () => void
    onSuccess: () => void
}

export default function SignInModal({ onClose, onSuccess }: SignInModalProps) {
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError(null)
        try {
            const provider = new GoogleAuthProvider()
            await signInWithPopup(auth, provider)
            onSuccess()
        } catch (err: any) {
            logger.error("Google sign-in failed", { error: err })
            setError("Failed to sign in with Google. Try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password)
            } else {
                await signInWithEmailAndPassword(auth, email, password)
            }
            onSuccess()
        } catch (err: any) {
            logger.error("Email authentication failed", { error: err })
            const msg = err.code === 'auth/invalid-credential'
                ? "Invalid email or password."
                : err.code === 'auth/email-already-in-use'
                    ? "Email already in use."
                    : "Something went wrong."
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm bg-[#fcf8e3] p-6 shadow-xl"
                style={{
                    boxShadow: "2px 4px 12px rgba(0,0,0,0.2)",
                    transform: "rotate(-1deg)",
                }}
            >
                {/* Sticky note tape effect */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-8 bg-white/30 backdrop-blur-md rotate-2" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }} />

                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 hover:bg-black/5 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-stone-600" />
                </button>

                <h2 className="font-rocksalt text-xl text-stone-800 mb-6 text-center mt-2">
                    {isSignUp ? "Join the Circle" : "Welcome Back"}
                </h2>

                {error && (
                    <div className="mb-4 p-2 bg-rose-100 border border-rose-200 text-rose-800 text-sm font-handlee rounded">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full h-12 bg-white border-2 border-stone-200 hover:border-blue-400 hover:bg-blue-50 transition-all font-handlee text-lg flex items-center justify-center gap-2 text-stone-700 rounded-lg group"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                                </svg>
                                <span>Continue with Google</span>
                            </>
                        )}
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="grow border-t border-stone-300"></div>
                        <span className="shrink-0 px-2 text-stone-400 text-sm font-handlee">OR</span>
                        <div className="grow border-t border-stone-300"></div>
                    </div>

                    <form onSubmit={handleEmailSignIn} className="space-y-3">
                        <input
                            type="email"
                            placeholder="Email address"
                            required
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-white border-b-2 border-stone-200 focus:border-blue-400 outline-none font-handlee text-lg placeholder:text-stone-400 transition-colors"
                            style={{ borderRadius: "4px 4px 0 0" }}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-white border-b-2 border-stone-200 focus:border-blue-400 outline-none font-handlee text-lg placeholder:text-stone-400 transition-colors"
                            style={{ borderRadius: "4px 4px 0 0" }}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 mt-2 bg-stone-800 text-[#fcf8e3] font-handlee text-xl hover:bg-stone-700 transition-colors rounded-lg flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? "Sign Up" : "Sign In")}
                        </button>
                    </form>

                    <div className="text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-stone-500 hover:text-stone-800 font-handlee text-base underline decoration-dotted underline-offset-4"
                        >
                            {isSignUp ? "Already have an account? Sign In" : "New here? Create an account"}
                        </button>
                    </div>
                </div>

            </motion.div>
        </div>
    )
}
