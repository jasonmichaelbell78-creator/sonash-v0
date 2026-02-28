/**
 * Tests for write-retro-record.ts — validates RetroRecord writing to retros.jsonl.
 *
 * Uses temp directories for file isolation. Node.js built-in test runner.
 */

import assert from "node:assert/strict";
import { describe, test, beforeEach, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Walk up from __dirname until we find package.json
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition -- continue walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { writeRetroRecord } = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/write-retro-record.js")
) as {
  writeRetroRecord: (projectRoot: string, data: Record<string, unknown>) => Record<string, unknown>;
};

// ---- Test helpers -----------------------------------------------------------

let tmpDir: string;

function makeValidRetroData(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "retro-pr-100",
    date: "2026-02-28",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "pr-retro", tool: "write-retro-record.ts" },
    pr: 100,
    top_wins: ["Good test coverage"],
    top_misses: ["Slow CI"],
    process_changes: ["Add caching"],
    score: 7,
    metrics: { total_findings: 5, fix_rate: 0.8, pattern_recurrence: 1 },
    ...overrides,
  };
}

// ---- Tests ------------------------------------------------------------------

describe("writeRetroRecord", () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "retro-test-"));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // cleanup best-effort
    }
  });

  test("writes a valid retro record to retros.jsonl", () => {
    const data = makeValidRetroData();
    const result = writeRetroRecord(tmpDir, data);

    assert.equal(result.id, "retro-pr-100");
    assert.equal(result.pr, 100);

    const filePath = path.join(tmpDir, "data/ecosystem-v2/retros.jsonl");
    assert.ok(fs.existsSync(filePath), "retros.jsonl should be created");

    const content = fs.readFileSync(filePath, "utf8").trim();
    const parsed = JSON.parse(content) as Record<string, unknown>;
    assert.equal(parsed.id, "retro-pr-100");
  });

  test("auto-assigns ID as retro-pr-{N} when no id provided", () => {
    const data = makeValidRetroData({ pr: 42 });
    delete data.id;

    const result = writeRetroRecord(tmpDir, data);

    assert.equal(result.id, "retro-pr-42");
  });

  test("rejects invalid data with ZodError", () => {
    const invalidData = {
      // missing required fields
      pr: 100,
    };

    assert.throws(
      () => writeRetroRecord(tmpDir, invalidData),
      (err: Error) => err.name === "ZodError"
    );

    // File should not exist since write failed
    const filePath = path.join(tmpDir, "data/ecosystem-v2/retros.jsonl");
    assert.ok(!fs.existsSync(filePath), "retros.jsonl should not be created on failure");
  });

  test("rejects invalid score (out of range)", () => {
    const data = makeValidRetroData({ score: 15 });

    assert.throws(
      () => writeRetroRecord(tmpDir, data),
      (err: Error) => err.name === "ZodError"
    );
  });

  test("appends multiple records", () => {
    writeRetroRecord(tmpDir, makeValidRetroData({ id: "retro-pr-1", pr: 1 }));
    writeRetroRecord(tmpDir, makeValidRetroData({ id: "retro-pr-2", pr: 2 }));

    const filePath = path.join(tmpDir, "data/ecosystem-v2/retros.jsonl");
    const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
    assert.equal(lines.length, 2, "should have 2 records");

    const first = JSON.parse(lines[0]) as Record<string, unknown>;
    const second = JSON.parse(lines[1]) as Record<string, unknown>;
    assert.equal(first.id, "retro-pr-1");
    assert.equal(second.id, "retro-pr-2");
  });

  test("creates directory structure if missing", () => {
    const data = makeValidRetroData();
    writeRetroRecord(tmpDir, data);

    const dirPath = path.join(tmpDir, "data/ecosystem-v2");
    assert.ok(fs.existsSync(dirPath), "data/ecosystem-v2 directory should be created");
  });
});
