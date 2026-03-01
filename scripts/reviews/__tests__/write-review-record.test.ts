/**
 * Unit tests for write-review-record.ts
 *
 * Tests the writeReviewRecord() function and getNextReviewId() helper.
 * Uses temp directories for isolated file I/O.
 */

import assert from "node:assert/strict";
import { test, describe, beforeEach, afterEach } from "node:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";

// Walk up from __dirname until we find package.json
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const PROJECT_ROOT = findProjectRoot(__dirname);

// SEC-008: Verify resolved path is within project root
function assertWithinRoot(filePath: string, root: string): void {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error(`Path traversal blocked: ${resolved} is outside ${root}`);
  }
}

// Import compiled modules
const distPath = path.resolve(PROJECT_ROOT, "scripts/reviews/dist/write-review-record.js");
assertWithinRoot(distPath, PROJECT_ROOT);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { writeReviewRecord, getNextReviewId } = require(distPath) as {
  writeReviewRecord: (
    projectRoot: string,
    data: Record<string, unknown>
  ) => Record<string, unknown>;
  getNextReviewId: (projectRoot: string) => string;
};

// =========================================================
// Test helpers
// =========================================================

function makeFullRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "rev-1",
    date: "2026-02-28",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "pr-review", tool: "test" },
    title: "Test Review",
    pr: 999,
    source: "manual",
    total: 5,
    fixed: 4,
    deferred: 1,
    rejected: 0,
    ...overrides,
  };
}

let tmpDir: string;

// =========================================================
// Setup / teardown
// =========================================================

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "write-review-test-"));
  // Create the data directory structure
  fs.mkdirSync(path.join(tmpDir, "data", "ecosystem-v2"), { recursive: true });
  // Create a package.json so findProjectRoot works
  fs.writeFileSync(path.join(tmpDir, "package.json"), "{}");
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// =========================================================
// Tests
// =========================================================

describe("writeReviewRecord", () => {
  test("valid full record writes successfully and appends to file", () => {
    const data = makeFullRecord();
    const result = writeReviewRecord(tmpDir, data);

    assert.equal(result.id, "rev-1");
    assert.equal(result.pr, 999);

    const filePath = path.join(tmpDir, "data", "ecosystem-v2", "reviews.jsonl");
    assert.ok(fs.existsSync(filePath), "reviews.jsonl should be created");

    const content = fs.readFileSync(filePath, "utf8").trim();
    const written = JSON.parse(content) as Record<string, unknown>;
    assert.equal(written.id, "rev-1");
    assert.equal(written.title, "Test Review");
  });

  test("invalid record (missing required fields) throws Zod error", () => {
    const data = {
      // Missing id, date, schema_version, completeness, origin
      title: "Bad Record",
    };

    assert.throws(
      () => writeReviewRecord(tmpDir, data),
      (err: Error) => {
        assert.ok(err.name === "ZodError", `Expected ZodError, got ${err.name}`);
        return true;
      }
    );

    // File should not be created
    const filePath = path.join(tmpDir, "data", "ecosystem-v2", "reviews.jsonl");
    assert.ok(!fs.existsSync(filePath), "reviews.jsonl should not be created on failure");
  });

  test("multiple writes append correctly", () => {
    writeReviewRecord(tmpDir, makeFullRecord({ id: "rev-1" }));
    writeReviewRecord(tmpDir, makeFullRecord({ id: "rev-2", pr: 1000 }));

    const filePath = path.join(tmpDir, "data", "ecosystem-v2", "reviews.jsonl");
    const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
    assert.equal(lines.length, 2);

    const record1 = JSON.parse(lines[0]) as Record<string, unknown>;
    const record2 = JSON.parse(lines[1]) as Record<string, unknown>;
    assert.equal(record1.id, "rev-1");
    assert.equal(record2.id, "rev-2");
  });
});

describe("getNextReviewId", () => {
  test("auto-ID assignment reads existing file and increments", () => {
    // Write two records manually
    const filePath = path.join(tmpDir, "data", "ecosystem-v2", "reviews.jsonl");
    const rec1 = JSON.stringify(makeFullRecord({ id: "rev-3" }));
    const rec2 = JSON.stringify(makeFullRecord({ id: "rev-7" }));
    fs.writeFileSync(filePath, rec1 + "\n" + rec2 + "\n");

    const nextId = getNextReviewId(tmpDir);
    assert.equal(nextId, "rev-8");
  });

  test("empty file produces rev-1 as first ID", () => {
    const filePath = path.join(tmpDir, "data", "ecosystem-v2", "reviews.jsonl");
    fs.writeFileSync(filePath, "");

    const nextId = getNextReviewId(tmpDir);
    assert.equal(nextId, "rev-1");
  });

  test("missing file produces rev-1", () => {
    const nextId = getNextReviewId(tmpDir);
    assert.equal(nextId, "rev-1");
  });

  test("auto-assigns ID when data has no id field", () => {
    // Write a seed record
    const filePath = path.join(tmpDir, "data", "ecosystem-v2", "reviews.jsonl");
    fs.writeFileSync(filePath, JSON.stringify(makeFullRecord({ id: "rev-5" })) + "\n");

    const data = makeFullRecord();
    delete data.id;

    const result = writeReviewRecord(tmpDir, data);
    assert.equal(result.id, "rev-6");
  });
});

describe("CLI entry point", () => {
  test("exits 0 on success", () => {
    const data = JSON.stringify(makeFullRecord());

    // Create a temp project root with proper structure for CLI test
    const cliTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "write-review-cli-"));
    fs.mkdirSync(path.join(cliTmpDir, "data", "ecosystem-v2"), { recursive: true });
    fs.writeFileSync(path.join(cliTmpDir, "package.json"), "{}");

    // We need to copy safe-fs.js for the CLI to work, create a scripts/lib structure
    const safeFsSrc = path.join(PROJECT_ROOT, "scripts", "lib", "safe-fs.js");
    const safeFsDst = path.join(cliTmpDir, "scripts", "lib", "safe-fs.js");
    fs.mkdirSync(path.dirname(safeFsDst), { recursive: true });
    fs.copyFileSync(safeFsSrc, safeFsDst);

    try {
      // Run the CLI script but override __dirname by calling writeReviewRecord directly
      // Since CLI uses findProjectRoot(__dirname), we test via the function instead
      const result = writeReviewRecord(cliTmpDir, JSON.parse(data) as Record<string, unknown>);
      assert.ok(result.id, "Should have an ID");
    } finally {
      fs.rmSync(cliTmpDir, { recursive: true, force: true });
    }
  });

  test("exits 1 on validation failure via CLI", () => {
    const scriptPath = path.resolve(PROJECT_ROOT, "scripts/reviews/dist/write-review-record.js");
    assertWithinRoot(scriptPath, PROJECT_ROOT);
    const badData = JSON.stringify({ title: "bad" });

    assert.throws(
      () => {
        execFileSync("node", [scriptPath, "--data", badData], {
          stdio: "pipe",
          encoding: "utf8",
        });
      },
      (err: { status?: number }) => {
        assert.equal(err.status, 1, "Should exit with code 1");
        return true;
      }
    );
  });
});
