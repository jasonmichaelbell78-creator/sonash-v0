#!/usr/bin/env node
/* global __dirname */
/* eslint-disable complexity */
/**
 * Extract technical debt items from .claude/state/ markdown files into TDMS JSONL.
 *
 * Part of Technical Debt Resolution Step 0f.
 *
 * Parses structured "Gap:" items and "FINDING-*" entries from agent research
 * results and gap analysis files.
 *
 * Usage: node scripts/debt/extract-context-debt.js [options]
 *
 * Options:
 *   --dry-run    Show what would be extracted without writing (default)
 *   --write      Actually append to scattered-intake.jsonl
 *   --verbose    Show all extracted items
 */

const fs = require("node:fs");
const path = require("node:path");
const generateContentHash = require("../lib/generate-content-hash");
const { safeAppendFileSync } = require("../lib/safe-fs");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state");
const DEBT_DIR = path.join(PROJECT_ROOT, "docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const OUTPUT_FILE = path.join(DEBT_DIR, "raw/scattered-intake.jsonl");

const SOURCE_FILES = ["agent-research-results.md", "system-test-gap-analysis-pass2.md"];

// --- Utilities ---

function collectHashesFromFile(filePath, hashes) {
  if (!fs.existsSync(filePath)) return;
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8").replaceAll("\uFEFF", "");
  } catch {
    return;
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
}

function loadExistingHashes() {
  const hashes = new Set();
  for (const filePath of [MASTER_FILE, OUTPUT_FILE]) {
    collectHashesFromFile(filePath, hashes);
  }
  return hashes;
}

function computeNextSeq() {
  let nextSeq = 1;
  if (!fs.existsSync(OUTPUT_FILE)) return nextSeq;
  try {
    const content = fs.readFileSync(OUTPUT_FILE, "utf8");
    for (const line of content.split("\n")) {
      if (!line.trim()) continue;
      try {
        const item = JSON.parse(line);
        const match = (item.id || "").match(/^INTAKE-CTX-(\d+)$/);
        if (match) nextSeq = Math.max(nextSeq, Number.parseInt(match[1], 10) + 1);
      } catch {
        // skip
      }
    }
  } catch {
    // skip
  }
  return nextSeq;
}

// --- Extraction ---

function extractFilePath(text) {
  const patterns = [
    /`([a-zA-Z0-9_/.@-]+\.[a-zA-Z]{1,5}(?::\d+)?)`/,
    /\*\*`([a-zA-Z0-9_/.@-]+\.[a-zA-Z]{1,5})`\*\*/,
    /\b((?:src|app|components|lib|hooks|scripts|functions|\.claude|\.github|\.husky|docs)\/[a-zA-Z0-9_/.@-]+\.[a-zA-Z]{1,5})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let filePath = match[1].split(":")[0];
      filePath = path.normalize(filePath).replaceAll("\\", "/");
      // Reject absolute paths (Unix or Windows drive letters)
      if (/^(?:\/|[a-zA-Z]:\/)/.test(filePath)) return "";
      // Reject any path containing traversal segments after normalization
      if (/(^|\/)\.\.($|\/)/.test(filePath)) return "";
      return filePath;
    }
  }
  return "";
}

function detectCategory(text, context) {
  const lower = text.toLowerCase();
  if (/test|coverage|gap|missing test/.test(lower)) return "code-quality";
  if (/security|xss|csrf|auth|pii|sentry/.test(lower)) return "security";
  if (/performance|bundle|latency|slow/.test(lower)) return "performance";
  if (/document|readme|comment|jsdoc/.test(lower)) return "documentation";
  if (/refactor|extract|split|consolidat/.test(lower)) return "refactoring";
  if (context.includes("security")) return "security";
  return "code-quality";
}

/**
 * Try to extract a Gap item from a trimmed line.
 * Returns an item object or null.
 */
function tryExtractGap(trimmed, i, currentDomain, currentComponent, sourceFile) {
  const gapMatch = trimmed.match(/^[-*]?\s*(?:\*\*)?Gap(?:\*\*)?:\s*(.+)/i);
  if (!gapMatch) return null;

  const gapText = gapMatch[1].trim();
  // Skip very short or non-actionable items
  if (gapText.length < 15) return null;
  if (/unknown|unclear|not examined/i.test(gapText)) return null;

  const filePath = extractFilePath(gapText) || extractFilePath(currentComponent);
  return {
    title: gapText.substring(0, 200),
    description: `${currentDomain} > ${currentComponent}: ${gapText}`.substring(0, 500),
    file: filePath,
    line: i + 1,
    category: detectCategory(gapText, currentDomain),
    severity: "S3",
    sourceFile,
    sourceLine: i + 1,
  };
}

/**
 * Try to extract a FINDING item from a trimmed line.
 * Returns an item object or null.
 */
