"use client";

import { useState, useEffect, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { logger } from "@/lib/logger";
import {
  Play,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  History,
  User,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useTabRefresh } from "@/lib/hooks/use-tab-refresh";

// ============================================================================
// Types
// ============================================================================

interface Job {
  id: string;
  name: string;
  schedule: string;
  description: string;
  lastRunStatus: "success" | "failed" | "running" | "never";
  lastRun: string | null;
  lastSuccessRun: string | null;
  lastRunDuration: number | null;
  lastError: string | null;
}

interface JobRunHistory {
  runId: string;
  jobId: string;
  jobName: string;
  startTime: string;
  endTime: string;
  status: "success" | "failed";
  durationMs: number;
  error?: string;
  resultSummary?: Record<string, unknown>;
  triggeredBy: "schedule" | "manual";
}

interface JobRunHistoryResponse {
  runs: JobRunHistory[];
  totalCount: number;
  hasMore: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * ISSUE [6]: Sanitize error messages to prevent exposing internal details
 */
function sanitizeErrorMessage(error: string): string {
  // Remove stack traces
  const stackTracePattern = /\s+at\s+.*/g;
  let sanitized = error.replace(stackTracePattern, "");

  // Remove file paths
  const filePathPattern = /\/[\w\-./]+\.(js|ts|tsx|jsx):\d+:\d+/g;
  sanitized = sanitized.replace(filePathPattern, "");

  // Remove Firebase-specific error prefixes
  sanitized = sanitized.replace(/^Firebase: Error \(auth\/[^)]+\)\.?/i, "Authentication error.");
  sanitized = sanitized.replace(/^Error: /i, "");

  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200) + "...";
  }

  return sanitized.trim() || "An error occurred.";
}

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * Status badge component
 */
function StatusBadge({
  status,
}: Readonly<{ status: Job["lastRunStatus"] | "success" | "failed" }>) {
  switch (status) {
    case "success":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Success
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    case "running":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Running
        </span>
      );
    case "never":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3" />
          Never Run
        </span>
      );
  }
}

/**
 * Trigger badge component
 */
function TriggerBadge({ triggeredBy }: Readonly<{ triggeredBy: "schedule" | "manual" }>) {
  if (triggeredBy === "manual") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
        <User className="w-3 h-3" />
        Manual
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
      <Clock className="w-3 h-3" />
      Scheduled
    </span>
  );
}

/**
 * A20: Job Run History Panel
 */
