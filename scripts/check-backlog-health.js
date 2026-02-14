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
  S1_MAX_DAYS: Number.parseInt(process.env.BACKLOG_S1_MAX_DAYS, 10) || 7,
  S2_MAX_DAYS: Number.parseInt(process.env.BACKLOG_S2_MAX_DAYS, 10) || 14,
  MAX_ITEMS: Number.parseInt(process.env.BACKLOG_MAX_ITEMS, 10) || 25,
  BLOCK_S1_DAYS: Number.parseInt(process.env.BACKLOG_BLOCK_S1_DAYS, 10) || 14,
};

/**
 * Categorize items by severity level
 */
function categorizeBySeverity(items) {
  return {
    s0: items.filter((i) => i.severity === "S0"),
    s1: items.filter((i) => i.severity === "S1"),
    s2: items.filter((i) => i.severity === "S2"),
    s3: items.filter((i) => i.severity === "S3"),
  };
}

/**
 * Check thresholds and generate warnings/blockers
 */
function checkThresholds(severityGroups, daysSinceUpdate, config, isPrePush) {
  const warnings = [];
  const blockers = [];
  let exitCode = 0;

  // Check for S0 items (should never be in backlog)
  if (severityGroups.s0.length > 0) {
    const msg = `S0 (Critical) items in backlog: ${severityGroups.s0.map((i) => i.canonId).join(", ")}`;
    blockers.push(msg);
    exitCode = 1;
  }

  // Check S1 aging
  if (severityGroups.s1.length > 0 && daysSinceUpdate !== null) {
    if (daysSinceUpdate > config.BLOCK_S1_DAYS && isPrePush) {
      const msg = `S1 items aging ${daysSinceUpdate} days (block threshold: ${config.BLOCK_S1_DAYS})`;
      blockers.push(msg);
      exitCode = 1;
    } else if (daysSinceUpdate > config.S1_MAX_DAYS) {
      const msg = `S1 items aging ${daysSinceUpdate} days (warn threshold: ${config.S1_MAX_DAYS})`;
      warnings.push(msg);
      exitCode = Math.max(exitCode, 1);
    }
  }

  // Check S2 aging
  if (
    severityGroups.s2.length > 0 &&
    daysSinceUpdate !== null &&
    daysSinceUpdate > config.S2_MAX_DAYS
  ) {
    const msg = `S2 items aging ${daysSinceUpdate} days (warn threshold: ${config.S2_MAX_DAYS})`;
    warnings.push(msg);
    exitCode = Math.max(exitCode, 1);
  }

  return { warnings, blockers, exitCode };
}

/**
 * Check total item count threshold
 */
function checkItemCountThreshold(itemCount, maxItems) {
  if (itemCount > maxItems) {
    return `Total items (${itemCount}) exceeds threshold (${maxItems})`;
  }
  return null;
}

/**
 * Output health summary
 */
function outputHealthSummary(items, severityGroups, daysSinceUpdate) {
  console.log("📊 Backlog Health Check");
  console.log("═".repeat(50));
  console.log(`   Total active items: ${items.length}`);
  console.log(`   S0 (Critical): ${severityGroups.s0.length}`);
  console.log(`   S1 (Major):    ${severityGroups.s1.length}`);
  console.log(`   S2 (Medium):   ${severityGroups.s2.length}`);
  console.log(`   S3 (Minor):    ${severityGroups.s3.length}`);
  if (daysSinceUpdate !== null) {
    console.log(`   Days since last update: ${daysSinceUpdate}`);
  }
  console.log("");
}

/**
 * Output blockers and warnings
 */
function outputIssues(blockers, warnings) {
  if (blockers.length > 0) {
    console.log("🛑 BLOCKERS (must address before push):");
    blockers.forEach((b) => console.log(`   - ${b}`));
    console.log("");
  }

  if (warnings.length > 0) {
    console.log("⚠️  WARNINGS:");
    warnings.forEach((w) => console.log(`   - ${w}`));
    console.log("");
  }
}

/**
 * Output final status message
 */
