#!/usr/bin/env node
/* global __dirname */
/**
 * run-consolidation.js (v2 — JSONL-based)
 *
 * Performs pattern consolidation from reviews.jsonl to CODE_PATTERNS.md.
 *
 * State lives in TWO files (single source of truth each):
 *   - .claude/state/consolidation.json  → last consolidated review, number, date
 *   - .claude/state/reviews.jsonl       → one JSON line per review entry
 *
 * NO markdown parsing for state. NO manual counter. NO cross-validation needed.
 *
 * Usage:
 *   npm run consolidation:run              # Preview (dry run)
 *   npm run consolidation:run -- --apply   # Apply consolidation
 *   npm run consolidation:run -- --auto    # Auto-apply if needed (quiet, for hooks)
 *   npm run consolidation:run -- --verbose # Detailed analysis
 *
 * Exit codes:
 *   0 = Success (or no consolidation needed)
 *   1 = Consolidation needed but not applied (dry run)
 *   2 = Error
 */

const fs = require("node:fs"); // catch-verified: core module
const path = require("node:path"); // catch-verified: core module
const cp = require("node:child_process"); // catch-verified: core module
const { existsSync, readFileSync, mkdirSync, rmSync } = fs; // require() destructure
const { writeFileSync, copyFileSync } = fs; // require() destructure
const { join } = path; // require() destructure
const { execFileSync } = cp; // require() destructure

// Symlink guard (Review #316-#323)
let isSafeToWrite;
try {
  ({ isSafeToWrite } = require("./lib/security-helpers"));
} catch {
  console.error("security-helpers unavailable; refusing to write");
  isSafeToWrite = () => false;
}

// --- Paths ---
const ROOT_DIR = join(__dirname, "..");
const STATE_DIR = join(ROOT_DIR, ".claude", "state");
const CONSOLIDATION_FILE = join(STATE_DIR, "consolidation.json");
const REVIEWS_FILE = join(STATE_DIR, "reviews.jsonl");
const OUTPUT_DIR = join(ROOT_DIR, "consolidation-output");
const OUTPUT_FILE = join(OUTPUT_DIR, "suggested-rules.md");
const CODE_PATTERNS_FILE = join(ROOT_DIR, "docs", "agent_docs", "CODE_PATTERNS.md");

// --- Config ---
const THRESHOLD = 10;
const MIN_PATTERN_OCCURRENCES = 3;

// --- Args ---
const args = process.argv.slice(2);
const autoMode = args.includes("--auto");
const applyChanges = args.includes("--apply") || autoMode;
const verbose = args.includes("--verbose");
const quiet = args.includes("--quiet") || autoMode;

// --- Colors (TTY-aware) ---
const useColors = process.stdout.isTTY;
const c = {
  red: useColors ? "\x1b[31m" : "",
  green: useColors ? "\x1b[32m" : "",
  yellow: useColors ? "\x1b[33m" : "",
  blue: useColors ? "\x1b[34m" : "",
  cyan: useColors ? "\x1b[36m" : "",
  reset: useColors ? "\x1b[0m" : "",
  bold: useColors ? "\x1b[1m" : "",
};

function log(msg, color = "") {
  if (quiet) return;
  console.log(color ? `${color}${msg}${c.reset}` : msg);
}

function sanitizeError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg
    .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
    .replace(/\/home\/[^/\s]+/gi, "[HOME]")
    .replace(/\/Users\/[^/\s]+/gi, "[HOME]");
}

// =============================================================================
// STATE: Read from JSON (single source of truth)
// =============================================================================

function loadState() {
  if (!existsSync(CONSOLIDATION_FILE)) {
    // First run: create default state
    const defaultState = {
      lastConsolidatedReview: 0,
      consolidationNumber: 0,
      lastDate: null,
      threshold: THRESHOLD,
    };
    ensureDir(STATE_DIR);
    writeState(defaultState);
    return defaultState;
  }
  try {
    return JSON.parse(readFileSync(CONSOLIDATION_FILE, "utf8"));
  } catch (err) {
    log(`❌ Failed to read consolidation.json: ${sanitizeError(err)}`, c.red);
    return null;
  }
}

