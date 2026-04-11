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

// Extract metric rows via simple line match + pipe split. Complex full-row
// regexes trip SonarCloud S5852; pipe-split is cheaper and equally precise
// for this fixed table shape.
//
// Returns { value, signal } or null if the row is missing / unparseable.
function parseViolationsPerPr(content) {
  const lineMatch = content.match(/Violations per PR[^\n]*/);
  if (!lineMatch) return null;
  const cells = lineMatch[0].split("|").map((c) => c.trim());
  // cells shape: ["Violations per PR (30-day)", "X.XX", "signal", ...]
  if (cells.length < 3) return null;
  const parsed = Number.parseFloat(cells[1]);
  if (Number.isNaN(parsed)) return null;
  return { value: parsed, signal: cells[2] || null };
}

// "Recurring categories" row: pull the percent value from within parens.
// Returns a number or null.
function parseRecurrenceRate(content) {
  const lineMatch = content.match(/Recurring categories[^\n]*/);
  if (!lineMatch) return null;
  const percentMatch = lineMatch[0].match(/\(([\d.]+)%\)/);
  if (!percentMatch) return null;
  const parsed = Number.parseFloat(percentMatch[1]);
  return Number.isNaN(parsed) ? null : parsed;
}

function scoreViolationsPerPr(parsed) {
  if (!parsed || parsed.signal === "insufficient_data") return null;
  return {
    value: parsed.value,
    ...scoreMetric(parsed.value, BENCHMARKS.violations_per_pr),
    benchmark: BENCHMARKS.violations_per_pr,
  };
}

function scoreRecurrenceRate(value) {
  if (value === null) return null;
  return {
    value,
    ...scoreMetric(value, BENCHMARKS.recurrence_rate),
    benchmark: BENCHMARKS.recurrence_rate,
  };
}

function checkLearningEffectiveness() {
  const metricsPath = path.join(ROOT_DIR, "docs", "LEARNING_METRICS.md");
  let content;
  try {
    content = fs.readFileSync(metricsPath, "utf8");
  } catch {
    return { metrics: {}, no_data: true };
  }

  const metrics = {};
  const vpr = scoreViolationsPerPr(parseViolationsPerPr(content));
  if (vpr) metrics.violations_per_pr = vpr;

  const rec = scoreRecurrenceRate(parseRecurrenceRate(content));
  if (rec) metrics.recurrence_rate = rec;

  const hasData = Object.keys(metrics).length > 0;
  return { metrics, no_data: !hasData };
}

module.exports = { checkLearningEffectiveness };
