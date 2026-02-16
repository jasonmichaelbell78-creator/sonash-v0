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
} catch {
  isSafeToWrite = () => true; // Fallback if guard not available
}

const ROOT = join(__dirname, "..");
const ARCHIVE_DIR = join(ROOT, "docs", "archive");
const LEARNINGS_LOG = join(ROOT, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const REVIEWS_JSONL = join(ROOT, ".claude", "state", "reviews.jsonl");

const args = process.argv.slice(2);
const fixMode = args.includes("--fix");

let issues = 0;

function warn(msg) {
  issues++;
  console.log(`  ⚠️  ${msg}`);
}

function ok(msg) {
  console.log(`  ✅ ${msg}`);
}

/**
 * Extract review IDs from a file using #### Review #N pattern
 */
function extractReviewIds(filePath) {
  try {
    if (lstatSync(filePath).isSymbolicLink()) return [];
    const content = readFileSync(filePath, "utf8");
    const ids = [];
    const regex = /^####\s+Review\s+#(\d+)/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
      ids.push(Number.parseInt(match[1], 10));
    }
    return ids;
  } catch {
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
  } catch {
    /* skip */
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
  } catch {
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
      const ids = extractReviewIds(filePath);
      if (ids.length > 0) {
        console.log(`  ${file}: ${ids.length} reviews (#${Math.min(...ids)}-#${Math.max(...ids)})`);
      } else {
        console.log(`  ${file}: 0 reviews (summary-only)`);
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
    const gaps = [];

    for (let id = minId; id <= maxId; id++) {
      if (!allIds.has(id)) gaps.push(id);
    }

    if (gaps.length > 0) {
      // Group consecutive gaps for readability
      const ranges = [];
      let start = gaps[0];
      let end = gaps[0];
      for (let i = 1; i < gaps.length; i++) {
        if (gaps[i] === end + 1) {
          end = gaps[i];
        } else {
          ranges.push(start === end ? `#${start}` : `#${start}-#${end}`);
          start = gaps[i];
          end = gaps[i];
        }
      }
      ranges.push(start === end ? `#${start}` : `#${start}-#${end}`);

      warn(`${gaps.length} reviews missing from archives: ${ranges.join(", ")}`);
      console.log(
        `    Total range: #${minId}-#${maxId} (${maxId - minId + 1} expected, ${allIds.size} found)`
      );
    } else {
      ok(`Complete coverage: #${minId}-#${maxId} (${allIds.size} reviews)`);
    }
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
