"use client";

import { useEffect, useMemo, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { logger } from "@/lib/logger";
import {
  ExternalLink,
  FileText,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  Clock,
  Filter,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface LogEntry {
  id: string;
  type: string;
  severity: "INFO" | "WARNING" | "ERROR";
  functionName: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface LogsResponse {
  logs: LogEntry[];
  gcpLinks: {
    allLogs: string;
    errors: string;
    warnings: string;
    security: string;
    auth: string;
    admin: string;
  };
  generatedAt: string;
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "ERROR":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "WARNING":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "ERROR":
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
          Error
        </span>
      );
    case "WARNING":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          Warning
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          Info
        </span>
      );
  }
}

function getEventTypeBadge(type: string) {
  // Determine category based on type
  if (type.includes("AUTH") || type.includes("AUTHORIZATION")) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border border-purple-200 bg-purple-50 text-purple-700">
        Auth
      </span>
    );
  }
  if (type.includes("ADMIN")) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border border-indigo-200 bg-indigo-50 text-indigo-700">
        Admin
      </span>
    );
  }
  if (type.includes("RATE_LIMIT")) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border border-orange-200 bg-orange-50 text-orange-700">
        Rate Limit
      </span>
    );
  }
  if (type.includes("JOB")) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border border-green-200 bg-green-50 text-green-700">
        Job
      </span>
    );
  }
  if (type.includes("RECAPTCHA")) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border border-cyan-200 bg-cyan-50 text-cyan-700">
        reCAPTCHA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700">
      System
    </span>
  );
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return timestamp;
  }
}

// Safe JSON serialization for metadata that handles circular refs and non-serializable values
function safeStringify(obj: unknown): string {
  try {
    const seen = new WeakSet<object>();
    return JSON.stringify(
      obj,
      (_key, value) => {
        // Handle BigInt
        if (typeof value === "bigint") return value.toString();
        // Handle circular references
        if (value && typeof value === "object") {
          if (seen.has(value)) return "[Circular]";
          seen.add(value);
        }
        // Handle Error objects - SECURITY: Don't expose stack traces in UI
        if (value instanceof Error) {
          return { name: value.name, message: value.message };
        }
        return value;
      },
      2
    );
  } catch {
    return "[Unserializable metadata]";
  }
}

interface LogRowProps {
  log: LogEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

function LogRow({ log, isExpanded, onToggle }: LogRowProps) {
  return (
    <>
      <tr className="hover:bg-amber-50 transition-colors">
        <td className="px-4 py-3">
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
              <div className="flex items-center gap-2">
                {getSeverityIcon(log.severity)}
                <span className="font-medium text-amber-900 line-clamp-1">{log.message}</span>
              </div>
            </div>
          </button>
        </td>
        <td className="px-4 py-3">{getEventTypeBadge(log.type)}</td>
        <td className="px-4 py-3">{getSeverityBadge(log.severity)}</td>
        <td className="px-4 py-3 text-sm text-amber-700 font-mono">{log.functionName}</td>
        <td className="px-4 py-3 text-sm text-amber-600">{formatTimestamp(log.timestamp)}</td>
      </tr>
      {isExpanded && (
        <tr className="bg-amber-50/50">
          <td colSpan={5} className="px-4 py-4">
            <div className="pl-8 space-y-3">
              <div>
                <span className="text-xs font-medium text-amber-700 uppercase">Event Type</span>
                <p className="text-sm text-amber-900 font-mono">{log.type}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-amber-700 uppercase">Full Message</span>
                <p className="text-sm text-amber-900">{log.message}</p>
              </div>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div>
                  <span className="text-xs font-medium text-amber-700 uppercase">Metadata</span>
                  <pre className="text-xs text-amber-800 bg-amber-100 rounded p-2 mt-1 overflow-x-auto">
                    {safeStringify(log.metadata)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [gcpLinks, setGcpLinks] = useState<LogsResponse["gcpLinks"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<"all" | "ERROR" | "WARNING" | "INFO">("all");

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredLogs = useMemo(() => {
    if (severityFilter === "all") return logs;
    return logs.filter((log) => log.severity === severityFilter);
  }, [logs, severityFilter]);

  // Reset expanded rows when filter changes to prevent stale expanded state
  useEffect(() => {
    setExpandedRows(new Set());
  }, [severityFilter]);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const getLogs = httpsCallable<void, LogsResponse>(functions, "adminGetLogs");
      const result = await getLogs();
      setLogs(result.data.logs);
      setGcpLinks(result.data.gcpLinks);
    } catch (err) {
      logger.error("Failed to fetch logs", { error: err });
      // SECURITY: Don't expose raw error messages to UI
      setError("Failed to fetch logs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Count by severity
  const counts = useMemo(() => {
    return {
      error: logs.filter((l) => l.severity === "ERROR").length,
      warning: logs.filter((l) => l.severity === "WARNING").length,
      info: logs.filter((l) => l.severity === "INFO").length,
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-amber-600" />
          <div>
            <h2 className="text-lg font-semibold text-amber-900">System Logs</h2>
            <p className="text-sm text-amber-700">
              Security events and system activity with GCP Cloud Logging links
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* GCP Deep Links */}
      {gcpLinks && (
        <div className="rounded-lg border border-amber-100 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">GCP Cloud Logging Quick Links</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={gcpLinks.allLogs}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              All Logs
            </a>
            <a
              href={gcpLinks.errors}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Errors Only
            </a>
            <a
              href={gcpLinks.warnings}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Warnings
            </a>
            <a
              href={gcpLinks.security}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
              Security Events
            </a>
            <a
              href={gcpLinks.auth}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
              Auth Events
            </a>
            <a
              href={gcpLinks.admin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
              Admin Actions
            </a>
          </div>
          <p className="text-xs text-amber-600 mt-3">
            Click any link to open GCP Cloud Logging with pre-filtered queries
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-red-100 bg-white p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700">Errors (24h)</p>
          </div>
          <p className="text-2xl font-semibold text-red-900 mt-1">{counts.error}</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-white p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-amber-700">Warnings (24h)</p>
          </div>
          <p className="text-2xl font-semibold text-amber-900 mt-1">{counts.warning}</p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-white p-4">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            <p className="text-sm text-blue-700">Info (24h)</p>
          </div>
          <p className="text-2xl font-semibold text-blue-900 mt-1">{counts.info}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-900">Filter:</span>
        <div className="flex gap-2">
          {(["all", "ERROR", "WARNING", "INFO"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setSeverityFilter(level)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                severityFilter === level
                  ? "bg-amber-500 text-white"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}
            >
              {level === "all" ? "All" : level}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="rounded-lg border border-amber-100 bg-white p-6 text-amber-700">
          Loading logs...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-lg border border-amber-100 bg-white p-6 text-amber-700">
          No logs found for the selected filter.
        </div>
      ) : (
        <div className="rounded-lg border border-amber-100 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-amber-100 text-sm">
              <thead className="bg-amber-50 text-left text-amber-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Function</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {filteredLogs.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    isExpanded={expandedRows.has(log.id)}
                    onToggle={() => toggleRow(log.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">About System Logs</h4>
            <p className="text-sm text-blue-700">
              This tab shows recent security and system events from Cloud Functions. For full log
              history, stack traces, and advanced filtering, use the GCP Cloud Logging links above.
              All security events are retained for 30 days in GCP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
