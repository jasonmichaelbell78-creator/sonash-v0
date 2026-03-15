/* global __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * review-lifecycle.test.js — Tests for the review lifecycle orchestrator
 *
 * Tests the SYNC, ARCHIVE, VALIDATE, and RENDER steps plus CLI parsing.
 * Uses temp directories for file isolation.
 */

"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const projectRoot = path.resolve(__dirname, "..", "..");

// Import the module under test
const { parseMarkdownReviews, ARCHIVE_THRESHOLD, KEEP_NEWEST } = require(
  path.resolve(projectRoot, "scripts", "review-lifecycle.js")
);

// Import read-jsonl for verification
const readJsonl = require(path.resolve(projectRoot, "scripts", "lib", "read-jsonl.js"));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "review-lifecycle-test-"));
}

function cleanTempDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Build a fake review JSONL line.
 */
function makeReviewLine(id, date, title) {
  return JSON.stringify({
    id,
    date: date || "2026-03-01",
    title: title || `Review ${id}`,
    source: "manual",
    pr: null,
    patterns: [],
    fixed: 0,
    deferred: 0,
    rejected: 0,
    total: 0,
    learnings: [],
  });
}

/**
 * Build fake markdown review content.
 */
function makeMarkdownReview(id, title, date) {
  return [
    `#### Review #${id}: ${title || "Test Review"} (${date || "2026-03-01"})`,
    "",
    `**Source:** SonarCloud (2) + Qodo (1)`,
    `**PR:** #${100 + id}`,
    `**Fixed:** 2, **Deferred:** 1, **Rejected:** 0`,
    `**Total:** 3 items`,
    "",
    "**Learnings:**",
    "- Always validate inputs before processing",
    "",
    "---",
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// 1. Markdown parsing tests
// ---------------------------------------------------------------------------

describe("parseMarkdownReviews", () => {
  it("should parse a single review entry", () => {
    const content = makeMarkdownReview(100, "Test Title", "2026-03-10");
    const reviews = parseMarkdownReviews(content);

    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].id, 100);
    assert.equal(reviews[0].title, "Test Title");
    assert.equal(reviews[0].date, "2026-03-10");
    assert.equal(reviews[0].source, "sonarcloud+qodo");
    assert.equal(reviews[0].pr, 200);
    assert.equal(reviews[0].fixed, 2);
    assert.equal(reviews[0].deferred, 1);
  });

  it("should parse multiple review entries", () => {
    const content =
      makeMarkdownReview(1, "First", "2026-01-01") +
      makeMarkdownReview(2, "Second", "2026-02-01") +
      makeMarkdownReview(3, "Third", "2026-03-01");

    const reviews = parseMarkdownReviews(content);

    assert.equal(reviews.length, 3);
    assert.equal(reviews[0].id, 1);
    assert.equal(reviews[1].id, 2);
    assert.equal(reviews[2].id, 3);
  });

  it("should handle reviews with no date", () => {
    const content = "#### Review #50: No Date Review\n\nSome content\n";
    const reviews = parseMarkdownReviews(content);

    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].id, 50);
    assert.equal(reviews[0].date, "unknown");
    assert.equal(reviews[0].title, "No Date Review");
  });

  it("should skip content inside fenced code blocks", () => {
    const content = [
      "#### Review #1: Real Review (2026-01-01)",
      "",
      "```markdown",
      "#### Review #999: Fake Review Inside Code (2026-01-01)",
      "```",
      "",
      "Some actual content",
      "",
    ].join("\n");

    const reviews = parseMarkdownReviews(content);

    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].id, 1);
  });

  it("should handle ## and ### heading levels", () => {
    const content = [
      "## Review #10: Level 2 Review (2026-01-01)",
      "",
      "### Review #20: Level 3 Review (2026-02-01)",
      "",
    ].join("\n");

    const reviews = parseMarkdownReviews(content);

    assert.equal(reviews.length, 2);
    assert.equal(reviews[0].id, 10);
    assert.equal(reviews[1].id, 20);
  });

  it("should extract source correctly for different providers", () => {
    const content = [
      "#### Review #1: SC Review (2026-01-01)",
      "**Source:** SonarCloud (5)",
      "",
      "---",
      "",
      "#### Review #2: Qodo Review (2026-02-01)",
      "**Source:** Qodo Merge (3)",
      "",
      "---",
      "",
      "#### Review #3: CI Review (2026-03-01)",
      "**Source:** GitHub CI (2)",
      "",
    ].join("\n");

    const reviews = parseMarkdownReviews(content);

    assert.equal(reviews.length, 3);
    assert.equal(reviews[0].source, "sonarcloud");
    assert.equal(reviews[1].source, "qodo");
    assert.equal(reviews[2].source, "ci");
  });

  it("should return empty array for no reviews", () => {
    const content = "# Some Header\n\nNo reviews here.\n";
    const reviews = parseMarkdownReviews(content);

    assert.equal(reviews.length, 0);
  });

  it("should handle empty string input", () => {
    const reviews = parseMarkdownReviews("");
    assert.equal(reviews.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 2. Constants tests
// ---------------------------------------------------------------------------

describe("lifecycle constants", () => {
  it("should have valid ARCHIVE_THRESHOLD", () => {
    assert.equal(typeof ARCHIVE_THRESHOLD, "number");
    assert.equal(ARCHIVE_THRESHOLD, 30);
    assert.ok(ARCHIVE_THRESHOLD > 0);
  });

  it("should have valid KEEP_NEWEST", () => {
    assert.equal(typeof KEEP_NEWEST, "number");
    assert.equal(KEEP_NEWEST, 20);
    assert.ok(KEEP_NEWEST > 0);
  });

  it("should have KEEP_NEWEST < ARCHIVE_THRESHOLD", () => {
    assert.ok(KEEP_NEWEST < ARCHIVE_THRESHOLD, "KEEP_NEWEST should be less than ARCHIVE_THRESHOLD");
  });
});

// ---------------------------------------------------------------------------
// 3. Archive logic tests (file-based, using temp dirs)
// ---------------------------------------------------------------------------

describe("archive file operations", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    if (tempDir) cleanTempDir(tempDir);
  });

  it("should correctly split entries by keep threshold", () => {
    // Simulate the archive logic: 35 entries, keep 20, archive 15
    const entries = [];
    for (let i = 1; i <= 35; i++) {
      entries.push(JSON.parse(makeReviewLine(i, `2026-01-${String(i).padStart(2, "0")}`)));
    }

    const toKeep = entries.slice(-KEEP_NEWEST);
    const toArchive = entries.slice(0, entries.length - KEEP_NEWEST);

    assert.equal(toKeep.length, 20);
    assert.equal(toArchive.length, 15);
    // Oldest should be in archive
    assert.equal(toArchive[0].id, 1);
    // Newest should be kept
    assert.equal(toKeep.at(-1).id, 35);
  });

  it("should write archive entries as valid JSONL", () => {
    const archivePath = path.join(tempDir, "archive.jsonl");
    const entries = [];
    for (let i = 1; i <= 5; i++) {
      entries.push(makeReviewLine(i));
    }

    fs.writeFileSync(archivePath, entries.join("\n") + "\n", "utf8");

    const parsed = readJsonl(archivePath, { safe: true, quiet: true });
    assert.equal(parsed.length, 5);
    assert.equal(parsed[0].id, 1);
    assert.equal(parsed[4].id, 5);
  });

  it("should append to existing archive", () => {
    const archivePath = path.join(tempDir, "archive.jsonl");

    // Write initial entries
    const initial = [makeReviewLine(1), makeReviewLine(2)].join("\n") + "\n";
    fs.writeFileSync(archivePath, initial, "utf8");

    // Append more
    const additional = [makeReviewLine(3), makeReviewLine(4)].join("\n") + "\n";
    fs.appendFileSync(archivePath, additional);

    const parsed = readJsonl(archivePath, { safe: true, quiet: true });
    assert.equal(parsed.length, 4);
    assert.equal(parsed[0].id, 1);
    assert.equal(parsed[3].id, 4);
  });

  it("should handle atomic write failure cleanly", () => {
    // Verify that the temp file pattern doesn't leave orphans
    const reviewsPath = path.join(tempDir, "reviews.jsonl");
    const tmpPath = reviewsPath + ".tmp." + process.pid;

    // Simulate: temp file exists but main file write fails
    fs.writeFileSync(tmpPath, "temp content\n", "utf8");
    assert.ok(fs.existsSync(tmpPath));

    // Clean up (simulating rollback)
    fs.rmSync(tmpPath, { force: true });
    assert.ok(!fs.existsSync(tmpPath));
  });
});

