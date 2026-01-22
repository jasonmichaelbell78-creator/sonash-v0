#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * firestore-write-block.js - PostToolUse hook for Firestore security
 *
 * BLOCKS direct writes to protected Firestore collections.
 * Enforces CLAUDE.md Section 2: Use Cloud Functions (httpsCallable) instead.
 *
 * From HOOKIFY_STRATEGY.md #1: Direct Firestore Write Prevention
 * - Trigger: Write/Edit containing addDoc/setDoc/updateDoc to protected collections
 * - Action: BLOCK operation
 * - Time Cost: +50ms per Write/Edit
 */

const fs = require("node:fs");
const path = require("node:path");

// Protected collections that require Cloud Functions
const PROTECTED_COLLECTIONS = [
  "journal",
  "daily_logs",
  "inventoryEntries",
  "goals",
  "reflections",
  "users", // User documents should go through Cloud Functions for security
];

// Paths that are allowed to write directly (admin scripts, etc.)
const ALLOWED_PATHS = [
  /^app\/admin\//,
  /^functions\/src\//,
  /^scripts\//,
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /__tests__\//,
  /__mocks__\//,
];

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

// Only check TypeScript/JavaScript files
if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) {
  console.log("ok");
  process.exit(0);
}

// Check if path is in allowed list
const isAllowedPath = ALLOWED_PATHS.some((pattern) => pattern.test(filePath));
if (isAllowedPath) {
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

// Patterns to detect direct Firestore writes
// These must be specific enough to avoid false positives
// Note: Include backticks to prevent template literal bypass
const FIRESTORE_WRITE_PATTERNS = [
  // addDoc(collection(db, "collectionName"), data)
  /addDoc\s*\(\s*collection\s*\([^,]+,\s*["'`](\w+)["'`]\)/g,
  // setDoc(doc(db, "collectionName", id), data)
  /setDoc\s*\(\s*doc\s*\([^,]+,\s*["'`](\w+)["'`]/g,
  // updateDoc(doc(db, "collectionName", id), data)
  /updateDoc\s*\(\s*doc\s*\([^,]+,\s*["'`](\w+)["'`]/g,
  // deleteDoc(doc(db, "collectionName", id))
  /deleteDoc\s*\(\s*doc\s*\([^,]+,\s*["'`](\w+)["'`]/g,
  // db.collection("collectionName").add/set/update/delete
  /\.collection\s*\(\s*["'`](\w+)["'`]\s*\)\s*\.\s*(?:add|set|update|delete)/g,
];

// Check for violations
const violations = [];

for (const pattern of FIRESTORE_WRITE_PATTERNS) {
  // Reset lastIndex for global regex
  pattern.lastIndex = 0;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const collectionName = match[1];
    if (PROTECTED_COLLECTIONS.includes(collectionName)) {
      violations.push({
        collection: collectionName,
        matchedText: match[0].slice(0, 60) + (match[0].length > 60 ? "..." : ""),
      });
    }
  }
}

// If violations found, BLOCK the operation
if (violations.length > 0) {
  console.error("");
  console.error("\u274c  FIRESTORE WRITE BLOCKED");
  console.error("\u2501".repeat(30));
  console.error(`File: ${filePath}`);
  console.error("");
  console.error("Direct writes to protected collections are prohibited.");
  console.error("Use Cloud Functions (httpsCallable) instead.");
  console.error("");
  console.error("Violations found:");
  for (const v of violations) {
    console.error(`  - Collection: "${v.collection}"`);
    console.error(`    Pattern: ${v.matchedText}`);
  }
  console.error("");
  console.error("Correct pattern:");
  console.error('  const addEntry = httpsCallable(functions, "addJournalEntry");');
  console.error("  await addEntry({ content: ... });");
  console.error("");
  console.error("See: CLAUDE.md Section 2, docs/SERVER_SIDE_SECURITY.md");
  console.error("\u2501".repeat(30));

  // Return "block" to prevent the operation
  console.log("block: Direct Firestore writes to protected collections are not allowed");
  process.exit(0);
}

// No violations - allow operation
console.log("ok");
process.exit(0);