function safeRename(src, dest) {
  if (!isSafeToWrite(dest)) return; // symlink guard
  // Try atomic rename first; fall back to copy+delete for cross-device moves
  try {
    fs.renameSync(src, dest);
    return;
  } catch (err) {
    if (
      !(
        err &&
        typeof err === "object" &&
        /** @type {NodeJS.ErrnoException} */ (err).code === "EXDEV"
      )
    ) {
      throw err;
    }
    // Fallback for cross-device moves
  }
  if (existsSync(dest)) rmSync(dest, { force: true });
  copyFileSync(src, dest);
  try {
    rmSync(src, { force: true });
  } catch {
    /* best-effort cleanup */
  }
}

function writeState(state) {
  ensureDir(STATE_DIR);
  const tmpPath = `${CONSOLIDATION_FILE}.tmp`;
  const bakPath = `${CONSOLIDATION_FILE}.bak`;
  if (!isSafeToWrite(tmpPath)) {
    log("Refusing to write: symlink detected at tmp path", c.red);
    return;
  }
  if (!isSafeToWrite(CONSOLIDATION_FILE)) {
    log("Refusing to write: symlink detected at consolidation.json", c.red);
    return;
  }
  writeFileSync(tmpPath, JSON.stringify(state, null, 2) + "\n", "utf8"); // atomic .tmp → safeRename below
  if (existsSync(bakPath)) rmSync(bakPath, { force: true });
  if (existsSync(CONSOLIDATION_FILE)) {
    if (!isSafeToWrite(bakPath)) {
      log("Refusing to write: symlink detected at bak path", c.red);
      return;
    }
    safeRename(CONSOLIDATION_FILE, bakPath);
  }
  safeRename(tmpPath, CONSOLIDATION_FILE);
  if (existsSync(bakPath)) rmSync(bakPath, { force: true });
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// =============================================================================
// REVIEWS: Read from JSONL (one JSON object per line)
// =============================================================================

function loadReviews() {
  if (!existsSync(REVIEWS_FILE)) return [];
  try {
    return readFileSync(REVIEWS_FILE, "utf8")
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
  } catch (err) {
    log(`❌ Failed to read reviews.jsonl: ${sanitizeError(err)}`, c.red);
    return [];
  }
}

function getPendingReviews(allReviews, lastConsolidated) {
  return allReviews
    .filter((r) => typeof r.id === "number" && r.id > lastConsolidated)
    .sort((a, b) => a.id - b.id);
}

// =============================================================================
// PATTERN EXTRACTION: From JSONL review data (structured, not regex-on-markdown)
// =============================================================================

function extractPatterns(reviews) {
  const patterns = new Map();

  for (const review of reviews) {
    // Use structured patterns array from JSONL
    const reviewPatterns = Array.isArray(review.patterns) ? review.patterns : [];
    for (const p of reviewPatterns) {
      const key = String(p).toLowerCase().trim();
      if (!key) continue;
      if (!patterns.has(key)) {
        patterns.set(key, { pattern: key, count: 0, reviews: [], learnings: [] });
      }
      const entry = patterns.get(key);
      entry.count++;
      if (!entry.reviews.includes(review.id)) entry.reviews.push(review.id);
    }

    // Also extract from title keywords for broader pattern detection
    const title = (review.title || "").toLowerCase();
    for (const keyword of PATTERN_KEYWORDS) {
      const m = keyword.exec(title);
      if (m) {
        const match = m[0]?.toLowerCase()?.trim();
        if (!match) continue;
        if (!patterns.has(match)) {
          patterns.set(match, { pattern: match, count: 0, reviews: [], learnings: [] });
        }
        const entry = patterns.get(match);
        if (!entry.reviews.includes(review.id)) {
          entry.count++;
          entry.reviews.push(review.id);
        }
      }
    }

    // Collect learnings for pattern context
    const learnings = Array.isArray(review.learnings) ? review.learnings : [];
    for (const learning of learnings) {
      for (const [, entry] of patterns) {
        if (entry.reviews.includes(review.id)) {
          if (!entry.learnings.includes(learning) && entry.learnings.length < 5) {
            entry.learnings.push(learning);
          }
        }
      }
    }
  }

  return patterns;
}

// Note: no /g flag — exec() is called once per keyword per title, so /g is unnecessary
// and would require manual lastIndex reset between calls.
const PATTERN_KEYWORDS = [
  /command injection/i,
  /path traversal/i,
  /regex dos/i,
  /redos/i,
  /prototype pollution/i,
  /ssrf/i,
  /xss/i,
  /injection/i,
  /sanitiz/i,
  /validation/i,
  /security/i,
  /cognitive complexity/i,
  /\bcc\b/i,
  /cc reduction/i,
  /dead code/i,
  /refactor/i,
  /performance/i,
  /error handling/i,
  /try[/-]catch/i,
  /fail-closed/i,
  /typescript/i,
  /eslint/i,
  /sonarcloud/i,
  /nullable/i,
  /symlink/i,
  /propagation/i,
  /atomic write/i,
  /shell/i,
  /bash/i,
  /crlf/i,
  /cross-platform/i,
  /github actions/i,
  /\bci\b/i,
  /pre-commit/i,
  /pre-push/i,
  /compliance/i,
  /documentation/i,
  /markdown/i,
  /qodo/i,
  /gemini/i,
];

function categorizePatterns(patterns) {
  const categories = {
    Security: [],
    "JavaScript/TypeScript": [],
    "Bash/Shell": [],
    "CI/Automation": [],
    Documentation: [],
    General: [],
  };
  for (const [, data] of patterns) {
    const p = data.pattern;
    if (/security|injection|ssrf|xss|traversal|redos|sanitiz|escape|prototype/.test(p)) {
      categories["Security"].push(data);
    } else if (/typescript|eslint|type|nullable/.test(p)) {
      categories["JavaScript/TypeScript"].push(data);
    } else if (/shell|bash|cross-platform/.test(p)) {
      categories["Bash/Shell"].push(data);
    } else if (/ci|github actions|pre-commit|pre-push|automation/.test(p)) {
      categories["CI/Automation"].push(data);
    } else if (/documentation|markdown|link/.test(p)) {
      categories["Documentation"].push(data);
    } else {
      categories["General"].push(data);
    }
  }
  return categories;
}

// =============================================================================
// REPORTING
// =============================================================================

function generateReport(reviews, patterns, categories) {
  const recurring = Array.from(patterns.values())
    .filter((p) => p.count >= MIN_PATTERN_OCCURRENCES)
    .sort((a, b) => b.count - a.count || a.pattern.localeCompare(b.pattern));

  let report = `\n${c.bold}📊 Consolidation Analysis Report${c.reset}\n`;
  report += "═".repeat(50) + "\n\n";
  report += `${c.bold}Reviews analyzed:${c.reset} ${reviews.length}\n`;
  report += `Reviews: #${reviews[0]?.id || "?"} - #${reviews[reviews.length - 1]?.id || "?"}\n\n`;
  report += `${c.bold}Recurring patterns (${MIN_PATTERN_OCCURRENCES}+ mentions):${c.reset}\n`;

  if (recurring.length === 0) {
    report += "  No recurring patterns found.\n";
  } else {
    for (const p of recurring) {
      report += `  🔄 ${p.pattern} (${p.count}x in Reviews ${p.reviews.join(", ")})\n`;
    }
  }

  report += `\n${c.bold}Patterns by category:${c.reset}\n`;
  for (const [cat, items] of Object.entries(categories)) {
    const sig = items.filter((p) => p.count >= MIN_PATTERN_OCCURRENCES);
    if (sig.length > 0) report += `  ${cat}: ${sig.length} pattern(s)\n`;
  }

  return { report, recurringPatterns: recurring };
}

function generateRuleSuggestions(recurringPatterns, range) {
  if (recurringPatterns.length === 0) return;

  ensureDir(OUTPUT_DIR);
  const now = new Date().toISOString().split("T")[0];
  let content = `# Suggested Compliance Checker Rules\n\n`;
  content += `**Generated:** ${now}\n`;
  content += `**Source:** Consolidation Reviews #${range.start}-#${range.end}\n`;
  content += `**Status:** Pending review - add to check-pattern-compliance.js as appropriate\n\n---\n\n`;

  for (const p of recurringPatterns) {
    const rawId = (p.pattern || "")
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/(?:^-)|(?:-$)/g, "")
      .slice(0, 40);
    const id = rawId || "unnamed";
    content += `## ${p.pattern}\n\n`;
    content += `- **Mentions:** ${p.count} (Reviews: #${p.reviews.join(", #")})\n`;
    content += `- **Suggested ID:** \`${id}\`\n`;
    content += `- **Template:**\n\n\`\`\`javascript\n`;
    content += `{\n  id: ${JSON.stringify(id)},\n  pattern: /TODO_REGEX/g,\n`;
    content += `  message: ${JSON.stringify(p.pattern)},\n`;
    content += `  fix: "TODO: describe the correct pattern",\n`;
    content += `  review: "#${p.reviews.join(", #")}",\n  fileTypes: [".js", ".ts"],\n}\n`;
    content += `\`\`\`\n\n`;
  }

  try {
    if (!isSafeToWrite(OUTPUT_FILE)) {
      log("  ⚠️ Refusing to write suggestions: symlink detected", c.yellow);
      return;
    }
    const tmpOutputPath = OUTPUT_FILE + ".tmp";
    if (!isSafeToWrite(tmpOutputPath)) {
      log("  ⚠️ Refusing to write suggestions: symlink detected at tmp path", c.yellow);
      return;
    }
    writeFileSync(tmpOutputPath, content, "utf8"); // atomic .tmp → safeRename below
    safeRename(tmpOutputPath, OUTPUT_FILE);
    log(
      `  ✅ Rule suggestions → consolidation-output/suggested-rules.md (${recurringPatterns.length} patterns)`,
      c.green
    );
  } catch (err) {
    if (verbose) log(`  ⚠️ Failed to write suggestions: ${sanitizeError(err)}`, c.yellow);
  }
}

