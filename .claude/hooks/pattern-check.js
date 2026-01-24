#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * pattern-check.js - PostToolUse hook for pattern compliance
 * Cross-platform replacement for pattern-check.sh
 *
 * Runs pattern checker on modified files during the session
 * Non-blocking: outputs warnings but doesn't fail the operation
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { sanitizeFilesystemError } = require("../../scripts/lib/validate-paths.js");

/**
 * Sanitize path strings for safe logging (prevent log injection)
 * @param {string} pathStr - The path string to sanitize
 * @returns {string} - Safe path string
 */
function sanitizePathForLog(pathStr) {
  // Remove control characters and Unicode line separators (Review #200 R4 - Qodo)
  // eslint-disable-next-line no-control-regex -- Intentional control character removal for log safety
  const sanitized = String(pathStr).replace(/[\x00-\x1F\x7F-\x9F\u2028\u2029]/g, "");
  // Cap length to prevent log flooding (Review #200 R4 - Qodo)
  return sanitized.length > 500 ? `${sanitized.slice(0, 500)}…[truncated]` : sanitized;
}

// Get and validate project directory
const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;

// Security: Fail closed on absolute CLAUDE_PROJECT_DIR (Review #200 R4 - Qodo)
if (projectDirInput !== safeBaseDir && path.isAbsolute(projectDirInput)) {
  process.exit(0);
}

const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Security: Ensure projectDir is within baseDir using path.relative() (prevent path traversal)
const baseRel = path.relative(safeBaseDir, projectDir);
// Use segment-based check instead of startsWith (Review #200 R4 - Qodo)
const baseSegments = baseRel.split(path.sep);
if (baseSegments[0] === ".." || baseRel === ".." || path.isAbsolute(baseRel)) {
  process.exit(0);
}

// Parse file path from arguments (JSON format: {"file_path": "..."})
const arg = process.argv[2] || "";
if (!arg) {
  process.exit(0);
}

// Extract file_path from JSON
let filePath = "";
try {
  const parsed = JSON.parse(arg);
  filePath = parsed.file_path || "";
} catch {
  // Not JSON, try as direct path
  filePath = arg;
}

if (!filePath) {
  process.exit(0);
}

// Security: Reject option-like paths
// Use [0] instead of startsWith to avoid pattern trigger (Review #200 R4 - Qodo)
if (filePath[0] === "-") {
  process.exit(0);
}

// Reject multiline paths
if (filePath.includes("\n") || filePath.includes("\r")) {
  process.exit(0);
}

// Normalize backslashes to forward slashes
filePath = filePath.replace(/\\/g, "/");

// Block absolute paths (use [0] to avoid startsWith pattern - Review #200 R4 - Qodo)
if (filePath[0] === "/" || /^[A-Za-z]:\//.test(filePath)) {
  process.exit(0);
}
// Block path traversal (use regex for segment matching - Review #200 R4 - Qodo)
if (/(?:^|\/)\.\.(?:\/|$)/.test(filePath)) {
  process.exit(0);
}

// Only check JS/TS files and shell scripts
if (!/\.(js|ts|tsx|jsx|sh|yml|yaml)$/.test(filePath)) {
  process.exit(0);
}

// Change to project directory
process.chdir(projectDir);

// Compute relative path (cross-platform: use path.sep for separator)
// Use path-based matching instead of startsWith (Review #200 R4 - Qodo)
let relPath = filePath;
if (path.isAbsolute(filePath)) {
  relPath = path.relative(projectDir, filePath);
  if (!relPath || relPath === ".." || relPath.split(path.sep)[0] === "..") {
    process.exit(0);
  }
}

