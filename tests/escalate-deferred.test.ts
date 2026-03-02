/**
 * Escalate Deferred Test Suite
 *
 * Tests for scripts/debt/escalate-deferred.js:
 * - Threshold filtering (defer_count)
 * - Loop prevention (promoted_to_debt flag)
 * - Status filtering (only "open" items)
 * - GATE-07 auto-classification
 * - Dry-run mode
 * - extractPrNumber utility
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { test, describe, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// CJS module — use require with eslint-disable
const scriptPath = path.resolve(__dirname, "../../scripts/debt/escalate-deferred.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { escalateDeferred, classifyCategory, extractPrNumber } = require(scriptPath) as {
  escalateDeferred: (options?: {
    dryRun?: boolean;
    threshold?: number;
    deferredFilePath?: string;
    intakeScriptPath?: string;
    execFn?: (...args: unknown[]) => void;
  }) => { escalated: number; skipped: number; items: unknown[] };
  classifyCategory: (finding: string) => string;
  extractPrNumber: (reviewId: string | null) => number | null;
};

/** Helper: create a temporary JSONL file with deferred items. */
function createTempDeferredFile(items: Record<string, unknown>[]) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "escalate-test-"));
  const filePath = path.join(tmpDir, "deferred-items.jsonl");
  const content = items.map((item) => JSON.stringify(item)).join("\n") + "\n";
  fs.writeFileSync(filePath, content, "utf8");
  return { filePath, tmpDir };
}

/** Helper: clean up temp directory */
function cleanupTemp(tmpDir: string) {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup failures
  }
}

/** Build a deferred item with defaults */
function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "rev-100-deferred-1",
    date: "2026-03-01",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "pr-review", tool: "write-deferred-items.ts" },
    review_id: "rev-100",
    finding: "Some code quality issue",
    reason: null,
    severity: "S2",
    status: "open",
    defer_count: 1,
    promoted_to_debt: false,
    ...overrides,
  };
}

