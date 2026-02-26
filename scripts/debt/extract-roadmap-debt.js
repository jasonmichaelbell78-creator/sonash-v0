#!/usr/bin/env node
/* global __dirname */
/**
 * Extract technical debt items from ROADMAP.md checkboxes into TDMS-format JSONL.
 *
 * Part of Technical Debt Resolution Step 0c.
 *
 * Parses all checkbox items from ROADMAP.md and extracts those that describe
 * technical debt work (refactoring, fixing, cleanup, testing gaps) while
 * skipping feature/enhancement items and items already tracked via DEBT-XXXX
 * or CANON-XXXX references.
 *
 * Usage: node scripts/debt/extract-roadmap-debt.js [options]
 *
 * Options:
 *   --dry-run    Show what would be extracted without writing (default)
 *   --write      Actually append to scattered-intake.jsonl
 *   --verbose    Show all items including skipped features
 */

const fs = require("node:fs");
const path = require("node:path");
const generateContentHash = require("../lib/generate-content-hash");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const ROADMAP_FILE = path.join(PROJECT_ROOT, "ROADMAP.md");
const DEBT_DIR = path.join(PROJECT_ROOT, "docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const OUTPUT_FILE = path.join(DEBT_DIR, "raw/scattered-intake.jsonl");

// --- Shared utilities ---

function loadExistingHashes() {
  const hashes = new Set();
  if (!fs.existsSync(MASTER_FILE)) return hashes;
  let content;
  try {
    content = fs.readFileSync(MASTER_FILE, "utf8").replaceAll("\uFEFF", "");
  } catch {
    return hashes;
  }
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      if (item.content_hash) hashes.add(item.content_hash);
    } catch {
      // skip
    }
  }
  return hashes;
}

function loadExistingIntakeIds() {
  const ids = new Set();
  if (!fs.existsSync(OUTPUT_FILE)) return ids;
  let content;
  try {
    content = fs.readFileSync(OUTPUT_FILE, "utf8").replaceAll("\uFEFF", "");
  } catch {
    return ids;
  }
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      const item = JSON.parse(line);
      if (item.id) ids.add(item.id);
    } catch {
      // skip
    }
  }
  return ids;
}

// --- Classification ---

/**
 * Determine if a checkbox item describes technical debt vs a feature.
 * Returns { isDebt: boolean, category: string, reason: string }
 */
function classifyItem(text) {
  const lower = text.toLowerCase();

  // Debt indicators (strong signals)
  const debtPatterns = [
    {
      pattern: /\b(fix|fixing|broken|bug|error|crash|fail)\b/,
      category: "code-quality",
      weight: 3,
    },
    {
      pattern: /\b(refactor|decompos|extract|split|simplif|consolidat|migrat)\b/,
      category: "refactoring",
      weight: 3,
    },
    {
      pattern: /\b(cleanup|clean.?up|remove\s+unused|remove\s+duplicate|remove\s+dead)\b/,
      category: "code-quality",
      weight: 3,
    },
    {
      pattern: /\b(tech.?debt|technical\s+debt|code\s+smell|lint|eslint)\b/,
      category: "code-quality",
      weight: 3,
    },
    {
      pattern: /\b(test\s+coverage|missing\s+tests?|add\s+tests?|testing\s+gap)\b/,
      category: "code-quality",
      weight: 2,
    },
    { pattern: /\b(deprecat|obsolet|stale|outdated)\b/, category: "code-quality", weight: 2 },
    {
      pattern: /\b(optimiz|slow|latency|bundle\s+size|performance)\b/,
      category: "performance",
      weight: 2,
    },
    {
      pattern: /\b(security|vulnerab|xss|csrf|injection|auth\w*bypass)\b/,
      category: "security",
      weight: 3,
    },
    {
      pattern: /\b(documentation|doc\s+sync|readme|jsdoc|comments?)\b/,
      category: "documentation",
      weight: 1,
    },
    {
      pattern: /\b(ci\s+gate|pipeline|pre-?commit|pre-?push|hook)\b/,
      category: "process",
      weight: 1,
    },
    { pattern: /\b(convert|webp|srcset|preload)\b/, category: "performance", weight: 2 },
    { pattern: /\b(reduce|consolidat|dedup|streamline)\b/, category: "refactoring", weight: 2 },
  ];

  // Feature/enhancement indicators (strong signals)
  const featurePatterns = [
    /\b(new\s+feature|implement\s+new|add\s+new|create\s+new)\b/,
    /\b(dashboard|tab|page|panel|ui\s+component|widget)\b/,
    /\b(user\s+facing|user\s+experience|ux|ui\s+design)\b/,
    /\b(meeting\s+finder|journal|recovery|sobriety|milestone)\b/,
    /\b(notification|alert\s+system|email|sms)\b/,
    /\b(integration\s+with|connect\s+to|api\s+for)\b/,
    /\b(runbook|playbook|guide)\b/,
  ];

  let debtScore = 0;
  let debtCategory = "code-quality";
  let maxWeight = 0;

  for (const { pattern, category, weight } of debtPatterns) {
    if (pattern.test(lower)) {
      debtScore += weight;
      if (weight > maxWeight) {
        maxWeight = weight;
        debtCategory = category;
      }
    }
  }

  let featureScore = 0;
  for (const pattern of featurePatterns) {
    if (pattern.test(lower)) featureScore += 2;
  }

  // Items with explicit task codes (B3, D6, E1, O1, etc.) are typically roadmap features
  if (/^\*\*[A-Z]\d+(?:\.\d+)?:\*\*/.test(text.replace(/^\s*-\s*\[.\]\s*/, ""))) {
    featureScore += 1;
  }

  // Decision
  if (debtScore > featureScore && debtScore >= 2) {
    return { isDebt: true, category: debtCategory, reason: "debt keywords" };
  }
  if (featureScore > debtScore) {
    return { isDebt: false, category: "feature", reason: "feature keywords" };
  }
  // Ambiguous — check for more signals
  if (debtScore >= 1) {
    return { isDebt: true, category: debtCategory, reason: "weak debt signal" };
  }

  return { isDebt: false, category: "feature", reason: "no debt signal" };
}

