#!/usr/bin/env node
// v1 fallback available at: scripts/sync-reviews-to-jsonl.v1.js
/* global __dirname */
/**
 * sync-reviews-to-jsonl.js
 *
 * Syncs reviews from AI_REVIEW_LEARNINGS_LOG.md to .claude/state/reviews.jsonl.
 * Parses #### Review #N entries AND ### PR #N Retrospective entries, extracts
 * structured fields, and appends any not already present in the JSONL file.
 *
 * This is the bridge between the markdown authoring surface and the JSONL
 * consumption surface used by run-consolidation.js.
 *
 * Usage:
 *   npm run reviews:sync              # Preview (dry run)
 *   npm run reviews:sync -- --apply   # Apply sync
 *   npm run reviews:sync -- --check   # Exit 1 if drift detected (for CI/hooks)
 *   npm run reviews:sync -- --repair  # Full rebuild of reviews.jsonl from markdown
 *
 * Exit codes:
 *   0 = Success (or no sync needed)
 *   1 = Drift detected (--check mode) or sync needed (dry run)
 *   2 = Error
 */

const fs = require("node:fs"); // catch-verified: core module
const pathMod = require("node:path"); // catch-verified: core module
const { existsSync, readFileSync, lstatSync, rmSync, mkdirSync } = fs; // require() destructure
const { copyFileSync } = fs; // require() destructure
const { join } = pathMod; // require() destructure

// Safe-fs wrappers (symlink guard + EXDEV fallback + read size guard)
// Note: require path is ../lib because this file lives in scripts/archive/
let safeWriteFileSync, safeAppendFileSync, readTextWithSizeGuard, streamLinesSync;
try {
  ({
    safeWriteFileSync,
    safeAppendFileSync,
    readTextWithSizeGuard,
    streamLinesSync,
  } = require("../lib/safe-fs"));
} catch {
  console.error("safe-fs unavailable; cannot safely write files");
  process.exit(2);
}

// Symlink guard (Review #316-#323)
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require("../lib/security-helpers"));
} catch {
  console.error("security-helpers unavailable; refusing to write");
  isSafeToWrite = () => false;
}

const { safeParseLine } = require("../lib/parse-jsonl-line.js");

const ROOT = join(__dirname, "..");
const LEARNINGS_LOG = join(ROOT, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const REVIEWS_FILE = join(ROOT, ".claude", "state", "reviews.jsonl");

const args = new Set(process.argv.slice(2));
const applyMode = args.has("--apply");
const checkMode = args.has("--check");
const repairMode = args.has("--repair");
const quiet = args.has("--quiet");

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
 * Atomic write: write to .tmp then rename into place.
 * Checks isSafeToWrite for both the tmp path and the target path.
 */
function atomicWriteFileSync(targetPath, content) {
  const tmpPath = targetPath + ".tmp";
  if (!isSafeToWrite(tmpPath)) {
    throw new Error("Refusing to write: symlink detected at tmp path");
  }
  if (!isSafeToWrite(targetPath)) {
    throw new Error("Refusing to write: symlink detected at target path");
  }
  safeWriteFileSync(tmpPath, content, "utf8"); // atomic .tmp → copy below
  if (existsSync(targetPath)) rmSync(targetPath, { force: true });
  copyFileSync(tmpPath, targetPath);
  try {
    rmSync(tmpPath, { force: true });
  } catch {
    /* best-effort cleanup */
  }
}

/**
 * Try to extract a number in "Label: N" format starting at the character after the label.
 * Returns the parsed integer, or -1 if not found.
 */
function tryLabelColonNumber(text, afterLabel) {
  let cursor = afterLabel;
  while (cursor < text.length && (text[cursor] === " " || text[cursor] === "\t")) cursor++;
  if (cursor >= text.length || text[cursor] !== ":") return -1;
  cursor++; // skip colon
  while (cursor < text.length && (text[cursor] === " " || text[cursor] === "\t")) cursor++;
  const numStart = cursor;
  while (cursor < text.length && text[cursor] >= "0" && text[cursor] <= "9") cursor++;
  if (cursor > numStart) return Number.parseInt(text.slice(numStart, cursor), 10);
  return -1;
}

/**
 * Try to extract a number in "N LABEL" format by scanning backwards from just before the label.
 * Returns the parsed integer, or -1 if not found.
 */
function tryNumberBeforeLabel(text, beforePos) {
  let cursor = beforePos;
  while (cursor >= 0 && (text[cursor] === " " || text[cursor] === "\t")) cursor--;
  if (cursor < 0 || text[cursor] < "0" || text[cursor] > "9") return -1;
  const numEnd = cursor + 1;
  while (cursor >= 0 && text[cursor] >= "0" && text[cursor] <= "9") cursor--;
  return Number.parseInt(text.slice(cursor + 1, numEnd), 10);
}

/**
 * Parse a severity/total count from text using pure string operations (no regex).
 * Supports both "N LABEL" format (e.g., "3 CRITICAL") and "Label: N" format
 * (e.g., "Critical: 3"), case-insensitive.
 * Returns the parsed integer, or 0 if not found.
 */
function parseSeverityCount(text, label) {
  const lowerText = text.toLowerCase();
  const lowerLabel = label.toLowerCase();
  let idx = 0;

  while (idx < lowerText.length) {
    const pos = lowerText.indexOf(lowerLabel, idx);
    if (pos === -1) break;

    const colonResult = tryLabelColonNumber(text, pos + lowerLabel.length);
    if (colonResult >= 0) return colonResult;

    const prefixResult = tryNumberBeforeLabel(text, pos - 1);
    if (prefixResult >= 0) return prefixResult;

    idx = pos + 1;
  }

  return 0;
}

/**
 * Load existing review IDs from JSONL
 */
function loadExistingIds() {
  const ids = new Set();
  if (!existsSync(REVIEWS_FILE)) return ids;

  try {
    const content = readTextWithSizeGuard(REVIEWS_FILE).replaceAll("\r\n", "\n").trim();
    if (!content) return ids;
    for (const line of content.split("\n")) {
      const obj = safeParseLine(line);
      if (!obj) continue;
      if (typeof obj.id === "number") ids.add(obj.id);
    }
  } catch (err) {
    // Size guard tripped — fall back to streaming parse so we don't hard-fail
    // once reviews.jsonl grows past the 2 MiB default whole-file ceiling. The
    // string-match on err.message is deliberate: readTextWithSizeGuard throws
    // a generic Error with this exact prefix and no dedicated code.
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("exceeds size guard")) {
      // Guard against an older safe-fs export shape that lacks streamLinesSync.
      // In practice the top-level require catch process.exit(2)s on load
      // failure, but if safe-fs partially loaded we'd otherwise fall through
      // to the wrong error branch with a misleading message.
      if (typeof streamLinesSync !== "function") {
        console.error("Failed to read reviews.jsonl: streamLinesSync unavailable in safe-fs");
        return new Set();
      }
      const streamIds = new Set();
      try {
        streamLinesSync(REVIEWS_FILE, (line) => {
          const obj = safeParseLine(line);
          if (!obj) return;
          if (typeof obj.id === "number") streamIds.add(obj.id);
        });
        return streamIds;
      } catch (streamErr) {
        // Silent partial-state is worse than an empty set: downstream dedupe
        // would compute "new" against a stale prefix. Force a clean fresh
        // set so duplicate-protection falls back to the file-level overwrite
        // path, which is at least consistent.
        console.error("Failed to stream reviews.jsonl:", sanitizeError(streamErr));
        return new Set();
      }
    }
    console.error("Failed to read reviews.jsonl:", sanitizeError(err));
  }
  return ids;
}

