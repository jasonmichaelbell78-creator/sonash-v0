#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * track-agent-invocation.js - PostToolUse hook for Task tool
 *
 * Tracks when agents are invoked via the Task tool.
 * This data is used at session-end to verify expected agents were used.
 *
 * Session #101: Part of agent/skill compliance enforcement system
 */

const fs = require("node:fs");
const path = require("node:path");

// Configuration
const STATE_FILE = ".claude/hooks/.session-agents.json";

// Get and validate project directory
const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;
const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Security: Ensure projectDir is within baseDir (robust relative-path check)
const rel = path.relative(safeBaseDir, projectDir);
// Use regex for cross-platform ".." detection (handles Unix / and Windows \)
const isOutsideBase = /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel);

if (isOutsideBase) {
  console.log("ok");
  process.exit(0);
}

// Parse arguments - expecting JSON with Task tool parameters
const arg = process.argv[2] || "";
if (!arg) {
  console.log("ok");
  process.exit(0);
}

// Extract subagent_type from JSON
let subagentType = "";
let description = "";
try {
  const parsed = JSON.parse(arg);
  subagentType = parsed.subagent_type || "";
  description = parsed.description || "";
} catch {
  console.log("ok");
  process.exit(0);
}

if (!subagentType) {
  console.log("ok");
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
    const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
    // Validate and normalize state shape
    return {
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : null,
      sessionStart: typeof parsed.sessionStart === "string" ? parsed.sessionStart : null,
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
    // Ensure directory exists
    const dir = path.dirname(statePath);
    fs.mkdirSync(dir, { recursive: true });
    // Atomic write: write to temp file, then rename
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
    console.error(`Warning: Could not write to ${STATE_FILE}:`, err.message);
  }
}

// Get current session ID from session state
function getCurrentSessionId() {
  const sessionStatePath = path.join(projectDir, ".claude/hooks/.session-state.json");
  try {
    const sessionState = JSON.parse(fs.readFileSync(sessionStatePath, "utf8"));
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
  if (!desc) return "";
  return desc
    .slice(0, 100) // Truncate for storage
    .replace(/[A-Za-z0-9+/=]{20,}/g, "[REDACTED]") // Base64-like tokens
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[EMAIL]") // Emails
    .replace(/password|secret|token|key|credential/gi, "[SENSITIVE]"); // Sensitive keywords
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

// Log for visibility
console.error(`✅ Agent invoked: ${subagentType}`);

console.log("ok");
process.exit(0);
