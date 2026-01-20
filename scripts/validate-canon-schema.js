#!/usr/bin/env node

/**
 * CANON JSONL Schema Validator
 *
 * Validates CANON-*.jsonl files against the expected schema defined in
 * docs/templates/MULTI_AI_AGGREGATOR_TEMPLATE.md
 *
 * Usage:
 *   node scripts/validate-canon-schema.js [file-or-directory]
 *   node scripts/validate-canon-schema.js docs/reviews/2026-Q1/canonical/
 *   node scripts/validate-canon-schema.js docs/reviews/2026-Q1/canonical/CANON-CODE.jsonl
 *
 * Exit codes:
 *   0 - All files valid
 *   1 - Validation errors found
 *   2 - Usage/file access error
 */

import { readFileSync, readdirSync, statSync, lstatSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

// Required fields per MULTI_AI_AGGREGATOR_TEMPLATE.md
const REQUIRED_FIELDS = ["canonical_id", "category", "title", "severity", "effort", "files"];

// Strongly recommended fields
const RECOMMENDED_FIELDS = ["confidence", "consensus", "why_it_matters", "suggested_fix"];

// Valid enum values
const VALID_SEVERITY = ["S0", "S1", "S2", "S3"];
const VALID_EFFORT = ["E0", "E1", "E2", "E3"];
const VALID_STATUS = ["CONFIRMED", "SUSPECTED", "NEW", "TRACKED_ELSEWHERE"];

// ID format regex: CANON-XXXX (4 digits)
const CANON_ID_REGEX = /^CANON-\d{4}$/;

// Alternative ID formats (for reporting, not valid)
const ALT_ID_PATTERNS = [
  { pattern: /^F-\d{3}$/, name: "Security (F-XXX)" },
  { pattern: /^PERF-\d{3}$/, name: "Performance (PERF-XXX)" },
  { pattern: /^CANON-R-\d{3}$/, name: "Refactoring (CANON-R-XXX)" },
  { pattern: /^CANON-D-\d{3}$/, name: "Documentation (CANON-D-XXX)" },
  { pattern: /^CANON-P-\d{3}$/, name: "Process (CANON-P-XXX)" },
];

/**
 * Detect alternative ID format for better error messages
 */
function detectAltIdFormat(id) {
  for (const alt of ALT_ID_PATTERNS) {
    if (alt.pattern.test(id)) return alt.name;
  }
  return "Unknown";
}

/**
 * Validate canonical_id format
 */
function validateIdFormat(finding, lineNum, result) {
  if (!finding.canonical_id) return;
  if (CANON_ID_REGEX.test(finding.canonical_id)) return;

  const altFormat = detectAltIdFormat(finding.canonical_id);
  result.addError(
    lineNum,
    "canonical_id",
    `Invalid ID format: "${finding.canonical_id}" (detected: ${altFormat}, expected: CANON-XXXX)`
  );
}

/**
 * Validate an enum field against allowed values
 */
function validateEnumField(finding, lineNum, result, field, validValues, isError = true) {
  if (!finding[field]) return;
  if (validValues.includes(finding[field])) return;

  const message = `Invalid ${field}: "${finding[field]}" (expected: ${validValues.join(", ")})`;
  if (isError) {
    result.addError(lineNum, field, message);
  } else {
    result.addWarning(lineNum, field, message.replace("Invalid", "Non-standard"));
  }
}

/**
 * Track field coverage for compliance calculation
 */
function trackFieldCoverage(finding, result, allFields) {
  for (const field of allFields) {
    if (!(field in result.fieldCoverage)) {
      result.fieldCoverage[field] = 0;
    }
    if (field in finding) {
      result.fieldCoverage[field]++;
    }
  }
}

/**
 * Validate confidence field range
 */
function validateConfidence(finding, lineNum, result) {
  if (!("confidence" in finding) && !("final_confidence" in finding)) return;

  const conf = finding.confidence ?? finding.final_confidence;
  if (typeof conf === "number" && (conf < 0 || conf > 100)) {
    result.addWarning(lineNum, "confidence", `Confidence out of range: ${conf} (expected: 0-100)`);
  }
}

/**
 * Validate consensus field format
 */
function validateConsensus(finding, lineNum, result) {
  if ("consensus_score" in finding && typeof finding.consensus_score !== "number") {
    result.addWarning(
      lineNum,
      "consensus_score",
      `consensus_score should be number, got: ${typeof finding.consensus_score}`
    );
  }
  if (
    "consensus" in finding &&
    typeof finding.consensus === "string" &&
    finding.consensus.includes("/")
  ) {
    result.addWarning(
      lineNum,
      "consensus",
      `consensus as string "X/Y" should be normalized to number`
    );
  }
}

class ValidationResult {
  constructor(filename) {
    this.filename = filename;
    this.errors = [];
    this.warnings = [];
    this.findings = 0;
    this.fieldCoverage = {};
  }

  addError(line, field, message) {
    this.errors.push({ line, field, message });
  }

  addWarning(line, field, message) {
    this.warnings.push({ line, field, message });
  }

  get isValid() {
    return this.errors.length === 0;
  }

  get compliance() {
    if (this.findings === 0) return 0;
    const totalFields = REQUIRED_FIELDS.length + RECOMMENDED_FIELDS.length;
    let presentCount = 0;
    for (const field of [...REQUIRED_FIELDS, ...RECOMMENDED_FIELDS]) {
      if (this.fieldCoverage[field] === this.findings) {
        presentCount++;
      }
    }
    return Math.round((presentCount / totalFields) * 100);
  }
}

function validateFinding(finding, lineNum, result) {
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in finding)) {
      result.addError(lineNum, field, `Missing required field: ${field}`);
    }
  }

  // Check recommended fields
  for (const field of RECOMMENDED_FIELDS) {
    if (!(field in finding)) {
      result.addWarning(lineNum, field, `Missing recommended field: ${field}`);
    }
  }

  // Track field coverage
  trackFieldCoverage(finding, result, [...REQUIRED_FIELDS, ...RECOMMENDED_FIELDS]);

  // Validate specific fields using helpers
  validateIdFormat(finding, lineNum, result);
  validateEnumField(finding, lineNum, result, "severity", VALID_SEVERITY, true);
  validateEnumField(finding, lineNum, result, "effort", VALID_EFFORT, true);
  validateEnumField(finding, lineNum, result, "status", VALID_STATUS, false);

  // Validate files is array
  if (finding.files && !Array.isArray(finding.files)) {
    result.addError(lineNum, "files", `"files" must be an array, got: ${typeof finding.files}`);
  }

  // Validate numeric fields
  validateConfidence(finding, lineNum, result);
  validateConsensus(finding, lineNum, result);
}

