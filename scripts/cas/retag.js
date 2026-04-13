#!/usr/bin/env node
"use strict";

/**
 * Content Analysis System — Tag Retagging CLI
 *
 * Applies approved batch retagging to .research/extraction-journal.jsonl under
 * the vocabulary at .research/tag-vocabulary.json. Part of T40 CAS tag quality
 * plan — see .claude/skills/shared/CONVENTIONS.md §14.
 *
 * Usage:
 *   node scripts/cas/retag.js apply --batch-file <path> [--dry-run]
 *   node scripts/cas/retag.js validate [--strict] [--verbose]
 *
 * Exit codes:
 *   0 = success (or dry-run preview with no violations)
 *   1 = validation failure or user error (no writes performed)
 *   2 = fatal (I/O error, regression guard tripped, lock failure)
 */

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { sanitizeError } = require("../lib/security-helpers.js");
const {
  safeAtomicWriteSync,
  isSafeToWrite,
  withLock,
  readTextWithSizeGuard,
} = require("../lib/safe-fs");
const { safeParseLine } = require("../lib/parse-jsonl-line");

const mutations = require("../lib/retag-mutations.js");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const JOURNAL_PATH = path.join(PROJECT_ROOT, ".research", "extraction-journal.jsonl");
const VOCAB_PATH = path.join(PROJECT_ROOT, ".research", "tag-vocabulary.json");
const REBUILD_INDEX_SCRIPT = path.join(PROJECT_ROOT, "scripts", "cas", "rebuild-index.js");

function parseCliArgs(argv) {
  const args = { _: [], dryRun: false, strict: false, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--strict") args.strict = true;
    else if (a === "--verbose") args.verbose = true;
    else if (a === "--batch-file") {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        throw new Error("missing value for --batch-file");
      }
      args.batchFile = next;
      i++;
    } else if (a.startsWith("--")) throw new Error(`unknown flag: ${a}`);
    else args._.push(a);
  }
  return args;
}

function loadVocabulary() {
  return JSON.parse(readTextWithSizeGuard(VOCAB_PATH));
}

function loadJournal() {
  const text = readTextWithSizeGuard(JOURNAL_PATH);
  const lines = text.split("\n");
  const entries = [];
  const rawLines = [];
  for (const line of lines) {
    if (!line.trim()) {
      rawLines.push({ raw: line, entry: null });
      continue;
    }
    const entry = safeParseLine(line);
    if (!entry) {
      rawLines.push({ raw: line, entry: null });
      continue;
    }
    rawLines.push({ raw: line, entry });
    entries.push(entry);
  }
  return { entries, rawLines };
}

function rewriteRawLines(rawLines, entryUpdatesByKey) {
  return rawLines.map(({ raw, entry }) => {
    if (!entry) return { raw, entry: null };
    const key = mutations.entryKey(entry);
    if (entryUpdatesByKey.has(key)) {
      const newTags = entryUpdatesByKey.get(key);
      const updated = { ...entry, tags: newTags };
      return { raw: JSON.stringify(updated), entry: updated };
    }
    return { raw, entry };
  });
}

function serializeRawLines(rawLines) {
  const out = rawLines.map((x) => x.raw).join("\n");
  if (out.length === 0) return out;
  return out.endsWith("\n") ? out : out + "\n";
}

function readBatchFile(batchFilePath) {
  try {
    return JSON.parse(readTextWithSizeGuard(batchFilePath));
  } catch (err) {
    if (err?.code === "ENOENT") {
      console.error(`error: batch file not found: ${batchFilePath}`);
    } else {
      console.error(`error: batch file is not valid JSON: ${sanitizeError(err)}`);
    }
    process.exit(1);
  }
}

function applyNewVocabularyOrExit(originalVocab, batch) {
  if (!Array.isArray(batch.new_vocabulary) || batch.new_vocabulary.length === 0) {
    return originalVocab;
  }
  const addRes = mutations.addNewVocabulary(originalVocab, batch.new_vocabulary);
  if (addRes.errors.length > 0) {
    console.error("error: new_vocabulary additions rejected:");
    for (const e of addRes.errors) console.error("  - " + e);
    process.exit(1);
  }
  return addRes.vocab;
}

function collectEntryIssues(classified, semCount) {
  const issues = [];
  if (classified.forbidden.length > 0) {
    issues.push("forbidden tags: " + classified.forbidden.map((f) => f.tag).join(", "));
  }
  if (classified.invalid.length > 0) {
    issues.push("unknown tags: " + classified.invalid.map((f) => f.tag).join(", "));
  }
  if (semCount < 3) {
    issues.push(`only ${semCount} semantic tags — §14.1 requires at least 3`);
  }
  return issues;
}

