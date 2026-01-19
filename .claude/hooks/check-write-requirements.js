#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * check-write-requirements.js - PostToolUse hook for Write tool
 * Cross-platform replacement for check-write-requirements.sh
 *
 * Priority order:
 * 1. Test files (before code to avoid misclassification)
 * 2. Security-sensitive files
 * 3. Code files
 * 4. Markdown files
 * 5. Config files with secrets
 */

const path = require("node:path");

// Get base directory for path containment check
const baseDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());

// Get file path from arguments (could be JSON or direct path)
let filePath = process.argv[2] || "";

// Try to parse as JSON if it looks like JSON
if (filePath.startsWith("{")) {
  try {
    const parsed = JSON.parse(filePath);
    filePath = parsed.file_path || "";
  } catch {
    filePath = "";
  }
}

// Validate input
if (!filePath) {
  console.log("ok");
  process.exit(0);
}

// Security: Reject option-like or multiline paths
if (filePath.startsWith("-") || filePath.includes("\n") || filePath.includes("\r")) {
  console.log("ok");
  process.exit(0);
}

// Normalize Windows backslashes to forward slashes for cross-platform consistency
filePath = filePath.replace(/\\/g, "/");

// Security: Resolve path and verify containment within baseDir using path.relative()
// rel === '' means file path equals baseDir (invalid for file operations)
const resolvedPath = path.resolve(baseDir, filePath);
const rel = path.relative(baseDir, resolvedPath);
if (rel === "" || rel.startsWith(".." + path.sep) || rel === ".." || path.isAbsolute(rel)) {
  console.log("ok");
  process.exit(0);
}

// Sanitize - only allow safe characters
const sanitized = filePath.replace(/[^a-zA-Z0-9._/-]/g, "");
if (sanitized !== filePath || sanitized.length === 0) {
  console.log("ok");
  process.exit(0);
}

// Truncate long paths
const safePath = sanitized.slice(0, 500);
const filename = path.basename(safePath).toLowerCase();
const pathLower = safePath.toLowerCase();

// Priority 1: Test files
if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filename)) {
  console.log("POST-TASK: SHOULD run test-engineer agent to validate test strategy");
  process.exit(0);
}

// Priority 2: Security-sensitive files (word boundary matching)
const securityKeywords =
  /(^|[^a-z0-9])(auth|token|credential|secret|password|apikey|api-key|jwt|oauth|session|encrypt|crypto)([^a-z0-9]|$)/;
if (securityKeywords.test(pathLower)) {
  console.log("POST-TASK: MUST run security-auditor agent before committing");
  process.exit(0);
}

// Priority 3: Code files
if (/\.(ts|tsx|js|jsx|py|sh|go|rs|rb|php|java|kt|swift)$/.test(filename)) {
  console.log("POST-TASK: MUST run code-reviewer agent before committing");
  process.exit(0);
}

// Priority 4: Markdown files
if (/\.md$/.test(filename)) {
  console.log("POST-TASK: SHOULD run technical-writer agent for quality check");
  process.exit(0);
}

// Priority 5: Config files that may contain secrets
const isConfigFile = /\.(env|env\..+|config|cfg|ini|yaml|yml|json)$/.test(filename);
const hasSensitiveName =
  /(secret|credential|auth|key|token|password)/.test(filename) || filename.startsWith(".env");
if (isConfigFile && hasSensitiveName) {
  console.log("POST-TASK: SHOULD review for sensitive data exposure");
  process.exit(0);
}

console.log("ok");
