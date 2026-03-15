#!/usr/bin/env node
/* global __dirname */
/**
 * check-review-archive.js
 *
 * JSONL-canonical health checker for the review lifecycle pipeline.
 * Validates `.claude/state/reviews.jsonl` as the primary source of truth.
 *
 * Checks:
 *   1. JSONL Integrity: every line parses, required fields present (id, date, title)
 *   2. Duplicate ID detection within JSONL
 *   3. Coverage gap detection (sequential numeric ID check)
 *   4. Temporal coverage (weeks with no reviews)
 *   5. Consolidation state cross-check (consolidation.json counter vs actual JSONL max ID)
 *   6. Rendered markdown view accuracy (if rendered view exists, cross-check counts)
 *   7. Forward-findings integration: S0/S1 findings appended to forward-findings.jsonl
 *
 * Usage:
 *   npm run reviews:check-archive         # Run all checks
 *   npm run reviews:check-archive -- --json  # Output findings as JSON to stdout
 *
 * Exit codes:
 *   0 = All checks pass
 *   1 = Issues found (any severity)
 *   2 = Script error (cannot run checks)
 *
 * Structured output:
 *   Findings array: [{ severity, category, description, fix }]
 *   Written to stderr as JSON (always), stdout as JSON (with --json flag)
 */

// pattern-compliance: fs/path imports guarded by try/catch (CLAUDE.md Section 5)
let existsSync, readFileSync, mkdirSync;
try {
  ({ existsSync, readFileSync, mkdirSync } = require("node:fs"));
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Failed to load node:fs:", msg);
  process.exit(2);
}

let join, dirname;
try {
  ({ join, dirname } = require("node:path"));
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Failed to load node:path:", msg);
  process.exit(2);
}

let sanitizeError;
try {
  ({ sanitizeError } = require("./lib/security-helpers"));
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Failed to load security-helpers:", msg);
  process.exit(2);
}

let safeAppendFileSync;
try {
  ({ safeAppendFileSync } = require("./lib/safe-fs"));
} catch (err) {
  const msg = sanitizeError ? sanitizeError(err) : "[load error]";
  console.error("Failed to load safe-fs:", msg);
  process.exit(2);
}

const ROOT = join(__dirname, "..");
const REVIEWS_JSONL = join(ROOT, ".claude", "state", "reviews.jsonl");
const CONSOLIDATION_JSON = join(ROOT, ".claude", "state", "consolidation.json");
const FORWARD_FINDINGS_JSONL = join(ROOT, ".claude", "state", "forward-findings.jsonl");
const LEARNINGS_LOG = join(ROOT, "docs", "AI_REVIEW_LEARNINGS_LOG.md");

const cliArgs = process.argv.slice(2);
const jsonMode = cliArgs.includes("--json");

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
  // #441-#451, #458-#459, #462, #465, #468-#469, #477-#479: Collision renumbering artifacts from old sync script (discovered during JSONL-canonical migration)
  441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451,
  458, 459, 462, 465, 468, 469, 477, 478, 479,
]);

// Known-duplicate review IDs: IDs that legitimately appear multiple times in JSONL
// due to historical ID reuse across different PR cycles. Both entries contain unique
// learnings and should be preserved.
// - #366-#369: PR #383 R5-R8 reassigned to PRs #384/#389/#394. Verified Session #195.
const KNOWN_DUPLICATE_IDS = new Set([366, 367, 368, 369]);

/** @type {Array<{severity: string, category: string, description: string, fix: string}>} */
const findings = [];

/**
 * Record a finding.
 * @param {"S0"|"S1"|"S2"|"S3"} severity
 * @param {string} category
 * @param {string} description
 * @param {string} fix
 */
function addFinding(severity, category, description, fix) {
  findings.push({ severity, category, description, fix });
  if (!jsonMode) {
    const icon = severity === "S0" || severity === "S1" ? "!!" : "--";
    console.log(`  [${severity}] ${icon} ${description}`);
  }
}

function ok(msg) {
  if (!jsonMode) {
    console.log(`  OK: ${msg}`);
  }
}

/**
 * Group consecutive numbers into ranges for display.
 * e.g. [1,2,3,5,7,8] -> ["#1-#3", "#5", "#7-#8"]
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
 * Read and parse JSONL file into { records, parseErrors }.
 * @returns {{ records: object[], parseErrors: Array<{line: number, raw: string}> }}
 */
