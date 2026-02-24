/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Metrics & Reporting Checker — Categories D5 (Domain 5)
 *
 * 1. View Generation Accuracy
 * 2. Metrics Dashboard Correctness
 * 3. Audit Trail Completeness
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[metrics-reporting] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "metrics_reporting";

// Max file size guard (20 MB)
const MAX_FILE_BYTES = 20 * 1024 * 1024;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely read a file, returning null on any failure.
 * @param {string} filePath
 * @returns {string|null}
 */
function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_BYTES) return null;
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

/**
 * Parse JSONL content into an array of objects.
 * Returns { items: object[], invalidCount: number }.
 * @param {string} content
 * @returns {{ items: object[], invalidCount: number }}
 */
function parseJsonl(content) {
  const items = [];
  let invalidCount = 0;
  const lines = content
    .split("\n")
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.trim().length > 0);

  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch {
      invalidCount++;
    }
  }
  return { items, invalidCount };
}

/**
 * Extract section counts from a view markdown file.
 * Views use headers like: ## S0 - Critical (36), ## ai-optimization (127), ## NEW (992)
 * Returns a map of lowercase-key -> count.
 * @param {string} content
 * @returns {Object<string, number>}
 */
function extractViewCounts(content) {
  const counts = {};
  const lines = content.split("\n");
  // Match headers: ## <anything> (<count>)
  const headerRe = /^##\s+(.+?)\s+\((\d+)\)\s*$/;

  for (const line of lines) {
    const m = line.match(headerRe);
    if (m) {
      const key = m[1].trim().toLowerCase();
      const count = parseInt(m[2], 10);
      counts[key] = count;
    }
  }
  return counts;
}

/**
 * Extract table row values from METRICS.md markdown tables.
 * Returns a map of lowercase-metric-name -> value-string.
 * @param {string} content
 * @returns {Object<string, string>}
 */
function extractMetricsTable(content) {
  const metrics = {};
  const lines = content.split("\n");

  for (const line of lines) {
    // Match table rows: | Key | Value |
    const m = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|?\s*$/);
    if (m) {
      const key = m[1].trim().toLowerCase();
      const value = m[2].trim();
      // Skip header separator rows
      if (key.indexOf("---") === -1 && key.indexOf("===") === -1) {
        metrics[key] = value;
      }
    }
  }
  return metrics;
}

// ── Severity mapping from MASTER_DEBT fields ─────────────────────────────────

/**
 * Normalize severity value to standard form (S0, S1, S2, S3).
 * @param {string} sev
 * @returns {string}
 */
function normalizeSeverity(sev) {
  if (!sev || typeof sev !== "string") return "unknown";
  const s = sev.trim().toUpperCase();
  if (s === "S0" || s === "CRITICAL") return "S0";
  if (s === "S1" || s === "HIGH") return "S1";
  if (s === "S2" || s === "MEDIUM") return "S2";
  if (s === "S3" || s === "LOW") return "S3";
  return s;
}

/**
 * Normalize status value.
 * @param {string} status
 * @returns {string}
 */
function normalizeStatus(status) {
  if (!status || typeof status !== "string") return "UNKNOWN";
  return status.trim().toUpperCase();
}

// ── Category 1: View Generation Accuracy ─────────────────────────────────────

