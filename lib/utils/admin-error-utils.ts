import { formatDistanceToNow } from "date-fns";

/**
 * Redact sensitive information from error messages.
 * Removes emails, phone numbers, and tokens to prevent PII exposure.
 */
export function redactSensitive(text: string): string {
  // Order matters: redact tokens first (before phone regex matches digits inside them)
  const redactedTokens = text.replace(/\b[a-f0-9]{32,}\b/gi, "[redacted-token]");
  const redactedEmail = redactedTokens.replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    "[redacted-email]"
  );
  // Phone regex: handles formats like (555) 123-4567, 555-123-4567, +1 555 123 4567
  // Note: Removed \b word boundaries since they don't work with parentheses
  const redactedPhone = redactedEmail.replace(
    /(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/g,
    "[redacted-phone]"
  );
  return redactedPhone;
}

/**
 * Safely format a date string to relative time.
 * Returns "Unknown" if the date is null, empty, or invalid.
 */
export function safeFormatDate(dateString: string | null): string {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Validate that a URL is safe to render as a link.
 * Only allows https://sentry.io URLs to prevent injection attacks.
 * Must be exactly sentry.io or a subdomain like app.sentry.io
 */
export function isValidSentryUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    // Must be exactly "sentry.io" or end with ".sentry.io" (subdomain)
    const isValidHost = hostname === "sentry.io" || hostname.endsWith(".sentry.io");
    return parsed.protocol === "https:" && isValidHost;
  } catch {
    return false;
  }
}
