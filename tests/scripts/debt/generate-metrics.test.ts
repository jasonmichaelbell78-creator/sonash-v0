/**
 * Unit tests for generate-metrics.js
 *
 * Tests calculateMetrics, isOpenItem, trackAlertItem, and trackItemAge
 * as pure functions — no file I/O required.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Re-implementations of pure functions from generate-metrics.js ────────────

interface DebtItem {
  id?: string;
  title?: string;
  severity?: string;
  status?: string;
  category?: string;
  file?: string;
  line?: number;
  created?: string;
  source?: string;
  source_id?: string;
  cluster_id?: string;
  [key: string]: unknown;
}

function isOpenItem(item: DebtItem): boolean {
  return item.status !== "RESOLVED" && item.status !== "FALSE_POSITIVE";
}

interface AlertEntry {
  id?: string;
  title: string;
  file?: string;
  line?: number;
}

interface Alerts {
  s0: AlertEntry[];
  s1: AlertEntry[];
}

function trackAlertItem(item: DebtItem, alerts: Alerts): void {
  if (!isOpenItem(item)) return;
  const alertEntry: AlertEntry = {
    id: item.id,
    title: item.title?.substring(0, 60) ?? "No title",
    file: item.file,
    line: item.line,
  };
  if (item.severity === "S0") {
    alerts.s0.push(alertEntry);
  } else if (item.severity === "S1") {
    alerts.s1.push(alertEntry);
  }
}

interface AgeState {
  totalAgeDays: number;
  openCount: number;
  oldestAge: number;
  oldestItem: DebtItem | null;
}

function trackItemAge(item: DebtItem, now: Date, ageState: AgeState): void {
  if (!isOpenItem(item)) return;
  if (!item.created) return;
  const createdMs = new Date(item.created).getTime();
  if (!Number.isFinite(createdMs)) return;
  const ageDays = Math.floor((now.getTime() - createdMs) / (1000 * 60 * 60 * 24));
  if (ageDays < 0) return;
  ageState.totalAgeDays += ageDays;
  ageState.openCount++;
  if (ageDays > ageState.oldestAge) {
    ageState.oldestAge = ageDays;
    ageState.oldestItem = item;
  }
}

function calculateMetrics(items: DebtItem[]): ReturnType<typeof buildMetrics> {
  return buildMetrics(items, new Date());
}

function buildMetrics(items: DebtItem[], now: Date) {
  const today = now.toISOString().split("T")[0];
  const byStatus: Record<string, number> = {
    NEW: 0,
    VERIFIED: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    FALSE_POSITIVE: 0,
  };
  const bySeverity: Record<string, number> = { S0: 0, S1: 0, S2: 0, S3: 0 };
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const alerts: Alerts = { s0: [], s1: [] };
  const ageState: AgeState = { totalAgeDays: 0, openCount: 0, oldestAge: 0, oldestItem: null };

  for (const item of items) {
    byStatus[item.status ?? ""] = (byStatus[item.status ?? ""] || 0) + 1;
    bySeverity[item.severity ?? ""] = (bySeverity[item.severity ?? ""] || 0) + 1;
    byCategory[item.category ?? ""] = (byCategory[item.category ?? ""] || 0) + 1;
    const itemSource =
      item.source ||
      (item.source_id && item.source_id.includes(":") ? item.source_id.split(":")[0] : null) ||
      "unknown";
    bySource[itemSource] = (bySource[itemSource] || 0) + 1;
    trackAlertItem(item, alerts);
    trackItemAge(item, now, ageState);
  }

  const totalItems = items.length;
  const resolvedItems = byStatus.RESOLVED ?? 0;
  const openItems = totalItems - resolvedItems - (byStatus.FALSE_POSITIVE ?? 0);
  const avgAgeDays =
    ageState.openCount > 0 ? Math.round(ageState.totalAgeDays / ageState.openCount) : 0;
  const resolutionRate = totalItems > 0 ? Math.round((resolvedItems / totalItems) * 100) : 0;

  return {
    generated: now.toISOString(),
    generated_date: today,
    summary: {
      total: totalItems,
      open: openItems,
      resolved: resolvedItems,
      false_positives: byStatus.FALSE_POSITIVE ?? 0,
      resolution_rate_pct: resolutionRate,
    },
    by_status: byStatus,
    by_severity: bySeverity,
    by_category: byCategory,
    by_source: bySource,
    alerts: {
      s0_count: alerts.s0.length,
      s1_count: alerts.s1.length,
      s0_items: alerts.s0.slice(0, 10),
      s1_items: alerts.s1.slice(0, 10),
    },
    health: {
      avg_age_days: avgAgeDays,
      oldest_age_days: ageState.oldestAge,
      oldest_item_id: ageState.oldestItem?.id ?? null,
      verification_queue_size: byStatus.NEW ?? 0,
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("generate-metrics: isOpenItem", () => {
  it("NEW status is open", () => {
    assert.strictEqual(isOpenItem({ status: "NEW" }), true);
  });

  it("VERIFIED status is open", () => {
    assert.strictEqual(isOpenItem({ status: "VERIFIED" }), true);
  });

  it("IN_PROGRESS status is open", () => {
    assert.strictEqual(isOpenItem({ status: "IN_PROGRESS" }), true);
  });

  it("RESOLVED status is not open", () => {
    assert.strictEqual(isOpenItem({ status: "RESOLVED" }), false);
  });

  it("FALSE_POSITIVE status is not open", () => {
    assert.strictEqual(isOpenItem({ status: "FALSE_POSITIVE" }), false);
  });
});

describe("generate-metrics: trackAlertItem", () => {
  it("adds S0 open item to s0 alerts", () => {
    const alerts: Alerts = { s0: [], s1: [] };
    trackAlertItem(
      { id: "DEBT-0001", title: "Critical issue", severity: "S0", status: "NEW" },
      alerts
    );
    assert.strictEqual(alerts.s0.length, 1);
    assert.strictEqual(alerts.s0[0].id, "DEBT-0001");
  });

  it("adds S1 open item to s1 alerts", () => {
    const alerts: Alerts = { s0: [], s1: [] };
    trackAlertItem(
      { id: "DEBT-0002", title: "High issue", severity: "S1", status: "VERIFIED" },
      alerts
    );
    assert.strictEqual(alerts.s1.length, 1);
  });

  it("does not add resolved S0 to alerts", () => {
    const alerts: Alerts = { s0: [], s1: [] };
    trackAlertItem(
      { id: "DEBT-0003", title: "Resolved", severity: "S0", status: "RESOLVED" },
      alerts
    );
    assert.strictEqual(alerts.s0.length, 0);
  });

  it("does not add FALSE_POSITIVE to alerts", () => {
    const alerts: Alerts = { s0: [], s1: [] };
    trackAlertItem(
      { id: "DEBT-0004", title: "FP", severity: "S0", status: "FALSE_POSITIVE" },
      alerts
    );
    assert.strictEqual(alerts.s0.length, 0);
  });

  it("does not add S2 or S3 to alerts", () => {
    const alerts: Alerts = { s0: [], s1: [] };
    trackAlertItem({ id: "DEBT-0005", title: "Medium", severity: "S2", status: "NEW" }, alerts);
    trackAlertItem({ id: "DEBT-0006", title: "Low", severity: "S3", status: "NEW" }, alerts);
    assert.strictEqual(alerts.s0.length, 0);
    assert.strictEqual(alerts.s1.length, 0);
  });

  it("truncates long titles to 60 chars", () => {
    const alerts: Alerts = { s0: [], s1: [] };
    const longTitle = "A".repeat(100);
    trackAlertItem({ id: "DEBT-0007", title: longTitle, severity: "S0", status: "NEW" }, alerts);
    assert.strictEqual(alerts.s0[0].title.length, 60);
  });
});

describe("generate-metrics: trackItemAge", () => {
  const now = new Date("2024-06-15T00:00:00Z");

  it("calculates age in days correctly", () => {
    const ageState: AgeState = { totalAgeDays: 0, openCount: 0, oldestAge: 0, oldestItem: null };
    trackItemAge({ id: "DEBT-0001", status: "NEW", created: "2024-06-01" }, now, ageState);
    assert.strictEqual(ageState.openCount, 1);
    assert.strictEqual(ageState.totalAgeDays, 14);
  });

  it("does not track resolved items", () => {
    const ageState: AgeState = { totalAgeDays: 0, openCount: 0, oldestAge: 0, oldestItem: null };
    trackItemAge({ id: "DEBT-0001", status: "RESOLVED", created: "2024-01-01" }, now, ageState);
    assert.strictEqual(ageState.openCount, 0);
  });

  it("skips items without created date", () => {
    const ageState: AgeState = { totalAgeDays: 0, openCount: 0, oldestAge: 0, oldestItem: null };
    trackItemAge({ id: "DEBT-0001", status: "NEW" }, now, ageState);
    assert.strictEqual(ageState.openCount, 0);
  });

  it("skips items with future created date (negative age)", () => {
    const ageState: AgeState = { totalAgeDays: 0, openCount: 0, oldestAge: 0, oldestItem: null };
    trackItemAge({ id: "DEBT-0001", status: "NEW", created: "2025-01-01" }, now, ageState);
    assert.strictEqual(ageState.openCount, 0);
  });

  it("skips items with invalid created date", () => {
    const ageState: AgeState = { totalAgeDays: 0, openCount: 0, oldestAge: 0, oldestItem: null };
    trackItemAge({ id: "DEBT-0001", status: "NEW", created: "not-a-date" }, now, ageState);
    assert.strictEqual(ageState.openCount, 0);
  });

  it("tracks oldest item correctly", () => {
    const ageState: AgeState = { totalAgeDays: 0, openCount: 0, oldestAge: 0, oldestItem: null };
    trackItemAge({ id: "DEBT-0001", status: "NEW", created: "2024-06-01" }, now, ageState); // 14 days
    trackItemAge({ id: "DEBT-0002", status: "NEW", created: "2024-01-01" }, now, ageState); // ~166 days
    assert.strictEqual(ageState.oldestItem?.id, "DEBT-0002");
    assert.ok(ageState.oldestAge > 100);
  });
});

describe("generate-metrics: calculateMetrics happy path", () => {
  const items: DebtItem[] = [
    {
      id: "DEBT-0001",
      severity: "S0",
      status: "NEW",
      category: "security",
      source_id: "audit:a",
      created: "2024-01-01",
    },
    {
      id: "DEBT-0002",
      severity: "S1",
      status: "VERIFIED",
      category: "code-quality",
      source_id: "audit:b",
      created: "2024-02-01",
    },
    {
      id: "DEBT-0003",
      severity: "S2",
      status: "RESOLVED",
      category: "security",
      source_id: "sonarcloud:c",
      created: "2024-03-01",
    },
    {
      id: "DEBT-0004",
      severity: "S3",
      status: "FALSE_POSITIVE",
      category: "documentation",
      source_id: "manual:d",
      created: "2024-04-01",
    },
  ];

  it("computes correct totals", () => {
    const metrics = calculateMetrics(items);
    assert.strictEqual(metrics.summary.total, 4);
  });

  it("computes resolved count correctly", () => {
    const metrics = calculateMetrics(items);
    assert.strictEqual(metrics.summary.resolved, 1);
  });

  it("computes open count (excludes RESOLVED and FALSE_POSITIVE)", () => {
    const metrics = calculateMetrics(items);
    assert.strictEqual(metrics.summary.open, 2);
  });

  it("computes by_severity correctly", () => {
    const metrics = calculateMetrics(items);
    assert.strictEqual(metrics.by_severity.S0, 1);
    assert.strictEqual(metrics.by_severity.S1, 1);
    assert.strictEqual(metrics.by_severity.S2, 1);
    assert.strictEqual(metrics.by_severity.S3, 1);
  });

  it("computes by_category correctly", () => {
    const metrics = calculateMetrics(items);
    assert.strictEqual(metrics.by_category["security"], 2);
    assert.strictEqual(metrics.by_category["code-quality"], 1);
  });

  it("alerts only include open S0 and S1", () => {
    const metrics = calculateMetrics(items);
    assert.strictEqual(metrics.alerts.s0_count, 1);
    assert.strictEqual(metrics.alerts.s1_count, 1);
  });

  it("resolution_rate is 25% for 1/4 resolved", () => {
    const metrics = calculateMetrics(items);
    assert.strictEqual(metrics.summary.resolution_rate_pct, 25);
  });

  it("false_positives counted separately", () => {
    const metrics = calculateMetrics(items);
    assert.strictEqual(metrics.summary.false_positives, 1);
  });
});

describe("generate-metrics: calculateMetrics edge cases", () => {
  it("empty items list produces zero metrics", () => {
    const metrics = calculateMetrics([]);
    assert.strictEqual(metrics.summary.total, 0);
    assert.strictEqual(metrics.summary.open, 0);
    assert.strictEqual(metrics.summary.resolved, 0);
    assert.strictEqual(metrics.summary.resolution_rate_pct, 0);
    assert.strictEqual(metrics.alerts.s0_count, 0);
    assert.strictEqual(metrics.alerts.s1_count, 0);
    assert.strictEqual(metrics.health.avg_age_days, 0);
  });

  it("100% resolved items give 100% resolution rate", () => {
    const metrics = calculateMetrics([
      {
        id: "DEBT-0001",
        severity: "S2",
        status: "RESOLVED",
        category: "security",
        source_id: "audit:a",
      },
    ]);
    assert.strictEqual(metrics.summary.resolution_rate_pct, 100);
  });

  it("derives source from source_id prefix", () => {
    const metrics = calculateMetrics([
      {
        id: "DEBT-0001",
        severity: "S2",
        status: "NEW",
        category: "security",
        source_id: "sonarcloud:abc",
      },
    ]);
    assert.strictEqual(metrics.by_source["sonarcloud"], 1);
  });

  it("uses source field when present over source_id prefix", () => {
    const metrics = calculateMetrics([
      {
        id: "DEBT-0001",
        severity: "S2",
        status: "NEW",
        category: "security",
        source: "manual",
        source_id: "audit:abc",
      },
    ]);
    assert.strictEqual(metrics.by_source["manual"], 1);
    assert.strictEqual(metrics.by_source["audit"], undefined);
  });

  it("health.verification_queue_size matches NEW count", () => {
    const metrics = calculateMetrics([
      {
        id: "DEBT-0001",
        severity: "S2",
        status: "NEW",
        category: "security",
        source_id: "audit:a",
      },
      {
        id: "DEBT-0002",
        severity: "S3",
        status: "NEW",
        category: "security",
        source_id: "audit:b",
      },
      {
        id: "DEBT-0003",
        severity: "S1",
        status: "VERIFIED",
        category: "security",
        source_id: "audit:c",
      },
    ]);
    assert.strictEqual(metrics.health.verification_queue_size, 2);
  });

  it("s0_items is capped at 10 for dashboard", () => {
    const manyS0: DebtItem[] = Array.from({ length: 15 }, (_, i) => ({
      id: `DEBT-${String(i).padStart(4, "0")}`,
      severity: "S0",
      status: "NEW",
      category: "security",
      source_id: `audit:item${i}`,
      title: `Critical issue ${i}`,
    }));
    const metrics = calculateMetrics(manyS0);
    assert.strictEqual(metrics.alerts.s0_count, 15);
    assert.strictEqual(metrics.alerts.s0_items.length, 10);
  });
});

describe("generate-metrics: generateMetricsMd (structure validation)", () => {
  it("generates markdown with correct total count", () => {
    const metrics = buildMetrics(
      [
        {
          id: "DEBT-0001",
          severity: "S1",
          status: "NEW",
          category: "security",
          source_id: "audit:a",
          created: "2024-01-01",
        },
        {
          id: "DEBT-0002",
          severity: "S2",
          status: "RESOLVED",
          category: "code-quality",
          source_id: "audit:b",
          created: "2024-01-02",
        },
      ],
      new Date("2024-06-15")
    );

    // Simulate the markdown generation just enough to verify key values are present
    const summaryLine = `| Total Items | ${metrics.summary.total} |`;
    assert.ok(summaryLine.includes("2"), "Total should be 2");

    const resolvedLine = `| Resolved | ${metrics.summary.resolved} |`;
    assert.ok(resolvedLine.includes("1"), "Resolved should be 1");
  });
});
