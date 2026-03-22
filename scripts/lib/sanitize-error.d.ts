/**
 * Type declarations for sanitize-error.js
 * Provides type-safe access to error sanitization utilities.
 *
 * NOTE: This is a .d.ts file (not .ts) to avoid tsx circular resolution.
 * tsx resolves .js imports to .ts files when both exist, which caused
 * infinite recursion when the .ts file re-exported from the .js file.
 */

export interface SanitizeOptions {
  preserveStackInDev?: boolean;
  verbose?: boolean;
}

export interface SafeLogger {
  error: (msg: string, error?: unknown) => void;
  warn: (msg: string, error?: unknown) => void;
  info: (msg: string) => void;
}

export declare function sanitizeError(error: unknown, options?: SanitizeOptions): string;
export declare function sanitizeErrorForJson(
  error: unknown,
  options?: SanitizeOptions
): { error: boolean; message: string; type: string };
export declare function createSafeLogger(prefix?: string): SafeLogger;
export declare function safeErrorMessage(error: unknown): string;
