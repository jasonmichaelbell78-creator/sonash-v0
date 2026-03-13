#!/usr/bin/env node
/* global __dirname */
/**
 * verify-enforcement.js — Enforcement verification framework
 * Part of Data Effectiveness Audit (Wave 2.3)
 *
 * Reads learning-routes.jsonl, runs verification tests for entries
 * with status "enforced", and updates status to "verified" or flags
 * for repair.
 *
 * Usage:
 *   node scripts/verify-enforcement.js           # Verify all enforced entries
 *   node scripts/verify-enforcement.js --dry-run  # Report without updating
 *   node scripts/verify-enforcement.js --json     # JSON output for health checkers
 *
 * Exit codes: 0 = success (even if some entries fail verification)
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const ROUTES_PATH = path.join(ROOT, ".claude", "state", "learning-routes.jsonl");

// ---------------------------------------------------------------------------
// Import safe-fs helpers (with fallback)
// ---------------------------------------------------------------------------
let safeWriteFileSync, withLock, isSafeToWrite;
try {
  ({ safeWriteFileSync, withLock, isSafeToWrite } = require(
    path.join(ROOT, "scripts", "lib", "safe-fs.js")
  ));
} catch {
  // Fallback: use raw fs (for environments where safe-fs is unavailable)
  safeWriteFileSync = (filePath, data, options) => fs.writeFileSync(filePath, data, options);
  withLock = (_filePath, fn) => fn();
  isSafeToWrite = () => true;
}

// ---------------------------------------------------------------------------
// Import sanitize helpers (with fallback)
// ---------------------------------------------------------------------------
let sanitizeError;
try {
  ({ sanitizeError } = require(path.join(ROOT, "scripts", "lib", "security-helpers.js")));
} catch {
  // Fallback: basic sanitization
  sanitizeError = (err) => {
    const msg = err instanceof Error ? err.message : String(err);
    return msg
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]")
      .replace(/\/Users\/[^/\s]+/gi, "[HOME]");
  };
}

// ---------------------------------------------------------------------------
// Import readJsonl (with fallback)
// ---------------------------------------------------------------------------
let readJsonl;
try {
  readJsonl = require(path.join(ROOT, "scripts", "lib", "read-jsonl.js"));
} catch {
  // Fallback: inline JSONL reader
  readJsonl = (filePath, options = {}) => {
    const { safe = false } = options;
    let raw;
    try {
      raw = fs.readFileSync(filePath, "utf8");
    } catch {
      if (safe) return [];
      throw new Error(`Failed to read ${path.basename(filePath)}`);
    }
    const items = [];
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        items.push(JSON.parse(trimmed));
      } catch {
        // skip malformed lines
      }
    }
    return items;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TEST_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Core verification logic
// ---------------------------------------------------------------------------

/**
 * Run an enforcement test script and return the result.
 *
 * @param {string} testPath - Absolute or project-relative path to test script
 * @returns {{ passed: boolean, reason: string }}
 */
function runEnforcementTest(testPath) {
  const absPath = path.isAbsolute(testPath) ? testPath : path.resolve(ROOT, testPath);

  // Check file exists
  try {
    fs.accessSync(absPath, fs.constants.R_OK);
  } catch {
    return { passed: false, reason: `test file not found: ${path.basename(absPath)}` };
  }

  // Execute with timeout
  try {
    execFileSync(process.execPath, [absPath], {
      timeout: TEST_TIMEOUT_MS,
      cwd: ROOT,
      stdio: "pipe",
      env: { ...process.env, NODE_ENV: "test" },
    });
    return { passed: true, reason: "test passed (exit 0)" };
  } catch (err) {
    const code = err && typeof err.code === "string" ? err.code : null;
    const signal = err && typeof err.signal === "string" ? err.signal : null;
    if (code === "ETIMEDOUT" || signal === "SIGTERM" || signal === "SIGKILL") {
      return { passed: false, reason: `test timed out after ${TEST_TIMEOUT_MS}ms` };
    }
    const status = err && typeof err.status === "number" ? err.status : "unknown";
    return { passed: false, reason: `test exit code ${status}` };
  }
}

/**
 * Evaluate violation metrics for an entry.
 *
 * @param {object} metrics - Entry metrics object
 * @returns {{ improved: boolean, perfect: boolean, reason: string }}
 */
function evaluateMetrics(metrics) {
  if (!metrics || typeof metrics !== "object") {
    return { improved: false, perfect: false, reason: "no metrics data" };
  }

  const before = metrics.violations_before;
  const after = metrics.violations_after;

  if (typeof before !== "number" || typeof after !== "number") {
    return { improved: false, perfect: false, reason: "metrics missing numeric values" };
  }

  if (after === 0) {
    return { improved: true, perfect: true, reason: `violations ${before}\u21920` };
  }

  if (after < before) {
    return { improved: true, perfect: false, reason: `violations ${before}\u2192${after}` };
  }

  if (after === before) {
    return { improved: false, perfect: false, reason: `violations unchanged at ${after}` };
  }

  // after > before
  return {
    improved: false,
    perfect: false,
    reason: `violations increased ${before}\u2192${after}`,
  };
}

