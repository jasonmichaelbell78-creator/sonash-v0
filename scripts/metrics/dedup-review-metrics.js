#!/usr/bin/env node
/* global __dirname */
/**
 * dedup-review-metrics.js - Deduplicate review-metrics.jsonl
 *
 * Purpose: Remove duplicate entries per PR, keeping only the latest entry
 * for each PR number. Also recalculates review_rounds from reviews.jsonl
 * actual record counts when available.
 *
 * Usage:
 *   node scripts/metrics/dedup-review-metrics.js              # Run dedup
 *   node scripts/metrics/dedup-review-metrics.js --dry-run    # Preview only
 *
 * Exit codes:
 *   0 = Success
 *   1 = Validation issues
 *   2 = I/O or script error
 *
 * Version History:
 *   v1.0 2026-03-18 - Initial implementation (retro action item #8)
 */

"use strict";

const fs = require("node:fs");
const pathMod = require("node:path");

const ROOT = pathMod.join(__dirname, "..", "..");
const STATE_DIR = pathMod.join(ROOT, ".claude", "state");
const METRICS_FILE = pathMod.join(STATE_DIR, "review-metrics.jsonl");
const REVIEWS_FILE = pathMod.join(STATE_DIR, "reviews.jsonl");

// ── Load dependencies with guarded imports ────────────────────────────────

let sanitizeError;
try {
  ({ sanitizeError } = require("../lib/security-helpers"));
} catch {
  sanitizeError = (err) => (err instanceof Error ? err.message : String(err));
}

let readJsonl;
try {
  readJsonl = require("../lib/read-jsonl");
} catch (err) {
  console.error("read-jsonl unavailable:", sanitizeError(err));
  process.exit(2);
}

let safeAtomicWriteSync, isSafeToWrite;
try {
  ({ safeAtomicWriteSync, isSafeToWrite } = require("../lib/safe-fs"));
} catch (err) {
  console.error("safe-fs unavailable:", sanitizeError(err));
  process.exit(2);
}

// ── CLI ───────────────────────────────────────────────────────────────────

const dryRun = process.argv.includes("--dry-run");

// ── Core dedup logic ──────────────────────────────────────────────────────

/**
 * Deduplicate metrics entries, keeping only the latest per PR.
 * Optionally recalculates review_rounds from reviews.jsonl record counts.
 *
 * @param {object[]} metricsEntries - Array of parsed metrics JSONL entries
 * @param {Map<number, number>} [reviewCountsByPr] - PR -> record count from reviews.jsonl
 * @returns {{ deduped: object[], removedCount: number, updatedRounds: number }}
 */
function dedupMetrics(metricsEntries, reviewCountsByPr) {
  // Group by PR, keeping only the latest entry (by timestamp)
  const latestByPr = new Map();

  for (const entry of metricsEntries) {
    if (!entry || typeof entry !== "object" || typeof entry.pr !== "number") continue;
    const existing = latestByPr.get(entry.pr);

    if (
      !existing ||
      (entry.timestamp && (!existing.timestamp || entry.timestamp > existing.timestamp))
    ) {
      latestByPr.set(entry.pr, { ...entry });
    }
  }

  // Update review_rounds from reviews.jsonl if available
  let updatedRounds = 0;
  if (reviewCountsByPr) {
    for (const [pr, entry] of latestByPr) {
      const jsonlCount = reviewCountsByPr.get(pr);
      if (typeof jsonlCount === "number" && jsonlCount > 0) {
        if (entry.review_rounds !== jsonlCount) {
          entry.jsonl_review_records = jsonlCount;
          updatedRounds++;
        }
      }
    }
  }

  const deduped = [...latestByPr.values()];
  const removedCount = metricsEntries.length - deduped.length;

  return { deduped, removedCount, updatedRounds };
}

/**
 * Load reviews.jsonl and count records per PR.
 * @returns {Map<number, number>} PR number -> record count
 */
function loadReviewCountsByPr() {
  const counts = new Map();
  let records;
  try {
    records = readJsonl(REVIEWS_FILE, { safe: true, quiet: true });
  } catch {
    return counts;
  }

  for (const rec of records) {
    if (rec && typeof rec === "object" && typeof rec.pr === "number" && rec.pr > 0) {
      counts.set(rec.pr, (counts.get(rec.pr) || 0) + 1);
    }
  }

  return counts;
}

/**
 * Main entry point.
 */
function main() {
  console.log(`Dedup Review Metrics${dryRun ? " (DRY RUN)" : ""}`);
  console.log("=".repeat(40));

  // Read metrics file
  let entries;
  try {
    entries = readJsonl(METRICS_FILE, { safe: false, quiet: false });
  } catch (err) {
    console.error(`Failed to read metrics file: ${sanitizeError(err)}`);
    process.exit(2);
  }

  console.log(`\nEntries before dedup: ${entries.length}`);

  // Count duplicates per PR
  const prCounts = new Map();
  for (const e of entries) {
    if (e && typeof e.pr === "number") {
      prCounts.set(e.pr, (prCounts.get(e.pr) || 0) + 1);
    }
  }
  const dupPrs = [...prCounts.entries()].filter(([, c]) => c > 1);
  if (dupPrs.length > 0) {
    console.log(`Duplicated PRs: ${dupPrs.length}`);
    for (const [pr, count] of dupPrs.sort((a, b) => b[1] - a[1])) {
      console.log(`  PR #${pr}: ${count} entries`);
    }
  } else {
    console.log("No duplicates found.");
    return;
  }

  // Load review counts for round correction
  const reviewCounts = loadReviewCountsByPr();

  // Dedup
  const { deduped, removedCount, updatedRounds } = dedupMetrics(entries, reviewCounts);

  console.log(`\nEntries after dedup: ${deduped.length}`);
  console.log(`Removed: ${removedCount}`);
  if (updatedRounds > 0) {
    console.log(`Round counts annotated with JSONL data: ${updatedRounds}`);
  }

  if (dryRun) {
    console.log("\nDRY RUN: No changes written.");
    return;
  }

  // Write back
  if (!isSafeToWrite(METRICS_FILE)) {
    console.error("Refusing to write: symlink detected at review-metrics.jsonl");
    process.exit(2);
  }

  const content = deduped.map((e) => JSON.stringify(e)).join("\n") + "\n";
  try {
    safeAtomicWriteSync(METRICS_FILE, content, { encoding: "utf8" });
  } catch (err) {
    console.error(`Failed to write deduped metrics: ${sanitizeError(err)}`);
    process.exit(2);
  }

  console.log(`\nDeduped file written to ${METRICS_FILE}`);
}

// ── Exports for testing ───────────────────────────────────────────────────

if (require.main === module) {
  main();
}

module.exports = { dedupMetrics };