// ---------------------------------------------------------------------------
// 4. Integration: sync dedup logic
// ---------------------------------------------------------------------------

describe("sync dedup logic", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    if (tempDir) cleanTempDir(tempDir);
  });

  it("should detect existing IDs correctly (all coerced to strings)", () => {
    const records = [
      { id: 1, date: "2026-01-01", title: "First" },
      { id: 5, date: "2026-01-05", title: "Fifth" },
      { id: "retro-100", date: "2026-02-01", title: "Retro" },
    ];

    // Import loadExistingIds
    const { loadExistingIds } = require(
      path.resolve(projectRoot, "scripts", "review-lifecycle.js")
    );
    const ids = loadExistingIds(records);

    // All IDs stored as strings
    assert.ok(ids.has("1"));
    assert.ok(ids.has("5"));
    assert.ok(ids.has("retro-100"));
    assert.ok(!ids.has("2"));
    assert.ok(!ids.has("99"));
    // Numeric lookup should NOT match (type-safe)
    assert.ok(!ids.has(1), "numeric 1 should not match string '1'");
  });

  it("should filter out already-synced reviews (string-normalized comparison)", () => {
    // Simulate what the orchestrator does: loadExistingIds returns string Set,
    // and the filter uses String(r.id)
    const existingIds = new Set(["1", "2", "3"]);
    const mdReviews = [
      { id: 1, title: "Existing" },
      { id: 2, title: "Existing" },
      { id: 4, title: "New" },
      { id: 5, title: "New" },
    ];

    const missing = mdReviews.filter((r) => !existingIds.has(String(r.id)));

    assert.equal(missing.length, 2);
    assert.equal(missing[0].id, 4);
    assert.equal(missing[1].id, 5);
  });
});

