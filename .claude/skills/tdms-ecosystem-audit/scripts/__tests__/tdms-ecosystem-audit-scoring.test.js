#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Scoring Tests for TDMS Ecosystem Audit
 *
 * Tests: weights sum to 1.0, compositeScore computation, scoreMetric
 * boundary conditions, grade thresholds.
 *
 * Usage:
 *   node tdms-ecosystem-audit-scoring.test.js
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
    fn();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (err) {
    failed++;
    console.error(`  \u2717 ${name}: ${err.message}`);
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

test("CATEGORY_WEIGHTS has all 16 expected categories", () => {
  const expected = [
    // D1: Pipeline Correctness
    "script_execution_order",
    "data_flow_integrity",
    "intake_pipeline",
    // D2: Data Quality & Deduplication
    "dedup_algorithm_health",
    "schema_compliance",
    "content_hash_integrity",
    "id_uniqueness_referential",
    // D3: File I/O & Safety
    "error_handling_coverage",
    "master_deduped_sync",
    "backup_atomicity",
    // D4: Roadmap Integration
    "track_assignment_rules",
    "roadmap_debt_cross_ref",
    "sprint_file_alignment",
    // D5: Metrics & Reporting
    "view_generation_accuracy",
    "metrics_dashboard_correctness",
    "audit_trail_completeness",
  ];
  for (const cat of expected) {
    assert(cat in CATEGORY_WEIGHTS, `CATEGORY_WEIGHTS missing: ${cat}`);
  }
  assertEqual(Object.keys(CATEGORY_WEIGHTS).length, 16, "Should have exactly 16 categories");
});

test("D2 data quality weight is 0.25 (±0.01)", () => {
  const d2Cats = [
    "dedup_algorithm_health",
    "schema_compliance",
    "content_hash_integrity",
    "id_uniqueness_referential",
  ];
  const d2Total = d2Cats.reduce((sum, cat) => sum + (CATEGORY_WEIGHTS[cat] || 0), 0);
  assertClose(d2Total, 0.25, 0.01, "D2 weight should be ~0.25");
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

test("compositeScore breakdown contains all categories", () => {
  const scores = {};
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) scores[cat] = { score: 70 };
  const result = compositeScore(scores, CATEGORY_WEIGHTS);
  assert(typeof result.breakdown === "object", "breakdown must be object");
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    assert(cat in result.breakdown, `breakdown missing: ${cat}`);
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
  const bm = { good: 98, average: 90, poor: 75 };
  const { score, rating } = scoreMetric(98, bm, "higher-is-better");
  assertEqual(score, 100, "At good → 100");
  assertEqual(rating, "good", "At good → good");
});

test("scoreMetric higher-is-better below poor → 0/poor", () => {
  const bm = { good: 98, average: 90, poor: 75 };
  const { score, rating } = scoreMetric(0, bm, "higher-is-better");
  assertEqual(score, 0, "Below poor → 0");
  assertEqual(rating, "poor", "Below poor → poor");
});

test("scoreMetric score always clamped to [0, 100]", () => {
  const bm = { good: 90, average: 75, poor: 55 };
  const low = scoreMetric(-999, bm, "higher-is-better");
  assert(low.score >= 0 && low.score <= 100, "Must be clamped");
});

test("scoreMetric NaN input → 0/poor", () => {
  const bm = { good: 90, average: 75, poor: 55 };
  const { score, rating } = scoreMetric(NaN, bm, "higher-is-better");
  assertEqual(score, 0, "NaN → 0");
  assertEqual(rating, "poor", "NaN → poor");
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
// TEST GROUP 5: impactScore
// ============================================================================

console.log("\n--- Test Group 5: Impact Score ---");

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
