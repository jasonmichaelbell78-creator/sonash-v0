/**
 * Security Event Logger for Cloud Functions
 *
 * Logs security-related events in structured JSON format for GCP Cloud Logging.
 * Events are searchable via GCP Logs Explorer.
 * Also stores events in Firestore for the admin panel logs tab.
 */

import * as Sentry from "@sentry/node";
import { createHash } from "crypto";
import * as admin from "firebase-admin";

// Security event types
export type SecurityEventType =
  | "AUTH_FAILURE"
  | "RATE_LIMIT_EXCEEDED"
  | "APP_CHECK_FAILURE"
  | "VALIDATION_FAILURE"
  | "AUTHORIZATION_FAILURE"
  | "SAVE_SUCCESS"
  | "SAVE_FAILURE"
  | "DELETE_SUCCESS"
  | "DELETE_FAILURE"
  | "DATA_EXPORT_REQUESTED"
  | "DATA_EXPORT_SUCCESS"
  | "DATA_EXPORT_FAILURE"
  | "ACCOUNT_DELETE_REQUESTED"
  | "ACCOUNT_DELETE_SUCCESS"
  | "ACCOUNT_DELETE_FAILURE"
  | "DATA_MIGRATION_SUCCESS"
  | "DATA_MIGRATION_FAILURE"
  | "PARTIAL_MIGRATION_FAILURE"
  | "ADMIN_ACTION"
  | "ADMIN_ERROR"
  | "HEALTH_CHECK_FAILURE"
  | "JOB_SUCCESS"
  | "JOB_FAILURE"
  | "RECAPTCHA_CONFIG_ERROR"
  | "RECAPTCHA_MISSING_TOKEN"
  | "RECAPTCHA_BYPASSED"
  | "RECAPTCHA_API_ERROR"
  | "RECAPTCHA_INVALID_TOKEN"
  | "RECAPTCHA_ACTION_MISMATCH"
  | "RECAPTCHA_LOW_SCORE"
  | "RECAPTCHA_SUCCESS"
  | "RECAPTCHA_UNEXPECTED_ERROR";

// Severity levels (aligned with GCP Cloud Logging)
export type Severity = "INFO" | "WARNING" | "ERROR";

