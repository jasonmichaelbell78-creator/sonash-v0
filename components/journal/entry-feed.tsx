"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EntryCard } from "./entry-card";
import { JournalEntry } from "@/types/journal";
import { JournalFilterType } from "./journal-sidebar";
import { format } from "date-fns";

interface EntryFeedProps {
  entries: JournalEntry[];
  filter: JournalFilterType;
}

// Search matcher types for each entry type
type SearchMatcher = (entry: JournalEntry, query: string) => boolean;

/**
 * Search matcher for mood entries
 */
function matchMoodEntry(entry: JournalEntry, query: string): boolean {
  const moodMatch = entry.data?.mood?.toLowerCase().includes(query) || false;
  const noteMatch = entry.data?.note?.toLowerCase().includes(query) || false;
  return moodMatch || noteMatch;
}

/**
 * Search matcher for gratitude entries
 */
function matchGratitudeEntry(entry: JournalEntry, query: string): boolean {
  return entry.data?.items?.some((item) => item.toLowerCase().includes(query)) || false;
}

// Inventory fields to search
const INVENTORY_FIELDS = ["resentments", "dishonesty", "apologies", "successes"] as const;

/**
 * Search matcher for inventory entries
 */
function matchInventoryEntry(entry: JournalEntry, query: string): boolean {
  return INVENTORY_FIELDS.some(
    (field) => entry.data?.[field]?.toLowerCase().includes(query) || false
  );
}

/**
 * Search matcher for free-write and meeting-note entries
 */
function matchNoteEntry(entry: JournalEntry, query: string): boolean {
  const titleMatch = entry.data?.title?.toLowerCase().includes(query) || false;
  const contentMatch = entry.data?.content?.toLowerCase().includes(query) || false;
  return titleMatch || contentMatch;
}

/**
 * Search matcher for spot-check entries
 */
function matchSpotCheckEntry(entry: JournalEntry, query: string): boolean {
  const feelingsMatch = entry.data.feelings?.some((f) => f.toLowerCase().includes(query)) || false;
  const actionMatch = entry.data.action?.toLowerCase().includes(query) || false;
  return feelingsMatch || actionMatch;
}

/**
 * Search matcher for night-review entries
 */
function matchNightReviewEntry(entry: JournalEntry, query: string): boolean {
  const gratMatch = entry.data.step4_gratitude?.toLowerCase().includes(query) || false;
  const surrMatch = entry.data.step4_surrender?.toLowerCase().includes(query) || false;
  return gratMatch || surrMatch;
}

// Lookup table for entry type search matchers
const SEARCH_MATCHERS: Record<string, SearchMatcher> = {
  mood: matchMoodEntry,
  gratitude: matchGratitudeEntry,
  inventory: matchInventoryEntry,
  "free-write": matchNoteEntry,
  "meeting-note": matchNoteEntry,
  "spot-check": matchSpotCheckEntry,
  "night-review": matchNightReviewEntry,
  "check-in": (entry, query) => entry.data.mood?.toLowerCase().includes(query) || false,
  "daily-log": (entry, query) => entry.data.note?.toLowerCase().includes(query) || false,
};

/**
 * Match entry against search query using type-specific matchers
 */
function matchEntrySearch(entry: JournalEntry, query: string): boolean {
  const matcher = SEARCH_MATCHERS[entry.type];
  if (matcher) return matcher(entry, query);

  // Fall through for searchableText if available
  if ("searchableText" in entry && typeof entry.searchableText === "string") {
    return entry.searchableText.includes(query);
  }
  return false;
}

// Detail view components for each entry type
function MoodDetail({ data }: { data: JournalEntry["data"] }) {
  return (
    <div className="mb-4 p-4 bg-slate-50 rounded-lg text-center">
      <span className="text-4xl block mb-2">{data.mood}</span>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        Feeling (Intensity: {data.intensity}/10)
      </span>
      {data.note && <p className="mt-2 text-sm text-slate-600">{data.note}</p>}
    </div>
  );
}

