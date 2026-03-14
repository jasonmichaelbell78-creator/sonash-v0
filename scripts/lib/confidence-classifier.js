/* global __dirname */
/**
 * confidence-classifier.js — Classify scaffolded route entries by confidence level
 *
 * Pure function library. Takes a scaffolded learning-routes entry and returns
 * a confidence level (high/low) with rationale and recommended action.
 *
 * Classification rules (priority order):
 * 1. code + "unbounded"/"no rotation" → high (add to rotation)
 * 2. code + matches existing verified-pattern → high (update regex)
 * 3. behavioral → always low (proxy metrics need human judgment)
 * 4. process + subject has known consumer → high (extend consumer)
 * 5. process otherwise → low (enforcement target ambiguous)
 *
 * Part of Automation Gap Closure (spec: 2026-03-14)
 *
 * @module lib/confidence-classifier
 */

const path = require("node:path");
const fs = require("node:fs");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const VP_PATH = path.join(PROJECT_ROOT, "scripts", "config", "verified-patterns.json");

/**
 * Load verified-patterns.json anti-pattern IDs for matching.
 * @returns {string[]} Array of anti_pattern strings (lowercased)
 */
function loadVerifiedPatterns() {
  try {
    const raw = fs.readFileSync(VP_PATH, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data.patterns)) return [];
    return data.patterns.map((p) => (p.anti_pattern || "").toLowerCase()).filter(Boolean);
  } catch (err) {
    // Review #432 R2: Log VP load failure for diagnostics (silent return [] masked classification errors)
    const code = err && typeof err === "object" && "code" in err ? err.code : "UNKNOWN";
    console.error(`[confidence-classifier] Warning: failed to load verified-patterns.json (${code}) — Rule 2 matching disabled`);
    return [];
  }
}

/**
 * Check if a pattern string matches known rotation-related keywords.
 * @param {string} pattern
 * @returns {boolean}
 */
function isRotationGap(pattern) {
  const lower = (pattern || "").toLowerCase();
  return lower.includes("unbounded") || lower.includes("no rotation");
}

/**
 * Check if a pattern string matches an existing verified-pattern anti-pattern.
 * @param {string} pattern
 * @param {string[]} vpPatterns - Lowercased verified-pattern anti_pattern strings
 * @returns {boolean}
 */
function matchesVerifiedPattern(pattern, vpPatterns) {
  const lower = (pattern || "").toLowerCase();
  return vpPatterns.some((vp) => lower.includes(vp));
}

// Module-level cache for verified patterns
// Review #432 R2: Use sentinel to distinguish "never loaded" from "loaded empty",
// allowing retry after transient load failure while caching successful empty results
let _vpCache = undefined;
let _vpLoadFailed = false;

/**
 * Get cached verified patterns. On successful load (even if empty), caches permanently.
 * On load failure, allows one retry per call until a successful load occurs.
 * @returns {string[]}
 */
function getCachedVerifiedPatterns() {
  if (_vpCache === undefined || _vpLoadFailed) {
    _vpCache = loadVerifiedPatterns();
    // If we got results, mark success; if empty but file exists, also success
    _vpLoadFailed = _vpCache.length === 0 && !fs.existsSync(VP_PATH);
  }
  return _vpCache;
}

/**
 * Classify a scaffolded learning-routes entry.
 *
 * @param {object} entry - A learning-routes.jsonl entry
 * @returns {{ confidence: 'high'|'low', reason: string, action: object }}
 */
function classify(entry) {
  // Guard: missing or malformed entry
  if (!entry || !entry.learning || typeof entry.learning !== "object") {
    return {
      confidence: "low",
      reason: "missing or malformed learning field",
      action: { type: "manual-review" },
    };
  }

  const { type, pattern } = entry.learning;

  // Rule 3: behavioral → always low (check early, most common)
  if (type === "behavioral") {
    return {
      confidence: "low",
      reason: "behavioral type — proxy metrics need human judgment on measurement approach",
      action: { type: "pending-refinement" },
    };
  }

  // Rule 1: code + rotation gap → high
  if (type === "code" && isRotationGap(pattern)) {
    return {
      confidence: "high",
      reason: "code type with rotation/unbounded gap — deterministic fix",
      action: {
        type: "add-to-rotation",
        targetFile: "config/rotation-policy.json",
      },
    };
  }

  // Rule 2: code + matches verified-pattern → high
  if (type === "code") {
    const vpPatterns = getCachedVerifiedPatterns();
    if (matchesVerifiedPattern(pattern, vpPatterns)) {
      return {
        confidence: "high",
        reason: "code type matching existing verified-pattern — regex update",
        action: {
          type: "update-verified-pattern",
          targetFile: "scripts/config/verified-patterns.json",
        },
      };
    }
    // code type but no match → low
    return {
      confidence: "low",
      reason: "code type but no matching verified-pattern found — needs manual regex definition",
      action: { type: "pending-refinement" },
    };
  }

  // Rules 4 & 5: process type
  if (type === "process") {
    const knownConsumerMap = {
      "review-metrics": "scripts/alerts",
      "hook-warnings": "scripts/hooks",
      "health-scores": "scripts/health",
      "commit-log": "scripts/seed-commit-log.js",
    };

    const lower = (pattern || "").toLowerCase();
    for (const [subject, consumer] of Object.entries(knownConsumerMap)) {
      if (lower.includes(subject)) {
        return {
          confidence: "high",
          reason: `process type with known consumer at ${consumer}`,
          action: { type: "extend-consumer", consumer, subject },
        };
      }
    }

    // Rule 5: no known consumer → low
    return {
      confidence: "low",
      reason: "process type — enforcement target is ambiguous, no known consumer",
      action: { type: "pending-refinement" },
    };
  }

  // Fallback: unknown type → low
  return {
    confidence: "low",
    reason: `unknown learning type '${type}'`,
    action: { type: "pending-refinement" },
  };
}

module.exports = {
  classify,
  isRotationGap,
  matchesVerifiedPattern,
  loadVerifiedPatterns,
};
