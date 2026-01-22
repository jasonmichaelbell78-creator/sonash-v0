#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * component-size-check.js - PostToolUse hook for component size limits
 *
 * Warns when React components exceed recommended size thresholds.
 * Non-blocking: outputs warnings but doesn't fail the operation.
 *
 * From HOOKIFY_STRATEGY.md #16: Component File Size Limit
 * - Trigger: File path matches app/ *.tsx, line count >300
 * - Action: WARN (not block)
 * - Time Cost: +10ms per Write/Edit
 */

const fs = require("node:fs");
const path = require("node:path");

// Configuration
const LINE_LIMIT = 300;
const FORM_LINE_LIMIT = 500; // Higher limit for form components

// Get and validate project directory
const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;
const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Security: Ensure projectDir is within baseDir
const baseRel = path.relative(safeBaseDir, projectDir);
if (baseRel.startsWith(".." + path.sep) || baseRel === ".." || path.isAbsolute(baseRel)) {
  console.log("ok");
  process.exit(0);
}

// Parse file path from arguments
const arg = process.argv[2] || "";
if (!arg) {
  console.log("ok");
  process.exit(0);
}

// Extract file_path from JSON
let filePath = "";
try {
  const parsed = JSON.parse(arg);
  filePath = parsed.file_path || "";
} catch {
  filePath = arg;
}

if (!filePath) {
  console.log("ok");
  process.exit(0);
}

// Security validations
if (filePath.startsWith("-")) {
  console.log("ok");
  process.exit(0);
}

if (filePath.includes("\n") || filePath.includes("\r")) {
  console.log("ok");
  process.exit(0);
}

// Normalize backslashes
filePath = filePath.replace(/\\/g, "/");

// Block absolute paths (cross-platform) and traversal
if (path.isAbsolute(filePath) || /^[A-Za-z]:/.test(filePath)) {
  console.log("ok");
  process.exit(0);
}
// Use regex for ".." detection (handles .., ../, ..\ edge cases)
if (filePath.includes("/../") || /^\.\.(?:[\\/]|$)/.test(filePath) || filePath.endsWith("/..")) {
  console.log("ok");
  process.exit(0);
}

// Only check React component files in app/ or components/ directories
if (!/^(?:app|components)\/.*\.tsx$/.test(filePath)) {
  console.log("ok");
  process.exit(0);
}

// Skip test files
if (/\.(test|spec)\.tsx$/.test(filePath)) {
  console.log("ok");
  process.exit(0);
}

// Change to project directory
process.chdir(projectDir);

// Resolve full path
const fullPath = path.resolve(projectDir, filePath);

// Verify containment BEFORE file access (prevents TOCTOU race condition)
// Use path.relative on resolved paths without realpathSync
const pathRel = path.relative(projectDir, fullPath);
if (/^\.\.(?:[\\/]|$)/.test(pathRel) || pathRel === "" || path.isAbsolute(pathRel)) {
  console.log("ok");
  process.exit(0);
}

// Read file (skip existsSync to avoid race condition - just try/catch the read)
let content = "";
try {
  content = fs.readFileSync(fullPath, "utf8");
} catch {
  // File doesn't exist or can't be read - exit cleanly
  console.log("ok");
  process.exit(0);
}

const lines = content.split("\n");
const lineCount = lines.length;

// Determine threshold based on file type
const isFormComponent = /Form\.tsx$/.test(filePath) || /form/i.test(filePath);
const threshold = isFormComponent ? FORM_LINE_LIMIT : LINE_LIMIT;

// Check if over threshold
if (lineCount > threshold) {
  console.error("");
  console.error("\u26a0\ufe0f  COMPONENT SIZE WARNING");
  console.error("\u2501".repeat(28));
  console.error(`File: ${filePath}`);
  console.error(`Lines: ${lineCount} (threshold: ${threshold})`);
  console.error("");
  console.error("Consider splitting into smaller components:");
  console.error("  - Extract sub-components for distinct UI sections");
  console.error("  - Move business logic to custom hooks");
  console.error("  - Extract utility functions to separate files");
  console.error("");
  console.error("See: docs/agent_docs/CODE_PATTERNS.md for component patterns");
  console.error("\u2501".repeat(28));
}

// Always succeed - this is a warning, not a blocker
console.log("ok");
process.exit(0);
