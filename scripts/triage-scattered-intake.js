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

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
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
  const d = (item.description || "").trim();

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
  const masterTitles = master.map((m) => ({
    id: m.id,
    normTitle: normalize(m.title),
    file: m.file || "",
    hash: m.content_hash,
  }));

  const masterHashes = new Set(master.map((m) => m.content_hash));

  // Find max DEBT ID
  let maxDebtId = 0;
  for (const m of master) {
    const match = (m.id || "").match(/DEBT-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxDebtId) maxDebtId = n;
    }
  }
  console.log(`Max DEBT ID: DEBT-${String(maxDebtId).padStart(4, "0")}`);

  // 3. Triage each candidate
  const results = {
    INGEST: [],
    DUPLICATE: [],
    STALE: [],
    VAGUE: [],
  };

  for (const item of candidates) {
    // 3a. Check exact content_hash duplicate
    if (item.content_hash && masterHashes.has(item.content_hash)) {
      results.DUPLICATE.push({ ...item, triage_reason: "exact hash match in MASTER" });
      continue;
    }

    // 3b. Check vagueness (section headers, non-actionable)
    if (isVague(item)) {
      results.VAGUE.push({ ...item, triage_reason: "non-actionable or section header" });
      continue;
    }

    // 3c. Check staleness (completed items, missing files)
    if (isStale(item)) {
      const reason = /✅|done\)|completed\)/i.test(`${item.title} ${item.description}`)
        ? "marked as done/completed"
        : `referenced file missing: ${item.file}`;
      results.STALE.push({ ...item, triage_reason: reason });
      continue;
    }

    // 3d. Fuzzy title duplicate check
    const normTitle = normalize(item.title);
    let isDuplicate = false;
    let dupMatch = null;
    for (const mt of masterTitles) {
      const sim = titleSimilarity(item.title, mt.normTitle);
      if (sim >= 0.7) {
        isDuplicate = true;
        dupMatch = mt.id;
        break;
      }
      // Also check if same file + very similar title
      if (item.file && item.file === mt.file && sim >= 0.5) {
        isDuplicate = true;
        dupMatch = mt.id;
        break;
      }
    }
    if (isDuplicate) {
      results.DUPLICATE.push({
        ...item,
        triage_reason: `fuzzy title match with ${dupMatch}`,
      });
      continue;
    }

    // 3e. Additional vagueness checks for INTAKE-REPORT
    if (item.id.startsWith("INTAKE-REPORT")) {
      // Reports with no file reference and generic descriptions are usually
      // high-level findings already captured at a more granular level
      const d = item.description || "";
      if (!item.file && d.startsWith("Finding from") && item.title.length < 60) {
        // Check if title is overly generic
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
        const startsGeneric = genericPatterns.some((p) => p.test(item.title));
        // If generic AND no specific file, it's likely a high-level wish
        if (startsGeneric && !item.file && item.title.length < 45) {
          results.VAGUE.push({
            ...item,
            triage_reason: "generic report finding without file specificity",
          });
          continue;
        }
      }
    }

    // Passes all filters → INGEST
    results.INGEST.push(item);
  }

  // 4. Print summary
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

  // 5. Assign DEBT IDs and append to MASTER
  let nextId = maxDebtId + 1;
  const toAppend = [];

  for (const item of results.INGEST) {
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

  // 6. Write detailed triage report
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

  // 7. Print INGEST sample
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

  // 8. Print discard samples
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

main();
