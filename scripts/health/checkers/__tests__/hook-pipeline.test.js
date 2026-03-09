/* eslint-disable no-undef */
"use strict";

/**
 * Tests for checkers/hook-pipeline.js (CJS)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const realFs = require("node:fs");

const CHECKER_PATH = path.join(__dirname, "..", "hook-pipeline.js");
const UTILS_PATH = require.resolve(path.join(__dirname, "..", "..", "lib", "utils.js"));

const origUtils = require.cache[UTILS_PATH];
const origReadFileSync = realFs.readFileSync;

function makeSuccess(output = "") {
  return { success: true, output, stderr: "", code: 0 };
}

function timestampDaysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// Load checker once; safeReadLines and runCommandSafe are routed through mutable refs
let safeReadLinesFn = () => [];
let runCommandSafeFn = () => makeSuccess("");

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
    runCommandSafe: (...args) => runCommandSafeFn(...args),
    findProjectRoot: () => "/fake/root",
  },
};
delete require.cache[CHECKER_PATH];
const { checkHookPipeline } = require(CHECKER_PATH);
if (origUtils) require.cache[UTILS_PATH] = origUtils;
else delete require.cache[UTILS_PATH];

function reset() {
  realFs.readFileSync = origReadFileSync;
  safeReadLinesFn = () => [];
  runCommandSafeFn = () => makeSuccess("");
}

describe("checkHookPipeline", () => {
  it("returns no_data=false always", () => {
    try {
      assert.equal(checkHookPipeline().no_data, false);
    } finally {
      reset();
    }
  });

  it("includes all 12 expected metric keys", () => {
    try {
      const r = checkHookPipeline();
      for (const key of [
        "warnings_7d",
        "overrides_7d",
        "false_positive_pct",
        "noise_ratio",
        "commit_failures_7d",
        "overrides_24h",
        "warnings_24h",
        "no_reason_pct",
        "last_hook_passed",
        "override_trend",
        "top_warning_type",
        "top_failed_check",
      ]) {
        assert.ok(key in r.metrics, `missing key: ${key}`);
      }
    } finally {
      reset();
    }
  });

  it("returns warnings_7d=0 when log is empty", () => {
    safeReadLinesFn = () => [];
    try {
      assert.equal(checkHookPipeline().metrics.warnings_7d.value, 0);
    } finally {
      reset();
    }
  });

  it("counts only warnings within last 7 days", () => {
    const recent = JSON.stringify({
      timestamp: timestampDaysAgo(3),
      hook: "pre-commit",
      type: "lint",
    });
    const old = JSON.stringify({
      timestamp: timestampDaysAgo(10),
      hook: "pre-commit",
      type: "lint",
    });
    safeReadLinesFn = (filePath) => (filePath.includes("hook-warnings-log") ? [recent, old] : []);
    try {
      assert.equal(checkHookPipeline().metrics.warnings_7d.value, 1);
    } finally {
      reset();
    }
  });

  it("counts warnings_24h separately from 7d", () => {
    const veryRecent = JSON.stringify({
      timestamp: timestampDaysAgo(0.5),
      hook: "pre-commit",
      type: "lint",
    });
    const older = JSON.stringify({
      timestamp: timestampDaysAgo(3),
      hook: "pre-commit",
      type: "ts",
    });
    safeReadLinesFn = (filePath) =>
      filePath.includes("hook-warnings-log") ? [veryRecent, older] : [];
    try {
      const r = checkHookPipeline();
      assert.equal(r.metrics.warnings_24h.value, 1);
      assert.equal(r.metrics.warnings_7d.value, 2);
    } finally {
      reset();
    }
  });

  it("computes false_positive_pct as overrides/warnings*100", () => {
    const recentW = JSON.stringify({
      timestamp: timestampDaysAgo(1),
      hook: "pre-commit",
      type: "lint",
    });
    const recentO = JSON.stringify({ timestamp: timestampDaysAgo(1), reason: "valid" });
    safeReadLinesFn = (filePath) => {
      if (filePath.includes("hook-warnings-log")) return [recentW, recentW, recentW, recentW];
      if (filePath.includes("override-log")) return [recentO];
      return [];
    };
    try {
      // 1 override / 4 warnings = 25%
      assert.equal(checkHookPipeline().metrics.false_positive_pct.value, 25);
    } finally {
      reset();
    }
  });

  it("sets false_positive_pct=100 when overrides > 0 but no warnings", () => {
    const recentO = JSON.stringify({ timestamp: timestampDaysAgo(1), reason: "valid" });
    safeReadLinesFn = (filePath) => (filePath.includes("override-log") ? [recentO] : []);
    try {
      assert.equal(checkHookPipeline().metrics.false_positive_pct.value, 100);
    } finally {
      reset();
    }
  });

  it("sets last_hook_passed=100 when hook output contains success string", () => {
    realFs.readFileSync = (filePath) => {
      if (filePath.includes("hook-output.log")) return "All pre-commit checks passed";
      throw new Error("ENOENT");
    };
    try {
      assert.equal(checkHookPipeline().metrics.last_hook_passed.value, 100);
    } finally {
      reset();
    }
  });

  it("sets last_hook_passed=0 when hook output does not contain success string", () => {
    realFs.readFileSync = (filePath) => {
      if (filePath.includes("hook-output.log")) return "Pre-commit FAILED";
      throw new Error("ENOENT");
    };
    try {
      assert.equal(checkHookPipeline().metrics.last_hook_passed.value, 0);
    } finally {
      reset();
    }
  });

  it("sets last_hook_passed=50 when hook-output.log is missing", () => {
    realFs.readFileSync = () => {
      throw new Error("ENOENT");
    };
    try {
      assert.equal(checkHookPipeline().metrics.last_hook_passed.value, 50);
    } finally {
      reset();
    }
  });

  it("computes no_reason_pct from overrides without valid reason", () => {
    const withReason = JSON.stringify({ timestamp: timestampDaysAgo(1), reason: "legit reason" });
    const noReason = JSON.stringify({
      timestamp: timestampDaysAgo(1),
      reason: "No reason provided",
    });
    safeReadLinesFn = (filePath) =>
      filePath.includes("override-log") ? [withReason, noReason, noReason] : [];
    try {
      // 2/3 = 67%
      const r = checkHookPipeline();
      assert.ok(r.metrics.no_reason_pct.value >= 66 && r.metrics.no_reason_pct.value <= 67);
    } finally {
      reset();
    }
  });

  it("all metric scores are in [0, 100]", () => {
    const recentW = JSON.stringify({
      timestamp: timestampDaysAgo(1),
      hook: "pre-commit",
      type: "lint",
    });
    const recentO = JSON.stringify({ timestamp: timestampDaysAgo(1), reason: "No reason" });
    const recentF = JSON.stringify({ timestamp: timestampDaysAgo(1), failedCheck: "eslint" });
    realFs.readFileSync = (filePath) => {
      if (filePath.includes("hook-output.log")) return "Some failure output";
      throw new Error("ENOENT");
    };
    safeReadLinesFn = (filePath) => {
      if (filePath.includes("hook-warnings-log")) return Array(15).fill(recentW);
      if (filePath.includes("override-log")) return Array(5).fill(recentO);
      if (filePath.includes("commit-failures")) return Array(8).fill(recentF);
      return [];
    };
    runCommandSafeFn = () =>
      makeSuccess("chore: update hook state\nchore: rotate housekeeping\nfeat: something");
    try {
      const r = checkHookPipeline();
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
});
