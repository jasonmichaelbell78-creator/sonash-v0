import assert from "node:assert/strict";
import { test, describe } from "node:test";
import {
  redactSensitive,
  safeFormatDate,
  isValidSentryUrl,
} from "../../lib/utils/admin-error-utils";

describe("admin-error-utils", () => {
  describe("redactSensitive", () => {
    test("redacts email addresses", () => {
      const input = "Error for user test@example.com";
      const result = redactSensitive(input);
      assert.equal(result, "Error for user [redacted-email]");
      assert.ok(!result.includes("test@example.com"));
    });

    test("redacts multiple email addresses", () => {
      const input = "Users john@test.com and jane@example.org had errors";
      const result = redactSensitive(input);
      assert.ok(!result.includes("john@test.com"));
      assert.ok(!result.includes("jane@example.org"));
      assert.ok(result.includes("[redacted-email]"));
    });

    test("redacts phone numbers - standard format", () => {
      const input = "Contact: 555-123-4567";
      const result = redactSensitive(input);
      assert.equal(result, "Contact: [redacted-phone]");
    });

    test("redacts phone numbers - with area code parentheses", () => {
      const input = "Call (555) 123-4567 for support";
      const result = redactSensitive(input);
      assert.ok(result.includes("[redacted-phone]"));
      assert.ok(!result.includes("555"));
    });

    test("redacts phone numbers - with country code", () => {
      const input = "International: +1-555-123-4567";
      const result = redactSensitive(input);
      assert.ok(result.includes("[redacted-phone]"));
    });

    test("redacts long hex tokens", () => {
      const token = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6"; // 36 chars
      const input = `Token: ${token}`;
      const result = redactSensitive(input);
      assert.equal(result, "Token: [redacted-token]");
      assert.ok(!result.includes(token));
    });

    test("redacts multiple token formats", () => {
      const input = "Keys: abcdef0123456789abcdef0123456789 and fedcba9876543210fedcba9876543210";
      const result = redactSensitive(input);
      assert.ok(!result.includes("abcdef"));
      assert.ok(!result.includes("fedcba"));
    });

    test("preserves non-sensitive text", () => {
      const input = "Error in component UserProfile at line 42";
      const result = redactSensitive(input);
      assert.equal(result, input);
    });

    test("handles empty string", () => {
      assert.equal(redactSensitive(""), "");
    });

    test("handles text with no sensitive data", () => {
      const input = "Failed to load dashboard data";
      assert.equal(redactSensitive(input), input);
    });

    test("redacts mixed sensitive data", () => {
      const input = "User admin@corp.com (555-123-4567) token: abcdef0123456789abcdef0123456789";
      const result = redactSensitive(input);
      assert.ok(result.includes("[redacted-email]"));
      assert.ok(result.includes("[redacted-phone]"));
      assert.ok(result.includes("[redacted-token]"));
    });
  });

  describe("safeFormatDate", () => {
    test("returns 'Unknown' for null", () => {
      assert.equal(safeFormatDate(null), "Unknown");
    });

    test("returns 'Unknown' for empty string", () => {
      assert.equal(safeFormatDate(""), "Unknown");
    });

    test("returns 'Unknown' for whitespace-only string", () => {
      assert.equal(safeFormatDate("   "), "Unknown");
      assert.equal(safeFormatDate("\t\n"), "Unknown");
    });

    test("returns 'Unknown' for invalid date string", () => {
      assert.equal(safeFormatDate("not-a-date"), "Unknown");
      assert.equal(safeFormatDate("invalid"), "Unknown");
    });

    test("formats valid ISO date string", () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      const result = safeFormatDate(fiveMinutesAgo);
      assert.ok(result.includes("ago"), `Expected relative time, got: ${result}`);
    });

    test("formats recent date correctly", () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const result = safeFormatDate(oneHourAgo);
      assert.ok(result.includes("ago"));
      // Should contain "hour" for 1 hour ago
      assert.ok(result.includes("hour") || result.includes("minute"));
    });

    test("formats old dates", () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const result = safeFormatDate(thirtyDaysAgo);
      assert.ok(result.includes("ago"));
    });

    test("handles edge case: Invalid Date object", () => {
      // NaN date
      assert.equal(safeFormatDate("2025-13-45"), "Unknown"); // Invalid month/day
    });
  });

  describe("isValidSentryUrl", () => {
    test("returns true for valid sentry.io URL", () => {
      assert.ok(isValidSentryUrl("https://sentry.io/issues/123"));
      assert.ok(isValidSentryUrl("https://sentry.io/organizations/my-org/issues/456"));
    });

    test("returns true for subdomain sentry.io URLs", () => {
      assert.ok(isValidSentryUrl("https://my-org.sentry.io/issues/123"));
      assert.ok(isValidSentryUrl("https://app.sentry.io/dashboard"));
    });

    test("returns false for http (non-https) URLs", () => {
      assert.equal(isValidSentryUrl("http://sentry.io/issues/123"), false);
    });

    test("returns false for non-sentry domains", () => {
      assert.equal(isValidSentryUrl("https://example.com/issues"), false);
      assert.equal(isValidSentryUrl("https://malicious-sentry.io.evil.com"), false);
      assert.equal(isValidSentryUrl("https://notsentry.io/issues"), false);
    });

    test("returns false for javascript: protocol", () => {
      // This is a security test - javascript: URLs should be blocked
      assert.equal(isValidSentryUrl("javascript:alert('xss')"), false);
    });

    test("returns false for data: protocol", () => {
      assert.equal(isValidSentryUrl("data:text/html,<script>alert('xss')</script>"), false);
    });

    test("returns false for empty string", () => {
      assert.equal(isValidSentryUrl(""), false);
    });

    test("returns false for malformed URLs", () => {
      assert.equal(isValidSentryUrl("not-a-url"), false);
      assert.equal(isValidSentryUrl("://missing-protocol"), false);
    });

    test("returns false for sentry.io in path but wrong domain", () => {
      assert.equal(isValidSentryUrl("https://evil.com/sentry.io/issues"), false);
    });

    test("handles URL with query parameters", () => {
      assert.ok(isValidSentryUrl("https://sentry.io/issues/123?query=test"));
    });

    test("handles URL with hash fragment", () => {
      assert.ok(isValidSentryUrl("https://sentry.io/issues/123#details"));
    });
  });
});
