"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { logger } from "@/lib/logger";
import { useTabRefresh } from "@/lib/hooks/use-tab-refresh";
import { useAdminTabContext } from "@/lib/contexts/admin-tab-context";
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
  UserSearch,
  Activity,
  Loader2,
  X,
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

// A21: User correlation types
interface ErrorWithUser {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  functionName: string;
  userIdHash: string | null;
  severity: "ERROR" | "WARNING";
}

interface UserActivity {
  id: string;
  type: string;
  functionName: string;
  message: string;
  timestamp: string;
  severity: "INFO" | "WARNING" | "ERROR";
}

interface UserCorrelationData {
  errors: ErrorWithUser[];
  totalCount: number;
  uniqueUsers: number;
}

interface UserActivityData {
  userIdHash: string;
  activities: UserActivity[];
  totalCount: number;
  activityByType: Record<string, number>;
}

interface FoundUser {
  uid: string;
  nickname: string;
  email: string | null;
  createdAt: string | null;
  lastActive: string | null;
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

function ErrorRow({ issue, isExpanded, onToggle, knowledge }: Readonly<ErrorRowProps>) {
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
                    {knowledge.possibleCauses.map((cause, index) => (
                      <li key={`${cause}-${index}`} className="text-sm text-amber-700">
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
                    {knowledge.remediations.map((step, index) => (
                      <li key={`${step}-${index}`} className="text-sm text-amber-700">
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

// ============================================================================
// A21: User Correlation Components
// ============================================================================

/**
 * A21: User Activity Modal - Shows activity timeline for a user hash
 */
function UserActivityModal({
  userIdHash,
  onClose,
  onNavigateToUser,
}: Readonly<{
  userIdHash: string;
  onClose: () => void;
  onNavigateToUser: (uid: string) => void;
}>) {
  const [activity, setActivity] = useState<UserActivityData | null>(null);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Request ID to prevent stale async responses from overwriting newer data
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const functions = getFunctions();

        // Load activity and user lookup in parallel
        const [activityRes, userRes] = await Promise.allSettled([
          httpsCallable<{ userIdHash: string; limit: number }, UserActivityData>(
            functions,
            "adminGetUserActivityByHash"
          )({ userIdHash, limit: 50 }),
          httpsCallable<{ userIdHash: string }, { found: boolean; user: FoundUser | null }>(
            functions,
            "adminFindUserByHash"
          )({ userIdHash }),
        ]);

        // Guard against unmount and stale requests
        if (!isMounted || requestId !== requestIdRef.current) return;

        // Clear stale state for this hash before applying results
        setActivity(null);
        setFoundUser(null);

        if (activityRes.status === "fulfilled") {
          const next = activityRes.value.data;
          setActivity({
            ...next,
            activities: Array.isArray(next.activities) ? next.activities : [],
            activityByType:
              next.activityByType && typeof next.activityByType === "object"
                ? next.activityByType
                : {},
          });
        } else {
          logger.error("Failed to load user activity timeline", {
            error: activityRes.reason,
            userIdHash,
          });
          setError("Failed to load activity. Please try again later.");
        }

        if (userRes.status === "fulfilled" && userRes.value.data.found && userRes.value.data.user) {
          setFoundUser(userRes.value.data.user);
        } else if (userRes.status === "rejected") {
          logger.error("Failed to resolve user from hash", { error: userRes.reason, userIdHash });
        }
      } catch (err) {
        logger.error("Failed to load user activity", { error: err, userIdHash });
        if (!isMounted || requestId !== requestIdRef.current) return;
        setError("Failed to load activity. Please try again later.");
      } finally {
        if (isMounted && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [userIdHash]);

  // ISSUE [17]: Add Escape key handler for modal accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="User activity timeline"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <UserSearch className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-medium text-amber-900">User Activity Timeline</h3>
              <p className="text-xs text-amber-600 font-mono">{userIdHash}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-amber-600 hover:text-amber-900 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info (if found) */}
        {foundUser && (
          <div className="p-4 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-amber-900">{foundUser.nickname}</p>
                <p className="text-xs text-amber-600">
                  {foundUser.email || "No email"} | Last active:{" "}
                  {foundUser.lastActive ? safeFormatDate(foundUser.lastActive) : "Unknown"}
                </p>
              </div>
              <button
                onClick={() => onNavigateToUser(foundUser.uid)}
                className="px-3 py-1 text-sm bg-amber-500 text-white rounded hover:bg-amber-600"
              >
                View User Details
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
              <span className="ml-2 text-amber-600">Loading activity...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 text-sm py-4">{error}</div>
          ) : activity && activity.activities.length > 0 ? (
            <div className="space-y-2">
              {/* Activity Summary */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(activity.activityByType).map(([type, count]) => (
                  <span
                    key={type}
                    className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700"
                  >
                    {type}: {count}
                  </span>
                ))}
              </div>

              {/* Activity List */}
              {activity.activities.map((a) => (
                <div
                  key={a.id}
                  className={`p-3 rounded border ${
                    a.severity === "ERROR"
                      ? "border-red-200 bg-red-50"
                      : a.severity === "WARNING"
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-amber-100 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium ${
                        a.severity === "ERROR"
                          ? "text-red-700"
                          : a.severity === "WARNING"
                            ? "text-yellow-700"
                            : "text-amber-700"
                      }`}
                    >
                      {a.type}
                    </span>
                    <span className="text-xs text-amber-500">{safeFormatDate(a.timestamp)}</span>
                  </div>
                  <p className="text-sm text-amber-900">{a.functionName}</p>
                  <p className="text-xs text-amber-600 mt-1 truncate">{a.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-amber-600 text-sm py-4 text-center">
              No recent activity found for this user.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-600 text-center">
          Showing last 24 hours of activity
        </div>
      </div>
    </div>
  );
}

/**
 * A21: User Correlation Section
 */
function UserCorrelationSection({
  onNavigateToUser,
}: Readonly<{ onNavigateToUser: (uid: string) => void }>) {
  const [data, setData] = useState<UserCorrelationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserHash, setSelectedUserHash] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Track mounted state for async callbacks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async (isActive: () => boolean = () => true) => {
    setLoading(true);
    setError(null);
    try {
      const functions = getFunctions();
      const fn = httpsCallable<{ limit: number; hoursBack: number }, UserCorrelationData>(
        functions,
        "adminGetErrorsWithUsers"
      );
      const result = await fn({ limit: 50, hoursBack: 24 });
      if (!isActive()) return;
      setData(result.data);
    } catch (err) {
      logger.error("Failed to load error-user correlation", { error: err });
      if (!isActive()) return;
      setError("Failed to load correlation data. Please try again later.");
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  useTabRefresh("errors", () => loadData(() => isMountedRef.current));

  useEffect(() => {
    let isActive = true;
    loadData(() => isActive);
    return () => {
      isActive = false;
    };
  }, [loadData]);

  const getSeverityBadge = (severity: "ERROR" | "WARNING") => {
    if (severity === "ERROR") {
      return <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">ERROR</span>;
    }
    return (
      <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">WARNING</span>
    );
  };

  return (
    <div className="rounded-lg border border-amber-100 bg-white">
      <div className="flex items-center justify-between border-b border-amber-100 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Error-User Correlation
          </h3>
          <p className="text-xs text-amber-600 mt-0.5">
            Recent errors from security logs with user identification
          </p>
        </div>
        <div className="flex items-center gap-4">
          {data && (
            <span className="text-xs text-amber-600">{data.uniqueUsers} unique users affected</span>
          )}
          <button
            onClick={() => loadData(() => isMountedRef.current)}
            className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
          <span className="ml-2 text-amber-600 text-sm">Loading...</span>
        </div>
      ) : error ? (
        <div className="p-4 text-sm text-red-700">{error}</div>
      ) : data && data.errors.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-amber-100 text-sm">
            <thead className="bg-amber-50 text-left text-amber-800">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Function</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {data.errors.map((err) => (
                <tr key={err.id} className="hover:bg-amber-50">
                  <td className="px-4 py-3 text-amber-700">{safeFormatDate(err.timestamp)}</td>
                  <td className="px-4 py-3">{getSeverityBadge(err.severity)}</td>
                  <td className="px-4 py-3 text-amber-900">{err.type}</td>
                  <td className="px-4 py-3 text-amber-600 font-mono text-xs">{err.functionName}</td>
                  <td className="px-4 py-3">
                    {err.userIdHash ? (
                      <span className="font-mono text-xs text-amber-700">{err.userIdHash}</span>
                    ) : (
                      <span className="text-amber-400 text-xs">System</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {err.userIdHash && (
                      <button
                        onClick={() => setSelectedUserHash(err.userIdHash)}
                        className="text-xs text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1"
                      >
                        <UserSearch className="w-3 h-3" />
                        View Activity
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 text-sm text-amber-700 text-center">
          No errors with user correlation in the last 24 hours.
        </div>
      )}

      {/* User Activity Modal */}
      {selectedUserHash && (
        <UserActivityModal
          userIdHash={selectedUserHash}
          onClose={() => setSelectedUserHash(null)}
          onNavigateToUser={(uid) => {
            setSelectedUserHash(null);
            onNavigateToUser(uid);
          }}
        />
      )}
    </div>
  );
}

function filterIssuesByTimeframe(issues: SentryIssueSummary[], timeframe: TimeframePreset) {
  const { startDate, endDate } = getTimeframeDates(timeframe);
  const filteredIssues = issues.filter((issue) => {
    if (!issue.lastSeen) return false;
    const lastSeenDate = new Date(issue.lastSeen);
    if (Number.isNaN(lastSeenDate.getTime())) return false;
    return lastSeenDate >= startDate && lastSeenDate <= endDate;
  });
  const totalEvents = filteredIssues.reduce((sum, i) => sum + i.count, 0);
  const affectedUsers = filteredIssues.reduce((sum, i) => sum + (i.userCount ?? 0), 0);
  return { filteredIssues, startDate, endDate, totalEvents, affectedUsers };
}

const TIMEFRAME_LABELS: Record<TimeframePreset, string> = {
  "1h": "Last 1 hour",
  "6h": "Last 6 hours",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

interface ExportDropdownProps {
  issues: SentryIssueSummary[];
  loading: boolean;
}

function ExportDropdown({ issues, loading }: Readonly<ExportDropdownProps>) {
  const [exportTimeframe, setExportTimeframe] = useState<TimeframePreset>("24h");
  const [showDropdown, setShowDropdown] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const copySuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copySuccessTimeoutRef.current) {
        clearTimeout(copySuccessTimeoutRef.current);
        copySuccessTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!showDropdown) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDropdown(false);
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [showDropdown]);

  const handleExportDownload = () => {
    const { filteredIssues, startDate, endDate, totalEvents, affectedUsers } =
      filterIssuesByTimeframe(issues, exportTimeframe);
    const exportData = createAdminErrorsExport(
      filteredIssues,
      { type: "preset", preset: exportTimeframe, startDate, endDate },
      { totalEvents, uniqueIssues: filteredIssues.length, affectedUsers }
    );
    downloadErrorExport(exportData, `sentry-errors-${exportTimeframe}-${Date.now()}.json`);
    setShowDropdown(false);
  };

  const handleExportCopy = async () => {
    const { filteredIssues, startDate, endDate, totalEvents, affectedUsers } =
      filterIssuesByTimeframe(issues, exportTimeframe);
    const exportData = createAdminErrorsExport(
      filteredIssues,
      { type: "preset", preset: exportTimeframe, startDate, endDate },
      { totalEvents, uniqueIssues: filteredIssues.length, affectedUsers }
    );
    const success = await copyErrorExportToClipboard(exportData);
    if (success) {
      setCopySuccess(true);
      if (copySuccessTimeoutRef.current) clearTimeout(copySuccessTimeoutRef.current);
      copySuccessTimeoutRef.current = setTimeout(() => {
        copySuccessTimeoutRef.current = null;
        setCopySuccess(false);
      }, 2000);
    }
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading || issues.length === 0}
        className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="h-4 w-4" />
        Export
        <ChevronDown className="h-3 w-3" />
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
            role="presentation"
          />
          <div className="absolute right-0 mt-2 w-64 rounded-md border border-amber-200 bg-white shadow-lg z-20">
            <div className="p-3 border-b border-amber-100">
              <label
                htmlFor="errors-export-timeframe"
                className="block text-xs font-medium text-amber-700 mb-1.5"
              >
                Timeframe
              </label>
              <select
                id="errors-export-timeframe"
                value={exportTimeframe}
                onChange={(e) => setExportTimeframe(e.target.value as TimeframePreset)}
                className="w-full rounded-md border border-amber-200 px-2 py-1.5 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {(Object.keys(TIMEFRAME_LABELS) as TimeframePreset[]).map((preset) => (
                  <option key={preset} value={preset}>
                    {TIMEFRAME_LABELS[preset]}
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
                  copySuccess ? "text-green-700 bg-green-50" : "text-amber-900 hover:bg-amber-50"
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
  );
}

export function ErrorsTab() {
  const [summary, setSummary] = useState<SentryErrorSummaryResponse["summary"] | null>(null);
  const [issues, setIssues] = useState<SentryIssueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // A21: Navigation for user correlation
  const { setActiveTab } = useAdminTabContext();
  const navigateToUser = useCallback(
    (uid: string) => {
      // Store the target user ID for the users tab to pick up
      try {
        if (typeof globalThis.window !== "undefined") {
          sessionStorage.setItem("admin_navigate_to_user", uid);
        }
      } catch (err) {
        logger.warn("Failed to persist admin user navigation target", { error: err });
      }
      setActiveTab("users");
    },
    [setActiveTab]
  );

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
          <ExportDropdown issues={issues} loading={loading} />

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

          {/* A21: User Correlation Section */}
          <UserCorrelationSection onNavigateToUser={navigateToUser} />
        </>
      ) : (
        <div className="rounded-lg border border-amber-100 bg-white p-6 text-amber-700">
          No summary available.
        </div>
      )}
    </div>
  );
}
