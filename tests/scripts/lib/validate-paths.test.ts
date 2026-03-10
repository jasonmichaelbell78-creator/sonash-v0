/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * validate-paths.js Minimal Test Suite
 *
 * Tests the shared path validation utilities from scripts/lib/validate-paths.js.
 * Covers: validateFilePath, sanitizeFilesystemError, validateAndVerifyPath.
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/lib/validate-paths.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

const MODULE_PATH = path.resolve(PROJECT_ROOT, "scripts/lib/validate-paths.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { validateFilePath, sanitizeFilesystemError, validateAndVerifyPath } = require(
  MODULE_PATH
) as {
  validateFilePath: (
    filePath: unknown,
    projectDir: string
  ) => { valid: boolean; error: string | null; normalized: string | null };
  sanitizeFilesystemError: (err: unknown) => string;
  validateAndVerifyPath: (
    filePath: string,
    projectDir: string
  ) => { valid: boolean; error: string | null; normalized: string | null; realPath: string | null };
};

const PROJECT_DIR = os.tmpdir();

// =========================================================
// validateFilePath
// =========================================================

describe("validateFilePath", () => {
  it("accepts a simple relative path", () => {
    const result = validateFilePath("src/foo.ts", PROJECT_DIR);
    assert.equal(result.valid, true);
    assert.equal(result.error, null);
    assert.ok(result.normalized !== null);
  });

  it("rejects empty string", () => {
    const result = validateFilePath("", PROJECT_DIR);
    assert.equal(result.valid, false);
    assert.ok(result.error !== null);
  });

  it("rejects non-string input", () => {
    const result = validateFilePath(42, PROJECT_DIR);
    assert.equal(result.valid, false);
  });

  it("rejects path traversal via ../ segments", () => {
    const result = validateFilePath("../etc/passwd", PROJECT_DIR);
    assert.equal(result.valid, false);
    assert.match(result.error ?? "", /traversal|traversal detected/i);
  });

  it("rejects option-like path starting with -", () => {
    const result = validateFilePath("-rf /", PROJECT_DIR);
    assert.equal(result.valid, false);
    assert.match(result.error ?? "", /option/i);
  });

  it("rejects path with NUL byte", () => {
    const result = validateFilePath("foo\0bar", PROJECT_DIR);
    assert.equal(result.valid, false);
    // NUL (\x00) falls in the control character range [\x00-\x08], so the
    // control character check fires before the explicit NUL check, returning
    // "Control character rejected" rather than "NUL byte rejected"
    assert.match(result.error ?? "", /control character/i);
  });

  it("rejects multiline path", () => {
    const result = validateFilePath("foo\nbar", PROJECT_DIR);
    assert.equal(result.valid, false);
    assert.match(result.error ?? "", /multiline/i);
  });

  it("rejects invalid projectDir", () => {
    const result = validateFilePath("src/foo.ts", "");
    assert.equal(result.valid, false);
  });

  it("rejects path too long", () => {
    const longPath = "a".repeat(5000);
    const result = validateFilePath(longPath, PROJECT_DIR);
    assert.equal(result.valid, false);
    assert.match(result.error ?? "", /too long/i);
  });
});

// =========================================================
// sanitizeFilesystemError
// =========================================================

describe("sanitizeFilesystemError", () => {
  it("replaces /home/ paths with [HOME]", () => {
    const err = new Error("ENOENT: no such file /home/user/secret.txt");
    const result = sanitizeFilesystemError(err);
    assert.ok(!result.includes("/home/user"), "raw home path should be redacted");
    assert.ok(result.includes("[HOME]"), "should contain [HOME]");
  });

  it("replaces /tmp/ paths with [TMP]", () => {
    const err = new Error("failed to read /tmp/sensitive");
    const result = sanitizeFilesystemError(err);
    assert.ok(result.includes("[TMP]"), "should contain [TMP]");
  });

  it("handles non-Error objects", () => {
    const result = sanitizeFilesystemError("a plain string error");
    assert.equal(typeof result, "string");
  });

  it("truncates excessively long error messages", () => {
    const err = new Error("x".repeat(600));
    const result = sanitizeFilesystemError(err);
    assert.ok(result.length <= 520, "should be truncated");
  });
});

// =========================================================
// validateAndVerifyPath
// =========================================================

describe("validateAndVerifyPath", () => {
  it("rejects traversal in combined validate+verify", () => {
    const result = validateAndVerifyPath("../../etc/passwd", PROJECT_DIR);
    assert.equal(result.valid, false);
  });

  it("rejects non-existent path (containment check fails)", () => {
    const result = validateAndVerifyPath("definitely-does-not-exist-xyz.txt", PROJECT_DIR);
    // Either validation or containment will reject a non-existent file
    assert.equal(result.valid, false);
  });
});
