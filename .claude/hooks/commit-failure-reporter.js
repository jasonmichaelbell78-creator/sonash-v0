#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * commit-failure-reporter.js - PostToolUse hook (Bash)
 *
 * When a `git commit` command fails (exit code != 0), reads
 * .git/hook-output.log and surfaces the pre-commit hook output
 * that would otherwise be invisible in CI/agent contexts.
 *
 * Fast bail-out (~1ms) for non-commit commands.
 */

const fs = require("node:fs");
const path = require("node:path");

const LOG_FILE = path.join(process.cwd(), ".git", "hook-output.log");
const MAX_AGE_MS = 60000;

/**
 * Parse the hook arguments to extract command and exit code.
 * Returns null if arguments are missing or unparseable.
 */
function parseArgs() {
  const arg = process.argv[2] || "";
  if (!arg) return null;

  try {
    const parsed = JSON.parse(arg);
    const rawExitCode =
      parsed.exit_code ?? (parsed.tool_output && parsed.tool_output.exit_code) ?? 0;
    const exitCode = Number(rawExitCode);
    return {
      command: typeof parsed.command === "string" ? parsed.command : "",
      exitCode: Number.isFinite(exitCode) ? exitCode : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Read the hook output log if it exists, is fresh, and has content.
 * Returns the log content string or null.
 */
function readFreshLog() {
  try {
    const stats = fs.statSync(LOG_FILE);
    if (stats.size === 0 || Date.now() - stats.mtimeMs > MAX_AGE_MS) return null;

    const content = fs.readFileSync(LOG_FILE, "utf8").trim();
    return content || null;
  } catch (err) {
    if (err.code === "ENOENT") return null;
    return null;
  }
}

/**
 * Determine if log content indicates a hook failure.
 * Returns true if the log shows failure evidence.
 */
function logShowsFailure(content) {
  const hookPassed = /All pre-commit checks passed/.test(content);
  if (hookPassed) return false;
  // \u274C = ❌ — every failure path in the pre-commit hook prints this
  return content.includes("\u274C");
}

function main() {
  const args = parseArgs();
  if (!args || !/\bgit\b.*\bcommit\b/.test(args.command)) {
    console.log("ok");
    return;
  }

  const content = readFreshLog();
  if (!content) {
    console.log("ok");
    return;
  }

  // If exit code says success AND log has no failure evidence, skip
  if (args.exitCode === 0 && !logShowsFailure(content)) {
    console.log("ok");
    return;
  }

  console.log("Pre-commit hook failed. Output from .git/hook-output.log:");
  console.log("---");
  console.log(content);
  console.log("---");
}

main();
