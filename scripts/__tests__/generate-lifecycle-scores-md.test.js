/* global __dirname */
/**
 * Tests for generate-lifecycle-scores-md.js
 *
 * Part of Data Effectiveness Audit (Wave 5.1)
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

const { readJsonl, generateMarkdown, run } = require(
  path.join(__dirname, "..", "generate-lifecycle-scores-md.js")
);

const SAMPLE_ENTRIES = [
  {
    id: "ls-001",
    date: "2026-03-13",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    system: "Pattern Rules",
    category: "pattern-rules",
    files: ["CODE_PATTERNS.md", "verified-patterns.json"],
    capture: 3,
    storage: 2,
    recall: 2,
    action: 2,
    total: 9,
    gap: "Action: not all patterns enforced",
    remediation: "Wave 3 added POSITIVE_PATTERNS.md",
    wave_fixed: "W3",
  },
  {
    id: "ls-002",
    date: "2026-03-13",
    schema_version: 1,
    completeness: "full",
    completeness_missing: [],
    system: "Planning Data",
    category: "planning-data",
    files: ["decisions.jsonl"],
    capture: 2,
    storage: 1,
    recall: 0,
    action: 0,
    total: 3,
    gap: "Write-only, no consumer",
    remediation: null,
    wave_fixed: null,
  },
];

describe("readJsonl", () => {
  it("reads valid JSONL file", () => {
    const tmpFile = path.join(os.tmpdir(), `test-lifecycle-${Date.now()}.jsonl`);
    const content = SAMPLE_ENTRIES.map((e) => JSON.stringify(e)).join("\n") + "\n";
    fs.writeFileSync(tmpFile, content);

    try {
      const entries = readJsonl(tmpFile);
      assert.equal(entries.length, 2);
      assert.equal(entries[0].system, "Pattern Rules");
      assert.equal(entries[1].total, 3);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it("returns empty array for missing file", () => {
    const entries = readJsonl("/nonexistent/file.jsonl");
    assert.equal(entries.length, 0);
  });

  it("skips corrupt lines", () => {
    const tmpFile = path.join(os.tmpdir(), `test-corrupt-${Date.now()}.jsonl`);
    fs.writeFileSync(
      tmpFile,
      `${JSON.stringify(SAMPLE_ENTRIES[0])}\n{corrupt\n${JSON.stringify(SAMPLE_ENTRIES[1])}\n`
    );

    try {
      const entries = readJsonl(tmpFile);
      assert.equal(entries.length, 2); // Skips corrupt, keeps valid
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});

describe("generateMarkdown", () => {
  it("generates markdown with summary section", () => {
    const md = generateMarkdown(SAMPLE_ENTRIES);
    assert.ok(md.includes("# Lifecycle Scores"));
    assert.ok(md.includes("Total systems | 2"));
    assert.ok(md.includes("6.0/12")); // avg of 9+3
  });

  it("sorts systems by total score ascending", () => {
    const md = generateMarkdown(SAMPLE_ENTRIES);
    const planningIdx = md.indexOf("Planning Data");
    const patternIdx = md.indexOf("Pattern Rules");
    assert.ok(planningIdx < patternIdx, "Worse score should appear first");
  });

  it("flags systems below threshold", () => {
    const md = generateMarkdown(SAMPLE_ENTRIES);
    assert.ok(md.includes("**FLAG**"));
    assert.ok(md.includes("Flagged Systems"));
    assert.ok(md.includes("Planning Data (3/12)"));
  });

  it("generates action gaps section", () => {
    const md = generateMarkdown(SAMPLE_ENTRIES);
    assert.ok(md.includes("Action Gaps"));
    assert.ok(md.includes("Planning Data"));
  });

  it("generates wave improvements section", () => {
    const md = generateMarkdown(SAMPLE_ENTRIES);
    assert.ok(md.includes("Wave Improvements"));
    assert.ok(md.includes("Pattern Rules"));
    assert.ok(md.includes("W3"));
  });

  it("handles empty entries", () => {
    const md = generateMarkdown([]);
    assert.ok(md.includes("Total systems | 0"));
    assert.ok(md.includes("0.0/12"));
  });
});

describe("run", () => {
  it("generates output file from input", () => {
    const tmpInput = path.join(os.tmpdir(), `test-input-${Date.now()}.jsonl`);
    const tmpOutput = path.join(os.tmpdir(), `test-output-${Date.now()}.md`);
    const content = SAMPLE_ENTRIES.map((e) => JSON.stringify(e)).join("\n") + "\n";
    fs.writeFileSync(tmpInput, content);

    try {
      const result = run({ input: tmpInput, output: tmpOutput });
      assert.ok(result.success);
      assert.equal(result.entries.length, 2);
      assert.ok(fs.existsSync(tmpOutput));

      const md = fs.readFileSync(tmpOutput, "utf-8");
      assert.ok(md.includes("Pattern Rules"));
    } finally {
      try {
        fs.unlinkSync(tmpInput);
      } catch {
        /* ignore */
      }
      try {
        fs.unlinkSync(tmpOutput);
      } catch {
        /* ignore */
      }
    }
  });

  it("fails gracefully with empty input", () => {
    const tmpInput = path.join(os.tmpdir(), `test-empty-${Date.now()}.jsonl`);
    fs.writeFileSync(tmpInput, "");

    try {
      const result = run({ input: tmpInput, output: "/dev/null" });
      assert.equal(result.success, false);
    } finally {
      fs.unlinkSync(tmpInput);
    }
  });
});
