/**
 * Barrel export for all JSONL record schemas.
 * Single import point: import { ReviewRecord, BaseRecord, ... } from "./schemas";
 */
export { BaseRecord, CompletenessTier, Origin, type BaseRecordType, type CompletenessTierType, type OriginType, } from "./shared";
export { ReviewRecord, type ReviewRecordType } from "./review";
export { RetroRecord, type RetroRecordType } from "./retro";
export { DeferredItemRecord, type DeferredItemRecordType } from "./deferred-item";
export { InvocationRecord, type InvocationRecordType } from "./invocation";
export { WarningRecord, type WarningRecordType } from "./warning";
export declare const SCHEMA_MAP: {
    readonly reviews: import("zod").ZodObject<{
        id: import("zod").ZodString;
        date: import("zod").ZodString;
        schema_version: import("zod").ZodNumber;
        completeness: import("zod").ZodEnum<{
            full: "full";
            partial: "partial";
            stub: "stub";
        }>;
        completeness_missing: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
        origin: import("zod").ZodObject<{
            type: import("zod").ZodEnum<{
                "pr-review": "pr-review";
                "pr-retro": "pr-retro";
                backfill: "backfill";
                migration: "migration";
                manual: "manual";
            }>;
            pr: import("zod").ZodOptional<import("zod").ZodNumber>;
            round: import("zod").ZodOptional<import("zod").ZodNumber>;
            session: import("zod").ZodOptional<import("zod").ZodString>;
            tool: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strip>;
        title: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        pr: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
        source: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        total: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
        fixed: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
        deferred: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
        rejected: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
        patterns: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodArray<import("zod").ZodString>>>;
        learnings: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodArray<import("zod").ZodString>>>;
        severity_breakdown: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodObject<{
            critical: import("zod").ZodNumber;
            major: import("zod").ZodNumber;
            minor: import("zod").ZodNumber;
            trivial: import("zod").ZodNumber;
        }, import("zod/v4/core").$strip>>>;
        per_round_detail: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodArray<import("zod").ZodUnknown>>>;
        rejection_analysis: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodArray<import("zod").ZodUnknown>>>;
        ping_pong_chains: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodArray<import("zod").ZodUnknown>>>;
    }, import("zod/v4/core").$strip>;
    readonly retros: import("zod").ZodObject<{
        id: import("zod").ZodString;
        date: import("zod").ZodString;
        schema_version: import("zod").ZodNumber;
        completeness: import("zod").ZodEnum<{
            full: "full";
            partial: "partial";
            stub: "stub";
        }>;
        completeness_missing: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
        origin: import("zod").ZodObject<{
            type: import("zod").ZodEnum<{
                "pr-review": "pr-review";
                "pr-retro": "pr-retro";
                backfill: "backfill";
                migration: "migration";
                manual: "manual";
            }>;
            pr: import("zod").ZodOptional<import("zod").ZodNumber>;
            round: import("zod").ZodOptional<import("zod").ZodNumber>;
            session: import("zod").ZodOptional<import("zod").ZodString>;
            tool: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strip>;
        pr: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
        session: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        top_wins: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodArray<import("zod").ZodString>>>;
        top_misses: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodArray<import("zod").ZodString>>>;
        process_changes: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodArray<import("zod").ZodString>>>;
        score: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
        metrics: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodObject<{
            total_findings: import("zod").ZodNumber;
            fix_rate: import("zod").ZodNumber;
            pattern_recurrence: import("zod").ZodNumber;
        }, import("zod/v4/core").$strip>>>;
    }, import("zod/v4/core").$strip>;
    readonly "deferred-items": import("zod").ZodObject<{
        id: import("zod").ZodString;
        date: import("zod").ZodString;
        schema_version: import("zod").ZodNumber;
        completeness: import("zod").ZodEnum<{
            full: "full";
            partial: "partial";
            stub: "stub";
        }>;
        completeness_missing: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
        origin: import("zod").ZodObject<{
            type: import("zod").ZodEnum<{
                "pr-review": "pr-review";
                "pr-retro": "pr-retro";
                backfill: "backfill";
                migration: "migration";
                manual: "manual";
            }>;
            pr: import("zod").ZodOptional<import("zod").ZodNumber>;
            round: import("zod").ZodOptional<import("zod").ZodNumber>;
            session: import("zod").ZodOptional<import("zod").ZodString>;
            tool: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strip>;
        review_id: import("zod").ZodString;
        finding: import("zod").ZodString;
        reason: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        severity: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodEnum<{
            S0: "S0";
            S1: "S1";
            S2: "S2";
            S3: "S3";
        }>>>;
        status: import("zod").ZodDefault<import("zod").ZodEnum<{
            open: "open";
            resolved: "resolved";
            promoted: "promoted";
            "wont-fix": "wont-fix";
        }>>;
        resolved_date: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        defer_count: import("zod").ZodDefault<import("zod").ZodNumber>;
        promoted_to_debt: import("zod").ZodDefault<import("zod").ZodBoolean>;
    }, import("zod/v4/core").$strip>;
    readonly invocations: import("zod").ZodObject<{
        id: import("zod").ZodString;
        date: import("zod").ZodString;
        schema_version: import("zod").ZodNumber;
        completeness: import("zod").ZodEnum<{
            full: "full";
            partial: "partial";
            stub: "stub";
        }>;
        completeness_missing: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
        origin: import("zod").ZodObject<{
            type: import("zod").ZodEnum<{
                "pr-review": "pr-review";
                "pr-retro": "pr-retro";
                backfill: "backfill";
                migration: "migration";
                manual: "manual";
            }>;
            pr: import("zod").ZodOptional<import("zod").ZodNumber>;
            round: import("zod").ZodOptional<import("zod").ZodNumber>;
            session: import("zod").ZodOptional<import("zod").ZodString>;
            tool: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strip>;
        skill: import("zod").ZodString;
        type: import("zod").ZodEnum<{
            skill: "skill";
            agent: "agent";
            team: "team";
        }>;
        duration_ms: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
        success: import("zod").ZodBoolean;
        error: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        context: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodObject<{
            pr: import("zod").ZodOptional<import("zod").ZodNumber>;
            session: import("zod").ZodOptional<import("zod").ZodString>;
            trigger: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strip>>>;
    }, import("zod/v4/core").$strip>;
    readonly warnings: import("zod").ZodObject<{
        id: import("zod").ZodString;
        date: import("zod").ZodString;
        schema_version: import("zod").ZodNumber;
        completeness: import("zod").ZodEnum<{
            full: "full";
            partial: "partial";
            stub: "stub";
        }>;
        completeness_missing: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
        origin: import("zod").ZodObject<{
            type: import("zod").ZodEnum<{
                "pr-review": "pr-review";
                "pr-retro": "pr-retro";
                backfill: "backfill";
                migration: "migration";
                manual: "manual";
            }>;
            pr: import("zod").ZodOptional<import("zod").ZodNumber>;
            round: import("zod").ZodOptional<import("zod").ZodNumber>;
            session: import("zod").ZodOptional<import("zod").ZodString>;
            tool: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strip>;
        category: import("zod").ZodString;
        message: import("zod").ZodString;
        severity: import("zod").ZodEnum<{
            error: "error";
            info: "info";
            warning: "warning";
        }>;
        lifecycle: import("zod").ZodDefault<import("zod").ZodEnum<{
            resolved: "resolved";
            new: "new";
            acknowledged: "acknowledged";
            stale: "stale";
        }>>;
        resolved_date: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        source_script: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        related_ids: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodArray<import("zod").ZodString>>>;
    }, import("zod/v4/core").$strip>;
};