// ── Review parsing helpers (extracted to keep parseMarkdownReviews CC ≤15) ────

// Metadata labels that must not be stored as "patterns" (they're field headers).
const REVIEW_PATTERN_SKIP = new Set([
  "source",
  "pr",
  "prbranch",
  "items",
  "fixed",
  "deferred",
  "rejected",
  "total-items",
  "total",
  "suggestions",
  "resolution",
  "resolution-stats",
  "patterns-identified",
  "patterns",
  "pattern",
  "key-patterns",
  "key-learning",
  "key-learnings",
  "key-fix",
  "key-fixes",
  "context",
  "rejections",
  "process",
  "approach",
]);

const REVIEW_LEARNING_METADATA_MARKERS = [
  "**Source:**",
  "**PR/Branch:**",
  "**Suggestions:**",
  "**Resolution Stats:**",
  "**Patterns Identified:**",
  "**Rejected:**",
  "**Resolution:**",
  "**Deferred:**",
];

// Normalize free text into a pattern slug (lowercase, alphanumeric+dash, ≤60).
function normalizeReviewPatternSlug(text) {
  return text
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .slice(0, 60);
}

// Add a pattern to review.patterns if it passes the validity + dedup gates.
function pushReviewPatternIfNew(review, rawText) {
  const pattern = normalizeReviewPatternSlug(rawText);
  if (
    pattern &&
    pattern.length > 3 &&
    !REVIEW_PATTERN_SKIP.has(pattern) &&
    !review.patterns.includes(pattern)
  ) {
    review.patterns.push(pattern);
  }
}

// Create an empty review entry with all fields pre-initialized.
function createEmptyReviewEntry(id, title, date) {
  return {
    id,
    date,
    title,
    source: null,
    pr: null,
    patterns: [],
    fixed: 0,
    deferred: 0,
    rejected: 0,
    critical: 0,
    major: 0,
    minor: 0,
    trivial: 0,
    total: 0,
    learnings: [],
    _rawLines: [],
  };
}

// Parse a `## Review #N: Title (YYYY-MM-DD)` header line, or return null.
function parseReviewHeader(line) {
  const headerMatch = line.match(/^#{2,4}\s+Review\s+#(\d+):?\s*(.*)/);
  if (!headerMatch) return null;
  const id = Number.parseInt(headerMatch[1], 10);
  // Guard against Infinity from pathologically long digit strings AND against
  // values beyond Number.MAX_SAFE_INTEGER which would silently lose precision
  // during dedupe/sort. isSafeInteger covers both cases plus Number.NaN; the
  // > 0 check normalizes on the domain invariant (review IDs are positive).
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const titleAndDate = headerMatch[2].trim();
  const dateMatch = titleAndDate.match(/\((\d{4}-\d{2}-\d{2})\)\s*$/);
  const date = dateMatch ? dateMatch[1] : null;
  const title = dateMatch
    ? titleAndDate.slice(0, titleAndDate.lastIndexOf("(")).trim()
    : titleAndDate;
  return createEmptyReviewEntry(id, title, date);
}

// First pass: split markdown content into review blocks with unparsed _rawLines.
function splitContentIntoReviewBlocks(content) {
  const reviews = [];
  const lines = content.split("\n");
  let current = null;
  let inFence = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const newReview = parseReviewHeader(line);
    if (newReview) {
      if (current) reviews.push(current);
      current = newReview;
      continue;
    }
    if (current) current._rawLines.push(line);
  }
  if (current) reviews.push(current);
  return reviews;
}

// Extract the normalized `source` tag from a review's raw text.
function extractReviewSource(raw) {
  const sourceMatch = raw.match(/\*\*Source:\*\*\s*([^\n*]+)/);
  if (!sourceMatch) return null;
  const src = sourceMatch[1].toLowerCase().trim();
  const parts = [];
  if (src.includes("sonarcloud") || src.includes("sonarqube")) parts.push("sonarcloud");
  if (src.includes("qodo")) parts.push("qodo");
  if (src.includes("ci") || src.includes("github")) parts.push("ci");
  if (src.includes("coderabbit")) parts.push("coderabbit");
  return parts.length > 0 ? parts.join("+") : "manual";
}

