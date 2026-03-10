/**
 * Unit tests for check-phase-status.js
 *
 * Tests: getAuditFile naming, status parsing from audit content,
 * checkPhaseStatus result shape, and phase completion logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Phase definitions ────────────────────────────────────────────────────────

interface Phase {
  num: string;
  name: string;
  file?: string;
}

const PHASES: Phase[] = [
  { num: "1", name: "Consolidation" },
  { num: "2", name: "Procedure", file: "PROCEDURE.md" },
  { num: "9b", name: "Full Audit TDMS Integration" },
  { num: "17", name: "Final System Audit", file: "FINAL_SYSTEM_AUDIT.md" },
];

// ─── getAuditFile ─────────────────────────────────────────────────────────────

function getAuditFile(phase: Phase): string {
  if (phase.file) return phase.file;
  return `PHASE_${phase.num}_AUDIT.md`;
}

describe("getAuditFile", () => {
  it("returns custom file when phase.file is set", () => {
    const phase = PHASES.find((p) => p.num === "2")!;
    assert.equal(getAuditFile(phase), "PROCEDURE.md");
  });

  it("returns PHASE_N_AUDIT.md for phases without custom file", () => {
    assert.equal(getAuditFile({ num: "1", name: "Consolidation" }), "PHASE_1_AUDIT.md");
  });

  it("handles alphanumeric phase numbers like 9b", () => {
    assert.equal(getAuditFile({ num: "9b", name: "Test" }), "PHASE_9b_AUDIT.md");
  });

  it("does NOT uppercase phase number (9b stays as 9b)", () => {
    const result = getAuditFile({ num: "9b", name: "Test" });
    assert.ok(result.includes("9b"));
    assert.equal(result.includes("9B"), false);
  });

  it("returns FINAL_SYSTEM_AUDIT.md for phase 17", () => {
    const phase = PHASES.find((p) => p.num === "17")!;
    assert.equal(getAuditFile(phase), "FINAL_SYSTEM_AUDIT.md");
  });
});

// ─── parseAuditContent ───────────────────────────────────────────────────────

function parseAuditContent(content: string): { status: string; date: string | null } {
  const statusMatch = content.match(/\*\*Status:\*\*\s*(PASS|FAIL)/i);
  const dateMatch = content.match(/\*\*Audit Date:\*\*\s*(\d{4}-\d{2}-\d{2})/i);
  return {
    status: statusMatch ? statusMatch[1].toUpperCase() : "UNKNOWN",
    date: dateMatch ? dateMatch[1] : null,
  };
}

describe("parseAuditContent", () => {
  it("parses PASS status", () => {
    const content = "**Status:** PASS\n**Audit Date:** 2026-01-15";
    const result = parseAuditContent(content);
    assert.equal(result.status, "PASS");
    assert.equal(result.date, "2026-01-15");
  });

  it("parses FAIL status", () => {
    const content = "**Status:** FAIL";
    assert.equal(parseAuditContent(content).status, "FAIL");
  });

  it("returns UNKNOWN when status not found", () => {
    assert.equal(parseAuditContent("No status here").status, "UNKNOWN");
  });

  it("returns null date when date not found", () => {
    assert.equal(parseAuditContent("**Status:** PASS").date, null);
  });

  it("is case-insensitive for status", () => {
    assert.equal(parseAuditContent("**Status:** pass").status, "PASS");
  });
});

// ─── checkPhaseStatus result logic ───────────────────────────────────────────

interface PhaseCheckResult {
  complete: boolean;
  status: string;
  date?: string | null;
  file: string;
}

function buildPhaseResult(content: string | null, file: string): PhaseCheckResult {
  if (content === null) return { complete: false, status: "MISSING", file };
  const { status, date } = parseAuditContent(content);
  return {
    complete: status === "PASS",
    status,
    date,
    file,
  };
}

describe("buildPhaseResult", () => {
  it("returns complete=true for PASS status", () => {
    const result = buildPhaseResult("**Status:** PASS", "PHASE_1_AUDIT.md");
    assert.equal(result.complete, true);
  });

  it("returns complete=false for FAIL status", () => {
    const result = buildPhaseResult("**Status:** FAIL", "PHASE_2_AUDIT.md");
    assert.equal(result.complete, false);
  });

  it("returns complete=false for missing file", () => {
    const result = buildPhaseResult(null, "PHASE_3_AUDIT.md");
    assert.equal(result.complete, false);
    assert.equal(result.status, "MISSING");
  });

  it("returns complete=false for UNKNOWN status", () => {
    const result = buildPhaseResult("No status field", "PHASE_4_AUDIT.md");
    assert.equal(result.complete, false);
    assert.equal(result.status, "UNKNOWN");
  });

  it("includes file name in result", () => {
    const result = buildPhaseResult("**Status:** PASS", "PHASE_1_AUDIT.md");
    assert.equal(result.file, "PHASE_1_AUDIT.md");
  });
});
