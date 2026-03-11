/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Mid-Session Alert System — Domain 6 (D6)
 *
 * 3 categories:
 *   1. cooldown_state_management — Write failures, loss of state, alert fatigue
 *   2. warning_lifecycle_consistency — Resolved warnings archival, stale detection
 *   3. score_degradation_detection — Threshold calibration, accuracy
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[alert-system] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "alert_system";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const alertsPath = path.join(rootDir, "scripts", "health", "lib", "mid-session-alerts.js");
  const warningLifecyclePath = path.join(
    rootDir,
    "scripts",
    "health",
    "lib",
    "warning-lifecycle.js"
  );
  const dataDir = path.join(rootDir, "data", "ecosystem-v2");
  const cooldownPath = path.join(rootDir, ".claude", "hooks", ".alerts-cooldown.json");

  const alertsContent = safeReadFile(alertsPath);
  const warningContent = safeReadFile(warningLifecyclePath);

  scores.cooldown_state_management = checkCooldownState(cooldownPath, alertsContent, findings);
  scores.warning_lifecycle_consistency = checkWarningLifecycle(dataDir, warningContent, findings);
  scores.score_degradation_detection = checkScoreDegradation(dataDir, alertsContent, findings);

  return { domain: DOMAIN, findings, scores };
}

// -- Category 1: Cooldown State Management -----------------------------------

function checkCooldownState(cooldownPath, alertsContent, findings) {
  const bench = BENCHMARKS.cooldown_state_management;
  let totalChecks = 0;
  let healthyChecks = 0;

  // Check: does mid-session-alerts.js handle cooldown read failures?
  if (alertsContent) {
    totalChecks++;
    if (/readCooldown.*catch|try.*cooldown.*catch/s.test(alertsContent)) {
      healthyChecks++;
    } else {
      findings.push({
        id: "HMS-600",
        category: "cooldown_state_management",
        domain: DOMAIN,
        severity: "warning",
        message: "Cooldown read not wrapped in try/catch",
        details: "Corrupted cooldown file will crash mid-session alerts.",
        impactScore: 55,
        frequency: 1,
        blastRadius: 3,
      });
    }

    // Check: does it handle cooldown write failures?
    totalChecks++;
    if (/writeCooldown.*catch|try.*write.*cooldown.*catch/s.test(alertsContent)) {
      healthyChecks++;
    } else {
      findings.push({
        id: "HMS-601",
        category: "cooldown_state_management",
        domain: DOMAIN,
        severity: "warning",
        message: "Cooldown write not wrapped in try/catch",
        details: "Write failure will lose cooldown state, causing alert fatigue.",
        impactScore: 50,
        frequency: 1,
        blastRadius: 2,
        patchType: "fix_cooldown",
        patchTarget: "scripts/health/lib/mid-session-alerts.js",
      });
    }

    // Check: does it have a cooldown duration?
    totalChecks++;
    if (/60\s*\*\s*60\s*\*\s*1000|oneHourAgo|cooldownMs|COOLDOWN/i.test(alertsContent)) {
      healthyChecks++;
    }
  }

  // Check cooldown file itself
  if (cooldownPath) {
    try {
      if (fs.existsSync(cooldownPath)) {
        totalChecks++;
        const content = fs.readFileSync(cooldownPath, "utf8");
        try {
          const cooldown = JSON.parse(content);
          // Validate cooldown entries are ISO timestamps
          let allValid = true;
          for (const [, timestamp] of Object.entries(cooldown)) {
            if (typeof timestamp !== "string" || isNaN(new Date(timestamp).getTime())) {
              allValid = false;
            }
          }
          if (allValid) {
            healthyChecks++;
          } else {
            findings.push({
              id: "HMS-602",
              category: "cooldown_state_management",
              domain: DOMAIN,
              severity: "info",
              message: "Cooldown file contains non-ISO timestamps",
              details: "Some cooldown entries have invalid timestamp formats.",
              impactScore: 25,
              frequency: 1,
              blastRadius: 1,
            });
          }
        } catch {
          findings.push({
            id: "HMS-603",
            category: "cooldown_state_management",
            domain: DOMAIN,
            severity: "warning",
            message: "Cooldown file is not valid JSON",
            details: "Corrupted cooldown file will reset all cooldowns.",
            impactScore: 45,
            frequency: 1,
            blastRadius: 2,
          });
        }
      }
    } catch {
      // file not accessible
    }
  }

  const healthyPct = totalChecks > 0 ? Math.round((healthyChecks / totalChecks) * 100) : 100;
  const result = scoreMetric(healthyPct, bench.healthy_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalChecks, healthyChecks, healthyPct },
  };
}

// -- Category 2: Warning Lifecycle Consistency -------------------------------

