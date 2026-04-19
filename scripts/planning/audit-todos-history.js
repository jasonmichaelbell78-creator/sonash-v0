/* global __dirname */
/**
 * audit-todos-history.js — diagnostic for historically-lost entries (T35)
 *
 * Walks git log of .planning/todos.jsonl and flags commits where the set
 * of entry IDs LOST a record (silent drop bug). T30 fixed forward protection;
 * this script looks backward to identify any prior damage.
 *
 * Detection: for each pair of consecutive commits touching the file, compute
 * the set of IDs present before and after. Any IDs present in "before" but
 * missing in "after" are flagged as a regression for that commit.
 *
 * Safety: uses execFileSync (not exec — no shell interpolation) with fixed
 * git argv arrays. All user input comes from git output, never from argv.
 *
 * Usage:
 *   node scripts/planning/audit-todos-history.js [--json] [--verbose]
 *
 * Exit codes: 0 = no regressions, 1 = regressions found, 2 = fatal error.
 *
 * Diagnostic only — does not auto-recover.
 */

"use strict";

const { execFileSync } = require("node:child_process");
const { resolve } = require("node:path");
const { safeParseLine } = require(resolve(__dirname, "..", "lib", "parse-jsonl-line"));
const { sanitizeError } = require(resolve(__dirname, "..", "lib", "security-helpers"));

const ROOT = resolve(__dirname, "..", "..");
const FILE = ".planning/todos.jsonl";
const args = new Set(process.argv.slice(2));
const jsonOutput = args.has("--json");
const verbose = args.has("--verbose");

function log(msg) {
  if (!jsonOutput) console.log(msg);
}

function vlog(msg) {
  if (verbose && !jsonOutput) console.log(`  [verbose] ${msg}`);
}

function runGitRead(argsArray) {
  try {
    return execFileSync("git", argsArray, {
      cwd: ROOT,
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch (err) {
    vlog(`git ${argsArray.join(" ")}: ${sanitizeError(err)}`);
    return null;
  }
}

function parsePipeRow(row) {
  // Parse `%H|%ct|%s` lines. Subject can itself contain `|`, so split on the
  // first two delimiters only and preserve the remainder as the subject.
  const first = row.indexOf("|");
  if (first === -1) return null;
  const second = row.indexOf("|", first + 1);
  if (second === -1) return null;
  return {
    sha: row.slice(0, first),
    ts: row.slice(first + 1, second),
    subject: row.slice(second + 1),
  };
}

function listCommitsTouchingFile() {
  const raw = runGitRead(["log", "--follow", "--format=%H|%ct|%s", "--", FILE]);
  if (!raw) return [];
  return raw
    .split("\n")
    .map((row) => {
      const parts = parsePipeRow(row);
      if (!parts || !parts.sha || !parts.ts) return null;
      return {
        sha: parts.sha,
        ts: Number.parseInt(parts.ts, 10) * 1000,
        subject: parts.subject.slice(0, 120),
      };
    })
    .filter(Boolean)
    .reverse();
}

function extractIdsAtCommit(sha) {
  const raw = runGitRead(["show", `${sha}:${FILE}`]);
  if (raw === null) return null;
  const ids = new Set();
  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const entry = safeParseLine(line);
    if (entry && typeof entry.id === "string") {
      ids.add(entry.id);
    }
  }
  return ids;
}

function idNumericKey(id) {
  const m = /^T(\d+)/.exec(id);
  return m ? Number.parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

function diffIds(before, after) {
  const lost = [];
  for (const id of before) {
    if (!after.has(id)) lost.push(id);
  }
  lost.sort((a, b) => idNumericKey(a) - idNumericKey(b));
  return lost;
}

function buildRegression(commit, prevCommit, prevIds, ids, lost) {
  return {
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 8),
    subject: commit.subject,
    ts: commit.ts,
    iso: new Date(commit.ts).toISOString(),
    prevSha: prevCommit?.sha,
    prevShortSha: prevCommit?.sha.slice(0, 8),
    prevSubject: prevCommit?.subject,
    lost,
    lostCount: lost.length,
    prevTotal: prevIds.size,
    currentTotal: ids.size,
  };
}

function scanForRegressions(commits) {
  const regressions = [];
  let prevIds = null;
  let prevCommit = null;

  for (const commit of commits) {
    const ids = extractIdsAtCommit(commit.sha);
    if (ids === null) {
      vlog(`skipping ${commit.sha.slice(0, 8)} (cannot read file)`);
      continue;
    }
    if (prevIds !== null) {
      const lost = diffIds(prevIds, ids);
      if (lost.length > 0) {
        regressions.push(buildRegression(commit, prevCommit, prevIds, ids, lost));
      }
    }
    prevIds = ids;
    prevCommit = commit;
  }

  return { regressions, finalIds: prevIds };
}

function buildSummary(commits, regressions, finalIds) {
  return {
    commitsScanned: commits.length,
    regressionCount: regressions.length,
    totalLostIds: regressions.reduce((sum, r) => sum + r.lostCount, 0),
    currentMaxId: finalIds
      ? [...finalIds].reduce((max, id) => Math.max(max, idNumericKey(id)), 0)
      : null,
    currentTotal: finalIds ? finalIds.size : null,
  };
}

function formatLostList(lost) {
  const head = lost.slice(0, 10).join(", ");
  const suffix = lost.length > 10 ? ", ..." : "";
  return head + suffix;
}

function renderRegression(r) {
  log(`  ${r.shortSha} (${r.iso.slice(0, 10)}): ${r.subject}`);
  log(`     Lost ${r.lostCount} ID(s): ${formatLostList(r.lost)}`);
  log(`     Before: ${r.prevTotal} todos → After: ${r.currentTotal} todos`);
  log(`     Predecessor: ${r.prevShortSha ?? "?"} (${r.prevSubject ?? "?"})`);
  log("");
}

function renderReport(regressions, summary, commitsCount) {
  if (jsonOutput) {
    console.log(JSON.stringify({ summary, regressions }, null, 2));
    return;
  }
  if (regressions.length === 0) {
    log(`✅ No ID regressions detected across ${commitsCount} commits`);
    log(`   Current: ${summary.currentTotal} todos, last ID T${summary.currentMaxId ?? "?"}`);
    return;
  }
  log(
    `⚠️  ${regressions.length} commit(s) dropped todo IDs (total ${summary.totalLostIds} IDs lost):`
  );
  log("");
  for (const r of regressions) renderRegression(r);
  log("Run with --json for machine-readable output.");
}

function main() {
  const commits = listCommitsTouchingFile();
  if (commits.length === 0) {
    log("No commits touch .planning/todos.jsonl (or git not available)");
    process.exit(0);
  }

  log(`Scanning ${commits.length} commits that touch ${FILE}...`);
  log("");

  const { regressions, finalIds } = scanForRegressions(commits);
  const summary = buildSummary(commits, regressions, finalIds);
  renderReport(regressions, summary, commits.length);

  process.exit(regressions.length > 0 ? 1 : 0);
}

module.exports = {
  parsePipeRow,
  listCommitsTouchingFile,
  extractIdsAtCommit,
  idNumericKey,
  diffIds,
  buildRegression,
  scanForRegressions,
  buildSummary,
  formatLostList,
  renderRegression,
  renderReport,
};

if (require.main === module) {
  main();
}
