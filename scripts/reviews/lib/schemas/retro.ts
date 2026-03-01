import { z } from "zod";
import { BaseRecord } from "./shared";

/**
 * Retro record schema — tracks PR retrospective analysis.
 * Extends BaseRecord with retro-specific fields.
 */
export const RetroRecord = BaseRecord.extend({
  pr: z.number().int().positive().nullable().optional(),
  session: z.string().nullable().optional(),
  top_wins: z.array(z.string()).nullable().optional(),
  top_misses: z.array(z.string()).nullable().optional(),
  process_changes: z.array(z.string()).nullable().optional(),
  score: z.number().min(0).max(10).nullable().optional(),
  metrics: z
    .object({
      total_findings: z.number().int().min(0),
      fix_rate: z.number().min(0).max(1),
      pattern_recurrence: z.number().int().min(0),
    })
    .nullable()
    .optional(),
});
export type RetroRecordType = z.infer<typeof RetroRecord>;
