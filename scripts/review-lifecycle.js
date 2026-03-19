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
 *   2. ARCHIVE   - if reviews.jsonl > threshold entries, archive oldest to
 *                  reviews-archive.jsonl (JSONL append, atomic)
 *   3. VALIDATE  - run check-review-archive.js against JSONL state;
 *                  if issues found -> structured output, exit non-zero
 *   4. RENDER    - run render-reviews-to-md.ts to regenerate markdown view
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
const REVIEWS_ARCHIVE_JSONL = pathMod.join(ROOT, ".claude", "state", "reviews-archive.jsonl");
const REVIEW_METRICS_JSONL = pathMod.join(ROOT, ".claude", "state", "review-metrics.jsonl");
const LEARNINGS_LOG = pathMod.join(ROOT, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const RENDER_SCRIPT = pathMod.join(ROOT, "scripts", "reviews", "render-reviews-to-md.ts");
const CHECK_ARCHIVE_SCRIPT = pathMod.join(ROOT, "scripts", "check-review-archive.js");

// Thresholds
const ARCHIVE_THRESHOLD = 30; // archive when > 30 entries
const KEEP_NEWEST = 20; // keep 20 newest after archiving

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

// ── STEP 1: SYNC ──────────────────────────────────────────────────────────

/**
 * Simplified markdown parser for transition period.
 * Extracts Review #N entries from AI_REVIEW_LEARNINGS_LOG.md.
 * Returns array of review objects.
 */
function parseMarkdownReviews(content) {
  const reviews = [];
  const lines = content.split("\n");
  let current = null;
  let inFence = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Match #### Review #N or ### Review #N or ## Review #N
    const headerMatch = /^#{2,4}\s+Review\s+#(\d+):?\s*(.*)/.exec(line);
    if (headerMatch) {
      if (current) reviews.push(current);

      const id = Number.parseInt(headerMatch[1], 10);
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

  return reviews;
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

  // Filter to reviews not already in JSONL (compare as strings for type safety)
  const missing = mdReviews.filter((r) => !existingIds.has(String(r.id)));

  logStep(
    "SYNC",
    `Markdown reviews: ${mdReviews.length}, JSONL existing: ${existingIds.size}, new: ${missing.length}`
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

// ── STEP 2: ARCHIVE ───────────────────────────────────────────────────────

/**
 * ARCHIVE step: if reviews.jsonl > ARCHIVE_THRESHOLD entries, move oldest
 * to reviews-archive.jsonl, keeping KEEP_NEWEST newest entries.
 *
 * Atomic archive protocol:
 *   1. Write archive entries to temp file
 *   2. Write kept entries to reviews.jsonl (atomic)
 *   3. If step 2 fails, delete temp and abort
 *   4. Append temp contents to reviews-archive.jsonl
 *   5. Delete temp
 *
 * Returns { archived: number, remaining: number }.
 */
function runArchive() {
  logStep("ARCHIVE", "Checking archive threshold...");

  const records = loadReviews();
  logStep("ARCHIVE", `Current entries: ${records.length}, threshold: ${ARCHIVE_THRESHOLD}`);

  if (records.length <= ARCHIVE_THRESHOLD) {
    logStep("ARCHIVE", "Below threshold - no archiving needed");
    return { archived: 0, remaining: records.length };
  }

  // Sort by date (primary) then ID (secondary) for correct archival order
  const ordered = [...records].sort((a, b) => {
    const aDate = typeof a.date === "string" ? Date.parse(a.date) : Number.NaN;
    const bDate = typeof b.date === "string" ? Date.parse(b.date) : Number.NaN;
    // Undated records sort as OLDEST (archive first) via NEGATIVE_INFINITY
    const aSortDate = Number.isFinite(aDate) ? aDate : Number.NEGATIVE_INFINITY;
    const bSortDate = Number.isFinite(bDate) ? bDate : Number.NEGATIVE_INFINITY;
    if (aSortDate !== bSortDate) return aSortDate - bSortDate;
    const aId = typeof a.id === "number" && Number.isFinite(a.id) ? a.id : Number.NaN;
    const bId = typeof b.id === "number" && Number.isFinite(b.id) ? b.id : Number.NaN;
    if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) return aId - bId;
    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  });
  const toKeep = ordered.slice(-KEEP_NEWEST);
  const toArchive = ordered.slice(0, ordered.length - KEEP_NEWEST);

  logStep("ARCHIVE", `Archiving ${toArchive.length} entries, keeping ${toKeep.length} newest`);

  if (dryRun) {
    logStep("ARCHIVE", `DRY RUN: Would archive ${toArchive.length} entries`);
    return { archived: toArchive.length, remaining: toKeep.length };
  }

  // Security checks
  if (!isSafeToWrite(REVIEWS_JSONL)) {
    throw new Error("Refusing to write: symlink detected at reviews.jsonl");
  }
  if (!isSafeToWrite(REVIEWS_ARCHIVE_JSONL)) {
    throw new Error("Refusing to write: symlink detected at reviews-archive.jsonl");
  }

  const archiveLines = toArchive.map((r) => JSON.stringify(r)).join("\n") + "\n";
  const keepLines = toKeep.map((r) => JSON.stringify(r)).join("\n") + "\n";
  const tmpArchive = REVIEWS_ARCHIVE_JSONL + ".tmp." + process.pid;

  // Step 1: Write archive entries to temp file (durable staging artifact)
  if (!isSafeToWrite(tmpArchive)) {
    throw new Error("Refusing to write: symlink detected at archive temp path");
  }
  safeWriteFileSync(tmpArchive, archiveLines, "utf8");

  // Step 2: Atomically update reviews.jsonl with kept entries only
  try {
    safeAtomicWriteSync(REVIEWS_JSONL, keepLines, { encoding: "utf8" });
  } catch (writeErr) {
    // Rollback: delete temp archive file since reviews.jsonl wasn't modified
    try {
      fs.rmSync(tmpArchive, { force: true });
    } catch {
      /* best-effort cleanup */
    }
    throw new Error(`Failed to update reviews.jsonl during archive: ${sanitizeError(writeErr)}`);
  }

  // Step 3: Read temp file back and append to reviews-archive.jsonl
  // Reading from temp (not in-memory) ensures crash recovery: if process died
  // between step 2 and step 3, temp file is the recovery artifact.
  let stagedContent;
  try {
    stagedContent = fs.readFileSync(tmpArchive, "utf8");
  } catch (readErr) {
    // Temp file lost between step 2 and step 3 — data loss scenario
    throw new Error(
      `CRITICAL: reviews.jsonl already trimmed but temp archive unreadable. ` +
        `Recovery: check reviews-archive.jsonl.tmp.${process.pid} — ${sanitizeError(readErr)}`
    );
  }

  try {
    safeAppendFileSync(REVIEWS_ARCHIVE_JSONL, stagedContent);
  } catch (appendErr) {
    // FATAL: reviews.jsonl already trimmed, archive append failed.
    // Leave temp file in place as crash-recovery artifact.
    throw new Error(
      `CRITICAL: Archive append failed after reviews.jsonl was trimmed. ` +
        `Recovery artifact preserved at reviews-archive.jsonl.tmp.${process.pid} — ${sanitizeError(appendErr)}`
    );
  }

  // Step 4: Clean up temp only AFTER archive append succeeded
  try {
    fs.rmSync(tmpArchive, { force: true });
  } catch {
    /* best-effort cleanup */
  }

  logStep("ARCHIVE", `Archived ${toArchive.length} entries to reviews-archive.jsonl`);
  return { archived: toArchive.length, remaining: toKeep.length };
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

/** Build map of PR -> latest metrics entry by timestamp. */
function buildLatestMetricsMap(metrics) {
  const latestByPr = new Map();
  for (const entry of metrics) {
    if (!entry || typeof entry !== "object" || typeof entry.pr !== "number") continue;
    const existing = latestByPr.get(entry.pr);
    const entryTime = typeof entry.timestamp === "string" ? Date.parse(entry.timestamp) : Number.NaN;
    const existingTime = existing && typeof existing.timestamp === "string" ? Date.parse(existing.timestamp) : Number.NaN;
    const entryScore = Number.isFinite(entryTime) ? entryTime : -Infinity;
    const existingScore = Number.isFinite(existingTime) ? existingTime : -Infinity;

    // last-wins tiebreaker when both timestamps are invalid
    if (!existing || entryScore > existingScore || (entryScore === -Infinity && existingScore === -Infinity)) {
      latestByPr.set(entry.pr, entry);
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
      mismatches.push({ pr, metricsRounds: 0, jsonlRecords: jsonlCount, reason: "missing_metrics" });
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

function checkDisposition(rec) {
  if (!rec || typeof rec !== "object") return null;
  const total = coerceInt(rec.total);
  if (total <= 0) return null;

  const fixed = coerceInt(rec.fixed);
  const deferred = coerceInt(rec.deferred);
  const rejected = coerceInt(rec.rejected);
  const dispositionSum = fixed + deferred + rejected;
  const base = {
    id: rec.id ?? null,
    pr: typeof rec.pr === "number" ? rec.pr : null,
    total, fixed, deferred, rejected,
  };

  if (dispositionSum === 0) return base;
  if (dispositionSum !== total) return { ...base, reason: "sum_mismatch" };
  return null;
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
    const description = v.reason === "sum_mismatch"
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

    if (renderOnly) {
      runRender();
      return;
    }

    // Full lifecycle sequence (strict order, no parallelism)

    // Step 1: SYNC
    const syncResult = runSync();

    // Step 2: ARCHIVE
    const archiveResult = runArchive();

    // Step 3: VALIDATE
    const validateResult = runValidate();

    // Step 4: RENDER
    const renderResult = runRender();

    // Summary
    const elapsed = Date.now() - startTime;
    log(`Lifecycle complete in ${elapsed}ms`);
    log(`  SYNC:     ${syncResult.synced} new entries (${syncResult.total} total)`);
    log(`  ARCHIVE:  ${archiveResult.archived} archived (${archiveResult.remaining} remaining)`);
    const validateMsg = validateResult.valid
      ? "PASS"
      : "FAIL (" + validateResult.findings.length + " findings)";
    log(`  VALIDATE: ${validateMsg}`);
    const renderStatus = renderResult.success ? "OK" : "FAILED";
    const renderCount =
      renderResult.recordCount !== null ? " (" + renderResult.recordCount + " records)" : "";
    log(`  RENDER:   ${renderStatus}${renderCount}`);

    // Exit code based on validation
    if (!validateResult.valid) {
      process.exitCode = 1;
    }
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
  runSync,
  runArchive,
  runValidate,
  runRender,
  // New validation functions (Session #218)
  runCrossDbValidation,
  validateDispositions,
  // Constants for testing
  ARCHIVE_THRESHOLD,
  KEEP_NEWEST,
};
