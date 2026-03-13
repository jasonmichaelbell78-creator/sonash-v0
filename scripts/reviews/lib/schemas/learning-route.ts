import { z } from "zod";
import { BaseRecord } from "./shared";

/**
 * Learning object — what was discovered.
 * Captures the type, pattern, source, severity, and optional evidence.
 */
export const LearningInput = z.object({
  type: z.enum(["code", "process", "behavioral"]),
  pattern: z.string().min(1),
  source: z.string().min(1),
  severity: z.enum(["critical", "high", "medium", "low"]),
  evidence: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Learning route record — tracks the lifecycle from discovery to enforcement.
 *
 * Status lifecycle: scaffolded -> refined -> enforced -> verified
 *
 * Data flow:
 *   Writer:    learning-router
 *   Consumers: verify-enforcement, health checker, alerts
 *
 * Extends BaseRecord (id, date, schema_version, completeness,
 * completeness_missing, origin).
 */
export const LearningRouteRecord = BaseRecord.extend({
  learning: LearningInput,
  route: z.enum(["verified-pattern", "hook-gate", "lint-rule", "claude-md-annotation"]),
  scaffold: z.string().min(1).describe("Path to the scaffold target file"),
  status: z.enum(["scaffolded", "refined", "enforced", "verified"]),
  enforcement_test: z.string().nullable().default(null).describe("Path to the enforcement test"),
  metrics: z
    .object({
      violations_before: z.number().int().nonnegative().nullable().default(null),
      violations_after: z.number().int().nonnegative().nullable().default(null),
    })
    .default({ violations_before: null, violations_after: null }),
}).passthrough(); // SWS D22: passthrough for future extension

export type LearningRouteRecordType = z.infer<typeof LearningRouteRecord>;
