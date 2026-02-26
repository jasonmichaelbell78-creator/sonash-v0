/**
 * @fileoverview ESLint plugin for SoNash project-specific security rules.
 *
 * Rules enforce patterns from CODE_PATTERNS.md:
 * - File reads must be wrapped in try/catch (race conditions)
 * - statSync() requires preceding lstatSync() (symlink attacks)
 * - existsSync() + readFileSync() is a TOCTOU vulnerability
 * - innerHTML assignments are XSS vectors
 * - .catch(console.error) exposes raw errors
 * - Unsafe error.message access without instanceof check
 * - Raw error object logging exposes stack traces
 * - Object.assign from parsed JSON enables prototype pollution
 * - Math.max(...arr) without length guard returns -Infinity
 * - Trivial test assertions provide false confidence
 * - AI-hallucinated API calls cause runtime errors
 */

"use strict";

const noUnguardedFileRead = require("./rules/no-unguarded-file-read");
const noStatWithoutLstat = require("./rules/no-stat-without-lstat");
const noToctouFileOps = require("./rules/no-toctou-file-ops");
const noUnsafeInnerhtml = require("./rules/no-unsafe-innerhtml");
const noCatchConsoleError = require("./rules/no-catch-console-error");
const noUnsafeErrorAccess = require("./rules/no-unsafe-error-access");
const noRawErrorLog = require("./rules/no-raw-error-log");
const noObjectAssignJson = require("./rules/no-object-assign-json");
const noMathMaxSpread = require("./rules/no-math-max-spread");
const noTrivialAssertions = require("./rules/no-trivial-assertions");
const noHallucinatedApi = require("./rules/no-hallucinated-api");

const plugin = {
  meta: {
    name: "eslint-plugin-sonash",
    version: "2.0.0",
  },
  rules: {
    "no-unguarded-file-read": noUnguardedFileRead,
    "no-stat-without-lstat": noStatWithoutLstat,
    "no-toctou-file-ops": noToctouFileOps,
    "no-unsafe-innerhtml": noUnsafeInnerhtml,
    "no-catch-console-error": noCatchConsoleError,
    "no-unsafe-error-access": noUnsafeErrorAccess,
    "no-raw-error-log": noRawErrorLog,
    "no-object-assign-json": noObjectAssignJson,
    "no-math-max-spread": noMathMaxSpread,
    "no-trivial-assertions": noTrivialAssertions,
    "no-hallucinated-api": noHallucinatedApi,
  },
  configs: {},
};

// Recommended config (flat config format)
plugin.configs.recommended = {
  plugins: {
    sonash: plugin,
  },
  rules: {
    "sonash/no-unguarded-file-read": "warn",
    "sonash/no-stat-without-lstat": "warn",
    "sonash/no-toctou-file-ops": "warn",
    "sonash/no-unsafe-innerhtml": "warn",
    "sonash/no-catch-console-error": "warn",
    "sonash/no-unsafe-error-access": "warn",
    "sonash/no-raw-error-log": "warn",
    "sonash/no-object-assign-json": "warn",
    "sonash/no-math-max-spread": "warn",
    "sonash/no-trivial-assertions": "warn",
    "sonash/no-hallucinated-api": "warn",
  },
};

module.exports = plugin;