function checkViewGenerationAccuracy(rootDir, findings) {
  const bench = BENCHMARKS.view_generation_accuracy;
  const debtPath = path.join(rootDir, "docs", "technical-debt", "MASTER_DEBT.jsonl");
  const viewsDir = path.join(rootDir, "docs", "technical-debt", "views");

  // Check file size guard
  let debtStat;
  try {
    debtStat = fs.statSync(debtPath);
  } catch {
    findings.push({
      id: "TMR-100",
      category: "view_generation_accuracy",
      domain: DOMAIN,
      severity: "error",
      message: "MASTER_DEBT.jsonl not found — cannot verify view accuracy",
      details: "The master debt file is missing. All view comparisons are impossible.",
      frequency: 1,
      blastRadius: 5,
    });
    return { score: 0, rating: "poor", metrics: { reason: "master_debt_missing" } };
  }

  if (debtStat.size > MAX_FILE_BYTES) {
    findings.push({
      id: "TMR-101",
      category: "view_generation_accuracy",
      domain: DOMAIN,
      severity: "warning",
      message: `MASTER_DEBT.jsonl exceeds 20MB (${(debtStat.size / (1024 * 1024)).toFixed(1)}MB) — skipping`,
      details: "File is too large to parse safely. Consider archiving resolved items.",
      frequency: 1,
      blastRadius: 3,
    });
    return { score: 0, rating: "poor", metrics: { reason: "file_too_large" } };
  }

  const debtContent = safeReadFile(debtPath);
  if (!debtContent) {
    findings.push({
      id: "TMR-102",
      category: "view_generation_accuracy",
      domain: DOMAIN,
      severity: "error",
      message: "MASTER_DEBT.jsonl unreadable",
      details: "Could not read the master debt file despite it existing on disk.",
      frequency: 1,
      blastRadius: 5,
    });
    return { score: 0, rating: "poor", metrics: { reason: "unreadable" } };
  }

  const { items: debtItems } = parseJsonl(debtContent);
  if (debtItems.length === 0) {
    findings.push({
      id: "TMR-103",
      category: "view_generation_accuracy",
      domain: DOMAIN,
      severity: "warning",
      message: "MASTER_DEBT.jsonl is empty — no items to compare",
      details: "The file parsed with zero valid items.",
      frequency: 1,
      blastRadius: 3,
    });
    return { score: 100, rating: "good", metrics: { reason: "empty_source" } };
  }

  // Compute actual counts from MASTER_DEBT
  const actualBySeverity = {};
  const actualByCategory = {};
  const actualByStatus = {};

  for (const item of debtItems) {
    const sev = normalizeSeverity(item.severity);
    actualBySeverity[sev] = (actualBySeverity[sev] || 0) + 1;

    const cat = (item.category || "uncategorized").toLowerCase().trim();
    actualByCategory[cat] = (actualByCategory[cat] || 0) + 1;

    const status = normalizeStatus(item.status);
    actualByStatus[status] = (actualByStatus[status] || 0) + 1;
  }

  let totalViews = 0;
  let matchingCounts = 0;
  const discrepancies = [];

  // ── by-severity.md ──
  const sevViewPath = path.join(viewsDir, "by-severity.md");
  const sevContent = safeReadFile(sevViewPath);
  if (sevContent) {
    const viewCounts = extractViewCounts(sevContent);

    // Map severity display names to our keys
    // View headers look like: "s0 - critical", "s1 - high", "s2 - medium", "s3 - low"
    const sevMapping = {
      S0: ["s0 - critical", "s0", "critical"],
      S1: ["s1 - high", "s1", "high"],
      S2: ["s2 - medium", "s2", "medium"],
      S3: ["s3 - low", "s3", "low"],
    };

    for (const [sevKey, aliases] of Object.entries(sevMapping)) {
      const actual = actualBySeverity[sevKey] || 0;
      let viewCount = null;

      for (const alias of aliases) {
        if (viewCounts[alias] !== undefined) {
          viewCount = viewCounts[alias];
          break;
        }
      }

      if (viewCount !== null) {
        totalViews++;
        if (viewCount === actual) {
          matchingCounts++;
        } else {
          discrepancies.push({
            view: "by-severity.md",
            key: sevKey,
            expected: actual,
            found: viewCount,
          });
        }
      }
    }
  } else {
    findings.push({
      id: "TMR-110",
      category: "view_generation_accuracy",
      domain: DOMAIN,
      severity: "warning",
      message: "by-severity.md view file not found or unreadable",
      details: `Expected at: ${sevViewPath}`,
      frequency: 1,
      blastRadius: 2,
    });
  }

  // ── by-category.md ──
  const catViewPath = path.join(viewsDir, "by-category.md");
  const catContent = safeReadFile(catViewPath);
  if (catContent) {
    const viewCounts = extractViewCounts(catContent);

    // Compare all categories found in the view
    const allCatKeys = new Set([...Object.keys(actualByCategory), ...Object.keys(viewCounts)]);

    for (const key of allCatKeys) {
      const actual = actualByCategory[key] || 0;
      const viewCount = viewCounts[key];

      if (viewCount !== undefined) {
        totalViews++;
        if (viewCount === actual) {
          matchingCounts++;
        } else {
          discrepancies.push({
            view: "by-category.md",
            key,
            expected: actual,
            found: viewCount,
          });
        }
      }
    }
  } else {
    findings.push({
      id: "TMR-111",
      category: "view_generation_accuracy",
      domain: DOMAIN,
      severity: "warning",
      message: "by-category.md view file not found or unreadable",
      details: `Expected at: ${catViewPath}`,
      frequency: 1,
      blastRadius: 2,
    });
  }

  // ── by-status.md ──
  const statusViewPath = path.join(viewsDir, "by-status.md");
  const statusContent = safeReadFile(statusViewPath);
  if (statusContent) {
    const viewCounts = extractViewCounts(statusContent);

    const allStatusKeys = new Set([
      ...Object.keys(actualByStatus).map((k) => k.toLowerCase()),
      ...Object.keys(viewCounts),
    ]);

    for (const key of allStatusKeys) {
      const actual = actualByStatus[key.toUpperCase()] || 0;
      const viewCount = viewCounts[key];

      if (viewCount !== undefined) {
        totalViews++;
        if (viewCount === actual) {
          matchingCounts++;
        } else {
          discrepancies.push({
            view: "by-status.md",
            key,
            expected: actual,
            found: viewCount,
          });
        }
      }
    }
  } else {
    findings.push({
      id: "TMR-112",
      category: "view_generation_accuracy",
      domain: DOMAIN,
      severity: "warning",
      message: "by-status.md view file not found or unreadable",
      details: `Expected at: ${statusViewPath}`,
      frequency: 1,
      blastRadius: 2,
    });
  }

  // Report discrepancies
  if (discrepancies.length > 0) {
    // Group by view file for cleaner reporting
    const byView = {};
    for (const d of discrepancies) {
      if (!byView[d.view]) byView[d.view] = [];
      byView[d.view].push(d);
    }

    for (const [viewFile, diffs] of Object.entries(byView)) {
      const diffSummary = diffs
        .map((d) => `${d.key}: view=${d.found} actual=${d.expected}`)
        .join("; ");

      findings.push({
        id: "TMR-113",
        category: "view_generation_accuracy",
        domain: DOMAIN,
        severity: diffs.length > 3 ? "error" : "warning",
        message: `View ${viewFile} has ${diffs.length} count discrepanc${diffs.length === 1 ? "y" : "ies"} vs MASTER_DEBT.jsonl`,
        details: `Mismatches: ${diffSummary.slice(0, 300)}`,
        frequency: diffs.length,
        blastRadius: 3,
        patchType: "command",
        patchTarget: "scripts/debt/generate-views.js",
        patchContent: "node scripts/debt/generate-views.js",
        patchImpact: "Regenerate views from current MASTER_DEBT.jsonl",
      });
    }
  }

  const accuracyPct = totalViews > 0 ? Math.round((matchingCounts / totalViews) * 100) : 100;

  const result = scoreMetric(accuracyPct, bench.accuracy_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalViews,
      matchingCounts,
      accuracyPct,
      discrepancies: discrepancies.length,
      masterDebtItems: debtItems.length,
    },
  };
}

