#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * compaction-handoff.js - PostToolUse hook (Read) for compaction-safe state
 *
 * Runs alongside large-context-warning.js on every Read operation.
 * When context thresholds are exceeded, writes a structured handoff.json
 * to .claude/state/ that survives compaction and enables clean resumption.
 *
 * Data sources:
 *   - .claude/hooks/.session-agents.json (agents invoked this session)
 *   - .claude/hooks/.session-state.json (session identity)
 *   - .claude/hooks/.context-tracking-state.json (files read)
 *   - .claude/state/task-*.state.json (in-progress task states)
 *   - git status / git log (branch, recent commits, modified files)
 *
 * Output: .claude/state/handoff.json
 *
 * Session #133: QoL improvement #5 (compaction-safe task handoff protocol)
 * Session #138: Enhanced with task state summaries + recent commits (Layer B)
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

// Thresholds - trigger handoff preparation when ANY threshold hit
const FILE_READ_THRESHOLD = 25; // Files read in session
const HANDOFF_COOLDOWN_MINUTES = 10; // Don't regenerate more often than this

// Paths
const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;
const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Security check
const baseForCheck = process.platform === "win32" ? safeBaseDir.toLowerCase() : safeBaseDir;
const projectForCheck = process.platform === "win32" ? projectDir.toLowerCase() : projectDir;

const projectInsideCwd =
  projectForCheck === baseForCheck || projectForCheck.startsWith(baseForCheck + path.sep);
const cwdInsideProject =
  baseForCheck === projectForCheck || baseForCheck.startsWith(projectForCheck + path.sep);

if (!projectInsideCwd && !cwdInsideProject) {
  console.log("ok");
  process.exit(0);
}

process.chdir(projectDir);

// State files
const CONTEXT_TRACKING = path.join(projectDir, ".claude", "hooks", ".context-tracking-state.json");
const SESSION_AGENTS = path.join(projectDir, ".claude", "hooks", ".session-agents.json");
const SESSION_STATE = path.join(projectDir, ".claude", "hooks", ".session-state.json");
const HANDOFF_STATE = path.join(projectDir, ".claude", "hooks", ".handoff-state.json");
const HANDOFF_OUTPUT = path.join(projectDir, ".claude", "state", "handoff.json");

/**
 * Load JSON file safely
 */
function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Save JSON file with atomic write
 */
function saveJson(filePath, data) {
  const tmpPath = `${filePath}.tmp`;
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    fs.renameSync(tmpPath, filePath);
    return true;
  } catch (err) {
    console.warn(`compaction-handoff: failed to save ${path.basename(filePath)}: ${err.message}`);
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      // cleanup failure is non-critical
    }
    return false;
  }
}

/**
 * Execute git command safely
 */
function gitExec(cmd) {
  try {
    return execSync(cmd, { cwd: projectDir, encoding: "utf8", timeout: 5000 }).trim();
  } catch {
    return "";
  }
}

/**
 * Gather git context for handoff
 */
function gatherGitContext() {
  return {
    branch: gitExec("git rev-parse --abbrev-ref HEAD"),
    lastCommit: gitExec("git log --oneline -1"),
    uncommittedFiles: gitExec("git diff --name-only")
      .split("\n")
      .filter((f) => f.length > 0),
    untrackedFiles: gitExec("git ls-files --others --exclude-standard")
      .split("\n")
      .filter((f) => f.length > 0)
      .slice(0, 20), // Cap at 20
    stagedFiles: gitExec("git diff --cached --name-only")
      .split("\n")
      .filter((f) => f.length > 0),
  };
}

/**
 * Gather all task-*.state.json summaries
 */