function validateFile(filepath) {
  const result = new ValidationResult(basename(filepath));

  let content;
  try {
    content = readFileSync(filepath, "utf-8");
  } catch (err) {
    result.addError(0, "file", `Cannot read file: ${err.message}`);
    return result;
  }

  const lines = content.trim().split("\n");
  const seenIds = new Map(); // Track seen IDs for duplicate detection

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let finding;
    try {
      finding = JSON.parse(line);
    } catch (err) {
      result.addError(i + 1, "json", `Invalid JSON: ${err.message}`);
      continue;
    }

    result.findings++;

    // Check for duplicate IDs
    if (finding.canonical_id) {
      if (seenIds.has(finding.canonical_id)) {
        result.addError(
          i + 1,
          "canonical_id",
          `Duplicate ID: "${finding.canonical_id}" (first seen on line ${seenIds.get(finding.canonical_id)})`
        );
      } else {
        seenIds.set(finding.canonical_id, i + 1);
      }
    }

    validateFinding(finding, i + 1, result);
  }

  return result;
}

/**
 * Print a limited list of items with truncation message
 * @param {string} label - Section label
 * @param {Array} items - Items to print
 * @param {number} limit - Max items to show
 * @param {string} color - ANSI color code
 */
function printLimitedList(label, items, limit, color) {
  console.log(`${color}  ${label}:\x1b[0m`);
  for (const item of items.slice(0, limit)) {
    console.log(`    Line ${item.line}: [${item.field}] ${item.message}`);
  }
  if (items.length > limit) {
    console.log(`    ... and ${items.length - limit} more ${label.toLowerCase()}`);
  }
}

