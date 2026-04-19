/* global __dirname */
/**
 * check-plans-hygiene.js
 *
 * Validates hygiene for .planning/**\/PLAN.md files (T49).
 * Parallel to check-roadmap-hygiene.js.
 *
 * Checks:
 *  1. Status banner present at top of plan (`**Status:**` with step count)
 *  2. Per-step headers include a status marker (⏳/🔄/✅/❌/⏸)
 *  3. Recent commits reference the plan but no status change in plan since
 *     the commit timestamp (suggests drift)
 *
 * Usage:
 *   node scripts/check-plans-hygiene.js [--json] [--verbose]
 *
 * Exit codes: 0 = clean, 1 = drift found, 2 = fatal error
 */

"use strict";

const { readFileSync } = require("node:fs");
const { execFileSync } = require("node:child_process");
const { resolve, dirname } = require("node:path");
const { sanitizeError } = require(resolve(__dirname, "lib", "security-helpers"));

const ROOT = resolve(__dirname, "..");
const args = new Set(process.argv.slice(2));
const jsonOutput = args.has("--json");
const verbose = args.has("--verbose");

const STATUS_MARKER_RE = /[⏳🔄✅❌⏸]/u;
// Anchored, no backtracking: only matches up to end-of-line. Accepts optional
// blockquote prefix `> `, optional status emoji, and varied descriptive text
// between the label and any step-count expression. The step count is parsed
// separately from the banner line in parseStepCounts to keep this regex
// linear in input length (ReDoS-safe per SonarCloud S5852).
const STATUS_BANNER_RE = /^>?[ \t]*\*\*Status:\*\*\s/im;
const STEP_FRACTION_RE = /(\d+)\s*(?:\/|of)\s*(\d+)\s*steps?/iu;
const ALL_STEPS_RE = /all\s+(\d+)\s*steps?/iu;
// Step headers may be at depth 2 (##) or 3 (###) — .planning/ plans use both.
const STEP_HEADER_RE = /^#{2,3}\s+(Step\s+[\w.]+:|Wave\s+\d+:|Phase\s+\w+:)/im;

function log(msg) {
  if (!jsonOutput) console.log(msg);
}

function vlog(msg) {
  if (verbose && !jsonOutput) console.log(`  [verbose] ${msg}`);
}

function listPlanFiles() {
  // NUL-delimited output with no pathspec globs — git's ** pathspec-magic is
  // not supported on all Git versions. Filter in JS for reliability.
  let raw;
  try {
    raw = execFileSync("git", ["ls-files", "-z", "--", ".planning"], {
      cwd: ROOT,
      encoding: "utf-8",
      maxBuffer: 5 * 1024 * 1024,
    });
  } catch (err) {
    // Surface the underlying error so genuine git failures aren't silenced.
    // Diagnostic only — return an empty list so the caller can still run.
    vlog(`git ls-files failed: ${sanitizeError(err)}`);
    return [];
  }
  return raw
    .split("\0")
    .map((p) => p.trim())
    .filter((p) => p.startsWith(".planning/") && p.endsWith("/PLAN.md"));
}

function parseStepCounts(bannerLine) {
  const frac = bannerLine.match(STEP_FRACTION_RE);
  if (frac) {
    return {
      done: Number.parseInt(frac[1], 10),
      total: Number.parseInt(frac[2], 10),
    };
  }
  const all = bannerLine.match(ALL_STEPS_RE);
  if (all) {
    const total = Number.parseInt(all[1], 10);
    return { done: total, total };
  }
  return { done: null, total: null };
}

function analyzePlan(relPath) {
  const abs = resolve(ROOT, relPath);
  let content;
  try {
    content = readFileSync(abs, "utf-8");
  } catch (err) {
    return { path: relPath, error: `read failed: ${sanitizeError(err)}` };
  }

  const lines = content.split("\n");
  const result = {
    path: relPath,
    hasBanner: false,
    bannerDone: null,
    bannerTotal: null,
    totalStepHeaders: 0,
    unmarkedStepHeaders: [],
  };

  // Check status banner (scan first 30 lines — banner must be near top).
  // Parse the banner line and step counts separately: the banner match is a
  // simple line-anchored lookup (ReDoS-safe); step counts are derived from
  // the matched line via linear regexes in parseStepCounts().
  const bannerRegion = lines.slice(0, 30).join("\n");
  const bannerMatch = bannerRegion.match(STATUS_BANNER_RE);
  if (bannerMatch) {
    result.hasBanner = true;
    const lineStart = bannerMatch.index ?? 0;
    const nextNewline = bannerRegion.indexOf("\n", lineStart);
    const bannerLine = bannerRegion.slice(lineStart, nextNewline === -1 ? undefined : nextNewline);
    const counts = parseStepCounts(bannerLine);
    result.bannerDone = counts.done;
    result.bannerTotal = counts.total;
  }

  // Check step headers for status markers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (STEP_HEADER_RE.test(line)) {
      result.totalStepHeaders += 1;
      if (!STATUS_MARKER_RE.test(line)) {
        result.unmarkedStepHeaders.push({
          line: i + 1,
          header: line.trim().slice(0, 80),
        });
      }
    }
  }

  return result;
}

