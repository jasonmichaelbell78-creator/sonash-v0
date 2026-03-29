#!/usr/bin/env node
/* global require, process, console, __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * loop-detector.js - PostToolUseFailure hook (Bash)
 *
 * "Groundhog Day" detector: identifies repeated identical build/test failures
 * and warns Claude to try a different approach. First PostToolUseFailure hook
 * in this project.
 *
 * Detection method:
 *   1. Read error from stdin (PostToolUseFailure event JSON)
 *   2. Normalize error output (strip line numbers, timestamps, temp paths)
 *   3. Hash the normalized text (SHA-256, first 12 chars)
 *   4. Track hashes in rolling 20-minute window
 *   5. If same hash 3+ times within window: output warning to stdout
 *
 * Always exits 0 — this hook warns, never blocks.
 * Uses continueOnError: true as backup.
 *
 * Plan: .planning/hook-if-implementation/PLAN.md Step 11 (Per D12)
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

// --- Safe imports with fallbacks ---

let safeAppendFileSync;
try {
  ({ safeAppendFileSync } = require(path.join(__dirname, "..", "..", "scripts", "lib", "safe-fs")));
} catch {
  // Fallback: direct append (no symlink guard)
  safeAppendFileSync = (filePath, data) => fs.appendFileSync(filePath, data);
}

let isSafeToWrite;
try {
  ({ isSafeToWrite } = require("./lib/symlink-guard"));
} catch {
  isSafeToWrite = () => false;
}

let sanitizeError;
try {
  ({ sanitizeError } = require(
    path.join(__dirname, "..", "..", "scripts", "lib", "sanitize-error.cjs")
  ));
} catch {
  sanitizeError = (err) => (err instanceof Error ? err.constructor.name : typeof err);
}

// --- Constants ---

const WINDOW_MS = 20 * 60 * 1000; // 20 minutes
const TRIGGER_COUNT = 3; // Warn on 3rd occurrence (per D12)

// Resolve project directory from cwd or env
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const STATE_FILE = path.join(projectDir, ".claude", "state", "error-loop-tracker.json");
const WARNINGS_LOG = path.join(projectDir, ".claude", "state", "hook-warnings-log.jsonl");

// --- Normalization ---

/**
 * Normalize error text for fuzzy matching:
 * - Strip line:column numbers (e.g., :42:10 -> :0:0)
 * - Strip ISO timestamps (e.g., 2026-03-29T12:00:00.000Z)
 * - Strip Unix timestamps (10+ digit numbers)
 * - Strip temp file paths (/tmp/..., C:\Users\...\AppData\Local\Temp\...)
 * - Strip ANSI escape sequences
 */
function normalizeError(text) {
  if (typeof text !== "string") return "";
  let normalized = text;

  // Strip ANSI escape sequences
  /* eslint-disable no-control-regex */
  normalized = normalized.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
  /* eslint-enable no-control-regex */

  // Strip line:column numbers (e.g., :42:10, :123:)
  normalized = normalized.replace(/:\d+:\d+/g, ":0:0");

  // Strip ISO timestamps (e.g., 2026-03-29T12:00:00.000Z)
  normalized = normalized.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/g,
    "<TIMESTAMP>"
  );

  // Strip Unix timestamps (10+ digit numbers that look like epoch ms or s)
  normalized = normalized.replace(/\b\d{10,13}\b/g, "<EPOCH>");

  // Strip temp file paths (POSIX)
  normalized = normalized.replace(/\/tmp\/[^\s:]+/g, "<TMPFILE>");

  // Strip temp file paths (Windows)
  normalized = normalized.replace(
    /[A-Za-z]:\\(?:Users\\[^\\]+\\AppData\\Local\\)?Temp\\[^\s:]+/g,
    "<TMPFILE>"
  );

  return normalized;
}

/**
 * Hash normalized error text using SHA-256, first 12 chars.
 */
function hashError(normalizedText) {
  return crypto.createHash("sha256").update(normalizedText).digest("hex").slice(0, 12);
}

// --- State Management ---

/**
 * Read state from error-loop-tracker.json.
 * Returns empty state if file doesn't exist or is unreadable.
 */
function readState() {
  try {
    const content = fs.readFileSync(STATE_FILE, "utf8");
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.hashes)) {
      return parsed;
    }
    return { hashes: [] };
  } catch {
    return { hashes: [] };
  }
}

/**
 * Write state back to error-loop-tracker.json atomically.
 */
