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
 * Pattern-to-ID mapping for pre-commit hook checks.
 * Each entry: { patterns: string[], allRequired: boolean, id: string }
 *   - patterns: substrings to search for in hook content
 *   - allRequired: if true, ALL patterns must match; if false, ANY pattern matches
 */
const PRE_COMMIT_PATTERNS = [
  { patterns: ["gitleaks protect --staged"], allRequired: true, id: "secrets-scan" },
  { patterns: ["npm run lint"], allRequired: true, id: "eslint" },
  { patterns: ["npm test"], allRequired: true, id: "tests" },
  { patterns: ["lint-staged"], allRequired: true, id: "lint-staged" },
  {
    patterns: ["check-pattern-compliance.js --staged"],
    allRequired: true,
    id: "pattern-compliance",
  },
  { patterns: ["validate-audit.js", "--strict-s0s1"], allRequired: true, id: "audit-s0s1" },
  { patterns: ["skills:validate"], allRequired: true, id: "skill-validation" },
  { patterns: ["check-cross-doc-deps.js"], allRequired: true, id: "cross-doc-deps" },
  {
    patterns: ["docs:index", "Documentation Index auto-update"],
    allRequired: false,
    id: "doc-index",
  },
  { patterns: ["check-doc-headers.js"], allRequired: true, id: "doc-headers" },
  { patterns: ["check-agent-compliance.js"], allRequired: true, id: "agent-compliance" },
  { patterns: ["validate-schema.js --staged-only"], allRequired: true, id: "debt-schema" },
  { patterns: ["jsonl-sync", "JSONL\u2192MD sync"], allRequired: false, id: "jsonl-md-sync" },
];

/**
 * Pattern-to-ID mapping for pre-push hook checks.
 */
const PRE_PUSH_PATTERNS = [
  { patterns: ["escalation-gate", "hook-warnings.json"], allRequired: true, id: "escalation-gate" },
  { patterns: ["deps:circular"], allRequired: true, id: "circular-deps" },
  {
    patterns: ["check-pattern-compliance.js", "push diff"],
    allRequired: true,
    id: "pattern-compliance-push",
  },
  {
    patterns: ["code-reviewer", "agent-invocations.jsonl"],
    allRequired: true,
    id: "code-reviewer-gate",
  },
  { patterns: ["check-propagation.js"], allRequired: true, id: "propagation" },
  { patterns: ["hooks:test"], allRequired: true, id: "hook-tests" },
  { patterns: ["security-check.js", "--blocking"], allRequired: true, id: "security-check" },
  { patterns: ["tsc --noEmit"], allRequired: true, id: "type-check" },
  { patterns: ["complexity:", "Cyclomatic complexity"], allRequired: false, id: "cyclomatic-cc" },
  { patterns: ["check-cc.js"], allRequired: true, id: "cognitive-cc" },
  { patterns: ["npm audit"], allRequired: true, id: "npm-audit" },
  { patterns: ["triggers:check"], allRequired: true, id: "triggers" },
];

/**
 * Test whether content matches a pattern rule.
 * @param {string} content - Hook file content
 * @param {{patterns: string[], allRequired: boolean}} rule - Pattern rule
 * @returns {boolean}
 */
function matchesPatternRule(content, rule) {
  if (rule.allRequired) {
    return rule.patterns.every((p) => content.includes(p));
  }
  return rule.patterns.some((p) => content.includes(p));
}

/**
 * Extract check identifiers from a hook bash script.
 * Looks for wave/check comments and identifiable check patterns.
 * @param {string} content - Hook file content
 * @param {string} hookType - "pre-commit" or "pre-push"
 * @returns {string[]} - Array of detected check IDs
 */
