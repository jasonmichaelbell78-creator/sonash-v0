"use strict";

const crypto = require("node:crypto");
const normalizeFilePath = require("./normalize-file-path");

/**
 * Generate a content-based SHA256 hash for TDMS dedup.
 * Uses normalized file path, line number, title (first 100 chars),
 * and description (first 200 chars) as hash inputs.
 *
 * @param {object} item - TDMS item with file, line, title, description
 * @returns {string} Hex SHA256 hash
 */
function generateContentHash(item) {
  const safeItem = item && typeof item === "object" ? item : {};
  const normalizedFile = normalizeFilePath(safeItem.file || "", {
    stripRepoRoot: true,
  }).toLowerCase();
  const line =
    typeof safeItem.line === "number"
      ? safeItem.line
      : Number.parseInt(String(safeItem.line || "0"), 10) || 0;
  const normalizeText = (v, max) =>
    String(v || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .substring(0, max);
  const hashInput = [
    normalizedFile,
    line,
    normalizeText(safeItem.title, 100),
    normalizeText(safeItem.description, 200),
  ].join("|");
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

module.exports = generateContentHash;
