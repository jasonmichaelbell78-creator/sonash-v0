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

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Configuration
const CONFIG = {
  excludeDirs: ['node_modules', '.git', '.next', 'coverage', 'dist', '.turbo'],
  excludeFiles: ['DOCUMENTATION_INDEX.md'], // Don't index ourselves
  archiveDirs: ['docs/archive'], // Archived docs - just list, don't fully track
  outputFile: 'DOCUMENTATION_INDEX.md',
  maxDescriptionLength: 200,
};

// Category definitions based on directory structure
const CATEGORIES = {
  'root': { name: 'Root Documents', tier: 1, description: 'Essential project-level documentation' },
  'docs': { name: 'Core Documentation', tier: 2, description: 'Main documentation directory' },
  'docs/templates': { name: 'Templates', tier: 3, description: 'Document and audit templates' },
  'docs/reviews': { name: 'Reviews & Audits', tier: 3, description: 'Audit plans and findings' },
  'docs/reviews/2026-Q1': { name: '2026 Q1 Reviews', tier: 3, description: 'Q1 2026 audit documentation' },
  'docs/reviews/2026-Q1/canonical': { name: 'Canonical Findings', tier: 4, description: 'JSONL canonical findings' },
  'docs/archive': { name: 'Archive', tier: 5, description: 'Historical and completed documentation' },
  'docs/archive/completed-plans': { name: 'Completed Plans', tier: 5, description: 'Archived completed plans' },
  'docs/agent_docs': { name: 'Agent Documentation', tier: 3, description: 'AI agent reference docs' },
  'docs/brainstorm': { name: 'Brainstorm', tier: 4, description: 'Draft and planning documents' },
  'docs/analysis': { name: 'Analysis', tier: 4, description: 'Code analysis and metrics' },
  '.claude/commands': { name: 'Slash Commands', tier: 3, description: 'Claude Code custom commands' },
  '.claude/skills': { name: 'Skills', tier: 3, description: 'Claude Code skills' },
};

// Parse command line arguments
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const verbose = args.includes('--verbose');

/**
 * Check if a path is in an archive directory
 */
function isArchived(relativePath) {
  return CONFIG.archiveDirs.some(archiveDir => relativePath.startsWith(archiveDir));
}

/**
 * Find all markdown files in the repository
 * Returns { active: [], archived: [] }
 */
function findMarkdownFiles(dir, result = { active: [], archived: [] }) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relativePath = relative(ROOT, fullPath);

    // Skip excluded directories
    if (CONFIG.excludeDirs.some(exc => relativePath.startsWith(exc) || entry === exc)) {
      continue;
    }

    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findMarkdownFiles(fullPath, result);
    } else if (extname(entry).toLowerCase() === '.md') {
      // Skip excluded files
      if (!CONFIG.excludeFiles.includes(entry)) {
        // Separate archived from active
        if (isArchived(relativePath)) {
          result.archived.push(relativePath);
        } else {
          result.active.push(relativePath);
        }
      }
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
    const lines = yaml.split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim().toLowerCase();
        const value = line.slice(colonIndex + 1).trim();
        frontmatter[key] = value;
      }
    }
    return frontmatter;
  }

  // Check for metadata block (our standard format)
  // **Document Version:** 1.0
  // **Created:** 2026-01-05
  const metadataPatterns = [
    { pattern: /\*\*Document Version:\*\*\s*([^\n]+)/i, key: 'version' },
    { pattern: /\*\*Version:\*\*\s*([^\n]+)/i, key: 'version' },
    { pattern: /\*\*Created:\*\*\s*([^\n]+)/i, key: 'created' },
    { pattern: /\*\*Last Updated:\*\*\s*([^\n]+)/i, key: 'lastUpdated' },
    { pattern: /\*\*Status:\*\*\s*([^\n]+)/i, key: 'status' },
    { pattern: /\*\*Document Type:\*\*\s*([^\n]+)/i, key: 'type' },
    { pattern: /\*\*Purpose:\*\*\s*([^\n]+)/i, key: 'purpose' },
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
  // Look for first H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Fall back to filename
  return basename(filename, '.md').replace(/[-_]/g, ' ');
}

/**
 * Extract description from markdown content
 */
