import { z } from "zod";
import { BaseRecord } from "./shared";

/**
 * Deferred item record schema — tracks findings deferred for later resolution.
 * Extends BaseRecord with deferral-specific fields.
 */
export const DeferredItemRecord = BaseRecord.extend({
  review_id: z.string().min(1),
  finding: z.string().min(1),
  reason: z.string().nullable().optional(),
  severity: z.enum(["S0", "S1", "S2", "S3"]).nullable().optional(),
  status: z.enum(["open", "resolved", "promoted", "wont-fix"]).default("open"),
  resolved_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  defer_count: z.number().int().min(1).default(1),
  promoted_to_debt: z.boolean().default(false),
});
export type DeferredItemRecordType = z.infer<typeof DeferredItemRecord>;
