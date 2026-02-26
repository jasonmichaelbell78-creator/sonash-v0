"use strict";

const crypto = require("crypto");

/**
 * Generate a content-based SHA256 hash for TDMS dedup.
 * Uses normalized file path, line number, title (first 100 chars),
 * and description (first 200 chars) as hash inputs.
 *
 * @param {object} item - TDMS item with file, line, title, description
 * @returns {string} Hex SHA256 hash
 */
function generateContentHash(item) {
  const normalizedFile = (item.file || "").replace(/^\.\//, "").replace(/^\//, "").toLowerCase();
  const hashInput = [
    normalizedFile,
    item.line || 0,
    (item.title || "").toLowerCase().substring(0, 100),
    (item.description || "").toLowerCase().substring(0, 200),
  ].join("|");
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

module.exports = generateContentHash;
