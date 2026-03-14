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
      .replaceAll(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replaceAll(/\/home\/[^/\s]+/gi, "[HOME]")
      .replaceAll(/\/Users\/[^/\s]+/gi, "[HOME]")
      .replaceAll(/[A-Z]:\\[^\s]+/gi, "[PATH]");
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

/** Build a learning entry from a lifecycle gap. */
function buildLearning(gap) {
  const type = categorizeGap(gap);
  const capture = Number.isFinite(gap.capture) ? gap.capture : 0;
  const storage = Number.isFinite(gap.storage) ? gap.storage : 0;
  const recall = Number.isFinite(gap.recall) ? gap.recall : 0;
  const action = Number.isFinite(gap.action) ? gap.action : 0;
  const total = Number.isFinite(gap.total) ? gap.total : capture + storage + recall + action;
  const toOneLine = (v, maxLen = 200) => {
    const s = String(v ?? "")
      .replaceAll(/[\r\n\t\x00-\x1f\x7f]/g, " ") // eslint-disable-line no-control-regex
      .replaceAll(/\s+/g, " ")
      .trim();
    return s.length > maxLen ? s.slice(0, maxLen) + "..." : s;
  };
  const system =
    typeof gap.system === "string" && gap.system.trim().length > 0
      ? toOneLine(gap.system)
      : "Unknown system";
  const gapText =
    typeof gap.gap === "string" && gap.gap.trim().length > 0
      ? toOneLine(gap.gap)
      : "Unspecified gap";
  const id =
    typeof gap.id === "string" && gap.id.trim().length > 0
      ? toOneLine(gap.id)
      : `missing-id:${system}`;

  return {
    type,
    pattern: `${system}: ${gapText}`,
    source: `lifecycle-scores.jsonl:${id} (Action=${action})`,
    severity: total < 6 ? "high" : "medium",
    evidence: {
      summary: `Lifecycle score: ${capture}/${storage}/${recall}/${action} = ${total}/12`,
      scores: { capture, storage, recall, action, total },
    },
  };
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
    const learning = buildLearning(gap);
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
