#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Scoring Tests for Hook Ecosystem Audit
 *
 * Tests: weights sum to 1.0, compositeScore computation, scoreMetric
 * boundary conditions, grade thresholds, computeTrend, sparkline.
 *
 * Usage:
 *   node hook-ecosystem-audit-scoring.test.js
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
let compositeScore, scoreMetric, computeGrade, impactScore, computeTrend, sparkline;
let CATEGORY_WEIGHTS, BENCHMARKS;

try {
  ({ compositeScore, scoreMetric, computeGrade, impactScore, computeTrend, sparkline } = require(
    path.join(SCRIPTS_DIR, "lib", "scoring")
  ));
  ({ CATEGORY_WEIGHTS, BENCHMARKS } = require(path.join(SCRIPTS_DIR, "lib", "benchmarks")));
} catch (err) {
  console.error(
    `Fatal: Could not load modules: ${err instanceof Error ? err.message : String(err)}`
  );
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

test("all CATEGORY_WEIGHTS are positive numbers", () => {
  for (const [cat, w] of Object.entries(CATEGORY_WEIGHTS)) {
    assert(typeof w === "number" && w > 0, `Weight for ${cat} must be positive`);
  }
});

test("CATEGORY_WEIGHTS has all 19 expected categories", () => {
  const expected = [
    // D1: Hook Configuration Health
    "settings_file_alignment",
    "event_coverage_matchers",
    "global_local_consistency",
    // D2: Code Quality & Security
    "error_handling_sanitization",
    "security_patterns",
    "code_hygiene",
    "regex_safety",
    // D3: Pre-commit Pipeline
    "stage_ordering_completeness",
    "bypass_override_controls",
    "gate_effectiveness",
    // D4: Functional Correctness
    "test_coverage",
    "output_protocol_compliance",
    "behavioral_accuracy",
    // D5: State & Integration
    "state_file_health",
    "cross_hook_dependencies",
    "compaction_resilience",
    // D6: CI/CD Pipeline Health
    "workflow_script_alignment",
    "bot_config_freshness",
    "ci_cache_effectiveness",
  ];
  for (const cat of expected) {
    assert(cat in CATEGORY_WEIGHTS, `CATEGORY_WEIGHTS missing: ${cat}`);
  }
  assertEqual(Object.keys(CATEGORY_WEIGHTS).length, 19, "Should have exactly 19 categories");
});

test("D2 code quality & security weight is 0.23 (±0.01)", () => {
  const d2Cats = [
    "error_handling_sanitization",
    "security_patterns",
    "code_hygiene",
    "regex_safety",
  ];
  const d2Total = d2Cats.reduce((sum, cat) => sum + (CATEGORY_WEIGHTS[cat] || 0), 0);
  assertClose(d2Total, 0.23, 0.01, "D2 weight should be ~0.23");
});

test("D6 ci/cd weight is 0.10 (±0.01)", () => {
  const d6Cats = ["workflow_script_alignment", "bot_config_freshness", "ci_cache_effectiveness"];
  const d6Total = d6Cats.reduce((sum, cat) => sum + (CATEGORY_WEIGHTS[cat] || 0), 0);
  assertClose(d6Total, 0.1, 0.01, "D6 weight should be ~0.10");
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

test("compositeScore all-100 returns 100/A", () => {
  const all100 = {};
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) all100[cat] = { score: 100 };
  const result = compositeScore(all100, CATEGORY_WEIGHTS);
  assertEqual(result.score, 100, "All-100 score");
  assertEqual(result.grade, "A", "All-100 grade");
});

test("compositeScore all-0 returns 0/F", () => {
  const all0 = {};
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) all0[cat] = { score: 0 };
  const result = compositeScore(all0, CATEGORY_WEIGHTS);
  assertEqual(result.score, 0, "All-0 score");
  assertEqual(result.grade, "F", "All-0 grade");
});

test("compositeScore breakdown contains all 19 categories", () => {
  const scores = {};
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) scores[cat] = { score: 75 };
  const result = compositeScore(scores, CATEGORY_WEIGHTS);
  assert(typeof result.breakdown === "object", "breakdown must be object");
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    assert(cat in result.breakdown, `breakdown missing: ${cat}`);
    assert(
      typeof result.breakdown[cat].contribution === "number",
      `${cat} contribution must be number`
    );
    assert(typeof result.breakdown[cat].weight === "number", `${cat} weight must be number`);
  }
});

test("compositeScore mixed input produces intermediate result", () => {
  const mixed = {};
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) mixed[cat] = { score: 50 };
  const result = compositeScore(mixed, CATEGORY_WEIGHTS);
  assert(result.score > 0 && result.score < 100, "Mixed must produce intermediate result");
});

// ============================================================================
// TEST GROUP 3: scoreMetric
// ============================================================================

console.log("\n--- Test Group 3: scoreMetric ---");

test("scoreMetric higher-is-better at good threshold → 100/good", () => {
  const bm = { good: 95, average: 80, poor: 60 };
  const { score, rating } = scoreMetric(95, bm, "higher-is-better");
  assertEqual(score, 100, "At good → 100");
  assertEqual(rating, "good", "At good → good");
});

