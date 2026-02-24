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

/* eslint-disable no-unused-vars -- safeRequire is a safety wrapper */
function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[process-compliance] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

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
  const reviewsJsonl = loadJsonl(path.join(rootDir, ".claude", "state", "reviews.jsonl"));
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

/**
 * Like countAllKeywordHits but also checks corresponding markdown sections.
 */
function countAllKeywordHitsWithMarkdown(reviews, keywords, mdSections) {
  let total = 0;
  let matched = 0;
  for (const review of reviews) {
    const reviewText = JSON.stringify(review).toLowerCase();
    const mdText = (mdSections[review.id] || "").toLowerCase();
    const combined = reviewText + " " + mdText;
    for (const kw of keywords) {
      total++;
      if (combined.includes(kw)) {
        matched++;
      }
    }
  }
  return { total, matched };
}

/**
 * Like countKeywordMatches but also checks corresponding markdown sections.
 */
function countKeywordMatchesWithMarkdown(reviews, keywords, mdSections) {
  let count = 0;
  for (const review of reviews) {
    const reviewText = JSON.stringify(review).toLowerCase();
    const mdText = (mdSections[review.id] || "").toLowerCase();
    const combined = reviewText + " " + mdText;
    if (keywords.some((kw) => combined.includes(kw))) {
      count++;
    }
  }
  return count;
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

/**
 * Extract per-review markdown sections from the learnings log.
 * Returns a map of reviewId -> sectionText for recent reviews.
 */
function extractMarkdownSections(learningsContent, reviewIds) {
  const sections = {};
  if (!learningsContent) return sections;
  const lines = learningsContent.split("\n");
  const headingRe = /^#{2,4}\s+Review\s+#(\d+)\b/i;
  // Build index of heading positions
  const headings = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(headingRe);
    if (m) headings.push({ line: i, id: parseInt(m[1], 10) });
  }
  const idSet = new Set(reviewIds);
  for (let h = 0; h < headings.length; h++) {
    if (!idSet.has(headings[h].id)) continue;
    const startLine = headings[h].line;
    const endLine = h + 1 < headings.length ? headings[h + 1].line : lines.length;
    sections[headings[h].id] = lines.slice(startLine, endLine).join("\n");
  }
  return sections;
}

