#!/usr/bin/env node
/**
 * Session Activity Logger
 *
 * Logs session activities to a JSONL file for tracking and analysis.
 * Used by hooks and the session-end command to track:
 * - Session start/end events
 * - File modifications
 * - Skill/agent invocations
 * - Commits made
 *
 * Usage:
 *   node scripts/log-session-activity.js --event=session_start
 *   node scripts/log-session-activity.js --event=file_write --file=path/to/file.ts
 *   node scripts/log-session-activity.js --event=skill_invoke --skill=code-reviewer
 *   node scripts/log-session-activity.js --event=commit --hash=abc123 --message="feat: add feature"
 *   node scripts/log-session-activity.js --event=session_end
 *   node scripts/log-session-activity.js --summary  # Show current session summary
 *   node scripts/log-session-activity.js --clear    # Clear log (new session)
 *
 * Output: .claude/session-activity.jsonl
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// Get repository root for consistent log location
function getRepoRoot() {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf-8",
    timeout: 3000,
  });
  if (result.status === 0 && result.stdout) {
    return result.stdout.trim();
  }
  return process.cwd();
}

// Configuration
const LOG_FILE = path.join(getRepoRoot(), ".claude", "session-activity.jsonl");
const MAX_LOG_SIZE = 100 * 1024; // 100KB - rotate if larger
const MAX_FIELD_LENGTH = 200; // Truncate long fields

// Secret patterns to redact from log entries
const SECRET_PATTERNS = [
  // Tokens with 24+ chars containing both letters and digits
  /\b(?=[A-Za-z0-9_-]{24,}\b)(?=[A-Za-z0-9_-]*[A-Za-z])(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]+\b/g,
  // Bearer tokens
  /bearer\s+[A-Za-z0-9._-]+/gi,
  // Basic auth
  /basic\s+[A-Za-z0-9+/=]+/gi,
  // Key=value patterns with sensitive names
  /(?:api[_-]?key|token|secret|password|auth|credential)[=:]\s*\S+/gi,
];

/**
 * Sanitize a string value for logging
 * - Truncates to MAX_FIELD_LENGTH
 * - Redacts potential secrets
 */
function sanitizeForLog(value) {
  if (typeof value !== "string") return value;

  let sanitized = value;

  // Redact potential secrets
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }

  // Truncate long values
  if (sanitized.length > MAX_FIELD_LENGTH) {
    sanitized = sanitized.slice(0, MAX_FIELD_LENGTH) + "...[truncated]";
  }

  return sanitized;
}

/**
 * Sanitize an event data object for logging
 */
