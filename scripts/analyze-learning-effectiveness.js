#!/usr/bin/env node
/* global __dirname */
/**
 * Learning Effectiveness Analyzer
 *
 * Measures if documented patterns prevent recurring issues and identifies gaps.
 *
 * This tool analyzes the AI_REVIEW_LEARNINGS_LOG.md to:
 * - Quantify whether documented patterns prevent recurring issues
 * - Identify automation gaps (patterns that should be enforced by tooling)
 * - Detect process weaknesses (where we keep making same mistakes)
 * - Optimize tool usage (ROI analysis: signal vs. noise)
 * - Guide training needs (missing skills/guides)
 *
 * Usage:
 *   npm run learning:analyze                           # Dashboard + interactive
 *   npm run learning:analyze -- --detailed             # Full 10-category report
 *   npm run learning:analyze -- --category automation  # Single category
 *   npm run learning:analyze -- --since-review 150     # Specific range
 *   npm run learning:analyze -- --auto                 # Non-interactive (for hooks)
 *   npm run learning:analyze -- --file path/to/file   # Analyze specific file (e.g. archive)
 *   npm run learning:analyze -- --all-archives        # Analyze ALL archive files combined
 *
 * Exit codes: 0 = success, 1 = errors found, 2 = fatal error
 */

const { readFileSync, writeFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { createInterface } = require("node:readline");
const { execSync, execFileSync } = require("node:child_process");

const ROOT = join(__dirname, "..");

const LEARNINGS_LOG = join(ROOT, "docs", "AI_REVIEW_LEARNINGS_LOG.md");
const CODE_PATTERNS = join(ROOT, "docs", "agent_docs", "CODE_PATTERNS.md");
const PATTERN_CHECKER = join(ROOT, "scripts", "check-pattern-compliance.js");
const METRICS_FILE = join(ROOT, "docs", "LEARNING_METRICS.md");
const TODO_FILE = join(ROOT, "docs", "LEARNING_TODO.md");
const SKIPPED_FILE = join(ROOT, "docs", "LEARNING_SKIPPED.md");

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
 * Sanitize display strings from review content (Review #200 - structured logging)
 * Prevents logging sensitive data from pattern names, suggestions, etc.
 */
function sanitizeDisplayString(str, maxLength = 100) {
  if (!str) return "";

  const sanitized = String(str)
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, "[CODE]")
    .replace(/`[^`]+`/g, "[CODE]")
    // Remove file paths (absolute paths)
    .replace(/C:\\Users\\[^\s]+/gi, "[PATH]")
    .replace(/\/home\/[^\s]+/gi, "[PATH]")
    .replace(/\/Users\/[^\s]+/gi, "[PATH]")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();

  // Review #200: Qodo - Fix truncation logic to check sanitized length
  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) + "..." : sanitized;
}

/**
 * Escape Markdown metacharacters to prevent injection (Review #200 R5)
 * @param {string} str - Input string
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized and escaped string
 */
function escapeMd(str, maxLength = 100) {
  const sanitized = sanitizeDisplayString(str, maxLength);
  // Review #200 R6: Escape all Markdown metacharacters including backslash
  return sanitized.replace(/[\\[\]()_*`#>!-]/g, "\\$&");
}

/**
 * Check if path is a symlink and refuse to write through it (Review #200 R5)
 * @param {string} filePath - Path to check
 * @throws {Error} If path is a symlink
 */
function refuseSymlink(filePath) {
  const { lstatSync } = require("node:fs");
  const path = require("node:path");

  // Review #200 R6: Check target AND all parent directories for symlinks
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

class LearningEffectivenessAnalyzer {
  constructor(options = {}) {
    this.options = {
      sinceReview: options.sinceReview || 1,
      category: options.category || null,
      format: options.format || "dashboard",
      auto: options.auto || false,
      detailed: options.detailed || false,
      outputFile: options.outputFile || null,
      inputFile: options.inputFile || null,
      allArchives: options.allArchives || false,
    };

    this.reviews = [];
    this.codePatterns = [];
    this.automatedPatterns = [];
    this.results = {};
  }

  /**
   * Main entry point - runs full analysis pipeline
   */
  async analyze() {
    try {
      console.log("📊 Learning Effectiveness Analyzer\n");

      await this.loadReviews();
      await this.loadCodePatterns();
      await this.loadAutomatedPatterns();

      console.log(`📈 Analyzing ${this.reviews.length} reviews...\n`);

      this.results = {
        automationGaps: this.analyzeAutomationGaps(),
        documentationGaps: this.analyzeDocumentationGaps(),
        recurringIssues: this.analyzeRecurringIssues(),
        processMetrics: this.analyzeProcessMetrics(),
        toolEffectiveness: this.analyzeToolEffectiveness(),
        categoryBalance: this.analyzeCategoryBalance(),
        falsePositives: this.analyzeFalsePositives(),
        complexityHotspots: this.analyzeComplexityHotspots(),
        consolidationQuality: this.analyzeConsolidationQuality(),
        trainingGaps: this.analyzeTrainingGaps(),
      };

      this.results.suggestions = this.generateSuggestions();

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
   * Load and parse reviews from AI_REVIEW_LEARNINGS_LOG.md, custom file, or all archives
   */
  async loadReviews() {
    let content = "";

    if (this.options.allArchives) {
      // Scan all archive files in docs/archive/
      const archiveDir = join(ROOT, "docs", "archive");
      if (!existsSync(archiveDir)) {
        throw new Error("Archive directory not found: docs/archive/");
      }

      const { readdirSync } = require("node:fs");
      const archiveFiles = readdirSync(archiveDir)
        .filter((f) => f.startsWith("REVIEWS_") && f.endsWith(".md"))
        .sort(); // Sort for consistent ordering

      if (archiveFiles.length === 0) {
        throw new Error("No REVIEWS_*.md files found in docs/archive/");
      }

      console.log(`📂 Scanning ${archiveFiles.length} archive files...`);

      for (const file of archiveFiles) {
        const filePath = join(archiveDir, file);
        try {
          const fileContent = readFileSync(filePath, "utf-8");
          content += "\n" + fileContent;
          console.log(`   ✓ ${file}`);
        } catch (error) {
          console.warn(`   ⚠ Failed to read ${file}: ${sanitizeError(error)}`);
        }
      }
    } else {
      // Single file mode (--file or default)
      const inputFile = this.options.inputFile ? join(ROOT, this.options.inputFile) : LEARNINGS_LOG;

      if (!existsSync(inputFile)) {
        const displayPath = this.options.inputFile || "docs/AI_REVIEW_LEARNINGS_LOG.md";
        throw new Error(`Input file not found: ${displayPath}`);
      }

      try {
        content = readFileSync(inputFile, "utf-8");
      } catch (error) {
        throw new Error(`Failed to read input file: ${sanitizeError(error)}`);
      }
    }

    const lines = content.split("\n");

    let currentReview = null;
    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match review headers: #### Review #123: Title
      const reviewMatch = line.match(/^####\s+Review\s+#(\d+)/);
      if (reviewMatch) {
        if (currentReview && currentReview.number >= this.options.sinceReview) {
          this.reviews.push(currentReview);
        }

        currentReview = {
          number: parseInt(reviewMatch[1]),
          title: line.replace(/^####\s+Review\s+#\d+\s*:?\s*/, ""),
          tool: null,
          tools: [], // Multiple tools possible
          findings: [],
          patterns: [],
          severity: null,
          severityCounts: { critical: 0, major: 0, minor: 0, trivial: 0 },
          category: null,
          categories: [], // Multiple categories possible
          falsePositive: false,
          resolution: { fixed: 0, deferred: 0, rejected: 0 },
          sections: {},
          rawLines: [],
        };
        currentSection = null;
        continue;
      }

      if (!currentReview) continue;

      // Store raw lines for detailed parsing
      currentReview.rawLines.push(line);

      // Extract Source/Tool - parse "**Source:** Qodo + SonarCloud + CI"
      if (line.startsWith("**Source:**")) {
        const sourceText = line.replace("**Source:**", "").trim();
        // Extract tool names
        if (sourceText.includes("Qodo")) currentReview.tools.push("Qodo");
        if (sourceText.includes("SonarCloud") || sourceText.includes("Sonar"))
          currentReview.tools.push("SonarCloud");
        if (sourceText.includes("CodeRabbit")) currentReview.tools.push("CodeRabbit");
        if (sourceText.includes("CI") || sourceText.includes("Pattern"))
          currentReview.tools.push("Pattern Checker");
        if (sourceText.includes("Manual") || sourceText.includes("Session"))
          currentReview.tools.push("Manual");
        currentReview.tool = currentReview.tools[0] || "Unknown";
      }

      // Extract severity counts from "**Suggestions:** 8 total (Critical: 1, Major: 2, Minor: 3, Trivial: 2)"
      const suggestionsMatch = line.match(
        /Critical:\s*(\d+)|Major:\s*(\d+)|Minor:\s*(\d+)|Trivial:\s*(\d+)/gi
      );
      if (suggestionsMatch) {
        for (const match of suggestionsMatch) {
          if (/critical/i.test(match))
            currentReview.severityCounts.critical += parseInt(match.match(/\d+/)[0]);
          if (/major/i.test(match))
            currentReview.severityCounts.major += parseInt(match.match(/\d+/)[0]);
          if (/minor/i.test(match))
            currentReview.severityCounts.minor += parseInt(match.match(/\d+/)[0]);
          if (/trivial/i.test(match))
            currentReview.severityCounts.trivial += parseInt(match.match(/\d+/)[0]);
        }
      }

      // Extract category from context or title
      const lowerLine = line.toLowerCase();
      if (
        lowerLine.includes("security") ||
        lowerLine.includes("vulnerability") ||
        lowerLine.includes("injection")
      ) {
        if (!currentReview.categories.includes("Security"))
          currentReview.categories.push("Security");
      }
      if (
        lowerLine.includes("performance") ||
        lowerLine.includes("optimization") ||
        lowerLine.includes("speed")
      ) {
        if (!currentReview.categories.includes("Performance"))
          currentReview.categories.push("Performance");
      }
      if (
        lowerLine.includes("documentation") ||
        lowerLine.includes("docs") ||
        lowerLine.includes("readme")
      ) {
        if (!currentReview.categories.includes("Documentation"))
          currentReview.categories.push("Documentation");
      }
      if (
        lowerLine.includes("test") ||
        lowerLine.includes("quality") ||
        lowerLine.includes("lint")
      ) {
        if (!currentReview.categories.includes("Quality")) currentReview.categories.push("Quality");
      }
      if (
        lowerLine.includes("process") ||
        lowerLine.includes("workflow") ||
        lowerLine.includes("ci/cd")
      ) {
        if (!currentReview.categories.includes("Process")) currentReview.categories.push("Process");
      }
      currentReview.category = currentReview.categories[0] || "Uncategorized";

      // Extract resolution counts from "**Fixed:** X items" or "- **Fixed:** X"
      const fixedMatch = line.match(/\*\*Fixed:?\*\*:?\s*(\d+)/i);
      if (fixedMatch) currentReview.resolution.fixed += parseInt(fixedMatch[1]);
      const deferredMatch = line.match(/\*\*Deferred:?\*\*:?\s*(\d+)/i);
      if (deferredMatch) currentReview.resolution.deferred += parseInt(deferredMatch[1]);
      const rejectedMatch = line.match(/\*\*Rejected:?\*\*:?\s*(\d+)|false positive/i);
      if (rejectedMatch) {
        if (rejectedMatch[1]) currentReview.resolution.rejected += parseInt(rejectedMatch[1]);
        else currentReview.falsePositive = true;
      }

      // Track sections for detailed analysis
      if (line.startsWith("### ") || line.match(/^\*\*[A-Z][a-z]+.*:\*\*/)) {
        currentSection = line
          .replace(/^###\s+/, "")
          .replace(/\*\*/g, "")
          .replace(/:$/, "")
          .trim();
        currentReview.sections[currentSection] = [];
      } else if (currentSection && line.trim()) {
        currentReview.sections[currentSection].push(line);
      }

      // Extract patterns mentioned - multiple formats
      const patternMatch = line.match(/Pattern:\s*(.+)/i);
      if (patternMatch) {
        currentReview.patterns.push(patternMatch[1].trim());
      }
      // Also extract from numbered pattern lists "1. **Pattern Name**"
      const numberedPattern = line.match(/^\d+\.\s+\*\*([^*]+)\*\*/);
      if (numberedPattern && currentSection && /pattern/i.test(currentSection)) {
        currentReview.patterns.push(numberedPattern[1].trim());
      }

      // Extract findings (bullet points)
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        currentReview.findings.push(line.trim().substring(2));
      }

      // Extract table rows for issue counts
      const tableRow = line.match(/^\|\s*\d+\s*\|.*\|(.*Critical|Major|Minor|Trivial).*\|/i);
      if (tableRow) {
        const sev = tableRow[1].toLowerCase();
        if (sev.includes("critical")) currentReview.severityCounts.critical++;
        if (sev.includes("major")) currentReview.severityCounts.major++;
        if (sev.includes("minor")) currentReview.severityCounts.minor++;
        if (sev.includes("trivial")) currentReview.severityCounts.trivial++;
      }
    }

    // Add last review
    if (currentReview && currentReview.number >= this.options.sinceReview) {
      this.reviews.push(currentReview);
    }

    if (this.reviews.length === 0) {
      throw new Error(`No reviews found in range (since #${this.options.sinceReview})`);
    }

    // Review #200: Sort reviews by number for correct chronological order
    this.reviews.sort((a, b) => a.number - b.number);

    console.log(
      `✅ Loaded ${this.reviews.length} reviews (#${this.reviews[0].number} - #${this.reviews[this.reviews.length - 1].number})`
    );
  }

  /**
   * Load documented patterns from CODE_PATTERNS.md
   */
  async loadCodePatterns() {
    if (!existsSync(CODE_PATTERNS)) {
      console.warn("⚠️  CODE_PATTERNS.md not found, skipping pattern analysis");
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

    let currentPattern = null;
    let currentPriority = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match priority sections
      if (line.match(/^##\s+[🔴🟡⚪]/u)) {
        currentPriority = line.includes("🔴")
          ? "Critical"
          : line.includes("🟡")
            ? "Important"
            : "Edge case";
      }

      // Match pattern headers
      if (line.startsWith("### ")) {
        if (currentPattern) {
          this.codePatterns.push(currentPattern);
        }

        currentPattern = {
          name: line.replace(/^###\s+\d+\.\s*/, "").trim(),
          priority: currentPriority,
          description: "",
          sourceReviews: [],
        };
      }

      // Extract source reviews
      const reviewMatch = line.match(/Review #(\d+)/g);
      if (reviewMatch && currentPattern) {
        reviewMatch.forEach((match) => {
          const num = parseInt(match.replace("Review #", ""));
          if (!currentPattern.sourceReviews.includes(num)) {
            currentPattern.sourceReviews.push(num);
          }
        });
      }
    }

    if (currentPattern) {
      this.codePatterns.push(currentPattern);
    }

    console.log(`✅ Loaded ${this.codePatterns.length} documented patterns`);
  }

  /**
   * Load automated patterns from check-pattern-compliance.js
   */
  async loadAutomatedPatterns() {
    if (!existsSync(PATTERN_CHECKER)) {
      console.warn("⚠️  Pattern checker not found, skipping automation analysis");
      return;
    }

    let content;
    try {
      content = readFileSync(PATTERN_CHECKER, "utf-8");
    } catch (error) {
      console.warn(`⚠️  Failed to read pattern checker: ${sanitizeError(error)}`);
      return;
    }

    // Extract ANTI_PATTERNS array
    const match = content.match(/const ANTI_PATTERNS = \[([\s\S]*?)\];/);
    if (!match) {
      console.warn("⚠️  Could not parse ANTI_PATTERNS from checker");
      return;
    }

    // Parse pattern objects (simplified - just extract IDs and reviews)
    const patternsText = match[1];
    const patternBlocks = patternsText.split(/\{\s*id:/g).slice(1);

    for (const block of patternBlocks) {
      const idMatch = block.match(/["']([^"']+)["']/);
      const reviewMatch = block.match(/review:\s*["']([^"']+)["']/);

      if (idMatch) {
        this.automatedPatterns.push({
          id: idMatch[1],
          reviews: reviewMatch
            ? reviewMatch[1].split(",").map((r) => parseInt(r.replace(/[^0-9]/g, "")))
            : [],
        });
      }
    }

    console.log(`✅ Loaded ${this.automatedPatterns.length} automated patterns`);
  }

  /**
   * ANALYSIS CATEGORY 1: Automation Gaps
   * Identifies patterns that appear frequently but aren't automated yet
   */
  analyzeAutomationGaps() {
    const gaps = [];
    const patternFrequency = new Map();

    // Count pattern occurrences across reviews
    for (const review of this.reviews) {
      for (const pattern of review.patterns) {
        patternFrequency.set(pattern, (patternFrequency.get(pattern) || 0) + 1);
      }
    }

    // Find patterns with high frequency that aren't automated
    for (const [pattern, count] of patternFrequency.entries()) {
      if (count >= 3) {
        // Threshold: appears 3+ times
        const isAutomated = this.automatedPatterns.some((ap) =>
          pattern.toLowerCase().includes(ap.id.toLowerCase())
        );

        if (!isAutomated) {
          gaps.push({
            pattern,
            occurrences: count,
            roi: count > 10 ? "High" : count > 5 ? "Medium" : "Low",
            reviews: this.reviews.filter((r) => r.patterns.includes(pattern)).map((r) => r.number),
          });
        }
      }
    }

    return gaps.sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * ANALYSIS CATEGORY 2: Documentation Gaps
   * Finds patterns mentioned in reviews but not in CODE_PATTERNS.md
   */
  analyzeDocumentationGaps() {
    const gaps = [];
    const documentedPatternNames = new Set(this.codePatterns.map((p) => p.name.toLowerCase()));

    const patternMentions = new Map();

    for (const review of this.reviews) {
      for (const pattern of review.patterns) {
        const normalized = pattern.toLowerCase();

        // Check if documented
        let isDocumented = false;
        for (const docPattern of documentedPatternNames) {
          if (normalized.includes(docPattern) || docPattern.includes(normalized)) {
            isDocumented = true;
            break;
          }
        }

        if (!isDocumented) {
          patternMentions.set(pattern, (patternMentions.get(pattern) || 0) + 1);
        }
      }
    }

    for (const [pattern, count] of patternMentions.entries()) {
      if (count >= 2) {
        // Threshold: mentioned 2+ times
        gaps.push({ pattern, occurrences: count });
      }
    }

    return gaps.sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * ANALYSIS CATEGORY 3: Recurring Issues
   * Detects patterns that keep appearing despite documentation
   */
  analyzeRecurringIssues() {
    const recurring = [];

    for (const codePattern of this.codePatterns) {
      const sourceReviews = codePattern.sourceReviews;
      if (sourceReviews.length === 0) continue;

      const firstMention = Math.min(...sourceReviews);
      const lastMention = Math.max(...sourceReviews);

      // Check if pattern appeared again after 10+ reviews from first mention
      if (lastMention - firstMention >= 10) {
        const occurrencesSinceDoc = sourceReviews.filter((r) => r > firstMention + 10).length;

        if (occurrencesSinceDoc > 0) {
          recurring.push({
            pattern: codePattern.name,
            priority: codePattern.priority,
            firstMention,
            lastMention,
            totalOccurrences: sourceReviews.length,
            occurrencesSinceDoc,
            learningEffectiveness: Math.max(
              0,
              100 - (occurrencesSinceDoc / sourceReviews.length) * 100
            ),
          });
        }
      }
    }

    return recurring.sort((a, b) => b.occurrencesSinceDoc - a.occurrencesSinceDoc);
  }

  /**
   * ANALYSIS CATEGORY 4: Process Metrics
   * Review cadence, severity distribution, resolution time, trends
   */
  analyzeProcessMetrics() {
    // Aggregate severity counts from parsed data
    const severityCounts = { Critical: 0, Major: 0, Minor: 0, Trivial: 0 };
    const categoryCounts = {};
    const toolCounts = {};
    let totalFixed = 0;
    let totalDeferred = 0;
    let totalRejected = 0;

    for (const review of this.reviews) {
      // Aggregate severity from parsed counts
      severityCounts.Critical += review.severityCounts.critical;
      severityCounts.Major += review.severityCounts.major;
      severityCounts.Minor += review.severityCounts.minor;
      severityCounts.Trivial += review.severityCounts.trivial;

      // Aggregate categories
      for (const cat of review.categories) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
      if (review.categories.length === 0 && review.category) {
        categoryCounts[review.category] = (categoryCounts[review.category] || 0) + 1;
      }

      // Aggregate tools
      for (const tool of review.tools) {
        toolCounts[tool] = (toolCounts[tool] || 0) + 1;
      }
      if (review.tools.length === 0 && review.tool) {
        toolCounts[review.tool] = (toolCounts[review.tool] || 0) + 1;
      }

      // Resolution stats
      totalFixed += review.resolution.fixed;
      totalDeferred += review.resolution.deferred;
      totalRejected += review.resolution.rejected;
    }

    const avgPatternsPerReview =
      this.reviews.reduce((sum, r) => sum + r.patterns.length, 0) / this.reviews.length;

    const totalFindings =
      severityCounts.Critical +
      severityCounts.Major +
      severityCounts.Minor +
      severityCounts.Trivial;

    // Calculate trends (split reviews into thirds)
    const third = Math.floor(this.reviews.length / 3);
    const trends = {
      early: { critical: 0, major: 0, total: 0 },
      middle: { critical: 0, major: 0, total: 0 },
      recent: { critical: 0, major: 0, total: 0 },
    };

    this.reviews.forEach((review, i) => {
      const period = i < third ? "early" : i < third * 2 ? "middle" : "recent";
      trends[period].critical += review.severityCounts.critical;
      trends[period].major += review.severityCounts.major;
      trends[period].total++;
    });

    return {
      totalReviews: this.reviews.length,
      totalFindings,
      severityDistribution: severityCounts,
      categoryDistribution: categoryCounts,
      toolDistribution: toolCounts,
      avgPatternsPerReview: avgPatternsPerReview.toFixed(2),
      resolution: {
        fixed: totalFixed,
        deferred: totalDeferred,
        rejected: totalRejected,
        fixRate: totalFindings > 0 ? ((totalFixed / totalFindings) * 100).toFixed(1) + "%" : "N/A",
      },
      trends,
      criticalTrend:
        trends.recent.total > 0 && trends.early.total > 0
          ? trends.recent.critical / trends.recent.total >
            trends.early.critical / trends.early.total
            ? "📈 Increasing"
            : trends.recent.critical / trends.recent.total <
                trends.early.critical / trends.early.total
              ? "📉 Decreasing"
              : "➡️ Stable"
          : "N/A",
    };
  }

  /**
   * ANALYSIS CATEGORY 5: Tool Effectiveness
   * Signal-to-noise ratio, unique findings, false positive rate, overlap detection
   */
  analyzeToolEffectiveness() {
    const toolStats = {};
    const allPatterns = new Set();
    const patternsByTool = {};

    // Collect stats per tool (including multi-tool reviews)
    for (const review of this.reviews) {
      const tools = review.tools.length > 0 ? review.tools : [review.tool || "Unknown"];

      for (const tool of tools) {
        if (!toolStats[tool]) {
          toolStats[tool] = {
            reviews: 0,
            critical: 0,
            major: 0,
            minor: 0,
            trivial: 0,
            falsePositives: 0,
            patterns: new Set(),
            fixed: 0,
            deferred: 0,
          };
          patternsByTool[tool] = new Set();
        }

        toolStats[tool].reviews++;
        toolStats[tool].critical += review.severityCounts.critical;
        toolStats[tool].major += review.severityCounts.major;
        toolStats[tool].minor += review.severityCounts.minor;
        toolStats[tool].trivial += review.severityCounts.trivial;
        toolStats[tool].fixed += review.resolution.fixed;
        toolStats[tool].deferred += review.resolution.deferred;

        if (review.falsePositive) {
          toolStats[tool].falsePositives++;
        }

        review.patterns.forEach((p) => {
          toolStats[tool].patterns.add(p);
          patternsByTool[tool].add(p);
          allPatterns.add(p);
        });
      }
    }

    // Calculate overlap between tools
    const results = [];
    for (const [tool, stats] of Object.entries(toolStats)) {
      const totalFindings = stats.critical + stats.major + stats.minor + stats.trivial;
      const uniquePatterns = stats.patterns.size;

      // Calculate overlap: patterns found by this tool that were also found by others
      let overlapCount = 0;
      for (const pattern of stats.patterns) {
        let foundByOthers = false;
        for (const [otherTool, otherPatterns] of Object.entries(patternsByTool)) {
          if (otherTool !== tool && otherPatterns.has(pattern)) {
            foundByOthers = true;
            break;
          }
        }
        if (foundByOthers) overlapCount++;
      }

      const uniqueFindings =
        uniquePatterns > 0 ? ((uniquePatterns - overlapCount) / uniquePatterns) * 100 : 0;
      const overlapRate = uniquePatterns > 0 ? (overlapCount / uniquePatterns) * 100 : 0;
      const fpRate = stats.reviews > 0 ? (stats.falsePositives / stats.reviews) * 100 : 0;
      const signalToNoise = fpRate > 0 ? (100 - fpRate) / fpRate : 99;

      results.push({
        tool,
        reviews: stats.reviews,
        totalFindings,
        critical: stats.critical,
        major: stats.major,
        minor: stats.minor,
        trivial: stats.trivial,
        uniquePatterns,
        uniqueFindings: uniqueFindings.toFixed(0) + "%",
        overlapRate: overlapRate.toFixed(0) + "%",
        falsePositives: stats.falsePositives,
        falsePositiveRate: fpRate.toFixed(1) + "%",
        signalToNoise: signalToNoise > 99 ? "99:1" : signalToNoise.toFixed(1) + ":1",
        fixed: stats.fixed,
        deferred: stats.deferred,
        actionableRate:
          totalFindings > 0 ? ((stats.fixed / totalFindings) * 100).toFixed(0) + "%" : "N/A",
      });
    }

    return results.sort((a, b) => b.totalFindings - a.totalFindings);
  }

  /**
   * ANALYSIS CATEGORY 6: Category Balance
   * Distribution across Security/Quality/Performance/Docs/Process
   */
  analyzeCategoryBalance() {
    const categories = {};

    for (const review of this.reviews) {
      if (!review.category) continue;
      categories[review.category] = (categories[review.category] || 0) + 1;
    }

    const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
    const distribution = {};

    for (const [category, count] of Object.entries(categories)) {
      distribution[category] = {
        count,
        percentage: ((count / total) * 100).toFixed(1) + "%",
      };
    }

    return distribution;
  }

  /**
   * ANALYSIS CATEGORY 7: False Positive Patterns
   * Tools/patterns with high false positive rate
   */
  analyzeFalsePositives() {
    const toolFPs = new Map();

    for (const review of this.reviews) {
      if (!review.falsePositive || !review.tool) continue;

      if (!toolFPs.has(review.tool)) {
        toolFPs.set(review.tool, []);
      }

      toolFPs.get(review.tool).push({
        reviewNumber: review.number,
        patterns: review.patterns,
      });
    }

    const results = [];
    for (const [tool, fps] of toolFPs.entries()) {
      results.push({
        tool,
        count: fps.length,
        examples: fps.slice(0, 3),
      });
    }

    return results.sort((a, b) => b.count - a.count);
  }

  /**
   * ANALYSIS CATEGORY 8: Complexity Hotspots
   * Files that appear in multiple reviews (need refactoring)
   */
  analyzeComplexityHotspots() {
    const fileMentions = new Map();

    for (const review of this.reviews) {
      for (const finding of review.findings) {
        // Extract file paths (simplified - looks for common patterns)
        // Review #200: SonarCloud - Fix unsafe regex to prevent ReDoS
        const fileMatches = finding.match(/[^\s]+\.(js|ts|jsx|tsx|md|json|sh|yml|yaml)\b/g);
        if (fileMatches) {
          for (const file of fileMatches) {
            fileMentions.set(file, (fileMentions.get(file) || 0) + 1);
          }
        }
      }
    }

    const hotspots = [];
    for (const [file, count] of fileMentions.entries()) {
      if (count >= 3) {
        hotspots.push({ file, mentions: count });
      }
    }

    return hotspots.sort((a, b) => b.mentions - a.mentions);
  }

  /**
   * ANALYSIS CATEGORY 9: Consolidation Quality
   * Pattern extraction rate, consolidation lag, coverage
   */
  analyzeConsolidationQuality() {
    const totalReviews = this.reviews.length;
    const reviewsWithPatterns = this.reviews.filter((r) => r.patterns.length > 0).length;
    const totalPatterns = this.reviews.reduce((sum, r) => sum + r.patterns.length, 0);

    // Check for consolidation lag (reviews without patterns = not consolidated yet)
    const unconsolidatedReviews = this.reviews.filter((r) => r.patterns.length === 0);

    return {
      patternExtractionRate: (totalPatterns / totalReviews).toFixed(2),
      coveragePercentage: ((reviewsWithPatterns / totalReviews) * 100).toFixed(1) + "%",
      totalPatternsExtracted: totalPatterns,
      unconsolidatedReviews: unconsolidatedReviews.length,
      health: unconsolidatedReviews.length < totalReviews * 0.1 ? "Good" : "Needs Attention",
    };
  }

  /**
   * ANALYSIS CATEGORY 10: Training Gaps
   * Missing guides/skills based on recurring issues
   */
  analyzeTrainingGaps() {
    const gaps = [];

    // Analyze recurring issues for training opportunities
    const recurring = this.analyzeRecurringIssues();

    for (const issue of recurring) {
      if (issue.occurrencesSinceDoc >= 3) {
        // Review #200: Security - Sanitize pattern name to prevent path traversal and git option injection
        const safeBase = issue.pattern
          .replace(/[/\\]/g, "_") // Remove path separators
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_-]/g, "") // Remove special chars
          .replace(/^-+/, "") // Review #200 R4: Strip leading dashes to prevent git option injection
          .toUpperCase()
          .slice(0, 60); // Review #200 R5: Length limit to prevent long filenames

        // Review #200 R5: Fallback for empty names
        const safeName = safeBase || "UNNAMED_PATTERN";

        gaps.push({
          topic: issue.pattern,
          occurrences: issue.occurrencesSinceDoc,
          suggestedDoc: `docs/agent_docs/${safeName}_GUIDE.md`,
          priority: issue.priority,
        });
      }
    }

    return gaps;
  }

  /**
   * Generate actionable suggestions from all analysis categories
   */
  generateSuggestions() {
    const suggestions = [];
    let priority = 1;

    // Automation gaps (top 5)
    const automationGaps = this.results.automationGaps.slice(0, 5);
    for (const gap of automationGaps) {
      if (gap.roi === "High") {
        suggestions.push({
          priority: priority++,
          category: "Automation",
          title: `Automate "${gap.pattern}" pattern`,
          description: `This pattern appears in ${gap.occurrences} reviews (${gap.reviews.join(", ")})`,
          effort: "30-60 minutes",
          impact: gap.roi,
          action: "Add to check-pattern-compliance.js",
          type: "pattern-check",
          pattern: gap.pattern,
        });
      }
    }

    // Recurring issues (learning breakdown)
    const recurring = this.results.recurringIssues.slice(0, 3);
    for (const issue of recurring) {
      if (issue.learningEffectiveness < 70) {
        suggestions.push({
          priority: priority++,
          category: "Learning",
          title: `Address recurring "${issue.pattern}" issue`,
          description: `Pattern documented in #${issue.firstMention} but appeared ${issue.occurrencesSinceDoc} more times`,
          effort: "1-2 hours",
          impact: "High",
          action: "Review documentation clarity, consider automation",
        });
      }
    }

    // Tool effectiveness (remove low-value tools)
    const lowValueTools = this.results.toolEffectiveness.filter(
      (t) => parseFloat(t.falsePositiveRate) > 30 || t.signalToNoise < 0.5
    );
    for (const tool of lowValueTools.slice(0, 2)) {
      suggestions.push({
        priority: priority++,
        category: "Tool",
        title: `Reconfigure or remove "${tool.tool}"`,
        description: `${tool.falsePositiveRate} false positive rate, ${tool.uniquePatterns} unique patterns`,
        effort: "15-30 minutes",
        impact: "Medium",
        action: "Review tool configuration or remove if low ROI",
      });
    }

    // Training gaps (top 3)
    const trainingGaps = this.results.trainingGaps.slice(0, 3);
    for (const gap of trainingGaps) {
      suggestions.push({
        priority: priority++,
        category: "Training",
        title: `Create guide for "${gap.topic}"`,
        description: `Recurring ${gap.occurrences} times after documentation`,
        effort: "2-3 hours",
        impact: gap.priority === "Critical" ? "High" : "Medium",
        action: `Create ${gap.suggestedDoc}`,
        type: "doc-update",
        suggestedPath: gap.suggestedDoc,
      });
    }

    return suggestions.slice(0, 10); // Top 10 suggestions
  }

  /**
   * Output report based on format option
   */
  async outputReport() {
    // Review #200 R5: Support JSON output format
    if (this.options.format === "json") {
      const json = JSON.stringify(this.results, null, 2);

      if (this.options.outputFile) {
        refuseSymlink(this.options.outputFile);
        // Review #200 R6: Use wx flag to prevent overwrites
        writeFileSync(this.options.outputFile, json, {
          encoding: "utf-8",
          flag: "wx",
          mode: 0o600,
        });
        console.log(`📊 JSON output written to: ${this.options.outputFile}`);
      } else {
        console.log(json);
      }
      return;
    }

    if (this.options.detailed) {
      this.outputDetailed();
    } else if (this.options.category) {
      this.outputCategory(this.options.category);
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

    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║         LEARNING EFFECTIVENESS DASHBOARD                   ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    console.log(
      `📊 Analysis Period: Review #${firstReview} - #${lastReview} (${this.reviews.length} reviews)\n`
    );

    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│ KEY METRICS                                             │");
    console.log("├─────────────────────────────────────────────────────────┤");
    console.log(`│ Automation Coverage:        ${this.getAutomationCoverage().padEnd(30)}│`);
    console.log(`│ Learning Effectiveness:     ${this.getLearningEffectiveness().padEnd(30)}│`);
    console.log(
      `│ Pattern Extraction Rate:    ${this.results.consolidationQuality.patternExtractionRate} patterns/review${" ".repeat(14)}│`
    );
    console.log(
      `│ Consolidation Health:       ${this.results.consolidationQuality.health.padEnd(30)}│`
    );
    console.log("└─────────────────────────────────────────────────────────┘\n");

    if (this.results.suggestions.length > 0) {
      console.log("🎯 TOP 5 RECOMMENDED ACTIONS:\n");

      for (let i = 0; i < Math.min(5, this.results.suggestions.length); i++) {
        const s = this.results.suggestions[i];
        console.log(`${i + 1}. [${s.category}] ${sanitizeDisplayString(s.title, 80)}`);
        console.log(`   ${sanitizeDisplayString(s.description, 120)}`);
        console.log(`   → ${sanitizeDisplayString(s.action, 120)}\n`);
      }
    } else {
      console.log("✅ No high-priority suggestions at this time.\n");
    }

    console.log("💡 Run with --detailed for full 10-category analysis");
    console.log("💡 Run with --category <name> for specific deep-dive\n");
  }

  /**
   * Output detailed report (all 10 categories)
   */
  outputDetailed() {
    console.log("LEARNING EFFECTIVENESS - DETAILED REPORT\n");
    console.log("═".repeat(60) + "\n");

    // 1. Automation Opportunities
    console.log("🤖 1. AUTOMATION OPPORTUNITIES\n");
    if (this.results.automationGaps.length > 0) {
      console.log("Top patterns that should be automated:\n");
      for (const gap of this.results.automationGaps.slice(0, 10)) {
        console.log(`  • ${sanitizeDisplayString(gap.pattern, 80)}`);
        console.log(`    Occurrences: ${gap.occurrences} | ROI: ${gap.roi}`);
        console.log(`    Reviews: ${gap.reviews.join(", ")}\n`);
      }
    } else {
      console.log("  ✅ No high-frequency patterns missing automation\n");
    }

    // 2. Documentation Gaps
    console.log("📚 2. DOCUMENTATION GAPS\n");
    if (this.results.documentationGaps.length > 0) {
      console.log("Patterns mentioned but not documented:\n");
      for (const gap of this.results.documentationGaps.slice(0, 10)) {
        console.log(
          `  • ${sanitizeDisplayString(gap.pattern, 80)} (${gap.occurrences} mentions)\n`
        );
      }
    } else {
      console.log("  ✅ All frequent patterns are documented\n");
    }

    // 3. Recurring Issues
    console.log("⚠️  3. RECURRING ISSUES (Learning Breakdown)\n");
    if (this.results.recurringIssues.length > 0) {
      console.log("Patterns that keep appearing despite documentation:\n");
      for (const issue of this.results.recurringIssues.slice(0, 10)) {
        console.log(`  • ${sanitizeDisplayString(issue.pattern, 80)} [${issue.priority}]`);
        console.log(`    First: #${issue.firstMention} | Last: #${issue.lastMention}`);
        console.log(`    Effectiveness: ${issue.learningEffectiveness.toFixed(1)}%\n`);
      }
    } else {
      console.log("  ✅ No recurring issues detected\n");
    }

    // 4. Process Metrics - Full breakdown
    console.log("🔧 4. PROCESS METRICS\n");
    const pm = this.results.processMetrics;

    console.log("Overview:");
    console.log("┌────────────────────────────┬─────────────────────────────┐");
    console.log("│ Metric                     │ Value                       │");
    console.log("├────────────────────────────┼─────────────────────────────┤");
    console.log(`│ Total Reviews              │ ${String(pm.totalReviews).padEnd(27)} │`);
    console.log(`│ Total Findings             │ ${String(pm.totalFindings).padEnd(27)} │`);
    console.log(`│ Avg Patterns/Review        │ ${pm.avgPatternsPerReview.padEnd(27)} │`);
    console.log(`│ Fix Rate                   │ ${pm.resolution.fixRate.padEnd(27)} │`);
    console.log(`│ Critical Issues Trend      │ ${pm.criticalTrend.padEnd(27)} │`);
    console.log("└────────────────────────────┴─────────────────────────────┘\n");

    console.log("Severity Distribution:");
    console.log("┌──────────────┬─────────┬──────────┐");
    console.log("│ Severity     │ Count   │ %        │");
    console.log("├──────────────┼─────────┼──────────┤");
    const totalSev = pm.totalFindings || 1;
    for (const [severity, count] of Object.entries(pm.severityDistribution)) {
      const pct = ((count / totalSev) * 100).toFixed(1) + "%";
      console.log(`│ ${severity.padEnd(12)} │ ${String(count).padStart(7)} │ ${pct.padStart(8)} │`);
    }
    console.log("└──────────────┴─────────┴──────────┘\n");

    console.log("Resolution Status:");
    console.log(
      `  ✅ Fixed: ${pm.resolution.fixed}  ⏸️ Deferred: ${pm.resolution.deferred}  ❌ Rejected: ${pm.resolution.rejected}\n`
    );

    if (Object.keys(pm.toolDistribution).length > 0) {
      console.log("Tool Distribution:");
      for (const [tool, count] of Object.entries(pm.toolDistribution).sort((a, b) => b[1] - a[1])) {
        const bar = "█".repeat(Math.min(30, Math.floor((count / pm.totalReviews) * 30)));
        console.log(`  ${tool.padEnd(18)} ${bar} ${count}`);
      }
      console.log("");
    }

    // 5. Tool Effectiveness - Full table format
    console.log("🛠️  5. TOOL EFFECTIVENESS\n");
    if (this.results.toolEffectiveness.length > 0) {
      console.log("┌─────────────────┬─────────┬──────────┬──────────┬──────────┬────────┐");
      console.log("│ Tool            │ Reviews │ Findings │ Unique % │ FP Rate  │ S/N    │");
      console.log("├─────────────────┼─────────┼──────────┼──────────┼──────────┼────────┤");
      for (const tool of this.results.toolEffectiveness) {
        const name = tool.tool.substring(0, 15).padEnd(15);
        const reviews = String(tool.reviews).padStart(7);
        const findings = String(tool.totalFindings).padStart(8);
        const unique = tool.uniqueFindings.padStart(8);
        const fp = tool.falsePositiveRate.padStart(8);
        const sn = tool.signalToNoise.padStart(6);
        console.log(`│ ${name} │${reviews} │${findings} │${unique} │${fp} │${sn} │`);
      }
      console.log("└─────────────────┴─────────┴──────────┴──────────┴──────────┴────────┘\n");

      // Severity breakdown by tool
      console.log("Severity Distribution by Tool:");
      console.log("┌─────────────────┬──────────┬────────┬────────┬─────────┐");
      console.log("│ Tool            │ Critical │ Major  │ Minor  │ Trivial │");
      console.log("├─────────────────┼──────────┼────────┼────────┼─────────┤");
      for (const tool of this.results.toolEffectiveness) {
        const name = tool.tool.substring(0, 15).padEnd(15);
        const crit = String(tool.critical).padStart(8);
        const maj = String(tool.major).padStart(6);
        const min = String(tool.minor).padStart(6);
        const triv = String(tool.trivial).padStart(7);
        console.log(`│ ${name} │${crit} │${maj} │${min} │${triv} │`);
      }
      console.log("└─────────────────┴──────────┴────────┴────────┴─────────┘\n");
    } else {
      console.log("  No tool data available\n");
    }

    // 6. Category Balance - with targets
    console.log("📊 6. CATEGORY BALANCE\n");
    const categoryTargets = {
      Security: "40-50%",
      Quality: "25-30%",
      Performance: "10-15%",
      Documentation: "10-15%",
      Process: "5-10%",
    };
    const totalCategorized = Object.values(this.results.categoryBalance).reduce(
      (sum, s) => sum + s.count,
      0
    );

    if (totalCategorized > 0) {
      console.log("┌──────────────────┬───────┬──────────┬──────────┬─────────────────────┐");
      console.log("│ Category         │ Count │ %        │ Target   │ Status              │");
      console.log("├──────────────────┼───────┼──────────┼──────────┼─────────────────────┤");
      for (const [category, stats] of Object.entries(this.results.categoryBalance)) {
        const name = category.substring(0, 16).padEnd(16);
        const count = String(stats.count).padStart(5);
        const pct = stats.percentage.padStart(8);
        const target = (categoryTargets[category] || "N/A").padStart(8);
        const pctNum = parseFloat(stats.percentage);
        let status = "⚠️ Review";
        if (category === "Security" && pctNum >= 40 && pctNum <= 60) status = "✅ Healthy";
        else if (category === "Quality" && pctNum >= 20 && pctNum <= 35) status = "✅ Healthy";
        else if (category === "Performance" && pctNum >= 8 && pctNum <= 20) status = "✅ Healthy";
        else if (pctNum < 5) status = "🔴 Low";
        console.log(`│ ${name} │${count} │${pct} │${target} │ ${status.padEnd(19)} │`);
      }
      console.log("└──────────────────┴───────┴──────────┴──────────┴─────────────────────┘\n");
    } else {
      console.log("  No category data available\n");
    }

    // 7. False Positive Patterns
    console.log("🚫 7. FALSE POSITIVE PATTERNS\n");
    if (this.results.falsePositives.length > 0) {
      console.log("Tools with false positive reports:");
      for (const fp of this.results.falsePositives.slice(0, 5)) {
        console.log(`  • ${fp.tool}: ${fp.count} false positives`);
        if (fp.examples.length > 0) {
          console.log(
            `    Examples: Review #${fp.examples.map((e) => e.reviewNumber).join(", #")}`
          );
        }
      }
      console.log("");
    } else {
      console.log("  ✅ No significant false positive patterns detected\n");
    }

    // 8. Complexity Hotspots - Top 10
    console.log("🔥 8. COMPLEXITY HOTSPOTS\n");
    if (this.results.complexityHotspots.length > 0) {
      console.log("Files appearing in multiple reviews (potential refactoring targets):\n");
      for (const hotspot of this.results.complexityHotspots.slice(0, 10)) {
        console.log(`  ${String(hotspot.mentions).padStart(3)}x  ${hotspot.file}`);
      }
      console.log("");
    } else {
      console.log("  ✅ No complexity hotspots detected\n");
    }

    // 9. Consolidation Quality
    console.log("📈 9. CONSOLIDATION QUALITY\n");
    console.log("┌────────────────────────────┬─────────────────────────────┐");
    console.log("│ Metric                     │ Value                       │");
    console.log("├────────────────────────────┼─────────────────────────────┤");
    console.log(
      `│ Pattern Extraction Rate    │ ${this.results.consolidationQuality.patternExtractionRate.padEnd(27)} │`
    );
    console.log(
      `│ Review Coverage            │ ${this.results.consolidationQuality.coveragePercentage.padEnd(27)} │`
    );
    console.log(
      `│ Total Patterns Extracted   │ ${String(this.results.consolidationQuality.totalPatternsExtracted).padEnd(27)} │`
    );
    console.log(
      `│ Unconsolidated Reviews     │ ${String(this.results.consolidationQuality.unconsolidatedReviews).padEnd(27)} │`
    );
    console.log(
      `│ Health                     │ ${this.results.consolidationQuality.health.padEnd(27)} │`
    );
    console.log("└────────────────────────────┴─────────────────────────────┘\n");

    // 10. Training Gaps
    console.log("🎓 10. TRAINING GAPS\n");
    if (this.results.trainingGaps.length > 0) {
      console.log("Recurring issues that may need dedicated guides:\n");
      for (const gap of this.results.trainingGaps) {
        console.log(`  • ${sanitizeDisplayString(gap.topic, 60)} (${gap.occurrences} occurrences)`);
        console.log(`    Suggested: ${sanitizeDisplayString(gap.suggestedDoc, 80)}\n`);
      }
    } else {
      console.log("  ✅ No training gaps identified\n");
    }
  }

  /**
   * Output single category deep-dive
   */
  outputCategory(categoryName) {
    console.log(`📊 CATEGORY: ${categoryName.toUpperCase()}\n`);

    const categoryMap = {
      automation: "automationGaps",
      documentation: "documentationGaps",
      recurring: "recurringIssues",
      process: "processMetrics",
      tools: "toolEffectiveness",
      balance: "categoryBalance",
      "false-positives": "falsePositives",
      hotspots: "complexityHotspots",
      consolidation: "consolidationQuality",
      training: "trainingGaps",
    };

    const key = categoryMap[categoryName.toLowerCase()];
    if (!key || !this.results[key]) {
      console.error(`❌ Unknown category: ${categoryName}`);
      console.log(`Valid options: ${Object.keys(categoryMap).join(", ")}`);
      return;
    }

    console.log(JSON.stringify(this.results[key], null, 2));
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
    const skipped = [];
    const applied = [];

    for (let i = 0; i < this.results.suggestions.length; i++) {
      const suggestion = this.results.suggestions[i];

      console.log(
        `\n[${i + 1}/${this.results.suggestions.length}] ${sanitizeDisplayString(suggestion.title, 80)}`
      );
      console.log(
        `Category: ${suggestion.category} | Priority: ${suggestion.priority} | Effort: ${suggestion.effort}`
      );

      const choice = await this.promptUser("\n[A]pply [S]kip [V]iew [D]efer [Q]uit: ");

      switch (choice.toLowerCase()) {
        case "a": {
          const success = await this.applySuggestion(suggestion);
          if (success) {
            applied.push(suggestion);
            console.log("✅ Applied and committed");
          } else {
            console.log("⚠️  Could not auto-apply this suggestion type");
            const defer = await this.promptUser("Defer to TODO? [y/n]: ");
            if (defer.toLowerCase() === "y") {
              deferred.push(suggestion);
            }
          }
          break;
        }
        case "s": {
          const reason = await this.promptUser("Reason for skipping: ");
          skipped.push({ suggestion, reason });
          console.log("⏭️  Skipped");
          break;
        }
        case "v":
          this.viewSuggestionDetails(suggestion);
          i--; // Re-ask
          break;
        case "d":
          deferred.push(suggestion);
          console.log("📝 Added to TODO list");
          break;
        case "q":
          console.log("\n👋 Exiting interactive mode...");
          i = this.results.suggestions.length; // Exit loop
          break;
        default:
          console.log("Invalid choice, please try again");
          i--;
      }
    }

    // Save tracking files
    if (deferred.length > 0) {
      await this.saveTodoFile(deferred);
      console.log(`\n📝 ${deferred.length} suggestions saved to ${TODO_FILE}`);
    }
    if (skipped.length > 0) {
      await this.saveSkippedFile(skipped);
      console.log(`📋 ${skipped.length} suggestions logged to ${SKIPPED_FILE}`);
    }
    if (applied.length > 0) {
      console.log(`✅ ${applied.length} suggestions applied`);
    }

    console.log(
      `\n📊 Summary: ${applied.length} applied, ${deferred.length} deferred, ${skipped.length} skipped`
    );
  }

  /**
   * Apply a suggestion (file modifications + git commit)
   */
  async applySuggestion(suggestion) {
    if (!suggestion.type) {
      return false; // Cannot auto-apply
    }

    try {
      switch (suggestion.type) {
        case "pattern-check":
          await this.applyPatternCheck(suggestion);
          break;
        case "doc-update":
          await this.applyDocUpdate(suggestion);
          break;
        default:
          return false;
      }

      // Create git commit
      // Review #200 R5: Check createCommit return value before reporting success
      const committed = await this.createCommit(suggestion);
      return committed === true;
    } catch (error) {
      console.error("Error applying suggestion:", sanitizeError(error));
      return false;
    }
  }

  /**
   * Add pattern to check-pattern-compliance.js
   */
  async applyPatternCheck(suggestion) {
    console.log("⚠️  Manual implementation required for pattern checks");
    console.log("This would require adding a RegEx pattern and validation logic.");
    console.log("Please add manually to scripts/check-pattern-compliance.js");
    throw new Error("Manual implementation required");
  }

  /**
   * Create or update documentation file
   */
  async applyDocUpdate(suggestion) {
    if (!suggestion.suggestedPath) {
      throw new Error("No suggested path for doc update");
    }

    // Review #200: Security - Validate path is within allowed directory
    const path = require("node:path");
    const allowedBase = path.resolve(ROOT, "docs", "agent_docs");
    const targetPath = path.resolve(ROOT, suggestion.suggestedPath);

    // Check if path is within allowed directory (Review #17, #18, #40, #53)
    const rel = path.relative(allowedBase, targetPath);
    // Use regex for Windows compatibility and edge cases (..hidden.md, empty string)
    if (rel === "" || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
      throw new Error(
        `Invalid path: ${suggestion.suggestedPath} (must be within docs/agent_docs/)`
      );
    }

    // Review #200: Create directory if it doesn't exist
    const { mkdirSync, lstatSync } = require("node:fs");
    const parentDir = path.dirname(targetPath);
    mkdirSync(parentDir, { recursive: true });

    // Review #200 R5: Prevent overwrites and symlink clobbering
    if (existsSync(targetPath)) {
      const st = lstatSync(targetPath);
      if (st.isSymbolicLink()) {
        throw new Error(`Refusing to write through symlink: ${suggestion.suggestedPath}`);
      }
      throw new Error(`Refusing to overwrite existing file: ${suggestion.suggestedPath}`);
    }

    const content = this.generateDocTemplate(suggestion);
    // Review #200 R5: Exclusive flag + restrictive permissions
    writeFileSync(targetPath, content, {
      encoding: "utf-8",
      flag: "wx",
      mode: 0o600,
    });
    // Review #200 R4: Log relative path to avoid exposing filesystem details
    const relativePath = path.relative(ROOT, targetPath);
    console.log(`  Created: ${sanitizeDisplayString(relativePath, 120)}`);
  }

  /**
   * Generate documentation template for training gaps
   */
  generateDocTemplate(suggestion) {
    return `# ${suggestion.title.replace("Create guide for ", "")}

**Created:** ${new Date().toISOString().split("T")[0]}
**Purpose:** Guide to prevent recurring issues with this pattern

## Overview

This pattern has appeared ${suggestion.description.match(/\d+/)?.[0] || "multiple"} times in code reviews, indicating a knowledge gap.

## Common Mistakes

[Document common mistakes from review findings]

## Best Practices

[Document recommended approach]

## Examples

### ✅ Good
\`\`\`javascript
// Add correct example
\`\`\`

### ❌ Bad
\`\`\`javascript
// Add anti-pattern example
\`\`\`

## References

- [CODE_PATTERNS.md](./CODE_PATTERNS.md)
- Review learnings: ${suggestion.description}
`;
  }

  /**
   * Create git commit for applied suggestion
   */
  async createCommit(suggestion) {
    const { tmpdir } = require("node:os");
    const { unlinkSync } = require("node:fs");
    const path = require("node:path");

    // Review #200: Qodo - Use temp directory instead of .git to prevent symlink attacks
    const msgFile = path.join(tmpdir(), `LEARNING_COMMIT_MSG_${process.pid}_${Date.now()}.txt`);

    try {
      // Review #200 R5: Only allow explicit paths - no git add -A fallback
      if (suggestion.type === "doc-update" && suggestion.suggestedPath) {
        const path = require("node:path");

        // Review #200 R6: Block Git pathspec magic (e.g. ':(exclude)...')
        if (suggestion.suggestedPath.startsWith(":")) {
          console.warn("⚠️  Refusing to stage pathspec-magic path");
          return false;
        }

        // Review #200 R6: Validate path is within repository root
        const resolved = path.resolve(ROOT, suggestion.suggestedPath);
        const relToRoot = path.relative(ROOT, resolved);

        if (relToRoot === "" || /^\.\.(?:[\\/]|$)/.test(relToRoot) || path.isAbsolute(relToRoot)) {
          throw new Error(`Refusing to stage path outside repo: ${suggestion.suggestedPath}`);
        }

        // Review #200 R4: Use -- terminator to prevent path being interpreted as git option
        execFileSync("git", ["add", "--", relToRoot], { cwd: ROOT });
      } else {
        // Review #200 R5: Refuse to stage unknown types to prevent sensitive file exposure
        console.warn("⚠️  Cannot stage: unknown suggestion type or missing path");
        return false;
      }

      // Review #200 R5: Sanitize suggestion fields for commit message
      const safeTitle = sanitizeDisplayString(suggestion.title, 100);
      const safeDesc = sanitizeDisplayString(suggestion.description, 200);
      const message = `chore(learning): ${safeTitle}

${safeDesc}

Auto-applied by learning effectiveness analyzer.
Priority: ${suggestion.priority} | Impact: ${suggestion.impact}
`;

      // Review #200 R4: Harden temp file - exclusive flag + restrictive permissions
      writeFileSync(msgFile, message, { encoding: "utf-8", flag: "wx", mode: 0o600 });
      execFileSync("git", ["commit", "-F", msgFile], { cwd: ROOT });
      console.log("  Committed changes");
      return true; // Review #200 R5: Return success status
    } catch (error) {
      console.warn("⚠️  Could not create commit:", sanitizeError(error));
      return false; // Review #200 R5: Return failure status
    } finally {
      // Cleanup temp file
      try {
        unlinkSync(msgFile);
      } catch {
        // Ignore cleanup failures
      }
    }
  }

  /**
   * View detailed analysis for a suggestion
   */
  viewSuggestionDetails(suggestion) {
    console.log("\n" + "=".repeat(60));
    console.log(`SUGGESTION DETAILS: ${sanitizeDisplayString(suggestion.title, 120)}`);
    console.log("=".repeat(60));
    console.log(`\nCategory: ${suggestion.category}`);
    console.log(`Priority: ${suggestion.priority}`);
    console.log(`Effort: ${suggestion.effort}`);
    console.log(`Impact: ${suggestion.impact}`);
    console.log(`\nDescription: ${sanitizeDisplayString(suggestion.description, 200)}`);
    console.log(`\nRecommended Action: ${sanitizeDisplayString(suggestion.action, 200)}`);
    if (suggestion.type) {
      console.log(`Type: ${suggestion.type}`);
    }
    console.log("=".repeat(60) + "\n");
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

## Priority 1 (Immediate)

`;

    const p1 = deferred.filter((d) => d.priority <= 3);
    const p2 = deferred.filter((d) => d.priority > 3 && d.priority <= 7);
    const p3 = deferred.filter((d) => d.priority > 7);

    // Review #200 R5: Sanitize and escape all user-derived fields
    for (const item of p1) {
      content += `- [ ] **[${escapeMd(item.category, 40)}]** ${escapeMd(item.title, 120)}\n`;
      content += `  - **Effort:** ${escapeMd(item.effort, 40)}\n`;
      content += `  - **Impact:** ${escapeMd(item.impact, 40)}\n`;
      content += `  - **Action:** ${escapeMd(item.action, 160)}\n`;
      content += `  - **Details:** ${escapeMd(item.description, 240)}\n\n`;
    }

    if (p2.length > 0) {
      content += `## Priority 2 (Soon)\n\n`;
      for (const item of p2) {
        content += `- [ ] **[${escapeMd(item.category, 40)}]** ${escapeMd(item.title, 120)}\n`;
        content += `  - **Effort:** ${escapeMd(item.effort, 40)} | **Impact:** ${escapeMd(item.impact, 40)}\n`;
        content += `  - ${escapeMd(item.action, 160)}\n\n`;
      }
    }

    if (p3.length > 0) {
      content += `## Priority 3 (Later)\n\n`;
      for (const item of p3) {
        content += `- [ ] [${escapeMd(item.category, 40)}] ${escapeMd(item.title, 120)}\n`;
      }
    }

    // Review #200 R5: Symlink protection + restrictive permissions
    refuseSymlink(TODO_FILE);
    writeFileSync(TODO_FILE, content, { encoding: "utf-8", mode: 0o600 });
  }

  /**
   * Save skipped suggestions to tracking file
   */
  async saveSkippedFile(skipped) {
    const now = new Date().toISOString().split("T")[0];

    let content = `# Skipped Learning Suggestions

**Last Updated:** ${now}

This file tracks suggestions that were explicitly skipped with rationale.

`;

    // Review #200 R5: Sanitize and escape all user-derived fields
    for (const item of skipped) {
      content += `## ${escapeMd(item.suggestion.title, 120)}\n\n`;
      content += `- **Category:** ${escapeMd(item.suggestion.category, 40)}\n`;
      content += `- **Priority:** ${escapeMd(String(item.suggestion.priority), 10)}\n`;
      content += `- **Reason Skipped:** ${escapeMd(item.reason, 200)}\n`;
      content += `- **Details:** ${escapeMd(item.suggestion.description, 240)}\n\n`;
    }

    // Review #200 R5: Symlink protection + restrictive permissions
    refuseSymlink(SKIPPED_FILE);
    writeFileSync(SKIPPED_FILE, content, { encoding: "utf-8", mode: 0o600 });
  }

  /**
   * Update metrics file with latest analysis
   */
  async updateMetrics() {
    const now = new Date().toISOString().split("T")[0];
    const firstReview = this.reviews[0].number;
    const lastReview = this.reviews[this.reviews.length - 1].number;

    const content = `# Learning Effectiveness Metrics

**Last Updated:** ${now}

---

## Purpose

This document tracks the effectiveness of the SoNash learning system by analyzing AI review patterns and quantifying whether documented patterns prevent recurring issues. It provides actionable metrics to guide automation, documentation, and training priorities.

**Auto-generated by:** \`scripts/analyze-learning-effectiveness.js\`
**Update frequency:** After consolidation (every 10 reviews) or manual analysis

---

## AI Instructions

This is a **Tier 2 metrics document** - reference during:

- **Post-consolidation**: Review trends to identify automation gaps
- **Session planning**: Prioritize technical debt based on recurring issues
- **Pattern updates**: Validate that new patterns are being adopted

**Key sections:**
- **Key Metrics**: High-level health indicators
- **Top 5 Actions**: Priority-ranked recommendations
- **Analysis History**: Track trends over time

---

## Quick Start

\`\`\`bash
# View current metrics
cat docs/LEARNING_METRICS.md

# Run fresh analysis
npm run learning:analyze

# View detailed breakdown
npm run learning:detailed
\`\`\`

---

## Current Analysis

**Review Range:** #${firstReview} - #${lastReview} (${this.reviews.length} reviews)
**Analysis Date:** ${now}

### Key Metrics

| Metric                    | Value                                                           |
| ------------------------- | --------------------------------------------------------------- |
| Automation Coverage       | ${this.getAutomationCoverage()}                                 |
| Learning Effectiveness    | ${this.getLearningEffectiveness()}                              |
| Pattern Extraction Rate   | ${this.results.consolidationQuality.patternExtractionRate} patterns/review |
| Consolidation Health      | ${this.results.consolidationQuality.health}                     |
| Total Documented Patterns | ${this.codePatterns.length}                                     |
| Automated Patterns        | ${this.automatedPatterns.length}                                |

### Top 5 Recommended Actions

${this.results.suggestions
  .slice(0, 5)
  .map((s, i) => {
    // Review #200 R5: Escape Markdown metacharacters to prevent injection
    const category = escapeMd(s.category, 40);
    const title = escapeMd(s.title, 120);
    const description = escapeMd(s.description, 200);
    const action = escapeMd(s.action, 200);
    return `${i + 1}. **[${category}]** ${title}\n   - ${description}\n   - Action: ${action}`;
  })
  .join("\n\n")}

---

## Analysis History

- ${now}: Analyzed ${this.reviews.length} reviews (#${firstReview} - #${lastReview})

---

## Version History

| Version | Date       | Description                              |
| ------- | ---------- | ---------------------------------------- |
| 1.0     | ${now}     | Initial auto-generated metrics dashboard |
`;

    // Review #200 R5: Symlink protection + restrictive permissions
    refuseSymlink(METRICS_FILE);
    writeFileSync(METRICS_FILE, content, { encoding: "utf-8", mode: 0o600 });
    console.log(`\n✅ Metrics updated: ${METRICS_FILE}`);
  }

  /**
   * Helper: Calculate automation coverage percentage
   */
  getAutomationCoverage() {
    if (this.codePatterns.length === 0) return "N/A";
    const rawPercentage = (this.automatedPatterns.length / this.codePatterns.length) * 100;
    // Review #200: Cap at 100% for clearer metrics
    const percentage = Math.min(rawPercentage, 100).toFixed(1);
    return `${percentage}%`;
  }

  /**
   * Helper: Calculate learning effectiveness score
   */
  getLearningEffectiveness() {
    const recurring = this.results.recurringIssues;
    if (recurring.length === 0) return "100%";

    const avgEffectiveness =
      recurring.reduce((sum, r) => sum + r.learningEffectiveness, 0) / recurring.length;
    return `${avgEffectiveness.toFixed(1)}%`;
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
    category: null,
    format: "dashboard",
    auto: false,
    detailed: false,
    outputFile: null,
    inputFile: null,
    allArchives: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--since-review") {
      // Review #200 R6: Validate argument has value (consistent with other args)
      const next = args[i + 1];
      if (!next || next.startsWith("--")) {
        throw new Error('Missing value for --since-review (e.g. "--since-review 150")');
      }
      // Review #200: Validate --since-review is a positive integer
      const reviewNum = parseInt(next, 10);
      if (isNaN(reviewNum) || reviewNum < 1) {
        throw new Error(`Invalid --since-review value: "${next}" (must be a positive integer)`);
      }
      options.sinceReview = reviewNum;
      i++;
    } else if (arg === "--category") {
      // Review #200 R5: Validate argument has value
      const next = args[i + 1];
      if (!next || next.startsWith("--")) {
        throw new Error('Missing value for --category (e.g. "--category automation")');
      }
      options.category = next;
      i++;
    } else if (arg === "--format") {
      // Review #200 R5: Validate argument has value
      const next = args[i + 1];
      if (!next || next.startsWith("--")) {
        throw new Error('Missing value for --format (e.g. "--format dashboard")');
      }
      options.format = next;
      i++;
    } else if (arg === "--auto") {
      options.auto = true;
    } else if (arg === "--detailed") {
      options.detailed = true;
    } else if (arg === "--output") {
      // Review #200 R5: Validate argument has value
      const next = args[i + 1];
      if (!next || next.startsWith("--")) {
        throw new Error('Missing value for --output (e.g. "--output path/to/file.json")');
      }
      options.outputFile = next;
      i++;
    } else if (arg === "--file") {
      // Support analyzing archive files or custom input
      const next = args[i + 1];
      if (!next || next.startsWith("--")) {
        throw new Error('Missing value for --file (e.g. "--file docs/archive/REVIEWS_180-201.md")');
      }
      options.inputFile = next;
      i++;
    } else if (arg === "--all-archives") {
      // Analyze all archive files combined
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