// ── Category 2: Metrics Dashboard Correctness ────────────────────────────────

function checkMetricsDashboardCorrectness(rootDir, findings) {
  const bench = BENCHMARKS.metrics_dashboard_correctness;
  const debtPath = path.join(rootDir, "docs", "technical-debt", "MASTER_DEBT.jsonl");
  const metricsPath = path.join(rootDir, "docs", "technical-debt", "METRICS.md");
  const metricsLogPath = path.join(rootDir, "docs", "technical-debt", "logs", "metrics-log.jsonl");

  // Read MASTER_DEBT
  const debtContent = safeReadFile(debtPath);
  if (!debtContent) {
    findings.push({
      id: "TMR-200",
      category: "metrics_dashboard_correctness",
      domain: DOMAIN,
      severity: "error",
      message: "MASTER_DEBT.jsonl missing or unreadable — cannot verify metrics",
      details: "Cannot recompute metrics without the source data file.",
      frequency: 1,
      blastRadius: 5,
    });
    return { score: 0, rating: "poor", metrics: { reason: "master_debt_unavailable" } };
  }

  const { items: debtItems } = parseJsonl(debtContent);

  // Recompute metrics from MASTER_DEBT
  const computed = {
    totalItems: debtItems.length,
    bySeverity: {},
    byStatus: {},
  };

  let resolvedCount = 0;
  let falsePositiveCount = 0;

  for (const item of debtItems) {
    const sev = normalizeSeverity(item.severity);
    computed.bySeverity[sev] = (computed.bySeverity[sev] || 0) + 1;

    const status = normalizeStatus(item.status);
    computed.byStatus[status] = (computed.byStatus[status] || 0) + 1;

    if (status === "RESOLVED") resolvedCount++;
    if (status === "FALSE_POSITIVE") falsePositiveCount++;
  }

  const openCount = computed.totalItems - resolvedCount - falsePositiveCount;
  const resolutionRate =
    computed.totalItems > 0 ? Math.round((resolvedCount / computed.totalItems) * 100) : 0;

  // Read METRICS.md
  const metricsContent = safeReadFile(metricsPath);
  if (!metricsContent) {
    findings.push({
      id: "TMR-201",
      category: "metrics_dashboard_correctness",
      domain: DOMAIN,
      severity: "error",
      message: "METRICS.md not found or unreadable",
      details: `Expected at: ${metricsPath}`,
      frequency: 1,
      blastRadius: 4,
      patchType: "command",
      patchTarget: "scripts/debt/generate-metrics.js",
      patchContent: "node scripts/debt/generate-metrics.js",
      patchImpact: "Generate METRICS.md from current MASTER_DEBT.jsonl",
    });
    return { score: 0, rating: "poor", metrics: { reason: "metrics_md_missing" } };
  }

  const reported = extractMetricsTable(metricsContent);

  let totalMetrics = 0;
  let matchingMetrics = 0;
  const metricMismatches = [];

  // Helper to compare a metric
  function compareMetric(name, computedVal, reportedKey, parseFunc) {
    const rawReported = reported[reportedKey];
    if (rawReported === undefined) return; // metric not in METRICS.md

    totalMetrics++;
    const reportedVal = parseFunc ? parseFunc(rawReported) : parseInt(rawReported, 10);

    if (isNaN(reportedVal)) {
      metricMismatches.push({
        name,
        computed: computedVal,
        reported: rawReported,
        reason: "unparseable",
      });
      return;
    }

    if (reportedVal === computedVal) {
      matchingMetrics++;
    } else {
      metricMismatches.push({
        name,
        computed: computedVal,
        reported: reportedVal,
        reason: "mismatch",
      });
    }
  }

  // Parse percentage string like "5%" to number
  function parsePct(val) {
    const m = String(val).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : NaN;
  }

  // Compare summary metrics
  compareMetric("total items", computed.totalItems, "total items", null);
  compareMetric("open items", openCount, "open items", null);
  compareMetric("resolved", resolvedCount, "resolved", null);
  compareMetric("false positives", falsePositiveCount, "false positives", null);
  compareMetric("resolution rate", resolutionRate, "resolution rate", parsePct);

  // Compare severity counts from METRICS.md "By Severity" table
  const sevDisplayMap = {
    S0: "s0 (critical)",
    S1: "s1 (high)",
    S2: "s2 (medium)",
    S3: "s3 (low)",
  };

  for (const [sevKey, displayKey] of Object.entries(sevDisplayMap)) {
    const computedVal = computed.bySeverity[sevKey] || 0;
    // METRICS.md table has columns: | Severity | Count | % of Total |
    // extractMetricsTable picks up the second column as value
    // But multi-column tables may have Count and %
    // Look for the severity key in the metrics map
    const rawVal = reported[displayKey];
    if (rawVal !== undefined) {
      totalMetrics++;
      // The value might be just the count (first column after key in the table)
      const parsedCount = parseInt(rawVal, 10);
      if (isNaN(parsedCount)) {
        metricMismatches.push({
          name: `severity ${sevKey}`,
          computed: computedVal,
          reported: rawVal,
          reason: "unparseable",
        });
      } else if (parsedCount === computedVal) {
        matchingMetrics++;
      } else {
        metricMismatches.push({
          name: `severity ${sevKey}`,
          computed: computedVal,
          reported: parsedCount,
          reason: "mismatch",
        });
      }
    }
  }

  // Report mismatches
  if (metricMismatches.length > 0) {
    const mismatchSummary = metricMismatches
      .map((m) => `${m.name}: reported=${m.reported} computed=${m.computed}`)
      .join("; ");

    findings.push({
      id: "TMR-210",
      category: "metrics_dashboard_correctness",
      domain: DOMAIN,
      severity: metricMismatches.length > 3 ? "error" : "warning",
      message: `METRICS.md has ${metricMismatches.length} stale metric${metricMismatches.length === 1 ? "" : "s"} vs MASTER_DEBT.jsonl`,
      details: `Mismatches: ${mismatchSummary.slice(0, 400)}`,
      frequency: metricMismatches.length,
      blastRadius: 3,
      patchType: "command",
      patchTarget: "scripts/debt/generate-metrics.js",
      patchContent: "node scripts/debt/generate-metrics.js",
      patchImpact: "Regenerate METRICS.md from current MASTER_DEBT.jsonl",
    });
  }

  // Check metrics-log.jsonl for trend data consistency
  const metricsLogContent = safeReadFile(metricsLogPath);
  if (metricsLogContent) {
    const { items: logEntries, invalidCount } = parseJsonl(metricsLogContent);

    if (invalidCount > 0) {
      findings.push({
        id: "TMR-211",
        category: "metrics_dashboard_correctness",
        domain: DOMAIN,
        severity: "warning",
        message: `metrics-log.jsonl has ${invalidCount} invalid JSON line${invalidCount === 1 ? "" : "s"}`,
        details: "Corrupt lines in the metrics log can break trend analysis.",
        frequency: invalidCount,
        blastRadius: 2,
      });
    }

    if (logEntries.length > 0) {
      // Check that the most recent log entry's total is roughly consistent
      const lastEntry = logEntries[logEntries.length - 1];
      const loggedTotal = lastEntry.total || lastEntry.totalItems || lastEntry.count;

      if (typeof loggedTotal === "number" && loggedTotal > 0) {
        totalMetrics++;
        // Allow 5% drift for trend data (may be from a previous snapshot)
        const drift = Math.abs(loggedTotal - computed.totalItems);
        const driftPct =
          computed.totalItems > 0 ? Math.round((drift / computed.totalItems) * 100) : 0;

        if (driftPct <= 5) {
          matchingMetrics++;
        } else {
          metricMismatches.push({
            name: "metrics-log latest total",
            computed: computed.totalItems,
            reported: loggedTotal,
            reason: "drift",
          });

          findings.push({
            id: "TMR-212",
            category: "metrics_dashboard_correctness",
            domain: DOMAIN,
            severity: "info",
            message: `metrics-log.jsonl latest total (${loggedTotal}) differs from current MASTER_DEBT count (${computed.totalItems}) by ${driftPct}%`,
            details:
              "This may be expected if the log entry is from a previous session. Consider regenerating metrics.",
            frequency: 1,
            blastRadius: 1,
          });
        }
      }
    }
  } else {
    findings.push({
      id: "TMR-213",
      category: "metrics_dashboard_correctness",
      domain: DOMAIN,
      severity: "info",
      message: "metrics-log.jsonl not found — trend data unavailable",
      details: `Expected at: ${metricsLogPath}`,
      frequency: 1,
      blastRadius: 1,
    });
  }

  const correctPct = totalMetrics > 0 ? Math.round((matchingMetrics / totalMetrics) * 100) : 100;

  const result = scoreMetric(correctPct, bench.correct_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      totalMetrics,
      matchingMetrics,
      correctPct,
      mismatches: metricMismatches.length,
      computed: {
        totalItems: computed.totalItems,
        resolved: resolvedCount,
        falsePositives: falsePositiveCount,
        open: openCount,
        resolutionRate: resolutionRate,
      },
    },
  };
}

