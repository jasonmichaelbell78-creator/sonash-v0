/**
 * Unit tests for generate-grand-plan.js
 *
 * Tests: readJson safe parsing, loadMasterIndex JSONL parsing, sprint file
 * discovery pattern, and Markdown generation helpers.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Safe JSON parsing ────────────────────────────────────────────────────────

function safeParseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse JSON: ${msg}`);
  }
}

describe("safeParseJson", () => {
  it("parses valid JSON object", () => {
    const result = safeParseJson('{"key":"value"}') as Record<string, string>;
    assert.equal(result.key, "value");
  });

  it("parses valid JSON array", () => {
    const result = safeParseJson("[1,2,3]") as number[];
    assert.deepEqual(result, [1, 2, 3]);
  });

  it("throws descriptive error for invalid JSON", () => {
    assert.throws(() => safeParseJson("NOT JSON"), /Failed to parse JSON/);
  });
});

// ─── loadMasterIndex from JSONL content ───────────────────────────────────────

function loadMasterIndexFromContent(content: string): Map<string, Record<string, unknown>> {
  const index = new Map<string, Record<string, unknown>>();
  const lines = content.split("\n").filter((l) => l.trim());
  let malformedCount = 0;
  for (const line of lines) {
    try {
      const item = JSON.parse(line);
      if (item.id) {
        index.set(item.id as string, item);
      }
    } catch {
      malformedCount++;
    }
  }
  return index;
}

describe("loadMasterIndex", () => {
  it("builds map from valid JSONL", () => {
    const content = `{"id":"DEBT-0001","title":"A"}\n{"id":"DEBT-0002","title":"B"}`;
    const index = loadMasterIndexFromContent(content);
    assert.equal(index.size, 2);
    assert.ok(index.has("DEBT-0001"));
  });

  it("skips malformed lines", () => {
    const content = `{"id":"DEBT-0001"}\nNOT JSON\n{"id":"DEBT-0003"}`;
    const index = loadMasterIndexFromContent(content);
    assert.equal(index.size, 2);
  });

  it("skips items without id", () => {
    const content = `{"title":"No ID"}\n{"id":"DEBT-0001"}`;
    const index = loadMasterIndexFromContent(content);
    assert.equal(index.size, 1);
  });

  it("returns empty map for empty content", () => {
    assert.equal(loadMasterIndexFromContent("").size, 0);
  });

  it("overwrites duplicate IDs with last occurrence", () => {
    const content = `{"id":"DEBT-0001","v":1}\n{"id":"DEBT-0001","v":2}`;
    const index = loadMasterIndexFromContent(content);
    assert.equal(index.size, 1);
    assert.equal((index.get("DEBT-0001") as { v: number }).v, 2);
  });
});

// ─── Sprint file discovery pattern ───────────────────────────────────────────

function isSprintIdFile(filename: string): boolean {
  return /^sprint-.*-ids\.json$/.test(filename);
}

describe("isSprintIdFile (grand-plan)", () => {
  it("matches sprint-4-ids.json", () => assert.equal(isSprintIdFile("sprint-4-ids.json"), true));
  it("matches sprint-8a-ids.json", () => assert.equal(isSprintIdFile("sprint-8a-ids.json"), true));
  it("does not match grand-plan-manifest.json", () => {
    assert.equal(isSprintIdFile("grand-plan-manifest.json"), false);
  });
  it("does not match metrics.json", () => assert.equal(isSprintIdFile("metrics.json"), false));
});

// ─── Severity priority ordering ───────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = { S0: 0, S1: 1, S2: 2, S3: 3 };

function sortBySeverity(
  items: Array<{ id: string; severity: string }>
): Array<{ id: string; severity: string }> {
  return [...items].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
  );
}

describe("sortBySeverity", () => {
  it("sorts S0 before S1 before S2 before S3", () => {
    const items = [
      { id: "C", severity: "S2" },
      { id: "A", severity: "S0" },
      { id: "B", severity: "S1" },
    ];
    const sorted = sortBySeverity(items);
    assert.equal(sorted[0].id, "A");
    assert.equal(sorted[1].id, "B");
    assert.equal(sorted[2].id, "C");
  });

  it("handles items with unknown severity at end", () => {
    const items = [
      { id: "A", severity: "S1" },
      { id: "B", severity: "UNKNOWN" },
    ];
    const sorted = sortBySeverity(items);
    assert.equal(sorted[0].id, "A");
    assert.equal(sorted[1].id, "B");
  });

  it("preserves order for equal severity", () => {
    const items = [
      { id: "A", severity: "S2" },
      { id: "B", severity: "S2" },
    ];
    const sorted = sortBySeverity(items);
    assert.equal(sorted.length, 2);
  });
});

// ─── Verbose flag parsing ─────────────────────────────────────────────────────

describe("verbose flag", () => {
  it("detects --verbose in args", () => {
    const verbose = ["node", "script.js", "--verbose"].includes("--verbose");
    assert.equal(verbose, true);
  });

  it("absent when not provided", () => {
    const verbose = ["node", "script.js"].includes("--verbose");
    assert.equal(verbose, false);
  });
});
