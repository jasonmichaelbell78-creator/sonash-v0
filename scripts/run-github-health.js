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
 *   node scripts/run-github-health.js --override  # Skip dedup guard
 *
 * Exit codes:
 *   0 = Success (GREEN or YELLOW with no API errors)
 *   1 = RED (critical issues)
 *   2 = API failure / partial data
 */

"use strict";

const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");

// -- Imports (fail-loud on missing critical helpers) --------------------------

// sanitize-error: use the canonical .cjs wrapper. The ESM source cannot be
// loaded via require() in this CJS script — the .cjs wrapper is the supported
// entry point. Any failure here means the repo is in a broken state.
const { sanitizeError } = require("./lib/sanitize-error.cjs");

// safe-fs: required for symlink-guarded JSONL append. No silent fallback —
// a fallback that writes without lstat-checking symlinks would reintroduce
// the attack vector safe-fs was built to prevent.
const { safeAppendFileSync } = require("./lib/safe-fs");

let readJsonl;
try {
  readJsonl = require("./lib/read-jsonl");
} catch {
  // read-jsonl is optional — dedup simply becomes a no-op on first run.
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

// Allowlist for repo owner/name — matches GitHub's own allowed character set.
// Rejects quotes, control characters, and anything that could break out of
// a GraphQL variable or REST path segment.
const SLUG_ALLOWLIST = /^[A-Za-z0-9._-]+$/;

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
 * Parse a GitHub remote URL into {owner, name}. Extracted so it is unit-testable
 * without invoking `git remote`.
 *
 * Supports:
 *   https://github.com/owner/repo(.git)?
 *   git@github.com:owner/repo(.git)?
 *   Repo names containing dots (e.g. rest.js) — only a trailing ".git" is stripped.
 *
 * Returns null if the URL is not a recognised GitHub remote or the parsed
 * owner/name contain disallowed characters.
 */
function parseRepoSlug(remote) {
  // Unified regex: HTTPS ("/") or SSH (":"); lazy name capture + optional .git suffix.
  const match = /github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/.exec(remote);
  if (!match) return null;
  const owner = match[1];
  const name = match[2];
  if (!SLUG_ALLOWLIST.test(owner) || !SLUG_ALLOWLIST.test(name)) return null;
  return { owner, name };
}

/**
 * Detect repo owner/name from git remote. Never echoes the full remote URL
 * on failure — only a sanitized error and a generic signal, so credentials or
 * private URLs in the remote string are not written to logs.
 */
function getRepoSlug() {
  let remote;
  try {
    remote = execFileSync("git", ["remote", "get-url", "origin"], {
      encoding: "utf8",
      timeout: 5000,
      windowsHide: true,
    }).trim();
  } catch (err) {
    throw new Error(`Cannot detect repo (git remote lookup failed): ${sanitizeError(err)}`);
  }
  const slug = parseRepoSlug(remote);
  if (!slug) {
    throw new Error("Cannot detect repo: unrecognized or invalid origin remote format");
  }
  return slug;
}

/**
 * Check dedup guard — skip if last run was < DEDUP_MINUTES ago.
 * Returns last entry or null. Validates the stored timestamp before arithmetic
 * so a corrupt history entry cannot cause a silent NaN comparison.
 */
function checkDedup() {
  try {
    const entries = readJsonl(HISTORY_FILE, { safe: true, quiet: true });
    if (entries.length === 0) return null;
    const last = entries[entries.length - 1];
    if (!last?.timestamp) return null;

    const lastMs = new Date(last.timestamp).getTime();
    if (!Number.isFinite(lastMs)) return null;

    const elapsed = (Date.now() - lastMs) / 60000;
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

// -- API fetchers (extracted from main for CC reduction) ---------------------

/**
 * 4a. Core Health Snapshot via GraphQL. Uses query variables (not string
 * interpolation) so owner/name cannot break out of the query structure.
 */
function fetchCoreSnapshot(repo) {
  const query = `query CoreHealthSnapshot($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    vulnerabilityAlerts(states: OPEN, first: 100) {
      totalCount
      nodes { securityVulnerability { severity } }
    }
    defaultBranchRef {
      name
      target {
        ... on Commit {
          statusCheckRollup { state }
        }
      }
    }
    refs(refPrefix: "refs/heads/", first: 100) { totalCount }
    issues(states: OPEN) { totalCount }
    pullRequests(states: OPEN, first: 50) {
      totalCount
      nodes {
        number title createdAt updatedAt isDraft
        author { login }
      }
    }
    deleteBranchOnMerge
    repositoryTopics(first: 10) { nodes { topic { name } } }
    isPrivate
  }
}`;

  const raw = gh(
    [
      "api",
      "graphql",
      "-f",
      `query=${query}`,
      "-f",
      `owner=${repo.owner}`,
      "-f",
      `name=${repo.name}`,
    ],
    { json: true }
  );
  return raw.data.repository;
}

/**
 * 4b. Secret scanning alerts count via REST with pagination. Lists every open
 * alert number and counts the lines, so pagination is honoured end-to-end.
 * A 404 is NOT silently mapped to 0 — the caller pushes an error instead.
 */
function fetchSecretAlertsCount(repo) {
  const result = gh(
    [
      "api",
      "--paginate",
      `repos/${repo.owner}/${repo.name}/secret-scanning/alerts?state=open&per_page=100`,
      "--jq",
      ".[].number",
    ],
    { timeout: 10000 }
  );
  const trimmed = result.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\r?\n/).length;
}

/**
 * 4c. Actions cache usage via REST.
 */
function fetchCacheUsage(repo) {
  return gh(["api", `repos/${repo.owner}/${repo.name}/actions/cache/usage`], {
    json: true,
    timeout: 5000,
  });
}

// -- Analyzers (extracted for CC reduction) ----------------------------------

function analyzeDependabot(snapshot, issues, details) {
  const depAlerts = snapshot.vulnerabilityAlerts;
  if (!depAlerts || depAlerts.totalCount <= 0) return;

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

function analyzeCIState(snapshot, issues, details) {
  const ciState = snapshot.defaultBranchRef?.target?.statusCheckRollup?.state;
  if (ciState === "FAILURE" || ciState === "ERROR") {
    issues.p0++;
    details.push(`  P0  CI ${ciState.toLowerCase()} on main`);
  }
  return ciState;
}

function analyzeStalePRs(snapshot, issues, details) {
  const prs = snapshot.pullRequests;
  if (!prs || prs.totalCount <= 0) return;

  const now = Date.now();
  let stalePRs = 0;
  let invalidDates = 0;
  for (const pr of prs.nodes || []) {
    // Use updatedAt (activity) rather than createdAt (creation) so long-running
    // but actively maintained PRs are not flagged as stale.
    const basisTs = pr.updatedAt || pr.createdAt;
    const basisMs = basisTs ? new Date(basisTs).getTime() : NaN;
    if (!Number.isFinite(basisMs)) {
      invalidDates++;
      continue;
    }
    const ageDays = (now - basisMs) / 86400000;
    const isBot = pr.author?.login === "dependabot[bot]";
    const threshold = isBot ? STALE_PR_DAYS_BOT : STALE_PR_DAYS_HUMAN;
    if (ageDays > threshold) stalePRs++;
  }
  if (invalidDates > 0) {
    issues.p2 += invalidDates;
    details.push(`  P2  ${invalidDates} PR(s) had invalid timestamps (staleness uncertain)`);
  }
  if (stalePRs > 0) {
    issues.p2 += stalePRs;
    details.push(`  P2  ${stalePRs} stale PR(s)`);
  }
}

function analyzeConfigHygiene(snapshot, issues, details) {
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

function analyzeSecretAlerts(secretCount, issues, details) {
  if (secretCount !== null && secretCount > 0) {
    issues.p1 += secretCount;
    details.push(`  P1  ${secretCount} open secret scanning alert(s)`);
  }
}

function analyzeCacheUsage(cacheData, issues, details) {
  if (!cacheData) return null;

  const sizeBytesRaw = cacheData.active_caches_size_in_bytes;
  const sizeBytes = typeof sizeBytesRaw === "number" ? sizeBytesRaw : Number(sizeBytesRaw);

  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    issues.p2++;
    details.push("  P2  Actions cache usage unavailable (invalid API response)");
    return null;
  }

  const cachePercent = Math.round((sizeBytes / CACHE_LIMIT_BYTES) * 100);
  if (cachePercent >= 80) {
    issues.p2++;
    details.push(
      `  P2  Actions cache ${cachePercent}% full (${cacheData.active_caches_count} caches)`
    );
  }
  return cachePercent;
}

// -- Output + trend detection ------------------------------------------------

function buildSummaryParts(snapshot, issues, cachePercent) {
  const ciState = snapshot?.defaultBranchRef?.target?.statusCheckRollup?.state;
  // Single literal array avoids repeated Array#push() calls (SonarCloud S6661).
  const parts = [
    `${issues.p0} P0`,
    `CI ${ciState ? ciState.toLowerCase() : "unknown"}`,
    `${snapshot?.pullRequests?.totalCount ?? "?"} open PRs`,
  ];
  if (cachePercent !== null) parts.push(`cache ${cachePercent}%`);
  return parts;
}

function printResult({ color, grade, totalIssues, parts, details, errors }) {
  // Every entry in errors[] was pre-sanitized at construction time in main().
  if (color === "GREEN") {
    console.log(`GitHub: ${color} (${parts.join(", ")})`);
    // Even GREEN runs report API errors so silent failures can be noticed.
    for (const e of errors) console.log(`  !!  ${e}`);
    return;
  }
  console.log(
    `GitHub: ${color} -- grade ${grade} (${totalIssues} issue${totalIssues !== 1 ? "s" : ""})`
  );
  for (const d of details) console.log(d);
  for (const e of errors) console.log(`  !!  ${e}`);
  console.log("  -> Run /github-health for full assessment and fixes");
}

function detectGradeDropTrend(lastEntry, grade) {
  if (!lastEntry.grade) return null;
  if (grade === lastEntry.grade) return null;
  const gradeOrder = "ABCDF";
  const prev = gradeOrder.indexOf(lastEntry.grade);
  const curr = gradeOrder.indexOf(grade);
  if (prev < 0 || curr < 0) return null;
  if (curr - prev < 2) return null;
  return `Grade dropped ${lastEntry.grade} -> ${grade}`;
}

function detectCacheGrowthTrend(lastEntry, cachePercent) {
  if (lastEntry.cachePercent == null || cachePercent == null) return null;
  const delta = cachePercent - lastEntry.cachePercent;
  if (delta < 20) return null;
  return `Cache grew +${delta}% (${lastEntry.cachePercent}% -> ${cachePercent}%)`;
}

function detectPrAccumulationTrend(lastEntry, snapshot) {
  const currentPRs = snapshot?.pullRequests?.totalCount ?? 0;
  const prevPRs = lastEntry.openPRs ?? 0;
  if (currentPRs - prevPRs < 3) return null;
  return `+${currentPRs - prevPRs} open PRs (${prevPRs} -> ${currentPRs})`;
}

function detectNewP0Trend(lastEntry, issues) {
  const prevP0 = lastEntry.issues?.p0 ?? 0;
  if (issues.p0 <= 0 || prevP0 !== 0) return null;
  return `New P0 issue(s) detected (${issues.p0} P0)`;
}

function detectTrends(lastEntry, snapshot, cachePercent, grade, issues) {
  if (!lastEntry) return [];
  const candidates = [
    detectGradeDropTrend(lastEntry, grade),
    detectCacheGrowthTrend(lastEntry, cachePercent),
    detectPrAccumulationTrend(lastEntry, snapshot),
    detectNewP0Trend(lastEntry, issues),
  ];
  return candidates.filter((t) => t !== null);
}

/**
 * Compute an 8-char SHA-256 hash of the local username for attribution without
 * storing raw PII. Wrapped in try/catch because os.userInfo() can throw in some
 * CI containers.
 */
function resolveActorHash() {
  let username = process.env.USER || process.env.USERNAME || "";
  if (!username) {
    try {
      username = os.userInfo().username || "";
    } catch {
      // os.userInfo() can throw EACCES/ENOENT in restricted CI containers.
      username = "";
    }
  }
  if (!username) return "unknown";
  return crypto.createHash("sha256").update(username).digest("hex").slice(0, 8);
}

function buildHistoryRecord({
  grade,
  color,
  issues,
  totalIssues,
  cachePercent,
  snapshot,
  secretCount,
  ciState,
  errors,
}) {
  return {
    timestamp: new Date().toISOString(),
    // Actor attribution via SHA-256 hash (first 8 chars) — preserves audit
    // trail correlation without storing raw username (PII). Hash is stable
    // per-user so entries are still attributable across runs.
    actor: resolveActorHash(),
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
}

function writeHistoryRecord(record) {
  try {
    // Symlink guard on STATE_DIR parent — refuse to create state dir if the
    // parent has been replaced with a symlink (attacker redirect). Use lstat
    // so symlinks themselves are detected, not followed.
    const parentDir = path.dirname(STATE_DIR);
    try {
      const parentStat = fs.lstatSync(parentDir);
      if (parentStat.isSymbolicLink()) {
        console.error("  !!  History write refused: state parent dir is a symlink");
        return;
      }
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
      // Parent missing is fine — recursive mkdirSync will create it.
    }
    // Direct mkdirSync with {recursive:true} is idempotent — no existsSync
    // pre-check needed (and pre-checks introduce TOCTOU races).
    fs.mkdirSync(STATE_DIR, { recursive: true });
    safeAppendFileSync(HISTORY_FILE, JSON.stringify(record) + "\n");
  } catch (err) {
    // Non-fatal: history write failure shouldn't block output.
    console.error(`  !!  History write failed: ${sanitizeError(err)}`);
  }
}

function runApiCalls(repo) {
  const errors = [];
  let snapshot = null;
  try {
    snapshot = fetchCoreSnapshot(repo);
  } catch (err) {
    errors.push(`GraphQL snapshot: ${sanitizeError(err)}`);
  }

  let secretCount = null;
  try {
    secretCount = fetchSecretAlertsCount(repo);
  } catch (err) {
    // Do NOT silently map 404 → 0. A missing endpoint (scope issue or
    // scanning disabled) is reported as uncertain so output reflects it.
    errors.push(`Secret scanning: ${sanitizeError(err)}`);
    secretCount = null;
  }

  let cacheData = null;
  try {
    cacheData = fetchCacheUsage(repo);
  } catch (err) {
    errors.push(`Cache usage: ${sanitizeError(err)}`);
  }

  return { snapshot, secretCount, cacheData, errors };
}

function analyzeSnapshot(snapshot, issues, details) {
  // A null snapshot is itself a P2 issue — prevents falsely reporting GREEN
  // when the core GraphQL call failed.
  if (!snapshot) {
    issues.p2++;
    details.push("  P2  Core GraphQL snapshot unavailable (partial health data)");
    return null;
  }
  analyzeDependabot(snapshot, issues, details);
  const ciState = analyzeCIState(snapshot, issues, details);
  analyzeStalePRs(snapshot, issues, details);
  analyzeConfigHygiene(snapshot, issues, details);
  return ciState;
}

function ensureGhAvailable() {
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
}

function resolveRepoOrExit() {
  try {
    return getRepoSlug();
  } catch (err) {
    console.error(`GitHub: ERROR (${sanitizeError(err)})`);
    process.exit(1);
  }
}

// -- Main ---------------------------------------------------------------------

function main() {
  ensureGhAvailable();
  const lastEntry = checkDedup();
  const repo = resolveRepoOrExit();

  const { snapshot, secretCount, cacheData, errors } = runApiCalls(repo);

  const issues = { p0: 0, p1: 0, p2: 0, p3: 0 };
  const details = [];

  const ciState = analyzeSnapshot(snapshot, issues, details);
  analyzeSecretAlerts(secretCount, issues, details);
  const cachePercent = analyzeCacheUsage(cacheData, issues, details);

  const grade = computeGrade(issues);
  const color = gradeToColor(grade);
  const totalIssues = issues.p0 + issues.p1 + issues.p2 + issues.p3;
  const parts = buildSummaryParts(snapshot, issues, cachePercent);
  printResult({ color, grade, totalIssues, parts, details, errors });

  const trends = detectTrends(lastEntry, snapshot, cachePercent, grade, issues);
  if (trends.length > 0) {
    console.log("  Trends:");
    for (const t of trends) console.log(`     ${t}`);
  }

  const record = buildHistoryRecord({
    grade,
    color,
    issues,
    totalIssues,
    cachePercent,
    snapshot,
    secretCount,
    ciState,
    errors,
  });
  writeHistoryRecord(record);

  // Exit codes:
  //   1 = RED (critical issues)
  //   2 = API failure / partial data (any errors[] even on GREEN/YELLOW)
  //   0 = GREEN/YELLOW with no API errors
  if (color === "RED") process.exit(1);
  if (errors.length > 0) process.exit(2);
}

// Exported for unit tests. The CLI entrypoint only runs when invoked directly
// (require.main === module) so test files can `require()` the module safely.
if (require.main === module) {
  main();
}

module.exports = {
  parseRepoSlug,
  computeGrade,
  gradeToColor,
  buildHistoryRecord,
  detectTrends,
};
