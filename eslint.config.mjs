import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import security from "eslint-plugin-security";
import { createRequire } from "node:module";
import globals from "globals";

const require = createRequire(import.meta.url);
const sonash = require("./eslint-plugin-sonash/index.js");

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { security },
    rules: {
      ...(security.configs.recommended?.rules ?? {}),
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist-tests/**",
      "coverage/**",
      "src/dataconnect-generated/**",
      "functions/lib/**",
      "*.config.mjs",
      ".claude/hooks/backup/**",
      ".claude/state/**",
      "docs/archive/**",
      "eslint-plugin-sonash/**",
      // Note: functions/ has its own eslint.config.mjs with backend-appropriate rules
    ],
  },
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off",
      // Replaces regex parseint-no-radix pattern in check-pattern-compliance.js
      radix: "warn",
      // Replaces regex eval-usage pattern (eval is a security risk)
      "no-eval": "error",
      // CC limit — recommended in 5 consecutive PR retros (#367-#371), ~20 avoidable rounds.
      // "warn" globally (113 pre-existing violations). Pre-commit hook runs CC as error
      // on staged files only, blocking new CC >15 functions without breaking existing code.
      complexity: ["warn", 15],
    },
  },
  // Node.js scripts configuration (ES modules that define their own __filename/__dirname)
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      sourceType: "module",
      globals: {
        // Node.js globals except __filename/__dirname (scripts define these from import.meta.url)
        ...Object.fromEntries(
          Object.entries(globals.node).filter(([k]) => !["__filename", "__dirname"].includes(k))
        ),
      },
    },
    rules: {
      // Allow require() for dynamic imports (e.g., path.sep detection)
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // CC error-level for husky hooks (replaces standalone CC check in pre-commit)
  // .claude/hooks/ stays at "warn" due to 10 pre-existing violations
  {
    files: [".husky/**/*.js"],
    rules: { complexity: ["error", 15] },
  },
  // SoNash rules - file I/O security (scripts/hooks only)
  {
    files: [
      "scripts/**/*.js",
      "scripts/**/*.ts",
      ".claude/hooks/**/*.js",
      ".claude/hooks/**/*.ts",
      ".husky/**/*.js",
      ".husky/**/*.ts",
    ],
    plugins: {
      sonash,
    },
    rules: {
      "sonash/no-unguarded-file-read": "warn",
      "sonash/no-stat-without-lstat": "warn",
      "sonash/no-toctou-file-ops": "warn",
      // Migrated from regex check-pattern-compliance.js patterns
      "sonash/no-raw-error-log": "warn",
      "sonash/no-catch-console-error": "warn",
      "sonash/no-object-assign-json": "warn",
      "sonash/no-math-max-spread": "warn",
    },
  },
  // SoNash rules - code quality (all JS/TS/TSX/JSX)
  {
    files: ["**/*.{js,ts,tsx,jsx}"],
    plugins: {
      sonash,
    },
    rules: {
      // Migrated from regex patterns — AST-based, zero false positives on comments/strings
      "sonash/no-unsafe-innerhtml": "warn",
      "sonash/no-unsafe-error-access": "warn",
      "sonash/no-hallucinated-api": "warn",
    },
  },
  // SoNash rules - test quality
  {
    files: ["**/*.test.{js,ts,tsx,jsx}", "**/*.spec.{js,ts,tsx,jsx}"],
    plugins: {
      sonash,
    },
    rules: {
      "sonash/no-trivial-assertions": "warn",
    },
  },
];
