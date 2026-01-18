"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { logger } from "@/lib/logger";
import { useTabRefresh } from "@/lib/hooks/use-tab-refresh";
import {
  findErrorKnowledge,
  getSeverityColor,
  getSeverityLabel,
  type ErrorKnowledge,
} from "@/lib/error-knowledge-base";
import { redactSensitive, safeFormatDate, isValidSentryUrl } from "@/lib/utils/admin-error-utils";
import {
  createAdminErrorsExport,
  downloadErrorExport,
  copyErrorExportToClipboard,
  getTimeframeDates,
  type TimeframePreset,
} from "@/lib/utils/error-export";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Info,
  Lightbulb,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
  Check,
} from "lucide-react";

interface SentryIssueSummary {
  title: string;
  count: number;
  userCount?: number | null; // Optional - Sentry may not always provide this
  lastSeen: string | null;
  firstSeen: string | null;
  shortId: string;
  level: string | null;
  status: string | null;
  permalink: string;
}

interface SentryErrorSummaryResponse {
  summary: {
    totalEvents24h: number;
    totalEventsPrev24h: number;
    trendPct: number;
    issueCount: number;
  };
  issues: SentryIssueSummary[];
  generatedAt: string;
}

function getStatusBadge(status: string | null) {
  switch (status) {
    case "resolved":
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          Resolved
        </span>
      );
    case "ignored":
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          Ignored
        </span>
      );
    case "unresolved":
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          Active
        </span>
      );
  }
}

interface ErrorRowProps {
  issue: SentryIssueSummary;
  isExpanded: boolean;
  onToggle: () => void;
  knowledge: ErrorKnowledge;
}

