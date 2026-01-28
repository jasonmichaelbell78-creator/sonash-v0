#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Alerts Reminder Hook
 *
 * Checks for:
 * 1. Pending alerts that haven't been acknowledged
 * 2. Pending MCP memory saves (context preservation)
 *
 * This hook runs on UserPromptSubmit, outputting directly to Claude's context.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "../..");
const ALERTS_FILE = path.join(ROOT_DIR, ".claude", "pending-alerts.json");
const SESSION_STATE_FILE = path.join(ROOT_DIR, ".claude", "session-state.json");
const ALERTS_ACK_FILE = path.join(ROOT_DIR, ".claude", "alerts-acknowledged.json");
const PENDING_MCP_SAVE_FILE = path.join(ROOT_DIR, ".claude", "pending-mcp-save.json");
const CONTEXT_TRACKING_FILE = path.join(
  ROOT_DIR,
  ".claude",
  "hooks",
  ".context-tracking-state.json"
);

/**
 * Check for large context that needs saving
 */
function checkContextSize() {
  const FILE_THRESHOLD = 20;

  // Pattern #70: Skip existsSync - use try/catch alone (race condition safe)
  try {
    const content = fs.readFileSync(CONTEXT_TRACKING_FILE, "utf8");
    const tracking = JSON.parse(content);
    const filesRead = tracking.filesRead?.length || 0;

    if (filesRead >= FILE_THRESHOLD) {
      return {
        shouldSave: true,
        filesRead: filesRead,
      };
    }
  } catch {
    // File doesn't exist or can't be read - safe to ignore
  }

  return { shouldSave: false };
}

/**
 * Check for pending MCP save
 */
function checkPendingMcpSave() {
  // Pattern #70: Skip existsSync - use try/catch alone (race condition safe)
  try {
    const content = fs.readFileSync(PENDING_MCP_SAVE_FILE, "utf8");
    const data = JSON.parse(content);
    return data;
  } catch {
    // File doesn't exist or can't be read - safe to ignore
  }
  return null;
}

function main() {
  const messages = [];

  // Check for pending alerts
  // Pattern #70: Skip existsSync - use try/catch alone (race condition safe)
  let alertsAcknowledged = false;
  let alertsData = null;

  // Try to read alerts file
  try {
    const content = fs.readFileSync(ALERTS_FILE, "utf8");
    alertsData = JSON.parse(content);
  } catch {
    // File doesn't exist or can't be read - no alerts to check
  }

  if (alertsData) {
    // Check if alerts were acknowledged
    try {
      const ackContent = fs.readFileSync(ALERTS_ACK_FILE, "utf8");
      const ackData = JSON.parse(ackContent);

      if (ackData.acknowledgedAt && alertsData.generated) {
        const ackTime = new Date(ackData.acknowledgedAt).getTime();
        const alertsTime = new Date(alertsData.generated).getTime();
        if (ackTime > alertsTime) {
          alertsAcknowledged = true;
        }
      }
    } catch {
      // Ack file doesn't exist or can't be read - treat as not acknowledged
    }

    if (!alertsAcknowledged) {
      const counts = { error: 0, warning: 0, info: 0 };
      for (const alert of alertsData.alerts || []) {
        counts[alert.severity] = (counts[alert.severity] || 0) + 1;
      }

      const total = counts.error + counts.warning + counts.info;
      if (total > 0) {
        const parts = [];
        if (counts.error > 0) parts.push(`${counts.error} error(s)`);
        if (counts.warning > 0) parts.push(`${counts.warning} warning(s)`);
        if (counts.info > 0) parts.push(`${counts.info} info`);
        messages.push(`ALERTS: ${total} pending (${parts.join(", ")}). Tell user or run /alerts.`);
      }
    }
  }

  // Check for large context needing MCP save
  const contextCheck = checkContextSize();
  const pendingMcp = checkPendingMcpSave();

  if (contextCheck.shouldSave || pendingMcp) {
    messages.push(
      `CONTEXT: ${contextCheck.filesRead || "many"} files read. Save to MCP memory before compaction!`
    );
    if (pendingMcp) {
      messages.push(
        `ACTION: Run mcp__memory__create_entities with entity from .claude/pending-mcp-save.json`
      );
    } else {
      messages.push(
        `ACTION: Use /save-context skill or manually save important context to MCP memory`
      );
    }
  }

  // Output all messages
  if (messages.length > 0) {
    messages.forEach((m) => console.log(m));
  }

  process.exit(0);
}

main();
