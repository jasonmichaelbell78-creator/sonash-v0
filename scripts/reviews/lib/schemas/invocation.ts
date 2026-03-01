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
  context: z
    .object({
      pr: z.number().int().positive().optional(),
      session: z.string().optional(),
      trigger: z.string().optional(),
    })
    .nullable()
    .optional(),
});
export type InvocationRecordType = z.infer<typeof InvocationRecord>;
