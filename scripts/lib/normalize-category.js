"use strict";
/* global __dirname */

const path = require("node:path");

const categoryMappings = require(path.join(__dirname, "../config/category-mappings.json"));

const CATEGORY_MAP = categoryMappings.aliases;
const DEFAULT_CATEGORY = categoryMappings.defaultCategory;

/**
 * Normalize a category string to a canonical TDMS category.
 * Handles case-insensitive lookup and alias resolution.
 *
 * @param {string} cat - Raw category string
 * @returns {string} Normalized canonical category
 */
function normalizeCategory(cat) {
  if (!cat) return DEFAULT_CATEGORY;
  const normalized = CATEGORY_MAP[cat];
  if (normalized) return normalized;
  const lower = cat.toLowerCase();
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];
  return DEFAULT_CATEGORY;
}

module.exports = normalizeCategory;
