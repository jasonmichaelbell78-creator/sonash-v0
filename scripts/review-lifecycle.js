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
    const totalMatch = /Total\*{0,2}:\*{0,2}\s*(\d+)/i.exec(raw) || /(\d+)\s+(?:total|items)/i.exec(raw);
    if (totalMatch) review.total = Number.parseInt(totalMatch[1], 10);

    // Patterns — extract from "**Key Patterns:**" or "**Patterns:**" sections
    // Handles: "- **pattern-name**: description" and "- pattern description"
    const patternLines = review._rawLines.filter((l) => {
      const t = l.trim();
      return (t.startsWith("- **") && t.includes("**:")) ||
        (t.startsWith("- ") && t.length > 20 && t.length < 200);
    });
    if (patternLines.length > 0) {
      review.patterns = patternLines.map((l) => {
        const boldMatch = /- \*\*([^*]+)\*\*:?\s*(.*)/.exec(l.trim());
        return boldMatch ? boldMatch[1].trim() : l.trim().slice(2).trim();
      }).filter((p) => p.length > 0).slice(0, 15);
    }

    // Learnings — extract from "**Takeaway:**", "**Lesson:**", or post-pattern bullets
    const learningLines = review._rawLines.filter((l) => {
      const t = l.trim();
      return (t.startsWith("**Takeaway:**") || t.startsWith("**Lesson:**") ||
        (t.startsWith("- ") && t.length > 30 && t.length < 300 && !t.startsWith("- **")));
    });
    if (learningLines.length > 0) {
      review.learnings = learningLines.map((l) => {
        const prefixMatch = /\*\*(Takeaway|Lesson):\*\*\s*(.+)/.exec(l.trim());
        return prefixMatch ? prefixMatch[2].trim() : l.trim().slice(2).trim();
      }).filter((le) => le.length > 0).slice(0, 7);
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

  // Sort by numeric id to ensure correct archival order
  const ordered = [...records].sort((a, b) => {
    const aId = typeof a.id === "number" ? a.id : Number.POSITIVE_INFINITY;
    const bId = typeof b.id === "number" ? b.id : Number.POSITIVE_INFINITY;
    if (aId !== bId) return aId - bId;
    return String(a.date || "").localeCompare(String(b.date || ""));
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
  safeWriteFileSync(tmpArchive, archiveLines, "utf8");

  // Step 2: Atomically update reviews.jsonl with kept entries only
  try {
    safeAtomicWriteSync(REVIEWS_JSONL, keepLines, { encoding: "utf8" });
  } catch (writeErr) {
    // Rollback: delete temp archive file since reviews.jsonl wasn't modified
    try {
      fs.rmSync(tmpArchive, { force: true });
    } catch { /* best-effort cleanup */ }
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
      `Recovery: check ${tmpArchive} — ${sanitizeError(readErr)}`
    );
  }

  try {
    safeAppendFileSync(REVIEWS_ARCHIVE_JSONL, stagedContent);
  } catch (appendErr) {
    // FATAL: reviews.jsonl already trimmed, archive append failed.
    // Leave temp file in place as crash-recovery artifact.
    throw new Error(
      `CRITICAL: Archive append failed after reviews.jsonl was trimmed. ` +
      `Recovery artifact preserved at: ${tmpArchive} — ${sanitizeError(appendErr)}`
    );
  }

  // Step 4: Clean up temp only AFTER archive append succeeded
  try {
    fs.rmSync(tmpArchive, { force: true });
  } catch { /* best-effort cleanup */ }

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
    // Exit code 2 = unrecoverable script error — check FIRST before parsing output
    if (err.status === 2) {
      throw new Error(`check-review-archive.js failed: ${sanitizeError(err)}`);
    }

    // execFileSync throws on non-zero exit (code 1 = findings)
    if (err.stdout) {
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

    // Unrecoverable error (no parseable findings)
    throw new Error(`check-review-archive.js failed: ${sanitizeError(err)}`);
  }
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

    logStep("RENDER", recordCount === null ? "Rendered successfully" : `Rendered ${recordCount} records`);
    return { success: true, recordCount };
  } catch (err) {
    const stderr = err.stderr ? sanitizeError(err.stderr.toString().trim()) : "";
    const stdout = err.stdout ? sanitizeError(err.stdout.toString().trim()) : "";
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
    const validateMsg = validateResult.valid ? "PASS" : "FAIL (" + validateResult.findings.length + " findings)";
    log(`  VALIDATE: ${validateMsg}`);
    const renderStatus = renderResult.success ? "OK" : "FAILED";
    const renderCount = renderResult.recordCount !== null ? " (" + renderResult.recordCount + " records)" : "";
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
  // Constants for testing
  ARCHIVE_THRESHOLD,
  KEEP_NEWEST,
};
