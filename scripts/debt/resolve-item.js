#!/usr/bin/env node
/* global __dirname */
/**
 * Resolve a single technical debt item
 *
 * Usage: node scripts/debt/resolve-item.js <DEBT-XXXX> [options]
 *
 * Options:
 *   --pr <number>        PR number that resolved this item
 *   --false-positive     Mark as false positive instead of resolved
 *   --reason <text>      Reason for false positive (required with --false-positive)
 *   --dry-run            Preview without writing
 *
 * Example:
 *   node scripts/debt/resolve-item.js DEBT-0042 --pr 123
 *   node scripts/debt/resolve-item.js DEBT-0042 --false-positive --reason "Not applicable"
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DEBT_DIR = path.join(__dirname, "../../docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const FALSE_POSITIVES_FILE = path.join(DEBT_DIR, "FALSE_POSITIVES.jsonl");
const LOG_DIR = path.join(DEBT_DIR, "logs");
const RESOLUTION_LOG = path.join(LOG_DIR, "resolution-log.jsonl");

// Parse command line arguments
function parseArgs(args) {
  const parsed = { dryRun: false, falsePositive: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--false-positive") {
      parsed.falsePositive = true;
    } else if (arg === "--pr" && args[i + 1]) {
      parsed.pr = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === "--reason" && args[i + 1]) {
      parsed.reason = args[i + 1];
      i++;
    } else if (arg.match(/^DEBT-\d+$/)) {
      parsed.debtId = arg;
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

// Append to false positives file
function appendFalsePositive(item) {
  fs.appendFileSync(FALSE_POSITIVES_FILE, JSON.stringify(item) + "\n");
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

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Usage: node scripts/debt/resolve-item.js <DEBT-XXXX> [options]

Options:
  --pr <number>        PR number that resolved this item
  --false-positive     Mark as false positive instead of resolved
  --reason <text>      Reason for false positive (required with --false-positive)
  --dry-run            Preview without writing

Example:
  node scripts/debt/resolve-item.js DEBT-0042 --pr 123
  node scripts/debt/resolve-item.js DEBT-0042 --false-positive --reason "Not applicable"
`);
    process.exit(0);
  }

  const parsed = parseArgs(args);

  // Validate arguments
  if (!parsed.debtId) {
    console.error("Error: DEBT-XXXX ID is required");
    process.exit(1);
  }

  if (parsed.falsePositive && !parsed.reason) {
    console.error("Error: --reason is required with --false-positive");
    process.exit(1);
  }

  console.log("🔧 Resolving technical debt item...\n");

  // Load items
  const items = loadMasterDebt();
  const itemIndex = items.findIndex((item) => item.id === parsed.debtId);

  if (itemIndex === -1) {
    console.error(`Error: Item not found: ${parsed.debtId}`);
    process.exit(1);
  }

  const item = items[itemIndex];

  // Check if already resolved
  if (item.status === "RESOLVED") {
    console.log(`⚠️ Item ${parsed.debtId} is already RESOLVED`);
    console.log(`  Resolved on: ${item.resolution?.date || "unknown"}`);
    process.exit(0);
  }

  if (item.status === "FALSE_POSITIVE") {
    console.log(`⚠️ Item ${parsed.debtId} is already marked as FALSE_POSITIVE`);
    process.exit(0);
  }

  // Display item info
  console.log(`  Item: ${item.id}`);
  console.log(`  Title: ${item.title.substring(0, 60)}${item.title.length > 60 ? "..." : ""}`);
  console.log(`  File: ${item.file}:${item.line}`);
  console.log(`  Severity: ${item.severity}`);
  console.log(`  Current Status: ${item.status}`);

  if (parsed.falsePositive) {
    console.log(`\n  Action: Mark as FALSE_POSITIVE`);
    console.log(`  Reason: ${parsed.reason}`);
  } else {
    console.log(`\n  Action: Mark as RESOLVED`);
    if (parsed.pr) {
      console.log(`  PR: #${parsed.pr}`);
    }
  }

  if (parsed.dryRun) {
    console.log("\n🔍 DRY RUN: No changes written.");
    process.exit(0);
  }

  // Update the item
  const now = new Date().toISOString().split("T")[0];

  if (parsed.falsePositive) {
    // Mark as false positive and move to separate file
    item.status = "FALSE_POSITIVE";
    item.resolution = {
      type: "false_positive",
      reason: parsed.reason,
      date: now,
    };

    // Remove from master list in memory
    items.splice(itemIndex, 1);

    // Perform all write operations together with error handling
    try {
      saveMasterDebt(items);
      appendFalsePositive(item);
      logResolution({
        action: "false_positive",
        item_id: item.id,
        reason: parsed.reason,
      });
    } catch (writeError) {
      console.error(`\n❌ Critical Error: Failed to write updates for ${item.id}.`);
      console.error("   The master file may be out of sync. Please restore from version control.");
      console.error(`   Error: ${writeError.message}`);
      process.exit(1);
    }

    console.log(`\n✅ Marked ${item.id} as FALSE_POSITIVE`);
    console.log(`  Moved to FALSE_POSITIVES.jsonl`);
  } else {
    // Mark as resolved
    item.status = "RESOLVED";
    item.resolution = {
      type: "resolved",
      pr: parsed.pr || null,
      date: now,
    };

    saveMasterDebt(items);

    logResolution({
      action: "resolved",
      item_id: item.id,
      pr: parsed.pr || null,
    });

    console.log(`\n✅ Marked ${item.id} as RESOLVED`);
  }

  // Regenerate views
  console.log("\n🔄 Regenerating views...");
  try {
    execSync("node scripts/debt/generate-views.js", { stdio: "inherit" });
  } catch {
    console.warn(
      "  ⚠️ Failed to regenerate views. Run manually: node scripts/debt/generate-views.js"
    );
  }

  console.log(`\n📊 Remaining items in MASTER_DEBT.jsonl: ${items.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
