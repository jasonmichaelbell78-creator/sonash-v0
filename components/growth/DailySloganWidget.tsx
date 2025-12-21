"use client"

/**
 * Daily Slogan Widget
 * Displays a rotating recovery slogan/saying that changes 3x daily
 * (morning/afternoon/evening) with support for scheduled slogans
 */

import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SlogansService } from "@/lib/db/slogans"
import { Lightbulb, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

interface Slogan {
    id: string
    text: string
    author: string
    source?: string
}

export default function DailySloganWidget() {
    const [slogan, setSlogan] = useState<Slogan | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDailySlogan()
    }, [])

    const fetchDailySlogan = async () => {
        try {
            // Fetch all slogans
            const slogansRef = collection(db, "slogans")
            const snapshot = await getDocs(slogansRef)
            const slogans = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Slogan))

            if (slogans.length === 0) {
                setLoading(false)
                return
            }

            // Use hybrid 3x daily rotation (scheduled + time of day)
            const currentSlogan = SlogansService.getSloganForNow(slogans)
            setSlogan(currentSlogan)
        } catch (error) {
            console.error("Error fetching daily slogan:", error)
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50/50 rounded-xl border border-amber-200 p-6 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
            </div>
        )
    }

    if (!slogan) {
        return null // Don't show if no slogans available
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-amber-50 to-yellow-50/50 rounded-xl border border-amber-200 p-6 shadow-sm"
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="shrink-0 p-3 bg-yellow-100 rounded-lg">
                    <Lightbulb className="w-6 h-6 text-yellow-600" />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="text-xs font-body text-amber-900/40 uppercase tracking-widest mb-2">
                        Today's Wisdom
                    </div>
                    <blockquote className="font-heading text-lg text-amber-900 leading-relaxed mb-3">
                        "{slogan.text}"
                    </blockquote>
                    <p className="text-sm text-amber-900/60 font-body">
                        — {slogan.author}
                        {slogan.source && <span className="italic opacity-75"> ({slogan.source})</span>}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}
