#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * hook-analytics.js - Hook & Agent Observability Report
 *
 * Reads all observability JSONL data and produces a summary report:
 * - Override frequency by check type (from override-log.jsonl)
 * - Commit failure frequency by check (from commit-failures.jsonl)
 * - False positive indicators (keyword scan of override reasons)
 * - Agent invocation breakdown (from agent-invocations.jsonl)
 * - Threshold-based recommendations
 *
 * Usage:
 *   npm run hooks:analytics
 *   npm run hooks:analytics -- --since=2026-02-14
 *   npm run hooks:analytics -- --json
 *   npm run hooks:analytics -- --check=cross-doc
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function getRepoRoot() {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf-8",
    timeout: 3000,
  });
  return result.status === 0 && result.stdout ? result.stdout.trim() : process.cwd();
}

const ROOT = getRepoRoot();

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB guard

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function safeReadJsonl(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return [];
    const content = fs.readFileSync(filePath, "utf-8");
    return content
      .split("\n")
      .filter((l) => l.trim())
      .map(safeParse)
      .filter(Boolean);
  } catch {
    return [];
  }
}

function parseArgs() {
  const args = { since: null, json: false, check: null };
  for (const arg of process.argv.slice(2)) {
    if (arg === "--json") args.json = true;
    else if (arg.startsWith("--since=")) args.since = arg.split("=").slice(1).join("=");
    else if (arg.startsWith("--check=")) args.check = arg.split("=").slice(1).join("=");
  }
  return args;
}

function filterBySince(entries, since) {
  if (!since) return entries;
  const cutoff = new Date(since).getTime();
  if (Number.isNaN(cutoff)) return entries;
  return entries.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });
}

function groupBy(entries, key) {
  const groups = Object.create(null);
  for (const entry of entries) {
    const k = String(entry[key] || "unknown");
    if (!groups[k]) groups[k] = [];
    groups[k].push(entry);
  }
  return groups;
}

function sortedEntries(obj) {
  return Object.entries(obj).sort((a, b) => b[1].length - a[1].length);
}

// -------------------------------------------------------------------
// False positive detection
// -------------------------------------------------------------------

const FALSE_POSITIVE_KEYWORDS = [
  "false positive",
  "not needed",
  "already done",
  "not applicable",
  "irrelevant",
  "wrong trigger",
  "doesn't apply",
  "no change needed",
  "unrelated",
];

function countFalsePositiveIndicators(overrides) {
  let count = 0;
  for (const o of overrides) {
    const reason = String(o.reason || "").toLowerCase();
    if (FALSE_POSITIVE_KEYWORDS.some((kw) => reason.includes(kw))) {
      count++;
    }
  }
  return count;
}

// -------------------------------------------------------------------
// Report building
// -------------------------------------------------------------------

function buildRecommendations(overridesByCheck, failuresByCheck, overrides, falsePositiveCount) {
  const recommendations = [];
  for (const [check, entries] of Object.entries(overridesByCheck)) {
    const pct = Math.round((entries.length / Math.max(overrides.length, 1)) * 100);
    if (pct > 50) {
      recommendations.push(
        `Override rate for "${check}" is ${pct}% — review rules for false positives`
      );
    }
  }
  for (const [check, entries] of Object.entries(failuresByCheck)) {
    if (entries.length >= 3) {
      recommendations.push(`"${check}" failed ${entries.length} times — consider adjusting rules`);
    }
  }
  if (falsePositiveCount > 0) {
    const fpPct = Math.round((falsePositiveCount / Math.max(overrides.length, 1)) * 100);
    recommendations.push(
      `${falsePositiveCount} overrides (${fpPct}%) mention false-positive keywords — audit those checks`
    );
  }
  return recommendations;
}

function printTextReport(data) {
  const {
    period,
    overrides,
    overridesByCheck,
    failures,
    failuresByCheck,
    agents,
    agentsByType,
    falsePositiveCount,
    recommendations,
  } = data;

  console.log(`\nHook & Agent Analytics (${period})`);
  console.log("=".repeat(60));

  console.log(`\nOverrides: ${overrides.length} total`);
  for (const [check, entries] of sortedEntries(overridesByCheck)) {
    const pct = Math.round((entries.length / overrides.length) * 100);
    const bar = "#".repeat(Math.max(1, Math.round(pct / 5)));
    console.log(
      `  ${check.padEnd(20)} ${String(entries.length).padStart(4)}  (${String(pct).padStart(3)}%)  ${bar}`
    );
  }
  if (falsePositiveCount > 0) {
    console.log(`  False-positive indicators: ${falsePositiveCount}`);
  }

  console.log(`\nCommit Failures: ${failures.length} total`);
  for (const [check, entries] of sortedEntries(failuresByCheck)) {
    console.log(`  ${check.padEnd(20)} ${String(entries.length).padStart(4)}`);
  }

  console.log(`\nAgent Invocations: ${agents.length} total`);
  for (const [agent, entries] of sortedEntries(agentsByType)) {
    console.log(`  ${agent.padEnd(25)} ${String(entries.length).padStart(4)}`);
  }

  if (recommendations.length > 0) {
    console.log("\nRecommendations:");
    for (const rec of recommendations) {
      console.log(`  * ${rec}`);
    }
  }
  console.log("");
}

// -------------------------------------------------------------------
// Main
// -------------------------------------------------------------------

function main() {
  const args = parseArgs();

  const overridePath = path.join(ROOT, ".claude", "override-log.jsonl");
  const failuresPath = path.join(ROOT, ".claude", "state", "commit-failures.jsonl");
  const agentsPath = path.join(ROOT, ".claude", "state", "agent-invocations.jsonl");

  let overrides = filterBySince(safeReadJsonl(overridePath), args.since);
  let failures = filterBySince(safeReadJsonl(failuresPath), args.since);
  const agents = filterBySince(safeReadJsonl(agentsPath), args.since);

  if (args.check) {
    overrides = overrides.filter((o) => String(o.check || "").includes(args.check));
    failures = failures.filter((f) => String(f.failedCheck || "").includes(args.check));
  }

  const overridesByCheck = groupBy(overrides, "check");
  const failuresByCheck = groupBy(failures, "failedCheck");
  const agentsByType = groupBy(agents, "agent");
  const falsePositiveCount = countFalsePositiveIndicators(overrides);
  const recommendations = buildRecommendations(
    overridesByCheck,
    failuresByCheck,
    overrides,
    falsePositiveCount
  );

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          period: args.since || "all-time",
          overrides: {
            total: overrides.length,
            by_check: Object.fromEntries(
              sortedEntries(overridesByCheck).map(([k, v]) => [k, v.length])
            ),
            false_positive_indicators: falsePositiveCount,
          },
          commit_failures: {
            total: failures.length,
            by_check: Object.fromEntries(
              sortedEntries(failuresByCheck).map(([k, v]) => [k, v.length])
            ),
          },
          agent_invocations: {
            total: agents.length,
            by_type: Object.fromEntries(sortedEntries(agentsByType).map(([k, v]) => [k, v.length])),
          },
          recommendations,
        },
        null,
        2
      )
    );
    return;
  }

  printTextReport({
    period: args.since ? `since ${args.since}` : "all time",
    overrides,
    overridesByCheck,
    failures,
    failuresByCheck,
    agents,
    agentsByType,
    falsePositiveCount,
    recommendations,
  });
}

main();
