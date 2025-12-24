import { z } from "zod";

// Schema for checking daily log input data
// Enforces types, string lengths, and optional fields
export const dailyLogSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    content: z.string().max(50000, "Content too large. Maximum 50KB."),
    mood: z.string().nullable().optional(),
    cravings: z.boolean().optional(),
    used: z.boolean().optional(),
    userId: z.string().optional(), // Optional in data because we get it from auth context
});

export type DailyLogInput = z.infer<typeof dailyLogSchema>;

// Schema for journal entry validation
// Supports all journal entry types with flexible data structure
export const journalEntrySchema = z.object({
    type: z.enum(['mood', 'gratitude', 'inventory', 'spot-check', 'night-review', 'free-write', 'meeting-note', 'daily-log', 'check-in']),
    data: z.record(z.string(), z.unknown()), // Flexible object, validated per-type in function
    dateLabel: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    isPrivate: z.boolean().optional().default(true),
    searchableText: z.string().max(10000).optional(),
    tags: z.array(z.string()).optional(),
    // Denormalized fields for efficient querying
    hasCravings: z.boolean().optional(),
    hasUsed: z.boolean().optional(),
    mood: z.string().nullable().optional(),
    userId: z.string().optional(), // Optional in data because we get it from auth context
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;

// Schema for inventory entry validation
// Supports spot-check, night-review, and gratitude entries
export const inventoryEntrySchema = z.object({
    type: z.enum(['spot-check', 'night-review', 'gratitude']),
    data: z.record(z.string(), z.unknown()), // Flexible object structure per inventory type
    tags: z.array(z.string()).optional().default([]),
    userId: z.string().optional(), // Optional in data because we get it from auth context
});

export type InventoryEntryInput = z.infer<typeof inventoryEntrySchema>;
