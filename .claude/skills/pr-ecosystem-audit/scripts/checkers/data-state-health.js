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

/**
 * Check if consolidation state is stuck at zero (never completed).
 * This was a real bug found in Session #193.
 */
function checkConsolidationStateHealth(rootDir) {
  const consolidationPath = path.join(rootDir, ".claude", "state", "consolidation.json");
  const reviewsJsonlPath = path.join(rootDir, ".claude", "state", "reviews.jsonl");
  try {
    if (!fs.existsSync(consolidationPath)) {
      return { stuckAtZero: false, consolidationNumber: -1, lastConsolidated: -1 };
    }
    const state = JSON.parse(fs.readFileSync(consolidationPath, "utf8"));
    const consolidationNumber = state.consolidationNumber || 0;
    const lastConsolidated = parseInt(
      String(state.lastConsolidatedReview || 0)
        .toString()
        .match(/(\d+)/)?.[1] || "0",
      10
    );

    // Check if consolidation state is stuck at zero while reviews exist
    let stuckAtZero = false;
    if (consolidationNumber === 0 && lastConsolidated === 0 && fs.existsSync(reviewsJsonlPath)) {
      const content = fs.readFileSync(reviewsJsonlPath, "utf8").trim();
      const reviewCount = content.split("\n").filter(Boolean).length;
      // Stuck if there are 10+ reviews but consolidation never ran
      stuckAtZero = reviewCount >= 10;
    }

    return { stuckAtZero, consolidationNumber, lastConsolidated };
  } catch {
    return { stuckAtZero: false, consolidationNumber: -1, lastConsolidated: -1 };
  }
}

