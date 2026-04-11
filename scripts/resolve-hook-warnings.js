#!/usr/bin/env node
/* global __dirname */
/**
 * Resolve Hook Warnings
 *
 * Checks whether warning conditions are still active and marks resolved ones.
 * Runs during session-start after warning regeneration, before surfacing.
 *
 * Each warning type can have a resolve check — a function that returns true
 * if the condition that triggered the warning has been resolved.
 *
 * Resolved warnings get { resolved: true, resolvedAt: ISO } appended to the
 * JSONL log and are excluded from the regenerated view.
 *
 * Usage:
 *   node scripts/resolve-hook-warnings.js [--verbose] [--dry-run]
 *
 * @version 1.0.0
 * @created 2026-04-02
 */

let fs, path, execFileSync;
try {
  fs = require("node:fs");
  path = require("node:path");
  ({ execFileSync } = require("node:child_process"));
} catch (e) {
  console.error(
    "Failed to load required modules:",
    e instanceof Error ? e.constructor.name : typeof e
  );
  process.exit(1);
}

// Safe-fs wrappers
let safeWriteFileSync, safeRenameSync;
try {
  ({ safeWriteFileSync, safeRenameSync } = require("./lib/safe-fs"));
} catch {
  console.error("safe-fs unavailable; refusing to write");
  process.exit(1);
}

// Symlink guard
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require(
    path.join(__dirname, "..", ".claude", "hooks", "lib", "symlink-guard")
  ));
} catch {
  console.error("symlink-guard unavailable; disabling writes");
  isSafeToWrite = () => false;
}

// Error sanitization
let sanitizeError;
try {
  ({ sanitizeError } = require("./lib/security-helpers"));
} catch {
  sanitizeError = (e) => (e instanceof Error ? e.constructor.name : "unknown error");
}

const { safeParseLine } = require("./lib/parse-jsonl-line");

const ROOT_DIR = path.join(__dirname, "..");
const LOG_PATH = path.join(ROOT_DIR, ".claude", "state", "hook-warnings-log.jsonl");
const ACK_PATH = path.join(ROOT_DIR, ".claude", "state", "hook-warnings-ack.json");

const args = new Set(process.argv.slice(2));
const VERBOSE = args.has("--verbose");
const DRY_RUN = args.has("--dry-run");

/**
 * Resolve check functions.
 * Each returns true if the warning condition is RESOLVED (no longer active).
 * Must be safe — catch all errors internally, return false on failure.
 */
