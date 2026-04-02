#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * compact-restore.js - SessionStart hook (compact matcher)
 *
 * Fires when a session resumes after context compaction.
 * Reads .claude/state/handoff.json (written by pre-compaction-save.js)
 * and outputs structured recovery context so Claude can resume seamlessly.
 *
 * Output goes to stdout (visible to Claude as system context) and stderr
 * (visible to user as status messages).
 *
 * Session #138: Part of compaction-resilient state persistence
 */

let fs, path;
let sanitizeInput;
try {
  ({ sanitizeInput } = require("./lib/sanitize-input"));
} catch {
  /* eslint-disable no-control-regex -- intentional: strip dangerous control chars in fallback */
  sanitizeInput = (v) =>
    String(v ?? "")
      .replace(/[\x00-\x1f\x7f]/g, "")
      .slice(0, 500);
  /* eslint-enable no-control-regex */
}
let sanitizeError;
try {
  ({ sanitizeError } = require("../../scripts/lib/security-helpers.js"));
} catch {
  sanitizeError = (e) => (e instanceof Error ? e.constructor.name : "unknown error");
}
try {
  fs = require("node:fs");
} catch (err) {
  console.error("Failed to load node:fs:", sanitizeInput(sanitizeError(err)));
  process.exit(1);
}
try {
  path = require("node:path");
} catch (err) {
  console.error("Failed to load node:path:", sanitizeInput(sanitizeError(err)));
  process.exit(1);
}

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

const HANDOFF_FILE = path.join(projectDir, ".claude", "state", "handoff.json");

/**
 * Load handoff data
 */
