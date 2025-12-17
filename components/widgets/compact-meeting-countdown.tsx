"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { MeetingsService, Meeting } from "@/lib/db/meetings"

/**
 * Next Closest Meeting Widget
 * Shows the name and time of the next upcoming meeting
 * Clickable to navigate to meeting details
 */
export default function CompactMeetingCountdown() {
    const [nextMeeting, setNextMeeting] = useState<Meeting | null>(null)
    const [timeUntil, setTimeUntil] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function findNextMeeting() {
            try {
                // Get all meetings for today
                const now = new Date()
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                const today = days[now.getDay()]

                const todaysMeetings = await MeetingsService.getMeetingsByDay(today)

                // Current time in minutes since midnight
                const currentMinutes = now.getHours() * 60 + now.getMinutes()

                // Find the next meeting that hasn't started yet
                const upcoming = todaysMeetings.find(meeting => {
                    const meetingTime = meeting.time.split(':')
                    const meetingMinutes = parseInt(meetingTime[0]) * 60 + parseInt(meetingTime[1])
                    return meetingMinutes > currentMinutes
                })

                if (upcoming) {
                    setNextMeeting(upcoming)
                } else {
                    // No more meetings today, find first meeting tomorrow
                    const tomorrow = days[(now.getDay() + 1) % 7]
                    const tomorrowsMeetings = await MeetingsService.getMeetingsByDay(tomorrow)
                    if (tomorrowsMeetings.length > 0) {
                        setNextMeeting(tomorrowsMeetings[0])
                    }
                }

                setLoading(false)
            } catch (error) {
                console.error("Error finding next meeting:", error)
                setLoading(false)
            }
        }

        findNextMeeting()

        // Update every minute
        const interval = setInterval(() => {
            updateTimeUntil()
        }, 60000)

        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        updateTimeUntil()
    }, [nextMeeting])

    function updateTimeUntil() {
        if (!nextMeeting) return

        const now = new Date()
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        const today = days[now.getDay()]

        const [hours, minutes] = nextMeeting.time.split(':').map(Number)
        const meetingDate = new Date()

        // If meeting is tomorrow
        if (nextMeeting.day !== today) {
            meetingDate.setDate(meetingDate.getDate() + 1)
        }

        meetingDate.setHours(hours, minutes, 0, 0)

        const diff = meetingDate.getTime() - now.getTime()
        const hoursUntil = Math.floor(diff / (1000 * 60 * 60))
        const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        if (hoursUntil === 0) {
            setTimeUntil(`${minutesUntil}m`)
        } else if (hoursUntil < 24) {
            setTimeUntil(`${hoursUntil}h ${minutesUntil}m`)
        } else {
            setTimeUntil(`tmrw`)
        }
    }

    function formatTime(time24: string): string {
        const [hours, minutes] = time24.split(':').map(Number)
        const period = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
    }

    function handleClick() {
        if (!nextMeeting) return
        // TODO: Navigate to meeting details page
        // For now, we could open the meetings finder or show a modal
        console.log("Navigate to meeting:", nextMeeting)
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-amber-900/40">
                <Clock className="w-4 h-4 animate-pulse" />
                <span className="font-handlee text-sm">Loading...</span>
            </div>
        )
    }

    if (!nextMeeting) {
        return (
            <div className="flex items-center gap-2 text-amber-900/40">
                <Clock className="w-4 h-4" />
                <span className="font-handlee text-sm italic">No upcoming meetings</span>
            </div>
        )
    }

    return (
        <div
            onClick={handleClick}
            className="flex flex-col items-end gap-0.5 text-amber-900 hover:text-amber-700 transition-colors cursor-pointer group"
        >
            <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-heading text-xs font-semibold uppercase tracking-wide text-amber-900/60">
                    Next Closest Meeting
                </span>
            </div>
            <div className="text-right">
                <div className="font-handlee text-base font-bold leading-tight">
                    {nextMeeting.name}
                </div>
                <div className="font-handlee text-sm text-amber-900/70">
                    {formatTime(nextMeeting.time)} {timeUntil && `• ${timeUntil}`}
                </div>
            </div>
        </div>
    )
}
