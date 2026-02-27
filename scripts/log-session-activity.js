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

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { safeAppendFileSync, safeRenameSync } = require("./lib/safe-fs");

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
  /bearer\s+[A-Z0-9._-]+/gi,
  // Basic auth
  /basic\s+[A-Z0-9+/=]+/gi,
  // Key=value patterns with sensitive names
  /(?:api[_-]?key|token|secret|password|auth|credential)[=:]\s*\S+/gi,
];

/**
 * Sanitize a string value for logging
 * - Strips control characters to prevent log injection
 * - Redacts potential secrets
 * - Truncates to MAX_FIELD_LENGTH
 */
function sanitizeForLog(value) {
  if (typeof value !== "string") return value;

  // Strip control characters (keep tab \x09, newline \x0A, carriage return \x0D)
  // eslint-disable-next-line no-control-regex
  let sanitized = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

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
 * Recursively sanitizes ALL string values (including nested objects/arrays)
 * to prevent accidental secret leakage
 */
function sanitizeEventData(eventData) {
  const sanitizeAny = (value) => {
    if (typeof value === "string") return sanitizeForLog(value);
    if (Array.isArray(value)) return value.map(sanitizeAny);
    if (value && typeof value === "object") {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = sanitizeAny(v);
      }
      return out;
    }
    return value;
  };

  return sanitizeAny(eventData);
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
        const backupFile = LOG_FILE.replaceAll(".jsonl", `-${Date.now()}.jsonl`);
        safeRenameSync(LOG_FILE, backupFile);
        console.log(`Log rotated to ${path.basename(backupFile)}`);
      }
    }

    safeAppendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
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

/**
 * Process a single event into the summary
 */
function processEventIntoSummary(event, summary) {
  const eventType = event.event;

  if (eventType === "session_start") {
    summary.sessionStart = event.timestamp;
  } else if (eventType === "session_end") {
    summary.sessionEnd = event.timestamp;
  } else if ((eventType === "file_write" || eventType === "file_edit") && event.file) {
    summary.filesModified.add(event.file);
  } else if (eventType === "skill_invoke" && event.skill) {
    summary.skillsInvoked[event.skill] = (summary.skillsInvoked[event.skill] || 0) + 1;
  } else if (eventType === "commit") {
    summary.commits.push({
      hash: event.hash,
      message: event.message,
      timestamp: event.timestamp,
    });
  }
}

/**
 * Calculate session duration from summary
 */
function calculateDuration(summary) {
  if (!summary.sessionStart) return null;

  const start = new Date(summary.sessionStart);
  const end = summary.sessionEnd ? new Date(summary.sessionEnd) : new Date();

  const startMs = start.getTime();
  const endMs = end.getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return "unknown";
  }

  const durationMs = Math.max(0, endMs - startMs);
  const minutes = Math.floor(durationMs / 60000);
  return `${minutes} minutes`;
}

/**
 * Output session timing information
 */
function outputSessionTiming(summary) {
  if (!summary.sessionStart) return;

  console.log(`\n⏱️  Session Started: ${summary.sessionStart}`);
  if (summary.sessionEnd) {
    console.log(`   Session Ended: ${summary.sessionEnd}`);
  }
  console.log(`   Duration: ${summary.duration}${summary.sessionEnd ? "" : " (active)"}`);
}

/**
 * Output files modified section
 */
function outputFilesModified(filesModified) {
  console.log(`\n📁 Files Modified: ${filesModified.size}`);
  if (filesModified.size === 0) return;

  const fileList = [...filesModified];
  for (const file of fileList.slice(0, 10)) {
    console.log(`   - ${file}`);
  }
  if (filesModified.size > 10) {
    console.log(`   ... and ${filesModified.size - 10} more`);
  }
}

/**
 * Output skills invoked section
 */
function outputSkillsInvoked(skillsInvoked) {
  console.log(`\n🔧 Skills/Agents Invoked: ${Object.keys(skillsInvoked).length}`);
  for (const [skill, count] of Object.entries(skillsInvoked)) {
    console.log(`   - ${skill}: ${count}x`);
  }
}

/**
 * Output commits section
 */
function outputCommits(commits) {
  console.log(`\n📝 Commits: ${commits.length}`);
  for (const commit of commits.slice(0, 5)) {
    const shortHash = commit.hash ? commit.hash.slice(0, 7) : "unknown";
    const shortMsg = commit.message ? commit.message.slice(0, 50) : "no message";
    console.log(`   - ${shortHash}: ${shortMsg}`);
  }
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
    sessionEnd: null,
    filesModified: new Set(),
    skillsInvoked: {},
    commits: [],
    duration: null,
  };

  // Process all events into summary
  for (const event of events) {
    processEventIntoSummary(event, summary);
  }

  // Calculate duration
  summary.duration = calculateDuration(summary);

  // Output summary sections
  console.log("\n📊 SESSION ACTIVITY SUMMARY");
  console.log("═".repeat(50));

  outputSessionTiming(summary);
  outputFilesModified(summary.filesModified);
  outputSkillsInvoked(summary.skillsInvoked);
  outputCommits(summary.commits);

  console.log("\n" + "═".repeat(50));
}

// Review #188: Allowlist of valid event types to prevent logging malformed events
const ALLOWED_EVENT_TYPES = new Set([
  "session_start",
  "session_end",
  "file_write",
  "file_edit",
  "skill_invoke",
  "commit",
]);

/**
 * Build event data based on event type and arguments
 */
function buildEventData(args) {
  const eventType = args.event;

  // Review #188: Validate event type against allowlist
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return null;
  }

  const eventData = { event: eventType };

  if (eventType === "session_start") {
    eventData.source = "hook";
  } else if (eventType === "session_end") {
    eventData.source = "command";
  } else if (eventType === "file_write" || eventType === "file_edit") {
    if (args.file) eventData.file = args.file;
  } else if (eventType === "skill_invoke") {
    if (args.skill) eventData.skill = args.skill;
  } else if (eventType === "commit") {
    if (args.hash) eventData.hash = args.hash;
    if (args.message) eventData.message = args.message;
  }

  return eventData;
}

/**
 * Output usage information
 */
function outputUsage() {
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
}

// Clear the log (for new session)
function clearLog() {
  ensureLogDir();
  if (fs.existsSync(LOG_FILE)) {
    // Archive old log before clearing
    const backupFile = LOG_FILE.replaceAll(".jsonl", `-archived-${Date.now()}.jsonl`);
    safeRenameSync(LOG_FILE, backupFile);
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
    outputUsage();
    process.exit(1);
  }

  // Build and log event
  const eventData = buildEventData(args);

  // Review #188: Handle invalid event types (buildEventData returns null)
  if (!eventData) {
    console.error(`❌ ERROR: Unknown event type: ${args.event}`);
    console.error(`   Valid types: ${[...ALLOWED_EVENT_TYPES].join(", ")}`);
    process.exit(1);
  }

  const entry = logEvent(eventData);

  if (!entry) {
    console.error("❌ ERROR: Failed to write session activity log.");
    process.exit(2);
  }

  // Review #187: Use eventData (processed values) instead of raw args for accurate log output
  let suffix = "";
  if (eventData.file) {
    suffix += ` (${eventData.file})`;
  }
  if (eventData.skill) {
    suffix += ` (${eventData.skill})`;
  }
  console.log(`Logged: ${eventData.event}${suffix}`);
}

main();
