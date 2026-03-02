#!/usr/bin/env node
/* eslint-disable no-undef, @typescript-eslint/no-require-imports */

/**
 * Ecosystem Health Dashboard Orchestrator
 *
 * Runs health checks, persists scores, computes trends, and outputs
 * a rich markdown dashboard to stdout.
 *
 * Usage:
 *   node .claude/skills/ecosystem-health/scripts/run-ecosystem-health.js
 *   node .claude/skills/ecosystem-health/scripts/run-ecosystem-health.js --quick
 */

"use strict";

const { execFileSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const ROOT = path.join(__dirname, "..", "..", "..", "..");
const HEALTH_LOG_PATH = path.join(ROOT, "data", "ecosystem-v2", "ecosystem-health-log.jsonl");
const WARNINGS_PATH = path.join(ROOT, "data", "ecosystem-v2", "warnings.jsonl");

// Import safe-fs for symlink-guarded writes
let safeAppendFileSync;
try {
  ({ safeAppendFileSync } = require(path.join(ROOT, "scripts", "lib", "safe-fs.js")));
} catch {
  // safe-fs unavailable -- this should not happen in practice
  safeAppendFileSync = null;
}

/**
 * Run health checks and return parsed JSON result.
 * @param {boolean} quick - Use quick mode
 * @returns {object}
 */
function runHealthCheck(quick) {
  const args = ["--json"];
  if (quick) args.unshift("--quick");

  const result = execFileSync(
    process.execPath,
    [path.join(ROOT, "scripts", "health", "run-health-check.js"), ...args],
    { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], cwd: ROOT }
  );

  return JSON.parse(result);
}

/**
 * Read all entries from a JSONL file. Returns empty array on error.
 * @param {string} filePath
 * @returns {Array}
 */
