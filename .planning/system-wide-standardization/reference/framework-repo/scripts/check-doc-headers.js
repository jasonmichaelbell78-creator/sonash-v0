#!/usr/bin/env node
/**
 * Document Header Validation (BLOCKING for new docs)
 *
 * Purpose: Ensures new markdown documents have required headers per doc standards.
 * For Tier 3+ documents, requires: Document Version, Last Updated, Status
 *
 * Exit Codes:
 *   0 - All new docs have proper headers (or no new docs)
 *   1 - New docs missing required headers (blocking)
 *   2 - Error during execution
 *
 * Usage:
 *   node scripts/check-doc-headers.js              # Check staged NEW .md files
 *   node scripts/check-doc-headers.js --all        # Check all staged .md files
 *   node scripts/check-doc-headers.js --verbose    # Show all checks
 *
 * Override: SKIP_DOC_HEADER_CHECK=1 to bypass (use sparingly)
 *
 * Header config is loaded from scripts/config/doc-header-config.json
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Load config helpers if available
let loadConfigWithRegex;
let validateSkipReason;
try {
  ({ loadConfigWithRegex } = require('./config/load-config'));
} catch {
  loadConfigWithRegex = null;
}
try {
  ({ validateSkipReason } = require('./lib/validate-skip-reason'));
} catch {
  validateSkipReason = null;
}

let REPO_ROOT = '';
try {
  REPO_ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  }).trim();
} catch {
  REPO_ROOT = process.cwd();
}

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const checkAll = args.includes('--all');

// TTY-aware colors
const useColors = process.stdout.isTTY;
const colors = {
  red: useColors ? '\x1b[31m' : '',
  green: useColors ? '\x1b[32m' : '',
  yellow: useColors ? '\x1b[33m' : '',
  cyan: useColors ? '\x1b[36m' : '',
  reset: useColors ? '\x1b[0m' : '',
  bold: useColors ? '\x1b[1m' : '',
};

function log(message, color = '') {
  console.log(color ? `${color}${message}${colors.reset}` : message);
}

function getErrorMessage(err) {
  return err instanceof Error ? err.message : String(err);
}

// Header config - CONFIGURABLE
// Try loading from config file, fall back to defaults
let EXEMPT_PATTERNS = [/^README\.md$/i, /^CHANGELOG\.md$/i, /^LICENSE\.md$/i];
let REQUIRED_HEADERS = [
  { name: 'Document Version', pattern: /\*\*Document Version:\*\*/i },
  { name: 'Last Updated', pattern: /\*\*Last Updated:\*\*/i },
  { name: 'Status', pattern: /\*\*Status:\*\*/i },
];
let RECOMMENDED_HEADERS = [];

if (loadConfigWithRegex) {
  try {
    const headerConfig = loadConfigWithRegex('doc-header-config');
    EXEMPT_PATTERNS = headerConfig.exemptPatterns;
    REQUIRED_HEADERS = headerConfig.requiredHeaders;
    RECOMMENDED_HEADERS = headerConfig.recommendedHeaders;
  } catch (err) {
    const msg = getErrorMessage(err);
    log(`Warning: Could not load doc header config, using defaults: ${msg}`, colors.yellow);
  }
}

function isExempt(filePath) {
  const basename = path.basename(filePath);
  return EXEMPT_PATTERNS.some((pattern) => pattern.test(filePath) || pattern.test(basename));
}

function checkDocumentHeaders(filePath) {
  const errors = [];
  const warnings = [];

  try {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(REPO_ROOT, filePath);

    const realRepoRoot = fs.realpathSync(REPO_ROOT);
    const realAbsolutePath = fs.realpathSync(absolutePath);

    const rel = path.relative(realRepoRoot, realAbsolutePath);
    if (rel === '' || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
      return { errors: [`Path outside repository: ${filePath}`], warnings: [] };
    }

    const content = fs.readFileSync(realAbsolutePath, 'utf8');
    const headerSection = content.slice(0, 2000);

    for (const header of REQUIRED_HEADERS) {
      if (!header.pattern.test(headerSection)) {
        errors.push(`Missing required header: ${header.name}`);
      }
    }

    for (const header of RECOMMENDED_HEADERS) {
      if (!header.pattern.test(headerSection)) {
        warnings.push(`Consider adding: ${header.name}`);
      }
    }

    if (!headerSection.includes('prettier-ignore-start') && errors.length === 0) {
      warnings.push('Consider wrapping headers in <!-- prettier-ignore-start/end -->');
    }

    return { errors, warnings };
  } catch (err) {
    return { errors: [`Could not read file: ${getErrorMessage(err)}`], warnings: [] };
  }
}

