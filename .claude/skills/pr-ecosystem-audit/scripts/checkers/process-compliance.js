/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Process Compliance Checker — Categories 1-4
 *
 * 1. Skill Invocation Fidelity
 * 2. Review Process Completeness
 * 3. Retro Quality & Compliance
 * 4. Learning Capture Integrity
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { scoreMetric } = require("../lib/scoring");
const { BENCHMARKS } = require("../lib/benchmarks");

const DOMAIN = "process_compliance";

/**
 * Run all process compliance checks.
 * @param {object} ctx - { rootDir, benchmarks }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // Load shared data
  const reviewsJsonl = loadJsonl(path.join(rootDir, "docs", "data", "reviews.jsonl"));
  const learningsPath = path.join(rootDir, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
  const learningsContent = safeReadFile(learningsPath);
  const debtItems = loadJsonl(path.join(rootDir, "docs", "technical-debt", "MASTER_DEBT.jsonl"));

  // ── Category 1: Skill Invocation Fidelity ────────────────────────────────
  const cat1 = checkSkillInvocationFidelity(reviewsJsonl, learningsContent, findings);
  scores.skill_invocation_fidelity = cat1;

  // ── Category 2: Review Process Completeness ──────────────────────────────
  const cat2 = checkReviewProcessCompleteness(reviewsJsonl, learningsContent, rootDir, findings);
  scores.review_process_completeness = cat2;

  // ── Category 3: Retro Quality & Compliance ───────────────────────────────
  const cat3 = checkRetroQualityCompliance(reviewsJsonl, learningsContent, debtItems, findings);
  scores.retro_quality_compliance = cat3;

  // ── Category 4: Learning Capture Integrity ───────────────────────────────
  const cat4 = checkLearningCaptureIntegrity(reviewsJsonl, learningsContent, rootDir, findings);
  scores.learning_capture_integrity = cat4;

  return { domain: DOMAIN, findings, scores };
}

// ── Category 1: Skill Invocation Fidelity ──────────────────────────────────

/**
 * Count how many reviews contain at least one keyword from the given list.
 * @param {Array} reviews - array of review objects
 * @param {string[]} keywords - keywords to search for
 * @returns {number} count of reviews matching at least one keyword
 */
function countKeywordMatches(reviews, keywords) {
  let count = 0;
  for (const review of reviews) {
    const text = JSON.stringify(review).toLowerCase();
    if (keywords.some((kw) => text.includes(kw))) {
      count++;
    }
  }
  return count;
}

/**
 * Count total keyword hits across all reviews (each review x each keyword = one opportunity).
 * @param {Array} reviews - array of review objects
 * @param {string[]} keywords - keywords to search for
 * @returns {{ total: number, matched: number }}
 */
function countAllKeywordHits(reviews, keywords) {
  let total = 0;
  let matched = 0;
  for (const review of reviews) {
    const reviewText = JSON.stringify(review).toLowerCase();
    for (const kw of keywords) {
      total++;
      if (reviewText.includes(kw)) {
        matched++;
      }
    }
  }
  return { total, matched };
}

function pushStepsFinding(
  findings,
  stepsResult,
  bench,
  stepsPct,
  documentedSteps,
  totalSteps,
  reviewCount
) {
  findings.push({
    id: "PEA-101",
    category: "skill_invocation_fidelity",
    domain: DOMAIN,
    severity: stepsResult.rating === "poor" ? "error" : "warning",
    message: `PR review steps documented at ${stepsPct}% (${documentedSteps}/${totalSteps} step-keywords found across ${reviewCount} reviews)`,
    details: `Review entries may be missing step documentation. Benchmark: good=${bench.steps_completed_pct.good}%, current=${stepsPct}%`,
    impactScore: stepsResult.rating === "poor" ? 75 : 50,
    frequency: reviewCount,
    blastRadius: 2,
    patchType: "skill_update",
    patchTarget: ".claude/skills/pr-review/SKILL.md",
    patchContent: "Add compliance checklist verifying all steps are documented in review entries",
    patchImpact: "Ensure complete step coverage in review documentation",
  });
}

