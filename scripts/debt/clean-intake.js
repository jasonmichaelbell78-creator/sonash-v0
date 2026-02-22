#!/usr/bin/env node
/* global __dirname */
/**
 * Clean Intake Script — Step 0h of Technical Debt Resolution Plan
 *
 * Cleans raw scattered-intake.jsonl items before pipeline ingestion.
 * 4 cleaning phases: Deduplication, False Positive Detection,
 * Completed Work Detection, Item Verification.
 *
 * Input:  docs/technical-debt/raw/scattered-intake.jsonl
 * Output: docs/technical-debt/raw/scattered-intake-cleaned.jsonl
 *
 * Usage:
 *   node scripts/debt/clean-intake.js              # dry-run (default)
 *   node scripts/debt/clean-intake.js --write      # write output file
 *   node scripts/debt/clean-intake.js --verbose    # detailed output
 */

const fs = require("node:fs");
const path = require("node:path");

// ── Paths ──────────────────────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEBT_DIR = path.join(PROJECT_ROOT, "docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const INPUT_FILE = path.join(DEBT_DIR, "raw/scattered-intake.jsonl");
const OUTPUT_FILE = path.join(DEBT_DIR, "raw/scattered-intake-cleaned.jsonl");

// ── CLI flags ──────────────────────────────────────────────────────────────
const args = new Set(process.argv.slice(2));
const WRITE_MODE = args.has("--write");
const VERBOSE = args.has("--verbose");
const DRY_RUN = !WRITE_MODE;

// ── Valid categories ───────────────────────────────────────────────────────
const VALID_CATEGORIES = new Set([
  "code-quality",
  "security",
  "performance",
  "documentation",
  "refactoring",
  "engineering-productivity",
  "ai-optimization",
  "accessibility",
  "process",
  "enhancements",
]);

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Read a JSONL file into an array of objects.
 * Wraps in try/catch per CLAUDE.md file-read rule.
 */
function readJsonl(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error(`Failed to read ${path.basename(filePath)}: ${err.code || "UNKNOWN"}`);
    process.exit(1);
  }
  const items = [];
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      items.push(JSON.parse(line));
    } catch {
      console.warn(`  Skipping malformed JSON at line ${i + 1}`);
    }
  }
  return items;
}

/**
 * Simple string similarity (Dice coefficient on bigrams).
 * Returns 0..1 where 1 = identical.
 */
function similarity(a, b) {
  if (!a || !b) return 0;
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return 1;

  const bigramsA = new Set();
  for (let i = 0; i < al.length - 1; i++) {
    bigramsA.add(al.slice(i, i + 2));
  }
  const bigramsB = new Set();
  for (let i = 0; i < bl.length - 1; i++) {
    bigramsB.add(bl.slice(i, i + 2));
  }

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }
  const union = bigramsA.size + bigramsB.size;
  if (union === 0) return 0;
  return (2 * intersection) / union;
}

/**
 * Check if a file exists on disk (relative to project root).
 */
function fileExists(filePath) {
  if (!filePath) return false;
  const abs = path.isAbsolute(filePath) ? filePath : path.join(PROJECT_ROOT, filePath);
  try {
    return fs.existsSync(abs);
  } catch {
    console.debug(`fileExists check failed for: ${abs}`);
    return false;
  }
}

// ── Master Index Builder ───────────────────────────────────────────────────

function buildMasterIndices(masterItems) {
  const titleIndex = new Map();
  const fileLineIndex = new Map();
  const hashIndex = new Set();
  const resolvedTitles = [];

  for (const item of masterItems) {
    if (item.title) {
      titleIndex.set(item.title.toLowerCase().trim(), item.id);
    }
    if (item.file) {
      const key = item.file.toLowerCase();
      if (!fileLineIndex.has(key)) fileLineIndex.set(key, []);
      fileLineIndex.get(key).push({ id: item.id, line: item.line || 0 });
    }
    if (item.content_hash) hashIndex.add(item.content_hash);
    if (item.status === "RESOLVED" && item.title) {
      resolvedTitles.push({ id: item.id, title: item.title });
    }
  }

  return { titleIndex, fileLineIndex, hashIndex, resolvedTitles };
}

// ── Phase 1: Deduplication ────────────────────────────────────────────────