function readReviewsJsonl() {
  const result = { records: [], parseErrors: [] };

  // readFileSync throws on I/O failure — caller handles via try/catch
  const content = readFileSync(REVIEWS_JSONL, "utf8").replaceAll("\r\n", "\n");
  const lines = content.trim().split("\n");

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
        result.parseErrors.push({ line: i + 1, raw: trimmed.slice(0, 80) });
        continue;
      }
      result.records.push(parsed);
    } catch {
      result.parseErrors.push({ line: i + 1, raw: trimmed.slice(0, 80) });
    }
  }

  return result;
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
      const { records } = readReviewsJsonl();
      reviews = records;
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

/**
 * Write S0/S1 findings to forward-findings.jsonl (append-only).
 * Uses safeAppendFileSync from safe-fs.js for symlink-guarded writes.
 *
 * @param {Array<{severity: string, category: string, description: string, fix: string}>} allFindings
 */
function writeForwardFindings(allFindings) {
  const critical = allFindings.filter((f) => f.severity === "S0" || f.severity === "S1");
  if (critical.length === 0) return;

  const lines = critical.map((f) =>
    JSON.stringify({
      source_plan: "review-lifecycle",
      finding_type: "gap",
      pattern: f.description,
      severity: f.severity,
      target_ecosystem: "review-lifecycle",
      timestamp: new Date().toISOString(),
    })
  );

  try {
    // Ensure directory exists (FORWARD_FINDINGS_JSONL is already absolute via join)
    mkdirSync(dirname(FORWARD_FINDINGS_JSONL), { recursive: true });
    safeAppendFileSync(FORWARD_FINDINGS_JSONL, lines.join("\n") + "\n");
  } catch (err) {
    // Forward-findings write failure is non-fatal but must be reported
    console.error("Failed to write forward-findings:", sanitizeError(err));
  }
}

