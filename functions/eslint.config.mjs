import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "node:url";

const tsconfigRootDir = fileURLToPath(new URL(".", import.meta.url));

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["lib/**/*", "node_modules/**/*", "eslint.config.mjs"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir,
      },
    },
    rules: {
      // ESLint 10 enables these core checks in the recommended preset. Keep the
      // existing Functions baseline during migration and remediate separately.
      "preserve-caught-error": "off",
      "no-useless-assignment": "off",
      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // Warn on any type
      "@typescript-eslint/no-explicit-any": "warn",
      // CC limit — prevents multi-round CC extraction in reviews (PR #417-#423 retros)
      complexity: ["warn", 15],
    },
  }
);
