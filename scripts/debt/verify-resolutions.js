#!/usr/bin/env node
/* global __dirname */
/* eslint-disable complexity */
/**
 * verify-resolutions.js — Audit item statuses in MASTER_DEBT.jsonl
 *
 * Combines Steps 3, 4, and 5 of the Technical Debt Resolution Plan:
 *   Step 3: Verify NEW items (promote to VERIFIED if file exists)
 *   Step 4: Audit RESOLVED items (confirm or flag as possibly unresolved)
 *   Step 5: Audit FALSE_POSITIVE items (confirm or flag as possibly misclassified)
 *
 * Usage:
 *   node scripts/debt/verify-resolutions.js [options]
 *
 * Options:
 *   --dry-run   (default) Show what would change, don't write
 *   --write     Apply changes
 *   --verbose   Show item-level details
 */

const fs = require("node:fs");
const path = require("node:path");
const { sanitizeError } = require("../lib/sanitize-error");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEBT_DIR = path.join(PROJECT_ROOT, "docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const DEDUPED_FILE = path.join(DEBT_DIR, "raw/deduped.jsonl");
const LOG_DIR = path.join(DEBT_DIR, "logs");
const REPORT_FILE = path.join(LOG_DIR, "resolution-audit-report.json");

// Common words to skip when extracting keywords from titles
const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "in",
  "for",
  "should",
  "be",
  "to",
  "of",
  "and",
  "or",
  "not",
  "this",
  "that",
  "it",
  "with",
  "on",
  "at",
  "by",
  "from",
  "are",
  "was",
  "were",
  "has",
  "have",
  "had",
  "do",
  "does",
  "did",
  "will",
  "can",
  "could",
  "may",
  "might",
  "would",
  "shall",
  "must",
  "need",
  "use",
  "used",
  "using",
  "instead",
  "also",
  "here",
  "there",
  "when",
  "if",
  "else",
  "than",
  "then",
  "no",
  "yes",
  "all",
  "each",
  "every",
  "any",
  "some",
  "more",
  "less",
  "most",
  "least",
  "very",
  "too",
  "only",
  "just",
  "about",
  "into",
  "out",
  "up",
  "down",
  "over",
  "under",
  "between",
  "through",
  "after",
  "before",
  "during",
  "without",
  "within",
  "along",
  "provide",
  "avoid",
  "rule",
  "which",
  "what",
  "where",
  "how",
  "why",
  "but",
  "so",
  "as",
  "its",
  "been",
  "being",
  "other",
  "same",
  "such",
]);

// ── Argument Parsing ───────────────────────────────────────────────────

function parseArgs(args) {
  const parsed = { dryRun: true, verbose: false };
  for (const arg of args) {
    if (arg === "--write") parsed.dryRun = false;
    if (arg === "--dry-run") parsed.dryRun = true;
    if (arg === "--verbose") parsed.verbose = true;
    if (arg === "--help") {
      console.log(`
Usage: node scripts/debt/verify-resolutions.js [options]

Options:
  --dry-run   (default) Show what would change, don't write
  --write     Apply changes to MASTER_DEBT.jsonl and raw/deduped.jsonl
  --verbose   Show item-level details
`);
      process.exit(0);
    }
  }
  return parsed;
}

// ── File I/O ───────────────────────────────────────────────────────────

function loadJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`Failed to read ${path.basename(filePath)}: ${sanitizeError(err)}`);
    process.exit(1);
  }
  const items = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      items.push(JSON.parse(trimmed));
    } catch {
      console.warn(`  WARN: skipping malformed JSONL line in ${path.basename(filePath)}`);
    }
  }
  return items;
}

function isWriteSafe(filePath) {
  for (const p of [path.dirname(filePath), filePath]) {
    try {
      const stat = fs.lstatSync(p);
      if (stat.isSymbolicLink()) {
        console.error(`ERROR: Refusing to write to symlink: ${path.basename(p)}`);
        return false;
      }
    } catch {
      // Path doesn't exist yet — continue
    }
  }
  return true;
}

