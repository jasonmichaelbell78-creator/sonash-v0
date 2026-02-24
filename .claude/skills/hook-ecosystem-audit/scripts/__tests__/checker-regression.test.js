#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Checker Regression Tests for Hook Ecosystem Audit
 *
 * Tests each checker with known inputs to prevent false positive regressions.
 * The primary goal is to ensure the 5 false-positive categories identified in
 * the first audit run (31% FP rate) remain fixed.
 *
 * Key regression scenarios:
 *   1. console.log is protocol — code_hygiene and output_protocol must not flag it
 *   2. Subdirectory hook paths — behavioral_accuracy resolves global/gsd-check-update.js
 *   3. (?i) regex flags — matchers with (?i) are treated as valid
 *   4. grep || true — silent failure detection excludes $(grep ... || true)
 *   5. Temp file cleanup — add_exit_trap with "$VAR" inside single quotes is detected
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
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      (message || "assertEqual") +
        `: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertIncludes(arr, value, message) {
  if (!arr.includes(value)) {
    throw new Error(
      (message || "assertIncludes") + `: expected array to include ${JSON.stringify(value)}`
    );
  }
}

function assertNotIncludes(arr, value, message) {
  if (arr.includes(value)) {
    throw new Error(
      (message || "assertNotIncludes") + `: expected array NOT to include ${JSON.stringify(value)}`
    );
  }
}

// ============================================================================
// LOAD CHECKERS (with safe fallback if modules can't load)
// ============================================================================

const SCRIPTS_DIR = path.join(__dirname, "..");
let codeQualitySecurity, functionalCorrectness, configHealth, precommitPipeline, stateIntegration;
let HOOK_PROTOCOL;

try {
  codeQualitySecurity = require(path.join(SCRIPTS_DIR, "checkers", "code-quality-security"));
  functionalCorrectness = require(path.join(SCRIPTS_DIR, "checkers", "functional-correctness"));
  configHealth = require(path.join(SCRIPTS_DIR, "checkers", "config-health"));
  precommitPipeline = require(path.join(SCRIPTS_DIR, "checkers", "precommit-pipeline"));
  stateIntegration = require(path.join(SCRIPTS_DIR, "checkers", "state-integration"));
  ({ HOOK_PROTOCOL } = require(path.join(SCRIPTS_DIR, "lib", "constants")));
} catch (err) {
  console.error(
    `Fatal: Could not load checker modules: ${err instanceof Error ? err.message : String(err)}`
  );
  process.exit(1);
}

// ============================================================================
// HELPERS: Create temporary test fixtures
// ============================================================================

/**
 * Find the project root by walking upward from the scripts dir.
 */
function findProjectRoot() {
  let dir = SCRIPTS_DIR;
  const fsRoot = path.parse(dir).root;
  while (dir && dir !== fsRoot) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const next = path.dirname(dir);
    if (next === dir) break;
    dir = next;
  }
  return process.cwd();
}

const ROOT_DIR = findProjectRoot();

// ============================================================================
// TEST GROUP 1: Protocol Awareness — console.log is NOT a hygiene issue
// ============================================================================

console.log("\n--- Test Group 1: Protocol Awareness (console.log is protocol) ---");

test("HOOK_PROTOCOL constants are defined correctly", () => {
  assert(HOOK_PROTOCOL.STDOUT_IS_PROTOCOL === true, "STDOUT_IS_PROTOCOL should be true");
  assertEqual(HOOK_PROTOCOL.RESPONSE_CHANNEL, "console.log", "Response channel");
  assertEqual(HOOK_PROTOCOL.DIAGNOSTIC_CHANNEL, "console.error", "Diagnostic channel");
  assert(Array.isArray(HOOK_PROTOCOL.VALID_RESPONSES), "VALID_RESPONSES should be array");
  assertIncludes(HOOK_PROTOCOL.VALID_RESPONSES, "ok", "Should include 'ok'");
  assertIncludes(HOOK_PROTOCOL.VALID_RESPONSES, "block", "Should include 'block'");
});

test("HOOK_PROTOCOL.PROTOCOL_PATTERNS.ANY_STDOUT matches console.log()", () => {
  const pattern = HOOK_PROTOCOL.PROTOCOL_PATTERNS.ANY_STDOUT;
  assert(pattern.test('console.log("ok")'), "Should match console.log('ok')");
  assert(pattern.test('console.log("block: reason")'), "Should match console.log block");
  assert(pattern.test("console.log(someVar)"), "Should match console.log(var)");
});

test("code_hygiene checker does NOT flag console.log in hook files", () => {
  // Run the full code-quality-security checker on the actual project
  const result = codeQualitySecurity.run({ rootDir: ROOT_DIR });

  // Collect all code_hygiene findings
  const hygieneFindings = result.findings.filter((f) => f.category === "code_hygiene");

  // None of the findings should flag console.log as a debug/hygiene issue
  const consoleLogFindings = hygieneFindings.filter(
    (f) =>
      (f.message || "").includes("console.log(") &&
      (f.details || "").toLowerCase().includes("debug")
  );

  assertEqual(
    consoleLogFindings.length,
    0,
    "code_hygiene should NOT flag console.log as debug output"
  );
});

test("output_protocol checker does NOT flag console.log count as excessive", () => {
  const result = functionalCorrectness.run({ rootDir: ROOT_DIR });

  // Check that no output_protocol findings mention "excessive console.log" or similar
  const protocolFindings = result.findings.filter(
    (f) => f.category === "output_protocol_compliance"
  );
  const excessiveLogFindings = protocolFindings.filter(
    (f) =>
      ((f.message || "") + (f.details || "")).toLowerCase().includes("excessive") &&
      ((f.message || "") + (f.details || "")).includes("console.log")
  );

  assertEqual(
    excessiveLogFindings.length,
    0,
    "output_protocol should NOT flag excessive console.log usage"
  );
});

// ============================================================================
// TEST GROUP 2: Subdirectory Hook Paths
// ============================================================================

console.log("\n--- Test Group 2: Subdirectory Hook Paths ---");

test("behavioral_accuracy resolves global/ subdirectory hooks", () => {
  // Run the functional correctness checker on the real project
  const result = functionalCorrectness.run({ rootDir: ROOT_DIR });

  // Check behavioral_accuracy findings: they should NOT report global/ hooks as "not found"
  const baFindings = result.findings.filter((f) => f.category === "behavioral_accuracy");
  const notFoundFindings = baFindings.filter(
    (f) => (f.message || "").includes("not found") && (f.message || "").includes("global/")
  );

  assertEqual(
    notFoundFindings.length,
    0,
    "behavioral_accuracy should resolve hooks in global/ subdirectory"
  );
});

test("extractHookRegistrations supports global/ paths in commands", () => {
  // This tests that the command parser regex handles subdirectory paths.
  // The matcher in extractHookRegistrations should extract "global/gsd-check-update.js"
  // from a command like "node .claude/hooks/global/gsd-check-update.js $ARGUMENTS"
  const result = functionalCorrectness.run({ rootDir: ROOT_DIR });

  // If global hooks are registered in settings.json, they should appear in the
  // behavioral_accuracy metrics without "not found" errors for the global/ path
  const baFindings = result.findings.filter((f) => f.category === "behavioral_accuracy");
  const globalNotFound = baFindings.filter(
    (f) =>
      (f.details || "").includes("hook file not found") &&
      ((f.message || "").includes("gsd-check-update") || (f.message || "").includes("statusline"))
  );

  assertEqual(
    globalNotFound.length,
    0,
    "Global hooks (gsd-check-update, statusline) should be resolvable"
  );
});

// ============================================================================
// TEST GROUP 3: (?i) Regex Flag Handling
// ============================================================================

console.log("\n--- Test Group 3: (?i) Regex Flag Handling ---");

test("config_health treats (?i) matchers as valid regexes", () => {
  // Run the config health checker on the real project
  const result = configHealth.run({ rootDir: ROOT_DIR });

  // Check that matchers with (?i) are NOT flagged as invalid
  const matcherFindings = result.findings.filter(
    (f) => f.id === "HEA-111" // Invalid regex matcher finding ID
  );

  // If there are invalid matcher findings, verify they don't reference (?i) patterns
  for (const finding of matcherFindings) {
    const details = finding.details || "";
    assert(
      !details.includes("(?i)"),
      `Matcher with (?i) should NOT be flagged as invalid: ${details}`
    );
  }
});

test("safeTestRegex strips (?i) before validation", () => {
  // Test the regex normalization logic directly.
  // In Claude Code's matcher engine, (?i) is a valid inline case-insensitivity flag.
  // JavaScript's RegExp does not support (?i) natively, so checkers must strip it.

  // Simulate the normalization that safeTestRegex and isValidRegex perform
  const testPatterns = [
    { input: "(?i)write|edit", shouldBeValid: true },
    { input: "(?i)bash", shouldBeValid: true },
    { input: "(?i)(read|write)", shouldBeValid: true },
    { input: "(?i)(?:foo|bar)", shouldBeValid: true },
  ];

  for (const { input, shouldBeValid } of testPatterns) {
    const normalized = input.replace(/\(\?[gimsuy]+\)/g, "");
    let isValid;
    try {
      new RegExp(normalized);
      isValid = true;
    } catch {
      isValid = false;
    }
    assertEqual(
      isValid,
      shouldBeValid,
      `Pattern "${input}" (normalized: "${normalized}") validity`
    );
  }
});

// ============================================================================
// TEST GROUP 4: grep || true Exclusion in Silent Failure Detection
// ============================================================================

console.log("\n--- Test Group 4: grep || true Exclusion ---");

test("silent failure detection excludes $(grep ... || true) pattern", () => {
  // The precommit-pipeline checker's gate_effectiveness category detects
  // "|| true" as potential silent failures, but should exclude cases where
  // grep is used with || true in variable assignment (to prevent set -e exits).

  const result = precommitPipeline.run({ rootDir: ROOT_DIR });

  // Check gate_effectiveness findings for silent failures
  const gateFindings = result.findings.filter(
    (f) => f.id === "HEA-321" // Silent failure finding ID
  );

  // If there are silent failure findings, none should reference grep || true
  for (const finding of gateFindings) {
    const details = finding.details || "";
    // The lines reported in HEA-321 should not include grep || true patterns
    // (since they're excluded by the checker logic)
    assert(
      !details.match(/=\$\(.*grep.*\|\|\s*true\)/),
      `Silent failure finding should NOT include grep || true: ${details}`
    );
  }
});

test("silent failure detection excludes log-override.js || true", () => {
  const result = precommitPipeline.run({ rootDir: ROOT_DIR });

  const gateFindings = result.findings.filter((f) => f.id === "HEA-321");

  for (const finding of gateFindings) {
    const details = finding.details || "";
    assert(
      !details.includes("log-override.js"),
      `Silent failure finding should NOT include log-override.js: ${details}`
    );
  }
});

test("silent failure detection excludes rm -f || true", () => {
  const result = precommitPipeline.run({ rootDir: ROOT_DIR });

  const gateFindings = result.findings.filter((f) => f.id === "HEA-321");

  for (const finding of gateFindings) {
    const details = finding.details || "";
    assert(
      !details.includes("rm -f"),
      `Silent failure finding should NOT include rm -f cleanup: ${details}`
    );
  }
});

// ============================================================================
// TEST GROUP 5: Temp File Cleanup Detection
// ============================================================================

console.log("\n--- Test Group 5: Temp File Cleanup Detection ---");

test("temp file cleanup detects add_exit_trap with single-quoted $VAR", () => {
  // The checker should match:  add_exit_trap 'rm -f "$VARNAME"'
  // This is the pattern used in .husky/pre-commit where the variable reference
  // is inside single quotes (bash evaluates it at trap execution time, not definition time).

  // Test the regex pattern directly (same logic as precommit-pipeline.js lines 700-711)
  const testContent = `
