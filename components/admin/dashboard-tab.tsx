"use client";

import { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { logger } from "@/lib/logger";
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

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const functions = getFunctions();

      // Call both Cloud Functions
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

  async function loadStorageStats() {
    setLoadingStorage(true);
    setStorageError(null);
    try {
      const functions = getFunctions();
      const getStorageStatsFn = httpsCallable<void, StorageStats>(
        functions,
        "adminGetStorageStats"
      );
      const result = await getStorageStatsFn();
      setStorageStats(result.data);
    } catch (err) {
      logger.error("Failed to load storage stats", { error: err });
      setStorageError("Failed to load storage stats. Please try again.");
    } finally {
      setLoadingStorage(false);
    }
  }

  async function loadRateLimits() {
    setLoadingRateLimits(true);
    setRateLimitsError(null);
    try {
      const functions = getFunctions();
      const getRateLimitsFn = httpsCallable<void, { activeLimits: RateLimitEntry[] }>(
        functions,
        "adminGetRateLimitStatus"
      );
      const result = await getRateLimitsFn();
      setRateLimits(result.data.activeLimits);
    } catch (err) {
      logger.error("Failed to load rate limits", { error: err });
      setRateLimitsError("Failed to load rate limits. Please try again.");
    } finally {
      setLoadingRateLimits(false);
    }
  }

  async function loadCollectionStats() {
    setLoadingCollections(true);
    setCollectionsError(null);
    try {
      const functions = getFunctions();
      const getCollectionStatsFn = httpsCallable<void, { collections: CollectionStats[] }>(
        functions,
        "adminGetCollectionStats"
      );
      const result = await getCollectionStatsFn();
      setCollectionStats(result.data.collections);
    } catch (err) {
      logger.error("Failed to load collection stats", { error: err });
      setCollectionsError("Failed to load collection stats. Please try again.");
    } finally {
      setLoadingCollections(false);
    }
  }

  async function clearRateLimit(key: string) {
    if (!confirm(`Are you sure you want to clear the rate limit for ${key}?`)) return;

    setClearingRateLimit(key);
    try {
      const functions = getFunctions();
      const clearFn = httpsCallable<{ key: string }, { success: boolean }>(
        functions,
        "adminClearRateLimit"
      );
      await clearFn({ key });
      // Reload rate limits
      await loadRateLimits();
    } catch (err) {
      logger.error("Failed to clear rate limit", { error: err });
    } finally {
      setClearingRateLimit(null);
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-amber-900/60">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-red-900">{error}</div>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
        >
          Retry
        </button>
      </div>
    );
  }

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
        <div className="bg-white rounded-lg border border-amber-200 p-4">
          <div className="flex items-center gap-3">
            {health?.firestore ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <div>
              <div className="font-medium text-amber-900">Firestore</div>
              <div className="text-sm text-amber-700">
                {health?.firestore ? "Connected" : "Disconnected"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-amber-200 p-4">
          <div className="flex items-center gap-3">
            {health?.auth ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <div>
              <div className="font-medium text-amber-900">Authentication</div>
              <div className="text-sm text-amber-700">
                {health?.auth ? "Connected" : "Disconnected"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Metrics */}
      <div>
        <h3 className="text-lg font-heading text-amber-900 mb-3">User Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-amber-700" />
              <div className="text-sm text-amber-700">Total Users</div>
            </div>
            <div className="text-2xl font-bold text-amber-900">{stats?.totalUsers ?? 0}</div>
          </div>

          <div className="bg-white rounded-lg border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-700" />
              <div className="text-sm text-amber-700">24h Active</div>
            </div>
            <div className="text-2xl font-bold text-amber-900">
              {stats?.activeUsers.last24h ?? 0}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-700" />
              <div className="text-sm text-amber-700">7d Active</div>
            </div>
            <div className="text-2xl font-bold text-amber-900">
              {stats?.activeUsers.last7d ?? 0}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-700" />
              <div className="text-sm text-amber-700">30d Active</div>
            </div>
            <div className="text-2xl font-bold text-amber-900">
              {stats?.activeUsers.last30d ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Storage Stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-heading text-amber-900 flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Storage Usage
          </h3>
          <button
            onClick={loadStorageStats}
            disabled={loadingStorage}
            className="text-sm text-amber-700 hover:text-amber-900 flex items-center gap-2 disabled:opacity-50"
          >
            {loadingStorage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {storageStats ? "Refresh" : "Load Stats"}
              </>
            )}
          </button>
        </div>
        {storageStats ? (
          <div className="space-y-4">
            {storageStats.truncated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Stats limited to first 10,000 files. Actual totals may be higher.
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-amber-200 p-4">
                <div className="text-sm text-amber-700 mb-1">Total Size</div>
                <div className="text-2xl font-bold text-amber-900">
                  {formatBytes(storageStats.totalSize)}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-amber-200 p-4">
                <div className="text-sm text-amber-700 mb-1">Total Files</div>
                <div className="text-2xl font-bold text-amber-900">{storageStats.fileCount}</div>
              </div>
              <div className="bg-white rounded-lg border border-amber-200 p-4">
                <div className="text-sm text-amber-700 mb-1">Users with Files</div>
                <div className="text-2xl font-bold text-amber-900">{storageStats.userCount}</div>
              </div>
              <div className="bg-white rounded-lg border border-amber-200 p-4">
                <div className="text-sm text-amber-700 mb-1">Orphaned Files</div>
                <div
                  className={`text-2xl font-bold ${storageStats.orphanedFiles.count > 0 ? "text-orange-600" : "text-green-600"}`}
                >
                  {storageStats.orphanedFiles.count}
                  {storageStats.orphanedFiles.count > 0 && (
                    <span className="text-sm font-normal ml-2">
                      ({storageStats.orphanedFiles.sizeFormatted})
                    </span>
                  )}
                </div>
              </div>
              {storageStats.fileTypes.length > 0 && (
                <div className="col-span-full bg-white rounded-lg border border-amber-200 p-4">
                  <div className="text-sm text-amber-700 mb-2">File Types (Top 10)</div>
                  <div className="flex flex-wrap gap-2">
                    {storageStats.fileTypes.map((fileType) => (
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
        ) : storageError ? (
          <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center text-red-700 flex items-center justify-center gap-2">
            <XCircle className="w-5 h-5" />
            {storageError}
          </div>
        ) : (
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-6 text-center text-amber-700">
            Click &ldquo;Load Stats&rdquo; to view storage usage statistics
          </div>
        )}
      </div>

      {/* Rate Limits */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-heading text-amber-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Active Rate Limits
          </h3>
          <button
            onClick={loadRateLimits}
            disabled={loadingRateLimits}
            className="text-sm text-amber-700 hover:text-amber-900 flex items-center gap-2 disabled:opacity-50"
          >
            {loadingRateLimits ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {rateLimits.length > 0 ? "Refresh" : "Check Limits"}
              </>
            )}
          </button>
        </div>
        {rateLimits.length > 0 ? (
          <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
            <div className="divide-y divide-amber-100">
              {rateLimits.map((limit) => (
                <div key={limit.key} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-amber-900 font-mono text-sm">{limit.key}</div>
                    <div className="text-sm text-amber-700">
                      {limit.points}/{limit.maxPoints} points ({limit.type}) • Resets{" "}
                      {(() => {
                        const resetDate = new Date(limit.resetAt);
                        return Number.isNaN(resetDate.getTime())
                          ? "unknown"
                          : formatDistanceToNow(resetDate, { addSuffix: true });
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {limit.isBlocked && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                        BLOCKED
                      </span>
                    )}
                    <button
                      onClick={() => clearRateLimit(limit.key)}
                      disabled={clearingRateLimit === limit.key}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Clear rate limit"
                    >
                      {clearingRateLimit === limit.key ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : rateLimitsError ? (
          <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center text-red-700 flex items-center justify-center gap-2">
            <XCircle className="w-5 h-5" />
            {rateLimitsError}
          </div>
        ) : loadingRateLimits ? null : (
          <div className="bg-green-50 rounded-lg border border-green-200 p-6 text-center text-green-700">
            No active rate limits
          </div>
        )}
      </div>

      {/* Collection Stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-heading text-amber-900 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Collection Document Counts
          </h3>
          <button
            onClick={loadCollectionStats}
            disabled={loadingCollections}
            className="text-sm text-amber-700 hover:text-amber-900 flex items-center gap-2 disabled:opacity-50"
          >
            {loadingCollections ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {collectionStats.length > 0 ? "Refresh" : "Load Counts"}
              </>
            )}
          </button>
        </div>
        {collectionStats.length > 0 ? (
          <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-amber-100">
              {collectionStats.map((col) => (
                <div key={col.collection} className="bg-white p-4">
                  <div className="text-sm text-amber-700 mb-1">{col.collection}</div>
                  <div className="text-xl font-bold text-amber-900">
                    {col.count.toLocaleString()}
                  </div>
                  {col.hasSubcollections && col.subcollectionEstimate != null && (
                    <div className="text-xs text-amber-600 mt-1">
                      +{col.subcollectionEstimate.toLocaleString()} in subcollections
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : collectionsError ? (
          <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center text-red-700 flex items-center justify-center gap-2">
            <XCircle className="w-5 h-5" />
            {collectionsError}
          </div>
        ) : (
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-6 text-center text-amber-700">
            Click &ldquo;Load Counts&rdquo; to view document counts for all collections
          </div>
        )}
      </div>

      {/* Recent Signups */}
      <div>
        <h3 className="text-lg font-heading text-amber-900 mb-3">Recent Signups</h3>
        <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
          {stats?.recentSignups && stats.recentSignups.length > 0 ? (
            <div className="divide-y divide-amber-100">
              {stats.recentSignups.map((signup) => (
                <div key={signup.id} className="p-4 flex items-center justify-between">
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
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-amber-700">No recent signups</div>
          )}
        </div>
      </div>

      {/* Background Jobs Status */}
      {stats?.jobStatuses && stats.jobStatuses.length > 0 && (
        <div>
          <h3 className="text-lg font-heading text-amber-900 mb-3">Background Jobs</h3>
          <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
            <div className="divide-y divide-amber-100">
              {stats.jobStatuses.map((job) => (
                <div key={job.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-amber-900">{job.name}</div>
                    <div className="text-sm text-amber-700">
                      Last run:{" "}
                      {job.lastRun
                        ? formatDistanceToNow(new Date(job.lastRun), { addSuffix: true })
                        : "Never"}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        job.lastRunStatus === "success"
                          ? "bg-green-100 text-green-800"
                          : job.lastRunStatus === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {job.lastRunStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Logs */}
      {stats?.recentLogs && stats.recentLogs.length > 0 && (
        <div>
          <h3 className="text-lg font-heading text-amber-900 mb-3">Recent Activity</h3>
          <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
            <div className="divide-y divide-amber-100">
              {stats.recentLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.level === "error"
                              ? "bg-red-100 text-red-800"
                              : log.level === "warn"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
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
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-amber-700 text-center">
        Last updated:{" "}
        {stats?.generatedAt
          ? formatDistanceToNow(new Date(stats.generatedAt), { addSuffix: true })
          : "Unknown"}
      </div>
    </div>
  );
}