// =============================================================================
// CODE_PATTERNS.MD: Auto-append new recurring patterns
// =============================================================================

/**
 * Map a consolidation category to the CODE_PATTERNS.md section header.
 */
const CATEGORY_TO_SECTION = {
  Security: "## Security",
  "JavaScript/TypeScript": "## JavaScript/TypeScript",
  "Bash/Shell": "## Bash/Shell",
  "CI/Automation": "## CI/Automation",
  Documentation: "## Documentation",
  General: "## General",
};

/**
 * Group patterns by category and filter out any already present in content.
 * Returns { patternsByCategory, newPatterns }.
 */
function filterNewPatterns(categories, lowerContent) {
  const patternsByCategory = new Map();
  const newPatterns = [];

  for (const [catName, catPatterns] of Object.entries(categories)) {
    for (const p of catPatterns) {
      if (p.count >= MIN_PATTERN_OCCURRENCES) {
        // Check if pattern already exists in CODE_PATTERNS.md (fuzzy match)
        const normalizedPattern = p.pattern.toLowerCase().replaceAll("-", " ");
        if (!lowerContent.includes(normalizedPattern)) {
          if (!patternsByCategory.has(catName)) patternsByCategory.set(catName, []);
          patternsByCategory.get(catName).push(p);
          newPatterns.push(p);
        }
      }
    }
  }

  return { patternsByCategory, newPatterns };
}