function outputFinalStatus(exitCode, blockers, isPrePush) {
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

const BACKLOG_FILE = join(__dirname, "..", "docs", "AUDIT_FINDINGS_BACKLOG.md");

/**
 * Parse backlog items from markdown content
 */
function parseBacklogItems(content) {
  const items = [];

  // Remove markdown code blocks to avoid parsing templates/examples
  const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, "");

  // Match item headers like "### [Category] Item Name"
  const sections = contentWithoutCodeBlocks.split(/^### \[/gm);

  for (let i = 1; i < sections.length; i++) {
    const section = "### [" + sections[i];
    const headerMatch = section.match(/^### \[([^\]]+)\] (.+)$/m);
    if (!headerMatch) continue;

    const category = headerMatch[1];
    const name = headerMatch[2];

    // Skip template/example items
    if (category === "Category" && name === "Item Name") continue;

    // Skip completed/rejected items
    if (section.includes("## Completed Items") || section.includes("## Rejected Items")) {
      continue;
    }

    // Extract severity (P003 fix: optional bold markers, flexible colon/spacing)
    const severityMatch = section.match(/\*{0,2}Severity\*{0,2}\s{0,10}:?\s{0,10}(S[0-3])/i);
    const severity = severityMatch ? severityMatch[1].toUpperCase() : "UNKNOWN";

    // Skip items with template severity (S1/S2/S3)
    if (section.includes("S1/S2/S3")) continue;

    // Extract status (P003 fix: optional bold markers, flexible colon/spacing)
    const statusMatch = section.match(
      /\*{0,2}Status\*{0,2}\s{0,10}:?\s{0,10}(PENDING|IN_PROGRESS|DONE|DEFERRED)/i
    );
    const status = statusMatch ? statusMatch[1].toUpperCase() : "UNKNOWN";

    // Extract CANON-ID (P003 fix: optional bold markers, flexible separator/spacing)
    const canonMatch = section.match(/\*{0,2}CANON[- ]?ID\*{0,2}\s{0,10}:?\s{0,10}([A-Z]+-\d+)/i);
    const canonId = canonMatch ? canonMatch[1] : "UNKNOWN";

    // Skip items with template CANON-ID
    if (canonId === "UNKNOWN" || section.includes("CANON-NNN")) continue;

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
 * Get the cut index for active content (before Completed/Rejected sections)
 */
function getActiveSectionCutIndex(content) {
  const completedIndex = content.indexOf("## Completed Items");
  const rejectedIndex = content.indexOf("## Rejected Items");

  if (completedIndex === -1) return rejectedIndex;
  if (rejectedIndex === -1) return completedIndex;
  return Math.min(completedIndex, rejectedIndex);
}

/**
 * Determine final exit code based on mode and results
 */
function determineFinalExitCode(isPrePush, blockers, exitCode) {
  if (isPrePush && blockers.length > 0 && !process.argv.includes("--force")) {
    return 1;
  }
  return exitCode;
}

/**
 * Main function
 */
function main() {
  const isPrePush = process.argv.includes("--pre-push");
  const isQuiet = process.argv.includes("--quiet");

  try {
    if (!existsSync(BACKLOG_FILE)) {
      if (!isQuiet) console.error("❌ AUDIT_FINDINGS_BACKLOG.md not found");
      process.exitCode = 2;
      return;
    }

    // Normalize CRLF to LF for cross-platform compatibility
    const content = readFileSync(BACKLOG_FILE, "utf8").replace(/\r\n/g, "\n");
    const daysSinceUpdate = getDaysSinceUpdate(content);

    // Parse items (only from active backlog section)
    const cutIndex = getActiveSectionCutIndex(content);
    const activeContent = cutIndex !== -1 ? content.slice(0, cutIndex) : content;
    const items = parseBacklogItems(activeContent);

    // Categorize and check thresholds
    const severityGroups = categorizeBySeverity(items);
    const { warnings, blockers, exitCode } = checkThresholds(
      severityGroups,
      daysSinceUpdate,
      CONFIG,
      isPrePush
    );

    // Check item count threshold
    const itemCountWarning = checkItemCountThreshold(items.length, CONFIG.MAX_ITEMS);
    if (itemCountWarning) warnings.push(itemCountWarning);

    // Calculate final exit code
    const finalExitCode = itemCountWarning ? Math.max(exitCode, 1) : exitCode;

    // Output results
    if (!isQuiet) {
      outputHealthSummary(items, severityGroups, daysSinceUpdate);
      outputIssues(blockers, warnings);
      outputFinalStatus(finalExitCode, blockers, isPrePush);
    }

    process.exitCode = determineFinalExitCode(isPrePush, blockers, finalExitCode);
  } catch (err) {
    if (!isQuiet) {
      console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exitCode = 2;
  }
}

main();
