#!/usr/bin/env node
/**
 * Phase Completion Checklist - AUTOMATED GATE
 *
 * Run this BEFORE marking any phase/milestone complete.
 * This script enforces the mandatory deliverable audit.
 *
 * Usage: node scripts/phase-complete-check.js
 *
 * Exit codes:
 *   0 = All checks passed, safe to mark complete
 *   1 = Checks failed, do NOT mark complete
 */

import { execSync } from 'child_process';
import * as readline from 'readline';

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

  // Lint check
  console.log('▶ Running ESLint...');
  try {
    const lintOutput = execSync('npm run lint 2>&1', { encoding: 'utf-8' });
    if (lintOutput.includes(' error')) {
      console.log('  ❌ ESLint has errors');
      failures.push('ESLint errors must be fixed');
      allPassed = false;
    } else {
      console.log('  ✅ ESLint passed');
    }
  } catch {
    console.log('  ❌ ESLint failed to run');
    failures.push('ESLint check failed');
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

  // 2. Manual verification questions
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