function writeState(state) {
  try {
    const dir = path.dirname(STATE_FILE);
    fs.mkdirSync(dir, { recursive: true });

    const absPath = path.resolve(STATE_FILE);
    if (!isSafeToWrite(absPath)) {
      console.error("loop-detector: refusing to write — symlink detected on state file");
      return;
    }
    const tmpPath = `${absPath}.tmp`;
    if (!isSafeToWrite(tmpPath)) {
      console.error("loop-detector: refusing to write — symlink detected on tmp file");
      return;
    }

    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
    try {
      fs.rmSync(absPath, { force: true });
    } catch {
      // best-effort; destination may not exist
    }
    fs.renameSync(tmpPath, absPath);
  } catch (err) {
    console.error(`loop-detector: failed to write state: ${sanitizeError(err)}`);
    // Clean up tmp file on failure
    try {
      fs.rmSync(`${path.resolve(STATE_FILE)}.tmp`, { force: true });
    } catch {
      // cleanup failure is non-critical
    }
  }
}

/**
 * Expire entries older than the rolling window (20 minutes).
 */
function expireOldEntries(state) {
  const cutoff = Date.now() - WINDOW_MS;
  state.hashes = state.hashes.filter((entry) => {
    const lastSeen = new Date(entry.lastSeen).getTime();
    return Number.isFinite(lastSeen) && lastSeen > cutoff;
  });
}

// --- Warning Output ---

/**
 * Append warning to hook-warnings-log.jsonl (per D13).
 */
function appendWarningLog(command, hash, count) {
  try {
    const dir = path.dirname(WARNINGS_LOG);
    fs.mkdirSync(dir, { recursive: true });

    const absPath = path.resolve(WARNINGS_LOG);
    if (!isSafeToWrite(absPath)) return;

    const entry = {
      timestamp: new Date().toISOString(),
      hook: "loop-detector",
      type: "error-loop",
      severity: "warning",
      message: `Loop detected: same error ${count}+ times in 20 min for '${command}'`,
      errorHash: hash,
      count: count,
      actor: "hook-system",
      user: "redacted",
      outcome: "warned",
    };

    safeAppendFileSync(absPath, JSON.stringify(entry) + "\n");
  } catch {
    // Best-effort — never block hooks on log failure
  }
}

// --- Main ---

function main() {
  let input = "";

  process.stdin.setEncoding("utf8");

  process.stdin.on("error", () => {
    // Transport errors should not block — exit silently
    process.exit(0);
  });

  process.stdin.on("data", (chunk) => {
    input += chunk;
    // Fail-open on unexpectedly large payloads (avoid memory blowups)
    if (input.length > 1024 * 1024) {
      process.exit(0);
    }
  });

  process.stdin.on("end", () => {
    try {
      const data = JSON.parse(input);
      const command = (data.tool_input && data.tool_input.command) || "";
      const error = data.error || (data.tool_input && data.tool_input.error) || "";

      // Need at least some error text to track
      if (!error) {
        process.exit(0);
      }

      // Normalize and hash the error
      const normalized = normalizeError(error);
      const hash = hashError(normalized);

      // Read current state
      const state = readState();

      // Expire old entries first
      expireOldEntries(state);

      // Find existing entry for this hash
      const now = new Date().toISOString();
      const existing = state.hashes.find((entry) => entry.hash === hash);

      if (existing) {
        // Update existing entry
        existing.count += 1;
        existing.lastSeen = now;
        existing.command = command; // Keep latest command text

        // Check if we hit the threshold
        if (existing.count >= TRIGGER_COUNT) {
          // Truncate command for display (max 60 chars)
          const displayCmd = command.length > 60 ? command.slice(0, 57) + "..." : command;

          // Output warning to stdout (description for Claude to read)
          console.log(
            `Loop detected: same error ${existing.count} times in 20 min for '${displayCmd}'. ` +
              `Try a different approach -- the current fix strategy isn't working.`
          );

          // Append to JSONL audit trail (per D13)
          appendWarningLog(displayCmd, hash, existing.count);
        }
      } else {
        // New hash — add to the rolling window
        state.hashes.push({
          hash: hash,
          count: 1,
          command: command,
          firstSeen: now,
          lastSeen: now,
        });
      }

      // Write updated state
      writeState(state);

      // Always exit 0 — warn, never block
      process.exit(0);
    } catch (err) {
      // Must never crash — log and exit clean
      console.error(`loop-detector: ${sanitizeError(err)}`);
      process.exit(0);
    }
  });
}

// Wrap entire execution in try/catch as final safety net
try {
  main();
} catch (err) {
  console.error(`loop-detector: fatal: ${sanitizeError(err)}`);
  process.exit(0);
}
