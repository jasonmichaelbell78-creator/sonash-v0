#!/usr/bin/env node
/* global __dirname */
/**
 * Intake script for manually discovered technical debt
 *
 * Usage: node scripts/debt/intake-manual.js [options]
 *
 * Options:
 *   --file <path>         File path (required)
 *   --line <number>       Line number (default: 0)
 *   --title <text>        Issue title (required)
 *   --severity <S0-S3>    Severity level (required)
 *   --category <cat>      Category (required)
 *   --type <type>         Type (default: tech-debt)
 *   --description <txt>   Detailed description
 *   --recommendation <txt> Recommended fix
 *   --effort <E0-E3>      Estimated effort (default: E1)
 *   --roadmap <track>     Suggested ROADMAP track
 *   --dry-run             Preview without writing
 *
 * Example:
 *   node scripts/debt/intake-manual.js \
 *     --file "src/services/auth.ts" \
 *     --line 120 \
 *     --title "Refactor authentication flow" \
 *     --severity S2 \
 *     --category refactoring \
 *     --description "Current auth flow has too many edge cases" \
 *     --effort E2
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execSync } = require("node:child_process");
const { sanitizeError } = require("../lib/security-helpers.js");

const { loadConfig } = require("../config/load-config");

const DEBT_DIR = path.join(__dirname, "../../docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const DEDUPED_FILE = path.join(DEBT_DIR, "raw/deduped.jsonl");
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
const VALID_TYPES = schema.validTypes;
const VALID_EFFORTS = schema.validEfforts;

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

// Generate content hash for deduplication
function generateContentHash(item) {
  const normalizedFile = (item.file || "").replace(/^\.\//, "").replace(/^\//, "").toLowerCase();
  const hashInput = [
    normalizedFile,
    item.line || 0,
    (item.title || "").toLowerCase().substring(0, 100),
    (item.description || "").toLowerCase().substring(0, 200),
  ].join("|");
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

// Normalize file path
function normalizeFilePath(filePath) {
  if (!filePath) return "";
  let normalized = filePath.replace(/^\.\//, "").replace(/^\//, "");
  return normalized;
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
  // Note: existsSync doesn't guarantee read success (race conditions, permissions)
  // Always wrap in try/catch per CODE_PATTERNS.md #36
  if (!fs.existsSync(MASTER_FILE)) {
    return [];
  }

  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8");
  } catch (readError) {
    // Use sanitizeError to prevent path leaks in error messages
    console.error(`Error reading MASTER_DEBT.jsonl: ${sanitizeError(readError)}`);
    return [];
  }

  const lines = content.split("\n").filter((line) => line.trim());

  const items = [];
  const badLines = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      items.push(JSON.parse(lines[i]));
    } catch (err) {
      // Safe error.message access per CODE_PATTERNS.md #17
      const errorMessage = err instanceof Error ? err.message : String(err);
      badLines.push({ line: i + 1, message: errorMessage });
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
  fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + "\n");
}

// Validate all required and optional fields, exit on error
function validateInput(parsed) {
  const errors = [];
  if (!parsed.file) errors.push("--file is required");
  if (!parsed.title) errors.push("--title is required");
  if (!parsed.severity) errors.push("--severity is required");
  if (!parsed.category) errors.push("--category is required");

  if (errors.length > 0) {
    console.error("Error: Missing required arguments:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  if (!VALID_SEVERITIES.includes(parsed.severity)) {
    console.error(
      `Error: Invalid severity "${parsed.severity}". Must be one of: ${VALID_SEVERITIES.join(", ")}`
    );
    process.exit(1);
  }

  if (!VALID_CATEGORIES.includes(parsed.category)) {
    console.error(
      `Error: Invalid category "${parsed.category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`
    );
    process.exit(1);
  }

  const type = parsed.type || "tech-debt";
  if (!VALID_TYPES.includes(type)) {
    console.error(`Error: Invalid type "${type}". Must be one of: ${VALID_TYPES.join(", ")}`);
    process.exit(1);
  }

  const effort = parsed.effort || "E1";
  if (!VALID_EFFORTS.includes(effort)) {
    console.error(`Error: Invalid effort "${effort}". Must be one of: ${VALID_EFFORTS.join(", ")}`);
    process.exit(1);
  }

  // Validate line number if provided
  if (parsed.line !== undefined) {
    const raw = String(parsed.line).trim();
    if (!/^\d+$/.test(raw)) {
      console.error(`Error: --line must be a non-negative integer, got: ${parsed.line}`);
      process.exit(1);
    }
    const lineNum = Number.parseInt(raw, 10);
    if (
      !Number.isFinite(lineNum) ||
      lineNum < 0 ||
      lineNum > Number.MAX_SAFE_INTEGER ||
      !Number.isInteger(lineNum)
    ) {
      console.error(`Error: --line must be a non-negative integer, got: ${parsed.line}`);
      process.exit(1);
    }
  }

  return { type, effort };
}

// Build a new debt item from parsed input
function buildNewItem(parsed, type, effort) {
  return {
    source_id: `manual:${crypto.randomUUID()}`,
    source_file: "manual-entry",
    category: parsed.category,
    severity: parsed.severity,
    type: type,
    file: normalizeFilePath(parsed.file),
    line: Number.parseInt(parsed.line, 10) || 0,
    title: parsed.title.substring(0, 500),
    description: parsed.description || "",
    recommendation: parsed.recommendation || "",
    effort: effort,
    status: "NEW",
    roadmap_ref: parsed.roadmap || null,
    created: new Date().toISOString().split("T")[0],
    verified_by: null,
    resolution: null,
  };
}

// Display the new item details
function displayNewItem(newItem) {
  console.log("  New item to add:");
  console.log(`    ID:             ${newItem.id}`);
  console.log(`    File:           ${newItem.file}:${newItem.line}`);
  console.log(
    `    Title:          ${newItem.title.substring(0, 50)}${newItem.title.length > 50 ? "..." : ""}`
  );
  console.log(`    Severity:       ${newItem.severity}`);
  console.log(`    Category:       ${newItem.category}`);
  console.log(`    Type:           ${newItem.type}`);
  console.log(`    Effort:         ${newItem.effort}`);
  if (newItem.description) {
    console.log(
      `    Description:    ${newItem.description.substring(0, 50)}${newItem.description.length > 50 ? "..." : ""}`
    );
  }
  if (newItem.recommendation) {
    console.log(
      `    Recommendation: ${newItem.recommendation.substring(0, 50)}${newItem.recommendation.length > 50 ? "..." : ""}`
    );
  }
  if (newItem.roadmap_ref) {
    console.log(`    ROADMAP:        ${newItem.roadmap_ref}`);
  }
}

// Write item to both deduped and master files with rollback on failure
function writeItemToFiles(newItem) {
  console.log("\n📝 Writing to raw/deduped.jsonl (source file)...");
  const rawDir = path.dirname(DEDUPED_FILE);
  fs.mkdirSync(rawDir, { recursive: true });
  const newItemJson = JSON.stringify(newItem) + "\n";

  try {
    fs.appendFileSync(DEDUPED_FILE, newItemJson);
  } catch (writeError) {
    console.error(`Error writing to deduped file: ${sanitizeError(writeError)}`);
    process.exit(1);
  }

  console.log("📝 Writing to MASTER_DEBT.jsonl...");
  try {
    fs.appendFileSync(MASTER_FILE, newItemJson);
  } catch (writeError) {
    console.error(`Error writing to master file: ${sanitizeError(writeError)}`);
    rollbackDedupedFile(newItemJson);
    process.exit(1);
  }
}

// Rollback deduped file by removing the last appended line (verified)
function rollbackDedupedFile(appendedLine) {
  try {
    const deduped = fs.readFileSync(DEDUPED_FILE, "utf8");
    const lines = deduped.split("\n");

    // Guard for empty files
    if (lines.length === 0) {
      console.warn("  ⚠️ Rollback skipped: deduped file is empty");
      return;
    }

    if (lines.length >= 2 && lines[lines.length - 1] === "") {
      lines.pop();
    }

    if (lines.length === 0) {
      console.warn("  ⚠️ Rollback skipped: deduped file is empty after removing trailing newline");
      return;
    }

    // Normalize lines for comparison - strip \r and trimEnd
    const lastLine = lines[lines.length - 1].replace(/\r/g, "").trimEnd();
    const expectedLine = appendedLine.replace(/\n$/, "").replace(/\r/g, "").trimEnd();

    if (lastLine !== expectedLine) {
      console.warn("  ⚠️ Rollback skipped: last line does not match the appended entry");
      return;
    }
    lines.pop();
    fs.writeFileSync(DEDUPED_FILE, lines.length ? lines.join("\n") + "\n" : "");
    console.warn("  ⚠️ Rolled back deduped.jsonl to maintain consistency");
  } catch (rollbackError) {
    console.error(`  ⚠️ Failed to rollback deduped file: ${sanitizeError(rollbackError)}`);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Usage: node scripts/debt/intake-manual.js [options]

Options:
  --file <path>         File path (required)
  --line <number>       Line number (default: 0)
  --title <text>        Issue title (required)
  --severity <S0-S3>    Severity level (required)
  --category <cat>      Category (required)
  --type <type>         Type (default: tech-debt)
  --description <txt>   Detailed description
  --recommendation <txt> Recommended fix
  --effort <E0-E3>      Estimated effort (default: E1)
  --roadmap <track>     Suggested ROADMAP track
  --dry-run             Preview without writing

Valid categories: ${VALID_CATEGORIES.join(", ")}
Valid severities: ${VALID_SEVERITIES.join(", ")}
Valid types: ${VALID_TYPES.join(", ")}
Valid efforts: ${VALID_EFFORTS.join(", ")}

Example:
  node scripts/debt/intake-manual.js \\
    --file "src/services/auth.ts" \\
    --line 120 \\
    --title "Refactor authentication flow" \\
    --severity S2 \\
    --category refactoring \\
    --description "Current auth flow has too many edge cases" \\
    --effort E2
`);
    process.exit(0);
  }

  const parsed = parseArgs(args);
  const { type, effort } = validateInput(parsed);

  console.log("📥 Intake: Adding manual entry...\n");

  const existingItems = loadMasterDebt();
  const existingHashes = new Set(existingItems.map((item) => item.content_hash));

  const newItem = buildNewItem(parsed, type, effort);
  newItem.content_hash = generateContentHash(newItem);

  // Check for duplicate
  if (existingHashes.has(newItem.content_hash)) {
    const duplicate = existingItems.find((item) => item.content_hash === newItem.content_hash);
    console.log(`⚠️ Duplicate detected! This item already exists as ${duplicate?.id || "unknown"}`);
    console.log(`  Title: ${duplicate?.title?.substring(0, 60)}...`);
    process.exit(0);
  }

  const nextId = getNextDebtId(existingItems);
  newItem.id = `DEBT-${String(nextId).padStart(4, "0")}`;

  displayNewItem(newItem);

  if (parsed.dryRun) {
    console.log("\n🔍 DRY RUN: No changes written.");
    process.exit(0);
  }

  writeItemToFiles(newItem);

  logIntake({
    action: "intake-manual",
    item_id: newItem.id,
    file: newItem.file,
    severity: newItem.severity,
    category: newItem.category,
  });

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
