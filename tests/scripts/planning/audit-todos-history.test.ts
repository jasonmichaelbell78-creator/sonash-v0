/**
 * audit-todos-history.js Test Suite
 *
 * Tests pure helper exports from scripts/planning/audit-todos-history.js:
 *   parsePipeRow, idNumericKey, diffIds, buildRegression, buildSummary,
 *   formatLostList. Git-backed helpers (listCommitsTouchingFile,
 *   extractIdsAtCommit) rely on a real git repo and are exercised indirectly.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

interface AuditModule {
  parsePipeRow: (row: string) => { sha: string; ts: string; subject: string } | null;
  idNumericKey: (id: string) => number;
  diffIds: (before: Set<string>, after: Set<string>) => string[];
  buildRegression: (
    commit: { sha: string; ts: number; subject: string },
    prevCommit: { sha: string; subject: string } | null,
    prevIds: Set<string>,
    ids: Set<string>,
    lost: string[]
  ) => Record<string, unknown>;
  buildSummary: (
    commits: Array<unknown>,
    regressions: Array<{ lostCount: number }>,
    finalIds: Set<string> | null
  ) => {
    commitsScanned: number;
    regressionCount: number;
    totalLostIds: number;
    currentMaxId: number | null;
    currentTotal: number | null;
  };
  formatLostList: (lost: string[]) => string;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports -- SUT is CJS
const mod: AuditModule = require(
  path.resolve(PROJECT_ROOT, "scripts/planning/audit-todos-history.js")
);

// =========================================================
// parsePipeRow
// =========================================================

describe("audit.parsePipeRow", () => {
  it("splits sha|ts|subject correctly", () => {
    const parsed = mod.parsePipeRow("deadbeef|1700000000|chore: routine");
    assert.equal(parsed?.sha, "deadbeef");
    assert.equal(parsed?.ts, "1700000000");
    assert.equal(parsed?.subject, "chore: routine");
  });

  it("preserves pipes inside commit subject", () => {
    const parsed = mod.parsePipeRow(
      "deadbeef|1700000000|refactor: split x|y|z into separate handlers"
    );
    assert.equal(parsed?.subject, "refactor: split x|y|z into separate handlers");
  });

  it("returns null when row has no second delimiter", () => {
    assert.equal(mod.parsePipeRow("deadbeef|1700000000"), null);
  });

  it("returns null for empty string", () => {
    assert.equal(mod.parsePipeRow(""), null);
  });
});

// =========================================================
// idNumericKey
// =========================================================

describe("idNumericKey", () => {
  it("extracts numeric portion from T-prefix IDs", () => {
    assert.equal(mod.idNumericKey("T35"), 35);
    assert.equal(mod.idNumericKey("T100"), 100);
    assert.equal(mod.idNumericKey("T1"), 1);
  });

  it("returns MAX_SAFE_INTEGER for non-T prefix IDs (sorts last)", () => {
    assert.equal(mod.idNumericKey("abc"), Number.MAX_SAFE_INTEGER);
    assert.equal(mod.idNumericKey(""), Number.MAX_SAFE_INTEGER);
  });
});

// =========================================================
// diffIds
// =========================================================

describe("diffIds", () => {
  it("returns IDs present in before but missing in after", () => {
    const before = new Set(["T1", "T2", "T3"]);
    const after = new Set(["T1", "T3"]);
    assert.deepEqual(mod.diffIds(before, after), ["T2"]);
  });

  it("returns empty array when no IDs lost", () => {
    const before = new Set(["T1", "T2"]);
    const after = new Set(["T1", "T2", "T3"]);
    assert.deepEqual(mod.diffIds(before, after), []);
  });

  it("sorts lost IDs numerically by T-prefix number", () => {
    const before = new Set(["T10", "T2", "T30", "T1"]);
    const after = new Set<string>();
    assert.deepEqual(mod.diffIds(before, after), ["T1", "T2", "T10", "T30"]);
  });

  it("handles fully-empty after", () => {
    const before = new Set(["T5"]);
    const after = new Set<string>();
    assert.deepEqual(mod.diffIds(before, after), ["T5"]);
  });
});

// =========================================================
// formatLostList
// =========================================================

describe("formatLostList", () => {
  it("joins short lists with comma-space", () => {
    assert.equal(mod.formatLostList(["T1", "T2", "T3"]), "T1, T2, T3");
  });

  it("truncates lists >10 with ellipsis suffix", () => {
    const lost = Array.from({ length: 15 }, (_, i) => `T${i + 1}`);
    const formatted = mod.formatLostList(lost);
    assert.ok(formatted.endsWith(", ..."), formatted);
    assert.ok(formatted.startsWith("T1, T2, T3"), formatted);
  });

  it("returns empty string for empty list", () => {
    assert.equal(mod.formatLostList([]), "");
  });
});

// =========================================================
// buildRegression
// =========================================================

describe("buildRegression", () => {
  it("builds a regression record with all expected fields", () => {
    const commit = { sha: "abc12345xyz", ts: 1700000000000, subject: "dropped T1" };
    const prev = { sha: "prev12345xyz", subject: "had T1, T2" };
    const prevIds = new Set(["T1", "T2"]);
    const ids = new Set(["T2"]);
    const r = mod.buildRegression(commit, prev, prevIds, ids, ["T1"]);
    assert.equal(r.sha, "abc12345xyz");
    assert.equal(r.shortSha, "abc12345");
    assert.equal(r.subject, "dropped T1");
    assert.equal(r.lostCount, 1);
    assert.equal(r.prevTotal, 2);
    assert.equal(r.currentTotal, 1);
    assert.equal(r.prevShortSha, "prev1234");
    assert.ok(typeof r.iso === "string" && r.iso.endsWith("Z"));
  });
});

// =========================================================
// buildSummary
// =========================================================

describe("buildSummary", () => {
  it("aggregates commits and regressions", () => {
    const summary = mod.buildSummary(
      [{}, {}, {}],
      [{ lostCount: 2 }, { lostCount: 3 }],
      new Set(["T1", "T2", "T10"])
    );
    assert.equal(summary.commitsScanned, 3);
    assert.equal(summary.regressionCount, 2);
    assert.equal(summary.totalLostIds, 5);
    assert.equal(summary.currentMaxId, 10);
    assert.equal(summary.currentTotal, 3);
  });

  it("returns null currentMaxId/Total when finalIds is null", () => {
    const summary = mod.buildSummary([], [], null);
    assert.equal(summary.currentMaxId, null);
    assert.equal(summary.currentTotal, null);
  });
});
