"use strict";
/**
 * Enforcement Manifest Schema and Helpers
 *
 * Defines the Zod schema for enforcement manifest records that track
 * which CODE_PATTERNS.md patterns are enforced by which mechanisms
 * (regex, ESLint, Semgrep, cross-doc, hooks, AI, manual).
 *
 * Used by build-enforcement-manifest.ts and verify-enforcement-manifest.ts.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnforcementRecordSchema = exports.MechanismsSchema = void 0;
exports.classifyCoverage = classifyCoverage;
exports.isStale = isStale;
const zod_1 = require("zod");
// --- Schema ---
const MechanismRegex = zod_1.z.union([
    zod_1.z.string().regex(/^active:.+$/),
    zod_1.z.string().regex(/^migrated:.+$/),
    zod_1.z.literal("none"),
]);
const MechanismSimple = zod_1.z.union([zod_1.z.string().regex(/^active:.+$/), zod_1.z.literal("none")]);
const MechanismHooks = zod_1.z.union([zod_1.z.literal("pre-commit"), zod_1.z.literal("pre-push"), zod_1.z.literal("none")]);
const MechanismAI = zod_1.z.union([
    zod_1.z.literal("claude-md"),
    zod_1.z.literal("code-reviewer"),
    zod_1.z.literal("none"),
]);
const MechanismManual = zod_1.z.union([
    zod_1.z.literal("code-review"),
    zod_1.z.literal("documented-only"),
    zod_1.z.literal("none"),
]);
exports.MechanismsSchema = zod_1.z.object({
    regex: MechanismRegex,
    eslint: MechanismSimple,
    semgrep: MechanismSimple,
    cross_doc: zod_1.z.union([zod_1.z.literal("linked"), zod_1.z.literal("none")]),
    hooks: MechanismHooks,
    ai: MechanismAI,
    manual: MechanismManual,
});
exports.EnforcementRecordSchema = zod_1.z.object({
    pattern_id: zod_1.z.string().min(1),
    pattern_name: zod_1.z.string().min(1),
    priority: zod_1.z.enum(["critical", "important", "edge"]),
    category: zod_1.z.string().min(1),
    mechanisms: exports.MechanismsSchema,
    coverage: zod_1.z.enum(["automated", "ai-assisted", "manual-only", "none"]),
    status: zod_1.z.enum(["active", "stale", "deprecated"]),
    last_verified: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
// --- Helpers ---
/**
 * Classify coverage level based on active mechanisms.
 *
 * - "automated" if any of regex/eslint/semgrep/hooks is active (starts with "active:" or is "pre-commit"/"pre-push")
 * - "ai-assisted" if only ai mechanism is active
 * - "manual-only" if only manual is active (not "none")
 * - "none" otherwise
 */
function classifyCoverage(mechanisms) {
    const hasRegex = mechanisms.regex.startsWith("active:");
    const hasEslint = mechanisms.eslint.startsWith("active:");
    const hasSemgrep = mechanisms.semgrep.startsWith("active:");
    const hasHooks = mechanisms.hooks !== "none";
    if (hasRegex || hasEslint || hasSemgrep || hasHooks) {
        return "automated";
    }
    if (mechanisms.ai !== "none") {
        return "ai-assisted";
    }
    if (mechanisms.manual !== "none") {
        return "manual-only";
    }
    return "none";
}
/**
 * Check if a pattern record is stale.
 * Stale = no mechanism is active (all "none") and status is not "deprecated".
 */
function isStale(record) {
    if (record.status === "deprecated")
        return false;
    const m = record.mechanisms;
    return (m.regex === "none" &&
        m.eslint === "none" &&
        m.semgrep === "none" &&
        m.cross_doc === "none" &&
        m.hooks === "none" &&
        m.ai === "none" &&
        m.manual === "none");
}
