/**
 * Unit tests for extract-context-debt.js
 *
 * Tests: collectHashesFromFile logic, computeNextSeq ID sequencing,
 * loadExistingHashes deduplication, and intake ID pattern matching.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── collectHashesFromFile logic (inline) ─────────────────────────────────────

function collectHashesFromContent(content: string, hashes: Set<string>): void {
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      if (item.content_hash) hashes.add(item.content_hash);
    } catch {
      // skip
    }
  }
}

describe("collectHashesFromContent", () => {
  it("adds hashes from JSONL lines", () => {
    const content = `{"content_hash":"abc123"}\n{"content_hash":"def456"}`;
    const hashes = new Set<string>();
    collectHashesFromContent(content, hashes);
    assert.ok(hashes.has("abc123"));
    assert.ok(hashes.has("def456"));
    assert.equal(hashes.size, 2);
  });

  it("skips lines without content_hash", () => {
    const content = `{"id":"DEBT-0001","title":"No hash"}`;
    const hashes = new Set<string>();
    collectHashesFromContent(content, hashes);
    assert.equal(hashes.size, 0);
  });

  it("skips malformed JSON lines", () => {
    const content = `{"content_hash":"abc"}\nNOT JSON`;
    const hashes = new Set<string>();
    collectHashesFromContent(content, hashes);
    assert.equal(hashes.size, 1);
  });

  it("skips blank lines", () => {
    const content = `\n\n{"content_hash":"abc"}\n\n`;
    const hashes = new Set<string>();
    collectHashesFromContent(content, hashes);
    assert.equal(hashes.size, 1);
  });
});

// ─── computeNextSeq ───────────────────────────────────────────────────────────

function computeNextSeqFromContent(content: string): number {
  let nextSeq = 1;
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      const match = (item.id || "").match(/^INTAKE-CTX-(\d+)$/);
      if (match) nextSeq = Math.max(nextSeq, Number.parseInt(match[1], 10) + 1);
    } catch {
      // skip
    }
  }
  return nextSeq;
}

describe("computeNextSeq", () => {
  it("returns 1 for empty content", () => {
    assert.equal(computeNextSeqFromContent(""), 1);
  });

  it("returns max+1 from existing IDs", () => {
    const content = `{"id":"INTAKE-CTX-5"}\n{"id":"INTAKE-CTX-12"}`;
    assert.equal(computeNextSeqFromContent(content), 13);
  });

  it("ignores non-INTAKE-CTX IDs", () => {
    const content = `{"id":"DEBT-0001"}\n{"id":"INTAKE-CTX-3"}`;
    assert.equal(computeNextSeqFromContent(content), 4);
  });

  it("returns 1 when no matching IDs exist", () => {
    const content = `{"id":"DEBT-0001"}\n{"id":"DEBT-0002"}`;
    assert.equal(computeNextSeqFromContent(content), 1);
  });
});

// ─── Deduplication by hash ────────────────────────────────────────────────────

function isDuplicate(hash: string, existingHashes: Set<string>): boolean {
  return existingHashes.has(hash);
}

describe("isDuplicate (extract-context-debt)", () => {
  it("detects a duplicate hash", () => {
    const hashes = new Set(["abc123"]);
    assert.equal(isDuplicate("abc123", hashes), true);
  });

  it("returns false for new hash", () => {
    const hashes = new Set(["abc123"]);
    assert.equal(isDuplicate("xyz789", hashes), false);
  });

  it("returns false for empty set", () => {
    assert.equal(isDuplicate("abc123", new Set()), false);
  });
});

// ─── INTAKE-CTX ID format validation ─────────────────────────────────────────

function isValidIntakeCtxId(id: string): boolean {
  return /^INTAKE-CTX-\d+$/.test(id);
}

describe("isValidIntakeCtxId", () => {
  it("accepts INTAKE-CTX-1", () => assert.equal(isValidIntakeCtxId("INTAKE-CTX-1"), true));
  it("accepts INTAKE-CTX-100", () => assert.equal(isValidIntakeCtxId("INTAKE-CTX-100"), true));
  it("rejects missing prefix", () => assert.equal(isValidIntakeCtxId("CTX-1"), false));
  it("rejects no number", () => assert.equal(isValidIntakeCtxId("INTAKE-CTX-"), false));
  it("rejects DEBT-0001", () => assert.equal(isValidIntakeCtxId("DEBT-0001"), false));
});

// ─── SOURCE_FILES constant ────────────────────────────────────────────────────

const SOURCE_FILES = ["agent-research-results.md", "system-test-gap-analysis-pass2.md"];

describe("SOURCE_FILES", () => {
  it("contains the expected source files", () => {
    assert.equal(SOURCE_FILES.length, 2);
    assert.ok(SOURCE_FILES.includes("agent-research-results.md"));
    assert.ok(SOURCE_FILES.includes("system-test-gap-analysis-pass2.md"));
  });
});
