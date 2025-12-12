"use client"

import { MapPin, Home, Map, Calendar, Loader2, CheckCircle2 } from "lucide-react"
import { useState, useEffect, useMemo, useRef } from "react"
import { MeetingsService, type Meeting } from "@/lib/db/meetings"
import { toast } from "sonner"
import { logger } from "@/lib/logger"

export default function ResourcesPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [viewMode, setViewMode] = useState<"today" | "all">("today")
  const [loading, setLoading] = useState(true)

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
          <div className="flex items-center justify-between mb-4">
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

            {/* Click overlay */}
            <button className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/5 transition-colors">
              <span className="sr-only">Open full map</span>
            </button>
          </div>

          {/* Meeting list */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center gap-2 text-amber-900/40 italic p-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-sm">Loading today's schedule...</p>
              </div>
            ) : meetings.length === 0 ? (
              <div className="p-4 border border-dashed border-amber-300 rounded-lg bg-amber-50/50 text-center">
                <p className="text-sm text-amber-900/60 italic mb-3">No meetings found for today.</p>
                <button
                  onClick={handleSeed}
                  className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1.5 rounded-full transition-colors inline-flex items-center gap-1"
                >
                  <span>🌱</span> Seed Initial Data
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-2">
                  <button onClick={handleClear} className="text-[10px] text-red-400 hover:text-red-600 underline">
                    Clear Data (Dev)
                  </button>
                </div>
                {meetings.map((meeting) => (
                  <button
                    key={meeting.id}
                    className="w-full text-left flex items-center gap-3 p-2 hover:bg-amber-50 rounded transition-colors"
                  >
                    <div className={`w-4 h-4 border-2 rounded-sm ${meeting.type === 'NA' ? 'border-amber-500' : 'border-blue-400'}`} />
                    <span className="font-body text-amber-900">
                      <span className="font-bold">{meeting.day.substring(0, 3)} {meeting.time}</span> – {meeting.type}: {meeting.name} <span className="text-amber-900/50">({meeting.neighborhood})</span>
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>

          <p className="font-body text-sm text-amber-900/50 mt-4 italic">Tap a meeting for details or directions.</p>
        </div>
      </div>
    </div>
  )
}
