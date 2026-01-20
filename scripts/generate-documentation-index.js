#!/usr/bin/env node

/**
 * Documentation Index Generator
 *
 * Scans all markdown files in the repository and generates a comprehensive
 * DOCUMENTATION_INDEX.md with categories, descriptions, references, and dependencies.
 *
 * Usage: node scripts/generate-documentation-index.js [--json] [--verbose]
 *
 * Options:
 *   --json     Output JSON instead of markdown
 *   --verbose  Show detailed processing information
 */

import { readFileSync, writeFileSync, readdirSync, statSync, lstatSync } from "node:fs";
import { join, relative, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// Configuration
const CONFIG = {
  excludeDirs: ["node_modules", ".git", ".next", "coverage", "dist", ".turbo"],
  excludeFiles: ["DOCUMENTATION_INDEX.md"], // Don't index ourselves
  archiveDirs: ["docs/archive"], // Archived docs - just list, don't fully track
  outputFile: "DOCUMENTATION_INDEX.md",
  maxDescriptionLength: 200,
};

// Tier description mapping (S3776 complexity reduction)
const TIER_DESCRIPTIONS = {
  1: "Essential",
  2: "Core",
  3: "Specialized",
  4: "Reference",
  5: "Archive",
};

// External URL schemes to skip in link extraction (S3776 complexity reduction)
const EXTERNAL_SCHEMES = ["http://", "https://", "mailto:", "tel:", "data:"];

// Image extensions to skip in link extraction (S3776 complexity reduction)
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];

/**
 * Check if href is an external link or special scheme.
 */
function isExternalOrSpecialLink(href) {
  return EXTERNAL_SCHEMES.some((scheme) => href.startsWith(scheme));
}

/**
 * Check if href points to an image file.
 */
