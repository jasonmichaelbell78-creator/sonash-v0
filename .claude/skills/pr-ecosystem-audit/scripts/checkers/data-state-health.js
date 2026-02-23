/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Data & State Health Checker — Categories 5-7
 *
 * 5. State File Consistency
 * 6. Archive & Retention Health
 * 7. JSONL Sync Fidelity
 */

"use strict";

/* eslint-disable no-unused-vars -- safeRequire is a safety wrapper */
function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[data-state-health] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { execFileSync } = safeRequire("node:child_process");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "data_state_health";

/**
 * Run all data & state health checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // ── Category 5: State File Consistency ───────────────────────────────────
  scores.state_file_consistency = checkStateFileConsistency(rootDir, findings);

  // ── Category 6: Archive & Retention Health ──────────────────────────────
  scores.archive_retention_health = checkArchiveRetentionHealth(rootDir, findings);

  // ── Category 7: JSONL Sync Fidelity ─────────────────────────────────────
  scores.jsonl_sync_fidelity = checkJsonlSyncFidelity(rootDir, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 5: State File Consistency ─────────────────────────────────────

/**
 * Run `sync-reviews-to-jsonl --check` and return 0 (pass) or 1 (fail).
 */
function runSyncCheck(rootDir) {
  try {
    execFileSync("node", [path.join(rootDir, "scripts", "sync-reviews-to-jsonl.js"), "--check"], {
      cwd: rootDir,
      encoding: "utf8",
      timeout: 30000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return 0;
  } catch (err) {
    const stderr = err.stderr ? String(err.stderr).trim() : "";
    if (stderr) {
      console.error(`  [info] Sync check stderr: ${stderr.slice(0, 200)}`);
    }
    return 1;
  }
}

/**
 * Extract the highest numeric review ID from JSONL lines.
 */
function extractMaxReviewId(reviewLines) {
  return reviewLines.reduce((max, line) => {
    try {
      const entry = JSON.parse(line);
      const id = typeof entry.id === "string" ? entry.id : "";
      const reviewMatch = id.match(/review(?:[-_#\s])?(\d+)/i);
      if (reviewMatch) return Math.max(max, parseInt(reviewMatch[1], 10));
      const nums = id.match(/\d+/g);
      const last = nums && nums.length > 0 ? nums[nums.length - 1] : null;
      return last ? Math.max(max, parseInt(last, 10)) : max;
    } catch {
      return max;
    }
  }, 0);
}

/**
 * Check consolidation.json pointer validity and schema.
 * Returns { orphanedEntries, schemaValidCount, schemaTotalCount }.
 */
function checkConsolidationPointer(rootDir) {
  const consolidationPath = path.join(rootDir, ".claude", "state", "consolidation.json");
  const reviewsJsonlPath = path.join(rootDir, ".claude", "state", "reviews.jsonl");
  let orphanedEntries = 0;
  let schemaValidCount = 0;
  let schemaTotalCount = 0;

  try {
    if (!fs.existsSync(consolidationPath)) {
      return { orphanedEntries, schemaValidCount, schemaTotalCount };
    }
    const consolidation = JSON.parse(fs.readFileSync(consolidationPath, "utf8"));
    schemaTotalCount++;
    if (consolidation && typeof consolidation === "object") {
      schemaValidCount++;
    }

    if (consolidation.lastConsolidatedReview && fs.existsSync(reviewsJsonlPath)) {
      const reviewLines = fs
        .readFileSync(reviewsJsonlPath, "utf8")
        .trim()
        .split("\n")
        .filter(Boolean);
      const maxReviewId = extractMaxReviewId(reviewLines);
      const lastConsolidated = parseInt(
        String(consolidation.lastConsolidatedReview).match(/(\d+)/)?.[1] || "0",
        10
      );
      if (lastConsolidated > maxReviewId) {
        orphanedEntries++;
      }
    }
  } catch {
    // consolidation.json missing or invalid — not necessarily an error
  }

  return { orphanedEntries, schemaValidCount, schemaTotalCount };
}

/**
 * Validate a single state file's schema (JSON or JSONL).
 * Returns true if the file is valid.
 */
function isStateFileValid(sf) {
  const content = fs.readFileSync(sf.path, "utf8");
  if (sf.type === "json") {
    JSON.parse(content);
    return true;
  }
  if (sf.type === "jsonl") {
    const lines = content
      .split("\n")
      .map((l) => l.replace(/\r$/, ""))
      .filter((l) => l.trim().length > 0);
    if (lines.length === 0) return false;
    for (const line of lines) {
      try {
        JSON.parse(line);
      } catch {
        return false;
      }
    }
    return true;
  }
  return false;
}

/**
 * Validate all state files and return { schemaValidCount, schemaTotalCount }.
 */
function validateStateFiles(rootDir) {
  let schemaValidCount = 0;
  let schemaTotalCount = 0;

  const stateFiles = [
    { path: path.join(rootDir, ".claude", "state", "reviews.jsonl"), type: "jsonl" },
    { path: path.join(rootDir, ".claude", "state", "review-metrics.jsonl"), type: "jsonl" },
    { path: path.join(rootDir, ".claude", "state", "alert-suppressions.json"), type: "json" },
  ];

  for (const sf of stateFiles) {
    try {
      if (!fs.existsSync(sf.path)) continue;
      schemaTotalCount++;
      if (isStateFileValid(sf)) schemaValidCount++;
    } catch {
      // Skip unreadable files
    }
  }

  return { schemaValidCount, schemaTotalCount };
}

function checkStateFileConsistency(rootDir, findings) {
  const bench = BENCHMARKS.state_file_consistency;

  const syncCheckPass = runSyncCheck(rootDir);
  const pointer = checkConsolidationPointer(rootDir);
  const stateValidation = validateStateFiles(rootDir);

  const schemaTotalCount = pointer.schemaTotalCount + stateValidation.schemaTotalCount;
  const schemaValidCount = pointer.schemaValidCount + stateValidation.schemaValidCount;
  const orphanedEntries = pointer.orphanedEntries;
  const schemaValidPct =
    schemaTotalCount > 0 ? Math.round((schemaValidCount / schemaTotalCount) * 100) : 100;

  const r1 = scoreMetric(syncCheckPass, bench.sync_check_pass, "lower-is-better");
  const r2 = scoreMetric(orphanedEntries, bench.orphaned_entries, "lower-is-better");
  const r3 = scoreMetric(schemaValidPct, bench.schema_valid_pct, "higher-is-better");

  const avgScore = Math.round((r1.score + r2.score + r3.score) / 3);

  if (syncCheckPass > 0) {
    findings.push({
      id: "PEA-501",
      category: "state_file_consistency",
      domain: DOMAIN,
      severity: "error",
      message: "Reviews sync check failed — markdown and JSONL are out of sync",
      details:
        "Run `npm run reviews:sync -- --apply` to fix. This means review data in JSONL doesn't match the markdown source.",
      impactScore: 80,
      frequency: 1,
      blastRadius: 3,
      patchType: "sync_command",
      patchImpact: "Restore data consistency between markdown and JSONL",
    });
  }

  if (orphanedEntries > 0) {
    findings.push({
      id: "PEA-502",
      category: "state_file_consistency",
      domain: DOMAIN,
      severity: "warning",
      message: `Consolidation pointer references review beyond max ID (${orphanedEntries} orphan)`,
      details:
        "consolidation.json lastConsolidatedReview points beyond the highest review in reviews.jsonl",
      impactScore: 50,
      frequency: 1,
      blastRadius: 2,
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: {
      syncCheckPass,
      orphanedEntries,
      schemaValidPct,
      stateFilesChecked: schemaTotalCount,
    },
  };
}

// ── Category 6: Archive & Retention Health ─────────────────────────────────

function checkArchiveRetentionHealth(rootDir, findings) {
  const bench = BENCHMARKS.archive_retention_health;

  // Count active reviews in AI_REVIEW_LEARNINGS_LOG.md
  const learningsPath = path.join(rootDir, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
  let activeReviewCount = 0;

  try {
    const content = fs.readFileSync(learningsPath, "utf8");
    const reviewHeaders = content.match(/^#{2,4}\s+Review\s+#\d+/gim) || [];
    activeReviewCount = reviewHeaders.length;
  } catch {
    // File missing
  }

  // Check archive files exist
  const archiveDir = path.join(rootDir, "docs", "archive");
  let archiveCount = 0;
  let archiveAccessible = 0;

  try {
    if (fs.existsSync(archiveDir)) {
      const archiveFiles = fs.readdirSync(archiveDir).filter((f) => f.startsWith("REVIEWS_"));
      archiveCount = archiveFiles.length;
      for (const af of archiveFiles) {
        try {
          fs.accessSync(path.join(archiveDir, af), fs.constants.R_OK);
          archiveAccessible++;
        } catch {
          // Not accessible
        }
      }
    }
  } catch {
    // Archive dir missing
  }

  const archiveAccessiblePct =
    archiveCount > 0 ? Math.round((archiveAccessible / archiveCount) * 100) : 100;

  const r1 = scoreMetric(activeReviewCount, bench.active_review_count, "lower-is-better");
  const r2 = scoreMetric(archiveAccessiblePct, bench.archive_accessible_pct, "higher-is-better");

  const avgScore = Math.round((r1.score + r2.score) / 2);

  if (r1.rating !== "good") {
    findings.push({
      id: "PEA-601",
      category: "archive_retention_health",
      domain: DOMAIN,
      severity: activeReviewCount > 25 ? "error" : "warning",
      message: `${activeReviewCount} active reviews in learnings log (threshold: ${bench.active_review_count.good})`,
      details:
        "Too many active reviews bloats the file and slows parsing. Run archival to move old reviews.",
      impactScore: activeReviewCount > 25 ? 70 : 45,
      frequency: 1,
      blastRadius: 2,
      patchType: "archive_command",
      patchImpact: `Archive ~${activeReviewCount - bench.active_review_count.good} reviews to reduce active file size`,
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: { activeReviewCount, archiveCount, archiveAccessiblePct },
  };
}

// ── Category 7: JSONL Sync Fidelity ────────────────────────────────────────

/**
 * Count corrupted (non-parseable) lines in an array of JSONL strings.
 */
function countCorruptedJsonlLines(lines) {
  let corrupted = 0;
  for (const line of lines) {
    try {
      JSON.parse(line);
    } catch {
      corrupted++;
    }
  }
  return corrupted;
}

/**
 * Count markdown review headers in the active learnings log only.
 * Archives are excluded because reviews.jsonl only tracks active reviews,
 * so comparing against all archives would produce a false drift signal.
 */
function countMarkdownReviews(rootDir) {
  const learningsPath = path.join(rootDir, "docs", "AI_REVIEW_LEARNINGS_LOG.md");

  try {
    const learnings = fs.readFileSync(learningsPath, "utf8");
    const lines = learnings.split("\n");
    const headingRe = /^#{2,4}\s+Review\s+#\d+/i;
    let inFence = false;
    let count = 0;
    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        inFence = !inFence;
        continue;
      }
      if (!inFence && headingRe.test(line)) count++;
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * Read reviews.jsonl and compute drift + corruption counts.
 * Returns { driftCount, corruptedLines }.
 */
function measureJsonlDrift(rootDir) {
  const reviewsJsonlPath = path.join(rootDir, ".claude", "state", "reviews.jsonl");

  try {
    if (!fs.existsSync(reviewsJsonlPath)) {
      return { driftCount: 0, corruptedLines: 0 };
    }
    const content = fs.readFileSync(reviewsJsonlPath, "utf8");
    const lines = content.trim().split("\n").filter(Boolean);
    const corruptedLines = countCorruptedJsonlLines(lines);
    // Count only review entries (numeric id), not retros (string id like "retro-379")
    let jsonlReviewCount = 0;
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (typeof entry.id === "number") jsonlReviewCount++;
      } catch {
        // counted in corruptedLines
      }
    }
    const markdownReviewCount = countMarkdownReviews(rootDir);
    const driftCount = Math.abs(jsonlReviewCount - markdownReviewCount);
    return { driftCount, corruptedLines };
  } catch {
    return { driftCount: 0, corruptedLines: 0 };
  }
}

function checkJsonlSyncFidelity(rootDir, findings) {
  const bench = BENCHMARKS.jsonl_sync_fidelity;
  const { driftCount, corruptedLines } = measureJsonlDrift(rootDir);

  const r1 = scoreMetric(driftCount, bench.drift_count, "lower-is-better");
  const r2 = scoreMetric(corruptedLines, bench.corrupted_lines, "lower-is-better");

  const avgScore = Math.round((r1.score + r2.score) / 2);

  if (driftCount > 0) {
    findings.push({
      id: "PEA-701",
      category: "jsonl_sync_fidelity",
      domain: DOMAIN,
      severity: driftCount > 5 ? "error" : "warning",
      message: `JSONL↔Markdown drift: ${driftCount} entries differ`,
      details:
        "The reviews.jsonl file should be an exact representation of the markdown review entries. Run sync to fix.",
      impactScore: driftCount > 5 ? 75 : 45,
      frequency: 1,
      blastRadius: 2,
      patchType: "sync_command",
      patchImpact: "Restore JSONL↔Markdown consistency",
    });
  }

  if (corruptedLines > 0) {
    findings.push({
      id: "PEA-702",
      category: "jsonl_sync_fidelity",
      domain: DOMAIN,
      severity: "error",
      message: `${corruptedLines} corrupted line(s) in reviews.jsonl`,
      details:
        "Corrupted JSONL lines prevent accurate data analysis. Run `npm run reviews:repair` to fix.",
      impactScore: 80,
      frequency: 1,
      blastRadius: 3,
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: { driftCount, corruptedLines },
  };
}

module.exports = { run, DOMAIN };
