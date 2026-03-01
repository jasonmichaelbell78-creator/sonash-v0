const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const {
  escalateDeferred,
  classifyCategory,
  extractPrNumber,
} = require("../scripts/debt/escalate-deferred");

/**
 * Helper: create a temporary JSONL file with deferred items.
 * Returns the file path. Caller must clean up.
 */
function createTempDeferredFile(items) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "escalate-test-"));
  const filePath = path.join(tmpDir, "deferred-items.jsonl");
  const content = items.map((item) => JSON.stringify(item)).join("\n") + "\n";
  fs.writeFileSync(filePath, content, "utf8");
  return { filePath, tmpDir };
}

/** Helper: clean up temp directory */
function cleanupTemp(tmpDir) {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup failures
  }
}

/** Build a deferred item with defaults */
function makeItem(overrides = {}) {
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
  let tmpDir;
  let filePath;

  afterEach(() => {
    if (tmpDir) cleanupTemp(tmpDir);
    tmpDir = null;
    filePath = null;
  });

  it("does NOT escalate items with defer_count < 2", () => {
    const items = [makeItem({ defer_count: 1 })];
    ({ filePath, tmpDir } = createTempDeferredFile(items));

    const execCalls = [];
    const mockExec = (...args) => execCalls.push(args);

    const result = escalateDeferred({
      dryRun: false,
      threshold: 2,
      deferredFilePath: filePath,
      execFn: mockExec,
    });

    assert.equal(result.escalated, 0);
    assert.equal(execCalls.length, 0);
  });

  it("escalates items with defer_count >= 2 and status open", () => {
    const items = [makeItem({ defer_count: 2, status: "open", promoted_to_debt: false })];
    ({ filePath, tmpDir } = createTempDeferredFile(items));

    const execCalls = [];
    const mockExec = (...args) => execCalls.push(args);

    const result = escalateDeferred({
      dryRun: false,
      threshold: 2,
      deferredFilePath: filePath,
      execFn: mockExec,
    });

    assert.equal(result.escalated, 1);
    assert.equal(execCalls.length, 1);

    // Verify intake was called with correct args
    const callArgs = execCalls[0][1];
    assert.ok(callArgs.includes("--severity"));
    assert.ok(callArgs.includes("S1"));
    assert.ok(callArgs.includes("--pr"));
    assert.ok(callArgs.includes("100"));

    // Verify deferred item was updated
    const updated = JSON.parse(fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean)[0]);
    assert.equal(updated.status, "promoted");
    assert.equal(updated.promoted_to_debt, true);
  });

  it("does NOT re-promote items with promoted_to_debt: true (loop prevention)", () => {
    const items = [makeItem({ defer_count: 3, status: "open", promoted_to_debt: true })];
    ({ filePath, tmpDir } = createTempDeferredFile(items));

    const execCalls = [];
    const mockExec = (...args) => execCalls.push(args);

    const result = escalateDeferred({
      dryRun: false,
      threshold: 2,
      deferredFilePath: filePath,
      execFn: mockExec,
    });

    assert.equal(result.escalated, 0);
    assert.equal(execCalls.length, 0);
  });

  it("does NOT escalate items with status !== open", () => {
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

    const execCalls = [];
    const mockExec = (...args) => execCalls.push(args);

    const result = escalateDeferred({
      dryRun: false,
      threshold: 2,
      deferredFilePath: filePath,
      execFn: mockExec,
    });

    assert.equal(result.escalated, 0);
    assert.equal(execCalls.length, 0);
  });

  it("--threshold 3 only escalates items with defer_count >= 3", () => {
    const items = [
      makeItem({ id: "rev-100-deferred-1", defer_count: 2 }),
      makeItem({ id: "rev-101-deferred-1", review_id: "rev-101", defer_count: 3 }),
    ];
    ({ filePath, tmpDir } = createTempDeferredFile(items));

    const execCalls = [];
    const mockExec = (...args) => execCalls.push(args);

    const result = escalateDeferred({
      dryRun: false,
      threshold: 3,
      deferredFilePath: filePath,
      execFn: mockExec,
    });

    assert.equal(result.escalated, 1);
    assert.equal(execCalls.length, 1);
  });

  it("--dry-run does not modify files or call intake", () => {
    const items = [makeItem({ defer_count: 5, status: "open", promoted_to_debt: false })];
    ({ filePath, tmpDir } = createTempDeferredFile(items));

    const originalContent = fs.readFileSync(filePath, "utf8");

    const execCalls = [];
    const mockExec = (...args) => execCalls.push(args);

    const result = escalateDeferred({
      dryRun: true,
      threshold: 2,
      deferredFilePath: filePath,
      execFn: mockExec,
    });

    assert.equal(result.escalated, 1);
    assert.equal(execCalls.length, 0, "execFn should not be called in dry-run");

    // File should be unchanged
    const afterContent = fs.readFileSync(filePath, "utf8");
    assert.equal(afterContent, originalContent);
  });
});

describe("classifyCategory (GATE-07 auto-classification)", () => {
  it("classifies security keywords to 'security'", () => {
    assert.equal(classifyCategory("Fix XSS vulnerability in form"), "security");
    assert.equal(classifyCategory("Add auth token validation"), "security");
    assert.equal(classifyCategory("Prevent SQL injection"), "security");
    assert.equal(classifyCategory("Security audit needed"), "security");
  });

  it("classifies testing keywords to 'testing'", () => {
    assert.equal(classifyCategory("Add test for edge case"), "testing");
    assert.equal(classifyCategory("Improve coverage for utils"), "testing");
    assert.equal(classifyCategory("Missing assertion in test"), "testing");
  });

  it("classifies performance keywords to 'performance'", () => {
    assert.equal(classifyCategory("Fix perf regression"), "performance");
    assert.equal(classifyCategory("Reduce latency on API call"), "performance");
    assert.equal(classifyCategory("Memory leak in component"), "performance");
  });

  it("defaults to 'code-quality' for unrecognized findings", () => {
    assert.equal(classifyCategory("Refactor duplicated logic"), "code-quality");
    assert.equal(classifyCategory("withLock atomic locking"), "code-quality");
    assert.equal(classifyCategory(""), "code-quality");
  });
});

describe("extractPrNumber", () => {
  it("extracts number from rev-NNN format", () => {
    assert.equal(extractPrNumber("rev-419"), 419);
    assert.equal(extractPrNumber("rev-1"), 1);
  });

  it("handles rev-NNN-deferred-N format", () => {
    assert.equal(extractPrNumber("rev-419-deferred-1"), 419);
  });

  it("returns null for non-matching formats", () => {
    assert.equal(extractPrNumber("abc-123"), null);
    assert.equal(extractPrNumber(""), null);
    assert.equal(extractPrNumber(null), null);
  });
});
