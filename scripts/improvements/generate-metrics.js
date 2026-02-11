#!/usr/bin/env node
/* global __dirname */
/**
 * Generate Improvement Metrics for Dashboard Integration
 *
 * Reads: docs/improvements/MASTER_IMPROVEMENTS.jsonl
 * Outputs:
 *   - docs/improvements/METRICS.md (human-readable summary)
 *   - docs/improvements/metrics.json (machine-readable for dashboard)
 *
 * Usage:
 *   node scripts/improvements/generate-metrics.js [--verbose]
 *
 * This script should be run:
 *   - At session-end (via hook)
 *   - At session-start (failsafe if session-end was missed)
 *   - Manually when needed
 */

const fs = require("node:fs");
const path = require("node:path");

const BASE_DIR = path.join(__dirname, "../../docs/improvements");
const MASTER_FILE = path.join(BASE_DIR, "MASTER_IMPROVEMENTS.jsonl");
const METRICS_JSON = path.join(BASE_DIR, "metrics.json");
const METRICS_MD = path.join(BASE_DIR, "METRICS.md");
const LOG_DIR = path.join(BASE_DIR, "logs");
const METRICS_LOG = path.join(LOG_DIR, "metrics-log.jsonl");

const verbose = process.argv.includes("--verbose");

// Symlink guard: refuse to write through symlinks (Review #291 R9)
function assertNotSymlink(filePath) {
  try {
    if (fs.lstatSync(filePath).isSymbolicLink()) {
      throw new Error(`Refusing to write to symlink: ${filePath}`);
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.code === "ENOENT") return;
      if (err.code === "EACCES" || err.code === "EPERM") {
        throw new Error(`Refusing to write when symlink check is blocked: ${filePath}`);
      }
      if (err.message.includes("Refusing to write")) throw err;
    }
    // Fail closed: rethrow any unexpected errors (Review #292 R10)
    throw err;
  }
}

