#!/usr/bin/env node
/* global __dirname */
/**
 * sync-reviews-to-jsonl.js
 *
 * Syncs reviews from AI_REVIEW_LEARNINGS_LOG.md to .claude/state/reviews.jsonl.
 * Parses #### Review #N entries, extracts structured fields, and appends
 * any reviews not already present in the JSONL file.
 *
 * This is the bridge between the markdown authoring surface and the JSONL
 * consumption surface used by run-consolidation.js.
 *
 * Usage:
 *   npm run reviews:sync              # Preview (dry run)
 *   npm run reviews:sync -- --apply   # Apply sync
 *   npm run reviews:sync -- --check   # Exit 1 if drift detected (for CI/hooks)
 *
 * Exit codes:
 *   0 = Success (or no sync needed)
 *   1 = Drift detected (--check mode) or sync needed (dry run)
 *   2 = Error
 */

const { existsSync, readFileSync, appendFileSync, lstatSync } = require("node:fs");
const { join } = require("node:path");

const ROOT = join(__dirname, "..");
const LEARNINGS_LOG = join(ROOT, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const REVIEWS_FILE = join(ROOT, ".claude", "state", "reviews.jsonl");

const args = process.argv.slice(2);
const applyMode = args.includes("--apply");
const checkMode = args.includes("--check");
const quiet = args.includes("--quiet");

function log(msg) {
  if (!quiet) console.log(msg);
}

function sanitizeError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg
    .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
    .replace(/\/home\/[^/\s]+/gi, "[HOME]")
    .replace(/\/Users\/[^/\s]+/gi, "[HOME]");
}

/**
 * Load existing review IDs from JSONL
 */
function loadExistingIds() {
  const ids = new Set();
  if (!existsSync(REVIEWS_FILE)) return ids;

  try {
    const content = readFileSync(REVIEWS_FILE, "utf8").replace(/\r\n/g, "\n").trim();
    if (!content) return ids;
    for (const line of content.split("\n")) {
      try {
        const obj = JSON.parse(line);
        if (typeof obj.id === "number") ids.add(obj.id);
      } catch {
        /* skip malformed */
      }
    }
  } catch (err) {
    console.error("Failed to read reviews.jsonl:", sanitizeError(err));
  }
  return ids;
}

/**
 * Parse reviews from the markdown learning log.
 * Extracts: id, date, title, source, pr, patterns, fixed, deferred, learnings
 */