function classifyBatchEntries(batch, vocab) {
  const perEntryReports = [];
  let anyIssues = false;
  for (const be of batch.entries) {
    const classified = mutations.classifyTags(be.tags, vocab);
    const semCount = mutations.semanticCount(classified.canonicalTags, vocab);
    const issues = collectEntryIssues(classified, semCount);
    if (issues.length > 0) anyIssues = true;
    perEntryReports.push({
      key: `${be.source}|${be.candidate}|${be.type}`,
      originalTags: be.tags,
      canonicalTags: classified.canonicalTags,
      synonymsApplied: classified.synonymsApplied,
      issues,
    });
  }
  return { perEntryReports, anyIssues };
}

function printApplySummary(batch, applyRes, perEntryReports) {
  console.log(`Batch ${batch.batch_id}:`);
  console.log(`  entries retagged:  ${applyRes.retagged.length}`);
  console.log(`  entries unmatched: ${applyRes.unmatched.length}`);
  if (Array.isArray(batch.new_vocabulary) && batch.new_vocabulary.length > 0) {
    console.log(`  new vocabulary:    ${batch.new_vocabulary.length}`);
    for (const nv of batch.new_vocabulary) {
      console.log(`    + ${nv.tag} (${nv.category})`);
    }
  }
  if (applyRes.unmatched.length > 0) {
    console.warn("warning: the following composite keys were not found in the journal:");
    for (const u of applyRes.unmatched) console.warn("  - " + u);
  }
  for (const r of perEntryReports) {
    const synonymEntries = Object.entries(r.synonymsApplied);
    if (synonymEntries.length === 0) continue;
    console.log(`  synonyms applied on ${r.key}:`);
    for (const [from, to] of synonymEntries) {
      console.log(`    ${from} -> ${to}`);
    }
  }
}

/**
 * Write journal + vocabulary atomically. Nested withLock holds both locks
 * across the pair of atomic rewrites so journal+vocab remain consistent for
 * concurrent readers. Each rewrite is itself crash-safe (tmp file + rename
 * via safeAtomicWriteSync), so a process interrupt during the critical
 * section leaves the pre-existing files intact rather than truncated.
 */
function writeJournalAndVocab(newRawLines, countedVocab) {
  if (!isSafeToWrite(JOURNAL_PATH)) {
    throw new Error(`refusing to write — journal path is a symlink`);
  }
  if (!isSafeToWrite(VOCAB_PATH)) {
    throw new Error(`refusing to write — vocabulary path is a symlink`);
  }
  withLock(JOURNAL_PATH, () => {
    withLock(VOCAB_PATH, () => {
      safeAtomicWriteSync(JOURNAL_PATH, serializeRawLines(newRawLines), "utf8");
      safeAtomicWriteSync(VOCAB_PATH, JSON.stringify(countedVocab, null, 2) + "\n", "utf8");
    });
  });
}

/**
 * Rebuild the SQLite index after a successful retag apply. Uses
 * process.execPath (absolute, fixed, unwriteable) rather than the literal
 * "node" so the spawn does not perform a PATH lookup (SonarCloud S4036).
 */
function runRebuildIndex() {
  console.log("Rebuilding SQLite index...");
  const res = spawnSync(process.execPath, [REBUILD_INDEX_SCRIPT], {
    stdio: "inherit",
    timeout: 120_000,
  });
  if (res.error) {
    console.error(
      `warning: rebuild-index failed to start: ${sanitizeError(res.error)}. Run \`node scripts/cas/rebuild-index.js\` manually.`
    );
    process.exit(2);
  }
  if (res.signal) {
    console.error(
      `warning: rebuild-index terminated by signal ${res.signal}. Run \`node scripts/cas/rebuild-index.js\` manually.`
    );
    process.exit(2);
  }
  if (res.status !== 0) {
    console.error(
      "warning: rebuild-index returned non-zero. Run `node scripts/cas/rebuild-index.js` manually."
    );
    process.exit(2);
  }
}

