#!/usr/bin/env node
/* global require, process, console, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
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
const { execFileSync } = require("node:child_process");
let isSafeToWrite, gitExec, projectDir, sanitizeInput, sanitizeError;
try {
  ({ isSafeToWrite } = require("./lib/symlink-guard"));
} catch {
  isSafeToWrite = () => false;
}
try {
  ({ sanitizeError } = require(
    path.join(__dirname, "..", "..", "scripts", "lib", "security-helpers.js")
  ));
} catch {
  sanitizeError = (e) => (e instanceof Error ? e.constructor.name : "unknown error");
}
try {
  ({ gitExec, projectDir } = require("./lib/git-utils.js"));
} catch {
  process.exit(0);
}
try {
  ({ sanitizeInput } = require("./lib/sanitize-input"));
} catch {
  /* eslint-disable no-control-regex -- intentional: strip dangerous control chars in fallback */
  sanitizeInput = (v) =>
    String(v ?? "")
      .replace(/[\x00-\x1f\x7f]/g, "")
      .slice(0, 500);
  /* eslint-enable no-control-regex */
}

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
    console.warn(`commit-tracker: failed to save HEAD state: ${sanitizeError(err)}`);
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
    const match = content.match(/\*{0,2}Current Session Count(?:er)?\*{0,2}[\s:]*(\d+)/i);
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
 * DS-5: Log commit failure to commit-failures.jsonl
 * Path computed lazily to avoid evaluation-order issues with projectDir.
 */
function logCommitFailure(command) {
  try {
    const commitFailuresLog = path.join(projectDir, ".claude", "state", "commit-failures.jsonl");
    const dir = path.dirname(commitFailuresLog);
    fs.mkdirSync(dir, { recursive: true });
    if (!isSafeToWrite(commitFailuresLog)) return;

    // D5b: Capture branch name (best-effort)
    let branchName = "unknown";
    try {
      branchName = gitExec(["rev-parse", "--abbrev-ref", "HEAD"]) || "unknown";
    } catch {
      // Non-critical — use default
    }

    // D5b: Capture first 5 lines of hook output (best-effort)
    let hookOutputExcerpt = "";
    try {
      // Use git rev-parse to find git-dir (works with worktrees) — PR #444 R1 fix #7
      let gitDir;
      try {
        gitDir = execFileSync("git", ["rev-parse", "--git-dir"], {
          encoding: "utf-8",
          cwd: projectDir,
        }).trim();
        if (!path.isAbsolute(gitDir)) gitDir = path.join(projectDir, gitDir);
      } catch {
        gitDir = path.join(projectDir, ".git");
      }
      const hookLogPath = path.join(gitDir, "hook-output.log");
      const stats = fs.lstatSync(hookLogPath);
      // Only read if regular file, non-empty, within size cap (256KB), and fresh (<60s old)
      if (
        stats.isFile() &&
        stats.size > 0 &&
        stats.size <= 256 * 1024 &&
        Date.now() - stats.mtimeMs < 60000
      ) {
        const content = fs.readFileSync(hookLogPath, "utf8").trim();
        hookOutputExcerpt = content.split("\n").slice(0, 5).join("\n");
        // Sanitize sensitive content from hook output — PR #444 R1 fix #12
        // Strip ANSI escape sequences and control characters
        /* eslint-disable no-control-regex -- intentional control char stripping for sanitization */
        hookOutputExcerpt = hookOutputExcerpt
          .replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "")
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
        /* eslint-enable no-control-regex */
        // Redact secrets
        hookOutputExcerpt = hookOutputExcerpt
          .replace(
            /(?:ghp_|github_pat_|glpat-|sk-|token\s*=\s*|password\s*=\s*|secret\s*=\s*|Bearer\s+)\S+/gi,
            "[REDACTED]"
          )
          // Windows paths: C:\Users\<name>\...
          .replace(/[A-Za-z]:[\\/](?:Users|Documents and Settings)[\\/][^\\/\s\n]+/g, "[USER_PATH]")
          // POSIX paths: /home/<name>/... and /Users/<name>/...
          .replace(/\/(?:home|Users)\/[^/\s\n]+/g, "[USER_PATH]")
          .slice(0, 2000);
      }
    } catch {
      // Non-critical — excerpt is best-effort
    }

    const entry = {
      timestamp: new Date().toISOString(),
      command: sanitizeInput((command || "").slice(0, 200)).replace(
        /(?:ghp_|github_pat_|glpat-|sk-|token\s*=\s*)\S+/gi,
        "[REDACTED]"
      ),
      branch: branchName,
      failedCheck: "pre-commit",
      session: getSessionCounter(),
      hook_output_excerpt: sanitizeInput(hookOutputExcerpt.slice(0, 500)),
    };
    fs.appendFileSync(commitFailuresLog, JSON.stringify(entry) + "\n");

    // D5b: Rotation — keep 50 entries max
    try {
      const { rotateJsonl } = require("./lib/rotate-state.js");
      rotateJsonl(commitFailuresLog, 50, 50);
    } catch {
      // Non-critical — rotation failure doesn't block
    }
  } catch (error) {
    // Non-critical — log for debuggability but don't break the hook
    console.error("commit-tracker: failed to log commit failure:", sanitizeError(error));
  }
}