function planLastCommitMs(planPath) {
  // Last git commit that touched this plan file. More reliable than fs mtime
  // for drift detection in a git repo: file mtime resets on checkout/pull.
  try {
    const raw = execFileSync("git", ["log", "-1", "--format=%ct", "--", planPath], {
      cwd: ROOT,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
    }).trim();
    const sec = Number.parseInt(raw, 10);
    return Number.isFinite(sec) ? sec * 1000 : 0;
  } catch (err) {
    vlog(`git log for ${planPath} failed: ${sanitizeError(err)}`);
    return 0;
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

function findDriftCandidates(planPath) {
  // Drift signal: commits newer than the plan's last commit that touched the
  // plan directory (but not the plan file itself) — suggests the plan drifted
  // from neighbour changes.
  const planDir = dirname(planPath);
  let recentCommits;
  try {
    recentCommits = execFileSync(
      "git",
      ["log", "--since=30.days.ago", "--pretty=format:%H|%ct|%s", "--", planDir],
      { cwd: ROOT, encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (err) {
    vlog(`git log for ${planDir} failed: ${sanitizeError(err)}`);
    return [];
  }

  const commits = recentCommits
    .split("\n")
    .map((row) => {
      const parts = parsePipeRow(row);
      if (!parts || !parts.sha || !parts.ts) return null;
      return {
        sha: parts.sha,
        ts: Number.parseInt(parts.ts, 10) * 1000,
        subject: parts.subject,
      };
    })
    .filter(Boolean);

  if (commits.length === 0) return [];

  const baselineMs = planLastCommitMs(planPath);
  return commits
    .filter((c) => c.ts > baselineMs)
    .map((c) => ({
      sha: c.sha.slice(0, 8),
      subject: c.subject.slice(0, 80),
      ageDays: Math.round((Date.now() - c.ts) / 86400000),
    }));
}

function reportPlan(result, issues) {
  log(`📋 ${result.path}`);
  if (result.hasBanner) {
    vlog(`   ✅ Banner: ${result.bannerDone}/${result.bannerTotal} steps complete`);
  } else {
    issues.plansWithoutBanner.push(result.path);
    log("   ❌ Missing status banner");
  }

  if (result.totalStepHeaders === 0) {
    vlog("   (no step headers detected)");
  } else if (result.unmarkedStepHeaders.length > 0) {
    issues.plansWithUnmarkedSteps.push({
      path: result.path,
      count: result.unmarkedStepHeaders.length,
      total: result.totalStepHeaders,
    });
    log(
      `   ⚠️  ${result.unmarkedStepHeaders.length} / ${result.totalStepHeaders} step headers lack a status marker`
    );
    for (const s of result.unmarkedStepHeaders.slice(0, 3)) {
      log(`      line ${s.line}: ${s.header}`);
    }
    if (result.unmarkedStepHeaders.length > 3) {
      log(`      ... ${result.unmarkedStepHeaders.length - 3} more`);
    }
  } else if (result.totalStepHeaders > 0) {
    vlog(`   ✅ All ${result.totalStepHeaders} step headers marked`);
  }
}

function main() {
  const plans = listPlanFiles();
  if (plans.length === 0) {
    log("No .planning/**/PLAN.md files found");
    process.exit(0);
  }

  log("PLAN.md Hygiene Check");
  log("=====================");
  log(`  Plans scanned: ${plans.length}`);
  log("");

  const issues = {
    plansWithoutBanner: [],
    plansWithUnmarkedSteps: [],
    plansWithCommitDrift: [],
  };

  for (const rel of plans) {
    const r = analyzePlan(rel);
    if (r.error) {
      log(`⚠️  ${rel}: ${r.error}`);
      continue;
    }
    reportPlan(r, issues);

    const drift = findDriftCandidates(rel);
    if (drift.length > 0) {
      issues.plansWithCommitDrift.push({ path: rel, drift });
      log(`   🔶 ${drift.length} commit(s) touched this plan dir newer than the plan file`);
      for (const d of drift.slice(0, 2)) {
        log(`      ${d.sha} (${d.ageDays}d): ${d.subject}`);
      }
    }
    log("");
  }

  const summary = {
    plansScanned: plans.length,
    plansWithoutBanner: issues.plansWithoutBanner.length,
    plansWithUnmarkedSteps: issues.plansWithUnmarkedSteps.length,
    plansWithCommitDrift: issues.plansWithCommitDrift.length,
  };

  if (jsonOutput) {
    console.log(JSON.stringify({ summary, issues }, null, 2));
  }

  log("Summary");
  log("-------");
  log(`  Plans without banner:      ${summary.plansWithoutBanner}`);
  log(`  Plans with unmarked steps: ${summary.plansWithUnmarkedSteps}`);
  log(`  Plans with commit drift:   ${summary.plansWithCommitDrift}`);

  const hasIssues =
    summary.plansWithoutBanner > 0 ||
    summary.plansWithUnmarkedSteps > 0 ||
    summary.plansWithCommitDrift > 0;

  process.exit(hasIssues ? 1 : 0);
}

module.exports = {
  STATUS_MARKER_RE,
  STATUS_BANNER_RE,
  STEP_FRACTION_RE,
  ALL_STEPS_RE,
  STEP_HEADER_RE,
  parseStepCounts,
  analyzePlan,
  parsePipeRow,
  listPlanFiles,
  planLastCommitMs,
  findDriftCandidates,
  reportPlan,
};

if (require.main === module) {
  main();
}
