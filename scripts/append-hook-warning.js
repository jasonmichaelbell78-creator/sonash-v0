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

let fs, path;
try {
  fs = require("node:fs");
  path = require("node:path");
} catch (e) {
  console.error(
    "Failed to load required modules:",
    e instanceof Error ? e.constructor.name : typeof e
  );
  process.exit(1);
}

// Safe-fs wrappers (symlink guard + EXDEV fallback)
let safeWriteFileSync, safeRenameSync, safeAppendFileSync;
try {
  ({ safeWriteFileSync, safeRenameSync, safeAppendFileSync } = require("./lib/safe-fs"));
} catch {
  console.error("safe-fs unavailable; refusing to write");
  process.exit(2);
}

// Symlink guard (Review #316-#323)
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require(
    path.join(__dirname, "..", ".claude", "hooks", "lib", "symlink-guard")
  ));
} catch {
  console.error("symlink-guard unavailable; disabling writes");
  isSafeToWrite = () => false;
}

const ROOT_DIR = path.join(__dirname, "..");
const WARNINGS_FILE = path.join(ROOT_DIR, ".claude", "hook-warnings.json");
const WARNINGS_LOG_FILE = path.join(ROOT_DIR, ".claude", "state", "hook-warnings-log.jsonl");

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
 * Count recent occurrences of a warning type from the JSONL trail (C2-G2)
 * Used for auto-escalation: 5+ → warning, 15+ → error
 */
