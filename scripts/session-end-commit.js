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
 */

const { execSync } = require("node:child_process");
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

function run(cmd, options = {}) {
  try {
    return execSync(cmd, {
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
  return run("git branch --show-current", { silent: true }).trim();
}

function hasUncommittedChanges() {
  const status = run("git status --porcelain", { silent: true });
  return status && status.trim().length > 0;
}

function updateSessionContext() {
  if (!fs.existsSync(SESSION_CONTEXT_PATH)) {
    log("SESSION_CONTEXT.md not found", colors.yellow);
    return false;
  }

  let content = fs.readFileSync(SESSION_CONTEXT_PATH, "utf8");

  // Update "Uncommitted Work: Yes" to "Uncommitted Work: No"
  if (content.includes("**Uncommitted Work**: Yes")) {
    content = content.replace("**Uncommitted Work**: Yes", "**Uncommitted Work**: No");
    fs.writeFileSync(SESSION_CONTEXT_PATH, content);
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
  log(`Branch: ${branch}`);

  // Step 1: Update SESSION_CONTEXT.md
  const updated = updateSessionContext();

  // Step 2: Check if there are changes to commit
  if (!hasUncommittedChanges()) {
    log("\n✅ No changes to commit - session end already complete", colors.green);
    return;
  }

  // Step 3: Commit
  log("\n📝 Committing session-end...", colors.cyan);
  try {
    run("git add SESSION_CONTEXT.md");

    // Use SKIP flags to avoid blocking on doc index (SESSION_CONTEXT.md doesn't affect index)
    const commitCmd = `SKIP_DOC_INDEX_CHECK=1 git commit -m "docs: session end - mark complete

https://claude.ai/code"`;

    run(commitCmd);
    log("✓ Committed session-end changes", colors.green);
  } catch (err) {
    log("❌ Commit failed - may need manual intervention", colors.red);
    console.error(err.message);
    process.exit(1);
  }

  // Step 4: Push
  log("\n🚀 Pushing to remote...", colors.cyan);
  try {
    run(`git push -u origin ${branch}`);
    log("✓ Pushed to remote", colors.green);
  } catch (err) {
    log("❌ Push failed - may need manual push", colors.red);
    console.error(err.message);
    process.exit(1);
  }

  log("\n✅ Session end complete!", colors.green);
}

main();
