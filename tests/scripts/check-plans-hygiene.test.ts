/**
 * check-plans-hygiene.js Test Suite
 *
 * Tests pure helper exports from scripts/check-plans-hygiene.js:
 *   regex correctness, parseStepCounts, parsePipeRow, analyzePlan content
 *   parsing. Git-backed helpers (listPlanFiles, findDriftCandidates,
 *   planLastCommitMs) rely on a real git repo and are not exercised here.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it, before, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

interface HygieneModule {
  STATUS_MARKER_RE: RegExp;
  STATUS_BANNER_RE: RegExp;
  STEP_FRACTION_RE: RegExp;
  ALL_STEPS_RE: RegExp;
  STEP_HEADER_RE: RegExp;
  parseStepCounts: (line: string) => { done: number | null; total: number | null };
  parsePipeRow: (row: string) => { sha: string; ts: string; subject: string } | null;
  analyzePlan: (relPath: string) => {
    path: string;
    hasBanner: boolean;
    bannerDone: number | null;
    bannerTotal: number | null;
    totalStepHeaders: number;
    unmarkedStepHeaders: Array<{ line: number; header: string }>;
    error?: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-require-imports -- SUT is CJS
const mod: HygieneModule = require(path.resolve(PROJECT_ROOT, "scripts/check-plans-hygiene.js"));

const tmpDirs: string[] = [];

afterEach(() => {
  while (tmpDirs.length > 0) {
    const dir = tmpDirs.pop();
    if (!dir) continue;
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // Windows can EPERM on open handles; swallow so a cleanup failure
      // doesn't mask the actual test outcome.
    }
  }
});

function createTmpPlan(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "plans-hygiene-test-"));
  tmpDirs.push(dir);
  // analyzePlan's `resolve(ROOT, relPath)` passes absolute paths through
  // unchanged, so use the absolute path directly and avoid a
  // ../../../-style traversal string from the project root.
  const abs = path.join(dir, "PLAN.md");
  fs.writeFileSync(abs, content, "utf-8");
  return abs;
}

// =========================================================
// parseStepCounts
// =========================================================

describe("parseStepCounts", () => {
  it("parses `14/15 steps` fraction", () => {
    const { done, total } = mod.parseStepCounts("**Status:** 14/15 steps");
    assert.equal(done, 14);
    assert.equal(total, 15);
  });

  it("parses `14 of 15 steps` fraction (new format)", () => {
    const { done, total } = mod.parseStepCounts("> **Status:** COMPLETE — 14 of 15 steps done");
    assert.equal(done, 14);
    assert.equal(total, 15);
  });

  it("parses `all 15 steps` format", () => {
    const { done, total } = mod.parseStepCounts(
      "> **Status:** COMPLETE (all 15 steps, full coverage)"
    );
    assert.equal(done, 15);
    assert.equal(total, 15);
  });

  it("returns null counts when no step count present", () => {
    const { done, total } = mod.parseStepCounts("**Status:** COMPLETE");
    assert.equal(done, null);
    assert.equal(total, null);
  });
});

// =========================================================
// Regex correctness
// =========================================================

describe("STATUS_BANNER_RE", () => {
  it("matches plain `**Status:**` banner", () => {
    assert.ok(mod.STATUS_BANNER_RE.test("**Status:** active"));
  });

  it("matches blockquote-prefixed `> **Status:**` banner", () => {
    assert.ok(mod.STATUS_BANNER_RE.test("> **Status:** done"));
  });

  it("does not match text that merely mentions Status mid-line", () => {
    assert.ok(!mod.STATUS_BANNER_RE.test("The **Status:** is important"));
  });

  it("is anchored to line start (no ReDoS on long non-match lines)", () => {
    // If the banner regex backtracked, a repeated-pattern long line would
    // explode exponentially. Linear regex completes instantly.
    const longLine = "x".repeat(10_000);
    const t0 = Date.now();
    mod.STATUS_BANNER_RE.test(longLine);
    const elapsed = Date.now() - t0;
    assert.ok(elapsed < 100, `regex took ${elapsed}ms on 10k non-match`);
  });
});

describe("STEP_HEADER_RE", () => {
  it("matches depth-2 `## Step N:` headers", () => {
    assert.ok(mod.STEP_HEADER_RE.test("## Step 1: Setup"));
  });

  it("matches depth-3 `### Step N:` headers (new)", () => {
    assert.ok(mod.STEP_HEADER_RE.test("### Step 2: Implementation"));
  });

  it("matches `## Wave N:` headers", () => {
    assert.ok(mod.STEP_HEADER_RE.test("## Wave 3: Cleanup"));
  });

  it("matches `## Phase N:` headers", () => {
    assert.ok(mod.STEP_HEADER_RE.test("## Phase A: Discovery"));
  });

  it("does not match generic `## Some Section` headers", () => {
    assert.ok(!mod.STEP_HEADER_RE.test("## Overview"));
  });

  it("does not match depth-4 `#### Step N:` headers", () => {
    assert.ok(!mod.STEP_HEADER_RE.test("#### Step 1: too deep"));
  });
});

describe("STATUS_MARKER_RE", () => {
  it("matches status emojis", () => {
    for (const emoji of ["⏳", "🔄", "✅", "❌", "⏸"]) {
      assert.ok(mod.STATUS_MARKER_RE.test(`### Step 1: ${emoji} Setup`), emoji);
    }
  });
});

// =========================================================
// parsePipeRow
// =========================================================

describe("parsePipeRow", () => {
  it("splits sha|ts|subject correctly", () => {
    const parsed = mod.parsePipeRow("abc123|1700000000|fix: thing");
    assert.equal(parsed?.sha, "abc123");
    assert.equal(parsed?.ts, "1700000000");
    assert.equal(parsed?.subject, "fix: thing");
  });

  it("preserves pipes in subject (robust parsing)", () => {
    const parsed = mod.parsePipeRow("abc123|1700000000|feat: add a|b|c handler");
    assert.equal(parsed?.subject, "feat: add a|b|c handler");
  });

  it("returns null when only one delimiter", () => {
    assert.equal(mod.parsePipeRow("abc123|nothing-else"), null);
  });

  it("returns null for empty row", () => {
    assert.equal(mod.parsePipeRow(""), null);
  });
});

// =========================================================
// analyzePlan
// =========================================================

describe("analyzePlan", () => {
  it("detects banner + step count + marked step headers", () => {
    const rel = createTmpPlan(
      [
        "# Plan",
        "",
        "**Status:** 🔄 3/5 steps done",
        "",
        "## Step 1: ✅ First",
        "## Step 2: ✅ Second",
        "## Step 3: 🔄 Third",
        "## Step 4: ⏳ Fourth",
        "## Step 5: ⏳ Fifth",
      ].join("\n")
    );
    const r = mod.analyzePlan(rel);
    assert.equal(r.error, undefined);
    assert.equal(r.hasBanner, true);
    assert.equal(r.bannerDone, 3);
    assert.equal(r.bannerTotal, 5);
    assert.equal(r.totalStepHeaders, 5);
    assert.equal(r.unmarkedStepHeaders.length, 0);
  });

  it("detects banner from blockquote + `X of Y` format", () => {
    const rel = createTmpPlan(
      ["# Plan", "", "> **Status:** COMPLETE — 14 of 15 steps done.", ""].join("\n")
    );
    const r = mod.analyzePlan(rel);
    assert.equal(r.hasBanner, true);
    assert.equal(r.bannerDone, 14);
    assert.equal(r.bannerTotal, 15);
  });

  it("detects banner from blockquote + `all N steps` format", () => {
    const rel = createTmpPlan(
      ["# Plan", "", "> **Status:** ✅ COMPLETE (all 15 steps, shipped)", ""].join("\n")
    );
    const r = mod.analyzePlan(rel);
    assert.equal(r.hasBanner, true);
    assert.equal(r.bannerDone, 15);
    assert.equal(r.bannerTotal, 15);
  });

  it("reports hasBanner=true when banner present without counts", () => {
    const rel = createTmpPlan(
      ["# Plan", "", "**Status:** in progress, no counts here", ""].join("\n")
    );
    const r = mod.analyzePlan(rel);
    assert.equal(r.hasBanner, true);
    assert.equal(r.bannerDone, null);
    assert.equal(r.bannerTotal, null);
  });

  it("flags step headers without status markers", () => {
    const rel = createTmpPlan(
      ["**Status:** 1/2 steps", "## Step 1: ✅ Marked", "## Step 2: Unmarked"].join("\n")
    );
    const r = mod.analyzePlan(rel);
    assert.equal(r.totalStepHeaders, 2);
    assert.equal(r.unmarkedStepHeaders.length, 1);
    assert.equal(r.unmarkedStepHeaders[0].line, 3);
  });

  it("counts depth-3 `### Step N:` headers (previously missed)", () => {
    const rel = createTmpPlan(
      [
        "**Status:** 0/2 steps",
        "## Track A",
        "### Step 1: ✅ sub-step",
        "### Step 2: Unmarked sub-step",
      ].join("\n")
    );
    const r = mod.analyzePlan(rel);
    assert.equal(r.totalStepHeaders, 2);
    assert.equal(r.unmarkedStepHeaders.length, 1);
  });

  it("returns error for missing file", () => {
    const r = mod.analyzePlan("does/not/exist/PLAN.md");
    assert.ok(r.error?.startsWith("read failed"));
  });
});
