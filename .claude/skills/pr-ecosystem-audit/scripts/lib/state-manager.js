/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * State manager for PR Ecosystem Audit.
 *
 * Handles reading/writing .claude/state/pr-ecosystem-audit.jsonl,
 * computing deltas between runs, and trend extraction.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

/** Max file size for read operations (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Max entries to keep in state file */
const MAX_ENTRIES = 100;

/**
 * Create a state manager instance.
 * @param {string} rootDir - Project root directory
 * @param {function} isSafeToWrite - Symlink guard function
 * @returns {object} State manager API
 */
function createStateManager(rootDir, isSafeToWrite) {
  const STATE_DIR = path.join(rootDir, ".claude", "state");
  const STATE_FILE = path.join(STATE_DIR, "pr-ecosystem-audit.jsonl");

  /**
   * Read all entries from state file.
   * @returns {Array<object>} Parsed entries, oldest first
   */
  function readEntries() {
    try {
      const stat = fs.statSync(STATE_FILE);
      if (stat.size > MAX_FILE_SIZE) {
        console.error("  [warn] State file too large, skipping read");
        return [];
      }
    } catch {
      return []; // File doesn't exist
    }

    try {
      const content = fs.readFileSync(STATE_FILE, "utf8");
      return content
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Append a new entry to the state file (atomic write with symlink guard).
   * @param {object} entry - The audit result to append
   * @returns {boolean} Whether the write succeeded
   */
  function appendEntry(entry) {
    try {
      // Ensure state directory exists
      if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
      }

      if (!isSafeToWrite(STATE_FILE)) {
        console.error("  [warn] State file failed symlink guard, skipping write");
        return false;
      }

      const line = JSON.stringify(entry) + "\n";

      // Read existing entries for rotation
      const existing = readEntries();
      if (existing.length >= MAX_ENTRIES) {
        // Rotate: keep most recent MAX_ENTRIES - 1, then add new
        const trimmed = existing.slice(-(MAX_ENTRIES - 1));
        const tmpPath = STATE_FILE + ".tmp";
        if (!isSafeToWrite(tmpPath)) return false;
        const content = trimmed.map((e) => JSON.stringify(e)).join("\n") + "\n" + line;
        fs.writeFileSync(tmpPath, content, "utf8");
        if (fs.existsSync(STATE_FILE)) fs.rmSync(STATE_FILE, { force: true });
        fs.renameSync(tmpPath, STATE_FILE);
      } else {
        fs.appendFileSync(STATE_FILE, line, "utf8");
      }

      return true;
    } catch (err) {
      console.error(`  [warn] Failed to write state: ${err.message || err}`);
      return false;
    }
  }

  /**
   * Get the last N entries for trending.
   * @param {number} n - Number of recent entries
   * @returns {Array<object>}
   */
  function getRecent(n = 5) {
    return readEntries().slice(-n);
  }

  /**
   * Compute delta between current run and last run.
   * @param {object} current - Current audit result
   * @returns {object|null} Delta information
   */
  function computeDelta(current) {
    const entries = readEntries();
    if (entries.length === 0) return null;

    const previous = entries[entries.length - 1];
    if (!previous.healthScore || !current.healthScore) return null;

    const delta = {
      scoreBefore: previous.healthScore.score,
      gradeBefore: previous.healthScore.grade,
      scoreAfter: current.healthScore.score,
      gradeAfter: current.healthScore.grade,
      scoreDelta: current.healthScore.score - previous.healthScore.score,
      previousTimestamp: previous.timestamp,
      categoryDeltas: {},
    };

    // Per-category deltas
    for (const [cat, data] of Object.entries(current.categories || {})) {
      const prevCat = previous.categories?.[cat];
      if (prevCat && typeof data.score === "number" && typeof prevCat.score === "number") {
        delta.categoryDeltas[cat] = {
          before: prevCat.score,
          after: data.score,
          delta: data.score - prevCat.score,
        };
      }
    }

    return delta;
  }

  /**
   * Get historical scores for a specific category (for sparklines).
   * @param {string} categoryKey - Category key
   * @param {number} windowSize - Number of entries
   * @returns {number[]} Array of historical scores
   */
  function getCategoryHistory(categoryKey, windowSize = 10) {
    const entries = readEntries().slice(-windowSize);
    return entries
      .map((e) => e.categories?.[categoryKey]?.score)
      .filter((v) => typeof v === "number");
  }

  /**
   * Get composite score history for trending.
   * @param {number} windowSize
   * @returns {number[]}
   */
  function getCompositeHistory(windowSize = 10) {
    const entries = readEntries().slice(-windowSize);
    return entries.map((e) => e.healthScore?.score).filter((v) => typeof v === "number");
  }

  return {
    readEntries,
    appendEntry,
    getRecent,
    computeDelta,
    getCategoryHistory,
    getCompositeHistory,
  };
}

module.exports = { createStateManager };
