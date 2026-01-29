#!/usr/bin/env node
/**
 * Session End Auto-Commit Script
 *
 * Purpose: Automatically commits and pushes SESSION_CONTEXT.md updates
 * at the end of a session to ensure session-end is never forgotten.
 *
 * Usage:
 *   node scripts/session-end-commit.js
 *   npm run session:end
 *
 * What it does:
 *   1. Updates SESSION_CONTEXT.md to mark "Uncommitted Work: No"
 *   2. Commits the change with session-end message
 *   3. Pushes to the current branch
 *
 * Created: Session #115 (2026-01-29)
 * Security: Review #217 - execFileSync with args arrays (no command injection)
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const SESSION_CONTEXT_PATH = path.join(process.cwd(), "SESSION_CONTEXT.md");

// Colors for output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

function log(msg, color = "") {
  console.log(color ? `${color}${msg}${colors.reset}` : msg);
}

/**
 * Safely extract error message (Review #217: pattern compliance)
 */
function getErrorMessage(err) {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Run a git command using execFileSync (Review #217: no command injection)
 * @param {string[]} args - Git command arguments
 * @param {object} options - execFileSync options
 */
function runGit(args, options = {}) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: options.silent ? "pipe" : "inherit",
      ...options,
    });
  } catch (err) {
    if (!options.ignoreError) {
      throw err;
    }
    return null;
  }
}

function getCurrentBranch() {
  const branch = runGit(["branch", "--show-current"], { silent: true });
  return branch ? branch.trim() : "";
}

/**
 * Check if SESSION_CONTEXT.md has uncommitted changes
 * Review #217 R2: Scope to target file to prevent committing unrelated staged files
 */
function hasSessionContextChanges() {
  const status = runGit(["status", "--porcelain", "SESSION_CONTEXT.md"], { silent: true });
  return Boolean(status && status.trim().length > 0);
}

function updateSessionContext() {
  if (!fs.existsSync(SESSION_CONTEXT_PATH)) {
    log("SESSION_CONTEXT.md not found", colors.yellow);
    return false;
  }

  // Review #217: Wrap readFileSync in try/catch (TOCTOU + permission errors)
  let content;
  try {
    content = fs.readFileSync(SESSION_CONTEXT_PATH, "utf8");
  } catch (err) {
    log(`❌ Failed to read SESSION_CONTEXT.md: ${getErrorMessage(err)}`, colors.red);
    return false;
  }

  // Update "Uncommitted Work: Yes" to "Uncommitted Work: No"
  if (content.includes("**Uncommitted Work**: Yes")) {
    content = content.replace("**Uncommitted Work**: Yes", "**Uncommitted Work**: No");
    try {
      fs.writeFileSync(SESSION_CONTEXT_PATH, content);
    } catch (err) {
      log(`❌ Failed to write SESSION_CONTEXT.md: ${getErrorMessage(err)}`, colors.red);
      return false;
    }
    log("✓ Updated SESSION_CONTEXT.md (Uncommitted Work: No)", colors.green);
    return true;
  }

  // Already marked as no uncommitted work
  if (content.includes("**Uncommitted Work**: No")) {
    log("✓ SESSION_CONTEXT.md already up to date", colors.green);
    return false;
  }

  log("⚠ Could not find Uncommitted Work field", colors.yellow);
  return false;
}

function main() {
  log("\n📋 Session End Auto-Commit\n", colors.cyan);

  const branch = getCurrentBranch();

  // Review #217: Check for detached HEAD state
  if (!branch) {
    log("❌ Could not determine current branch (detached HEAD?)", colors.red);
    log("   Please checkout a branch before running session:end", colors.yellow);
    process.exit(1);
  }

  log(`Branch: ${branch}`);

  // Step 1: Update SESSION_CONTEXT.md
  updateSessionContext();

  // Step 2: Check if SESSION_CONTEXT.md has changes to commit
  // Review #217 R2: Only check target file, not all uncommitted changes
  if (!hasSessionContextChanges()) {
    log("\n✅ No changes to SESSION_CONTEXT.md - session end already complete", colors.green);
    return;
  }

  // Step 3: Commit
  log("\n📝 Committing session-end...", colors.cyan);
  try {
    runGit(["add", "SESSION_CONTEXT.md"]);

    // Review #217 R2: Commit ONLY SESSION_CONTEXT.md to prevent accidental commits of other staged files
    // Use SKIP flags via env to avoid blocking on doc index/header checks
    const commitMessage = "docs: session end - mark complete\n\nhttps://claude.ai/code";
    execFileSync("git", ["commit", "SESSION_CONTEXT.md", "-m", commitMessage], {
      encoding: "utf8",
      stdio: "inherit",
      env: { ...process.env, SKIP_DOC_INDEX_CHECK: "1", SKIP_DOC_HEADER_CHECK: "1" },
    });
    log("✓ Committed session-end changes", colors.green);
  } catch (err) {
    log("❌ Commit failed - may need manual intervention", colors.red);
    console.error(getErrorMessage(err));
    process.exit(1);
  }

  // Step 4: Push (Review #217: args array prevents branch name injection)
  log("\n🚀 Pushing to remote...", colors.cyan);
  try {
    runGit(["push", "-u", "origin", branch]);
    log("✓ Pushed to remote", colors.green);
  } catch (err) {
    log("❌ Push failed - may need manual push", colors.red);
    console.error(getErrorMessage(err));
    process.exit(1);
  }

  log("\n✅ Session end complete!", colors.green);
}

main();
