import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Feature Flag System
 *
 * Checks if a feature is enabled via environment variables.
 * Uses an allowlist to prevent env var oracle attacks.
 *
 * Usage:
 * - Set NEXT_PUBLIC_ENABLE_[FEATURE_NAME]=true in .env.local
 * - Call featureFlagEnabled('NEXT_PUBLIC_ENABLE_FEATURE_NAME')
 *
 * Example:
 * - NEXT_PUBLIC_ENABLE_WORK=true → enables Work module
 * - NEXT_PUBLIC_ENABLE_MORE=true → enables More module
 *
 * @param featureId - Environment variable name (e.g., 'NEXT_PUBLIC_ENABLE_WORK')
 * @returns true if enabled, false otherwise
 */

// Allowlist of valid feature flags to prevent env var oracle attacks
// (probing arbitrary env vars via dynamic lookup)
const ALLOWED_FEATURE_FLAGS = new Set([
  "NEXT_PUBLIC_ENABLE_WORK",
  "NEXT_PUBLIC_ENABLE_MORE",
]);

// Static map with explicit env var references for Next.js client bundling
// (dynamic process.env[key] won't be inlined on client side)
const FEATURE_FLAG_VALUES: Record<string, string | undefined> = {
  NEXT_PUBLIC_ENABLE_WORK: process.env.NEXT_PUBLIC_ENABLE_WORK,
  NEXT_PUBLIC_ENABLE_MORE: process.env.NEXT_PUBLIC_ENABLE_MORE,
};

export function featureFlagEnabled(featureId: string): boolean {
  // Security: Only allow checking known feature flags
  if (!ALLOWED_FEATURE_FLAGS.has(featureId)) {
    return false;
  }

  // Use static env references so Next.js can inline on the client bundle
  const value = FEATURE_FLAG_VALUES[featureId];
  return value === "true" || value === "1";
}
