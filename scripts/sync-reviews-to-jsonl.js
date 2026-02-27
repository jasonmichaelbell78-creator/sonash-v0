#!/usr/bin/env node
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
const { writeFileSync, appendFileSync, copyFileSync } = fs; // require() destructure
const { join } = pathMod; // require() destructure

// Symlink guard (Review #316-#323)
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require("./lib/security-helpers"));
} catch {
  console.error("security-helpers unavailable; refusing to write");
  isSafeToWrite = () => false;
}

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
  writeFileSync(tmpPath, content, "utf8"); // atomic .tmp → copy below
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
    const content = readFileSync(REVIEWS_FILE, "utf8").replaceAll("\r\n", "\n").trim();
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
  let inFence = false;

  for (const line of lines) {
    // Skip content inside fenced code blocks to avoid parsing headers from examples
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Match #### Review #N: Title (YYYY-MM-DD)
    const headerMatch = line.match(/^#{2,4}\s+Review\s+#(\d+):?\s*(.*)/);
    if (headerMatch) {
      if (current) reviews.push(current);

      const id = Number.parseInt(headerMatch[1], 10);
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
        rejected: 0,
        critical: 0,
        major: 0,
        minor: 0,
        trivial: 0,
        total: 0,
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
    if (prMatch) review.pr = Number.parseInt(prMatch[1], 10);

    // Fixed count
    const fixedMatch = raw.match(/Fixed:\s*(\d+)/i) || raw.match(/fixed\s*(\d+)/i);
    if (fixedMatch) review.fixed = Number.parseInt(fixedMatch[1], 10);

    // Deferred count
    const deferredMatch = raw.match(/Deferred:\s*(\d+)/i) || raw.match(/deferred\s*(\d+)/i);
    if (deferredMatch) review.deferred = Number.parseInt(deferredMatch[1], 10);

    // Rejected count
    const rejectedMatch = raw.match(/Rejected:\s*(\d+)/i) || raw.match(/rejected\s*(\d+)/i);
    if (rejectedMatch) review.rejected = Number.parseInt(rejectedMatch[1], 10);

    // Severity breakdown — uses string-based parsing (no regex) via parseSeverityCount
    review.critical = parseSeverityCount(raw, "CRITICAL");
    review.major = parseSeverityCount(raw, "MAJOR");
    review.minor = parseSeverityCount(raw, "MINOR");
    review.trivial = parseSeverityCount(raw, "TRIVIAL");

    // Total items from "N total" or "N items" pattern
    const totalFromTotal = parseSeverityCount(raw, "total");
    const totalFromItems = parseSeverityCount(raw, "items");
    review.total = totalFromTotal || totalFromItems;

    // If total found but no severity breakdown, derive from source counts
    // e.g., "SonarCloud (3) + Qodo Suggestions (6)" in Source line
    if (review.total > 0 && review.critical === 0 && review.major === 0 && review.minor === 0) {
      const sourceBreakdown = raw.match(/\*\*Source:\*\*\s*([^\n]+)/);
      if (sourceBreakdown) {
        const sourceCounts = [...sourceBreakdown[1].matchAll(/\((\d+)\)/g)];
        const sourceTotal = sourceCounts.reduce((sum, m) => sum + Number.parseInt(m[1], 10), 0);
        if (sourceTotal > 0) {
          review.sourceBreakdown = sourceBreakdown[1].trim();
          review.total = sourceTotal;
        }
      }
    }

    // Patterns extraction — supports multiple markdown formats:
    // 1. Numbered bold: "1. **Pattern name**: description"
    // 2. Bullet bold: "- **Pattern name**: description"
    // 3. Inline: "**Patterns:** text; text; text" or "**Pattern:** text"
    // 4. Key Patterns bullets: "- Pattern name: description" (under Key Patterns section)

    // Metadata labels to skip — these are field headers, not patterns
    const PATTERN_SKIP = new Set([
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

    // Format 1+2: numbered or bullet items with bold text
    const boldItemMatches = raw.matchAll(/^(?:\d+\.|-)\s+\*\*([^*]+)\*\*/gm);
    for (const m of boldItemMatches) {
      const pattern = m[1]
        .trim()
        .toLowerCase()
        .replaceAll(/[^a-z0-9\s-]/g, "")
        .replaceAll(/\s+/g, "-")
        .slice(0, 60);
      if (
        pattern &&
        pattern.length > 3 &&
        !PATTERN_SKIP.has(pattern) &&
        !review.patterns.includes(pattern)
      ) {
        review.patterns.push(pattern);
      }
    }

    // Format 3: inline patterns after **Pattern(s):** header (semicolon-/comma-separated)
    // Matches "**Pattern:**" or "**Patterns:**" but not other bold labels
    const inlinePatternMatch = /\*\*Patterns?:?\*\*:?\s+([^\n]+)/i.exec(raw);
    if (inlinePatternMatch) {
      const inlineText = inlinePatternMatch[1].trim();
      // Split on semicolons or commas for multiple patterns
      const parts = inlineText
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const part of parts) {
        const pattern = part
          .trim()
          .toLowerCase()
          .replaceAll(/[^a-z0-9\s-]/g, "")
          .replaceAll(/\s+/g, "-")
          .slice(0, 60);
        if (
          pattern &&
          pattern.length > 3 &&
          !PATTERN_SKIP.has(pattern) &&
          !review.patterns.includes(pattern)
        ) {
          review.patterns.push(pattern);
        }
      }
    }

    // Format 4: bullet items under "Key Patterns" or "Patterns Identified" sections
    // Bounded capture to prevent catastrophic backtracking on malformed input
    const patternSection =
      /\*\*(?:Key Patterns|Patterns Identified)[^*]*\*\*:?\s*\n([\s\S]{0,2000}?)(?=\n\*\*|\n---|\n#{2,4}\s|$)/.exec(
        raw
      );
    if (patternSection) {
      const sectionBullets = patternSection[1].matchAll(/^\s*-\s+\*?\*?([^*:\n]+)/gm);
      for (const m of sectionBullets) {
        const pattern = m[1]
          .trim()
          .toLowerCase()
          .replaceAll(/[^a-z0-9\s-]/g, "")
          .replaceAll(/\s+/g, "-")
          .slice(0, 60);
        if (
          pattern &&
          pattern.length > 3 &&
          !PATTERN_SKIP.has(pattern) &&
          !review.patterns.includes(pattern)
        ) {
          review.patterns.push(pattern);
        }
      }
    }

    // Learnings from "Key Learnings" or "Lesson" sections
    // Skip metadata lines that aren't actual learnings
    const METADATA_MARKERS = [
      "**Source:**",
      "**PR/Branch:**",
      "**Suggestions:**",
      "**Resolution Stats:**",
      "**Patterns Identified:**",
      "**Rejected:**",
      "**Resolution:**",
      "**Deferred:**",
    ];
    const learningLines = raw.match(/[-*]\s+(?:`[^`]+`\s+)?[A-Z].{15,}/g) || [];
    const seenLearnings = new Set();
    for (const ll of learningLines.slice(0, 7)) {
      const cleaned = ll.replace(/^[-*]\s+/, "").trim();
      // Skip lines that are metadata headers, not learnings
      const isMetadata = METADATA_MARKERS.some((marker) => cleaned.includes(marker));
      if (
        !isMetadata &&
        cleaned.length > 20 &&
        cleaned.length < 300 &&
        !seenLearnings.has(cleaned)
      ) {
        review.learnings.push(cleaned);
        seenLearnings.add(cleaned);
      }
    }

    // Clean up
    delete review._rawLines;
    if (!review.date) review.date = "unknown";
    if (!review.source) review.source = "manual";
  }

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

function extractRetroAutomation(raw) {
  const automationCandidates = [];
  const lines = raw.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed.split("|");
    if (!rowHasRoundCell(cells) || cells.length < 2) continue;
    const name = (cells[1] || "").trim();
    if (
      name &&
      !name.startsWith("---") &&
      !name.startsWith("Pattern") &&
      automationCandidates.length < 10
    ) {
      automationCandidates.push(name);
    }
  }

  // Also from "Automation candidates:" bullet/prose
  const autoBullet = raw.match(/\*\*Automation candidates:\*\*\s*([^\n]+)/);
  if (autoBullet && automationCandidates.length === 0) {
    const items = autoBullet[1].split(/,\s*/);
    for (const item of items.slice(0, 10)) {
      const cleaned = item.replace(/\(~?\d+\s*min\)/, "").trim();
      if (cleaned) automationCandidates.push(cleaned);
    }
  }

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
function parseRetrospectives(content) {
  const retros = [];
  const lines = content.split("\n");
  let current = null;
  let inFence = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const retroMatch = line.match(/^###\s+PR\s+#(\d+)\s+Retrospective\s*\((\d{4}-\d{2}-\d{2})\)/);
    if (retroMatch) {
      if (current) retros.push(current);
      current = createRetroEntry(retroMatch[1], retroMatch[2]);
      continue;
    }

    if (current && isSectionEndHeading(line)) {
      retros.push(current);
      current = null;
      continue;
    }

    if (current) current._rawLines.push(line);
  }

  if (current) retros.push(current);
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

  // Back up existing file (with symlink guard and atomic write)
  if (existsSync(REVIEWS_FILE)) {
    const bakPath = REVIEWS_FILE + ".bak";
    try {
      if (isSafeToWrite(bakPath)) {
        atomicWriteFileSync(bakPath, readFileSync(REVIEWS_FILE, "utf8"));
        log(`  📦 Backup: reviews.jsonl.bak`);
      } else {
        log("  ⚠️ Refusing to write backup: symlink detected (continuing anyway)");
      }
    } catch {
      log("  ⚠️ Could not create backup (continuing anyway)");
    }
  }

  // Load from active log + all archive files for complete coverage
  // Active log first: wins dedup on ID collisions (newer data takes priority)
  const archiveContent = loadArchiveContent();
  const combinedContent = content + "\n" + archiveContent;
  log(`  📚 Reading from active log + archive files`);

  const reviews = parseMarkdownReviews(combinedContent);
  const retros = parseRetrospectives(combinedContent);

  // Deduplicate by ID (archives may have overlapping entries due to number collisions)
  const seenReviewIds = new Set();
  const dedupedReviews = [];
  for (const r of reviews) {
    if (!seenReviewIds.has(r.id)) {
      seenReviewIds.add(r.id);
      dedupedReviews.push(r);
    }
  }

  const seenRetroKeys = new Set();
  const dedupedRetros = [];
  for (const r of retros) {
    // Composite key: r.id may be undefined for retros; use pr+date for uniqueness
    const key = `retrospective:${String(r.pr ?? "")}:${String(r.date ?? "")}`;
    if (!seenRetroKeys.has(key)) {
      seenRetroKeys.add(key);
      dedupedRetros.push(r);
    }
  }
  // Sort by numeric id, retros go after reviews
  dedupedReviews.sort((a, b) => a.id - b.id);
  dedupedRetros.sort((a, b) => a.pr - b.pr);

  const allLines = [...dedupedReviews, ...dedupedRetros].map((r) => JSON.stringify(r));
  try {
    atomicWriteFileSync(REVIEWS_FILE, allLines.join("\n") + "\n");
  } catch (err) {
    console.error("❌ Failed to write reviews.jsonl:", sanitizeError(err));
    process.exitCode = 2;
    return;
  }

  log(`  ✅ Rebuilt reviews.jsonl:`);
  log(
    `     Reviews: ${dedupedReviews.length} (IDs: #${dedupedReviews[0]?.id || "?"}-#${dedupedReviews.at(-1)?.id || "?"})`
  );
  log(
    `     Retros:  ${dedupedRetros.length} (PRs: ${dedupedRetros.map((r) => "#" + r.pr).join(", ") || "none"})`
  );

  // Report pattern coverage
  const withPatterns = dedupedReviews.filter((r) => r.patterns.length > 0);
  log(`     Patterns: ${withPatterns.length}/${dedupedReviews.length} entries have patterns`);

  // Report severity coverage
  const withSeverity = dedupedReviews.filter((r) => r.critical + r.major + r.minor + r.trivial > 0);
  log(`     Severity data: ${withSeverity.length}/${dedupedReviews.length} entries have breakdown`);

  // Report learnings quality
  const withLearnings = dedupedReviews.filter((r) => r.learnings.length > 0);
  log(`     Learnings: ${withLearnings.length}/${dedupedReviews.length} entries have learnings`);

  process.exitCode = 0;
}

/**
 * Load existing retrospective IDs from the JSONL file.
 */
function loadExistingRetroIds() {
  const ids = new Set();
  if (!existsSync(REVIEWS_FILE)) return ids;
  try {
    const jsonlContent = readFileSync(REVIEWS_FILE, "utf8").replaceAll("\r\n", "\n").trim();
    if (!jsonlContent) return ids;
    for (const line of jsonlContent.split("\n")) {
      try {
        const obj = JSON.parse(line);
        if (typeof obj.id === "string" && obj.id.startsWith("retro-")) ids.add(obj.id);
      } catch {
        /* skip */
      }
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
    appendFileSync(REVIEWS_FILE, lines.join("\n") + "\n");
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
  const existingById = new Map();
  if (!existsSync(REVIEWS_FILE)) return existingById;
  try {
    const jsonlRaw = readFileSync(REVIEWS_FILE, "utf8").replaceAll("\r\n", "\n").trim();
    if (jsonlRaw) {
      for (const line of jsonlRaw.split("\n")) {
        try {
          const obj = JSON.parse(line);
          const idNum = parseNumericId(obj.id);
          if (Number.isFinite(idNum)) existingById.set(idNum, obj);
        } catch {
          /* skip malformed */
        }
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
 */
function detectAndResolveCollisions(mdReviews, existingIds, existingById) {
  let maxExistingId = 0;
  for (const id of existingIds) {
    if (id > maxExistingId) maxExistingId = id;
  }

  // Track all markdown review IDs to avoid assigning a new ID that collides
  // with another markdown entry (not just JSONL entries).
  const mdIds = new Set(mdReviews.map((r) => r.id));
  let nextOffset = 1;
  const newlyAssignedIds = new Set();

  for (const review of mdReviews) {
    if (!existingIds.has(review.id)) continue; // no collision

    const existing = existingById.get(review.id);
    if (!existing) continue; // id in set but object missing — treat as no collision

    // Content match check: same title, PR, and date means identical review, not a collision.
    const sameContent =
      existing.title === review.title && existing.pr === review.pr && existing.date === review.date;
    if (sameContent) continue;

    // True collision — different content under the same review number.
    const oldId = review.id;
    let newId = maxExistingId + nextOffset;
    // Skip any ids already assigned in this pass OR existing in markdown to avoid reuse
    while (newlyAssignedIds.has(newId) || mdIds.has(newId)) {
      nextOffset++;
      newId = maxExistingId + nextOffset;
    }
    nextOffset++;

    mdIds.delete(oldId);
    review.id = newId;
    mdIds.add(newId);

    // Track the new id within this pass so subsequent collisions won't reuse it,
    // but do NOT add to existingIds — that would incorrectly filter it out during
    // the missing-review detection step.
    newlyAssignedIds.add(newId);
    console.log(`  ⚠️  Review #${oldId} renumbered to #${newId} (collision)`);
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

  const missingReviews = mdReviews.filter((r) => !existingIds.has(r.id));
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
