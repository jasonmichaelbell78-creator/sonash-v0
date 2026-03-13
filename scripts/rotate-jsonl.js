#!/usr/bin/env node
/* global __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * rotate-jsonl.js — Unified JSONL rotation per config/rotation-policy.json
 * Part of Data Effectiveness Audit (Wave 0.2)
 *
 * Reads the declarative rotation policy and applies age-based expiration
 * to each non-permanent tier using the shared expireJsonlByAge() helper.
 *
 * Idempotent: running twice with unchanged data produces identical results.
 * Exit 0 on success, non-zero on validation failure.
 */

const fs = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// Project root (one level up from scripts/)
// ---------------------------------------------------------------------------
const projectRoot = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Load helpers with graceful fallbacks
// ---------------------------------------------------------------------------
let expireJsonlByAge;
try {
  ({ expireJsonlByAge } = require(
    path.resolve(projectRoot, ".claude", "hooks", "lib", "rotate-state.js")
  ));
} catch {
  process.stderr.write("[rotate-jsonl] FATAL: rotate-state.js not found\n");
  process.exit(1);
}

let sanitizeError;
try {
  ({ sanitizeError } = require(path.resolve(projectRoot, "scripts", "lib", "security-helpers.js")));
} catch {
  // Inline fallback: strip paths but keep the message useful
  sanitizeError = (err) => {
    const msg = err instanceof Error ? err.message : String(err);
    // regex patterns required for case-insensitive matching — replaceAll not applicable
    return msg
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]")
      .replace(/\/Users\/[^/\s]+/gi, "[HOME]");
  };
}

