/**
 * Enforcement Manifest Schema and Helpers
 *
 * Defines the Zod schema for enforcement manifest records that track
 * which CODE_PATTERNS.md patterns are enforced by which mechanisms
 * (regex, ESLint, Semgrep, cross-doc, hooks, AI, manual).
 *
 * Used by build-enforcement-manifest.ts and verify-enforcement-manifest.ts.
 */
import { z } from "zod";
export declare const MechanismsSchema: z.ZodObject<{
    regex: z.ZodUnion<readonly [z.ZodString, z.ZodString, z.ZodLiteral<"none">]>;
    eslint: z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"none">]>;
    semgrep: z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"none">]>;
    cross_doc: z.ZodUnion<readonly [z.ZodLiteral<"linked">, z.ZodLiteral<"none">]>;
    hooks: z.ZodUnion<readonly [z.ZodLiteral<"pre-commit">, z.ZodLiteral<"pre-push">, z.ZodLiteral<"none">]>;
    ai: z.ZodUnion<readonly [z.ZodLiteral<"claude-md">, z.ZodLiteral<"code-reviewer">, z.ZodLiteral<"none">]>;
    manual: z.ZodUnion<readonly [z.ZodLiteral<"code-review">, z.ZodLiteral<"documented-only">, z.ZodLiteral<"none">]>;
}, z.core.$strip>;
export type Mechanisms = z.infer<typeof MechanismsSchema>;
export declare const EnforcementRecordSchema: z.ZodObject<{
    pattern_id: z.ZodString;
    pattern_name: z.ZodString;
    priority: z.ZodEnum<{
        critical: "critical";
        important: "important";
        edge: "edge";
    }>;
    category: z.ZodString;
    mechanisms: z.ZodObject<{
        regex: z.ZodUnion<readonly [z.ZodString, z.ZodString, z.ZodLiteral<"none">]>;
        eslint: z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"none">]>;
        semgrep: z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"none">]>;
        cross_doc: z.ZodUnion<readonly [z.ZodLiteral<"linked">, z.ZodLiteral<"none">]>;
        hooks: z.ZodUnion<readonly [z.ZodLiteral<"pre-commit">, z.ZodLiteral<"pre-push">, z.ZodLiteral<"none">]>;
        ai: z.ZodUnion<readonly [z.ZodLiteral<"claude-md">, z.ZodLiteral<"code-reviewer">, z.ZodLiteral<"none">]>;
        manual: z.ZodUnion<readonly [z.ZodLiteral<"code-review">, z.ZodLiteral<"documented-only">, z.ZodLiteral<"none">]>;
    }, z.core.$strip>;
    coverage: z.ZodEnum<{
        none: "none";
        automated: "automated";
        "ai-assisted": "ai-assisted";
        "manual-only": "manual-only";
    }>;
    status: z.ZodEnum<{
        active: "active";
        stale: "stale";
        deprecated: "deprecated";
    }>;
    last_verified: z.ZodString;
}, z.core.$strip>;
export type EnforcementRecord = z.infer<typeof EnforcementRecordSchema>;
/**
 * Classify coverage level based on active mechanisms.
 *
 * - "automated" if any of regex/eslint/semgrep/hooks is active (starts with "active:" or is "pre-commit"/"pre-push")
 * - "ai-assisted" if only ai mechanism is active
 * - "manual-only" if only manual is active (not "none")
 * - "none" otherwise
 */
export declare function classifyCoverage(mechanisms: Mechanisms): EnforcementRecord["coverage"];
/**
 * Check if a pattern record is stale.
 * Stale = no mechanism is active (all "none") and status is not "deprecated".
 */
export declare function isStale(record: EnforcementRecord): boolean;
