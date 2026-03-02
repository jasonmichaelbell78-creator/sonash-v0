/**
 * Temporal Coverage Test Suite
 *
 * Tests for the temporal coverage gap detection in check-review-archive.js.
 * Verifies ISO week grouping and gap detection logic with inline fixture data.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as path from "node:path";

// CJS module -- use require with eslint-disable
// From dist-tests/tests/ -> ../../scripts/ resolves to project root scripts/
const scriptPath = path.resolve(__dirname, "../../scripts/check-review-archive.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { analyzeTemporalCoverage, getISOWeek } = require(scriptPath) as {
  analyzeTemporalCoverage: (reviews?: Array<{ date?: string | null }>) => {
    noData: boolean;
    weeksWithReviews: number;
    gaps: Array<{
      week: string;
      before: string;
      beforeCount: number;
      after: string;
      afterCount: number;
    }>;
    longestGap: { start: string; end: string; length: number } | null;
  };
  getISOWeek: (date: Date) => string;
};

describe("analyzeTemporalCoverage", () => {
  it("reports 0 gaps for 10 consecutive weeks", () => {
    // Generate reviews for 10 consecutive weeks starting mid-week
    const reviews = [];
    for (let i = 0; i < 10; i++) {
      // Use Wednesdays to avoid timezone boundary issues
      const d = new Date(2025, 0, 8 + i * 7); // Jan 8 is Wed W02
      reviews.push({ date: d.toISOString().slice(0, 10) });
    }
    const result = analyzeTemporalCoverage(reviews);
    assert.equal(result.noData, false);
    assert.equal(result.weeksWithReviews, 10);
    assert.equal(result.gaps.length, 0);
    assert.equal(result.longestGap, null);
  });

  it("detects a 1-week gap with surrounding context", () => {
    const reviews = [
      { date: "2025-01-08" }, // W02 (Wed)
      { date: "2025-01-15" }, // W03 (Wed)
      // gap: W04
      { date: "2025-01-29" }, // W05 (Wed)
    ];
    const result = analyzeTemporalCoverage(reviews);
    assert.equal(result.noData, false);
    assert.equal(result.weeksWithReviews, 3);
    assert.equal(result.gaps.length, 1);
    assert.equal(result.gaps[0].week, "2025-W04");
    assert.equal(result.gaps[0].before, "2025-W03");
    assert.equal(result.gaps[0].beforeCount, 1);
    assert.equal(result.gaps[0].after, "2025-W05");
    assert.equal(result.gaps[0].afterCount, 1);
  });

  it("detects a 3-week gap as longest gap", () => {
    const reviews = [
      { date: "2025-01-08" }, // W02 (Wed)
      // gap: W03, W04, W05
      { date: "2025-02-05" }, // W06 (Wed)
    ];
    const result = analyzeTemporalCoverage(reviews);
    assert.equal(result.noData, false);
    assert.equal(result.gaps.length, 3);
    assert.ok(result.longestGap);
    assert.equal(result.longestGap.length, 3);
    assert.equal(result.longestGap.start, "2025-W03");
    assert.equal(result.longestGap.end, "2025-W05");
  });

  it("skips reviews with no date field gracefully", () => {
    const reviews = [
      { date: "2025-01-08" }, // W02
      { title: "no date review" } as unknown as { date: string },
      { date: null } as unknown as { date: string },
      { date: "2025-01-15" }, // W03
    ];
    const result = analyzeTemporalCoverage(reviews);
    assert.equal(result.noData, false);
    assert.equal(result.weeksWithReviews, 2);
    assert.equal(result.gaps.length, 0);
  });

  it("reports noData for empty reviews array", () => {
    const result = analyzeTemporalCoverage([]);
    assert.equal(result.noData, true);
    assert.equal(result.weeksWithReviews, 0);
    assert.equal(result.gaps.length, 0);
    assert.equal(result.longestGap, null);
  });

  it("handles all reviews in same week with no gaps", () => {
    // Use mid-week dates all within W03 (Jan 13-19, 2025)
    const reviews = [
      { date: "2025-01-14" }, // Tue W03
      { date: "2025-01-15" }, // Wed W03
      { date: "2025-01-16" }, // Thu W03
    ];
    const result = analyzeTemporalCoverage(reviews);
    assert.equal(result.noData, false);
    assert.equal(result.weeksWithReviews, 1);
    assert.equal(result.gaps.length, 0);
    assert.equal(result.longestGap, null);
  });
});

describe("getISOWeek", () => {
  it("groups dates within the same week together", () => {
    // Use mid-week dates to avoid UTC/local timezone boundary issues
    const tue = getISOWeek(new Date("2025-01-14"));
    const wed = getISOWeek(new Date("2025-01-15"));
    const thu = getISOWeek(new Date("2025-01-16"));
    assert.equal(tue, wed);
    assert.equal(wed, thu);
    assert.equal(tue, "2025-W03");
  });

  it("assigns different weeks to dates 7 days apart", () => {
    const w1 = getISOWeek(new Date("2025-01-15"));
    const w2 = getISOWeek(new Date("2025-01-22"));
    assert.notEqual(w1, w2);
  });
});
