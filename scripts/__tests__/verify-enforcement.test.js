/* eslint-disable no-undef */
"use strict";

/**
 * verify-enforcement.test.js — Functional tests for enforcement verification
 * Part of Data Effectiveness Audit (Wave 2.3)
 *
 * Tests execute the actual script or its exported functions and verify
 * real behavior: file contents, exit codes, data structures.
 *
 * Uses Node.js built-in test runner (node:test) and assert (node:assert/strict).
 */

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const projectRoot = path.resolve(__dirname, "..", "..");
const scriptPath = path.resolve(projectRoot, "scripts", "verify-enforcement.js");

// Import module under test
const { run, verifyEntry, evaluateMetrics, runEnforcementTest } = require(scriptPath);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a temp directory for test fixtures.
 * @returns {string} Absolute path to temp dir
 */
function makeTempDir() {
  const base = path.join(projectRoot, ".tmp");
  fs.mkdirSync(base, { recursive: true });
  return fs.mkdtempSync(path.join(base, "verify-enforcement-test-"));
}

/**
 * Clean up a temp directory recursively.
 * @param {string} dir
 */
function cleanTempDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Write a JSONL file from an array of objects.
 * @param {string} filePath
 * @param {object[]} entries
 */
function writeJsonl(filePath, entries) {
  const content = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
  fs.writeFileSync(filePath, content, "utf8");
}

/**
 * Read and parse a JSONL file back into an array.
 * @param {string} filePath
 * @returns {object[]}
 */
function parseJsonl(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch {
    return [];
  }
  const items = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      items.push(JSON.parse(trimmed));
    } catch {
      // skip
    }
  }
  return items;
}

/**
 * Create a test script that exits with a given code.
 * @param {string} dir - Directory to create script in
 * @param {string} name - Script filename
 * @param {number} exitCode - Exit code the script should return
 * @returns {string} Absolute path to the created script
 */
