/**
 * Contract: Review -> deferred-items.jsonl
 *
 * Validates that the auto-deferred creation output is a valid DeferredItemRecord.
 * Tests all 3 completeness tiers.
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
  DeferredItemRecord: {
    parse: (v: unknown) => Record<string, unknown>;
    safeParse: (v: unknown) => {
      success: boolean;
      data?: Record<string, unknown>;
      error?: { message: string };
    };
  };
};

const { DeferredItemRecord } = schemas;

function loadFixture(name: string): Record<string, unknown> {
  const filePath = path.join(PROJECT_ROOT, "test/fixtures/ecosystem-v2", name);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

describe("Contract: Review -> deferred-items.jsonl", () => {
  const fullDeferred = loadFixture("deferred-item-full.json");
  const partialDeferred = loadFixture("deferred-item-partial.json");
  const stubDeferred = loadFixture("deferred-item-stub.json");

  test("full deferred fixture passes DeferredItemRecord.parse()", () => {
    const result = DeferredItemRecord.parse(fullDeferred);
    assert.equal(result.completeness, "full");
    assert.deepEqual(result.completeness_missing, []);
  });

  test("partial deferred fixture passes DeferredItemRecord.parse()", () => {
    const result = DeferredItemRecord.parse(partialDeferred);
    assert.equal(result.completeness, "partial");
    assert.ok((result.completeness_missing as string[]).length > 0);
  });

  test("stub deferred fixture passes DeferredItemRecord.parse()", () => {
    const result = DeferredItemRecord.parse(stubDeferred);
    assert.equal(result.completeness, "stub");
    assert.ok((result.completeness_missing as string[]).length > 0);
  });

  test("deferred record has review_id linking back to source review", () => {
    for (const fixture of [fullDeferred, partialDeferred, stubDeferred]) {
      const parsed = DeferredItemRecord.parse(fixture);
      assert.ok(typeof parsed.review_id === "string");
      assert.ok((parsed.review_id as string).length > 0, "review_id must not be empty");
      assert.ok(
        (parsed.review_id as string).startsWith("rev-"),
        "review_id should reference a review record"
      );
    }
  });

  test("status defaults to 'open' when not explicitly set", () => {
    // Create a minimal record without explicit status
    const minimal = {
      id: "defer-test-001",
      date: "2025-06-01",
      schema_version: 1,
      completeness: "stub",
      completeness_missing: ["reason", "severity", "resolved_date"],
      origin: { type: "pr-review" as const },
      review_id: "rev-test-001",
      finding: "Test finding",
    };
    const parsed = DeferredItemRecord.parse(minimal);
    assert.equal(parsed.status, "open");
  });

  test("full deferred has finding field with content", () => {
    const parsed = DeferredItemRecord.parse(fullDeferred);
    assert.ok(typeof parsed.finding === "string");
    assert.ok((parsed.finding as string).length > 0);
  });
});
