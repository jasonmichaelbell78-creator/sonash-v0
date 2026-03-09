/**
 * Tests for .claude/hooks/lib/rotate-state.js
 *
 * Validates rotateJsonl(), pruneJsonKey(), expireByAge(), and expireJsonlByAge()
 * using real temporary files. archiveRotateJsonl() is tested at a surface level.
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
const { rotateJsonl, pruneJsonKey, expireByAge, expireJsonlByAge, archiveRotateJsonl } = require(
  path.join(PROJECT_ROOT, ".claude/hooks/lib/rotate-state.js")
) as {
  rotateJsonl: (
    filePath: string,
    maxEntries: number,
    keepCount?: number
  ) => { rotated: boolean; before: number; after: number };
  pruneJsonKey: (
    filePath: string,
    keyPath: string,
    maxEntries: number
  ) => { pruned: boolean; before: number; after: number };
  expireByAge: (
    filePath: string,
    maxDays: number
  ) => { expired: boolean; before: number; after: number };
  expireJsonlByAge: (
    filePath: string,
    maxDays: number,
    timestampField?: string
  ) => { expired: boolean; before: number; after: number };
  archiveRotateJsonl: (
    filePath: string,
    maxEntries: number,
    keepCount?: number
  ) => { rotated: boolean; before: number; after: number; archived: number };
};
/* eslint-enable @typescript-eslint/no-require-imports */

// Helper: write JSONL lines to a file in the .claude/state dir (to pass symlink guard)
function getStateDir(): string {
  return path.join(PROJECT_ROOT, ".claude/state");
}

function writeJsonlFile(filePath: string, entries: object[]): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, entries.map((e) => JSON.stringify(e)).join("\n") + "\n");
}

function cleanup(...files: string[]): void {
  for (const f of files) {
    try {
      fs.rmSync(f, { force: true });
    } catch {
      /* ignore */
    }
    try {
      fs.rmSync(`${f}.tmp`, { force: true });
    } catch {
      /* ignore */
    }
    try {
      fs.rmSync(`${f}.archive`, { force: true });
    } catch {
      /* ignore */
    }
  }
}

describe("rotateJsonl", () => {
  let testFile: string;

  beforeEach(() => {
    testFile = path.join(
      getStateDir(),
      `_test-rotate-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`
    );
  });

  afterEach(() => {
    cleanup(testFile);
  });

  test("returns rotated: false when entry count is below maxEntries", () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({ i }));
    writeJsonlFile(testFile, entries);
    const result = rotateJsonl(testFile, 10);
    assert.equal(result.rotated, false);
    assert.equal(result.before, 5);
    assert.equal(result.after, 5);
  });

  test("rotates file when entry count exceeds maxEntries", () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({ i }));
    writeJsonlFile(testFile, entries);
    const result = rotateJsonl(testFile, 10, 6);
    assert.equal(result.rotated, true);
    assert.equal(result.before, 20);
    assert.equal(result.after, 6);
    // Verify file was actually written with 6 lines
    const content = fs.readFileSync(testFile, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    assert.equal(lines.length, 6);
    // Last 6 entries should be kept (i=14 through i=19)
    const last = JSON.parse(lines[lines.length - 1]);
    assert.equal(last.i, 19);
  });

  test("defaults keepCount to 60% of maxEntries", () => {
    const entries = Array.from({ length: 15 }, (_, i) => ({ i }));
    writeJsonlFile(testFile, entries);
    const result = rotateJsonl(testFile, 10); // keepCount defaults to 6 (60% of 10)
    assert.equal(result.rotated, true);
    assert.equal(result.after, 6);
  });

  test("returns rotated: false for non-existent file (graceful failure)", () => {
    const result = rotateJsonl("/nonexistent/path/file.jsonl", 10);
    assert.equal(result.rotated, false);
    assert.equal(result.before, 0);
    assert.equal(result.after, 0);
  });

  test("keepCount is clamped to minimum 1", () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({ i }));
    writeJsonlFile(testFile, entries);
    const result = rotateJsonl(testFile, 3, 0); // 0 should clamp to 1
    if (result.rotated) {
      assert.ok(result.after >= 1, "Should keep at least 1 entry");
    }
  });
});

