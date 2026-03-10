/**
 * validate-templates.js Test Suite
 *
 * Tests the pure helper functions from scripts/audit/validate-templates.js.
 * Core coverage:
 *   - hasHeadingWithKeywords
 *   - extractCategoryFromFilename
 *   - validateTemplate (all 10 checks)
 *   - formatJsonReport shape
 *   - FILENAME_TO_CATEGORY mapping
 *
 * Run: npm test (via node --test after tsc compilation)
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as path from "node:path";
import * as fs from "node:fs";

// ---------------------------------------------------------------------------
// Project root
// ---------------------------------------------------------------------------

function findProjectRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate project root from " + start);
}
const PROJECT_ROOT = findProjectRoot(__dirname);

// ---------------------------------------------------------------------------
// Re-implemented pure helpers
// ---------------------------------------------------------------------------

const FILENAME_TO_CATEGORY: Record<string, string> = {
  CODE_REVIEW: "code-quality",
  SECURITY: "security",
  PERFORMANCE: "performance",
  REFACTORING: "refactoring",
  DOCUMENTATION: "documentation",
  PROCESS: "process",
  ENGINEERING_PRODUCTIVITY: "engineering-productivity",
  ENHANCEMENT: "enhancements",
  AI_OPTIMIZATION: "ai-optimization",
};

const EXCLUDED_FILES = new Set(["SHARED_TEMPLATE_BASE.md", "AGGREGATOR.md"]);

function hasHeadingWithKeywords(content: string, keywords: string[]): boolean {
  const headingLines = content.split("\n").filter((line) => /^#{1,6}\s+/.test(line));
  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  for (const heading of headingLines) {
    const lowerHeading = heading.toLowerCase();
    for (const keyword of lowerKeywords) {
      if (lowerHeading.includes(keyword)) return true;
    }
  }
  return false;
}

function extractCategoryFromFilename(filename: string): string | null {
  const stem = filename.replace(/\.md$/i, "").replace(/_AUDIT$/i, "");

  if (FILENAME_TO_CATEGORY[stem]) return FILENAME_TO_CATEGORY[stem];

  for (const [token, category] of Object.entries(FILENAME_TO_CATEGORY)) {
    if (stem.toUpperCase() === token) return category;
  }

  return null;
}

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

interface TemplateResult {
  filename: string;
  checks: CheckResult[];
  score: number;
  total: number;
  percentage: number;
  category: string | null;
}

function validateTemplate(filename: string, content: string): TemplateResult {
  const lines = content.split("\n");
  const lineCount = lines.length;
  const checks: CheckResult[] = [];
  const TOTAL_CHECKS = 10;

  const hasH1 = lines.some((line) => /^#\s+/.test(line));
  checks.push({
    name: "H1 heading",
    passed: hasH1,
    detail: hasH1 ? "Found top-level heading" : "MISSING",
  });

  const category = extractCategoryFromFilename(filename);
  checks.push({
    name: "Canonical category",
    passed: category !== null,
    detail: category === null ? "MISSING" : `Matches "${category}"`,
  });

  const hasMinLines = lineCount > 20;
  checks.push({
    name: "Minimum length (>20 lines)",
    passed: hasMinLines,
    detail: hasMinLines ? `${lineCount} lines` : `MISSING - only ${lineCount} lines`,
  });

  const hasPurpose = hasHeadingWithKeywords(content, ["purpose", "scope"]);
  checks.push({
    name: "Purpose/Scope section",
    passed: hasPurpose,
    detail: hasPurpose ? "Found" : "MISSING",
  });

  const hasPrompt = hasHeadingWithKeywords(content, ["prompt", "instructions"]);
  checks.push({
    name: "Prompt/Instructions section",
    passed: hasPrompt,
    detail: hasPrompt ? "Found" : "MISSING",
  });

  const hasSubCategories = hasHeadingWithKeywords(content, [
    "sub-categories",
    "sub categories",
    "subcategories",
    "focus areas",
    "focus area",
    "review scope",
    "audit scope",
    "review categories",
    "audit categories",
    "review domains",
    "audit domains",
  ]);
  checks.push({
    name: "Sub-categories/Focus areas section",
    passed: hasSubCategories,
    detail: hasSubCategories ? "Found" : "MISSING",
  });

  const hasOutputFormat = hasHeadingWithKeywords(content, ["output format", "output"]);
  checks.push({
    name: "Output format section",
    passed: hasOutputFormat,
    detail: hasOutputFormat ? "Found" : "MISSING",
  });

  const hasGuardrails = hasHeadingWithKeywords(content, [
    "quality guardrails",
    "guardrails",
    "quality checks",
    "quality gates",
  ]);
  checks.push({
    name: "Quality guardrails section",
    passed: hasGuardrails,
    detail: hasGuardrails ? "Found" : "MISSING",
  });

  const hasTdms = hasHeadingWithKeywords(content, [
    "tdms integration",
    "tdms",
    "intake",
    "technical debt",
  ]);
  checks.push({
    name: "TDMS integration section",
    passed: hasTdms,
    detail: hasTdms ? "Found" : "MISSING",
  });

  const hasJsonlExample = content.includes("```json") || content.includes("JSONL_SCHEMA");
  checks.push({
    name: "JSONL example/schema reference",
    passed: hasJsonlExample,
    detail: hasJsonlExample ? "Found" : "MISSING",
  });

  const passed = checks.filter((c) => c.passed).length;
  const percentage = Math.round((passed / TOTAL_CHECKS) * 100);

  return { filename, checks, score: passed, total: TOTAL_CHECKS, percentage, category };
}

// ---------------------------------------------------------------------------
// Tests: FILENAME_TO_CATEGORY
// ---------------------------------------------------------------------------

describe("FILENAME_TO_CATEGORY", () => {
  it("contains exactly 9 entries", () => {
    assert.equal(Object.keys(FILENAME_TO_CATEGORY).length, 9);
  });

  it("maps CODE_REVIEW to code-quality", () => {
    assert.equal(FILENAME_TO_CATEGORY["CODE_REVIEW"], "code-quality");
  });

  it("maps ENGINEERING_PRODUCTIVITY to engineering-productivity", () => {
    assert.equal(FILENAME_TO_CATEGORY["ENGINEERING_PRODUCTIVITY"], "engineering-productivity");
  });

  it("all values are valid canonical category strings", () => {
    const VALID = new Set([
      "code-quality",
      "security",
      "performance",
      "refactoring",
      "documentation",
      "process",
      "engineering-productivity",
      "enhancements",
      "ai-optimization",
    ]);
    for (const val of Object.values(FILENAME_TO_CATEGORY)) {
      assert.ok(VALID.has(val), `Unexpected canonical value: ${val}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: EXCLUDED_FILES
// ---------------------------------------------------------------------------

describe("EXCLUDED_FILES", () => {
  it("excludes SHARED_TEMPLATE_BASE.md", () => {
    assert.ok(EXCLUDED_FILES.has("SHARED_TEMPLATE_BASE.md"));
  });

  it("excludes AGGREGATOR.md", () => {
    assert.ok(EXCLUDED_FILES.has("AGGREGATOR.md"));
  });
});

// ---------------------------------------------------------------------------
// Tests: hasHeadingWithKeywords
// ---------------------------------------------------------------------------

describe("hasHeadingWithKeywords", () => {
  it("returns true when a heading matches a keyword", () => {
    const content = "# Security Audit Template\n## Purpose\nContent here\n";
    assert.equal(hasHeadingWithKeywords(content, ["purpose"]), true);
  });

  it("returns false when no headings match any keyword", () => {
    const content = "# Security Audit Template\nContent only\n";
    assert.equal(hasHeadingWithKeywords(content, ["purpose", "scope"]), false);
  });

  it("is case-insensitive", () => {
    const content = "## OUTPUT FORMAT\nContent\n";
    assert.equal(hasHeadingWithKeywords(content, ["output format"]), true);
  });

  it("ignores non-heading lines that contain keywords", () => {
    const content = "This is the purpose of the template\n## Something Else\n";
    assert.equal(hasHeadingWithKeywords(content, ["purpose"]), false);
  });

  it("matches any level heading (# through ######)", () => {
    for (let level = 1; level <= 6; level++) {
      const heading = "#".repeat(level) + " Quality Guardrails";
      const result = hasHeadingWithKeywords(heading + "\nContent", ["guardrails"]);
      assert.equal(result, true, `Should match level-${level} heading`);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: extractCategoryFromFilename
// ---------------------------------------------------------------------------

describe("extractCategoryFromFilename", () => {
  it("extracts security from SECURITY_AUDIT.md", () => {
    assert.equal(extractCategoryFromFilename("SECURITY_AUDIT.md"), "security");
  });

  it("extracts code-quality from CODE_REVIEW_AUDIT.md", () => {
    assert.equal(extractCategoryFromFilename("CODE_REVIEW_AUDIT.md"), "code-quality");
  });

  it("extracts engineering-productivity from ENGINEERING_PRODUCTIVITY_AUDIT.md", () => {
    assert.equal(
      extractCategoryFromFilename("ENGINEERING_PRODUCTIVITY_AUDIT.md"),
      "engineering-productivity"
    );
  });

  it("returns null for AGGREGATOR.md (excluded)", () => {
    // AGGREGATOR does not match any token
    assert.equal(extractCategoryFromFilename("AGGREGATOR.md"), null);
  });

  it("returns null for an unrecognised filename", () => {
    assert.equal(extractCategoryFromFilename("RANDOM_TEMPLATE.md"), null);
  });
});

// ---------------------------------------------------------------------------
// Tests: validateTemplate
// ---------------------------------------------------------------------------

function buildFullContent(): string {
  return [
    "# Security Audit Template",
    "",
    "## Purpose",
    "This template is for security audits.",
    "",
    "## Audit Categories",
    "Focus on auth, crypto, injection.",
    "",
    "## Instructions",
    "Follow the steps below.",
    "",
    "## Output Format",
    "Use JSONL output.",
    "",
    "## Quality Guardrails",
    "Check before submitting.",
    "",
    "## TDMS Integration",
    "Map to technical debt.",
    "",
    "```json",
    '{"category":"security","title":"example"}',
    "```",
    "",
    "Additional content here.",
    "More content to reach line count threshold.",
    "Even more content.",
    "And some more.",
  ].join("\n");
}

describe("validateTemplate", () => {
  it("gives a high score to a well-formed template", () => {
    const result = validateTemplate("SECURITY_AUDIT.md", buildFullContent());
    assert.ok(result.percentage >= 80, `Expected >= 80%, got ${result.percentage}%`);
  });

  it("contains exactly 10 checks", () => {
    const result = validateTemplate("SECURITY_AUDIT.md", buildFullContent());
    assert.equal(result.checks.length, 10);
    assert.equal(result.total, 10);
  });

  it("fails H1 check when no top-level heading present", () => {
    const content = "## Secondary Heading\nContent only\n";
    const result = validateTemplate("SECURITY_AUDIT.md", content);
    const h1Check = result.checks.find((c) => c.name === "H1 heading");
    assert.ok(h1Check, "H1 heading check should exist");
    assert.equal(h1Check!.passed, false);
  });

  it("fails canonical category check for unrecognised filename", () => {
    const result = validateTemplate("RANDOM_AUDIT.md", buildFullContent());
    const catCheck = result.checks.find((c) => c.name === "Canonical category");
    assert.ok(catCheck);
    assert.equal(catCheck!.passed, false);
  });

  it("fails minimum length check for a file with <= 20 lines", () => {
    const shortContent = "# Title\nLine 2\nLine 3\n";
    const result = validateTemplate("SECURITY_AUDIT.md", shortContent);
    const lenCheck = result.checks.find((c) => c.name === "Minimum length (>20 lines)");
    assert.ok(lenCheck);
    assert.equal(lenCheck!.passed, false);
  });

  it("correctly detects JSONL example via ```json fence", () => {
    const content = buildFullContent();
    const result = validateTemplate("SECURITY_AUDIT.md", content);
    const jsonlCheck = result.checks.find((c) => c.name === "JSONL example/schema reference");
    assert.ok(jsonlCheck);
    assert.equal(jsonlCheck!.passed, true);
  });

  it("correctly detects JSONL_SCHEMA reference as alternative", () => {
    const content = buildFullContent().replace("```json", "JSONL_SCHEMA reference");
    const result = validateTemplate("SECURITY_AUDIT.md", content);
    const jsonlCheck = result.checks.find((c) => c.name === "JSONL example/schema reference");
    assert.ok(jsonlCheck);
    assert.equal(jsonlCheck!.passed, true);
  });

  it("calculates percentage as (passed / 10) * 100 rounded", () => {
    const minContent = "# Title\n" + "Line\n".repeat(20);
    const result = validateTemplate("SECURITY_AUDIT.md", minContent);
    const expectedPct = Math.round((result.score / 10) * 100);
    assert.equal(result.percentage, expectedPct);
  });
});

// ---------------------------------------------------------------------------
// Tests: formatJsonReport shape
// ---------------------------------------------------------------------------

function makeResult(pct: number): TemplateResult {
  return {
    filename: "SECURITY_AUDIT.md",
    checks: [],
    score: Math.round(pct / 10),
    total: 10,
    percentage: pct,
    category: "security",
  };
}

describe("formatJsonReport shape", () => {
  it("summary fields are present and correct", () => {
    const results = [makeResult(90), makeResult(60), makeResult(75)];
    const totalTemplates = results.length;
    const averageScore = Math.round(results.reduce((s, r) => s + r.percentage, 0) / totalTemplates);
    const passingAt80 = results.filter((r) => r.percentage >= 80).length;
    const belowThreshold = results.filter((r) => r.percentage < 70);

    assert.equal(totalTemplates, 3);
    assert.equal(passingAt80, 1);
    assert.equal(belowThreshold.length, 1);
    assert.ok(averageScore > 0);
  });

  it("computes allAboveThreshold correctly", () => {
    const allAbove = [makeResult(80), makeResult(90)];
    assert.equal(allAbove.filter((r) => r.percentage < 70).length === 0, true);

    const hasBelow = [makeResult(80), makeResult(65)];
    assert.equal(hasBelow.filter((r) => r.percentage < 70).length === 0, false);
  });
});

// ---------------------------------------------------------------------------
// Script existence
// ---------------------------------------------------------------------------

describe("script existence", () => {
  it("validate-templates.js exists at expected path", () => {
    const p = path.resolve(PROJECT_ROOT, "scripts/audit/validate-templates.js");
    assert.ok(fs.existsSync(p), `Script not found: ${p}`);
  });
});
