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
 * - Shell command injection via string interpolation
 * - SQL injection via string interpolation in queries
 * - Array index as React key causes re-render bugs
 * - Clickable div without ARIA role is inaccessible
 * - Path validation with startsWith fails on Windows
 * - Hardcoded API keys/secrets in source code
 * - Mocking firebase/firestore directly (use functions)
 * - writeFileSync without encoding parameter
 * - Unbounded regex quantifiers risk ReDoS
 * - Unescaped variable input in RegExp constructor
 * - Division by potentially-zero variables
 * - loadConfig/require without try/catch
 * - Path traversal check missing empty string edge case
 * - writeFileSync without atomic write pattern
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
// Phase 2: Migrated from regex check-pattern-compliance.js patterns
const noShellInjection = require("./rules/no-shell-injection");
const noSqlInjection = require("./rules/no-sql-injection");
const noIndexKey = require("./rules/no-index-key");
const noDivOnclickNoRole = require("./rules/no-div-onclick-no-role");
const noPathStartswith = require("./rules/no-path-startswith");
const noHardcodedSecrets = require("./rules/no-hardcoded-secrets");
const noTestMockFirestore = require("./rules/no-test-mock-firestore");
const noWritefileMissingEncoding = require("./rules/no-writefile-missing-encoding");
const noUnboundedRegex = require("./rules/no-unbounded-regex");
const noUnescapedRegexpInput = require("./rules/no-unescaped-regexp-input");
const noUnsafeDivision = require("./rules/no-unsafe-division");
const noUnguardedLoadconfig = require("./rules/no-unguarded-loadconfig");
const noEmptyPathCheck = require("./rules/no-empty-path-check");
const noNonAtomicWrite = require("./rules/no-non-atomic-write");

const plugin = {
  meta: {
    name: "eslint-plugin-sonash",
    version: "3.0.0",
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
    // Phase 2 rules
    "no-shell-injection": noShellInjection,
    "no-sql-injection": noSqlInjection,
    "no-index-key": noIndexKey,
    "no-div-onclick-no-role": noDivOnclickNoRole,
    "no-path-startswith": noPathStartswith,
    "no-hardcoded-secrets": noHardcodedSecrets,
    "no-test-mock-firestore": noTestMockFirestore,
    "no-writefile-missing-encoding": noWritefileMissingEncoding,
    "no-unbounded-regex": noUnboundedRegex,
    "no-unescaped-regexp-input": noUnescapedRegexpInput,
    "no-unsafe-division": noUnsafeDivision,
    "no-unguarded-loadconfig": noUnguardedLoadconfig,
    "no-empty-path-check": noEmptyPathCheck,
    "no-non-atomic-write": noNonAtomicWrite,
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
    "sonash/no-shell-injection": "warn",
    "sonash/no-sql-injection": "warn",
    "sonash/no-index-key": "warn",
    "sonash/no-div-onclick-no-role": "warn",
    "sonash/no-path-startswith": "warn",
    "sonash/no-hardcoded-secrets": "warn",
    "sonash/no-test-mock-firestore": "warn",
    "sonash/no-writefile-missing-encoding": "warn",
    "sonash/no-unbounded-regex": "warn",
    "sonash/no-unescaped-regexp-input": "warn",
    "sonash/no-unsafe-division": "warn",
    "sonash/no-unguarded-loadconfig": "warn",
    "sonash/no-empty-path-check": "warn",
    "sonash/no-non-atomic-write": "warn",
  },
};

module.exports = plugin;