/**
 * Decide verification result from test and metrics outcomes.
 *
 * Decision logic:
 * - Test fails → failed (regardless of metrics)
 * - Test passes AND metrics not improved → failed
 * - Test passes (metrics improved or absent) → verified
 * - No test AND metrics improved → verified
 * - No test AND metrics not improved → failed
 * - Neither available → skipped
 *
 * @param {object|null} testResult - Result from runEnforcementTest, or null
 * @param {object|null} metricsResult - Result from evaluateMetrics, or null
 * @returns {{ result: string, reason: string }}
 */
function decideVerification(testResult, metricsResult) {
  if (testResult && !testResult.passed) {
    return { result: "failed", reason: testResult.reason };
  }

  if (testResult?.passed) {
    if (metricsResult && !metricsResult.improved) {
      return {
        result: "failed",
        reason: `test passed but ${metricsResult.reason}`,
      };
    }
    const metricsInfo = metricsResult ? `, ${metricsResult.reason}` : "";
    return { result: "verified", reason: `${testResult.reason}${metricsInfo}` };
  }

  if (metricsResult?.improved) {
    return { result: "verified", reason: metricsResult.reason };
  }

  if (metricsResult) {
    return { result: "failed", reason: metricsResult.reason };
  }

  return { result: "skipped", reason: "no verification data available" };
}

/**
 * Verify a single enforced entry.
 *
 * @param {object} entry - A learning-routes.jsonl entry
 * @returns {{ result: string, reason: string }}
 *   result: "verified" | "failed" | "skipped"
 */
function verifyEntry(entry) {
  const hasTest = entry.enforcement_test && typeof entry.enforcement_test === "string";
  const hasMetrics = entry.metrics && typeof entry.metrics === "object";

  // No test AND no metrics — skip
  if (!hasTest && !hasMetrics) {
    return { result: "skipped", reason: "no enforcement_test or metrics" };
  }

  const testResult = hasTest ? runEnforcementTest(entry.enforcement_test) : null;
  const metricsResult = hasMetrics ? evaluateMetrics(entry.metrics) : null;

  return decideVerification(testResult, metricsResult);
}

/**
 * Read all entries from the JSONL file.
 *
 * @param {string} routesPath - Path to learning-routes.jsonl
 * @returns {object[]} Parsed entries
 */
function readEntries(routesPath) {
  try {
    return readJsonl(routesPath, { safe: true, quiet: true });
  } catch (err) {
    process.stderr.write(
      `[verify-enforcement] WARNING: could not read routes file: ${sanitizeError(err)}\n`
    );
    return [];
  }
}

/**
 * Write entries back to the JSONL file using safe-fs helpers.
 *
 * @param {string} routesPath - Path to learning-routes.jsonl
 * @param {object[]} entries - All entries (updated)
 */
function writeEntries(routesPath, entries) {
  const absPath = path.resolve(routesPath);

  if (!isSafeToWrite(absPath)) {
    throw new Error(`Refusing to write to symlinked path: ${path.basename(absPath)}`);
  }

  const content = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";

  withLock(absPath, () => {
    safeWriteFileSync(absPath, content, "utf8");
  });
}

/**
 * Build an empty summary with zero counts.
 *
 * @returns {object} Empty summary object
 */
function emptySummary() {
  return { total_checked: 0, verified: 0, failed: 0, skipped: 0, details: [] };
}

/**
 * Output an early-exit message (no entries to verify) in the requested format.
 *
 * @param {string} msg - Human-readable message
 * @param {boolean} json - Whether to output JSON format
 */
function outputEarlyExit(msg, json) {
  if (json) {
    const output = { timestamp: new Date().toISOString(), ...emptySummary(), message: msg };
    process.stdout.write(JSON.stringify(output, null, 2) + "\n");
  } else {
    process.stdout.write(`${msg}\n`);
  }
}

/**
 * Validate that the routes file exists and contains enforced entries.
 * Returns null when validation passes, or an early-exit message string
 * when there is nothing to verify.
 *
 * @param {string} routesPath - Path to learning-routes.jsonl
 * @param {object[]} allEntries - Parsed entries (populated by reference)
 * @param {number[]} enforcedIndices - Indices of enforced entries (populated by reference)
 * @returns {string|null} Early-exit message, or null if validation passes
 */
function validateInputs(routesPath, allEntries, enforcedIndices) {
  // Check if file exists
  let fileExists = false;
  try {
    fs.accessSync(routesPath, fs.constants.R_OK);
    fileExists = true;
  } catch {
    // File doesn't exist
  }

  if (!fileExists) {
    return "No learning-routes.jsonl found";
  }

  // Read all entries
  const entries = readEntries(routesPath);
  // Populate the passed-in array
  entries.forEach((e) => allEntries.push(e));

  if (allEntries.length === 0) {
    return "learning-routes.jsonl is empty \u2014 0 entries to verify";
  }

  // Filter enforced entries
  for (let i = 0; i < allEntries.length; i++) {
    if (allEntries[i].status === "enforced") {
      enforcedIndices.push(i);
    }
  }

  if (enforcedIndices.length === 0) {
    return `learning-routes.jsonl has ${allEntries.length} entries, 0 with status "enforced" \u2014 nothing to verify`;
  }

  return null;
}