function parseMarkdownReviews(content) {
  const reviews = [];
  const lines = content.split("\n");
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match #### Review #N: Title (YYYY-MM-DD)
    const headerMatch = line.match(/^####\s+Review\s+#(\d+):?\s*(.*)/);
    if (headerMatch) {
      if (current) reviews.push(current);

      const id = parseInt(headerMatch[1], 10);
      const titleAndDate = headerMatch[2].trim();
      const dateMatch = titleAndDate.match(/\((\d{4}-\d{2}-\d{2})\)\s*$/);
      const date = dateMatch ? dateMatch[1] : null;
      const title = dateMatch
        ? titleAndDate.slice(0, titleAndDate.lastIndexOf("(")).trim()
        : titleAndDate;

      current = {
        id,
        date,
        title,
        source: null,
        pr: null,
        patterns: [],
        fixed: 0,
        deferred: 0,
        learnings: [],
        _rawLines: [],
      };
      continue;
    }

    if (!current) continue;
    current._rawLines.push(line);
  }

  if (current) reviews.push(current);

  // Second pass: extract structured fields from raw lines
  for (const review of reviews) {
    const raw = review._rawLines.join("\n");

    // Source
    const sourceMatch = raw.match(/\*\*Source:\*\*\s*([^\n*]+)/);
    if (sourceMatch) {
      const src = sourceMatch[1].toLowerCase().trim();
      const parts = [];
      if (src.includes("sonarcloud") || src.includes("sonarqube")) parts.push("sonarcloud");
      if (src.includes("qodo")) parts.push("qodo");
      if (src.includes("ci") || src.includes("github")) parts.push("ci");
      if (src.includes("coderabbit")) parts.push("coderabbit");
      review.source = parts.length > 0 ? parts.join("+") : "manual";
    }

    // PR number
    const prMatch = raw.match(/PR\s*#(\d+)/);
    if (prMatch) review.pr = parseInt(prMatch[1], 10);

    // Fixed count
    const fixedMatch = raw.match(/Fixed:\s*(\d+)/i) || raw.match(/fixed\s*(\d+)/i);
    if (fixedMatch) review.fixed = parseInt(fixedMatch[1], 10);

    // Deferred count
    const deferredMatch = raw.match(/Deferred:\s*(\d+)/i) || raw.match(/deferred\s*(\d+)/i);
    if (deferredMatch) review.deferred = parseInt(deferredMatch[1], 10);

    // Patterns from numbered lists under "Patterns Identified" or "Key Patterns"
    const patternMatches = raw.matchAll(/^\d+\.\s+\*\*([^*]+)\*\*/gm);
    for (const m of patternMatches) {
      const pattern = m[1]
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 60);
      if (pattern && !review.patterns.includes(pattern)) {
        review.patterns.push(pattern);
      }
    }

    // Learnings from "Key Learnings" or "Lesson" sections
    const learningLines = raw.match(/[-*]\s+(?:`[^`]+`\s+)?[A-Z].{15,}/g) || [];
    for (const ll of learningLines.slice(0, 7)) {
      const cleaned = ll.replace(/^[-*]\s+/, "").trim();
      if (cleaned.length > 20 && cleaned.length < 300) {
        review.learnings.push(cleaned);
      }
    }

    // Clean up
    delete review._rawLines;
    if (!review.date) review.date = "unknown";
    if (!review.source) review.source = "manual";
  }

  return reviews;
}

function main() {
  try {
    log("🔄 Review Sync: AI_REVIEW_LEARNINGS_LOG.md → reviews.jsonl\n");

    // Validate paths
    if (!existsSync(LEARNINGS_LOG)) {
      console.error("AI_REVIEW_LEARNINGS_LOG.md not found");
      process.exitCode = 2;
      return;
    }

    // Symlink check
    try {
      if (lstatSync(LEARNINGS_LOG).isSymbolicLink()) {
        console.error("Refusing to read symlink");
        process.exitCode = 2;
        return;
      }
    } catch {
      /* file may not exist yet */
    }

    // Load data
    const existingIds = loadExistingIds();
    const content = readFileSync(LEARNINGS_LOG, "utf8");
    const mdReviews = parseMarkdownReviews(content);

    log(`  Markdown reviews found: ${mdReviews.length}`);
    log(`  JSONL reviews existing: ${existingIds.size}`);

    // Find missing
    const missing = mdReviews.filter((r) => !existingIds.has(r.id));
    missing.sort((a, b) => a.id - b.id);

    if (missing.length === 0) {
      log("\n✅ All reviews are synced. No drift detected.");
      process.exitCode = 0;
      return;
    }

    const maxExisting = existingIds.size > 0 ? Math.max(...existingIds) : 0;
    const maxMd = mdReviews.length > 0 ? Math.max(...mdReviews.map((r) => r.id)) : 0;

    log(`\n⚠️  ${missing.length} reviews in markdown but not in JSONL:`);
    log(`  IDs: ${missing.map((r) => "#" + r.id).join(", ")}`);
    log(`  JSONL max: #${maxExisting} | Markdown max: #${maxMd}`);

    if (checkMode) {
      console.log(`\nDRIFT: ${missing.length} reviews not synced to reviews.jsonl`);
      console.log(`Run: npm run reviews:sync -- --apply`);
      process.exitCode = 1;
      return;
    }

    if (applyMode) {
      const lines = missing.map((r) => JSON.stringify(r));
      appendFileSync(REVIEWS_FILE, lines.join("\n") + "\n");
      log(`\n✅ Appended ${missing.length} reviews to reviews.jsonl`);
      log(`  Range: #${missing[0].id} - #${missing[missing.length - 1].id}`);
      process.exitCode = 0;
    } else {
      log("\nDry run. Use --apply to sync.");
      // Show preview of first entry
      if (missing.length > 0) {
        log("\nPreview (first entry):");
        log(JSON.stringify(missing[0], null, 2));
      }
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("Error:", sanitizeError(err));
    process.exitCode = 2;
  }
}

main();
