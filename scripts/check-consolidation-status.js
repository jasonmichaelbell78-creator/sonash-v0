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
  // Match "Review #NNN:" or "Review #NNN-NNN:" (range format, captures both numbers)
  const versionRegex =
    /\|\s{0,5}\d+\.\d+\s{0,5}\|\s{0,5}\d{4}-\d{2}-\d{2}\s{0,5}\|\s{0,5}Review #(\d{1,4})(?:-(\d{1,4}))?[-:]/g;
  let match;
  let highest = 0;

  while ((match = versionRegex.exec(content)) !== null) {
    const reviewNum = Number.parseInt(match[1], 10);
    if (reviewNum > highest) highest = reviewNum;
    if (match[2]) {
      const rangeEnd = Number.parseInt(match[2], 10);
      if (rangeEnd > highest) highest = rangeEnd;
    }
  }

  return highest;
}

/**
 * Parse "Last Consolidation" section to find last consolidated review number
 * Looks for "Reviews consolidated: #X-#Y" pattern
 */
function getLastConsolidatedReview(content) {
  // Preferred: "Last Consolidation" section
  const sectionMatch = content.match(
    /### Last Consolidation[\s\S]{0,500}?\*\*Reviews consolidated:\*\*\s*#?\d+-#?(\d+)/i
  );
  if (sectionMatch) {
    return Number.parseInt(sectionMatch[1], 10);
  }

  // Fallback: "Consolidation Trigger" section (this is where the script updates the range)
  // Review #216: Align read location with run-consolidation.js
  const triggerStart = content.indexOf("## 🔔 Consolidation Trigger");
  if (triggerStart !== -1) {
    const triggerEnd = content.indexOf("\n## ", triggerStart + 1);
    const endIndex = triggerEnd === -1 ? content.length : triggerEnd;
    const triggerSection = content.slice(triggerStart, endIndex);

    const triggerMatch = triggerSection.match(/\*\*Reviews consolidated:\*\*\s*#?\d+-#?(\d+)/i);
    if (triggerMatch) {
      return Number.parseInt(triggerMatch[1], 10);
    }
  }

  // Fallback: "Active reviews now #X-Y" indicates reviews up to X-1 were consolidated
  const activeMatch = content.match(/Active reviews(?:\s+now)?\s+#(\d+)-/i);
  if (activeMatch) {
    return Number.parseInt(activeMatch[1], 10) - 1;
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

    // COMPUTED: count actual review entries > last consolidated (gap-safe)
    // Review #215: Use Set counting instead of subtraction to handle gaps
    const lastConsolidated = getLastConsolidatedReview(activeContent);
    // Match "Review #NNN:" or "Review #NNN-NNN:" (range format, captures both numbers)
    const versionRegex =
      /\|\s{0,5}\d+\.\d+\s{0,5}\|\s{0,5}\d{4}-\d{2}-\d{2}\s{0,5}\|\s{0,5}Review #(\d{1,4})(?:-(\d{1,4}))?[-:]/g;

    const allNums = [];
    for (const m of activeContent.matchAll(versionRegex)) {
      allNums.push(Number.parseInt(m[1], 10));
      if (m[2]) allNums.push(Number.parseInt(m[2], 10));
    }
    const uniqueNums = new Set(allNums.filter((n) => Number.isFinite(n) && n > lastConsolidated));

    // Review #216: Use reduce to avoid -Infinity and stack overflow on large arrays
    const highestReview = allNums.reduce((max, n) => (Number.isFinite(n) && n > max ? n : max), 0);
    const computedCount = uniqueNums.size;

    // MANUAL: Extract consolidation counter for cross-validation
    const counterMatch = activeContent.match(/\*\*Reviews since last consolidation:\*\*\s+(\d+)/);
    const manualCount = counterMatch ? Number.parseInt(counterMatch[1], 10) || 0 : 0;

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
    // Review #215: Clarify message for missing vs incorrect counter
    if (manualCount !== computedCount) {
      const manualStatus = counterMatch ? `shows ${manualCount}` : "is missing";
      console.log(
        `⚠️  COUNTER DRIFT DETECTED: Manual counter ${manualStatus}, but computed is ${computedCount}`
      );
      console.log("   The consolidation counter in AI_REVIEW_LEARNINGS_LOG.md is out of sync.");
      console.log(
        "   Fix: update '**Reviews since last consolidation:**' to match the computed value."
      );
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
