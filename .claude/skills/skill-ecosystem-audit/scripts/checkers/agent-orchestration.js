/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Agent Orchestration Health Checker — Domain 5 (D5)
 *
 * 18. Agent Prompt Consistency
 * 19. Agent-Skill Alignment
 * 20. Parallelization Correctness
 * 21. Team Config Health
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[agent-orchestration] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "agent_orchestration";

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

  // ── Category 18: Agent Prompt Consistency ───────────────────────────────
  scores.agent_prompt_consistency = checkAgentPromptConsistency(skills, findings);

  // ── Category 19: Agent-Skill Alignment ──────────────────────────────────
  scores.agent_skill_alignment = checkAgentSkillAlignment(rootDir, skills, findings);

  // ── Category 20: Parallelization Correctness ────────────────────────────
  scores.parallelization_correctness = checkParallelizationCorrectness(skills, findings);

  // ── Category 21: Team Config Health ─────────────────────────────────────
  scores.team_config_health = checkTeamConfigHealth(rootDir, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 18: Agent Prompt Consistency ──────────────────────────────────────

function checkAgentPromptConsistency(skills, findings) {
  const bench = BENCHMARKS.agent_prompt_consistency;
  let totalPrompts = 0;
  let compliantPrompts = 0;
  const nonCompliant = [];

  for (const skill of skills) {
    const { content, name } = skill;

    // Find agent prompt sections (Task tool invocations, agent templates)
    // Look for patterns indicating agent prompts
    const hasAgentPrompts =
      /(?:Task\s+tool|agent\s+prompt|AGENT_PROMPT|launch.*agent|spawn.*agent)/i.test(content);
    if (!hasAgentPrompts) continue;

    totalPrompts++;

    const issues = [];

    // Check for "COMPLETE:" return protocol
    if (!/COMPLETE\s*:/i.test(content)) {
      issues.push("missing COMPLETE: return protocol");
    }

    // Check for context overflow guards
    const hasOverflowGuard =
      /(?:context\s+overflow|token\s+limit|context.*low|budget\s+check)/i.test(content);
    if (!hasOverflowGuard) {
      issues.push("no context overflow guard mentioned");
    }

    if (issues.length === 0) {
      compliantPrompts++;
    } else {
      nonCompliant.push({ name, issues });
    }
  }

  const compliantPct = totalPrompts > 0 ? Math.round((compliantPrompts / totalPrompts) * 100) : 100;
  const result = scoreMetric(compliantPct, bench.compliant_pct, "higher-is-better");

  for (const nc of nonCompliant) {
    findings.push({
      id: `SEA-50${findings.filter((f) => f.category === "agent_prompt_consistency").length}`,
      category: "agent_prompt_consistency",
      domain: DOMAIN,
      severity: "warning",
      message: `Skill '${nc.name}' agent prompts lack: ${nc.issues.join(", ")}`,
      details: `Agent prompts in .claude/skills/${nc.name}/SKILL.md should include COMPLETE: return protocol and context overflow guards.`,
      impactScore: 55,
      frequency: 1,
      blastRadius: 3,
      patchType: "fix_output_protocol",
      patchTarget: `.claude/skills/${nc.name}/SKILL.md`,
      patchContent: `Add missing agent protocol elements: ${nc.issues.join(", ")}`,
      patchImpact: "Prevent agent context overflow and ensure proper completion signaling",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalPrompts,
      compliantPrompts,
      nonCompliantCount: nonCompliant.length,
      compliantPct,
    },
  };
}

// ── Category 19: Agent-Skill Alignment ────────────────────────────────────────

function checkAgentSkillAlignment(rootDir, skills, findings) {
  const bench = BENCHMARKS.agent_skill_alignment;

  // Read CLAUDE.md agent trigger table
  const claudeMdPath = path.join(rootDir, "CLAUDE.md");
  const claudeMd = safeReadFile(claudeMdPath);

  if (!claudeMd) {
    findings.push({
      id: "SEA-510",
      category: "agent_skill_alignment",
      domain: DOMAIN,
      severity: "warning",
      message: "CLAUDE.md not found — cannot verify agent-skill alignment",
      details: "Expected at project root.",
      impactScore: 40,
      frequency: 1,
      blastRadius: 2,
    });
    return { score: 50, rating: "poor", metrics: {} };
  }

  // Extract trigger table entries
  // Pattern: | trigger | action | tool |
  const triggerEntries = [];
  const triggerTableRows = claudeMd.matchAll(
    /^\|\s*([^|]+?)\s*\|\s*`?([^`|]+)`?\s*\|\s*([\w-]+)\s*\|/gm
  );
  for (const match of triggerTableRows) {
    const trigger = match[1].trim();
    const action = match[2].trim();
    const tool = match[3].trim();
    if (trigger && action && !trigger.startsWith("---") && !trigger.startsWith("Trigger")) {
      triggerEntries.push({ trigger, action, tool });
    }
  }

  const skillNames = new Set(skills.map((s) => s.name));
  let alignedCount = 0;
  let totalEntries = 0;
  const misaligned = [];

  for (const entry of triggerEntries) {
    // Check if the action references a skill that exists
    const actionName = entry.action.replace(/^\//, "").replace(/\s+/g, "-").toLowerCase();

    // Try to match to a skill directory
    totalEntries++;
    if (
      skillNames.has(actionName) ||
      skillNames.has(entry.action.replace(/\s+/g, "-").toLowerCase())
    ) {
      alignedCount++;
    } else {
      // Check partial matches (skill names often use hyphens)
      const partialMatch = [...skillNames].find(
        (sn) => actionName.includes(sn) || sn.includes(actionName)
      );
      if (partialMatch) {
        alignedCount++;
      } else {
        misaligned.push(entry);
      }
    }
  }

  const alignedPct = totalEntries > 0 ? Math.round((alignedCount / totalEntries) * 100) : 100;
  const result = scoreMetric(alignedPct, bench.aligned_pct, "higher-is-better");

  if (misaligned.length > 0) {
    findings.push({
      id: "SEA-511",
      category: "agent_skill_alignment",
      domain: DOMAIN,
      severity: "info",
      message: `${misaligned.length} CLAUDE.md trigger(s) don't map to known skills`,
      details: `Unmatched triggers: ${misaligned
        .map((m) => `"${m.action}"`)
        .slice(0, 5)
        .join(", ")}. These may be commands rather than skills.`,
      impactScore: 20,
      frequency: misaligned.length,
      blastRadius: 1,
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      triggerEntries: totalEntries,
      alignedCount,
      misalignedCount: misaligned.length,
      alignedPct,
    },
  };
}

