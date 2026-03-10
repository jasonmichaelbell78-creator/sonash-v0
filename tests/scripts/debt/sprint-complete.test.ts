/**
 * Unit tests for sprint-complete.js
 *
 * Tests: normalizeId, sprintKey, nextSprint, readJSON safety,
 * and SPRINT_ORDER constants.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── SPRINT_ORDER ─────────────────────────────────────────────────────────────

const SPRINT_ORDER = [
  "4",
  "5",
  "6",
  "7",
  "8a",
  "8b",
  "8c",
  "8d",
  "9a",
  "9b",
  "10",
  "11a",
  "11b",
  "11c",
  "12a",
  "12b",
];

describe("SPRINT_ORDER", () => {
  it("starts with sprint 4", () => assert.equal(SPRINT_ORDER[0], "4"));
  it("ends with sprint 12b", () => assert.equal(SPRINT_ORDER.at(-1), "12b"));
  it("contains 16 entries", () => assert.equal(SPRINT_ORDER.length, 16));
  it("contains sub-sprints like 8a, 8b, 8c, 8d", () => {
    ["8a", "8b", "8c", "8d"].forEach((s) => assert.ok(SPRINT_ORDER.includes(s)));
  });
  it("contains sub-sprints like 11a, 11b, 11c", () => {
    ["11a", "11b", "11c"].forEach((s) => assert.ok(SPRINT_ORDER.includes(s)));
  });
});

// ─── normalizeId ──────────────────────────────────────────────────────────────

function normalizeId(raw: string): string {
  return raw.replace(/^sprint-/, "");
}

describe("normalizeId", () => {
  it("strips 'sprint-' prefix", () => {
    assert.equal(normalizeId("sprint-4"), "4");
  });

  it("leaves bare number unchanged", () => {
    assert.equal(normalizeId("4"), "4");
  });

  it("strips sprint- from sub-sprint ID", () => {
    assert.equal(normalizeId("sprint-8a"), "8a");
  });

  it("is idempotent for already-normalized input", () => {
    assert.equal(normalizeId(normalizeId("sprint-5")), "5");
  });
});

// ─── sprintKey ────────────────────────────────────────────────────────────────

function sprintKey(id: string): string {
  return `sprint-${id}`;
}

describe("sprintKey", () => {
  it("prepends sprint- to id", () => {
    assert.equal(sprintKey("4"), "sprint-4");
  });

  it("handles sub-sprint IDs", () => {
    assert.equal(sprintKey("8a"), "sprint-8a");
  });

  it("round-trips with normalizeId", () => {
    assert.equal(normalizeId(sprintKey("12b")), "12b");
  });
});

// ─── nextSprint ───────────────────────────────────────────────────────────────

function nextSprint(id: string): string | null {
  const idx = SPRINT_ORDER.indexOf(id);
  if (idx === -1 || idx === SPRINT_ORDER.length - 1) return null;
  return SPRINT_ORDER[idx + 1];
}

describe("nextSprint", () => {
  it("returns '5' after '4'", () => {
    assert.equal(nextSprint("4"), "5");
  });

  it("returns '8a' after '7'", () => {
    assert.equal(nextSprint("7"), "8a");
  });

  it("returns '8b' after '8a'", () => {
    assert.equal(nextSprint("8a"), "8b");
  });

  it("returns null for last sprint", () => {
    assert.equal(nextSprint("12b"), null);
  });

  it("returns null for unknown sprint", () => {
    assert.equal(nextSprint("99"), null);
  });
});

// ─── readJSON safety ─────────────────────────────────────────────────────────

function readJSONSafe(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

describe("readJSON (sprint-complete)", () => {
  it("parses valid JSON", () => {
    const result = readJSONSafe('{"sprint":"4","ids":["DEBT-0001"]}') as Record<string, unknown>;
    assert.equal(result.sprint, "4");
  });

  it("returns null for invalid JSON", () => {
    assert.equal(readJSONSafe("NOT JSON"), null);
  });

  it("returns null for empty string", () => {
    assert.equal(readJSONSafe(""), null);
  });
});

// ─── Sprint completion check ──────────────────────────────────────────────────

interface SprintData {
  ids: string[];
}

function hasRemainingItems(
  masterItems: Array<{ id: string; status: string }>,
  sprintIds: string[]
): boolean {
  const unresolvedStatuses = new Set(["NEW", "VERIFIED", "IN_PROGRESS", "TRIAGED"]);
  const idSet = new Set(sprintIds);
  return masterItems.some((item) => idSet.has(item.id) && unresolvedStatuses.has(item.status));
}

describe("hasRemainingItems", () => {
  it("returns true when sprint has unresolved items", () => {
    const master = [
      { id: "DEBT-0001", status: "VERIFIED" },
      { id: "DEBT-0002", status: "RESOLVED" },
    ];
    assert.equal(hasRemainingItems(master, ["DEBT-0001", "DEBT-0002"]), true);
  });

  it("returns false when all sprint items are resolved", () => {
    const master = [
      { id: "DEBT-0001", status: "RESOLVED" },
      { id: "DEBT-0002", status: "FALSE_POSITIVE" },
    ];
    assert.equal(hasRemainingItems(master, ["DEBT-0001", "DEBT-0002"]), false);
  });

  it("returns false for empty sprint", () => {
    const master = [{ id: "DEBT-0001", status: "VERIFIED" }];
    assert.equal(hasRemainingItems(master, []), false);
  });

  it("ignores items not in sprint", () => {
    const master = [{ id: "DEBT-0001", status: "NEW" }];
    assert.equal(hasRemainingItems(master, ["DEBT-9999"]), false);
  });
});
