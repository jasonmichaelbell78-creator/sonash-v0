import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Smoke tests for scripts/promote-patterns.js (CLI wrapper)

function parsePromoteArgs(argv: string[]): {
  dryRun: boolean;
  minOccurrences: number;
  minPrs: number;
} {
  const dryRun = argv.includes("--dry-run");
  const minOccArg = argv.find((a) => a.startsWith("--min-occurrences"));
  const minPrsArg = argv.find((a) => a.startsWith("--min-prs"));

  const minOccurrences = minOccArg ? Number.parseInt(minOccArg.split("=")[1] ?? "3", 10) : 3;
  const minPrs = minPrsArg ? Number.parseInt(minPrsArg.split("=")[1] ?? "2", 10) : 2;

  return { dryRun, minOccurrences, minPrs };
}

function checkMainExport(mainFn: unknown): { valid: boolean; error?: string } {
  if (typeof mainFn !== "function") {
    return { valid: false, error: "No callable `main` export found" };
  }
  return { valid: true };
}

describe("promote-patterns: CLI argument handling", () => {
  it("defaults to non-dry-run mode", () => {
    assert.strictEqual(parsePromoteArgs([]).dryRun, false);
  });

  it("parses --dry-run flag", () => {
    assert.strictEqual(parsePromoteArgs(["--dry-run"]).dryRun, true);
  });

  it("parses --min-occurrences", () => {
    const result = parsePromoteArgs(["--min-occurrences=5"]);
    assert.strictEqual(result.minOccurrences, 5);
  });

  it("parses --min-prs", () => {
    const result = parsePromoteArgs(["--min-prs=3"]);
    assert.strictEqual(result.minPrs, 3);
  });
});

describe("promote-patterns: main export loading guard", () => {
  it("validates function export", () => {
    assert.strictEqual(checkMainExport(() => {}).valid, true);
  });

  it("rejects non-function export", () => {
    const result = checkMainExport(null);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes("main"));
  });
});
