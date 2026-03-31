#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * governance-logger.js - PostToolUse hook for governance file changes
 *
 * Logs changes to CLAUDE.md and .claude/settings.json with git diff output.
 * Fires on Write/Edit to governance files (per D9, D11).
 *
 * Appends structured JSONL to .claude/state/governance-changes.jsonl and
 * a summary warning to hook-warnings-log.jsonl via append-hook-warning.js.
 *
 * Always exits 0 -- this is a logger, never blocks.
 *
 * Session #244: Part of hook if-conditions implementation (Wave 2, Step 9).
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

// ─── Shared helper imports (best-effort) ────────────────────────────────────

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

let safeAppendFileSync, isSafeToWrite;
try {
  ({ safeAppendFileSync, isSafeToWrite } = require(
    path.resolve(projectDir, "scripts", "lib", "safe-fs.js")
  ));
} catch {
  safeAppendFileSync = (filePath, data) => fs.appendFileSync(filePath, data);
  isSafeToWrite = () => true;
}

let sanitizeError;
try {
  ({ sanitizeError } = require(path.resolve(projectDir, "scripts", "lib", "sanitize-error.cjs")));
} catch {
  sanitizeError = (err) => (err instanceof Error ? err.constructor.name : typeof err);
}

// ─── Governance files we track ──────────────────────────────────────────────

const GOVERNANCE_FILES = ["CLAUDE.md", ".claude/settings.json"];

const GOVERNANCE_LOG = path.join(projectDir, ".claude", "state", "governance-changes.jsonl");

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Get session counter from SESSION_CONTEXT.md
 */
function getSessionCounter() {
  try {
    const contextPath = path.join(projectDir, "SESSION_CONTEXT.md");
    const content = fs.readFileSync(contextPath, "utf8");
    const match = content.match(/\*{0,2}Current Session Count(?:er)?\*{0,2}[\s:]*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

/**
 * Run a git command safely via execFileSync (no shell injection).
 * Returns trimmed stdout or empty string on error.
 */
function gitExec(args) {
  try {
    return execFileSync("git", args, {
      cwd: projectDir,
      encoding: "utf8",
      timeout: 5000,
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Get the git diff for a file (working tree vs HEAD).
 * Returns the diff string or empty string.
 */
function getGitDiff(filePath) {
  return gitExec(["diff", "HEAD", "--", filePath]);
}

/**
 * Count lines added and removed from a diff string.
 */
function countDiffStats(diff) {
  let linesAdded = 0;
  let linesRemoved = 0;
  if (!diff) return { linesAdded, linesRemoved };

  const lines = diff.split("\n");
  for (const line of lines) {
    // Skip diff headers (--- a/file, +++ b/file, @@ ... @@)
    if (line.startsWith("---") || line.startsWith("+++") || line.startsWith("@@")) {
      continue;
    }
    if (line.startsWith("+")) {
      linesAdded++;
    } else if (line.startsWith("-")) {
      linesRemoved++;
    }
  }
  return { linesAdded, linesRemoved };
}

/**
 * Determine which governance file was changed from stdin payload.
 * Claude Code PostToolUse hooks receive JSON on stdin with tool_input.
 */
function parseGovernanceFile(payload) {
  try {
    const data = JSON.parse(payload);
    const toolInput = data.tool_input || {};

    // Write tool uses file_path, Edit tool uses file_path
    const filePath = toolInput.file_path || "";
    if (!filePath) return null;

    // Normalize path separators
    const normalized = filePath.replace(/\\/g, "/");

    // Check if it's one of the governance files
    for (const govFile of GOVERNANCE_FILES) {
      if (normalized === govFile || normalized.endsWith("/" + govFile)) {
        return govFile;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Append warning via append-hook-warning.js (per D13 wiring).
 */
function appendHookWarning(file, linesAdded, linesRemoved) {
  try {
    const warningScript = path.join(projectDir, "scripts", "append-hook-warning.js");
    const message = `${file} modified (+${linesAdded}/-${linesRemoved} lines)`;
    execFileSync(
      process.execPath,
      [
        warningScript,
        "--hook=post-tool",
        "--type=governance",
        "--severity=warning",
        `--message=${message}`,
      ],
      {
        cwd: projectDir,
        encoding: "utf8",
        timeout: 5000,
        stdio: "pipe",
      }
    );
  } catch {
    // Non-critical -- warning append failure should never block
  }
}

/**
 * Append governance change entry to JSONL log.
 */
function appendGovernanceLog(entry) {
  try {
    const dir = path.dirname(GOVERNANCE_LOG);
    fs.mkdirSync(dir, { recursive: true });
    if (!isSafeToWrite(GOVERNANCE_LOG)) {
      console.warn("governance-logger: refusing to write -- symlink detected");
      return false;
    }
    safeAppendFileSync(GOVERNANCE_LOG, JSON.stringify(entry) + "\n");
    return true;
  } catch (err) {
    console.warn("governance-logger: failed to append log:", sanitizeError(err));
    return false;
  }
}

/**
 * Rotate JSONL to prevent unbounded growth.
 */
function rotateLog() {
  try {
    const { rotateJsonl } = require("./lib/rotate-state.js");
    const result = rotateJsonl(GOVERNANCE_LOG, 200, 100);
    if (result.rotated) {
      console.error(`  Governance log rotated: ${result.before} -> ${result.after} entries`);
    }
  } catch {
    // Non-critical -- rotation failure doesn't block logging
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  // Read stdin (Claude Code pipes tool info for PostToolUse events)
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("error", () => {
    // Transport errors should not block -- allow through
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
    if (!input.trim()) {
      console.log("ok");
      process.exit(0);
    }
    try {
      processPayload(input);
    } catch (err) {
      // Logger must never crash -- fail open
      console.warn("governance-logger: unexpected error:", sanitizeError(err));
    }
    process.exit(0);
  });
}

function processPayload(input) {
  // Determine which governance file was changed
  const file = parseGovernanceFile(input);
  if (!file) {
    // Not a governance file or couldn't parse -- bail silently
    return;
  }

  // Get git diff for the changed file
  const diff = getGitDiff(file);
  const { linesAdded, linesRemoved } = countDiffStats(diff);

  // If no diff, the file may not be tracked or has no changes vs HEAD
  // Still log it (the write happened, even if git doesn't see a diff yet)

  // Get session number
  const sessionNumber = getSessionCounter();

  // Build JSONL entry
  const entry = {
    timestamp: new Date().toISOString(),
    file,
    sessionNumber,
    diff: diff.slice(0, 5000), // Cap diff size to prevent huge entries
    linesAdded,
    linesRemoved,
  };

  // Append to governance-changes.jsonl
  if (appendGovernanceLog(entry)) {
    console.error(`  Governance change logged: ${file} (+${linesAdded}/-${linesRemoved})`);
    rotateLog();
  }

  // Append summary warning to hook-warnings-log.jsonl (per D13)
  appendHookWarning(file, linesAdded, linesRemoved);
}

main();
