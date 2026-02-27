#!/usr/bin/env node
/* global __dirname */
/* eslint-disable complexity */
/**
 * Process review-needed.jsonl — Step 0e of Technical Debt Resolution Plan.
 *
 * Analyzes dedup review pairs (S0/S1 items flagged for manual review) and
 * resolves them into: already-merged, true-duplicates, distinct-instances,
 * or genuinely-new items that need intake.
 *
 * Usage: node scripts/debt/process-review-needed.js [options]
 *
 * Options:
 *   --dry-run    Show what would be processed without writing (default)
 *   --write      Actually process and update files
 *   --verbose    Show detailed item-level output
 */

const fs = require("node:fs");
const path = require("node:path");
const { safeWriteFileSync, safeAppendFileSync } = require("../lib/safe-fs");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEBT_DIR = path.join(PROJECT_ROOT, "docs/technical-debt");
const REVIEW_FILE = path.join(DEBT_DIR, "raw/review-needed.jsonl");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const INTAKE_FILE = path.join(DEBT_DIR, "raw/scattered-intake.jsonl");

// --- Load existing data ---

function parseMasterLine(line, hashes, sourceIds, lineNum) {
  try {
    const item = JSON.parse(line);
    if (item.content_hash) hashes.add(item.content_hash);
    if (item.source_id) sourceIds.add(item.source_id);
    if (item.sonar_key) sourceIds.add(item.sonar_key);
    if (Array.isArray(item.merged_from)) {
      for (const m of item.merged_from) sourceIds.add(m);
    }
  } catch {
    console.warn(`Skipping corrupt JSONL line ${lineNum ?? "?"}`);
  }
}

function loadMasterHashes() {
  const hashes = new Set();
  const sourceIds = new Set();
  if (!fs.existsSync(MASTER_FILE)) return { hashes, sourceIds };
  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8").replaceAll("\uFEFF", "");
  } catch {
    return { hashes, sourceIds };
  }
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      parseMasterLine(line, hashes, sourceIds);
    } catch {
      // skip malformed lines
    }
  }
  return { hashes, sourceIds };
}

function loadReviewPairs() {
  const pairs = [];
  if (!fs.existsSync(REVIEW_FILE)) return pairs;
  try {
    const content = fs.readFileSync(REVIEW_FILE, "utf8").replaceAll("\uFEFF", "");
    for (const line of content.split("\n")) {
      if (!line.trim()) continue;
      try {
        pairs.push(JSON.parse(line));
      } catch {
        // skip
      }
    }
  } catch {
    // file read error
  }
  return pairs;
}

// --- Classification ---

function checkAlreadyTracked(a, b, masterSourceIds) {
  const mergedFrom = a.merged_from || [];
  if (mergedFrom.includes(b.source_id)) {
    return { disposition: "ALREADY_MERGED", reason: `item_b ${b.source_id} in item_a merged_from` };
  }
  if (masterSourceIds.has(b.source_id) || masterSourceIds.has(b.sonar_key)) {
    return { disposition: "ALREADY_IN_MASTER", reason: `item_b source already tracked` };
  }
  return null;
}

function classifyByFileAndRule(a, b) {
  if (a.file === b.file && a.rule === b.rule && a.line === b.line) {
    return { disposition: "TRUE_DUPLICATE", reason: `same file:line:rule` };
  }
  if (a.file === b.file && a.rule === b.rule && a.line !== b.line) {
    return {
      disposition: "DISTINCT_INSTANCE",
      reason: `same file+rule, line ${a.line} vs ${b.line}`,
    };
  }
  if (a.file === b.file && a.rule !== b.rule) {
    return { disposition: "DIFFERENT_ISSUE", reason: `same file, different rule` };
  }
  if (a.file !== b.file) {
    return { disposition: "DIFFERENT_FILE", reason: `${a.file} vs ${b.file}` };
  }
  return null;
}

function classifyPair(pair, masterSourceIds) {
  const a = pair.item_a;
  const b = pair.item_b;

  if (!a || !b) {
    return { disposition: "MALFORMED", reason: "missing item_a or item_b" };
  }

  const tracked = checkAlreadyTracked(a, b, masterSourceIds);
  if (tracked) return tracked;

  const fileRule = classifyByFileAndRule(a, b);
  if (fileRule) return fileRule;

  return { disposition: "NEEDS_MANUAL_REVIEW", reason: "could not auto-classify" };
}

// --- Build intake entry from item_b ---

function buildIntakeEntry(itemB, seqNum, today) {
  return {
    id: `INTAKE-REVIEW-${String(seqNum).padStart(4, "0")}`,
    source_id: itemB.source_id,
    source_file: itemB.source_file || "review-needed",
    category: itemB.category || "code-quality",
    severity: itemB.severity || "S2",
    type: itemB.type || "tech-debt",
    file: itemB.file || "",
    line: itemB.line || 0,
    title: (itemB.title || "").substring(0, 200),
    description: (itemB.description || "").substring(0, 500),
    recommendation: itemB.recommendation || "",
    effort: itemB.effort || "E1",
    status: "NEW",
    roadmap_ref: itemB.roadmap_ref || null,
    created: today,
    verified_by: null,
    resolution: null,
    content_hash: itemB.content_hash || "",
    rule: itemB.rule || null,
    sonar_key: itemB.sonar_key || null,
  };
}

// --- Classify all pairs ---