function pushPreCheckFinding(
  findings,
  preCheckResult,
  preCheckPct,
  preCheckEvidence,
  preCheckOpportunities
) {
  findings.push({
    id: "PEA-102",
    category: "skill_invocation_fidelity",
    domain: DOMAIN,
    severity: preCheckResult.rating === "poor" ? "error" : "warning",
    message: `Pre-push checks evidenced in only ${preCheckPct}% of recent reviews (${preCheckEvidence}/${preCheckOpportunities})`,
    details:
      "Step 0.5 pre-push checks (security sweep, CC check, propagation) may not be running consistently",
    impactScore: preCheckResult.rating === "poor" ? 80 : 55,
    frequency: preCheckOpportunities,
    blastRadius: 3,
    patchType: "skill_update",
    patchTarget: ".claude/skills/pr-review/SKILL.md",
    patchContent: "Add mandatory pre-check evidence logging requirement",
    patchImpact: "Prevent multi-round churn from missed pre-checks",
  });
}

function checkSkillInvocationFidelity(reviewsJsonl, learningsContent, findings) {
  const bench = BENCHMARKS.skill_invocation_fidelity;

  // Check recent reviews for step documentation
  const recentReviews = reviewsJsonl
    .filter((r) => r.type === "review" || r.pr_number || r.pr || typeof r.id === "number")
    .slice(-10);

  // pr-review has 10 major steps (0, 0.5, 1, 1.5, 2, 3, 4, 5, 6-9)
  const stepKeywords = [
    "context loading",
    "pre-push",
    "intake",
    "parsing",
    "sonarcloud",
    "categoriz",
    "plan",
    "agent",
    "fix",
    "document",
    "learning",
    "summary",
    "commit",
  ];

  const { total: totalSteps, matched: documentedSteps } =
    recentReviews.length > 0
      ? countAllKeywordHits(recentReviews, stepKeywords)
      : { total: 0, matched: 0 };

  const stepsPct = totalSteps > 0 ? Math.round((documentedSteps / totalSteps) * 100) : 0;

  // Check pre-checks: look for evidence of Step 0.5 execution
  const preCheckKeywords = [
    "pre-push",
    "pre-check",
    "security sweep",
    "cc check",
    "cc reduction",
    "cognitive complexity",
    "propagation sweep",
    "step 0.5",
    "algorithm design",
    "verification pass",
    "npm run lint",
    "npm run patterns",
  ];
  const preCheckEvidence = countKeywordMatches(recentReviews, preCheckKeywords);
  const preCheckOpportunities = Math.max(1, recentReviews.length);
  const preCheckPct = Math.round((preCheckEvidence / preCheckOpportunities) * 100);

  const stepsResult = scoreMetric(stepsPct, bench.steps_completed_pct, "higher-is-better");
  const preCheckResult = scoreMetric(preCheckPct, bench.pre_checks_run_pct, "higher-is-better");

  const avgScore = Math.round((stepsResult.score + preCheckResult.score) / 2);

  if (stepsResult.rating !== "good") {
    pushStepsFinding(
      findings,
      stepsResult,
      bench,
      stepsPct,
      documentedSteps,
      totalSteps,
      recentReviews.length
    );
  }

  if (preCheckResult.rating !== "good") {
    pushPreCheckFinding(
      findings,
      preCheckResult,
      preCheckPct,
      preCheckEvidence,
      preCheckOpportunities
    );
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: { stepsPct, preCheckPct, reviewsAnalyzed: recentReviews.length },
  };
}

// ── Category 2: Review Process Completeness ────────────────────────────────

function computeKeywordPct(reviews, keywords, defaultPct) {
  const matchCount = countKeywordMatches(reviews, keywords);
  if (reviews.length === 0) return defaultPct !== undefined ? defaultPct : 0;
  return Math.round((matchCount / reviews.length) * 100);
}

function pushPropagationFinding(findings, r2, propagationPct, reviewCount) {
  findings.push({
    id: "PEA-201",
    category: "review_process_completeness",
    domain: DOMAIN,
    severity: r2.rating === "poor" ? "error" : "warning",
    message: `Propagation sweeps found in only ${propagationPct}% of reviews`,
    details:
      "Pattern 5 (Propagation Failures) is a known churn driver. After fixing any pattern-based issue, grep ALL instances across codebase before committing.",
    impactScore: r2.rating === "poor" ? 85 : 60,
    frequency: reviewCount,
    blastRadius: 4,
  });
}

