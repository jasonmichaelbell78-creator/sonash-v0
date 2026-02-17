#!/usr/bin/env node
/* global __dirname */
/**
 * Resolution Feedback Loop Tracker
 *
 * Cross-references MASTER_DEBT.jsonl with git history to identify resolved findings.
 * Checks file existence and modification dates via git log to categorize open items.
 *
 * Usage:
 *   node scripts/audit/track-resolutions.js [options]
 *
 * Options:
 *   --dry-run          Report what would change without modifying files (default)
 *   --apply            Actually update MASTER_DEBT.jsonl statuses to RESOLVED
 *   --json             Output machine-readable JSON instead of human-readable text
 *   --category <name>  Filter to one category (e.g. "code-quality", "security")
 *
 * Exit codes:
 *   0 = success
 *   1 = error
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const MASTER_DEBT_PATH = path.join(REPO_ROOT, "docs", "technical-debt", "MASTER_DEBT.jsonl");

/**
 * Validate that a relative path resolves within REPO_ROOT (SEC-008).
 * @param {string} relPath - path relative to repo root
 * @returns {boolean}
 */
function isPathContained(relPath) {
  const resolved = path.resolve(REPO_ROOT, relPath);
  return resolved.startsWith(REPO_ROOT + path.sep) || resolved === REPO_ROOT;
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const dryRun = !apply; // --dry-run is the default
  const jsonOutput = args.includes("--json");

  let category = null;
  const catIdx = args.indexOf("--category");
  if (catIdx !== -1 && catIdx + 1 < args.length) {
    category = args[catIdx + 1];
  }

  return { dryRun, apply, jsonOutput, category };
}

// ---------------------------------------------------------------------------
// JSONL helpers
// ---------------------------------------------------------------------------

/**
 * Read and parse MASTER_DEBT.jsonl.
 * @returns {Array<Object>} parsed items
 */
function readMasterDebt() {
  let content;
  try {
    content = fs.readFileSync(MASTER_DEBT_PATH, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error reading MASTER_DEBT.jsonl: ${msg}`);
    process.exit(1);
  }

  const lines = content.split("\n").filter((line) => line.trim());
  const items = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      items.push(JSON.parse(lines[i]));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Warning: Failed to parse line ${i + 1}: ${msg}`);
    }
  }

  return items;
}

/**
 * Write items back to MASTER_DEBT.jsonl.
 * @param {Array<Object>} items
 */
