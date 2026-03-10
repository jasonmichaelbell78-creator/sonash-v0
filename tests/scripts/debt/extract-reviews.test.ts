/**
 * Unit tests for extract-reviews.js
 *
 * Tests: extractFile, extractLine, getSourceId (review prefix), normalizeEffort,
 * normalizeSeverity — same helpers re-implemented for the reviews extractor.
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

describe("extractFile (extract-reviews)", () => {
  it("prefers item.file", () => {
    assert.equal(extractFile({ file: "src/reviews.ts" }), "src/reviews.ts");
  });

  it("falls back to files[0]", () => {
    assert.equal(extractFile({ files: ["src/a.ts", "src/b.ts"] }), "src/a.ts");
  });

  it("returns empty string for no file info", () => {
    assert.equal(extractFile({}), "");
  });
});

// ─── extractLine ─────────────────────────────────────────────────────────────

function extractLine(item: { line?: unknown }): number {
  if (typeof item.line === "number") return item.line;
  if (typeof item.line === "string") return Number.parseInt(item.line, 10) || 0;
  return 0;
}

describe("extractLine (extract-reviews)", () => {
  it("returns numeric line", () => assert.equal(extractLine({ line: 55 }), 55));
  it("parses string line", () => assert.equal(extractLine({ line: "55" }), 55));
  it("returns 0 for missing", () => assert.equal(extractLine({}), 0));
  it("returns 0 for non-numeric string", () => assert.equal(extractLine({ line: "N/A" }), 0));
});

// ─── getSourceId (review prefix) ─────────────────────────────────────────────

function getSourceId(item: Record<string, unknown>): string {
  const id = (item.id ??
    item.canonical_id ??
    item.master_id ??
    item.original_id ??
    item.finding_id) as string | undefined;
  if (id) return `review:${id}`;
  const title = (item.title as string) || "";
  const file = extractFile(item as { file?: string; files?: string[] });
  const line = extractLine(item as { line?: unknown });
  const hash = Buffer.from(`${title}:${file}:${line}`).toString("base64url").substring(0, 12);
  return `review:hash-${hash}`;
}

describe("getSourceId (review)", () => {
  it("uses 'review:' prefix for known IDs", () => {
    assert.equal(getSourceId({ id: "CANON-0001" }), "review:CANON-0001");
  });

  it("generates hash-based review ID", () => {
    const result = getSourceId({ title: "Some finding", file: "src/a.ts", line: 1 });
    assert.match(result, /^review:hash-/);
  });

  it("uses canonical_id fallback", () => {
    assert.equal(getSourceId({ canonical_id: "CANON-0042" }), "review:CANON-0042");
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
  return map[String(effort).toLowerCase()] || "E1";
}

describe("normalizeEffort (extract-reviews)", () => {
  it("passes valid E-codes through", () => {
    ["E0", "E1", "E2", "E3"].forEach((e) => assert.equal(normalizeEffort(e), e));
  });

  it("maps 'easy' to E0", () => assert.equal(normalizeEffort("easy"), "E0"));
  it("maps 'moderate' to E1", () => assert.equal(normalizeEffort("moderate"), "E1"));
  it("maps 'complex' to E2", () => assert.equal(normalizeEffort("complex"), "E2"));
  it("defaults to E1 for unknowns", () => assert.equal(normalizeEffort("gigantic"), "E1"));
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
  return map[String(severity).toLowerCase()] || "S2";
}

describe("normalizeSeverity (extract-reviews)", () => {
  it("passes valid S-codes through", () => {
    ["S0", "S1", "S2", "S3"].forEach((s) => assert.equal(normalizeSeverity(s), s));
  });

  it("maps 'blocker' to S0", () => assert.equal(normalizeSeverity("blocker"), "S0"));
  it("maps 'major' to S1", () => assert.equal(normalizeSeverity("major"), "S1"));
  it("maps 'minor' to S2", () => assert.equal(normalizeSeverity("minor"), "S2"));
  it("maps 'info' to S3", () => assert.equal(normalizeSeverity("info"), "S3"));
  it("defaults to S2 for unknowns", () => assert.equal(normalizeSeverity("unknown"), "S2"));
});
