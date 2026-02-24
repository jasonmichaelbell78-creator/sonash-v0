#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * commit-tracker.js - PostToolUse hook (Bash) for automatic commit logging
 *
 * LAYER A of compaction-resilient state persistence.
 *
 * Fires on every Bash tool call but does a fast regex bail-out on non-commit
 * commands (~1ms). When a git commit is detected, appends structured data to
 * .claude/state/commit-log.jsonl — an append-only log that survives compaction
 * and enables session-begin gap detection.
 *
 * Detection method:
 *   1. Fast regex check on bash command string (bail if no git commit keyword)
 *   2. Compare current HEAD against last tracked HEAD (handles failed commits)
 *   3. If HEAD changed, capture commit metadata and append to log
 *
 * Session #138: Part of compaction-resilient state persistence (Layer A)
 */

const fs = require("node:fs");
const path = require("node:path");
const { isSafeToWrite } = require("./lib/symlink-guard");
const { gitExec, projectDir } = require("./lib/git-utils.js");

// Security check - bidirectional containment
const safeBaseDir = path.resolve(process.cwd());
const baseForCheck = process.platform === "win32" ? safeBaseDir.toLowerCase() : safeBaseDir;
const projectForCheck = process.platform === "win32" ? projectDir.toLowerCase() : projectDir;

const projectInsideCwd =
  projectForCheck === baseForCheck || projectForCheck.startsWith(baseForCheck + path.sep);
const cwdInsideProject =
  baseForCheck === projectForCheck || baseForCheck.startsWith(projectForCheck + path.sep);

if (!projectInsideCwd && !cwdInsideProject) {
  console.log("ok");
  process.exit(0);
}

// State files
const TRACKER_STATE = path.join(projectDir, ".claude", "hooks", ".commit-tracker-state.json");
const COMMIT_LOG = path.join(projectDir, ".claude", "state", "commit-log.jsonl");

// Regex for commands that create commits
const COMMIT_COMMAND_REGEX = /\bgit\s+(commit|cherry-pick|merge|revert)\b/;

/**
 * Fast path: extract bash command from hook arguments and check if it's a
 * commit-related command. Returns empty string if not a commit command.
 */
function extractCommand() {
  const arg = process.argv[2] || "";
  if (!arg) return "";

  try {
    const parsed = JSON.parse(arg);
    return typeof parsed.command === "string" ? parsed.command : "";
  } catch {
    // Not JSON — treat as raw string
    return typeof arg === "string" ? arg : "";
  }
}

/**
 * Load last tracked HEAD hash
 */
function loadLastHead() {
  try {
    const data = JSON.parse(fs.readFileSync(TRACKER_STATE, "utf8"));
    return typeof data.lastHead === "string" ? data.lastHead : "";
  } catch {
    return "";
  }
}

/**
 * Save current HEAD hash for next comparison
 */
