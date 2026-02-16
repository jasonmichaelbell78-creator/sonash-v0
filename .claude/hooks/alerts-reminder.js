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
const { isSafeToWrite } = require("./lib/symlink-guard");

const ROOT_DIR = path.resolve(__dirname, "../..");
const WARNINGS_FILE = path.join(ROOT_DIR, ".claude", "hook-warnings.json");
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

const COOLDOWN_FILE = path.join(ROOT_DIR, ".claude", "hooks", ".alerts-cooldown.json");
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

function main() {
  // Fast-path: check cooldown before doing any file reads
  try {
    const data = JSON.parse(fs.readFileSync(COOLDOWN_FILE, "utf8"));
    const lastRun = Number(data?.lastRun);
    if (Number.isFinite(lastRun)) {
      const ageMs = Date.now() - lastRun;
      if (ageMs >= 0 && ageMs < COOLDOWN_MS) {
        process.exit(0); // Still in cooldown
      }
      if (ageMs < 0) {
        // Self-healing: delete corrupt future-timestamp cooldown file
        try {
          fs.rmSync(COOLDOWN_FILE, { force: true });
        } catch {
          /* best-effort */
        }
      }
    }
  } catch {
    /* no cooldown file or invalid */
  }

  const messages = [];

  // Check for unacknowledged hook warnings
  let warningsData = null;
  try {
    const content = fs.readFileSync(WARNINGS_FILE, "utf8");
    warningsData = JSON.parse(content);
  } catch {
    // File doesn't exist or can't be read
  }

  if (warningsData) {
    // Check if alerts were acknowledged
    let alertsAcknowledged = false;
    try {
      const ackContent = fs.readFileSync(ALERTS_ACK_FILE, "utf8");
      const ackData = JSON.parse(ackContent);
      if (ackData.acknowledgedAt) {
        const ackTime = new Date(ackData.acknowledgedAt).getTime();
        // Find the newest warning timestamp
        const warnings = Array.isArray(warningsData.warnings) ? warningsData.warnings : [];
        const newestWarning = warnings.reduce((max, w) => {
          const t = new Date(w?.timestamp).getTime();
          if (Number.isNaN(t)) return max;
          return t > max ? t : max;
        }, 0);
        if (newestWarning > 0 && ackTime >= newestWarning) {
          alertsAcknowledged = true;
        }
      }
    } catch {
      // Ack file doesn't exist
    }

    if (!alertsAcknowledged) {
      const warnings = warningsData.warnings || [];
      const counts = { error: 0, warning: 0, info: 0 };
      for (const w of Array.isArray(warnings) ? warnings : []) {
        const raw = typeof w?.severity === "string" ? w.severity : "";
        const sev = raw === "error" || raw === "warning" || raw === "info" ? raw : "warning";
        counts[sev] = counts[sev] + 1;
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

  // Update cooldown after successful check (atomic write — Review #289)
  const tmpCooldown = `${COOLDOWN_FILE}.tmp`;
  try {
    if (!isSafeToWrite(COOLDOWN_FILE)) {
      process.exit(0);
    }
    if (!isSafeToWrite(tmpCooldown)) {
      process.exit(0);
    }
    fs.mkdirSync(path.dirname(COOLDOWN_FILE), { recursive: true });
    fs.writeFileSync(tmpCooldown, JSON.stringify({ lastRun: Date.now() }), "utf-8");
    try {
      fs.rmSync(COOLDOWN_FILE, { force: true });
    } catch {
      /* best-effort */
    }
    fs.renameSync(tmpCooldown, COOLDOWN_FILE); // isSafeToWrite guards on lines 173-178
  } catch {
    try {
      fs.rmSync(tmpCooldown, { force: true });
    } catch {
      /* cleanup */
    }
  }

  process.exit(0);
}

main();
