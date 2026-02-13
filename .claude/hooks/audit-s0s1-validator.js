#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * audit-s0s1-validator.js - PostToolUse hook for audit S0/S1 validation
 * Session #98: Real-time validation of S0/S1 audit findings
 *
 * Triggers on Write operations to docs/audits JSONL files
 * Validates S0/S1 findings have proper verification_steps
 *
 * Phase 1 (current): WARN mode - non-blocking warnings
 * Phase 2+: BLOCK mode - blocking violations
 */

const fs = require("node:fs");
const path = require("node:path");

// Rollout mode: WARN = non-blocking, BLOCK = blocking
// Can be overridden via environment variable for gradual rollout (Review #198)
// Review #204: Normalize to handle "block", "BLOCK ", etc.
const ROLLOUT_MODE = (process.env.AUDIT_S0S1_MODE || "WARN").trim().toUpperCase();
const EFFECTIVE_MODE = ROLLOUT_MODE === "BLOCK" ? "BLOCK" : "WARN";

// Valid verification methods (match validate-audit.js)
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

/**
 * Parse file path from hook arguments
 */
function parseFilePath(arg) {
  if (!arg) return "";

  try {
    const parsed = JSON.parse(arg);
    return parsed.file_path || "";
  } catch {
    return arg;
  }
}

/**
 * Check if file path matches audit JSONL pattern
 * Review #204: Reject path traversal attempts (../ segments)
 */
function isAuditFile(filePath) {
  if (!filePath) return false;
  // Normalize to forward slashes
  const normalized = filePath.replace(/\\/g, "/");
  // Reject path traversal attempts - check for ../ or /.. patterns
  if (/(?:^|\/)\.\.[/\\]|(?:^|[/\\])\.\.$/.test(normalized)) {
    return false;
  }
  return /^docs\/audits\/[^.][^/]*\.jsonl$|^docs\/audits\/[^.][^/]*\/[^.][^/]*\.jsonl$/.test(
    normalized
  );
}

/**
 * Parse JSONL content and extract findings
 * Review #204: Track parse errors to prevent S0/S1 evasion via malformed lines
 */
function parseJSONLContent(content) {
  const findings = [];
  const lines = content.split("\n").filter((line) => line.trim());

  for (let i = 0; i < lines.length; i++) {
    try {
      const finding = JSON.parse(lines[i]);
      findings.push({ ...finding, _lineNumber: i + 1 });
    } catch {
      // Mark parse errors so validation can detect potential evasion
      findings.push({ _parseError: true, _lineNumber: i + 1, _rawLine: lines[i].slice(0, 100) });
    }
  }

  return findings;
}

/**
 * Validate S0/S1 findings with strict requirements
 */
function validateS0S1Findings(findings) {
  const violations = [];

  const s0s1Findings = findings.filter((f) => f.severity === "S0" || f.severity === "S1");

  for (const finding of s0s1Findings) {
    const prefix = `${finding.id || "unknown"} (${finding.severity})`;

    // Check 1: LOW confidence
    if (finding.confidence === "LOW") {
      violations.push({
        type: "LOW_CONFIDENCE",
        message: `${prefix}: LOW confidence not allowed for S0/S1`,
      });
    }

    // Check 2: MANUAL_ONLY
    if (finding.cross_ref === "MANUAL_ONLY") {
      violations.push({
        type: "MANUAL_ONLY",
        message: `${prefix}: MANUAL_ONLY not allowed for S0/S1`,
      });
    }

    // Check 3: Missing verification_steps
    if (!finding.verification_steps) {
      violations.push({
        type: "MISSING_VERIFICATION",
        message: `${prefix}: Missing verification_steps`,
      });
      continue;
    }

    const vs = finding.verification_steps;

    // Check 4: Validate first_pass
    if (!vs.first_pass) {
      violations.push({
        type: "MISSING_FIRST_PASS",
        message: `${prefix}: Missing first_pass`,
      });
    } else {
      if (!VALID_FIRST_PASS_METHODS.has(vs.first_pass.method)) {
        violations.push({
          type: "INVALID_METHOD",
          message: `${prefix}: Invalid first_pass.method`,
        });
      }
      if (
        !Array.isArray(vs.first_pass.evidence_collected) ||
        vs.first_pass.evidence_collected.length < 1
      ) {
        violations.push({
          type: "NO_EVIDENCE",
          message: `${prefix}: Empty first_pass.evidence_collected`,
        });
      }
    }

    // Check 5: Validate second_pass
    if (!vs.second_pass) {
      violations.push({
        type: "MISSING_SECOND_PASS",
        message: `${prefix}: Missing second_pass`,
      });
    } else {
      if (!VALID_SECOND_PASS_METHODS.has(vs.second_pass.method)) {
        violations.push({
          type: "INVALID_METHOD",
          message: `${prefix}: Invalid second_pass.method`,
        });
      }
      if (vs.second_pass.confirmed !== true) {
        violations.push({
          type: "NOT_CONFIRMED",
          message: `${prefix}: second_pass.confirmed must be true`,
        });
      }
    }

    // Check 6: Validate tool_confirmation
    if (!vs.tool_confirmation) {
      violations.push({
        type: "MISSING_TOOL_CONFIRMATION",
        message: `${prefix}: Missing tool_confirmation`,
      });
    } else {
      if (!VALID_TOOL_CONFIRMATIONS.has(vs.tool_confirmation.tool)) {
        violations.push({
          type: "INVALID_TOOL",
          message: `${prefix}: Invalid tool_confirmation.tool`,
        });
      }
      if (!vs.tool_confirmation.reference?.trim()) {
        violations.push({
          type: "NO_REFERENCE",
          message: `${prefix}: Missing tool_confirmation.reference`,
        });
      }
    }

    // Check 7: Evidence < 2 items
    if (!Array.isArray(finding.evidence) || finding.evidence.length < 2) {
      violations.push({
        type: "INSUFFICIENT_EVIDENCE",
        message: `${prefix}: Need >= 2 evidence items`,
      });
    }
  }

  return violations;
}

