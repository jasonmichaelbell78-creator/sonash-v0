/* eslint-disable no-undef */

/**
 * Pattern Enforcement Health Checker
 *
 * Metrics: repeat_offenders, outdated_patterns, hotspot_files, sync_issues
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { scoreMetric } = require("../lib/scoring");
const { ROOT_DIR, safeParse, runCommandSafe } = require("../lib/utils");

const BENCHMARKS = {
  repeat_offenders: { good: 0, average: 3, poor: 8 },
  outdated_patterns: { good: 0, average: 3, poor: 5 },
  hotspot_files: { good: 0, average: 2, poor: 5 },
  sync_issues: { good: 0, average: 2, poor: 5 },
};

function checkPatternEnforcement() {
  const metrics = {};

  // Pattern hotspots from warned-files.json
  const warnedPath = path.join(ROOT_DIR, ".claude", "state", "warned-files.json");
  let hotspotCount = 0;
  let repeatOffenders = 0;
  try {
    const data = JSON.parse(fs.readFileSync(warnedPath, "utf8"));
    const files = data.files || data;
    if (files && typeof files === "object") {
      const entries = Object.entries(files);
      hotspotCount = entries.length;
      repeatOffenders = entries.filter(
        ([, count]) => (typeof count === "number" ? count : (count?.count ?? 0)) >= 3
      ).length;
    }
  } catch {
    // File doesn't exist
  }

  metrics.repeat_offenders = {
    value: repeatOffenders,
    ...scoreMetric(repeatOffenders, BENCHMARKS.repeat_offenders),
    benchmark: BENCHMARKS.repeat_offenders,
  };

  metrics.hotspot_files = {
    value: hotspotCount,
    ...scoreMetric(hotspotCount, BENCHMARKS.hotspot_files),
    benchmark: BENCHMARKS.hotspot_files,
  };

  // Pattern sync check
  let outdated = 0;
  const syncResult = runCommandSafe("npm", ["run", "patterns:sync"], { timeout: 30000 });
  const syncOutput = `${syncResult.output || ""}\n${syncResult.stderr || ""}`;
  const outdatedMatch = syncOutput.match(/(\d+)\s+(?:outdated|out.of.sync|stale)/i);
  if (outdatedMatch) {
    outdated = parseInt(outdatedMatch[1], 10);
  } else if (!syncResult.success && !/Missing script/i.test(syncOutput)) {
    outdated = 1;
  }

  metrics.outdated_patterns = {
    value: outdated,
    ...scoreMetric(outdated, BENCHMARKS.outdated_patterns),
    benchmark: BENCHMARKS.outdated_patterns,
  };

  // Sync issues (crosscheck from pattern compliance)
  let syncIssues = 0;
  const compResult = runCommandSafe("npm", ["run", "patterns:check"], { timeout: 60000 });
  const compOutput = `${compResult.output || ""}\n${compResult.stderr || ""}`;
  if (!compResult.success) {
    const m = compOutput.match(/(\d+)\s+(?:violation|issue|error)/i);
    syncIssues = m ? parseInt(m[1], 10) : 0;
  }

  metrics.sync_issues = {
    value: syncIssues,
    ...scoreMetric(syncIssues, BENCHMARKS.sync_issues),
    benchmark: BENCHMARKS.sync_issues,
  };

  return { metrics, no_data: false };
}

module.exports = { checkPatternEnforcement };
