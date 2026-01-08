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
 * Safely log verbose messages
 */
function verbose(...messages) {
  if (VERBOSE && !JSON_OUTPUT) {
    console.log('[VERBOSE]', ...messages);
  }
}

/**
 * Validate and sanitize ISO date string
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
 * Safely read a file
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
 * Run a shell command safely
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
 * Parse AUDIT_TRACKER.md to get per-category last audit dates
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

  // Pattern to find audit tables for each category
  const categoryPatterns = {
    code: /### Code Audits[\s\S]*?\|([\s\S]*?)\n\n/,
    security: /### Security Audits[\s\S]*?\|([\s\S]*?)\n\n/,
    performance: /### Performance Audits[\s\S]*?\|([\s\S]*?)\n\n/,
    refactoring: /### Refactoring Audits[\s\S]*?\|([\s\S]*?)\n\n/,
    documentation: /### Documentation Audits[\s\S]*?\|([\s\S]*?)\n\n/,
    process: /### Process Audits[\s\S]*?\|([\s\S]*?)\n\n/
  };

  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    const match = content.match(pattern);
    if (match) {
      // Find the most recent date in the table
      const dateMatches = match[1].match(/\d{4}-\d{2}-\d{2}/g);
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

  const categoryPatterns = {
    code: /### Code Audits[\s\S]*?\|([\s\S]*?)\n\n/,
    security: /### Security Audits[\s\S]*?\|([\s\S]*?)\n\n/,
    performance: /### Performance Audits[\s\S]*?\|([\s\S]*?)\n\n/,
    refactoring: /### Refactoring Audits[\s\S]*?\|([\s\S]*?)\n\n/,
    documentation: /### Documentation Audits[\s\S]*?\|([\s\S]*?)\n\n/,
    process: /### Process Audits[\s\S]*?\|([\s\S]*?)\n\n/
  };

  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    const match = content.match(pattern);
    if (match) {
      // Count rows with dates (excluding header and "No audits yet")
      const dateMatches = match[1].match(/\d{4}-\d{2}-\d{2}/g);
      counts[category] = dateMatches ? dateMatches.length : 0;
    }
  }

  return counts;
}

/**
 * Get commits since a date
 */
function getCommitsSince(sinceDate) {
  const result = safeExec(
    `git rev-list --count --since="${sinceDate}" HEAD`,
    'count commits'
  );
  return result.success ? parseInt(result.output, 10) || 0 : 0;
}

/**
 * Get files modified since a date matching a pattern
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
 * Get security-sensitive file changes
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
 * Get CI/hook file changes
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
 */
function checkCategoryTriggers(category, sinceDate, thresholds) {
  const commits = getCommitsSince(sinceDate);
  let files = [];
  let triggered = false;
  const reasons = [];

  // Get category-specific files
  if (category === 'security') {
    files = getSecuritySensitiveChanges(sinceDate);
    if (files.length >= thresholds.files) {
      triggered = true;
      reasons.push(`${files.length} security-sensitive file(s) changed`);
    }
  } else if (category === 'process') {
    files = getProcessChanges(sinceDate);
    if (files.length >= thresholds.files) {
      triggered = true;
      reasons.push(`${files.length} CI/hook file(s) changed`);
    }
  } else {
    files = getFilesModifiedSince(sinceDate, thresholds.filePattern);
    if (thresholds.excludePattern) {
      files = files.filter(f => !thresholds.excludePattern.test(f));
    }
    if (files.length >= thresholds.files) {
      triggered = true;
      reasons.push(`${files.length} files modified (threshold: ${thresholds.files})`);
    }
  }

  // Check commit threshold
  if (commits >= thresholds.commits) {
    triggered = true;
    reasons.push(`${commits} commits (threshold: ${thresholds.commits})`);
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
 * Check multi-AI escalation triggers
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

  // Check days since ANY audit
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
  }

  // Check total commits since oldest category audit
  const oldestDate = allDates.length > 0
    ? new Date(Math.min(...allDates.map(d => new Date(d)))).toISOString().split('T')[0]
    : '2025-01-01';

  const totalCommits = getCommitsSince(oldestDate);
  if (totalCommits >= MULTI_AI_THRESHOLDS.totalCommits) {
    triggers.push({
      type: 'total_commits',
      commits: totalCommits,
      threshold: MULTI_AI_THRESHOLDS.totalCommits,
      message: `${totalCommits} total commits (threshold: ${MULTI_AI_THRESHOLDS.totalCommits})`
    });
  }

  return triggers;
}

/**
 * Format human-readable output
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
 * Main function
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
      console.error(`Unknown category: ${category}`);
      process.exit(2);
    }

    const sinceDate = sanitizeDateString(categoryDates[category] || '2025-01-01');
    const result = checkCategoryTriggers(category, sinceDate, thresholds);
    categoryResults.push(result);
  }

  // Check multi-AI escalation
  const multiAITriggers = checkMultiAITriggers(auditCounts, categoryDates);

  // Output results
  if (JSON_OUTPUT) {
    console.log(JSON.stringify({
      categoryResults,
      multiAITriggers,
      auditCounts,
      reviewNeeded: categoryResults.some(r => r.triggered) || multiAITriggers.length > 0
    }, null, 2));
  } else {
    formatTextOutput(categoryResults, multiAITriggers, auditCounts);
  }

  // Exit code
  const reviewNeeded = categoryResults.some(r => r.triggered) || multiAITriggers.length > 0;
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
