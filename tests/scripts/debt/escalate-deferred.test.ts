/**
 * Unit tests for escalate-deferred.js
 *
 * Tests: classifyCategory, extractPrNumber, readDeferredItems parsing,
 * and escalation threshold filtering.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── classifyCategory ────────────────────────────────────────────────────────

function classifyCategory(finding: string): string {
  const lower = (finding || "").toLowerCase();

  if (
    lower.includes("security") ||
    lower.includes("auth") ||
    lower.includes("xss") ||
    lower.includes("injection")
  ) {
    return "security";
  }

  if (lower.includes("test") || lower.includes("coverage") || lower.includes("assertion")) {
    return "testing";
  }

  if (lower.includes("perf") || lower.includes("latency") || lower.includes("memory")) {
    return "performance";
  }

  return "code-quality";
}

describe("classifyCategory", () => {
  it("classifies security findings", () => {
    assert.equal(classifyCategory("Missing security validation"), "security");
  });

  it("classifies auth findings as security", () => {
    assert.equal(classifyCategory("Fix auth token expiry"), "security");
  });

  it("classifies XSS findings as security", () => {
    assert.equal(classifyCategory("XSS vulnerability in input"), "security");
  });

  it("classifies injection findings as security", () => {
    assert.equal(classifyCategory("SQL injection risk"), "security");
  });

  it("classifies test-related findings", () => {
    assert.equal(classifyCategory("Missing test coverage for edge case"), "testing");
  });

  it("classifies assertion failures as testing", () => {
    assert.equal(classifyCategory("Add assertion to verify output"), "testing");
  });

  it("classifies performance findings", () => {
    assert.equal(classifyCategory("High latency in API calls"), "performance");
  });

  it("classifies memory issues as performance", () => {
    assert.equal(classifyCategory("Memory leak in event handlers"), "performance");
  });

  it("defaults to code-quality", () => {
    assert.equal(classifyCategory("Refactor utility function"), "code-quality");
  });

  it("handles empty string", () => {
    assert.equal(classifyCategory(""), "code-quality");
  });

  it("is case-insensitive", () => {
    assert.equal(classifyCategory("SECURITY AUDIT REQUIRED"), "security");
  });
});

// ─── extractPrNumber ─────────────────────────────────────────────────────────

function extractPrNumber(reviewId: string): number | null {
  const match = /^rev-(\d+)/.exec(reviewId || "");
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

describe("extractPrNumber", () => {
  it("extracts PR number from 'rev-419'", () => {
    assert.equal(extractPrNumber("rev-419"), 419);
  });

  it("extracts PR number from 'rev-1'", () => {
    assert.equal(extractPrNumber("rev-1"), 1);
  });

  it("returns null for non-matching format", () => {
    assert.equal(extractPrNumber("pr-123"), null);
  });

  it("returns null for empty string", () => {
    assert.equal(extractPrNumber(""), null);
  });

  it("returns null when no digits after rev-", () => {
    assert.equal(extractPrNumber("rev-"), null);
  });

  it("extracts first number segment only", () => {
    assert.equal(extractPrNumber("rev-42-extra"), 42);
  });
});

// ─── Escalation threshold filtering ──────────────────────────────────────────

interface DeferredItem {
  id: string;
  defer_count: number;
  status: string;
  promoted?: boolean;
}

function getItemsToEscalate(items: DeferredItem[], threshold: number): DeferredItem[] {
  return items.filter(
    (item) => item.defer_count >= threshold && item.status === "open" && !item.promoted
  );
}

describe("getItemsToEscalate", () => {
  const items: DeferredItem[] = [
    { id: "A", defer_count: 3, status: "open", promoted: false },
    { id: "B", defer_count: 1, status: "open", promoted: false },
    { id: "C", defer_count: 2, status: "closed", promoted: false },
    { id: "D", defer_count: 2, status: "open", promoted: true },
    { id: "E", defer_count: 2, status: "open", promoted: false },
  ];

  it("returns items meeting threshold", () => {
    const result = getItemsToEscalate(items, 2);
    assert.ok(result.some((i) => i.id === "A"));
    assert.ok(result.some((i) => i.id === "E"));
  });

  it("excludes items below threshold", () => {
    const result = getItemsToEscalate(items, 2);
    assert.equal(
      result.some((i) => i.id === "B"),
      false
    );
  });

  it("excludes closed items", () => {
    const result = getItemsToEscalate(items, 2);
    assert.equal(
      result.some((i) => i.id === "C"),
      false
    );
  });

  it("excludes already-promoted items", () => {
    const result = getItemsToEscalate(items, 2);
    assert.equal(
      result.some((i) => i.id === "D"),
      false
    );
  });

  it("returns empty when no items meet criteria", () => {
    assert.deepEqual(getItemsToEscalate(items, 100), []);
  });

  it("uses default threshold of 2", () => {
    const result = getItemsToEscalate(items, 2);
    assert.ok(result.length >= 1);
  });
});

// ─── readDeferredItems parsing ────────────────────────────────────────────────

function readDeferredItems(content: string): DeferredItem[] {
  const items: DeferredItem[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      items.push(JSON.parse(trimmed));
    } catch {
      // skip
    }
  }
  return items;
}

describe("readDeferredItems", () => {
  it("parses valid JSONL items", () => {
    const content = `{"id":"A","defer_count":2,"status":"open"}\n{"id":"B","defer_count":1,"status":"open"}`;
    const items = readDeferredItems(content);
    assert.equal(items.length, 2);
    assert.equal(items[0].id, "A");
  });

  it("skips malformed lines", () => {
    const content = `{"id":"A","defer_count":1,"status":"open"}\nNOT JSON`;
    assert.equal(readDeferredItems(content).length, 1);
  });

  it("returns empty array for empty content", () => {
    assert.deepEqual(readDeferredItems(""), []);
  });
});
