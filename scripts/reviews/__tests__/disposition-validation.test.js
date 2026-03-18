/**
 * Functional test: disposition integrity validation
 *
 * Verifies that:
 * 1. validateDispositions() in review-lifecycle.js flags records with
 *    total > 0 but fixed + deferred + rejected == 0
 * 2. writeReviewRecord() rejects writes that violate this rule
 * 3. Valid records are accepted
 *
 * Purpose: Regression guard for retro action item #14.
 * Version History:
 *   v1.0 2026-03-18 - Initial implementation
 */

"use strict";

const assert = require("node:assert/strict");
const { describe, test, beforeEach, afterEach } = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// ── Locate project root ──────────────────────────────────────────────────

function findProjectRoot(startDir) {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const ROOT = findProjectRoot(__dirname);

// ── Import modules ────────────────────────────────────────────────────────

// review-lifecycle.js validateDispositions
const { validateDispositions } = require(path.join(ROOT, "scripts", "review-lifecycle.js"));

// write-review-record.ts (compiled)
const distPath = path.join(ROOT, "scripts", "reviews", "dist", "write-review-record.js");

// SEC-008: Verify resolved path is within project root
function assertWithinRoot(filePath, root) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error(`Path traversal blocked: ${resolved} is outside ${root}`);
  }
}
assertWithinRoot(distPath, ROOT);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { writeReviewRecord, validateDispositionIntegrity } = require(distPath);

// ── Test helpers ──────────────────────────────────────────────────────────

function makeFullRecord(overrides = {}) {
  return {
    id: "rev-1",
    date: "2026-03-18",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    origin: { type: "pr-review", tool: "test" },
    title: "Test Review",
    pr: 999,
    source: "manual",
    total: 5,
    fixed: 3,
    deferred: 1,
    rejected: 1,
    ...overrides,
  };
}

let tmpDir;

// ── Tests: validateDispositions (review-lifecycle.js) ─────────────────────

describe("validateDispositions from review-lifecycle.js (Item #14)", () => {
  test("flags record with total=5 but all dispositions zero", () => {
    const records = [
      { id: "rev-1", total: 5, fixed: 0, deferred: 0, rejected: 0 },
    ];

    const result = validateDispositions(records);

    assert.equal(result.violations.length, 1, "Should find 1 violation");
    assert.equal(result.violations[0].id, "rev-1");
    assert.equal(result.violations[0].total, 5);
  });

  test("does not flag record with total=5 and valid dispositions", () => {
    const records = [
      { id: "rev-1", total: 5, fixed: 3, deferred: 1, rejected: 1 },
    ];

    const result = validateDispositions(records);
    assert.equal(result.violations.length, 0, "Should find no violations");
  });

  test("does not flag record with total=0", () => {
    const records = [
      { id: "rev-1", total: 0, fixed: 0, deferred: 0, rejected: 0 },
    ];

    const result = validateDispositions(records);
    assert.equal(result.violations.length, 0, "total=0 is not a violation");
  });

  test("does not flag record with total missing (undefined)", () => {
    const records = [
      { id: "rev-1", fixed: 0, deferred: 0, rejected: 0 },
    ];

    const result = validateDispositions(records);
    assert.equal(result.violations.length, 0, "Missing total is not a violation");
  });

  test("flags record where only total is set, dispositions are undefined", () => {
    const records = [
      { id: "rev-1", total: 10 },
    ];

    const result = validateDispositions(records);
    assert.equal(result.violations.length, 1, "Missing dispositions with total > 0 is a violation");
    assert.equal(result.violations[0].total, 10);
  });

  test("handles mixed valid and invalid records", () => {
    const records = [
      { id: "rev-1", total: 5, fixed: 5, deferred: 0, rejected: 0 },
      { id: "rev-2", total: 3, fixed: 0, deferred: 0, rejected: 0 },
      { id: "rev-3", total: 0, fixed: 0, deferred: 0, rejected: 0 },
      { id: "rev-4", total: 10, fixed: 0, deferred: 0, rejected: 0 },
      { id: "rev-5", total: 7, fixed: 2, deferred: 3, rejected: 2 },
    ];

    const result = validateDispositions(records);
    assert.equal(result.violations.length, 2, "Should flag rev-2 and rev-4");

    const violationIds = result.violations.map((v) => v.id);
    assert.ok(violationIds.includes("rev-2"));
    assert.ok(violationIds.includes("rev-4"));
  });

  test("handles null and invalid records gracefully", () => {
    const records = [null, undefined, "not-an-object", { id: "valid", total: 0 }];

    const result = validateDispositions(records);
    assert.equal(result.violations.length, 0, "Should handle nulls gracefully");
  });

  test("counts deferred-only as valid", () => {
    const records = [
      { id: "rev-1", total: 5, fixed: 0, deferred: 5, rejected: 0 },
    ];

    const result = validateDispositions(records);
    assert.equal(result.violations.length, 0, "Deferred-only is valid");
  });

  test("counts rejected-only as valid", () => {
    const records = [
      { id: "rev-1", total: 5, fixed: 0, deferred: 0, rejected: 5 },
    ];

    const result = validateDispositions(records);
    assert.equal(result.violations.length, 0, "Rejected-only is valid");
  });
});

