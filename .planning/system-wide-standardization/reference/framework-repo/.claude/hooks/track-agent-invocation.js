#!/usr/bin/env node
/* global require, process, console, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * track-agent-invocation.js - PostToolUse hook for Task tool
 *
 * Tracks when agents are invoked via the Task tool.
 * This data is used to verify expected agents were used and provides
 * observability into agent activity across sessions.
 *
 * Features:
 *   - Records agent type, sanitized description, and timestamp
 *   - Resets per session (keyed by session ID from session state)
 *   - Appends to persistent JSONL log for long-term observability
 *   - Redacts secrets and sensitive data from descriptions
 *   - Rotates log files to prevent unbounded growth
 */

const fs = require('node:fs');
const path = require('node:path');
const { sanitizeInput } = require('./lib/sanitize-input');

// Lazy-load shared helpers (best-effort — never block on import failure)
let isSafeToWrite, rotateJsonl, withLock;
try {
  isSafeToWrite = require('./lib/symlink-guard').isSafeToWrite;
  if (typeof isSafeToWrite !== 'function') isSafeToWrite = () => true;
} catch {
  isSafeToWrite = () => true;
}
try {
  rotateJsonl = require('./lib/rotate-state').rotateJsonl;
} catch {
  rotateJsonl = null;
}
try {
  withLock = require(path.resolve(__dirname, '..', '..', 'scripts', 'lib', 'safe-fs')).withLock;
} catch {
  withLock = null;
}

// Configuration
const STATE_FILE = '.claude/hooks/.session-agents.json';

// Get and validate project directory (shared resolver supports monorepo ancestors)
const { projectDir } = require('./lib/git-utils');

// Parse arguments - expecting JSON with Task tool parameters
const arg = process.argv[2] || '';
if (!arg) {
  console.log('ok');
  process.exit(0);
}

// Extract subagent_type from JSON
let subagentType = '';
let description = '';
try {
  const parsed = JSON.parse(arg);
  subagentType = parsed.subagent_type || '';
  description = parsed.description || '';
} catch {
  console.log('ok');
  process.exit(0);
}

if (!subagentType) {
  console.log('ok');
  process.exit(0);
}

/**
 * Read state from file (validates schema)
 */
function readState() {
  const statePath = path.join(projectDir, STATE_FILE);
  const defaults = {
    sessionId: null,
    sessionStart: null,
    agentsInvoked: [],
    agentsSuggested: [],
    filesModified: [],
  };

  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    // Validate and normalize state shape
    return {
      sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : null,
      sessionStart: typeof parsed.sessionStart === 'string' ? parsed.sessionStart : null,
      agentsInvoked: Array.isArray(parsed.agentsInvoked) ? parsed.agentsInvoked : [],
      agentsSuggested: Array.isArray(parsed.agentsSuggested) ? parsed.agentsSuggested : [],
      filesModified: Array.isArray(parsed.filesModified) ? parsed.filesModified : [],
    };
  } catch {
    // Missing/invalid file -> defaults
    return defaults;
  }
}

/**
 * Write state to file (atomic write pattern)
 */
function writeState(state) {
  const statePath = path.join(projectDir, STATE_FILE);
  const tmpPath = `${statePath}.tmp`;
  try {
    if (!isSafeToWrite(statePath) || !isSafeToWrite(tmpPath)) {
      console.warn('track-agent-invocation: refusing to write — symlink detected');
      return;
    }
    // Ensure directory exists
    const dir = path.dirname(statePath);
    fs.mkdirSync(dir, { recursive: true });
    // Atomic write: write to temp file, then rename
    // eslint-disable-next-line framework/no-non-atomic-write -- non-critical ephemeral state file
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
    fs.renameSync(tmpPath, statePath);
  } catch (err) {
    // Clean up temp file on error
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      // ignore cleanup failures
    }
    // Log error but don't block execution

    console.error(
      `Warning: Could not write to ${STATE_FILE}:`,
      sanitizeInput(err instanceof Error ? err.message : String(err)), // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
    );
  }
}

// Get current session ID from session state
function getCurrentSessionId() {
  const sessionStatePath = path.join(projectDir, '.claude/hooks/.session-state.json');
  try {
    const sessionState = JSON.parse(fs.readFileSync(sessionStatePath, 'utf8'));
    return sessionState.currentSessionId || null;
  } catch {
    return null;
  }
}

// Update state with new agent invocation
const state = readState();
const currentSessionId = getCurrentSessionId();

// Reset only on a real session change (avoid wiping state when session id is unavailable)
const isFirstInit = state.sessionId == null && state.sessionStart == null;
const hasValidSessionId = currentSessionId != null;

if (isFirstInit || (hasValidSessionId && state.sessionId !== currentSessionId)) {
  state.sessionId = currentSessionId;
  state.sessionStart = new Date().toISOString();
  state.agentsInvoked = [];
  state.agentsSuggested = [];
  state.filesModified = [];
}

// Sanitize description to remove potential sensitive data
function sanitizeDescription(desc) {
  if (!desc) return '';
  return desc
    .slice(0, 100) // Truncate for storage
    .replace(/[A-Za-z0-9+/=]{20,}/g, '[REDACTED]') // Base64-like tokens
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]') // Emails
    .replace(/password|secret|token|key|credential/gi, '[SENSITIVE]'); // Sensitive keywords
}

// Record the agent invocation
const invocation = {
  agent: subagentType,
  description: sanitizeDescription(description),
  timestamp: new Date().toISOString(),
};

state.agentsInvoked.push(invocation);
// Cap array size to prevent unbounded growth
state.agentsInvoked = state.agentsInvoked.slice(-200);
writeState(state);

// Persistent JSONL append for long-term observability (best-effort, never blocks)
try {
  const invocationsPath = path.resolve(projectDir, '.claude', 'state', 'agent-invocations.jsonl');
  const invDir = path.dirname(invocationsPath);
  fs.mkdirSync(invDir, { recursive: true });

  const persistEntry = {
    agent: subagentType,
    description: sanitizeDescription(description),
    sessionId: state.sessionId,
    timestamp: invocation.timestamp,
  };

  if (isSafeToWrite(invocationsPath)) {
    // Use file locking to prevent append/rotation race
    const doAppendAndRotate = () => {
      fs.appendFileSync(invocationsPath, JSON.stringify(persistEntry) + '\n');

      // Rotate when file gets large (keep 60 of last 100 entries, only when > 64KB)
      if (rotateJsonl) {
        try {
          const { size } = fs.lstatSync(invocationsPath);
          if (size > 64 * 1024) {
            rotateJsonl(invocationsPath, 100, 60);
          }
        } catch {
          // Non-fatal
        }
      }
    };

    if (withLock) {
      withLock(invocationsPath, doAppendAndRotate);
    } else {
      doAppendAndRotate();
    }
  }
} catch {
  // Best-effort: persistent log failure should not block hook execution
}

// Log for visibility
console.error(`Agent invoked: ${sanitizeInput(subagentType)}`);

console.log('ok');
process.exit(0);
