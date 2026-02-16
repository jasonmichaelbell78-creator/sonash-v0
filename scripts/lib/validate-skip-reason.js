/**
 * Shared SKIP_REASON validation (PR #367 retro — extract from 3 scripts)
 *
 * Validates the SKIP_REASON environment variable used by override guards.
 * Returns { valid: true, reason } or { valid: false, error }.
 *
 * Usage example:
 *   const { validateSkipReason } = require("./lib/validate-skip-reason");
 *   const result = validateSkipReason(process.env.SKIP_REASON, "SKIP_TRIGGERS=1");
 *   // usageExample appears in error messages as: SKIP_REASON="..." <usageExample> git commit/push ...
 *   if (!result.valid) {
 *     console.error(result.error);
 *     process.exit(1);
 *   }
 */

function validateSkipReason(rawReason, usageExample = "SKIP_CHECK=1") {
  const reason = typeof rawReason === "string" ? rawReason.trim() : "";

  if (!reason) {
    return {
      valid: false,
      reason: "",
      error: [
        "❌ SKIP_REASON is required when overriding checks",
        `   Usage: SKIP_REASON="your reason" ${usageExample} git commit/push ...`,
        "   The audit trail is useless without a reason.",
      ].join("\n"),
    };
  }

  // Length check first — prevents DoS from oversized input before expensive iteration
  if (reason.length > 500) {
    return {
      valid: false,
      reason: "",
      error: "❌ SKIP_REASON is too long (max 500 chars)",
    };
  }

  if (/[\r\n]/.test(reason)) {
    return {
      valid: false,
      reason: "",
      error: "❌ SKIP_REASON must be single-line (no CR/LF)",
    };
  }

  // Block ASCII control chars, DEL, C1 control block, and Unicode bidi overrides
  // Bidi chars (U+202A-202E, U+2066-2069, U+200E-200F) can spoof log output
  const BIDI_CONTROL_RE = /[\u202A-\u202E\u2066-\u2069\u200E\u200F]/u;
  if (
    [...reason].some((c) => {
      const code = c.codePointAt(0);
      return code < 0x20 || code === 0x7f || (code >= 0x80 && code <= 0x9f);
    }) ||
    BIDI_CONTROL_RE.test(reason)
  ) {
    return {
      valid: false,
      reason: "",
      error: "❌ SKIP_REASON must not contain control characters",
    };
  }

  return { valid: true, reason };
}

module.exports = { validateSkipReason };
