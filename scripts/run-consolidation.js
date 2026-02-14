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

const {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  renameSync,
} = require("node:fs");
const { join } = require("node:path");
const { execFileSync } = require("node:child_process");

// --- Paths ---
const ROOT_DIR = join(__dirname, "..");
const STATE_DIR = join(ROOT_DIR, ".claude", "state");
const CONSOLIDATION_FILE = join(STATE_DIR, "consolidation.json");
const REVIEWS_FILE = join(STATE_DIR, "reviews.jsonl");
const OUTPUT_DIR = join(ROOT_DIR, "consolidation-output");
const OUTPUT_FILE = join(OUTPUT_DIR, "suggested-rules.md");

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

function writeState(state) {
  ensureDir(STATE_DIR);
  const tmpPath = `${CONSOLIDATION_FILE}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(state, null, 2) + "\n", "utf8");
  if (existsSync(CONSOLIDATION_FILE)) rmSync(CONSOLIDATION_FILE, { force: true });
  renameSync(tmpPath, CONSOLIDATION_FILE);
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
      keyword.lastIndex = 0;
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

const PATTERN_KEYWORDS = [
  /command injection/gi,
  /path traversal/gi,
  /redos/gi,
  /prototype pollution/gi,
  /ssrf/gi,
  /xss/gi,
  /injection/gi,
  /sanitiz/gi,
  /validation/gi,
  /security/gi,
  /cognitive complexity/gi,
  /dead code/gi,
  /refactor/gi,
  /performance/gi,
  /error handling/gi,
  /try[/-]catch/gi,
  /fail-closed/gi,
  /typescript/gi,
  /eslint/gi,
  /nullable/gi,
  /shell/gi,
  /bash/gi,
  /cross-platform/gi,
  /github actions/gi,
  /pre-commit/gi,
  /pre-push/gi,
  /documentation/gi,
  /markdown/gi,
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
    const id = (p.pattern || "")
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/(?:^-)|(?:-$)/g, "")
      .slice(0, 40);
    content += `## ${p.pattern}\n\n`;
    content += `- **Mentions:** ${p.count} (Reviews: #${p.reviews.join(", #")})\n`;
    content += `- **Suggested ID:** \`${id || "unnamed"}\`\n`;
    content += `- **Template:**\n\n\`\`\`javascript\n`;
    content += `{\n  id: ${JSON.stringify(id)},\n  pattern: /TODO_REGEX/g,\n`;
    content += `  message: ${JSON.stringify(p.pattern)},\n`;
    content += `  fix: "TODO: describe the correct pattern",\n`;
    content += `  review: "#${p.reviews.join(", #")}",\n  fileTypes: [".js", ".ts"],\n}\n`;
    content += `\`\`\`\n\n`;
  }

  try {
    writeFileSync(OUTPUT_FILE, content, "utf8");
    log(
      `  ✅ Rule suggestions → consolidation-output/suggested-rules.md (${recurringPatterns.length} patterns)`,
      c.green
    );
  } catch (err) {
    if (verbose) log(`  ⚠️ Failed to write suggestions: ${sanitizeError(err)}`, c.yellow);
  }
}

// =============================================================================
// APPLY: Update state atomically (JSON write, no markdown regex)
// =============================================================================

function applyConsolidation(state, reviews, recurringPatterns) {
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

  log(`\n${c.bold}Applying consolidation...${c.reset}`, c.green);
  log(
    `  ✅ Consolidation #${newNumber}: Reviews #${minId}-#${maxId} (${reviews.length} reviews)`,
    c.green
  );
  log(`  ✅ State updated in consolidation.json`, c.green);
  log(`  ✅ Next consolidation due after ${THRESHOLD} more reviews`, c.green);

  // Generate rule suggestions
  generateRuleSuggestions(recurringPatterns, { start: minId, end: maxId });

  if (autoMode) {
    console.log(
      `✓ Auto-consolidated ${reviews.length} reviews (patterns: ${recurringPatterns.length})`
    );
  } else {
    log("");
    log(`${c.bold}📋 Next steps:${c.reset}`);
    log("  1. Review consolidation-output/suggested-rules.md");
    log("  2. Add recurring patterns to docs/agent_docs/CODE_PATTERNS.md");
    log("  3. Add automatable patterns to check-pattern-compliance.js");
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
      const applied = applyConsolidation(state, pending, recurringPatterns);
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
