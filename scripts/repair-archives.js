#!/usr/bin/env node
/**
 * repair-archives.js
 *
 * One-time repair script that:
 * 1. Reads all REVIEWS_*.md archive files
 * 2. Deduplicates reviews (keeps longest version of each)
 * 3. Backfills missing reviews from JSONL archive data
 * 4. Rewrites archives into clean, non-overlapping range files (groups of 40)
 * 5. Removes the old overlapping files
 *
 * Usage:
 *   node scripts/repair-archives.js              # Preview (dry run)
 *   node scripts/repair-archives.js --apply      # Apply repair
 */

/* global __dirname */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const ARCHIVE_DIR = path.join(ROOT, "docs", "archive");
const JSONL_PATH = path.join(ROOT, ".claude", "state", "reviews.jsonl");
const JSONL_ARCHIVE_PATH = path.join(ROOT, ".claude", "state", "reviews.jsonl.archive");
const ACTIVE_LOG = path.join(ROOT, "docs", "AI_REVIEW_LEARNINGS_LOG.md");

const applyMode = process.argv.includes("--apply");
const GROUP_SIZE = 40;

// Safe-fs wrappers (symlink guard + EXDEV fallback)
let safeWriteFileSync;
try {
  ({ safeWriteFileSync } = require("./lib/safe-fs"));
} catch {
  console.error("safe-fs unavailable; refusing to write");
  safeWriteFileSync = () => {};
}

// Symlink guard
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require("./lib/security-helpers"));
} catch {
  console.error("security-helpers unavailable; refusing to write");
  isSafeToWrite = () => false;
}

