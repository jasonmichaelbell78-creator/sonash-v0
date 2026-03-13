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

  // Probe the first line of the file
  try {
    const content = fs.readFileSync(absPath, "utf-8");
    const firstLine = content.split("\n").find((l) => l.trim().length > 0);
    if (firstLine) {
      const entry = JSON.parse(firstLine);
      if (entry.timestamp !== undefined) return "timestamp";
      if (entry.date !== undefined) return "date";
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
    if (!tier || typeof tier !== "object") {
      errors.push(`Tier '${tierName}' must be an object`);
      continue;
    }

    // maxAgeDays must be a positive number or null (permanent)
    if (tier.maxAgeDays !== null) {
      if (typeof tier.maxAgeDays !== "number" || tier.maxAgeDays <= 0) {
        errors.push(`Tier '${tierName}': maxAgeDays must be a positive number or null`);
      }
    }

    if (!Array.isArray(tier.files)) {
      errors.push(`Tier '${tierName}': 'files' must be an array`);
      continue;
    }

    for (const file of tier.files) {
      if (typeof file !== "string" || file.trim().length === 0) {
        errors.push(`Tier '${tierName}': each file entry must be a non-empty string`);
      }
      // Reject path traversal attempts
      if (/^\.\.(?:[\\/]|$)/.test(file) || path.isAbsolute(file)) {
        errors.push(`Tier '${tierName}': file path '${file}' must be relative and non-traversing`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Main rotation logic
// ---------------------------------------------------------------------------

/**
 * Run JSONL rotation for all eligible tiers.
 * @returns {{ success: boolean, summary: object[] }}
 */
function runRotation() {
  // 1. Load config
  const configPath = path.resolve(projectRoot, "config", "rotation-policy.json");

  let rawConfig;
  try {
    const configContent = fs.readFileSync(configPath, "utf-8");
    rawConfig = JSON.parse(configContent);
  } catch (err) {
    const safeMsg = sanitizeError(err);
    process.stderr.write(`[rotate-jsonl] Failed to load config: ${safeMsg}\n`);
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
      const absPath = path.resolve(projectRoot, relFile);

      // Check file exists (skip silently if missing — idempotent)
      try {
        fs.accessSync(absPath, fs.constants.R_OK);
      } catch {
        summary.push({
          file: relFile,
          tier: tierName,
          status: "skipped",
          reason: "file not found",
          removed: 0,
        });
        continue;
      }

      // Symlink safety check
      if (!isSafeToWrite(absPath)) {
        summary.push({
          file: relFile,
          tier: tierName,
          status: "skipped",
          reason: "symlink safety check failed",
          removed: 0,
        });
        continue;
      }

      // Detect timestamp field
      const tsField = detectTimestampField(absPath);

      // Run expiration
      try {
        const result = expireJsonlByAge(absPath, tier.maxAgeDays, tsField);

        const removed = result.before - result.after;
        summary.push({
          file: relFile,
          tier: tierName,
          status: result.expired ? "rotated" : "unchanged",
          reason: null,
          before: result.before,
          after: result.after,
          removed,
          timestampField: tsField,
        });
      } catch (err) {
        const safeMsg = sanitizeError(err);
        summary.push({
          file: relFile,
          tier: tierName,
          status: "error",
          reason: safeMsg,
          removed: 0,
        });
        hasErrors = true;
      }
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
module.exports = { runRotation, validateConfig, detectTimestampField, KNOWN_DATE_FIELDS };
