/**
 * Session Management Health Checker
 *
 * Metrics: uncommitted_files, stale_branch_days, session_gap_hours
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { scoreMetric } = require("../lib/scoring");
const { ROOT_DIR, safeParse, runCommandSafe } = require("../lib/utils");

const BENCHMARKS = {
  uncommitted_files: { good: 0, average: 5, poor: 15 },
  stale_branch_days: { good: 0, average: 3, poor: 7 },
  session_gap_hours: { good: 0, average: 4, poor: 24 },
};

function checkSessionManagement() {
  const metrics = {};

  // Uncommitted files from git status
  const statusResult = runCommandSafe("git", ["status", "--porcelain"], { timeout: 10000 });
  const statusLines = (statusResult.output || "").trim().split("\n").filter(Boolean);
  const uncommitted = statusLines.length;

  metrics.uncommitted_files = {
    value: uncommitted,
    ...scoreMetric(uncommitted, BENCHMARKS.uncommitted_files),
    benchmark: BENCHMARKS.uncommitted_files,
  };

  // Stale branch days (from last commit on current branch)
  let staleDays = 0;
  const logResult = runCommandSafe("git", ["log", "-1", "--format=%aI"], { timeout: 10000 });
  if (logResult.success && logResult.output) {
    const lastCommitDate = new Date(logResult.output.trim());
    if (!Number.isNaN(lastCommitDate.getTime())) {
      staleDays = Math.max(
        0,
        Math.floor((Date.now() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24))
      );
    }
  }

  metrics.stale_branch_days = {
    value: staleDays,
    ...scoreMetric(staleDays, BENCHMARKS.stale_branch_days),
    benchmark: BENCHMARKS.stale_branch_days,
  };

  // Session gap hours (from session state file)
  let gapHours = 0;
  const sessionStatePath = path.join(ROOT_DIR, ".claude", "hooks", ".session-state.json");
  try {
    const content = fs.readFileSync(sessionStatePath, "utf8");
    const state = safeParse(content);
    if (state?.lastBegin && !state.lastEnd) {
      const beginTime = new Date(state.lastBegin).getTime();
      if (!Number.isNaN(beginTime)) {
        gapHours = Math.max(0, Math.floor((Date.now() - beginTime) / (1000 * 60 * 60)));
      }
    }
  } catch {
    // File doesn't exist
  }

  metrics.session_gap_hours = {
    value: gapHours,
    ...scoreMetric(gapHours, BENCHMARKS.session_gap_hours),
    benchmark: BENCHMARKS.session_gap_hours,
  };

  return { metrics, no_data: false };
}

module.exports = { checkSessionManagement };
