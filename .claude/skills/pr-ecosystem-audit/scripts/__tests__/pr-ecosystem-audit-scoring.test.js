#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Scoring Tests for PR Ecosystem Audit
 *
 * Tests: weights sum to 1.0, compositeScore computation, scoreMetric
 * boundary conditions, grade thresholds.
 *
 * Usage:
 *   node pr-ecosystem-audit-scoring.test.js
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
    `Fatal: Could not load scoring/benchmarks modules: ${err instanceof Error ? err.message : String(err)}`
  );
  process.exit(1);
}

// ============================================================================
// TEST GROUP 1: Weights sum to 1.0
// ============================================================================

console.log("\n--- Test Group 1: Weight Sum ---");

test("CATEGORY_WEIGHTS sum to 1.0 (±0.001)", () => {
  const total = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
  assertClose(total, 1.0, 0.001, "Category weights must sum to 1.0");
});

test("all CATEGORY_WEIGHTS are positive numbers", () => {
  for (const [cat, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    assert(typeof weight === "number" && weight > 0, `Weight for ${cat} must be a positive number`);
  }
});

test("BENCHMARKS exist for every category in CATEGORY_WEIGHTS", () => {
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    assert(cat in BENCHMARKS, `BENCHMARKS missing entry for weighted category: ${cat}`);
  }
});

// ============================================================================
// TEST GROUP 2: compositeScore computation
// ============================================================================

console.log("\n--- Test Group 2: Composite Score Computation ---");

test("compositeScore with all 100s returns score 100 grade A", () => {
  const allHundreds = {};
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    allHundreds[cat] = { score: 100 };
  }
  const result = compositeScore(allHundreds, CATEGORY_WEIGHTS);
  assertEqual(result.score, 100, "All-100 composite should be 100");
  assertEqual(result.grade, "A", "Score 100 should be grade A");
});

test("compositeScore with all 0s returns score 0 grade F", () => {
  const allZeros = {};
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    allZeros[cat] = { score: 0 };
  }
  const result = compositeScore(allZeros, CATEGORY_WEIGHTS);
  assertEqual(result.score, 0, "All-0 composite should be 0");
  assertEqual(result.grade, "F", "Score 0 should be grade F");
});

test("compositeScore handles missing categories gracefully", () => {
  // Only provide subset of categories
  const partial = {
    skill_invocation_fidelity: { score: 80 },
    review_process_completeness: { score: 70 },
  };
  const partialWeights = {
    skill_invocation_fidelity: 0.5,
    review_process_completeness: 0.5,
  };
  const result = compositeScore(partial, partialWeights);
  assert(result.score >= 0 && result.score <= 100, "Partial composite must be in range");
  assert(typeof result.grade === "string", "Grade must be a string");
});

test("compositeScore breakdown contains all provided categories", () => {
  const scores = {};
  const weights = {};
  for (const [cat, w] of Object.entries(CATEGORY_WEIGHTS)) {
    scores[cat] = { score: 75 };
    weights[cat] = w;
  }
  const result = compositeScore(scores, weights);
  assert(typeof result.breakdown === "object", "breakdown must be an object");
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    assert(cat in result.breakdown, `breakdown must include ${cat}`);
  }
});

// ============================================================================
// TEST GROUP 3: scoreMetric boundary conditions
// ============================================================================

console.log("\n--- Test Group 3: scoreMetric Boundaries ---");

test("scoreMetric higher-is-better: value at good threshold scores 100", () => {
  const benchmark = { good: 80, average: 50, poor: 20 };
  const { score, rating } = scoreMetric(80, benchmark, "higher-is-better");
  assertEqual(score, 100, "At good threshold should score 100");
  assertEqual(rating, "good", "At good threshold should rate good");
});

test("scoreMetric higher-is-better: value below poor threshold scores 0", () => {
  const benchmark = { good: 80, average: 50, poor: 20 };
  const { score, rating } = scoreMetric(0, benchmark, "higher-is-better");
  assertEqual(score, 0, "Below poor threshold should score 0");
  assertEqual(rating, "poor", "Below poor threshold should rate poor");
});

test("scoreMetric lower-is-better: value at good threshold scores 100", () => {
  const benchmark = { good: 0, average: 3, poor: 8 };
  const { score, rating } = scoreMetric(0, benchmark, "lower-is-better");
  assertEqual(score, 100, "At good threshold should score 100");
  assertEqual(rating, "good", "At good threshold should rate good");
});

test("scoreMetric returns score clamped to 0-100", () => {
  const benchmark = { good: 80, average: 50, poor: 20 };
  const low = scoreMetric(-999, benchmark, "higher-is-better");
  const high = scoreMetric(9999, benchmark, "higher-is-better");
  assert(low.score >= 0, "Score must not go below 0");
  assert(high.score <= 100, "Score must not exceed 100");
});

// ============================================================================
// TEST GROUP 4: Grade thresholds
// ============================================================================

console.log("\n--- Test Group 4: Grade Thresholds ---");

test("computeGrade returns correct grades at boundaries", () => {
  assertEqual(computeGrade(90), "A", "90 should be A");
  assertEqual(computeGrade(80), "B", "80 should be B");
  assertEqual(computeGrade(70), "C", "70 should be C");
  assertEqual(computeGrade(60), "D", "60 should be D");
  assertEqual(computeGrade(59), "F", "59 should be F");
  assertEqual(computeGrade(0), "F", "0 should be F");
  assertEqual(computeGrade(100), "A", "100 should be A");
});

// ============================================================================
// TEST GROUP 5: impactScore
// ============================================================================

console.log("\n--- Test Group 5: Impact Score ---");

test("impactScore returns number in 0-100 range", () => {
  const cases = [
    { severity: "error", frequency: 5, blastRadius: 3 },
    { severity: "warning", frequency: 1, blastRadius: 1 },
    { severity: "info" },
  ];
  for (const c of cases) {
    const score = impactScore(c);
    assert(
      typeof score === "number" && score >= 0 && score <= 100,
      `impactScore(${JSON.stringify(c)}) = ${score} must be 0-100`
    );
  }
});

test("impactScore: error severity scores higher than warning", () => {
  const errScore = impactScore({ severity: "error", frequency: 1, blastRadius: 1 });
  const warnScore = impactScore({ severity: "warning", frequency: 1, blastRadius: 1 });
  assert(errScore > warnScore, "error should score higher than warning");
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