interface SecurityEvent {
  type: SecurityEventType;
  severity: Severity;
  userId?: string; // Hashed for privacy
  functionName: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Cryptographic hash function for user IDs (GDPR/HIPAA compliant)
 * Uses SHA-256 for irreversible hashing while maintaining log correlation
 *
 * @param userId - The user ID to hash
 * @returns First 12 chars of SHA-256 hash (sufficient for uniqueness, ~68 bits of entropy)
 */
export function hashUserId(userId: string): string {
  // Use SHA-256 for cryptographically secure, one-way hashing
  // Truncate to 12 chars for readability while maintaining collision resistance
  // (2^48 possible values = ~281 trillion combinations)
  const hash = createHash("sha256").update(userId).digest("hex");

  return hash.substring(0, 12);
}

/**
 * Log a security event to GCP Cloud Logging
 *
 * Events are structured JSON for easy querying in Logs Explorer:
 * - Search by type: jsonPayload.securityEvent.type="AUTH_FAILURE"
 * - Search by severity: severity="WARNING"
 */
export function logSecurityEvent(
  type: SecurityEventType,
  functionName: string,
  message: string,
  options?: {
    userId?: string;
    severity?: Severity;
    metadata?: Record<string, unknown>;
    captureToSentry?: boolean;
    storeInFirestore?: boolean; // Force store INFO events in Firestore
  }
): void {
  const severity = options?.severity ?? getSeverityForType(type);

  // SECURITY: Redact metadata BEFORE logging to console/Sentry (not just Firestore)
  // This prevents sensitive error strings from leaking to Cloud Logging
  const redactedMetadata = redactSensitiveMetadata(options?.metadata);

  const event: SecurityEvent = {
    type,
    severity,
    userId: options?.userId ? hashUserId(options.userId) : undefined,
    functionName,
    message,
    metadata: redactedMetadata, // Use redacted metadata in event
    timestamp: new Date().toISOString(),
  };

  // Structured logging for GCP Cloud Logging
  const logEntry = {
    severity,
    message: `[${type}] ${message}`,
    securityEvent: event,
  };

  // Use appropriate console method based on severity
  switch (severity) {
    case "ERROR":
      console.error(JSON.stringify(logEntry));
      break;
    case "WARNING":
      console.warn(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }

  // Capture warnings and errors to Sentry
  if (options?.captureToSentry !== false && severity !== "INFO") {
    Sentry.captureMessage(message, {
      level: severity === "ERROR" ? "error" : "warning",
      tags: {
        securityEventType: type,
        functionName,
      },
      extra: {
        ...redactedMetadata, // Use redacted metadata for Sentry too
        userIdHash: options?.userId ? hashUserId(options.userId) : undefined,
      },
    });
  }

  // Store in Firestore for admin panel logs tab (non-blocking)
  // Only store WARNING and ERROR events to avoid excessive writes
  if (severity !== "INFO" || options?.storeInFirestore) {
    storeLogInFirestore(event).catch((err) => {
      // Don't log errors about logging to prevent infinite loops
      // SECURITY: Sanitize error - only log type, not full object (may contain sensitive details)
      const errorType = err instanceof Error ? err.name : "UnknownError";
      console.error(`Failed to store security event in Firestore: ${errorType}`);
    });
  }
}

/**
 * Sensitive keys that should be redacted from metadata
 * Includes common PII and secret patterns
 */
const SENSITIVE_KEYS = [
  "token",
  "authorization",
  "password",
  "secret",
  "cookie",
  "apikey",
  "email",
  "phone",
  "ssn",
  "credit",
  "card",
  "bearer",
  "session",
  "refresh",
  "access",
  "error", // SECURITY: String(error) can contain sensitive stack traces, internal paths, PII
];

/**
 * Check if a key name indicates sensitive data
 */
function isSensitiveKey(key: string): boolean {
  const keyLower = key.toLowerCase();
  return SENSITIVE_KEYS.some((sensitive) => keyLower.includes(sensitive));
}

/**
 * Check if a value is a plain object (not Date, Timestamp, etc.)
 * Prevents corrupting special object types during redaction
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Redact sensitive keys from metadata before persisting to Firestore
 * Prevents PII/secrets from being stored in the security_logs collection
 * SECURITY: Recursively scans nested objects and arrays
 * EXPORTED: Also used for defense-in-depth redaction on read (adminGetLogs)
 */
export function redactSensitiveMetadata(
  metadata?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  // SECURITY: Non-plain objects (Error, class instances, custom prototypes) may contain
  // sensitive data in their properties. Convert to safe string representation to prevent
  // accidental PII/secret exposure while still providing some debugging context.
  if (!isPlainObject(metadata)) {
    // For Error-like objects, extract only safe properties
    if (metadata instanceof Error) {
      return { errorType: metadata.name, errorMessage: "[REDACTED]" };
    }
    // For other non-plain objects (Timestamp, Date, class instances), just indicate type
    const constructorName = metadata.constructor?.name || "UnknownType";
    return { nonPlainObjectType: constructorName, value: "[NON_PLAIN_OBJECT]" };
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      // Redact sensitive keys at any level
      if (isSensitiveKey(key)) return [key, "[REDACTED]"];

      // Recursively redact nested plain objects (not Date, Timestamp, etc.)
      if (isPlainObject(value)) {
        return [key, redactSensitiveMetadata(value)];
      }

      // Recursively redact arrays containing plain objects
      if (Array.isArray(value)) {
        return [
          key,
          value.map((item) => (isPlainObject(item) ? redactSensitiveMetadata(item) : item)),
        ];
      }

      // Truncate very large string values (>2000 chars)
      if (typeof value === "string" && value.length > 2000) {
        return [key, `${value.slice(0, 2000)}…[truncated]`];
      }

      return [key, value];
    })
  );
}

// Maximum field lengths for Firestore log documents
const MAX_MESSAGE_LEN = 2000;
const MAX_FUNCTION_LEN = 200;

/**
 * Redact common PII patterns from message strings before persisting
 * SECURITY: Prevents accidental PII exposure via log messages
 * Patterns: emails, phone numbers, IPs, file paths with usernames
 * ROBUSTNESS: Uses bounded regex to prevent ReDoS attacks
 */
