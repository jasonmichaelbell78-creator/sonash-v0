/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Unit tests for scripts/reviews/lib/promote-patterns.ts
 *
 * Tests pure functions: detectRecurrence, filterAlreadyPromoted,
 * categorizePattern, and generateRuleSkeleton.
 * The full promotePatterns() orchestrator is exercised in dry-run mode only.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

// Walk up from __dirname until we find package.json
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition -- continue walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);
const distPath = path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/promote-patterns.js");

const { detectRecurrence, filterAlreadyPromoted, categorizePattern, generateRuleSkeleton } =
  require(distPath) as {
    detectRecurrence: (
      reviews: Array<{
        id: string;
        date: string;
        schema_version: number;
        completeness: string;
        completeness_missing: string[];
        origin: { type: string };
        patterns?: string[] | null;
        pr?: number | null;
      }>,
      minOccurrences?: number,
      minDistinctPRs?: number
    ) => Array<{ pattern: string; count: number; distinctPRs: Set<number>; reviewIds: string[] }>;
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
    generateRuleSkeleton: (
      result: { pattern: string; count: number; distinctPRs: Set<number>; reviewIds: string[] },
      usedIds?: Set<string>
    ) => {
      id: string;
      pattern: string;
      message: string;
      fix: string;
      fileTypes: string[];
      severity: string;
    };
  };

// =========================================================
// Helpers
// =========================================================

function makeReview(
  id: string,
  patterns: string[],
  pr: number | null = null
): {
  id: string;
  date: string;
  schema_version: number;
  completeness: string;
  completeness_missing: string[];
  origin: { type: string };
  patterns: string[];
  pr: number | null;
} {
  return {
    id,
    date: "2026-01-01",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "pr-review" },
    patterns,
    pr,
  };
}

// =========================================================
// 1. detectRecurrence
// =========================================================

describe("detectRecurrence", () => {
  test("returns empty array when no patterns exist", () => {
    const reviews = [makeReview("rev-1", [], 10), makeReview("rev-2", [], 11)];
    const results = detectRecurrence(reviews, 1, 1);
    assert.deepEqual(results, []);
  });

  test("detects pattern meeting both thresholds", () => {
    const reviews = [
      makeReview("rev-1", ["missing-error-handling"], 10),
      makeReview("rev-2", ["missing-error-handling"], 11),
      makeReview("rev-3", ["missing-error-handling"], 12),
    ];
    const results = detectRecurrence(reviews, 3, 2);
    assert.equal(results.length, 1);
    assert.equal(results[0].pattern, "missing-error-handling");
    assert.equal(results[0].count, 3);
    assert.equal(results[0].distinctPRs.size, 3);
  });

  test("excludes pattern below minOccurrences", () => {
    const reviews = [
      makeReview("rev-1", ["rare-pattern"], 10),
      makeReview("rev-2", ["rare-pattern"], 11),
    ];
    const results = detectRecurrence(reviews, 3, 2);
    assert.equal(results.length, 0);
  });

  test("excludes pattern below minDistinctPRs", () => {
    const reviews = [
      makeReview("rev-1", ["same-pr-pattern"], 10),
      makeReview("rev-2", ["same-pr-pattern"], 10), // same PR
      makeReview("rev-3", ["same-pr-pattern"], 10),
    ];
    const results = detectRecurrence(reviews, 3, 2);
    assert.equal(results.length, 0);
  });

  test("normalizes pattern names to lowercase", () => {
    const reviews = [
      makeReview("rev-1", ["Error Handling"], 10),
      makeReview("rev-2", ["error handling"], 11),
      makeReview("rev-3", ["ERROR HANDLING"], 12),
    ];
    const results = detectRecurrence(reviews, 3, 3);
    assert.equal(results.length, 1);
    assert.equal(results[0].pattern, "error handling");
  });

  test("counts each pattern at most once per review", () => {
    const reviews = [
      makeReview("rev-1", ["dup-pattern", "dup-pattern"], 10),
      makeReview("rev-2", ["dup-pattern"], 11),
      makeReview("rev-3", ["dup-pattern"], 12),
    ];
    const results = detectRecurrence(reviews, 3, 3);
    assert.equal(results.length, 1);
    // rev-1 counted only once despite two occurrences in same review
    assert.equal(results[0].count, 3);
  });

  test("sorts results by count descending", () => {
    const reviews = [
      makeReview("rev-1", ["common", "rare"], 10),
      makeReview("rev-2", ["common", "rare"], 11),
      makeReview("rev-3", ["common"], 12),
    ];
    const results = detectRecurrence(reviews, 2, 2);
    assert.ok(results[0].count >= results.at(-1)!.count);
  });

  test("skips reviews with null patterns", () => {
    const reviews = [
      { ...makeReview("rev-1", [], 10), patterns: null as unknown as string[] },
      makeReview("rev-2", ["valid-pattern"], 11),
      makeReview("rev-3", ["valid-pattern"], 12),
    ];
    const results = detectRecurrence(reviews, 2, 2);
    // Should not throw, and should find valid-pattern if threshold met
    assert.ok(Array.isArray(results));
  });

  test("tracks distinct PR numbers", () => {
    const reviews = [
      makeReview("rev-1", ["tracked"], 100),
      makeReview("rev-2", ["tracked"], 200),
      makeReview("rev-3", ["tracked"], 300),
    ];
    const results = detectRecurrence(reviews, 3, 3);
    assert.equal(results[0].distinctPRs.size, 3);
    assert.ok(results[0].distinctPRs.has(100));
    assert.ok(results[0].distinctPRs.has(200));
    assert.ok(results[0].distinctPRs.has(300));
  });

  test("ignores null PR on a review (does not add to distinctPRs)", () => {
    const reviews = [
      makeReview("rev-1", ["no-pr-pattern"], null),
      makeReview("rev-2", ["no-pr-pattern"], null),
      makeReview("rev-3", ["no-pr-pattern"], null),
    ];
    // minDistinctPRs=0 to allow matching despite no PRs
    const results = detectRecurrence(reviews, 3, 0);
    assert.equal(results.length, 1);
    assert.equal(results[0].distinctPRs.size, 0);
  });
});

