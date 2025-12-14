/**
 * Security Event Logger for Cloud Functions
 * 
 * Logs security-related events in structured JSON format for GCP Cloud Logging.
 * Events are searchable via GCP Logs Explorer.
 */

import * as Sentry from "@sentry/node";

// Security event types
export type SecurityEventType =
    | "AUTH_FAILURE"
    | "RATE_LIMIT_EXCEEDED"
    | "APP_CHECK_FAILURE"
    | "VALIDATION_FAILURE"
    | "AUTHORIZATION_FAILURE"
    | "SAVE_SUCCESS"
    | "SAVE_FAILURE"
    | "DATA_EXPORT_REQUESTED"
    | "DATA_EXPORT_SUCCESS"
    | "DATA_EXPORT_FAILURE"
    | "ACCOUNT_DELETE_REQUESTED"
    | "ACCOUNT_DELETE_SUCCESS"
    | "ACCOUNT_DELETE_FAILURE";

// Severity levels (aligned with GCP Cloud Logging)
export type Severity = "INFO" | "WARNING" | "ERROR";

interface SecurityEvent {
    type: SecurityEventType;
    severity: Severity;
    userId?: string;  // Hashed for privacy
    functionName: string;
    message: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
}

// Simple hash function for user IDs (privacy protection)
function hashUserId(userId: string): string {
    // Use first 8 chars of a simple hash for log correlation
    // Not cryptographically secure, but sufficient for log grouping
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
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
    }
): void {
    const severity = options?.severity ?? getSeverityForType(type);

    const event: SecurityEvent = {
        type,
        severity,
        userId: options?.userId ? hashUserId(options.userId) : undefined,
        functionName,
        message,
        metadata: options?.metadata,
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
                ...options?.metadata,
                userIdHash: options?.userId ? hashUserId(options.userId) : undefined,
            },
        });
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
        case "DATA_EXPORT_FAILURE":
        case "ACCOUNT_DELETE_FAILURE":
            return "ERROR";
        case "VALIDATION_FAILURE":
        case "SAVE_SUCCESS":
        case "DATA_EXPORT_REQUESTED":
        case "DATA_EXPORT_SUCCESS":
        case "ACCOUNT_DELETE_SUCCESS":
            return "INFO";
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
