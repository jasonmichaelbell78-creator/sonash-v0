#!/usr/bin/env node
/**
 * validate-audit.js - Post-audit validation for single-session audits
 *
 * Validates JSONL audit findings against:
 * 1. FALSE_POSITIVES.jsonl database
 * 2. Evidence requirements (file:line, code snippets)
 * 3. Cross-reference with external tools (npm audit, ESLint, patterns:check)
 * 4. Confidence scoring validation
 * 5. Duplicate detection
 *
 * Usage:
 *   node scripts/validate-audit.js <audit-file.jsonl>
 *   node scripts/validate-audit.js docs/audits/single-session/security/audit-2026-01-08.jsonl
 *   node scripts/validate-audit.js --all  # Validate all recent audits
 */

import node_fs from "node:fs";
import node_path from "node:path";
import node_url from "node:url";
import { execSync } from "node:child_process";

const __filename = node_url.fileURLToPath(import.meta.url);
const __dirname = node_path.dirname(__filename);

const FP_FILE = node_path.join(__dirname, "..", "docs", "audits", "FALSE_POSITIVES.jsonl");
const AUDITS_DIR = node_path.join(__dirname, "..", "docs", "audits", "single-session");

// Severity levels for validation strictness
const SEVERITY_LEVELS = { S0: 0, S1: 1, S2: 2, S3: 3 };

// Confidence levels
const CONFIDENCE_LEVELS = { HIGH: 2, MEDIUM: 1, LOW: 0 };

// Valid confidence values
const VALID_CONFIDENCES = new Set(["HIGH", "MEDIUM", "LOW"]);

// Valid verification methods for S0/S1 verification_steps
const VALID_FIRST_PASS_METHODS = new Set(["grep", "tool_output", "file_read", "code_search"]);
const VALID_SECOND_PASS_METHODS = new Set([
  "contextual_review",
  "exploitation_test",
  "manual_verification",
]);
const VALID_TOOL_CONFIRMATIONS = new Set([
  "eslint",
  "sonarcloud",
  "npm_audit",
  "patterns_check",
  "typescript",
  "NONE",
]);

// Required fields by severity
// S0/S1: Strict requirements including evidence and confidence
// S2: Standard requirements with line for deduplication
// S3: Relaxed requirements - line is optional for low-priority items
const REQUIRED_FIELDS_BY_SEVERITY = {
  S0: [
    "id",
    "category",
    "severity",
    "file",
    "line",
    "title",
    "description",
    "recommendation",
    "evidence",
    "confidence",
  ],
  S1: [
    "id",
    "category",
    "severity",
    "file",
    "line",
    "title",
    "description",
    "recommendation",
    "evidence",
    "confidence",
  ],
  // Session #116: Added line to S2 for deduplication/cross-reference
  S2: ["id", "category", "severity", "file", "line", "title", "description", "recommendation"],
  // S3: Relaxed - file and line are optional for low-priority items (Qodo Review #219)
  S3: ["id", "category", "severity", "title", "description"],
};

