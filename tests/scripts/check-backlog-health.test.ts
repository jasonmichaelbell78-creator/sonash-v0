import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-backlog-health.js

function parseBacklogItems(content: string): {
  items: Array<{ id: string; severity: string; status?: string }>;
  corruptLines: Array<{ lineNumber: number; error: string }>;
} {
  const items: Array<{ id: string; severity: string; status?: string }> = [];
  const corruptLines: Array<{ lineNumber: number; error: string }> = [];
  const normalized = content.replaceAll("\uFEFF", "");
  const lines = normalized.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;
    try {
      const entry = JSON.parse(line) as unknown;
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        corruptLines.push({ lineNumber: i + 1, error: "Entry is not a JSON object" });
        continue;
      }
      const obj = entry as Record<string, unknown>;
      if (!obj["id"] || !obj["severity"]) {
        corruptLines.push({
          lineNumber: i + 1,
          error: "Missing required field (id or severity)",
        });
        continue;
      }
      items.push({
        ...obj,
        severity: typeof obj["severity"] === "string" ? obj["severity"].toUpperCase() : "S2",
        status: typeof obj["status"] === "string" ? obj["status"].toUpperCase() : undefined,
      } as { id: string; severity: string; status?: string });
    } catch (err) {
      corruptLines.push({
        lineNumber: i + 1,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { items, corruptLines };
}

function getBacklogConfig(): Record<string, number> {
  return {
    S1_MAX_DAYS: 7,
    S2_MAX_DAYS: 14,
    MAX_ITEMS: 25,
    BLOCK_S1_DAYS: 14,
  };
}

function isAging(createdDate: string, maxDays: number, now: Date): boolean {
  const created = new Date(createdDate);
  if (Number.isNaN(created.getTime())) return false;
  const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff > maxDays;
}

describe("check-backlog-health: parseBacklogItems", () => {
  it("parses valid JSONL entries", () => {
    const content = '{"id":"D-001","severity":"S1","status":"NEW"}\n{"id":"D-002","severity":"S2"}';
    const { items, corruptLines } = parseBacklogItems(content);
    assert.strictEqual(items.length, 2);
    assert.strictEqual(corruptLines.length, 0);
  });

  it("normalizes severity to uppercase", () => {
    const content = '{"id":"D-001","severity":"s1"}';
    const { items } = parseBacklogItems(content);
    assert.strictEqual(items[0].severity, "S1");
  });

  it("tracks corrupt lines", () => {
    const content = '{"id":"D-001","severity":"S1"}\nBAD_JSON\n{"id":"D-002"}';
    const { corruptLines } = parseBacklogItems(content);
    assert.strictEqual(corruptLines.length, 2); // BAD_JSON + missing severity
  });

  it("rejects array JSON values", () => {
    const content = "[]";
    const { corruptLines } = parseBacklogItems(content);
    assert.strictEqual(corruptLines.length, 1);
    assert.ok(corruptLines[0].error.includes("not a JSON object"));
  });

  it("strips BOM character", () => {
    const content = '\uFEFF{"id":"D-001","severity":"S1"}';
    const { items } = parseBacklogItems(content);
    assert.strictEqual(items.length, 1);
  });
});

describe("check-backlog-health: ACTIVE_STATUSES", () => {
  const ACTIVE_STATUSES = new Set(["NEW", "VERIFIED", "IN_PROGRESS", "PENDING"]);

  function isActive(status: string): boolean {
    return ACTIVE_STATUSES.has(status);
  }

  it("NEW is active", () => {
    assert.strictEqual(isActive("NEW"), true);
  });

  it("VERIFIED is active", () => {
    assert.strictEqual(isActive("VERIFIED"), true);
  });

  it("IN_PROGRESS is active", () => {
    assert.strictEqual(isActive("IN_PROGRESS"), true);
  });

  it("RESOLVED is not active", () => {
    assert.strictEqual(isActive("RESOLVED"), false);
  });

  it("FALSE_POSITIVE is not active", () => {
    assert.strictEqual(isActive("FALSE_POSITIVE"), false);
  });
});

describe("check-backlog-health: CONFIG defaults", () => {
  it("S1 threshold is 7 days", () => {
    assert.strictEqual(getBacklogConfig()["S1_MAX_DAYS"], 7);
  });

  it("S2 threshold is 14 days", () => {
    assert.strictEqual(getBacklogConfig()["S2_MAX_DAYS"], 14);
  });

  it("MAX_ITEMS threshold is 25", () => {
    assert.strictEqual(getBacklogConfig()["MAX_ITEMS"], 25);
  });
});

describe("check-backlog-health: aging check", () => {
  it("detects aged S1 issue", () => {
    const now = new Date("2026-03-10");
    assert.strictEqual(isAging("2026-03-01", 7, now), true);
  });

  it("does not flag fresh S1 issue", () => {
    const now = new Date("2026-03-10");
    assert.strictEqual(isAging("2026-03-08", 7, now), false);
  });

  it("handles invalid date gracefully", () => {
    assert.strictEqual(isAging("not-a-date", 7, new Date()), false);
  });
});
