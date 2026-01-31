#!/usr/bin/env node
/* global __dirname */
/**
 * Bulk resolve multiple technical debt items
 *
 * Usage: node scripts/debt/resolve-bulk.js [options] <DEBT-XXXX> [DEBT-XXXX...]
 *
 * Options:
 *   --pr <number>        PR number that resolved these items
 *   --file <path>        File containing DEBT IDs (one per line)
 *   --dry-run            Preview without writing
 *
 * Example:
 *   node scripts/debt/resolve-bulk.js --pr 123 DEBT-0042 DEBT-0043 DEBT-0044
 *   node scripts/debt/resolve-bulk.js --pr 123 --file resolved-ids.txt
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DEBT_DIR = path.join(__dirname, "../../docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const LOG_DIR = path.join(DEBT_DIR, "logs");
const RESOLUTION_LOG = path.join(LOG_DIR, "resolution-log.jsonl");

// Parse command line arguments
function parseArgs(args) {
  const parsed = { dryRun: false, debtIds: [] };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--pr" && args[i + 1]) {
      parsed.pr = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === "--file" && args[i + 1]) {
      parsed.file = args[i + 1];
      i++;
    } else if (arg.match(/^DEBT-\d+$/)) {
      parsed.debtIds.push(arg);
    }
  }
  return parsed;
}

// Load items from MASTER_DEBT.jsonl
function loadMasterDebt() {
  if (!fs.existsSync(MASTER_FILE)) {
    return [];
  }
  const content = fs.readFileSync(MASTER_FILE, "utf8");
  const lines = content.split("\n").filter((line) => line.trim());
  return lines.map((line) => JSON.parse(line));
}

// Save items to MASTER_DEBT.jsonl with atomic write
function saveMasterDebt(items) {
  const lines = items.map((item) => JSON.stringify(item));
  const content = lines.join("\n") + "\n";

  // Atomic write: write to temp file then rename
  const dir = path.dirname(MASTER_FILE);
  const tmpFile = path.join(dir, `.MASTER_DEBT.jsonl.tmp.${process.pid}`);

  try {
    fs.writeFileSync(tmpFile, content);
    fs.renameSync(tmpFile, MASTER_FILE);
  } catch (err) {
    // Clean up temp file on error
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      // Ignore cleanup errors
    }
    throw err;
  }
}

// Log resolution activity
function logResolution(activity) {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...activity,
  };
  fs.appendFileSync(RESOLUTION_LOG, JSON.stringify(logEntry) + "\n");
}

// Load IDs from file
function loadIdsFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, "utf8");
  const ids = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.match(/^DEBT-\d+$/));
  return ids;
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Usage: node scripts/debt/resolve-bulk.js [options] <DEBT-XXXX> [DEBT-XXXX...]

Options:
  --pr <number>        PR number that resolved these items
  --file <path>        File containing DEBT IDs (one per line)
  --dry-run            Preview without writing

Example:
  node scripts/debt/resolve-bulk.js --pr 123 DEBT-0042 DEBT-0043 DEBT-0044
  node scripts/debt/resolve-bulk.js --pr 123 --file resolved-ids.txt
`);
    process.exit(0);
  }

  const parsed = parseArgs(args);

  // Load IDs from file if specified
  if (parsed.file) {
    const fileIds = loadIdsFromFile(parsed.file);
    parsed.debtIds.push(...fileIds);
  }

  // Remove duplicates
  parsed.debtIds = [...new Set(parsed.debtIds)];

  // Validate arguments
  if (parsed.debtIds.length === 0) {
    console.error("Error: At least one DEBT-XXXX ID is required");
    process.exit(1);
  }

  console.log("🔧 Bulk resolving technical debt items...\n");
  console.log(`  Items to resolve: ${parsed.debtIds.length}`);
  if (parsed.pr) {
    console.log(`  PR: #${parsed.pr}`);
  }
  if (parsed.dryRun) {
    console.log(`  Mode: DRY RUN`);
  }

  // Load items
  const items = loadMasterDebt();
  const itemMap = new Map(items.map((item) => [item.id, item]));

  // Find matching items
  const found = [];
  const notFound = [];
  const alreadyResolved = [];

  for (const debtId of parsed.debtIds) {
    const item = itemMap.get(debtId);
    if (!item) {
      notFound.push(debtId);
    } else if (item.status === "RESOLVED") {
      alreadyResolved.push(debtId);
    } else {
      found.push(item);
    }
  }

  // Report
  console.log(`\n📊 Analysis:`);
  console.log(`  ✅ Items to resolve: ${found.length}`);
  console.log(`  ⏭️  Already resolved: ${alreadyResolved.length}`);
  console.log(`  ❌ Not found: ${notFound.length}`);

  if (notFound.length > 0 && notFound.length <= 10) {
    console.log(`\n  Not found:`);
    for (const id of notFound) {
      console.log(`    - ${id}`);
    }
  }

  if (found.length === 0) {
    console.log("\n✅ No items to resolve.");
    process.exit(0);
  }

  // Preview items to resolve
  console.log(`\n  Items to resolve:`);
  for (const item of found.slice(0, 10)) {
    console.log(`    - ${item.id}: ${item.title.substring(0, 50)}...`);
  }
  if (found.length > 10) {
    console.log(`    ... and ${found.length - 10} more`);
  }

  if (parsed.dryRun) {
    console.log("\n🔍 DRY RUN: No changes written.");
    process.exit(0);
  }

  // Update items
  const now = new Date().toISOString().split("T")[0];
  const resolvedIds = [];

  for (const item of found) {
    item.status = "RESOLVED";
    item.resolution = {
      type: "resolved",
      pr: parsed.pr || null,
      date: now,
    };
    resolvedIds.push(item.id);
  }

  // Save
  saveMasterDebt(items);

  // Log
  logResolution({
    action: "bulk_resolved",
    item_ids: resolvedIds,
    count: resolvedIds.length,
    pr: parsed.pr || null,
  });

  console.log(`\n✅ Resolved ${resolvedIds.length} items`);

  // Regenerate views
  console.log("\n🔄 Regenerating views...");
  try {
    execSync("node scripts/debt/generate-views.js", { stdio: "inherit" });
  } catch {
    console.warn(
      "  ⚠️ Failed to regenerate views. Run manually: node scripts/debt/generate-views.js"
    );
  }

  // Summary
  const remainingOpen = items.filter((item) => item.status !== "RESOLVED").length;
  console.log(`\n📊 Summary:`);
  console.log(`  Resolved: ${resolvedIds.length}`);
  console.log(`  Remaining open: ${remainingOpen}`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