/**
 * Detect severity from text content
 */
function detectSeverity(text) {
  // Prefer explicit severity markers (e.g., "- S1", "(s2,", "S0:")
  const sevMatch = text.match(/(?:^|[-(\s])([sS][0-3])(?:[\s,:)]|$)/);
  if (sevMatch) return sevMatch[1].toUpperCase();

  const lower = text.toLowerCase();
  if (/\bs0\b|\bcritical\b/.test(lower)) return "S0";
  if (/\bs1\b|\bhigh\b|\bblocking\b/.test(lower)) return "S1";
  if (/\bs2\b|\bmedium\b/.test(lower)) return "S2";
  return "S3";
}

/**
 * Extract file path from text
 */
function extractFilePath(text) {
  const patterns = [
    /`([a-zA-Z0-9_/.@-]+\.[a-zA-Z]{1,5}(?::\d+)?)`/,
    /\b((?:src|app|components|lib|hooks|scripts|functions|\.github|\.husky|docs)\/[a-zA-Z0-9_/.@-]+\.[a-zA-Z]{1,5})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].split(":")[0];
    }
  }
  return "";
}

// --- Main extraction ---

function extractFromRoadmap(lines) {
  const items = [];
  let currentSection = "";
  let currentMilestone = "";
  let lineNum = 0;

  for (const line of lines) {
    lineNum++;
    const trimmed = line.trim();

    // Track sections
    if (/^#{1,4}\s/.test(trimmed)) {
      const heading = trimmed
        .replace(/^#+\s*/, "")
        .replaceAll("*", "")
        .replaceAll("`", "")
        .trim();
      if (/milestone|sprint|^m\d|grand\s+plan|operational/i.test(heading)) {
        currentMilestone = heading;
      } else {
        currentMilestone = "";
      }
      currentSection = heading;
    }

    // Match checkbox items: - [ ] or - [x]
    const checkboxMatch = trimmed.match(/^[-*+]\s*\[([ xX])\]\s+(.+)/);
    if (!checkboxMatch) continue;

    const isChecked = checkboxMatch[1].toLowerCase() === "x";
    const itemText = checkboxMatch[2].trim();

    // Skip items that already have DEBT-XXXX or CANON-XXXX references
    if (/DEBT-\d{3,5}/.test(itemText) || /CANON-\d{3,5}/.test(itemText)) {
      continue;
    }

    // Classify as debt vs feature
    const classification = classifyItem(itemText);

    items.push({
      lineNum,
      isChecked,
      itemText,
      section: currentSection,
      milestone: currentMilestone,
      classification,
    });
  }

  return items;
}

// --- Helper functions for main ---

/**
 * Read and parse ROADMAP.md, exiting on failure.
 */
function readRoadmapLines() {
  try {
    const content = fs.readFileSync(ROADMAP_FILE, "utf8").replaceAll("\uFEFF", "");
    return content.split(/\r?\n/);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`   Error reading ROADMAP.md: ${msg}`);
    process.exit(1);
  }
}

/**
 * Clean a checkbox item title by removing task codes, time estimates, and dependency refs.
 */
function cleanItemTitle(text) {
  return text
    .replace(/^\*\*[A-Z0-9.]+:\*\*\s*/, "") // remove task codes like **P1.1:**
    .replaceAll(/\(\d+h(?:r|ours?)?\)/g, "") // remove time estimates
    .replaceAll(/\[depends:.*?\]/g, "") // remove dependency refs
    .replaceAll("**", "")
    .trim();
}

/**
 * Build a single TDMS entry from a classified debt item.
 */
