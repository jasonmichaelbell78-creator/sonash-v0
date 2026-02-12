#!/usr/bin/env node
/**
 * review-churn-tracker.js - PR Review Churn Metrics
 *
 * Tracks review churn metrics per PR using the `gh` CLI:
 * - Review fix ratio (review-fix commits / total commits)
 * - Review rounds per PR
 * - Appends results to .claude/state/review-metrics.jsonl
 *
 * Usage: node scripts/metrics/review-churn-tracker.js [options]
 *   --pr NUMBER     Analyze a specific PR
 *   --recent N      Analyze last N merged PRs (default: 5)
 *
 * npm script: npm run metrics:review-churn
 */

import { writeFileSync, mkdirSync, existsSync, lstatSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { sanitizeError } from "../lib/sanitize-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "..");

const STATE_DIR = join(ROOT, ".claude", "state");
const METRICS_FILE = join(STATE_DIR, "review-metrics.jsonl");

// Targets
const TARGET_FIX_RATIO = 0.25;
const TARGET_MAX_ROUNDS = 3;

// Patterns that indicate a commit is a review-fix
const FIX_PATTERNS = [
  /\bfix:/i,
  /\bPR\b/,
  /\breview\b/i,
  /\bfeedback\b/i,
  /\baddress\b/i,
  /\bresolve comment\b/i,
];

/**
 * Parse CLI arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { mode: "recent", value: 5 };

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--pr" && args[i + 1]) {
      opts.mode = "pr";
      opts.value = Number.parseInt(args[i + 1], 10);
      i += 1;
    } else if (args[i] === "--recent" && args[i + 1]) {
      opts.mode = "recent";
      opts.value = Number.parseInt(args[i + 1], 10);
      i += 1;
    } else if (args[i].startsWith("--pr=")) {
      opts.mode = "pr";
      opts.value = Number.parseInt(args[i].split("=")[1], 10);
    } else if (args[i].startsWith("--recent=")) {
      opts.mode = "recent";
      opts.value = Number.parseInt(args[i].split("=")[1], 10);
    }
  }

  if (Number.isNaN(opts.value) || opts.value < 1) {
    console.error("Invalid argument value. Must be a positive integer.");
    process.exit(2);
  }

  return opts;
}

/**
 * Execute gh CLI command and return parsed JSON
 */
function ghExec(args) {
  try {
    const result = execFileSync("gh", args, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 30_000,
    });
    return result.trim();
  } catch (err) {
    throw new Error(`gh command failed: ${sanitizeError(err)}`);
  }
}

/**
 * Get owner/repo from gh CLI
 */
function getRepoInfo() {
  try {
    const raw = ghExec(["repo", "view", "--json", "owner,name"]);
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to get repo info: ${sanitizeError(err)}`);
  }
}

/**
 * Fetch PR data including reviews
 */
function fetchPrData(prNumber) {
  const raw = ghExec(["pr", "view", String(prNumber), "--json", "commits,reviews,number,title"]);
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse PR data JSON for PR #${prNumber}: ${sanitizeError(err)}`);
  }
}

/**
 * Fetch detailed commits for a PR via the API
 */
function fetchPrCommits(owner, repo, prNumber) {
  const raw = ghExec(["api", `repos/${owner}/${repo}/pulls/${prNumber}/commits`, "--paginate"]);
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse commits JSON for PR #${prNumber}: ${sanitizeError(err)}`);
  }
}

/**
 * Get recent merged PR numbers
 */
function getRecentPRs(count) {
  const safeCount = String(Math.max(1, Math.min(count, 50)));
  const raw = ghExec(["pr", "list", "--state", "merged", "--limit", safeCount, "--json", "number"]);
  try {
    const prs = JSON.parse(raw);
    return prs.map((pr) => pr.number);
  } catch (err) {
    throw new Error(`Failed to parse PR list JSON: ${sanitizeError(err)}`);
  }
}

/**
 * Classify whether a commit message indicates a review fix
 */
function isFixCommit(message) {
  return FIX_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(message);
  });
}

/**
 * Count unique review rounds from review data
 */
function countReviewRounds(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  // Each submitted review event counts as a round
  const submitted = reviews.filter(
    (r) => r.state === "APPROVED" || r.state === "CHANGES_REQUESTED" || r.state === "COMMENTED"
  );
  // Group by unique (author, submittedAt date) to avoid counting inline comments as separate rounds
  const roundKeys = new Set();
  for (const r of submitted) {
    if (r.state === "COMMENTED" && !r.body) continue; // skip empty comments
    const date = r.submittedAt ? r.submittedAt.slice(0, 16) : "unknown";
    const author = r.author?.login || "unknown";
    roundKeys.add(`${author}-${date}`);
  }
  return roundKeys.size;
}

/**
 * Analyze a single PR and return metrics
 */
