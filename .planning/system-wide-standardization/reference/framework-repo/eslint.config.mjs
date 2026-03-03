import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import { createRequire } from 'node:module';
import globals from 'globals';

const require = createRequire(import.meta.url);
const framework = require('./eslint-plugin-framework/index.js');

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
      'node_modules/**',
      'coverage/**',
      'eslint-plugin-framework/**',
      'scripts/reviews/dist/**',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
      // Replaces regex parseint-no-radix pattern in check-pattern-compliance.js
      radix: 'warn',
      // Replaces regex eval-usage pattern (eval is a security risk)
      'no-eval': 'error',
      // CC limit — recommended in consecutive PR retros.
      // "warn" globally. Pre-commit hook runs CC as error
      // on staged files only, blocking new CC >15 functions without breaking existing code.
      complexity: ['warn', 15],
    },
  },
  // Node.js scripts configuration (CJS with require/__dirname/__filename)
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Allow require() in CJS scripts
      '@typescript-eslint/no-require-imports': 'off',
      // Allow shadowing Node.js globals like crypto (common CJS pattern: const crypto = require('node:crypto'))
      'no-redeclare': 'off',
    },
  },
  // CC error-level for husky hooks (replaces standalone CC check in pre-commit)
  {
    files: ['.husky/**/*.js'],
    rules: { complexity: ['error', 15] },
  },
  // Internal tooling: disable eslint-plugin-security false positives
  // These scripts process trusted local data (JSONL, JSON configs, local files),
  // not user-controlled input. The security rules are designed for web-facing code
  // and produce false positives across these directories.
  // Project-specific framework/* rules remain active for meaningful checks.
  {
    files: [
      'scripts/**/*.js',
      'scripts/**/*.ts',
      '.claude/hooks/**/*.js',
      '.claude/hooks/**/*.ts',
      '.claude/skills/*/scripts/**/*.js',
    ],
    rules: {
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-require': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-unsafe-regex': 'off',
    },
  },
  // framework rules - file I/O security (scripts/hooks only)
  {
    files: [
      'scripts/**/*.js',
      'scripts/**/*.ts',
      '.claude/hooks/**/*.js',
      '.claude/hooks/**/*.ts',
      '.husky/**/*.js',
      '.husky/**/*.ts',
    ],
    plugins: {
      framework,
    },
    rules: {
      'framework/no-unguarded-file-read': 'warn',
      'framework/no-stat-without-lstat': 'warn',
      'framework/no-toctou-file-ops': 'warn',
      // Migrated from regex check-pattern-compliance.js patterns (Phase 1)
      'framework/no-raw-error-log': 'warn',
      'framework/no-catch-console-error': 'warn',
      'framework/no-object-assign-json': 'warn',
      'framework/no-math-max-spread': 'warn',
      // Migrated from regex patterns (Phase 2)
      'framework/no-shell-injection': 'warn',
      'framework/no-writefile-missing-encoding': 'warn',
      'framework/no-unbounded-regex': 'warn',
      'framework/no-unescaped-regexp-input': 'warn',
      'framework/no-non-atomic-write': 'warn',
    },
  },
  // framework rules - code quality (all JS/TS/TSX/JSX)
  {
    files: ['**/*.{js,ts,tsx,jsx}'],
    plugins: {
      framework,
    },
    rules: {
      // Migrated from regex patterns — AST-based, zero false positives on comments/strings
      'framework/no-unsafe-innerhtml': 'warn',
      'framework/no-unsafe-error-access': 'warn',
      'framework/no-hallucinated-api': 'warn',
      // Phase 2 migrations
      'framework/no-sql-injection': 'warn',
      'framework/no-hardcoded-secrets': 'warn',
      'framework/no-path-startswith': 'warn',
      'framework/no-empty-path-check': 'warn',
      'framework/no-unsafe-division': 'warn',
    },
  },
  // framework rules - React/JSX quality
  {
    files: ['**/*.{tsx,jsx}'],
    plugins: {
      framework,
    },
    rules: {
      'framework/no-index-key': 'warn',
      'framework/no-div-onclick-no-role': 'warn',
    },
  },
  // framework rules - test quality
  {
    files: ['**/*.test.{js,ts,tsx,jsx}', '**/*.spec.{js,ts,tsx,jsx}'],
    plugins: {
      framework,
    },
    rules: {
      'framework/no-trivial-assertions': 'warn',
    },
  },
];
