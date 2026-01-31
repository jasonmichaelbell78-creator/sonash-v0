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

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const DEBT_DIR = path.join(__dirname, "../../docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const LOG_DIR = path.join(DEBT_DIR, "logs");
const LOG_FILE = path.join(LOG_DIR, "intake-log.jsonl");

// Valid schema values
const VALID_CATEGORIES = [
  "security",
  "performance",
  "code-quality",
  "documentation",
  "process",
  "refactoring",
];
const VALID_SEVERITIES = ["S0", "S1", "S2", "S3"];
const VALID_TYPES = ["bug", "code-smell", "vulnerability", "hotspot", "tech-debt", "process-gap"];
const VALID_EFFORTS = ["E0", "E1", "E2", "E3"];

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
        parsed[key] = value;
        i++;
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
        const num = parseInt(match[1], 10);
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
  const content = fs.readFileSync(MASTER_FILE, "utf8");
  const lines = content.split("\n").filter((line) => line.trim());

  const items = [];
  const badLines = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      items.push(JSON.parse(lines[i]));
    } catch (err) {
      badLines.push({ line: i + 1, message: err.message });
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

  // Validate required fields
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

  // Validate severity
  if (!VALID_SEVERITIES.includes(parsed.severity)) {
    console.error(
      `Error: Invalid severity "${parsed.severity}". Must be one of: ${VALID_SEVERITIES.join(", ")}`
    );
    process.exit(1);
  }

  // Validate category
  if (!VALID_CATEGORIES.includes(parsed.category)) {
    console.error(
      `Error: Invalid category "${parsed.category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`
    );
    process.exit(1);
  }

  // Validate type if provided
  const type = parsed.type || "tech-debt";
  if (!VALID_TYPES.includes(type)) {
    console.error(`Error: Invalid type "${type}". Must be one of: ${VALID_TYPES.join(", ")}`);
    process.exit(1);
  }

  // Validate effort if provided
  const effort = parsed.effort || "E1";
  if (!VALID_EFFORTS.includes(effort)) {
    console.error(`Error: Invalid effort "${effort}". Must be one of: ${VALID_EFFORTS.join(", ")}`);
    process.exit(1);
  }

  console.log("📥 Intake: Adding manual entry...\n");

  // Load existing items
  const existingItems = loadMasterDebt();
  const existingHashes = new Set(existingItems.map((item) => item.content_hash));

  // Create the new item
  const newItem = {
    source_id: `manual:${crypto.randomUUID()}`,
    source_file: "manual-entry",
    category: parsed.category,
    severity: parsed.severity,
    type: type,
    file: normalizeFilePath(parsed.file),
    line: parseInt(parsed.line, 10) || 0,
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

  if (parsed.dryRun) {
    console.log("\n🔍 DRY RUN: No changes written.");
    process.exit(0);
  }

  // Write to MASTER_DEBT.jsonl
  console.log("\n📝 Writing to MASTER_DEBT.jsonl...");
  fs.appendFileSync(MASTER_FILE, JSON.stringify(newItem) + "\n");

  // Log intake activity
  logIntake({
    action: "intake-manual",
    item_id: newItem.id,
    file: newItem.file,
    severity: newItem.severity,
    category: newItem.category,
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
