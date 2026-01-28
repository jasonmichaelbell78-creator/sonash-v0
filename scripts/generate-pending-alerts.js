#!/usr/bin/env node
/* global __dirname */
/**
 * Generate Pending Alerts for Claude Session Start
 *
 * Scans various sources for non-blocking alerts and writes them to
 * .claude/pending-alerts.json for Claude to read and surface conversationally.
 *
 * Sources scanned:
 * - AI_REVIEW_LEARNINGS_LOG.md for DEFERRED items
 * - AUDIT_FINDINGS_BACKLOG.md for S1+ items
 * - Session state (cross-session warnings)
 * - Secrets status
 *
 * @version 1.0.0
 * @created 2026-01-28
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const ALERTS_FILE = path.join(ROOT_DIR, ".claude", "pending-alerts.json");
const HOOK_WARNINGS_FILE = path.join(ROOT_DIR, ".claude", "hook-warnings.json");
const LEARNINGS_LOG = path.join(ROOT_DIR, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const BACKLOG_FILE = path.join(ROOT_DIR, "docs", "AUDIT_FINDINGS_BACKLOG.md");

/**
 * Scan AI_REVIEW_LEARNINGS_LOG.md for DEFERRED items
 */
function scanDeferredItems() {
  const alerts = [];

  if (!fs.existsSync(LEARNINGS_LOG)) {
    return alerts;
  }

  const content = fs.readFileSync(LEARNINGS_LOG, "utf8");
  const deferredItems = [];

  // Pattern 1: Standalone deferred items like "**DEFERRED (Review #51)**"
  const standalonePattern = /\*\*DEFERRED \(Review #(\d+)\)\*\*[:\s]*([^\n]+)/g;
  let match;
  while ((match = standalonePattern.exec(content)) !== null) {
    deferredItems.push({
      review: match[1],
      description: match[2].trim().replace(/^\*\*|\*\*$/g, ""),
    });
  }

  // Pattern 2: DEFERRED sections under Review headers
  // Split content by Review headers (#### not ###)
  const reviewSections = content.split(/(?=#{3,4} Review #\d+)/);

  for (const section of reviewSections) {
    const reviewMatch = section.match(/#{3,4} Review #(\d+)/);
    if (!reviewMatch) continue;

    const reviewNum = reviewMatch[1];

    // Find DEFERRED section within this review
    // Note: format is **DEFERRED (N):** with colon INSIDE the asterisks
    const deferredSectionMatch = section.match(
      /\*\*DEFERRED \((\d+)\):\*\*([\s\S]*?)(?=\*\*NEW PATTERNS|\*\*REJECTED|#{3,4} Review|## |$)/
    );

    if (deferredSectionMatch) {
      const count = parseInt(deferredSectionMatch[1], 10);
      const sectionText = deferredSectionMatch[2];

      if (count > 0) {
        // Extract numbered items with bold titles
        const itemPattern = /^\d+\.\s+\*\*([^*]+)\*\*/gm;
        let itemMatch;
        while ((itemMatch = itemPattern.exec(sectionText)) !== null) {
          deferredItems.push({
            review: reviewNum,
            description: itemMatch[1].trim(),
          });
        }
      }
    }
  }

  if (deferredItems.length > 0) {
    // Calculate aging (items from older reviews)
    const agingCount = deferredItems.length > 2 ? deferredItems.length - 2 : 0;

    alerts.push({
      type: "deferred",
      severity: agingCount > 0 ? "warning" : "info",
      message: `${deferredItems.length} deferred PR review item(s)${agingCount > 0 ? ` (${agingCount} aging)` : ""}`,
      details: deferredItems.slice(0, 5).map((d) => `Review #${d.review}: ${d.description}`),
      action: "Consider adding to ROADMAP_FUTURE.md or AUDIT_FINDINGS_BACKLOG.md",
    });
  }

  return alerts;
}

/**
 * Scan AUDIT_FINDINGS_BACKLOG.md for active S1+ items
 * Only counts items that are NOT completed/done/rejected
 */
function scanBacklogItems() {
  const alerts = [];

  if (!fs.existsSync(BACKLOG_FILE)) {
    return alerts;
  }

  const content = fs.readFileSync(BACKLOG_FILE, "utf8");

  // Find the "## Backlog Items" section (active items only)
  // Stop at "## Completed Items", "## Rejected Items", or "## Backlog Statistics"
  const backlogStart = content.indexOf("## Backlog Items");
  const completedStart = content.indexOf("## Completed Items");
  const rejectedStart = content.indexOf("## Rejected Items");
  const statsStart = content.indexOf("## Backlog Statistics");

  if (backlogStart === -1) return alerts;

  // Find the end of the active backlog section
  const sectionEnds = [completedStart, rejectedStart, statsStart].filter((i) => i > backlogStart);
  const backlogEnd = sectionEnds.length > 0 ? Math.min(...sectionEnds) : content.length;

  const activeContent = content.substring(backlogStart, backlogEnd);

  // Split into sections by ### headers (backlog items)
  const sections = activeContent.split(/(?=^### )/m);

  let s0Count = 0;
  let s1Count = 0;

  for (const section of sections) {
    // Skip if not a backlog item section (must start with ### [Category])
    if (!section.match(/^### \[/)) continue;

    // Skip completed items (strikethrough ~~ or COMPLETED/DONE status)
    if (section.match(/^### ~~/) || section.match(/✅\s*(COMPLETED|DONE)/i)) continue;

    // Skip template/example sections (contain placeholder text like "Item Name" or "S1/S2/S3")
    if (section.match(/^### \[Category\] Item Name/) || section.match(/S1\/S2\/S3/)) continue;

    // Check for S0/S1 severity in this specific section
    if (section.match(/\*\*Severity\*\*:\s*S0/i)) {
      s0Count++;
    }
    if (section.match(/\*\*Severity\*\*:\s*S1/i)) {
      s1Count++;
    }
  }

  if (s0Count > 0) {
    alerts.push({
      type: "backlog-critical",
      severity: "error",
      message: `${s0Count} CRITICAL (S0) item(s) in backlog - requires immediate attention`,
      action: "Review AUDIT_FINDINGS_BACKLOG.md immediately",
    });
  }

  if (s1Count > 0) {
    alerts.push({
      type: "backlog-major",
      severity: "warning",
      message: `${s1Count} Major (S1) item(s) in backlog`,
      action: "Review AUDIT_FINDINGS_BACKLOG.md",
    });
  }

  return alerts;
}

/**
 * Check for encrypted secrets that need decryption
 */
function checkEncryptedSecrets() {
  const alerts = [];
  const envLocalPath = path.join(ROOT_DIR, ".env.local");
  const encryptedPath = path.join(ROOT_DIR, ".env.local.encrypted");

  // Check if encrypted file exists
  if (fs.existsSync(encryptedPath)) {
    // Check if .env.local has actual tokens (not just placeholders)
    let hasTokens = false;
    if (fs.existsSync(envLocalPath)) {
      try {
        const content = fs.readFileSync(envLocalPath, "utf8");
        // Check for actual token values (not placeholders like "your-token-here")
        hasTokens =
          /SONARCLOUD_TOKEN=(?!your-|placeholder|xxx)[^\s]+/.test(content) ||
          /GITHUB_TOKEN=(?!your-|placeholder|xxx)[^\s]+/.test(content);
      } catch {
        // Ignore read errors
      }
    }

    if (!hasTokens) {
      alerts.push({
        type: "secrets",
        severity: "warning",
        message: "Encrypted secrets found but not decrypted",
        action: "Run: node scripts/secrets/decrypt-secrets.js",
      });
    }
  }

  return alerts;
}

/**
 * Check for cross-session warnings
 */
function checkCrossSessionWarnings() {
  const alerts = [];
  const sessionContextPath = path.join(ROOT_DIR, "docs", "SESSION_CONTEXT.md");
  const sessionStatePath = path.join(ROOT_DIR, ".claude", "hooks", ".session-state.json");

  // Check session state file for incomplete sessions
  if (fs.existsSync(sessionStatePath)) {
    try {
      const state = JSON.parse(fs.readFileSync(sessionStatePath, "utf8"));
      // Check lastBegin without corresponding lastEnd (or lastSessionEnd)
      if (state.lastBegin && !state.lastEnd && !state.lastSessionEnd) {
        const hoursSinceStart =
          (Date.now() - new Date(state.lastBegin).getTime()) / (1000 * 60 * 60);
        if (hoursSinceStart < 24 && hoursSinceStart > 0.1) {
          // More than 6 minutes ago
          alerts.push({
            type: "cross-session",
            severity: "info",
            message: `Previous session started ${Math.round(hoursSinceStart)}h ago without session-end`,
            action: "Run /session-end skill at end of each session",
          });
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Also check SESSION_CONTEXT.md
  if (fs.existsSync(sessionContextPath)) {
    const content = fs.readFileSync(sessionContextPath, "utf8");
    const statusMatch = content.match(/\*\*Status\*\*:\s*(\w+)/i);
    if (statusMatch && statusMatch[1].toLowerCase() === "active") {
      // Only add if we didn't already add a cross-session warning
      if (!alerts.some((a) => a.type === "cross-session")) {
        alerts.push({
          type: "cross-session",
          severity: "info",
          message: "Previous session may not have ended cleanly",
          action: "Review SESSION_CONTEXT.md for context",
        });
      }
    }
  }

  return alerts;
}

/**
 * Check MCP memory status
 */
function checkMcpMemoryReminder() {
  // Always remind to check MCP memory at session start
  return [
    {
      type: "mcp-memory",
      severity: "info",
      message: "Check MCP memory for persisted context from previous sessions",
      action: "Run mcp__memory__read_graph() to retrieve saved context",
    },
  ];
}

/**
 * Read hook warnings from pre-commit/pre-push hooks
 * These are warnings that were generated during recent git operations
 */
function readHookWarnings() {
  const alerts = [];

  if (!fs.existsSync(HOOK_WARNINGS_FILE)) {
    return alerts;
  }

  try {
    const data = JSON.parse(fs.readFileSync(HOOK_WARNINGS_FILE, "utf8"));
    const warnings = data.warnings || [];

    // Only include warnings from last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentWarnings = warnings.filter((w) => new Date(w.timestamp).getTime() > oneDayAgo);

    if (recentWarnings.length === 0) {
      return alerts;
    }

    // Group by hook type
    const preCommitWarnings = recentWarnings.filter((w) => w.hook === "pre-commit");
    const prePushWarnings = recentWarnings.filter((w) => w.hook === "pre-push");

    if (preCommitWarnings.length > 0) {
      alerts.push({
        type: "hook-precommit",
        severity: preCommitWarnings.some((w) => w.severity === "warning") ? "warning" : "info",
        message: `${preCommitWarnings.length} warning(s) from recent commits`,
        details: preCommitWarnings.slice(0, 3).map((w) => w.message),
        action: preCommitWarnings[0].action || "Review warnings above",
      });
    }

    if (prePushWarnings.length > 0) {
      alerts.push({
        type: "hook-prepush",
        severity: prePushWarnings.some((w) => w.severity === "warning") ? "warning" : "info",
        message: `${prePushWarnings.length} warning(s) from recent pushes`,
        details: prePushWarnings.slice(0, 3).map((w) => w.message),
        action: prePushWarnings[0].action || "Review warnings above",
      });
    }

    // Clear warnings after they've been read (they'll be surfaced by Claude)
    fs.writeFileSync(
      HOOK_WARNINGS_FILE,
      JSON.stringify({ warnings: [], lastCleared: new Date().toISOString() }, null, 2)
    );
  } catch {
    // Ignore parse errors
  }

  return alerts;
}

/**
 * Main function to generate all alerts
 */
function generateAlerts() {
  const alerts = [
    ...scanDeferredItems(),
    ...scanBacklogItems(),
    ...checkEncryptedSecrets(),
    ...checkCrossSessionWarnings(),
    ...readHookWarnings(),
    ...checkMcpMemoryReminder(),
  ];

  const output = {
    generated: new Date().toISOString(),
    alertCount: alerts.length,
    alerts: alerts,
  };

  // Ensure .claude directory exists
  const claudeDir = path.dirname(ALERTS_FILE);
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  // Write alerts file
  fs.writeFileSync(ALERTS_FILE, JSON.stringify(output, null, 2));

  // Output summary for hook
  const errorCount = alerts.filter((a) => a.severity === "error").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;
  const infoCount = alerts.filter((a) => a.severity === "info").length;

  console.log(`📋 Generated ${alerts.length} pending alert(s)`);
  if (errorCount > 0) console.log(`   ❌ ${errorCount} error(s)`);
  if (warningCount > 0) console.log(`   ⚠️  ${warningCount} warning(s)`);
  if (infoCount > 0) console.log(`   ℹ️  ${infoCount} info`);
  console.log(`   Written to: .claude/pending-alerts.json`);

  return output;
}

// Run if called directly
if (require.main === module) {
  generateAlerts();
}

module.exports = {
  generateAlerts,
  scanDeferredItems,
  scanBacklogItems,
  checkEncryptedSecrets,
  readHookWarnings,
};
