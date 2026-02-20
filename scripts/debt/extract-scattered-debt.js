#!/usr/bin/env node
/* global __dirname */
/**
 * Extract TODO/FIXME/HACK/XXX/WORKAROUND comments from source code into TDMS-format JSONL.
 *
 * Part of Technical Debt Resolution Step 0a.
 *
 * Usage: node scripts/debt/extract-scattered-debt.js [options]
 *
 * Options:
 *   --dry-run    Show what would be extracted without writing (default)
 *   --write      Actually write to scattered-intake.jsonl
 *   --verbose    Show all matches including filtered false positives
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEBT_DIR = path.join(PROJECT_ROOT, "docs/technical-debt");
const MASTER_FILE = path.join(DEBT_DIR, "MASTER_DEBT.jsonl");
const OUTPUT_FILE = path.join(DEBT_DIR, "raw/scattered-intake.jsonl");

const SCAN_DIRS = [
  "src",
  "app",
  "components",
  "lib",
  "hooks",
  "types",
  "scripts",
  ".claude/hooks",
  "functions/src",
];

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css"]);

// Match TODO:, TODO(, FIXME:, FIXME(, HACK:, HACK(, XXX:, WORKAROUND:
// Require : or ( after keyword — bare "TODO something" without colon is not actionable
const KEYWORD_RE = /\b(TODO|FIXME|HACK|XXX|WORKAROUND)(?=[:(])/gi;

const SEVERITY_MAP = { TODO: "S3", FIXME: "S2", HACK: "S2", XXX: "S2", WORKAROUND: "S2" };

// --- Reused from intake-audit.js ---

function generateContentHash(item) {
  const normalizedFile = (item.file || "").replace(/^\.\//, "").replace(/^\//, "").toLowerCase();
  const hashInput = [
    normalizedFile,
    item.line || 0,
    (item.title || "").toLowerCase().substring(0, 100),
    (item.description || "").toLowerCase().substring(0, 200),
  ].join("|");
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

function normalizeFilePath(filePath) {
  if (!filePath) return "";
  let normalized = filePath.replaceAll("\\", "/").replace(/^\.\//, "").replace(/^\/+/, "");
  const colonIndex = normalized.indexOf(":");
  if (colonIndex > 0) {
    const beforeColon = normalized.substring(0, colonIndex);
    if (!(beforeColon.length === 1 && /^[A-Za-z]$/.test(beforeColon))) {
      normalized = normalized.substring(colonIndex + 1);
    }
  }
  return normalized;
}

// --- Comment detection ---

// Quote characters that open/close string contexts
const QUOTE_CHARS = new Set(["'", '"', "`"]);

/**
 * Find where a line comment (//) or block comment start occurs,
 * ignoring those inside string literals. Returns -1 if none found.
 *
 * Uses a single `quoteChar` variable: null = not in string, else the opening quote.
 */
function findCommentStart(line) {
  let quoteChar = null;
  for (let i = 0; i < line.length - 1; i++) {
    const ch = line[i];
    // Inside a string: handle escape or closing quote
    if (quoteChar) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === quoteChar) quoteChar = null;
      continue;
    }
    // Outside a string: check for comment start or string opening
    if (ch === "/" && (line[i + 1] === "/" || line[i + 1] === "*")) return i;
    if (QUOTE_CHARS.has(ch)) quoteChar = ch;
  }
  return -1;
}

/**
 * Check if a position is inside quotes within a comment.
 * e.g., `// items like "[ ] TODO: fix"` — the TODO is inside quotes.
 */
