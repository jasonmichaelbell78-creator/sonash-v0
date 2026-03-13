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
    if (err && err.killed) {
      return { passed: false, reason: `test timed out after ${TEST_TIMEOUT_MS}ms` };
    }
    const code = err && typeof err.status === "number" ? err.status : "unknown";
    return { passed: false, reason: `test exit code ${code}` };
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

  let testResult = null;
  let metricsResult = null;

  // Run test if available
  if (hasTest) {
    testResult = runEnforcementTest(entry.enforcement_test);
  }

  // Evaluate metrics if available
  if (hasMetrics) {
    metricsResult = evaluateMetrics(entry.metrics);
  }

  // Decision logic:
  // - Test passes AND metrics improved → verified
  // - Test passes AND no metrics → verified (test alone is sufficient)
  // - No test AND metrics improved → verified (metrics alone is sufficient)
  // - Test fails → failed (regardless of metrics)
  // - Metrics not improved AND no test → failed

  if (testResult && !testResult.passed) {
    const reason = testResult.reason;
    return { result: "failed", reason };
  }

  if (testResult && testResult.passed) {
    if (metricsResult && !metricsResult.improved) {
      return {
        result: "failed",
        reason: `test passed but ${metricsResult.reason}`,
      };
    }
    const metricsInfo = metricsResult ? `, ${metricsResult.reason}` : "";
    return { result: "verified", reason: `${testResult.reason}${metricsInfo}` };
  }

  // No test, only metrics
  if (metricsResult && metricsResult.improved) {
    return { result: "verified", reason: metricsResult.reason };
  }

  if (metricsResult) {
    return { result: "failed", reason: metricsResult.reason };
  }

  return { result: "skipped", reason: "no verification data available" };
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

  // Check if file exists
  let fileExists = false;
  try {
    fs.accessSync(routesPath, fs.constants.R_OK);
    fileExists = true;
  } catch {
    // File doesn't exist
  }

  if (!fileExists) {
    const msg = "No learning-routes.jsonl found";
    if (json) {
      const output = {
        timestamp: new Date().toISOString(),
        total_checked: 0,
        verified: 0,
        failed: 0,
        skipped: 0,
        details: [],
        message: msg,
      };
      process.stdout.write(JSON.stringify(output, null, 2) + "\n");
    } else {
      process.stdout.write(`${msg}\n`);
    }
    return {
      total_checked: 0,
      verified: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };
  }

  // Read all entries
  const allEntries = readEntries(routesPath);

  if (allEntries.length === 0) {
    const msg = "learning-routes.jsonl is empty — 0 entries to verify";
    if (json) {
      const output = {
        timestamp: new Date().toISOString(),
        total_checked: 0,
        verified: 0,
        failed: 0,
        skipped: 0,
        details: [],
        message: msg,
      };
      process.stdout.write(JSON.stringify(output, null, 2) + "\n");
    } else {
      process.stdout.write(`${msg}\n`);
    }
    return {
      total_checked: 0,
      verified: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };
  }

  // Filter enforced entries
  const enforcedIndices = [];
  for (let i = 0; i < allEntries.length; i++) {
    if (allEntries[i].status === "enforced") {
      enforcedIndices.push(i);
    }
  }

  if (enforcedIndices.length === 0) {
    const msg = `learning-routes.jsonl has ${allEntries.length} entries, 0 with status "enforced" — nothing to verify`;
    if (json) {
      const output = {
        timestamp: new Date().toISOString(),
        total_checked: 0,
        verified: 0,
        failed: 0,
        skipped: 0,
        details: [],
        message: msg,
      };
      process.stdout.write(JSON.stringify(output, null, 2) + "\n");
    } else {
      process.stdout.write(`${msg}\n`);
    }
    return {
      total_checked: 0,
      verified: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };
  }

  // Verify each enforced entry
  const details = [];
  let verified = 0;
  let failed = 0;
  let skipped = 0;

  for (const idx of enforcedIndices) {
    const entry = allEntries[idx];
    const id = entry.id || `entry-${idx}`;
    const pattern = (entry.learning && entry.learning.pattern) || entry.pattern || "(unknown)";

    let verification;
    try {
      verification = verifyEntry(entry);
    } catch (err) {
      verification = {
        result: "failed",
        reason: `verification error: ${sanitizeError(err)}`,
      };
    }

    details.push({
      id,
      pattern,
      result: verification.result,
      reason: verification.reason,
    });

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

  // Write back unless dry-run
  if (!dryRun && (verified > 0 || failed > 0)) {
    try {
      writeEntries(routesPath, allEntries);
    } catch (err) {
      process.stderr.write(
        `[verify-enforcement] ERROR: failed to write updates: ${sanitizeError(err)}\n`
      );
    }
  }

  // Output
  const totalChecked = enforcedIndices.length;
  const summary = {
    timestamp: new Date().toISOString(),
    total_checked: totalChecked,
    verified,
    failed,
    skipped,
    details,
  };

  if (json) {
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
  } else {
    process.stdout.write(`\n=== Enforcement Verification ===\n`);
    process.stdout.write(`Total enforced entries checked: ${totalChecked}\n`);
    process.stdout.write(`  Verified:     ${verified}\n`);
    process.stdout.write(`  Failed:       ${failed}\n`);
    process.stdout.write(`  Skipped:      ${skipped}\n`);

    if (dryRun) {
      process.stdout.write(`  (dry-run: no file changes)\n`);
    }

    if (details.length > 0) {
      process.stdout.write(`\nDetails:\n`);
      for (const d of details) {
        const icon = d.result === "verified" ? "[OK]" : d.result === "failed" ? "[FAIL]" : "[SKIP]";
        process.stdout.write(`  ${icon} ${d.id}: ${d.pattern} — ${d.reason}\n`);
      }
    }

    process.stdout.write(`\n`);
  }

  return summary;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const json = args.includes("--json");

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
  evaluateMetrics,
  runEnforcementTest,
  readEntries,
  writeEntries,
  ROUTES_PATH,
};
