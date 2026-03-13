/* global __dirname */
/**
 * Tests for route-lifecycle-gaps.js
 *
 * Part of Data Effectiveness Audit — test gap fill
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

const { readJsonl, categorizeGap } = require(path.join(__dirname, "..", "route-lifecycle-gaps.js"));

// ---------------------------------------------------------------------------
// readJsonl
// ---------------------------------------------------------------------------

describe("readJsonl", () => {
  it("reads valid JSONL and returns parsed entries", () => {
    const tmpFile = path.join(os.tmpdir(), `test-rlg-${Date.now()}.jsonl`);
    const entries = [
      { id: "a", system: "Test", action: 0, total: 3 },
      { id: "b", system: "Test2", action: 2, total: 9 },
    ];
    fs.writeFileSync(tmpFile, entries.map((e) => JSON.stringify(e)).join("\n") + "\n");

    try {
      const result = readJsonl(tmpFile);
      assert.equal(result.length, 2);
      assert.equal(result[0].id, "a");
      assert.equal(result[1].system, "Test2");
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it("returns empty array for nonexistent file", () => {
    const result = readJsonl("/nonexistent/path.jsonl");
    assert.deepEqual(result, []);
  });

  it("skips corrupt lines without crashing", () => {
    const tmpFile = path.join(os.tmpdir(), `test-rlg-corrupt-${Date.now()}.jsonl`);
    fs.writeFileSync(tmpFile, '{"id":"ok"}\n{bad json\n{"id":"ok2"}\n');

    try {
      const result = readJsonl(tmpFile);
      assert.equal(result.length, 2);
      assert.equal(result[0].id, "ok");
      assert.equal(result[1].id, "ok2");
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it("handles empty file", () => {
    const tmpFile = path.join(os.tmpdir(), `test-rlg-empty-${Date.now()}.jsonl`);
    fs.writeFileSync(tmpFile, "");

    try {
      const result = readJsonl(tmpFile);
      assert.equal(result.length, 0);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it("handles CRLF line endings", () => {
    const tmpFile = path.join(os.tmpdir(), `test-rlg-crlf-${Date.now()}.jsonl`);
    fs.writeFileSync(tmpFile, '{"id":"1"}\r\n{"id":"2"}\r\n');

    try {
      const result = readJsonl(tmpFile);
      assert.equal(result.length, 2);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});

// ---------------------------------------------------------------------------
// categorizeGap
// ---------------------------------------------------------------------------

describe("categorizeGap", () => {
  it("categorizes code-type categories correctly", () => {
    assert.equal(categorizeGap({ category: "pattern-rules" }), "code");
    assert.equal(categorizeGap({ category: "audit-findings" }), "code");
    assert.equal(categorizeGap({ category: "aggregation-data" }), "code");
  });

  it("categorizes process-type categories correctly", () => {
    assert.equal(categorizeGap({ category: "hook-warnings" }), "process");
    assert.equal(categorizeGap({ category: "override-audit" }), "process");
    assert.equal(categorizeGap({ category: "health-scores" }), "process");
    assert.equal(categorizeGap({ category: "agent-tracking" }), "process");
    assert.equal(categorizeGap({ category: "velocity-tracking" }), "process");
    assert.equal(categorizeGap({ category: "commit-log" }), "process");
  });

  it("categorizes behavioral-type categories correctly", () => {
    assert.equal(categorizeGap({ category: "behavioral-rules" }), "behavioral");
    assert.equal(categorizeGap({ category: "security-checklist" }), "behavioral");
    assert.equal(categorizeGap({ category: "fix-templates" }), "behavioral");
    assert.equal(categorizeGap({ category: "memory" }), "behavioral");
    assert.equal(categorizeGap({ category: "session-context" }), "behavioral");
  });

  it("defaults to process for unknown categories", () => {
    assert.equal(categorizeGap({ category: "unknown-thing" }), "process");
    assert.equal(categorizeGap({ category: "" }), "process");
  });

  it("covers all categories from lifecycle-score schema", () => {
    // Every category enum value should map to one of the three types
    const allCategories = [
      "pattern-rules",
      "review-learnings",
      "retro-findings",
      "technical-debt",
      "hook-warnings",
      "override-audit",
      "health-scores",
      "behavioral-rules",
      "security-checklist",
      "fix-templates",
      "memory",
      "session-context",
      "agent-tracking",
      "velocity-tracking",
      "commit-log",
      "learning-routes",
      "planning-data",
      "audit-findings",
      "aggregation-data",
      "ecosystem-deferred",
    ];

    for (const cat of allCategories) {
      const result = categorizeGap({ category: cat });
      assert.ok(
        ["code", "process", "behavioral"].includes(result),
        `Category "${cat}" should map to code/process/behavioral, got "${result}"`
      );
    }
  });
});
