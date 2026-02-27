/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Coverage & Consistency Checker — Domain 3 (D3)
 *
 * 10. Scope Boundary Clarity
 * 11. Trigger Accuracy
 * 12. Output Format Consistency
 * 13. Skill Registry Sync
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[coverage-consistency] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "coverage_consistency";

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

  // ── Category 10: Scope Boundary Clarity ─────────────────────────────────
  scores.scope_boundary_clarity = checkScopeBoundaryClarity(skills, findings);

  // ── Category 11: Trigger Accuracy ───────────────────────────────────────
  scores.trigger_accuracy = checkTriggerAccuracy(rootDir, skills, findings);

  // ── Category 12: Output Format Consistency ──────────────────────────────
  scores.output_format_consistency = checkOutputFormatConsistency(skills, findings);

  // ── Category 13: Skill Registry Sync ────────────────────────────────────
  scores.skill_registry_sync = checkSkillRegistrySync(rootDir, skills, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 10: Scope Boundary Clarity ─────────────────────────────────────

function checkScopeBoundaryClarity(skills, findings) {
  const bench = BENCHMARKS.scope_boundary_clarity;

  // Extract "When to Use" keywords for overlap detection
  const skillTriggers = {};
  for (const skill of skills) {
    const { content, name } = skill;

    // Extract the "When to Use" section content
    const whenToUseMatch = content.match(
      /#+\s*When\s+to\s+[Uu]se\b([\s\S]*?)(?=\r?\n#+\s|\r?\n---|$)/
    );
    if (whenToUseMatch) {
      // Extract keywords (lowercase, non-trivial words)
      const sectionText = whenToUseMatch[1].toLowerCase();
      const words = sectionText
        .replace(/[^a-z\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 4);
      skillTriggers[name] = new Set(words);
    }
  }

  // Detect overlapping skills (skills with >50% keyword overlap)
  let overlappingPairs = 0;
  let totalPairs = 0;
  const overlaps = [];
  const skillNamesList = Object.keys(skillTriggers);

  for (let i = 0; i < skillNamesList.length; i++) {
    for (let j = i + 1; j < skillNamesList.length; j++) {
      const a = skillNamesList[i];
      const b = skillNamesList[j];
      const setA = skillTriggers[a];
      const setB = skillTriggers[b];

      if (!setA || !setB || setA.size < 3 || setB.size < 3) continue;
      totalPairs++;

      const intersection = new Set([...setA].filter((x) => setB.has(x)));
      const minSize = Math.min(setA.size, setB.size);
      const overlapPct = minSize > 0 ? (intersection.size / minSize) * 100 : 0;

      if (overlapPct > 50) {
        overlappingPairs++;
        overlaps.push({
          skillA: a,
          skillB: b,
          overlapPct: Math.round(overlapPct),
          sharedKeywords: [...intersection].slice(0, 5),
        });
      }
    }
  }

  // Score: percentage of non-overlapping pairs
  const nonOverlappingPct =
    totalPairs > 0 ? Math.round(((totalPairs - overlappingPairs) / totalPairs) * 100) : 100;
  const clarityPct = Math.max(0, Math.min(100, nonOverlappingPct));
  const result = scoreMetric(clarityPct, bench.clarity_pct, "higher-is-better");

  for (const overlap of overlaps) {
    findings.push({
      id: `SEA-30${findings.filter((f) => f.category === "scope_boundary_clarity").length}`,
      category: "scope_boundary_clarity",
      domain: DOMAIN,
      severity: "info",
      message: `Skills '${overlap.skillA}' and '${overlap.skillB}' have ${overlap.overlapPct}% keyword overlap in "When to Use"`,
      details: `Shared keywords: ${overlap.sharedKeywords.join(", ")}. Consider adding differentiation documentation.`,
      impactScore: 25,
      frequency: 1,
      blastRadius: 2,
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      skillsWithTriggers: Object.keys(skillTriggers).length,
      totalPairs,
      overlappingPairs,
      clarityPct,
    },
  };
}

// ── Category 11: Trigger Accuracy ─────────────────────────────────────────────

function checkTriggerAccuracy(rootDir, skills, findings) {
  const bench = BENCHMARKS.trigger_accuracy;

  const indexPath = path.join(rootDir, ".claude", "skills", "SKILL_INDEX.md");
  const indexContent = safeReadFile(indexPath);

  if (!indexContent) {
    findings.push({
      id: "SEA-310",
      category: "trigger_accuracy",
      domain: DOMAIN,
      severity: "warning",
      message: "SKILL_INDEX.md not found — cannot verify trigger accuracy",
      details: "Expected at .claude/skills/SKILL_INDEX.md",
      impactScore: 50,
      frequency: 1,
      blastRadius: 3,
    });
    return { score: 50, rating: "poor", metrics: { totalEntries: 0, matchingEntries: 0 } };
  }

  // Parse index entries: | skill-name | description | ...
  const indexEntries = {};
  const tableRows = indexContent.matchAll(/^\|\s*[`/]*([a-z][a-z0-9-]+)\s*[`]*\s*\|([^|]+)\|/gm);
  for (const match of tableRows) {
    const name = match[1].trim();
    const desc = match[2].trim();
    if (name && desc && name !== "---" && !name.startsWith("Skill")) {
      indexEntries[name] = desc.toLowerCase();
    }
  }

  // Compare with actual skill "When to Use" sections
  let matchingCount = 0;
  let totalChecked = 0;
  const mismatches = [];

  for (const skill of skills) {
    const { content, name } = skill;
    const indexDesc = indexEntries[name];
    if (!indexDesc) continue;

    totalChecked++;

    // Extract "When to Use" section
    const whenMatch = content.match(/#+\s*When\s+to\s+[Uu]se\b([\s\S]*?)(?=\r?\n#+\s|\r?\n---|$)/);
    if (!whenMatch) {
      mismatches.push({ name, reason: "no 'When to Use' section in skill" });
      continue;
    }

    const whenText = whenMatch[1].toLowerCase();

    // Simple heuristic: check if key words from index desc appear in "When to Use"
    const descWords = indexDesc
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4);
    const matchedWords = descWords.filter((w) => whenText.includes(w));
    const matchRatio = descWords.length > 0 ? matchedWords.length / descWords.length : 1;

    if (matchRatio >= 0.3) {
      matchingCount++;
    } else {
      mismatches.push({
        name,
        reason: `index description doesn't align with 'When to Use' (${Math.round(matchRatio * 100)}% keyword overlap)`,
      });
    }
  }

  const matchPct = totalChecked > 0 ? Math.round((matchingCount / totalChecked) * 100) : 100;
  const result = scoreMetric(matchPct, bench.match_pct, "higher-is-better");

  for (const mm of mismatches) {
    findings.push({
      id: `SEA-31${findings.filter((f) => f.category === "trigger_accuracy").length + 1}`,
      category: "trigger_accuracy",
      domain: DOMAIN,
      severity: "info",
      message: `Skill '${mm.name}': ${mm.reason}`,
      details: `SKILL_INDEX.md description may not accurately reflect the skill's actual scope.`,
      impactScore: 25,
      frequency: 1,
      blastRadius: 1,
      patchType: "update_index",
      patchTarget: ".claude/skills/SKILL_INDEX.md",
      patchContent: `Update index description for '${mm.name}' to match actual scope`,
      patchImpact: "Improve skill discoverability",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      indexEntries: Object.keys(indexEntries).length,
      totalChecked,
      matchingCount,
      mismatchCount: mismatches.length,
      matchPct,
    },
  };
}

// ── Category 12: Output Format Consistency ────────────────────────────────────

function checkOutputFormatConsistency(skills, findings) {
  const bench = BENCHMARKS.output_format_consistency;

  // Group skills by type based on name patterns
  const groups = {
    audit: [],
    review: [],
    builder: [],
    session: [],
    other: [],
  };

  for (const skill of skills) {
    const { name } = skill;
    if (name.includes("audit")) groups.audit.push(skill);
    else if (name.includes("review") || name.includes("reviewer")) groups.review.push(skill);
    else if (name.includes("builder") || name.includes("creator")) groups.builder.push(skill);
    else if (name.includes("session")) groups.session.push(skill);
    else groups.other.push(skill);
  }

  let totalGroups = 0;
  let consistentGroups = 0;
  const inconsistencies = [];

  for (const [groupName, groupSkills] of Object.entries(groups)) {
    if (groupSkills.length < 2) continue;
    totalGroups++;

    // Check if skills in the group use similar output patterns
    const outputPatterns = [];
    for (const skill of groupSkills) {
      const { content, name } = skill;
      const patterns = new Set();

      // Check for JSON output mentions
      if (/json\s+output/i.test(content) || /stdout/i.test(content)) patterns.add("json");
      // Check for markdown output
      if (/markdown/i.test(content) || /##\s+output/i.test(content)) patterns.add("markdown");
      // Check for table output
      if (/\|.*\|.*\|/m.test(content)) patterns.add("table");
      // Check for JSONL output
      if (/\.jsonl/i.test(content)) patterns.add("jsonl");

      outputPatterns.push({ name, patterns });
    }

    // Check if all skills in the group have consistent patterns
    if (outputPatterns.length >= 2) {
      const firstPatterns = outputPatterns[0].patterns;
      let allConsistent = true;
      for (let i = 1; i < outputPatterns.length; i++) {
        const overlap = [...firstPatterns].some((p) => outputPatterns[i].patterns.has(p));
        if (!overlap && firstPatterns.size > 0 && outputPatterns[i].patterns.size > 0) {
          allConsistent = false;
        }
      }

      if (allConsistent) {
        consistentGroups++;
      } else {
        inconsistencies.push({
          group: groupName,
          skills: outputPatterns.map((op) => ({
            name: op.name,
            patterns: [...op.patterns],
          })),
        });
      }
    }
  }

  const consistencyPct = totalGroups > 0 ? Math.round((consistentGroups / totalGroups) * 100) : 100;
  const result = scoreMetric(consistencyPct, bench.consistency_pct, "higher-is-better");

  for (const inc of inconsistencies) {
    findings.push({
      id: `SEA-32${findings.filter((f) => f.category === "output_format_consistency").length}`,
      category: "output_format_consistency",
      domain: DOMAIN,
      severity: "info",
      message: `'${inc.group}' skill group has inconsistent output formats`,
      details: `Skills in the '${inc.group}' group use different output patterns: ${inc.skills.map((s) => `${s.name}=[${s.patterns.join(",")}]`).join(", ")}`,
      impactScore: 20,
      frequency: 1,
      blastRadius: 1,
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalGroups,
      consistentGroups,
      inconsistencyCount: inconsistencies.length,
      consistencyPct,
    },
  };
}

// ── Category 13: Skill Registry Sync ──────────────────────────────────────────

function checkSkillRegistrySync(rootDir, skills, findings) {
  const bench = BENCHMARKS.skill_registry_sync;

  const indexPath = path.join(rootDir, ".claude", "skills", "SKILL_INDEX.md");
  const indexContent = safeReadFile(indexPath);

  if (!indexContent) {
    findings.push({
      id: "SEA-330",
      category: "skill_registry_sync",
      domain: DOMAIN,
      severity: "error",
      message: "SKILL_INDEX.md not found — cannot verify registry sync",
      details: "Expected at .claude/skills/SKILL_INDEX.md",
      impactScore: 70,
      frequency: 1,
      blastRadius: 4,
    });
    return { score: 0, rating: "poor", metrics: {} };
  }

  // Parse index skill names
  const indexSkills = new Set();
  const tableRows = indexContent.matchAll(/^\|\s*[`/]*([a-z][a-z0-9-]+)\s*[`]*\s*\|/gm);
  for (const match of tableRows) {
    const name = match[1].trim();
    if (name && name !== "---" && !name.startsWith("Skill") && !name.startsWith("Name")) {
      indexSkills.add(name);
    }
  }

  // Skills on disk
  const diskSkills = new Set(skills.map((s) => s.name));

  // Bidirectional check
  const inIndexNotOnDisk = [];
  const onDiskNotInIndex = [];

  for (const name of indexSkills) {
    if (!diskSkills.has(name)) {
      inIndexNotOnDisk.push(name);
    }
  }

  for (const name of diskSkills) {
    if (!indexSkills.has(name)) {
      onDiskNotInIndex.push(name);
    }
  }

  const allUnique = new Set([...indexSkills, ...diskSkills]);
  const syncCount = allUnique.size - inIndexNotOnDisk.length - onDiskNotInIndex.length;
  const syncPct = allUnique.size > 0 ? Math.round((syncCount / allUnique.size) * 100) : 100;

  const result = scoreMetric(syncPct, bench.sync_pct, "higher-is-better");

  if (inIndexNotOnDisk.length > 0) {
    findings.push({
      id: "SEA-331",
      category: "skill_registry_sync",
      domain: DOMAIN,
      severity: "warning",
      message: `${inIndexNotOnDisk.length} skill(s) in SKILL_INDEX.md but not found on disk: ${inIndexNotOnDisk.slice(0, 5).join(", ")}`,
      details: "These index entries point to skills that don't exist as directories.",
      impactScore: 55,
      frequency: inIndexNotOnDisk.length,
      blastRadius: 3,
      patchType: "update_index",
      patchTarget: ".claude/skills/SKILL_INDEX.md",
      patchContent: `Remove stale entries: ${inIndexNotOnDisk.join(", ")}`,
      patchImpact: "Keep skill index accurate",
    });
  }

  if (onDiskNotInIndex.length > 0) {
    findings.push({
      id: "SEA-332",
      category: "skill_registry_sync",
      domain: DOMAIN,
      severity: "warning",
      message: `${onDiskNotInIndex.length} skill(s) on disk but not in SKILL_INDEX.md: ${onDiskNotInIndex.slice(0, 5).join(", ")}`,
      details: "These skills exist but are not listed in the skill registry.",
      impactScore: 50,
      frequency: onDiskNotInIndex.length,
      blastRadius: 2,
      patchType: "update_index",
      patchTarget: ".claude/skills/SKILL_INDEX.md",
      patchContent: `Add missing entries: ${onDiskNotInIndex.join(", ")}`,
      patchImpact: "Ensure all skills are discoverable via the index",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      indexCount: indexSkills.size,
      diskCount: diskSkills.size,
      inIndexNotOnDisk: inIndexNotOnDisk.length,
      onDiskNotInIndex: onDiskNotInIndex.length,
      syncPct,
    },
  };
}

module.exports = { run, DOMAIN };
