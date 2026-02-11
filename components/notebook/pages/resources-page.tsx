import dynamic from "next/dynamic";

import {
  MapPin,
  Home,
  Map,
  Calendar,
  Loader2,
  Locate,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { MeetingsService, type Meeting } from "@/lib/db/meetings";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { SoberLivingService, type SoberLivingHome } from "@/lib/db/sober-living";
import { INITIAL_SOBER_LIVING_HOMES } from "@/scripts/seed-sober-living-data";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import { calculateDistance, formatDistance, sortByDistance } from "@/lib/utils/distance";

// Fellowship filter options
const FELLOWSHIP_OPTIONS = ["All", "AA", "NA", "CA"] as const;
type FellowshipFilter = (typeof FELLOWSHIP_OPTIONS)[number];

// Sort options
type SortOption = "time" | "nearest";

// Gender filter type
type GenderFilter = "All" | "Men" | "Women";

// ============================================================================
// Helper Functions (extracted for cognitive complexity reduction)
// ============================================================================

/**
 * Parse time string (HH:MM or H:MM AM/PM) to minutes since midnight
 */
function parseTime(timeStr: string): number {
  if (/AM|PM/i.test(timeStr)) {
    return parse12HourTime(timeStr);
  }
  return parse24HourTime(timeStr);
}

function parse12HourTime(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return -1;
  let h = Number.parseInt(match[1]);
  const m = Number.parseInt(match[2]);
  const p = match[3].toUpperCase();
  if (p === "PM" && h !== 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function parse24HourTime(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

/**
 * Get CSS classes for meeting type badge
 */
function getMeetingTypeBadgeClasses(type: string): string {
  return type === "NA"
    ? "border-amber-500 text-amber-700 bg-amber-50"
    : "border-blue-400 text-blue-700 bg-blue-50";
}

/**
 * Get CSS classes for sober home gender badge
 */
function getHomeGenderBadgeClasses(gender: string): string {
  const styleMap: Record<string, string> = {
    Men: "border-blue-200 bg-blue-50 text-blue-700",
    Women: "border-pink-200 bg-pink-50 text-pink-700",
  };
  return styleMap[gender] || "border-purple-200 bg-purple-50 text-purple-700";
}

/**
 * Get single-letter abbreviation for home gender
 */
function getGenderAbbreviation(gender: string): string {
  const abbrevMap: Record<string, string> = { Men: "M", Women: "W" };
  return abbrevMap[gender] || "C";
}

const MeetingMap = dynamic(() => import("@/components/maps/meeting-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-amber-50 animate-pulse rounded-lg flex items-center justify-center text-amber-900/40">
      Loading Map...
    </div>
  ),
});

// Meeting list item component
interface MeetingCardProps {
  meeting: Meeting;
  distance: string | null;
  viewMode: "date" | "all";
  onClick: () => void;
}

function MeetingCard({ meeting, distance, viewMode, onClick }: Readonly<MeetingCardProps>) {
  return (
    <button
      key={meeting.id}
      id={`meeting-${meeting.id}`}
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-3 bg-white border border-amber-100/50 hover:border-amber-300 shadow-sm rounded-lg transition-all hover:translate-x-1"
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 ${getMeetingTypeBadgeClasses(meeting.type)}`}
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

// Sober living home card component
interface SoberHomeCardProps {
  home: SoberLivingHome;
}

function SoberHomeCard({ home }: Readonly<SoberHomeCardProps>) {
  return (
    <div
      key={home.id}
      className="w-full text-left flex items-start gap-3 p-3 bg-white border border-amber-100/50 hover:border-amber-300 shadow-sm rounded-lg transition-all"
    >
      {home.heroImage ? (
        <div
          className="w-12 h-12 rounded-lg bg-gray-100 bg-cover bg-center shrink-0 border border-amber-100"
          style={{ backgroundImage: `url(${home.heroImage})` }}
        />
      ) : (
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${getHomeGenderBadgeClasses(home.gender)}`}
        >
          {getGenderAbbreviation(home.gender)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-heading text-sm text-amber-900 font-semibold truncate">
            {home.name}
          </h3>
        </div>
        <p className="text-xs text-amber-900/60 flex items-center gap-1 mb-1.5">
          <MapPin className="w-3 h-3" /> {home.neighborhood || home.address}
        </p>
        <div className="flex gap-2">
          {home.website && (
            <a
              href={home.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-1 rounded-full hover:bg-amber-100"
            >
              Website
            </a>
          )}
          {home.phone && (
            <a
              href={`tel:${home.phone}`}
              className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full hover:bg-green-100 flex items-center gap-1"
            >
              Call
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Empty state component for resource list
interface EmptyResourceStateProps {
  resourceType: "meetings" | "sober-living";
  fellowshipFilter: FellowshipFilter;
  viewMode: "date" | "all";
  onShowAllFellowships: () => void;
  onViewAllMeetings: () => void;
}

function EmptyResourceState({
  resourceType,
  fellowshipFilter,
  viewMode,
  onShowAllFellowships,
  onViewAllMeetings,
}: Readonly<EmptyResourceStateProps>) {
  return (
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
            onClick={onShowAllFellowships}
            className="text-xs text-amber-700 font-medium hover:underline"
          >
            Show all fellowships
          </button>
        )}
        {viewMode === "date" && (
          <button
            onClick={onViewAllMeetings}
            className="text-xs text-amber-700 font-medium hover:underline"
          >
            View full schedule
          </button>
        )}
      </div>
    </div>
  );
}

// Fellowship filter pills component
interface FellowshipFilterProps {
  value: FellowshipFilter;
  onChange: (value: FellowshipFilter) => void;
}

function FellowshipFilterPills({ value, onChange }: Readonly<FellowshipFilterProps>) {
  return (
    <div className="flex bg-amber-50/80 p-1 rounded-lg border border-amber-200/50 flex-1">
      {FELLOWSHIP_OPTIONS.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`flex-1 text-xs px-3 py-2 rounded-md transition-all ${
            value === option
              ? "bg-amber-600 text-white shadow-sm font-medium"
              : "text-amber-800 hover:bg-amber-100/50"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

// Gender filter pills component
interface GenderFilterProps {
  value: GenderFilter;
  onChange: (value: GenderFilter) => void;
}

function GenderFilterPills({ value, onChange }: Readonly<GenderFilterProps>) {
  const options: GenderFilter[] = ["All", "Men", "Women"];
  return (
    <div className="flex bg-white/50 p-1 rounded-lg border border-amber-200/30">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`flex-1 text-xs px-3 py-2 rounded-md transition-all ${
            value === option
              ? "bg-amber-600 text-white shadow-sm font-medium"
              : "text-amber-800 hover:bg-amber-100/50"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

// Nearby button component
interface NearbyButtonProps {
  sortBy: SortOption;
  locationLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  onClick: () => void;
}

function NearbyButton({
  sortBy,
  locationLoading,
  userLocation,
  onClick,
}: Readonly<NearbyButtonProps>) {
  const isActive = sortBy === "nearest" && userLocation;
  return (
    <button
      onClick={onClick}
      disabled={locationLoading}
      className={`px-4 py-2 rounded-lg border text-sm flex items-center justify-center gap-2 transition-all ${
        isActive
          ? "bg-blue-600 text-white border-blue-600 font-medium shadow-sm"
          : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"
      } ${locationLoading ? "opacity-50" : ""}`}
    >
      {locationLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Locate className="w-4 h-4" />
      )}
      Nearby
    </button>
  );
}

// Resource cards grid component
interface ResourceCardProps {
  resources: Array<{
    id: string;
    icon: typeof MapPin;
    title: string;
    description: string;
  }>;
  onClick: (title: string, id: string) => void;
}

function ResourceCardsGrid({ resources, onClick }: Readonly<ResourceCardProps>) {
  return (
    <div className="space-y-3">
      {resources.map((resource, index) => (
        <button
          key={resource.id}
          onClick={() => onClick(resource.title, resource.id)}
          className="w-full text-left p-4 border border-amber-200/50 rounded-lg hover:bg-amber-50 transition-colors group shadow-sm"
        >
          <div className="flex items-start gap-3">
            <resource.icon className="w-6 h-6 text-amber-700/70 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-heading text-lg text-amber-900 group-hover:underline">
                {resource.title}
              </h3>
              <p className="font-body text-sm text-amber-900/60">{resource.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// List header with count component
interface ListHeaderProps {
  resourceType: "meetings" | "sober-living";
  fellowshipFilter: FellowshipFilter;
  genderFilter: GenderFilter;
  viewMode: "date" | "all";
  selectedDate: Date;
  meetingsCount: number;
  homesCount: number;
  isDevMode: boolean;
  onReset: () => void;
}

function ListHeader({
  resourceType,
  fellowshipFilter,
  genderFilter,
  viewMode,
  selectedDate,
  meetingsCount,
  homesCount,
  isDevMode,
  onReset,
}: Readonly<ListHeaderProps>) {
  return (
    <div className="flex justify-between items-center mb-2 px-1">
      <span className="text-xs font-medium text-amber-900/50 uppercase tracking-wider">
        {resourceType === "meetings" ? (
          <>
            {fellowshipFilter !== "All" ? `${fellowshipFilter} ` : ""}
            {viewMode === "date"
              ? `${selectedDate.toLocaleDateString()} (${meetingsCount})`
              : `All (${meetingsCount})`}
          </>
        ) : (
          <>
            {genderFilter !== "All" ? `${genderFilter} ` : ""}
            Homes ({homesCount})
          </>
        )}
      </span>
      {isDevMode && (
        <button
          onClick={onReset}
          className="text-[10px] text-amber-500 hover:text-amber-700 underline flex items-center gap-1"
        >
          <Loader2 className="w-3 h-3" /> Reset Data (Dev)
        </button>
      )}
    </div>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="flex items-center gap-2 text-amber-900/40 italic p-4">
      <Loader2 className="w-4 h-4 animate-spin" />
      <p className="text-sm">Loading schedule...</p>
    </div>
  );
}

// Map view header component
interface MapViewHeaderProps {
  count: number;
}

function MapViewHeader({ count }: Readonly<MapViewHeaderProps>) {
  return (
    <div className="flex justify-between items-center mb-2 px-1">
      <span className="text-xs font-medium text-amber-900/50 uppercase tracking-wider">
        Map View ({count})
      </span>
    </div>
  );
}

// Meeting details dialog component
interface MeetingDialogProps {
  meeting: Meeting | null;
  onOpenChange: (open: boolean) => void;
  getMeetingDistance: (meeting: Meeting) => string | null;
}

function MeetingDetailsDialogComponent({
  meeting,
  onOpenChange,
  getMeetingDistance,
}: Readonly<MeetingDialogProps>) {
  const handleGetDirections = () => {
    if (!meeting) return;
    const mapsUrl = meeting.coordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${meeting.coordinates.lat},${meeting.coordinates.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meeting.address)}`;
    window.open(mapsUrl, "_blank");
  };

  const handleShare = () => {
    toast.success("Link copied to clipboard!");
  };

  return (
    <Dialog open={!!meeting} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#fdfbf7] border-amber-200">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-amber-900 flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 ${getMeetingTypeBadgeClasses(meeting?.type || "")}`}
            >
              {meeting?.type}
            </div>
            {meeting?.name}
          </DialogTitle>
          <DialogDescription className="text-amber-900/70 text-base">
            {meeting?.day}, {meeting?.time}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-900 text-sm">Location</h4>
              <p className="text-sm text-amber-800/80">{meeting?.address}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">
                  {meeting?.neighborhood}
                </span>
                {meeting && getMeetingDistance(meeting) && (
                  <>
                    <span className="text-amber-300">•</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {getMeetingDistance(meeting)} away
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
              onClick={handleGetDirections}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
            <Button
              variant="outline"
              className="w-full border-amber-200 hover:bg-amber-100 text-amber-800"
              onClick={handleShare}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ResourcesPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [soberHomes, setSoberHomes] = useState<SoberLivingHome[]>([]);
  const [resourceType, setResourceType] = useState<"meetings" | "sober-living">("meetings");
  const [viewMode, setViewMode] = useState<"date" | "all">("date"); // Changed 'today' to 'date'
  const [selectedDate] = useState<Date>(new Date()); // New state
  const [displayMode, setDisplayMode] = useState<"list" | "map">("list");
  const [fellowshipFilter, setFellowshipFilter] = useState<FellowshipFilter>("All");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("All");
  const [neighborhoodFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("time");
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const isDevMode = process.env.NODE_ENV === "development";

  // Pagination state for "View All" mode
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Geolocation hook for proximity features
  const {
    coordinates: userLocation,
    status: locationStatus,
    loading: locationLoading,
    requestLocation,
  } = useGeolocation();

  // Determine query day name from selectedDate
  const queryDayName = useMemo(() => {
    return selectedDate.toLocaleDateString("en-US", { weekday: "long" });
  }, [selectedDate]);

  // Load more meetings for infinite scroll (View All mode)
  const _loadMoreMeetings = useCallback(async () => {
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
          // Date-specific view: Efficient, fetch only that day
          data = await MeetingsService.getMeetingsByDay(queryDayName);
          setMeetings(data);
          setHasMore(false);
          setLastDoc(null);
        } else {
          // View All mode: Use pagination
          const result = await MeetingsService.getAllMeetingsPaginated(50);
          setMeetings(result.meetings);
          setLastDoc(result.lastDoc);
          setHasMore(result.hasMore);
        }
      } catch (error) {
        logger.error("Failed to load meetings", { error });
        toast.error("Failed to load meetings.");
      } finally {
        setLoading(false);
      }
    };

    const fetchSoberHomes = async () => {
      setLoading(true);
      try {
        const data = await SoberLivingService.getAllHomes();
        setSoberHomes(data);
      } catch (error) {
        logger.error("Failed to load sober homes", { error });
      } finally {
        setLoading(false);
      }
    };

    if (authLoading) return;

    if (resourceType === "meetings") {
      fetchMeetings();
    } else {
      fetchSoberHomes();
    }
  }, [queryDayName, viewMode, user, authLoading, resourceType]);

  const finderRef = useRef<HTMLDivElement>(null);

  // Data reset handler (Public for prototype phase)
  const handleReset = async () => {
    if (!confirm("Delete all data and reset to 'Nashville Demo Set'? (Fixes neighborhood list)"))
      return;
    try {
      setLoading(true);
      await MeetingsService.clearAllMeetings();
      await MeetingsService.seedInitialMeetings();
      await SoberLivingService.seedInitialHomes(INITIAL_SOBER_LIVING_HOMES);
      toast.success("Data reset to Nashville Demo.");
      triggerRefresh();
    } catch (err) {
      logger.error("Error resetting data", { error: err });
      toast.error("Failed to reset data.");
    }
  };

  const triggerRefresh = async () => {
    setLoading(true);
    const data =
      viewMode === "date"
        ? await MeetingsService.getMeetingsByDay(queryDayName)
        : await MeetingsService.getAllMeetings();
    setMeetings(data);
    setLoading(false);
  };

  const handleResourceClick = (title: string, id: string) => {
    if (id === "meetings") {
      setResourceType("meetings");
      finderRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (id === "sober-living") {
      setResourceType("sober-living");
      setDisplayMode("list");
      finderRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      toast("Feature coming soon!", {
        description: `${title} is under construction.`,
      });
    }
  };

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
  ];

  // Combined filtering: time (for today view) + fellowship + sorting
  const filteredMeetings = useMemo(() => {
    let result = meetings;

    // Apply fellowship filter
    if (fellowshipFilter !== "All") {
      result = result.filter((m) => m.type === fellowshipFilter);
    }

    // Apply time filter for "date" view only (filter for today, show all for future dates)
    if (viewMode === "date") {
      const now = new Date();
      const isToday = isSameDay(selectedDate, now);
      if (isToday) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        result = result.filter((m) => parseTime(m.time) >= currentMinutes);
      }
    }

    // Apply sorting
    if (sortBy === "nearest" && userLocation) {
      result = sortByDistance(result, userLocation, (m) => m.coordinates);
    }

    // Apply neighborhood filter
    if (neighborhoodFilter !== "All") {
      result = result.filter((m) => m.neighborhood === neighborhoodFilter);
    }

    return result;
  }, [
    meetings,
    viewMode,
    fellowshipFilter,
    sortBy,
    userLocation,
    neighborhoodFilter,
    selectedDate,
  ]);

  // Filtered Sober Living Homes
  const filteredSoberHomes = useMemo(() => {
    let result = soberHomes;

    // Apply gender filter
    if (genderFilter !== "All") {
      result = result.filter((h) => h.gender === genderFilter);
    }

    // Apply sorting
    if (sortBy === "nearest" && userLocation) {
      result = sortByDistance(result, userLocation, (h) => h.coordinates);
    }

    // Apply neighborhood filter
    if (neighborhoodFilter !== "All") {
      result = result.filter((h) => h.neighborhood === neighborhoodFilter);
    }

    return result;
  }, [soberHomes, genderFilter, sortBy, userLocation, neighborhoodFilter]);

  const currentData = resourceType === "meetings" ? filteredMeetings : filteredSoberHomes;

  // Get unique neighborhoods from the current data (or all data?)
  const _availableNeighborhoods = useMemo(() => {
    // Use all items from ACTIVE type to populate the list
    const sourceData = resourceType === "meetings" ? meetings : soberHomes;
    const unique = Array.from(new Set(sourceData.map((item) => item.neighborhood)))
      .filter((n): n is string => Boolean(n))
      .sort((a, b) => a.localeCompare(b));
    return unique;
  }, [meetings, soberHomes, resourceType]);

  // Helper to get distance for a meeting
  const getMeetingDistance = (meeting: Meeting): string | null => {
    if (!userLocation || !meeting.coordinates) return null;
    const distance = calculateDistance(userLocation, meeting.coordinates);
    return formatDistance(distance);
  };

  // Handle "Nearest to me" button click
  const handleNearestClick = () => {
    if (locationStatus === "granted" && userLocation) {
      // Already have location, just toggle sort
      setSortBy(sortBy === "nearest" ? "time" : "nearest");
    } else if (locationStatus === "denied") {
      toast.error("Location access denied. Please enable location in your browser settings.");
    } else {
      // Request location and enable sort
      requestLocation();
      setSortBy("nearest");
    }
  };

  // Handle Time Jump
  const _handleTimeJump = (timeStr: string) => {
    if (!timeStr) return;
    const targetMinutes = parseTime(timeStr);
    // Search filtered meetings to only target visible items
    const targetMeeting = filteredMeetings.find((m) => parseTime(m.time) >= targetMinutes);

    if (targetMeeting) {
      // We need a way to scroll to it. We will use a simple ID approach.
      // We will assume meeting cards have ID `meeting-{id}`
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
  };

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-heading text-2xl text-amber-900 underline">
          Resources – Getting around Nashville
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Resource cards */}
        <ResourceCardsGrid resources={resources} onClick={handleResourceClick} />

        {/* Right column - Meeting finder today */}
        <div ref={finderRef}>
          <h2 className="font-heading text-xl text-amber-900">
            {resourceType === "meetings" ? "Meeting Finder" : "Sober Living Finder"}
          </h2>

          {/* Simplified Filters */}
          <div className="space-y-3 mb-4">
            {/* View All Meetings Link */}
            <a
              href="/meetings/all"
              className="block text-center text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              View All Meetings with Map & Advanced Filters →
            </a>

            <div className="flex flex-col sm:flex-row gap-3 p-3 bg-white rounded-xl border border-amber-200 shadow-sm">
              {resourceType === "meetings" ? (
                <>
                  <FellowshipFilterPills value={fellowshipFilter} onChange={setFellowshipFilter} />
                  <NearbyButton
                    sortBy={sortBy}
                    locationLoading={locationLoading}
                    userLocation={userLocation}
                    onClick={handleNearestClick}
                  />
                </>
              ) : (
                <GenderFilterPills value={genderFilter} onChange={setGenderFilter} />
              )}
            </div>
          </div>

          {/* Meeting content (List or Map) */}
          <div className="space-y-2">
            {loading ? (
              <LoadingState />
            ) : currentData.length === 0 ? (
              <EmptyResourceState
                resourceType={resourceType}
                fellowshipFilter={fellowshipFilter}
                viewMode={viewMode}
                onShowAllFellowships={() => setFellowshipFilter("All")}
                onViewAllMeetings={() => setViewMode("all")}
              />
            ) : displayMode === "map" ? (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <MapViewHeader count={currentData.length} />
                <MeetingMap meetings={filteredMeetings} userLocation={userLocation} />
              </div>
            ) : (
              // List View
              <>
                <ListHeader
                  resourceType={resourceType}
                  fellowshipFilter={fellowshipFilter}
                  genderFilter={genderFilter}
                  viewMode={viewMode}
                  selectedDate={selectedDate}
                  meetingsCount={filteredMeetings.length}
                  homesCount={filteredSoberHomes.length}
                  isDevMode={isDevMode}
                  onReset={handleReset}
                />

                {resourceType === "meetings" &&
                  filteredMeetings
                    .slice(0, 10)
                    .map((meeting) => (
                      <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        distance={getMeetingDistance(meeting)}
                        viewMode={viewMode}
                        onClick={() => setSelectedMeeting(meeting)}
                      />
                    ))}

                {/* Show "View More" link if there are more than 10 meetings */}
                {resourceType === "meetings" && filteredMeetings.length > 10 && (
                  <a
                    href="/meetings/all"
                    className="block w-full py-3 px-4 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-medium text-sm transition-colors border border-amber-200 text-center"
                  >
                    View All {filteredMeetings.length} Meetings with Map →
                  </a>
                )}

                {resourceType === "sober-living" &&
                  filteredSoberHomes.map((home) => <SoberHomeCard key={home.id} home={home} />)}
              </>
            )}
          </div>

          <p className="font-body text-sm text-amber-900/50 mt-4 italic text-center">
            {resourceType === "meetings" ? "Tap a meeting for details." : "Tap a home for details."}
          </p>
        </div>
      </div>

      <MeetingDetailsDialogComponent
        meeting={selectedMeeting}
        onOpenChange={(open) => !open && setSelectedMeeting(null)}
        getMeetingDistance={getMeetingDistance}
      />
    </div>
  );
}