function isImageLink(href) {
  const lower = href.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// Category definitions based on directory structure
const CATEGORIES = {
  root: { name: "Root Documents", tier: 1, description: "Essential project-level documentation" },
  docs: { name: "Core Documentation", tier: 2, description: "Main documentation directory" },
  "docs/templates": { name: "Templates", tier: 3, description: "Document and audit templates" },
  "docs/reviews": { name: "Reviews & Audits", tier: 3, description: "Audit plans and findings" },
  "docs/reviews/2026-Q1": {
    name: "2026 Q1 Reviews",
    tier: 3,
    description: "Q1 2026 audit documentation",
  },
  "docs/reviews/2026-Q1/canonical": {
    name: "Canonical Findings",
    tier: 4,
    description: "JSONL canonical findings",
  },
  "docs/archive": {
    name: "Archive",
    tier: 5,
    description: "Historical and completed documentation",
  },
  "docs/archive/completed-plans": {
    name: "Completed Plans",
    tier: 5,
    description: "Archived completed plans",
  },
  "docs/agent_docs": {
    name: "Agent Documentation",
    tier: 3,
    description: "AI agent reference docs",
  },
  "docs/brainstorm": { name: "Brainstorm", tier: 4, description: "Draft and planning documents" },
  "docs/analysis": { name: "Analysis", tier: 4, description: "Code analysis and metrics" },
  ".claude/commands": {
    name: "Slash Commands",
    tier: 3,
    description: "Claude Code custom commands",
  },
  ".claude/skills": { name: "Skills", tier: 3, description: "Claude Code skills" },
};

// Parse command line arguments
const args = process.argv.slice(2);
const jsonOutput = args.includes("--json");
const verbose = args.includes("--verbose");

/**
 * Check if a path is in an archive directory
 * Uses proper path boundary check to avoid matching "docs/archiveXYZ"
 */
function isArchived(relativePath) {
  return CONFIG.archiveDirs.some(
    (archiveDir) => relativePath === archiveDir || relativePath.startsWith(archiveDir + "/")
  );
}

/**
 * Canonicalize a path by resolving . and .. segments
 * Returns null if path escapes root (starts with ..)
 */
function canonicalizePath(inputPath) {
  const segments = inputPath.split("/");
  const result = [];

  for (const segment of segments) {
    if (segment === "" || segment === ".") {
      continue;
    }
    if (segment === "..") {
      if (result.length === 0) {
        // Path escapes root
        return null;
      }
      result.pop();
    } else {
      result.push(segment);
    }
  }

  return result.join("/");
}

/**
 * Escape special characters for markdown table cells
 * Prevents markdown injection via untrusted content (e.g., doc titles)
 * Escapes: ampersands, pipes, brackets, parentheses, backticks, angle brackets, backslashes
 */
function escapeTableCell(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;") // Escape ampersand FIRST (before other HTML entities)
    .replace(/\\/g, "\\\\") // Escape backslash second
    .replace(/\|/g, "\\|") // Escape pipe (table delimiter)
    .replace(/\[/g, "\\[") // Escape opening bracket
    .replace(/\]/g, "\\]") // Escape closing bracket
    .replace(/\(/g, "\\(") // Escape opening paren (prevents link injection)
    .replace(/\)/g, "\\)") // Escape closing paren
    .replace(/`/g, "\\`") // Escape backticks (prevents code injection)
    .replace(/</g, "&lt;") // Escape angle brackets (prevents HTML)
    .replace(/>/g, "&gt;")
    .replace(/\n/g, " ") // Replace newlines with spaces
    .replace(/\r/g, ""); // Remove carriage returns
}

/**
 * Check if an entry should be skipped based on exclude patterns
 * @param {string} entry - Directory entry name
 * @param {string} relativePath - Relative path from root
 * @returns {boolean} True if entry should be skipped
 */
function shouldSkipEntry(entry, relativePath) {
  return CONFIG.excludeDirs.some(
    (exc) => entry === exc || relativePath === exc || relativePath.startsWith(exc + "/")
  );
}

/**
 * Safely get lstat for a path
 * @param {string} fullPath - Full file path
 * @param {string} relativePath - Relative path for logging
 * @returns {{stat: object|null, isSymlink: boolean}} Stat result
 */
function safeStatEntry(fullPath, relativePath) {
  try {
    const stat = lstatSync(fullPath);
    return { stat, isSymlink: stat.isSymbolicLink() };
  } catch (error) {
    if (verbose && !jsonOutput) {
      console.error(`   Warning: Cannot stat ${relativePath}: ${error.code || "unknown error"}`);
    }
    return { stat: null, isSymlink: false };
  }
}

/**
 * Find all markdown files in the repository
 * Returns { active: [], archived: [] }
 */
function findMarkdownFiles(dir, result = { active: [], archived: [] }) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch (error) {
    // Handle permission denied, not a directory, etc.
    if (!jsonOutput) {
      console.error(
        `   Warning: Cannot read directory ${relative(ROOT, dir)}: ${error.code || "unknown error"}`
      );
    }
    return result;
  }

  // Sort entries for deterministic output
  entries.sort();

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relativePath = relative(ROOT, fullPath).replace(/\\/g, "/"); // Cross-platform normalization

    // Skip excluded directories (with proper boundary check)
    if (shouldSkipEntry(entry, relativePath)) continue;

    // Use lstatSync to detect symlinks without following them
    const { stat, isSymlink } = safeStatEntry(fullPath, relativePath);
    if (!stat) continue;

    // Skip symlinks to prevent recursion and escape
    if (isSymlink) {
      if (verbose && !jsonOutput) console.log(`   Skipping symlink: ${relativePath}`);
      continue;
    }

    if (stat.isDirectory()) {
      findMarkdownFiles(fullPath, result);
    } else if (extname(entry).toLowerCase() === ".md" && !CONFIG.excludeFiles.includes(entry)) {
      // Categorize as active or archived
      (isArchived(relativePath) ? result.archived : result.active).push(relativePath);
    }
  }

  return result;
}

/**
 * Extract frontmatter from markdown content
 */
