"use client";

import {
  MapPin,
  Calendar,
  Loader2,
  Locate,
  Map as MapIcon,
  List,
  Clock,
  X,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { MeetingsService, type Meeting } from "@/lib/db/meetings";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useAuth } from "@/components/providers/auth-provider";
import { useGeolocation } from "@/hooks/use-geolocation";
import { calculateDistance, formatDistance, sortByDistance } from "@/lib/utils/distance";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { MeetingDetailsDialog } from "@/components/meetings/meeting-details-dialog";

const FELLOWSHIP_OPTIONS = ["All", "AA", "NA", "CA"] as const;
type FellowshipFilter = (typeof FELLOWSHIP_OPTIONS)[number];
type SortOption = "time" | "nearest";

const MeetingMap = dynamic(() => import("@/components/maps/meeting-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-amber-50 animate-pulse rounded-lg flex items-center justify-center text-amber-900/40">
      Loading Map...
    </div>
  ),
});

/**
 * Handle time jump to scroll to a meeting
 */
function scrollToMeetingByTime(
  timeStr: string,
  filteredMeetings: Meeting[],
  parseTimeFn: (t: string) => number
): void {
  if (!timeStr) return;

  const targetMinutes = parseTimeFn(timeStr);
  const targetMeeting = filteredMeetings.find((m) => parseTimeFn(m.time) >= targetMinutes);

  if (targetMeeting) {
    const element = document.getElementById(`meeting-${targetMeeting.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.success(`Jumped to ${timeStr}`);
    } else {
      toast("Meeting not visible in current list.");
    }
  } else {
    toast("No meetings found after " + timeStr);
  }
}

/**
 * Loading state display
 */
function LoadingState() {
  return (
    <div className="flex items-center gap-2 text-amber-900/40 italic justify-center py-12">
      <Loader2 className="w-5 h-5 animate-spin" />
      <p>Loading meetings...</p>
    </div>
  );
}

/**
 * Empty state when no meetings match filters
 */
function EmptyState({
  fellowshipFilter,
  onClearFilters,
}: {
  fellowshipFilter: FellowshipFilter;
  onClearFilters: () => void;
}) {
  return (
    <div className="p-8 border border-dashed border-amber-300 rounded-lg bg-amber-50/50 text-center">
      <p className="text-amber-900/60 mb-3">
        No {fellowshipFilter !== "All" ? fellowshipFilter : ""} meetings found.
      </p>
      <button
        onClick={onClearFilters}
        className="text-sm text-amber-700 font-medium hover:underline"
      >
        Clear all filters
      </button>
    </div>
  );
}

/**
 * Load more meetings section
 */
function LoadMoreSection({
  viewMode,
  loading,
  isLoadingMore,
  hasMore,
  meetingsCount,
  onLoadMore,
}: {
  viewMode: "date" | "all";
  loading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  meetingsCount: number;
  onLoadMore: () => void;
}) {
  if (viewMode !== "all" || loading) return null;

  if (isLoadingMore) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-amber-900/60">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading more meetings...</span>
      </div>
    );
  }

  if (hasMore) {
    return (
      <button
        onClick={onLoadMore}
        className="w-full py-3 px-4 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-medium text-sm transition-colors border border-amber-200"
      >
        Load More Meetings ({meetingsCount} loaded)
      </button>
    );
  }

  if (meetingsCount > 0) {
    return (
      <div className="text-center py-4 text-xs text-amber-900/40 italic">
        All meetings loaded ({meetingsCount} total)
      </div>
    );
  }

  return null;
}

/**
 * Meeting card component for list display
 */
function MeetingCard({
  meeting,
  distance,
  viewMode,
  onClick,
}: {
  meeting: Meeting;
  distance: string | null;
  viewMode: "date" | "all";
  onClick: () => void;
}) {
  const typeStyles =
    meeting.type === "NA"
      ? "border-amber-500 text-amber-700 bg-amber-50"
      : "border-blue-400 text-blue-700 bg-blue-50";

  return (
    <button
      id={`meeting-${meeting.id}`}
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-3 bg-white border border-amber-100/50 hover:border-amber-300 shadow-sm rounded-lg transition-all hover:translate-x-1"
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 ${typeStyles}`}
      >
        {meeting.type}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-heading text-sm text-amber-900 truncate font-semibold">
            {meeting.name}
          </span>
          <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            {meeting.time}
          </span>
        </div>
        <p className="text-xs text-amber-900/50 truncate flex items-center gap-1">
          {viewMode === "all" && (
            <span className="font-medium text-amber-700">{meeting.day.substring(0, 3)} • </span>
          )}
          <MapPin className="w-3 h-3" /> {meeting.neighborhood}
        </p>
      </div>
      {distance && (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap font-medium shrink-0">
          {distance}
        </span>
      )}
    </button>
  );
}

