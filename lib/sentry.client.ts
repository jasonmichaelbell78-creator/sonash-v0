/**
 * Sentry Client Configuration for SoNash
 * 
 * Privacy-preserving error monitoring:
 * - No PII captured (emails, names, etc.)
 * - User IDs are hashed before being sent
 * - Environment-aware (dev vs production)
 */

import * as Sentry from "@sentry/nextjs";
import { createHash } from "crypto";

// Hash user ID for privacy
function hashUserId(userId: string): string {
    return createHash("sha256").update(userId).digest("hex").substring(0, 16);
}

/**
 * Initialize Sentry for client-side error monitoring
 * Call this once in your app layout or root component
 */
export function initSentryClient(): void {
    // Only initialize in browser
    if (typeof window === "undefined") return;

    // Skip in development unless explicitly enabled
    const isDev = process.env.NODE_ENV === "development";
    const forceEnable = process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true";

    if (isDev && !forceEnable) {
        console.log("[Sentry] Skipped in development. Set NEXT_PUBLIC_SENTRY_ENABLED=true to enable.");
        return;
    }

    Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

        // Environment tag for filtering in Sentry dashboard
        environment: isDev ? "development" : "production",

        // Sample rate for performance monitoring (10% in prod)
        tracesSampleRate: isDev ? 1.0 : 0.1,

        // Don't capture PII
        beforeSend(event) {
            // Redact any email addresses in error messages
            if (event.message) {
                event.message = event.message.replace(
                    /[\w.-]+@[\w.-]+\.\w+/g,
                    "[EMAIL_REDACTED]"
                );
            }

            // Redact breadcrumb data that might contain PII
            if (event.breadcrumbs) {
                event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
                    if (breadcrumb.data) {
                        // Remove any potential PII fields
                        const { email: _email, name: _name, phone: _phone, ...safeData } = breadcrumb.data as Record<string, unknown>;
                        breadcrumb.data = safeData;
                    }
                    return breadcrumb;
                });
            }

            return event;
        },

        // Don't send replay data (contains PII)
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
    });
}

/**
 * Set user context with hashed ID (call after auth)
 */
export function setSentryUser(userId: string | null): void {
    if (userId) {
        Sentry.setUser({
            id: hashUserId(userId),
            // No email, username, or other PII
        });
    } else {
        Sentry.setUser(null);
    }
}

/**
 * Capture a custom error with additional context
 */
export function captureError(
    error: Error,
    context?: Record<string, unknown>
): void {
    Sentry.captureException(error, {
        extra: context,
    });
}

/**
 * Add a breadcrumb for user actions
 */
export function addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, unknown>
): void {
    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: "info",
    });
}