// ── Tests: writeReviewRecord disposition guard ────────────────────────────

describe("writeReviewRecord disposition guard (Item #14)", () => {
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "disp-validation-test-"));
    fs.mkdirSync(path.join(tmpDir, ".claude", "state"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "package.json"), "{}");
    // Create scripts/lib/safe-fs.js for the write to work
    const safeFsSrc = path.join(ROOT, "scripts", "lib", "safe-fs.js");
    const safeFsDst = path.join(tmpDir, "scripts", "lib", "safe-fs.js");
    fs.mkdirSync(path.dirname(safeFsDst), { recursive: true });
    fs.copyFileSync(safeFsSrc, safeFsDst);
    // Copy symlink-guard if it exists
    const symlinkGuardDir = path.join(ROOT, ".claude", "hooks", "lib");
    const symlinkGuardDst = path.join(tmpDir, ".claude", "hooks", "lib");
    try {
      fs.mkdirSync(symlinkGuardDst, { recursive: true });
      const sgFile = path.join(symlinkGuardDir, "symlink-guard.js");
      if (fs.existsSync(sgFile)) {
        fs.copyFileSync(sgFile, path.join(symlinkGuardDst, "symlink-guard.js"));
      }
    } catch {
      // Optional — fallback in safe-fs handles this
    }
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("rejects write with total=5 and all dispositions zero", () => {
    const data = makeFullRecord({
      total: 5,
      fixed: 0,
      deferred: 0,
      rejected: 0,
    });

    assert.throws(
      () => writeReviewRecord(tmpDir, data),
      (err) => {
        assert.ok(err instanceof Error);
        assert.ok(
          err.message.includes("Disposition integrity violation"),
          `Expected disposition error, got: ${err.message}`
        );
        return true;
      },
      "Should reject record with total > 0 but no dispositions"
    );

    // Verify file was NOT created
    const filePath = path.join(tmpDir, ".claude", "state", "reviews.jsonl");
    assert.ok(!fs.existsSync(filePath), "File should not be created on rejected write");
  });

  test("accepts write with total=5 and valid dispositions", () => {
    const data = makeFullRecord({
      total: 5,
      fixed: 3,
      deferred: 1,
      rejected: 1,
    });

    const result = writeReviewRecord(tmpDir, data);

    assert.equal(result.id, "rev-1");
    assert.equal(result.total, 5);
    assert.equal(result.fixed, 3);

    // Verify file was created
    const filePath = path.join(tmpDir, ".claude", "state", "reviews.jsonl");
    assert.ok(fs.existsSync(filePath), "File should be created on valid write");

    const content = fs.readFileSync(filePath, "utf8").trim();
    const written = JSON.parse(content);
    assert.equal(written.total, 5);
    assert.equal(written.fixed, 3);
  });

  test("accepts write with total=0 and all dispositions zero", () => {
    const data = makeFullRecord({
      total: 0,
      fixed: 0,
      deferred: 0,
      rejected: 0,
    });

    const result = writeReviewRecord(tmpDir, data);
    assert.equal(result.total, 0);
  });

  test("accepts write with total=null (optional field)", () => {
    const data = makeFullRecord({
      total: null,
      fixed: null,
      deferred: null,
      rejected: null,
    });

    const result = writeReviewRecord(tmpDir, data);
    assert.equal(result.total, null);
  });
});

// ── Tests: validateDispositionIntegrity function directly ─────────────────

describe("validateDispositionIntegrity (exported function)", () => {
  test("throws on total=5 with zero dispositions", () => {
    assert.throws(
      () => validateDispositionIntegrity({ total: 5, fixed: 0, deferred: 0, rejected: 0 }),
      (err) => {
        assert.ok(err.message.includes("Disposition integrity violation"));
        assert.ok(err.message.includes("total=5"));
        return true;
      }
    );
  });

  test("does not throw on total=0", () => {
    assert.doesNotThrow(() =>
      validateDispositionIntegrity({ total: 0, fixed: 0, deferred: 0, rejected: 0 })
    );
  });

  test("does not throw when fixed > 0", () => {
    assert.doesNotThrow(() =>
      validateDispositionIntegrity({ total: 5, fixed: 5, deferred: 0, rejected: 0 })
    );
  });

  test("does not throw when deferred > 0", () => {
    assert.doesNotThrow(() =>
      validateDispositionIntegrity({ total: 5, fixed: 0, deferred: 5, rejected: 0 })
    );
  });

  test("does not throw when rejected > 0", () => {
    assert.doesNotThrow(() =>
      validateDispositionIntegrity({ total: 5, fixed: 0, deferred: 0, rejected: 5 })
    );
  });
});
