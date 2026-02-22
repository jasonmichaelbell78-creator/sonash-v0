#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * commit-failure-reporter.js - PostToolUse hook (Bash)
 *
 * When a `git commit` command fails (exit code != 0), reads
 * .git/hook-output.log and surfaces the pre-commit hook output
 * that would otherwise be invisible in CI/agent contexts.
 *
 * Also persists failure entries to .claude/state/commit-failures.jsonl
 * for long-term observability and alerts dashboard integration.
 *
 * Fast bail-out (~1ms) for non-commit commands.
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// Lazy-load shared helpers (best-effort — never block on import failure)
let isSafeToWrite, rotateJsonl, sanitizeInput;
try {
  isSafeToWrite = require("./lib/symlink-guard").isSafeToWrite;
} catch {
  isSafeToWrite = () => true;
}
try {
  rotateJsonl = require("./lib/rotate-state").rotateJsonl;
} catch {
  rotateJsonl = null;
}
try {
  sanitizeInput = require("./lib/sanitize-input").sanitizeInput;
} catch {
  sanitizeInput = (v) => (v || "").slice(0, 500);
}

const gitDir = (() => {
  const envGitDir = process.env.GIT_DIR;
  if (typeof envGitDir === "string" && envGitDir.length > 0) {
    return path.isAbsolute(envGitDir) ? envGitDir : path.resolve(process.cwd(), envGitDir);
  }
  return path.join(process.cwd(), ".git");
})();
const LOG_FILE = path.join(gitDir, "hook-output.log");
const MAX_AGE_MS = 60000;

/**
 * Parse the hook arguments to extract command and exit code.
 * Returns null if arguments are missing or unparseable.
 */
