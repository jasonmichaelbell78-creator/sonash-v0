#!/usr/bin/env node
/**
 * Multi-Pass Deduplication for TDMS
 *
 * Reads: docs/technical-debt/raw/normalized-all.jsonl
 * Outputs:
 *   - docs/technical-debt/raw/deduped.jsonl (unique items)
 *   - docs/technical-debt/logs/dedup-log.jsonl (merge history)
 *   - docs/technical-debt/raw/review-needed.jsonl (uncertain matches)
 *
 * Deduplication passes:
 * 0. Parametric match: Same file + title differing only in numeric literals
 * 1. Exact match: Same content_hash
 * 2. Near match: Same file + line +/-5 + message similarity >80%
 * 3. Semantic match: Same file + very similar title
 * 4. Cross-source match: SonarCloud rule -> audit finding correlation
 * 5. Systemic pattern grouper: Annotate items with same title across >=3 files
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { safeWriteFileSync } = require('../lib/safe-fs');

const DEBT_DIR = process.env.TDMS_DEBT_DIR || path.join(__dirname, '../../docs/technical-debt');
const INPUT_FILE = path.join(DEBT_DIR, 'raw/normalized-all.jsonl');
const OUTPUT_FILE = path.join(DEBT_DIR, 'raw/deduped.jsonl');
const LOG_FILE = path.join(DEBT_DIR, 'logs/dedup-log.jsonl');
const REVIEW_FILE = path.join(DEBT_DIR, 'raw/review-needed.jsonl');

// Levenshtein distance for string similarity
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function stringSimilarity(a, b) {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeParametric(title) {
  if (!title) return '';
  return title.replace(/\d+/g, '#');
}

function shortHash(str) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 12);
}

function isNearMatch(a, b) {
  if (a.file !== b.file) return false;
  if (!a.file) return false;
  if (!Number.isFinite(a.line) || !Number.isFinite(b.line)) return false;
  if (a.line <= 0 || b.line <= 0) return false;
  const lineDiff = Math.abs(a.line - b.line);
  if (lineDiff > 5) return false;
  const titleSim = stringSimilarity(normalizeText(a.title), normalizeText(b.title));
  if (titleSim < 0.8) return false;
  return true;
}

function isSemanticMatch(a, b) {
  if (a.file !== b.file) return false;
  if (!a.file) return false;
  if (!Number.isFinite(a.line) || !Number.isFinite(b.line)) return false;
  if (a.line <= 0 || b.line <= 0) return false;
  const titleSim = stringSimilarity(normalizeText(a.title), normalizeText(b.title));
  if (titleSim < 0.9) return false;
  return true;
}

const _SONAR_TO_CATEGORY = {
  'javascript:S1854': 'code-quality',
  'typescript:S1854': 'code-quality',
  'javascript:S3776': 'code-quality',
  'typescript:S3776': 'code-quality',
  'javascript:S2245': 'security',
  'typescript:S2245': 'security',
  'javascript:S4830': 'security',
  'typescript:S4830': 'security',
};

// eslint-disable-next-line complexity -- isCrossSourceMatch has inherent branching (complexity 22), refactoring would reduce readability
function isCrossSourceMatch(a, b) {
  const aSourceId = typeof a?.source_id === 'string' ? a.source_id : '';
  const bSourceId = typeof b?.source_id === 'string' ? b.source_id : '';
  if (!aSourceId || !bSourceId) return false;
  const aIsSonar = aSourceId.startsWith('sonarcloud:');
  const bIsSonar = bSourceId.startsWith('sonarcloud:');
  if (aIsSonar === bIsSonar) return false;
  const sonarItem = aIsSonar ? a : b;
  const auditItem = aIsSonar ? b : a;
  if (!sonarItem || !auditItem) return false;
  const sonarFile = typeof sonarItem.file === 'string' ? sonarItem.file : '';
  const auditFile = typeof auditItem.file === 'string' ? auditItem.file : '';
  if (!sonarFile || !auditFile) return false;
  if (sonarFile !== auditFile) return false;
  if (!Number.isFinite(sonarItem.line) || !Number.isFinite(auditItem.line)) return false;
  if (sonarItem.line <= 0 || auditItem.line <= 0) return false;
  const lineDiff = Math.abs(sonarItem.line - auditItem.line);
  if (lineDiff > 10) return false;
  const descSim = stringSimilarity(normalizeText(sonarItem.title), normalizeText(auditItem.title));
  return descSim > 0.7;
}

function canonicalize(v, seen = new WeakSet(), depth = 0) {
  if (depth > 20) return '[TooDeep]';
  if (!v || typeof v !== 'object') return v;
  if (seen.has(v)) return '[Circular]';
  seen.add(v);
  try {
    if (Array.isArray(v)) return v.map((x) => canonicalize(x, seen, depth + 1));
    const out = Object.create(null);
    for (const k of Object.keys(v).sort()) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      out[k] = canonicalize(v[k], seen, depth + 1);
    }
    return out;
  } finally {
    seen.delete(v);
  }
}

function evidenceToKey(e) {
  if (typeof e === 'string') return `str:${e}`;
  if (e == null || typeof e !== 'object') return `prim:${typeof e}:${String(e)}`;
  try {
    return `json:${JSON.stringify(canonicalize(e))}`;
  } catch {
    const keys = (() => {
      try {
        return Object.keys(e).sort().join(',');
      } catch {
        return '';
      }
    })();
    return `[unserializable:${Object.prototype.toString.call(e)}:keys=${keys}]`;
  }
}

function toArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function mergeEvidence(existing, incoming) {
  if (incoming == null) return existing;
  const incomingArr = toArray(incoming);
  const base = toArray(existing);
  const seen = new Set(base.map(evidenceToKey));
  const added = [];
  for (const e of incomingArr) {
    const k = evidenceToKey(e);
    if (seen.has(k)) continue;
    seen.add(k);
    added.push(e);
  }
  return [...base, ...added];
}

function mergeItems(primary, secondary) {
  const merged = { ...primary };
  if (secondary.description && secondary.description.length > (primary.description || '').length) {
    merged.description = secondary.description;
  }
  if (
    secondary.recommendation &&
    secondary.recommendation.length > (primary.recommendation || '').length
  ) {
    merged.recommendation = secondary.recommendation;
  }
  const sevRank = { S0: 0, S1: 1, S2: 2, S3: 3 };
  const primaryRank = sevRank[primary.severity] ?? 99;
  const secondaryRank = sevRank[secondary.severity] ?? 99;
  if (secondaryRank < primaryRank) {
    merged.severity = secondary.severity;
  }
  if (!merged.merged_from) merged.merged_from = [];
  if (typeof secondary.source_id === 'string' && secondary.source_id.trim()) {
    if (!merged.merged_from.includes(secondary.source_id)) {
      merged.merged_from.push(secondary.source_id);
    }
  }
  merged.evidence = mergeEvidence(merged.evidence, secondary.evidence);
  return merged;
}

function readInputItems() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: Input file not found: ${INPUT_FILE}`);
    console.error('   Run normalize-all.js first.');
    process.exit(1);
  }
  let content;
  try {
    content = fs.readFileSync(INPUT_FILE, 'utf8');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err); // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
    console.error(`Error: Failed to read input file: ${errMsg}`);
    process.exit(1);
  }
  const lines = content.split('\n').filter((line) => line.trim());
  const items = [];
  const parseErrors = [];
  for (let i = 0; i < lines.length; i++) {
    try {
      items.push(JSON.parse(lines[i]));
    } catch (err) {
      parseErrors.push({
        line: i + 1,
        message: err instanceof Error ? err.message : String(err), // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
      });
    }
  }
  if (parseErrors.length > 0) {
    console.error(`Warning: ${parseErrors.length} invalid JSON line(s) in input file`);
    for (const e of parseErrors.slice(0, 5)) {
      console.error(`   Line ${e.line}: ${e.message}`);
    }
    if (parseErrors.length > 5) {
      console.error(`   ... and ${parseErrors.length - 5} more`);
    }
    console.log();
  }
  return items;
}

function toLineNumber(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function flagHighSeverityGroup(group, reviewNeeded, dedupLog) {
  for (let k = 1; k < group.length; k++) {
    reviewNeeded.push({
      reason: 'parametric_s0s1_review',
      item_a: group[0],
      item_b: group[k],
      note: 'Parametric match on S0/S1 items requires manual review',
    });
    dedupLog.push({
      pass: 0,
      type: 'parametric_match',
      kept: group[0].source_id,
      flagged: group[k].source_id,
      reason: 'parametric match skipped for S0/S1 - flagged for review',
    });
  }
}

function mergeParametricGroup(group, dedupLog) {
  const sorted = [...group].sort((a, b) => {
    const aLine = toLineNumber(a.line) ?? Infinity;
    const bLine = toLineNumber(b.line) ?? Infinity;
    return aLine - bLine;
  });
  let primary = sorted[0];
  let mergedCount = 0;
  for (let k = 1; k < sorted.length; k++) {
    const secondary = sorted[k];
    primary = mergeItems(primary, secondary);
    if (!Array.isArray(primary.merged_from)) primary.merged_from = [];
    const secondaryId = secondary.source_id || 'unknown';
    const simpleIdx = primary.merged_from.indexOf(secondaryId);
    if (simpleIdx > -1) primary.merged_from.splice(simpleIdx, 1);
    const secondaryRef = `${secondaryId}@line:${secondary.line}`;
    if (!primary.merged_from.includes(secondaryRef)) {
      primary.merged_from.push(secondaryRef);
    }
    dedupLog.push({
      pass: 0,
      type: 'parametric_match',
      kept: primary.source_id,
      removed: sorted[k].source_id,
      reason: `parametric title match (numbers stripped), lines: ${sorted[0].line} vs ${sorted[k].line}`,
    });
    mergedCount++;
  }
  return { primary, mergedCount };
}

function runPass0Parametric(items, dedupLog, reviewNeeded) {
  console.log('  Pass 0: Parametric dedup (file + title with numbers stripped)...');
  const parametricGroups = new Map();
  for (const item of items) {
    const paramTitle = normalizeParametric(item.title || '');
    const key = `${item.file || ''}::${paramTitle}`;
    if (!parametricGroups.has(key)) parametricGroups.set(key, []);
    parametricGroups.get(key).push(item);
  }
  const pass0Items = [];
  let pass0Merged = 0;
  for (const [, group] of parametricGroups) {
    if (group.length <= 1) {
      pass0Items.push(...group);
      continue;
    }
    const uniqueLines = new Set(group.map((g) => toLineNumber(g.line)));
    uniqueLines.delete(null);
    if (uniqueLines.size <= 1) {
      pass0Items.push(...group);
      continue;
    }
    const hasHighSeverity = group.some((g) => g.severity === 'S0' || g.severity === 'S1');
    if (hasHighSeverity) {
      pass0Items.push(...group);
      flagHighSeverityGroup(group, reviewNeeded, dedupLog);
      continue;
    }
    const { primary, mergedCount } = mergeParametricGroup(group, dedupLog);
    pass0Merged += mergedCount;
    pass0Items.push(primary);
  }
  console.log(
    `    Reduced ${items.length} -> ${pass0Items.length} (${pass0Merged} parametric matches)`,
  );
  return { pass0Items, pass0Merged };
}

function runPass1ExactHash(pass0Items, dedupLog, reviewNeeded) {
  console.log('  Pass 1: Exact content hash match...');
  const hashMap = new Map();
  const pass1Items = [];
  let noHashCount = 0;
  for (const item of pass0Items) {
    const hash =
      typeof item.content_hash === 'string' && item.content_hash.trim() ? item.content_hash : null;
    if (!hash) {
      pass1Items.push(item);
      noHashCount++;
      reviewNeeded.push({
        reason: 'missing_content_hash',
        item_a: item,
        item_b: null,
        note: 'Item has no content_hash',
      });
      continue;
    }
    if (hashMap.has(hash)) {
      const existing = hashMap.get(hash);
      const merged = mergeItems(existing, item);
      hashMap.set(hash, merged);
      dedupLog.push({
        pass: 1,
        type: 'exact_match',
        kept: existing.source_id,
        removed: item.source_id,
        reason: 'identical content hash',
      });
    } else {
      hashMap.set(hash, item);
    }
  }
  pass1Items.push(...hashMap.values());
  if (noHashCount > 0)
    console.log(`    Warning: ${noHashCount} items skipped (missing content_hash)`);
  console.log(
    `    Reduced ${pass0Items.length} -> ${pass1Items.length} (${pass0Items.length - pass1Items.length} exact duplicates)`,
  );
  return pass1Items;
}

function runPairwiseMergePass(inputItems, passNum, passName, matchFn, dedupLog, reviewNeeded) {
  console.log(`  Pass ${passNum}: ${passName}...`);
  const outputItems = [];
  const removed = new Set();
  for (let i = 0; i < inputItems.length; i++) {
    if (removed.has(i)) continue;
    let current = inputItems[i];
    for (let j = i + 1; j < inputItems.length; j++) {
      if (removed.has(j)) continue;
      const matchResult = matchFn(current, inputItems[j]);
      if (!matchResult) continue;
      if (matchResult.flagForReview) reviewNeeded.push(matchResult.flagForReview);
      const primaryBefore = matchResult.swapOrder ? inputItems[j] : current;
      const secondaryBefore = matchResult.swapOrder ? current : inputItems[j];
      current = mergeItems(primaryBefore, secondaryBefore);
      removed.add(j);
      dedupLog.push({
        ...matchResult.logEntry,
        kept: primaryBefore.source_id,
        removed: secondaryBefore.source_id,
      });
    }
    outputItems.push(current);
  }
  console.log(
    `    Reduced ${inputItems.length} -> ${outputItems.length} (${removed.size} matches)`,
  );
  return { outputItems, removedCount: removed.size };
}

function runPass2NearMatch(pass1Items, dedupLog, reviewNeeded) {
  return runPairwiseMergePass(
    pass1Items,
    2,
    'Near match (file + line +/-5 + title >80%)',
    (a, b) => {
      if (!isNearMatch(a, b)) return null;
      return {
        logEntry: {
          pass: 2,
          type: 'near_match',
          reason: 'same file, line diff <=5, title similarity >80%',
        },
      };
    },
    dedupLog,
    reviewNeeded,
  );
}

function runPass3SemanticMatch(pass2Items, dedupLog, reviewNeeded) {
  return runPairwiseMergePass(
    pass2Items,
    3,
    'Semantic match (file + title >90%)',
    (a, b) => {
      if (!isSemanticMatch(a, b)) return null;
      return {
        flagForReview: {
          reason: 'semantic_match',
          item_a: a,
          item_b: b,
          similarity: stringSimilarity(normalizeText(a.title), normalizeText(b.title)).toFixed(2),
        },
        logEntry: {
          pass: 3,
          type: 'semantic_match',
          reason: 'same file, title similarity >90%',
          flagged_for_review: true,
        },
      };
    },
    dedupLog,
    reviewNeeded,
  );
}

function runPass4CrossSource(pass3Items, dedupLog, reviewNeeded) {
  return runPairwiseMergePass(
    pass3Items,
    4,
    'Cross-source match (SonarCloud <-> audit)',
    (a, b) => {
      if (!isCrossSourceMatch(a, b)) return null;
      const currentSourceId = typeof a.source_id === 'string' ? a.source_id : '';
      const isSonar = currentSourceId.startsWith('sonarcloud:');
      return {
        swapOrder: isSonar,
        logEntry: {
          pass: 4,
          type: 'cross_source_match',
          reason: 'SonarCloud <-> audit correlation',
        },
      };
    },
    dedupLog,
    reviewNeeded,
  );
}

function runPass5SystemicPatterns(pass4Items, dedupLog) {
  console.log('  Pass 5: Systemic pattern grouper (same title across >=3 files)...');
  const titleGroups = new Map();
  for (let i = 0; i < pass4Items.length; i++) {
    const normTitle = normalizeText(pass4Items[i].title);
    if (!normTitle) continue;
    if (!titleGroups.has(normTitle)) titleGroups.set(normTitle, []);
    titleGroups.get(normTitle).push(i);
  }
  let pass5Clustered = 0;
  const sevRankForCluster = { S0: 0, S1: 1, S2: 2, S3: 3 };
  const pass5Items = [...pass4Items];
  for (const [normTitle, indices] of titleGroups) {
    const uniqueFiles = new Set(
      indices.map((idx) => pass5Items[idx].file).filter((f) => typeof f === 'string' && f.trim()),
    );
    if (uniqueFiles.size < 3) continue;
    const clusterId = `CLUSTER-${shortHash(normTitle)}`;
    const clusterCount = indices.length;
    let primaryIdx = indices[0];
    let primaryRank = sevRankForCluster[pass5Items[primaryIdx].severity] ?? 99;
    for (const idx of indices) {
      const rank = sevRankForCluster[pass5Items[idx].severity] ?? 99;
      if (rank < primaryRank) {
        primaryRank = rank;
        primaryIdx = idx;
      }
    }
    for (const idx of indices) {
      pass5Items[idx] = { ...pass5Items[idx], cluster_id: clusterId, cluster_count: clusterCount };
      if (idx === primaryIdx) pass5Items[idx].cluster_primary = true;
      dedupLog.push({
        pass: 5,
        type: 'systemic_pattern',
        source_id: pass5Items[idx].source_id,
        cluster_id: clusterId,
        cluster_count: clusterCount,
        is_primary: idx === primaryIdx,
        reason: `title appears in ${uniqueFiles.size} different files`,
      });
    }
    pass5Clustered++;
  }
  console.log(`    Identified ${pass5Clustered} systemic patterns (items annotated, none removed)`);
  return { pass5Items, pass5Clustered };
}

function writeOutputFiles(pass5Items, dedupLog, reviewNeeded) {
  const outputDir = path.dirname(OUTPUT_FILE);
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  safeWriteFileSync(OUTPUT_FILE, pass5Items.map((item) => JSON.stringify(item)).join('\n') + '\n');
  safeWriteFileSync(LOG_FILE, dedupLog.map((entry) => JSON.stringify(entry)).join('\n') + '\n');
  if (reviewNeeded.length > 0) {
    safeWriteFileSync(
      REVIEW_FILE,
      reviewNeeded.map((entry) => JSON.stringify(entry)).join('\n') + '\n',
    );
  }
}

function printDedupSummary(originalCount, pass5Items, passStats, dedupLog, reviewNeeded) {
  const totalRemoved = originalCount - pass5Items.length;
  console.log(`\nDeduplication complete: ${originalCount} -> ${pass5Items.length}`);
  console.log(
    `   Removed ${totalRemoved} duplicates (${((totalRemoved / originalCount) * 100).toFixed(1)}%)`,
  );
  console.log(`\nPer-pass breakdown:`);
  console.log(
    `   Pass 0 (parametric):    ${originalCount} -> ${passStats.pass0Count} (${passStats.pass0Merged} merged)`,
  );
  console.log(
    `   Pass 1 (exact hash):    ${passStats.pass0Count} -> ${passStats.pass1Count} (${passStats.pass0Count - passStats.pass1Count} merged)`,
  );
  console.log(
    `   Pass 2 (near match):    ${passStats.pass1Count} -> ${passStats.pass2Count} (${passStats.pass2Removed} merged)`,
  );
  console.log(
    `   Pass 3 (semantic):      ${passStats.pass2Count} -> ${passStats.pass3Count} (${passStats.pass3Removed} merged)`,
  );
  console.log(
    `   Pass 4 (cross-source):  ${passStats.pass3Count} -> ${passStats.pass4Count} (${passStats.pass4Removed} merged)`,
  );
  console.log(
    `   Pass 5 (systemic):      ${passStats.pass5Clustered} patterns annotated (0 removed)`,
  );
  console.log(`\nOutput files:`);
  console.log(`   ${OUTPUT_FILE}`);
  console.log(`   ${LOG_FILE} (${dedupLog.length} merge records)`);
  if (reviewNeeded.length > 0)
    console.log(`   ${REVIEW_FILE} (${reviewNeeded.length} items for review)`);
  const bySeverity = {};
  for (const item of pass5Items) bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
  console.log('\nFinal counts by severity:');
  for (const sev of ['S0', 'S1', 'S2', 'S3']) {
    if (bySeverity[sev]) console.log(`   ${sev}: ${bySeverity[sev]}`);
  }
}

function main() {
  console.log('Running multi-pass deduplication...\n');
  const items = readInputItems();
  console.log(`  Starting with ${items.length} normalized items\n`);
  const dedupLog = [];
  const reviewNeeded = [];
  const { pass0Items, pass0Merged } = runPass0Parametric(items, dedupLog, reviewNeeded);
  const pass1Items = runPass1ExactHash(pass0Items, dedupLog, reviewNeeded);
  const { outputItems: pass2Items, removedCount: pass2Removed } = runPass2NearMatch(
    pass1Items,
    dedupLog,
    reviewNeeded,
  );
  const { outputItems: pass3Items, removedCount: pass3Removed } = runPass3SemanticMatch(
    pass2Items,
    dedupLog,
    reviewNeeded,
  );
  const { outputItems: pass4Items, removedCount: pass4Removed } = runPass4CrossSource(
    pass3Items,
    dedupLog,
    reviewNeeded,
  );
  const { pass5Items, pass5Clustered } = runPass5SystemicPatterns(pass4Items, dedupLog);
  writeOutputFiles(pass5Items, dedupLog, reviewNeeded);
  printDedupSummary(
    items.length,
    pass5Items,
    {
      pass0Count: pass0Items.length,
      pass0Merged,
      pass1Count: pass1Items.length,
      pass2Count: pass2Items.length,
      pass2Removed,
      pass3Count: pass3Items.length,
      pass3Removed,
      pass4Count: pass4Items.length,
      pass4Removed,
      pass5Clustered,
    },
    dedupLog,
    reviewNeeded,
  );
}

main();