/**
 * Insert new pattern entries into their respective section in content.
 * Returns the updated content string.
 */
function insertPatternsIntoSections(content, patternsByCategory, consolidationNumber, range) {
  for (const [catName, patterns] of patternsByCategory) {
    const sectionHeader = CATEGORY_TO_SECTION[catName] || CATEGORY_TO_SECTION["General"];
    const sectionIdx = content.indexOf(sectionHeader);
    if (sectionIdx === -1) continue;

    // Find the next ## section after this one to insert before it
    const afterSection = content.indexOf("\n## ", sectionIdx + sectionHeader.length);
    const insertPoint =
      afterSection === -1 ? content.indexOf("\n---\n", sectionIdx + 100) : afterSection;
    if (insertPoint === -1) continue;

    // Build pattern entries
    const entries = patterns.map((p) => {
      const title = p.pattern.replaceAll("-", " ").replaceAll(/\b\w/g, (ch) => ch.toUpperCase());
      return [
        "",
        `### ${title}`,
        "",
        `🟡 **Rule:** ${title} — recurring pattern from ${p.count} reviews (#${p.reviews.join(", #")})`,
        "",
        `**Source:** Consolidation #${consolidationNumber} (Reviews #${range.start}-#${range.end})`,
        "",
      ].join("\n");
    });

    content = content.slice(0, insertPoint) + entries.join("") + content.slice(insertPoint);
  }

  return content;
}

