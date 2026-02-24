#!/usr/bin/env node
/* global __dirname */
/**
 * Learning Effectiveness Analyzer
 *
 * Measures CLAUDE'S LEARNING EFFECTIVENESS - whether documented patterns
 * prevent recurring issues and identifies automation needs.
 *
 * THE CORE QUESTION: "Is Claude learning from documented patterns?"
 *
 * This tool analyzes:
 * - Pattern recurrence: Did documented patterns appear again?
 * - Learning gaps: Which patterns keep failing despite documentation?
 * - Automation needs: Which recurring patterns need Pattern Checker enforcement?
 * - Training effectiveness: Are guides and documentation working?
 *
 * Usage:
 *   npm run learning:analyze                           # Dashboard + interactive
 *   npm run learning:analyze -- --detailed             # Full learning report
 *   npm run learning:analyze -- --since-review 150     # Specific range
 *   npm run learning:analyze -- --auto                 # Non-interactive (for hooks)
 *   npm run learning:analyze -- --file path/to/file    # Analyze specific file
 *   npm run learning:analyze -- --all-archives         # Analyze ALL archive files
 *
 * Exit codes: 0 = success, 1 = errors found, 2 = fatal error
 */

const { readFileSync, writeFileSync, existsSync, readdirSync, lstatSync } = require("node:fs");
const path = require("node:path");
const { join } = path;
const { createInterface } = require("node:readline");

const ROOT = join(__dirname, "..");

const LEARNINGS_LOG = join(ROOT, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const CODE_PATTERNS = join(ROOT, "docs", "agent_docs", "CODE_PATTERNS.md");
const PATTERN_CHECKER = join(ROOT, "scripts", "check-pattern-compliance.js");
const METRICS_FILE = join(ROOT, "docs", "LEARNING_METRICS.md");
const TODO_FILE = join(ROOT, "docs", "LEARNING_TODO.md");

/**
 * Simple error sanitizer (avoid ES module dependency)
 */
function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
    .replace(/\/home\/[^/\s]+/gi, "[HOME]")
    .replace(/\/Users\/[^/\s]+/gi, "[HOME]");
}

/**
 * Sanitize display strings from review content
 */
function sanitizeDisplayString(str, maxLength = 100) {
  if (!str) return "";

  const sanitized = String(str)
    .replace(/```[\s\S]*?```/g, "[CODE]")
    .replace(/`[^`]+`/g, "[CODE]")
    .replace(/C:\\Users\\[^\s]+/gi, "[PATH]")
    .replace(/\/home\/[^\s]+/gi, "[PATH]")
    .replace(/\/Users\/[^\s]+/gi, "[PATH]")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) + "..." : sanitized;
}

/**
 * Escape Markdown metacharacters
 */
function escapeMd(str, maxLength = 100) {
  const sanitized = sanitizeDisplayString(str, maxLength);
  return sanitized.replace(/[\\[\]()_*`#>!-]/g, "\\$&");
}

/**
 * Check if path is a symlink and refuse to write through it
 */