function GratitudeDetail({ data }: { data: JournalEntry["data"] }) {
  return (
    <div>
      <h4 className="font-bold text-lg mb-2">I am grateful for:</h4>
      <ul className="list-disc pl-5">
        {data.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function InventoryDetail({ data }: { data: JournalEntry["data"] }) {
  return (
    <div className="space-y-4">
      <div>
        <span className="font-bold">Resentments:</span> {data.resentments}
      </div>
      <div>
        <span className="font-bold">Dishonesty:</span> {data.dishonesty}
      </div>
      <div>
        <span className="font-bold">Apologies:</span> {data.apologies}
      </div>
      <div>
        <span className="font-bold">Successes:</span> {data.successes}
      </div>
    </div>
  );
}

function NoteDetail({ data }: { data: JournalEntry["data"] }) {
  return (
    <>
      {data.title && <h4 className="font-bold text-xl mb-2 font-heading">{data.title}</h4>}
      {data.content}
    </>
  );
}

function SpotCheckDetail({ data }: { data: JournalEntry["data"] }) {
  return (
    <div className="space-y-2">
      <div>
        <span className="font-bold">Feelings:</span> {data.feelings?.join(", ")}
      </div>
      {data.action && (
        <div>
          <span className="font-bold">Action:</span> {data.action}
        </div>
      )}
    </div>
  );
}

function NightReviewDetail({ data }: { data: JournalEntry["data"] }) {
  return (
    <div className="space-y-2">
      {data.step4_gratitude && (
        <div>
          <span className="font-bold">Gratitude:</span> {data.step4_gratitude}
        </div>
      )}
      {data.step4_surrender && (
        <div>
          <span className="font-bold">Surrender:</span> {data.step4_surrender}
        </div>
      )}
    </div>
  );
}

function CheckInDetail({ data }: { data: JournalEntry["data"] }) {
  return (
    <div className="space-y-2">
      {data.mood && (
        <div>
          <span className="font-bold">Mood:</span> {data.mood}
        </div>
      )}
      <div>
        <span className="font-bold">Cravings:</span> {data.cravings ? "Yes" : "No"}
      </div>
      <div>
        <span className="font-bold">Used:</span> {data.used ? "Yes" : "No"}
      </div>
    </div>
  );
}

function DailyLogDetail({ data }: { data: JournalEntry["data"] }) {
  return (
    <div>
      <h4 className="font-bold text-xl mb-2 font-heading">Recovery Notes</h4>
      {data.note}
    </div>
  );
}

/**
 * Render detail view based on entry type
 */
function EntryDetailContent({ entry }: { entry: JournalEntry }) {
  switch (entry.type) {
    case "mood":
      return <MoodDetail data={entry.data} />;
    case "gratitude":
      return <GratitudeDetail data={entry.data} />;
    case "inventory":
      return <InventoryDetail data={entry.data} />;
    case "free-write":
    case "meeting-note":
      return <NoteDetail data={entry.data} />;
    case "spot-check":
      return <SpotCheckDetail data={entry.data} />;
    case "night-review":
      return <NightReviewDetail data={entry.data} />;
    case "check-in":
      return <CheckInDetail data={entry.data} />;
    case "daily-log":
      return <DailyLogDetail data={entry.data} />;
    default:
      return null;
  }
}

export function EntryFeed({ entries, filter }: EntryFeedProps) {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return entries
      .filter((entry) => {
        // 1. Type Filter
        if (filter !== "all" && entry.type !== filter) return false;
        // 2. Search Filter (Basic text match)
        if (!searchQuery) return true;
        return matchEntrySearch(entry, query);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [entries, filter, searchQuery]);

  // Group by Date for display
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: JournalEntry[] } = {};
    filteredEntries.forEach((entry) => {
      const dateKey = entry.dateLabel; // Use pre-computed label
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  if (filteredEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Search className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">No entries found</h3>
        <p className="mt-1 text-sm">
          {searchQuery ? "Try adjusting your search terms" : "Start your recovery journal today"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {/* Feed */}
      <div className="space-y-8">
        {Object.entries(groupedEntries)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([dateKey, daysEntries]) => {
            const dateObj = new Date(dateKey + "T12:00:00"); // Force noon to avoid TZ shift issues for display
            return (
              <div key={dateKey} className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-[#fbf9f5] py-2 z-10">
                  {format(dateObj, "EEEE, MMMM do, yyyy")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  {daysEntries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      index={0}
                      onClick={() => setSelectedEntry(entry)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* Detail Dialog */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 capitalize">
                  {selectedEntry.type.replace("-", " ")}
                </h3>
                <p className="text-sm text-slate-500">
                  {new Date(selectedEntry.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-handlee text-lg">
              <EntryDetailContent entry={selectedEntry} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