function parseArgs() {
  const arg = process.argv[2] || "";
  if (!arg) return null;

  try {
    const parsed = JSON.parse(arg);
    const rawExitCode =
      parsed.exit_code ?? (parsed.tool_output && parsed.tool_output.exit_code) ?? 0;
    const exitCode = Number(rawExitCode);
    return {
      command: typeof parsed.command === "string" ? parsed.command : "",
      exitCode: Number.isFinite(exitCode) ? exitCode : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Read the hook output log if it exists, is fresh, and has content.
 * Returns the log content string or null.
 */
function readFreshLog() {
  try {
    const stats = fs.statSync(LOG_FILE);
    if (stats.size === 0 || Date.now() - stats.mtimeMs > MAX_AGE_MS) return null;

    const content = fs.readFileSync(LOG_FILE, "utf8").trim();
    return content || null;
  } catch (err) {
    if (err.code === "ENOENT") return null;
    return null;
  }
}

/**
 * Determine if log content indicates a hook failure.
 * Returns true if the log shows failure evidence.
 */
function logShowsFailure(content) {
  const hookPassed = /All pre-commit checks passed/.test(content);
  if (hookPassed) return false;
  // \u274C = ❌ — every failure path in the pre-commit hook prints this
  return content.includes("\u274C");
}

// Check name patterns to identify which pre-commit check failed
const CHECK_PATTERNS = [
  { name: "eslint", pattern: /ESLint has errors/i },
  { name: "lint-staged", pattern: /Lint-staged failed/i },
  { name: "pattern-compliance", pattern: /Pattern compliance failed/i },
  { name: "tests", pattern: /Tests failed/i },
  { name: "cross-doc-deps", pattern: /Cross-document dependency check failed/i },
  { name: "doc-index", pattern: /Documentation index generation failed/i },
  { name: "doc-headers", pattern: /Document headers.*(failed|error)/i },
  { name: "audit-s0s1", pattern: /S0\/S1 validation failed/i },
  { name: "debt-schema", pattern: /Technical debt schema validation failed/i },
  { name: "agent-compliance", pattern: /Agent compliance.*failed/i },
];

/**
 * Identify which check failed from log content.
 * @param {string} content - Hook output log content
 * @returns {string} Name of the failed check, or "unknown"
 */
function identifyFailedCheck(content) {
  for (const { name, pattern } of CHECK_PATTERNS) {
    if (pattern.test(content)) return name;
  }
  return "unknown";
}

/**
 * Get current git branch name.
 * @returns {string}
 */
function getGitBranch() {
  try {
    const result = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf-8",
      timeout: 3000,
    });
    return result.status === 0 && result.stdout ? result.stdout.trim() : "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Count staged files for context.
 * @returns {number}
 */
function getStagedFileCount() {
  try {
    const result = spawnSync("git", ["diff", "--cached", "--name-only"], {
      encoding: "utf-8",
      timeout: 3000,
    });
    if (result.status === 0 && result.stdout) {
      return result.stdout.trim().split("\n").filter(Boolean).length;
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Persist a commit failure entry to .claude/state/commit-failures.jsonl.
 * Best-effort: never throws, never blocks hook output display.
 * @param {string} content - Hook output log content
 * @param {number} exitCode - git commit exit code
 */
function logFailure(content, exitCode) {
  try {
    const failuresPath = path.resolve(
      process.env.CLAUDE_PROJECT_DIR || process.cwd(),
      ".claude",
      "state",
      "commit-failures.jsonl"
    );

    const dir = path.dirname(failuresPath);
    fs.mkdirSync(dir, { recursive: true });

    const failedCheck = identifyFailedCheck(content);

    // Extract first meaningful error line (skip blanks, dividers, headers)
    const lines = content.split("\n");
    const errorLine = lines.find(
      (l) => l.trim().length > 5 && !/^[-=]{3,}$/.test(l.trim()) && /fail|error|❌/i.test(l)
    );

    // Sanitize errorExtract before persisting to commit-failures.jsonl:
    // 1. Strip tokens/keys matching known secret prefixes (ghp_, ghs_, sk-, AKIA, Bearer, base64 auth)
    // 2. Strip absolute file paths (keep only basename-like tokens)
    // 3. Strip backtick-quoted commands
    // Uses string-based parsing instead of complex regex to avoid ReDoS (SonarCloud S5852)
    const rawExtract = sanitizeInput(errorLine || "", 200);
    const safeExtract = rawExtract
      .split(/\s+/)
      .map((word) => {
        // Strip secret tokens/keys
        if (/^ghp_/.test(word) || /^ghs_/.test(word) || /^sk-/.test(word)) return "[REDACTED]";
        if (/^AKIA/.test(word)) return "[REDACTED]";
        if (/^Bearer$/i.test(word)) return "[REDACTED]";
        // Strip base64-encoded auth strings (40+ chars of base64 alphabet)
        if (/^[A-Za-z0-9+/=]{40,}$/.test(word)) return "[REDACTED]";
        // Strip Windows absolute paths (keep only last segment)
        if (/^[A-Za-z]:[/\\]/.test(word)) return path.basename(word.replace(/["'`]/g, ""));
        // Strip Unix absolute paths (keep only last segment)
        if (word.startsWith("/") && word.includes("/", 1))
          return path.basename(word.replace(/["'`]/g, ""));
        // Strip backtick-quoted commands
        if (word.startsWith("`") && word.endsWith("`")) return "<cmd>";
        return word;
      })
      .join(" ");

    const entry = {
      timestamp: new Date().toISOString(),
      branch: getGitBranch(),
      user: process.env.USER || process.env.USERNAME || "unknown",
      failedCheck,
      errorExtract: safeExtract,
      stagedFileCount: getStagedFileCount(),
      exitCode,
    };

    if (!isSafeToWrite(failuresPath)) return;
    fs.appendFileSync(failuresPath, JSON.stringify(entry) + "\n");

    // Rotate when file gets large (keep 60 of last 100 entries, only when > 64KB)
    if (rotateJsonl) {
      try {
        const { size } = fs.lstatSync(failuresPath);
        if (size > 64 * 1024) {
          rotateJsonl(failuresPath, 100, 60);
        }
      } catch {
        // Non-fatal
      }
    }
  } catch {
    // Best-effort: logging failure must never block hook output display
  }
}

function main() {
  const args = parseArgs();
  if (!args || !/\bgit\b.*\bcommit\b/.test(args.command)) {
    console.log("ok");
    return;
  }

  const content = readFreshLog();
  if (!content) {
    console.log("ok");
    return;
  }

  // If exit code says success AND log has no failure evidence, skip
  if (args.exitCode === 0 && !logShowsFailure(content)) {
    console.log("ok");
    return;
  }

  // Persist failure for observability (best-effort, never blocks)
  logFailure(content, args.exitCode);

  // Sanitize hook output: strip potential secrets/tokens before display
  // Line-by-line string parsing avoids ReDoS risk from complex regex (SonarCloud S5852)
  const sanitized = content
    .split("\n")
    .map((line) => {
      let result = line;
      // Redact values after known sensitive keys (token=..., secret:..., etc.)
      for (const keyword of ["token", "key", "secret", "password", "credential"]) {
        for (const sep of ["=", ":"]) {
          const idx = result.toLowerCase().indexOf(keyword + sep);
          if (idx === -1) continue;
          const afterSep = idx + keyword.length + sep.length;
          // Skip optional whitespace after separator
          let valueStart = afterSep;
          while (valueStart < result.length && result[valueStart] === " ") valueStart++;
          // Find end of value (next whitespace)
          let valueEnd = valueStart;
          while (valueEnd < result.length && result[valueEnd] !== " ") valueEnd++;
          if (valueEnd > valueStart) {
            result = result.slice(0, valueStart) + "[REDACTED]" + result.slice(valueEnd);
          }
        }
      }
      // Redact GitHub PATs, app tokens, and OpenAI-style keys
      result = result.replaceAll(/ghp_[A-Za-z0-9_]{36,}/g, "ghp_***REDACTED***");
      result = result.replaceAll(/ghs_[A-Za-z0-9_]{36,}/g, "ghs_***REDACTED***");
      result = result.replaceAll(/sk-[A-Za-z0-9_-]{20,}/g, "sk-***REDACTED***");
      result = result.replaceAll(/AKIA[A-Z0-9]{12,}/g, "AKIA***REDACTED***");
      return result;
    })
    .join("\n");
  console.log("Pre-commit hook failed. Output from .git/hook-output.log:");
  console.log("---");
  console.log(sanitized);
  console.log("---");
}

main();
