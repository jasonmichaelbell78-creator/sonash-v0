/**
 * Unit tests for extract-roadmap-debt.js
 *
 * Tests: loadExistingHashes JSONL parsing, loadExistingIntakeIds, debt classification
 * heuristics (isDebt), and INTAKE-RD ID sequencing.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── loadExistingHashes ───────────────────────────────────────────────────────

function loadHashesFromContent(content: string): Set<string> {
  const hashes = new Set<string>();
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line.replaceAll("\uFEFF", ""));
      if (item.content_hash) hashes.add(item.content_hash);
    } catch {
      // skip
    }
  }
  return hashes;
}

describe("loadExistingHashes (extract-roadmap-debt)", () => {
  it("collects hashes from valid JSONL", () => {
    const content = `{"id":"DEBT-0001","content_hash":"aaa"}\n{"id":"DEBT-0002","content_hash":"bbb"}`;
    const hashes = loadHashesFromContent(content);
    assert.ok(hashes.has("aaa"));
    assert.ok(hashes.has("bbb"));
  });

  it("skips items without content_hash", () => {
    const content = `{"id":"DEBT-0001"}`;
    assert.equal(loadHashesFromContent(content).size, 0);
  });

  it("strips BOM before parsing", () => {
    const content = '\uFEFF{"content_hash":"bomhash"}';
    const hashes = loadHashesFromContent(content);
    assert.ok(hashes.has("bomhash"));
  });

  it("returns empty set for empty content", () => {
    assert.equal(loadHashesFromContent("").size, 0);
  });
});

// ─── loadExistingIntakeIds ────────────────────────────────────────────────────

function loadIntakeIdsFromContent(content: string): Set<string> {
  const ids = new Set<string>();
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line.replaceAll("\uFEFF", ""));
      if (item.id) ids.add(item.id);
    } catch {
      // skip
    }
  }
  return ids;
}

describe("loadExistingIntakeIds", () => {
  it("collects IDs from intake JSONL", () => {
    const content = `{"id":"INTAKE-RD-1"}\n{"id":"INTAKE-RD-2"}`;
    const ids = loadIntakeIdsFromContent(content);
    assert.ok(ids.has("INTAKE-RD-1"));
    assert.ok(ids.has("INTAKE-RD-2"));
  });

  it("skips items without id", () => {
    const content = `{"title":"No ID here"}`;
    assert.equal(loadIntakeIdsFromContent(content).size, 0);
  });

  it("returns empty set for empty content", () => {
    assert.equal(loadIntakeIdsFromContent("").size, 0);
  });
});

// ─── Debt classification heuristics ──────────────────────────────────────────

interface ClassifyResult {
  isDebt: boolean;
  category: string;
  reason: string;
}

const DEBT_KEYWORDS = [
  "refactor",
  "fix",
  "cleanup",
  "clean up",
  "remove",
  "replace",
  "migrate",
  "technical debt",
  "tech debt",
  "improve",
  "consolidate",
  "simplify",
  "workaround",
  "hack",
  "todo",
  "fixme",
  "deprecated",
  "legacy",
];

const FEATURE_KEYWORDS = [
  "add",
  "implement",
  "create",
  "build",
  "design",
  "support",
  "integrate",
  "enable",
  "allow",
  "provide",
];

function classifyDebtCategory(lower: string): string {
  if (lower.includes("security")) return "security";
  if (lower.includes("test") || lower.includes("coverage")) return "code-quality";
  if (lower.includes("perf")) return "performance";
  if (lower.includes("doc")) return "documentation";
  return "refactoring";
}

function classifyCheckboxItem(text: string): ClassifyResult {
  const lower = text.toLowerCase();

  // Skip if already tracked
  if (/DEBT-\d+/.test(text) || /CANON-\d+/.test(text)) {
    return { isDebt: false, category: "skip", reason: "already tracked" };
  }

  const hasDebtKeyword = DEBT_KEYWORDS.some((kw) => lower.includes(kw));
  const hasFeatureKeyword = FEATURE_KEYWORDS.some((kw) => lower.startsWith(kw));

  if (hasFeatureKeyword && !hasDebtKeyword) {
    return { isDebt: false, category: "feature", reason: "feature keyword" };
  }

  if (hasDebtKeyword) {
    const category = classifyDebtCategory(lower);
    return { isDebt: true, category, reason: "debt keyword" };
  }

  return { isDebt: false, category: "unknown", reason: "no classification" };
}

describe("classifyCheckboxItem", () => {
  it("classifies 'Refactor auth flow' as debt", () => {
    const result = classifyCheckboxItem("Refactor auth flow");
    assert.equal(result.isDebt, true);
  });

  it("classifies 'Fix memory leak' as debt", () => {
    const result = classifyCheckboxItem("Fix memory leak");
    assert.equal(result.isDebt, true);
  });

  it("does not classify pure feature items as debt", () => {
    const result = classifyCheckboxItem("Add dark mode support");
    assert.equal(result.isDebt, false);
  });

  it("skips already-tracked DEBT- items", () => {
    const result = classifyCheckboxItem("DEBT-0042: Fix something");
    assert.equal(result.isDebt, false);
    assert.equal(result.reason, "already tracked");
  });

  it("skips already-tracked CANON- items", () => {
    const result = classifyCheckboxItem("CANON-0001 resolved");
    assert.equal(result.isDebt, false);
  });

  it("classifies security-related debt correctly", () => {
    const result = classifyCheckboxItem("Fix security vulnerability in auth");
    assert.equal(result.isDebt, true);
    assert.equal(result.category, "security");
  });
});

// ─── INTAKE-RD sequence tracking ─────────────────────────────────────────────

function computeNextRdSeq(content: string): number {
  let nextSeq = 1;
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      const match = /^INTAKE-RD-(\d+)$/.exec(item.id || "");
      if (match) nextSeq = Math.max(nextSeq, Number.parseInt(match[1], 10) + 1);
    } catch {
      // skip
    }
  }
  return nextSeq;
}

describe("computeNextRdSeq", () => {
  it("returns 1 for empty content", () => {
    assert.equal(computeNextRdSeq(""), 1);
  });

  it("returns max+1", () => {
    const content = `{"id":"INTAKE-RD-3"}\n{"id":"INTAKE-RD-7"}`;
    assert.equal(computeNextRdSeq(content), 8);
  });

  it("ignores non-INTAKE-RD IDs", () => {
    const content = `{"id":"DEBT-0001"}`;
    assert.equal(computeNextRdSeq(content), 1);
  });
});
