/**
 * Zod schema for findings.jsonl entries (canonical field: description, not detail).
 */
import { z } from "zod";

export const findingSchema = z
  .object({
    id: z.string(),
    severity: z.enum(["critical", "high", "medium", "low", "info"]),
    category: z.string(),
    title: z.string(),
    description: z.string(), // canonical — not "detail"
    recommendation: z.string().optional(),
  })
  .passthrough();

export type Finding = z.infer<typeof findingSchema>;
