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
/** Coerce to non-negative integer, defaulting to fallback. */
function toNonNegInt(v, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : fallback;
}

/** Validate PR number: positive integer or null. */
function normalizePr(raw) {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0 ? n : null;
}

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
    pr: normalizePr(eco.pr),
    patterns: Array.isArray(eco.patterns) ? eco.patterns : [],
    fixed: toNonNegInt(eco.fixed),
    deferred: toNonNegInt(eco.deferred),
    rejected: toNonNegInt(eco.rejected),
    critical: toNonNegInt(sev.critical),
    major: toNonNegInt(sev.major),
    minor: toNonNegInt(sev.minor),
    trivial: toNonNegInt(sev.trivial),
    total: toNonNegInt(eco.total),
    learnings: Array.isArray(eco.learnings) ? eco.learnings : [],
  };
}

/** Ensure directory exists and file is not a symlink, then append lines. */
function safeAppend(filePath, lines) {
  const resolved = path.resolve(filePath);
  const rel = path.relative(ROOT, resolved);
  if (/^\.\.(?:[\\/]|$)/.test(rel)) {
    console.error(`  ERROR: Refusing to write outside repo root: ${resolved}`);
    process.exit(2);
  }

  const dir = path.dirname(resolved);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch { /* existsSync race */ }

  try {
    if (fs.lstatSync(resolved).isSymbolicLink()) {
      console.error(`  ERROR: ${path.basename(resolved)} is a symlink — refusing to write`);
      process.exit(2);
    }
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? e.code : null;
    if (code !== "ENOENT") throw e;
  }

  const content = lines.map((r) => JSON.stringify(r)).join("\n") + "\n";
  fs.appendFileSync(resolved, content);
}

/** Check if a record has real review data. */
function hasRealData(r) {
  return (r.total ?? 0) > 0 || (r.fixed ?? 0) > 0;
}

/** Migrate reviews from ecosystem-v2 to state. Returns { normalized, noPrCount }. */
function migrateReviews(apply) {
  console.log("--- Reviews Migration ---");
  const reviewSource = findSourceFile(ECO_V2_REVIEWS);
  if (!reviewSource) {
    console.error(`  ERROR: No source file found at ${ECO_V2_REVIEWS} (or archived variant)`);
    process.exit(1);
  }
  console.log(`  Source: ${path.basename(reviewSource)}`);
  const ecoReviews = readJsonl(reviewSource);
  const stateIds = new Set(readJsonl(STATE_REVIEWS).map((r) => String(r.id)));

  const candidates = ecoReviews.filter((r) => hasRealData(r) && r.pr != null && !stateIds.has(String(r.id)));
  const noPrCount = ecoReviews.filter((r) => hasRealData(r) && r.pr == null && !stateIds.has(String(r.id))).length;
  const normalized = candidates.map(normalizeReviewRecord);

  console.log(`  ecosystem-v2: ${ecoReviews.length} records`);
  console.log(`  Candidates: ${candidates.length} | Skipped (no PR): ${noPrCount} | Stubs: ${ecoReviews.length - candidates.length - noPrCount}`);

  if (apply) {
    safeAppend(STATE_REVIEWS, normalized);
    console.log(`  ✓ Appended ${normalized.length} records`);
  } else {
    console.log(`  [DRY RUN] Would append ${normalized.length} records`);
  }
  return { normalized, noPrCount };
}

/** Migrate retros from ecosystem-v2 to state. Returns candidate count. */
function migrateRetros(apply) {
  console.log("\n--- Retros Migration ---");
  const retroSource = findSourceFile(ECO_V2_RETROS);
  if (!retroSource) {
    console.warn("  WARNING: No retro source file found — skipping");
    return 0;
  }
  const ecoRetros = readJsonl(retroSource);
  let stateRetros = [];
  try { stateRetros = readJsonl(STATE_RETROS); } catch { /* may not exist */ }

  const retroStateIds = new Set(stateRetros.map((r) => String(r.id)));
  const retroCandidates = ecoRetros.filter((r) => !retroStateIds.has(String(r.id)));

  console.log(`  ecosystem-v2: ${ecoRetros.length} | state: ${stateRetros.length} | candidates: ${retroCandidates.length}`);

  if (apply && retroCandidates.length > 0) {
    safeAppend(STATE_RETROS, retroCandidates);
    console.log(`  ✓ Appended ${retroCandidates.length} records`);
  } else if (retroCandidates.length > 0) {
    console.log(`  [DRY RUN] Would append ${retroCandidates.length} records`);
  }
  return retroCandidates.length;
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

  const { normalized, noPrCount } = migrateReviews(apply);
  const retroCount = migrateRetros(apply);

  console.log("\n=== Migration Summary ===");
  console.log(`  Reviews: ${normalized.length} recovered (${noPrCount} pr-less skipped)`);
  console.log(`  Retros: ${retroCount} recovered`);
  if (dryRun) {
    console.log("\n  Run with --apply to execute migration.");
  } else {
    console.log("\n  ✓ Migration complete. Run review-lifecycle.js to archive + render.");
  }
}

main();
