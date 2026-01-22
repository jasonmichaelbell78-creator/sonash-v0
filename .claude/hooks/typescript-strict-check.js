#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * typescript-strict-check.js - PostToolUse hook for TypeScript strictness
 *
 * Warns when new TypeScript files contain `any` types or missing return types.
 * Non-blocking: outputs warnings but doesn't fail the operation.
 *
 * From HOOKIFY_STRATEGY.md #10: TypeScript Strict Mode Check
 * - Trigger: New .ts/.tsx files containing `any` type or missing return types
 * - Action: WARN (not block)
 * - Time Cost: +100ms per new file
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

// Only check TypeScript files
if (!/\.(ts|tsx)$/.test(filePath)) {
  console.log("ok");
  process.exit(0);
}

// Skip type definition files (they may legitimately use `any`)
if (/\.d\.ts$/.test(filePath)) {
  console.log("ok");
  process.exit(0);
}

// Skip test files
if (/\.(test|spec)\.(ts|tsx)$/.test(filePath)) {
  console.log("ok");
  process.exit(0);
}

// Skip scripts directory (utility scripts may use `any` for flexibility)
if (/^scripts\//.test(filePath)) {
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

// Check for `any` type usage
// Pattern: matches `: any`, `as any`, `<any>`, but not in comments or strings
const violations = [];

// Split content into lines for line number tracking
const lines = content.split("\n");

// Patterns that indicate problematic `any` usage
const ANY_PATTERNS = [
  // : any (type annotation)
  /:\s*any(?:\s*[;,)\]}]|\s*$)/,
  // as any (type assertion)
  /\s+as\s+any(?:\s*[;,)\]}]|\s*$)/,
  // <any> (generic type argument)
  /<any>/,
  // any[] (array of any)
  /:\s*any\[\]/,
  // Function return type of any
  /\)\s*:\s*any\s*[{=>]/,
];

// Check each line
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;

  // Skip comment lines
  if (/^\s*(\/\/|\/\*|\*)/.test(line)) {
    continue;
  }

  // Skip lines with eslint-disable comments for any
  if (/eslint-disable.*@typescript-eslint\/no-explicit-any/.test(line)) {
    continue;
  }

  // Check for any patterns
  for (const pattern of ANY_PATTERNS) {
    if (pattern.test(line)) {
      // Extract the relevant portion
      const match = line.trim().slice(0, 60);
      violations.push({
        line: lineNum,
        snippet: match + (line.length > 60 ? "..." : ""),
        type: "any",
      });
      break; // Only report once per line
    }
  }
}

// If violations found, warn
if (violations.length > 0) {
  console.error("");
  console.error("\u26a0\ufe0f  TYPESCRIPT STRICT MODE WARNING");
  console.error("\u2501".repeat(35));
  console.error(`File: ${filePath}`);
  console.error(`Found ${violations.length} use(s) of \`any\` type:`);
  console.error("");

  // Show first 5 violations
  const showCount = Math.min(violations.length, 5);
  for (let i = 0; i < showCount; i++) {
    const v = violations[i];
    console.error(`  Line ${v.line}: ${v.snippet}`);
  }

  if (violations.length > 5) {
    console.error(`  ... and ${violations.length - 5} more`);
  }

  console.error("");
  console.error("Suggestions:");
  console.error("  - Use `unknown` instead of `any` when type is truly unknown");
  console.error("  - Define proper types/interfaces");
  console.error("  - Use generics for flexible typing");
  console.error("  - Add eslint-disable comment if `any` is intentional");
  console.error("");
  console.error("See: tsconfig.json strict mode settings");
  console.error("\u2501".repeat(35));
}

// Always succeed - this is a warning, not a blocker
console.log("ok");
process.exit(0);
