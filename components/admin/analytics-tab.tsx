"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { logger } from "@/lib/logger";
import { useTabRefresh } from "@/lib/hooks/use-tab-refresh";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart3,
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ============================================================================
// Types
// ============================================================================

interface AnalyticsTrendPoint {
  date: string;
  activeUsers: number;
  newUsers: number;
  journalEntries: number;
  checkIns: number;
}

interface CohortRetention {
  cohortWeek: string;
  cohortSize: number;
  week1Retention: number;
  week2Retention: number;
  week4Retention: number;
}

interface FeatureUsage {
  feature: string;
  last7Days: number;
  last30Days: number;
  trend: "up" | "down" | "stable";
}

interface UserAnalyticsData {
  currentMetrics: {
    dau: number;
    wau: number;
    mau: number;
  };
  dailyTrends: AnalyticsTrendPoint[];
  cohortRetention: CohortRetention[];
  featureUsage: FeatureUsage[];
  generatedAt: string;
}

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * Large metric card for DAU/WAU/MAU
 */
function MetricCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: Readonly<{
  label: string;
  value: number;
  icon: typeof Users;
  colorClass: string;
}>) {
  return (
    <div className="bg-white rounded-lg border border-amber-200 p-6">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${colorClass}`} />
        <span className="text-sm text-amber-700">{label}</span>
      </div>
      <div className="text-3xl font-bold text-amber-900">{value.toLocaleString()}</div>
    </div>
  );
}

/**
 * Trend icon component
 */
function TrendIcon({ trend }: Readonly<{ trend: "up" | "down" | "stable" }>) {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-600" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-600" />;
  return <Minus className="w-4 h-4 text-gray-500" />;
}

/**
 * Feature usage row
 */
function FeatureUsageRow({ feature }: Readonly<{ feature: FeatureUsage }>) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-amber-100 last:border-b-0">
      <div className="flex items-center gap-3">
        <TrendIcon trend={feature.trend} />
        <span className="font-medium text-amber-900">{feature.feature}</span>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="text-right">
          <div className="text-amber-900 font-medium">{feature.last7Days.toLocaleString()}</div>
          <div className="text-amber-600 text-xs">7 days</div>
        </div>
        <div className="text-right">
          <div className="text-amber-900 font-medium">{feature.last30Days.toLocaleString()}</div>
          <div className="text-amber-600 text-xs">30 days</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cohort retention row
 */
function CohortRow({ cohort }: Readonly<{ cohort: CohortRetention }>) {
  const getRetentionColor = (value: number) => {
    if (value >= 50) return "bg-green-100 text-green-800";
    if (value >= 25) return "bg-yellow-100 text-yellow-800";
    if (value > 0) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-500";
  };

  return (
    <tr className="border-b border-amber-100">
      <td className="py-3 px-4 font-medium text-amber-900">{cohort.cohortWeek}</td>
      <td className="py-3 px-4 text-amber-700">{cohort.cohortSize}</td>
      <td className="py-3 px-4">
        {cohort.week1Retention > 0 ? (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getRetentionColor(cohort.week1Retention)}`}
          >
            {cohort.week1Retention}%
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="py-3 px-4">
        {cohort.week2Retention > 0 ? (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getRetentionColor(cohort.week2Retention)}`}
          >
            {cohort.week2Retention}%
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="py-3 px-4">
        {cohort.week4Retention > 0 ? (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getRetentionColor(cohort.week4Retention)}`}
          >
            {cohort.week4Retention}%
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </tr>
  );
}

/**
 * Simple bar chart for daily trends (last 14 days)
 */