// ── Category 3: Audit Trail Completeness ─────────────────────────────────────

function checkAuditTrailCompleteness(rootDir, findings) {
  const bench = BENCHMARKS.audit_trail_completeness;
  const logsDir = path.join(rootDir, "docs", "technical-debt", "logs");

  let hasIntakeLog = false;
  let hasDedupLog = false;
  let hasResolutionLog = false;
  let logsValidJsonl = true;

  const logFiles = [
    { name: "intake-log.jsonl", key: "intake" },
    { name: "dedup-log.jsonl", key: "dedup" },
    { name: "resolution-log.jsonl", key: "resolution" },
  ];

  for (const logFile of logFiles) {
    const logPath = path.join(logsDir, logFile.name);
    const content = safeReadFile(logPath);

    if (!content) {
      findings.push({
        id: "TMR-300",
        category: "audit_trail_completeness",
        domain: DOMAIN,
        severity: logFile.key === "resolution" ? "warning" : "error",
        message: `Audit log missing: ${logFile.name}`,
        details: `Expected at: ${logPath}. ${logFile.key === "intake" ? "Intake log tracks all incoming debt items." : logFile.key === "dedup" ? "Dedup log tracks deduplication decisions." : "Resolution log tracks resolved items."}`,
        frequency: 1,
        blastRadius: logFile.key === "resolution" ? 2 : 3,
      });
      continue;
    }

    const { items, invalidCount } = parseJsonl(content);

    if (items.length === 0 && content.trim().length === 0) {
      findings.push({
        id: "TMR-301",
        category: "audit_trail_completeness",
        domain: DOMAIN,
        severity: "warning",
        message: `Audit log empty: ${logFile.name}`,
        details: `The file exists but contains no entries. It may not be receiving data from the pipeline.`,
        frequency: 1,
        blastRadius: 2,
      });
      // Still counts as "has" if the file exists, even if empty
    }

    if (invalidCount > 0) {
      logsValidJsonl = false;
      findings.push({
        id: "TMR-302",
        category: "audit_trail_completeness",
        domain: DOMAIN,
        severity: "warning",
        message: `${logFile.name} has ${invalidCount} invalid JSON line${invalidCount === 1 ? "" : "s"}`,
        details: `${invalidCount} of ${items.length + invalidCount} lines failed JSON.parse(). Audit trail integrity is degraded.`,
        frequency: invalidCount,
        blastRadius: 2,
      });
    }

    // Mark as present (file exists and was readable)
    if (logFile.key === "intake") hasIntakeLog = true;
    if (logFile.key === "dedup") hasDedupLog = true;
    if (logFile.key === "resolution") hasResolutionLog = true;

    // Additional checks per log type
    if (logFile.key === "resolution" && items.length > 0) {
      // Verify resolution log entries track resolved item IDs
      const hasIdField = items.some(
        (entry) => entry.id || entry.itemId || entry.debtId || entry.resolved_id
      );
      if (!hasIdField) {
        findings.push({
          id: "TMR-303",
          category: "audit_trail_completeness",
          domain: DOMAIN,
          severity: "info",
          message: "resolution-log.jsonl entries lack item ID references",
          details: "Log entries should reference the DEBT-XXXX IDs they resolved for traceability.",
          frequency: items.length,
          blastRadius: 1,
        });
      }
    }

    if (logFile.key === "intake" && items.length > 0) {
      // Verify intake log entries have timestamps
      const hasTimestamp = items.some(
        (entry) => entry.timestamp || entry.date || entry.created || entry.ingestedAt
      );
      if (!hasTimestamp) {
        findings.push({
          id: "TMR-304",
          category: "audit_trail_completeness",
          domain: DOMAIN,
          severity: "info",
          message: "intake-log.jsonl entries lack timestamps",
          details: "Timestamped intake entries enable trend analysis and pipeline debugging.",
          frequency: 1,
          blastRadius: 1,
        });
      }
    }
  }

  // Compute score: 25 points each for intake, dedup, resolution, valid JSONL
  const completePct =
    (hasIntakeLog ? 25 : 0) +
    (hasDedupLog ? 25 : 0) +
    (hasResolutionLog ? 25 : 0) +
    (logsValidJsonl ? 25 : 0);

  const result = scoreMetric(completePct, bench.complete_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      hasIntakeLog,
      hasDedupLog,
      hasResolutionLog,
      logsValidJsonl,
      completePct,
    },
  };
}

// ── Main entry point ─────────────────────────────────────────────────────────

/**
 * Run all metrics & reporting checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // ── Category 1: View Generation Accuracy ──────────────────────────────
  scores.view_generation_accuracy = checkViewGenerationAccuracy(rootDir, findings);

  // ── Category 2: Metrics Dashboard Correctness ─────────────────────────
  scores.metrics_dashboard_correctness = checkMetricsDashboardCorrectness(rootDir, findings);

  // ── Category 3: Audit Trail Completeness ──────────────────────────────
  scores.audit_trail_completeness = checkAuditTrailCompleteness(rootDir, findings);

  return { domain: DOMAIN, findings, scores };
}

module.exports = { DOMAIN, run };
