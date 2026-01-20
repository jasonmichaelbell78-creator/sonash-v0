"use client";

import { useMemo } from "react";
import {
  Calendar,
  Clock,
  Zap,
  Moon,
  Heart,
  Loader2,
  NotebookPen,
  LucideIcon,
  BookOpen,
} from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import { useJournal } from "@/hooks/use-journal";

type HistoryItem = {
  id: string;
  type:
    | "daily-log"
    | "spot-check"
    | "night-review"
    | "gratitude"
    | "free-write"
    | "inventory"
    | "mood"
    | "check-in"
    | "meeting-note"
    | "step-1-worksheet";
  date: Date;
  title: string;
  preview: string;
  icon: LucideIcon;
  color: string;
};

// Entry type for mapping (narrowed from JournalEntry)
type MappableEntry = {
  id: string;
  type: string;
  dateLabel: string;
  createdAt?: string | number | Date;
  data: Record<string, unknown>;
};

/**
 * Map daily-log entry to HistoryItem
 */
function mapDailyLogEntry(entry: MappableEntry, date: Date): HistoryItem {
  const { data } = entry;
  const cravingText =
    data.cravings === null ? "Cravings: n/a" : data.cravings ? "Cravings: yes" : "Cravings: no";
  const usedText = data.used === null ? "Used: n/a" : data.used ? "Used: yes" : "Used: no";
  const moodText = data.mood ? `Mood: ${data.mood}` : "Mood not set";
  const noteText = data.note ? `Note: ${(data.note as string).slice(0, 80)}` : "";
  const preview = [moodText, cravingText, usedText, noteText].filter(Boolean).join(" • ");

  return {
    id: entry.id,
    type: "daily-log",
    date,
    title: "Daily Check-in",
    preview,
    icon: Calendar,
    color: "text-amber-600",
  };
}

/**
 * Map inventory/review type entries to HistoryItem
 */
function mapInventoryEntry(
  entry: MappableEntry,
  date: Date,
  entryType: "inventory" | "night-review" | "spot-check"
): HistoryItem {
  const data = entry.data || {};
  const preview =
    (data.gratitude as string) ||
    (data.action as string) ||
    (data.resentments as string) ||
    (data.note as string) ||
    "Review completed";

  const iconMap = { "spot-check": Zap, "night-review": Moon, inventory: Calendar };
  const colorMap = {
    "spot-check": "text-orange-500",
    "night-review": "text-indigo-500",
    inventory: "text-amber-600",
  };
  const titleMap = {
    "spot-check": "Spot Check",
    "night-review": "Night Review",
    inventory: "Inventory",
  };

  return {
    id: entry.id,
    type: entryType,
    date,
    title: titleMap[entryType],
    preview,
    icon: iconMap[entryType],
    color: colorMap[entryType],
  };
}

export default function HistoryPage() {
  const { entries, loading } = useJournal();

  const items = useMemo<HistoryItem[]>(() => {
    const sevenDaysAgo = startOfDay(subDays(new Date(), 7));

    return entries
      .filter((entry) => {
        const [y, m, d] = entry.dateLabel.split("-").map(Number);
        const entryDate = startOfDay(new Date(y, m - 1, d));
        return entryDate >= sevenDaysAgo;
      })
      .map((entry): HistoryItem => {
        const date = entry.createdAt
          ? new Date(entry.createdAt)
          : new Date(entry.dateLabel + "T12:00:00");
        const mappable = entry as MappableEntry;

        switch (entry.type) {
          case "daily-log":
            return mapDailyLogEntry(mappable, date);

          case "mood":
            return {
              id: entry.id,
              type: "mood",
              date,
              title: "Mood",
              preview: (entry.data.note as string) || (entry.data.mood as string),
              icon: NotebookPen,
              color: "text-amber-700",
            };

          case "gratitude":
            return {
              id: entry.id,
              type: "gratitude",
              date,
              title: "Gratitude",
              preview: `${(entry.data.items as unknown[]).length} gratitude items`,
              icon: Heart,
              color: "text-emerald-500",
            };

          case "inventory":
          case "night-review":
          case "spot-check":
            return mapInventoryEntry(mappable, date, entry.type);

          case "step-1-worksheet":
            return {
              id: entry.id,
              type: "step-1-worksheet",
              date,
              title: "Step 1 Worksheet",
              preview: "Powerlessness • Unmanageability • Acceptance",
              icon: BookOpen,
              color: "text-green-600",
            };

          default:
            return {
              id: entry.id,
              type: entry.type,
              date,
              title: "Entry",
              preview: (entry.data as unknown as { content?: string })?.content || "",
              icon: NotebookPen,
              color: "text-amber-600",
            };
        }
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [entries]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="font-heading text-2xl text-amber-900">My Journal</h1>
        <p className="font-body text-amber-900/60 text-sm">
          Your recovery journey, one day at a time.
        </p>
        <a
          href="/journal"
          className="inline-flex items-center gap-1.5 mt-2 text-sm text-amber-700 hover:text-amber-900 font-medium transition-colors"
        >
          <NotebookPen className="w-4 h-4" />
          View Full Journal →
        </a>
      </div>

      <div className="flex-1 -mr-4 pr-4 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-900/30" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-amber-900/10 rounded-xl">
            <p className="font-handlee text-amber-900/40 text-lg">
              Your journal is waiting for you.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {items.map((entry) => (
              <button
                key={entry.id}
                className="w-full text-left bg-white/50 hover:bg-white/80 border border-amber-200/50 hover:border-amber-300 rounded-lg p-3 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <entry.icon className={`w-3.5 h-3.5 ${entry.color}`} />
                    <span className="font-heading font-bold text-amber-900/80">{entry.title}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-amber-900/40">
                    <Clock className="w-3 h-3" />
                    <span>{format(entry.date, "MMM d, h:mm a")}</span>
                  </div>
                </div>
                <p className="font-handlee text-amber-900/80 line-clamp-2 text-sm pl-6">
                  "{entry.preview}"
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
