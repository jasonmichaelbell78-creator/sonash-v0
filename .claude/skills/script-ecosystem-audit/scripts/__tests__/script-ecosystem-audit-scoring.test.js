#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Scoring Tests for Script Ecosystem Audit
 *
 * Tests: weights sum to 1.0, compositeScore computation, scoreMetric
 * boundary conditions, grade thresholds.
 *
 * Usage:
 *   node script-ecosystem-audit-scoring.test.js
 *
 * Exit code: 0 if all pass, 1 if any fail.
 */

"use strict";

const path = require("node:path");

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
    let message;
    if (err instanceof Error) {
      message = err.stack || err.message;
    } else {
      message = `Non-Error thrown: ${String(err)}`;
    }
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

function assertClose(actual, expected, tolerance, message) {
  if (!Number.isFinite(actual) || !Number.isFinite(expected) || !Number.isFinite(tolerance)) {
    throw new Error(
      (message || "assertClose") +
        `: expected finite numbers, got actual=${String(actual)}, expected=${String(expected)}, tolerance=${String(tolerance)}`
    );
  }
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      (message || "assertClose") + `: expected ${expected} ± ${tolerance}, got ${actual}`
    );
  }
}

// ============================================================================
// LOAD MODULES
// ============================================================================

const SCRIPTS_DIR = path.join(__dirname, "..");
let compositeScore, scoreMetric, computeGrade, impactScore;
let CATEGORY_WEIGHTS, BENCHMARKS;

try {
  ({ compositeScore, scoreMetric, computeGrade, impactScore } = require(
    path.join(SCRIPTS_DIR, "lib", "scoring")
  ));
  ({ CATEGORY_WEIGHTS, BENCHMARKS } = require(path.join(SCRIPTS_DIR, "lib", "benchmarks")));
} catch (err) {
  let errMsg;
  if (err instanceof Error) {
    errMsg = err.message;
  } else {
    errMsg = String(err);
  }
  console.error(`Fatal: Could not load modules: ${errMsg}`);
  process.exit(1);
}

// ============================================================================
// TEST GROUP 1: Weights
// ============================================================================

console.log("\n--- Test Group 1: Weight Sum ---");

test("CATEGORY_WEIGHTS sum to 1.0 (±0.001)", () => {
  const total = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
  assertClose(total, 1.0, 0.001, "Weights must sum to 1.0");
});

test("all CATEGORY_WEIGHTS are positive", () => {
  for (const [cat, w] of Object.entries(CATEGORY_WEIGHTS)) {
    assert(typeof w === "number" && w > 0, `Weight for ${cat} must be positive`);
  }
});

test("CATEGORY_WEIGHTS has all 18 expected categories", () => {
  const expected = [
    "cjs_esm_consistency",
    "shebang_entry_point",
    "nodejs_api_compatibility",
    "file_io_safety",
    "error_sanitization",
    "path_traversal_guards",
    "exec_safety",
    "security_helper_usage",
    "package_json_coverage",
    "cross_script_dependencies",
    "shared_lib_utilization",
    "documentation_headers",
    "consistent_patterns",
    "dead_code",
    "complexity",
    "test_coverage",
    "test_freshness",
    "error_path_testing",
  ];
  for (const cat of expected) {
    assert(cat in CATEGORY_WEIGHTS, `CATEGORY_WEIGHTS missing: ${cat}`);
  }
  assertEqual(Object.keys(CATEGORY_WEIGHTS).length, 18, "Should have exactly 18 categories");
});

test("D2 (safety) total weight equals 0.25 (±0.01)", () => {
  const d2Cats = [
    "file_io_safety",
    "error_sanitization",
    "path_traversal_guards",
    "exec_safety",
    "security_helper_usage",
  ];
  const d2Total = d2Cats.reduce((sum, cat) => sum + (CATEGORY_WEIGHTS[cat] || 0), 0);
  assertClose(d2Total, 0.25, 0.01, "D2 safety weight should be ~0.25");
});

test("BENCHMARKS exist for every weighted category", () => {
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    assert(cat in BENCHMARKS, `BENCHMARKS missing: ${cat}`);
  }
});

// ============================================================================
// TEST GROUP 2: compositeScore
// ============================================================================

console.log("\n--- Test Group 2: Composite Score ---");

test("compositeScore with all 100s returns 100/A", () => {
  const all100 = {};
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    all100[cat] = { score: 100 };
  }
  const result = compositeScore(all100, CATEGORY_WEIGHTS);
  assertEqual(result.score, 100, "All-100 score");
  assertEqual(result.grade, "A", "All-100 grade");
});

