export type JournalEntryType =
    | 'mood'
    | 'gratitude'
    | 'inventory'
    | 'spot-check'
    | 'free-write'
    | 'meeting-note';

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

// 4. The "Catch-All" (Generic Note)
export interface NoteEntry extends BaseEntry {
    type: 'free-write' | 'meeting-note' | 'spot-check';
    data: {
        title: string;
        content: string;
        tags?: string[];
    };
}

// The Union Type (This is the magic part)
export type JournalEntry = MoodEntry | GratitudeEntry | InventoryEntry | NoteEntry;
