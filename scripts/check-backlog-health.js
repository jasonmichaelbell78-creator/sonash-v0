#!/usr/bin/env node
/**
 * check-backlog-health.js
 *
 * Checks AUDIT_FINDINGS_BACKLOG.md for aging issues and threshold violations.
 * Run: npm run backlog:check
 *
 * Exit codes:
 *   0 = OK (healthy backlog)
 *   1 = Warning (aging issues or threshold exceeded)
 *   2 = Error (file not found, parse error, or unexpected exception)
 *
 * Thresholds (configurable via env vars):
 *   BACKLOG_S1_MAX_DAYS=7      - S1 findings older than this trigger warning
 *   BACKLOG_S2_MAX_DAYS=14     - S2 findings older than this trigger warning
 *   BACKLOG_MAX_ITEMS=25       - Total items exceeding this trigger warning
 *   BACKLOG_BLOCK_S1_DAYS=14   - S1 findings older than this block push (pre-push)
 */

import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration (can be overridden via env vars)
const CONFIG = {
  S1_MAX_DAYS: parseInt(process.env.BACKLOG_S1_MAX_DAYS, 10) || 7,
  S2_MAX_DAYS: parseInt(process.env.BACKLOG_S2_MAX_DAYS, 10) || 14,
  MAX_ITEMS: parseInt(process.env.BACKLOG_MAX_ITEMS, 10) || 25,
  BLOCK_S1_DAYS: parseInt(process.env.BACKLOG_BLOCK_S1_DAYS, 10) || 14,
};

const BACKLOG_FILE = join(__dirname, "..", "docs", "AUDIT_FINDINGS_BACKLOG.md");

/**
 * Parse backlog items from markdown content
 */
