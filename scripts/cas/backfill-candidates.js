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
    raw = fs.readFileSync(JOURNAL_PATH, "utf8");
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

function backfillOne(slug, journalBySource) {
  const ap = path.join(ANALYSIS_DIR, slug, "analysis.json");

  let st;
  try {
    st = fs.lstatSync(ap);
  } catch (err) {
    return { status: "MISSING", reason: sanitizeError(err) };
  }
  if (st.isSymbolicLink()) {
    return { status: "SKIP", reason: "symlinked analysis.json" };
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(ap, "utf8"));
  } catch (err) {
    return { status: "ERROR", reason: "read/parse: " + sanitizeError(err) };
  }

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

  const candidates = journalEntries.map(journalEntryToCandidate);

  // Guard against malformed mappings — all required fields must be present.
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const missing = ["name", "type", "description", "novelty", "effort", "relevance"].filter(
      (k) => c[k] === undefined || c[k] === null || c[k] === ""
    );
    if (missing.length > 0) {
      return {
        status: "ERROR",
        reason: `candidate ${i} missing fields: ${missing.join(", ")}`,
      };
    }
  }

  data.candidates = candidates;

  const result = validate(data, "analysis");
  if (!result.success) {
    return { status: "INVALID", reason: result.error };
  }

  if (!DRY_RUN) {
    if (!isSafeToWrite(ap)) {
      return { status: "ERROR", reason: "isSafeToWrite refused" };
    }
    try {
      safeWriteFileSync(ap, JSON.stringify(data, null, 2) + "\n", "utf8");
    } catch (err) {
      return { status: "ERROR", reason: "write: " + sanitizeError(err) };
    }
  }

  return {
    status: "BACKFILLED",
    reason: `${candidates.length} candidates from journal`,
  };
}

function main() {
  console.log("CAS backfill-candidates" + (DRY_RUN ? " (dry run)" : ""));

  const journal = loadJournal();
  console.log(`Journal: ${journal.length} entries`);

  // Group by source for fast lookup.
  const journalBySource = new Map();
  for (const entry of journal) {
    if (!entry.source) continue;
    if (!journalBySource.has(entry.source)) journalBySource.set(entry.source, []);
    journalBySource.get(entry.source).push(entry);
  }
  log(`Distinct sources in journal: ${journalBySource.size}`);

  // Build slug list.
  const slugs = [...STEP_85_SLUGS];

  if (SCAN_ALL) {
    const dirs = fs
      .readdirSync(ANALYSIS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_"));
    for (const d of dirs) {
      if (!slugs.includes(d.name)) slugs.push(d.name);
    }
  }

  console.log(`Scope: ${slugs.length} slugs` + (SCAN_ALL ? " (all)" : " (Step 8.5)"));
  console.log("---");

  let backfilled = 0;
  let skipped = 0;
  let errored = 0;

  for (const slug of slugs) {
    const result = backfillOne(slug, journalBySource);
    if (result.status === "SKIP" && !STEP_85_SLUGS.includes(slug)) {
      // Only log skips inside Step 8.5 scope; --all would be noisy.
      continue;
    }
    const label = result.status.padEnd(11);
    const suffix = result.reason ? " — " + result.reason : "";
    console.log(label + slug + suffix);

    if (result.status === "BACKFILLED") backfilled++;
    else if (result.status === "SKIP") skipped++;
    else errored++;
  }

  console.log("---");
  console.log(`Backfilled: ${backfilled} | Skipped: ${skipped} | Errored: ${errored}`);
  if (DRY_RUN) console.log("(dry run — no files written)");

  if (errored > 0) process.exit(1);
}

try {
  main();
} catch (err) {
  console.error("Fatal:", sanitizeError(err));
  process.exit(1);
}
