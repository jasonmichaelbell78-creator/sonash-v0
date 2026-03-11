/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Scoring Tests — weights sum to 1.0, composite correct,
 * grade boundaries, scoreMetric edge cases.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  scoreMetric,
  computeGrade,
  compositeScore,
  impactScore,
  sparkline,
  computeTrend,
} = require("../lib/scoring");
const { CATEGORY_WEIGHTS, BENCHMARKS } = require("../lib/benchmarks");

describe("Health Ecosystem Scoring", () => {
  describe("CATEGORY_WEIGHTS", () => {
    it("sum to approximately 1.0", () => {
      const sum = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(sum - 1.0) < 0.02, `Weights sum to ${sum.toFixed(4)}, expected ~1.0`);
    });

    it("has exactly 25 categories", () => {
      assert.equal(Object.keys(CATEGORY_WEIGHTS).length, 25);
    });

    it("all weights are positive numbers", () => {
      for (const [cat, w] of Object.entries(CATEGORY_WEIGHTS)) {
        assert.ok(typeof w === "number" && w > 0, `${cat} weight ${w} is positive`);
      }
    });

    it("every weight has a matching benchmark", () => {
      for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
        assert.ok(BENCHMARKS[cat], `Benchmark exists for ${cat}`);
      }
    });
  });

  describe("scoreMetric", () => {
    it("returns 100 for good values (higher-is-better)", () => {
      const result = scoreMetric(100, { good: 90, average: 70, poor: 50 }, "higher-is-better");
      assert.equal(result.score, 100);
      assert.equal(result.rating, "good");
    });

    it("returns 100 for good values (lower-is-better)", () => {
      const result = scoreMetric(0, { good: 0, average: 2, poor: 5 }, "lower-is-better");
      assert.equal(result.score, 100);
      assert.equal(result.rating, "good");
    });

    it("returns poor for bad values", () => {
      const result = scoreMetric(10, { good: 90, average: 70, poor: 50 }, "higher-is-better");
      assert.equal(result.rating, "poor");
      assert.ok(result.score < 60);
    });

    it("handles NaN input", () => {
      const result = scoreMetric(NaN, { good: 90, average: 70, poor: 50 }, "higher-is-better");
      assert.equal(result.score, 0);
      assert.equal(result.rating, "poor");
    });

    it("handles undefined input", () => {
      const result = scoreMetric(undefined, { good: 90, average: 70, poor: 50 });
      assert.equal(result.score, 0);
      assert.equal(result.rating, "poor");
    });

    it("clamps score to 0-100", () => {
      const result = scoreMetric(200, { good: 90, average: 70, poor: 50 }, "higher-is-better");
      assert.ok(result.score >= 0 && result.score <= 100);
    });
  });

  describe("computeGrade", () => {
    it("returns A for 90+", () => assert.equal(computeGrade(95), "A"));
    it("returns B for 80-89", () => assert.equal(computeGrade(85), "B"));
    it("returns C for 70-79", () => assert.equal(computeGrade(75), "C"));
    it("returns D for 60-69", () => assert.equal(computeGrade(65), "D"));
    it("returns F for <60", () => assert.equal(computeGrade(50), "F"));
    it("returns A for 100", () => assert.equal(computeGrade(100), "A"));
    it("returns F for 0", () => assert.equal(computeGrade(0), "F"));
  });

  describe("compositeScore", () => {
    it("computes weighted average correctly", () => {
      const scores = {
        a: { score: 100 },
        b: { score: 0 },
      };
      const weights = { a: 0.5, b: 0.5 };
      const result = compositeScore(scores, weights);
      assert.equal(result.score, 50);
    });

    it("handles missing categories gracefully", () => {
      const scores = { a: { score: 80 } };
      const weights = { a: 0.5, b: 0.5 };
      const result = compositeScore(scores, weights);
      // Should only use available weight
      assert.equal(result.score, 80);
    });

    it("returns 0 for empty scores", () => {
      const result = compositeScore({}, { a: 1.0 });
      assert.equal(result.score, 0);
    });

    it("includes breakdown", () => {
      const scores = { a: { score: 90 } };
      const weights = { a: 1.0 };
      const result = compositeScore(scores, weights);
      assert.ok(result.breakdown.a);
      assert.equal(result.breakdown.a.score, 90);
    });
  });

  describe("impactScore", () => {
    it("error severity scores highest", () => {
      const errScore = impactScore({ severity: "error", frequency: 5, blastRadius: 3 });
      const warnScore = impactScore({ severity: "warning", frequency: 5, blastRadius: 3 });
      assert.ok(errScore > warnScore);
    });

    it("returns 0-100 range", () => {
      const score = impactScore({ severity: "info", frequency: 1, blastRadius: 1 });
      assert.ok(score >= 0 && score <= 100);
    });
  });

  describe("sparkline", () => {
    it("returns string for valid input", () => {
      const result = sparkline([50, 60, 70, 80, 90]);
      assert.ok(typeof result === "string");
      assert.ok(result.length === 5);
    });

    it("returns empty string for empty input", () => {
      assert.equal(sparkline([]), "");
      assert.equal(sparkline(null), "");
    });
  });

  describe("computeTrend", () => {
    it("detects improving trend", () => {
      const result = computeTrend([50, 60, 70, 80, 90]);
      assert.ok(result);
      assert.equal(result.direction, "improving");
      assert.ok(result.delta > 0);
    });

    it("detects declining trend", () => {
      const result = computeTrend([90, 80, 70, 60, 50]);
      assert.ok(result);
      assert.equal(result.direction, "declining");
      assert.ok(result.delta < 0);
    });

    it("detects stable trend", () => {
      const result = computeTrend([80, 80, 81, 80, 80]);
      assert.ok(result);
      assert.equal(result.direction, "stable");
    });

    it("returns null for insufficient data", () => {
      assert.equal(computeTrend([80]), null);
      assert.equal(computeTrend([]), null);
      assert.equal(computeTrend(null), null);
    });
  });
});
