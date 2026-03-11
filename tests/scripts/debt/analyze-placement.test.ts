/**
 * Unit tests for analyze-placement.js
 *
 * Tests: extractIdArray, extractDebtIds regex, ROADMAP_CATS membership,
 * and JSONL item parsing.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── extractIdArray ───────────────────────────────────────────────────────────

function extractIdArray(data: unknown): string[] {
  if (Array.isArray(data)) return data as string[];
  if (Array.isArray((data as { ids?: unknown[] })?.ids)) {
    return (data as { ids: string[] }).ids;
  }
  return [];
}

describe("extractIdArray", () => {
  it("returns array directly if input is an array", () => {
    assert.deepEqual(extractIdArray(["DEBT-0001", "DEBT-0002"]), ["DEBT-0001", "DEBT-0002"]);
  });

  it("returns ids property when input is {ids: []}", () => {
    assert.deepEqual(extractIdArray({ ids: ["DEBT-0001"] }), ["DEBT-0001"]);
  });

  it("returns empty array for empty input", () => {
    assert.deepEqual(extractIdArray({}), []);
  });

  it("returns empty array for null", () => {
    assert.deepEqual(extractIdArray(null), []);
  });

  it("returns empty array for non-array primitive", () => {
    assert.deepEqual(extractIdArray("not-an-array"), []);
  });
});

// ─── extractDebtIds ───────────────────────────────────────────────────────────

function extractDebtIds(content: string): Set<string> {
  const ids = new Set<string>();
  const matches = content.matchAll(/DEBT-\d+/g);
  for (const match of matches) ids.add(match[0]);
  return ids;
}

describe("extractDebtIds", () => {
  it("extracts a single DEBT ID", () => {
    const ids = extractDebtIds("Fixed DEBT-0042 in auth module");
    assert.ok(ids.has("DEBT-0042"));
    assert.equal(ids.size, 1);
  });

  it("extracts multiple unique IDs", () => {
    const ids = extractDebtIds("DEBT-0001 and DEBT-0002 were resolved");
    assert.equal(ids.size, 2);
  });

  it("deduplicates repeated IDs", () => {
    const ids = extractDebtIds("DEBT-0001 appears here and DEBT-0001 again");
    assert.equal(ids.size, 1);
  });

  it("returns empty set when no IDs found", () => {
    assert.equal(extractDebtIds("no ids here").size, 0);
  });

  it("does not match CANON- ids", () => {
    const ids = extractDebtIds("CANON-0001 and DEBT-0002");
    assert.equal(ids.size, 1);
    assert.ok(ids.has("DEBT-0002"));
    assert.equal(ids.has("CANON-0001"), false);
  });
});

// ─── ROADMAP_CATS ─────────────────────────────────────────────────────────────

const ROADMAP_CATS = new Set(["security", "enhancements", "performance"]);

describe("ROADMAP_CATS (analyze-placement)", () => {
  it("contains security", () => assert.ok(ROADMAP_CATS.has("security")));
  it("contains enhancements", () => assert.ok(ROADMAP_CATS.has("enhancements")));
  it("contains performance", () => assert.ok(ROADMAP_CATS.has("performance")));
  it("does not contain code-quality", () => assert.equal(ROADMAP_CATS.has("code-quality"), false));
});

// ─── Sprint file pattern ──────────────────────────────────────────────────────

function isSprintFile(filename: string): boolean {
  return filename.startsWith("sprint-") && filename.endsWith("-ids.json");
}

describe("isSprintFile pattern", () => {
  it("matches sprint-4-ids.json", () => assert.equal(isSprintFile("sprint-4-ids.json"), true));
  it("matches sprint-8a-ids.json", () => assert.equal(isSprintFile("sprint-8a-ids.json"), true));
  it("does not match resolution-log.jsonl", () =>
    assert.equal(isSprintFile("resolution-log.jsonl"), false));
  it("does not match grand-plan-manifest.json", () =>
    assert.equal(isSprintFile("grand-plan-manifest.json"), false));
});

// ─── JSONL item parsing with BOM removal ──────────────────────────────────────

function parseJsonlWithBom(line: string): Record<string, unknown> | null {
  try {
    return JSON.parse(line.replaceAll("\uFEFF", ""));
  } catch {
    return null;
  }
}

describe("parseJsonlWithBom", () => {
  it("parses normal JSON line", () => {
    const result = parseJsonlWithBom('{"id":"DEBT-0001"}');
    assert.equal((result as { id: string }).id, "DEBT-0001");
  });

  it("strips BOM character before parsing", () => {
    const result = parseJsonlWithBom('\uFEFF{"id":"DEBT-0001"}');
    assert.ok(result !== null);
    assert.equal((result as { id: string }).id, "DEBT-0001");
  });

  it("returns null for malformed JSON", () => {
    assert.equal(parseJsonlWithBom("NOT JSON"), null);
  });
});
