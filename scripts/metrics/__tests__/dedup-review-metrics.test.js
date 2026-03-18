/**
 * Functional test: dedup-review-metrics.js
 *
 * Verifies that dedupMetrics() correctly:
 * - Removes duplicate entries per PR, keeping only the latest
 * - Annotates round counts from reviews.jsonl when available
 *
 * Purpose: Regression guard for retro action item #8.
 * Version History:
 *   v1.0 2026-03-18 - Initial implementation
 */

"use strict";

const assert = require("node:assert/strict");
const { describe, test, beforeEach, afterEach } = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// ── Locate project root ──────────────────────────────────────────────────

function findProjectRoot(startDir) {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const ROOT = findProjectRoot(__dirname);
const { dedupMetrics } = require(path.join(ROOT, "scripts", "metrics", "dedup-review-metrics.js"));

let tmpDir;

// ── Tests ─────────────────────────────────────────────────────────────────

describe("dedupMetrics (Item #8)", () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dedup-metrics-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("deduplicates 5 entries for same PR, keeping only latest", () => {
    const entries = [
      { pr: 999, title: "Test", review_rounds: 1, timestamp: "2026-03-18T01:00:00Z" },
      { pr: 999, title: "Test", review_rounds: 1, timestamp: "2026-03-18T02:00:00Z" },
      { pr: 999, title: "Test", review_rounds: 1, timestamp: "2026-03-18T03:00:00Z" },
      { pr: 999, title: "Test", review_rounds: 1, timestamp: "2026-03-18T04:00:00Z" },
      { pr: 999, title: "Test", review_rounds: 1, timestamp: "2026-03-18T05:00:00Z" },
    ];

    const { deduped, removedCount } = dedupMetrics(entries);

    assert.equal(deduped.length, 1, "Should keep only 1 entry for PR #999");
    assert.equal(removedCount, 4, "Should remove 4 duplicates");
    assert.equal(deduped[0].pr, 999);
    assert.equal(deduped[0].timestamp, "2026-03-18T05:00:00Z", "Should keep the latest entry");
  });

  test("preserves entries for different PRs", () => {
    const entries = [
      { pr: 100, title: "PR 100", review_rounds: 2, timestamp: "2026-03-18T01:00:00Z" },
      { pr: 200, title: "PR 200", review_rounds: 1, timestamp: "2026-03-18T02:00:00Z" },
      { pr: 300, title: "PR 300", review_rounds: 3, timestamp: "2026-03-18T03:00:00Z" },
    ];

    const { deduped, removedCount } = dedupMetrics(entries);

    assert.equal(deduped.length, 3, "Should keep all 3 distinct PRs");
    assert.equal(removedCount, 0, "Should remove nothing");
  });

  test("handles mixed: some PRs duplicated, some unique", () => {
    const entries = [
      { pr: 100, title: "PR 100 v1", review_rounds: 1, timestamp: "2026-03-17T01:00:00Z" },
      { pr: 100, title: "PR 100 v2", review_rounds: 2, timestamp: "2026-03-18T01:00:00Z" },
      { pr: 200, title: "PR 200", review_rounds: 1, timestamp: "2026-03-18T02:00:00Z" },
      { pr: 300, title: "PR 300 v1", review_rounds: 1, timestamp: "2026-03-17T01:00:00Z" },
      { pr: 300, title: "PR 300 v2", review_rounds: 1, timestamp: "2026-03-17T02:00:00Z" },
      { pr: 300, title: "PR 300 v3", review_rounds: 1, timestamp: "2026-03-18T01:00:00Z" },
    ];

    const { deduped, removedCount } = dedupMetrics(entries);

    assert.equal(deduped.length, 3, "Should keep 3 unique PRs");
    assert.equal(removedCount, 3, "Should remove 3 duplicates");

    const pr100 = deduped.find((e) => e.pr === 100);
    assert.equal(pr100.timestamp, "2026-03-18T01:00:00Z", "PR 100: keep latest");

    const pr300 = deduped.find((e) => e.pr === 300);
    assert.equal(pr300.timestamp, "2026-03-18T01:00:00Z", "PR 300: keep latest");
  });

  test("annotates round count from reviews.jsonl data", () => {
    const entries = [
      { pr: 999, title: "Test", review_rounds: 1, timestamp: "2026-03-18T05:00:00Z" },
    ];

    // Mock reviews.jsonl data: 4 records for PR #999
    const reviewCountsByPr = new Map([[999, 4]]);

    const { deduped, updatedRounds } = dedupMetrics(entries, reviewCountsByPr);

    assert.equal(deduped.length, 1);
    assert.equal(deduped[0].jsonl_review_records, 4, "Should annotate with JSONL count");
    assert.equal(updatedRounds, 1, "Should report 1 round count updated");
  });

  test("does not annotate when counts match", () => {
    const entries = [
      { pr: 999, title: "Test", review_rounds: 3, timestamp: "2026-03-18T05:00:00Z" },
    ];

    const reviewCountsByPr = new Map([[999, 3]]);

    const { deduped, updatedRounds } = dedupMetrics(entries, reviewCountsByPr);

    assert.equal(deduped.length, 1);
    assert.equal(deduped[0].jsonl_review_records, undefined, "Should not annotate matching counts");
    assert.equal(updatedRounds, 0);
  });

  test("handles empty input gracefully", () => {
    const { deduped, removedCount } = dedupMetrics([]);
    assert.equal(deduped.length, 0);
    assert.equal(removedCount, 0);
  });

  test("handles entries with missing/invalid pr field", () => {
    const entries = [
      { pr: 100, title: "Valid", review_rounds: 1, timestamp: "2026-03-18T01:00:00Z" },
      { title: "No PR", review_rounds: 1, timestamp: "2026-03-18T02:00:00Z" },
      { pr: "not-a-number", title: "String PR", review_rounds: 1, timestamp: "2026-03-18T03:00:00Z" },
      null,
    ];

    const { deduped, removedCount } = dedupMetrics(entries);
    assert.equal(deduped.length, 1, "Should only keep the valid entry");
    assert.equal(deduped[0].pr, 100);
  });

  test("functional test with temp JSONL files", () => {
    // Write temp review-metrics.jsonl with 5 duplicate entries
    const metricsPath = path.join(tmpDir, "review-metrics.jsonl");
    const entries = [];
    for (let i = 0; i < 5; i++) {
      entries.push({
        pr: 999,
        title: `Test v${i + 1}`,
        review_rounds: 1,
        fix_ratio: 0.5,
        total_commits: 10,
        fix_commits: 5,
        timestamp: `2026-03-18T0${i + 1}:00:00Z`,
      });
    }
    fs.writeFileSync(metricsPath, entries.map((e) => JSON.stringify(e)).join("\n") + "\n");

    // Verify 5 entries exist
    const beforeLines = fs.readFileSync(metricsPath, "utf8").trim().split("\n");
    assert.equal(beforeLines.length, 5, "Should start with 5 entries");

    // Mock reviews.jsonl with 3 records for PR #999
    const reviewCountsByPr = new Map([[999, 3]]);

    // Run dedup on the parsed entries
    const parsed = beforeLines.map((l) => JSON.parse(l));
    const { deduped, removedCount, updatedRounds } = dedupMetrics(parsed, reviewCountsByPr);

    assert.equal(deduped.length, 1, "Should reduce to 1 entry");
    assert.equal(removedCount, 4, "Should remove 4 duplicates");
    assert.equal(deduped[0].timestamp, "2026-03-18T05:00:00Z", "Should keep latest");
    assert.equal(deduped[0].jsonl_review_records, 3, "Should annotate with JSONL count");
    assert.equal(updatedRounds, 1, "Should report 1 round updated");

    // Write deduped data back (simulating what the script does)
    const content = deduped.map((e) => JSON.stringify(e)).join("\n") + "\n";
    fs.writeFileSync(metricsPath, content);

    // Verify the file now has only 1 entry
    const afterLines = fs.readFileSync(metricsPath, "utf8").trim().split("\n");
    assert.equal(afterLines.length, 1, "File should have 1 entry after dedup");

    const final = JSON.parse(afterLines[0]);
    assert.equal(final.pr, 999);
    assert.equal(final.review_rounds, 1);
    assert.equal(final.jsonl_review_records, 3);
  });
});