function pushMultiPassFinding(findings, multiPassPct, reviewCount) {
  findings.push({
    id: "PEA-202",
    category: "review_process_completeness",
    domain: DOMAIN,
    severity: "warning",
    message: `Multi-pass parsing used in ${multiPassPct}% of reviews`,
    details:
      "For reviews >200 lines, multi-pass extraction (extract headers, then details, then verify) prevents missed items",
    impactScore: 45,
    frequency: reviewCount,
    blastRadius: 2,
  });
}

function checkReviewProcessCompleteness(reviewsJsonl, learningsContent, rootDir, findings) {
  const bench = BENCHMARKS.review_process_completeness;

  const reviews = reviewsJsonl
    .filter((r) => r.type === "review" || r.pr_number || r.pr || typeof r.id === "number")
    .slice(-10);

  // Multi-pass parsing check
  const multiPassKeywords = [
    "first pass",
    "second pass",
    "third pass",
    "multi-pass",
    "systematic",
    "categoriz",
    "dedup",
    "after dedup",
    "unique after",
    "raw suggestions",
    "intake",
    "triage",
    "step 1",
    "step 2",
    "step 3",
  ];
  const multiPassPct = computeKeywordPct(reviews, multiPassKeywords);

  // Propagation sweep check
  const propagationKeywords = [
    "propagation",
    "grep -rn",
    "searched codebase",
    "all instances",
    "full sweep",
    "step 5.6",
    "all copies",
    "all callers",
    "crlf propagation",
    "propagation miss",
    "propagation check",
  ];
  const propagationPct = computeKeywordPct(reviews, propagationKeywords);

  // Pre-push gate check (new files >500 lines) — default to 100 if no reviews
  const prePushKeywords = [
    "code-reviewer agent",
    "pre-push",
    "new file",
    ">500 lines",
    "large file",
  ];
  const prePushPct = computeKeywordPct(reviews, prePushKeywords, 100);

  const r1 = scoreMetric(multiPassPct, bench.multi_pass_pct, "higher-is-better");
  const r2 = scoreMetric(propagationPct, bench.propagation_sweep_pct, "higher-is-better");
  const r3 = scoreMetric(prePushPct, bench.pre_push_gate_pct, "higher-is-better");

  const avgScore = Math.round((r1.score + r2.score + r3.score) / 3);

  if (r2.rating !== "good") {
    pushPropagationFinding(findings, r2, propagationPct, reviews.length);
  }

  if (r1.rating !== "good") {
    pushMultiPassFinding(findings, multiPassPct, reviews.length);
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: { multiPassPct, propagationPct, prePushPct, reviewsAnalyzed: reviews.length },
  };
}

// ── Category 3: Retro Quality & Compliance ─────────────────────────────────

const MANDATORY_RETRO_SECTIONS = [
  "Review Cycle Summary",
  "Per-Round Breakdown",
  "Ping-Pong Chains",
  "Rejection Analysis",
  "Recurring Patterns",
  "Previous Retro Action Item Audit",
  "Cross-PR Systemic Analysis",
  "Skills/Templates to Update",
  "Process Improvements",
  "Verdict",
];

function countMandatorySections(learningsContent, retroCount) {
  if (retroCount === 0) return { totalSections: 0, foundSections: 0 };
  const lowerContent = learningsContent.toLowerCase();
  let found = 0;
  for (const section of MANDATORY_RETRO_SECTIONS) {
    if (lowerContent.includes(section.toLowerCase())) found++;
  }
  return { totalSections: MANDATORY_RETRO_SECTIONS.length, foundSections: found };
}

