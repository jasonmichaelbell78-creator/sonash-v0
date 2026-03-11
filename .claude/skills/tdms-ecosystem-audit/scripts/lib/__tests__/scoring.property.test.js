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

describe("tdms-ecosystem scoring lib — property tests", () => {
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

    it("returns 100 for value >= good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 200 }), (value) => {
          return scoreMetric(value, benchmark, "higher-is-better").score === 100;
        }),
        { numRuns: 100 }
      );
    });

    it("returns 0 for extreme negative values", () => {
      const result = scoreMetric(-9999, benchmark, "higher-is-better");
      assert.equal(result.score, 0);
    });

    it("handles non-number types gracefully", () => {
      const result = scoreMetric("not-a-number", benchmark, "higher-is-better");
      assert.equal(result.score, 0);
      assert.equal(result.rating, "poor");
    });
  });

  describe("scoreMetric — lower-is-better", () => {
    const benchmark = { good: 0, average: 5, poor: 20 };

    it("always returns score in [0, 100]", () => {
      fc.assert(
        fc.property(fc.integer({ min: -5, max: 30 }), (value) => {
          const result = scoreMetric(value, benchmark, "lower-is-better");
          return result.score >= 0 && result.score <= 100;
        }),
        { numRuns: 200 }
      );
    });

    it("returns 100 for value at or below good threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: -100, max: 0 }), (value) => {
          return scoreMetric(value, benchmark, "lower-is-better").score === 100;
        }),
        { numRuns: 100 }
      );
    });

    it("returns 'poor' for values above poor threshold", () => {
      fc.assert(
        fc.property(fc.integer({ min: 21, max: 100 }), (value) => {
          return scoreMetric(value, benchmark, "lower-is-better").rating === "poor";
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

    it("all thresholds are correct", () => {
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
            pipeline: fc.integer({ min: 0, max: 100 }),
            quality: fc.integer({ min: 0, max: 100 }),
            safety: fc.integer({ min: 0, max: 100 }),
          }),
          ({ pipeline, quality, safety }) => {
            const result = compositeScore(
              {
                pipeline: { score: pipeline },
                quality: { score: quality },
                safety: { score: safety },
              },
              { pipeline: 0.4, quality: 0.4, safety: 0.2 }
            );
            return result.score >= 0 && result.score <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("single score of 100 produces score of 100", () => {
      const result = compositeScore({ cat: { score: 100 } }, { cat: 1.0 });
      assert.equal(result.score, 100);
      assert.equal(result.grade, "A");
    });

    it("single score of 0 produces score of 0", () => {
      const result = compositeScore({ cat: { score: 0 } }, { cat: 1.0 });
      assert.equal(result.score, 0);
      assert.equal(result.grade, "F");
    });

    it("breakdown contains contribution for each category", () => {
      const result = compositeScore({ a: { score: 80 }, b: { score: 60 } }, { a: 1, b: 1 });
      assert.ok(result.breakdown.a !== undefined);
      assert.ok(result.breakdown.b !== undefined);
    });
  });
});
