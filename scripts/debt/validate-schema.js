#!/usr/bin/env node
/* global __dirname */
/**
 * Validate MASTER_DEBT.jsonl schema
 *
 * Usage: node scripts/debt/validate-schema.js [options]
 *
 * Options:
 *   --file <path>   File to validate (default: MASTER_DEBT.jsonl)
 *   --strict        Fail on warnings (not just errors)
 *   --quiet         Only output errors
 *
 * Exit codes:
 *   0 - Valid (no errors)
 *   1 - Validation errors found
 *   2 - File not found or parse error
 */

const fs = require("fs");
const path = require("path");

const DEBT_DIR = path.join(__dirname, "../../docs/technical-debt");
const DEFAULT_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");

// Valid schema values
const VALID_CATEGORIES = [
  "security",
  "performance",
  "code-quality",
  "documentation",
  "process",
  "refactoring",
  "engineering-productivity",
];

const VALID_SEVERITIES = ["S0", "S1", "S2", "S3"];

const VALID_TYPES = ["bug", "code-smell", "vulnerability", "hotspot", "tech-debt", "process-gap"];

const VALID_STATUSES = ["NEW", "VERIFIED", "FALSE_POSITIVE", "IN_PROGRESS", "RESOLVED"];

const VALID_EFFORTS = ["E0", "E1", "E2", "E3"];

// Required fields
const REQUIRED_FIELDS = ["id", "source_id", "title", "severity", "category", "status"];

// Parse command line arguments
function parseArgs(args) {
  const parsed = { strict: false, quiet: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--strict") {
      parsed.strict = true;
    } else if (arg === "--quiet") {
      parsed.quiet = true;
    } else if (arg === "--file" && args[i + 1]) {
      parsed.file = args[i + 1];
      i++;
    } else if (!arg.startsWith("--")) {
      parsed.file = arg;
    }
  }
  return parsed;
}

