/* global __dirname */
/**
 * Tests for POSITIVE_PATTERNS.md section ID coverage and cross-references
 *
 * Part of Data Effectiveness Audit — test gap fill (Tasks 21, 22)
 *
 * Validates:
 * - All section IDs (S1-S25) exist in POSITIVE_PATTERNS.md
 * - Section IDs are sequential with no gaps
 * - code-reviewer SKILL.md only references section IDs that exist
 * - Anti-patterns listed in code-reviewer match CODE_PATTERNS.md top 5
 * - Every anti-pattern in code-reviewer has a POSITIVE_PATTERNS.md reference
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const POSITIVE_PATTERNS_PATH = path.join(
  PROJECT_ROOT,
  "docs",
  "agent_docs",
  "POSITIVE_PATTERNS.md"
);
const CODE_REVIEWER_PATH = path.join(
  PROJECT_ROOT,
  ".claude",
  "skills",
  "code-reviewer",
  "SKILL.md"
);
const CODE_PATTERNS_PATH = path.join(PROJECT_ROOT, "docs", "agent_docs", "CODE_PATTERNS.md");

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

// ---------------------------------------------------------------------------
// POSITIVE_PATTERNS.md section coverage
// ---------------------------------------------------------------------------

describe("POSITIVE_PATTERNS.md section IDs", () => {
  let content;

  it("file exists and is readable", () => {
    content = readFile(POSITIVE_PATTERNS_PATH);
    assert.ok(content.length > 0);
  });

  it("contains section heading for every S1-S25", () => {
    for (let i = 1; i <= 25; i++) {
      const sectionId = `S${i}`;
      // Look for ## S1: or ## S12: style headings
      const headingPattern = new RegExp(`^## ${sectionId}:`, "m");
      assert.ok(headingPattern.test(content), `Missing section heading for ${sectionId}`);
    }
  });

  it("section IDs are sequential with no gaps", () => {
    // Extract all section IDs from headings
    const sectionIds = [];
    const headingRegex = /^## S(\d+):/gm;
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      sectionIds.push(Number.parseInt(match[1], 10));
    }

    // Should be 1, 2, 3, ..., N with no gaps
    const sorted = [...sectionIds].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      assert.equal(sorted[i], i + 1, `Expected S${i + 1} at position ${i}, found S${sorted[i]}`);
    }
  });

  it("every section has an Anti-pattern line", () => {
    for (let i = 1; i <= 25; i++) {
      const sectionId = `S${i}`;
      // Look for "Anti-pattern:" within the section
      const sectionStart = content.indexOf(`## ${sectionId}:`);
      assert.ok(sectionStart !== -1, `Section ${sectionId} not found`);

      // Find next section or end of file
      const nextSection = content.indexOf("\n## S", sectionStart + 5);
      const sectionContent = content.slice(
        sectionStart,
        nextSection === -1 ? undefined : nextSection
      );

      assert.ok(
        /\*\*Anti-pattern:\*\*/i.test(sectionContent),
        `Section ${sectionId} missing "Anti-pattern:" line`
      );
    }
  });

  it("every section has a Positive pattern line", () => {
    for (let i = 1; i <= 25; i++) {
      const sectionId = `S${i}`;
      const sectionStart = content.indexOf(`## ${sectionId}:`);
      const nextSection = content.indexOf("\n## S", sectionStart + 5);
      const sectionContent = content.slice(
        sectionStart,
        nextSection === -1 ? undefined : nextSection
      );

      assert.ok(
        /\*\*Positive pattern:\*\*/i.test(sectionContent),
        `Section ${sectionId} missing "Positive pattern:" line`
      );
    }
  });

  it("every section has Key rules", () => {
    for (let i = 1; i <= 25; i++) {
      const sectionId = `S${i}`;
      const sectionStart = content.indexOf(`## ${sectionId}:`);
      const nextSection = content.indexOf("\n## S", sectionStart + 5);
      const sectionContent = content.slice(
        sectionStart,
        nextSection === -1 ? undefined : nextSection
      );

      assert.ok(
        /\*\*Key rules:\*\*/i.test(sectionContent),
        `Section ${sectionId} missing "Key rules:" line`
      );
    }
  });

  it("every section has at least one code block", () => {
    for (let i = 1; i <= 25; i++) {
      const sectionId = `S${i}`;
      const sectionStart = content.indexOf(`## ${sectionId}:`);
      const nextSection = content.indexOf("\n## S", sectionStart + 5);
      const sectionContent = content.slice(
        sectionStart,
        nextSection === -1 ? undefined : nextSection
      );

      assert.ok(
        sectionContent.includes("```"),
        `Section ${sectionId} has no code block (not copy-pasteable)`
      );
    }
  });

  it("Quick Reference Table has all 25 entries", () => {
    const tableStart = content.indexOf("## Quick Reference Table");
    assert.ok(tableStart !== -1, "Quick Reference Table section not found");

    const tableEnd = content.indexOf("\n---", tableStart);
    const tableContent = content.slice(tableStart, tableEnd);

    for (let i = 1; i <= 25; i++) {
      assert.ok(tableContent.includes(`| S${i} `), `Quick Reference Table missing entry for S${i}`);
    }
  });
});

