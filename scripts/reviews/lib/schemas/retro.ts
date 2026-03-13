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
  action_items: z
    .array(
      z.object({
        title: z.string(),
        status: z.enum(["implemented", "deferred", "blocked", "rejected"]),
        verify_cmd: z.string().nullable().optional(),
        implemented_in: z.string().nullable().optional(), // commit hash or "this-session"
        severity: z.enum(["critical", "high", "medium", "low"]).optional(),
      })
    )
    .nullable()
    .optional(),
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
