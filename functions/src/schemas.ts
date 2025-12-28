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
// Supports spot-check, night-review, gratitude, and step-1-worksheet entries
export const inventoryEntrySchema = z.object({
    type: z.enum(['spot-check', 'night-review', 'gratitude', 'step-1-worksheet']),
    data: z.record(z.string(), z.unknown()), // Flexible object structure per inventory type
    tags: z.array(z.string()).optional().default([]),
    userId: z.string().optional(), // Optional in data because we get it from auth context
});

export type InventoryEntryInput = z.infer<typeof inventoryEntrySchema>;

// Schema for admin meeting validation
export const meetingSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(200),
    type: z.enum(["AA", "NA", "CA", "Smart", "Al-Anon"]),
    day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
    time: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
    address: z.string().min(1).max(500),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    neighborhood: z.string().max(100).optional().or(z.literal('')),
    tags: z.array(z.string()).optional(),
    coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }).optional(),
});

export type MeetingData = z.infer<typeof meetingSchema>;

// Schema for admin sober living validation
export const soberLivingSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(200),
    address: z.string().min(1).max(500),
    neighborhood: z.string().max(100).optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
    gender: z.enum(["Men", "Women", "Both"]).optional(),
    coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }).optional(),
});

export type SoberLivingData = z.infer<typeof soberLivingSchema>;

// Schema for admin quote validation
export const quoteSchema = z.object({
    id: z.string().optional(),
    text: z.string().min(1).max(1000),
    author: z.string().max(200).optional(),
    type: z.string().max(100).optional(),
});

export type QuoteData = z.infer<typeof quoteSchema>;
