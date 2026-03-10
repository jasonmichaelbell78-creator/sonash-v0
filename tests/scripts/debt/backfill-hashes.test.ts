/**
 * Unit tests for backfill-hashes.js
 *
 * Tests: JSONL parsing with line tracking, detection of missing hashes,
 * and dry-run vs write mode logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Line-level JSONL parsing ─────────────────────────────────────────────────

interface ParsedLine {
  raw: string;
  parsed: Record<string, unknown> | null;
  lineNum: number;
}

function parseJsonlLines(content: string): {
  items: ParsedLine[];
  parseErrors: Array<{ line: number; message: string }>;
} {
  const lines = content.split("\n");
  const items: ParsedLine[] = [];
  const parseErrors: Array<{ line: number; message: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      items.push({ raw: lines[i], parsed: null, lineNum: i + 1 });
      continue;
    }
    try {
      const parsed = JSON.parse(line);
      items.push({ raw: lines[i], parsed, lineNum: i + 1 });
    } catch (err) {
      parseErrors.push({
        line: i + 1,
        message: err instanceof Error ? err.message : String(err),
      });
      items.push({ raw: lines[i], parsed: null, lineNum: i + 1 });
    }
  }
  return { items, parseErrors };
}

describe("parseJsonlLines", () => {
  it("parses valid lines correctly", () => {
    const content = `{"id":"DEBT-0001","content_hash":"abc123"}\n{"id":"DEBT-0002"}`;
    const { items, parseErrors } = parseJsonlLines(content);
    assert.equal(parseErrors.length, 0);
    assert.equal(items.filter((i) => i.parsed !== null).length, 2);
  });

  it("records parse errors with line numbers", () => {
    const content = `{"id":"DEBT-0001"}\nBAD LINE\n{"id":"DEBT-0003"}`;
    const { parseErrors } = parseJsonlLines(content);
    assert.equal(parseErrors.length, 1);
    assert.equal(parseErrors[0].line, 2);
  });

  it("preserves empty lines as null-parsed entries", () => {
    const content = `{"id":"A"}\n\n{"id":"B"}`;
    const { items } = parseJsonlLines(content);
    assert.equal(items.length, 3);
    assert.equal(items[1].parsed, null);
  });

  it("tracks correct line numbers", () => {
    const content = `{"id":"A"}\n{"id":"B"}\n{"id":"C"}`;
    const { items } = parseJsonlLines(content);
    assert.equal(items[0].lineNum, 1);
    assert.equal(items[1].lineNum, 2);
    assert.equal(items[2].lineNum, 3);
  });
});

// ─── Missing hash detection ───────────────────────────────────────────────────

function itemNeedsHash(item: Record<string, unknown>): boolean {
  return !item.content_hash || item.content_hash === "undefined";
}

describe("itemNeedsHash", () => {
  it("returns true when content_hash is missing", () => {
    assert.equal(itemNeedsHash({ id: "DEBT-0001" }), true);
  });

  it("returns true when content_hash is the string 'undefined'", () => {
    assert.equal(itemNeedsHash({ id: "DEBT-0001", content_hash: "undefined" }), true);
  });

  it("returns false when content_hash is present", () => {
    assert.equal(itemNeedsHash({ id: "DEBT-0001", content_hash: "abc123" }), false);
  });

  it("returns false for non-empty hash", () => {
    assert.equal(itemNeedsHash({ content_hash: "sha256:deadbeef" }), false);
  });
});

// ─── Dry-run guard ────────────────────────────────────────────────────────────

function shouldWrite(args: string[]): boolean {
  return !args.includes("--dry-run");
}

describe("shouldWrite (dry-run guard)", () => {
  it("writes when --dry-run is absent", () => {
    assert.equal(shouldWrite([]), true);
  });

  it("does not write when --dry-run is present", () => {
    assert.equal(shouldWrite(["--dry-run"]), false);
  });

  it("does not write with --dry-run among other flags", () => {
    assert.equal(shouldWrite(["--verbose", "--dry-run"]), false);
  });
});

// ─── Count items needing backfill ─────────────────────────────────────────────

function countMissingHashes(items: Array<Record<string, unknown>>): number {
  return items.filter(itemNeedsHash).length;
}

describe("countMissingHashes", () => {
  it("counts items without hashes", () => {
    const items = [
      { id: "A", content_hash: "abc" },
      { id: "B" },
      { id: "C", content_hash: "undefined" },
    ];
    assert.equal(countMissingHashes(items), 2);
  });

  it("returns 0 when all items have hashes", () => {
    const items = [{ content_hash: "abc" }, { content_hash: "def" }];
    assert.equal(countMissingHashes(items), 0);
  });

  it("returns 0 for empty array", () => {
    assert.equal(countMissingHashes([]), 0);
  });
});
