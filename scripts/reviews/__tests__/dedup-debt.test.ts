/**
 * Unit tests for MASTER_DEBT.jsonl deduplication logic.
 *
 * Tests the pure dedupReviewSourced() function with mock data.
 * No file I/O -- validates core dedup algorithm only.
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

// Import compiled dedup module
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { dedupReviewSourced } = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/dedup-debt.js")
) as {
  dedupReviewSourced: (
    items: Array<{ id: string; content_hash?: string; source?: string; title?: string }>
  ) => {
    kept: Array<{ id: string; content_hash?: string; source?: string; title?: string }>;
    removed: Array<{ id: string; content_hash?: string; source?: string; title?: string }>;
    flagged: Array<{ id: string; content_hash?: string; source?: string; title?: string }>;
  };
};

// =========================================================
// Test helpers
// =========================================================

function makeEntry(
  id: string,
  source: string,
  contentHash?: string,
  title?: string
): { id: string; content_hash?: string; source: string; title?: string } {
  const entry: { id: string; content_hash?: string; source: string; title?: string } = {
    id,
    source,
  };
  if (contentHash !== undefined) entry.content_hash = contentHash;
  if (title !== undefined) entry.title = title;
  return entry;
}

// =========================================================
// Tests
// =========================================================

describe("dedupReviewSourced", () => {
  test("basic dedup: 3 entries, 2 sharing content_hash, keeps lower ID", () => {
    const items = [
      makeEntry("DEBT-0042", "review", "hash-abc", "Finding A"),
      makeEntry("DEBT-0100", "review", "hash-def", "Finding B"),
      makeEntry("DEBT-0187", "review", "hash-abc", "Finding A duplicate"),
    ];

    const result = dedupReviewSourced(items);

    assert.equal(result.kept.length, 2, "should keep 2 entries");
    assert.equal(result.removed.length, 1, "should remove 1 duplicate");

    const keptIds = result.kept.map((i: { id: string }) => i.id);
    assert.ok(keptIds.includes("DEBT-0042"), "should keep DEBT-0042 (lower ID)");
    assert.ok(keptIds.includes("DEBT-0100"), "should keep DEBT-0100 (unique hash)");
    assert.equal(result.removed[0].id, "DEBT-0187", "should remove DEBT-0187 (higher ID)");
  });

  test("non-review entries are preserved untouched", () => {
    const items = [
      makeEntry("DEBT-0001", "sonarcloud", "hash-aaa", "SC finding"),
      makeEntry("DEBT-0002", "audit", "hash-bbb", "Audit finding"),
      makeEntry("DEBT-0003", "review", "hash-ccc", "Review finding"),
      makeEntry("DEBT-0004", "review", "hash-ccc", "Review duplicate"),
    ];

    const result = dedupReviewSourced(items);

    assert.equal(result.kept.length, 3, "should keep 3 entries (2 non-review + 1 review)");
    assert.equal(result.removed.length, 1, "should remove 1 duplicate");

    const keptIds = result.kept.map((i: { id: string }) => i.id);
    assert.ok(keptIds.includes("DEBT-0001"), "sonarcloud entry preserved");
    assert.ok(keptIds.includes("DEBT-0002"), "audit entry preserved");
    assert.ok(keptIds.includes("DEBT-0003"), "kept lower-ID review entry");
  });

  test("entries without content_hash are always kept", () => {
    const items = [
      makeEntry("DEBT-0010", "review", undefined, "No hash entry"),
      makeEntry("DEBT-0011", "review", "hash-xxx", "Has hash"),
      makeEntry("DEBT-0012", "review", undefined, "Another no hash"),
    ];

    const result = dedupReviewSourced(items);

    assert.equal(result.kept.length, 3, "all 3 entries should be kept");
    assert.equal(result.removed.length, 0, "no entries removed");
  });

  test("idempotency: running on already-clean data produces identical output", () => {
    const items = [
      makeEntry("DEBT-0001", "sonarcloud", "hash-aaa", "SC finding"),
      makeEntry("DEBT-0010", "review", "hash-bbb", "Review 1"),
      makeEntry("DEBT-0020", "review", "hash-ccc", "Review 2"),
    ];

    const firstPass = dedupReviewSourced(items);
    assert.equal(firstPass.removed.length, 0, "first pass: no duplicates");

    const secondPass = dedupReviewSourced(firstPass.kept);
    assert.equal(secondPass.removed.length, 0, "second pass: no duplicates");
    assert.deepStrictEqual(
      firstPass.kept.map((i: { id: string }) => i.id),
      secondPass.kept.map((i: { id: string }) => i.id),
      "output identical between passes"
    );
  });

  test("output is sorted by DEBT-NNNN ID regardless of input order", () => {
    const items = [
      makeEntry("DEBT-0300", "review", "hash-ccc", "C"),
      makeEntry("DEBT-0100", "sonarcloud", "hash-aaa", "A"),
      makeEntry("DEBT-0200", "review", "hash-bbb", "B"),
    ];

    const result = dedupReviewSourced(items);

    const ids = result.kept.map((i: { id: string }) => i.id);
    assert.deepStrictEqual(ids, ["DEBT-0100", "DEBT-0200", "DEBT-0300"], "sorted by ID");
  });

  test("title-based near-duplicates are flagged but not removed", () => {
    const items = [
      makeEntry("DEBT-0050", "review", "hash-111", "Same title here"),
      makeEntry("DEBT-0060", "review", "hash-222", "Same title here"),
      makeEntry("DEBT-0070", "review", "hash-333", "Different title"),
    ];

    const result = dedupReviewSourced(items);

    assert.equal(result.kept.length, 3, "all entries kept (different hashes)");
    assert.equal(result.removed.length, 0, "none removed");
    assert.equal(result.flagged.length, 2, "2 entries flagged as title-based near-duplicates");

    const flaggedIds = result.flagged.map((i: { id: string }) => i.id).sort();
    assert.deepStrictEqual(flaggedIds, ["DEBT-0050", "DEBT-0060"]);
  });

  test("pr-review and pr-deferred sources are treated as review-sourced", () => {
    const items = [
      makeEntry("DEBT-0010", "pr-review", "hash-same", "Finding"),
      makeEntry("DEBT-0020", "pr-deferred", "hash-same", "Finding dup"),
      makeEntry("DEBT-0030", "pr-review-366-r2", "hash-same", "Finding dup 2"),
    ];

    const result = dedupReviewSourced(items);

    assert.equal(result.kept.length, 1, "only lowest ID kept");
    assert.equal(result.removed.length, 2, "2 duplicates removed");
    assert.equal(result.kept[0].id, "DEBT-0010", "kept lowest ID");
  });

  test("multiple duplicate groups are each resolved independently", () => {
    const items = [
      makeEntry("DEBT-0010", "review", "hash-A", "Group A"),
      makeEntry("DEBT-0020", "review", "hash-B", "Group B"),
      makeEntry("DEBT-0030", "review", "hash-A", "Group A dup"),
      makeEntry("DEBT-0040", "review", "hash-B", "Group B dup"),
      makeEntry("DEBT-0050", "review", "hash-A", "Group A dup 2"),
    ];

    const result = dedupReviewSourced(items);

    assert.equal(result.kept.length, 2, "2 kept (one per hash group)");
    assert.equal(result.removed.length, 3, "3 duplicates removed");

    const keptIds = result.kept.map((i: { id: string }) => i.id);
    assert.deepStrictEqual(keptIds, ["DEBT-0010", "DEBT-0020"]);
  });
});
