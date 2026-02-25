/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Structural Compliance Checker — Domain 1 (D1)
 *
 * 1. Frontmatter Schema
 * 2. Step Continuity
 * 3. Section Structure
 * 4. Bloat Score
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[structural-compliance] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "structural_compliance";

/** Max file size for reading skill files (2MB) */
const MAX_SKILL_FILE_SIZE = 2 * 1024 * 1024;

/**
 * Safely read a file, returning empty string on error.
 * @param {string} filePath
 * @returns {string}
 */
function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_SKILL_FILE_SIZE) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

/**
 * Discover all SKILL.md files under .claude/skills/X/SKILL.md.
 * @param {string} rootDir
 * @returns {{ name: string, path: string, content: string }[]}
 */
function discoverSkills(rootDir) {
  const skillsDir = path.join(rootDir, ".claude", "skills");
  const skills = [];

  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillMdPath = path.join(skillsDir, entry.name, "SKILL.md");
      const content = safeReadFile(skillMdPath);
      if (content) {
        skills.push({ name: entry.name, path: skillMdPath, content });
      }
    }
  } catch {
    // skills directory not accessible
  }

  return skills;
}

/**
 * Run all structural compliance checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const skills = discoverSkills(rootDir);

  if (skills.length === 0) {
    findings.push({
      id: "SEA-100",
      category: "frontmatter_schema",
      domain: DOMAIN,
      severity: "error",
      message: "No SKILL.md files found under .claude/skills/",
      details: "Cannot perform structural compliance checks without skill files.",
      impactScore: 95,
      frequency: 1,
      blastRadius: 5,
    });

    scores.frontmatter_schema = { score: 0, rating: "poor", metrics: {} };
    scores.step_continuity = { score: 0, rating: "poor", metrics: {} };
    scores.section_structure = { score: 0, rating: "poor", metrics: {} };
    scores.bloat_score = { score: 0, rating: "poor", metrics: {} };

    return { domain: DOMAIN, findings, scores };
  }

  // ── Category 1: Frontmatter Schema ────────────────────────────────────────
  scores.frontmatter_schema = checkFrontmatterSchema(skills, findings);

  // ── Category 2: Step Continuity ───────────────────────────────────────────
  scores.step_continuity = checkStepContinuity(skills, findings);

  // ── Category 3: Section Structure ─────────────────────────────────────────
  scores.section_structure = checkSectionStructure(skills, findings);

  // ── Category 4: Bloat Score ───────────────────────────────────────────────
  scores.bloat_score = checkBloatScore(skills, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 1: Frontmatter Schema ────────────────────────────────────────────

function checkFrontmatterSchema(skills, findings) {
  const bench = BENCHMARKS.frontmatter_schema;
  let validCount = 0;
  const invalidSkills = [];

  for (const skill of skills) {
    const { content, name } = skill;
    const issues = [];

    // Check for --- delimiters at top
    const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      issues.push("missing frontmatter delimiters (---)");
    } else {
      const frontmatter = fmMatch[1];

      // Check for name: field
      if (!/^name\s*:/m.test(frontmatter)) {
        issues.push("missing 'name:' field");
      }

      // Check for description: field
      if (!/^description\s*:/m.test(frontmatter)) {
        issues.push("missing 'description:' field");
      }
    }

    if (issues.length === 0) {
      validCount++;
    } else {
      invalidSkills.push({ name, issues });
    }
  }

  const validPct = skills.length > 0 ? Math.round((validCount / skills.length) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  let frontmatterFindingCount = 0;
  for (const inv of invalidSkills) {
    findings.push({
      id: `SEA-100-${++frontmatterFindingCount}`,
      category: "frontmatter_schema",
      domain: DOMAIN,
      severity: "warning",
      message: `Skill '${inv.name}' has invalid frontmatter: ${inv.issues.join(", ")}`,
      details: `SKILL.md at .claude/skills/${inv.name}/ is missing required frontmatter fields.`,
      impactScore: 45,
      frequency: 1,
      blastRadius: 2,
      patchType: "fix_frontmatter",
      patchTarget: `.claude/skills/${inv.name}/SKILL.md`,
      patchContent: `Add missing frontmatter: ${inv.issues.join(", ")}`,
      patchImpact: "Ensure skill metadata is complete for discovery and indexing",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalSkills: skills.length,
      validCount,
      invalidCount: invalidSkills.length,
      validPct,
    },
  };
}

// ── Category 2: Step Continuity ───────────────────────────────────────────────

function checkStepContinuity(skills, findings) {
  const bench = BENCHMARKS.step_continuity;
  let continuousCount = 0;
  const issues = [];

  for (const skill of skills) {
    const { content, name } = skill;

    // Find all numbered steps: ## Step N, ### Step N, ## N., ### N., **Step N**
    const stepPattern = /^#{2,3}\s+(?:Step\s+|Phase\s+)?(\d+)/gm;
    const steps = [];
    let match;
    while ((match = stepPattern.exec(content)) !== null) {
      steps.push(parseInt(match[1], 10));
    }

    if (steps.length === 0) {
      // No numbered steps found - not an issue per se
      continuousCount++;
      continue;
    }

    // Check for sequential ordering and no duplicates
    let isSequential = true;
    const duplicates = [];
    const gaps = [];

    const seen = new Set();
    for (const step of steps) {
      if (seen.has(step)) {
        duplicates.push(step);
        isSequential = false;
      }
      seen.add(step);
    }

    const sorted = [...new Set(steps)].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] > 1) {
        gaps.push({ after: sorted[i - 1], before: sorted[i] });
        isSequential = false;
      }
    }

    if (isSequential) {
      continuousCount++;
    } else {
      const issueDetails = [];
      if (duplicates.length > 0) {
        issueDetails.push(`duplicate steps: ${duplicates.join(", ")}`);
      }
      if (gaps.length > 0) {
        issueDetails.push(`gaps: ${gaps.map((g) => `${g.after}->${g.before}`).join(", ")}`);
      }
      issues.push({ name, details: issueDetails.join("; ") });
    }
  }

  const continuousPct =
    skills.length > 0 ? Math.round((continuousCount / skills.length) * 100) : 100;
  const result = scoreMetric(continuousPct, bench.continuous_pct, "higher-is-better");

  for (const issue of issues) {
    findings.push({
      id: `SEA-11${findings.filter((f) => f.category === "step_continuity").length}`,
      category: "step_continuity",
      domain: DOMAIN,
      severity: "warning",
      message: `Skill '${issue.name}' has step continuity issues: ${issue.details}`,
      details: `Non-sequential steps found in .claude/skills/${issue.name}/SKILL.md.`,
      impactScore: 35,
      frequency: 1,
      blastRadius: 1,
      patchType: "config_fix",
      patchTarget: `.claude/skills/${issue.name}/SKILL.md`,
      patchContent: "Renumber steps to be sequential",
      patchImpact: "Improve skill readability and navigation",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalSkills: skills.length,
      continuousCount,
      issueCount: issues.length,
      continuousPct,
    },
  };
}

// ── Category 3: Section Structure ─────────────────────────────────────────────

function checkSectionStructure(skills, findings) {
  const bench = BENCHMARKS.section_structure;
  let completeCount = 0;
  const incomplete = [];

  const REQUIRED_SECTIONS = [
    { pattern: /when\s+to\s+use/i, label: "When to Use" },
    { pattern: /when\s+not\s+to\s+use/i, label: "When NOT to Use" },
    { pattern: /version\s+history/i, label: "Version History" },
  ];

  for (const skill of skills) {
    const { content, name } = skill;
    const missing = [];

    for (const section of REQUIRED_SECTIONS) {
      if (!section.pattern.test(content)) {
        missing.push(section.label);
      }
    }

    if (missing.length === 0) {
      completeCount++;
    } else {
      incomplete.push({ name, missing });
    }
  }

  const completePct = skills.length > 0 ? Math.round((completeCount / skills.length) * 100) : 100;
  const result = scoreMetric(completePct, bench.complete_pct, "higher-is-better");

  for (const inc of incomplete) {
    findings.push({
      id: `SEA-12${findings.filter((f) => f.category === "section_structure").length}`,
      category: "section_structure",
      domain: DOMAIN,
      severity: inc.missing.length >= 2 ? "warning" : "info",
      message: `Skill '${inc.name}' missing sections: ${inc.missing.join(", ")}`,
      details: `SKILL.md at .claude/skills/${inc.name}/ should have all 3 required sections.`,
      impactScore: inc.missing.length >= 2 ? 50 : 30,
      frequency: 1,
      blastRadius: 2,
      patchType: "add_section",
      patchTarget: `.claude/skills/${inc.name}/SKILL.md`,
      patchContent: `Add missing sections: ${inc.missing.join(", ")}`,
      patchImpact: "Complete skill documentation for consistent navigation",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalSkills: skills.length,
      completeCount,
      incompleteCount: incomplete.length,
      completePct,
    },
  };
}

// ── Category 4: Bloat Score ─────────────────────────────────────────────────

function checkBloatScore(skills, findings) {
  const bench = BENCHMARKS.bloat_score;
  let belowThresholdCount = 0;
  const bloatedSkills = [];

  const WARNING_LINES = 500;
  const ERROR_LINES = 800;

  for (const skill of skills) {
    const { content, name } = skill;
    const lines = content.split("\n");
    const lineCount = lines.length;

    // Count evidence blocks
    const evidenceBlocks = (content.match(/\*\*Evidence:\*\*/g) || []).length;

    // Count fenced code blocks
    const codeBlocks = (content.match(/^```/gm) || []).length / 2; // pairs

    // Count version history table rows (lines starting with |)
    const versionHistoryMatch = content.match(/version\s+history/i);
    let versionRows = 0;
    if (versionHistoryMatch) {
      const afterVH = content.slice(versionHistoryMatch.index);
      const tableRows = afterVH.match(/^\|[^|]+\|/gm);
      versionRows = tableRows ? Math.max(0, tableRows.length - 2) : 0; // exclude header + separator
    }

    if (lineCount <= WARNING_LINES) {
      belowThresholdCount++;
    } else {
      const severity = lineCount > ERROR_LINES ? "warning" : "info";
      bloatedSkills.push({
        name,
        lineCount,
        evidenceBlocks,
        codeBlocks: Math.round(codeBlocks),
        versionRows,
        severity,
      });
    }
  }

  const belowPct =
    skills.length > 0 ? Math.round((belowThresholdCount / skills.length) * 100) : 100;
  const result = scoreMetric(belowPct, bench.below_threshold_pct, "higher-is-better");

  for (const bloated of bloatedSkills) {
    findings.push({
      id: `SEA-13${findings.filter((f) => f.category === "bloat_score").length}`,
      category: "bloat_score",
      domain: DOMAIN,
      severity: bloated.severity,
      message: `Skill '${bloated.name}' is bloated: ${bloated.lineCount} lines (threshold: ${WARNING_LINES})`,
      details: `Contains ${bloated.evidenceBlocks} evidence blocks, ~${bloated.codeBlocks} code blocks, ${bloated.versionRows} version history rows. Consider extracting evidence to templates or archiving resolved patterns.`,
      impactScore: bloated.severity === "warning" ? 45 : 30,
      frequency: 1,
      blastRadius: 2,
      patchType: "archive_content",
      patchTarget: `.claude/skills/${bloated.name}/SKILL.md`,
      patchContent: "Extract evidence blocks and archive resolved patterns to reduce bloat",
      patchImpact: "Reduce token cost when skill is loaded into context",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalSkills: skills.length,
      belowThresholdCount,
      bloatedCount: bloatedSkills.length,
      belowPct,
    },
  };
}

module.exports = { run, DOMAIN };