function isInsideQuotesInComment(line, commentStart, matchIndex) {
  const segment = line.substring(commentStart, matchIndex);
  const doubleQuotes = (segment.match(/"/g) || []).length;
  const singleQuotes = (segment.match(/'/g) || []).length;
  return doubleQuotes % 2 !== 0 || singleQuotes % 2 !== 0;
}

/**
 * Determine if a keyword match is a false positive.
 */
function checkFalsePositive(line, matchIndex, inBlockComment) {
  // 1. Part of a variable/constant name: TODO_FILE, FIXME_LATER
  const surrounding = line.substring(
    Math.max(0, matchIndex - 15),
    Math.min(line.length, matchIndex + 25)
  );
  if (
    /\b(?:TODO_|FIXME_|HACK_|XXX_|WORKAROUND_)\w+\b/.test(surrounding) ||
    /\b\w+_(?:TODO|FIXME|HACK|XXX|WORKAROUND)\b/.test(surrounding)
  ) {
    return { isFP: true, reason: "variable name" };
  }

  // 2. If inside a multi-line block comment, it's a real comment
  if (inBlockComment) {
    // Check for JSDoc continuation lines (e.g., ` * keyword: list, of, items`)
    const trimmed = line.trim();
    if (/^\*\s/.test(trimmed)) {
      const commentStart = line.indexOf("*");
      if (isInsideQuotesInComment(line, commentStart, matchIndex)) {
        return { isFP: true, reason: "quoted example in comment" };
      }
    }
    return { isFP: false, reason: "" };
  }

  // 3. Find comment start on this line
  const commentStart = findCommentStart(line);
  if (commentStart < 0 || matchIndex < commentStart) {
    return { isFP: true, reason: "not in comment" };
  }

  // 4. Inside quotes within the comment text
  if (isInsideQuotesInComment(line, commentStart, matchIndex)) {
    return { isFP: true, reason: "quoted example in comment" };
  }

  return { isFP: false, reason: "" };
}

// --- Category detection ---

function detectCategory(commentText) {
  const lower = commentText.toLowerCase();
  if (/\b(optimi[sz]\w*|perf\w*|cache|latency|slow|fast)\b/.test(lower)) return "performance";
  if (/\b(complex|refactor|simplif|extract|decompos)\b/.test(lower)) return "refactoring";
  return "code-quality";
}

// --- Extract comment text after keyword ---

function extractCommentText(line, matchIndex, keyword) {
  let rest = line.substring(matchIndex + keyword.length);
  // Handle TODO(author): message
  const parenMatch = rest.match(/^\(([^)]*)\)\s*:?\s*(.*)/);
  if (parenMatch) {
    const author = parenMatch[1].trim();
    const message = parenMatch[2]
      .trim()
      .replace(/\*\/\s*$/, "")
      .trim();
    if (message && author) return `${message} (${author})`;
    if (message) return message;
    if (author) return author;
    return `${keyword} comment (no description)`;
  }
  // Handle TODO: message
  rest = rest
    .replace(/^:\s*/, "")
    .replace(/\*\/\s*$/, "")
    .trim();
  return rest || `${keyword} comment (no description)`;
}

// --- File scanning ---

function collectFiles(dirPath) {
  const files = [];
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink && entry.isSymbolicLink()) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
      files.push(...collectFiles(fullPath));
    } else if (entry.isFile() && SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

// --- Load existing MASTER_DEBT hashes ---

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
      // skip bad lines
    }
  }
  return hashes;
}

// --- Block comment state tracking ---

/**
 * Scan a line to determine block comment state at end of line.
 * Tracks string literals to avoid treating `/*` inside a string as a comment.
 */
function updateBlockCommentState(line, entering) {
  let inBlock = entering;
  let quoteChar = null;
  for (let c = 0; c < line.length - 1; c++) {
    const ch = line[c];
    if (quoteChar) {
      if (ch === "\\") {
        c += 1;
        continue;
      }
      if (ch === quoteChar) quoteChar = null;
      continue;
    }
    if (!inBlock && QUOTE_CHARS.has(ch)) {
      quoteChar = ch;
      continue;
    }
    if (!inBlock && ch === "/" && line[c + 1] === "*") {
      inBlock = true;
      c += 1;
    } else if (inBlock && ch === "*" && line[c + 1] === "/") {
      inBlock = false;
      c += 1;
    }
  }
  return inBlock;
}

/**
 * Determine if a specific position on a line is inside a block comment.
 * Tracks string literals to avoid treating `/*` inside a string as a comment.
 */
function isPositionInBlockComment(line, position, entering) {
  let inBlock = entering;
  let quoteChar = null;
  for (let c = 0; c < position && c < line.length - 1; c++) {
    const ch = line[c];
    if (quoteChar) {
      if (ch === "\\") {
        c += 1;
        continue;
      }
      if (ch === quoteChar) quoteChar = null;
      continue;
    }
    if (!inBlock && QUOTE_CHARS.has(ch)) {
      quoteChar = ch;
      continue;
    }
    if (!inBlock && ch === "/" && line[c + 1] === "*") {
      inBlock = true;
      c += 1;
    } else if (inBlock && ch === "*" && line[c + 1] === "/") {
      inBlock = false;
      c += 1;
    }
  }
  return inBlock;
}

// --- Build a TDMS finding from a keyword match ---

function buildFinding(relPath, lineNum, keyword, commentText, seq, today) {
  const category = detectCategory(commentText);
  const severity = SEVERITY_MAP[keyword] || "S3";
  const item = {
    id: `INTAKE-CODE-${String(seq).padStart(4, "0")}`,
    source_id: `code-comment:${relPath}:${lineNum}`,
    source_file: relPath,
    category,
    severity,
    type: "tech-debt",
    file: relPath,
    line: lineNum,
    title: commentText.substring(0, 200),
    description: `${keyword} comment found in ${relPath}:${lineNum}`,
    recommendation: `Address the ${keyword} comment and remove it once resolved.`,
    effort: "E1",
    status: "NEW",
    roadmap_ref: null,
    created: today,
    verified_by: null,
    resolution: null,
  };
  item.content_hash = generateContentHash(item);
  return item;
}

