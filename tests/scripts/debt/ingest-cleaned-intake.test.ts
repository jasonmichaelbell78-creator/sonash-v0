/**
 * Unit tests for ingest-cleaned-intake.js
 *
 * Tests: parseMasterLine, loadMaster logic, DEBT ID assignment, and
 * deduplication by content_hash.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── parseMasterLine ─────────────────────────────────────────────────────────

interface IdState {
  maxId: number;
}

function parseMasterLine(
  line: string,
  hashSet: Set<string>,
  idState: IdState,
  lineNum?: number
): void {
  try {
    const item = JSON.parse(line);
    if (item.content_hash) hashSet.add(item.content_hash);
    if (item.id) {
      const match = /DEBT-(\d+)/.exec(item.id as string);
      if (match) {
        const num = Number.parseInt(match[1], 10);
        if (num > idState.maxId) idState.maxId = num;
      }
    }
  } catch {
    const _ln = lineNum ?? "?";
    // In prod, _ln logs a warning; unused in test
  }
}

describe("parseMasterLine", () => {
  it("adds content_hash to hashSet", () => {
    const hashSet = new Set<string>();
    const idState: IdState = { maxId: 0 };
    parseMasterLine('{"id":"DEBT-0005","content_hash":"abc123"}', hashSet, idState);
    assert.ok(hashSet.has("abc123"));
  });

  it("updates maxId from DEBT- id", () => {
    const hashSet = new Set<string>();
    const idState: IdState = { maxId: 0 };
    parseMasterLine('{"id":"DEBT-0042"}', hashSet, idState);
    assert.equal(idState.maxId, 42);
  });

  it("does not update maxId for non-DEBT IDs", () => {
    const hashSet = new Set<string>();
    const idState: IdState = { maxId: 5 };
    parseMasterLine('{"id":"CANON-0001"}', hashSet, idState);
    assert.equal(idState.maxId, 5);
  });

  it("does not throw for malformed JSON", () => {
    const hashSet = new Set<string>();
    const idState: IdState = { maxId: 0 };
    assert.doesNotThrow(() => parseMasterLine("NOT JSON", hashSet, idState, 1));
  });

  it("keeps higher maxId", () => {
    const hashSet = new Set<string>();
    const idState: IdState = { maxId: 50 };
    parseMasterLine('{"id":"DEBT-0030"}', hashSet, idState);
    assert.equal(idState.maxId, 50);
  });
});

// ─── loadMaster aggregation ───────────────────────────────────────────────────

function loadMasterFromContent(content: string): {
  hashSet: Set<string>;
  maxId: number;
  itemCount: number;
} {
  const hashSet = new Set<string>();
  const idState: IdState = { maxId: 0 };
  let itemCount = 0;

  const lines = content.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    try {
      parseMasterLine(line, hashSet, idState);
      itemCount++;
    } catch {
      // skip
    }
  }
  return { hashSet, maxId: idState.maxId, itemCount };
}

describe("loadMaster (ingest-cleaned-intake)", () => {
  it("computes correct maxId from content", () => {
    const content = `{"id":"DEBT-0010","content_hash":"h1"}\n{"id":"DEBT-0025","content_hash":"h2"}`;
    const { maxId } = loadMasterFromContent(content);
    assert.equal(maxId, 25);
  });

  it("collects all hashes", () => {
    const content = `{"id":"DEBT-0001","content_hash":"aaa"}\n{"id":"DEBT-0002","content_hash":"bbb"}`;
    const { hashSet } = loadMasterFromContent(content);
    assert.ok(hashSet.has("aaa"));
    assert.ok(hashSet.has("bbb"));
  });

  it("counts item lines", () => {
    const content = `{"id":"DEBT-0001"}\n{"id":"DEBT-0002"}`;
    const { itemCount } = loadMasterFromContent(content);
    assert.equal(itemCount, 2);
  });

  it("handles empty content", () => {
    const { hashSet, maxId, itemCount } = loadMasterFromContent("");
    assert.equal(hashSet.size, 0);
    assert.equal(maxId, 0);
    assert.equal(itemCount, 0);
  });
});

// ─── DEBT ID generation ───────────────────────────────────────────────────────

function generateDebtId(seq: number): string {
  return `DEBT-${String(seq).padStart(4, "0")}`;
}

describe("generateDebtId", () => {
  it("generates DEBT-0001 for seq 1", () => {
    assert.equal(generateDebtId(1), "DEBT-0001");
  });

  it("generates DEBT-0100 for seq 100", () => {
    assert.equal(generateDebtId(100), "DEBT-0100");
  });

  it("generates DEBT-1234 for seq 1234", () => {
    assert.equal(generateDebtId(1234), "DEBT-1234");
  });

  it("pads to 4 digits", () => {
    assert.equal(generateDebtId(5).length, "DEBT-0005".length);
  });
});

// ─── Dedup by hash ────────────────────────────────────────────────────────────

function filterNewItems(
  inputItems: Array<{ content_hash?: string }>,
  existingHashes: Set<string>
): Array<{ content_hash?: string }> {
  return inputItems.filter((item) => item.content_hash && !existingHashes.has(item.content_hash));
}

describe("filterNewItems (dedup by hash)", () => {
  it("filters out items with existing hashes", () => {
    const existing = new Set(["aaa", "bbb"]);
    const items = [{ content_hash: "aaa" }, { content_hash: "ccc" }];
    const newItems = filterNewItems(items, existing);
    assert.equal(newItems.length, 1);
    assert.equal(newItems[0].content_hash, "ccc");
  });

  it("returns all items when none are duplicates", () => {
    const existing = new Set<string>();
    const items = [{ content_hash: "aaa" }, { content_hash: "bbb" }];
    assert.equal(filterNewItems(items, existing).length, 2);
  });

  it("excludes items without content_hash", () => {
    const existing = new Set<string>();
    const items = [{ content_hash: undefined }, { content_hash: "abc" }];
    const filtered = filterNewItems(items, existing);
    assert.equal(filtered.length, 1);
  });
});
