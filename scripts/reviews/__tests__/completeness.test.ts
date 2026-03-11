/**
 * Unit tests for scripts/reviews/lib/completeness.ts
 *
 * Tests hasField() and validateCompleteness() in isolation — no file I/O.
 * These are pure functions so no temp directories are needed.
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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { hasField, validateCompleteness } = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/completeness.js")
) as {
  hasField: (record: { completeness_missing?: string[] }, field: string) => boolean;
  validateCompleteness: (
    record: { completeness: string; completeness_missing?: string[] },
    requiredForTier: Record<string, string[]>
  ) => string[];
};

// =========================================================
// 1. hasField
// =========================================================

describe("hasField", () => {
  test("returns true when completeness_missing is absent", () => {
    assert.equal(hasField({}, "pr"), true);
  });

  test("returns true when completeness_missing is an empty array", () => {
    assert.equal(hasField({ completeness_missing: [] }, "pr"), true);
  });

  test("returns true when field is not listed in completeness_missing", () => {
    assert.equal(hasField({ completeness_missing: ["patterns", "learnings"] }, "pr"), true);
  });

  test("returns false when field is in completeness_missing", () => {
    assert.equal(hasField({ completeness_missing: ["pr", "total"] }, "pr"), false);
  });

  test("returns false when field is the only missing entry", () => {
    assert.equal(hasField({ completeness_missing: ["title"] }, "title"), false);
  });

  test("is case-sensitive (field name must match exactly)", () => {
    assert.equal(hasField({ completeness_missing: ["PR"] }, "pr"), true);
    assert.equal(hasField({ completeness_missing: ["pr"] }, "PR"), true);
  });

  test("returns true even when field value would be null (null is a valid captured value)", () => {
    // The record has pr=null but completeness_missing does NOT list "pr"
    const record = { pr: null, completeness_missing: ["title"] };
    assert.equal(hasField(record, "pr"), true);
  });
});

// =========================================================
// 2. validateCompleteness
// =========================================================

describe("validateCompleteness", () => {
  const TIER_REQUIREMENTS: Record<string, string[]> = {
    full: ["pr", "total", "fixed", "patterns", "learnings"],
    partial: ["pr", "total"],
    stub: [],
  };

  test("returns no violations when completeness_missing is absent", () => {
    const record = { completeness: "full" };
    const violations = validateCompleteness(record, TIER_REQUIREMENTS);
    assert.deepEqual(violations, []);
  });

  test("returns no violations when no required fields are missing", () => {
    const record = { completeness: "partial", completeness_missing: ["learnings"] };
    const violations = validateCompleteness(record, TIER_REQUIREMENTS);
    assert.deepEqual(violations, []);
  });

  test("returns violations for each missing required field", () => {
    const record = { completeness: "full", completeness_missing: ["pr", "patterns"] };
    const violations = validateCompleteness(record, TIER_REQUIREMENTS);
    assert.equal(violations.length, 2);
    assert.ok(violations.some((v) => v.includes('"pr"')));
    assert.ok(violations.some((v) => v.includes('"patterns"')));
  });

  test("violation messages include field name and tier", () => {
    const record = { completeness: "partial", completeness_missing: ["total"] };
    const violations = validateCompleteness(record, TIER_REQUIREMENTS);
    assert.equal(violations.length, 1);
    assert.ok(violations[0].includes('"total"'));
    assert.ok(violations[0].includes('"partial"'));
  });

  test("returns empty array for stub tier (no required fields)", () => {
    const record = { completeness: "stub", completeness_missing: ["pr", "total", "everything"] };
    const violations = validateCompleteness(record, TIER_REQUIREMENTS);
    assert.deepEqual(violations, []);
  });

  test("returns empty array for unknown tier (not in requiredForTier)", () => {
    const record = { completeness: "unknown-tier", completeness_missing: ["pr"] };
    const violations = validateCompleteness(record, TIER_REQUIREMENTS);
    assert.deepEqual(violations, []);
  });

  test("reports all violations when all required fields are missing", () => {
    const record = {
      completeness: "full",
      completeness_missing: ["pr", "total", "fixed", "patterns", "learnings"],
    };
    const violations = validateCompleteness(record, TIER_REQUIREMENTS);
    assert.equal(violations.length, 5);
  });

  test("works with a single-field tier requirement", () => {
    const record = { completeness: "minimal", completeness_missing: ["id"] };
    const violations = validateCompleteness(record, { minimal: ["id"] });
    assert.equal(violations.length, 1);
    assert.ok(violations[0].includes('"id"'));
  });
});
