#!/usr/bin/env node
/* global __dirname */
/**
 * Escalate multiply-deferred items to S1 DEBT entries.
 *
 * Deferred items with defer_count >= threshold (default 2) that are still open
 * and not yet promoted get auto-promoted to S1 severity DEBT entries via
 * intake-pr-deferred.js.
 *
 * Usage:
 *   node scripts/debt/escalate-deferred.js [options]
 *
 * Options:
 *   --dry-run        Show what would be escalated without modifying anything
 *   --threshold N    Override default defer_count threshold (default 2)
 *
 * Exports escalateDeferred() for testing.
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { safeWriteFile } = require("../lib/security-helpers");

const DEFERRED_FILE = path.join(__dirname, "../../data/ecosystem-v2/deferred-items.jsonl");
const INTAKE_SCRIPT = path.join(__dirname, "intake-pr-deferred.js");

/**
 * Auto-classify category based on finding text keywords.
 * GATE-07 auto-classification.
 *
 * @param {string} finding - The finding text from the deferred item
 * @returns {string} Category string
 */
function classifyCategory(finding) {
  const lower = (finding || "").toLowerCase();

  if (
    lower.includes("security") ||
    lower.includes("auth") ||
    lower.includes("xss") ||
    lower.includes("injection")
  ) {
    return "security";
  }

  if (lower.includes("test") || lower.includes("coverage") || lower.includes("assertion")) {
    return "testing";
  }

  if (lower.includes("perf") || lower.includes("latency") || lower.includes("memory")) {
    return "performance";
  }

  return "code-quality";
}

/**
 * Extract a numeric PR number from a review_id like "rev-419".
 * Returns null if the format doesn't match.
 *
 * @param {string} reviewId
 * @returns {number|null}
 */
function extractPrNumber(reviewId) {
  const match = /^rev-(\d+)/.exec(reviewId || "");
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

/**
 * Read and parse deferred-items.jsonl.
 *
 * @param {string} filePath - Path to deferred-items.jsonl
 * @returns {Array<object>} Parsed items
 */
function readDeferredItems(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const lines = content.split("\n").filter((line) => line.trim());
  const items = [];

  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch {
      // Skip malformed lines
    }
  }

  return items;
}

/**
 * Write items back to deferred-items.jsonl (full file rewrite).
 *
 * @param {string} filePath - Path to deferred-items.jsonl
 * @param {Array<object>} items - Items to write
 */
function writeDeferredItems(filePath, items) {
  const content = items.map((item) => JSON.stringify(item)).join("\n") + "\n";
  safeWriteFile(filePath, content, { allowOverwrite: true });
}

/**
 * Main escalation logic. Exported for testing.
 *
 * @param {object} options
 * @param {boolean} options.dryRun - If true, don't modify anything
 * @param {number} options.threshold - defer_count threshold (default 2)
 * @param {string} [options.deferredFilePath] - Override path (for testing)
 * @param {string} [options.intakeScriptPath] - Override path (for testing)
 * @param {function} [options.execFn] - Override execFileSync (for testing)
 * @returns {{ escalated: number, skipped: number, items: Array<object> }}
 */
function escalateDeferred(options = {}) {
  const {
    dryRun = false,
    threshold = 2,
    deferredFilePath = DEFERRED_FILE,
    intakeScriptPath = INTAKE_SCRIPT,
    execFn = execFileSync,
  } = options;

  const items = readDeferredItems(deferredFilePath);
  let escalated = 0;
  let skipped = 0;
  const escalatedItems = [];

  for (const item of items) {
    // Only escalate items meeting all criteria
    if (
      item.defer_count >= threshold &&
      item.status === "open" &&
      item.promoted_to_debt === false
    ) {
      const prNumber = extractPrNumber(item.review_id);
      if (prNumber === null) {
        console.warn(
          `Warning: Skipping item ${item.id} - review_id "${item.review_id}" is not in rev-NNN format`
        );
        skipped++;
        continue;
      }

      const category = classifyCategory(item.finding);

      console.log(
        `  Escalating ${item.id}: "${item.finding}" (deferred ${item.defer_count}x) -> S1 ${category}`
      );

      if (!dryRun) {
        // Call intake-pr-deferred.js to create DEBT entry
        try {
          execFn(
            "node",
            [
              intakeScriptPath,
              "--pr",
              String(prNumber),
              "--file",
              "deferred-escalation",
              "--title",
              item.finding,
              "--severity",
              "S1",
              "--category",
              category,
              "--description",
              `Auto-escalated: deferred ${item.defer_count} times without resolution`,
            ],
            { stdio: "pipe" }
          );
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error(`  Error escalating ${item.id}: ${msg}`);
          skipped++;
          continue;
        }

        // Update the deferred item in-place
        item.status = "promoted";
        item.promoted_to_debt = true;
      }

      escalated++;
      escalatedItems.push(item);
    }
  }

  // Rewrite deferred-items.jsonl with updated items
  if (!dryRun && escalated > 0) {
    writeDeferredItems(deferredFilePath, items);
  }

  if (escalated > 0) {
    console.log(`\nEscalated ${escalated} items to S1 DEBT entries`);
  } else {
    console.log("No items need escalation");
  }

  if (skipped > 0) {
    console.log(`Skipped ${skipped} items (invalid review_id or intake error)`);
  }

  return { escalated, skipped, items: escalatedItems };
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);

  let dryRun = false;
  let threshold = 2;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (args[i] === "--threshold" && args[i + 1]) {
      threshold = Number.parseInt(args[++i], 10);
      if (Number.isNaN(threshold) || threshold < 1) {
        console.error("Error: --threshold must be a positive integer");
        process.exit(1);
      }
    } else if (args[i] === "--help") {
      console.log(`
Usage: node scripts/debt/escalate-deferred.js [options]

Options:
  --dry-run        Show what would be escalated without modifying anything
  --threshold N    Override default defer_count threshold (default 2)
  --help           Show this help message
`);
      process.exit(0);
    }
  }

  console.log(`Scanning deferred items (threshold: ${threshold}, dry-run: ${dryRun})...\n`);
  escalateDeferred({ dryRun, threshold });
}

module.exports = { escalateDeferred, classifyCategory, extractPrNumber };
