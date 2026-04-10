"use strict";

/**
 * Content Analysis System — Backfill Candidates from Journal (T29 Wave 4 Step 8.5)
 *
 * Session #273 self-audit discovered a v2→v3 migration gap: 9 repos have
 * extraction journal entries but empty `candidates: []` arrays in analysis.json.
 * The journal has the authoritative extraction data; analysis.json.candidates
 * is a mirror/cache for synthesis consumption. The v2→v3 migration
 * (scripts/cas/migrate-schemas.js) did not rebuild this mirror from the journal.
 *
 * Per the "extractions are canon" principle: the extraction data lives in the
 * journal. This script repopulates analysis.json.candidates from the journal
 * under the hood — no re-analysis required.
 *
 * Scope: the same 9 repos fixed by scripts/cas/fix-depth-mislabel.js, plus any
 * other analyses where the journal has entries but analysis.json.candidates is
 * empty (detected at runtime). aws-media-extraction is excluded per Step 8.5
 * scoping notes.
 *
 * Mapping (journal entry → candidate schema):
 *   candidate → name
 *   type      → type
 *   notes     → description
 *   novelty, effort, relevance, tags → identical
 *   (url and finding_refs are not present in journal entries — omitted)
 *
 * Usage:
 *   node scripts/cas/backfill-candidates.js [--dry-run] [--verbose] [--all]
 *
 *   --all  also scan other analyses for the same empty-candidates drift
 */

const fs = require("node:fs");
const path = require("node:path");
const { sanitizeError } = require("../lib/security-helpers.js");
const { safeWriteFileSync, isSafeToWrite } = require("../lib/safe-fs");
const { validate } = require("../lib/analysis-schema.js");
const { safeReadJson, safeReadText, validateCandidate } = require("../lib/safe-cas-io.js");

const PROJECT_ROOT = path.resolve(__dirname, "../.."); // validatePathInDir: constant-path (no user input)
const ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis");
const JOURNAL_PATH = path.join(PROJECT_ROOT, ".research", "extraction-journal.jsonl");
const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");
const SCAN_ALL = process.argv.includes("--all");

// Step 8.5 scope. Excludes aws-media-extraction (legitimate quick scan).
const STEP_85_SLUGS = [
  "bedrock-summarize-audio-video-text",
  "bulk-transcribe-youtube-playlist",
  "codecrafters-io-build-your-own-x",
  "hkuds-cli-anything",
  "karpathy-autoresearch",
  "public-apis_public-apis",
  "teng-lin_notebooklm-py",
  "viktoraxelsen-memskill",
  "youtube-transcript-api",
];

function log(msg) {
  if (VERBOSE) console.log("  " + msg);
}

function loadJournal() {
  let raw;
  try {
    // safeReadText refuses parent-chain symlinks and enforces regular-file.
    raw = safeReadText(JOURNAL_PATH);
  } catch (err) {
    throw new Error("Journal read failed: " + sanitizeError(err));
  }
  const entries = [];
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      entries.push(JSON.parse(line));
    } catch (err) {
      console.warn(`  Journal line ${i + 1} parse error: ${sanitizeError(err)}`);
    }
  }
  return entries;
}

function journalEntryToCandidate(entry) {
  return {
    name: entry.candidate,
    type: entry.type,
    description: entry.notes || "",
    novelty: entry.novelty,
    effort: entry.effort,
    relevance: entry.relevance,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
  };
}

// Helper: load analysis.json for a slug with full safety guards.
// Returns { status, data?, reason? } — status is one of:
//   OK       — data populated
//   MISSING  — file not found
//   ERROR    — unreadable, unparseable, or refused by safety guard
function loadAnalysisJson(ap) {
  try {
    return { status: "OK", data: safeReadJson(ap) };
  } catch (err) {
    if (err.code === "ENOENT") {
      return { status: "MISSING", reason: sanitizeError(err) };
    }
    return { status: "ERROR", reason: "read/parse: " + sanitizeError(err) };
  }
}

// Helper: convert journal entries to candidates and validate each one.
// Returns { ok: true, candidates } on success, { ok: false, reason } on failure.
// Uses validateCandidate() (Zod-backed) which accepts empty-string description
// as valid — fixes the PR #505 Qodo "empty-string description false failure".
function mapAndValidateCandidates(journalEntries) {
  const candidates = journalEntries.map(journalEntryToCandidate);
  for (let i = 0; i < candidates.length; i++) {
    const problems = validateCandidate(candidates[i]);
    if (problems.length > 0) {
      return {
        ok: false,
        reason: `candidate ${i} invalid: ${problems.join(", ")}`,
      };
    }
  }
  return { ok: true, candidates };
}

