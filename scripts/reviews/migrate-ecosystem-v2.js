/**
 * One-time migration: recover orphaned review records from data/ecosystem-v2/reviews.jsonl
 * into the canonical .claude/state/reviews.jsonl.
 *
 * Root cause: write-review-record.ts wrote to ecosystem-v2 but all readers
 * (render-reviews-to-md.ts, review-lifecycle.js) read from .claude/state/.
 * This script merges the orphaned data.
 *
 * Usage:
 *   node scripts/reviews/migrate-ecosystem-v2.js --dry-run   (preview)
 *   node scripts/reviews/migrate-ecosystem-v2.js --apply      (execute)
 *
 * Purpose: One-time data recovery for review pipeline split-brain bug.
 * Version History:
 *   v1.0 2026-03-18 — Initial creation for pipeline fracture recovery
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

// Walk up from __dirname until we find package.json
function findProjectRoot(startDir) {
  let dir = startDir;
  for (;;) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      // existsSync race condition
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not find project root");
    dir = parent;
  }
}

const ROOT = findProjectRoot(__dirname);
const ECO_V2_REVIEWS = path.join(ROOT, "data", "ecosystem-v2", "reviews.jsonl");
const STATE_REVIEWS = path.join(ROOT, ".claude", "state", "reviews.jsonl");
const ECO_V2_RETROS = path.join(ROOT, "data", "ecosystem-v2", "retros.jsonl");
const STATE_RETROS = path.join(ROOT, ".claude", "state", "retros.jsonl");

function readJsonl(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8").trim();
    if (!content) return [];
    return content.split("\n").map((line, idx) => {
      try {
        return JSON.parse(line);
      } catch {
        console.warn(`  Skipping malformed line ${idx + 1} in ${path.basename(filePath)}`);
        return null;
      }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Find source file, falling back to the latest .archived-* variant.
 * Returns null if neither exists.
 */
function findSourceFile(basePath) {
  try {
    if (fs.existsSync(basePath)) return basePath;
  } catch { /* race condition */ }

  // Look for archived variants
  const dir = path.dirname(basePath);
  const base = path.basename(basePath);
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return null;
  }

  const archived = entries
    .filter((e) => e.startsWith(base + ".archived-"))
    .sort()
    .pop(); // Latest archived version

  return archived ? path.join(dir, archived) : null;
}

/**
 * Normalize an ecosystem-v2 review record to match state schema.
 * Extracts severity_breakdown into top-level fields.
 */
function normalizeReviewRecord(eco) {
  const sev = eco.severity_breakdown || {};
  return {
    id: eco.id,
    date: eco.date || "unknown",
    schema_version: typeof eco.schema_version === "number" ? eco.schema_version : 1,
    completeness: eco.completeness || "full",
    completeness_missing: Array.isArray(eco.completeness_missing) ? eco.completeness_missing : [],
    origin: eco.origin && typeof eco.origin === "object"
      ? eco.origin
      : { type: "migration", tool: "migrate-ecosystem-v2" },
    title: eco.title || "",
    source: eco.source || "manual",
    pr: eco.pr ?? null,
    patterns: Array.isArray(eco.patterns) ? eco.patterns : [],
    fixed: eco.fixed ?? 0,
    deferred: eco.deferred ?? 0,
    rejected: eco.rejected ?? 0,
    critical: sev.critical ?? 0,
    major: sev.major ?? 0,
    minor: sev.minor ?? 0,
    trivial: sev.trivial ?? 0,
    total: eco.total ?? 0,
    learnings: Array.isArray(eco.learnings) ? eco.learnings : [],
  };
}

