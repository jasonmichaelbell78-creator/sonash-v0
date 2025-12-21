"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { MeetingsService, Meeting } from "@/lib/db/meetings"
import { useGeolocation } from "@/hooks/use-geolocation"
import { calculateDistance } from "@/lib/utils/distance"
import { MeetingDetailsDialog } from "@/components/meetings/meeting-details-dialog"

const MAX_DISTANCE_MILES = 10

/**
 * Next Closest Meeting Widget
 * Shows the soonest meeting within 10 miles (if geolocation enabled)
 * Falls back to soonest meeting anywhere if:
 * - No meetings within 10 miles
 * - Geolocation denied
 * - No location available
 */
export default function CompactMeetingCountdown() {
    const [nextMeeting, setNextMeeting] = useState<Meeting | null>(null)
    const [timeUntil, setTimeUntil] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [showDialog, setShowDialog] = useState(false)
    const { coordinates: userLocation, status: locationStatus } = useGeolocation({
        enableHighAccuracy: false, // Faster, less battery drain
        timeout: 5000
    })

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

                // Filter to upcoming meetings only (haven't started yet)
                const upcomingToday = todaysMeetings.filter(meeting => {
                    const meetingTime = meeting.time.split(':')
                    const meetingMinutes = parseInt(meetingTime[0]) * 60 + parseInt(meetingTime[1])
                    return meetingMinutes > currentMinutes
                })

                let selectedMeeting: Meeting | null = null

                // If we have user location and it's granted, prioritize nearest meeting within 10 miles
                if (userLocation && locationStatus === "granted") {
                    // Filter to meetings within 10 miles that have coordinates
                    const nearbyMeetings = upcomingToday.filter(meeting => {
                        if (!meeting.coordinates) return false
                        const distance = calculateDistance(userLocation, meeting.coordinates)
                        return distance <= MAX_DISTANCE_MILES
                    })

                    if (nearbyMeetings.length > 0) {
                        // Find the nearest one by distance
                        selectedMeeting = nearbyMeetings.reduce((nearest, meeting) => {
                            if (!meeting.coordinates || !nearest.coordinates) return nearest
                            const distToMeeting = calculateDistance(userLocation, meeting.coordinates)
                            const distToNearest = calculateDistance(userLocation, nearest.coordinates)
                            return distToMeeting < distToNearest ? meeting : nearest
                        })
                    }
                }

                // Fallback: if no nearby meeting found, use soonest meeting anywhere
                if (!selectedMeeting && upcomingToday.length > 0) {
                    selectedMeeting = upcomingToday[0] // Already sorted by time from getMeetingsByDay
                }

                // If no more meetings today, find first meeting tomorrow
                if (!selectedMeeting) {
                    const tomorrow = days[(now.getDay() + 1) % 7]
                    const tomorrowsMeetings = await MeetingsService.getMeetingsByDay(tomorrow)

                    if (tomorrowsMeetings.length > 0) {
                        // Same proximity logic for tomorrow
                        if (userLocation && locationStatus === "granted") {
                            const nearbyTomorrow = tomorrowsMeetings.filter(meeting => {
                                if (!meeting.coordinates) return false
                                const distance = calculateDistance(userLocation, meeting.coordinates)
                                return distance <= MAX_DISTANCE_MILES
                            })

                            if (nearbyTomorrow.length > 0) {
                                selectedMeeting = nearbyTomorrow.reduce((nearest, meeting) => {
                                    if (!meeting.coordinates || !nearest.coordinates) return nearest
                                    const distToMeeting = calculateDistance(userLocation, meeting.coordinates)
                                    const distToNearest = calculateDistance(userLocation, nearest.coordinates)
                                    return distToMeeting < distToNearest ? meeting : nearest
                                })
                            }
                        }

                        if (!selectedMeeting) {
                            selectedMeeting = tomorrowsMeetings[0]
                        }
                    }
                }

                setNextMeeting(selectedMeeting)
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
    }, [userLocation, locationStatus, nextMeeting]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        updateTimeUntil() // eslint-disable-line react-hooks/set-state-in-effect
    }, [nextMeeting]) // eslint-disable-line react-hooks/exhaustive-deps

    function formatTime(time24: string): string {
        const [hours, minutes] = time24.split(':').map(Number)
        const period = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
    }

    function handleClick() {
        if (!nextMeeting) return
        setShowDialog(true)
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
        <>
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
                    <div className="font-handlee text-base font-bold leading-tight group-hover:underline">
                        {nextMeeting.name}
                    </div>
                    <div className="time-display text-sm text-amber-900/70">
                        {formatTime(nextMeeting.time)} {timeUntil && `• ${timeUntil}`}
                    </div>
                </div>
            </div>

            <MeetingDetailsDialog
                meeting={nextMeeting}
                open={showDialog}
                onOpenChange={setShowDialog}
                userLocation={userLocation}
            />
        </>
    )
}
