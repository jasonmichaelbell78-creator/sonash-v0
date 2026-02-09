#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * agent-trigger-enforcer.js - PostToolUse hook for agent usage recommendations
 *
 * Tracks file modifications and suggests appropriate agents based on work performed.
 * Non-blocking (Phase 1): outputs suggestions but doesn't fail the operation.
 *
 * Phase Evolution Notifications:
 * - Phase 1 (current): SUGGEST agent usage based on file modifications
 * - Phase 2 trigger: After 50 uses or 30 days, notification to consider warnings
 * - Phase 3 trigger: After 100 uses or 60 days, notification to consider blocking
 *
 * From HOOKIFY_STRATEGY.md #6: Agent Trigger Enforcer
 * - Trigger: Code files modified without required agent invocation
 * - Action: SUGGEST (Phase 1)
 * - Time Cost: +100ms per Write/Edit on code files
 */

const fs = require("node:fs");
const path = require("node:path");
const { loadConfigWithRegex } = require("../../scripts/config/load-config");

// Configuration
const STATE_FILE = ".claude/hooks/.agent-trigger-state.json";
const REVIEW_QUEUE_FILE = ".claude/state/pending-reviews.json";
const PHASE_2_THRESHOLD_USES = 50;
const PHASE_2_THRESHOLD_DAYS = 30;
const PHASE_3_THRESHOLD_USES = 100;
const PHASE_3_THRESHOLD_DAYS = 60;

// Agent triggers and thresholds sourced from scripts/config/agent-triggers.json
let agentTriggersConfig;
try {
  agentTriggersConfig = loadConfigWithRegex("agent-triggers");
} catch (configErr) {
  const msg = configErr instanceof Error ? configErr.message : String(configErr);
  console.error(`Warning: failed to load agent-triggers config: ${msg}`);
  agentTriggersConfig = { reviewChangeThreshold: 5, agentTriggers: [] };
}
const REVIEW_CHANGE_THRESHOLD = agentTriggersConfig.reviewChangeThreshold;
const AGENT_TRIGGERS = agentTriggersConfig.agentTriggers;

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

// Extract file_path from JSON
let filePath = "";
try {
  const parsed = JSON.parse(arg);
  filePath = parsed.file_path || "";
} catch {
  console.log("ok");
  process.exit(0);
}

if (!filePath) {
  console.log("ok");
  process.exit(0);
}

// Security validations
if (filePath.startsWith("-") || filePath.includes("\n") || filePath.includes("\r")) {
  console.log("ok");
  process.exit(0);
}

// Normalize backslashes
filePath = filePath.replace(/\\/g, "/");

// Block absolute paths (cross-platform) and traversal
if (path.isAbsolute(filePath) || /^[A-Za-z]:/.test(filePath)) {
  console.log("ok");
  process.exit(0);
}
// Use regex for ".." detection (handles .., ../, ..\ edge cases)
if (filePath.includes("/../") || /^\.\.(?:[\\/]|$)/.test(filePath) || filePath.endsWith("/..")) {
  console.log("ok");
  process.exit(0);
}

/**
 * Read state from file
 */
function readState() {
  const statePath = path.join(projectDir, STATE_FILE);
  try {
    // Skip existsSync to avoid race condition - just try to read
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    // File doesn't exist or can't be read - return default
  }
  return { uses: 0, firstUse: null, lastUse: null, suggestedAgents: {}, phase: 1 };
}

/**
 * Write state to file
 */
function writeState(state) {
  const statePath = path.join(projectDir, STATE_FILE);
  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch {
    // Ignore errors
  }
}

/**
 * Check if phase transition notification should be shown
 */
function checkPhaseTransition(state) {
  const now = Date.now();
  const firstUse = state.firstUse ? new Date(state.firstUse).getTime() : now;
  const daysSinceFirstUse = Math.floor((now - firstUse) / (1000 * 60 * 60 * 24));

  // Check Phase 2 transition
  if (
    state.phase === 1 &&
    (state.uses >= PHASE_2_THRESHOLD_USES || daysSinceFirstUse >= PHASE_2_THRESHOLD_DAYS)
  ) {
    return {
      newPhase: 2,
      message: `Agent Trigger Enforcer has been active for ${state.uses} uses / ${daysSinceFirstUse} days`,
      recommendation: "Consider upgrading to Phase 2 (WARNING mode) for stronger guidance",
    };
  }

  // Check Phase 3 transition
  if (
    state.phase === 2 &&
    (state.uses >= PHASE_3_THRESHOLD_USES || daysSinceFirstUse >= PHASE_3_THRESHOLD_DAYS)
  ) {
    return {
      newPhase: 3,
      message: `Agent Trigger Enforcer has been active for ${state.uses} uses / ${daysSinceFirstUse} days`,
      recommendation: "Consider upgrading to Phase 3 (BLOCKING mode) for enforcement",
    };
  }

  return null;
}

