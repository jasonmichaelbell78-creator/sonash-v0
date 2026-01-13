#!/usr/bin/env node
/**
 * Override Logger
 *
 * Logs when blocking checks are overridden with a reason.
 * Creates an audit trail for accountability.
 *
 * Usage:
 *   node scripts/log-override.js --check=triggers --reason="Already ran security-auditor this session"
 *   node scripts/log-override.js --check=patterns --reason="False positive in migration script"
 *   node scripts/log-override.js --list            # Show recent overrides
 *   node scripts/log-override.js --clear           # Clear override log
 *
 * Environment variable integration:
 *   SKIP_REASON="reason" SKIP_TRIGGERS=1 git push
 *   SKIP_REASON="reason" SKIP_PATTERNS=1 git push
 *
 * Exit codes:
 *   0 - Override logged successfully
 *   1 - Missing required parameters
 *   2 - Script error
 */

const fs = require("fs");
const path = require("path");

// Configuration
const OVERRIDE_LOG = path.join(process.cwd(), ".claude", "override-log.jsonl");
const MAX_LOG_SIZE = 50 * 1024; // 50KB - rotate if larger

// Ensure directory exists
function ensureLogDir() {
  const dir = path.dirname(OVERRIDE_LOG);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Parse command line arguments
function parseArgs() {
  const args = {
    check: null,
    reason: null,
    list: false,
    clear: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--list") {
      args.list = true;
    } else if (arg === "--clear") {
      args.clear = true;
    } else if (arg.startsWith("--check=")) {
      args.check = arg.split("=")[1];
    } else if (arg.startsWith("--reason=")) {
      args.reason = arg.split("=").slice(1).join("=");
    }
  }

  // Also check environment variables
  if (!args.reason && process.env.SKIP_REASON) {
    args.reason = process.env.SKIP_REASON;
  }

  return args;
}

// Log an override
function logOverride(check, reason) {
  ensureLogDir();

  const entry = {
    timestamp: new Date().toISOString(),
    check,
    reason: reason || "No reason provided",
    user: process.env.USER || process.env.USERNAME || "unknown",
    cwd: process.cwd(),
    git_branch: getGitBranch(),
  };

  // Check log size and rotate if needed
  if (fs.existsSync(OVERRIDE_LOG)) {
    const stats = fs.statSync(OVERRIDE_LOG);
    if (stats.size > MAX_LOG_SIZE) {
      const backupFile = OVERRIDE_LOG.replace(".jsonl", `-${Date.now()}.jsonl`);
      fs.renameSync(OVERRIDE_LOG, backupFile);
      console.log(`Override log rotated to ${path.basename(backupFile)}`);
    }
  }

  fs.appendFileSync(OVERRIDE_LOG, JSON.stringify(entry) + "\n");
  return entry;
}

// Get current git branch
function getGitBranch() {
  try {
    const { execSync } = require("child_process");
    return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

// List recent overrides
function listOverrides() {
  if (!fs.existsSync(OVERRIDE_LOG)) {
    console.log("No overrides logged yet.\n");
    return;
  }

  const content = fs.readFileSync(OVERRIDE_LOG, "utf-8");
  const entries = content
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (entries.length === 0) {
    console.log("No overrides logged yet.\n");
    return;
  }

  console.log("📋 OVERRIDE AUDIT LOG");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Show last 10 entries
  const recent = entries.slice(-10);
  for (const entry of recent) {
    const date = new Date(entry.timestamp).toLocaleString();
    console.log(`📅 ${date}`);
    console.log(`   Check: ${entry.check}`);
    console.log(`   Reason: ${entry.reason}`);
    console.log(`   Branch: ${entry.git_branch}`);
    console.log("");
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Total overrides: ${entries.length}`);

  // Count by check type
  const byCheck = {};
  for (const entry of entries) {
    byCheck[entry.check] = (byCheck[entry.check] || 0) + 1;
  }
  console.log("\nBy check type:");
  for (const [check, count] of Object.entries(byCheck)) {
    console.log(`  - ${check}: ${count}`);
  }
}

// Clear override log
function clearLog() {
  ensureLogDir();
  if (fs.existsSync(OVERRIDE_LOG)) {
    const backupFile = OVERRIDE_LOG.replace(".jsonl", `-archived-${Date.now()}.jsonl`);
    fs.renameSync(OVERRIDE_LOG, backupFile);
    console.log(`Override log archived to ${path.basename(backupFile)}`);
  }
  console.log("Override log cleared.");
}

// Main execution
function main() {
  const args = parseArgs();

  if (args.list) {
    listOverrides();
    return;
  }

  if (args.clear) {
    clearLog();
    return;
  }

  if (!args.check) {
    console.log("Usage: node log-override.js --check=<type> --reason=\"<reason>\"");
    console.log("");
    console.log("Check types: triggers, patterns, tests, lint");
    console.log("");
    console.log("Or use environment variable:");
    console.log("  SKIP_REASON=\"reason\" SKIP_TRIGGERS=1 git push");
    console.log("");
    console.log("Other commands:");
    console.log("  --list   Show recent overrides");
    console.log("  --clear  Archive and clear override log");
    process.exit(1);
  }

  const entry = logOverride(args.check, args.reason);
  console.log(`Override logged: ${args.check}`);
  if (!args.reason) {
    console.log("⚠️  Warning: No reason provided. Consider using --reason or SKIP_REASON env var.");
  }
}

main();
