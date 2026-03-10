/**
 * normalize-file-path.js Smoke Tests
 *
 * Verifies that normalizeFilePath handles backslash conversion, leading ./ removal,
 * org/repo prefix stripping, and optional repo-root stripping.
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/lib/normalize-file-path.test.js
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

const MODULE_PATH = path.resolve(PROJECT_ROOT, "scripts/lib/normalize-file-path.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const normalizeFilePath = require(MODULE_PATH) as (
  filePath: string,
  options?: { stripRepoRoot?: boolean }
) => string;

describe("normalizeFilePath", () => {
  it("converts Windows backslashes to forward slashes", () => {
    const result = normalizeFilePath(String.raw`src\lib\foo.ts`);
    assert.equal(result, "src/lib/foo.ts");
  });

  it("removes leading ./", () => {
    assert.equal(normalizeFilePath("./src/foo.ts"), "src/foo.ts");
  });

  it("removes leading /", () => {
    assert.equal(normalizeFilePath("/src/foo.ts"), "src/foo.ts");
  });

  it("strips org/repo prefix (colon notation)", () => {
    const result = normalizeFilePath("myorg_myrepo:src/foo.ts");
    assert.equal(result, "src/foo.ts");
  });

  it("preserves Windows drive letters (single letter before colon)", () => {
    const result = normalizeFilePath("C:/Users/foo/bar.ts");
    // Windows drive letter should not be stripped as org prefix
    assert.ok(result.includes("Users/foo/bar.ts"), `unexpected result: ${result}`);
  });

  it("returns empty string for empty input", () => {
    assert.equal(normalizeFilePath(""), "");
  });

  it("returns empty string for falsy input", () => {
    assert.equal(normalizeFilePath(null as unknown as string), "");
  });

  it("strips repo root when stripRepoRoot option is true", () => {
    // The function looks for the repo name (default: 'sonash-v0') in the path
    const result = normalizeFilePath("/home/user/sonash-v0/src/foo.ts", {
      stripRepoRoot: true,
    });
    assert.equal(result, "src/foo.ts");
  });
});
