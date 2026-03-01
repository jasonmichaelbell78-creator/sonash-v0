import { z } from "zod";
/**
 * Review record schema — tracks PR review findings and metrics.
 * Extends BaseRecord with review-specific fields.
 */
export declare const ReviewRecord: z.ZodObject<{
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
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pr: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    source: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    total: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    fixed: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    deferred: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    rejected: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    patterns: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    learnings: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    severity_breakdown: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        critical: z.ZodNumber;
        major: z.ZodNumber;
        minor: z.ZodNumber;
        trivial: z.ZodNumber;
    }, z.core.$strip>>>;
    per_round_detail: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodUnknown>>>;
    rejection_analysis: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodUnknown>>>;
    ping_pong_chains: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodUnknown>>>;
}, z.core.$strip>;
export type ReviewRecordType = z.infer<typeof ReviewRecord>;
