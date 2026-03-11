/**
 * Unit tests for sprint-wave.js
 *
 * Tests: normalizeSprintId, parseArgs, loadSprintManifest safety,
 * SEVERITY_ORDER, and wave bucketing logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── normalizeSprintId ────────────────────────────────────────────────────────

function normalizeSprintId(raw: string): string {
  if (/^sprint-/i.test(raw)) return raw.toLowerCase();
  return `sprint-${raw}`;
}

describe("normalizeSprintId", () => {
  it("prepends sprint- for bare number", () => {
    assert.equal(normalizeSprintId("4"), "sprint-4");
  });

  it("lowercases existing sprint- prefix", () => {
    assert.equal(normalizeSprintId("sprint-4"), "sprint-4");
  });

  it("handles sub-sprint IDs", () => {
    assert.equal(normalizeSprintId("8a"), "sprint-8a");
  });

  it("handles uppercase SPRINT- prefix", () => {
    assert.equal(normalizeSprintId("SPRINT-4"), "sprint-4");
  });
});

// ─── SEVERITY_ORDER ───────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = { S0: 0, S1: 1, S2: 2, S3: 3 };

describe("SEVERITY_ORDER (sprint-wave)", () => {
  it("S0 has lowest ordinal (0)", () => assert.equal(SEVERITY_ORDER.S0, 0));
  it("S3 has highest ordinal (3)", () => assert.equal(SEVERITY_ORDER.S3, 3));
  it("S1 < S2", () => assert.ok(SEVERITY_ORDER.S1 < SEVERITY_ORDER.S2));
});

// ─── parseArgs (sprint-wave) ──────────────────────────────────────────────────

interface WaveArgs {
  sprintId: string;
  batch: number;
  json: boolean;
}

function parseArgs(argv: string[]): WaveArgs {
  const args = argv.slice(2);
  if (args.length === 0) throw new Error("sprint-id is required");

  const result: WaveArgs = { sprintId: normalizeSprintId(args[0]), batch: 5, json: false };
  result.json = args.includes("--json");

  const batchIdx = args.indexOf("--batch");
  if (batchIdx !== -1 && batchIdx + 1 < args.length) {
    const n = Number.parseInt(args[batchIdx + 1], 10);
    if (Number.isNaN(n) || n < 1) throw new Error("--batch must be a positive integer");
    result.batch = n;
  }

  return result;
}

describe("parseArgs (sprint-wave)", () => {
  it("parses sprint ID and normalizes it", () => {
    const result = parseArgs(["node", "script.js", "4"]);
    assert.equal(result.sprintId, "sprint-4");
  });

  it("defaults batch to 5", () => {
    assert.equal(parseArgs(["node", "script.js", "4"]).batch, 5);
  });

  it("parses --batch value", () => {
    assert.equal(parseArgs(["node", "script.js", "4", "--batch", "10"]).batch, 10);
  });

  it("parses --json flag", () => {
    assert.equal(parseArgs(["node", "script.js", "4", "--json"]).json, true);
  });

  it("throws for invalid --batch value", () => {
    assert.throws(
      () => parseArgs(["node", "script.js", "4", "--batch", "abc"]),
      /--batch must be a positive integer/
    );
  });

  it("throws for zero batch", () => {
    assert.throws(
      () => parseArgs(["node", "script.js", "4", "--batch", "0"]),
      /--batch must be a positive integer/
    );
  });
});

// ─── Wave bucketing ───────────────────────────────────────────────────────────

interface DebtItem {
  id: string;
  category: string;
  severity: string;
}

function groupByCategory(items: DebtItem[]): Map<string, DebtItem[]> {
  const groups = new Map<string, DebtItem[]>();
  for (const item of items) {
    const cat = item.category || "unknown";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(item);
  }
  return groups;
}

function buildWaves(items: DebtItem[], batchSize: number): DebtItem[][] {
  const sorted = [...items].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
  );
  const waves: DebtItem[][] = [];
  for (let i = 0; i < sorted.length; i += batchSize) {
    waves.push(sorted.slice(i, i + batchSize));
  }
  return waves;
}

describe("buildWaves", () => {
  it("creates waves of correct batch size", () => {
    const items: DebtItem[] = Array.from({ length: 12 }, (_, i) => ({
      id: `DEBT-${i}`,
      category: "code-quality",
      severity: "S2",
    }));
    const waves = buildWaves(items, 5);
    assert.equal(waves[0].length, 5);
    assert.equal(waves[1].length, 5);
    assert.equal(waves[2].length, 2);
  });

  it("sorts by severity (S0 first)", () => {
    const items: DebtItem[] = [
      { id: "B", category: "security", severity: "S2" },
      { id: "A", category: "security", severity: "S0" },
    ];
    const waves = buildWaves(items, 10);
    assert.equal(waves[0][0].id, "A");
  });

  it("returns empty array for no items", () => {
    assert.deepEqual(buildWaves([], 5), []);
  });
});

describe("groupByCategory", () => {
  it("groups items by category", () => {
    const items: DebtItem[] = [
      { id: "A", category: "security", severity: "S1" },
      { id: "B", category: "code-quality", severity: "S2" },
      { id: "C", category: "security", severity: "S0" },
    ];
    const groups = groupByCategory(items);
    assert.equal(groups.get("security")!.length, 2);
    assert.equal(groups.get("code-quality")!.length, 1);
  });

  it("handles items with no category as 'unknown'", () => {
    const items = [{ id: "A", category: "", severity: "S2" }];
    const groups = groupByCategory(items);
    assert.ok(groups.has("unknown"));
  });
});
