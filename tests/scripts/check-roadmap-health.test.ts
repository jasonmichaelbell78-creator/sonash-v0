import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-roadmap-health.js

describe("check-roadmap-health: milestone extraction", () => {
  function extractMilestones(content: string): Array<{ title: string; status: string }> {
    const milestones: Array<{ title: string; status: string }> = [];
    const regex = /^##\s+(.+?)\s*\[(COMPLETE|IN_PROGRESS|PLANNED)\]/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
      milestones.push({ title: match[1], status: match[2] });
    }
    return milestones;
  }

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
  function calculateHealthScore(total: number, complete: number, inProgress: number): number {
    if (total === 0) return 100;
    const completionPct = (complete / total) * 100;
    const activePct = (inProgress / total) * 100;
    return Math.min(100, Math.round(completionPct + activePct * 0.5));
  }

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
  function isStale(lastUpdatedDate: string, staleDaysThreshold: number, now: Date): boolean {
    const updated = new Date(lastUpdatedDate);
    if (Number.isNaN(updated.getTime())) return false;
    const daysDiff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > staleDaysThreshold;
  }

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
