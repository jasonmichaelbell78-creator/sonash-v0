/**
 * generate-discovery-record.js Minimal Tests
 *
 * generate-discovery-record.js is an ESM module with top-level JSONL I/O.
 * We test the pure helper logic it embeds: readCoordination fallback,
 * ecosystem-assessment parsing, escapeCell, and maxDecisionId derivation.
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/planning/generate-discovery-record.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mirror escapeCell from generate-discovery-record.js (same as generate-decisions)
function escapeCell(s: string | undefined | null): string {
  if (!s) return "";
  return String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

// Mirror readCoordination fallback (returns {} on error)
function readCoordination(rawContent: string | null): Record<string, unknown> {
  if (!rawContent) return {};
  try {
    return JSON.parse(rawContent);
  } catch {
    return {};
  }
}

// Mirror maxDecisionId derivation
function deriveMaxDecisionId(decisions: Array<{ id: number }>): number | string {
  return decisions.length > 0 ? decisions.reduce((max, d) => Math.max(max, d.id), 0) : "?";
}

// Mirror assessment decision filter
interface DecisionRecord {
  id: number;
  decision?: string;
  choice?: string;
  assessment_summary?: string;
  effort?: string;
  staging?: string;
  superseded_by?: number;
  user_directive?: boolean;
  user_override?: boolean;
}

function isAssessmentDecision(d: DecisionRecord): boolean {
  return !!(
    d.assessment_summary ||
    (d.choice?.includes("Current L") && d.choice?.includes("Target L"))
  );
}

// =========================================================
// escapeCell
// =========================================================

describe("escapeCell (discovery record)", () => {
  it("escapes pipe characters for Markdown tables", () => {
    const result = escapeCell("foo | bar");
    assert.ok(result.includes("\\|"));
  });

  it("replaces newlines with spaces", () => {
    const result = escapeCell("line1\nline2");
    assert.ok(!result.includes("\n"));
  });

  it("returns empty string for null/undefined", () => {
    assert.equal(escapeCell(null), "");
    assert.equal(escapeCell(undefined), "");
  });
});

// =========================================================
// readCoordination fallback
// =========================================================

describe("readCoordination fallback", () => {
  it("parses valid JSON content", () => {
    const result = readCoordination(JSON.stringify({ status: "in-progress" }));
    assert.equal((result as { status: string }).status, "in-progress");
  });

  it("returns empty object for invalid JSON", () => {
    const result = readCoordination("{ not valid");
    assert.deepEqual(result, {});
  });

  it("returns empty object for null content", () => {
    const result = readCoordination(null);
    assert.deepEqual(result, {});
  });
});

// =========================================================
// maxDecisionId derivation
// =========================================================

describe("deriveMaxDecisionId", () => {
  it("returns max id from decisions array", () => {
    const decisions = [{ id: 1 }, { id: 55 }, { id: 12 }];
    assert.equal(deriveMaxDecisionId(decisions), 55);
  });

  it("returns '?' for empty array", () => {
    assert.equal(deriveMaxDecisionId([]), "?");
  });

  it("handles single-element array", () => {
    assert.equal(deriveMaxDecisionId([{ id: 42 }]), 42);
  });
});

// =========================================================
// isAssessmentDecision
// =========================================================

describe("isAssessmentDecision filter", () => {
  it("returns true when choice contains maturity level pattern", () => {
    const d: DecisionRecord = {
      id: 35,
      choice: "Current L2 → Target L4",
    };
    assert.equal(isAssessmentDecision(d), true);
  });

  it("returns true when assessment_summary is present", () => {
    const d: DecisionRecord = {
      id: 36,
      assessment_summary: "some summary",
      choice: "Use TypeScript",
    };
    assert.equal(isAssessmentDecision(d), true);
  });

  it("returns false for plain architectural decisions", () => {
    const d: DecisionRecord = {
      id: 1,
      choice: "Use TypeScript",
    };
    assert.equal(isAssessmentDecision(d), false);
  });
});
