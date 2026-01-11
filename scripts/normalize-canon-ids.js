#!/usr/bin/env node

/**
 * CANON ID Normalizer
 *
 * Normalizes CANON-*.jsonl files to use consistent CANON-XXXX ID format.
 * Maintains a global ID counter across all files to ensure uniqueness.
 *
 * Usage:
 *   node scripts/normalize-canon-ids.js [directory]
 *   node scripts/normalize-canon-ids.js docs/reviews/2026-Q1/canonical/
 *   node scripts/normalize-canon-ids.js --dry-run  # Preview changes
 *
 * The script will:
 *   1. Read all CANON-*.jsonl files in the directory
 *   2. Sort findings within each file by: severity (S0→S3), confidence (desc), effort (E0→E3)
 *   3. Assign new sequential IDs: CANON-0001, CANON-0002, ...
 *   4. Create an ID mapping file for reference
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const SEVERITY_ORDER = { S0: 0, S1: 1, S2: 2, S3: 3 };
const EFFORT_ORDER = { E0: 0, E1: 1, E2: 2, E3: 3 };

// Category order for processing (determines ID ranges)
const CATEGORY_ORDER = ['CODE', 'SECURITY', 'PERF', 'REFACTOR', 'DOCS', 'PROCESS'];

function getCategoryFromFilename(filename) {
  if (filename.includes('CODE')) return 'CODE';
  if (filename.includes('SECURITY')) return 'SECURITY';
  if (filename.includes('PERF')) return 'PERF';
  if (filename.includes('REFACTOR')) return 'REFACTOR';
  if (filename.includes('DOCS')) return 'DOCS';
  if (filename.includes('PROCESS')) return 'PROCESS';
  return 'UNKNOWN';
}

function getConfidence(finding) {
  // Handle various confidence field names
  return finding.confidence ?? finding.final_confidence ?? 50;
}

function getConsensus(finding) {
  // Handle various consensus field names and formats
  if (typeof finding.consensus_score === 'number') return finding.consensus_score;
  if (typeof finding.consensus === 'number') return finding.consensus;
  if (typeof finding.consensus === 'string' && finding.consensus.includes('/')) {
    const [num] = finding.consensus.split('/');
    return parseInt(num, 10);
  }
  if (typeof finding.models_agreeing === 'number') return finding.models_agreeing;
  return 1;
}

function sortFindings(findings) {
  return findings.sort((a, b) => {
    // 1. Severity (S0 first)
    const sevA = SEVERITY_ORDER[a.severity] ?? 99;
    const sevB = SEVERITY_ORDER[b.severity] ?? 99;
    if (sevA !== sevB) return sevA - sevB;

    // 2. Consensus (higher first)
    const consA = getConsensus(a);
    const consB = getConsensus(b);
    if (consA !== consB) return consB - consA;

    // 3. Confidence (higher first)
    const confA = getConfidence(a);
    const confB = getConfidence(b);
    if (confA !== confB) return confB - confA;

    // 4. Effort (lower first)
    const effA = EFFORT_ORDER[a.effort] ?? 99;
    const effB = EFFORT_ORDER[b.effort] ?? 99;
    if (effA !== effB) return effA - effB;

    // 5. Title (alphabetical)
    return (a.title || '').localeCompare(b.title || '');
  });
}

function parseJsonl(content) {
  return content
    .trim()
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}

function toJsonl(findings) {
  return findings.map(f => JSON.stringify(f)).join('\n') + '\n';
}

function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const dryRun = process.argv.includes('--dry-run');
  const verbose = process.argv.includes('--verbose');

  const directory = args[0] || 'docs/reviews/2026-Q1/canonical';

  if (!existsSync(directory)) {
    console.error(`Error: Directory not found: ${directory}`);
    process.exit(2);
  }

  // Find all CANON files
  const files = readdirSync(directory)
    .filter(f => f.startsWith('CANON-') && f.endsWith('.jsonl'))
    .sort((a, b) => {
      const catA = CATEGORY_ORDER.indexOf(getCategoryFromFilename(a));
      const catB = CATEGORY_ORDER.indexOf(getCategoryFromFilename(b));
      return catA - catB;
    });

  if (files.length === 0) {
    console.log('No CANON-*.jsonl files found.');
    process.exit(0);
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Processing ${files.length} CANON files...`);

  const idMapping = [];
  let globalCounter = 1;

  for (const filename of files) {
    const filepath = join(directory, filename);
    const category = getCategoryFromFilename(filename);

    console.log(`\n  ${filename} (${category})`);

    const content = readFileSync(filepath, 'utf-8');
    const findings = parseJsonl(content);
    const sortedFindings = sortFindings(findings);

    const updatedFindings = sortedFindings.map(finding => {
      const oldId = finding.canonical_id;
      const newId = `CANON-${String(globalCounter).padStart(4, '0')}`;

      if (verbose || oldId !== newId) {
        console.log(`    ${oldId} → ${newId}`);
      }

      idMapping.push({
        old_id: oldId,
        new_id: newId,
        category,
        title: finding.title,
        severity: finding.severity
      });

      globalCounter++;

      return {
        ...finding,
        canonical_id: newId
      };
    });

    if (!dryRun) {
      writeFileSync(filepath, toJsonl(updatedFindings));
      console.log(`    ✓ Updated ${updatedFindings.length} findings`);
    } else {
      console.log(`    Would update ${updatedFindings.length} findings`);
    }
  }

  // Write ID mapping file
  const mappingPath = join(directory, 'ID_MAPPING.json');
  const mappingContent = {
    generated: new Date().toISOString(),
    total_findings: globalCounter - 1,
    mapping: idMapping
  };

  if (!dryRun) {
    writeFileSync(mappingPath, JSON.stringify(mappingContent, null, 2));
    console.log(`\n✓ ID mapping saved to ${mappingPath}`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`Files processed: ${files.length}`);
  console.log(`Findings renumbered: ${globalCounter - 1}`);
  console.log(`ID range: CANON-0001 to CANON-${String(globalCounter - 1).padStart(4, '0')}`);

  if (dryRun) {
    console.log('\n[DRY RUN] No files were modified. Run without --dry-run to apply changes.');
  }
}

main();