/**
 * Update the version history table and document version header in content.
 * Returns the updated content string.
 */
function updateVersionHistory(content, newPatterns, consolidationNumber, range, today) {
  const versionMatch = content.match(/\|\s*([\d.]+)\s*\|\s*\d{4}-\d{2}-\d{2}/);
  if (!versionMatch) return content;

  const currentVersion = Number.parseFloat(versionMatch[1]);
  const newVersion = (currentVersion + 0.1).toFixed(1);
  const patternNamesList = newPatterns.map((p) => p.pattern);
  const shown = patternNamesList.slice(0, 10).join(", ");
  const more = patternNamesList.length > 10 ? ` …(+${patternNamesList.length - 10} more)` : "";
  const newRow = `| ${newVersion}     | ${today}   | **CONSOLIDATION #${consolidationNumber}:** Auto-added ${newPatterns.length} patterns (${shown}${more}). Source: Reviews #${range.start}-#${range.end}. |`;

  // Insert new row immediately after the table separator line (| --- |)
  const versionHeaderIdx = content.indexOf("## Version History");
  if (versionHeaderIdx !== -1) {
    const afterHeader = content.slice(versionHeaderIdx);
    const sepRe = /^\|\s*-{3,}.*\|\s*$/m;
    const sepMatch = sepRe.exec(afterHeader);
    if (sepMatch) {
      const sepAbsIdx = versionHeaderIdx + sepMatch.index;
      const sepLineEnd = content.indexOf("\n", sepAbsIdx);
      if (sepLineEnd !== -1) {
        content = content.slice(0, sepLineEnd + 1) + newRow + "\n" + content.slice(sepLineEnd + 1);
      }
    }
  }

  // Update document version in header
  const headerVersionMatch = content.match(/\*\*Document Version:\*\*\s*([\d.]+)/);
  if (headerVersionMatch) {
    content = content.replace(
      `**Document Version:** ${headerVersionMatch[1]}`,
      `**Document Version:** ${newVersion}`
    );
  }

  return content;
}

/**
 * Auto-append new recurring patterns to CODE_PATTERNS.md.
 * - Checks each pattern against existing content to avoid duplicates
 * - Appends to the correct category section
 * - Updates version history
 * Non-fatal: logs a warning if the update fails.
 */
function appendToCodePatterns(recurringPatterns, categories, consolidationNumber, range, today) {
  try {
    if (!existsSync(CODE_PATTERNS_FILE)) {
      log("  ⚠️ CODE_PATTERNS.md not found, skipping auto-update", c.yellow);
      return { added: 0 };
    }
    if (!isSafeToWrite(CODE_PATTERNS_FILE)) {
      log("  ⚠️ Refusing to write: symlink detected at CODE_PATTERNS.md", c.yellow);
      return { added: 0 };
    }

    let content = readFileSync(CODE_PATTERNS_FILE, "utf8");
    const { patternsByCategory, newPatterns } = filterNewPatterns(
      categories,
      content.toLowerCase()
    );

    if (newPatterns.length === 0) {
      log("  ℹ️ No new patterns to add to CODE_PATTERNS.md (all already documented)", c.cyan);
      return { added: 0 };
    }

    content = insertPatternsIntoSections(content, patternsByCategory, consolidationNumber, range);
    content = updateVersionHistory(content, newPatterns, consolidationNumber, range, today);

    // Atomic write
    const tmpPath = CODE_PATTERNS_FILE + ".consolidation.tmp";
    if (!isSafeToWrite(tmpPath)) {
      log("  ⚠️ Refusing to write: symlink at tmp path", c.yellow);
      return { added: 0 };
    }
    writeFileSync(tmpPath, content, "utf8");
    safeRename(tmpPath, CODE_PATTERNS_FILE);

    log(`  ✅ CODE_PATTERNS.md: added ${newPatterns.length} new patterns`, c.green);
    for (const p of newPatterns) {
      log(`     + ${p.pattern} (${p.count}x, Reviews #${p.reviews.join(", #")})`, c.green);
    }

    return { added: newPatterns.length };
  } catch (err) {
    log(`  ⚠️ Failed to update CODE_PATTERNS.md: ${sanitizeError(err)}`, c.yellow);
    return { added: 0 };
  }
}

