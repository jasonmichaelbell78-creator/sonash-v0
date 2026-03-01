/**
 * Contract: PR Review Skill -> reviews.jsonl
 *
 * Validates that the output of the pr-review skill is a valid ReviewRecord
 * that can be written to reviews.jsonl. Tests all 3 completeness tiers.
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
const schemas = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/schemas/index.js")
) as {
  ReviewRecord: {
    parse: (v: unknown) => Record<string, unknown>;
    safeParse: (v: unknown) => {
      success: boolean;
      data?: Record<string, unknown>;
      error?: { message: string };
    };
  };
  Origin: { parse: (v: unknown) => Record<string, unknown> };
};

const { ReviewRecord } = schemas;

function loadFixture(name: string): Record<string, unknown> {
  const filePath = path.join(PROJECT_ROOT, "test/fixtures/ecosystem-v2", name);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

describe("Contract: PR Review Skill -> reviews.jsonl", () => {
  const fullReview = loadFixture("review-full.json");
  const partialReview = loadFixture("review-partial.json");
  const stubReview = loadFixture("review-stub.json");

  test("full review fixture passes ReviewRecord.parse()", () => {
    const result = ReviewRecord.parse(fullReview);
    assert.equal(result.completeness, "full");
    assert.deepEqual(result.completeness_missing, []);
  });

  test("partial review fixture passes ReviewRecord.parse()", () => {
    const result = ReviewRecord.parse(partialReview);
    assert.equal(result.completeness, "partial");
    assert.ok(Array.isArray(result.completeness_missing));
    assert.ok((result.completeness_missing as string[]).length > 0);
  });

  test("stub review fixture passes ReviewRecord.parse()", () => {
    const result = ReviewRecord.parse(stubReview);
    assert.equal(result.completeness, "stub");
    assert.ok(Array.isArray(result.completeness_missing));
    assert.ok((result.completeness_missing as string[]).length > 0);
  });

  test("full review round-trips through JSON.stringify/parse", () => {
    const parsed = ReviewRecord.parse(fullReview);
    const serialized = JSON.stringify(parsed);
    const deserialized = JSON.parse(serialized) as unknown;
    const reparsed = ReviewRecord.parse(deserialized);
    assert.equal(reparsed.id, parsed.id);
    assert.equal(reparsed.title, parsed.title);
    assert.deepEqual(reparsed.patterns, parsed.patterns);
  });

  test("origin.type is always a valid enum value", () => {
    const validTypes = new Set(["pr-review", "pr-retro", "backfill", "migration", "manual"]);
    for (const fixture of [fullReview, partialReview, stubReview]) {
      const parsed = ReviewRecord.parse(fixture);
      const origin = parsed.origin as { type: string };
      assert.ok(
        validTypes.has(origin.type),
        `origin.type "${origin.type}" is not a valid enum value`
      );
    }
  });

  test("all fixtures have required BaseRecord fields", () => {
    for (const fixture of [fullReview, partialReview, stubReview]) {
      const parsed = ReviewRecord.parse(fixture);
      assert.ok(typeof parsed.id === "string" && parsed.id.length > 0);
      assert.ok(typeof parsed.date === "string");
      assert.ok(typeof parsed.schema_version === "number");
      assert.ok(parsed.origin !== null && parsed.origin !== undefined);
    }
  });
});
