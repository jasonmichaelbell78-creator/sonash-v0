#!/usr/bin/env node
/* global __dirname */

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");

// ---------------------------------------------------------------------------
// Category directory mapping
// ---------------------------------------------------------------------------
const CATEGORY_DIR_MAP = {
  "code-quality": "code",
  security: "security",
  performance: "performance",
  refactoring: "refactoring",
  documentation: "documentation",
  process: "process",
  "engineering-productivity": "engineering-productivity",
  enhancements: "enhancements",
  "ai-optimization": "ai-optimization",
};

// ---------------------------------------------------------------------------
// Parse CLI arguments
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  let category = null;
  const catIdx = args.indexOf("--category");
  if (catIdx !== -1 && catIdx + 1 < args.length) {
    category = args[catIdx + 1];
  }
  return { category };
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

/**
 * Check a) -- output directories exist and are writable.
 */
function checkOutputDirectories(category) {
  const base = path.join(REPO_ROOT, "docs", "audits", "single-session");
  const dirs =
    category && CATEGORY_DIR_MAP[category]
      ? [CATEGORY_DIR_MAP[category]]
      : Object.values(CATEGORY_DIR_MAP);

  const missing = [];
  for (const dir of dirs) {
    const fullPath = path.join(base, dir);
    try {
      fs.accessSync(fullPath, fs.constants.W_OK);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      missing.push(`${dir} (${message})`);
    }
  }

  if (missing.length === 0) {
    return { passed: true, label: "Output directories exist and writable" };
  }
  return {
    passed: false,
    label: `Output directories exist and writable — missing: ${missing.join(", ")}`,
  };
}

/**
 * Check b) -- FALSE_POSITIVES.jsonl exists.
 */
function checkFalsePositives() {
  const fp = path.join(REPO_ROOT, "docs", "technical-debt", "FALSE_POSITIVES.jsonl");
  try {
    fs.accessSync(fp, fs.constants.R_OK);
    return { passed: true, label: "FALSE_POSITIVES.jsonl accessible" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      passed: false,
      label: `FALSE_POSITIVES.jsonl missing (${message})`,
    };
  }
}

/**
 * Check c) -- TDMS pipeline scripts exist.
 */
function checkTDMSPipeline() {
  const scripts = [
    "scripts/debt/intake-audit.js",
    "scripts/debt/generate-views.js",
    "scripts/debt/generate-metrics.js",
    "scripts/debt/validate-schema.js",
  ];

  const missing = [];
  for (const rel of scripts) {
    const fullPath = path.join(REPO_ROOT, rel);
    try {
      fs.accessSync(fullPath, fs.constants.R_OK);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      missing.push(`${rel} (${message})`);
    }
  }

  if (missing.length === 0) {
    return { passed: true, label: "TDMS pipeline scripts present" };
  }
  return {
    passed: false,
    label: `TDMS pipeline scripts missing: ${missing.join(", ")}`,
  };
}

/**
 * Check d) -- JSONL_SCHEMA_STANDARD.md exists.
 */
function checkJSONLSchema() {
  const fp = path.join(REPO_ROOT, "docs", "technical-debt", "JSONL_SCHEMA_STANDARD.md");
  try {
    fs.accessSync(fp, fs.constants.R_OK);
    return { passed: true, label: "JSONL_SCHEMA_STANDARD.md accessible" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      passed: false,
      label: `JSONL_SCHEMA_STANDARD.md missing (${message})`,
    };
  }
}

/**
 * Check e) -- audit-schema.json exists.
 */
function checkAuditSchema() {
  const fp = path.join(REPO_ROOT, "scripts", "config", "audit-schema.json");
  try {
    fs.accessSync(fp, fs.constants.R_OK);
    return { passed: true, label: "Audit schema config accessible" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      passed: false,
      label: `Audit schema config missing (${message})`,
    };
  }
}

/**
 * Check f) -- MASTER_DEBT.jsonl exists.
 */
function checkMasterDebt() {
  const fp = path.join(REPO_ROOT, "docs", "technical-debt", "MASTER_DEBT.jsonl");
  try {
    fs.accessSync(fp, fs.constants.R_OK);
    return { passed: true, label: "MASTER_DEBT.jsonl accessible" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      passed: false,
      label: `MASTER_DEBT.jsonl missing (${message})`,
    };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const { category } = parseArgs();

  if (category && !CATEGORY_DIR_MAP[category]) {
    const valid = Object.keys(CATEGORY_DIR_MAP).join(", ");
    console.error(`Unknown category: "${category}". Valid categories: ${valid}`);
    process.exit(1);
  }

  const results = [
    checkOutputDirectories(category),
    checkFalsePositives(),
    checkTDMSPipeline(),
    checkJSONLSchema(),
    checkAuditSchema(),
    checkMasterDebt(),
  ];

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("Pre-Audit Check Results:");
  for (const r of results) {
    const icon = r.passed ? "\u2705" : "\u274C";
    console.log(`  ${icon} ${r.label}`);
  }

  console.log("");
  if (failed === 0) {
    console.log(`Result: ${passed}/${total} checks passed — all clear`);
  } else {
    console.log(
      `Result: ${passed}/${total} checks passed — ${failed} blocker${failed > 1 ? "s" : ""} found`
    );
  }

  process.exit(failed === 0 ? 0 : 1);
}

main();