// ---------------------------------------------------------------------------
// code-reviewer SKILL.md cross-references
// ---------------------------------------------------------------------------

describe("code-reviewer SKILL.md anti-pattern references", () => {
  let reviewerContent;
  let positiveContent;

  it("code-reviewer SKILL.md exists and has anti-pattern section", () => {
    reviewerContent = readFile(CODE_REVIEWER_PATH);
    assert.ok(
      reviewerContent.includes("Anti-Pattern & Positive Pattern Verification"),
      "Missing anti-pattern verification section"
    );
  });

  it("all POSITIVE_PATTERNS.md references in code-reviewer are valid IDs", () => {
    positiveContent = readFile(POSITIVE_PATTERNS_PATH);

    // Extract all S<N> references from code-reviewer
    const refs = [];
    const refRegex = /POSITIVE_PATTERNS\.md\s+S(\d+)/g;
    let match;
    while ((match = refRegex.exec(reviewerContent)) !== null) {
      refs.push(Number.parseInt(match[1], 10));
    }

    assert.ok(refs.length > 0, "No POSITIVE_PATTERNS.md references found");

    // Verify each referenced ID exists as a section heading
    for (const id of refs) {
      const heading = `## S${id}:`;
      assert.ok(
        positiveContent.includes(heading),
        `code-reviewer references S${id} but POSITIVE_PATTERNS.md has no ${heading} section`
      );
    }
  });

  it("anti-patterns in code-reviewer match CLAUDE.md top 5", () => {
    // The code-reviewer should reference the critical patterns from CLAUDE.md
    const criticalPatterns = [
      "error.message", // Error sanitization
      "startsWith", // Path traversal guard
      "existsSync", // TOCTOU race
      "/g", // exec() global flag
      "writeFileSync", // Safe writes
    ];

    const antiPatternSection = reviewerContent.slice(
      reviewerContent.indexOf("### 1. Check anti-patterns"),
      reviewerContent.indexOf("### 2. Check positive patterns")
    );

    for (const pattern of criticalPatterns) {
      assert.ok(
        antiPatternSection.includes(pattern),
        `code-reviewer anti-pattern section missing reference to "${pattern}"`
      );
    }
  });

  it("code-reviewer references POSITIVE_PATTERNS.md document path", () => {
    assert.ok(
      reviewerContent.includes("docs/agent_docs/POSITIVE_PATTERNS.md"),
      "code-reviewer should reference the full path to POSITIVE_PATTERNS.md"
    );
  });

  it("code-reviewer blocks on violations (D32 no warning mode)", () => {
    assert.ok(
      reviewerContent.includes("Block immediately"),
      "code-reviewer should block immediately on violations per D32"
    );
    // Verify it doesn't have a permissive "warn only" or "skip" mode
    // Note: "no warning mode" is correct (it negates warning mode) — only flag
    // positive enablement like "enable warning mode" or "warning mode: on"
    const antiSection = reviewerContent.slice(
      reviewerContent.indexOf("Anti-Pattern & Positive Pattern"),
      reviewerContent.indexOf("## Review Checklist")
    );
    const hasPermissiveWarning = /(?<!no\s)warning mode(?!.*disabled)/i.test(antiSection);
    const hasSkipMode = /skip mode|mode:\s*skip/i.test(antiSection);
    assert.ok(
      !hasPermissiveWarning && !hasSkipMode,
      "Anti-pattern section should not have permissive warning or skip mode"
    );
  });
});

// ---------------------------------------------------------------------------
// CODE_PATTERNS.md consistency
// ---------------------------------------------------------------------------

describe("CODE_PATTERNS.md and POSITIVE_PATTERNS.md alignment", () => {
  it("POSITIVE_PATTERNS.md covers all 5 critical patterns from CODE_PATTERNS.md", () => {
    const codePatterns = readFile(CODE_PATTERNS_PATH);
    const positivePatterns = readFile(POSITIVE_PATTERNS_PATH);

    // The 5 critical patterns from CODE_PATTERNS.md Quick Reference
    const criticalSections = [
      { name: "Error Sanitization", keyword: "sanitize" },
      { name: "Path Traversal Check", keyword: "traversal" },
      { name: "File Reads with try/catch", keyword: "try/catch" },
      { name: "exec() Loops with /g Flag", keyword: "/g" },
      { name: "Test Mocking", keyword: "httpsCallable" },
    ];

    for (const section of criticalSections) {
      // Verify the pattern name appears in CODE_PATTERNS.md
      assert.ok(
        codePatterns.includes(section.name),
        `CODE_PATTERNS.md missing critical pattern "${section.name}"`
      );

      // Verify POSITIVE_PATTERNS.md has a corresponding section
      assert.ok(
        positivePatterns.includes(section.keyword),
        `POSITIVE_PATTERNS.md missing coverage for "${section.name}" (keyword: ${section.keyword})`
      );
    }
  });
});
