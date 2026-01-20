"use client";

import { useEffect, useRef } from "react";
import { useAdminTabContext, type AdminTabId } from "@/lib/contexts/admin-tab-context";

/**
 * Hook for tabs to subscribe to refresh events.
 *
 * When the tab becomes active (and the refresh timestamp changes),
 * the provided callback will be invoked.
 *
 * @param tabId - The tab ID this hook is used in
 * @param onRefresh - Callback to invoke when tab should refresh
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function DashboardTab() {
 *   const [data, setData] = useState(null);
 *
 *   const loadData = useCallback(async () => {
 *     const result = await fetchDashboardData();
 *     setData(result);
 *   }, []);
 *
 *   // Auto-refresh when tab becomes active
 *   useTabRefresh("dashboard", loadData);
 *
 *   // Also load on mount
 *   useEffect(() => { loadData(); }, [loadData]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useTabRefresh(
  tabId: AdminTabId,
  onRefresh: () => void | Promise<void>,
  options: {
    /** Skip the initial refresh on mount (default: false) */
    skipInitial?: boolean;
  } = {}
): void {
  const { activeTab, getTabRefreshTimestamp } = useAdminTabContext();
  const lastRefreshRef = useRef<number>(0);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Only run for the tab this hook is registered to
    if (activeTab !== tabId) return;

    const currentTimestamp = getTabRefreshTimestamp(tabId);

    // Skip if this is the initial mount and skipInitial is true
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (options.skipInitial) {
        lastRefreshRef.current = currentTimestamp;
        return;
      }
    }

    // Check if timestamp actually changed (new refresh triggered)
    if (currentTimestamp > lastRefreshRef.current) {
      lastRefreshRef.current = currentTimestamp;
      // Call the refresh callback (fire-and-forget, but avoid unhandled rejections)
      // Use Promise.resolve to handle both void and Promise<void> return types
      Promise.resolve(onRefresh()).catch((error) => {
        // Review #186: Log refresh errors for debugging, but don't crash the app
        console.error("useTabRefresh: onRefresh callback failed", error);
      });
    }
  }, [activeTab, tabId, getTabRefreshTimestamp, onRefresh, options.skipInitial]);
}

/**
 * Hook to check if the current tab is active.
 *
 * Useful for conditionally rendering or pausing operations
 * when tab is not visible.
 *
 * @param tabId - The tab ID to check
 * @returns true if the tab is currently active
 */
export function useIsTabActive(tabId: AdminTabId): boolean {
  const { activeTab } = useAdminTabContext();
  return activeTab === tabId;
}
