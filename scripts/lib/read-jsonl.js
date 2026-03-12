"use strict";

const fs = require("node:fs");
const path = require("node:path");

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
/**
 * Read raw file content, returning null on error (or exiting if not safe mode).
 */
function readRawContent(filePath, safe) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    if (safe) return null;
    const errCode = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Failed to read ${path.basename(filePath)}: ${errCode || errMsg}`);
    process.exit(1);
  }
}

function readJsonl(filePath, options = {}) {
  const { safe = false, quiet = false } = options;

  const raw = readRawContent(filePath, safe);
  if (raw === null) return [];

  const lines = raw.split("\n");
  const items = [];
  const name = path.basename(filePath);
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    try {
      items.push(JSON.parse(trimmed));
    } catch {
      if (!quiet) {
        console.warn(`  Skipping malformed JSON at line ${i + 1} in ${name}`);
      }
    }
  }
  return items;
}

module.exports = readJsonl;