function extractDescription(content) {
  // Try to find Purpose section
  const purposeMatch = content.match(/##\s*Purpose\s*\r?\n\r?\n([\s\S]*?)(?=\r?\n##|\r?\n---|$)/i);
  if (purposeMatch) {
    const purpose = purposeMatch[1].trim().split('\n')[0];
    if (purpose.length > 0 && purpose.length <= CONFIG.maxDescriptionLength) {
      return purpose;
    }
    if (purpose.length > CONFIG.maxDescriptionLength) {
      return purpose.slice(0, CONFIG.maxDescriptionLength - 3) + '...';
    }
  }

  // Try to find first paragraph after title
  const titleMatch = content.match(/^#\s+.+$/m);
  if (titleMatch) {
    const afterTitle = content.slice(titleMatch.index + titleMatch[0].length);
    const firstPara = afterTitle.match(/\r?\n\r?\n([^#\n][^\n]+)/);
    if (firstPara) {
      const para = firstPara[1].trim();
      // Skip metadata lines
      if (!para.startsWith('**') && para.length > 10) {
        if (para.length <= CONFIG.maxDescriptionLength) {
          return para;
        }
        return para.slice(0, CONFIG.maxDescriptionLength - 3) + '...';
      }
    }
  }

  return null;
}

/**
 * Extract all markdown links from content
 */
function extractLinks(content, currentFile) {
  const links = [];
  const currentDir = dirname(currentFile);

  // Match markdown links: [text](path) - excluding external URLs and anchors
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const [, text, href] = match;

    // Skip external URLs
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
      continue;
    }

    // Skip pure anchors
    if (href.startsWith('#')) {
      continue;
    }

    // Extract path (remove anchor if present)
    let path = href.split('#')[0];

    // Skip empty paths
    if (!path) continue;

    // Resolve relative path
    let resolvedPath;
    if (path.startsWith('/')) {
      resolvedPath = path.slice(1); // Remove leading slash
    } else if (path.startsWith('./')) {
      resolvedPath = join(currentDir, path.slice(2));
    } else if (path.startsWith('../')) {
      resolvedPath = join(currentDir, path);
    } else {
      resolvedPath = join(currentDir, path);
    }

    // Normalize path
    resolvedPath = resolvedPath.replace(/\\/g, '/');

    // Only include .md files
    if (resolvedPath.endsWith('.md')) {
      links.push({
        text,
        target: resolvedPath,
        raw: href,
      });
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
  const parts = dir.split('/');
  while (parts.length > 0) {
    const checkPath = parts.join('/');
    if (CATEGORIES[checkPath]) {
      return { path: checkPath, ...CATEGORIES[checkPath] };
    }
    parts.pop();
  }

  // Root level files
  if (dir === '.') {
    return { path: 'root', ...CATEGORIES['root'] };
  }

  // Default category
  return {
    path: dir,
    name: dir.replace(/\//g, ' > '),
    tier: 4,
    description: 'Uncategorized'
  };
}

/**
 * Process a single markdown file
 */
function processFile(filePath) {
  const fullPath = join(ROOT, filePath);

  try {
    const content = readFileSync(fullPath, 'utf-8');
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
      lastModified: stat.mtime.toISOString().split('T')[0],
      size: stat.size,
    };
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
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
 * Generate markdown output
 */
function generateMarkdown(docs, referenceGraph, archivedFiles = []) {
  const lines = [];
  const now = new Date().toISOString().split('T')[0];

  // Header
  lines.push('# Documentation Index');
  lines.push('');
  lines.push('> **Auto-generated** - Do not edit manually. Run `npm run docs:index` to regenerate.');
  lines.push('');
  lines.push(`**Generated:** ${now}`);
  lines.push(`**Active Documents:** ${docs.length}`);
  lines.push(`**Archived Documents:** ${archivedFiles.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Table of Contents
  lines.push('## Table of Contents');
  lines.push('');
  lines.push('1. [Summary Statistics](#summary-statistics)');
  lines.push('2. [Documents by Category](#documents-by-category)');
  lines.push('3. [Reference Graph](#reference-graph)');
  lines.push('4. [Orphaned Documents](#orphaned-documents)');
  lines.push('5. [Full Document List](#full-document-list)');
  lines.push('6. [Archived Documents](#archived-documents)');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Summary Statistics
  lines.push('## Summary Statistics');
  lines.push('');

  // Count by category
  const categoryCount = new Map();
  const tierCount = new Map();

  for (const doc of docs) {
    const catKey = doc.category.name;
    categoryCount.set(catKey, (categoryCount.get(catKey) || 0) + 1);
    tierCount.set(doc.category.tier, (tierCount.get(doc.category.tier) || 0) + 1);
  }

  lines.push('### By Tier');
  lines.push('');
  lines.push('| Tier | Count | Description |');
  lines.push('|------|-------|-------------|');
  for (const tier of [1, 2, 3, 4, 5]) {
    const count = tierCount.get(tier) || 0;
    const desc = tier === 1 ? 'Essential' : tier === 2 ? 'Core' : tier === 3 ? 'Specialized' : tier === 4 ? 'Reference' : 'Archive';
    lines.push(`| Tier ${tier} | ${count} | ${desc} |`);
  }
  lines.push('');

  lines.push('### By Category');
  lines.push('');
  lines.push('| Category | Count |');
  lines.push('|----------|-------|');
  const sortedCategories = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCategories) {
    lines.push(`| ${cat} | ${count} |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Documents by Category
  lines.push('## Documents by Category');
  lines.push('');

  // Group docs by category
  const byCategory = new Map();
  for (const doc of docs) {
    const catKey = doc.category.path;
    if (!byCategory.has(catKey)) {
      byCategory.set(catKey, { category: doc.category, docs: [] });
    }
    byCategory.get(catKey).docs.push(doc);
  }

  // Sort categories by tier, then name
  const sortedCategoryKeys = [...byCategory.keys()].sort((a, b) => {
    const catA = byCategory.get(a).category;
    const catB = byCategory.get(b).category;
    if (catA.tier !== catB.tier) return catA.tier - catB.tier;
    return catA.name.localeCompare(catB.name);
  });

  for (const catKey of sortedCategoryKeys) {
    const { category, docs: catDocs } = byCategory.get(catKey);

    lines.push(`### ${category.name} (Tier ${category.tier})`);
    lines.push('');
    lines.push(`*${category.description}*`);
    lines.push('');
    lines.push('| Document | Description | References | Last Modified |');
    lines.push('|----------|-------------|------------|---------------|');

    // Sort docs by name
    catDocs.sort((a, b) => a.title.localeCompare(b.title));

    for (const doc of catDocs) {
      const refs = referenceGraph.get(doc.path);
      const inCount = refs ? refs.inbound.length : 0;
      const outCount = refs ? refs.outbound.length : 0;
      const refStr = `↓${inCount} ↑${outCount}`;
      const desc = doc.description ? doc.description.slice(0, 60) + (doc.description.length > 60 ? '...' : '') : '-';
      const linkPath = doc.path.replace(/ /g, '%20');
      lines.push(`| [${doc.title}](${linkPath}) | ${desc} | ${refStr} | ${doc.lastModified} |`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Reference Graph - Most Connected
  lines.push('## Reference Graph');
  lines.push('');
  lines.push('### Most Referenced Documents (Inbound Links)');
  lines.push('');
  lines.push('Documents that are linked to most frequently:');
  lines.push('');

  const byInbound = [...referenceGraph.entries()]
    .map(([path, refs]) => ({ path, count: refs.inbound.length, refs: refs.inbound }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  lines.push('| Document | Inbound Links | Referenced By |');
  lines.push('|----------|---------------|---------------|');
  for (const { path, count, refs } of byInbound) {
    const doc = docs.find(d => d.path === path);
    const title = doc ? doc.title : basename(path, '.md');
    const linkPath = path.replace(/ /g, '%20');
    const refList = refs.slice(0, 3).map(r => basename(r, '.md')).join(', ');
    const more = refs.length > 3 ? ` +${refs.length - 3} more` : '';
    lines.push(`| [${title}](${linkPath}) | ${count} | ${refList}${more} |`);
  }
  lines.push('');

  lines.push('### Most Linking Documents (Outbound Links)');
  lines.push('');
  lines.push('Documents that link to other documents most frequently:');
  lines.push('');

  const byOutbound = [...referenceGraph.entries()]
    .map(([path, refs]) => ({ path, count: refs.outbound.length }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  lines.push('| Document | Outbound Links |');
  lines.push('|----------|----------------|');
  for (const { path, count } of byOutbound) {
    const doc = docs.find(d => d.path === path);
    const title = doc ? doc.title : basename(path, '.md');
    const linkPath = path.replace(/ /g, '%20');
    lines.push(`| [${title}](${linkPath}) | ${count} |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Orphaned Documents
  lines.push('## Orphaned Documents');
  lines.push('');
  lines.push('Documents with no inbound links (not referenced by any other document):');
  lines.push('');

  const orphaned = [...referenceGraph.entries()]
    .filter(([, refs]) => refs.inbound.length === 0)
    .map(([path]) => path)
    .sort();

  if (orphaned.length === 0) {
    lines.push('*No orphaned documents found.*');
  } else {
    lines.push(`**${orphaned.length} orphaned documents:**`);
    lines.push('');
    for (const path of orphaned) {
      const doc = docs.find(d => d.path === path);
      const title = doc ? doc.title : basename(path, '.md');
      const linkPath = path.replace(/ /g, '%20');
      lines.push(`- [${title}](${linkPath})`);
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Full Document List
  lines.push('## Full Document List');
  lines.push('');
  lines.push('<details>');
  lines.push('<summary>Click to expand full list of all documents</summary>');
  lines.push('');
  lines.push('| # | Path | Title | Tier | Status |');
  lines.push('|---|------|-------|------|--------|');

  const sortedDocs = [...docs].sort((a, b) => a.path.localeCompare(b.path));
  let i = 1;
  for (const doc of sortedDocs) {
    const status = doc.frontmatter.status || '-';
    const linkPath = doc.path.replace(/ /g, '%20');
    lines.push(`| ${i++} | [${doc.path}](${linkPath}) | ${doc.title} | ${doc.category.tier} | ${status} |`);
  }

  lines.push('');
  lines.push('</details>');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Archived Documents (simple list, not fully tracked)
  lines.push('## Archived Documents');
  lines.push('');
  lines.push('*Historical and completed documentation. These documents are preserved for reference but not actively tracked in the reference graph.*');
  lines.push('');

  if (archivedFiles.length === 0) {
    lines.push('*No archived documents.*');
  } else {
    lines.push('<details>');
    lines.push('<summary>Click to expand archived documents list</summary>');
    lines.push('');
    lines.push('| # | Path |');
    lines.push('|---|------|');
    const sortedArchived = [...archivedFiles].sort();
    let archiveNum = 1;
    for (const filePath of sortedArchived) {
      const linkPath = filePath.replace(/ /g, '%20');
      lines.push(`| ${archiveNum++} | [${filePath}](${linkPath}) |`);
    }
    lines.push('');
    lines.push('</details>');
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Generated by `scripts/generate-documentation-index.js`*');
  lines.push('');

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('📚 Documentation Index Generator');
  console.log('================================');
  console.log('');

  // Find all markdown files (separated into active and archived)
  console.log('🔍 Scanning for markdown files...');
  const { active: activeFiles, archived: archivedFiles } = findMarkdownFiles(ROOT);
  console.log(`   Found ${activeFiles.length} active files, ${archivedFiles.length} archived files`);

  // Process each active file (archived files just get listed, not processed)
  console.log('📄 Processing active files...');
  const docs = [];
  for (const file of activeFiles) {
    if (verbose) {
      console.log(`   Processing: ${file}`);
    }
    const doc = processFile(file);
    if (doc) {
      docs.push(doc);
    }
  }
  console.log(`   Processed ${docs.length} active documents`);

  // Build reference graph (only for active docs)
  console.log('🔗 Building reference graph...');
  const referenceGraph = buildReferenceGraph(docs);

  let totalLinks = 0;
  for (const [, refs] of referenceGraph) {
    totalLinks += refs.outbound.length;
  }
  console.log(`   Found ${totalLinks} internal links`);

  // Generate output
  if (jsonOutput) {
    const output = {
      generated: new Date().toISOString(),
      activeDocuments: docs.length,
      archivedDocuments: archivedFiles.length,
      totalLinks,
      documents: docs.map(doc => ({
        ...doc,
        references: {
          inbound: referenceGraph.get(doc.path)?.inbound || [],
          outbound: referenceGraph.get(doc.path)?.outbound || [],
        }
      })),
      archived: archivedFiles,
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log('📝 Generating markdown index...');
    const markdown = generateMarkdown(docs, referenceGraph, archivedFiles);

    const outputPath = join(ROOT, CONFIG.outputFile);
    writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`   Written to ${CONFIG.outputFile}`);

    // Summary
    console.log('');
    console.log('✅ Documentation index generated successfully!');
    console.log('');
    console.log('Summary:');
    console.log(`   📄 Active documents: ${docs.length}`);
    console.log(`   📦 Archived documents: ${archivedFiles.length}`);
    console.log(`   🔗 Internal links: ${totalLinks}`);

    const orphaned = [...referenceGraph.entries()].filter(([, refs]) => refs.inbound.length === 0).length;
    console.log(`   ⚠️  Orphaned docs: ${orphaned}`);
  }
}

main();
