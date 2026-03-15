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
  ({ safeWriteFileSync, safeAppendFileSync, safeAtomicWriteSync, isSafeToWrite } = require("./lib/safe-fs"));
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
    if (!fs.existsSync(REVIEWS_JSONL)) return [];
    return readJsonl(REVIEWS_JSONL, { safe: true, quiet: true });
  } catch (err) {
    throw new Error(`Failed to read reviews.jsonl: ${sanitizeError(err)}`);
  }
}

/**
 * Load existing review IDs from JSONL for dedup during sync.
 * Returns Set of id values (numbers and strings).
 */
function loadExistingIds(records) {
  const ids = new Set();
  for (const rec of records) {
    if (rec.id !== undefined && rec.id !== null) {
      ids.add(typeof rec.id === "number" ? rec.id : String(rec.id));
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
    const headerMatch = line.match(/^#{2,4}\s+Review\s+#(\d+):?\s*(.*)/);
    if (headerMatch) {
      if (current) reviews.push(current);

      const id = Number.parseInt(headerMatch[1], 10);
      const titleAndDate = headerMatch[2].trim();
      const dateMatch = titleAndDate.match(/\((\d{4}-\d{2}-\d{2})\)\s*$/);
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
    const sourceMatch = raw.match(/\*\*Source:\*\*\s*([^\n*]+)/);
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
    const prMatch = raw.match(/PR[*]*:?\*{0,2}\s*#(\d+)/i);
    if (prMatch) review.pr = Number.parseInt(prMatch[1], 10);

    // Fixed / Deferred / Rejected counts — handles "Fixed: N", "**Fixed:** N"
    const fixedMatch = raw.match(/Fixed\*{0,2}:\*{0,2}\s*(\d+)/i);
    if (fixedMatch) review.fixed = Number.parseInt(fixedMatch[1], 10);

    const deferredMatch = raw.match(/Deferred\*{0,2}:\*{0,2}\s*(\d+)/i);
    if (deferredMatch) review.deferred = Number.parseInt(deferredMatch[1], 10);

    const rejectedMatch = raw.match(/Rejected\*{0,2}:\*{0,2}\s*(\d+)/i);
    if (rejectedMatch) review.rejected = Number.parseInt(rejectedMatch[1], 10);

    // Total — handles "Total: N", "**Total:** N", "N total", "N items"
    const totalMatch = raw.match(/Total\*{0,2}:\*{0,2}\s*(\d+)/i) || raw.match(/(\d+)\s+(?:total|items)/i);
    if (totalMatch) review.total = Number.parseInt(totalMatch[1], 10);

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

  if (!fs.existsSync(LEARNINGS_LOG)) {
    logStep("SYNC", "AI_REVIEW_LEARNINGS_LOG.md not found - skipping sync");
    return { synced: 0, total: 0 };
  }

  let content;
  try {
    content = fs.readFileSync(LEARNINGS_LOG, "utf8");
  } catch (err) {
    throw new Error(`Failed to read learnings log: ${sanitizeError(err)}`);
  }

  const mdReviews = parseMarkdownReviews(content);
  const existingRecords = loadReviews();
  const existingIds = loadExistingIds(existingRecords);

  // Filter to reviews not already in JSONL
  const missing = mdReviews.filter((r) => !existingIds.has(r.id));

  logStep("SYNC", `Markdown reviews: ${mdReviews.length}, JSONL existing: ${existingIds.size}, new: ${missing.length}`);

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

  // Ensure state directory exists
  const stateDir = pathMod.dirname(REVIEWS_JSONL);
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  // Append new entries
  const lines = missing.map((r) => JSON.stringify(r)).join("\n") + "\n";
  try {
    safeAppendFileSync(REVIEWS_JSONL, lines);
  } catch (err) {
    throw new Error(`Failed to append to reviews.jsonl: ${sanitizeError(err)}`);
  }

  logStep("SYNC", `Appended ${missing.length} entries (IDs: ${missing.map((r) => "#" + r.id).join(", ")})`);
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

  // Determine which entries to archive vs keep
  // Keep the newest KEEP_NEWEST entries, archive the rest
  const toKeep = records.slice(-KEEP_NEWEST);
  const toArchive = records.slice(0, records.length - KEEP_NEWEST);

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

  try {
    // Step 1: Write archive entries to temp file
    safeWriteFileSync(tmpArchive, archiveLines, "utf8");

    // Step 2: Atomically update reviews.jsonl with kept entries only
    try {
      safeAtomicWriteSync(REVIEWS_JSONL, keepLines, { encoding: "utf8" });
    } catch (writeErr) {
      // Rollback: delete temp archive file
      try {
        fs.rmSync(tmpArchive, { force: true });
      } catch { /* best-effort cleanup */ }
      throw new Error(`Failed to update reviews.jsonl during archive: ${sanitizeError(writeErr)}`);
    }

    // Step 3: Append temp contents to reviews-archive.jsonl
    try {
      safeAppendFileSync(REVIEWS_ARCHIVE_JSONL, archiveLines);
    } catch (appendErr) {
      // Non-fatal warning: reviews.jsonl is already updated
      logStep("ARCHIVE", `WARNING: Failed to append to archive file: ${sanitizeError(appendErr)}`);
    }

    // Step 4: Clean up temp
    try {
      fs.rmSync(tmpArchive, { force: true });
    } catch { /* best-effort cleanup */ }
  } catch (err) {
    // Ensure temp cleanup on any error
    try {
      fs.rmSync(tmpArchive, { force: true });
    } catch { /* best-effort cleanup */ }
    throw err;
  }

  logStep("ARCHIVE", `Archived ${toArchive.length} entries to reviews-archive.jsonl`);
  return { archived: toArchive.length, remaining: toKeep.length };
}

// ── STEP 3: VALIDATE ──────────────────────────────────────────────────────

/**
 * VALIDATE step: run check-review-archive.js and report findings.
 * Returns { valid: boolean, findings: Array }.
 */
function runValidate() {
  logStep("VALIDATE", "Running review archive health check...");

  if (dryRun) {
    logStep("VALIDATE", "DRY RUN: Would run check-review-archive.js --json");
    return { valid: true, findings: [] };
  }

  try {
    const result = execFileSync("node", [CHECK_ARCHIVE_SCRIPT, "--json"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 30_000,
      // Capture both stdout and stderr
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Parse JSON output from stdout
    let findings = [];
    try {
      findings = JSON.parse(result.trim());
    } catch {
      // If stdout isn't valid JSON, no findings
    }

    if (findings.length === 0) {
      logStep("VALIDATE", "All checks passed");
      return { valid: true, findings: [] };
    }

    // Report findings
    const s0Count = findings.filter((f) => f.severity === "S0").length;
    const s1Count = findings.filter((f) => f.severity === "S1").length;
    logStep("VALIDATE", `${findings.length} finding(s): S0=${s0Count} S1=${s1Count}`);

    for (const f of findings) {
      logStep("VALIDATE", `  [${f.severity}] ${f.description}`);
    }

    return { valid: false, findings };
  } catch (err) {
    // execFileSync throws on non-zero exit
    if (err.stdout) {
      // The script exited with code 1 (findings) or 2 (error)
      let findings = [];
      try {
        findings = JSON.parse(err.stdout.toString().trim());
      } catch { /* not JSON output */ }

      if (findings.length > 0) {
        const s0Count = findings.filter((f) => f.severity === "S0").length;
        const s1Count = findings.filter((f) => f.severity === "S1").length;
        logStep("VALIDATE", `${findings.length} finding(s): S0=${s0Count} S1=${s1Count}`);
        for (const f of findings) {
          logStep("VALIDATE", `  [${f.severity}] ${f.description}`);
        }
        return { valid: false, findings };
      }

      // Exit code 2 = script error
      if (err.status === 2) {
        throw new Error(`check-review-archive.js failed: ${sanitizeError(err)}`);
      }
    }

    // If stderr has structured findings (the script writes to stderr too)
    if (err.stderr) {
      let stderrFindings = [];
      try {
        stderrFindings = JSON.parse(err.stderr.toString().trim());
      } catch { /* not JSON */ }

      if (stderrFindings.length > 0) {
        const s0Count = stderrFindings.filter((f) => f.severity === "S0").length;
        const s1Count = stderrFindings.filter((f) => f.severity === "S1").length;
        logStep("VALIDATE", `${stderrFindings.length} finding(s): S0=${s0Count} S1=${s1Count}`);
        for (const f of stderrFindings) {
          logStep("VALIDATE", `  [${f.severity}] ${f.description}`);
        }
        return { valid: false, findings: stderrFindings };
      }
    }

    // Unrecoverable error
    throw new Error(`check-review-archive.js failed: ${sanitizeError(err)}`);
  }
}

// ── STEP 4: RENDER ────────────────────────────────────────────────────────

/**
 * RENDER step: run render-reviews-to-md.ts via tsx to regenerate markdown.
 * Returns { success: boolean, recordCount: number | null }.
 */
function runRender() {
  logStep("RENDER", "Regenerating markdown view from JSONL...");

  if (dryRun) {
    logStep("RENDER", "DRY RUN: Would run render-reviews-to-md.ts");
    return { success: true, recordCount: null };
  }

  try {
    const result = execFileSync("npx", ["tsx", RENDER_SCRIPT], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 30_000,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    // Parse output for record count
    let recordCount = null;
    const countMatch = (result || "").match(/(\d+)\s+record/);
    if (countMatch) {
      recordCount = Number.parseInt(countMatch[1], 10);
    }

    logStep("RENDER", `Rendered ${recordCount !== null ? recordCount + " records" : "successfully"}`);
    return { success: true, recordCount };
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().trim() : "";
    const stdout = err.stdout ? err.stdout.toString().trim() : "";
    throw new Error(`render-reviews-to-md.ts failed: ${sanitizeError(err)}${stderr ? " | " + stderr : ""}${stdout ? " | " + stdout : ""}`);
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
    log(`  VALIDATE: ${validateResult.valid ? "PASS" : `FAIL (${validateResult.findings.length} findings)`}`);
    log(`  RENDER:   ${renderResult.success ? "OK" : "FAILED"}${renderResult.recordCount !== null ? ` (${renderResult.recordCount} records)` : ""}`);

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
  // Constants for testing
  ARCHIVE_THRESHOLD,
  KEEP_NEWEST,
};
