import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-roadmap-health.js

function extractMilestones(content: string): Array<{ title: string; status: string }> {
  const regex = /^##\s+(.+?)\s*\[(COMPLETE|IN_PROGRESS|PLANNED)\]/gm;
  return Array.from(content.matchAll(regex), (m) => ({ title: m[1], status: m[2] }));
}

function calculateHealthScore(total: number, complete: number, inProgress: number): number {
  if (total === 0) return 100;
  const completionPct = (complete / total) * 100;
  const activePct = (inProgress / total) * 100;
  return Math.min(100, Math.round(completionPct + activePct * 0.5));
}

function isStale(lastUpdatedDate: string, staleDaysThreshold: number, now: Date): boolean {
  const updated = new Date(lastUpdatedDate);
  if (Number.isNaN(updated.getTime())) return false;
  const daysDiff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff > staleDaysThreshold;
}

describe("check-roadmap-health: milestone extraction", () => {
  it("extracts completed milestone", () => {
    const content = "## Feature A [COMPLETE]";
    const milestones = extractMilestones(content);
    assert.strictEqual(milestones[0].title, "Feature A");
    assert.strictEqual(milestones[0].status, "COMPLETE");
  });

  it("extracts in-progress milestone", () => {
    const content = "## Feature B [IN_PROGRESS]";
    const milestones = extractMilestones(content);
    assert.strictEqual(milestones[0].status, "IN_PROGRESS");
  });

  it("returns empty for no milestones", () => {
    assert.deepStrictEqual(extractMilestones("# Plain heading"), []);
  });
});

describe("check-roadmap-health: health scoring", () => {
  it("returns 100 for no milestones", () => {
    assert.strictEqual(calculateHealthScore(0, 0, 0), 100);
  });

  it("calculates correct score for all complete", () => {
    assert.strictEqual(calculateHealthScore(10, 10, 0), 100);
  });

  it("gives partial credit for in-progress items", () => {
    const score = calculateHealthScore(10, 0, 10);
    assert.strictEqual(score, 50);
  });
});

describe("check-roadmap-health: stale milestone detection", () => {
  it("identifies stale milestone", () => {
    const now = new Date("2026-03-10");
    assert.strictEqual(isStale("2025-12-01", 90, now), true);
  });

  it("does not flag recent milestone", () => {
    const now = new Date("2026-03-10");
    assert.strictEqual(isStale("2026-03-01", 90, now), false);
  });

  it("handles invalid date gracefully", () => {
    assert.strictEqual(isStale("not-a-date", 90, new Date()), false);
  });
});
