import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/verify-skill-usage.js

interface TriggerRule {
  trigger: string | RegExp;
  skill: string;
  required: boolean;
}

const TRIGGER_RULES: TriggerRule[] = [
  { trigger: /bug|error|unexpected behavior/i, skill: "systematic-debugging", required: true },
  { trigger: /unfamiliar code/i, skill: "Explore agent", required: true },
  { trigger: /multi-step implementation/i, skill: "Plan agent", required: true },
  { trigger: /security|auth/i, skill: "security-auditor", required: false },
];

function detectRequiredSkills(prompt: string): string[] {
  return TRIGGER_RULES.filter((rule) => {
    const pattern = rule.trigger instanceof RegExp ? rule.trigger : new RegExp(rule.trigger, "i");
    return rule.required && pattern.test(prompt);
  }).map((rule) => rule.skill);
}

interface SkillInvocation {
  skill: string;
  timestamp: string;
  session: number;
}

function parseSkillLog(jsonlContent: string): SkillInvocation[] {
  return jsonlContent
    .split("\n")
    .filter((l) => l.trim())
    .flatMap((l) => {
      try {
        return [JSON.parse(l) as SkillInvocation];
      } catch {
        return [];
      }
    });
}

function calculateComplianceRate(totalTriggers: number, skillsUsed: number): number {
  if (totalTriggers === 0) return 100;
  return Math.round((skillsUsed / totalTriggers) * 100);
}

describe("verify-skill-usage: skill trigger detection", () => {
  it("requires systematic-debugging for bug prompts", () => {
    const skills = detectRequiredSkills("There is a bug in the auth module");
    assert.ok(skills.includes("systematic-debugging"));
  });

  it("requires Explore agent for unfamiliar code", () => {
    const skills = detectRequiredSkills("Exploring unfamiliar code in the codebase");
    assert.ok(skills.includes("Explore agent"));
  });

  it("returns empty for non-trigger prompts", () => {
    const skills = detectRequiredSkills("Update the README file");
    assert.strictEqual(skills.length, 0);
  });
});

describe("verify-skill-usage: skill invocation log parsing", () => {
  it("parses skill invocations from JSONL", () => {
    const content = '{"skill":"systematic-debugging","timestamp":"2026-01-01","session":100}\n';
    const invocations = parseSkillLog(content);
    assert.strictEqual(invocations.length, 1);
    assert.strictEqual(invocations[0].skill, "systematic-debugging");
  });

  it("handles empty content", () => {
    assert.deepStrictEqual(parseSkillLog(""), []);
  });
});

describe("verify-skill-usage: compliance rate calculation", () => {
  it("returns 100 when no triggers found", () => {
    assert.strictEqual(calculateComplianceRate(0, 0), 100);
  });

  it("calculates correct percentage", () => {
    assert.strictEqual(calculateComplianceRate(10, 8), 80);
  });

  it("returns 0 when no skills used despite triggers", () => {
    assert.strictEqual(calculateComplianceRate(5, 0), 0);
  });
});
