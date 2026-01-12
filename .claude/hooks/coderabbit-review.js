#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename, no-control-regex */
/**
 * coderabbit-review.js - PostToolUse hook for CodeRabbit AI review integration
 * Cross-platform replacement for coderabbit-review.sh
 *
 * Triggers CodeRabbit review after significant code changes
 * Creates autonomous loop: Claude writes -> CodeRabbit reviews -> Claude fixes
 *
 * Install CodeRabbit CLI:
 *   curl -fsSL https://cli.coderabbit.ai/install.sh | sh
 *   coderabbit auth login
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Exit early if no arguments
if (process.argv.length <= 2) {
  console.log('ok');
  process.exit(0);
}

// Check if CodeRabbit CLI is available
function hasCodeRabbit() {
  const result = spawnSync('coderabbit', ['--version'], {
    stdio: 'pipe',
    encoding: 'utf8',
    timeout: 5000
  });
  return !result.error && result.status === 0;
}

if (!hasCodeRabbit()) {
  console.log('ok');
  process.exit(0);
}

// Portable lowercase
function toLower(str) {
  return str.toLowerCase();
}

// Track findings
let foundIssues = false;
let allFindings = '';
const MAX_FILES = 10;
let reviewed = 0;

// Get file paths from arguments
const filePaths = process.argv.slice(2);

for (const filePath of filePaths) {
  // Skip non-existent files (guard against TOCTOU race)
  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      continue;
    }
  } catch {
    continue;
  }

  const filename = path.basename(filePath);
  const filenameLower = toLower(filename);

  // Only review code files
  if (!/\.(ts|tsx|js|jsx|py|sh|go|rs|rb|php|java|kt|swift)$/.test(filenameLower)) {
    continue;
  }

  reviewed++;
  if (reviewed > MAX_FILES) {
    allFindings += `\n--- (skipped remaining code files, limit: ${MAX_FILES}) ---\n`;
    break;
  }

  // Run CodeRabbit review with timeout
  try {
    // Note: Options must come before -- separator
    const result = spawnSync(
      'coderabbit',
      ['review', '--plain', '--severity', 'medium', '--', filePath],
      {
        encoding: 'utf8',
        timeout: 20000,
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );

    // Skip timeouts
    if (result.signal === 'SIGTERM') {
      allFindings += `\n--- ${filePath} ---\n(review timed out after 20s)\n`;
      continue;
    }

    // Skip errors
    if (result.status !== 0) {
      if (result.stdout && result.stdout.length < 200) {
        allFindings += `\n--- ${filePath} ---\n(review failed: exit ${result.status})\n`;
      }
      continue;
    }

    let output = result.stdout || '';

    // Check for actionable findings
    if (output && !output.includes('No issues found') && !/^\s*error:/i.test(output)) {
      foundIssues = true;

      // Truncate long output
      if (output.length > 1500) {
        output = output.slice(0, 1500) + '... (truncated)';
      }

      // Strip ANSI escape sequences
      output = output.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');

      allFindings += `\n--- ${filePath} ---\n${output}\n`;
    }
  } catch {
    // Skip on error, don't block
    continue;
  }
}

// Output findings to stderr
if (foundIssues || allFindings) {
  // Cap total output
  if (allFindings.length > 3000) {
    allFindings = allFindings.slice(0, 3000) + '... (output truncated)';
  }

  console.error('CodeRabbit Review Findings:');
  console.error(allFindings);
  console.error('');
  console.error('Consider addressing these issues before committing.');
}

// Protocol: stdout only contains "ok"
console.log('ok');
