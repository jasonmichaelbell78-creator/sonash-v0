#!/usr/bin/env node
/* global __dirname */
/**
 * check-review-archive.js
 *
 * Validates the learning log archive system:
 * 1. Heading format: all REVIEWS_*.md must use #### (not ###) headings
 * 2. Completeness: checks for gaps in review numbering across all archives + active log
 * 3. JSONL sync: compares max review ID in markdown vs reviews.jsonl
 * 4. Duplicates: detects duplicate review numbers within files
 *
 * Usage:
 *   npm run reviews:check-archive         # Run all checks
 *   npm run reviews:check-archive -- --fix # Fix heading format issues
 *
 * Exit codes:
 *   0 = All checks pass
 *   1 = Issues found
 *   2 = Error
 */

const { existsSync, readFileSync, readdirSync, writeFileSync, lstatSync } = require("node:fs");
const { join } = require("node:path");

// Symlink guard (Review #316-#323)
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require(join(__dirname, "..", ".claude", "hooks", "lib", "symlink-guard")));
} catch (err) {
  console.error("symlink-guard unavailable; disabling writes:", err);
  isSafeToWrite = () => false;
}

const ROOT = join(__dirname, "..");
const ARCHIVE_DIR = join(ROOT, "docs", "archive");
const LEARNINGS_LOG = join(ROOT, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const REVIEWS_JSONL = join(ROOT, ".claude", "state", "reviews.jsonl");

const args = process.argv.slice(2);
const fixMode = args.includes("--fix");

// Known-skipped review IDs: numbers that were never assigned to individual reviews.
// These gaps come from numbering skips, batch consolidations, or PR rounds that
// weren't individually documented. Verified via git log -S "#### Review #N".
// Last verified: Session #170 (2026-02-18)
const KNOWN_SKIPPED_IDS = new Set([
  41, 64, 65, 66, 67, 68, 69, 70, 71, 80, 83, 84, 85, 86, 90, 91, 117, 118, 119, 120, 157, 158, 159,
  160, 166, 167, 168, 169, 170, 172, 173, 174, 175, 176, 177, 178, 185, 203, 205, 206, 207, 208,
  209, 210, 220, 228, 229, 230, 231, 232, 233, 234, 240, 241, 242, 243, 244, 245, 246, 247, 248,
  323, 335, 349,
]);

let issues = 0;

function warn(msg) {
  issues++;
  console.log(`  ⚠️  ${msg}`);
}

function ok(msg) {
  console.log(`  ✅ ${msg}`);
}

/**
 * Group consecutive numbers into ranges for display.
 * e.g. [1,2,3,5,7,8] → ["#1-#3", "#5", "#7-#8"]
 */
function groupConsecutive(nums) {
  const sorted = Array.from(new Set(nums)).sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  const ranges = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `#${start}` : `#${start}-#${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `#${start}` : `#${start}-#${end}`);
  return ranges;
}

/**
 * Extract review IDs from a file using heading pattern (#### Review #N).
 * For archive files, also checks table index rows (| #N |, | #N-M |)
 * which are used in summary-only archives like REVIEWS_101-136.md.
 *
 * @param {string} filePath - File to scan
 * @param {object} [opts] - Options
 * @param {boolean} [opts.includeTableIndex=false] - Also match | #N | table rows
 *   (use for archive files only; the active log has PR# tables that would false-positive)
 */
function extractReviewIds(filePath, opts = {}) {
  const { includeTableIndex = false } = opts;
  try {
    if (lstatSync(filePath).isSymbolicLink()) return [];
    const content = readFileSync(filePath, "utf8");
    const ids = [];

    // Pattern 1: #### Review #N (full content entries)
    const headingRegex = /^####\s+Review\s+#(\d+)/gm;
    let match;
    let hasHeadings = false;
    while ((match = headingRegex.exec(content)) !== null) {
      ids.push(Number.parseInt(match[1], 10));
      hasHeadings = true;
    }

    let hasTable = false;
    if (includeTableIndex) {
      // Pattern 2: | #N | (table index rows — single review)
      // Only used for archive files to avoid false positives from PR# tables
      const tableRegex = /^\|\s*#(\d+)\s*\|/gm;
      while ((match = tableRegex.exec(content)) !== null) {
        const id = Number.parseInt(match[1], 10);
        if (!ids.includes(id)) ids.push(id);
        hasTable = true;
      }

      // Pattern 3: | #N-M | (consolidated range rows)
      const rangeRegex = /^\|\s*#(\d+)-(\d+)\s*\|/gm;
      while ((match = rangeRegex.exec(content)) !== null) {
        const start = Number.parseInt(match[1], 10);
        const end = Number.parseInt(match[2], 10);
        for (let i = start; i <= end; i++) {
          if (!ids.includes(i)) ids.push(i);
        }
        hasTable = true;
      }
    }

    // Store format metadata for reporting
    if (hasHeadings && hasTable) {
      ids._format = "mixed";
    } else if (hasTable) {
      ids._format = "table";
    } else {
      ids._format = "full";
    }

    return ids;
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
    return [];
  }
}

/**
 * Check for wrong heading format (### instead of ####)
 */
function checkWrongHeadings(filePath, fileName) {
  try {
    if (lstatSync(filePath).isSymbolicLink()) return 0;
    const content = readFileSync(filePath, "utf8");
    const wrongHeadings = (content.match(/^###\s+Review\s+#\d+/gm) || []).length;
    if (wrongHeadings > 0) {
      warn(`${fileName}: ${wrongHeadings} reviews use ### instead of #### heading`);
      if (fixMode) {
        if (!isSafeToWrite(filePath)) return 0;
        const fixed = content.replaceAll(/^###(\s+Review\s+#)/gm, "####$1");
        writeFileSync(filePath, fixed);
        console.log(`    → Fixed ${wrongHeadings} headings`);
      }
      return wrongHeadings;
    }
  } catch (err) {
    console.error(`Error checking headings in ${fileName}:`, err);
  }
  return 0;
}

/**
 * Get max review ID from JSONL
 */
function getJsonlMaxId() {
  if (!existsSync(REVIEWS_JSONL)) return 0;
  try {
    const lines = readFileSync(REVIEWS_JSONL, "utf8").replaceAll("\r\n", "\n").trim().split("\n");
    let max = 0;
    for (const line of lines) {
      try {
        const id = JSON.parse(line).id;
        if (typeof id === "number" && id > max) max = id;
      } catch {
        /* skip */
      }
    }
    return max;
  } catch (err) {
    console.error("Error reading reviews.jsonl:", err);
    return 0;
  }
}

function main() {
  console.log("📋 Review Archive Health Check\n");

  // 1. Heading format check
  console.log("1. Heading Format (#### required):");
  let wrongTotal = 0;
  if (existsSync(ARCHIVE_DIR)) {
    const archiveFiles = readdirSync(ARCHIVE_DIR)
      .filter((f) => f.startsWith("REVIEWS_") && f.endsWith(".md"))
      .sort();

    for (const file of archiveFiles) {
      const filePath = join(ARCHIVE_DIR, file);
      wrongTotal += checkWrongHeadings(filePath, file);
    }
  }
  if (wrongTotal === 0) ok("All archive files use #### headings");
  console.log();

  // 2. Collect all review IDs from all sources
  console.log("2. Review Inventory:");
  const allIds = new Map(); // id -> [source, source, ...]

  // Active log
  if (existsSync(LEARNINGS_LOG)) {
    const logIds = extractReviewIds(LEARNINGS_LOG);
    for (const id of logIds) {
      if (!allIds.has(id)) allIds.set(id, []);
      allIds.get(id).push("AI_REVIEW_LEARNINGS_LOG.md");
    }
    if (logIds.length > 0) {
      console.log(
        `  Active log: ${logIds.length} reviews (#${Math.min(...logIds)}-#${Math.max(...logIds)})`
      );
    } else {
      console.log("  Active log: 0 reviews");
    }
  }

  // Archive files
  if (existsSync(ARCHIVE_DIR)) {
    const archiveFiles = readdirSync(ARCHIVE_DIR)
      .filter((f) => f.startsWith("REVIEWS_") && f.endsWith(".md"))
      .sort();

    for (const file of archiveFiles) {
      const filePath = join(ARCHIVE_DIR, file);
      const ids = extractReviewIds(filePath, { includeTableIndex: true });
      const fmt = ids._format || "full";
      const fmtLabel = fmt === "table" ? " (table-indexed)" : fmt === "mixed" ? " (mixed)" : "";
      if (ids.length > 0) {
        console.log(
          `  ${file}: ${ids.length} reviews (#${Math.min(...ids)}-#${Math.max(...ids)})${fmtLabel}`
        );
      } else {
        console.log(`  ${file}: 0 reviews (empty)`);
      }
      for (const id of ids) {
        if (!allIds.has(id)) allIds.set(id, []);
        allIds.get(id).push(file);
      }
    }
  }
  console.log();

  // 3. Duplicates check
  console.log("3. Duplicate Check:");
  let dupCount = 0;
  for (const [id, sources] of allIds) {
    if (sources.length > 1) {
      // Check if duplicates are within the same file
      const uniqueSources = [...new Set(sources)];
      if (uniqueSources.length === 1 && sources.length > 1) {
        warn(`Review #${id} appears ${sources.length} times in ${uniqueSources[0]}`);
      } else if (uniqueSources.length > 1) {
        warn(`Review #${id} exists in multiple files: ${uniqueSources.join(", ")}`);
      }
      dupCount++;
    }
  }
  if (dupCount === 0) ok("No duplicate reviews found");
  console.log();

  // 4. Gap analysis
  console.log("4. Coverage Gaps:");
  if (allIds.size > 0) {
    const sortedIds = [...allIds.keys()].sort((a, b) => a - b);
    const minId = sortedIds[0];
    const maxId = sortedIds[sortedIds.length - 1];
    const knownSkipped = [];
    const trulyMissing = [];

    for (let id = minId; id <= maxId; id++) {
      if (!allIds.has(id)) {
        if (KNOWN_SKIPPED_IDS.has(id)) {
          knownSkipped.push(id);
        } else {
          trulyMissing.push(id);
        }
      }
    }

    if (trulyMissing.length > 0) {
      const ranges = groupConsecutive(trulyMissing);
      warn(`${trulyMissing.length} reviews missing from archives: ${ranges.join(", ")}`);
    }

    if (knownSkipped.length > 0) {
      console.log(`  ℹ️  ${knownSkipped.length} known-skipped IDs (never assigned, not a gap)`);
    }

    if (trulyMissing.length === 0 && knownSkipped.length === 0) {
      ok(`Complete coverage: #${minId}-#${maxId} (${allIds.size} reviews)`);
    } else if (trulyMissing.length === 0) {
      ok(
        `Full coverage: #${minId}-#${maxId} (${allIds.size} reviews, ${knownSkipped.length} known-skipped)`
      );
    }

    console.log(
      `    Total range: #${minId}-#${maxId} (${allIds.size} found, ${knownSkipped.length} skipped, ${trulyMissing.length} missing)`
    );
  }
  console.log();

  // 5. JSONL sync check
  console.log("5. JSONL Sync Status:");
  const jsonlMax = getJsonlMaxId();
  const mdMax = allIds.size > 0 ? Math.max(...allIds.keys()) : 0;

  if (jsonlMax === 0) {
    warn("reviews.jsonl is empty or missing");
  } else if (jsonlMax < mdMax) {
    warn(
      `JSONL max (#${jsonlMax}) < Markdown max (#${mdMax}) — ${mdMax - jsonlMax} reviews not synced`
    );
    console.log(`    Run: npm run reviews:sync -- --apply`);
  } else {
    ok(`JSONL synced (max: #${jsonlMax}, markdown max: #${mdMax})`);
  }
  console.log();

  // Summary
  console.log("─".repeat(50));
  if (issues === 0) {
    console.log("✅ All checks passed");
    process.exitCode = 0;
  } else {
    console.log(`⚠️  ${issues} issue(s) found`);
    process.exitCode = 1;
  }
}

try {
  main();
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Error:", msg.replaceAll(/C:\\Users\\[^\\]+/gi, "[PATH]"));
  process.exitCode = 2;
}
