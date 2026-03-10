#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Integration Tests for PR Ecosystem Audit
 *
 * Validates the v2 JSON output schema produced by the orchestrator
 * when run in --summary mode (via direct module composition, not spawning).
 *
 * Usage:
 *   node pr-ecosystem-audit-integration.test.js
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
let createStateManager;
let checkers;

try {
  ({ compositeScore, impactScore } = require(path.join(SCRIPTS_DIR, "lib", "scoring")));
  ({ CATEGORY_WEIGHTS } = require(path.join(SCRIPTS_DIR, "lib", "benchmarks")));
  ({ createStateManager } = require(path.join(SCRIPTS_DIR, "lib", "state-manager")));
  checkers = [
    require(path.join(SCRIPTS_DIR, "checkers", "process-compliance")),
    require(path.join(SCRIPTS_DIR, "checkers", "data-state-health")),
    require(path.join(SCRIPTS_DIR, "checkers", "pattern-lifecycle")),
    require(path.join(SCRIPTS_DIR, "checkers", "feedback-integration")),
    require(path.join(SCRIPTS_DIR, "checkers", "effectiveness-metrics")),
  ];
} catch (err) {
  console.error(
    `Fatal: Could not load audit modules: ${err instanceof Error ? err.message : String(err)}`
  );
  process.exit(1);
}

// ============================================================================
// BUILD FULL AUDIT RESULT (mirrors orchestrator logic)
// ============================================================================

function buildAuditResult() {
  const allFindings = [];
  const allScores = {};

  let runtimeFailIdx = 0;
  for (const checker of checkers) {
    try {
      const result = checker.run({ rootDir: ROOT_DIR });
      for (const [cat, score] of Object.entries(result.scores)) {
        if (cat in allScores) {
          const domain =
            typeof checker.DOMAIN === "string" && checker.DOMAIN ? checker.DOMAIN : "unknown";
          allFindings.push({
            id: `PEA-DUP-CAT-${cat}`,
            category: "audit_runtime",
            domain,
            severity: "warning",
            message: `Duplicate category key "${cat}" from checker ${domain}; keeping first value`,
            impactScore: 30,
          });
          continue;
        }
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
        id: `PEA-FAIL-${domain}-${runtimeFailIdx}`,
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
    healthScore: {
      score: composite.score,
      grade: composite.grade,
      breakdown: composite.breakdown,
    },
    categories: allScores,
    findings: allFindings,
    summary,
    patchableCount: allFindings.filter((f) => f.patchable).length,
  };
}

// Build once, use across all tests
let auditResult;
try {
  auditResult = buildAuditResult();
} catch (err) {
  console.error(`Fatal: audit build failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

// ============================================================================
// TEST GROUP 1: v2 JSON schema — top-level fields
// ============================================================================

console.log("\n--- Test Group 1: v2 JSON Schema ---");

test("result has version: 2", () => {
  assertEqual(auditResult.version, 2, "version must be 2");
});

test("result has valid ISO timestamp", () => {
  assert(typeof auditResult.timestamp === "string", "timestamp must be string");
  assert(!isNaN(Date.parse(auditResult.timestamp)), "timestamp must be valid ISO date");
});

test("result.healthScore has score, grade, breakdown", () => {
  const hs = auditResult.healthScore;
  assert(typeof hs.score === "number", "healthScore.score must be number");
  assert(hs.score >= 0 && hs.score <= 100, "healthScore.score must be 0-100");
  assert(["A", "B", "C", "D", "F"].includes(hs.grade), "grade must be A-F");
  assert(typeof hs.breakdown === "object", "breakdown must be object");
});

test("result.findings is an array", () => {
  assert(Array.isArray(auditResult.findings), "findings must be array");
});

test("result.summary has errors, warnings, info counts", () => {
  const { summary } = auditResult;
  assert(typeof summary.errors === "number", "summary.errors must be number");
  assert(typeof summary.warnings === "number", "summary.warnings must be number");
  assert(typeof summary.info === "number", "summary.info must be number");
  assert(summary.errors >= 0 && summary.warnings >= 0 && summary.info >= 0, "Counts non-negative");
});

test("summary counts match findings array length", () => {
  const { summary, findings } = auditResult;
  const total = summary.errors + summary.warnings + summary.info;
  assertEqual(total, findings.length, "summary total must equal findings count");
});

// ============================================================================
// TEST GROUP 2: Category scores in output
// ============================================================================

console.log("\n--- Test Group 2: Category Scores ---");

test("all CATEGORY_WEIGHTS keys appear in categories output", () => {
  for (const cat of Object.keys(CATEGORY_WEIGHTS)) {
    assert(cat in auditResult.categories, `Category ${cat} must appear in output`);
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
  const requiredFields = ["id", "category", "severity", "message"];
  for (const finding of auditResult.findings) {
    for (const field of requiredFields) {
      assert(
        finding[field] !== undefined && finding[field] !== null,
        `Finding ${finding.id || "?"} missing field: ${field}`
      );
    }
  }
});

test("findings are sorted by impactScore descending", () => {
  const findings = auditResult.findings;
  for (let i = 1; i < findings.length; i++) {
    const prev = findings[i - 1].impactScore || 0;
    const curr = findings[i].impactScore || 0;
    assert(
      prev >= curr,
      `Finding at ${i - 1} (impact ${prev}) must be >= finding at ${i} (${curr})`
    );
  }
});

// ============================================================================
// TEST GROUP 4: Orchestrator CLI flags documented
// ============================================================================

console.log("\n--- Test Group 4: Orchestrator CLI Flags ---");

test("orchestrator documents --check, --summary flags", () => {
  const orchestratorPath = path.join(SCRIPTS_DIR, "run-pr-ecosystem-audit.js");
  const content = fs.readFileSync(orchestratorPath, "utf8");
  assert(content.includes("--check"), "Orchestrator must document --check flag");
  assert(content.includes("--summary"), "Orchestrator must document --summary flag");
});

test("orchestrator uses compositeScore with CATEGORY_WEIGHTS", () => {
  const orchestratorPath = path.join(SCRIPTS_DIR, "run-pr-ecosystem-audit.js");
  const content = fs.readFileSync(orchestratorPath, "utf8");
  assert(content.includes("compositeScore"), "Orchestrator must call compositeScore");
  assert(content.includes("CATEGORY_WEIGHTS"), "Orchestrator must use CATEGORY_WEIGHTS");
});

// ============================================================================
// TEST GROUP 5: State manager integration
// ============================================================================

console.log("\n--- Test Group 5: State Manager Integration ---");

test("state manager can be created and returns no baseline (pr audit has no saveBaseline)", () => {
  const sm = createStateManager(ROOT_DIR, () => true);
  // PR audit state manager doesn't expose saveBaseline — verify it returns clean history
  const history = sm.getCompositeHistory(10);
  assert(Array.isArray(history), "getCompositeHistory must return array");
});

test("state manager readEntries returns array (even if state file missing)", () => {
  const sm = createStateManager(ROOT_DIR, () => false); // writes disabled
  const entries = sm.readEntries();
  assert(Array.isArray(entries), "readEntries must return array");
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
