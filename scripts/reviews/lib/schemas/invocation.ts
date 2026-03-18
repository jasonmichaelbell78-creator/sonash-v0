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
  model: z.string().min(1).nullable().optional(),
  context: z
    .object({
      pr: z.number().int().positive().optional(),
      session: z.string().min(1).optional(),
      trigger: z.string().min(1).optional(),
      agents_audited: z.number().int().min(0).optional(),
      grade: z.string().min(1).optional(),
      mean_score: z.number().min(0).max(100).optional(),
      improvements: z.number().int().min(0).optional(),
      categories: z.number().int().min(0).optional(),
    })
    .nullable()
    .optional(),
});
export type InvocationRecordType = z.infer<typeof InvocationRecord>;
