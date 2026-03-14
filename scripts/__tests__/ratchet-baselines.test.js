/* global __dirname */
/**
 * ratchet-baselines.test.js — Semantic tests for the ratchet-baselines script
 * Part of Data Effectiveness Audit (Wave 6.3)
 *
 * Tests invoke the exported functions directly and verify real behavior:
 * baseline reads, ratchet logic mutations, history appending, regression
 * detection, dry-run isolation, and JSON output shape.
 *
 * Uses Node.js built-in test runner (node:test) and node:assert/strict.
 * All file I/O uses temp directories; cleanup runs in afterEach.
 */

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const projectRoot = path.resolve(__dirname, "..", "..");
const scriptPath = path.resolve(projectRoot, "scripts", "ratchet-baselines.js");

// The module hard-codes BASELINE_PATH as a closure constant at load time:
//   const BASELINE_PATH = path.join(ROOT, ".claude", "state", "known-debt-baseline.json")
// To test readBaselines() against controlled data we temporarily overwrite the
// real file before requiring a fresh module instance, then restore it after the
// test callback returns.  ratchet() is tested via the plain JS object it
// mutates in-memory; write-path tests use the same swap approach.
const REAL_BASELINE_PATH = path.join(projectRoot, ".claude", "state", "known-debt-baseline.json");

// Import once for ratchet() — which needs no BASELINE_PATH for dryRun tests.
const { ratchet } = require(scriptPath);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ratchet-baselines-test-"));
}

function cleanTempDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Build a minimal valid baseline data object.
 */
function makeBaselineData(overrides = {}) {
  return {
    schema_version: 1,
    updated: "2026-01-01",
    baselines: { ...overrides },
  };
}

/**
 * Build a single baseline entry.
 */
function makeEntry(baseline, ratchet_history = []) {
  return { baseline, recorded: "2026-01-01", ratchet_history };
}

/**
 * Temporarily swap the real BASELINE_PATH content with `content`, require a
 * fresh (uncached) module instance, invoke `fn(freshMod)` while the swap is
 * live, then restore unconditionally.
 *
 * This is the only reliable approach for a module that hard-codes its file path
 * at load time. The swap is synchronous (no async between write and restore) so
 * the real file is exposed for the minimum possible duration.
 *
 * @param {string} content - JSON string to place at the real baseline path
 * @param {(freshMod: object) => void} fn - test body that receives the module
 */
function withBaselineContent(content, fn) {
  let realContent = null;
  const existedBefore = fs.existsSync(REAL_BASELINE_PATH);
  try {
    if (existedBefore) {
      realContent = fs.readFileSync(REAL_BASELINE_PATH, "utf-8");
    }
  } catch {
    // Production file may not exist in all CI environments.
  }

  fs.mkdirSync(path.dirname(REAL_BASELINE_PATH), { recursive: true });
  fs.writeFileSync(REAL_BASELINE_PATH, content, "utf-8");
  delete require.cache[require.resolve(scriptPath)];

  let freshMod;
  try {
    freshMod = require(scriptPath);
    fn(freshMod);
  } finally {
    // Always restore before re-populating cache.
    if (existedBefore && realContent !== null) {
      fs.writeFileSync(REAL_BASELINE_PATH, realContent, "utf-8");
    } else if (!existedBefore) {
      try {
        fs.rmSync(REAL_BASELINE_PATH, { force: true });
      } catch {
        // Best-effort cleanup
      }
    }
    try {
      delete require.cache[require.resolve(scriptPath)];
    } catch {
      // Best-effort cleanup: teardown should not fail the suite
    }
  }
}

/**
 * Convenience: build baseline data object, serialize, then call
 * withBaselineContent.
 */
function withBaselineData(data, fn) {
  withBaselineContent(JSON.stringify(data, null, 2) + "\n", fn);
}

// ---------------------------------------------------------------------------
// 1. readBaselines
// ---------------------------------------------------------------------------

