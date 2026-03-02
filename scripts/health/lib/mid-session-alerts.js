/**
 * Mid-session alert system for ecosystem health degradation detection.
 *
 * Lightweight checks designed to run from post-commit hooks or on-demand.
 * Detects: aged deferred items, duplicate deferrals, and score degradation.
 * Surfaces findings through both warning lifecycle (persistent) and hook
 * warnings (immediate).
 *
 * Keeps execution under 2 seconds -- JSONL reads and date comparisons only.
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

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

// Default paths
const DEFAULT_PATHS = {
  deferredPath: join(PROJECT_ROOT, "data", "ecosystem-v2", "deferred-items.jsonl"),
  healthLogPath: join(PROJECT_ROOT, "data", "ecosystem-v2", "ecosystem-health-log.jsonl"),
  cooldownPath: join(PROJECT_ROOT, ".claude", "hooks", ".alerts-cooldown.json"),
  warningsPath: join(PROJECT_ROOT, "data", "ecosystem-v2", "warnings.jsonl"),
  appendHookWarningScript: join(PROJECT_ROOT, "scripts", "append-hook-warning.js"),
};

/**
 * Read JSONL file into array of parsed objects. Returns empty array on error.
 * @param {string} filePath
 * @returns {Array}
 */
function readJsonl(filePath) {
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
 * Read cooldown state from JSON file.
 * @param {string} cooldownPath
 * @returns {object}
 */
function readCooldown(cooldownPath) {
  try {
    return JSON.parse(readFileSync(cooldownPath, "utf8"));
  } catch {
    return {};
  }
}

/**
 * Write cooldown state. Uses safe-fs if available.
 * @param {string} cooldownPath
 * @param {object} cooldown
 */
function writeCooldown(cooldownPath, cooldown) {
  try {
    const { safeWriteFileSync } = require("../../lib/safe-fs");
    safeWriteFileSync(cooldownPath, JSON.stringify(cooldown, null, 2));
  } catch {
    // Best-effort: cooldown write failure should not block alerts
  }
}

/**
 * Check if an alert type is in cooldown (fired within the last hour).
 * @param {object} cooldown
 * @param {string} alertType
 * @returns {boolean}
 */
function isInCooldown(cooldown, alertType) {
  const lastFired = cooldown[alertType];
  if (!lastFired) return false;
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return new Date(lastFired).getTime() > oneHourAgo;
}

/**
 * Create a warning via warning-lifecycle.js.
 * @param {object} params
 * @param {object} opts
 */
function createWarningRecord(params, opts) {
  try {
    // Dynamic import of warning-lifecycle (ESM)
    // Since we're already ESM, we can import directly
    const warningsPath = opts.warningsPath || DEFAULT_PATHS.warningsPath;

    // Use appendRecord directly since createWarning from warning-lifecycle
    // uses the same underlying mechanism
    const { appendRecord } = require("../../reviews/dist/lib/write-jsonl");
    const { WarningRecord } = require("../../reviews/dist/lib/schemas/warning");

    const record = {
      id: `warn-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      schema_version: 1,
      completeness: "full",
      completeness_missing: [],
      origin: { type: "manual", tool: "mid-session-alerts" },
      category: params.category,
      message: params.message,
      severity: params.severity,
      lifecycle: "new",
      resolved_date: null,
      source_script: "mid-session-alerts",
      related_ids: params.related_ids || null,
    };

    appendRecord(warningsPath, record, WarningRecord);
  } catch {
    // Best-effort: warning creation failure should not block alerts
  }
}

/**
 * Surface an alert via append-hook-warning.js.
 * @param {string} message
 * @param {string} severity
 * @param {object} opts
 */
function surfaceHookWarning(message, severity, opts) {
  try {
    const { execFileSync } = require("node:child_process");
    const script = opts.appendHookWarningScript || DEFAULT_PATHS.appendHookWarningScript;
    execFileSync(
      process.execPath,
      [
        script,
        "--hook=mid-session",
        "--type=health",
        `--severity=${severity}`,
        `--message=${message}`,
      ],
      { stdio: "pipe", timeout: 5000 }
    );
  } catch {
    // Best-effort: hook warning failure should not block
  }
}

/**
 * Check 1: Deferred items older than 30 days.
 * @param {object} opts
 * @returns {{ type: string, message: string, severity: string }|null}
 */
function checkDeferredAging(opts) {
  const deferredPath = opts.deferredPath || DEFAULT_PATHS.deferredPath;
  const items = readJsonl(deferredPath);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const aged = items.filter((item) => {
    const isOpen = !item.lifecycle || item.lifecycle === "open" || item.lifecycle === "in-progress";
    return isOpen && item.date && item.date <= cutoffStr;
  });

  if (aged.length === 0) return null;

  return {
    type: "deferred-aging",
    message: `${aged.length} deferred item(s) older than 30 days need attention`,
    severity: "warning",
  };
}

/**
 * Check 2: Duplicate deferred items (same title+category within 7 days).
 * @param {object} opts
 * @returns {{ type: string, message: string, severity: string }|null}
 */
function checkDuplicateDeferrals(opts) {
  const deferredPath = opts.deferredPath || DEFAULT_PATHS.deferredPath;
  const items = readJsonl(deferredPath);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recent = items.filter((item) => item.date && item.date >= cutoffStr);

  // Find duplicates by title+category
  const seen = new Map();
  let duplicateCount = 0;

  for (const item of recent) {
    const key = `${(item.title || "").toLowerCase()}|${(item.category || "").toLowerCase()}`;
    if (seen.has(key)) {
      duplicateCount++;
    } else {
      seen.set(key, true);
    }
  }

  if (duplicateCount === 0) return null;

  return {
    type: "duplicate-deferrals",
    message: `${duplicateCount} duplicate deferred item(s) detected in the last 7 days`,
    severity: "warning",
  };
}

/**
 * Check 3: Score degradation (10+ point drop between last 2 entries).
 * @param {object} opts
 * @returns {{ type: string, message: string, severity: string }|null}
 */
function checkScoreDegradation(opts) {
  const healthLogPath = opts.healthLogPath || DEFAULT_PATHS.healthLogPath;
  const entries = readJsonl(healthLogPath);

  if (entries.length < 2) return null;

  const previous = entries.at(-2);
  const current = entries.at(-1);

  const drop = previous.score - current.score;

  if (drop < 10) return null;

  return {
    type: "score-degradation",
    message: `Health score dropped ${drop} points (${previous.score} -> ${current.score})`,
    severity: "error",
  };
}

/**
 * Run all mid-session checks.
 *
 * @param {object} [opts] - Optional path overrides for testing
 * @param {string} [opts.deferredPath]
 * @param {string} [opts.healthLogPath]
 * @param {string} [opts.cooldownPath]
 * @param {string} [opts.warningsPath]
 * @param {string} [opts.appendHookWarningScript]
 * @param {boolean} [opts.skipSideEffects] - Skip warning creation and hook surfacing (for tests)
 * @returns {{ alerts: Array<{ type: string, message: string, severity: string }>, skipped: number }}
 */
export function runMidSessionChecks(opts = {}) {
  const cooldownPath = opts.cooldownPath || DEFAULT_PATHS.cooldownPath;
  const cooldown = readCooldown(cooldownPath);

  const checks = [checkDeferredAging, checkDuplicateDeferrals, checkScoreDegradation];

  const alerts = [];
  let skipped = 0;

  for (const check of checks) {
    const result = check(opts);
    if (!result) continue;

    // Check cooldown
    if (isInCooldown(cooldown, result.type)) {
      skipped++;
      continue;
    }

    alerts.push(result);

    // Side effects: create warning + surface hook warning
    if (!opts.skipSideEffects) {
      createWarningRecord(
        { category: result.type, message: result.message, severity: result.severity },
        opts
      );
      surfaceHookWarning(result.message, result.severity, opts);

      // Update cooldown
      cooldown[result.type] = new Date().toISOString();
    }
  }

  // Persist cooldown
  if (alerts.length > 0 && !opts.skipSideEffects) {
    writeCooldown(cooldownPath, cooldown);
  }

  return { alerts, skipped };
}