function classifyAllPairs(pairs, masterSourceIds) {
  const results = {
    ALREADY_MERGED: [],
    ALREADY_IN_MASTER: [],
    TRUE_DUPLICATE: [],
    DISTINCT_INSTANCE: [],
    DIFFERENT_ISSUE: [],
    DIFFERENT_FILE: [],
    NEEDS_MANUAL_REVIEW: [],
    MALFORMED: [],
  };
  for (const pair of pairs) {
    const classification = classifyPair(pair, masterSourceIds);
    results[classification.disposition].push({ pair, ...classification });
  }
  return results;
}

// --- Compute new items eligible for intake ---

function computeNewItems(results, masterHashes) {
  const toIngest = [
    ...results.DISTINCT_INSTANCE,
    ...results.DIFFERENT_ISSUE,
    ...results.DIFFERENT_FILE,
  ];
  return toIngest.filter((r) => {
    const hash = r.pair.item_b?.content_hash;
    return hash && !masterHashes.has(hash);
  });
}

// --- Print verbose details ---

function printVerboseDetails(newItems, manualReviewItems) {
  if (newItems.length > 0) {
    console.log("\n   New items for intake:");
    for (const r of newItems) {
      const b = r.pair.item_b;
      console.log(`     [${b.severity}] ${b.file}:${b.line} — ${(b.title || "").substring(0, 60)}`);
    }
  }
  if (manualReviewItems.length > 0) {
    console.log("\n   Manual review needed:");
    for (const r of manualReviewItems) {
      const b = r.pair.item_b;
      console.log(`     ${b.file}:${b.line} — ${r.reason}`);
    }
  }
}

// --- Find next sequence number from existing intake file ---

function findNextIntakeSeq() {
  let nextSeq = 1;
  if (!fs.existsSync(INTAKE_FILE)) return nextSeq;
  try {
    const content = fs.readFileSync(INTAKE_FILE, "utf8");
    for (const line of content.split("\n")) {
      if (!line.trim()) continue;
      try {
        const item = JSON.parse(line);
        const match = (item.id || "").match(/^INTAKE-REVIEW-(\d+)$/);
        if (match) nextSeq = Math.max(nextSeq, Number.parseInt(match[1], 10) + 1);
      } catch {
        // skip
      }
    }
  } catch {
    // skip
  }
  return nextSeq;
}

// --- Write results to disk ---

function writeResults(newItems, manualReviewItems) {
  if (newItems.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const nextSeq = findNextIntakeSeq();
    const entries = newItems.map((r, i) => buildIntakeEntry(r.pair.item_b, nextSeq + i, today));
    const jsonlContent = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
    safeAppendFileSync(INTAKE_FILE, jsonlContent, "utf-8");
    console.log(
      `\n   Appended ${entries.length} items to ${path.relative(PROJECT_ROOT, INTAKE_FILE)}`
    );
  }

  if (manualReviewItems.length === 0) {
    safeWriteFileSync(REVIEW_FILE, "", "utf-8");
    console.log(`   Cleared ${path.relative(PROJECT_ROOT, REVIEW_FILE)} (all pairs resolved)`);
  } else {
    const remaining = manualReviewItems.map((r) => JSON.stringify(r.pair)).join("\n") + "\n";
    safeWriteFileSync(REVIEW_FILE, remaining, "utf-8");
    console.log(
      `   Kept ${manualReviewItems.length} unresolved pairs in ${path.relative(PROJECT_ROOT, REVIEW_FILE)}`
    );
  }
}

// --- Main ---

function main() {
  const args = new Set(process.argv.slice(2));
  const writeMode = args.has("--write");
  const verbose = args.has("--verbose");

  console.log("\nProcess review-needed.jsonl (Step 0e)");
  console.log(`   Mode: ${writeMode ? "WRITE" : "DRY RUN (use --write to save)"}`);

  const { hashes: masterHashes, sourceIds: masterSourceIds } = loadMasterHashes();
  const pairs = loadReviewPairs();

  console.log(`   MASTER_DEBT hashes: ${masterHashes.size}`);
  console.log(`   MASTER_DEBT source IDs: ${masterSourceIds.size}`);
  console.log(`   Review pairs to process: ${pairs.length}`);

  const results = classifyAllPairs(pairs, masterSourceIds);

  console.log("\n   Classification results:");
  for (const [disposition, items] of Object.entries(results)) {
    if (items.length > 0) console.log(`     ${disposition.padEnd(25)} ${items.length}`);
  }

  const newItems = computeNewItems(results, masterHashes);

  console.log(
    `\n   Items eligible for intake: ${results.DISTINCT_INSTANCE.length + results.DIFFERENT_ISSUE.length + results.DIFFERENT_FILE.length}`
  );
  console.log(`   After hash dedup vs MASTER: ${newItems.length}`);
  console.log(
    `   Safely resolved (no action): ${pairs.length - newItems.length - results.NEEDS_MANUAL_REVIEW.length}`
  );
  console.log(`   Needs manual review: ${results.NEEDS_MANUAL_REVIEW.length}`);

  if (verbose) printVerboseDetails(newItems, results.NEEDS_MANUAL_REVIEW);

  if (!writeMode) {
    console.log(`\n   DRY RUN complete. Use --write to append new items to scattered-intake.jsonl`);
    return;
  }

  writeResults(newItems, results.NEEDS_MANUAL_REVIEW);
}

main();
