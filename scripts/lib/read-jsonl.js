"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Read a JSONL file and return parsed items.
 * Skips blank lines and malformed JSON lines (with a warning).
 *
 * @param {string} filePath - Absolute or relative path to the JSONL file
 * @param {object} [options]
 * @param {boolean} [options.safe=false] - If true, return [] on file read error instead of exiting
 * @param {boolean} [options.quiet=false] - If true, suppress per-line parse warnings
 * @returns {object[]} Parsed items
 */
function readJsonl(filePath, options = {}) {
  const { safe = false, quiet = false } = options;

  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    if (safe) return [];
    console.error(`Failed to read ${path.basename(filePath)}: ${err.code || err.message}`);
    process.exit(1);
  }

  const lines = raw.split("\n");
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    try {
      items.push(JSON.parse(trimmed));
    } catch {
      if (!quiet) {
        console.warn(`  Skipping malformed JSON at line ${i + 1} in ${path.basename(filePath)}`);
      }
    }
  }
  return items;
}

module.exports = readJsonl;
