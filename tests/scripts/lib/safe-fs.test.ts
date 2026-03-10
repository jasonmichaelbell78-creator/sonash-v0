/**
 * safe-fs.js Test Suite (tests/scripts/lib/)
 *
 * Thin redirect: full coverage lives in tests/scripts/safe-fs.test.ts.
 * This file provides the lib-directory entry point so test:infra
 * (which globs tests/scripts/lib/**) picks it up without duplicating tests.
 *
 * Only verifies the module can be loaded and exports the expected API.
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

const MODULE_PATH = path.resolve(PROJECT_ROOT, "scripts/lib/safe-fs.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const safeFsModule = require(MODULE_PATH) as Record<string, unknown>;

describe("safe-fs module exports", () => {
  it("exports safeWriteFileSync as a function", () => {
    assert.equal(typeof safeFsModule["safeWriteFileSync"], "function");
  });

  it("exports safeAppendFileSync as a function", () => {
    assert.equal(typeof safeFsModule["safeAppendFileSync"], "function");
  });

  it("exports safeRenameSync as a function", () => {
    assert.equal(typeof safeFsModule["safeRenameSync"], "function");
  });

  it("exports safeAtomicWriteSync as a function", () => {
    assert.equal(typeof safeFsModule["safeAtomicWriteSync"], "function");
  });

  it("exports readUtf8Sync as a function", () => {
    assert.equal(typeof safeFsModule["readUtf8Sync"], "function");
  });

  it("exports isSafeToWrite as a function", () => {
    assert.equal(typeof safeFsModule["isSafeToWrite"], "function");
  });
});
