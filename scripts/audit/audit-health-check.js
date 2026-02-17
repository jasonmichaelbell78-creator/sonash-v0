#!/usr/bin/env node
/* global __dirname */

const fs = require("node:fs");
const path = require("node:path");

// Resolve paths relative to repo root
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const AUDITS_DIR = path.join(REPO_ROOT, "docs", "audits");
const SINGLE_SESSION_DIR = path.join(AUDITS_DIR, "single-session");
const SCHEMA_PATH = path.join(REPO_ROOT, "scripts", "config", "audit-schema.json");
const STATE_MANAGER_PATH = path.join(REPO_ROOT, "scripts", "multi-ai", "state-manager.js");
const TRACKER_PATH = path.join(AUDITS_DIR, "AUDIT_TRACKER.md");
const COORDINATOR_PATH = path.join(AUDITS_DIR, "multi-ai", "COORDINATOR.md");

// Canonical categories and their directory mappings
const CANONICAL_CATEGORIES = [
  "code-quality",
  "security",
  "performance",
  "refactoring",
  "documentation",
  "process",
  "engineering-productivity",
  "enhancements",
  "ai-optimization",
];

const CATEGORY_DIR_MAPPING = {
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

// Health check results
const results = [];
let allPassed = true;

function addResult(check, passed, message) {
  results.push({ check, passed, message });
  if (!passed) {
    allPassed = false;
  }
}

function checkCategoryDirectories() {
  console.log("\n=== Check 1: Category Directories ===");

  if (!fs.existsSync(SINGLE_SESSION_DIR)) {
    addResult(
      "Category Directories",
      false,
      `Single session directory does not exist: ${SINGLE_SESSION_DIR}`
    );
    return;
  }

  const missingDirs = [];
  for (const category of CANONICAL_CATEGORIES) {
    const dirName = CATEGORY_DIR_MAPPING[category];
    const dirPath = path.join(SINGLE_SESSION_DIR, dirName);

    if (!fs.existsSync(dirPath)) {
      missingDirs.push(`${category} (${dirName})`);
    }
  }

  if (missingDirs.length > 0) {
    addResult("Category Directories", false, `Missing directories: ${missingDirs.join(", ")}`);
  } else {
    addResult("Category Directories", true, "All 9 category directories exist");
  }
}

function checkSchemaCategories() {
  console.log("\n=== Check 2: Schema Categories ===");

  if (!fs.existsSync(SCHEMA_PATH)) {
    addResult("Schema Categories", false, `Schema file does not exist: ${SCHEMA_PATH}`);
    return;
  }

  try {
    const schemaContent = fs.readFileSync(SCHEMA_PATH, "utf-8");
    const schema = JSON.parse(schemaContent);

    if (!schema.validCategories || !Array.isArray(schema.validCategories)) {
      addResult("Schema Categories", false, "Schema does not have validCategories array");
      return;
    }

    const missing = [];
    for (const category of CANONICAL_CATEGORIES) {
      if (!schema.validCategories.includes(category)) {
        missing.push(category);
      }
    }

    if (missing.length > 0) {
      addResult("Schema Categories", false, `Missing categories in schema: ${missing.join(", ")}`);
    } else {
      addResult(
        "Schema Categories",
        true,
        `All 9 categories present in schema (${schema.validCategories.length} total)`
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    addResult("Schema Categories", false, `Error reading schema: ${msg}`);
  }
}

function checkStateManagerCategories() {
  console.log("\n=== Check 3: State Manager Categories ===");

  if (!fs.existsSync(STATE_MANAGER_PATH)) {
    addResult(
      "State Manager Categories",
      false,
      `State manager does not exist: ${STATE_MANAGER_PATH}`
    );
    return;
  }

  try {
    const content = fs.readFileSync(STATE_MANAGER_PATH, "utf-8");

    // Extract VALID_CATEGORIES array using regex
    const match = content.match(/const\s+VALID_CATEGORIES\s*=\s*\[([\s\S]*?)\]/);

    if (!match) {
      addResult(
        "State Manager Categories",
        false,
        "Could not find VALID_CATEGORIES array in state-manager.js"
      );
      return;
    }

    // Parse the array content — remove quotes with separate replacements to avoid regex grouping bug
    const arrayContent = match[1];
    const categories = arrayContent
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^['"]/, "").replace(/['"]$/, ""));

    const missing = [];
    for (const category of CANONICAL_CATEGORIES) {
      if (!categories.includes(category)) {
        missing.push(category);
      }
    }

    if (missing.length > 0) {
      addResult(
        "State Manager Categories",
        false,
        `Missing categories in state-manager: ${missing.join(", ")}`
      );
    } else {
      addResult(
        "State Manager Categories",
        true,
        `All 9 categories present in state-manager (${categories.length} total)`
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    addResult("State Manager Categories", false, `Error reading state-manager: ${msg}`);
  }
}

function checkTrackerExists() {
  console.log("\n=== Check 4: Audit Tracker ===");

  if (fs.existsSync(TRACKER_PATH)) {
    addResult("Audit Tracker", true, "AUDIT_TRACKER.md exists");
  } else {
    addResult("Audit Tracker", false, `AUDIT_TRACKER.md does not exist: ${TRACKER_PATH}`);
  }
}

function checkOrphanedAudits() {
  console.log("\n=== Check 5: Orphaned Audit Results ===");

  const docsDir = path.join(REPO_ROOT, "docs");
  const orphanedDirs = [];

  const checkPaths = ["multi-ai-audit", "ai-optimization-audit"];

  for (const dirName of checkPaths) {
    const dirPath = path.join(docsDir, dirName);
    if (fs.existsSync(dirPath)) {
      orphanedDirs.push(dirName);
    }
  }

  if (orphanedDirs.length > 0) {
    const orphanedPaths = orphanedDirs.map((d) => `docs/${d}`);
    addResult("Orphaned Audits", false, `Found orphaned directories: ${orphanedPaths.join(", ")}`);
  } else {
    addResult("Orphaned Audits", true, "No orphaned audit directories found");
  }
}

function checkStaleBaselines() {
  console.log("\n=== Check 6: Stale Baselines ===");

  if (!fs.existsSync(COORDINATOR_PATH)) {
    addResult("Stale Baselines", true, "COORDINATOR.md does not exist (skipping baseline check)");
    return;
  }

  try {
    const content = fs.readFileSync(COORDINATOR_PATH, "utf-8");
    const stats = fs.statSync(COORDINATOR_PATH);
    const fileAge = Date.now() - stats.mtime.getTime();
    const daysOld = Math.floor(fileAge / (1000 * 60 * 60 * 24));

    // Check for baseline dates in the content
    const dateMatches = content.match(/baseline.*?(\d{4}-\d{2}-\d{2})/gi);

    if (!dateMatches || dateMatches.length === 0) {
      addResult("Stale Baselines", true, "No baselines found in COORDINATOR.md");
      return;
    }

    const staleBaselines = [];
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    for (const match of dateMatches) {
      const dateMatch = match.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const baselineDate = new Date(dateMatch[1]);
        const age = now - baselineDate.getTime();

        if (age > thirtyDaysMs) {
          const staleDays = Math.floor(age / (24 * 60 * 60 * 1000));
          staleBaselines.push(`${dateMatch[1]} (${staleDays} days old)`);
        }
      }
    }

    if (staleBaselines.length > 0) {
      addResult(
        "Stale Baselines",
        false,
        `Found ${staleBaselines.length} baseline(s) >30 days old: ${staleBaselines.join(", ")}`
      );
    } else {
      addResult(
        "Stale Baselines",
        true,
        `All baselines are recent (COORDINATOR.md is ${daysOld} days old)`
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    addResult("Stale Baselines", false, `Error checking baselines: ${msg}`);
  }
}

function printReport() {
  console.log("\n" + "=".repeat(70));
  console.log("AUDIT SYSTEM HEALTH CHECK REPORT");
  console.log("=".repeat(70));

  for (const result of results) {
    const status = result.passed ? "\u2713 PASS" : "\u2717 FAIL";
    console.log(`\n${status} - ${result.check}`);
    console.log(`  ${result.message}`);
  }

  console.log("\n" + "=".repeat(70));
  const passCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const overallStatus = allPassed ? "\u2713 HEALTHY" : "\u2717 ISSUES FOUND";

  console.log(`OVERALL STATUS: ${overallStatus} (${passCount}/${totalCount} checks passed)`);
  console.log("=".repeat(70) + "\n");
}

function main() {
  console.log("Starting audit system health check...");
  console.log(`Repository root: ${REPO_ROOT}`);

  // Run all checks
  checkCategoryDirectories();
  checkSchemaCategories();
  checkStateManagerCategories();
  checkTrackerExists();
  checkOrphanedAudits();
  checkStaleBaselines();

  // Print report
  printReport();

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run the health check
main();
