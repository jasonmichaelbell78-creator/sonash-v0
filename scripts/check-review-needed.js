#!/usr/bin/env node
/**
 * Check if code review trigger thresholds have been reached
 *
 * Reads:
 * - MULTI_AI_REVIEW_COORDINATOR.md (last review date/baseline)
 * - git log since last review
 * - ESLint current warnings
 * - Test coverage report (if available)
 *
 * Checks:
 * - Commits since last review
 * - Lines changed (git diff --stat)
 * - Files modified count
 * - New files count (*.tsx, *.ts, *.jsx, *.js)
 * - New components (files in components/)
 * - ESLint warning delta
 * - Test coverage percentage
 *
 * Outputs:
 * - Trigger status (reached/not reached)
 * - Current metrics vs thresholds
 * - Recommendation (which review type to run)
 *
 * Usage: node scripts/check-review-needed.js [options]
 * Options:
 *   --update          Update MULTI_AI_REVIEW_COORDINATOR.md with current metrics
 *   --json            Output as JSON instead of human-readable
 *   --dry-run         Show what would change without writing
 *   --verbose         Show detailed logging
 *
 * Exit codes: 0 = no review needed, 1 = review recommended, 2 = error
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// File paths
const COORDINATOR_PATH = join(ROOT, 'docs', 'MULTI_AI_REVIEW_COORDINATOR.md');
const COVERAGE_PATH = join(ROOT, 'coverage', 'coverage-summary.json');

// Thresholds for triggering reviews
const THRESHOLDS = {
  commits: 50,          // Commits since last review
  linesChanged: 1000,   // Lines changed
  filesModified: 25,    // Files modified
  newFiles: 10,         // New code files
  newComponents: 5,     // New component files
  lintWarningDelta: 10, // Increase in lint warnings
  coverageDrop: 5       // Percentage points drop in coverage
};

// Parse command line arguments
const args = process.argv.slice(2);
const UPDATE = args.includes('--update');
const JSON_OUTPUT = args.includes('--json');
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

/**
 * Safely log verbose messages
 * @param {...any} messages - Messages to log
 */
function verbose(...messages) {
  if (VERBOSE && !JSON_OUTPUT) {
    console.log('[VERBOSE]', ...messages);
  }
}

/**
 * Validate and sanitize ISO date string to prevent command injection
 * @param {string} dateString - Date string to validate
 * @returns {string} - Validated date string or safe fallback
 */
function sanitizeDateString(dateString) {
  // Only allow ISO date format: YYYY-MM-DD (with optional time)
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;

  if (!dateString || typeof dateString !== 'string') {
    verbose('Invalid date string, using fallback');
    return '2025-01-01';
  }

  const trimmed = dateString.trim();

  if (!isoDatePattern.test(trimmed)) {
    verbose(`Date string "${trimmed}" does not match ISO format, using fallback`);
    return '2025-01-01';
  }

  // Additional validation: ensure it parses to a valid date
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    verbose(`Date string "${trimmed}" is not a valid date, using fallback`);
    return '2025-01-01';
  }

  return trimmed;
}

/**
 * Safely read a file with error handling
 * @param {string} filePath - Path to file
 * @param {string} description - Human-readable description for errors
 * @returns {{success: boolean, content?: string, error?: string}}
 */
function safeReadFile(filePath, description) {
  verbose(`Reading ${description} from ${filePath}`);

  if (!existsSync(filePath)) {
    return {
      success: false,
      error: `${description} not found at: ${filePath}`
    };
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    verbose(`Successfully read ${content.length} characters from ${description}`);
    return { success: true, content };
  } catch (error) {
    return {
      success: false,
      error: `Failed to read ${description}: ${error.message}`
    };
  }
}

/**
 * Safely write a file with error handling
 * @param {string} filePath - Path to file
 * @param {string} content - Content to write
 * @param {string} description - Human-readable description for errors
 * @returns {{success: boolean, error?: string}}
 */
