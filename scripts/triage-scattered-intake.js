#!/usr/bin/env node
/* global __dirname */
/**
 * triage-scattered-intake.js
 *
 * Triages the 374 INTAKE-CODE / INTAKE-REPORT / INTAKE-ROAD items from
 * scattered-intake.jsonl. Classifies each as INGEST, DUPLICATE, STALE, or VAGUE
 * and appends genuinely new items to MASTER_DEBT.jsonl.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const SCATTERED = path.join(ROOT, "docs/technical-debt/raw/scattered-intake.jsonl");
const MASTER = path.join(ROOT, "docs/technical-debt/MASTER_DEBT.jsonl");
const DEDUPED = path.join(ROOT, "docs/technical-debt/raw/deduped.jsonl");
const REPORT = path.join(ROOT, "docs/technical-debt/raw/scattered-triage-report.jsonl");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJsonl(filePath) {
  try {
    return fs
      .readFileSync(filePath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line, idx) => {
        try {
          return JSON.parse(line);
        } catch {
          console.warn(`  WARN: bad JSON at ${filePath}:${idx + 1}`);
          return null;
        }
      })
      .filter(Boolean);
  } catch (err) {
    console.error(`Failed to read ${filePath}: ${err.message}`);
    process.exit(1);
  }
}

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

/** Simple word-overlap similarity (Jaccard-ish) on normalized title tokens */
function titleSimilarity(a, b) {
  const tokA = new Set(
    normalize(a)
      .split(" ")
      .filter((t) => t.length > 2)
  );
  const tokB = new Set(
    normalize(b)
      .split(" ")
      .filter((t) => t.length > 2)
  );
  if (tokA.size === 0 || tokB.size === 0) return 0;
  let overlap = 0;
  for (const t of tokA) {
    if (tokB.has(t)) overlap++;
  }
  const union = new Set([...tokA, ...tokB]).size;
  return overlap / union;
}

