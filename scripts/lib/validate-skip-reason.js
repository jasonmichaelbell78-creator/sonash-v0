#!/usr/bin/env node
/**
 * Shared SKIP_REASON validation (PR #367 retro — extract from 3 scripts)
 *
 * Validates the SKIP_REASON environment variable used by override guards.
 * Returns { valid: true, reason } or { valid: false, error }.
 *
 * Usage example:
 *   const { validateSkipReason } = require("./lib/validate-skip-reason");
 *   const result = validateSkipReason(process.env.SKIP_REASON, "SKIP_TRIGGERS=1");
 *   if (!result.valid) {
 *     console.error(result.error);
 *     process.exit(1);
 *   }
 */

function validateSkipReason(rawReason, usageHint = "SKIP_CHECK=1") {
  const reason = typeof rawReason === "string" ? rawReason.trim() : "";

  if (!reason) {
    return {
      valid: false,
      reason: "",
      error: [
        "❌ SKIP_REASON is required when overriding checks",
        `   Usage: SKIP_REASON="your reason" ${usageHint} git commit ...`,
        "   The audit trail is useless without a reason.",
      ].join("\n"),
    };
  }

  if (/[\r\n]/.test(reason)) {
    return {
      valid: false,
      reason,
      error: "❌ SKIP_REASON must be single-line (no CR/LF)",
    };
  }

  if (
    [...reason].some((c) => {
      const code = c.codePointAt(0);
      return code < 0x20 || code === 0x7f;
    })
  ) {
    return {
      valid: false,
      reason,
      error: "❌ SKIP_REASON must not contain control characters",
    };
  }

  if (reason.length > 500) {
    return {
      valid: false,
      reason,
      error: "❌ SKIP_REASON is too long (max 500 chars)",
    };
  }

  return { valid: true, reason };
}

module.exports = { validateSkipReason };
