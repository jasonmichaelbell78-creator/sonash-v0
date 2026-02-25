/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Cross-Reference Integrity Checker — Domain 2 (D2)
 *
 * 5. Skill-to-Skill References
 * 6. Skill-to-Script References
 * 7. Skill-to-Template References
 * 8. Evidence Citation Validity
 * 9. Dependency Chain Health
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[cross-reference-integrity] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "cross_reference_integrity";

const MAX_SKILL_FILE_SIZE = 2 * 1024 * 1024;

function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_SKILL_FILE_SIZE) return "";
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
  const skillNames = new Set(skills.map((s) => s.name));

  // ── Category 5: Skill-to-Skill References ───────────────────────────────
  scores.skill_to_skill_refs = checkSkillToSkillRefs(skills, skillNames, findings);

  // ── Category 6: Skill-to-Script References ──────────────────────────────
  scores.skill_to_script_refs = checkSkillToScriptRefs(rootDir, skills, findings);

  // ── Category 7: Skill-to-Template References ────────────────────────────
  scores.skill_to_template_refs = checkSkillToTemplateRefs(rootDir, skills, findings);

  // ── Category 8: Evidence Citation Validity ──────────────────────────────
  scores.evidence_citation_validity = checkEvidenceCitations(skills, findings);

  // ── Category 9: Dependency Chain Health ─────────────────────────────────
  scores.dependency_chain_health = checkDependencyChainHealth(skills, skillNames, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 5: Skill-to-Skill References ─────────────────────────────────────

function checkSkillToSkillRefs(skills, skillNames, findings) {
  const bench = BENCHMARKS.skill_to_skill_refs;
  let totalRefs = 0;
  let validRefs = 0;
  const brokenRefs = [];

  for (const skill of skills) {
    const { content, name } = skill;

    // Match slash-command invocations: `/skill-name` at start of line or after whitespace
    // This avoids matching path segments like docs/technical-debt/foo
    const slashRefs = content.matchAll(
      /(?:^|[\s`(])\/([a-z][a-z0-9-]+[a-z0-9])(?=[\s`),.:;!?\]]|$)/gm
    );
    for (const match of slashRefs) {
      const ref = match[1];
      if (ref.length < 3) continue;

      if (skillNames.has(ref)) {
        totalRefs++;
        validRefs++;
      } else {
        // Only count as broken if it looks like an intentional skill invocation
        // (contains a hyphen, common in skill names, and is not a common CLI flag prefix)
        if (ref.includes("-") && !ref.startsWith("no-")) {
          totalRefs++;
          brokenRefs.push({ from: name, ref, pattern: `/${ref}` });
        }
      }
    }

    // Match backtick references that correspond to known skill directory names
    const backtickRefs = content.matchAll(/`([a-z][a-z0-9-]+[a-z0-9])`/g);
    for (const match of backtickRefs) {
      const ref = match[1];
      if (skillNames.has(ref)) {
        totalRefs++;
        validRefs++;
      }
    }
  }

  const validPct = totalRefs > 0 ? Math.round((validRefs / totalRefs) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  for (const broken of brokenRefs) {
    findings.push({
      id: `SEA-20${findings.filter((f) => f.category === "skill_to_skill_refs").length}`,
      category: "skill_to_skill_refs",
      domain: DOMAIN,
      severity: "warning",
      message: `Skill '${broken.from}' references non-existent skill '${broken.pattern}'`,
      details: `Pattern '${broken.pattern}' in .claude/skills/${broken.from}/SKILL.md does not match any known skill directory.`,
      impactScore: 50,
      frequency: 1,
      blastRadius: 2,
      patchType: "fix_reference",
      patchTarget: `.claude/skills/${broken.from}/SKILL.md`,
      patchContent: `Fix or remove reference to '${broken.pattern}'`,
      patchImpact: "Prevent users from following dead-end references",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalRefs, validRefs, brokenRefs: brokenRefs.length, validPct },
  };
}

// ── Category 6: Skill-to-Script References ────────────────────────────────────

function checkSkillToScriptRefs(rootDir, skills, findings) {
  const bench = BENCHMARKS.skill_to_script_refs;
  let totalRefs = 0;
  let validRefs = 0;
  const brokenRefs = [];

  for (const skill of skills) {
    const { content, name } = skill;

    // Match node script paths: node scripts/..., node .claude/...
    const scriptPaths = content.matchAll(
      /node\s+((?:scripts|\.claude|\.\/scripts|\.\/\.claude)[^\s;`"']+\.js)/g
    );
    for (const match of scriptPaths) {
      const scriptPath = match[1].replace(/^\.\//, "");
      totalRefs++;

      const fullPath = path.join(rootDir, scriptPath);
      try {
        if (fs.existsSync(fullPath)) {
          validRefs++;
        } else {
          brokenRefs.push({ from: name, scriptPath });
        }
      } catch {
        brokenRefs.push({ from: name, scriptPath });
      }
    }

    // Match npm run commands: npm run X
    const npmRefs = content.matchAll(/npm\s+run\s+([a-z][a-z0-9:_-]*)/g);
    for (const match of npmRefs) {
      const script = match[1];
      totalRefs++;

      // Check package.json for the script
      try {
        const pkgPath = path.join(rootDir, "package.json");
        const pkgContent = safeReadFile(pkgPath);
        if (pkgContent) {
          const pkg = JSON.parse(pkgContent);
          if (pkg.scripts && pkg.scripts[script]) {
            validRefs++;
          } else {
            brokenRefs.push({ from: name, scriptPath: `npm run ${script}` });
          }
        }
      } catch {
        // Can't verify, assume valid
        validRefs++;
      }
    }
  }

  const validPct = totalRefs > 0 ? Math.round((validRefs / totalRefs) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  for (const broken of brokenRefs) {
    findings.push({
      id: `SEA-21${findings.filter((f) => f.category === "skill_to_script_refs").length}`,
      category: "skill_to_script_refs",
      domain: DOMAIN,
      severity: "warning",
      message: `Skill '${broken.from}' references missing script: ${broken.scriptPath}`,
      details: `Script reference in .claude/skills/${broken.from}/SKILL.md points to a non-existent file or npm script.`,
      impactScore: 55,
      frequency: 1,
      blastRadius: 3,
      patchType: "fix_reference",
      patchTarget: `.claude/skills/${broken.from}/SKILL.md`,
      patchContent: `Fix or remove reference to '${broken.scriptPath}'`,
      patchImpact: "Prevent failed script execution when following skill instructions",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalRefs, validRefs, brokenRefs: brokenRefs.length, validPct },
  };
}

// ── Category 7: Skill-to-Template References ──────────────────────────────────

function checkSkillToTemplateRefs(rootDir, skills, findings) {
  const bench = BENCHMARKS.skill_to_template_refs;
  let totalRefs = 0;
  let validRefs = 0;
  const brokenRefs = [];

  // Load template files
  const templateFiles = [
    path.join(rootDir, "docs", "agent_docs", "FIX_TEMPLATES.md"),
    path.join(rootDir, "docs", "agent_docs", "CODE_PATTERNS.md"),
  ];

  const templateContents = {};
  for (const tf of templateFiles) {
    const content = safeReadFile(tf);
    if (content) {
      templateContents[path.basename(tf)] = content;
    }
  }

  for (const skill of skills) {
    const { content, name } = skill;

    // Match template references: FIX_TEMPLATE #N, FIX_TEMPLATES #N, Template N
    const templateRefs = content.matchAll(/(?:FIX_TEMPLATES?\s*#?\s*(\d+)|Template\s+(\d+))/gi);
    for (const match of templateRefs) {
      const num = match[1] || match[2];
      totalRefs++;

      // Check if any template file contains this template number
      let found = false;
      for (const [, tc] of Object.entries(templateContents)) {
        // Look for template header/anchor with this number
        const templatePattern = new RegExp(`(?:Template|#)\\s*${num}\\b`, "i");
        if (templatePattern.test(tc)) {
          found = true;
          break;
        }
      }

      if (found) {
        validRefs++;
      } else {
        brokenRefs.push({ from: name, ref: match[0].trim(), num });
      }
    }
  }

  const validPct = totalRefs > 0 ? Math.round((validRefs / totalRefs) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  for (const broken of brokenRefs) {
    findings.push({
      id: `SEA-22${findings.filter((f) => f.category === "skill_to_template_refs").length}`,
      category: "skill_to_template_refs",
      domain: DOMAIN,
      severity: "info",
      message: `Skill '${broken.from}' references template '${broken.ref}' which could not be verified`,
      details: `Template reference in .claude/skills/${broken.from}/SKILL.md could not be found in FIX_TEMPLATES.md or CODE_PATTERNS.md.`,
      impactScore: 25,
      frequency: 1,
      blastRadius: 1,
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalRefs, validRefs, brokenRefs: brokenRefs.length, validPct },
  };
}

// ── Category 8: Evidence Citation Validity ────────────────────────────────────

function checkEvidenceCitations(skills, findings) {
  const bench = BENCHMARKS.evidence_citation_validity;
  let totalCitations = 0;
  let verifiableCitations = 0;
  const unverifiable = [];

  for (const skill of skills) {
    const { content, name } = skill;

    // Match PR #NNN and Review #NNN patterns
    const prRefs = content.matchAll(/(?:PR|Pull Request|Review)\s*#(\d+)/gi);
    for (const match of prRefs) {
      totalCitations++;
      const prNum = parseInt(match[1], 10);

      // PRs with reasonable numbers (1-9999) are considered verifiable
      // We cannot actually check git log in a sync checker, so heuristic only
      if (prNum > 0 && prNum < 10000) {
        verifiableCitations++;
      } else {
        unverifiable.push({ from: name, ref: match[0].trim(), num: prNum });
      }
    }

    // Match Session #NNN patterns
    const sessionRefs = content.matchAll(/Session\s*#(\d+)/gi);
    for (const match of sessionRefs) {
      totalCitations++;
      const sessionNum = parseInt(match[1], 10);
      if (sessionNum > 0 && sessionNum < 10000) {
        verifiableCitations++;
      } else {
        unverifiable.push({ from: name, ref: match[0].trim(), num: sessionNum });
      }
    }
  }

  const verifiablePct =
    totalCitations > 0 ? Math.round((verifiableCitations / totalCitations) * 100) : 100;
  const result = scoreMetric(verifiablePct, bench.verifiable_pct, "higher-is-better");

  if (unverifiable.length > 0) {
    findings.push({
      id: "SEA-230",
      category: "evidence_citation_validity",
      domain: DOMAIN,
      severity: "info",
      message: `${unverifiable.length} evidence citation(s) could not be verified`,
      details: `Unverifiable citations: ${unverifiable.map((u) => `${u.from}: ${u.ref}`).join(", ")}`,
      impactScore: 20,
      frequency: unverifiable.length,
      blastRadius: 1,
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalCitations,
      verifiableCitations,
      unverifiableCount: unverifiable.length,
      verifiablePct,
    },
  };
}

// ── Category 9: Dependency Chain Health ────────────────────────────────────────

function checkDependencyChainHealth(skills, skillNames, findings) {
  const bench = BENCHMARKS.dependency_chain_health;

  // Build dependency graph: skill -> skills it actually invokes
  // Exclude informational cross-references to avoid false circular dependency
  // detection. Non-invocation contexts include:
  //   - "Related Skills", "When NOT to Use", "See Also" sections
  //   - File paths in backticks (e.g., `node .claude/skills/hook-eco.../scripts/...`)
  //   - Parenthetical context (e.g., "When invoked as part of /skill-name")
  const depGraph = {};
  const infoSectionPattern =
    /^#+\s*(?:Related\b|When NOT to Use|See Also|Complementary|Individual audits)[^\n]*\n([\s\S]*?)(?=\n#+\s|\n---|$)/gim;

  for (const skill of skills) {
    const { content, name } = skill;
    depGraph[name] = new Set();

    // Strip informational sections
    let strippedContent = content.replace(infoSectionPattern, "");
    // Strip backtick-quoted code/paths (contains file paths like /skill-name/scripts/)
    strippedContent = strippedContent.replace(/`[^`]+`/g, "");
    // Strip "invoked as part of /skill" contextual mentions
    strippedContent = strippedContent.replace(
      /(?:invoked|run|called)\s+(?:as\s+)?part\s+of\s+\/[a-z][a-z0-9-]+/gi,
      ""
    );

    // Find skill invocations: /skill-name
    const invocations = strippedContent.matchAll(/\/([a-z][a-z0-9-]+[a-z0-9])/g);
    for (const match of invocations) {
      const ref = match[1];
      if (skillNames.has(ref) && ref !== name) {
        depGraph[name].add(ref);
      }
    }
  }

  // Detect cycles using DFS
  let penalties = 0;
  const cycles = [];
  const brokenLinks = [];

  function detectCycle(start, visited, path) {
    if (path.has(start)) {
      return [...path, start];
    }
    if (visited.has(start)) return null;
    visited.add(start);
    path.add(start);

    const deps = depGraph[start] || new Set();
    for (const dep of deps) {
      if (!skillNames.has(dep)) {
        brokenLinks.push({ from: start, to: dep });
        continue;
      }
      const cycle = detectCycle(dep, visited, new Set(path));
      if (cycle) return cycle;
    }

    return null;
  }

  const visited = new Set();
  for (const name of Object.keys(depGraph)) {
    if (!visited.has(name)) {
      const cycle = detectCycle(name, visited, new Set());
      if (cycle) {
        cycles.push(cycle);
        penalties += 20;
      }
    }
  }

  penalties += brokenLinks.length * 10;

  const healthScore = Math.max(0, 100 - penalties);
  const result = scoreMetric(healthScore, bench.health_score, "higher-is-better");

  if (cycles.length > 0) {
    for (const cycle of cycles) {
      findings.push({
        id: `SEA-24${findings.filter((f) => f.category === "dependency_chain_health").length}`,
        category: "dependency_chain_health",
        domain: DOMAIN,
        severity: "error",
        message: `Circular dependency detected: ${cycle.join(" -> ")}`,
        details: "Circular skill dependencies can cause infinite invocation loops.",
        impactScore: 75,
        frequency: 1,
        blastRadius: 4,
      });
    }
  }

  if (brokenLinks.length > 0) {
    for (const link of brokenLinks) {
      findings.push({
        id: `SEA-25${findings.filter((f) => f.category === "dependency_chain_health").length}`,
        category: "dependency_chain_health",
        domain: DOMAIN,
        severity: "warning",
        message: `Skill '${link.from}' depends on non-existent skill '${link.to}'`,
        details: `Broken dependency chain: .claude/skills/${link.from} invokes /${link.to} which does not exist.`,
        impactScore: 50,
        frequency: 1,
        blastRadius: 2,
        patchType: "fix_reference",
        patchTarget: `.claude/skills/${link.from}/SKILL.md`,
        patchContent: `Fix or remove reference to '/${link.to}'`,
        patchImpact: "Fix broken dependency chain",
      });
    }
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalSkills: skills.length,
      cycleCount: cycles.length,
      brokenLinkCount: brokenLinks.length,
      healthScore,
    },
  };
}

module.exports = { run, DOMAIN };
