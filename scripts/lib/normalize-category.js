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
  if (cat == null) return DEFAULT_CATEGORY;
  const raw = (typeof cat === "string" ? cat : String(cat)).trim();
  if (!raw) return DEFAULT_CATEGORY;
  if (Object.hasOwn(CATEGORY_MAP, raw)) return CATEGORY_MAP[raw];
  const lower = raw.toLowerCase();
  if (Object.hasOwn(CATEGORY_MAP, lower)) return CATEGORY_MAP[lower];
  return DEFAULT_CATEGORY;
}

module.exports = normalizeCategory;
