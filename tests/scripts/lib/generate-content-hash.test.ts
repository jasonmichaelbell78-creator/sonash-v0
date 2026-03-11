/**
 * generate-content-hash.js Smoke Tests
 *
 * Verifies that generateContentHash produces stable hex SHA-256 strings
 * and handles edge-case inputs gracefully.
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/lib/generate-content-hash.test.js
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

const MODULE_PATH = path.resolve(PROJECT_ROOT, "scripts/lib/generate-content-hash.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const generateContentHash = require(MODULE_PATH) as (item: Record<string, unknown>) => string;

describe("generateContentHash", () => {
  it("returns a 64-character hex string for a complete item", () => {
    const hash = generateContentHash({
      file: "src/lib/foo.ts",
      line: 10,
      title: "Missing error handling",
      description: "The function does not catch errors",
    });
    assert.match(hash, /^[0-9a-f]{64}$/, "should be a 64-char hex SHA-256");
  });

  it("produces the same hash for identical inputs (deterministic)", () => {
    const item = { file: "src/a.ts", line: 1, title: "Title", description: "Desc" };
    const h1 = generateContentHash(item);
    const h2 = generateContentHash(item);
    assert.equal(h1, h2);
  });

  it("produces different hashes for different titles", () => {
    const base = { file: "src/a.ts", line: 1, description: "Desc" };
    const h1 = generateContentHash({ ...base, title: "Alpha" });
    const h2 = generateContentHash({ ...base, title: "Beta" });
    assert.notEqual(h1, h2);
  });

  it("handles missing fields gracefully (does not throw)", () => {
    assert.doesNotThrow(() => generateContentHash({}));
    assert.doesNotThrow(() => generateContentHash({ file: null, line: null, title: null }));
  });

  it("handles null/undefined input gracefully", () => {
    assert.doesNotThrow(() => generateContentHash(null as unknown as Record<string, unknown>));
  });
});