function saveJsonl(filePath, items) {
  if (!isWriteSafe(filePath)) {
    throw new Error(`Refusing to write to symlink: ${filePath}`);
  }
  const content = items.map((item) => JSON.stringify(item)).join("\n") + "\n";
  const dir = path.dirname(filePath);
  const tmpFile = path.join(dir, `.${path.basename(filePath)}.tmp.${process.pid}`);
  try {
    fs.writeFileSync(tmpFile, content, "utf8");
    fs.renameSync(tmpFile, filePath);
  } catch (err) {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* ignore cleanup */
    }
    throw err;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Check if a file exists on disk relative to project root.
 */
function fileExists(relPath) {
  if (!relPath || relPath.trim() === "") return null; // no file ref
  // Path traversal guard — resolve and verify it stays within PROJECT_ROOT
  const absPath = path.resolve(PROJECT_ROOT, relPath);
  const relCheck = path.relative(PROJECT_ROOT, absPath);
  if (relCheck === "" || relCheck.startsWith("..") || path.isAbsolute(relCheck)) return false;
  try {
    return fs.existsSync(absPath);
  } catch {
    return false;
  }
}

/**
 * Get number of lines in a file. Returns 0 on error.
 */
function getLineCount(relPath) {
  const absPath = path.resolve(PROJECT_ROOT, relPath);
  const rel = path.relative(PROJECT_ROOT, absPath);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) return 0;
  try {
    const content = fs.readFileSync(absPath, "utf8");
    return content.split("\n").length;
  } catch {
    return 0;
  }
}

/**
 * Extract 2-3 key technical terms from a title, skipping stop words.
 */
function extractKeywords(title) {
  if (!title) return [];
  const words = title
    .replaceAll(/[^a-zA-Z0-9_.\-/]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .filter((w) => !STOP_WORDS.has(w.toLowerCase()));
  // Take up to 3 unique keywords
  const seen = new Set();
  const keywords = [];
  for (const w of words) {
    const lower = w.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      keywords.push(lower);
      if (keywords.length >= 3) break;
    }
  }
  return keywords;
}

/**
 * Check if any keyword appears near the referenced line (±10 lines).
 * Uses case-insensitive string includes.
 */
function patternFoundNearLine(relPath, line, keywords) {
  if (!keywords.length) return false;
  const absPath = path.resolve(PROJECT_ROOT, relPath);
  const relCheck2 = path.relative(PROJECT_ROOT, absPath);
  if (relCheck2 === "" || relCheck2.startsWith("..") || path.isAbsolute(relCheck2)) return false;
  let content;
  try {
    content = fs.readFileSync(absPath, "utf8");
  } catch {
    return false;
  }
  const allLines = content.split("\n");
  const startLine = Math.max(0, line - 11); // 0-indexed, line is 1-indexed
  const endLine = Math.min(allLines.length, line + 10);
  const region = allLines.slice(startLine, endLine).join("\n").toLowerCase();

  for (const kw of keywords) {
    if (region.includes(kw)) return true;
  }
  return false;
}

// ── Step 3: Verify NEW items ───────────────────────────────────────────

/**
 * Classify a single NEW item: returns { category, detail } where
 * category is "no_file_ref" | "needs_triage" | "promoted".
 */
function classifyNewItem(item, verbose) {
  const fileRef = item.file || "";
  const lineNum = Number.isFinite(Number(item.line)) ? Math.trunc(Number(item.line)) : 0;

  if (fileRef.trim() === "") {
    return { category: "no_file_ref", detail: item.id };
  }

  const exists = fileExists(fileRef);
  if (exists === null) {
    return { category: "no_file_ref", detail: item.id };
  }

  if (!exists) {
    if (verbose) console.log(`  [NEEDS_TRIAGE] ${item.id}: ${fileRef} (file missing)`);
    return {
      category: "needs_triage",
      detail: { id: item.id, file: fileRef, line: lineNum, reason: "File does not exist" },
    };
  }

  // File exists — check line count if line is a valid positive integer
  if (lineNum > 0) {
    const lineCount = getLineCount(fileRef);
    if (lineCount < lineNum) {
      if (verbose) {
        console.log(
          `  [NEEDS_TRIAGE] ${item.id}: ${fileRef}:${lineNum} (file has only ${lineCount} lines)`
        );
      }
      return {
        category: "needs_triage",
        detail: {
          id: item.id,
          file: fileRef,
          line: lineNum,
          reason: `File has ${lineCount} lines but item references line ${lineNum}`,
        },
      };
    }
  }

  if (verbose) console.log(`  [VERIFIED] ${item.id}: ${fileRef}`);
  return { category: "promoted", detail: item.id };
}

function verifyNewItems(items, verbose) {
  const results = {
    promoted_to_verified: [],
    needs_triage: [],
    no_file_ref: [],
    skipped: 0,
  };

  for (const item of items) {
    if (item.status !== "NEW") continue;

    const { category, detail } = classifyNewItem(item, verbose);
    if (category === "no_file_ref") results.no_file_ref.push(detail);
    else if (category === "needs_triage") results.needs_triage.push(detail);
    else results.promoted_to_verified.push(detail);
  }

  return results;
}

// ── Shared audit helper for RESOLVED / FALSE_POSITIVE items ────────────

/**
 * Classify a single item by checking file existence, keyword proximity.
 * @param {object} item - The debt item to audit
 * @param {boolean} verbose - Whether to log details
 * @param {object} labels - Result bucket names:
 *   { confirmed, suspect, unknown, confirmedTag, suspectTag }
 * @returns {{ category: string, detail: object }}
 */
