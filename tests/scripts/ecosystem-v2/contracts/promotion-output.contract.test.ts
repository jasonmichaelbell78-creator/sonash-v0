/**
 * Contract: Promotion Script -> CODE_PATTERNS
 *
 * Validates that promotion output has the correct shape for enforcement
 * consumption. Uses an inline PromotionResult schema since the formal
 * schema will be defined in a later phase.
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}
const PROJECT_ROOT = findProjectRoot(__dirname);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const schemas = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/schemas/index.js")
) as {
  ReviewRecord: { parse: (v: unknown) => Record<string, unknown> };
};

const { ReviewRecord } = schemas;

/**
 * Inline PromotionResult shape -- will be formalized in Phase 3.
 * Represents a pattern that has recurred enough to be promoted to a rule.
 */
const PromotionResult = z.object({
  pattern_name: z.string().min(1),
  recurrence_count: z.number().int().min(2),
  source_reviews: z.array(z.string().min(1)),
  rule_type: z.enum(["semgrep", "eslint", "regex"]),
  confidence: z.number().min(0).max(1).optional(),
  last_seen: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

function loadFixture(name: string): Record<string, unknown> {
  const filePath = path.join(PROJECT_ROOT, "test/fixtures/ecosystem-v2", name);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

describe("Contract: Promotion Script -> CODE_PATTERNS", () => {
  test("a valid PromotionResult can be constructed from review fixture data", () => {
    const review = ReviewRecord.parse(loadFixture("review-full.json"));
    const patterns = review.patterns as string[];

    const promotionResult = {
      pattern_name: patterns[0],
      recurrence_count: 3,
      source_reviews: [review.id as string],
      rule_type: "eslint" as const,
      confidence: 0.85,
      last_seen: review.date as string,
    };

    const parsed = PromotionResult.parse(promotionResult);
    assert.equal(parsed.pattern_name, "error-sanitization");
    assert.equal(parsed.recurrence_count, 3);
    assert.ok(parsed.source_reviews.includes(review.id as string));
  });

  test("PromotionResult with missing optional fields is still valid", () => {
    const minimal = {
      pattern_name: "missing-try-catch",
      recurrence_count: 2,
      source_reviews: ["rev-001", "rev-002"],
      rule_type: "regex" as const,
    };

    const parsed = PromotionResult.parse(minimal);
    assert.equal(parsed.pattern_name, "missing-try-catch");
    assert.equal(parsed.confidence, undefined);
    assert.equal(parsed.last_seen, undefined);
  });

  test("PromotionResult rejects recurrence_count below 2", () => {
    const invalid = {
      pattern_name: "test",
      recurrence_count: 1,
      source_reviews: ["rev-001"],
      rule_type: "eslint" as const,
    };

    assert.throws(() => PromotionResult.parse(invalid));
  });

  test("PromotionResult rejects invalid rule_type", () => {
    const invalid = {
      pattern_name: "test",
      recurrence_count: 2,
      source_reviews: ["rev-001"],
      rule_type: "custom-script",
    };

    assert.throws(() => PromotionResult.parse(invalid));
  });

  test("multiple reviews can contribute to a single promotion", () => {
    const review1 = ReviewRecord.parse(loadFixture("review-full.json"));
    const review2 = ReviewRecord.parse(loadFixture("review-partial.json"));

    const promotionResult = PromotionResult.parse({
      pattern_name: "error-sanitization",
      recurrence_count: 2,
      source_reviews: [review1.id as string, review2.id as string],
      rule_type: "semgrep" as const,
    });

    assert.equal(promotionResult.source_reviews.length, 2);
  });
});
