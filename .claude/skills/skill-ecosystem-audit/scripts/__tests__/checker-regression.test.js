#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Checker Regression Tests for Skill Ecosystem Audit
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
// LOAD CHECKERS
// ============================================================================

const SCRIPTS_DIR = path.join(__dirname, "..");
let structuralCompliance,
  crossReferenceIntegrity,
  coverageConsistency,
  stalenessDrift,
  agentOrchestration;

try {
  structuralCompliance = require(path.join(SCRIPTS_DIR, "checkers", "structural-compliance"));
  crossReferenceIntegrity = require(
    path.join(SCRIPTS_DIR, "checkers", "cross-reference-integrity")
  );
  coverageConsistency = require(path.join(SCRIPTS_DIR, "checkers", "coverage-consistency"));
  stalenessDrift = require(path.join(SCRIPTS_DIR, "checkers", "staleness-drift"));
  agentOrchestration = require(path.join(SCRIPTS_DIR, "checkers", "agent-orchestration"));
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
  { checker: structuralCompliance, name: "structural-compliance" },
  { checker: crossReferenceIntegrity, name: "cross-reference-integrity" },
  { checker: coverageConsistency, name: "coverage-consistency" },
  { checker: stalenessDrift, name: "staleness-drift" },
  { checker: agentOrchestration, name: "agent-orchestration" },
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

test("structural-compliance has frontmatter_schema, step_continuity, section_structure, bloat_score", () => {
  const result = checkerResults["structural-compliance"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  for (const cat of ["frontmatter_schema", "step_continuity", "section_structure", "bloat_score"]) {
    assert(cat in result.scores, `structural-compliance missing: ${cat}`);
  }
});

test("cross-reference-integrity has skill_to_skill_refs, skill_to_script_refs, skill_to_template_refs, evidence_citation_validity, dependency_chain_health", () => {
  const result = checkerResults["cross-reference-integrity"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  const expected = [
    "skill_to_skill_refs",
    "skill_to_script_refs",
    "skill_to_template_refs",
    "evidence_citation_validity",
    "dependency_chain_health",
  ];
  for (const cat of expected) {
    assert(cat in result.scores, `cross-reference-integrity missing: ${cat}`);
  }
});

test("coverage-consistency has scope_boundary_clarity, trigger_accuracy, output_format_consistency, skill_registry_sync", () => {
  const result = checkerResults["coverage-consistency"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  const expected = [
    "scope_boundary_clarity",
    "trigger_accuracy",
    "output_format_consistency",
    "skill_registry_sync",
  ];
  for (const cat of expected) {
    assert(cat in result.scores, `coverage-consistency missing: ${cat}`);
  }
});

test("staleness-drift has version_history_currency, dead_skill_detection, pattern_reference_sync, inline_code_duplication", () => {
  const result = checkerResults["staleness-drift"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  const expected = [
    "version_history_currency",
    "dead_skill_detection",
    "pattern_reference_sync",
    "inline_code_duplication",
  ];
  for (const cat of expected) {
    assert(cat in result.scores, `staleness-drift missing: ${cat}`);
  }
});

test("agent-orchestration has agent_prompt_consistency, agent_skill_alignment, parallelization_correctness, team_config_health", () => {
  const result = checkerResults["agent-orchestration"];
  assert(result, "Missing smoke-test result (check Test Group 2)");
  const expected = [
    "agent_prompt_consistency",
    "agent_skill_alignment",
    "parallelization_correctness",
    "team_config_health",
  ];
  for (const cat of expected) {
    assert(cat in result.scores, `agent-orchestration missing: ${cat}`);
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

test("finding IDs are unique across all skill audit checkers", () => {
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
