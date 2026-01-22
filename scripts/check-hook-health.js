#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename */
/**
 * check-hook-health.js - Hook Health and Session State Monitor
 *
 * Checks overall hook health and session state:
 * 1. Verifies all hooks are syntactically correct
 * 2. Checks session state for cross-validation warnings
 * 3. Reports hook usage statistics (if available)
 *
 * Used by: session-begin, session-end, and manual checks
 * Run with: npm run hooks:health
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Get and validate project directory (prevent arbitrary file write)
const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;
const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Security: Ensure projectDir is within baseDir using path.relative()
const baseRel = path.relative(safeBaseDir, projectDir);
if (baseRel.startsWith(".." + path.sep) || baseRel === ".." || path.isAbsolute(baseRel)) {
  // Path traversal attempt - use safe default
  console.error("Warning: Invalid project directory, using current directory");
  process.exit(1);
}

const hooksDir = path.join(projectDir, ".claude", "hooks");
const stateFile = path.join(hooksDir, ".session-state.json");

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Read session state from file
 * @returns {Object|null} Session state or null if not found
 */
function readSessionState() {
  try {
    // Skip existsSync to avoid race condition - just try to read
    return JSON.parse(fs.readFileSync(stateFile, "utf8"));
  } catch {
    // File doesn't exist or can't be read - return null
  }
  return null;
}

/**
 * Write session state to file
 * @param {Object} state - State to write
 */
function writeSessionState(state) {
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  } catch {
    // Ignore errors
  }
}

/**
 * Update session state for begin/end events
 * @param {string} event - 'begin' or 'end'
 * @param {string|null} sessionId - Optional session identifier
 */
function updateSessionState(event, sessionId = null) {
  const currentState = readSessionState() || {};
  const now = new Date().toISOString();

  if (event === "begin") {
    currentState.lastBegin = now;
    currentState.lastBeginSession = sessionId;
    currentState.beginCount = (currentState.beginCount || 0) + 1;
  } else if (event === "end") {
    currentState.lastEnd = now;
    currentState.lastEndSession = sessionId;
    currentState.endCount = (currentState.endCount || 0) + 1;
  }

  writeSessionState(currentState);
  return currentState;
}

/**
 * Check for missing session-end from previous session
 * @returns {Object} Check result with warning if applicable
 */
function checkPreviousSessionEnd() {
  const state = readSessionState();
  if (!state) {
    return { warning: false, message: "No previous session state found" };
  }

  const lastBegin = state.lastBegin ? new Date(state.lastBegin) : null;
  const lastEnd = state.lastEnd ? new Date(state.lastEnd) : null;

  // If we have a begin but no end after it, warn
  if (lastBegin && (!lastEnd || lastEnd < lastBegin)) {
    const hoursAgo = Math.round((Date.now() - lastBegin.getTime()) / (1000 * 60 * 60));
    return {
      warning: true,
      message: `Previous session started ${hoursAgo}h ago without session-end`,
      lastBegin: state.lastBegin,
      lastEnd: state.lastEnd,
    };
  }

  return { warning: false, message: "Previous session completed normally" };
}

/**
 * Check for missing session-begin
 * @returns {Object} Check result
 */
function checkSessionBegin() {
  const state = readSessionState();
  if (!state) {
    return { warning: false, message: "No previous session state found" };
  }

  const lastBegin = state.lastBegin ? new Date(state.lastBegin) : null;
  const lastEnd = state.lastEnd ? new Date(state.lastEnd) : null;

  // If we have an end but begin was much earlier or missing
  if (lastEnd && lastBegin) {
    const timeDiff = lastEnd.getTime() - lastBegin.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // If more than 24 hours between begin and end, that's unusual
    if (hoursDiff > 24) {
      return {
        warning: true,
        message: `Session lasted ${Math.round(hoursDiff)}h - session-begin might have been skipped`,
      };
    }
  }

  return { warning: false, message: "Session timing looks normal" };
}

/**
 * Validate hook syntax
 * @returns {Array} Array of validation results
 */