function DailyTrendsChart({ trends }: Readonly<{ trends: AnalyticsTrendPoint[] }>) {
  // Get last 14 days of data
  const recentTrends = trends.slice(-14);
  if (recentTrends.length === 0) {
    return (
      <div className="bg-amber-50 rounded-lg p-6 text-center text-amber-700">
        No trend data available. Analytics are generated daily.
      </div>
    );
  }

  const maxValue = Math.max(...recentTrends.map((t) => t.activeUsers), 1);

  const formatTrendLabel = (raw: string) => {
    if (typeof raw !== "string") return "Unknown";
    // Prefer YYYY-MM-DD -> MM-DD; otherwise fall back to a safe prefix
    if (raw.length >= 10 && raw[4] === "-" && raw[7] === "-") return raw.slice(5, 10);
    return raw.length > 10 ? raw.slice(0, 10) : raw;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-32">
        {recentTrends.map((trend) => {
          const height = (trend.activeUsers / maxValue) * 100;
          return (
            <div
              key={trend.date}
              className="flex-1 flex flex-col items-center group"
              title={`${trend.date}: ${trend.activeUsers} active users`}
            >
              <div
                className="w-full bg-amber-500 rounded-t transition-all group-hover:bg-amber-600"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-amber-600">
        <span>{formatTrendLabel(recentTrends[0]?.date ?? "")}</span>
        <span>{formatTrendLabel(recentTrends[recentTrends.length - 1]?.date ?? "")}</span>
      </div>
      <div className="text-center text-xs text-amber-600">Daily Active Users (last 14 days)</div>
    </div>
  );
}

/**
 * Loading state
 */
function AnalyticsLoading() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="flex items-center gap-3 text-amber-700">
        <Loader2 className="w-6 h-6 animate-spin" />
        Loading analytics...
      </div>
    </div>
  );
}

/**
 * Error state
 */
function AnalyticsError({ error, onRetry }: Readonly<{ error: string; onRetry: () => void }>) {
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

// ============================================================================
// Main Component
// ============================================================================

export function AnalyticsTab() {
  const [data, setData] = useState<UserAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const loadAnalytics = useCallback(async (isActive: () => boolean = () => true) => {
    setLoading(true);
    setError(null);
    try {
      const functions = getFunctions();
      const fn = httpsCallable<void, UserAnalyticsData>(functions, "adminGetUserAnalytics");
      const result = await fn();
      if (!isActive()) return;
      setData(result.data);
    } catch (err) {
      logger.error("Failed to load user analytics", { error: err });
      if (!isActive()) return;
      setError("Failed to load analytics. Please try again later.");
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  // Track mounted state for useTabRefresh callbacks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-refresh when tab becomes active
  useTabRefresh("analytics", () => loadAnalytics(() => isMountedRef.current));

  // Load on mount
  useEffect(() => {
    let isActive = true;
    loadAnalytics(() => isActive);
    return () => {
      isActive = false;
    };
  }, [loadAnalytics]);

  if (loading) return <AnalyticsLoading />;
  if (error) return <AnalyticsError error={error} onRetry={() => loadAnalytics()} />;
  if (!data) return <AnalyticsError error="No data available" onRetry={() => loadAnalytics()} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading text-amber-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          User Analytics
        </h2>
        <button
          onClick={() => loadAnalytics()}
          className="text-sm text-amber-700 hover:text-amber-900 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Current Metrics - DAU/WAU/MAU */}
      <div>
        <h3 className="text-lg font-heading text-amber-900 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Active Users
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="Daily Active Users (DAU)"
            value={data.currentMetrics.dau}
            icon={Activity}
            colorClass="text-green-600"
          />
          <MetricCard
            label="Weekly Active Users (WAU)"
            value={data.currentMetrics.wau}
            icon={Activity}
            colorClass="text-blue-600"
          />
          <MetricCard
            label="Monthly Active Users (MAU)"
            value={data.currentMetrics.mau}
            icon={Activity}
            colorClass="text-purple-600"
          />
        </div>
      </div>

      {/* Daily Trends Chart */}
      <div>
        <h3 className="text-lg font-heading text-amber-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Activity Trends
        </h3>
        <div className="bg-white rounded-lg border border-amber-200 p-4">
          <DailyTrendsChart trends={data.dailyTrends} />
        </div>
      </div>

      {/* Feature Usage */}
      <div>
        <h3 className="text-lg font-heading text-amber-900 mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Feature Usage
        </h3>
        <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
          {data.featureUsage.length > 0 ? (
            data.featureUsage.map((feature) => (
              <FeatureUsageRow key={feature.feature} feature={feature} />
            ))
          ) : (
            <div className="p-6 text-center text-amber-700">No feature usage data available</div>
          )}
        </div>
      </div>

      {/* Cohort Retention */}
      <div>
        <h3 className="text-lg font-heading text-amber-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Cohort Retention
        </h3>
        <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
          {data.cohortRetention.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-200">
                    <th className="py-3 px-4 text-left text-sm font-medium text-amber-700">
                      Cohort
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-amber-700">Size</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-amber-700">
                      Week 1
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-amber-700">
                      Week 2
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-amber-700">
                      Week 4
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.cohortRetention.map((cohort) => (
                    <CohortRow key={cohort.cohortWeek} cohort={cohort} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-amber-700">
              No cohort data available. Retention tracking requires at least 2 weeks of user data.
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-amber-700 text-center">
        Last updated: {/* ISSUE [21]: Validate date before formatting */}
        {data.generatedAt && !Number.isNaN(new Date(data.generatedAt).getTime())
          ? formatDistanceToNow(new Date(data.generatedAt), { addSuffix: true })
          : "Unknown"}
      </div>
    </div>
  );
}
