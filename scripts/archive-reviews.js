#!/usr/bin/env node
/* global __dirname */
/**
 * archive-reviews.js
 *
 * Automates review archival from AI_REVIEW_LEARNINGS_LOG.md to archive files
 * in docs/archive/. When the active log exceeds a threshold (default: 20),
 * the oldest entries are moved to a new archive file.
 *
 * Usage:
 *   npm run reviews:archive              # Preview (dry run)
 *   npm run reviews:archive -- --apply   # Apply archival
 *   npm run reviews:archive -- --keep 20 # Keep newest N reviews (default: 20)
 *
 * Exit codes:
 *   0 = Success (or no archival needed)
 *   1 = Dry-run / archive needed (preview mode)
 *   2 = Error
 */

const {
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  lstatSync,
  copyFileSync,
} = require("node:fs");
const { join, dirname } = require("node:path");

// Symlink guard (Review #316-#323)
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require(join(__dirname, "..", ".claude", "hooks", "lib", "symlink-guard")));
} catch {
  console.error("symlink-guard unavailable; refusing to write");
  isSafeToWrite = () => false;
}

const ROOT = join(__dirname, "..");
const LEARNINGS_LOG = join(ROOT, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const ARCHIVE_DIR = join(ROOT, "docs", "archive");

const args = new Set(process.argv.slice(2));
const applyMode = args.has("--apply");
const quiet = args.has("--quiet");

// Parse --keep N (default 20)
let keepCount = 20;
const argList = process.argv.slice(2);
for (let i = 0; i < argList.length; i++) {
  if (argList[i] === "--keep" && i + 1 < argList.length) {
    const parsed = Number.parseInt(argList[i + 1], 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      keepCount = parsed;
    }
  }
}

function log(msg) {
  if (!quiet) console.log(msg);
}

function sanitizeError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg
    .replaceAll(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
    .replaceAll(/\/home\/[^/\s]+/gi, "[HOME]")
    .replaceAll(/\/Users\/[^/\s]+/gi, "[HOME]");
}

/**
 * Check if a path is a symlink (safe -- returns false on error)
 */
function isSymlink(filePath) {
  try {
    return lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Atomic write: write to .tmp, then rename.
 * Validates symlink safety before writing.
 */
function atomicWrite(filePath, content) {
  if (!isSafeToWrite(filePath)) {
    throw new Error("Refusing to write: symlink detected at " + filePath);
  }

  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const tmpPath = filePath + ".tmp";

  // Guard the tmp path too
  if (!isSafeToWrite(tmpPath)) {
    throw new Error("Refusing to write: symlink detected at tmp path");
  }

  writeFileSync(tmpPath, content, "utf8");

  // Validate tmp was written successfully
  const written = readFileSync(tmpPath, "utf8");
  if (written.length !== content.length) {
    throw new Error("Atomic write validation failed: size mismatch");
  }

  renameSync(tmpPath, filePath);
}

/**
 * Parse the learnings log and identify all entry blocks.
 *
 * Returns an array of entry objects, each with:
 *   - type: "review" | "retrospective"
 *   - id: review number (for reviews) or PR number (for retrospectives)
 *   - pr: PR number (extracted from content for reviews, from header for retros)
 *   - startLine: line index (0-based) where the entry header begins
 *   - endLine: line index (0-based, exclusive) where the entry ends
 *   - headerLine: the raw header line
 */
function parseEntryBlocks(lines) {
  const entries = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Match #### Review #N
    const reviewMatch = line.match(/^####\s+Review\s+#(\d+)/);
    if (reviewMatch) {
      entries.push({
        type: "review",
        id: Number.parseInt(reviewMatch[1], 10),
        pr: null,
        startLine: i,
        endLine: -1,
        headerLine: line,
      });
      continue;
    }

    // Match ### PR #N Retrospective
    const retroMatch = line.match(/^###\s+PR\s+#(\d+)\s+Retrospective/);
    if (retroMatch) {
      entries.push({
        type: "retrospective",
        id: Number.parseInt(retroMatch[1], 10),
        pr: Number.parseInt(retroMatch[1], 10),
        startLine: i,
        endLine: -1,
        headerLine: line,
      });
      continue;
    }
  }

  // Extract PR numbers for reviews from their content
  // Also determine endLine for each entry: the line before the next entry starts,
  // trimming trailing "---" separators
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const nextStart = i + 1 < entries.length ? entries[i + 1].startLine : lines.length;

    // endLine: include everything up to the next entry, but include trailing ---
    entry.endLine = nextStart;

    // For reviews, extract PR number from content
    if (entry.type === "review") {
      const block = lines.slice(entry.startLine, entry.endLine).join("\n");
      const prMatch = block.match(/PR\s*#(\d+)/);
      if (prMatch) {
        entry.pr = Number.parseInt(prMatch[1], 10);
      }
    }
  }

  return entries;
}

/**
 * Determine which entries to archive based on keep threshold.
 * Returns { toArchive, toKeep } arrays of entry objects.
 *
 * Retrospectives are archived only if ALL their associated reviews
 * (same PR number) are being archived.
 */
function selectEntriesForArchival(entries, keep) {
  const totalEntries = entries.length;

  if (totalEntries <= keep) {
    return { toArchive: [], toKeep: entries };
  }

  // In the file, entries are ordered newest-first (top) to oldest-last (bottom).
  // So entries[0] is the newest and entries[length-1] is the oldest.
  // We archive from the end (oldest entries).
  const candidateKeep = entries.slice(0, keep);
  const candidateArchive = entries.slice(keep);

  // Check retrospectives: a retrospective should only be archived if ALL
  // reviews with the same PR are also being archived
  const toArchive = [];
  const deferred = [];

  for (const entry of candidateArchive) {
    if (entry.type === "retrospective") {
      // Find all reviews for this PR
      const prReviews = entries.filter((e) => e.type === "review" && e.pr === entry.pr);
      const allReviewsArchived = prReviews.every((r) =>
        candidateArchive.some((a) => a.type === "review" && a.id === r.id)
      );

      if (allReviewsArchived) {
        toArchive.push(entry);
      } else {
        // Defer this retrospective -- keep it in the active log
        deferred.push(entry);
      }
    } else {
      toArchive.push(entry);
    }
  }

  const toKeep = [...deferred, ...candidateKeep];
  // Sort toKeep by startLine to maintain document order
  toKeep.sort((a, b) => a.startLine - b.startLine);

  return { toArchive, toKeep };
}

/**
 * Extract the text block for a set of entries from the lines array.
 * Returns the entries' content as a single string, in chronological order (oldest first).
 */
function extractEntryText(lines, entries) {
  // entries should already be sorted by startLine (oldest first, since they
  // appear bottom-to-top in the file -- actually reviews are bottom=oldest)
  // Actually in this file, the NEWEST reviews are at the top and oldest at the bottom.
  // So entries sorted by startLine ascending = newest first.
  // We want chronological = oldest first = reverse of startLine order.
  const sorted = [...entries].sort((a, b) => b.startLine - a.startLine);

  const blocks = [];
  for (const entry of sorted) {
    const block = lines.slice(entry.startLine, entry.endLine);
    blocks.push(block.join("\n"));
  }

  return blocks.join("\n");
}

/**
 * Determine the archive filename based on the review IDs being archived.
 */
function getArchiveFilename(entries) {
  const reviewIds = entries.filter((e) => e.type === "review").map((e) => e.id);
  const retroIds = entries.filter((e) => e.type === "retrospective").map((e) => e.id);

  const allIds = [...reviewIds, ...retroIds];
  if (allIds.length === 0) return null;

  const min = Math.min(...allIds);
  const max = Math.max(...(reviewIds.length > 0 ? reviewIds : retroIds));

  return `REVIEWS_${min}-${max}.md`;
}

/**
 * Build the archive file content matching the existing archive format.
 */
function buildArchiveContent(entries, lines, today) {
  const reviewIds = entries.filter((e) => e.type === "review").map((e) => e.id);
  const min = Math.min(...(reviewIds.length > 0 ? reviewIds : entries.map((e) => e.id)));
  const max = Math.max(...(reviewIds.length > 0 ? reviewIds : entries.map((e) => e.id)));

  const entryText = extractEntryText(lines, entries);

  const header = [
    "<!-- prettier-ignore-start -->",
    "**Document Version:** 1.0",
    `**Last Updated:** ${today}`,
    "**Status:** ACTIVE",
    "<!-- prettier-ignore-end -->",
    "",
    `# Archived Reviews #${min}-#${max}`,
    "",
    `Reviews archived from AI_REVIEW_LEARNINGS_LOG.md on ${today}.`,
    "",
    "---",
    "",
  ].join("\n");

  return header + entryText + "\n";
}

/**
 * Count existing archive files to determine the next archive number.
 */
function getNextArchiveNumber() {
  const archivePattern = /^REVIEWS_\d+-\d+\.md$/;
  let count = 0;

  if (!existsSync(ARCHIVE_DIR)) return 1;

  try {
    const entries = require("node:fs").readdirSync(ARCHIVE_DIR);
    for (const entry of entries) {
      if (archivePattern.test(entry)) {
        count++;
      }
    }
  } catch {
    // If we can't read the dir, assume 0 existing
  }

  return count + 1;
}

/**
 * Update the Archive Reference section in the active log content.
 * Adds a new archive entry and updates the count text.
 */
function updateArchiveReference(content, archiveFilename, entries, archiveNumber, today) {
  const reviewIds = entries.filter((e) => e.type === "review").map((e) => e.id);
  const min = Math.min(...(reviewIds.length > 0 ? reviewIds : entries.map((e) => e.id)));
  const max = Math.max(...(reviewIds.length > 0 ? reviewIds : entries.map((e) => e.id)));

  // Find the "Access archives only for historical investigation" line and insert before it
  const accessLine = "Access archives only for historical investigation of specific patterns.";
  const accessIdx = content.indexOf(accessLine);

  if (accessIdx === -1) {
    // Fallback: find "## Archive Reference" section and append
    log("  Warning: Could not find archive reference insertion point");
    return content;
  }

  const newArchiveEntry = [
    `### Archive ${archiveNumber}: Reviews #${min}-${max}`,
    "",
    "- **Archive location:**",
    `  [docs/archive/${archiveFilename}](./archive/${archiveFilename})`,
    `- **Coverage:** Archived on ${today}`,
    `- **Status:** Reviews #${min}-${max} archived.`,
    "",
  ].join("\n");

  // Insert the new archive entry before the access line
  const updated = content.slice(0, accessIdx) + newArchiveEntry + content.slice(accessIdx);

  // Update the count in the header text "Reviews #1-N have been archived in N files:"
  const archiveHeaderPattern = /\*\*Reviews #\d+-\d+\*\* have been archived in (\w+) files:/;
  const archiveHeaderMatch = updated.match(archiveHeaderPattern);
  if (archiveHeaderMatch) {
    const oldText = archiveHeaderMatch[0];
    const newText = `**Reviews #1-${max}** have been archived in ${numberToWord(archiveNumber)} files:`;
    return updated.replace(oldText, newText);
  }

  return updated;
}

/**
 * Convert small numbers to words for the archive count text.
 */
function numberToWord(n) {
  const words = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
    "twenty",
  ];
  return n <= 20 ? words[n] : String(n);
}

/**
 * Remove archived entries from the active log content.
 * Preserves everything before and after the entry region.
 */
function removeArchivedEntries(lines, entriesToArchive, entriesToKeep) {
  // Determine the full region occupied by all entries (archive + keep)
  const allEntries = [...entriesToArchive, ...entriesToKeep].sort(
    (a, b) => a.startLine - b.startLine
  );

  if (allEntries.length === 0) return lines.join("\n");

  const regionStart = allEntries[0].startLine;
  const regionEnd = allEntries[allEntries.length - 1].endLine;

  // Build the new content: everything before region, then kept entries, then everything after
  const before = lines.slice(0, regionStart);
  const after = lines.slice(regionEnd);

  // Collect kept entry blocks in their original order
  const keptBlocks = [];
  for (const entry of entriesToKeep) {
    const block = lines.slice(entry.startLine, entry.endLine);
    keptBlocks.push(block.join("\n"));
  }

  const keptContent = keptBlocks.join("\n");
  const result = before.join("\n") + keptContent + "\n" + after.join("\n");

  return result;
}

function main() {
  try {
    log("Archive Reviews: AI_REVIEW_LEARNINGS_LOG.md\n");

    // Validate paths
    if (!existsSync(LEARNINGS_LOG)) {
      console.error("AI_REVIEW_LEARNINGS_LOG.md not found");
      process.exitCode = 2;
      return;
    }

    if (isSymlink(LEARNINGS_LOG)) {
      console.error("Refusing to read symlink");
      process.exitCode = 2;
      return;
    }

    const content = readFileSync(LEARNINGS_LOG, "utf8");
    const lines = content.split("\n");

    // Parse all entry blocks
    const entries = parseEntryBlocks(lines);

    const reviewCount = entries.filter((e) => e.type === "review").length;
    const retroCount = entries.filter((e) => e.type === "retrospective").length;
    const totalCount = entries.length;

    log(`  Reviews found:        ${reviewCount}`);
    log(`  Retrospectives found: ${retroCount}`);
    log(`  Total entries:        ${totalCount}`);
    log(`  Keep threshold:       ${keepCount}`);

    if (totalCount <= keepCount) {
      log(`\nNo archival needed. ${totalCount} entries <= ${keepCount} threshold.`);
      process.exitCode = 0;
      return;
    }

    // Select entries for archival
    const { toArchive, toKeep } = selectEntriesForArchival(entries, keepCount);

    if (toArchive.length === 0) {
      log("\nNo entries selected for archival (retrospective constraints).");
      process.exitCode = 0;
      return;
    }

    const archiveReviewIds = toArchive
      .filter((e) => e.type === "review")
      .map((e) => e.id)
      .sort((a, b) => a - b);
    const archiveRetroIds = toArchive
      .filter((e) => e.type === "retrospective")
      .map((e) => e.id)
      .sort((a, b) => a - b);

    log(`\n  Entries to archive: ${toArchive.length}`);
    if (archiveReviewIds.length > 0) {
      log(
        `    Reviews: #${archiveReviewIds[0]}-#${archiveReviewIds[archiveReviewIds.length - 1]} (${archiveReviewIds.length} total)`
      );
    }
    if (archiveRetroIds.length > 0) {
      log(`    Retrospectives: ${archiveRetroIds.map((id) => "PR #" + id).join(", ")}`);
    }
    log(`  Entries to keep:    ${toKeep.length}`);

    // Determine archive filename
    const archiveFilename = getArchiveFilename(toArchive);
    if (!archiveFilename) {
      console.error("Could not determine archive filename");
      process.exitCode = 2;
      return;
    }

    const archivePath = join(ARCHIVE_DIR, archiveFilename);
    const archiveNumber = getNextArchiveNumber();
    const today = new Date().toISOString().slice(0, 10);

    log(`\n  Archive file:   docs/archive/${archiveFilename}`);
    log(`  Archive number: ${archiveNumber}`);

    if (!applyMode) {
      log("\nDry run. Use --apply to archive.");
      log("\nPreview of entries to archive:");
      for (const entry of toArchive) {
        const label =
          entry.type === "review" ? `Review #${entry.id}` : `PR #${entry.id} Retrospective`;
        log(`  - ${label}`);
      }
      log("\nEntries that would remain:");
      for (const entry of toKeep) {
        const label =
          entry.type === "review" ? `Review #${entry.id}` : `PR #${entry.id} Retrospective`;
        log(`  - ${label}`);
      }
      process.exitCode = 1;
      return;
    }

    // --- Apply mode ---

    // Check archive path doesn't already exist
    if (existsSync(archivePath)) {
      console.error(`Archive file already exists: ${archiveFilename}`);
      process.exitCode = 2;
      return;
    }

    // Ensure archive directory exists
    if (!existsSync(ARCHIVE_DIR)) {
      mkdirSync(ARCHIVE_DIR, { recursive: true });
    }

    // Step 1: Back up the active log
    const backupPath = LEARNINGS_LOG + ".bak";
    try {
      if (!isSafeToWrite(backupPath)) {
        console.error("Refusing to write backup: symlink detected");
        process.exitCode = 2;
        return;
      }
      copyFileSync(LEARNINGS_LOG, backupPath);
      log(`\n  Backup: AI_REVIEW_LEARNINGS_LOG.md.bak`);
    } catch (err) {
      console.error("Failed to create backup:", sanitizeError(err));
      process.exitCode = 2;
      return;
    }

    // Step 2: Build and write the archive file
    const archiveContent = buildArchiveContent(toArchive, lines, today);

    try {
      atomicWrite(archivePath, archiveContent);
    } catch (err) {
      console.error("Failed to write archive file:", sanitizeError(err));
      process.exitCode = 2;
      return;
    }

    // Step 3: Validate archive was written
    if (!existsSync(archivePath)) {
      console.error("Archive file was not created successfully");
      process.exitCode = 2;
      return;
    }

    const writtenArchive = readFileSync(archivePath, "utf8");
    if (writtenArchive.length < 100) {
      console.error("Archive file appears too small, aborting active log modification");
      process.exitCode = 2;
      return;
    }

    log(`  Archive written: ${archiveFilename} (${writtenArchive.length} bytes)`);

    // Step 4: Remove archived entries from active log
    let updatedContent = removeArchivedEntries(lines, toArchive, toKeep);

    // Step 5: Update the Archive Reference section
    updatedContent = updateArchiveReference(
      updatedContent,
      archiveFilename,
      toArchive,
      archiveNumber,
      today
    );

    // Step 6: Write updated active log
    try {
      atomicWrite(LEARNINGS_LOG, updatedContent);
    } catch (err) {
      console.error("Failed to update active log:", sanitizeError(err));
      console.error("Archive file was written successfully at:", archiveFilename);
      console.error("Backup available at: AI_REVIEW_LEARNINGS_LOG.md.bak");
      process.exitCode = 2;
      return;
    }

    log(`  Active log updated: ${toKeep.length} entries remaining`);

    // Step 7: Summary
    log(`\nArchival complete:`);
    log(`  Archived: ${toArchive.length} entries -> docs/archive/${archiveFilename}`);
    log(`  Remaining: ${toKeep.length} entries in active log`);
    if (archiveReviewIds.length > 0) {
      log(
        `  Review range: #${archiveReviewIds[0]}-#${archiveReviewIds[archiveReviewIds.length - 1]}`
      );
    }
    if (archiveRetroIds.length > 0) {
      log(`  Retrospectives: ${archiveRetroIds.map((id) => "PR #" + id).join(", ")}`);
    }
    log(`  Backup: AI_REVIEW_LEARNINGS_LOG.md.bak`);

    process.exitCode = 0;
  } catch (err) {
    console.error("Error:", sanitizeError(err));
    process.exitCode = 2;
  }
}

main();
