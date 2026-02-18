/* eslint-disable */
/**
 * Shared git utilities for hooks.
 * Extracted from commit-tracker.js, post-read-handler.js, pre-compaction-save.js
 */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Resolve and validate project directory with descendant containment.
 * Only accepts CLAUDE_PROJECT_DIR if it resolves to cwd or a descendant of cwd.
 * Falls back to cwd() if invalid, unreachable, or escapes expected bounds.
 */
function resolveProjectDir() {
  const fallback = process.cwd();
  const envDir = process.env.CLAUDE_PROJECT_DIR;
  if (!envDir || typeof envDir !== "string") return fallback;
  try {
    const resolved = fs.realpathSync(path.resolve(envDir));
    const cwd = fs.realpathSync(fallback);
    const norm = (p) => (process.platform === "win32" ? p.toLowerCase() : p);
    const a = norm(resolved);
    const b = norm(cwd);
    // Descendant-only: resolved must be cwd itself or under cwd
    if (a === b || a.startsWith(b + path.sep)) return resolved;
    return fallback;
  } catch {
    return fallback;
  }
}

const projectDir = resolveProjectDir();

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
