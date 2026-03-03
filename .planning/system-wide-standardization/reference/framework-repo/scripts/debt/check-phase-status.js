#!/usr/bin/env node
/**
 * TDMS Phase Status Checker
 *
 * Checks implementation progress by looking for PHASE_N_AUDIT.md files.
 * The audit files ARE the source of truth for phase completion.
 *
 * Usage: node scripts/debt/check-phase-status.js
 */

const { existsSync, readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { sanitizeError } = require('../lib/sanitize-error.js');

const DEBT_DIR = process.env.TDMS_DEBT_DIR || 'docs/technical-debt';

// Configurable phase definitions - adapt to your project's TDMS phases
const PHASES = [
  { num: '1', name: 'Consolidation' },
  { num: '2', name: 'Procedure', file: 'PROCEDURE.md' },
  { num: '3', name: 'Intake scripts' },
  { num: '4', name: 'Validation scripts' },
  { num: '5', name: 'Update audit skills' },
  { num: '6', name: 'Create intake skills' },
  { num: '7', name: 'Pre-commit hooks' },
  { num: '8', name: 'CI checks' },
  { num: '9', name: 'Verification skill' },
  { num: '10', name: 'Automation' },
  { num: '11', name: 'Integration' },
  { num: '12', name: 'Review' },
  { num: '13', name: 'Archive' },
  { num: '14', name: 'Dashboard' },
  { num: '15', name: 'Verification batches' },
  { num: '16', name: 'Final doc sync' },
  { num: '17', name: 'Final System Audit', file: 'FINAL_SYSTEM_AUDIT.md' },
];

function getAuditFile(phase) {
  if (phase.file) return phase.file;
  return `PHASE_${phase.num}_AUDIT.md`;
}

function checkPhaseStatus(phase) {
  const file = getAuditFile(phase);
  const path = join(DEBT_DIR, file);

  try {
    if (!existsSync(path)) {
      return { complete: false, file };
    }
    const content = readFileSync(path, 'utf-8');
    const statusMatch = content.match(/\*\*Status:\*\*\s*(PASS|FAIL)/i);
    const dateMatch = content.match(/\*\*Audit Date:\*\*\s*(\d{4}-\d{2}-\d{2})/i);

    const status = statusMatch ? statusMatch[1].toUpperCase() : 'UNKNOWN';
    return {
      complete: status === 'PASS',
      status,
      date: dateMatch ? dateMatch[1] : 'UNKNOWN',
      file,
    };
  } catch (error) {
    console.warn(`Warning: Could not read ${file}: ${sanitizeError(error)}`);
    return { complete: false, status: 'READ_ERROR', file };
  }
}

function main() {
  console.log('TDMS Implementation Phase Status\n');
  console.log('Source of truth: ' + DEBT_DIR + '/PHASE_N_AUDIT.md files\n');
  console.log('-'.repeat(70));

  let completed = 0;
  let pending = 0;

  for (const phase of PHASES) {
    const status = checkPhaseStatus(phase);
    const icon = status.complete ? '[DONE]' : '[    ]';

    if (status.complete) {
      completed++;
      const dateStr = status.date !== 'UNKNOWN' ? ` (${status.date})` : '';
      const statusStr = status.status !== 'UNKNOWN' ? ` - ${status.status}` : '';
      console.log(`${icon} Phase ${phase.num}: ${phase.name}${statusStr}${dateStr}`);
    } else if (phase.note) {
      console.log(`[DONE] Phase ${phase.num}: ${phase.name} - ${phase.note}`);
      completed++;
    } else {
      pending++;
      console.log(`${icon} Phase ${phase.num}: ${phase.name}`);
    }
  }

  console.log('-'.repeat(70));
  console.log(`\nProgress: ${completed}/${PHASES.length} phases complete`);
  console.log(`   Remaining: ${pending} phases\n`);

  // List existing audit files
  if (existsSync(DEBT_DIR)) {
    try {
      const files = readdirSync(DEBT_DIR).filter(
        (f) => f.startsWith('PHASE_') && f.endsWith('_AUDIT.md'),
      );
      if (files.length > 0) {
        console.log('Audit files found:');
        files.forEach((f) => console.log(`   - ${f}`));
      }
    } catch (error) {
      console.warn(`Warning: Could not list directory: ${sanitizeError(error)}`);
    }
  }
}

main();
