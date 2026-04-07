/**
 * Learning Effectiveness Health Checker
 *
 * Metrics: violations_per_pr, recurrence_rate
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { scoreMetric } = require("../lib/scoring");
const { ROOT_DIR } = require("../lib/utils");

const BENCHMARKS = {
  violations_per_pr: { good: 1, average: 3, poor: 5 },
  recurrence_rate: { good: 20, average: 40, poor: 60 },
};

function checkLearningEffectiveness() {
  const metrics = {};

  const metricsPath = path.join(ROOT_DIR, "docs", "LEARNING_METRICS.md");
  let content;
  try {
    content = fs.readFileSync(metricsPath, "utf8");
  } catch {
    return { metrics: {}, no_data: true };
  }

  // Match new MVM format: "| Violations per PR (30-day) | X.XX | signal |"
  const vprMatch = content.match(/Violations per PR\s*\([^)]+\)\s*\|\s*([\d.]+)\s*\|\s*(\S+)/);
  // Match: "| Recurring categories | N/M (XX.X%) | signal |"
  const recMatch = content.match(
    /Recurring categories\s*\|\s*\d+\/\d+\s*\(([\d.]+)%\)\s*\|\s*(\S+)/
  );

  const violationsPerPr = vprMatch ? Number.parseFloat(vprMatch[1]) : null;
  const vprSignal = vprMatch ? vprMatch[2] : null;
  const recurrenceRate = recMatch ? Number.parseFloat(recMatch[1]) : null;

  if (violationsPerPr !== null && vprSignal !== "insufficient_data") {
    metrics.violations_per_pr = {
      value: violationsPerPr,
      ...scoreMetric(violationsPerPr, BENCHMARKS.violations_per_pr),
      benchmark: BENCHMARKS.violations_per_pr,
    };
  }

  if (recurrenceRate !== null) {
    metrics.recurrence_rate = {
      value: recurrenceRate,
      ...scoreMetric(recurrenceRate, BENCHMARKS.recurrence_rate),
      benchmark: BENCHMARKS.recurrence_rate,
    };
  }

  const hasData = Object.keys(metrics).length > 0;
  return { metrics, no_data: !hasData };
}

module.exports = { checkLearningEffectiveness };
