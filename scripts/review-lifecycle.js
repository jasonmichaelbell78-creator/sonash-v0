#!/usr/bin/env node
/* global __dirname */
/**
 * review-lifecycle.js
 *
 * Central orchestrator for the review lifecycle pipeline.
 * Owns ALL writes to reviews.jsonl during session-start.
 *
 * Sequence (strict, no parallelism):
 *   1. SYNC      - parse markdown reviews -> append new entries to reviews.jsonl
 *                  (transition period; once all callers use write-review-record.ts,
 *                   this step becomes a no-op)
 *   2. VALIDATE  - run check-review-archive.js against JSONL state;
 *                  if issues found -> structured output, exit non-zero
 *   2b. RECONCILE-COMMITS - find PRs with fix commits but no JSONL records
 *   3. RECONCILE - dedup review-metrics.jsonl & reconcile round counts
 *                   from reviews.jsonl (source of truth). Auto-fixes
 *                   cross-database drift detected in VALIDATE.
 *   4. RENDER    - run render-reviews-to-md.ts to regenerate markdown view
 *
 * NOTE: ARCHIVE step removed (2026-04-17). reviews.jsonl is now the single
 * canonical store. reviews-archive.jsonl was merged into reviews.jsonl.
 *
 * Exit codes:
 *   0 = All steps succeeded, no issues
 *   1 = Validation issues found (blocking)
 *   2 = I/O error, corruption, unrecoverable
 *
 * CLI:
 *   node scripts/review-lifecycle.js              # Full lifecycle (default)
 *   node scripts/review-lifecycle.js --sync-only  # Just sync step
 *   node scripts/review-lifecycle.js --validate   # Just validate step
 *   node scripts/review-lifecycle.js --render     # Just render step
 *   node scripts/review-lifecycle.js --dry-run    # Preview all steps, no writes
 */

"use strict";

const fs = require("node:fs");
const pathMod = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = pathMod.join(__dirname, "..");
const REVIEWS_JSONL = pathMod.join(ROOT, ".claude", "state", "reviews.jsonl");
// NOTE: reviews-archive.jsonl was merged into reviews.jsonl (2026-04-17).
// This constant is retained only for the SYNC step's backward-compat dedup.
const REVIEWS_ARCHIVE_JSONL = pathMod.join(ROOT, ".claude", "state", "reviews-archive.jsonl");
const REVIEW_METRICS_JSONL = pathMod.join(ROOT, ".claude", "state", "review-metrics.jsonl");
const LEARNINGS_LOG = pathMod.join(ROOT, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const RENDER_SCRIPT = pathMod.join(ROOT, "scripts", "reviews", "render-reviews-to-md.ts");
const CHECK_ARCHIVE_SCRIPT = pathMod.join(ROOT, "scripts", "check-review-archive.js");

// Archive thresholds removed — single-file store since 2026-04-17

// ── Load dependencies with guarded imports ────────────────────────────────

let sanitizeError;
try {
  ({ sanitizeError } = require("./lib/security-helpers"));
} catch {
  sanitizeError = (err) => (err instanceof Error ? err.message : String(err));
}

let safeWriteFileSync, safeAppendFileSync, safeAtomicWriteSync, isSafeToWrite;
try {
  ({
    safeWriteFileSync,
    safeAppendFileSync,
    safeAtomicWriteSync,
    isSafeToWrite,
  } = require("./lib/safe-fs"));
} catch (err) {
  console.error("safe-fs unavailable:", sanitizeError(err));
  process.exit(2);
}

let readJsonl;
try {
  readJsonl = require("./lib/read-jsonl");
} catch (err) {
  console.error("read-jsonl unavailable:", sanitizeError(err));
  process.exit(2);
}

// ── CLI argument parsing ──────────────────────────────────────────────────

const cliArgs = new Set(process.argv.slice(2));
const syncOnly = cliArgs.has("--sync-only");
const validateOnly = cliArgs.has("--validate");
const reconcileOnly = cliArgs.has("--reconcile");
const reconcileCommitsOnly = cliArgs.has("--reconcile-commits");
const renderOnly = cliArgs.has("--render");
const dryRun = cliArgs.has("--dry-run");

// ── Helpers ───────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[review-lifecycle] ${msg}`);
}

function logStep(step, msg) {
  console.log(`[review-lifecycle] [${step}] ${msg}`);
}

/**
 * Read and parse reviews.jsonl, returning array of parsed objects.
 * Returns empty array if file doesn't exist.
 */
function loadReviews() {
  try {
    return readJsonl(REVIEWS_JSONL, { safe: true, quiet: true });
  } catch (err) {
    if (err && typeof err === "object" && err.code === "ENOENT") return [];
    throw new Error(`Failed to read reviews.jsonl: ${sanitizeError(err)}`);
  }
}

/**
 * Load existing review IDs from JSONL for dedup during sync.
 * Returns Set of string-coerced id values for type-safe comparison.
 * Both numeric IDs (e.g. 42) and string IDs (e.g. "retro-100") are
 * stored as strings so lookup works regardless of the caller's type.
 */
function loadExistingIds(records) {
  const ids = new Set();
  for (const rec of records) {
    if (!rec || typeof rec !== "object") continue;
    if (rec.id !== undefined && rec.id !== null) {
      ids.add(String(rec.id));
    }
  }
  return ids;
}

/**
 * Build composite keys (pr:round) from review records for collision detection.
 * Handles duplicate numeric IDs that refer to different PRs.
 * Returns Set of "PR:ROUND" strings (e.g. "472:R1", "477:R1").
 */
function buildCompositeKeys(records) {
  const composites = new Set();
  for (const rec of records) {
    if (!rec || typeof rec !== "object") continue;
    const prNum = Number(rec.pr);
    if (!Number.isFinite(prNum) || prNum <= 0) continue;
    {
      // Extract round from title (e.g. "PR #472 R1 ..." -> "R1")
      const roundMatch = /R(\d+)/i.exec(rec.title || "");
      if (roundMatch) {
        composites.add(`${prNum}:R${roundMatch[1]}`);
      }
    }
  }
  return composites;
}

// ── STEP 1: SYNC ──────────────────────────────────────────────────────────