function countRecentOccurrences(type, sinceDaysAgo) {
  try {
    const logPath = WARNINGS_LOG_FILE;
    try {
      const st = fs.lstatSync(logPath);
      if (st.isSymbolicLink()) {
        console.error("⚠️ hook-warnings-log.jsonl is a symlink — skipping occurrence count");
        return 0;
      }
      if (st.size > 2 * 1024 * 1024) {
        console.error(
          "⚠️ hook-warnings-log.jsonl exceeds 2MB size guard — skipping occurrence count"
        );
        return 0;
      }
    } catch {
      return 0;
    }
    const content = fs.readFileSync(logPath, "utf8");
    const cutoff = Date.now() - (sinceDaysAgo || 7) * 24 * 60 * 60 * 1000;
    let count = 0;
    for (const line of content.split("\n")) {
      if (!line.trim()) continue;
      // T39: try/catch wraps JSON.parse(line) directly — pattern-compliance
      // detector (Reviews 353/357/358) expects this exact shape so pretty-
      // printed multi-line entries silently fail their parse and get skipped
      // rather than bubbling up.
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue; // skip malformed
      }
      if (entry.type === type && new Date(entry.timestamp).getTime() > cutoff) count++;
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * Count occurrences since a given timestamp (C2-G3)
 */
function countOccurrencesSince(type, sinceTimestamp) {
  try {
    const logPath = WARNINGS_LOG_FILE;
    try {
      const st = fs.lstatSync(logPath);
      if (st.isSymbolicLink()) {
        console.error(
          "⚠️ hook-warnings-log.jsonl is a symlink — skipping occurrence-since-ack count"
        );
        return 0;
      }
      if (st.size > 2 * 1024 * 1024) {
        console.error(
          "⚠️ hook-warnings-log.jsonl exceeds 2MB size guard — skipping occurrence-since-ack count"
        );
        return 0;
      }
    } catch {
      return 0;
    }
    const content = fs.readFileSync(logPath, "utf8");
    const since = new Date(sinceTimestamp).getTime();
    let count = 0;
    for (const line of content.split("\n")) {
      if (!line.trim()) continue;
      // T39: see countRecentOccurrences — pattern-compliance detector shape.
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue; // skip malformed
      }
      if (entry.type === type && new Date(entry.timestamp).getTime() > since) count++;
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * Read existing warnings file or create empty structure
 * Pattern #70: Skip existsSync, use try/catch alone (race condition safe)
 * D16/D30: hook-warnings.json is a cache view — no ack/cleared fields
 */
function readWarnings() {
  try {
    const content = fs.readFileSync(WARNINGS_FILE, "utf8");
    const parsed = JSON.parse(content);
    // Normalize: only keep warnings array (D16: ack state lives in hook-warnings-ack.json)
    return { warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [] };
  } catch {
    // File doesn't exist or can't be read - return empty structure
    return { warnings: [] };
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
    if (!isSafeToWrite(WARNINGS_FILE) || !isSafeToWrite(tmpFile)) return;
    const claudeDir = path.dirname(WARNINGS_FILE);
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    safeWriteFileSync(tmpFile, JSON.stringify(data, null, 2));

    // Windows: rename over existing file may fail, so remove first
    try {
      fs.rmSync(WARNINGS_FILE, { force: true });
    } catch {
      // ignore - file may not exist
    }

    safeRenameSync(tmpFile, WARNINGS_FILE);
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
 * C2-G1: Accepts optional files (comma-separated) and pattern name
 * C2-G2: Auto-escalates severity based on occurrence count (5+ → warning, 15+ → error)
 * C2-G3: Tracks occurrences_since_ack for acknowledgment awareness
 */
/**
 * Check if a warning with the given type+message exists in the JSONL log
 * since the given timestamp. Returns true if a match is found, false otherwise.
 * Safety guards (symlink, size) skip dedup rather than suppressing warnings.
 */
function hasMatchInWarningsLog(type, message, sinceMs) {
  const logPath = WARNINGS_LOG_FILE;
  try {
    const st = fs.lstatSync(logPath);
    if (st.isSymbolicLink()) {
      console.error("⚠️ hook-warnings-log.jsonl is a symlink — skipping cross-session dedup");
      return false;
    }
    if (st.size > 2 * 1024 * 1024) {
      console.error("⚠️ hook-warnings-log.jsonl exceeds 2MB — skipping cross-session dedup");
      return false;
    }
    const content = fs.readFileSync(logPath, "utf8");
    for (const line of content.split("\n")) {
      if (!line.trim()) continue;
      // T39: see countRecentOccurrences — pattern-compliance detector shape.
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue; // skip malformed
      }
      if (
        entry.type === type &&
        entry.message === message &&
        entry.resolved !== true &&
        new Date(entry.timestamp).getTime() > sinceMs
      ) {
        return true;
      }
    }
  } catch {
    /* file not readable — fall through to allow append */
  }
  return false;
}

function isDuplicateWarning(data, hook, type, message, ackState) {
  // Fast path: check cache view within 1 hour (same-session dedup)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  if (
    data.warnings.some(
      (w) =>
        w.hook === hook &&
        w.type === type &&
        w.message === message &&
        new Date(w.timestamp).getTime() > oneHourAgo
    )
  ) {
    return true;
  }

  // Cross-session dedup: check if same type+message already logged since lastCleared
  // Allows ONE occurrence per ack cycle; resolved entries don't count (condition may re-emerge)
  const sinceMs = ackState.lastCleared ? new Date(ackState.lastCleared).getTime() : 0;
  if (Number.isFinite(sinceMs) && sinceMs > 0) {
    return hasMatchInWarningsLog(type, message, sinceMs);
  }

  return false;
}

function escalateSeverity(severity, occurrences) {
  if (occurrences >= 15) return "error";
  if (occurrences >= 5 && severity === "info") return "warning";
  return severity || "warning";
}

function parseFileList(files) {
  if (!files) return undefined;
  return files
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function buildWarningEntry({
  hook,
  type,
  severity,
  message,
  action,
  occurrences,
  sinceAck,
  fileList,
  pattern,
  count,
}) {
  const entry = {
    hook,
    type,
    severity,
    message,
    action,
    timestamp: new Date().toISOString(),
  };
  if (fileList && fileList.length > 0) entry.files = fileList;
  if (pattern) entry.pattern = pattern;
  if (occurrences > 0) entry.occurrences = occurrences;
  if (sinceAck > 0) entry.occurrences_since_ack = sinceAck;
  // T39: Optional `count` field for metrics where the varying number would
  // otherwise defeat dedup (e.g., pr-creep "10 commits on branch" → stable
  // message + count=10). Kept as separate field so dedup on type+message
  // matches across commit counts.
  if (count !== undefined && count !== null && count !== "") entry.count = count;
  return entry;
}

function writeAuditTrail(entry) {
  try {
    const logDir = path.dirname(WARNINGS_LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    if (!isSafeToWrite(logDir)) return;
    if (!isSafeToWrite(WARNINGS_LOG_FILE)) return;
    const auditRecord = {
      ...entry,
      actor: "hook-system",
      user: "redacted",
      outcome: entry.severity === "error" ? "blocked" : "warned",
    };
    safeAppendFileSync(WARNINGS_LOG_FILE, JSON.stringify(auditRecord) + "\n");
  } catch {
    // Best-effort — never block hooks on log failure
  }
}

/**
 * Read acknowledgment state from dedicated ack file (D30)
 */
function readAckState() {
  const ackPath = path.join(ROOT_DIR, ".claude", "state", "hook-warnings-ack.json");
  try {
    const parsed = JSON.parse(fs.readFileSync(ackPath, "utf8"));
    return {
      acknowledged: typeof parsed?.acknowledged === "object" ? parsed.acknowledged : {},
      lastCleared: parsed?.lastCleared ? parsed.lastCleared : null,
    };
  } catch {
    return { acknowledged: {}, lastCleared: null };
  }
}

function appendWarning(
  hook,
  type,
  severity,
  message,
  action = null,
  files = null,
  pattern = null,
  count = null
) {
  const data = readWarnings();
  // D30: Read ack state once, pass to both dedup and occurrence tracking
  const ackState = readAckState();
  if (isDuplicateWarning(data, hook, type, message, ackState)) return;

  const priorOccurrences = countRecentOccurrences(type);
  const occurrences = priorOccurrences + 1; // include this warning
  const effectiveSeverity = escalateSeverity(severity, occurrences);
  const lastAck = ackState.acknowledged[type] || null;
  const priorSinceAck = lastAck ? countOccurrencesSince(type, lastAck) : priorOccurrences;
  const sinceAck = priorSinceAck + 1; // include this warning
  const fileList = parseFileList(files);

  const entry = buildWarningEntry({
    hook,
    type,
    severity: effectiveSeverity,
    message,
    action,
    occurrences,
    sinceAck,
    fileList,
    pattern,
    count,
  });
  data.warnings.push(entry);

  if (data.warnings.length > 50) {
    data.warnings = data.warnings.slice(-50);
  }

  writeWarnings(data);
  writeAuditTrail(entry);
}

/**
 * Clear warnings (called at session start or when surfaced)
 * D30: Acknowledgment state written to hook-warnings-ack.json (not hook-warnings.json)
 * hook-warnings.json is cleared to empty warnings array (cache view)
 */
function clearWarnings() {
  // Write empty cache view
  writeWarnings({ warnings: [] });

  // Update ack state file with lastCleared timestamp (D30)
  const ackPath = path.join(ROOT_DIR, ".claude", "state", "hook-warnings-ack.json");
  try {
    const ackState = readAckState();
    ackState.lastCleared = new Date().toISOString();
    const ackTmp = `${ackPath}.tmp`;
    if (isSafeToWrite(ackPath) && isSafeToWrite(ackTmp)) {
      safeWriteFileSync(ackTmp, JSON.stringify(ackState, null, 2) + "\n");
      try {
        fs.rmSync(ackPath, { force: true });
      } catch {
        /* best-effort */
      }
      safeRenameSync(ackTmp, ackPath);
    }
  } catch {
    // Best-effort — don't block on ack state write failure
  }
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
    args.action || null,
    args.files || null,
    args.pattern || null,
    args.count ?? null
  );
  // Silent success for hook usage
} else {
  console.error(
    "Usage: --hook=<hook> --type=<type> --severity=<severity> --message=<message> [--action=<action>] [--count=<n>]"
  );
  console.error("       --clear=true");
  process.exit(1);
}