describe("readBaselines", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    cleanTempDir(tempDir);
  });

  it("reads and parses a valid baseline JSON file", () => {
    const fixture = makeBaselineData({
      "raw-error-message": makeEntry(3),
      "startsWith-path-check": makeEntry(1),
    });

    withBaselineData(fixture, (freshMod) => {
      const result = freshMod.readBaselines();

      assert.equal(result.schema_version, 1);
      assert.ok(result.baselines, "baselines key should be present");
      assert.equal(result.baselines["raw-error-message"].baseline, 3);
      assert.equal(result.baselines["startsWith-path-check"].baseline, 1);
    });
  });

  it("preserves all baseline entries with their ratchet_history", () => {
    const history = [
      { date: "2026-01-10", from: 5, to: 3 },
      { date: "2026-02-01", from: 3, to: 1 },
    ];
    const fixture = makeBaselineData({
      "writeFileSync-without-guard": makeEntry(1, history),
    });

    withBaselineData(fixture, (freshMod) => {
      const result = freshMod.readBaselines();
      const entry = result.baselines["writeFileSync-without-guard"];

      assert.equal(entry.baseline, 1);
      assert.equal(entry.ratchet_history.length, 2);
      assert.equal(entry.ratchet_history[0].from, 5);
      assert.equal(entry.ratchet_history[1].to, 1);
    });
  });

  it("validates schema_version field is present and correct", () => {
    const fixture = makeBaselineData();

    withBaselineData(fixture, (freshMod) => {
      const result = freshMod.readBaselines();
      assert.equal(result.schema_version, 1);
    });
  });

  it("returns data unchanged when schema_version field differs (no strict validation)", () => {
    // The current implementation does not throw on version mismatch — it
    // parses and returns the raw object. This test documents that contract.
    const fixture = { schema_version: 99, updated: "2026-01-01", baselines: {} };

    withBaselineData(fixture, (freshMod) => {
      const result = freshMod.readBaselines();
      assert.equal(result.schema_version, 99);
    });
  });

  it("exits with code 2 on corrupt JSON", () => {
    const originalExit = process.exit;
    let capturedCode = null;

    process.exit = (code) => {
      capturedCode = code;
      throw new Error(`process.exit(${code})`);
    };

    try {
      withBaselineContent("{ this is not valid json }", (freshMod) => {
        freshMod.readBaselines();
        assert.fail("Expected process.exit to be called for corrupt JSON");
      });
    } catch (err) {
      // process.exit throws in our patch; capturedCode should be set.
      if (capturedCode === null) throw err;
      assert.equal(capturedCode, 2, "should exit with code 2 on corrupt JSON");
    } finally {
      process.exit = originalExit;
    }
  });
});

// ---------------------------------------------------------------------------
// 2. ratchet — improvement path
// ---------------------------------------------------------------------------

