#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * check-remote-session-context.js - SessionStart hook
 *
 * Checks remote branches for more recent SESSION_CONTEXT.md updates.
 * Solves the problem where session-end commits sit in unmerged feature branches.
 *
 * Session #101: Ensures session context is not lost between branches
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { isSafeToWrite } = require("./lib/symlink-guard");

// Fetch TTL cache (path resolved after projectDir is defined below)
let FETCH_CACHE_FILE;
const FETCH_TTL_MS = 5 * 60 * 1000; // 5 minutes

function shouldFetch() {
  if (!FETCH_CACHE_FILE) return true;
  try {
    const data = JSON.parse(fs.readFileSync(FETCH_CACHE_FILE, "utf8"));
    const lastFetch = Number(data?.lastFetch);
    const ageMs = Date.now() - lastFetch;
    if (Number.isFinite(lastFetch) && ageMs >= 0 && ageMs < FETCH_TTL_MS) return false;
  } catch {
    /* no cache or invalid */
  }
  return true;
}

function updateFetchCache() {
  if (!FETCH_CACHE_FILE) return;
  // Atomic write (Review #289)
  const tmpPath = `${FETCH_CACHE_FILE}.tmp`;
  try {
    if (!isSafeToWrite(FETCH_CACHE_FILE)) return;
    fs.mkdirSync(path.dirname(FETCH_CACHE_FILE), { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify({ lastFetch: Date.now() }), "utf-8");
    try {
      fs.rmSync(FETCH_CACHE_FILE, { force: true });
    } catch {
      /* best-effort */
    }
    fs.renameSync(tmpPath, FETCH_CACHE_FILE);
  } catch {
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      /* cleanup */
    }
  }
}

// Configuration
const CONTEXT_FILE = "SESSION_CONTEXT.md";
const BRANCH_PREFIX = "claude/";
const MAX_AGE_DAYS = 7;

// Get and validate project directory
const safeBaseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || safeBaseDir;
const projectDir = path.resolve(safeBaseDir, projectDirInput);

// Security: Ensure projectDir is within baseDir (robust relative-path check)
const rel = path.relative(safeBaseDir, projectDir);
// Use regex for cross-platform ".." detection (handles Unix / and Windows \)
const isOutsideBase = /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel);
if (isOutsideBase) {
  console.log("ok");
  process.exit(0);
}

// Resolve cache path now that projectDir is defined
FETCH_CACHE_FILE = path.join(projectDir, ".claude", "hooks", ".fetch-cache.json");

/**
 * Run git command safely using execFileSync (no shell interpolation)
 * @param {string[]} args - Array of git command arguments
 */
function git(args) {
  try {
    return execFileSync("git", args, {
      cwd: projectDir,
      encoding: "utf8",
      timeout: 30000,
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Get current branch name
 */
function getCurrentBranch() {
  return git(["rev-parse", "--abbrev-ref", "HEAD"]);
}

/**
 * Get session counter from SESSION_CONTEXT.md content
 */
function getSessionCounter(content) {
  // Resilient: optional bold markers, flexible spacing, "Count"/"Counter" (P001 fix)
  const match = content.match(/\*{0,2}Current Session Count(?:er)?\*{0,2}\s*:?\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Get last updated date from SESSION_CONTEXT.md content
 */
function getLastUpdated(content) {
  const match = content.match(/\*\*Last Updated\*\*:\s*(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * Read SESSION_CONTEXT.md from a branch
 */
function readContextFromBranch(branch) {
  try {
    return git(["show", `${branch}:${CONTEXT_FILE}`]);
  } catch {
    return null;
  }
}

/**
 * Get recent Claude branches
 */
function getRecentClaudeBranches() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS);

  const branches = git([
    "branch",
    "-r",
    "--sort=-committerdate",
    "--format=%(refname:short)|%(committerdate:iso8601)",
  ]);
  if (!branches) return [];

  return branches
    .split("\n")
    .filter((line) => line.includes(BRANCH_PREFIX))
    .map((line) => {
      const [branch, dateStr] = line.split("|");
      return { branch: branch.trim(), date: new Date(dateStr) };
    })
    .filter(({ date }) => date >= cutoffDate)
    .slice(0, 10); // Max 10 branches to check
}

// Main logic
function main() {
  // Only fetch if cache is stale (5-min TTL)
  if (shouldFetch()) {
    git(["fetch", "--quiet", "origin"]);
    updateFetchCache();
  }

  const currentBranch = getCurrentBranch();
  const localContextPath = path.join(projectDir, CONTEXT_FILE);

  // Read local SESSION_CONTEXT.md
  let localContent = "";
  let localCounter = 0;
  try {
    localContent = fs.readFileSync(localContextPath, "utf8");
    localCounter = getSessionCounter(localContent);
  } catch {
    console.log("ok");
    return;
  }

  // Get recent Claude branches
  const recentBranches = getRecentClaudeBranches();

  let newerBranch = null;
  let newerCounter = localCounter;
  let newerDate = null;

  // Guard against detached HEAD state (currentBranch would be "HEAD")
  if (!currentBranch || currentBranch === "HEAD") {
    console.log("ok");
    return;
  }

  for (const { branch } of recentBranches) {
    // Normalize remote branch name (safer than regex for non-origin remotes)
    const remoteBranch = branch.startsWith("origin/") ? branch.slice("origin/".length) : branch;
    if (remoteBranch === currentBranch) continue;

    const remoteContent = readContextFromBranch(branch);
    if (!remoteContent) continue;

    const remoteCounter = getSessionCounter(remoteContent);
    const remoteDate = getLastUpdated(remoteContent);

    if (remoteCounter > newerCounter) {
      newerCounter = remoteCounter;
      newerBranch = branch;
      newerDate = remoteDate;
    }
  }

  if (newerBranch && newerCounter > localCounter) {
    console.error("");
    console.error("⚠️  SESSION CONTEXT UPDATE DETECTED");
    console.error("━".repeat(40));
    console.error(`Branch: ${newerBranch}`);
    console.error(`Session Counter: ${newerCounter} (local: ${localCounter})`);
    console.error(`Last Updated: ${newerDate}`);
    console.error("");
    console.error("The remote branch has newer session context.");
    console.error("Consider checking out or merging that branch,");
    console.error("or manually update SESSION_CONTEXT.md.");
    console.error("");
    console.error(`To view: git show ${newerBranch}:SESSION_CONTEXT.md`);
    console.error(`To merge: git merge ${newerBranch}`);
    console.error("━".repeat(40));
  }

  console.log("ok");
}

main();
