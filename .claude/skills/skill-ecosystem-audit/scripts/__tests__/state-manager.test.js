#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * State Manager Tests for Skill Ecosystem Audit
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
  return fs.mkdtempSync(path.join(os.tmpdir(), "skill-audit-sm-test-"));
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
      frontmatter_schema: { score, rating: "good" },
      skill_to_skill_refs: { score, rating: "average" },
    },
    summary: { errors: 0, warnings: 1, info: 0 },
  };
}

// ============================================================================
// TEST GROUP 1: API shape
// ============================================================================

console.log("\n--- Test Group 1: API Shape ---");

test("createStateManager exposes all required methods including saveBaseline/loadBaseline", () => {
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
    assertEqual(entries.length, 0, "Must be empty");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("loadBaseline returns null when no baseline exists", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    assertEqual(sm.loadBaseline(), null, "Must return null");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("loadBaseline returns null for nonexistent root", () => {
  const missingRoot = path.join(os.tmpdir(), "nonexistent-skill-audit-test-xyz");
  const sm = createStateManager(missingRoot, () => true);
  assertEqual(sm.loadBaseline(), null, "Must return null for missing dir");
});

// ============================================================================
// TEST GROUP 3: appendEntry + readEntries
// ============================================================================

console.log("\n--- Test Group 3: Append and Read ---");

test("appendEntry returns true and entry is readable", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const saved = sm.appendEntry(makeSampleEntry(82));
    assertEqual(saved, true, "appendEntry should return true");
    const entries = sm.readEntries();
    assertEqual(entries.length, 1, "Should have 1 entry");
    assertEqual(entries[0].healthScore.score, 82, "Score must match");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("multiple entries preserve JSONL order", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const scores = [65, 72, 78, 85];
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
// TEST GROUP 4: Baseline save/load
// ============================================================================

console.log("\n--- Test Group 4: Baseline Save/Load ---");

test("saveBaseline returns true and loadBaseline returns the saved entry", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    const entry = makeSampleEntry(91);
    assertEqual(sm.saveBaseline(entry), true, "saveBaseline must return true");
    const loaded = sm.loadBaseline();
    assert(loaded !== null, "loadBaseline must return non-null");
    assertEqual(loaded.healthScore.score, 91, "Loaded score must match");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("saveBaseline returns false when guard rejects", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => false);
    assertEqual(sm.saveBaseline(makeSampleEntry(75)), false, "Must return false");
  } finally {
    cleanupTempRoot(tmpRoot);
  }
});

test("saveBaseline overwrites previous baseline", () => {
  const tmpRoot = makeTempRoot();
  try {
    const sm = createStateManager(tmpRoot, () => true);
    sm.saveBaseline(makeSampleEntry(70));
    sm.saveBaseline(makeSampleEntry(88));
    const loaded = sm.loadBaseline();
    assert(loaded !== null, "Baseline must exist");
    assertEqual(loaded.healthScore.score, 88, "Should have latest baseline");
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
    for (const s of [60, 70, 80]) sm.appendEntry(makeSampleEntry(s));
    const history = sm.getCompositeHistory(10);
    assertEqual(history.length, 3, "Should have 3 scores");
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
    const history = sm.getCategoryHistory("frontmatter_schema", 10);
    assertEqual(history.length, 3, "Should have 3 category scores");
    assertEqual(history[0], 55, "Oldest first");
    assertEqual(history[2], 75, "Newest last");
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
    sm.appendEntry(makeSampleEntry(68));
    const delta = sm.computeDelta({
      healthScore: { score: 80, grade: "B" },
      categories: { frontmatter_schema: { score: 80, rating: "good" } },
    });
    assert(delta !== null, "Delta must be non-null");
    assertEqual(delta.scoreBefore, 68, "scoreBefore");
    assertEqual(delta.scoreAfter, 80, "scoreAfter");
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
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
