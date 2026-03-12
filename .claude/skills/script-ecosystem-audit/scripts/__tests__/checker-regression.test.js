#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Checker Regression Tests for Script Ecosystem Audit
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

// ============================================================================
// LOAD CHECKERS
// ============================================================================

const SCRIPTS_DIR = path.join(__dirname, "..");
let moduleConsistency,
  safetyErrorHandling,
  registrationReachability,
  codeQuality,
  testingReliability;

try {
  moduleConsistency = require(path.join(SCRIPTS_DIR, "checkers", "module-consistency"));
  safetyErrorHandling = require(path.join(SCRIPTS_DIR, "checkers", "safety-error-handling"));
  registrationReachability = require(
    path.join(SCRIPTS_DIR, "checkers", "registration-reachability")
  );
  codeQuality = require(path.join(SCRIPTS_DIR, "checkers", "code-quality"));
  testingReliability = require(path.join(SCRIPTS_DIR, "checkers", "testing-reliability"));
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
  { checker: moduleConsistency, name: "module-consistency" },
  { checker: safetyErrorHandling, name: "safety-error-handling" },
  { checker: registrationReachability, name: "registration-reachability" },
  { checker: codeQuality, name: "code-quality" },
  { checker: testingReliability, name: "testing-reliability" },
];

// ============================================================================
// TEST GROUP 1: All checkers export a run function
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
// TEST GROUP 2: Checkers run without throwing
// ============================================================================

console.log("\n--- Test Group 2: Smoke Tests ---");

const checkerResults = {};

for (const { checker, name } of CHECKERS) {
  test(`${name} checker runs without throwing`, () => {
    const result = checker.run({ rootDir: ROOT_DIR });
    assert(typeof result === "object" && result !== null, "Result must be an object");
    assert(typeof result.domain === "string", "domain must be string");
    assert(Array.isArray(result.findings), "findings must be an array");
    assert(typeof result.scores === "object", "scores must be an object");
    assert(Object.keys(result.scores).length > 0, "scores must have categories");
    checkerResults[name] = result;
  });
}

// ============================================================================
// TEST GROUP 3: Domain-specific category presence
// ============================================================================

console.log("\n--- Test Group 3: Domain Category Presence ---");

test("module-consistency has cjs_esm_consistency, shebang_entry_point, nodejs_api_compatibility", () => {
  const result = checkerResults["module-consistency"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  assert("cjs_esm_consistency" in result.scores, "Missing cjs_esm_consistency");
  assert("shebang_entry_point" in result.scores, "Missing shebang_entry_point");
  assert("nodejs_api_compatibility" in result.scores, "Missing nodejs_api_compatibility");
});

test("safety-error-handling has file_io_safety, error_sanitization, path_traversal_guards, exec_safety, security_helper_usage", () => {
  const result = checkerResults["safety-error-handling"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  const expected = [
    "file_io_safety",
    "error_sanitization",
    "path_traversal_guards",
    "exec_safety",
    "security_helper_usage",
  ];
  for (const cat of expected) {
    assert(cat in result.scores, `safety-error-handling missing ${cat}`);
  }
});

test("registration-reachability has package_json_coverage, cross_script_dependencies, shared_lib_utilization", () => {
  const result = checkerResults["registration-reachability"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  assert("package_json_coverage" in result.scores, "Missing package_json_coverage");
  assert("cross_script_dependencies" in result.scores, "Missing cross_script_dependencies");
  assert("shared_lib_utilization" in result.scores, "Missing shared_lib_utilization");
});

test("code-quality has documentation_headers, consistent_patterns, dead_code, complexity", () => {
  const result = checkerResults["code-quality"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  const expected = ["documentation_headers", "consistent_patterns", "dead_code", "complexity"];
  for (const cat of expected) {
    assert(cat in result.scores, `code-quality missing ${cat}`);
  }
});

test("testing-reliability has test_coverage, test_freshness, error_path_testing", () => {
  const result = checkerResults["testing-reliability"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  assert("test_coverage" in result.scores, "Missing test_coverage");
  assert("test_freshness" in result.scores, "Missing test_freshness");
  assert("error_path_testing" in result.scores, "Missing error_path_testing");
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
// TEST GROUP 5: Finding ID uniqueness
// ============================================================================

console.log("\n--- Test Group 5: Finding ID Uniqueness ---");

test("finding IDs are unique across all script audit checkers", () => {
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
  assert(duplicates.length === 0, `Duplicate finding IDs: ${duplicates.join(", ")}`);
});

test("all findings have required fields (id, category, severity, message)", () => {
  const requiredFields = ["id", "category", "severity", "message"];
  const validSeverities = ["error", "warning", "info"];
  for (const { name } of CHECKERS) {
    const result = checkerResults[name];
    assert(result, `Missing smoke-test result for ${name} (check Test Group 2)`);
    for (const finding of result.findings) {
      for (const field of requiredFields) {
        assert(
          finding[field] !== undefined && finding[field] !== null,
          `Finding ${finding.id || "?"} in ${name} missing: ${field}`
        );
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