// Extract the fixed/deferred/rejected count fields from raw text.
function extractReviewResolutionCounts(raw) {
  const result = { fixed: 0, deferred: 0, rejected: 0 };
  const fixedMatch = raw.match(/Fixed:\s*(\d+)/i) || raw.match(/fixed\s*(\d+)/i);
  if (fixedMatch) result.fixed = Number.parseInt(fixedMatch[1], 10);
  const deferredMatch = raw.match(/Deferred:\s*(\d+)/i) || raw.match(/deferred\s*(\d+)/i);
  if (deferredMatch) result.deferred = Number.parseInt(deferredMatch[1], 10);
  const rejectedMatch = raw.match(/Rejected:\s*(\d+)/i) || raw.match(/rejected\s*(\d+)/i);
  if (rejectedMatch) result.rejected = Number.parseInt(rejectedMatch[1], 10);
  return result;
}

// Fallback: sum the paren-count tokens on the **Source:** line when severity
// counts are all zero but a total exists (e.g., "SonarCloud (3) + Qodo (6)").
function deriveSourceBreakdownTotal(raw) {
  const sourceBreakdown = raw.match(/\*\*Source:\*\*\s*([^\n]+)/);
  if (!sourceBreakdown) return null;
  const sourceCounts = [...sourceBreakdown[1].matchAll(/\((\d+)\)/g)];
  const sourceTotal = sourceCounts.reduce((sum, m) => sum + Number.parseInt(m[1], 10), 0);
  if (sourceTotal <= 0) return null;
  return { sourceBreakdown: sourceBreakdown[1].trim(), total: sourceTotal };
}

// Fill review.critical/major/minor/trivial/total and the source-breakdown fallback.
function applyReviewSeverityBreakdown(review, raw) {
  review.critical = parseSeverityCount(raw, "CRITICAL");
  review.major = parseSeverityCount(raw, "MAJOR");
  review.minor = parseSeverityCount(raw, "MINOR");
  review.trivial = parseSeverityCount(raw, "TRIVIAL");
  const totalFromTotal = parseSeverityCount(raw, "total");
  const totalFromItems = parseSeverityCount(raw, "items");
  review.total = totalFromTotal || totalFromItems;
  if (review.total > 0 && review.critical === 0 && review.major === 0 && review.minor === 0) {
    const fallback = deriveSourceBreakdownTotal(raw);
    if (fallback) {
      review.sourceBreakdown = fallback.sourceBreakdown;
      review.total = fallback.total;
    }
  }
}

// Format 1+2: numbered/bullet items with bold text — `1. **Pattern**` or `- **Pattern**`.
function applyBoldItemPatterns(review, raw) {
  const boldItemMatches = raw.matchAll(/^(?:\d+\.|-)\s+\*\*([^*]+)\*\*/gm);
  for (const m of boldItemMatches) pushReviewPatternIfNew(review, m[1]);
}

// Format 3: inline `**Pattern(s):** foo; bar; baz` list.
function applyInlinePatterns(review, raw) {
  const inlineMatch = raw.match(/\*\*Patterns?:?\*\*:?\s+([^\n]+)/i);
  if (!inlineMatch) return;
  const parts = inlineMatch[1]
    .trim()
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const part of parts) pushReviewPatternIfNew(review, part);
}

