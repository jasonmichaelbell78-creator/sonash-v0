/**
 * verified-patterns.json Validation Test Suite
 *
 * Ensures the verified-patterns.json configuration file maintains structural
 * integrity: valid JSON, correct types, no duplicates.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { test, describe } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";

// Get project root (works both in source and compiled contexts)
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const VERIFIED_PATTERNS_PATH = path.resolve(PROJECT_ROOT, "scripts/config/verified-patterns.json");

describe("verified-patterns.json", () => {
  let parsed: Record<string, unknown>;

  // Parse once, reuse across tests
  test("is valid JSON", () => {
    const raw = fs.readFileSync(VERIFIED_PATTERNS_PATH, "utf-8");
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      assert.fail(`verified-patterns.json is not valid JSON: ${msg}`);
    }
    assert.ok(
      parsed !== null && typeof parsed === "object" && !Array.isArray(parsed),
      "Root value should be a plain object"
    );
  });

  test("has required top-level fields", () => {
    assert.ok("schema_version" in parsed, "Should have schema_version");
    assert.equal(parsed.schema_version, 1, "schema_version should be 1");
    assert.ok("patterns" in parsed, "Should have patterns array");
    assert.ok(Array.isArray(parsed.patterns), "patterns should be an array");
    assert.ok("exemptions" in parsed, "Should have exemptions object");
  });

  test("patterns array has valid entries", () => {
    const patterns = parsed.patterns as Record<string, unknown>[];
    assert.ok(patterns.length > 0, "Should have at least one pattern");

    for (const pattern of patterns) {
      assert.ok(
        typeof pattern.id === "string" && pattern.id.length > 0,
        "Pattern must have non-empty id"
      );
      assert.ok(typeof pattern.anti_pattern === "string", "Pattern must have anti_pattern string");
      assert.ok(
        typeof pattern.positive_pattern_ref === "string",
        "Pattern must have positive_pattern_ref"
      );
      assert.ok(typeof pattern.enforcement === "string", "Pattern must have enforcement string");
      assert.ok(typeof pattern.severity === "string", "Pattern must have severity string");
    }
  });

  test("no duplicate pattern IDs", () => {
    const patterns = parsed.patterns as Record<string, unknown>[];
    const ids = patterns.map((p) => p.id as string);
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const id of ids) {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    }

    assert.equal(duplicates.length, 0, `Duplicate pattern IDs: ${duplicates.join(", ")}`);
  });

  test("pattern IDs use kebab-case convention", () => {
    const patterns = parsed.patterns as Record<string, unknown>[];
    const kebabCase = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

    for (const pattern of patterns) {
      const id = pattern.id as string;
      assert.ok(kebabCase.test(id), `Pattern ID "${id}" does not follow kebab-case convention`);
    }
  });

  test("exemptions values are arrays of strings", () => {
    const exemptions = parsed.exemptions as Record<string, unknown>;
    assert.ok(
      typeof exemptions === "object" && exemptions !== null,
      "exemptions should be an object"
    );

    for (const [key, value] of Object.entries(exemptions)) {
      assert.ok(Array.isArray(value), `Exemption "${key}" should be an array`);
      const arr = value as unknown[];
      for (let i = 0; i < arr.length; i++) {
        assert.equal(
          typeof arr[i],
          "string",
          `Entry ${i} in exemption "${key}" should be a string`
        );
      }
    }
  });

  test("exemption keys use kebab-case convention", () => {
    const exemptions = parsed.exemptions as Record<string, unknown>;
    const kebabCase = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

    for (const key of Object.keys(exemptions)) {
      assert.ok(
        kebabCase.test(key),
        `Exemption key "${key}" does not follow kebab-case convention`
      );
    }
  });
});
