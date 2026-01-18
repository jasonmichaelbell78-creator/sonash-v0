/**
 * Error Export Utilities
 *
 * Provides functions to export error information as JSON for debugging with Claude Code.
 * Uses existing redactSensitive() for PII protection.
 */

import { redactSensitive } from "./admin-error-utils";

/** Export JSON structure version for backward compatibility */
const EXPORT_VERSION = "1.0";

/**
 * Environment information for error context
 */
interface EnvironmentInfo {
  nodeEnv: string | undefined;
  appVersion: string | undefined;
  userAgent: string;
  url: string;
  pathname: string;
  timestamp: string;
}

/**
 * Browser performance metrics
 */
interface BrowserInfo {
  viewport: {
    width: number;
    height: number;
  };
  memory?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
  performance?: {
    navigationStart?: number;
    loadEventEnd?: number;
    domContentLoadedEventEnd?: number;
  };
}

/**
 * Error export structure for Error Boundary
 */
export interface ErrorBoundaryExport {
  exportVersion: string;
  exportedAt: string;
  environment: EnvironmentInfo;
  error: {
    name: string;
    message: string;
    stack: string | undefined;
  };
  react: {
    componentStack: string | null;
  };
  browser: BrowserInfo;
  _notice: string;
}

/**
 * Timeframe preset options for admin errors export
 */
export type TimeframePreset = "1h" | "6h" | "24h" | "7d" | "30d";

/**
 * Error export structure for Admin Errors Tab (with timeframe)
 */
export interface AdminErrorsExport {
  exportVersion: string;
  exportedAt: string;
  timeframe: {
    type: "preset" | "custom";
    preset?: TimeframePreset;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalEvents: number;
    uniqueIssues: number;
    affectedUsers: number;
  };
  issues: Array<{
    title: string;
    count: number;
    userCount: number | null;
    firstSeen: string | null;
    lastSeen: string | null;
    status: string | null;
    shortId: string;
    level: string | null;
  }>;
  _notice: string;
}

/**
 * Get environment information for error context
 */
function getEnvironmentInfo(): EnvironmentInfo {
  return {
    nodeEnv: process.env.NODE_ENV,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    url: typeof window !== "undefined" ? window.location.href : "unknown",
    pathname: typeof window !== "undefined" ? window.location.pathname : "unknown",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get browser performance and memory info
 */
function getBrowserInfo(): BrowserInfo {
  const info: BrowserInfo = {
    viewport: {
      width: typeof window !== "undefined" ? window.innerWidth : 0,
      height: typeof window !== "undefined" ? window.innerHeight : 0,
    },
  };

  // Memory info (Chrome only)
  if (typeof performance !== "undefined" && "memory" in performance) {
    const memory = (performance as unknown as { memory?: PerformanceMemory }).memory;
    if (memory) {
      info.memory = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
  }

  // Navigation timing
  if (typeof performance !== "undefined" && "timing" in performance) {
    const timing = (performance as unknown as { timing?: PerformanceTiming }).timing;
    if (timing) {
      info.performance = {
        navigationStart: timing.navigationStart,
        loadEventEnd: timing.loadEventEnd,
        domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
      };
    }
  }

  return info;
}

// Type definitions for browser performance APIs
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Create an error export object from an Error Boundary catch
 */
export function createErrorBoundaryExport(
  error: Error,
  componentStack: string | null
): ErrorBoundaryExport {
  return {
    exportVersion: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    environment: getEnvironmentInfo(),
    error: {
      name: error.name,
      message: redactSensitive(error.message),
      stack: error.stack ? redactSensitive(error.stack) : undefined,
    },
    react: {
      componentStack: componentStack ? redactSensitive(componentStack) : null,
    },
    browser: getBrowserInfo(),
    _notice: "Sensitive data redacted. For Claude Code debugging.",
  };
}

/**
 * Calculate timeframe dates from a preset
 */
export function getTimeframeDates(preset: TimeframePreset): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (preset) {
    case "1h":
      startDate.setHours(startDate.getHours() - 1);
      break;
    case "6h":
      startDate.setHours(startDate.getHours() - 6);
      break;
    case "24h":
      startDate.setHours(startDate.getHours() - 24);
      break;
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
  }

  return { startDate, endDate };
}

/**
 * Create an admin errors export object with timeframe
 */
export function createAdminErrorsExport(
  issues: Array<{
    title: string;
    count: number;
    userCount?: number | null;
    firstSeen: string | null;
    lastSeen: string | null;
    status: string | null;
    shortId: string;
    level: string | null;
  }>,
  timeframe: {
    type: "preset" | "custom";
    preset?: TimeframePreset;
    startDate: Date;
    endDate: Date;
  },
  summary: {
    totalEvents: number;
    uniqueIssues: number;
    affectedUsers: number;
  }
): AdminErrorsExport {
  return {
    exportVersion: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    timeframe: {
      type: timeframe.type,
      preset: timeframe.preset,
      startDate: timeframe.startDate.toISOString(),
      endDate: timeframe.endDate.toISOString(),
    },
    summary,
    issues: issues.map((issue) => ({
      title: redactSensitive(issue.title),
      count: issue.count,
      userCount: issue.userCount ?? null,
      firstSeen: issue.firstSeen,
      lastSeen: issue.lastSeen,
      status: issue.status,
      shortId: issue.shortId,
      level: issue.level,
    })),
    _notice: "Sensitive data redacted. For Claude Code debugging.",
  };
}

/**
 * Download an error export as a JSON file
 */
export function downloadErrorExport(
  data: ErrorBoundaryExport | AdminErrorsExport,
  filename?: string
): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const defaultFilename = `error-report-${new Date().toISOString().split("T")[0]}.json`;
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy an error export to clipboard
 */
export async function copyErrorExportToClipboard(
  data: ErrorBoundaryExport | AdminErrorsExport
): Promise<boolean> {
  const json = JSON.stringify(data, null, 2);

  try {
    await navigator.clipboard.writeText(json);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = json;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}
