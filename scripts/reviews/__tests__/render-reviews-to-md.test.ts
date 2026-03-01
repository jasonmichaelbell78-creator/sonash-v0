/**
 * Unit tests for render-reviews-to-md.ts
 *
 * Tests the renderReviewRecord() and renderReviewsToMarkdown() functions.
 * Uses inline test data matching the ReviewRecord schema.
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

// Walk up from __dirname until we find package.json
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderReviewRecord, renderReviewsToMarkdown } = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/render-reviews-to-md.js")
) as {
  renderReviewRecord: (record: Record<string, unknown>) => string;
  renderReviewsToMarkdown: (records: Array<Record<string, unknown>>) => string;
};

// =========================================================
// Test fixtures
// =========================================================

function makeFullRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "rev-1",
    date: "2026-02-28",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "pr-review", tool: "test" },
    title: "Test Review",
    pr: 399,
    source: "manual",
    total: 10,
    fixed: 7,
    deferred: 2,
    rejected: 1,
    severity_breakdown: { critical: 1, major: 3, minor: 4, trivial: 2 },
    patterns: ["missing-error-handling", "no-input-validation"],
    learnings: ["Always validate inputs", "Add try-catch around I/O"],
    ...overrides,
  };
}

function makePartialRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "rev-2",
    date: "2026-02-27",
    schema_version: 1,
    completeness: "partial",
    completeness_missing: ["severity_breakdown", "learnings"],
    origin: { type: "pr-review", tool: "test" },
    title: "Partial Review",
    pr: 400,
    source: "automated",
    total: 5,
    fixed: 3,
    deferred: 2,
    rejected: 0,
    ...overrides,
  };
}

function makeStubRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "rev-3",
    date: "2026-02-26",
    schema_version: 1,
    completeness: "stub",
    completeness_missing: [
      "title",
      "pr",
      "total",
      "fixed",
      "deferred",
      "rejected",
      "severity_breakdown",
      "patterns",
      "learnings",
    ],
    origin: { type: "backfill", tool: "test" },
    ...overrides,
  };
}

// =========================================================
// Tests
// =========================================================

describe("renderReviewRecord", () => {
  test("full record renders all sections", () => {
    const md = renderReviewRecord(makeFullRecord());

    // Heading
    assert.ok(md.includes("### Review rev-1: Test Review"), "Should have heading");

    // Date and PR
    assert.ok(md.includes("**Date:** 2026-02-28"), "Should have date");
    assert.ok(md.includes("**PR:** #399"), "Should have PR");
    assert.ok(md.includes("**Source:** manual"), "Should have source");

    // Stats table
    assert.ok(md.includes("| Total | Fixed | Deferred | Rejected |"), "Should have stats header");
    assert.ok(md.includes("| 10 | 7 | 2 | 1 |"), "Should have stats row");

    // Severity breakdown
    assert.ok(md.includes("**Severity Breakdown:**"), "Should have severity section");
    assert.ok(md.includes("| 1 | 3 | 4 | 2 |"), "Should have severity values");

    // Patterns
    assert.ok(md.includes("**Patterns:**"), "Should have patterns section");
    assert.ok(md.includes("- missing-error-handling"), "Should list pattern");
    assert.ok(md.includes("- no-input-validation"), "Should list second pattern");

    // Learnings
    assert.ok(md.includes("**Learnings:**"), "Should have learnings section");
    assert.ok(md.includes("- Always validate inputs"), "Should list learning");
  });

  test("partial record renders available fields, skips nulls", () => {
    const md = renderReviewRecord(makePartialRecord());

    // Completeness note
    assert.ok(md.includes("**Completeness:** partial"), "Should note partial completeness");
    assert.ok(md.includes("severity_breakdown, learnings"), "Should list missing fields");

    // Available fields rendered
    assert.ok(md.includes("### Review rev-2: Partial Review"), "Should have heading");
    assert.ok(md.includes("| 5 | 3 | 2 | 0 |"), "Should have stats");

    // Missing fields NOT rendered
    assert.ok(!md.includes("**Severity Breakdown:**"), "Should skip severity breakdown");
    assert.ok(!md.includes("**Learnings:**"), "Should skip learnings");
  });

  test("stub record renders minimal info with completeness note", () => {
    const md = renderReviewRecord(makeStubRecord());

    // Completeness note
    assert.ok(md.includes("**Completeness:** stub"), "Should note stub completeness");

    // Heading with (untitled) since no title
    assert.ok(
      md.includes("### Review rev-3: (untitled)"),
      "Should show (untitled) for missing title"
    );

    // Date rendered
    assert.ok(md.includes("**Date:** 2026-02-26"), "Should have date");

    // No stats table (total is null/missing)
    assert.ok(!md.includes("| Total |"), "Should not have stats table");

    // No patterns or learnings
    assert.ok(!md.includes("**Patterns:**"), "Should not have patterns");
    assert.ok(!md.includes("**Learnings:**"), "Should not have learnings");
  });
});

describe("renderReviewsToMarkdown", () => {
  test("empty array produces 'No reviews found' message", () => {
    const md = renderReviewsToMarkdown([]);
    assert.equal(md, "No reviews found.\n");
  });

  test("multiple records render in order", () => {
    const records = [
      makeFullRecord({ id: "rev-1", title: "First Review" }),
      makePartialRecord({ id: "rev-2", title: "Second Review" }),
    ];

    const md = renderReviewsToMarkdown(records);

    const firstIdx = md.indexOf("First Review");
    const secondIdx = md.indexOf("Second Review");
    assert.ok(firstIdx >= 0, "Should contain first review");
    assert.ok(secondIdx >= 0, "Should contain second review");
    assert.ok(firstIdx < secondIdx, "First should come before second");

    // Should have separator
    assert.ok(md.includes("---"), "Should have separator between records");
  });

  test("single record renders without separator", () => {
    const md = renderReviewsToMarkdown([makeFullRecord()]);
    // Split by --- and check we only have the record, not multiple separators
    const parts = md.split("\n---\n");
    assert.equal(parts.length, 1, "Single record should not have separator");
  });
});

describe("CLI filtering", () => {
  // These tests verify the filter logic works correctly by testing the
  // renderReviewsToMarkdown function with pre-filtered data (simulating CLI behavior)

  test("--filter-pr filters correctly", () => {
    const records = [
      makeFullRecord({ id: "rev-1", pr: 399 }),
      makeFullRecord({ id: "rev-2", pr: 400 }),
      makeFullRecord({ id: "rev-3", pr: 399 }),
    ];

    // Simulate --filter-pr 399
    const filtered = records.filter((r) => r.pr === 399);
    const md = renderReviewsToMarkdown(filtered);

    assert.ok(md.includes("rev-1"), "Should include rev-1 (pr 399)");
    assert.ok(!md.includes("rev-2"), "Should not include rev-2 (pr 400)");
    assert.ok(md.includes("rev-3"), "Should include rev-3 (pr 399)");
  });

  test("--last N limits output", () => {
    const records = [
      makeFullRecord({ id: "rev-1", title: "First" }),
      makeFullRecord({ id: "rev-2", title: "Second" }),
      makeFullRecord({ id: "rev-3", title: "Third" }),
    ];

    // Simulate --last 2
    const lastTwo = records.slice(-2);
    const md = renderReviewsToMarkdown(lastTwo);

    assert.ok(!md.includes("rev-1"), "Should not include first record");
    assert.ok(md.includes("rev-2"), "Should include second record");
    assert.ok(md.includes("rev-3"), "Should include third record");
  });
});