function ErrorRow({ issue, isExpanded, onToggle, knowledge }: ErrorRowProps) {
  const sanitizedTitle = redactSensitive(issue.title);

  // Calculate dates once at component start (performance optimization)
  const firstSeenFormatted = safeFormatDate(issue.firstSeen);
  const lastSeenFormatted = safeFormatDate(issue.lastSeen);

  // Validate permalink URL for security
  const safePermalink = isValidSentryUrl(issue.permalink) ? issue.permalink : null;

  return (
    <>
      <tr className="hover:bg-amber-50 transition-colors">
        <td className="px-6 py-4">
          <button
            type="button"
            className="w-full text-left"
            onClick={onToggle}
            aria-expanded={isExpanded}
          >
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-amber-600 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <div className="font-medium text-amber-900">{sanitizedTitle}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-amber-600">{issue.shortId}</span>
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border ${getSeverityColor(knowledge.severity)}`}
                  >
                    {knowledge.component}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </td>
        <td className="px-6 py-4 text-amber-900 font-medium">{issue.count.toLocaleString()}</td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-1.5 text-amber-700">
            <Users className="h-3.5 w-3.5" />
            <span>
              {/* ROBUSTNESS: Use Number.isFinite to prevent NaN from rendering in UI */}
              {Number.isFinite(issue.userCount)
                ? Math.max(0, issue.userCount as number).toLocaleString()
                : "N/A"}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 text-amber-700">{lastSeenFormatted}</td>
        <td className="px-6 py-4 text-amber-700">{firstSeenFormatted}</td>
        <td className="px-6 py-4">{getStatusBadge(issue.status)}</td>
        <td className="px-6 py-4">
          {safePermalink ? (
            <a
              href={safePermalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Sentry
            </a>
          ) : (
            <span className="text-amber-400 text-xs">Link unavailable</span>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-amber-50/50">
          <td colSpan={7} className="px-6 py-4">
            <div className="space-y-4 pl-6">
              {/* Description */}
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900 mb-1">What this means</h4>
                  <p className="text-sm text-amber-700">{knowledge.description}</p>
                </div>
              </div>

              {/* Severity */}
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-amber-900">User Impact: </span>
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${getSeverityColor(knowledge.severity)}`}
                  >
                    {getSeverityLabel(knowledge.severity)}
                  </span>
                </div>
              </div>

              {/* Possible Causes */}
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900 mb-2">Possible causes</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {knowledge.possibleCauses.map((cause, idx) => (
                      <li key={idx} className="text-sm text-amber-700">
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Remediations */}
              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900 mb-2">
                    Suggested remediations
                  </h4>
                  <ol className="list-decimal list-inside space-y-1">
                    {knowledge.remediations.map((step, idx) => (
                      <li key={idx} className="text-sm text-amber-700">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Stats summary */}
              <div className="flex items-center gap-6 pt-2 border-t border-amber-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-600">
                    First: {firstSeenFormatted} | Last: {lastSeenFormatted}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-600">
                    {issue.count.toLocaleString()} events
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-600">
                    {typeof issue.userCount === "number"
                      ? `${issue.userCount.toLocaleString()} users affected`
                      : "N/A users"}
                  </span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function ErrorsTab() {
  const [summary, setSummary] = useState<SentryErrorSummaryResponse["summary"] | null>(null);
  const [issues, setIssues] = useState<SentryIssueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Export state
  const [exportTimeframe, setExportTimeframe] = useState<TimeframePreset>("24h");
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const trendDirection = useMemo(() => {
    if (!summary) return null;
    if (summary.trendPct > 0) return "up";
    if (summary.trendPct < 0) return "down";
    return "flat";
  }, [summary]);

  // Memoize issues with knowledge to prevent findErrorKnowledge from being called on every render
  const issuesWithKnowledge = useMemo(
    () =>
      issues.map((issue) => ({
        ...issue,
        knowledge: findErrorKnowledge(issue.title),
      })),
    [issues]
  );

  const toggleRow = (shortId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(shortId)) {
        next.delete(shortId);
      } else {
        next.add(shortId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedRows(new Set(issues.map((i) => i.shortId)));
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const getSummary = httpsCallable<void, SentryErrorSummaryResponse>(
        functions,
        "adminGetSentryErrorSummary"
      );
      const result = await getSummary();
      setSummary(result.data.summary);
      setIssues(result.data.issues);
    } catch (err) {
      logger.error("Failed to fetch Sentry summary", { error: err });
      setError(err instanceof Error ? err.message : "Failed to fetch Sentry summary");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh when tab becomes active
  useTabRefresh("errors", refresh, { skipInitial: true });

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Export functions
  const createExportData = () => {
    const { startDate, endDate } = getTimeframeDates(exportTimeframe);

    // Filter issues within the timeframe
    const filteredIssues = issues.filter((issue) => {
      if (!issue.lastSeen) return false;
      const lastSeenDate = new Date(issue.lastSeen);
      return lastSeenDate >= startDate && lastSeenDate <= endDate;
    });

    const totalEvents = filteredIssues.reduce((sum, i) => sum + i.count, 0);
    const affectedUsers = filteredIssues.reduce((sum, i) => sum + (i.userCount ?? 0), 0);

    return createAdminErrorsExport(
      filteredIssues,
      {
        type: "preset",
        preset: exportTimeframe,
        startDate,
        endDate,
      },
      {
        totalEvents,
        uniqueIssues: filteredIssues.length,
        affectedUsers,
      }
    );
  };

  const handleExportDownload = () => {
    const exportData = createExportData();
    downloadErrorExport(exportData, `sentry-errors-${exportTimeframe}-${Date.now()}.json`);
    setShowExportDropdown(false);
  };

  const handleExportCopy = async () => {
    const exportData = createExportData();
    const success = await copyErrorExportToClipboard(exportData);

    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    setShowExportDropdown(false);
  };

  const timeframeLabels: Record<TimeframePreset, string> = {
    "1h": "Last 1 hour",
    "6h": "Last 6 hours",
    "24h": "Last 24 hours",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
          <div>
            <h2 className="text-lg font-semibold text-amber-900">Errors</h2>
            <p className="text-sm text-amber-700">
              Sanitized Sentry error overview with remediation guidance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={loading || issues.length === 0}
              className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-3 w-3" />
            </button>

            {showExportDropdown && (
              <>
                {/* Backdrop to close dropdown */}
                <div className="fixed inset-0 z-10" onClick={() => setShowExportDropdown(false)} />
                <div className="absolute right-0 mt-2 w-64 rounded-md border border-amber-200 bg-white shadow-lg z-20">
                  <div className="p-3 border-b border-amber-100">
                    <label className="block text-xs font-medium text-amber-700 mb-1.5">
                      Timeframe
                    </label>
                    <select
                      value={exportTimeframe}
                      onChange={(e) => setExportTimeframe(e.target.value as TimeframePreset)}
                      className="w-full rounded-md border border-amber-200 px-2 py-1.5 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {(Object.keys(timeframeLabels) as TimeframePreset[]).map((preset) => (
                        <option key={preset} value={preset}>
                          {timeframeLabels[preset]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="p-2 space-y-1">
                    <button
                      onClick={handleExportDownload}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-900 hover:bg-amber-50 rounded-md"
                    >
                      <Download className="h-4 w-4" />
                      Download JSON
                    </button>
                    <button
                      onClick={handleExportCopy}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md ${
                        copySuccess
                          ? "text-green-700 bg-green-50"
                          : "text-amber-900 hover:bg-amber-50"
                      }`}
                    >
                      {copySuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy to Clipboard
                        </>
                      )}
                    </button>
                  </div>
                  <div className="px-3 py-2 bg-amber-50 border-t border-amber-100 rounded-b-md">
                    <p className="text-xs text-amber-600">
                      Export for Claude Code debugging. PII is redacted.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-amber-100 bg-white p-6 text-amber-700">
          Loading error summary...
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-amber-100 bg-white p-4">
              <p className="text-sm text-amber-700">Events (last 24h)</p>
              <p className="text-2xl font-semibold text-amber-900">
                {summary.totalEvents24h.toLocaleString()}
              </p>
              <p className="text-xs text-amber-600">
                Prev 24h: {summary.totalEventsPrev24h.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-white p-4">
              <p className="text-sm text-amber-700">Users affected</p>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-600" />
                <p className="text-2xl font-semibold text-amber-900">
                  {issues.reduce((sum, i) => sum + (i.userCount ?? 0), 0).toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-amber-600">Sum across issues (may double-count)</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-white p-4">
              <p className="text-sm text-amber-700">Trend vs prior 24h</p>
              <div className="flex items-center gap-2">
                {trendDirection === "up" && <TrendingUp className="h-5 w-5 text-red-500" />}
                {trendDirection === "down" && <TrendingDown className="h-5 w-5 text-green-600" />}
                {trendDirection === "flat" && <span className="text-sm text-amber-600">—</span>}
                <p className="text-2xl font-semibold text-amber-900">
                  {summary.trendPct.toFixed(1)}%
                </p>
              </div>
              <p className="text-xs text-amber-600">Based on hourly Sentry events</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-white p-4">
              <p className="text-sm text-amber-700">Active issues (top 20)</p>
              <p className="text-2xl font-semibold text-amber-900">{summary.issueCount}</p>
              <p className="text-xs text-amber-600">Most frequent errors in last 24h</p>
            </div>
          </div>

          <div className="rounded-lg border border-amber-100 bg-white">
            <div className="flex items-center justify-between border-b border-amber-100 px-6 py-4">
              <div>
                <h3 className="text-sm font-semibold text-amber-900">Recent errors</h3>
                <p className="text-xs text-amber-600 mt-0.5">
                  Click any row to see details, causes, and remediation steps
                </p>
              </div>
              {issues.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={expandAll}
                    className="text-xs text-amber-700 hover:text-amber-900 hover:underline"
                  >
                    Expand all
                  </button>
                  <span className="text-amber-300">|</span>
                  <button
                    onClick={collapseAll}
                    className="text-xs text-amber-700 hover:text-amber-900 hover:underline"
                  >
                    Collapse all
                  </button>
                </div>
              )}
            </div>
            {issues.length === 0 ? (
              <div className="p-6 text-sm text-amber-700">No recent errors reported.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-100 text-sm">
                  <thead className="bg-amber-50 text-left text-amber-800">
                    <tr>
                      <th className="px-6 py-3 font-medium">Error</th>
                      <th className="px-6 py-3 font-medium">Count</th>
                      <th className="px-6 py-3 font-medium">Users</th>
                      <th className="px-6 py-3 font-medium">Last seen</th>
                      <th className="px-6 py-3 font-medium">First seen</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {issuesWithKnowledge.map((issue) => (
                      <ErrorRow
                        key={issue.shortId}
                        issue={issue}
                        isExpanded={expandedRows.has(issue.shortId)}
                        onToggle={() => toggleRow(issue.shortId)}
                        knowledge={issue.knowledge}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Help section */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">About Error Monitoring</h4>
                <p className="text-sm text-blue-700">
                  This dashboard shows errors captured by Sentry. Click any error row to see a
                  description of the issue, possible causes, and suggested remediation steps. For
                  full stack traces and detailed debugging, click &quot;Sentry&quot; to view in the
                  Sentry console.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-amber-100 bg-white p-6 text-amber-700">
          No summary available.
        </div>
      )}
    </div>
  );
}