/**
 * Run verification on all enforced entries and apply status updates.
 *
 * @param {object[]} allEntries - All parsed JSONL entries
 * @param {number[]} enforcedIndices - Indices of entries with status "enforced"
 * @returns {{ details: object[], verified: number, failed: number, skipped: number }}
 */
function scanEntries(allEntries, enforcedIndices) {
  const details = [];
  let verified = 0;
  let failed = 0;
  let skipped = 0;

  for (const idx of enforcedIndices) {
    const entry = allEntries[idx];
    const id = entry.id || `entry-${idx}`;
    const pattern = entry.learning?.pattern || entry.pattern || "(unknown)";

    let verification;
    try {
      verification = verifyEntry(entry);
    } catch (err) {
      verification = {
        result: "failed",
        reason: `verification error: ${sanitizeError(err)}`,
      };
    }

    details.push({ id, pattern, result: verification.result, reason: verification.reason });

    // Update status in allEntries (for later write-back)
    if (verification.result === "verified") {
      allEntries[idx] = { ...allEntries[idx], status: "verified" };
      verified++;
    } else if (verification.result === "failed") {
      // Keep status as "enforced" but add a flag
      allEntries[idx] = {
        ...allEntries[idx],
        _repair_needed: true,
        _last_verification: new Date().toISOString(),
        _failure_reason: verification.reason,
      };
      failed++;
    } else {
      skipped++;
    }
  }

  return { details, verified, failed, skipped };
}

/**
 * Format and output the verification summary.
 *
 * @param {object} summary - Full summary object with counts and details
 * @param {boolean} json - Whether to output JSON format
 * @param {boolean} dryRun - Whether this was a dry-run
 */
function outputSummary(summary, json, dryRun) {
  if (json) {
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
    return;
  }

  process.stdout.write(`\n=== Enforcement Verification ===\n`);
  process.stdout.write(`Total enforced entries checked: ${summary.total_checked}\n`);
  process.stdout.write(`  Verified:     ${summary.verified}\n`);
  process.stdout.write(`  Failed:       ${summary.failed}\n`);
  process.stdout.write(`  Skipped:      ${summary.skipped}\n`);

  if (dryRun) {
    process.stdout.write(`  (dry-run: no file changes)\n`);
  }

  if (summary.details.length > 0) {
    process.stdout.write(`\nDetails:\n`);
    for (const d of summary.details) {
      let icon;
      if (d.result === "verified") {
        icon = "[OK]";
      } else if (d.result === "failed") {
        icon = "[FAIL]";
      } else {
        icon = "[SKIP]";
      }
      process.stdout.write(`  ${icon} ${d.id}: ${d.pattern} \u2014 ${d.reason}\n`);
    }
  }

  process.stdout.write(`\n`);
}

/**
 * Main verification pipeline.
 *
 * @param {object} options
 * @param {boolean} [options.dryRun=false] - Do not modify the file
 * @param {boolean} [options.json=false] - Output JSON instead of text
 * @param {string} [options.routesPath] - Override default routes file path
 * @returns {object} Summary with counts and details
 */
function run(options = {}) {
  const { dryRun = false, json = false, routesPath = ROUTES_PATH } = options;

  // Validate inputs and collect entries
  const allEntries = [];
  const enforcedIndices = [];
  const earlyExitMsg = validateInputs(routesPath, allEntries, enforcedIndices);

  if (earlyExitMsg) {
    outputEarlyExit(earlyExitMsg, json);
    return emptySummary();
  }

  // Scan all enforced entries
  const { details, verified, failed, skipped } = scanEntries(allEntries, enforcedIndices);

  // Write back unless dry-run
  if (!dryRun && (verified > 0 || failed > 0)) {
    try {
      writeEntries(routesPath, allEntries);
    } catch (err) {
      process.stderr.write(
        `[verify-enforcement] ERROR: failed to write updates: ${sanitizeError(err)}\n`
      );
      process.exitCode = 1;
    }
  }

  // Build and output summary
  const summary = {
    timestamp: new Date().toISOString(),
    total_checked: enforcedIndices.length,
    verified,
    failed,
    skipped,
    details,
  };

  outputSummary(summary, json, dryRun);

  return summary;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const json = args.has("--json");

  try {
    run({ dryRun, json });
  } catch (err) {
    process.stderr.write(`[verify-enforcement] FATAL: ${sanitizeError(err)}\n`);
    process.exit(2);
  }
}

// Run if invoked directly
if (require.main === module) {
  main();
}

// Export for testing
module.exports = {
  run,
  verifyEntry,
  decideVerification,
  evaluateMetrics,
  runEnforcementTest,
  readEntries,
  writeEntries,
  validateInputs,
  scanEntries,
  outputSummary,
  ROUTES_PATH,
};
