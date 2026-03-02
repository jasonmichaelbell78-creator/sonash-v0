/**
 * Health score JSONL persistence and trend computation.
 *
 * Persists health check results to data/ecosystem-v2/ecosystem-health-log.jsonl
 * and computes trends across historical entries.
 */

import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

let isSafeToWrite, safeAppendFileSync;
try {
  ({ isSafeToWrite, safeAppendFileSync } = require("../../lib/safe-fs"));
} catch {
  // Fail-closed: refuse writes if safe-fs is unavailable
  isSafeToWrite = () => false;
  safeAppendFileSync = () => {
    throw new Error("safe-fs unavailable -- cannot write safely");
  };
}

let scoringComputeTrend;
try {
  ({ computeTrend: scoringComputeTrend } = require("./scoring"));
} catch {
  scoringComputeTrend = () => null;
}

// Walk up from __dirname to find project root
function findProjectRoot(startDir) {
  let dir = startDir;
  for (;;) {
    try {
      if (existsSync(join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition -- continue walking
    }
    const parent = dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);
const DEFAULT_LOG_PATH = join(PROJECT_ROOT, "data", "ecosystem-v2", "ecosystem-health-log.jsonl");

/**
 * Resolve log file path, using optional override or default.
 * @param {object} [opts]
 * @param {string} [opts.logPath] - Override default log path
 * @returns {string}
 */
function resolveLogPath(opts) {
  return opts?.logPath ? resolve(opts.logPath) : DEFAULT_LOG_PATH;
}

/**
 * Read all entries from the health log JSONL file.
 * Returns empty array if file doesn't exist.
 * @param {string} filePath
 * @returns {Array}
 */
function readAllEntries(filePath) {
  try {
    const content = readFileSync(filePath, "utf8").trim();
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
 * Append a health score entry to ecosystem-health-log.jsonl.
 *
 * Takes composite result from run-health-check.js, reads last entry for delta
 * computation, and appends a new Zod-validated-shape entry.
 *
 * @param {object} result - Output from run-health-check.js --json
 * @param {string} mode - "quick" or "full"
 * @param {object} [opts]
 * @param {string} [opts.logPath] - Override default log path
 * @returns {object} The appended record
 */
/**
 * Compute delta between current score and previous entry.
 * @param {number} currentScore
 * @param {object|null} previous
 * @returns {object}
 */
function computeDelta(currentScore, previous) {
  if (!previous) {
    return { previous_score: null, change: null, trend: null };
  }
  const change = currentScore - previous.score;
  let trend;
  if (Math.abs(change) < 3) trend = "stable";
  else if (change > 0) trend = "improving";
  else trend = "degrading";
  return { previous_score: previous.score, change, trend };
}

/**
 * Summarize dimension scores into error/warning/info counts.
 * @param {object} dimensionScores
 * @returns {{ errors: number, warnings: number, info: number }}
 */
function summarizeDimensions(dimensionScores) {
  const summary = { errors: 0, warnings: 0, info: 0 };
  if (!dimensionScores) return summary;

  for (const dim of Object.values(dimensionScores)) {
    if (dim.no_data) continue;
    if (dim.score < 60) summary.errors++;
    else if (dim.score < 80) summary.warnings++;
    else summary.info++;
  }

  return summary;
}

export function appendHealthScore(result, mode, opts) {
  const filePath = resolveLogPath(opts);
  const absPath = resolve(filePath);

  if (!isSafeToWrite(absPath)) {
    throw new Error(`Refusing to write to unsafe path: ${filePath}`);
  }

  // Read previous entries for delta computation
  const entries = readAllEntries(filePath);
  const previous = entries.length > 0 ? entries[entries.length - 1] : null;

  const delta = computeDelta(result.score, previous);
  const summary = summarizeDimensions(result.dimensionScores);

  const record = {
    timestamp: result.timestamp || new Date().toISOString(),
    mode: mode || result.mode || "full",
    score: result.score,
    grade: result.grade,
    categoryScores: result.categoryScores,
    dimensionScores: result.dimensionScores,
    summary,
    delta,
  };

  // Ensure directory exists
  mkdirSync(dirname(absPath), { recursive: true });

  // Append as JSONL
  safeAppendFileSync(absPath, JSON.stringify(record) + "\n");

  return record;
}

/**
 * Read last N entries from ecosystem-health-log.jsonl.
 *
 * @param {number} [n=5] - Number of entries to return
 * @param {object} [opts]
 * @param {string} [opts.logPath] - Override default log path
 * @returns {Array} Last N entries (oldest first)
 */
export function getLatestScores(opts, n = 5) {
  const filePath = resolveLogPath(opts);
  const entries = readAllEntries(filePath);
  return entries.slice(-n);
}

/**
 * Compute trend from an array of score entries.
 *
 * @param {Array} scores - Array of health score entries (oldest first)
 * @returns {{ direction: string, delta: number, deltaPercent: number, sparkline: string }|null}
 */
export function computeTrend(scores) {
  if (!scores || scores.length < 2) return null;

  const values = scores.map((s) => s.score);
  const trend = scoringComputeTrend(values);

  if (!trend) return null;

  // Map "declining" to "degrading" for consistency with the plan's terminology
  return {
    direction: trend.direction === "declining" ? "degrading" : trend.direction,
    delta: trend.delta,
    deltaPercent: trend.deltaPercent,
    sparkline: trend.sparkline,
  };
}

// CLI entry: node scripts/health/lib/health-log.js --append < json
const _argv1 = process.argv[1] || "";
if (
  _argv1 &&
  (import.meta.url === `file:///${_argv1.replace(/\\/g, "/")}` ||
    resolve(_argv1) === resolve(__filename))
) {
  const args = process.argv.slice(2);
  if (args.includes("--append")) {
    // Read JSON from stdin
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
    });
    process.stdin.on("end", () => {
      try {
        const result = JSON.parse(input);
        const record = appendHealthScore(result, result.mode || "full");
        console.log(JSON.stringify(record));
      } catch (err) {
        console.error(
          "Failed to append health score:",
          err instanceof Error ? err.message : String(err)
        );
        process.exit(1);
      }
    });
  } else {
    console.error("Usage: node health-log.js --append < result.json");
    process.exit(1);
  }
}
