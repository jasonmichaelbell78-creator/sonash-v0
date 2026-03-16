#!/usr/bin/env node
/* global __dirname */
"use strict";

/**
 * validate-hook-manifest.js — Hook Contract Manifest Validator
 *
 * Validates bi-directional sync between scripts/config/hook-checks.json
 * and the actual .husky/pre-commit and .husky/pre-push hook scripts.
 *
 * Checks:
 * 1. Every manifest check has a corresponding bash check
 * 2. Every bash check has a manifest entry
 * 3. All `command` paths resolve to existing files (for node scripts)
 * 4. All `reads_from` paths exist
 * 5. No duplicate IDs
 *
 * Usage: node scripts/validate-hook-manifest.js
 *
 * Per: PLAN Wave 1 (D14, D24, D32)
 *
 * @module validate-hook-manifest
 */

const fs = require("node:fs");
const path = require("node:path");

// Use sanitizeError from security-helpers (CJS-compatible)
const { sanitizeError } = require("./lib/security-helpers");

const projectDir = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(projectDir, "scripts", "config", "hook-checks.json");
const PRE_COMMIT_PATH = path.join(projectDir, ".husky", "pre-commit");
const PRE_PUSH_PATH = path.join(projectDir, ".husky", "pre-push");

/**
 * Safely read a file with try/catch (avoids existsSync race condition)
 * @param {string} filePath - Path to read
 * @param {string} description - Description for error messages
 * @returns {{success: boolean, content?: string, error?: string}}
 */
function safeReadFile(filePath, description) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return { success: true, content };
  } catch (err) {
    if (err.code === "ENOENT") {
      return { success: false, error: `${description} not found at expected path` };
    }
    return { success: false, error: `Failed to read ${description}: ${sanitizeError(err)}` };
  }
}

/**
 * Extract check identifiers from a hook bash script.
 * Looks for wave/check comments and identifiable check patterns.
 * @param {string} content - Hook file content
 * @param {string} hookType - "pre-commit" or "pre-push"
 * @returns {string[]} - Array of detected check IDs
 */
function extractBashCheckIds(content, hookType) {
  const ids = [];

  if (hookType === "pre-commit") {
    // Map known bash patterns to check IDs
    if (content.includes("gitleaks protect --staged")) ids.push("secrets-scan");
    if (content.includes("npm run lint")) ids.push("eslint");
    if (content.includes("npm test")) ids.push("tests");
    if (content.includes("lint-staged")) ids.push("lint-staged");
    if (content.includes("check-pattern-compliance.js --staged")) ids.push("pattern-compliance");
    if (content.includes("validate-audit.js") && content.includes("--strict-s0s1")) ids.push("audit-s0s1");
    if (content.includes("skills:validate")) ids.push("skill-validation");
    if (content.includes("check-cross-doc-deps.js")) ids.push("cross-doc-deps");
    if (content.includes("docs:index") || content.includes("Documentation Index auto-update")) ids.push("doc-index");
    if (content.includes("check-doc-headers.js")) ids.push("doc-headers");
    if (content.includes("check-agent-compliance.js")) ids.push("agent-compliance");
    if (content.includes("validate-schema.js --staged-only")) ids.push("debt-schema");
    if (content.includes("jsonl-sync") || content.includes("JSONL→MD sync")) ids.push("jsonl-md-sync");
  } else if (hookType === "pre-push") {
    if (content.includes("deps:circular")) ids.push("circular-deps");
    if (content.includes("check-pattern-compliance.js") && content.includes("push diff")) ids.push("pattern-compliance-push");
    if (content.includes("code-reviewer") && content.includes("agent-invocations.jsonl")) ids.push("code-reviewer-gate");
    if (content.includes("check-propagation.js")) ids.push("propagation");
    if (content.includes("hooks:test")) ids.push("hook-tests");
    if (content.includes("security-check.js") && content.includes("--blocking")) ids.push("security-check");
    if (content.includes("tsc --noEmit")) ids.push("type-check");
    if (content.includes("complexity:") || content.includes("Cyclomatic complexity")) ids.push("cyclomatic-cc");
    if (content.includes("check-cc.js")) ids.push("cognitive-cc");
    if (content.includes("npm audit")) ids.push("npm-audit");
    if (content.includes("triggers:check")) ids.push("triggers");
  }

  return ids;
}

/**
 * Check if a command path resolves to an existing file.
 * Only validates node script paths and npm commands, not inline/binary checks.
 * @param {string} command - The command string from the manifest
 * @returns {{valid: boolean, error?: string}}
 */
function validateCommandPath(command) {
  // Skip inline checks, binary commands, npm/npx commands
  if (command.startsWith("inline ")) return { valid: true };
  if (command.startsWith("npm ")) return { valid: true };
  if (command.startsWith("npx ")) return { valid: true };
  if (command.startsWith("gitleaks ")) return { valid: true };

  // Extract the script path from "node scripts/..." commands
  const nodeMatch = command.match(/^node\s+(\S+)/);
  if (nodeMatch) {
    const scriptPath = path.join(projectDir, nodeMatch[1]);
    try {
      fs.accessSync(scriptPath, fs.constants.R_OK);
      return { valid: true };
    } catch {
      return { valid: false, error: `Script not found: ${nodeMatch[1]}` };
    }
  }

  return { valid: true };
}

/**
 * Validate that reads_from paths exist.
 * @param {string[]} paths - Array of paths to validate
 * @returns {string[]} - Array of missing paths
 */
function validateReadPaths(paths) {
  const missing = [];
  for (const p of paths) {
    const fullPath = path.join(projectDir, p);
    try {
      fs.accessSync(fullPath, fs.constants.R_OK);
    } catch {
      missing.push(p);
    }
  }
  return missing;
}

