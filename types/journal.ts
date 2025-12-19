// ============================================
// JOURNAL ENTRY TYPES - Unified Schema
// ============================================

export type JournalEntryType =
    // Quick Entries
    | 'check-in'      // Daily mood/cravings/used from Today page
    | 'mood'          // Standalone mood stamp
    | 'gratitude'     // Gratitude list

    // Written Content
    | 'daily-log'     // Recovery Notepad content
    | 'free-write'    // General notes
    | 'meeting-note'  // Meeting reflections

    // Structured Inventories
    | 'spot-check'    // Quick emotional check
    | 'inventory'     // Simple 4-question inventory
    | 'night-review'; // Full 4-step inventory

// ============================================
// DATA INTERFACES (Type-specific payloads)
// ============================================

// 1. CHECK-IN (from Today page toggles)
export interface CheckInData {
    mood: string | null;
    cravings: boolean;
    used: boolean;
    cleanDays?: number;
}

// 2. DAILY-LOG (Recovery Notepad)
export interface DailyLogData {
    content: string;
    wordCount: number;
}

// 3. MOOD (Standalone stamp)
export interface MoodData {
    mood: string;
    intensity: number; // 1-10
    note?: string;
}

// 4. GRATITUDE
export interface GratitudeData {
    items: string[];
}

// 5. SPOT-CHECK (Quick emotional processing)
export interface SpotCheckData {
    feelings: string[];
    absolutes: string[];
    action: string;
}

// 6. INVENTORY (Simple 4-question)
export interface InventoryData {
    resentments: string;
    dishonesty: string;
    apologies: string;
    successes: string;
}

// 7. NIGHT-REVIEW (Comprehensive 4-step)
export interface NightReviewData {
    step1_actions: Record<string, boolean>;
    step2_traits: Record<string, 'positive' | 'negative' | null>;
    step3_reflections: Record<string, string>;
    step4_gratitude: string;
    step4_surrender: string;
}

// 8. NOTES (Free-write, Meeting notes)
export interface NoteData {
    title: string;
    content: string;
    tags?: string[];
}

// ============================================
// BASE ENTRY (Common fields)
// ============================================

interface BaseEntry {
    id: string;
    userId: string;
    createdAt: number; // Timestamp in milliseconds
    updatedAt: number;
    dateLabel: string; // "YYYY-MM-DD" for grouping

    // Privacy & Lifecycle
    isPrivate: boolean;
    isSoftDeleted: boolean;

    // Denormalized fields for efficient querying
    hasCravings?: boolean;
    hasUsed?: boolean;
    mood?: string | null;

    // Search & Organization
    searchableText?: string;
    tags: string[];
}

// ============================================
// TYPED ENTRIES (Discriminated Union)
// ============================================

export interface CheckInEntry extends BaseEntry {
    type: 'check-in';
    data: CheckInData;
}

export interface DailyLogEntry extends BaseEntry {
    type: 'daily-log';
    data: DailyLogData;
}

export interface MoodEntry extends BaseEntry {
    type: 'mood';
    data: MoodData;
}

export interface GratitudeEntry extends BaseEntry {
    type: 'gratitude';
    data: GratitudeData;
}

export interface SpotCheckEntry extends BaseEntry {
    type: 'spot-check';
    data: SpotCheckData;
}

export interface InventoryEntry extends BaseEntry {
    type: 'inventory';
    data: InventoryData;
}

export interface NightReviewEntry extends BaseEntry {
    type: 'night-review';
    data: NightReviewData;
}

export interface NoteEntry extends BaseEntry {
    type: 'free-write' | 'meeting-note';
    data: NoteData;
}

// ============================================
// UNION TYPE (The magic part)
// ============================================

export type JournalEntry =
    | CheckInEntry
    | DailyLogEntry
    | MoodEntry
    | GratitudeEntry
    | SpotCheckEntry
    | InventoryEntry
    | NightReviewEntry
    | NoteEntry;

// ============================================
// HELPER TYPES
// ============================================

// Map entry type to its data type
export type JournalDataByType = {
    'check-in': CheckInData;
    'daily-log': DailyLogData;
    'mood': MoodData;
    'gratitude': GratitudeData;
    'spot-check': SpotCheckData;
    'inventory': InventoryData;
    'night-review': NightReviewData;
    'free-write': NoteData;
    'meeting-note': NoteData;
};
