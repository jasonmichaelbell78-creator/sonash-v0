#!/usr/bin/env node
/**
 * check-agent-compliance.js - Pre-commit verification of agent usage
 *
 * Checks if code files are being committed and verifies that appropriate
 * agents were invoked during the session.
 *
 * Exit codes:
 *   0 = OK (no issues or agents were used)
 *   1 = Warning (agents recommended but not used) - non-blocking by default
 *
 * Options:
 *   --strict    Exit with code 1 if agents weren't used (blocking)
 *   --quiet     Suppress output
 *
 * File patterns and agent expectations are configurable below.
 */

const { readFileSync, existsSync } = require('node:fs');
const { execSync } = require('node:child_process');
const { join } = require('node:path');

const ROOT = join(__dirname, '..', '..');

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const QUIET = args.includes('--quiet');

// File patterns that require agent review - CONFIGURABLE
const CODE_PATTERNS = /\.(ts|tsx|js|jsx)$/;
const SECURITY_PATTERNS = /(middleware\.ts|(?:src|lib)\/(?:auth|security)\/)/;
const EXCLUDE_PATTERNS = /\.(test|spec)\.(ts|tsx|js|jsx)$|__tests__|node_modules|\.claude\//;

// Expected agents for file types - CONFIGURABLE
const AGENT_EXPECTATIONS = {
  code: {
    pattern: CODE_PATTERNS,
    exclude: EXCLUDE_PATTERNS,
    agent: 'code-reviewer',
    message: 'Code files modified - code-reviewer agent recommended',
  },
  security: {
    pattern: SECURITY_PATTERNS,
    exclude: /\.test\.|\.spec\./,
    agent: 'security-auditor',
    message: 'Security-sensitive files modified - security-auditor agent recommended',
  },
};

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 15_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function getCurrentSessionId() {
  const sessionStatePath = join(ROOT, '.claude/hooks/.session-state.json');
  try {
    if (!existsSync(sessionStatePath)) return null;
    const sessionState = JSON.parse(readFileSync(sessionStatePath, 'utf8'));
    return sessionState.currentSessionId || null;
  } catch {
    return null;
  }
}

function getInvokedAgents() {
  const statePath = join(ROOT, '.claude/hooks/.session-agents.json');
  try {
    if (!existsSync(statePath)) return null;

    const currentSessionId = getCurrentSessionId();
    if (!currentSessionId) return null;

    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    if (state.sessionId !== currentSessionId) return null;

    const invoked = Array.isArray(state.agentsInvoked) ? state.agentsInvoked : [];
    return invoked.map((a) => (a && typeof a.agent === 'string' ? a.agent : null)).filter(Boolean);
  } catch {
    return null;
  }
}

function checkCompliance() {
  const stagedFiles = getStagedFiles();
  const invokedAgents = getInvokedAgents();

  if (invokedAgents === null) {
    return [];
  }

  const issues = [];

  for (const [type, expectation] of Object.entries(AGENT_EXPECTATIONS)) {
    const matchingFiles = stagedFiles.filter((file) => {
      if (!expectation.pattern.test(file)) return false;
      if (expectation.exclude && expectation.exclude.test(file)) return false;
      return true;
    });

    if (matchingFiles.length > 0) {
      const agentUsed = invokedAgents.includes(expectation.agent);
      if (!agentUsed) {
        issues.push({
          type,
          agent: expectation.agent,
          message: expectation.message,
          files: matchingFiles.slice(0, 5),
          fileCount: matchingFiles.length,
        });
      }
    }
  }

  return issues;
}

function main() {
  const issues = checkCompliance();

  if (issues.length === 0) {
    if (!QUIET) {
      console.log('Agent compliance check passed');
    }
    process.exit(0);
  }

  if (!QUIET) {
    console.error('');
    console.error('AGENT COMPLIANCE CHECK');
    console.error('-'.repeat(40));

    for (const issue of issues) {
      console.error(`\n${issue.type.toUpperCase()}: ${issue.message}`);
      console.error(`   Expected agent: ${issue.agent}`);
      console.error(`   Files (${issue.fileCount}):`);
      for (const file of issue.files) {
        console.error(`     - ${file}`);
      }
      if (issue.fileCount > 5) {
        console.error(`     ... and ${issue.fileCount - 5} more`);
      }
    }

    console.error('\n' + '-'.repeat(40));

    if (STRICT) {
      console.error('BLOCKING: Run the recommended agents before committing');
      console.error('   Or use --no-verify to bypass (not recommended)');
    } else {
      console.error('WARNING: Consider running the recommended agents');
      console.error('   This is currently non-blocking (Phase 1)');
    }

    console.error('');
  }

  process.exit(STRICT ? 1 : 0);
}

main();
