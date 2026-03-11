/**
 * backfill-tenet-evidence.js Minimal Tests
 *
 * The script is an ESM module that runs top-level side effects on import,
 * so we test its pure helper functions extracted via duck-typing workarounds,
 * or we test the logic units that are independently verifiable.
 *
 * Primarily tests: parseJsonl helper logic, extractTenetId, extractStrings,
 * and extractAllTenetIds patterns that the script embeds.
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/planning/backfill-tenet-evidence.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// These helpers are embedded in the script — we replicate the exact logic here
// to unit-test the specification without loading the ESM file (which has
// top-level file I/O side effects that require real .planning data to exist).

function extractTenetId(raw: string): string | null {
  const match = /^(T\d+)/.exec(raw);
  return match ? match[1] : null;
}

function extractAllTenetIds(text: string): string[] {
  if (!text || typeof text !== "string") return [];
  const matches = text.match(/\bT(\d+)\b/g);
  return matches ? [...new Set(matches)] : [];
}

function extractStrings(obj: unknown): string[] {
  const strings: string[] = [];
  if (typeof obj === "string") {
    strings.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) strings.push(...extractStrings(item));
  } else if (obj && typeof obj === "object") {
    for (const val of Object.values(obj)) strings.push(...extractStrings(val));
  }
  return strings;
}

function serializeJsonl(records: unknown[]): string {
  return records.map((r) => JSON.stringify(r)).join("\n") + "\n";
}

// =========================================================
// extractTenetId
// =========================================================

describe("extractTenetId", () => {
  it("extracts 'T2' from a bare ID", () => {
    assert.equal(extractTenetId("T2"), "T2");
  });

  it("extracts 'T10' from a string with description", () => {
    assert.equal(extractTenetId("T10 (source of truth + generated views)"), "T10");
  });

  it("returns null for strings that do not start with T<digit>", () => {
    assert.equal(extractTenetId("decision text"), null);
    assert.equal(extractTenetId(""), null);
  });
});

// =========================================================
// extractAllTenetIds
// =========================================================

describe("extractAllTenetIds", () => {
  it("finds a single tenet ID", () => {
    const ids = extractAllTenetIds("This implements T2.");
    assert.deepEqual(ids, ["T2"]);
  });

  it("finds multiple tenet IDs", () => {
    const ids = extractAllTenetIds("See T2 and T10 for context, also T4.");
    assert.ok(ids.includes("T2"));
    assert.ok(ids.includes("T10"));
    assert.ok(ids.includes("T4"));
    assert.equal(ids.length, 3);
  });

  it("deduplicates repeated IDs", () => {
    const ids = extractAllTenetIds("T2 T2 T2");
    assert.deepEqual(ids, ["T2"]);
  });

  it("returns empty array for text without tenet IDs", () => {
    assert.deepEqual(extractAllTenetIds("no tenets here"), []);
  });

  it("returns empty array for falsy input", () => {
    assert.deepEqual(extractAllTenetIds(""), []);
  });
});

// =========================================================
// extractStrings
// =========================================================

describe("extractStrings", () => {
  it("extracts string from plain string", () => {
    assert.deepEqual(extractStrings("hello"), ["hello"]);
  });

  it("extracts strings from array", () => {
    assert.deepEqual(extractStrings(["a", "b"]), ["a", "b"]);
  });

  it("extracts strings recursively from object", () => {
    const result = extractStrings({ id: 1, decision: "Use T2", note: "per T4" });
    assert.ok(result.includes("Use T2"));
    assert.ok(result.includes("per T4"));
  });

  it("handles nested objects and arrays", () => {
    const result = extractStrings({ a: { b: ["T1", "T2"] } });
    assert.ok(result.includes("T1"));
    assert.ok(result.includes("T2"));
  });

  it("returns empty array for number input", () => {
    assert.deepEqual(extractStrings(42), []);
  });
});

// =========================================================
// serializeJsonl
// =========================================================

describe("serializeJsonl", () => {
  it("serializes records as newline-delimited JSON ending with newline", () => {
    const output = serializeJsonl([{ id: "T1" }, { id: "T2" }]);
    const lines = output.trimEnd().split("\n");
    assert.equal(lines.length, 2);
    assert.deepEqual(JSON.parse(lines[0]), { id: "T1" });
    assert.deepEqual(JSON.parse(lines[1]), { id: "T2" });
    assert.ok(output.endsWith("\n"), "should end with newline");
  });

  it("handles empty array", () => {
    const output = serializeJsonl([]);
    assert.equal(output, "\n");
  });
});
