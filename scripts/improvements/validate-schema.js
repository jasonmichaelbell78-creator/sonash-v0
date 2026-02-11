#!/usr/bin/env node
/* global __dirname */
/**
 * Validate MASTER_IMPROVEMENTS.jsonl schema
 *
 * Usage: node scripts/improvements/validate-schema.js [options]
 *
 * Options:
 *   --file <path>   File to validate (default: MASTER_IMPROVEMENTS.jsonl)
 *   --strict        Fail on warnings (not just errors)
 *   --quiet         Only output errors
 *
 * Exit codes:
 *   0 - Valid (no errors)
 *   1 - Validation errors found
 *   2 - File not found or parse error
 */

const fs = require("node:fs");
const path = require("node:path");
const { loadConfig } = require("../config/load-config");
const { validateAndVerifyPath } = require("../lib/validate-paths");

const IMPROVEMENTS_DIR = path.join(__dirname, "../../docs/improvements");
const DEFAULT_FILE = path.join(IMPROVEMENTS_DIR, "MASTER_IMPROVEMENTS.jsonl");

// Valid schema values — single source of truth: scripts/config/improvement-schema.json
let schema;
try {
  schema = loadConfig("improvement-schema");
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Error: failed to load improvement-schema config: ${msg}`);
  process.exit(2);
}
const VALID_CATEGORIES = schema.validCategories;
const VALID_IMPACTS = schema.validImpacts;
const VALID_EFFORTS = schema.validEfforts;
const VALID_STATUSES = schema.validStatuses;
const CONFIDENCE_THRESHOLD = schema.confidenceThreshold;
const REQUIRED_FIELDS = schema.requiredFields;

if (
  !Array.isArray(VALID_CATEGORIES) ||
  !Array.isArray(VALID_IMPACTS) ||
  !Array.isArray(VALID_EFFORTS) ||
  !Array.isArray(VALID_STATUSES) ||
  !Array.isArray(REQUIRED_FIELDS) ||
  typeof CONFIDENCE_THRESHOLD !== "number" ||
  typeof schema.idPattern !== "string"
) {
  console.error("Error: invalid improvement-schema config (unexpected shape/types).");
  process.exit(2);
}

let ID_PATTERN;
try {
  ID_PATTERN = new RegExp(schema.idPattern);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Error: invalid improvement-schema idPattern regex: ${msg}`);
  process.exit(2);
}

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
      parsed.file = args[++i];
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
  if (item.id && !ID_PATTERN.test(item.id)) {
    errors.push(
      `Line ${lineNum}: Invalid ID format: "${item.id}" (expected pattern: ${schema.idPattern})`
    );
  }

  // Validate category
  if (item.category && !VALID_CATEGORIES.includes(item.category)) {
    errors.push(
      `Line ${lineNum}: Invalid category: "${item.category}" (valid: ${VALID_CATEGORIES.join(", ")})`
    );
  }

  // Validate impact
  if (item.impact && !VALID_IMPACTS.includes(item.impact)) {
    errors.push(
      `Line ${lineNum}: Invalid impact: "${item.impact}" (valid: ${VALID_IMPACTS.join(", ")})`
    );
  }

  // Validate effort
  if (item.effort && !VALID_EFFORTS.includes(item.effort)) {
    errors.push(
      `Line ${lineNum}: Invalid effort: "${item.effort}" (valid: ${VALID_EFFORTS.join(", ")})`
    );
  }

  // Validate status
  if (item.status && !VALID_STATUSES.includes(item.status)) {
    errors.push(
      `Line ${lineNum}: Invalid status: "${item.status}" (valid: ${VALID_STATUSES.join(", ")})`
    );
  }

  // Validate confidence is a number within range
  if (item.confidence !== undefined && item.confidence !== null) {
    if (typeof item.confidence !== "number" || item.confidence < 0 || item.confidence > 100) {
      errors.push(
        `Line ${lineNum}: Invalid confidence: ${item.confidence} (expected number 0-100)`
      );
    } else if (item.confidence < CONFIDENCE_THRESHOLD) {
      warnings.push(
        `Line ${lineNum}: Low confidence: ${item.confidence} (threshold: ${CONFIDENCE_THRESHOLD})`
      );
    }
  }

  // Honesty guard: counter_argument must be non-empty
  if (item.counter_argument !== undefined && item.counter_argument !== null) {
    const trimmed = typeof item.counter_argument === "string" ? item.counter_argument.trim() : "";
    if (trimmed.length === 0) {
      errors.push(
        `Line ${lineNum}: counter_argument must be non-empty (honesty guard: every improvement needs a credible counter-argument)`
      );
    }
  }

  // Validate fingerprint format (category::scope::slug)
  if (item.fingerprint && !/^[a-z0-9-]+::[a-zA-Z0-9/_.-]+::[a-z0-9-]+$/.test(item.fingerprint)) {
    warnings.push(`Line ${lineNum}: Invalid fingerprint format (expected category::scope::slug)`);
  }

  // Validate date format (YYYY-MM-DD)
  if (item.created && !/^\d{4}-\d{2}-\d{2}$/.test(item.created)) {
    warnings.push(
      `Line ${lineNum}: Invalid created date format: "${item.created}" (expected YYYY-MM-DD)`
    );
  }

  // Check for deduplication field
  if (!item.fingerprint) {
    warnings.push(`Line ${lineNum}: Missing fingerprint (needed for deduplication)`);
  }

  return { errors, warnings };
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log(`
Usage: node scripts/improvements/validate-schema.js [options]

Options:
  --file <path>   File to validate (default: MASTER_IMPROVEMENTS.jsonl)
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
  const projectDir = path.resolve(__dirname, "../..");
  const filePath = parsed.file ? path.resolve(projectDir, parsed.file) : DEFAULT_FILE;

  // Security: always validate resolved path (default may be a symlink)
  const validation = validateAndVerifyPath(filePath, projectDir);
  if (!validation.valid) {
    console.error(`Error: ${validation.error}`);
    process.exit(2);
  }

  if (!parsed.quiet) {
    console.log("Validating improvement schema...\n");
    console.log(`  File: ${filePath}`);
  }

  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(2);
  }

  // Read and parse file
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`Error reading file: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }
  const lines = content.split("\n");

  if (!parsed.quiet) {
    const nonEmpty = lines.filter((l) => l.trim()).length;
    console.log(`  Items: ${nonEmpty}\n`);
  }

  if (lines.every((l) => !l.trim())) {
    if (!parsed.quiet) {
      console.log("  No items to validate (empty file).\n");
      console.log("Schema validation PASSED (empty file)");
    }
    process.exit(0);
  }

  const allErrors = [];
  const allWarnings = [];
  const seenIds = new Set();
  const seenFingerprints = new Set();
  const duplicateIds = [];
  const duplicateFingerprints = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trimEnd(); // Handle CRLF line endings
    if (!line.trim()) continue;

    try {
      const item = JSON.parse(line);

      if (!item || typeof item !== "object" || Array.isArray(item)) {
        allErrors.push(
          `Line ${lineNum}: Invalid item type (expected JSON object) — Content: ${line.substring(0, 100)}`
        );
        continue;
      }

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

      // Check for duplicate fingerprints
      if (item.fingerprint) {
        if (seenFingerprints.has(item.fingerprint)) {
          duplicateFingerprints.push({
            fingerprint: item.fingerprint.substring(0, 8),
            line: lineNum,
            id: item.id,
          });
        }
        seenFingerprints.add(item.fingerprint);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      allErrors.push(
        `Line ${lineNum}: JSON parse error: ${msg} — Content: ${line.substring(0, 100)}`
      );
    }
  }

  // Add duplicate errors
  for (const dup of duplicateIds) {
    allErrors.push(`Line ${dup.line}: Duplicate ID: ${dup.id}`);
  }

  for (const dup of duplicateFingerprints) {
    allWarnings.push(
      `Line ${dup.line}: Duplicate fingerprint (${dup.fingerprint}...) - possible duplicate item: ${dup.id}`
    );
  }

  // Output results
  if (allErrors.length > 0) {
    console.log("Validation Errors:\n");
    for (const err of allErrors.slice(0, 20)) {
      console.log(`  ${err}`);
    }
    if (allErrors.length > 20) {
      console.log(`  ... and ${allErrors.length - 20} more errors`);
    }
  }

  if (allWarnings.length > 0 && !parsed.quiet) {
    console.log("\nValidation Warnings:\n");
    for (const warn of allWarnings.slice(0, 10)) {
      console.log(`  ${warn}`);
    }
    if (allWarnings.length > 10) {
      console.log(`  ... and ${allWarnings.length - 10} more warnings`);
    }
  }

  // Summary
  if (!parsed.quiet) {
    console.log("\nSummary:");
    console.log(`  Total items: ${lines.filter((l) => l.trim()).length}`);
    console.log(`  Unique IDs: ${seenIds.size}`);
    console.log(`  Errors: ${allErrors.length}`);
    console.log(`  Warnings: ${allWarnings.length}`);
  }

  // Exit code
  if (allErrors.length > 0) {
    console.log("\nSchema validation FAILED");
    process.exit(1);
  }

  if (parsed.strict && allWarnings.length > 0) {
    console.log("\nSchema validation FAILED (strict mode)");
    process.exit(1);
  }

  if (!parsed.quiet) {
    console.log("\nSchema validation PASSED");
  }
  process.exit(0);
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Fatal error:", msg);
  process.exit(2);
});