function checkDuplicate(item, titleIndex, fileLineIndex, hashIndex) {
  if (item.title) {
    const existing = titleIndex.get(item.title.toLowerCase().trim());
    if (existing) return { reason: "exact_title", matchId: existing };
  }
  if (item.file) {
    const candidates = fileLineIndex.get(item.file.toLowerCase());
    if (candidates) {
      const itemLine = item.line || 0;
      for (const c of candidates) {
        if (Math.abs(c.line - itemLine) <= 5) {
          return { reason: "same_file_line", matchId: c.id };
        }
      }
    }
  }
  if (item.content_hash && hashIndex.has(item.content_hash)) {
    return { reason: "content_hash", matchId: "(hash match)" };
  }
  return null;
}

function runPhase1Dedup(intakeItems, indices) {
  const rejected = [];
  const surviving = [];

  for (const item of intakeItems) {
    const dup = checkDuplicate(item, indices.titleIndex, indices.fileLineIndex, indices.hashIndex);
    if (dup) {
      rejected.push({
        id: item.id,
        title: item.title,
        disposition: "DUPLICATE",
        reason: dup.reason,
        matched: dup.matchId,
      });
      if (VERBOSE)
        console.log(
          `  DUPLICATE [${dup.reason}]: ${item.id} "${(item.title || "").slice(0, 60)}" -> ${dup.matchId}`
        );
    } else {
      surviving.push(item);
    }
  }
  return { rejected, surviving };
}

// ── Phase 2: False Positive Detection ─────────────────────────────────────

const INFORMATIONAL_PATTERNS = [
  /^(?:uses|is configured|has been set up|is using|is set|has been configured|is enabled|is installed)/i,
];

function detectFalsePositive(item) {
  if (item.title) {
    for (const pat of INFORMATIONAL_PATTERNS) {
      pat.lastIndex = 0;
      if (pat.test(item.title)) return "informational_only";
    }
  }
  if (item.file) {
    if (/^\.\.(?:[/\\]|$)/.test(item.file) === false && item.file.startsWith("node_modules/")) {
      return "external_dep";
    }
  }
  if (!item.title || item.title.trim().length < 10) return "empty_or_short_title";
  return null;
}

function runPhase2FalsePositives(surviving) {
  const rejected = [];
  const next = [];

  for (const item of surviving) {
    const fpReason = detectFalsePositive(item);
    if (fpReason) {
      rejected.push({
        id: item.id,
        title: item.title,
        disposition: "FALSE_POSITIVE",
        reason: fpReason,
      });
      if (VERBOSE)
        console.log(
          `  FALSE_POSITIVE [${fpReason}]: ${item.id} "${(item.title || "").slice(0, 60)}"`
        );
    } else {
      next.push(item);
    }
  }
  return { rejected, surviving: next };
}

// ── Phase 3: Completed Work Detection ─────────────────────────────────────

function detectCompletedWork(item, resolvedTitles) {
  if (item.file && item.file.length > 0 && !fileExists(item.file)) {
    return "file_deleted";
  }
  if (item.title) {
    for (const resolved of resolvedTitles) {
      if (similarity(item.title, resolved.title) >= 0.85) {
        return `resolved_match:${resolved.id}`;
      }
    }
  }
  return null;
}

function runPhase3Completed(surviving, resolvedTitles) {
  const rejected = [];
  const next = [];

  for (const item of surviving) {
    const resolvedReason = detectCompletedWork(item, resolvedTitles);
    if (resolvedReason) {
      const disposition =
        resolvedReason === "file_deleted" ? "POSSIBLY_RESOLVED" : "LIKELY_RESOLVED";
      rejected.push({ id: item.id, title: item.title, disposition, reason: resolvedReason });
      if (VERBOSE)
        console.log(
          `  ${disposition} [${resolvedReason}]: ${item.id} "${(item.title || "").slice(0, 60)}"`
        );
    } else {
      next.push(item);
    }
  }
  return { rejected, surviving: next };
}

// ── Phase 4: Item Verification ────────────────────────────────────────────

function verifyItem(item) {
  const issues = [];
  if (item.category && !VALID_CATEGORIES.has(item.category)) {
    issues.push(`invalid_category:${item.category}`);
  }
  // S0 is reserved for security + critical runtime failures; non-critical S0 items
  // should be reviewed by audit-s0-promotions.js rather than auto-downgraded here.
  const NON_CRITICAL_CATEGORIES = new Set([
    "documentation",
    "process",
    "ai-optimization",
    "engineering-productivity",
  ]);
  if (item.severity === "S0" && NON_CRITICAL_CATEGORIES.has(item.category)) {
    issues.push(`severity_downgrade_needed:S0->S1 (category: ${item.category})`);
    if (VERBOSE) console.log(`  DOWNGRADE NEEDED S0->S1: ${item.id} (category: ${item.category})`);
  }
  const requiredFields = ["id", "title", "category", "severity", "status"];
  for (const field of requiredFields) {
    if (!item[field]) issues.push(`missing_field:${field}`);
  }
  return issues;
}

