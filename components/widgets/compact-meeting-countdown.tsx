"use client"

import { useState, useEffect } from "react"
import { Clock, Sparkles } from "lucide-react"

/**
 * Compact Meeting Countdown - Minimal version for top-right header
 */
export default function CompactMeetingCountdown() {
    const [timeRemaining, setTimeRemaining] = useState<string | null>(null)

    useEffect(() => {
        function calculateNextMeeting() {
            const now = new Date()
            const today7PM = new Date()
            today7PM.setHours(19, 0, 0, 0)

            let nextMeeting = today7PM
            if (now > today7PM) {
                nextMeeting = new Date(today7PM.getTime() + 24 * 60 * 60 * 1000)
            }

            const diff = nextMeeting.getTime() - now.getTime()
            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

            if (hours === 0) {
                setTimeRemaining(`${minutes}m`)
            } else if (hours < 24) {
                setTimeRemaining(`${hours}h ${minutes}m`)
            } else {
                setTimeRemaining(`tmrw 7pm`)
            }
        }

        calculateNextMeeting()
        const interval = setInterval(calculateNextMeeting, 60000)

        return () => clearInterval(interval)
    }, [])

    if (!timeRemaining) return null

    return (
        <div className="flex items-center gap-1.5 text-amber-900/50 hover:text-amber-900/70 transition-colors cursor-pointer group">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-handlee text-xs">Next: {timeRemaining}</span>
        </div>
    )
}
