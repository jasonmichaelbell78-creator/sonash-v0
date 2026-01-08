#!/usr/bin/env node
/**
 * Check if code review trigger thresholds have been reached
 *
 * Reads:
 * - AUDIT_TRACKER.md (per-category last audit dates)
 * - MULTI_AI_REVIEW_COORDINATOR.md (baseline metrics)
 * - git log since last review
 * - ESLint current warnings
 *
 * Checks per-category thresholds:
 * - Code: 25 commits OR 15 code files
 * - Security: ANY security file OR 20 commits
 * - Performance: 30 commits OR bundle change
 * - Refactoring: 40 commits OR complexity warnings
 * - Documentation: 20 doc files OR 30 commits
 * - Process: ANY CI/hook file OR 30 commits
 *
 * Multi-AI escalation triggers:
 * - 3+ single audits in same category
 * - 100+ total commits
 * - 14+ days since any audit
 *
 * Usage: node scripts/check-review-needed.js [options]
 * Options:
 *   --category=X      Check specific category only (code|security|performance|refactoring|documentation|process)
 *   --json            Output as JSON instead of human-readable
 *   --verbose         Show detailed logging
 *
 * Exit codes: 0 = no review needed, 1 = review recommended, 2 = error
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { sanitizeError } from './lib/sanitize-error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// File paths
const TRACKER_PATH = join(ROOT, 'docs', 'AUDIT_TRACKER.md');
const COORDINATOR_PATH = join(ROOT, 'docs', 'MULTI_AI_REVIEW_COORDINATOR.md');

// Category-specific thresholds
const CATEGORY_THRESHOLDS = {
  code: {
    commits: 25,
    files: 15,
    filePattern: /\.(tsx?|jsx?|js)$/,
    excludePattern: /^(docs|tests|\.)/
  },
  security: {
    commits: 20,
    files: 1, // ANY security file triggers
    filePattern: /(auth|security|firebase|api|secrets|env|token|credential|\.env)/i
  },
  performance: {
    commits: 30,
    files: 10,
    filePattern: /\.(tsx?|jsx?)$/,
    checkBundle: true
  },
  refactoring: {
    commits: 40,
    files: 20,
    filePattern: /\.(tsx?|jsx?)$/,
    checkComplexity: true
  },
  documentation: {
    commits: 30,
    files: 20,
    filePattern: /\.md$/
  },
  process: {
    commits: 30,
    files: 1, // ANY CI/hook file triggers
    filePattern: /(\.github|\.claude|\.husky|scripts\/)/
  }
};

// Multi-AI escalation thresholds
const MULTI_AI_THRESHOLDS = {
  singleAuditCount: 3,    // Single audits before multi-AI
  totalCommits: 100,      // Total commits across all categories
  daysSinceAudit: 14      // Days since any audit
};

// Parse command line arguments
const args = process.argv.slice(2);
const JSON_OUTPUT = args.includes('--json');
const VERBOSE = args.includes('--verbose');
const CATEGORY_ARG = args.find(a => a.startsWith('--category='));
const SPECIFIC_CATEGORY = CATEGORY_ARG ? CATEGORY_ARG.split('=')[1] : null;

/**
 * Safely log verbose messages (only when --verbose flag is set and not in JSON mode)
 * @param {...unknown} messages - Messages to log
 * @returns {void}
 */
function verbose(...messages) {
  if (VERBOSE && !JSON_OUTPUT) {
    console.log('[VERBOSE]', ...messages);
  }
}

/**
 * Validate and sanitize ISO date string
 * @param {string|null|undefined} dateString - Date string to validate (ISO format: YYYY-MM-DD or ISO 8601)
 * @returns {string} Sanitized date string or default '2025-01-01' if invalid
 */
function sanitizeDateString(dateString) {
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;

  if (!dateString || typeof dateString !== 'string') {
    return '2025-01-01';
  }

  const trimmed = dateString.trim();
  if (!isoDatePattern.test(trimmed)) {
    return '2025-01-01';
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    return '2025-01-01';
  }

  return trimmed;
}

/**
 * Safely read a file with error handling
 * @param {string} filePath - Absolute path to the file to read
 * @param {string} description - Human-readable description for error messages
 * @returns {{success: boolean, content?: string, error?: string}} Result object with content or error
 */
function safeReadFile(filePath, description) {
  verbose(`Reading ${description} from ${filePath}`);

  if (!existsSync(filePath)) {
    return { success: false, error: `${description} not found` };
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: sanitizeError(error) };
  }
}

