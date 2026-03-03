/* eslint-disable no-undef */
/**
 * Shared JSON Config Loader
 *
 * Loads structured JSON configuration files from scripts/config/.
 * All config files are the single source of truth for their data.
 *
 * @module load-config
 */

const fs = require('node:fs');
const path = require('node:path');

const CONFIG_DIR = __dirname;

/**
 * Load and parse a JSON config file from scripts/config/.
 *
 * @param {string} name - Config filename without extension (e.g., "audit-schema")
 * @returns {object} Parsed JSON object
 * @throws {Error} If file not found or invalid JSON
 */
function loadConfig(name) {
  if (
    typeof name !== 'string' ||
    name.length === 0 ||
    name.includes('..') ||
    name.includes('/') ||
    name.includes('\\')
  ) {
    throw new Error(`Invalid config name "${String(name)}"`);
  }
  const filePath = path.join(CONFIG_DIR, name + '.json');
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err); // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
    throw new Error(`Failed to load config "${name}": ${msg}`);
  }
}

/**
 * Load a JSON config and convert regex descriptor objects to RegExp instances.
 *
 * Regex descriptors in JSON use the format: {"source": "pattern", "flags": "gi"}
 * This function recursively walks the parsed object and converts them.
 *
 * @param {string} name - Config filename without extension
 * @param {string[]} [regexFields] - Optional list of field names that contain regex descriptors.
 *   If omitted, ALL objects with exactly {source, flags} keys are converted.
 * @returns {object} Parsed config with RegExp instances
 */
function loadConfigWithRegex(name, regexFields) {
  // eslint-disable-next-line framework/no-unguarded-file-read -- failure is handled by caller
  const config = loadConfig(name);
  return convertRegexFields(config, regexFields);
}

/**
 * Recursively convert {source, flags} objects to RegExp instances.
 *
 * @param {*} obj - Value to process
 * @param {string[]|undefined} regexFields - If provided, only convert objects under these keys
 * @param {string} [currentKey] - Current property name (for regexFields filtering)
 * @returns {*} Processed value
 */
// eslint-disable-next-line complexity -- convertRegexFields has inherent branching (complexity 16), refactoring would reduce readability
function convertRegexFields(obj, regexFields, currentKey) {
  if (obj === null || obj === undefined) return obj;

  // Check if this object is a regex descriptor
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const keys = Object.keys(obj);
    if (
      keys.length === 2 &&
      keys.includes('source') &&
      keys.includes('flags') &&
      typeof obj.source === 'string' &&
      typeof obj.flags === 'string'
    ) {
      // Only convert if no regexFields filter, or current key matches
      if (!regexFields || regexFields.includes(currentKey)) {
        try {
          // eslint-disable-next-line framework/no-unescaped-regexp-input -- input is from controlled internal source
          return new RegExp(obj.source, obj.flags);
        } catch (regexErr) {
          const msg =
            regexErr instanceof Error
              ? regexErr instanceof Error
                ? regexErr.message // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
                : String(regexErr)
              : String(regexErr);
          throw new Error(
            `Invalid regex in config at "${currentKey}": /${obj.source}/${obj.flags} (${msg})`,
          );
        }
      }
    }

    // Recurse into object properties
    const result = {};
    for (const key of keys) {
      result[key] = convertRegexFields(obj[key], regexFields, key);
    }
    return result;
  }

  // Recurse into arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => convertRegexFields(item, regexFields, currentKey));
  }

  return obj;
}

module.exports = { loadConfig, loadConfigWithRegex };
