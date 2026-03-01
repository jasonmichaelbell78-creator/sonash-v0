import { z } from "zod";
import { BaseRecord } from "./shared";

/**
 * Warning record schema — tracks system warnings and alerts.
 * Extends BaseRecord with warning-specific fields.
 */
export const WarningRecord = BaseRecord.extend({
  category: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
  lifecycle: z.enum(["new", "acknowledged", "resolved", "stale"]).default("new"),
  resolved_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  source_script: z.string().nullable().optional(),
  related_ids: z.array(z.string()).nullable().optional(),
});
export type WarningRecordType = z.infer<typeof WarningRecord>;