function classifyAuditItem(item, verbose, labels) {
  const fileRef = item.file || "";
  const lineNum = Number.isFinite(Number(item.line)) ? Math.trunc(Number(item.line)) : 0;

  if (fileRef.trim() === "") {
    if (verbose) console.log(`  [UNABLE_TO_VERIFY] ${item.id}: no file reference`);
    return { category: "unknown", detail: { id: item.id, reason: "No file reference" } };
  }

  const exists = fileExists(fileRef);
  if (!exists) {
    if (verbose) console.log(`  [${labels.confirmedTag}] ${item.id}: ${fileRef} (deleted)`);
    return { category: "confirmed", detail: { id: item.id, reason: "File deleted" } };
  }

  const keywords = extractKeywords(item.title);
  if (!keywords.length) {
    if (verbose) console.log(`  [UNABLE_TO_VERIFY] ${item.id}: no keywords from title`);
    return {
      category: "unknown",
      detail: { id: item.id, reason: "No keywords extractable from title" },
    };
  }

  const line = lineNum || 1;
  if (patternFoundNearLine(fileRef, line, keywords)) {
    if (verbose) {
      console.log(
        `  [${labels.suspectTag}] ${item.id}: ${fileRef}:${lineNum} (keywords: ${keywords.join(", ")})`
      );
    }
    return {
      category: "suspect",
      detail: {
        id: item.id,
        file: fileRef,
        line: lineNum,
        keywords,
        reason: "Pattern still found near referenced line",
      },
    };
  }

  if (verbose) console.log(`  [${labels.confirmedTag}] ${item.id}: ${fileRef} (pattern cleared)`);
  return { category: "confirmed", detail: { id: item.id, reason: "Pattern not found" } };
}

/**
 * Audit items of a given status using a shared classification helper.
 * @param {Array} items - All debt items
 * @param {boolean} verbose - Whether to log details
 * @param {string} status - Status to filter on ("RESOLVED" or "FALSE_POSITIVE")
 * @param {object} labels - Bucket names and log tags
 * @returns {object} results with confirmed/suspect/unknown arrays
 */
function auditItemsByPattern(items, verbose, status, labels) {
  const results = {
    [labels.confirmed]: [],
    [labels.suspect]: [],
    [labels.unknown]: [],
  };

  for (const item of items) {
    if (item.status !== status) continue;
    const { category, detail } = classifyAuditItem(item, verbose, labels);
    if (category === "confirmed") results[labels.confirmed].push(detail);
    else if (category === "suspect") results[labels.suspect].push(detail);
    else results[labels.unknown].push(detail);
  }

  return results;
}

// ── Step 4: Audit RESOLVED items ───────────────────────────────────────

function auditResolvedItems(items, verbose) {
  return auditItemsByPattern(items, verbose, "RESOLVED", {
    confirmed: "confirmed_resolved",
    suspect: "possibly_unresolved",
    unknown: "unable_to_verify",
    confirmedTag: "CONFIRMED_RESOLVED",
    suspectTag: "POSSIBLY_UNRESOLVED",
  });
}

// ── Step 5: Audit FALSE_POSITIVE items ─────────────────────────────────

function auditFalsePositiveItems(items, verbose) {
  return auditItemsByPattern(items, verbose, "FALSE_POSITIVE", {
    confirmed: "confirmed_fp",
    suspect: "possibly_misclassified",
    unknown: "unable_to_verify",
    confirmedTag: "CONFIRMED_FP",
    suspectTag: "POSSIBLY_MISCLASSIFIED",
  });
}

// ── Apply Changes ──────────────────────────────────────────────────────

function applyChanges(masterItems, dedupedItems, promotedIds) {
  const promotedSet = new Set(promotedIds);
  const changedHashes = new Set();

  // Update master items
  for (const item of masterItems) {
    if (promotedSet.has(item.id)) {
      item.status = "VERIFIED";
      item.verified_by = "verify-resolutions-script";
      if (item.content_hash) changedHashes.add(item.content_hash);
    }
  }

  // Update deduped items by id OR content_hash match
  let dedupedUpdated = 0;
  for (const item of dedupedItems) {
    const shouldSync =
      (item.id && promotedSet.has(item.id)) ||
      (item.content_hash && changedHashes.has(item.content_hash));
    if (shouldSync) {
      item.status = "VERIFIED";
      item.verified_by = "verify-resolutions-script";
      dedupedUpdated++;
    }
  }

  return dedupedUpdated;
}

// ── Report Building ────────────────────────────────────────────────────

