/**
 * decompose-state.js Minimal Tests
 *
 * decompose-state.js is an ESM module with top-level I/O side effects
 * (reads deep-plan.state.json, writes JSONL files). It cannot be imported
 * in tests without live data files.
 *
 * These tests verify the pure transformation logic that the script encodes,
 * specifically the tenet-extraction pattern and the decisions/directives
 * serialisation contract.
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/planning/decompose-state.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mirror the tenet extraction logic from decompose-state.js:
//   id: key.split("_")[0]  — e.g. "T1_evidence_based" → "T1"
function extractTenetIdFromKey(key: string): string {
  return key.split("_")[0];
}

// Mirror the decisions serialization:
//   decisions.map(d => JSON.stringify(d)).join("\n") + "\n"
function serializeDecisions(decisions: unknown[]): string {
  return decisions.map((d) => JSON.stringify(d)).join("\n") + "\n";
}

// Mirror the directives extraction:
//   Object.entries(directives).map(([key, value], i) =>
//     JSON.stringify({ id: i + 1, key, directive: value }))
function extractDirectives(
  directives: Record<string, string>
): Array<{ id: number; key: string; directive: string }> {
  return Object.entries(directives).map(([key, value], i) => ({
    id: i + 1,
    key,
    directive: value,
  }));
}

// Mirror the ideas extraction:
//   ideas.map((idea, i) => JSON.stringify({ id: i+1, idea, captured_during: "deep-plan-discovery" }))
function extractIdeas(
  ideas: string[]
): Array<{ id: number; idea: string; captured_during: string }> {
  return ideas.map((idea, i) => ({
    id: i + 1,
    idea,
    captured_during: "deep-plan-discovery",
  }));
}

// =========================================================
// Tenet key extraction
// =========================================================

describe("tenet ID extraction from key", () => {
  it("extracts 'T1' from 'T1_evidence_based'", () => {
    assert.equal(extractTenetIdFromKey("T1_evidence_based"), "T1");
  });

  it("extracts 'T10' from 'T10_source_of_truth'", () => {
    assert.equal(extractTenetIdFromKey("T10_source_of_truth"), "T10");
  });

  it("handles key with no underscore (returns whole key)", () => {
    assert.equal(extractTenetIdFromKey("T5"), "T5");
  });
});

// =========================================================
// Decisions serialization
// =========================================================

describe("decisions serialization", () => {
  it("produces valid JSONL with one line per decision", () => {
    const decisions = [
      { id: 1, decision: "Use TypeScript", choice: "TypeScript" },
      { id: 2, decision: "Use Zod", choice: "Zod" },
    ];
    const output = serializeDecisions(decisions);
    const lines = output.trimEnd().split("\n");
    assert.equal(lines.length, 2);
    assert.deepEqual(JSON.parse(lines[0]), decisions[0]);
    assert.deepEqual(JSON.parse(lines[1]), decisions[1]);
  });

  it("ends with a newline character", () => {
    const output = serializeDecisions([{ id: 1 }]);
    assert.ok(output.endsWith("\n"));
  });
});

// =========================================================
// Directives extraction
// =========================================================

describe("directives extraction", () => {
  it("assigns sequential IDs starting at 1", () => {
    const directives = {
      no_direct_writes: "Use Cloud Functions for writes",
      app_check_required: "All functions must verify App Check",
    };
    const result = extractDirectives(directives);
    assert.equal(result[0].id, 1);
    assert.equal(result[1].id, 2);
  });

  it("preserves key and directive fields", () => {
    const directives = { test_key: "test directive value" };
    const result = extractDirectives(directives);
    assert.equal(result[0].key, "test_key");
    assert.equal(result[0].directive, "test directive value");
  });

  it("returns empty array for empty directives", () => {
    assert.deepEqual(extractDirectives({}), []);
  });
});

// =========================================================
// Ideas extraction
// =========================================================

describe("ideas extraction", () => {
  it("assigns sequential IDs and sets captured_during field", () => {
    const ideas = ["Add dark mode", "Improve caching"];
    const result = extractIdeas(ideas);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 1);
    assert.equal(result[0].idea, "Add dark mode");
    assert.equal(result[0].captured_during, "deep-plan-discovery");
    assert.equal(result[1].id, 2);
  });

  it("returns empty array for no ideas", () => {
    assert.deepEqual(extractIdeas([]), []);
  });
});