// =============================================================================
// MARKDOWN: Append consolidation record to learnings log
// =============================================================================

const LEARNINGS_LOG = join(ROOT_DIR, "docs", "AI_REVIEW_LEARNINGS_LOG.md");

/**
 * Append a consolidation record to the Consolidation section in the learnings log.
 * Inserts a <details> block before the first existing <details> consolidation block.
 * Non-fatal: logs a warning if the markdown update fails (JSON is source of truth).
 */
function appendConsolidationToMarkdown(newNumber, minId, maxId, today, recurringPatterns) {
  try {
    if (!existsSync(LEARNINGS_LOG)) return;
    let content = readFileSync(LEARNINGS_LOG, "utf8");

    const patternSummary =
      recurringPatterns.length > 0
        ? recurringPatterns.map((p) => `  - ${p.pattern} (${p.count}x)`).join("\n")
        : "  - No recurring patterns above threshold";

    const block = [
      `<details>`,
      `<summary>Previous Consolidation (#${newNumber})</summary>`,
      ``,
      `- **Date:** ${today}`,
      `- **Reviews consolidated:** #${minId}-#${maxId}`,
      `- **Recurring patterns:**`,
      patternSummary,
      ``,
      `</details>`,
      ``,
    ].join("\n");

    // Insert before the first existing <details> block in the Consolidation section
    const consolidationHeader = "## 🔔 Consolidation";
    const headerIdx = content.indexOf(consolidationHeader);
    if (headerIdx === -1) return;

    const afterHeader = content.indexOf("<details>", headerIdx);
    if (afterHeader === -1) {
      // No existing <details> blocks — append after the note paragraph
      const noteEnd = content.indexOf("\n\n", headerIdx + consolidationHeader.length + 100);
      if (noteEnd !== -1) {
        content = content.slice(0, noteEnd + 2) + block + content.slice(noteEnd + 2);
      }
    } else {
      content = content.slice(0, afterHeader) + block + content.slice(afterHeader);
    }

    // Atomic write
    const tmpPath = LEARNINGS_LOG + ".consolidation.tmp";
    if (!isSafeToWrite(tmpPath)) {
      log("  ⚠️ Refusing to write: symlink detected at tmp path", c.yellow);
      return;
    }
    if (!isSafeToWrite(LEARNINGS_LOG)) {
      log("  ⚠️ Refusing to write: symlink detected at target path", c.yellow);
      return;
    }
    writeFileSync(tmpPath, content, "utf8"); // atomic .tmp → safeRename below
    safeRename(tmpPath, LEARNINGS_LOG);
  } catch (err) {
    log(`  ⚠️ Failed to update markdown consolidation section: ${sanitizeError(err)}`, c.yellow);
  }
}

// =============================================================================
// APPLY: Update state atomically (JSON write, no markdown regex)
// =============================================================================

