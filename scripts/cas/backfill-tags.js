"use strict";

/**
 * Content Analysis System — Backfill Tags
 *
 * Adds tags to extraction-journal.jsonl entries that have empty/missing tags
 * by looking up the source's analysis.json and copying source-level tags.
 *
 * Usage: node scripts/cas/backfill-tags.js [--dry-run]
 *
 * @see .claude/skills/shared/CONVENTIONS.md (Section 14: Tag Conventions)
 */

const fs = require("node:fs");
const path = require("node:path");
const { sanitizeError, validatePathInDir, slugify } = require("../lib/security-helpers.js");
const { safeWriteFileSync, isSafeToWrite } = require("../lib/safe-fs");

const PROJECT_ROOT = path.resolve(__dirname, "../.."); // validatePathInDir: constant-path (no user input)
const JOURNAL_PATH = path.join(PROJECT_ROOT, ".research", "extraction-journal.jsonl");
const ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis");
const LEGACY_DIRS = [
  path.join(PROJECT_ROOT, ".research", "repo-analysis"),
  path.join(PROJECT_ROOT, ".research", "website-analysis"),
];

const DRY_RUN = process.argv.includes("--dry-run");

function findTagsForSource(source) {
  // Search all analysis dirs (current + legacy) for a matching source
  // Uses fuzzy matching: normalize both to slugs for comparison
  const sourceSlug = slugify(source);
  const searchDirs = [ANALYSIS_DIR, ...LEGACY_DIRS];
  for (const baseDir of searchDirs) {
    if (!fs.existsSync(baseDir)) continue;
    try {
      const dirs = fs.readdirSync(baseDir, { withFileTypes: true });
      for (const dir of dirs) {
        if (!dir.isDirectory() || dir.name.startsWith("_")) continue;
        validatePathInDir(baseDir, dir.name);
        const analysisPath = path.join(baseDir, dir.name, "analysis.json");
        try {
          const st = fs.lstatSync(analysisPath);
          if (st.isSymbolicLink()) continue;
          const data = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
          if (!data.tags || data.tags.length === 0) continue;
          // Match by exact source, slug, fuzzy slug, or containment
          const dataSlug = slugify(data.source);
          const dirSlug = slugify(dir.name);
          const match =
            data.source === source ||
            data.slug === source ||
            dataSlug === sourceSlug ||
            slugify(data.slug || "") === sourceSlug ||
            dirSlug === sourceSlug ||
            // Containment: "unstructured" in "unstructured-io-unstructured"
            (sourceSlug.includes(dataSlug) && dataSlug.length >= 5) ||
            (sourceSlug.includes(dirSlug) && dirSlug.length >= 5);
          if (match) return data.tags;
        } catch {
          // skip malformed
        }
      }
    } catch {
      // skip
    }
  }
  return null;
}

function main() {
  if (!fs.existsSync(JOURNAL_PATH)) {
    console.error("No extraction journal found.");
    process.exit(1);
  }

  const lines = fs.readFileSync(JOURNAL_PATH, "utf8").trim().split("\n");
  let backfilled = 0;
  let skipped = 0;
  let alreadyTagged = 0;
  const tagCache = new Map();
  const updatedLines = [];

  for (const line of lines) {
    if (!line.trim()) {
      updatedLines.push(line);
      continue;
    }
    try {
      const entry = JSON.parse(line);
      if (entry.tags && entry.tags.length > 0) {
        alreadyTagged++;
        updatedLines.push(line);
        continue;
      }

      // Look up tags for this source
      const source = entry.source;
      if (!source || typeof source !== "string" || source.trim().length === 0) {
        skipped++;
        updatedLines.push(line);
        continue;
      }
      if (!tagCache.has(source)) {
        tagCache.set(source, findTagsForSource(source));
      }
      const sourceTags = tagCache.get(source);

      if (sourceTags) {
        entry.tags = sourceTags;
        updatedLines.push(JSON.stringify(entry));
        backfilled++;
      } else {
        skipped++;
        updatedLines.push(line);
      }
    } catch {
      updatedLines.push(line);
      skipped++;
    }
  }

  console.log(
    `Backfill tags: ${backfilled} updated, ${alreadyTagged} already tagged, ${skipped} no source tags found`
  );

  if (DRY_RUN) {
    console.log("(dry run — no changes written)");
    return;
  }

  if (backfilled === 0) {
    console.log("Nothing to update.");
    return;
  }

  if (!isSafeToWrite(JOURNAL_PATH)) {
    console.error("Refusing to write — symlink detected");
    process.exit(1);
  }

  safeWriteFileSync(JOURNAL_PATH, updatedLines.join("\n") + "\n", "utf8");
  console.log("Journal updated.");
}

try {
  main();
} catch (err) {
  console.error(`Fatal: ${sanitizeError(err)}`);
  process.exit(1);
}
