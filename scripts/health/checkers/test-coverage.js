/* eslint-disable no-undef */

/**
 * Test Coverage Health Checker
 *
 * Metrics: pass_rate, failed_count, error_count, staleness_days
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { scoreMetric } = require("../lib/scoring");
const { ROOT_DIR, safeParse, safeReadLines } = require("../lib/utils");

const BENCHMARKS = {
  pass_rate: { good: 98, average: 90, poor: 80 },
  failed_count: { good: 0, average: 2, poor: 5 },
  error_count: { good: 0, average: 1, poor: 3 },
  staleness_days: { good: 1, average: 3, poor: 7 },
};

function checkTestCoverage() {
  const metrics = {};

  const resultsDir = path.join(ROOT_DIR, ".claude", "test-results");
  let files;
  try {
    files = fs
      .readdirSync(resultsDir)
      .filter((f) => f.endsWith(".jsonl"))
      .sort()
      .reverse();
  } catch {
    return { metrics: {}, no_data: true };
  }

  if (files.length === 0) return { metrics: {}, no_data: true };

  // Path containment check (Review #33-#40): ensure filename doesn't escape resultsDir
  const latestFile = files[0];
  const resolved = path.join(resultsDir, latestFile);
  const rel = path.relative(resultsDir, resolved);
  if (/^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
    return { metrics: {}, no_data: true };
  }
  const lines = safeReadLines(resolved);
  if (lines.length === 0) return { metrics: {}, no_data: true };

  const results = lines.map((l) => safeParse(l)).filter(Boolean);
  if (results.length === 0) return { metrics: {}, no_data: true };

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const errored = results.filter((r) => r.status === "error").length;
  const total = results.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  metrics.pass_rate = {
    value: passRate,
    ...scoreMetric(passRate, BENCHMARKS.pass_rate, "higher-is-better"),
    benchmark: BENCHMARKS.pass_rate,
  };

  metrics.failed_count = {
    value: failed,
    ...scoreMetric(failed, BENCHMARKS.failed_count),
    benchmark: BENCHMARKS.failed_count,
  };

  metrics.error_count = {
    value: errored,
    ...scoreMetric(errored, BENCHMARKS.error_count),
    benchmark: BENCHMARKS.error_count,
  };

  // Staleness
  const validDates = results.map((r) => new Date(r.timestamp)).filter((d) => !isNaN(d.getTime()));
  const latest =
    validDates.length > 0
      ? validDates.reduce((max, d) => (d > max ? d : max), validDates[0])
      : null;
  const ageDays = latest ? Math.floor((Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24)) : 30;

  metrics.staleness_days = {
    value: ageDays,
    ...scoreMetric(ageDays, BENCHMARKS.staleness_days),
    benchmark: BENCHMARKS.staleness_days,
  };

  return { metrics, no_data: false };
}

module.exports = { checkTestCoverage };
