"use client";

import { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { logger } from "@/lib/logger";
import { CheckCircle2, XCircle, Users, Activity, Clock, AlertCircle } from "lucide-react";
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

export function DashboardTab() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