/**
 * Print field coverage for a set of fields
 * @param {object} result - Validation result
 * @param {string[]} fields - Fields to report
 * @param {boolean} isRequired - Whether fields are required
 */
function printFieldCoverageSection(result, fields, isRequired) {
  const label = isRequired ? "Required" : "Recommended";
  console.log(`    ${label}:`);
  for (const field of fields) {
    const count = result.fieldCoverage[field] || 0;
    const pct = result.findings > 0 ? Math.round((count / result.findings) * 100) : 0;
    let indicator;
    if (pct === 100) {
      indicator = "\x1b[32m✓\x1b[0m";
    } else if (isRequired) {
      indicator = "\x1b[31m✗\x1b[0m";
    } else {
      indicator = "\x1b[33m○\x1b[0m";
    }
    console.log(`      ${indicator} ${field}: ${count}/${result.findings} (${pct}%)`);
  }
}

function printResult(result) {
  const status = result.isValid ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
  console.log(
    `\n${status} ${result.filename} (${result.findings} findings, ${result.compliance}% compliance)`
  );

  if (result.errors.length > 0) {
    printLimitedList("Errors", result.errors, 10, "\x1b[31m");
  }

  if (result.warnings.length > 0 && process.argv.includes("--verbose")) {
    printLimitedList("Warnings", result.warnings, 5, "\x1b[33m");
  }

  if (process.argv.includes("--coverage")) {
    console.log("  Field Coverage:");
    printFieldCoverageSection(result, REQUIRED_FIELDS, true);
    printFieldCoverageSection(result, RECOMMENDED_FIELDS, false);
  }
}

function printSummary(results) {
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));

  const valid = results.filter((r) => r.isValid).length;
  const total = results.length;
  const totalFindings = results.reduce((sum, r) => sum + r.findings, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const avgCompliance =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.compliance, 0) / results.length)
      : 0;

  console.log(`Files:      ${valid}/${total} valid`);
  console.log(`Findings:   ${totalFindings} total`);
  console.log(`Errors:     ${totalErrors}`);
  console.log(`Compliance: ${avgCompliance}% average`);

  if (totalErrors > 0) {
    console.log("\n\x1b[31mValidation failed.\x1b[0m");
    console.log("Run with --verbose for warnings, --coverage for field details.");
  } else {
    console.log("\n\x1b[32mAll files valid.\x1b[0m");
  }
}

/**
 * Recursively find CANON-*.jsonl files in a directory
 */
function findCanonFilesRecursive(dir, files) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err.message}`);
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    try {
      const entryStat = lstatSync(fullPath);

      // Avoid cycles: do not follow symlinked directories
      if (entryStat.isSymbolicLink()) continue;

      if (entryStat.isDirectory()) {
        findCanonFilesRecursive(fullPath, files);
      } else if (entry.startsWith("CANON-") && entry.endsWith(".jsonl")) {
        files.push(fullPath);
      }
    } catch (err) {
      console.error(`Error accessing path ${fullPath}: ${err.message}`);
    }
  }
}

/**
 * Collect files from argument paths
 */
function collectFilesFromArgs(args) {
  const files = [];

  for (const arg of args) {
    if (!existsSync(arg)) {
      console.error(`Error: Path not found: ${arg}`);
      process.exit(2);
    }

    let stat;
    try {
      stat = statSync(arg);
    } catch (err) {
      console.error(`Error accessing path ${arg}: ${err.message}`);
      continue;
    }

    if (stat.isDirectory()) {
      findCanonFilesRecursive(arg, files);
    } else if (arg.endsWith(".jsonl")) {
      files.push(arg);
    }
  }

  return files;
}

function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));

  if (args.length === 0) {
    args.push("docs/reviews");
  }

  const files = collectFilesFromArgs(args);

  if (files.length === 0) {
    console.log("No CANON-*.jsonl files found.");
    process.exit(0);
  }

  console.log(`Validating ${files.length} CANON file(s)...`);

  const results = files.map((f) => validateFile(f));
  results.forEach(printResult);
  printSummary(results);

  const hasErrors = results.some((r) => !r.isValid);
  process.exit(hasErrors ? 1 : 0);
}

main();
