#!/usr/bin/env node
/* global __dirname */
/**
 * Intake script for PR-deferred technical debt items
 *
 * Usage: node scripts/debt/intake-pr-deferred.js [options]
 *
 * Options:
 *   --pr <number>       PR number (required)
 *   --file <path>       File path (required)
 *   --line <number>     Line number (default: 0)
 *   --title <text>      Issue title (required)
 *   --severity <S0-S3>  Severity level (required)
 *   --category <cat>    Category (default: code-quality)
 *   --description <txt> Detailed description
 *   --roadmap <track>   Suggested ROADMAP track
 *   --dry-run           Preview without writing
 *
 * Example:
 *   node scripts/debt/intake-pr-deferred.js \
 *     --pr 123 \
 *     --file "src/api/users.ts" \
 *     --line 45 \
 *     --title "Add input validation for email" \
 *     --severity S1 \
 *     --category security
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execSync } = require("node:child_process");
const generateContentHash = require("../lib/generate-content-hash");
const normalizeFilePath = require("../lib/normalize-file-path");

const { loadConfig } = require("../config/load-config");
const { safeAppendFileSync } = require("../lib/safe-fs");

const DEBT_DIR = path.join(__dirname, "../../docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const LOG_DIR = path.join(DEBT_DIR, "logs");
const LOG_FILE = path.join(LOG_DIR, "intake-log.jsonl");

// Valid schema values — single source of truth: scripts/config/audit-schema.json
let schema;
try {
  schema = loadConfig("audit-schema");
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Error: failed to load audit-schema config: ${msg}`);
  process.exit(2);
}
const VALID_CATEGORIES = schema.validCategories;
const VALID_SEVERITIES = schema.validSeverities;

// Parse command line arguments
function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg.startsWith("--")) {
      const key = arg.substring(2);
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        parsed[key] = args[++i];
      }
    }
  }
  return parsed;
}

// Get next DEBT ID
function getNextDebtId(existingItems) {
  let maxId = 0;
  for (const item of existingItems) {
    if (item.id) {
      const match = item.id.match(/DEBT-(\d+)/);
      if (match) {
        const num = Number.parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }
  }
  return maxId + 1;
}

// Load existing items from MASTER_DEBT.jsonl with safe parsing
function loadMasterDebt() {
  if (!fs.existsSync(MASTER_FILE)) {
    return [];
  }

  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8");
  } catch (error_) {
    const msg = error_ instanceof Error ? error_.message : String(error_);
    console.error(`Error: Failed to read MASTER_DEBT.jsonl: ${msg}`);
    process.exit(1);
  }

  const lines = content.split("\n").filter((line) => line.trim());

  const items = [];
  const badLines = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      items.push(JSON.parse(lines[i]));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      badLines.push({ line: i + 1, message: msg });
    }
  }

  if (badLines.length > 0) {
    console.error(`⚠️ Warning: ${badLines.length} invalid JSON line(s) in MASTER_DEBT.jsonl`);
    for (const b of badLines.slice(0, 5)) {
      console.error(`   Line ${b.line}: ${b.message}`);
    }
    if (badLines.length > 5) {
      console.error(`   ... and ${badLines.length - 5} more`);
    }
  }

  return items;
}

// Log intake activity
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

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Usage: node scripts/debt/intake-pr-deferred.js [options]

Options:
  --pr <number>       PR number (required)
  --file <path>       File path (required)
  --line <number>     Line number (default: 0)
  --title <text>      Issue title (required)
  --severity <S0-S3>  Severity level (required)
  --category <cat>    Category (default: code-quality)
  --description <txt> Detailed description
  --roadmap <track>   Suggested ROADMAP track
  --dry-run           Preview without writing

Example:
  node scripts/debt/intake-pr-deferred.js \\
    --pr 123 \\
    --file "src/api/users.ts" \\
    --line 45 \\
    --title "Add input validation for email" \\
    --severity S1 \\
    --category security
`);
    process.exit(0);
  }

  const parsed = parseArgs(args);

  // Validate required fields
  const errors = [];
  if (!parsed.pr) errors.push("--pr is required");
  if (!parsed.file) errors.push("--file is required");
  if (!parsed.title) errors.push("--title is required");
  if (!parsed.severity) errors.push("--severity is required");

  if (errors.length > 0) {
    console.error("Error: Missing required arguments:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  // Validate severity
  if (!VALID_SEVERITIES.includes(parsed.severity)) {
    console.error(
      `Error: Invalid severity "${parsed.severity}". Must be one of: ${VALID_SEVERITIES.join(", ")}`
    );
    process.exit(1);
  }

  // Validate category if provided
  const category = parsed.category || "code-quality";
  if (!VALID_CATEGORIES.includes(category)) {
    console.error(
      `Error: Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`
    );
    process.exit(1);
  }

  console.log("📥 Intake: Adding PR-deferred item...\n");

  // Load existing items
  const existingItems = loadMasterDebt();
  const existingHashes = new Set(existingItems.map((item) => item.content_hash));

  // Create the new item with unique source_id using UUID
  const newItem = {
    source_id: `pr-deferred:${crypto.randomUUID()}`,
    source_file: `PR #${parsed.pr}`,
    category: category,
    severity: parsed.severity,
    type: "tech-debt",
    file: normalizeFilePath(parsed.file),
    line: Number.parseInt(parsed.line, 10) || 0,
    title: parsed.title.substring(0, 500),
    description: parsed.description || `Deferred from PR #${parsed.pr}`,
    recommendation: "",
    effort: "E1",
    status: "NEW",
    roadmap_ref: parsed.roadmap || null,
    created: new Date().toISOString().split("T")[0],
    verified_by: null,
    resolution: null,
    pr_number: Number.parseInt(parsed.pr, 10),
  };

  // Generate content hash
  newItem.content_hash = generateContentHash(newItem);

  // Check for duplicate
  if (existingHashes.has(newItem.content_hash)) {
    const duplicate = existingItems.find((item) => item.content_hash === newItem.content_hash);
    console.log(`⚠️ Duplicate detected! This item already exists as ${duplicate?.id || "unknown"}`);
    console.log(`  Title: ${duplicate?.title?.substring(0, 60)}...`);
    process.exit(0);
  }

  // Assign DEBT ID
  const nextId = getNextDebtId(existingItems);
  newItem.id = `DEBT-${String(nextId).padStart(4, "0")}`;

  // Display item
  console.log("  New item to add:");
  console.log(`    ID:       ${newItem.id}`);
  console.log(`    PR:       #${parsed.pr}`);
  console.log(`    File:     ${newItem.file}:${newItem.line}`);
  console.log(
    `    Title:    ${newItem.title.substring(0, 60)}${newItem.title.length > 60 ? "..." : ""}`
  );
  console.log(`    Severity: ${newItem.severity}`);
  console.log(`    Category: ${newItem.category}`);
  if (newItem.roadmap_ref) {
    console.log(`    ROADMAP:  ${newItem.roadmap_ref}`);
  }

  if (parsed.dryRun) {
    console.log("\n🔍 DRY RUN: No changes written.");
    process.exit(0);
  }

  // Write to MASTER_DEBT.jsonl
  console.log("\n📝 Writing to MASTER_DEBT.jsonl...");
  safeAppendFileSync(MASTER_FILE, JSON.stringify(newItem) + "\n");

  // Log intake activity
  logIntake({
    action: "intake-pr-deferred",
    pr_number: Number.parseInt(parsed.pr, 10),
    item_id: newItem.id,
    file: newItem.file,
    severity: newItem.severity,
  });

  // Regenerate views
  console.log("🔄 Regenerating views...");
  try {
    execSync("node scripts/debt/generate-views.js", { stdio: "inherit" });
  } catch {
    console.warn(
      "  ⚠️ Failed to regenerate views. Run manually: node scripts/debt/generate-views.js"
    );
  }

  console.log(`\n✅ Added ${newItem.id} to MASTER_DEBT.jsonl`);
  console.log(`  📊 New total: ${existingItems.length + 1} items`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