/**
 * Run a shell command safely with error handling
 * @param {string} command - Shell command to execute
 * @param {string} description - Human-readable description for logging
 * @returns {{success: boolean, output?: string, error?: string}} Result object with output or error
 */
function safeExec(command, description) {
  verbose(`Running: ${command}`);

  try {
    const output = execSync(command, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    if (error.stdout) {
      return { success: true, output: error.stdout.trim() };
    }
    return { success: false, error: sanitizeError(error) };
  }
}

/**
 * Extract section content between a header and the next section
 * Uses bounded line-by-line matching to avoid regex backtracking DoS (SonarQube S5852)
 * @param {string} content - Full file content to search
 * @param {RegExp} headerPattern - Pattern to match section header (e.g., /^### Code Audits/)
 * @returns {string} Section content (empty string if section not found)
 */
function extractSection(content, headerPattern) {
  const lines = content.split('\n');
  let inSection = false;
  const sectionLines = [];

  for (const line of lines) {
    if (headerPattern.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      // Stop at next section header (### or ##)
      if (/^#{2,3}\s/.test(line)) {
        break;
      }
      sectionLines.push(line);
    }
  }

  return sectionLines.join('\n');
}

/**
 * Parse AUDIT_TRACKER.md to get per-category last audit dates
 * @param {string} content - Full content of AUDIT_TRACKER.md
 * @returns {Object<string, string|null>} Map of category names to ISO date strings (null if never audited)
 */
function getCategoryAuditDates(content) {
  const categories = {
    code: null,
    security: null,
    performance: null,
    refactoring: null,
    documentation: null,
    process: null
  };

  // Section header patterns (bounded, no backtracking risk)
  const categoryHeaders = {
    code: /^### Code Audits/,
    security: /^### Security Audits/,
    performance: /^### Performance Audits/,
    refactoring: /^### Refactoring Audits/,
    documentation: /^### Documentation Audits/,
    process: /^### Process Audits/
  };

  for (const [category, headerPattern] of Object.entries(categoryHeaders)) {
    const sectionContent = extractSection(content, headerPattern);
    if (sectionContent) {
      // Find the most recent date in the table
      const dateMatches = sectionContent.match(/\d{4}-\d{2}-\d{2}/g);
      if (dateMatches && dateMatches.length > 0) {
        // Get the most recent date
        const dates = dateMatches.map(d => new Date(d));
        const mostRecent = new Date(Math.max(...dates));
        categories[category] = mostRecent.toISOString().split('T')[0];
        verbose(`Found ${category} last audit: ${categories[category]}`);
      }
    }
  }

  return categories;
}

/**
 * Count single-session audits per category
 * Uses extractSection() to avoid regex backtracking DoS (SonarQube S5852)
 * @param {string} content - Full content of AUDIT_TRACKER.md
 * @returns {Object<string, number>} Map of category names to audit counts
 */
function getSingleAuditCounts(content) {
  const counts = {
    code: 0,
    security: 0,
    performance: 0,
    refactoring: 0,
    documentation: 0,
    process: 0
  };

  // Reuse bounded section header patterns
  const categoryHeaders = {
    code: /^### Code Audits/,
    security: /^### Security Audits/,
    performance: /^### Performance Audits/,
    refactoring: /^### Refactoring Audits/,
    documentation: /^### Documentation Audits/,
    process: /^### Process Audits/
  };

  for (const [category, headerPattern] of Object.entries(categoryHeaders)) {
    const sectionContent = extractSection(content, headerPattern);
    if (sectionContent) {
      // Count rows with dates (excluding header and "No audits yet")
      const dateMatches = sectionContent.match(/\d{4}-\d{2}-\d{2}/g);
      counts[category] = dateMatches ? dateMatches.length : 0;
    }
  }

  return counts;
}

/**
 * Get count of commits since a specific date
 * @param {string} sinceDate - ISO date string (YYYY-MM-DD) to count commits from
 * @returns {number} Number of commits since the date (0 if error or none)
 */
function getCommitsSince(sinceDate) {
  const result = safeExec(
    `git rev-list --count --since="${sinceDate}" HEAD`,
    'count commits'
  );
  return result.success ? parseInt(result.output, 10) || 0 : 0;
}

/**
 * Get files modified since a date that match a given pattern
 * @param {string} sinceDate - ISO date string (YYYY-MM-DD) to find modifications from
 * @param {RegExp} pattern - Regex pattern to filter file paths
 * @returns {string[]} Array of matching file paths
 */
function getFilesModifiedSince(sinceDate, pattern) {
  const result = safeExec(
    `git log --since="${sinceDate}" --name-only --pretty=format: | sort -u | grep -v "^$"`,
    'files modified'
  );

  if (!result.success || !result.output) {
    return [];
  }

  const files = result.output.split('\n').filter(f => f.trim());
  return files.filter(f => pattern.test(f));
}

/**
 * Get security-sensitive file changes since a date
 * @param {string} sinceDate - ISO date string (YYYY-MM-DD) to find changes from
 * @returns {string[]} Array of security-related file paths that changed
 */
function getSecuritySensitiveChanges(sinceDate) {
  const result = safeExec(
    `git log --since="${sinceDate}" --name-only --pretty=format: | grep -iE "(auth|security|firebase|api|secrets|env|token|credential|\\.env)" | sort -u`,
    'security changes'
  );

  if (!result.success || !result.output.trim()) {
    return [];
  }

  return result.output.split('\n').filter(f => f.trim());
}

/**
 * Get CI/CD and hook file changes since a date
 * @param {string} sinceDate - ISO date string (YYYY-MM-DD) to find changes from
 * @returns {string[]} Array of process-related file paths that changed
 */
function getProcessChanges(sinceDate) {
  const result = safeExec(
    `git log --since="${sinceDate}" --name-only --pretty=format: | grep -E "(\\.github|\\.claude|\\.husky|scripts/)" | sort -u`,
    'process changes'
  );

  if (!result.success || !result.output.trim()) {
    return [];
  }

  return result.output.split('\n').filter(f => f.trim());
}

/**
 * Check triggers for a specific category
 * Refactored to use generic file matching for all categories (removes special-case logic)
 * @param {string} category - Category name (code, security, performance, etc.)
 * @param {string} sinceDate - ISO date string of last audit for this category
 * @param {Object} thresholds - Category-specific threshold configuration
 * @param {number} thresholds.commits - Commit count threshold
 * @param {number} thresholds.files - File count threshold
 * @param {RegExp} thresholds.filePattern - Pattern to match relevant files
 * @param {RegExp} [thresholds.excludePattern] - Optional pattern to exclude files
 * @param {boolean} [thresholds.checkBundle] - Whether to check bundle config changes
 * @param {boolean} [thresholds.checkComplexity] - Whether to check for complexity warnings
 * @returns {{category: string, triggered: boolean, commits: number, filesChanged: number, reasons: string[], sinceDate: string}}
 */
function checkCategoryTriggers(category, sinceDate, thresholds) {
  const commits = getCommitsSince(sinceDate);
  let files = [];
  let triggered = false;
  const reasons = [];

  // Get files matching the category's file pattern (generic for all categories)
  files = getFilesModifiedSince(sinceDate, thresholds.filePattern);
  if (thresholds.excludePattern) {
    files = files.filter(f => !thresholds.excludePattern.test(f));
  }

  // Check file threshold
  if (files.length >= thresholds.files) {
    triggered = true;
    reasons.push(`${files.length} ${category} file(s) changed (threshold: ${thresholds.files})`);
  }

  // Check commit threshold
  if (commits >= thresholds.commits) {
    triggered = true;
    reasons.push(`${commits} commits (threshold: ${thresholds.commits})`);
  }

  // Check bundle changes for performance category
  if (thresholds.checkBundle && isBundleChanged(sinceDate)) {
    triggered = true;
    reasons.push('Bundle configuration changed');
  }

  // Check complexity warnings for refactoring category
  if (thresholds.checkComplexity && hasComplexityWarnings()) {
    triggered = true;
    reasons.push('Complexity warnings detected');
  }

  return {
    category,
    triggered,
    commits,
    filesChanged: files.length,
    reasons,
    sinceDate
  };
}

/**
 * Check if bundle configuration files changed since a date
 * @param {string} sinceDate - ISO date string (YYYY-MM-DD) to check from
 * @returns {boolean} True if package.json, next.config.*, or webpack.config.js changed
 */
function isBundleChanged(sinceDate) {
  const bundleFiles = getFilesModifiedSince(sinceDate, /^(package\.json|next\.config\.(js|mjs|ts)|webpack\.config\.js)$/);
  return bundleFiles.length > 0;
}

/**
 * Check for complexity warnings (placeholder - can integrate with ESLint complexity rules)
 * @returns {boolean} True if complexity warnings detected (currently always false - TODO integration)
 */
function hasComplexityWarnings() {
  // TODO: Integrate with ESLint complexity rules or cyclomatic complexity checker
  // For now, return false to avoid false positives
  return false;
}

/**
 * Check multi-AI escalation triggers (3+ single audits, 100+ commits, 14+ days)
 * @param {Object<string, number>} auditCounts - Map of category names to audit counts
 * @param {Object<string, string|null>} categoryDates - Map of category names to last audit dates
 * @returns {Array<{type: string, category?: string, count?: number, daysSince?: number, commits?: number, threshold: number, message: string}>}
 */
function checkMultiAITriggers(auditCounts, categoryDates) {
  const triggers = [];

  // Check if any category has 3+ single audits
  for (const [category, count] of Object.entries(auditCounts)) {
    if (count >= MULTI_AI_THRESHOLDS.singleAuditCount) {
      triggers.push({
        type: 'single_audit_count',
        category,
        count,
        threshold: MULTI_AI_THRESHOLDS.singleAuditCount,
        message: `${category}: ${count} single audits (threshold: ${MULTI_AI_THRESHOLDS.singleAuditCount})`
      });
    }
  }

  // Check days since ANY audit and total commits
  // Only check if there's at least one previous audit to avoid false positives on fresh projects
  const allDates = Object.values(categoryDates).filter(d => d !== null);
  if (allDates.length > 0) {
    const mostRecentAudit = new Date(Math.max(...allDates.map(d => new Date(d))));
    const daysSince = Math.floor((Date.now() - mostRecentAudit.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince >= MULTI_AI_THRESHOLDS.daysSinceAudit) {
      triggers.push({
        type: 'time_elapsed',
        daysSince,
        threshold: MULTI_AI_THRESHOLDS.daysSinceAudit,
        message: `${daysSince} days since last audit (threshold: ${MULTI_AI_THRESHOLDS.daysSinceAudit})`
      });
    }

    // Check total commits since oldest category audit (only when audit history exists)
    const oldestDate = new Date(Math.min(...allDates.map(d => new Date(d))))
      .toISOString().split('T')[0];
    const totalCommits = getCommitsSince(oldestDate);
    if (totalCommits >= MULTI_AI_THRESHOLDS.totalCommits) {
      triggers.push({
        type: 'total_commits',
        commits: totalCommits,
        threshold: MULTI_AI_THRESHOLDS.totalCommits,
        message: `${totalCommits} total commits (threshold: ${MULTI_AI_THRESHOLDS.totalCommits})`
      });
    }
  }

  return triggers;
}

/**
 * Format human-readable output to console
 * @param {Array<{category: string, triggered: boolean, commits: number, filesChanged: number, reasons: string[], sinceDate: string}>} categoryResults - Results for each category
 * @param {Array<{type: string, message: string, threshold: number}>} multiAITriggers - Active multi-AI triggers
 * @param {Object<string, number>} auditCounts - Map of category names to audit counts
 * @returns {void}
 */
function formatTextOutput(categoryResults, multiAITriggers, auditCounts) {
  console.log('🔍 Checking Review Triggers...\n');
  console.log('=== Per-Category Single-Session Audit Triggers ===\n');

  // Category table
  const rows = [
    ['Category', 'Last Audit', 'Commits', 'Files', 'Status']
  ];

  for (const result of categoryResults) {
    rows.push([
      result.category.charAt(0).toUpperCase() + result.category.slice(1),
      result.sinceDate === '2025-01-01' ? 'Never' : result.sinceDate,
      result.commits.toString(),
      result.filesChanged.toString(),
      result.triggered ? '⚠️  TRIGGERED' : '✅ OK'
    ]);
  }

  // Print table
  const colWidths = rows[0].map((_, i) =>
    Math.max(...rows.map(r => r[i].length)) + 2
  );

  for (const row of rows) {
    console.log(row.map((cell, i) => cell.padEnd(colWidths[i])).join(''));
  }

  // Triggered categories
  const triggeredCategories = categoryResults.filter(r => r.triggered);
  if (triggeredCategories.length > 0) {
    console.log('\n--- Triggered Categories ---');
    for (const result of triggeredCategories) {
      console.log(`\n📋 ${result.category.toUpperCase()}:`);
      for (const reason of result.reasons) {
        console.log(`   - ${reason}`);
      }
      console.log(`   → Run: /audit-${result.category}`);
    }
  }

  // Multi-AI escalation
  console.log('\n=== Multi-AI Audit Escalation ===\n');

  console.log('Single-Session Audit Counts:');
  for (const [category, count] of Object.entries(auditCounts)) {
    const status = count >= MULTI_AI_THRESHOLDS.singleAuditCount ? '⚠️ ' : '✅';
    console.log(`  ${status} ${category}: ${count}/${MULTI_AI_THRESHOLDS.singleAuditCount}`);
  }

  if (multiAITriggers.length > 0) {
    console.log('\n⚠️  Multi-AI Audit Recommended:');
    for (const trigger of multiAITriggers) {
      console.log(`   - ${trigger.message}`);
    }
  } else {
    console.log('\n✅ No multi-AI escalation triggers active.');
  }

  // Summary
  console.log('\n--- Recommendation ---');
  const singleTriggered = triggeredCategories.length;
  const multiTriggered = multiAITriggers.length;

  if (singleTriggered === 0 && multiTriggered === 0) {
    console.log('✅ No review triggers active. Continue development.');
  } else if (multiTriggered > 0) {
    console.log(`🔴 ${multiTriggered} multi-AI trigger(s) active!`);
    console.log('   Consider running full multi-AI audit.');
  } else {
    console.log(`🟡 ${singleTriggered} single-session trigger(s) active.`);
    console.log(`   Run: /audit-${triggeredCategories[0].category}`);
  }
}

/**
 * Main function - orchestrates review trigger checking
 * Reads AUDIT_TRACKER.md, checks per-category thresholds, and outputs results
 * @returns {void} Exits with code 0 (no review needed), 1 (review recommended), or 2 (error)
 */
function main() {
  // Read AUDIT_TRACKER.md
  const trackerResult = safeReadFile(TRACKER_PATH, 'AUDIT_TRACKER.md');
  const trackerContent = trackerResult.success ? trackerResult.content : '';

  if (!trackerResult.success && !JSON_OUTPUT) {
    console.warn(`⚠️  Warning: ${trackerResult.error}`);
    console.warn('   Using default baseline values (no prior audits)\n');
  }

  // Get per-category audit dates
  const categoryDates = getCategoryAuditDates(trackerContent);
  const auditCounts = getSingleAuditCounts(trackerContent);

  // Check each category
  const categoriesToCheck = SPECIFIC_CATEGORY
    ? [SPECIFIC_CATEGORY]
    : Object.keys(CATEGORY_THRESHOLDS);

  const categoryResults = [];

  for (const category of categoriesToCheck) {
    const thresholds = CATEGORY_THRESHOLDS[category];
    if (!thresholds) {
      // Output error in JSON format when --json flag is used to avoid corrupting output
      if (JSON_OUTPUT) {
        console.log(JSON.stringify({ error: `Unknown category: ${category}` }));
      } else {
        console.error(`Unknown category: ${category}`);
      }
      process.exit(2);
    }

    const sinceDate = sanitizeDateString(categoryDates[category] || '2025-01-01');
    const result = checkCategoryTriggers(category, sinceDate, thresholds);
    categoryResults.push(result);
  }

  // Check multi-AI escalation
  const multiAITriggers = checkMultiAITriggers(auditCounts, categoryDates);

  // Calculate review needed
  const reviewNeeded = categoryResults.some(r => r.triggered) || multiAITriggers.length > 0;

  // Build recommendation string
  const triggeredCategories = categoryResults.filter(r => r.triggered);
  let recommendation = '';
  if (!reviewNeeded) {
    recommendation = 'No review triggers active. Continue development.';
  } else if (multiAITriggers.length > 0) {
    recommendation = `${multiAITriggers.length} multi-AI trigger(s) active. Consider running full multi-AI audit.`;
  } else {
    recommendation = `${triggeredCategories.length} single-session trigger(s) active. Run: /audit-${triggeredCategories[0].category}`;
  }

  // Output results
  if (JSON_OUTPUT) {
    // Build workflow-compatible triggers object
    const triggers = {};
    for (const result of categoryResults) {
      triggers[result.category] = {
        triggered: result.triggered,
        value: result.commits,
        threshold: CATEGORY_THRESHOLDS[result.category].commits,
        filesChanged: result.filesChanged,
        reasons: result.reasons
      };
    }

    console.log(JSON.stringify({
      // Workflow-compatible fields
      triggers,
      recommendation,
      // Detailed fields
      categoryResults,
      multiAITriggers,
      auditCounts,
      reviewNeeded
    }, null, 2));
  } else {
    formatTextOutput(categoryResults, multiAITriggers, auditCounts);
  }

  // Exit code
  process.exit(reviewNeeded ? 1 : 0);
}

// Run
try {
  main();
} catch (error) {
  const msg = sanitizeError(error);
  if (JSON_OUTPUT) {
    console.log(JSON.stringify({ error: msg }));
  } else {
    console.error('❌ Unexpected error:', msg);
  }
  process.exit(2);
}
