#!/usr/bin/env node
/**
 * Phase Completion Checklist - AUTOMATED GATE
 *
 * Run this BEFORE marking any phase/milestone complete.
 * This script enforces the mandatory deliverable audit.
 *
 * Usage:
 *   node scripts/phase-complete-check.js                    # Interactive mode
 *   node scripts/phase-complete-check.js --auto             # Fully automated (CI)
 *   node scripts/phase-complete-check.js --plan <path>      # Check specific plan
 *
 * Exit codes:
 *   0 = All checks passed, safe to mark complete
 *   1 = Checks failed, do NOT mark complete
 */

import { execSync } from 'child_process';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const isAutoMode = args.includes('--auto');
const planIndex = args.indexOf('--plan');
const planPath = planIndex !== -1 ? args[planIndex + 1] : null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

/**
 * Extract deliverables from a plan document
 * Looks for patterns like:
 * - [x] or - [ ] followed by text (checkboxes)
 * - Files mentioned in tables with Status columns
 * - Acceptance Criteria sections
 */
function extractDeliverablesFromPlan(planContent) {
  const deliverables = [];

  // Extract file paths mentioned (e.g., path/to/file.md)
  const filePathRegex = /(?:^|\s)([a-zA-Z0-9_\-./]+\.(md|js|ts|tsx|json|yml|yaml|sh))/gm;
  const matches = planContent.match(filePathRegex) || [];

  for (const match of matches) {
    const filePath = match.trim();
    // Skip obvious non-deliverables
    if (!filePath.includes('node_modules') &&
        !filePath.includes('example') &&
        !filePath.startsWith('http') &&
        filePath.length > 3) {
      deliverables.push({
        type: 'file',
        path: filePath,
        required: true
      });
    }
  }

  // Deduplicate
  const seen = new Set();
  return deliverables.filter(d => {
    if (seen.has(d.path)) return false;
    seen.add(d.path);
    return true;
  });
}

/**
 * Verify deliverable exists and has content
 */
function verifyDeliverable(deliverable, projectRoot) {
  const fullPath = path.join(projectRoot, deliverable.path);

  try {
    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.trim().length < 10) {
        return { exists: true, valid: false, reason: 'File exists but appears empty' };
      }
      return { exists: true, valid: true };
    } else if (stat.isDirectory()) {
      return { exists: true, valid: true, reason: 'Directory exists' };
    }
  } catch {
    // File doesn't exist - check if it's in docs/archive (might be archived)
    const archivePath = path.join(projectRoot, 'docs/archive', path.basename(deliverable.path));
    try {
      fs.statSync(archivePath);
      return { exists: true, valid: true, reason: 'Archived' };
    } catch {
      return { exists: false, valid: false, reason: 'File not found' };
    }
  }

  return { exists: false, valid: false, reason: 'Unknown error' };
}

/**
 * Run automated deliverable audit
 */