// Validate a single item
function validateItem(item, lineNum) {
  const errors = [];
  const warnings = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (item[field] === undefined || item[field] === null || item[field] === "") {
      errors.push(`Line ${lineNum}: Missing required field: ${field}`);
    }
  }

  // Validate ID format
  if (item.id && !/^DEBT-\d{4,}$/.test(item.id)) {
    errors.push(`Line ${lineNum}: Invalid ID format: "${item.id}" (expected DEBT-XXXX)`);
  }

  // Validate category
  if (item.category && !VALID_CATEGORIES.includes(item.category)) {
    errors.push(
      `Line ${lineNum}: Invalid category: "${item.category}" (valid: ${VALID_CATEGORIES.join(", ")})`
    );
  }

  // Validate severity
  if (item.severity && !VALID_SEVERITIES.includes(item.severity)) {
    errors.push(
      `Line ${lineNum}: Invalid severity: "${item.severity}" (valid: ${VALID_SEVERITIES.join(", ")})`
    );
  }

  // Validate type
  if (item.type && !VALID_TYPES.includes(item.type)) {
    warnings.push(
      `Line ${lineNum}: Invalid type: "${item.type}" (valid: ${VALID_TYPES.join(", ")})`
    );
  }

  // Validate status
  if (item.status && !VALID_STATUSES.includes(item.status)) {
    errors.push(
      `Line ${lineNum}: Invalid status: "${item.status}" (valid: ${VALID_STATUSES.join(", ")})`
    );
  }

  // Validate effort
  if (item.effort && !VALID_EFFORTS.includes(item.effort)) {
    warnings.push(
      `Line ${lineNum}: Invalid effort: "${item.effort}" (valid: ${VALID_EFFORTS.join(", ")})`
    );
  }

  // Validate content_hash format (SHA-256 = 64 hex chars)
  if (item.content_hash && !/^[a-f0-9]{64}$/.test(item.content_hash)) {
    warnings.push(`Line ${lineNum}: Invalid content_hash format (expected 64 hex chars)`);
  }

  // Validate line number is non-negative
  if (item.line !== undefined && (typeof item.line !== "number" || item.line < 0)) {
    warnings.push(`Line ${lineNum}: Invalid line number: ${item.line}`);
  }

  // Validate date format (YYYY-MM-DD)
  if (item.created && !/^\d{4}-\d{2}-\d{2}$/.test(item.created)) {
    warnings.push(
      `Line ${lineNum}: Invalid created date format: "${item.created}" (expected YYYY-MM-DD)`
    );
  }

  // Check for duplicate detection fields
  if (!item.content_hash) {
    warnings.push(`Line ${lineNum}: Missing content_hash (needed for deduplication)`);
  }

  return { errors, warnings };
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log(`
Usage: node scripts/debt/validate-schema.js [options]

Options:
  --file <path>   File to validate (default: MASTER_DEBT.jsonl)
  --strict        Fail on warnings (not just errors)
  --quiet         Only output errors

Exit codes:
  0 - Valid (no errors)
  1 - Validation errors found
  2 - File not found or parse error
`);
    process.exit(0);
  }

  const parsed = parseArgs(args);
  const filePath = parsed.file || DEFAULT_FILE;

  if (!parsed.quiet) {
    console.log("🔍 Validating TDMS schema...\n");
    console.log(`  File: ${filePath}`);
  }

  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(2);
  }

  // Read and parse file
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").filter((line) => line.trim());

  if (!parsed.quiet) {
    console.log(`  Items: ${lines.length}\n`);
  }

  const allErrors = [];
  const allWarnings = [];
  const seenIds = new Set();
  const seenHashes = new Set();
  const duplicateIds = [];
  const duplicateHashes = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    try {
      const item = JSON.parse(line);
      const { errors, warnings } = validateItem(item, lineNum);

      allErrors.push(...errors);
      allWarnings.push(...warnings);

      // Check for duplicate IDs
      if (item.id) {
        if (seenIds.has(item.id)) {
          duplicateIds.push({ id: item.id, line: lineNum });
        }
        seenIds.add(item.id);
      }

      // Check for duplicate content hashes
      if (item.content_hash) {
        if (seenHashes.has(item.content_hash)) {
          duplicateHashes.push({
            hash: item.content_hash.substring(0, 8),
            line: lineNum,
            id: item.id,
          });
        }
        seenHashes.add(item.content_hash);
      }
    } catch (err) {
      allErrors.push(`Line ${lineNum}: JSON parse error: ${err.message}`);
    }
  }

  // Add duplicate errors
  for (const dup of duplicateIds) {
    allErrors.push(`Line ${dup.line}: Duplicate ID: ${dup.id}`);
  }

  for (const dup of duplicateHashes) {
    allWarnings.push(
      `Line ${dup.line}: Duplicate content_hash (${dup.hash}...) - possible duplicate item: ${dup.id}`
    );
  }

  // Output results
  if (allErrors.length > 0) {
    console.log("❌ Validation Errors:\n");
    for (const err of allErrors.slice(0, 20)) {
      console.log(`  ${err}`);
    }
    if (allErrors.length > 20) {
      console.log(`  ... and ${allErrors.length - 20} more errors`);
    }
  }

  if (allWarnings.length > 0 && !parsed.quiet) {
    console.log("\n⚠️ Validation Warnings:\n");
    for (const warn of allWarnings.slice(0, 10)) {
      console.log(`  ${warn}`);
    }
    if (allWarnings.length > 10) {
      console.log(`  ... and ${allWarnings.length - 10} more warnings`);
    }
  }

  // Summary
  if (!parsed.quiet) {
    console.log("\n📊 Summary:");
    console.log(`  Total items: ${lines.length}`);
    console.log(`  Unique IDs: ${seenIds.size}`);
    console.log(`  Errors: ${allErrors.length}`);
    console.log(`  Warnings: ${allWarnings.length}`);
  }

  // Exit code
  if (allErrors.length > 0) {
    console.log("\n❌ Schema validation FAILED");
    process.exit(1);
  }

  if (parsed.strict && allWarnings.length > 0) {
    console.log("\n❌ Schema validation FAILED (strict mode)");
    process.exit(1);
  }

  if (!parsed.quiet) {
    console.log("\n✅ Schema validation PASSED");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(2);
});
