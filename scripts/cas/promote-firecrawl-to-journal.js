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

const fs = require("node:fs");
const path = require("node:path");
const { sanitizeError } = require("../lib/security-helpers.js");
const { safeWriteFileSync, isSafeToWrite } = require("../lib/safe-fs");

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

function main() {
  console.log("Promote firecrawl value-map → extraction-journal" + (DRY_RUN ? " (dry run)" : ""));

  // Load value-map.json
  let vm;
  try {
    vm = JSON.parse(fs.readFileSync(VALUE_MAP_PATH, "utf8"));
  } catch (err) {
    console.error("value-map read failed:", sanitizeError(err));
    process.exit(1);
  }

  // Collect all candidates across the 4 type buckets
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

  // Load existing journal to dedup
  let existingLines = [];
  try {
    const raw = fs.readFileSync(JOURNAL_PATH, "utf8");
    existingLines = raw.split("\n").filter((l) => l.trim());
  } catch (err) {
    console.error("journal read failed:", sanitizeError(err));
    process.exit(1);
  }

  // Check for existing firecrawl entries
  const existingForSource = existingLines.filter((l) => {
    try {
      const e = JSON.parse(l);
      return e.source === SOURCE;
    } catch {
      return false;
    }
  });
  console.log(`existing journal entries for ${SOURCE}: ${existingForSource.length}`);

  if (existingForSource.length > 0) {
    console.error(
      `Refusing to append: journal already has ${existingForSource.length} entries for ${SOURCE}. ` +
        "If you meant to re-run, manually remove those entries first."
    );
    process.exit(2);
  }

  // Map and format
  const entries = all.map(mapCandidate);
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

  // Append atomically: read, append, write full file via safe-fs
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

try {
  main();
} catch (err) {
  console.error("Fatal:", sanitizeError(err));
  process.exit(1);
}
