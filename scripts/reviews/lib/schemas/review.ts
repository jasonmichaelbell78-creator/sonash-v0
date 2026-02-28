import { z } from "zod";
import { BaseRecord } from "./shared";

/**
 * Review record schema — tracks PR review findings and metrics.
 * Extends BaseRecord with review-specific fields.
 */
export const ReviewRecord = BaseRecord.extend({
  title: z.string().nullable().optional(),
  pr: z.number().int().positive().nullable().optional(),
  source: z.string().nullable().optional(),
  total: z.number().int().min(0).nullable().optional(),
  fixed: z.number().int().min(0).nullable().optional(),
  deferred: z.number().int().min(0).nullable().optional(),
  rejected: z.number().int().min(0).nullable().optional(),
  patterns: z.array(z.string()).nullable().optional(),
  learnings: z.array(z.string()).nullable().optional(),
  severity_breakdown: z
    .object({
      critical: z.number().int().min(0),
      major: z.number().int().min(0),
      minor: z.number().int().min(0),
      trivial: z.number().int().min(0),
    })
    .nullable()
    .optional(),
  per_round_detail: z.array(z.unknown()).nullable().optional(),
  rejection_analysis: z.array(z.unknown()).nullable().optional(),
  ping_pong_chains: z.array(z.unknown()).nullable().optional(),
});
export type ReviewRecordType = z.infer<typeof ReviewRecord>;
