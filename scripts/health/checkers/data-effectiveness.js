/**
 * Data Effectiveness Health Checker
 *
 * Metrics: avg_lifecycle_score, below_threshold_pct, recall_coverage, action_coverage, orphan_count
 */

"use strict";

const path = require("node:path");
const { scoreMetric } = require("../lib/scoring");
const { ROOT_DIR, safeReadLines, safeParse } = require("../lib/utils");

const BENCHMARKS = {
  avg_lifecycle_score: { good: 9, average: 7, poor: 5 },
  below_threshold_pct: { good: 0, average: 15, poor: 30 },
  recall_coverage: { good: 90, average: 70, poor: 50 },
  action_coverage: { good: 50, average: 30, poor: 15 },
  orphan_count: { good: 0, average: 2, poor: 5 },
};

function checkDataEffectiveness() {
  const metrics = {};

  const scoresPath = path.join(ROOT_DIR, ".claude", "state", "lifecycle-scores.jsonl");
  const lines = safeReadLines(scoresPath);

  if (lines.length === 0) {
    return { metrics: {}, no_data: true };
  }

  const systems = [];
  for (const line of lines) {
    const parsed = safeParse(line);
    if (parsed && Number.isFinite(parsed.total)) {
      systems.push(parsed);
    }
  }

  if (systems.length === 0) {
    return { metrics: {}, no_data: true };
  }

  // avg_lifecycle_score: average total across all systems
  const totalSum = systems.reduce((sum, s) => sum + s.total, 0);
  const avgLifecycleScore = totalSum / systems.length;

  metrics.avg_lifecycle_score = {
    value: Math.round(avgLifecycleScore * 100) / 100,
    ...scoreMetric(avgLifecycleScore, BENCHMARKS.avg_lifecycle_score, "higher-is-better"),
    benchmark: BENCHMARKS.avg_lifecycle_score,
  };

  // below_threshold_pct: percentage of systems with total < 6
  const belowCount = systems.filter((s) => s.total < 6).length;
  const belowPct = (belowCount / systems.length) * 100;

  metrics.below_threshold_pct = {
    value: Math.round(belowPct * 100) / 100,
    ...scoreMetric(belowPct, BENCHMARKS.below_threshold_pct, "lower-is-better"),
    benchmark: BENCHMARKS.below_threshold_pct,
  };

  // recall_coverage: percentage of systems with recall >= 2
  const recallCount = systems.filter((s) => typeof s.recall === "number" && s.recall >= 2).length;
  const recallPct = (recallCount / systems.length) * 100;

  metrics.recall_coverage = {
    value: Math.round(recallPct * 100) / 100,
    ...scoreMetric(recallPct, BENCHMARKS.recall_coverage, "higher-is-better"),
    benchmark: BENCHMARKS.recall_coverage,
  };

  // action_coverage: percentage of systems with action >= 2
  const actionCount = systems.filter((s) => typeof s.action === "number" && s.action >= 2).length;
  const actionPct = (actionCount / systems.length) * 100;

  metrics.action_coverage = {
    value: Math.round(actionPct * 100) / 100,
    ...scoreMetric(actionPct, BENCHMARKS.action_coverage, "higher-is-better"),
    benchmark: BENCHMARKS.action_coverage,
  };

  // orphan_count: count of systems with recall=0
  const orphanCount = systems.filter((s) => typeof s.recall === "number" && s.recall === 0).length;

  metrics.orphan_count = {
    value: orphanCount,
    ...scoreMetric(orphanCount, BENCHMARKS.orphan_count, "lower-is-better"),
    benchmark: BENCHMARKS.orphan_count,
  };

  return { metrics };
}

module.exports = { checkDataEffectiveness };
