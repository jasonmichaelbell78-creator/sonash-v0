/* eslint-disable no-undef */
"use strict";

/**
 * Property-based tests for composite.js using fast-check (CJS)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");
const path = require("node:path");

const { computeCompositeScore, CHECKER_TO_CATEGORY } = require(
  path.join(__dirname, "..", "composite.js")
);

const CHECKER_NAMES = Object.keys(CHECKER_TO_CATEGORY);
const VALID_GRADES = new Set(["A", "B", "C", "D", "F"]);

// Generate a metric entry
const metricEntry = fc
  .tuple(fc.string({ minLength: 1, maxLength: 20 }), fc.integer({ min: 0, max: 100 }))
  .map(([name, score]) => ({ name, entry: { score, value: score } }));

// Generate a checker result with N metrics
function makeCheckerResult(numMetrics) {
  return fc.boolean().chain((noData) => {
    if (noData) return fc.constant({ no_data: true, metrics: {} });
    return fc
      .array(metricEntry, { minLength: numMetrics, maxLength: numMetrics })
      .map((entries) => {
        const metrics = {};
        for (const { name, entry } of entries) metrics[name] = entry;
        return { no_data: false, metrics };
      });
  });
}

// Generate full checker results
const arbitraryCheckerResults = fc.record(
  Object.fromEntries(CHECKER_NAMES.map((name) => [name, makeCheckerResult(3)]))
);

describe("computeCompositeScore property: score always in [0, 100]", () => {
  it("holds for any combination of checker results", () => {
    fc.assert(
      fc.property(arbitraryCheckerResults, (results) => {
        const r = computeCompositeScore(results);
        return r.score >= 0 && r.score <= 100;
      }),
      { numRuns: 200, seed: 100 }
    );
  });

  it("holds when all checkers have no_data (score=0)", () => {
    const noData = Object.fromEntries(
      CHECKER_NAMES.map((n) => [n, { no_data: true, metrics: {} }])
    );
    const r = computeCompositeScore(noData);
    assert.ok(r.score >= 0 && r.score <= 100);
    assert.equal(r.score, 0);
  });

  it("holds for empty results (score=0)", () => {
    const r = computeCompositeScore({});
    assert.ok(r.score >= 0 && r.score <= 100);
  });

  it("holds when checkers alternate between score=0 and score=100", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...CHECKER_NAMES), {
          minLength: 1,
          maxLength: CHECKER_NAMES.length,
        }),
        (names) => {
          const results = {};
          names.forEach((name, idx) => {
            const score = idx % 2 === 0 ? 0 : 100;
            results[name] = { no_data: false, metrics: { m: { score, value: score } } };
          });
          const r = computeCompositeScore(results);
          return r.score >= 0 && r.score <= 100;
        }
      ),
      { numRuns: 150, seed: 101 }
    );
  });
});

describe("computeCompositeScore property: grade always valid", () => {
  it("holds for any combination of checker results", () => {
    fc.assert(
      fc.property(arbitraryCheckerResults, (results) => {
        const r = computeCompositeScore(results);
        return VALID_GRADES.has(r.grade);
      }),
      { numRuns: 200, seed: 102 }
    );
  });

  it("returns F for empty results", () => {
    assert.equal(computeCompositeScore({}).grade, "F");
  });
});

describe("computeCompositeScore property: categoryScores has 9 entries", () => {
  it("holds for any input", () => {
    fc.assert(
      fc.property(arbitraryCheckerResults, (results) => {
        const r = computeCompositeScore(results);
        return Object.keys(r.categoryScores).length === 9;
      }),
      { numRuns: 100, seed: 103 }
    );
  });
});

describe("computeCompositeScore property: monotonicity", () => {
  it("higher input scores produce equal or higher composite score", () => {
    const makeUniform = (score) =>
      Object.fromEntries(
        CHECKER_NAMES.map((name) => [
          name,
          { no_data: false, metrics: { m1: { score, value: score }, m2: { score, value: score } } },
        ])
      );
    const low = computeCompositeScore(makeUniform(50));
    const high = computeCompositeScore(makeUniform(80));
    assert.ok(high.score >= low.score, `high=${high.score} should be >= low=${low.score}`);
  });
});
