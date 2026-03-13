/* global __dirname */
/**
 * Tests for route-enforcement-gaps.js
 *
 * Part of Data Effectiveness Audit (Wave 4.2)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { extractGaps, routeGaps } = require(path.join(__dirname, "..", "route-enforcement-gaps.js"));

describe("extractGaps", () => {
  it("extracts numbered list gaps with backward rule lookup", () => {
    const content = [
      "## 4. Behavioral Guardrails",
      "",
      "1. **Ask first.** Explain immediately.",
      "   `[BEHAVIORAL: proxy metric only]`",
      "2. **Stop and ask.** Hard stop.",
      "   `[BEHAVIORAL: no automated enforcement]`",
    ].join("\n");

    const gaps = extractGaps(content);
    assert.equal(gaps.length, 1);
    assert.equal(gaps[0].rule, "Stop and ask.");
    assert.equal(gaps[0].section, "Section 4: Behavioral Guardrails");
  });

  it("extracts heading-level gaps with inline annotation", () => {
    const content = [
      "## 7. Agent/Skill Triggers",
      "",
      "### PRE-TASK (before starting work) `[BEHAVIORAL: no automated enforcement]`",
    ].join("\n");

    const gaps = extractGaps(content);
    assert.equal(gaps.length, 1);
    assert.equal(gaps[0].rule, "PRE-TASK (before starting work)");
  });

  it("extracts bullet list gaps", () => {
    const content = [
      "## 6. Coding Standards",
      "",
      "- **State**: useState local, Context global",
      "  `[BEHAVIORAL: no automated enforcement]`",
    ].join("\n");

    const gaps = extractGaps(content);
    assert.equal(gaps.length, 1);
    assert.equal(gaps[0].rule, "State");
  });

  it("ignores non-gap annotations", () => {
    const content = [
      "## 5. Anti-Patterns",
      "",
      "| Error sanitization | Use sanitize-error.js | `[GATE: patterns:check]` |",
    ].join("\n");

    const gaps = extractGaps(content);
    assert.equal(gaps.length, 0);
  });

  it("returns empty for content without gaps", () => {
    const gaps = extractGaps("# No rules here\n\nJust text.");
    assert.equal(gaps.length, 0);
  });

  it("handles multiple gaps in same section", () => {
    const content = [
      "## 4. Behavioral Guardrails",
      "",
      "1. **Rule A.** Description.",
      "   `[BEHAVIORAL: no automated enforcement]`",
      "2. **Rule B.** Description.",
      "   `[BEHAVIORAL: no automated enforcement]`",
      "3. **Rule C.** Description.",
      "   `[GATE: pre-commit]`",
    ].join("\n");

    const gaps = extractGaps(content);
    assert.equal(gaps.length, 2);
    assert.equal(gaps[0].rule, "Rule A.");
    assert.equal(gaps[1].rule, "Rule B.");
  });

  it("tracks correct line numbers", () => {
    const content = [
      "## 1. Section",
      "",
      "1. **Rule.** Text.",
      "   `[BEHAVIORAL: no automated enforcement]`",
    ].join("\n");

    const gaps = extractGaps(content);
    assert.equal(gaps[0].line, 4); // 1-indexed
  });
});

describe("routeGaps", () => {
  it("routes gaps in dry-run mode without writing", () => {
    const gaps = [{ section: "Section 4", rule: "Test rule", line: 10 }];

    const results = routeGaps(gaps, { dryRun: true });
    assert.equal(results.length, 1);
    assert.equal(results[0].gap.rule, "Test rule");
    assert.ok(results[0].action.includes("Would scaffold"));
  });

  it("handles empty gap list", () => {
    const results = routeGaps([], { dryRun: true });
    assert.equal(results.length, 0);
  });
});
