#!/usr/bin/env node
/**
 * generate-fix-template-stubs.js — CLI wrapper for FIX_TEMPLATES.md stub generator.
 *
 * Appends template skeletons to FIX_TEMPLATES.md for promoted patterns.
 *
 * Usage:
 *   node scripts/generate-fix-template-stubs.js --dry-run
 *   node scripts/generate-fix-template-stubs.js
 *
 * Requires: cd scripts/reviews && npx tsc (compile TypeScript first)
 */

const path = require("node:path");

/* eslint-disable no-undef -- CommonJS file, __dirname is available at runtime */
let main;
try {
  ({ main } = require(
    path.resolve(__dirname, "reviews", "dist", "lib", "generate-fix-template-stubs.js")
  ));
} catch (err) {
  console.error(
    "Failed to load generate-fix-template-stubs. Did you compile TypeScript first? (cd scripts/reviews && npx tsc)"
  );
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

if (typeof main !== "function") {
  console.error(
    "generate-fix-template-stubs module loaded, but no callable `main` export was found. Rebuild scripts/reviews and verify dist output."
  );
  process.exit(1);
}
/* eslint-enable no-undef */

main(process.argv.slice(2));