function contentHash(item) {
  const payload = `${item.title}|${item.file || ""}|${item.category}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function fileExists(relPath) {
  if (!relPath) return false;
  const abs = path.resolve(ROOT, relPath);
  try {
    return fs.existsSync(abs);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Vagueness heuristics
// ---------------------------------------------------------------------------

/** Returns true if the item is too vague / is a section header / not actionable */
function isVague(item) {
  const t = (item.title || "").trim();

  // Section headers from aggregated reports — not actual findings
  const headerPatterns = [
    /^critical findings/i,
    /^high severity findings/i,
    /^medium severity/i,
    /^low severity/i,
    /^ai model comparison/i,
    /^implementation priority/i,
    /^priority \d/i,
    /^phase \d/i,
    /^overall assessment/i,
    /^summary of/i,
    /^conclusion/i,
    /^executive summary/i,
    /^recommendations$/i,
    /^appendix/i,
    /^table of contents/i,
    /^introduction$/i,
    /^overview$/i,
    /^methodology$/i,
    /^scope$/i,
    /^findings$/i,
    /^risk assessment$/i,
    /^next steps$/i,
    /^action items$/i,
    /^references$/i,
  ];
  for (const pat of headerPatterns) {
    if (pat.test(t)) return true;
  }

  // Too short to be actionable
  if (t.length < 10) return true;

  // Purely meta / not tied to code
  if (/^(note|reminder|idea|thought|question):/i.test(t)) return true;

  // Generic "consider" without specifics
  if (/^consider /i.test(t) && t.length < 50 && !item.file) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Staleness heuristics
// ---------------------------------------------------------------------------

/** Returns true if the item references completed/removed work */
function isStale(item) {
  const t = item.title || "";
  const d = item.description || "";
  const combined = `${t} ${d}`;

  // Already-done items (roadmap items with checkmarks)
  if (/✅|done\)|completed\)|finished\)/i.test(combined)) return true;
  if (/\(done\)/i.test(combined)) return true;

  // References a specific file that no longer exists
  if (item.file && item.file !== "package.json" && !fileExists(item.file)) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Triage helpers (extracted from main to reduce cognitive complexity)
// ---------------------------------------------------------------------------

/** Builds masterTitles array, masterHashes set, and finds max DEBT ID */
function buildMasterIndex(master) {
  const masterTitles = master.map((m) => ({
    id: m.id,
    normTitle: normalize(m.title),
    file: m.file || "",
    hash: m.content_hash,
  }));

  const masterHashes = new Set(master.map((m) => m.content_hash));

  let maxDebtId = 0;
  for (const m of master) {
    const match = (m.id || "").match(/DEBT-(\d+)/);
    if (match) {
      const n = Number.parseInt(match[1], 10);
      if (n > maxDebtId) maxDebtId = n;
    }
  }

  return { masterTitles, masterHashes, maxDebtId };
}

/** Checks fuzzy title duplicate against master index */
function findFuzzyDuplicate(item, masterTitles) {
  for (const mt of masterTitles) {
    const sim = titleSimilarity(item.title, mt.normTitle);
    if (sim >= 0.7) return mt.id;
    if (item.file && item.file === mt.file && sim >= 0.5) return mt.id;
  }
  return null;
}

/** Checks if an INTAKE-REPORT item is a generic finding without file specificity */
function isGenericReportFinding(item) {
  if (!item.id.startsWith("INTAKE-REPORT")) return false;
  const d = item.description || "";
  if (item.file || !d.startsWith("Finding from") || item.title.length >= 60) return false;

  const genericPatterns = [
    /^add /i,
    /^implement /i,
    /^create /i,
    /^consider /i,
    /^improve /i,
    /^enhance /i,
    /^update /i,
    /^fix /i,
    /^resolve /i,
    /^address /i,
    /^remove /i,
    /^clean/i,
    /^refactor/i,
    /^optimize/i,
  ];
  return genericPatterns.some((p) => p.test(item.title)) && !item.file && item.title.length < 45;
}

/** Triages a single candidate item, returns { category, item } */
function triageCandidate(item, masterTitles, masterHashes) {
  // Exact content_hash duplicate
  if (item.content_hash && masterHashes.has(item.content_hash)) {
    return {
      category: "DUPLICATE",
      item: { ...item, triage_reason: "exact hash match in MASTER" },
    };
  }

  // Vagueness (section headers, non-actionable)
  if (isVague(item)) {
    return {
      category: "VAGUE",
      item: { ...item, triage_reason: "non-actionable or section header" },
    };
  }

  // Staleness (completed items, missing files)
  if (isStale(item)) {
    const reason = /✅|done\)|completed\)/i.test(`${item.title} ${item.description}`)
      ? "marked as done/completed"
      : `referenced file missing: ${item.file}`;
    return { category: "STALE", item: { ...item, triage_reason: reason } };
  }

  // Fuzzy title duplicate check
  const dupMatch = findFuzzyDuplicate(item, masterTitles);
  if (dupMatch) {
    return {
      category: "DUPLICATE",
      item: { ...item, triage_reason: `fuzzy title match with ${dupMatch}` },
    };
  }

  // Additional vagueness checks for INTAKE-REPORT
  if (isGenericReportFinding(item)) {
    return {
      category: "VAGUE",
      item: { ...item, triage_reason: "generic report finding without file specificity" },
    };
  }

  // Passes all filters
  return { category: "INGEST", item };
}

/** Assigns DEBT IDs to ingested items and builds the append array */
function buildIngestItems(ingestItems, maxDebtId) {
  let nextId = maxDebtId + 1;
  const toAppend = [];

  for (const item of ingestItems) {
    const debtId = `DEBT-${String(nextId).padStart(4, "0")}`;
    const newItem = {
      ...item,
      id: debtId,
      content_hash: contentHash(item),
      status: "NEW",
      created: "2026-02-21",
      intake_source_id: item.id, // preserve original intake ID
    };
    // Remove triage artifacts
    delete newItem.triage_reason;
    delete newItem.cleaning_disposition;
    toAppend.push(newItem);
    nextId++;
  }

  return toAppend;
}

/** Appends new items to MASTER and syncs to deduped */
function writeResults(toAppend) {
  if (toAppend.length > 0) {
    const appendStr = toAppend.map((i) => JSON.stringify(i)).join("\n") + "\n";
    fs.appendFileSync(MASTER, appendStr);
    console.log(`\nAppended ${toAppend.length} items to MASTER_DEBT.jsonl`);
    console.log(`  ID range: ${toAppend[0].id} – ${toAppend[toAppend.length - 1].id}`);

    // Copy MASTER to deduped.jsonl to keep in sync
    fs.copyFileSync(MASTER, DEDUPED);
    console.log(`  Synced MASTER_DEBT.jsonl → raw/deduped.jsonl`);
  } else {
    console.log("\nNo items to ingest.");
  }
}

/** Writes the detailed triage report JSONL */
function writeTriageReport(results, toAppend) {
  const reportLines = [];
  for (const cat of ["INGEST", "DUPLICATE", "STALE", "VAGUE"]) {
    for (const item of results[cat]) {
      reportLines.push(
        JSON.stringify({
          original_id: item.intake_source_id || item.id,
          new_id:
            cat === "INGEST" ? toAppend.find((a) => a.intake_source_id === item.id)?.id : null,
          disposition: cat,
          reason: item.triage_reason || (cat === "INGEST" ? "new actionable finding" : ""),
          title: item.title,
          file: item.file || "",
          category: item.category,
          severity: item.severity,
        })
      );
    }
  }
  fs.writeFileSync(REPORT, reportLines.join("\n") + "\n");
  console.log(`\nTriage report written to: ${path.relative(ROOT, REPORT)}`);
  console.log(`  (${reportLines.length} entries)`);
}

/** Prints triage summary and sample items */
function printReport(results, candidates, toAppend) {
  // Summary
  console.log("\n--- Triage Results ---");
  console.log(`INGEST:    ${results.INGEST.length}`);
  console.log(`DUPLICATE: ${results.DUPLICATE.length}`);
  console.log(`STALE:     ${results.STALE.length}`);
  console.log(`VAGUE:     ${results.VAGUE.length}`);
  console.log(`TOTAL:     ${candidates.length}`);

  // Breakdown by prefix
  for (const cat of ["INGEST", "DUPLICATE", "STALE", "VAGUE"]) {
    const byPrefix = {};
    for (const item of results[cat]) {
      const prefix = (item.id || "").replace(/-\d+$/, "");
      byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;
    }
    if (Object.keys(byPrefix).length > 0) {
      console.log(`  ${cat} by prefix: ${JSON.stringify(byPrefix)}`);
    }
  }

  // INGEST sample
  if (toAppend.length > 0) {
    console.log("\n--- Sample Ingested Items ---");
    const sample = toAppend.slice(0, 10);
    for (const item of sample) {
      console.log(`  ${item.id} [${item.severity}] ${item.title.substring(0, 80)}`);
    }
    if (toAppend.length > 10) {
      console.log(`  ... and ${toAppend.length - 10} more`);
    }
  }

  // Discard samples
  for (const cat of ["DUPLICATE", "STALE", "VAGUE"]) {
    if (results[cat].length > 0) {
      console.log(`\n--- Sample ${cat} Items ---`);
      const sample = results[cat].slice(0, 5);
      for (const item of sample) {
        console.log(`  ${item.id}: ${item.title.substring(0, 70)} → ${item.triage_reason}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("=== Scattered Intake Triage ===\n");

  // 1. Read inputs
  const scattered = readJsonl(SCATTERED);
  const master = readJsonl(MASTER);

  // Filter to only the 374 target prefixes
  const TARGET_PREFIXES = ["INTAKE-CODE", "INTAKE-REPORT", "INTAKE-ROAD"];
  const candidates = scattered.filter((item) =>
    TARGET_PREFIXES.some((p) => (item.id || "").startsWith(p))
  );

  console.log(`Scattered total: ${scattered.length}`);
  console.log(`Target items (CODE+REPORT+ROAD): ${candidates.length}`);
  console.log(`MASTER_DEBT items: ${master.length}`);

  // 2. Build MASTER index for dedup
  const { masterTitles, masterHashes, maxDebtId } = buildMasterIndex(master);
  console.log(`Max DEBT ID: DEBT-${String(maxDebtId).padStart(4, "0")}`);

  // 3. Triage each candidate
  const results = { INGEST: [], DUPLICATE: [], STALE: [], VAGUE: [] };
  for (const item of candidates) {
    const { category, item: triaged } = triageCandidate(item, masterTitles, masterHashes);
    results[category].push(triaged);
  }

  // 4. Print summary
  const toAppend = buildIngestItems(results.INGEST, maxDebtId);
  printReport(results, candidates, toAppend);

  // 5. Write results
  writeResults(toAppend);

  // 6. Write detailed triage report
  writeTriageReport(results, toAppend);
}

main();