let isSafeToWrite;
try {
  ({ isSafeToWrite } = require(
    path.resolve(projectRoot, ".claude", "hooks", "lib", "symlink-guard.js")
  ));
} catch {
  // Fallback: allow writes unless we detect an obvious symlink
  isSafeToWrite = (filePath) => {
    try {
      if (!path.isAbsolute(filePath)) return false;
      if (fs.existsSync(filePath) && fs.lstatSync(filePath).isSymbolicLink()) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };
}

// ---------------------------------------------------------------------------
// Timestamp field resolution
// ---------------------------------------------------------------------------

/**
 * Known timestamp field names per file basename.
 * Most JSONL files use "timestamp"; some use "date".
 * When a file is not listed here, we try "timestamp" then "date".
 */
const KNOWN_DATE_FIELDS = {
  "reviews.jsonl": "date",
  "retros.jsonl": "date",
  "review-metrics.jsonl": "timestamp",
  "velocity-log.jsonl": "date",
};

/**
 * Detect the timestamp field name for a given JSONL file.
 * 1. Check the known-fields map.
 * 2. Read the first parseable line and check for "timestamp" then "date".
 * 3. Default to "timestamp".
 *
 * @param {string} absPath - Absolute path to the JSONL file
 * @returns {string} Field name to use
 */
function detectTimestampField(absPath) {
  const basename = path.basename(absPath);
  if (KNOWN_DATE_FIELDS[basename]) {
    return KNOWN_DATE_FIELDS[basename];
  }

  // Probe the first line of the file (read only first 64KB to avoid loading large files)
  try {
    const fd = fs.openSync(absPath, "r");
    try {
      const buf = Buffer.alloc(65536);
      const bytesRead = fs.readSync(fd, buf, 0, buf.length, 0);
      const chunk = buf.toString("utf-8", 0, bytesRead);
      const firstLine = chunk.split("\n").find((l) => l.trim().length > 0);
      if (firstLine) {
        const entry = JSON.parse(firstLine);
        if (entry.timestamp !== undefined) return "timestamp";
        if (entry.date !== undefined) return "date";
      }
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    // File missing or unparseable — fall through to default
  }

  return "timestamp";
}

// ---------------------------------------------------------------------------
// Config validation
// ---------------------------------------------------------------------------

/**
 * Validate a single file path entry within a tier.
 * @param {string} tierName
 * @param {unknown} file
 * @returns {string[]} Array of error messages (empty if valid)
 */
function validateFilePath(tierName, file) {
  const errors = [];
  if (typeof file !== "string" || file.trim().length === 0) {
    errors.push(`Tier '${tierName}': each file entry must be a non-empty string`);
  }
  // Reject path traversal attempts
  if (/^\.\.(?:[\\/]|$)/.test(file) || path.isAbsolute(file)) {
    errors.push(`Tier '${tierName}': file path '${file}' must be relative and non-traversing`);
  }
  return errors;
}

/**
 * Validate a single tier entry in the config.
 * @param {string} tierName
 * @param {unknown} tier
 * @returns {string[]} Array of error messages (empty if valid)
 */
function validateTierEntry(tierName, tier) {
  const errors = [];

  if (!tier || typeof tier !== "object") {
    errors.push(`Tier '${tierName}' must be an object`);
    return errors;
  }

  // maxAgeDays must be a positive number or null (permanent)
  if (tier.maxAgeDays !== null) {
    if (typeof tier.maxAgeDays !== "number" || tier.maxAgeDays <= 0) {
      errors.push(`Tier '${tierName}': maxAgeDays must be a positive number or null`);
    }
  }

  if (!Array.isArray(tier.files)) {
    errors.push(`Tier '${tierName}': 'files' must be an array`);
    return errors;
  }

  for (const file of tier.files) {
    errors.push(...validateFilePath(tierName, file));
  }

  return errors;
}

/**
 * Validate the rotation policy config structure.
 * @param {unknown} config
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateConfig(config) {
  const errors = [];

  if (!config || typeof config !== "object") {
    return { valid: false, errors: ["Config must be a JSON object"] };
  }

  if (config.schema_version !== 1) {
    errors.push(`Unsupported schema_version: ${config.schema_version} (expected 1)`);
  }

  if (!config.tiers || typeof config.tiers !== "object") {
    errors.push("Missing or invalid 'tiers' object");
    return { valid: false, errors };
  }

  for (const [tierName, tier] of Object.entries(config.tiers)) {
    errors.push(...validateTierEntry(tierName, tier));
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Main rotation logic
// ---------------------------------------------------------------------------

/**
 * Load and parse the rotation policy config from disk.
 * @returns {{ config: object|null, error: string|null }}
 */
function loadConfig() {
  const configPath = path.resolve(projectRoot, "config", "rotation-policy.json");
  try {
    const configContent = fs.readFileSync(configPath, "utf-8");
    return { config: JSON.parse(configContent), error: null };
  } catch (err) {
    return { config: null, error: sanitizeError(err) };
  }
}

/**
 * Process a single file for rotation within a tier.
 * @param {string} relFile - Relative file path from project root
 * @param {string} tierName - Name of the tier
 * @param {number} maxAgeDays - Maximum age in days for entries
 * @returns {{ entry: object, isError: boolean }}
 */
function processFile(relFile, tierName, maxAgeDays) {
  const absPath = path.resolve(projectRoot, relFile);

  // Check file exists (skip silently if missing — idempotent)
  try {
    fs.accessSync(absPath, fs.constants.R_OK);
  } catch {
    return {
      entry: {
        file: relFile,
        tier: tierName,
        status: "skipped",
        reason: "file not found",
        removed: 0,
      },
      isError: false,
    };
  }

  // Symlink safety check
  if (!isSafeToWrite(absPath)) {
    return {
      entry: {
        file: relFile,
        tier: tierName,
        status: "skipped",
        reason: "symlink safety check failed",
        removed: 0,
      },
      isError: false,
    };
  }

  // Detect timestamp field and run expiration
  const tsField = detectTimestampField(absPath);
  try {
    const result = expireJsonlByAge(absPath, maxAgeDays, tsField);
    const removed = result.before - result.after;
    return {
      entry: {
        file: relFile,
        tier: tierName,
        status: result.expired ? "rotated" : "unchanged",
        reason: null,
        before: result.before,
        after: result.after,
        removed,
        timestampField: tsField,
      },
      isError: false,
    };
  } catch (err) {
    return {
      entry: {
        file: relFile,
        tier: tierName,
        status: "error",
        reason: sanitizeError(err),
        removed: 0,
      },
      isError: true,
    };
  }
}

/**
 * Run JSONL rotation for all eligible tiers.
 * @returns {{ success: boolean, summary: object[] }}
 */
function runRotation() {
  // 1. Load config
  const { config: rawConfig, error: loadError } = loadConfig();
  if (loadError) {
    process.stderr.write(`[rotate-jsonl] Failed to load config: ${loadError}\n`);
    return { success: false, summary: [] };
  }

  // 2. Validate config
  const validation = validateConfig(rawConfig);
  if (!validation.valid) {
    process.stderr.write(`[rotate-jsonl] Config validation failed:\n`);
    for (const e of validation.errors) {
      process.stderr.write(`  - ${e}\n`);
    }
    return { success: false, summary: [] };
  }

  // 3. Process each tier
  const summary = [];
  let hasErrors = false;

  for (const [tierName, tier] of Object.entries(rawConfig.tiers)) {
    // Skip permanent tier
    if (tier.maxAgeDays === null) {
      continue;
    }

    for (const relFile of tier.files) {
      const { entry, isError } = processFile(relFile, tierName, tier.maxAgeDays);
      summary.push(entry);
      if (isError) hasErrors = true;
    }
  }

  return { success: !hasErrors, summary };
}

// ---------------------------------------------------------------------------
// Output & entry point
// ---------------------------------------------------------------------------

function printSummary(summary) {
  if (summary.length === 0) {
    process.stdout.write("[rotate-jsonl] No files to process.\n");
    return;
  }

  process.stdout.write("[rotate-jsonl] Rotation summary:\n");

  for (const entry of summary) {
    const removed = entry.removed || 0;
    if (entry.status === "rotated") {
      process.stdout.write(
        `  [${entry.tier}] ${entry.file}: ${removed} entries removed (${entry.before} -> ${entry.after}, field: ${entry.timestampField})\n`
      );
    } else if (entry.status === "unchanged") {
      process.stdout.write(
        `  [${entry.tier}] ${entry.file}: unchanged (${entry.before} entries, all within ${entry.tier} window)\n`
      );
    } else if (entry.status === "skipped") {
      process.stdout.write(`  [${entry.tier}] ${entry.file}: skipped (${entry.reason})\n`);
    } else if (entry.status === "error") {
      process.stderr.write(`  [${entry.tier}] ${entry.file}: ERROR — ${entry.reason}\n`);
    }
  }

  const rotated = summary.filter((s) => s.status === "rotated").length;
  const unchanged = summary.filter((s) => s.status === "unchanged").length;
  const skipped = summary.filter((s) => s.status === "skipped").length;
  const errored = summary.filter((s) => s.status === "error").length;
  const totalRemoved = summary.reduce((sum, s) => sum + (s.removed || 0), 0);

  process.stdout.write(
    `[rotate-jsonl] Done: ${rotated} rotated, ${unchanged} unchanged, ${skipped} skipped, ${errored} errors. Total entries removed: ${totalRemoved}\n`
  );
}

// When run directly (not required as a module)
if (require.main === module) {
  const { success, summary } = runRotation();
  printSummary(summary);
  process.exit(success ? 0 : 1);
}

// Export for testing
module.exports = {
  runRotation,
  validateConfig,
  validateTierEntry,
  validateFilePath,
  detectTimestampField,
  loadConfig,
  processFile,
  KNOWN_DATE_FIELDS,
};
