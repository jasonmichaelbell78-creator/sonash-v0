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

// Get and validate project directory
const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;
const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Security: Ensure projectDir is within baseDir using path.relative() (prevent path traversal)
const baseRel = path.relative(safeBaseDir, projectDir);
if (baseRel.startsWith(".." + path.sep) || baseRel === ".." || path.isAbsolute(baseRel)) {
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
if (filePath.startsWith("-")) {
  process.exit(0);
}

// Reject multiline paths
if (filePath.includes("\n") || filePath.includes("\r")) {
  process.exit(0);
}

// Normalize backslashes to forward slashes
filePath = filePath.replace(/\\/g, "/");

// Block absolute paths and traversal
if (filePath.startsWith("/") || filePath.startsWith("//") || /^[A-Za-z]:\//.test(filePath)) {
  process.exit(0);
}
if (filePath.includes("/../") || filePath.startsWith("../") || filePath.endsWith("/..")) {
  process.exit(0);
}

// Only check JS/TS files and shell scripts
if (!/\.(js|ts|tsx|jsx|sh|yml|yaml)$/.test(filePath)) {
  process.exit(0);
}

// Change to project directory
process.chdir(projectDir);

// Compute relative path (cross-platform: use path.sep for separator)
let relPath = filePath;
const projectDirWithSep = projectDir + path.sep;
if (filePath.startsWith(projectDirWithSep)) {
  relPath = filePath.slice(projectDirWithSep.length);
}

// Verify file exists and is within project
const fullPath = path.resolve(projectDir, relPath);
if (!fs.existsSync(fullPath)) {
  process.exit(0);
}

// Verify containment (wrap realpathSync in try/catch for filesystem errors)
let realPath = "";
let realProject = "";
try {
  realPath = fs.realpathSync(fullPath);
  realProject = fs.realpathSync(projectDir);
} catch {
  process.exit(0);
}
// rel === '' means file path equals projectDir (invalid for file operations)
const pathRel = path.relative(realProject, realPath);
if (
  pathRel === "" ||
  pathRel.startsWith(".." + path.sep) ||
  pathRel === ".." ||
  path.isAbsolute(pathRel)
) {
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
