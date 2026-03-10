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

describe("pr-ecosystem scoring lib — property tests", () => {
  describe("scoreMetric — higher-is-better", () => {
    const benchmark = { good: 85, average: 65, poor: 40 };

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
        fc.property(fc.integer({ min: 85, max: 200 }), (value) => {
          const result = scoreMetric(value, benchmark, "higher-is-better");
          return result.score === 100;
        }),
        { numRuns: 100 }
      );
    });

    it("returns 'poor' rating below poor threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: -200, max: 39 }), (value) => {
          const result = scoreMetric(value, benchmark, "higher-is-better");
          return result.rating === "poor";
        }),
        { numRuns: 100 }
      );
    });

    it("handles NaN gracefully", () => {
      const result = scoreMetric(NaN, benchmark, "higher-is-better");
      assert.equal(result.score, 0);
      assert.equal(result.rating, "poor");
    });
  });

  describe("scoreMetric — lower-is-better", () => {
    const benchmark = { good: 1, average: 5, poor: 15 };

    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 30 }), (value) => {
          const result = scoreMetric(value, benchmark, "lower-is-better");
          return result.score >= 0 && result.score <= 100;
        }),
        { numRuns: 200 }
      );
    });

    it("returns score 100 for value <= good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: -100, max: 1 }), (value) => {
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

    it("scores 90+ return A", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 100 }), (score) => {
          return computeGrade(score) === "A";
        }),
        { numRuns: 50 }
      );
    });

    it("scores < 60 return F", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 59 }), (score) => {
          return computeGrade(score) === "F";
        }),
        { numRuns: 50 }
      );
    });

    it("grade boundaries are correct", () => {
      assert.equal(computeGrade(90), "A");
      assert.equal(computeGrade(80), "B");
      assert.equal(computeGrade(70), "C");
      assert.equal(computeGrade(60), "D");
      assert.equal(computeGrade(59), "F");
    });
  });

  describe("compositeScore", () => {
    it("always returns score in [0, 100] with multiple categories", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 5 }),
          (scores) => {
            const categoryScores = {};
            const weights = {};
            scores.forEach((s, i) => {
              categoryScores[`cat${i}`] = { score: s };
              weights[`cat${i}`] = 1.0;
            });
            const result = compositeScore(categoryScores, weights);
            return result.score >= 0 && result.score <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("grade is valid for all composite scores", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
          const result = compositeScore({ c: { score } }, { c: 1 });
          return VALID_GRADES.has(result.grade);
        }),
        { numRuns: 100 }
      );
    });
  });
});
