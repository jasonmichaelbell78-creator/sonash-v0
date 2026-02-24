/* eslint-disable no-undef */

/**
 * Claude Code Hook Protocol Constants
 *
 * In Claude Code hooks:
 * - stdout (console.log) = protocol response channel ("ok", block messages, structured output)
 * - stderr (console.error) = diagnostic logging, progress, warnings
 *
 * This is the OPPOSITE of typical Node.js convention where console.log is for
 * general output and console.error is for errors. Checkers MUST NOT flag
 * console.log as debug/hygiene issues — it IS the correct protocol mechanism.
 */

"use strict";

const HOOK_PROTOCOL = {
  /** stdout is the protocol response channel in Claude Code hooks */
  STDOUT_IS_PROTOCOL: true,

  /** console.log sends protocol responses (ok, block, structured output) */
  RESPONSE_CHANNEL: "console.log",

  /** console.error sends diagnostic messages (logging, progress, warnings) */
  DIAGNOSTIC_CHANNEL: "console.error",

  /** Valid protocol response prefixes that hooks can emit via stdout */
  VALID_RESPONSES: ["ok", "block", "warn"],

  /**
   * Patterns that are protocol-correct in hook files.
   * Checkers should NOT flag these as issues.
   */
  PROTOCOL_PATTERNS: {
    /** console.log("ok") — success response */
    OK_RESPONSE: /console\.log\(\s*["']ok["']\s*\)/,

    /** console.log("block: ...") — blocking response */
    BLOCK_RESPONSE: /console\.log\(\s*["']block:/,

    /** Any console.log — all stdout is protocol in hooks */
    ANY_STDOUT: /console\.log\(/,
  },

  /**
   * Patterns for diagnostic output (correct usage of stderr).
   */
  DIAGNOSTIC_PATTERNS: {
    /** console.error for logging */
    ERROR_LOG: /console\.error\(/,

    /** console.warn for warnings */
    WARN_LOG: /console\.warn\(/,

    /** process.stderr.write for raw stderr */
    STDERR_WRITE: /process\.stderr\.write\(/,
  },
};

module.exports = { HOOK_PROTOCOL };
