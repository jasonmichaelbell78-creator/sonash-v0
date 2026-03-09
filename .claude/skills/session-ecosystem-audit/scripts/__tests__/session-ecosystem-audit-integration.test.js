#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Integration Tests for Session Ecosystem Audit
 *
 * Validates the v2 JSON output schema by running the full audit via
 * direct module composition (no subprocess spawn).
 *
 * Usage:
 *   node session-ecosystem-audit-integration.test.js
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
// LOAD MODULES
// ============================================================================

const SCRIPTS_DIR = path.join(__dirname, "..");

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

let compositeScore, impactScore;
let CATEGORY_WEIGHTS;
let checkers;

try {
  ({ compositeScore, impactScore } = require(path.join(SCRIPTS_DIR, "lib", "scoring")));
  ({ CATEGORY_WEIGHTS } = require(path.join(SCRIPTS_DIR, "lib", "benchmarks")));
  checkers = [
    require(path.join(SCRIPTS_DIR, "checkers", "lifecycle-management")),
    require(path.join(SCRIPTS_DIR, "checkers", "state-persistence")),
    require(path.join(SCRIPTS_DIR, "checkers", "compaction-resilience")),
    require(path.join(SCRIPTS_DIR, "checkers", "cross-session-safety")),
    require(path.join(SCRIPTS_DIR, "checkers", "integration-config")),
  ];
} catch (err) {
  console.error(
    `Fatal: Could not load modules: ${err instanceof Error ? err.message : String(err)}`
  );
  process.exit(1);
}

// ============================================================================
// BUILD AUDIT RESULT
// ============================================================================

function buildAuditResult() {
  const allFindings = [];
  const allScores = {};

  for (const checker of checkers) {
    try {
      const result = checker.run({ rootDir: ROOT_DIR });
      for (const [cat, score] of Object.entries(result.scores)) {
        allScores[cat] = score;
      }
      for (const finding of result.findings) {
        finding.impactScore = finding.impactScore ?? impactScore(finding);
        allFindings.push(finding);
      }
    } catch (err) {
      allFindings.push({
        id: `SEA-FAIL-${checker.DOMAIN}`,
        category: "audit_runtime",
        domain: checker.DOMAIN,
        severity: "error",
        message: `Checker failed: ${err instanceof Error ? err.message : String(err)}`,
        impactScore: 90,
      });
    }
  }

  allFindings.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));

  const composite = compositeScore(allScores, CATEGORY_WEIGHTS);
  const summary = { errors: 0, warnings: 0, info: 0 };
  for (const f of allFindings) {
    if (f.severity === "error") summary.errors++;
    else if (f.severity === "warning") summary.warnings++;
    else summary.info++;
  }

  return {
    version: 2,
    timestamp: new Date().toISOString(),
    healthScore: { score: composite.score, grade: composite.grade, breakdown: composite.breakdown },
    categories: allScores,
    findings: allFindings,
    summary,
    patchableCount: allFindings.filter((f) => f.patchable).length,
  };
}

let auditResult;
try {
  auditResult = buildAuditResult();
} catch (err) {
  console.error(`Fatal: audit build failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

// ============================================================================
// TEST GROUP 1: v2 JSON schema
// ============================================================================

console.log("\n--- Test Group 1: v2 JSON Schema ---");

test("result.version equals 2", () => {
  assertEqual(auditResult.version, 2, "version must be 2");
});

test("result.timestamp is a valid ISO date string", () => {
  assert(typeof auditResult.timestamp === "string", "timestamp must be string");
  assert(!isNaN(Date.parse(auditResult.timestamp)), "timestamp must be valid ISO date");
});

test("result.healthScore has score(0-100), grade(A-F), breakdown", () => {
  const { healthScore } = auditResult;
  assert(typeof healthScore.score === "number", "score must be number");
  assert(healthScore.score >= 0 && healthScore.score <= 100, "score must be 0-100");
  assert(["A", "B", "C", "D", "F"].includes(healthScore.grade), "grade must be A-F");
  assert(typeof healthScore.breakdown === "object", "breakdown must be object");
});

test("result.findings is an array", () => {
  assert(Array.isArray(auditResult.findings), "findings must be array");
});

test("result.summary has non-negative errors/warnings/info", () => {
  const { summary } = auditResult;
  assert(summary.errors >= 0, "errors >= 0");
  assert(summary.warnings >= 0, "warnings >= 0");
  assert(summary.info >= 0, "info >= 0");
});

test("summary total matches findings array length", () => {
  const { summary, findings } = auditResult;
  const total = summary.errors + summary.warnings + summary.info;
  assertEqual(total, findings.length, "summary total must equal findings count");
});

// ============================================================================
// TEST GROUP 2: Category coverage
// ============================================================================

console.log("\n--- Test Group 2: Category Coverage ---");

test("all 16 CATEGORY_WEIGHTS categories appear in output", () => {
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    assert(cat in auditResult.categories, `Category ${cat} missing from output`);
  }
});

test("all category scores are numbers in 0-100", () => {
  for (const [cat, scoreObj] of Object.entries(auditResult.categories)) {
    assert(typeof scoreObj.score === "number", `${cat}.score must be number`);
    assert(scoreObj.score >= 0 && scoreObj.score <= 100, `${cat}.score must be 0-100`);
  }
});

// ============================================================================
// TEST GROUP 3: Findings schema
// ============================================================================

console.log("\n--- Test Group 3: Findings Schema ---");

test("all findings have id, category, severity, message", () => {
  for (const f of auditResult.findings) {
    assert(f.id != null, `Finding missing id`);
    assert(f.category != null, `Finding ${f.id} missing category`);
    assert(f.severity != null, `Finding ${f.id} missing severity`);
    assert(f.message != null, `Finding ${f.id} missing message`);
  }
});

test("findings are sorted by impactScore descending", () => {
  const { findings } = auditResult;
  for (let i = 1; i < findings.length; i++) {
    const prev = findings[i - 1].impactScore || 0;
    const curr = findings[i].impactScore || 0;
    assert(prev >= curr, `Finding ${i - 1}(${prev}) must be >= ${i}(${curr})`);
  }
});

// ============================================================================
// TEST GROUP 4: Orchestrator
// ============================================================================

console.log("\n--- Test Group 4: Orchestrator ---");

test("orchestrator documents --check and --summary flags", () => {
  const orch = path.join(SCRIPTS_DIR, "run-session-ecosystem-audit.js");
  const content = fs.readFileSync(orch, "utf8");
  assert(content.includes("--check"), "Must document --check");
  assert(content.includes("--summary"), "Must document --summary");
});

test("orchestrator loads all 5 checker files", () => {
  const orch = path.join(SCRIPTS_DIR, "run-session-ecosystem-audit.js");
  const content = fs.readFileSync(orch, "utf8");
  const checkerFiles = [
    "lifecycle-management",
    "state-persistence",
    "compaction-resilience",
    "cross-session-safety",
    "integration-config",
  ];
  for (const f of checkerFiles) {
    assert(content.includes(f), `Orchestrator must load: ${f}`);
  }
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
