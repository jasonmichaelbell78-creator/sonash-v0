#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * State Manager Tests for PR Ecosystem Audit
 *
 * Tests JSONL append/read, delta computation, and history extraction.
 * Uses an in-memory tmpdir-based approach — no real state files modified.
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
    let message;
    if (err instanceof Error) {
      message = err.stack || err.message;
    } else {
      message = `Non-Error thrown: ${String(err)}`;
    }
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
  let errMsg;
  if (err instanceof Error) {
    errMsg = err.message;
  } else {
    errMsg = String(err);
  }
  console.error(`Fatal: Could not load state-manager: ${errMsg}`);
  process.exit(1);
}

// ============================================================================
// HELPERS
// ============================================================================

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pr-audit-sm-test-"));
}

function cleanupTempRoot(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

// PR audit state manager does not expose saveBaseline/loadBaseline, so we
// test the methods it does expose.

// ============================================================================
// TEST GROUP 1: API shape
// ============================================================================

console.log("\n--- Test Group 1: API Shape ---");

test("createStateManager returns expected API methods", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const methods = [
      "readEntries",
      "appendEntry",
      "getRecent",
      "computeDelta",
      "getCategoryHistory",
      "getCompositeHistory",
    ];
    for (const method of methods) {
      assert(typeof sm[method] === "function", `State manager must expose ${method}()`);
    }
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 2: readEntries on empty/nonexistent state
// ============================================================================

console.log("\n--- Test Group 2: Read on Empty State ---");

test("readEntries returns empty array when state file does not exist", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const entries = sm.readEntries();
    assert(Array.isArray(entries), "readEntries must return an array");
    assertEqual(entries.length, 0, "Should be empty when no state file");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("getCompositeHistory returns empty array when no history", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const history = sm.getCompositeHistory(10);
    assert(Array.isArray(history), "getCompositeHistory must return array");
    assertEqual(history.length, 0, "No history yet");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("getCategoryHistory returns empty array when no history", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const history = sm.getCategoryHistory("skill_invocation_fidelity", 5);
    assert(Array.isArray(history), "getCategoryHistory must return array");
    assertEqual(history.length, 0, "No history for category yet");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("computeDelta returns null when no history", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const delta = sm.computeDelta({ healthScore: { score: 75, grade: "C" }, categories: {} });
    assertEqual(delta, null, "computeDelta must return null with no history");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 3: appendEntry and JSONL persistence
// ============================================================================

console.log("\n--- Test Group 3: Append and Read ---");

test("appendEntry writes a line and readEntries returns it", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const entry = {
      timestamp: new Date().toISOString(),
      healthScore: { score: 85, grade: "B" },
      categories: { skill_invocation_fidelity: { score: 90, rating: "good" } },
      summary: { errors: 0, warnings: 1, info: 2 },
    };
    const saved = sm.appendEntry(entry);
    assert(saved === true, "appendEntry should return true on success");
    const entries = sm.readEntries();
    assertEqual(entries.length, 1, "Should have 1 entry after append");
    assertEqual(entries[0].healthScore.score, 85, "Persisted score must match");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("appendEntry writes multiple entries and preserves order", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const scores = [70, 75, 80];
    for (const s of scores) {
      sm.appendEntry({
        timestamp: new Date().toISOString(),
        healthScore: { score: s, grade: "B" },
        categories: {},
        summary: { errors: 0, warnings: 0, info: 0 },
      });
    }
    const entries = sm.readEntries();
    assertEqual(entries.length, 3, "Should have 3 entries");
    assertEqual(entries[0].healthScore.score, 70, "First entry");
    assertEqual(entries[2].healthScore.score, 80, "Last entry");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("appendEntry returns false when symlink guard rejects write", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => false); // guard always rejects
    const saved = sm.appendEntry({
      timestamp: new Date().toISOString(),
      healthScore: { score: 50, grade: "F" },
      categories: {},
      summary: { errors: 0, warnings: 0, info: 0 },
    });
    assertEqual(saved, false, "appendEntry should return false when guard rejects");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 4: getCompositeHistory and getCategoryHistory
// ============================================================================

console.log("\n--- Test Group 4: History Extraction ---");

test("getCompositeHistory returns correct scores in order", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const values = [60, 70, 80];
    for (const v of values) {
      sm.appendEntry({
        timestamp: new Date().toISOString(),
        healthScore: { score: v, grade: "C" },
        categories: {},
        summary: { errors: 0, warnings: 0, info: 0 },
      });
    }
    const history = sm.getCompositeHistory(10);
    assert(Array.isArray(history), "Must return array");
    assertEqual(history.length, 3, "Should have 3 scores");
    assertEqual(history[0], 60, "Oldest first");
    assertEqual(history[2], 80, "Newest last");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("getCategoryHistory extracts category scores correctly", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const catScores = [55, 65, 75];
    for (const s of catScores) {
      sm.appendEntry({
        timestamp: new Date().toISOString(),
        healthScore: { score: s, grade: "C" },
        categories: { skill_invocation_fidelity: { score: s, rating: "average" } },
        summary: { errors: 0, warnings: 0, info: 0 },
      });
    }
    const history = sm.getCategoryHistory("skill_invocation_fidelity", 10);
    assertEqual(history.length, 3, "Should have 3 category scores");
    assertEqual(history[0], 55, "Oldest category score");
    assertEqual(history[2], 75, "Newest category score");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// TEST GROUP 5: computeDelta
// ============================================================================

console.log("\n--- Test Group 5: Delta Computation ---");

test("computeDelta returns scoreDelta between previous and current", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    sm.appendEntry({
      timestamp: new Date().toISOString(),
      healthScore: { score: 70, grade: "C" },
      categories: { skill_invocation_fidelity: { score: 70, rating: "average" } },
      summary: { errors: 0, warnings: 0, info: 0 },
    });
    const current = {
      healthScore: { score: 80, grade: "B" },
      categories: { skill_invocation_fidelity: { score: 80, rating: "good" } },
    };
    const delta = sm.computeDelta(current);
    assert(delta !== null, "computeDelta should return object with history");
    assertEqual(delta.scoreBefore, 70, "scoreBefore");
    assertEqual(delta.scoreAfter, 80, "scoreAfter");
    assertEqual(delta.scoreDelta, 10, "scoreDelta");
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
    for (let i = 1; i <= 7; i++) {
      sm.appendEntry({
        timestamp: new Date().toISOString(),
        healthScore: { score: i * 10, grade: "C" },
        categories: {},
        summary: { errors: 0, warnings: 0, info: 0 },
      });
    }
    const recent = sm.getRecent(3);
    assertEqual(recent.length, 3, "Should return 3 most recent");
    assertEqual(recent[2].healthScore.score, 70, "Last is most recent");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
