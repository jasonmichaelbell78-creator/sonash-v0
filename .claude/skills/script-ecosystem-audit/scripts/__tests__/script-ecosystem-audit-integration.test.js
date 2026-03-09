#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Integration Tests for Script Ecosystem Audit
 *
 * Validates the v2 JSON output schema by running the full audit via
 * direct module composition (no subprocess spawn).
 *
 * Usage:
 *   node script-ecosystem-audit-integration.test.js
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
    require(path.join(SCRIPTS_DIR, "checkers", "module-consistency")),
    require(path.join(SCRIPTS_DIR, "checkers", "safety-error-handling")),
    require(path.join(SCRIPTS_DIR, "checkers", "registration-reachability")),
    require(path.join(SCRIPTS_DIR, "checkers", "code-quality")),
    require(path.join(SCRIPTS_DIR, "checkers", "testing-reliability")),
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

  let runtimeFailIdx = 0;
  for (const checker of checkers) {
    try {
      const result = checker.run({ rootDir: ROOT_DIR });
      for (const [cat, score] of Object.entries(result.scores)) {
        allScores[cat] = score;
      }
      for (const finding of result.findings) {
        allFindings.push({
          ...finding,
          impactScore: finding.impactScore ?? impactScore(finding),
        });
      }
    } catch (err) {
      runtimeFailIdx++;
      const domain =
        typeof checker.DOMAIN === "string" && checker.DOMAIN ? checker.DOMAIN : "unknown";
      allFindings.push({
        id: `SIA-FAIL-${domain}-${runtimeFailIdx}`,
        category: "audit_runtime",
        domain,
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
    else if (f.severity === "info") summary.info++;
    else summary.errors++;
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

test("result.timestamp is valid ISO date string", () => {
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

test("result.findings is array", () => {
  assert(Array.isArray(auditResult.findings), "findings must be array");
});

test("result.summary has non-negative errors/warnings/info", () => {
  const { summary } = auditResult;
  assert(typeof summary.errors === "number" && summary.errors >= 0, "errors must be >=0");
  assert(typeof summary.warnings === "number" && summary.warnings >= 0, "warnings must be >=0");
  assert(typeof summary.info === "number" && summary.info >= 0, "info must be >=0");
});

test("summary total matches findings count", () => {
  const { summary, findings } = auditResult;
  const total = summary.errors + summary.warnings + summary.info;
  assertEqual(total, findings.length, "summary total must equal findings count");
});

// ============================================================================
// TEST GROUP 2: Category output
// ============================================================================

console.log("\n--- Test Group 2: Category Output ---");

test("all CATEGORY_WEIGHTS categories appear in audit output", () => {
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

test("all findings have required fields", () => {
  const required = ["id", "category", "severity", "message"];
  for (const f of auditResult.findings) {
    for (const field of required) {
      assert(f[field] != null, `Finding ${f.id || "?"} missing field: ${field}`);
    }
  }
});

test("findings sorted by impactScore descending", () => {
  const { findings } = auditResult;
  for (let i = 1; i < findings.length; i++) {
    const prev = findings[i - 1].impactScore || 0;
    const curr = findings[i].impactScore || 0;
    assert(prev >= curr, `Findings must be sorted: ${i - 1}(${prev}) >= ${i}(${curr})`);
  }
});

// ============================================================================
// TEST GROUP 4: CLI flags documented in orchestrator
// ============================================================================

console.log("\n--- Test Group 4: Orchestrator ---");

test("orchestrator documents --check, --summary, --batch, --save-baseline", () => {
  const orch = path.join(SCRIPTS_DIR, "run-script-ecosystem-audit.js");
  const content = fs.readFileSync(orch, "utf8");
  assert(content.includes("--check"), "Must document --check");
  assert(content.includes("--summary"), "Must document --summary");
  assert(content.includes("--batch"), "Must document --batch");
  assert(content.includes("--save-baseline"), "Must document --save-baseline");
});

test("orchestrator loads all 5 checker files", () => {
  const orch = path.join(SCRIPTS_DIR, "run-script-ecosystem-audit.js");
  const content = fs.readFileSync(orch, "utf8");
  const checkerFiles = [
    "module-consistency",
    "safety-error-handling",
    "registration-reachability",
    "code-quality",
    "testing-reliability",
  ];
  for (const f of checkerFiles) {
    assert(content.includes(f), `Orchestrator must load checker: ${f}`);
  }
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
