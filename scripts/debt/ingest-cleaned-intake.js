#!/usr/bin/env node
/* global __dirname */
/**
 * Ingest Cleaned Intake Items into TDMS
 *
 * Reads pre-cleaned JSONL items (with content_hash already computed),
 * deduplicates against MASTER_DEBT.jsonl by content_hash,
 * assigns DEBT-XXXX IDs continuing from max existing,
 * and appends to BOTH MASTER_DEBT.jsonl AND raw/deduped.jsonl.
 *
 * Usage:
 *   node scripts/debt/ingest-cleaned-intake.js --dry-run   (default, preview only)
 *   node scripts/debt/ingest-cleaned-intake.js --write      (actually write)
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { safeAppendFileSync, appendMasterDebtSync } = require("../lib/safe-fs");

const DEBT_DIR = path.join(__dirname, "../../docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const DEDUPED_FILE = path.join(DEBT_DIR, "raw/deduped.jsonl");
const INPUT_FILE = path.join(DEBT_DIR, "raw/scattered-intake-cleaned.jsonl");
const LOG_DIR = path.join(DEBT_DIR, "logs");
const LOG_FILE = path.join(LOG_DIR, "intake-log.jsonl");

/**
 * Load MASTER_DEBT.jsonl — returns { items, hashSet, maxId }
 */
/**
 * Parse a single JSONL line and accumulate hash/id info.
 * Returns true if parsed successfully, false otherwise.
 */
function parseMasterLine(line, hashSet, idState, lineNum) {
  try {
    const item = JSON.parse(line);
    if (item.content_hash) hashSet.add(item.content_hash);
    if (item.id) {
      const match = item.id.match(/DEBT-(\d+)/);
      if (match) {
        const num = Number.parseInt(match[1], 10);
        if (num > idState.maxId) idState.maxId = num;
      }
    }
  } catch {
    console.warn(`Skipping corrupt JSONL line ${lineNum ?? "?"}`);
  }
}

function loadMaster() {
  const hashSet = new Set();
  const idState = { maxId: 0 };
  let itemCount = 0;
  let badLines = 0;

  if (!fs.existsSync(MASTER_FILE)) {
    return { hashSet, maxId: idState.maxId, itemCount, badLines };
  }

  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error reading MASTER_DEBT.jsonl: ${msg}`);
    process.exit(1);
  }

  const lines = content.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    try {
      parseMasterLine(line, hashSet, idState);
      itemCount++;
    } catch {
      badLines++;
    }
  }

  return { hashSet, maxId: idState.maxId, itemCount, badLines };
}

/**
 * Load input JSONL file
 */
function loadInput() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  let content;
  try {
    content = fs.readFileSync(INPUT_FILE, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error reading input file: ${msg}`);
    process.exit(1);
  }

  const lines = content.split("\n").filter((l) => l.trim());
  const items = [];
  const parseErrors = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      items.push(JSON.parse(lines[i]));
    } catch (err) {
      parseErrors.push({
        line: i + 1,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { items, parseErrors };
}

/**
 * Log intake activity
 */
function logIntake(activity) {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...activity,
  };
  safeAppendFileSync(LOG_FILE, JSON.stringify(logEntry) + "\n");
}

// --- Deduplicate input items against MASTER ---

function deduplicateItems(inputItems, master, today) {
  const newItems = [];
  const dupes = [];
  let nextId = master.maxId + 1;

  for (const item of inputItems) {
    if (!item.content_hash || typeof item.content_hash !== "string") {
      dupes.push({ ...item, _skip_reason: "missing_content_hash" });
      continue;
    }
    if (master.hashSet.has(item.content_hash)) {
      dupes.push(item);
      continue;
    }
    const debtId = `DEBT-${String(nextId).padStart(4, "0")}`;
    nextId++;
    const finalItem = { ...item, id: debtId, status: "NEW", created: today };
    delete finalItem.cleaning_disposition;
    newItems.push(finalItem);
    master.hashSet.add(finalItem.content_hash);
  }
  return { newItems, dupes };
}

// --- Write items to MASTER and deduped ---

function writeItems(newItems) {
  try {
    appendMasterDebtSync(newItems);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`    ERROR: Failed to append to MASTER_DEBT.jsonl + deduped.jsonl: ${msg}`);
    process.exit(1);
  }
  console.log(`    Appended ${newItems.length} items to MASTER_DEBT.jsonl`);
  console.log(`    Appended ${newItems.length} items to raw/deduped.jsonl`);

  const masterLines = fs
    .readFileSync(MASTER_FILE, "utf8")
    .split("\n")
    .filter((l) => l.trim()).length;
  const dedupedLines = fs
    .readFileSync(DEDUPED_FILE, "utf8")
    .split("\n")
    .filter((l) => l.trim()).length;
  console.log(`\n  Final counts:`);
  console.log(`    MASTER_DEBT.jsonl: ${masterLines} items`);
  console.log(`    raw/deduped.jsonl: ${dedupedLines} items`);
  return { masterLines, dedupedLines };
}

// --- Log intake activity ---

function logIntakeActivity(input, newItems, dupes, counts) {
  let operatorContext;
  try {
    operatorContext =
      os.userInfo().username || process.env.USER || process.env.USERNAME || "unknown";
  } catch {
    operatorContext = process.env.USER || process.env.USERNAME || "unknown";
  }
  logIntake({
    action: "ingest-cleaned-intake",
    operator: operatorContext,
    input_file: INPUT_FILE,
    items_processed: input.items.length,
    items_added: newItems.length,
    duplicates_skipped: dupes.length,
    first_id: newItems[0]?.id,
    last_id: newItems[newItems.length - 1]?.id,
    master_total: counts.masterLines,
    deduped_total: counts.dedupedLines,
  });
}

function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes("--write");
  const dryRun = !writeMode;
  const today = new Date().toISOString().split("T")[0];

  console.log("=== Ingest Cleaned Intake Items ===\n");
  console.log(`  Input: ${INPUT_FILE}`);
  console.log(`  Mode:  ${dryRun ? "DRY RUN (use --write to commit)" : "WRITE"}\n`);

  const master = loadMaster();
  console.log(
    `  MASTER_DEBT.jsonl: ${master.itemCount} items, max ID: DEBT-${String(master.maxId).padStart(4, "0")}`
  );
  if (master.badLines > 0) console.log(`  Warning: ${master.badLines} bad JSON lines in MASTER`);
  console.log(`  Known content hashes: ${master.hashSet.size}\n`);

  const input = loadInput();
  console.log(`  Input items: ${input.items.length}`);

  const { newItems, dupes } = deduplicateItems(input.items, master, today);

  console.log(`\n  Results:`);
  console.log(`    New items to ingest: ${newItems.length}`);
  console.log(`    Duplicates skipped:  ${dupes.length}`);
  if (newItems.length > 0)
    console.log(`    ID range: ${newItems[0].id} - ${newItems[newItems.length - 1].id}`);

  if (newItems.length === 0) {
    console.log("\n  No new items to add. Done.");
    return;
  }

  console.log(`\n  Sample (first 5):`);
  for (const item of newItems.slice(0, 5))
    console.log(`    ${item.id}: [${item.severity}] ${item.title.substring(0, 70)}`);
  if (newItems.length > 5) console.log(`    ... and ${newItems.length - 5} more`);

  if (dryRun) {
    console.log("\n  DRY RUN complete. Use --write to actually ingest.");
    return;
  }

  console.log("\n  Writing...");
  const counts = writeItems(newItems);
  logIntakeActivity(input, newItems, dupes, counts);
  console.log("\n  Done. Intake logged to " + LOG_FILE);
}

main();