/**
 * D#19: Run mid-session health alerts after successful commits (non-blocking).
 * Spawns mid-session-alerts.js as async subprocess with 5s timeout.
 */
function runMidSessionAlerts() {
  try {
    const { execFile } = require("node:child_process");
    const alertScript = path.join(projectDir, "scripts", "health", "lib", "mid-session-alerts.js");
    if (fs.existsSync(alertScript)) {
      execFile(process.execPath, [alertScript], { timeout: 5000, stdio: "pipe" }, () => {});
    }
  } catch {
    // Non-critical — mid-session alert failure should never block commit tracking
  }
}

/**
 * Capture commit metadata from git log and diff-tree.
 * Returns a structured entry for the commit log.
 */
function captureCommitMetadata(currentHead) {
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
  const filesChanged = gitExec(["diff-tree", "--no-commit-id", "--name-only", "-r", currentHead])
    .split("\n")
    .filter((f) => f.length > 0);

  return {
    timestamp: new Date().toISOString(),
    hash: parts[0] || currentHead,
    shortHash: parts[1] || currentHead.slice(0, 7),
    message: parts[2] || "",
    author: parts[3] || "",
    authorDate: parts[4] || "",
    branch: branch,
    filesChanged: filesChanged.length,
    filesList: filesChanged.slice(0, 30), // Cap at 30 files
    session: getSessionCounter(),
  };
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
    // HEAD unchanged — commit likely failed (pre-commit hooks rejected, etc.)
    // Note: also triggers on --amend with no changes, detached HEAD re-runs,
    // or hook re-invocations. These are low-frequency and acceptable noise.
    // DS-5: Log commit failures so alerts checker can track them
    logCommitFailure(command);
    // Surface pre-commit hook output so the user sees what failed
    reportCommitFailure();
    console.log("ok");
    process.exit(0);
  }

  // NEW COMMIT DETECTED — capture metadata
  const entry = captureCommitMetadata(currentHead);

  if (appendCommitLog(entry)) {
    saveLastHead(currentHead);
    console.error(
      `  Commit tracked: ${sanitizeInput(entry.shortHash)} ${sanitizeInput(entry.message.slice(0, 60))}`
    );

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

  // D#19: Run mid-session health alerts after successful commits
  runMidSessionAlerts();

  // --- Commit failure reporting (merged from commit-failure-reporter.js) ---
  // If the commit command failed, surface pre-commit hook output
  try {
    reportCommitFailure();
  } catch (err) {
    console.error("commit-tracker: reportCommitFailure failed:", sanitizeError(err));
  }

  console.log("ok");
  process.exit(0);
}

/**
 * Resolve the .git directory, handling worktrees and GIT_DIR env var.
 * Validates resolved paths stay within or near the project directory.
 */
