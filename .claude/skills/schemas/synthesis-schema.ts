/**
 * Zod schema for synthesis.json (unified: schema_version key, not version).
 * Applies to both repo-synthesis and website-synthesis output.
 */
import { z } from "zod";

const signal = z
  .object({
    type: z.enum(["convergence", "divergence", "gap", "trend"]),
    title: z.string(),
    description: z.string(),
    confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
    sources: z.array(z.string()).optional(),
  })
  .passthrough();

export const synthesisSchema = z
  .object({
    schema_version: z.string(), // canonical — not "version"
    synthesized_at: z.string(),
    skill: z.string().optional(),
    source_count: z.number().optional(),
    paradigm_output: z.record(z.string(), z.unknown()).optional(),
    signals: z
      .object({
        convergence: z.array(signal).optional(),
        divergence: z.array(signal).optional(),
        gaps: z.array(signal).optional(),
        trends: z.array(signal).optional(),
      })
      .optional(),
  })
  .passthrough();

export type Synthesis = z.infer<typeof synthesisSchema>;
