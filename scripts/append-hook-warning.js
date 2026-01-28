#!/usr/bin/env node
/* global __dirname */
/**
 * Append Hook Warning
 *
 * Utility script for hooks to append warnings to .claude/hook-warnings.json
 * These warnings are aggregated by generate-pending-alerts.js and surfaced
 * by Claude at session start.
 *
 * Usage (from hooks):
 *   node scripts/append-hook-warning.js --hook=pre-commit --type=canon --severity=warning --message="CANON validation issues found"
 *
 * @version 1.0.0
 * @created 2026-01-28
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const WARNINGS_FILE = path.join(ROOT_DIR, ".claude", "hook-warnings.json");

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      args[match[1]] = match[2];
    }
  }
  return args;
}

/**
 * Read existing warnings file or create empty structure
 * Pattern #70: Skip existsSync, use try/catch alone (race condition safe)
 */
function readWarnings() {
  try {
    const content = fs.readFileSync(WARNINGS_FILE, "utf8");
    return JSON.parse(content);
  } catch {
    // File doesn't exist or can't be read - return empty structure
    return { warnings: [], lastCleared: null };
  }
}

/**
 * Write warnings file
 * Review #322: Use atomic write (write to temp file then rename) for resilience
 * Review #322 Round 3: Fix Windows compatibility (remove before rename, cleanup tmp)
 */
function writeWarnings(data) {
  const tmpFile = `${WARNINGS_FILE}.tmp`;
  try {
    const claudeDir = path.dirname(WARNINGS_FILE);
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2));

    // Windows: rename over existing file may fail, so remove first
    try {
      fs.rmSync(WARNINGS_FILE, { force: true });
    } catch {
      // ignore - file may not exist
    }

    fs.renameSync(tmpFile, WARNINGS_FILE);
  } catch {
    // Best-effort cleanup to avoid leaving stale tmp files
    try {
      fs.rmSync(tmpFile, { force: true });
    } catch {
      // ignore
    }
    // Hooks should not block git operations due to warning persistence failures
  }
}

/**
 * Append a warning
 */
function appendWarning(hook, type, severity, message, action = null) {
  const data = readWarnings();

  // Check for duplicate (same hook, type, message within last hour)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const isDuplicate = data.warnings.some(
    (w) =>
      w.hook === hook &&
      w.type === type &&
      w.message === message &&
      new Date(w.timestamp).getTime() > oneHourAgo
  );

  if (!isDuplicate) {
    data.warnings.push({
      hook,
      type,
      severity: severity || "warning",
      message,
      action,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 50 warnings to prevent file bloat
    if (data.warnings.length > 50) {
      data.warnings = data.warnings.slice(-50);
    }

    writeWarnings(data);
  }
}

/**
 * Clear warnings (called at session start or when surfaced)
 */
function clearWarnings() {
  writeWarnings({
    warnings: [],
    lastCleared: new Date().toISOString(),
  });
}

// Main
const args = parseArgs();

if (args.clear === "true") {
  clearWarnings();
  console.log("Hook warnings cleared");
} else if (args.hook && args.message) {
  appendWarning(
    args.hook,
    args.type || "general",
    args.severity || "warning",
    args.message,
    args.action || null
  );
  // Silent success for hook usage
} else {
  console.error(
    "Usage: --hook=<hook> --type=<type> --severity=<severity> --message=<message> [--action=<action>]"
  );
  console.error("       --clear=true");
  process.exit(1);
}