function JobRunHistoryPanel({
  jobId,
  onClose,
}: Readonly<{
  jobId: string;
  onClose: () => void;
}>) {
  const [history, setHistory] = useState<JobRunHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"" | "success" | "failed">("");
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const functions = getFunctions();
      const fn = httpsCallable<
        { jobId: string; status?: string; limit: number },
        JobRunHistoryResponse
      >(functions, "adminGetJobRunHistory");

      const params: { jobId: string; status?: string; limit: number } = {
        jobId,
        limit: 50,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }

      const result = await fn(params);
      setHistory(result.data.runs);
    } catch (err) {
      logger.error("Failed to load job history", { error: err, jobId });
      // ISSUE [6]: Sanitize error - never show raw Firebase/server errors to users
      setError("Failed to load job history. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [jobId, statusFilter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const downloadHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-history-${jobId}-${new Date().toISOString().split("T")[0]}.json`;
    // ISSUE [15]: Append to DOM for cross-browser compatibility
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-amber-900 flex items-center gap-2">
          <History className="w-4 h-4" />
          Run History
        </h4>
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-amber-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | "success" | "failed")}
              className="text-sm border border-amber-200 rounded px-2 py-1 bg-white"
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          {/* Download Button */}
          <button
            onClick={downloadHistory}
            disabled={history.length === 0}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-amber-100 text-amber-700 rounded hover:bg-amber-200 disabled:opacity-50"
            title="Download as JSON"
          >
            <Download className="w-4 h-4" />
          </button>
          {/* Close Button */}
          <button onClick={onClose} className="text-amber-600 hover:text-amber-900 text-sm">
            Close
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
          <span className="ml-2 text-amber-600">Loading history...</span>
        </div>
      ) : error ? (
        <div className="text-red-600 text-sm py-4">{error}</div>
      ) : history.length === 0 ? (
        <div className="text-amber-600 text-sm py-4 text-center">
          No run history available for this job yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map((run) => (
            <div
              key={run.runId}
              className="bg-white rounded border border-amber-100 overflow-hidden"
            >
              <button
                onClick={() => setExpandedRun(expandedRun === run.runId ? null : run.runId)}
                className="w-full p-3 flex items-center justify-between hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedRun === run.runId ? (
                    <ChevronDown className="w-4 h-4 text-amber-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-amber-600" />
                  )}
                  <StatusBadge status={run.status} />
                  <TriggerBadge triggeredBy={run.triggeredBy} />
                  <span className="text-sm text-amber-700">
                    {/* ISSUE [20]: Validate date before formatting */}
                    {run.startTime && !Number.isNaN(new Date(run.startTime).getTime())
                      ? format(new Date(run.startTime), "MMM d, yyyy HH:mm:ss")
                      : "Unknown"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-amber-600">
                  <span>{run.durationMs}ms</span>
                </div>
              </button>

              {expandedRun === run.runId && (
                <div className="px-3 pb-3 pt-0 border-t border-amber-100">
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-amber-700">Run ID:</span>{" "}
                        <span className="text-amber-900 font-mono text-xs">{run.runId}</span>
                      </div>
                      <div>
                        <span className="font-medium text-amber-700">Duration:</span>{" "}
                        <span className="text-amber-900">{run.durationMs}ms</span>
                      </div>
                      <div>
                        <span className="font-medium text-amber-700">Started:</span>{" "}
                        <span className="text-amber-900">
                          {/* ISSUE [20]: Validate date before formatting */}
                          {run.startTime && !Number.isNaN(new Date(run.startTime).getTime())
                            ? format(new Date(run.startTime), "PPpp")
                            : "Unknown"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-amber-700">Ended:</span>{" "}
                        <span className="text-amber-900">
                          {/* ISSUE [20]: Validate date before formatting */}
                          {run.endTime && !Number.isNaN(new Date(run.endTime).getTime())
                            ? format(new Date(run.endTime), "PPpp")
                            : "Unknown"}
                        </span>
                      </div>
                    </div>

                    {run.error && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                        <div className="font-medium text-red-900 mb-1">Error:</div>
                        <div className="text-red-700 font-mono text-xs whitespace-pre-wrap">
                          {/* ISSUE [6]: Sanitize error messages */}
                          {sanitizeErrorMessage(run.error)}
                        </div>
                      </div>
                    )}

                    {run.resultSummary && Object.keys(run.resultSummary).length > 0 && (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                        <div className="font-medium text-green-900 mb-1">Result Summary:</div>
                        <pre className="text-green-700 font-mono text-xs overflow-x-auto">
                          {JSON.stringify(run.resultSummary, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A20: Individual Job Card with expandable history
 */
function JobCard({
  job,
  isRunning,
  onTrigger,
}: Readonly<{
  job: Job;
  isRunning: boolean;
  onTrigger: () => void;
}>) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="bg-white border border-amber-100 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-medium text-amber-900">{job.name}</h3>
            <StatusBadge status={job.lastRunStatus} />
          </div>

          <p className="text-sm text-amber-600 mb-4">{job.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-1 text-amber-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Schedule</span>
              </div>
              <div className="text-amber-900">{job.schedule}</div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-amber-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Last Run</span>
              </div>
              <div className="text-amber-900">
                {/* ISSUE [20]: Validate date before formatting */}
                {job.lastRun && !Number.isNaN(new Date(job.lastRun).getTime())
                  ? formatDistanceToNow(new Date(job.lastRun), { addSuffix: true })
                  : "Never"}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-amber-600 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Last Success</span>
              </div>
              <div className="text-amber-900">
                {/* ISSUE [20]: Validate date before formatting */}
                {job.lastSuccessRun && !Number.isNaN(new Date(job.lastSuccessRun).getTime())
                  ? formatDistanceToNow(new Date(job.lastSuccessRun), { addSuffix: true })
                  : "Never"}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-amber-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Duration</span>
              </div>
              <div className="text-amber-900">
                {job.lastRunDuration ? `${job.lastRunDuration}ms` : "N/A"}
              </div>
            </div>
          </div>

          {job.lastError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
              <div className="font-medium text-red-900 mb-1">Last Error:</div>
              <div className="text-red-700 font-mono text-xs">
                {/* ISSUE [6]: Sanitize error messages */}
                {sanitizeErrorMessage(job.lastError)}
              </div>
            </div>
          )}
        </div>

        <div className="ml-4 flex flex-col gap-2">
          <button
            onClick={onTrigger}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Run job manually"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Now
              </>
            )}
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm"
            title="View run history"
          >
            <History className="w-4 h-4" />
            {showHistory ? "Hide" : "History"}
          </button>
        </div>
      </div>

      {/* A20: Expandable History Panel */}
      {showHistory && <JobRunHistoryPanel jobId={job.id} onClose={() => setShowHistory(false)} />}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();
      const getJobsFn = httpsCallable<void, { jobs: Job[] }>(functions, "adminGetJobsStatus");

      const result = await getJobsFn();
      setJobs(result.data.jobs);
    } catch (err) {
      logger.error("Failed to load jobs", { error: err });
      // ISSUE [6]: Sanitize error - never show raw Firebase/server errors to users
      setError("Failed to load jobs. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh when tab becomes active
  useTabRefresh("jobs", loadJobs, { skipInitial: true });

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  async function triggerJob(jobId: string) {
    if (runningJobs.has(jobId)) return;

    setRunningJobs((prev) => new Set(prev).add(jobId));
    setError(null);

    try {
      const functions = getFunctions();
      const triggerFn = httpsCallable<{ jobId: string }, { success: boolean; message: string }>(
        functions,
        "adminTriggerJob"
      );

      const result = await triggerFn({ jobId });

      // Reload jobs to get updated status
      await loadJobs();

      alert(result.data.message);
    } catch (err) {
      logger.error("Failed to trigger job", { error: err, jobId });
      // ISSUE [6]: Sanitize error - never show raw Firebase/server errors to users
      const sanitizedError = "Failed to trigger job. Please try again later.";
      setError(sanitizedError);
      alert(sanitizedError);
    } finally {
      setRunningJobs((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        <span className="ml-2 text-amber-600">Loading jobs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading text-amber-900">Background Jobs</h2>
          <p className="text-sm text-amber-600">Monitor and manage scheduled background tasks</p>
        </div>
        <button
          onClick={loadJobs}
          className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Jobs List */}
      <div className="grid gap-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isRunning={runningJobs.has(job.id)}
            onTrigger={() => triggerJob(job.id)}
          />
        ))}
      </div>

      {jobs.length === 0 && !loading && (
        <div className="text-center p-12 border border-dashed border-amber-200 rounded-lg bg-amber-50/50">
          <Clock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-amber-600">No background jobs configured</p>
        </div>
      )}
    </div>
  );
}
