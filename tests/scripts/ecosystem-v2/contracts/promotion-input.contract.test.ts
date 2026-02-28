/**
 * Contract: reviews.jsonl -> Promotion Script
 *
 * Validates that ReviewRecord data can be consumed by the promotion script
 * for pattern recurrence detection. Tests graceful degradation with partial/stub data.
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

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
const schemas = require(path.resolve(PROJECT_ROOT, "scripts/reviews/dist/schemas/index.js")) as {
  ReviewRecord: { parse: (v: unknown) => Record<string, unknown> };
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const completenessLib = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/completeness.js")
) as {
  hasField: (record: { completeness_missing?: string[] }, field: string) => boolean;
};

const { ReviewRecord } = schemas;
const { hasField } = completenessLib;

function loadFixture(name: string): Record<string, unknown> {
  const filePath = path.join(PROJECT_ROOT, "test/fixtures/ecosystem-v2", name);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

describe("Contract: reviews.jsonl -> Promotion Script", () => {
  const fullReview = loadFixture("review-full.json");
  const partialReview = loadFixture("review-partial.json");
  const stubReview = loadFixture("review-stub.json");

  test("full records have patterns array accessible for recurrence detection", () => {
    const parsed = ReviewRecord.parse(fullReview);
    assert.ok(hasField(parsed as { completeness_missing?: string[] }, "patterns"));
    assert.ok(Array.isArray(parsed.patterns));
    assert.ok((parsed.patterns as string[]).length > 0);
  });

  test("partial records with patterns still accessible", () => {
    const parsed = ReviewRecord.parse(partialReview);
    // Partial review has patterns populated (not in completeness_missing)
    assert.ok(hasField(parsed as { completeness_missing?: string[] }, "patterns"));
    assert.ok(Array.isArray(parsed.patterns));
  });

  test("stub records: hasField('patterns') returns false when patterns in completeness_missing", () => {
    const parsed = ReviewRecord.parse(stubReview);
    assert.equal(hasField(parsed as { completeness_missing?: string[] }, "patterns"), false);
  });

  test("stub records don't crash promotion logic (graceful skip)", () => {
    const parsed = ReviewRecord.parse(stubReview);
    // Simulate promotion logic: check before accessing
    const canPromote =
      hasField(parsed as { completeness_missing?: string[] }, "patterns") &&
      Array.isArray(parsed.patterns);
    assert.equal(canPromote, false);
    // No throw - graceful skip
  });

  test("full records have learnings array for pattern context", () => {
    const parsed = ReviewRecord.parse(fullReview);
    assert.ok(hasField(parsed as { completeness_missing?: string[] }, "learnings"));
    assert.ok(Array.isArray(parsed.learnings));
  });

  test("all tiers parse without throwing", () => {
    // This is the core contract: no tier should cause parse to throw
    assert.doesNotThrow(() => ReviewRecord.parse(fullReview));
    assert.doesNotThrow(() => ReviewRecord.parse(partialReview));
    assert.doesNotThrow(() => ReviewRecord.parse(stubReview));
  });
});