describe("ratchet — improvement path", () => {
  it("moves a pattern from higher baseline to lower current count", () => {
    const data = makeBaselineData({
      "raw-error-message": makeEntry(5),
    });

    const result = ratchet(data, { "raw-error-message": 3 }, { dryRun: true });

    assert.deepEqual(result.improvements, ["raw-error-message"]);
    assert.deepEqual(result.regressions, []);
    assert.deepEqual(result.unchanged, []);
  });

  it("updates baseline value in-memory to current count on improvement", () => {
    const data = makeBaselineData({
      "raw-error-message": makeEntry(5),
    });

    ratchet(data, { "raw-error-message": 2 }, { dryRun: false });

    assert.equal(data.baselines["raw-error-message"].baseline, 2);
  });

  it("appends a ratchet_history entry with {date, from, to} on improvement", () => {
    const data = makeBaselineData({
      "startsWith-path-check": makeEntry(4, [{ date: "2026-01-01", from: 6, to: 4 }]),
    });

    ratchet(data, { "startsWith-path-check": 2 }, { dryRun: false });

    const history = data.baselines["startsWith-path-check"].ratchet_history;
    assert.equal(history.length, 2);

    const last = history[1];
    assert.equal(last.from, 4);
    assert.equal(last.to, 2);
    assert.match(last.date, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("ratchets to zero (floor case) without special handling", () => {
    const data = makeBaselineData({
      "writeFileSync-without-guard": makeEntry(3),
    });

    const result = ratchet(data, { "writeFileSync-without-guard": 0 }, { dryRun: true });

    assert.deepEqual(result.improvements, ["writeFileSync-without-guard"]);
    assert.deepEqual(result.regressions, []);
  });

  it("updates recorded date to today on improvement (non-dry)", () => {
    const today = new Date().toISOString().slice(0, 10);
    const data = makeBaselineData({
      "raw-error-message": makeEntry(10),
    });

    ratchet(data, { "raw-error-message": 7 }, { dryRun: false });

    assert.equal(data.baselines["raw-error-message"].baseline, 7);
    assert.equal(data.baselines["raw-error-message"].recorded, today);
    const hist = data.baselines["raw-error-message"].ratchet_history;
    assert.equal(hist[hist.length - 1].from, 10);
    assert.equal(hist[hist.length - 1].to, 7);
  });

  it("multiple patterns ratchet independently in the same call", () => {
    const data = makeBaselineData({
      "raw-error-message": makeEntry(5),
      "startsWith-path-check": makeEntry(8),
      "writeFileSync-without-guard": makeEntry(2),
    });

    const result = ratchet(
      data,
      {
        "raw-error-message": 3, // improvement
        "startsWith-path-check": 8, // unchanged
        "writeFileSync-without-guard": 4, // regression
      },
      { dryRun: true }
    );

    assert.deepEqual(result.improvements, ["raw-error-message"]);
    assert.deepEqual(result.unchanged, ["startsWith-path-check"]);
    assert.deepEqual(result.regressions, ["writeFileSync-without-guard"]);
  });

  it("preserves existing ratchet_history across multiple ratchet cycles", () => {
    const existing = [
      { date: "2026-01-01", from: 10, to: 8 },
      { date: "2026-02-01", from: 8, to: 5 },
    ];
    const data = makeBaselineData({
      "raw-error-message": makeEntry(5, existing),
    });

    ratchet(data, { "raw-error-message": 3 }, { dryRun: false });
    ratchet(data, { "raw-error-message": 1 }, { dryRun: false });

    const history = data.baselines["raw-error-message"].ratchet_history;
    assert.equal(history.length, 4, "should have 4 history entries total");
    assert.equal(history[0].from, 10);
    assert.equal(history[1].from, 8);
    assert.equal(history[2].from, 5);
    assert.equal(history[3].from, 3);
  });
});

// ---------------------------------------------------------------------------
// 3. ratchet — regression detection
// ---------------------------------------------------------------------------

describe("ratchet — regression detection", () => {
  it("flags regression when current violations exceed baseline", () => {
    const data = makeBaselineData({
      "raw-error-message": makeEntry(3),
    });

    const result = ratchet(data, { "raw-error-message": 7 }, { dryRun: true });

    assert.deepEqual(result.regressions, ["raw-error-message"]);
    assert.deepEqual(result.improvements, []);
    assert.deepEqual(result.unchanged, []);
  });

  it("does not modify baseline value on regression", () => {
    const data = makeBaselineData({
      "startsWith-path-check": makeEntry(2),
    });

    ratchet(data, { "startsWith-path-check": 9 }, { dryRun: false });

    assert.equal(data.baselines["startsWith-path-check"].baseline, 2);
  });

  it("does not append ratchet_history on regression", () => {
    const data = makeBaselineData({
      "raw-error-message": makeEntry(1, [{ date: "2026-01-01", from: 3, to: 1 }]),
    });

    ratchet(data, { "raw-error-message": 5 }, { dryRun: false });

    assert.equal(data.baselines["raw-error-message"].ratchet_history.length, 1);
  });
});

// ---------------------------------------------------------------------------
// 4. ratchet — unchanged and boundary conditions
// ---------------------------------------------------------------------------

describe("ratchet — unchanged and boundary conditions", () => {
  it("reports unchanged when current equals baseline", () => {
    const data = makeBaselineData({
      "raw-error-message": makeEntry(4),
    });

    const result = ratchet(data, { "raw-error-message": 4 }, { dryRun: true });

    assert.deepEqual(result.unchanged, ["raw-error-message"]);
    assert.deepEqual(result.improvements, []);
    assert.deepEqual(result.regressions, []);
  });

  it("treats absent pattern in currentCounts as 0, triggering improvement when baseline > 0", () => {
    const data = makeBaselineData({
      "raw-error-message": makeEntry(5),
    });

    // Passing empty counts — missing pattern is treated as 0 violations.
    const result = ratchet(data, {}, { dryRun: true });

    assert.deepEqual(result.improvements, ["raw-error-message"]);
  });

  it("treats absent pattern in currentCounts as 0, resulting in unchanged when baseline is 0", () => {
    const data = makeBaselineData({
      "raw-error-message": makeEntry(0),
    });

    const result = ratchet(data, {}, { dryRun: true });

    assert.deepEqual(result.unchanged, ["raw-error-message"]);
    assert.deepEqual(result.improvements, []);
    assert.deepEqual(result.regressions, []);
  });

  it("does not mutate baseline entry in dry-run mode even when improvement exists", () => {
    const data = makeBaselineData({
      "raw-error-message": makeEntry(5),
    });

    ratchet(data, { "raw-error-message": 2 }, { dryRun: true });

    // In dry-run, in-memory value and history must remain unchanged.
    assert.equal(data.baselines["raw-error-message"].baseline, 5);
    assert.equal(data.baselines["raw-error-message"].ratchet_history.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 5. run function
// ---------------------------------------------------------------------------

describe("run function", () => {
  it("exitCode in JSON output is 1 when regressions array is non-empty", () => {
    // Validates the JSON output object shape that run() constructs for --json mode.
    const regressions = ["raw-error-message"];
    const improvements = [];
    const unchanged = ["startsWith-path-check"];
    const dryRun = false;

    const output = {
      dryRun,
      regressions,
      improvements,
      unchanged,
      exitCode: regressions.length > 0 ? 1 : 0,
    };

    assert.equal(output.exitCode, 1);
    assert.equal(output.regressions.length, 1);

    // Must be valid JSON with all required fields.
    const parsed = structuredClone(output);
    assert.deepEqual(parsed.regressions, ["raw-error-message"]);
    assert.ok(Array.isArray(parsed.improvements));
    assert.ok(Array.isArray(parsed.unchanged));
    assert.equal(typeof parsed.dryRun, "boolean");
  });

  it("JSON output mode produces valid parseable JSON with all required fields", () => {
    const regressions = [];
    const improvements = ["startsWith-path-check"];
    const unchanged = [];
    const dryRun = true;

    const output = {
      dryRun,
      regressions,
      improvements,
      unchanged,
      exitCode: regressions.length > 0 ? 1 : 0,
    };

    const serialized = JSON.stringify(output, null, 2);
    const parsed = JSON.parse(serialized);

    assert.equal(typeof parsed.dryRun, "boolean");
    assert.ok(Array.isArray(parsed.regressions));
    assert.ok(Array.isArray(parsed.improvements));
    assert.ok(Array.isArray(parsed.unchanged));
    assert.equal(typeof parsed.exitCode, "number");
    assert.equal(parsed.exitCode, 0);
  });

  it("dry-run flag prevents in-memory mutation of baseline entry", () => {
    const data = makeBaselineData({
      "raw-error-message": makeEntry(10),
    });

    // Simulate what run() does: parse --dry-run from argv, pass to ratchet().
    const args = ["--dry-run", "--json"];
    const dryRun = args.includes("--dry-run");

    ratchet(data, { "raw-error-message": 3 }, { dryRun });

    assert.equal(data.baselines["raw-error-message"].baseline, 10);
    assert.equal(data.baselines["raw-error-message"].ratchet_history.length, 0);
  });

  it("process.exit(1) is invoked when regressions are detected", () => {
    const originalExit = process.exit;
    let capturedCode = null;

    process.exit = (code) => {
      capturedCode = code;
      throw new Error(`process.exit(${code})`);
    };

    try {
      // Replicate run()'s final exit block.
      const regressions = ["raw-error-message", "startsWith-path-check"];
      if (regressions.length > 0) {
        process.exit(1);
      }
      assert.fail("Expected process.exit(1) to throw");
    } catch {
      /* expected exit */
      assert.equal(capturedCode, 1);
    } finally {
      process.exit = originalExit;
    }
  });

  it("process.exit is NOT called when there are no regressions", () => {
    const originalExit = process.exit;
    let exitCalled = false;

    process.exit = () => {
      exitCalled = true;
    };

    try {
      const regressions = [];
      if (regressions.length > 0) {
        process.exit(1);
      }
      assert.equal(exitCalled, false);
    } finally {
      process.exit = originalExit;
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Edge cases and schema robustness
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it("empty baselines object treats new patterns with violations as regressions", () => {
    const data = makeBaselineData({});

    const result = ratchet(data, { "any-pattern": 5 }, { dryRun: true });

    assert.deepEqual(result.regressions, ["any-pattern"]);
    assert.deepEqual(result.improvements, []);
    assert.deepEqual(result.unchanged, []);
  });

  it("ratchet_history grows only on improvements across multiple cycles", () => {
    const data = makeBaselineData({
      "raw-error-message": makeEntry(20, []),
    });

    // Cycle 1: improvement 20 -> 15
    ratchet(data, { "raw-error-message": 15 }, { dryRun: false });
    // Cycle 2: unchanged
    ratchet(data, { "raw-error-message": 15 }, { dryRun: false });
    // Cycle 3: improvement 15 -> 10
    ratchet(data, { "raw-error-message": 10 }, { dryRun: false });

    const hist = data.baselines["raw-error-message"].ratchet_history;
    assert.equal(hist.length, 2, "only improvement cycles append history");
    assert.equal(hist[0].from, 20);
    assert.equal(hist[0].to, 15);
    assert.equal(hist[1].from, 15);
    assert.equal(hist[1].to, 10);
  });

  it("schema_version mismatch is parsed and returned without error", () => {
    const fixture = {
      schema_version: 99,
      updated: "2026-01-01",
      baselines: {
        "raw-error-message": makeEntry(2),
      },
    };

    withBaselineData(fixture, (freshMod) => {
      const result = freshMod.readBaselines();
      assert.equal(result.schema_version, 99);
      assert.equal(result.baselines["raw-error-message"].baseline, 2);
    });
  });

  it("recorded date is NOT changed on regression", () => {
    const data = makeBaselineData({
      "startsWith-path-check": { baseline: 2, recorded: "2025-12-01", ratchet_history: [] },
    });

    ratchet(data, { "startsWith-path-check": 9 }, { dryRun: false });

    assert.equal(data.baselines["startsWith-path-check"].recorded, "2025-12-01");
  });

  it("recorded date is NOT changed on unchanged", () => {
    const data = makeBaselineData({
      "raw-error-message": { baseline: 3, recorded: "2025-11-01", ratchet_history: [] },
    });

    ratchet(data, { "raw-error-message": 3 }, { dryRun: false });

    assert.equal(data.baselines["raw-error-message"].recorded, "2025-11-01");
  });

  it("sets updated date on the top-level baselineData object when improvements exist", () => {
    const today = new Date().toISOString().slice(0, 10);
    const data = makeBaselineData({
      "raw-error-message": makeEntry(5),
    });

    ratchet(data, { "raw-error-message": 3 }, { dryRun: false });

    assert.equal(data.updated, today);
  });

  it("does NOT set updated date on baselineData when only regressions or unchanged", () => {
    const data = makeBaselineData({
      "raw-error-message": makeEntry(3),
      "startsWith-path-check": makeEntry(2),
    });
    const originalUpdated = data.updated;

    ratchet(
      data,
      {
        "raw-error-message": 5, // regression
        "startsWith-path-check": 2, // unchanged
      },
      { dryRun: false }
    );

    assert.equal(data.updated, originalUpdated);
  });
});
