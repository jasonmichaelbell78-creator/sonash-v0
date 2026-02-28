/**
 * Tests for the promotion pipeline: promote-patterns.ts
 *
 * Uses inline test data, not production files.
 * Covers: detectRecurrence, filterAlreadyPromoted, categorizePattern,
 *         generateRuleSkeleton, and full pipeline integration.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

// Walk up from __dirname until we find package.json (works from both source and dist)
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);

// Import compiled module
// eslint-disable-next-line @typescript-eslint/no-require-imports
const promoteModule = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/promote-patterns.js")
) as {
  detectRecurrence: (
    reviews: Array<{
      id: string;
      pr?: number | null;
      patterns?: string[] | null;
      [key: string]: unknown;
    }>,
    minOccurrences?: number,
    minDistinctPRs?: number
  ) => Array<{
    pattern: string;
    count: number;
    distinctPRs: Set<number>;
    reviewIds: string[];
  }>;
  filterAlreadyPromoted: (
    patterns: Array<{
      pattern: string;
      count: number;
      distinctPRs: Set<number>;
      reviewIds: string[];
    }>,
    codePatternsContent: string
  ) => {
    newPatterns: Array<{
      pattern: string;
      count: number;
      distinctPRs: Set<number>;
      reviewIds: string[];
    }>;
    alreadyPromoted: string[];
  };
  categorizePattern: (pattern: string) => string;
  generateRuleSkeleton: (result: {
    pattern: string;
    count: number;
    distinctPRs: Set<number>;
    reviewIds: string[];
  }) => {
    id: string;
    pattern: string;
    message: string;
    fix: string;
    fileTypes: string[];
    severity: string;
  };
};

// Helper to create mock review records matching ReviewRecord shape
function mockReview(
  id: string,
  pr: number | null,
  patterns: string[],
  overrides: Record<string, unknown> = {}
) {
  return {
    id,
    date: "2026-01-15",
    schema_version: 1,
    completeness: "partial" as const,
    completeness_missing: [],
    origin: { type: "pr-review" as const, pr: pr ?? undefined },
    title: `Review ${id}`,
    pr,
    source: "test",
    total: 10,
    fixed: null,
    deferred: null,
    rejected: null,
    patterns,
    learnings: null,
    severity_breakdown: null,
    per_round_detail: null,
    rejection_analysis: null,
    ping_pong_chains: null,
    ...overrides,
  };
}

describe("detectRecurrence", () => {
  test("returns patterns meeting both thresholds", () => {
    const reviews = [
      mockReview("rev-1", 100, ["path-traversal", "error-handling"]),
      mockReview("rev-2", 101, ["path-traversal", "xss"]),
      mockReview("rev-3", 102, ["path-traversal", "error-handling"]),
      mockReview("rev-4", 103, ["error-handling"]),
    ];

    const results = promoteModule.detectRecurrence(reviews, 3, 2);

    assert.equal(results.length, 2);
    // Both have count=3, sorted alphabetically: error-handling before path-traversal
    assert.equal(results[0].pattern, "error-handling");
    assert.equal(results[0].count, 3);
    assert.equal(results[0].distinctPRs.size, 3);
    assert.equal(results[1].pattern, "path-traversal");
    assert.equal(results[1].count, 3);
  });

  test("ignores patterns below threshold", () => {
    const reviews = [
      mockReview("rev-1", 100, ["path-traversal"]),
      mockReview("rev-2", 101, ["xss"]),
    ];

    const results = promoteModule.detectRecurrence(reviews, 3, 2);
    assert.equal(results.length, 0);
  });

  test("counts distinct PRs correctly (same pattern in multiple reviews for same PR = 1 PR)", () => {
    const reviews = [
      mockReview("rev-1", 100, ["path-traversal"]),
      mockReview("rev-2", 100, ["path-traversal"]), // same PR as rev-1
      mockReview("rev-3", 101, ["path-traversal"]),
      mockReview("rev-4", 102, ["path-traversal"]),
    ];

    const results = promoteModule.detectRecurrence(reviews, 3, 2);
    assert.equal(results.length, 1);
    assert.equal(results[0].pattern, "path-traversal");
    assert.equal(results[0].count, 4);
    assert.equal(results[0].distinctPRs.size, 3); // PRs 100, 101, 102
  });

  test("handles reviews with null/empty patterns", () => {
    const reviews = [
      mockReview("rev-1", 100, ["path-traversal"]),
      mockReview("rev-2", 101, []),
      mockReview("rev-3", 102, ["path-traversal"]),
      { ...mockReview("rev-4", 103, []), patterns: null },
      mockReview("rev-5", 104, ["path-traversal"]),
    ];

    const results = promoteModule.detectRecurrence(reviews, 3, 2);
    assert.equal(results.length, 1);
    assert.equal(results[0].pattern, "path-traversal");
    assert.equal(results[0].count, 3);
  });

  test("normalizes pattern strings to lowercase", () => {
    const reviews = [
      mockReview("rev-1", 100, ["Path-Traversal"]),
      mockReview("rev-2", 101, ["path-traversal"]),
      mockReview("rev-3", 102, ["PATH-TRAVERSAL"]),
    ];

    const results = promoteModule.detectRecurrence(reviews, 3, 2);
    assert.equal(results.length, 1);
    assert.equal(results[0].pattern, "path-traversal");
    assert.equal(results[0].count, 3);
  });

  test("requires minimum distinct PRs (excludes null PRs from count)", () => {
    const reviews = [
      mockReview("rev-1", null, ["path-traversal"]),
      mockReview("rev-2", null, ["path-traversal"]),
      mockReview("rev-3", 100, ["path-traversal"]),
    ];

    // 3 occurrences but only 1 distinct PR -- fails minDistinctPRs=2
    const results = promoteModule.detectRecurrence(reviews, 3, 2);
    assert.equal(results.length, 0);
  });

  test("sorts results by count descending", () => {
    const reviews = [
      mockReview("rev-1", 100, ["xss", "path-traversal"]),
      mockReview("rev-2", 101, ["xss", "path-traversal"]),
      mockReview("rev-3", 102, ["xss", "path-traversal"]),
      mockReview("rev-4", 103, ["xss"]),
      mockReview("rev-5", 104, ["xss"]),
    ];

    const results = promoteModule.detectRecurrence(reviews, 3, 2);
    assert.equal(results.length, 2);
    assert.equal(results[0].pattern, "xss");
    assert.equal(results[0].count, 5);
    assert.equal(results[1].pattern, "path-traversal");
    assert.equal(results[1].count, 3);
  });
});

describe("filterAlreadyPromoted", () => {
  test("filters out patterns already in CODE_PATTERNS.md", () => {
    const patterns = [
      {
        pattern: "path traversal",
        count: 5,
        distinctPRs: new Set([100, 101]),
        reviewIds: ["rev-1", "rev-2"],
      },
      {
        pattern: "new-pattern",
        count: 3,
        distinctPRs: new Set([100, 101]),
        reviewIds: ["rev-1", "rev-2"],
      },
    ];

    const codePatternsContent = `
## Security
### Path Traversal
Some content about path traversal...
`;

    const result = promoteModule.filterAlreadyPromoted(patterns, codePatternsContent);

    assert.equal(result.newPatterns.length, 1);
    assert.equal(result.newPatterns[0].pattern, "new-pattern");
    assert.equal(result.alreadyPromoted.length, 1);
    assert.equal(result.alreadyPromoted[0], "path traversal");
  });

  test("handles empty CODE_PATTERNS content (all patterns are new)", () => {
    const patterns = [
      {
        pattern: "new-pattern",
        count: 3,
        distinctPRs: new Set([100, 101]),
        reviewIds: ["rev-1"],
      },
    ];

    const result = promoteModule.filterAlreadyPromoted(patterns, "");
    assert.equal(result.newPatterns.length, 1);
    assert.equal(result.alreadyPromoted.length, 0);
  });
});

describe("categorizePattern", () => {
  test("maps security-related patterns to Security", () => {
    assert.equal(promoteModule.categorizePattern("path-traversal"), "Security");
    assert.equal(promoteModule.categorizePattern("xss injection"), "Security");
    assert.equal(promoteModule.categorizePattern("prototype pollution"), "Security");
    assert.equal(promoteModule.categorizePattern("symlink guard"), "Security");
  });

  test("maps error-handling to JavaScript/TypeScript", () => {
    assert.equal(promoteModule.categorizePattern("error-handling"), "JavaScript/TypeScript");
    assert.equal(promoteModule.categorizePattern("try-catch missing"), "JavaScript/TypeScript");
  });

  test("maps shell/bash to Bash/Shell", () => {
    assert.equal(promoteModule.categorizePattern("bash script"), "Bash/Shell");
    assert.equal(promoteModule.categorizePattern("cross-platform"), "Bash/Shell");
  });

  test("maps CI-related to CI/Automation", () => {
    assert.equal(promoteModule.categorizePattern("github-actions workflow"), "CI/Automation");
    assert.equal(promoteModule.categorizePattern("pre-commit hook"), "CI/Automation");
  });

  test("maps documentation to Documentation", () => {
    assert.equal(promoteModule.categorizePattern("markdown link broken"), "Documentation");
  });

  test("maps unknown patterns to General", () => {
    assert.equal(promoteModule.categorizePattern("some-random-pattern"), "General");
  });
});

describe("generateRuleSkeleton", () => {
  test("produces valid rule object with all required fields", () => {
    const result = {
      pattern: "path-traversal",
      count: 5,
      distinctPRs: new Set([100, 101, 102]),
      reviewIds: ["rev-1", "rev-2", "rev-3"],
    };

    const skeleton = promoteModule.generateRuleSkeleton(result);

    assert.equal(skeleton.id, "path-traversal");
    assert.equal(skeleton.pattern, "TODO_REGEX");
    assert.equal(skeleton.message, "path-traversal");
    assert.ok(skeleton.fix.includes("5x recurrence"));
    assert.ok(skeleton.fix.includes("3 PRs"));
    assert.deepEqual(skeleton.fileTypes, [".js", ".ts"]);
    assert.equal(skeleton.severity, "error"); // 5 >= 5 threshold
  });

  test("sets severity to warning for count < 5", () => {
    const result = {
      pattern: "minor-issue",
      count: 3,
      distinctPRs: new Set([100, 101]),
      reviewIds: ["rev-1", "rev-2", "rev-3"],
    };

    const skeleton = promoteModule.generateRuleSkeleton(result);
    assert.equal(skeleton.severity, "warning");
  });

  test("generates slug-based id from pattern name", () => {
    const result = {
      pattern: "Error Handling: Missing Try/Catch",
      count: 4,
      distinctPRs: new Set([100, 101]),
      reviewIds: ["rev-1"],
    };

    const skeleton = promoteModule.generateRuleSkeleton(result);
    assert.equal(skeleton.id, "error-handling-missing-try-catch");
  });

  test("truncates long pattern ids to 40 chars", () => {
    const result = {
      pattern: "this-is-a-very-long-pattern-name-that-exceeds-the-forty-character-limit-for-ids",
      count: 3,
      distinctPRs: new Set([100, 101]),
      reviewIds: ["rev-1"],
    };

    const skeleton = promoteModule.generateRuleSkeleton(result);
    assert.ok(skeleton.id.length <= 40);
  });
});

describe("Integration: full pipeline with mock reviews", () => {
  test("detects recurring patterns and generates correct promotions", () => {
    // Create reviews with overlapping patterns across multiple PRs
    const reviews = [
      mockReview("rev-1", 100, ["path-traversal", "error-handling", "xss"]),
      mockReview("rev-2", 101, ["path-traversal", "error-handling"]),
      mockReview("rev-3", 102, ["path-traversal", "error-handling", "xss"]),
      mockReview("rev-4", 103, ["xss"]),
      mockReview("rev-5", 104, ["one-off-pattern"]),
    ];

    // Step 1: Detect recurrence
    const recurring = promoteModule.detectRecurrence(reviews, 3, 2);

    // Should find path-traversal (3x, 3 PRs), error-handling (3x, 3 PRs), xss (3x, 3 PRs)
    assert.equal(recurring.length, 3);
    const patternNames = recurring.map((r: { pattern: string }) => r.pattern);
    assert.ok(patternNames.includes("path-traversal"));
    assert.ok(patternNames.includes("error-handling"));
    assert.ok(patternNames.includes("xss"));

    // one-off-pattern should NOT be included (only 1 occurrence)
    assert.ok(!patternNames.includes("one-off-pattern"));

    // Step 2: Filter already promoted (simulating path-traversal already in CODE_PATTERNS)
    const codePatternsContent = `
## Security
### Path Traversal
This pattern is already documented.
`;
    const filtered = promoteModule.filterAlreadyPromoted(recurring, codePatternsContent);

    assert.equal(filtered.newPatterns.length, 2);
    assert.equal(filtered.alreadyPromoted.length, 1);
    assert.equal(filtered.alreadyPromoted[0], "path-traversal");

    // Step 3: Categorize the new patterns
    for (const p of filtered.newPatterns) {
      const category = promoteModule.categorizePattern(p.pattern);
      if (p.pattern === "error-handling") {
        assert.equal(category, "JavaScript/TypeScript");
      } else if (p.pattern === "xss") {
        assert.equal(category, "Security");
      }
    }

    // Step 4: Generate rule skeletons
    const skeletons = filtered.newPatterns.map(promoteModule.generateRuleSkeleton);
    assert.equal(skeletons.length, 2);
    for (const s of skeletons) {
      assert.ok(s.id);
      assert.equal(s.pattern, "TODO_REGEX");
      assert.ok(s.message);
      assert.ok(s.fix);
      assert.ok(Array.isArray(s.fileTypes));
      assert.ok(s.severity);
    }
  });
});
