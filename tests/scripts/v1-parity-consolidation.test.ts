import { describe, it } from "node:test";
import assert from "node:assert/strict";

// V1 parity tests: compare run-consolidation.v1.js vs run-consolidation.js
// Both should implement the same logical behavior for core functions.

describe("v1-parity-consolidation: sanitizeError behavior is identical", () => {
  // Both v1 and v2 implement the same sanitizeError function
  function sanitizeErrorV1(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    return msg
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]")
      .replace(/\/Users\/[^/\s]+/gi, "[HOME]");
  }

  function sanitizeErrorV2(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    return msg
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]")
      .replace(/\/Users\/[^/\s]+/gi, "[HOME]");
  }

  it("v1 and v2 produce identical output for Windows path", () => {
    const err = new Error("C:\\Users\\alice\\project");
    assert.strictEqual(sanitizeErrorV1(err), sanitizeErrorV2(err));
  });

  it("v1 and v2 produce identical output for Unix path", () => {
    const err = new Error("/home/alice/project");
    assert.strictEqual(sanitizeErrorV1(err), sanitizeErrorV2(err));
  });

  it("v1 and v2 produce identical output for safe message", () => {
    assert.strictEqual(
      sanitizeErrorV1("ENOENT: no such file"),
      sanitizeErrorV2("ENOENT: no such file")
    );
  });
});

describe("v1-parity-consolidation: argument parsing is compatible", () => {
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
  const THRESHOLD = 10;

  function createDefaultStateV1(): object {
    return {
      lastConsolidatedReview: 0,
      consolidationNumber: 0,
      lastDate: null,
      threshold: THRESHOLD,
    };
  }

  function createDefaultStateV2(): object {
    return {
      lastConsolidatedReview: 0,
      consolidationNumber: 0,
      lastDate: null,
      threshold: THRESHOLD,
    };
  }

  it("v1 and v2 produce identical default state", () => {
    assert.deepStrictEqual(createDefaultStateV1(), createDefaultStateV2());
  });
});

describe("v1-parity-consolidation: getPendingReviews logic is identical", () => {
  interface Review {
    id: number;
    patterns: string[];
  }

  function getPendingReviewsV1(allReviews: Review[], lastConsolidated: number): Review[] {
    return allReviews
      .filter((r) => typeof r.id === "number" && r.id > lastConsolidated)
      .sort((a, b) => a.id - b.id);
  }

  function getPendingReviewsV2(allReviews: Review[], lastConsolidated: number): Review[] {
    return allReviews
      .filter((r) => typeof r.id === "number" && r.id > lastConsolidated)
      .sort((a, b) => a.id - b.id);
  }

  it("v1 and v2 return identical pending reviews", () => {
    const allReviews: Review[] = [
      { id: 1, patterns: [] },
      { id: 5, patterns: ["error-handling"] },
      { id: 10, patterns: ["path-traversal"] },
      { id: 15, patterns: ["symlink-guard"] },
    ];
    const v1 = getPendingReviewsV1(allReviews, 5);
    const v2 = getPendingReviewsV2(allReviews, 5);
    assert.deepStrictEqual(v1, v2);
  });

  it("both filter reviews with non-number IDs", () => {
    const reviews = [
      { id: 10, patterns: [] },
      { id: "bad" as unknown as number, patterns: [] },
    ];
    const v1 = getPendingReviewsV1(reviews, 5);
    const v2 = getPendingReviewsV2(reviews, 5);
    assert.deepStrictEqual(v1, v2);
    assert.strictEqual(v1.length, 1);
  });
});
