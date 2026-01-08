#!/usr/bin/env node
/**
 * validate-audit.js - Post-audit validation for single-session audits
 *
 * Validates JSONL audit findings against:
 * 1. FALSE_POSITIVES.jsonl database
 * 2. Evidence requirements (file:line, code snippets)
 * 3. Cross-reference with external tools (npm audit, ESLint, patterns:check)
 * 4. Confidence scoring validation
 * 5. Duplicate detection
 *
 * Usage:
 *   node scripts/validate-audit.js <audit-file.jsonl>
 *   node scripts/validate-audit.js docs/audits/single-session/security/audit-2026-01-08.jsonl
 *   node scripts/validate-audit.js --all  # Validate all recent audits
 */

import node_fs from 'node:fs';
import node_path from 'node:path';
import node_url from 'node:url';
import { execSync } from 'node:child_process';

const __filename = node_url.fileURLToPath(import.meta.url);
const __dirname = node_path.dirname(__filename);

const FP_FILE = node_path.join(__dirname, '..', 'docs', 'audits', 'FALSE_POSITIVES.jsonl');
const AUDITS_DIR = node_path.join(__dirname, '..', 'docs', 'audits', 'single-session');

// Severity levels for validation strictness
const SEVERITY_LEVELS = { S0: 0, S1: 1, S2: 2, S3: 3 };

// Confidence levels
const CONFIDENCE_LEVELS = { HIGH: 2, MEDIUM: 1, LOW: 0 };

// Required fields by severity
const REQUIRED_FIELDS_BY_SEVERITY = {
  S0: ['id', 'category', 'severity', 'file', 'line', 'title', 'description', 'recommendation', 'evidence', 'confidence'],
  S1: ['id', 'category', 'severity', 'file', 'line', 'title', 'description', 'recommendation', 'evidence', 'confidence'],
  S2: ['id', 'category', 'severity', 'file', 'title', 'description', 'recommendation'],
  S3: ['id', 'category', 'severity', 'title', 'description']
};