function safeWriteFile(filePath, content, description) {
  if (DRY_RUN) {
    if (!JSON_OUTPUT) {
      console.log(`[DRY RUN] Would write ${content.length} characters to ${description}`);
    }
    return { success: true };
  }

  verbose(`Writing ${content.length} characters to ${description}`);

  try {
    writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to write ${description}: ${error.message}`
    };
  }
}

/**
 * Run a shell command safely
 * @param {string} command - Command to run
 * @param {string} description - Description for logging
 * @returns {{success: boolean, output?: string, error?: string}}
 */
function safeExec(command, description) {
  verbose(`Running: ${command}`);

  try {
    const output = execSync(command, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    verbose(`${description}: ${output.trim().slice(0, 100)}...`);
    return { success: true, output: output.trim() };
  } catch (error) {
    // Some commands return non-zero but still have useful output
    if (error.stdout) {
      return { success: true, output: error.stdout.trim() };
    }
    return {
      success: false,
      error: `Failed to run ${description}: ${error.message}`
    };
  }
}

/**
 * Get the last review date from coordinator
 * @param {string} content - Coordinator file content
 * @returns {string|null} - ISO date string or null
 */
function getLastReviewDate(content) {
  // Try to find date in baseline section
  const baselineMatch = content.match(/### Current Project Baseline[\s\S]*?\*\*Last Updated:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  if (baselineMatch) {
    verbose(`Found baseline date: ${baselineMatch[1]}`);
    return baselineMatch[1];
  }

  // Try audit history
  const auditMatch = content.match(/### Completed Reviews[\s\S]*?\|\s*(\d{4}-\d{2}-\d{2})\s*\|/);
  if (auditMatch) {
    verbose(`Found audit date: ${auditMatch[1]}`);
    return auditMatch[1];
  }

  // Fall back to document Last Updated
  const docMatch = content.match(/\*\*Last Updated:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  if (docMatch) {
    verbose(`Found document date: ${docMatch[1]}`);
    return docMatch[1];
  }

  return null;
}

/**
 * Get baseline lint warnings from coordinator
 * @param {string} content - Coordinator file content
 * @returns {number} - Baseline warning count or 0
 */
function getBaselineLintWarnings(content) {
  const match = content.match(/lint_warnings:\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Get baseline test coverage from coordinator
 * @param {string} content - Coordinator file content
 * @returns {number} - Baseline coverage percentage or 0
 */
function getBaselineCoverage(content) {
  const match = content.match(/test_pass_rate:\s*([\d.]+)%/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Count commits since a given date
 * @param {string} sinceDate - ISO date string
 * @returns {number} - Commit count
 */
function getCommitsSince(sinceDate) {
  const result = safeExec(
    `git rev-list --count --since="${sinceDate}" HEAD`,
    'count commits'
  );

  if (!result.success) {
    verbose(`Warning: ${result.error}`);
    return 0;
  }

  return parseInt(result.output, 10) || 0;
}

/**
 * Get lines changed since a date
 * @param {string} sinceDate - ISO date string
 * @returns {{added: number, deleted: number}}
 */
function getLinesChanged(sinceDate) {
  const result = safeExec(
    `git log --since="${sinceDate}" --shortstat --oneline | grep -E "\\d+ insertion|\\d+ deletion" | awk '{s+=$4; d+=$6} END {print s, d}'`,
    'lines changed'
  );

  if (!result.success || !result.output.trim()) {
    return { added: 0, deleted: 0 };
  }

  const [added, deleted] = result.output.split(' ').map(n => parseInt(n, 10) || 0);
  return { added, deleted };
}

/**
 * Get files modified since a date
 * @param {string} sinceDate - ISO date string
 * @returns {number} - File count
 */
function getFilesModified(sinceDate) {
  const result = safeExec(
    `git log --since="${sinceDate}" --name-only --pretty=format: | sort -u | grep -v "^$" | wc -l`,
    'files modified'
  );

  if (!result.success) {
    return 0;
  }

  return parseInt(result.output, 10) || 0;
}

/**
 * Get new code files since a date
 * @param {string} sinceDate - ISO date string
 * @returns {number} - New file count
 */
function getNewFiles(sinceDate) {
  const result = safeExec(
    `git log --since="${sinceDate}" --diff-filter=A --name-only --pretty=format: | grep -E "\\.(tsx?|jsx?|js)$" | sort -u | wc -l`,
    'new files'
  );

  if (!result.success) {
    return 0;
  }

  return parseInt(result.output, 10) || 0;
}

/**
 * Get new component files since a date
 * @param {string} sinceDate - ISO date string
 * @returns {number} - New component count
 */
function getNewComponents(sinceDate) {
  const result = safeExec(
    `git log --since="${sinceDate}" --diff-filter=A --name-only --pretty=format: | grep -E "^components/.*\\.(tsx?|jsx?)$" | sort -u | wc -l`,
    'new components'
  );

  if (!result.success) {
    return 0;
  }

  return parseInt(result.output, 10) || 0;
}

/**
 * Get current lint warning count
 * @returns {number} - Warning count
 */
function getCurrentLintWarnings() {
  const result = safeExec(
    'npm run lint 2>&1 | grep -c "warning" || echo 0',
    'lint warnings'
  );

  if (!result.success) {
    return 0;
  }

  return parseInt(result.output, 10) || 0;
}

/**
 * Get current test coverage
 * @returns {number|null} - Coverage percentage or null if not available
 */
function getCurrentCoverage() {
  const readResult = safeReadFile(COVERAGE_PATH, 'coverage summary');

  if (!readResult.success) {
    verbose('Coverage file not found, skipping coverage check');
    return null;
  }

  try {
    const coverage = JSON.parse(readResult.content);
    // NYC/Jest format: coverage.total.lines.pct
    if (coverage.total && coverage.total.lines) {
      return coverage.total.lines.pct;
    }
    // Alternative format
    if (coverage.lines) {
      return coverage.lines.pct;
    }
    return null;
  } catch (error) {
    verbose(`Failed to parse coverage: ${error.message}`);
    return null;
  }
}

/**
 * Analyze security-sensitive changes
 * @param {string} sinceDate - ISO date string
 * @returns {string[]} - List of security-sensitive files changed
 */
function getSecuritySensitiveChanges(sinceDate) {
  const result = safeExec(
    `git log --since="${sinceDate}" --name-only --pretty=format: | grep -iE "(auth|security|firebase|api|secrets|env|token|credential)" | sort -u`,
    'security changes'
  );

  if (!result.success || !result.output.trim()) {
    return [];
  }

  return result.output.split('\n').filter(f => f.trim());
}

/**
 * Determine which review type is recommended
 * @param {object} metrics - Collected metrics
 * @param {object} triggers - Active triggers
 * @returns {string} - Review type recommendation
 */
function getReviewRecommendation(metrics, triggers) {
  const activeCount = Object.values(triggers).filter(t => t.triggered).length;

  if (activeCount === 0) {
    return 'No review needed';
  }

  // Security takes priority
  if (metrics.securityFiles && metrics.securityFiles.length > 0) {
    return 'Security Audit recommended';
  }

  // Performance if significant changes
  if (triggers.linesChanged.triggered || triggers.newComponents.triggered) {
    return 'Performance Audit recommended';
  }

  // Default to code review
  return 'Code Review recommended';
}

/**
 * Update coordinator with current metrics
 * @param {string} content - Current coordinator content
 * @param {object} metrics - Collected metrics
 * @returns {string} - Updated content
 */
function updateCoordinatorMetrics(content, metrics) {
  const today = new Date().toISOString().split('T')[0];

  // Update last updated date in baseline section
  let updated = content.replace(
    /(### Current Project Baseline[\s\S]*?\*\*Last Updated:\*\*\s*)(\d{4}-\d{2}-\d{2})/,
    `$1${today}`
  );

  // Update lint warnings if we have them
  if (metrics.currentLintWarnings !== undefined) {
    updated = updated.replace(
      /lint_warnings:\s*\[?[^\n\]]*\]?/,
      `lint_warnings: ${metrics.currentLintWarnings}`
    );
  }

  // Update coverage if we have it
  if (metrics.currentCoverage !== null) {
    updated = updated.replace(
      /test_pass_rate:\s*[\d.]+%/,
      `test_pass_rate: ${metrics.currentCoverage.toFixed(1)}%`
    );
  }

  return updated;
}

/**
 * Format output as human-readable text
 * @param {object} metrics - Collected metrics
 * @param {object} triggers - Trigger statuses
 * @param {string} recommendation - Review recommendation
 */
function formatTextOutput(metrics, triggers, recommendation) {
  console.log('=== Multi-AI Review Trigger Check ===\n');

  console.log(`Last Review: ${metrics.lastReviewDate || 'Unknown'}`);
  console.log(`Days Since: ${metrics.daysSinceReview || 'N/A'}\n`);

  console.log('--- Metrics vs Thresholds ---\n');

  const rows = [
    ['Metric', 'Current', 'Threshold', 'Status'],
    ['Commits', metrics.commits.toString(), THRESHOLDS.commits.toString(),
     triggers.commits.triggered ? '⚠️  TRIGGERED' : '✅ OK'],
    ['Lines Changed', (metrics.linesAdded + metrics.linesDeleted).toString(), THRESHOLDS.linesChanged.toString(),
     triggers.linesChanged.triggered ? '⚠️  TRIGGERED' : '✅ OK'],
    ['Files Modified', metrics.filesModified.toString(), THRESHOLDS.filesModified.toString(),
     triggers.filesModified.triggered ? '⚠️  TRIGGERED' : '✅ OK'],
    ['New Files', metrics.newFiles.toString(), THRESHOLDS.newFiles.toString(),
     triggers.newFiles.triggered ? '⚠️  TRIGGERED' : '✅ OK'],
    ['New Components', metrics.newComponents.toString(), THRESHOLDS.newComponents.toString(),
     triggers.newComponents.triggered ? '⚠️  TRIGGERED' : '✅ OK'],
    ['Lint Warning Δ', metrics.lintDelta.toString(), THRESHOLDS.lintWarningDelta.toString(),
     triggers.lintWarnings.triggered ? '⚠️  TRIGGERED' : '✅ OK']
  ];

  if (metrics.currentCoverage !== null) {
    rows.push([
      'Coverage Drop',
      `${metrics.coverageDrop.toFixed(1)}%`,
      `${THRESHOLDS.coverageDrop}%`,
      triggers.coverageDrop.triggered ? '⚠️  TRIGGERED' : '✅ OK'
    ]);
  }

  // Print table
  const colWidths = rows[0].map((_, i) =>
    Math.max(...rows.map(r => r[i].length)) + 2
  );

  for (const row of rows) {
    console.log(row.map((cell, i) => cell.padEnd(colWidths[i])).join(''));
  }

  if (metrics.securityFiles && metrics.securityFiles.length > 0) {
    console.log('\n--- Security-Sensitive Changes ---');
    for (const file of metrics.securityFiles.slice(0, 10)) {
      console.log(`  🔒 ${file}`);
    }
    if (metrics.securityFiles.length > 10) {
      console.log(`  ... and ${metrics.securityFiles.length - 10} more`);
    }
  }

  console.log('\n--- Recommendation ---');
  const triggeredCount = Object.values(triggers).filter(t => t.triggered).length;

  if (triggeredCount === 0) {
    console.log('✅ No review triggers active. Continue development.');
  } else {
    console.log(`⚠️  ${triggeredCount} trigger(s) active!`);
    console.log(`📋 ${recommendation}`);
  }
}

/**
 * Main function
 */
function main() {
  if (!JSON_OUTPUT) {
    console.log('🔍 Checking Review Triggers...');
    if (DRY_RUN) console.log('   (DRY RUN - no files will be modified)\n');
    else console.log('');
  }

  // Step 1: Read coordinator file
  const coordResult = safeReadFile(COORDINATOR_PATH, 'MULTI_AI_REVIEW_COORDINATOR.md');
  if (!coordResult.success) {
    if (JSON_OUTPUT) {
      console.log(JSON.stringify({ error: coordResult.error }));
    } else {
      console.warn(`⚠️  Warning: ${coordResult.error}`);
      console.warn('   Using default baseline values\n');
    }
  }

  const coordContent = coordResult.success ? coordResult.content : '';

  // Step 2: Get baseline values
  // Sanitize date to prevent command injection in git commands
  const lastReviewDate = sanitizeDateString(getLastReviewDate(coordContent) || '2025-01-01');
  const baselineLintWarnings = getBaselineLintWarnings(coordContent);
  const baselineCoverage = getBaselineCoverage(coordContent);

  verbose(`Baseline - Date: ${lastReviewDate}, Warnings: ${baselineLintWarnings}, Coverage: ${baselineCoverage}%`);

  // Calculate days since review
  const daysSinceReview = Math.floor(
    (Date.now() - new Date(lastReviewDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Step 3: Collect current metrics
  const commits = getCommitsSince(lastReviewDate);
  const { added: linesAdded, deleted: linesDeleted } = getLinesChanged(lastReviewDate);
  const filesModified = getFilesModified(lastReviewDate);
  const newFiles = getNewFiles(lastReviewDate);
  const newComponents = getNewComponents(lastReviewDate);
  const currentLintWarnings = getCurrentLintWarnings();
  const currentCoverage = getCurrentCoverage();
  const securityFiles = getSecuritySensitiveChanges(lastReviewDate);

  const lintDelta = currentLintWarnings - baselineLintWarnings;
  const coverageDrop = baselineCoverage - (currentCoverage || baselineCoverage);

  const metrics = {
    lastReviewDate,
    daysSinceReview,
    commits,
    linesAdded,
    linesDeleted,
    filesModified,
    newFiles,
    newComponents,
    currentLintWarnings,
    baselineLintWarnings,
    lintDelta,
    currentCoverage,
    baselineCoverage,
    coverageDrop,
    securityFiles
  };

  // Step 4: Check triggers
  const triggers = {
    commits: {
      triggered: commits >= THRESHOLDS.commits,
      value: commits,
      threshold: THRESHOLDS.commits
    },
    linesChanged: {
      triggered: (linesAdded + linesDeleted) >= THRESHOLDS.linesChanged,
      value: linesAdded + linesDeleted,
      threshold: THRESHOLDS.linesChanged
    },
    filesModified: {
      triggered: filesModified >= THRESHOLDS.filesModified,
      value: filesModified,
      threshold: THRESHOLDS.filesModified
    },
    newFiles: {
      triggered: newFiles >= THRESHOLDS.newFiles,
      value: newFiles,
      threshold: THRESHOLDS.newFiles
    },
    newComponents: {
      triggered: newComponents >= THRESHOLDS.newComponents,
      value: newComponents,
      threshold: THRESHOLDS.newComponents
    },
    lintWarnings: {
      triggered: lintDelta >= THRESHOLDS.lintWarningDelta,
      value: lintDelta,
      threshold: THRESHOLDS.lintWarningDelta
    },
    coverageDrop: {
      triggered: currentCoverage !== null && coverageDrop >= THRESHOLDS.coverageDrop,
      value: coverageDrop,
      threshold: THRESHOLDS.coverageDrop
    }
  };

  const recommendation = getReviewRecommendation(metrics, triggers);
  const reviewNeeded = Object.values(triggers).some(t => t.triggered);

  // Step 5: Output results
  if (JSON_OUTPUT) {
    console.log(JSON.stringify({
      metrics,
      triggers,
      recommendation,
      reviewNeeded
    }, null, 2));
  } else {
    formatTextOutput(metrics, triggers, recommendation);
  }

  // Step 6: Update coordinator if requested
  if (UPDATE && coordResult.success) {
    if (!JSON_OUTPUT) {
      console.log('\n--- Updating Coordinator ---');
    }

    const updatedContent = updateCoordinatorMetrics(coordContent, metrics);
    const writeResult = safeWriteFile(COORDINATOR_PATH, updatedContent, 'MULTI_AI_REVIEW_COORDINATOR.md');

    if (!writeResult.success) {
      if (!JSON_OUTPUT) {
        console.error(`❌ Error: ${writeResult.error}`);
      }
      process.exit(2);
    }

    if (!JSON_OUTPUT && !DRY_RUN) {
      console.log('✅ Updated MULTI_AI_REVIEW_COORDINATOR.md with current metrics');
    }
  }

  // Exit with appropriate code
  process.exit(reviewNeeded ? 1 : 0);
}

// Run main function
try {
  main();
} catch (error) {
  if (JSON_OUTPUT) {
    console.log(JSON.stringify({ error: error.message }));
  } else {
    console.error('❌ Unexpected error:', error.message);
    if (VERBOSE) {
      console.error(error.stack);
    }
  }
  process.exit(2);
}
