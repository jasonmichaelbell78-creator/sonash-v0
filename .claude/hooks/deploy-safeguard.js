#!/usr/bin/env node
/* global require, process, console, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * deploy-safeguard.js - PreToolUse gate (Bash)
 *
 * Pre-flight checks before firebase deploy commands. Validates:
 *   A) Build freshness (.next/ exists and is newer than source)
 *   B) Environment verification (.env.local has required vars)
 *   C) Last test run status (test-runs.jsonl last entry = pass)
 *
 * Exit 0 = allow (optionally with stderr warnings)
 * Exit 2 = block with combined message
 *
 * Per D15: Build freshness + env verification + test status.
 * Per D20: SKIP_GATES=1 bypasses all checks.
 * Per D13: Appends to hook-warnings-log.jsonl on block or warn.
 *
 * Wiring (D8): trigger=Bash(firebase deploy) -> script=deploy-safeguard.js
 *              -> output=stderr + JSONL -> consumer=/alerts
 *
 * Hook if-implementation Plan, Step 13.
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { sanitizeError } = require(
  path.join(__dirname, "..", "..", "scripts", "lib", "sanitize-error.cjs")
);

// Safe-fs wrappers (symlink guard + EXDEV fallback)
let safeAppendFileSync, isSafeToWrite;
try {
  ({ safeAppendFileSync, isSafeToWrite } = require(
    path.join(__dirname, "..", "..", "scripts", "lib", "safe-fs")
  ));
} catch {
  // Fallback: fail-open on missing safe-fs (don't block work)
  safeAppendFileSync = (fp, data) => fs.appendFileSync(fp, data);
  isSafeToWrite = () => true;
}

// --- Constants ---

const projectDir =
  process.env.CLAUDE_PROJECT_DIR ||
  (() => {
    try {
      return execFileSync("git", ["rev-parse", "--show-toplevel"], {
        encoding: "utf8",
        timeout: 5000,
      }).trim();
    } catch {
      return process.cwd();
    }
  })();

/** Source directories to check for freshness comparison */
const SOURCE_DIRS = ["app", "lib", "components"];

/** Required environment variables in .env.local */
const REQUIRED_ENV_VARS = ["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"];

/** Path to test runs JSONL (produced by test-tracker.js, Step 14) */
const TEST_RUNS_LOG = path.join(projectDir, ".claude", "state", "test-runs.jsonl");

// --- Kill Switch (D20) ---

if (process.env.SKIP_GATES === "1") {
  process.exit(0);
}

// --- Helpers ---

/**
 * Append a warning entry to hook-warnings-log.jsonl (per D13).
 * Best-effort -- never block the gate on warning write failure.
 *
 * @param {string} message - Warning message
 * @param {"error"|"warning"} severity - error for blocks, warning for warnings
 */
function appendWarningJsonl(message, severity) {
  try {
    const stateDir = path.join(__dirname, "..", "state");
    const logPath = path.join(stateDir, "hook-warnings-log.jsonl");

    try {
      fs.mkdirSync(stateDir, { recursive: true });
    } catch {
      // directory may already exist
    }

    if (!isSafeToWrite(logPath)) return;

    const entry = {
      timestamp: new Date().toISOString(),
      hook: "pre-tool",
      type: "deploy-safeguard",
      severity,
      message,
      actor: "hook-system",
      outcome: severity === "error" ? "blocked" : "warned",
    };
    safeAppendFileSync(logPath, JSON.stringify(entry) + "\n");
  } catch {
    // Best-effort -- never block hooks on log failure
  }
}

/**
 * Get the newest mtime among all files in a directory (recursive).
 * Uses `git ls-files` for efficiency (only tracked files).
 *
 * @param {string} dirPath - Absolute path to directory
 * @returns {number} Newest mtime in ms, or 0 if directory missing/empty
 */
