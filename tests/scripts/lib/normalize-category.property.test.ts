import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import * as path from "node:path";
import * as fs from "node:fs";

// Property tests for scripts/lib/normalize-category.js
// Property: output is always a member of the valid category set.

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

// Load category mappings to get the valid output set
const categoryMappingsPath = path.resolve(PROJECT_ROOT, "scripts/config/category-mappings.json");
const categoryMappings = JSON.parse(fs.readFileSync(categoryMappingsPath, "utf-8")) as {
  defaultCategory: string;
  aliases: Record<string, string>;
};

const VALID_CATEGORIES = new Set([
  categoryMappings.defaultCategory,
  ...Object.values(categoryMappings.aliases),
]);

describe("normalizeCategory property: output is always in the valid category set", () => {
  it("any string input produces a valid category", () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = normalizeCategory(input);
        assert.ok(
          VALID_CATEGORIES.has(result),
          `normalizeCategory(${JSON.stringify(input)}) returned "${result}" which is not in ${JSON.stringify([...VALID_CATEGORIES])}`
        );
      })
    );
  });

  it("null input produces the default category", () => {
    const result = normalizeCategory(null);
    assert.strictEqual(result, categoryMappings.defaultCategory);
  });

  it("undefined input produces the default category", () => {
    const result = normalizeCategory(undefined);
    assert.strictEqual(result, categoryMappings.defaultCategory);
  });

  it("empty string input produces the default category", () => {
    const result = normalizeCategory("");
    assert.strictEqual(result, categoryMappings.defaultCategory);
  });

  it("whitespace-only string produces the default category", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\s+$/), (input) => {
        const result = normalizeCategory(input);
        assert.strictEqual(result, categoryMappings.defaultCategory);
      })
    );
  });

  it("all known aliases resolve to valid categories", () => {
    for (const [alias, expected] of Object.entries(categoryMappings.aliases)) {
      const result = normalizeCategory(alias);
      assert.strictEqual(
        result,
        expected,
        `alias "${alias}" should resolve to "${expected}" but got "${result}"`
      );
      assert.ok(VALID_CATEGORIES.has(result), `Resolved category "${result}" is not in valid set`);
    }
  });

  it("output is always a non-empty string", () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const result = normalizeCategory(input);
        assert.ok(
          typeof result === "string" && result.length > 0,
          `Expected non-empty string, got: ${JSON.stringify(result)}`
        );
      })
    );
  });
});
