#!/usr/bin/env node

/**
 * CANON JSONL Schema Validator
 *
 * Validates CANON-*.jsonl files against the expected schema defined in
 * docs/templates/MULTI_AI_AGGREGATOR_TEMPLATE.md
 *
 * Usage:
 *   node scripts/validate-canon-schema.js [file-or-directory]
 *   node scripts/validate-canon-schema.js docs/reviews/2026-Q1/canonical/
 *   node scripts/validate-canon-schema.js docs/reviews/2026-Q1/canonical/CANON-CODE.jsonl
 *
 * Exit codes:
 *   0 - All files valid
 *   1 - Validation errors found
 *   2 - Usage/file access error
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

// Required fields per MULTI_AI_AGGREGATOR_TEMPLATE.md
const REQUIRED_FIELDS = [
  'canonical_id',
  'category',
  'title',
  'severity',
  'effort',
  'files'
];

// Strongly recommended fields
const RECOMMENDED_FIELDS = [
  'confidence',
  'consensus',
  'why_it_matters',
  'suggested_fix'
];

// Valid enum values
const VALID_SEVERITY = ['S0', 'S1', 'S2', 'S3'];
const VALID_EFFORT = ['E0', 'E1', 'E2', 'E3'];
const VALID_STATUS = ['CONFIRMED', 'SUSPECTED', 'NEW', 'TRACKED_ELSEWHERE'];

// ID format regex: CANON-XXXX (4 digits)
const CANON_ID_REGEX = /^CANON-\d{4}$/;

// Alternative ID formats (for reporting, not valid)
const ALT_ID_PATTERNS = [
  { pattern: /^F-\d{3}$/, name: 'Security (F-XXX)' },
  { pattern: /^PERF-\d{3}$/, name: 'Performance (PERF-XXX)' },
  { pattern: /^CANON-R-\d{3}$/, name: 'Refactoring (CANON-R-XXX)' },
  { pattern: /^CANON-D-\d{3}$/, name: 'Documentation (CANON-D-XXX)' },
  { pattern: /^CANON-P-\d{3}$/, name: 'Process (CANON-P-XXX)' }
];

class ValidationResult {
  constructor(filename) {
    this.filename = filename;
    this.errors = [];
    this.warnings = [];
    this.findings = 0;
    this.fieldCoverage = {};
  }

  addError(line, field, message) {
    this.errors.push({ line, field, message });
  }

  addWarning(line, field, message) {
    this.warnings.push({ line, field, message });
  }

  get isValid() {
    return this.errors.length === 0;
  }

  get compliance() {
    if (this.findings === 0) return 0;
    const totalFields = REQUIRED_FIELDS.length + RECOMMENDED_FIELDS.length;
    let presentCount = 0;
    for (const field of [...REQUIRED_FIELDS, ...RECOMMENDED_FIELDS]) {
      if (this.fieldCoverage[field] === this.findings) {
        presentCount++;
      }
    }
    return Math.round((presentCount / totalFields) * 100);
  }
}

function validateFinding(finding, lineNum, result) {
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in finding)) {
      result.addError(lineNum, field, `Missing required field: ${field}`);
    }
  }

  // Check recommended fields
  for (const field of RECOMMENDED_FIELDS) {
    if (!(field in finding)) {
      result.addWarning(lineNum, field, `Missing recommended field: ${field}`);
    }
  }

  // Track field coverage
  for (const field of [...REQUIRED_FIELDS, ...RECOMMENDED_FIELDS]) {
    if (!(field in result.fieldCoverage)) {
      result.fieldCoverage[field] = 0;
    }
    if (field in finding) {
      result.fieldCoverage[field]++;
    }
  }

  // Validate canonical_id format
  if (finding.canonical_id) {
    if (!CANON_ID_REGEX.test(finding.canonical_id)) {
      let altFormat = 'Unknown';
      for (const alt of ALT_ID_PATTERNS) {
        if (alt.pattern.test(finding.canonical_id)) {
          altFormat = alt.name;
          break;
        }
      }
      result.addError(
        lineNum,
        'canonical_id',
        `Invalid ID format: "${finding.canonical_id}" (detected: ${altFormat}, expected: CANON-XXXX)`
      );
    }
  }

  // Validate severity
  if (finding.severity && !VALID_SEVERITY.includes(finding.severity)) {
    result.addError(lineNum, 'severity', `Invalid severity: "${finding.severity}" (expected: ${VALID_SEVERITY.join(', ')})`);
  }

  // Validate effort
  if (finding.effort && !VALID_EFFORT.includes(finding.effort)) {
    result.addError(lineNum, 'effort', `Invalid effort: "${finding.effort}" (expected: ${VALID_EFFORT.join(', ')})`);
  }

  // Validate status if present
  if (finding.status && !VALID_STATUS.includes(finding.status)) {
    result.addWarning(lineNum, 'status', `Non-standard status: "${finding.status}" (expected: ${VALID_STATUS.join(', ')})`);
  }

  // Validate files is array
  if (finding.files && !Array.isArray(finding.files)) {
    result.addError(lineNum, 'files', `"files" must be an array, got: ${typeof finding.files}`);
  }

  // Validate confidence range
  if ('confidence' in finding || 'final_confidence' in finding) {
    const conf = finding.confidence ?? finding.final_confidence;
    if (typeof conf === 'number' && (conf < 0 || conf > 100)) {
      result.addWarning(lineNum, 'confidence', `Confidence out of range: ${conf} (expected: 0-100)`);
    }
  }

  // Check for consensus field variations
  if ('consensus_score' in finding && typeof finding.consensus_score !== 'number') {
    result.addWarning(lineNum, 'consensus_score', `consensus_score should be number, got: ${typeof finding.consensus_score}`);
  }
  if ('consensus' in finding && typeof finding.consensus === 'string' && finding.consensus.includes('/')) {
    result.addWarning(lineNum, 'consensus', `consensus as string "X/Y" should be normalized to number`);
  }
}

function validateFile(filepath) {
  const result = new ValidationResult(basename(filepath));

  let content;
  try {
    content = readFileSync(filepath, 'utf-8');
  } catch (err) {
    result.addError(0, 'file', `Cannot read file: ${err.message}`);
    return result;
  }

  const lines = content.trim().split('\n');
  const seenIds = new Map(); // Track seen IDs for duplicate detection

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let finding;
    try {
      finding = JSON.parse(line);
    } catch (err) {
      result.addError(i + 1, 'json', `Invalid JSON: ${err.message}`);
      continue;
    }

    result.findings++;

    // Check for duplicate IDs
    if (finding.canonical_id) {
      if (seenIds.has(finding.canonical_id)) {
        result.addError(
          i + 1,
          'canonical_id',
          `Duplicate ID: "${finding.canonical_id}" (first seen on line ${seenIds.get(finding.canonical_id)})`
        );
      } else {
        seenIds.set(finding.canonical_id, i + 1);
      }
    }

    validateFinding(finding, i + 1, result);
  }

  return result;
}

function printResult(result) {
  const status = result.isValid ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  console.log(`\n${status} ${result.filename} (${result.findings} findings, ${result.compliance}% compliance)`);

  if (result.errors.length > 0) {
    console.log('\x1b[31m  Errors:\x1b[0m');
    for (const err of result.errors.slice(0, 10)) {
      console.log(`    Line ${err.line}: [${err.field}] ${err.message}`);
    }
    if (result.errors.length > 10) {
      console.log(`    ... and ${result.errors.length - 10} more errors`);
    }
  }

  if (result.warnings.length > 0 && process.argv.includes('--verbose')) {
    console.log('\x1b[33m  Warnings:\x1b[0m');
    for (const warn of result.warnings.slice(0, 5)) {
      console.log(`    Line ${warn.line}: [${warn.field}] ${warn.message}`);
    }
    if (result.warnings.length > 5) {
      console.log(`    ... and ${result.warnings.length - 5} more warnings`);
    }
  }

  // Field coverage summary (includes both required and recommended fields to match compliance calculation)
  if (process.argv.includes('--coverage')) {
    console.log('  Field Coverage:');
    console.log('    Required:');
    for (const field of REQUIRED_FIELDS) {
      const count = result.fieldCoverage[field] || 0;
      const pct = result.findings > 0 ? Math.round((count / result.findings) * 100) : 0;
      const indicator = pct === 100 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
      console.log(`      ${indicator} ${field}: ${count}/${result.findings} (${pct}%)`);
    }
    console.log('    Recommended:');
    for (const field of RECOMMENDED_FIELDS) {
      const count = result.fieldCoverage[field] || 0;
      const pct = result.findings > 0 ? Math.round((count / result.findings) * 100) : 0;
      const indicator = pct === 100 ? '\x1b[32m✓\x1b[0m' : '\x1b[33m○\x1b[0m';
      console.log(`      ${indicator} ${field}: ${count}/${result.findings} (${pct}%)`);
    }
  }
}

function printSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const valid = results.filter(r => r.isValid).length;
  const total = results.length;
  const totalFindings = results.reduce((sum, r) => sum + r.findings, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const avgCompliance = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.compliance, 0) / results.length)
    : 0;

  console.log(`Files:      ${valid}/${total} valid`);
  console.log(`Findings:   ${totalFindings} total`);
  console.log(`Errors:     ${totalErrors}`);
  console.log(`Compliance: ${avgCompliance}% average`);

  if (totalErrors > 0) {
    console.log('\n\x1b[31mValidation failed.\x1b[0m');
    console.log('Run with --verbose for warnings, --coverage for field details.');
  } else {
    console.log('\n\x1b[32mAll files valid.\x1b[0m');
  }
}

function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));

  if (args.length === 0) {
    // Default: validate all CANON files in docs/reviews/*/canonical/
    args.push('docs/reviews');
  }

  const files = [];

  for (const arg of args) {
    if (!existsSync(arg)) {
      console.error(`Error: Path not found: ${arg}`);
      process.exit(2);
    }

    let stat;
    try {
      stat = statSync(arg);
    } catch (err) {
      console.error(`Error accessing path ${arg}: ${err.message}`);
      continue;
    }

    if (stat.isDirectory()) {
      // Recursively find CANON-*.jsonl files
      const findCanonFiles = (dir) => {
        let entries;
        try {
          entries = readdirSync(dir);
        } catch (err) {
          console.error(`Error reading directory ${dir}: ${err.message}`);
          return;
        }

        for (const entry of entries) {
          const fullPath = join(dir, entry);
          try {
            const entryStat = statSync(fullPath);
            if (entryStat.isDirectory()) {
              findCanonFiles(fullPath);
            } else if (entry.startsWith('CANON-') && entry.endsWith('.jsonl')) {
              files.push(fullPath);
            }
          } catch (err) {
            console.error(`Error accessing path ${fullPath}: ${err.message}`);
          }
        }
      };
      findCanonFiles(arg);
    } else if (arg.endsWith('.jsonl')) {
      files.push(arg);
    }
  }

  if (files.length === 0) {
    console.log('No CANON-*.jsonl files found.');
    process.exit(0);
  }

  console.log(`Validating ${files.length} CANON file(s)...`);

  const results = files.map(f => validateFile(f));
  results.forEach(printResult);
  printSummary(results);

  const hasErrors = results.some(r => !r.isValid);
  process.exit(hasErrors ? 1 : 0);
}

main();
