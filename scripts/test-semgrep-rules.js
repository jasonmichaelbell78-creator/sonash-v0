#!/usr/bin/env node
/* global __dirname */
/**
 * Semgrep rule test harness --- runs custom rules against test fixtures.
 * Usage: node scripts/test-semgrep-rules.js
 *
 * Tests use Semgrep's annotation convention:
 *   // ruleid: rule.name   -> line MUST trigger a finding
 *   // ok: rule.name       -> line MUST NOT trigger a finding
 *
 * Source: PR #411 retro --- no automated check that custom Semgrep rules work.
 */
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const RULES_DIR = path.join(ROOT, ".semgrep");
const TESTS_DIR = path.join(ROOT, "tests/semgrep");

if (!fs.existsSync(TESTS_DIR)) {
  console.log("No test fixtures found in tests/semgrep/ -- nothing to test.");
  process.exit(0);
}

let testFiles;
try {
  testFiles = fs
    .readdirSync(TESTS_DIR)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".js") || f.endsWith(".tsx"));
} catch (err) {
  console.error(
    `Failed to read test directory: ${err instanceof Error ? err.message : String(err)}`
  );
  process.exit(1);
}

if (testFiles.length === 0) {
  console.log("No test files found in tests/semgrep/");
  process.exit(0);
}

if (!fs.existsSync(RULES_DIR)) {
  console.log("No .semgrep/ rules directory found -- nothing to test.");
  process.exit(0);
}

console.log(`Running Semgrep rules against ${testFiles.length} test fixture(s)...`);
console.log(`  Rules: ${RULES_DIR}`);
console.log(`  Tests: ${TESTS_DIR}`);
console.log();

// Try semgrep --test mode first (native annotation checking)
try {
  const testResult = execFileSync("semgrep", ["--test", "--config", RULES_DIR, TESTS_DIR], {
    cwd: ROOT,
    maxBuffer: 10 * 1024 * 1024,
    encoding: "utf-8",
    timeout: 60000,
  });
  console.log(testResult);
  console.log("Semgrep rule test harness: PASS");
  process.exit(0);
} catch (testErr) {
  const stdout = typeof testErr.stdout === "string" ? testErr.stdout : "";
  const stderr = typeof testErr.stderr === "string" ? testErr.stderr : "";
  const combined = `${stdout}\n${stderr}`.toLowerCase();

  // Detect if --test flag itself is unsupported (vs real test failures)
  const testUnsupported =
    (combined.includes("unknown option") ||
      combined.includes("unknown flag") ||
      combined.includes("no such option")) &&
    combined.includes("--test");

  if (!testUnsupported) {
    // Real --test failure (annotation mismatch, rule error, etc.)
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.error("Semgrep rule test harness: FAIL (semgrep --test failed)");
    process.exit(1);
  }

  // --test not supported -- fall back to --json scan
  console.log("semgrep --test not available, falling back to --json scan...\n");
}

// Fallback: run semgrep scan and report findings
// NOTE: This fallback does NOT validate // ruleid: / // ok: annotations.
// It only confirms semgrep can parse and run the rules. Use semgrep --test for full validation.
try {
  const result = execFileSync(
    "semgrep",
    ["--config", RULES_DIR, "--json", "--no-git-ignore", TESTS_DIR],
    { cwd: ROOT, maxBuffer: 10 * 1024 * 1024, encoding: "utf-8", timeout: 60000 }
  );
  const parsed = JSON.parse(result);
  const errors = Array.isArray(parsed.errors) ? parsed.errors : [];
  if (errors.length > 0) {
    console.error(`Semgrep reported ${errors.length} error(s):`);
    for (const e of errors) {
      console.error(`  ${e.type || "error"}: ${e.message || JSON.stringify(e)}`);
    }
    process.exit(1);
  }
  const findings = parsed.results || [];
  console.log(`Found ${findings.length} finding(s) across ${testFiles.length} file(s):`);
  for (const f of findings) {
    console.log(`  ${f.check_id}: ${path.relative(ROOT, f.path)}:${f.start?.line}`);
  }
  console.log("\nSemgrep rule test harness: PASS (scan completed, findings reported)");
} catch (err) {
  // Semgrep exits non-zero when findings exist, which is expected for test fixtures
  if (err.stdout) {
    try {
      const parsed = JSON.parse(err.stdout);

      const errors = Array.isArray(parsed.errors) ? parsed.errors : [];
      if (errors.length > 0) {
        console.error(`Semgrep reported ${errors.length} error(s):`);
        for (const e of errors) {
          console.error(`  ${e.type || "error"}: ${e.message || JSON.stringify(e)}`);
        }
        process.exit(1);
      }

      const findings = parsed.results || [];
      console.log(`Found ${findings.length} finding(s) (expected for test fixtures):`);
      for (const f of findings) {
        console.log(`  ${f.check_id}: ${path.relative(ROOT, f.path)}:${f.start?.line}`);
      }
      console.log("\nSemgrep rule test harness: PASS (findings expected in test fixtures)");
    } catch {
      console.error("Failed to parse Semgrep output");
      if (err.stderr) console.error(err.stderr);
      process.exit(1);
    }
  } else {
    const skipIfMissing = process.argv.includes("--skip-if-missing");
    const isMissingBinary = err && typeof err === "object" && err.code === "ENOENT";

    if (isMissingBinary) {
      console.log("Semgrep not available (not installed or not in PATH).");
      console.log("Install with: pip install semgrep  OR  brew install semgrep");
      if (skipIfMissing) {
        console.log("Skipping test harness (--skip-if-missing).");
        process.exit(0);
      }
      console.error("Semgrep rule test harness: FAIL (semgrep binary not found)");
      process.exit(1);
    }

    // Other execution failure (timeout, permission, etc.)
    if (err.stderr) console.error(err.stderr);
    console.error("Semgrep rule test harness: FAIL (semgrep execution error)");
    process.exit(1);
  }
}
