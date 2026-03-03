#!/usr/bin/env node
/**
 * Categorize & Assign — Technical Debt Resolution Plan
 *
 * Reads MASTER_DEBT.jsonl, categorizes all open items (VERIFIED/NEW) into
 * either sprint buckets or Roadmap milestones, and writes manifests.
 *
 * Usage:
 *   node scripts/debt/categorize-and-assign.js [--write] [--verbose]
 *
 * Default is dry-run (no files written).
 */

const fs = require('node:fs');
const path = require('node:path');
const { sanitizeError } = require('../lib/sanitize-error.js');

// -- Paths --
const ROOT = path.join(__dirname, '../..');
const DEBT_DIR = process.env.TDMS_DEBT_DIR || path.join(ROOT, 'docs/technical-debt');
const LOGS_DIR = path.join(DEBT_DIR, 'logs');
const MASTER_FILE = path.join(DEBT_DIR, 'MASTER_DEBT.jsonl');
const MANIFEST_FILE = path.join(LOGS_DIR, 'grand-plan-manifest.json');

// -- Constants --
const ROADMAP_CATEGORIES = new Set(['security', 'enhancements', 'performance']);
const GRAND_PLAN_CATEGORIES = new Set([
  'code-quality',
  'documentation',
  'process',
  'refactoring',
  'engineering-productivity',
  'ai-optimization',
]);

// Load completed sprints from manifest if available, otherwise default empty
function loadCompleteSprints() {
  try {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
    const complete = new Set();
    if (manifest && manifest.sprints) {
      for (const [key, data] of Object.entries(manifest.sprints)) {
        if (data.status === 'COMPLETE') complete.add(key);
      }
    }
    return complete;
  } catch {
    return new Set();
  }
}

const MAX_SPRINT_SIZE = 200;

const ROADMAP_DEFAULTS = {
  security: 'Track-S',
  enhancements: 'M3-M10',
  performance: 'M2',
};

// -- CLI parsing --
function parseArgs(argv) {
  const opts = { write: false, verbose: false };
  for (const arg of argv.slice(2)) {
    if (arg === '--write') opts.write = true;
    else if (arg === '--verbose') opts.verbose = true;
  }
  return opts;
}

const readJsonl = require('../lib/read-jsonl');
const { safeWriteFileSync, safeRenameSync } = require('../lib/safe-fs');

