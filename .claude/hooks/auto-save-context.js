#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * auto-save-context.js - Automatically save context to MCP memory
 *
 * This hook runs on PostToolUse (Read) and automatically saves session
 * context to MCP memory when thresholds are exceeded.
 *
 * Purpose: Prevent context rot by proactively saving important info
 * before compaction happens.
 *
 * What it saves:
 * - Current session state (from session-state.json)
 * - Pending alerts (from pending-alerts.json)
 * - Recent decisions (from SESSION_DECISIONS.md - last 3)
 * - Current TODO list (if active)
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

// Configuration
const TOOL_CALL_THRESHOLD = 30; // Save after this many tool calls
const FILE_READ_THRESHOLD = 20; // Or after this many file reads
const SAVE_INTERVAL_MINUTES = 15; // Don't save more often than this

// Paths
const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;
const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Security check - Pattern #71: Use startsWith for robust containment validation
// path.relative has edge cases with empty strings; prefer explicit prefix check
if (!projectDir.startsWith(safeBaseDir + path.sep) && projectDir !== safeBaseDir) {
  console.log("ok"); // Exit silently on security violation
  process.exit(0);
}

process.chdir(projectDir);

const STATE_FILE = path.join(projectDir, ".claude", "hooks", ".auto-save-state.json");
// Review #214: Fixed path to match session-start.js location
const SESSION_STATE_FILE = path.join(projectDir, ".claude", "hooks", ".session-state.json");
const PENDING_ALERTS_FILE = path.join(projectDir, ".claude", "pending-alerts.json");
const SESSION_DECISIONS_FILE = path.join(projectDir, "docs", "SESSION_DECISIONS.md");
const CONTEXT_TRACKING_FILE = path.join(
  projectDir,
  ".claude",
  "hooks",
  ".context-tracking-state.json"
);

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
 * Save JSON file safely
 */
function saveJson(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get context tracking metrics
 */
function getContextMetrics() {
  const tracking = loadJson(CONTEXT_TRACKING_FILE) || { filesRead: [], lastReset: 0 };
  return {
    filesRead: tracking.filesRead?.length || 0,
    lastReset: tracking.lastReset || 0,
  };
}

/**
 * Get recent decisions from SESSION_DECISIONS.md
 * Review #214: Fixed to get MOST RECENT decisions, not oldest
 */
function getRecentDecisions(limit = 3) {
  try {
    const content = fs.readFileSync(SESSION_DECISIONS_FILE, "utf8");
    // Match decision blocks (### [DATE] - [TITLE])
    // Pattern needs explicit newline after header for proper content capture
    const decisionPattern = /^### \[(\d{4}-\d{2}-\d{2})\] - (.+?)\n([\s\S]*?)(?=^### \[|^## |$)/gm;

    // Collect ALL decisions first
    const allDecisions = Array.from(content.matchAll(decisionPattern)).map((m) => ({
      date: m[1],
      title: m[2].trim(),
      summary: (m[3] || "").trim().substring(0, 200) + "...",
    }));

    // Return the LAST N decisions (most recent, assuming file is chronological)
    return allDecisions.slice(-limit);
  } catch {
    return [];
  }
}

/**
 * Sanitize context data to remove potentially sensitive information
 * Review #214: Prevent sensitive data persistence
 */
function sanitizeContextData(contextData) {
  const sanitized = {
    metrics: contextData.metrics,
    // Only include safe session state fields
    sessionState: contextData.sessionState
      ? {
          lastBegin: contextData.sessionState.lastBegin,
          lastEnd: contextData.sessionState.lastEnd,
          sessionCount: contextData.sessionState.sessionCount,
        }
      : null,
    // Alerts are generally safe (no secrets)
    alerts: (contextData.alerts || []).map((a) => ({
      type: a.type,
      severity: a.severity,
      message: a.message,
      // Exclude details which might contain sensitive info
    })),
    // Decisions only include title/date
    decisions: (contextData.decisions || []).map((d) => ({
      date: d.date,
      title: d.title,
      // Exclude summary which might contain sensitive context
    })),
  };
  return sanitized;
}

/**
 * Save context to MCP memory via CLI
 */
function saveToMcpMemory(contextData) {
  // Create entity for current session context
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

  // We can't directly call MCP from a hook, but we can write to a file
  // that Claude can read and then save to MCP memory
  const mcpSaveFile = path.join(projectDir, ".claude", "pending-mcp-save.json");
  const mcpData = {
    timestamp: new Date().toISOString(),
    entity: {
      name: entityName,
      entityType: "session_context",
      observations: observations,
    },
    // Review #214: Sanitize raw data to prevent sensitive info persistence
    raw: sanitizeContextData(contextData),
  };

  return saveJson(mcpSaveFile, mcpData);
}

/**
 * Main function
 */
function main() {
  // Load auto-save state
  const state = loadJson(STATE_FILE) || {
    lastSave: 0,
    saveCount: 0,
  };

  // Check if enough time has passed since last save
  const now = Date.now();
  const minutesSinceLastSave = (now - state.lastSave) / (1000 * 60);
  if (minutesSinceLastSave < SAVE_INTERVAL_MINUTES && state.saveCount > 0) {
    console.log("ok");
    process.exit(0);
  }

  // Get context metrics
  const metrics = getContextMetrics();

  // Check if thresholds are exceeded
  const shouldSave = metrics.filesRead >= FILE_READ_THRESHOLD;

  if (!shouldSave) {
    console.log("ok");
    process.exit(0);
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
    saveJson(STATE_FILE, state);

    // Notify
    console.error("");
    console.error("💾 AUTO-SAVE: Context prepared for MCP memory");
    console.error("━".repeat(45));
    console.error(`   Files read: ${metrics.filesRead}`);
    console.error(`   Alerts: ${contextData.alerts.length}`);
    console.error(`   Decisions: ${contextData.decisions.length}`);
    console.error("");
    console.error("   → Claude: Please save .claude/pending-mcp-save.json");
    console.error("     to MCP memory using mcp__memory__create_entities");
    console.error("━".repeat(45));
  }

  console.log("ok");
  process.exit(0);
}

main();
