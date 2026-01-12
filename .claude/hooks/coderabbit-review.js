#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename, no-control-regex */
/**
 * coderabbit-review.js - PostToolUse hook for CodeRabbit AI review integration
 * Cross-platform replacement for coderabbit-review.sh
 *
 * Triggers CodeRabbit review after significant code changes
 * Creates autonomous loop: Claude writes -> CodeRabbit reviews -> Claude fixes
 *
 * Install CodeRabbit CLI:
 *   curl -fsSL https://cli.coderabbit.ai/install.sh | sh
 *   coderabbit auth login
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Exit early if no arguments
if (process.argv.length <= 2) {
  console.log("ok");
  process.exit(0);
}

// Check if CodeRabbit CLI is available
function hasCodeRabbit() {
  const result = spawnSync("coderabbit", ["--version"], {
    stdio: "pipe",
    encoding: "utf8",
    timeout: 5000,
  });
  return !result.error && result.status === 0;
}

if (!hasCodeRabbit()) {
  console.log("ok");
  process.exit(0);
}

// Portable lowercase
function toLower(str) {
  return str.toLowerCase();
}

// Sensitive file patterns to skip (security: prevent data exfiltration)
const SENSITIVE_PATTERNS = [
  /\.env/i,
  /secret/i,
  /credential/i,
  /password/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /serviceaccount/i,
  /firebase.*config/i,
];

function isSensitiveFile(filePathOrName) {
  // Check both filename and full path to catch sensitive directories
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(filePathOrName));
}

// Get and validate base directory for path containment
const baseDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
let realBaseDir = "";
try {
  realBaseDir = fs.realpathSync(baseDir);
} catch {
  console.log("ok");
  process.exit(0);
}

// Track findings
let foundIssues = false;
let allFindings = "";
const MAX_FILES = 10;
let reviewed = 0;

// Get file paths from arguments (may be JSON payload passed as a single argument)
let filePaths = process.argv.slice(2);

// Parse JSON argument if present
if (
  filePaths.length === 1 &&
  typeof filePaths[0] === "string" &&
  filePaths[0].trim().startsWith("{")
) {
  try {
    const parsed = JSON.parse(filePaths[0]);
    if (Array.isArray(parsed.file_paths)) {
      filePaths = parsed.file_paths.filter((p) => typeof p === "string" && p.length > 0);
    } else if (typeof parsed.file_path === "string" && parsed.file_path.length > 0) {
      filePaths = [parsed.file_path];
    }
  } catch {
    // Not JSON, keep as-is
  }
}

for (const filePath of filePaths) {
  // Security: Reject invalid path inputs
  if (
    typeof filePath !== "string" ||
    filePath.length === 0 ||
    filePath.startsWith("-") ||
    filePath.includes("\n") ||
    filePath.includes("\r")
  ) {
    continue;
  }

  // Resolve path against repo root
  const candidatePath = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);

  // Skip non-existent files and extremely large files (guard against TOCTOU/DoS)
  try {
    if (!fs.existsSync(candidatePath)) {
      continue;
    }
    const stat = fs.statSync(candidatePath);
    // Skip directories and files larger than 512KB (DoS protection)
    if (!stat.isFile() || stat.size > 512 * 1024) {
      continue;
    }
  } catch {
    continue;
  }

  // Security: Path containment check (handles symlinks)
  // rel === '' means file path equals baseDir (invalid for file operations)
  let realCandidate = "";
  try {
    realCandidate = fs.realpathSync(candidatePath);
  } catch {
    continue;
  }
  const rel = path.relative(realBaseDir, realCandidate);
  if (rel === "" || rel.startsWith(".." + path.sep) || rel === ".." || path.isAbsolute(rel)) {
    continue;
  }

  const filename = path.basename(candidatePath);
  const filenameLower = toLower(filename);

  // Security: Skip sensitive files/paths to prevent data exfiltration
  // Check both filename and relative path to catch sensitive directories
  if (isSensitiveFile(filename) || isSensitiveFile(rel)) {
    continue;
  }

  // Only review code files
  if (!/\.(ts|tsx|js|jsx|py|sh|go|rs|rb|php|java|kt|swift)$/.test(filenameLower)) {
    continue;
  }

  reviewed++;
  if (reviewed > MAX_FILES) {
    allFindings += `\n--- (skipped remaining code files, limit: ${MAX_FILES}) ---\n`;
    break;
  }

  // Run CodeRabbit review with timeout
  try {
    // Note: Options must come before -- separator
    const result = spawnSync(
      "coderabbit",
      ["review", "--plain", "--severity", "medium", "--", candidatePath],
      {
        encoding: "utf8",
        timeout: 20000,
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    // Skip timeouts
    if (result.signal === "SIGTERM") {
      allFindings += `\n--- ${filePath} ---\n(review timed out after 20s)\n`;
      continue;
    }

    // Skip errors
    if (result.status !== 0) {
      if (result.stdout && result.stdout.length < 200) {
        allFindings += `\n--- ${filePath} ---\n(review failed: exit ${result.status})\n`;
      }
      continue;
    }

    let output = result.stdout || "";

    // Check for actionable findings
    if (output && !output.includes("No issues found") && !/^\s*error:/i.test(output)) {
      foundIssues = true;

      // Truncate long output
      if (output.length > 1500) {
        output = output.slice(0, 1500) + "... (truncated)";
      }

      // Strip ANSI escape sequences
      output = output.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");

      allFindings += `\n--- ${filePath} ---\n${output}\n`;
    }
  } catch {
    // Skip on error, don't block
    continue;
  }
}

// Output findings to stderr
if (foundIssues || allFindings) {
  // Cap total output
  if (allFindings.length > 3000) {
    allFindings = allFindings.slice(0, 3000) + "... (output truncated)";
  }

  console.error("CodeRabbit Review Findings:");
  console.error(allFindings);
  console.error("");
  console.error("Consider addressing these issues before committing.");
  // Exit with non-zero status to signal findings to CI/CD (opt-in via env var)
  if (process.env.CODERABBIT_EXIT_ON_FINDINGS === "true") {
    process.exitCode = 1;
  }
}

// Protocol: stdout only contains "ok"
console.log("ok");