function validateHooks() {
  const results = [];

  try {
    const hookFiles = fs.readdirSync(hooksDir).filter((f) => f.endsWith(".js"));

    for (const file of hookFiles) {
      // Security: Validate filename doesn't contain path traversal
      if (file.includes("/") || file.includes("\\") || file.includes("..")) {
        continue;
      }
      const hookPath = path.join(hooksDir, file);
      try {
        execFileSync("node", ["--check", hookPath], { stdio: "pipe" });
        results.push({ file, valid: true });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.push({ file, valid: false, error: errorMsg });
      }
    }
  } catch {
    // Ignore errors
  }

  return results;
}

/**
 * Get hook statistics
 * @returns {Object} Statistics about hooks
 */
function getHookStats() {
  const state = readSessionState() || {};
  return {
    totalSessions: state.beginCount || 0,
    completedSessions: state.endCount || 0,
    lastBegin: state.lastBegin,
    lastEnd: state.lastEnd,
  };
}

/**
 * Main health check
 * @param {Object} options - Options for the check
 */
function runHealthCheck(options = {}) {
  const { quiet = false, updateState = null, sessionId = null } = options;

  if (!quiet) {
    log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "blue");
    log("  🏥 HOOK HEALTH CHECK", "blue");
    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "blue");
  }

  // Update state if requested
  if (updateState) {
    updateSessionState(updateState, sessionId);
  }

  // 1. Check hook syntax
  if (!quiet) log("📄 Hook Syntax Validation:", "yellow");
  const hookResults = validateHooks();
  const invalidHooks = hookResults.filter((r) => !r.valid);

  if (!quiet) {
    if (invalidHooks.length === 0) {
      log(`  ✓ All ${hookResults.length} hooks valid`, "green");
    } else {
      log(`  ✗ ${invalidHooks.length}/${hookResults.length} hooks have errors:`, "red");
      for (const h of invalidHooks) {
        log(`    - ${h.file}`, "red");
      }
    }
    log("");
  }

  // 2. Check session state
  if (!quiet) log("📊 Session State:", "yellow");
  const sessionCheck = checkPreviousSessionEnd();
  const beginCheck = checkSessionBegin();

  if (!quiet) {
    if (sessionCheck.warning) {
      log(`  ⚠️  ${sessionCheck.message}`, "yellow");
    } else {
      log(`  ✓ ${sessionCheck.message}`, "green");
    }

    if (beginCheck.warning) {
      log(`  ⚠️  ${beginCheck.message}`, "yellow");
    }
    log("");
  }

  // 3. Show statistics
  if (!quiet) {
    log("📈 Statistics:", "yellow");
    const stats = getHookStats();
    log(`  Total sessions started: ${stats.totalSessions}`);
    log(`  Sessions completed:     ${stats.completedSessions}`);
    if (stats.lastBegin) {
      log(`  Last session begin:     ${stats.lastBegin}`, "gray");
    }
    if (stats.lastEnd) {
      log(`  Last session end:       ${stats.lastEnd}`, "gray");
    }
    log("");
  }

  // Return summary for programmatic use
  return {
    hooksValid: invalidHooks.length === 0,
    invalidHooks,
    sessionWarning: sessionCheck.warning,
    beginWarning: beginCheck.warning,
    stats: getHookStats(),
  };
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--begin")) {
    runHealthCheck({ updateState: "begin", sessionId: args[args.indexOf("--begin") + 1] });
  } else if (args.includes("--end")) {
    runHealthCheck({ updateState: "end", sessionId: args[args.indexOf("--end") + 1] });
  } else if (args.includes("--quiet")) {
    const result = runHealthCheck({ quiet: true });
    process.exit(result.hooksValid ? 0 : 1);
  } else {
    const result = runHealthCheck();
    // Exit non-zero if hooks are invalid (for CI integration)
    process.exit(result.hooksValid ? 0 : 1);
  }
}

module.exports = {
  runHealthCheck,
  readSessionState,
  writeSessionState,
  updateSessionState,
  checkPreviousSessionEnd,
  checkSessionBegin,
  validateHooks,
  getHookStats,
};
