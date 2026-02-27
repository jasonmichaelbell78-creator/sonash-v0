#!/usr/bin/env node
/**
 * Reset Audit Trigger Thresholds
 *
 * Updates AUDIT_TRACKER.md after audits complete to reset trigger counters.
 *
 * Modes:
 *   --type=multi-ai        Reset ALL category dates + multi-AI counters (full reset)
 *   --type=comprehensive   Alias for --type=multi-ai
 *   --type=multi-ai-single Reset one category with "Multi-AI" label (requires --category=X)
 *                          Does NOT reset multi-AI global counters (commits/time)
 *   --type=single          Reset only one category (requires --category=X)
 *
 * Options:
 *   --category=X           Category to reset (code|security|performance|refactoring|documentation|process|engineering-productivity|enhancements|ai-optimization)
 *   --apply                Actually write changes (default: dry-run)
 *   --verbose              Show detailed output
 *
 * Exit codes: 0 = success, 1 = validation error, 2 = unexpected error
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sanitizeError } from "./lib/sanitize-error.js";
import { safeWriteFileSync } from "./lib/safe-fs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const TRACKER_PATH = join(ROOT, "docs", "audits", "AUDIT_TRACKER.md");

const VALID_CATEGORIES = [
  "code",
  "security",
  "performance",
  "refactoring",
  "documentation",
  "process",
  "engineering-productivity",
  "enhancements",
  "ai-optimization",
];

const VALID_TYPES = ["multi-ai", "comprehensive", "multi-ai-single", "single"];

// Parse arguments
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const VERBOSE = args.includes("--verbose");
const TYPE_ARG = args.find((a) => a.startsWith("--type="));
const CAT_ARG = args.find((a) => a.startsWith("--category="));
const TYPE = TYPE_ARG ? TYPE_ARG.split("=")[1] : null;
const CATEGORY = CAT_ARG ? CAT_ARG.split("=")[1] : null;

function log(...messages) {
  if (VERBOSE) console.log("[VERBOSE]", ...messages);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Validate command-line arguments
 * @returns {{valid: boolean, error?: string}}
 */
function validateArgs() {
  if (!TYPE) {
    return { valid: false, error: "Missing --type=<multi-ai|comprehensive|single>" };
  }
  if (!VALID_TYPES.includes(TYPE)) {
    return { valid: false, error: `Invalid type: ${TYPE}. Valid: ${VALID_TYPES.join(", ")}` };
  }
  if ((TYPE === "single" || TYPE === "multi-ai-single") && !CATEGORY) {
    return { valid: false, error: `--type=${TYPE} requires --category=X` };
  }
  if (CATEGORY && !VALID_CATEGORIES.includes(CATEGORY)) {
    return {
      valid: false,
      error: `Invalid category: ${CATEGORY}. Valid: ${VALID_CATEGORIES.join(", ")}`,
    };
  }
  return { valid: true };
}

/**
 * Reset a single category's row in the "Single-Session Audit Thresholds" table.
 * Matches the category name (case-insensitive) in the table and resets
 * "Last Audit", "Commits Since", and "Files Since" columns.
 *
 * @param {string} content - Full AUDIT_TRACKER.md content
 * @param {string} category - Category name to reset
 * @param {string} auditType - Label for the audit type (e.g., "Single", "Comprehensive")
 * @returns {string} Updated content
 */
function resetCategoryRow(content, category, auditType) {
  const dateStr = today();
  const label = `${dateStr} (${auditType})`;

  // Match the table row for this category
  // Category names in the table use title case or hyphenated forms
  const displayName = category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
  // Build a pattern that matches the category row in the threshold table
  // Use [-\s]+ between words to match both "Engineering-Productivity" and "Engineering Productivity"
  // Allow optional **bold** markers around category name (e.g., "**Enhancements**")
  // Format: | Category | Last Audit | Commits Since | Files Since | Trigger At |
  const displayNamePattern = escapeRegex(displayName).replace(/-/g, "[-\\s]+");
  const rowPattern = new RegExp(
    String.raw`^(\|\s*\*{0,2}${displayNamePattern}\*{0,2}\s*\|)[^|\n]+\|[^|\n]+\|[^|\n]+\|(.*)$`,
    "mi"
  );

  const match = content.match(rowPattern);
  if (!match) {
    log(`Category row not found for: ${displayName}`);
    return content;
  }

  const replacement = `${match[1]} ${padEnd(label, 26)} | ${padEnd("0", 13)} | ${padEnd("0", 11)} |${match[2]}`;
  log(`Resetting ${category}: ${match[0].trim()}`);
  log(`  → ${replacement.trim()}`);

  return content.replace(rowPattern, replacement);
}

