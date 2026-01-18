"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/**
 * Available admin tabs
 */
export type AdminTabId =
  | "dashboard"
  | "users"
  | "privileges"
  | "jobs"
  | "errors"
  | "logs"
  | "meetings"
  | "sober-living"
  | "quotes"
  | "slogans"
  | "links"
  | "prayers"
  | "glossary";

/**
 * Refresh timestamps per tab (to track when each tab was last refreshed)
 */
type RefreshTimestamps = Record<AdminTabId, number>;

/**
 * Admin Tab Context value
 */
interface AdminTabContextValue {
  /** Currently active tab ID */
  activeTab: AdminTabId;
  /** Set the active tab (triggers refresh if tab changed) */
  setActiveTab: (tab: AdminTabId) => void;
  /** Timestamp when the current tab was last activated/refreshed */
  lastRefreshTimestamp: number;
  /** Get the last refresh timestamp for a specific tab */
  getTabRefreshTimestamp: (tabId: AdminTabId) => number;
  /** Force refresh the current tab */
  refreshCurrentTab: () => void;
}

const AdminTabContext = createContext<AdminTabContextValue | null>(null);

/**
 * Minimum interval between auto-refreshes (30 seconds)
 * Prevents excessive API calls when rapidly switching tabs
 */
const MIN_REFRESH_INTERVAL_MS = 30_000;

interface AdminTabProviderProps {
  children: ReactNode;
  defaultTab?: AdminTabId;
}

/**
 * Provider for admin tab state management.
 *
 * Features:
 * - Tracks active tab and refresh timestamps per tab
 * - Provides setActiveTab that updates refresh timestamp
 * - 30-second minimum interval between auto-refreshes
 */
export function AdminTabProvider({ children, defaultTab = "dashboard" }: AdminTabProviderProps) {
  const [activeTab, setActiveTabState] = useState<AdminTabId>(defaultTab);

  // Track refresh timestamps per tab (when each was last refreshed)
  const [refreshTimestamps, setRefreshTimestamps] = useState<RefreshTimestamps>(() => {
    const now = Date.now();
    return {
      dashboard: now,
      users: 0,
      privileges: 0,
      jobs: 0,
      errors: 0,
      logs: 0,
      meetings: 0,
      "sober-living": 0,
      quotes: 0,
      slogans: 0,
      links: 0,
      prayers: 0,
      glossary: 0,
    };
  });

  const setActiveTab = useCallback(
    (tab: AdminTabId) => {
      if (tab === activeTab) return; // No change

      const now = Date.now();
      const lastRefresh = refreshTimestamps[tab];
      const shouldRefresh = now - lastRefresh >= MIN_REFRESH_INTERVAL_MS;

      setActiveTabState(tab);

      if (shouldRefresh) {
        setRefreshTimestamps((prev) => ({
          ...prev,
          [tab]: now,
        }));
      }
    },
    [activeTab, refreshTimestamps]
  );

  const refreshCurrentTab = useCallback(() => {
    setRefreshTimestamps((prev) => ({
      ...prev,
      [activeTab]: Date.now(),
    }));
  }, [activeTab]);

  const getTabRefreshTimestamp = useCallback(
    (tabId: AdminTabId) => refreshTimestamps[tabId],
    [refreshTimestamps]
  );

  const value: AdminTabContextValue = {
    activeTab,
    setActiveTab,
    lastRefreshTimestamp: refreshTimestamps[activeTab],
    getTabRefreshTimestamp,
    refreshCurrentTab,
  };

  return <AdminTabContext.Provider value={value}>{children}</AdminTabContext.Provider>;
}

/**
 * Hook to access admin tab context
 * @throws Error if used outside AdminTabProvider
 */
export function useAdminTabContext(): AdminTabContextValue {
  const context = useContext(AdminTabContext);
  if (!context) {
    throw new Error("useAdminTabContext must be used within an AdminTabProvider");
  }
  return context;
}