function extractBashCheckIds(content, hookType) {
  const patternMap = hookType === "pre-commit" ? PRE_COMMIT_PATTERNS : PRE_PUSH_PATTERNS;
  const ids = [];
  for (const rule of patternMap) {
    if (matchesPatternRule(content, rule)) {
      ids.push(rule.id);
    }
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
 * Load and parse the manifest file. Returns { manifest, error } where
 * error is a result object if loading failed, or null on success.
 */
function loadManifest() {
  const manifestResult = safeReadFile(
    MANIFEST_PATH,
    "Hook manifest (scripts/config/hook-checks.json)"
  );
  if (!manifestResult.success) {
    return {
      manifest: null,
      error: {
        passed: false,
        errors: [manifestResult.error],
        warnings: [],
        summary: "Hook manifest not found",
      },
    };
  }

  try {
    const manifest = JSON.parse(manifestResult.content);
    if (!manifest.checks || !Array.isArray(manifest.checks)) {
      return {
        manifest: null,
        error: {
          passed: false,
          errors: ["Manifest missing 'checks' array"],
          warnings: [],
          summary: "Hook manifest has invalid structure",
        },
      };
    }
    return { manifest, error: null };
  } catch (err) {
    return {
      manifest: null,
      error: {
        passed: false,
        errors: [`Invalid JSON in hook manifest: ${sanitizeError(err)}`],
        warnings: [],
        summary: "Hook manifest is invalid JSON",
      },
    };
  }
}

/**
 * Find duplicate IDs in manifest checks.
 * @param {Array} checks - manifest.checks array
 * @returns {string[]} - duplicate IDs
 */
function findDuplicateIds(checks) {
  const seen = new Set();
  const duplicates = [];
  for (const check of checks) {
    if (!check || !check.id) continue;
    if (seen.has(check.id)) duplicates.push(check.id);
    seen.add(check.id);
  }
  return duplicates;
}

/**
 * Validate bi-directional sync between manifest IDs and bash script IDs.
 * Pushes errors for any mismatches.
 */
function validateBidirectionalSync(manifestIds, bashIds, hookType, hookFile, errors) {
  for (const id of manifestIds) {
    if (!bashIds.includes(id)) {
      errors.push(`Manifest check '${id}' (${hookType}) not found in ${hookFile}`);
    }
  }
  for (const id of bashIds) {
    if (!manifestIds.includes(id)) {
      errors.push(`Bash check '${id}' in ${hookFile} not registered in manifest`);
    }
  }
}

/**
 * Validate required fields and enum values for each manifest check.
 */
function validateCheckFields(checks, errors) {
  const requiredFields = [
    "id",
    "name",
    "description",
    "hook",
    "command",
    "blocking",
    "category",
    "owner",
  ];
  for (const check of checks) {
    for (const field of requiredFields) {
      if (check[field] === undefined || check[field] === null) {
        errors.push(`Check '${check.id}': missing required field '${field}'`);
      }
    }
    validateCheckEnums(check, errors);
  }
}

/**
 * Validate enum field values for a single check entry.
 */
function validateCheckEnums(check, errors) {
  if (
    typeof check.blocking !== "string" ||
    !["block", "warn", "auto-fix"].includes(check.blocking)
  ) {
    errors.push(
      `Check '${check.id}': invalid blocking value '${check.blocking}' (must be block|warn|auto-fix)`
    );
  }
  if (typeof check.hook !== "string" || !["pre-commit", "pre-push"].includes(check.hook)) {
    errors.push(
      `Check '${check.id}': invalid hook value '${check.hook}' (must be pre-commit|pre-push)`
    );
  }
  if (
    typeof check.category !== "string" ||
    !["security", "quality", "compliance", "docs", "testing"].includes(check.category)
  ) {
    errors.push(`Check '${check.id}': invalid category '${check.category}'`);
  }
}

/**
 * Validate command paths and reads_from paths for all checks.
 */
function validatePaths(checks, errors, warnings) {
  for (const check of checks) {
    const result = validateCommandPath(check.command);
    if (!result.valid) {
      errors.push(`Check '${check.id}': ${result.error}`);
    }
    if (check.reads_from && check.reads_from.length > 0) {
      const missing = validateReadPaths(check.reads_from);
      for (const p of missing) {
        warnings.push(`Check '${check.id}': reads_from path not found: ${p}`);
      }
    }
  }
}

/**
 * Main validation function
 * @returns {{passed: boolean, errors: string[], warnings: string[], summary: string}}
 */
function validate() {
  const errors = [];
  const warnings = [];

  // --- 1. Read and parse manifest ---
  const { manifest, error: loadError } = loadManifest();
  if (loadError) return loadError;

  // --- 2. Read hook files ---
  const preCommitResult = safeReadFile(PRE_COMMIT_PATH, ".husky/pre-commit");
  if (!preCommitResult.success) errors.push(preCommitResult.error);

  const prePushResult = safeReadFile(PRE_PUSH_PATH, ".husky/pre-push");
  if (!prePushResult.success) errors.push(prePushResult.error);

  if (errors.length > 0 && (!preCommitResult.success || !prePushResult.success)) {
    return { passed: false, errors, warnings, summary: "Could not read hook files" };
  }

  // --- 3. Check for duplicate IDs ---
  const duplicates = findDuplicateIds(manifest.checks);
  if (duplicates.length > 0) {
    errors.push(`Duplicate check IDs: ${duplicates.join(", ")}`);
  }

  // --- 4. Bi-directional validation ---
  const preCommitManifestIds = manifest.checks
    .filter((c) => c.hook === "pre-commit")
    .map((c) => c.id);
  const prePushManifestIds = manifest.checks.filter((c) => c.hook === "pre-push").map((c) => c.id);
  const preCommitBashIds = preCommitResult.success
    ? extractBashCheckIds(preCommitResult.content, "pre-commit")
    : [];
  const prePushBashIds = prePushResult.success
    ? extractBashCheckIds(prePushResult.content, "pre-push")
    : [];

  validateBidirectionalSync(
    preCommitManifestIds,
    preCommitBashIds,
    "pre-commit",
    ".husky/pre-commit",
    errors
  );
  validateBidirectionalSync(
    prePushManifestIds,
    prePushBashIds,
    "pre-push",
    ".husky/pre-push",
    errors
  );

  // --- 5. Validate paths ---
  validatePaths(manifest.checks, errors, warnings);

  // --- 6. Validate required fields and enums ---
  validateCheckFields(manifest.checks, errors);

  // --- Summary ---
  const totalChecks = manifest.checks.length;
  const passed = errors.length === 0;
  const summary = passed
    ? `Hook manifest: ${totalChecks} checks registered (${preCommitManifestIds.length} pre-commit, ${prePushManifestIds.length} pre-push), all validated`
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
