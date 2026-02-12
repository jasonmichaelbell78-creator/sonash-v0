/**
 * @fileoverview ESLint plugin for SoNash project-specific security rules.
 *
 * Rules enforce patterns from CODE_PATTERNS.md:
 * - File reads must be wrapped in try/catch (race conditions)
 * - statSync() requires preceding lstatSync() (symlink attacks)
 * - existsSync() + readFileSync() is a TOCTOU vulnerability
 */

"use strict";

const noUnguardedFileRead = require("./rules/no-unguarded-file-read");
const noStatWithoutLstat = require("./rules/no-stat-without-lstat");
const noToctouFileOps = require("./rules/no-toctou-file-ops");

const plugin = {
  meta: {
    name: "eslint-plugin-sonash",
    version: "1.0.0",
  },
  rules: {
    "no-unguarded-file-read": noUnguardedFileRead,
    "no-stat-without-lstat": noStatWithoutLstat,
    "no-toctou-file-ops": noToctouFileOps,
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
  },
};

module.exports = plugin;
