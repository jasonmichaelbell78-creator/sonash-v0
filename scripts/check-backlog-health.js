#!/usr/bin/env node
/**
 * check-backlog-health.js
 *
 * Checks MASTER_DEBT.jsonl for aging issues and threshold violations.
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
 *   BACKLOG_MAX_ITEMS=25       - Total active items exceeding this trigger warning
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

const BACKLOG_FILE = join(__dirname, "..", "docs", "technical-debt", "MASTER_DEBT.jsonl");

// Statuses that count as "active" (not resolved / not false positive)
const ACTIVE_STATUSES = new Set(["NEW", "VERIFIED", "IN_PROGRESS", "PENDING"]);

/**
 * Parse backlog items from JSONL content.
 * Returns { items, corruptLines } where items are successfully parsed entries
 * and corruptLines is an array of { lineNumber, error } for bad lines.
 */
function parseBacklogItems(content) {
  const items = [];
  const corruptLines = [];
  const normalized = content.replaceAll("\uFEFF", "");
  const lines = normalized.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;

    try {
      const entry = JSON.parse(line);

      // Validate minimum required fields
      if (!entry.id || !entry.severity) {
        corruptLines.push({ lineNumber: i + 1, error: "Missing required field (id or severity)" });
        continue;
      }

      items.push(entry);
    } catch (err) {
      corruptLines.push({ lineNumber: i + 1, error: err.message });
    }
  }

  return { items, corruptLines };
}

/**
 * Filter to only active backlog items (not resolved, not false positives).
 */
function filterActiveItems(items) {
  return items.filter((item) => {
    const status = (item.status || "NEW").toUpperCase();
    return ACTIVE_STATUSES.has(status);
  });
}

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
 * Calculate the oldest item age in days for a given set of items.
 * Uses the "created" field from each entry.
 * Returns null if no items have a parseable date.
 */
function getOldestItemAgeDays(items) {
  if (items.length === 0) return null;

  const now = new Date();
  let oldest = null;

  for (const item of items) {
    if (!item.created) continue;
    const created = new Date(item.created);
    if (Number.isNaN(created.getTime())) continue;
    const ageDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    if (oldest === null || ageDays > oldest) {
      oldest = ageDays;
    }
  }

  return oldest;
}

/**
 * Check thresholds and generate warnings/blockers
 */
function checkThresholds(severityGroups, config, isPrePush) {
  const warnings = [];
  const blockers = [];
  let exitCode = 0;

  // Check for S0 items (should never be in active backlog)
  if (severityGroups.s0.length > 0) {
    const ids = severityGroups.s0.map((i) => i.id).join(", ");
    const msg = `S0 (Critical) active items in backlog: ${ids}`;
    blockers.push(msg);
    exitCode = 1;
  }

  // Check S1 aging
  const s1Age = getOldestItemAgeDays(severityGroups.s1);
  if (severityGroups.s1.length > 0 && s1Age !== null) {
    if (s1Age > config.BLOCK_S1_DAYS && isPrePush) {
      const msg = `S1 items aging ${s1Age} days (block threshold: ${config.BLOCK_S1_DAYS})`;
      blockers.push(msg);
      exitCode = 1;
    } else if (s1Age > config.S1_MAX_DAYS) {
      const msg = `S1 items aging ${s1Age} days (warn threshold: ${config.S1_MAX_DAYS})`;
      warnings.push(msg);
      exitCode = Math.max(exitCode, 1);
    }
  }

  // Check S2 aging
  const s2Age = getOldestItemAgeDays(severityGroups.s2);
  if (severityGroups.s2.length > 0 && s2Age !== null && s2Age > config.S2_MAX_DAYS) {
    const msg = `S2 items aging ${s2Age} days (warn threshold: ${config.S2_MAX_DAYS})`;
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
    return `Total active items (${itemCount}) exceeds threshold (${maxItems})`;
  }
  return null;
}

/**
 * Output health summary
 */
