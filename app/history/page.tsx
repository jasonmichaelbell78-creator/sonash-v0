"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/components/providers/auth-provider"
import { FirestoreService } from "@/lib/firestore-service"

// Mock data interfaces for now until Firestore is live
interface JournalEntry {
    id: string
    date: string
    mood: string
    content: string
    cravings: boolean
    used: boolean
}

export default function HistoryPage() {
    const { user } = useAuth()
    const [entries, setEntries] = useState<any[]>([])

    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        if (user) {
            FirestoreService.getHistory(user.uid).then((data) => {
                setEntries(data)
            })
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

            {/* Timeline List */}
            <div className="max-w-md mx-auto space-y-4">
                {entries.map((entry) => (
                    <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
              bg-white/50 backdrop-blur-sm rounded-lg p-4 cursor-pointer transition-shadow
              ${expandedId === entry.id ? 'shadow-md ring-1 ring-amber-200' : 'shadow-sm hover:shadow-md'}
            `}
                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
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
                ))}
            </div>
        </div>
    )
}