// -- File I/O helpers --
function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Failed to read JSON ${path.basename(filePath)}:`, sanitizeError(err));
    return null;
  }
}

function writeJsonSafe(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmpPath = filePath + '.tmp';
    safeWriteFileSync(tmpPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    try {
      safeRenameSync(tmpPath, filePath);
    } catch {
      try {
        fs.rmSync(filePath, { force: true });
      } catch {
        /* ignore */
      }
      safeRenameSync(tmpPath, filePath);
    }
  } catch (err) {
    console.error(`Failed to write ${path.basename(filePath)}:`, sanitizeError(err));
    process.exit(1);
  }
}

// -- Build lookup of existing sprint assignments --
function buildExistingAssignments(manifest) {
  const map = new Map();
  if (!manifest || !manifest.sprints) return map;
  for (const [sprintKey, sprintData] of Object.entries(manifest.sprints)) {
    const ids = sprintData.ids || [];
    for (const id of ids) {
      map.set(id, sprintKey);
    }
  }
  return map;
}

// -- Determine sprint bucket for a file path --
// Configurable directory-to-sprint mapping
const SPRINT_BUCKET_MAP = [
  { test: (p) => p.startsWith('scripts/'), bucket: 1 },
  { test: (p) => p.startsWith('.claude/') || p.startsWith('docs/'), bucket: 2 },
  {
    test: (p) => p.startsWith('.github/') || p.startsWith('.husky/') || isRootConfigFile(p),
    bucket: 3,
  },
  { test: (p) => p.startsWith('src/') || p.startsWith('lib/'), bucket: 4 },
  { test: (p) => p.startsWith('tests/') || p.startsWith('__tests__/'), bucket: 5 },
];

function getSprintBucketForPath(filePath) {
  if (!filePath || filePath === 'N/A' || filePath === '') return 6;
  const norm = path.posix.normalize(filePath.replaceAll('\\', '/'));
  if (/(^|\/)\.\.(\/|$)/.test(norm)) return 6;
  for (const entry of SPRINT_BUCKET_MAP) {
    if (entry.test(norm)) return entry.bucket;
  }
  return 6; // Cross-cutting / unmatched
}

function isRootConfigFile(filePath) {
  if (filePath.includes('/')) return false;
  return /\.(json|yml|yaml)$/i.test(filePath);
}

// -- Categorize a single item --
function categorizeItem(item) {
  if (ROADMAP_CATEGORIES.has(item.category)) {
    return { type: 'roadmap', category: item.category };
  }
  if (GRAND_PLAN_CATEGORIES.has(item.category)) {
    return { type: 'grand-plan', category: item.category };
  }
  return { type: 'grand-plan', category: item.category || 'unknown' };
}

// -- Split oversized sprints into sub-sprints --
function splitOversizedSprints(sprintBuckets) {
  const result = new Map();
  for (const [sprintNum, ids] of sprintBuckets.entries()) {
    if (ids.length <= MAX_SPRINT_SIZE) {
      result.set(String(sprintNum), ids);
    } else {
      const chunks = [];
      for (let i = 0; i < ids.length; i += MAX_SPRINT_SIZE) {
        chunks.push(ids.slice(i, i + MAX_SPRINT_SIZE));
      }
      const suffixes = 'abcdefghijklmnopqrstuvwxyz';
      for (let c = 0; c < chunks.length; c++) {
        const key = `${sprintNum}${suffixes[c] || c}`;
        result.set(key, chunks[c]);
      }
    }
  }
  return result;
}

// -- Sprint focus descriptions --
const SPRINT_FOCUS = {
  1: 'scripts/',
  2: '.claude/ and docs/',
  3: '.github/, .husky/, root config files',
  4: 'src/, lib/',
  5: 'tests/',
  6: 'Cross-cutting items (no specific file)',
};

function getFocusForSprint(key) {
  const numMatch = key.match(/^(\d+)/);
  if (!numMatch) return 'Mixed';
  const num = Number.parseInt(numMatch[1], 10);
  return SPRINT_FOCUS[num] || `Sprint ${key}`;
}

// -- Classify open items into roadmap/sprint buckets --
function classifyOpenItems(openItems, existingAssignments, completeSprints) {
  const roadmapBound = { security: [], enhancements: [], performance: [] };
  const newSprintBuckets = new Map();
  let keptInComplete = 0;

  for (const item of openItems) {
    const cat = categorizeItem(item);

    if (cat.type === 'roadmap') {
      roadmapBound[cat.category].push(item.id);
      continue;
    }

    const existingSprint = existingAssignments.get(item.id);

    if (existingSprint && completeSprints.has(existingSprint)) {
      keptInComplete++;
      continue;
    }

    const bucket = getSprintBucketForPath(item.file);
    if (!newSprintBuckets.has(bucket)) newSprintBuckets.set(bucket, []);
    newSprintBuckets.get(bucket).push(item.id);
  }

  return { roadmapBound, newSprintBuckets, keptInComplete };
}

// -- Main logic --
function run() {
  const opts = parseArgs(process.argv);
  const items = readJsonl(MASTER_FILE);
  const manifest = readJsonSafe(MANIFEST_FILE) || { sprints: {} };
  const existingAssignments = buildExistingAssignments(manifest);
  const completeSprints = loadCompleteSprints();

  const openItems = items.filter((it) => it.status === 'VERIFIED' || it.status === 'NEW');

  const { roadmapBound, newSprintBuckets, keptInComplete } = classifyOpenItems(
    openItems,
    existingAssignments,
    completeSprints,
  );

  const finalNewSprints = splitOversizedSprints(newSprintBuckets);

  // Build updated manifest
  const updatedManifest = buildManifest(
    manifest,
    finalNewSprints,
    roadmapBound,
    openItems.length,
    keptInComplete,
    completeSprints,
  );

  // Print summary
  printSummary(updatedManifest, finalNewSprints, roadmapBound, openItems.length, opts);

  if (!opts.write) {
    console.log('\n[DRY RUN] No files written. Use --write to apply changes.');
    return;
  }

  writeManifest(updatedManifest);
  writeSprintIdFiles(finalNewSprints);
  console.log('\n[WRITE] All files updated successfully.');
}

// -- Build the updated manifest object --
function buildManifest(
  oldManifest,
  newSprints,
  roadmapBound,
  totalOpen,
  keptInComplete,
  completeSprints,
) {
  const sprints = {};

  // Preserve complete sprints from old manifest
  for (const [key, data] of Object.entries(oldManifest.sprints || {})) {
    if (completeSprints.has(key)) {
      sprints[key] = {
        status: 'COMPLETE',
        items: data.ids ? data.ids.length : (data.items ?? 0),
        focus: data.focus || key,
      };
    }
  }

  // Add new sprints
  for (const [sprintKey, ids] of newSprints.entries()) {
    const manifestKey = `sprint-${sprintKey}`;
    sprints[manifestKey] = {
      status: 'PLANNED',
      items: ids.length,
      focus: getFocusForSprint(sprintKey),
    };
  }

  const placedGrandPlan = keptInComplete + sumMapItems(newSprints);
  const placedRoadmap =
    roadmapBound.security.length +
    roadmapBound.enhancements.length +
    roadmapBound.performance.length;

  return {
    version: '2.0',
    generated: new Date().toISOString(),
    sprints,
    roadmap_bound: {
      security: { count: roadmapBound.security.length, roadmap_ref: 'Track-S' },
      enhancements: { count: roadmapBound.enhancements.length, roadmap_ref: 'M3-M10' },
      performance: { count: roadmapBound.performance.length, roadmap_ref: 'M2' },
    },
    coverage: {
      total_open: totalOpen,
      placed_grand_plan: placedGrandPlan,
      placed_roadmap: placedRoadmap,
      unplaced: totalOpen - placedGrandPlan - placedRoadmap,
    },
  };
}

function sumMapItems(sprintMap) {
  let total = 0;
  for (const ids of sprintMap.values()) total += ids.length;
  return total;
}

// -- Print summary --
function printSummary(manifest, newSprints, roadmapBound, totalOpen, opts) {
  console.log('=========================================================');
  console.log('  Categorize & Assign - Summary');
  console.log('=========================================================\n');

  console.log('-- Sprints --');
  // Print complete sprints
  for (const [key, data] of Object.entries(manifest.sprints)) {
    if (data.status === 'COMPLETE') {
      console.log(`  ${key}: ${data.items} items [COMPLETE] - ${data.focus}`);
    }
  }
  // Print new sprints
  const sortedKeys = [...newSprints.keys()].sort((a, b) => {
    const na = Number.parseFloat(a);
    const nb = Number.parseFloat(b);
    if (na !== nb) return na - nb;
    return String(a).localeCompare(String(b));
  });
  for (const key of sortedKeys) {
    const ids = newSprints.get(key);
    const focus = getFocusForSprint(key);
    console.log(`  sprint-${key}: ${ids.length} items [PLANNED] - ${focus}`);
    if (opts.verbose && ids.length > 0) {
      console.log(`    Sample: ${ids.slice(0, 5).join(', ')}${ids.length > 5 ? ' ...' : ''}`);
    }
  }

  console.log('\n-- Roadmap-Bound Items --');
  for (const [cat, ids] of Object.entries(roadmapBound)) {
    const ref = ROADMAP_DEFAULTS[cat];
    console.log(`  ${cat}: ${ids.length} items -> ${ref}`);
    if (opts.verbose && ids.length > 0) {
      const overflow = ids.length > 10 ? ` ... (+${ids.length - 10} more)` : '';
      console.log(`    IDs: ${ids.slice(0, 10).join(', ')}${overflow}`);
    }
  }

  console.log('\n-- Coverage --');
  const cov = manifest.coverage;
  const pct =
    totalOpen > 0
      ? (((cov.placed_grand_plan + cov.placed_roadmap) / totalOpen) * 100).toFixed(1)
      : '0.0';
  console.log(`  Total open items:     ${cov.total_open}`);
  console.log(`  Placed (Sprints):     ${cov.placed_grand_plan}`);
  console.log(`  Placed (Roadmap):     ${cov.placed_roadmap}`);
  console.log(`  Unplaced:             ${cov.unplaced}`);
  console.log(`  Coverage:             ${pct}%`);
}

// -- Write manifest --
function writeManifest(manifest) {
  writeJsonSafe(MANIFEST_FILE, manifest);
  console.log(`  Wrote: ${path.relative(ROOT, MANIFEST_FILE)}`);
}

// -- Write sprint ID files --
function writeSprintIdFiles(newSprints) {
  for (const [sprintKey, ids] of newSprints.entries()) {
    const fileName = `sprint-${sprintKey}-ids.json`;
    const filePath = path.join(LOGS_DIR, fileName);
    const resolved = path.resolve(filePath);
    const rel = path.relative(path.resolve(LOGS_DIR), resolved);
    if (rel === '' || /^\.\.(?:[\\/]|$)/.test(rel) || path.isAbsolute(rel)) {
      console.error(`  Skipping ${fileName}: path traversal detected`);
      continue;
    }
    const data = {
      sprint: `sprint-${sprintKey}`,
      focus: getFocusForSprint(sprintKey),
      ids: ids.sort(),
    };
    writeJsonSafe(filePath, data);
    console.log(`  Wrote: ${path.relative(ROOT, filePath)} (${ids.length} ids)`);
  }
}

// -- Entry point --
try {
  run();
} catch (err) {
  console.error('Fatal error:', sanitizeError(err));
  process.exit(1);
}