function applyConsolidation(state, reviews, recurringPatterns, categories) {
  if (reviews.length === 0) {
    log("❌ No reviews to consolidate.", c.red);
    process.exitCode = 2;
    return false;
  }

  const minId = reviews[0].id;
  const maxId = reviews[reviews.length - 1].id;
  const newNumber = state.consolidationNumber + 1;
  const today = new Date().toISOString().split("T")[0];

  // Atomically update state
  const newState = {
    lastConsolidatedReview: maxId,
    consolidationNumber: newNumber,
    lastDate: today,
    threshold: THRESHOLD,
  };
  writeState(newState);

  // Append consolidation record to markdown
  appendConsolidationToMarkdown(newNumber, minId, maxId, today, recurringPatterns);

  log(`\n${c.bold}Applying consolidation...${c.reset}`, c.green);
  log(
    `  ✅ Consolidation #${newNumber}: Reviews #${minId}-#${maxId} (${reviews.length} reviews)`,
    c.green
  );
  log(`  ✅ State updated in consolidation.json`, c.green);
  log(`  ✅ Next consolidation due after ${THRESHOLD} more reviews`, c.green);

  // Generate rule suggestions for compliance checker
  generateRuleSuggestions(recurringPatterns, { start: minId, end: maxId });

  // Auto-update CODE_PATTERNS.md with new patterns
  const codePatResult = appendToCodePatterns(
    recurringPatterns,
    categories,
    newNumber,
    { start: minId, end: maxId },
    today
  );

  if (autoMode) {
    const parts = [
      `✓ Auto-consolidated ${reviews.length} reviews (patterns: ${recurringPatterns.length})`,
    ];
    if (codePatResult.added > 0) parts.push(`CODE_PATTERNS.md: +${codePatResult.added}`);
    console.log(parts.join(", "));
  } else {
    log("");
    log(`${c.bold}📋 Next steps:${c.reset}`);
    log("  1. Review consolidation-output/suggested-rules.md");
    if (codePatResult.added > 0) {
      log(`  2. ✅ CODE_PATTERNS.md auto-updated (${codePatResult.added} new patterns)`);
    } else {
      log("  2. ✅ CODE_PATTERNS.md already up to date");
    }
    log("  3. Review suggested rules for check-pattern-compliance.js");
    log(`  4. Commit: 'chore: consolidation #${newNumber} — Reviews #${minId}-#${maxId}'`);
    log("");
  }

  return true;
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  try {
    log(`\n${c.bold}🔄 Pattern Consolidation Tool (v2 — JSONL)${c.reset}\n`);

    // 1. Load state
    const state = loadState();
    if (!state) {
      process.exitCode = 2;
      return;
    }

    // 2. Load reviews and find pending
    const allReviews = loadReviews();
    const pending = getPendingReviews(allReviews, state.lastConsolidatedReview);

    // 3. Output status
    log(`Current status:`);
    log(
      `  Last consolidated: #${state.lastConsolidatedReview} (Consolidation #${state.consolidationNumber})`
    );
    log(`  Reviews pending: ${pending.length}`);
    log(`  Threshold: ${THRESHOLD}`);
    if (state.lastDate) log(`  Last consolidation date: ${state.lastDate}`);
    log("");

    // 4. Check threshold
    if (pending.length < THRESHOLD) {
      if (!autoMode) {
        log(
          `✅ No consolidation needed (${THRESHOLD - pending.length} reviews until next)`,
          c.green
        );
      }
      process.exitCode = 0;
      return;
    }

    log(`⚠️  Consolidation triggered: ${pending.length} reviews pending`, c.yellow);
    log("");

    // 5. Extract and analyze patterns
    const patterns = extractPatterns(pending);
    const categories = categorizePatterns(patterns);
    const { report, recurringPatterns } = generateReport(pending, patterns, categories);

    if (!quiet || verbose) console.log(report);

    // 6. Apply or dry-run
    if (applyChanges) {
      const applied = applyConsolidation(state, pending, recurringPatterns, categories);
      if (applied) {
        // Post-consolidation: learning effectiveness analysis
        log("\n📊 Running learning effectiveness analysis...", c.blue);
        try {
          execFileSync("node", ["scripts/analyze-learning-effectiveness.js", "--auto"], {
            stdio: "inherit",
            cwd: ROOT_DIR,
          });
        } catch {
          log("⚠️ Learning analysis failed (non-blocking)", c.yellow);
        }

        // Archive health check
        try {
          const reviewCount = allReviews.length;
          if (reviewCount > 50) {
            log(
              `\n${c.yellow}📦 ARCHIVE RECOMMENDED: ${reviewCount} reviews in reviews.jsonl (threshold: 50)${c.reset}`
            );
            log(`   Consider archiving older entries`);
          }
        } catch {
          /* non-fatal */
        }

        process.exitCode = 0;
      } else {
        process.exitCode ??= 2;
      }
    } else {
      log(`\n${c.yellow}Dry run complete. Use --apply to consolidate.${c.reset}`);
      log(`  npm run consolidation:run -- --apply\n`);
      process.exitCode = 1;
    }
  } catch (err) {
    log(`❌ Error: ${sanitizeError(err)}`, c.red);
    if (verbose && err instanceof Error) console.error(err.stack);
    process.exitCode = 2;
  }
}

main();
