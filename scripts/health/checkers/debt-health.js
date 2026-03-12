/**
 * Debt Health Checker
 *
 * Metrics: s0_count, s1_count, total_open, avg_age_days,
 *          resolution_rate, intake_30d, resolved_30d, net_flow
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { scoreMetric } = require("../lib/scoring");
const { ROOT_DIR, safeParse, safeReadLines } = require("../lib/utils");

const BENCHMARKS = {
  s0_count: { good: 0, average: 0, poor: 1 },
  s1_count: { good: 0, average: 5, poor: 10 },
  total_open: { good: 10, average: 30, poor: 60 },
  avg_age_days: { good: 30, average: 90, poor: 180 },
  resolution_rate: { good: 50, average: 30, poor: 10 },
  intake_30d: { good: 5, average: 15, poor: 30 },
  resolved_30d: { good: 10, average: 5, poor: 0 },
  net_flow: { good: -5, average: 0, poor: 10 },
};

function checkDebtHealth() {
  const metrics = {};

  // Read metrics.json
  const metricsPath = path.join(ROOT_DIR, "docs", "technical-debt", "metrics.json");
  let metricsData;
  try {
    metricsData = safeParse(fs.readFileSync(metricsPath, "utf8"));
  } catch {
    return { metrics: {}, no_data: true };
  }

  if (!metricsData) return { metrics: {}, no_data: true };

  const s0 = metricsData.alerts?.s0_count || 0;
  const s1 = metricsData.alerts?.s1_count || 0;
  const open = metricsData.summary?.open || 0;
  const resRate = metricsData.summary?.resolution_rate_pct || 0;

  metrics.s0_count = {
    value: s0,
    ...scoreMetric(s0, BENCHMARKS.s0_count),
    benchmark: BENCHMARKS.s0_count,
  };
  metrics.s1_count = {
    value: s1,
    ...scoreMetric(s1, BENCHMARKS.s1_count),
    benchmark: BENCHMARKS.s1_count,
  };
  metrics.total_open = {
    value: open,
    ...scoreMetric(open, BENCHMARKS.total_open),
    benchmark: BENCHMARKS.total_open,
  };

  // Average age from MASTER_DEBT
  const debtPath = path.join(ROOT_DIR, "docs", "technical-debt", "MASTER_DEBT.jsonl");
  const debtLines = safeReadLines(debtPath);
  const allDebt = debtLines.map((l) => safeParse(l)).filter(Boolean);
  const openDebt = allDebt.filter((d) => d.status !== "resolved" && d.status !== "closed");

  let avgAge = 0;
  if (openDebt.length > 0) {
    const now = Date.now();
    const ages = openDebt
      .map((d) => {
        const created = new Date(d.created || d.date || "").getTime();
        return Number.isNaN(created) ? null : Math.floor((now - created) / (1000 * 60 * 60 * 24));
      })
      .filter((a) => a !== null);
    avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
  }
  metrics.avg_age_days = {
    value: avgAge,
    ...scoreMetric(avgAge, BENCHMARKS.avg_age_days),
    benchmark: BENCHMARKS.avg_age_days,
  };

  // Resolution rate
  const resRateScore = scoreMetric(resRate, BENCHMARKS.resolution_rate, "higher-is-better");
  metrics.resolution_rate = {
    value: resRate,
    ...resRateScore,
    benchmark: BENCHMARKS.resolution_rate,
  };

  // Intake 30d
  const intakePath = path.join(ROOT_DIR, "docs", "technical-debt", "logs", "intake-log.jsonl");
  const intakeLines = safeReadLines(intakePath);
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let intake30d = 0;
  for (const line of intakeLines) {
    const entry = safeParse(line);
    if (!entry) continue;
    const ts = new Date(entry.timestamp || entry.date || "").getTime();
    if (!Number.isNaN(ts) && ts >= thirtyDaysAgo) intake30d++;
  }
  metrics.intake_30d = {
    value: intake30d,
    ...scoreMetric(intake30d, BENCHMARKS.intake_30d),
    benchmark: BENCHMARKS.intake_30d,
  };

  // Resolved 30d
  const resPath = path.join(ROOT_DIR, "docs", "technical-debt", "logs", "resolution-log.jsonl");
  const resLines = safeReadLines(resPath);
  let resolved30d = 0;
  for (const line of resLines) {
    const entry = safeParse(line);
    if (!entry) continue;
    const ts = new Date(entry.timestamp || entry.date || "").getTime();
    if (!Number.isNaN(ts) && ts >= thirtyDaysAgo) resolved30d++;
  }
  metrics.resolved_30d = {
    value: resolved30d,
    ...scoreMetric(resolved30d, BENCHMARKS.resolved_30d, "higher-is-better"),
    benchmark: BENCHMARKS.resolved_30d,
  };

  // Net flow (intake - resolved, lower is better)
  const netFlow = intake30d - resolved30d;
  metrics.net_flow = {
    value: netFlow,
    ...scoreMetric(netFlow, BENCHMARKS.net_flow),
    benchmark: BENCHMARKS.net_flow,
  };

  return { metrics, no_data: false };
}

module.exports = { checkDebtHealth };
