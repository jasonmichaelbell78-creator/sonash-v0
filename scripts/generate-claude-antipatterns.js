#!/usr/bin/env node
/**
 * generate-claude-antipatterns.js — CLI wrapper for CLAUDE.md Section 4 auto-updater.
 *
 * Updates the auto-managed region of CLAUDE.md Section 4 with top anti-patterns.
 *
 * Usage:
 *   node scripts/generate-claude-antipatterns.js --dry-run
 *   node scripts/generate-claude-antipatterns.js
 *
 * Requires: cd scripts/reviews && npx tsc (compile TypeScript first)
 */

const path = require("node:path");

/* eslint-disable no-undef -- CommonJS file, __dirname is available at runtime */
let main;
try {
  ({ main } = require(
    path.resolve(__dirname, "reviews", "dist", "lib", "generate-claude-antipatterns.js")
  ));
} catch (err) {
  console.error(
    "Failed to load generate-claude-antipatterns. Did you compile TypeScript first? (cd scripts/reviews && npx tsc)"
  );
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
/* eslint-enable no-undef */

main(process.argv.slice(2));
