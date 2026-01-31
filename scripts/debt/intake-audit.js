#!/usr/bin/env node
/* global __dirname */
/**
 * Intake script for audit-generated technical debt
 *
 * Usage: node scripts/debt/intake-audit.js <audit-output.jsonl>
 *
 * Process:
 * 1. Validates input file schema
 * 2. Checks for duplicates against MASTER_DEBT.jsonl
 * 3. Assigns DEBT-XXXX IDs to new items
 * 4. Appends to MASTER_DEBT.jsonl
 * 5. Regenerates views
 * 6. Logs intake activity
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

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
const VALID_STATUSES = ["NEW", "VERIFIED", "FALSE_POSITIVE", "IN_PROGRESS", "RESOLVED"];
const VALID_EFFORTS = ["E0", "E1", "E2", "E3"];

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
  // Convert Windows backslashes to forward slashes for consistent hashing
  let normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\//, "");
  // Remove org/repo prefix if present (e.g., "org_repo:path/to/file")
  // But preserve Windows drive letters (e.g., "C:\path\to\file")
  const colonIndex = normalized.indexOf(":");
  if (colonIndex > 0) {
    // Check if this looks like a Windows drive letter (single letter before colon)
    const beforeColon = normalized.substring(0, colonIndex);
    const isWindowsDrive = beforeColon.length === 1 && /^[A-Za-z]$/.test(beforeColon);
    if (!isWindowsDrive) {
      normalized = normalized.substring(colonIndex + 1);
    }
  }
  return normalized;
}

// Ensure value is in valid set
function ensureValid(value, validSet, defaultValue) {
  if (validSet.includes(value)) return value;
  return defaultValue;
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

// Validate and normalize an input item
function validateAndNormalize(item, sourceFile) {
  const errors = [];

  // Required fields check
  if (!item.title) errors.push("Missing required field: title");
  if (!item.severity) errors.push("Missing required field: severity");
  if (!item.category) errors.push("Missing required field: category");

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Normalize the item
  const normalized = {
    source_id: item.source_id || `audit:${crypto.randomUUID()}`,
    source_file: sourceFile,
    category: ensureValid(item.category, VALID_CATEGORIES, "code-quality"),
    severity: ensureValid(item.severity, VALID_SEVERITIES, "S2"),
    type: ensureValid(item.type, VALID_TYPES, "code-smell"),
    file: normalizeFilePath(item.file || ""),
    // Preserve numeric line info - parse strings, keep numbers, default to 0
    line: typeof item.line === "number" ? item.line : parseInt(String(item.line), 10) || 0,
    title: (item.title || "Untitled").substring(0, 500),
    description: item.description || "",
    recommendation: item.recommendation || "",
    effort: ensureValid(item.effort, VALID_EFFORTS, "E1"),
    status: "NEW",
    roadmap_ref: item.roadmap_ref || null,
    created: new Date().toISOString().split("T")[0],
    verified_by: null,
    resolution: null,
  };

  // Generate content hash
  normalized.content_hash = generateContentHash(normalized);

  // Preserve optional metadata
  if (item.rule) normalized.rule = item.rule;
  if (item.evidence && item.evidence.length > 0) normalized.evidence = item.evidence;

  return { valid: true, item: normalized };
}

// Load existing items from MASTER_DEBT.jsonl with safe JSON parsing
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

// Check for duplicate by content hash
function findDuplicate(item, existingItems) {
  return existingItems.find((existing) => existing.content_hash === item.content_hash);
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

  if (args.length === 0) {
    console.error("Usage: node scripts/debt/intake-audit.js <audit-output.jsonl>");
    console.error("\nOptions:");
    console.error("  --dry-run    Preview changes without writing");
    process.exit(1);
  }

  const dryRun = args.includes("--dry-run");
  const inputFile = args.find((arg) => !arg.startsWith("--"));

  if (!inputFile) {
    console.error("Error: No input file specified");
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  console.log("📥 Intake: Processing audit output...\n");
  console.log(`  Input file: ${inputFile}`);
  if (dryRun) console.log("  Mode: DRY RUN (no changes will be written)\n");

  // Load input file
  const inputContent = fs.readFileSync(inputFile, "utf8");
  const inputLines = inputContent.split("\n").filter((line) => line.trim());

  if (inputLines.length === 0) {
    console.log("  ⚠️ Input file is empty. Nothing to process.");
    process.exit(0);
  }

  console.log(`  📄 Found ${inputLines.length} items in input file\n`);

  // Load existing master debt
  const existingItems = loadMasterDebt();
  console.log(`  📊 Existing MASTER_DEBT.jsonl: ${existingItems.length} items\n`);

  // Build map of existing content hashes to IDs for O(1) lookup
  const existingHashMap = new Map(existingItems.map((item) => [item.content_hash, item.id]));

  // Process input items
  const newItems = [];
  const duplicates = [];
  const errors = [];
  let nextId = getNextDebtId(existingItems);

  for (let i = 0; i < inputLines.length; i++) {
    const line = inputLines[i];
    try {
      const inputItem = JSON.parse(line);
      const result = validateAndNormalize(inputItem, inputFile);

      if (!result.valid) {
        errors.push({ line: i + 1, errors: result.errors });
        continue;
      }

      const normalizedItem = result.item;

      // Check for duplicate using Map for O(1) lookup
      if (existingHashMap.has(normalizedItem.content_hash)) {
        duplicates.push({
          input: normalizedItem.title.substring(0, 50),
          existingId: existingHashMap.get(normalizedItem.content_hash) || "unknown",
        });
        continue;
      }

      // Assign DEBT ID
      normalizedItem.id = `DEBT-${String(nextId).padStart(4, "0")}`;
      nextId++;

      newItems.push(normalizedItem);
      existingHashMap.set(normalizedItem.content_hash, normalizedItem.id);
    } catch (err) {
      errors.push({ line: i + 1, errors: [`JSON parse error: ${err.message}`] });
    }
  }

  // Report results
  console.log("📊 Processing Results:\n");
  console.log(`  ✅ New items to add: ${newItems.length}`);
  console.log(`  ⏭️  Duplicates skipped: ${duplicates.length}`);
  console.log(`  ❌ Validation errors: ${errors.length}`);

  if (duplicates.length > 0 && duplicates.length <= 10) {
    console.log("\n  Skipped duplicates:");
    for (const dup of duplicates) {
      console.log(`    - "${dup.input}..." (exists as ${dup.existingId})`);
    }
  }

  if (errors.length > 0 && errors.length <= 10) {
    console.log("\n  Validation errors:");
    for (const err of errors) {
      console.log(`    Line ${err.line}: ${err.errors.join(", ")}`);
    }
  }

  // Write new items
  if (newItems.length === 0) {
    console.log("\n✅ No new items to add. MASTER_DEBT.jsonl unchanged.");
    process.exit(0);
  }

  if (dryRun) {
    console.log("\n🔍 DRY RUN: Would add the following items:");
    for (const item of newItems.slice(0, 5)) {
      console.log(`  - ${item.id}: ${item.title.substring(0, 60)}...`);
    }
    if (newItems.length > 5) {
      console.log(`  ... and ${newItems.length - 5} more items`);
    }
    process.exit(0);
  }

  // Append to MASTER_DEBT.jsonl
  console.log("\n📝 Writing new items to MASTER_DEBT.jsonl...");
  const newLines = newItems.map((item) => JSON.stringify(item));
  fs.appendFileSync(MASTER_FILE, newLines.join("\n") + "\n");

  // Log intake activity
  logIntake({
    action: "intake-audit",
    input_file: inputFile,
    items_processed: inputLines.length,
    items_added: newItems.length,
    duplicates_skipped: duplicates.length,
    errors: errors.length,
    first_id: newItems[0]?.id,
    last_id: newItems[newItems.length - 1]?.id,
  });

  // Regenerate views
  console.log("🔄 Regenerating views...");
  try {
    // Use execFileSync with args array to prevent shell injection
    execFileSync(process.execPath, ["scripts/debt/generate-views.js"], { stdio: "inherit" });
  } catch {
    console.warn(
      "  ⚠️ Failed to regenerate views. Run manually: node scripts/debt/generate-views.js"
    );
  }

  // Summary
  console.log("\n✅ Intake complete!");
  console.log(
    `  📈 Added ${newItems.length} new items (${newItems[0]?.id} - ${newItems[newItems.length - 1]?.id})`
  );
  console.log(`  📊 New MASTER_DEBT.jsonl total: ${existingItems.length + newItems.length} items`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
