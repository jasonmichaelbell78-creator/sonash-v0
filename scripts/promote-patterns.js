#!/usr/bin/env node
/* global __dirname */
/**
 * promote-patterns.js
 *
 * Auto-promotes recurring patterns from reviews.jsonl to CODE_PATTERNS.md.
 * Bridges the gap between consolidation-output/suggested-rules.md and
 * the canonical CODE_PATTERNS.md reference document.
 *
 * Usage:
 *   npm run patterns:promote              # Preview candidates
 *   npm run patterns:promote -- --apply   # Add to CODE_PATTERNS.md
 *   npm run patterns:promote -- --min 3   # Minimum occurrences (default: 3)
 *
 * Exit codes:
 *   0 = Success (or nothing to promote)
 *   1 = Dry run with candidates found
 *   2 = Error
 */

const { existsSync, readFileSync, writeFileSync, lstatSync, renameSync } = require("node:fs");
const { join } = require("node:path");

// Symlink guard (Review #316-#323)
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require(join(__dirname, "..", ".claude", "hooks", "lib", "symlink-guard")));
} catch {
  console.error("symlink-guard unavailable; refusing to write");
  isSafeToWrite = () => false;
}

const ROOT = join(__dirname, "..");
const REVIEWS_FILE = join(ROOT, ".claude", "state", "reviews.jsonl");
const CODE_PATTERNS_FILE = join(ROOT, "docs", "agent_docs", "CODE_PATTERNS.md");

const args = process.argv.slice(2);
const applyMode = args.includes("--apply");
const quiet = args.includes("--quiet");

