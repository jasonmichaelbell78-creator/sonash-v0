#!/usr/bin/env node
/* global __dirname */
/**
 * Generate TDMS Metrics for Dashboard Integration
 *
 * Reads: docs/technical-debt/MASTER_DEBT.jsonl
 * Outputs:
 *   - docs/technical-debt/METRICS.md (human-readable summary)
 *   - docs/technical-debt/metrics.json (machine-readable for dashboard)
 *
 * Usage:
 *   node scripts/debt/generate-metrics.js [--verbose]
 *
 * This script should be run:
 *   - At session-end (via hook)
 *   - At session-start (failsafe if session-end was missed)
 *   - Manually when needed
 */

const fs = require("node:fs");
const path = require("node:path");

const BASE_DIR = path.join(__dirname, "../../docs/technical-debt");
const MASTER_FILE = path.join(BASE_DIR, "MASTER_DEBT.jsonl");
const METRICS_JSON = path.join(BASE_DIR, "metrics.json");
const METRICS_MD = path.join(BASE_DIR, "METRICS.md");
const LOG_DIR = path.join(BASE_DIR, "logs");
const METRICS_LOG = path.join(LOG_DIR, "metrics-log.jsonl");

const verbose = process.argv.includes("--verbose");

// Format date for display
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// Load items from MASTER_DEBT.jsonl
function loadMasterDebt() {
  if (!fs.existsSync(MASTER_FILE)) {
    console.error(`❌ Master file not found: ${MASTER_FILE}`);
    process.exit(1);
  }

  // Review #224: Wrap readFileSync in try/catch (existsSync doesn't guarantee read success)
  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Failed to read master file: ${errMsg}`);
    process.exit(1);
  }

  const lines = content.split("\n").filter((line) => line.trim());
  const items = [];
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      items.push(JSON.parse(lines[i]));
    } catch (err) {
      // Review #224: Safe error message access
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push({ line: i + 1, error: errMsg });
    }
  }

  if (errors.length > 0 && verbose) {
    console.warn(`⚠️ ${errors.length} parse errors in MASTER_DEBT.jsonl`);
  }

  return items;
}

/**
 * Check if an item is unresolved (not RESOLVED or FALSE_POSITIVE)
 */
function isOpenItem(item) {
  return item.status !== "RESOLVED" && item.status !== "FALSE_POSITIVE";
}

/**
 * Track alert items for unresolved S0/S1 severity
 *
 * @param {object} item - Debt item
 * @param {object} alerts - Alerts accumulator with s0 and s1 arrays
 */
function trackAlertItem(item, alerts) {
  if (!isOpenItem(item)) return;

  const alertEntry = {
    id: item.id,
    title: item.title?.substring(0, 60) || "No title",
    file: item.file,
    line: item.line,
  };

  if (item.severity === "S0") {
    alerts.s0.push(alertEntry);
  } else if (item.severity === "S1") {
    alerts.s1.push(alertEntry);
  }
}

/**
 * Calculate age in days for an open item, updating age tracking state
 * Returns early for resolved items, invalid timestamps, or future dates
 *
 * @param {object} item - Debt item
 * @param {Date} now - Current date
 * @param {object} ageState - Mutable state: { totalAgeDays, openCount, oldestAge, oldestItem }
 */
function trackItemAge(item, now, ageState) {
  if (!isOpenItem(item)) return;
  if (!item.created) return;

  const createdMs = new Date(item.created).getTime();
  if (!Number.isFinite(createdMs)) return;

  const ageDays = Math.floor((now.getTime() - createdMs) / (1000 * 60 * 60 * 24));
  if (ageDays < 0) return; // Prevent negative age metrics (future timestamps)

  ageState.totalAgeDays += ageDays;
  ageState.openCount++;
  if (ageDays > ageState.oldestAge) {
    ageState.oldestAge = ageDays;
    ageState.oldestItem = item;
  }
}

// Calculate metrics
function calculateMetrics(items) {
  const now = new Date();
  const today = formatDate(now);

  // Initialize counters
  const byStatus = { NEW: 0, VERIFIED: 0, IN_PROGRESS: 0, RESOLVED: 0, FALSE_POSITIVE: 0 };
  const bySeverity = { S0: 0, S1: 0, S2: 0, S3: 0 };
  const byCategory = {};
  const bySource = {};
  const alerts = { s0: [], s1: [] };
  const ageState = { totalAgeDays: 0, openCount: 0, oldestAge: 0, oldestItem: null };

  for (const item of items) {
    byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    // Derive source from source_id prefix (e.g. "intake:xxx" -> "intake", "sonar:xxx" -> "sonar")
    const itemSource =
      item.source ||
      (item.source_id && item.source_id.includes(":") ? item.source_id.split(":")[0] : null) ||
      "unknown";
    bySource[itemSource] = (bySource[itemSource] || 0) + 1;

    trackAlertItem(item, alerts);
    trackItemAge(item, now, ageState);
  }

  // Calculate derived metrics
  const totalItems = items.length;
  const resolvedItems = byStatus.RESOLVED || 0;
  const openItems = totalItems - resolvedItems - (byStatus.FALSE_POSITIVE || 0);
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
      false_positives: byStatus.FALSE_POSITIVE || 0,
      resolution_rate_pct: resolutionRate,
    },
    by_status: byStatus,
    by_severity: bySeverity,
    by_category: byCategory,
    by_source: bySource,
    alerts: {
      s0_count: alerts.s0.length,
      s1_count: alerts.s1.length,
      s0_items: alerts.s0.slice(0, 10), // Limit to 10 for dashboard
      s1_items: alerts.s1.slice(0, 10),
    },
    health: {
      avg_age_days: avgAgeDays,
      oldest_age_days: ageState.oldestAge,
      oldest_item_id: ageState.oldestItem?.id || null,
      verification_queue_size: byStatus.NEW || 0,
    },
  };
}

// Generate METRICS.md
function generateMetricsMd(metrics) {
  const header = `# Technical Debt Metrics

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** ${metrics.generated_date}
**Status:** ACTIVE
**Auto-Generated:** This file is auto-generated by \`scripts/debt/generate-metrics.js\`
<!-- prettier-ignore-end -->

---

## Purpose

This document provides a real-time dashboard of technical debt metrics for the
sonash-v0 project. It is automatically regenerated during session-end and CI
pipelines to track debt accumulation, resolution progress, and severity
distribution.

---

## Version History

| Version | Date       | Changes                  |
| ------- | ---------- | ------------------------ |
| 1.0     | 2026-01-15 | Initial metrics tracking |

---

`;

  let content = header;

  // Summary section
  content += `## Summary

| Metric | Value |
|--------|-------|
| Total Items | ${metrics.summary.total} |
| Open Items | ${metrics.summary.open} |
| Resolved | ${metrics.summary.resolved} |
| False Positives | ${metrics.summary.false_positives} |
| Resolution Rate | ${metrics.summary.resolution_rate_pct}% |

---

## By Status

| Status | Count |
|--------|-------|
| NEW | ${metrics.by_status.NEW || 0} |
| VERIFIED | ${metrics.by_status.VERIFIED || 0} |
| IN_PROGRESS | ${metrics.by_status.IN_PROGRESS || 0} |
| RESOLVED | ${metrics.by_status.RESOLVED || 0} |
| FALSE_POSITIVE | ${metrics.by_status.FALSE_POSITIVE || 0} |

---

## By Severity

| Severity | Count | % of Total |
|----------|-------|------------|
| S0 (Critical) | ${metrics.by_severity.S0 || 0} | ${metrics.summary.total > 0 ? Math.round(((metrics.by_severity.S0 || 0) / metrics.summary.total) * 100) : 0}% |
| S1 (High) | ${metrics.by_severity.S1 || 0} | ${metrics.summary.total > 0 ? Math.round(((metrics.by_severity.S1 || 0) / metrics.summary.total) * 100) : 0}% |
| S2 (Medium) | ${metrics.by_severity.S2 || 0} | ${metrics.summary.total > 0 ? Math.round(((metrics.by_severity.S2 || 0) / metrics.summary.total) * 100) : 0}% |
| S3 (Low) | ${metrics.by_severity.S3 || 0} | ${metrics.summary.total > 0 ? Math.round(((metrics.by_severity.S3 || 0) / metrics.summary.total) * 100) : 0}% |

---

## By Category

| Category | Count |
|----------|-------|
${Object.entries(metrics.by_category)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, count]) => `| ${cat} | ${count} |`)
  .join("\n")}

---

## Alerts

### S0 Critical Alerts (${metrics.alerts.s0_count})

${
  metrics.alerts.s0_items.length > 0
    ? metrics.alerts.s0_items
        .map((item) => `- **${item.id}**: ${item.title} (${item.file}:${item.line})`)
        .join("\n")
    : "_No S0 alerts_"
}

### S1 High Priority Alerts (${metrics.alerts.s1_count})

${
  metrics.alerts.s1_items.length > 0
    ? metrics.alerts.s1_items
        .map((item) => `- **${item.id}**: ${item.title} (${item.file}:${item.line})`)
        .join("\n")
    : "_No S1 alerts_"
}
${metrics.alerts.s1_count > 10 ? `\n_...and ${metrics.alerts.s1_count - 10} more S1 items_` : ""}

---

## Health Metrics

| Metric | Value |
|--------|-------|
| Verification Queue | ${metrics.health.verification_queue_size} items |
| Avg Age (Open Items) | ${metrics.health.avg_age_days} days |
| Oldest Item Age | ${metrics.health.oldest_age_days} days |
| Oldest Item | ${metrics.health.oldest_item_id || "N/A"} |

---

## Data Sources

| Source | Count |
|--------|-------|
${Object.entries(metrics.by_source)
  .sort((a, b) => b[1] - a[1])
  .map(([source, count]) => `| ${source} | ${count} |`)
  .join("\n")}

---

**Machine-Readable:** See \`metrics.json\` for dashboard integration.

**Canonical Source:** \`MASTER_DEBT.jsonl\`
`;

  return content;
}