/**
 * Main validation function
 * @returns {{passed: boolean, errors: string[], warnings: string[], summary: string}}
 */
function validate() {
  const errors = [];
  const warnings = [];

  // --- 1. Read manifest ---
  const manifestResult = safeReadFile(MANIFEST_PATH, "Hook manifest (scripts/config/hook-checks.json)");
  if (!manifestResult.success) {
    return { passed: false, errors: [manifestResult.error], warnings: [], summary: "Hook manifest not found" };
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestResult.content);
  } catch (err) {
    return { passed: false, errors: [`Invalid JSON in hook manifest: ${sanitizeError(err)}`], warnings: [], summary: "Hook manifest is invalid JSON" };
  }

  if (!manifest.checks || !Array.isArray(manifest.checks)) {
    return { passed: false, errors: ["Manifest missing 'checks' array"], warnings: [], summary: "Hook manifest has invalid structure" };
  }

  // --- 2. Read hook files ---
  const preCommitResult = safeReadFile(PRE_COMMIT_PATH, ".husky/pre-commit");
  if (!preCommitResult.success) {
    errors.push(preCommitResult.error);
  }

  const prePushResult = safeReadFile(PRE_PUSH_PATH, ".husky/pre-push");
  if (!prePushResult.success) {
    errors.push(prePushResult.error);
  }

  if (errors.length > 0 && (!preCommitResult.success || !prePushResult.success)) {
    return { passed: false, errors, warnings, summary: "Could not read hook files" };
  }

  // --- 3. Check for duplicate IDs ---
  const ids = manifest.checks.map((c) => c.id);
  const seen = new Set();
  const duplicates = [];
  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  }
  if (duplicates.length > 0) {
    errors.push(`Duplicate check IDs: ${duplicates.join(", ")}`);
  }

  // --- 4. Bi-directional validation: manifest -> bash ---
  const preCommitManifestIds = manifest.checks.filter((c) => c.hook === "pre-commit").map((c) => c.id);
  const prePushManifestIds = manifest.checks.filter((c) => c.hook === "pre-push").map((c) => c.id);

  const preCommitBashIds = preCommitResult.success
    ? extractBashCheckIds(preCommitResult.content, "pre-commit")
    : [];
  const prePushBashIds = prePushResult.success
    ? extractBashCheckIds(prePushResult.content, "pre-push")
    : [];

  // Manifest checks missing from bash
  for (const id of preCommitManifestIds) {
    if (!preCommitBashIds.includes(id)) {
      errors.push(`Manifest check '${id}' (pre-commit) not found in .husky/pre-commit`);
    }
  }
  for (const id of prePushManifestIds) {
    if (!prePushBashIds.includes(id)) {
      errors.push(`Manifest check '${id}' (pre-push) not found in .husky/pre-push`);
    }
  }

  // Bash checks missing from manifest
  for (const id of preCommitBashIds) {
    if (!preCommitManifestIds.includes(id)) {
      errors.push(`Bash check '${id}' in .husky/pre-commit not registered in manifest`);
    }
  }
  for (const id of prePushBashIds) {
    if (!prePushManifestIds.includes(id)) {
      errors.push(`Bash check '${id}' in .husky/pre-push not registered in manifest`);
    }
  }

  // --- 5. Validate command paths ---
  for (const check of manifest.checks) {
    const result = validateCommandPath(check.command);
    if (!result.valid) {
      errors.push(`Check '${check.id}': ${result.error}`);
    }
  }

  // --- 6. Validate reads_from paths ---
  for (const check of manifest.checks) {
    if (check.reads_from && check.reads_from.length > 0) {
      const missing = validateReadPaths(check.reads_from);
      for (const p of missing) {
        warnings.push(`Check '${check.id}': reads_from path not found: ${p}`);
      }
    }
  }

  // --- 7. Validate required fields ---
  const requiredFields = ["id", "name", "description", "hook", "command", "blocking", "category", "owner"];
  for (const check of manifest.checks) {
    for (const field of requiredFields) {
      if (check[field] === undefined || check[field] === null) {
        errors.push(`Check '${check.id}': missing required field '${field}'`);
      }
    }
    // Validate blocking enum
    if (check.blocking && !["block", "warn", "auto-fix"].includes(check.blocking)) {
      errors.push(`Check '${check.id}': invalid blocking value '${check.blocking}' (must be block|warn|auto-fix)`);
    }
    // Validate hook enum
    if (check.hook && !["pre-commit", "pre-push"].includes(check.hook)) {
      errors.push(`Check '${check.id}': invalid hook value '${check.hook}' (must be pre-commit|pre-push)`);
    }
    // Validate category enum
    if (check.category && !["security", "quality", "compliance", "docs", "testing"].includes(check.category)) {
      errors.push(`Check '${check.id}': invalid category '${check.category}'`);
    }
  }

  // --- Summary ---
  const totalChecks = manifest.checks.length;
  const preCommitCount = preCommitManifestIds.length;
  const prePushCount = prePushManifestIds.length;
  const passed = errors.length === 0;

  const summary = passed
    ? `Hook manifest: ${totalChecks} checks registered (${preCommitCount} pre-commit, ${prePushCount} pre-push), all validated`
    : `Hook manifest: ${totalChecks} checks registered, ${errors.length} error(s) found`;

  return { passed, errors, warnings, summary };
}

// --- Main ---
if (require.main === module) {
  const result = validate();

  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      console.warn(`  ⚠️  ${w}`);
    }
  }

  if (result.errors.length > 0) {
    for (const e of result.errors) {
      console.error(`  ❌ ${e}`);
    }
  }

  console.log(result.summary);
  process.exit(result.passed ? 0 : 1);
}

module.exports = { validate };
