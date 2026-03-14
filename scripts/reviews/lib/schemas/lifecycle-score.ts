/**
 * Zod schema for lifecycle-scores.jsonl
 *
 * Part of Data Effectiveness Audit (Wave 5.1)
 * Each entry scores a data system across 4 lifecycle stages (0-3 each, 0-12 total).
 *
 * Scoring Scale:
 *   Capture: 0=none, 1=manual, 2=semi-auto, 3=fully automated
 *   Storage: 0=none, 1=unbounded/unmanaged, 2=managed/rotated, 3=schema-validated+rotated
 *   Recall:  0=none, 1=one informational consumer, 2=active workflow consumer, 3=blocking gate
 *   Action:  0=none, 1=informational surface, 2=semi-automated enforcement, 3=fully automated
 */

import { z } from "zod";
import { BaseRecord } from "./shared.js";

const ScoreValue = z.number().int().min(0).max(3);

export const LifecycleScoreRecord = BaseRecord.extend({
  system: z.string().min(1).describe("Human-readable system name"),
  category: z.enum([
    "pattern-rules",
    "review-learnings",
    "retro-findings",
    "technical-debt",
    "hook-warnings",
    "override-audit",
    "health-scores",
    "behavioral-rules",
    "security-checklist",
    "fix-templates",
    "memory",
    "session-context",
    "agent-tracking",
    "velocity-tracking",
    "commit-log",
    "learning-routes",
    "planning-data",
    "audit-findings",
    "aggregation-data",
    "ecosystem-deferred",
  ]),
  files: z.array(z.string()).min(1).describe("File paths relative to project root"),
  capture: ScoreValue,
  storage: ScoreValue,
  recall: ScoreValue,
  action: ScoreValue,
  total: z.number().int().min(0).max(12),
  gap: z.string().describe("Primary gap description"),
  remediation: z.string().nullable().describe("Planned or completed remediation"),
  wave_fixed: z.string().nullable().describe("Wave that improved this score, if any"),
}).passthrough();

export type LifecycleScoreRecord = z.infer<typeof LifecycleScoreRecord>;
