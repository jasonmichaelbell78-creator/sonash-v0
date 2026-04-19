import { z } from "zod";
import { BaseRecord } from "./shared";

/**
 * Invocation record schema — tracks skill/agent/team invocations.
 * Extends BaseRecord with invocation-specific fields.
 */
export const InvocationRecord = BaseRecord.extend({
  skill: z.string().min(1),
  type: z.enum(["skill", "agent", "team"]),
  duration_ms: z.number().int().min(0).nullable().optional(),
  success: z.boolean(),
  error: z.string().nullable().optional(),
  agent_name: z.string().min(1).nullable().optional(),
  team_name: z.preprocess((v) => {
    if (typeof v !== "string") return v;
    const trimmed = v.trim();
    return trimmed === "" ? null : trimmed;
  }, z.string().min(1).max(64).nullable().optional()),
  model: z.string().min(1).nullable().optional(),
  tokens: z.preprocess((v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed === "") return null;
      return trimmed;
    }
    if (typeof v === "number") return v;
    return NaN;
  }, z.coerce.number().finite().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable().optional()),
  context: z
    .object({
      pr: z.number().int().positive().optional(),
      session: z.string().min(1).nullable().optional(),
      trigger: z.string().min(1).nullable().optional(),
      agents_audited: z.number().int().min(0).nullable().optional(),
      grade: z.string().min(1).nullable().optional(),
      mean_score: z.number().min(0).max(100).nullable().optional(),
      improvements: z.number().int().min(0).nullable().optional(),
      categories: z.number().int().min(0).nullable().optional(),
      // skill-audit context fields
      target: z.string().min(1).nullable().optional(),
      decisions: z.number().int().min(0).nullable().optional(),
      score: z.number().int().min(0).max(100).nullable().optional(),
      // general-purpose context fields
      topic: z.string().min(1).nullable().optional(),
      note: z.string().min(1).nullable().optional(),
      // (T36) context fields added by the task-queue slash-command skill
      action: z.string().min(1).nullable().optional(),
      todosActive: z.number().int().min(0).nullable().optional(),
    })
    // .passthrough() is intentional — context fields vary per skill. Unknown
    // keys are preserved, not validated. Explicit fields above exist for
    // discoverability only; do not remove passthrough without adding every
    // consumer's context keys (which is why T36 fixed the bug this way).
    .passthrough()
    .nullable()
    .optional(),
});
export type InvocationRecordType = z.infer<typeof InvocationRecord>;
