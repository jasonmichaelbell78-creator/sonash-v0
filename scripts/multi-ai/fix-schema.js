#!/usr/bin/env node
/**
 * Multi-AI Schema Fixer
 *
 * Post-normalization processor that:
 * - Maps field variations to canonical names
 * - Adds missing required fields with defaults
 * - Adjusts confidence based on completeness
 * - Validates without rejecting (always produces output)
 *
 * @example
 *   import { fixSchema, validateFinding } from './fix-schema.js';
 *   const { fixed, report } = fixSchema(findings, 'security');
 */

import { readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { safeWriteFileSync } from "../lib/safe-fs.js";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");

// Required fields per JSONL_SCHEMA_STANDARD.md
const REQUIRED_FIELDS = [
  "category",
  "title",
  "fingerprint",
  "severity",
  "effort",
  "confidence",
  "files",
  "why_it_matters",
  "suggested_fix",
  "acceptance_tests",
];

// Field name variations mapping to canonical names
const FIELD_ALIASES = {
  // Fingerprint/ID
  id: "fingerprint",
  finding_id: "fingerprint",
  canonical_id: "fingerprint",
  issue_id: "fingerprint",
  ref: "fingerprint",

  // Title
  name: "title",
  summary: "title",
  issue: "title",
  finding: "title",

  // Severity/Priority
  risk: "severity",
  priority: "severity",
  level: "severity",
  criticality: "severity",
  sev: "severity",

  // Effort/Time
  time: "effort",
  estimate: "effort",
  hours: "effort",
  work: "effort",
  cost: "effort",

  // Confidence
  score: "confidence",
  certainty: "confidence",
  probability: "confidence",

  // Files
  file: "files",
  path: "files",
  location: "files",
  paths: "files",
  affected: "files",
  affected_files: "files",

  // Description
  description: "why_it_matters",
  details: "why_it_matters",
  impact: "why_it_matters",
  problem: "why_it_matters",
  issue_details: "why_it_matters",

  // Fix
  fix: "suggested_fix",
  solution: "suggested_fix",
  recommendation: "suggested_fix",
  action: "suggested_fix",
  remediation: "suggested_fix",
  how_to_fix: "suggested_fix",

  // Tests
  tests: "acceptance_tests",
  verification: "acceptance_tests",
  verify: "acceptance_tests",
  how_to_verify: "acceptance_tests",
};

// Valid enum values
const VALID_SEVERITY = ["S0", "S1", "S2", "S3"];
const VALID_EFFORT = ["E0", "E1", "E2", "E3"];

// Severity normalization map
const SEVERITY_NORMALIZE = {
  critical: "S0",
  high: "S1",
  medium: "S2",
  med: "S2",
  moderate: "S2",
  low: "S3",
  info: "S3",
  informational: "S3",
  0: "S0",
  1: "S1",
  2: "S2",
  3: "S3",
};

// Effort normalization map
const EFFORT_NORMALIZE = {
  trivial: "E0",
  minutes: "E0",
  quick: "E0",
  hours: "E1",
  hour: "E1",
  day: "E2",
  days: "E2",
  week: "E3",
  weeks: "E3",
  major: "E3",
  xs: "E0",
  s: "E1",
  m: "E2",
  l: "E3",
  xl: "E3",
};

/**
 * Generate a fingerprint from finding data
 * Format: <category>::<primary_file>::<title_hash>
 * @param {object} finding - Finding object
 * @returns {string} - Generated fingerprint
 */
function generateFingerprint(finding) {
  const category = finding.category || "general";
  const file = Array.isArray(finding.files) ? finding.files[0] : finding.files || "unknown";
  const titleHash = createHash("md5")
    .update(finding.title || "")
    .digest("hex")
    .substring(0, 8);

  return `${category}::${file}::${titleHash}`;
}

/**
 * Normalize a severity value to S0-S3
 * @param {any} value - Raw severity value
 * @returns {string} - Normalized severity
 */
function normalizeSeverity(value) {
  if (!value) return "S2";

  const str = String(value).toLowerCase().trim();

  // Already in correct format
  if (/^s[0-3]$/i.test(str)) {
    return str.toUpperCase();
  }

  // Check normalize map
  if (SEVERITY_NORMALIZE[str]) {
    return SEVERITY_NORMALIZE[str];
  }

  return "S2"; // Default
}

/**
 * Normalize an effort value to E0-E3
 * @param {any} value - Raw effort value
 * @returns {string} - Normalized effort
 */
function normalizeEffort(value) {
  if (!value) return "E1";

  const str = String(value).toLowerCase().trim();

  // Already in correct format
  if (/^e[0-3]$/i.test(str)) {
    return str.toUpperCase();
  }

  // Check normalize map
  if (EFFORT_NORMALIZE[str]) {
    return EFFORT_NORMALIZE[str];
  }

  // Check for duration patterns
  if (/\d+\s*min/i.test(str)) return "E0";
  if (/\d+\s*hour/i.test(str)) return "E1";
  if (/\d+\s*day/i.test(str)) return "E2";
  if (/\d+\s*week/i.test(str)) return "E3";

  return "E1"; // Default
}

/**
 * Normalize confidence to 0-100 number
 * @param {any} value - Raw confidence value
 * @returns {number} - Normalized confidence
 */
function normalizeConfidence(value) {
  if (value === undefined || value === null) return 70;

  // Already a number
  if (typeof value === "number") {
    if (value >= 0 && value <= 100) return Math.round(value);
    if (value >= 0 && value <= 1) return Math.round(value * 100);
  }

  const str = String(value).toLowerCase().trim();

  // Word values
  if (str === "high" || str === "certain" || str === "confirmed") return 90;
  if (str === "medium" || str === "moderate" || str === "likely") return 70;
  if (str === "low" || str === "uncertain" || str === "suspected") return 50;

  // Percentage
  const numMatch = str.match(/(\d+)/);
  if (numMatch) {
    const num = Number.parseInt(numMatch[1], 10);
    if (num >= 0 && num <= 100) return num;
  }

  return 70;
}

/**
 * Normalize files to array format
 * @param {any} value - Files value (string or array)
 * @returns {string[]} - Array of file paths
 */
function normalizeFiles(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((f) => f && typeof f === "string");

  const str = String(value);
  return str
    .split(/[,;\n]+/)
    .map((f) => f.trim().replace(/(?:^`)|(?:`$)/g, ""))
    .filter(Boolean);
}

/**
 * Normalize acceptance tests to array format
 * @param {any} value - Tests value
 * @returns {string[]} - Array of test descriptions
 */
function normalizeAcceptanceTests(value) {
  if (!value) return ["Verify fix applied correctly"];
  if (Array.isArray(value)) return value.filter((t) => t && typeof t === "string");

  const str = String(value);

  // Split by common list patterns
  if (str.includes("\n")) {
    return str
      .split("\n")
      .map((t) => t.replace(/^[-*\d.]+\s*/, "").trim())
      .filter(Boolean);
  }

  return [str];
}

/**
 * Apply field aliases to finding
 * @param {object} finding - Original finding
 * @returns {object} - Finding with aliased fields renamed
 */
function applyFieldAliases(finding) {
  const result = {};

  for (const [key, value] of Object.entries(finding)) {
    const canonicalKey = FIELD_ALIASES[key.toLowerCase()] || key;
    result[canonicalKey] = value;
  }

  return result;
}

/**
 * Fix a single finding to match schema
 * @param {object} finding - Raw finding object
 * @param {string} category - Default category
 * @returns {{ fixed: object, adjustments: string[] }}
 */
function fixSingleFinding(finding, category) {
  const adjustments = [];

  // Apply field aliases first
  let fixed = applyFieldAliases(finding);

  // Ensure category
  if (!fixed.category) {
    fixed.category = category;
    adjustments.push("Added default category");
  }

  // Ensure title (required)
  if (!fixed.title) {
    if (fixed.why_it_matters) {
      fixed.title = fixed.why_it_matters.substring(0, 100);
      adjustments.push("Generated title from description");
    } else {
      fixed.title = "Untitled finding";
      adjustments.push("Added placeholder title");
    }
  }

  // Normalize severity
  const originalSeverity = fixed.severity;
  fixed.severity = normalizeSeverity(fixed.severity);
  if (originalSeverity && fixed.severity !== String(originalSeverity).toUpperCase()) {
    adjustments.push(`Normalized severity: ${originalSeverity} → ${fixed.severity}`);
  }

  // Normalize effort
  const originalEffort = fixed.effort;
  fixed.effort = normalizeEffort(fixed.effort);
  if (originalEffort && fixed.effort !== String(originalEffort).toUpperCase()) {
    adjustments.push(`Normalized effort: ${originalEffort} → ${fixed.effort}`);
  }

  // Normalize confidence
  const originalConfidence = fixed.confidence;
  fixed.confidence = normalizeConfidence(fixed.confidence);
  if (
    originalConfidence !== undefined &&
    typeof originalConfidence !== "number" &&
    fixed.confidence !== originalConfidence
  ) {
    adjustments.push(`Normalized confidence: ${originalConfidence} → ${fixed.confidence}`);
  }

  // Normalize files
  fixed.files = normalizeFiles(fixed.files);

  // Generate fingerprint if missing
  if (!fixed.fingerprint) {
    fixed.fingerprint = generateFingerprint(fixed);
    adjustments.push("Generated fingerprint");
  }

  // Ensure description
  if (!fixed.why_it_matters) {
    fixed.why_it_matters = fixed.title;
    adjustments.push("Used title as description");
  }

  // Ensure suggested fix
  if (!fixed.suggested_fix) {
    fixed.suggested_fix = "Review and address this finding";
    adjustments.push("Added default suggested fix");
  }

  // Ensure acceptance tests
  fixed.acceptance_tests = normalizeAcceptanceTests(fixed.acceptance_tests);
  if (
    fixed.acceptance_tests.length === 1 &&
    fixed.acceptance_tests[0] === "Verify fix applied correctly"
  ) {
    adjustments.push("Added default acceptance test");
  }

  // Calculate confidence adjustments based on completeness
  let confidenceAdjustment = 0;

  if (!fixed.files || fixed.files.length === 0) {
    confidenceAdjustment -= 30;
    adjustments.push("Confidence -30: No files specified");
  }

  if (fixed.title === "Untitled finding") {
    confidenceAdjustment -= 20;
    adjustments.push("Confidence -20: Missing title");
  }

  if (finding._recovered_from_invalid_json) {
    confidenceAdjustment -= 25;
    adjustments.push("Confidence -25: Recovered from invalid JSON");
  }

  if (finding.extraction_method === "plain-text-fallback") {
    confidenceAdjustment -= 30;
    adjustments.push("Confidence -30: Plain text extraction");
  }

  // Apply confidence adjustments (with floor)
  if (confidenceAdjustment !== 0) {
    fixed.confidence = Math.max(30, fixed.confidence + confidenceAdjustment);
  }

  return { fixed, adjustments };
}

/**
 * Fix an array of findings
 * @param {object[]} findings - Array of raw findings
 * @param {string} category - Default category for findings
 * @returns {{ fixed: object[], report: object }}
 */
export function fixSchema(findings, category = "general") {
  const fixed = [];
  const allAdjustments = [];
  let totalAdjustments = 0;
  let lowConfidenceCount = 0;

  for (let i = 0; i < findings.length; i++) {
    const { fixed: fixedFinding, adjustments } = fixSingleFinding(findings[i], category);

    fixed.push(fixedFinding);

    if (adjustments.length > 0) {
      totalAdjustments += adjustments.length;
      allAdjustments.push({
        index: i,
        title: fixedFinding.title.substring(0, 50),
        adjustments,
      });
    }

    if (fixedFinding.confidence < 50) {
      lowConfidenceCount++;
    }
  }

  const report = {
    total_findings: findings.length,
    total_adjustments: totalAdjustments,
    findings_adjusted: allAdjustments.length,
    low_confidence_count: lowConfidenceCount,
    adjustments: allAdjustments.slice(0, 20), // Limit for readability
    adjustments_truncated: allAdjustments.length > 20,
  };

  return { fixed, report };
}

/**
 * Validate a finding against schema (returns issues, doesn't reject)
 * @param {object} finding - Finding to validate
 * @returns {string[]} - Array of validation issues
 */
export function validateFinding(finding) {
  const issues = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    const value = finding?.[field];
    const isMissing = !(field in (finding || {}));
    const isEmpty =
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0) ||
      value === undefined ||
      value === null;
    if (isMissing || isEmpty) {
      issues.push(`Missing required field: ${field}`);
    }
  }

  // Validate enum values
  if (finding.severity && !VALID_SEVERITY.includes(finding.severity)) {
    issues.push(`Invalid severity: ${finding.severity}`);
  }

  if (finding.effort && !VALID_EFFORT.includes(finding.effort)) {
    issues.push(`Invalid effort: ${finding.effort}`);
  }

  // Validate confidence range
  if (finding.confidence !== undefined) {
    if (
      typeof finding.confidence !== "number" ||
      finding.confidence < 0 ||
      finding.confidence > 100
    ) {
      issues.push(`Invalid confidence: ${finding.confidence}`);
    }
  }

  // Validate files is array
  if (finding.files && !Array.isArray(finding.files)) {
    issues.push(`files must be an array`);
  }

  // Validate acceptance_tests is array
  if (finding.acceptance_tests && !Array.isArray(finding.acceptance_tests)) {
    issues.push(`acceptance_tests must be an array`);
  }

  // Validate fingerprint format
  if (finding.fingerprint && !finding.fingerprint.includes("::")) {
    issues.push(`Fingerprint should follow category::file::id format`);
  }

  return issues;
}

