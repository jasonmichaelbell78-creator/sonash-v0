/* eslint-disable no-undef */
"use strict";

/**
 * Tests for checkers/ecosystem-integration.js (CJS)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const CHECKER_PATH = path.join(__dirname, "..", "ecosystem-integration.js");
const UTILS_PATH = require.resolve(path.join(__dirname, "..", "..", "lib", "utils.js"));
const origUtils = require.cache[UTILS_PATH];

function makeSuccess(output = "") {
  return { success: true, output, stderr: "", code: 0 };
}
function makeFail(output = "", stderr = "") {
  return { success: false, output, stderr, code: 1 };
}

function loadChecker({ runCommandSafe, safeReadLines } = {}) {
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
      safeReadLines: safeReadLines || (() => []),
      runCommandSafe: runCommandSafe || (() => makeSuccess("")),
      findProjectRoot: () => "/fake/root",
    },
  };
  delete require.cache[CHECKER_PATH];
  const checker = require(CHECKER_PATH);
  if (origUtils) require.cache[UTILS_PATH] = origUtils;
  else delete require.cache[UTILS_PATH];
  return checker;
}

describe("checkEcosystemIntegration", () => {
  it("returns no_data=false and metrics object on empty data", () => {
    const { checkEcosystemIntegration } = loadChecker();
    const r = checkEcosystemIntegration();
    assert.equal(r.no_data, false);
    assert.ok(typeof r.metrics === "object");
  });

  it("includes all 8 expected metric keys", () => {
    const { checkEcosystemIntegration } = loadChecker();
    const r = checkEcosystemIntegration();
    for (const key of [
      "avg_fix_ratio",
      "avg_rounds",
      "review_count",
      "ci_failures",
      "sonar_issues",
      "velocity_avg",
      "reviews_missing",
      "churn_pct",
    ]) {
      assert.ok(key in r.metrics, `missing key: ${key}`);
    }
  });

  it("returns review_count=0 when review-metrics.jsonl is empty", () => {
    const { checkEcosystemIntegration } = loadChecker({ safeReadLines: () => [] });
    assert.equal(checkEcosystemIntegration().metrics.review_count.value, 0);
  });

  it("computes avg_fix_ratio from recent review-metrics entries", () => {
    const entries = [
      JSON.stringify({ fix_ratio: 0.1 }),
      JSON.stringify({ fix_ratio: 0.2 }),
      JSON.stringify({ fix_ratio: 0.3 }),
    ];
    let callCount = 0;
    const { checkEcosystemIntegration } = loadChecker({
      safeReadLines: () => {
        callCount++;
        return callCount === 1 ? entries : [];
      },
    });
    const r = checkEcosystemIntegration();
    assert.ok(
      Math.abs(r.metrics.avg_fix_ratio.value - 0.2) < 0.01,
      `got ${r.metrics.avg_fix_ratio.value}`
    );
  });

  it("computes avg_rounds from review_rounds field", () => {
    const entries = [
      JSON.stringify({ fix_ratio: 0.1, review_rounds: 2 }),
      JSON.stringify({ fix_ratio: 0.2, review_rounds: 4 }),
    ];
    let callCount = 0;
    const { checkEcosystemIntegration } = loadChecker({
      safeReadLines: () => {
        callCount++;
        return callCount === 1 ? entries : [];
      },
    });
    assert.equal(checkEcosystemIntegration().metrics.avg_rounds.value, 3.0);
  });

  it("counts ci_failures from gh run list JSON output", () => {
    const ghRuns = [
      { conclusion: "failure" },
      { conclusion: "success" },
      { conclusion: "failure" },
    ];
    const { checkEcosystemIntegration } = loadChecker({
      runCommandSafe: (bin, args) => {
        if (bin === "gh" && args[0] === "run") return makeSuccess(JSON.stringify(ghRuns));
        return makeSuccess("");
      },
    });
    assert.equal(checkEcosystemIntegration().metrics.ci_failures.value, 2);
  });

  it("sets ci_failures=0 when gh command fails", () => {
    const { checkEcosystemIntegration } = loadChecker({
      runCommandSafe: (bin) => (bin === "gh" ? makeFail("", "not found") : makeSuccess("")),
    });
    assert.equal(checkEcosystemIntegration().metrics.ci_failures.value, 0);
  });

  it("parses churn_pct from review:churn output", () => {
    const { checkEcosystemIntegration } = loadChecker({
      runCommandSafe: (bin, args) => {
        if (args && args[1] === "review:churn") return makeSuccess("Review churn: 22.5%");
        return makeSuccess("");
      },
    });
    assert.ok(Math.abs(checkEcosystemIntegration().metrics.churn_pct.value - 22.5) < 0.01);
  });

  it("computes velocity_avg from velocity-log entries", () => {
    const velEntries = [
      JSON.stringify({ items_completed: 4 }),
      JSON.stringify({ items_completed: 6 }),
    ];
    let callCount = 0;
    const { checkEcosystemIntegration } = loadChecker({
      safeReadLines: () => {
        callCount++;
        return callCount === 1 ? [] : velEntries;
      },
    });
    assert.equal(checkEcosystemIntegration().metrics.velocity_avg.value, 5.0);
  });

  it("all metric scores are in [0, 100]", () => {
    const badEntries = [
      JSON.stringify({ fix_ratio: 0.5, review_rounds: 8 }),
      JSON.stringify({ fix_ratio: 0.4, review_rounds: 6 }),
    ];
    let callCount = 0;
    const { checkEcosystemIntegration } = loadChecker({
      safeReadLines: () => {
        callCount++;
        return callCount === 1 ? badEntries : [];
      },
      runCommandSafe: (bin, args) => {
        if (bin === "gh")
          return makeSuccess(
            JSON.stringify([
              { conclusion: "failure" },
              { conclusion: "failure" },
              { conclusion: "failure" },
            ])
          );
        if (args && args[1] === "sonar:check") return makeFail("5 conditions failed");
        return makeSuccess("");
      },
    });
    const r = checkEcosystemIntegration();
    for (const [key, metric] of Object.entries(r.metrics)) {
      assert.ok(
        metric.score >= 0 && metric.score <= 100,
        `"${key}" score ${metric.score} out of [0,100]`
      );
    }
  });
});
