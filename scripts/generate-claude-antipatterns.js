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
const { main } = require(
  path.resolve(__dirname, "reviews", "dist", "lib", "generate-claude-antipatterns.js")
);
/* eslint-enable no-undef */

main(process.argv.slice(2));
