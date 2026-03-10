import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-roadmap-hygiene.js

describe("check-roadmap-hygiene: duplicate entry detection", () => {
  function findDuplicateTitles(items: string[]): string[] {
    const seen = new Map<string, number>();
    const dups: string[] = [];
    for (const item of items) {
      const normalized = item.trim().toLowerCase();
      const count = (seen.get(normalized) ?? 0) + 1;
      seen.set(normalized, count);
      if (count === 2) dups.push(item);
    }
    return dups;
  }

  it("detects duplicate titles", () => {
    const items = ["Feature A", "Feature B", "Feature A"];
    assert.deepStrictEqual(findDuplicateTitles(items), ["Feature A"]);
  });

  it("is case-insensitive", () => {
    const items = ["feature a", "FEATURE A"];
    assert.deepStrictEqual(findDuplicateTitles(items), ["FEATURE A"]);
  });

  it("returns empty when no duplicates", () => {
    assert.deepStrictEqual(findDuplicateTitles(["A", "B", "C"]), []);
  });
});

describe("check-roadmap-hygiene: orphan task detection", () => {
  function findOrphanTasks(
    tasks: Array<{ id: string; milestone?: string }>,
    milestones: Set<string>
  ): string[] {
    return tasks.filter((t) => t.milestone && !milestones.has(t.milestone)).map((t) => t.id);
  }

  it("finds tasks referencing non-existent milestones", () => {
    const tasks = [
      { id: "T-001", milestone: "M-1" },
      { id: "T-002", milestone: "M-MISSING" },
    ];
    const milestones = new Set(["M-1"]);
    assert.deepStrictEqual(findOrphanTasks(tasks, milestones), ["T-002"]);
  });

  it("returns empty when all tasks are linked", () => {
    const tasks = [{ id: "T-001", milestone: "M-1" }];
    const milestones = new Set(["M-1"]);
    assert.deepStrictEqual(findOrphanTasks(tasks, milestones), []);
  });
});

describe("check-roadmap-hygiene: date format validation", () => {
  function isValidDate(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const d = new Date(dateStr);
    return !Number.isNaN(d.getTime());
  }

  it("accepts ISO date format", () => {
    assert.strictEqual(isValidDate("2026-03-10"), true);
  });

  it("rejects invalid format", () => {
    assert.strictEqual(isValidDate("March 10, 2026"), false);
  });

  it("rejects invalid date values", () => {
    assert.strictEqual(isValidDate("2026-13-40"), false);
  });

  it("rejects partial dates", () => {
    assert.strictEqual(isValidDate("2026-03"), false);
  });
});
