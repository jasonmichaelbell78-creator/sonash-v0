#!/usr/bin/env node
/**
 * Pattern Automation Suggester
 *
 * Analyzes AI_REVIEW_LEARNINGS_LOG.md to find patterns that could be automated
 * in check-pattern-compliance.js but aren't yet.
 *
 * Usage: node scripts/suggest-pattern-automation.js [--add-to-checker]
 *
 * This closes the learning loop by:
 * 1. Finding "Wrong:" code examples in learnings
 * 2. Checking if they're already in the pattern checker
 * 3. Suggesting regex patterns for ones that aren't
 * 4. Optionally adding them to check-pattern-compliance.js
 *
 * Exit codes: 0 = success (including when all patterns covered), 2 = error
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { sanitizeError } from "./lib/sanitize-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require_ = createRequire(import.meta.url);
const { isSafeToWrite } = require_("../.claude/hooks/lib/symlink-guard");
const ROOT = join(__dirname, "..");

const LEARNINGS_FILE = join(ROOT, "AI_REVIEW_LEARNINGS_LOG.md");
const CHECKER_FILE = join(ROOT, "scripts/check-pattern-compliance.js");

// File names for error messages (avoid exposing full paths)
const LEARNINGS_FILENAME = basename(LEARNINGS_FILE);
const CHECKER_FILENAME = basename(CHECKER_FILE);

// Patterns we can extract and potentially automate
const EXTRACTABLE_PATTERNS = [
  {
    // "Wrong: `code`" or "- Wrong: `code`"
    regex: /(?:Wrong|Bad|INCORRECT|Anti-pattern):\s*`([^`]+)`/gi,
    type: "wrong_code",
  },
  {
    // "Example: `code`" in negative context (use [\s\S]*? to match across lines)
    regex: /Example:\s*`([^`]+)`(?=[\s\S]*?(?:fails|breaks|crashes|bug|issue|problem))/gi,
    type: "example_negative",
  },
  {
    // Code blocks after "Wrong:" headers
    regex: /#+\s*(?:Wrong|Bad|INCORRECT)[^\n]*\n```[\w]*\n([\s\S]{0,5000}?)```/gi,
    type: "wrong_block",
  },
];

// Known pattern categories that are automatable
const AUTOMATABLE_CATEGORIES = {
  shell: {
    indicators: ["bash", "shell", "sh", "\\$\\?", "exit code", "for\\s+\\w+\\s+in", "while.*read"],
    fileTypes: [".sh", ".yml", ".yaml"],
  },
  javascript: {
    indicators: [
      "catch",
      "error\\.message",
      "instanceof",
      "console\\.error",
      "\\.then",
      "\\.catch",
    ],
    fileTypes: [".js", ".ts", ".tsx", ".jsx"],
  },
  github_actions: {
    indicators: ["steps\\.", "github\\.", "\\$\\{\\{", "if:", "workflow", "actions"],
    fileTypes: [".yml", ".yaml"],
  },
  security: {
    indicators: ["path", "traversal", "injection", "sanitize", "validate", "unlink", "exec"],
    fileTypes: [".js", ".ts", ".sh"],
  },
};

/**
 * Sanitize code snippet for safe logging
 * Redacts potential secrets and truncates long strings
 */