function main() {
  if (!jsonMode) {
    console.log("Review Archive Health Check (JSONL-canonical)\n");
  }

  // ──────────────────────────────────────────────────────────────
  // Check 1: JSONL Integrity
  // ──────────────────────────────────────────────────────────────
  if (!jsonMode) console.log("1. JSONL Integrity:");

  if (!existsSync(REVIEWS_JSONL)) {
    addFinding("S0", "jsonl-missing", "reviews.jsonl does not exist", "Create .claude/state/reviews.jsonl or run migration");
    // Cannot proceed without JSONL — output findings and exit
    outputFindings();
    return;
  }

  let data;
  try {
    data = readReviewsJsonl();
  } catch (err) {
    addFinding("S0", "jsonl-unreadable", `reviews.jsonl cannot be read: ${sanitizeError(err)}`, "Check file permissions and encoding");
    outputFindings();
    return;
  }

  const { records, parseErrors } = data;

  // 1a. Parse errors
  if (parseErrors.length > 0) {
    for (const pe of parseErrors) {
      addFinding(
        "S1",
        "jsonl-parse-error",
        `Line ${pe.line} is not valid JSON: ${sanitizeError(pe.raw)}`,
        "Fix or remove the malformed line from reviews.jsonl"
      );
    }
  }

  // 1b. Required fields check
  const REQUIRED_FIELDS = ["id", "date", "title"];
  let missingFieldCount = 0;
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const missing = REQUIRED_FIELDS.filter((f) => record[f] === undefined || record[f] === null);
    if (missing.length > 0) {
      const idLabel = record.id === undefined ? `line ${i + 1}` : `id=${record.id}`;
      // Retrospective entries (type="retrospective") have a different schema —
      // they may lack title. Only require id and date for retrospectives.
      if (record.type === "retrospective") {
        const retroMissing = ["id", "date"].filter((f) => record[f] === undefined || record[f] === null);
        if (retroMissing.length > 0) {
          addFinding(
            "S1",
            "jsonl-missing-fields",
            `Record ${idLabel} (retrospective) missing required fields: ${retroMissing.join(", ")}`,
            "Add missing fields to the JSONL record"
          );
          missingFieldCount++;
        }
      } else {
        addFinding(
          "S2",
          "jsonl-missing-fields",
          `Record ${idLabel} missing required fields: ${missing.join(", ")}`,
          "Add missing fields to the JSONL record"
        );
        missingFieldCount++;
      }
    }
  }

  if (parseErrors.length === 0 && missingFieldCount === 0) {
    ok(`JSONL integrity: ${records.length} records, all valid, all have required fields`);
  } else if (parseErrors.length === 0) {
    ok(`JSONL parse: all ${records.length} records are valid JSON`);
  }
  if (!jsonMode) console.log();

  // ──────────────────────────────────────────────────────────────
  // Check 2: Duplicate ID detection within JSONL
  // ──────────────────────────────────────────────────────────────
  if (!jsonMode) console.log("2. Duplicate ID Check:");

  const idCounts = new Map(); // id -> count
  for (const record of records) {
    const id = record.id;
    if (id === undefined || id === null) continue;
    const key = String(id);
    idCounts.set(key, (idCounts.get(key) || 0) + 1);
  }

  let dupCount = 0;
  let knownDupCount = 0;
  for (const [idStr, count] of idCounts) {
    if (count <= 1) continue;
    const numId = Number.parseInt(idStr, 10);
    if (!Number.isNaN(numId) && KNOWN_DUPLICATE_IDS.has(numId)) {
      knownDupCount++;
      continue;
    }
    addFinding(
      "S1",
      "jsonl-duplicate-id",
      `ID "${idStr}" appears ${count} times in reviews.jsonl`,
      "Remove duplicate entries, keeping the most complete record"
    );
    dupCount++;
  }

  if (knownDupCount > 0 && !jsonMode) {
    console.log(`  INFO: ${knownDupCount} known-duplicate IDs skipped (historical ID reuse)`);
  }
  if (dupCount === 0) {
    ok(`No unexpected duplicates (${idCounts.size} unique IDs)`);
  }
  if (!jsonMode) console.log();

  // ──────────────────────────────────────────────────────────────
  // Check 3: Coverage gap detection (sequential numeric ID check)
  // ──────────────────────────────────────────────────────────────
  if (!jsonMode) console.log("3. Coverage Gaps (numeric IDs):");

  // Extract only numeric IDs (skip string IDs like "retro-427")
  const numericIds = new Set();
  for (const record of records) {
    const id = record.id;
    if (typeof id === "number" && Number.isFinite(id)) {
      numericIds.add(id);
    }
  }

  if (numericIds.size > 0) {
    const MAX_GAP_SCAN_SPAN = 10_000;
    const sortedIds = [...numericIds].sort((a, b) => a - b);
    // nosemgrep: sonash.correctness.no-unchecked-array-access
    const minId = sortedIds[0];
    const maxId = sortedIds.at(-1);
    const span = maxId - minId + 1;

    if (!Number.isFinite(span) || span <= 0 || span > MAX_GAP_SCAN_SPAN) {
      addFinding(
        "S1",
        "gap-scan-overflow",
        `Gap scan range #${minId}-#${maxId} (${span} entries) exceeds cap of ${MAX_GAP_SCAN_SPAN}`,
        "Investigate JSONL for corrupted IDs"
      );
    } else {
      const knownSkipped = [];
      const trulyMissing = [];

      for (let id = minId; id <= maxId; id++) {
        if (!numericIds.has(id)) {
          if (KNOWN_SKIPPED_IDS.has(id)) {
            knownSkipped.push(id);
          } else {
            trulyMissing.push(id);
          }
        }
      }

      if (trulyMissing.length > 0) {
        const ranges = groupConsecutive(trulyMissing);
        addFinding(
          "S2",
          "coverage-gap",
          `${trulyMissing.length} review IDs missing from JSONL: ${ranges.join(", ")}`,
          "Add missing reviews to reviews.jsonl or add IDs to KNOWN_SKIPPED_IDS"
        );
      }

      if (knownSkipped.length > 0 && !jsonMode) {
        console.log(`  INFO: ${knownSkipped.length} known-skipped IDs (never assigned, not a gap)`);
      }

      if (trulyMissing.length === 0 && knownSkipped.length === 0) {
        ok(`Complete coverage: #${minId}-#${maxId} (${numericIds.size} numeric reviews)`);
      } else if (trulyMissing.length === 0) {
        ok(
          `Full coverage: #${minId}-#${maxId} (${numericIds.size} reviews, ${knownSkipped.length} known-skipped)`
        );
      }

      if (!jsonMode) {
        console.log(
          `    Total range: #${minId}-#${maxId} (${numericIds.size} found, ${knownSkipped.length} skipped, ${trulyMissing.length} missing)`
        );
      }
    }
  } else {
    ok("No numeric review IDs found (nothing to gap-check)");
  }
  if (!jsonMode) console.log();

  // ──────────────────────────────────────────────────────────────
  // Check 4: Temporal coverage
  // ──────────────────────────────────────────────────────────────
  if (!jsonMode) console.log("4. Temporal Coverage:");

  const temporalResult = analyzeTemporalCoverage(records);
  if (temporalResult.noData) {
    addFinding(
      "S2",
      "temporal-no-data",
      "No dated reviews found in JSONL — temporal analysis impossible",
      "Ensure reviews have a valid 'date' field in YYYY-MM-DD format"
    );
  } else {
    if (!jsonMode) {
      console.log(`  Weeks with reviews: ${temporalResult.weeksWithReviews}`);
      console.log(`  Weeks with gaps: ${temporalResult.gaps.length}`);
    }
    if (temporalResult.longestGap) {
      if (temporalResult.longestGap.length >= 4) {
        addFinding(
          "S3",
          "temporal-gap",
          `Longest temporal gap: ${temporalResult.longestGap.length} week(s) (${temporalResult.longestGap.start} to ${temporalResult.longestGap.end})`,
          "Investigate if reviews occurred but were not recorded"
        );
      } else if (!jsonMode) {
        console.log(
          `  Longest gap: ${temporalResult.longestGap.length} week(s) (${temporalResult.longestGap.start} to ${temporalResult.longestGap.end})`
        );
      }
    }
    if (temporalResult.gaps.length > 0 && !jsonMode) {
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
  if (!jsonMode) console.log();

  // ──────────────────────────────────────────────────────────────
  // Check 5: Consolidation state cross-check
  // ──────────────────────────────────────────────────────────────
  if (!jsonMode) console.log("5. Consolidation State:");

  if (existsSync(CONSOLIDATION_JSON)) {
    try {
      const cState = JSON.parse(readFileSync(CONSOLIDATION_JSON, "utf8"));
      const lastConsolidated = cState.lastConsolidatedReview;
      const consolidationNumber = cState.consolidationNumber;

      // Cross-check: lastConsolidatedReview should not exceed the max numeric ID in JSONL
      // Use sorted array instead of Math.max(...) to avoid call stack overflow on large sets
      const sortedNumericIds = [...numericIds].sort((a, b) => a - b);
      const jsonlMaxNumericId = sortedNumericIds.length > 0
        ? sortedNumericIds.at(-1)
        : 0;

      if (typeof lastConsolidated !== "number" || !Number.isFinite(lastConsolidated)) {
        addFinding(
          "S1",
          "consolidation-invalid",
          "consolidation.json lastConsolidatedReview is not a valid number",
          "Fix lastConsolidatedReview to be the numeric ID of the last consolidated review"
        );
      } else if (jsonlMaxNumericId === 0) {
        addFinding(
          "S2",
          "consolidation-no-numeric-ids",
          "JSONL contains no numeric IDs — cannot validate consolidation counter",
          "Verify JSONL format or set lastConsolidatedReview to 0"
        );
      } else if (lastConsolidated > jsonlMaxNumericId) {
        addFinding(
          "S1",
          "consolidation-ahead",
          `consolidation.json lastConsolidatedReview (#${lastConsolidated}) exceeds JSONL max ID (#${jsonlMaxNumericId})`,
          "Either add missing reviews to JSONL or correct consolidation.json"
        );
      } else {
        ok(`Consolidation counter: lastConsolidated=#${lastConsolidated}, consolidationNumber=#${consolidationNumber}`);
      }

      if (typeof consolidationNumber !== "number" || !Number.isFinite(consolidationNumber)) {
        addFinding(
          "S2",
          "consolidation-number-invalid",
          "consolidation.json consolidationNumber is not a valid number",
          "Fix consolidationNumber to be the current consolidation count"
        );
      }
    } catch (err) {
      addFinding(
        "S1",
        "consolidation-parse-error",
        `consolidation.json is not valid JSON: ${sanitizeError(err)}`,
        "Fix or regenerate consolidation.json"
      );
    }
  } else {
    addFinding(
      "S2",
      "consolidation-missing",
      "consolidation.json does not exist",
      "Create .claude/state/consolidation.json with lastConsolidatedReview and consolidationNumber"
    );
  }
  if (!jsonMode) console.log();

  // ──────────────────────────────────────────────────────────────
  // Check 6: Rendered markdown view accuracy
  // ──────────────────────────────────────────────────────────────
  if (!jsonMode) console.log("6. Rendered View Accuracy:");

  if (existsSync(LEARNINGS_LOG)) {
    try {
      const logContent = readFileSync(LEARNINGS_LOG, "utf8");

      // Check: "Active reviews" claimed count vs actual heading count in rendered view
      const activeMatch = logContent.match(/\| Active reviews \|\s*(\d+)/);
      if (activeMatch) {
        const claimedActive = Number.parseInt(activeMatch[1], 10);
        // Count reviews in the markdown by heading
        const headingRegex = /^#{2,4}\s+Review\s+#?(\d+)/gm;
        let headingCount = 0;
        while (headingRegex.exec(logContent) !== null) {
          headingCount++;
        }
        if (claimedActive === headingCount) {
          ok(`Rendered view: ${claimedActive} active reviews matches heading count`);
        } else {
          addFinding(
            "S3",
            "rendered-view-drift",
            `Rendered view claims ${claimedActive} active reviews but has ${headingCount} headings`,
            "Re-render the markdown view from JSONL source"
          );
        }
      }

      // Check consolidation number in rendered view vs state file
      if (existsSync(CONSOLIDATION_JSON)) {
        try {
          const cState = JSON.parse(readFileSync(CONSOLIDATION_JSON, "utf8"));
          const stateNumber = cState.consolidationNumber || 0;
          const consolidationMatches = [
            ...logContent.matchAll(/(?:Previous )?Consolidation \(?#(\d+)\)?/g),
          ];
          const mdNumbers = consolidationMatches
            .map((m) => Number.parseInt(m[1], 10))
            .filter((n) => Number.isFinite(n))
            .sort((a, b) => a - b);
          const mdNumber = mdNumbers.length > 0 ? mdNumbers.at(-1) : null;
          if (mdNumber !== null && mdNumber !== stateNumber) {
            addFinding(
              "S3",
              "rendered-consolidation-drift",
              `Rendered view shows consolidation #${mdNumber} but state file says #${stateNumber}`,
              "Re-render the markdown view from JSONL source"
            );
          } else if (mdNumber !== null) {
            ok(`Consolidation number: #${stateNumber} (matches rendered view)`);
          }
        } catch {
          /* already caught in check 5 */
        }
      }
    } catch (err) {
      // Non-fatal — rendered view is optional
      if (!jsonMode) {
        console.log(`  WARN: Could not read rendered view: ${sanitizeError(err)}`);
      }
    }
  } else {
    ok("No rendered markdown view found (optional check)");
  }
  if (!jsonMode) console.log();

  // ──────────────────────────────────────────────────────────────
  // Output and forward-findings
  // ──────────────────────────────────────────────────────────────
  outputFindings();
}

/**
 * Output findings as structured JSON and write forward-findings for S0/S1.
 */
function outputFindings() {
  // Write forward-findings for S0/S1
  writeForwardFindings(findings);

  // Structured output
  if (jsonMode) {
    console.log(JSON.stringify(findings, null, 2));
  } else {
    // Summary
    console.log("\u2500".repeat(50));
    const s0Count = findings.filter((f) => f.severity === "S0").length;
    const s1Count = findings.filter((f) => f.severity === "S1").length;
    const s2Count = findings.filter((f) => f.severity === "S2").length;
    const s3Count = findings.filter((f) => f.severity === "S3").length;

    if (findings.length === 0) {
      console.log("All checks passed");
    } else {
      console.log(
        `${findings.length} finding(s): S0=${s0Count} S1=${s1Count} S2=${s2Count} S3=${s3Count}`
      );
    }
  }

  // Always write findings to stderr as JSON (for programmatic consumption by orchestrator)
  process.stderr.write(JSON.stringify(findings) + "\n");

  // Exit code: 0 if no findings, 1 if any findings exist (T11: fail loud, fail early)
  process.exitCode = findings.length > 0 ? 1 : 0;
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error("Error:", sanitizeError(err));
    process.exitCode = 2;
  }
}

module.exports = { analyzeTemporalCoverage, getISOWeek };
