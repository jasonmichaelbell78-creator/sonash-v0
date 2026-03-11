/**
 * normalize-category.js Smoke Tests
 *
 * Verifies that normalizeCategory resolves known aliases to canonical values
 * and falls back to the default category for unknown inputs.
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/lib/normalize-category.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

const MODULE_PATH = path.resolve(PROJECT_ROOT, "scripts/lib/normalize-category.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const normalizeCategory = require(MODULE_PATH) as (cat: unknown) => string;

describe("normalizeCategory", () => {
  it("resolves exact alias 'code' to 'code-quality'", () => {
    assert.equal(normalizeCategory("code"), "code-quality");
  });

  it("resolves 'security' to 'security'", () => {
    assert.equal(normalizeCategory("security"), "security");
  });

  it("resolves 'perf' to 'performance'", () => {
    assert.equal(normalizeCategory("perf"), "performance");
  });

  it("returns default category for unknown input", () => {
    const result = normalizeCategory("totally-unknown-xyz");
    // Default is 'code-quality' per category-mappings.json
    assert.equal(result, "code-quality");
  });

  it("returns default category for null", () => {
    const result = normalizeCategory(null);
    assert.equal(result, "code-quality");
  });

  it("returns default category for empty string", () => {
    const result = normalizeCategory("");
    assert.equal(result, "code-quality");
  });
});