function buildReport(mode, totalItems, step3, step4, step5) {
  return {
    generated: new Date().toISOString(),
    mode,
    total_items: totalItems,
    step3_verify_new: {
      promoted_to_verified: step3.promoted_to_verified.length,
      needs_triage: step3.needs_triage.length,
      no_file_ref: step3.no_file_ref.length,
      promoted_ids: step3.promoted_to_verified,
      triage_details: step3.needs_triage,
    },
    step4_audit_resolved: {
      confirmed_resolved: step4.confirmed_resolved.length,
      possibly_unresolved: step4.possibly_unresolved.length,
      unable_to_verify: step4.unable_to_verify.length,
      possibly_unresolved_details: step4.possibly_unresolved,
      unable_to_verify_details: step4.unable_to_verify,
    },
    step5_audit_false_positive: {
      confirmed_fp: step5.confirmed_fp.length,
      possibly_misclassified: step5.possibly_misclassified.length,
      unable_to_verify: step5.unable_to_verify.length,
      possibly_misclassified_details: step5.possibly_misclassified,
      unable_to_verify_details: step5.unable_to_verify,
    },
  };
}

function writeAuditResults(masterItems, step3, report) {
  // Load deduped for sync
  const dedupedItems = loadJsonl(DEDUPED_FILE);
  const dedupedUpdated = applyChanges(masterItems, dedupedItems, step3.promoted_to_verified);

  // Write files
  try {
    saveJsonl(MASTER_FILE, masterItems);
    console.log(
      `  Updated MASTER_DEBT.jsonl (${step3.promoted_to_verified.length} items promoted to VERIFIED)`
    );
  } catch (err) {
    console.error(`Failed to write MASTER_DEBT.jsonl: ${sanitizeError(err)}`);
    process.exit(1);
  }

  if (dedupedUpdated > 0) {
    try {
      saveJsonl(DEDUPED_FILE, dedupedItems);
      console.log(`  Updated raw/deduped.jsonl (${dedupedUpdated} items synced)`);
    } catch (err) {
      console.error(`Failed to write deduped.jsonl: ${sanitizeError(err)}`);
      process.exit(1);
    }
  } else {
    console.log("  raw/deduped.jsonl: no matching items to sync");
  }

  // Write report
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2) + "\n");
    console.log(`  Wrote audit report to ${path.relative(PROJECT_ROOT, REPORT_FILE)}`);
  } catch (err) {
    console.error(`Failed to write report: ${sanitizeError(err)}`);
    // Non-fatal: master file already updated
  }

  console.log("\nDone.\n");
}

// ── Main ───────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  const mode = parsed.dryRun ? "DRY RUN" : "WRITE";
  console.log(`\n=== Technical Debt Resolution Audit (${mode}) ===\n`);

  // Load data
  const masterItems = loadJsonl(MASTER_FILE);
  if (!masterItems.length) {
    console.error("No items found in MASTER_DEBT.jsonl");
    process.exit(1);
  }
  console.log(`Loaded ${masterItems.length} items from MASTER_DEBT.jsonl\n`);

  // ── Step 3 ─────────────────────────────────────────────────────────
  console.log("--- Step 3: Verify NEW Items ---");
  const step3 = verifyNewItems(masterItems, parsed.verbose);
  console.log(`  Promoted to VERIFIED:  ${step3.promoted_to_verified.length}`);
  console.log(`  Needs triage:          ${step3.needs_triage.length}`);
  console.log(`  No file reference:     ${step3.no_file_ref.length}`);
  console.log();

  // ── Step 4 ─────────────────────────────────────────────────────────
  console.log("--- Step 4: Audit RESOLVED Items ---");
  const step4 = auditResolvedItems(masterItems, parsed.verbose);
  console.log(`  Confirmed resolved:    ${step4.confirmed_resolved.length}`);
  console.log(`  Possibly unresolved:   ${step4.possibly_unresolved.length}`);
  console.log(`  Unable to verify:      ${step4.unable_to_verify.length}`);
  console.log();

  // ── Step 5 ─────────────────────────────────────────────────────────
  console.log("--- Step 5: Audit FALSE_POSITIVE Items ---");
  const step5 = auditFalsePositiveItems(masterItems, parsed.verbose);
  console.log(`  Confirmed FP:          ${step5.confirmed_fp.length}`);
  console.log(`  Possibly misclassified: ${step5.possibly_misclassified.length}`);
  console.log(`  Unable to verify:      ${step5.unable_to_verify.length}`);
  console.log();

  const report = buildReport(mode, masterItems.length, step3, step4, step5);

  if (parsed.dryRun) {
    console.log("--- Summary (DRY RUN - no changes written) ---");
    console.log(`  Would promote ${step3.promoted_to_verified.length} NEW items to VERIFIED`);
    console.log(`  Would write audit report to ${path.relative(PROJECT_ROOT, REPORT_FILE)}`);
    console.log("\nRun with --write to apply changes.\n");
  } else {
    writeAuditResults(masterItems, step3, report);
  }
}

main();
