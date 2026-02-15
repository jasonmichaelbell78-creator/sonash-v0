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
const { execFileSync } = require("node:child_process");

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
  const backupPath = `${filePath}.bak`;
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    // Backup-swap: move existing dest to .bak, then rename tmp to dest.
    // If crash occurs at any point, at least one copy survives.
    try {
      fs.rmSync(backupPath, { force: true });
    } catch {
      /* ignore */
    }
    try {
      if (fs.existsSync(filePath)) fs.renameSync(filePath, backupPath);
    } catch {
      // If backup rename fails, fall through to try direct rename
    }
    fs.renameSync(tmpPath, filePath);
    // Success — clean up backup
    try {
      fs.rmSync(backupPath, { force: true });
    } catch {
      /* ignore */
    }
    return true;
  } catch {
    // Rollback: restore backup if dest was moved but tmp rename failed
    try {
      if (fs.existsSync(backupPath) && !fs.existsSync(filePath)) {
        fs.renameSync(backupPath, filePath);
      }
    } catch {
      /* ignore */
    }
    // Fallback: direct write if rename fails (Windows cross-drive)
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      try {
        fs.rmSync(tmpPath, { force: true });
      } catch {
        /* ignore */
      }
      try {
        fs.rmSync(backupPath, { force: true });
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
function gitExec(args) {
  try {
    return execFileSync("git", args, { cwd: projectDir, encoding: "utf8", timeout: 5000 }).trim();
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
    // Resilient: optional bold markers, flexible spacing, "Count"/"Counter" (P001 fix)
    const match = content.match(/\*{0,2}Current Session Count(?:er)?\*{0,2}\s*:?\s*(\d+)/i);
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
 * Gather complete git context (3 git calls instead of 6)
 *
 * Call 1: git rev-parse --abbrev-ref HEAD  → branch name
 * Call 2: git log --oneline -15            → recent commits (first line = lastCommit)
 * Call 3: git status --porcelain           → staged + uncommitted + untracked in one call
 *
 * Porcelain format: XY filename
 *   X = index status, Y = worktree status
 *   '?' in both columns = untracked
 *   Non-space X (and not '?') = staged change
 *   Non-space Y (and not '?') = unstaged/uncommitted change
 */
function gatherGitContext() {
  // Call 1: branch name
  const branch = gitExec(["rev-parse", "--abbrev-ref", "HEAD"]);

  // Call 2: recent commits (first line doubles as lastCommit)
  const logOutput = gitExec(["log", "--oneline", "-15"]);
  const recentCommits = logOutput.split("\n").filter((l) => l.length > 0);
  const lastCommit = recentCommits[0] || "";

  // Call 3: git status --porcelain (replaces diff --name-only, diff --cached, ls-files)
  const statusOutput = gitExec(["status", "--porcelain"]);
  const statusLines = statusOutput.split("\n").filter((l) => l.length > 0);

  const uncommittedFiles = [];
  const stagedFiles = [];
  const untrackedFiles = [];

  for (const line of statusLines) {
    // Porcelain format: XY filename (X=index, Y=worktree)
    const indexStatus = line[0];
    const worktreeStatus = line[1];
    const filename = line.slice(3); // skip "XY "

    if (indexStatus === "?" && worktreeStatus === "?") {
      // Untracked file
      if (untrackedFiles.length < 20) {
        untrackedFiles.push(filename);
      }
    } else {
      // Staged: X is not ' ' and not '?'
      if (indexStatus !== " " && indexStatus !== "?") {
        stagedFiles.push(filename);
      }
      // Uncommitted (worktree change): Y is not ' ' and not '?'
      if (worktreeStatus !== " " && worktreeStatus !== "?") {
        uncommittedFiles.push(filename);
      }
    }
  }

  return {
    branch,
    lastCommit,
    recentCommits,
    uncommittedFiles,
    stagedFiles,
    untrackedFiles,
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
 * Gather active agent team status from session state
 * Captures teammate IDs, assigned tasks, and completion status
 * so the lead can restore team context after compaction.
 */
function gatherTeamStatus() {
  try {
    // Check if agent teams are enabled
    const settingsPath = path.join(projectDir, ".claude", "settings.json");
    const settings = loadJson(settingsPath);
    const teamsEnabled = settings?.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === "1";
    if (!teamsEnabled) return null;

    // Read session agents for team-related invocations
    const sessionAgents = loadJson(SESSION_AGENTS) || { agentsInvoked: [] };
    const teamInvocations = (sessionAgents.agentsInvoked || []).filter(
      (inv) =>
        inv.description &&
        (inv.description.toLowerCase().includes("team") ||
          inv.description.toLowerCase().includes("teammate"))
    );

    // Read pending reviews (may indicate active reviewer teammate)
    const pendingReviewsPath = path.join(STATE_DIR, "pending-reviews.json");
    const pendingReviews = loadJson(pendingReviewsPath);

    return {
      enabled: true,
      teamInvocations: teamInvocations.length,
      recentTeamActivity: teamInvocations.slice(-10).map((inv) => ({
        agent: inv.agent,
        description: inv.description,
        timestamp: inv.timestamp,
      })),
      pendingReviews: pendingReviews
        ? {
            count: Array.isArray(pendingReviews.items) ? pendingReviews.items.length : 0,
            status: pendingReviews.status || "unknown",
          }
        : null,
    };
  } catch {
    return null;
  }
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

  const teamStatus = gatherTeamStatus();

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
    teamStatus: teamStatus,
    recovery: {
      instruction:
        "CONTEXT WAS COMPACTED. Read this handoff to restore session state. " +
        "Key info: sessionCounter, git.branch, taskStates (full task progress), " +
        "commitLog (recent work), agentsUsed (what was done). " +
        (teamStatus ? "teamStatus (active agent team info - check teammate progress). " : "") +
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
    if (teamStatus) {
      console.error(`   Agent teams: enabled (${teamStatus.teamInvocations} team invocations)`);
    }
    console.error(`   Trigger: ${trigger}`);
    console.error("");
    console.error("   Saved to: .claude/state/handoff.json");
    console.error("\u2501".repeat(42));
  }

  console.log("ok");
  process.exit(0);
}

main();
