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
const { main } = require(path.resolve(__dirname, "reviews", "dist", "lib", "promote-patterns.js"));
/* eslint-enable no-undef */

main(process.argv.slice(2));
