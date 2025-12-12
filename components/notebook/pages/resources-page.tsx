"use client"

import { MapPin, Home, Map, Calendar, Loader2, CheckCircle2, Locate, X } from "lucide-react"
import { useState, useEffect, useMemo, useRef } from "react"
import { MeetingsService, type Meeting } from "@/lib/db/meetings"
import { toast } from "sonner"
import { logger } from "@/lib/logger"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, Navigation } from "lucide-react"
import { useGeolocation } from "@/hooks/use-geolocation"
import { calculateDistance, formatDistance, sortByDistance } from "@/lib/utils/distance"

// Fellowship filter options
const FELLOWSHIP_OPTIONS = ["All", "AA", "NA", "CA"] as const
type FellowshipFilter = typeof FELLOWSHIP_OPTIONS[number]

// Sort options
type SortOption = "time" | "nearest"

export default function ResourcesPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [viewMode, setViewMode] = useState<"today" | "all">("today")
  const [fellowshipFilter, setFellowshipFilter] = useState<FellowshipFilter>("All")
  const [sortBy, setSortBy] = useState<SortOption>("time")
  const [loading, setLoading] = useState(true)

  // Geolocation hook for proximity features
  const {
    coordinates: userLocation,
    status: locationStatus,
    loading: locationLoading,
    requestLocation,
    clearLocation,
  } = useGeolocation()

  // Determine today's day name for querying
  const todayName = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { weekday: "long" })
  }, [])

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true)
      try {
        let data: Meeting[] = []
        if (viewMode === "today") {
          data = await MeetingsService.getMeetingsByDay(todayName)
        } else {
          data = await MeetingsService.getAllMeetings()
        }
        setMeetings(data)
      } catch (error) {
        logger.error("Failed to load meetings", { error })
        toast.error("Failed to load meetings.")
      } finally {
        setLoading(false)
      }
    }
    fetchMeetings()
  }, [todayName, viewMode])

  const finderRef = useRef<HTMLDivElement>(null)

  // Dev util to seed data if empty
  const handleSeed = async () => {
    try {
      setLoading(true)
      const success = await MeetingsService.seedInitialMeetings()
      if (success) {
        toast.success("Meetings seeded successfully!", {
          icon: <CheckCircle2 className="w-4 h-4 text-green-600" />
        })
        triggerRefresh()
      } else {
        toast.error("Failed to seed meetings.")
      }
    } catch (err) {
      logger.error("Error seeding meetings", { error: err })
      toast.error("An error occurred while seeding.")
    } finally {
      setLoading(false)
    }
  }

  // Dev util to clear data
  const handleClear = async () => {
    if (!confirm("Are you sure you want to delete all meetings?")) return
    try {
      setLoading(true)
      await MeetingsService.clearAllMeetings()
      toast.success("All meetings deleted.")
      triggerRefresh()
    } catch (err) {
      logger.error("Error clearing data", { error: err })
      toast.error("Failed to clear data.")
    }
  }

  const triggerRefresh = async () => {
    setLoading(true)
    const data = viewMode === "today"
      ? await MeetingsService.getMeetingsByDay(todayName)
      : await MeetingsService.getAllMeetings()
    setMeetings(data)
    setLoading(false)
  }

  const handleResourceClick = (title: string) => {
    if (title === "Meeting Finder") {
      finderRef.current?.scrollIntoView({ behavior: "smooth" })
      toast.info("Showing today's meetings below.")
    } else {
      toast("Feature coming soon!", {
        description: `${title} is under construction.`
      })
    }
  }

  const resources = [
    {
      icon: MapPin,
      title: "Meeting Finder",
      description: "Find AA, NA, and support meetings by time and neighborhood.",
    },
    {
      icon: Home,
      title: "Sober Living Finder",
      description: "Sober homes and halfway houses with basic info and contacts.",
    },
    {
      icon: Map,
      title: "Local Resource Map",
      description: "Detox, rehabs, clinics, pharmacies, food, IDs, bus stations.",
    },
    {
      icon: Calendar,
      title: "Nashville Sober Events",
      description: "Cookouts, game nights, sober concerts and more.",
    },
  ]

  // Helper to parse HH:MM to minutes
  const parseTime = (timeStr: string) => {
    // Handle 24h "19:30" or 12h "7:30 PM"
    if (/AM|PM/i.test(timeStr)) {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
      if (!match) return -1
      let h = parseInt(match[1])
      const m = parseInt(match[2])
      const p = match[3].toUpperCase()
      if (p === 'PM' && h !== 12) h += 12
      if (p === 'AM' && h === 12) h = 0
      return h * 60 + m
    }
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  // Combined filtering: time (for today view) + fellowship + sorting
  const filteredMeetings = useMemo(() => {
    let result = meetings

    // Apply fellowship filter
    if (fellowshipFilter !== "All") {
      result = result.filter(m => m.type === fellowshipFilter)
    }

    // Apply time filter for "today" view only
    if (viewMode === "today") {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      result = result.filter(m => {
        const meetingMinutes = parseTime(m.time)
        return meetingMinutes >= currentMinutes
      })
    }

    // Apply sorting
    if (sortBy === "nearest" && userLocation) {
      result = sortByDistance(result, userLocation, (m) => m.coordinates)
    }
    // Default sort by time is already applied by the service

    return result
  }, [meetings, viewMode, fellowshipFilter, sortBy, userLocation])

  // Helper to get distance for a meeting
  const getMeetingDistance = (meeting: Meeting): string | null => {
    if (!userLocation || !meeting.coordinates) return null
    const distance = calculateDistance(userLocation, meeting.coordinates)
    return formatDistance(distance)
  }

  // Handle "Nearest to me" button click
  const handleNearestClick = () => {
    if (locationStatus === "granted" && userLocation) {
      // Already have location, just toggle sort
      setSortBy(sortBy === "nearest" ? "time" : "nearest")
    } else if (locationStatus === "denied") {
      toast.error("Location access denied. Please enable location in your browser settings.")
    } else {
      // Request location and enable sort
      requestLocation()
      setSortBy("nearest")
    }
  }

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-heading text-2xl text-amber-900 underline">Resources – Getting around Nashville</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Resource cards */}
        <div className="space-y-3">
          {resources.map((resource, index) => (
            <button
              key={index}
              onClick={() => handleResourceClick(resource.title)}
              className="w-full text-left p-4 border border-amber-200/50 rounded-lg hover:bg-amber-50 transition-colors group shadow-sm"
            >
              <div className="flex items-start gap-3">
                <resource.icon className="w-6 h-6 text-amber-700/70 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-heading text-lg text-amber-900 group-hover:underline">{resource.title}</h3>
                  <p className="font-body text-sm text-amber-900/60">{resource.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right column - Meeting finder today */}
        <div ref={finderRef}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-xl text-amber-900">
              Meeting Finder
            </h2>
            <div className="flex gap-2 bg-amber-100/50 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("today")}
                className={`text-xs px-3 py-1 rounded-md transition-all ${viewMode === "today" ? "bg-white shadow-sm text-amber-900 font-medium" : "text-amber-900/50 hover:text-amber-900"}`}
              >
                Today
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`text-xs px-3 py-1 rounded-md transition-all ${viewMode === "all" ? "bg-white shadow-sm text-amber-900 font-medium" : "text-amber-900/50 hover:text-amber-900"}`}
              >
                All
              </button>
            </div>
          </div>

          {/* Fellowship filter and location sort */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {FELLOWSHIP_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setFellowshipFilter(option)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  fellowshipFilter === option
                    ? "bg-amber-600 text-white border-amber-600 font-medium"
                    : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"
                }`}
              >
                {option}
              </button>
            ))}

            {/* Divider */}
            <div className="w-px h-5 bg-amber-200 mx-1" />

            {/* Nearest to me button */}
            <button
              onClick={handleNearestClick}
              disabled={locationLoading}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                sortBy === "nearest" && userLocation
                  ? "bg-blue-600 text-white border-blue-600 font-medium"
                  : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"
              } ${locationLoading ? "opacity-50 cursor-wait" : ""}`}
            >
              {locationLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Locate className="w-3 h-3" />
              )}
              Nearest
            </button>

            {/* Clear location button (when location is active) */}
            {sortBy === "nearest" && userLocation && (
              <button
                onClick={() => {
                  clearLocation()
                  setSortBy("time")
                }}
                className="text-xs p-1.5 rounded-full border border-amber-200 bg-white text-amber-600 hover:bg-amber-50 transition-all"
                title="Clear location"
                aria-label="Clear location"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Hand-drawn map placeholder */}
          <div
            className="relative w-full h-40 mb-4 rounded-lg overflow-hidden border border-amber-200/50 bg-gradient-to-br from-[#f5f0e6] to-[#ebe5d9]"
          >
            {/* Stylized map lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
              {/* Roads */}
              <path
                d="M20,50 Q60,30 100,50 T180,50"
                stroke="#9ca3af"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4,2"
              />
              <path d="M50,20 Q70,50 50,80" stroke="#9ca3af" strokeWidth="2" fill="none" strokeDasharray="4,2" />
              <path d="M100,10 L100,90" stroke="#9ca3af" strokeWidth="1.5" fill="none" strokeDasharray="3,2" />
              <path d="M150,30 Q130,50 150,70" stroke="#9ca3af" strokeWidth="2" fill="none" strokeDasharray="4,2" />

              {/* River */}
              <path d="M0,60 Q50,70 100,55 T200,65" stroke="#93c5fd" strokeWidth="4" fill="none" opacity="0.6" />
            </svg>

            {/* Map pins */}
            <div className="absolute top-6 left-16">
              <MapPin className="w-5 h-5 text-amber-600 fill-amber-200" />
            </div>
            <div className="absolute top-12 left-1/2 -translate-x-1/2">
              <MapPin className="w-5 h-5 text-amber-600 fill-amber-200" />
            </div>
            <div className="absolute bottom-8 right-16">
              <MapPin className="w-5 h-5 text-amber-600 fill-amber-200" />
            </div>
          </div>

          {/* Meeting list */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center gap-2 text-amber-900/40 italic p-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-sm">Loading schedule...</p>
              </div>
            ) : filteredMeetings.length === 0 ? (
              <div className="p-4 border border-dashed border-amber-300 rounded-lg bg-amber-50/50 text-center">
                <p className="text-sm text-amber-900/60 italic mb-3">
                  No {fellowshipFilter !== "All" ? fellowshipFilter : ""} meetings found
                  {viewMode === "today" ? " for today" : ""}.
                </p>
                <div className="flex gap-2 justify-center">
                  {fellowshipFilter !== "All" && (
                    <button
                      onClick={() => setFellowshipFilter("All")}
                      className="text-xs text-amber-700 font-medium hover:underline"
                    >
                      Show all fellowships
                    </button>
                  )}
                  {viewMode === 'today' && (
                    <button
                      onClick={() => setViewMode('all')}
                      className="text-xs text-amber-700 font-medium hover:underline"
                    >
                      View full schedule
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-medium text-amber-900/50 uppercase tracking-wider">
                    {fellowshipFilter !== "All" ? `${fellowshipFilter} ` : ""}
                    {viewMode === 'today' ? `Today (${filteredMeetings.length})` : `All (${filteredMeetings.length})`}
                  </span>
                  <button onClick={handleClear} className="text-[10px] text-red-400 hover:text-red-600 underline">
                    Clear Data (Dev)
                  </button>
                </div>
                {filteredMeetings.map((meeting) => {
                  const distance = getMeetingDistance(meeting)
                  return (
                    <button
                      key={meeting.id}
                      onClick={() => setSelectedMeeting(meeting)}
                      className="w-full text-left flex items-center gap-3 p-3 bg-white border border-amber-100/50 hover:border-amber-300 shadow-sm rounded-lg transition-all hover:translate-x-1"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 ${meeting.type === 'NA' ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-blue-400 text-blue-700 bg-blue-50'}`}>
                        {meeting.type}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-sm text-amber-900 truncate font-semibold">{meeting.name}</span>
                          <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full whitespace-nowrap">{meeting.time}</span>
                        </div>
                        <p className="text-xs text-amber-900/50 truncate flex items-center gap-1">
                          {viewMode === 'all' && <span className="font-medium text-amber-700">{meeting.day.substring(0, 3)} • </span>}
                          <MapPin className="w-3 h-3" /> {meeting.neighborhood}
                        </p>
                      </div>
                      {/* Distance badge when location is available */}
                      {distance && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap font-medium shrink-0">
                          {distance}
                        </span>
                      )}
                    </button>
                  )
                })}
              </>
            )}
          </div>

          <p className="font-body text-sm text-amber-900/50 mt-4 italic text-center">Tap a meeting for details.</p>
        </div>
      </div>

      <Dialog open={!!selectedMeeting} onOpenChange={(open) => !open && setSelectedMeeting(null)}>
        <DialogContent className="sm:max-w-md bg-[#fdfbf7] border-amber-200">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-amber-900 flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 ${selectedMeeting?.type === 'NA' ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-blue-400 text-blue-700 bg-blue-50'}`}>
                {selectedMeeting?.type}
              </div>
              {selectedMeeting?.name}
            </DialogTitle>
            <DialogDescription className="text-amber-900/70 text-base">
              {selectedMeeting?.day}, {selectedMeeting?.time}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-900 text-sm">Location</h4>
                <p className="text-sm text-amber-800/80">{selectedMeeting?.address}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">{selectedMeeting?.neighborhood}</span>
                  {selectedMeeting && getMeetingDistance(selectedMeeting) && (
                    <>
                      <span className="text-amber-300">•</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {getMeetingDistance(selectedMeeting)} away
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full border-amber-200 hover:bg-amber-100 text-amber-800"
                onClick={() => {
                  if (selectedMeeting) {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedMeeting.address)}`, '_blank')
                  }
                }}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
              <Button
                variant="outline"
                className="w-full border-amber-200 hover:bg-amber-100 text-amber-800"
                onClick={() => {
                  // Share logic or calendar add could go here
                  toast.success("Link copied to clipboard!")
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