function redactPiiFromMessage(message: string): string {
  if (!message || typeof message !== "string") return message;

  // SECURITY: Cap input length to prevent ReDoS on large payloads
  const MAX_LEN = 10000;
  const input = message.length > MAX_LEN ? message.slice(0, MAX_LEN) : message;

  return (
    input
      // Email addresses (RFC 5321: local≤64, domain≤255, TLD≤63)
      // SECURITY: Bounded quantifiers prevent ReDoS
      .replace(/[\w.+-]{1,64}@[\w.-]{1,255}\.[a-z]{2,63}/gi, "[EMAIL]")
      // Phone numbers (various formats)
      .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE]")
      // IPv4 addresses (except localhost/private ranges for debugging)
      .replace(
        /\b(?!127\.0\.0\.1|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
        "[IP]"
      )
      // File paths with usernames (Windows/Unix)
      .replace(/(?:\/home\/|\/Users\/|C:\\Users\\)[^\s\\/]+/gi, "[USER_PATH]")
      // JWT tokens (3 base64 segments)
      .replace(/eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+/g, "[JWT]")
  );
}

/**
 * Store security event in Firestore for admin panel access
 * Non-blocking - errors are caught and logged without affecting the main flow
 */
async function storeLogInFirestore(event: SecurityEvent): Promise<void> {
  try {
    const db = admin.firestore();

    // Truncate and redact before storing to prevent exceeding document size limits
    const redactedEvent = {
      ...event,
      // ROBUSTNESS: Truncate functionName to prevent oversized documents
      functionName:
        typeof event.functionName === "string"
          ? event.functionName.slice(0, MAX_FUNCTION_LEN)
          : event.functionName,
      // ROBUSTNESS: Truncate message to prevent exceeding 1MB document limit
      // SECURITY: Redact PII patterns from message before storing
      message:
        typeof event.message === "string"
          ? (() => {
              const redacted = redactPiiFromMessage(event.message);
              return redacted.length > MAX_MESSAGE_LEN
                ? `${redacted.slice(0, MAX_MESSAGE_LEN)}…[truncated]`
                : redacted;
            })()
          : event.message,
      metadata: redactSensitiveMetadata(event.metadata),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      // SECURITY: Use Firestore Timestamp for TTL policy compatibility
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ), // 30 days TTL
    };

    await db.collection("security_logs").add(redactedEvent);
  } catch (err) {
    // Log to console to make the error visible for debugging,
    // but don't re-trigger the security logger to avoid loops.
    // SECURITY: Sanitize error - only log type, not full object (may contain sensitive details)
    // COMPLIANCE: Use structured JSON format for consistent log parsing
    const errorType = err instanceof Error ? err.name : "UnknownError";
    const structuredLog = {
      severity: "ERROR",
      message: "Failed to store security event in Firestore",
      error: { type: errorType },
      timestamp: new Date().toISOString(),
    };
    console.error(JSON.stringify(structuredLog));
  }
}

// Default severity mapping
function getSeverityForType(type: SecurityEventType): Severity {
  switch (type) {
    case "AUTH_FAILURE":
    case "RATE_LIMIT_EXCEEDED":
    case "APP_CHECK_FAILURE":
    case "ACCOUNT_DELETE_REQUESTED":
      return "WARNING";
    case "AUTHORIZATION_FAILURE":
    case "SAVE_FAILURE":
    case "DELETE_FAILURE":
    case "DATA_EXPORT_FAILURE":
    case "ACCOUNT_DELETE_FAILURE":
    case "DATA_MIGRATION_FAILURE":
    case "PARTIAL_MIGRATION_FAILURE":
    case "ADMIN_ERROR":
    case "HEALTH_CHECK_FAILURE":
      return "ERROR";
    case "VALIDATION_FAILURE":
    case "SAVE_SUCCESS":
    case "DELETE_SUCCESS":
    case "DATA_EXPORT_REQUESTED":
    case "DATA_EXPORT_SUCCESS":
    case "ACCOUNT_DELETE_SUCCESS":
    case "DATA_MIGRATION_SUCCESS":
    case "ADMIN_ACTION":
    case "JOB_SUCCESS":
      return "INFO";
    case "JOB_FAILURE":
      return "ERROR";
    default:
      return "INFO";
  }
}

/**
 * Initialize Sentry for Cloud Functions
 * Call this once at module load time
 */
export function initSentry(dsn: string): void {
  Sentry.init({
    dsn,
    environment: process.env.FUNCTIONS_EMULATOR === "true" ? "development" : "production",
    // Don't capture PII
    beforeSend(event) {
      // Remove any potential PII from error messages
      if (event.message) {
        // Strip email-like patterns
        event.message = event.message.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[EMAIL_REDACTED]");
      }
      return event;
    },
    // Sample rate for performance (adjust as needed)
    tracesSampleRate: 0.1,
  });
}

/**
 * Flush Sentry events (call before function returns)
 */
export async function flushSentry(): Promise<void> {
  await Sentry.close(2000);
}