function loadHandoff() {
  try {
    return JSON.parse(fs.readFileSync(HANDOFF_FILE, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Format task states for recovery output
 */
function formatTaskStates(taskStates) {
  if (!taskStates || Object.keys(taskStates).length === 0) return "  (none)";

  const lines = [];
  for (const [file, state] of Object.entries(taskStates)) {
    const task = state.task || file;
    const steps = state.steps || [];
    const completed = steps.filter(
      (s) => s.status === "completed" || s.status === "completed-with-fixes"
    ).length;
    const total = steps.length;
    const pending = steps.filter((s) => s.status === "pending");
    const inProgress = steps.filter((s) => s.status === "in_progress");

    lines.push(`  ${task}: ${completed}/${total} steps done`);
    if (inProgress.length > 0) {
      lines.push(`    In progress: ${inProgress.map((s) => s.name).join(", ")}`);
    }
    if (pending.length > 0 && pending.length <= 3) {
      lines.push(`    Remaining: ${pending.map((s) => s.name).join(", ")}`);
    } else if (pending.length > 3) {
      lines.push(`    Remaining: ${pending.length} steps`);
    }
    if (state.context?.status) {
      lines.push(`    Status: ${state.context.status}`);
    }
    if (state.resume_point) {
      lines.push(`    Resume: ${state.resume_point}`);
    }
  }
  return lines.join("\n");
}

/**
 * Format recent commits for recovery output
 */
function formatRecentCommits(commits) {
  if (!commits || commits.length === 0) return "  (none in log)";

  return commits
    .slice(-10)
    .map((c) => {
      const hash = c.shortHash || "?";
      const msg = (c.message || "").slice(0, 65);
      const session = c.session ? ` [#${c.session}]` : "";
      return `  ${hash} ${msg}${session}`;
    })
    .join("\n");
}

/**
 * Format git status section for recovery output.
 */
function formatGitStatus(git) {
  return [
    "GIT STATUS:",
    `  Last commit: ${git?.lastCommit || "?"}`,
    `  Uncommitted: ${(git?.uncommittedFiles || []).length} files`,
    `  Staged: ${(git?.stagedFiles || []).length} files`,
    `  Untracked: ${(git?.untrackedFiles || []).length} files`,
  ];
}

/**
 * Format agents-used section for recovery output.
 */
function formatAgentsUsed(agentsUsed) {
  const entries = Object.entries(agentsUsed || {});
  if (entries.length === 0) return "  (none)";
  return entries.map(([agent, info]) => `  ${agent}: ${info.count}x`).join("\n");
}

/**
 * Build the core recovery text sections.
 */
function buildRecoveryHeader(handoff, age) {
  return [
    "CONTEXT COMPACTION RECOVERY",
    "=".repeat(40),
    `Session: #${handoff.sessionCounter || "?"}`,
    `Branch: ${handoff.git?.branch || "unknown"}`,
    `Saved: ${handoff.timestamp} (${age} min ago)`,
    `Trigger: ${handoff.trigger || "unknown"}`,
    "",
    "TASK STATES:",
    formatTaskStates(handoff.taskStates),
    "",
    "RECENT COMMITS:",
    formatRecentCommits(handoff.commitLog || []),
    "",
    ...formatGitStatus(handoff.git),
    "",
    "AGENTS USED THIS SESSION:",
    formatAgentsUsed(handoff.agentsUsed),
    "",
  ];
}

/**
 * Append optional context sections (plan, notes, audits) to recovery array.
 */
function appendOptionalSections(recovery, handoff) {
  if (handoff.activePlan) {
    recovery.push(
      "ACTIVE PLAN:",
      `  File: .claude/plans/${handoff.activePlan.file} (modified ${handoff.activePlan.modifiedAgo} ago)`,
      "  Preview:",
      ...handoff.activePlan.preview
        .split("\n")
        .slice(0, 15)
        .map((l) => `    ${l}`),
      ""
    );
  }
  if (handoff.sessionNotes?.notes?.length > 0) {
    recovery.push("SESSION NOTES (AI-written context):");
    for (const note of handoff.sessionNotes.notes.slice(-5)) {
      const ts = note.timestamp ? ` (${note.timestamp})` : "";
      recovery.push(`  ${note.text}${ts}`);
    }
    recovery.push("");
  }
  if (handoff.activeAudits?.length > 0) {
    recovery.push("ACTIVE ECOSYSTEM AUDITS:");
    for (const audit of handoff.activeAudits) {
      const progress =
        audit.totalFindings > 0
          ? ` (finding ${audit.currentFinding}/${audit.totalFindings}, ${audit.decisionsCount} decided)`
          : "";
      const grade = audit.grade ? ` Grade: ${audit.grade}` : "";
      recovery.push(`  ${audit.auditName}${progress}${grade}`);
      recovery.push(`    Resume: re-invoke the audit skill to continue from saved progress`);
    }
    recovery.push("");
  }
}

/**
 * Log recovery summary to stderr for user visibility.
 */
function logRecoverySummary(handoff, age) {
  console.error("");
  console.error("  POST-COMPACTION RECOVERY");
  console.error("\u2501".repeat(42));
  console.error(`   Session #${handoff.sessionCounter || "?"} | ${age} min since save`);
  console.error(`   Branch: ${handoff.git?.branch || "?"}`);
  console.error(`   Tasks: ${Object.keys(handoff.taskStates || {}).length} tracked`);
  console.error(`   Commits: ${(handoff.commitLog || []).length} in log`);
  if (handoff.activePlan) {
    console.error(`   Active plan: ${handoff.activePlan.file}`);
  }
  if (handoff.sessionNotes?.notes?.length > 0) {
    console.error(`   Session notes: ${handoff.sessionNotes.notes.length} entries`);
  }
  if (handoff.activeAudits?.length > 0) {
    console.error(`   Active audits: ${handoff.activeAudits.length} in progress`);
    for (const audit of handoff.activeAudits) {
      console.error(`     ${audit.auditName}: ${audit.currentFinding}/${audit.totalFindings}`);
    }
  }
  console.error("\u2501".repeat(42));
}

/**
 * Main
 */
function main() {
  const handoff = loadHandoff();

  if (!handoff) {
    console.error("  No handoff.json found for post-compaction recovery.");
    console.log("ok");
    process.exit(0);
  }

  const ageMs = handoff.timestamp ? Date.now() - new Date(handoff.timestamp).getTime() : NaN;

  if (Number.isNaN(ageMs) || ageMs > 60 * 60 * 1000) {
    console.error("  Handoff data is stale (>60 min). Skipping recovery injection.");
    console.log("ok");
    process.exit(0);
  }

  const age = Math.round(ageMs / 60000);

  const recovery = buildRecoveryHeader(handoff, age);
  appendOptionalSections(recovery, handoff);
  recovery.push(
    "RECOVERY INSTRUCTION:",
    "Read .claude/state/handoff.json for full details.",
    "Read .claude/state/task-*.state.json for in-progress task data.",
    "Check git status for uncommitted work.",
    "Continue from where the session left off.",
    "=".repeat(40)
  );

  logRecoverySummary(handoff, age);

  // To stdout for Claude context injection
  console.log(recovery.join("\n"));
  process.exit(0);
}

main();