function saveLastHead(head) {
  try {
    const dir = path.dirname(TRACKER_STATE);
    fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${TRACKER_STATE}.tmp`;
    if (!isSafeToWrite(tmpPath)) {
      console.warn("commit-tracker: refusing to write — symlink detected on tracker state");
      return;
    }
    fs.writeFileSync(
      tmpPath,
      JSON.stringify({ lastHead: head, updatedAt: new Date().toISOString() })
    );
    if (!isSafeToWrite(TRACKER_STATE)) {
      console.warn("commit-tracker: refusing to rename — symlink detected on tracker state");
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* cleanup */
      }
      return;
    }
    try {
      fs.rmSync(TRACKER_STATE, { force: true });
    } catch {
      // best-effort; destination may not exist
    }
    fs.renameSync(tmpPath, TRACKER_STATE);
  } catch (err) {
    // Non-critical — worst case we re-log the same commit next time
    console.warn(
      `commit-tracker: failed to save HEAD state: ${err instanceof Error ? err.message : String(err)}`
    );
    try {
      fs.rmSync(`${TRACKER_STATE}.tmp`, { force: true });
    } catch {
      // cleanup failure is non-critical
    }
  }
}

/**
 * Get session counter from SESSION_CONTEXT.md
 */
function getSessionCounter() {
  try {
    const contextPath = path.join(projectDir, "SESSION_CONTEXT.md");
    const content = fs.readFileSync(contextPath, "utf8");
    // Resilient: optional bold markers, flexible spacing, "Count"/"Counter" (P001 fix)
    const match = content.match(/\*{0,2}Current Session Count(?:er)?\*{0,2}\s*:?\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

/**
 * Append a commit entry to the JSONL log
 */
function appendCommitLog(entry) {
  try {
    const dir = path.dirname(COMMIT_LOG);
    fs.mkdirSync(dir, { recursive: true });
    if (!isSafeToWrite(COMMIT_LOG)) {
      console.warn("commit-tracker: refusing to write — symlink detected on commit log");
      return false;
    }
    fs.appendFileSync(COMMIT_LOG, JSON.stringify(entry) + "\n");
    return true;
  } catch {
    return false;
  }
}

/**
 * Main
 */
function main() {
  // FAST PATH: Check if command is commit-related (~1ms for non-commit commands)
  const command = extractCommand();
  if (!COMMIT_COMMAND_REGEX.test(command)) {
    console.log("ok");
    process.exit(0);
  }

  // A commit command was run — check if HEAD actually changed
  const currentHead = gitExec(["rev-parse", "HEAD"]);
  if (!currentHead) {
    // Not in a git repo or git not available
    console.log("ok");
    process.exit(0);
  }

  const lastHead = loadLastHead();
  if (currentHead === lastHead) {
    // Commit failed (pre-commit hooks rejected, etc.) or already tracked
    console.log("ok");
    process.exit(0);
  }

  // NEW COMMIT DETECTED — capture metadata (2 git calls instead of 3)
  // Call 1: log with %D decoration to get hash, short hash, message, author, date, AND branch ref
  // Use NUL delimiter (%x00) to avoid corruption from special chars in commit messages
  const commitLine = gitExec([
    "log",
    "--format=%H%x00%h%x00%s%x00%an%x00%ad%x00%D",
    "--date=iso-strict",
    "-1",
  ]);
  const parts = commitLine.split("\0");

  // Parse branch from %D decoration (e.g. "HEAD -> branch-name, origin/branch-name")
  const decoration = (parts.length >= 6 ? parts[5] : "") || "";
  const branchMatch = decoration.match(/HEAD -> ([^,]+)/);
  // Fall back to rev-parse only in detached HEAD (no "HEAD -> ..." in decoration)
  const branch = branchMatch
    ? branchMatch[1].trim()
    : gitExec(["rev-parse", "--abbrev-ref", "HEAD"]);

  // Call 2: files changed in the commit
  const filesChanged = gitExec(["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"])
    .split("\n")
    .filter((f) => f.length > 0);
  const sessionCounter = getSessionCounter();

  const entry = {
    timestamp: new Date().toISOString(),
    hash: parts[0] || currentHead,
    shortHash: parts[1] || currentHead.slice(0, 7),
    message: parts[2] || "",
    author: parts[3] || "",
    authorDate: parts[4] || "",
    branch: branch,
    filesChanged: filesChanged.length,
    filesList: filesChanged.slice(0, 30), // Cap at 30 files
    session: sessionCounter,
  };

  if (appendCommitLog(entry)) {
    saveLastHead(currentHead);
    console.error(`  Commit tracked: ${entry.shortHash} ${entry.message.slice(0, 60)}`);

    // Rotate commit log to prevent unbounded growth (OPT #72)
    try {
      const { rotateJsonl } = require("./lib/rotate-state.js");
      const result = rotateJsonl(COMMIT_LOG, 500, 300);
      if (result.rotated) {
        console.error(`  Commit log rotated: ${result.before} → ${result.after} entries`);
      }
    } catch {
      // Non-critical — rotation failure doesn't block commit tracking
    }
  }

  console.log("ok");
  process.exit(0);
}

main();