// Find applicable agents for this file
const applicableAgents = AGENT_TRIGGERS.filter((trigger) => {
  if (!trigger.pattern.test(filePath)) return false;
  if (trigger.excludePaths.some((exclude) => exclude.test(filePath))) return false;
  return true;
});

// If no agents apply, exit
if (applicableAgents.length === 0) {
  console.log("ok");
  process.exit(0);
}

// Update state
const state = readState();
state.uses = (state.uses || 0) + 1;
if (!state.firstUse) state.firstUse = new Date().toISOString();
state.lastUse = new Date().toISOString();

// Track suggested agents for this session
const sessionKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
if (!state.suggestedAgents[sessionKey]) {
  state.suggestedAgents[sessionKey] = [];
}

// Only suggest agents that haven't been suggested this session
const newAgents = applicableAgents.filter(
  (agent) => !state.suggestedAgents[sessionKey].includes(agent.agent)
);

// Mark agents as suggested
for (const agent of newAgents) {
  state.suggestedAgents[sessionKey].push(agent.agent);
}

// Check for phase transition
const phaseTransition = checkPhaseTransition(state);

// Write updated state
writeState(state);

// Output suggestions for new agents only
if (newAgents.length > 0) {
  console.error("");
  console.error("\u{1F4A1}  AGENT SUGGESTION (Phase 1)");
  console.error("\u2501".repeat(28));
  console.error(`File: ${filePath}`);
  console.error("");
  console.error("Recommended agents for this work:");
  for (const agent of newAgents) {
    console.error(`  \u2192 ${agent.agent}: ${agent.description}`);
  }
  console.error("");
  console.error("Invoke with: Task tool using the agent type");
  console.error("Or use /code-reviewer skill after completing changes");
  console.error("\u2501".repeat(28));
}

// Output phase transition notification if applicable
if (phaseTransition) {
  console.error("");
  console.error("\u{1F4E2}  PHASE TRANSITION NOTIFICATION");
  console.error("\u2501".repeat(35));
  console.error(phaseTransition.message);
  console.error("");
  console.error(`Recommendation: ${phaseTransition.recommendation}`);
  console.error("");
  console.error("Current phases:");
  console.error("  Phase 1 (current): SUGGEST - non-blocking suggestions");
  console.error("  Phase 2: WARN - prominent warnings, still non-blocking");
  console.error("  Phase 3: BLOCK - require agent invocation before push");
  console.error("");
  console.error("To upgrade, update agent-trigger-enforcer.js phase config");
  console.error("\u2501".repeat(35));
}

// --- Delegated Code Review Queue (QoL #4) ---
// Track code file modifications and queue a review when threshold is reached.
// Reviews are written to .claude/state/pending-reviews.json for the session-end
// skill to reconcile, or for the orchestrator to spawn a code-reviewer subagent
// that writes findings to a file instead of inline in conversation.

if (applicableAgents.some((a) => a.agent === "code-reviewer")) {
  const reviewQueuePath = path.join(projectDir, REVIEW_QUEUE_FILE);
  let reviewQueue = { files: [], queued: false, lastQueued: null };
  try {
    reviewQueue = JSON.parse(fs.readFileSync(reviewQueuePath, "utf8"));
    // Normalize shape
    if (!Array.isArray(reviewQueue.files)) reviewQueue.files = [];
  } catch {
    // Use default
  }

  // Normalize to relative path for consistent deduplication
  const normalizedFile = path
    .relative(projectDir, path.resolve(projectDir, filePath))
    .split(path.sep)
    .join("/");

  // Add this file to the review queue (deduplicate)
  if (!reviewQueue.files.includes(normalizedFile)) {
    reviewQueue.files.push(normalizedFile);
  }

  // Check if threshold reached for queuing a delegated review
  if (reviewQueue.files.length >= REVIEW_CHANGE_THRESHOLD && !reviewQueue.queued) {
    reviewQueue.queued = true;
    reviewQueue.lastQueued = new Date().toISOString();

    console.error("");
    console.error("\u{1F4CB}  DELEGATED REVIEW QUEUED");
    console.error("\u2501".repeat(30));
    console.error(`  ${reviewQueue.files.length} code files modified this session.`);
    console.error("  Consider spawning a code-reviewer subagent:");
    console.error("");
    console.error("  Task({ subagent_type: 'code-reviewer',");
    console.error("    description: 'Review session changes',");
    console.error("    prompt: '<diff of changes>' })");
    console.error("");
    console.error("  Or run /requesting-code-review before committing.");
    console.error("  Review queue: .claude/state/pending-reviews.json");
    console.error("\u2501".repeat(30));
  }

  // Write review queue (ensure directory exists)
  try {
    const reviewDir = path.dirname(reviewQueuePath);
    fs.mkdirSync(reviewDir, { recursive: true });
    fs.writeFileSync(reviewQueuePath, JSON.stringify(reviewQueue, null, 2));
  } catch {
    // Non-critical - ignore write failures
  }
}

// Always succeed - Phase 1 is non-blocking
console.log("ok");
process.exit(0);
