/**
 * Type declarations for sanitize-error.js
 * Provides type-safe access to error sanitization utilities.
 *
 * NOTE: This is a .d.ts file (not .ts) to avoid tsx circular resolution.
 * tsx resolves .js imports to .ts files when both exist, which caused
 * infinite recursion when the .ts file re-exported from the .js file.
 */

export declare function sanitizeError(error: unknown): string;
export declare function sanitizeErrorForJson(error: unknown): Record<string, unknown>;
export declare function createSafeLogger(prefix: string): {
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
};
export declare function safeErrorMessage(error: unknown): string;
