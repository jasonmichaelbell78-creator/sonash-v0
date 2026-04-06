#!/usr/bin/env node
/* global __dirname */
/**
 * Backfill missing content_hash values in MASTER_DEBT.jsonl
 *
 * Usage: node scripts/debt/backfill-hashes.js [--dry-run]
 *
 * Process:
 * 1. Reads MASTER_DEBT.jsonl
 * 2. Identifies items with missing or undefined content_hash
 * 3. Generates content hash using the same algorithm as intake-audit.js
 * 4. Writes updated items back to MASTER_DEBT.jsonl
 * 5. Reports how many items were missing hashes and how many were backfilled
 */

const fs = require("node:fs");
const path = require("node:path");
const generateContentHash = require("../lib/generate-content-hash");
const { writeMasterDebtSync } = require("../lib/safe-fs");

const MASTER_FILE = path.join(__dirname, "../../docs/technical-debt/MASTER_DEBT.jsonl");

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  if (args.some((a) => a === "--help" || a === "-h")) {
    console.log("Usage: node scripts/debt/backfill-hashes.js [--dry-run]");
    console.log("");
    console.log("Backfills missing content_hash values in MASTER_DEBT.jsonl.");
    console.log("");
    console.log("Options:");
    console.log("  --dry-run  Report missing hashes without writing changes");
    process.exit(0);
  }

  // Read MASTER_DEBT.jsonl
  if (!fs.existsSync(MASTER_FILE)) {
    console.error("Error: MASTER_DEBT.jsonl not found at " + MASTER_FILE);
    process.exit(1);
  }

  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8");
  } catch (err) {
    console.error(
      "Error: Failed to read MASTER_DEBT.jsonl: " +
        (err instanceof Error ? err.message : String(err))
    );
    process.exit(1);
  }

  const lines = content.split("\n");
  const items = [];
  const parseErrors = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      // Preserve empty lines as-is (e.g., trailing newline)
      items.push({ raw: lines[i], parsed: null, lineNum: i + 1 });
      continue;
    }
    try {
      const parsed = JSON.parse(line);
      items.push({ raw: lines[i], parsed, lineNum: i + 1 });
    } catch (err) {
      parseErrors.push({ line: i + 1, message: err instanceof Error ? err.message : String(err) });
      items.push({ raw: lines[i], parsed: null, lineNum: i + 1 });
    }
  }

  if (parseErrors.length > 0) {
    console.warn(
      "Warning: " +
        parseErrors.length +
        " line(s) with JSON parse errors (will be preserved as-is):"
    );
    for (const e of parseErrors.slice(0, 5)) {
      console.warn("  Line " + e.line + ": " + e.message);
    }
    if (parseErrors.length > 5) {
      console.warn("  ... and " + (parseErrors.length - 5) + " more");
    }
    console.log("");
  }

  // Find items with missing content_hash
  let missingCount = 0;
  let backfilledCount = 0;

  for (const entry of items) {
    if (!entry.parsed) continue;

    const item = entry.parsed;
    if (!item.content_hash || item.content_hash === "undefined") {
      missingCount++;
      const hash = generateContentHash(item);
      item.content_hash = hash;
      entry.updated = true;
      backfilledCount++;
    }
  }

  // Report
  const totalParsed = items.filter((e) => e.parsed !== null).length;
  console.log("Backfill content_hash report:");
  console.log("  Total items in MASTER_DEBT.jsonl: " + totalParsed);
  console.log("  Items missing content_hash: " + missingCount);
  console.log("  Items backfilled: " + backfilledCount);

  if (backfilledCount === 0) {
    console.log("\nNo items need backfilling. MASTER_DEBT.jsonl is unchanged.");
    process.exit(0);
  }

  if (dryRun) {
    console.log("\nDRY RUN: No changes written. " + backfilledCount + " item(s) would be updated.");
    // Show a few examples
    const updated = items.filter((e) => e.updated);
    for (const entry of updated.slice(0, 5)) {
      const item = entry.parsed;
      console.log(
        "  - " +
          (item.id || "no-id") +
          ": " +
          (item.title || "").substring(0, 60) +
          " -> " +
          item.content_hash.substring(0, 16) +
          "..."
      );
    }
    if (updated.length > 5) {
      console.log("  ... and " + (updated.length - 5) + " more");
    }
    process.exit(0);
  }

  // Write updated file — extract all parsed items for central writer
  const parsedItems = items.filter((entry) => entry.parsed !== null).map((entry) => entry.parsed);

  // Abort if any non-empty lines failed to parse (prevents silent data loss)
  if (parseErrors.length > 0) {
    const failedSample = parseErrors
      .slice(0, 5)
      .map((e) => `  Line ${e.line}: ${e.message}`)
      .join("\n");
    console.error(
      `Error: Refusing to write MASTER_DEBT.jsonl: ${parseErrors.length} line(s) failed to parse.\n${failedSample}`
    );
    process.exit(1);
  }

  try {
    writeMasterDebtSync(parsedItems);
  } catch (err) {
    console.error(
      "Error: Failed to write MASTER_DEBT.jsonl: " +
        (err instanceof Error ? err.message : String(err))
    );
    process.exit(1);
  }

  console.log("\nBackfilled " + backfilledCount + " item(s) in MASTER_DEBT.jsonl.");
}

main();
