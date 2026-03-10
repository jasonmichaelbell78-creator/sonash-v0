/* eslint-disable no-undef */
"use strict";

/**
 * Tests for checkers/test-coverage.js (CJS)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const realFs = require("node:fs");

const CHECKER_PATH = path.join(__dirname, "..", "test-coverage.js");
const UTILS_PATH = require.resolve(path.join(__dirname, "..", "..", "lib", "utils.js"));

const origUtils = require.cache[UTILS_PATH];
const origReaddirSync = realFs.readdirSync;

// Load checker once; safeReadLines routed through mutable ref
let safeReadLinesFn = (_path) => [];

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
    safeReadLines: (...args) => safeReadLinesFn(...args),
    runCommandSafe: () => ({ success: true, output: "", stderr: "", code: 0 }),
    findProjectRoot: () => "/fake/root",
  },
};
delete require.cache[CHECKER_PATH];
const { checkTestCoverage } = require(CHECKER_PATH);
if (origUtils) require.cache[UTILS_PATH] = origUtils;
else delete require.cache[UTILS_PATH];

function reset() {
  realFs.readdirSync = origReaddirSync;
  safeReadLinesFn = (_path) => [];
}

function makeTestResult(status, timestamp = new Date().toISOString()) {
  return JSON.stringify({ status, timestamp });
}

describe("checkTestCoverage", () => {
  it("returns no_data=true when test-results directory is missing", () => {
    realFs.readdirSync = () => {
      throw new Error("ENOENT");
    };
    try {
      const r = checkTestCoverage();
      assert.equal(r.no_data, true);
      assert.deepEqual(r.metrics, {});
    } finally {
      reset();
    }
  });

  it("returns no_data=true when test-results directory is empty", () => {
    realFs.readdirSync = () => [];
    try {
      assert.equal(checkTestCoverage().no_data, true);
    } finally {
      reset();
    }
  });

  it("returns no_data=true when directory has no .jsonl files", () => {
    realFs.readdirSync = () => ["results.json", "report.txt"];
    try {
      assert.equal(checkTestCoverage().no_data, true);
    } finally {
      reset();
    }
  });

  it("returns no_data=true when the latest .jsonl file is empty", () => {
    realFs.readdirSync = () => ["results-2026-01-01.jsonl"];
    safeReadLinesFn = (_path) => [];
    try {
      assert.equal(checkTestCoverage().no_data, true);
    } finally {
      reset();
    }
  });

  it("returns no_data=false and metrics when valid results exist", () => {
    realFs.readdirSync = () => ["results-2026-03-01.jsonl"];
    safeReadLinesFn = () => [
      makeTestResult("pass"),
      makeTestResult("pass"),
      makeTestResult("fail"),
    ];
    try {
      const r = checkTestCoverage();
      assert.equal(r.no_data, false);
      assert.ok("pass_rate" in r.metrics);
    } finally {
      reset();
    }
  });

  it("computes pass_rate correctly (2 pass, 1 fail = 67%)", () => {
    realFs.readdirSync = () => ["results-2026-03-01.jsonl"];
    safeReadLinesFn = () => [
      makeTestResult("pass"),
      makeTestResult("pass"),
      makeTestResult("fail"),
    ];
    try {
      assert.equal(checkTestCoverage().metrics.pass_rate.value, 67);
    } finally {
      reset();
    }
  });

  it("computes pass_rate=100 when all tests pass", () => {
    realFs.readdirSync = () => ["results-2026-03-01.jsonl"];
    safeReadLinesFn = () => Array.from({ length: 10 }, () => makeTestResult("pass"));
    try {
      assert.equal(checkTestCoverage().metrics.pass_rate.value, 100);
    } finally {
      reset();
    }
  });

  it("counts failed and errored tests separately", () => {
    realFs.readdirSync = () => ["results-2026-03-01.jsonl"];
    safeReadLinesFn = () => [
      makeTestResult("pass"),
      makeTestResult("fail"),
      makeTestResult("fail"),
      makeTestResult("error"),
    ];
    try {
      const r = checkTestCoverage();
      assert.equal(r.metrics.failed_count.value, 2);
      assert.equal(r.metrics.error_count.value, 1);
    } finally {
      reset();
    }
  });

  it("computes staleness_days from most recent timestamp", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    realFs.readdirSync = () => ["results-2026-03-01.jsonl"];
    safeReadLinesFn = () => [
      makeTestResult("pass", twoDaysAgo),
      makeTestResult("pass", twoDaysAgo),
    ];
    try {
      const r = checkTestCoverage();
      assert.ok(
        r.metrics.staleness_days.value >= 1 && r.metrics.staleness_days.value <= 3,
        `staleness_days ${r.metrics.staleness_days.value} not near 2`
      );
    } finally {
      reset();
    }
  });

  it("picks the lexicographically latest .jsonl file", () => {
    let readPath = null;
    realFs.readdirSync = () => [
      "results-2025-01-01.jsonl",
      "results-2026-03-09.jsonl",
      "results-2026-01-15.jsonl",
    ];
    safeReadLinesFn = (p) => {
      readPath = p;
      return [makeTestResult("pass")];
    };
    try {
      checkTestCoverage();
      assert.ok(
        readPath?.includes("2026-03-09"),
        `expected latest file to be read, got: ${readPath}`
      );
    } finally {
      reset();
    }
  });

  it("all metric scores are in [0, 100]", () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    realFs.readdirSync = () => ["results-2026-03-01.jsonl"];
    safeReadLinesFn = () => [
      makeTestResult("fail", oldDate),
      makeTestResult("error", oldDate),
      makeTestResult("fail", oldDate),
    ];
    try {
      const r = checkTestCoverage();
      for (const [key, metric] of Object.entries(r.metrics)) {
        assert.ok(
          metric.score >= 0 && metric.score <= 100,
          `"${key}" score ${metric.score} out of [0,100]`
        );
      }
    } finally {
      reset();
    }
  });

  it("skips malformed JSONL lines without crashing", () => {
    realFs.readdirSync = () => ["results-2026-03-01.jsonl"];
    safeReadLinesFn = () => [makeTestResult("pass"), "not valid json {{{", makeTestResult("fail")];
    try {
      assert.doesNotThrow(() => checkTestCoverage());
      const r = checkTestCoverage();
      // 2 valid lines: pass + fail = 50%
      assert.equal(r.metrics.pass_rate.value, 50);
    } finally {
      reset();
    }
  });
});
