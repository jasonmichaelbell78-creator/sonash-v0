import { z } from "zod";
/**
 * Warning record schema — tracks system warnings and alerts.
 * Extends BaseRecord with warning-specific fields.
 */
export declare const WarningRecord: z.ZodObject<{
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
    category: z.ZodString;
    message: z.ZodString;
    severity: z.ZodEnum<{
        error: "error";
        info: "info";
        warning: "warning";
    }>;
    lifecycle: z.ZodDefault<z.ZodEnum<{
        resolved: "resolved";
        new: "new";
        acknowledged: "acknowledged";
        stale: "stale";
    }>>;
    resolved_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    source_script: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    related_ids: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export type WarningRecordType = z.infer<typeof WarningRecord>;