// Format date for display
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// Load items from MASTER_IMPROVEMENTS.jsonl
function loadMasterImprovements() {
  if (!fs.existsSync(MASTER_FILE)) {
    console.error(`Master file not found: ${MASTER_FILE}`);
    process.exit(1);
  }

  // Wrap readFileSync in try/catch (existsSync doesn't guarantee read success)
  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to read master file: ${errMsg}`);
    process.exit(1);
  }

  const lines = content.split("\n").filter((line) => line.trim());
  const items = [];
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      items.push(JSON.parse(lines[i]));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push({ line: i + 1, error: errMsg });
    }
  }

  if (errors.length > 0 && verbose) {
    console.warn(`${errors.length} parse errors in MASTER_IMPROVEMENTS.jsonl`);
  }

  return items;
}

/**
 * Check if an item is open (not IMPLEMENTED and not DECLINED)
 */
function isOpenItem(item) {
  return item.status !== "IMPLEMENTED" && item.status !== "DECLINED";
}

/**
 * Track alert items for I0/I1 impact items that are PROPOSED or ACCEPTED
 * (not yet implemented, actively needing attention)
 *
 * @param {object} item - Improvement item
 * @param {object} alerts - Alerts accumulator with i0 and i1 arrays
 */
function trackAlertItem(item, alerts) {
  if (item.status !== "PROPOSED" && item.status !== "ACCEPTED") return;

  const alertEntry = {
    id: item.id,
    title: item.title?.substring(0, 60) || "No title",
    file: item.file || null,
    line: item.line || null,
  };

  if (item.impact === "I0") {
    alerts.i0.push(alertEntry);
  } else if (item.impact === "I1") {
    alerts.i1.push(alertEntry);
  }
}

/**
 * Calculate age in days for an open item, updating age tracking state
 * Returns early for non-open items, invalid timestamps, or future dates
 *
 * @param {object} item - Improvement item
 * @param {Date} now - Current date
 * @param {object} ageState - Mutable state: { totalAgeDays, openCount, oldestAge, oldestItem }
 */
function trackItemAge(item, now, ageState) {
  if (!isOpenItem(item)) return;

  const createdValue = item.created;
  if (!createdValue) return;

  const createdMs = new Date(createdValue).getTime();
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
  const byStatus = {
    PROPOSED: 0,
    ACCEPTED: 0,
    DECLINED: 0,
    DEFERRED: 0,
    IMPLEMENTED: 0,
    STALE: 0,
  };
  const byImpact = { I0: 0, I1: 0, I2: 0, I3: 0 };
  const byCategory = {};
  const alerts = { i0: [], i1: [] };
  const ageState = { totalAgeDays: 0, openCount: 0, oldestAge: 0, oldestItem: null };

  for (const item of items) {
    byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    byImpact[item.impact] = (byImpact[item.impact] || 0) + 1;
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;

    trackAlertItem(item, alerts);
    trackItemAge(item, now, ageState);
  }

  // Calculate derived metrics
  const totalItems = items.length;
  const implementedItems = byStatus.IMPLEMENTED || 0;
  const declinedItems = byStatus.DECLINED || 0;
  const openItems = totalItems - implementedItems - declinedItems;
  const avgAgeDays =
    ageState.openCount > 0 ? Math.round(ageState.totalAgeDays / ageState.openCount) : 0;
  const resolutionRate = totalItems > 0 ? Math.round((implementedItems / totalItems) * 100) : 0;

  return {
    generated: now.toISOString(),
    generated_date: today,
    summary: {
      total: totalItems,
      open: openItems,
      implemented: implementedItems,
      declined: declinedItems,
      resolution_rate_pct: resolutionRate,
    },
    by_status: byStatus,
    by_impact: byImpact,
    by_category: byCategory,
    alerts: {
      i0_count: alerts.i0.length,
      i1_count: alerts.i1.length,
      i0_items: alerts.i0.slice(0, 10), // Limit to 10 for dashboard
      i1_items: alerts.i1.slice(0, 10),
    },
    health: {
      review_queue_size: byStatus.PROPOSED || 0,
      avg_age_days: avgAgeDays,
      oldest_age_days: ageState.oldestAge,
      oldest_item_id: ageState.oldestItem?.id || null,
    },
  };
}

// Format alert item location string, omitting file:line when absent
function formatAlertLocation(item) {
  if (item.file && item.line) return ` (${item.file}:${item.line})`;
  if (item.file) return ` (${item.file})`;
  return "";
}

// Generate METRICS.md
function generateMetricsMd(metrics) {
  const header = `# Improvement Metrics

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** ${metrics.generated_date}
**Status:** ACTIVE
**Auto-Generated:** This file is auto-generated by \`scripts/improvements/generate-metrics.js\`
<!-- prettier-ignore-end -->

---

## Purpose

This document provides a real-time dashboard of improvement metrics for the
sonash-v0 project. It is automatically regenerated during session-end and CI
pipelines to track improvement proposals, implementation progress, and impact
distribution.

---

## Version History

| Version | Date       | Changes                  |
| ------- | ---------- | ------------------------ |
| 1.0     | 2026-02-11 | Initial metrics tracking |

---

`;

  let content = header;

  // Summary section
  content += `## Summary

| Metric | Value |
|--------|-------|
| Total Items | ${metrics.summary.total} |
| Open Items | ${metrics.summary.open} |
| Implemented | ${metrics.summary.implemented} |
| Declined | ${metrics.summary.declined} |
| Resolution Rate | ${metrics.summary.resolution_rate_pct}% |

---

## By Status

| Status | Count |
|--------|-------|
| PROPOSED | ${metrics.by_status.PROPOSED || 0} |
| ACCEPTED | ${metrics.by_status.ACCEPTED || 0} |
| DECLINED | ${metrics.by_status.DECLINED || 0} |
| DEFERRED | ${metrics.by_status.DEFERRED || 0} |
| IMPLEMENTED | ${metrics.by_status.IMPLEMENTED || 0} |
| STALE | ${metrics.by_status.STALE || 0} |

---

## By Impact

| Impact | Count | % of Total |
|--------|-------|------------|
| I0 (Transformative) | ${metrics.by_impact.I0 || 0} | ${metrics.summary.total > 0 ? Math.round(((metrics.by_impact.I0 || 0) / metrics.summary.total) * 100) : 0}% |
| I1 (Significant) | ${metrics.by_impact.I1 || 0} | ${metrics.summary.total > 0 ? Math.round(((metrics.by_impact.I1 || 0) / metrics.summary.total) * 100) : 0}% |
| I2 (Moderate) | ${metrics.by_impact.I2 || 0} | ${metrics.summary.total > 0 ? Math.round(((metrics.by_impact.I2 || 0) / metrics.summary.total) * 100) : 0}% |
| I3 (Minor) | ${metrics.by_impact.I3 || 0} | ${metrics.summary.total > 0 ? Math.round(((metrics.by_impact.I3 || 0) / metrics.summary.total) * 100) : 0}% |

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

### I0 Transformative Alerts (${metrics.alerts.i0_count})

${
  metrics.alerts.i0_items.length > 0
    ? metrics.alerts.i0_items
        .map((item) => `- **${item.id}**: ${item.title}${formatAlertLocation(item)}`)
        .join("\n")
    : "_No I0 alerts_"
}

### I1 Significant Alerts (${metrics.alerts.i1_count})

${
  metrics.alerts.i1_items.length > 0
    ? metrics.alerts.i1_items
        .map((item) => `- **${item.id}**: ${item.title}${formatAlertLocation(item)}`)
        .join("\n")
    : "_No I1 alerts_"
}
${metrics.alerts.i1_count > 10 ? `\n_...and ${metrics.alerts.i1_count - 10} more I1 items_` : ""}

---

## Health Metrics

| Metric | Value |
|--------|-------|
| Review Queue | ${metrics.health.review_queue_size} items |
| Avg Age (Open Items) | ${metrics.health.avg_age_days} days |
| Oldest Item Age | ${metrics.health.oldest_age_days} days |
| Oldest Item | ${metrics.health.oldest_item_id || "N/A"} |

---

**Machine-Readable:** See \`metrics.json\` for dashboard integration.

**Canonical Source:** \`MASTER_IMPROVEMENTS.jsonl\`
`;

  return content;
}