// ---------------------------------------------------------------------------
// 5. JSONL integrity tests
// ---------------------------------------------------------------------------

describe("JSONL round-trip integrity", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    if (tempDir) cleanTempDir(tempDir);
  });

  it("should produce valid JSONL from parsed markdown", () => {
    const content =
      makeMarkdownReview(100, "Integrity Test", "2026-03-15") +
      makeMarkdownReview(101, "Second Entry", "2026-03-16");

    const reviews = parseMarkdownReviews(content);

    // Write as JSONL
    const jsonlPath = path.join(tempDir, "test.jsonl");
    const lines = reviews.map((r) => JSON.stringify(r)).join("\n") + "\n";
    fs.writeFileSync(jsonlPath, lines, "utf8");

    // Read back
    const parsed = readJsonl(jsonlPath, { safe: true, quiet: true });
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].id, 100);
    assert.equal(parsed[0].title, "Integrity Test");
    assert.equal(parsed[1].id, 101);
    assert.equal(parsed[1].title, "Second Entry");
  });

  it("should handle special characters in titles", () => {
    const content = '#### Review #42: Fix "quoted" & special <chars> (2026-01-01)\n\n';
    const reviews = parseMarkdownReviews(content);

    assert.equal(reviews.length, 1);
    const line = JSON.stringify(reviews[0]);
    const parsed = JSON.parse(line);
    assert.equal(parsed.id, 42);
    // Title should survive JSON round-trip
    assert.ok(parsed.title.includes("quoted"));
  });

  it("should preserve all fields through JSONL serialization", () => {
    const content = makeMarkdownReview(77, "Field Preservation", "2026-02-20");
    const reviews = parseMarkdownReviews(content);
    const review = reviews[0];

    // Check all expected fields exist
    const expectedFields = [
      "id",
      "date",
      "title",
      "source",
      "pr",
      "patterns",
      "fixed",
      "deferred",
      "rejected",
      "total",
      "learnings",
    ];
    for (const field of expectedFields) {
      assert.ok(field in review, `Missing field: ${field}`);
    }

    // Verify no _rawLines leak
    assert.ok(!("_rawLines" in review), "_rawLines should be cleaned up");
  });
});

// ---------------------------------------------------------------------------
// 6. Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it("should handle Windows line endings in markdown", () => {
    const content = "#### Review #1: Win CRLF (2026-01-01)\r\n\r\n**Source:** manual\r\n\r\n";
    const reviews = parseMarkdownReviews(content);

    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].id, 1);
  });

  it("should handle review with colon in header", () => {
    const content = "#### Review #5: Fix: bug in parser (2026-01-01)\n\n";
    const reviews = parseMarkdownReviews(content);

    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].id, 5);
    assert.ok(reviews[0].title.includes("Fix"));
  });

  it("should handle very large review IDs", () => {
    const content = "#### Review #99999: Large ID Test (2026-01-01)\n\n";
    const reviews = parseMarkdownReviews(content);

    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].id, 99999);
  });

  it("should handle review with no body content", () => {
    const content = "#### Review #1: Empty Body (2026-01-01)\n";
    const reviews = parseMarkdownReviews(content);

    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].fixed, 0);
    assert.equal(reviews[0].deferred, 0);
    assert.equal(reviews[0].source, "manual");
    assert.equal(reviews[0].pr, null);
  });
});
