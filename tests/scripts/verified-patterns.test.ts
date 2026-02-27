/**
 * verified-patterns.json Validation Test Suite
 *
 * Ensures the verified-patterns.json configuration file maintains structural
 * integrity: valid JSON, correct types, no duplicates, no empty arrays.
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

  test("all pattern keys are strings", () => {
    // JSON keys are always strings, but verify the object was parsed correctly
    const keys = Object.keys(parsed);
    assert.ok(keys.length > 0, "Should have at least one pattern key");

    for (const key of keys) {
      assert.equal(typeof key, "string", `Key should be a string, got: ${typeof key}`);
      assert.ok(key.length > 0, "Pattern key should not be empty");
    }
  });

  test("all values are arrays of strings", () => {
    for (const [key, value] of Object.entries(parsed)) {
      assert.ok(
        Array.isArray(value),
        `Value for key "${key}" should be an array, got ${typeof value}`
      );

      const arr = value as unknown[];
      for (let i = 0; i < arr.length; i++) {
        assert.equal(
          typeof arr[i],
          "string",
          `Entry ${i} in "${key}" should be a string, got ${typeof arr[i]}: ${String(arr[i])}`
        );
      }
    }
  });

  test("no duplicate entries within any array", () => {
    for (const [key, value] of Object.entries(parsed)) {
      const arr = value as string[];
      const seen = new Set<string>();
      const duplicates: string[] = [];

      for (const entry of arr) {
        if (seen.has(entry)) {
          duplicates.push(entry);
        }
        seen.add(entry);
      }

      assert.equal(
        duplicates.length,
        0,
        `Pattern "${key}" has duplicate entries: ${duplicates.join(", ")}`
      );
    }
  });

  test("no empty arrays (each key should have at least one entry)", () => {
    for (const [key, value] of Object.entries(parsed)) {
      const arr = value as string[];
      assert.ok(
        arr.length > 0,
        `Pattern "${key}" has an empty array — remove the key or add entries`
      );
    }
  });

  test("all entries are non-empty strings (no blank entries)", () => {
    for (const [key, value] of Object.entries(parsed)) {
      const arr = value as string[];
      for (let i = 0; i < arr.length; i++) {
        assert.ok(arr[i].trim().length > 0, `Entry ${i} in "${key}" is blank/whitespace-only`);
      }
    }
  });

  test("pattern keys use kebab-case convention", () => {
    const kebabCase = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
    for (const key of Object.keys(parsed)) {
      assert.ok(kebabCase.test(key), `Pattern key "${key}" does not follow kebab-case convention`);
    }
  });
});