/**
 * Parse 12-hour time format (e.g., "6:00 PM") to minutes since midnight
 */
function parse12HourTime(timeStr: string): number | null {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;

  const [, hours, minutes, meridiem] = match;
  let h = parseInt(hours);
  const m = parseInt(minutes);

  if (meridiem.toUpperCase() === "PM" && h !== 12) h += 12;
  if (meridiem.toUpperCase() === "AM" && h === 12) h = 0;

  return h * 60 + m;
}

/**
 * Parse 24-hour time format (e.g., "18:00") to minutes since midnight
 */
function parse24HourTime(timeStr: string): number | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const [, hours, minutes] = match;
  return parseInt(hours) * 60 + parseInt(minutes);
}

/**
 * Parse time string like "6:00 PM" or "18:00" to minutes since midnight
 */
function parseTime(timeStr: string): number {
  return parse12HourTime(timeStr) ?? parse24HourTime(timeStr) ?? 0;
}

export default function AllMeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [viewMode, setViewMode] = useState<"date" | "all">("date");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayMode, setDisplayMode] = useState<"list" | "map">("list");
  const [fellowshipFilter, setFellowshipFilter] = useState<FellowshipFilter>("All");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("time");
  const [loading, setLoading] = useState(true);
  const { user: _user } = useAuth();

  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
    coordinates: userLocation,
    status: locationStatus,
    loading: locationLoading,
    requestLocation,
  } = useGeolocation();

  const queryDayName = useMemo(() => {
    return selectedDate.toLocaleDateString("en-US", { weekday: "long" });
  }, [selectedDate]);

  // Load more meetings
  const loadMoreMeetings = useCallback(async () => {
    if (!hasMore || isLoadingMore || viewMode !== "all") return;

    setIsLoadingMore(true);
    try {
      const result = await MeetingsService.getAllMeetingsPaginated(50, lastDoc || undefined);
      setMeetings((prev) => [...prev, ...result.meetings]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      logger.error("Failed to load more meetings", { error });
      toast.error("Failed to load more meetings");
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, lastDoc, viewMode]);

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      try {
        let data: Meeting[] = [];
        if (viewMode === "date") {
          // Date-specific view: fetch only that day
          data = await MeetingsService.getMeetingsByDay(queryDayName);
          setMeetings(data);
          setHasMore(false);
          setLastDoc(null);
        } else {
          // "All" view: Load initial batch with pagination
          // User can click "Load More" for additional meetings
          const result = await MeetingsService.getAllMeetingsPaginated(100);
          setMeetings(result.meetings);
          setLastDoc(result.lastDoc);
          setHasMore(result.hasMore);
        }
      } catch (error) {
        logger.error("Failed to fetch meetings", { error });
        toast.error("Failed to load meetings");
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [viewMode, queryDayName]);

  // Filter and sort meetings
  const filteredMeetings = useMemo(() => {
    let filtered = meetings;

    // Fellowship filter
    if (fellowshipFilter !== "All") {
      filtered = filtered.filter((m) => m.type === fellowshipFilter);
    }

    // Neighborhood filter
    if (neighborhoodFilter !== "All") {
      filtered = filtered.filter((m) => m.neighborhood === neighborhoodFilter);
    }

    // Sort
    if (sortBy === "nearest" && userLocation) {
      filtered = sortByDistance(filtered, userLocation, (m) => m.coordinates);
    } else {
      // Sort by time
      filtered = [...filtered].sort((a, b) => parseTime(a.time) - parseTime(b.time));
    }

    return filtered;
  }, [meetings, fellowshipFilter, neighborhoodFilter, sortBy, userLocation]);

  const availableNeighborhoods = useMemo(() => {
    const neighborhoods = new Set(
      meetings.map((m) => m.neighborhood).filter((n): n is string => Boolean(n))
    );
    return Array.from(neighborhoods).sort((a, b) => a.localeCompare(b));
  }, [meetings]);

  const getMeetingDistance = (meeting: Meeting) => {
    if (!userLocation || !meeting.coordinates) return null;
    const distance = calculateDistance(userLocation, meeting.coordinates);
    return formatDistance(distance);
  };

  const handleNearestClick = () => {
    if (locationStatus === "granted" && userLocation) {
      setSortBy(sortBy === "nearest" ? "time" : "nearest");
    } else if (locationStatus === "denied") {
      toast.error("Location access denied. Please enable location in your browser settings.");
    } else {
      requestLocation();
      setSortBy("nearest");
    }
  };

  const handleTimeJump = (timeStr: string) => {
    scrollToMeetingByTime(timeStr, filteredMeetings, parseTime);
  };

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-amber-900 hover:text-amber-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading text-lg">Back</span>
            </button>
            <h1 className="font-heading text-2xl text-amber-900">All Meetings</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3">
            {/* Fellowship & Sort */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex bg-amber-50/80 p-1 rounded-lg border border-amber-200/50">
                {FELLOWSHIP_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setFellowshipFilter(option)}
                    className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                      fellowshipFilter === option
                        ? "bg-amber-600 text-white shadow-sm font-medium"
                        : "text-amber-800 hover:bg-amber-100/50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleNearestClick}
                  disabled={locationLoading}
                  className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                    sortBy === "nearest" && userLocation
                      ? "bg-blue-600 text-white border-blue-600 font-medium shadow-sm"
                      : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"
                  } ${locationLoading ? "opacity-50" : ""}`}
                >
                  {locationLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Locate className="w-3.5 h-3.5" />
                  )}
                  Nearby
                </button>

                <button
                  onClick={() => setDisplayMode(displayMode === "list" ? "map" : "list")}
                  className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                    displayMode === "map"
                      ? "bg-amber-600 text-white border-amber-600 font-medium shadow-sm"
                      : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"
                  }`}
                >
                  {displayMode === "list" ? (
                    <MapIcon className="w-3.5 h-3.5" />
                  ) : (
                    <List className="w-3.5 h-3.5" />
                  )}
                  {displayMode === "list" ? "Map" : "List"}
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/50">
                <Calendar className="w-3.5 h-3.5 text-amber-500 mr-2" />
                <input
                  type="date"
                  value={selectedDate.toISOString().split("T")[0]}
                  onChange={(e) => {
                    if (e.target.valueAsDate) {
                      setSelectedDate(e.target.valueAsDate);
                      setViewMode("date");
                    }
                  }}
                  className="bg-transparent border-none text-xs text-amber-900 font-medium w-[110px] focus:outline-none cursor-pointer"
                />
              </div>

              <div className="relative min-w-[140px]">
                <select
                  value={neighborhoodFilter}
                  onChange={(e) => setNeighborhoodFilter(e.target.value)}
                  className="w-full text-xs h-8 pl-8 pr-4 appearance-none rounded-full border border-amber-200 bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                >
                  <option value="All">📍 All Neighborhoods</option>
                  {availableNeighborhoods.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600 pointer-events-none" />
              </div>

              <div className="flex items-center bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/50">
                <Clock className="w-3.5 h-3.5 text-amber-500 mr-2" />
                <select
                  onChange={(e) => handleTimeJump(e.target.value)}
                  className="bg-transparent border-none text-xs text-amber-900 font-medium focus:outline-none cursor-pointer w-[90px]"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Jump to...
                  </option>
                  <option value="6:00 AM">6:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                  <option value="19:00">7:00 PM</option>
                  <option value="21:00">9:00 PM</option>
                </select>
              </div>

              <button
                onClick={() => setViewMode(viewMode === "date" ? "all" : "date")}
                className="text-xs text-amber-700 hover:text-amber-900 underline"
              >
                {viewMode === "date" ? "View All Days" : "Today Only"}
              </button>
            </div>

            {neighborhoodFilter !== "All" && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-900/40">Filtered by:</span>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  📍 {neighborhoodFilter}
                  <button
                    onClick={() => setNeighborhoodFilter("All")}
                    className="hover:text-amber-950"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <LoadingState />
        ) : filteredMeetings.length === 0 ? (
          <EmptyState
            fellowshipFilter={fellowshipFilter}
            onClearFilters={() => {
              setFellowshipFilter("All");
              setNeighborhoodFilter("All");
            }}
          />
        ) : displayMode === "map" ? (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-3 text-center">
              <span className="text-sm font-medium text-amber-900/70">
                Showing {filteredMeetings.length} meetings
              </span>
            </div>
            <MeetingMap meetings={filteredMeetings} userLocation={userLocation} />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-center mb-4">
              <span className="text-sm font-medium text-amber-900/70">
                Showing {filteredMeetings.length} meetings
              </span>
            </div>

            {filteredMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                distance={getMeetingDistance(meeting)}
                viewMode={viewMode}
                onClick={() => setSelectedMeeting(meeting)}
              />
            ))}

            {/* Load More */}
            <LoadMoreSection
              viewMode={viewMode}
              loading={loading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              meetingsCount={meetings.length}
              onLoadMore={loadMoreMeetings}
            />
          </div>
        )}
      </div>

      <MeetingDetailsDialog
        meeting={selectedMeeting}
        open={!!selectedMeeting}
        onOpenChange={(open) => !open && setSelectedMeeting(null)}
        userLocation={userLocation}
      />
    </div>
  );
}
