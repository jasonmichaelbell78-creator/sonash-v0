
import dynamic from "next/dynamic"

import { MapPin, Home, Map, Calendar, Loader2, Locate, X, Clock } from "lucide-react"
import { useState, useEffect, useMemo, useRef } from "react"
import { MeetingsService, type Meeting } from "@/lib/db/meetings"
import { SoberLivingService, type SoberLivingHome } from "@/lib/db/sober-living"
import { INITIAL_SOBER_LIVING_HOMES } from "@/scripts/seed-sober-living-data"
import { toast } from "sonner"
import { logger } from "@/lib/logger"
import { useAuth } from "@/components/providers/auth-provider"
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

const MeetingMap = dynamic(() => import("@/components/maps/meeting-map"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-amber-50 animate-pulse rounded-lg flex items-center justify-center text-amber-900/40">Loading Map...</div>
})

export default function ResourcesPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [soberHomes, setSoberHomes] = useState<SoberLivingHome[]>([])
  const [resourceType, setResourceType] = useState<"meetings" | "sober-living">("meetings")
  const [viewMode, setViewMode] = useState<"date" | "all">("date") // Changed 'today' to 'date'
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()) // New state
  const [displayMode, setDisplayMode] = useState<"list" | "map">("list")
  const [fellowshipFilter, setFellowshipFilter] = useState<FellowshipFilter>("All")
  const [genderFilter, setGenderFilter] = useState<"All" | "Men" | "Women">("All")
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("All")
  const [sortBy, setSortBy] = useState<SortOption>("time")
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const isDevMode = process.env.NODE_ENV === "development"

  // Geolocation hook for proximity features
  const {
    coordinates: userLocation,
    status: locationStatus,
    loading: locationLoading,
    requestLocation,
    clearLocation,
  } = useGeolocation()

  // Determine query day name from selectedDate
  const queryDayName = useMemo(() => {
    return selectedDate.toLocaleDateString("en-US", { weekday: "long" })
  }, [selectedDate])

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true)
      try {
        let data: Meeting[] = []
        if (viewMode === "date") {
          data = await MeetingsService.getMeetingsByDay(queryDayName)
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

    const fetchSoberHomes = async () => {
      setLoading(true)
      try {
        const data = await SoberLivingService.getAllHomes()
        setSoberHomes(data)
      } catch (error) {
        logger.error("Failed to load sober homes", { error })
      } finally {
        setLoading(false)
      }
    }

    if (authLoading) return

    if (resourceType === "meetings") {
      fetchMeetings()
    } else {
      fetchSoberHomes()
    }
  }, [queryDayName, viewMode, user, authLoading, resourceType])

  const finderRef = useRef<HTMLDivElement>(null)

  // Data reset handler (Public for prototype phase)
  const handleReset = async () => {
    if (!confirm("Delete all data and reset to 'Nashville Demo Set'? (Fixes neighborhood list)")) return
    try {
      setLoading(true)
      await MeetingsService.clearAllMeetings()
      await MeetingsService.seedInitialMeetings()
      await SoberLivingService.seedInitialHomes(INITIAL_SOBER_LIVING_HOMES)
      toast.success("Data reset to Nashville Demo.")
      triggerRefresh()
    } catch (err) {
      logger.error("Error resetting data", { error: err })
      toast.error("Failed to reset data.")
    }
  }

  const triggerRefresh = async () => {
    setLoading(true)
    const data = viewMode === "date"
      ? await MeetingsService.getMeetingsByDay(queryDayName)
      : await MeetingsService.getAllMeetings()
    setMeetings(data)
    setLoading(false)
  }

  const handleResourceClick = (title: string, id: string) => {
    if (id === "meetings") {
      setResourceType("meetings")
      finderRef.current?.scrollIntoView({ behavior: "smooth" })
    } else if (id === "sober-living") {
      setResourceType("sober-living")
      setDisplayMode("list")
      finderRef.current?.scrollIntoView({ behavior: "smooth" })
    } else {
      toast("Feature coming soon!", {
        description: `${title} is under construction.`
      })
    }
  }

  const resources = [
    {
      id: "meetings",
      icon: MapPin,
      title: "Meeting Finder",
      description: "Find AA, NA, and support meetings by time and neighborhood.",
    },
    {
      id: "sober-living",
      icon: Home,
      title: "Sober Living Finder",
      description: "Sober homes and halfway houses with basic info and contacts.",
    },
    {
      id: "map",
      icon: Map,
      title: "Local Resource Map",
      description: "Detox, rehabs, clinics, pharmacies, food, IDs, bus stations.",
    },
    {
      id: "events",
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

    // Apply time filter for "date" view only
    if (viewMode === "date") {
      // If selected date is TODAY, filter by current time.
      // If it's a future date, show all meetings for that day.
      const now = new Date()
      const isToday = selectedDate.getDate() === now.getDate() &&
        selectedDate.getMonth() === now.getMonth() &&
        selectedDate.getFullYear() === now.getFullYear()

      if (isToday) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        result = result.filter(m => {
          const meetingMinutes = parseTime(m.time)
          return meetingMinutes >= currentMinutes // Only future meetings today
        })
      }
      // If future/past date, we don't filter by time, just show the day's schedule (which is already fetched by queryDayName)
    }

    // Apply sorting
    if (sortBy === "nearest" && userLocation) {
      result = sortByDistance(result, userLocation, (m) => m.coordinates)
    }

    // Apply neighborhood filter (last, effectively)
    if (neighborhoodFilter !== "All") {
      result = result.filter(m => m.neighborhood === neighborhoodFilter)
    }

    return result
  }, [meetings, viewMode, fellowshipFilter, sortBy, userLocation, neighborhoodFilter])

  // Filtered Sober Living Homes
  const filteredSoberHomes = useMemo(() => {
    let result = soberHomes

    // Apply gender filter
    if (genderFilter !== "All") {
      result = result.filter(h => h.gender === genderFilter)
    }

    // Apply sorting
    if (sortBy === "nearest" && userLocation) {
      result = sortByDistance(result, userLocation, (h) => h.coordinates)
    }

    // Apply neighborhood filter
    if (neighborhoodFilter !== "All") {
      result = result.filter(h => h.neighborhood === neighborhoodFilter)
    }

    return result
  }, [soberHomes, genderFilter, sortBy, userLocation, neighborhoodFilter])

  const currentData = resourceType === "meetings" ? filteredMeetings : filteredSoberHomes

  // Get unique neighborhoods from the current data (or all data?) 
  const availableNeighborhoods = useMemo(() => {
    // Use all items from ACTIVE type to populate the list
    const sourceData = resourceType === "meetings" ? meetings : soberHomes
    // @ts-ignore - access safe property
    const unique = Array.from(new Set(sourceData.map(item => item.neighborhood))).filter(Boolean).sort()
    return unique
  }, [meetings, soberHomes, resourceType])

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

  // Handle Time Jump
  const handleTimeJump = (timeStr: string) => {
    if (!timeStr) return
    const targetMinutes = parseTime(timeStr)
    const targetMeeting = meetings.find(m => parseTime(m.time) >= targetMinutes)

    if (targetMeeting) {
      // We need a way to scroll to it. We will use a simple ID approach.
      // We will assume meeting cards have ID `meeting-{id}`
      const element = document.getElementById(`meeting-${targetMeeting.id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        toast.success(`Jumped to ${timeStr}`)
      } else {
        toast("Meeting not visible in current list.")
      }
    } else {
      toast("No meetings found after " + timeStr)
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
              onClick={() => handleResourceClick(resource.title, resource.id)}
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
          <h2 className="font-heading text-xl text-amber-900">
            {resourceType === "meetings" ? "Meeting Finder" : "Sober Living Finder"}
          </h2>


          {/* Filters */}
          {/* Unified Filter Toolbar */}
          {/* Unified Filter Toolbar */}
          <div className="flex flex-col gap-3 mb-4 p-3 bg-white rounded-xl border border-amber-200 shadow-sm">
            {/* Top Row: Primary Controls (Fellowship + Date + Time) */}
            <div className="flex flex-wrap items-center gap-2 justify-between">

              {resourceType === "meetings" ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Fellowship Pills */}
                  <div className="flex bg-amber-50/80 p-1 rounded-lg border border-amber-200/50">
                    {FELLOWSHIP_OPTIONS.map((option) => (
                      <button
                        key={option}
                        onClick={() => setFellowshipFilter(option)}
                        className={`text-xs px-2.5 py-1 rounded-md transition-all ${fellowshipFilter === option
                          ? "bg-amber-600 text-white shadow-sm font-medium"
                          : "text-amber-800 hover:bg-amber-100/50"
                          }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  <div className="h-4 w-px bg-amber-200/50 hidden sm:block"></div>

                  {/* Date Picker */}
                  <div className="flex items-center bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/50">
                    <Calendar className="w-3.5 h-3.5 text-amber-500 mr-2" />
                    <input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => {
                        if (e.target.valueAsDate) {
                          setSelectedDate(e.target.valueAsDate)
                          setViewMode('date')
                        }
                      }}
                      className="bg-transparent border-none text-xs text-amber-900 font-medium w-[110px] focus:outline-none cursor-pointer"
                    />
                  </div>

                  {/* Time Jump */}
                  <div className="flex items-center bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/50">
                    <Clock className="w-3.5 h-3.5 text-amber-500 mr-2" />
                    <select
                      onChange={(e) => handleTimeJump(e.target.value)}
                      className="bg-transparent border-none text-xs text-amber-900 font-medium focus:outline-none cursor-pointer w-[90px]"
                      defaultValue=""
                    >
                      <option value="" disabled>Jump to...</option>
                      <option value="6:00 AM">6:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="19:00">7:00 PM</option>
                      <option value="21:00">9:00 PM</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex bg-white/50 p-1 rounded-lg border border-amber-200/30">
                  {["All", "Men", "Women"].map((option) => (
                    <button
                      key={option}
                      // @ts-ignore
                      onClick={() => setGenderFilter(option)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-all ${genderFilter === option
                        ? "bg-amber-600 text-white shadow-sm font-medium"
                        : "text-amber-800 hover:bg-amber-100/50"
                        }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Row: Location & Display Mode */}
            {resourceType === "meetings" && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Neighborhood Picker */}
                <div className="relative flex-1 min-w-[140px]">
                  <select
                    value={neighborhoodFilter}
                    onChange={(e) => setNeighborhoodFilter(e.target.value)}
                    className="w-full text-xs h-8 pl-8 pr-4 appearance-none content-center rounded-full border border-amber-200 bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                  >
                    <option value="All">📍 All Neighborhoods</option>
                    {availableNeighborhoods.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600 pointer-events-none" />
                </div>

                {/* Nearest Button */}
                <button
                  onClick={handleNearestClick}
                  disabled={locationLoading}
                  className={`h-8 px-3 rounded-full border text-xs flex items-center gap-1.5 transition-all ${sortBy === "nearest" && userLocation
                    ? "bg-blue-600 text-white border-blue-600 font-medium shadow-sm"
                    : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"
                    } ${locationLoading ? "opacity-50" : ""}`}
                >
                  {locationLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Locate className="w-3 h-3" />}
                  Nearest
                </button>

                {/* Map Toggle */}
                <button
                  onClick={() => setDisplayMode(displayMode === "list" ? "map" : "list")}
                  className={`h-8 px-3 rounded-full border text-xs flex items-center gap-1.5 transition-all ${displayMode === "map"
                    ? "bg-amber-600 text-white border-amber-600 font-medium shadow-sm"
                    : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"
                    }`}
                >
                  {displayMode === "list" ? <Map className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                  {displayMode === "list" ? "Map" : "List"}
                </button>
              </div>
            )}

            {/* Active Filters Summary (if complex) */}
            {neighborhoodFilter !== "All" && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] text-amber-900/40">Filtered by:</span>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  📍 {neighborhoodFilter}
                  <button onClick={() => setNeighborhoodFilter("All")} className="hover:text-amber-950"><X className="w-3 h-3" /></button>
                </span>
              </div>
            )}
          </div>



          {/* Meeting content (List or Map) */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center gap-2 text-amber-900/40 italic p-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-sm">Loading schedule...</p>
              </div>
            ) : currentData.length === 0 ? (
              <div className="p-4 border border-dashed border-amber-300 rounded-lg bg-amber-50/50 text-center">
                <p className="text-sm text-amber-900/60 italic mb-3">
                  {resourceType === "meetings" ? (
                    <>
                      No {fellowshipFilter !== "All" ? fellowshipFilter : ""} meetings found
                      {viewMode === "date" ? " on this date" : ""}.
                    </>
                  ) : (
                    <>No sober living homes found.</>
                  )}
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
                  {viewMode === 'date' && (
                    <button
                      onClick={() => setViewMode('all')}
                      className="text-xs text-amber-700 font-medium hover:underline"
                    >
                      View full schedule
                    </button>
                  )}
                </div>
              </div>
            ) : displayMode === "map" ? (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-medium text-amber-900/50 uppercase tracking-wider">
                    Map View ({currentData.length})
                  </span>
                </div>
                <MeetingMap meetings={filteredMeetings} userLocation={userLocation} />
              </div>
            ) : (
              // List View
              <>
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-medium text-amber-900/50 uppercase tracking-wider">
                    {resourceType === "meetings" ? (
                      <>
                        {fellowshipFilter !== "All" ? `${fellowshipFilter} ` : ""}
                        {viewMode === 'date' ? `${selectedDate.toLocaleDateString()} (${filteredMeetings.length})` : `All (${filteredMeetings.length})`}
                      </>
                    ) : (
                      <>
                        {genderFilter !== "All" ? `${genderFilter} ` : ""}
                        Homes ({filteredSoberHomes.length})
                      </>
                    )}
                  </span>
                  {/* Both types support Reset currently? Or just meetings? MeetingsService supports clear. SoberLivingService supports it too. */}
                  <button onClick={handleReset} className="text-[10px] text-amber-500 hover:text-amber-700 underline flex items-center gap-1">
                    <Loader2 className="w-3 h-3" /> Reset Data
                  </button>
                </div>

                {resourceType === "meetings" && filteredMeetings.map((meeting) => {
                  const distance = getMeetingDistance(meeting)
                  return (
                    <button
                      key={meeting.id}
                      id={`meeting-${meeting.id}`}
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

                {resourceType === "sober-living" && filteredSoberHomes.map((home) => (
                  <div
                    key={home.id}
                    className="w-full text-left flex items-start gap-3 p-3 bg-white border border-amber-100/50 hover:border-amber-300 shadow-sm rounded-lg transition-all"
                  >
                    {home.heroImage ? (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 bg-cover bg-center shrink-0 border border-amber-100" style={{ backgroundImage: `url(${home.heroImage})` }} />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 
                          ${home.gender === 'Men' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                          home.gender === 'Women' ? 'border-pink-200 bg-pink-50 text-pink-700' :
                            'border-purple-200 bg-purple-50 text-purple-700'}`}>
                        {home.gender === 'Men' ? 'M' : home.gender === 'Women' ? 'W' : 'C'}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-heading text-sm text-amber-900 font-semibold truncate">{home.name}</h3>
                      </div>
                      <p className="text-xs text-amber-900/60 flex items-center gap-1 mb-1.5">
                        <MapPin className="w-3 h-3" /> {home.neighborhood || home.address}
                      </p>
                      <div className="flex gap-2">
                        {home.website && (
                          <a href={home.website} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-1 rounded-full hover:bg-amber-100">
                            Website
                          </a>
                        )}
                        {home.phone && (
                          <a href={`tel:${home.phone}`} className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full hover:bg-green-100 flex items-center gap-1">
                            Call
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <p className="font-body text-sm text-amber-900/50 mt-4 italic text-center">
            {resourceType === "meetings" ? "Tap a meeting for details." : "Tap a home for details."}
          </p>
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
