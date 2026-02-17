#!/usr/bin/env node
/* global __dirname */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const TRACKER_PATH = path.join(REPO_ROOT, "docs", "audits", "AUDIT_TRACKER.md");

// Category display names mapped to their canonical/directory identifiers
const CATEGORIES = [
  { display: "Code", key: "code-quality" },
  { display: "Security", key: "security" },
  { display: "Performance", key: "performance" },
  { display: "Refactoring", key: "refactoring" },
  { display: "Documentation", key: "documentation" },
  { display: "Process", key: "process" },
  { display: "Engineering-Productivity", key: "engineering-productivity" },
  { display: "Enhancements", key: "enhancements" },
  { display: "AI Optimization", key: "ai-optimization" },
];

const DEFAULT_THRESHOLD = 30;

/**
 * Parse CLI arguments for --category and --json flags.
 */
function parseArgs(argv) {
  const args = argv.slice(2);
  let categoryFilter = null;
  let jsonOutput = false;

  for (const arg of args) {
    if (arg === "--json") {
      jsonOutput = true;
    } else if (arg.startsWith("--category=")) {
      categoryFilter = arg.split("=")[1];
    }
  }

  // Handle --category <value> format (space-separated)
  const catIdx = args.indexOf("--category");
  if (catIdx !== -1 && catIdx + 1 < args.length && !args[catIdx + 1].startsWith("--")) {
    categoryFilter = args[catIdx + 1];
  }

  return { categoryFilter, jsonOutput };
}

/**
 * Extract a date string (YYYY-MM-DD) from a raw "Last Audit" cell value.
 * Returns null if the value indicates "never" or no date is found.
 *
 * @param {string} raw - the raw cell text, e.g. "2026-02-07 (Comprehensive)" or "Never"
 * @returns {string | null}
 */
function extractLastAuditDate(raw) {
  if (raw.toLowerCase() === "never") return null;
  const match = raw.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * Extract the commit threshold number from a raw "Trigger At" cell value.
 *
 * @param {string} rawTrigger - e.g. "25 commits" or "25 commits OR 15 files"
 * @returns {number}
 */
function extractThreshold(rawTrigger) {
  const match = rawTrigger.match(/(\d+)\s+commits/i);
  return match ? Number.parseInt(match[1], 10) : DEFAULT_THRESHOLD;
}

/**
 * Parse a single table row into a category result object.
 * Returns null if the row does not match a known category or has too few cells.
 *
 * @param {string} line - a pipe-delimited markdown table row
 * @param {Array<{display: string, key: string}>} categories - known categories
 * @returns {{ display: string, key: string, lastAuditDate: string|null, threshold: number }|null}
 */
function parseTableRow(line, categories) {
  const cells = line
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  if (cells.length < 5) return null;

  const rawCategory = cells[0].replaceAll("**", "").trim();
  const rawLastAudit = cells[1].replaceAll("_", "").trim();
  const rawTrigger = cells[4].trim();

  const matched = categories.find((cat) => {
    const displayLower = cat.display.toLowerCase();
    return (
      rawCategory.toLowerCase() === displayLower || rawCategory.toLowerCase().includes(displayLower)
    );
  });
  if (!matched) return null;

  const lastAuditDate = extractLastAuditDate(rawLastAudit);
  const threshold = extractThreshold(rawTrigger);

  return { display: matched.display, key: matched.key, lastAuditDate, threshold };
}

/**
 * Read and parse the AUDIT_TRACKER.md file to extract the
 * "Single-Session Audit Thresholds" table rows.
 *
 * Returns an array of { display, key, lastAuditDate, threshold } objects.
 */
function parseTrackerTable() {
  let content;
  try {
    content = fs.readFileSync(TRACKER_PATH, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error reading AUDIT_TRACKER.md: ${message}`);
    return null;
  }

  const lines = content.split("\n");

  // Locate the single-session threshold table by finding its header
  let tableStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Single-Session Audit Thresholds")) {
      // The markdown table header row starts after the section heading.
      // Walk forward to find the first pipe-delimited row that is the header.
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim().startsWith("|") && lines[j].includes("Category")) {
          tableStartIndex = j;
          break;
        }
      }
      break;
    }
  }

  if (tableStartIndex === -1) {
    console.error("Could not locate Single-Session Audit Thresholds table in AUDIT_TRACKER.md");
    return null;
  }

  // Parse table rows (skip header row and separator row)
  const results = [];
  for (let i = tableStartIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    // Stop at end of table (empty line or non-table line)
    if (!line.startsWith("|")) {
      break;
    }

    const row = parseTableRow(line, CATEGORIES);
    if (row) {
      results.push(row);
    }
  }

  return results;
}

/**
 * Count commits since a given date using git log.
 * If date is null (Never audited), count all commits.
 */
function countCommitsSince(date) {
  try {
    const args = ["log", "--oneline"];
    if (date) args.push(`--since=${date}`);
    args.push("--", ".");
    const output = execFileSync("git", args, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const lines = output
      .trim()
      .split("\n")
      .filter((l) => l.trim());
    return lines.length;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error counting commits: ${message}`);
    return 0;
  }
}

/**
 * Output the "no data available" message for JSON or text mode.
 */
function printNoData(jsonOutput, detail) {
  if (jsonOutput) {
    console.log("{}");
  } else {
    console.log("Audit Commit Thresholds:");
    console.log(`  ${detail || "(unable to read AUDIT_TRACKER.md)"}`);
  }
}

/**
 * Filter tracker data to a single category if a filter is provided.
 */
function filterCategories(trackerData, categoryFilter) {
  if (!categoryFilter) return trackerData;
  const filterLower = categoryFilter.toLowerCase();
  return trackerData.filter((cat) => {
    return cat.display.toLowerCase() === filterLower || cat.key.toLowerCase() === filterLower;
  });
}

/**
 * Main entry point.
 */
function main() {
  const { categoryFilter, jsonOutput } = parseArgs(process.argv);

  const trackerData = parseTrackerTable();
  if (!trackerData) {
    printNoData(jsonOutput, null);
    process.exit(0);
  }

  // Filter to a single category if requested
  const categories = filterCategories(trackerData, categoryFilter);

  if (categories.length === 0) {
    printNoData(jsonOutput, `No matching category found for: ${categoryFilter}`);
    process.exit(0);
  }

  // Count commits for each category
  const output = {};
  const lines = [];

  for (const cat of categories) {
    const commits = countCommitsSince(cat.lastAuditDate);
    const exceeded = commits >= cat.threshold;

    output[cat.key] = {
      commits,
      threshold: cat.threshold,
      exceeded,
    };

    const statusIcon = exceeded ? "\u26a0\ufe0f EXCEEDED" : "\u2705 OK";
    const label = `${cat.display}:`.padEnd(28);
    lines.push(
      `  ${label}${String(commits).padStart(4)} commits (threshold: ${cat.threshold}) ${statusIcon}`
    );
  }

  if (jsonOutput) {
    console.log(JSON.stringify(output));
  } else {
    console.log("Audit Commit Thresholds:");
    for (const line of lines) {
      console.log(line);
    }
  }

  process.exit(0);
}

main();
