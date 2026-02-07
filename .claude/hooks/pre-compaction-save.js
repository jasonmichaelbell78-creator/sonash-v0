#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * pre-compaction-save.js - PreCompact hook for state snapshot
 *
 * Fires right before context compaction (manual or automatic).
 * Captures a comprehensive state snapshot to .claude/state/handoff.json
 * so the session can be cleanly restored after compaction.
 *
 * This is the most reliable compaction defense because it fires at
 * exactly the right moment — unlike threshold-based triggers (Layer B)
 * which may miss sessions with unusual tool usage patterns.
 *
 * Data captured:
 *   - Session counter from SESSION_CONTEXT.md
 *   - All task-*.state.json contents (full, not summarized)
 *   - Recent commits from commit-log.jsonl (last 15)
 *   - Git state: branch, uncommitted/staged/untracked files
 *   - Agent invocations this session
 *   - Files read this session
 *   - Compaction trigger type (manual/auto)
 *
 * Output: .claude/state/handoff.json
 *
 * Session #138: Part of compaction-resilient state persistence
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

// Paths
const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;
const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Security check - bidirectional containment
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

// State file paths
const STATE_DIR = path.join(projectDir, ".claude", "state");
const HOOKS_DIR = path.join(projectDir, ".claude", "hooks");
const HANDOFF_OUTPUT = path.join(STATE_DIR, "handoff.json");
const COMMIT_LOG = path.join(STATE_DIR, "commit-log.jsonl");
const SESSION_AGENTS = path.join(HOOKS_DIR, ".session-agents.json");
const SESSION_STATE = path.join(HOOKS_DIR, ".session-state.json");
const CONTEXT_TRACKING = path.join(HOOKS_DIR, ".context-tracking-state.json");
const SESSION_CONTEXT_MD = path.join(projectDir, "SESSION_CONTEXT.md");

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
  } catch {
    // Fallback: direct write if rename fails (Windows cross-drive)
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      try {
        fs.rmSync(tmpPath, { force: true });
      } catch {
        /* ignore */
      }
      return true;
    } catch {
      return false;
    }
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
 * Get session counter from SESSION_CONTEXT.md
 */
function getSessionCounter() {
  try {
    const content = fs.readFileSync(SESSION_CONTEXT_MD, "utf8");
    const match = content.match(/\*\*Current Session Count\*\*:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

/**
 * Read all task state files (full contents, not summarized)
 */
function readAllTaskStates() {
  try {
    const files = fs
      .readdirSync(STATE_DIR)
      .filter((f) => f.startsWith("task-") && f.endsWith(".state.json"));
    const states = {};
    for (const f of files) {
      const data = loadJson(path.join(STATE_DIR, f));
      if (data) {
        states[f] = data;
      }
    }
    return states;
  } catch {
    return {};
  }
}

/**
 * Read recent entries from commit-log.jsonl
 */
function readRecentCommits(count) {
  try {
    const content = fs.readFileSync(COMMIT_LOG, "utf8").trim();
    if (!content) return [];
    const lines = content.split("\n").filter(Boolean);
    // Take last N entries (most recent)
    return lines
      .slice(-count)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Gather complete git context
 */
function gatherGitContext() {
  return {
    branch: gitExec("git rev-parse --abbrev-ref HEAD"),
    lastCommit: gitExec("git log --oneline -1"),
    recentCommits: gitExec("git log --oneline -15")
      .split("\n")
      .filter((l) => l.length > 0),
    uncommittedFiles: gitExec("git diff --name-only")
      .split("\n")
      .filter((f) => f.length > 0),
    stagedFiles: gitExec("git diff --cached --name-only")
      .split("\n")
      .filter((f) => f.length > 0),
    untrackedFiles: gitExec("git ls-files --others --exclude-standard")
      .split("\n")
      .filter((f) => f.length > 0)
      .slice(0, 20),
  };
}

/**
 * Summarize agent invocations
 */
function gatherAgentSummary() {
  const sessionAgents = loadJson(SESSION_AGENTS) || { agentsInvoked: [] };
  const summary = {};
  for (const inv of sessionAgents.agentsInvoked || []) {
    if (!summary[inv.agent]) {
      summary[inv.agent] = { count: 0, descriptions: [] };
    }
    summary[inv.agent].count++;
    if (inv.description && summary[inv.agent].descriptions.length < 5) {
      summary[inv.agent].descriptions.push(inv.description);
    }
  }
  return summary;
}

/**
 * Detect compaction trigger from hook arguments
 */
function getCompactionTrigger() {
  const arg = process.argv[2] || "";
  try {
    const parsed = JSON.parse(arg);
    return parsed.trigger || parsed.matcher || "unknown";
  } catch {
    return arg || "unknown";
  }
}

/**
 * Main
 */
function main() {
  const trigger = getCompactionTrigger();
  const sessionCounter = getSessionCounter();
  const taskStates = readAllTaskStates();
  const commitLogEntries = readRecentCommits(15);
  const gitContext = gatherGitContext();
  const agentSummary = gatherAgentSummary();
  const contextTracking = loadJson(CONTEXT_TRACKING) || { filesRead: [] };
  const sessionState = loadJson(SESSION_STATE) || {};

  const handoff = {
    timestamp: new Date().toISOString(),
    trigger: `pre-compaction (${trigger})`,
    sessionId: sessionState.currentSessionId || null,
    sessionCounter: sessionCounter,
    git: gitContext,
    taskStates: taskStates,
    commitLog: commitLogEntries,
    contextMetrics: {
      filesRead: contextTracking.filesRead?.length || 0,
      filesList: (contextTracking.filesRead || []).slice(-30),
    },
    agentsUsed: agentSummary,
    recovery: {
      instruction:
        "CONTEXT WAS COMPACTED. Read this handoff to restore session state. " +
        "Key info: sessionCounter, git.branch, taskStates (full task progress), " +
        "commitLog (recent work), agentsUsed (what was done). " +
        "Continue from where the session left off.",
    },
  };

  if (saveJson(HANDOFF_OUTPUT, handoff)) {
    const taskCount = Object.keys(taskStates).length;
    const commitCount = commitLogEntries.length;
    console.error("");
    console.error("  PRE-COMPACTION STATE SAVED");
    console.error("\u2501".repeat(42));
    console.error(`   Session: #${sessionCounter || "?"}`);
    console.error(`   Branch: ${gitContext.branch}`);
    console.error(`   Task states: ${taskCount} saved`);
    console.error(`   Commit log: ${commitCount} recent entries`);
    console.error(`   Uncommitted: ${gitContext.uncommittedFiles.length} files`);
    console.error(`   Agents used: ${Object.keys(agentSummary).length} types`);
    console.error(`   Files read: ${contextTracking.filesRead?.length || 0}`);
    console.error(`   Trigger: ${trigger}`);
    console.error("");
    console.error("   Saved to: .claude/state/handoff.json");
    console.error("\u2501".repeat(42));
  }

  console.log("ok");
  process.exit(0);
}

main();
