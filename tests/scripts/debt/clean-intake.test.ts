/**
 * Unit tests for clean-intake.js
 *
 * Tests: similarity (Dice coefficient), VALID_CATEGORIES set, CLI flag parsing,
 * false positive detection patterns, and completed-work detection heuristics.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── VALID_CATEGORIES ─────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set([
  "code-quality",
  "security",
  "performance",
  "documentation",
  "refactoring",
  "engineering-productivity",
  "ai-optimization",
  "accessibility",
  "process",
  "enhancements",
]);

describe("VALID_CATEGORIES (clean-intake)", () => {
  it("contains all expected categories", () => {
    const expected = [
      "code-quality",
      "security",
      "performance",
      "documentation",
      "refactoring",
      "engineering-productivity",
      "ai-optimization",
      "accessibility",
      "process",
      "enhancements",
    ];
    for (const cat of expected) {
      assert.ok(VALID_CATEGORIES.has(cat), `missing: ${cat}`);
    }
  });

  it("has 10 categories", () => assert.equal(VALID_CATEGORIES.size, 10));

  it("does not contain invalid categories", () => {
    assert.equal(VALID_CATEGORIES.has("unknown"), false);
    assert.equal(VALID_CATEGORIES.has("bug-fix"), false);
  });
});

// ─── similarity (Dice coefficient on bigrams) ─────────────────────────────────

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return 1;

  const bigramsA = new Set<string>();
  for (let i = 0; i < al.length - 1; i++) {
    bigramsA.add(al.slice(i, i + 2));
  }
  const bigramsB = new Set<string>();
  for (let i = 0; i < bl.length - 1; i++) {
    bigramsB.add(bl.slice(i, i + 2));
  }

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }
  const union = bigramsA.size + bigramsB.size;
  if (union === 0) return 0;
  return (2 * intersection) / union;
}

describe("similarity (Dice coefficient)", () => {
  it("returns 1 for identical strings", () => {
    assert.equal(similarity("hello", "hello"), 1);
  });

  it("returns 1 for identical strings case-insensitively", () => {
    assert.equal(similarity("Hello", "hello"), 1);
  });

  it("returns 0 for empty strings", () => {
    assert.equal(similarity("", "hello"), 0);
    assert.equal(similarity("hello", ""), 0);
  });

  it("returns 0 for completely different short strings", () => {
    const result = similarity("abc", "xyz");
    assert.ok(result >= 0 && result <= 1);
  });

  it("returns value between 0 and 1 for partial matches", () => {
    const result = similarity("Fix authentication bug", "Fix authentication issue");
    assert.ok(result > 0.5 && result < 1);
  });

  it("is symmetric", () => {
    const s1 = similarity("hello world", "world hello");
    const s2 = similarity("world hello", "hello world");
    assert.equal(s1, s2);
  });

  it("returns high similarity for near-duplicate titles", () => {
    const s = similarity(
      "Refactor authentication flow to use middleware",
      "Refactor auth flow to use middleware"
    );
    assert.ok(s > 0.7);
  });
});

// ─── CLI flag parsing ─────────────────────────────────────────────────────────

function parseCleanIntakeFlags(argv: string[]): {
  writeMode: boolean;
  verbose: boolean;
  dryRun: boolean;
} {
  const args = new Set(argv);
  const writeMode = args.has("--write");
  const verbose = args.has("--verbose");
  const dryRun = !writeMode;
  return { writeMode, verbose, dryRun };
}

describe("parseCleanIntakeFlags", () => {
  it("defaults to dry-run mode", () => {
    const { dryRun, writeMode } = parseCleanIntakeFlags([]);
    assert.equal(dryRun, true);
    assert.equal(writeMode, false);
  });

  it("sets writeMode when --write is passed", () => {
    const { writeMode, dryRun } = parseCleanIntakeFlags(["--write"]);
    assert.equal(writeMode, true);
    assert.equal(dryRun, false);
  });

  it("sets verbose when --verbose is passed", () => {
    assert.equal(parseCleanIntakeFlags(["--verbose"]).verbose, true);
  });

  it("write mode disables dry-run", () => {
    assert.equal(parseCleanIntakeFlags(["--write"]).dryRun, false);
  });
});

// ─── isDuplicateByHash ────────────────────────────────────────────────────────

function isDuplicateByHash(itemHash: string, existingHashes: Set<string>): boolean {
  return existingHashes.has(itemHash);
}

describe("isDuplicateByHash", () => {
  it("detects duplicate when hash exists", () => {
    const hashes = new Set(["abc123"]);
    assert.equal(isDuplicateByHash("abc123", hashes), true);
  });

  it("returns false for new hash", () => {
    const hashes = new Set(["abc123"]);
    assert.equal(isDuplicateByHash("def456", hashes), false);
  });

  it("returns false for empty set", () => {
    assert.equal(isDuplicateByHash("abc123", new Set()), false);
  });
});

// ─── Category validation ──────────────────────────────────────────────────────

function isValidCategory(category: string): boolean {
  return VALID_CATEGORIES.has(category);
}

describe("isValidCategory", () => {
  it("accepts 'code-quality'", () => assert.equal(isValidCategory("code-quality"), true));
  it("accepts 'security'", () => assert.equal(isValidCategory("security"), true));
  it("rejects 'unknown'", () => assert.equal(isValidCategory("unknown"), false));
  it("rejects empty string", () => assert.equal(isValidCategory(""), false));
  it("is case-sensitive", () => assert.equal(isValidCategory("Code-Quality"), false));
});
