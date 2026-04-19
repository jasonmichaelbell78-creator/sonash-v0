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

const { readFileSync, statSync } = require("node:fs");
const { execFileSync } = require("node:child_process");
const { resolve, dirname } = require("node:path");
const { sanitizeError } = require(resolve(__dirname, "lib", "security-helpers"));

const ROOT = resolve(__dirname, "..");
const args = new Set(process.argv.slice(2));
const jsonOutput = args.has("--json");
const verbose = args.has("--verbose");

const STATUS_MARKER_RE = /[⏳🔄✅❌⏸]/u;
const STATUS_BANNER_RE = /^\*\*Status:\*\*\s+[⏳🔄✅❌⏸]?\s*.+?(\d+)\s*\/\s*(\d+)\s*steps?/imu;
const STEP_HEADER_RE = /^##\s+(Step\s+[\w.]+:|Wave\s+\d+:|Phase\s+\w+:)/im;

function log(msg) {
  if (!jsonOutput) console.log(msg);
}

function vlog(msg) {
  if (verbose && !jsonOutput) console.log(`  [verbose] ${msg}`);
}

function listPlanFiles() {
  let raw;
  try {
    raw = execFileSync("git", ["ls-files", "--", ".planning/**/PLAN.md", ".planning/*/PLAN.md"], {
      cwd: ROOT,
      encoding: "utf-8",
      maxBuffer: 5 * 1024 * 1024,
    });
  } catch {
    return [];
  }
  return raw
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
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
    fileMtime: null,
  };

  try {
    result.fileMtime = statSync(abs).mtime.toISOString();
  } catch {
    /* mtime best-effort */
  }

  // Check status banner (scan first 30 lines — banner must be near top)
  const bannerRegion = lines.slice(0, 30).join("\n");
  const bannerMatch = bannerRegion.match(STATUS_BANNER_RE);
  if (bannerMatch) {
    result.hasBanner = true;
    result.bannerDone = Number.parseInt(bannerMatch[1], 10);
    result.bannerTotal = Number.parseInt(bannerMatch[2], 10);
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

function findDriftCandidates(planPath, planMtime) {
  // Commits that reference the plan path in message or touch the plan dir
  // without any subsequent commit updating step markers in the plan itself.
  const planDir = dirname(planPath);
  let recentCommits;
  try {
    recentCommits = execFileSync(
      "git",
      ["log", "--since=30.days.ago", "--pretty=format:%H|%ct|%s", "--", planDir],
      { cwd: ROOT, encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );
  } catch {
    return [];
  }

  const commits = recentCommits
    .split("\n")
    .map((row) => {
      const [sha, ts, subject] = row.split("|");
      if (!sha || !ts) return null;
      return { sha, ts: Number.parseInt(ts, 10) * 1000, subject: subject ?? "" };
    })
    .filter(Boolean);

  if (commits.length === 0) return [];

  const planMtimeMs = planMtime ? new Date(planMtime).getTime() : 0;
  // Drift signal: commits newer than the plan's mtime touching the plan dir
  return commits
    .filter((c) => c.ts > planMtimeMs)
    .map((c) => ({
      sha: c.sha.slice(0, 8),
      subject: c.subject.slice(0, 80),
      ageDays: Math.round((Date.now() - c.ts) / 86400000),
    }));
}

function reportPlan(result, issues) {
  log(`📋 ${result.path}`);
  if (!result.hasBanner) {
    issues.plansWithoutBanner.push(result.path);
    log("   ❌ Missing status banner");
  } else {
    vlog(`   ✅ Banner: ${result.bannerDone}/${result.bannerTotal} steps complete`);
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

    const drift = findDriftCandidates(rel, r.fileMtime);
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

main();
