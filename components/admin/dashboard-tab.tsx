"use client";

import { useState, useEffect, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { logger } from "@/lib/logger";
import { useTabRefresh } from "@/lib/hooks/use-tab-refresh";
import {
  CheckCircle2,
  XCircle,
  Users,
  Activity,
  Clock,
  AlertCircle,
  HardDrive,
  Database,
  ShieldAlert,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HealthCheck {
  firestore: boolean;
  auth: boolean;
  timestamp: string;
}

interface DashboardStats {
  activeUsers: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  totalUsers: number;
  recentSignups: Array<{
    id: string;
    nickname: string;
    createdAt: string | null;
    authProvider: string;
  }>;
  recentLogs: Array<{
    id: string;
    event: string;
    level: string;
    timestamp: string;
    details: string;
  }>;
  jobStatuses: Array<{
    id: string;
    name: string;
    lastRunStatus: string;
    lastRun: string | null;
  }>;
  generatedAt: string;
}

interface StorageStats {
  totalSize: number;
  totalSizeFormatted: string;
  fileCount: number;
  userCount: number;
  orphanedFiles: {
    count: number;
    size: number;
    sizeFormatted: string;
  };
  fileTypes: Array<{
    extension: string;
    count: number;
    size: number;
    sizeFormatted: string;
  }>;
  truncated?: boolean; // True if data was capped at 10,000 files
  generatedAt: string;
}

interface RateLimitEntry {
  key: string;
  type: string;
  points: number;
  maxPoints: number;
  resetAt: string;
  isBlocked: boolean;
}

interface CollectionStats {
  collection: string;
  count: number;
  hasSubcollections?: boolean;
  subcollectionEstimate?: number;
}

// ============================================================================
// Subcomponents (extracted for cognitive complexity reduction)
// ============================================================================

/**
 * Health status card for a single service
 */
function HealthStatusCard({ label, isHealthy }: { label: string; isHealthy: boolean | undefined }) {
  const Icon = isHealthy ? CheckCircle2 : XCircle;
  const iconClass = isHealthy ? "text-green-500" : "text-red-500";
  const statusText = isHealthy ? "Connected" : "Disconnected";

  return (
    <div className="bg-white rounded-lg border border-amber-200 p-4">
      <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 ${iconClass}`} />
        <div>
          <div className="font-medium text-amber-900">{label}</div>
          <div className="text-sm text-amber-700">{statusText}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Metric card for user stats
 */
function MetricCard({
  icon: Icon,
  iconClass,
  label,
  value,
}: {
  icon: typeof Users;
  iconClass: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-lg border border-amber-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <div className="text-sm text-amber-700">{label}</div>
      </div>
      <div className="text-2xl font-bold text-amber-900">{value}</div>
    </div>
  );
}

/**
 * Load/refresh button with loading state
 */
function LoadRefreshButton({
  onClick,
  loading,
  hasData,
  loadLabel,
  refreshLabel,
}: {
  onClick: () => void;
  loading: boolean;
  hasData: boolean;
  loadLabel: string;
  refreshLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="text-sm text-amber-700 hover:text-amber-900 flex items-center gap-2 disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" />
          {hasData ? refreshLabel : loadLabel}
        </>
      )}
    </button>
  );
}

/**
 * Storage stats display section
 */
function StorageStatsDisplay({
  stats,
  formatBytes,
}: {
  stats: StorageStats;
  formatBytes: (bytes: number) => string;
}) {
  return (
    <div className="space-y-4">
      {stats.truncated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Stats limited to first 10,000 files. Actual totals may be higher.
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-amber-200 p-4">
          <div className="text-sm text-amber-700 mb-1">Total Size</div>
          <div className="text-2xl font-bold text-amber-900">{formatBytes(stats.totalSize)}</div>
        </div>
        <div className="bg-white rounded-lg border border-amber-200 p-4">
          <div className="text-sm text-amber-700 mb-1">Total Files</div>
          <div className="text-2xl font-bold text-amber-900">{stats.fileCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-amber-200 p-4">
          <div className="text-sm text-amber-700 mb-1">Users with Files</div>
          <div className="text-2xl font-bold text-amber-900">{stats.userCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-amber-200 p-4">
          <div className="text-sm text-amber-700 mb-1">Orphaned Files</div>
          <div
            className={`text-2xl font-bold ${stats.orphanedFiles.count > 0 ? "text-orange-600" : "text-green-600"}`}
          >
            {stats.orphanedFiles.count}
            {stats.orphanedFiles.count > 0 && (
              <span className="text-sm font-normal ml-2">
                ({stats.orphanedFiles.sizeFormatted})
              </span>
            )}
          </div>
        </div>
        {stats.fileTypes.length > 0 && (
          <div className="col-span-full bg-white rounded-lg border border-amber-200 p-4">
            <div className="text-sm text-amber-700 mb-2">File Types (Top 10)</div>
            <div className="flex flex-wrap gap-2">
              {stats.fileTypes.map((fileType) => (
                <span
                  key={fileType.extension}
                  className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs"
                >
                  .{fileType.extension}: {fileType.count} ({fileType.sizeFormatted})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Rate limit entry row
 */
function RateLimitRow({
  limit,
  onClear,
  clearing,
}: {
  limit: RateLimitEntry;
  onClear: () => void;
  clearing: boolean;
}) {
  const resetText = (() => {
    const resetDate = new Date(limit.resetAt);
    return Number.isNaN(resetDate.getTime())
      ? "unknown"
      : formatDistanceToNow(resetDate, { addSuffix: true });
  })();

  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex-1">
        <div className="font-medium text-amber-900 font-mono text-sm">{limit.key}</div>
        <div className="text-sm text-amber-700">
          {limit.points}/{limit.maxPoints} points ({limit.type}) • Resets {resetText}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {limit.isBlocked && (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
            BLOCKED
          </span>
        )}
        <button
          onClick={onClear}
          disabled={clearing}
          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
          title="Clear rate limit"
        >
          {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/**
 * Collection stat card
 */
function CollectionStatCard({ col }: { col: CollectionStats }) {
  return (
    <div className="bg-white p-4">
      <div className="text-sm text-amber-700 mb-1">{col.collection}</div>
      <div className="text-xl font-bold text-amber-900">{col.count.toLocaleString()}</div>
      {col.hasSubcollections && col.subcollectionEstimate != null && (
        <div className="text-xs text-amber-600 mt-1">
          +{col.subcollectionEstimate.toLocaleString()} in subcollections
        </div>
      )}
    </div>
  );
}

/**
 * Signup row in recent signups list
 */
function SignupRow({ signup }: { signup: DashboardStats["recentSignups"][0] }) {
  return (
    <div className="p-4 flex items-center justify-between">
      <div>
        <div className="font-medium text-amber-900">{signup.nickname}</div>
        <div className="text-sm text-amber-700">via {signup.authProvider}</div>
      </div>
      <div className="text-sm text-amber-700">
        {signup.createdAt
          ? formatDistanceToNow(new Date(signup.createdAt), { addSuffix: true })
          : "Unknown"}
      </div>
    </div>
  );
}

/**
 * Job status row
 */
function JobStatusRow({ job }: { job: DashboardStats["jobStatuses"][0] }) {
  const statusClass =
    job.lastRunStatus === "success"
      ? "bg-green-100 text-green-800"
      : job.lastRunStatus === "failed"
        ? "bg-red-100 text-red-800"
        : "bg-gray-100 text-gray-800";

  return (
    <div className="p-4 flex items-center justify-between">
      <div>
        <div className="font-medium text-amber-900">{job.name}</div>
        <div className="text-sm text-amber-700">
          Last run:{" "}
          {job.lastRun ? formatDistanceToNow(new Date(job.lastRun), { addSuffix: true }) : "Never"}
        </div>
      </div>
      <div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusClass}`}>
          {job.lastRunStatus}
        </span>
      </div>
    </div>
  );
}

/**
 * Log entry row
 */
function LogEntryRow({ log }: { log: DashboardStats["recentLogs"][0] }) {
  const levelClass =
    log.level === "error"
      ? "bg-red-100 text-red-800"
      : log.level === "warn"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-blue-100 text-blue-800";

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelClass}`}>
              {log.level}
            </span>
            <span className="font-medium text-amber-900">{log.event}</span>
          </div>
          {log.details && <div className="text-sm text-amber-700">{log.details}</div>}
        </div>
        <div className="text-xs text-amber-700 whitespace-nowrap">
          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}

/**
 * Error/empty state display
 */
function StateDisplay({
  error,
  emptyMessage,
  bgClass,
}: {
  error: string | null;
  emptyMessage: string;
  bgClass: "amber" | "green" | "red";
}) {
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center text-red-700 flex items-center justify-center gap-2">
        <XCircle className="w-5 h-5" />
        {error}
      </div>
    );
  }
  const bgClasses = {
    amber: "bg-amber-50 rounded-lg border border-amber-200 p-6 text-center text-amber-700",
    green: "bg-green-50 rounded-lg border border-green-200 p-6 text-center text-green-700",
    red: "bg-red-50 rounded-lg border border-red-200 p-6 text-center text-red-700",
  };
  return <div className={bgClasses[bgClass]}>{emptyMessage}</div>;
}

/**
 * Storage section with header and content
 */
function StorageSection({
  storageStats,
  loadingStorage,
  storageError,
  onLoad,
  formatBytes,
}: {
  storageStats: StorageStats | null;
  loadingStorage: boolean;
  storageError: string | null;
  onLoad: () => void;
  formatBytes: (bytes: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-heading text-amber-900 flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Storage Usage
        </h3>
        <LoadRefreshButton
          onClick={onLoad}
          loading={loadingStorage}
          hasData={!!storageStats}
          loadLabel="Load Stats"
          refreshLabel="Refresh"
        />
      </div>
      {storageStats ? (
        <StorageStatsDisplay stats={storageStats} formatBytes={formatBytes} />
      ) : (
        <StateDisplay
          error={storageError}
          emptyMessage='Click "Load Stats" to view storage usage statistics'
          bgClass="amber"
        />
      )}
    </div>
  );
}

/**
 * Rate limits section with header and content
 */
function RateLimitsSection({
  rateLimits,
  loadingRateLimits,
  rateLimitsError,
  clearingRateLimit,
  onLoad,
  onClear,
}: {
  rateLimits: RateLimitEntry[];
  loadingRateLimits: boolean;
  rateLimitsError: string | null;
  clearingRateLimit: string | null;
  onLoad: () => void;
  onClear: (key: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-heading text-amber-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          Active Rate Limits
        </h3>
        <LoadRefreshButton
          onClick={onLoad}
          loading={loadingRateLimits}
          hasData={rateLimits.length > 0}
          loadLabel="Check Limits"
          refreshLabel="Refresh"
        />
      </div>
      {rateLimits.length > 0 ? (
        <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
          <div className="divide-y divide-amber-100">
            {rateLimits.map((limit) => (
              <RateLimitRow
                key={limit.key}
                limit={limit}
                onClear={() => onClear(limit.key)}
                clearing={clearingRateLimit === limit.key}
              />
            ))}
          </div>
        </div>
      ) : loadingRateLimits ? null : (
        <StateDisplay
          error={rateLimitsError}
          emptyMessage="No active rate limits"
          bgClass="green"
        />
      )}
    </div>
  );
}

/**
 * Collection stats section with header and content
 */
function CollectionStatsSection({
  collectionStats,
  loadingCollections,
  collectionsError,
  onLoad,
}: {
  collectionStats: CollectionStats[];
  loadingCollections: boolean;
  collectionsError: string | null;
  onLoad: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-heading text-amber-900 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Collection Document Counts
        </h3>
        <LoadRefreshButton
          onClick={onLoad}
          loading={loadingCollections}
          hasData={collectionStats.length > 0}
          loadLabel="Load Counts"
          refreshLabel="Refresh"
        />
      </div>
      {collectionStats.length > 0 ? (
        <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-amber-100">
            {collectionStats.map((col) => (
              <CollectionStatCard key={col.collection} col={col} />
            ))}
          </div>
        </div>
      ) : (
        <StateDisplay
          error={collectionsError}
          emptyMessage='Click "Load Counts" to view document counts for all collections'
          bgClass="amber"
        />
      )}
    </div>
  );
}

/**
 * Recent signups section
 */
function RecentSignupsSection({ signups }: { signups?: DashboardStats["recentSignups"] }) {
  return (
    <div>
      <h3 className="text-lg font-heading text-amber-900 mb-3">Recent Signups</h3>
      <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
        {signups && signups.length > 0 ? (
          <div className="divide-y divide-amber-100">
            {signups.map((signup) => (
              <SignupRow key={signup.id} signup={signup} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-amber-700">No recent signups</div>
        )}
      </div>
    </div>
  );
}

/**
 * Background jobs section
 */
function BackgroundJobsSection({ jobs }: { jobs?: DashboardStats["jobStatuses"] }) {
  if (!jobs || jobs.length === 0) return null;
  return (
    <div>
      <h3 className="text-lg font-heading text-amber-900 mb-3">Background Jobs</h3>
      <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
        <div className="divide-y divide-amber-100">
          {jobs.map((job) => (
            <JobStatusRow key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Recent logs section
 */
function RecentLogsSection({ logs }: { logs?: DashboardStats["recentLogs"] }) {
  if (!logs || logs.length === 0) return null;
  return (
    <div>
      <h3 className="text-lg font-heading text-amber-900 mb-3">Recent Activity</h3>
      <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
        <div className="divide-y divide-amber-100">
          {logs.slice(0, 5).map((log) => (
            <LogEntryRow key={log.id} log={log} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * User metrics section
 */
function UserMetricsSection({ stats }: { stats: DashboardStats | null }) {
  return (
    <div>
      <h3 className="text-lg font-heading text-amber-900 mb-3">User Metrics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          iconClass="text-amber-700"
          label="Total Users"
          value={stats?.totalUsers ?? 0}
        />
        <MetricCard
          icon={Activity}
          iconClass="text-green-700"
          label="24h Active"
          value={stats?.activeUsers.last24h ?? 0}
        />
        <MetricCard
          icon={Activity}
          iconClass="text-blue-700"
          label="7d Active"
          value={stats?.activeUsers.last7d ?? 0}
        />
        <MetricCard
          icon={Activity}
          iconClass="text-purple-700"
          label="30d Active"
          value={stats?.activeUsers.last30d ?? 0}
        />
      </div>
    </div>
  );
}

/**
 * Dashboard footer
 */
function DashboardFooter({ generatedAt }: { generatedAt?: string }) {
  const displayTime = generatedAt
    ? formatDistanceToNow(new Date(generatedAt), { addSuffix: true })
    : "Unknown";
  return <div className="text-xs text-amber-700 text-center">Last updated: {displayTime}</div>;
}

/**
 * Dashboard loading state
 */
function DashboardLoading() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-amber-900/60">Loading dashboard...</div>
    </div>
  );
}

/**
 * Dashboard error state
 */
function DashboardError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <div className="text-red-900">{error}</div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
      >
        Retry
      </button>
    </div>
  );
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// ============================================================================
// API Call Helpers (extracted for cognitive complexity reduction)
// ============================================================================

/**
 * Fetch storage stats from Cloud Function
 */
async function fetchStorageStats(
  setLoadingStorage: (v: boolean) => void,
  setStorageError: (v: string | null) => void,
  setStorageStats: (v: StorageStats) => void
) {
  setLoadingStorage(true);
  setStorageError(null);
  try {
    const functions = getFunctions();
    const fn = httpsCallable<void, StorageStats>(functions, "adminGetStorageStats");
    const result = await fn();
    setStorageStats(result.data);
  } catch (err) {
    logger.error("Failed to load storage stats", { error: err });
    setStorageError("Failed to load storage stats. Please try again.");
  } finally {
    setLoadingStorage(false);
  }
}

/**
 * Fetch rate limits from Cloud Function
 */
async function fetchRateLimits(
  setLoadingRateLimits: (v: boolean) => void,
  setRateLimitsError: (v: string | null) => void,
  setRateLimits: (v: RateLimitEntry[]) => void
) {
  setLoadingRateLimits(true);
  setRateLimitsError(null);
  try {
    const functions = getFunctions();
    const fn = httpsCallable<void, { activeLimits: RateLimitEntry[] }>(
      functions,
      "adminGetRateLimitStatus"
    );
    const result = await fn();
    setRateLimits(result.data.activeLimits);
  } catch (err) {
    logger.error("Failed to load rate limits", { error: err });
    setRateLimitsError("Failed to load rate limits. Please try again.");
  } finally {
    setLoadingRateLimits(false);
  }
}

/**
 * Fetch collection stats from Cloud Function
 */
async function fetchCollectionStats(
  setLoadingCollections: (v: boolean) => void,
  setCollectionsError: (v: string | null) => void,
  setCollectionStats: (v: CollectionStats[]) => void
) {
  setLoadingCollections(true);
  setCollectionsError(null);
  try {
    const functions = getFunctions();
    const fn = httpsCallable<void, { collections: CollectionStats[] }>(
      functions,
      "adminGetCollectionStats"
    );
    const result = await fn();
    setCollectionStats(result.data.collections);
  } catch (err) {
    logger.error("Failed to load collection stats", { error: err });
    setCollectionsError("Failed to load collection stats. Please try again.");
  } finally {
    setLoadingCollections(false);
  }
}

/**
 * Clear a rate limit
 */
async function clearRateLimitApi(
  key: string,
  setClearingRateLimit: (v: string | null) => void,
  reloadRateLimits: () => Promise<void>
) {
  if (!confirm(`Are you sure you want to clear the rate limit for ${key}?`)) return;
  setClearingRateLimit(key);
  try {
    const functions = getFunctions();
    const fn = httpsCallable<{ key: string }, { success: boolean }>(
      functions,
      "adminClearRateLimit"
    );
    await fn({ key });
    await reloadRateLimits();
  } catch (err) {
    logger.error("Failed to clear rate limit", { error: err });
  } finally {
    setClearingRateLimit(null);
  }
}

/**
 * Fetch dashboard data (health + stats)
 */
async function fetchDashboard(
  setLoading: (v: boolean) => void,
  setError: (v: string | null) => void,
  setHealth: (v: HealthCheck) => void,
  setStats: (v: DashboardStats) => void
) {
  setLoading(true);
  setError(null);
  try {
    const functions = getFunctions();
    const healthCheckFn = httpsCallable<void, HealthCheck>(functions, "adminHealthCheck");
    const getStatsFn = httpsCallable<void, DashboardStats>(functions, "adminGetDashboardStats");
    const [healthResult, statsResult] = await Promise.all([healthCheckFn(), getStatsFn()]);
    setHealth(healthResult.data);
    setStats(statsResult.data);
  } catch (err) {
    logger.error("Failed to load dashboard", { error: err });
    setError(err instanceof Error ? err.message : "Failed to load dashboard");
  } finally {
    setLoading(false);
  }
}

/**
 * Dashboard content component (renders the actual dashboard)
 */
function DashboardContent({
  health,
  stats,
  loadDashboard,
  storageStats,
  loadingStorage,
  storageError,
  loadStorageStats,
  rateLimits,
  loadingRateLimits,
  rateLimitsError,
  loadRateLimits,
  clearingRateLimit,
  clearRateLimit,
  collectionStats,
  loadingCollections,
  collectionsError,
  loadCollectionStats,
}: {
  health: HealthCheck | null;
  stats: DashboardStats | null;
  loadDashboard: () => void;
  storageStats: StorageStats | null;
  loadingStorage: boolean;
  storageError: string | null;
  loadStorageStats: () => void;
  rateLimits: RateLimitEntry[];
  loadingRateLimits: boolean;
  rateLimitsError: string | null;
  loadRateLimits: () => void;
  clearingRateLimit: string | null;
  clearRateLimit: (key: string) => void;
  collectionStats: CollectionStats[];
  loadingCollections: boolean;
  collectionsError: string | null;
  loadCollectionStats: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading text-amber-900">System Dashboard</h2>
        <button
          onClick={loadDashboard}
          className="text-sm text-amber-700 hover:text-amber-900 flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HealthStatusCard label="Firestore" isHealthy={health?.firestore} />
        <HealthStatusCard label="Authentication" isHealthy={health?.auth} />
      </div>

      {/* User Metrics */}
      <UserMetricsSection stats={stats} />

      {/* Storage Stats */}
      <StorageSection
        storageStats={storageStats}
        loadingStorage={loadingStorage}
        storageError={storageError}
        onLoad={loadStorageStats}
        formatBytes={formatBytes}
      />

      {/* Rate Limits */}
      <RateLimitsSection
        rateLimits={rateLimits}
        loadingRateLimits={loadingRateLimits}
        rateLimitsError={rateLimitsError}
        clearingRateLimit={clearingRateLimit}
        onLoad={loadRateLimits}
        onClear={clearRateLimit}
      />

      {/* Collection Stats */}
      <CollectionStatsSection
        collectionStats={collectionStats}
        loadingCollections={loadingCollections}
        collectionsError={collectionsError}
        onLoad={loadCollectionStats}
      />

      {/* Recent Signups */}
      <RecentSignupsSection signups={stats?.recentSignups} />

      {/* Background Jobs Status */}
      <BackgroundJobsSection jobs={stats?.jobStatuses} />

      {/* Recent Logs */}
      <RecentLogsSection logs={stats?.recentLogs} />

      {/* Footer */}
      <DashboardFooter generatedAt={stats?.generatedAt} />
    </div>
  );
}

export function DashboardTab() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extended stats state
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [rateLimits, setRateLimits] = useState<RateLimitEntry[]>([]);
  const [loadingRateLimits, setLoadingRateLimits] = useState(false);
  const [rateLimitsError, setRateLimitsError] = useState<string | null>(null);
  const [collectionStats, setCollectionStats] = useState<CollectionStats[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [collectionsError, setCollectionsError] = useState<string | null>(null);
  const [clearingRateLimit, setClearingRateLimit] = useState<string | null>(null);

  const loadDashboard = useCallback(
    () => fetchDashboard(setLoading, setError, setHealth, setStats),
    []
  );

  // Auto-refresh when tab becomes active
  useTabRefresh("dashboard", loadDashboard);

  // Load on mount
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const loadStorageStats = useCallback(
    () => fetchStorageStats(setLoadingStorage, setStorageError, setStorageStats),
    []
  );

  const loadRateLimits = useCallback(
    () => fetchRateLimits(setLoadingRateLimits, setRateLimitsError, setRateLimits),
    []
  );

  const loadCollectionStats = useCallback(
    () => fetchCollectionStats(setLoadingCollections, setCollectionsError, setCollectionStats),
    []
  );

  const clearRateLimit = useCallback(
    (key: string) => clearRateLimitApi(key, setClearingRateLimit, loadRateLimits),
    [loadRateLimits]
  );

  if (loading) {
    return <DashboardLoading />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={loadDashboard} />;
  }

  return (
    <DashboardContent
      health={health}
      stats={stats}
      loadDashboard={loadDashboard}
      storageStats={storageStats}
      loadingStorage={loadingStorage}
      storageError={storageError}
      loadStorageStats={loadStorageStats}
      rateLimits={rateLimits}
      loadingRateLimits={loadingRateLimits}
      rateLimitsError={rateLimitsError}
      loadRateLimits={loadRateLimits}
      clearingRateLimit={clearingRateLimit}
      clearRateLimit={clearRateLimit}
      collectionStats={collectionStats}
      loadingCollections={loadingCollections}
      collectionsError={collectionsError}
      loadCollectionStats={loadCollectionStats}
    />
  );
}