test("scoreMetric higher-is-better at average midpoint → average rating", () => {
  const bm = { good: 95, average: 80, poor: 60 };
  const { rating } = scoreMetric(87, bm, "higher-is-better");
  assertEqual(rating, "average", "Midpoint average → average");
});

test("scoreMetric higher-is-better below poor → 0/poor", () => {
  const bm = { good: 95, average: 80, poor: 60 };
  const { score, rating } = scoreMetric(0, bm, "higher-is-better");
  assertEqual(score, 0, "Below poor → 0");
  assertEqual(rating, "poor", "Below poor → poor");
});

test("scoreMetric lower-is-better at good threshold → 100/good", () => {
  const bm = { good: 0, average: 1, poor: 3 };
  const { score, rating } = scoreMetric(0, bm, "lower-is-better");
  assertEqual(score, 100, "At good (lower) → 100");
  assertEqual(rating, "good", "At good (lower) → good");
});

test("scoreMetric NaN input → 0/poor", () => {
  const bm = { good: 90, average: 75, poor: 55 };
  const { score, rating } = scoreMetric(NaN, bm, "higher-is-better");
  assertEqual(score, 0, "NaN → 0");
  assertEqual(rating, "poor", "NaN → poor");
});

test("scoreMetric score always clamped to [0, 100]", () => {
  const bm = { good: 90, average: 75, poor: 55 };
  const low = scoreMetric(-999, bm, "higher-is-better");
  assert(low.score >= 0 && low.score <= 100, "Must be clamped to [0, 100]");
});

// ============================================================================
// TEST GROUP 4: computeGrade
// ============================================================================

console.log("\n--- Test Group 4: Grade Thresholds ---");

test("computeGrade boundaries are correct", () => {
  assertEqual(computeGrade(100), "A");
  assertEqual(computeGrade(90), "A");
  assertEqual(computeGrade(89), "B");
  assertEqual(computeGrade(80), "B");
  assertEqual(computeGrade(79), "C");
  assertEqual(computeGrade(70), "C");
  assertEqual(computeGrade(69), "D");
  assertEqual(computeGrade(60), "D");
  assertEqual(computeGrade(59), "F");
  assertEqual(computeGrade(0), "F");
});

// ============================================================================
// TEST GROUP 5: computeTrend
// ============================================================================

console.log("\n--- Test Group 5: computeTrend ---");

test("computeTrend returns null for empty array", () => {
  assertEqual(computeTrend([]), null, "Empty → null");
});

test("computeTrend returns null for single value", () => {
  assertEqual(computeTrend([75]), null, "Single value → null");
});

test("computeTrend improving: last > first", () => {
  const trend = computeTrend([60, 65, 70, 75, 80]);
  assert(trend !== null, "Must return trend object");
  assertEqual(trend.direction, "improving", "Should be improving");
  assert(trend.delta > 0, "Delta must be positive");
});

test("computeTrend declining: last < first", () => {
  const trend = computeTrend([80, 75, 70, 65, 60]);
  assert(trend !== null, "Must return trend object");
  assertEqual(trend.direction, "declining", "Should be declining");
  assert(trend.delta < 0, "Delta must be negative");
});

test("computeTrend stable: <5% change", () => {
  const trend = computeTrend([80, 80, 81, 80, 80]);
  assert(trend !== null, "Must return trend object");
  assertEqual(trend.direction, "stable", "Tiny change → stable");
});

test("computeTrend returns sparkline string", () => {
  const trend = computeTrend([60, 70, 80, 75, 85]);
  assert(trend !== null, "Must return trend object");
  assert(typeof trend.sparkline === "string", "sparkline must be string");
  assert(trend.sparkline.length > 0, "sparkline must not be empty");
});

// ============================================================================
// TEST GROUP 6: sparkline
// ============================================================================

console.log("\n--- Test Group 6: sparkline ---");

test("sparkline returns empty string for empty array", () => {
  assertEqual(sparkline([]), "", "Empty array → empty string");
});

test("sparkline returns single character for single value", () => {
  const result = sparkline([50]);
  assertEqual(result.length, 1, "Single value → 1 char");
});

test("sparkline length equals input array length", () => {
  const values = [10, 30, 50, 70, 90];
  assertEqual(sparkline(values).length, values.length, "Length must match");
});

// ============================================================================
// TEST GROUP 7: impactScore
// ============================================================================

console.log("\n--- Test Group 7: Impact Score ---");

test("impactScore is in 0-100 for all severities", () => {
  for (const severity of ["error", "warning", "info"]) {
    const score = impactScore({ severity, frequency: 3, blastRadius: 2 });
    assert(score >= 0 && score <= 100, `impactScore(${severity}) must be 0-100`);
  }
});

test("impactScore error > warning > info", () => {
  const base = { frequency: 2, blastRadius: 2 };
  assert(
    impactScore({ ...base, severity: "error" }) > impactScore({ ...base, severity: "warning" }),
    "error > warning"
  );
  assert(
    impactScore({ ...base, severity: "warning" }) > impactScore({ ...base, severity: "info" }),
    "warning > info"
  );
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
