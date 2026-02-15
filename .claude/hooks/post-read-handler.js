#!/usr/bin/env node
/* global require, process, console, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename, security/detect-object-injection */
/**
 * post-read-handler.js - Consolidated PostToolUse (Read) hook
 *
 * Replaces 3 separate hooks with 1 process:
 *   1. large-context-warning.js — Context tracking + large file warnings
 *   2. auto-save-context.js — Auto-save context to MCP memory when thresholds hit
 *   3. compaction-handoff.js — Compaction-safe handoff state generation
 *
 * Shared work:
 *   - Single argv[2] JSON parse
 *   - Single .context-tracking-state.json read/write
 *   - Single projectDir resolution + security check
 *
 * Session #164: Consolidation of 3 PostToolUse Read hooks into 1 process
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

let rotateHelpers;
try {
  rotateHelpers = require("./lib/rotate-state.js");
} catch {
  rotateHelpers = null;
}

// ─── Configuration ──────────────────────────────────────────────────────────

// large-context-warning thresholds
const SINGLE_FILE_LINE_LIMIT = 5000;
const SESSION_FILE_LIMIT = 15;

// auto-save-context thresholds
const FILE_READ_THRESHOLD_AUTOSAVE = 20;
const SAVE_INTERVAL_MINUTES = 15;

// compaction-handoff thresholds
const FILE_READ_THRESHOLD_HANDOFF = 25;
const HANDOFF_COOLDOWN_MINUTES = 10;

// ─── Project directory resolution + security ────────────────────────────────

const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;
const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Security check (bidirectional containment, Windows case-insensitive)
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

// ─── Shared paths ───────────────────────────────────────────────────────────

const CONTEXT_TRACKING_FILE = path.join(
  projectDir,
  ".claude",
  "hooks",
  ".context-tracking-state.json"
);
const SESSION_STATE_FILE = path.join(projectDir, ".claude", "hooks", ".session-state.json");
const SESSION_AGENTS_FILE = path.join(projectDir, ".claude", "hooks", ".session-agents.json");
const PENDING_ALERTS_FILE = path.join(projectDir, ".claude", "pending-alerts.json");
const SESSION_DECISIONS_FILE = path.join(projectDir, "docs", "SESSION_DECISIONS.md");
const AUTOSAVE_STATE_FILE = path.join(projectDir, ".claude", "hooks", ".auto-save-state.json");
const HANDOFF_STATE_FILE = path.join(projectDir, ".claude", "hooks", ".handoff-state.json");
const HANDOFF_OUTPUT = path.join(projectDir, ".claude", "state", "handoff.json");

// ─── Shared utilities ───────────────────────────────────────────────────────

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function saveJson(filePath, data) {
  const tmpPath = `${filePath}.tmp`;
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    try {
      fs.rmSync(filePath, { force: true });
    } catch {
      // best-effort; destination may not exist
    }
    fs.renameSync(tmpPath, filePath);
    return true;
  } catch (err) {
    console.warn(
      `post-read-handler: failed to save ${path.basename(filePath)}: ${err instanceof Error ? err.message : String(err)}`
    );
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      // cleanup failure is non-critical
    }
    return false;
  }
}

function gitExec(args) {
  try {
    return execFileSync("git", args, { cwd: projectDir, encoding: "utf8", timeout: 5000 }).trim();
  } catch {
    return "";
  }
}

// ─── Parse argv[2] JSON once ────────────────────────────────────────────────

const arg = process.argv[2] || "";
let filePath = "";
let limit = 0;

if (arg) {
  try {
    const parsed = JSON.parse(arg);
    filePath = parsed.file_path || parsed.path || "";
    limit = parsed.limit || 0;
  } catch {
    filePath = arg;
  }
}

// Security validations on filePath
if (filePath) {
  if (filePath.startsWith("-")) {
    filePath = "";
  }
  if (filePath && (filePath.includes("\n") || filePath.includes("\r"))) {
    filePath = "";
  }
  if (filePath) {
    filePath = filePath.replace(/\\/g, "/");
    if (path.isAbsolute(filePath) || /^[A-Za-z]:/.test(filePath)) {
      filePath = "";
    }
  }
  if (filePath) {
    if (
      filePath.includes("/../") ||
      /^\.\.(?:[\\/]|$)/.test(filePath) ||
      filePath.endsWith("/..")
    ) {
      filePath = "";
    }
  }
}

// ─── Read context tracking state once ───────────────────────────────────────

let contextState = { filesRead: [], lastReset: Date.now(), warningShown: false };
try {
  const stateContent = fs.readFileSync(CONTEXT_TRACKING_FILE, "utf8");
  contextState = JSON.parse(stateContent);

  // Reset state if older than 30 minutes (new session)
  const thirtyMinutes = 30 * 60 * 1000;
  if (Date.now() - contextState.lastReset > thirtyMinutes) {
    contextState = { filesRead: [], lastReset: Date.now(), warningShown: false };
  }
} catch {
  // File doesn't exist or can't be read - use default state
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1: Context Tracking + Large File Warning (from large-context-warning.js)
// ═══════════════════════════════════════════════════════════════════════════

function runContextTracking() {
  if (!filePath) return;

  // Track this file read (only save when modified — Review #289)
  let stateModified = false;
  if (!contextState.filesRead.includes(filePath)) {
    contextState.filesRead.push(filePath);
    stateModified = true;
  }

  if (stateModified) {
    saveJson(CONTEXT_TRACKING_FILE, contextState);
  }

  // Resolve full path for line counting
  const fullPath = path.resolve(projectDir, filePath);

  // Estimate line count from file size (avoids reading entire file into memory)
  let lineCount = 0;
  try {
    const stat = fs.statSync(fullPath);
    lineCount = Math.ceil(stat.size / 80); // Estimate ~80 bytes per line
  } catch {
    // File doesn't exist or can't be stat'd - lineCount stays 0
  }

  // Determine warnings
  const warnings = [];

  // Check single file line limit (only warn if not using pagination)
  if (lineCount > SINGLE_FILE_LINE_LIMIT && !limit) {
    warnings.push({
      type: "large_file",
      message: `File has ${lineCount} lines (>${SINGLE_FILE_LINE_LIMIT})`,
      suggestion: "Consider using offset/limit parameters for large files",
    });
  }

  // Check session file count
  if (contextState.filesRead.length >= SESSION_FILE_LIMIT && !contextState.warningShown) {
    warnings.push({
      type: "many_files",
      message: `${contextState.filesRead.length} files read this session (>=${SESSION_FILE_LIMIT})`,
      suggestion: "Consider using /save-context to preserve important context to MCP memory",
    });
    contextState.warningShown = true;
    // Save state with warning flag
    saveJson(CONTEXT_TRACKING_FILE, contextState);
  }

  // Output warnings
  if (warnings.length > 0) {
    console.error("");
    console.error("\u26a0\ufe0f  LARGE CONTEXT WARNING");
    console.error("\u2501".repeat(28));

    for (const warning of warnings) {
      console.error(`${warning.message}`);
      console.error(`  \u2192 ${warning.suggestion}`);
    }

    console.error("");
    console.error("Tip: Use /save-context to save to MCP memory before compaction");
    console.error("\u2501".repeat(28));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: Auto-Save Context (from auto-save-context.js)
// ═══════════════════════════════════════════════════════════════════════════

function getRecentDecisions(decisionLimit = 3) {
  try {
    const content = fs.readFileSync(SESSION_DECISIONS_FILE, "utf8");
    const decisionPattern =
      /^###\s+\[(\d{4}-\d{2}-\d{2})\]\s*[-–—]\s*(.+?)\n([\s\S]*?)(?=^###\s+\[|^##\s|$)/gm;

    const allDecisions = Array.from(content.matchAll(decisionPattern)).map((m) => ({
      date: m[1],
      title: m[2].trim(),
      summary: (m[3] || "").trim().substring(0, 200) + "...",
    }));

    return allDecisions.slice(-decisionLimit);
  } catch {
    return [];
  }
}

function sanitizeContextData(contextData) {
  return {
    metrics: contextData.metrics,
    sessionState: contextData.sessionState
      ? {
          lastBegin: contextData.sessionState.lastBegin,
          lastEnd: contextData.sessionState.lastEnd,
          sessionCount: contextData.sessionState.sessionCount,
        }
      : null,
    alerts: (contextData.alerts || []).map((a) => ({
      type: a.type,
      severity: a.severity,
      message: a.message,
    })),
    decisions: (contextData.decisions || []).map((d) => ({
      date: d.date,
      title: d.title,
    })),
  };
}

function saveToMcpMemory(contextData) {
  const entityName = `Session_${new Date().toISOString().split("T")[0]}_AutoSave`;
  const observations = [];

  if (contextData.sessionState) {
    observations.push(`Session started: ${contextData.sessionState.lastBegin || "unknown"}`);
  }

  if (contextData.alerts?.length > 0) {
    observations.push(`Pending alerts: ${contextData.alerts.length} items`);
    contextData.alerts.slice(0, 3).forEach((a) => {
      observations.push(`  - ${a.message}`);
    });
  }

  if (contextData.decisions?.length > 0) {
    observations.push(`Recent decisions:`);
    contextData.decisions.forEach((d) => {
      observations.push(`  - [${d.date}] ${d.title}`);
    });
  }

  if (contextData.metrics) {
    observations.push(`Context metrics: ${contextData.metrics.filesRead} files read`);
  }

  const mcpSaveFile = path.join(projectDir, ".claude", "pending-mcp-save.json");
  const mcpData = {
    timestamp: new Date().toISOString(),
    entity: {
      name: entityName,
      entityType: "session_context",
      observations: observations,
    },
    raw: sanitizeContextData(contextData),
  };

  return saveJson(mcpSaveFile, mcpData);
}

function runAutoSaveContext() {
  // Load auto-save state
  const state = loadJson(AUTOSAVE_STATE_FILE) || {
    lastSave: 0,
    saveCount: 0,
  };

  // Check if enough time has passed since last save
  const now = Date.now();
  const minutesSinceLastSave = (now - state.lastSave) / (1000 * 60);
  if (minutesSinceLastSave < SAVE_INTERVAL_MINUTES && state.saveCount > 0) {
    return;
  }

  // Get context metrics (reuse already-loaded contextState)
  const metrics = {
    filesRead: contextState.filesRead?.length || 0,
    lastReset: contextState.lastReset || 0,
  };

  // Check if thresholds are exceeded
  if (metrics.filesRead < FILE_READ_THRESHOLD_AUTOSAVE) {
    return;
  }

  // Gather context to save
  const contextData = {
    metrics: metrics,
    sessionState: loadJson(SESSION_STATE_FILE),
    alerts: loadJson(PENDING_ALERTS_FILE)?.alerts || [],
    decisions: getRecentDecisions(3),
  };

  // Save to file for Claude to process
  if (saveToMcpMemory(contextData)) {
    // Update state
    state.lastSave = now;
    state.saveCount++;
    saveJson(AUTOSAVE_STATE_FILE, state);

    // Notify
    console.error("");
    console.error("\uD83D\uDCBE AUTO-SAVE: Context prepared for MCP memory");
    console.error("\u2501".repeat(45));
    console.error(`   Files read: ${metrics.filesRead}`);
    console.error(`   Alerts: ${contextData.alerts.length}`);
    console.error(`   Decisions: ${contextData.decisions.length}`);
    console.error("");
    console.error("   \u2192 Claude: Please save .claude/pending-mcp-save.json");
    console.error("     to MCP memory using mcp__memory__create_entities");
    console.error("\u2501".repeat(45));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3: Compaction Handoff (from compaction-handoff.js)
// ═══════════════════════════════════════════════════════════════════════════

function gatherGitContext() {
  return {
    branch: gitExec(["rev-parse", "--abbrev-ref", "HEAD"]),
    lastCommit: gitExec(["log", "--oneline", "-1"]),
    uncommittedFiles: gitExec(["diff", "--name-only"])
      .split("\n")
      .filter((f) => f.length > 0),
    untrackedFiles: gitExec(["ls-files", "--others", "--exclude-standard"])
      .split("\n")
      .filter((f) => f.length > 0)
      .slice(0, 20), // Cap at 20
    stagedFiles: gitExec(["diff", "--cached", "--name-only"])
      .split("\n")
      .filter((f) => f.length > 0),
  };
}

function gatherTaskStates() {
  const stateDir = path.join(projectDir, ".claude", "state");
  try {
    const files = fs
      .readdirSync(stateDir)
      .filter((f) => f.startsWith("task-") && f.endsWith(".state.json"));
    return files.map((f) => {
      const data = loadJson(path.join(stateDir, f));
      if (!data) return { file: f, error: "unreadable" };
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

function getSessionCounter() {
  try {
    const contextPath = path.join(projectDir, "SESSION_CONTEXT.md");
    const content = fs.readFileSync(contextPath, "utf8");
    // Resilient: optional bold markers, flexible spacing, "Count"/"Counter" (P001 fix)
    const match = content.match(/\*{0,2}Current Session Count(?:er)?\*{0,2}\s*:?\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

function buildHandoff() {
  const sessionAgents = loadJson(SESSION_AGENTS_FILE) || { agentsInvoked: [] };
  const sessionState = loadJson(SESSION_STATE_FILE) || {};
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
  const recentCommits = gitExec(["log", "--oneline", "-10"])
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
      filesRead: contextState.filesRead?.length || 0,
      filesList: (contextState.filesRead || []).slice(-15), // Last 15 files (OPT #73)
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

function runCompactionHandoff() {
  // Check cooldown
  const handoffState = loadJson(HANDOFF_STATE_FILE) || { lastWrite: 0 };
  const minutesSinceLast = (Date.now() - handoffState.lastWrite) / (1000 * 60);
  if (minutesSinceLast < HANDOFF_COOLDOWN_MINUTES) {
    return;
  }

  // Check if context threshold hit (reuse already-loaded contextState)
  const filesRead = contextState.filesRead?.length || 0;
  if (filesRead < FILE_READ_THRESHOLD_HANDOFF) {
    return;
  }

  // Build and write handoff
  const handoff = buildHandoff();
  if (saveJson(HANDOFF_OUTPUT, handoff)) {
    // Prune filesList to cap at 15 entries (OPT #73)
    if (rotateHelpers && typeof rotateHelpers.pruneJsonKey === "function") {
      try {
        rotateHelpers.pruneJsonKey(HANDOFF_OUTPUT, "contextMetrics.filesList", 15);
      } catch {
        // Non-critical — pruning failure doesn't block handoff
      }
    }

    // Update cooldown state
    saveJson(HANDOFF_STATE_FILE, { lastWrite: Date.now(), filesAtWrite: filesRead });

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
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

function main() {
  try {
    // Phase 1: Context tracking + large file warning
    runContextTracking();
  } catch (err) {
    console.warn(
      `post-read-handler: context tracking error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  try {
    // Phase 2: Auto-save context check
    runAutoSaveContext();
  } catch (err) {
    console.warn(
      `post-read-handler: auto-save error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  try {
    // Phase 3: Compaction handoff
    runCompactionHandoff();
  } catch (err) {
    console.warn(
      `post-read-handler: compaction handoff error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Always succeed
  console.log("ok");
  process.exit(0);
}

main();
