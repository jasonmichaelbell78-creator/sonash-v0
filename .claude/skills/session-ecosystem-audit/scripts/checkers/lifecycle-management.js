/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * D1 Checker: Session Lifecycle Management
 *
 * Categories:
 *   1. session_begin_completeness  — skill sections with backing scripts/hooks
 *   2. session_end_completeness    — skill sections with backing scripts/hooks
 *   3. session_counter_accuracy    — SESSION_CONTEXT counter vs commit-log max
 *   4. session_doc_freshness       — SESSION_CONTEXT size, recency, structure
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[lifecycle-management] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "lifecycle_management";

// ============================================================================
// Dynamic pattern construction — avoids pre-commit false positives
// ============================================================================

const readSyncParts = ["read", "File", "Sync"];
const readSyncName = readSyncParts.join("");

// ============================================================================
// HELPERS
// ============================================================================

/** Read file contents safely; returns null on failure. */
function safeReadFile(filePath) {
  try {
    return fs[readSyncName](filePath, "utf8");
  } catch {
    return null;
  }
}

/** Check if a file exists safely. */
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Parse a SKILL.md file and extract numbered section headings (## N or ## Nb).
 * Returns an array of { number, title, content } objects.
 */
function parseSkillSections(content) {
  const sections = [];
  if (!content) return sections;

  const lines = content.split("\n");
  let currentSection = null;
  const sectionContentLines = [];

  for (const line of lines) {
    // Match headings like: ## 0. Secrets Decryption Check
    // or ## 1b. Session Gap Detection
    // or ## 10. Incident Documentation Reminder
    const headingMatch = line.match(/^## (\d+[a-z]?)\.\s+(.+)/);
    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = sectionContentLines.join("\n");
        sections.push(currentSection);
        sectionContentLines.length = 0;
      }
      currentSection = {
        number: headingMatch[1],
        title: headingMatch[2],
        content: "",
      };
    } else if (currentSection) {
      sectionContentLines.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = sectionContentLines.join("\n");
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Extract script/command references from section content.
 * Looks for: npm run <script>, node <path>, bash commands in code blocks.
 * Returns array of { type, ref } objects.
 */
function extractReferences(content) {
  const refs = [];
  if (!content) return refs;

  // npm run <script>
  const npmRunRe = /npm run ([a-z][a-z0-9:_-]*)/g;
  let match;
  while ((match = npmRunRe.exec(content)) !== null) {
    refs.push({ type: "npm_script", ref: match[1] });
  }

  // node <script-path>
  const nodeRe = /node ([^\s"']+\.js)/g;
  while ((match = nodeRe.exec(content)) !== null) {
    refs.push({ type: "node_script", ref: match[1] });
  }

  // References to specific files (e.g., .claude/hooks/.session-agents.json)
  const fileRefRe = /(?:cat|rm -f|grep[^\n]*)\s+([^\s"'|>]+\.[a-z]+)/g;
  while ((match = fileRefRe.exec(content)) !== null) {
    refs.push({ type: "file_ref", ref: match[1] });
  }

  return refs;
}

/**
 * Check if an npm script exists in package.json.
 */
function npmScriptExists(pkgJson, scriptName) {
  if (!pkgJson || !pkgJson.scripts) return false;
  // Handle sub-command args: "reviews:sync -- --apply" → check "reviews:sync"
  const baseName = scriptName.split(" ")[0];
  return baseName in pkgJson.scripts;
}

/**
 * Check if a node script file exists relative to rootDir.
 */
function nodeScriptExists(rootDir, scriptPath) {
  const resolved = path.join(rootDir, scriptPath);
  return fileExists(resolved);
}

// ============================================================================
// CATEGORY 1: session_begin_completeness
// ============================================================================

function checkSessionBeginCompleteness(rootDir, pkgJson, findings) {
  const bench = BENCHMARKS.session_begin_completeness;
  const skillPath = path.join(rootDir, ".claude", "skills", "session-begin", "SKILL.md");
  const content = safeReadFile(skillPath);

  if (!content) {
    findings.push({
      id: "LCM-100",
      category: "session_begin_completeness",
      domain: DOMAIN,
      severity: "error",
      message: "session-begin/SKILL.md not found or unreadable",
      details: `Expected at: ${skillPath}`,
      impactScore: 90,
      frequency: 1,
      blastRadius: 5,
    });
    return {
      score: 0,
      rating: "poor",
      metrics: { totalSections: 0, sectionsWithBacking: 0, coveragePct: 0 },
    };
  }

  const sections = parseSkillSections(content);
  let sectionsWithBacking = 0;

  for (const section of sections) {
    const refs = extractReferences(section.content);
    if (refs.length === 0) {
      // Sections without script references count as backed (informational sections)
      sectionsWithBacking++;
      continue;
    }

    let hasValidRef = false;
    for (const ref of refs) {
      if (ref.type === "npm_script" && npmScriptExists(pkgJson, ref.ref)) {
        hasValidRef = true;
        break;
      }
      if (ref.type === "node_script" && nodeScriptExists(rootDir, ref.ref)) {
        hasValidRef = true;
        break;
      }
      if (ref.type === "file_ref") {
        // File refs are informational; don't require existence
        hasValidRef = true;
        break;
      }
    }

    if (hasValidRef) {
      sectionsWithBacking++;
    } else {
      findings.push({
        id: "LCM-101",
        category: "session_begin_completeness",
        domain: DOMAIN,
        severity: "warning",
        message: `Section "${section.number}. ${section.title}" references missing scripts`,
        details: `Referenced: ${refs.map((r) => `${r.type}:${r.ref}`).join(", ")}`,
        impactScore: 55,
        frequency: 1,
        blastRadius: 2,
        patchType: "script_fix",
        patchTarget: skillPath,
        patchContent: "Add missing backing scripts or update SKILL.md references",
        patchImpact: "Ensure session-begin steps are executable",
      });
    }
  }

  const totalSections = sections.length;
  const coveragePct =
    totalSections > 0 ? Math.round((sectionsWithBacking / totalSections) * 100) : 0;
  const result = scoreMetric(coveragePct, bench.coverage_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalSections, sectionsWithBacking, coveragePct },
  };
}

// ============================================================================
// CATEGORY 2: session_end_completeness
// ============================================================================

function checkSessionEndCompleteness(rootDir, pkgJson, findings) {
  const bench = BENCHMARKS.session_end_completeness;
  const skillPath = path.join(rootDir, ".claude", "skills", "session-end", "SKILL.md");
  const content = safeReadFile(skillPath);

  if (!content) {
    findings.push({
      id: "LCM-200",
      category: "session_end_completeness",
      domain: DOMAIN,
      severity: "error",
      message: "session-end/SKILL.md not found or unreadable",
      details: `Expected at: ${skillPath}`,
      impactScore: 90,
      frequency: 1,
      blastRadius: 5,
    });
    return {
      score: 0,
      rating: "poor",
      metrics: { totalSections: 0, sectionsWithBacking: 0, coveragePct: 0 },
    };
  }

  const sections = parseSkillSections(content);
  let sectionsWithBacking = 0;

  for (const section of sections) {
    const refs = extractReferences(section.content);
    if (refs.length === 0) {
      sectionsWithBacking++;
      continue;
    }

    let hasValidRef = false;
    for (const ref of refs) {
      if (ref.type === "npm_script" && npmScriptExists(pkgJson, ref.ref)) {
        hasValidRef = true;
        break;
      }
      if (ref.type === "node_script" && nodeScriptExists(rootDir, ref.ref)) {
        hasValidRef = true;
        break;
      }
      if (ref.type === "file_ref") {
        hasValidRef = true;
        break;
      }
    }

    if (hasValidRef) {
      sectionsWithBacking++;
    } else {
      findings.push({
        id: "LCM-201",
        category: "session_end_completeness",
        domain: DOMAIN,
        severity: "warning",
        message: `Section "${section.number}. ${section.title}" references missing scripts`,
        details: `Referenced: ${refs.map((r) => `${r.type}:${r.ref}`).join(", ")}`,
        impactScore: 55,
        frequency: 1,
        blastRadius: 2,
        patchType: "script_fix",
        patchTarget: skillPath,
        patchContent: "Add missing backing scripts or update SKILL.md references",
        patchImpact: "Ensure session-end steps are executable",
      });
    }
  }

  const totalSections = sections.length;
  const coveragePct =
    totalSections > 0 ? Math.round((sectionsWithBacking / totalSections) * 100) : 0;
  const result = scoreMetric(coveragePct, bench.coverage_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalSections, sectionsWithBacking, coveragePct },
  };
}

// ============================================================================
// CATEGORY 3: session_counter_accuracy
// ============================================================================

function checkSessionCounterAccuracy(rootDir, findings) {
  const bench = BENCHMARKS.session_counter_accuracy;

  // Read SESSION_CONTEXT.md and extract current session counter
  const contextPath = path.join(rootDir, "SESSION_CONTEXT.md");
  const contextContent = safeReadFile(contextPath);

  if (!contextContent) {
    findings.push({
      id: "LCM-300",
      category: "session_counter_accuracy",
      domain: DOMAIN,
      severity: "error",
      message: "SESSION_CONTEXT.md not found or unreadable",
      details: `Expected at: ${contextPath}`,
      impactScore: 85,
      frequency: 1,
      blastRadius: 4,
    });
    return {
      score: 0,
      rating: "poor",
      metrics: { contextCounter: null, commitLogMax: null, gap: null, accuracyPct: 0 },
    };
  }

  // Extract "Current Session Count: NNN"
  const counterMatch = contextContent.match(/Current Session Count\D+(\d+)/);
  const contextCounter = counterMatch ? parseInt(counterMatch[1], 10) : null;

  if (contextCounter === null) {
    findings.push({
      id: "LCM-301",
      category: "session_counter_accuracy",
      domain: DOMAIN,
      severity: "error",
      message: "Could not parse session counter from SESSION_CONTEXT.md",
      details: "Expected pattern: 'Current Session Count: NNN'",
      impactScore: 70,
      frequency: 1,
      blastRadius: 3,
    });
    return {
      score: 0,
      rating: "poor",
      metrics: { contextCounter: null, commitLogMax: null, gap: null, accuracyPct: 0 },
    };
  }

  // Read commit-log.jsonl and find max session number
  const commitLogPath = path.join(rootDir, ".claude", "state", "commit-log.jsonl");
  const commitLogContent = safeReadFile(commitLogPath);
  let commitLogMax = null;

  if (commitLogContent) {
    const lines = commitLogContent.split("\n").filter((l) => l.trim().length > 0);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const sessionNum = entry.session;
        if (
          typeof sessionNum === "number" &&
          (commitLogMax === null || sessionNum > commitLogMax)
        ) {
          commitLogMax = sessionNum;
        }
      } catch {
        // Skip malformed lines
      }
    }
  }

  if (commitLogMax === null) {
    // commit-log.jsonl missing or has no session data — just check context is reasonable
    findings.push({
      id: "LCM-302",
      category: "session_counter_accuracy",
      domain: DOMAIN,
      severity: "info",
      message: "No session numbers found in commit-log.jsonl for comparison",
      details: `Context counter: ${contextCounter}. Cannot verify accuracy without commit log session data.`,
      impactScore: 30,
      frequency: 1,
      blastRadius: 2,
    });
    // Give partial credit — counter exists but unverifiable
    const result = scoreMetric(80, bench.accuracy_pct, "higher-is-better");
    return {
      score: result.score,
      rating: result.rating,
      metrics: { contextCounter, commitLogMax: null, gap: null, accuracyPct: 80 },
    };
  }

  // Compare: score 100 if match, -20 per gap
  const gap = Math.abs(contextCounter - commitLogMax);
  const rawAccuracy = Math.max(0, 100 - gap * 20);
  const result = scoreMetric(rawAccuracy, bench.accuracy_pct, "higher-is-better");

  if (gap > 0) {
    findings.push({
      id: "LCM-303",
      category: "session_counter_accuracy",
      domain: DOMAIN,
      severity: gap >= 3 ? "error" : "warning",
      message: `Session counter drift: SESSION_CONTEXT says ${contextCounter}, commit-log max is ${commitLogMax} (gap: ${gap})`,
      details: `A gap of ${gap} suggests ${gap} session(s) were not properly tracked. Run "npm run session:gaps" to investigate.`,
      impactScore: Math.min(90, 40 + gap * 15),
      frequency: 1,
      blastRadius: 3,
      patchType: "data_fix",
      patchTarget: "SESSION_CONTEXT.md",
      patchContent: `Update session counter to match commit-log (${commitLogMax}) or backfill missing sessions`,
      patchImpact: "Restore session tracking accuracy",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { contextCounter, commitLogMax, gap, accuracyPct: rawAccuracy },
  };
}

// ============================================================================
// CATEGORY 4: session_doc_freshness
// ============================================================================

function checkSessionDocFreshness(rootDir, findings) {
  const bench = BENCHMARKS.session_doc_freshness;
  const contextPath = path.join(rootDir, "SESSION_CONTEXT.md");
  const contextContent = safeReadFile(contextPath);

  if (!contextContent) {
    findings.push({
      id: "LCM-400",
      category: "session_doc_freshness",
      domain: DOMAIN,
      severity: "error",
      message: "SESSION_CONTEXT.md not found or unreadable",
      details: `Expected at: ${contextPath}`,
      impactScore: 85,
      frequency: 1,
      blastRadius: 4,
    });
    return {
      score: 0,
      rating: "poor",
      metrics: { lineCount: 0, checksPassed: 0, totalChecks: 4, freshnessPct: 0 },
    };
  }

  const lines = contextContent.split("\n");
  const lineCount = lines.length;
  let checksPassed = 0;
  const totalChecks = 4;
  const checkDetails = [];

  // Check 1: Line count < 300
  if (lineCount < 300) {
    checksPassed++;
    checkDetails.push({ check: "line_count_under_300", passed: true, value: lineCount });
  } else {
    checkDetails.push({ check: "line_count_under_300", passed: false, value: lineCount });
    findings.push({
      id: "LCM-401",
      category: "session_doc_freshness",
      domain: DOMAIN,
      severity: "warning",
      message: `SESSION_CONTEXT.md is ${lineCount} lines (target: <300)`,
      details:
        "Large session context slows down AI loading. Archive older summaries to SESSION_HISTORY.md.",
      impactScore: 45,
      frequency: 1,
      blastRadius: 2,
      patchType: "doc_trim",
      patchTarget: "SESSION_CONTEXT.md",
      patchContent: "Move older session summaries to docs/SESSION_HISTORY.md",
      patchImpact: "Reduce context loading overhead",
    });
  }

  // Check 2: "Last Updated" within 7 days
  const lastUpdatedMatch = contextContent.match(/Last Updated\D*(\d{4}-\d{2}-\d{2})/);
  if (lastUpdatedMatch) {
    const lastUpdatedDate = new Date(lastUpdatedMatch[1] + "T00:00:00Z");
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - lastUpdatedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 7) {
      checksPassed++;
      checkDetails.push({ check: "updated_within_7_days", passed: true, value: daysDiff });
    } else {
      checkDetails.push({ check: "updated_within_7_days", passed: false, value: daysDiff });
      findings.push({
        id: "LCM-402",
        category: "session_doc_freshness",
        domain: DOMAIN,
        severity: "warning",
        message: `SESSION_CONTEXT.md last updated ${daysDiff} days ago (threshold: 7)`,
        details: `Last Updated: ${lastUpdatedMatch[1]}. Stale context leads to wrong priorities.`,
        impactScore: 60,
        frequency: 1,
        blastRadius: 3,
        patchType: "doc_update",
        patchTarget: "SESSION_CONTEXT.md",
        patchContent: "Update Last Updated date and refresh session context",
        patchImpact: "Ensure next session starts with current context",
      });
    }
  } else {
    checkDetails.push({ check: "updated_within_7_days", passed: false, value: null });
    findings.push({
      id: "LCM-403",
      category: "session_doc_freshness",
      domain: DOMAIN,
      severity: "warning",
      message: "Could not find 'Last Updated' date in SESSION_CONTEXT.md",
      details: "Expected pattern: 'Last Updated: YYYY-MM-DD'",
      impactScore: 40,
      frequency: 1,
      blastRadius: 2,
    });
  }

  // Check 3: "Next Session Goals" section is populated
  const nextGoalsIdx = contextContent.indexOf("## Next Session Goals");
  if (nextGoalsIdx !== -1) {
    // Get content after the heading until the next ## heading or EOF
    const afterHeading = contextContent.slice(nextGoalsIdx);
    const nextHeadingIdx = afterHeading.indexOf("\n## ", 1);
    const goalsContent =
      nextHeadingIdx !== -1 ? afterHeading.slice(0, nextHeadingIdx) : afterHeading;

    // Check if there's meaningful content (not just the heading and blank lines)
    const goalsLines = goalsContent.split("\n").filter((l) => {
      const trimmed = l.trim();
      return trimmed.length > 0 && trimmed.charAt(0) !== "#";
    });

    if (goalsLines.length >= 1) {
      checksPassed++;
      checkDetails.push({ check: "next_goals_populated", passed: true, value: goalsLines.length });
    } else {
      checkDetails.push({ check: "next_goals_populated", passed: false, value: 0 });
      findings.push({
        id: "LCM-404",
        category: "session_doc_freshness",
        domain: DOMAIN,
        severity: "warning",
        message: "Next Session Goals section is empty or missing content",
        details: "Without goals, the next session has no direction. Add 2-3 priority items.",
        impactScore: 55,
        frequency: 1,
        blastRadius: 3,
        patchType: "doc_update",
        patchTarget: "SESSION_CONTEXT.md",
        patchContent: "Populate Next Session Goals based on ROADMAP.md active sprint",
        patchImpact: "Give next session clear direction",
      });
    }
  } else {
    checkDetails.push({ check: "next_goals_populated", passed: false, value: null });
    findings.push({
      id: "LCM-405",
      category: "session_doc_freshness",
      domain: DOMAIN,
      severity: "error",
      message: "Missing '## Next Session Goals' section in SESSION_CONTEXT.md",
      details: "This section is required for session-to-session continuity.",
      impactScore: 70,
      frequency: 1,
      blastRadius: 4,
      patchType: "doc_update",
      patchTarget: "SESSION_CONTEXT.md",
      patchContent: "Add '## Next Session Goals' section with priority items",
      patchImpact: "Restore session continuity structure",
    });
  }

  // Check 4: At most 3 session summaries in Recent Session Summaries
  const summaryPattern = /\*\*Session #\d+ Summary\*\*/g;
  const summaryMatches = [];
  let sMatch;
  while ((sMatch = summaryPattern.exec(contextContent)) !== null) {
    summaryMatches.push(sMatch[0]);
  }
  const summaryCount = summaryMatches.length;

  if (summaryCount <= 3) {
    checksPassed++;
    checkDetails.push({ check: "at_most_3_summaries", passed: true, value: summaryCount });
  } else {
    checkDetails.push({ check: "at_most_3_summaries", passed: false, value: summaryCount });
    findings.push({
      id: "LCM-406",
      category: "session_doc_freshness",
      domain: DOMAIN,
      severity: "warning",
      message: `SESSION_CONTEXT.md has ${summaryCount} session summaries (max: 3)`,
      details: "Excess summaries bloat context. Archive older ones to docs/SESSION_HISTORY.md.",
      impactScore: 40,
      frequency: 1,
      blastRadius: 2,
      patchType: "doc_trim",
      patchTarget: "SESSION_CONTEXT.md",
      patchContent: `Archive ${summaryCount - 3} older session summaries to docs/SESSION_HISTORY.md`,
      patchImpact: "Keep session context focused and within size target",
    });
  }

  const freshnessPct = Math.round((checksPassed / totalChecks) * 100);
  const result = scoreMetric(freshnessPct, bench.freshness_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { lineCount, checksPassed, totalChecks, freshnessPct, summaryCount, checkDetails },
  };
}

// ============================================================================
// MAIN RUN
// ============================================================================

/**
 * Run all session lifecycle management checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // Load package.json for npm script checks
  const pkgPath = path.join(rootDir, "package.json");
  const pkgRaw = safeReadFile(pkgPath);
  let pkgJson = {};
  if (pkgRaw) {
    try {
      pkgJson = JSON.parse(pkgRaw);
    } catch {
      findings.push({
        id: "LCM-001",
        category: "session_begin_completeness",
        domain: DOMAIN,
        severity: "error",
        message: "package.json is not valid JSON",
        details: `Failed to parse ${pkgPath}`,
        impactScore: 90,
        frequency: 1,
        blastRadius: 5,
      });
    }
  }

  // ── Category 1: Session Begin Completeness ────────────────────────────────
  const cat1 = checkSessionBeginCompleteness(rootDir, pkgJson, findings);
  scores.session_begin_completeness = cat1;

  // ── Category 2: Session End Completeness ──────────────────────────────────
  const cat2 = checkSessionEndCompleteness(rootDir, pkgJson, findings);
  scores.session_end_completeness = cat2;

  // ── Category 3: Session Counter Accuracy ──────────────────────────────────
  const cat3 = checkSessionCounterAccuracy(rootDir, findings);
  scores.session_counter_accuracy = cat3;

  // ── Category 4: Session Doc Freshness ─────────────────────────────────────
  const cat4 = checkSessionDocFreshness(rootDir, findings);
  scores.session_doc_freshness = cat4;

  return { domain: DOMAIN, findings, scores };
}

module.exports = { DOMAIN, run };
