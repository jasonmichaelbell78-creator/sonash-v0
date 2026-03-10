/* eslint-disable no-undef */
"use strict";

/**
 * Property-based tests for scoring.js using fast-check (CJS)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");
const path = require("node:path");

const { scoreMetric, computeGrade, compositeScore } = require(
  path.join(__dirname, "..", "scoring.js")
);

const VALID_RATINGS = new Set(["good", "average", "poor"]);
const VALID_GRADES = new Set(["A", "B", "C", "D", "F"]);

// Arbitrary: finite number
const finiteNum = fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 });

// Arbitrary: lower-is-better benchmark (good <= average <= poor)
const lowerBench = fc
  .tuple(
    fc.integer({ min: 0, max: 50 }),
    fc.integer({ min: 0, max: 50 }),
    fc.integer({ min: 0, max: 50 })
  )
  .map(([a, b, c]) => {
    const s = [a, b, c].sort((x, y) => x - y);
    return { good: s[0], average: s[1], poor: s[2] };
  });

// Arbitrary: higher-is-better benchmark (good >= average >= poor)
const higherBench = fc
  .tuple(
    fc.integer({ min: 0, max: 100 }),
    fc.integer({ min: 0, max: 100 }),
    fc.integer({ min: 0, max: 100 })
  )
  .map(([a, b, c]) => {
    const s = [a, b, c].sort((x, y) => y - x);
    return { good: s[0], average: s[1], poor: s[2] };
  });

describe("scoreMetric property: score always in [0, 100]", () => {
  it("holds for lower-is-better with any finite value and benchmark", () => {
    fc.assert(
      fc.property(finiteNum, lowerBench, (value, bench) => {
        const r = scoreMetric(value, bench, "lower-is-better");
        return r.score >= 0 && r.score <= 100;
      }),
      { numRuns: 500, seed: 42 }
    );
  });

  it("holds for higher-is-better with any finite value and benchmark", () => {
    fc.assert(
      fc.property(finiteNum, higherBench, (value, bench) => {
        const r = scoreMetric(value, bench, "higher-is-better");
        return r.score >= 0 && r.score <= 100;
      }),
      { numRuns: 500, seed: 43 }
    );
  });

  it("holds for NaN input (returns 0)", () => {
    const bench = { good: 0, average: 5, poor: 10 };
    const r = scoreMetric(Number.NaN, bench);
    assert.ok(r.score >= 0 && r.score <= 100);
  });

  it("holds for string input", () => {
    fc.assert(
      fc.property(fc.string(), lowerBench, (value, bench) => {
        const r = scoreMetric(value, bench);
        return r.score >= 0 && r.score <= 100;
      }),
      { numRuns: 200, seed: 44 }
    );
  });
});

describe("scoreMetric property: rating always in valid set", () => {
  it("holds for any finite value with lower-is-better", () => {
    fc.assert(
      fc.property(finiteNum, lowerBench, (value, bench) => {
        return VALID_RATINGS.has(scoreMetric(value, bench).rating);
      }),
      { numRuns: 500, seed: 45 }
    );
  });

  it("holds for any finite value with higher-is-better", () => {
    fc.assert(
      fc.property(finiteNum, higherBench, (value, bench) => {
        return VALID_RATINGS.has(scoreMetric(value, bench, "higher-is-better").rating);
      }),
      { numRuns: 500, seed: 46 }
    );
  });
});

describe("computeGrade property: always returns valid grade letter", () => {
  it("holds for any integer in [0, 100]", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (score) => {
        return VALID_GRADES.has(computeGrade(score));
      }),
      { numRuns: 500, seed: 47 }
    );
  });

  it("holds for any finite number", () => {
    fc.assert(
      fc.property(finiteNum, (score) => {
        return VALID_GRADES.has(computeGrade(score));
      }),
      { numRuns: 300, seed: 48 }
    );
  });
});

describe("compositeScore property: score always in [0, 100]", () => {
  const categoryEntry = fc
    .tuple(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.integer({ min: 0, max: 100 }),
      fc.boolean()
    )
    .map(([name, score, noData]) => ({ name, score, no_data: noData }));

  it("holds for any set of category scores with equal weights", () => {
    fc.assert(
      fc.property(fc.array(categoryEntry, { minLength: 1, maxLength: 8 }), (entries) => {
        const categoryScores = {};
        const weights = {};
        for (const entry of entries) {
          categoryScores[entry.name] = { score: entry.score, no_data: entry.no_data };
          weights[entry.name] = 1;
        }
        const r = compositeScore(categoryScores, weights);
        return r.score >= 0 && r.score <= 100;
      }),
      { numRuns: 300, seed: 49 }
    );
  });

  it("returns 0 when all entries have no_data=true", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(fc.string({ minLength: 1, maxLength: 10 }), fc.integer({ min: 0, max: 100 })),
          { minLength: 1, maxLength: 6 }
        ),
        (pairs) => {
          const categoryScores = {};
          const weights = {};
          for (const [name, score] of pairs) {
            categoryScores[name] = { score, no_data: true };
            weights[name] = 1;
          }
          return compositeScore(categoryScores, weights).score === 0;
        }
      ),
      { numRuns: 200, seed: 50 }
    );
  });
});
