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

// Security: Ensure projectDir is within baseDir
const baseRel = path.relative(safeBaseDir, projectDir);
if (baseRel.startsWith(".." + path.sep) || baseRel === ".." || path.isAbsolute(baseRel)) {
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
 * Read state from file
 */
function readState() {
  const statePath = path.join(projectDir, STATE_FILE);
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    // File doesn't exist - return default
  }
  return {
    sessionId: null,
    sessionStart: null,
    agentsInvoked: [],
    agentsSuggested: [],
    filesModified: [],
  };
}

/**
 * Write state to file
 */
function writeState(state) {
  const statePath = path.join(projectDir, STATE_FILE);
  try {
    // Ensure directory exists
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch {
    // Ignore errors
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

// Reset if different session
if (state.sessionId !== currentSessionId) {
  state.sessionId = currentSessionId;
  state.sessionStart = new Date().toISOString();
  state.agentsInvoked = [];
  state.agentsSuggested = [];
  state.filesModified = [];
}

// Record the agent invocation
const invocation = {
  agent: subagentType,
  description: description.slice(0, 100), // Truncate for storage
  timestamp: new Date().toISOString(),
};

state.agentsInvoked.push(invocation);
writeState(state);

// Log for visibility
console.error(`✅ Agent invoked: ${subagentType}`);

console.log("ok");
process.exit(0);
