/**
 * Tests for write-deferred-items.ts — validates DeferredItemRecord creation.
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
const { createDeferredItems } = require(
  path.resolve(PROJECT_ROOT, "scripts/reviews/dist/write-deferred-items.js")
) as {
  createDeferredItems: (
    projectRoot: string,
    reviewId: string,
    items: Array<{ finding: string; reason?: string; severity?: string }>,
    date: string
  ) => Array<Record<string, unknown>>;
};

// ---- Test helpers -----------------------------------------------------------

let tmpDir: string;

// ---- Tests ------------------------------------------------------------------

describe("createDeferredItems", () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "deferred-test-"));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // cleanup best-effort
    }
  });

  test("creates correct number of deferred items", () => {
    const items = [
      { finding: "Missing error handling in auth" },
      { finding: "No input validation on POST endpoint" },
      { finding: "Unused import in utils" },
    ];

    const results = createDeferredItems(tmpDir, "rev-100", items, "2026-02-28");

    assert.equal(results.length, 3, "should create 3 deferred items");
  });

  test("IDs follow {reviewId}-deferred-{N} pattern", () => {
    const items = [{ finding: "Finding A" }, { finding: "Finding B" }];

    const results = createDeferredItems(tmpDir, "rev-42", items, "2026-02-28");

    assert.equal(results[0].id, "rev-42-deferred-1");
    assert.equal(results[1].id, "rev-42-deferred-2");
  });

  test("creates deferred-items.jsonl if file does not exist", () => {
    const filePath = path.join(tmpDir, "data/ecosystem-v2/deferred-items.jsonl");
    assert.ok(!fs.existsSync(filePath), "file should not exist initially");

    createDeferredItems(tmpDir, "rev-1", [{ finding: "Test finding" }], "2026-02-28");

    assert.ok(fs.existsSync(filePath), "deferred-items.jsonl should be created");
  });

  test("validates all fields correctly", () => {
    const items = [{ finding: "Missing auth", reason: "Low priority", severity: "S2" }];

    const results = createDeferredItems(tmpDir, "rev-50", items, "2026-02-28");
    const record = results[0];

    assert.equal(record.id, "rev-50-deferred-1");
    assert.equal(record.date, "2026-02-28");
    assert.equal(record.schema_version, 1);
    assert.equal(record.completeness, "full");
    assert.equal(record.review_id, "rev-50");
    assert.equal(record.finding, "Missing auth");
    assert.equal(record.reason, "Low priority");
    assert.equal(record.severity, "S2");
    assert.equal(record.status, "open");
    assert.equal(record.defer_count, 1);
    assert.equal(record.promoted_to_debt, false);
  });

  test("empty items array produces no records", () => {
    const results = createDeferredItems(tmpDir, "rev-99", [], "2026-02-28");

    assert.equal(results.length, 0, "should return empty array");

    const filePath = path.join(tmpDir, "data/ecosystem-v2/deferred-items.jsonl");
    assert.ok(!fs.existsSync(filePath), "file should not be created for empty items");
  });

  test("appends to existing file", () => {
    createDeferredItems(tmpDir, "rev-1", [{ finding: "First batch" }], "2026-02-28");
    createDeferredItems(tmpDir, "rev-2", [{ finding: "Second batch" }], "2026-02-28");

    const filePath = path.join(tmpDir, "data/ecosystem-v2/deferred-items.jsonl");
    const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
    assert.equal(lines.length, 2, "should have 2 records");
  });

  test("sets origin with type pr-review and tool name", () => {
    const results = createDeferredItems(
      tmpDir,
      "rev-10",
      [{ finding: "Origin test" }],
      "2026-02-28"
    );

    const origin = results[0].origin as { type: string; tool: string };
    assert.equal(origin.type, "pr-review");
    assert.equal(origin.tool, "write-deferred-items.ts");
  });

  test("rejects invalid severity value", () => {
    assert.throws(
      () =>
        createDeferredItems(
          tmpDir,
          "rev-bad",
          [{ finding: "Bad severity", severity: "critical" }],
          "2026-02-28"
        ),
      (err: Error) => err.name === "ZodError"
    );
  });
});
