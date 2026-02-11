"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "@/lib/firebase";
import { User, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { logger } from "@/lib/logger";
import { shouldShowLinkPrompt } from "@/lib/auth/account-linking";
import { setSentryUser } from "@/lib/sentry.client";

/**
 * AuthContext - Core authentication state
 *
 * Contains only auth-related state that rarely changes:
 * - user: Firebase User object
 * - loading: Initial auth state loading
 * - isAnonymous: Whether user is anonymous
 * - showLinkPrompt: Whether to show account linking prompt
 */

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  showLinkPrompt: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAnonymous: false,
  showLinkPrompt: false,
});

export const ensureAnonymousSession = async (
  authInstance: typeof auth,
  setLoading: (value: boolean) => void,
  signIn: typeof signInAnonymously = signInAnonymously
) => {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await signIn(authInstance);
      setLoading(false);
      return; // Success!
    } catch (error) {
      logger.error(`Error starting anonymous session (attempt ${attempt + 1}/${MAX_RETRIES + 1})`, {
        error,
      });

      // If this was the last attempt, give up
      if (attempt === MAX_RETRIES) {
        setLoading(false);
        // Show user-facing error
        const errorMessage =
          error instanceof Error ? error.message : "Unable to connect to authentication service";
        logger.error("Failed to start anonymous session after retries", {
          error: errorMessage,
          attempts: MAX_RETRIES + 1,
        });

        // You could also throw here to let the caller handle it,
        // or set an error state if you add that to the component
        return;
      }

      // Wait before retrying (exponential backoff)
      const delay = BASE_DELAY * Math.pow(2, attempt);
      logger.info(`Retrying anonymous sign-in in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

interface AuthProviderProps {
  children: ReactNode;
  onUserChange?: (user: User | null) => void;
}

export function AuthProvider({ children, onUserChange }: Readonly<AuthProviderProps>) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      onUserChange?.(currentUser);

      // Update Sentry user context (hashed ID, no PII)
      setSentryUser(currentUser?.uid ?? null);

      if (currentUser) {
        setLoading(false);

        // Update lastActive timestamp for non-anonymous users
        if (!currentUser.isAnonymous) {
          try {
            await updateDoc(doc(db, "users", currentUser.uid), {
              lastActive: serverTimestamp(),
            });
          } catch (error) {
            // Silently fail - this is not critical
            logger.warn("Failed to update lastActive timestamp", { error });
          }
        }
      } else {
        setLoading(true);
        await ensureAnonymousSession(auth, setLoading);
      }
    });

    return unsubscribe;
  }, [onUserChange]);

  // Computed values
  const isAnonymous = user?.isAnonymous ?? false;
  const showLinkPrompt = shouldShowLinkPrompt(user);

  return (
    <AuthContext.Provider value={{ user, loading, isAnonymous, showLinkPrompt }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthCore = () => useContext(AuthContext);