// ── Category 20: Parallelization Correctness ──────────────────────────────────

function checkParallelizationCorrectness(skills, findings) {
  const bench = BENCHMARKS.parallelization_correctness;
  let totalParallelSections = 0;
  let documentedSections = 0;
  const undocumented = [];

  for (const skill of skills) {
    const { content, name } = skill;

    // Find patterns suggesting parallel execution
    const parallelPatterns = [
      /(?:parallel|concurrent|simultaneously)/i,
      /(?:multiple\s+Task\s+tool|multiple\s+agents?|spawn\s+\d+)/i,
      /(?:wave\s+\d|batch\s+\d)/i,
    ];

    let hasParallel = false;
    for (const pattern of parallelPatterns) {
      if (pattern.test(content)) {
        hasParallel = true;
        break;
      }
    }

    if (!hasParallel) continue;

    totalParallelSections++;

    // Check if parallelization is properly documented
    const hasDocumentation =
      /(?:independent|no\s+depend|can\s+run\s+in\s+parallel|paralleliz)/i.test(content) &&
      /(?:sequential|depend|order|before|after|must\s+complete)/i.test(content);

    if (hasDocumentation) {
      documentedSections++;
    } else {
      undocumented.push(name);
    }
  }

  const documentedPct =
    totalParallelSections > 0
      ? Math.round((documentedSections / totalParallelSections) * 100)
      : 100;
  const result = scoreMetric(documentedPct, bench.documented_pct, "higher-is-better");

  for (const skillName of undocumented) {
    findings.push({
      id: `SEA-52${findings.filter((f) => f.category === "parallelization_correctness").length}`,
      category: "parallelization_correctness",
      domain: DOMAIN,
      severity: "info",
      message: `Skill '${skillName}' mentions parallel execution but lacks dependency documentation`,
      details: `Skills that use parallel agent execution should document which tasks are independent and which have ordering constraints.`,
      impactScore: 25,
      frequency: 1,
      blastRadius: 2,
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalParallelSections,
      documentedSections,
      undocumentedCount: undocumented.length,
      documentedPct,
    },
  };
}

// ── Category 21: Team Config Health ───────────────────────────────────────────

function checkTeamConfigHealth(rootDir, findings) {
  const bench = BENCHMARKS.team_config_health;

  const settingsPath = path.join(rootDir, ".claude", "settings.json");
  const settingsContent = safeReadFile(settingsPath);

  if (!settingsContent) {
    findings.push({
      id: "SEA-530",
      category: "team_config_health",
      domain: DOMAIN,
      severity: "warning",
      message: "settings.json not found — cannot verify team config",
      details: "Expected at .claude/settings.json",
      impactScore: 40,
      frequency: 1,
      blastRadius: 2,
    });
    return { score: 50, rating: "poor", metrics: {} };
  }

  let settings;
  try {
    settings = JSON.parse(settingsContent);
  } catch {
    findings.push({
      id: "SEA-531",
      category: "team_config_health",
      domain: DOMAIN,
      severity: "error",
      message: "settings.json is not valid JSON",
      details: `Failed to parse .claude/settings.json`,
      impactScore: 80,
      frequency: 1,
      blastRadius: 5,
    });
    return { score: 0, rating: "poor", metrics: {} };
  }

  let totalChecks = 0;
  let validChecks = 0;
  const issues = [];

  // Check hooks configuration exists
  totalChecks++;
  if (settings.hooks && typeof settings.hooks === "object") {
    validChecks++;
  } else {
    issues.push("no hooks configuration found");
  }

  // Check for permissions array
  totalChecks++;
  if (Array.isArray(settings.permissions)) {
    validChecks++;
  } else {
    issues.push("no permissions array found");
  }

  // Check hook entries have proper structure
  if (settings.hooks) {
    for (const [eventType, groups] of Object.entries(settings.hooks)) {
      if (!Array.isArray(groups)) continue;

      for (const group of groups) {
        totalChecks++;
        const hooks = group.hooks;
        if (Array.isArray(hooks) && hooks.length > 0) {
          // Verify each hook has a command
          let allValid = true;
          for (const hook of hooks) {
            if (!hook.command || typeof hook.command !== "string") {
              allValid = false;
              issues.push(`${eventType}: hook missing command field`);
              break;
            }
          }
          if (allValid) validChecks++;
        } else {
          issues.push(`${eventType}: group has no hooks array`);
        }
      }
    }
  }

  const validPct = totalChecks > 0 ? Math.round((validChecks / totalChecks) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  if (issues.length > 0) {
    findings.push({
      id: "SEA-532",
      category: "team_config_health",
      domain: DOMAIN,
      severity: issues.some((i) => i.includes("missing command")) ? "error" : "warning",
      message: `${issues.length} team config issue(s) found in settings.json`,
      details: `Issues: ${issues.slice(0, 5).join("; ")}`,
      impactScore: issues.some((i) => i.includes("missing command")) ? 65 : 40,
      frequency: issues.length,
      blastRadius: 3,
      patchType: "config_fix",
      patchTarget: ".claude/settings.json",
      patchContent: `Fix config issues: ${issues.slice(0, 3).join("; ")}`,
      patchImpact: "Ensure hook and team configurations are valid",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalChecks,
      validChecks,
      issueCount: issues.length,
      validPct,
    },
  };
}

module.exports = { run, DOMAIN };
