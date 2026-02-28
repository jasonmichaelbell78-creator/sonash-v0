/**
 * Tests for completeness.ts -- hasField() and validateCompleteness().
 *
 * Verifies the distinction between null values (valid data) and
 * completeness_missing entries (data never captured).
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

// Walk up from __dirname until we find package.json (works from both source and dist-tests)
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
const { hasField, validateCompleteness } = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/completeness.js")
) as {
  hasField: (record: { completeness_missing?: string[] }, field: string) => boolean;
  validateCompleteness: (
    record: { completeness: string; completeness_missing?: string[] },
    requiredForTier: Record<string, string[]>
  ) => string[];
};

describe("hasField", () => {
  test("returns true when field NOT in completeness_missing", () => {
    const record = { completeness_missing: ["other_field"] };
    assert.equal(hasField(record, "title"), true);
  });

  test("returns true when completeness_missing is undefined", () => {
    const record = {};
    assert.equal(hasField(record, "title"), true);
  });

  test("returns true when completeness_missing is empty array", () => {
    const record = { completeness_missing: [] as string[] };
    assert.equal(hasField(record, "title"), true);
  });

  test("returns false when field IS in completeness_missing", () => {
    const record = { completeness_missing: ["title", "patterns"] };
    assert.equal(hasField(record, "title"), false);
  });

  test("returns true for field with null value that is NOT in completeness_missing", () => {
    // null is valid data -- "we checked and found nothing"
    // Only completeness_missing controls hasField result
    const record = {
      title: null,
      completeness_missing: ["patterns"],
    };
    assert.equal(hasField(record, "title"), true);
  });

  test("returns false for field with null value that IS in completeness_missing", () => {
    const record = {
      title: null,
      completeness_missing: ["title"],
    };
    assert.equal(hasField(record, "title"), false);
  });
});

describe("validateCompleteness", () => {
  test("returns empty array for valid full-tier record", () => {
    const record = {
      completeness: "full",
      completeness_missing: [],
    };
    const requiredForTier = {
      full: ["title", "patterns", "severity_breakdown"],
      partial: ["title"],
      stub: [],
    };
    const violations = validateCompleteness(record, requiredForTier);
    assert.equal(violations.length, 0);
  });

  test("returns violations for full-tier record with missing required fields", () => {
    const record = {
      completeness: "full",
      completeness_missing: ["patterns", "severity_breakdown"],
    };
    const requiredForTier = {
      full: ["title", "patterns", "severity_breakdown"],
      partial: ["title"],
      stub: [],
    };
    const violations = validateCompleteness(record, requiredForTier);
    assert.equal(violations.length, 2);
    assert.ok(violations[0].includes("patterns"));
    assert.ok(violations[1].includes("severity_breakdown"));
  });

  test("returns empty array for stub tier (no requirements)", () => {
    const record = {
      completeness: "stub",
      completeness_missing: ["title", "patterns"],
    };
    const requiredForTier = {
      full: ["title", "patterns"],
      stub: [],
    };
    const violations = validateCompleteness(record, requiredForTier);
    assert.equal(violations.length, 0);
  });

  test("returns empty array for unknown tier not in requiredForTier", () => {
    const record = {
      completeness: "custom",
      completeness_missing: ["everything"],
    };
    const violations = validateCompleteness(record, { full: ["everything"] });
    assert.equal(violations.length, 0);
  });
});
