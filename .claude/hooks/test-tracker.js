#!/usr/bin/env node
/* global require, process, console, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * test-tracker.js - PostToolUse hook (Bash) for test run result tracking
 *
 * Captures test run results (pass/fail + exit code) and appends to
 * .claude/state/test-runs.jsonl. On failure, also appends a warning to
 * hook-warnings-log.jsonl via scripts/append-hook-warning.js (per D13).
 *
 * Detection method:
 *   1. Read stdin (PostToolUse event JSON) for tool_input.command and exit_code
 *   2. Determine if the command was a test command (npm test, npx vitest, etc.)
 *   3. Extract exit code from tool output
 *   4. Append structured entry to test-runs.jsonl
 *   5. On failure: also append hook warning
 *
 * Always exits 0 -- this is a tracker, never blocks.
 * Uses continueOnError: true as backup.
 *
 * Plan: .planning/hook-if-implementation/PLAN.md Step 14 (Per D16)
 */

const fs = require("node:fs");
const path = require("node:path");

// --- Safe imports with fallbacks ---

let safeAppendFileSync, isSafeToWrite;
try {
  ({ safeAppendFileSync, isSafeToWrite } = require(
    path.join(__dirname, "..", "..", "scripts", "lib", "safe-fs")
  ));
} catch {
  safeAppendFileSync = (filePath, data) => fs.appendFileSync(filePath, data);
  isSafeToWrite = () => true;
}

let sanitizeError;
try {
  ({ sanitizeError } = require(
    path.join(__dirname, "..", "..", "scripts", "lib", "sanitize-error.cjs")
  ));
} catch {
  sanitizeError = (err) => (err instanceof Error ? err.constructor.name : typeof err);
}

// --- Constants ---

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const TEST_RUNS_LOG = path.join(projectDir, ".claude", "state", "test-runs.jsonl");

// Regex for test commands
const TEST_COMMAND_REGEX = /\b(?:npm\s+test|npx\s+vitest|npx\s+jest|npm\s+run\s+test)\b/;

// --- Helpers ---

/**
 * Get session counter from SESSION_CONTEXT.md
 */
function getSessionCounter() {
  try {
    const contextPath = path.join(projectDir, "SESSION_CONTEXT.md");
    const content = fs.readFileSync(contextPath, "utf8");
    // Resilient: optional bold markers, flexible spacing, "Count"/"Counter" (P001 fix)
    const match = content.match(/\*{0,2}Current Session Count(?:er)?\*{0,2}[\s:]*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

/**
 * Append a test run entry to the JSONL log.
 */
function appendTestRunLog(entry) {
  try {
    const dir = path.dirname(TEST_RUNS_LOG);
    fs.mkdirSync(dir, { recursive: true });

    const absPath = path.resolve(TEST_RUNS_LOG);
    if (!isSafeToWrite(absPath)) {
      console.error("test-tracker: refusing to write -- symlink detected on test runs log");
      return false;
    }
    safeAppendFileSync(absPath, JSON.stringify(entry) + "\n");
    return true;
  } catch (err) {
    console.error(`test-tracker: failed to append test run: ${sanitizeError(err)}`);
    return false;
  }
}

/**
 * Append a failure warning via scripts/append-hook-warning.js (per D13).
 * Uses execFileSync to invoke the script directly rather than duplicating logic.
 */
function appendFailureWarning(command) {
  try {
    const { execFileSync } = require("node:child_process");
    const warningScript = path.join(projectDir, "scripts", "append-hook-warning.js");

    // Truncate command for display (max 80 chars)
    const displayCmd = command.length > 80 ? command.slice(0, 77) + "..." : command;

    execFileSync(
      process.execPath,
      [
        warningScript,
        "--hook=test-tracker",
        "--type=test-failure",
        "--severity=warning",
        `--message=Test run failed: ${displayCmd}`,
      ],
      {
        timeout: 5000,
        stdio: "pipe",
        cwd: projectDir,
      }
    );
  } catch (err) {
    // Best-effort -- never block on warning failure
    console.error(`test-tracker: warning append failed: ${sanitizeError(err)}`);
  }
}

/**
 * Rotate test-runs.jsonl to prevent unbounded growth.
 * Keep 200 entries, trim to 150.
 */
function rotateLog() {
  try {
    const { rotateJsonl } = require("./lib/rotate-state.js");
    const result = rotateJsonl(TEST_RUNS_LOG, 200, 150);
    if (result.rotated) {
      console.error(`  Test runs log rotated: ${result.before} -> ${result.after} entries`);
    }
  } catch {
    // Non-critical -- rotation failure doesn't block tracking
  }
}

// --- Main ---

function main() {
  let input = "";

  process.stdin.setEncoding("utf8");

  process.stdin.on("error", () => {
    // Transport errors should not block -- exit silently
    process.exit(0);
  });

  process.stdin.on("data", (chunk) => {
    input += chunk;
    // Fail-open on unexpectedly large payloads (avoid memory blowups)
    if (input.length > 1024 * 1024) {
      process.exit(0);
    }
  });

  process.stdin.on("end", () => {
    if (!input.trim()) {
      console.log("ok");
      process.exit(0);
    }
    try {
      const data = JSON.parse(input);
      const command = (data.tool_input && data.tool_input.command) || "";

      // Fast bail: check if this is a test command
      if (!TEST_COMMAND_REGEX.test(command)) {
        process.exit(0);
      }

      // Extract exit code -- try multiple locations
      let exitCode = 0;
      if (data.tool_input && data.tool_input.exit_code !== undefined) {
        exitCode = Number(data.tool_input.exit_code);
      } else if (data.tool_output && typeof data.tool_output === "string") {
        // Try to extract exit code from output text
        const exitMatch = data.tool_output.match(/exit\s+code[:\s]*(\d+)/i);
        if (exitMatch) {
          exitCode = parseInt(exitMatch[1], 10);
        }
      } else if (data.tool_output && data.tool_output.exit_code !== undefined) {
        exitCode = Number(data.tool_output.exit_code);
      }

      if (!Number.isFinite(exitCode)) exitCode = 0;

      const passed = exitCode === 0;
      const session = getSessionCounter();

      // Build entry
      const entry = {
        timestamp: new Date().toISOString(),
        command: command.slice(0, 200),
        exitCode: exitCode,
        passed: passed,
        session: session,
      };

      // Append to test-runs.jsonl
      if (appendTestRunLog(entry)) {
        if (passed) {
          console.error(`  Test tracked: PASS -- ${command.slice(0, 60)}`);
        } else {
          console.error(`  Test tracked: FAIL (exit ${exitCode}) -- ${command.slice(0, 60)}`);
        }
      }

      // On failure: also append hook warning (per D13)
      if (!passed) {
        appendFailureWarning(command);
      }

      // Rotate to prevent unbounded growth
      rotateLog();

      process.exit(0);
    } catch (err) {
      // Must never crash -- log and exit clean
      console.error(`test-tracker: ${sanitizeError(err)}`);
      process.exit(0);
    }
  });
}

// Wrap entire execution in try/catch as final safety net
try {
  main();
} catch (err) {
  console.error(`test-tracker: fatal: ${sanitizeError(err)}`);
  process.exit(0);
}
