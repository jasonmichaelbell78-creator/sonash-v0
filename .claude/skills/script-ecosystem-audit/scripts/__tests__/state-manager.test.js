#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * State Manager Tests for Script Ecosystem Audit
 *
 * Tests JSONL append/read, baseline save/load, and history extraction.
 * Uses a tmpdir so no real state files are modified.
 *
 * Usage:
 *   node state-manager.test.js
 *
 * Exit code: 0 if all pass, 1 if any fail.
 */

"use strict";

const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (err) {
    failed++;
    console.error(`  \u2717 ${name}: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      (message || "assertEqual") +
        `: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

// ============================================================================
// LOAD MODULE
// ============================================================================

const SCRIPTS_DIR = path.join(__dirname, "..");
let createStateManager;

try {
  ({ createStateManager } = require(path.join(SCRIPTS_DIR, "lib", "state-manager")));
} catch (err) {
  console.error(
    `Fatal: Could not load state-manager: ${err instanceof Error ? err.message : String(err)}`
  );
  process.exit(1);
}

// ============================================================================
// HELPERS
// ============================================================================

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "script-audit-sm-test-"));
}

function cleanupTempRoot(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

function makeSampleEntry(score) {
  return {
    timestamp: new Date().toISOString(),
    healthScore: { score, grade: score >= 90 ? "A" : score >= 80 ? "B" : "C" },
    categories: {
      cjs_esm_consistency: { score, rating: "good" },
      file_io_safety: { score, rating: "average" },
    },
    summary: { errors: 0, warnings: 1, info: 2 },
  };
}

// ============================================================================
// TEST GROUP 1: API shape
// ============================================================================

console.log("\n--- Test Group 1: API Shape ---");

test("createStateManager exposes all required methods", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const required = [
      "readEntries",
      "appendEntry",
      "getRecent",
      "computeDelta",
      "getCategoryHistory",
      "getCompositeHistory",
      "saveBaseline",
      "loadBaseline",
    ];
    for (const method of required) {
      assert(typeof sm[method] === "function", `Must expose ${method}()`);
    }
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 2: Empty state
// ============================================================================

console.log("\n--- Test Group 2: Empty State ---");

test("readEntries returns [] when state file does not exist", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const entries = sm.readEntries();
    assert(Array.isArray(entries), "Must return array");
    assertEqual(entries.length, 0, "Must be empty initially");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("loadBaseline returns null when no baseline exists", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const baseline = sm.loadBaseline();
    assertEqual(baseline, null, "loadBaseline must return null when no baseline");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("loadBaseline returns null for nonexistent root dir", () => {
  const sm = createStateManager("/tmp/nonexistent-script-audit-dir-xyz", () => true);
  const baseline = sm.loadBaseline();
  assertEqual(baseline, null, "loadBaseline must return null for missing dir");
});

// ============================================================================
// TEST GROUP 3: appendEntry + readEntries
// ============================================================================

console.log("\n--- Test Group 3: Append and Read ---");

test("appendEntry returns true and entry is readable", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const saved = sm.appendEntry(makeSampleEntry(85));
    assertEqual(saved, true, "appendEntry should return true");
    const entries = sm.readEntries();
    assertEqual(entries.length, 1, "Should have 1 entry");
    assertEqual(entries[0].healthScore.score, 85, "Score must match");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("appendEntry preserves JSONL order across multiple writes", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const scores = [65, 70, 75, 80];
    for (const s of scores) sm.appendEntry(makeSampleEntry(s));
    const entries = sm.readEntries();
    assertEqual(entries.length, 4, "Should have 4 entries");
    for (let i = 0; i < scores.length; i++) {
      assertEqual(entries[i].healthScore.score, scores[i], `Entry ${i} score mismatch`);
    }
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("appendEntry returns false when symlink guard rejects", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => false);
    const saved = sm.appendEntry(makeSampleEntry(70));
    assertEqual(saved, false, "Should return false when guard rejects");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 4: Baseline save/load
// ============================================================================

console.log("\n--- Test Group 4: Baseline Save/Load ---");

test("saveBaseline returns true and loadBaseline returns the saved entry", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const entry = makeSampleEntry(88);
    const saved = sm.saveBaseline(entry);
    assert(saved === true, "saveBaseline should return true");
    const loaded = sm.loadBaseline();
    assert(loaded !== null, "loadBaseline should return non-null");
    assertEqual(loaded.healthScore.score, 88, "Loaded baseline score must match");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("saveBaseline returns false when symlink guard rejects", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => false);
    const saved = sm.saveBaseline(makeSampleEntry(75));
    assertEqual(saved, false, "saveBaseline must return false when guard rejects");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("saveBaseline overwrites previous baseline", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    sm.saveBaseline(makeSampleEntry(70));
    sm.saveBaseline(makeSampleEntry(90));
    const loaded = sm.loadBaseline();
    assert(loaded !== null, "Baseline must exist");
    assertEqual(loaded.healthScore.score, 90, "Should have the latest baseline");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 5: History extraction
// ============================================================================

console.log("\n--- Test Group 5: History Extraction ---");

test("getCompositeHistory returns scores in insertion order", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const scores = [60, 70, 80];
    for (const s of scores) sm.appendEntry(makeSampleEntry(s));
    const history = sm.getCompositeHistory(10);
    assertEqual(history.length, 3, "Should have 3 composite scores");
    assertEqual(history[0], 60, "Oldest first");
    assertEqual(history[2], 80, "Newest last");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("getCategoryHistory extracts per-category scores", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    for (const s of [55, 65, 75]) sm.appendEntry(makeSampleEntry(s));
    const history = sm.getCategoryHistory("cjs_esm_consistency", 10);
    assertEqual(history.length, 3, "Should have 3 category scores");
    assertEqual(history[0], 55, "Oldest category score");
    assertEqual(history[2], 75, "Newest category score");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("getCompositeHistory respects window size", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    for (let i = 1; i <= 8; i++) sm.appendEntry(makeSampleEntry(i * 10));
    const history = sm.getCompositeHistory(3);
    assertEqual(history.length, 3, "windowSize=3 should return 3 entries");
    assertEqual(history[2], 80, "Last window entry should be most recent");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 6: computeDelta
// ============================================================================

console.log("\n--- Test Group 6: Delta Computation ---");

test("computeDelta computes correct scoreDelta", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    sm.appendEntry(makeSampleEntry(70));
    const current = {
      healthScore: { score: 82, grade: "B" },
      categories: {
        cjs_esm_consistency: { score: 82, rating: "good" },
        file_io_safety: { score: 82, rating: "good" },
      },
    };
    const delta = sm.computeDelta(current);
    assert(delta !== null, "Delta must be non-null with history");
    assertEqual(delta.scoreBefore, 70, "scoreBefore");
    assertEqual(delta.scoreAfter, 82, "scoreAfter");
    assertEqual(delta.scoreDelta, 12, "scoreDelta");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("computeDelta returns null with no history", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const delta = sm.computeDelta({ healthScore: { score: 80 }, categories: {} });
    assertEqual(delta, null, "computeDelta must return null with no history");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
