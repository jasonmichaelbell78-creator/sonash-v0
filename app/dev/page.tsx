"use client";

/**
 * Development Dashboard - Main Page
 *
 * Features:
 * - Desktop-only (blocks mobile)
 * - Admin claim verification (same as admin panel)
 * - Tabbed interface for dev tooling
 * - Remote accessible via Firestore data
 */

import { useState, useEffect } from "react";
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { DevDashboard } from "@/components/dev/dev-dashboard";
import { logger } from "@/lib/logger";

type DevState = "loading" | "mobile" | "login" | "not-admin" | "authenticated";

export default function DevPage() {
  // Mobile detection - block dev dashboard on mobile devices
  const [state, setState] = useState<DevState>(() => {
    if (typeof window === "undefined") return "loading";
    const isMobile =
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    return isMobile ? "mobile" : "loading";
  });
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for mobile after mount (run once)
    const isMobile =
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (isMobile) {
      setState("mobile");
      return; // Don't set up auth listener on mobile
    }

    // Listen for auth state (single subscription on mount)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || firebaseUser.isAnonymous) {
        setState("login");
        setUser(null);
        return;
      }

      // Verify admin claim (same as admin panel - devs are admins)
      // Force refresh to catch recent claim changes
      try {
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        setUser(firebaseUser);
        setState(tokenResult.claims.admin === true ? "authenticated" : "not-admin");
      } catch (err) {
        const errorCode = (err as { code?: string })?.code;
        const errorType = err instanceof Error ? err.name : "UnknownError";
        logger.error("Error verifying admin claim for dev dashboard", { errorType, errorCode });
        setError(
          errorCode === "network-request-failed"
            ? "Network error - please check your connection"
            : "Failed to verify privileges"
        );
        setUser(null);
        setState("login");
      }
    });

    return () => unsubscribe();
  }, []); // Empty deps - run once on mount

  const handleLogin = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      // Use generic error message to avoid leaking Firebase internals
      const errorCode = (err as { code?: string })?.code;
      logger.error("Dev dashboard login failed", { errorCode });

      // Provide specific feedback for common issues
      setError(
        errorCode === "auth/popup-closed-by-user"
          ? "Login cancelled"
          : errorCode === "auth/popup-blocked"
            ? "Popup blocked - please allow popups and try again"
            : errorCode === "auth/network-request-failed"
              ? "Network error - please check your connection"
              : "Login failed - please try again"
      );
    }
  };

  const handleLogout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      const errorCode = (err as { code?: string })?.code;
      logger.error("Dev dashboard logout failed", { errorCode });
      setError("Sign out failed - please try again");
    } finally {
      setUser(null);
      setState("login");
    }
  };

  // Mobile block
  if (state === "mobile") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🖥️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Desktop Only</h1>
          <p className="text-gray-400">The dev dashboard is only available on desktop.</p>
        </div>
      </div>
    );
  }

  // Loading
  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // Login screen
  if (state === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🛠️</div>
            <h1 className="text-2xl font-bold text-white">Dev Dashboard</h1>
            <p className="text-gray-400 mt-2">Development tools & monitoring</p>
          </div>

          {error && (
            <div className="bg-red-900/50 text-red-300 p-3 rounded mb-4 text-sm border border-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // Not admin
  if (state === "not-admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-center border border-gray-700">
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-4">
            Your account ({user?.email}) does not have developer privileges.
          </p>
          <button onClick={handleLogout} className="text-blue-400 hover:underline">
            Sign out and try another account
          </button>
        </div>
      </div>
    );
  }

  // Authenticated developer
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return <DevDashboard user={user} onLogout={handleLogout} />;
}
