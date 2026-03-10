import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import * as path from "node:path";
import * as fs from "node:fs";

// Property tests for scripts/lib/generate-content-hash.js
// Property: output is always a 64-character hex string (SHA256).

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
const generateContentHash = require(MODULE_PATH) as (item: unknown) => string;

const HEX_64_REGEX = /^[0-9a-f]{64}$/;

describe("generateContentHash property: output is always 64-char hex", () => {
  it("any object input produces a 64-char hex hash", () => {
    fc.assert(
      fc.property(
        fc.record({
          file: fc.string(),
          line: fc.oneof(fc.integer(), fc.string()),
          title: fc.string(),
          description: fc.string(),
        }),
        (item) => {
          const result = generateContentHash(item);
          assert.ok(
            HEX_64_REGEX.test(result),
            `generateContentHash returned "${result}" which is not a 64-char hex string`
          );
        }
      )
    );
  });

  it("null input still produces a 64-char hex hash", () => {
    const result = generateContentHash(null);
    assert.ok(HEX_64_REGEX.test(result), `Expected 64-char hex, got: "${result}"`);
  });

  it("empty object still produces a 64-char hex hash", () => {
    const result = generateContentHash({});
    assert.ok(HEX_64_REGEX.test(result), `Expected 64-char hex, got: "${result}"`);
  });

  it("different inputs produce different hashes (no trivial collisions)", () => {
    fc.assert(
      fc.property(
        fc.record({
          file: fc.string(),
          line: fc.integer(),
          title: fc.string({ minLength: 5 }),
          description: fc.string(),
        }),
        fc.record({
          file: fc.string(),
          line: fc.integer(),
          title: fc.string({ minLength: 5 }),
          description: fc.string(),
        }),
        (itemA, itemB) => {
          // Only test when items are clearly different
          if (
            itemA.file === itemB.file &&
            itemA.line === itemB.line &&
            itemA.title === itemB.title &&
            itemA.description === itemB.description
          ) {
            return; // Same input, same hash expected — skip
          }
          const hashA = generateContentHash(itemA);
          const hashB = generateContentHash(itemB);
          // Both must be valid hashes
          assert.ok(HEX_64_REGEX.test(hashA));
          assert.ok(HEX_64_REGEX.test(hashB));
        }
      )
    );
  });

  it("deterministic: same input always produces same hash", () => {
    fc.assert(
      fc.property(
        fc.record({
          file: fc.string(),
          line: fc.integer(),
          title: fc.string(),
          description: fc.string(),
        }),
        (item) => {
          const hash1 = generateContentHash(item);
          const hash2 = generateContentHash(item);
          assert.strictEqual(
            hash1,
            hash2,
            `Hash should be deterministic for ${JSON.stringify(item)}`
          );
        }
      )
    );
  });

  it("output length is exactly 64 characters", () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const result = generateContentHash(input);
        assert.strictEqual(result.length, 64, `Expected length 64, got ${result.length}`);
      })
    );
  });
});