function runAutomatedDeliverableAudit(planPath, projectRoot) {
  console.log('');
  console.log('━━━ AUTOMATED DELIVERABLE AUDIT ━━━');
  console.log('');

  if (!planPath || !fs.existsSync(planPath)) {
    console.log('  ⚠️  No plan file specified or file not found');
    console.log('     Use --plan <path> to specify a plan document');
    return { passed: true, warnings: ['No plan file for automated audit'] };
  }

  console.log(`  📄 Analyzing: ${planPath}`);

  const planContent = fs.readFileSync(planPath, 'utf-8');
  const deliverables = extractDeliverablesFromPlan(planContent);

  console.log(`  📋 Found ${deliverables.length} potential deliverables`);
  console.log('');

  const results = {
    passed: true,
    verified: 0,
    missing: [],
    warnings: []
  };

  // Only check first 20 most relevant files to avoid noise
  const relevantDeliverables = deliverables
    .filter(d => d.path.includes('/') || d.path.endsWith('.md'))
    .slice(0, 20);

  for (const deliverable of relevantDeliverables) {
    const result = verifyDeliverable(deliverable, projectRoot);

    if (result.exists && result.valid) {
      results.verified++;
    } else if (!result.exists) {
      results.missing.push(deliverable.path);
      if (deliverable.required) {
        results.passed = false;
      }
    } else {
      results.warnings.push(`${deliverable.path}: ${result.reason}`);
    }
  }

  console.log(`  ✅ Verified: ${results.verified} files exist`);

  if (results.missing.length > 0) {
    console.log(`  ⚠️  Missing (${results.missing.length}):`);
    results.missing.slice(0, 5).forEach(f => console.log(`     - ${f}`));
    if (results.missing.length > 5) {
      console.log(`     ... and ${results.missing.length - 5} more`);
    }
  }

  if (results.warnings.length > 0) {
    console.log(`  ⚠️  Warnings (${results.warnings.length}):`);
    results.warnings.slice(0, 3).forEach(w => console.log(`     - ${w}`));
  }

  console.log('');
  return results;
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🔍 PHASE COMPLETION CHECKLIST - AUTOMATED GATE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('This checklist MUST pass before marking any phase complete.');
  console.log('');

  let allPassed = true;
  const failures = [];

  // 1. Automated checks
  console.log('━━━ AUTOMATED CHECKS ━━━');
  console.log('');

  // Lint check - rely on exit code, not output parsing
  console.log('▶ Running ESLint...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('  ✅ ESLint passed');
  } catch {
    console.log('  ❌ ESLint has errors');
    failures.push('ESLint errors must be fixed');
    allPassed = false;
  }

  // Test check
  console.log('▶ Running tests...');
  try {
    execSync('npm test 2>&1', { encoding: 'utf-8' });
    console.log('  ✅ Tests passed');
  } catch {
    console.log('  ❌ Tests failed');
    failures.push('Tests must pass');
    allPassed = false;
  }

  console.log('');

  // 2. Automated deliverable audit (if plan specified)
  const projectRoot = process.cwd();
  const auditResult = runAutomatedDeliverableAudit(planPath, projectRoot);

  if (!auditResult.passed) {
    failures.push('Automated deliverable audit found missing files');
    allPassed = false;
  }

  // 3. Manual verification questions (skip in auto mode)
  if (isAutoMode) {
    console.log('━━━ AUTO MODE - SKIPPING MANUAL QUESTIONS ━━━');
    console.log('');
    console.log('  ⚠️  Running in --auto mode');
    console.log('     Manual verification questions skipped');
    console.log('     Only automated checks performed');
    console.log('');
  } else {
    console.log('━━━ DELIVERABLE AUDIT (Manual Verification) ━━━');
    console.log('');
    console.log('Answer honestly - this protects quality:');
    console.log('');

    const questions = [
      {
        q: 'Have you reviewed the original deliverables list for this phase? (y/n): ',
        fail: 'Must review original deliverables before marking complete'
      },
      {
        q: 'Does EVERY deliverable exist and work correctly? (y/n): ',
        fail: 'All deliverables must exist and function'
      },
      {
        q: 'Have you tested each script/feature with real data? (y/n): ',
        fail: 'All deliverables must be tested'
      },
      {
        q: 'Are acceptance criteria from the plan ALL met? (y/n): ',
        fail: 'All acceptance criteria must be met'
      },
      {
        q: 'Have you documented what was accomplished? (y/n): ',
        fail: 'Work must be documented before completion'
      },
      {
        q: 'Did you run npm run lint AND npm test before EVERY commit? (y/n): ',
        fail: 'Lint and test must run before every commit'
      }
    ];

    for (const { q, fail } of questions) {
      const passed = await ask(q);
      if (!passed) {
        console.log(`  ❌ ${fail}`);
        failures.push(fail);
        allPassed = false;
      } else {
        console.log('  ✅ Confirmed');
      }
    }
  } // end of !isAutoMode block

  console.log('');
  console.log('━━━ RESULT ━━━');
  console.log('');

  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED');
    console.log('');
    console.log('You may now mark this phase as COMPLETE.');
    console.log('');
    rl.close();
    process.exit(0);
  } else {
    console.log('❌ CHECKS FAILED - DO NOT MARK COMPLETE');
    console.log('');
    console.log('Issues to resolve:');
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    console.log('');
    console.log('Fix these issues, then run this check again.');
    console.log('');
    rl.close();
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  rl.close();
  process.exit(1);
});
