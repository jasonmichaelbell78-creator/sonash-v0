#!/usr/bin/env node
/**
 * route-lifecycle-gaps.js - Route lifecycle score gaps through learning-router
 *
 * Reads lifecycle-scores.jsonl, finds systems with Action < 2, and routes
 * each gap through the learning-router for enforcement scaffolding.
 *
 * Part of Data Effectiveness Audit (Wave 5.2)
 *
 * Usage:
 *   node scripts/route-lifecycle-gaps.js [--dry-run] [--json]
 */

/* global __dirname */
const path = require("node:path");
const fs = require("node:fs");

let sanitizeError;
try {
  ({ sanitizeError } = require(path.join(__dirname, "lib", "security-helpers.js")));
} catch {
  sanitizeError = (e) =>
    (e instanceof Error ? e.message : String(e))
      // Regex patterns with character classes — replaceAll requires string literals, not regex
      .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replace(/\/home\/[^/\s]+/gi, "[HOME]")
      .replace(/\/Users\/[^/\s]+/gi, "[HOME]")
      .replace(/[A-Z]:\\[^\s]+/gi, "[PATH]")
      .replace(/\/[^\s]*\/[^\s]+/g, "[PATH]");
}

const PROJECT_ROOT = path.resolve(__dirname, "..");
const SCORES_PATH = path.join(PROJECT_ROOT, ".claude", "state", "lifecycle-scores.jsonl");

function readJsonl(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const entries = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed));
    } catch {
      /* skip corrupt lines */
    }
  }
  return entries;
}

function categorizeGap(entry) {
  // Determine learning type based on category
  const codeCategories = ["pattern-rules", "audit-findings", "aggregation-data"];
  const processCategories = [
    "hook-warnings",
    "override-audit",
    "health-scores",
    "agent-tracking",
    "velocity-tracking",
    "commit-log",
  ];
  const behavioralCategories = [
    "behavioral-rules",
    "security-checklist",
    "fix-templates",
    "memory",
    "session-context",
  ];

  if (codeCategories.includes(entry.category)) return "code";
  if (processCategories.includes(entry.category)) return "process";
  if (behavioralCategories.includes(entry.category)) return "behavioral";
  return "process"; // default
}

function run(options = {}) {
  const entries = readJsonl(SCORES_PATH);
  if (entries.length === 0) {
    console.error("No lifecycle scores found");
    return { success: false, routed: 0 };
  }

  // Filter systems with Action < 2 (guard against non-finite values)
  const gaps = entries.filter((e) => {
    const action = Number.isFinite(e.action) ? e.action : 0;
    return action < 2;
  });

  console.log(`Found ${gaps.length} systems with Action < 2 (of ${entries.length} total):\n`);
  for (const g of gaps) {
    console.log(`  - ${g.system} (Action=${g.action}, Total=${g.total}/12)`);
  }
  console.log();

  if (options.dryRun) {
    console.log(`Dry run: ${gaps.length} gap(s) would be routed.`);
    return { success: true, routed: 0, gaps };
  }

  const { route } = require(path.join(__dirname, "lib", "learning-router.js"));

  let routed = 0;
  let errors = 0;

  for (const gap of gaps) {
    const type = categorizeGap(gap);
    const learning = {
      type,
      pattern: `${gap.system}: ${gap.gap}`,
      source: `lifecycle-scores.jsonl:${gap.id} (Action=${gap.action})`,
      severity: gap.total < 6 ? "high" : "medium",
      evidence: {
        summary: `Lifecycle score: ${gap.capture}/${gap.storage}/${gap.recall}/${gap.action} = ${gap.total}/12`,
        scores: {
          capture: gap.capture,
          storage: gap.storage,
          recall: gap.recall,
          action: gap.action,
          total: gap.total,
        },
      },
    };

    try {
      route(learning, { track: true });
      routed++;
    } catch (error) {
      console.error(`  Error routing ${gap.system}: ${sanitizeError(error)}`);
      errors++;
    }
  }

  console.log(`Routed: ${routed} | Errors: ${errors}`);

  if (options.json) {
    console.log(JSON.stringify({ totalGaps: gaps.length, routed, errors }, null, 2));
  }

  return { success: errors === 0, routed, gaps };
}

if (require.main === module) {
  const args = new Set(process.argv.slice(2));
  const result = run({
    dryRun: args.has("--dry-run"),
    json: args.has("--json"),
  });
  if (!result.success) process.exitCode = 1;
}

module.exports = { run, readJsonl, categorizeGap };