function getStagedFiles(filter = 'A') {
  try {
    const result = execFileSync(
      'git',
      ['diff', '--cached', '--name-only', '--diff-filter=' + filter, '-z'],
      { encoding: 'utf8' },
    );
    return result
      .split('\0')
      .map((f) => f.trim())
      .filter((f) => f !== '' && f.toLowerCase().endsWith('.md'));
  } catch (err) {
    log(
      `\nError getting staged files. Is git installed and are you in a git repository?`,
      colors.red,
    );
    log(`   ${getErrorMessage(err)}`, colors.red);
    process.exit(2);
  }
}

// eslint-disable-next-line complexity -- main has inherent branching (complexity 23), refactoring would reduce readability
function main() {
  // Override support
  const skipChecks = (process.env.SKIP_CHECKS || '').split(',').map((s) => s.trim());
  if (process.env.SKIP_DOC_HEADER_CHECK === '1' || skipChecks.includes('doc-header')) {
    if (validateSkipReason) {
      const skipResult = validateSkipReason(process.env.SKIP_REASON, 'SKIP_DOC_HEADER_CHECK=1');
      if (!skipResult.valid) {
        log(skipResult.error, colors.red);
        process.exit(1);
      }
    }
    log('SKIP_DOC_HEADER_CHECK=1 set; skipping document header validation.', colors.yellow);
    process.exit(0);
  }

  log('\nDocument Header Validation\n');

  const filter = checkAll ? 'AM' : 'A';
  const filterDesc = checkAll ? 'new and modified' : 'new';
  const stagedFiles = getStagedFiles(filter);

  if (stagedFiles.length === 0) {
    log(`No ${filterDesc} .md files staged`, colors.green);
    process.exit(0);
  }

  const filesToCheck = stagedFiles.filter((f) => !isExempt(f));

  if (filesToCheck.length === 0) {
    log(`All ${filterDesc} .md files are exempt from header checks`, colors.green);
    process.exit(0);
  }

  if (verbose) {
    log(`Checking ${filesToCheck.length} ${filterDesc} .md file(s):\n`, colors.cyan);
  }

  let hasErrors = false;
  const results = [];

  for (const file of filesToCheck) {
    const { errors, warnings } = checkDocumentHeaders(file);
    results.push({ file, errors, warnings });

    if (errors.length > 0) {
      hasErrors = true;
    }
  }

  for (const { file, errors, warnings } of results) {
    if (errors.length > 0) {
      log(`\nERROR: ${file}`, colors.red);
      for (const err of errors) {
        log(`   ${err}`, colors.red);
      }
      if (warnings.length > 0 && verbose) {
        for (const warn of warnings) {
          log(`   WARN: ${warn}`, colors.yellow);
        }
      }
    } else if (verbose) {
      log(`OK: ${file}`, colors.green);
      if (warnings.length > 0) {
        for (const warn of warnings) {
          log(`   WARN: ${warn}`, colors.yellow);
        }
      }
    }
  }

  if (hasErrors) {
    log('\nMissing required document headers\n', colors.red);
    log('Required headers for new documents:', colors.bold);
    log('  <!-- prettier-ignore-start -->');
    log('  **Document Version:** 1.0');
    log('  **Last Updated:** YYYY-MM-DD');
    log('  **Status:** DRAFT | ACTIVE | DEPRECATED');
    log('  <!-- prettier-ignore-end -->\n');
    log('Override (use sparingly): SKIP_DOC_HEADER_CHECK=1 git commit ...\n');
    process.exit(1);
  }

  log(`\nAll ${filesToCheck.length} ${filterDesc} document(s) have required headers`, colors.green);
  process.exit(0);
}

main();
