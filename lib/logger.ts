import * as Sentry from "@sentry/nextjs";

export type LogContext = Record<string, unknown>;

type LogLevel = "info" | "warn" | "error";

const SENSITIVE_KEYS = [
  "token",
  "authorization",
  "password",
  "uid",
  "email",
  "auth",
  "idToken",
  "accessToken",
  "refreshToken",
];

// Environment detection
const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

/**
 * Check if a string looks like a sensitive identifier (token, ID, key)
 * These are typically long alphanumeric strings without spaces
 */
const looksLikeSensitiveId = (value: string): boolean => {
  // Must be at least 12 chars and contain no spaces or common punctuation
  // Matches: Firebase UIDs, API keys, tokens, etc.
  return value.length >= 12 && /^[A-Za-z0-9_\-.:]+$/.test(value);
};

const redactValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: isDevelopment ? value.stack : undefined,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, val]) => {
        acc[key] = SENSITIVE_KEYS.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey))
          ? "[REDACTED]"
          : redactValue(val);
        return acc;
      },
      {}
    );
  }

  if (typeof value === "string") {
    // Only redact strings that look like identifiers/tokens
    // Preserve normal text like error messages, status strings, etc.
    if (looksLikeSensitiveId(value)) {
      return `${value.slice(0, 4)}…[REDACTED]`;
    }
    return value;
  }

  return value;
};

const sanitizeContext = (context?: LogContext) => {
  if (!context) return undefined;
  return Object.entries(context).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[key] = redactValue(value);
    return acc;
  }, {});
};

const log = (level: LogLevel, message: string, context?: LogContext) => {
  const payload: Record<string, unknown> = {
    level,
    message,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ...(context ? { context: sanitizeContext(context) } : {}),
  };

  // Only log to console in development and test environments
  if (isDevelopment || isTest) {
    if (level === "info") {
      console.log(payload);
    } else if (level === "warn") {
      console.warn(payload);
    } else {
      console.error(payload);
    }
  }

  // In production, log errors to console and send to Sentry
  if (isProduction && level === "error") {
    console.error({
      level: payload.level,
      message: payload.message,
      timestamp: payload.timestamp,
    });

    // Send to Sentry with sanitized context
    // Wrapped in try/catch to prevent Sentry failures from crashing the application
    try {
      Sentry.captureMessage(message, {
        level: "error",
        extra: sanitizeContext(context),
      });
    } catch {
      // Non-fatal: Sentry logging failure should not crash the app
      // The error is already logged to console above
    }
  }
};

export const logger = {
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};

export const maskIdentifier = (value: string | null | undefined) => {
  if (!value) return "[unknown]";
  return value.length > 6 ? `${value.slice(0, 3)}…${value.slice(-2)}` : value;
};
