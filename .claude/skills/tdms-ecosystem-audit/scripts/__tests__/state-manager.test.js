#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * State Manager Tests for TDMS Ecosystem Audit
 *
 * Tests JSONL append/read and history extraction.
 * Note: TDMS state manager does NOT expose saveBaseline/loadBaseline.
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
    const r = fn();
    if (r && typeof r.then === "function") {
      throw new Error("Async tests are not supported in this runner");
    }
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
  return fs.mkdtempSync(path.join(os.tmpdir(), "tdms-audit-sm-test-"));
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
    healthScore: { score, grade: score >= 90 ? "A" : "C" },
    categories: {
      schema_compliance: { score, rating: "good" },
      dedup_algorithm_health: { score, rating: "average" },
    },
    summary: { errors: 0, warnings: 1, info: 0 },
  };
}

// ============================================================================
// TEST GROUP 1: API shape
// ============================================================================

console.log("\n--- Test Group 1: API Shape ---");

test("createStateManager exposes core API methods", () => {
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
    assertEqual(entries.length, 0, "Must be empty");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("getCompositeHistory returns [] when no history", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const history = sm.getCompositeHistory(5);
    assert(Array.isArray(history), "Must return array");
    assertEqual(history.length, 0, "No history");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("computeDelta returns null when no history", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const delta = sm.computeDelta({ healthScore: { score: 80 }, categories: {} });
    assertEqual(delta, null, "Must return null");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 3: appendEntry + readEntries
// ============================================================================

console.log("\n--- Test Group 3: Append and Read ---");

test("appendEntry returns true and entry is readable", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const saved = sm.appendEntry(makeSampleEntry(88));
    assertEqual(saved, true, "appendEntry should return true");
    const entries = sm.readEntries();
    assertEqual(entries.length, 1, "Should have 1 entry");
    assertEqual(entries[0].healthScore.score, 88, "Score must match");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("multiple appends preserve JSONL order", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const scores = [72, 78, 83, 88];
    for (const s of scores) sm.appendEntry(makeSampleEntry(s));
    const entries = sm.readEntries();
    assertEqual(entries.length, 4, "Should have 4 entries");
    for (let i = 0; i < scores.length; i++) {
      assertEqual(entries[i].healthScore.score, scores[i], `Entry ${i} mismatch`);
    }
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("appendEntry returns false when guard rejects", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => false);
    assertEqual(sm.appendEntry(makeSampleEntry(70)), false, "Must return false");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 4: History extraction
// ============================================================================

console.log("\n--- Test Group 4: History Extraction ---");

test("getCompositeHistory returns scores in insertion order", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    for (const s of [70, 78, 85]) sm.appendEntry(makeSampleEntry(s));
    const history = sm.getCompositeHistory(10);
    assertEqual(history.length, 3, "Should have 3 scores");
    assertEqual(history[0], 70, "Oldest first");
    assertEqual(history[2], 85, "Newest last");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("getCategoryHistory extracts per-category scores", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    for (const s of [60, 72, 84]) sm.appendEntry(makeSampleEntry(s));
    const history = sm.getCategoryHistory("schema_compliance", 10);
    assertEqual(history.length, 3, "Should have 3 category scores");
    assertEqual(history[0], 60, "Oldest first");
    assertEqual(history[2], 84, "Newest last");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("getCompositeHistory respects window size", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    for (let i = 1; i <= 7; i++) sm.appendEntry(makeSampleEntry(i * 10));
    const history = sm.getCompositeHistory(3);
    assertEqual(history.length, 3, "windowSize=3");
    assertEqual(history[2], 70, "Last is most recent");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 5: computeDelta
// ============================================================================

console.log("\n--- Test Group 5: Delta Computation ---");

test("computeDelta computes correct scoreDelta", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    sm.appendEntry(makeSampleEntry(74));
    const delta = sm.computeDelta({
      healthScore: { score: 86, grade: "B" },
      categories: { schema_compliance: { score: 86, rating: "good" } },
    });
    assert(delta !== null, "Delta must be non-null");
    assertEqual(delta.scoreBefore, 74, "scoreBefore");
    assertEqual(delta.scoreAfter, 86, "scoreAfter");
    assertEqual(delta.scoreDelta, 12, "scoreDelta");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("computeDelta returns null with no history", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    assertEqual(
      sm.computeDelta({ healthScore: { score: 80 }, categories: {} }),
      null,
      "Must be null"
    );
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 6: getRecent
// ============================================================================

console.log("\n--- Test Group 6: getRecent ---");

test("getRecent returns most recent N entries", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    for (let i = 1; i <= 5; i++) sm.appendEntry(makeSampleEntry(i * 15));
    const recent = sm.getRecent(2);
    assertEqual(recent.length, 2, "Should return 2 most recent");
    assertEqual(recent[1].healthScore.score, 75, "Last is most recent");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
