import { formatDistanceToNow } from "date-fns";

/**
 * Redact sensitive information from error messages.
 * Removes emails, phone numbers, and tokens to prevent PII exposure.
 */
export function redactSensitive(text: string): string {
  // Order matters: redact tokens first (before phone regex matches digits inside them)
  const redactedTokens = text.replace(/\b[a-f0-9]{32,}\b/gi, "[redacted-token]");
  // Email regex with length limits to prevent ReDoS (catastrophic backtracking)
  // Local part: max 64 chars, Domain: max 253 chars per RFC 5321
  const redactedEmail = redactedTokens.replace(
    /[A-Z0-9._%+-]{1,64}@[A-Z0-9.-]{1,253}\.[A-Z]{2,}/gi,
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
  // Handle null, empty, and whitespace-only strings
  if (!dateString?.trim()) return "Unknown";
  const date = new Date(dateString.trim());
  if (Number.isNaN(date.getTime())) return "Unknown";
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Validate that a URL is safe to render as a link.
 * Only allows https://sentry.io URLs to prevent injection attacks.
 * Must be exactly sentry.io or a subdomain like app.sentry.io
 */
export function isValidSentryUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be exactly "sentry.io" or end with ".sentry.io" (subdomain)
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "sentry.io" || parsed.hostname.endsWith(".sentry.io"))
    );
  } catch {
    // Invalid URL (null, empty, malformed) - return false
    return false;
  }
}