function readJsonlEntries(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8").trim();
    if (!content) return [];
    return content
      .split("\n")
      .map((line) => {
        if (!line) return null;
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Append a health score entry to the log file.
 * @param {object} result - Health check result
 * @param {string} mode - "quick" or "full"
 * @returns {object} The appended record
 */
function appendHealthScore(result, mode) {
  const entries = readJsonlEntries(HEALTH_LOG_PATH);
  const previous = entries.length > 0 ? entries[entries.length - 1] : null;

  // Compute delta
  const delta = {
    previous_score: previous ? previous.score : null,
    change: previous ? result.score - previous.score : null,
    trend: null,
  };

  if (delta.change !== null) {
    if (Math.abs(delta.change) < 3) delta.trend = "stable";
    else if (delta.change > 0) delta.trend = "improving";
    else delta.trend = "degrading";
  }

  // Count severity from dimension scores
  const summary = { errors: 0, warnings: 0, info: 0 };
  if (result.dimensionScores) {
    for (const dim of Object.values(result.dimensionScores)) {
      if (dim.no_data) continue;
      if (dim.score < 60) summary.errors++;
      else if (dim.score < 80) summary.warnings++;
      else summary.info++;
    }
  }

  const record = {
    timestamp: result.timestamp || new Date().toISOString(),
    mode: mode,
    score: result.score,
    grade: result.grade,
    categoryScores: result.categoryScores,
    dimensionScores: result.dimensionScores,
    summary,
    delta,
  };

  // Ensure directory exists
  fs.mkdirSync(path.dirname(HEALTH_LOG_PATH), { recursive: true });

  if (!safeAppendFileSync) {
    throw new Error("safe-fs unavailable -- cannot write health log safely");
  }
  safeAppendFileSync(HEALTH_LOG_PATH, JSON.stringify(record) + "\n");
  return record;
}

/**
 * Read active warnings from warnings.jsonl.
 * @returns {Array}
 */
function readActiveWarnings() {
  const entries = readJsonlEntries(WARNINGS_PATH);
  return entries.filter((w) => w.lifecycle === "new" || w.lifecycle === "acknowledged");
}

/**
 * Compute trend sparkline from historical scores.
 * @param {Array} entries
 * @returns {{ direction: string, delta: number, sparkline: string }|null}
 */
function computeTrend(entries) {
  if (!entries || entries.length < 2) return null;

  const values = entries.slice(-5).map((e) => e.score);
  if (values.length < 2) return null;

  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const delta = last - first;
  const deltaPercent = first !== 0 ? Math.round((delta / first) * 100) : 0;

  let direction;
  if (Math.abs(deltaPercent) < 5) direction = "stable";
  else if (delta > 0) direction = "improving";
  else direction = "degrading";

  // Sparkline characters
  const chars = "\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const spark = values.map((v) => chars[Math.min(7, Math.floor(((v - min) / range) * 7))]).join("");

  return { direction, delta, deltaPercent, sparkline: spark };
}

/**
 * Format the dashboard output as markdown.
 */
function formatDashboard(result, record, trend, activeWarnings) {
  const lines = [];

  // Header
  lines.push("# Ecosystem Health Dashboard");
  const trendSpark = trend ? ` ${trend.sparkline}` : "";
  lines.push(`**Composite Score: ${result.grade} (${result.score}/100)**${trendSpark}`);
  lines.push("");

  // Summary
  lines.push(
    `${record.summary.errors} errors | ${record.summary.warnings} warnings | ${record.summary.info} info`
  );
  lines.push("");

  // Category Scores
  lines.push("## Category Scores");
  lines.push("| Category | Grade | Score |");
  lines.push("|----------|-------|-------|");

  const sortedCats = Object.entries(result.categoryScores).sort(
    ([, a], [, b]) => (b.score ?? 0) - (a.score ?? 0)
  );

  for (const [cat, data] of sortedCats) {
    const noData = data.no_data ? " (no data)" : "";
    const scoreStr = data.no_data ? "--" : String(data.score);
    lines.push(`| ${cat} | ${data.grade || "-"} | ${scoreStr}${noData} |`);
  }
  lines.push("");

  // Dimensions Needing Attention (score < 70)
  const problemDims = Object.entries(result.dimensionScores || {})
    .filter(([, d]) => !d.no_data && d.score < 70)
    .sort(([, a], [, b]) => a.score - b.score);

  if (problemDims.length > 0) {
    lines.push("## Dimensions Needing Attention");
    for (const [dimId, data] of problemDims) {
      lines.push(`- **${dimId}** (${data.grade}/${data.score})`);
    }
    lines.push("");
  }

  // Active Warnings
  if (activeWarnings.length > 0) {
    lines.push("## Active Warnings");
    for (const w of activeWarnings) {
      const badge = w.lifecycle === "new" ? "[new]" : "[acknowledged]";
      lines.push(`- ${badge} ${w.message} (${w.severity})`);
    }
    lines.push("");
  }

  // Trend
  if (trend) {
    const sign = trend.delta >= 0 ? "+" : "";
    lines.push("## Trend");
    if (record.delta.previous_score !== null) {
      lines.push(
        `Previous: ${record.delta.previous_score} -> Current: ${result.score} [${sign}${trend.delta}, ${trend.direction}]`
      );
    }
    lines.push(`Last runs: ${trend.sparkline}`);
    lines.push("");
  }

  return lines.join("\n");
}

// Main
function main() {
  const args = process.argv.slice(2);
  const isQuick = args.includes("--quick");
  const mode = isQuick ? "quick" : "full";

  // Step 1: Run health checks
  const result = runHealthCheck(isQuick);

  // Step 2: Persist score
  const record = appendHealthScore(result, mode);

  // Step 3: Read history for trend
  const allEntries = readJsonlEntries(HEALTH_LOG_PATH);
  const trend = computeTrend(allEntries);

  // Step 4: Read active warnings
  const activeWarnings = readActiveWarnings();

  // Step 5: Format and output dashboard
  const dashboard = formatDashboard(result, record, trend, activeWarnings);
  console.log(dashboard);
}

main();