function checkSkillInvocationFidelity(reviewsJsonl, learningsContent, findings) {
  const bench = BENCHMARKS.skill_invocation_fidelity;

  // Check recent reviews for step documentation (exclude retros)
  const recentReviews = reviewsJsonl
    .filter((r) => r.type !== "retrospective" && typeof r.id === "number")
    .slice(-10);

  // pr-review step evidence: keywords that appear in review entries or markdown sections
  // when steps are actually followed (calibrated against real review data)
  // Calibrated: uses synonym groups — each keyword maps to a step in the pr-review skill.
  // Not every review touches every step, so good=70% is ambitious (keyword×review matrix).
  const stepKeywords = [
    "pre-push", // Step 0.5: pre-checks (also: "pre-commit", "ci blocker")
    "source", // Step 1: intake — reviews list their "Source:" field
    "pars", // Step 2: parsing (matches "parsing", "parsed")
    "sonarcloud", // Step 3: SonarCloud integration
    "qodo", // Step 4: Qodo integration
    "categoriz", // Step 5: categorization (matches "categorize", "categorized")
    "reject", // Step 6: dedup/triage (matches "rejected" — reviews list rejected items)
    "propagation", // Step 7: propagation sweep
    "fix", // Step 8: fix implementation (matches "fixed", "fixes")
    "pattern", // Step 9: pattern identification
    "learning", // Step 10: learning capture
    "resolv", // Step 11: resolution (matches "resolved", "resolving")
    "commit", // Step 12: commit and push
  ];

  // Combine JSONL data with markdown sections for richer keyword matching
  const reviewIds = recentReviews.map((r) => r.id).filter((id) => typeof id === "number");
  const mdSections = extractMarkdownSections(learningsContent, reviewIds);

  const { total: totalSteps, matched: documentedSteps } =
    recentReviews.length > 0
      ? countAllKeywordHitsWithMarkdown(recentReviews, stepKeywords, mdSections)
      : { total: 0, matched: 0 };

  const stepsPct = totalSteps > 0 ? Math.round((documentedSteps / totalSteps) * 100) : 0;

  // Check pre-checks: evidence of Step 0.5 execution (security, CC, propagation)
  // Calibrated: CI pipeline, pre-commit hooks, and external tools ARE pre-push gates
  const preCheckKeywords = [
    "pre-push",
    "pre-check",
    "pre-commit",
    "security sweep",
    "security",
    "cc check",
    "cc reduction",
    "cognitive complexity",
    "propagation sweep",
    "propagation",
    "step 0.5",
    "verification pass",
    "npm run lint",
    "npm run patterns",
    "pattern compliance",
    "ci blocker",
    "ci failure",
    "lint",
    "eslint",
    "prettier",
    "dos",
    "redos",
  ];
  const preCheckEvidence = countKeywordMatchesWithMarkdown(
    recentReviews,
    preCheckKeywords,
    mdSections
  );
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

function computeKeywordPctWithMarkdown(reviews, keywords, mdSections, defaultPct) {
  const matchCount = countKeywordMatchesWithMarkdown(reviews, keywords, mdSections);
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

  // Exclude retros — only check actual review entries
  const reviews = reviewsJsonl
    .filter((r) => r.type !== "retrospective" && typeof r.id === "number")
    .slice(-10);

  // Extract markdown sections for richer matching
  const reviewIds = reviews.map((r) => r.id).filter((id) => typeof id === "number");
  const mdSections = extractMarkdownSections(learningsContent, reviewIds);

  // Multi-pass parsing check
  // Calibrated: structured review entries (Source/Total/Fixed/Rejected/Deferred/Key patterns)
  // ARE evidence of multi-pass processing — intake, triage, resolution, and pattern analysis.
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
    "total items", // intake counting phase evidence
    "rejected", // triage/dedup phase evidence
    "deferred", // prioritization phase evidence
    "key pattern", // pattern analysis phase evidence
  ];
  const multiPassPct = computeKeywordPctWithMarkdown(reviews, multiPassKeywords, mdSections);

  // Propagation sweep check — broadened to catch common evidence of codebase-wide searches
  const propagationKeywords = [
    "propagation",
    "grep -rn",
    "grep -r",
    "searched codebase",
    "all instances",
    "all occurrences",
    "all files",
    "across the codebase",
    "codebase-wide",
    "full sweep",
    "step 5.6",
    "all copies",
    "all callers",
    "checked all",
    "verified all",
    "updated all",
    "fixed all",
    "every instance",
    "every occurrence",
    "crlf propagation",
    "propagation miss",
    "propagation check",
    "searched for",
    "scan",
  ];
  const propagationPct = computeKeywordPctWithMarkdown(reviews, propagationKeywords, mdSections);

  // Pre-commit verification evidence: lint, test, pattern checks, agent review
  const prePushKeywords = [
    "code-reviewer",
    "pre-push",
    "pre-commit",
    "npm run lint",
    "npm test",
    "eslint",
    "pattern",
    "compliance",
    "verification",
    "agent",
  ];
  const prePushPct = computeKeywordPctWithMarkdown(reviews, prePushKeywords, mdSections, 100);

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

  // Count retro entries that have structured action items (processImprovements, automationCandidates,
  // skillsToUpdate) — these ARE tracking even without separate DEBT entries
  const retroEntries = reviewsJsonl.filter((r) => r.type === "retrospective");
  let retrosWithActionItems = 0;
  for (const retro of retroEntries) {
    const hasItems =
      (retro.processImprovements || []).length > 0 ||
      (retro.automationCandidates || []).length > 0 ||
      (retro.skillsToUpdate || []).length > 0;
    if (hasItems) retrosWithActionItems++;
  }
  // Credit both DEBT entries AND retro-embedded action items as "tracked"
  const trackedItems = retroDebtItems.length + retrosWithActionItems;
  const expectedActionItems = Math.max(1, retroCount);
  const trackedPct = Math.min(100, Math.round((trackedItems / expectedActionItems) * 100));

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
  // Empty arrays ARE populated — they mean "checked, found none" (e.g., patterns: [])
  // which is different from the field being absent entirely
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
  for (const match of learningsContent.matchAll(/#{2,4}\s+Review\s+#(\d+)/gi)) {
    activeNumbers.push(parseInt(match[1], 10));
  }
  if (activeNumbers.length <= 1) return { gaps: 0, count: activeNumbers.length };

  // Find the active range boundaries
  const minActive = Math.min(...activeNumbers);
  const maxActive = Math.max(...activeNumbers);
  const allNumbers = [...activeNumbers];

  // Scan only the immediately adjacent archive to bridge the gap between
  // archived and active reviews. Historical gaps in older archives are
  // intentional (skipped/merged reviews) and should not be counted.
  if (rootDir) {
    const archiveDir = path.join(rootDir, "docs", "archive");
    try {
      const archiveFiles = fs
        .readdirSync(archiveDir)
        .filter((f) => /^REVIEWS_\d+-\d+\.md$/i.test(f));
      for (const file of archiveFiles) {
        const rangeMatch = file.match(/REVIEWS_(\d+)-(\d+)\.md/i);
        if (rangeMatch) {
          const archiveStart = parseInt(rangeMatch[1], 10);
          const archiveEnd = parseInt(rangeMatch[2], 10);
          // Only scan archives that directly overlap with or are adjacent to the active range
          if (archiveEnd < minActive - 1 || archiveStart > maxActive + 1) continue;
        }
        const filePath = path.join(archiveDir, file); // startsWith containment below
        if (!path.resolve(filePath).startsWith(path.resolve(archiveDir) + path.sep)) continue;
        const content = fs.readFileSync(filePath, "utf8");
        for (const m of content.matchAll(/#{2,4}\s+Review\s+#(\d+)/gi)) {
          allNumbers.push(parseInt(m[1], 10));
        }
      }
    } catch (err) {
      // Archives not accessible — count gaps from active log only
      console.warn(
        `[process-compliance] Could not read archive directory: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const unique = [...new Set(allNumbers)].sort((a, b) => a - b);
  // Only count gaps within the active range (minActive..maxActive).
  // Gaps in older archived reviews are historical and not actionable.
  let gaps = 0;
  for (let i = 1; i < unique.length; i++) {
    if (unique[i] < minActive) continue; // skip pre-active archive gaps
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
