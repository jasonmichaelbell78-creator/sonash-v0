#!/usr/bin/env node
/* global __dirname */
/**
 * run-github-health.js — Quick GitHub health check for session-begin
 *
 * Runs 3 API calls (1 GraphQL + 2 REST) in <2 seconds.
 * Outputs single-line GREEN or multi-line YELLOW/RED.
 * Appends results to github-health-history.jsonl for trend tracking.
 *
 * Usage:
 *   node scripts/run-github-health.js --quick     # Default: quick health check
 *   node scripts/run-github-health.js --override   # Skip dedup guard
 *
 * Exit codes:
 *   0 = Success (GREEN or YELLOW)
 *   1 = RED or Error (critical issues or API failure)
 */

"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// -- Imports ------------------------------------------------------------------

let safeAppendFileSync;
try {
  ({ safeAppendFileSync } = require("./lib/safe-fs"));
} catch {
  // Fallback: direct append (non-critical for append-only JSONL)
  safeAppendFileSync = (p, data) => fs.appendFileSync(p, data, "utf8");
}

let sanitizeError;
try {
  ({ sanitizeError } = require("./lib/sanitize-error"));
} catch {
  sanitizeError = (e) => (e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200));
}

let readJsonl;
try {
  readJsonl = require("./lib/read-jsonl");
} catch {
  readJsonl = () => [];
}

// -- Paths --------------------------------------------------------------------

const ROOT_DIR = path.join(__dirname, "..");
const STATE_DIR = path.join(ROOT_DIR, ".claude", "state");
const HISTORY_FILE = path.join(STATE_DIR, "github-health-history.jsonl");

// -- Config -------------------------------------------------------------------

const DEDUP_MINUTES = 30;
const CACHE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB GitHub limit
const STALE_PR_DAYS_HUMAN = 7;
const STALE_PR_DAYS_BOT = 3;

// -- Args ---------------------------------------------------------------------

const args = process.argv.slice(2);
const overrideDedup = args.includes("--override");

// -- Helpers ------------------------------------------------------------------

/**
 * Run gh CLI command, return stdout. Throws on failure.
 * Uses execFileSync (array args, no shell injection).
 */
