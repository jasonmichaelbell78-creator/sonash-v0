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

const fs = require("node:fs");
const path = require("node:path");
const { loadConfig } = require("../config/load-config");

const DEBT_DIR = path.join(__dirname, "../../docs/technical-debt");
const DEFAULT_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");

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
const VALID_STATUSES = schema.validStatuses;
const VALID_EFFORTS = schema.validEfforts;
const REQUIRED_FIELDS = schema.requiredFields;

// Parse command line arguments
function parseArgs(args) {
  const parsed = { strict: false, quiet: false, stagedOnly: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--strict") {
      parsed.strict = true;
    } else if (arg === "--quiet") {
      parsed.quiet = true;
    } else if (arg === "--staged-only") {
      parsed.stagedOnly = true;
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

  // Validate file path is a real path (not a placeholder like "multiple" or "1")
  if (item.file) {
    const f = String(item.file).trim();
    const isNumericOnly = /^\d[\d-]*$/.test(f);
    const isPlaceholder = ["multiple", "various", "several", "unknown", "n/a", "tbd"].includes(
      f.toLowerCase()
    );
    const hasPathChars = f.includes(".") || f.includes("/") || f.includes("\\");
    if (isNumericOnly || isPlaceholder || !hasPathChars) {
      warnings.push(`Line ${lineNum}: Invalid file path: "${f}" (TDMS requires a real file path)`);
    }
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

  // Enhancement-type optional field validation
  if (item.type === "enhancement") {
    if (item.counter_argument !== undefined && !item.counter_argument) {
      warnings.push(`Line ${lineNum}: Enhancement has empty counter_argument (honesty guard)`);
    }
    if (item.confidence !== undefined) {
      if (typeof item.confidence !== "number" || item.confidence < 0 || item.confidence > 100) {
        warnings.push(
          `Line ${lineNum}: Enhancement confidence must be 0-100, got: ${item.confidence}`
        );
      } else if (item.confidence < 70) {
        warnings.push(
          `Line ${lineNum}: Enhancement confidence below threshold (${item.confidence} < 70)`
        );
      }
    }
    if (item.subcategory !== undefined && typeof item.subcategory !== "string") {
      warnings.push(`Line ${lineNum}: Enhancement subcategory must be a string`);
    }
    if (item.impact !== undefined && !/^I[0-3]$/.test(item.impact)) {
      warnings.push(`Line ${lineNum}: Enhancement impact must be I0-I3, got: "${item.impact}"`);
    }
  }

  // Check for duplicate detection fields
  if (!item.content_hash) {
    warnings.push(`Line ${lineNum}: Missing content_hash (needed for deduplication)`);
  }

  return { errors, warnings };
}

/**
 * Get line numbers that were added/modified in the staged version of a file.
 * Hook-quality fix: allows validating only changed lines instead of the entire file.
 * Returns a Set of 1-based line numbers, or null if we can't determine (validate all).
 */
function getStagedChangedLines(filePath) {
  const { execFileSync } = require("node:child_process");
  try {
    // Get unified diff with 0 context lines to identify exact changed lines
    const diff = execFileSync("git", ["diff", "--cached", "--unified=0", "--", filePath], {
      encoding: "utf-8",
    });

    const changedLines = new Set();
    // Parse @@ hunk headers: @@ -old,count +new,count @@
    const hunkRegex = /^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,(\d+))?\s+@@/gm;
    let match;
    while ((match = hunkRegex.exec(diff)) !== null) {
      const start = parseInt(match[1], 10);
      const count = match[2] !== undefined ? parseInt(match[2], 10) : 1;
      for (let i = start; i < start + count; i++) {
        changedLines.add(i);
      }
    }
    return changedLines.size > 0 ? changedLines : null;
  } catch {
    return null; // Fall back to validating all lines
  }
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
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`Error reading file: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }
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

  // Hook-quality fix: In --staged-only mode, only validate lines that were changed.
  // This prevents pre-existing schema errors in untouched lines from blocking commits.
  let changedLines = null;
  if (parsed.stagedOnly) {
    changedLines = getStagedChangedLines(filePath);
    if (changedLines && !parsed.quiet) {
      console.log(`  Validating ${changedLines.size} changed line(s) (staged-only mode)\n`);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    try {
      const item = JSON.parse(line);

      // Always track IDs and hashes for duplicate detection (even in staged-only mode)
      if (item.id) {
        if (seenIds.has(item.id)) {
          // Only report duplicate if the current line was changed
          if (!changedLines || changedLines.has(lineNum)) {
            duplicateIds.push({ id: item.id, line: lineNum });
          }
        }
        seenIds.add(item.id);
      }

      if (item.content_hash) {
        if (seenHashes.has(item.content_hash)) {
          if (!changedLines || changedLines.has(lineNum)) {
            duplicateHashes.push({
              hash: item.content_hash.substring(0, 8),
              line: lineNum,
              id: item.id,
            });
          }
        }
        seenHashes.add(item.content_hash);
      }

      // Skip validation for unchanged lines in staged-only mode
      if (changedLines && !changedLines.has(lineNum)) continue;

      const { errors, warnings } = validateItem(item, lineNum);
      allErrors.push(...errors);
      allWarnings.push(...warnings);
    } catch (err) {
      // Skip parse errors for unchanged lines in staged-only mode
      if (changedLines && !changedLines.has(lineNum)) continue;
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