function createTestScript(dir, name, exitCode) {
  const scriptContent = `#!/usr/bin/env node\nprocess.exit(${exitCode});\n`;
  const scriptFile = path.join(dir, name);
  fs.writeFileSync(scriptFile, scriptContent, "utf8");
  return scriptFile;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("verify-enforcement", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    if (tempDir) cleanTempDir(tempDir);
  });

  // -----------------------------------------------------------------------
  // 1. No JSONL file — exits cleanly
  // -----------------------------------------------------------------------
  it("should exit cleanly when no learning-routes.jsonl exists", () => {
    const nonExistentPath = path.join(tempDir, "nonexistent.jsonl");

    const result = run({
      routesPath: nonExistentPath,
      dryRun: true,
    });

    assert.equal(result.total_checked, 0);
    assert.equal(result.verified, 0);
    assert.equal(result.failed, 0);
    assert.equal(result.skipped, 0);
    assert.ok(Array.isArray(result.details));
    assert.equal(result.details.length, 0);
  });

  // -----------------------------------------------------------------------
  // 2. Empty JSONL file — exits cleanly with 0 entries
  // -----------------------------------------------------------------------
  it("should exit cleanly when learning-routes.jsonl is empty", () => {
    const routesPath = path.join(tempDir, "learning-routes.jsonl");
    fs.writeFileSync(routesPath, "", "utf8");

    const result = run({ routesPath, dryRun: true });

    assert.equal(result.total_checked, 0);
    assert.equal(result.verified, 0);
    assert.equal(result.failed, 0);
    assert.equal(result.skipped, 0);
  });

  // -----------------------------------------------------------------------
  // 3. No enforced entries — entries with status "scaffolded" are skipped
  // -----------------------------------------------------------------------
  it("should skip entries that are not in enforced status", () => {
    const routesPath = path.join(tempDir, "learning-routes.jsonl");
    writeJsonl(routesPath, [
      {
        id: "lr-001",
        status: "scaffolded",
        learning: { type: "code", pattern: "raw-fs-write" },
      },
      {
        id: "lr-002",
        status: "refined",
        learning: { type: "process", pattern: "missing-review" },
      },
    ]);

    const result = run({ routesPath, dryRun: true });

    assert.equal(result.total_checked, 0);
    assert.equal(result.verified, 0);
    assert.equal(result.failed, 0);
    assert.equal(result.skipped, 0);
    assert.equal(result.details.length, 0);
  });

  // -----------------------------------------------------------------------
  // 4. Enforced entry with passing test — status changes to "verified"
  // -----------------------------------------------------------------------
  it("should verify an enforced entry when test passes", () => {
    const testScript = createTestScript(tempDir, "pass-test.js", 0);
    const routesPath = path.join(tempDir, "learning-routes.jsonl");
    writeJsonl(routesPath, [
      {
        id: "lr-010",
        status: "enforced",
        learning: { type: "code", pattern: "safe-write-enforcement" },
        enforcement_test: testScript,
        metrics: { violations_before: 20, violations_after: 0 },
      },
    ]);

    const result = run({ routesPath, dryRun: false });

    assert.equal(result.total_checked, 1);
    assert.equal(result.verified, 1);
    assert.equal(result.failed, 0);

    // Verify file was actually updated
    const entries = parseJsonl(routesPath);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].status, "verified");
    assert.equal(entries[0].id, "lr-010");
  });

  // -----------------------------------------------------------------------
  // 5. Enforced entry with failing test — stays enforced and flagged
  // -----------------------------------------------------------------------
  it("should flag an enforced entry when test fails", () => {
    const testScript = createTestScript(tempDir, "fail-test.js", 1);
    const routesPath = path.join(tempDir, "learning-routes.jsonl");
    writeJsonl(routesPath, [
      {
        id: "lr-020",
        status: "enforced",
        learning: { type: "code", pattern: "broken-lint-rule" },
        enforcement_test: testScript,
        metrics: { violations_before: 10, violations_after: 5 },
      },
    ]);

    const result = run({ routesPath, dryRun: false });

    assert.equal(result.total_checked, 1);
    assert.equal(result.failed, 1);
    assert.equal(result.verified, 0);

    // Verify file was updated with repair flag
    const entries = parseJsonl(routesPath);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].status, "enforced"); // stays enforced
    assert.equal(entries[0]._repair_needed, true);
    assert.equal(typeof entries[0]._last_verification, "string");
  });

  // -----------------------------------------------------------------------
  // 6. Enforced entry with no test path — skipped (not errored)
  // -----------------------------------------------------------------------
  it("should skip an enforced entry with no enforcement_test or metrics", () => {
    const routesPath = path.join(tempDir, "learning-routes.jsonl");
    writeJsonl(routesPath, [
      {
        id: "lr-030",
        status: "enforced",
        learning: { type: "behavioral", pattern: "ask-before-implementing" },
      },
    ]);

    const result = run({ routesPath, dryRun: true });

    assert.equal(result.total_checked, 1);
    assert.equal(result.skipped, 1);
    assert.equal(result.verified, 0);
    assert.equal(result.failed, 0);

    const detail = result.details.find((d) => d.id === "lr-030");
    assert.ok(detail, "detail for lr-030 should exist");
    assert.equal(detail.result, "skipped");
  });

  // -----------------------------------------------------------------------
  // 7. Metrics validation — violations_before=20, violations_after=0 -> verified
  // -----------------------------------------------------------------------
  it("should verify when metrics show violations dropped to zero", () => {
    const metricsResult = evaluateMetrics({
      violations_before: 20,
      violations_after: 0,
    });

    assert.equal(metricsResult.improved, true);
    assert.equal(metricsResult.perfect, true);
    assert.ok(metricsResult.reason.includes("20"), "reason should mention 20");
    assert.ok(metricsResult.reason.includes("0"), "reason should mention 0");
  });

  // -----------------------------------------------------------------------
  // 8. Metrics validation — violations_before=20, violations_after=20 -> flagged
  // -----------------------------------------------------------------------
  it("should flag when metrics show violations unchanged", () => {
    const metricsResult = evaluateMetrics({
      violations_before: 20,
      violations_after: 20,
    });

    assert.equal(metricsResult.improved, false);
    assert.equal(metricsResult.perfect, false);
    assert.ok(metricsResult.reason.includes("unchanged"), "reason should mention unchanged");
  });

  // -----------------------------------------------------------------------
  // 9. Dry run mode — file is NOT modified
  // -----------------------------------------------------------------------
  it("should not modify file in dry-run mode", () => {
    const testScript = createTestScript(tempDir, "pass-test.js", 0);
    const routesPath = path.join(tempDir, "learning-routes.jsonl");
    const entries = [
      {
        id: "lr-040",
        status: "enforced",
        learning: { type: "code", pattern: "dry-run-test" },
        enforcement_test: testScript,
        metrics: { violations_before: 15, violations_after: 2 },
      },
    ];
    writeJsonl(routesPath, entries);

    // Capture file content before run
    const contentBefore = fs.readFileSync(routesPath, "utf8");

    const result = run({ routesPath, dryRun: true });

    assert.equal(result.verified, 1);

    // File should NOT have changed
    const contentAfter = fs.readFileSync(routesPath, "utf8");
    assert.equal(contentAfter, contentBefore);

    // Entry in file should still say "enforced"
    const parsedAfter = parseJsonl(routesPath);
    assert.equal(parsedAfter[0].status, "enforced");
  });

  // -----------------------------------------------------------------------
  // 10. JSON output — returns valid structure with expected fields
  // -----------------------------------------------------------------------
  it("should produce valid JSON output structure with json flag", () => {
    const testScript = createTestScript(tempDir, "pass-test.js", 0);
    const routesPath = path.join(tempDir, "learning-routes.jsonl");
    writeJsonl(routesPath, [
      {
        id: "lr-050",
        status: "enforced",
        learning: { type: "code", pattern: "json-output-test" },
        enforcement_test: testScript,
        metrics: { violations_before: 10, violations_after: 0 },
      },
    ]);

    const result = run({ routesPath, dryRun: true, json: true });

    // The function returns a summary object with the right shape
    assert.equal(typeof result.timestamp, "string");
    assert.equal(typeof result.total_checked, "number");
    assert.equal(typeof result.verified, "number");
    assert.equal(typeof result.failed, "number");
    assert.equal(typeof result.skipped, "number");
    assert.ok(Array.isArray(result.details));
    assert.ok(result.details.length > 0, "should have at least one detail");

    // Verify detail structure
    const detail = result.details[0];
    assert.equal(typeof detail.id, "string");
    assert.equal(typeof detail.pattern, "string");
    assert.equal(typeof detail.result, "string");
    assert.equal(typeof detail.reason, "string");
  });

  // -----------------------------------------------------------------------
  // 11. JSONL rewrite preserves non-enforced entries
  // -----------------------------------------------------------------------
  it("should preserve non-enforced entries when rewriting JSONL", () => {
    const testScript = createTestScript(tempDir, "pass-test.js", 0);
    const routesPath = path.join(tempDir, "learning-routes.jsonl");

    const scaffoldedEntry = {
      id: "lr-060",
      status: "scaffolded",
      learning: { type: "process", pattern: "scaffolded-pattern" },
      scaffold: "path/to/scaffold",
    };
    const refinedEntry = {
      id: "lr-061",
      status: "refined",
      learning: { type: "behavioral", pattern: "refined-pattern" },
    };
    const enforcedEntry = {
      id: "lr-062",
      status: "enforced",
      learning: { type: "code", pattern: "enforced-pattern" },
      enforcement_test: testScript,
      metrics: { violations_before: 5, violations_after: 0 },
    };
    const verifiedEntry = {
      id: "lr-063",
      status: "verified",
      learning: { type: "code", pattern: "already-verified" },
    };

    writeJsonl(routesPath, [scaffoldedEntry, refinedEntry, enforcedEntry, verifiedEntry]);

    run({ routesPath, dryRun: false });

    const updatedEntries = parseJsonl(routesPath);

    assert.equal(updatedEntries.length, 4);

    // scaffolded entry preserved exactly
    assert.equal(updatedEntries[0].id, "lr-060");
    assert.equal(updatedEntries[0].status, "scaffolded");
    assert.equal(updatedEntries[0].scaffold, "path/to/scaffold");

    // refined entry preserved exactly
    assert.equal(updatedEntries[1].id, "lr-061");
    assert.equal(updatedEntries[1].status, "refined");

    // enforced entry now verified
    assert.equal(updatedEntries[2].id, "lr-062");
    assert.equal(updatedEntries[2].status, "verified");

    // already-verified entry preserved
    assert.equal(updatedEntries[3].id, "lr-063");
    assert.equal(updatedEntries[3].status, "verified");
  });

  // -----------------------------------------------------------------------
  // verifyEntry with metrics-only (no test) — verified
  // -----------------------------------------------------------------------
  it("should verify entry with good metrics but no test path", () => {
    const entry = {
      id: "lr-070",
      status: "enforced",
      learning: { type: "code", pattern: "metrics-only" },
      metrics: { violations_before: 30, violations_after: 5 },
    };

    const result = verifyEntry(entry);

    assert.equal(result.result, "verified");
    assert.ok(result.reason.includes("30"), "reason should mention 30");
    assert.ok(result.reason.includes("5"), "reason should mention 5");
  });

  // -----------------------------------------------------------------------
  // verifyEntry with bad metrics and no test — failed
  // -----------------------------------------------------------------------
  it("should fail entry with unchanged metrics and no test", () => {
    const entry = {
      id: "lr-071",
      status: "enforced",
      learning: { type: "code", pattern: "unchanged-metrics" },
      metrics: { violations_before: 10, violations_after: 10 },
    };

    const result = verifyEntry(entry);

    assert.equal(result.result, "failed");
    assert.ok(result.reason.includes("unchanged"), "reason should mention unchanged");
  });

  // -----------------------------------------------------------------------
  // evaluateMetrics with missing/malformed data
  // -----------------------------------------------------------------------
  it("should handle missing metrics gracefully", () => {
    assert.equal(evaluateMetrics(null).improved, false);
    assert.equal(evaluateMetrics(undefined).improved, false);
    assert.equal(evaluateMetrics({}).improved, false);
    assert.equal(evaluateMetrics({ violations_before: "abc" }).improved, false);
  });

  // -----------------------------------------------------------------------
  // evaluateMetrics with increased violations
  // -----------------------------------------------------------------------
  it("should flag when violations increase", () => {
    const result = evaluateMetrics({
      violations_before: 5,
      violations_after: 15,
    });

    assert.equal(result.improved, false);
    assert.ok(result.reason.includes("increased"), "reason should mention increased");
  });

  // -----------------------------------------------------------------------
  // runEnforcementTest with nonexistent test file
  // -----------------------------------------------------------------------
  it("should report failure for nonexistent test file", () => {
    const result = runEnforcementTest(path.join(tempDir, "does-not-exist.js"));

    assert.equal(result.passed, false);
    assert.ok(result.reason.includes("not found"), "reason should mention not found");
  });

  // -----------------------------------------------------------------------
  // Idempotency — running twice produces same state
  // -----------------------------------------------------------------------
  it("should be idempotent — second run produces same state", () => {
    const testScript = createTestScript(tempDir, "pass-test.js", 0);
    const routesPath = path.join(tempDir, "learning-routes.jsonl");
    writeJsonl(routesPath, [
      {
        id: "lr-080",
        status: "enforced",
        learning: { type: "code", pattern: "idempotency-test" },
        enforcement_test: testScript,
        metrics: { violations_before: 10, violations_after: 0 },
      },
    ]);

    // First run
    const result1 = run({ routesPath, dryRun: false });
    assert.equal(result1.verified, 1);

    const entriesAfterFirst = parseJsonl(routesPath);
    assert.equal(entriesAfterFirst[0].status, "verified");

    // Second run — entry is now "verified", not "enforced", so nothing to check
    const result2 = run({ routesPath, dryRun: false });
    assert.equal(result2.total_checked, 0);

    // File should be unchanged
    const entriesAfterSecond = parseJsonl(routesPath);
    assert.equal(entriesAfterSecond[0].status, "verified");
    assert.equal(entriesAfterSecond[0].id, "lr-080");
  });

  // -----------------------------------------------------------------------
  // CLI integration: JSON output structure
  // -----------------------------------------------------------------------
  it("should produce correct JSON structure via module API", () => {
    const testScript = createTestScript(tempDir, "cli-test.js", 0);
    const routesPath = path.join(tempDir, "learning-routes.jsonl");
    writeJsonl(routesPath, [
      {
        id: "lr-cli-001",
        status: "enforced",
        learning: { type: "code", pattern: "cli-json-test" },
        enforcement_test: testScript,
        metrics: { violations_before: 8, violations_after: 0 },
      },
    ]);

    const result = run({ routesPath, dryRun: true, json: true });

    assert.equal(result.total_checked, 1);
    assert.equal(result.verified, 1);
    assert.equal(result.details[0].id, "lr-cli-001");
    assert.equal(result.details[0].result, "verified");
  });

  // -----------------------------------------------------------------------
  // Passing test but bad metrics — should fail
  // -----------------------------------------------------------------------
  it("should fail entry with passing test but unchanged metrics", () => {
    const testScript = createTestScript(tempDir, "pass-but-bad-metrics.js", 0);

    const entry = {
      id: "lr-090",
      status: "enforced",
      learning: { type: "code", pattern: "pass-bad-metrics" },
      enforcement_test: testScript,
      metrics: { violations_before: 10, violations_after: 10 },
    };

    const result = verifyEntry(entry);

    assert.equal(result.result, "failed");
    assert.ok(result.reason.includes("unchanged"), "reason should mention unchanged");
  });

  // -----------------------------------------------------------------------
  // Passing test and no metrics — should verify (test is sufficient)
  // -----------------------------------------------------------------------
  it("should verify entry with passing test and no metrics", () => {
    const testScript = createTestScript(tempDir, "pass-no-metrics.js", 0);

    const entry = {
      id: "lr-091",
      status: "enforced",
      learning: { type: "code", pattern: "test-only-verification" },
      enforcement_test: testScript,
    };

    const result = verifyEntry(entry);

    assert.equal(result.result, "verified");
    assert.ok(result.reason.includes("test passed"), "reason should mention test passed");
  });
});