// Helper: persist the backfilled analysis record to disk.
// Write path goes through isSafeToWrite + safeWriteFileSync, which both
// refuse parent-chain symlinks.
function persistAnalysisJson(ap, data) {
  if (!isSafeToWrite(ap)) {
    return { ok: false, reason: "isSafeToWrite refused" };
  }
  try {
    safeWriteFileSync(ap, JSON.stringify(data, null, 2) + "\n", "utf8");
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: "write: " + sanitizeError(err) };
  }
}

function backfillOne(slug, journalBySource) {
  const ap = path.join(ANALYSIS_DIR, slug, "analysis.json");

  const load = loadAnalysisJson(ap);
  if (load.status !== "OK") {
    return { status: load.status, reason: load.reason };
  }
  const data = load.data;

  const source = data.source;
  if (!source) {
    return { status: "SKIP", reason: "no source field" };
  }

  const journalEntries = journalBySource.get(source) || [];
  if (journalEntries.length === 0) {
    return { status: "SKIP", reason: "no journal entries for source" };
  }

  if (Array.isArray(data.candidates) && data.candidates.length > 0) {
    return {
      status: "SKIP",
      reason: `already has ${data.candidates.length} candidates`,
    };
  }

  const mapped = mapAndValidateCandidates(journalEntries);
  if (!mapped.ok) {
    return { status: "ERROR", reason: mapped.reason };
  }

  data.candidates = mapped.candidates;

  const result = validate(data, "analysis");
  if (!result.success) {
    return { status: "INVALID", reason: result.error };
  }

  if (!DRY_RUN) {
    const written = persistAnalysisJson(ap, data);
    if (!written.ok) {
      return { status: "ERROR", reason: written.reason };
    }
  }

  return {
    status: "BACKFILLED",
    reason: `${mapped.candidates.length} candidates from journal`,
  };
}

// Helper: build a source → entries Map from a flat journal list.
function indexJournalBySource(journal) {
  const byS = new Map();
  for (const entry of journal) {
    if (!entry.source) continue;
    if (!byS.has(entry.source)) byS.set(entry.source, []);
    byS.get(entry.source).push(entry);
  }
  return byS;
}

// Helper: compute the full list of slugs to process, honoring --all.
function resolveSlugList() {
  const slugs = [...STEP_85_SLUGS];
  if (!SCAN_ALL) return slugs;
  const dirs = fs
    .readdirSync(ANALYSIS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"));
  for (const d of dirs) {
    if (!slugs.includes(d.name)) slugs.push(d.name);
  }
  return slugs;
}

// Helper: print a per-slug result line (or skip noisy --all skips).
function printResultLine(slug, result) {
  if (result.status === "SKIP" && !STEP_85_SLUGS.includes(slug)) {
    // Suppress in-scope skips outside Step 8.5 when running --all.
    return;
  }
  const label = result.status.padEnd(11);
  const suffix = result.reason ? " — " + result.reason : "";
  console.log(label + slug + suffix);
}

function main() {
  console.log("CAS backfill-candidates" + (DRY_RUN ? " (dry run)" : ""));

  const journal = loadJournal();
  console.log(`Journal: ${journal.length} entries`);

  const journalBySource = indexJournalBySource(journal);
  log(`Distinct sources in journal: ${journalBySource.size}`);

  const slugs = resolveSlugList();
  console.log(`Scope: ${slugs.length} slugs` + (SCAN_ALL ? " (all)" : " (Step 8.5)"));
  console.log("---");

  const counts = { backfilled: 0, skipped: 0, errored: 0 };

  for (const slug of slugs) {
    const result = backfillOne(slug, journalBySource);
    printResultLine(slug, result);
    if (result.status === "BACKFILLED") counts.backfilled++;
    else if (result.status === "SKIP") counts.skipped++;
    else counts.errored++;
  }

  console.log("---");
  console.log(
    `Backfilled: ${counts.backfilled} | Skipped: ${counts.skipped} | Errored: ${counts.errored}`
  );
  if (DRY_RUN) console.log("(dry run — no files written)");

  if (counts.errored > 0) process.exit(1);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error("Fatal:", sanitizeError(err));
    process.exit(1);
  }
}

module.exports = {
  loadJournal,
  journalEntryToCandidate,
  loadAnalysisJson,
  mapAndValidateCandidates,
  persistAnalysisJson,
  backfillOne,
  indexJournalBySource,
  resolveSlugList,
};
