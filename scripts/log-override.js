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
 *   node scripts/log-override.js --analytics       # Show override analytics (last 30 days)
 *   node scripts/log-override.js --analytics --days=7 --json  # JSON analytics for last 7 days
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

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { isSafeToWrite } = require("../.claude/hooks/lib/symlink-guard");

// Shared rotation helper (entry-count-based)
let rotateJsonl;
try {
  rotateJsonl = require("../.claude/hooks/lib/rotate-state.js").rotateJsonl;
} catch {
  rotateJsonl = null;
}

// Get repository root for consistent log location
function getRepoRoot() {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf-8",
    timeout: 3000,
  });
  if (result.status === 0 && result.stdout) {
    return result.stdout.trim();
  }
  return process.cwd();
}

// Configuration
const OVERRIDE_LOG = path.resolve(path.join(getRepoRoot(), ".claude", "override-log.jsonl"));
const MAX_LOG_SIZE = 50 * 1024; // 50KB - rotate if larger

// Ensure directory exists
function ensureLogDir() {
  const dir = path.dirname(OVERRIDE_LOG);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Shared sanitization (extracted to reusable module)
const { sanitizeInput } = require("../.claude/hooks/lib/sanitize-input");

// Parse command line arguments
function parseArgs() {
  const args = {
    check: null,
    reason: null,
    list: false,
    clear: false,
    quick: false,
    analytics: false,
    days: 30,
    json: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--list") {
      args.list = true;
    } else if (arg === "--clear") {
      args.clear = true;
    } else if (arg === "--quick") {
      args.quick = true;
    } else if (arg === "--analytics") {
      args.analytics = true;
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg.startsWith("--days=")) {
      const val = Number.parseInt(arg.split("=").slice(1).join("="), 10);
      if (!Number.isNaN(val) && val > 0) args.days = val;
    } else if (arg.startsWith("--check=")) {
      // Use slice(1).join("=") to handle values containing "="
      args.check = arg.split("=").slice(1).join("=");
    } else if (arg.startsWith("--reason=")) {
      args.reason = arg.split("=").slice(1).join("=");
    }
  }

  // Also check environment variables
  if (!args.reason && process.env.SKIP_REASON) {
    args.reason = process.env.SKIP_REASON;
  }

  // Sanitize inputs
  if (args.check) args.check = sanitizeInput(args.check, 100);
  if (args.reason) args.reason = sanitizeInput(args.reason, 500);

  return args;
}

// Rotate log file if it exceeds MAX_LOG_SIZE (size-based rotation)
function rotateSizeBasedIfNeeded() {
  if (!fs.existsSync(OVERRIDE_LOG)) return;
  const stats = fs.statSync(OVERRIDE_LOG);
  if (stats.size <= MAX_LOG_SIZE) return;

  const backupFile = OVERRIDE_LOG.replaceAll(".jsonl", `-${Date.now()}.jsonl`);
  if (!isSafeToWrite(backupFile)) return;

  try {
    fs.renameSync(OVERRIDE_LOG, backupFile);
  } catch {
    fs.copyFileSync(OVERRIDE_LOG, backupFile);
    fs.unlinkSync(OVERRIDE_LOG);
  }
  console.log(`Override log rotated to ${path.basename(backupFile)}`);
}

// Rotate log file by entry count (keep 60 of last 100, only when > 64KB)
function rotateEntryBasedIfNeeded() {
  if (!rotateJsonl) return;
  try {
    const { size } = fs.lstatSync(OVERRIDE_LOG);
    if (size > 64 * 1024) {
      rotateJsonl(OVERRIDE_LOG, 100, 60);
    }
  } catch {
    // Non-fatal: rotation failure should not block override logging
  }
}

// Log an override
function logOverride(check, reason) {
  try {
    ensureLogDir();
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Warning: Could not create log directory: ${errMsg}`);
    return null;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    check,
    reason: reason || "No reason provided",
    user: process.env.USER || process.env.USERNAME || "unknown",
    cwd: process.cwd(),
    git_branch: getGitBranch(),
  };

  try {
    rotateSizeBasedIfNeeded();

    if (!isSafeToWrite(OVERRIDE_LOG)) return null;
    fs.appendFileSync(OVERRIDE_LOG, JSON.stringify(entry) + "\n");

    rotateEntryBasedIfNeeded();

    return entry;
  } catch (err) {
    // Non-fatal: log write failure should not crash scripts/hooks
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Warning: Could not write to override log: ${errMsg}`);
    return null;
  }
}