function parseReviewsFromFile(filePath) {
  // Symlink guard: skip symlinks to prevent local file leakage
  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isSymbolicLink()) return [];
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const entries = [];

  for (let i = 0; i < lines.length; i++) {
    const reviewMatch = lines[i].match(/^#{2,4}\s+Review\s+#(\d+)/);
    if (reviewMatch) {
      entries.push({
        type: "review",
        id: Number.parseInt(reviewMatch[1], 10),
        startLine: i,
        headerLine: lines[i],
      });
      continue;
    }
    const retroMatch = lines[i].match(/^###?\s+PR\s+#(\d+)\s+Retrospective/);
    if (retroMatch) {
      entries.push({
        type: "retrospective",
        id: Number.parseInt(retroMatch[1], 10),
        startLine: i,
        headerLine: lines[i],
      });
    }
  }

  // Set end lines
  for (let i = 0; i < entries.length; i++) {
    entries[i].endLine = i + 1 < entries.length ? entries[i + 1].startLine : lines.length;
    // Trim trailing blank lines and separators
    while (
      entries[i].endLine > entries[i].startLine &&
      /^(\s*|---)$/.test(lines[entries[i].endLine - 1])
    ) {
      entries[i].endLine--;
    }
    entries[i].content = lines.slice(entries[i].startLine, entries[i].endLine).join("\n");
  }

  return entries;
}

function generateMarkdownFromJsonl(entry) {
  const date = entry.date || "unknown";
  const title = entry.title || `Review #${entry.id}`;
  const patterns = (entry.patterns || []).join(", ") || "none recorded";
  const learnings = (entry.learnings || []).join("\n- ") || "none recorded";

  return [
    `#### Review #${entry.id}`,
    "",
    `**Date:** ${date}`,
    `**Title:** ${title}`,
    `**Patterns:** ${patterns}`,
    "",
    `**Learnings:**`,
    learnings ? `- ${learnings}` : "- (reconstructed from JSONL — original markdown not available)",
    "",
    `> _Note: This entry was reconstructed from JSONL archive data during archive repair._`,
  ].join("\n");
}

function buildArchiveFileContent(entries, rangeStart, rangeEnd, today) {
  const header = [
    "<!-- prettier-ignore-start -->",
    "**Document Version:** 1.0",
    `**Last Updated:** ${today}`,
    "**Status:** ACTIVE",
    "<!-- prettier-ignore-end -->",
    "",
    `# Archived Reviews #${rangeStart}-#${rangeEnd}`,
    "",
    `Reviews archived from AI_REVIEW_LEARNINGS_LOG.md. Repaired on ${today}.`,
    "",
    "---",
    "",
  ].join("\n");

  const body = entries
    .sort((a, b) => {
      // Reviews first, then retros, sorted by ID
      if (a.type !== b.type) return a.type === "review" ? -1 : 1;
      return a.id - b.id;
    })
    .map((e) => e.content)
    .join("\n\n---\n\n");

  return header + body + "\n";
}

/**
 * Collect and deduplicate all reviews from archive files.
 * Keeps the longest version of each review when duplicates exist.
 */
function deduplicateEntry(reviewMap, entry) {
  const key = `${entry.type}-${entry.id}`;
  const existing = reviewMap.get(key);
  if (existing) {
    if (entry.content.length > existing.content.length) {
      reviewMap.set(key, entry);
    }
    return true;
  }
  reviewMap.set(key, entry);
  return false;
}

function collectArchiveReviews(archiveFiles) {
  const reviewMap = new Map();
  let totalDupes = 0;

  for (const f of archiveFiles) {
    try {
      const entries = parseReviewsFromFile(path.join(ARCHIVE_DIR, f));
      for (const entry of entries) {
        if (deduplicateEntry(reviewMap, entry)) totalDupes++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  [warn] Skipping unreadable archive file ${f}: ${msg.split("\n")[0]}`);
    }
  }

  return { reviewMap, totalDupes };
}

/**
 * Remove entries from archive map that exist in the active log.
 */
function removeActiveLogDuplicates(reviewMap, activeIds) {
  let removed = 0;
  for (const key of activeIds) {
    if (reviewMap.has(key)) {
      reviewMap.delete(key);
      removed++;
    }
  }
  return removed;
}

/**
 * Backfill missing reviews from JSONL archive data.
 */
function backfillFromJsonl(reviewMap, activeIds) {
  const backfilledIds = new Set();

  for (const jsonlPath of [JSONL_ARCHIVE_PATH, JSONL_PATH]) {
    if (!fs.existsSync(jsonlPath)) continue;
    const lines = fs.readFileSync(jsonlPath, "utf8").trim().split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const j = JSON.parse(line);
        const id = Number(j.id);
        if (!Number.isFinite(id) || !Number.isInteger(id) || id <= 0) continue;
        const key = `review-${id}`;
        if (!reviewMap.has(key) && !activeIds.has(key)) {
          reviewMap.set(key, {
            type: "review",
            id,
            content: generateMarkdownFromJsonl({ ...j, id }),
            fromJsonl: true,
          });
          backfilledIds.add(id);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return backfilledIds;
}

/**
 * Group reviews into non-overlapping range files and attach retrospectives.
 */
function groupReviewsIntoRanges(reviewMap) {
  const reviews = [...reviewMap.values()]
    .filter((e) => e.type === "review")
    .sort((a, b) => a.id - b.id);
  const retros = [...reviewMap.values()]
    .filter((e) => e.type === "retrospective")
    .sort((a, b) => a.id - b.id);

  const groups = [];

  if (reviews.length === 0) {
    if (retros.length === 0) return groups;
    // No reviews but retros exist — keep them in a single file
    const rangeStart = retros[0].id;
    const rangeEnd = retros.at(-1).id;
    groups.push({
      entries: [...retros],
      rangeStart,
      rangeEnd,
      filename: `REVIEWS_${rangeStart}-${rangeEnd}.md`,
    });
    return groups;
  }

  for (let i = 0; i < reviews.length; i += GROUP_SIZE) {
    const group = reviews.slice(i, i + GROUP_SIZE);
    if (group.length === 0) continue;
    const rangeStart = group[0].id;
    const rangeEnd = group.at(-1).id;
    const groupRetros = retros.filter((r) => r.id >= rangeStart && r.id <= rangeEnd);

    groups.push({
      entries: [...group, ...groupRetros],
      rangeStart,
      rangeEnd,
      filename: `REVIEWS_${rangeStart}-${rangeEnd}.md`,
    });
  }

  // Attach unassigned retros to nearest group
  const assignedRetroIds = new Set(
    groups.flatMap((g) => g.entries.filter((e) => e.type === "retrospective").map((e) => e.id))
  );
  for (const retro of retros) {
    if (assignedRetroIds.has(retro.id)) continue;
    let bestGroup = groups.at(-1);
    let bestDist = Infinity;
    for (const g of groups) {
      const dist = Math.min(Math.abs(retro.id - g.rangeStart), Math.abs(retro.id - g.rangeEnd));
      if (dist < bestDist) {
        bestDist = dist;
        bestGroup = g;
      }
    }
    bestGroup.entries.push(retro);
  }

  return groups;
}

/**
 * Preflight: verify all write/delete/backup destinations are safe.
 * Returns false and sets exitCode if any path is unsafe.
 */
function preflightSafetyCheck(archiveFiles, groups, toDelete, backupDir) {
  const plannedWrites = groups.map((g) => path.join(ARCHIVE_DIR, g.filename));
  const plannedBackups = archiveFiles.map((f) => path.join(backupDir, f));
  const plannedDeletes = toDelete.map((f) => path.join(ARCHIVE_DIR, f));
  const unsafe = [...plannedWrites, ...plannedBackups, ...plannedDeletes].filter(
    (p) => !isSafeToWrite(p)
  );
  if (unsafe.length > 0) {
    console.error("  Refusing to apply repair: unsafe paths detected:");
    for (const p of unsafe) console.error(`   - ${p}`);
    console.error("  No files were deleted or overwritten.");
    process.exitCode = 1;
    return false;
  }
  return true;
}

/**
 * Back up archive files into the backup directory.
 */
function backupFiles(archiveFiles, backupDir) {
  for (const f of archiveFiles) {
    const srcPath = path.join(ARCHIVE_DIR, f);
    try {
      if (!fs.existsSync(srcPath)) continue;
      const st = fs.lstatSync(srcPath);
      if (st.isSymbolicLink() || !st.isFile()) continue;
      fs.copyFileSync(srcPath, path.join(backupDir, f));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  [warn] Failed to back up ${f}: ${msg.split("\n")[0]}`);
    }
  }
  console.log(`  Backed up ${archiveFiles.length} files to ${path.basename(backupDir)}/`);
}

/**
 * Delete obsolete archive files.
 */
function deleteObsoleteFiles(toDelete) {
  for (const f of toDelete) {
    const delPath = path.join(ARCHIVE_DIR, f);
    try {
      if (!fs.existsSync(delPath)) continue;
      const st = fs.lstatSync(delPath);
      if (st.isSymbolicLink() || !st.isFile()) continue;
      fs.unlinkSync(delPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  [warn] Failed to delete ${f}: ${msg.split("\n")[0]}`);
    }
  }
  console.log(`  Deleted ${toDelete.length} old files`);
}

/**
 * Apply the repair: backup old files, delete obsolete, write new archives.
 */
function applyRepair(archiveFiles, groups, toDelete, today) {
  console.log("\nApplying repair...");

  const backupDir = path.join(ARCHIVE_DIR, ".backup-" + today);

  if (!preflightSafetyCheck(archiveFiles, groups, toDelete, backupDir)) return;

  // Guard against symlinked backup directory
  if (fs.existsSync(backupDir) && fs.lstatSync(backupDir).isSymbolicLink()) {
    console.error(`  Refusing to apply repair: backup dir is a symlink: ${backupDir}`);
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  backupFiles(archiveFiles, backupDir);
  deleteObsoleteFiles(toDelete);

  for (const g of groups) {
    const content = buildArchiveFileContent(g.entries, g.rangeStart, g.rangeEnd, today);
    const filePath = path.join(ARCHIVE_DIR, g.filename);
    if (!isSafeToWrite(filePath)) continue;
    safeWriteFileSync(filePath, content, "utf8");
  }
  console.log(`  Wrote ${groups.length} archive files`);
  console.log("\nRepair complete!");
}

function main() {
  console.log("Archive Repair Tool\n");

  const archiveFiles = fs
    .readdirSync(ARCHIVE_DIR)
    .filter((f) => /^REVIEWS_\d+-\d+\.md$/.test(f))
    .sort();
  console.log(`Found ${archiveFiles.length} archive files`);

  const { reviewMap, totalDupes } = collectArchiveReviews(archiveFiles);

  const activeEntries = parseReviewsFromFile(ACTIVE_LOG);
  const activeIds = new Set(activeEntries.map((e) => `${e.type}-${e.id}`));
  console.log(`Active log has ${activeEntries.length} entries`);

  const removedFromArchive = removeActiveLogDuplicates(reviewMap, activeIds);
  if (removedFromArchive > 0) {
    console.log(`Removed ${removedFromArchive} entries that duplicate active log`);
  }

  const backfilledIds = backfillFromJsonl(reviewMap, activeIds);
  if (backfilledIds.size > 0) {
    const sorted = [...backfilledIds].sort((a, b) => a - b);
    console.log(
      `Backfilled ${backfilledIds.size} reviews from JSONL: ${sorted[0]}-${sorted.at(-1)}`
    );
  }

  console.log(`\nTotal unique archived reviews: ${reviewMap.size}`);
  console.log(`Duplicates removed: ${totalDupes}`);

  const groups = groupReviewsIntoRanges(reviewMap);
  const today = new Date().toISOString().slice(0, 10);

  console.log(`\nPlanned archive files (${groups.length}):`);
  for (const g of groups) {
    const reviewCount = g.entries.filter((e) => e.type === "review").length;
    const retroCount = g.entries.filter((e) => e.type === "retrospective").length;
    console.log(`  ${g.filename}: ${reviewCount} reviews, ${retroCount} retros`);
  }

  const newFilenames = new Set(groups.map((g) => g.filename));
  const oldFilenames = new Set(archiveFiles);
  const toDelete = [...oldFilenames].filter((f) => !newFilenames.has(f));

  console.log(`\nFiles to delete: ${toDelete.length}`);
  for (const f of toDelete) console.log(`  - ${f}`);
  const toCreate = [...newFilenames].filter((f) => !oldFilenames.has(f));
  console.log(`Files to create: ${toCreate.length}`);
  for (const f of toCreate) console.log(`  + ${f}`);
  const toOverwrite = [...newFilenames].filter((f) => oldFilenames.has(f));
  console.log(`Files to overwrite: ${toOverwrite.length}`);
  for (const f of toOverwrite) console.log(`  ~ ${f}`);

  if (!applyMode) {
    console.log("\nDry run. Use --apply to execute repair.");
    process.exitCode = 1;
    return;
  }

  applyRepair(archiveFiles, groups, toDelete, today);
  process.exitCode = 0;
}

main();