/** Ensure directory exists and file is not a symlink, then append lines. */
function safeAppend(filePath, lines) {
  const dir = path.dirname(filePath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch { /* existsSync race */ }

  try {
    if (fs.lstatSync(filePath).isSymbolicLink()) {
      console.error(`  ERROR: ${path.basename(filePath)} is a symlink — refusing to write`);
      process.exit(2);
    }
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? e.code : null;
    if (code !== "ENOENT") throw e;
  }

  const content = lines.map((r) => JSON.stringify(r)).join("\n") + "\n";
  fs.appendFileSync(filePath, content);
}

function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const apply = args.has("--apply");

  if (!dryRun && !apply) {
    console.error("Usage: node migrate-ecosystem-v2.js --dry-run | --apply");
    process.exit(1);
  }

  console.log(`\n=== Review Pipeline Migration (${dryRun ? "DRY RUN" : "APPLY"}) ===\n`);

  // --- REVIEWS ---
  console.log("--- Reviews Migration ---");
  const reviewSource = findSourceFile(ECO_V2_REVIEWS);
  if (!reviewSource) {
    console.error(`  ERROR: No source file found at ${ECO_V2_REVIEWS} (or archived variant)`);
    process.exit(1);
  }
  console.log(`  Source: ${path.basename(reviewSource)}`);
  const ecoReviews = readJsonl(reviewSource);
  const stateReviews = readJsonl(STATE_REVIEWS);
  const stateIds = new Set(stateReviews.map((r) => String(r.id)));

  console.log(`  ecosystem-v2: ${ecoReviews.length} records`);
  console.log(`  .claude/state: ${stateReviews.length} records`);

  // Filter: real data only (total > 0 or fixed > 0), with PR, no ID conflicts
  const candidates = ecoReviews.filter((r) => {
    const total = r.total ?? 0;
    const fixed = r.fixed ?? 0;
    return (total > 0 || fixed > 0) && r.pr != null && !stateIds.has(String(r.id));
  });

  // Also recover records without PR but with real data (as separate category)
  const noPrRecords = ecoReviews.filter((r) => {
    const total = r.total ?? 0;
    const fixed = r.fixed ?? 0;
    return (total > 0 || fixed > 0) && r.pr == null && !stateIds.has(String(r.id));
  });

  console.log(`  Candidates (real + PR + no conflict): ${candidates.length}`);
  console.log(`  Skipped (no PR, real data): ${noPrRecords.length}`);
  console.log(`  Skipped (stubs): ${ecoReviews.length - candidates.length - noPrRecords.length}`);

  // Normalize and prepare
  const normalized = candidates.map(normalizeReviewRecord);

  // Summary by PR
  const prMap = {};
  for (const r of normalized) {
    if (!prMap[r.pr]) prMap[r.pr] = { count: 0, totalItems: 0 };
    prMap[r.pr].count++;
    prMap[r.pr].totalItems += r.total;
  }

  console.log(`\n  PRs to recover (${Object.keys(prMap).length}):`);
  const sortedPrs = Object.keys(prMap).map(Number).sort((a, b) => a - b);
  for (const pr of sortedPrs) {
    const { count, totalItems } = prMap[pr];
    console.log(`    PR #${pr}: ${count} records, ${totalItems} total items`);
  }

  if (apply) {
    safeAppend(STATE_REVIEWS, normalized);
    console.log(`\n  ✓ Appended ${normalized.length} records to ${STATE_REVIEWS}`);
  } else {
    console.log(`\n  [DRY RUN] Would append ${normalized.length} records to ${STATE_REVIEWS}`);
  }

  // --- RETROS ---
  console.log("\n--- Retros Migration ---");
  const retroSource = findSourceFile(ECO_V2_RETROS);
  if (!retroSource) {
    console.warn("  WARNING: No retro source file found — skipping retro migration");
  }
  const ecoRetros = retroSource ? readJsonl(retroSource) : [];

  let stateRetros = [];
  try {
    stateRetros = readJsonl(STATE_RETROS);
  } catch {
    // File may not exist yet
  }

  const retroStateIds = new Set(stateRetros.map((r) => String(r.id)));

  console.log(`  ecosystem-v2: ${ecoRetros.length} records`);
  console.log(`  .claude/state: ${stateRetros.length} records`);

  // Filter: no ID conflicts
  const retroCandidates = ecoRetros.filter((r) => !retroStateIds.has(String(r.id)));
  console.log(`  Candidates (no conflict): ${retroCandidates.length}`);

  if (apply && retroCandidates.length > 0) {
    safeAppend(STATE_RETROS, retroCandidates);
    console.log(`  ✓ Appended ${retroCandidates.length} records to ${STATE_RETROS}`);
  } else if (retroCandidates.length > 0) {
    console.log(`  [DRY RUN] Would append ${retroCandidates.length} records to ${STATE_RETROS}`);
  }

  console.log("\n=== Migration Summary ===");
  console.log(`  Reviews: ${normalized.length} recovered (${noPrRecords.length} pr-less skipped)`);
  console.log(`  Retros: ${retroCandidates.length} recovered`);
  if (dryRun) {
    console.log("\n  Run with --apply to execute migration.");
  } else {
    console.log("\n  ✓ Migration complete. Run review-lifecycle.js to archive + render.");
  }
}

main();
