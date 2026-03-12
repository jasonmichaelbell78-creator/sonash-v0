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

// pattern-compliance: fs/path imports guarded by isSafeToWrite (loaded below)
let existsSync, readFileSync, readdirSync, lstatSync, copyFileSync, rmSync;
try {
  ({ existsSync, readFileSync, readdirSync, lstatSync, copyFileSync, rmSync } = require("node:fs"));
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Failed to load node:fs:", msg);
  process.exit(2);
}

let join;
try {
  ({ join } = require("node:path"));
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Failed to load node:path:", msg);
  process.exit(2);
}

let safeWriteFile;
try {
  ({ safeWriteFile } = require("./lib/security-helpers"));
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Failed to load security-helpers:", msg);
  process.exit(2);
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
  41, 64, 65, 66, 67, 68, 69, 70, 71, 80, 83, 84, 85, 86, 90, 91,
  // #92-#97, #101-#116, #121-#136: Historical gaps — review IDs never assigned during early sessions
  92,
  93, 94, 95, 96, 97, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115,
  116, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 117, 118,
  119, 120, 157, 158, 159, 160, 166, 167, 168, 169, 170, 172, 173, 174, 175, 176, 177, 178, 185,
  203, 205, 206, 207, 208, 209, 210, 220, 228, 229, 230, 231, 232, 233, 234, 240, 241, 242, 243,
  244, 245, 246, 247, 248, 323, 335, 349, 375,
  // #460-#461, #463-#464, #466-#467: Phantom IDs from collision renumbering loop (fixed Session #214)
  460,
  461, 463, 464, 466, 467,
]);

// Known-duplicate review IDs: IDs that legitimately exist in multiple archive files
// due to historical ID reuse across different PR cycles. Both copies contain unique
// learnings and should be preserved.
// - #366-#369: PR #383 R5-R8 in REVIEWS_347-369.md, reassigned to PRs #384/#389/#394
//   in REVIEWS_358-388.md. Verified Session #195 (2026-02-27).
const KNOWN_DUPLICATE_IDS = new Set([366, 367, 368, 369]);

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

/** Maximum range expansion (e.g. #1-#5000) to prevent DoS from malformed input */
const MAX_RANGE_EXPANSION = 5000;

/**
 * Parse heading-based review IDs from content.
 * @returns {{ ids: number[], found: boolean }}
 */
function parseHeadingIds(content) {
  const headingRegex = /^#{2,4}\s+Review\s+#(\d+)/gm;
  const ids = [];
  let found = false;
  for (const match of content.matchAll(headingRegex)) {
    ids.push(Number.parseInt(match[1], 10));
    found = true;
  }
  return { ids, found };
}

/**
 * Parse table-index review IDs from content (| #N | and | #N-M | rows).
 * @returns {{ ids: number[], found: boolean }}
 */