/**
 * Reset multi-AI audit thresholds table rows for "Total commits" and "Time elapsed".
 *
 * @param {string} content - Full AUDIT_TRACKER.md content
 * @returns {string} Updated content
 */
function resetMultiAIThresholds(content) {
  const dateStr = today();
  let updated = content;

  // Reset "Total commits" row — use [^|\n] to prevent cross-line backtracking
  const commitsPattern = /^(\| Total commits\s+\|[^|\n]+\|)[^|\n]+\|(.*)$/m;
  const commitsMatch = updated.match(commitsPattern);
  if (commitsMatch) {
    const newCurrent = padEnd(`0 (reset ${dateStr})`, 34);
    updated = updated.replace(
      commitsPattern,
      `${commitsMatch[1]} ${newCurrent} |${commitsMatch[2]}`
    );
    log("Reset Total commits row");
  }

  // Reset "Time elapsed" row — use [^|\n] to prevent cross-line backtracking
  const timePattern = /^(\| Time elapsed\s+\|[^|\n]+\|)[^|\n]+\|(.*)$/m;
  const timeMatch = updated.match(timePattern);
  if (timeMatch) {
    const newCurrent = padEnd(`0 days (audit ${dateStr})`, 34);
    updated = updated.replace(timePattern, `${timeMatch[1]} ${newCurrent} |${timeMatch[2]}`);
    log("Reset Time elapsed row");
  }

  return updated;
}

/**
 * Escape special regex characters in a string
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Pad a string to a minimum length (right-padded with spaces)
 * @param {string} str
 * @param {number} len
 * @returns {string}
 */
function padEnd(str, len) {
  return str.length >= len ? str : str + " ".repeat(len - str.length);
}

/**
 * Main function
 */
function main() {
  // Validate arguments
  const validation = validateArgs();
  if (!validation.valid) {
    console.error(`❌ ${validation.error}`);
    console.error(
      "\nUsage: node scripts/reset-audit-triggers.js --type=<multi-ai|comprehensive|multi-ai-single|single> [--category=X] [--apply]"
    );
    process.exit(1);
  }

  // Read AUDIT_TRACKER.md
  if (!existsSync(TRACKER_PATH)) {
    console.error("❌ AUDIT_TRACKER.md not found at:", TRACKER_PATH);
    process.exit(1);
  }

  let content;
  try {
    content = readFileSync(TRACKER_PATH, "utf-8");
  } catch (error) {
    console.error("❌ Failed to read AUDIT_TRACKER.md:", sanitizeError(error));
    process.exit(2);
  }

  const effectiveType = TYPE === "comprehensive" ? "multi-ai" : TYPE;
  let updated = content;

  if (effectiveType === "multi-ai") {
    console.log("🔄 Resetting ALL category thresholds (multi-ai/comprehensive audit)...\n");

    // Reset every category row
    for (const cat of VALID_CATEGORIES) {
      updated = resetCategoryRow(updated, cat, "Comprehensive");
    }

    // Reset multi-AI thresholds
    updated = resetMultiAIThresholds(updated);
  } else if (effectiveType === "multi-ai-single") {
    console.log(
      `🔄 Resetting ${CATEGORY} category threshold (multi-AI single-category audit)...\n`
    );
    updated = resetCategoryRow(updated, CATEGORY, "Multi-AI");
  } else if (effectiveType === "single") {
    console.log(`🔄 Resetting ${CATEGORY} category threshold (single-session audit)...\n`);
    updated = resetCategoryRow(updated, CATEGORY, "Single");
  }

  // Show diff summary
  if (updated === content) {
    console.log("ℹ️  No changes needed (thresholds already at expected values).");
    process.exit(0);
  }

  if (!APPLY) {
    console.log("📋 DRY RUN - changes that would be made:");
    console.log("   (use --apply to write changes)\n");

    // Show changed lines
    const oldLines = content.split("\n");
    const newLines = updated.split("\n");
    for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
      if (oldLines[i] !== newLines[i]) {
        console.log(`   Line ${i + 1}:`);
        console.log(`   - ${(oldLines[i] || "").trim()}`);
        console.log(`   + ${(newLines[i] || "").trim()}`);
        console.log();
      }
    }
    process.exit(0);
  }

  // Write changes
  try {
    safeWriteFileSync(TRACKER_PATH, updated, "utf-8");
    console.log("✅ AUDIT_TRACKER.md updated successfully.");
  } catch (error) {
    console.error("❌ Failed to write AUDIT_TRACKER.md:", sanitizeError(error));
    process.exit(2);
  }
}

try {
  main();
} catch (error) {
  console.error("❌ Unexpected error:", sanitizeError(error));
  process.exit(2);
}
