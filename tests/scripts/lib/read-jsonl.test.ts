/**
 * read-jsonl.js Smoke Tests
 *
 * Verifies that readJsonl parses valid JSONL, skips blank lines, handles
 * malformed JSON gracefully, and honours the safe/quiet options.
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/lib/read-jsonl.test.js
 */

import { describe, it, afterEach } from "node:test";
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

const MODULE_PATH = path.resolve(PROJECT_ROOT, "scripts/lib/read-jsonl.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const readJsonl = require(MODULE_PATH) as (
  filePath: string,
  options?: { safe?: boolean; quiet?: boolean }
) => unknown[];

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "read-jsonl-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
  }
});

describe("readJsonl", () => {
  it("parses valid JSONL and returns all items", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "valid.jsonl");
    fs.writeFileSync(
      filePath,
      [JSON.stringify({ id: 1 }), JSON.stringify({ id: 2 }), JSON.stringify({ id: 3 })].join("\n")
    );

    const items = readJsonl(filePath);
    assert.equal(items.length, 3);
    assert.deepEqual(items[0], { id: 1 });
    assert.deepEqual(items[2], { id: 3 });
  });

  it("skips blank lines", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "blanks.jsonl");
    fs.writeFileSync(filePath, `${JSON.stringify({ a: 1 })}\n\n${JSON.stringify({ b: 2 })}\n`);

    const items = readJsonl(filePath);
    assert.equal(items.length, 2);
  });

  it("skips malformed JSON lines without throwing (quiet mode)", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "mixed.jsonl");
    fs.writeFileSync(
      filePath,
      `${JSON.stringify({ good: true })}\nBAD JSON LINE\n${JSON.stringify({ also: "good" })}`
    );

    const items = readJsonl(filePath, { quiet: true });
    assert.equal(items.length, 2);
  });

  it("returns empty array for missing file when safe=true", () => {
    const items = readJsonl("/nonexistent/path/file.jsonl", { safe: true });
    assert.deepEqual(items, []);
  });
});
