/* eslint-disable */
/**
 * Shared git utilities for hooks.
 * Extracted from commit-tracker.js, post-read-handler.js, pre-compaction-save.js
 */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Resolve and validate project directory with containment check.
 * Accepts CLAUDE_PROJECT_DIR if it resolves to cwd, a descendant of cwd,
 * or an ancestor of cwd (monorepo root pointing to workspace).
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
    // Containment: allow resolved to be cwd/descendant OR an ancestor of cwd
    const resolvedInsideCwd = a === b || a.startsWith(b + path.sep);
    const cwdInsideResolved = b.startsWith(a + path.sep);
    if (resolvedInsideCwd || cwdInsideResolved) {
      // Depth limit: reject ancestors more than 10 levels up (defense-in-depth)
      if (cwdInsideResolved && !resolvedInsideCwd) {
        const depth = b.slice(a.length).split(path.sep).filter(Boolean).length;
        if (depth > 10) return fallback;
      }
      return resolved;
    }
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
    const out = execFileSync("git", args, {
      cwd: opts.cwd || projectDir,
      encoding: "utf8",
      timeout: opts.timeout || 5000,
    });
    const shouldTrim = opts.trim !== false && !out.includes("\0");
    return shouldTrim ? out.trim() : out;
  } catch {
    return "";
  }
}

module.exports = { gitExec, projectDir };
