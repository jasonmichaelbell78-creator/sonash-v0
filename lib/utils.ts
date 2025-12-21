import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Feature Flag System
 * 
 * Checks if a feature is enabled via environment variables.
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
export function featureFlagEnabled(featureId: string): boolean {
  // In development, check environment variable
  // In production, default to false unless explicitly enabled

  if (typeof window === 'undefined') {
    // Server-side: Check process.env
    const value = process.env[featureId];
    return value === 'true' || value === '1';
  } else {
    // Client-side: Check process.env (bundled at build time by Next.js)
    // Next.js replaces process.env.NEXT_PUBLIC_* at build time
    const value = process.env[featureId];
    return value === 'true' || value === '1';
  }
}