function parseBacklogItems(content) {
  const items = [];

  // Match item headers like "### [Category] Item Name"
  const itemRegex = /^### \[([^\]]+)\] (.+)$/gm;
  const sections = content.split(/^### \[/gm);

  for (let i = 1; i < sections.length; i++) {
    const section = "### [" + sections[i];
    const headerMatch = section.match(/^### \[([^\]]+)\] (.+)$/m);
    if (!headerMatch) continue;

    const category = headerMatch[1];
    const name = headerMatch[2];

    // Skip completed/rejected items
    if (section.includes("## Completed Items") || section.includes("## Rejected Items")) {
      continue;
    }

    // Extract severity
    const severityMatch = section.match(/\*\*Severity\*\*:\s*(S[0-3])/i);
    const severity = severityMatch ? severityMatch[1].toUpperCase() : "UNKNOWN";

    // Extract status
    const statusMatch = section.match(/\*\*Status\*\*:\s*(PENDING|IN_PROGRESS|DONE|DEFERRED)/i);
    const status = statusMatch ? statusMatch[1].toUpperCase() : "UNKNOWN";

    // Extract CANON-ID
    const canonMatch = section.match(/\*\*CANON-ID\*\*:\s*([A-Z]+-\d+)/i);
    const canonId = canonMatch ? canonMatch[1] : "UNKNOWN";

    // Only track pending/in-progress items
    if (status === "DONE" || status === "DEFERRED") continue;

    items.push({
      category,
      name,
      severity,
      status,
      canonId,
    });
  }

  return items;
}

/**
 * Calculate days since last update
 */
function getDaysSinceUpdate(content) {
  const dateMatch = content.match(/\*\*Last Updated\*\*:\s*(\d{4}-\d{2}-\d{2})/);
  if (!dateMatch) return null;

  const lastUpdated = new Date(dateMatch[1]);
  const now = new Date();
  const diffMs = now - lastUpdated;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Main function
 */
function main() {
  const isPrePush = process.argv.includes("--pre-push");
  const isQuiet = process.argv.includes("--quiet");

  try {
    if (!existsSync(BACKLOG_FILE)) {
      if (!isQuiet) {
        console.error("❌ AUDIT_FINDINGS_BACKLOG.md not found");
      }
      process.exitCode = 2;
      return;
    }

    // Normalize CRLF to LF for cross-platform compatibility
    const content = readFileSync(BACKLOG_FILE, "utf8").replace(/\r\n/g, "\n");

    // Get days since last update
    const daysSinceUpdate = getDaysSinceUpdate(content);

    // Parse items (only from active backlog section, before Completed/Rejected)
    const completedIndex = content.indexOf("## Completed Items");
    const activeContent = completedIndex !== -1 ? content.slice(0, completedIndex) : content;
    const items = parseBacklogItems(activeContent);

    // Categorize by severity
    const s0Items = items.filter(i => i.severity === "S0");
    const s1Items = items.filter(i => i.severity === "S1");
    const s2Items = items.filter(i => i.severity === "S2");
    const s3Items = items.filter(i => i.severity === "S3");

    if (!isQuiet) {
      console.log("📊 Backlog Health Check");
      console.log("═".repeat(50));
      console.log(`   Total active items: ${items.length}`);
      console.log(`   S0 (Critical): ${s0Items.length}`);
      console.log(`   S1 (Major):    ${s1Items.length}`);
      console.log(`   S2 (Medium):   ${s2Items.length}`);
      console.log(`   S3 (Minor):    ${s3Items.length}`);
      if (daysSinceUpdate !== null) {
        console.log(`   Days since last update: ${daysSinceUpdate}`);
      }
      console.log("");
    }

    let exitCode = 0;
    const warnings = [];
    const blockers = [];

    // Check for S0 items (should never be in backlog)
    if (s0Items.length > 0) {
      const msg = `S0 (Critical) items in backlog: ${s0Items.map(i => i.canonId).join(", ")}`;
      blockers.push(msg);
      exitCode = 1;
    }

    // Check S1 aging
    if (s1Items.length > 0 && daysSinceUpdate !== null) {
      if (daysSinceUpdate > CONFIG.BLOCK_S1_DAYS && isPrePush) {
        const msg = `S1 items aging ${daysSinceUpdate} days (block threshold: ${CONFIG.BLOCK_S1_DAYS})`;
        blockers.push(msg);
        exitCode = 1;
      } else if (daysSinceUpdate > CONFIG.S1_MAX_DAYS) {
        const msg = `S1 items aging ${daysSinceUpdate} days (warn threshold: ${CONFIG.S1_MAX_DAYS})`;
        warnings.push(msg);
        exitCode = Math.max(exitCode, 1);
      }
    }

    // Check S2 aging
    if (s2Items.length > 0 && daysSinceUpdate !== null && daysSinceUpdate > CONFIG.S2_MAX_DAYS) {
      const msg = `S2 items aging ${daysSinceUpdate} days (warn threshold: ${CONFIG.S2_MAX_DAYS})`;
      warnings.push(msg);
      exitCode = Math.max(exitCode, 1);
    }

    // Check total item count
    if (items.length > CONFIG.MAX_ITEMS) {
      const msg = `Total items (${items.length}) exceeds threshold (${CONFIG.MAX_ITEMS})`;
      warnings.push(msg);
      exitCode = Math.max(exitCode, 1);
    }

    // Output results
    if (!isQuiet) {
      if (blockers.length > 0) {
        console.log("🛑 BLOCKERS (must address before push):");
        blockers.forEach(b => console.log(`   - ${b}`));
        console.log("");
      }

      if (warnings.length > 0) {
        console.log("⚠️  WARNINGS:");
        warnings.forEach(w => console.log(`   - ${w}`));
        console.log("");
      }

      if (exitCode === 0) {
        console.log("✅ Backlog health OK");
      } else if (blockers.length > 0 && isPrePush) {
        console.log("🛑 Push blocked - address critical backlog items first");
        console.log("   Use --force to override (not recommended)");
      } else {
        console.log("⚠️  Backlog needs attention - consider addressing items soon");
      }
      console.log("");
    }

    // In pre-push mode with blockers, exit non-zero to block push
    if (isPrePush && blockers.length > 0 && !process.argv.includes("--force")) {
      process.exitCode = 1;
    } else {
      process.exitCode = exitCode;
    }

  } catch (err) {
    if (!isQuiet) {
      console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exitCode = 2;
  }
}

main();
