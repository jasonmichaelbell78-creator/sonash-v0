import { z } from "zod";

/**
 * Three-tier completeness model for all JSONL records.
 * - full: all fields populated
 * - partial: required fields + some optional
 * - stub: minimal required fields only
 */
export const CompletenessTier = z.enum(["full", "partial", "stub"]);
export type CompletenessTierType = z.infer<typeof CompletenessTier>;

/**
 * Structured origin tracking — never a plain string.
 * Records where data came from and under what context.
 */
export const Origin = z.object({
  type: z.enum(["pr-review", "pr-retro", "backfill", "migration", "manual"]),
  pr: z.number().int().positive().optional(),
  round: z.number().int().positive().optional(),
  session: z.string().optional(),
  tool: z.string().optional(),
});
export type OriginType = z.infer<typeof Origin>;

/**
 * Base record shared by all 5 JSONL file types.
 * Every entity schema extends this via BaseRecord.extend().
 */
export const BaseRecord = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  schema_version: z.number().int().positive(),
  completeness: CompletenessTier,
  completeness_missing: z.array(z.string()).default([]),
  origin: Origin,
});
export type BaseRecordType = z.infer<typeof BaseRecord>;
