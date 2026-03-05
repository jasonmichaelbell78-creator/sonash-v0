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

// Symlink guard
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require("./lib/security-helpers"));
} catch {
  console.error("security-helpers unavailable; refusing to write");
  isSafeToWrite = () => false;
}

function parseReviewsFromFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const entries = [];

  for (let i = 0; i < lines.length; i++) {
    const reviewMatch = lines[i].match(/^#{2,4}\s+Review\s+#(\d+)/);
    if (reviewMatch) {
      entries.push({
        type: "review",
        id: parseInt(reviewMatch[1], 10),
        startLine: i,
        headerLine: lines[i],
      });
      continue;
    }
    const retroMatch = lines[i].match(/^###?\s+PR\s+#(\d+)\s+Retrospective/);
    if (retroMatch) {
      entries.push({
        type: "retrospective",
        id: parseInt(retroMatch[1], 10),
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
function collectArchiveReviews(archiveFiles) {
  const reviewMap = new Map();
  let totalDupes = 0;

  for (const f of archiveFiles) {
    const entries = parseReviewsFromFile(path.join(ARCHIVE_DIR, f));
    for (const entry of entries) {
      const key = `${entry.type}-${entry.id}`;
      if (reviewMap.has(key)) {
        totalDupes++;
        if (entry.content.length > reviewMap.get(key).content.length) {
          reviewMap.set(key, entry);
        }
      } else {
        reviewMap.set(key, entry);
      }
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
        if (!j.id || typeof j.id !== "number") continue;
        const key = `review-${j.id}`;
        if (!reviewMap.has(key) && !activeIds.has(key)) {
          reviewMap.set(key, {
            type: "review",
            id: j.id,
            content: generateMarkdownFromJsonl(j),
            fromJsonl: true,
          });
          backfilledIds.add(j.id);
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
  for (let i = 0; i < reviews.length; i += GROUP_SIZE) {
    const group = reviews.slice(i, i + GROUP_SIZE);
    const rangeStart = group[0].id;
    const rangeEnd = group[group.length - 1].id;
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
    let bestGroup = groups[groups.length - 1];
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
 * Apply the repair: backup old files, delete obsolete, write new archives.
 */
function applyRepair(archiveFiles, groups, toDelete, today) {
  console.log("\nApplying repair...");

  const backupDir = path.join(ARCHIVE_DIR, ".backup-" + today);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  for (const f of archiveFiles) {
    fs.copyFileSync(path.join(ARCHIVE_DIR, f), path.join(backupDir, f));
  }
  console.log(`  Backed up ${archiveFiles.length} files to ${path.basename(backupDir)}/`);

  for (const f of toDelete) {
    fs.unlinkSync(path.join(ARCHIVE_DIR, f));
  }
  console.log(`  Deleted ${toDelete.length} old files`);

  for (const g of groups) {
    const content = buildArchiveFileContent(g.entries, g.rangeStart, g.rangeEnd, today);
    const filePath = path.join(ARCHIVE_DIR, g.filename);
    if (!isSafeToWrite(filePath)) {
      console.error(`  Refusing to write ${g.filename}: symlink detected`);
      continue;
    }
    fs.writeFileSync(filePath, content, "utf8");
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
      `Backfilled ${backfilledIds.size} reviews from JSONL: ${sorted[0]}-${sorted[sorted.length - 1]}`
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