function loadFalsePositives() {
  if (!node_fs.existsSync(FP_FILE)) {
    console.warn("⚠️  FALSE_POSITIVES.jsonl not found, skipping FP check");
    return [];
  }
  const content = node_fs.readFileSync(FP_FILE, "utf8");
  return content
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function loadAuditFindings(filePath) {
  if (!node_fs.existsSync(filePath)) {
    throw new Error(`Audit file not found: ${filePath}`);
  }
  const content = node_fs.readFileSync(filePath, "utf8");
  return content
    .split("\n")
    .filter((line) => line.trim())
    .map((line, index) => {
      try {
        return { ...JSON.parse(line), _lineNumber: index + 1 };
      } catch (err) {
        return { _parseError: err.message, _lineNumber: index + 1, _raw: line };
      }
    });
}

/**
 * Check if a date string is valid ISO format (strict YYYY-MM-DD)
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid ISO date
 */
function isValidDate(dateStr) {
  if (typeof dateStr !== "string") return false;
  const trimmed = dateStr.trim();
  // Strict YYYY-MM-DD format for deterministic expiry semantics
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const timestamp = new Date(`${trimmed}T00:00:00.000Z`).getTime();
  return !Number.isNaN(timestamp);
}

/**
 * Heuristic check for potentially unsafe regex patterns (ReDoS protection)
 * Not perfect, but prevents common catastrophic backtracking patterns
 * @param {string} pattern - Regex pattern to check
 * @returns {boolean} True if pattern appears unsafe
 */
function isLikelyUnsafeRegex(pattern) {
  if (typeof pattern !== "string") return true;
  // Length limit to prevent very large patterns
  if (pattern.length > 500) return true;
  // Nested quantifiers like (a+)+, (.*)+, ([\s\S]*)* etc.
  if (/\((?:[^()]|\\.){0,200}[+*?](?:[^()]|\\.){0,200}\)[+*?]/.test(pattern)) return true;
  // Extremely broad dot-star with additional quantifiers
  if (/(?:\.\*|\[\s\S\]\*)[+*?]/.test(pattern)) return true;
  return false;
}

/**
 * Check if a file path is safe (no path traversal)
 * Uses path normalization and resolved path validation
 * @param {string} filePath - File path to validate
 * @returns {boolean} True if path is safe
 */
function isSafeFilePath(filePath) {
  if (!filePath || typeof filePath !== "string") return false;

  const normalized = node_path.normalize(filePath);

  // Reject absolute paths (POSIX/Windows) after normalization
  if (node_path.isAbsolute(normalized)) return false;

  // Reject traversal segments explicitly
  const parts = normalized.split(/[\\/]+/);
  if (parts.includes("..")) return false;

  // Reject paths starting with a separator
  if (/^[/\\]/.test(normalized)) return false;

  return true;
}

/**
 * Check if a false positive entry should be skipped
 */
function shouldSkipFalsePositive(fp) {
  // Check expiration
  if (fp.expires) {
    if (!isValidDate(fp.expires)) {
      console.warn(`⚠️  Invalid expires date in ${fp.id}: ${fp.expires} (skipping entry)`);
      return true;
    }
    if (new Date(fp.expires) < new Date()) return true;
  }

  // ReDoS protection
  if (isLikelyUnsafeRegex(fp.pattern)) {
    console.warn(`⚠️  Skipping potentially unsafe regex in ${fp.id}`);
    return true;
  }

  return false;
}

/**
 * Build search text from a finding for pattern matching
 */
/**
 * Convert evidence field to array format (S3358 fix - extract nested ternary)
 */
function normalizeEvidence(evidence) {
  if (Array.isArray(evidence)) return evidence;
  if (typeof evidence === "string") return [evidence];
  return [];
}

function buildFindingSearchText(finding) {
  // Review #187: Cap evidence items and total size to bound regex work
  const evidenceParts = normalizeEvidence(finding.evidence)
    .filter((e) => typeof e === "string")
    .slice(0, 20); // Cap evidence items

  const text = [
    finding.title || "",
    finding.description || "",
    finding.file || "",
    ...evidenceParts,
  ].join(" ");

  // Review #187: Cap total size to prevent performance issues with regex
  return text.length > 50_000 ? text.slice(0, 50_000) : text;
}

/**
 * Try to match a false positive pattern against a finding
 */
function tryMatchFalsePositive(finding, fp) {
  try {
    const regex = new RegExp(fp.pattern, "i");
    const searchText = buildFindingSearchText(finding);
    const match = regex.exec(searchText);
    return match ? match[0] : null;
  } catch {
    console.warn(`⚠️  Invalid regex in ${fp.id}: ${fp.pattern}`);
    return null;
  }
}

/**
 * Check findings against false positives database
 * Includes ReDoS protection and date validation
 */
function checkFalsePositives(findings, falsePositives) {
  const flagged = [];

  for (const finding of findings) {
    if (finding._parseError) continue;

    for (const fp of falsePositives) {
      if (shouldSkipFalsePositive(fp)) continue;

      const match = tryMatchFalsePositive(finding, fp);
      if (match) {
        flagged.push({ finding, falsePositive: fp, match });
      }
    }
  }

  return flagged;
}

/**
 * Check if a field value is considered missing
 */
function isFieldMissing(value) {
  return (
    value === undefined || value === null || (typeof value === "string" && value.trim() === "")
  );
}

/**
 * Validate required fields for a single finding
 */
function validateFindingRequiredFields(finding, severity, issues) {
  const required = REQUIRED_FIELDS_BY_SEVERITY[severity] || REQUIRED_FIELDS_BY_SEVERITY.S3;

  for (const field of required) {
    if (isFieldMissing(finding[field])) {
      issues.push({
        type: "MISSING_FIELD",
        findingId: finding.id,
        severity,
        field,
        message: `${severity} findings require '${field}' field`,
      });
    }
  }
}

/**
 * Validate evidence array for high-severity findings
 */
function validateEvidence(finding, severity, issues) {
  if (severity !== "S0" && severity !== "S1") return;
  if (!finding.evidence) return;

  if (!Array.isArray(finding.evidence) || finding.evidence.length === 0) {
    issues.push({
      type: "EMPTY_EVIDENCE",
      findingId: finding.id,
      severity,
      message: `${severity} findings require non-empty evidence array`,
    });
  }
}

/**
 * Validate confidence field for high-severity findings
 */
function validateConfidenceField(finding, severity, issues) {
  if (severity !== "S0" && severity !== "S1") return;
  if (!finding.confidence) return;

  if (!VALID_CONFIDENCES.has(finding.confidence)) {
    issues.push({
      type: "INVALID_CONFIDENCE",
      findingId: finding.id,
      message: `Invalid confidence level: ${finding.confidence} (must be HIGH, MEDIUM, or LOW)`,
    });
  }
}

/**
 * Validate file path safety and existence
 */
function validateFilePath(finding, issues) {
  if (!finding.file) return;

  // Review #188: Guard against non-string file paths to prevent runtime crashes
  // Review #195: Use try-catch on String() to handle non-stringifiable values like Symbol
  if (typeof finding.file !== "string") {
    let fileRepr;
    try {
      fileRepr = String(finding.file);
    } catch {
      fileRepr = Object.prototype.toString.call(finding.file);
    }

    issues.push({
      type: "INVALID_TYPE",
      findingId: finding.id,
      file: fileRepr,
      message: `Invalid file path type (expected string, got ${typeof finding.file})`,
    });
    return;
  }

  // Review #196: Check path safety BEFORE wildcards to prevent bypassing security checks
  // e.g., "../../../etc/passwd*" would otherwise skip validation entirely
  if (!isSafeFilePath(finding.file)) {
    issues.push({
      type: "UNSAFE_PATH",
      findingId: finding.id,
      file: finding.file,
      message: `Potentially unsafe file path (traversal attempt): ${finding.file}`,
    });
    return;
  }

  const repoRoot = node_path.resolve(__dirname, "..");

  // Review #197: Wildcards - allow glob patterns, but still enforce repo containment on the prefix
  if (finding.file.includes("*")) {
    const prefix = finding.file.split("*", 1)[0] || ".";
    const prefixPath = node_path.resolve(repoRoot, prefix);

    if (prefixPath !== repoRoot && !prefixPath.startsWith(repoRoot + node_path.sep)) {
      issues.push({
        type: "UNSAFE_PATH",
        findingId: finding.id,
        file: finding.file,
        message: `Potentially unsafe file path (traversal attempt): ${finding.file}`,
      });
    }
    return;
  }

  const fullPath = node_path.resolve(repoRoot, finding.file);

  // Ensure resolved path stays within repo root
  if (fullPath !== repoRoot && !fullPath.startsWith(repoRoot + node_path.sep)) {
    issues.push({
      type: "UNSAFE_PATH",
      findingId: finding.id,
      file: finding.file,
      message: `Potentially unsafe file path (traversal attempt): ${finding.file}`,
    });
  } else if (!node_fs.existsSync(fullPath)) {
    issues.push({
      type: "FILE_NOT_FOUND",
      findingId: finding.id,
      file: finding.file,
      message: `Referenced file does not exist: ${finding.file}`,
    });
  }
}

function validateRequiredFields(findings) {
  const issues = [];

  for (const finding of findings) {
    if (finding._parseError) {
      issues.push({
        type: "PARSE_ERROR",
        line: finding._lineNumber,
        message: `Invalid JSON: ${finding._parseError}`,
        raw: finding._raw,
      });
      continue;
    }

    const severity = finding.severity || "S3";
    validateFindingRequiredFields(finding, severity, issues);
    validateEvidence(finding, severity, issues);
    validateConfidenceField(finding, severity, issues);
    validateFilePath(finding, issues);
  }

  return issues;
}

function checkDuplicates(findings) {
  const duplicates = [];
  const seen = new Map();

  for (const finding of findings) {
    if (finding._parseError) continue;

    // Create a signature for duplicate detection
    const signature = [finding.file || "", finding.line || "", finding.title || ""]
      .join("|")
      .toLowerCase();

    if (seen.has(signature)) {
      duplicates.push({
        original: seen.get(signature),
        duplicate: finding,
      });
    } else {
      seen.set(signature, finding);
    }
  }

  return duplicates;
}

/**
 * Validate S0/S1 findings with strict requirements (Session #98)
 * Returns blocking violations for:
 * - LOW confidence on S0/S1
 * - MANUAL_ONLY verification on S0/S1
 * - Missing verification_steps
 * - second_pass.confirmed !== true
 * - Evidence array < 2 items
 *
 * @param {Array<Object>} findings - Audit findings to validate
 * @returns {Array<Object>} Blocking violations
 */
/**
 * Add a blocking violation to the violations array
 */
function addBlockingViolation(violations, type, findingId, severity, message) {
  violations.push({ type, findingId, severity, message, blocking: true });
}

/**
 * Validate confidence and cross_ref fields for S0/S1 finding
 */
function validateS0S1ConfidenceAndCrossRef(finding, prefix, violations) {
  if (finding.confidence === "LOW") {
    addBlockingViolation(
      violations,
      "LOW_CONFIDENCE_S0S1",
      finding.id,
      finding.severity,
      `${prefix}: LOW confidence not allowed for S0/S1 findings. Upgrade confidence or downgrade severity.`
    );
  }

  if (finding.cross_ref === "MANUAL_ONLY") {
    addBlockingViolation(
      violations,
      "MANUAL_ONLY_S0S1",
      finding.id,
      finding.severity,
      `${prefix}: MANUAL_ONLY not allowed for S0/S1 findings. Require tool validation or downgrade severity.`
    );
  }
}

/**
 * Validate first_pass within verification_steps
 */
function validateFirstPass(vs, finding, prefix, violations) {
  if (!vs.first_pass) {
    addBlockingViolation(
      violations,
      "MISSING_FIRST_PASS",
      finding.id,
      finding.severity,
      `${prefix}: Missing 'verification_steps.first_pass' object.`
    );
    return;
  }

  if (!vs.first_pass.method || !VALID_FIRST_PASS_METHODS.has(vs.first_pass.method)) {
    addBlockingViolation(
      violations,
      "INVALID_FIRST_PASS_METHOD",
      finding.id,
      finding.severity,
      `${prefix}: Invalid first_pass.method '${vs.first_pass.method}'. Must be one of: ${[...VALID_FIRST_PASS_METHODS].join(", ")}`
    );
  }
  if (
    !Array.isArray(vs.first_pass.evidence_collected) ||
    vs.first_pass.evidence_collected.length < 1
  ) {
    addBlockingViolation(
      violations,
      "EMPTY_FIRST_PASS_EVIDENCE",
      finding.id,
      finding.severity,
      `${prefix}: first_pass.evidence_collected must have at least 1 item.`
    );
  }
}

/**
 * Validate second_pass within verification_steps
 */
function validateSecondPass(vs, finding, prefix, violations) {
  if (!vs.second_pass) {
    addBlockingViolation(
      violations,
      "MISSING_SECOND_PASS",
      finding.id,
      finding.severity,
      `${prefix}: Missing 'verification_steps.second_pass' object.`
    );
    return;
  }

  if (!vs.second_pass.method || !VALID_SECOND_PASS_METHODS.has(vs.second_pass.method)) {
    addBlockingViolation(
      violations,
      "INVALID_SECOND_PASS_METHOD",
      finding.id,
      finding.severity,
      `${prefix}: Invalid second_pass.method '${vs.second_pass.method}'. Must be one of: ${[...VALID_SECOND_PASS_METHODS].join(", ")}`
    );
  }
  if (vs.second_pass.confirmed !== true) {
    addBlockingViolation(
      violations,
      "SECOND_PASS_NOT_CONFIRMED",
      finding.id,
      finding.severity,
      `${prefix}: second_pass.confirmed must be true. If not confirmed, downgrade severity.`
    );
  }
}

/**
 * Validate tool_confirmation within verification_steps
 */
function validateToolConfirmation(vs, finding, prefix, violations) {
  if (!vs.tool_confirmation) {
    addBlockingViolation(
      violations,
      "MISSING_TOOL_CONFIRMATION",
      finding.id,
      finding.severity,
      `${prefix}: Missing 'verification_steps.tool_confirmation' object.`
    );
    return;
  }

  if (!vs.tool_confirmation.tool || !VALID_TOOL_CONFIRMATIONS.has(vs.tool_confirmation.tool)) {
    addBlockingViolation(
      violations,
      "INVALID_TOOL_CONFIRMATION",
      finding.id,
      finding.severity,
      `${prefix}: Invalid tool_confirmation.tool '${vs.tool_confirmation.tool}'. Must be one of: ${[...VALID_TOOL_CONFIRMATIONS].join(", ")}`
    );
  }
  if (
    typeof vs.tool_confirmation.reference !== "string" ||
    vs.tool_confirmation.reference.trim() === ""
  ) {
    addBlockingViolation(
      violations,
      "MISSING_TOOL_REFERENCE",
      finding.id,
      finding.severity,
      `${prefix}: tool_confirmation.reference must be a non-empty string.`
    );
  }
}

/**
 * Validate verification_steps structure for a single S0/S1 finding
 */
function validateVerificationSteps(finding, prefix, violations) {
  if (!finding.verification_steps) {
    addBlockingViolation(
      violations,
      "MISSING_VERIFICATION_STEPS",
      finding.id,
      finding.severity,
      `${prefix}: Missing required 'verification_steps' object for S0/S1 findings.`
    );
    return;
  }

  const vs = finding.verification_steps;
  validateFirstPass(vs, finding, prefix, violations);
  validateSecondPass(vs, finding, prefix, violations);
  validateToolConfirmation(vs, finding, prefix, violations);
}

/**
 * Validate S0/S1 findings with strict requirements (Session #98)
 * Returns blocking violations for:
 * - LOW confidence on S0/S1
 * - MANUAL_ONLY verification on S0/S1
 * - Missing verification_steps
 * - second_pass.confirmed !== true
 * - Evidence array < 2 items
 *
 * @param {Array<Object>} findings - Audit findings to validate
 * @returns {Array<Object>} Blocking violations
 */
function validateS0S1Strict(findings) {
  const violations = [];

  // Review #204 R3: Fail closed on malformed JSONL (prevents S0/S1 evasion)
  const parseErrors = findings.filter((f) => f._parseError);
  if (parseErrors.length > 0) {
    addBlockingViolation(
      violations,
      "JSONL_PARSE_ERROR",
      null,
      "S0/S1",
      `Audit file contains ${parseErrors.length} malformed JSONL line(s); strict S0/S1 validation requires a fully parseable file.`
    );
  }

  const s0s1Findings = findings.filter(
    (f) => !f._parseError && (f.severity === "S0" || f.severity === "S1")
  );

  for (const finding of s0s1Findings) {
    const prefix = `${finding.id || "unknown"} (${finding.severity})`;

    validateS0S1ConfidenceAndCrossRef(finding, prefix, violations);
    validateVerificationSteps(finding, prefix, violations);

    // Evidence array should have >= 2 items for S0/S1
    if (!Array.isArray(finding.evidence) || finding.evidence.length < 2) {
      addBlockingViolation(
        violations,
        "INSUFFICIENT_EVIDENCE",
        finding.id,
        finding.severity,
        `${prefix}: S0/S1 findings require at least 2 evidence items (found ${finding.evidence?.length ?? 0}).`
      );
    }
  }

  return violations;
}

/**
 * Cross-reference findings against npm audit output
 * Uses portable command execution (no shell-specific redirection)
 * @param {Array<Object>} findings - Audit findings to cross-reference
 * @returns {{validated: Array, unvalidated: Array}} Cross-reference results
 */
function crossReferenceNpmAudit(findings) {
  const securityFindings = findings.filter(
    (f) => !f._parseError && f.category?.toLowerCase().includes("dep")
  );

  if (securityFindings.length === 0) return { validated: [], unvalidated: [] };

  let auditData = {};
  try {
    // Use stdio config instead of shell redirection for portability
    const output = execSync("npm audit --json", {
      encoding: "utf8",
      cwd: node_path.join(__dirname, ".."),
      stdio: ["ignore", "pipe", "pipe"],
    });

    try {
      auditData = JSON.parse(output);
    } catch {
      auditData = {};
    }
  } catch (err) {
    // npm audit can exit non-zero while still printing JSON to stdout
    const stdout = err?.stdout ? String(err.stdout) : "";
    try {
      auditData = stdout ? JSON.parse(stdout) : {};
    } catch {
      auditData = {};
    }
  }

  const vulnerabilities = auditData.vulnerabilities || {};
  const validated = [];
  const unvalidated = [];

  for (const finding of securityFindings) {
    // Try to match against npm audit results
    const packageMatch = Object.keys(vulnerabilities).find(
      (pkg) =>
        finding.title?.toLowerCase().includes(pkg.toLowerCase()) ||
        finding.description?.toLowerCase().includes(pkg.toLowerCase())
    );

    if (packageMatch) {
      validated.push({ finding, npmMatch: vulnerabilities[packageMatch] });
    } else {
      unvalidated.push(finding);
    }
  }

  return { validated, unvalidated };
}

function crossReferenceEslint(findings) {
  const codeFindings = findings.filter(
    (f) =>
      !f._parseError &&
      (f.category?.toLowerCase().includes("code") || f.category?.toLowerCase().includes("type"))
  );

  if (codeFindings.length === 0) return { validated: [], unvalidated: [] };

  try {
    // Use stdio config for portability (no shell-specific syntax)
    let output = "";
    try {
      output = execSync("npm run lint", {
        encoding: "utf8",
        cwd: node_path.join(__dirname, ".."),
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err) {
      // lint often exits non-zero; still use its output for matching
      const stdout = err?.stdout ? String(err.stdout) : "";
      const stderr = err?.stderr ? String(err.stderr) : "";
      output = `${stdout}\n${stderr}`.trim();
    }

    const eslintLines = output.split("\n");
    const validated = [];
    const unvalidated = [];

    for (const finding of codeFindings) {
      if (!finding.file) {
        unvalidated.push(finding);
        continue;
      }

      // Check if ESLint also flagged this file
      const hasEslintWarning = eslintLines.some(
        (line) =>
          line.includes(finding.file) && (finding.line ? line.includes(`:${finding.line}`) : true)
      );

      if (hasEslintWarning) {
        validated.push({ finding, eslintMatch: true });
      } else {
        unvalidated.push(finding);
      }
    }

    return { validated, unvalidated };
  } catch {
    console.warn("⚠️  ESLint cross-reference failed");
    return { validated: [], unvalidated: codeFindings };
  }
}

function generateReport(filePath, findings, results, strictS0S1 = false) {
  const { falsePositives, fieldIssues, duplicates, npmCrossRef, eslintCrossRef, s0s1Violations } =
    results;

  console.log("\n" + "=".repeat(80));
  console.log(`AUDIT VALIDATION REPORT: ${node_path.basename(filePath)}`);
  console.log("=".repeat(80) + "\n");

  console.log(`📊 Total Findings: ${findings.filter((f) => !f._parseError).length}`);
  console.log(`   Parse Errors: ${findings.filter((f) => f._parseError).length}`);

  // Severity breakdown
  const bySeverity = findings.reduce((acc, f) => {
    if (!f._parseError) {
      acc[f.severity || "unknown"] = (acc[f.severity || "unknown"] || 0) + 1;
    }
    return acc;
  }, {});
  console.log(
    `   Breakdown: ${Object.entries(bySeverity)
      .map(([k, v]) => `${k}:${v}`)
      .join(", ")}`
  );

  // False Positives
  console.log(`\n🔍 FALSE POSITIVE CHECK (${falsePositives.length} matches)`);
  if (falsePositives.length === 0) {
    console.log("   ✅ No false positives detected");
  } else {
    for (const fp of falsePositives) {
      console.log(`   ⚠️  ${fp.finding.id}: Matches ${fp.falsePositive.id}`);
      console.log(`      Pattern: ${fp.falsePositive.pattern}`);
      console.log(`      Reason: ${fp.falsePositive.reason}`);
    }
  }

  // Field Issues
  console.log(`\n📋 EVIDENCE REQUIREMENTS (${fieldIssues.length} issues)`);
  if (fieldIssues.length === 0) {
    console.log("   ✅ All findings have required fields");
  } else {
    const byType = fieldIssues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
    for (const [type, count] of Object.entries(byType)) {
      console.log(`   ❌ ${type}: ${count} issues`);
    }
    // Show first 5 details
    for (const issue of fieldIssues.slice(0, 5)) {
      console.log(`      - ${issue.findingId || "Line " + issue.line}: ${issue.message}`);
      // For PARSE_ERROR issues, show the raw content to aid debugging
      if (issue.type === "PARSE_ERROR" && issue.raw) {
        const truncated = issue.raw.length > 100 ? issue.raw.slice(0, 100) + "..." : issue.raw;
        console.log(`        Raw: ${truncated}`);
      }
    }
    if (fieldIssues.length > 5) {
      console.log(`      ... and ${fieldIssues.length - 5} more`);
    }
  }

  // Duplicates
  console.log(`\n🔁 DUPLICATE CHECK (${duplicates.length} duplicates)`);
  if (duplicates.length === 0) {
    console.log("   ✅ No duplicates detected");
  } else {
    for (const dup of duplicates) {
      console.log(`   ⚠️  ${dup.duplicate.id} duplicates ${dup.original.id}`);
    }
  }

  // Cross-references
  console.log(`\n🔗 CROSS-REFERENCE VALIDATION`);
  console.log(
    `   npm audit: ${npmCrossRef.validated.length} validated, ${npmCrossRef.unvalidated.length} unvalidated`
  );
  console.log(
    `   ESLint: ${eslintCrossRef.validated.length} validated, ${eslintCrossRef.unvalidated.length} unvalidated`
  );

  // S0/S1 Strict Violations (only if strict mode enabled)
  const s0s1ViolationCount = s0s1Violations?.length || 0;
  if (strictS0S1 && s0s1ViolationCount > 0) {
    console.log(`\n🚨 S0/S1 STRICT VALIDATION (${s0s1ViolationCount} BLOCKING violations)`);
    for (const violation of s0s1Violations) {
      console.log(`   ❌ ${violation.message}`);
    }
    console.log(`\n   ⚠️  These violations BLOCK commit when --strict-s0s1 is enabled.`);
    console.log(`   Fix violations or downgrade severity to S2/S3.`);
  } else if (strictS0S1) {
    console.log(`\n🚨 S0/S1 STRICT VALIDATION`);
    console.log(`   ✅ All S0/S1 findings pass strict validation`);
  }

  // Summary
  const totalIssues = falsePositives.length + fieldIssues.length + duplicates.length;
  const blockingIssues = strictS0S1 ? s0s1ViolationCount : 0;
  console.log("\n" + "=".repeat(80));
  if (blockingIssues > 0) {
    console.log(`❌ VALIDATION FAILED - ${blockingIssues} BLOCKING S0/S1 violations`);
    console.log(`   Standard issues: ${totalIssues}`);
  } else if (totalIssues === 0) {
    console.log("✅ VALIDATION PASSED - No issues found");
  } else {
    console.log(`⚠️  VALIDATION COMPLETED - ${totalIssues} issues to review`);
  }
  console.log("=".repeat(80) + "\n");

  return {
    passed: totalIssues === 0 && blockingIssues === 0,
    blocked: blockingIssues > 0,
    totalFindings: findings.filter((f) => !f._parseError).length,
    falsePositiveCount: falsePositives.length,
    fieldIssueCount: fieldIssues.length,
    duplicateCount: duplicates.length,
    s0s1ViolationCount: s0s1ViolationCount,
  };
}

function findRecentAudits() {
  const audits = [];
  const categories = ["security", "code", "performance", "refactoring", "documentation", "process"];

  for (const category of categories) {
    const categoryDir = node_path.join(AUDITS_DIR, category);
    if (!node_fs.existsSync(categoryDir)) continue;

    const files = node_fs
      .readdirSync(categoryDir)
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => ({
        path: node_path.join(categoryDir, f),
        name: f,
        category,
      }));

    audits.push(...files);
  }

  // Sort by date (newest first)
  return audits.sort((a, b) => b.name.localeCompare(a.name));
}

try {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
validate-audit.js - Validate single-session audit findings

Usage:
  node scripts/validate-audit.js <audit-file.jsonl>
  node scripts/validate-audit.js <audit-file.jsonl> --strict-s0s1
  node scripts/validate-audit.js --all
  node scripts/validate-audit.js --recent [n]

Options:
  --all           Validate all audit files
  --recent [n]    Validate the n most recent audits (default: 5)
  --strict-s0s1   Enable strict S0/S1 validation (BLOCKING mode)
                  Fails with exit code 1 if any S0/S1 findings have:
                  - LOW confidence
                  - MANUAL_ONLY cross_ref
                  - Missing verification_steps
                  - Unconfirmed second_pass
                  - < 2 evidence items
  --help          Show this help
`);
    process.exit(0);
  }

  const strictS0S1 = args.includes("--strict-s0s1");
  if (strictS0S1) {
    console.log("🔒 Strict S0/S1 mode ENABLED - blocking violations will fail validation\n");
  }

  const falsePositiveDb = loadFalsePositives();
  console.log(`📚 Loaded ${falsePositiveDb.length} false positive patterns\n`);

  let filesToValidate = [];

  if (args.includes("--all")) {
    filesToValidate = findRecentAudits();
  } else if (args.includes("--recent")) {
    const idx = args.indexOf("--recent");
    const count = Number.parseInt(args[idx + 1], 10) || 5;
    filesToValidate = findRecentAudits().slice(0, count);
  } else if (args[0]) {
    filesToValidate = [{ path: args[0], name: node_path.basename(args[0]) }];
  } else {
    console.error("Error: Please specify an audit file or use --all/--recent");
    process.exit(1);
  }

  if (filesToValidate.length === 0) {
    console.log("No audit files found to validate");
    process.exit(0);
  }

  let allPassed = true;

  for (const file of filesToValidate) {
    try {
      const findings = loadAuditFindings(file.path);

      const results = {
        falsePositives: checkFalsePositives(findings, falsePositiveDb),
        fieldIssues: validateRequiredFields(findings),
        duplicates: checkDuplicates(findings),
        npmCrossRef: crossReferenceNpmAudit(findings),
        eslintCrossRef: crossReferenceEslint(findings),
        s0s1Violations: strictS0S1 ? validateS0S1Strict(findings) : [],
      };

      const summary = generateReport(file.path, findings, results, strictS0S1);
      if (!summary.passed) allPassed = false;
      // In strict mode, blocking violations cause exit 1
      if (strictS0S1 && summary.blocked) allPassed = false;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Error validating ${file.path}: ${msg}`);
      allPassed = false;
    }
  }

  process.exit(allPassed ? 0 : 1);
} catch (err) {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error("Error:", errMsg);
  process.exit(1);
}
