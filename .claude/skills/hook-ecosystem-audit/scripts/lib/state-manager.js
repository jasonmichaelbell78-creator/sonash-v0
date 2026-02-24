/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * State manager for Hook Ecosystem Audit.
 *
 * Handles reading/writing .claude/state/hook-ecosystem-audit-history.jsonl,
 * computing deltas between runs, and trend extraction.
 *
 * Forked from pr-ecosystem-audit — changed state file path.
 */

"use strict";

let fs, path;
try {
  fs = require("node:fs");
  path = require("node:path");
} catch (err) {
  const code = err instanceof Error && err.code ? err.code : "UNKNOWN";
  console.error(`Fatal: failed to load core Node.js modules (${code})`);
  process.exit(1);
}

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
  const STATE_FILE = path.join(STATE_DIR, "hook-ecosystem-audit-history.jsonl");

  function readEntries() {
    try {
      const stat = fs.statSync(STATE_FILE);
      if (stat.size > MAX_FILE_SIZE) {
        console.error("  [warn] State file too large, skipping read");
        return [];
      }
    } catch {
      return [];
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

  function appendEntry(entry) {
    try {
      if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
      }

      if (!isSafeToWrite(STATE_FILE)) {
        console.error("  [warn] State file failed symlink guard, skipping write");
        return false;
      }

      const line = JSON.stringify(entry) + "\n";

      const existing = readEntries();
      if (existing.length >= MAX_ENTRIES) {
        const trimmed = existing.slice(-(MAX_ENTRIES - 1));
        const tmpPath = STATE_FILE + ".tmp";
        const bakPath = STATE_FILE + ".bak";
        if (!isSafeToWrite(tmpPath)) return false;
        if (!isSafeToWrite(bakPath)) return false;
        const content = trimmed.map((e) => JSON.stringify(e)).join("\n") + "\n" + line;
        fs.writeFileSync(tmpPath, content, "utf8");
        const safeRename = (src, dest) => {
          try {
            fs.rmSync(dest, { force: true });
          } catch {
            /* ignore */
          }
          try {
            fs.renameSync(src, dest);
          } catch {
            fs.copyFileSync(src, dest);
            fs.unlinkSync(src);
          }
        };
        try {
          if (fs.existsSync(STATE_FILE)) {
            try {
              fs.rmSync(bakPath, { force: true });
            } catch {
              /* ignore */
            }
            safeRename(STATE_FILE, bakPath);
          }
          safeRename(tmpPath, STATE_FILE);
          try {
            fs.rmSync(bakPath, { force: true });
          } catch {
            /* ignore */
          }
        } catch {
          try {
            if (fs.existsSync(bakPath) && !fs.existsSync(STATE_FILE)) {
              safeRename(bakPath, STATE_FILE);
            }
          } catch {
            /* ignore */
          }
          try {
            fs.rmSync(tmpPath, { force: true });
          } catch {
            /* ignore */
          }
          return false;
        }
      } else {
        if (!isSafeToWrite(STATE_FILE)) {
          console.error("  [warn] State file failed symlink guard, skipping write");
          return false;
        }
        fs.appendFileSync(STATE_FILE, line, "utf8");
      }

      return true;
    } catch (err) {
      console.error(
        `  [warn] Failed to write state: ${err instanceof Error ? err.message : String(err)}`
      );
      return false;
    }
  }

  function getRecent(n = 5) {
    return readEntries().slice(-n);
  }

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

  function getCategoryHistory(categoryKey, windowSize = 10) {
    const entries = readEntries().slice(-windowSize);
    return entries
      .map((e) => e.categories?.[categoryKey]?.score)
      .filter((v) => typeof v === "number");
  }

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
