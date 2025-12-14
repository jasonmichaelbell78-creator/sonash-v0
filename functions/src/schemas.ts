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
