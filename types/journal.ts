export type JournalEntryType =
  | "mood"
  | "gratitude"
  | "inventory"
  | "spot-check"
  | "night-review"
  | "free-write"
  | "meeting-note"
  | "daily-log"
  | "check-in"
  | "step-1-worksheet";

// Base interface for ALL entries
interface BaseEntry {
  id: string;
  userId: string;
  createdAt: number; // Store as timestamp (milliseconds)
  updatedAt: number;
  dateLabel: string; // "2024-12-17" (For easy grouping by day)
  isPrivate: boolean; // The "Lock" toggle
  isSoftDeleted: boolean; // For "Crumpled Page" recovery
}

// 0. Daily Check-in (mirrors notebook Today page)
export interface DailyLogEntry extends BaseEntry {
  type: "daily-log";
  data: {
    cravings?: boolean | null;
    used?: boolean | null;
    mood?: string | null;
    note?: string;
  };
}

// 1. The Mood Stamp (The square card)
export interface MoodEntry extends BaseEntry {
  type: "mood";
  data: {
    mood: string; // e.g., "Happy", "Anxious"
    intensity: number; // 1-10
    note?: string; // Optional context
  };
}

// 2. The Gratitude Sticky Note (The yellow paper)
export interface GratitudeEntry extends BaseEntry {
  type: "gratitude";
  data: {
    items: string[]; // ["My sponsor", "Hot coffee", "The rain"]
  };
}

// 3. The Nightly Inventory (The paperclipped card)
export interface InventoryEntry extends BaseEntry {
  type: "inventory";
  data: {
    resentments: string;
    dishonesty: string;
    apologies: string;
    successes: string;
  };
}

// 4. Spot Check Entry
export interface SpotCheckEntry extends BaseEntry {
  type: "spot-check";
  data: {
    feelings: string[];
    absolutes: string[];
    action: string;
  };
}

// 5. Night Review Entry
export interface NightReviewEntry extends BaseEntry {
  type: "night-review";
  data: {
    actions?: Record<string, boolean>;
    traits?: Record<string, "positive" | "negative" | null>;
    reflections?: Record<string, string>;
    gratitude?: string;
    surrender?: string;
    // Legacy fields from migration (step4_ prefix)
    step4_gratitude?: string;
    step4_surrender?: string;
    step3_reflections?: Record<string, string>;
  };
}

// 6. The "Catch-All" (Generic Note)
export interface NoteEntry extends BaseEntry {
  type: "free-write" | "meeting-note";
  data: {
    title: string;
    content: string;
    tags?: string[];
  };
}

// 7. Check-In Entry (from daily_logs migration)
export interface CheckInEntry extends BaseEntry {
  type: "check-in";
  data: {
    mood?: string | null;
    cravings?: boolean;
    used?: boolean;
  };
}

// 8. Step 1 Worksheet Entry
export interface Step1WorksheetData {
  powerlessnessOverAmount?: boolean;
  powerlessnessOverBadResults?: boolean;
  unmanageability?: boolean;
  conclusionsAndAcceptance?: boolean;
  // Add other fields from the worksheet as they are defined
}

export interface Step1WorksheetEntry extends BaseEntry {
  type: "step-1-worksheet";
  data: Step1WorksheetData; // Complex nested structure from worksheet
}

// The Union Type (This is the magic part)
export type JournalEntry =
  | MoodEntry
  | GratitudeEntry
  | InventoryEntry
  | SpotCheckEntry
  | NightReviewEntry
  | NoteEntry
  | DailyLogEntry
  | CheckInEntry
  | Step1WorksheetEntry;