function parseTableIds(content) {
  const ids = [];
  let found = false;

  // Single review rows: | #N |
  const tableRegex = /^\|\s*#(\d+)\s*\|/gm;
  for (const match of content.matchAll(tableRegex)) {
    ids.push(Number.parseInt(match[1], 10));
    found = true;
  }

  // Consolidated range rows: | #N-M |
  const rangeRegex = /^\|\s*#(\d+)-(\d+)\s*\|/gm;
  for (const match of content.matchAll(rangeRegex)) {
    const start = Number.parseInt(match[1], 10);
    const end = Number.parseInt(match[2], 10);
    const span = end - start + 1;
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      span <= 0 ||
      span > MAX_RANGE_EXPANSION
    ) {
      found = true;
      continue;
    }
    for (let i = start; i <= end; i++) ids.push(i);
    found = true;
  }

  return { ids, found };
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

    const headings = parseHeadingIds(content);
    // Only use table parsing for summary-only archives (no heading-based reviews).
    // Files with #### Review #N headings contain retro tables whose PR numbers
    // would false-positive as review IDs (e.g., | #386 | in a PR #386 retro table).
    const useTable = includeTableIndex && !headings.found;
    const table = useTable ? parseTableIds(content) : { ids: [], found: false };

    const ids = [...headings.ids, ...table.ids];

    // Store format metadata for reporting
    if (headings.found && table.found) {
      ids._format = "mixed";
    } else if (table.found) {
      ids._format = "table";
    } else {
      ids._format = "full";
    }

    return ids;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `Error processing ${filePath.replace(ROOT + "/", "")}:`,
      msg.replaceAll(/C:\\Users\\[^\\]+/gi, "[PATH]")
    );
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
    const wrongHeadings = (content.match(/^#{2,3}\s+Review\s+#\d+/gm) || []).length;
    if (wrongHeadings > 0) {
      warn(`${fileName}: ${wrongHeadings} reviews use ## or ### instead of #### heading`);
      if (fixMode) {
        const fixed = content.replaceAll(/^#{2,3}(\s+Review\s+#)/gm, "####$1");
        safeWriteFile(filePath, fixed, { allowOverwrite: true });
        console.log(`    → Fixed ${wrongHeadings} headings`);
      }
      return wrongHeadings;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `Error checking headings in ${fileName}:`,
      msg.replaceAll(/C:\\Users\\[^\\]+/gi, "[PATH]")
    );
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error reading reviews.jsonl:", msg.replaceAll(/C:\\Users\\[^\\]+/gi, "[PATH]"));
    return 0;
  }
}

/**
 * Get ISO week string (YYYY-WNN) for a date.
 * @param {Date} date
 * @returns {string}
 */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1, Sun=7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Advance an ISO week string by one week.
 * @param {string} weekStr - Format "YYYY-WNN"
 * @returns {string}
 */
function nextISOWeek(weekStr) {
  const [yearStr, weekPart] = weekStr.split("-W");
  const year = Number.parseInt(yearStr, 10);
  const week = Number.parseInt(weekPart, 10);

  // Jan 4 is always in ISO week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  // Monday of week 1
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));

  // Thursday of target week (use Thursday to avoid boundary issues with getISOWeek)
  const targetThursday = new Date(week1Monday);
  targetThursday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7 + 3);

  // Advance 7 days to get Thursday of next week
  targetThursday.setUTCDate(targetThursday.getUTCDate() + 7);

  return getISOWeek(targetThursday);
}

/**
 * Analyze temporal coverage of reviews.
 * Detects weeks with no reviews between weeks that have reviews.
 *
 * @param {Array<{date?: string}>} [reviewsInput] - Optional array of review objects for testing.
 *   If not provided, reads from REVIEWS_JSONL.
 * @returns {{
 *   noData: boolean,
 *   weeksWithReviews: number,
 *   gaps: Array<{week: string, before: string, beforeCount: number, after: string, afterCount: number}>,
 *   longestGap: {start: string, end: string, length: number} | null
 * }}
 */
function analyzeTemporalCoverage(reviewsInput) {
  let reviews;
  if (reviewsInput) {
    reviews = reviewsInput;
  } else {
    if (!existsSync(REVIEWS_JSONL)) {
      return { noData: true, weeksWithReviews: 0, gaps: [], longestGap: null };
    }
    try {
      const lines = readFileSync(REVIEWS_JSONL, "utf8").replaceAll("\r\n", "\n").trim().split("\n");
      reviews = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          reviews.push(JSON.parse(line));
        } catch {
          /* skip malformed lines */
        }
      }
    } catch {
      return { noData: true, weeksWithReviews: 0, gaps: [], longestGap: null };
    }
  }

  // Filter to reviews with valid date fields
  const dated = reviews.filter((r) => r.date && typeof r.date === "string");
  if (dated.length === 0) {
    return { noData: true, weeksWithReviews: 0, gaps: [], longestGap: null };
  }

  // Group by ISO week
  const weekMap = new Map(); // week string -> count
  for (const review of dated) {
    const d = new Date(review.date);
    if (Number.isNaN(d.getTime())) continue;
    const week = getISOWeek(d);
    weekMap.set(week, (weekMap.get(week) || 0) + 1);
  }

  if (weekMap.size === 0) {
    return { noData: true, weeksWithReviews: 0, gaps: [], longestGap: null };
  }

  // Sort weeks chronologically (string compare is correct for YYYY-WNN format)
  const sortedWeeks = [...weekMap.keys()].sort((a, b) => a.localeCompare(b));
  const weeksWithReviews = sortedWeeks.length;

  // Generate all weeks between first and last
  // nosemgrep: sonash.correctness.no-unchecked-array-access
  const firstWeek = sortedWeeks[0];
  const lastWeek = sortedWeeks.at(-1);

  const allWeeks = [];
  let current = firstWeek;
  const MAX_WEEKS = 520; // ~10 years safety cap
  let iterations = 0;
  while (current <= lastWeek && iterations < MAX_WEEKS) {
    allWeeks.push(current);
    current = nextISOWeek(current);
    iterations++;
  }

  // Detect gaps: weeks with no reviews between weeks that have reviews
  const gaps = [];
  for (let i = 0; i < allWeeks.length; i++) {
    const week = allWeeks[i];
    if (!weekMap.has(week)) {
      // Find the nearest previous week with reviews
      let beforeWeek = null;
      let beforeCount = 0;
      for (let j = i - 1; j >= 0; j--) {
        if (weekMap.has(allWeeks[j])) {
          beforeWeek = allWeeks[j];
          beforeCount = weekMap.get(allWeeks[j]);
          break;
        }
      }
      // Find the nearest following week with reviews
      let afterWeek = null;
      let afterCount = 0;
      for (let j = i + 1; j < allWeeks.length; j++) {
        if (weekMap.has(allWeeks[j])) {
          afterWeek = allWeeks[j];
          afterCount = weekMap.get(allWeeks[j]);
          break;
        }
      }

      if (beforeWeek && afterWeek) {
        gaps.push({ week, before: beforeWeek, beforeCount, after: afterWeek, afterCount });
      }
    }
  }

  // Find longest consecutive gap
  let longestGap = null;
  if (gaps.length > 0) {
    let runStart = 0;
    let maxLen = 1;
    let maxStart = 0;
    for (let i = 1; i < gaps.length; i++) {
      if (nextISOWeek(gaps[i - 1].week) === gaps[i].week) {
        const runLen = i - runStart + 1;
        if (runLen > maxLen) {
          maxLen = runLen;
          maxStart = runStart;
        }
      } else {
        runStart = i;
      }
    }
    longestGap = {
      start: gaps[maxStart].week,
      end: gaps[maxStart + maxLen - 1].week,
      length: maxLen,
    };
  }

  return { noData: false, weeksWithReviews, gaps, longestGap };
}