function analyzePr(prNumber, owner, repo) {
  console.log(`  Analyzing PR #${prNumber}...`);

  const prData = fetchPrData(prNumber);
  const commits = fetchPrCommits(owner, repo, prNumber);

  const totalCommits = commits.length;
  let fixCommits = 0;

  for (const commit of commits) {
    const message = commit.commit?.message || "";
    if (isFixCommit(message)) {
      fixCommits++;
    }
  }

  const fixRatio = totalCommits > 0 ? Math.round((fixCommits / totalCommits) * 100) / 100 : 0;
  const reviewRounds = countReviewRounds(prData.reviews);

  return {
    pr: prData.number,
    title: prData.title,
    total_commits: totalCommits,
    fix_commits: fixCommits,
    fix_ratio: fixRatio,
    review_rounds: reviewRounds,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Append metrics to JSONL file
 */
function appendMetrics(entries) {
  // Refuse if state directory is a symlink
  if (existsSync(STATE_DIR) && lstatSync(STATE_DIR).isSymbolicLink()) {
    console.error("Error: state directory is a symlink — refusing to write");
    return;
  }

  try {
    if (!existsSync(STATE_DIR)) {
      mkdirSync(STATE_DIR, { recursive: true });
    }
  } catch (err) {
    console.error(`Failed to create state directory: ${sanitizeError(err)}`);
    return;
  }

  // Verify target is not a symlink (prevent symlink-clobber attacks)
  try {
    if (lstatSync(METRICS_FILE).isSymbolicLink()) {
      console.error("Error: review-metrics.jsonl is a symlink — refusing to write");
      return;
    }
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? err.code : null;
    if (code !== "ENOENT") {
      console.error(`Failed to check metrics file: ${sanitizeError(err)}`);
      return;
    }
    // ENOENT is fine — file doesn't exist yet
  }

  const lines = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";

  try {
    writeFileSync(METRICS_FILE, lines, { encoding: "utf8", flag: "a" });
  } catch (err) {
    console.error(`Failed to write metrics file: ${sanitizeError(err)}`);
  }
}

/**
 * Format a single result row for the summary table.
 */
function formatResultRow(r) {
  const ratioOk = r.fix_ratio < TARGET_FIX_RATIO;
  const roundsOk = r.review_rounds < TARGET_MAX_ROUNDS;
  const pass = ratioOk && roundsOk;
  const status = pass ? "PASS" : "FAIL";

  const details = [];
  if (!ratioOk) details.push(`ratio >= ${TARGET_FIX_RATIO}`);
  if (!roundsOk) details.push(`rounds >= ${TARGET_MAX_ROUNDS}`);
  const detailStr = details.length > 0 ? ` (${details.join(", ")})` : "";

  const rawTitle = typeof r.title === "string" ? r.title : "";
  const title = rawTitle.length > 38 ? rawTitle.slice(0, 35) + "..." : rawTitle;
  const fixTotal = `${r.fix_commits}/${r.total_commits}`.padEnd(12);
  const line = `#${String(r.pr).padEnd(7)} ${title.padEnd(40)} ${fixTotal} ${String(r.fix_ratio).padEnd(8)} ${String(r.review_rounds).padEnd(8)} ${status}${detailStr}`;

  return { line, pass };
}

/**
 * Display summary with pass/fail indicators
 */
function displaySummary(results) {
  console.log("\n--- Review Churn Summary ---\n");
  console.log(
    `${"PR".padEnd(8)} ${"Title".padEnd(40)} ${"Fix/Total".padEnd(12)} ${"Ratio".padEnd(8)} ${"Rounds".padEnd(8)} Status`
  );
  console.log("-".repeat(90));

  let allPass = true;
  for (const r of results) {
    const { line, pass } = formatResultRow(r);
    if (!pass) allPass = false;
    console.log(line);
  }

  console.log("-".repeat(90));

  if (allPass) {
    console.log("\nAll PRs within targets (fix_ratio < 0.25, rounds < 3).");
  } else {
    console.log(`\nSome PRs exceed targets. Review workflow may need improvement.`);
  }
}

/**
 * Main entry point
 */
function main() {
  const opts = parseArgs();

  console.log("Review Churn Tracker");
  console.log("====================\n");

  let repoInfo;
  try {
    repoInfo = getRepoInfo();
  } catch (err) {
    console.error(`Error: ${sanitizeError(err)}`);
    console.error("Make sure `gh` CLI is installed and authenticated.");
    process.exit(2);
  }

  const { owner: ownerObj, name: repoName } = repoInfo;
  const owner = typeof ownerObj === "object" ? ownerObj.login : ownerObj;

  let prNumbers;
  if (opts.mode === "pr") {
    prNumbers = [opts.value];
  } else {
    console.log(`Fetching last ${opts.value} merged PRs...`);
    try {
      prNumbers = getRecentPRs(opts.value);
    } catch (err) {
      console.error(`Failed to fetch recent PRs: ${sanitizeError(err)}`);
      process.exit(2);
    }

    if (prNumbers.length === 0) {
      console.log("No merged PRs found.");
      process.exit(0);
    }
  }

  const results = [];
  for (const prNum of prNumbers) {
    try {
      const metrics = analyzePr(prNum, owner, repoName);
      results.push(metrics);
    } catch (err) {
      console.error(`  Failed to analyze PR #${prNum}: ${sanitizeError(err)}`);
    }
  }

  if (results.length === 0) {
    console.error("No PRs could be analyzed.");
    process.exit(1);
  }

  appendMetrics(results);
  displaySummary(results);

  console.log(`\nMetrics appended to ${METRICS_FILE}`);
}

main();
