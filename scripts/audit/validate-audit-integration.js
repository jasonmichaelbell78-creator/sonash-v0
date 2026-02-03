#!/usr/bin/env node
/* global __dirname */
/**
 * validate-audit-integration.js - Validation wrapper for comprehensive audit
 *
 * Tests TDMS and Documentation Standards integration during comprehensive audit.
 * Validates:
 * 1. JSONL output compliance against JSONL_SCHEMA_STANDARD.md
 * 2. S0/S1 verification_steps requirements
 * 3. TDMS field mapping compatibility
 * 4. Deduplication and intake dry-run
 *
 * Usage:
 *   node scripts/audit/validate-audit-integration.js capture-baseline
 *   node scripts/audit/validate-audit-integration.js validate-jsonl <file.jsonl>
 *   node scripts/audit/validate-audit-integration.js validate-stage <stage-number>
 *   node scripts/audit/validate-audit-integration.js validate-tdms-intake <file.jsonl>
 *   node scripts/audit/validate-audit-integration.js compare-baseline
 *   node scripts/audit/validate-audit-integration.js generate-report
 *
 * @version 1.0.0
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

// Import error sanitization helper
let sanitizeError;
try {
  sanitizeError = require("../lib/sanitize-error.js");
} catch {
  // Fallback if sanitize-error.js not available
  sanitizeError = (err) =>
    (err instanceof Error ? err.message : String(err)).replace(/[^\w\s.,:-]/g, "");
}

// Repository root for path validation
const REPO_ROOT = path.resolve(__dirname, "../..");

/**
 * Validate file path is within repository root (security constraint)
 * @param {string} filePath - Path to validate
 * @returns {boolean} True if path is safe
 */
function isPathWithinRepo(filePath) {
  if (!filePath || typeof filePath !== "string") return false;
  const resolved = path.resolve(filePath);
  return resolved.startsWith(REPO_ROOT + path.sep) || resolved === REPO_ROOT;
}

// Paths
const DEBT_DIR = path.join(__dirname, "../../docs/technical-debt");
const MASTER_DEBT_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const AUDIT_DIR = path.join(__dirname, "../../docs/audits/comprehensive");
const VALIDATION_STATE_FILE = path.join(AUDIT_DIR, "validation-state.json");
const VALIDATION_REPORT_FILE = path.join(AUDIT_DIR, "VALIDATION_REPORT.md");

// Valid schema values from JSONL_SCHEMA_STANDARD.md
const VALID_CATEGORIES = [
  "security",
  "performance",
  "code-quality",
  "documentation",
  "process",
  "refactoring",
];
const VALID_SEVERITIES = ["S0", "S1", "S2", "S3"];
const VALID_EFFORTS = ["E0", "E1", "E2", "E3"];

// Required fields for Doc Standards JSONL (base schema)
const REQUIRED_BASE_FIELDS = [
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

// S0/S1 verification methods
const VALID_FIRST_PASS_METHODS = ["grep", "tool_output", "file_read", "code_search"];
const VALID_SECOND_PASS_METHODS = ["contextual_review", "exploitation_test", "manual_verification"];
const VALID_TOOL_CONFIRMATIONS = [
  "eslint",
  "sonarcloud",
  "npm_audit",
  "patterns_check",
  "typescript",
  "NONE",
];

/**
 * Load and parse a JSONL file
 * @param {string} filePath - Path to JSONL file
 * @returns {{items: Array, errors: Array}} Parsed items and parse errors
 */
function loadJsonlFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      items: [],
      errors: [{ type: "FILE_NOT_FOUND", message: `File not found: ${path.basename(filePath)}` }],
    };
  }

  // Security: validate path is within repo
  if (!isPathWithinRepo(filePath)) {
    return {
      items: [],
      errors: [{ type: "INVALID_PATH", message: "Path must be within repository" }],
    };
  }

  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    // Sanitize error to prevent sensitive info leakage
    return {
      items: [],
      errors: [{ type: "READ_ERROR", message: `Failed to read file: ${sanitizeError(err)}` }],
    };
  }

  // Support both Unix (LF) and Windows (CRLF) line endings
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  const items = [];
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      items.push({ ...JSON.parse(lines[i]), _lineNumber: i + 1 });
    } catch (err) {
      // Don't include raw content in errors (may contain sensitive data)
      errors.push({
        type: "PARSE_ERROR",
        line: i + 1,
        message: `Invalid JSON on line ${i + 1}`,
      });
    }
  }

  return { items, errors };
}