function sanitizeEventData(eventData) {
  const sanitized = {};
  for (const [key, value] of Object.entries(eventData)) {
    // Sanitize user-controlled string fields
    if (typeof value === "string" && ["message", "file", "skill", "hash"].includes(key)) {
      sanitized[key] = sanitizeForLog(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Ensure .claude directory exists
function ensureLogDir() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Parse command line arguments
function parseArgs() {
  const args = {
    event: null,
    file: null,
    skill: null,
    hash: null,
    message: null,
    summary: false,
    clear: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--summary") {
      args.summary = true;
    } else if (arg === "--clear") {
      args.clear = true;
    } else if (arg.startsWith("--event=")) {
      // Use slice(1).join("=") to handle values containing "="
      args.event = arg.split("=").slice(1).join("=");
    } else if (arg.startsWith("--file=")) {
      args.file = arg.split("=").slice(1).join("=");
    } else if (arg.startsWith("--skill=")) {
      args.skill = arg.split("=").slice(1).join("=");
    } else if (arg.startsWith("--hash=")) {
      args.hash = arg.split("=").slice(1).join("=");
    } else if (arg.startsWith("--message=")) {
      args.message = arg.split("=").slice(1).join("=");
    }
  }

  return args;
}

// Log an event to the JSONL file
function logEvent(eventData) {
  try {
    ensureLogDir();
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Warning: Could not create log directory: ${errMsg}`);
    return null;
  }

  // Sanitize user-controlled fields before logging
  const sanitizedData = sanitizeEventData(eventData);

  // Build entry with user identifier and outcome for audit trail compliance
  const entry = {
    timestamp: new Date().toISOString(),
    user: process.env.USER || process.env.USERNAME || "unknown",
    outcome: "success", // Will be overridden if eventData includes outcome
    ...sanitizedData,
  };

  try {
    // Check log size and rotate if needed
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > MAX_LOG_SIZE) {
        const backupFile = LOG_FILE.replace(".jsonl", `-${Date.now()}.jsonl`);
        fs.renameSync(LOG_FILE, backupFile);
        console.log(`Log rotated to ${path.basename(backupFile)}`);
      }
    }

    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
    return entry;
  } catch (err) {
    // Non-fatal: log write failure should not crash scripts/hooks
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Warning: Could not write to activity log: ${errMsg}`);
    return null;
  }
}

// Read all events from log
function readEvents() {
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }

  // Wrap in try/catch - existsSync doesn't guarantee read success
  let content;
  try {
    content = fs.readFileSync(LOG_FILE, "utf-8");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Warning: Could not read activity log: ${errMsg}`);
    return [];
  }

  return content
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// Get current session events (since last session_start)
function getCurrentSessionEvents() {
  const events = readEvents();

  // Find last session_start
  let sessionStartIndex = -1;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].event === "session_start") {
      sessionStartIndex = i;
      break;
    }
  }

  if (sessionStartIndex === -1) {
    return events; // No session_start found, return all
  }

  return events.slice(sessionStartIndex);
}

// Generate session summary
function generateSummary() {
  const events = getCurrentSessionEvents();

  if (events.length === 0) {
    console.log("No session activity logged.");
    return;
  }

  const summary = {
    sessionStart: null,
    filesModified: new Set(),
    skillsInvoked: {},
    commits: [],
    duration: null,
  };

  for (const event of events) {
    switch (event.event) {
      case "session_start":
        summary.sessionStart = event.timestamp;
        break;
      case "file_write":
      case "file_edit":
        if (event.file) {
          summary.filesModified.add(event.file);
        }
        break;
      case "skill_invoke":
        if (event.skill) {
          summary.skillsInvoked[event.skill] = (summary.skillsInvoked[event.skill] || 0) + 1;
        }
        break;
      case "commit":
        summary.commits.push({
          hash: event.hash,
          message: event.message,
          timestamp: event.timestamp,
        });
        break;
    }
  }

  // Calculate duration if session is active
  if (summary.sessionStart) {
    const start = new Date(summary.sessionStart);
    const now = new Date();
    const durationMs = now - start;
    const minutes = Math.floor(durationMs / 60000);
    summary.duration = `${minutes} minutes`;
  }

  // Output summary
  console.log("\n📊 SESSION ACTIVITY SUMMARY");
  console.log("═".repeat(50));

  if (summary.sessionStart) {
    console.log(`\n⏱️  Session Started: ${summary.sessionStart}`);
    console.log(`   Duration: ${summary.duration}`);
  }

  console.log(`\n📁 Files Modified: ${summary.filesModified.size}`);
  if (summary.filesModified.size > 0) {
    for (const file of [...summary.filesModified].slice(0, 10)) {
      console.log(`   - ${file}`);
    }
    if (summary.filesModified.size > 10) {
      console.log(`   ... and ${summary.filesModified.size - 10} more`);
    }
  }

  console.log(`\n🔧 Skills/Agents Invoked: ${Object.keys(summary.skillsInvoked).length}`);
  for (const [skill, count] of Object.entries(summary.skillsInvoked)) {
    console.log(`   - ${skill}: ${count}x`);
  }

  console.log(`\n📝 Commits: ${summary.commits.length}`);
  for (const commit of summary.commits.slice(0, 5)) {
    const shortHash = commit.hash ? commit.hash.slice(0, 7) : "unknown";
    const shortMsg = commit.message ? commit.message.slice(0, 50) : "no message";
    console.log(`   - ${shortHash}: ${shortMsg}`);
  }

  console.log("\n" + "═".repeat(50));
}

// Clear the log (for new session)
function clearLog() {
  ensureLogDir();
  if (fs.existsSync(LOG_FILE)) {
    // Archive old log before clearing
    const backupFile = LOG_FILE.replace(".jsonl", `-archived-${Date.now()}.jsonl`);
    fs.renameSync(LOG_FILE, backupFile);
    console.log(`Previous session log archived to ${path.basename(backupFile)}`);
  }
  // Create empty log with session_start
  logEvent({ event: "session_start", source: "manual_clear" });
  console.log("Session activity log cleared. New session started.");
}

// Main execution
function main() {
  const args = parseArgs();

  if (args.summary) {
    generateSummary();
    return;
  }

  if (args.clear) {
    clearLog();
    return;
  }

  if (!args.event) {
    console.log("Usage: node log-session-activity.js --event=<type> [options]");
    console.log("\nEvent types:");
    console.log("  session_start  - Log session start");
    console.log("  session_end    - Log session end");
    console.log("  file_write     - Log file write (--file=path)");
    console.log("  file_edit      - Log file edit (--file=path)");
    console.log("  skill_invoke   - Log skill invocation (--skill=name)");
    console.log("  commit         - Log commit (--hash=abc --message='msg')");
    console.log("\nOther commands:");
    console.log("  --summary      - Show current session summary");
    console.log("  --clear        - Clear log and start new session");
    process.exit(1);
  }

  // Build event data based on type
  const eventData = { event: args.event };

  switch (args.event) {
    case "session_start":
      eventData.source = "hook";
      break;
    case "session_end":
      eventData.source = "command";
      break;
    case "file_write":
    case "file_edit":
      if (args.file) {
        eventData.file = args.file;
      }
      break;
    case "skill_invoke":
      if (args.skill) {
        eventData.skill = args.skill;
      }
      break;
    case "commit":
      if (args.hash) eventData.hash = args.hash;
      if (args.message) eventData.message = args.message;
      break;
  }

  const entry = logEvent(eventData);
  if (!entry) {
    console.error("❌ ERROR: Failed to write session activity log.");
    process.exit(2);
  }
  console.log(
    `Logged: ${args.event}${args.file ? ` (${args.file})` : ""}${args.skill ? ` (${args.skill})` : ""}`
  );
}

main();
