#!/usr/bin/env node
/**
 * sync-consolidation-counter.js
 *
 * Syncs the manual consolidation counter in AI_REVIEW_LEARNINGS_LOG.md
 * to match the computed value from version history.
 *
 * Created: Session #129 (2026-02-04) - Fix for counter drift
 *
 * Usage:
 *   node scripts/sync-consolidation-counter.js         # Dry run (show what would change)
 *   node scripts/sync-consolidation-counter.js --apply # Apply the fix
 *
 * Exit codes:
 *   0 = OK (no drift or successfully synced)
 *   1 = Drift detected (dry run mode)
 *   2 = Error
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_FILE = join(__dirname, "..", "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const applyChanges = process.argv.includes("--apply");

/**
 * Parse version history to find review numbers > lastConsolidated
 */
function getComputedCount(content, lastConsolidated) {
  // Match "Review #NNN:" or "Review #NNN-NNN:" (range format, captures both numbers)
  const versionRegex =
    /\|\s{0,5}\d+\.\d+\s{0,5}\|\s{0,5}\d{4}-\d{2}-\d{2}\s{0,5}\|\s{0,5}Review #(\d{1,4})(?:-(\d{1,4}))?[-:]/g;

  const allNums = [];
  for (const m of content.matchAll(versionRegex)) {
    allNums.push(parseInt(m[1], 10));
    if (m[2]) allNums.push(parseInt(m[2], 10));
  }
  const uniqueNums = new Set(allNums.filter((n) => Number.isFinite(n) && n > lastConsolidated));

  return uniqueNums.size;
}

/**
 * Parse last consolidated review number
 */
function getLastConsolidatedReview(content) {
  // Check "Consolidation Trigger" section
  const triggerStart = content.indexOf("## 🔔 Consolidation Trigger");
  if (triggerStart !== -1) {
    const triggerEnd = content.indexOf("\n## ", triggerStart + 1);
    const endIndex = triggerEnd === -1 ? content.length : triggerEnd;
    const triggerSection = content.slice(triggerStart, endIndex);

    const triggerMatch = triggerSection.match(/\*\*Reviews consolidated:\*\*\s*#?\d+-#?(\d+)/i);
    if (triggerMatch) {
      return parseInt(triggerMatch[1], 10);
    }
  }

  return 0;
}

/**
 * Get manual counter value
 */
function getManualCount(content) {
  const counterMatch = content.match(/\*\*Reviews since last consolidation:\*\*\s+(\d+)/);
  return counterMatch ? parseInt(counterMatch[1], 10) : 0;
}

function main() {
  let content;
  try {
    content = readFileSync(LOG_FILE, "utf8").replace(/\r\n/g, "\n");
  } catch (readErr) {
    const code =
      readErr && typeof readErr === "object" && "code" in readErr
        ? String(readErr.code)
        : undefined;

    if (code === "ENOENT") {
      console.error("❌ AI_REVIEW_LEARNINGS_LOG.md not found");
    } else {
      console.error(
        `❌ Failed to read file: ${readErr instanceof Error ? readErr.message : String(readErr)}`
      );
    }
    process.exitCode = 2;
    return;
  }

  try {
    const lastConsolidated = getLastConsolidatedReview(content);
    const computedCount = getComputedCount(content, lastConsolidated);
    const manualCount = getManualCount(content);

    console.log("🔄 Consolidation Counter Sync");
    console.log("═".repeat(40));
    console.log(`   Last consolidated: #${lastConsolidated}`);
    console.log(`   Manual counter: ${manualCount}`);
    console.log(`   Computed count: ${computedCount}`);
    console.log("");

    if (manualCount === computedCount) {
      console.log("✅ Counter is in sync. No action needed.");
      process.exitCode = 0;
      return;
    }

    console.log(`⚠️  DRIFT DETECTED: Manual=${manualCount}, Computed=${computedCount}`);
    console.log("");

    if (applyChanges) {
      // Update the counter
      const updatedContent = content.replace(
        /\*\*Reviews since last consolidation:\*\*\s+\d+/,
        `**Reviews since last consolidation:** ${computedCount}`
      );

      writeFileSync(LOG_FILE, updatedContent, "utf8");
      console.log(`✅ Updated counter: ${manualCount} → ${computedCount}`);
      process.exitCode = 0;
    } else {
      console.log("Dry run mode. Use --apply to fix.");
      console.log(`   node scripts/sync-consolidation-counter.js --apply`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 2;
  }
}

main();
