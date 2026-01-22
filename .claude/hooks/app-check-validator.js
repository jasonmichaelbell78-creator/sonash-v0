#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * app-check-validator.js - PostToolUse hook for Cloud Functions security
 *
 * Warns when Cloud Functions don't verify App Check tokens.
 * Currently WARN only (not block) since App Check is disabled per ROADMAP.md.
 *
 * From HOOKIFY_STRATEGY.md #5: App Check Validator
 * - Trigger: functions/src files with onCall but no context.app check
 * - Action: WARN (will become BLOCK when App Check is re-enabled)
 * - Time Cost: +60ms per Write/Edit on functions files
 */

const fs = require("node:fs");
const path = require("node:path");

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

// Parse arguments
const arg = process.argv[2] || "";
if (!arg) {
  console.log("ok");
  process.exit(0);
}

// Extract file_path and content from JSON
let filePath = "";
let content = "";
try {
  const parsed = JSON.parse(arg);
  filePath = parsed.file_path || "";
  content = parsed.content || "";
} catch {
  console.log("ok");
  process.exit(0);
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

// Only check Cloud Functions source files
if (!/^functions\/src\/.*\.ts$/.test(filePath)) {
  console.log("ok");
  process.exit(0);
}

// Skip test files
if (/\.(test|spec)\.ts$/.test(filePath)) {
  console.log("ok");
  process.exit(0);
}

// If no content provided (Edit tool), read the file (skip existsSync to avoid race condition)
if (!content) {
  const fullPath = path.resolve(projectDir, filePath);
  try {
    content = fs.readFileSync(fullPath, "utf8");
  } catch {
    // File doesn't exist or can't be read
    console.log("ok");
    process.exit(0);
  }
}

if (!content) {
  console.log("ok");
  process.exit(0);
}

// Check if file defines onCall functions
const hasOnCall = /\bonCall\s*[<(]/.test(content);
if (!hasOnCall) {
  console.log("ok");
  process.exit(0);
}

// Check for App Check verification patterns
// Note: We check for either pattern since App Check is currently disabled
const APP_CHECK_PATTERNS = [
  // Direct context.app check
  /context\.app/,
  // Using withSecurityChecks wrapper (which includes App Check)
  /withSecurityChecks/,
  // requireAppCheck option
  /requireAppCheck/,
  // Explicit comment indicating App Check is handled elsewhere or disabled
  /App\s*Check/i,
];

const hasAppCheckHandling = APP_CHECK_PATTERNS.some((pattern) => pattern.test(content));

// If no App Check handling and defines onCall, warn
if (!hasAppCheckHandling) {
  console.error("");
  console.error("\u26a0\ufe0f  APP CHECK WARNING");
  console.error("\u2501".repeat(25));
  console.error(`File: ${filePath}`);
  console.error("");
  console.error("Cloud Function uses onCall but may not verify App Check.");
  console.error("");
  console.error("When App Check is re-enabled, add verification:");
  console.error("  if (!context.app) {");
  console.error('    throw new HttpsError("failed-precondition", "App Check required");');
  console.error("  }");
  console.error("");
  console.error("Or use the withSecurityChecks wrapper which handles this.");
  console.error("");
  console.error("Note: App Check is currently DISABLED per ROADMAP.md M2.");
  console.error("See: docs/reviews/2026-Q1/canonical/tier2-output/APP_CHECK_REENABLE_PLAN.md");
  console.error("\u2501".repeat(25));
}

// Always succeed - this is currently a warning only
// Change to "block" when App Check is re-enabled
console.log("ok");
process.exit(0);
