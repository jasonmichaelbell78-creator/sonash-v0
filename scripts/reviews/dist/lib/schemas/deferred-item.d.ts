import { z } from "zod";
/**
 * Deferred item record schema — tracks findings deferred for later resolution.
 * Extends BaseRecord with deferral-specific fields.
 */
export declare const DeferredItemRecord: z.ZodObject<{
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
    review_id: z.ZodString;
    finding: z.ZodString;
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    severity: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        S0: "S0";
        S1: "S1";
        S2: "S2";
        S3: "S3";
    }>>>;
    status: z.ZodDefault<z.ZodEnum<{
        open: "open";
        resolved: "resolved";
        promoted: "promoted";
        "wont-fix": "wont-fix";
    }>>;
    resolved_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    defer_count: z.ZodDefault<z.ZodNumber>;
    promoted_to_debt: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type DeferredItemRecordType = z.infer<typeof DeferredItemRecord>;