/**
 * Main hook execution
 */
function main() {
  const arg = process.argv[2] || "";

  // FAST PATH (OPT-H008): Skip JSON parsing entirely if arg doesn't contain
  // audit path markers. Saves ~10-15ms on ~99% of Write operations.
  if (!arg.includes("docs/audits") || !arg.includes(".jsonl")) {
    console.log("ok");
    process.exit(0);
  }

  const filePath = parseFilePath(arg);

  // Only validate audit JSONL files
  if (!isAuditFile(filePath)) {
    console.log("ok");
    process.exit(0);
  }

  // Get project directory - validate absolute path
  // Review #204: Path traversal protection
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  if (!path.isAbsolute(projectDir)) {
    console.log("ok"); // Invalid config, skip validation
    process.exit(0);
  }
  const fullPath = path.resolve(projectDir, filePath.replace(/\\/g, "/"));

  // Containment check: resolved path must be within projectDir
  // Review #204 R3: Use regex to avoid false positives (e.g., "..hidden.md")
  const relative = path.relative(projectDir, fullPath);
  // relative === "" means fullPath === projectDir (invalid for a file)
  // /^\.\.(?:[/\\]|$)/ catches ".." and "../" but not "..hidden.md"
  // path.isAbsolute catches different drives on Windows
  const isOutsideProject =
    relative === "" || /^\.\.(?:[/\\]|$)/.test(relative) || path.isAbsolute(relative);
  if (isOutsideProject) {
    console.error("Path traversal attempt blocked");
    process.exit(1);
  }

  // Reject symlinks to prevent traversal via symlink
  try {
    const stats = fs.lstatSync(fullPath);
    if (stats.isSymbolicLink()) {
      console.error("Symlink files not allowed");
      process.exit(1);
    }
  } catch {
    // File doesn't exist yet - skip validation
    console.log("ok");
    process.exit(0);
  }

  // Read file content
  let content;
  try {
    content = fs.readFileSync(fullPath, "utf8");
  } catch {
    // File doesn't exist yet or can't be read - skip validation
    console.log("ok");
    process.exit(0);
  }

  // Parse and validate
  const findings = parseJSONLContent(content);
  const s0s1Count = findings.filter((f) => f.severity === "S0" || f.severity === "S1").length;

  // Skip if no S0/S1 findings
  if (s0s1Count === 0) {
    console.log("ok");
    process.exit(0);
  }

  const violations = validateS0S1Findings(findings);

  if (violations.length > 0) {
    console.error("");
    console.error("\u26a0\ufe0f  S0/S1 AUDIT VALIDATION");
    console.error("\u2501".repeat(28));
    console.error(`Found ${violations.length} issue(s) in ${s0s1Count} S0/S1 finding(s):\n`);

    // Show first 5 violations
    for (const v of violations.slice(0, 5)) {
      console.error(`   \u274c ${v.message}`);
    }
    if (violations.length > 5) {
      console.error(`   ... and ${violations.length - 5} more`);
    }

    console.error("");
    console.error("S0/S1 findings require verification_steps. See:");
    console.error("  docs/templates/JSONL_SCHEMA_STANDARD.md#s0s1-verification-extension");
    console.error("\u2501".repeat(28));

    if (EFFECTIVE_MODE === "BLOCK") {
      // Blocking mode - fail the hook
      process.exit(1);
    }
    // Warn mode - non-blocking
  }

  console.log("ok");
  process.exit(0);
}

main();