function buildTdmsEntry(item, seqNum, today) {
  const filePath = extractFilePath(item.itemText);
  const severity = detectSeverity(item.itemText);
  const status = item.isChecked ? "RESOLVED" : "NEW";
  const cleanTitle = cleanItemTitle(item.itemText);

  const entry = {
    id: `INTAKE-ROAD-${String(seqNum).padStart(4, "0")}`,
    source_id: `roadmap:${item.lineNum}`,
    source_file: "ROADMAP.md",
    category: item.classification.category,
    severity,
    type: "tech-debt",
    file: filePath,
    line: item.lineNum,
    title: cleanTitle.substring(0, 200),
    description: `ROADMAP item (${item.milestone || item.section}): ${cleanTitle.substring(0, 150)}`,
    recommendation: `Address ROADMAP item at line ${item.lineNum}.`,
    effort: "E1",
    status,
    roadmap_ref: null,
    created: today,
    verified_by: null,
    resolution: null,
  };
  entry.content_hash = generateContentHash(entry);
  return entry;
}

/**
 * Convert classified debt items into deduped TDMS findings.
 */
function buildFindings(debtItems, existingHashes, startSeq, today) {
  const findings = [];
  const seenRunHashes = new Set();
  let nextSeq = startSeq;

  for (const item of debtItems) {
    const entry = buildTdmsEntry(item, nextSeq, today);
    if (!existingHashes.has(entry.content_hash) && !seenRunHashes.has(entry.content_hash)) {
      seenRunHashes.add(entry.content_hash);
      findings.push(entry);
      nextSeq++;
    }
  }

  return findings;
}

/**
 * Count occurrences of a field value across an array of objects.
 */
function countByField(items, field) {
  const counts = {};
  for (const item of items) {
    counts[item[field]] = (counts[item[field]] || 0) + 1;
  }
  return counts;
}

/**
 * Print summary: totals, category breakdown, status breakdown.
 */
function printSummary(findings, totalDebt, verbose) {
  console.log(`\n   New TDMS entries:      ${findings.length}`);
  console.log(`   Already in MASTER:     ${totalDebt - findings.length}`);

  const catCounts = countByField(findings, "category");
  if (Object.keys(catCounts).length > 0) {
    console.log("\n   By category:");
    for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`     ${cat.padEnd(25)} ${count}`);
    }
  }

  const newCount = findings.filter((f) => f.status === "NEW").length;
  const resolvedCount = findings.filter((f) => f.status === "RESOLVED").length;
  console.log(`\n   Status: NEW=${newCount}, RESOLVED=${resolvedCount}`);

  if (verbose && findings.length > 0) {
    console.log("\n   Extracted items:");
    for (const item of findings) {
      console.log(
        `     ${item.id}: [${item.severity}/${item.status}] ${item.title.substring(0, 80)}`
      );
    }
  }
}

/**
 * Write findings to the output JSONL file.
 */
function writeFindings(findings) {
  const jsonlContent = findings.map((f) => JSON.stringify(f)).join("\n") + "\n";
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.appendFileSync(OUTPUT_FILE, jsonlContent, "utf-8");
  console.log(
    `\n   Appended ${findings.length} items to ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`
  );
}

/**
 * Compute the next sequence number from existing intake IDs.
 */
function computeNextSeq(existingIntakeIds) {
  let nextSeq = 1;
  for (const id of existingIntakeIds) {
    const match = id.match(/^INTAKE-ROAD-(\d+)$/);
    if (match) nextSeq = Math.max(nextSeq, Number.parseInt(match[1], 10) + 1);
  }
  return nextSeq;
}

// --- Main ---

function main() {
  const args = new Set(process.argv.slice(2));
  const writeMode = args.has("--write");
  const verbose = args.has("--verbose");
  const dryRun = !writeMode;

  console.log("\nExtract ROADMAP.md Debt Items (Step 0c)");
  console.log(`   Mode: ${dryRun ? "DRY RUN (use --write to save)" : "WRITE"}`);

  const existingHashes = loadExistingHashes();
  const existingIntakeIds = loadExistingIntakeIds();
  console.log(`   Existing MASTER_DEBT hashes: ${existingHashes.size}`);
  console.log(`   Existing intake items: ${existingIntakeIds.size}`);

  const nextSeq = computeNextSeq(existingIntakeIds);
  const today = new Date().toISOString().split("T")[0];

  const lines = readRoadmapLines();
  const allItems = extractFromRoadmap(lines);

  console.log(`\n   Total checkboxes found: ${allItems.length}`);

  const debtItems = allItems.filter((i) => i.classification.isDebt);
  const featureItems = allItems.filter((i) => !i.classification.isDebt);

  console.log(`   Classified as debt:    ${debtItems.length}`);
  console.log(`   Classified as feature: ${featureItems.length}`);

  if (verbose) {
    console.log("\n   Feature items (skipped):");
    for (const item of featureItems) {
      console.log(`     [${item.classification.reason}] ${item.itemText.substring(0, 80)}`);
    }
  }

  const findings = buildFindings(debtItems, existingHashes, nextSeq, today);

  printSummary(findings, debtItems.length, verbose);

  if (dryRun) {
    console.log(
      `\n   DRY RUN complete. Use --write to append to ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`
    );
    return;
  }

  writeFindings(findings);
}

main();