function extractFrontmatter(content) {
  const frontmatter = {};

  // Check for YAML-style frontmatter
  const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (yamlMatch) {
    const yaml = yamlMatch[1];
    const lines = yaml.split("\n");
    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim().toLowerCase();
        let value = line.slice(colonIndex + 1).trim();
        // Handle quoted values (single or double quotes)
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        frontmatter[key] = value;
      }
    }
    return frontmatter;
  }

  // Check for metadata block (our standard format)
  // **Document Version:** 1.0
  // **Created:** 2026-01-05
  const metadataPatterns = [
    { pattern: /\*\*Document Version:\*\*\s*([^\n]+)/i, key: "version" },
    { pattern: /\*\*Version:\*\*\s*([^\n]+)/i, key: "version" },
    { pattern: /\*\*Created:\*\*\s*([^\n]+)/i, key: "created" },
    { pattern: /\*\*Last Updated:\*\*\s*([^\n]+)/i, key: "lastUpdated" },
    { pattern: /\*\*Status:\*\*\s*([^\n]+)/i, key: "status" },
    { pattern: /\*\*Document Type:\*\*\s*([^\n]+)/i, key: "type" },
    { pattern: /\*\*Purpose:\*\*\s*([^\n]+)/i, key: "purpose" },
  ];

  for (const { pattern, key } of metadataPatterns) {
    const match = content.match(pattern);
    if (match) {
      frontmatter[key] = match[1].trim();
    }
  }

  return frontmatter;
}

/**
 * Extract title from markdown content
 */
