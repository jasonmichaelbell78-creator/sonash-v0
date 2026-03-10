/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Consumer Integration & Versioning — Domain 4 (D4)
 *
 * 4 categories:
 *   1. output_schema_versioning — Breaking changes between health output and consumers
 *   2. health_check_timeout_consistency — Quick vs full modes, per-checker timeout
 *   3. duplicate_logic_detection — Drift risk from scoring copies
 *   4. downstream_error_handling — /ecosystem-health and /alerts handle all formats
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[consumer-integration] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "consumer_integration";
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

  scores.output_schema_versioning = checkOutputSchema(rootDir, findings);
  scores.health_check_timeout_consistency = checkTimeoutConsistency(rootDir, findings);
  scores.duplicate_logic_detection = checkDuplicateLogic(rootDir, findings);
  scores.downstream_error_handling = checkDownstreamErrorHandling(rootDir, findings);

  return { domain: DOMAIN, findings, scores };
}

// -- Category 1: Output Schema Versioning ------------------------------------

function checkOutputSchema(rootDir, findings) {
  const bench = BENCHMARKS.output_schema_versioning;
  let breakingChanges = 0;

  const runnerPath = path.join(rootDir, "scripts", "health", "run-health-check.js");
  const runnerContent = safeReadFile(runnerPath);

  if (!runnerContent) {
    findings.push({
      id: "HMS-400",
      category: "output_schema_versioning",
      domain: DOMAIN,
      severity: "error",
      message: "run-health-check.js not found",
      details: "Cannot verify output schema without the health check runner.",
      impactScore: 85,
      frequency: 1,
      blastRadius: 5,
    });
    return { score: 0, rating: "poor", metrics: { breakingChanges: 1 } };
  }

  // Check: does the output contain expected top-level fields?
  const expectedOutputFields = [
    "timestamp",
    "mode",
    "score",
    "grade",
    "categoryScores",
    "dimensionScores",
  ];
  for (const field of expectedOutputFields) {
    if (!runnerContent.includes(field)) {
      breakingChanges++;
      findings.push({
        id: "HMS-401",
        category: "output_schema_versioning",
        domain: DOMAIN,
        severity: "warning",
        message: `Output schema may be missing field: ${field}`,
        details: `run-health-check.js does not reference "${field}" in output construction.`,
        impactScore: 50,
        frequency: 1,
        blastRadius: 2,
      });
    }
  }

  // Check: does health-log.js expect fields that runner might not produce?
  const healthLogPath = path.join(rootDir, "scripts", "health", "lib", "health-log.js");
  const healthLogContent = safeReadFile(healthLogPath);
  if (healthLogContent) {
    const consumedFields = ["score", "grade", "categoryScores", "dimensionScores", "timestamp"];
    for (const field of consumedFields) {
      if (healthLogContent.includes(`result.${field}`) && !runnerContent.includes(field)) {
        breakingChanges++;
        findings.push({
          id: "HMS-402",
          category: "output_schema_versioning",
          domain: DOMAIN,
          severity: "error",
          message: `health-log.js expects result.${field} but runner may not produce it`,
          details: "Schema contract violation between producer and consumer.",
          impactScore: 75,
          frequency: 1,
          blastRadius: 4,
        });
      }
    }
  }

  const result = scoreMetric(breakingChanges, bench.breaking_changes, "lower-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { breakingChanges },
  };
}

// -- Category 2: Health Check Timeout Consistency ----------------------------

