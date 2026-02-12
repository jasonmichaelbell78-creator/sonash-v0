#!/usr/bin/env node
/**
 * Surface Lessons Learned - Session Start Helper
 *
 * Searches docs/AI_REVIEW_LEARNINGS_LOG.md for relevant past issues
 * based on current work context (modified files, keywords).
 *
 * Usage:
 *   node scripts/surface-lessons-learned.js                    # Auto-detect from git changes
 *   node scripts/surface-lessons-learned.js --topic firebase   # Search for specific topic
 *   node scripts/surface-lessons-learned.js --topic auth,tests # Multiple topics
 *
 * Exit codes:
 *   0 = Success (lessons may or may not be found)
 *   1 = Error (file not found, etc.)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadConfig } = require("./config/load-config.js");

const LEARNINGS_FILE = "docs/AI_REVIEW_LEARNINGS_LOG.md";

// Topic aliases sourced from scripts/config/skill-config.json
let TOPIC_ALIASES = {};
try {
  const cfg = loadConfig("skill-config");
  TOPIC_ALIASES = (cfg && typeof cfg === "object" && cfg.topicAliases) || {};
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Error: failed to load skill-config: ${msg}`);
  process.exit(2);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const topicIndex = args.indexOf("--topic");
  let topics = null;

  if (topicIndex !== -1) {
    const nextArg = args[topicIndex + 1];
    // Validate: value exists, not another flag, not empty
    if (!nextArg || nextArg.startsWith("--") || nextArg.trim() === "") {
      console.error("Error: --topic requires a value (comma-separated topics)");
      console.error("Usage: node scripts/surface-lessons-learned.js --topic firebase,auth");
      process.exit(1);
    }
    // Deduplicate topics
    topics = Array.from(
      new Set(
        nextArg
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0)
      )
    );
    if (topics.length === 0) {
      console.error("Error: --topic value cannot be empty");
      process.exit(1);
    }
  }

  return { topics };
}

/**
 * Topic detection patterns - maps file path patterns to topics
 */
const TOPIC_PATTERNS = [
  { patterns: ["firebase", "firestore"], topic: "firebase" },
  { patterns: ["auth"], topic: "auth" },
  { patterns: ["test"], topic: "tests" },
  { patterns: ["security"], topic: "security" },
  { patterns: ["hook"], topic: "hooks" },
  { patterns: ["api", "endpoint"], topic: "api" },
  { patterns: [".yml", "workflow"], topic: "ci" },
  { patterns: [".md", "doc"], topic: "docs" },
];

/**
 * Detect topics from a file path
 * @param {string} fileLower - Lowercase file path
 * @param {Set} topics - Set to add detected topics to
 */
function detectTopicsFromFile(fileLower, topics) {
  for (const { patterns, topic } of TOPIC_PATTERNS) {
    if (patterns.some((p) => fileLower.includes(p))) {
      topics.add(topic);
    }
  }
}

/**
 * Auto-detect topics from git changes
 * Cross-platform compatible (no shell-specific syntax)
 */
