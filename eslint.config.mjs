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
      // CC limit — recommended in 4 consecutive PR retros (#367-#370), ~20 avoidable rounds
      // "warn" globally; SonarCloud enforces as error. Prevents new CC >15 functions.
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
  // SoNash security rules - applied only to high-risk script/hook directories
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
    },
  },
];
