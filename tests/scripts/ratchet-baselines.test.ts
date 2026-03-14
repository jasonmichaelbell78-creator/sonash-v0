/**
 * ratchet-baselines.js Test Suite
 *
 * Tests the core ratchet logic and the --check-only flag on run().
 * The --check-only flag makes ratchet safe for session-start: it reports
 * regressions to stderr but exits 0 (returns result) instead of process.exit(1).
 *
 * Run: npm run test:infra (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import * as fs from "node:fs";
import * as path from "node:path";
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
const SCRIPT_PATH = path.join(PROJECT_ROOT, "scripts/ratchet-baselines.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ratchetModule = require(SCRIPT_PATH) as {
  run: (argv?: string[]) => unknown;
  readBaselines: () => unknown;
  ratchet: (
    baselineData: unknown,
    currentCounts: Record<string, number>,
    opts?: { dryRun?: boolean }
  ) => { regressions: string[]; improvements: string[]; unchanged: string[] };
};

const { ratchet } = ratchetModule;

// =========================================================
// ratchet() - core logic (no I/O, fully testable)
// =========================================================

describe("ratchet: regression detection", () => {
  it("detects when current count exceeds baseline", () => {
    const baselineData = {
      baselines: {
        "SEC-001": { baseline: 2, recorded: "2026-01-01" },
      },
    };
    const currentCounts = { "SEC-001": 5 };
    const result = ratchet(baselineData, currentCounts, { dryRun: true });

    assert.deepStrictEqual(result.regressions, ["SEC-001"]);
    assert.deepStrictEqual(result.improvements, []);
  });

  it("detects improvement when current count decreases", () => {
    const baselineData = {
      baselines: {
        "SEC-001": { baseline: 5, recorded: "2026-01-01" },
      },
    };
    const currentCounts = { "SEC-001": 2 };
    const result = ratchet(baselineData, currentCounts, { dryRun: true });

    assert.deepStrictEqual(result.regressions, []);
    assert.deepStrictEqual(result.improvements, ["SEC-001"]);
  });

  it("detects unchanged when current equals baseline", () => {
    const baselineData = {
      baselines: {
        "SEC-001": { baseline: 3, recorded: "2026-01-01" },
      },
    };
    const currentCounts = { "SEC-001": 3 };
    const result = ratchet(baselineData, currentCounts, { dryRun: true });

    assert.deepStrictEqual(result.regressions, []);
    assert.deepStrictEqual(result.unchanged, ["SEC-001"]);
  });

  it("treats new patterns with violations as regressions", () => {
    const baselineData = { baselines: {} };
    const currentCounts = { "NEW-PATTERN": 3 };
    const result = ratchet(baselineData, currentCounts, { dryRun: true });

    assert.ok(
      result.regressions.includes("NEW-PATTERN"),
      "New pattern with violations should be a regression"
    );
  });

  it("does not report new patterns with 0 violations as regressions", () => {
    const baselineData = { baselines: {} };
    const currentCounts = { "NEW-PATTERN": 0 };
    const result = ratchet(baselineData, currentCounts, { dryRun: true });

    assert.ok(
      !result.regressions.includes("NEW-PATTERN"),
      "New pattern with 0 violations should not be a regression"
    );
  });

  it("returns all three arrays in result", () => {
    const baselineData = {
      baselines: {
        regressed: { baseline: 1, recorded: "2026-01-01" },
        improved: { baseline: 5, recorded: "2026-01-01" },
        same: { baseline: 3, recorded: "2026-01-01" },
      },
    };
    const currentCounts = { regressed: 3, improved: 2, same: 3 };
    const result = ratchet(baselineData, currentCounts, { dryRun: true });

    assert.ok(result.regressions.includes("regressed"));
    assert.ok(result.improvements.includes("improved"));
    assert.ok(result.unchanged.includes("same"));
  });
});

// =========================================================
// run() with --check-only flag
// =========================================================

describe("run() --check-only flag", () => {
  let tmpDir: string;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const childProcess = require("node:child_process");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cjsFs = require("node:fs");

  let originalExecFileSync: unknown;
  let originalFsReadFileSync: unknown;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ratchet-test-"));
    originalExecFileSync = childProcess.execFileSync;
    originalFsReadFileSync = cjsFs.readFileSync;
  });

  afterEach(() => {
    childProcess.execFileSync = originalExecFileSync;
    cjsFs.readFileSync = originalFsReadFileSync;
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
    delete require.cache[require.resolve(SCRIPT_PATH)];
  });

  function makeBaselineFile(baselineCounts: Record<string, number>): string {
    const baselineFile = path.join(tmpDir, "known-debt-baseline.json");
    const baselines: Record<
      string,
      { baseline: number; recorded: string; ratchet_history: never[] }
    > = {};
    for (const [id, count] of Object.entries(baselineCounts)) {
      baselines[id] = { baseline: count, recorded: "2026-01-01", ratchet_history: [] };
    }
    const data = { updated: "2026-01-01", baselines };
    fs.writeFileSync(baselineFile, JSON.stringify(data, null, 2), "utf-8");
    return baselineFile;
  }

  function mockViolations(counts: Record<string, number>): void {
    const violations: { id: string }[] = [];
    for (const [id, count] of Object.entries(counts)) {
      for (let i = 0; i < count; i++) {
        violations.push({ id });
      }
    }
    childProcess.execFileSync = () => JSON.stringify({ violations });
  }

  function patchReadFileSync(baselineFile: string): void {
    // Capture original BEFORE patching to avoid infinite recursion in closure
    const realReadFileSync = originalFsReadFileSync as typeof fs.readFileSync;
    cjsFs.readFileSync = (filePath: unknown, encoding?: unknown) => {
      if (typeof filePath === "string" && filePath.includes("known-debt-baseline.json")) {
        // Use the captured original (not fs.readFileSync which is now patched)
        return realReadFileSync(baselineFile, (encoding as BufferEncoding) ?? "utf-8");
      }
      return realReadFileSync(
        filePath as fs.PathOrFileDescriptor,
        encoding as fs.ObjectEncodingOptions
      );
    };
  }

  function freshRun(argv: string[]): unknown {
    delete require.cache[require.resolve(SCRIPT_PATH)];
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(SCRIPT_PATH) as { run: (argv?: string[]) => unknown };
    return mod.run(argv);
  }

  it("returns result with regressions when --check-only is passed (does not throw or exit)", () => {
    const baselineFile = makeBaselineFile({ "SEC-001": 2 });
    mockViolations({ "SEC-001": 5 });
    patchReadFileSync(baselineFile);

    let result: unknown;
    let threw = false;
    try {
      result = freshRun(["--check-only"]);
    } catch {
      threw = true;
    }

    assert.strictEqual(threw, false, "run() with --check-only should not throw on regression");
    assert.ok(result !== undefined, "run() with --check-only should return a result object");

    const r = result as { regressions: string[] };
    assert.ok(Array.isArray(r.regressions), "result.regressions should be an array");
    assert.ok(
      r.regressions.includes("SEC-001"),
      "result.regressions should include the regressed pattern"
    );
  });

  it("run() without --check-only calls process.exit(1) on regression", () => {
    const baselineFile = makeBaselineFile({ "SEC-001": 2 });
    mockViolations({ "SEC-001": 5 });
    patchReadFileSync(baselineFile);

    const origExit = process.exit.bind(process);
    let exitCode: number | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process as any).exit = (code?: number) => {
      exitCode = code;
      throw new Error("process.exit(" + String(code) + ")");
    };

    try {
      freshRun([]);
    } catch {
      // Expected: our process.exit mock throws
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process as any).exit = origExit;
    }

    assert.strictEqual(
      exitCode,
      1,
      "run() without --check-only should call process.exit(1) on regression"
    );
  });

  it("run() returns result when there are no regressions", () => {
    const baselineFile = makeBaselineFile({ "SEC-001": 5 });
    mockViolations({ "SEC-001": 5 });
    patchReadFileSync(baselineFile);

    let result: unknown;
    let threw = false;
    try {
      result = freshRun([]);
    } catch {
      threw = true;
    }

    assert.strictEqual(threw, false, "run() with no regressions should not throw");
    assert.ok(result !== undefined, "run() with no regressions should return a result object");

    const r = result as { regressions: string[]; unchanged: string[] };
    assert.deepStrictEqual(r.regressions, []);
    assert.ok(r.unchanged.includes("SEC-001"));
  });

  it("--check-only reports regression info to stderr and returns result", () => {
    const baselineFile = makeBaselineFile({ "SEC-001": 1, "STYLE-001": 2 });
    mockViolations({ "SEC-001": 4, "STYLE-001": 6 });
    patchReadFileSync(baselineFile);

    const stderrMessages: string[] = [];
    const origStderrWrite = process.stderr.write.bind(process.stderr);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.stderr as any).write = (chunk: unknown) => {
      stderrMessages.push(String(chunk));
      return true;
    };

    let result: unknown;
    try {
      result = freshRun(["--check-only"]);
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (process.stderr as any).write = origStderrWrite;
    }

    assert.ok(result !== undefined, "--check-only should return result");
    const r = result as { regressions: string[] };
    assert.strictEqual(r.regressions.length, 2, "Should detect both regressions");

    const stderrOutput = stderrMessages.join("");
    assert.ok(
      stderrOutput.includes("regression") || stderrOutput.includes("check-only"),
      "Should emit regression info to stderr in check-only mode, got: " + stderrOutput.slice(0, 200)
    );
  });
});
