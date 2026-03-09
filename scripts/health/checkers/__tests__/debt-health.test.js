/* eslint-disable no-undef */
"use strict";

/**
 * Tests for checkers/debt-health.js (CJS)
 *
 * Strategy:
 * - Inject fake utils into require.cache (for safeReadLines, safeParse, ROOT_DIR)
 * - Directly mutate fs.readFileSync on the real fs singleton (cache injection
 *   doesn't intercept built-in modules in Node 22)
 * - Restore originals after each test via try/finally
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const realFs = require("node:fs");

const CHECKER_PATH = path.join(__dirname, "..", "debt-health.js");
const UTILS_PATH = require.resolve(path.join(__dirname, "..", "..", "lib", "utils.js"));

const origUtils = require.cache[UTILS_PATH];
const origReadFileSync = realFs.readFileSync;

function makeMetricsJson(alerts = {}, summary = {}) {
  return JSON.stringify({
    alerts: { s0_count: 0, s1_count: 2, ...alerts },
    summary: { open: 15, resolution_rate_pct: 40, ...summary },
  });
}

// Load checker ONCE with faked utils (safeReadLines will be overridden per-test via the mutable ref)
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
const { checkDebtHealth } = require(CHECKER_PATH);
if (origUtils) require.cache[UTILS_PATH] = origUtils;
else delete require.cache[UTILS_PATH];

describe("checkDebtHealth", () => {
  it("returns no_data=true when metrics.json does not exist", () => {
    realFs.readFileSync = () => {
      throw new Error("ENOENT");
    };
    try {
      const r = checkDebtHealth();
      assert.equal(r.no_data, true);
      assert.deepEqual(r.metrics, {});
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("returns no_data=true when metrics.json is invalid JSON", () => {
    realFs.readFileSync = () => "not valid json {{";
    try {
      assert.equal(checkDebtHealth().no_data, true);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("returns no_data=false with all metric keys on valid data", () => {
    realFs.readFileSync = () => makeMetricsJson();
    safeReadLinesFn = () => [];
    try {
      const r = checkDebtHealth();
      assert.equal(r.no_data, false);
      for (const key of [
        "s0_count",
        "s1_count",
        "total_open",
        "avg_age_days",
        "resolution_rate",
        "intake_30d",
        "resolved_30d",
        "net_flow",
      ]) {
        assert.ok(key in r.metrics, `missing key: ${key}`);
      }
    } finally {
      realFs.readFileSync = origReadFileSync;
      safeReadLinesFn = () => [];
    }
  });

  it("reads s0_count and s1_count correctly", () => {
    realFs.readFileSync = () => makeMetricsJson({ s0_count: 3, s1_count: 8 });
    try {
      const r = checkDebtHealth();
      assert.equal(r.metrics.s0_count.value, 3);
      assert.equal(r.metrics.s1_count.value, 8);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("reads total_open and resolution_rate correctly", () => {
    realFs.readFileSync = () => makeMetricsJson({}, { open: 35, resolution_rate_pct: 55 });
    try {
      const r = checkDebtHealth();
      assert.equal(r.metrics.total_open.value, 35);
      assert.equal(r.metrics.resolution_rate.value, 55);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });

  it("returns avg_age_days=0 when MASTER_DEBT.jsonl is empty", () => {
    realFs.readFileSync = () => makeMetricsJson();
    safeReadLinesFn = () => [];
    try {
      assert.equal(checkDebtHealth().metrics.avg_age_days.value, 0);
    } finally {
      realFs.readFileSync = origReadFileSync;
      safeReadLinesFn = () => [];
    }
  });

  it("computes avg_age_days from open debt items", () => {
    const now = Date.now();
    const t30 = new Date(now - 30 * 86400000).toISOString();
    const t10 = new Date(now - 10 * 86400000).toISOString();
    realFs.readFileSync = () => makeMetricsJson();
    safeReadLinesFn = (filePath) => {
      if (filePath.includes("MASTER_DEBT")) {
        return [
          JSON.stringify({ status: "open", created: t30 }),
          JSON.stringify({ status: "open", created: t10 }),
        ];
      }
      return [];
    };
    try {
      const r = checkDebtHealth();
      assert.ok(
        r.metrics.avg_age_days.value >= 15 && r.metrics.avg_age_days.value <= 25,
        `avg_age_days ${r.metrics.avg_age_days.value} not near 20`
      );
    } finally {
      realFs.readFileSync = origReadFileSync;
      safeReadLinesFn = () => [];
    }
  });

  it("computes net_flow = intake_30d - resolved_30d", () => {
    const recent = new Date().toISOString();
    realFs.readFileSync = () => makeMetricsJson();
    safeReadLinesFn = (filePath) => {
      if (filePath.includes("MASTER_DEBT")) return [];
      if (filePath.includes("intake-log"))
        return [recent, recent, recent].map((t) => JSON.stringify({ timestamp: t }));
      if (filePath.includes("resolution-log")) return [JSON.stringify({ timestamp: recent })];
      return [];
    };
    try {
      // net_flow = 3 - 1 = 2
      assert.equal(checkDebtHealth().metrics.net_flow.value, 2);
    } finally {
      realFs.readFileSync = origReadFileSync;
      safeReadLinesFn = () => [];
    }
  });

  it("all metric scores are in [0, 100]", () => {
    realFs.readFileSync = () =>
      makeMetricsJson({ s0_count: 5, s1_count: 15 }, { open: 80, resolution_rate_pct: 5 });
    try {
      const r = checkDebtHealth();
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

  it("defaults missing alerts/summary fields to 0", () => {
    realFs.readFileSync = () => JSON.stringify({ summary: { open: 10 } });
    try {
      const r = checkDebtHealth();
      assert.equal(r.metrics.s0_count.value, 0);
      assert.equal(r.metrics.s1_count.value, 0);
      assert.equal(r.metrics.resolution_rate.value, 0);
    } finally {
      realFs.readFileSync = origReadFileSync;
    }
  });
});
