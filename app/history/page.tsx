"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/components/providers/auth-provider"
import { FirestoreService, type DailyLog } from "@/lib/firestore-service"
import { Loader2, AlertCircle } from "lucide-react"
import { AuthErrorBanner } from "@/components/status/auth-error-banner"
import { logger, maskIdentifier } from "@/lib/logger"

export default function HistoryPage() {
    const { user } = useAuth()
    const [entries, setEntries] = useState<DailyLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        if (user) {
            setLoading(true)
            FirestoreService.getHistory(user.uid)
                .then((result) => {
                    setEntries(result.entries)
                    setError(result.error ? "Could not load your journal history. Please try again." : null)
                })
                .catch((err) => {
                    logger.error("History fetch failed", { userId: maskIdentifier(user.uid), error: err })
                    setError("Could not load your journal history. Please try again.")
                })
                .finally(() => {
                    setLoading(false)
                })
        } else {
            // If no user yet (loading auth), keep loading or wait
            // AuthProvider handles global loading, so we can wait.
            if (!user) setLoading(false)
        }
    }, [user])

    return (
        <div className="min-h-screen bg-[#f5f0e6] p-4 font-sans text-amber-900">
            {/* Header */}
            <div className="max-w-md mx-auto mb-8 pt-4 flex items-center justify-between">
                <h1 className="font-heading text-2xl">My Journal</h1>
                <Link
                    href="/"
                    className="text-sm font-body underline decoration-amber-900/30 hover:text-amber-700"
                >
                    Back to Book
                </Link>
            </div>

            <AuthErrorBanner />

            {/* Error State */}
            {error && (
                <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            {/* Content */}
            <div className="max-w-md mx-auto space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-900/30" />
                    </div>
                ) : entries.length === 0 && !error ? (
                    <div className="text-center py-12 text-amber-900/40 font-handwriting text-xl">
                        <p>No entries yet. Write something in your notebook!</p>
                    </div>
                ) : (
                    entries.map((entry) => (
                        <motion.div
                            key={entry.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`
                  bg-white/50 backdrop-blur-sm rounded-lg p-4 cursor-pointer transition-shadow
                  ${expandedId === entry.id ? 'shadow-md ring-1 ring-amber-200' : 'shadow-sm hover:shadow-md'}
                `}
                            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id || null)}
                        >
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-heading text-lg">{entry.date}</span>
                                <div className="flex items-center gap-3">
                                    {entry.used && (
                                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                            RELAPSE
                                        </span>
                                    )}
                                    {entry.cravings && !entry.used && (
                                        <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                            CRAVING
                                        </span>
                                    )}
                                    <span className="text-xl">{entry.mood}</span>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {expandedId === entry.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-3 border-t border-amber-900/10">
                                            <p className="font-handwriting text-xl leading-relaxed whitespace-pre-wrap text-blue-900/80"
                                                style={{ fontFamily: 'var(--font-caveat)' }}>
                                                {entry.content}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Preview if not expanded */}
                            {expandedId !== entry.id && (
                                <p className="font-handwriting text-lg text-amber-900/40 truncate"
                                    style={{ fontFamily: 'var(--font-caveat)' }}>
                                    {entry.content}
                                </p>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}
