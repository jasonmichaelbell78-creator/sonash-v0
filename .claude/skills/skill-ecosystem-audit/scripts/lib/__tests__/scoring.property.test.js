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

describe("skill-ecosystem scoring lib — property tests", () => {
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

    it("returns 100 for value at or above good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 200 }), (value) => {
          return scoreMetric(value, benchmark, "higher-is-better").score === 100;
        }),
        { numRuns: 100 }
      );
    });

    it("returns 'poor' rating for very low values", () => {
      fc.assert(
        fc.property(fc.integer({ min: -200, max: 49 }), (value) => {
          return scoreMetric(value, benchmark, "higher-is-better").rating === "poor";
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("scoreMetric — lower-is-better", () => {
    const benchmark = { good: 0, average: 3, poor: 10 };

    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(fc.integer({ min: -5, max: 15 }), (value) => {
          const result = scoreMetric(value, benchmark, "lower-is-better");
          return result.score >= 0 && result.score <= 100;
        }),
        { numRuns: 200 }
      );
    });

    it("returns 100 for value <= good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: -100, max: 0 }), (value) => {
          return scoreMetric(value, benchmark, "lower-is-better").score === 100;
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

    it("grade is monotonically non-decreasing with score", () => {
      const gradeOrder = { A: 5, B: 4, C: 3, D: 2, F: 1 };
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }), (a, b) => {
          const lo = Math.min(a, b);
          const hi = Math.max(a, b);
          return gradeOrder[computeGrade(lo)] <= gradeOrder[computeGrade(hi)];
        }),
        { numRuns: 200 }
      );
    });

    it("all boundary values correct", () => {
      assert.equal(computeGrade(90), "A");
      assert.equal(computeGrade(80), "B");
      assert.equal(computeGrade(70), "C");
      assert.equal(computeGrade(60), "D");
      assert.equal(computeGrade(59), "F");
    });
  });

  describe("compositeScore", () => {
    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(
          fc.record({
            structural: fc.integer({ min: 0, max: 100 }),
            crossRef: fc.integer({ min: 0, max: 100 }),
            coverage: fc.integer({ min: 0, max: 100 }),
          }),
          ({ structural, crossRef, coverage }) => {
            const result = compositeScore(
              {
                structural: { score: structural },
                cross_ref: { score: crossRef },
                coverage: { score: coverage },
              },
              { structural: 0.4, cross_ref: 0.3, coverage: 0.3 }
            );
            return result.score >= 0 && result.score <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("breakdown is included in result", () => {
      const result = compositeScore({ cat: { score: 75 } }, { cat: 1.0 });
      assert.ok(typeof result.breakdown === "object");
      assert.ok(result.breakdown.cat !== undefined);
    });
  });
});