function loadFalsePositives() {
  if (!node_fs.existsSync(FP_FILE)) {
    console.warn('⚠️  FALSE_POSITIVES.jsonl not found, skipping FP check');
    return [];
  }
  const content = node_fs.readFileSync(FP_FILE, 'utf8');
  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function loadAuditFindings(filePath) {
  if (!node_fs.existsSync(filePath)) {
    throw new Error(`Audit file not found: ${filePath}`);
  }
  const content = node_fs.readFileSync(filePath, 'utf8');
  return content
    .split('\n')
    .filter(line => line.trim())
    .map((line, index) => {
      try {
        return { ...JSON.parse(line), _lineNumber: index + 1 };
      } catch (err) {
        return { _parseError: err.message, _lineNumber: index + 1, _raw: line };
      }
    });
}

function checkFalsePositives(findings, falsePositives) {
  const flagged = [];

  for (const finding of findings) {
    if (finding._parseError) continue;

    for (const fp of falsePositives) {
      // Check if expired
      if (fp.expires && new Date(fp.expires) < new Date()) continue;

      try {
        const regex = new RegExp(fp.pattern, 'i');
        const searchText = [
          finding.title || '',
          finding.description || '',
          finding.file || '',
          ...(finding.evidence || [])
        ].join(' ');

        if (regex.test(searchText)) {
          flagged.push({
            finding,
            falsePositive: fp,
            match: searchText.match(regex)?.[0]
          });
        }
      } catch (err) {
        console.warn(`⚠️  Invalid regex in FP-${fp.id}: ${fp.pattern}`);
      }
    }
  }

  return flagged;
}

function validateRequiredFields(findings) {
  const issues = [];

  for (const finding of findings) {
    if (finding._parseError) {
      issues.push({
        type: 'PARSE_ERROR',
        line: finding._lineNumber,
        message: `Invalid JSON: ${finding._parseError}`,
        raw: finding._raw
      });
      continue;
    }

    const severity = finding.severity || 'S3';
    const required = REQUIRED_FIELDS_BY_SEVERITY[severity] || REQUIRED_FIELDS_BY_SEVERITY.S3;

    for (const field of required) {
      if (!finding[field]) {
        issues.push({
          type: 'MISSING_FIELD',
          findingId: finding.id,
          severity,
          field,
          message: `${severity} findings require '${field}' field`
        });
      }
    }

    // Validate evidence array for S0/S1
    if ((severity === 'S0' || severity === 'S1') && finding.evidence) {
      if (!Array.isArray(finding.evidence) || finding.evidence.length === 0) {
        issues.push({
          type: 'EMPTY_EVIDENCE',
          findingId: finding.id,
          severity,
          message: `${severity} findings require non-empty evidence array`
        });
      }
    }

    // Validate confidence for S0/S1
    if ((severity === 'S0' || severity === 'S1') && finding.confidence) {
      if (!['HIGH', 'MEDIUM', 'LOW'].includes(finding.confidence)) {
        issues.push({
          type: 'INVALID_CONFIDENCE',
          findingId: finding.id,
          message: `Invalid confidence level: ${finding.confidence} (must be HIGH, MEDIUM, or LOW)`
        });
      }
    }

    // Validate file exists if specified
    if (finding.file && !finding.file.includes('*')) {
      const fullPath = node_path.join(__dirname, '..', finding.file);
      if (!node_fs.existsSync(fullPath)) {
        issues.push({
          type: 'FILE_NOT_FOUND',
          findingId: finding.id,
          file: finding.file,
          message: `Referenced file does not exist: ${finding.file}`
        });
      }
    }
  }

  return issues;
}

function checkDuplicates(findings) {
  const duplicates = [];
  const seen = new Map();

  for (const finding of findings) {
    if (finding._parseError) continue;

    // Create a signature for duplicate detection
    const signature = [
      finding.file || '',
      finding.line || '',
      finding.title || ''
    ].join('|').toLowerCase();

    if (seen.has(signature)) {
      duplicates.push({
        original: seen.get(signature),
        duplicate: finding
      });
    } else {
      seen.set(signature, finding);
    }
  }

  return duplicates;
}

function crossReferenceNpmAudit(findings) {
  const securityFindings = findings.filter(f =>
    !f._parseError && f.category?.toLowerCase().includes('dep')
  );

  if (securityFindings.length === 0) return { validated: [], unvalidated: [] };

  try {
    const output = execSync('npm audit --json 2>/dev/null || true', {
      encoding: 'utf8',
      cwd: node_path.join(__dirname, '..')
    });

    const auditData = JSON.parse(output);
    const vulnerabilities = auditData.vulnerabilities || {};

    const validated = [];
    const unvalidated = [];

    for (const finding of securityFindings) {
      // Try to match against npm audit results
      const packageMatch = Object.keys(vulnerabilities).find(pkg =>
        finding.title?.toLowerCase().includes(pkg.toLowerCase()) ||
        finding.description?.toLowerCase().includes(pkg.toLowerCase())
      );

      if (packageMatch) {
        validated.push({ finding, npmMatch: vulnerabilities[packageMatch] });
      } else {
        unvalidated.push(finding);
      }
    }

    return { validated, unvalidated };
  } catch {
    console.warn('⚠️  npm audit cross-reference failed');
    return { validated: [], unvalidated: securityFindings };
  }
}

function crossReferenceEslint(findings) {
  const codeFindings = findings.filter(f =>
    !f._parseError && (f.category?.toLowerCase().includes('code') || f.category?.toLowerCase().includes('type'))
  );

  if (codeFindings.length === 0) return { validated: [], unvalidated: [] };

  try {
    const output = execSync('npm run lint 2>&1 || true', {
      encoding: 'utf8',
      cwd: node_path.join(__dirname, '..')
    });

    const eslintLines = output.split('\n');
    const validated = [];
    const unvalidated = [];

    for (const finding of codeFindings) {
      if (!finding.file) {
        unvalidated.push(finding);
        continue;
      }

      // Check if ESLint also flagged this file
      const hasEslintWarning = eslintLines.some(line =>
        line.includes(finding.file) &&
        (finding.line ? line.includes(`:${finding.line}`) : true)
      );

      if (hasEslintWarning) {
        validated.push({ finding, eslintMatch: true });
      } else {
        unvalidated.push(finding);
      }
    }

    return { validated, unvalidated };
  } catch {
    console.warn('⚠️  ESLint cross-reference failed');
    return { validated: [], unvalidated: codeFindings };
  }
}

function generateReport(filePath, findings, results) {
  const { falsePositives, fieldIssues, duplicates, npmCrossRef, eslintCrossRef } = results;

  console.log('\n' + '='.repeat(80));
  console.log(`AUDIT VALIDATION REPORT: ${node_path.basename(filePath)}`);
  console.log('='.repeat(80) + '\n');

  console.log(`📊 Total Findings: ${findings.filter(f => !f._parseError).length}`);
  console.log(`   Parse Errors: ${findings.filter(f => f._parseError).length}`);

  // Severity breakdown
  const bySeverity = findings.reduce((acc, f) => {
    if (!f._parseError) {
      acc[f.severity || 'unknown'] = (acc[f.severity || 'unknown'] || 0) + 1;
    }
    return acc;
  }, {});
  console.log(`   Breakdown: ${Object.entries(bySeverity).map(([k, v]) => `${k}:${v}`).join(', ')}`);

  // False Positives
  console.log(`\n🔍 FALSE POSITIVE CHECK (${falsePositives.length} matches)`);
  if (falsePositives.length === 0) {
    console.log('   ✅ No false positives detected');
  } else {
    for (const fp of falsePositives) {
      console.log(`   ⚠️  ${fp.finding.id}: Matches ${fp.falsePositive.id}`);
      console.log(`      Pattern: ${fp.falsePositive.pattern}`);
      console.log(`      Reason: ${fp.falsePositive.reason}`);
    }
  }

  // Field Issues
  console.log(`\n📋 EVIDENCE REQUIREMENTS (${fieldIssues.length} issues)`);
  if (fieldIssues.length === 0) {
    console.log('   ✅ All findings have required fields');
  } else {
    const byType = fieldIssues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
    for (const [type, count] of Object.entries(byType)) {
      console.log(`   ❌ ${type}: ${count} issues`);
    }
    // Show first 5 details
    for (const issue of fieldIssues.slice(0, 5)) {
      console.log(`      - ${issue.findingId || 'Line ' + issue.line}: ${issue.message}`);
    }
    if (fieldIssues.length > 5) {
      console.log(`      ... and ${fieldIssues.length - 5} more`);
    }
  }

  // Duplicates
  console.log(`\n🔁 DUPLICATE CHECK (${duplicates.length} duplicates)`);
  if (duplicates.length === 0) {
    console.log('   ✅ No duplicates detected');
  } else {
    for (const dup of duplicates) {
      console.log(`   ⚠️  ${dup.duplicate.id} duplicates ${dup.original.id}`);
    }
  }

  // Cross-references
  console.log(`\n🔗 CROSS-REFERENCE VALIDATION`);
  console.log(`   npm audit: ${npmCrossRef.validated.length} validated, ${npmCrossRef.unvalidated.length} unvalidated`);
  console.log(`   ESLint: ${eslintCrossRef.validated.length} validated, ${eslintCrossRef.unvalidated.length} unvalidated`);

  // Summary
  const totalIssues = falsePositives.length + fieldIssues.length + duplicates.length;
  console.log('\n' + '='.repeat(80));
  if (totalIssues === 0) {
    console.log('✅ VALIDATION PASSED - No issues found');
  } else {
    console.log(`⚠️  VALIDATION COMPLETED - ${totalIssues} issues to review`);
  }
  console.log('='.repeat(80) + '\n');

  return {
    passed: totalIssues === 0,
    totalFindings: findings.filter(f => !f._parseError).length,
    falsePositiveCount: falsePositives.length,
    fieldIssueCount: fieldIssues.length,
    duplicateCount: duplicates.length
  };
}

function findRecentAudits() {
  const audits = [];
  const categories = ['security', 'code', 'performance', 'refactoring', 'documentation', 'process'];

  for (const category of categories) {
    const categoryDir = node_path.join(AUDITS_DIR, category);
    if (!node_fs.existsSync(categoryDir)) continue;

    const files = node_fs.readdirSync(categoryDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => ({
        path: node_path.join(categoryDir, f),
        name: f,
        category
      }));

    audits.push(...files);
  }

  // Sort by date (newest first)
  return audits.sort((a, b) => b.name.localeCompare(a.name));
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
validate-audit.js - Validate single-session audit findings

Usage:
  node scripts/validate-audit.js <audit-file.jsonl>
  node scripts/validate-audit.js --all
  node scripts/validate-audit.js --recent [n]

Options:
  --all         Validate all audit files
  --recent [n]  Validate the n most recent audits (default: 5)
  --help        Show this help
`);
    process.exit(0);
  }

  const falsePositiveDb = loadFalsePositives();
  console.log(`📚 Loaded ${falsePositiveDb.length} false positive patterns\n`);

  let filesToValidate = [];

  if (args.includes('--all')) {
    filesToValidate = findRecentAudits();
  } else if (args.includes('--recent')) {
    const idx = args.indexOf('--recent');
    const count = Number.parseInt(args[idx + 1], 10) || 5;
    filesToValidate = findRecentAudits().slice(0, count);
  } else if (args[0]) {
    filesToValidate = [{ path: args[0], name: node_path.basename(args[0]) }];
  } else {
    console.error('Error: Please specify an audit file or use --all/--recent');
    process.exit(1);
  }

  if (filesToValidate.length === 0) {
    console.log('No audit files found to validate');
    process.exit(0);
  }

  let allPassed = true;

  for (const file of filesToValidate) {
    try {
      const findings = loadAuditFindings(file.path);

      const results = {
        falsePositives: checkFalsePositives(findings, falsePositiveDb),
        fieldIssues: validateRequiredFields(findings),
        duplicates: checkDuplicates(findings),
        npmCrossRef: crossReferenceNpmAudit(findings),
        eslintCrossRef: crossReferenceEslint(findings)
      };

      const summary = generateReport(file.path, findings, results);
      if (!summary.passed) allPassed = false;

    } catch (err) {
      console.error(`❌ Error validating ${file.path}: ${err.message}`);
      allPassed = false;
    }
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
