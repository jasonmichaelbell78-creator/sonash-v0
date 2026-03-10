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

describe("doc-ecosystem scoring lib — property tests", () => {
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

    it("returns score of 100 for value >= good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 200 }), (value) => {
          const result = scoreMetric(value, benchmark, "higher-is-better");
          return result.score === 100;
        }),
        { numRuns: 100 }
      );
    });

    it("returns rating 'good' for value >= good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 200 }), (value) => {
          const result = scoreMetric(value, benchmark, "higher-is-better");
          return result.rating === "good";
        }),
        { numRuns: 100 }
      );
    });

    it("returns rating 'poor' for value below poor threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: -200, max: 49 }), (value) => {
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
    const benchmark = { good: 0, average: 5, poor: 10 };

    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(fc.integer({ min: -10, max: 30 }), (value) => {
          const result = scoreMetric(value, benchmark, "lower-is-better");
          return result.score >= 0 && result.score <= 100;
        }),
        { numRuns: 200 }
      );
    });

    it("returns score of 100 for value <= good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: -100, max: 0 }), (value) => {
          const result = scoreMetric(value, benchmark, "lower-is-better");
          return result.score === 100;
        }),
        { numRuns: 100 }
      );
    });

    it("returns rating 'good' for value <= good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: -100, max: 0 }), (value) => {
          const result = scoreMetric(value, benchmark, "lower-is-better");
          return result.rating === "good";
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("computeGrade", () => {
    it("always returns a valid grade letter", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
          const grade = computeGrade(score);
          return VALID_GRADES.has(grade);
        }),
        { numRuns: 200 }
      );
    });

    it("score >= 90 returns A", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 100 }), (score) => {
          return computeGrade(score) === "A";
        }),
        { numRuns: 50 }
      );
    });

    it("score < 60 returns F", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 59 }), (score) => {
          return computeGrade(score) === "F";
        }),
        { numRuns: 50 }
      );
    });

    it("boundary: score 60 returns D", () => {
      assert.equal(computeGrade(60), "D");
    });

    it("boundary: score 70 returns C", () => {
      assert.equal(computeGrade(70), "C");
    });

    it("boundary: score 80 returns B", () => {
      assert.equal(computeGrade(80), "B");
    });
  });

  describe("compositeScore", () => {
    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(
          fc.record({
            catA: fc.integer({ min: 0, max: 100 }),
            catB: fc.integer({ min: 0, max: 100 }),
          }),
          ({ catA, catB }) => {
            const categoryScores = {
              catA: { score: catA, rating: "good" },
              catB: { score: catB, rating: "good" },
            };
            const weights = { catA: 0.5, catB: 0.5 };
            const result = compositeScore(categoryScores, weights);
            return result.score >= 0 && result.score <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("composite score grade is always valid", () => {
      fc.assert(
        fc.property(
          fc.record({
            catA: fc.integer({ min: 0, max: 100 }),
          }),
          ({ catA }) => {
            const result = compositeScore({ catA: { score: catA, rating: "good" } }, { catA: 1.0 });
            return VALID_GRADES.has(result.grade);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("empty category scores returns score 0", () => {
      const result = compositeScore({}, { catA: 1.0 });
      assert.equal(result.score, 0);
    });
  });
});
