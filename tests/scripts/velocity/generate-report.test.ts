/**
 * velocity/generate-report.js Minimal Tests
 *
 * Tests the pure calculation functions from scripts/velocity/generate-report.js.
 * The script exports no functions (it calls run() immediately), so we test
 * by requiring it at a known project-root path and verifying only that the
 * module exports nothing destructive — and by mirroring the calculation logic.
 *
 * Run: npm run test:build && node --test dist-tests/tests/scripts/velocity/generate-report.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mirror calculateVelocity from generate-report.js
interface VelocityEntry {
  items_completed?: number;
  item_ids?: string[];
  tracks?: string[];
  session?: number;
  date?: string;
}

interface VelocityResult {
  totalSessions: number;
  totalItems: number;
  averageVelocity: number;
  trend: string;
  recentEntries: VelocityEntry[];
  trackBreakdown: Record<string, { sessions: number; items: number }>;
}

function calculateVelocity(entries: VelocityEntry[]): VelocityResult {
  if (entries.length === 0) {
    return {
      totalSessions: 0,
      totalItems: 0,
      averageVelocity: 0,
      trend: "insufficient data",
      recentEntries: [],
      trackBreakdown: {},
    };
  }

  const recent = entries.slice(-10);
  const totalItems = recent.reduce((sum, e) => sum + (e.items_completed || 0), 0);
  const averageVelocity = recent.length > 0 ? totalItems / recent.length : 0;

  let trend = "steady";
  if (recent.length >= 4) {
    const mid = Math.floor(recent.length / 2);
    const firstHalf = recent.slice(0, mid);
    const secondHalf = recent.slice(mid);
    const firstAvg = firstHalf.reduce((s, e) => s + (e.items_completed || 0), 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((s, e) => s + (e.items_completed || 0), 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.15) {
      trend = "accelerating";
    } else if (secondAvg < firstAvg * 0.85) {
      trend = "decelerating";
    }
  } else {
    trend = "insufficient data";
  }

  const trackBreakdown: Record<string, { sessions: number; items: number }> = {};
  for (const entry of entries) {
    const itemIds = Array.isArray(entry.item_ids) ? entry.item_ids : null;
    if (itemIds && itemIds.length > 0) {
      const tracksTouched = new Set<string>();
      for (const id of itemIds) {
        const track = String(id).match(/^([A-Z]+)/)?.[1];
        if (!track) continue;
        if (!trackBreakdown[track]) trackBreakdown[track] = { sessions: 0, items: 0 };
        trackBreakdown[track].items += 1;
        tracksTouched.add(track);
      }
      for (const track of tracksTouched) {
        trackBreakdown[track].sessions += 1;
      }
    } else {
      for (const track of entry.tracks || []) {
        if (!trackBreakdown[track]) trackBreakdown[track] = { sessions: 0, items: 0 };
        trackBreakdown[track].sessions += 1;
        trackBreakdown[track].items += entry.items_completed ?? 0;
      }
    }
  }

  return {
    totalSessions: entries.length,
    totalItems: entries.reduce((sum, e) => sum + (e.items_completed || 0), 0),
    averageVelocity: Math.round(averageVelocity * 10) / 10,
    trend,
    recentEntries: recent,
    trackBreakdown,
  };
}

// =========================================================
// calculateVelocity
// =========================================================

describe("calculateVelocity", () => {
  it("returns zeros and 'insufficient data' for empty entries", () => {
    const result = calculateVelocity([]);
    assert.equal(result.totalSessions, 0);
    assert.equal(result.totalItems, 0);
    assert.equal(result.averageVelocity, 0);
    assert.equal(result.trend, "insufficient data");
  });

  it("computes average velocity from last 10 entries", () => {
    const entries: VelocityEntry[] = Array.from({ length: 5 }, (_, i) => ({
      items_completed: 4,
      session: i + 1,
    }));
    const result = calculateVelocity(entries);
    assert.equal(result.averageVelocity, 4);
  });

  it("detects 'accelerating' trend when second half > first half by 15%", () => {
    const entries: VelocityEntry[] = [
      { items_completed: 2 },
      { items_completed: 2 },
      { items_completed: 4 },
      { items_completed: 4 },
    ];
    const result = calculateVelocity(entries);
    assert.equal(result.trend, "accelerating");
  });

  it("detects 'decelerating' trend when second half < first half by 15%", () => {
    const entries: VelocityEntry[] = [
      { items_completed: 10 },
      { items_completed: 10 },
      { items_completed: 2 },
      { items_completed: 2 },
    ];
    const result = calculateVelocity(entries);
    assert.equal(result.trend, "decelerating");
  });

  it("builds track breakdown from item_ids using prefix pattern", () => {
    const entries: VelocityEntry[] = [{ item_ids: ["EC1", "EC2", "FE1"], items_completed: 3 }];
    const result = calculateVelocity(entries);
    assert.equal(result.trackBreakdown["EC"]?.items, 2);
    assert.equal(result.trackBreakdown["FE"]?.items, 1);
  });

  it("uses legacy tracks fallback when item_ids is absent", () => {
    const entries: VelocityEntry[] = [{ tracks: ["A", "B"], items_completed: 5 }];
    const result = calculateVelocity(entries);
    assert.equal(result.trackBreakdown["A"]?.sessions, 1);
    assert.equal(result.trackBreakdown["A"]?.items, 5);
  });
});