test("compositeScore with all 0s returns 0/F", () => {
  const all0 = {};
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    all0[cat] = { score: 0 };
  }
  const result = compositeScore(all0, CATEGORY_WEIGHTS);
  assertEqual(result.score, 0, "All-0 score");
  assertEqual(result.grade, "F", "All-0 grade");
});

test("compositeScore breakdown includes contribution for each category", () => {
  const scores = {};
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    scores[cat] = { score: 80 };
  }
  const result = compositeScore(scores, CATEGORY_WEIGHTS);
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    assert(cat in result.breakdown, `breakdown missing: ${cat}`);
    assert(
      typeof result.breakdown[cat].contribution === "number",
      `${cat} contribution must be number`
    );
  }
});

test("compositeScore with mixed scores produces intermediate result", () => {
  const mixed = {};
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    mixed[cat] = { score: 50 };
  }
  const result = compositeScore(mixed, CATEGORY_WEIGHTS);
  assert(result.score > 0 && result.score < 100, "Mixed scores should produce intermediate result");
});

// ============================================================================
// TEST GROUP 3: scoreMetric
// ============================================================================

console.log("\n--- Test Group 3: scoreMetric ---");

test("scoreMetric higher-is-better: at good threshold → 100/good", () => {
  const bm = { good: 95, average: 80, poor: 60 };
  const { score, rating } = scoreMetric(95, bm, "higher-is-better");
  assertEqual(score, 100, "At good → 100");
  assertEqual(rating, "good", "At good → good");
});

test("scoreMetric higher-is-better: below poor threshold → 0/poor", () => {
  const bm = { good: 95, average: 80, poor: 60 };
  const { score, rating } = scoreMetric(10, bm, "higher-is-better");
  assertEqual(score, 0, "Below poor → 0");
  assertEqual(rating, "poor", "Below poor → poor");
});

test("scoreMetric handles NaN input gracefully", () => {
  const bm = { good: 80, average: 50, poor: 20 };
  const { score, rating } = scoreMetric(NaN, bm, "higher-is-better");
  assertEqual(score, 0, "NaN should return 0");
  assertEqual(rating, "poor", "NaN should return poor");
});

test("scoreMetric score is always clamped to [0, 100]", () => {
  const bm = { good: 80, average: 50, poor: 20 };
  const low = scoreMetric(-1000, bm, "higher-is-better");
  const high = scoreMetric(9999, bm, "lower-is-better");
  assert(low.score >= 0, "Must not go below 0");
  assert(high.score >= 0, "Must not go below 0 (lower-is-better)");
  assert(low.score <= 100, "Must not exceed 100");
});

// ============================================================================
// TEST GROUP 4: computeGrade
// ============================================================================

console.log("\n--- Test Group 4: Grade Thresholds ---");

test("computeGrade grade boundaries correct", () => {
  assertEqual(computeGrade(100), "A", "100 → A");
  assertEqual(computeGrade(90), "A", "90 → A");
  assertEqual(computeGrade(89), "B", "89 → B");
  assertEqual(computeGrade(80), "B", "80 → B");
  assertEqual(computeGrade(79), "C", "79 → C");
  assertEqual(computeGrade(70), "C", "70 → C");
  assertEqual(computeGrade(69), "D", "69 → D");
  assertEqual(computeGrade(60), "D", "60 → D");
  assertEqual(computeGrade(59), "F", "59 → F");
  assertEqual(computeGrade(0), "F", "0 → F");
});

// ============================================================================
// TEST GROUP 5: impactScore
// ============================================================================

console.log("\n--- Test Group 5: Impact Score ---");

test("impactScore is in 0-100 for all severities", () => {
  for (const severity of ["error", "warning", "info"]) {
    const score = impactScore({ severity, frequency: 3, blastRadius: 2 });
    assert(score >= 0 && score <= 100, `impactScore(${severity}) must be 0-100`);
  }
});

test("impactScore error > warning > info for same frequency/blastRadius", () => {
  const base = { frequency: 2, blastRadius: 2 };
  const err = impactScore({ ...base, severity: "error" });
  const warn = impactScore({ ...base, severity: "warning" });
  const info = impactScore({ ...base, severity: "info" });
  assert(err > warn, "error must score higher than warning");
  assert(warn > info, "warning must score higher than info");
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
if (require.main === module) {
  process.exit(failed > 0 ? 1 : 0);
} else {
  process.exitCode = failed > 0 ? 1 : 0;
}