/**
 * Simplified markdown parser for transition period.
 * Extracts review entries from AI_REVIEW_LEARNINGS_LOG.md.
 * Handles all header formats:
 *   ### Review #N: ...              (old numeric with #)
 *   ### Review rev-N: ...           (JSONL-era rev-N)
 *   ### Review #N — ...             (intermediate, uses — not :)
 *   ### Review N                    (bare number, no #)
 *   ### Review review-466-r1: ...   (compound ID)
 *   ### Review retro-bulk-448-470:  (retro entries)
 * Returns array of review objects.
 */
function parseMarkdownReviews(content) {
  const reviews = [];
  const lines = content.split("\n");
  let current = null;
  let inFence = false;

  // Non-review headers that start with "Review" but are section headers
  const excludedSuffixes = new Set(["Sources", "Cycle"]);

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Match all review header formats:
    // Captures the ID portion (with optional #) and everything after the separator
    const headerMatch = /^#{2,4}\s+Review\s+#?([^\s:—]+)[\s:—]*(.*)/.exec(line);
    if (headerMatch) {
      // Guard: skip non-review section headers like "Review Sources", "Review Cycle Summary"
      const candidateId = headerMatch[1];
      if (excludedSuffixes.has(candidateId)) continue;

      if (current) reviews.push(current);

      // Preserve numeric IDs as numbers, keep string IDs as strings
      const id = /^\d+$/.test(candidateId) ? Number.parseInt(candidateId, 10) : candidateId;
      const titleAndDate = headerMatch[2].trim();
      const dateMatch = /\((\d{4}-\d{2}-\d{2})\)\s*$/.exec(titleAndDate);
      const date = dateMatch ? dateMatch[1] : "unknown";
      const title = dateMatch
        ? titleAndDate.slice(0, titleAndDate.lastIndexOf("(")).trim()
        : titleAndDate;

      current = {
        id,
        date,
        title: title || "(untitled)",
        source: "manual",
        pr: null,
        patterns: [],
        fixed: 0,
        deferred: 0,
        rejected: 0,
        total: 0,
        learnings: [],
        _rawLines: [],
      };
      continue;
    }

    if (!current) continue;
    current._rawLines.push(line);
  }

  if (current) reviews.push(current);

  // Second pass: extract basic structured fields
  for (const review of reviews) {
    const raw = review._rawLines.join("\n");

    // Source
    const sourceMatch = /\*\*Source:\*\*\s*([^\n*]+)/.exec(raw);
    if (sourceMatch) {
      const src = sourceMatch[1].toLowerCase().trim();
      const parts = [];
      if (src.includes("sonarcloud") || src.includes("sonarqube")) parts.push("sonarcloud");
      if (src.includes("qodo")) parts.push("qodo");
      if (src.includes("ci") || src.includes("github")) parts.push("ci");
      if (src.includes("coderabbit")) parts.push("coderabbit");
      review.source = parts.length > 0 ? parts.join("+") : "manual";
    }

    // PR number — handles "PR #N", "PR: #N", "**PR:** #N", "**PR:** #N"
    const prMatch = /PR[*]*:?\*{0,2}\s*#(\d+)/i.exec(raw);
    if (prMatch) review.pr = Number.parseInt(prMatch[1], 10);

    // Fixed / Deferred / Rejected counts — handles "Fixed: N", "**Fixed:** N"
    const fixedMatch = /Fixed\*{0,2}:\*{0,2}\s*(\d+)/i.exec(raw);
    if (fixedMatch) review.fixed = Number.parseInt(fixedMatch[1], 10);

    const deferredMatch = /Deferred\*{0,2}:\*{0,2}\s*(\d+)/i.exec(raw);
    if (deferredMatch) review.deferred = Number.parseInt(deferredMatch[1], 10);

    const rejectedMatch = /Rejected\*{0,2}:\*{0,2}\s*(\d+)/i.exec(raw);
    if (rejectedMatch) review.rejected = Number.parseInt(rejectedMatch[1], 10);

    // Total — handles "Total: N", "**Total:** N", "N total", "N items"
    const totalMatch =
      /Total\*{0,2}:\*{0,2}\s*(\d+)/i.exec(raw) || /(\d+)\s+(?:total|items)/i.exec(raw);
    if (totalMatch) review.total = Number.parseInt(totalMatch[1], 10);

    // Patterns — extract only from "**Key Patterns:**" or "**Patterns:**" sections
    // Constrained to section boundaries to avoid misclassifying data from other sections
    const lines = review._rawLines;
    const idxPatterns = lines.findIndex((l) =>
      /^\s*\*\*(Key Patterns|Patterns):\*\*\s*$/i.test(l.trim())
    );
    const idxNextAfterPatterns =
      idxPatterns >= 0
        ? lines
            .slice(idxPatterns + 1)
            .findIndex((l) => /^\s*\*\*[^*]+:\*\*/.test(l.trim()) || /^\s*##+\s+/.test(l.trim()))
        : -1;
    const patternWindow =
      idxPatterns >= 0
        ? lines.slice(
            idxPatterns + 1,
            idxNextAfterPatterns >= 0 ? idxPatterns + 1 + idxNextAfterPatterns : undefined
          )
        : [];
    const patternLines = patternWindow.filter((l) => {
      const t = l.trim();
      return (
        (t.startsWith("- **") && t.includes("**:")) ||
        (t.startsWith("- ") && t.length > 20 && t.length < 200)
      );
    });
    if (patternLines.length > 0) {
      review.patterns = patternLines
        .map((l) => {
          const boldMatch = /- \*\*([^*]+)\*\*:?\s*(.*)/.exec(l.trim());
          return boldMatch ? boldMatch[1].trim() : l.trim().slice(2).trim();
        })
        .filter((p) => p.length > 0)
        .slice(0, 15);
    }

    // Learnings — extract only from "**Takeaway:**", "**Lesson:**", or "**Learnings:**" sections
    const idxLearnings = lines.findIndex((l) =>
      /^\s*\*\*(Takeaway|Lesson|Learnings):\*\*/i.test(l.trim())
    );
    const idxNextAfterLearnings =
      idxLearnings >= 0
        ? lines
            .slice(idxLearnings + 1)
            .findIndex((l) => /^\s*\*\*[^*]+:\*\*/.test(l.trim()) || /^\s*##+\s+/.test(l.trim()))
        : -1;
    const learningWindow =
      idxLearnings >= 0
        ? lines.slice(
            idxLearnings,
            idxNextAfterLearnings >= 0 ? idxLearnings + 1 + idxNextAfterLearnings : undefined
          )
        : [];
    const learningLines = learningWindow.filter((l) => {
      const t = l.trim();
      return (
        t.startsWith("**Takeaway:**") ||
        t.startsWith("**Lesson:**") ||
        (t.startsWith("- ") && t.length > 30 && t.length < 300 && !t.startsWith("- **"))
      );
    });
    if (learningLines.length > 0) {
      review.learnings = learningLines
        .map((l) => {
          const prefixMatch = /\*\*(Takeaway|Lesson):\*\*\s*(.+)/.exec(l.trim());
          return prefixMatch ? prefixMatch[2].trim() : l.trim().slice(2).trim();
        })
        .filter((le) => le.length > 0)
        .slice(0, 7);
    }

    delete review._rawLines;
  }

  // Filter parser noise. Two cases:
  //   1. Integrity-failing: total > 0 but dispositions all 0 — mirrors
  //      validateDispositions() criterion. Common source: prose like "N items"
  //      matching the total fallback regex, or stub tables.
  //   2. Empty placeholders: zero everything and no patterns/learnings.
  //      These are markdown header-only entries with no real review content.
  return reviews.filter((r) => {
    // Coerce to numbers so undefined/NaN fields don't poison arithmetic.
    // Parser can legitimately omit fields on malformed or partial entries.
    const total = Number(r.total ?? 0) || 0;
    const fixed = Number(r.fixed ?? 0) || 0;
    const deferred = Number(r.deferred ?? 0) || 0;
    const rejected = Number(r.rejected ?? 0) || 0;
    const dispositionsZero = fixed + deferred + rejected === 0;
    if (total > 0 && dispositionsZero) return false;
    const isEmpty =
      total === 0 &&
      dispositionsZero &&
      (!r.patterns || r.patterns.length === 0) &&
      (!r.learnings || r.learnings.length === 0);
    return !isEmpty;
  });
}

/**
 * SYNC step: parse markdown, find entries not in JSONL, append them.
 * Returns { synced: number, total: number }.
 */
function runSync() {
  logStep("SYNC", "Parsing markdown reviews...");

  // Read directly with try/catch (avoids existsSync race condition)
  let content;
  try {
    content = fs.readFileSync(LEARNINGS_LOG, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      logStep("SYNC", "AI_REVIEW_LEARNINGS_LOG.md not found - skipping sync");
      return { synced: 0, total: 0 };
    }
    throw new Error(`Failed to read learnings log: ${sanitizeError(err)}`);
  }

  const mdReviews = parseMarkdownReviews(content);
  const existingRecords = loadReviews();
  const existingIds = loadExistingIds(existingRecords);

  // Also check archived reviews to avoid re-syncing entries that were already archived
  let archivedRecords = [];
  try {
    archivedRecords = readJsonl(REVIEWS_ARCHIVE_JSONL, { safe: true, quiet: true });
  } catch {
    // Archive file may not exist yet — that's fine
  }
  const archivedIds = loadExistingIds(archivedRecords);

  // Build composite keys (pr:round) to detect ID collisions across different PRs.
  // Example: Review #58 for PR #472 R1 and Review #58 for PR #477 R1 are distinct.
  const allRecords = [...existingRecords, ...archivedRecords];
  const existingComposites = buildCompositeKeys(allRecords);

  // Build content-based dedup set: "pr|date|total|fixed|rejected" for all existing records.
  // This catches duplicates where the same review exists under different ID formats
  // (e.g., numeric "59" in markdown vs "rev-21" in JSONL for the same PR #480 review).
  const contentKeys = new Set();
  for (const rec of allRecords) {
    if (rec.pr && rec.date && typeof rec.total === "number") {
      contentKeys.add(`${rec.pr}|${rec.date}|${rec.total}|${rec.fixed ?? 0}|${rec.rejected ?? 0}`);
    }
  }

  // Filter to reviews not already in JSONL or archive.
  // Uses three dedup layers: (1) ID match, (2) content-key match, (3) composite PR:round match.
  const missing = mdReviews.flatMap((r) => {
    const idStr = String(r.id);
    const idExists = existingIds.has(idStr) || archivedIds.has(idStr);

    if (!idExists) {
      // Secondary check: content-based dedup (same PR + date + counts = same review)
      if (r.pr && r.date && typeof r.total === "number") {
        const contentKey = `${r.pr}|${r.date}|${r.total}|${r.fixed ?? 0}|${r.rejected ?? 0}`;
        if (contentKeys.has(contentKey)) return []; // Already exists under a different ID
      }
      return [r];
    }

    // ID already exists — check if this is a collision (same ID, different PR)
    if (typeof r.pr === "number" && r.pr > 0) {
      const roundMatch = /R(\d+)/i.exec(r.title || "");
      if (roundMatch) {
        const composite = `${r.pr}:R${roundMatch[1]}`;
        if (!existingComposites.has(composite)) {
          // Same review number but different PR — disambiguate the ID
          return [{ ...r, id: `${r.id}-pr${r.pr}` }];
        }
      }
    }
    return [];
  });

  logStep(
    "SYNC",
    `Markdown reviews: ${mdReviews.length}, JSONL existing: ${existingIds.size}, archived: ${archivedIds.size}, new: ${missing.length}`
  );

  if (missing.length === 0) {
    logStep("SYNC", "No new reviews to sync");
    return { synced: 0, total: existingIds.size };
  }

  if (dryRun) {
    logStep("SYNC", `DRY RUN: Would append ${missing.length} entries`);
    return { synced: missing.length, total: existingIds.size + missing.length };
  }

  // Security check before writing
  if (!isSafeToWrite(REVIEWS_JSONL)) {
    throw new Error("Refusing to write: symlink detected at reviews.jsonl");
  }

  // Ensure state directory exists (recursive: true is idempotent — no existsSync needed)
  const stateDir = pathMod.dirname(REVIEWS_JSONL);
  try {
    fs.mkdirSync(stateDir, { recursive: true });
  } catch (mkdirErr) {
    throw new Error(`Failed to create state directory: ${sanitizeError(mkdirErr)}`);
  }

  // Append new entries
  const lines = missing.map((r) => JSON.stringify(r)).join("\n") + "\n";
  try {
    safeAppendFileSync(REVIEWS_JSONL, lines);
  } catch (err) {
    throw new Error(`Failed to append to reviews.jsonl: ${sanitizeError(err)}`);
  }

  const idList = missing.map((r) => "#" + r.id);
  const shown = idList.slice(0, 25).join(", ");
  const more = idList.length > 25 ? `, +${idList.length - 25} more` : "";
  logStep("SYNC", `Appended ${missing.length} entries (IDs: ${shown}${more})`);
  return { synced: missing.length, total: existingIds.size + missing.length };
}

// ── STEP 2b: RECONCILE-COMMITS helpers ────────────────────────────────────

const RECONCILE_CANONICAL_ID = /^review-pr(\d+)-r(\d+)$/i;
const RECONCILE_TITLE_ROUND = /R(\d+)/i;

function toFinitePositiveInt(v) {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  if (typeof v === "string") {
    const n = Number.parseInt(v, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function matchCanonicalId(id) {
  const m = RECONCILE_CANONICAL_ID.exec(String(id ?? ""));
  return m ? `${m[1]}-${m[2]}` : null;
}

function matchTitleRound(title) {
  const m = RECONCILE_TITLE_ROUND.exec(title);
  if (!m) return null;
  const r = Number.parseInt(m[1], 10);
  return Number.isFinite(r) && r > 0 ? r : null;
}

// Build the Set of "{pr}-{round}" keys from reviews.jsonl records. Qodo+Gemini
// R1 #10: supports canonical id precedence, int coercion on legacy string-
// stored fields, and title fallback. Extracted from runReconcileCommits to
// reduce CC and make canonical-ID precedence unit-testable.
function buildJsonlKeys(records) {
  const keys = new Set();
  for (const rec of records) {
    const idKey = matchCanonicalId(rec.id);
    if (idKey) {
      keys.add(idKey);
      continue;
    }
    const pr = toFinitePositiveInt(rec.pr);
    const round = toFinitePositiveInt(rec.round);
    if (pr !== null && round !== null) {
      keys.add(`${pr}-${round}`);
      continue;
    }
    if (pr !== null && typeof rec.title === "string") {
      const roundFromTitle = matchTitleRound(rec.title);
      if (roundFromTitle !== null) keys.add(`${pr}-${roundFromTitle}`);
    }
  }
  return keys;
}

// ── STEP 2b: RECONCILE-COMMITS ────────────────────────────────────────────

/**
 * RECONCILE-COMMITS: find PRs with fix commits but no JSONL records.
 * Scans git log for "fix: PR #N R" patterns and cross-references
 * against reviews.jsonl to detect missing review records.
 *
 * Uses execFileSync (not exec) with hardcoded args — no shell injection risk.
 *
 * Returns { fixCommits: number, matched: number, gaps: string[] }.
 */
// Run the git log scan for fix commits; returns parsed output or null on error.
// SonarCloud S4036 PATH hotspot reviewed 2026-04-18 and marked SAFE:
// hardcoded binary "git", array args, PATH hijack requires prior compromise.
function fetchFixCommitLog() {
  try {
    // Use --perl-regexp with alternation to match both fix prefixes:
    //   "fix: PR #N R..."             (unscoped)
    //   "fix(pr-review): PR #N R..."  (scoped)
    // Qodo R1 #7: previous --grep=fix: PR # missed scoped commits.
    return execFileSync(
      "git",
      ["log", "--all", "--oneline", "--perl-regexp", "--grep=^fix(\\(pr-review\\))?: PR #"],
      {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 30000,
        maxBuffer: 5 * 1024 * 1024,
      }
    );
  } catch (err) {
    if (err?.stdout) return err.stdout.toString();
    logStep("RECONCILE-COMMITS", `git log failed: ${sanitizeError(err)}`);
    return null;
  }
}

// Parse the git-log oneline output into a Map of "{pr}-{round}" -> short sha.
function parseCommitPRs(gitOutput) {
  const commitPRs = new Map();
  for (const line of gitOutput.trim().split("\n").filter(Boolean)) {
    const match = /PR #(\d+)\s+R(\d+)/i.exec(line);
    if (match) {
      const key = `${match[1]}-${match[2]}`;
      if (!commitPRs.has(key)) commitPRs.set(key, line.slice(0, 8));
    }
  }
  return commitPRs;
}

function runReconcileCommits() {
  logStep("RECONCILE-COMMITS", "Scanning git log for review fix commits...");

  const gitOutput = fetchFixCommitLog();
  if (gitOutput === null) return { fixCommits: 0, matched: 0, gaps: [] };

  const commitPRs = parseCommitPRs(gitOutput);
  if (commitPRs.size === 0) {
    logStep("RECONCILE-COMMITS", "No fix commits found");
    return { fixCommits: 0, matched: 0, gaps: [] };
  }

  const jsonlKeys = buildJsonlKeys(loadReviews());
  const gaps = [];
  let matched = 0;
  for (const [key] of commitPRs) {
    if (jsonlKeys.has(key)) matched++;
    else gaps.push(`PR #${key.replace("-", " R")}`);
  }

  logStep(
    "RECONCILE-COMMITS",
    `${commitPRs.size} fix commits, ${matched} have JSONL records, ${gaps.length} gaps`
  );
  if (gaps.length > 0) {
    logStep("RECONCILE-COMMITS", `Missing records for: ${gaps.slice(0, 10).join(", ")}`);
  }

  return { fixCommits: commitPRs.size, matched, gaps };
}

// ── STEP 3: VALIDATE ──────────────────────────────────────────────────────

/**
 * Cross-database validation: checks that reviews.jsonl record counts per PR
 * match review_rounds in review-metrics.jsonl.
 *
 * Returns { mismatches: Array<{pr, metricsRounds, jsonlRecords}> }.
 *
 * Added: Session #218 — Retro action item #3 (cross-database consistency).
 * Version History:
 *   v1.0 2026-03-18 — Initial implementation
 */
/** Count reviews per PR from reviews.jsonl records. */
function countReviewsByPr(reviews) {
  const counts = new Map();
  for (const rec of reviews) {
    if (rec && typeof rec === "object" && typeof rec.pr === "number" && rec.pr > 0) {
      counts.set(rec.pr, (counts.get(rec.pr) || 0) + 1);
    }
  }
  return counts;
}

/** Coerce a PR value to a number when possible, otherwise return as-is. */
function normalizePrKey(pr) {
  const prNum = Number(pr);
  return Number.isFinite(prNum) ? prNum : pr;
}

/** Parse a timestamp string into a comparable score (-Infinity for invalid). */
function parseTimestampScore(timestamp) {
  if (typeof timestamp !== "string") return -Infinity;
  const t = Date.parse(timestamp);
  return Number.isFinite(t) ? t : -Infinity;
}

/** Return true if the new entry should replace the existing one by timestamp. */
function shouldReplaceEntry(existing, entryScore) {
  if (!existing) return true;
  const existingScore = parseTimestampScore(existing.timestamp);
  // last-wins tiebreaker when both timestamps are invalid
  return entryScore > existingScore || (entryScore === -Infinity && existingScore === -Infinity);
}

/** Build map of PR -> latest metrics entry by timestamp.
 *  Normalizes PR keys: coerces string PR values to numbers where possible
 *  so that entries created by bootstrapMissingEntries (which uses string keys)
 *  are properly deduped against numeric-keyed entries from the churn tracker.
 */
function buildLatestMetricsMap(metrics) {
  const latestByPr = new Map();
  for (const entry of metrics) {
    if (!entry || typeof entry !== "object") continue;
    if (entry.pr === undefined || entry.pr === null) continue;
    const prKey = normalizePrKey(entry.pr);
    const entryScore = parseTimestampScore(entry.timestamp);
    if (shouldReplaceEntry(latestByPr.get(prKey), entryScore)) {
      latestByPr.set(prKey, { ...entry, pr: prKey });
    }
  }
  return latestByPr;
}

function runCrossDbValidation() {
  logStep("VALIDATE", "Running cross-database consistency check...");

  const reviews = loadReviews();

  let metrics;
  try {
    metrics = readJsonl(REVIEW_METRICS_JSONL, { safe: true, quiet: true });
  } catch (err) {
    logStep("VALIDATE", `Cannot read review-metrics.jsonl: ${sanitizeError(err)}`);
    return { mismatches: [] };
  }

  if (metrics.length === 0) {
    logStep("VALIDATE", "No metrics entries found - skipping cross-db check");
    return { mismatches: [] };
  }

  const reviewCountsByPr = countReviewsByPr(reviews);
  const metricsRoundsByPr = buildLatestMetricsMap(metrics);

  const mismatches = [];
  for (const [pr, metricsEntry] of metricsRoundsByPr) {
    const jsonlCount = reviewCountsByPr.get(pr);
    if (jsonlCount === undefined) continue;
    const rawRounds = metricsEntry?.review_rounds;
    const coerced = typeof rawRounds === "number" ? rawRounds : Number(rawRounds);
    if (!Number.isFinite(coerced)) continue;
    const metricsRounds = Math.max(0, Math.trunc(coerced));

    if (metricsRounds !== jsonlCount) {
      mismatches.push({ pr, metricsRounds, jsonlRecords: jsonlCount });
      logStep(
        "VALIDATE",
        `  PR #${pr}: metrics says ${metricsRounds} rounds, JSONL has ${jsonlCount} records`
      );
    }
  }

  // Also flag PRs present in JSONL but missing from metrics
  for (const [pr, jsonlCount] of reviewCountsByPr) {
    if (!metricsRoundsByPr.has(pr)) {
      mismatches.push({
        pr,
        metricsRounds: 0,
        jsonlRecords: jsonlCount,
        reason: "missing_metrics",
      });
      logStep("VALIDATE", `  PR #${pr}: metrics missing entry, JSONL has ${jsonlCount} records`);
    }
  }

  if (mismatches.length === 0) {
    logStep("VALIDATE", "Cross-database consistency: OK (all matching PRs agree)");
  } else {
    logStep("VALIDATE", `Cross-database consistency: ${mismatches.length} mismatch(es) found`);
  }

  return { mismatches };
}

/**
 * Disposition integrity validation: flags records where total > 0 but
 * fixed + deferred + rejected == 0.
 *
 * Returns { violations: Array<{id, total, fixed, deferred, rejected}> }.
 *
 * Added: Session #218 — Retro action item #14 (total-vs-dispositions rule).
 * Version History:
 *   v1.0 2026-03-18 — Initial implementation
 */
/** Check a single record for disposition integrity. Returns violation or null. */
/** Coerce value to non-negative integer, defaulting to 0. */
function coerceInt(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

// Legacy records whose disposition data is too broken for heuristic recovery.
// Per session #286 Q4 review: diff between stated total and disposition sum
// exceeds 10 items AND commit lookup cannot reliably reconstruct counts.
// These records remain counted (loadReviews still sees them) but skip the
// integrity check. Stored as strings so `String(rec.id)` normalizes numeric
// and string IDs to a single lookup surface.
const KNOWN_DISPOSITION_GAPS = new Set([
  "181",
  "194",
  "316",
  "317",
  "321",
  "324",
  "336",
  "358",
  "383",
]);

function checkDisposition(rec) {
  if (!rec || typeof rec !== "object") return null;
  if (KNOWN_DISPOSITION_GAPS.has(String(rec.id))) return null;

  const total = coerceInt(rec.total);
  if (total <= 0) return null;

  const fixed = coerceInt(rec.fixed);
  const deferred = coerceInt(rec.deferred);
  const rejected = coerceInt(rec.rejected);
  const dispositionSum = fixed + deferred + rejected;
  const base = {
    id: rec.id ?? null,
    pr: typeof rec.pr === "number" ? rec.pr : null,
    total,
    fixed,
    deferred,
    rejected,
  };

  if (dispositionSum === 0) return base;
  if (dispositionSum === total) return null;

  // Accept double-classification: a single reviewable item can appear in both
  // `fixed` and `rejected` counts across rounds (same SonarCloud finding is
  // rejected in R1, then fixed in R2 via a code change). When that overlap
  // exists, dispositionSum > total by the overlap size. Gemini R1 #13: use
  // `fixed === total` rather than `fixed >= total` — `fixed > total` is itself
  // a data error (more items fixed than reviewed) and should surface rather
  // than be absorbed by the double-classification bypass. Deferred excluded
  // because deferred items are distinct dispositions (not double-counted).
  if (dispositionSum > total && fixed === total && rejected > 0 && deferred === 0) return null;

  return { ...base, reason: "sum_mismatch" };
}

function validateDispositions(records) {
  const items = records || loadReviews();
  const violations = [];

  for (const rec of items) {
    const v = checkDisposition(rec);
    if (v) violations.push(v);
  }

  return { violations };
}

/**
 * VALIDATE step: run check-review-archive.js, cross-database consistency,
 * and disposition integrity checks. Aggregates all findings.
 * Returns { valid: boolean, findings: Array }.
 *
 * Version History:
 *   v1.0 2026-02-10 — Initial implementation (archive check only)
 *   v2.0 2026-03-18 — Add cross-db validation (#3) and disposition check (#14)
 */
function runValidate() {
  logStep("VALIDATE", "Running review archive health check...");

  if (dryRun) {
    logStep("VALIDATE", "DRY RUN: Would run check-review-archive.js --json");
    return { valid: true, findings: [] };
  }

  // ── Phase 1: Archive health check (existing) ──────────────────────────
  let archiveFindings = [];
  try {
    const result = execFileSync(process.execPath, [CHECK_ARCHIVE_SCRIPT, "--json"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 30_000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    try {
      archiveFindings = JSON.parse(result.trim());
    } catch {
      // If stdout isn't valid JSON, no findings
    }
  } catch (err) {
    if (err.status === 2) {
      throw new Error(`check-review-archive.js failed: ${sanitizeError(err)}`);
    }

    // execFileSync throws on non-zero exit (code 1 = findings)
    let parsed = false;
    if (err.stdout) {
      try {
        archiveFindings = JSON.parse(err.stdout.toString().trim());
        parsed = true;
      } catch {
        /* not JSON output */
      }
    }

    if (!parsed && err.stderr) {
      try {
        archiveFindings = JSON.parse(err.stderr.toString().trim());
        parsed = true;
      } catch {
        /* not JSON */
      }
    }

    if (!parsed) {
      throw new Error(`check-review-archive.js failed: ${sanitizeError(err)}`);
    }
  }

  if (archiveFindings.length > 0) {
    const s0 = archiveFindings.filter((f) => f.severity === "S0").length;
    const s1 = archiveFindings.filter((f) => f.severity === "S1").length;
    logStep("VALIDATE", `Archive check: ${archiveFindings.length} finding(s): S0=${s0} S1=${s1}`);
    for (const f of archiveFindings) {
      logStep("VALIDATE", `  [${f.severity}] ${f.description}`);
    }
  } else {
    logStep("VALIDATE", "Archive check: all checks passed");
  }

  // ── Phase 2: Cross-database consistency (Item #3) ─────────────────────
  const crossDbResult = runCrossDbValidation();
  const crossDbFindings = crossDbResult.mismatches.map((m) => ({
    severity: "S2",
    category: "cross-db-mismatch",
    description: `PR #${m.pr}: metrics says ${m.metricsRounds} rounds, JSONL has ${m.jsonlRecords} records`,
    fix: "Update review-metrics.jsonl or investigate missing/extra review records",
  }));

  // ── Phase 3: Disposition integrity (Item #14) ─────────────────────────
  const dispResult = validateDispositions();
  const dispFindings = dispResult.violations.map((v) => {
    const id = typeof v.id === "string" && v.id.trim() ? v.id : "unknown-id";
    const base = `Data integrity violation: record ${id} has total=${v.total} (fixed=${v.fixed}, deferred=${v.deferred}, rejected=${v.rejected})`;
    const description =
      v.reason === "sum_mismatch"
        ? `${base} but dispositions do not sum to total`
        : `${base} but no dispositions were recorded`;
    return {
      severity: "S2",
      category: "disposition-integrity",
      description,
      fix: "Add disposition counts or set total to 0 if no items were reviewed",
    };
  });

  if (dispFindings.length > 0) {
    logStep("VALIDATE", `Disposition check: ${dispFindings.length} violation(s)`);
    // Only log first 10 to avoid noise
    for (const f of dispFindings.slice(0, 10)) {
      logStep("VALIDATE", `  [${f.severity}] ${f.description}`);
    }
    if (dispFindings.length > 10) {
      logStep("VALIDATE", `  ... and ${dispFindings.length - 10} more`);
    }
  } else {
    logStep("VALIDATE", "Disposition check: all records consistent");
  }

  // ── Aggregate all findings ─────────────────────────────────────────────
  const allFindings = [...archiveFindings, ...crossDbFindings, ...dispFindings];

  if (allFindings.length === 0) {
    logStep("VALIDATE", "All validation checks passed");
    return { valid: true, findings: [] };
  }

  return { valid: false, findings: allFindings };
}

// ── STEP 3b: RECONCILE ───────────────────────────────────────────────────

/**
 * RECONCILE step: dedup review-metrics.jsonl and reconcile round counts
 * from reviews.jsonl (source of truth). Runs after VALIDATE so it can
 * fix the cross-database mismatches that were just detected.
 *
 * Operations:
 *   1. Dedup metrics — keep only the latest entry per PR (by timestamp)
 *   2. Update review_rounds — set to actual JSONL record count per PR
 *   3. Add missing entries — PRs in reviews.jsonl but not in metrics
 *   4. Atomic rewrite of the metrics file
 *
 * Returns { deduped: number, reconciled: number, added: number }.
 *
 * Added: Session #238 — Fix cross-database drift between reviews.jsonl
 *        and review-metrics.jsonl. reviews.jsonl is source of truth.
 */

/**
 * Build a map of the latest review per PR, keyed by normalized (string) PR id.
 * Uses timestamp for deterministic selection; invalid timestamps treated as -Infinity.
 */
function buildLatestReviewByPr(reviews) {
  const map = new Map();
  for (const r of reviews) {
    if (!r || typeof r !== "object") continue;
    if (r.pr === undefined || r.pr === null) continue;
    const rKey = String(r.pr);
    const prev = map.get(rKey);
    const rTimeRaw = Date.parse(r.timestamp || r.created_at || r.updated_at || "");
    const rTime = Number.isFinite(rTimeRaw) ? rTimeRaw : Number.NEGATIVE_INFINITY;
    const prevTimeRaw = prev
      ? Date.parse(prev.timestamp || prev.created_at || prev.updated_at || "")
      : Number.NEGATIVE_INFINITY;
    const prevTime = Number.isFinite(prevTimeRaw) ? prevTimeRaw : Number.NEGATIVE_INFINITY;
    if (!prev || rTime >= prevTime) {
      map.set(rKey, r);
    }
  }
  return map;
}

/**
 * Bootstrap metrics entries for PRs present in reviews but absent from metrics.
 * Mutates dedupedEntries in place; returns the count of entries added.
 *
 * Uses numeric PR keys when possible to stay consistent with buildLatestMetricsMap
 * normalization — prevents string/number key mismatches that cause phantom duplicates.
 */
function bootstrapMissingEntries(dedupedEntries, reviewCountsNorm, latestReviewByPr) {
  // Build lookup using the same normalization as buildLatestMetricsMap
  const existingPrs = new Set(
    dedupedEntries.map((e) => {
      const n = Number(e.pr);
      return Number.isFinite(n) ? n : String(e.pr);
    })
  );
  let addedCount = 0;
  for (const [prKey, jsonlCount] of reviewCountsNorm) {
    // Normalize the lookup key the same way
    const prNum = Number(prKey);
    const normalizedKey = Number.isFinite(prNum) ? prNum : prKey;
    if (!existingPrs.has(normalizedKey)) {
      const latestReview = latestReviewByPr.get(prKey) || {};
      dedupedEntries.push({
        pr: normalizedKey,
        title: latestReview.title || `PR #${prKey}`,
        total_commits: 0,
        fix_commits: 0,
        fix_ratio: 0,
        review_rounds: jsonlCount,
        jsonl_review_records: jsonlCount,
        timestamp: new Date().toISOString(),
        reconciled_at: new Date().toISOString(),
        source: "reconciled-from-jsonl",
      });
      existingPrs.add(normalizedKey);
      addedCount++;
    }
  }
  return addedCount;
}

/**
 * Sort entries by PR number for readability, with deterministic fallback
 * for non-numeric identifiers.
 */
function sortByPr(entries) {
  entries.sort((a, b) => {
    const aNum = Number(a.pr);
    const bNum = Number(b.pr);
    if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
    if (Number.isFinite(aNum)) return -1;
    if (Number.isFinite(bNum)) return 1;
    return String(a.pr).localeCompare(String(b.pr));
  });
}

function runReconcile() {
  logStep("RECONCILE", "Deduplicating and reconciling review-metrics.jsonl...");

  // Load both data sources
  // safe: true makes readJsonl return [] on ENOENT (no separate catch needed)
  const metrics = readJsonl(REVIEW_METRICS_JSONL, { safe: true, quiet: true });
  const reviews = loadReviews();
  // Normalize PR keys to strings for consistent map/set lookups
  const reviewCountsNorm = new Map(
    Array.from(countReviewsByPr(reviews).entries()).map(([pr, cnt]) => [String(pr), cnt])
  );

  if (metrics.length === 0 && reviewCountsNorm.size === 0) {
    logStep("RECONCILE", "No metrics entries and no reviews — nothing to reconcile");
    return { deduped: 0, reconciled: 0, added: 0 };
  }

  // ── Step 1: Dedup — keep latest entry per PR ──────────────────────────
  const originalCount = metrics.length;
  const latestByPr = buildLatestMetricsMap(metrics);
  const dedupedEntriesRaw = Array.from(latestByPr.values());
  const dedupedCount = originalCount - dedupedEntriesRaw.length;
  const dedupedEntries = dedupedEntriesRaw.filter(
    (e) => e && typeof e === "object" && e.pr !== undefined && e.pr !== null
  );
  const malformedCount = dedupedEntriesRaw.length - dedupedEntries.length;

  // ── Step 2: Reconcile round counts from JSONL source of truth ─────────
  let reconciledCount = 0;
  for (const entry of dedupedEntries) {
    const jsonlCount = reviewCountsNorm.get(String(entry.pr));
    if (jsonlCount === undefined) continue;
    if (entry.review_rounds !== jsonlCount || entry.jsonl_review_records !== jsonlCount) {
      entry.review_rounds = jsonlCount;
      entry.jsonl_review_records = jsonlCount;
      entry.reconciled_at = new Date().toISOString();
      reconciledCount++;
    }
  }

  // ── Step 3: Add missing entries for PRs in JSONL but not metrics ──────
  const latestReviewByPr = buildLatestReviewByPr(reviews);
  const addedCount = bootstrapMissingEntries(dedupedEntries, reviewCountsNorm, latestReviewByPr);

  // ── Step 4: Write deduped + reconciled metrics file ───────────────────
  if (dedupedCount === 0 && reconciledCount === 0 && addedCount === 0) {
    logStep("RECONCILE", "Metrics already consistent — no changes needed");
    return { deduped: 0, reconciled: 0, added: 0 };
  }

  sortByPr(dedupedEntries);

  if (dryRun) {
    logStep(
      "RECONCILE",
      `DRY RUN: ${dedupedCount} deduped, ${malformedCount} malformed, ${reconciledCount} reconciled, ${addedCount} added (${dedupedEntries.length} total)`
    );
    return { deduped: dedupedCount, reconciled: reconciledCount, added: addedCount };
  }

  if (!isSafeToWrite(REVIEW_METRICS_JSONL)) {
    throw new Error("Refusing to write: symlink detected at review-metrics.jsonl");
  }

  const output = dedupedEntries.map((e) => JSON.stringify(e)).join("\n") + "\n";
  try {
    safeAtomicWriteSync(REVIEW_METRICS_JSONL, output, { encoding: "utf8" });
  } catch (err) {
    throw new Error(`Failed to write reconciled review-metrics.jsonl: ${sanitizeError(err)}`);
  }

  logStep(
    "RECONCILE",
    `Done: ${dedupedCount} deduped, ${malformedCount} malformed, ${reconciledCount} reconciled, ${addedCount} added (${dedupedEntries.length} total)`
  );
  return { deduped: dedupedCount, reconciled: reconciledCount, added: addedCount };
}

// ── STEP 4: RENDER ────────────────────────────────────────────────────────

/**
 * Resolve the tsx CLI entry point from node_modules.
 * Uses require.resolve to find the installed tsx package, avoiding shell: true.
 */
function resolveTsxCli() {
  try {
    return require.resolve("tsx/cli");
  } catch {
    // Fallback: resolve relative to project root
    const fallback = pathMod.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");
    try {
      fs.accessSync(fallback);
      return fallback;
    } catch {
      throw new Error("tsx CLI not found — install tsx: npm install tsx");
    }
  }
}

/**
 * RENDER step: run render-reviews-to-md.ts via tsx to regenerate markdown.
 * Uses node + tsx CLI entry point directly (no shell: true needed).
 * Returns { success: boolean, recordCount: number | null }.
 */
function runRender() {
  logStep("RENDER", "Regenerating markdown view from JSONL...");

  if (dryRun) {
    logStep("RENDER", "DRY RUN: Would run render-reviews-to-md.ts");
    return { success: true, recordCount: null };
  }

  const tsxCli = resolveTsxCli();

  try {
    const result = execFileSync(process.execPath, [tsxCli, RENDER_SCRIPT], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 30_000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Parse output for record count
    let recordCount = null;
    const countMatch = (result || "").match(/(\d+)\s+record/);
    if (countMatch) {
      recordCount = Number.parseInt(countMatch[1], 10);
    }

    logStep(
      "RENDER",
      recordCount === null ? "Rendered successfully" : `Rendered ${recordCount} records`
    );
    return { success: true, recordCount };
  } catch (err) {
    const stderr = err.stderr ? sanitizeError(err.stderr.toString().trim()) : "";
    const stdout = err.stdout ? sanitizeError(err.stdout.toString().trim()) : "";
    throw new Error(
      `render-reviews-to-md.ts failed: ${sanitizeError(err)}${stderr ? " | " + stderr : ""}${stdout ? " | " + stdout : ""}`
    );
  }
}

/**
 * Set process exit code based on pre- and post-reconcile validation.
 * If initial validation failed but reconcile made changes, re-validate
 * to check if the issues were resolved.
 */
function setExitCodeFromValidation(validateResult, reconcileResult) {
  if (validateResult.valid) return;
  const reconcileApplied =
    reconcileResult.deduped + reconcileResult.reconciled + reconcileResult.added > 0;
  if (!reconcileApplied) {
    process.exitCode = 1;
    return;
  }
  // Reconcile changed data — re-validate to check if issues are resolved
  const postResult = runValidate();
  if (postResult.valid) {
    log("  NOTE: Validation issues were auto-fixed by RECONCILE");
  } else {
    process.exitCode = 1;
  }
}

// ── Main orchestrator ─────────────────────────────────────────────────────

function main() {
  const startTime = Date.now();
  log(`Starting review lifecycle${dryRun ? " (DRY RUN)" : ""}...`);

  try {
    // Single-step modes
    if (syncOnly) {
      runSync();
      return;
    }

    if (validateOnly) {
      const result = runValidate();
      if (!result.valid) {
        process.exitCode = 1;
      }
      return;
    }

    if (reconcileCommitsOnly) {
      runReconcileCommits();
      return;
    }

    if (reconcileOnly) {
      runReconcile();
      return;
    }

    if (renderOnly) {
      runRender();
      return;
    }

    // Full lifecycle sequence (strict order, no parallelism)

    // Step 1: SYNC
    const syncResult = runSync();

    // Step 2: VALIDATE
    const validateResult = runValidate();

    // Step 2b: RECONCILE-COMMITS (find fix commits without JSONL records)
    const commitResult = runReconcileCommits();

    // Step 3: RECONCILE (fix cross-db drift detected by VALIDATE)
    const reconcileResult = runReconcile();

    // Step 4: RENDER
    const renderResult = runRender();

    // Summary
    const elapsed = Date.now() - startTime;
    log(`Lifecycle complete in ${elapsed}ms`);
    log(`  SYNC:     ${syncResult.synced} new entries (${syncResult.total} total)`);
    const validateMsg = validateResult.valid
      ? "PASS"
      : "FAIL (" + validateResult.findings.length + " findings)";
    log(`  VALIDATE: ${validateMsg}`);
    const commitMsg =
      commitResult.gaps.length > 0
        ? `${commitResult.gaps.length} gap(s) — fix commits without JSONL records`
        : `OK (${commitResult.matched}/${commitResult.fixCommits} matched)`;
    log(`  RECONCILE-COMMITS: ${commitMsg}`);
    const reconcileMsg =
      reconcileResult.deduped + reconcileResult.reconciled + reconcileResult.added > 0
        ? `${reconcileResult.deduped} deduped, ${reconcileResult.reconciled} reconciled, ${reconcileResult.added} added`
        : "OK (no changes)";
    log(`  RECONCILE: ${reconcileMsg}`);
    const renderStatus = renderResult.success ? "OK" : "FAILED";
    const renderCount =
      renderResult.recordCount !== null ? " (" + renderResult.recordCount + " records)" : "";
    log(`  RENDER:   ${renderStatus}${renderCount}`);

    // Re-validate after reconcile to get accurate exit code
    setExitCodeFromValidation(validateResult, reconcileResult);
  } catch (err) {
    log(`ERROR: ${sanitizeError(err)}`);
    process.exitCode = 2;
  }
}

// ── Exports for testing ───────────────────────────────────────────────────

if (require.main === module) {
  main();
}

module.exports = {
  parseMarkdownReviews,
  loadReviews,
  loadExistingIds,
  buildCompositeKeys,
  runSync,
  runReconcileCommits,
  runValidate,
  runRender,
  // New validation functions (Session #218)
  runCrossDbValidation,
  validateDispositions,
  // Reconciliation (Session #238)
  runReconcile,
};