/**
 * Process file from JSONL to fixed JSONL
 * @param {string} inputPath - Input JSONL file
 * @param {string} outputPath - Output JSONL file
 * @param {string} category - Default category
 */
export function processFile(inputPath, outputPath, category) {
  let content;
  try {
    content = readFileSync(inputPath, "utf-8");
  } catch (error) {
    console.error(`Error reading input: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Parse JSONL
  const findings = [];
  const lines = content.split("\n").filter((l) => l.trim());

  for (let i = 0; i < lines.length; i++) {
    try {
      findings.push(JSON.parse(lines[i].trim()));
    } catch (error) {
      console.warn(`Line ${i + 1}: Invalid JSON, skipping`);
    }
  }

  if (findings.length === 0) {
    console.error("No valid findings found in input");
    process.exit(1);
  }

  // Fix schema
  const { fixed, report } = fixSchema(findings, category);

  // Validate results
  let validCount = 0;
  let issueCount = 0;

  for (const finding of fixed) {
    const issues = validateFinding(finding);
    if (issues.length === 0) {
      validCount++;
    } else {
      issueCount += issues.length;
    }
  }

  // Write output
  const jsonl = fixed.map((f) => JSON.stringify(f)).join("\n");
  safeWriteFileSync(outputPath, jsonl);

  // Print report
  console.log(`\n=== Schema Fix Report ===`);
  console.log(`Input findings: ${findings.length}`);
  console.log(`Output findings: ${fixed.length}`);
  console.log(`Findings adjusted: ${report.findings_adjusted}`);
  console.log(`Total adjustments: ${report.total_adjustments}`);
  console.log(`Valid after fix: ${validCount}`);
  console.log(`Low confidence (<50): ${report.low_confidence_count}`);

  if (report.adjustments.length > 0) {
    console.log(`\nSample adjustments:`);
    for (const adj of report.adjustments.slice(0, 5)) {
      console.log(`  "${adj.title}...": ${adj.adjustments.join(", ")}`);
    }
  }

  console.log(`\nOutput: ${outputPath}`);
}

// Export constants
export { REQUIRED_FIELDS, VALID_SEVERITY, VALID_EFFORT, FIELD_ALIASES };

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: node fix-schema.js <input.jsonl> <output.jsonl> [category]");
    console.log("");
    console.log("Fixes schema issues in JSONL findings:");
    console.log("  - Maps field aliases to canonical names");
    console.log("  - Adds missing required fields with defaults");
    console.log("  - Normalizes severity/effort/confidence values");
    console.log("  - Adjusts confidence based on completeness");
    console.log("");
    console.log("Example:");
    console.log("  node fix-schema.js raw.jsonl fixed.jsonl security");
    process.exit(1);
  }

  const [inputPath, outputPath, category = "general"] = args;

  if (!existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  processFile(inputPath, outputPath, category);
}
