#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Checker Regression Tests for PR Ecosystem Audit
 *
 * Ensures all 5 domain checkers run without crashing, produce valid output
 * shapes, and that finding IDs are unique within the audit.
 *
 * Usage:
 *   node checker-regression.test.js
 *
 * Exit code: 0 if all pass, 1 if any fail.
 */

"use strict";

const path = require("node:path");
const fs = require("node:fs");

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === "function") {
      throw new Error("Async tests are not supported in this runner (returned a Promise)");
    }
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (err) {
    failed++;
    const message =
      err instanceof Error ? err.stack || err.message : `Non-Error thrown: ${String(err)}`;
    console.error(`  \u2717 ${name}: ${message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      (message || "assertEqual") +
        `: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

// ============================================================================
// LOAD CHECKERS
// ============================================================================

const SCRIPTS_DIR = path.join(__dirname, "..");
let processCompliance, dataStateHealth, patternLifecycle, feedbackIntegration, effectivenessMetrics;

try {
  processCompliance = require(path.join(SCRIPTS_DIR, "checkers", "process-compliance"));
  dataStateHealth = require(path.join(SCRIPTS_DIR, "checkers", "data-state-health"));
  patternLifecycle = require(path.join(SCRIPTS_DIR, "checkers", "pattern-lifecycle"));
  feedbackIntegration = require(path.join(SCRIPTS_DIR, "checkers", "feedback-integration"));
  effectivenessMetrics = require(path.join(SCRIPTS_DIR, "checkers", "effectiveness-metrics"));
} catch (err) {
  console.error(
    `Fatal: Could not load checker modules: ${err instanceof Error ? err.message : String(err)}`
  );
  process.exit(1);
}

function findProjectRoot() {
  let dir = SCRIPTS_DIR;
  const fsRoot = path.parse(dir).root;
  while (dir && dir !== fsRoot) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const next = path.dirname(dir);
    if (next === dir) break;
    dir = next;
  }
  return process.cwd();
}

const ROOT_DIR = findProjectRoot();

const CHECKERS = [
  { checker: processCompliance, name: "process-compliance", domain: "process_compliance" },
  { checker: dataStateHealth, name: "data-state-health", domain: "data_state_health" },
  { checker: patternLifecycle, name: "pattern-lifecycle", domain: "pattern_lifecycle" },
  { checker: feedbackIntegration, name: "feedback-integration", domain: "feedback_integration" },
  { checker: effectivenessMetrics, name: "effectiveness-metrics", domain: "effectiveness_metrics" },
];

// ============================================================================
// TEST GROUP 1: All checkers export a run function
// ============================================================================

console.log("\n--- Test Group 1: Checker Exports ---");

test("all checkers export a run function", () => {
  for (const { checker, name } of CHECKERS) {
    assert(typeof checker.run === "function", `${name} must export run()`);
  }
});

test("all checkers export a DOMAIN constant", () => {
  for (const { checker, name, domain } of CHECKERS) {
    assert(typeof checker.DOMAIN === "string", `${name} must export DOMAIN string`);
    assertEqual(checker.DOMAIN, domain, `${name} DOMAIN mismatch`);
  }
});

// ============================================================================
// TEST GROUP 2: Checkers run without throwing
// ============================================================================

console.log("\n--- Test Group 2: Smoke Tests ---");

const checkerResults = {};

for (const { checker, name, domain } of CHECKERS) {
  test(`${name} checker runs without throwing`, () => {
    const result = checker.run({ rootDir: ROOT_DIR });
    assert(typeof result === "object" && result !== null, "Result must be an object");
    assert(result.domain === domain, `domain should be ${domain}`);
    assert(Array.isArray(result.findings), "findings must be an array");
    assert(typeof result.scores === "object" && result.scores !== null, "scores must be an object");
    assert(Object.keys(result.scores).length > 0, "scores must have at least one category");
    checkerResults[name] = result;
  });
}

// ============================================================================
// TEST GROUP 3: Scores are in 0-100 range with valid ratings
// ============================================================================

console.log("\n--- Test Group 3: Score Validity ---");

test("all checker scores are in 0-100 range", () => {
  for (const { name } of CHECKERS) {
    const result = checkerResults[name];
    assert(result, "Missing smoke-test result (check Test Group 2)"); // skip if checker failed
    for (const [cat, scoreObj] of Object.entries(result.scores)) {
      const score = scoreObj.score;
      assert(
        typeof score === "number" && score >= 0 && score <= 100,
        `${name}/${cat} score (${score}) must be 0-100`
      );
      assert(
        ["good", "average", "poor"].includes(scoreObj.rating),
        `${name}/${cat} rating "${scoreObj.rating}" must be good/average/poor`
      );
    }
  }
});

// ============================================================================
// TEST GROUP 4: Finding ID uniqueness
// ============================================================================

console.log("\n--- Test Group 4: Finding ID Uniqueness ---");

test("finding IDs are unique across all PR audit checkers", () => {
  const allIds = [];
  const duplicates = [];
  for (const { name } of CHECKERS) {
    const result = checkerResults[name];
    assert(result, `Missing smoke-test result for ${name} (check Test Group 2)`);
    for (const finding of result.findings) {
      if (allIds.includes(finding.id)) {
        duplicates.push(`${finding.id} (in ${name})`);
      }
      allIds.push(finding.id);
    }
  }
  assert(duplicates.length === 0, `Duplicate finding IDs found: ${duplicates.join(", ")}`);
});

test("all findings have required fields (id, category, severity, message)", () => {
  const requiredFields = ["id", "category", "severity", "message"];
  const validSeverities = ["error", "warning", "info"];
  for (const { name } of CHECKERS) {
    const result = checkerResults[name];
    assert(result, `Missing smoke-test result for ${name} (check Test Group 2)`);
    for (const finding of result.findings) {
      for (const field of requiredFields) {
        assert(
          finding[field] !== undefined && finding[field] !== null,
          `Finding ${finding.id || "unknown"} in ${name} missing field: ${field}`
        );
      }
      assert(
        validSeverities.includes(finding.severity),
        `Finding ${finding.id} in ${name} has invalid severity: ${finding.severity}`
      );
    }
  }
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
