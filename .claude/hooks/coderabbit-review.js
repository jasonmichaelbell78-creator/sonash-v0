#!/usr/bin/env node
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

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Exit early if no arguments
if (process.argv.length <= 2) {
  console.log('ok');
  process.exit(0);
}

// Check if CodeRabbit CLI is available
function hasCodeRabbit() {
  try {
    execSync('coderabbit --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
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
  // Skip non-existent files
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
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
    const result = spawnSync('coderabbit', ['review', '--', filePath, '--plain', '--severity', 'medium'], {
      encoding: 'utf8',
      timeout: 20000,
      stdio: ['pipe', 'pipe', 'pipe']
    });

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
  } catch (error) {
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
