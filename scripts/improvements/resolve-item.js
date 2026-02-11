#!/usr/bin/env node
/* global __dirname */
/**
 * Resolve a single improvement item
 *
 * Usage: node scripts/improvements/resolve-item.js <ENH-XXXX> [options]
 *
 * Options:
 *   --action <action>    Action to take: accept|decline|defer|implement|stale
 *   --reason <text>      Decision notes (required for decline)
 *   --pr <number>        PR number (optional, for implement action)
 *   --dry-run            Preview without writing
 *
 * Status transitions:
 *   PROPOSED → ACCEPTED   (with decision_notes)
 *   PROPOSED → DECLINED   (with decision_notes, reason required)
 *   PROPOSED → DEFERRED   (with decision_notes)
 *   ACCEPTED → IMPLEMENTED (with PR number optional)
 *   Any → STALE           (re-evaluation needed)
 *
 * Example:
 *   node scripts/improvements/resolve-item.js ENH-0042 --action accept --reason "Good improvement"
 *   node scripts/improvements/resolve-item.js ENH-0042 --action decline --reason "Out of scope"
 *   node scripts/improvements/resolve-item.js ENH-0042 --action implement --pr 123
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const IMPROVEMENTS_DIR = path.join(__dirname, "../../docs/improvements");
const MASTER_FILE = path.join(IMPROVEMENTS_DIR, "MASTER_IMPROVEMENTS.jsonl");
const LOG_DIR = path.join(IMPROVEMENTS_DIR, "logs");
const RESOLUTION_LOG = path.join(LOG_DIR, "resolution-log.jsonl");

const VALID_ACTIONS = ["accept", "decline", "defer", "implement", "stale"];

const ACTION_TO_STATUS = {
  accept: "ACCEPTED",
  decline: "DECLINED",
  defer: "DEFERRED",
  implement: "IMPLEMENTED",
  stale: "STALE",
};

// Valid status transitions: source → set of valid target statuses
const VALID_TRANSITIONS = {
  PROPOSED: new Set(["ACCEPTED", "DECLINED", "DEFERRED", "STALE"]),
  ACCEPTED: new Set(["IMPLEMENTED", "STALE"]),
  DECLINED: new Set(["STALE"]),
  DEFERRED: new Set(["STALE"]),
  IMPLEMENTED: new Set(["STALE"]),
  STALE: new Set(["STALE"]),
};

// Parse command line arguments
function parseArgs(args) {
  const parsed = { dryRun: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--action" && args[i + 1]) {
      parsed.action = args[++i].toLowerCase();
    } else if (arg === "--reason" && args[i + 1]) {
      parsed.reason = args[++i];
    } else if (arg === "--pr" && args[i + 1]) {
      parsed.pr = Number.parseInt(args[++i], 10);
      if (!Number.isFinite(parsed.pr) || parsed.pr <= 0 || !Number.isInteger(parsed.pr)) {
        console.error(`Error: --pr must be a positive integer, got: ${args[i]}`);
        process.exit(1);
      }
    } else if (arg.match(/^ENH-\d+$/)) {
      parsed.enhId = arg;
    }
  }
  return parsed;
}

// Strip dangerous prototype pollution keys from parsed JSONL objects (Review #292 R10)
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
function safeCloneObject(obj, depth = 0) {
  if (obj === null || typeof obj !== "object") return obj;
  if (depth > 200) return Array.isArray(obj) ? [] : Object.create(null);
  if (Array.isArray(obj)) return obj.map((v) => safeCloneObject(v, depth + 1));
  const result = Object.create(null);
  for (const key of Object.keys(obj)) {
    if (!DANGEROUS_KEYS.has(key)) {
      result[key] = safeCloneObject(obj[key], depth + 1);
    }
  }
  return result;
}

// Load items from MASTER_IMPROVEMENTS.jsonl
function loadMasterImprovements() {
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

  const lines = content.split("\n");
  const items = [];
  const badLines = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    let line = lines[i].trimEnd(); // Handle CRLF line endings (Review #291 R9)
    if (lineNum === 1) line = line.replace(/^\uFEFF/, ""); // Strip UTF-8 BOM
    if (!line.trim()) continue;
    try {
      items.push(safeCloneObject(JSON.parse(line)));
    } catch (err) {
      badLines.push({
        line: lineNum,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (badLines.length > 0) {
    console.warn(`Warning: ${badLines.length} invalid JSON line(s) in ${MASTER_FILE}`);
    for (const b of badLines.slice(0, 5)) {
      console.warn(`   Line ${b.line}: ${b.message}`);
    }
    if (badLines.length > 5) {
      console.warn(`   ... and ${badLines.length - 5} more`);
    }
  }

  return items;
}

// Symlink guard: refuse to write through symlinks (Review #291 R9)
function assertNotSymlink(filePath) {
  try {
    if (fs.lstatSync(filePath).isSymbolicLink()) {
      throw new Error(`Refusing to write to symlink: ${filePath}`);
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.code === "ENOENT") return;
      if (err.code === "EACCES" || err.code === "EPERM") {
        throw new Error(`Refusing to write when symlink check is blocked: ${filePath}`);
      }
      if (err.message.includes("Refusing to write")) throw err;
    }
    // Fail closed: rethrow any unexpected errors (Review #292 R10)
    throw err;
  }
}

// Save items to MASTER_IMPROVEMENTS.jsonl with atomic write
function saveMasterImprovements(items) {
  const lines = items.map((item) => JSON.stringify(item));
  const content = lines.join("\n") + "\n";

  // Atomic write: write to temp file then rename
  const dir = path.dirname(MASTER_FILE);
  const tmpFile = path.join(dir, `.MASTER_IMPROVEMENTS.jsonl.tmp.${process.pid}`);

  assertNotSymlink(MASTER_FILE);
  assertNotSymlink(tmpFile);

  try {
    fs.writeFileSync(tmpFile, content, { encoding: "utf8", flag: "wx" });
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

// Log resolution activity (wrapped in try/catch so logging failure doesn't crash main flow - Review #286 R4)
function logResolution(activity) {
  try {
    assertNotSymlink(LOG_DIR);
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    assertNotSymlink(RESOLUTION_LOG);
    const logEntry = {
      ...activity,
      // Timestamp AFTER spread so activity cannot overwrite it (Review #289 R7)
      timestamp: new Date().toISOString(),
    };
    fs.appendFileSync(RESOLUTION_LOG, JSON.stringify(logEntry) + "\n", "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Warning: Failed to write resolution log: ${msg}`);
  }
}

// Validate parsed arguments, exit on errors
function validateArgs(parsed) {
  if (!parsed.enhId) {
    console.error("Error: ENH-XXXX ID is required");
    process.exit(1);
  }
  if (!parsed.action) {
    console.error("Error: --action is required (accept|decline|defer|implement|stale)");
    process.exit(1);
  }
  if (!VALID_ACTIONS.includes(parsed.action)) {
    console.error(
      `Error: --action must be one of: ${VALID_ACTIONS.join("|")}, got: ${parsed.action}`
    );
    process.exit(1);
  }
  if (parsed.action === "decline" && !parsed.reason) {
    console.error("Error: --reason is required with --action decline");
    process.exit(1);
  }
}

// Find and validate item exists and check status
function findItem(items, enhId) {
  const itemIndex = items.findIndex((item) => item.id === enhId);
  if (itemIndex === -1) {
    console.error(`Error: Item not found: ${enhId}`);
    process.exit(1);
  }

  const item = items[itemIndex];
  return { item, itemIndex };
}

// Validate that the status transition is allowed
function validateTransition(item, targetStatus) {
  const currentStatus = item.status || "PROPOSED";
  const allowed = VALID_TRANSITIONS[currentStatus];

  if (!allowed) {
    console.error(`Error: Unknown current status "${currentStatus}" for ${item.id}`);
    process.exit(1);
  }

  if (!allowed.has(targetStatus)) {
    console.error(`Error: Invalid transition ${currentStatus} -> ${targetStatus} for ${item.id}`);
    console.error(
      `  Valid transitions from ${currentStatus}: ${[...allowed].join(", ") || "none"}`
    );
    process.exit(1);
  }
}

// Display item info and planned action
function displayItemInfo(item, parsed) {
  const targetStatus = ACTION_TO_STATUS[parsed.action];
  // Guard against missing/non-string title to prevent crash (Review #287 R5)
  const title = typeof item.title === "string" ? item.title : "Untitled";
  console.log(`  Item: ${item.id}`);
  console.log(`  Title: ${title.substring(0, 60)}${title.length > 60 ? "..." : ""}`);
  if (item.file) {
    console.log(`  File: ${item.file}${item.line ? `:${item.line}` : ""}`);
  }
  if (item.impact) {
    console.log(`  Impact: ${item.impact}`);
  }
  console.log(`  Current Status: ${item.status || "PROPOSED"}`);
  console.log(`\n  Action: ${parsed.action} -> ${targetStatus}`);
  if (parsed.reason) {
    console.log(`  Decision Notes: ${parsed.reason}`);
  }
  if (parsed.pr) {
    console.log(`  PR: #${parsed.pr}`);
  }
}

// Attempt to restore master file from backup (Review #292 R10: atomic + symlink guard)
function restoreMasterBackup(masterBackup) {
  if (masterBackup !== null) {
    const dir = path.dirname(MASTER_FILE);
    const tmpFile = path.join(dir, `.MASTER_IMPROVEMENTS.jsonl.restore.tmp.${process.pid}`);
    try {
      assertNotSymlink(MASTER_FILE);
      assertNotSymlink(tmpFile);
      fs.writeFileSync(tmpFile, masterBackup, { encoding: "utf8", flag: "wx" });
      fs.renameSync(tmpFile, MASTER_FILE);
    } catch {
      try {
        fs.unlinkSync(tmpFile);
      } catch {
        // Ignore cleanup errors
      }
      // Ignore restore errors; user will need to recover from VCS
    }
  }
}

// Handle critical write error with rollback attempt
function handleWriteError(itemId, writeError, masterBackup) {
  restoreMasterBackup(masterBackup);
  const errMsg = writeError instanceof Error ? writeError.message : String(writeError);
  console.error(`\n  Critical Error: Failed to write updates for ${itemId}.`);
  console.error("   The master file may be out of sync. Please restore from version control.");
  console.error(`   Error: ${errMsg}`);
  process.exit(1);
}

// Apply the resolution action to the item
function applyResolution(items, item, parsed, now, masterBackup) {
  const targetStatus = ACTION_TO_STATUS[parsed.action];
  const previousStatus = item.status || "PROPOSED";

  item.status = targetStatus;
  item.decided_date = now;
  if (parsed.reason) {
    item.decision_notes = parsed.reason;
  }
  if (parsed.action === "implement" && parsed.pr) {
    item.resolution_pr = parsed.pr;
  }

  try {
    saveMasterImprovements(items);
    logResolution({
      action: parsed.action,
      item_id: item.id,
      previous_status: previousStatus,
      new_status: targetStatus,
      decision_notes: parsed.reason || null,
      pr: parsed.pr || null,
    });
  } catch (writeError) {
    handleWriteError(item.id, writeError, masterBackup);
  }

  console.log(`\n  ${item.id}: ${previousStatus} -> ${targetStatus}`);
}

// Regenerate views after resolution
function regenerateViews() {
  console.log("\n  Regenerating views...");
  try {
    execFileSync(process.execPath, [path.join(__dirname, "generate-views.js")], {
      stdio: "inherit",
    });
  } catch {
    console.warn(
      `  Warning: Failed to regenerate views. Run manually: node scripts/improvements/generate-views.js`
    );
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Usage: node scripts/improvements/resolve-item.js <ENH-XXXX> [options]

Options:
  --action <action>    Action to take: accept|decline|defer|implement|stale
  --reason <text>      Decision notes (required for decline)
  --pr <number>        PR number (optional, for implement action)
  --dry-run            Preview without writing

Status transitions:
  PROPOSED -> ACCEPTED   (with decision_notes)
  PROPOSED -> DECLINED   (with decision_notes, reason required)
  PROPOSED -> DEFERRED   (with decision_notes)
  ACCEPTED -> IMPLEMENTED (with PR number optional)
  Any -> STALE           (re-evaluation needed)

Example:
  node scripts/improvements/resolve-item.js ENH-0042 --action accept --reason "Good improvement"
  node scripts/improvements/resolve-item.js ENH-0042 --action decline --reason "Out of scope"
  node scripts/improvements/resolve-item.js ENH-0042 --action implement --pr 123
`);
    process.exit(0);
  }

  const parsed = parseArgs(args);
  validateArgs(parsed);

  console.log("Resolving improvement item...\n");

  const items = loadMasterImprovements();
  const { item } = findItem(items, parsed.enhId);

  const targetStatus = ACTION_TO_STATUS[parsed.action];
  validateTransition(item, targetStatus);

  displayItemInfo(item, parsed);

  if (parsed.dryRun) {
    console.log("\n  DRY RUN: No changes written.");
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

  applyResolution(items, item, parsed, now, masterBackup);

  regenerateViews();
  console.log(`\n  Total items in MASTER_IMPROVEMENTS.jsonl: ${items.length}`);
}

main().catch((err) => {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error("Fatal error:", errMsg);
  process.exit(1);
});