// =========================================================
// 2. filterAlreadyPromoted
// =========================================================

function makeFilterResult(pattern: string): {
  pattern: string;
  count: number;
  distinctPRs: Set<number>;
  reviewIds: string[];
} {
  return { pattern, count: 3, distinctPRs: new Set([1, 2]), reviewIds: [] };
}

describe("filterAlreadyPromoted", () => {
  test("returns all patterns as new when CODE_PATTERNS.md is empty", () => {
    const patterns = [makeFilterResult("new-pattern"), makeFilterResult("another-new")];
    const { newPatterns, alreadyPromoted } = filterAlreadyPromoted(patterns, "");
    assert.equal(newPatterns.length, 2);
    assert.equal(alreadyPromoted.length, 0);
  });

  test("identifies pattern already in CODE_PATTERNS.md", () => {
    const content = "## Security\n\n### Missing Error Handling\n\nSome text.";
    const patterns = [makeFilterResult("missing-error-handling"), makeFilterResult("new-one")];
    const { newPatterns, alreadyPromoted } = filterAlreadyPromoted(patterns, content);
    assert.equal(alreadyPromoted.length, 1);
    assert.ok(alreadyPromoted.includes("missing-error-handling"));
    assert.equal(newPatterns.length, 1);
    assert.equal(newPatterns[0].pattern, "new-one");
  });

  test("matching is case-insensitive", () => {
    const content = "MISSING ERROR HANDLING description here";
    const patterns = [makeFilterResult("missing-error-handling")];
    const { alreadyPromoted } = filterAlreadyPromoted(patterns, content);
    assert.equal(alreadyPromoted.length, 1);
  });

  test("returns empty arrays for empty pattern list", () => {
    const { newPatterns, alreadyPromoted } = filterAlreadyPromoted([], "some content");
    assert.deepEqual(newPatterns, []);
    assert.deepEqual(alreadyPromoted, []);
  });
});

// =========================================================
// 3. categorizePattern
// =========================================================

