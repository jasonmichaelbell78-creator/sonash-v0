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
const { main } = require(
  path.resolve(__dirname, "reviews", "dist", "lib", "generate-fix-template-stubs.js")
);
/* eslint-enable no-undef */

main(process.argv.slice(2));