function resolveGitDir() {
  const cwd = process.cwd();
  const dotGitPath = path.join(cwd, ".git");

  /**
   * Containment check: resolved git dir must be within the project tree
   * or a reasonable ancestor (worktrees may be siblings).
   * Falls back to default .git path on containment failure.
   */
  function validateGitDir(resolved) {
    try {
      const abs = path.resolve(resolved);
      // Reject filesystem roots (too broad to be a safe git dir)
      const parent = path.dirname(abs);
      if (parent === abs) return dotGitPath;
      const norm = (p) => (process.platform === "win32" ? p.toLowerCase() : p);
      const gitDir = norm(abs);
      const cwdAbs = norm(path.resolve(cwd));
      const cwdParent = norm(path.dirname(path.resolve(cwd)));
      // Allow: inside cwd, equal to cwd, or inside cwd's parent (worktree layouts)
      if (
        gitDir === cwdAbs ||
        gitDir.startsWith(cwdAbs + path.sep) ||
        gitDir === cwdParent ||
        gitDir.startsWith(cwdParent + path.sep)
      ) {
        return abs;
      }
    } catch {
      // fall through
    }
    return dotGitPath;
  }

  const envGitDir = process.env.GIT_DIR;
  if (typeof envGitDir === "string" && envGitDir.length > 0) {
    const resolved = path.isAbsolute(envGitDir) ? envGitDir : path.resolve(cwd, envGitDir);
    return validateGitDir(resolved);
  }
  try {
    if (fs.lstatSync(dotGitPath).isSymbolicLink()) return dotGitPath;
    const st = fs.statSync(dotGitPath);
    if (st.isFile()) {
      const txt = fs.readFileSync(dotGitPath, "utf8").trim();
      const m = txt.match(/^gitdir:\s*(.+)\s*$/i);
      if (m && m[1]) {
        const resolved = m[1].trim();
        const abs = path.isAbsolute(resolved) ? resolved : path.resolve(cwd, resolved);
        return validateGitDir(abs);
      }
    }
  } catch {
    // best-effort — fall through to default
  }
  return dotGitPath;
}

/**
 * Redact sensitive values from a single line of hook output.
 */
function redactSensitiveLine(line) {
  let result = line;
  for (const keyword of ["token", "key", "secret", "password", "credential"]) {
    const re = new RegExp(String.raw`(\b${keyword}\b\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s]+)`, "gi");
    result = result.replace(re, `$1[REDACTED]`);
  }
  result = result.replaceAll(/ghp_[A-Za-z0-9_]{36,}/g, "ghp_***REDACTED***");
  result = result.replaceAll(/ghs_[A-Za-z0-9_]{36,}/g, "ghs_***REDACTED***");
  result = result.replaceAll(/sk-[A-Za-z0-9_-]{20,}/g, "sk-***REDACTED***");
  result = result.replaceAll(/AKIA[A-Z0-9]{12,}/g, "AKIA***REDACTED***");
  return result;
}

/**
 * Report commit failures by reading .git/hook-output.log.
 * Surfaces pre-commit hook output that would otherwise be invisible.
 * Merged from commit-failure-reporter.js to eliminate redundant process spawn.
 */
function reportCommitFailure() {
  try {
    const arg = process.argv[2] || "";
    if (!arg) return;

    let exitCode = 0;
    try {
      const parsed = JSON.parse(arg);
      const rawExitCode =
        parsed.exit_code ?? (parsed.tool_output && parsed.tool_output.exit_code) ?? 0;
      exitCode = Number(rawExitCode);
      if (!Number.isFinite(exitCode)) exitCode = 0;
    } catch {
      return;
    }

    const gitDir = resolveGitDir();
    const logFile = path.join(gitDir, "hook-output.log");

    // Read hook output log if it exists and is fresh (<60s old)
    let content;
    try {
      if (fs.lstatSync(logFile).isSymbolicLink()) return;
      const stats = fs.statSync(logFile);
      if (stats.size === 0 || Date.now() - stats.mtimeMs > 60000) return;
      content = fs.readFileSync(logFile, "utf8").trim();
      if (!content) return;
    } catch {
      return;
    }

    // If exit code says success AND log has no failure evidence, skip
    const hookPassed = /All pre-commit checks passed/.test(content);
    if (exitCode === 0 && hookPassed) return;
    if (exitCode === 0 && !content.includes("\u274C")) return;

    // Sanitize and output hook failure
    const sanitized = content.split("\n").map(redactSensitiveLine).join("\n");

    console.error("Pre-commit hook failed. Output from .git/hook-output.log:");
    console.error("---");
    console.error(sanitized);
    console.error("---");
  } catch {
    // Best-effort — never block on failure reporting
  }
}

main();