function extractTitle(content, filename) {
  // Look for first H1 heading (bounded to prevent ReDoS)
  const h1Match = content.match(/^#\s+(.{1,500})$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Fall back to filename
  return basename(filename, ".md").replace(/[-_]/g, " ");
}

/**
 * Extract description from markdown content
 * All regex patterns use bounded quantifiers to prevent ReDoS
 */
function extractDescription(content) {
  // Try to find Purpose section (bounded to 2000 chars to prevent ReDoS)
  const purposeMatch = content.match(
    /##\s*Purpose\s*\r?\n\r?\n([\s\S]{0,2000}?)(?=\r?\n##|\r?\n---|$)/i
  );
  if (purposeMatch) {
    const purpose = purposeMatch[1].trim().split("\n")[0];
    if (purpose.length > 0 && purpose.length <= CONFIG.maxDescriptionLength) {
      return purpose;
    }
    if (purpose.length > CONFIG.maxDescriptionLength) {
      return purpose.slice(0, CONFIG.maxDescriptionLength - 3) + "...";
    }
  }

  // Try to find first paragraph after title (bounded to prevent ReDoS)
  const titleMatch = content.match(/^#\s+.{1,500}$/m);
  if (titleMatch) {
    const afterTitle = content.slice(titleMatch.index + titleMatch[0].length);
    const firstPara = afterTitle.match(/\r?\n\r?\n([^#\n][^\n]{1,500})/);
    if (firstPara) {
      const para = firstPara[1].trim();
      // Skip metadata lines
      if (!para.startsWith("**") && para.length > 10) {
        if (para.length <= CONFIG.maxDescriptionLength) {
          return para;
        }
        return para.slice(0, CONFIG.maxDescriptionLength - 3) + "...";
      }
    }
  }

  return null;
}

/**
 * Strip code blocks from content to avoid parsing links inside them
 * Uses line-by-line parsing to avoid ReDoS with backreference regex
 * Handles indented fenced code blocks (0-3 spaces before fence per CommonMark)
 */
function stripCodeBlocks(content) {
  const lines = content.split("\n");
  const result = [];
  let inCodeBlock = false;
  let codeBlockFence = null;

  for (const line of lines) {
    // Check for code block fence (``` or ~~~) with optional 0-3 space indent
    // CommonMark allows up to 3 spaces before the fence
    const fenceMatch = line.match(/^( {0,3})(`{3,}|~{3,})/);

    if (fenceMatch) {
      const indent = fenceMatch[1].length;
      const fence = fenceMatch[2][0]; // Get the fence character (` or ~)
      const fenceLength = fenceMatch[2].length;

      if (!inCodeBlock) {
        // Starting a code block
        inCodeBlock = true;
        codeBlockFence = { char: fence, length: fenceLength, indent };
      } else if (fence === codeBlockFence.char && fenceLength >= codeBlockFence.length) {
        // Ending the code block (same or longer fence)
        inCodeBlock = false;
        codeBlockFence = null;
      }
      // Skip fence lines
      continue;
    }

    // Only include lines outside code blocks
    if (!inCodeBlock) {
      result.push(line);
    }
  }

  return result.join("\n");
}

/**
 * Extract all markdown links from content
 */
function extractLinks(content, currentFile) {
  const links = [];
  const seenTargets = new Set(); // Deduplicate links to same target
  const currentDir = dirname(currentFile);

  // Strip code blocks to avoid parsing links in code examples
  const strippedContent = stripCodeBlocks(content);

  // Match markdown links with bounded quantifiers: [text](path)
  // Bounded to prevent ReDoS: text max 500 chars, href max 500 chars
  const linkRegex = /\[([^\]]{1,500})\]\(([^)]{1,500})\)/g;
  let match;

  while ((match = linkRegex.exec(strippedContent)) !== null) {
    const [, text, href] = match;

    // Skip external URLs, anchors, and image links using helpers (S3776)
    if (isExternalOrSpecialLink(href) || href.startsWith("#") || isImageLink(href)) {
      continue;
    }

    // Extract path (remove anchor if present)
    let path = href.split("#")[0];

    // Skip empty paths
    if (!path) continue;

    // URL-decode path for special characters
    try {
      path = decodeURIComponent(path);
    } catch {
      // Keep original if decode fails
    }

    // Resolve relative path
    let resolvedPath;
    if (path.startsWith("/")) {
      resolvedPath = path.slice(1); // Remove leading slash
    } else {
      resolvedPath = join(currentDir, path);
    }

    // Normalize path (cross-platform)
    resolvedPath = resolvedPath.replace(/\\/g, "/");

    // Canonicalize path to resolve . and .. segments properly
    // This handles cases like "docs/../scripts/file.md" → "scripts/file.md"
    resolvedPath = canonicalizePath(resolvedPath);

    // Path containment check: canonicalizePath returns null if path escapes root
    if (resolvedPath === null) {
      continue;
    }

    // Only include .md files
    if (resolvedPath.endsWith(".md")) {
      // Deduplicate links to same target
      if (!seenTargets.has(resolvedPath)) {
        seenTargets.add(resolvedPath);
        links.push({
          text,
          target: resolvedPath,
          raw: href,
        });
      }
    }
  }

  return links;
}

/**
 * Determine category for a file based on its path
 */
function getCategory(filePath) {
  const dir = dirname(filePath);

  // Check for exact match first
  if (CATEGORIES[dir]) {
    return { path: dir, ...CATEGORIES[dir] };
  }

  // Check for parent directory match
  const parts = dir.split("/");
  while (parts.length > 0) {
    const checkPath = parts.join("/");
    if (CATEGORIES[checkPath]) {
      return { path: checkPath, ...CATEGORIES[checkPath] };
    }
    parts.pop();
  }

  // Root level files
  if (dir === ".") {
    return { path: "root", ...CATEGORIES["root"] };
  }

  // Default category
  return {
    path: dir,
    name: dir.replace(/\//g, " > "),
    tier: 4,
    description: "Uncategorized",
  };
}

/**
 * Process a single markdown file
 */
function processFile(filePath) {
  const fullPath = join(ROOT, filePath);

  try {
    const content = readFileSync(fullPath, "utf-8");
    const frontmatter = extractFrontmatter(content);
    const title = extractTitle(content, filePath);
    const description = frontmatter.purpose || extractDescription(content);
    const links = extractLinks(content, filePath);
    const category = getCategory(filePath);
    const stat = statSync(fullPath);

    return {
      path: filePath,
      title,
      description,
      category,
      frontmatter,
      links,
      lastModified: stat.mtime.toISOString().split("T")[0],
      size: stat.size,
    };
  } catch (error) {
    // Sanitize error: only show error code, not full message which may expose paths
    const errorCode = error.code || "UNKNOWN";
    if (!jsonOutput) {
      console.error(`   Warning: Cannot process ${filePath}: ${errorCode}`);
    }
    return null;
  }
}

/**
 * Build reference graph (who links to whom)
 */
function buildReferenceGraph(docs) {
  const graph = new Map();

  // Initialize graph
  for (const doc of docs) {
    graph.set(doc.path, { inbound: [], outbound: [] });
  }

  // Build connections
  for (const doc of docs) {
    const node = graph.get(doc.path);

    for (const link of doc.links) {
      // Normalize target path
      let target = link.target;

      // Check if target exists
      if (graph.has(target)) {
        node.outbound.push(target);
        graph.get(target).inbound.push(doc.path);
      }
    }
  }

  return graph;
}

/**
 * Generate summary statistics section
 * @param {Array} docs - Processed documents
 * @returns {string[]} Lines for the summary section
 */
function generateSummaryStats(docs) {
  const lines = [];
  const categoryCount = new Map();
  const tierCount = new Map();

  for (const doc of docs) {
    const catKey = doc.category.name;
    categoryCount.set(catKey, (categoryCount.get(catKey) || 0) + 1);
    tierCount.set(doc.category.tier, (tierCount.get(doc.category.tier) || 0) + 1);
  }

  lines.push(
    "## Summary Statistics",
    "",
    "### By Tier",
    "",
    "| Tier | Count | Description |",
    "|------|-------|-------------|"
  );
  for (const tier of [1, 2, 3, 4, 5]) {
    const count = tierCount.get(tier) || 0;
    const desc = TIER_DESCRIPTIONS[tier] || "Unknown";
    lines.push(`| Tier ${tier} | ${count} | ${desc} |`);
  }
  lines.push("", "### By Category", "", "| Category | Count |", "|----------|-------|");
  const sortedCategories = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCategories) {
    lines.push(`| ${cat} | ${count} |`);
  }
  lines.push("", "---", "");
  return lines;
}

/**
 * Group documents by category
 * @param {Array} docs - Processed documents
 * @returns {Map} Map of category path to {category, docs[]}
 */
function groupDocsByCategory(docs) {
  const byCategory = new Map();
  for (const doc of docs) {
    const catKey = doc.category.path;
    if (!byCategory.has(catKey)) {
      byCategory.set(catKey, { category: doc.category, docs: [] });
    }
    byCategory.get(catKey).docs.push(doc);
  }
  return byCategory;
}

/**
 * Sort categories by tier, then name
 * @param {Map} byCategory - Category map
 * @returns {string[]} Sorted category keys
 */
function sortCategoryKeys(byCategory) {
  return [...byCategory.keys()].sort((a, b) => {
    const catA = byCategory.get(a).category;
    const catB = byCategory.get(b).category;
    if (catA.tier !== catB.tier) return catA.tier - catB.tier;
    return catA.name.localeCompare(catB.name);
  });
}

/**
 * Format document row for category table
 * @param {Object} doc - Document object
 * @param {Map} referenceGraph - Reference graph
 * @returns {string} Table row
 */
function formatDocumentRow(doc, referenceGraph) {
  const refs = referenceGraph.get(doc.path);
  const inCount = refs ? refs.inbound.length : 0;
  const outCount = refs ? refs.outbound.length : 0;
  const refStr = `↓${inCount} ↑${outCount}`;
  let desc = doc.description
    ? doc.description.slice(0, 60) + (doc.description.length > 60 ? "..." : "")
    : "-";
  desc = desc.replace(/\|/g, "\\|");
  const linkPath = encodeURI(doc.path);
  const safeTitle = doc.title.replace(/\|/g, "\\|");
  return `| [${safeTitle}](${linkPath}) | ${desc} | ${refStr} | ${doc.lastModified} |`;
}

/**
 * Generate documents by category section
 * @param {Array} docs - Processed documents
 * @param {Map} referenceGraph - Reference graph
 * @returns {string[]} Lines for the category section
 */
function generateDocsByCategorySection(docs, referenceGraph) {
  const lines = [];
  lines.push("## Documents by Category", "");

  const byCategory = groupDocsByCategory(docs);
  const sortedCategoryKeys = sortCategoryKeys(byCategory);

  for (const catKey of sortedCategoryKeys) {
    const { category, docs: catDocs } = byCategory.get(catKey);
    lines.push(
      `### ${category.name} (Tier ${category.tier})`,
      "",
      `*${category.description}*`,
      "",
      "| Document | Description | References | Last Modified |",
      "|----------|-------------|------------|---------------|"
    );

    catDocs.sort((a, b) => a.title.localeCompare(b.title));
    for (const doc of catDocs) {
      lines.push(formatDocumentRow(doc, referenceGraph));
    }
    lines.push("");
  }
  lines.push("---", "");
  return lines;
}

/**
 * Generate reference graph section (inbound and outbound)
 * @param {Map} referenceGraph - Reference graph
 * @param {Map} docsByPath - Document lookup map
 * @returns {string[]} Lines for the reference graph section
 */
function generateReferenceGraphSection(referenceGraph, docsByPath) {
  const lines = [];
  lines.push("## Reference Graph");
  lines.push("");
  lines.push("### Most Referenced Documents (Inbound Links)");
  lines.push("");
  lines.push("Documents that are linked to most frequently:");
  lines.push("");

  const byInbound = [...referenceGraph.entries()]
    .map(([path, refs]) => ({ path, count: refs.inbound.length, refs: refs.inbound }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  lines.push("| Document | Inbound Links | Referenced By |");
  lines.push("|----------|---------------|---------------|");
  for (const { path, count, refs } of byInbound) {
    const doc = docsByPath.get(path);
    const title = doc ? doc.title : basename(path, ".md");
    const linkPath = encodeURI(path);
    const refList = refs
      .slice(0, 3)
      .map((r) => basename(r, ".md"))
      .join(", ");
    const more = refs.length > 3 ? ` +${refs.length - 3} more` : "";
    lines.push(`| [${escapeTableCell(title)}](${linkPath}) | ${count} | ${refList}${more} |`);
  }
  lines.push("");

  lines.push("### Most Linking Documents (Outbound Links)");
  lines.push("");
  lines.push("Documents that link to other documents most frequently:");
  lines.push("");

  const byOutbound = [...referenceGraph.entries()]
    .map(([path, refs]) => ({ path, count: refs.outbound.length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  lines.push("| Document | Outbound Links |");
  lines.push("|----------|----------------|");
  for (const { path, count } of byOutbound) {
    const doc = docsByPath.get(path);
    const title = doc ? doc.title : basename(path, ".md");
    const linkPath = encodeURI(path);
    lines.push(`| [${escapeTableCell(title)}](${linkPath}) | ${count} |`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  return lines;
}

/**
 * Generate markdown output
 */
function generateMarkdown(docs, referenceGraph, archivedFiles = []) {
  const lines = [];
  const now = new Date().toISOString().split("T")[0];

  // Create path->doc lookup Map for O(1) lookups instead of O(n) docs.find()
  const docsByPath = new Map(docs.map((d) => [d.path, d]));

  // Header
  lines.push(
    "# Documentation Index",
    "",
    "> **Auto-generated** - Do not edit manually. Run `npm run docs:index` to regenerate.",
    "",
    `**Generated:** ${now}`,
    `**Active Documents:** ${docs.length}`,
    `**Archived Documents:** ${archivedFiles.length}`,
    "",
    "---",
    ""
  );

  // Table of Contents
  lines.push(
    "## Table of Contents",
    "",
    "1. [Summary Statistics](#summary-statistics)",
    "2. [Documents by Category](#documents-by-category)",
    "3. [Reference Graph](#reference-graph)",
    "4. [Orphaned Documents](#orphaned-documents)",
    "5. [Full Document List](#full-document-list)",
    "6. [Archived Documents](#archived-documents)",
    "",
    "---",
    ""
  );

  // Summary Statistics (extracted helper)
  lines.push(...generateSummaryStats(docs));

  // Documents by Category (extracted helper)
  lines.push(...generateDocsByCategorySection(docs, referenceGraph));

  // Reference Graph (extracted helper)
  lines.push(...generateReferenceGraphSection(referenceGraph, docsByPath));

  // Orphaned Documents
  lines.push(
    "## Orphaned Documents",
    "",
    "Documents with no inbound links (not referenced by any other document):",
    ""
  );

  const orphaned = [...referenceGraph.entries()]
    .filter(([, refs]) => refs.inbound.length === 0)
    .map(([path]) => path)
    .sort();

  if (orphaned.length === 0) {
    lines.push("*No orphaned documents found.*");
  } else {
    lines.push(`**${orphaned.length} orphaned documents:**`, "");
    for (const path of orphaned) {
      const doc = docsByPath.get(path);
      const title = doc ? doc.title : basename(path, ".md");
      const linkPath = encodeURI(path);
      lines.push(`- [${escapeTableCell(title)}](${linkPath})`);
    }
  }
  lines.push("", "---", "");

  // Full Document List
  lines.push(
    "## Full Document List",
    "",
    "<details>",
    "<summary>Click to expand full list of all documents</summary>",
    "",
    "| # | Path | Title | Tier | Status |",
    "|---|------|-------|------|--------|"
  );

  const sortedDocs = [...docs].sort((a, b) => a.path.localeCompare(b.path));
  let i = 1;
  for (const doc of sortedDocs) {
    const status = doc.frontmatter.status || "-";
    const linkPath = encodeURI(doc.path);
    lines.push(
      `| ${i++} | [${escapeTableCell(doc.path)}](${linkPath}) | ${escapeTableCell(doc.title)} | ${doc.category.tier} | ${escapeTableCell(status)} |`
    );
  }

  lines.push("", "</details>", "", "---", "");

  // Archived Documents (simple list, not fully tracked)
  lines.push(
    "## Archived Documents",
    "",
    "*Historical and completed documentation. These documents are preserved for reference but not actively tracked in the reference graph.*",
    ""
  );

  if (archivedFiles.length === 0) {
    lines.push("*No archived documents.*");
  } else {
    lines.push(
      "<details>",
      "<summary>Click to expand archived documents list</summary>",
      "",
      "| # | Path |",
      "|---|------|"
    );
    const sortedArchived = [...archivedFiles].sort();
    let archiveNum = 1;
    for (const filePath of sortedArchived) {
      const linkPath = encodeURI(filePath);
      lines.push(`| ${archiveNum++} | [${escapeTableCell(filePath)}](${linkPath}) |`);
    }
    lines.push("", "</details>");
  }
  lines.push("", "---", "", "*Generated by `scripts/generate-documentation-index.js`*", "");

  return lines.join("\n");
}

/**
 * Log helper that respects JSON mode
 */
function log(message) {
  if (!jsonOutput) {
    console.log(message);
  }
}

/**
 * Main execution
 */
function main() {
  log("📚 Documentation Index Generator");
  log("================================");
  log("");

  // Find all markdown files (separated into active and archived)
  log("🔍 Scanning for markdown files...");
  const { active: activeFiles, archived: archivedFiles } = findMarkdownFiles(ROOT);
  log(`   Found ${activeFiles.length} active files, ${archivedFiles.length} archived files`);

  // Process each active file (archived files just get listed, not processed)
  log("📄 Processing active files...");
  const docs = [];
  for (const file of activeFiles) {
    if (verbose && !jsonOutput) {
      console.log(`   Processing: ${file}`);
    }
    const doc = processFile(file);
    if (doc) {
      docs.push(doc);
    }
  }
  log(`   Processed ${docs.length} active documents`);

  // Build reference graph (only for active docs)
  log("🔗 Building reference graph...");
  const referenceGraph = buildReferenceGraph(docs);

  let totalLinks = 0;
  for (const [, refs] of referenceGraph) {
    totalLinks += refs.outbound.length;
  }
  log(`   Found ${totalLinks} internal links`);

  // Generate output
  if (jsonOutput) {
    const output = {
      generated: new Date().toISOString(),
      activeDocuments: docs.length,
      archivedDocuments: archivedFiles.length,
      totalLinks,
      documents: docs.map((doc) => ({
        ...doc,
        references: {
          inbound: referenceGraph.get(doc.path)?.inbound || [],
          outbound: referenceGraph.get(doc.path)?.outbound || [],
        },
      })),
      archived: archivedFiles,
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    log("📝 Generating markdown index...");
    const markdown = generateMarkdown(docs, referenceGraph, archivedFiles);

    const outputPath = join(ROOT, CONFIG.outputFile);
    try {
      writeFileSync(outputPath, markdown, "utf-8");
      log(`   Written to ${CONFIG.outputFile}`);
    } catch (writeError) {
      console.error(`Error writing to ${CONFIG.outputFile}: ${writeError.message}`);
      process.exit(1);
    }

    // Summary
    log("");
    log("✅ Documentation index generated successfully!");
    log("");
    log("Summary:");
    log(`   📄 Active documents: ${docs.length}`);
    log(`   📦 Archived documents: ${archivedFiles.length}`);
    log(`   🔗 Internal links: ${totalLinks}`);

    const orphaned = [...referenceGraph.entries()].filter(
      ([, refs]) => refs.inbound.length === 0
    ).length;
    log(`   ⚠️  Orphaned docs: ${orphaned}`);
  }
}

main();
