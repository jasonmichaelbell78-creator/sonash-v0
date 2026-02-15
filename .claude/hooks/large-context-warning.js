#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * large-context-warning.js - PostToolUse hook for context size warnings
 *
 * Warns when operations might cause context bloat.
 * Tracks file reads and warns when thresholds are exceeded.
 *
 * From HOOKIFY_STRATEGY.md #14: Large Context Warning
 * - Trigger: Single read >5000 lines OR 15+ files read in session
 * - Action: WARN (informational)
 * - Time Cost: +20ms per Read/Glob
 */

const fs = require("node:fs");
const path = require("node:path");

// Configuration
const SINGLE_FILE_LINE_LIMIT = 5000;
const SESSION_FILE_LIMIT = 15;
const STATE_FILE = ".claude/hooks/.context-tracking-state.json";

// Get and validate project directory
const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;
const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Security: Ensure projectDir is within baseDir
const baseRel = path.relative(safeBaseDir, projectDir);
if (baseRel.startsWith(".." + path.sep) || baseRel === ".." || path.isAbsolute(baseRel)) {
  console.log("ok");
  process.exit(0);
}

// Parse arguments
const arg = process.argv[2] || "";
if (!arg) {
  console.log("ok");
  process.exit(0);
}

// Extract file_path from JSON
let filePath = "";
let limit = 0;
try {
  const parsed = JSON.parse(arg);
  filePath = parsed.file_path || parsed.path || "";
  limit = parsed.limit || 0;
} catch {
  filePath = arg;
}

if (!filePath) {
  console.log("ok");
  process.exit(0);
}

// Security validations
if (filePath.startsWith("-")) {
  console.log("ok");
  process.exit(0);
}

if (filePath.includes("\n") || filePath.includes("\r")) {
  console.log("ok");
  process.exit(0);
}

// Normalize backslashes
filePath = filePath.replace(/\\/g, "/");

// Block absolute paths (cross-platform) and traversal
if (path.isAbsolute(filePath) || /^[A-Za-z]:/.test(filePath)) {
  console.log("ok");
  process.exit(0);
}
// Use regex for ".." detection (handles .., ../, ..\ edge cases)
if (filePath.includes("/../") || /^\.\.(?:[\\/]|$)/.test(filePath) || filePath.endsWith("/..")) {
  console.log("ok");
  process.exit(0);
}

// Change to project directory
process.chdir(projectDir);

// State management for tracking file reads
const stateFilePath = path.resolve(projectDir, STATE_FILE);
let state = { filesRead: [], lastReset: Date.now(), warningShown: false };

// Load existing state (skip existsSync to avoid race condition)
try {
  const stateContent = fs.readFileSync(stateFilePath, "utf8");
  state = JSON.parse(stateContent);

  // Reset state if older than 30 minutes (new session)
  const thirtyMinutes = 30 * 60 * 1000;
  if (Date.now() - state.lastReset > thirtyMinutes) {
    state = { filesRead: [], lastReset: Date.now(), warningShown: false };
  }
} catch {
  // File doesn't exist or can't be read - use default state
}

// Track this file read
if (!state.filesRead.includes(filePath)) {
  state.filesRead.push(filePath);
}

// Save state
try {
  const hooksDir = path.dirname(stateFilePath);
  fs.mkdirSync(hooksDir, { recursive: true });
  const tmpPath = `${stateFilePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
  try {
    fs.rmSync(stateFilePath, { force: true });
  } catch {
    // best-effort; destination may not exist
  }
  fs.renameSync(tmpPath, stateFilePath);
} catch (err) {
  console.warn(
    `large-context-warning: failed to save state: ${err instanceof Error ? err.message : String(err)}`
  );
  try {
    fs.rmSync(`${stateFilePath}.tmp`, { force: true });
  } catch {
    // cleanup failure is non-critical
  }
}

// Resolve full path for line counting
const fullPath = path.resolve(projectDir, filePath);

// Estimate line count from file size (avoids reading entire file into memory)
let lineCount = 0;
try {
  const stat = fs.statSync(fullPath);
  lineCount = Math.ceil(stat.size / 80); // Estimate ~80 bytes per line
} catch {
  // File doesn't exist or can't be stat'd - lineCount stays 0
}

// Determine warnings
const warnings = [];

// Check single file line limit (only warn if not using pagination)
if (lineCount > SINGLE_FILE_LINE_LIMIT && !limit) {
  warnings.push({
    type: "large_file",
    message: `File has ${lineCount} lines (>${SINGLE_FILE_LINE_LIMIT})`,
    suggestion: "Consider using offset/limit parameters for large files",
  });
}

// Check session file count
if (state.filesRead.length >= SESSION_FILE_LIMIT && !state.warningShown) {
  warnings.push({
    type: "many_files",
    message: `${state.filesRead.length} files read this session (>=${SESSION_FILE_LIMIT})`,
    suggestion: "Consider using /save-context to preserve important context to MCP memory",
  });
  state.warningShown = true;

  // Update state with warning shown flag
  try {
    const tmpPath = `${stateFilePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
    try {
      fs.rmSync(stateFilePath, { force: true });
    } catch {
      // best-effort; destination may not exist
    }
    fs.renameSync(tmpPath, stateFilePath);
  } catch (err) {
    console.warn(
      `large-context-warning: failed to update state: ${err instanceof Error ? err.message : String(err)}`
    );
    try {
      fs.rmSync(`${stateFilePath}.tmp`, { force: true });
    } catch {
      // cleanup failure is non-critical
    }
  }
}

// Output warnings
if (warnings.length > 0) {
  console.error("");
  console.error("\u26a0\ufe0f  LARGE CONTEXT WARNING");
  console.error("\u2501".repeat(28));

  for (const warning of warnings) {
    console.error(`${warning.message}`);
    console.error(`  \u2192 ${warning.suggestion}`);
  }

  console.error("");
  console.error("Tip: Use /save-context to save to MCP memory before compaction");
  console.error("\u2501".repeat(28));
}

// Always succeed
console.log("ok");
process.exit(0);