function detectTopicsFromGitChanges() {
  try {
    // Get recently modified files - try HEAD~5 first, fall back to HEAD
    let changedFilesOutput = "";
    try {
      changedFilesOutput = execSync("git diff --name-only --diff-filter=ACM HEAD~5", {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {
      // Fall back to diff against HEAD (no commits to compare)
      changedFilesOutput = execSync("git diff --name-only --diff-filter=ACM", {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    }

    // Also include untracked and staged files from git status
    let statusOutput = "";
    try {
      statusOutput = execSync("git status --porcelain", {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {
      // Ignore errors - continue with diff files only
    }

    const diffFiles = changedFilesOutput.trim().split("\n").filter(Boolean);
    const statusFiles = statusOutput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const path = l.slice(3); // drop "XY " prefix
        // Handle renamed files: "R  old -> new" format - extract the new filename
        if (path.includes(" -> ")) {
          return path.split(" -> ")[1];
        }
        return path;
      });

    // Deduplicate using Set
    const changedFiles = Array.from(new Set([...diffFiles, ...statusFiles])).filter(Boolean);

    const detectedTopics = new Set();

    for (const file of changedFiles) {
      detectTopicsFromFile(file.toLowerCase(), detectedTopics);
    }

    return Array.from(detectedTopics);
  } catch {
    return [];
  }
}

/**
 * Extract lessons from the learnings log file
 */
function extractLessons(content) {
  const lessons = [];

  // Pattern: Review #XX: Title (uses #### headings in AI_REVIEW_LEARNINGS_LOG.md)
  // Use [\s\S]*? to capture content including ## subheadings within a review section
  // Handle both Unix (\n) and Windows (\r\n) line endings in lookahead
  const reviewPattern = /#### Review #(\d+):?\s*([\s\S]{0,50000}?)(?=\r?\n#### Review #|$)/g;
  let match;

  while ((match = reviewPattern.exec(content)) !== null) {
    const reviewNum = match[1];
    const reviewContent = match[2];
    const titleMatch = reviewContent.match(/^([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : "Unknown";

    // Extract key takeaways or lessons
    const takeawayPatterns = [
      /\*\*(?:Key )?(?:Takeaway|Lesson|Pattern|Fix)\*\*:?\s*([^\n]+)/gi,
      /- \*\*([^*]+)\*\*:?\s*([^\n]+)/gi,
      /(?:✅|❌)\s*([^\n]+)/g,
    ];

    const takeaways = [];
    for (const pattern of takeawayPatterns) {
      let takeawayMatch;
      const tempContent = reviewContent;
      pattern.lastIndex = 0;
      while ((takeawayMatch = pattern.exec(tempContent)) !== null) {
        // For patterns with label:value (capture group 2), combine them
        if (takeawayMatch[2]) {
          takeaways.push(`${takeawayMatch[1].trim()}: ${takeawayMatch[2].trim()}`);
        } else {
          takeaways.push((takeawayMatch[1] || takeawayMatch[0]).trim());
        }
      }
    }

    lessons.push({
      reviewNum,
      title,
      content: reviewContent.slice(0, 500),
      takeaways: takeaways.slice(0, 5),
      keywords: extractKeywords(reviewContent),
    });
  }

  return lessons;
}

/**
 * Extract keywords from lesson content
 */
function extractKeywords(content) {
  const keywords = new Set();
  const contentLower = content.toLowerCase();

  for (const [topic, aliases] of Object.entries(TOPIC_ALIASES)) {
    for (const alias of aliases) {
      if (contentLower.includes(alias)) {
        keywords.add(topic);
        break;
      }
    }
  }

  return Array.from(keywords);
}

/**
 * Find relevant lessons for given topics
 */
function findRelevantLessons(lessons, topics) {
  if (!topics || topics.length === 0) {
    return lessons.slice(-5); // Return last 5 if no topics specified
  }

  const expandedTopics = new Set();
  for (const topic of topics) {
    expandedTopics.add(topic);
    // Add aliases - use Object.hasOwn for safe property access
    if (Object.hasOwn(TOPIC_ALIASES, topic)) {
      TOPIC_ALIASES[topic].forEach((alias) => expandedTopics.add(alias));
    }
  }

  return lessons
    .filter((lesson) => {
      const lessonKeywords = new Set([
        ...lesson.keywords,
        ...lesson.content.toLowerCase().split(/\W+/),
      ]);
      for (const topic of expandedTopics) {
        if (lessonKeywords.has(topic) || lesson.content.toLowerCase().includes(topic)) {
          return true;
        }
      }
      return false;
    })
    .slice(0, 10); // Max 10 relevant lessons
}

/**
 * Format lessons for display
 */
function formatLessons(lessons, _topics) {
  if (lessons.length === 0) {
    return "  📚 No specific lessons found for these topics.\n     Check docs/AI_REVIEW_LEARNINGS_LOG.md for all patterns.";
  }

  // Sanitize content from file before terminal output (prevent control char injection)
  const sanitizeForTerminal = (s) =>
    String(s ?? "")
      // eslint-disable-next-line no-control-regex -- intentional: strip control chars, preserve safe whitespace
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  let output = "";

  for (const lesson of lessons.slice(0, 5)) {
    const safeTitle = sanitizeForTerminal(lesson.title);
    output += `\n  📖 Review #${lesson.reviewNum}: ${safeTitle.slice(0, 60)}`;
    if (safeTitle.length > 60) output += "...";
    output += "\n";

    if (lesson.takeaways.length > 0) {
      output += `     Key points:\n`;
      for (const takeaway of lesson.takeaways.slice(0, 2)) {
        const safeTakeaway = sanitizeForTerminal(takeaway);
        output += `       - ${safeTakeaway.slice(0, 80)}${safeTakeaway.length > 80 ? "..." : ""}\n`;
      }
    }
  }

  if (lessons.length > 5) {
    output += `\n  ... and ${lessons.length - 5} more lessons (see docs/AI_REVIEW_LEARNINGS_LOG.md)\n`;
  }

  return output;
}

async function main() {
  console.log("");
  console.log("━━━ LESSONS LEARNED SURFACE ━━━");
  console.log("");

  // Find the learnings file
  const projectRoot = process.cwd();
  const learningsPath = path.join(projectRoot, LEARNINGS_FILE);

  if (!fs.existsSync(learningsPath)) {
    console.log(`  ❌ ${LEARNINGS_FILE} not found`);
    process.exit(1);
  }

  // Parse arguments
  const { topics: specifiedTopics } = parseArgs();

  // Detect topics if not specified
  let topics = specifiedTopics;
  if (!topics || topics.length === 0) {
    topics = detectTopicsFromGitChanges();
    if (topics.length > 0) {
      console.log(`  🔍 Auto-detected topics from recent changes: ${topics.join(", ")}`);
    } else {
      console.log("  🔍 No specific topics detected, showing recent lessons");
    }
  } else {
    console.log(`  🔍 Searching for topics: ${topics.join(", ")}`);
  }

  console.log("");

  // Read and parse the learnings file
  let content;
  try {
    content = fs.readFileSync(learningsPath, "utf-8");
  } catch (err) {
    console.error(`  ❌ Error reading ${LEARNINGS_FILE}: ${err.code || "unknown error"}`);
    process.exit(1);
  }
  const allLessons = extractLessons(content);

  console.log(`  📚 Found ${allLessons.length} documented reviews`);

  // Find relevant lessons
  const relevantLessons = findRelevantLessons(allLessons, topics);

  if (relevantLessons.length > 0) {
    console.log(`  ✅ ${relevantLessons.length} relevant lessons found:`);
    console.log(formatLessons(relevantLessons, topics));
  } else {
    console.log("  ℹ️  No lessons matched the detected topics");
    console.log("     Recent reviews may still be relevant:");
    console.log(formatLessons(allLessons.slice(-3), []));
  }

  console.log("");
  console.log("  📖 Full log: docs/AI_REVIEW_LEARNINGS_LOG.md");
  console.log("");

  process.exit(0);
}

// Export functions for testing
export {
  parseArgs,
  detectTopicsFromGitChanges,
  extractLessons,
  extractKeywords,
  findRelevantLessons,
  formatLessons,
  TOPIC_ALIASES,
};

// Only run main() when executed directly (not when imported for testing)
// Cross-platform: pathToFileURL handles Windows paths correctly
// Wrap in try-catch for robust handling of edge cases (relative paths, symlinks, etc.)
let isMainModule = false;
try {
  isMainModule =
    !!process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
} catch {
  isMainModule = false;
}

if (isMainModule) {
  try {
    await main();
  } catch (err) {
    // Avoid exposing sensitive paths in error messages
    // Use .split('\n')[0] to ensure only first line (no stack trace in String(err))
    // Strip control chars (ANSI escapes) to prevent log/terminal injection in CI
    const safeMessage = String(err?.message ?? err ?? "Unknown error")
      .split("\n")[0]
      .replace(/\r$/, "") // Strip trailing CR from Windows CRLF line endings
      // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control characters for terminal/CI safety
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // eslint-disable-line no-control-regex -- intentional: strip control chars
      .replace(/\/home\/[^/\s]+/g, "[HOME]")
      .replace(/\/Users\/[^/\s]+/g, "[HOME]")
      // Handle any Windows drive letter, case-insensitive
      .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]");
    console.error("Script error:", safeMessage);
    process.exit(1);
  }
}
