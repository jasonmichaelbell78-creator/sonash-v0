"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/components/providers/auth-provider"
import { createUserProfile, updateUserProfile } from "@/lib/db/users"
import { Loader2, ArrowRight, Calendar } from "lucide-react"

interface OnboardingWizardProps {
    onComplete: () => void
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const { user } = useAuth()
    const [step, setStep] = useState<"welcome" | "clean-date">("welcome")
    const [nickname, setNickname] = useState("")
    const [cleanDate, setCleanDate] = useState("")
    const [time, setTime] = useState("08:00") // default 8am
    const [loading, setLoading] = useState(false)

    const handleNext = async () => {
        if (!user) return

        setLoading(true)
        try {
            if (step === "welcome") {
                // Just move to next step, we'll save everything at the end
                // But maybe create the base profile doc now if it doesn't exist?
                // Let's just create/update at the end for simplicity
                setStep("clean-date")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleFinish = async () => {
        if (!user) return
        setLoading(true)

        try {
            // Create timestamp from inputs
            // cleanDate is YYYY-MM-DD, time is HH:MM
            const dateObj = new Date(`${cleanDate}T${time}:00`)
            // Convert to Firestore Timestamp (using firebase client SDK in calling code or here)
            // Actually we need to import Timestamp from firebase/firestore
            const { Timestamp } = await import("firebase/firestore")
            const cleanStart = Timestamp.fromDate(dateObj)

            // Ensure profile exists or update it
            // We use createUserProfile if it's brand new, or updateUserProfile if partial
            // Let's safe-guard: try create, if fail (already exists), update.
            // But our db util 'createUserProfile' overwrites? No, let's look at logic.
            // Actually let's just use updateUserProfile with merge, but we need ensure the doc exists?
            // Our createUserProfile does setDoc.

            await createUserProfile(user.uid, user.email, nickname)

            // Update with clean date specifically
            await updateUserProfile(user.uid, {
                cleanStart: cleanStart,
                nickname: nickname // ensure nickname is set specific to input
            })

            onComplete()
        } catch (error) {
            console.error("Setup failed", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-[#fcf8e3] rounded-lg shadow-2xl overflow-hidden relative"
                style={{
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    transform: "rotate(1deg)"
                }}
            >
                {/* Paper texture/lines */}
                <div className="absolute inset-x-0 top-0 h-16 bg-red-100/30 border-b border-red-200/50" />
                <div className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #9ca3af20 31px, #9ca3af20 32px)" }}
                />

                <div className="relative p-8 pt-10">
                    <AnimatePresence mode="wait">
                        {step === "welcome" && (
                            <motion.div
                                key="welcome"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="font-rocksalt text-2xl text-stone-800 text-center">Welcome home.</h2>
                                <p className="font-handlee text-lg text-stone-600 text-center">
                                    This notebook is your safe place. <br />
                                    What should we call you?
                                </p>

                                <input
                                    type="text"
                                    placeholder="Your Name or Nickname"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="w-full bg-transparent border-b-2 border-stone-400 p-2 text-center font-handlee text-2xl focus:border-blue-500 outline-none text-stone-800 placeholder:text-stone-400/50"
                                    autoFocus
                                />

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleNext}
                                        disabled={!nickname.trim()}
                                        className="flex items-center gap-2 bg-stone-800 text-[#fcf8e3] px-6 py-3 rounded-full font-handlee text-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                                    >
                                        Next <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === "clean-date" && (
                            <motion.div
                                key="clean-date"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="font-rocksalt text-2xl text-stone-800 text-center">Your Clean Date</h2>
                                <p className="font-handlee text-lg text-stone-600 text-center">
                                    When was your last drink or use? <br />
                                    <span className="text-sm text-stone-400">(It's okay if it was today. We start from now.)</span>
                                </p>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                                        <input
                                            type="date"
                                            value={cleanDate}
                                            onChange={(e) => setCleanDate(e.target.value)}
                                            className="w-full bg-white/50 border border-stone-300 rounded-lg py-3 pl-10 pr-4 font-handlee text-xl outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="flex items-center gap-4 justify-center">
                                        <span className="font-handlee text-stone-500">at roughly</span>
                                        <input
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="bg-white/50 border border-stone-300 rounded-lg py-2 px-4 font-handlee text-xl outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4 items-center">
                                    <button
                                        onClick={() => setStep("welcome")}
                                        className="text-stone-500 font-handlee hover:text-stone-800"
                                    >
                                        Back
                                    </button>

                                    <button
                                        onClick={handleFinish}
                                        disabled={!cleanDate}
                                        className="flex items-center gap-2 bg-stone-800 text-[#fcf8e3] px-6 py-3 rounded-full font-handlee text-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start My Journal"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}
