#!/usr/bin/env node
/* global require, module, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * state-utils.js - Shared utilities for .claude/state/ file-based persistence
 *
 * Provides atomic read/write for task state files that survive compaction.
 * Used by: auto-save-context.js, handoff hook, agent-trigger-enforcer.js,
 *          pre-commit-fixer skill, delegated code review pipeline.
 *
 * Convention:
 *   - Task state: .claude/state/task-{name}.state.json
 *   - Handoff:    .claude/state/handoff.json
 *   - Reviews:    .claude/state/pending-reviews.json
 *
 * Session #133: Part of QoL improvement #2 (file-based state persistence)
 */

const fs = require("node:fs");
const path = require("node:path");

const STATE_DIR = ".claude/state";

/**
 * Validate filename is a simple basename (no path traversal).
 * Rejects: ../foo, sub/dir/foo, absolute paths, empty strings.
 */
function validateFilename(filename) {
  if (typeof filename !== "string" || !filename) return false;
  // Must be a simple basename - no directory separators or traversal
  if (path.basename(filename) !== filename) return false;
  if (/^\.\.(?:[\\/]|$)/.test(filename)) return false;
  return true;
}

/**
 * Get the resolved state directory path
 */
function getStateDir(projectDir) {
  const dir = path.join(projectDir, STATE_DIR);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    // mkdirSync with recursive:true only throws on real errors (not EEXIST)
    console.warn(
      `state-utils: failed to create state dir: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  return fs.existsSync(dir) ? dir : null;
}

/**
 * Read a state file. Returns null if not found or invalid.
 */
function readState(projectDir, filename) {
  if (!validateFilename(filename)) return null;
  const dir = getStateDir(projectDir);
  if (!dir) return null;
  const filePath = path.join(dir, filename);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Write a state file atomically (temp file + rename).
 * Returns true on success, false on failure.
 */
function writeState(projectDir, filename, data) {
  if (!validateFilename(filename)) return false;
  const dir = getStateDir(projectDir);
  if (!dir) return false;
  const filePath = path.join(dir, filename);
  const tmpPath = `${filePath}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    try {
      fs.rmSync(filePath, { force: true });
    } catch {
      // best-effort; destination may not exist
    }
    fs.renameSync(tmpPath, filePath);
    return true;
  } catch (err) {
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      // cleanup failure is non-critical
    }
    console.error(
      `Warning: Could not write state ${filename}: ${err instanceof Error ? err.message : String(err)}`
    );
    return false;
  }
}

/**
 * Delete a state file. Returns true on success, false if not found.
 */
function deleteState(projectDir, filename) {
  if (!validateFilename(filename)) return false;
  const dir = getStateDir(projectDir);
  if (!dir) return false;
  const filePath = path.join(dir, filename);
  try {
    fs.rmSync(filePath, { force: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * List all state files matching a pattern.
 */
function listStates(projectDir, prefix) {
  const dir = getStateDir(projectDir);
  if (!dir) return [];
  try {
    const files = fs.readdirSync(dir);
    if (prefix) {
      return files.filter((f) => f.startsWith(prefix));
    }
    return files.filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
}

/**
 * Create or update a task state file.
 *
 * @param {string} projectDir - Project root
 * @param {string} taskName - Short task identifier (e.g., "sonarcloud-sprint")
 * @param {object} update - Fields to merge into existing state
 * @returns {object} The updated state
 *
 * Schema:
 * {
 *   task: string,
 *   started: ISO datetime,
 *   lastUpdated: ISO datetime,
 *   steps: [{ name: string, status: "pending"|"in_progress"|"completed"|"failed", output?: string }],
 *   context: { branch?: string, files_modified?: string[], notes?: string }
 * }
 */
function updateTaskState(projectDir, taskName, update) {
  const filename = `task-${taskName}.state.json`;
  const existing = readState(projectDir, filename) || {
    task: taskName,
    started: new Date().toISOString(),
    steps: [],
    context: {},
  };

  // Merge updates
  const merged = {
    ...existing,
    ...update,
    lastUpdated: new Date().toISOString(),
  };

  // Append new steps to existing (prevent data loss from overwrite)
  if (update.steps && Array.isArray(update.steps)) {
    merged.steps = (existing.steps || []).concat(update.steps);
  }
  if (update.context) {
    merged.context = { ...existing.context, ...update.context };
  }

  writeState(projectDir, filename, merged);
  return merged;
}

/**
 * Write a handoff file for compaction recovery.
 *
 * @param {string} projectDir - Project root
 * @param {object} handoff - Handoff data
 *
 * Schema:
 * {
 *   timestamp: ISO datetime,
 *   branch: string,
 *   lastCommit: string,
 *   currentTask: string,
 *   completedSteps: string[],
 *   pendingSteps: string[],
 *   filesModified: string[],
 *   notes: string,
 *   todoSnapshot: object[]
 * }
 */
function writeHandoff(projectDir, handoff) {
  const data = {
    ...handoff,
    timestamp: new Date().toISOString(),
  };
  return writeState(projectDir, "handoff.json", data);
}

/**
 * Read the handoff file. Returns null if none exists.
 */
function readHandoff(projectDir) {
  return readState(projectDir, "handoff.json");
}

module.exports = {
  getStateDir,
  validateFilename,
  readState,
  writeState,
  deleteState,
  listStates,
  updateTaskState,
  writeHandoff,
  readHandoff,
};
