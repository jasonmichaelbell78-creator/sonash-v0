"use client";

import { useEffect } from "react";
import { initSentryClient } from "@/lib/sentry.client";

/**
 * SentryInitializer - Initialize Sentry error monitoring
 *
 * This component initializes Sentry on the client side.
 * It should be placed high in the component tree (in layout.tsx).
 *
 * Sentry is automatically:
 * - Disabled in development (unless NEXT_PUBLIC_SENTRY_ENABLED=true)
 * - Privacy-preserving (no PII captured)
 * - Environment-aware (tags dev vs production)
 */

// Module-level flag to prevent double initialization in React Strict Mode
let didInit = false;

export function SentryInitializer() {
  useEffect(() => {
    if (didInit) return;

    try {
      initSentryClient();
      didInit = true;
    } catch {
      // Allow retry on next mount if initialization fails
      didInit = false;
    }
  }, []);

  return null;
}
