/* eslint-disable no-undef */
"use strict";

/**
 * Tests for checkers/learning-effectiveness.js (CJS)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const realFs = require("node:fs");

const CHECKER_PATH = path.join(__dirname, "..", "learning-effectiveness.js");
const UTILS_PATH = require.resolve(path.join(__dirname, "..", "..", "lib", "utils.js"));

const origUtils = require.cache[UTILS_PATH];
const origReadFileSync = realFs.readFileSync;

// Load checker once with faked utils
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
    safeReadLines: () => [],
    runCommandSafe: () => ({ success: true, output: "", stderr: "", code: 0 }),
    findProjectRoot: () => "/fake/root",
  },
};
delete require.cache[CHECKER_PATH];
const { checkLearningEffectiveness } = require(CHECKER_PATH);
if (origUtils) require.cache[UTILS_PATH] = origUtils;
else delete require.cache[UTILS_PATH];

function makeContent(overrides = {}) {
  const f = {
    violationsPerPr: 2.5,
    vprSignal: "ok",
    recurringCats: 5,
    totalCats: 10,
    recPct: "50.0",
    recSignal: "ok",
    ...overrides,
  };
  return [
    "| Metric | Value | Signal |",
    "| --- | --- | --- |",
    `| Violations per PR (30-day) | ${f.violationsPerPr} | ${f.vprSignal} |`,
    `| Recurring categories | ${f.recurringCats}/${f.totalCats} (${f.recPct}%) | ${f.recSignal} |`,
  ].join("\n");
}

describe("checkLearningEffectiveness", () => {
  it("returns no_data=true when LEARNING_METRICS.md is missing", () => {
    realFs.readFileSync = () => {
      throw new Error("ENOENT");
    };
    try {
      const r = checkLearningEffectiveness();
      assert.equal(r.no_data, true);
      assert.deepEqual(r.metrics, {});
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("returns no_data=true when file has no matching metrics", () => {
    realFs.readFileSync = () => "# Nothing useful here\n\nJust text.";
    try {
      const r = checkLearningEffectiveness();
      assert.equal(r.no_data, true);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("returns no_data=false when at least one metric is found", () => {
    realFs.readFileSync = () => "| Violations per PR (30-day) | 3.5 | ok |";
    try {
      assert.equal(checkLearningEffectiveness().no_data, false);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("parses violations_per_pr correctly", () => {
    realFs.readFileSync = () => makeContent({ violationsPerPr: 1.25 });
    try {
      const r = checkLearningEffectiveness();
      assert.ok("violations_per_pr" in r.metrics);
      assert.equal(r.metrics.violations_per_pr.value, 1.25);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("parses recurrence_rate correctly", () => {
    realFs.readFileSync = () => makeContent({ recPct: "33.3" });
    try {
      const r = checkLearningEffectiveness();
      assert.ok("recurrence_rate" in r.metrics);
      assert.equal(r.metrics.recurrence_rate.value, 33.3);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("skips violations_per_pr when signal is insufficient_data", () => {
    realFs.readFileSync = () => makeContent({ vprSignal: "insufficient_data" });
    try {
      const r = checkLearningEffectiveness();
      assert.ok(!("violations_per_pr" in r.metrics));
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("still includes recurrence_rate when vpr signal is insufficient_data", () => {
    realFs.readFileSync = () => makeContent({ vprSignal: "insufficient_data" });
    try {
      const r = checkLearningEffectiveness();
      assert.ok("recurrence_rate" in r.metrics);
      assert.equal(r.no_data, false);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("omits violations_per_pr when not present in file", () => {
    realFs.readFileSync = () => "| Recurring categories | 3/8 (37.5%) | ok |";
    try {
      const r = checkLearningEffectiveness();
      assert.ok(!("violations_per_pr" in r.metrics));
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("all metric scores are in [0, 100]", () => {
    realFs.readFileSync = () =>
      makeContent({
        violationsPerPr: 4,
        recPct: "55.0",
      });
    try {
      const r = checkLearningEffectiveness();
      for (const [key, metric] of Object.entries(r.metrics)) {
        assert.ok(
          metric.score >= 0 && metric.score <= 100,
          `"${key}" score ${metric.score} out of [0,100]`
        );
      }
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("scores violations_per_pr as good when value is low", () => {
    realFs.readFileSync = () => makeContent({ violationsPerPr: 0.5 });
    try {
      const r = checkLearningEffectiveness();
      assert.equal(r.metrics.violations_per_pr.rating, "good");
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("scores recurrence_rate as poor when value is high", () => {
    realFs.readFileSync = () => makeContent({ recPct: "75.0" });
    try {
      const r = checkLearningEffectiveness();
      assert.equal(r.metrics.recurrence_rate.rating, "poor");
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });
});
