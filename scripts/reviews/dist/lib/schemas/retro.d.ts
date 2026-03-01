import { z } from "zod";
/**
 * Retro record schema — tracks PR retrospective analysis.
 * Extends BaseRecord with retro-specific fields.
 */
export declare const RetroRecord: z.ZodObject<{
    id: z.ZodString;
    date: z.ZodString;
    schema_version: z.ZodNumber;
    completeness: z.ZodEnum<{
        full: "full";
        partial: "partial";
        stub: "stub";
    }>;
    completeness_missing: z.ZodDefault<z.ZodArray<z.ZodString>>;
    origin: z.ZodObject<{
        type: z.ZodEnum<{
            "pr-review": "pr-review";
            "pr-retro": "pr-retro";
            backfill: "backfill";
            migration: "migration";
            manual: "manual";
        }>;
        pr: z.ZodOptional<z.ZodNumber>;
        round: z.ZodOptional<z.ZodNumber>;
        session: z.ZodOptional<z.ZodString>;
        tool: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    pr: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    session: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    top_wins: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    top_misses: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    process_changes: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    score: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    metrics: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        total_findings: z.ZodNumber;
        fix_rate: z.ZodNumber;
        pattern_recurrence: z.ZodNumber;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type RetroRecordType = z.infer<typeof RetroRecord>;