function pushRetroFindings(
  findings,
  r1,
  r2,
  retroCount,
  learningsContent,
  sectionsPct,
  foundSections,
  totalSections,
  retroDebtItems,
  expectedActionItems
) {
  if (r1.rating !== "good" && retroCount > 0) {
    const missingSections = MANDATORY_RETRO_SECTIONS.filter(
      (s) => !learningsContent.toLowerCase().includes(s.toLowerCase())
    );
    findings.push({
      id: "PEA-301",
      category: "retro_quality_compliance",
      domain: DOMAIN,
      severity: r1.rating === "poor" ? "error" : "warning",
      message: `Retro mandatory sections at ${sectionsPct}% (${foundSections}/${totalSections})`,
      details: `Missing sections: ${missingSections.join(", ")}. Found ${retroCount} retro(s) in learnings log.`,
      impactScore: r1.rating === "poor" ? 70 : 50,
      frequency: retroCount,
      blastRadius: 2,
      patchType: "skill_update",
      patchTarget: ".claude/skills/pr-retro/SKILL.md",
      patchContent: "Add self-validation checklist enforcement",
      patchImpact: "Ensure all mandatory sections are always present",
    });
  }
  if (r2.rating !== "good" && retroCount > 0) {
    findings.push({
      id: "PEA-302",
      category: "retro_quality_compliance",
      domain: DOMAIN,
      severity: r2.rating === "poor" ? "error" : "warning",
      message: `Only ${retroDebtItems.length} DEBT entries track retro action items (expected ~${expectedActionItems} from ${retroCount} retros)`,
      details:
        "Retro action items without DEBT entries don't get implemented. Step 5 of pr-retro requires TDMS entries for items >5 min.",
      impactScore: r2.rating === "poor" ? 85 : 60,
      frequency: retroCount,
      blastRadius: 3,
      patchType: "debt_entry",
      patchImpact: "Track retro action items for implementation",
    });
  }
  if (retroCount === 0) {
    findings.push({
      id: "PEA-303",
      category: "retro_quality_compliance",
      domain: DOMAIN,
      severity: "warning",
      message: "No PR retrospectives found in learnings log",
      details: "Retros drive the feedback loop. Without retros, the ecosystem cannot self-improve.",
      impactScore: 65,
      frequency: 1,
      blastRadius: 4,
    });
  }
}

function checkRetroQualityCompliance(reviewsJsonl, learningsContent, debtItems, findings) {
  const bench = BENCHMARKS.retro_quality_compliance;

  const retroMatches = learningsContent.match(/## PR #\d+ Retrospective/gi) || [];
  const retroCount = retroMatches.length;

  const { totalSections, foundSections } = countMandatorySections(learningsContent, retroCount);
  const sectionsPct = totalSections > 0 ? Math.round((foundSections / totalSections) * 100) : 0;

  const retroDebtItems = debtItems.filter((d) => d.source_id && d.source_id.includes("pr-retro"));
  const expectedActionItems = Math.max(1, retroCount * 2);
  const trackedPct = Math.min(100, Math.round((retroDebtItems.length / expectedActionItems) * 100));

  const r1 = scoreMetric(sectionsPct, bench.mandatory_sections_pct, "higher-is-better");
  const r2 = scoreMetric(trackedPct, bench.action_items_tracked_pct, "higher-is-better");
  const avgScore = Math.round((r1.score + r2.score) / 2);

  pushRetroFindings(
    findings,
    r1,
    r2,
    retroCount,
    learningsContent,
    sectionsPct,
    foundSections,
    totalSections,
    retroDebtItems,
    expectedActionItems
  );

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: { retroCount, sectionsPct, trackedActionItems: retroDebtItems.length, trackedPct },
  };
}

// ── Category 4: Learning Capture Integrity ─────────────────────────────────

function isFieldPopulated(val) {
  if (val === undefined || val === null || val === "") return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}

function computeFieldCompleteness(reviews, requiredFields) {
  let total = 0;
  let populated = 0;
  for (const review of reviews.slice(-20)) {
    for (const field of requiredFields) {
      total++;
      if (isFieldPopulated(review[field])) populated++;
    }
  }
  return { total, populated };
}

