/* eslint-disable no-undef */
"use strict";

/**
 * Tests for checkers/code-quality.js (CJS)
 *
 * Strategy: inject fake modules into require.cache before loading the checker,
 * so destructured imports in the checker get our stubs.
 */

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const CHECKER_PATH = path.join(__dirname, "..", "code-quality.js");
const UTILS_PATH = require.resolve(path.join(__dirname, "..", "..", "lib", "utils.js"));
const SCORING_PATH = require.resolve(path.join(__dirname, "..", "..", "lib", "scoring.js"));

// Keep original cache entries so we can restore
const origUtils = require.cache[UTILS_PATH];
const origScoring = require.cache[SCORING_PATH];

// Real scoring for accurate metric validation
const realScoring = require(SCORING_PATH);

function makeSuccess(output = "") {
  return { success: true, output, stderr: "", code: 0 };
}
function makeFail(output = "", stderr = "") {
  return { success: false, output, stderr, code: 1 };
}

function loadChecker(runCommandSafeFn) {
  // Inject fake utils
  require.cache[UTILS_PATH] = {
    id: UTILS_PATH,
    filename: UTILS_PATH,
    loaded: true,
    exports: {
      runCommandSafe: runCommandSafeFn || (() => makeSuccess("")),
      ROOT_DIR: "/fake/root",
      safeParse: (s, fb = null) => {
        try {
          return JSON.parse(s);
        } catch {
          return fb;
        }
      },
      safeReadLines: () => [],
      findProjectRoot: () => "/fake/root",
    },
  };
  // Use real scoring
  require.cache[SCORING_PATH] = {
    id: SCORING_PATH,
    filename: SCORING_PATH,
    loaded: true,
    exports: realScoring,
  };

  // Reload checker fresh
  delete require.cache[CHECKER_PATH];
  const checker = require(CHECKER_PATH);

  // Restore
  if (origUtils) require.cache[UTILS_PATH] = origUtils;
  else delete require.cache[UTILS_PATH];
  if (origScoring) require.cache[SCORING_PATH] = origScoring;
  else delete require.cache[SCORING_PATH];

  return checker;
}

describe("checkCodeQuality", () => {
  it("returns no_data=false and a metrics object on clean run", () => {
    const { checkCodeQuality } = loadChecker(() => makeSuccess("All good"));
    const result = checkCodeQuality();
    assert.equal(result.no_data, false);
    assert.ok(typeof result.metrics === "object" && result.metrics !== null);
  });

  it("includes all 8 expected metric keys", () => {
    const { checkCodeQuality } = loadChecker(() => makeSuccess(""));
    const result = checkCodeQuality();
    const expected = [
      "ts_errors",
      "eslint_errors",
      "eslint_warnings",
      "pattern_violations",
      "circular_deps",
      "ts_strict_coverage",
      "lint_fix_ratio",
      "code_style_score",
    ];
    for (const key of expected) {
      assert.ok(key in result.metrics, `missing key: ${key}`);
    }
  });

  it("reports 0 ts errors when type-check succeeds", () => {
    const { checkCodeQuality } = loadChecker(() => makeSuccess("Compilation successful"));
    assert.equal(checkCodeQuality().metrics.ts_errors.value, 0);
  });

  it("parses ts error count from compiler output", () => {
    const { checkCodeQuality } = loadChecker((bin, args) => {
      if ((bin === "npm" && args[1] === "type-check") || (bin === "npx" && args[0] === "tsc")) {
        return makeFail("Found 7 errors in project");
      }
      return makeSuccess("");
    });
    assert.equal(checkCodeQuality().metrics.ts_errors.value, 7);
  });

  it("falls back to npx tsc when type-check script is Missing", () => {
    let npxCalled = false;
    const { checkCodeQuality } = loadChecker((bin, args) => {
      if (bin === "npm" && args[1] === "type-check")
        return makeFail("Missing script: type-check", "Missing script");
      if (bin === "npx" && args[0] === "tsc") {
        npxCalled = true;
        return makeSuccess("No errors");
      }
      return makeSuccess("");
    });
    checkCodeQuality();
    assert.ok(npxCalled, "should call npx tsc as fallback");
  });

  it("parses eslint errors and warnings counts", () => {
    const { checkCodeQuality } = loadChecker((bin, args) => {
      if (args[1] === "lint") return makeFail("3 errors\n8 warnings detected");
      return makeSuccess("");
    });
    const r = checkCodeQuality();
    assert.equal(r.metrics.eslint_errors.value, 3);
    assert.equal(r.metrics.eslint_warnings.value, 8);
  });

  it("parses pattern violations count", () => {
    const { checkCodeQuality } = loadChecker((bin, args) => {
      if (args[1] === "patterns:check") return makeFail("5 violations found");
      return makeSuccess("");
    });
    assert.equal(checkCodeQuality().metrics.pattern_violations.value, 5);
  });

  it("all metric scores are in [0, 100]", () => {
    const { checkCodeQuality } = loadChecker((bin, args) => {
      if (args[1] === "type-check") return makeFail("Found 20 errors");
      if (args[1] === "lint") return makeFail("10 errors\n50 warnings");
      if (args[1] === "patterns:check") return makeFail("10 violations found");
      if (args[1] === "deps:circular") return makeFail("5 circular dependencies");
      return makeSuccess("");
    });
    const result = checkCodeQuality();
    for (const [key, metric] of Object.entries(result.metrics)) {
      assert.ok(
        metric.score >= 0 && metric.score <= 100,
        `metric "${key}" score ${metric.score} out of [0,100]`
      );
    }
  });

  it("each metric has value, score, rating, and benchmark fields", () => {
    const { checkCodeQuality } = loadChecker(() => makeSuccess(""));
    const result = checkCodeQuality();
    for (const [key, metric] of Object.entries(result.metrics)) {
      assert.ok("value" in metric, `"${key}" missing value`);
      assert.ok("score" in metric, `"${key}" missing score`);
      assert.ok("rating" in metric, `"${key}" missing rating`);
      assert.ok("benchmark" in metric, `"${key}" missing benchmark`);
    }
  });

  it("skips circular dep count when Missing script returned", () => {
    const { checkCodeQuality } = loadChecker((bin, args) => {
      if (args[1] === "deps:circular")
        return makeFail("Missing script: deps:circular", "Missing script");
      return makeSuccess("");
    });
    assert.equal(checkCodeQuality().metrics.circular_deps.value, 0);
  });
});
