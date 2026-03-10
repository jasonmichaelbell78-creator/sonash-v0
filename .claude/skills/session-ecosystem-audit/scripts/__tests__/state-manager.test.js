#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * State Manager Tests for Session Ecosystem Audit
 *
 * Tests JSONL append/read and history extraction.
 * Note: session state manager does NOT expose saveBaseline/loadBaseline.
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
    const message =
      err instanceof Error ? err.stack || err.message : `Non-Error thrown: ${String(err)}`;
    console.error(`  \u2717 ${name}: ${message}`);
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
  return fs.mkdtempSync(path.join(os.tmpdir(), "session-audit-sm-test-"));
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
      session_begin_completeness: { score, rating: "good" },
      begin_end_balance: { score, rating: "average" },
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
    assertEqual(history.length, 0, "No history yet");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("computeDelta returns null when no history", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const delta = sm.computeDelta({ healthScore: { score: 80 }, categories: {} });
    assertEqual(delta, null, "Must return null with no history");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 3: appendEntry + readEntries
// ============================================================================

console.log("\n--- Test Group 3: Append and Read ---");

test("appendEntry writes entry and readEntries returns it", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const saved = sm.appendEntry(makeSampleEntry(78));
    assertEqual(saved, true, "appendEntry should return true");
    const entries = sm.readEntries();
    assertEqual(entries.length, 1, "Should have 1 entry");
    assertEqual(entries[0].healthScore.score, 78, "Score must match");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("multiple appends preserve insertion order", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const scores = [55, 65, 75, 85];
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
    const saved = sm.appendEntry(makeSampleEntry(60));
    assertEqual(saved, false, "Must return false when guard rejects");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 4: History extraction
// ============================================================================

console.log("\n--- Test Group 4: History Extraction ---");

test("getCompositeHistory returns scores in order", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const vals = [70, 75, 80];
    for (const v of vals) sm.appendEntry(makeSampleEntry(v));
    const history = sm.getCompositeHistory(10);
    assertEqual(history.length, 3, "Should have 3 composite scores");
    assertEqual(history[0], 70, "Oldest first");
    assertEqual(history[2], 80, "Newest last");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("getCategoryHistory extracts per-category scores", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    for (const s of [60, 70, 80]) sm.appendEntry(makeSampleEntry(s));
    const history = sm.getCategoryHistory("session_begin_completeness", 10);
    assertEqual(history.length, 3, "Should have 3 category scores");
    assertEqual(history[0], 60, "Oldest first");
    assertEqual(history[2], 80, "Newest last");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("getCompositeHistory respects window size", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    for (let i = 1; i <= 6; i++) sm.appendEntry(makeSampleEntry(i * 10));
    const history = sm.getCompositeHistory(3);
    assertEqual(history.length, 3, "windowSize=3 should return 3 entries");
    assertEqual(history[2], 60, "Last should be most recent");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 5: computeDelta
// ============================================================================

console.log("\n--- Test Group 5: Delta Computation ---");

test("computeDelta returns correct scoreDelta", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    sm.appendEntry(makeSampleEntry(65));
    const current = {
      healthScore: { score: 77, grade: "C" },
      categories: { session_begin_completeness: { score: 77, rating: "average" } },
    };
    const delta = sm.computeDelta(current);
    assert(delta !== null, "Delta must be non-null");
    assertEqual(delta.scoreBefore, 65, "scoreBefore");
    assertEqual(delta.scoreAfter, 77, "scoreAfter");
    assertEqual(delta.scoreDelta, 12, "scoreDelta");
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
    for (let i = 1; i <= 5; i++) sm.appendEntry(makeSampleEntry(i * 10));
    const recent = sm.getRecent(2);
    assertEqual(recent.length, 2, "Should return 2 most recent");
    assertEqual(recent[1].healthScore.score, 50, "Last is most recent");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
