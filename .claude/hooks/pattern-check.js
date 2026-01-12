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

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get and validate project directory
const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;
const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Security: Ensure projectDir is within baseDir (prevent path traversal)
if (!projectDir.startsWith(safeBaseDir + path.sep) && projectDir !== safeBaseDir) {
  process.exit(0);
}

// Parse file path from arguments (JSON format: {"file_path": "..."})
const arg = process.argv[2] || '';
if (!arg) {
  process.exit(0);
}

// Extract file_path from JSON
let filePath = '';
try {
  const parsed = JSON.parse(arg);
  filePath = parsed.file_path || '';
} catch {
  // Not JSON, try as direct path
  filePath = arg;
}

if (!filePath) {
  process.exit(0);
}

// Security: Reject option-like paths
if (filePath.startsWith('-')) {
  process.exit(0);
}

// Reject multiline paths
if (filePath.includes('\n') || filePath.includes('\r')) {
  process.exit(0);
}

// Normalize backslashes to forward slashes
filePath = filePath.replace(/\\/g, '/');

// Block absolute paths and traversal
if (filePath.startsWith('/') || filePath.startsWith('//') || /^[A-Za-z]:\//.test(filePath)) {
  process.exit(0);
}
if (filePath.includes('/../') || filePath.startsWith('../') || filePath.endsWith('/..')) {
  process.exit(0);
}

// Only check JS/TS files and shell scripts
if (!/\.(js|ts|tsx|jsx|sh|yml|yaml)$/.test(filePath)) {
  process.exit(0);
}

// Change to project directory
process.chdir(projectDir);

// Compute relative path
let relPath = filePath;
if (filePath.startsWith(projectDir + '/')) {
  relPath = filePath.slice(projectDir.length + 1);
}

// Verify file exists and is within project
const fullPath = path.resolve(projectDir, relPath);
if (!fs.existsSync(fullPath)) {
  process.exit(0);
}

// Verify containment
const realPath = fs.realpathSync(fullPath);
const realProject = fs.realpathSync(projectDir);
if (!realPath.startsWith(realProject + path.sep) && realPath !== realProject) {
  process.exit(0);
}

// Run pattern checker using spawnSync to avoid command injection
const result = spawnSync('node', ['scripts/check-pattern-compliance.js', relPath], {
  encoding: 'utf8',
  stdio: ['pipe', 'pipe', 'pipe'],
  timeout: 30000,
  cwd: projectDir
});

// Combine stdout and stderr - violations may be written to either
const output = `${result.stdout || ''}${result.stderr || ''}`;

// Check for violations
if (output.includes('potential pattern violation')) {
  console.log('');
  console.log('\u26a0\ufe0f  PATTERN CHECK REMINDER');
  console.log('\u2501'.repeat(28));

  // Extract relevant lines
  const lines = output.split('\n');
  for (const line of lines) {
    if (/📄|Line|✓ Fix|📚 See/.test(line)) {
      console.log(line);
    }
  }

  console.log('');
  console.log('Review docs/agent_docs/CODE_PATTERNS.md for documented patterns.');
  console.log('\u2501'.repeat(28));
} else if (result.status !== 0) {
  // Non-zero exit without explicit violation - non-blocking reminder
  console.log('');
  console.log('\u26a0\ufe0f  PATTERN CHECK: Review docs/agent_docs/CODE_PATTERNS.md');
}

process.exit(0);
