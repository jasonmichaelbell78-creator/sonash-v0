import { z } from "zod";
/**
 * Three-tier completeness model for all JSONL records.
 * - full: all fields populated
 * - partial: required fields + some optional
 * - stub: minimal required fields only
 */
export declare const CompletenessTier: z.ZodEnum<{
    full: "full";
    partial: "partial";
    stub: "stub";
}>;
export type CompletenessTierType = z.infer<typeof CompletenessTier>;
/**
 * Structured origin tracking — never a plain string.
 * Records where data came from and under what context.
 */
export declare const Origin: z.ZodObject<{
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
export type OriginType = z.infer<typeof Origin>;
/**
 * Base record shared by all 5 JSONL file types.
 * Every entity schema extends this via BaseRecord.extend().
 */
export declare const BaseRecord: z.ZodObject<{
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
}, z.core.$strip>;
export type BaseRecordType = z.infer<typeof BaseRecord>;
