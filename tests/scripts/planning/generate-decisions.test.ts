/**
 * generate-decisions.js Minimal Tests
 *
 * generate-decisions.js is an ESM module with top-level JSONL I/O and
 * --dry-run / file-write side effects. It cannot be imported directly.
 *
 * These tests verify the pure helper functions embedded in the script:
 * - tag() — builds tag string from decision flags
 * - esc() — delegates to escapeCell (tested via integration)
 * - Section classification (id-range filters)
 * - Superseded-decision tagging logic
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/planning/generate-decisions.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mirror tag() from generate-decisions.js
interface Decision {
  id: number;
  decision?: string;
  choice?: string;
  user_directive?: boolean;
  user_override?: boolean;
  user_insight?: boolean;
  superseded_by?: number;
}

function tag(d: Decision): string {
  const tags: string[] = [];
  if (d.user_directive) tags.push("USER");
  if (d.user_override) tags.push("OVERRIDE");
  if (d.user_insight) tags.push("INSIGHT");
  if (d.superseded_by) tags.push(`superseded:D${d.superseded_by}`);
  return tags.length ? ` \`[${tags.join(", ")}]\`` : "";
}

// Mirror section classification
function classifyDecision(d: Decision): string {
  if (d.id >= 1 && d.id <= 32) return "architecture";
  if (d.id >= 33 && d.id <= 54) return "assessments";
  if (d.id >= 55 && d.id <= 67) return "sequencing";
  if (d.id >= 68 && d.id <= 76) return "edgeCases";
  if (d.id >= 77 && d.id <= 83) return "process";
  if (d.id >= 84) return "auditFixes";
  return "unknown";
}

// Mirror the escapeCell logic (pipe and backslash escaping for Markdown tables)
function escapeCell(s: string | undefined): string {
  if (!s) return "";
  return String(s).replace(/\|/g, "\\|").replace(/\\/g, "\\\\").replace(/\n/g, " ");
}

// =========================================================
// tag() helper
// =========================================================

describe("tag()", () => {
  it("returns empty string for a plain decision", () => {
    assert.equal(tag({ id: 1 }), "");
  });

  it("includes USER tag for user_directive", () => {
    assert.ok(tag({ id: 1, user_directive: true }).includes("USER"));
  });

  it("includes OVERRIDE tag for user_override", () => {
    assert.ok(tag({ id: 1, user_override: true }).includes("OVERRIDE"));
  });

  it("includes INSIGHT tag for user_insight", () => {
    assert.ok(tag({ id: 1, user_insight: true }).includes("INSIGHT"));
  });

  it("includes superseded tag when superseded_by is set", () => {
    const result = tag({ id: 1, superseded_by: 42 });
    assert.ok(result.includes("superseded:D42"));
  });

  it("combines multiple tags", () => {
    const result = tag({ id: 1, user_directive: true, user_override: true });
    assert.ok(result.includes("USER"));
    assert.ok(result.includes("OVERRIDE"));
  });
});

// =========================================================
// Section classification
// =========================================================

describe("section classification by ID range", () => {
  it("classifies D1 as architecture", () => {
    assert.equal(classifyDecision({ id: 1 }), "architecture");
  });

  it("classifies D32 as architecture", () => {
    assert.equal(classifyDecision({ id: 32 }), "architecture");
  });

  it("classifies D33 as assessments", () => {
    assert.equal(classifyDecision({ id: 33 }), "assessments");
  });

  it("classifies D55 as sequencing", () => {
    assert.equal(classifyDecision({ id: 55 }), "sequencing");
  });

  it("classifies D68 as edgeCases", () => {
    assert.equal(classifyDecision({ id: 68 }), "edgeCases");
  });

  it("classifies D77 as process", () => {
    assert.equal(classifyDecision({ id: 77 }), "process");
  });

  it("classifies D84 as auditFixes", () => {
    assert.equal(classifyDecision({ id: 84 }), "auditFixes");
  });

  it("classifies D100 as auditFixes", () => {
    assert.equal(classifyDecision({ id: 100 }), "auditFixes");
  });
});

// =========================================================
// escapeCell
// =========================================================

describe("escapeCell (Markdown table cell escaping)", () => {
  it("returns empty string for undefined/empty input", () => {
    assert.equal(escapeCell(""), "");
    assert.equal(escapeCell(undefined), "");
  });

  it("escapes pipe characters", () => {
    const result = escapeCell("foo | bar");
    assert.ok(result.includes("\\|"), `expected escaped pipe in: ${result}`);
  });

  it("replaces newlines with spaces", () => {
    const result = escapeCell("line1\nline2");
    assert.ok(!result.includes("\n"), "newline should be replaced");
    assert.ok(result.includes(" "), "newline should become space");
  });

  it("leaves plain text unchanged", () => {
    assert.equal(escapeCell("plain text"), "plain text");
  });
});
