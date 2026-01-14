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
export function SentryInitializer() {
  useEffect(() => {
    initSentryClient();
  }, []);

  return null;
}