function countNumberingGaps(learningsContent, rootDir) {
  // Collect review numbers from active log
  const activeNumbers = [];
  for (const match of learningsContent.matchAll(/### Review #(\d+)/gi)) {
    activeNumbers.push(parseInt(match[1], 10));
  }
  if (activeNumbers.length <= 1) return { gaps: 0, count: activeNumbers.length };

  // Find the minimum active review number to determine overlap range
  const minActive = Math.min(...activeNumbers);
  const allNumbers = [...activeNumbers];

  // Scan only the archive that overlaps with the active range so archived
  // entries adjacent to active ones don't appear as gaps. Historical gaps
  // in older archives are intentional (skipped/merged reviews).
  if (rootDir) {
    const archiveDir = path.join(rootDir, "docs", "archive");
    try {
      const archiveFiles = fs
        .readdirSync(archiveDir)
        .filter((f) => /^REVIEWS_\d+-\d+\.md$/i.test(f));
      for (const file of archiveFiles) {
        // Only scan archives whose range overlaps with the active minimum
        const rangeMatch = file.match(/REVIEWS_(\d+)-(\d+)\.md/i);
        if (rangeMatch) {
          const archiveEnd = parseInt(rangeMatch[2], 10);
          if (archiveEnd < minActive - 10) continue; // skip old archives
        }
        const content = fs.readFileSync(path.join(archiveDir, file), "utf8");
        for (const m of content.matchAll(/### Review #(\d+)/gi)) {
          allNumbers.push(parseInt(m[1], 10));
        }
      }
    } catch (err) {
      // Archives not accessible — count gaps from active log only
      console.warn(`[process-compliance] Could not read archive directory: ${err.message}`);
    }
  }

  const unique = [...new Set(allNumbers)].sort((a, b) => a - b);
  let gaps = 0;
  for (let i = 1; i < unique.length; i++) {
    const gap = unique[i] - unique[i - 1];
    if (gap > 1) gaps += gap - 1;
  }
  return { gaps, count: unique.length };
}

function checkLearningCaptureIntegrity(reviewsJsonl, learningsContent, rootDir, findings) {
  const bench = BENCHMARKS.learning_capture_integrity;
  const reviews = reviewsJsonl.filter((r) => r.type === "review" || typeof r.id === "number");
  // JSONL schema uses 'pr' (not 'pr_number') and 'id' (numeric, not 'review_id')
  const requiredFields = ["id", "pr", "date", "source", "patterns"];

  const { total: totalFieldChecks, populated: populatedFields } = computeFieldCompleteness(
    reviews,
    requiredFields
  );
  const fieldPct =
    totalFieldChecks > 0 ? Math.round((populatedFields / totalFieldChecks) * 100) : 0;

  const { gaps: numberingGaps, count: reviewNumberCount } = countNumberingGaps(
    learningsContent,
    rootDir
  );

  const r1 = scoreMetric(fieldPct, bench.field_completeness_pct, "higher-is-better");
  const r2 = scoreMetric(numberingGaps, bench.numbering_gaps, "lower-is-better");
  const avgScore = Math.round((r1.score + r2.score) / 2);

  if (r1.rating !== "good") {
    findings.push({
      id: "PEA-401",
      category: "learning_capture_integrity",
      domain: DOMAIN,
      severity: "warning",
      message: `Review entry field completeness at ${fieldPct}% (${populatedFields}/${totalFieldChecks})`,
      details: `Checked ${reviews.slice(-20).length} recent entries for fields: ${requiredFields.join(", ")}`,
      impactScore: 40,
      frequency: reviews.length,
      blastRadius: 1,
    });
  }
  if (numberingGaps > 0) {
    findings.push({
      id: "PEA-402",
      category: "learning_capture_integrity",
      domain: DOMAIN,
      severity: numberingGaps > 3 ? "error" : "warning",
      message: `${numberingGaps} numbering gap(s) detected in review sequence (${reviewNumberCount} reviews found)`,
      details:
        "Sequential numbering ensures no reviews are lost. Gaps may indicate missing entries or archive issues.",
      impactScore: numberingGaps > 3 ? 65 : 40,
      frequency: 1,
      blastRadius: 2,
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: {
      fieldPct,
      numberingGaps,
      totalReviews: reviewNumberCount,
      jsonlEntries: reviews.length,
    },
  };
}

// ── Utilities ──────────────────────────────────────────────────────────────

function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 10 * 1024 * 1024) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function loadJsonl(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 10 * 1024 * 1024) return [];
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content
      .split("\n")
      .map((l) => l.replace(/\r$/, ""))
      .filter((l) => l.trim().length > 0);
    let skipped = 0;
    const results = [];
    for (const line of lines) {
      try {
        results.push(JSON.parse(line));
      } catch {
        skipped++;
      }
    }
    if (skipped > 0) {
      console.error(`  [warn] ${skipped} corrupt line(s) skipped in ${path.basename(filePath)}`);
    }
    return results;
  } catch {
    return [];
  }
}

module.exports = { run, DOMAIN };
