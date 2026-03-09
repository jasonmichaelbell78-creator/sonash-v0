#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Checker Regression Tests for Session Ecosystem Audit
 *
 * Ensures all 5 domain checkers run without crashing, produce valid output
 * shapes, and that finding IDs are unique within the audit.
 *
 * Usage:
 *   node checker-regression.test.js
 *
 * Exit code: 0 if all pass, 1 if any fail.
 */

"use strict";

const path = require("node:path");
const fs = require("node:fs");

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
// LOAD CHECKERS
// ============================================================================

const SCRIPTS_DIR = path.join(__dirname, "..");
let lifecycleManagement,
  statePersistence,
  compactionResilience,
  crossSessionSafety,
  integrationConfig;

try {
  lifecycleManagement = require(path.join(SCRIPTS_DIR, "checkers", "lifecycle-management"));
  statePersistence = require(path.join(SCRIPTS_DIR, "checkers", "state-persistence"));
  compactionResilience = require(path.join(SCRIPTS_DIR, "checkers", "compaction-resilience"));
  crossSessionSafety = require(path.join(SCRIPTS_DIR, "checkers", "cross-session-safety"));
  integrationConfig = require(path.join(SCRIPTS_DIR, "checkers", "integration-config"));
} catch (err) {
  console.error(
    `Fatal: Could not load checker modules: ${err instanceof Error ? err.message : String(err)}`
  );
  process.exit(1);
}

function findProjectRoot() {
  let dir = SCRIPTS_DIR;
  const fsRoot = path.parse(dir).root;
  while (dir && dir !== fsRoot) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const next = path.dirname(dir);
    if (next === dir) break;
    dir = next;
  }
  return process.cwd();
}

const ROOT_DIR = findProjectRoot();

const CHECKERS = [
  { checker: lifecycleManagement, name: "lifecycle-management" },
  { checker: statePersistence, name: "state-persistence" },
  { checker: compactionResilience, name: "compaction-resilience" },
  { checker: crossSessionSafety, name: "cross-session-safety" },
  { checker: integrationConfig, name: "integration-config" },
];

// ============================================================================
// TEST GROUP 1: Exports
// ============================================================================

console.log("\n--- Test Group 1: Checker Exports ---");

test("all checkers export a run function", () => {
  for (const { checker, name } of CHECKERS) {
    assert(typeof checker.run === "function", `${name} must export run()`);
  }
});

test("all checkers export a DOMAIN string", () => {
  for (const { checker, name } of CHECKERS) {
    assert(typeof checker.DOMAIN === "string", `${name} must export DOMAIN`);
    assert(checker.DOMAIN.length > 0, `${name}.DOMAIN must not be empty`);
  }
});

// ============================================================================
// TEST GROUP 2: Smoke tests
// ============================================================================

console.log("\n--- Test Group 2: Smoke Tests ---");

const checkerResults = {};

for (const { checker, name } of CHECKERS) {
  test(`${name} checker runs without throwing`, () => {
    const result = checker.run({ rootDir: ROOT_DIR });
    assert(typeof result === "object" && result !== null, "Result must be object");
    assert(typeof result.domain === "string", "domain must be string");
    assert(Array.isArray(result.findings), "findings must be array");
    assert(typeof result.scores === "object", "scores must be object");
    assert(Object.keys(result.scores).length > 0, "scores must have categories");
    checkerResults[name] = result;
  });
}

// ============================================================================
// TEST GROUP 3: Domain-specific category presence
// ============================================================================

console.log("\n--- Test Group 3: Domain Category Presence ---");

test("lifecycle-management has session lifecycle categories", () => {
  const result = checkerResults["lifecycle-management"];
  if (!result) return;
  const expected = [
    "session_begin_completeness",
    "session_end_completeness",
    "session_counter_accuracy",
    "session_doc_freshness",
  ];
  for (const cat of expected) {
    assert(cat in result.scores, `lifecycle-management missing: ${cat}`);
  }
});

test("state-persistence has state persistence categories", () => {
  const result = checkerResults["state-persistence"];
  if (!result) return;
  const expected = [
    "handoff_file_schema",
    "commit_log_integrity",
    "task_state_file_health",
    "session_notes_quality",
  ];
  for (const cat of expected) {
    assert(cat in result.scores, `state-persistence missing: ${cat}`);
  }
});

test("compaction-resilience has compaction categories", () => {
  const result = checkerResults["compaction-resilience"];
  if (!result) return;
  const expected = [
    "layer_a_commit_tracker",
    "layer_c_precompact_save",
    "layer_d_gap_detection",
    "restore_output_quality",
  ];
  for (const cat of expected) {
    assert(cat in result.scores, `compaction-resilience missing: ${cat}`);
  }
});

test("cross-session-safety has safety categories", () => {
  const result = checkerResults["cross-session-safety"];
  if (!result) return;
  assert("begin_end_balance" in result.scores, "Missing begin_end_balance");
  assert("multi_session_validation" in result.scores, "Missing multi_session_validation");
});

test("integration-config has integration categories", () => {
  const result = checkerResults["integration-config"];
  if (!result) return;
  assert("hook_registration_alignment" in result.scores, "Missing hook_registration_alignment");
  assert("state_file_management" in result.scores, "Missing state_file_management");
});

// ============================================================================
// TEST GROUP 4: Score validity
// ============================================================================

console.log("\n--- Test Group 4: Score Validity ---");

test("all checker scores are in 0-100 range with valid ratings", () => {
  for (const { name } of CHECKERS) {
    const result = checkerResults[name];
    if (!result) continue;
    for (const [cat, scoreObj] of Object.entries(result.scores)) {
      const score = scoreObj.score;
      assert(
        typeof score === "number" && score >= 0 && score <= 100,
        `${name}/${cat} score (${score}) must be 0-100`
      );
      assert(
        ["good", "average", "poor"].includes(scoreObj.rating),
        `${name}/${cat} rating "${scoreObj.rating}" must be good/average/poor`
      );
    }
  }
});

// ============================================================================
// TEST GROUP 5: Finding uniqueness
// ============================================================================

console.log("\n--- Test Group 5: Finding ID Uniqueness ---");

test("finding IDs are unique across all session audit checkers", () => {
  const seen = new Set();
  const duplicates = [];
  for (const { name } of CHECKERS) {
    const result = checkerResults[name];
    if (!result) continue;
    for (const finding of result.findings) {
      if (seen.has(finding.id)) {
        duplicates.push(`${finding.id} (in ${name})`);
      }
      seen.add(finding.id);
    }
  }
  assert(duplicates.length === 0, `Duplicate IDs: ${duplicates.join(", ")}`);
});

test("all findings have required fields (id, category, severity, message)", () => {
  const requiredFields = ["id", "category", "severity", "message"];
  const validSeverities = ["error", "warning", "info"];
  for (const { name } of CHECKERS) {
    const result = checkerResults[name];
    if (!result) continue;
    for (const finding of result.findings) {
      for (const field of requiredFields) {
        assert(finding[field] != null, `Finding ${finding.id || "?"} in ${name} missing: ${field}`);
      }
      assert(
        validSeverities.includes(finding.severity),
        `Finding ${finding.id} in ${name} has invalid severity: ${finding.severity}`
      );
    }
  }
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
