/* eslint-disable */
/**
 * Shared git utilities for hooks.
 * Extracted from commit-tracker.js, post-read-handler.js, pre-compaction-save.js
 */
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const projectDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());

/**
 * Execute a git command and return trimmed stdout, or "" on error.
 * @param {string[]} args - git command arguments
 * @param {object} [opts] - optional overrides (cwd, timeout)
 * @returns {string}
 */
function gitExec(args, opts = {}) {
  try {
    return execFileSync("git", args, {
      cwd: opts.cwd || projectDir,
      encoding: "utf8",
      timeout: opts.timeout || 5000,
    }).trim();
  } catch {
    return "";
  }
}

module.exports = { gitExec, projectDir };
