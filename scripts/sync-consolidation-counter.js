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

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_FILE = join(__dirname, "..", "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const CODE_PATTERNS_FILE = join(__dirname, "..", "docs", "agent_docs", "CODE_PATTERNS.md");
const applyChanges = process.argv.includes("--apply");

/**
 * Count actual review entries (#### Review #N) where N > lastConsolidated
 */
function getComputedCount(content, lastConsolidated) {
  const reviewHeaderRegex = /^#### Review #(\d+)/gm;
  const uniqueNums = new Set();

  for (const m of content.matchAll(reviewHeaderRegex)) {
    const num = Number.parseInt(m[1], 10);
    if (Number.isFinite(num) && num > lastConsolidated) {
      uniqueNums.add(num);
    }
  }

  return uniqueNums.size;
}

/**
 * Cross-validate against CODE_PATTERNS.md version history
 * Returns the last consolidated review number from version history, or null
 */
function getLastConsolidatedFromCodePatterns() {
  if (!existsSync(CODE_PATTERNS_FILE)) return null;

  let content;
  try {
    content = readFileSync(CODE_PATTERNS_FILE, "utf8").replaceAll("\r\n", "\n");
  } catch {
    return null;
  }

  // Parse version history table for the most recent consolidation
  // Format: | 2.7 | 2026-02-10 | **CONSOLIDATION #18: Reviews #266-284** ...
  const consolidationRegex = /CONSOLIDATION #(\d+):\s*Reviews #(\d+)-(\d+)/g;
  let maxNum = 0;
  let maxConsolidation = 0;

  for (const m of content.matchAll(consolidationRegex)) {
    const consolidationNum = Number.parseInt(m[1], 10);
    const endReview = Number.parseInt(m[3], 10);
    if (consolidationNum > maxConsolidation) {
      maxConsolidation = consolidationNum;
      maxNum = endReview;
    }
  }

  return maxNum > 0 ? { consolidationNum: maxConsolidation, lastReview: maxNum } : null;
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
      return Number.parseInt(triggerMatch[1], 10);
    }
  }

  return 0;
}

/**
 * Get manual counter value
 */
function getManualCount(content) {
  const counterMatch = content.match(/\*\*Reviews since last consolidation:\*\*\s+(\d+)/);
  return counterMatch ? Number.parseInt(counterMatch[1], 10) : 0;
}

function main() {
  let content;
  try {
    content = readFileSync(LOG_FILE, "utf8").replaceAll("\r\n", "\n");
  } catch (error_) {
    const code =
      error_ && typeof error_ === "object" && "code" in error_ ? String(error_.code) : undefined;

    if (code === "ENOENT") {
      console.error("❌ AI_REVIEW_LEARNINGS_LOG.md not found");
    } else {
      console.error(
        `❌ Failed to read file: ${error_ instanceof Error ? error_.message : String(error_)}`
      );
    }
    process.exitCode = 2;
    return;
  }

  try {
    let lastConsolidated = getLastConsolidatedReview(content);

    // Cross-validate against CODE_PATTERNS.md version history BEFORE computing count
    const codePatternsInfo = getLastConsolidatedFromCodePatterns();

    console.log("🔄 Consolidation Counter Sync");
    console.log("═".repeat(40));
    console.log(`   Last consolidated (log): #${lastConsolidated}`);
    if (codePatternsInfo) {
      console.log(
        `   Last consolidated (CODE_PATTERNS.md): #${codePatternsInfo.lastReview} (Consolidation #${codePatternsInfo.consolidationNum})`
      );
      if (codePatternsInfo.lastReview !== lastConsolidated) {
        console.log(
          `   ⚠️  MISMATCH: Log says #${lastConsolidated}, CODE_PATTERNS.md says #${codePatternsInfo.lastReview}`
        );
        console.log(`   → Using CODE_PATTERNS.md as source of truth`);
        lastConsolidated = codePatternsInfo.lastReview;
      }
    }

    const computedCount = getComputedCount(content, lastConsolidated);
    const manualCount = getManualCount(content);
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