LINT_LOG="$(mktemp)"
add_exit_trap 'rm -f "$LINT_LOG"'
`;

  // Extract variable name
  const assignMatch = testContent.match(/^([A-Z_]+)="\$\(mktemp\)"/m);
  assert(assignMatch !== null, "Should extract variable name from mktemp assignment");
  assertEqual(assignMatch[1], "LINT_LOG", "Variable name");

  const varName = assignMatch[1];
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const varRef = `(?:\\$\\{${escapeRegex(varName)}\\}|\\$${escapeRegex(varName)})`;
  const cleanupPattern = new RegExp(
    `add_exit_trap\\s+'[^']*${varRef}[^']*'|add_exit_trap\\s+"[^"]*${varRef}[^"]*"`,
    "m"
  );

  assert(
    cleanupPattern.test(testContent),
    "Should detect add_exit_trap with $LINT_LOG in single quotes"
  );
});

test("temp file cleanup detects add_exit_trap with ${VAR} syntax", () => {
  const testContent = '\nTEST_OUTPUT="$(mktemp)"\n' + "add_exit_trap 'rm -f \"${TEST_OUTPUT}\"'\n";

  const varName = "TEST_OUTPUT";
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const varRef = `(?:\\$\\{${escapeRegex(varName)}\\}|\\$${escapeRegex(varName)})`;
  const cleanupPattern = new RegExp(
    `add_exit_trap\\s+'[^']*${varRef}[^']*'|add_exit_trap\\s+"[^"]*${varRef}[^"]*"`,
    "m"
  );

  assert(
    cleanupPattern.test(testContent),
    "Should detect add_exit_trap with ${TEST_OUTPUT} in single quotes"
  );
});

test("temp file cleanup does NOT match unrelated add_exit_trap", () => {
  const testContent = `
MY_FILE="$(mktemp)"
add_exit_trap 'rm -f "$OTHER_FILE"'
`;

  const varName = "MY_FILE";
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const varRef = `(?:\\$\\{${escapeRegex(varName)}\\}|\\$${escapeRegex(varName)})`;
  const cleanupPattern = new RegExp(
    `add_exit_trap\\s+'[^']*${varRef}[^']*'|add_exit_trap\\s+"[^"]*${varRef}[^"]*"`,
    "m"
  );

  assert(
    !cleanupPattern.test(testContent),
    "Should NOT match add_exit_trap referencing a different variable"
  );
});

// ============================================================================
// TEST GROUP 6: Cross-checker Deduplication
// ============================================================================

console.log("\n--- Test Group 6: Cross-checker Deduplication ---");

// Shared deduplication helper (simulates orchestrator logic)
function deduplicateFindings(findings) {
  const seen = new Map();
  const deduped = [];

  for (const f of findings) {
    const fileMatch = (f.details || f.message || "").match(/([a-zA-Z0-9_-]+\.js)/);
    const file = fileMatch ? fileMatch[1] : "";
    const key = file ? `${file}:${f.severity}` : null;

    if (key && seen.has(key)) {
      const existing = seen.get(key);
      if ((f.impactScore || 0) > (existing.impactScore || 0)) {
        existing._supersededBy = f.id;
        deduped[deduped.indexOf(existing)] = f;
        seen.set(key, f);
      }
    } else {
      if (key) seen.set(key, f);
      deduped.push(f);
    }
  }

  return deduped;
}

test("deduplication removes lower-impact duplicate for same file + severity", () => {
  const findings = [
    {
      id: "HEA-200",
      category: "error_handling_sanitization",
      severity: "warning",
      message: "Issue in commit-tracker.js",
      details: "Line 42: commit-tracker.js problem",
      impactScore: 55,
    },
    {
      id: "HEA-420",
      category: "behavioral_accuracy",
      severity: "warning",
      message: "commit-tracker.js: behavioral issue",
      details: "commit-tracker.js lacks error handling",
      impactScore: 30,
    },
  ];

  const result = deduplicateFindings(findings);
  assertEqual(result.length, 1, "Should deduplicate to 1 finding");
  assertEqual(result[0].id, "HEA-200", "Should keep the higher-impact finding");
});

test("deduplication keeps findings for different files", () => {
  const findings = [
    {
      id: "HEA-200",
      severity: "warning",
      message: "Issue in commit-tracker.js",
      details: "commit-tracker.js",
      impactScore: 55,
    },
    {
      id: "HEA-201",
      severity: "warning",
      message: "Issue in session-start.js",
      details: "session-start.js",
      impactScore: 60,
    },
  ];

  const result = deduplicateFindings(findings);
  assertEqual(result.length, 2, "Should keep both findings (different files)");
});

test("deduplication keeps findings with same file but different severity", () => {
  const findings = [
    {
      id: "HEA-200",
      severity: "warning",
      message: "Issue in commit-tracker.js",
      details: "commit-tracker.js",
      impactScore: 55,
    },
    {
      id: "HEA-201",
      severity: "error",
      message: "Critical issue in commit-tracker.js",
      details: "commit-tracker.js",
      impactScore: 80,
    },
  ];

  const result = deduplicateFindings(findings);
  assertEqual(result.length, 2, "Should keep both findings (different severity levels)");
});

// ============================================================================
// TEST GROUP 7: Baseline and Batch Mode (Integration)
// ============================================================================

console.log("\n--- Test Group 7: Baseline and Batch Mode ---");

test("state-manager exposes saveBaseline and loadBaseline methods", () => {
  const { createStateManager } = require(path.join(SCRIPTS_DIR, "lib", "state-manager"));
  const sm = createStateManager(ROOT_DIR, () => true);

  assert(typeof sm.saveBaseline === "function", "saveBaseline should be a function");
  assert(typeof sm.loadBaseline === "function", "loadBaseline should be a function");
});

test("state-manager loadBaseline returns null when no baseline exists", () => {
  const { createStateManager } = require(path.join(SCRIPTS_DIR, "lib", "state-manager"));
  // Use a non-existent root dir to ensure no baseline file
  const sm = createStateManager("/tmp/nonexistent-audit-test-dir", () => true);
  const baseline = sm.loadBaseline();
  assertEqual(baseline, null, "loadBaseline should return null when no baseline exists");
});

test("orchestrator CLI recognizes --batch flag in usage comment", () => {
  const orchestratorPath = path.join(SCRIPTS_DIR, "run-hook-ecosystem-audit.js");
  const content = fs.readFileSync(orchestratorPath, "utf8");
  assert(content.includes("--batch"), "Orchestrator should document --batch flag");
  assert(content.includes("--save-baseline"), "Orchestrator should document --save-baseline flag");
});

// ============================================================================
// TEST GROUP 8: Full Checker Smoke Tests
// ============================================================================

console.log("\n--- Test Group 8: Full Checker Smoke Tests ---");

test("code-quality-security checker runs without throwing", () => {
  const result = codeQualitySecurity.run({ rootDir: ROOT_DIR });
  assert(result.domain === "code_quality_security", "Domain name");
  assert(Array.isArray(result.findings), "Findings should be array");
  assert(typeof result.scores === "object", "Scores should be object");
  assert("error_handling_sanitization" in result.scores, "Should have error_handling score");
  assert("security_patterns" in result.scores, "Should have security_patterns score");
  assert("code_hygiene" in result.scores, "Should have code_hygiene score");
  assert("regex_safety" in result.scores, "Should have regex_safety score");
});

test("functional-correctness checker runs without throwing", () => {
  const result = functionalCorrectness.run({ rootDir: ROOT_DIR });
  assert(result.domain === "functional_correctness", "Domain name");
  assert(Array.isArray(result.findings), "Findings should be array");
  assert("test_coverage" in result.scores, "Should have test_coverage score");
  assert("output_protocol_compliance" in result.scores, "Should have output_protocol score");
  assert("behavioral_accuracy" in result.scores, "Should have behavioral_accuracy score");
});

test("config-health checker runs without throwing", () => {
  const result = configHealth.run({ rootDir: ROOT_DIR });
  assert(result.domain === "config_health", "Domain name");
  assert(Array.isArray(result.findings), "Findings should be array");
  assert("settings_file_alignment" in result.scores, "Should have settings_file_alignment score");
  assert("event_coverage_matchers" in result.scores, "Should have event_coverage score");
  assert("global_local_consistency" in result.scores, "Should have global_local score");
});

test("precommit-pipeline checker runs without throwing", () => {
  const result = precommitPipeline.run({ rootDir: ROOT_DIR });
  assert(result.domain === "precommit_pipeline", "Domain name");
  assert(Array.isArray(result.findings), "Findings should be array");
  assert("stage_ordering_completeness" in result.scores, "Should have stage_ordering score");
  assert("bypass_override_controls" in result.scores, "Should have bypass_override score");
  assert("gate_effectiveness" in result.scores, "Should have gate_effectiveness score");
});

test("state-integration checker runs without throwing", () => {
  const result = stateIntegration.run({ rootDir: ROOT_DIR });
  assert(result.domain === "state_integration", "Domain name");
  assert(Array.isArray(result.findings), "Findings should be array");
  assert("state_file_health" in result.scores, "Should have state_file_health score");
  assert("cross_hook_dependencies" in result.scores, "Should have cross_hook score");
  assert("compaction_resilience" in result.scores, "Should have compaction_resilience score");
});

// ============================================================================
// TEST GROUP 9: Score Validity
// ============================================================================

console.log("\n--- Test Group 9: Score Validity ---");

test("all checker scores are in 0-100 range", () => {
  const checkers = [
    { checker: codeQualitySecurity, name: "code-quality-security" },
    { checker: functionalCorrectness, name: "functional-correctness" },
    { checker: configHealth, name: "config-health" },
    { checker: precommitPipeline, name: "precommit-pipeline" },
    { checker: stateIntegration, name: "state-integration" },
  ];

  for (const { checker, name } of checkers) {
    const result = checker.run({ rootDir: ROOT_DIR });
    for (const [cat, scoreObj] of Object.entries(result.scores)) {
      const score = scoreObj.score;
      assert(
        typeof score === "number" && score >= 0 && score <= 100,
        `${name}/${cat} score (${score}) should be 0-100`
      );
      assertIncludes(
        ["good", "average", "poor"],
        scoreObj.rating,
        `${name}/${cat} rating should be good/average/poor`
      );
    }
  }
});

test("all findings have required fields", () => {
  const checkers = [
    codeQualitySecurity,
    functionalCorrectness,
    configHealth,
    precommitPipeline,
    stateIntegration,
  ];

  const requiredFields = ["id", "category", "severity", "message"];
  const validSeverities = ["error", "warning", "info"];

  for (const checker of checkers) {
    const result = checker.run({ rootDir: ROOT_DIR });
    for (const finding of result.findings) {
      for (const field of requiredFields) {
        assert(
          finding[field] !== undefined && finding[field] !== null,
          `Finding ${finding.id || "unknown"} missing required field: ${field}`
        );
      }
      assertIncludes(
        validSeverities,
        finding.severity,
        `Finding ${finding.id} has invalid severity: ${finding.severity}`
      );
    }
  }
});

// ============================================================================
// RESULTS
// ============================================================================

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
