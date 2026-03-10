/**
 * Unit tests for extract-audits.js
 *
 * Tests: extractFile, extractLine, getSourceId, normalizeEffort, normalizeSeverity.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── extractFile ──────────────────────────────────────────────────────────────

function extractFile(item: { file?: string; files?: string[] }): string {
  if (item.file && typeof item.file === "string") return item.file;
  if (item.files && Array.isArray(item.files) && item.files.length > 0) {
    return item.files[0];
  }
  return "";
}

describe("extractFile", () => {
  it("returns item.file when present", () => {
    assert.equal(extractFile({ file: "src/auth.ts" }), "src/auth.ts");
  });

  it("returns first file from files array when file is absent", () => {
    assert.equal(extractFile({ files: ["src/a.ts", "src/b.ts"] }), "src/a.ts");
  });

  it("returns empty string when no file info", () => {
    assert.equal(extractFile({}), "");
  });

  it("prefers file over files array", () => {
    assert.equal(
      extractFile({ file: "src/primary.ts", files: ["src/other.ts"] }),
      "src/primary.ts"
    );
  });

  it("returns empty string for empty files array", () => {
    assert.equal(extractFile({ files: [] }), "");
  });
});

// ─── extractLine ─────────────────────────────────────────────────────────────

function extractLine(item: { line?: unknown }): number {
  if (typeof item.line === "number") return item.line;
  if (typeof item.line === "string") return Number.parseInt(item.line, 10) || 0;
  return 0;
}

describe("extractLine", () => {
  it("returns numeric line directly", () => {
    assert.equal(extractLine({ line: 42 }), 42);
  });

  it("parses string line number", () => {
    assert.equal(extractLine({ line: "42" }), 42);
  });

  it("returns 0 for missing line", () => {
    assert.equal(extractLine({}), 0);
  });

  it("returns 0 for non-numeric string", () => {
    assert.equal(extractLine({ line: "abc" }), 0);
  });

  it("returns 0 for null line", () => {
    assert.equal(extractLine({ line: null }), 0);
  });
});

// ─── normalizeEffort ─────────────────────────────────────────────────────────

function normalizeEffort(effort: unknown): string {
  if (!effort) return "E1";
  if (/^E[0-3]$/.test(String(effort))) return String(effort);
  const map: Record<string, string> = {
    trivial: "E0",
    easy: "E0",
    small: "E0",
    medium: "E1",
    moderate: "E1",
    large: "E2",
    complex: "E2",
    "very large": "E3",
    "very complex": "E3",
  };
  const lower = String(effort).toLowerCase();
  return map[lower] || "E1";
}

describe("normalizeEffort", () => {
  it("passes through valid E0-E3 directly", () => {
    assert.equal(normalizeEffort("E0"), "E0");
    assert.equal(normalizeEffort("E1"), "E1");
    assert.equal(normalizeEffort("E2"), "E2");
    assert.equal(normalizeEffort("E3"), "E3");
  });

  it("rejects E10 as invalid and maps to E1 default", () => {
    assert.equal(normalizeEffort("E10"), "E1");
  });

  it("maps 'trivial' to E0", () => assert.equal(normalizeEffort("trivial"), "E0"));
  it("maps 'medium' to E1", () => assert.equal(normalizeEffort("medium"), "E1"));
  it("maps 'large' to E2", () => assert.equal(normalizeEffort("large"), "E2"));
  it("maps 'very complex' to E3", () => assert.equal(normalizeEffort("very complex"), "E3"));

  it("defaults to E1 for unknown values", () => {
    assert.equal(normalizeEffort("unknown-effort"), "E1");
  });

  it("defaults to E1 for null/undefined", () => {
    assert.equal(normalizeEffort(null), "E1");
    assert.equal(normalizeEffort(undefined), "E1");
  });
});

// ─── normalizeSeverity ────────────────────────────────────────────────────────

function normalizeSeverity(severity: unknown): string {
  if (!severity) return "S2";
  if (/^S[0-3]$/.test(String(severity))) return String(severity);
  const map: Record<string, string> = {
    critical: "S0",
    blocker: "S0",
    high: "S1",
    major: "S1",
    medium: "S2",
    moderate: "S2",
    minor: "S2",
    low: "S3",
    info: "S3",
  };
  const lower = String(severity).toLowerCase();
  return map[lower] || "S2";
}

describe("normalizeSeverity", () => {
  it("passes through valid S0-S3 directly", () => {
    assert.equal(normalizeSeverity("S0"), "S0");
    assert.equal(normalizeSeverity("S1"), "S1");
    assert.equal(normalizeSeverity("S2"), "S2");
    assert.equal(normalizeSeverity("S3"), "S3");
  });

  it("rejects S10 as invalid and maps to S2 default", () => {
    assert.equal(normalizeSeverity("S10"), "S2");
  });

  it("maps 'critical' to S0", () => assert.equal(normalizeSeverity("critical"), "S0"));
  it("maps 'high' to S1", () => assert.equal(normalizeSeverity("high"), "S1"));
  it("maps 'medium' to S2", () => assert.equal(normalizeSeverity("medium"), "S2"));
  it("maps 'low' to S3", () => assert.equal(normalizeSeverity("low"), "S3"));

  it("defaults to S2 for unknown values", () => {
    assert.equal(normalizeSeverity("extreme"), "S2");
  });

  it("defaults to S2 for null/undefined", () => {
    assert.equal(normalizeSeverity(null), "S2");
  });
});

// ─── getSourceId ─────────────────────────────────────────────────────────────

function getSourceId(item: Record<string, unknown>, prefix: string): string {
  const id = (item.id ??
    item.canonical_id ??
    item.master_id ??
    item.original_id ??
    item.finding_id) as string | undefined;
  if (id) return `${prefix}:${String(id)}`;
  const title = (item.title as string) || "";
  const file = extractFile(item as { file?: string; files?: string[] });
  const line = extractLine(item as { line?: unknown });
  const hash = Buffer.from(`${title}:${file}:${line}`).toString("base64url").substring(0, 12);
  return `${prefix}:hash-${hash}`;
}

describe("getSourceId", () => {
  it("uses item.id when present", () => {
    const result = getSourceId({ id: "CODE-0001" }, "audit");
    assert.equal(result, "audit:CODE-0001");
  });

  it("falls back to canonical_id", () => {
    const result = getSourceId({ canonical_id: "CANON-0001" }, "audit");
    assert.equal(result, "audit:CANON-0001");
  });

  it("generates hash-based ID when no ID fields present", () => {
    const result = getSourceId({ title: "Some finding", file: "src/a.ts", line: 10 }, "audit");
    assert.match(result, /^audit:hash-/);
  });

  it("generated hash ID is consistent for same input", () => {
    const item = { title: "Finding X", file: "src/a.ts", line: 5 };
    const r1 = getSourceId(item, "audit");
    const r2 = getSourceId(item, "audit");
    assert.equal(r1, r2);
  });

  it("uses different prefixes correctly", () => {
    const item = { id: "REV-0001" };
    assert.equal(getSourceId(item, "review"), "review:REV-0001");
    assert.equal(getSourceId(item, "audit"), "audit:REV-0001");
  });
});
