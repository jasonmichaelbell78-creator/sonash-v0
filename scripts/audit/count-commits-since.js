#!/usr/bin/env node
/* global __dirname */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

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

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--json") {
      jsonOutput = true;
    } else if (args[i] === "--category" && i + 1 < args.length) {
      categoryFilter = args[i + 1];
      i++;
    } else if (args[i].startsWith("--category=")) {
      categoryFilter = args[i].split("=")[1];
    }
  }

  return { categoryFilter, jsonOutput };
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

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    // cells[0] = Category, cells[1] = Last Audit, cells[4] = Trigger At
    if (cells.length < 5) {
      continue;
    }

    const rawCategory = cells[0].replace(/\*\*/g, "").trim();
    const rawLastAudit = cells[1].replace(/_/g, "").trim();
    const rawTrigger = cells[4].trim();

    // Match this row to one of our known categories
    const matched = CATEGORIES.find((cat) => {
      const displayLower = cat.display.toLowerCase();
      const categoryLower = rawCategory.toLowerCase();
      return categoryLower === displayLower || categoryLower.includes(displayLower);
    });

    if (!matched) {
      continue;
    }

    // Extract date from "Last Audit" column
    // Formats seen: "2026-02-07 (Comprehensive)", "2026-02-09 (Single)", "Never"
    let lastAuditDate = null;
    if (rawLastAudit.toLowerCase() !== "never") {
      const dateMatch = rawLastAudit.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        lastAuditDate = dateMatch[1];
      }
    }

    // Extract commit threshold from "Trigger At" column
    // Patterns: "25 commits", "25 commits OR 15 files", etc.
    let threshold = DEFAULT_THRESHOLD;
    const thresholdMatch = rawTrigger.match(/(\d+)\s+commits/i);
    if (thresholdMatch) {
      threshold = parseInt(thresholdMatch[1], 10);
    }

    results.push({
      display: matched.display,
      key: matched.key,
      lastAuditDate,
      threshold,
    });
  }

  return results;
}

/**
 * Count commits since a given date using git log.
 * If date is null (Never audited), count all commits.
 */
function countCommitsSince(date) {
  try {
    const sinceArg = date ? `--since=${date}` : "";
    const cmd = `git log --oneline ${sinceArg} -- . | wc -l`;
    const output = execSync(cmd, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return parseInt(output.trim(), 10) || 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error counting commits: ${message}`);
    return 0;
  }
}

/**
 * Main entry point.
 */
function main() {
  const { categoryFilter, jsonOutput } = parseArgs(process.argv);

  const trackerData = parseTrackerTable();
  if (!trackerData) {
    // Could not parse tracker; exit cleanly (informational script)
    if (jsonOutput) {
      console.log("{}");
    } else {
      console.log("Audit Commit Thresholds:");
      console.log("  (unable to read AUDIT_TRACKER.md)");
    }
    process.exit(0);
  }

  // Filter to a single category if requested
  let categories = trackerData;
  if (categoryFilter) {
    const filterLower = categoryFilter.toLowerCase();
    categories = trackerData.filter((cat) => {
      return cat.display.toLowerCase() === filterLower || cat.key.toLowerCase() === filterLower;
    });

    if (categories.length === 0) {
      if (jsonOutput) {
        console.log("{}");
      } else {
        console.log(`Audit Commit Thresholds:`);
        console.log(`  No matching category found for: ${categoryFilter}`);
      }
      process.exit(0);
    }
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