// Log metrics generation
// Qodo R9: Guard metrics log writes to prevent crashes after successful metric generation
function logMetricsGeneration(metrics) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const logEntry = {
      timestamp: metrics.generated,
      total: metrics.summary.total,
      open: metrics.summary.open,
      resolved: metrics.summary.resolved,
      s0_alerts: metrics.alerts.s0_count,
      s1_alerts: metrics.alerts.s1_count,
    };

    // Qodo R15: Explicit utf8 encoding for consistent output
    fs.appendFileSync(METRICS_LOG, JSON.stringify(logEntry) + "\n", "utf8");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️ Failed to write metrics log: ${errMsg}`);
  }
}

// Main function
function main() {
  console.log("📊 Generating TDMS Metrics...\n");

  // Load items
  const items = loadMasterDebt();
  console.log(`  Loaded ${items.length} items from MASTER_DEBT.jsonl`);

  // Calculate metrics
  const metrics = calculateMetrics(items);

  // Review #224 Qodo R7: Handle write failures gracefully
  // Qodo R10: Ensure output directory exists before writes
  try {
    fs.mkdirSync(BASE_DIR, { recursive: true });

    // Write metrics.json
    fs.writeFileSync(METRICS_JSON, JSON.stringify(metrics, null, 2) + "\n");
    console.log(`  ✅ ${METRICS_JSON}`);

    // Write METRICS.md
    const metricsMd = generateMetricsMd(metrics);
    fs.writeFileSync(METRICS_MD, metricsMd);
    console.log(`  ✅ ${METRICS_MD}`);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Failed to write metrics files: ${errMsg}`);
    process.exit(2);
  }

  // Log generation
  logMetricsGeneration(metrics);

  // Summary output
  console.log(`\n📊 Metrics Summary:`);
  console.log(`   Total: ${metrics.summary.total} items`);
  console.log(`   Open: ${metrics.summary.open} | Resolved: ${metrics.summary.resolved}`);
  console.log(`   S0 Alerts: ${metrics.alerts.s0_count} | S1 Alerts: ${metrics.alerts.s1_count}`);

  if (metrics.alerts.s0_count > 0) {
    console.log(`\n🚨 S0 Critical Items Require Attention!`);
  }

  console.log(`\n✅ Metrics generated successfully!`);
}

main();
