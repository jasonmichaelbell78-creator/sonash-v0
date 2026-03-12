#!/usr/bin/env node

/**
 * backfill-tenet-evidence.js
 *
 * Reads decisions.jsonl and tenets.jsonl, then backfills each tenet's
 * evidence array with references to decisions that cite it via tenet_alignment.
 *
 * Usage:
 *   node scripts/planning/backfill-tenet-evidence.js [--dry-run]
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { safeWriteFileSync } from "../lib/safe-fs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dryRun = process.argv.includes("--dry-run");

const BASE_DIR = resolve(__dirname, "../../.planning/system-wide-standardization");
const DECISIONS_PATH = resolve(BASE_DIR, "decisions.jsonl");
const TENETS_PATH = resolve(BASE_DIR, "tenets.jsonl");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJsonl(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const results = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("//")) continue;
    try {
      results.push(JSON.parse(trimmed));
    } catch (err) {
      console.warn(
        `Warning: skipping corrupt JSONL line in ${filePath}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  return results;
}

function serializeJsonl(records) {
  return records.map((r) => JSON.stringify(r)).join("\n") + "\n";
}

/**
 * Extract a tenet ID like "T2" from strings such as:
 *   "T2"
 *   "T2 (source of truth + generated views)"
 */
function extractTenetId(raw) {
  const match = raw.match(/^(T\d+)/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const decisions = parseJsonl(DECISIONS_PATH);
const tenets = parseJsonl(TENETS_PATH);

// Build a map: tenetId -> Set of decision reference strings (e.g. "D55")
const tenetToDecisions = new Map();

/**
 * Extract all tenet IDs (T1, T2, ...) from any string.
 * Handles patterns like: "T10", "T2 (source of truth)", "T4 (JSONL-first) and T2"
 */
function extractAllTenetIds(text) {
  if (!text || typeof text !== "string") return [];
  const matches = text.match(/\bT(\d+)\b/g);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Recursively extract all string values from an object.
 */
function extractStrings(obj) {
  const strings = [];
  if (typeof obj === "string") {
    strings.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) strings.push(...extractStrings(item));
  } else if (obj && typeof obj === "object") {
    for (const val of Object.values(obj)) strings.push(...extractStrings(val));
  }
  return strings;
}

for (const decision of decisions) {
  if (decision.status === "superseded") continue;

  const decisionRef = `D${decision.id}`;

  // Collect tenet refs from ALL text fields in the decision
  const allText = extractStrings(decision).join(" ");
  const tenetIds = extractAllTenetIds(allText);

  for (const tenetId of tenetIds) {
    if (!tenetToDecisions.has(tenetId)) {
      tenetToDecisions.set(tenetId, new Set());
    }
    tenetToDecisions.get(tenetId).add(decisionRef);
  }
}

// Merge into tenets
const report = [];

for (const tenet of tenets) {
  const tenetId = tenet.id; // e.g. "T2"
  const newRefs = tenetToDecisions.get(tenetId);
  if (!newRefs || newRefs.size === 0) continue;

  const existing = new Set(Array.isArray(tenet.evidence) ? tenet.evidence : []);
  const added = [];

  for (const ref of newRefs) {
    if (!existing.has(ref)) {
      added.push(ref);
      existing.add(ref);
    }
  }

  if (added.length > 0) {
    tenet.evidence = [...existing];
    report.push({ tenetId, added });
  }
}

// Output report
if (report.length === 0) {
  console.log("No new evidence to add. All tenets are up to date.");
} else {
  console.log(dryRun ? "=== DRY RUN ===" : "=== Updating tenets.jsonl ===");
  for (const { tenetId, added } of report) {
    console.log(`  ${tenetId}: +${added.length} (${added.join(", ")})`);
  }

  if (dryRun) {
    console.log("\nNo files were modified (dry-run mode).");
  } else {
    safeWriteFileSync(TENETS_PATH, serializeJsonl(tenets));
    console.log(`\nWrote updated tenets to ${TENETS_PATH}`);
  }
}
