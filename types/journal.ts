export type JournalEntryType =
    | 'mood'
    | 'gratitude'
    | 'inventory'
    | 'spot-check'
    | 'night-review'
    | 'free-write'
    | 'meeting-note'
    | 'daily-log';

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
    type: 'daily-log';
    data: {
        cravings?: boolean | null;
        used?: boolean | null;
        mood?: string | null;
        note?: string;
    };
}

// 1. The Mood Stamp (The square card)
export interface MoodEntry extends BaseEntry {
    type: 'mood';
    data: {
        mood: string; // e.g., "Happy", "Anxious"
        intensity: number; // 1-10
        note?: string; // Optional context
    };
}

// 2. The Gratitude Sticky Note (The yellow paper)
export interface GratitudeEntry extends BaseEntry {
    type: 'gratitude';
    data: {
        items: string[]; // ["My sponsor", "Hot coffee", "The rain"]
    };
}

// 3. The Nightly Inventory (The paperclipped card)
export interface InventoryEntry extends BaseEntry {
    type: 'inventory';
    data: {
        resentments: string;
        dishonesty: string;
        apologies: string;
        successes: string;
    };
}

// 4. Spot Check Entry
export interface SpotCheckEntry extends BaseEntry {
    type: 'spot-check';
    data: {
        feelings: string[];
        absolutes: string[];
        action: string;
    };
}

// 5. Night Review Entry
export interface NightReviewEntry extends BaseEntry {
    type: 'night-review';
    data: {
        actions?: Record<string, boolean>;
        traits?: Record<string, 'positive' | 'negative' | null>;
        reflections?: Record<string, string>;
        gratitude?: string;
        surrender?: string;
    };
}

// 6. The "Catch-All" (Generic Note)
export interface NoteEntry extends BaseEntry {
    type: 'free-write' | 'meeting-note';
    data: {
        title: string;
        content: string;
        tags?: string[];
    };
}

// The Union Type (This is the magic part)
export type JournalEntry = MoodEntry | GratitudeEntry | InventoryEntry | SpotCheckEntry | NightReviewEntry | NoteEntry | DailyLogEntry;