function gatherTaskStates() {
  const stateDir = path.join(projectDir, ".claude", "state");
  try {
    const files = fs
      .readdirSync(stateDir)
      .filter((f) => f.startsWith("task-") && f.endsWith(".state.json"));
    return files.map((f) => {
      const data = loadJson(path.join(stateDir, f));
      if (!data) return { file: f, error: "unreadable" };
      // Compact summary: task name, status of steps, last update
      const steps = (data.steps || []).map((s) => ({
        name: s.name,
        status: s.status,
      }));
      return {
        file: f,
        task: data.task || f,
        lastUpdated: data.lastUpdated || null,
        steps: steps,
        resumePoint: data.resume_point || data.context?.status || null,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Get session counter from SESSION_CONTEXT.md
 */
function getSessionCounter() {
  try {
    const contextPath = path.join(projectDir, "SESSION_CONTEXT.md");
    const content = fs.readFileSync(contextPath, "utf8");
    const match = content.match(/\*\*Current Session Count\*\*:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

/**
 * Build handoff data from all available state
 */
function buildHandoff() {
  const contextTracking = loadJson(CONTEXT_TRACKING) || { filesRead: [] };
  const sessionAgents = loadJson(SESSION_AGENTS) || { agentsInvoked: [] };
  const sessionState = loadJson(SESSION_STATE) || {};
  const gitContext = gatherGitContext();

  // Summarize agent activity
  const agentSummary = {};
  for (const inv of sessionAgents.agentsInvoked || []) {
    if (!agentSummary[inv.agent]) {
      agentSummary[inv.agent] = { count: 0, descriptions: [] };
    }
    agentSummary[inv.agent].count++;
    if (inv.description && agentSummary[inv.agent].descriptions.length < 3) {
      agentSummary[inv.agent].descriptions.push(inv.description);
    }
  }

  // Layer B enhancements: task states + recent commits + session counter
  const taskStates = gatherTaskStates();
  const recentCommits = gitExec("git log --oneline -10")
    .split("\n")
    .filter((l) => l.length > 0);
  const sessionCounter = getSessionCounter();

  return {
    timestamp: new Date().toISOString(),
    sessionId: sessionState.currentSessionId || null,
    sessionCounter: sessionCounter,
    git: {
      branch: gitContext.branch,
      lastCommit: gitContext.lastCommit,
      recentCommits: recentCommits,
      uncommittedFiles: gitContext.uncommittedFiles,
      stagedFiles: gitContext.stagedFiles,
      untrackedFiles: gitContext.untrackedFiles,
    },
    contextMetrics: {
      filesRead: contextTracking.filesRead?.length || 0,
      filesList: (contextTracking.filesRead || []).slice(-30), // Last 30 files
    },
    agentsUsed: agentSummary,
    taskStates: taskStates,
    recovery: {
      instruction:
        "Read this file at session start to restore context. " +
        "Check git status for uncommitted work. " +
        "Review agentsUsed to understand what was done. " +
        "Check taskStates for in-progress multi-step task details. " +
        "Use recentCommits to understand what was accomplished.",
    },
  };
}

/**
 * Main
 */
function main() {
  // Check cooldown
  const handoffState = loadJson(HANDOFF_STATE) || { lastWrite: 0 };
  const minutesSinceLast = (Date.now() - handoffState.lastWrite) / (1000 * 60);
  if (minutesSinceLast < HANDOFF_COOLDOWN_MINUTES) {
    console.log("ok");
    process.exit(0);
  }

  // Check if context threshold hit
  const contextTracking = loadJson(CONTEXT_TRACKING) || { filesRead: [] };
  const filesRead = contextTracking.filesRead?.length || 0;

  if (filesRead < FILE_READ_THRESHOLD) {
    console.log("ok");
    process.exit(0);
  }

  // Build and write handoff
  const handoff = buildHandoff();
  if (saveJson(HANDOFF_OUTPUT, handoff)) {
    // Update cooldown state
    saveJson(HANDOFF_STATE, { lastWrite: Date.now(), filesAtWrite: filesRead });

    console.error("");
    console.error("  COMPACTION HANDOFF PREPARED");
    console.error("\u2501".repeat(42));
    console.error(`   Session: #${handoff.sessionCounter || "?"}`);
    console.error(`   Branch: ${handoff.git.branch}`);
    console.error(`   Files read: ${handoff.contextMetrics.filesRead}`);
    console.error(`   Uncommitted: ${handoff.git.uncommittedFiles.length} files`);
    console.error(`   Agents used: ${Object.keys(handoff.agentsUsed).length} types`);
    console.error(`   Task states: ${handoff.taskStates.length} tracked`);
    console.error(`   Recent commits: ${handoff.git.recentCommits.length}`);
    console.error("");
    console.error("   Handoff saved to: .claude/state/handoff.json");
    console.error("   This file survives compaction for session recovery.");
    console.error("\u2501".repeat(42));
  }

  console.log("ok");
  process.exit(0);
}

main();
