import { FirestoreService, DailyLog } from "@/lib/firestore-service";

/**
 * Utility function for refreshing today's log
 * Exported for testing purposes
 */
export const refreshTodayLogForUser = async (
  firestoreService: typeof FirestoreService,
  userId: string,
  setTodayLog: (log: DailyLog | null) => void,
  setTodayLogError: (message: string | null) => void
) => {
  const result = await firestoreService.getTodayLog(userId);
  setTodayLog(result.log);
  setTodayLogError(result.error ? "Failed to load today's log" : null);
};
