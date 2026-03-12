#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Checker Regression Tests for TDMS Ecosystem Audit
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
    const r = fn();
    if (r && typeof r.then === "function") {
      throw new Error("Async tests are not supported in this runner (returned a Promise)");
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

function _assertEqual(actual, expected, message) {
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
let pipelineCorrectness, dataQualityDedup, fileIoSafety, roadmapIntegration, metricsReporting;

try {
  pipelineCorrectness = require(path.join(SCRIPTS_DIR, "checkers", "pipeline-correctness"));
  dataQualityDedup = require(path.join(SCRIPTS_DIR, "checkers", "data-quality-dedup"));
  fileIoSafety = require(path.join(SCRIPTS_DIR, "checkers", "file-io-safety"));
  roadmapIntegration = require(path.join(SCRIPTS_DIR, "checkers", "roadmap-integration"));
  metricsReporting = require(path.join(SCRIPTS_DIR, "checkers", "metrics-reporting"));
} catch (err) {
  let errMsg;
  if (err instanceof Error) {
    errMsg = err.message;
  } else {
    errMsg = String(err);
  }
  console.error(`Fatal: Could not load checker modules: ${errMsg}`);
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
  { checker: pipelineCorrectness, name: "pipeline-correctness" },
  { checker: dataQualityDedup, name: "data-quality-dedup" },
  { checker: fileIoSafety, name: "file-io-safety" },
  { checker: roadmapIntegration, name: "roadmap-integration" },
  { checker: metricsReporting, name: "metrics-reporting" },
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

test("pipeline-correctness has script_execution_order, data_flow_integrity, intake_pipeline", () => {
  const result = checkerResults["pipeline-correctness"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  for (const cat of ["script_execution_order", "data_flow_integrity", "intake_pipeline"]) {
    assert(cat in result.scores, `pipeline-correctness missing: ${cat}`);
  }
});

test("data-quality-dedup has dedup_algorithm_health, schema_compliance, content_hash_integrity, id_uniqueness_referential", () => {
  const result = checkerResults["data-quality-dedup"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  const expected = [
    "dedup_algorithm_health",
    "schema_compliance",
    "content_hash_integrity",
    "id_uniqueness_referential",
  ];
  for (const cat of expected) {
    assert(cat in result.scores, `data-quality-dedup missing: ${cat}`);
  }
});

test("file-io-safety has error_handling_coverage, master_deduped_sync, backup_atomicity", () => {
  const result = checkerResults["file-io-safety"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  for (const cat of ["error_handling_coverage", "master_deduped_sync", "backup_atomicity"]) {
    assert(cat in result.scores, `file-io-safety missing: ${cat}`);
  }
});

test("roadmap-integration has track_assignment_rules, roadmap_debt_cross_ref, sprint_file_alignment", () => {
  const result = checkerResults["roadmap-integration"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  for (const cat of ["track_assignment_rules", "roadmap_debt_cross_ref", "sprint_file_alignment"]) {
    assert(cat in result.scores, `roadmap-integration missing: ${cat}`);
  }
});

test("metrics-reporting has view_generation_accuracy, metrics_dashboard_correctness, audit_trail_completeness", () => {
  const result = checkerResults["metrics-reporting"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  for (const cat of [
    "view_generation_accuracy",
    "metrics_dashboard_correctness",
    "audit_trail_completeness",
  ]) {
    assert(cat in result.scores, `metrics-reporting missing: ${cat}`);
  }
});

// ============================================================================
// TEST GROUP 4: Score validity
// ============================================================================

console.log("\n--- Test Group 4: Score Validity ---");

test("all checker scores are in 0-100 range with valid ratings", () => {
  for (const { name } of CHECKERS) {
    const result = checkerResults[name];
    assert(result, `Missing smoke-test result for ${name} (check Test Group 2)`);
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

test("finding IDs are unique across all TDMS audit checkers", () => {
  const seen = new Set();
  const duplicates = [];
  for (const { name } of CHECKERS) {
    const result = checkerResults[name];
    assert(result, `Missing smoke-test result for ${name} (check Test Group 2)`);
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
    assert(result, `Missing smoke-test result for ${name} (check Test Group 2)`);
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