function getNewestSourceMtime(dirPath) {
  try {
    // Use git ls-files to enumerate tracked files efficiently
    const relDir = path.relative(projectDir, dirPath);
    const output = execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", relDir],
      {
        cwd: projectDir,
        encoding: "utf8",
        timeout: 10000,
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let newestMtime = 0;
    const files = output.split("\n").filter(Boolean);

    for (const file of files) {
      try {
        const absPath = path.resolve(projectDir, file);
        // Path traversal guard: ensure file is within project directory
        const rel = path.relative(projectDir, absPath);
        if (/^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) continue;
        const stat = fs.statSync(absPath);
        if (stat.mtimeMs > newestMtime) {
          newestMtime = stat.mtimeMs;
        }
      } catch {
        // Individual file stat failures are not critical
      }
    }

    return newestMtime;
  } catch {
    // Fallback: if git ls-files fails, return 0 (will trigger stale warning)
    return 0;
  }
}

/**
 * Check A: Build freshness.
 * - No .next/ directory: BLOCK
 * - BUILD_ID older than source: WARN
 *
 * @returns {{ level: "block"|"warn"|"ok", message: string }}
 */
function checkBuildFreshness() {
  const nextDir = path.join(projectDir, ".next");
  const buildIdPath = path.join(nextDir, "BUILD_ID");

  // Check if .next/ directory exists
  try {
    const stat = fs.statSync(nextDir);
    if (!stat.isDirectory()) {
      return {
        level: "block",
        message: "No production build found. Run: npm run build",
      };
    }
  } catch {
    return {
      level: "block",
      message: "No production build found. Run: npm run build",
    };
  }

  // Check BUILD_ID mtime vs source mtime
  let buildMtime = 0;
  try {
    const stat = fs.statSync(buildIdPath);
    buildMtime = stat.mtimeMs;
  } catch {
    // No BUILD_ID but .next/ exists -- treat as stale
    return {
      level: "warn",
      message: "Build may be stale (no BUILD_ID found). Consider running: npm run build",
    };
  }

  // Find newest source file mtime across all source dirs
  let newestSourceMtime = 0;
  for (const dir of SOURCE_DIRS) {
    const dirPath = path.join(projectDir, dir);
    const mtime = getNewestSourceMtime(dirPath);
    if (mtime > newestSourceMtime) {
      newestSourceMtime = mtime;
    }
  }

  if (newestSourceMtime > 0 && newestSourceMtime > buildMtime) {
    return {
      level: "warn",
      message: "Build may be stale. Consider running: npm run build",
    };
  }

  return { level: "ok", message: "" };
}

/**
 * Check B: Environment verification.
 * - No .env.local: BLOCK
 * - Missing required vars: BLOCK
 *
 * @returns {{ level: "block"|"warn"|"ok", message: string }}
 */
function checkEnvironment() {
  const envPath = path.join(projectDir, ".env.local");

  let content;
  try {
    content = fs.readFileSync(envPath, "utf8");
  } catch {
    return {
      level: "block",
      message: "Missing .env.local or required environment variables",
    };
  }

  const missing = [];
  for (const varName of REQUIRED_ENV_VARS) {
    // Check for VAR_NAME= (with any value, including empty)
    const pattern = new RegExp(`^${varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*=`, "m");
    if (!pattern.test(content)) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    return {
      level: "block",
      message: `Missing .env.local or required environment variables: ${missing.join(", ")}`,
    };
  }

  return { level: "ok", message: "" };
}

/**
 * Check C: Last test run status.
 * - No test data: WARN
 * - Last test failed: WARN
 * - Last test passed: OK
 *
 * @returns {{ level: "block"|"warn"|"ok", message: string }}
 */
function checkLastTestStatus() {
  let content;
  try {
    content = fs.readFileSync(TEST_RUNS_LOG, "utf8");
  } catch {
    return {
      level: "warn",
      message: "No recent test run data. Consider running: npm test",
    };
  }

  // Get the last non-empty line
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return {
      level: "warn",
      message: "No recent test run data. Consider running: npm test",
    };
  }

  const lastLine = lines[lines.length - 1];
  try {
    const entry = JSON.parse(lastLine);
    if (entry.passed === false) {
      return {
        level: "warn",
        message: "Last test run failed. Consider running: npm test",
      };
    }
    // passed === true or undefined (treat as ok)
    return { level: "ok", message: "" };
  } catch {
    // Malformed JSONL entry -- treat as no data
    return {
      level: "warn",
      message: "No recent test run data. Consider running: npm test",
    };
  }
}

// --- Main: stdin reader ---

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("error", () => {
  // Transport errors should not block work -- allow through
  process.exit(0);
});
process.stdin.on("data", (chunk) => {
  input += chunk;
  // Fail-open on unexpectedly large payloads
  if (input.length > 1024 * 1024) {
    process.exit(0);
  }
});
process.stdin.on("end", () => {
  try {
    // Parse stdin but we don't need the command -- the if-condition already filtered
    JSON.parse(input);

    // Run all three checks
    const buildResult = checkBuildFreshness();
    const envResult = checkEnvironment();
    const testResult = checkLastTestStatus();

    // Collect blocks and warnings
    const blocks = [];
    const warns = [];

    for (const result of [buildResult, envResult, testResult]) {
      if (result.level === "block") {
        blocks.push(result.message);
      } else if (result.level === "warn") {
        warns.push(result.message);
      }
    }

    // If ANY check returns BLOCK: exit 2 with combined message
    if (blocks.length > 0) {
      const allMessages = [...blocks, ...warns];
      const combined = allMessages.map((m) => `  - ${m}`).join("\n");
      const blockMsg = `[deploy-safeguard] BLOCKED: Pre-deploy checks failed:\n${combined}`;
      process.stderr.write(blockMsg + "\n");

      // Log all issues to JSONL
      for (const msg of allMessages) {
        appendWarningJsonl(msg, "error");
      }

      process.exit(2);
    }

    // If only WARNs: exit 0 with stderr warnings (proceed with caution)
    if (warns.length > 0) {
      const combined = warns.map((m) => `  - ${m}`).join("\n");
      process.stderr.write(`[deploy-safeguard] WARNING: Proceeding with caution:\n${combined}\n`);

      // Log warnings to JSONL
      for (const msg of warns) {
        appendWarningJsonl(msg, "warning");
      }

      process.exit(0);
    }

    // All clear: exit 0 silently
    process.exit(0);
  } catch (err) {
    // Parse/logic errors should not block work -- allow through
    const safeErr = String(sanitizeError(err))
      .replaceAll(/\p{C}+/gu, " ")
      .slice(0, 500);
    process.stderr.write(`[deploy-safeguard] Internal error (allowing through): ${safeErr}\n`);
    process.exit(0);
  }
});