// Parse --min N argument
let minOccurrences = 3;
const minIdx = args.indexOf("--min");
if (minIdx !== -1 && args[minIdx + 1]) {
  const parsed = Number.parseInt(args[minIdx + 1], 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    minOccurrences = parsed;
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
 * Normalize a string to a lowercase-hyphenated slug for comparison.
 * e.g. "## Pattern #3: Path Traversal" -> "path-traversal"
 * e.g. "path-traversal-check" -> "path-traversal-check"
 *
 * Uses character-by-character processing to avoid regex DoS (S5852).
 */
function toSlug(str) {
  const lower = str.toLowerCase();
  let result = "";
  let lastWasHyphen = false;
  for (const ch of lower) {
    if ((ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9")) {
      result += ch;
      lastWasHyphen = false;
    } else if (ch === " " || ch === "-") {
      if (!lastWasHyphen && result.length > 0) {
        result += "-";
        lastWasHyphen = true;
      }
    }
    // else: skip non-alphanumeric, non-space, non-hyphen
  }
  // Trim trailing hyphen
  if (result.endsWith("-")) result = result.slice(0, -1);
  return result;
}

/**
 * Load and parse reviews from JSONL file.
 * Returns an array of review objects (skipping malformed lines).
 */
function loadReviews() {
  const reviews = [];
  if (!existsSync(REVIEWS_FILE)) return reviews;

  try {
    const content = readFileSync(REVIEWS_FILE, "utf8").replaceAll("\r\n", "\n").trim();
    if (!content) return reviews;
    for (const line of content.split("\n")) {
      try {
        const obj = JSON.parse(line);
        if (obj && typeof obj === "object") {
          reviews.push(obj);
        }
      } catch {
        /* skip malformed line */
      }
    }
  } catch (err) {
    console.error("Failed to read reviews.jsonl:", sanitizeError(err));
  }
  return reviews;
}

/**
 * Process a single raw pattern string: create slug, update map entry,
 * track review IDs, and collect matching learnings.
 */
function processPattern(patternMap, rawPattern, reviewId, reviewLearnings) {
  if (typeof rawPattern !== "string" || rawPattern.trim() === "") return;

  const slug = toSlug(rawPattern);
  if (!slug) return;

  if (!patternMap.has(slug)) {
    patternMap.set(slug, { count: 0, reviewIds: [], learnings: [] });
  }

  const entry = patternMap.get(slug);
  entry.count += 1;

  // Track review ID (handle both numeric and string IDs)
  const idLabel = typeof reviewId === "number" ? `#${reviewId}` : String(reviewId);
  if (!entry.reviewIds.includes(idLabel)) {
    entry.reviewIds.push(idLabel);
  }

  // Collect learnings that mention this pattern (fuzzy match)
  const patternWords = slug.split("-").filter((w) => w.length > 2);
  for (const learning of reviewLearnings) {
    if (typeof learning !== "string") continue;
    const lowerLearning = learning.toLowerCase();
    const matchesPattern = patternWords.some((word) => lowerLearning.includes(word));
    if (matchesPattern && !entry.learnings.includes(learning)) {
      entry.learnings.push(learning);
    }
  }
}

/**
 * Count pattern occurrences across all reviews.
 * Returns a Map of slug -> { count, reviewIds, learnings }
 */
function countPatterns(reviews) {
  const patternMap = new Map();

  for (const review of reviews) {
    if (!Array.isArray(review.patterns)) continue;

    const reviewId = review.id;
    const reviewLearnings = Array.isArray(review.learnings) ? review.learnings : [];

    for (const rawPattern of review.patterns) {
      processPattern(patternMap, rawPattern, reviewId, reviewLearnings);
    }
  }

  return patternMap;
}

/**
 * Extract a slug from a heading line (## or ### headings).
 * Returns the slug string, or null if the line is not a heading.
 */
function extractSlugFromHeading(line) {
  const headingMatch = line.match(/^#{2,3}\s+(?:(?:Pattern\s+)?#?\d+[.:]\s*)?(.+)/);
  if (headingMatch) {
    const slug = toSlug(headingMatch[1]);
    return slug || null;
  }
  return null;
}

/**
 * Extract a slug from a table row line.
 * Returns the slug string, or null if the line is not a valid table row.
 */
function extractSlugFromTableRow(line) {
  if (line.startsWith("|")) {
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");
    if (cells.length >= 2) {
      const cellText = cells[1]; // second column (Pattern Name)
      // Skip table header separators and header row labels
      if (
        cellText &&
        !cellText.startsWith("---") &&
        cellText !== "Pattern" &&
        cellText !== "Meaning"
      ) {
        const slug = toSlug(cellText);
        return slug || null;
      }
    }
  }
  return null;
}

/**
 * Extract existing pattern slugs from CODE_PATTERNS.md.
 * Matches headings like:
 *   ## Bash/Shell
 *   ### 1. Error Sanitization
 *   ## Auto-Promoted: Pattern Name
 *   | pattern | ...
 * Returns a Set of normalized slugs.
 */
function extractExistingSlugs(content) {
  const slugs = new Set();
  const lines = content.split("\n");

  for (const line of lines) {
    // Match ## or ### headings (e.g. "### 1. Error Sanitization", "## Auto-Promoted: Name")
    const headingSlug = extractSlugFromHeading(line);
    if (headingSlug) slugs.add(headingSlug);

    // Match pattern names in table rows (first content column after Priority)
    // Format: | Priority | Pattern Name | Rule | Why |
    const tableSlug = extractSlugFromTableRow(line);
    if (tableSlug) slugs.add(tableSlug);
  }

  return slugs;
}

/**
 * Check if two slugs have significant word overlap (>= 60% and >= 2 words).
 * Returns true if overlap is significant.
 */
function hasSignificantOverlap(slug, existing) {
  const slugWords = new Set(slug.split("-").filter((w) => w.length > 2));
  const existWords = new Set(existing.split("-").filter((w) => w.length > 2));
  if (slugWords.size > 0 && existWords.size > 0) {
    let overlap = 0;
    for (const w of slugWords) {
      if (existWords.has(w)) overlap++;
    }
    // If >= 60% of words overlap, consider it a match
    const overlapRatio = overlap / Math.min(slugWords.size, existWords.size);
    if (overlapRatio >= 0.6 && overlap >= 2) return true;
  }
  return false;
}

/**
 * Fuzzy match: check if a pattern slug matches any existing slug.
 * Handles cases like "prototype-pollution" matching "prototype-pollution-via-counter-objects".
 */
function isAlreadyDocumented(slug, existingSlugs) {
  // Exact match
  if (existingSlugs.has(slug)) return true;

  // Check if slug is a substring of an existing slug or vice versa
  for (const existing of existingSlugs) {
    // slug is a prefix of existing (e.g., "prototype-pollution" matches "prototype-pollution-guard")
    if (existing.startsWith(slug + "-") || existing === slug) return true;
    // existing is a prefix of slug
    if (slug.startsWith(existing + "-") || slug === existing) return true;
    // Significant overlap: both share a substantial common substring
    // Split into words and check overlap ratio
    if (hasSignificantOverlap(slug, existing)) return true;
  }

  return false;
}

/**
 * Infer a category from pattern keywords.
 */
function inferCategory(slug) {
  const CATEGORY_MAP = [
    { keywords: ["bash", "shell", "posix", "trap", "exit-trap", "pipe"], category: "Bash/Shell" },
    { keywords: ["npm", "dep", "lockfile", "husky", "package"], category: "npm/Dependencies" },
    {
      keywords: [
        "symlink",
        "traversal",
        "injection",
        "sanitize",
        "pii",
        "xss",
        "ssrf",
        "redos",
        "pollution",
        "toctou",
        "guard",
        "fail-closed",
      ],
      category: "Security",
    },
    { keywords: ["github", "action", "workflow", "ci-blocker"], category: "GitHub Actions" },
    {
      keywords: [
        "react",
        "useeffect",
        "usestate",
        "usememo",
        "component",
        "render",
        "hook",
        "frontend",
      ],
      category: "React/Frontend",
    },
    {
      keywords: [
        "regex",
        "path",
        "error",
        "parse",
        "json",
        "crlf",
        "windows",
        "cross-platform",
        "typescript",
        "exec",
        "spawn",
        "buffer",
      ],
      category: "JavaScript/TypeScript",
    },
    {
      keywords: [
        "ci",
        "automation",
        "atomic",
        "write",
        "jsonl",
        "state",
        "cleanup",
        "rename",
        "validate",
      ],
      category: "CI/Automation",
    },
    { keywords: ["git", "commit", "branch", "diff", "merge"], category: "Git" },
    {
      keywords: ["process", "pid", "signal", "kill", "termination"],
      category: "Process Management",
    },
    {
      keywords: ["doc", "markdown", "link", "template", "readme", "header"],
      category: "Documentation",
    },
    { keywords: ["audit", "canon", "schema", "severity", "owasp"], category: "Security Audit" },
  ];

  const slugWords = slug.split("-");

  for (const { keywords, category } of CATEGORY_MAP) {
    for (const word of slugWords) {
      if (keywords.includes(word)) return category;
    }
  }

  return "General";
}

/**
 * Convert a slug back to a human-readable pattern name.
 * e.g. "prototype-pollution" -> "Prototype Pollution"
 */
function slugToName(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Find the first learning that could serve as a description.
 * Prioritize learnings that are substantive (not just metadata).
 */
function findDescription(learnings) {
  const SKIP_MARKERS = ["Fixed:", "Deferred:", "Rejected:", "Root cause:", "Prevention:"];
  for (const learning of learnings) {
    const isMetadata = SKIP_MARKERS.some((m) => learning.startsWith(m));
    if (!isMetadata && learning.length > 30) {
      return learning;
    }
  }
  // Fallback: use any learning over 20 chars
  for (const learning of learnings) {
    if (learning.length > 20) return learning;
  }
  return "Pattern identified from recurring review findings.";
}

/**
 * Find anti-pattern and correct-pattern descriptions from learnings.
 */
function findAntiAndCorrectPattern(learnings) {
  let antiPattern = null;
  let correctPattern = null;

  for (const learning of learnings) {
    const lower = learning.toLowerCase();
    if (
      !antiPattern &&
      (lower.includes("wrong") ||
        lower.includes("anti-pattern") ||
        lower.includes("don't") ||
        lower.includes("never") ||
        lower.includes("avoid") ||
        lower.includes("not "))
    ) {
      antiPattern = learning;
    }
    if (
      !correctPattern &&
      (lower.includes("always") ||
        lower.includes("correct") ||
        lower.includes("should") ||
        lower.includes("must") ||
        lower.includes("use ") ||
        lower.includes("prevention:"))
    ) {
      correctPattern = learning;
    }
  }

  return { antiPattern, correctPattern };
}

/**
 * Generate a markdown entry for a promoted pattern.
 */
function generatePatternEntry(slug, data) {
  const name = slugToName(slug);
  const category = inferCategory(slug);
  const description = findDescription(data.learnings);
  const { antiPattern, correctPattern } = findAntiAndCorrectPattern(data.learnings);

  let entry = `\n## Auto-Promoted: ${name}\n\n`;
  entry += `**Source:** Reviews ${data.reviewIds.join(", ")} (${data.count} occurrences)\n`;
  entry += `**Category:** ${category}\n\n`;
  entry += `**Description:** ${description}\n`;

  if (antiPattern) {
    entry += `\n**Anti-pattern:** ${antiPattern}\n`;
  }

  if (correctPattern) {
    entry += `\n**Correct pattern:** ${correctPattern}\n`;
  }

  return entry;
}

/**
 * Validate that input files (REVIEWS_FILE and CODE_PATTERNS_FILE) exist
 * and are not symlinks.
 * Returns null on success, or an error string on failure.
 */
function validateInputFiles() {
  if (!existsSync(REVIEWS_FILE)) {
    return "reviews.jsonl not found";
  }
  if (isSymlink(REVIEWS_FILE)) {
    return "Refusing to read symlink at reviews.jsonl";
  }
  if (!existsSync(CODE_PATTERNS_FILE)) {
    return "CODE_PATTERNS.md not found";
  }
  if (isSymlink(CODE_PATTERNS_FILE)) {
    return "Refusing to read symlink at CODE_PATTERNS.md";
  }
  return null;
}

/**
 * Load reviews, count patterns, filter by threshold, load CODE_PATTERNS.md,
 * and partition candidates into already-documented vs new promotions.
 * Returns { reviews, codePatternsContent, newPromotions, alreadyDocumented, candidates, patternCounts }
 * or null if there is nothing to promote (logs and sets exitCode as needed).
 */
function findNewPromotions(reviews, codePatternsContent) {
  const patternCounts = countPatterns(reviews);
  log(`  Reviews loaded: ${reviews.length}`);
  log(`  Unique patterns found: ${patternCounts.size}`);
  log(`  Minimum occurrences threshold: ${minOccurrences}`);

  // Filter patterns meeting the minimum threshold
  const candidates = new Map();
  for (const [slug, data] of patternCounts) {
    if (data.count >= minOccurrences) {
      candidates.set(slug, data);
    }
  }

  log(`  Patterns meeting threshold (>= ${minOccurrences}): ${candidates.size}`);

  if (candidates.size === 0) {
    log("\nNo patterns meet the minimum occurrence threshold. Nothing to promote.");
    process.exitCode = 0;
    return null;
  }

  const existingSlugs = extractExistingSlugs(codePatternsContent);
  log(`  Existing pattern slugs in CODE_PATTERNS.md: ${existingSlugs.size}`);

  // Partition into already documented vs new
  const alreadyDocumented = [];
  const newPromotions = [];

  for (const [slug, data] of candidates) {
    if (isAlreadyDocumented(slug, existingSlugs)) {
      alreadyDocumented.push({ slug, data });
    } else {
      newPromotions.push({ slug, data });
    }
  }

  // Sort new promotions by count descending
  newPromotions.sort((a, b) => b.data.count - a.data.count);

  log(
    `\n  ${candidates.size} candidates found, ${alreadyDocumented.length} already documented, ${newPromotions.length} new promotions`
  );

  if (newPromotions.length === 0) {
    log("\nAll recurring patterns are already documented in CODE_PATTERNS.md.");
    process.exitCode = 0;
    return null;
  }

  return { newPromotions, alreadyDocumented, candidates, patternCounts };
}

/**
 * Generate markdown content for new promotions and write atomically
 * to CODE_PATTERNS.md. Uses write-to-tmp + rename pattern to avoid TOCTOU.
 */
function applyPromotions(newPromotions, codePatternsContent) {
  if (!isSafeToWrite(CODE_PATTERNS_FILE)) {
    console.error("Refusing to write: symlink detected at CODE_PATTERNS.md");
    process.exitCode = 2;
    return;
  }

  // Generate entries for all new promotions
  let newContent = "";

  // Check if "## Auto-Promoted Patterns" section already exists
  const autoPromotedHeader = "## Auto-Promoted Patterns";
  const hasAutoPromotedSection = codePatternsContent.includes(autoPromotedHeader);

  if (!hasAutoPromotedSection) {
    newContent += `\n${autoPromotedHeader}\n\n`;
    newContent += "Patterns auto-promoted from recurring review findings.\n";
    newContent += `Minimum occurrence threshold: ${minOccurrences}\n`;
  }

  for (const { slug, data } of newPromotions) {
    newContent += generatePatternEntry(slug, data);
  }

  // Insert before END OF DOCUMENT marker
  const endMarker = "**END OF DOCUMENT**";
  const endMarkerIdx = codePatternsContent.lastIndexOf(endMarker);

  let updatedContent;
  if (endMarkerIdx === -1) {
    // No end marker, just append
    updatedContent = codePatternsContent.trimEnd() + "\n" + newContent + "\n";
  } else {
    // Find the start of the line containing END OF DOCUMENT
    let insertIdx = endMarkerIdx;
    while (insertIdx > 0 && codePatternsContent[insertIdx - 1] !== "\n") {
      insertIdx--;
    }
    updatedContent =
      codePatternsContent.slice(0, insertIdx) +
      newContent +
      "\n---\n\n" +
      codePatternsContent.slice(insertIdx);
  }

  // Atomic write: write to tmp, then rename
  const tmpPath = CODE_PATTERNS_FILE + ".tmp";
  try {
    if (!isSafeToWrite(tmpPath)) {
      throw new Error("symlink at tmp path");
    }
    writeFileSync(tmpPath, updatedContent, "utf8");
    renameSync(tmpPath, CODE_PATTERNS_FILE);
  } catch (err) {
    console.error("Failed to write CODE_PATTERNS.md:", sanitizeError(err));
    process.exitCode = 2;
    return;
  }

  log(`\nApplied ${newPromotions.length} new patterns to CODE_PATTERNS.md`);
  process.exitCode = 0;
}

function main() {
  try {
    log("Pattern Promotion: reviews.jsonl -> CODE_PATTERNS.md\n");

    // Validate source and target files
    const validationError = validateInputFiles();
    if (validationError) {
      console.error(validationError);
      process.exitCode = 2;
      return;
    }

    // Load reviews
    const reviews = loadReviews();
    if (reviews.length === 0) {
      log("No reviews found in reviews.jsonl");
      process.exitCode = 0;
      return;
    }

    // Load CODE_PATTERNS.md
    let codePatternsContent;
    try {
      codePatternsContent = readFileSync(CODE_PATTERNS_FILE, "utf8");
    } catch (err) {
      console.error("Failed to read CODE_PATTERNS.md:", sanitizeError(err));
      process.exitCode = 2;
      return;
    }

    // Find new promotions
    const result = findNewPromotions(reviews, codePatternsContent);
    if (!result) return;

    const { newPromotions } = result;

    // Display candidates
    log("\nNew promotion candidates:");
    for (const { slug, data } of newPromotions) {
      log(`  - ${slugToName(slug)} (${data.count}x, from ${data.reviewIds.join(", ")})`);
    }

    if (applyMode) {
      applyPromotions(newPromotions, codePatternsContent);
    } else {
      log("\nDry run. Use --apply to add patterns to CODE_PATTERNS.md.");
      if (newPromotions.length > 0) {
        log("\nPreview (first candidate):");
        const first = newPromotions[0];
        log(generatePatternEntry(first.slug, first.data));
      }
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("Error:", sanitizeError(err));
    process.exitCode = 2;
  }
}

main();
