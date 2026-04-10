"use strict";

/**
 * T29 Wave 4 Step 10 — Firecrawl candidate promotion to journal (one-shot)
 *
 * Session #273 built firecrawl's Standard artifacts manually (per the
 * now-documented anti-pattern in `feedback_skills_in_plans_are_tool_calls`
 * memory). The value-map.json has 21 candidates across 4 types but they
 * never landed in the canonical `.research/extraction-journal.jsonl`.
 *
 * Per `feedback_extractions_are_canon`: extractions are the whole point.
 * This script promotes the value-map.json candidates to journal entries,
 * mapping fields to the v2.0 schema, and appends them to the journal.
 *
 * After this runs:
 *   - `node scripts/cas/generate-extractions-md.js` to rebuild EXTRACTIONS.md
 *   - Update firecrawl analysis.json with depth=standard + candidates array
 *   - Self-audit should PASS
 *
 * Usage: node scripts/cas/promote-firecrawl-to-journal.js [--dry-run]
 *
 * One-shot. Not idempotent against existing entries — runs a duplicate
 * guard before appending.
 */

const path = require("node:path");
const { sanitizeError } = require("../lib/security-helpers.js");
const { safeWriteFileSync, isSafeToWrite } = require("../lib/safe-fs");
const { safeReadJson, safeReadText, validateCandidate } = require("../lib/safe-cas-io.js");

const PROJECT_ROOT = path.resolve(__dirname, "../.."); // validatePathInDir: constant-path (no user input)
const VALUE_MAP_PATH = path.join(
  PROJECT_ROOT,
  ".research",
  "analysis",
  "firecrawl",
  "value-map.json"
);
const JOURNAL_PATH = path.join(PROJECT_ROOT, ".research", "extraction-journal.jsonl");
const DRY_RUN = process.argv.includes("--dry-run");

const SOURCE = "mendableai/firecrawl";
const SOURCE_TYPE = "repo";
const DECISION_DATE = "2026-04-10";

function mapCandidate(vmCandidate) {
  // value-map candidate → journal entry (v2.0 schema)
  return {
    schema_version: "2.0",
    source_type: SOURCE_TYPE,
    source: SOURCE,
    candidate: vmCandidate.name,
    type: vmCandidate.type,
    decision: "defer", // default — user can reclassify during routing
    decision_date: DECISION_DATE,
    extracted_to: null,
    extracted_at: null,
    notes: vmCandidate.description || "",
    novelty: vmCandidate.novelty,
    effort: vmCandidate.effort,
    relevance: vmCandidate.relevance,
    tags: Array.isArray(vmCandidate.tags) ? vmCandidate.tags : [],
  };
}

// Load the value-map, collect candidates across all 4 type buckets, and
// print a type breakdown. Exits the process on read failure.
function loadValueMapCandidates() {
  let vm;
  try {
    // safeReadJson refuses parent-chain symlinks and rejects non-files.
    vm = safeReadJson(VALUE_MAP_PATH);
  } catch (err) {
    console.error("value-map read failed:", sanitizeError(err));
    process.exit(1);
  }

  const all = [
    ...(vm.pattern_candidates || []),
    ...(vm.knowledge_candidates || []),
    ...(vm.content_candidates || []),
    ...(vm.anti_pattern_candidates || []),
  ];

  console.log(
    `value-map candidates: pattern=${vm.pattern_candidates?.length || 0} ` +
      `knowledge=${vm.knowledge_candidates?.length || 0} ` +
      `content=${vm.content_candidates?.length || 0} ` +
      `anti-pattern=${vm.anti_pattern_candidates?.length || 0} ` +
      `total=${all.length}`
  );

  return all;
}

// Load the existing journal as raw lines and return { lines, existingForSource }.
function loadJournalAndCount() {
  let existingLines = [];
  try {
    // safeReadText refuses parent-chain symlinks and rejects non-files.
    existingLines = safeReadText(JOURNAL_PATH)
      .split("\n")
      .filter((l) => l.trim());
  } catch (err) {
    console.error("journal read failed:", sanitizeError(err));
    process.exit(1);
  }

  const existingForSource = existingLines.filter((l) => {
    try {
      const e = JSON.parse(l);
      return e.source === SOURCE;
    } catch {
      return false;
    }
  });
  console.log(`existing journal entries for ${SOURCE}: ${existingForSource.length}`);

  return { existingLines, existingForSource };
}

// Validate mapped journal entries before writing to the canonical file.
// validateCandidate() uses the Zod-backed candidateSchema against the
// candidate-shaped subset (name/type/description/novelty/effort/relevance/tags).
// The journal entry adds wrapper fields (schema_version, source, etc.) that
// are not part of the candidate schema, so we build a candidate-shaped view
// for validation only.
function validateJournalEntries(entries) {
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const candidateView = {
      name: e.candidate,
      type: e.type,
      description: e.notes || "",
      novelty: e.novelty,
      effort: e.effort,
      relevance: e.relevance,
      tags: Array.isArray(e.tags) ? e.tags : [],
    };
    const problems = validateCandidate(candidateView);
    if (problems.length > 0) {
      return {
        ok: false,
        reason: `entry ${i} (${e.candidate || "<unnamed>"}) invalid: ${problems.join(", ")}`,
      };
    }
  }
  return { ok: true };
}

function main() {
  console.log("Promote firecrawl value-map → extraction-journal" + (DRY_RUN ? " (dry run)" : ""));

  const all = loadValueMapCandidates();
  const { existingLines, existingForSource } = loadJournalAndCount();

  if (existingForSource.length > 0) {
    console.error(
      `Refusing to append: journal already has ${existingForSource.length} entries for ${SOURCE}. ` +
        "If you meant to re-run, manually remove those entries first."
    );
    process.exit(2);
  }

  // Map and validate before any write. PR #505 Qodo suggestion: validate
  // allowed enums + required string fields before appending to canonical file.
  const entries = all.map(mapCandidate);
  const check = validateJournalEntries(entries);
  if (!check.ok) {
    console.error("entry validation failed:", check.reason);
    process.exit(1);
  }

  const newLines = entries.map((e) => JSON.stringify(e));
  console.log(`new entries to append: ${newLines.length}`);

  // Preview
  for (const [i, e] of entries.entries()) {
    console.log(`  ${i + 1}. [${e.type}] ${e.candidate} (${e.relevance}/${e.novelty}/${e.effort})`);
  }

  if (DRY_RUN) {
    console.log("(dry run — no journal updates)");
    return;
  }

  // Append via safe-fs: isSafeToWrite and safeWriteFileSync BOTH refuse
  // parent-chain symlinks on JOURNAL_PATH (PR #505 "symlink write escape" fix).
  if (!isSafeToWrite(JOURNAL_PATH)) {
    console.error("isSafeToWrite refused:", JOURNAL_PATH);
    process.exit(1);
  }

  // Preserve trailing newline convention
  const newContent = [...existingLines, ...newLines].join("\n") + "\n";

  try {
    safeWriteFileSync(JOURNAL_PATH, newContent, "utf8");
  } catch (err) {
    console.error("write failed:", sanitizeError(err));
    process.exit(1);
  }

  console.log(`OK: appended ${newLines.length} entries to ${JOURNAL_PATH}`);
  console.log("Next: node scripts/cas/generate-extractions-md.js");
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
  mapCandidate,
  validateJournalEntries,
  SOURCE,
  SOURCE_TYPE,
  DECISION_DATE,
};
