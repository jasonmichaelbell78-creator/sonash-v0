#!/usr/bin/env node
/**
 * check-consolidation-status.js
 *
 * Checks AI_REVIEW_LEARNINGS_LOG.md for consolidation status and alerts if threshold exceeded.
 * Run: npm run consolidation:check
 *
 * Session #114 Fix: Now COMPUTES actual review count from version history instead of
 * trusting the manual counter. Cross-validates and warns on drift.
 *
 * Exit codes:
 *   0 = OK (under threshold)
 *   1 = Warning (threshold exceeded, consolidation needed)
 *   2 = Error (file not found, read error, or unexpected exception)
 */

import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_FILE = join(__dirname, "..", "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const THRESHOLD = 10;
const ARCHIVE_LINE_THRESHOLD = 2500;

/**
 * Parse version history to find the highest review number
 * Format: | X.X | YYYY-MM-DD | Review #NNN: Description |
 */
function getHighestReviewNumber(content) {
  const versionRegex =
    /\|\s{0,5}\d+\.\d+\s{0,5}\|\s{0,5}\d{4}-\d{2}-\d{2}\s{0,5}\|\s{0,5}Review #(\d{1,4}):/g;
  let match;
  let highest = 0;

  while ((match = versionRegex.exec(content)) !== null) {
    const reviewNum = parseInt(match[1], 10);
    if (reviewNum > highest) {
      highest = reviewNum;
    }
  }

  return highest;
}

/**
 * Parse "Last Consolidation" section to find last consolidated review number
 * Looks for "Reviews consolidated: #X-#Y" pattern
 */
function getLastConsolidatedReview(content) {
  // Find the "Last Consolidation" section
  const sectionMatch = content.match(
    /### Last Consolidation[\s\S]{0,500}?\*\*Reviews consolidated:\*\*\s*#?\d+-#?(\d+)/i
  );
  if (sectionMatch) {
    return parseInt(sectionMatch[1], 10);
  }

  // Fallback: look for "Active reviews now #X-Y" which indicates reviews before X were archived/consolidated
  const activeMatch = content.match(/Active reviews(?:\s+now)?\s+#(\d+)-/i);
  if (activeMatch) {
    // Active reviews start at X means reviews up to X-1 were consolidated
    return parseInt(activeMatch[1], 10) - 1;
  }

  return 0;
}

function main() {
  try {
    if (!existsSync(LOG_FILE)) {
      console.error("❌ AI_REVIEW_LEARNINGS_LOG.md not found");
      process.exitCode = 2;
      return;
    }

    // Normalize CRLF to LF for cross-platform compatibility
    const content = readFileSync(LOG_FILE, "utf8").replace(/\r\n/g, "\n");
    const lines = content.split("\n");

    // Limit parsing to the active portion (before any archive section)
    const archiveHeaderIndex = lines.findIndex((line) =>
      line.trim().toLowerCase().startsWith("## archive")
    );
    const activeLines = archiveHeaderIndex !== -1 ? lines.slice(0, archiveHeaderIndex) : lines;
    const activeContent = activeLines.join("\n");

    // COMPUTED: Get actual review counts from parsing
    const highestReview = getHighestReviewNumber(activeContent);
    const lastConsolidated = getLastConsolidatedReview(activeContent);
    const computedCount = highestReview > lastConsolidated ? highestReview - lastConsolidated : 0;

    // MANUAL: Extract consolidation counter for cross-validation
    const counterMatch = activeContent.match(/\*\*Reviews since last consolidation:\*\*\s+(\d+)/);
    const manualCount = counterMatch ? parseInt(counterMatch[1], 10) || 0 : 0;

    // Extract status (whitespace-flexible)
    const statusMatch = activeContent.match(/\*\*Status:\*\*\s+([^\n]+)/);
    const status = statusMatch ? statusMatch[1].trim() : "Unknown";

    // Count active lines (everything before archive section)
    const activeLineCount = activeLines.length;

    console.log("📊 Consolidation Status Check");
    console.log("═".repeat(50));
    console.log(`   Highest review: #${highestReview}`);
    console.log(`   Last consolidated: #${lastConsolidated}`);
    console.log(`   Reviews pending (computed): ${computedCount}`);
    console.log(`   Reviews pending (manual): ${manualCount}`);
    console.log(`   Threshold: ${THRESHOLD}`);
    console.log(`   Status: ${status}`);
    console.log(`   Log lines: ${activeLineCount}`);
    console.log("");

    let exitCode = 0;

    // Cross-validation: warn if manual counter drifted from computed
    // Note: Drift is a WARNING only, not a failure (PR Review #324)
    if (manualCount !== computedCount) {
      console.log(
        `⚠️  COUNTER DRIFT DETECTED: Manual counter shows ${manualCount}, but computed is ${computedCount}`
      );
      console.log("   The manual counter in AI_REVIEW_LEARNINGS_LOG.md is out of sync.");
      console.log("   Using COMPUTED value for threshold check.");
      console.log("");
      // Don't set exitCode = 1 here - drift is informational, not a failure
    }

    // Check consolidation threshold (use COMPUTED value, not manual)
    if (computedCount >= THRESHOLD) {
      console.log(
        `⚠️  CONSOLIDATION NEEDED: ${computedCount} reviews pending (threshold: ${THRESHOLD})`
      );
      console.log("   Run consolidation process to extract patterns to CODE_PATTERNS.md");
      console.log("");
      exitCode = 1;
    } else if (computedCount > 0) {
      const remaining = THRESHOLD - computedCount;
      console.log(`✅ Consolidation OK: ${remaining} reviews until next consolidation`);
    } else {
      console.log(`✅ Consolidation OK: No reviews pending`);
    }

    // Check archive threshold
    if (activeLineCount > ARCHIVE_LINE_THRESHOLD) {
      console.log(
        `⚠️  ARCHIVE RECOMMENDED: ${activeLineCount} lines exceeds ${ARCHIVE_LINE_THRESHOLD} threshold`
      );
      console.log("   Consider archiving older reviews to docs/archive/");
      console.log("");
      exitCode = Math.max(exitCode, 1);
    } else {
      console.log(
        `✅ Log size OK: ${activeLineCount} lines (archive at ${ARCHIVE_LINE_THRESHOLD})`
      );
    }

    console.log("");
    process.exitCode = exitCode;
  } catch (err) {
    console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 2;
  }
}

main();
