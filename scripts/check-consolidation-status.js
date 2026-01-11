#!/usr/bin/env node
/**
 * check-consolidation-status.js
 *
 * Checks AI_REVIEW_LEARNINGS_LOG.md for consolidation status and alerts if threshold exceeded.
 * Run: npm run consolidation:check
 *
 * Exit codes:
 *   0 = OK (under threshold)
 *   1 = Warning (threshold exceeded, consolidation needed)
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_FILE = join(__dirname, '..', 'docs', 'AI_REVIEW_LEARNINGS_LOG.md');
const THRESHOLD = 10;
const ARCHIVE_LINE_THRESHOLD = 2500;

function main() {
  if (!existsSync(LOG_FILE)) {
    console.error('❌ AI_REVIEW_LEARNINGS_LOG.md not found');
    process.exit(2);
  }

  const content = readFileSync(LOG_FILE, 'utf8');
  const lines = content.split('\n');

  // Extract consolidation counter
  const counterMatch = content.match(/\*\*Reviews since last consolidation:\*\* (\d+)/);
  const reviewCount = counterMatch ? parseInt(counterMatch[1], 10) : 0;

  // Extract status
  const statusMatch = content.match(/\*\*Status:\*\* ([^\n]+)/);
  const status = statusMatch ? statusMatch[1].trim() : 'Unknown';

  // Count active lines (rough estimate - everything after archives)
  const activeLineCount = lines.length;

  console.log('📊 Consolidation Status Check');
  console.log('═'.repeat(50));
  console.log(`   Reviews since consolidation: ${reviewCount}`);
  console.log(`   Threshold: ${THRESHOLD}`);
  console.log(`   Status: ${status}`);
  console.log(`   Log lines: ${activeLineCount}`);
  console.log('');

  let exitCode = 0;

  // Check consolidation threshold
  if (reviewCount >= THRESHOLD) {
    console.log(`⚠️  CONSOLIDATION NEEDED: ${reviewCount} reviews pending (threshold: ${THRESHOLD})`);
    console.log('   Run consolidation process to extract patterns to CODE_PATTERNS.md');
    console.log('');
    exitCode = 1;
  } else {
    const remaining = THRESHOLD - reviewCount;
    console.log(`✅ Consolidation OK: ${remaining} reviews until next consolidation`);
  }

  // Check archive threshold
  if (activeLineCount > ARCHIVE_LINE_THRESHOLD) {
    console.log(`⚠️  ARCHIVE RECOMMENDED: ${activeLineCount} lines exceeds ${ARCHIVE_LINE_THRESHOLD} threshold`);
    console.log('   Consider archiving older reviews to docs/archive/');
    console.log('');
    exitCode = Math.max(exitCode, 1);
  } else {
    console.log(`✅ Log size OK: ${activeLineCount} lines (archive at ${ARCHIVE_LINE_THRESHOLD})`);
  }

  console.log('');
  process.exit(exitCode);
}

main();
