#!/usr/bin/env node
/* global __dirname */
/* eslint-disable security/detect-non-literal-fs-filename */
/**
 * test-hooks.js - Hook Health Test Suite
 *
 * Validates all Claude Code hooks are working correctly.
 * Run with: npm run hooks:test
 *
 * Tests:
 * 1. Syntax validation (can file be parsed?)
 * 2. Basic execution (does hook run without crash?)
 * 3. Expected behavior (does hook respond correctly to test inputs?)
 *
 * From HOOKIFY_STRATEGY.md: Hook Health Infrastructure
 */

const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Get project directory with path containment validation
const projectDir = path.resolve(__dirname, "..");
const hooksDir = path.join(projectDir, ".claude", "hooks");

// Security: Verify hooksDir is within projectDir (path containment check)
// Use regex for ".." detection (handles .., ../, ..\ edge cases, avoids false positives like "..hidden")
const relHooksDir = path.relative(projectDir, hooksDir);
if (/^\.\.(?:[\\/]|$)/.test(relHooksDir) || relHooksDir === "" || path.isAbsolute(relHooksDir)) {
  console.error("Security error: hooks directory escapes project boundary");
  process.exit(1);
}

// Test definitions for each hook
// Note: Some hooks read files from disk, so we test with paths that skip checks
const HOOK_TESTS = {
  // PostToolUse Write/Edit hooks
  "pattern-check.js": {
    description: "Pattern compliance checker",
    // Note: This hook exits cleanly without outputting "ok"
    skipBasicExecution: true,
    tests: [],
  },

  "component-size-check.js": {
    description: "Component size validator",
    tests: [
      {
        name: "Skip - non-component path",
        input: JSON.stringify({ file_path: "lib/utils.ts" }),
        expectOk: true,
      },
      {
        name: "Skip - test file",
        input: JSON.stringify({ file_path: "app/test.spec.tsx" }),
        expectOk: true,
      },
    ],
  },

  "firestore-write-block.js": {
    description: "Firestore protected collections blocker",
    tests: [
      {
        name: "Pass - safe file",
        input: JSON.stringify({
          file_path: "lib/service.ts",
          content: 'const data = { name: "test" };',
        }),
        expectOk: true,
      },
      {
        name: "Block - direct journal write",
        input: JSON.stringify({
          file_path: "lib/service.ts",
          content: 'setDoc(doc(db, "journal", id), data);',
        }),
        expectOk: false, // Should block
        expectStderr: /protected collection|firestore/i,
      },
    ],
  },

  "test-mocking-validator.js": {
    description: "Test mocking pattern validator",
    tests: [
      {
        name: "Pass - proper mock",
        input: JSON.stringify({
          file_path: "lib/__tests__/test.test.ts",
          content: 'vi.mock("@/lib/firestore-service");',
        }),
        expectOk: true,
      },
      {
        name: "Block - direct firebase mock",
        input: JSON.stringify({
          file_path: "lib/__tests__/test.test.ts",
          content: 'vi.mock("firebase/firestore");',
        }),
        expectOk: false, // Should block
        expectStderr: /mock.*firebase/i,
      },
    ],
  },

  "typescript-strict-check.js": {
    description: "TypeScript strict mode validator",
    tests: [
      {
        name: "Pass - no any",
        input: JSON.stringify({
          file_path: "lib/service.ts",
          content: "const x: string = 'test';",
        }),
        expectOk: true,
      },
      {
        name: "Warn - any type annotation",
        input: JSON.stringify({
          file_path: "lib/service.ts",
          content: "function foo(x: any) {}",
        }),
        expectOk: true, // Non-blocking warning
        expectStderr: /any/i,
      },
    ],
  },

  "repository-pattern-check.js": {
    description: "Repository pattern validator",
    tests: [
      {
        name: "Pass - component without Firestore",
        input: JSON.stringify({
          file_path: "app/test.tsx",
          content: "export function Test() { return <div>Hi</div>; }",
        }),
        expectOk: true,
      },
    ],
  },

  "app-check-validator.js": {
    description: "App Check validator",
    tests: [
      {
        name: "Pass - non-functions file",
        input: JSON.stringify({
          file_path: "lib/service.ts",
          content: "export const x = 1;",
        }),
        expectOk: true,
      },
    ],
  },

  "agent-trigger-enforcer.js": {
    description: "Agent trigger enforcer (Phase 1 - suggest)",
    tests: [
      {
        name: "Pass - non-code file",
        input: JSON.stringify({ file_path: "README.md" }),
        expectOk: true,
      },
      {
        name: "Pass - test file (excluded)",
        input: JSON.stringify({ file_path: "lib/utils.test.ts" }),
        expectOk: true,
      },
      {
        // Note: suggestions only happen once per day, so we don't check stderr
        name: "Pass - code file (non-blocking)",
        input: JSON.stringify({ file_path: "lib/service.ts" }),
        expectOk: true, // Non-blocking
      },
      {
        // Note: suggestions only happen once per day, so we don't check stderr
        name: "Pass - cloud function file (non-blocking)",
        input: JSON.stringify({ file_path: "functions/src/handler.ts" }),
        expectOk: true, // Non-blocking
      },
    ],
  },

  // UserPromptSubmit hooks
  "plan-mode-suggestion.js": {
    description: "Plan mode suggestion for complex tasks",
    tests: [
      {
        name: "Pass - simple request",
        input: JSON.stringify({ prompt: "fix the bug" }),
        expectOk: true,
      },
      {
        name: "Suggest - complex request",
        input: JSON.stringify({
          prompt:
            "implement a new authentication system with OAuth, SSO, and MFA across the entire codebase",
        }),
        expectOk: true,
        expectStderr: /multi-step|plan mode/i,
      },
    ],
  },

  "session-end-reminder.js": {
    description: "Session end reminder",
    tests: [
      {
        name: "Pass - normal message",
        input: JSON.stringify({ prompt: "let's work on the feature" }),
        expectOk: true,
      },
    ],
  },

  "analyze-user-request.js": {
    description: "PRE-TASK trigger analyzer",
    // Note: This hook outputs PRE-TASK reminders but doesn't print "ok"
    skipBasicExecution: true,
    tests: [],
  },

  // Read hooks
  "large-context-warning.js": {
    description: "Large context warning",
    tests: [
      {
        name: "Pass - normal read",
        input: JSON.stringify({ file_path: "README.md" }),
        expectOk: true,
      },
    ],
  },

  "decision-save-prompt.js": {
    description: "Decision documentation prompt",
    tests: [
      {
        name: "Pass - no question",
        input: JSON.stringify({ questions: [] }),
        expectOk: true,
      },
    ],
  },
};

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Validate syntax of a hook file
function validateSyntax(hookPath) {
  try {
    execFileSync("node", ["--check", hookPath], { stdio: "pipe" });
    return { valid: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { valid: false, error: errorMsg };
  }
}

// Run a hook with test input
function runHookTest(hookPath, input) {
  const result = spawnSync("node", [hookPath, input], {
    encoding: "utf8",
    timeout: 10000, // Increased timeout for slower hooks
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
  });

  return {
    exitCode: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error,
  };
}

/**
 * Record a test result and log it
 */
function recordResult(stats, hookFile, testName, passed, errorMsg) {
  stats.totalTests++;
  if (passed) {
    log(`  ✓ ${testName}`, "green");
    stats.passedTests++;
  } else {
    log(`  ✗ ${testName}: ${errorMsg}`, "red");
    stats.failedTests++;
    stats.failures.push({ hook: hookFile, test: testName, error: errorMsg });
  }
  return passed;
}

/**
 * Run basic execution test for a hook (with or without "ok" output check)
 */
function runBasicExecutionTest(stats, hookFile, hookPath, testDef) {
  const basicResult = runHookTest(hookPath, "");
  const skipOkCheck = testDef && testDef.skipBasicExecution;
  const label = skipOkCheck ? "Basic execution (exits cleanly)" : "Basic execution (no input)";

  const passed = skipOkCheck
    ? basicResult.exitCode === 0
    : basicResult.exitCode === 0 && basicResult.stdout.includes("ok");

  recordResult(
    stats,
    hookFile,
    label,
    passed,
    `exit=${basicResult.exitCode}${basicResult.stderr ? `: ${basicResult.stderr}` : ""}`
  );
}

/**
 * Evaluate a single test case result against expectations
 */
function evaluateTestCase(test, result) {
  if (test.expectOk) {
    if (result.exitCode !== 0 || !result.stdout.includes("ok")) {
      return `Expected ok but got exit=${result.exitCode}`;
    }
  } else {
    if (result.exitCode === 0 && result.stdout.includes("ok")) {
      return "Expected block but got ok";
    }
  }

  if (test.expectStderr && !test.expectStderr.test(result.stderr)) {
    return `Expected stderr to match ${test.expectStderr}`;
  }

  return null; // No error = passed
}

/**
 * Run defined test cases for a hook
 */
function runDefinedTestCases(stats, hookFile, hookPath, testDef) {
  if (!testDef || !testDef.tests) return;

  for (const test of testDef.tests) {
    const result = runHookTest(hookPath, test.input);
    const errorMsg = evaluateTestCase(test, result);
    recordResult(stats, hookFile, test.name, errorMsg === null, errorMsg || "");
  }
}

// Main test runner
function runTests() {
  log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "blue");
  log("  🔬 HOOK HEALTH TEST SUITE", "blue");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "blue");

  const stats = { totalTests: 0, passedTests: 0, failedTests: 0, failures: [] };

  // Get all hook files
  const hookFiles = fs.readdirSync(hooksDir).filter((f) => f.endsWith(".js"));
  log(`Found ${hookFiles.length} hooks to test\n`, "gray");

  for (const hookFile of hookFiles) {
    const hookPath = path.join(hooksDir, hookFile);
    const testDef = HOOK_TESTS[hookFile];

    log(`📄 ${hookFile}`, "yellow");

    // 1. Syntax validation
    const syntaxResult = validateSyntax(hookPath);
    const syntaxPassed = recordResult(
      stats,
      hookFile,
      "Syntax valid",
      syntaxResult.valid,
      syntaxResult.error || ""
    );
    if (!syntaxPassed) {
      log(""); // Blank line between hooks
      continue; // Skip other tests if syntax fails
    }

    // 2. Basic execution
    runBasicExecutionTest(stats, hookFile, hookPath, testDef);

    // 3. Defined test cases
    runDefinedTestCases(stats, hookFile, hookPath, testDef);

    log(""); // Blank line between hooks
  }

  // Summary
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "blue");
  log("  📊 TEST SUMMARY", "blue");
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "blue");

  log(`  Total tests:  ${stats.totalTests}`);
  log(`  Passed:       ${stats.passedTests}`, "green");
  log(`  Failed:       ${stats.failedTests}`, stats.failedTests > 0 ? "red" : "green");

  if (stats.failures.length > 0) {
    log("\n  Failures:", "red");
    for (const f of stats.failures) {
      log(`    - ${f.hook} / ${f.test}`, "red");
      log(`      ${f.error}`, "gray");
    }
  }

  log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "blue");

  // Exit with failure if any tests failed
  process.exit(stats.failedTests > 0 ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, validateSyntax, runHookTest };
