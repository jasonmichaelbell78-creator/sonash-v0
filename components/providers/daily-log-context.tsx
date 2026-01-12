"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User } from "firebase/auth";
import { FirestoreService, DailyLog } from "@/lib/firestore-service";

/**
 * DailyLogContext - Today's journal log state
 *
 * Separated from auth/profile to prevent re-renders when journal updates.
 * Only components that need today's log subscribe to this.
 */

interface DailyLogContextType {
  todayLog: DailyLog | null;
  todayLogError: string | null;
  refreshTodayLog: () => Promise<void>;
}

const DailyLogContext = createContext<DailyLogContextType>({
  todayLog: null,
  todayLogError: null,
  refreshTodayLog: async () => {},
});

interface DailyLogProviderProps {
  children: ReactNode;
  user: User | null;
}

export function DailyLogProvider({ children, user }: DailyLogProviderProps) {
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [todayLogError, setTodayLogError] = useState<string | null>(null);

  const refreshTodayLog = useCallback(async () => {
    if (!user) {
      setTodayLog(null);
      setTodayLogError(null);
      return;
    }

    const result = await FirestoreService.getTodayLog(user.uid);
    setTodayLog(result.log);
    setTodayLogError(result.error ? "Failed to load today's log" : null);
  }, [user]);

  // Fetch today's log when user changes
  useEffect(() => {
    let isMounted = true;

    const loadLog = async () => {
      if (!user) {
        if (isMounted) {
          setTodayLog(null);
          setTodayLogError(null);
        }
        return;
      }

      const result = await FirestoreService.getTodayLog(user.uid);
      if (isMounted) {
        setTodayLog(result.log);
        setTodayLogError(result.error ? "Failed to load today's log" : null);
      }
    };

    loadLog();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <DailyLogContext.Provider value={{ todayLog, todayLogError, refreshTodayLog }}>
      {children}
    </DailyLogContext.Provider>
  );
}

export const useDailyLog = () => useContext(DailyLogContext);