// --- Scan a single file ---

function scanFile(filePath, relPath, findings, falsePositives, nextSeq, today) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8").replaceAll("\uFEFF", "");
  } catch {
    return nextSeq;
  }

  const lines = content.split("\n");
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const lineEndBlock = updateBlockCommentState(line, inBlockComment);

    KEYWORD_RE.lastIndex = 0;
    let match;
    while ((match = KEYWORD_RE.exec(line)) !== null) {
      const keyword = match[1].toUpperCase();
      const posInBlock = isPositionInBlockComment(line, match.index, inBlockComment);
      const fpCheck = checkFalsePositive(line, match.index, posInBlock);

      if (fpCheck.isFP) {
        falsePositives.push({
          file: relPath,
          line: lineNum,
          keyword,
          reason: fpCheck.reason,
          text: line.trim(),
        });
        continue;
      }

      const commentText = extractCommentText(line, match.index, keyword);
      findings.push(buildFinding(relPath, lineNum, keyword, commentText, nextSeq, today));
      nextSeq++;
    }

    inBlockComment = lineEndBlock;
  }

  return nextSeq;
}

// --- Main helpers ---

function collectAllFiles(selfPath) {
  const allFiles = [];
  for (const dir of SCAN_DIRS) {
    const absDir = path.join(PROJECT_ROOT, dir);
    for (const f of collectFiles(absDir)) {
      if (path.resolve(f) !== selfPath) allFiles.push(f);
    }
  }
  return allFiles;
}

function reportResults(findings, falsePositives, newFindings, dupCount, verbose) {
  console.log(`   Results:`);
  console.log(`     Matches found:      ${findings.length + falsePositives.length}`);
  console.log(`     False positives:    ${falsePositives.length}`);
  console.log(`     Real findings:      ${findings.length}`);
  console.log(`     Already in MASTER:  ${dupCount}`);
  console.log(`     New to extract:     ${newFindings.length}`);

  if (verbose && falsePositives.length > 0) {
    console.log(`\n   False positives filtered:`);
    for (const fp of falsePositives) {
      console.log(`     ${fp.file}:${fp.line} [${fp.keyword}] (${fp.reason})`);
      console.log(`       ${fp.text.substring(0, 120)}`);
    }
  }

  if (newFindings.length > 0) {
    console.log(`\n   Extracted items:`);
    for (const item of newFindings) {
      console.log(
        `     ${item.id}: ${item.file}:${item.line} [${item.severity}] ${item.title.substring(0, 80)}`
      );
    }
  }
}

// --- Main ---

function main() {
  const args = new Set(process.argv.slice(2));
  const writeMode = args.has("--write");
  const verbose = args.has("--verbose");
  const dryRun = !writeMode;

  console.log(`\nExtract Scattered Debt (TODO/FIXME/HACK/XXX/WORKAROUND)`);
  console.log(`   Mode: ${dryRun ? "DRY RUN (use --write to save)" : "WRITE"}`);
  if (verbose) console.log(`   Verbose: showing all matches including false positives`);

  // Collect files, excluding self
  const selfPath = path.resolve(__dirname, "extract-scattered-debt.js");
  const allFiles = collectAllFiles(selfPath);
  console.log(`\n   Scanning ${allFiles.length} files across ${SCAN_DIRS.length} directories...\n`);

  const findings = [];
  const falsePositives = [];
  let nextSeq = 1;
  const today = new Date().toISOString().split("T")[0];

  for (const filePath of allFiles) {
    const relPath = normalizeFilePath(path.relative(PROJECT_ROOT, filePath));
    nextSeq = scanFile(filePath, relPath, findings, falsePositives, nextSeq, today);
  }

  // Dedup against existing MASTER_DEBT
  const existingHashes = loadExistingHashes();
  const newFindings = findings.filter((f) => !existingHashes.has(f.content_hash));
  const dupCount = findings.length - newFindings.length;

  reportResults(findings, falsePositives, newFindings, dupCount, verbose);

  if (dryRun) {
    console.log(
      `\n   DRY RUN complete. Use --write to save to ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`
    );
    return;
  }

  // Write output
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  const jsonlContent = newFindings.map((f) => JSON.stringify(f)).join("\n") + "\n";
  fs.writeFileSync(OUTPUT_FILE, jsonlContent, "utf-8");
  console.log(
    `\n   Wrote ${newFindings.length} items to ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`
  );
}

main();