function refuseSymlink(filePath) {
  const { lstatSync } = require("node:fs");
  const path = require("node:path");

  let current = path.resolve(filePath);
  while (true) {
    if (existsSync(current)) {
      const st = lstatSync(current);
      if (st.isSymbolicLink()) {
        throw new Error(`Refusing to write through symlink: ${current}`);
      }
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

/**
 * Find the end index of a JS array declaration in source text.
 * Review #309: Extracted from loadAutomatedPatterns to reduce cognitive complexity.
 * Review #311: Use bracket-depth counting only (regex can false-match inner `];`).
 */
function findArrayEnd(content, startIdx) {
  const openIdx = content.indexOf("[", startIdx);
  if (openIdx === -1) return content.length;
  let depth = 0;
  for (let i = openIdx; i < content.length; i++) {
    if (content[i] === "[") depth++;
    else if (content[i] === "]") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return content.length;
}

/**
 * Parse a single pattern block from the ANTI_PATTERNS array source text.
 * Review #309: Extracted from loadAutomatedPatterns to reduce cognitive complexity.
 */
function parsePatternBlock(block) {
  const idMatch = block.match(/["'`]([^"'`]+)["'`]/);
  if (!idMatch) return null;
  const messageMatch = block.match(/message:\s*["'`]([^"'`]+)["'`]/);
  const reviewMatch = block.match(/review:\s*["'`]([^"'`]+)["'`]/);
  return {
    id: idMatch[1],
    message: messageMatch ? messageMatch[1] : "",
    reviewRefs: reviewMatch ? reviewMatch[1] : "",
  };
}

class LearningEffectivenessAnalyzer {
  constructor(options = {}) {
    this.options = {
      sinceReview: options.sinceReview || 1,
      format: options.format || "dashboard",
      auto: options.auto || false,
      detailed: options.detailed || false,
      inputFile: options.inputFile || null,
      allArchives: options.allArchives || false,
    };

    this.reviews = [];
    this.documentedPatterns = []; // Patterns from CODE_PATTERNS.md
    this.automatedPatterns = []; // Patterns from check-pattern-compliance.js
    this.patternOccurrences = new Map(); // Pattern name -> array of review numbers
    this.results = {};
  }

  /**
   * Main entry point - runs full analysis pipeline
   */
  async analyze() {
    try {
      console.log("📊 Learning Effectiveness Analyzer\n");
      console.log("🎯 Focus: Is Claude learning from documented patterns?\n");

      await this.loadReviews();
      await this.loadDocumentedPatterns();
      await this.loadAutomatedPatterns();
      await this.buildPatternOccurrenceMap();

      console.log(
        `📈 Analyzing ${this.reviews.length} reviews for Claude's learning patterns...\n`
      );

      // Core analysis: Claude's learning effectiveness
      this.results = {
        patternLearning: this.analyzePatternLearning(),
        automationNeeds: this.analyzeAutomationNeeds(),
        learningTrends: this.analyzeLearningTrends(),
        recurrenceDetails: this.analyzeRecurrenceDetails(),
      };

      // Generate actionable suggestions
      this.results.suggestions = this.generateSuggestions();
      this.results.summary = this.calculateSummaryMetrics();

      await this.outputReport();
      await this.updateMetrics();

      // Interactive mode unless --auto flag
      if (!this.options.auto && this.results.suggestions.length > 0) {
        await this.interactiveSuggestionHandler();
      }

      return this.results;
    } catch (error) {
      console.error("❌ Analysis failed:", sanitizeError(error));
      process.exit(2);
    }
  }

  /**
   * Load and parse reviews from AI_REVIEW_LEARNINGS_LOG.md or archives
   */
  async loadReviews() {
    let content = "";

    if (this.options.allArchives) {
      const archiveDir = join(ROOT, "docs", "archive");
      if (!existsSync(archiveDir)) {
        throw new Error("Archive directory not found: docs/archive/");
      }

      const { readdirSync } = require("node:fs");
      const archiveFiles = readdirSync(archiveDir)
        .filter((f) => f.startsWith("REVIEWS_") && f.endsWith(".md"))
        .sort();

      if (archiveFiles.length === 0) {
        throw new Error("No REVIEWS_*.md files found in docs/archive/");
      }

      console.log(`📂 Scanning ${archiveFiles.length} archive files...`);

      for (const file of archiveFiles) {
        const filePath = join(archiveDir, file);
        try {
          // Check for symlinks to prevent symlink-based path traversal
          const stat = lstatSync(filePath);
          if (stat.isSymbolicLink()) {
            console.warn(`   ⚠ Skipping symlink: ${file}`);
            continue;
          }
          const fileContent = readFileSync(filePath, "utf-8");
          content += "\n" + fileContent;
          console.log(`   ✓ ${file}`);
        } catch (error) {
          console.warn(`   ⚠ Failed to read ${file}: ${sanitizeError(error)}`);
        }
      }

      // Also include current learnings log
      if (existsSync(LEARNINGS_LOG)) {
        try {
          content += "\n" + readFileSync(LEARNINGS_LOG, "utf-8");
          console.log(`   ✓ AI_REVIEW_LEARNINGS_LOG.md (current)`);
        } catch (error) {
          console.warn(`   ⚠ Failed to read current log: ${sanitizeError(error)}`);
        }
      }
    } else {
      const displayPath = this.options.inputFile || "docs/AI_REVIEW_LEARNINGS_LOG.md";
      const resolvedInput = this.options.inputFile
        ? path.resolve(ROOT, this.options.inputFile)
        : LEARNINGS_LOG;

      // Path traversal prevention
      const relToRoot = path.relative(ROOT, resolvedInput);
      if (
        this.options.inputFile &&
        (relToRoot === "" || /^\.\.(?:[\\/]|$)/.test(relToRoot) || path.isAbsolute(relToRoot))
      ) {
        throw new Error(`Input file must be within repo: ${displayPath}`);
      }

      if (!existsSync(resolvedInput)) {
        throw new Error(`Input file not found: ${displayPath}`);
      }

      // Symlink check to prevent symlink-based path traversal
      const stat = lstatSync(resolvedInput);
      if (stat.isSymbolicLink()) {
        throw new Error(`Symbolic links not allowed: ${displayPath}`);
      }

      try {
        content = readFileSync(resolvedInput, "utf-8");
      } catch (error) {
        throw new Error(`Failed to read input file: ${sanitizeError(error)}`);
      }
    }

    // Parse reviews from content
    const lines = content.split("\n");
    let currentReview = null;
    const seenReviewNumbers = new Set(); // Deduplicate reviews from multiple files

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const reviewMatch = line.match(/^####\s+Review\s+#(\d+)/);
      if (reviewMatch) {
        const reviewNum = Number.parseInt(reviewMatch[1]);

        // Skip duplicate reviews (can appear in both archive and current log)
        if (seenReviewNumbers.has(reviewNum)) {
          currentReview = null; // Reset so we don't capture lines from duplicate
          continue;
        }

        if (currentReview && currentReview.number >= this.options.sinceReview) {
          this.reviews.push(currentReview);
          seenReviewNumbers.add(currentReview.number);
        }

        currentReview = {
          number: reviewNum,
          title: line.replace(/^####\s+Review\s+#\d+\s*:?\s*/, ""),
          patterns: [],
          findings: [],
          rawLines: [],
        };
        continue;
      }

      if (!currentReview) continue;
      currentReview.rawLines.push(line);

      // Extract patterns mentioned
      const patternMatch = line.match(/Pattern:\s*(.+)/i);
      if (patternMatch) {
        currentReview.patterns.push(patternMatch[1].trim());
      }

      // Extract from numbered pattern lists
      const numberedPattern = line.match(/^\d+\.\s+\*\*([^*]+)\*\*/);
      if (numberedPattern) {
        currentReview.patterns.push(numberedPattern[1].trim());
      }

      // Extract findings for keyword matching
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        currentReview.findings.push(line.trim().substring(2));
      }
    }

    if (currentReview && currentReview.number >= this.options.sinceReview) {
      this.reviews.push(currentReview);
    }

    if (this.reviews.length === 0) {
      throw new Error(`No reviews found in range (since #${this.options.sinceReview})`);
    }

    this.reviews.sort((a, b) => a.number - b.number);

    console.log(
      `✅ Loaded ${this.reviews.length} reviews (#${this.reviews[0].number} - #${this.reviews[this.reviews.length - 1].number})`
    );
  }

  /**
   * Load documented patterns from CODE_PATTERNS.md
   * These are the patterns Claude SHOULD have learned
   */
  async loadDocumentedPatterns() {
    if (!existsSync(CODE_PATTERNS)) {
      console.warn("⚠️  CODE_PATTERNS.md not found");
      return;
    }

    let content;
    try {
      content = readFileSync(CODE_PATTERNS, "utf-8");
    } catch (error) {
      console.warn(`⚠️  Failed to read CODE_PATTERNS.md: ${sanitizeError(error)}`);
      return;
    }

    const lines = content.split("\n");
    let currentCategory = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Track current category (## Category Name)
      if (line.match(/^## /)) {
        currentCategory = line.replace(/^##\s+/, "").trim();
      }

      // Parse ### header patterns (Critical quick reference section)
      if (line.startsWith("### ")) {
        const name = line.replace(/^###\s+\d+\.\s*/, "").trim();
        if (name && !name.match(/^(When to|Key Metrics|Top Recommended|Pattern Learning)/)) {
          const sourceReviews = [];
          // Scan next few lines for review references
          for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
            if (lines[j].startsWith("### ") || lines[j].startsWith("## ")) break;
            const reviewMatches = lines[j].match(/Review #(\d+)/g);
            if (reviewMatches) {
              reviewMatches.forEach((match) => {
                const num = Number.parseInt(match.replace("Review #", ""), 10);
                if (!sourceReviews.includes(num)) sourceReviews.push(num);
              });
            }
          }
          this.documentedPatterns.push({
            name,
            priority: "Critical",
            category: currentCategory,
            sourceReviews,
            keywords: this.extractKeywords(name),
          });
        }
      }

      // Parse table-row patterns (main format: | Priority | Pattern | Rule | Why |)
      // Review #309: Fixed ReDoS (S5852) - removed \s* before [^|]* to eliminate overlapping quantifiers
      const tableMatch = line.match(/^\|\s*([🔴🟡⚪])\s*\|([^|]*)\|([^|]*)\|([^|]*)/u);
      if (tableMatch) {
        const [, emoji, patternName, ,] = tableMatch;
        const name = patternName.trim();
        if (!name || name === "Pattern" || name === "---") continue; // Skip header rows

        // Review #308: Extract nested ternary into helper map
        const priorityMap = { "🔴": "Critical", "🟡": "Important" };
        const priority = priorityMap[emoji] || "Edge case";

        // Extract review references from the row
        const sourceReviews = [];
        const reviewMatches = line.match(/Review #(\d+)/g);
        if (reviewMatches) {
          reviewMatches.forEach((match) => {
            const num = Number.parseInt(match.replace("Review #", ""), 10);
            if (!sourceReviews.includes(num)) sourceReviews.push(num);
          });
        }

        this.documentedPatterns.push({
          name,
          priority,
          category: currentCategory,
          sourceReviews,
          keywords: this.extractKeywords(name),
        });
      }
    }

    console.log(
      `✅ Loaded ${this.documentedPatterns.length} documented patterns from CODE_PATTERNS.md`
    );
  }

  /**
   * Extract keywords from pattern name for matching
   */
  extractKeywords(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);
  }

  /**
   * Load automated patterns from check-pattern-compliance.js
   * Review #309: Extracted helpers to reduce cognitive complexity from 22 to <15
   */
  async loadAutomatedPatterns() {
    if (!existsSync(PATTERN_CHECKER)) {
      console.warn("⚠️  Pattern checker not found");
      return;
    }

    let content;
    try {
      content = readFileSync(PATTERN_CHECKER, "utf-8");
    } catch (error) {
      console.warn(`⚠️  Failed to read pattern checker: ${sanitizeError(error)}`);
      return;
    }

    const startIdx = content.indexOf("const ANTI_PATTERNS = [");
    if (startIdx === -1) {
      console.warn("⚠️  Could not find ANTI_PATTERNS in checker");
      return;
    }

    // Review #309: Use regex to find array end instead of bracket-depth loop
    const endIdx = findArrayEnd(content, startIdx);
    const patternsText = content.slice(startIdx, endIdx);
    const patternBlocks = patternsText.split(/\{\s*id:/g).slice(1);

    for (const block of patternBlocks) {
      const parsed = parsePatternBlock(block);
      if (parsed) {
        this.automatedPatterns.push({
          ...parsed,
          keywords: this.extractKeywords(parsed.id + " " + parsed.message),
        });
      }
    }

    console.log(
      `✅ Loaded ${this.automatedPatterns.length} automated patterns from Pattern Checker`
    );
  }

  /**
   * Build a map of pattern keywords -> review occurrences
   * This tracks when patterns were mentioned across all reviews
   */
  async buildPatternOccurrenceMap() {
    for (const pattern of this.documentedPatterns) {
      const occurrences = [];

      for (const review of this.reviews) {
        // Check if any pattern keyword appears in review
        const reviewText = [
          review.title,
          ...review.patterns,
          ...review.findings,
          ...review.rawLines,
        ]
          .join(" ")
          .toLowerCase();

        const matchScore = this.calculatePatternMatch(pattern.keywords, reviewText);
        if (matchScore >= 0.5) {
          // 50% keyword match threshold
          occurrences.push(review.number);
        }
      }

      this.patternOccurrences.set(pattern.name, occurrences);
    }
  }

  /**
   * Calculate keyword match score between pattern and text
   * Uses word-boundary matching to prevent false positives (e.g., "path" in "filepath")
   */
  calculatePatternMatch(keywords, text) {
    if (keywords.length === 0) return 0;
    const matches = keywords.filter((kw) => {
      // Escape special regex chars in keyword, then match at word boundaries
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const wordBoundaryRegex = new RegExp(String.raw`\b${escaped}\b`, "i");
      return wordBoundaryRegex.test(text);
    }).length;
    return matches / keywords.length;
  }

  /**
   * CORE ANALYSIS: Claude's Pattern Learning Effectiveness
   *
   * For each documented pattern:
   * - When was it first documented?
   * - Did it appear again after documentation?
   * - Is it now automated?
   * - What's the learning status?
   */
  analyzePatternLearning() {
    const learningResults = [];

    for (const pattern of this.documentedPatterns) {
      const occurrences = this.patternOccurrences.get(pattern.name) || [];
      const firstDocumented =
        pattern.sourceReviews.length > 0 ? Math.min(...pattern.sourceReviews) : null;

      // Find occurrences after first documentation
      const recurrences = firstDocumented
        ? occurrences.filter((r) => r > firstDocumented + 5) // Grace period of 5 reviews
        : [];

      // Check if pattern is automated
      const isAutomated = this.isPatternAutomated(pattern.name);

      // Determine learning status
      let status;
      let statusEmoji;
      if (recurrences.length === 0) {
        status = "LEARNED";
        statusEmoji = "✅";
      } else if (isAutomated) {
        status = "AUTOMATED";
        statusEmoji = "🔧";
      } else if (recurrences.length <= 2) {
        status = "WEAK";
        statusEmoji = "🟡";
      } else {
        status = "FAILED";
        statusEmoji = "🔴";
      }

      learningResults.push({
        pattern: pattern.name,
        priority: pattern.priority,
        firstDocumented,
        totalOccurrences: occurrences.length,
        recurrences: recurrences.length,
        recurrenceReviews: recurrences.slice(-5), // Last 5 recurrences
        isAutomated,
        status,
        statusEmoji,
        learningScore: recurrences.length === 0 ? 100 : Math.max(0, 100 - recurrences.length * 20),
      });
    }

    // Sort by recurrence count (worst first)
    return learningResults.sort((a, b) => b.recurrences - a.recurrences);
  }

  /**
   * Check if a pattern is automated in Pattern Checker.
   * Uses both fuzzy keyword matching AND an explicit alias map for patterns
   * whose CODE_PATTERNS.md names don't match their checker IDs (Session #185).
   */
  isPatternAutomated(patternName) {
    // Explicit alias map: CODE_PATTERNS.md name → checker ID
    // Fixes false "FAILED" status for patterns already automated under different names
    const PATTERN_ALIASES = {
      "safe percentage": "unsafe-division",
      "session identity check": "session-id-no-validation",
      "table-column date parsing": "unsection-scoped-table-regex",
      "empty filename fallback": "rename-no-fallback",
      "section-scoped regex parsing": "unsection-scoped-table-regex",
    };

    const lowerName = patternName.toLowerCase();
    const aliasId = PATTERN_ALIASES[lowerName];
    if (aliasId && this.automatedPatterns.some((a) => a.id === aliasId)) {
      return true;
    }

    const patternKeywords = this.extractKeywords(patternName);

    for (const automated of this.automatedPatterns) {
      const matchScore = this.calculatePatternMatch(patternKeywords, automated.keywords.join(" "));
      if (matchScore >= 0.4) {
        return true;
      }
    }

    return false;
  }

  /**
   * Identify patterns that need automation
   * (Recurring patterns not yet in Pattern Checker)
   */
  analyzeAutomationNeeds() {
    const needs = [];

    for (const result of this.results?.patternLearning || this.analyzePatternLearning()) {
      if (result.status === "FAILED" || result.status === "WEAK") {
        if (!result.isAutomated) {
          needs.push({
            pattern: result.pattern,
            priority: result.priority,
            recurrences: result.recurrences,
            lastSeen: result.recurrenceReviews[result.recurrenceReviews.length - 1],
            recommendation: this.generateAutomationRecommendation(result),
          });
        }
      }
    }

    return needs.sort((a, b) => b.recurrences - a.recurrences);
  }

  /**
   * Generate automation recommendation for a pattern
   */
  generateAutomationRecommendation(result) {
    const sanitized = (result.pattern || "")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 40);
    const safeName = sanitized || `pattern-${Date.now()}`;

    let priority;
    if (result.recurrences >= 5) {
      priority = "HIGH";
    } else if (result.recurrences >= 3) {
      priority = "MEDIUM";
    } else {
      priority = "LOW";
    }

    return {
      action: `Add to check-pattern-compliance.js`,
      patternId: safeName,
      priority,
      effort: "30-60 minutes",
    };
  }

  /**
   * Analyze learning trends over time
   */
  analyzeLearningTrends() {
    const patternLearning = this.results?.patternLearning || this.analyzePatternLearning();

    // Calculate overall learning effectiveness
    const total = patternLearning.length;
    const learned = patternLearning.filter((p) => p.status === "LEARNED").length;
    const automated = patternLearning.filter((p) => p.status === "AUTOMATED").length;
    const weak = patternLearning.filter((p) => p.status === "WEAK").length;
    const failed = patternLearning.filter((p) => p.status === "FAILED").length;

    // Calculate by priority
    const criticalPatterns = patternLearning.filter((p) => p.priority === "Critical");
    const criticalLearned = criticalPatterns.filter(
      (p) => p.status === "LEARNED" || p.status === "AUTOMATED"
    ).length;

    return {
      total,
      learned,
      automated,
      weak,
      failed,
      effectivenessRate: total > 0 ? ((learned + automated) / total) * 100 : 0,
      criticalTotal: criticalPatterns.length,
      criticalLearned,
      criticalRate:
        criticalPatterns.length > 0 ? (criticalLearned / criticalPatterns.length) * 100 : 0,
    };
  }

  /**
   * Get detailed recurrence information
   */
  analyzeRecurrenceDetails() {
    const patternLearning = this.results?.patternLearning || this.analyzePatternLearning();

    // Get top recurring patterns with details
    const recurring = patternLearning
      .filter((p) => p.recurrences > 0)
      .map((p) => ({
        pattern: p.pattern,
        priority: p.priority,
        firstDocumented: p.firstDocumented,
        recurrences: p.recurrences,
        recurrenceReviews: p.recurrenceReviews,
        isAutomated: p.isAutomated,
        diagnosis: this.diagnoseRecurrence(p),
      }));

    return recurring;
  }

  /**
   * Diagnose why a pattern keeps recurring
   */
  diagnoseRecurrence(pattern) {
    if (pattern.isAutomated) {
      return "Automated but automation may need refinement";
    }
    if (pattern.recurrences >= 5) {
      return "High recurrence - documentation insufficient, needs automation";
    }
    if (pattern.recurrences >= 3) {
      return "Moderate recurrence - consider adding to Pattern Checker";
    }
    return "Low recurrence - monitor for improvement";
  }

  /**
   * Generate actionable suggestions focused on learning improvement
   */
  generateSuggestions() {
    const suggestions = [];
    let priority = 1;

    // Suggestion 1: Patterns that FAILED learning (need automation)
    const failedPatterns = this.results.patternLearning.filter(
      (p) => p.status === "FAILED" && !p.isAutomated
    );

    for (const pattern of failedPatterns.slice(0, 3)) {
      suggestions.push({
        priority: priority++,
        category: "Automation",
        title: `Automate "${sanitizeDisplayString(pattern.pattern, 50)}"`,
        description: `Recurred ${pattern.recurrences} times after documentation (Reviews: ${pattern.recurrenceReviews.join(", ")})`,
        action: "Add pattern to check-pattern-compliance.js",
        effort: "30-60 minutes",
        impact: "High - will prevent future recurrences",
        type: "automation",
        patternName: pattern.pattern,
      });
    }

    // Suggestion 2: Weak patterns (need documentation improvement)
    const weakPatterns = this.results.patternLearning.filter(
      (p) => p.status === "WEAK" && !p.isAutomated
    );

    for (const pattern of weakPatterns.slice(0, 2)) {
      suggestions.push({
        priority: priority++,
        category: "Documentation",
        title: `Improve documentation for "${sanitizeDisplayString(pattern.pattern, 50)}"`,
        description: `Recurred ${pattern.recurrences} times - documentation may be unclear`,
        action: "Review and enhance pattern documentation in CODE_PATTERNS.md",
        effort: "15-30 minutes",
        impact: "Medium - may reduce recurrences",
        type: "documentation",
        patternName: pattern.pattern,
      });
    }

    // Suggestion 3: Training guides for complex patterns
    const complexPatterns = this.results.patternLearning.filter(
      (p) => p.recurrences >= 3 && p.priority === "Critical"
    );

    for (const pattern of complexPatterns.slice(0, 2)) {
      const sanitized = (pattern.pattern || "")
        .replace(/[^a-zA-Z0-9\s]/g, "_")
        .replace(/\s+/g, "_")
        .toUpperCase()
        .slice(0, 40);
      const safeName = sanitized || `PATTERN_${Date.now()}`;

      suggestions.push({
        priority: priority++,
        category: "Training",
        title: `Create guide for "${sanitizeDisplayString(pattern.pattern, 50)}"`,
        description: `Critical pattern with ${pattern.recurrences} recurrences needs dedicated guide`,
        action: `Create docs/agent_docs/${safeName}_GUIDE.md`,
        effort: "1-2 hours",
        impact: "High - addresses critical pattern gap",
        type: "training",
        patternName: pattern.pattern,
        suggestedPath: `docs/agent_docs/${safeName}_GUIDE.md`,
      });
    }

    return suggestions.slice(0, 10);
  }

  /**
   * Calculate summary metrics
   */
  calculateSummaryMetrics() {
    const trends = this.results.learningTrends;

    return {
      learningEffectiveness: trends.effectivenessRate.toFixed(1) + "%",
      patternsLearned: trends.learned,
      patternsAutomated: trends.automated,
      patternsFailing: trends.failed,
      patternsWeak: trends.weak,
      criticalPatternRate: trends.criticalRate.toFixed(1) + "%",
      totalDocumentedPatterns: this.documentedPatterns.length,
      totalAutomatedPatterns: this.automatedPatterns.length,
      automationCoverage:
        this.documentedPatterns.length > 0
          ? ((this.automatedPatterns.length / this.documentedPatterns.length) * 100).toFixed(1) +
            "%"
          : "N/A",
    };
  }

  /**
   * Output report based on format option
   */
  async outputReport() {
    if (this.options.detailed) {
      this.outputDetailed();
    } else {
      this.outputDashboard();
    }
  }

  /**
   * Output dashboard (default format)
   */
  outputDashboard() {
    const firstReview = this.reviews[0].number;
    const lastReview = this.reviews[this.reviews.length - 1].number;
    const summary = this.results.summary;
    const trends = this.results.learningTrends;

    console.log("╔════════════════════════════════════════════════════════════════════════╗");
    console.log("║            CLAUDE'S LEARNING EFFECTIVENESS DASHBOARD                  ║");
    console.log("╚════════════════════════════════════════════════════════════════════════╝\n");

    console.log(
      `📊 Analysis Period: Review #${firstReview} - #${lastReview} (${this.reviews.length} reviews)\n`
    );

    // Key metrics
    console.log("┌───────────────────────────────────────────────────────────────────────┐");
    console.log("│ KEY LEARNING METRICS                                                  │");
    console.log("├───────────────────────────────────────────────────────────────────────┤");
    console.log(`│ Learning Effectiveness:     ${summary.learningEffectiveness.padEnd(44)}│`);
    console.log(`│ Patterns Learned:           ${String(summary.patternsLearned).padEnd(44)}│`);
    console.log(`│ Patterns Automated:         ${String(summary.patternsAutomated).padEnd(44)}│`);
    console.log(`│ Patterns Failing:           ${String(summary.patternsFailing).padEnd(44)}│`);
    console.log(`│ Critical Pattern Success:   ${summary.criticalPatternRate.padEnd(44)}│`);
    console.log(`│ Automation Coverage:        ${summary.automationCoverage.padEnd(44)}│`);
    console.log("└───────────────────────────────────────────────────────────────────────┘\n");

    // Pattern Learning Status Table
    console.log("📈 PATTERN LEARNING STATUS\n");
    console.log(
      "┌──────────────────────────────────────────────┬────────────┬──────────┬────────┐"
    );
    console.log(
      "│ Pattern                                      │ Documented │ Recurred │ Status │"
    );
    console.log(
      "├──────────────────────────────────────────────┼────────────┼──────────┼────────┤"
    );

    const topPatterns = this.results.patternLearning.slice(0, 15);
    for (const p of topPatterns) {
      const name = sanitizeDisplayString(p.pattern, 42).padEnd(44);
      const doc = p.firstDocumented ? `#${p.firstDocumented}`.padStart(10) : "N/A".padStart(10);
      const rec = `${p.recurrences}x`.padStart(8);
      const status = `${p.statusEmoji}`.padStart(6);
      console.log(`│ ${name} │${doc} │${rec} │${status} │`);
    }
    console.log(
      "└──────────────────────────────────────────────┴────────────┴──────────┴────────┘\n"
    );

    // Status Legend
    console.log(
      "Legend: ✅ LEARNED (no recurrence) | 🔧 AUTOMATED | 🟡 WEAK (1-2 recurrences) | 🔴 FAILED (3+ recurrences)\n"
    );

    // Top Recommendations
    if (this.results.suggestions.length > 0) {
      console.log("🎯 TOP RECOMMENDED ACTIONS TO IMPROVE LEARNING:\n");

      for (let i = 0; i < Math.min(5, this.results.suggestions.length); i++) {
        const s = this.results.suggestions[i];
        console.log(`${i + 1}. [${s.category}] ${sanitizeDisplayString(s.title, 60)}`);
        console.log(`   ${sanitizeDisplayString(s.description, 80)}`);
        console.log(`   → ${sanitizeDisplayString(s.action, 80)}`);
        console.log(`   Effort: ${s.effort} | Impact: ${s.impact}\n`);
      }
    } else {
      console.log("✅ No high-priority learning improvements needed at this time.\n");
    }

    console.log("💡 Run with --detailed for full pattern breakdown");
    console.log("💡 Run with --all-archives to analyze historical patterns\n");
  }

  /**
   * Output detailed report
   */
  outputDetailed() {
    const firstReview = this.reviews[0].number;
    const lastReview = this.reviews[this.reviews.length - 1].number;
    const summary = this.results.summary;

    console.log("═".repeat(80));
    console.log("CLAUDE'S LEARNING EFFECTIVENESS - DETAILED REPORT");
    console.log("═".repeat(80) + "\n");

    console.log(
      `Analysis Period: Review #${firstReview} - #${lastReview} (${this.reviews.length} reviews)\n`
    );

    // 1. Summary Metrics
    console.log("📊 1. SUMMARY METRICS\n");
    console.log("┌────────────────────────────────┬─────────────────────────────────────────┐");
    console.log("│ Metric                         │ Value                                   │");
    console.log("├────────────────────────────────┼─────────────────────────────────────────┤");
    console.log(`│ Learning Effectiveness         │ ${summary.learningEffectiveness.padEnd(39)} │`);
    console.log(
      `│ Total Documented Patterns      │ ${String(summary.totalDocumentedPatterns).padEnd(39)} │`
    );
    console.log(
      `│ Total Automated Patterns       │ ${String(summary.totalAutomatedPatterns).padEnd(39)} │`
    );
    console.log(`│ Automation Coverage            │ ${summary.automationCoverage.padEnd(39)} │`);
    console.log(
      `│ Patterns Successfully Learned  │ ${String(summary.patternsLearned).padEnd(39)} │`
    );
    console.log(
      `│ Patterns Needing Automation    │ ${String(summary.patternsFailing).padEnd(39)} │`
    );
    console.log(`│ Critical Pattern Success Rate  │ ${summary.criticalPatternRate.padEnd(39)} │`);
    console.log("└────────────────────────────────┴─────────────────────────────────────────┘\n");

    // 2. Full Pattern Learning Status
    console.log("📈 2. COMPLETE PATTERN LEARNING STATUS\n");
    console.log(
      "┌────────────────────────────────────────────────┬──────────┬────────────┬──────────┬────────┬───────────┐"
    );
    console.log(
      "│ Pattern                                        │ Priority │ Documented │ Recurred │ Status │ Automated │"
    );
    console.log(
      "├────────────────────────────────────────────────┼──────────┼────────────┼──────────┼────────┼───────────┤"
    );

    for (const p of this.results.patternLearning) {
      const name = sanitizeDisplayString(p.pattern, 44).padEnd(46);
      const pri = (p.priority || "N/A").substring(0, 8).padEnd(8);
      const doc = p.firstDocumented ? `#${p.firstDocumented}`.padStart(10) : "N/A".padStart(10);
      const rec = `${p.recurrences}x`.padStart(8);
      const status = `${p.statusEmoji}`.padStart(6);
      const auto = p.isAutomated ? "Yes".padStart(9) : "No".padStart(9);
      console.log(`│ ${name} │ ${pri} │${doc} │${rec} │${status} │${auto} │`);
    }
    console.log(
      "└────────────────────────────────────────────────┴──────────┴────────────┴──────────┴────────┴───────────┘\n"
    );

    // 3. Automation Needs
    console.log("🔧 3. PATTERNS NEEDING AUTOMATION\n");
    const automationNeeds = this.results.automationNeeds || this.analyzeAutomationNeeds();

    if (automationNeeds.length > 0) {
      console.log("These patterns keep recurring and should be added to Pattern Checker:\n");
      console.log(
        "┌────────────────────────────────────────────────┬──────────┬────────────┬──────────┐"
      );
      console.log(
        "│ Pattern                                        │ Priority │ Recurred   │ Last     │"
      );
      console.log(
        "├────────────────────────────────────────────────┼──────────┼────────────┼──────────┤"
      );

      for (const need of automationNeeds) {
        const name = sanitizeDisplayString(need.pattern, 44).padEnd(46);
        const pri = (need.priority || "N/A").substring(0, 8).padEnd(8);
        const rec = `${need.recurrences}x`.padStart(10);
        const last = need.lastSeen ? `#${need.lastSeen}`.padStart(8) : "N/A".padStart(8);
        console.log(`│ ${name} │ ${pri} │${rec} │${last} │`);
      }
      console.log(
        "└────────────────────────────────────────────────┴──────────┴────────────┴──────────┘\n"
      );

      // Show implementation suggestions
      console.log("Implementation Examples:\n");
      for (const need of automationNeeds.slice(0, 3)) {
        const rec = need.recommendation;
        console.log(`  • ${sanitizeDisplayString(need.pattern, 50)}`);
        console.log(`    Pattern ID: ${rec.patternId}`);
        console.log(`    Priority: ${rec.priority} | Effort: ${rec.effort}\n`);
      }
    } else {
      console.log("  ✅ All recurring patterns are already automated\n");
    }

    // 4. Recurrence Details
    console.log("📋 4. RECURRENCE DETAILS\n");
    const recurrenceDetails = this.results.recurrenceDetails || this.analyzeRecurrenceDetails();

    if (recurrenceDetails.length > 0) {
      for (const r of recurrenceDetails.slice(0, 10)) {
        console.log(`  • ${sanitizeDisplayString(r.pattern, 60)} [${r.priority || "N/A"}]`);
        console.log(`    First documented: Review #${r.firstDocumented || "?"}`);
        console.log(
          `    Recurred ${r.recurrences} times: Reviews ${r.recurrenceReviews.join(", ")}`
        );
        console.log(`    Automated: ${r.isAutomated ? "Yes" : "No"}`);
        console.log(`    Diagnosis: ${r.diagnosis}\n`);
      }
    } else {
      console.log("  ✅ No patterns have recurred - excellent learning!\n");
    }

    // 5. Recommendations
    console.log("═".repeat(80));
    console.log("RECOMMENDATIONS TO IMPROVE CLAUDE'S LEARNING");
    console.log("═".repeat(80) + "\n");

    if (this.results.suggestions.length > 0) {
      for (const s of this.results.suggestions) {
        console.log(`${s.priority}. [${s.category}] ${sanitizeDisplayString(s.title, 60)}`);
        console.log(`   Description: ${sanitizeDisplayString(s.description, 70)}`);
        console.log(`   Action: ${sanitizeDisplayString(s.action, 70)}`);
        console.log(`   Effort: ${s.effort} | Impact: ${s.impact}\n`);
      }
    } else {
      console.log("✅ No immediate actions required - learning system is healthy\n");
    }
  }

  /**
   * Interactive suggestion handler
   */
  async interactiveSuggestionHandler() {
    console.log("\n🎯 INTERACTIVE SUGGESTION REVIEW\n");
    console.log("For each suggestion, choose:");
    console.log("  [A]pply - Apply changes and create commit");
    console.log("  [S]kip - Skip this suggestion");
    console.log("  [V]iew - View detailed analysis");
    console.log("  [D]efer - Add to TODO list for later");
    console.log("  [Q]uit - Exit interactive mode\n");

    const deferred = [];

    for (let i = 0; i < this.results.suggestions.length; i++) {
      const suggestion = this.results.suggestions[i];

      console.log(
        `\n[${i + 1}/${this.results.suggestions.length}] ${sanitizeDisplayString(suggestion.title, 60)}`
      );
      console.log(
        `Category: ${suggestion.category} | Effort: ${suggestion.effort} | Impact: ${suggestion.impact}`
      );

      const choice = await this.promptUser("\n[A]pply [S]kip [V]iew [D]efer [Q]uit: ");

      switch (choice.toLowerCase()) {
        case "a":
          console.log("⚠️  Auto-apply not implemented for this suggestion type");
          console.log(
            "   Please implement manually: " + sanitizeDisplayString(suggestion.action, 80)
          );
          break;
        case "s":
          console.log("⏭️  Skipped");
          break;
        case "v":
          console.log("\n" + "=".repeat(60));
          console.log(`SUGGESTION DETAILS: ${sanitizeDisplayString(suggestion.title, 50)}`);
          console.log("=".repeat(60));
          console.log(`\nCategory: ${suggestion.category}`);
          console.log(`Effort: ${suggestion.effort}`);
          console.log(`Impact: ${suggestion.impact}`);
          console.log(`\nDescription: ${sanitizeDisplayString(suggestion.description, 200)}`);
          console.log(`\nAction: ${sanitizeDisplayString(suggestion.action, 200)}`);
          console.log("=".repeat(60) + "\n");
          i--; // Re-ask
          break;
        case "d":
          deferred.push(suggestion);
          console.log("📝 Added to TODO list");
          break;
        case "q":
          console.log("\n👋 Exiting interactive mode...");
          i = this.results.suggestions.length;
          break;
        default:
          console.log("Invalid choice, please try again");
          i--;
      }
    }

    if (deferred.length > 0) {
      await this.saveTodoFile(deferred);
      console.log(`\n📝 ${deferred.length} suggestions saved to ${TODO_FILE}`);
    }
  }

  /**
   * Save deferred suggestions to TODO file
   */
  async saveTodoFile(deferred) {
    const now = new Date().toISOString().split("T")[0];
    const firstReview = this.reviews[0].number;
    const lastReview = this.reviews[this.reviews.length - 1].number;

    let content = `# Learning Effectiveness TODO

**Generated:** ${now}
**Review Range:** #${firstReview} - #${lastReview}
**Focus:** Improve Claude's learning from documented patterns

## Priority Actions

`;

    for (const item of deferred) {
      content += `- [ ] **[${escapeMd(item.category, 20)}]** ${escapeMd(item.title, 80)}\n`;
      content += `  - **Effort:** ${escapeMd(item.effort, 30)}\n`;
      content += `  - **Impact:** ${escapeMd(item.impact, 50)}\n`;
      content += `  - **Action:** ${escapeMd(item.action, 100)}\n`;
      content += `  - **Details:** ${escapeMd(item.description, 150)}\n\n`;
    }

    refuseSymlink(TODO_FILE);
    writeFileSync(TODO_FILE, content, { encoding: "utf-8", mode: 0o600 });
  }

  /**
   * Update metrics file with latest analysis
   */
  async updateMetrics() {
    const now = new Date().toISOString().split("T")[0];
    const firstReview = this.reviews[0].number;
    const lastReview = this.reviews[this.reviews.length - 1].number;
    const summary = this.results.summary;

    const content = `# Learning Effectiveness Metrics

**Last Updated:** ${now}

---

## Purpose

This document tracks Claude's learning effectiveness - whether documented patterns prevent recurring issues. It provides actionable metrics to guide automation priorities and documentation improvements.

**Auto-generated by:** \`scripts/analyze-learning-effectiveness.js\`
**Update frequency:** After consolidation (every 10 reviews) or manual analysis

---

## AI Instructions

This is a **Tier 2 metrics document** - reference during:

- **Post-consolidation**: Check if patterns are being learned
- **Session planning**: Prioritize automation for failing patterns
- **Pattern updates**: Validate that documentation improvements work

---

## Current Analysis

**Review Range:** #${firstReview} - #${lastReview} (${this.reviews.length} reviews)
**Analysis Date:** ${now}

### Key Metrics

| Metric                    | Value                                                           |
| ------------------------- | --------------------------------------------------------------- |
| Learning Effectiveness    | ${summary.learningEffectiveness}                                |
| Patterns Learned          | ${summary.patternsLearned}                                      |
| Patterns Automated        | ${summary.patternsAutomated}                                    |
| Patterns Failing          | ${summary.patternsFailing}                                      |
| Critical Pattern Success  | ${summary.criticalPatternRate}                                  |
| Automation Coverage       | ${summary.automationCoverage}                                   |
| Total Documented Patterns | ${summary.totalDocumentedPatterns}                              |
| Total Automated Patterns  | ${summary.totalAutomatedPatterns}                               |

### Top Recommended Actions

${this.results.suggestions
  .slice(0, 5)
  .map((s, i) => {
    const category = escapeMd(s.category, 20);
    const title = escapeMd(s.title, 80);
    const description = escapeMd(s.description, 150);
    const action = escapeMd(s.action, 150);
    return `${i + 1}. **[${category}]** ${title}
   - ${description}
   - Action: ${action}`;
  })
  .join("\n\n")}

---

## Pattern Learning Status Summary

| Status     | Count | Description                              |
| ---------- | ----- | ---------------------------------------- |
| ✅ LEARNED | ${summary.patternsLearned}     | Pattern never recurred after documentation |
| 🔧 AUTOMATED | ${summary.patternsAutomated}   | Pattern recurred but now enforced by tooling |
| 🟡 WEAK    | ${summary.patternsWeak}     | Pattern recurred 1-2 times - needs attention |
| 🔴 FAILED  | ${summary.patternsFailing}     | Pattern recurred 3+ times - needs automation |

---

## Version History

| Version | Date       | Description                              |
| ------- | ---------- | ---------------------------------------- |
| 2.0     | ${now}     | Rewritten to focus on Claude's learning effectiveness |
`;

    refuseSymlink(METRICS_FILE);
    writeFileSync(METRICS_FILE, content, { encoding: "utf-8", mode: 0o600 });
    console.log(`\n✅ Metrics updated: ${METRICS_FILE}`);
  }

  /**
   * Helper: Prompt user for input
   */
  async promptUser(question) {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }
}

/**
 * Parse command-line arguments
 */
function parseArgs(args) {
  const options = {
    sinceReview: 1,
    format: "dashboard",
    auto: false,
    detailed: false,
    inputFile: null,
    allArchives: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--since-review") {
      const next = args[++i];
      if (!next || next.startsWith("--")) {
        throw new Error('Missing value for --since-review (e.g. "--since-review 150")');
      }
      const reviewNum = Number.parseInt(next, 10);
      if (Number.isNaN(reviewNum) || reviewNum < 1) {
        throw new Error(`Invalid --since-review value: "${next}" (must be a positive integer)`);
      }
      options.sinceReview = reviewNum;
    } else if (arg === "--auto") {
      options.auto = true;
    } else if (arg === "--detailed") {
      options.detailed = true;
    } else if (arg === "--file") {
      const next = args[++i];
      if (!next || next.startsWith("--")) {
        throw new Error('Missing value for --file (e.g. "--file docs/archive/REVIEWS_180-201.md")');
      }
      options.inputFile = next;
    } else if (arg === "--all-archives") {
      options.allArchives = true;
    }
  }

  return options;
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  const analyzer = new LearningEffectivenessAnalyzer(options);
  await analyzer.analyze();
}

// Run if called directly
if (require.main === module) {
  main().catch((err) => {
    console.error("❌ Fatal error:", sanitizeError(err));
    process.exit(2);
  });
}

module.exports = { LearningEffectivenessAnalyzer };