function cmdApply(args) {
  if (!args.batchFile) {
    console.error("error: --batch-file <path> required for apply");
    process.exit(1);
  }
  const batchPath = path.resolve(args.batchFile);
  const batch = readBatchFile(batchPath);

  const shapeCheck = mutations.validateBatchShape(batch);
  if (!shapeCheck.valid) {
    console.error("error: batch file shape invalid:");
    for (const e of shapeCheck.errors) console.error("  - " + e);
    process.exit(1);
  }

  const originalVocab = loadVocabulary();
  const { entries: journalEntries, rawLines } = loadJournal();
  const vocab = applyNewVocabularyOrExit(originalVocab, batch);

  const { perEntryReports, anyIssues } = classifyBatchEntries(batch, vocab);
  if (anyIssues) {
    console.error("error: batch has validation failures:");
    for (const r of perEntryReports) {
      if (r.issues.length === 0) continue;
      console.error(`  ${r.key}`);
      for (const i of r.issues) console.error(`    - ${i}`);
    }
    process.exit(1);
  }

  const applyRes = mutations.applyBatch(journalEntries, batch, vocab);
  printApplySummary(batch, applyRes, perEntryReports);

  if (args.dryRun) {
    console.log("(dry run — nothing written)");
    process.exit(0);
  }

  const newRawLines = rewriteRawLines(rawLines, applyRes.entryUpdates);
  mutations.assertRegression(rawLines, newRawLines, batch, applyRes);
  const countedVocab = mutations.recomputeCounts(vocab, applyRes.journalEntries);

  writeJournalAndVocab(newRawLines, countedVocab);
  console.log("Journal and vocabulary written.");

  runRebuildIndex();
  console.log("Done.");
}

function classifyEntryForValidation(entry, vocab, report) {
  const key = mutations.entryKey(entry);
  const tags = entry.tags || [];
  if (tags.length === 0) {
    report.with_zero_tags++;
    report.details.push({ key, issues: ["no tags"] });
    return;
  }
  const classified = mutations.classifyTags(tags, vocab);
  const semCount = mutations.semanticCount(classified.canonicalTags, vocab);
  const issues = [];
  if (classified.forbidden.length > 0) {
    issues.push("forbidden: " + classified.forbidden.map((f) => f.tag).join(", "));
    report.with_forbidden++;
  }
  if (classified.invalid.length > 0) {
    issues.push("unknown: " + classified.invalid.map((f) => f.tag).join(", "));
    report.with_unknown++;
  }
  if (semCount < 3) {
    issues.push(`only ${semCount} semantic (§14.1 requires ≥3)`);
    report.with_few_semantic++;
  }
  if (issues.length > 0) {
    report.details.push({ key, issues });
  }
}

function cmdValidate(args) {
  const vocab = loadVocabulary();
  const { entries } = loadJournal();

  const report = {
    total: entries.length,
    with_forbidden: 0,
    with_unknown: 0,
    with_few_semantic: 0,
    with_zero_tags: 0,
    details: [],
  };

  for (const entry of entries) {
    classifyEntryForValidation(entry, vocab, report);
  }

  console.log("Validate report:");
  console.log("  total entries:       " + report.total);
  console.log("  with forbidden tags: " + report.with_forbidden);
  console.log("  with unknown tags:   " + report.with_unknown);
  console.log("  with <3 semantic:    " + report.with_few_semantic);
  console.log("  with zero tags:      " + report.with_zero_tags);

  if (args.verbose && report.details.length > 0) {
    console.log("\nDetails:");
    for (const d of report.details) {
      console.log(`  ${d.key}: ${d.issues.join("; ")}`);
    }
  }

  const entriesWithIssues = report.details.length;

  if (args.strict && entriesWithIssues > 0) {
    console.error(`strict mode: ${entriesWithIssues} entries with violations`);
    process.exit(1);
  }
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    console.error("usage: node scripts/cas/retag.js <apply|validate> [options]");
    process.exit(1);
  }
  const subcommand = argv[0];
  const args = parseCliArgs(argv.slice(1));

  switch (subcommand) {
    case "apply":
      cmdApply(args);
      break;
    case "validate":
      cmdValidate(args);
      break;
    default:
      console.error(`unknown subcommand: ${subcommand}`);
      console.error("usage: node scripts/cas/retag.js <apply|validate> [options]");
      process.exit(1);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`fatal: ${sanitizeError(err)}`);
    process.exit(2);
  }
}

module.exports = {
  parseCliArgs,
  loadVocabulary,
  loadJournal,
  rewriteRawLines,
  serializeRawLines,
  cmdApply,
  cmdValidate,
  // Paths exported for test fixtures
  JOURNAL_PATH,
  VOCAB_PATH,
};
