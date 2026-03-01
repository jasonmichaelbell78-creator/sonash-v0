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

// --- Schema ---

const MechanismRegex = z.union([
  z.string().regex(/^active:.+$/),
  z.string().regex(/^migrated:.+$/),
  z.literal("none"),
]);

const MechanismSimple = z.union([z.string().regex(/^active:.+$/), z.literal("none")]);

const MechanismHooks = z.union([z.literal("pre-commit"), z.literal("pre-push"), z.literal("none")]);

const MechanismAI = z.union([
  z.literal("claude-md"),
  z.literal("code-reviewer"),
  z.literal("none"),
]);

const MechanismManual = z.union([
  z.literal("code-review"),
  z.literal("documented-only"),
  z.literal("none"),
]);

export const MechanismsSchema = z.object({
  regex: MechanismRegex,
  eslint: MechanismSimple,
  semgrep: MechanismSimple,
  cross_doc: z.union([z.literal("linked"), z.literal("none")]),
  hooks: MechanismHooks,
  ai: MechanismAI,
  manual: MechanismManual,
});

export type Mechanisms = z.infer<typeof MechanismsSchema>;

export const EnforcementRecordSchema = z.object({
  pattern_id: z.string().min(1),
  pattern_name: z.string().min(1),
  priority: z.enum(["critical", "important", "edge"]),
  category: z.string().min(1),
  mechanisms: MechanismsSchema,
  coverage: z.enum(["automated", "ai-assisted", "manual-only", "none"]),
  status: z.enum(["active", "stale", "deprecated"]),
  last_verified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type EnforcementRecord = z.infer<typeof EnforcementRecordSchema>;

// --- Helpers ---

/**
 * Classify coverage level based on active mechanisms.
 *
 * - "automated" if any of regex/eslint/semgrep/hooks is active (starts with "active:" or is "pre-commit"/"pre-push")
 * - "ai-assisted" if only ai mechanism is active
 * - "manual-only" if only manual is active (not "none")
 * - "none" otherwise
 */
export function classifyCoverage(mechanisms: Mechanisms): EnforcementRecord["coverage"] {
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
export function isStale(record: EnforcementRecord): boolean {
  if (record.status === "deprecated") return false;

  const m = record.mechanisms;
  return (
    m.regex === "none" &&
    m.eslint === "none" &&
    m.semgrep === "none" &&
    m.cross_doc === "none" &&
    m.hooks === "none" &&
    m.ai === "none" &&
    m.manual === "none"
  );
}
