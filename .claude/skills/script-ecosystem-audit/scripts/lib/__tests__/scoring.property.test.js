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

describe("script-ecosystem scoring lib — property tests", () => {
  describe("scoreMetric — higher-is-better", () => {
    const benchmark = { good: 95, average: 80, poor: 60 };

    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(fc.integer({ min: -300, max: 300 }), (value) => {
          const result = scoreMetric(value, benchmark, "higher-is-better");
          return result.score >= 0 && result.score <= 100;
        }),
        { numRuns: 200 }
      );
    });

    it("returns score 100 for value >= good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: 95, max: 300 }), (value) => {
          const result = scoreMetric(value, benchmark, "higher-is-better");
          return result.score === 100;
        }),
        { numRuns: 100 }
      );
    });

    it("returns 'average' rating in the average band", () => {
      fc.assert(
        fc.property(fc.integer({ min: 80, max: 94 }), (value) => {
          const result = scoreMetric(value, benchmark, "higher-is-better");
          return result.rating === "average";
        }),
        { numRuns: 100 }
      );
    });

    it("score is monotonically non-decreasing as value increases (higher-is-better)", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }), (a, b) => {
          const lo = Math.min(a, b);
          const hi = Math.max(a, b);
          const scoreLo = scoreMetric(lo, benchmark, "higher-is-better").score;
          const scoreHi = scoreMetric(hi, benchmark, "higher-is-better").score;
          return scoreLo <= scoreHi;
        }),
        { numRuns: 200 }
      );
    });
  });

  describe("scoreMetric — lower-is-better", () => {
    const benchmark = { good: 0, average: 5, poor: 20 };

    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(fc.integer({ min: -5, max: 40 }), (value) => {
          const result = scoreMetric(value, benchmark, "lower-is-better");
          return result.score >= 0 && result.score <= 100;
        }),
        { numRuns: 200 }
      );
    });

    it("score is monotonically non-increasing as value increases (lower-is-better)", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 25 }), fc.integer({ min: 0, max: 25 }), (a, b) => {
          const lo = Math.min(a, b);
          const hi = Math.max(a, b);
          const scoreLo = scoreMetric(lo, benchmark, "lower-is-better").score;
          const scoreHi = scoreMetric(hi, benchmark, "lower-is-better").score;
          return scoreLo >= scoreHi;
        }),
        { numRuns: 200 }
      );
    });
  });

  describe("computeGrade", () => {
    it("always returns a valid grade", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
          return VALID_GRADES.has(computeGrade(score));
        }),
        { numRuns: 200 }
      );
    });

    it("grade ordering is preserved: higher score = better or equal grade", () => {
      const gradeOrder = { A: 5, B: 4, C: 3, D: 2, F: 1 };
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }), (a, b) => {
          const lo = Math.min(a, b);
          const hi = Math.max(a, b);
          const gradeLo = computeGrade(lo);
          const gradeHi = computeGrade(hi);
          return gradeOrder[gradeLo] <= gradeOrder[gradeHi];
        }),
        { numRuns: 200 }
      );
    });

    it("exact boundaries", () => {
      assert.equal(computeGrade(100), "A");
      assert.equal(computeGrade(90), "A");
      assert.equal(computeGrade(89), "B");
      assert.equal(computeGrade(80), "B");
      assert.equal(computeGrade(79), "C");
      assert.equal(computeGrade(70), "C");
      assert.equal(computeGrade(69), "D");
      assert.equal(computeGrade(60), "D");
      assert.equal(computeGrade(59), "F");
      assert.equal(computeGrade(0), "F");
    });
  });

  describe("compositeScore", () => {
    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(
          fc.record({
            a: fc.integer({ min: 0, max: 100 }),
            b: fc.integer({ min: 0, max: 100 }),
            c: fc.integer({ min: 0, max: 100 }),
          }),
          ({ a, b, c }) => {
            const result = compositeScore(
              { a: { score: a }, b: { score: b }, c: { score: c } },
              { a: 1, b: 2, c: 1 }
            );
            return result.score >= 0 && result.score <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("breakdown sums are consistent with weights", () => {
      const result = compositeScore({ cat: { score: 80 } }, { cat: 1.0 });
      assert.equal(result.score, 80);
      assert.equal(result.grade, "B");
    });
  });
});
