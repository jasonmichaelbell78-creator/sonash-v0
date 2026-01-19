"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Paperclip, Pin } from "lucide-react";

import { JournalEntry } from "@/types/journal";

interface EntryCardProps {
  entry: JournalEntry;
  index: number;
  onClick?: () => void;
}

// Style lookup table for entry types
const ENTRY_STYLES: Record<string, string> = {
  mood: "bg-transparent aspect-square w-24 rotate-[-6deg] flex flex-col items-center justify-center border-4 border-dashed border-red-800/40 shadow-none opacity-90 mix-blend-multiply",
  gratitude: "bg-[#fff9c4] w-full max-w-sm rotate-[1deg] shadow-sm p-4 text-sm font-handlee",
  "free-write": "bg-[#fff9c4] w-full max-w-md rotate-[-0.5deg] shadow-sm p-4 text-sm",
  "meeting-note": "bg-[#fff9c4] w-full max-w-md rotate-[-0.5deg] shadow-sm p-4 text-sm",
  inventory:
    "bg-white w-full shadow-md p-6 border-l-4 border-[var(--journal-ribbon-purple)] rotate-[0.5deg]",
  "spot-check": "bg-amber-50 w-full shadow-sm p-4 border-l-4 border-amber-500",
  "night-review": "bg-indigo-50 w-full shadow-md p-6 border-l-4 border-indigo-500",
  "daily-log":
    "bg-gradient-to-br from-sky-50 to-sky-100 w-full max-w-xs p-4 rounded-2xl shadow-md border-2 border-sky-200/50 rotate-[1deg]",
  "step-1-worksheet":
    "bg-green-50 w-full shadow-md p-6 border-l-4 border-green-500 rotate-[0.5deg]",
  default: "bg-white w-full shadow-md p-4 rotate-[-0.5deg]",
};

// Mood emoji lookup
const MOOD_EMOJI: Record<string, string> = {
  struggling: "😟",
  okay: "😐",
  hopeful: "🙂",
  great: "😊",
};

/**
 * Get styling classes for entry type
 */
function getEntryStyles(type: string): string {
  return ENTRY_STYLES[type] || ENTRY_STYLES.default;
}

/**
 * Get emoji for mood
 */
function getMoodEmoji(mood: string): string {
  return MOOD_EMOJI[mood] || "😐";
}

/**
 * Render decoration (tape, clip, pin) for entry
 */
function EntryDecoration({ type }: { type: string }) {
  if (type === "mood") return null;

  if (type === "gratitude") {
    return (
      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
        <Pin className="w-4 h-4 text-red-500 fill-red-500 drop-shadow-sm" />
      </div>
    );
  }

  if (type === "inventory") {
    return (
      <div className="absolute -top-3 right-4">
        <Paperclip className="w-6 h-6 text-zinc-400 rotate-12" />
      </div>
    );
  }

  return null;
}

/**
 * Render mood entry content
 */
function MoodContent({ data }: { data: JournalEntry["data"] }) {
  return (
    <>
      <div className="text-5xl mb-1 drop-shadow-sm">{getMoodEmoji(data.mood)}</div>
      <div className="text-[10px] font-black text-red-800/60 uppercase tracking-widest font-sans border-t border-b border-red-800/30 px-2 py-0.5 mt-1">
        Feeling
      </div>
      <div className="text-[9px] text-red-800/50 mt-1 font-sans">{data.mood}</div>
    </>
  );
}

/**
 * Render daily-log entry content
 */
