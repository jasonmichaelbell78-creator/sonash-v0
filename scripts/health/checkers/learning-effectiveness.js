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

  // Extract metric rows via simple line match + pipe split. Complex full-row
  // regexes trip SonarCloud S5852; pipe-split is cheaper and equally precise
  // for this fixed table shape.
  const vprLineMatch = content.match(/Violations per PR[^\n]*/);
  let violationsPerPr = null;
  let vprSignal = null;
  if (vprLineMatch) {
    const cells = vprLineMatch[0].split("|").map((c) => c.trim());
    // cells shape: ["Violations per PR (30-day)", "X.XX", "signal", ...]
    if (cells.length >= 3) {
      const parsedVpr = Number.parseFloat(cells[1]);
      if (!Number.isNaN(parsedVpr)) violationsPerPr = parsedVpr;
      vprSignal = cells[2] || null;
    }
  }

  // "Recurring categories" row: pull the percent value from within parens.
  const recLineMatch = content.match(/Recurring categories[^\n]*/);
  let recurrenceRate = null;
  if (recLineMatch) {
    const percentMatch = recLineMatch[0].match(/\(([\d.]+)%\)/);
    if (percentMatch) {
      const parsedRate = Number.parseFloat(percentMatch[1]);
      if (!Number.isNaN(parsedRate)) recurrenceRate = parsedRate;
    }
  }

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
