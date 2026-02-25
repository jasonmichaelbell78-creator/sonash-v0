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
 *   - Active plan file (.claude/plans/*.md) with preview
 *   - Session scratchpad notes (AI-written intent/context)
 *   - Compaction trigger type (manual/auto)
 *
 * Output: .claude/state/handoff.json
 *
 * Session #138: Part of compaction-resilient state persistence
 */

const fs = require("node:fs");
const path = require("node:path");
const { gitExec, projectDir } = require("./lib/git-utils.js");
const { loadJson, saveJson } = require("./lib/state-utils.js");

// State file paths
const STATE_DIR = path.join(projectDir, ".claude", "state");
const HOOKS_DIR = path.join(projectDir, ".claude", "hooks");
const HANDOFF_OUTPUT = path.join(STATE_DIR, "handoff.json");
const COMMIT_LOG = path.join(STATE_DIR, "commit-log.jsonl");
const SESSION_AGENTS = path.join(HOOKS_DIR, ".session-agents.json");
const SESSION_STATE = path.join(HOOKS_DIR, ".session-state.json");
const CONTEXT_TRACKING = path.join(HOOKS_DIR, ".context-tracking-state.json");
const SESSION_CONTEXT_MD = path.join(projectDir, "SESSION_CONTEXT.md");
const SESSION_NOTES = path.join(STATE_DIR, "session-notes.json");
const PLANS_DIR = path.join(projectDir, ".claude", "plans");

// loadJson, saveJson from lib/state-utils.js
// gitExec from lib/git-utils.js

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

  // Call 3: git status --porcelain -z (NUL-separated for filenames with spaces — Review #289)
  const statusOutput = gitExec(["status", "--porcelain", "-z"], { trim: false });
  const statusFields = statusOutput.split("\0").filter((l) => l.length > 0);

  const uncommittedFiles = [];
  const stagedFiles = [];
  const untrackedFiles = [];

  for (let i = 0; i < statusFields.length; i++) {
    const line = statusFields[i];
    if (!line || line.length < 4 || line[2] !== " ") continue; // expect "XY filename"
    // Porcelain format: XY filename (X=index, Y=worktree)
    const indexStatus = line[0];
    const worktreeStatus = line[1];
    let filename = line.slice(3); // skip "XY "

    // Renames/copies have an extra NUL-separated path: "R? old\0new" / "C? old\0new"
    if ((indexStatus === "R" || indexStatus === "C") && i + 1 < statusFields.length) {
      const newPath = statusFields[i + 1];
      if (newPath) filename = newPath;
      i++; // consume the extra path field
    }

    if (!filename) continue;

    if (indexStatus === "?" && worktreeStatus === "?") {
      if (untrackedFiles.length < 20) untrackedFiles.push(filename);
      continue;
    }

    if (indexStatus !== " " && indexStatus !== "?") {
      if (stagedFiles.length < 50) stagedFiles.push(filename);
    }
    if (worktreeStatus !== " " && worktreeStatus !== "?") {
      if (uncommittedFiles.length < 50) uncommittedFiles.push(filename);
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
 * Find the most recently modified plan file and capture its header
 */
function gatherActivePlan() {
  try {
    if (!fs.existsSync(PLANS_DIR)) return null;
    const files = fs
      .readdirSync(PLANS_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => {
        const full = path.join(PLANS_DIR, f);
        try {
          return { name: f, mtime: fs.statSync(full).mtimeMs, path: full };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) return null;

    const newest = files[0];
    // Only include if modified in the last 24 hours (likely active)
    if (Date.now() - newest.mtime > 24 * 60 * 60 * 1000) return null;

    const content = fs.readFileSync(newest.path, "utf8");
    const lines = content.split("\n").slice(0, 30);
    return {
      file: newest.name,
      modifiedAgo: Math.round((Date.now() - newest.mtime) / 60000) + " min",
      preview: lines.join("\n"),
    };
  } catch {
    return null;
  }
}

/**
 * Read session scratchpad notes (written by AI during work)
 */
function gatherSessionNotes() {
  return loadJson(SESSION_NOTES) || null;
}

/**
 * Detect active ecosystem audits by scanning for progress files
 */
function gatherActiveAudits() {
  const TMP_DIR = path.join(projectDir, ".claude", "tmp");
  const AUDIT_PROGRESS_PATTERN = /-audit-progress\.json$/;

  try {
    if (!fs.existsSync(TMP_DIR)) return null;
    const files = fs.readdirSync(TMP_DIR).filter((f) => AUDIT_PROGRESS_PATTERN.test(f));
    if (files.length === 0) return null;

    const activeAudits = [];
    for (const f of files) {
      try {
        const fullPath = path.join(TMP_DIR, f);
        const stat = fs.statSync(fullPath);
        // Only include if < 2 hours old
        if (Date.now() - stat.mtimeMs > 2 * 60 * 60 * 1000) continue;

        const data = loadJson(fullPath);
        if (!data) continue;

        activeAudits.push({
          file: f,
          auditName: f
            .replace(/-progress\.json$/, "")
            .replace(/(?<!-ecosystem)-audit$/, "-ecosystem-audit"),
          currentFinding: data.currentFindingIndex || 0,
          totalFindings: data.totalFindings || 0,
          decisionsCount: (data.decisions || []).length,
          score: data.score || null,
          grade: data.grade || null,
          timestamp: data.auditTimestamp || null,
        });
      } catch {
        // Skip unreadable progress files
      }
    }

    return activeAudits.length > 0 ? activeAudits : null;
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
  const activePlan = gatherActivePlan();
  const sessionNotes = gatherSessionNotes();
  const activeAudits = gatherActiveAudits();

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
    activePlan: activePlan,
    sessionNotes: sessionNotes,
    activeAudits: activeAudits,
    recovery: {
      instruction:
        "CONTEXT WAS COMPACTED. Read this handoff to restore session state. " +
        "Key info: sessionCounter, git.branch, taskStates (full task progress), " +
        "commitLog (recent work), agentsUsed (what was done). " +
        (teamStatus ? "teamStatus (active agent team info - check teammate progress). " : "") +
        (activePlan ? `activePlan (executing plan: ${activePlan.file}). ` : "") +
        (sessionNotes ? "sessionNotes (AI-written context about current task/intent). " : "") +
        (activeAudits
          ? `activeAudits (${activeAudits.length} ecosystem audit(s) in progress — resume with their /skill commands). `
          : "") +
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
    if (activePlan) {
      console.error(`   Active plan: ${activePlan.file} (${activePlan.modifiedAgo} ago)`);
    }
    if (sessionNotes) {
      console.error(`   Session notes: ${sessionNotes.notes?.length || 0} entries`);
    }
    if (activeAudits) {
      for (const audit of activeAudits) {
        console.error(
          `   Active audit: ${audit.auditName} (finding ${audit.currentFinding}/${audit.totalFindings})`
        );
      }
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