function DailyLogContent({ data }: { data: JournalEntry["data"] }) {
  return (
    <div className="w-full relative">
      <div className="absolute -top-2 -right-2 text-3xl opacity-20">
        {data.used === true ? "⚠️" : data.cravings === true ? "⚡" : "✓"}
      </div>
      <h4 className="font-heading text-sm mb-3 text-sky-900/90 flex items-center gap-2">
        <span className="text-lg">📋</span>
        Check-In
      </h4>
      <div className="flex flex-col gap-1.5 text-xs font-sans">
        {data.cravings !== null && data.cravings !== undefined && (
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-full font-medium ${data.cravings ? "bg-amber-100 border border-amber-300 text-amber-800" : "bg-green-100 border border-green-300 text-green-800"}`}
            >
              {data.cravings ? "⚡ Cravings: Yes" : "✓ Cravings: No"}
            </span>
          </div>
        )}
        {data.used !== null && data.used !== undefined && (
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-full font-medium ${data.used ? "bg-red-100 border border-red-300 text-red-800" : "bg-green-100 border border-green-300 text-green-800"}`}
            >
              {data.used ? "⚠️ Used: Yes" : "✓ Used: No"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Render step-1-worksheet entry content
 */
function Step1WorksheetContent({ data }: { data: Record<string, unknown> }) {
  const worksheetSections = [
    { key: "powerlessnessOverAmount", label: "Powerlessness over Amount" },
    { key: "powerlessnessOverBadResults", label: "Powerlessness over Bad Results" },
    { key: "unmanageability", label: "Unmanageability" },
    { key: "conclusionsAndAcceptance", label: "Conclusions & Acceptance" },
  ];

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">📗</span>
        <h3 className="font-heading text-lg text-green-900">Step 1 Worksheet</h3>
      </div>
      <div className="text-sm text-green-800/80 space-y-1">
        {worksheetSections.map((section) => (
          <div className="flex items-center gap-2" key={section.key}>
            <span className="text-xs w-3">{data[section.key] ? "✓" : ""}</span>
            <span>{section.label}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-green-700 font-sans mt-3 pt-3 border-t border-green-200">
        Click to review your Step 1 work
      </div>
    </div>
  );
}

/**
 * Render gratitude entry content
 */
function GratitudeContent({ data }: { data: JournalEntry["data"] }) {
  return (
    <div className="w-full">
      <h4 className="font-heading text-lg mb-2 text-[var(--journal-text)]">Gratitude</h4>
      <ul className="list-disc pl-4 text-sm font-handlee text-[var(--journal-text)]">
        {data.items.slice(0, 3).map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Render free-write or meeting-note entry content
 */
function NoteContent({ data }: { data: JournalEntry["data"] }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-heading text-sm text-amber-900/80">{data.title || "Note"}</h4>
      </div>
      <p className="leading-relaxed whitespace-pre-wrap font-handlee text-amber-900 line-clamp-6 text-sm">
        {data.content}
      </p>
    </div>
  );
}

/**
 * Render spot-check entry content
 */
function SpotCheckContent({ data }: { data: JournalEntry["data"] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-heading text-lg text-amber-900">Spot Check</h3>
      {data.feelings && data.feelings.length > 0 && (
        <div className="text-sm">
          <span className="font-semibold">Feelings:</span> {data.feelings.join(", ")}
        </div>
      )}
      {data.action && <p className="text-sm italic line-clamp-2">{data.action}</p>}
    </div>
  );
}

/**
 * Render night-review entry content
 */
function NightReviewContent({ data }: { data: JournalEntry["data"] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-heading text-lg text-indigo-900">Night Review</h3>
      {data.gratitude && <p className="text-sm italic line-clamp-2">Gratitude: {data.gratitude}</p>}
      <div className="text-xs text-indigo-700">Click to view full review</div>
    </div>
  );
}

/**
 * Render inventory entry content
 */
function InventoryContent() {
  return (
    <div className="w-full text-center py-2">
      <h3 className="font-heading text-lg text-[var(--journal-text)]">Nightly Inventory</h3>
      <div className="text-xs text-slate-500 font-sans mt-1">Click to review</div>
    </div>
  );
}

/**
 * Render entry content based on type
 */
function EntryContent({ entry }: { entry: JournalEntry }) {
  switch (entry.type) {
    case "mood":
      return <MoodContent data={entry.data} />;
    case "gratitude":
      return <GratitudeContent data={entry.data} />;
    case "free-write":
    case "meeting-note":
      return <NoteContent data={entry.data} />;
    case "daily-log":
      return <DailyLogContent data={entry.data} />;
    case "spot-check":
      return <SpotCheckContent data={entry.data} />;
    case "night-review":
      return <NightReviewContent data={entry.data} />;
    case "inventory":
      return <InventoryContent />;
    case "step-1-worksheet":
      return <Step1WorksheetContent data={entry.data as Record<string, unknown>} />;
    default:
      return null;
  }
}

// Rotation lookup for entry types
const ENTRY_ROTATION: Record<string, number> = {
  mood: -2,
  gratitude: 1,
};

/**
 * Format entry timestamp for display
 */
function formatEntryTime(createdAt: string | number | Date | undefined): string {
  if (!createdAt) return "";
  return new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EntryCard({ entry, index, onClick }: EntryCardProps) {
  const rotateValue = ENTRY_ROTATION[entry.type] ?? 0;
  const isCompact = entry.type === "mood" || entry.type === "gratitude";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, rotate: -5 }}
      animate={{ opacity: 1, x: 0, rotate: rotateValue }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
      onClick={onClick}
      className={cn("relative mb-6 cursor-pointer", !isCompact && "w-full")}
    >
      <div
        className={cn(
          "relative transition-transform hover:scale-[1.01] duration-300",
          getEntryStyles(entry.type)
        )}
      >
        <EntryDecoration type={entry.type} />

        {/* Date - subtle (using createdAt timestamp) */}
        <div className="text-[10px] text-amber-900/50 font-sans mb-1 uppercase tracking-wider text-right">
          {formatEntryTime(entry.createdAt)}
        </div>

        {/* Content based on Type */}
        <EntryContent entry={entry} />
      </div>
    </motion.div>
  );
}