// Log metrics generation
// Guard metrics log writes to prevent crashes after successful metric generation
function logMetricsGeneration(metrics) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const logEntry = {
      timestamp: metrics.generated,
      total: metrics.summary.total,
      open: metrics.summary.open,
      implemented: metrics.summary.implemented,
      i0_alerts: metrics.alerts.i0_count,
      i1_alerts: metrics.alerts.i1_count,
    };

    // Explicit utf8 encoding for consistent output
    assertNotSymlink(METRICS_LOG);
    fs.appendFileSync(METRICS_LOG, JSON.stringify(logEntry) + "\n", "utf8");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(`Failed to write metrics log: ${errMsg}`);
  }
}

// Main function
function main() {
  console.log("Generating Improvement Metrics...\n");

  // Load items
  const items = loadMasterImprovements();
  console.log(`  Loaded ${items.length} items from MASTER_IMPROVEMENTS.jsonl`);

  // Calculate metrics
  const metrics = calculateMetrics(items);

  // Handle write failures gracefully
  // Ensure output directory exists before writes
  try {
    fs.mkdirSync(BASE_DIR, { recursive: true });

    // Atomic write metrics.json (Review #292 R10)
    assertNotSymlink(METRICS_JSON);
    const tmpMetricsJson = METRICS_JSON + `.tmp.${process.pid}`;
    try {
      assertNotSymlink(tmpMetricsJson);
      fs.writeFileSync(tmpMetricsJson, JSON.stringify(metrics, null, 2) + "\n", {
        encoding: "utf8",
        flag: "wx",
      });
      fs.renameSync(tmpMetricsJson, METRICS_JSON);
      console.log(`  Written: ${METRICS_JSON}`);
    } finally {
      if (fs.existsSync(tmpMetricsJson)) {
        try {
          fs.unlinkSync(tmpMetricsJson);
        } catch {
          /* ignore cleanup errors */
        }
      }
    }

    // Atomic write METRICS.md (Review #292 R10)
    assertNotSymlink(METRICS_MD);
    const tmpMetricsMd = METRICS_MD + `.tmp.${process.pid}`;
    try {
      assertNotSymlink(tmpMetricsMd);
      const metricsMd = generateMetricsMd(metrics);
      fs.writeFileSync(tmpMetricsMd, metricsMd, { encoding: "utf8", flag: "wx" });
      fs.renameSync(tmpMetricsMd, METRICS_MD);
      console.log(`  Written: ${METRICS_MD}`);
    } finally {
      if (fs.existsSync(tmpMetricsMd)) {
        try {
          fs.unlinkSync(tmpMetricsMd);
        } catch {
          /* ignore cleanup errors */
        }
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to write metrics files: ${errMsg}`);
    process.exit(2);
  }

  // Log generation
  logMetricsGeneration(metrics);

  // Summary output
  console.log(`\nMetrics Summary:`);
  console.log(`   Total: ${metrics.summary.total} items`);
  console.log(`   Open: ${metrics.summary.open} | Implemented: ${metrics.summary.implemented}`);
  console.log(`   I0 Alerts: ${metrics.alerts.i0_count} | I1 Alerts: ${metrics.alerts.i1_count}`);

  if (metrics.alerts.i0_count > 0) {
    console.log(`\n   I0 Transformative Items Require Attention!`);
  }

  console.log(`\nMetrics generated successfully!`);
}

main();