function gh(ghArgs, { json = false, timeout = 10000 } = {}) {
  const result = execFileSync("gh", ghArgs, {
    encoding: "utf8",
    timeout,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  if (json) {
    try {
      return JSON.parse(result);
    } catch {
      throw new Error(`Failed to parse gh JSON output for: gh ${ghArgs.join(" ")}`);
    }
  }
  return result;
}

/**
 * Detect repo owner/name from git remote.
 */
function getRepoSlug() {
  try {
    const remote = execFileSync("git", ["remote", "get-url", "origin"], {
      encoding: "utf8",
      timeout: 5000,
      windowsHide: true,
    }).trim();
    // Handle HTTPS: https://github.com/owner/repo.git
    const httpsMatch = /github\.com\/([^/]+)\/([^/.]+)/.exec(remote);
    if (httpsMatch) return { owner: httpsMatch[1], name: httpsMatch[2] };
    // Handle SSH: git@github.com:owner/repo.git
    const sshMatch = /github\.com:([^/]+)\/([^/.]+)/.exec(remote);
    if (sshMatch) return { owner: sshMatch[1], name: sshMatch[2] };
    throw new Error(`Unrecognized remote format: ${remote}`);
  } catch (err) {
    throw new Error(`Cannot detect repo: ${sanitizeError(err)}`);
  }
}

/**
 * Check dedup guard — skip if last run was < DEDUP_MINUTES ago.
 * Returns last entry or null.
 */
function checkDedup() {
  try {
    const entries = readJsonl(HISTORY_FILE, { safe: true, quiet: true });
    if (entries.length === 0) return null;
    const last = entries[entries.length - 1];
    if (!last || !last.timestamp) return null;
    const elapsed = (Date.now() - new Date(last.timestamp).getTime()) / 60000;
    if (elapsed < DEDUP_MINUTES && !overrideDedup) {
      const mins = Math.round(elapsed);
      console.log(
        `GitHub: SKIPPED (last check ${mins}m ago, <${DEDUP_MINUTES}m threshold). Use --override to force.`
      );
      process.exit(0);
    }
    return last;
  } catch {
    return null; // No history = first run
  }
}

// -- Grading ------------------------------------------------------------------

/**
 * Grade based on issue counts by priority. (Decision #10)
 * A=0 issues, B=P3 only, C=1-2 P2, D=any P1 or 3+ P2, F=any P0
 */
function computeGrade(counts) {
  if (counts.p0 > 0) return "F";
  if (counts.p1 > 0 || counts.p2 >= 3) return "D";
  if (counts.p2 > 0) return "C";
  if (counts.p3 > 0) return "B";
  return "A";
}

function gradeToColor(grade) {
  if (grade === "A" || grade === "B") return "GREEN";
  if (grade === "C") return "YELLOW";
  return "RED";
}

// -- Main ---------------------------------------------------------------------

function main() {
  // 1. Check gh is available
  try {
    execFileSync("gh", ["--version"], {
      encoding: "utf8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
  } catch {
    console.error("GitHub: UNAVAILABLE (gh CLI not found)");
    process.exit(1);
  }

  // 2. Dedup guard (Decision #9)
  const lastEntry = checkDedup();

  // 3. Detect repo
  let repo;
  try {
    repo = getRepoSlug();
  } catch (err) {
    console.error(`GitHub: ERROR (${sanitizeError(err)})`);
    process.exit(1);
  }

  // 4. Run API calls — 1 GraphQL + 2 REST
  const issues = { p0: 0, p1: 0, p2: 0, p3: 0 };
  const details = [];
  const errors = [];

  let snapshot = null;
  let cacheData = null;
  let secretCount = null;

  // 4a. Core Health Snapshot (GraphQL)
  try {
    const query = [
      "query {",
      `  repository(owner: "${repo.owner}", name: "${repo.name}") {`,
      "    vulnerabilityAlerts(states: OPEN, first: 100) {",
      "      totalCount",
      "      nodes { securityVulnerability { severity } }",
      "    }",
      "    defaultBranchRef {",
      "      name",
      "      target {",
      "        ... on Commit {",
      "          statusCheckRollup { state }",
      "        }",
      "      }",
      "    }",
      '    refs(refPrefix: "refs/heads/", first: 100) { totalCount }',
      "    issues(states: OPEN) { totalCount }",
      "    pullRequests(states: OPEN, first: 50) {",
      "      totalCount",
      "      nodes {",
      "        number title createdAt isDraft",
      "        author { login }",
      "      }",
      "    }",
      "    deleteBranchOnMerge",
      "    repositoryTopics(first: 10) { nodes { topic { name } } }",
      "    isPrivate",
      "  }",
      "}",
    ].join("\n");

    const raw = gh(["api", "graphql", "-f", `query=${query}`], { json: true });
    snapshot = raw.data.repository;
  } catch (err) {
    errors.push(`GraphQL snapshot: ${sanitizeError(err)}`);
  }

  // 4b. Secret scanning alerts count (REST)
  try {
    const result = gh(
      [
        "api",
        `repos/${repo.owner}/${repo.name}/secret-scanning/alerts?state=open`,
        "--jq",
        "length",
      ],
      { timeout: 5000 }
    );
    secretCount = parseInt(result.trim(), 10);
    if (Number.isNaN(secretCount)) secretCount = null;
  } catch (err) {
    // Secret scanning may return 404 if not enabled
    const errStr = sanitizeError(err);
    if (/404/.test(errStr)) {
      secretCount = 0;
    } else {
      errors.push(`Secret scanning: ${errStr}`);
    }
  }

  // 4c. Actions cache usage (REST)
  try {
    cacheData = gh(["api", `repos/${repo.owner}/${repo.name}/actions/cache/usage`], {
      json: true,
      timeout: 5000,
    });
  } catch (err) {
    errors.push(`Cache usage: ${sanitizeError(err)}`);
  }

  // 5. Analyze results
  if (snapshot) {
    // Dependabot alerts by severity
    const depAlerts = snapshot.vulnerabilityAlerts;
    if (depAlerts && depAlerts.totalCount > 0) {
      let critHigh = 0;
      let medLow = 0;
      for (const node of depAlerts.nodes || []) {
        const sev = node.securityVulnerability?.severity;
        if (sev === "CRITICAL" || sev === "HIGH") critHigh++;
        else medLow++;
      }
      if (critHigh > 0) {
        issues.p0 += critHigh;
        details.push(`  P0  ${critHigh} critical/high Dependabot alert(s)`);
      }
      if (medLow > 0) {
        issues.p2 += medLow;
        details.push(`  P2  ${medLow} medium/low Dependabot alert(s)`);
      }
    }

    // CI status on main
    const ciState = snapshot.defaultBranchRef?.target?.statusCheckRollup?.state;
    if (ciState === "FAILURE" || ciState === "ERROR") {
      issues.p0++;
      details.push(`  P0  CI ${ciState.toLowerCase()} on main`);
    }

    // Stale PRs
    const prs = snapshot.pullRequests;
    if (prs && prs.totalCount > 0) {
      const now = Date.now();
      let stalePRs = 0;
      for (const pr of prs.nodes || []) {
        const ageDays = (now - new Date(pr.createdAt).getTime()) / 86400000;
        const isBot = pr.author?.login === "dependabot[bot]";
        const threshold = isBot ? STALE_PR_DAYS_BOT : STALE_PR_DAYS_HUMAN;
        if (ageDays > threshold) stalePRs++;
      }
      if (stalePRs > 0) {
        issues.p2 += stalePRs;
        details.push(`  P2  ${stalePRs} stale PR(s)`);
      }
    }

    // Config hygiene (P3 signals)
    if (!snapshot.deleteBranchOnMerge) {
      issues.p3++;
      details.push("  P3  deleteBranchOnMerge disabled");
    }
    const topics = snapshot.repositoryTopics?.nodes || [];
    if (topics.length === 0) {
      issues.p3++;
      details.push("  P3  No repo topics configured");
    }
  }

  // Secret scanning alerts
  if (secretCount !== null && secretCount > 0) {
    issues.p1 += secretCount;
    details.push(`  P1  ${secretCount} open secret scanning alert(s)`);
  }

  // Cache utilization
  let cachePercent = null;
  if (cacheData) {
    const sizeBytes = cacheData.active_caches_size_in_bytes || 0;
    cachePercent = Math.round((sizeBytes / CACHE_LIMIT_BYTES) * 100);
    if (cachePercent >= 80) {
      issues.p2++;
      details.push(
        `  P2  Actions cache ${cachePercent}% full (${cacheData.active_caches_count} caches)`
      );
    }
  }

  // 6. Compute grade and output (Decision #20)
  const grade = computeGrade(issues);
  const color = gradeToColor(grade);
  const totalIssues = issues.p0 + issues.p1 + issues.p2 + issues.p3;

  // Build summary components
  const ciState = snapshot?.defaultBranchRef?.target?.statusCheckRollup?.state;
  const parts = [];
  parts.push(`${issues.p0} P0`);
  parts.push(`CI ${ciState ? ciState.toLowerCase() : "unknown"}`);
  parts.push(`${snapshot?.pullRequests?.totalCount ?? "?"} open PRs`);
  if (cachePercent !== null) parts.push(`cache ${cachePercent}%`);

  if (color === "GREEN") {
    console.log(`GitHub: ${color} (${parts.join(", ")})`);
  } else {
    console.log(
      `GitHub: ${color} -- grade ${grade} (${totalIssues} issue${totalIssues !== 1 ? "s" : ""})`
    );
    for (const d of details) console.log(d);
    if (errors.length > 0) {
      for (const e of errors) console.log(`  !!  ${e}`);
    }
    console.log("  -> Run /github-health for full assessment and fixes");
  }

  // Report API errors even on GREEN
  if (color === "GREEN" && errors.length > 0) {
    for (const e of errors) console.log(`  !!  ${e}`);
  }

  // 7. Trend detection (Decision #14)
  if (lastEntry) {
    const trends = [];
    if (lastEntry.grade && grade !== lastEntry.grade) {
      const gradeOrder = "ABCDF";
      const prev = gradeOrder.indexOf(lastEntry.grade);
      const curr = gradeOrder.indexOf(grade);
      if (curr - prev >= 2) {
        trends.push(`Grade dropped ${lastEntry.grade} -> ${grade}`);
      }
    }
    if (lastEntry.cachePercent != null && cachePercent != null) {
      if (cachePercent - lastEntry.cachePercent >= 20) {
        trends.push(
          `Cache grew +${cachePercent - lastEntry.cachePercent}% (${lastEntry.cachePercent}% -> ${cachePercent}%)`
        );
      }
    }
    // PR accumulation: +3 open PRs since last run
    const currentPRs = snapshot?.pullRequests?.totalCount ?? 0;
    const prevPRs = lastEntry.openPRs ?? 0;
    if (currentPRs - prevPRs >= 3) {
      trends.push(`+${currentPRs - prevPRs} open PRs (${prevPRs} -> ${currentPRs})`);
    }
    // New P0: any P0 that wasn't in last run
    const prevP0 = lastEntry.issues?.p0 ?? 0;
    if (issues.p0 > 0 && prevP0 === 0) {
      trends.push(`New P0 issue(s) detected (${issues.p0} P0)`);
    }
    if (trends.length > 0) {
      console.log("  Trends:");
      for (const t of trends) console.log(`     ${t}`);
    }
  }

  // 8. Append to history JSONL (Decision #9)
  const record = {
    timestamp: new Date().toISOString(),
    mode: "quick",
    grade,
    color,
    issues,
    totalIssues,
    cachePercent,
    openPRs: snapshot?.pullRequests?.totalCount ?? null,
    depAlerts: snapshot?.vulnerabilityAlerts?.totalCount ?? null,
    secretAlerts: secretCount,
    branches: snapshot?.refs?.totalCount ?? null,
    ciState: ciState || null,
    errors: errors.length > 0 ? errors : undefined,
  };

  try {
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    safeAppendFileSync(HISTORY_FILE, JSON.stringify(record) + "\n", "utf8");
  } catch (err) {
    // Non-fatal: history write failure shouldn't block output
    console.error(`  !!  History write failed: ${sanitizeError(err)}`);
  }

  // Exit code: 0=GREEN/YELLOW, 1=RED, 2=error
  if (color === "RED") process.exit(1);
}

main();
