/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Staleness & Drift Checker — Domain 4 (D4)
 *
 * 14. Version History Currency
 * 15. Dead Skill Detection
 * 16. Pattern Reference Sync
 * 17. Inline Code Duplication
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[staleness-drift] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "staleness_drift";

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

function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const skills = discoverSkills(rootDir);

  // ── Category 14: Version History Currency ───────────────────────────────
  scores.version_history_currency = checkVersionHistoryCurrency(skills, findings);

  // ── Category 15: Dead Skill Detection ───────────────────────────────────
  scores.dead_skill_detection = checkDeadSkillDetection(skills, findings);

  // ── Category 16: Pattern Reference Sync ─────────────────────────────────
  scores.pattern_reference_sync = checkPatternReferenceSync(skills, findings);

  // ── Category 17: Inline Code Duplication ────────────────────────────────
  scores.inline_code_duplication = checkInlineCodeDuplication(rootDir, skills, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 14: Version History Currency ─────────────────────────────────────

function checkVersionHistoryCurrency(skills, findings) {
  const bench = BENCHMARKS.version_history_currency;
  let currentCount = 0;
  let totalWithHistory = 0;
  const staleSkills = [];

  const now = new Date();
  const CURRENCY_THRESHOLD_DAYS = 30;

  for (const skill of skills) {
    const { content, name } = skill;

    // Find Version History section
    const vhMatch = content.match(/#+\s*Version\s+History\b([\s\S]*?)(?=\n#+\s[^#]|$)/i);
    if (!vhMatch) continue;

    totalWithHistory++;

    // Extract dates from version history table rows
    // Pattern: | version | YYYY-MM-DD | description |
    const datePattern = /\|\s*[\d.]+\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|/g;
    const dates = [];
    let dateMatch;
    while ((dateMatch = datePattern.exec(vhMatch[1])) !== null) {
      try {
        const d = new Date(dateMatch[1]);
        if (!isNaN(d.getTime())) {
          dates.push(d);
        }
      } catch {
        // ignore invalid dates
      }
    }

    if (dates.length === 0) continue;

    // Get the most recent date
    const latestDate = dates.reduce((a, b) => (a > b ? a : b));
    const daysSinceUpdate = Math.floor(
      (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceUpdate <= CURRENCY_THRESHOLD_DAYS) {
      currentCount++;
    } else {
      staleSkills.push({
        name,
        lastDate: latestDate.toISOString().slice(0, 10),
        daysSince: daysSinceUpdate,
      });
    }
  }

  const currentPct =
    totalWithHistory > 0 ? Math.round((currentCount / totalWithHistory) * 100) : 100;
  const result = scoreMetric(currentPct, bench.current_pct, "higher-is-better");

  for (const stale of staleSkills) {
    findings.push({
      id: `SEA-40${findings.filter((f) => f.category === "version_history_currency").length}`,
      category: "version_history_currency",
      domain: DOMAIN,
      severity: "info",
      message: `Skill '${stale.name}' version history last updated ${stale.daysSince} days ago (${stale.lastDate})`,
      details: `Version history may be outdated. Threshold: ${CURRENCY_THRESHOLD_DAYS} days.`,
      impactScore: 20,
      frequency: 1,
      blastRadius: 1,
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalSkills: skills.length,
      totalWithHistory,
      currentCount,
      staleCount: staleSkills.length,
      currentPct,
    },
  };
}

// ── Category 15: Dead Skill Detection ─────────────────────────────────────────

function checkDeadSkillDetection(skills, findings) {
  const bench = BENCHMARKS.dead_skill_detection;
  let aliveCount = 0;
  const deadSkills = [];

  const now = new Date();
  const DEAD_THRESHOLD_DAYS = 60;

  for (const skill of skills) {
    const { content, name } = skill;

    // Extract all dates from the skill file (version history, last updated, etc.)
    const allDates = [];

    // Version history dates
    const datePattern = /(\d{4}-\d{2}-\d{2})/g;
    let dateMatch;
    while ((dateMatch = datePattern.exec(content)) !== null) {
      try {
        const d = new Date(dateMatch[1]);
        if (!isNaN(d.getTime()) && d.getFullYear() >= 2020 && d.getFullYear() <= 2030) {
          allDates.push(d);
        }
      } catch {
        // ignore
      }
    }

    if (allDates.length === 0) {
      // No dates found - can't determine, assume alive
      aliveCount++;
      continue;
    }

    const latestDate = allDates.reduce((a, b) => (a > b ? a : b));
    const daysSinceUpdate = Math.floor(
      (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceUpdate <= DEAD_THRESHOLD_DAYS) {
      aliveCount++;
    } else {
      deadSkills.push({
        name,
        lastDate: latestDate.toISOString().slice(0, 10),
        daysSince: daysSinceUpdate,
      });
    }
  }

  const alivePct = skills.length > 0 ? Math.round((aliveCount / skills.length) * 100) : 100;
  const result = scoreMetric(alivePct, bench.alive_pct, "higher-is-better");

  for (const dead of deadSkills) {
    findings.push({
      id: `SEA-41${findings.filter((f) => f.category === "dead_skill_detection").length}`,
      category: "dead_skill_detection",
      domain: DOMAIN,
      severity: "info",
      message: `Skill '${dead.name}' appears dead: last updated ${dead.daysSince} days ago (${dead.lastDate})`,
      details: `No dates within ${DEAD_THRESHOLD_DAYS} days found. Consider archiving or updating.`,
      impactScore: 15,
      frequency: 1,
      blastRadius: 1,
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalSkills: skills.length,
      aliveCount,
      deadCount: deadSkills.length,
      alivePct,
    },
  };
}

// ── Category 16: Pattern Reference Sync ─────────────────────────────────────

function checkPatternReferenceSync(skills, findings) {
  const bench = BENCHMARKS.pattern_reference_sync;
  let resolvedTotal = 0;
  let archivedCount = 0;
  const inlineResolved = [];

  for (const skill of skills) {
    const { content, name } = skill;

    // Find "Known Churn Pattern" or similar sections
    const churnMatch = content.match(
      /#+\s*(?:Known\s+)?Churn\s+Pattern[s]?\b([\s\S]*?)(?=\n#+\s[^#]|$)/i
    );
    if (!churnMatch) continue;

    const section = churnMatch[1];

    // Look for patterns marked as IMPLEMENTED, Resolved, FIXED, DONE
    const resolvedPatterns = section.matchAll(
      /(?:IMPLEMENTED|[Rr]esolved|FIXED|DONE)\s*[:-]?\s*(.{5,80})/g
    );

    for (const match of resolvedPatterns) {
      resolvedTotal++;

      // Check if the resolved pattern content is still inline (vs archived/removed)
      // Heuristic: if there's substantial content after the "Resolved" marker, it's still inline
      const afterMarker = section.slice(
        match.index + match[0].length,
        match.index + match[0].length + 200
      );
      const hasInlineContent = afterMarker.trim().length > 50;

      if (hasInlineContent) {
        inlineResolved.push({ name, pattern: match[1].trim().slice(0, 60) });
      } else {
        archivedCount++;
      }
    }
  }

  const archivedPct = resolvedTotal > 0 ? Math.round((archivedCount / resolvedTotal) * 100) : 100;
  const result = scoreMetric(archivedPct, bench.archived_pct, "higher-is-better");

  for (const ir of inlineResolved) {
    findings.push({
      id: `SEA-42${findings.filter((f) => f.category === "pattern_reference_sync").length}`,
      category: "pattern_reference_sync",
      domain: DOMAIN,
      severity: "info",
      message: `Skill '${ir.name}' has resolved pattern still inline: "${ir.pattern}"`,
      details: "Resolved patterns should be archived to reduce skill file bloat.",
      impactScore: 15,
      frequency: 1,
      blastRadius: 1,
      patchType: "archive_content",
      patchTarget: `.claude/skills/${ir.name}/SKILL.md`,
      patchContent: "Archive resolved churn pattern to reduce bloat",
      patchImpact: "Reduce token cost and improve readability",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      resolvedTotal,
      archivedCount,
      inlineCount: inlineResolved.length,
      archivedPct,
    },
  };
}

// ── Category 17: Inline Code Duplication ────────────────────────────────────

function checkInlineCodeDuplication(rootDir, skills, findings) {
  const bench = BENCHMARKS.inline_code_duplication;

  // Load FIX_TEMPLATES content for comparison
  const templatePaths = [
    path.join(rootDir, "docs", "agent_docs", "FIX_TEMPLATES.md"),
    path.join(rootDir, "docs", "agent_docs", "CODE_PATTERNS.md"),
  ];

  const templateBlocks = [];
  for (const tp of templatePaths) {
    const content = safeReadFile(tp);
    if (!content) continue;

    // Extract code blocks from templates
    const codeBlockPattern = /```[\s\S]*?```/g;
    let cbMatch;
    while ((cbMatch = codeBlockPattern.exec(content)) !== null) {
      const block = cbMatch[0]
        .replace(/^```\w*\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      if (block.length >= 30) {
        templateBlocks.push(block);
      }
    }
  }

  let totalCodeBlocks = 0;
  let uniqueBlocks = 0;
  const duplicates = [];

  for (const skill of skills) {
    const { content, name } = skill;

    // Extract code blocks from skill
    const codeBlockPattern = /```[\s\S]*?```/g;
    let cbMatch;
    while ((cbMatch = codeBlockPattern.exec(content)) !== null) {
      const block = cbMatch[0]
        .replace(/^```\w*\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      if (block.length < 30) continue;

      totalCodeBlocks++;

      // Check similarity against template blocks
      let isDuplicate = false;
      for (const tmplBlock of templateBlocks) {
        const similarity = computeSimpleSimilarity(block, tmplBlock);
        if (similarity > 0.7) {
          isDuplicate = true;
          duplicates.push({
            skillName: name,
            blockPreview: block.slice(0, 60),
            similarity: Math.round(similarity * 100),
          });
          break;
        }
      }

      if (!isDuplicate) {
        uniqueBlocks++;
      }
    }
  }

  const uniquePct = totalCodeBlocks > 0 ? Math.round((uniqueBlocks / totalCodeBlocks) * 100) : 100;
  const result = scoreMetric(uniquePct, bench.unique_pct, "higher-is-better");

  if (duplicates.length > 0) {
    // Group by skill to reduce finding count
    const bySkill = {};
    for (const dup of duplicates) {
      if (!bySkill[dup.skillName]) bySkill[dup.skillName] = [];
      bySkill[dup.skillName].push(dup);
    }

    for (const [skillName, dups] of Object.entries(bySkill)) {
      findings.push({
        id: `SEA-43${findings.filter((f) => f.category === "inline_code_duplication").length}`,
        category: "inline_code_duplication",
        domain: DOMAIN,
        severity: "info",
        message: `Skill '${skillName}' has ${dups.length} code block(s) duplicated from templates`,
        details: `Found ${dups.length} code blocks with >70% similarity to FIX_TEMPLATES or CODE_PATTERNS. Consider referencing templates instead of inlining.`,
        impactScore: 15,
        frequency: dups.length,
        blastRadius: 1,
      });
    }
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalCodeBlocks,
      uniqueBlocks,
      duplicateCount: duplicates.length,
      uniquePct,
    },
  };
}

/**
 * Simple similarity measure between two strings (Jaccard on word trigrams).
 * @param {string} a
 * @param {string} b
 * @returns {number} 0-1 similarity score
 */
function computeSimpleSimilarity(a, b) {
  const trigrams = (str) => {
    const words = str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/);
    const set = new Set();
    for (let i = 0; i <= words.length - 3; i++) {
      set.add(words.slice(i, i + 3).join(" "));
    }
    return set;
  };

  const setA = trigrams(a);
  const setB = trigrams(b);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

module.exports = { run, DOMAIN };
