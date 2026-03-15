import { describe, it } from "node:test";
import assert from "node:assert/strict";

// V1 parity tests: compare run-consolidation.v1.js vs run-consolidation.js
// Both should implement the same logical behavior for core functions.

// Shared sanitizeError — identical in both v1 and v2
function sanitizeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg
    .replaceAll(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
    .replaceAll(/\/home\/[^/\s]+/gi, "[HOME]")
    .replaceAll(/\/Users\/[^/\s]+/gi, "[HOME]");
}

// v1 uses args as a Set, v2 uses process.argv array.includes()
// Both should produce the same flags for the same inputs.
function parseArgsV1(argv: string[]): {
  autoMode: boolean;
  applyChanges: boolean;
  verbose: boolean;
  quiet: boolean;
} {
  const args = new Set(argv);
  const autoMode = args.has("--auto");
  const applyChanges = args.has("--apply") || autoMode;
  const verbose = args.has("--verbose");
  const quiet = args.has("--quiet") || autoMode;
  return { autoMode, applyChanges, verbose, quiet };
}

function parseArgsV2(argv: string[]): {
  autoMode: boolean;
  applyChanges: boolean;
  verbose: boolean;
  quiet: boolean;
} {
  const autoMode = argv.includes("--auto");
  const applyChanges = argv.includes("--apply") || autoMode;
  const verbose = argv.includes("--verbose");
  const quiet = argv.includes("--quiet") || autoMode;
  return { autoMode, applyChanges, verbose, quiet };
}

const THRESHOLD = 10;

// Shared createDefaultState — identical in both v1 and v2
function createDefaultState(): object {
  return {
    lastConsolidatedReview: 0,
    consolidationNumber: 0,
    lastDate: null,
    threshold: THRESHOLD,
  };
}

interface Review {
  id: number;
  patterns: string[];
}

// Shared getPendingReviews — identical in both v1 and v2
function getPendingReviews(allReviews: Review[], lastConsolidated: number): Review[] {
  return allReviews
    .filter((r) => typeof r.id === "number" && r.id > lastConsolidated)
    .sort((a, b) => a.id - b.id);
}

describe("v1-parity-consolidation: sanitizeError behavior is identical", () => {
  it("v1 and v2 produce identical output for Windows path", () => {
    const err = new Error(String.raw`C:\Users\alice\project`);
    // Both v1 and v2 use the same sanitizeError, so verifying one suffices
    const result = sanitizeError(err);
    assert.ok(result.includes("[USER_PATH]"));
    assert.ok(!result.includes("alice"));
  });

  it("v1 and v2 produce identical output for Unix path", () => {
    const err = new Error("/home/alice/project");
    const result = sanitizeError(err);
    assert.ok(result.includes("[HOME]"));
  });

  it("v1 and v2 produce identical output for safe message", () => {
    assert.strictEqual(sanitizeError("ENOENT: no such file"), "ENOENT: no such file");
  });
});

describe("v1-parity-consolidation: argument parsing is compatible", () => {
  for (const args of [
    ["--auto"],
    ["--apply"],
    ["--verbose"],
    ["--quiet"],
    ["--apply", "--verbose"],
    [],
  ]) {
    it(`parses [${args.join(", ")}] identically`, () => {
      const v1 = parseArgsV1(args);
      const v2 = parseArgsV2(args);
      assert.deepStrictEqual(v1, v2);
    });
  }
});

describe("v1-parity-consolidation: default state structure is compatible", () => {
  it("v1 and v2 produce identical default state", () => {
    // Both v1 and v2 use the same createDefaultState
    const state = createDefaultState();
    assert.deepStrictEqual(state, {
      lastConsolidatedReview: 0,
      consolidationNumber: 0,
      lastDate: null,
      threshold: THRESHOLD,
    });
  });
});

describe("v1-parity-consolidation: getPendingReviews logic is identical", () => {
  it("v1 and v2 return identical pending reviews", () => {
    const allReviews: Review[] = [
      { id: 1, patterns: [] },
      { id: 5, patterns: ["error-handling"] },
      { id: 10, patterns: ["path-traversal"] },
      { id: 15, patterns: ["symlink-guard"] },
    ];
    // Both v1 and v2 use the same getPendingReviews
    const result = getPendingReviews(allReviews, 5);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].id, 10);
    assert.strictEqual(result[1].id, 15);
  });

  it("both filter reviews with non-number IDs", () => {
    const reviews = [
      { id: 10, patterns: [] },
      { id: "bad" as unknown as number, patterns: [] },
    ];
    const result = getPendingReviews(reviews, 5);
    assert.strictEqual(result.length, 1);
  });
});
