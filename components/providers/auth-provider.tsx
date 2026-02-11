"use client";

/**
 * Unified Auth Provider - Composes focused contexts
 *
 * This file provides backward compatibility with the old `useAuth` hook
 * while using the new split contexts internally.
 *
 * New code should prefer the focused hooks:
 * - useAuthCore() - For auth-only state (user, loading, isAnonymous)
 * - useProfile() - For profile state
 * - useDailyLog() - For today's log state
 */

import { useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { AuthProvider as AuthProviderCore, useAuthCore } from "./auth-context";
import { ProfileProvider, useProfile } from "./profile-context";
import { DailyLogProvider, useDailyLog } from "./daily-log-context";

// Re-export focused hooks for new code
export { useAuthCore, useProfile, useDailyLog };

// Re-export for tests
export { ensureAnonymousSession } from "./auth-context";
export { refreshTodayLogForUser } from "./daily-log-context-utils";

interface UnifiedAuthProviderProps {
  children: ReactNode;
}

/**
 * Unified provider that composes all auth-related contexts
 *
 * Wrapping order matters - inner providers can access outer ones:
 * AuthProvider (outermost) → ProfileProvider → DailyLogProvider (innermost)
 */
export function AuthProvider({ children }: Readonly<UnifiedAuthProviderProps>) {
  // Track user for passing to child providers
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
    <AuthProviderCore onUserChange={setCurrentUser}>
      <ProfileProvider user={currentUser}>
        <DailyLogProvider user={currentUser}>{children}</DailyLogProvider>
      </ProfileProvider>
    </AuthProviderCore>
  );
}

/**
 * Backward-compatible hook that combines all contexts
 *
 * @deprecated Use focused hooks instead:
 * - useAuthCore() for user, loading, isAnonymous
 * - useProfile() for profile, profileError, profileNotFound
 * - useDailyLog() for todayLog, todayLogError, refreshTodayLog
 */
export function useAuth() {
  const auth = useAuthCore();
  const profile = useProfile();
  const dailyLog = useDailyLog();

  return {
    // Auth state
    user: auth.user,
    loading: auth.loading,
    isAnonymous: auth.isAnonymous,
    showLinkPrompt: auth.showLinkPrompt,
    // Profile state
    profile: profile.profile,
    profileError: profile.profileError,
    profileNotFound: profile.profileNotFound,
    // Daily log state
    todayLog: dailyLog.todayLog,
    todayLogError: dailyLog.todayLogError,
    refreshTodayLog: dailyLog.refreshTodayLog,
  };
}