describe("escalateDeferred", () => {
  let tmpDir: string | null = null;
  let filePath: string | null = null;

  afterEach(() => {
    if (tmpDir) cleanupTemp(tmpDir);
    tmpDir = null;
    filePath = null;
  });

  test("does NOT escalate items with defer_count < 2", () => {
    const items = [makeItem({ defer_count: 1 })];
    ({ filePath, tmpDir } = createTempDeferredFile(items));

    const execCalls: unknown[][] = [];
    const mockExec = (...args: unknown[]) => execCalls.push(args);

    const result = escalateDeferred({
      dryRun: false,
      threshold: 2,
      deferredFilePath: filePath!,
      execFn: mockExec,
    });

    assert.equal(result.escalated, 0);
    assert.equal(execCalls.length, 0);
  });

  test("escalates items with defer_count >= 2 and status open", () => {
    const items = [makeItem({ defer_count: 2, status: "open", promoted_to_debt: false })];
    ({ filePath, tmpDir } = createTempDeferredFile(items));

    const execCalls: unknown[][] = [];
    const mockExec = (...args: unknown[]) => execCalls.push(args);

    const result = escalateDeferred({
      dryRun: false,
      threshold: 2,
      deferredFilePath: filePath!,
      execFn: mockExec,
    });

    assert.equal(result.escalated, 1);
    assert.equal(execCalls.length, 1);

    // Verify intake was called with correct args
    const callArgs = execCalls[0][1] as string[];
    assert.ok(callArgs.includes("--severity"));
    assert.ok(callArgs.includes("S1"));
    assert.ok(callArgs.includes("--pr"));
    assert.ok(callArgs.includes("100"));

    // Verify deferred item was updated in file
    const updatedContent = fs.readFileSync(filePath!, "utf8");
    const updated = JSON.parse(updatedContent.split("\n").find(Boolean)!);
    assert.equal(updated.status, "promoted");
    assert.equal(updated.promoted_to_debt, true);
  });

  test("does NOT re-promote items with promoted_to_debt: true (loop prevention)", () => {
    const items = [makeItem({ defer_count: 3, status: "open", promoted_to_debt: true })];
    ({ filePath, tmpDir } = createTempDeferredFile(items));

    const execCalls: unknown[][] = [];
    const mockExec = (...args: unknown[]) => execCalls.push(args);

    const result = escalateDeferred({
      dryRun: false,
      threshold: 2,
      deferredFilePath: filePath!,
      execFn: mockExec,
    });

    assert.equal(result.escalated, 0);
    assert.equal(execCalls.length, 0);
  });

  test("does NOT escalate items with status !== open", () => {
    const items = [
      makeItem({ defer_count: 3, status: "resolved", promoted_to_debt: false }),
      makeItem({
        id: "rev-101-deferred-1",
        review_id: "rev-101",
        defer_count: 3,
        status: "wont-fix",
        promoted_to_debt: false,
      }),
    ];
    ({ filePath, tmpDir } = createTempDeferredFile(items));

    const execCalls: unknown[][] = [];
    const mockExec = (...args: unknown[]) => execCalls.push(args);

    const result = escalateDeferred({
      dryRun: false,
      threshold: 2,
      deferredFilePath: filePath!,
      execFn: mockExec,
    });

    assert.equal(result.escalated, 0);
    assert.equal(execCalls.length, 0);
  });

  test("--threshold 3 only escalates items with defer_count >= 3", () => {
    const items = [
      makeItem({ id: "rev-100-deferred-1", defer_count: 2 }),
      makeItem({ id: "rev-101-deferred-1", review_id: "rev-101", defer_count: 3 }),
    ];
    ({ filePath, tmpDir } = createTempDeferredFile(items));

    const execCalls: unknown[][] = [];
    const mockExec = (...args: unknown[]) => execCalls.push(args);

    const result = escalateDeferred({
      dryRun: false,
      threshold: 3,
      deferredFilePath: filePath!,
      execFn: mockExec,
    });

    assert.equal(result.escalated, 1);
    assert.equal(execCalls.length, 1);
  });

  test("--dry-run does not modify files or call intake", () => {
    const items = [makeItem({ defer_count: 5, status: "open", promoted_to_debt: false })];
    ({ filePath, tmpDir } = createTempDeferredFile(items));

    const originalContent = fs.readFileSync(filePath!, "utf8");

    const execCalls: unknown[][] = [];
    const mockExec = (...args: unknown[]) => execCalls.push(args);

    const result = escalateDeferred({
      dryRun: true,
      threshold: 2,
      deferredFilePath: filePath!,
      execFn: mockExec,
    });

    assert.equal(result.escalated, 1);
    assert.equal(execCalls.length, 0, "execFn should not be called in dry-run");

    // File should be unchanged
    const afterContent = fs.readFileSync(filePath!, "utf8");
    assert.equal(afterContent, originalContent);
  });
});

describe("classifyCategory (GATE-07 auto-classification)", () => {
  test("classifies security keywords to 'security'", () => {
    assert.equal(classifyCategory("Fix XSS vulnerability in form"), "security");
    assert.equal(classifyCategory("Add auth token validation"), "security");
    assert.equal(classifyCategory("Prevent SQL injection"), "security");
    assert.equal(classifyCategory("Security audit needed"), "security");
  });

  test("classifies testing keywords to 'testing'", () => {
    assert.equal(classifyCategory("Add test for edge case"), "testing");
    assert.equal(classifyCategory("Improve coverage for utils"), "testing");
    assert.equal(classifyCategory("Missing assertion in test"), "testing");
  });

  test("classifies performance keywords to 'performance'", () => {
    assert.equal(classifyCategory("Fix perf regression"), "performance");
    assert.equal(classifyCategory("Reduce latency on API call"), "performance");
    assert.equal(classifyCategory("Memory leak in component"), "performance");
  });

  test("defaults to 'code-quality' for unrecognized findings", () => {
    assert.equal(classifyCategory("Refactor duplicated logic"), "code-quality");
    assert.equal(classifyCategory("withLock atomic locking"), "code-quality");
    assert.equal(classifyCategory(""), "code-quality");
  });
});

describe("extractPrNumber", () => {
  test("extracts number from rev-NNN format", () => {
    assert.equal(extractPrNumber("rev-419"), 419);
    assert.equal(extractPrNumber("rev-1"), 1);
  });

  test("handles rev-NNN-deferred-N format", () => {
    assert.equal(extractPrNumber("rev-419-deferred-1"), 419);
  });

  test("returns null for non-matching formats", () => {
    assert.equal(extractPrNumber("abc-123"), null);
    assert.equal(extractPrNumber(""), null);
    assert.equal(extractPrNumber(null), null);
  });
});