function outputHealthSummary(totalItems, activeItems, severityGroups, corruptLines) {
  console.log("Backlog Health Check");
  console.log("=".repeat(50));
  console.log(`   Source: MASTER_DEBT.jsonl`);
  console.log(`   Total entries: ${totalItems}`);
  console.log(`   Active items:  ${activeItems.length}`);
  console.log(`   S0 (Critical): ${severityGroups.s0.length}`);
  console.log(`   S1 (Major):    ${severityGroups.s1.length}`);
  console.log(`   S2 (Medium):   ${severityGroups.s2.length}`);
  console.log(`   S3 (Minor):    ${severityGroups.s3.length}`);
  if (corruptLines.length > 0) {
    console.log(`   Corrupt entries: ${corruptLines.length}`);
  }
  console.log("");
}

/**
 * Output blockers and warnings
 */
function outputIssues(blockers, warnings) {
  if (blockers.length > 0) {
    console.log("BLOCKERS (must address before push):");
    blockers.forEach((b) => console.log(`   - ${b}`));
    console.log("");
  }

  if (warnings.length > 0) {
    console.log("WARNINGS:");
    warnings.forEach((w) => console.log(`   - ${w}`));
    console.log("");
  }
}

/**
 * Output final status message
 */
function outputFinalStatus(exitCode, blockers, isPrePush) {
  if (exitCode === 0) {
    console.log("Backlog health OK");
  } else if (blockers.length > 0 && isPrePush) {
    console.log("Push blocked - address critical backlog items first");
    console.log("   Use --force to override (not recommended)");
  } else {
    console.log("Backlog needs attention - consider addressing items soon");
  }
  console.log("");
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
 * Warn about corrupt lines found during parsing (shown unless quiet mode).
 */
function warnCorruptLines(corruptLines, isQuiet) {
  if (corruptLines.length === 0 || isQuiet) return;
  console.log(`Note: ${corruptLines.length} corrupt line(s) skipped in MASTER_DEBT.jsonl`);
  const preview = corruptLines.slice(0, 3);
  preview.forEach((c) => console.log(`   Line ${c.lineNumber}: ${c.error}`));
  if (corruptLines.length > 3) {
    console.log(`   ... and ${corruptLines.length - 3} more`);
  }
  console.log("");
}

/**
 * Merge item-count threshold result into warnings list and return final exit code.
 */
function applyItemCountThreshold(warnings, exitCode, activeItemCount, maxItems) {
  const itemCountWarning = checkItemCountThreshold(activeItemCount, maxItems);
  if (itemCountWarning) {
    warnings.push(itemCountWarning);
    return Math.max(exitCode, 1);
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
      if (!isQuiet) console.error("MASTER_DEBT.jsonl not found at: " + BACKLOG_FILE);
      process.exitCode = 2;
      return;
    }

    const content = readFileSync(BACKLOG_FILE, "utf8");
    const { items: allItems, corruptLines } = parseBacklogItems(content);

    // Bail out if file is completely unparseable
    if (allItems.length === 0) {
      if (!isQuiet) console.error("No valid entries found in MASTER_DEBT.jsonl");
      process.exitCode = 2;
      return;
    }

    // Warn on corrupt lines but don't fail
    warnCorruptLines(corruptLines, isQuiet);

    // Filter to active items only
    const activeItems = filterActiveItems(allItems);

    // Categorize active items by severity
    const severityGroups = categorizeBySeverity(activeItems);

    // Check thresholds
    const { warnings, blockers, exitCode } = checkThresholds(severityGroups, CONFIG, isPrePush);

    // Check item count threshold and calculate final exit code
    const finalExitCode = applyItemCountThreshold(
      warnings,
      exitCode,
      activeItems.length,
      CONFIG.MAX_ITEMS
    );

    // Output results
    if (!isQuiet) {
      outputHealthSummary(allItems.length, activeItems, severityGroups, corruptLines);
      outputIssues(blockers, warnings);
      outputFinalStatus(finalExitCode, blockers, isPrePush);
    }

    process.exitCode = determineFinalExitCode(isPrePush, blockers, finalExitCode);
  } catch (err) {
    if (!isQuiet) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exitCode = 2;
  }
}

main();