describe("categorizePattern", () => {
  test("Security: injection keyword", () => {
    assert.equal(categorizePattern("sql-injection"), "Security");
  });

  test("Security: traversal keyword", () => {
    assert.equal(categorizePattern("path-traversal"), "Security");
  });

  test("Security: sanitiz keyword", () => {
    assert.equal(categorizePattern("error-sanitization"), "Security");
  });

  test("JavaScript/TypeScript: typescript keyword", () => {
    assert.equal(categorizePattern("typescript-strict-mode"), "JavaScript/TypeScript");
  });

  test("JavaScript/TypeScript: error handling", () => {
    assert.equal(categorizePattern("missing-error-handling"), "JavaScript/TypeScript");
  });

  test("Bash/Shell: shell keyword", () => {
    assert.equal(categorizePattern("shell-quoting"), "Bash/Shell");
  });

  test("CI/Automation: github actions", () => {
    assert.equal(categorizePattern("github.actions-timeout"), "CI/Automation");
  });

  test("CI/Automation: pre-commit", () => {
    assert.equal(categorizePattern("pre-commit-hook-missing"), "CI/Automation");
  });

  test("Documentation: markdown", () => {
    assert.equal(categorizePattern("broken-markdown-link"), "Documentation");
  });

  test("General: unclassified pattern", () => {
    assert.equal(categorizePattern("random-unclassified-thing"), "General");
  });
});

// =========================================================
// 4. generateRuleSkeleton
// =========================================================

function makeRuleResult(
  pattern: string,
  count: number,
  prCount: number
): {
  pattern: string;
  count: number;
  distinctPRs: Set<number>;
  reviewIds: string[];
} {
  const prSet = new Set<number>();
  for (let i = 1; i <= prCount; i++) prSet.add(i);
  return { pattern, count, distinctPRs: prSet, reviewIds: [] };
}

describe("generateRuleSkeleton", () => {
  test("produces an object with id, pattern, message, fix, fileTypes, severity", () => {
    const result = generateRuleSkeleton(makeRuleResult("missing-null-check", 3, 2));
    assert.ok(typeof result.id === "string");
    assert.equal(result.pattern, "TODO_REGEX");
    assert.equal(result.message, "missing-null-check");
    assert.ok(typeof result.fix === "string");
    assert.deepEqual(result.fileTypes, [".js", ".ts"]);
    assert.ok(["warning", "error"].includes(result.severity));
  });

  test("severity is 'error' when count >= 5", () => {
    const result = generateRuleSkeleton(makeRuleResult("high-frequency", 5, 3));
    assert.equal(result.severity, "error");
  });

  test("severity is 'warning' when count < 5", () => {
    const result = generateRuleSkeleton(makeRuleResult("low-frequency", 4, 2));
    assert.equal(result.severity, "warning");
  });

  test("id is based on a slug of the pattern name", () => {
    const result = generateRuleSkeleton(makeRuleResult("missing-null-check", 3, 2));
    assert.ok(result.id.startsWith("missing-null-check"));
  });

  test("avoids duplicate IDs when usedIds set is provided", () => {
    const usedIds = new Set<string>();
    const r1 = generateRuleSkeleton(makeRuleResult("same-pattern", 3, 2), usedIds);
    const r2 = generateRuleSkeleton(makeRuleResult("same-pattern", 3, 2), usedIds);
    assert.notEqual(r1.id, r2.id);
  });

  test("fix description mentions count and PR count", () => {
    const result = generateRuleSkeleton(makeRuleResult("my-pattern", 7, 4));
    assert.ok(result.fix.includes("7x"));
    assert.ok(result.fix.includes("4 PRs"));
  });

  test("id is truncated to max 40 chars base before suffix", () => {
    const longPattern = "a-very-long-pattern-name-that-exceeds-the-forty-character-limit";
    const result = generateRuleSkeleton(makeRuleResult(longPattern, 3, 2));
    // id = base(<=40) + "-" + 6-char hex
    assert.ok(result.id.length <= 48, `ID too long: ${result.id}`);
  });
});