function checkStateFileConsistency(rootDir, findings) {
  const bench = BENCHMARKS.state_file_consistency;

  const syncCheckPass = runSyncCheck(rootDir);
  const pointer = checkConsolidationPointer(rootDir);
  const stateValidation = validateStateFiles(rootDir);
  const consolidationHealth = checkConsolidationStateHealth(rootDir);

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

  if (consolidationHealth.stuckAtZero) {
    findings.push({
      id: "PEA-503",
      category: "state_file_consistency",
      domain: DOMAIN,
      severity: "error",
      message: "Consolidation state stuck at #0 — pipeline never completed",
      details:
        "consolidation.json shows consolidationNumber=0 and lastConsolidatedReview=0 despite 10+ reviews existing. " +
        "Run `node scripts/run-consolidation.js --apply` to fix. Root cause: state corruption or missing initial run.",
      impactScore: 90,
      frequency: 1,
      blastRadius: 4,
      patchType: "consolidation_command",
      patchImpact: "Restore consolidation pipeline from stuck state",
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
      consolidationNumber: consolidationHealth.consolidationNumber,
      consolidationStuckAtZero: consolidationHealth.stuckAtZero,
    },
  };
}

// ── Category 6: Archive & Retention Health ─────────────────────────────────

/**
 * Check heading format consistency across active log and archive files.
 * Standard format is `#### Review #N`. Newer reviews sometimes use `### Review #N`.
 * Returns { inconsistentHeadings, totalHeadings }.
 */
function checkHeadingFormatConsistency(rootDir) {
  const learningsPath = path.join(rootDir, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
  const archiveDir = path.join(rootDir, "docs", "archive");
  let totalHeadings = 0;
  let inconsistentHeadings = 0;

  const standardRe = /^####\s+Review\s+#\d+/gm;
  const nonStandardRe = /^###\s+Review\s+#\d+/gm; // 3 hashes instead of 4
  const twoHashRe = /^##\s+Review\s+#\d+/gm; // 2 hashes

  function countInContent(content) {
    const standard = (content.match(standardRe) || []).length;
    const nonStd3 = (content.match(nonStandardRe) || []).length;
    const nonStd2 = (content.match(twoHashRe) || []).length;
    return { standard, nonStandard: nonStd3 + nonStd2 };
  }

  try {
    if (fs.existsSync(learningsPath)) {
      const content = fs.readFileSync(learningsPath, "utf8");
      const counts = countInContent(content);
      totalHeadings += counts.standard + counts.nonStandard;
      inconsistentHeadings += counts.nonStandard;
    }
  } catch {
    // skip
  }

  try {
    if (fs.existsSync(archiveDir)) {
      const archiveFiles = fs.readdirSync(archiveDir).filter((f) => f.startsWith("REVIEWS_"));
      for (const af of archiveFiles) {
        try {
          const content = fs.readFileSync(path.join(archiveDir, af), "utf8");
          const counts = countInContent(content);
          totalHeadings += counts.standard + counts.nonStandard;
          inconsistentHeadings += counts.nonStandard;
        } catch {
          // skip
        }
      }
    }
  } catch {
    // skip
  }

  return { inconsistentHeadings, totalHeadings };
}

/**
 * Check archive reference section accuracy.
 * The learnings log should list the correct number of archive files.
 * Returns { claimedArchiveCount, actualArchiveCount, mismatch }.
 */
function checkArchiveReferenceAccuracy(rootDir) {
  const learningsPath = path.join(rootDir, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
  const archiveDir = path.join(rootDir, "docs", "archive");
  let claimedArchiveCount = 0;
  let actualArchiveCount = 0;

  try {
    if (fs.existsSync(archiveDir)) {
      actualArchiveCount = fs
        .readdirSync(archiveDir)
        .filter((f) => f.startsWith("REVIEWS_")).length;
    }
  } catch {
    // skip
  }

  try {
    if (fs.existsSync(learningsPath)) {
      const content = fs.readFileSync(learningsPath, "utf8");
      // Count "Archive N" references in the archive reference section
      const archiveRefs = content.match(/\*\*Archive\s+\d+\*\*/g) || [];
      claimedArchiveCount = archiveRefs.length;
    }
  } catch {
    // skip
  }

  return {
    claimedArchiveCount,
    actualArchiveCount,
    mismatch: claimedArchiveCount !== actualArchiveCount,
  };
}

/**
 * Detect duplicate review numbers across active log and archive files.
 * Returns { duplicateNumbers, totalReviewNumbers }.
 */
function detectDuplicateReviewNumbers(rootDir) {
  const learningsPath = path.join(rootDir, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
  const archiveDir = path.join(rootDir, "docs", "archive");
  const reviewIdRe = /^#{2,4}\s+Review\s+#(\d+)/gm;
  const allIds = [];

  function extractIds(content) {
    let match;
    const re = new RegExp(reviewIdRe.source, reviewIdRe.flags);
    while ((match = re.exec(content)) !== null) {
      allIds.push(parseInt(match[1], 10));
    }
  }

  try {
    if (fs.existsSync(learningsPath)) {
      extractIds(fs.readFileSync(learningsPath, "utf8"));
    }
  } catch {
    // skip
  }

  try {
    if (fs.existsSync(archiveDir)) {
      const archiveFiles = fs.readdirSync(archiveDir).filter((f) => f.startsWith("REVIEWS_"));
      for (const af of archiveFiles) {
        try {
          extractIds(fs.readFileSync(path.join(archiveDir, af), "utf8"));
        } catch {
          // skip
        }
      }
    }
  } catch {
    // skip
  }

  const seen = new Set();
  const duplicates = new Set();
  for (const id of allIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return { duplicateNumbers: [...duplicates], totalReviewNumbers: allIds.length };
}

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

  // Heading format consistency
  const headingCheck = checkHeadingFormatConsistency(rootDir);

  // Archive reference accuracy
  const refCheck = checkArchiveReferenceAccuracy(rootDir);

  // Duplicate review numbers
  const dupCheck = detectDuplicateReviewNumbers(rootDir);

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
        "Too many active reviews bloats the file and slows parsing. Run `npm run reviews:archive -- --apply` to move old reviews.",
      impactScore: activeReviewCount > 25 ? 70 : 45,
      frequency: 1,
      blastRadius: 2,
      patchType: "archive_command",
      patchImpact: `Archive ~${activeReviewCount - bench.active_review_count.good} reviews to reduce active file size`,
    });
  }

  if (headingCheck.inconsistentHeadings > 0) {
    findings.push({
      id: "PEA-602",
      category: "archive_retention_health",
      domain: DOMAIN,
      severity: "warning",
      message: `${headingCheck.inconsistentHeadings}/${headingCheck.totalHeadings} review headings use non-standard format (### instead of ####)`,
      details:
        "Standard format is `#### Review #N`. Mixed formats break pattern extraction and archive scripts. " +
        "Fix with: sed -i 's/^### Review #/#### Review #/g' in affected files.",
      impactScore: 40,
      frequency: headingCheck.inconsistentHeadings,
      blastRadius: 2,
      patchType: "sed_command",
      patchImpact: "Standardize review heading format for reliable parsing",
    });
  }

  if (refCheck.mismatch) {
    findings.push({
      id: "PEA-603",
      category: "archive_retention_health",
      domain: DOMAIN,
      severity: "warning",
      message: `Archive reference mismatch: log claims ${refCheck.claimedArchiveCount} files, ${refCheck.actualArchiveCount} exist on disk`,
      details:
        "The archive reference section in AI_REVIEW_LEARNINGS_LOG.md should list all REVIEWS_*.md files in docs/archive/. " +
        "Update the reference section after archival operations.",
      impactScore: 35,
      frequency: 1,
      blastRadius: 1,
    });
  }

  if (dupCheck.duplicateNumbers.length > 0) {
    findings.push({
      id: "PEA-604",
      category: "archive_retention_health",
      domain: DOMAIN,
      severity: "info",
      message: `${dupCheck.duplicateNumbers.length} duplicate review number(s) detected: #${dupCheck.duplicateNumbers.slice(0, 5).join(", #")}`,
      details:
        "Duplicate review numbers occur when the same number is reused across different PRs. " +
        "This is a known issue that doesn't require fixing but should be tracked for data integrity awareness.",
      impactScore: 20,
      frequency: dupCheck.duplicateNumbers.length,
      blastRadius: 1,
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: {
      activeReviewCount,
      archiveCount,
      archiveAccessiblePct,
      inconsistentHeadings: headingCheck.inconsistentHeadings,
      totalHeadings: headingCheck.totalHeadings,
      archiveRefMismatch: refCheck.mismatch,
      duplicateReviewNumbers: dupCheck.duplicateNumbers.length,
    },
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

/**
 * Measure pattern coverage in JSONL — what percentage of reviews have extracted patterns.
 * Low coverage means the sync script's pattern extraction is failing.
 * Returns { totalReviews, withPatterns, coveragePct }.
 */
function measurePatternCoverage(rootDir) {
  const reviewsJsonlPath = path.join(rootDir, ".claude", "state", "reviews.jsonl");
  try {
    if (!fs.existsSync(reviewsJsonlPath))
      return { totalReviews: 0, withPatterns: 0, coveragePct: 0 };
    const content = fs.readFileSync(reviewsJsonlPath, "utf8");
    const lines = content.trim().split("\n").filter(Boolean);
    let totalReviews = 0;
    let withPatterns = 0;
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        // Only count actual reviews, not retros
        if (entry.type === "retrospective") continue;
        totalReviews++;
        if (Array.isArray(entry.patterns) && entry.patterns.length > 0) {
          withPatterns++;
        }
      } catch {
        // skip corrupt lines
      }
    }
    const coveragePct = totalReviews > 0 ? Math.round((withPatterns / totalReviews) * 100) : 0;
    return { totalReviews, withPatterns, coveragePct };
  } catch {
    return { totalReviews: 0, withPatterns: 0, coveragePct: 0 };
  }
}

function checkJsonlSyncFidelity(rootDir, findings) {
  const bench = BENCHMARKS.jsonl_sync_fidelity;
  const { driftCount, corruptedLines } = measureJsonlDrift(rootDir);
  const patternCov = measurePatternCoverage(rootDir);

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

  if (patternCov.totalReviews > 10 && patternCov.coveragePct < 50) {
    findings.push({
      id: "PEA-703",
      category: "jsonl_sync_fidelity",
      domain: DOMAIN,
      severity: patternCov.coveragePct < 20 ? "error" : "warning",
      message: `Low pattern coverage: ${patternCov.withPatterns}/${patternCov.totalReviews} reviews have patterns (${patternCov.coveragePct}%)`,
      details:
        "Pattern extraction from markdown reviews is failing for most entries. " +
        "Run `npm run reviews:sync -- --repair --apply` to re-extract patterns from all reviews. " +
        "This was a real bug found in Session #193 — the sync script only matched one markdown format.",
      impactScore: patternCov.coveragePct < 20 ? 85 : 60,
      frequency: patternCov.totalReviews - patternCov.withPatterns,
      blastRadius: 3,
      patchType: "sync_command",
      patchImpact: "Re-extract patterns from markdown to populate JSONL entries",
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: {
      driftCount,
      corruptedLines,
      patternCoveragePct: patternCov.coveragePct,
      reviewsWithPatterns: patternCov.withPatterns,
      totalReviewsInJsonl: patternCov.totalReviews,
    },
  };
}

module.exports = { run, DOMAIN };