function main() {
  console.log("Review Archive Health Check\n");

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
        `  Active log: ${logIds.length} reviews (#${logIds.length > 0 ? Math.min(...logIds) : 0}-#${logIds.length > 0 ? Math.max(...logIds) : 0})`
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
      const FMT_LABELS = { table: " (table-indexed)", mixed: " (mixed)" };
      const fmtLabel = FMT_LABELS[fmt] || "";
      if (ids.length > 0) {
        console.log(
          `  ${file}: ${ids.length} reviews (#${ids.length > 0 ? Math.min(...ids) : 0}-#${ids.length > 0 ? Math.max(...ids) : 0})${fmtLabel}`
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
  let knownDupCount = 0;
  for (const [id, sources] of allIds) {
    if (sources.length > 1) {
      const uniqueSources = [...new Set(sources)];

      if (KNOWN_DUPLICATE_IDS.has(id)) {
        // Known-duplicate IDs may legitimately appear across multiple files,
        // but within-file duplicates are still bugs (even if the ID also appears in other files).
        const countsBySource = sources.reduce((acc, src) => {
          acc[src] = (acc[src] ?? 0) + 1;
          return acc;
        }, {});

        for (const [src, count] of Object.entries(countsBySource)) {
          if (count > 1) {
            warn(`Review #${id} appears ${count} times in ${src}`);
            dupCount++;
          }
        }

        if (Object.keys(countsBySource).length > 1) {
          knownDupCount++;
        }
        continue;
      }

      // Check if duplicates are within the same file
      if (uniqueSources.length === 1 && sources.length > 1) {
        warn(`Review #${id} appears ${sources.length} times in ${uniqueSources[0]}`);
      } else if (uniqueSources.length > 1) {
        warn(`Review #${id} exists in multiple files: ${uniqueSources.join(", ")}`);
      }
      dupCount++;
    }
  }
  if (knownDupCount > 0) {
    console.log(`  INFO: ${knownDupCount} known-duplicate IDs skipped (historical ID reuse)`);
  }
  if (dupCount === 0) ok("No duplicate reviews found");
  console.log();

  // 4. Gap analysis
  console.log("4. Coverage Gaps:");
  if (allIds.size > 0) {
    const MAX_GAP_SCAN_SPAN = 10_000;
    const sortedIds = [...allIds.keys()].sort((a, b) => a - b);
    const minId = sortedIds[0];
    const maxId = sortedIds[sortedIds.length - 1];
    const span = maxId - minId + 1;

    if (!Number.isFinite(span) || span <= 0 || span > MAX_GAP_SCAN_SPAN) {
      warn(
        `Gap scan range #${minId}-#${maxId} (${span} entries) exceeds cap of ${MAX_GAP_SCAN_SPAN} — possible corrupted archive`
      );
      process.exitCode = 2;
      return;
    }

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

  // 6. Metadata Accuracy
  console.log("6. Metadata Accuracy:");
  if (existsSync(LEARNINGS_LOG)) {
    try {
      const logContent = readFileSync(LEARNINGS_LOG, "utf8");
      const logLines = logContent.split("\n").length;

      // Check 1: "Main log lines" claimed vs actual
      const linesMatch = logContent.match(/\| Main log lines \|\s*~?(\d+)/);
      if (linesMatch) {
        const claimed = Number.parseInt(linesMatch[1], 10);
        const drift = Math.abs(claimed - logLines);
        if (drift > 100) {
          warn(`"Main log lines" claims ~${claimed} but actual is ${logLines} (drift: ${drift})`);
        } else {
          ok(`Main log lines: ~${claimed} (actual: ${logLines}, drift: ${drift})`);
        }
      }

      // Check 2: "Active reviews" claimed count vs actual heading count
      const activeMatch = logContent.match(/\| Active reviews \|\s*(\d+)/);
      const headingRegex2 = /^#{2,4}\s+Review\s+#(\d+)/gm;
      let headingCount = 0;
      while (headingRegex2.exec(logContent) !== null) {
        headingCount++;
      }
      if (activeMatch) {
        const claimedActive = Number.parseInt(activeMatch[1], 10);
        if (claimedActive === headingCount) {
          ok(`Active reviews: ${claimedActive} (matches heading count)`);
        } else {
          warn(
            `"Active reviews" claims ${claimedActive} but actual heading count is ${headingCount}`
          );
        }
      }

      // Check 3: Consolidation section latest # vs state file
      const consolidationStatePath = join(ROOT, ".claude", "state", "consolidation.json");
      const consolidationMatches = [
        ...logContent.matchAll(/(?:Previous )?Consolidation \(?#(\d+)\)?/g),
      ];
      const mdNumbers = consolidationMatches
        .map((m) => Number.parseInt(m[1], 10))
        .filter((n) => Number.isFinite(n));
      const mdNumber = mdNumbers.length > 0 ? Math.max(...mdNumbers) : null;
      if (mdNumber !== null && existsSync(consolidationStatePath)) {
        try {
          const cState = JSON.parse(readFileSync(consolidationStatePath, "utf8"));
          const stateNumber = cState.consolidationNumber || 0;
          if (mdNumber === stateNumber) {
            ok(`Consolidation number: #${stateNumber} (matches state file)`);
          } else {
            warn(`Consolidation section shows #${mdNumber} but state file says #${stateNumber}`);
          }
        } catch {
          /* skip if state file unreadable */
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Error checking metadata:", msg.replaceAll(/C:\\Users\\[^\\]+/gi, "[PATH]"));
    }
  }
  console.log();

  // 7. Temporal Coverage
  console.log("7. Temporal Coverage:");
  const temporalResult = analyzeTemporalCoverage();
  if (temporalResult.noData) {
    console.log("  No temporal data available");
  } else {
    console.log(`  Weeks with reviews: ${temporalResult.weeksWithReviews}`);
    console.log(`  Weeks with gaps: ${temporalResult.gaps.length}`);
    if (temporalResult.longestGap) {
      console.log(
        `  Longest gap: ${temporalResult.longestGap.length} week(s) (${temporalResult.longestGap.start} to ${temporalResult.longestGap.end})`
      );
    }
    if (temporalResult.gaps.length > 0) {
      console.log("  Gap details:");
      for (const gap of temporalResult.gaps) {
        console.log(
          `    ${gap.week}: No reviews (between ${gap.before}: ${gap.beforeCount} reviews and ${gap.after}: ${gap.afterCount} reviews)`
        );
      }
    }
    if (temporalResult.gaps.length === 0) {
      ok("No temporal gaps detected");
    }
  }
  console.log();

  // Summary
  console.log("─".repeat(50));
  if (issues === 0) {
    console.log("All checks passed");
    process.exitCode = 0;
  } else {
    console.log(`${issues} issue(s) found`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error:", msg.replaceAll(/C:\\Users\\[^\\]+/gi, "[PATH]"));
    process.exitCode = 2;
  }
}

module.exports = { analyzeTemporalCoverage, getISOWeek };