function writeMasterDebt(items) {
  // Symlink guard — refuse to write through a symlink
  try {
    const stat = fs.lstatSync(MASTER_DEBT_PATH);
    if (stat.isSymbolicLink()) {
      console.error(`Error: ${MASTER_DEBT_PATH} is a symlink — refusing to write`);
      process.exit(1);
    }
  } catch {
    // File doesn't exist yet — safe to write
  }

  const content = items.map((item) => JSON.stringify(item)).join("\n") + "\n";
  try {
    fs.writeFileSync(MASTER_DEBT_PATH, content, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error writing MASTER_DEBT.jsonl: ${msg}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

/**
 * Check if a file exists in the working tree.
 * Validates path containment before checking (SEC-008).
 * @param {string} relPath - path relative to repo root
 * @returns {boolean}
 */
/**
 * Normalize a repo-relative path by stripping trailing :line suffixes.
 * @param {string} relPath - path that may contain :lineNumber suffix
 * @returns {string|null} normalized path, or null if invalid
 */
function normalizeRepoRelPath(relPath) {
  if (typeof relPath !== "string") return null;
  const trimmed = relPath.trim();
  if (!trimmed) return null;
  // Strip only a trailing ":<digits>" suffix (preserve other colons like C:\)
  return trimmed.replace(/:(\d+)$/, "");
}

function fileExists(relPath) {
  const normalized = normalizeRepoRelPath(relPath);
  if (!normalized || !isPathContained(normalized)) return false;
  const absPath = path.join(REPO_ROOT, normalized);
  return fs.existsSync(absPath);
}

/**
 * Get the number of commits that modified a file since a given date.
 * Uses execFileSync with args array to prevent command injection (SEC-001/S4721).
 * Validates path containment before querying (SEC-008).
 * @param {string} relPath - path relative to repo root
 * @param {string} sinceDate - ISO date string (e.g. "2026-01-30")
 * @returns {number} commit count, or -1 on error
 */
function getCommitCountSince(relPath, sinceDate) {
  const normalized = normalizeRepoRelPath(relPath);
  if (!normalized || !isPathContained(normalized)) return -1;

  const hasValidSince = typeof sinceDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sinceDate);
  if (sinceDate && !hasValidSince) return -1;

  try {
    const args = ["log", "--oneline"];
    if (hasValidSince) args.push(`--since=${sinceDate}`);
    args.push("--", normalized);
    const result = execFileSync("git", args, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const lines = result
      .trim()
      .split("\n")
      .filter((l) => l.trim());
    return lines.length;
  } catch {
    // git log returns 0 exit code even with no results, so errors here are real
    return -1;
  }
}

// ---------------------------------------------------------------------------
// Resolution classification
// ---------------------------------------------------------------------------

/**
 * Categorize a single open debt item.
 *
 * @param {Object} item - parsed debt item
 * @returns {{ classification: string, reason: string }}
 *   classification: "likely_resolved" | "potentially_resolved" | "still_open" | "unknown"
 */
function classifyItem(item) {
  // No file field — can't determine
  if (!item.file) {
    return { classification: "unknown", reason: "no file reference" };
  }

  const exists = fileExists(item.file);

  // File was deleted — likely resolved
  if (!exists) {
    return { classification: "likely_resolved", reason: "file was deleted" };
  }

  // File exists — check git history for modifications since creation
  const sinceDate = item.created || null;
  if (!sinceDate) {
    return { classification: "unknown", reason: "no created date to compare" };
  }

  const commitCount = getCommitCountSince(item.file, sinceDate);

  if (commitCount < 0) {
    return { classification: "unknown", reason: "could not query git history" };
  }

  // Thresholds:
  //   >= 3 commits  -> likely_resolved  (significantly modified)
  //   >= 1 commit   -> potentially_resolved  (modified)
  //   0 commits     -> still_open  (unchanged)
  if (commitCount >= 3) {
    return {
      classification: "likely_resolved",
      reason: `file significantly modified (${commitCount} commits since ${sinceDate})`,
    };
  }

  if (commitCount >= 1) {
    return {
      classification: "potentially_resolved",
      reason: `file modified (${commitCount} commit${commitCount === 1 ? "" : "s"} since ${sinceDate})`,
    };
  }

  return { classification: "still_open", reason: `unchanged since ${sinceDate}` };
}

// ---------------------------------------------------------------------------
// Report output helpers (extracted to reduce cognitive complexity of main)
// ---------------------------------------------------------------------------

/**
 * Format a result entry for JSON output (strips internal item reference).
 * @param {Object} r - result entry
 * @returns {{ id: string|null, title: string, file: string|null, reason: string }}
 */
function formatResultEntry(r) {
  return { id: r.id, title: r.title, file: r.file, reason: r.reason };
}

/**
 * Print machine-readable JSON report.
 */
function printJsonReport(results, openItems, category, apply, appliedCount) {
  const output = {
    summary: {
      total_open: openItems.length,
      likely_resolved: results.likely_resolved.length,
      potentially_resolved: results.potentially_resolved.length,
      still_open: results.still_open.length,
      unknown: results.unknown.length,
      applied: apply ? appliedCount : 0,
      mode: apply ? "apply" : "dry-run",
    },
    likely_resolved: results.likely_resolved.map(formatResultEntry),
    potentially_resolved: results.potentially_resolved.map(formatResultEntry),
    still_open: results.still_open.map(formatResultEntry),
    unknown: results.unknown.map(formatResultEntry),
  };

  if (category) {
    output.summary.category_filter = category;
  }

  console.log(JSON.stringify(output, null, 2));
}

/**
 * Print human-readable text report.
 */
function printHumanReport(results, openItems, category, apply, appliedCount) {
  console.log("");
  console.log("Resolution Tracking Report:");

  if (category) {
    console.log(`  Category filter: ${category}`);
  }

  console.log(`  Mode: ${apply ? "apply" : "dry-run"}`);
  console.log(`  Total open items: ${openItems.length}`);
  console.log(
    `  Likely resolved: ${results.likely_resolved.length} (files deleted or significantly changed)`
  );
  console.log(`  Potentially resolved: ${results.potentially_resolved.length} (files modified)`);
  console.log(`  Still open: ${results.still_open.length} (unchanged)`);
  console.log(`  Unknown: ${results.unknown.length} (no file reference)`);

  if (results.likely_resolved.length > 0) {
    console.log("");
    console.log("Likely Resolved Items:");
    for (const r of results.likely_resolved) {
      console.log(`  - ${r.id}: ${r.title} (${r.reason})`);
    }
  }

  if (results.potentially_resolved.length > 0) {
    console.log("");
    console.log("Potentially Resolved Items:");
    for (const r of results.potentially_resolved) {
      console.log(`  - ${r.id}: ${r.title} (${r.reason})`);
    }
  }

  if (apply && appliedCount > 0) {
    console.log("");
    console.log(`Applied: ${appliedCount} item(s) marked as RESOLVED in MASTER_DEBT.jsonl`);
  } else if (!apply && results.likely_resolved.length > 0) {
    console.log("");
    console.log("Run with --apply to mark likely resolved items as RESOLVED in MASTER_DEBT.jsonl.");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const { apply, jsonOutput, category } = parseArgs();

  // Read all items
  const allItems = readMasterDebt();

  if (allItems.length === 0) {
    console.error("Error: MASTER_DEBT.jsonl is empty or could not be parsed.");
    process.exit(1);
  }

  // Filter to open items (not RESOLVED, not FALSE_POSITIVE)
  let openItems = allItems.filter(
    (item) => item.status !== "RESOLVED" && item.status !== "FALSE_POSITIVE"
  );

  // Apply category filter if specified
  if (category) {
    openItems = openItems.filter((item) => item.category === category);
  }

  // Classify each open item
  const results = {
    likely_resolved: [],
    potentially_resolved: [],
    still_open: [],
    unknown: [],
  };

  for (const item of openItems) {
    const { classification, reason } = classifyItem(item);
    results[classification].push({
      id: item.id ?? null,
      title: item.title || "(no title)",
      file: item.file || null,
      reason,
      item,
    });
  }

  // If --apply, update the MASTER_DEBT.jsonl for likely_resolved items
  let appliedCount = 0;
  if (apply && results.likely_resolved.length > 0) {
    const nowISO = new Date().toISOString().split("T")[0];
    const likelyIds = new Set(results.likely_resolved.map((r) => r.id).filter(Boolean));

    for (const item of allItems) {
      if (!item.id) continue;
      if (likelyIds.has(item.id)) {
        item.status = "RESOLVED";
        item.resolved_at = nowISO;
        item.resolved_by = "auto-resolution-tracker";
        appliedCount++;
      }
    }

    writeMasterDebt(allItems);
  }

  // Output
  if (jsonOutput) {
    printJsonReport(results, openItems, category, apply, appliedCount);
  } else {
    printHumanReport(results, openItems, category, apply, appliedCount);
  }

  process.exit(0);
}

main();
