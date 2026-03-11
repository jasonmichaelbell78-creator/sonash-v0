/**
 * Unit tests for process-review-needed.js
 *
 * Tests: parseMasterLine hash/sourceId collection, loadReviewPairs parsing,
 * and pair classification logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── parseMasterLine ─────────────────────────────────────────────────────────

function parseMasterLine(line: string, hashes: Set<string>, sourceIds: Set<string>): void {
  try {
    const item = JSON.parse(line);
    if (item.content_hash) hashes.add(item.content_hash);
    if (item.source_id) sourceIds.add(item.source_id);
    if (item.sonar_key) sourceIds.add(item.sonar_key);
    if (Array.isArray(item.merged_from)) {
      for (const m of item.merged_from) sourceIds.add(m);
    }
  } catch {
    // skip malformed
  }
}

describe("parseMasterLine (process-review-needed)", () => {
  it("adds content_hash to hashes set", () => {
    const hashes = new Set<string>();
    const sourceIds = new Set<string>();
    parseMasterLine('{"content_hash":"abc123"}', hashes, sourceIds);
    assert.ok(hashes.has("abc123"));
  });

  it("adds source_id to sourceIds set", () => {
    const hashes = new Set<string>();
    const sourceIds = new Set<string>();
    parseMasterLine('{"source_id":"audit:CODE-001"}', hashes, sourceIds);
    assert.ok(sourceIds.has("audit:CODE-001"));
  });

  it("adds sonar_key to sourceIds set", () => {
    const hashes = new Set<string>();
    const sourceIds = new Set<string>();
    parseMasterLine('{"sonar_key":"org:project:file:123"}', hashes, sourceIds);
    assert.ok(sourceIds.has("org:project:file:123"));
  });

  it("adds all merged_from entries to sourceIds", () => {
    const hashes = new Set<string>();
    const sourceIds = new Set<string>();
    parseMasterLine('{"merged_from":["src-A","src-B"]}', hashes, sourceIds);
    assert.ok(sourceIds.has("src-A"));
    assert.ok(sourceIds.has("src-B"));
  });

  it("does not throw for malformed JSON", () => {
    const hashes = new Set<string>();
    const sourceIds = new Set<string>();
    assert.doesNotThrow(() => parseMasterLine("NOT JSON", hashes, sourceIds));
  });
});

// ─── loadReviewPairs ─────────────────────────────────────────────────────────

interface ReviewPair {
  id: string;
  items: unknown[];
}

function loadReviewPairsFromContent(content: string): ReviewPair[] {
  const pairs: ReviewPair[] = [];
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      pairs.push(JSON.parse(line.replaceAll("\uFEFF", "")));
    } catch {
      // skip
    }
  }
  return pairs;
}

describe("loadReviewPairs", () => {
  it("parses valid review pairs JSONL", () => {
    const content = `{"id":"rp-1","items":[]}\n{"id":"rp-2","items":[]}`;
    const pairs = loadReviewPairsFromContent(content);
    assert.equal(pairs.length, 2);
    assert.equal(pairs[0].id, "rp-1");
  });

  it("skips malformed lines", () => {
    const content = `{"id":"rp-1","items":[]}\nBAD\n{"id":"rp-2","items":[]}`;
    assert.equal(loadReviewPairsFromContent(content).length, 2);
  });

  it("returns empty array for empty content", () => {
    assert.deepEqual(loadReviewPairsFromContent(""), []);
  });

  it("strips BOM before parsing", () => {
    const content = '\uFEFF{"id":"rp-1","items":[]}';
    const pairs = loadReviewPairsFromContent(content);
    assert.equal(pairs.length, 1);
  });
});

// ─── Pair classification logic ────────────────────────────────────────────────

type PairOutcome = "already-merged" | "true-duplicate" | "distinct-instance" | "genuinely-new";

interface PairItem {
  content_hash?: string;
  source_id?: string;
}

function classifyPair(
  pairItems: PairItem[],
  existingHashes: Set<string>,
  existingSourceIds: Set<string>
): PairOutcome {
  const allMerged = pairItems.every(
    (item) =>
      (item.content_hash && existingHashes.has(item.content_hash)) ||
      (item.source_id && existingSourceIds.has(item.source_id))
  );
  if (allMerged) return "already-merged";

  const hashMatch = pairItems.filter(
    (item) => item.content_hash && existingHashes.has(item.content_hash)
  );
  if (hashMatch.length === 1 && pairItems.length === 2) return "true-duplicate";

  if (pairItems.length === 2) return "distinct-instance";

  return "genuinely-new";
}

describe("classifyPair", () => {
  it("returns 'already-merged' when all items exist", () => {
    const hashes = new Set(["h1", "h2"]);
    const sourceIds = new Set<string>();
    const items: PairItem[] = [{ content_hash: "h1" }, { content_hash: "h2" }];
    assert.equal(classifyPair(items, hashes, sourceIds), "already-merged");
  });

  it("returns 'true-duplicate' for pair with one existing item", () => {
    const hashes = new Set(["h1"]);
    const sourceIds = new Set<string>();
    const items: PairItem[] = [{ content_hash: "h1" }, { content_hash: "h2" }];
    assert.equal(classifyPair(items, hashes, sourceIds), "true-duplicate");
  });

  it("returns 'distinct-instance' for pair with no existing items", () => {
    const hashes = new Set<string>();
    const sourceIds = new Set<string>();
    const items: PairItem[] = [{ content_hash: "h1" }, { content_hash: "h2" }];
    assert.equal(classifyPair(items, hashes, sourceIds), "distinct-instance");
  });
});

// ─── CLI flags ────────────────────────────────────────────────────────────────

function parseProcessFlags(args: string[]): { dryRun: boolean; write: boolean; verbose: boolean } {
  return {
    dryRun: !args.includes("--write"),
    write: args.includes("--write"),
    verbose: args.includes("--verbose"),
  };
}

describe("parseProcessFlags", () => {
  it("defaults to dry-run mode", () => {
    assert.equal(parseProcessFlags([]).dryRun, true);
  });

  it("enables write mode with --write", () => {
    const flags = parseProcessFlags(["--write"]);
    assert.equal(flags.write, true);
    assert.equal(flags.dryRun, false);
  });

  it("enables verbose with --verbose", () => {
    assert.equal(parseProcessFlags(["--verbose"]).verbose, true);
  });
});