function tryExtractFinding(trimmed, i, lines, currentDomain, sourceFile) {
  const findingMatch = trimmed.match(/^###?\s*(?:\*\*)?FINDING-([A-Z0-9]+)(?:\*\*)?:\s*(.+)/);
  if (!findingMatch) return null;

  const findingId = findingMatch[1];
  const findingTitle = findingMatch[2].replaceAll("*", "").trim();

  // Collect description from next few lines
  let desc = findingTitle;
  for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
    const nextLine = lines[j].trim();
    if (nextLine.startsWith("#") || nextLine === "") break;
    if (nextLine.startsWith("- **")) {
      desc += " " + nextLine.replace(/^-\s*\*\*.*?\*\*:?\s*/, "");
    }
  }

  const filePath = extractFilePath(desc);
  return {
    title: findingTitle.substring(0, 200),
    description: desc.substring(0, 500),
    file: filePath,
    line: i + 1,
    category: detectCategory(findingTitle + " " + desc, currentDomain),
    severity: /critical|security|data.?loss/i.test(findingTitle) ? "S1" : "S2",
    sourceFile,
    sourceLine: i + 1,
    findingId: `FINDING-${findingId}`,
  };
}

function extractFromMarkdown(content, sourceFile) {
  const items = [];
  const lines = content.split(/\r?\n/);
  let currentDomain = "";
  let currentComponent = "";

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Track headings for context
    if (/^#{1,4}\s/.test(trimmed)) {
      const heading = trimmed
        .replace(/^#+\s*/, "")
        .replaceAll("*", "")
        .trim();
      if (/DOMAIN|FINDING|Domain/.test(heading)) {
        currentDomain = heading;
      } else {
        currentComponent = heading;
      }
    }

    const gap = tryExtractGap(trimmed, i, currentDomain, currentComponent, sourceFile);
    if (gap) {
      items.push(gap);
      continue;
    }

    const finding = tryExtractFinding(trimmed, i, lines, currentDomain, sourceFile);
    if (finding) {
      items.push(finding);
    }
  }

  return items;
}

// --- Extract items from all source files ---

function extractAllSourceFiles() {
  const allItems = [];
  for (const sourceFile of SOURCE_FILES) {
    const filePath = path.join(STATE_DIR, sourceFile);
    if (!fs.existsSync(filePath)) {
      console.log(`   Skipping ${sourceFile} (not found)`);
      continue;
    }
    try {
      const content = fs.readFileSync(filePath, "utf8").replaceAll("\uFEFF", "");
      const items = extractFromMarkdown(content, sourceFile);
      console.log(`   ${sourceFile}: ${items.length} items extracted`);
      allItems.push(...items);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   Error reading ${sourceFile}: ${msg}`);
    }
  }
  return allItems;
}

// --- Build TDMS entries and dedup ---

function buildAndDedupEntries(allItems, existingHashes) {
  const today = new Date().toISOString().split("T")[0];
  let nextSeq = computeNextSeq();
  const findings = [];
  const seenHashes = new Set();

  for (const item of allItems) {
    const entry = {
      id: `INTAKE-CTX-${String(nextSeq).padStart(4, "0")}`,
      source_id: `context:${item.sourceFile}:${item.sourceLine}`,
      source_file: item.sourceFile,
      category: item.category,
      severity: item.severity,
      type: "tech-debt",
      file: item.file,
      line: item.line,
      title: item.title,
      description: item.description,
      recommendation: `Address gap identified in ${item.sourceFile}.`,
      effort: "E1",
      status: "NEW",
      roadmap_ref: null,
      created: today,
      verified_by: null,
      resolution: null,
    };
    entry.content_hash = generateContentHash(entry);

    if (!existingHashes.has(entry.content_hash) && !seenHashes.has(entry.content_hash)) {
      seenHashes.add(entry.content_hash);
      findings.push(entry);
      nextSeq++;
    }
  }
  return findings;
}

// --- Print summary ---

function printCategorySummary(findings, verbose) {
  const cats = {};
  for (const f of findings) cats[f.category] = (cats[f.category] || 0) + 1;
  if (Object.keys(cats).length > 0) {
    console.log("\n   By category:");
    for (const [cat, count] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
      console.log(`     ${cat.padEnd(25)} ${count}`);
    }
  }
  if (verbose && findings.length > 0) {
    console.log("\n   Items:");
    for (const f of findings) {
      console.log(`     ${f.id}: [${f.severity}] ${f.title.substring(0, 70)}`);
    }
  }
}

// --- Main ---

function main() {
  const args = new Set(process.argv.slice(2));
  const writeMode = args.has("--write");
  const verbose = args.has("--verbose");

  console.log("\nExtract .claude/ Context Debt (Step 0f)");
  console.log(`   Mode: ${writeMode ? "WRITE" : "DRY RUN (use --write to save)"}`);

  const existingHashes = loadExistingHashes();
  console.log(`   Existing hashes (MASTER + intake): ${existingHashes.size}`);

  const allItems = extractAllSourceFiles();
  console.log(`\n   Total extracted: ${allItems.length}`);

  const findings = buildAndDedupEntries(allItems, existingHashes);
  console.log(`   After dedup: ${findings.length} new items`);
  console.log(`   Duplicates skipped: ${allItems.length - findings.length}`);

  printCategorySummary(findings, verbose);

  if (!writeMode) {
    console.log(
      `\n   DRY RUN complete. Use --write to append to ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`
    );
    return;
  }

  if (findings.length > 0) {
    const jsonlContent = findings.map((f) => JSON.stringify(f)).join("\n") + "\n";
    safeAppendFileSync(OUTPUT_FILE, jsonlContent, "utf-8");
    console.log(
      `\n   Appended ${findings.length} items to ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`
    );
  }
}

main();