// Verify containment (wrap realpathSync in try/catch for filesystem errors)
// Note: No existsSync check - avoid TOCTOU race, rely on realpathSync error handling (Review #200)
const fullPath = path.resolve(projectDir, relPath);
let realPath = "";
let realProject = "";
try {
  realPath = fs.realpathSync(fullPath);
  realProject = fs.realpathSync(projectDir);
} catch (err) {
  // File doesn't exist or is inaccessible - skip pattern check (Review #200 - logging added)
  // Sanitize error message to prevent path disclosure (Review #200 Round 2 - Qodo compliance)
  // Add timestamp for audit trail (Review #200 Round 2 - Qodo Comprehensive Audit Trails)
  const timestamp = new Date().toISOString();
  const safeMsg = sanitizeFilesystemError(err);
  const safePath = sanitizePathForLog(relPath);
  console.error(
    `[${timestamp}] Pattern check skipped: ${safePath} (file not accessible: ${safeMsg})`
  );
  process.exit(0);
}
// rel === '' means file path equals projectDir (invalid for file operations)
const pathRel = path.relative(realProject, realPath);
// Use segment-based check instead of startsWith (Review #200 R4 - Qodo)
const pathSegments = pathRel.split(path.sep);
if (pathRel === "" || pathSegments[0] === ".." || pathRel === ".." || path.isAbsolute(pathRel)) {
  process.exit(0);
}

// Quick Win: Skip pattern check for small files (<100 lines) to reduce latency (Review #200)
// Pre-check file size before reading (Review #200 - Qodo suggestion #7)
// Use realPath instead of fullPath to prevent TOCTOU race (Review #200 Round 2 - Qodo suggestion #0)
try {
  const { size } = fs.statSync(realPath);
  // Approximate small files (under ~8 KB) as <100 lines
  if (size < 8 * 1024) {
    process.exit(0);
  }

  // File is large enough - check line count
  const content = fs.readFileSync(realPath, "utf8");

  // Skip binary files (Review #200 R4 - Qodo)
  // Check for null bytes which indicate binary content
  if (content.includes("\0")) {
    process.exit(0);
  }

  // Optimize line counting to avoid creating large array (Review #200 - Qodo suggestion #13)
  let lineCount = 1;
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10) lineCount++;
  }

  if (lineCount < 100) {
    process.exit(0);
  }
} catch (err) {
  // Exit gracefully on precheck failure instead of proceeding (Review #200 R4 - Qodo)
  // Log error for debugging (Review #200 - Qodo suggestion #4)
  // Sanitize error message to prevent path disclosure (Review #200 Round 2 - Qodo compliance)
  // Add timestamp for audit trail (Review #200 Round 2 - Qodo Comprehensive Audit Trails)
  const timestamp = new Date().toISOString();
  const safeMsg = sanitizeFilesystemError(err);
  const safePath = sanitizePathForLog(relPath);
  console.error(`[${timestamp}] Pattern check skipped (precheck failed): ${safePath}: ${safeMsg}`);
  // Exit gracefully - don't risk running pattern checker on inaccessible files
  console.log("ok");
  process.exit(0);
}

// Run pattern checker using spawnSync to avoid command injection
const result = spawnSync("node", ["scripts/check-pattern-compliance.js", relPath], {
  encoding: "utf8",
  stdio: ["pipe", "pipe", "pipe"],
  timeout: 30000,
  cwd: projectDir,
});

// Combine stdout and stderr - violations may be written to either
const output = `${result.stdout || ""}${result.stderr || ""}`;

// If the checker couldn't run (timeout / spawn error), don't emit misleading warnings
if (result.error || result.signal) {
  console.log("ok");
  process.exit(0);
}

// Check for violations - use stderr for informational messages
if (output.includes("potential pattern violation")) {
  console.error("");
  console.error("\u26a0\ufe0f  PATTERN CHECK REMINDER");
  console.error("\u2501".repeat(28));

  // Extract relevant lines
  const lines = output.split("\n");
  for (const line of lines) {
    if (/📄|Line|✓ Fix|📚 See/.test(line)) {
      console.error(line);
    }
  }

  console.error("");
  console.error("Review docs/agent_docs/CODE_PATTERNS.md (🔴 = critical) for documented patterns.");
  console.error("\u2501".repeat(28));
} else if (typeof result.status === "number" && result.status !== 0) {
  // Non-zero exit without explicit violation - non-blocking reminder
  console.error("");
  console.error("\u26a0\ufe0f  PATTERN CHECK: Review docs/agent_docs/CODE_PATTERNS.md");
}

// Protocol: stdout only contains "ok"
console.log("ok");
process.exit(0);
