/* eslint-disable no-undef */
"use strict";

/**
 * Tests for checkers/data-effectiveness.js (CJS)
 *
 * Wave 7 of the Data Effectiveness Audit.
 * Metrics: avg_lifecycle_score, below_threshold_pct, recall_coverage,
 *          action_coverage, orphan_count
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const CHECKER_PATH = path.join(__dirname, "..", "data-effectiveness.js");
const UTILS_PATH = require.resolve(path.join(__dirname, "..", "..", "lib", "utils.js"));

// -------------------------------------------------------------------------
// Cache manipulation helpers
// -------------------------------------------------------------------------

const origUtils = require.cache[UTILS_PATH];

/**
 * Load a fresh copy of the checker with safeReadLines replaced by `linesFn`.
 * The cache entry is deleted after loading so each call gets a fresh module.
 */
function loadChecker(linesFn) {
  require.cache[UTILS_PATH] = {
    id: UTILS_PATH,
    filename: UTILS_PATH,
    loaded: true,
    exports: {
      ROOT_DIR: "/fake/root",
      safeParse: (s, fb = null) => {
        try {
          return JSON.parse(s);
        } catch {
          return fb;
        }
      },
      safeReadLines: linesFn,
      runCommandSafe: () => ({ success: true, output: "", stderr: "", code: 0 }),
      findProjectRoot: () => "/fake/root",
    },
  };

  delete require.cache[CHECKER_PATH];
  const mod = require(CHECKER_PATH);

  // Restore original utils cache entry (or remove the fake)
  if (origUtils) {
    require.cache[UTILS_PATH] = origUtils;
  } else {
    delete require.cache[UTILS_PATH];
  }

  return mod;
}

/** Build a JSONL lines array from an array of plain objects. */
function makeLines(systems) {
  return systems.map((s) => JSON.stringify(s));
}

// -------------------------------------------------------------------------
// Shared fixture data
// -------------------------------------------------------------------------

/**
 * Four systems with totals 3, 6, 9, 12 → avg 7.5
 * recall values: 0, 1, 2, 3  (2 of 4 have recall >= 2)
 * action values: 1, 1, 2, 2  (2 of 4 have action >= 2)
 * orphans (recall === 0): 1 system
 */
const FIXTURE_FOUR = [
  { total: 3, recall: 0, action: 1 },
  { total: 6, recall: 1, action: 1 },
  { total: 9, recall: 2, action: 2 },
  { total: 12, recall: 3, action: 2 },
];

// -------------------------------------------------------------------------
// Describe blocks
// -------------------------------------------------------------------------

