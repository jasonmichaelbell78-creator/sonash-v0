import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const cjsRequire = createRequire(import.meta.url);
const { computeAnalytics } = cjsRequire("../scripts/log-override.js");

// Helper to create an override entry
function makeEntry(overrides = {}) {
  return {
    timestamp: new Date().toISOString(),
    check: "triggers",
    reason: "Valid reason for testing purposes",
    user: "testuser",
    cwd: "/fake/path",
    git_branch: "main",
    ...overrides,
  };
}

// Helper to create entry at a specific date offset (days ago from now)
function entryDaysAgo(daysAgo, overrides = {}) {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return makeEntry({ timestamp: d.toISOString(), ...overrides });
}

describe("computeAnalytics", () => {
  it("returns zeroes for empty entries array", () => {
    const result = computeAnalytics([], 30);
    assert.equal(result.total, 0);
    assert.deepEqual(result.byCheck, {});
    assert.deepEqual(result.byBranch, {});
    assert.equal(result.noReasonCount, 0);
    assert.equal(result.noReasonPct, 0);
    assert.deepEqual(result.patterns, []);
    assert.equal(result.trend.current_week, 0);
    assert.equal(result.trend.previous_week, 0);
    assert.equal(result.trend.change_pct, 0);
  });

  it("groups and sorts byCheck correctly", () => {
    const entries = [
      entryDaysAgo(1, { check: "cross-doc" }),
      entryDaysAgo(1, { check: "triggers" }),
      entryDaysAgo(1, { check: "cross-doc" }),
      entryDaysAgo(1, { check: "cross-doc" }),
      entryDaysAgo(1, { check: "patterns" }),
      entryDaysAgo(1, { check: "patterns" }),
    ];
    const result = computeAnalytics(entries, 30);
    const checks = Object.keys(result.byCheck);
    assert.equal(checks[0], "cross-doc", "Most frequent check should be first");
    assert.equal(result.byCheck["cross-doc"], 3);
    assert.equal(result.byCheck["patterns"], 2);
    assert.equal(result.byCheck["triggers"], 1);
  });

  it("counts entries with empty or short reasons as no-reason", () => {
    const entries = [
      entryDaysAgo(1, { reason: "" }),
      entryDaysAgo(1, { reason: "No reason" }),
      entryDaysAgo(1, { reason: "No reason provided" }),
      entryDaysAgo(1, { reason: "short" }), // < 10 chars
      entryDaysAgo(1, { reason: "This is a valid detailed reason for override" }),
    ];
    const result = computeAnalytics(entries, 30);
    assert.equal(result.noReasonCount, 4);
    assert.equal(result.noReasonPct, 80);
  });

  it("detects patterns with 3+ same check on same branch", () => {
    const entries = [
      entryDaysAgo(1, { check: "cross-doc", git_branch: "feature/x" }),
      entryDaysAgo(1, { check: "cross-doc", git_branch: "feature/x" }),
      entryDaysAgo(1, { check: "cross-doc", git_branch: "feature/x" }),
      entryDaysAgo(1, { check: "cross-doc", git_branch: "feature/x" }),
      entryDaysAgo(1, { check: "triggers", git_branch: "feature/x" }),
    ];
    const result = computeAnalytics(entries, 30);
    assert.equal(result.patterns.length, 1);
    assert.equal(result.patterns[0].branch, "feature/x");
    assert.equal(result.patterns[0].check, "cross-doc");
    assert.equal(result.patterns[0].count, 4);
  });

  it("does NOT flag 2 overrides as a pattern (below threshold)", () => {
    const entries = [
      entryDaysAgo(1, { check: "cross-doc", git_branch: "feature/y" }),
      entryDaysAgo(1, { check: "cross-doc", git_branch: "feature/y" }),
    ];
    const result = computeAnalytics(entries, 30);
    assert.equal(result.patterns.length, 0);
  });

  it("computes week-over-week trend correctly", () => {
    // 3 entries in last 7 days, 6 entries in prior 7 days
    const entries = [
      entryDaysAgo(1),
      entryDaysAgo(2),
      entryDaysAgo(5),
      entryDaysAgo(8),
      entryDaysAgo(9),
      entryDaysAgo(10),
      entryDaysAgo(11),
      entryDaysAgo(12),
      entryDaysAgo(13),
    ];
    const result = computeAnalytics(entries, 30);
    assert.equal(result.trend.current_week, 3);
    assert.equal(result.trend.previous_week, 6);
    assert.equal(result.trend.change_pct, -50);
  });

  it("filters entries by days parameter (excludes outside window)", () => {
    const entries = [
      entryDaysAgo(1, { check: "recent" }),
      entryDaysAgo(5, { check: "recent" }),
      entryDaysAgo(15, { check: "old" }),
      entryDaysAgo(60, { check: "ancient" }),
    ];
    const result = computeAnalytics(entries, 7);
    assert.equal(result.total, 2, "Only entries within 7-day window should be counted");
    assert.equal(result.byCheck["recent"], 2);
    assert.equal(result.byCheck["old"], undefined);
    assert.equal(result.byCheck["ancient"], undefined);
  });
});