/**
 * Validate a single finding against JSONL_SCHEMA_STANDARD.md
 * @param {Object} item - Finding to validate
 * @returns {Array<Object>} Validation issues
 */
function validateJsonlSchema(item) {
  const issues = [];
  const findingId = item.fingerprint || item.title?.substring(0, 30) || `line-${item._lineNumber}`;

  // Check required base fields
  for (const field of REQUIRED_BASE_FIELDS) {
    if (item[field] === undefined || item[field] === null) {
      issues.push({
        type: "MISSING_REQUIRED_FIELD",
        findingId,
        field,
        message: `Missing required field: ${field}`,
      });
    }
  }

  // Validate non-empty string fields
  const stringFields = ["title", "why_it_matters", "suggested_fix"];
  for (const field of stringFields) {
    if (item[field] !== undefined && item[field] !== null) {
      if (typeof item[field] !== "string" || item[field].trim() === "") {
        issues.push({
          type: "INVALID_STRING_FIELD",
          findingId,
          field,
          message: `Field '${field}' must be a non-empty string`,
        });
      }
    }
  }

  // Validate category enum
  if (item.category && !VALID_CATEGORIES.includes(item.category)) {
    issues.push({
      type: "INVALID_CATEGORY",
      findingId,
      field: "category",
      value: item.category,
      message: `Invalid category '${item.category}'. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
    });
  }

  // Validate severity enum
  if (item.severity && !VALID_SEVERITIES.includes(item.severity)) {
    issues.push({
      type: "INVALID_SEVERITY",
      findingId,
      field: "severity",
      value: item.severity,
      message: `Invalid severity '${item.severity}'. Must be one of: ${VALID_SEVERITIES.join(", ")}`,
    });
  }

  // Validate effort enum
  if (item.effort && !VALID_EFFORTS.includes(item.effort)) {
    issues.push({
      type: "INVALID_EFFORT",
      findingId,
      field: "effort",
      value: item.effort,
      message: `Invalid effort '${item.effort}'. Must be one of: ${VALID_EFFORTS.join(", ")}`,
    });
  }

  // Validate confidence is number 0-100
  if (item.confidence !== undefined) {
    if (typeof item.confidence !== "number" || item.confidence < 0 || item.confidence > 100) {
      issues.push({
        type: "INVALID_CONFIDENCE",
        findingId,
        field: "confidence",
        value: item.confidence,
        message: `Invalid confidence '${item.confidence}'. Must be a number 0-100`,
      });
    }
  }

  // Validate files is non-empty array (check always, not just when defined)
  if (!Array.isArray(item.files) || item.files.length === 0) {
    issues.push({
      type: "INVALID_FILES",
      findingId,
      field: "files",
      message: "Field 'files' must be a non-empty array",
    });
  }

  // Validate acceptance_tests is non-empty array (check always, not just when defined)
  if (!Array.isArray(item.acceptance_tests) || item.acceptance_tests.length === 0) {
    issues.push({
      type: "INVALID_ACCEPTANCE_TESTS",
      findingId,
      field: "acceptance_tests",
      message: "Field 'acceptance_tests' must be a non-empty array",
    });
  }

  // Validate fingerprint format: <category>::<file>::<identifier>
  if (item.fingerprint !== undefined) {
    if (typeof item.fingerprint !== "string" || item.fingerprint.trim() === "") {
      issues.push({
        type: "INVALID_FINGERPRINT_FORMAT",
        findingId,
        field: "fingerprint",
        message: "Fingerprint must be a non-empty string",
      });
    } else {
      const parts = item.fingerprint.split("::").map((p) => p.trim());
      const hasEnoughParts = parts.length >= 3;
      const hasEmptyPart = parts.some((p) => p.length === 0);

      if (!hasEnoughParts || hasEmptyPart) {
        issues.push({
          type: "INVALID_FINGERPRINT_FORMAT",
          findingId,
          field: "fingerprint",
          message: "Fingerprint must follow format: <category>::<file>::<identifier>",
        });
      } else if (item.category && parts[0] !== item.category) {
        issues.push({
          type: "FINGERPRINT_CATEGORY_MISMATCH",
          findingId,
          field: "fingerprint",
          message: `Fingerprint category '${parts[0]}' must match item category '${item.category}'`,
        });
      }
    }
  }

  return issues;
}

/**
 * Validate S0/S1 findings have required verification_steps
 * @param {Object} item - Finding to validate
 * @returns {Array<Object>} Validation issues (blocking for S0/S1)
 */
function validateS0S1Requirements(item) {
  const issues = [];
  const severity = item.severity;

  // Only validate S0 and S1 findings
  if (severity !== "S0" && severity !== "S1") {
    return issues;
  }

  const findingId = item.fingerprint || item.title?.substring(0, 30) || `line-${item._lineNumber}`;
  const prefix = `${findingId} (${severity})`;

  // Check for verification_steps object
  if (!item.verification_steps) {
    issues.push({
      type: "MISSING_VERIFICATION_STEPS",
      findingId,
      severity,
      blocking: true,
      message: `${prefix}: Missing required 'verification_steps' object for ${severity} findings`,
    });
    return issues; // Can't validate further without verification_steps
  }

  const vs = item.verification_steps;

  // Validate first_pass
  if (!vs.first_pass) {
    issues.push({
      type: "MISSING_FIRST_PASS",
      findingId,
      severity,
      blocking: true,
      message: `${prefix}: Missing 'verification_steps.first_pass' object`,
    });
  } else {
    if (!vs.first_pass.method || !VALID_FIRST_PASS_METHODS.includes(vs.first_pass.method)) {
      issues.push({
        type: "INVALID_FIRST_PASS_METHOD",
        findingId,
        severity,
        blocking: true,
        message: `${prefix}: Invalid first_pass.method '${vs.first_pass.method}'. Must be one of: ${VALID_FIRST_PASS_METHODS.join(", ")}`,
      });
    }
    if (
      !Array.isArray(vs.first_pass.evidence_collected) ||
      vs.first_pass.evidence_collected.length < 1
    ) {
      issues.push({
        type: "EMPTY_FIRST_PASS_EVIDENCE",
        findingId,
        severity,
        blocking: true,
        message: `${prefix}: first_pass.evidence_collected must have at least 1 item`,
      });
    }
  }

  // Validate second_pass
  if (!vs.second_pass) {
    issues.push({
      type: "MISSING_SECOND_PASS",
      findingId,
      severity,
      blocking: true,
      message: `${prefix}: Missing 'verification_steps.second_pass' object`,
    });
  } else {
    if (!vs.second_pass.method || !VALID_SECOND_PASS_METHODS.includes(vs.second_pass.method)) {
      issues.push({
        type: "INVALID_SECOND_PASS_METHOD",
        findingId,
        severity,
        blocking: true,
        message: `${prefix}: Invalid second_pass.method '${vs.second_pass.method}'. Must be one of: ${VALID_SECOND_PASS_METHODS.join(", ")}`,
      });
    }
    if (vs.second_pass.confirmed !== true) {
      issues.push({
        type: "SECOND_PASS_NOT_CONFIRMED",
        findingId,
        severity,
        blocking: true,
        message: `${prefix}: second_pass.confirmed must be true. If not confirmed, downgrade severity.`,
      });
    }
  }

  // Validate tool_confirmation
  if (!vs.tool_confirmation) {
    issues.push({
      type: "MISSING_TOOL_CONFIRMATION",
      findingId,
      severity,
      blocking: true,
      message: `${prefix}: Missing 'verification_steps.tool_confirmation' object`,
    });
  } else {
    if (
      !vs.tool_confirmation.tool ||
      !VALID_TOOL_CONFIRMATIONS.includes(vs.tool_confirmation.tool)
    ) {
      issues.push({
        type: "INVALID_TOOL_CONFIRMATION",
        findingId,
        severity,
        blocking: true,
        message: `${prefix}: Invalid tool_confirmation.tool '${vs.tool_confirmation.tool}'. Must be one of: ${VALID_TOOL_CONFIRMATIONS.join(", ")}`,
      });
    }
    if (
      typeof vs.tool_confirmation.reference !== "string" ||
      vs.tool_confirmation.reference.trim() === ""
    ) {
      issues.push({
        type: "MISSING_TOOL_REFERENCE",
        findingId,
        severity,
        blocking: true,
        message: `${prefix}: tool_confirmation.reference must be a non-empty string`,
      });
    }
  }

  return issues;
}

/**
 * Validate TDMS field mapping compatibility
 * @param {Object} item - Finding to validate
 * @returns {Array<Object>} Validation issues
 */
function validateTdmsMapping(item) {
  const issues = [];
  const findingId = item.fingerprint || item.title?.substring(0, 30) || `line-${item._lineNumber}`;

  // Check that files[0] can be mapped to file
  if (Array.isArray(item.files) && item.files.length > 0) {
    const firstFile = item.files[0];
    if (typeof firstFile !== "string") {
      issues.push({
        type: "TDMS_MAPPING_ERROR",
        findingId,
        field: "files[0]",
        message: `files[0] is not a string (${typeof firstFile}), will be coerced`,
      });
    }
  }

  // Check fingerprint can be converted to source_id
  if (typeof item.fingerprint === "string" && item.fingerprint.trim() !== "") {
    // fingerprint format: category::file::id -> audit:category-file-id
    const converted = `audit:${item.fingerprint.replace(/::/g, "-")}`;
    if (converted.length > 255) {
      issues.push({
        type: "TDMS_MAPPING_WARNING",
        findingId,
        field: "fingerprint",
        message: `Converted source_id may be too long (${converted.length} chars)`,
      });
    }
  }

  // Check why_it_matters exists for description mapping
  if (typeof item.why_it_matters !== "string" || item.why_it_matters.trim() === "") {
    issues.push({
      type: "TDMS_MAPPING_WARNING",
      findingId,
      field: "why_it_matters",
      message: "Empty why_it_matters will result in empty TDMS description",
    });
  }

  // Check suggested_fix exists for recommendation mapping
  if (typeof item.suggested_fix !== "string" || item.suggested_fix.trim() === "") {
    issues.push({
      type: "TDMS_MAPPING_WARNING",
      findingId,
      field: "suggested_fix",
      message: "Empty suggested_fix will result in empty TDMS recommendation",
    });
  }

  return issues;
}

/**
 * Capture baseline MASTER_DEBT.jsonl state before audit
 * @returns {Object} Baseline state
 */
function captureBaseline() {
  const baseline = {
    timestamp: new Date().toISOString(),
    masterDebtFile: MASTER_DEBT_FILE,
    exists: false,
    itemCount: 0,
    lastDebtId: null,
    fileHash: null,
    severityCounts: { S0: 0, S1: 0, S2: 0, S3: 0 },
  };

  if (!fs.existsSync(MASTER_DEBT_FILE)) {
    console.log("  MASTER_DEBT.jsonl does not exist - will be created during intake");
    return baseline;
  }

  // Load and validate file
  const { items, errors } = loadJsonlFile(MASTER_DEBT_FILE);

  // Per SKILL.md: Abort if MASTER_DEBT.jsonl is unreadable
  if (errors.length > 0) {
    console.error("CRITICAL: MASTER_DEBT.jsonl contains invalid or unreadable content.");
    for (const err of errors.slice(0, 5)) {
      console.error(`  - ${err.type}: ${err.message}`);
    }
    if (errors.length > 5) {
      console.error(`  ... and ${errors.length - 5} more errors`);
    }
    console.error("Aborting audit as per failure handling protocol.");
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(MASTER_DEBT_FILE, "utf8");
    baseline.exists = true;
    baseline.fileHash = crypto.createHash("sha256").update(content).digest("hex").substring(0, 16);

    baseline.itemCount = items.length;

    // Find last DEBT-ID
    let maxId = 0;
    for (const item of items) {
      if (item.id) {
        const match = item.id.match(/DEBT-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxId) maxId = num;
        }
      }
      // Count severities
      if (item.severity && baseline.severityCounts[item.severity] !== undefined) {
        baseline.severityCounts[item.severity]++;
      }
    }
    baseline.lastDebtId = maxId > 0 ? `DEBT-${String(maxId).padStart(4, "0")}` : null;
  } catch (err) {
    console.error(`CRITICAL: Error processing MASTER_DEBT.jsonl: ${sanitizeError(err)}`);
    process.exit(1);
  }

  return baseline;
}

/**
 * Compare current MASTER_DEBT.jsonl state against baseline
 * @param {Object} baseline - Captured baseline state
 * @returns {Object} Comparison results
 */
function compareBaseline(baseline) {
  const current = captureBaseline();
  const comparison = {
    baseline,
    current,
    changes: {
      itemsAdded: current.itemCount - baseline.itemCount,
      hashChanged: baseline.fileHash !== current.fileHash,
      newDebtIds: [],
    },
  };

  // Find new DEBT-IDs
  if (baseline.lastDebtId && current.lastDebtId) {
    const baselineNum = parseInt(baseline.lastDebtId.replace("DEBT-", ""), 10);
    const currentNum = parseInt(current.lastDebtId.replace("DEBT-", ""), 10);
    for (let i = baselineNum + 1; i <= currentNum; i++) {
      comparison.changes.newDebtIds.push(`DEBT-${String(i).padStart(4, "0")}`);
    }
  }

  // Calculate severity changes
  comparison.changes.severityChanges = {};
  for (const sev of VALID_SEVERITIES) {
    const diff = current.severityCounts[sev] - baseline.severityCounts[sev];
    if (diff !== 0) {
      comparison.changes.severityChanges[sev] = diff;
    }
  }

  return comparison;
}

/**
 * Validate a single JSONL file comprehensively
 * @param {string} filePath - Path to JSONL file
 * @returns {Object} Validation results
 */
function validateJsonlFile(filePath) {
  console.log(`\nValidating: ${path.basename(filePath)}`);

  const { items, errors: parseErrors } = loadJsonlFile(filePath);

  // Use local Set for dedup, but store array for JSON serialization
  const fingerprintSet = new Set();

  const results = {
    file: filePath,
    itemCount: items.length,
    parseErrors,
    schemaIssues: [],
    s0s1Issues: [],
    tdmsMappingIssues: [],
    uniqueFingerprints: [], // Array for JSON serialization (not Set)
    duplicateFingerprints: [],
    summary: {
      total: items.length,
      valid: 0,
      invalid: 0,
      s0Count: 0,
      s1Count: 0,
      s2Count: 0,
      s3Count: 0,
      blocking: 0,
    },
  };

  for (const item of items) {
    // Schema validation
    const schemaIssues = validateJsonlSchema(item);
    results.schemaIssues.push(...schemaIssues);

    // S0/S1 requirements
    const s0s1Issues = validateS0S1Requirements(item);
    results.s0s1Issues.push(...s0s1Issues);
    results.summary.blocking += s0s1Issues.filter((i) => i.blocking).length;

    // TDMS mapping
    const tdmsIssues = validateTdmsMapping(item);
    results.tdmsMappingIssues.push(...tdmsIssues);

    // Check for duplicate fingerprints (use Set internally, store array)
    if (item.fingerprint) {
      if (fingerprintSet.has(item.fingerprint)) {
        results.duplicateFingerprints.push(item.fingerprint);
      } else {
        fingerprintSet.add(item.fingerprint);
        results.uniqueFingerprints.push(item.fingerprint);
      }
    }

    // Count by severity
    if (item.severity) {
      const sevKey = `${item.severity.toLowerCase()}Count`;
      if (results.summary[sevKey] !== undefined) {
        results.summary[sevKey]++;
      }
    }

    // Count valid/invalid
    if (schemaIssues.length === 0 && s0s1Issues.length === 0) {
      results.summary.valid++;
    } else {
      results.summary.invalid++;
    }
  }

  return results;
}

/**
 * Validate a stage's JSONL outputs
 * @param {number} stageNumber - Stage number (1, 2, or 3)
 * @returns {Object} Stage validation results
 */
function validateStage(stageNumber) {
  const stageFiles = {
    1: [
      "audit-code-findings.jsonl",
      "audit-security-findings.jsonl",
      "audit-performance-findings.jsonl",
      "audit-refactoring-findings.jsonl",
    ],
    2: ["audit-documentation-findings.jsonl", "audit-process-findings.jsonl"],
    3: ["aggregated-findings.jsonl"],
  };

  const expectedFiles = stageFiles[stageNumber];
  if (!expectedFiles) {
    return { error: `Invalid stage number: ${stageNumber}` };
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`STAGE ${stageNumber} VALIDATION`);
  console.log(`${"=".repeat(60)}`);

  const stageResults = {
    stage: stageNumber,
    files: {},
    allFilesExist: true,
    totalFindings: 0,
    totalBlocking: 0,
    passed: true,
  };

  for (const fileName of expectedFiles) {
    const filePath = path.join(AUDIT_DIR, fileName);
    const exists = fs.existsSync(filePath);

    if (!exists) {
      stageResults.allFilesExist = false;
      stageResults.files[fileName] = { exists: false, warning: "File not found" };
      console.log(`  ${fileName}: NOT FOUND`);
      continue;
    }

    const validation = validateJsonlFile(filePath);
    stageResults.files[fileName] = validation;
    stageResults.totalFindings += validation.itemCount;
    stageResults.totalBlocking += validation.summary.blocking;

    if (validation.summary.blocking > 0) {
      stageResults.passed = false;
    }

    // Print summary
    console.log(`  ${fileName}: ${validation.itemCount} findings`);
    if (validation.parseErrors.length > 0) {
      console.log(`    - Parse errors: ${validation.parseErrors.length}`);
    }
    if (validation.schemaIssues.length > 0) {
      console.log(`    - Schema issues: ${validation.schemaIssues.length}`);
    }
    if (validation.summary.blocking > 0) {
      console.log(`    - BLOCKING S0/S1 issues: ${validation.summary.blocking}`);
    }
  }

  console.log(`\nStage ${stageNumber} Summary:`);
  console.log(
    `  Files found: ${Object.values(stageResults.files).filter((f) => f.exists !== false).length}/${expectedFiles.length}`
  );
  console.log(`  Total findings: ${stageResults.totalFindings}`);
  console.log(`  Blocking issues: ${stageResults.totalBlocking}`);
  console.log(`  Status: ${stageResults.passed ? "PASS" : "BLOCKED"}`);

  return stageResults;
}

/**
 * Run intake-audit.js --dry-run and validate the output
 * @param {string} jsonlFile - Path to JSONL file to test intake
 * @returns {Object} Intake validation results
 */
function validateTdmsIntake(jsonlFile) {
  console.log(`\nValidating TDMS intake for: ${path.basename(jsonlFile)}`);

  const results = {
    file: jsonlFile,
    dryRunSuccess: false,
    dryRunOutput: "",
    itemsToAdd: 0,
    duplicatesSkipped: 0,
    errors: [],
  };

  const intakeScript = path.join(__dirname, "../debt/intake-audit.js");

  if (!fs.existsSync(intakeScript)) {
    results.errors.push("intake-audit.js not found");
    return results;
  }

  // Security: validate input path is within repository
  if (!isPathWithinRepo(jsonlFile)) {
    results.errors.push("Input path must be within repository");
    return results;
  }

  if (!fs.existsSync(jsonlFile)) {
    results.errors.push(`Input file not found: ${path.basename(jsonlFile)}`);
    return results;
  }

  try {
    const output = execFileSync(process.execPath, [intakeScript, jsonlFile, "--dry-run"], {
      encoding: "utf8",
      cwd: path.join(__dirname, "../.."),
      stdio: ["ignore", "pipe", "pipe"],
    });

    results.dryRunOutput = output;
    results.dryRunSuccess = true;

    // Parse output for metrics
    const newItemsMatch = output.match(/New items to add:\s*(\d+)/);
    if (newItemsMatch) {
      results.itemsToAdd = parseInt(newItemsMatch[1], 10);
    }

    const duplicatesMatch = output.match(/Duplicates skipped:\s*(\d+)/);
    if (duplicatesMatch) {
      results.duplicatesSkipped = parseInt(duplicatesMatch[1], 10);
    }

    console.log(`  Dry-run successful:`);
    console.log(`    Items to add: ${results.itemsToAdd}`);
    console.log(`    Duplicates skipped: ${results.duplicatesSkipped}`);
  } catch (err) {
    results.dryRunSuccess = false;
    const safeMessage = sanitizeError(err);
    results.errors.push(`Dry-run failed: ${safeMessage}`);
    console.log(`  Dry-run FAILED: ${safeMessage}`);
  }

  return results;
}

/**
 * Load validation state from file
 * @returns {Object|null} Saved state or null
 */
function loadValidationState() {
  if (!fs.existsSync(VALIDATION_STATE_FILE)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(VALIDATION_STATE_FILE, "utf8"));
  } catch (err) {
    console.warn(`Warning: Could not load validation state: ${sanitizeError(err)}`);
    return null;
  }
}

/**
 * Save validation state to file
 * @param {Object} state - State to save
 */
function saveValidationState(state) {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
  fs.writeFileSync(VALIDATION_STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Generate validation report in markdown format
 * @param {Object} state - Validation state with all results
 * @returns {string} Markdown report content
 */
function generateValidationReport(state) {
  const now = new Date().toISOString();
  let report = `# Audit Validation Report

**Generated:** ${now}
**Status:** ${state.overallStatus || "UNKNOWN"}

---

## Pre-Audit Baseline

| Metric | Value |
|--------|-------|
| MASTER_DEBT.jsonl exists | ${state.baseline?.exists ? "Yes" : "No"} |
| Item count | ${state.baseline?.itemCount || 0} |
| Last DEBT-ID | ${state.baseline?.lastDebtId || "N/A"} |
| File hash | ${state.baseline?.fileHash || "N/A"} |

### Severity Distribution (Baseline)

| Severity | Count |
|----------|-------|
| S0 Critical | ${state.baseline?.severityCounts?.S0 || 0} |
| S1 High | ${state.baseline?.severityCounts?.S1 || 0} |
| S2 Medium | ${state.baseline?.severityCounts?.S2 || 0} |
| S3 Low | ${state.baseline?.severityCounts?.S3 || 0} |

---

## Stage Validation Results

`;

  // Add stage results
  for (const stageNum of [1, 2, 3]) {
    const stageKey = `stage${stageNum}`;
    const stage = state[stageKey];

    report += `### Stage ${stageNum}\n\n`;

    if (!stage) {
      report += "*Not yet validated*\n\n";
      continue;
    }

    report += `**Status:** ${stage.passed ? "PASS" : "BLOCKED"}\n\n`;

    report += "| File | Findings | Schema Issues | S0/S1 Issues | Status |\n";
    report += "|------|----------|--------------|--------------|--------|\n";

    for (const [fileName, fileResult] of Object.entries(stage.files || {})) {
      if (fileResult.exists === false) {
        report += `| ${fileName} | - | - | - | NOT FOUND |\n`;
      } else {
        const status = (fileResult.summary?.blocking || 0) > 0 ? "BLOCKED" : "OK";
        report += `| ${fileName} | ${fileResult.itemCount || 0} | ${fileResult.schemaIssues?.length || 0} | ${fileResult.summary?.blocking || 0} | ${status} |\n`;
      }
    }

    report += "\n";
  }

  // Add TDMS intake validation
  report += `---

## TDMS Intake Validation

`;

  if (state.tdmsIntake) {
    report += `**Dry-run status:** ${state.tdmsIntake.dryRunSuccess ? "SUCCESS" : "FAILED"}\n\n`;
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| Items to add | ${state.tdmsIntake.itemsToAdd || 0} |\n`;
    report += `| Duplicates skipped | ${state.tdmsIntake.duplicatesSkipped || 0} |\n`;

    if (state.tdmsIntake.errors?.length > 0) {
      report += `\n**Errors:**\n`;
      for (const err of state.tdmsIntake.errors) {
        report += `- ${err}\n`;
      }
    }
  } else {
    report += "*Not yet validated*\n";
  }

  // Add baseline comparison
  report += `

---

## Post-Audit Comparison

`;

  if (state.comparison) {
    report += `| Metric | Before | After | Change |\n`;
    report += `|--------|--------|-------|--------|\n`;
    report += `| Item count | ${state.baseline?.itemCount || 0} | ${state.comparison.current?.itemCount || 0} | +${state.comparison.changes?.itemsAdded || 0} |\n`;
    report += `| File hash | ${state.baseline?.fileHash || "N/A"} | ${state.comparison.current?.fileHash || "N/A"} | ${state.comparison.changes?.hashChanged ? "Changed" : "Unchanged"} |\n`;

    if (state.comparison.changes?.newDebtIds?.length > 0) {
      report += `\n**New DEBT-IDs:** ${state.comparison.changes.newDebtIds.join(", ")}\n`;
    }

    if (Object.keys(state.comparison.changes?.severityChanges || {}).length > 0) {
      report += `\n**Severity Changes:**\n`;
      for (const [sev, change] of Object.entries(state.comparison.changes.severityChanges)) {
        report += `- ${sev}: ${change > 0 ? "+" : ""}${change}\n`;
      }
    }
  } else {
    report += "*Not yet compared*\n";
  }

  report += `

---

## Summary

`;

  const totalBlocking =
    (state.stage1?.totalBlocking || 0) +
    (state.stage2?.totalBlocking || 0) +
    (state.stage3?.totalBlocking || 0);

  if (totalBlocking > 0) {
    report += `**BLOCKED:** ${totalBlocking} S0/S1 findings lack required verification_steps\n\n`;
    report += `These findings must be fixed before TDMS intake can proceed.\n`;
  } else if (state.overallStatus === "PASS") {
    report += `**ALL VALIDATIONS PASSED**\n\n`;
    report += `- All JSONL outputs comply with schema\n`;
    report += `- All S0/S1 findings have verification_steps\n`;
    report += `- TDMS field mapping validated\n`;
    report += `- Intake dry-run successful\n`;
  } else {
    report += `**INCOMPLETE:** Some stages have not been validated yet.\n`;
  }

  return report;
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("=".repeat(60));
  console.log("AUDIT VALIDATION INTEGRATION");
  console.log("=".repeat(60));

  switch (command) {
    case "capture-baseline": {
      console.log("\nCapturing baseline MASTER_DEBT.jsonl state...");
      const baseline = captureBaseline();
      console.log(`  Items: ${baseline.itemCount}`);
      console.log(`  Last ID: ${baseline.lastDebtId || "N/A"}`);
      console.log(`  Hash: ${baseline.fileHash || "N/A"}`);

      // Save to validation state
      const state = loadValidationState() || {};
      state.baseline = baseline;
      state.startTime = new Date().toISOString();
      saveValidationState(state);
      console.log("\nBaseline saved to validation-state.json");
      break;
    }

    case "validate-jsonl": {
      const filePath = args[1];
      if (!filePath) {
        console.error("Usage: validate-jsonl <file.jsonl>");
        process.exit(1);
      }
      const results = validateJsonlFile(filePath);
      console.log(`\nResults:`);
      console.log(`  Total: ${results.summary.total}`);
      console.log(`  Valid: ${results.summary.valid}`);
      console.log(`  Invalid: ${results.summary.invalid}`);
      console.log(`  Blocking: ${results.summary.blocking}`);
      process.exit(results.summary.blocking > 0 ? 1 : 0);
      break;
    }

    case "validate-stage": {
      const stageNum = parseInt(args[1], 10);
      if (![1, 2, 3].includes(stageNum)) {
        console.error("Usage: validate-stage <1|2|3>");
        process.exit(1);
      }
      const stageResults = validateStage(stageNum);

      // Save to validation state
      const state = loadValidationState() || {};
      state[`stage${stageNum}`] = stageResults;
      saveValidationState(state);

      process.exit(stageResults.passed ? 0 : 1);
      break;
    }

    case "validate-tdms-intake": {
      const jsonlFile = args[1];
      if (!jsonlFile) {
        console.error("Usage: validate-tdms-intake <file.jsonl>");
        process.exit(1);
      }
      const intakeResults = validateTdmsIntake(jsonlFile);

      // Save to validation state
      const state = loadValidationState() || {};
      state.tdmsIntake = intakeResults;
      saveValidationState(state);

      process.exit(intakeResults.dryRunSuccess ? 0 : 1);
      break;
    }

    case "compare-baseline": {
      const state = loadValidationState();
      if (!state || !state.baseline) {
        console.error("No baseline captured. Run capture-baseline first.");
        process.exit(1);
      }
      console.log("\nComparing current state to baseline...");
      const comparison = compareBaseline(state.baseline);
      console.log(`  Items added: ${comparison.changes.itemsAdded}`);
      console.log(`  Hash changed: ${comparison.changes.hashChanged}`);
      if (comparison.changes.newDebtIds.length > 0) {
        console.log(`  New IDs: ${comparison.changes.newDebtIds.join(", ")}`);
      }

      state.comparison = comparison;
      saveValidationState(state);
      break;
    }

    case "generate-report": {
      const state = loadValidationState();
      if (!state) {
        console.error("No validation state found. Run validation steps first.");
        process.exit(1);
      }

      // Determine overall status
      // Require all stages AND intake validation to be run for PASS
      const allStagesRun = state.stage1 && state.stage2 && state.stage3;
      const intakeValidated = Boolean(state.tdmsIntake);
      const allPassed =
        (state.stage1?.passed ?? true) &&
        (state.stage2?.passed ?? true) &&
        (state.stage3?.passed ?? true) &&
        state.tdmsIntake?.dryRunSuccess === true; // Explicit true check

      state.overallStatus =
        allStagesRun && intakeValidated && allPassed
          ? "PASS"
          : allStagesRun && intakeValidated
            ? "BLOCKED"
            : "INCOMPLETE";

      const report = generateValidationReport(state);
      fs.writeFileSync(VALIDATION_REPORT_FILE, report);
      console.log(`\nValidation report generated: ${VALIDATION_REPORT_FILE}`);
      console.log(`Overall status: ${state.overallStatus}`);

      saveValidationState(state);
      break;
    }

    case "help":
    default:
      console.log(`
Usage: node validate-audit-integration.js <command> [args]

Commands:
  capture-baseline              Capture MASTER_DEBT.jsonl state before audit
  validate-jsonl <file>         Validate a single JSONL file
  validate-stage <1|2|3>        Validate all JSONL outputs for a stage
  validate-tdms-intake <file>   Run intake-audit.js --dry-run on a file
  compare-baseline              Compare current state to captured baseline
  generate-report               Generate VALIDATION_REPORT.md

Workflow:
  1. capture-baseline           (before audit starts)
  2. validate-stage 1           (after Stage 1 completes)
  3. validate-stage 2           (after Stage 2 completes)
  4. validate-stage 3           (after Stage 3 aggregation)
  5. validate-tdms-intake       (test intake before actual run)
  6. compare-baseline           (after intake completes)
  7. generate-report            (final report)
`);
      break;
  }
}

main().catch((err) => {
  console.error("Error:", sanitizeError(err));
  process.exit(1);
});

// Export for testing
module.exports = {
  validateJsonlSchema,
  validateS0S1Requirements,
  validateTdmsMapping,
  captureBaseline,
  compareBaseline,
  loadJsonlFile,
  validateJsonlFile,
};