// Get current git branch
function getGitBranch() {
  try {
    const { spawnSync } = require("node:child_process");
    const result = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf-8",
      timeout: 3000,
    });

    if (result.status === 0 && result.stdout) {
      return result.stdout.trim();
    }
    return "unknown";
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

  // Wrap in try/catch - existsSync doesn't guarantee read success
  let content;
  try {
    content = fs.readFileSync(OVERRIDE_LOG, "utf-8");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Warning: Could not read override log: ${errMsg}`);
    return;
  }

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

// Read and parse all entries from override log
function readEntries(logPath) {
  const filePath = logPath || OVERRIDE_LOG;
  if (!fs.existsSync(filePath)) return [];

  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  return content
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
}

/**
 * Compute analytics from override entries.
 * Exported for testing.
 *
 * @param {Array<object>} entries - Override log entries
 * @param {number} days - Number of days to include
 * @returns {object} Analytics result
 */
function computeAnalytics(entries, days) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Filter entries within the time window
  const filtered = entries.filter((e) => {
    if (!e.timestamp) return false;
    return new Date(e.timestamp) >= cutoff;
  });

  // Period
  const period = {
    days,
    from: cutoff.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };

  // Total
  const total = filtered.length;

  // By check (sorted descending)
  const checkCounts = {};
  for (const e of filtered) {
    const check = e.check || "unknown";
    checkCounts[check] = (checkCounts[check] || 0) + 1;
  }
  const byCheck = Object.fromEntries(Object.entries(checkCounts).sort((a, b) => b[1] - a[1]));

  // By branch (top 10, sorted descending) - omit cwd field for privacy
  const branchCounts = {};
  for (const e of filtered) {
    const branch = e.git_branch || "unknown";
    branchCounts[branch] = (branchCounts[branch] || 0) + 1;
  }
  const byBranch = Object.fromEntries(
    Object.entries(branchCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  );

  // No-reason count
  const noReasonEntries = filtered.filter((e) => {
    const reason = (e.reason || "").trim();
    return (
      !reason || reason === "No reason" || reason === "No reason provided" || reason.length < 10
    );
  });
  const noReasonCount = noReasonEntries.length;
  const noReasonPct = total > 0 ? Math.round((noReasonCount / total) * 1000) / 10 : 0;

  // Patterns: same check overridden 3+ times on same branch
  const patternMap = {};
  for (const e of filtered) {
    const key = `${e.git_branch || "unknown"}|||${e.check || "unknown"}`;
    patternMap[key] = (patternMap[key] || 0) + 1;
  }
  const patterns = [];
  for (const [key, count] of Object.entries(patternMap)) {
    if (count >= 3) {
      const [branch, check] = key.split("|||");
      patterns.push({ branch, check, count });
    }
  }
  patterns.sort((a, b) => b.count - a.count);

  // Trend: last 7 days vs prior 7 days
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const currentWeek = entries.filter((e) => {
    if (!e.timestamp) return false;
    const d = new Date(e.timestamp);
    return d >= oneWeekAgo && d <= now;
  }).length;
  const previousWeek = entries.filter((e) => {
    if (!e.timestamp) return false;
    const d = new Date(e.timestamp);
    return d >= twoWeeksAgo && d < oneWeekAgo;
  }).length;
  let changePct;
  if (previousWeek > 0) {
    changePct = Math.round(((currentWeek - previousWeek) / previousWeek) * 100);
  } else {
    changePct = currentWeek > 0 ? 100 : 0;
  }

  const trend = {
    current_week: currentWeek,
    previous_week: previousWeek,
    change_pct: changePct,
  };

  return {
    period,
    total,
    byCheck,
    byBranch,
    noReasonCount,
    noReasonPct,
    patterns,
    trend,
  };
}

// Display analytics in human-readable format
function showAnalytics(analytics) {
  const { period, total, byCheck, noReasonCount, noReasonPct, patterns, trend } = analytics;

  console.log(`\nOverride Analytics (last ${period.days} days)`);
  console.log("==================================");
  console.log(`Total overrides: ${total}`);
  console.log(`No-reason rate: ${noReasonPct}% (${noReasonCount}/${total})`);

  console.log("\nBy Check:");
  for (const [check, count] of Object.entries(byCheck)) {
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
    console.log(`  ${check.padEnd(22)} ${String(count).padStart(3)}  (${pct}%)`);
  }

  if (patterns.length > 0) {
    console.log("\nPatterns (3+ same check on same branch):");
    for (const p of patterns) {
      console.log(`  ${p.branch}  ${p.check}  ${p.count} overrides`);
    }
  } else {
    console.log("\nPatterns: None detected");
  }

  const sign = trend.change_pct >= 0 ? "+" : "";
  console.log(
    `\nTrend: ${sign}${trend.change_pct}% vs previous week (${trend.current_week} vs ${trend.previous_week})`
  );
  console.log("");
}

// Clear override log
function clearLog() {
  ensureLogDir();
  if (fs.existsSync(OVERRIDE_LOG)) {
    const backupFile = OVERRIDE_LOG.replaceAll(".jsonl", `-archived-${Date.now()}.jsonl`);
    if (isSafeToWrite(backupFile)) {
      try {
        fs.renameSync(OVERRIDE_LOG, backupFile);
      } catch {
        fs.copyFileSync(OVERRIDE_LOG, backupFile);
        fs.unlinkSync(OVERRIDE_LOG);
      }
      console.log(`Override log archived to ${path.basename(backupFile)}`);
    }
  }
  console.log("Override log cleared.");
}

/**
 * Exported helper for Node scripts to log skips programmatically.
 * @param {string} check - The check type (e.g., "tests", "cross-doc")
 * @param {string} [reason] - Reason for skipping
 * @returns {object|null} The logged entry, or null on failure
 */
function logSkip(check, reason) {
  return logOverride(check, reason);
}

// Export for use as a module
if (typeof module !== "undefined" && module.exports) {
  module.exports = { logSkip, logOverride, computeAnalytics, readEntries };
}

// Main execution (only when run directly, not when required)
function main() {
  const args = parseArgs();

  if (args.analytics) {
    const entries = readEntries();
    const analytics = computeAnalytics(entries, args.days);
    if (args.json) {
      console.log(JSON.stringify(analytics, null, 2));
    } else {
      showAnalytics(analytics);
    }
    return;
  }

  if (args.list) {
    listOverrides();
    return;
  }

  if (args.clear) {
    clearLog();
    return;
  }

  // --quick mode: log and exit silently (for shell hooks)
  if (args.quick) {
    if (!args.check) {
      console.error("--quick requires --check=<type>");
      process.exit(1);
    }
    const entry = logOverride(args.check, args.reason);
    if (!entry) process.exit(1);
    process.exit(0);
  }

  if (!args.check) {
    console.log('Usage: node log-override.js --check=<type> --reason="<reason>"');
    console.log("");
    console.log(
      "Check types: triggers, patterns, tests, lint, cross-doc, doc-index, doc-header, audit-s0s1, debt-schema"
    );
    console.log("");
    console.log("Or use environment variable:");
    console.log('  SKIP_REASON="reason" SKIP_TRIGGERS=1 git push');
    console.log("");
    console.log("Other commands:");
    console.log("  --list       Show recent overrides");
    console.log("  --clear      Archive and clear override log");
    console.log("  --quick      Silent mode for shell hooks (log and exit)");
    console.log("  --analytics  Show override analytics (default: last 30 days)");
    console.log("    --days=N   Override analytics time window (default: 30)");
    console.log("    --json     Output analytics as JSON");
    process.exit(1);
  }

  const entry = logOverride(args.check, args.reason);
  if (!entry) {
    console.error("❌ ERROR: Failed to write override audit log.");
    process.exit(2);
  }
  console.log(`Override logged: ${args.check}`);
  if (!args.reason) {
    console.log("⚠️  Warning: No reason provided. Consider using --reason or SKIP_REASON env var.");
  }
}

// Only run main() when executed directly (not when required as a module)
if (require.main === module) {
  main();
}