describe("checkDataEffectiveness", () => {
  // -----------------------------------------------------------------------
  // Basic functionality
  // -----------------------------------------------------------------------

  describe("basic functionality", () => {
    it("returns valid metrics object with all 5 metric keys", () => {
      const { checkDataEffectiveness } = loadChecker(() => makeLines(FIXTURE_FOUR));
      const result = checkDataEffectiveness();

      assert.ok(result.metrics, "result should have a metrics property");
      const EXPECTED_KEYS = [
        "avg_lifecycle_score",
        "below_threshold_pct",
        "recall_coverage",
        "action_coverage",
        "orphan_count",
      ];
      for (const key of EXPECTED_KEYS) {
        assert.ok(key in result.metrics, `metrics should contain key "${key}"`);
      }
    });

    it("returns no_data: true when lifecycle-scores.jsonl does not exist", () => {
      const { checkDataEffectiveness } = loadChecker(() => []);
      const result = checkDataEffectiveness();

      assert.equal(result.no_data, true);
      assert.deepEqual(result.metrics, {});
    });

    it("returns no_data: true when file is empty (no lines)", () => {
      // safeReadLines returns [] for an empty/missing file
      const { checkDataEffectiveness } = loadChecker(() => []);
      const result = checkDataEffectiveness();

      assert.equal(result.no_data, true);
    });

    it("returns no_data: true when file has only lines that lack a numeric total field", () => {
      const lines = [
        JSON.stringify({ recall: 2, action: 1 }), // no total
        JSON.stringify({ total: "not-a-number" }), // total not a number
        "not-json-at-all",
      ];
      const { checkDataEffectiveness } = loadChecker(() => lines);
      const result = checkDataEffectiveness();

      assert.equal(result.no_data, true);
    });

    it("all metric scores are numbers between 0 and 100", () => {
      const { checkDataEffectiveness } = loadChecker(() => makeLines(FIXTURE_FOUR));
      const result = checkDataEffectiveness();

      for (const [key, metric] of Object.entries(result.metrics)) {
        assert.ok(typeof metric.score === "number", `"${key}" score should be a number`);
        assert.ok(
          metric.score >= 0 && metric.score <= 100,
          `"${key}" score ${metric.score} is outside [0, 100]`
        );
      }
    });
  });

  // -----------------------------------------------------------------------
  // avg_lifecycle_score metric
  // -----------------------------------------------------------------------

  describe("avg_lifecycle_score metric", () => {
    it("computes correct average from sample data (3 + 6 + 9 + 12 = 30, avg = 7.5)", () => {
      const { checkDataEffectiveness } = loadChecker(() => makeLines(FIXTURE_FOUR));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.avg_lifecycle_score.value, 7.5);
    });

    it("higher averages produce higher scores (avg=12 should score higher than avg=4)", () => {
      const highSystems = [{ total: 12, recall: 3, action: 3 }];
      const lowSystems = [{ total: 4, recall: 1, action: 1 }];

      const { checkDataEffectiveness: checkHigh } = loadChecker(() => makeLines(highSystems));
      const { checkDataEffectiveness: checkLow } = loadChecker(() => makeLines(lowSystems));

      const highScore = checkHigh().metrics.avg_lifecycle_score.score;
      const lowScore = checkLow().metrics.avg_lifecycle_score.score;

      assert.ok(
        highScore > lowScore,
        `avg=12 score (${highScore}) should exceed avg=4 score (${lowScore})`
      );
    });

    it("avg at or above the good benchmark (9) produces score of 100", () => {
      const systems = [{ total: 9, recall: 2, action: 2 }];
      const { checkDataEffectiveness } = loadChecker(() => makeLines(systems));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.avg_lifecycle_score.score, 100);
      assert.equal(result.metrics.avg_lifecycle_score.rating, "good");
    });

    it("all-zero totals produce a low score and poor rating", () => {
      const systems = [
        { total: 0, recall: 0, action: 0 },
        { total: 0, recall: 0, action: 0 },
      ];
      const { checkDataEffectiveness } = loadChecker(() => makeLines(systems));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.avg_lifecycle_score.rating, "poor");
      assert.ok(
        result.metrics.avg_lifecycle_score.score < 60,
        `score should be below 60 for all-zero data, got ${result.metrics.avg_lifecycle_score.score}`
      );
    });
  });

  // -----------------------------------------------------------------------
  // below_threshold_pct metric
  // -----------------------------------------------------------------------

  describe("below_threshold_pct metric", () => {
    it("correctly counts systems with total < 6 (1 of 4 in fixture → 25%)", () => {
      // FIXTURE_FOUR has totals [3, 6, 9, 12]; only 3 < 6 → 25%
      const { checkDataEffectiveness } = loadChecker(() => makeLines(FIXTURE_FOUR));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.below_threshold_pct.value, 25);
    });

    it("0% below threshold produces good rating and score of 100", () => {
      const allAbove = [
        { total: 6, recall: 2, action: 2 },
        { total: 8, recall: 3, action: 3 },
        { total: 10, recall: 4, action: 4 },
      ];
      const { checkDataEffectiveness } = loadChecker(() => makeLines(allAbove));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.below_threshold_pct.value, 0);
      assert.equal(result.metrics.below_threshold_pct.score, 100);
      assert.equal(result.metrics.below_threshold_pct.rating, "good");
    });

    it("100% below threshold produces poor rating", () => {
      const allBelow = [
        { total: 1, recall: 0, action: 0 },
        { total: 2, recall: 0, action: 0 },
      ];
      const { checkDataEffectiveness } = loadChecker(() => makeLines(allBelow));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.below_threshold_pct.value, 100);
      assert.equal(result.metrics.below_threshold_pct.rating, "poor");
    });
  });

  // -----------------------------------------------------------------------
  // recall_coverage metric
  // -----------------------------------------------------------------------

  describe("recall_coverage metric", () => {
    it("correctly identifies systems with recall >= 2 (2 of 4 → 50%)", () => {
      // FIXTURE_FOUR recall values: 0, 1, 2, 3 — 2 qualify
      const { checkDataEffectiveness } = loadChecker(() => makeLines(FIXTURE_FOUR));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.recall_coverage.value, 50);
    });

    it("100% recall coverage produces good rating and score of 100", () => {
      const allRecall = [
        { total: 8, recall: 2, action: 1 },
        { total: 9, recall: 3, action: 2 },
        { total: 10, recall: 4, action: 3 },
      ];
      const { checkDataEffectiveness } = loadChecker(() => makeLines(allRecall));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.recall_coverage.value, 100);
      assert.equal(result.metrics.recall_coverage.score, 100);
      assert.equal(result.metrics.recall_coverage.rating, "good");
    });

    it("systems missing the recall field are excluded from recall_coverage count", () => {
      const mixed = [
        { total: 7, action: 2 }, // no recall field
        { total: 8, recall: 2, action: 2 }, // qualifies
      ];
      const { checkDataEffectiveness } = loadChecker(() => makeLines(mixed));
      const result = checkDataEffectiveness();

      // Only 1 of 2 systems has recall >= 2 → 50%
      assert.equal(result.metrics.recall_coverage.value, 50);
    });
  });

  // -----------------------------------------------------------------------
  // action_coverage metric
  // -----------------------------------------------------------------------

  describe("action_coverage metric", () => {
    it("correctly identifies systems with action >= 2 (2 of 4 → 50%)", () => {
      // FIXTURE_FOUR action values: 1, 1, 2, 2 — 2 qualify
      const { checkDataEffectiveness } = loadChecker(() => makeLines(FIXTURE_FOUR));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.action_coverage.value, 50);
    });

    it("low action coverage produces poor rating", () => {
      const lowAction = [
        { total: 5, recall: 2, action: 0 },
        { total: 6, recall: 3, action: 1 },
        { total: 7, recall: 2, action: 0 },
        { total: 8, recall: 3, action: 1 },
        { total: 9, recall: 2, action: 0 }, // 0 of 5 have action >= 2
      ];
      const { checkDataEffectiveness } = loadChecker(() => makeLines(lowAction));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.action_coverage.value, 0);
      assert.equal(result.metrics.action_coverage.rating, "poor");
    });

    it("action_coverage at or above good benchmark (50%) produces score of 100", () => {
      const goodAction = [
        { total: 8, recall: 3, action: 2 },
        { total: 9, recall: 3, action: 2 },
      ];
      const { checkDataEffectiveness } = loadChecker(() => makeLines(goodAction));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.action_coverage.value, 100);
      assert.equal(result.metrics.action_coverage.score, 100);
      assert.equal(result.metrics.action_coverage.rating, "good");
    });
  });

  // -----------------------------------------------------------------------
  // orphan_count metric
  // -----------------------------------------------------------------------

  describe("orphan_count metric", () => {
    it("correctly counts systems where recall === 0 (1 of 4 in fixture)", () => {
      // FIXTURE_FOUR recall values: 0, 1, 2, 3 — 1 orphan
      const { checkDataEffectiveness } = loadChecker(() => makeLines(FIXTURE_FOUR));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.orphan_count.value, 1);
    });

    it("zero orphans produces good rating and score of 100", () => {
      const noOrphans = [
        { total: 7, recall: 1, action: 1 },
        { total: 8, recall: 2, action: 2 },
        { total: 9, recall: 3, action: 3 },
      ];
      const { checkDataEffectiveness } = loadChecker(() => makeLines(noOrphans));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.orphan_count.value, 0);
      assert.equal(result.metrics.orphan_count.score, 100);
      assert.equal(result.metrics.orphan_count.rating, "good");
    });

    it("high orphan count produces poor rating", () => {
      const manyOrphans = [
        { total: 3, recall: 0, action: 0 },
        { total: 2, recall: 0, action: 0 },
        { total: 1, recall: 0, action: 0 },
        { total: 4, recall: 0, action: 0 },
        { total: 5, recall: 0, action: 0 },
        { total: 6, recall: 0, action: 0 }, // 6 orphans → above poor benchmark of 5
      ];
      const { checkDataEffectiveness } = loadChecker(() => makeLines(manyOrphans));
      const result = checkDataEffectiveness();

      assert.equal(result.metrics.orphan_count.value, 6);
      assert.equal(result.metrics.orphan_count.rating, "poor");
    });

    it("systems with recall field missing are not counted as orphans", () => {
      const mixed = [
        { total: 5, action: 1 }, // no recall — should not be an orphan
        { total: 6, recall: 0, action: 1 }, // orphan
        { total: 7, recall: 1, action: 2 }, // not an orphan
      ];
      const { checkDataEffectiveness } = loadChecker(() => makeLines(mixed));
      const result = checkDataEffectiveness();

      // Only the system explicitly having recall === 0 counts
      assert.equal(result.metrics.orphan_count.value, 1);
    });
  });

  // -----------------------------------------------------------------------
  // Integration with scoring system
  // -----------------------------------------------------------------------

  describe("integration with scoring system", () => {
    it("every metric has a string rating field (good | average | poor)", () => {
      const { checkDataEffectiveness } = loadChecker(() => makeLines(FIXTURE_FOUR));
      const result = checkDataEffectiveness();
      const VALID_RATINGS = new Set(["good", "average", "poor"]);

      for (const [key, metric] of Object.entries(result.metrics)) {
        assert.ok(
          VALID_RATINGS.has(metric.rating),
          `"${key}" rating "${metric.rating}" must be good | average | poor`
        );
      }
    });

    it("every metric has a benchmark object with good, average, and poor thresholds", () => {
      const { checkDataEffectiveness } = loadChecker(() => makeLines(FIXTURE_FOUR));
      const result = checkDataEffectiveness();

      for (const [key, metric] of Object.entries(result.metrics)) {
        assert.ok(
          metric.benchmark && typeof metric.benchmark === "object",
          `"${key}" should have a benchmark object`
        );
        assert.ok(
          "good" in metric.benchmark && "average" in metric.benchmark && "poor" in metric.benchmark,
          `"${key}" benchmark should have good, average, and poor fields`
        );
      }
    });

    it("data-effectiveness checker is registered in CHECKER_TO_CATEGORY with Data Effectiveness category", () => {
      const { CHECKER_TO_CATEGORY } = require(
        path.join(__dirname, "..", "..", "lib", "composite.js")
      );

      assert.equal(
        CHECKER_TO_CATEGORY["data-effectiveness"],
        "Data Effectiveness",
        "data-effectiveness checker must map to Data Effectiveness category"
      );
    });

    it("Data Effectiveness category has a non-zero weight in CATEGORY_WEIGHTS", () => {
      const { CATEGORY_WEIGHTS } = require(path.join(__dirname, "..", "..", "lib", "composite.js"));

      const weight = CATEGORY_WEIGHTS["Data Effectiveness"];
      assert.ok(
        typeof weight === "number" && weight > 0,
        `Data Effectiveness weight should be a positive number, got ${weight}`
      );
    });

    it("data-effectiveness dimension is registered in DIMENSIONS with all 5 metric keys", () => {
      const { DIMENSIONS } = require(path.join(__dirname, "..", "..", "lib", "dimensions.js"));

      const dim = DIMENSIONS.find((d) => d.id === "data-effectiveness");
      assert.ok(dim, "data-effectiveness dimension should exist in DIMENSIONS");

      const EXPECTED_KEYS = [
        "avg_lifecycle_score",
        "below_threshold_pct",
        "recall_coverage",
        "action_coverage",
        "orphan_count",
      ];
      for (const key of EXPECTED_KEYS) {
        assert.ok(
          dim.metricKeys.includes(key),
          `data-effectiveness dimension should list metric key "${key}"`
        );
      }
    });

    it("metric value field is rounded to at most 2 decimal places", () => {
      // Use totals that produce a repeating decimal without rounding: 1/3 = 0.333...
      const unevenSystems = [
        { total: 1, recall: 0, action: 0 },
        { total: 2, recall: 0, action: 0 },
        { total: 0, recall: 0, action: 0 }, // avg = 1, no rounding issue; use below_threshold instead
      ];
      // All 3 systems have total < 6 → below_threshold_pct = 100% (clean)
      // To exercise rounding: use 3 systems, 1 with recall >= 2 → 1/3 * 100 = 33.33...
      const roundingSystems = [
        { total: 7, recall: 2, action: 1 },
        { total: 8, recall: 0, action: 0 },
        { total: 9, recall: 0, action: 0 },
      ];
      const { checkDataEffectiveness } = loadChecker(() => makeLines(roundingSystems));
      const result = checkDataEffectiveness();

      const val = result.metrics.recall_coverage.value;
      const decimalPart = String(val).split(".")[1];
      assert.ok(
        !decimalPart || decimalPart.length <= 2,
        `recall_coverage value ${val} should have at most 2 decimal places`
      );
    });
  });
});