// Locate the "Key Patterns" / "Patterns Identified" section body (raw text
// between the header line and the next terminator). Returns null on miss.
function findPatternsSectionBody(rawLines) {
  let headerIdx = -1;
  for (let li = 0; li < rawLines.length; li++) {
    const lower = rawLines[li].toLowerCase();
    if (lower.includes("**key patterns") || lower.includes("**patterns identified")) {
      headerIdx = li;
      break;
    }
  }
  if (headerIdx < 0) return null;
  const bodyLines = [];
  let scanned = 0;
  for (let li = headerIdx + 1; li < rawLines.length; li++) {
    const trimmed = rawLines[li].trimStart();
    if (trimmed.startsWith("**") || trimmed.startsWith("---") || /^#{2,4}\s/.test(trimmed)) break;
    bodyLines.push(rawLines[li]);
    scanned++;
    if (scanned >= 200) break;
  }
  return bodyLines.join("\n");
}

// Pull the pattern name out of one `- Pattern name: description` bullet line.
function extractPatternFromBulletLine(bulletLine) {
  const trimmed = bulletLine.trimStart();
  if (!trimmed.startsWith("-")) return null;
  let text = trimmed.slice(1).trimStart();
  if (text.startsWith("**")) text = text.slice(2);
  else if (text.startsWith("*")) text = text.slice(1);
  const colonIdx = text.indexOf(":");
  const starIdx = text.indexOf("*");
  if (colonIdx > 0 && (starIdx < 0 || colonIdx < starIdx)) return text.slice(0, colonIdx);
  if (starIdx > 0) return text.slice(0, starIdx);
  return text;
}

// Format 4: bullets beneath a "Key Patterns" / "Patterns Identified" section.
function applySectionBodyPatterns(review, raw) {
  const rawLines = raw.split("\n");
  const sectionBody = findPatternsSectionBody(rawLines);
  if (!sectionBody) return;
  for (const bulletLine of sectionBody.split("\n")) {
    const patternText = extractPatternFromBulletLine(bulletLine);
    if (patternText) pushReviewPatternIfNew(review, patternText);
  }
}

// Pull up to 7 "Key Learnings"-style bullet lines out of raw text.
function applyReviewLearnings(review, raw) {
  const learningLines = raw.match(/[-*]\s+(?:`[^`]+`\s+)?[A-Z].{15,}/g) || [];
  const seenLearnings = new Set();
  for (const ll of learningLines.slice(0, 7)) {
    const cleaned = ll.replace(/^[-*]\s+/, "").trim();
    const isMetadata = REVIEW_LEARNING_METADATA_MARKERS.some((marker) => cleaned.includes(marker));
    if (isMetadata) continue;
    if (cleaned.length <= 20 || cleaned.length >= 300) continue;
    if (seenLearnings.has(cleaned)) continue;
    review.learnings.push(cleaned);
    seenLearnings.add(cleaned);
  }
}

// Second-pass enrichment: run every extractor against the review's raw lines
// and then drop the `_rawLines` scratch field.
function enrichReviewFromRawLines(review) {
  const raw = review._rawLines.join("\n");
  const source = extractReviewSource(raw);
  if (source) review.source = source;
  const prMatch = raw.match(/PR\s*#(\d+)/);
  if (prMatch) review.pr = Number.parseInt(prMatch[1], 10);
  Object.assign(review, extractReviewResolutionCounts(raw));
  applyReviewSeverityBreakdown(review, raw);
  applyBoldItemPatterns(review, raw);
  applyInlinePatterns(review, raw);
  applySectionBodyPatterns(review, raw);
  applyReviewLearnings(review, raw);
  delete review._rawLines;
  if (!review.date) review.date = "unknown";
  if (!review.source) review.source = "manual";
}

/**
 * Parse reviews from the markdown learning log.
 * Extracts: id, date, title, source, pr, patterns, fixed, deferred, learnings.
 * Heavy lifting is delegated to the per-field extractors above so this
 * orchestrator stays below the cognitive-complexity threshold.
 */
function parseMarkdownReviews(content) {
  const reviews = splitContentIntoReviewBlocks(content);
  for (const review of reviews) enrichReviewFromRawLines(review);
  return reviews;
}

// ── Retrospective extraction helpers ──────────────────────────────────────────

/**
 * Extract rounds/items/fixed/rejected/deferred from retrospective raw text.
 */
function extractRetroRounds(raw) {
  const result = { rounds: 0, totalItems: 0, fixed: 0, rejected: 0, deferred: 0 };

  // Rounds — supports both "**Rounds:** N" and table "| Rounds | N (...) |"
  const roundsMatch = raw.match(/\*\*Rounds:\*\*\s*(\d+)/) || raw.match(/\|\s*Rounds\s*\|\s*(\d+)/);
  if (roundsMatch) result.rounds = Number.parseInt(roundsMatch[1], 10);

  // Total items — supports both "**Items:** N" and table "| Total items | N |"
  const itemsMatch =
    raw.match(/\*\*(?:Items|Total items processed):\*\*\s*~?(\d+)/) ||
    raw.match(/\|\s*Total items\s*\|\s*~?(\d+)/);
  if (itemsMatch) result.totalItems = Number.parseInt(itemsMatch[1], 10);

  // Fixed — supports bold, table, and inline parenthetical formats
  const fixedMatch =
    raw.match(/\*\*Fixed:\*\*\s*~?(\d+)/) ||
    raw.match(/\|\s*Fixed\s*\|\s*~?(\d+)/) ||
    raw.match(/Fixed:\s*~?(\d+)/);
  if (fixedMatch) result.fixed = Number.parseInt(fixedMatch[1], 10);

  // Rejected — supports all formats
  const rejectedMatch =
    raw.match(/\*\*Rejected:\*\*\s*~?(\d+)/) ||
    raw.match(/\|\s*Rejected\s*\|\s*~?(\d+)/) ||
    raw.match(/Rejected:\s*~?(\d+)/);
  if (rejectedMatch) result.rejected = Number.parseInt(rejectedMatch[1], 10);

  // Deferred — supports all formats
  const deferredMatch =
    raw.match(/\*\*Deferred:\*\*\s*~?(\d+)/) ||
    raw.match(/\|\s*Deferred\s*\|\s*~?(\d+)/) ||
    raw.match(/Deferred:\s*~?(\d+)/);
  if (deferredMatch) result.deferred = Number.parseInt(deferredMatch[1], 10);

  return result;
}

/**
 * Count churn chains (ping-pong entries) using string parsing (no regex).
 * Counts lines that contain both bold markers (**...**) and "(ping-pong)".
 * Falls back to counting bullet lines matching "- **...**...RN-RN" pattern.
 */
function extractRetroChurnChains(raw) {
  let churnChains = 0;
  const lines = raw.split("\n");

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    // Check for bold text: find "**" opening and a second "**" closing
    const firstBold = line.indexOf("**");
    if (firstBold === -1) continue;
    const secondBold = line.indexOf("**", firstBold + 2);
    if (secondBold === -1) continue;
    // Check for "(ping-pong)" anywhere in the line (case-insensitive)
    if (lowerLine.includes("(ping-pong)")) {
      churnChains++;
    }
  }

  // Also count from explicit "Ping-pong chains" section
  if (churnChains === 0) {
    const chainBullets = raw.match(/^- \*\*[^*]+\*\*.*?R\d+-R\d+/gm) || [];
    churnChains = chainBullets.length;
  }

  return { churnChains };
}

/**
 * Extract automation candidates from table rows or bullet points using string parsing.
 * Parses table rows by splitting on "|" instead of regex.
 */
/**
 * Check if a table cell contains an R-pattern (e.g., "R1,R3" or "R2, R5").
 */
function isRoundCell(cell) {
  if (cell.length < 2 || cell[0] !== "R") return false;
  for (let j = 1; j < cell.length; j++) {
    const ch = cell[j];
    if (ch >= "0" && ch <= "9") continue;
    if (ch === "," || ch === " ") continue;
    return false;
  }
  return true;
}

/**
 * Check if any cell (from index 2 onward) in a table row is an R-pattern cell.
 */
function rowHasRoundCell(cells) {
  for (let i = 2; i < cells.length; i++) {
    if (isRoundCell(cells[i].trim())) return true;
  }
  return false;
}

// Return true when a table-row cell is a usable automation-candidate name.
function isCandidateNameCell(name) {
  return Boolean(name) && !name.startsWith("---") && !name.startsWith("Pattern");
}

// Collect automation candidates from `| Pattern | Rounds | ... |` table rows.
function collectCandidatesFromTableRows(raw, maxCount) {
  const out = [];
  for (const line of raw.split("\n")) {
    if (out.length >= maxCount) break;
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed.split("|");
    if (cells.length < 2 || !rowHasRoundCell(cells)) continue;
    const name = (cells[1] || "").trim();
    if (isCandidateNameCell(name)) out.push(name);
  }
  return out;
}

// Parse the `**Automation candidates:** foo, bar (~5 min), baz` prose list.
function collectCandidatesFromInlineBullet(raw, maxCount) {
  const autoBullet = raw.match(/\*\*Automation candidates:\*\*\s*([^\n]+)/);
  if (!autoBullet) return [];
  const out = [];
  for (const item of autoBullet[1].split(/,\s*/).slice(0, maxCount)) {
    const cleaned = item.replace(/\(~?\d+\s*min\)/, "").trim();
    if (cleaned) out.push(cleaned);
  }
  return out;
}

function extractRetroAutomation(raw) {
  const MAX_CANDIDATES = 10;
  const fromTable = collectCandidatesFromTableRows(raw, MAX_CANDIDATES);
  const automationCandidates =
    fromTable.length > 0 ? fromTable : collectCandidatesFromInlineBullet(raw, MAX_CANDIDATES);
  return { automationCandidates };
}

/**
 * Extract skills-to-update and process improvements from retrospective raw text.
 */
function extractRetroSkillsAndProcess(raw) {
  const skillsToUpdate = [];
  const processImprovements = [];

  // Skills to update
  const skillSection = raw.match(/#### Skills\/Templates to Update([\s\S]*?)(?=####|\n---\n|$)/);
  if (skillSection) {
    const skillBullets = skillSection[1].match(/^- \*\*([^*]+)\*\*/gm) || [];
    for (const sb of skillBullets) {
      const name = sb
        .replace(/^- \*\*/, "")
        .replace(/\*\*$/, "")
        .replace(/:$/, "")
        .trim();
      if (name) skillsToUpdate.push(name);
    }
  }

  // Process improvements
  const processSection = raw.match(/#### Process Improvements([\s\S]*?)(?=####|\n---\n|$)/);
  if (processSection) {
    const procBullets = processSection[1].match(/^\d+\.\s+\*\*([^*]+)\*\*/gm) || [];
    for (const pb of procBullets) {
      const name = pb
        .replace(/^\d+\.\s+\*\*/, "")
        .replace(/\*\*$/, "")
        .trim();
      if (name) processImprovements.push(name);
    }
  }

  return { skillsToUpdate, processImprovements };
}

/**
 * Extract verdict and high-impact learnings from retrospective raw text.
 */
function extractRetroLearnings(raw) {
  const learnings = [];

  const verdictSection = raw.match(/\*\*Verdict[^*]*\*\*:?\s*([^\n]+)/);
  if (verdictSection) {
    learnings.push(verdictSection[1].trim());
  }
  const highImpact = raw.match(/\*\*Highest-impact[^*]*\*\*:?\s*([^\n]+)/);
  if (highImpact) {
    learnings.push(highImpact[1].trim());
  }

  return { learnings };
}

/**
 * Create a new empty retrospective object from a heading match.
 */
function createRetroEntry(prNumber, date) {
  return {
    id: `retro-${prNumber}`,
    type: "retrospective",
    pr: Number.parseInt(prNumber, 10),
    date,
    rounds: 0,
    totalItems: 0,
    fixed: 0,
    rejected: 0,
    deferred: 0,
    churnChains: 0,
    automationCandidates: [],
    skillsToUpdate: [],
    processImprovements: [],
    learnings: [],
    _rawLines: [],
  };
}

/**
 * Check if a line is a section-ending heading (## or ### but not ####).
 */
function isSectionEndHeading(line) {
  return line.startsWith("## ") || (line.startsWith("### ") && !line.startsWith("####"));
}

/**
 * Enrich retro entries with structured fields from raw lines via helpers.
 */
function enrichRetroEntries(retros) {
  for (const retro of retros) {
    const raw = retro._rawLines.join("\n");
    Object.assign(retro, extractRetroRounds(raw));
    Object.assign(retro, extractRetroChurnChains(raw));
    Object.assign(retro, extractRetroAutomation(raw));
    Object.assign(retro, extractRetroSkillsAndProcess(raw));
    Object.assign(retro, extractRetroLearnings(raw));
    delete retro._rawLines;
  }
}

/**
 * Parse PR retrospective entries from the markdown.
 * Finds ### PR #N Retrospective sections and extracts structured data.
 */
// Parse a `### PR #N Retrospective (YYYY-MM-DD)` heading, or return null.
function parseRetroHeading(line) {
  const retroMatch = line.match(/^###\s+PR\s+#(\d+)\s+Retrospective\s*\((\d{4}-\d{2}-\d{2})\)/);
  if (!retroMatch) return null;
  return createRetroEntry(retroMatch[1], retroMatch[2]);
}

// Classify one line during the retrospective block scan. Returns a tag so the
// outer loop stays below cognitive-complexity threshold.
function classifyRetroLine(line, inFence) {
  if (line.trim().startsWith("```")) return { kind: "fence-toggle" };
  if (inFence) return { kind: "skip" };
  const heading = parseRetroHeading(line);
  if (heading) return { kind: "heading", heading };
  if (isSectionEndHeading(line)) return { kind: "section-end" };
  return { kind: "body" };
}

// Apply one classified retro line to the accumulating (retros, current) state.
// Returns the new `current` block (or null) and mutates retros in place.
function applyClassifiedRetroLine(classified, line, current, retros) {
  switch (classified.kind) {
    case "heading":
      if (current) retros.push(current);
      return classified.heading;
    case "section-end":
      if (current) retros.push(current);
      return null;
    case "body":
      if (current) current._rawLines.push(line);
      return current;
    default:
      return current;
  }
}

// Split markdown content into retrospective blocks with unparsed _rawLines.
function splitContentIntoRetroBlocks(content) {
  const retros = [];
  let current = null;
  let inFence = false;
  for (const line of content.split("\n")) {
    const classified = classifyRetroLine(line, inFence);
    if (classified.kind === "fence-toggle") {
      inFence = !inFence;
      continue;
    }
    if (classified.kind === "skip") continue;
    current = applyClassifiedRetroLine(classified, line, current, retros);
  }
  if (current) retros.push(current);
  return retros;
}

function parseRetrospectives(content) {
  const retros = splitContentIntoRetroBlocks(content);
  enrichRetroEntries(retros);
  return retros;
}

/**
 * Check if a path is a symlink (safe — returns false on error)
 */
function isSymlink(filePath) {
  try {
    return lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

// ── Mode handlers ─────────────────────────────────────────────────────────────

/**
 * Load review content from archive files in docs/archive/REVIEWS_*.md.
 * Returns concatenated content from all archive files.
 */
function loadArchiveContent() {
  const ARCHIVE_DIR = join(ROOT, "docs", "archive");
  if (!existsSync(ARCHIVE_DIR)) return "";

  const archivePattern = /^REVIEWS_\d+-\d+\.md$/;
  let combined = "";

  try {
    const entries = fs.readdirSync(ARCHIVE_DIR);
    const archiveFiles = entries.filter((e) => archivePattern.test(e)).sort();

    for (const file of archiveFiles) {
      const filePath = join(ARCHIVE_DIR, file);
      if (isSymlink(filePath)) continue;
      try {
        combined += "\n" + readFileSync(filePath, "utf8");
      } catch {
        /* skip unreadable files */
      }
    }
  } catch {
    /* skip if dir unreadable */
  }

  return combined;
}

// Back up the existing reviews.jsonl beside itself (symlink-guarded, atomic).
function backupReviewsFile() {
  if (!existsSync(REVIEWS_FILE)) return;
  const bakPath = REVIEWS_FILE + ".bak";
  try {
    // Guard the SOURCE, not just the destination: if REVIEWS_FILE itself is
    // a symlink (deliberately or accidentally planted), copyFileSync would
    // follow it and copy whatever the link targets into our .bak — exactly
    // the data-exposure risk Qodo flagged in R3 compliance.
    if (lstatSync(REVIEWS_FILE).isSymbolicLink()) {
      log("  ⚠️ Refusing to back up: source is a symlink (continuing anyway)");
      return;
    }
    if (!isSafeToWrite(bakPath)) {
      log("  ⚠️ Refusing to write backup: symlink detected (continuing anyway)");
      return;
    }
    // Use copyFileSync instead of readFileSync + atomicWriteFileSync — avoids
    // loading the entire reviews.jsonl into memory for the backup (Qodo 7/10
    // on large-file efficiency).
    copyFileSync(REVIEWS_FILE, bakPath);
    log(`  📦 Backup: reviews.jsonl.bak`);
  } catch {
    log("  ⚠️ Could not create backup (continuing anyway)");
  }
}

// Deduplicate reviews by numeric id (first occurrence wins) and sort ascending.
function dedupeAndSortReviews(reviews) {
  const seenReviewIds = new Set();
  const out = [];
  for (const r of reviews) {
    if (seenReviewIds.has(r.id)) continue;
    seenReviewIds.add(r.id);
    out.push(r);
  }
  out.sort((a, b) => a.id - b.id);
  return out;
}

// Deduplicate retros by (pr, date) — retro.id may be undefined — and sort by pr.
function dedupeAndSortRetros(retros) {
  const seen = new Set();
  const out = [];
  for (const r of retros) {
    const key = `retrospective:${String(r.pr ?? "")}:${String(r.date ?? "")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  // Use a finite-number-safe comparator so malformed pr values (Number.NaN,
  // Infinity) don't produce unstable sort order.
  out.sort((a, b) => {
    const aPr = typeof a.pr === "number" && Number.isFinite(a.pr) ? a.pr : Number.POSITIVE_INFINITY;
    const bPr = typeof b.pr === "number" && Number.isFinite(b.pr) ? b.pr : Number.POSITIVE_INFINITY;
    return aPr - bPr;
  });
  return out;
}

// Print the coverage summary lines for a successfully-rebuilt reviews.jsonl.
function logRepairCoverage(dedupedReviews, dedupedRetros) {
  log(`  ✅ Rebuilt reviews.jsonl:`);
  const firstId = dedupedReviews[0]?.id ?? "?";
  const lastId = dedupedReviews.at(-1)?.id ?? "?";
  log(`     Reviews: ${dedupedReviews.length} (IDs: #${firstId}-#${lastId})`);
  // Filter out malformed PR numbers (non-finite Number.NaN / Infinity are
  // tolerated by dedupeAndSortRetros via the finite-number comparator, but
  // must not appear in the human-readable summary as a literal "#" + Number.NaN
  // token). Report the invalid count separately so the total still adds up.
  const validPrs = dedupedRetros
    .map((r) => r.pr)
    .filter((pr) => typeof pr === "number" && Number.isFinite(pr));
  const invalidCount = dedupedRetros.length - validPrs.length;
  const prList = validPrs.map((pr) => "#" + pr).join(", ");
  const malformedSuffix = invalidCount > 0 ? ` (+${invalidCount} malformed)` : "";
  let prSummary;
  if (prList !== "") {
    prSummary = prList + malformedSuffix;
  } else if (invalidCount > 0) {
    prSummary = `${invalidCount} malformed`;
  } else {
    prSummary = "none";
  }
  log(`     Retros:  ${dedupedRetros.length} (PRs: ${prSummary})`);
  const withPatterns = dedupedReviews.filter((r) => r.patterns.length > 0);
  log(`     Patterns: ${withPatterns.length}/${dedupedReviews.length} entries have patterns`);
  const withSeverity = dedupedReviews.filter((r) => r.critical + r.major + r.minor + r.trivial > 0);
  log(`     Severity data: ${withSeverity.length}/${dedupedReviews.length} entries have breakdown`);
  const withLearnings = dedupedReviews.filter((r) => r.learnings.length > 0);
  log(`     Learnings: ${withLearnings.length}/${dedupedReviews.length} entries have learnings`);
}

/**
 * Handle --repair mode: full rebuild of reviews.jsonl from markdown.
 * Reads from both the active log AND archive files for complete coverage.
 */
function runRepairMode(content) {
  log("🔧 REPAIR MODE: Full rebuild of reviews.jsonl from markdown\n");

  if (!isSafeToWrite(REVIEWS_FILE)) {
    console.error("❌ Refusing to write: symlink detected at reviews.jsonl");
    process.exitCode = 2;
    return;
  }

  const stateDir = join(ROOT, ".claude", "state");
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }

  backupReviewsFile();

  // Load from active log + all archive files for complete coverage.
  // Active log first: wins dedup on ID collisions (newer data takes priority).
  const combinedContent = content + "\n" + loadArchiveContent();
  log(`  📚 Reading from active log + archive files`);

  const dedupedReviews = dedupeAndSortReviews(parseMarkdownReviews(combinedContent));
  const dedupedRetros = dedupeAndSortRetros(parseRetrospectives(combinedContent));

  const allLines = [...dedupedReviews, ...dedupedRetros].map((r) => JSON.stringify(r));
  try {
    atomicWriteFileSync(REVIEWS_FILE, allLines.join("\n") + "\n");
  } catch (err) {
    console.error("❌ Failed to write reviews.jsonl:", sanitizeError(err));
    process.exitCode = 2;
    return;
  }

  logRepairCoverage(dedupedReviews, dedupedRetros);
  process.exitCode = 0;
}

/**
 * Load existing retrospective IDs from the JSONL file.
 */
function loadExistingRetroIds() {
  const ids = new Set();
  if (!existsSync(REVIEWS_FILE)) return ids;
  try {
    const jsonlContent = readTextWithSizeGuard(REVIEWS_FILE).replaceAll("\r\n", "\n").trim();
    if (!jsonlContent) return ids;
    for (const line of jsonlContent.split("\n")) {
      const obj = safeParseLine(line);
      if (!obj) continue;
      if (typeof obj.id === "string" && obj.id.startsWith("retro-")) ids.add(obj.id);
    }
  } catch {
    /* skip */
  }
  return ids;
}

/**
 * Apply missing entries by appending to the JSONL file.
 */
function applySyncEntries(missing, missingReviews, missingRetros) {
  if (!isSafeToWrite(REVIEWS_FILE)) {
    console.error("❌ Refusing to write: symlink detected at reviews.jsonl");
    process.exitCode = 2;
    return;
  }
  const stateDir = join(ROOT, ".claude", "state");
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }
  const lines = missing.map((r) => JSON.stringify(r));
  // isSafeToWrite guard verified above for REVIEWS_FILE
  try {
    safeAppendFileSync(REVIEWS_FILE, lines.join("\n") + "\n");
  } catch (err) {
    console.error("❌ Failed to write reviews.jsonl:", sanitizeError(err));
    process.exitCode = 2;
    return;
  }
  log(`\n✅ Appended ${missing.length} entries to reviews.jsonl`);
  if (missingReviews.length > 0) {
    log(`  Reviews: #${missingReviews[0].id} - #${missingReviews[missingReviews.length - 1].id}`);
  }
  if (missingRetros.length > 0) {
    log(`  Retros: ${missingRetros.map((r) => r.id).join(", ")}`);
  }
  process.exitCode = 0;
}

/**
 * Coerce an id value (number or string) to a finite integer, or Number.NaN.
 * Extracted to reduce cognitive complexity in loadExistingReviewObjects.
 *
 * @param {unknown} id - The id value from a parsed JSONL object
 * @returns {number} Finite integer or Number.NaN
 */
function parseNumericId(id) {
  if (typeof id === "number") return id;
  if (typeof id === "string") return Number.parseInt(id, 10);
  return Number.NaN;
}

/**
 * Load full JSONL review objects keyed by numeric id for content comparison.
 * Returns a Map<number, object>. Skips malformed lines silently.
 */
function loadExistingReviewObjects() {
  const { safeParseLine } = require("../lib/parse-jsonl-line");
  const existingById = new Map();
  if (!existsSync(REVIEWS_FILE)) return existingById;
  try {
    const jsonlRaw = readTextWithSizeGuard(REVIEWS_FILE).replaceAll("\r\n", "\n").trim();
    if (jsonlRaw) {
      for (const rawLine of jsonlRaw.split("\n")) {
        const obj = safeParseLine(rawLine);
        if (!obj) continue;
        const idNum = parseNumericId(obj.id);
        if (Number.isFinite(idNum)) existingById.set(idNum, obj);
      }
    }
  } catch {
    /* skip read errors — loadExistingIds already warned */
  }
  return existingById;
}

/**
 * Detect id collisions between mdReviews and existingIds and renumber colliding
 * reviews to ids above the current maximum. Mutates review.id in place.
 * Returns the (mutated) mdReviews array.
 *
 * Uses content-based dedup (title + date) to prevent infinite renumbering loops:
 * if a markdown review's content already exists in JSONL under any ID, the
 * markdown entry is mapped to that existing ID instead of being renumbered.
 */
/**
 * Build a content signature → existing ID index for dedup.
 * @param {Map<number, object>} existingById
 * @returns {Map<string, number>}
 */
function contentNorm(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, " ");
}

function contentSignature(obj) {
  return `${contentNorm(obj.title)}::${contentNorm(obj.pr)}::${contentNorm(obj.date)}`;
}

function buildContentIndex(existingById) {
  const byContent = new Map();
  for (const [id, obj] of existingById) {
    const sig = contentSignature(obj);
    if (!byContent.has(sig)) {
      byContent.set(sig, id);
    }
  }
  return byContent;
}

/**
 * Find the next available ID above maxExistingId that doesn't collide.
 * @param {number} maxExistingId
 * @param {{ offset: number }} state - Mutable state for nextOffset
 * @param {Set<number>} newlyAssignedIds
 * @param {Set<number>} mdIds
 * @returns {number}
 */
function findNextAvailableId(maxExistingId, state, newlyAssignedIds, mdIds) {
  let newId = maxExistingId + state.offset;
  while (newlyAssignedIds.has(newId) || mdIds.has(newId)) {
    state.offset++;
    newId = maxExistingId + state.offset;
  }
  state.offset++;
  return newId;
}

/**
 * Resolve a single review's ID collision against existing data.
 * @returns {boolean} true if processing should skip to next review (content match found or no collision)
 */
function resolveReviewCollision(review, ctx) {
  const {
    existingIds,
    existingById,
    existingByContent,
    mdIds,
    offsetState,
    newlyAssignedIds,
    maxExistingId,
  } = ctx;
  const sig = contentSignature(review);
  const contentMatchId = existingByContent.get(sig);
  if (contentMatchId !== undefined) {
    if (contentMatchId !== review.id) {
      // Guard: prevent duplicate IDs within the markdown set
      if (mdIds.has(contentMatchId)) {
        const oldId = review.id;
        const newId = findNextAvailableId(maxExistingId, offsetState, newlyAssignedIds, mdIds);
        mdIds.delete(oldId);
        review.id = newId;
        mdIds.add(newId);
        newlyAssignedIds.add(newId);
        console.log(
          `  ⚠️  Review #${oldId} renumbered to #${newId} (content-match id already used)`
        );
        return false;
      }
      mdIds.delete(review.id);
      review.id = contentMatchId;
      mdIds.add(review.id);
    }
    return true;
  }

  if (!existingIds.has(review.id)) return true;
  const existing = existingById.get(review.id);
  if (!existing) return true;

  const sameContent =
    existing.title === review.title && existing.pr === review.pr && existing.date === review.date;
  if (sameContent) return true;

  const oldId = review.id;
  const newId = findNextAvailableId(maxExistingId, offsetState, newlyAssignedIds, mdIds);

  mdIds.delete(oldId);
  review.id = newId;
  mdIds.add(newId);
  newlyAssignedIds.add(newId);
  existingByContent.set(sig, newId);
  console.log(`  ⚠️  Review #${oldId} renumbered to #${newId} (collision)`);
  return false;
}

function detectAndResolveCollisions(mdReviews, existingIds, existingById) {
  const existingByContent = buildContentIndex(existingById);

  let maxExistingId = 0;
  for (const id of existingIds) {
    if (id > maxExistingId) maxExistingId = id;
  }

  const mdIds = new Set(mdReviews.map((r) => r.id));
  const offsetState = { offset: 1 };
  const newlyAssignedIds = new Set();

  const ctx = {
    existingIds,
    existingById,
    existingByContent,
    mdIds,
    offsetState,
    newlyAssignedIds,
    maxExistingId,
  };

  for (const review of mdReviews) {
    resolveReviewCollision(review, ctx);
  }
  return mdReviews;
}

/**
 * Log the drift report and dispatch to the correct sync action (check / apply / dry-run).
 */
function reportAndApplySync(missing, missingReviews, missingRetros) {
  log(`\n⚠️  ${missing.length} entries in markdown but not in JSONL:`);
  if (missingReviews.length > 0) {
    log(`  Reviews: ${missingReviews.map((r) => "#" + r.id).join(", ")}`);
  }
  if (missingRetros.length > 0) {
    log(`  Retros:  ${missingRetros.map((r) => r.id).join(", ")}`);
  }

  if (checkMode) {
    console.log(`\nDRIFT: ${missing.length} entries not synced to reviews.jsonl`);
    console.log(`Run: npm run reviews:sync -- --apply`);
    process.exitCode = 1;
  } else if (applyMode) {
    applySyncEntries(missing, missingReviews, missingRetros);
  } else {
    log("\nDry run. Use --apply to sync.");
    if (missing.length > 0) {
      log("\nPreview (first entry):");
      log(JSON.stringify(missing[0], null, 2));
    }
    process.exitCode = 1;
  }
}

/**
 * Handle normal sync mode (dry-run, --apply, --check).
 */
function runSyncMode(content) {
  const existingIds = loadExistingIds();
  const existingRetroIds = loadExistingRetroIds();
  const mdReviews = parseMarkdownReviews(content);
  const mdRetros = parseRetrospectives(content);

  log(`  Markdown reviews found: ${mdReviews.length}`);
  log(`  Markdown retros found:  ${mdRetros.length}`);
  log(`  JSONL reviews existing: ${existingIds.size}`);
  log(`  JSONL retros existing:  ${existingRetroIds.size}`);

  // --- DEBT-7582: Collision detection & auto-renumbering ---
  const existingById = loadExistingReviewObjects();
  detectAndResolveCollisions(mdReviews, existingIds, existingById);
  // --- End DEBT-7582 ---

  // Build content signature set for dedup: prevents re-appending reviews
  // that were previously synced under a different ID (due to renumbering).
  const existingContentSigs = new Set();
  for (const [, obj] of existingById) {
    existingContentSigs.add(contentSignature(obj));
  }

  const missingReviews = mdReviews.filter((r) => {
    if (existingIds.has(r.id)) return false;
    // Content-based dedup: skip if content already synced under any ID
    if (existingContentSigs.has(contentSignature(r))) return false;
    return true;
  });
  const missingRetros = mdRetros.filter((r) => !existingRetroIds.has(r.id));
  missingReviews.sort((a, b) => a.id - b.id);
  missingRetros.sort((a, b) => a.pr - b.pr);
  const missing = [...missingReviews, ...missingRetros];

  if (missing.length === 0) {
    log("\n✅ All reviews and retros are synced. No drift detected.");
    process.exitCode = 0;
    return;
  }

  reportAndApplySync(missing, missingReviews, missingRetros);
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

    if (isSymlink(LEARNINGS_LOG)) {
      console.error("Refusing to read symlink");
      process.exitCode = 2;
      return;
    }

    const content = readFileSync(LEARNINGS_LOG, "utf8");

    // --repair mode: full rebuild of reviews.jsonl from markdown
    if (repairMode) {
      runRepairMode(content);
      return;
    }

    // Normal sync mode
    runSyncMode(content);
  } catch (err) {
    console.error("Error:", sanitizeError(err));
    process.exitCode = 2;
  }
}

main();
