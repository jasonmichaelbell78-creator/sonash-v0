"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/lib/logger";
import {
  createErrorBoundaryExport,
  downloadErrorExport,
  copyErrorExportToClipboard,
} from "@/lib/utils/error-export";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
  copySuccess: boolean;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the
 * child component tree and displays a fallback UI instead of crashing.
 *
 * Features:
 * - Error logging to our logging service
 * - Error export for Claude Code debugging (Download JSON / Copy to Clipboard)
 * - Retry and reload options
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  // CLEANUP: Track timeout to clear on unmount
  private copySuccessTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null, copySuccess: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Store componentStack for export
    this.setState({ componentStack: errorInfo.componentStack || null });

    // Log error to our logging service
    logger.error("ErrorBoundary caught error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  // CLEANUP: Clear timeout on unmount to prevent React warnings
  componentWillUnmount(): void {
    if (this.copySuccessTimeout) {
      clearTimeout(this.copySuccessTimeout);
      this.copySuccessTimeout = null;
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, componentStack: null, copySuccess: false });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleDownloadReport = (): void => {
    if (!this.state.error) return;

    const exportData = createErrorBoundaryExport(this.state.error, this.state.componentStack);
    downloadErrorExport(exportData, `error-report-${Date.now()}.json`);
  };

  handleCopyToClipboard = async (): Promise<void> => {
    if (!this.state.error) return;

    const exportData = createErrorBoundaryExport(this.state.error, this.state.componentStack);
    const success = await copyErrorExportToClipboard(exportData);

    if (success) {
      this.setState({ copySuccess: true });

      // Clear any existing timeout before setting a new one
      if (this.copySuccessTimeout) clearTimeout(this.copySuccessTimeout);
      this.copySuccessTimeout = setTimeout(() => {
        this.copySuccessTimeout = null;
        this.setState({ copySuccess: false });
      }, 2000);
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">📓</div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We hit a snag loading your notebook. This has been logged and we&apos;ll look into it.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Error Export Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-3">
                Need help debugging? Export error details for AI assistance.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={this.handleDownloadReport}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Report
                </button>
                <button
                  onClick={this.handleCopyToClipboard}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${
                    this.state.copySuccess
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {this.state.copySuccess ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy to Clipboard
                    </>
                  )}
                </button>
              </div>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