function checkTimeoutConsistency(rootDir, findings) {
  const bench = BENCHMARKS.health_check_timeout_consistency;
  let totalCheckers = 0;
  let consistentCheckers = 0;

  const runnerPath = path.join(rootDir, "scripts", "health", "run-health-check.js");
  const runnerContent = safeReadFile(runnerPath);

  if (!runnerContent) {
    return {
      score: 100,
      rating: "good",
      metrics: { totalCheckers: 0, consistentCheckers: 0, consistentPct: 100 },
    };
  }

  // Count checkers and check for timeout configuration
  const checkerDefs = runnerContent.match(/["'][\w-]+["']\s*:\s*\{[^}]*fn\s*:/g);
  totalCheckers = checkerDefs ? checkerDefs.length : 0;

  // Check: are quick checkers properly tagged?
  const quickCount = (runnerContent.match(/quick:\s*true/g) || []).length;
  const fullCount = (runnerContent.match(/quick:\s*false/g) || []).length;
  consistentCheckers = quickCount + fullCount;

  if (totalCheckers > 0 && consistentCheckers < totalCheckers) {
    findings.push({
      id: "HMS-410",
      category: "health_check_timeout_consistency",
      domain: DOMAIN,
      severity: "info",
      message: `${totalCheckers - consistentCheckers} checker(s) missing quick/full mode tag`,
      details: "All checkers should have explicit quick: true/false designation.",
      impactScore: 30,
      frequency: totalCheckers - consistentCheckers,
      blastRadius: 1,
    });
  }

  // Check: is there a per-checker timeout mechanism?
  if (totalCheckers > 0 && !/timeout/i.test(runnerContent)) {
    findings.push({
      id: "HMS-411",
      category: "health_check_timeout_consistency",
      domain: DOMAIN,
      severity: "warning",
      message: "No per-checker timeout mechanism in run-health-check.js",
      details: "A single slow checker can block the entire health check. Consider adding timeouts.",
      impactScore: 55,
      frequency: 1,
      blastRadius: 3,
    });
  }

  const consistentPct =
    totalCheckers > 0 ? Math.round((consistentCheckers / totalCheckers) * 100) : 100;
  const result = scoreMetric(consistentPct, bench.consistent_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalCheckers, consistentCheckers, consistentPct },
  };
}

// -- Category 3: Duplicate Logic Detection -----------------------------------

function checkDuplicateLogic(rootDir, findings) {
  const bench = BENCHMARKS.duplicate_logic_detection;
  let driftCount = 0;

  // Compare health/lib/scoring.js with other known copies
  const healthScoringPath = path.join(rootDir, "scripts", "health", "lib", "scoring.js");
  const healthScoringContent = safeReadFile(healthScoringPath);

  if (!healthScoringContent) {
    return { score: 100, rating: "good", metrics: { driftCount: 0, copiesFound: 0 } };
  }

  // Extract the core scoreMetric function signature/logic fingerprint
  const extractFingerprint = (content) => {
    const fn = content.match(/function\s+scoreMetric\s*\([^)]*\)\s*\{([^]*?)^\}/m);
    return fn ? fn[1].replace(/\s+/g, " ").trim() : "";
  };

  const healthFingerprint = extractFingerprint(healthScoringContent);
  let copiesFound = 0;

  // Known scoring.js copy locations
  const knownCopies = [
    ".claude/skills/hook-ecosystem-audit/scripts/lib/scoring.js",
    ".claude/skills/pr-ecosystem-audit/scripts/lib/scoring.js",
    ".claude/skills/session-ecosystem-audit/scripts/lib/scoring.js",
  ];

  for (const copyRelPath of knownCopies) {
    const copyPath = path.join(rootDir, copyRelPath);
    const copyContent = safeReadFile(copyPath);
    if (!copyContent) continue;

    copiesFound++;
    const copyFingerprint = extractFingerprint(copyContent);

    if (healthFingerprint && copyFingerprint && healthFingerprint !== copyFingerprint) {
      driftCount++;
      findings.push({
        id: "HMS-420",
        category: "duplicate_logic_detection",
        domain: DOMAIN,
        severity: "warning",
        message: `Scoring logic drift detected: health/lib/scoring.js vs ${copyRelPath}`,
        details:
          "Copies have diverged. Different scoring logic may produce inconsistent results across audits.",
        impactScore: 55,
        frequency: 1,
        blastRadius: 2,
      });
    }
  }

  const result = scoreMetric(driftCount, bench.drift_count, "lower-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { driftCount, copiesFound },
  };
}

// -- Category 4: Downstream Error Handling -----------------------------------

function checkDownstreamErrorHandling(rootDir, findings) {
  const bench = BENCHMARKS.downstream_error_handling;
  let totalChecks = 0;
  let handledChecks = 0;

  // Check run-health-check.js error handling for each checker
  const runnerContent = safeReadFile(
    path.join(rootDir, "scripts", "health", "run-health-check.js")
  );
  if (runnerContent) {
    totalChecks++;
    if (/catch\s*\(/.test(runnerContent) && /no_data/.test(runnerContent)) {
      handledChecks++;
    } else if (/catch\s*\(/.test(runnerContent)) {
      handledChecks++; // Partial credit
    } else {
      findings.push({
        id: "HMS-430",
        category: "downstream_error_handling",
        domain: DOMAIN,
        severity: "warning",
        message: "run-health-check.js does not catch individual checker failures",
        details: "A single checker crash will take down the entire health check.",
        impactScore: 70,
        frequency: 1,
        blastRadius: 4,
      });
    }
  }

  // Check health-log.js error handling
  const healthLogContent = safeReadFile(
    path.join(rootDir, "scripts", "health", "lib", "health-log.js")
  );
  if (healthLogContent) {
    totalChecks++;
    if (/try\s*\{/.test(healthLogContent) && /catch/.test(healthLogContent)) {
      handledChecks++;
    }

    // Check: does it handle missing dimensionScores?
    totalChecks++;
    if (
      /dimensionScores.*\?/.test(healthLogContent) ||
      /!.*dimensionScores/.test(healthLogContent)
    ) {
      handledChecks++;
    }
  }

  // Check mid-session-alerts.js error handling
  const alertsContent = safeReadFile(
    path.join(rootDir, "scripts", "health", "lib", "mid-session-alerts.js")
  );
  if (alertsContent) {
    totalChecks++;
    const catchCount = (alertsContent.match(/catch/g) || []).length;
    if (catchCount >= 2) {
      handledChecks++;
    } else {
      findings.push({
        id: "HMS-431",
        category: "downstream_error_handling",
        domain: DOMAIN,
        severity: "info",
        message: "mid-session-alerts.js has limited error handling",
        details: "Alert checks should handle all failure modes gracefully.",
        impactScore: 35,
        frequency: 1,
        blastRadius: 2,
      });
    }
  }

  const handledPct = totalChecks > 0 ? Math.round((handledChecks / totalChecks) * 100) : 100;
  const result = scoreMetric(handledPct, bench.handled_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalChecks, handledChecks, handledPct },
  };
}

module.exports = { run, DOMAIN };