function checkWarningLifecycle(dataDir, warningContent, findings) {
  const bench = BENCHMARKS.warning_lifecycle_consistency;
  let totalChecks = 0;
  let consistentChecks = 0;

  // Check warnings.jsonl lifecycle states
  const warningsPath = path.join(dataDir, "warnings.jsonl");
  const validLifecycles = new Set(["new", "active", "resolved", "expired", "suppressed"]);

  try {
    if (fs.existsSync(warningsPath)) {
      const stat = fs.statSync(warningsPath);
      if (stat.size < MAX_FILE_SIZE) {
        const content = fs.readFileSync(warningsPath, "utf8");
        const lines = content.split("\n").filter((l) => l.trim());

        let totalWarnings = 0;
        let validLifecycleCount = 0;
        let resolvedWithDate = 0;
        let resolvedTotal = 0;

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            totalWarnings++;

            if (entry.lifecycle && validLifecycles.has(entry.lifecycle)) {
              validLifecycleCount++;
            }

            if (entry.lifecycle === "resolved") {
              resolvedTotal++;
              if (entry.resolved_date) {
                resolvedWithDate++;
              }
            }
          } catch {
            // malformed line
          }
        }

        totalChecks += totalWarnings;
        consistentChecks += validLifecycleCount;

        if (totalWarnings > 0 && validLifecycleCount < totalWarnings) {
          findings.push({
            id: "HMS-610",
            category: "warning_lifecycle_consistency",
            domain: DOMAIN,
            severity: "warning",
            message: `${totalWarnings - validLifecycleCount} warning(s) with invalid lifecycle state`,
            details: `Valid states: ${Array.from(validLifecycles).join(", ")}. Found invalid values.`,
            impactScore: 50,
            frequency: totalWarnings - validLifecycleCount,
            blastRadius: 2,
          });
        }

        if (resolvedTotal > 0 && resolvedWithDate < resolvedTotal) {
          findings.push({
            id: "HMS-611",
            category: "warning_lifecycle_consistency",
            domain: DOMAIN,
            severity: "info",
            message: `${resolvedTotal - resolvedWithDate} resolved warning(s) missing resolved_date`,
            details: "Resolved warnings should have a resolved_date for audit trail.",
            impactScore: 25,
            frequency: resolvedTotal - resolvedWithDate,
            blastRadius: 1,
          });
        }

        // Check for stale warnings (open for > 30 days)
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const cutoffTime = cutoff.getTime();

        let staleCount = 0;
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.lifecycle === "new" || entry.lifecycle === "active") {
              if (typeof entry.date === "string") {
                const t = new Date(entry.date).getTime();
                if (Number.isFinite(t) && t < cutoffTime) {
                  staleCount++;
                }
              }
            }
          } catch {
            // skip
          }
        }

        if (staleCount > 0) {
          findings.push({
            id: "HMS-612",
            category: "warning_lifecycle_consistency",
            domain: DOMAIN,
            severity: "warning",
            message: `${staleCount} stale warning(s) open for >30 days`,
            details: "Stale warnings should be resolved, suppressed, or expired.",
            impactScore: 40,
            frequency: staleCount,
            blastRadius: 2,
          });
        }
      }
    }
  } catch {
    // file not accessible
  }

  // Check warning-lifecycle.js itself
  if (warningContent) {
    totalChecks++;
    // Does it handle lifecycle transitions?
    if (/lifecycle/.test(warningContent) && /resolved/.test(warningContent)) {
      consistentChecks++;
    }
  }

  const consistentPct = totalChecks > 0 ? Math.round((consistentChecks / totalChecks) * 100) : 100;
  const result = scoreMetric(consistentPct, bench.consistent_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalChecks, consistentChecks, consistentPct },
  };
}

// -- Category 3: Score Degradation Detection ---------------------------------

function checkScoreDegradation(dataDir, alertsContent, findings) {
  const bench = BENCHMARKS.score_degradation_detection;
  let totalChecks = 0;
  let accurateChecks = 0;

  // Check: does mid-session-alerts.js detect score degradation?
  if (alertsContent) {
    totalChecks++;
    if (/checkScoreDegradation|score.*drop|degradation/i.test(alertsContent)) {
      accurateChecks++;
    } else {
      findings.push({
        id: "HMS-620",
        category: "score_degradation_detection",
        domain: DOMAIN,
        severity: "warning",
        message: "No score degradation detection in mid-session-alerts.js",
        details: "Health score drops between runs will go undetected.",
        impactScore: 55,
        frequency: 1,
        blastRadius: 3,
      });
    }

    // Check: is the degradation threshold configurable?
    totalChecks++;
    if (/threshold|DEGRADATION_THRESHOLD|drop\s*(?:<|>)\s*\d+/.test(alertsContent)) {
      accurateChecks++;
    }
  }

  // Verify with actual health log data
  const healthLogPath = path.join(dataDir, "ecosystem-health-log.jsonl");
  try {
    if (fs.existsSync(healthLogPath)) {
      const stat = fs.statSync(healthLogPath);
      if (stat.size < MAX_FILE_SIZE) {
        const content = fs.readFileSync(healthLogPath, "utf8");
        const lines = content.split("\n").filter((l) => l.trim());
        const entries = [];

        for (const line of lines) {
          try {
            entries.push(JSON.parse(line));
          } catch {
            // skip
          }
        }

        if (entries.length >= 2) {
          totalChecks++;
          // Check last two entries for score continuity
          const prev = entries[entries.length - 2];
          const curr = entries[entries.length - 1];

          if (typeof prev.score === "number" && typeof curr.score === "number") {
            accurateChecks++;
            const drop = prev.score - curr.score;
            if (drop >= 10) {
              findings.push({
                id: "HMS-621",
                category: "score_degradation_detection",
                domain: DOMAIN,
                severity: "warning",
                message: `Health score dropped ${drop} points in last run (${prev.score} -> ${curr.score})`,
                details: "Significant score degradation detected in health log.",
                impactScore: 60,
                frequency: 1,
                blastRadius: 3,
              });
            }
          }
        }
      }
    }
  } catch {
    // file not accessible
  }

  const accuratePct = totalChecks > 0 ? Math.round((accurateChecks / totalChecks) * 100) : 100;
  const result = scoreMetric(accuratePct, bench.accurate_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalChecks, accurateChecks, accuratePct },
  };
}

module.exports = { run, DOMAIN };
