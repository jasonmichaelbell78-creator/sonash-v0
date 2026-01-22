#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * repository-pattern-check.js - PostToolUse hook for architecture patterns
 *
 * Warns when Firestore queries are placed in React components instead of service files.
 * Enforces CLAUDE.md Section 3: "Add queries to service files, not inline in components"
 *
 * From HOOKIFY_STRATEGY.md #8: Repository Pattern Validator
 * - Trigger: React components containing Firestore query methods
 * - Action: WARN (not block)
 * - Time Cost: +80ms per Write/Edit on components
 */

const fs = require("node:fs");
const path = require("node:path");

// Firestore query methods that shouldn't be in components
const FIRESTORE_QUERY_METHODS = [
  "collection",
  "doc",
  "query",
  "getDocs",
  "getDoc",
  "addDoc",
  "setDoc",
  "updateDoc",
  "deleteDoc",
  "where",
  "orderBy",
  "limit",
  "startAfter",
  "endBefore",
];

// Paths that are allowed to have Firestore queries
const ALLOWED_PATHS = [
  /^lib\//, // Service files
  /^app\/admin\//, // Admin panel
  /^functions\//, // Cloud Functions
  /^scripts\//, // Utility scripts
  /^hooks\//, // Custom hooks (may wrap services)
  /\.test\.(ts|tsx|js|jsx)$/, // Test files
  /\.spec\.(ts|tsx|js|jsx)$/, // Test files
  /__tests__\//, // Test directories
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

// Block absolute paths and traversal
if (filePath.startsWith("/") || filePath.startsWith("//") || /^[A-Za-z]:\//.test(filePath)) {
  console.log("ok");
  process.exit(0);
}
if (filePath.includes("/../") || filePath.startsWith("../") || filePath.endsWith("/..")) {
  console.log("ok");
  process.exit(0);
}

// Only check React component files (.tsx)
if (!/\.tsx$/.test(filePath)) {
  console.log("ok");
  process.exit(0);
}

// Check if path is in allowed list
const isAllowedPath = ALLOWED_PATHS.some((pattern) => pattern.test(filePath));
if (isAllowedPath) {
  console.log("ok");
  process.exit(0);
}

// If no content provided (Edit tool), read the file
if (!content) {
  const fullPath = path.resolve(projectDir, filePath);
  try {
    if (fs.existsSync(fullPath)) {
      content = fs.readFileSync(fullPath, "utf8");
    }
  } catch {
    console.log("ok");
    process.exit(0);
  }
}

if (!content) {
  console.log("ok");
  process.exit(0);
}

// Check if file imports from firebase/firestore
const hasFirestoreImport = /from\s+["']firebase\/firestore["']/.test(content);
if (!hasFirestoreImport) {
  console.log("ok");
  process.exit(0);
}

// Find Firestore method usages
const violations = [];
const lines = content.split("\n");

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;

  // Skip import lines
  if (/^\s*import\s/.test(line)) {
    continue;
  }

  // Skip comment lines
  if (/^\s*(\/\/|\/\*|\*)/.test(line)) {
    continue;
  }

  // Check for Firestore method calls
  for (const method of FIRESTORE_QUERY_METHODS) {
    // Match method call: method( or method<
    const pattern = new RegExp(`\\b${method}\\s*[(<]`);
    if (pattern.test(line)) {
      violations.push({
        line: lineNum,
        method: method,
        snippet: line.trim().slice(0, 50) + (line.length > 50 ? "..." : ""),
      });
      break; // Only report once per line
    }
  }
}

// If violations found, warn
if (violations.length > 0) {
  console.error("");
  console.error("\u26a0\ufe0f  REPOSITORY PATTERN WARNING");
  console.error("\u2501".repeat(32));
  console.error(`File: ${filePath}`);
  console.error("");
  console.error("Firestore queries detected in React component.");
  console.error("Move queries to lib/firestore-service.ts per CLAUDE.md Section 3.");
  console.error("");
  console.error("Violations:");

  // Show first 3 violations
  const showCount = Math.min(violations.length, 3);
  for (let i = 0; i < showCount; i++) {
    const v = violations[i];
    console.error(`  Line ${v.line}: ${v.method}() - ${v.snippet}`);
  }

  if (violations.length > 3) {
    console.error(`  ... and ${violations.length - 3} more`);
  }

  console.error("");
  console.error("Correct pattern:");
  console.error("  // In lib/firestore-service.ts");
  console.error("  export async function getJournalEntries(userId: string) { ... }");
  console.error("");
  console.error("  // In component");
  console.error('  import { getJournalEntries } from "@/lib/firestore-service";');
  console.error("");
  console.error("See: CLAUDE.md Section 3, ARCHITECTURE.md");
  console.error("\u2501".repeat(32));
}

// Always succeed - this is a warning, not a blocker
console.log("ok");
process.exit(0);
