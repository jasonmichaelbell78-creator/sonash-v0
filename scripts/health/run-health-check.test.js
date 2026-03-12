/**
 * Tests for health check system
 * Uses node:test (project convention)
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// ============================================================================
// Test 1: scoreMetric boundary values
// ============================================================================
describe("scoring.js", () => {
  const { scoreMetric, computeGrade } = require("./lib/scoring");

  it("returns score 100 and rating good when value at good threshold (lower-is-better)", () => {
    const result = scoreMetric(0, { good: 0, average: 5, poor: 20 });
    assert.equal(result.score, 100);
    assert.equal(result.rating, "good");
  });

  it("returns score 100 and rating good when value at good threshold (higher-is-better)", () => {
    const result = scoreMetric(90, { good: 90, average: 70, poor: 50 }, "higher-is-better");
    assert.equal(result.score, 100);
    assert.equal(result.rating, "good");
  });

  it("returns poor rating for value exceeding poor threshold (lower-is-better)", () => {
    const result = scoreMetric(25, { good: 0, average: 5, poor: 20 });
    assert.equal(result.rating, "poor");
    assert.ok(result.score <= 60, `score ${result.score} should be <= 60`);
  });

  it("returns score 0 and rating poor for NaN", () => {
    const result = scoreMetric(Number.NaN, { good: 0, average: 5, poor: 20 });
    assert.equal(result.score, 0);
    assert.equal(result.rating, "poor");
  });

  it("computeGrade returns correct letter grades", () => {
    assert.equal(computeGrade(95), "A");
    assert.equal(computeGrade(85), "B");
    assert.equal(computeGrade(75), "C");
    assert.equal(computeGrade(65), "D");
    assert.equal(computeGrade(50), "F");
  });
});

// ============================================================================
// Test 2: dimensions.js has exactly 13 dimensions with valid categories
// ============================================================================
describe("dimensions.js", () => {
  const { DIMENSIONS } = require("./lib/dimensions");

  it("has exactly 13 dimensions", () => {
    assert.equal(DIMENSIONS.length, 13);
  });

  it("each dimension has required fields", () => {
    const validCategories = new Set([
      "Code Quality",
      "Security",
      "Technical Debt",
      "Testing",
      "Learning & Patterns",
      "Infrastructure",
      "Documentation",
      "Process & Workflow",
    ]);

    for (const dim of DIMENSIONS) {
      assert.ok(dim.id, `dimension missing id`);
      assert.ok(dim.name, `dimension ${dim.id} missing name`);
      assert.ok(dim.category, `dimension ${dim.id} missing category`);
      assert.ok(dim.checkerField, `dimension ${dim.id} missing checkerField`);
      assert.ok(Array.isArray(dim.metricKeys), `dimension ${dim.id} missing metricKeys`);
      assert.ok(
        validCategories.has(dim.category),
        `dimension ${dim.id} has invalid category: ${dim.category}`
      );
    }
  });

  it("all 8 categories are represented", () => {
    const categories = new Set(DIMENSIONS.map((d) => d.category));
    assert.equal(categories.size, 8);
  });
});

// ============================================================================
// Test 3: composite.js computes weighted scores correctly
// ============================================================================
describe("composite.js", () => {
  const { computeCompositeScore } = require("./lib/composite");

  it("computes weighted score from mock checker data", () => {
    const mockCheckers = {
      "code-quality": {
        metrics: {
          ts_errors: { value: 0, score: 100, rating: "good" },
          eslint_errors: { value: 0, score: 100, rating: "good" },
        },
        no_data: false,
      },
      security: {
        metrics: {
          critical_vulns: { value: 0, score: 100, rating: "good" },
        },
        no_data: false,
      },
      "debt-health": {
        metrics: {
          s0_count: { value: 0, score: 100, rating: "good" },
        },
        no_data: false,
      },
      "test-coverage": {
        metrics: {
          pass_rate: { value: 98, score: 100, rating: "good" },
        },
        no_data: false,
      },
      "learning-effectiveness": {
        metrics: {
          effectiveness: { value: 90, score: 100, rating: "good" },
        },
        no_data: false,
      },
      "hook-pipeline": {
        metrics: {
          warnings_7d: { value: 0, score: 100, rating: "good" },
        },
        no_data: false,
      },
      "session-management": {
        metrics: {
          uncommitted_files: { value: 0, score: 100, rating: "good" },
        },
        no_data: false,
      },
      documentation: {
        metrics: {
          staleness_days: { value: 1, score: 100, rating: "good" },
        },
        no_data: false,
      },
      "pattern-enforcement": {
        metrics: {
          repeat_offenders: { value: 0, score: 100, rating: "good" },
        },
        no_data: false,
      },
      "ecosystem-integration": {
        metrics: {
          avg_fix_ratio: { value: 0.1, score: 100, rating: "good" },
        },
        no_data: false,
      },
    };

    const result = computeCompositeScore(mockCheckers);
    assert.equal(result.score, 100, "all-good checkers should produce score 100");
    assert.equal(result.grade, "A");
    assert.equal(Object.keys(result.categoryScores).length, 8);
    assert.equal(Object.keys(result.dimensionScores).length, 13);
  });

  it("handles no_data checkers gracefully", () => {
    const mockCheckers = {
      "code-quality": {
        metrics: {
          ts_errors: { value: 0, score: 100, rating: "good" },
        },
        no_data: false,
      },
      security: { metrics: {}, no_data: true },
      "debt-health": { metrics: {}, no_data: true },
      "test-coverage": { metrics: {}, no_data: true },
      "learning-effectiveness": { metrics: {}, no_data: true },
      "hook-pipeline": { metrics: {}, no_data: true },
      "session-management": { metrics: {}, no_data: true },
      documentation: { metrics: {}, no_data: true },
      "pattern-enforcement": { metrics: {}, no_data: true },
      "ecosystem-integration": { metrics: {}, no_data: true },
    };

    const result = computeCompositeScore(mockCheckers);
    // Score should reflect that only Code Quality has data
    assert.ok(typeof result.score === "number", "score should be a number");
    assert.ok(result.score >= 0 && result.score <= 100, "score should be 0-100");
    assert.ok(["A", "B", "C", "D", "F"].includes(result.grade), "grade should be valid");
    // no_data categories should be flagged
    assert.equal(result.categoryScores["Security"].no_data, true);
    assert.equal(result.categoryScores["Code Quality"].no_data, undefined);
  });
});

// ============================================================================
// Test 4: Each checker module exports a function
// ============================================================================
describe("checker exports", () => {
  const checkerPaths = [
    { path: "./checkers/code-quality", fn: "checkCodeQuality" },
    { path: "./checkers/security", fn: "checkSecurity" },
    { path: "./checkers/debt-health", fn: "checkDebtHealth" },
    { path: "./checkers/test-coverage", fn: "checkTestCoverage" },
    { path: "./checkers/learning-effectiveness", fn: "checkLearningEffectiveness" },
    { path: "./checkers/hook-pipeline", fn: "checkHookPipeline" },
    { path: "./checkers/session-management", fn: "checkSessionManagement" },
    { path: "./checkers/documentation", fn: "checkDocumentation" },
    { path: "./checkers/pattern-enforcement", fn: "checkPatternEnforcement" },
    { path: "./checkers/ecosystem-integration", fn: "checkEcosystemIntegration" },
  ];

  for (const checker of checkerPaths) {
    it(`${checker.path} exports ${checker.fn} as function`, () => {
      const mod = require(checker.path);
      assert.equal(typeof mod[checker.fn], "function", `${checker.fn} should be a function`);
    });
  }
});
