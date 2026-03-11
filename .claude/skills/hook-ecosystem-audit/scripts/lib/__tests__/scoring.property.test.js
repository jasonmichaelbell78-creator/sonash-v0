/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");
const path = require("node:path");

const { scoreMetric, computeGrade, compositeScore } = require(
  path.join(__dirname, "..", "scoring.js")
);

const VALID_GRADES = new Set(["A", "B", "C", "D", "F"]);

describe("hook-ecosystem scoring lib — property tests", () => {
  describe("scoreMetric — higher-is-better", () => {
    const benchmark = { good: 90, average: 70, poor: 50 };

    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(fc.integer({ min: -200, max: 200 }), (value) => {
          const result = scoreMetric(value, benchmark, "higher-is-better");
          return result.score >= 0 && result.score <= 100;
        }),
        { numRuns: 200 }
      );
    });

    it("returns score 100 for value >= good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 200 }), (value) => {
          const result = scoreMetric(value, benchmark, "higher-is-better");
          return result.score === 100;
        }),
        { numRuns: 100 }
      );
    });

    it("rating is 'good' for value >= good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 200 }), (value) => {
          const result = scoreMetric(value, benchmark, "higher-is-better");
          return result.rating === "good";
        }),
        { numRuns: 100 }
      );
    });

    it("handles NaN input gracefully", () => {
      const result = scoreMetric(NaN, benchmark, "higher-is-better");
      assert.equal(result.score, 0);
      assert.equal(result.rating, "poor");
    });
  });

  describe("scoreMetric — lower-is-better", () => {
    const benchmark = { good: 0, average: 3, poor: 10 };

    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(fc.integer({ min: -10, max: 20 }), (value) => {
          const result = scoreMetric(value, benchmark, "lower-is-better");
          return result.score >= 0 && result.score <= 100;
        }),
        { numRuns: 200 }
      );
    });

    it("returns score 100 for value <= good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: -100, max: 0 }), (value) => {
          const result = scoreMetric(value, benchmark, "lower-is-better");
          return result.score === 100;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("computeGrade", () => {
    it("always returns A, B, C, D, or F", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
          return VALID_GRADES.has(computeGrade(score));
        }),
        { numRuns: 200 }
      );
    });

    it("scores 90-100 return A", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 100 }), (score) => {
          return computeGrade(score) === "A";
        }),
        { numRuns: 50 }
      );
    });

    it("scores 0-59 return F", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 59 }), (score) => {
          return computeGrade(score) === "F";
        }),
        { numRuns: 50 }
      );
    });

    it("exact boundary: 80 returns B", () => {
      assert.equal(computeGrade(80), "B");
    });

    it("exact boundary: 70 returns C", () => {
      assert.equal(computeGrade(70), "C");
    });
  });

  describe("compositeScore", () => {
    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(
          fc.record({
            cat1: fc.integer({ min: 0, max: 100 }),
            cat2: fc.integer({ min: 0, max: 100 }),
          }),
          ({ cat1, cat2 }) => {
            const result = compositeScore(
              { cat1: { score: cat1 }, cat2: { score: cat2 } },
              { cat1: 0.6, cat2: 0.4 }
            );
            return result.score >= 0 && result.score <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("composite grade is always valid", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
          const result = compositeScore({ cat: { score } }, { cat: 1.0 });
          return VALID_GRADES.has(result.grade);
        }),
        { numRuns: 100 }
      );
    });
  });
});