describe("pruneJsonKey", () => {
  let testFile: string;

  beforeEach(() => {
    testFile = path.join(
      getStateDir(),
      `_test-prune-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
    );
  });

  afterEach(() => {
    cleanup(testFile);
  });

  test("prunes nested array when it exceeds maxEntries", () => {
    const data = { git: { recentCommits: Array.from({ length: 20 }, (_, i) => `sha${i}`) } };
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, JSON.stringify(data, null, 2));

    const result = pruneJsonKey(testFile, "git.recentCommits", 5);
    assert.equal(result.pruned, true);
    assert.equal(result.before, 20);
    assert.equal(result.after, 5);

    // Verify last 5 entries are kept
    const saved = JSON.parse(fs.readFileSync(testFile, "utf-8"));
    assert.deepEqual(saved.git.recentCommits, ["sha15", "sha16", "sha17", "sha18", "sha19"]);
  });

  test("returns pruned: false when array is within maxEntries", () => {
    const data = { items: [1, 2, 3] };
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, JSON.stringify(data));

    const result = pruneJsonKey(testFile, "items", 10);
    assert.equal(result.pruned, false);
    assert.equal(result.before, 3);
  });

  test("returns pruned: false when key path does not exist", () => {
    const data = { other: "value" };
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, JSON.stringify(data));

    const result = pruneJsonKey(testFile, "missing.key", 5);
    assert.equal(result.pruned, false);
  });

  test("returns pruned: false for non-existent file", () => {
    const result = pruneJsonKey("/nonexistent.json", "key", 5);
    assert.equal(result.pruned, false);
    assert.equal(result.before, 0);
    assert.equal(result.after, 0);
  });
});

describe("expireByAge", () => {
  let testFile: string;

  beforeEach(() => {
    testFile = path.join(
      getStateDir(),
      `_test-expire-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
    );
  });

  afterEach(() => {
    cleanup(testFile);
  });

  test("removes entries whose timestamps are older than maxDays", () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const data: Record<string, string> = {
      "old-key": oldDate.toISOString(),
      "new-key": now.toISOString(),
    };
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, JSON.stringify(data, null, 2));

    const result = expireByAge(testFile, 7); // expire entries older than 7 days
    assert.equal(result.expired, true);
    assert.equal(result.before, 2);
    assert.equal(result.after, 1);

    const saved = JSON.parse(fs.readFileSync(testFile, "utf-8"));
    assert.ok("new-key" in saved, "Should keep recent entry");
    assert.ok(!("old-key" in saved), "Should remove old entry");
  });

  test("returns expired: false when no entries are stale", () => {
    const now = new Date();
    const data: Record<string, string> = {
      "fresh-key": now.toISOString(),
    };
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, JSON.stringify(data, null, 2));

    const result = expireByAge(testFile, 7);
    assert.equal(result.expired, false);
  });

  test("returns expired: false for non-existent file", () => {
    const result = expireByAge("/nonexistent.json", 7);
    assert.equal(result.expired, false);
  });

  test("returns expired: false for arrays (only handles plain objects)", () => {
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, JSON.stringify([1, 2, 3]));
    const result = expireByAge(testFile, 7);
    assert.equal(result.expired, false);
  });
});

describe("expireJsonlByAge", () => {
  let testFile: string;

  beforeEach(() => {
    testFile = path.join(
      getStateDir(),
      `_test-expire-jsonl-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`
    );
  });

  afterEach(() => {
    cleanup(testFile);
  });

  test("removes JSONL entries older than maxDays", () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const entries = [
      { timestamp: oldDate.toISOString(), value: "old" },
      { timestamp: now.toISOString(), value: "new" },
    ];
    writeJsonlFile(testFile, entries);

    const result = expireJsonlByAge(testFile, 7);
    assert.equal(result.expired, true);
    assert.equal(result.before, 2);
    assert.equal(result.after, 1);

    const content = fs.readFileSync(testFile, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    assert.equal(lines.length, 1);
    const kept = JSON.parse(lines[0]);
    assert.equal(kept.value, "new");
  });

  test("respects custom timestampField parameter", () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const entries = [
      { created_at: oldDate.toISOString(), v: 1 },
      { created_at: now.toISOString(), v: 2 },
    ];
    writeJsonlFile(testFile, entries);

    const result = expireJsonlByAge(testFile, 7, "created_at");
    assert.equal(result.expired, true);
    assert.equal(result.after, 1);
  });

  test("keeps entries with unparseable timestamps", () => {
    const entries = [
      { timestamp: "not-a-date", value: "keep-me" },
      { timestamp: new Date().toISOString(), value: "also-keep" },
    ];
    writeJsonlFile(testFile, entries);

    const result = expireJsonlByAge(testFile, 7);
    // All entries kept (invalid timestamp treated as keep)
    assert.equal(result.after, 2);
  });

  test("returns expired: false for non-existent file", () => {
    const result = expireJsonlByAge("/nonexistent.jsonl", 7);
    assert.equal(result.expired, false);
  });
});

describe("archiveRotateJsonl", () => {
  let testFile: string;

  beforeEach(() => {
    testFile = path.join(
      getStateDir(),
      `_test-archive-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`
    );
  });

  afterEach(() => {
    cleanup(testFile);
  });

  test("returns result object with expected shape", () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({ i }));
    writeJsonlFile(testFile, entries);

    const result = archiveRotateJsonl(testFile, 10);
    assert.equal(typeof result.rotated, "boolean");
    assert.equal(typeof result.before, "number");
    assert.equal(typeof result.after, "number");
    assert.equal(typeof result.archived, "number");
  });

  test("rotates and archives entries when count exceeds maxEntries", () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({ i }));
    writeJsonlFile(testFile, entries);

    const result = archiveRotateJsonl(testFile, 10, 6);
    assert.equal(result.rotated, true);
    assert.equal(result.before, 20);
    assert.equal(result.after, 6);
    assert.ok(result.archived >= 0, "archived count should be non-negative");
  });

  test("returns rotated: false when below threshold", () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({ i }));
    writeJsonlFile(testFile, entries);

    const result = archiveRotateJsonl(testFile, 10);
    assert.equal(result.rotated, false);
  });
});
