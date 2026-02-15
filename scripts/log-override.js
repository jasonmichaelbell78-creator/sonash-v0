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

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

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
const OVERRIDE_LOG = path.join(getRepoRoot(), ".claude", "override-log.jsonl");
const MAX_LOG_SIZE = 50 * 1024; // 50KB - rotate if larger

// Ensure directory exists
function ensureLogDir() {
  const dir = path.dirname(OVERRIDE_LOG);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Patterns that look like secrets - redact these from logs
// Refined to reduce false positives (e.g., SHA hashes, file paths)
const SECRET_PATTERNS = [
  // Likely secret tokens: 24+ chars, must contain both letters and digits (reduces SHA/word false positives)
  /\b(?=[A-Za-z0-9_-]{24,}\b)(?=[A-Za-z0-9_-]*[A-Za-z])(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]+\b/g,
  // Bearer tokens
  /bearer\s+[A-Z0-9._-]+/gi,
  // Basic auth
  /basic\s+[A-Z0-9+/=]+/gi,
  // Key=value patterns with sensitive names
  /(?:api[_-]?key|token|secret|password|auth|credential)[=:]\s*\S+/gi,
];

// Sanitize and truncate input to prevent log injection and secret leakage
function sanitizeInput(value, maxLength = 500) {
  if (!value) return value;

  // Remove control characters except newlines (\n=10), tabs (\t=9), and carriage return (\r=13)
  // Using character code filtering instead of regex to avoid no-control-regex lint error
  let sanitized = "";
  for (let i = 0; i < value.length && i < maxLength * 2; i++) {
    const code = value.charCodeAt(i);
    // Allow printable ASCII (32-126), tab (9), newline (10), carriage return (13)
    if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) {
      sanitized += value[i];
    }
  }

  // Redact patterns that look like secrets
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }

  // Truncate to prevent log bloat
  if (sanitized.length > maxLength) {
    return sanitized.slice(0, maxLength) + "...[truncated]";
  }
  return sanitized;
}

// Parse command line arguments
function parseArgs() {
  const args = {
    check: null,
    reason: null,
    list: false,
    clear: false,
    quick: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--list") {
      args.list = true;
    } else if (arg === "--clear") {
      args.clear = true;
    } else if (arg === "--quick") {
      args.quick = true;
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
    // Check log size and rotate if needed
    if (fs.existsSync(OVERRIDE_LOG)) {
      const stats = fs.statSync(OVERRIDE_LOG);
      if (stats.size > MAX_LOG_SIZE) {
        const backupFile = OVERRIDE_LOG.replaceAll(".jsonl", `-${Date.now()}.jsonl`);
        fs.renameSync(OVERRIDE_LOG, backupFile);
        console.log(`Override log rotated to ${path.basename(backupFile)}`);
      }
    }

    fs.appendFileSync(OVERRIDE_LOG, JSON.stringify(entry) + "\n");

    // Entry-count-based rotation (keep 60 of last 100, only when file exceeds 64KB)
    try {
      if (rotateJsonl) {
        const { size } = fs.statSync(OVERRIDE_LOG);
        if (size > 64 * 1024) {
          rotateJsonl(OVERRIDE_LOG, 100, 60);
        }
      }
    } catch {
      // Non-fatal: rotation failure should not block override logging
    }

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

// Clear override log
function clearLog() {
  ensureLogDir();
  if (fs.existsSync(OVERRIDE_LOG)) {
    const backupFile = OVERRIDE_LOG.replaceAll(".jsonl", `-archived-${Date.now()}.jsonl`);
    fs.renameSync(OVERRIDE_LOG, backupFile);
    console.log(`Override log archived to ${path.basename(backupFile)}`);
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
  module.exports = { logSkip, logOverride };
}

// Main execution (only when run directly, not when required)
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
    console.log("  --list    Show recent overrides");
    console.log("  --clear   Archive and clear override log");
    console.log("  --quick   Silent mode for shell hooks (log and exit)");
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
