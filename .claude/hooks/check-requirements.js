#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * check-requirements.js - Unified PostToolUse hook for Write, Edit, and MultiEdit tools
 * Consolidation of check-write-requirements.js and check-edit-requirements.js (OPT-H003/H011)
 *
 * Priority order varies by tool:
 *   Write: tests → security → code → markdown → config
 *   Edit/MultiEdit: security → tests → code → markdown
 *
 * Accepts tool name via CLAUDE_TOOL env var (set by Claude hooks system)
 * or falls back to detecting from hook context.
 */

const path = require("node:path");

// Get base directory for path containment check
const baseDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());

// Detect tool from environment (Claude sets CLAUDE_TOOL for PostToolUse hooks)
const toolName = (process.env.CLAUDE_TOOL || "edit").toLowerCase();
const isWriteTool = toolName === "write";

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

// --- Classification helpers ---

const isTestFile = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filename);
const isTestDir = /__tests__|\/test\/|\/tests\/|\/spec\//.test(pathLower);
const isCodeFile = /\.(ts|tsx|js|jsx|py|sh|go|rs|rb|php|java|kt|swift)$/.test(filename);
const isMarkdownFile = /\.md$/.test(filename);

// Security keywords - Edit/MultiEdit uses broader set including filenames
const securityKeywordsBase =
  /(^|[^a-z0-9])(auth|token|credential|secret|password|apikey|api-key|jwt|oauth|session|encrypt|crypto)([^a-z0-9]|$)/;
const securityKeywordsExtended =
  /(^|[^a-z0-9])(auth|token|credential|secret|password|apikey|api-key|jwt|oauth|session|encrypt|crypto|keys?|cert|certificate|ssl|tls|hash|hmac)([^a-z0-9]|$)/;
const securityFilenames = /^(\.env|secrets|credentials|auth|token|keys?|cert|certificate)/;

const isSecuritySensitive = isWriteTool
  ? securityKeywordsBase.test(pathLower)
  : securityKeywordsExtended.test(pathLower) || securityFilenames.test(filename);

const isConfigFile = /\.(env|env\..+|config|cfg|ini|yaml|yml|json)$/.test(filename);
const hasSensitiveName =
  /(secret|credential|auth|key|token|password)/.test(filename) || filename.startsWith(".env");

// --- Priority-ordered checks ---

if (isWriteTool) {
  // Write tool: tests → security → code → markdown → config

  if (isTestFile) {
    console.log("POST-TASK: SHOULD run test-engineer agent to validate test strategy");
    process.exit(0);
  }

  if (isSecuritySensitive) {
    console.log("POST-TASK: MUST run security-auditor agent before committing");
    process.exit(0);
  }

  if (isCodeFile) {
    console.log("POST-TASK: MUST run code-reviewer agent before committing");
    process.exit(0);
  }

  if (isMarkdownFile) {
    console.log("POST-TASK: SHOULD run technical-writer agent for quality check");
    process.exit(0);
  }

  if (isConfigFile && hasSensitiveName) {
    console.log("POST-TASK: SHOULD review for sensitive data exposure");
    process.exit(0);
  }
} else {
  // Edit/MultiEdit tool: security → tests → code → markdown

  if (isSecuritySensitive) {
    console.log("POST-TASK: MUST run security-auditor agent before committing");
    process.exit(0);
  }

  if (isTestFile || isTestDir) {
    console.log("POST-TASK: SHOULD run test-engineer agent to validate tests");
    process.exit(0);
  }

  if (isCodeFile) {
    console.log("POST-TASK: MUST run code-reviewer agent before committing");
    process.exit(0);
  }

  if (isMarkdownFile) {
    console.log("POST-TASK: SHOULD run technical-writer agent for quality check");
    process.exit(0);
  }
}

console.log("ok");
