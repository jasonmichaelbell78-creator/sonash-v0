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

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { safeWriteFileSync, safeAppendFileSync, writeMasterDebtSync } = require("../lib/safe-fs");

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
      parsed.pr = Number.parseInt(args[++i], 10);
      if (!Number.isFinite(parsed.pr) || parsed.pr <= 0 || !Number.isInteger(parsed.pr)) {
        console.error(`Error: --pr must be a positive integer, got: ${args[i]}`);
        process.exit(1);
      }
    } else if (arg === "--reason" && args[i + 1]) {
      parsed.reason = args[++i];
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
  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to read ${MASTER_FILE}: ${errMsg}`);
    process.exit(1);
  }
  const lines = content.split("\n").filter((line) => line.trim());
  const items = [];
  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch {
      /* skip malformed */
    }
  }
  return items;
}

// Save items to MASTER_DEBT.jsonl with atomic write
function saveMasterDebt(items) {
  writeMasterDebtSync(items);
}

// Append to false positives file
function appendFalsePositive(item) {
  safeAppendFileSync(FALSE_POSITIVES_FILE, JSON.stringify(item) + "\n");
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
  safeAppendFileSync(RESOLUTION_LOG, JSON.stringify(logEntry) + "\n");
}

// Validate parsed arguments, exit on errors
function validateArgs(parsed) {
  if (!parsed.debtId) {
    console.error("Error: DEBT-XXXX ID is required");
    process.exit(1);
  }
  if (parsed.falsePositive && !parsed.reason) {
    console.error("Error: --reason is required with --false-positive");
    process.exit(1);
  }
}

// Find and validate item exists and is not already resolved
function findItem(items, debtId) {
  const itemIndex = items.findIndex((item) => item.id === debtId);
  if (itemIndex === -1) {
    console.error(`Error: Item not found: ${debtId}`);
    process.exit(1);
  }

  const item = items[itemIndex];

  if (item.status === "RESOLVED") {
    console.log(`⚠️ Item ${debtId} is already RESOLVED`);
    console.log(`  Resolved on: ${item.resolution?.date || "unknown"}`);
    process.exit(0);
  }
  if (item.status === "FALSE_POSITIVE") {
    console.log(`⚠️ Item ${debtId} is already marked as FALSE_POSITIVE`);
    process.exit(0);
  }

  return { item, itemIndex };
}

// Display item info and planned action
function displayItemInfo(item, parsed) {
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
}

// Attempt to restore master file from backup
function restoreMasterBackup(masterBackup) {
  if (masterBackup !== null) {
    try {
      safeWriteFileSync(MASTER_FILE, masterBackup);
    } catch {
      // Ignore restore errors; user will need to recover from VCS
    }
  }
}

// Handle critical write error with rollback attempt
function handleWriteError(itemId, writeError, masterBackup, masterUpdated = true) {
  if (masterUpdated) {
    restoreMasterBackup(masterBackup);
  }
  const errMsg = writeError instanceof Error ? writeError.message : String(writeError);
  console.error(`\n❌ Critical Error: Failed to write updates for ${itemId}.`);
  console.error("   The master file may be out of sync. Please restore from version control.");
  console.error(`   Error: ${errMsg}`);
  process.exit(1);
}

// Apply false positive resolution
function applyFalsePositive(items, item, itemIndex, parsed, now, masterBackup) {
  item.status = "FALSE_POSITIVE";
  item.resolution = {
    type: "false_positive",
    reason: parsed.reason,
    date: now,
  };

  items.splice(itemIndex, 1);

  let masterUpdated = false;
  try {
    saveMasterDebt(items);
    masterUpdated = true;
    appendFalsePositive(item);
    logResolution({
      action: "false_positive",
      item_id: item.id,
      reason: parsed.reason,
    });
  } catch (writeError) {
    handleWriteError(item.id, writeError, masterBackup, masterUpdated);
  }

  // Sync deduped.jsonl to prevent generate-views.js overwrite regression (Session #179)
  try {
    const { execFileSync } = require("node:child_process");
    execFileSync("node", [path.join(__dirname, "sync-deduped.js"), "--apply"], { stdio: "pipe" });
  } catch {
    // sync-deduped.js may not exist yet or may fail — non-critical
  }

  console.log(`\n✅ Marked ${item.id} as FALSE_POSITIVE`);
  console.log(`  Moved to FALSE_POSITIVES.jsonl`);
}

// Apply resolved status
function applyResolved(items, item, parsed, now, masterBackup) {
  item.status = "RESOLVED";
  item.resolution = {
    type: "resolved",
    pr: parsed.pr || null,
    date: now,
  };

  try {
    saveMasterDebt(items);
    logResolution({
      action: "resolved",
      item_id: item.id,
      pr: parsed.pr || null,
    });
  } catch (writeError) {
    handleWriteError(item.id, writeError, masterBackup);
  }

  // Sync deduped.jsonl to prevent generate-views.js overwrite regression (Session #179)
  try {
    const { execFileSync } = require("node:child_process");
    execFileSync("node", [path.join(__dirname, "sync-deduped.js"), "--apply"], { stdio: "pipe" });
  } catch {
    // sync-deduped.js may not exist yet or may fail — non-critical
  }

  console.log(`\n✅ Marked ${item.id} as RESOLVED`);
}

// Regenerate views after resolution
function regenerateViews() {
  console.log("\n🔄 Regenerating views...");
  try {
    execFileSync(process.execPath, ["scripts/debt/generate-views.js"], { stdio: "inherit" });
  } catch {
    console.warn(
      `  ⚠️ Failed to regenerate views. Run manually: node scripts/debt/generate-views.js`
    );
  }
}

/**
 * Scan a list of plan files for lines containing debtId.
 * Returns an array of { file, line } objects (file is repo-relative).
 * @param {string[]} planFiles - Absolute paths to files to scan
 * @param {string} debtId - The DEBT-XXXX identifier to search for
 * @param {string} ROOT - Repo root for computing relative paths
 * @returns {Array<{file: string, line: number}>}
 */
function scanFilesForDebtRef(planFiles, debtId, ROOT) {
  const refsFound = [];
  for (const filePath of planFiles) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(debtId)) {
          refsFound.push({ file: path.relative(ROOT, filePath), line: i + 1 });
        }
      }
    } catch {
      // skip unreadable files
    }
  }
  return refsFound;
}

// Sync plan files after resolution (Finding 13)
function syncPlanFiles(debtId) {
  const ROOT = path.join(__dirname, "../..");

  // 1. Run reconcile-roadmap to update ROADMAP.md
  console.log("\n🔄 Syncing plan files...");
  try {
    execFileSync(process.execPath, [path.join(__dirname, "reconcile-roadmap.js"), "--write"], {
      stdio: "pipe",
    });
    console.log("  ✅ ROADMAP.md reconciled");
  } catch {
    console.warn("  ⚠️ reconcile-roadmap.js failed — run manually if needed");
  }

  // 2. Regenerate GRAND_PLAN_V2.md + manifest
  try {
    execFileSync(process.execPath, [path.join(__dirname, "generate-grand-plan.js")], {
      stdio: "pipe",
    });
    console.log("  ✅ GRAND_PLAN_V2.md + manifest regenerated");
  } catch {
    console.warn("  ⚠️ generate-grand-plan.js failed — run manually if needed");
  }

  // 3. Scan active plan files for references to the resolved DEBT ID
  const planFiles = [
    path.join(ROOT, "ROADMAP_FUTURE.md"),
    path.join(ROOT, "ROADMAP_LOG.md"),
    path.join(ROOT, "docs", "OPERATIONAL_VISIBILITY_SPRINT.md"),
  ];

  // Also scan .claude/plans/*.md
  const plansDir = path.join(ROOT, ".claude", "plans");
  try {
    const planDirFiles = fs
      .readdirSync(plansDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => path.join(plansDir, f));
    planFiles.push(...planDirFiles);
  } catch {
    // plans dir may not exist
  }

  const refsFound = scanFilesForDebtRef(planFiles, debtId, ROOT);

  if (refsFound.length > 0) {
    console.log(`\n  ℹ️ ${debtId} also referenced in:`);
    for (const ref of refsFound) {
      console.log(`     ${ref.file} (line ${ref.line})`);
    }
  }
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
  validateArgs(parsed);

  console.log("🔧 Resolving technical debt item...\n");

  const items = loadMasterDebt();
  const { item, itemIndex } = findItem(items, parsed.debtId);

  displayItemInfo(item, parsed);

  if (parsed.dryRun) {
    console.log("\n🔍 DRY RUN: No changes written.");
    process.exit(0);
  }

  const now = new Date().toISOString().split("T")[0];
  let masterBackup = null;
  if (fs.existsSync(MASTER_FILE)) {
    try {
      masterBackup = fs.readFileSync(MASTER_FILE, "utf8");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to read ${MASTER_FILE} for backup: ${errMsg}`);
      process.exit(1);
    }
  }

  if (parsed.falsePositive) {
    applyFalsePositive(items, item, itemIndex, parsed, now, masterBackup);
  } else {
    applyResolved(items, item, parsed, now, masterBackup);
  }

  regenerateViews();
  syncPlanFiles(parsed.debtId);
  console.log(`\n📊 Remaining items in MASTER_DEBT.jsonl: ${items.length}`);
}

main().catch((err) => {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error("Fatal error:", errMsg);
  process.exit(1);
});
