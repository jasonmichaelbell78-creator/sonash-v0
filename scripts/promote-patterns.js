#!/usr/bin/env node
/**
 * promote-patterns.js — CLI wrapper for the TypeScript promotion pipeline.
 *
 * Replaces the previous JS-only version with a TypeScript implementation
 * that reads from data/ecosystem-v2/reviews.jsonl (v2 data source).
 *
 * Usage:
 *   node scripts/promote-patterns.js --dry-run
 *   node scripts/promote-patterns.js --min-occurrences 5 --min-prs 3
 *   node scripts/promote-patterns.js
 *
 * Requires: cd scripts/reviews && npx tsc (compile TypeScript first)
 */

const path = require("node:path");

/* eslint-disable no-undef -- CommonJS file, __dirname is available at runtime */
let main;
try {
  ({ main } = require(path.resolve(__dirname, "reviews", "dist", "lib", "promote-patterns.js")));
} catch (err) {
  console.error(
    "Failed to load promote-patterns. Did you compile TypeScript first? (cd scripts/reviews && npx tsc)"
  );
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

if (typeof main !== "function") {
  console.error(
    "promote-patterns module loaded, but no callable `main` export was found. Rebuild scripts/reviews and verify dist output."
  );
  process.exit(1);
}
/* eslint-enable no-undef */

Promise.resolve(main(process.argv.slice(2))).catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
