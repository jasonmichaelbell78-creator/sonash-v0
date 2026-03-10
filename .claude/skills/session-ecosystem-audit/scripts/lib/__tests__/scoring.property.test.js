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

describe("session-ecosystem scoring lib — property tests", () => {
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

    it("returns 100 for values at or above good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 200 }), (value) => {
          return scoreMetric(value, benchmark, "higher-is-better").score === 100;
        }),
        { numRuns: 100 }
      );
    });

    it("returns 0 for very low values", () => {
      const result = scoreMetric(-999, benchmark, "higher-is-better");
      assert.equal(result.score, 0);
    });

    it("handles undefined value gracefully", () => {
      const result = scoreMetric(undefined, benchmark, "higher-is-better");
      assert.equal(result.score, 0);
    });
  });

  describe("scoreMetric — lower-is-better", () => {
    const benchmark = { good: 0, average: 5, poor: 10 };

    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(fc.integer({ min: -5, max: 20 }), (value) => {
          const result = scoreMetric(value, benchmark, "lower-is-better");
          return result.score >= 0 && result.score <= 100;
        }),
        { numRuns: 200 }
      );
    });

    it("returns 100 for values at or below good threshold", () => {
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

    it("scores 90-100 are always A", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 100 }), (score) => {
          return computeGrade(score) === "A";
        }),
        { numRuns: 50 }
      );
    });

    it("scores 0-59 are always F", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 59 }), (score) => {
          return computeGrade(score) === "F";
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("compositeScore", () => {
    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(
          fc.record({
            s1: fc.integer({ min: 0, max: 100 }),
            s2: fc.integer({ min: 0, max: 100 }),
          }),
          ({ s1, s2 }) => {
            const result = compositeScore(
              { s1: { score: s1 }, s2: { score: s2 } },
              { s1: 0.5, s2: 0.5 }
            );
            return result.score >= 0 && result.score <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("single category score passes through correctly", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
          const result = compositeScore({ cat: { score } }, { cat: 1.0 });
          return result.score === score;
        }),
        { numRuns: 100 }
      );
    });

    it("grade is valid for all composite scores", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
          const result = compositeScore({ cat: { score } }, { cat: 1.0 });
          return VALID_GRADES.has(result.grade);
        }),
        { numRuns: 100 }
      );
    });

    it("empty categories returns score 0", () => {
      const result = compositeScore({}, { nonExistent: 1.0 });
      assert.equal(result.score, 0);
    });
  });
});