const RESOLVE_CHECKS = {
  "pr-creep": () => {
    try {
      // Find merge-base with main/master
      let defaultBranch = "main";
      try {
        execFileSync("git", ["rev-parse", "--verify", "main"], {
          cwd: ROOT_DIR,
          stdio: "pipe",
        });
      } catch {
        try {
          execFileSync("git", ["rev-parse", "--verify", "master"], {
            cwd: ROOT_DIR,
            stdio: "pipe",
          });
          defaultBranch = "master";
        } catch {
          return false; // Can't determine default branch
        }
      }

      const currentBranch = execFileSync("git", ["branch", "--show-current"], {
        cwd: ROOT_DIR,
        stdio: "pipe",
        encoding: "utf8",
      }).trim();

      // If we're ON the default branch, pr-creep is resolved
      if (currentBranch === defaultBranch) return true;

      const mergeBase = execFileSync("git", ["merge-base", defaultBranch, "HEAD"], {
        cwd: ROOT_DIR,
        stdio: "pipe",
        encoding: "utf8",
      }).trim();

      const countStr = execFileSync("git", ["rev-list", "--count", `${mergeBase}..HEAD`], {
        cwd: ROOT_DIR,
        stdio: "pipe",
        encoding: "utf8",
      }).trim();

      const count = Number.parseInt(countStr, 10);
      // Resolved if below the warning threshold (10)
      return !Number.isNaN(count) && count < 10;
    } catch {
      return false;
    }
  },

  "session-end-missing": () => {
    // Always resolves at next session-start — the session is starting now
    return true;
  },

  "network-error": () => {
    try {
      execFileSync("npm", ["ping"], {
        cwd: ROOT_DIR,
        stdio: "pipe",
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  },

  "cli-tools-missing": () => {
    try {
      // Extract tool names from the most recent warning message
      // Format: "CLI tools missing: rg, fd"
      // Just check if rg is available since that's the recurring one
      execFileSync("rg", ["--version"], {
        cwd: ROOT_DIR,
        stdio: "pipe",
        timeout: 3000,
      });
      return true;
    } catch {
      return false; // Still missing
    }
  },
};

/**
 * Read JSONL log entries safely
 */
function readLogEntries() {
  try {
    const st = fs.lstatSync(LOG_PATH);
    if (st.isSymbolicLink()) {
      console.error("hook-warnings-log.jsonl is a symlink — aborting");
      return [];
    }
    if (st.size > 2 * 1024 * 1024) {
      console.error("hook-warnings-log.jsonl exceeds 2MB — aborting");
      return [];
    }
    const content = fs.readFileSync(LOG_PATH, "utf8");
    const entries = [];
    for (const rawLine of content.split("\n")) {
      if (!rawLine.trim()) continue;
      const parsed = safeParseLine(rawLine);
      if (parsed) entries.push(parsed);
      else entries.push({ _raw: rawLine, _malformed: true });
    }
    return entries;
  } catch {
    return [];
  }
}

/**
 * Write JSONL log atomically
 */
function writeLogEntries(entries) {
  const tmpPath = `${LOG_PATH}.tmp`;
  try {
    if (!isSafeToWrite(LOG_PATH) || !isSafeToWrite(tmpPath)) return false;
    const content =
      entries.map((e) => (e._malformed ? e._raw : JSON.stringify(e))).join("\n") + "\n";
    safeWriteFileSync(tmpPath, content);
    try {
      fs.rmSync(LOG_PATH, { force: true });
    } catch {
      // ignore
    }
    safeRenameSync(tmpPath, LOG_PATH);
    return true;
  } catch (e) {
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      // ignore
    }
    console.error("Failed to write log:", sanitizeError(e));
    return false;
  }
}

/**
 * Find unique active (unresolved) warning types from log entries.
 * @param {Array} entries - Parsed JSONL log entries
 * @returns {Set<string>} Set of active warning type strings
 */
function findActiveWarningTypes(entries) {
  const activeTypes = new Set();
  for (const entry of entries) {
    if (entry._malformed || entry.resolved) continue;
    if (entry.type) activeTypes.add(entry.type);
  }
  return activeTypes;
}

/**
 * Run resolve checks against active warning types.
 * @param {Set<string>} activeTypes - Set of active warning types to check
 * @returns {Set<string>} Set of type strings whose conditions are now resolved
 */
function logResolveResult(type, status, error) {
  if (!VERBOSE) return;
  if (status === "skip") console.log(`  ${type}: no resolve check — skipping`);
  else if (status === "resolved") console.log(`  ${type}: RESOLVED`);
  else if (status === "active") console.log(`  ${type}: still active`);
  else if (status === "error") console.log(`  ${type}: check failed — ${sanitizeError(error)}`);
}

function runResolveChecks(activeTypes) {
  const resolvedTypes = new Set();
  for (const type of activeTypes) {
    const check = RESOLVE_CHECKS[type];
    if (!check) {
      logResolveResult(type, "skip");
      continue;
    }
    try {
      if (check()) {
        resolvedTypes.add(type);
        logResolveResult(type, "resolved");
      } else {
        logResolveResult(type, "active");
      }
    } catch (e) {
      logResolveResult(type, "error", e);
    }
  }
  return resolvedTypes;
}

/**
 * Mark matching entries as resolved with a timestamp.
 * Mutates entries in place.
 * @param {Array} entries - Parsed JSONL log entries
 * @param {Set<string>} resolvedTypes - Types to mark resolved
 * @param {string} timestamp - ISO timestamp for resolvedAt
 * @returns {number} Count of entries marked resolved
 */
function markResolvedEntries(entries, resolvedTypes, timestamp) {
  let resolvedCount = 0;
  for (const entry of entries) {
    if (entry._malformed || entry.resolved) continue;
    if (resolvedTypes.has(entry.type)) {
      entry.resolved = true;
      entry.resolvedAt = timestamp;
      resolvedCount++;
    }
  }
  return resolvedCount;
}

/**
 * Main: resolve stale warnings
 */
function main() {
  const entries = readLogEntries();
  if (entries.length === 0) {
    if (VERBOSE) console.log("No log entries to check");
    return;
  }

  const activeTypes = findActiveWarningTypes(entries);

  if (VERBOSE) {
    console.log(`Active warning types: ${[...activeTypes].join(", ") || "none"}`);
  }

  const resolvedTypes = runResolveChecks(activeTypes);

  if (resolvedTypes.size === 0) {
    if (VERBOSE) console.log("No warnings resolved");
    return;
  }

  const now = new Date().toISOString();
  const resolvedCount = markResolvedEntries(entries, resolvedTypes, now);

  if (DRY_RUN) {
    console.log(
      `[dry-run] Would resolve ${resolvedCount} entries for types: ${[...resolvedTypes].join(", ")}`
    );
    return;
  }

  // Write updated log
  if (writeLogEntries(entries)) {
    console.log(`Resolved ${resolvedCount} warning(s): ${[...resolvedTypes].join(", ")}`);
  }
}

main();
