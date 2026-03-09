/**
 * Tests for .claude/hooks/lib/symlink-guard.js
 *
 * Validates that isSafeToWrite() correctly rejects symlinks,
 * relative paths, and passes real absolute paths.
 */

import assert from "node:assert/strict";
import { describe, test, beforeEach, afterEach } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      /* existsSync race */
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}
const PROJECT_ROOT = findProjectRoot(__dirname);

/* eslint-disable @typescript-eslint/no-require-imports */
const { isSafeToWrite } = require(
  path.join(PROJECT_ROOT, ".claude/hooks/lib/symlink-guard.js")
) as {
  isSafeToWrite: (filePath: string) => boolean;
};
/* eslint-enable @typescript-eslint/no-require-imports */

describe("isSafeToWrite", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "symlink-guard-test-"));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  });

  test("returns false for relative paths", () => {
    const result = isSafeToWrite("relative/path/to/file.json");
    assert.equal(result, false);
  });

  test("returns false for a single-dot relative path", () => {
    const result = isSafeToWrite("./file.json");
    assert.equal(result, false);
  });

  test("returns true for a real absolute path to a non-existent file in real dir", () => {
    const filePath = path.join(tmpDir, "output.json");
    const result = isSafeToWrite(filePath);
    assert.equal(result, true, `Expected true for real absolute path: ${filePath}`);
  });

  test("returns true for a real existing file (no symlinks)", () => {
    const filePath = path.join(tmpDir, "existing.json");
    fs.writeFileSync(filePath, "{}");
    const result = isSafeToWrite(filePath);
    assert.equal(result, true);
  });

  test("returns false when the target file itself is a symlink", () => {
    // Skip on platforms where symlinks require elevated permissions
    const realFile = path.join(tmpDir, "real.json");
    const linkFile = path.join(tmpDir, "link.json");
    fs.writeFileSync(realFile, "{}");
    try {
      fs.symlinkSync(realFile, linkFile);
    } catch {
      // If symlink creation fails (Windows without elevated perms), skip
      return;
    }
    const result = isSafeToWrite(linkFile);
    assert.equal(result, false, "Should reject symlinked file");
  });

  test("returns false when a parent directory is a symlink", () => {
    const realSubDir = path.join(tmpDir, "real-subdir");
    const linkSubDir = path.join(tmpDir, "link-subdir");
    fs.mkdirSync(realSubDir);
    try {
      fs.symlinkSync(realSubDir, linkSubDir);
    } catch {
      // Skip if symlinks not supported
      return;
    }
    const filePath = path.join(linkSubDir, "file.json");
    const result = isSafeToWrite(filePath);
    assert.equal(result, false, "Should reject path through symlinked directory");
  });

  test("returns false for empty string input", () => {
    // Empty string is not absolute
    const result = isSafeToWrite("");
    assert.equal(result, false);
  });

  test("returns true for nested absolute paths with no symlinks", () => {
    const nested = path.join(tmpDir, "a", "b", "c");
    fs.mkdirSync(nested, { recursive: true });
    const filePath = path.join(nested, "state.json");
    const result = isSafeToWrite(filePath);
    assert.equal(result, true);
  });
});
