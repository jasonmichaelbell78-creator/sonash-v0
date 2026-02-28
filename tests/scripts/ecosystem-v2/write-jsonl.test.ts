/**
 * Tests for write-jsonl.ts -- validated JSONL append utility.
 *
 * Verifies that appendRecord() validates via Zod schema before writing,
 * rejects invalid records, creates parent directories, and produces
 * round-trippable JSON lines.
 */

import assert from "node:assert/strict";
import { test, describe, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Walk up from __dirname until we find package.json (works from both source and dist-tests)
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}
const PROJECT_ROOT = findProjectRoot(__dirname);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { appendRecord } = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/write-jsonl.js")
) as {
  appendRecord: (
    filePath: string,
    record: unknown,
    schema: { parse: (v: unknown) => unknown }
  ) => void;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ReviewRecord } = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/schemas/index.js")
) as {
  ReviewRecord: { parse: (v: unknown) => unknown };
};

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "write-jsonl-test-"));
  tempDirs.push(dir);
  return dir;
}

function validReview() {
  return {
    id: "rev-001",
    date: "2026-02-28",
    schema_version: 1,
    completeness: "stub",
    completeness_missing: [],
    origin: { type: "pr-review", pr: 1 },
  };
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // best effort
      }
    }
  }
});

describe("appendRecord", () => {
  test("writes valid record as JSON line to file", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "reviews.jsonl");
    const record = validReview();

    appendRecord(filePath, record, ReviewRecord);

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.trim().split("\n");
    assert.equal(lines.length, 1);
    const parsed = JSON.parse(lines[0]);
    assert.equal(parsed.id, "rev-001");
  });

  test("throws ZodError for invalid record and does NOT write to file", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "reviews.jsonl");
    const invalidRecord = { id: "bad", date: "not-a-date" };

    assert.throws(() => appendRecord(filePath, invalidRecord, ReviewRecord), {
      name: "ZodError",
    });

    // File should not exist since validation failed before write
    assert.equal(fs.existsSync(filePath), false);
  });

  test("creates parent directory if missing", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "nested", "deep", "reviews.jsonl");

    appendRecord(filePath, validReview(), ReviewRecord);

    assert.equal(fs.existsSync(filePath), true);
    const content = fs.readFileSync(filePath, "utf8").trim();
    assert.ok(content.length > 0);
  });

  test("multiple calls produce multiple lines", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "reviews.jsonl");

    appendRecord(filePath, { ...validReview(), id: "rev-001" }, ReviewRecord);
    appendRecord(filePath, { ...validReview(), id: "rev-002" }, ReviewRecord);
    appendRecord(filePath, { ...validReview(), id: "rev-003" }, ReviewRecord);

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.trim().split("\n");
    assert.equal(lines.length, 3);
    assert.equal(JSON.parse(lines[0]).id, "rev-001");
    assert.equal(JSON.parse(lines[1]).id, "rev-002");
    assert.equal(JSON.parse(lines[2]).id, "rev-003");
  });

  test("round-trip: written JSON can be parsed back and matches original", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "reviews.jsonl");
    const record = validReview();

    appendRecord(filePath, record, ReviewRecord);

    const content = fs.readFileSync(filePath, "utf8").trim();
    const parsed = JSON.parse(content);

    // All original fields should match
    assert.equal(parsed.id, record.id);
    assert.equal(parsed.date, record.date);
    assert.equal(parsed.schema_version, record.schema_version);
    assert.equal(parsed.completeness, record.completeness);
    assert.deepEqual(parsed.origin, record.origin);
  });
});
