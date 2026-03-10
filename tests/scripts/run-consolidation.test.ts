import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/run-consolidation.js

describe("run-consolidation: sanitizeError", () => {
  function sanitizeError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    return msg
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]")
      .replace(/\/Users\/[^/\s]+/gi, "[HOME]");
  }

  it("masks Windows user paths", () => {
    const result = sanitizeError(new Error("C:\\Users\\alice\\project"));
    assert.ok(result.includes("[USER_PATH]"));
    assert.ok(!result.includes("alice"));
  });

  it("masks Unix home paths", () => {
    const result = sanitizeError(new Error("/home/alice/project"));
    assert.ok(result.includes("[HOME]"));
  });

  it("returns message unchanged when safe", () => {
    assert.strictEqual(sanitizeError(new Error("ENOENT: no such file")), "ENOENT: no such file");
  });

  it("handles non-Error types", () => {
    assert.strictEqual(sanitizeError("raw string"), "raw string");
  });
});

describe("run-consolidation: argument parsing", () => {
  function parseArgs(argv: string[]): {
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

  it("--auto implies applyChanges and quiet", () => {
    const result = parseArgs(["--auto"]);
    assert.strictEqual(result.autoMode, true);
    assert.strictEqual(result.applyChanges, true);
    assert.strictEqual(result.quiet, true);
  });

  it("--apply sets applyChanges without autoMode", () => {
    const result = parseArgs(["--apply"]);
    assert.strictEqual(result.applyChanges, true);
    assert.strictEqual(result.autoMode, false);
    assert.strictEqual(result.quiet, false);
  });

  it("--verbose is independent", () => {
    const result = parseArgs(["--verbose"]);
    assert.strictEqual(result.verbose, true);
    assert.strictEqual(result.applyChanges, false);
  });

  it("default dry-run mode", () => {
    const result = parseArgs([]);
    assert.strictEqual(result.applyChanges, false);
    assert.strictEqual(result.verbose, false);
    assert.strictEqual(result.quiet, false);
  });
});

describe("run-consolidation: pattern grouping", () => {
  interface ReviewEntry {
    id: number;
    patterns: string[];
  }

  function groupPatterns(reviews: ReviewEntry[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const review of reviews) {
      for (const pattern of review.patterns) {
        counts.set(pattern, (counts.get(pattern) ?? 0) + 1);
      }
    }
    return counts;
  }

  it("counts pattern occurrences across reviews", () => {
    const reviews: ReviewEntry[] = [
      { id: 1, patterns: ["error-handling", "path-traversal"] },
      { id: 2, patterns: ["error-handling"] },
      { id: 3, patterns: ["error-handling", "path-traversal", "symlink-guard"] },
    ];
    const counts = groupPatterns(reviews);
    assert.strictEqual(counts.get("error-handling"), 3);
    assert.strictEqual(counts.get("path-traversal"), 2);
    assert.strictEqual(counts.get("symlink-guard"), 1);
  });

  it("returns empty map for no reviews", () => {
    assert.strictEqual(groupPatterns([]).size, 0);
  });

  it("handles reviews with no patterns", () => {
    const reviews: ReviewEntry[] = [{ id: 1, patterns: [] }];
    assert.strictEqual(groupPatterns(reviews).size, 0);
  });
});

describe("run-consolidation: threshold check", () => {
  const THRESHOLD = 10;
  const MIN_PATTERN_OCCURRENCES = 3;

  function needsConsolidation(lastConsolidated: number, currentMax: number): boolean {
    return currentMax - lastConsolidated >= THRESHOLD;
  }

  function isPromotable(occurrences: number): boolean {
    return occurrences >= MIN_PATTERN_OCCURRENCES;
  }

  it("triggers at threshold (10 new reviews)", () => {
    assert.strictEqual(needsConsolidation(100, 110), true);
  });

  it("does not trigger below threshold", () => {
    assert.strictEqual(needsConsolidation(100, 109), false);
  });

  it("pattern with 3+ occurrences is promotable", () => {
    assert.strictEqual(isPromotable(3), true);
  });

  it("pattern with fewer than 3 occurrences is not promotable", () => {
    assert.strictEqual(isPromotable(2), false);
  });
});

describe("run-consolidation: default state", () => {
  function createDefaultState(): {
    lastConsolidatedReview: number;
    consolidationNumber: number;
    lastDate: null;
    threshold: number;
  } {
    return {
      lastConsolidatedReview: 0,
      consolidationNumber: 0,
      lastDate: null,
      threshold: 10,
    };
  }

  it("creates valid default state structure", () => {
    const state = createDefaultState();
    assert.strictEqual(state.lastConsolidatedReview, 0);
    assert.strictEqual(state.consolidationNumber, 0);
    assert.strictEqual(state.lastDate, null);
    assert.strictEqual(state.threshold, 10);
  });
});
