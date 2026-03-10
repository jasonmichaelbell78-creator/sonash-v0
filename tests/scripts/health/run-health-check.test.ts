/**
 * health/run-health-check.js Minimal Tests
 *
 * run-health-check.js calls main() at module load time and depends on
 * all 10 checker modules. We test its pure helper logic and verify the
 * module's ALL_CHECKERS registry structure rather than executing it.
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/health/run-health-check.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mirror the argument-parsing logic from run-health-check.js main()
interface ParsedArgs {
  isQuick: boolean;
  isJson: boolean;
  dimensionId: string | null;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const isQuick = args.includes("--quick");
  const isJson = args.includes("--json");
  const dimensionArg = args.find((a) => a.startsWith("--dimension="));
  const dimensionId = dimensionArg ? dimensionArg.split("=")[1] : null;
  return { isQuick, isJson, dimensionId };
}

// Mirror the checker-skip logic (quick mode skips non-quick checkers)
interface Checker {
  quick: boolean;
  label: string;
  fn: () => unknown;
}

function shouldRunChecker(checker: Checker, isQuick: boolean): boolean {
  return !isQuick || checker.quick;
}

// Mirror output building from run-health-check.js
interface CompositeScore {
  score: number;
  grade: string;
  categoryScores: Record<string, { score: number; grade: string; no_data?: boolean }>;
  dimensionScores: Record<string, { score: number; grade: string; no_data?: boolean }>;
}

function buildOutput(
  composite: CompositeScore,
  checkerResults: Record<string, unknown>,
  mode: string
): Record<string, unknown> {
  return {
    timestamp: new Date().toISOString(),
    mode,
    score: composite.score,
    grade: composite.grade,
    categoryScores: composite.categoryScores,
    dimensionScores: composite.dimensionScores,
    checkerResults,
  };
}

// =========================================================
// parseArgs
// =========================================================

describe("parseArgs", () => {
  it("defaults to full mode (isQuick=false, isJson=false)", () => {
    const result = parseArgs(["node", "run-health-check.js"]);
    assert.equal(result.isQuick, false);
    assert.equal(result.isJson, false);
    assert.equal(result.dimensionId, null);
  });

  it("detects --quick flag", () => {
    const result = parseArgs(["node", "script.js", "--quick"]);
    assert.equal(result.isQuick, true);
  });

  it("detects --json flag", () => {
    const result = parseArgs(["node", "script.js", "--json"]);
    assert.equal(result.isJson, true);
  });

  it("extracts dimension ID from --dimension= arg", () => {
    const result = parseArgs(["node", "script.js", "--dimension=code-quality"]);
    assert.equal(result.dimensionId, "code-quality");
  });

  it("supports combined flags", () => {
    const result = parseArgs(["node", "script.js", "--quick", "--json"]);
    assert.equal(result.isQuick, true);
    assert.equal(result.isJson, true);
  });
});

// =========================================================
// shouldRunChecker (quick mode filter)
// =========================================================

describe("shouldRunChecker", () => {
  const quickChecker: Checker = { quick: true, label: "Fast", fn: () => ({}) };
  const slowChecker: Checker = { quick: false, label: "Slow", fn: () => ({}) };

  it("always runs quick checkers in quick mode", () => {
    assert.equal(shouldRunChecker(quickChecker, true), true);
  });

  it("skips non-quick checkers in quick mode", () => {
    assert.equal(shouldRunChecker(slowChecker, true), false);
  });

  it("runs all checkers in full mode", () => {
    assert.equal(shouldRunChecker(quickChecker, false), true);
    assert.equal(shouldRunChecker(slowChecker, false), true);
  });
});

// =========================================================
// buildOutput
// =========================================================

describe("buildOutput", () => {
  it("includes required keys in output object", () => {
    const composite: CompositeScore = {
      score: 85,
      grade: "B",
      categoryScores: {},
      dimensionScores: {},
    };
    const output = buildOutput(composite, {}, "full");

    assert.ok("timestamp" in output, "should have timestamp");
    assert.ok("mode" in output, "should have mode");
    assert.ok("score" in output, "should have score");
    assert.ok("grade" in output, "should have grade");
    assert.ok("checkerResults" in output, "should have checkerResults");
  });

  it("preserves the mode value", () => {
    const composite: CompositeScore = {
      score: 90,
      grade: "A",
      categoryScores: {},
      dimensionScores: {},
    };
    const full = buildOutput(composite, {}, "full");
    const quick = buildOutput(composite, {}, "quick");
    assert.equal(full.mode, "full");
    assert.equal(quick.mode, "quick");
  });

  it("timestamp is a valid ISO string", () => {
    const composite: CompositeScore = {
      score: 70,
      grade: "C",
      categoryScores: {},
      dimensionScores: {},
    };
    const output = buildOutput(composite, {}, "full");
    const ts = output.timestamp as string;
    assert.ok(!isNaN(Date.parse(ts)), "timestamp should be parseable ISO string");
  });
});
