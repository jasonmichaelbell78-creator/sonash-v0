/**
 * safe-fs.js Test Suite
 *
 * Tests the safe filesystem operation wrappers from scripts/lib/safe-fs.js.
 * Validates symlink guards, EXDEV fallback, BOM stripping, and option passthrough.
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { test, describe, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Get project root (works both in source and compiled contexts)
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, "../../package.json"))
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "../../..");

const safeFsPath = path.resolve(PROJECT_ROOT, "scripts/lib/safe-fs.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const safeFsModule = require(safeFsPath) as {
  safeWriteFileSync: (
    filePath: string,
    data: string | Buffer,
    options?: fs.WriteFileOptions
  ) => void;
  safeAppendFileSync: (
    filePath: string,
    data: string | Buffer,
    options?: fs.WriteFileOptions
  ) => void;
  safeRenameSync: (src: string, dest: string) => void;
  safeAtomicWriteSync: (
    filePath: string,
    data: string | Buffer,
    options?: fs.WriteFileOptions
  ) => void;
  readUtf8Sync: (filePath: string) => string;
  isSafeToWrite: (filePath: string) => boolean;
};

const {
  safeWriteFileSync,
  safeAppendFileSync,
  safeRenameSync,
  safeAtomicWriteSync,
  readUtf8Sync,
  isSafeToWrite,
} = safeFsModule;

// Track temp directories for cleanup
const tempDirs: string[] = [];

function createTempDir(prefix = "safe-fs-test-"): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  // Clean up all temp directories created during this test
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // best effort cleanup
      }
    }
  }
});

// =========================================================
// isSafeToWrite
// =========================================================

describe("isSafeToWrite", () => {
  test("returns true for a normal file path", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "normal.txt");
    fs.writeFileSync(filePath, "hello");

    assert.equal(isSafeToWrite(filePath), true);
  });

  test("returns true for a non-existent file in a real directory", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "does-not-exist.txt");

    assert.equal(isSafeToWrite(filePath), true);
  });

  test("returns false for a relative path", () => {
    assert.equal(isSafeToWrite("relative/path.txt"), false);
  });

  test("returns false for a symlinked file", (t) => {
    const tmpDir = createTempDir();
    const realFile = path.join(tmpDir, "real.txt");
    const linkFile = path.join(tmpDir, "link.txt");

    fs.writeFileSync(realFile, "real content");
    try {
      fs.symlinkSync(realFile, linkFile);
    } catch {
      t.skip("Symlink creation not supported in this environment");
      return;
    }

    assert.equal(isSafeToWrite(linkFile), false);
  });
});

// =========================================================
// safeWriteFileSync
// =========================================================

describe("safeWriteFileSync", () => {
  test("writes successfully to a normal path", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "output.txt");

    safeWriteFileSync(filePath, "hello world");

    const content = fs.readFileSync(filePath, "utf-8");
    assert.equal(content, "hello world");
  });

  test("overwrites existing file content", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "output.txt");

    safeWriteFileSync(filePath, "first");
    safeWriteFileSync(filePath, "second");

    const content = fs.readFileSync(filePath, "utf-8");
    assert.equal(content, "second");
  });

  test("passes options through (e.g., encoding)", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "encoded.txt");

    safeWriteFileSync(filePath, "utf8 content", { encoding: "utf-8" });

    const content = fs.readFileSync(filePath, "utf-8");
    assert.equal(content, "utf8 content");
  });

  test("throws when path is a symlink", (t) => {
    const tmpDir = createTempDir();
    const realFile = path.join(tmpDir, "real.txt");
    const linkFile = path.join(tmpDir, "link.txt");

    fs.writeFileSync(realFile, "real");
    try {
      fs.symlinkSync(realFile, linkFile);
    } catch {
      t.skip("Symlink creation not supported in this environment");
      return;
    }

    assert.throws(
      () => safeWriteFileSync(linkFile, "malicious"),
      /Refusing to write to symlinked path/
    );

    // Verify original file was not modified
    assert.equal(fs.readFileSync(realFile, "utf-8"), "real");
  });

  test("writes Buffer data correctly", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "buffer.bin");
    const buf = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"

    safeWriteFileSync(filePath, buf);

    const content = fs.readFileSync(filePath);
    assert.deepEqual(content, buf);
  });
});

// =========================================================
// safeAppendFileSync
// =========================================================

describe("safeAppendFileSync", () => {
  test("appends successfully to a normal file", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "append.txt");

    fs.writeFileSync(filePath, "line1\n");
    safeAppendFileSync(filePath, "line2\n");

    const content = fs.readFileSync(filePath, "utf-8");
    assert.equal(content, "line1\nline2\n");
  });

  test("creates file if it does not exist", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "new-append.txt");

    safeAppendFileSync(filePath, "first line\n");

    const content = fs.readFileSync(filePath, "utf-8");
    assert.equal(content, "first line\n");
  });

  test("throws when path is a symlink", (t) => {
    const tmpDir = createTempDir();
    const realFile = path.join(tmpDir, "real.txt");
    const linkFile = path.join(tmpDir, "link.txt");

    fs.writeFileSync(realFile, "original");
    try {
      fs.symlinkSync(realFile, linkFile);
    } catch {
      t.skip("Symlink creation not supported in this environment");
      return;
    }

    assert.throws(
      () => safeAppendFileSync(linkFile, "malicious"),
      /Refusing to append to symlinked path/
    );

    // Verify original file was not modified
    assert.equal(fs.readFileSync(realFile, "utf-8"), "original");
  });

  test("passes options through", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "encoded-append.txt");

    safeAppendFileSync(filePath, "content", { encoding: "utf-8" });

    const content = fs.readFileSync(filePath, "utf-8");
    assert.equal(content, "content");
  });
});

// =========================================================
// safeRenameSync
// =========================================================

describe("safeRenameSync", () => {
  test("renames successfully when destination does not exist", () => {
    const tmpDir = createTempDir();
    const src = path.join(tmpDir, "source.txt");
    const dest = path.join(tmpDir, "dest.txt");

    fs.writeFileSync(src, "move me");
    safeRenameSync(src, dest);

    assert.equal(fs.existsSync(src), false, "source should be removed");
    assert.equal(fs.readFileSync(dest, "utf-8"), "move me");
  });

  test("renames successfully when destination already exists (rmSync pre-step)", () => {
    const tmpDir = createTempDir();
    const src = path.join(tmpDir, "source.txt");
    const dest = path.join(tmpDir, "dest.txt");

    fs.writeFileSync(dest, "old content");
    fs.writeFileSync(src, "new content");
    safeRenameSync(src, dest);

    assert.equal(fs.existsSync(src), false, "source should be removed");
    assert.equal(fs.readFileSync(dest, "utf-8"), "new content");
  });

  test("falls back to copy+unlink on EXDEV error", () => {
    // safe-fs.js uses require("node:fs") internally (CJS).
    // We access the same CJS module object to mock renameSync.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const cjsFs = require("node:fs");

    const tmpDir = createTempDir();
    const src = path.join(tmpDir, "source.txt");
    const dest = path.join(tmpDir, "dest.txt");

    fs.writeFileSync(src, "cross-device content");

    // Save original and replace with EXDEV-throwing version
    const originalRename = cjsFs.renameSync;
    let exdevThrown = false;
    cjsFs.renameSync = () => {
      exdevThrown = true;
      const err = new Error("EXDEV: cross-device link not permitted") as NodeJS.ErrnoException;
      err.code = "EXDEV";
      throw err;
    };

    try {
      safeRenameSync(src, dest);
    } finally {
      cjsFs.renameSync = originalRename;
    }

    assert.equal(exdevThrown, true, "EXDEV error should have been thrown and caught");
    assert.equal(fs.readFileSync(dest, "utf-8"), "cross-device content");
    // The safe-fs uses copyFileSync + unlinkSync, so source should be gone
    assert.equal(fs.existsSync(src), false, "source should be removed after EXDEV fallback");
  });

  test("throws when destination is a symlink", (t) => {
    const tmpDir = createTempDir();
    const src = path.join(tmpDir, "source.txt");
    const realDest = path.join(tmpDir, "real-dest.txt");
    const linkDest = path.join(tmpDir, "link-dest.txt");

    fs.writeFileSync(src, "content");
    fs.writeFileSync(realDest, "original");
    try {
      fs.symlinkSync(realDest, linkDest);
    } catch {
      t.skip("Symlink creation not supported in this environment");
      return;
    }

    assert.throws(() => safeRenameSync(src, linkDest), /Refusing to rename to symlinked path/);

    // Source should still exist (rename was refused)
    assert.equal(fs.existsSync(src), true);
    assert.equal(fs.readFileSync(realDest, "utf-8"), "original");
  });
});

// =========================================================
// safeAtomicWriteSync
// =========================================================

describe("safeAtomicWriteSync", () => {
  test("creates tmp file and renames to final path", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "atomic-output.txt");

    safeAtomicWriteSync(filePath, "atomic content");

    assert.equal(fs.readFileSync(filePath, "utf-8"), "atomic content");
    // tmp file should not remain
    assert.equal(fs.existsSync(`${filePath}.tmp`), false, ".tmp file should be cleaned up");
  });

  test("overwrites existing file atomically", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "atomic-output.txt");

    fs.writeFileSync(filePath, "original");
    safeAtomicWriteSync(filePath, "updated");

    assert.equal(fs.readFileSync(filePath, "utf-8"), "updated");
  });

  test("throws when final path is a symlink", (t) => {
    const tmpDir = createTempDir();
    const realFile = path.join(tmpDir, "real.txt");
    const linkFile = path.join(tmpDir, "link.txt");

    fs.writeFileSync(realFile, "original");
    try {
      fs.symlinkSync(realFile, linkFile);
    } catch {
      t.skip("Symlink creation not supported in this environment");
      return;
    }

    assert.throws(
      () => safeAtomicWriteSync(linkFile, "malicious"),
      /Refusing atomic write to symlinked path/
    );

    // Original file should not be modified
    assert.equal(fs.readFileSync(realFile, "utf-8"), "original");
  });

  test("passes options through to writeFileSync", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "atomic-encoded.txt");

    safeAtomicWriteSync(filePath, "encoded content", { encoding: "utf-8" });

    assert.equal(fs.readFileSync(filePath, "utf-8"), "encoded content");
  });
});

// =========================================================
// readUtf8Sync
// =========================================================

describe("readUtf8Sync", () => {
  test("reads UTF-8 file normally", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "normal.txt");

    fs.writeFileSync(filePath, "hello world", "utf-8");

    const content = readUtf8Sync(filePath);
    assert.equal(content, "hello world");
  });

  test("strips BOM character when present", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "bom.txt");

    // Write BOM + content
    const bom = "\uFEFF";
    fs.writeFileSync(filePath, bom + "content with BOM", "utf-8");

    const content = readUtf8Sync(filePath);
    assert.equal(content, "content with BOM");
    assert.ok(content.length > 0, "Expected non-empty content after stripping BOM");
    assert.notEqual(content.codePointAt(0), 0xfeff, "BOM should be stripped");
  });

  test("returns content unchanged when no BOM", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "no-bom.txt");

    fs.writeFileSync(filePath, "no bom here", "utf-8");

    const content = readUtf8Sync(filePath);
    assert.equal(content, "no bom here");
  });

  test("handles empty file", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "empty.txt");

    fs.writeFileSync(filePath, "", "utf-8");

    const content = readUtf8Sync(filePath);
    assert.equal(content, "");
  });

  test("handles file with only BOM", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "only-bom.txt");

    fs.writeFileSync(filePath, "\uFEFF", "utf-8");

    const content = readUtf8Sync(filePath);
    assert.equal(content, "");
  });
});
