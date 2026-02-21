#!/usr/bin/env node
/* global __dirname */
/**
 * Smart sync from MASTER_DEBT.jsonl to deduped.jsonl
 *
 * generate-views.js reads from deduped.jsonl and OVERWRITES MASTER_DEBT.jsonl.
 * If severity or status changes are made to MASTER (e.g., S0 demotions), they
 * get reverted unless deduped is also updated. This script propagates severity
 * and status changes from MASTER back into deduped without adding or removing items.
 *
 * Usage: node scripts/debt/sync-deduped.js [--dry-run|--apply] [--json]
 *
 * Options:
 *   --dry-run   Preview changes without writing (default)
 *   --apply     Write changes to deduped.jsonl
 *   --json      Output machine-readable JSON instead of human-readable text
 *
 * Exit codes:
 *   0 = synced (or no changes needed)
 *   1 = changes pending (dry-run with diffs found)
 *   2 = error
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "../..");
const MASTER_PATH = path.join(ROOT, "docs/technical-debt/MASTER_DEBT.jsonl");
const DEDUPED_PATH = path.join(ROOT, "docs/technical-debt/raw/deduped.jsonl");

const args = new Set(process.argv.slice(2));
const applyMode = args.has("--apply");
const jsonOutput = args.has("--json");

/**
 * Read a JSONL file and return an array of parsed objects.
 * Skips blank lines. Wraps in try/catch per CLAUDE.md file-read rules.
 * @param {string} filePath
 * @returns {object[]}
 */
function readJsonl(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    const msg = `Failed to read ${path.basename(filePath)}`;
    if (jsonOutput) {
      process.stdout.write(JSON.stringify({ error: msg }) + "\n");
    } else {
      process.stderr.write(`Error: ${msg}\n`);
    }
    process.exit(2);
  }
  const lines = raw.split("\n");
  const items = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      items.push(JSON.parse(trimmed));
    } catch {
      console.debug(`Skipping malformed JSONL line in ${path.basename(filePath)}`);
    }
  }
  return items;
}

/**
 * Write an array of objects back to a JSONL file (one JSON per line, LF endings).
 * @param {string} filePath
 * @param {object[]} items
 */
function writeJsonl(filePath, items) {
  const content = items.map((item) => JSON.stringify(item)).join("\n") + "\n";
  try {
    fs.writeFileSync(filePath, content, "utf8");
  } catch (err) {
    const msg = `Failed to write ${path.basename(filePath)}`;
    if (jsonOutput) {
      process.stdout.write(JSON.stringify({ error: msg }) + "\n");
    } else {
      process.stderr.write(`Error: ${msg}\n`);
    }
    process.exit(2);
  }
}

function main() {
  // 1. Read both files
  const masterItems = readJsonl(MASTER_PATH);
  const dedupedItems = readJsonl(DEDUPED_PATH);

  // 2. Build map: content_hash → MASTER item
  const masterMap = new Map();
  for (const item of masterItems) {
    if (item.content_hash) {
      masterMap.set(item.content_hash, item);
    }
  }

  // 3. Walk deduped items, detect and apply changes
  let severityChanges = 0;
  let statusChanges = 0;
  let sharedCount = 0;

  for (const dedupedItem of dedupedItems) {
    const masterItem = masterMap.get(dedupedItem.content_hash);
    if (!masterItem) continue;
    sharedCount++;

    if (masterItem.severity !== undefined && dedupedItem.severity !== masterItem.severity) {
      dedupedItem.severity = masterItem.severity;
      severityChanges++;
    }

    if (masterItem.status !== undefined && dedupedItem.status !== masterItem.status) {
      dedupedItem.status = masterItem.status;
      statusChanges++;
    }
  }

  const totalChanges = severityChanges + statusChanges;

  // 4. Output results
  if (jsonOutput) {
    const result = {
      masterCount: masterItems.length,
      dedupedCount: dedupedItems.length,
      sharedCount,
      severityChanges,
      statusChanges,
      totalChanges,
      applied: applyMode && totalChanges > 0,
    };
    process.stdout.write(JSON.stringify(result) + "\n");
  } else {
    process.stdout.write("TDMS Deduped Sync\n");
    process.stdout.write(
      `  MASTER: ${masterItems.length} items | deduped: ${dedupedItems.length} items\n`
    );
    process.stdout.write(`  Shared (by content_hash): ${sharedCount} items\n\n`);
    process.stdout.write("  Changes needed:\n");
    process.stdout.write(`    Severity: ${severityChanges} items differ\n`);
    process.stdout.write(`    Status: ${statusChanges} items differ\n\n`);
  }

  // 5. Write or report
  if (totalChanges > 0 && applyMode) {
    writeJsonl(DEDUPED_PATH, dedupedItems);
    if (!jsonOutput) {
      process.stdout.write(`  [--apply] Wrote ${totalChanges} changes to deduped.jsonl\n`);
    }
    process.exit(0);
  } else if (totalChanges > 0) {
    if (!jsonOutput) {
      process.stdout.write("  [--dry-run] Run with --apply to write changes.\n");
    }
    process.exit(1);
  } else {
    if (!jsonOutput) {
      process.stdout.write("  No changes needed.\n");
    }
    process.exit(0);
  }
}

main();
