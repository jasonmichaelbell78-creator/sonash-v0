#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * test-mocking-validator.js - PostToolUse hook for test security
 *
 * BLOCKS tests that mock firebase/firestore directly instead of httpsCallable.
 * This ensures tests validate security layers, not bypass them.
 *
 * From HOOKIFY_STRATEGY.md #2: Test Mocking Validator
 * - Trigger: Test files mocking "firebase/firestore" directly
 * - Action: BLOCK operation
 * - Time Cost: +30ms per Write/Edit on test files
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

// Block absolute paths and traversal
if (filePath.startsWith("/") || filePath.startsWith("//") || /^[A-Za-z]:\//.test(filePath)) {
  console.log("ok");
  process.exit(0);
}
if (filePath.includes("/../") || filePath.startsWith("../") || filePath.endsWith("/..")) {
  console.log("ok");
  process.exit(0);
}

// Only check test files
const isTestFile = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) || /__tests__\//.test(filePath);
if (!isTestFile) {
  console.log("ok");
  process.exit(0);
}

// Admin/functions test files are allowed to mock Firestore directly
const isAdminOrFunctionsTest =
  /^(?:app\/admin|functions)\//.test(filePath) || /scripts\//.test(filePath);
if (isAdminOrFunctionsTest) {
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

// Patterns that indicate incorrect mocking
const BAD_MOCK_PATTERNS = [
  // vi.mock("firebase/firestore")
  /vi\.mock\s*\(\s*["']firebase\/firestore["']/,
  // jest.mock("firebase/firestore")
  /jest\.mock\s*\(\s*["']firebase\/firestore["']/,
  // vi.mock("@firebase/firestore")
  /vi\.mock\s*\(\s*["']@firebase\/firestore["']/,
  // jest.mock("@firebase/firestore")
  /jest\.mock\s*\(\s*["']@firebase\/firestore["']/,
];

// Check for bad patterns
const violations = [];
for (const pattern of BAD_MOCK_PATTERNS) {
  if (pattern.test(content)) {
    violations.push(pattern.toString());
  }
}

// If violations found, BLOCK the operation
if (violations.length > 0) {
  console.error("");
  console.error("\u274c  TEST MOCKING BLOCKED");
  console.error("\u2501".repeat(28));
  console.error(`File: ${filePath}`);
  console.error("");
  console.error("Tests must mock httpsCallable, NOT firebase/firestore directly.");
  console.error("This ensures tests validate security layers.");
  console.error("");
  console.error("Bad pattern detected:");
  console.error('  vi.mock("firebase/firestore") or jest.mock("firebase/firestore")');
  console.error("");
  console.error("Correct pattern:");
  console.error('  vi.mock("firebase/functions", () => ({');
  console.error("    httpsCallable: vi.fn(() => vi.fn().mockResolvedValue({ data: {} })),");
  console.error("  }));");
  console.error("");
  console.error("See: docs/agent_docs/CODE_PATTERNS.md #5");
  console.error("\u2501".repeat(28));

  // Return "block" to prevent the operation
  console.log("block: Tests must mock httpsCallable, not firebase/firestore directly");
  process.exit(0);
}

// No violations - allow operation
console.log("ok");
process.exit(0);
