/**
 * Functional tests for PR #447 retro config/process changes (Items #2, #5, #6).
 *
 * Item #2: Qodo/Gemini suppression config sync
 * Item #5: Security Threat Model checklist in /pr-review Step 0
 * Item #6: SonarCloud Large PR Advisory at >40 files in /pr-review Step 0
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}

const PROJECT_ROOT = findProjectRoot(__dirname);

// =========================================================
// Helper: read file content safely
// =========================================================
function readFileContent(relativePath: string): string {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  try {
    return fs.readFileSync(fullPath, "utf-8");
  } catch {
    throw new Error(`Failed to read file: ${fullPath}`);
  }
}

// =========================================================
// Item #2: Qodo/Gemini Suppression Config Sync
// =========================================================

describe("Item #2: Qodo/Gemini suppression config sync", () => {
  const SUPPRESSION_CATEGORIES = [
    {
      id: "cjs-module-format",
      qodoPattern: "CJS module format",
      geminiPattern: "CJS module format",
      description: "CJS module format complaints on intentional CommonJS scripts",
    },
    {
      id: "repeat-rejection",
      qodoPattern: "rejected 3+ times",
      geminiPattern: "rejected 3+",
      description: "Repeat-rejection items (same item flagged 3+ times across rounds)",
    },
    {
      id: "claude-config-exposure",
      qodoPattern: "local config exposure",
      geminiPattern: "local config exposure",
      description: "Local config exposure flags on .claude/ directory files",
    },
    {
      id: "r-style-signatures",
      qodoPattern: "R-style",
      geminiPattern: "R-style",
      description: "R-style function signature complaints",
    },
  ];

  let qodoContent: string;
  let geminiContent: string;

  // Read files once for all tests in this describe block
  it("can read both config files", () => {
    qodoContent = readFileContent(".qodo/pr-agent.toml");
    geminiContent = readFileContent(".gemini/styleguide.md");
    assert.ok(qodoContent.length > 0, "Qodo config should not be empty");
    assert.ok(geminiContent.length > 0, "Gemini styleguide should not be empty");
  });

  for (const category of SUPPRESSION_CATEGORIES) {
    it(`Qodo config contains suppression: ${category.id}`, () => {
      if (!qodoContent) qodoContent = readFileContent(".qodo/pr-agent.toml");
      assert.ok(
        qodoContent.includes(category.qodoPattern),
        `Qodo config missing suppression pattern "${category.qodoPattern}" for category: ${category.description}`
      );
    });

    it(`Gemini styleguide contains suppression: ${category.id}`, () => {
      if (!geminiContent) geminiContent = readFileContent(".gemini/styleguide.md");
      assert.ok(
        geminiContent.includes(category.geminiPattern),
        `Gemini styleguide missing suppression pattern "${category.geminiPattern}" for category: ${category.description}`
      );
    });
  }

  it("all 4 suppression categories are present in both files (sync check)", () => {
    if (!qodoContent) qodoContent = readFileContent(".qodo/pr-agent.toml");
    if (!geminiContent) geminiContent = readFileContent(".gemini/styleguide.md");

    const missingInQodo: string[] = [];
    const missingInGemini: string[] = [];

    for (const category of SUPPRESSION_CATEGORIES) {
      if (!qodoContent.includes(category.qodoPattern)) {
        missingInQodo.push(category.id);
      }
      if (!geminiContent.includes(category.geminiPattern)) {
        missingInGemini.push(category.id);
      }
    }

    assert.strictEqual(
      missingInQodo.length,
      0,
      `Qodo config missing categories: ${missingInQodo.join(", ")}`
    );
    assert.strictEqual(
      missingInGemini.length,
      0,
      `Gemini styleguide missing categories: ${missingInGemini.join(", ")}`
    );
  });

  it("Qodo 'Do NOT flag' instructions are in the pr_reviewer section", () => {
    if (!qodoContent) qodoContent = readFileContent(".qodo/pr-agent.toml");
    // Verify the suppressions are under [pr_reviewer] extra_instructions
    const prReviewerSection = qodoContent.indexOf("[pr_reviewer]");
    const prCodeSection = qodoContent.indexOf("[pr_code_suggestions]");
    assert.ok(prReviewerSection >= 0, "[pr_reviewer] section must exist");
    assert.ok(prCodeSection > prReviewerSection, "[pr_code_suggestions] must follow [pr_reviewer]");

    const reviewerBlock = qodoContent.slice(prReviewerSection, prCodeSection);
    for (const category of SUPPRESSION_CATEGORIES) {
      assert.ok(
        reviewerBlock.includes(category.qodoPattern),
        `Category "${category.id}" must be in [pr_reviewer] section, not elsewhere`
      );
    }
  });

  it("Gemini suppressions are in the 'Do NOT Flag' section", () => {
    if (!geminiContent) geminiContent = readFileContent(".gemini/styleguide.md");
    const doNotFlagIndex = geminiContent.indexOf("## Do NOT Flag");
    const codeStandardsIndex = geminiContent.indexOf("## Code Standards");
    assert.ok(doNotFlagIndex >= 0, "'Do NOT Flag' section must exist");
    assert.ok(codeStandardsIndex > doNotFlagIndex, "'Code Standards' must follow 'Do NOT Flag'");

    const doNotFlagBlock = geminiContent.slice(doNotFlagIndex, codeStandardsIndex);
    for (const category of SUPPRESSION_CATEGORIES) {
      assert.ok(
        doNotFlagBlock.includes(category.geminiPattern),
        `Category "${category.id}" must be in 'Do NOT Flag' section, not elsewhere`
      );
    }
  });
});

// =========================================================
// Item #5: Security Threat Model Checklist in /pr-review Step 0
// =========================================================

describe("Item #5: Security Threat Model checklist in /pr-review Step 0", () => {
  const THREAT_MODEL_CATEGORIES = [
    "Injection vectors",
    "TOCTOU race conditions",
    "Symlink/path traversal risks",
    "Sanitization boundaries",
    "PII/credential exposure",
    "Control character risks",
  ];

  let skillContent: string;

  it("can read pr-review SKILL.md", () => {
    skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
    assert.ok(skillContent.length > 0, "SKILL.md should not be empty");
  });

  it("Security Threat Model section exists in SKILL.md", () => {
    if (!skillContent) skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
    assert.ok(
      skillContent.includes("Security Threat Model"),
      "SKILL.md must contain a 'Security Threat Model' section"
    );
  });

  it("Security Threat Model is in Step 0", () => {
    if (!skillContent) skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
    const step0Index = skillContent.indexOf("## Step 0:");
    const step1Index = skillContent.indexOf("## Step 1:");
    assert.ok(step0Index >= 0, "Step 0 must exist");
    assert.ok(step1Index > step0Index, "Step 1 must follow Step 0");

    const step0Block = skillContent.slice(step0Index, step1Index);
    assert.ok(
      step0Block.includes("Security Threat Model"),
      "Security Threat Model must be within Step 0, not another step"
    );
  });

  for (const category of THREAT_MODEL_CATEGORIES) {
    it(`threat model includes category: ${category}`, () => {
      if (!skillContent) skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
      assert.ok(
        skillContent.includes(category),
        `SKILL.md missing threat model category: "${category}"`
      );
    });
  }

  it("all 6 threat model categories are present", () => {
    if (!skillContent) skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
    const missing = THREAT_MODEL_CATEGORIES.filter((cat) => !skillContent.includes(cat));
    assert.strictEqual(missing.length, 0, `Missing threat model categories: ${missing.join(", ")}`);
  });

  it("threat model is conditional on scripts/hooks/security files", () => {
    if (!skillContent) skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
    // The section should mention the conditional trigger (scripts/, hooks/, security)
    const threatModelIndex = skillContent.indexOf("Security Threat Model");
    assert.ok(threatModelIndex >= 0);

    // Get surrounding context (500 chars before and after the heading)
    const contextStart = Math.max(0, threatModelIndex - 100);
    const contextEnd = Math.min(skillContent.length, threatModelIndex + 800);
    const context = skillContent.slice(contextStart, contextEnd);

    assert.ok(
      context.includes("scripts/") && context.includes("hooks/"),
      "Threat model section must reference scripts/ and hooks/ as conditional triggers"
    );
    assert.ok(
      context.includes("conditional") || context.includes("When the PR touches"),
      "Threat model must be explicitly conditional (not always required)"
    );
  });

  it("threat model uses a checklist format", () => {
    if (!skillContent) skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
    const threatModelIndex = skillContent.indexOf("Security Threat Model");
    const afterThreatModel = skillContent.slice(threatModelIndex, threatModelIndex + 1500);
    // Should contain markdown checklist items (- [ ])
    const checklistCount = (afterThreatModel.match(/- \[ \]/g) || []).length;
    assert.ok(
      checklistCount >= 6,
      `Threat model should have at least 6 checklist items, found ${checklistCount}`
    );
  });
});

// =========================================================
// Item #6: SonarCloud First-Scan Advisory at >40 Files
// =========================================================

describe("Item #6: Large PR Advisory at >40 files in /pr-review Step 0", () => {
  let skillContent: string;

  it("can read pr-review SKILL.md", () => {
    skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
    assert.ok(skillContent.length > 0, "SKILL.md should not be empty");
  });

  it("Large PR Advisory section exists in SKILL.md", () => {
    if (!skillContent) skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
    assert.ok(
      skillContent.includes("Large PR Advisory"),
      "SKILL.md must contain a 'Large PR Advisory' section"
    );
  });

  it("Large PR Advisory is in Step 0", () => {
    if (!skillContent) skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
    const step0Index = skillContent.indexOf("## Step 0:");
    const step1Index = skillContent.indexOf("## Step 1:");
    assert.ok(step0Index >= 0, "Step 0 must exist");
    assert.ok(step1Index > step0Index, "Step 1 must follow Step 0");

    const step0Block = skillContent.slice(step0Index, step1Index);
    assert.ok(
      step0Block.includes("Large PR Advisory"),
      "Large PR Advisory must be within Step 0, not another step"
    );
  });

  it("specifies the 40-file threshold", () => {
    if (!skillContent) skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
    const advisoryIndex = skillContent.indexOf("Large PR Advisory");
    assert.ok(advisoryIndex >= 0);

    // Get surrounding context
    const contextEnd = Math.min(skillContent.length, advisoryIndex + 800);
    const context = skillContent.slice(advisoryIndex, contextEnd);

    assert.ok(context.includes("40"), "Large PR Advisory must specify the 40-file threshold");
    assert.ok(
      context.includes(">40") || context.includes("> 40") || context.includes(">40 files"),
      "Large PR Advisory must specify >40 as the trigger condition"
    );
  });

  it("mentions SonarCloud first-scan volume", () => {
    if (!skillContent) skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
    const advisoryIndex = skillContent.indexOf("Large PR Advisory");
    const contextEnd = Math.min(skillContent.length, advisoryIndex + 800);
    const context = skillContent.slice(advisoryIndex, contextEnd);

    assert.ok(
      context.includes("SonarCloud") && context.includes("first-scan"),
      "Advisory must mention SonarCloud first-scan volume"
    );
  });

  it("recommends batch-acknowledgment for false-positive categories", () => {
    if (!skillContent) skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
    const advisoryIndex = skillContent.indexOf("Large PR Advisory");
    const contextEnd = Math.min(skillContent.length, advisoryIndex + 800);
    const context = skillContent.slice(advisoryIndex, contextEnd);

    assert.ok(
      context.includes("batch-acknowledgment"),
      "Advisory must recommend batch-acknowledgment"
    );
    assert.ok(
      context.includes("false-positive"),
      "Advisory must reference false-positive categories"
    );
  });

  it("references Qodo suppression categories", () => {
    if (!skillContent) skillContent = readFileContent(".claude/skills/pr-review/SKILL.md");
    const advisoryIndex = skillContent.indexOf("Large PR Advisory");
    const contextEnd = Math.min(skillContent.length, advisoryIndex + 1000);
    const context = skillContent.slice(advisoryIndex, contextEnd);

    // Should reference the suppression config files or the categories from Item #2
    assert.ok(
      context.includes(".qodo/pr-agent.toml") || context.includes("suppression categories"),
      "Advisory must reference Qodo suppression categories or config file"
    );
  });
});
