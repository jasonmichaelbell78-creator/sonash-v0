/**
 * Tests for read-jsonl.ts -- validated JSONL reader.
 *
 * Verifies that readValidatedJsonl() returns valid records and warnings,
 * handles missing files gracefully, and never throws.
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
const { readValidatedJsonl } = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/read-jsonl.js")
) as {
  readValidatedJsonl: (
    filePath: string,
    schema: {
      safeParse: (v: unknown) => { success: boolean; data?: unknown; error?: { message: string } };
    },
    options?: { quiet?: boolean }
  ) => { valid: unknown[]; warnings: string[] };
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ReviewRecord } = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/lib/schemas/index.js")
) as {
  ReviewRecord: {
    safeParse: (v: unknown) => { success: boolean; data?: unknown; error?: { message: string } };
  };
};

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "read-jsonl-test-"));
  tempDirs.push(dir);
  return dir;
}

function validReviewJson() {
  return JSON.stringify({
    id: "rev-001",
    date: "2026-02-28",
    schema_version: 1,
    completeness: "stub",
    completeness_missing: [],
    origin: { type: "pr-review", pr: 1 },
  });
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

describe("readValidatedJsonl", () => {
  test("returns all valid records with empty warnings", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "reviews.jsonl");
    const line1 = validReviewJson();
    const line2 = JSON.stringify({
      id: "rev-002",
      date: "2026-02-28",
      schema_version: 1,
      completeness: "stub",
      completeness_missing: [],
      origin: { type: "pr-review", pr: 2 },
    });
    fs.writeFileSync(filePath, line1 + "\n" + line2 + "\n");

    const result = readValidatedJsonl(filePath, ReviewRecord, { quiet: true });

    assert.equal(result.valid.length, 2);
    assert.equal(result.warnings.length, 0);
  });

  test("returns malformed record in warnings, valid records in valid", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "reviews.jsonl");
    const goodLine = validReviewJson();
    const badLine = JSON.stringify({ id: "bad", date: "not-a-date" });
    fs.writeFileSync(filePath, goodLine + "\n" + badLine + "\n");

    const result = readValidatedJsonl(filePath, ReviewRecord, { quiet: true });

    assert.equal(result.valid.length, 1);
    assert.equal(result.warnings.length, 1);
    assert.ok(result.warnings[0].includes("bad"));
  });

  test("returns empty results for missing file", () => {
    const result = readValidatedJsonl(
      path.join(os.tmpdir(), "nonexistent-file-" + Date.now() + ".jsonl"),
      ReviewRecord,
      { quiet: true }
    );

    assert.equal(result.valid.length, 0);
    assert.equal(result.warnings.length, 0);
  });

  test("quiet option suppresses console.warn", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "reviews.jsonl");
    const badLine = JSON.stringify({ id: "bad", date: "x" });
    fs.writeFileSync(filePath, badLine + "\n");

    // Capture console.warn calls
    const warnCalls: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnCalls.push(args.join(" "));
    };

    try {
      readValidatedJsonl(filePath, ReviewRecord, { quiet: true });
      assert.equal(warnCalls.length, 0, "quiet mode should suppress console.warn");
    } finally {
      console.warn = originalWarn;
    }
  });

  test("never throws even with completely garbage input", () => {
    const tmpDir = createTempDir();
    const filePath = path.join(tmpDir, "reviews.jsonl");
    // Mix of garbage: not-JSON lines, empty objects, arrays
    fs.writeFileSync(filePath, "this is not json\n{}\n[1,2,3]\n" + validReviewJson() + "\n");

    // Should not throw
    const result = readValidatedJsonl(filePath, ReviewRecord, { quiet: true });

    // The valid review line should be parsed; the rest are warnings or skipped
    assert.ok(result.valid.length >= 1, "Should have at least the valid record");
    assert.ok(result.warnings.length >= 1, "Should have warnings for invalid records");
  });
});