function runPhase4Verification(surviving) {
  const rejected = [];
  const next = [];

  for (const item of surviving) {
    const issues = verifyItem(item);
    // Separate severity downgrade tracking from hard failures
    const downgradeIssues = issues.filter((i) => i.startsWith("severity_downgrade_needed:"));
    const hardIssues = issues.filter((i) => !i.startsWith("severity_downgrade_needed:"));

    if (hardIssues.length > 0) {
      rejected.push({
        id: item.id,
        title: item.title,
        disposition: "FAILED_VERIFICATION",
        reasons: issues,
      });
      if (VERBOSE) console.log(`  FAILED_VERIFICATION: ${item.id} — ${issues.join(", ")}`);
    } else {
      // Apply severity downgrade if flagged
      if (downgradeIssues.length > 0) {
        item.severity = "S1";
      }
      item.cleaning_disposition = "CLEAN";
      next.push(item);
    }
  }
  return { rejected, surviving: next };
}

// ── Summary & Output ──────────────────────────────────────────────────────

function printSummaryReport(inputCount, phaseResults, outputCount) {
  console.log();
  console.log(
    "Phase 1 - Dedup:          ",
    String(phaseResults[0]).padStart(4),
    "duplicates removed"
  );
  console.log(
    "Phase 2 - False Positive: ",
    String(phaseResults[1]).padStart(4),
    "false positives removed"
  );
  console.log(
    "Phase 3 - Completed:      ",
    String(phaseResults[2]).padStart(4),
    "resolved items removed"
  );
  console.log(
    "Phase 4 - Verification:   ",
    String(phaseResults[3]).padStart(4),
    "items failed verification"
  );
  console.log("                           ────────────────────────");
  console.log("Input:                    ", String(inputCount).padStart(4), "items");
  console.log("Output (clean):           ", String(outputCount).padStart(4), "items");
}

function printRejectionLog(allRejected) {
  console.log();
  console.log("=== Full rejection log ===");
  for (const r of allRejected) {
    console.log(
      `  [${r.disposition}] ${r.id}: "${(r.title || "").slice(0, 70)}" — ${r.reason || (r.reasons || []).join(", ")}`
    );
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log("=== clean-intake.js — Step 0h ===");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "WRITE"}`);
  console.log();

  console.log("Loading MASTER_DEBT.jsonl...");
  const masterItems = readJsonl(MASTER_FILE);
  console.log(`  ${masterItems.length} master items loaded`);

  console.log("Loading scattered-intake.jsonl...");
  const intakeItems = readJsonl(INPUT_FILE);
  console.log(`  ${intakeItems.length} intake items loaded`);
  console.log();

  const indices = buildMasterIndices(masterItems);

  console.log("Phase 1: Deduplication (against MASTER_DEBT)...");
  const p1 = runPhase1Dedup(intakeItems, indices);
  console.log(`  ${p1.rejected.length} duplicates removed`);

  console.log("Phase 2: False Positive Detection...");
  const p2 = runPhase2FalsePositives(p1.surviving);
  console.log(`  ${p2.rejected.length} false positives removed`);

  console.log("Phase 3: Completed Work Detection...");
  const p3 = runPhase3Completed(p2.surviving, indices.resolvedTitles);
  console.log(`  ${p3.rejected.length} resolved items removed`);

  console.log("Phase 4: Item Verification...");
  const p4 = runPhase4Verification(p3.surviving);
  console.log(`  ${p4.rejected.length} items failed verification`);

  const surviving = p4.surviving;

  printSummaryReport(
    intakeItems.length,
    [p1.rejected.length, p2.rejected.length, p3.rejected.length, p4.rejected.length],
    surviving.length
  );

  if (VERBOSE) {
    printRejectionLog([...p1.rejected, ...p2.rejected, ...p3.rejected, ...p4.rejected]);
  }

  if (WRITE_MODE) {
    const output = surviving.map((item) => JSON.stringify(item)).join("\n") + "\n";
    try {
      fs.writeFileSync(OUTPUT_FILE, output, "utf-8");
      console.log();
      console.log(
        `Wrote ${surviving.length} clean items to ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`
      );
    } catch (err) {
      console.error(`Failed to write output: ${err.code || "UNKNOWN"}`);
      process.exit(1);
    }
  } else {
    console.log();
    console.log("DRY RUN — no file written. Use --write to write output.");
  }
}

main();