function sanitizeCodeForLogging(code, maxLen = 60) {
  // Redact potential secrets/credentials
  let sanitized = code
    .replace(/['"`][A-Za-z0-9_/+=-]{20,}['"`]/g, '"[REDACTED]"')
    .replace(/(?:key|token|secret|password|api[_-]?key)\s*[:=]\s*\S+/gi, "[CREDENTIAL_REDACTED]")
    // Unix-like absolute paths (require at least two segments: /usr/local/...)
    // Use capture groups for deterministic replacement
    .replace(/(^|[\s"'`(])(\/(?:[^/\s]+\/){2,}[^/\s]+)/g, "$1/[PATH_REDACTED]")
    // Windows absolute paths like C:\Users\Name\...
    .replace(/(^|[\s"'`(])([A-Za-z]:\\(?:[^\\\s]+\\){2,}[^\\\s]+)/g, "$1[PATH_REDACTED]");

  // Truncate
  if (sanitized.length > maxLen) {
    sanitized = sanitized.slice(0, maxLen) + "...";
  }

  return sanitized;
}

/**
 * Extract code patterns from learnings file
 */
function extractPatternsFromLearnings() {
  // Check file exists
  if (!existsSync(LEARNINGS_FILE)) {
    console.error(`❌ Learnings file not found: ${LEARNINGS_FILENAME}`);
    process.exit(2);
  }

  let content;
  try {
    content = readFileSync(LEARNINGS_FILE, "utf-8");
  } catch (error) {
    console.error(`❌ Failed to read learnings file: ${sanitizeError(error)}`);
    process.exit(2);
  }

  const extracted = [];
  const seen = new Set(); // Deduplication

  // Find review sections while preserving the review number for traceability
  const sectionRegex = /####\s+Review\s+#(\d+)([\s\S]{0,50000}?)(?=####\s+Review\s+#\d+|$)/gi;
  let sectionMatch;
  while ((sectionMatch = sectionRegex.exec(content)) !== null) {
    const reviewNumber = sectionMatch[1];
    const section = sectionMatch[2];
    if (!section.trim()) continue;

    // Extract "Wrong:" patterns
    for (const { regex, type } of EXTRACTABLE_PATTERNS) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(section)) !== null) {
        let code = match[1].trim();

        // For code blocks, keep a representative snippet (blocks are often >200 chars)
        if (type === "wrong_block") {
          code = code.split("\n").slice(0, 12).join("\n").trim();
        }

        // Deduplicate by type and code
        const key = `${type}|${code}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Allow longer code blocks (up to 800 chars) vs inline snippets (200 chars)
        const maxLen = type === "wrong_block" ? 800 : 200;
        if (code.length > 10 && code.length < maxLen) {
          extracted.push({
            code,
            type,
            reviewNumber,
            context:
              `Review #${reviewNumber}\n` +
              section.slice(Math.max(0, match.index - 100), match.index + match[0].length + 100),
          });
        }
      }
    }
  }

  return extracted;
}

/**
 * Get existing patterns from checker
 */
function getExistingPatterns() {
  // Check file exists
  if (!existsSync(CHECKER_FILE)) {
    console.error(`❌ Pattern checker file not found: ${CHECKER_FILENAME}`);
    process.exit(2);
  }

  let content;
  try {
    content = readFileSync(CHECKER_FILE, "utf-8");
  } catch (error) {
    console.error(`❌ Failed to read pattern checker: ${sanitizeError(error)}`);
    process.exit(2);
  }

  const patterns = [];

  // Extract pattern IDs, regexes, and flags (handles escaped slashes)
  const patternRegex =
    /id:\s*['"`]([^'"`]+)['"`][\s\S]*?pattern:\s*\/((?:\\\/|[^/])+?)\/([gimuy]*)/g;
  let match;
  while ((match = patternRegex.exec(content)) !== null) {
    patterns.push({
      id: match[1],
      pattern: match[2],
      flags: match[3] || "",
    });
  }

  return patterns;
}

/**
 * Check if a code snippet is already covered by existing patterns
 */
function isAlreadyCovered(code, existingPatterns) {
  for (const { pattern, flags, id } of existingPatterns) {
    try {
      // Sanitize flags to only include valid RegExp flag characters
      const safeFlags = (flags ?? "").replace(/[^dgimsuvy]/g, "");
      // Use original flags exactly - don't override as it can change pattern semantics
      // Note: We create a new RegExp each iteration so 'g' flag's lastIndex doesn't matter
      const regex = new RegExp(pattern, safeFlags);
      if (regex.test(code)) {
        return true;
      }
    } catch (e) {
      // Use sanitizeError to prevent leaking sensitive pattern content
      console.warn(`[WARN] Invalid regex in pattern '${id}', skipping: ${sanitizeError(e)}`);
    }
  }
  return false;
}

/**
 * Categorize a code pattern
 */
function categorizePattern(code, context) {
  for (const [category, { indicators }] of Object.entries(AUTOMATABLE_CATEGORIES)) {
    for (const indicator of indicators) {
      try {
        const indicatorRegex = new RegExp(indicator, "i");
        if (indicatorRegex.test(code) || indicatorRegex.test(context)) {
          return category;
        }
      } catch (e) {
        // Log invalid indicator regex for debuggability
        console.warn(
          `[WARN] Invalid indicator regex '${indicator}' in category '${category}': ${sanitizeError(e)}`
        );
      }
    }
  }
  return "unknown";
}

/**
 * Suggest a regex pattern for a code snippet
 * Returns a simplified pattern - human review required
 */
function suggestRegex(code, _category) {
  // Extract the key identifiable part of the pattern
  // Don't try to be too clever - let humans refine it

  // For common anti-patterns, suggest known good patterns
  // Keys are regex patterns (not literals) for matching
  const knownPatterns = {
    "pipe.*while": "cmd \\| while.*done(?!.*< <)",
    "\\$\\?": "\\$\\(.*\\)\\s*;\\s*if\\s+\\[\\s*\\$\\?",
    "for.*in.*do": "for\\s+\\w+\\s+in\\s+\\$",
    startsWith: "\\.startsWith\\s*\\(",
    "\\.message": "\\.message(?![^}]*instanceof)",
    "console\\.error": "\\.catch\\s*\\(\\s*console\\.error",
    "user\\.type": "\\.user\\.type\\s*===",
  };

  for (const [key, pattern] of Object.entries(knownPatterns)) {
    // Treat keys as regex patterns (not literals)
    try {
      const keyRegex = new RegExp(key, "i");
      if (keyRegex.test(code)) {
        return pattern;
      }
    } catch {
      // Fallback to literal substring match if regex construction fails
      if (code.toLowerCase().includes(key.toLowerCase())) {
        return pattern;
      }
    }
  }

  // Fallback: escaped literal prefix (human should refine)
  // Use \\.{3} instead of ... to prevent regex wildcard interpretation
  return code.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\.{3}";
}

/**
 * Generate a pattern entry for the checker
 */
function generatePatternEntry(code, category, context, reviewNumber) {
  // Use content-based hash for stable ID
  const stableIdBase = `${category}|${code}`;
  let hash = 0;
  for (let i = 0; i < stableIdBase.length; i++) {
    hash = (hash * 31 + stableIdBase.charCodeAt(i)) >>> 0;
  }
  const id = `auto-suggested-${hash.toString(16)}`;

  const regex = suggestRegex(code, category);
  const fileTypes = AUTOMATABLE_CATEGORIES[category]?.fileTypes || [".js", ".ts"];

  // Use preserved review number, fallback to extracting from context
  let review = reviewNumber ? `#${reviewNumber}` : "auto-detected";
  if (!reviewNumber) {
    const reviewMatch = context.match(/Review\s+#(\d+)/i);
    if (reviewMatch) review = `#${reviewMatch[1]}`;
  }

  return {
    id,
    pattern: regex,
    message: `Potential anti-pattern detected (auto-suggested from learnings)`,
    fix: "See AI_REVIEW_LEARNINGS_LOG.md for the correct pattern",
    review,
    fileTypes,
    // Sanitize originalCode before persisting to prevent leaking secrets in generated artifacts
    originalCode: sanitizeCodeForLogging(code, 120),
  };
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const addToChecker = args.includes("--add-to-checker");

  console.log("🔍 Analyzing AI_REVIEW_LEARNINGS_LOG.md for automatable patterns...\n");

  // Extract patterns from learnings
  const extracted = extractPatternsFromLearnings();
  console.log(`Found ${extracted.length} code examples in learnings\n`);

  // Get existing patterns
  const existing = getExistingPatterns();
  console.log(`Pattern checker has ${existing.length} existing patterns\n`);

  // Abort if we couldn't parse existing patterns (prevents false positive suggestions)
  if (existing.length === 0) {
    console.error("❌ Unable to detect existing patterns; aborting to avoid false suggestions.");
    process.exit(2);
  }

  // Find patterns that aren't covered
  const uncovered = [];
  for (const item of extracted) {
    if (!isAlreadyCovered(item.code, existing)) {
      const category = categorizePattern(item.code, item.context);
      if (category !== "unknown") {
        uncovered.push({
          ...item,
          category,
          suggested: generatePatternEntry(item.code, category, item.context, item.reviewNumber),
        });
      }
    }
  }

  if (uncovered.length === 0) {
    console.log("✅ All extractable patterns are already covered by the checker!");
    console.log("\nNote: Some patterns require human judgment and cannot be automated.");
    return;
  }

  console.log(`⚠️  Found ${uncovered.length} pattern(s) that could potentially be automated:\n`);

  for (let i = 0; i < uncovered.length; i++) {
    const { code, category, suggested, reviewNumber } = uncovered[i];
    // Sanitize both code AND pattern output to prevent leaking sensitive data
    // (patterns are derived from code and may contain embedded secrets)
    const sanitizedCode = sanitizeCodeForLogging(code);
    const sanitizedPattern = sanitizeCodeForLogging(suggested.pattern, 50);

    console.log(
      i + 1 + ". Category: " + category + (reviewNumber ? ` (Review #${reviewNumber})` : "")
    );
    console.log(`   Code: ${sanitizedCode}`);
    console.log(`   Suggested regex: /${sanitizedPattern}/`);
    console.log(`   File types: ${suggested.fileTypes.join(", ")}`);
    console.log("");
  }

  console.log("---");
  console.log("To add these to the pattern checker:");
  console.log("1. Review each suggestion for accuracy");
  console.log("2. Adjust the regex as needed");
  console.log("3. Add to scripts/check-pattern-compliance.js");
  console.log("\nOr run with --add-to-checker to append suggestions (requires manual review)");

  if (addToChecker) {
    console.log("\n⚠️  --add-to-checker not fully implemented yet.");
    console.log("Suggestions saved to: scripts/suggested-patterns.json");

    try {
      const outPath = join(__dirname, "suggested-patterns.json");
      if (!isSafeToWrite(outPath)) {
        console.error("❌ Refusing to write: symlink detected at", outPath);
        process.exit(2);
      }
      writeFileSync(
        outPath,
        JSON.stringify(
          uncovered.map((u) => u.suggested),
          null,
          2
        ),
        { mode: 0o600 } // Restrictive permissions (owner read/write only)
      );
    } catch (error) {
      console.error(`❌ Failed to write suggestions file: ${sanitizeError(error)}`);
      process.exit(2);
    }
  }
}

try {
  main();
} catch (error) {
  // Catch-all for unexpected errors with sanitized output
  console.error(`❌ Unexpected error: ${sanitizeError(error)}`);
  process.exit(2);
}
