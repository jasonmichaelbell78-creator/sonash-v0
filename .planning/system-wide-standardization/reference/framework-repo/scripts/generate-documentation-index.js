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
 *
 * Categories, tiers, and exclusions are configurable via scripts/config/doc-generator-config.json
 */

const { readFileSync, writeFileSync, readdirSync, statSync, lstatSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { join, relative, dirname, basename, extname } = require('node:path');

const ROOT = join(__dirname, '..');

// Default config - override with scripts/config/doc-generator-config.json
let CONFIG = {
  outputFile: 'docs/DOCUMENTATION_INDEX.md',
  maxDescriptionLength: 100,
  excludeDirs: ['node_modules', '.git', 'dist', 'coverage', 'out', '.next', '.turbo'],
  excludeFiles: ['DOCUMENTATION_INDEX.md'],
  archiveDirs: ['docs/archive'],
};
let TIER_DESCRIPTIONS = {
  1: 'Canonical - Core project documents',
  2: 'Foundation - Standards and guides',
  3: 'Planning - Roadmaps and status',
  4: 'Reference - Processes and checklists',
  5: 'Guide - How-to and tutorials',
};
let EXTERNAL_SCHEMES = ['http://', 'https://', 'mailto:', 'tel:', 'ftp://'];
let IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];
let CATEGORIES = {
  root: { name: 'Root', tier: 1, description: 'Top-level project documents' },
  docs: { name: 'Documentation', tier: 2, description: 'Project documentation' },
};
let FILE_OVERRIDES = Object.create(null);

try {
  const { loadConfig } = require('./config/load-config');
  const genConfig = loadConfig('doc-generator-config');
  if (genConfig.config) CONFIG = { ...CONFIG, ...genConfig.config };
  if (genConfig.tierDescriptions) TIER_DESCRIPTIONS = genConfig.tierDescriptions;
  if (genConfig.externalSchemes) EXTERNAL_SCHEMES = genConfig.externalSchemes;
  if (genConfig.imageExtensions) IMAGE_EXTENSIONS = genConfig.imageExtensions;
  if (genConfig.categories) CATEGORIES = genConfig.categories;
  if (genConfig.fileOverrides) {
    for (const [k, v] of Object.entries(genConfig.fileOverrides)) {
      if (k === '_comment') continue;
      const key = String(k).replaceAll('\\', '/').replace(/^\.\//, '');
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      FILE_OVERRIDES[key] = v;
    }
  }
} catch {
  // Config not available - use defaults
}

function isExternalOrSpecialLink(href) {
  if (!href || typeof href !== 'string') return false;
  return EXTERNAL_SCHEMES.some((scheme) => href.startsWith(scheme));
}

function isImageLink(href) {
  if (!href || typeof href !== 'string') return false;
  const pathOnly = href.split(/[?#]/)[0].toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => pathOnly.endsWith(ext));
}

function encodeMarkdownPath(path) {
  return encodeURI(path).replaceAll('(', '%28').replaceAll(')', '%29');
}

function escapeLinkText(text) {
  if (!text) return '';
  return String(text)
    .replaceAll(/[\r\n]+/g, ' ')
    .replaceAll('\\', '\\\\')
    .replaceAll('`', String.raw`\``)
    .replaceAll('[', String.raw`\[`)
    .replaceAll(']', String.raw`\]`)
    .replaceAll('<', '&lt;');
}

function escapeTableCell(text) {
  if (!text) return '';
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('\\', '\\\\')
    .replaceAll('|', String.raw`\|`)
    .replaceAll('[', String.raw`\[`)
    .replaceAll(']', String.raw`\]`)
    .replaceAll('(', String.raw`\(`)
    .replaceAll(')', String.raw`\)`)
    .replaceAll('`', String.raw`\``)
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\n', ' ')
    .replaceAll('\r', '');
}

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const verbose = args.includes('--verbose');

function isArchived(relativePath) {
  return CONFIG.archiveDirs.some(
    (archiveDir) => relativePath === archiveDir || relativePath.startsWith(archiveDir + '/'),
  );
}

function canonicalizePath(inputPath) {
  const segments = inputPath.split('/');
  const result = [];

  for (const segment of segments) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (result.length === 0) return null;
      result.pop();
    } else {
      result.push(segment);
    }
  }

  return result.join('/');
}

function shouldSkipEntry(entry, relativePath) {
  return CONFIG.excludeDirs.some(
    (exc) => entry === exc || relativePath === exc || relativePath.startsWith(exc + '/'),
  );
}

function safeStatEntry(fullPath, relativePath) {
  try {
    const stat = lstatSync(fullPath);
    return { stat, isSymlink: stat.isSymbolicLink() };
  } catch (error) {
    if (verbose && !jsonOutput) {
      console.error(`   Warning: Cannot stat ${relativePath}: ${error.code || 'unknown error'}`);
    }
    return { stat: null, isSymlink: false };
  }
}

function findMarkdownFiles(dir, result = { active: [], archived: [] }) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch (error) {
    if (!jsonOutput) {
      console.error(
        `   Warning: Cannot read directory ${relative(ROOT, dir)}: ${error.code || 'unknown error'}`,
      );
    }
    return result;
  }

  entries.sort();

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relativePath = relative(ROOT, fullPath).replaceAll('\\', '/');

    if (shouldSkipEntry(entry, relativePath)) continue;

    const { stat, isSymlink } = safeStatEntry(fullPath, relativePath);
    if (!stat) continue;

    if (isSymlink) {
      if (verbose && !jsonOutput) console.log(`   Skipping symlink: ${relativePath}`);
      continue;
    }

    if (stat.isDirectory()) {
      findMarkdownFiles(fullPath, result);
    } else if (extname(entry).toLowerCase() === '.md' && !CONFIG.excludeFiles.includes(entry)) {
      (isArchived(relativePath) ? result.archived : result.active).push(relativePath);
    }
  }

  return result;
}

function extractFrontmatter(content) {
  const frontmatter = {};

  const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (yamlMatch) {
    const yaml = yamlMatch[1];
    const lines = yaml.split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim().toLowerCase();
        let value = line.slice(colonIndex + 1).trim();
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

function extractTitle(content, filename) {
  const fmMatch = content.match(/^---\r?\n[\s\S]{0,2000}?\r?\n---/);
  if (fmMatch) {
    const nameMatch = fmMatch[0].match(/^name:\s*(.{1,200})$/m);
    if (nameMatch) return nameMatch[1].trim();
  }

  const stripped = content.replaceAll(/```[\s\S]*?```/g, '');
  const h1Match = stripped.match(/^#\s+(.{1,500})$/m);
  if (h1Match) return h1Match[1].trim();

  return basename(filename, '.md').replaceAll(/[-_]/g, ' ');
}

function extractDescription(content) {
  const purposeMatch = content.match(
    /##\s*Purpose\s*\r?\n\r?\n([\s\S]{0,2000}?)(?=\r?\n##|\r?\n---|$)/i,
  );
  if (purposeMatch) {
    const purpose = purposeMatch[1].trim().split('\n')[0];
    if (purpose.length > 0 && purpose.length <= CONFIG.maxDescriptionLength) return purpose;
    if (purpose.length > CONFIG.maxDescriptionLength) {
      return purpose.slice(0, CONFIG.maxDescriptionLength - 3) + '...';
    }
  }

  const titleMatch = content.match(/^#\s+.{1,500}$/m);
  if (titleMatch) {
    const afterTitle = content.slice(titleMatch.index + titleMatch[0].length);
    const firstPara = afterTitle.match(/\r?\n\r?\n([^#\n][^\n]{1,500})/);
    if (firstPara) {
      const para = firstPara[1].trim();
      if (!para.startsWith('**') && para.length > 10) {
        if (para.length <= CONFIG.maxDescriptionLength) return para;
        return para.slice(0, CONFIG.maxDescriptionLength - 3) + '...';
      }
    }
  }

  return null;
}

function stripCodeBlocks(content) {
  const lines = content.split('\n');
  const result = [];
  let inCodeBlock = false;
  let codeBlockFence = null;

  for (const line of lines) {
    const fenceMatch = line.match(/^( {0,3})(`{3,}|~{3,})/);

    if (fenceMatch) {
      const fence = fenceMatch[2][0];
      const fenceLength = fenceMatch[2].length;

      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockFence = { char: fence, length: fenceLength };
      } else if (fence === codeBlockFence.char && fenceLength >= codeBlockFence.length) {
        inCodeBlock = false;
        codeBlockFence = null;
      }
      continue;
    }

    if (!inCodeBlock) result.push(line);
  }

  return result.join('\n');
}

function extractLinks(content, currentFile) {
  const links = [];
  const seenTargets = new Set();
  const currentDir = dirname(currentFile);

  const strippedContent = stripCodeBlocks(content);
  const linkRegex = /\[([^\]]{1,500})\]\(([^)]{1,500})\)/g;
  let match;

  while ((match = linkRegex.exec(strippedContent)) !== null) {
    const [, text, href] = match;

    if (
      typeof href !== 'string' ||
      isExternalOrSpecialLink(href) ||
      href.startsWith('#') ||
      isImageLink(href)
    ) {
      continue;
    }

    let path = href.split('#')[0];
    if (!path) continue;

    try {
      path = decodeURIComponent(path);
    } catch {
      // Keep original
    }

    let resolvedPath;
    // eslint-disable-next-line framework/no-path-startswith -- safe: comparing against known constant prefix
    if (path.startsWith('/')) {
      resolvedPath = path.slice(1);
    } else {
      resolvedPath = join(currentDir, path);
    }

    resolvedPath = resolvedPath.replaceAll('\\', '/');
    resolvedPath = canonicalizePath(resolvedPath);

    if (resolvedPath === null) continue;

    if (resolvedPath.endsWith('.md')) {
      if (!seenTargets.has(resolvedPath)) {
        seenTargets.add(resolvedPath);
        links.push({ text, target: resolvedPath, raw: href });
      }
    }
  }

  return links;
}

function getCategory(filePath) {
  const normalizedFilePath = filePath.replaceAll('\\', '/').replace(/^\.\//, '');
  const dir = dirname(normalizedFilePath).replaceAll('\\', '/');

  let category;

  if (CATEGORIES[dir]) {
    category = { path: dir, ...CATEGORIES[dir] };
  } else {
    const parts = dir.split('/');
    while (parts.length > 0) {
      const checkPath = parts.join('/');
      if (CATEGORIES[checkPath]) {
        category = { path: checkPath, ...CATEGORIES[checkPath] };
        break;
      }
      parts.pop();
    }
  }

  if (!category && dir === '.') {
    category = { path: 'root', ...CATEGORIES['root'] };
  }

  if (!category) {
    category = {
      path: dir,
      name: dir.replaceAll('/', ' > '),
      tier: 4,
      description: 'Uncategorized',
    };
  }

  const override = FILE_OVERRIDES[normalizedFilePath];
  if (override && Number.isInteger(override.tier) && override.tier >= 1 && override.tier <= 4) {
    category = { ...category, tier: override.tier };
  }

  return category;
}

const lastModifiedCache = new Map();

function getLastModifiedDate(filePath, fullPath) {
  const cacheKey = filePath.replaceAll('\\', '/');
  if (lastModifiedCache.has(cacheKey)) return lastModifiedCache.get(cacheKey);

  let lastModified;

  try {
    const result = execFileSync('git', ['log', '--follow', '-1', '--format=%cI', '--', cacheKey], {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (result) lastModified = result.split('T')[0];
  } catch {
    // Git failed
  }

  if (!lastModified) {
    try {
      // eslint-disable-next-line framework/no-stat-without-lstat -- path is constructed internally, not from user input
      const stat = statSync(fullPath);
      lastModified = stat.mtime.toISOString().split('T')[0];
    } catch {
      lastModified = 'UNKNOWN';
    }
  }

  lastModifiedCache.set(cacheKey, lastModified);
  return lastModified;
}

function processFile(filePath) {
  const fullPath = join(ROOT, filePath);

  try {
    const content = readFileSync(fullPath, 'utf-8');
    const frontmatter = extractFrontmatter(content);
    const title = extractTitle(content, filePath);
    const description = frontmatter.purpose || extractDescription(content);
    const links = extractLinks(content, filePath);
    const category = getCategory(filePath);
    // eslint-disable-next-line framework/no-stat-without-lstat -- path is constructed internally, not from user input
    const stat = statSync(fullPath);

    return {
      path: filePath,
      title,
      description,
      category,
      frontmatter,
      links,
      lastModified: getLastModifiedDate(filePath, fullPath),
      size: stat.size,
    };
  } catch (error) {
    const errorCode = error.code || 'UNKNOWN';
    if (!jsonOutput) {
      console.error(`   Warning: Cannot process ${filePath}: ${errorCode}`);
    }
    return null;
  }
}

function buildReferenceGraph(docs) {
  const graph = new Map();

  for (const doc of docs) {
    graph.set(doc.path, { inbound: [], outbound: [] });
  }

  for (const doc of docs) {
    const node = graph.get(doc.path);
    for (const link of doc.links) {
      let target = link.target;
      if (graph.has(target)) {
        node.outbound.push(target);
        graph.get(target).inbound.push(doc.path);
      }
    }
  }

  return graph;
}

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
    '## Summary Statistics',
    '',
    '### By Tier',
    '',
    '| Tier | Count | Description |',
    '|------|-------|-------------|',
  );
  for (const tier of [1, 2, 3, 4, 5]) {
    const count = tierCount.get(tier) || 0;
    const desc = TIER_DESCRIPTIONS[tier] || 'Unknown';
    lines.push(`| Tier ${tier} | ${count} | ${desc} |`);
  }
  lines.push('', '### By Category', '', '| Category | Count |', '|----------|-------|');
  const sortedCategories = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCategories) {
    lines.push(`| ${cat} | ${count} |`);
  }
  lines.push('', '---', '');
  return lines;
}

function generateDocsByCategorySection(docs, referenceGraph) {
  const lines = [];
  lines.push('## Documents by Category', '');

  const byCategory = new Map();
  for (const doc of docs) {
    const catKey = `${doc.category.path}:${doc.category.tier}`;
    if (!byCategory.has(catKey)) {
      byCategory.set(catKey, { category: doc.category, docs: [] });
    }
    byCategory.get(catKey).docs.push(doc);
  }

  const sortedCategoryKeys = [...byCategory.keys()].sort((a, b) => {
    const catA = byCategory.get(a).category;
    const catB = byCategory.get(b).category;
    if (catA.tier !== catB.tier) return catA.tier - catB.tier;
    return catA.name.localeCompare(catB.name);
  });

  for (const catKey of sortedCategoryKeys) {
    const { category, docs: catDocs } = byCategory.get(catKey);
    lines.push(
      `### ${category.name} (Tier ${category.tier})`,
      '',
      `*${category.description}*`,
      '',
      '| Document | Description | References | Last Modified |',
      '|----------|-------------|------------|---------------|',
    );

    catDocs.sort((a, b) => a.title.localeCompare(b.title));
    for (const doc of catDocs) {
      const refs = referenceGraph.get(doc.path);
      const inCount = refs ? refs.inbound.length : 0;
      const outCount = refs ? refs.outbound.length : 0;
      const refStr = `${inCount}in ${outCount}out`;
      let desc = doc.description
        ? doc.description.slice(0, 60) + (doc.description.length > 60 ? '...' : '')
        : '-';
      desc = desc.replaceAll('|', String.raw`\|`);
      const linkPath = encodeMarkdownPath(doc.path);
      const safeTitle = doc.title.replaceAll('|', String.raw`\|`);
      lines.push(`| [${safeTitle}](${linkPath}) | ${desc} | ${refStr} | ${doc.lastModified} |`);
    }
    lines.push('');
  }
  lines.push('---', '');
  return lines;
}

function generateMarkdown(docs, referenceGraph, archivedFiles = []) {
  const lines = [];
  const now = new Date().toISOString().split('T')[0];

  const docsByPath = new Map(docs.map((d) => [d.path, d]));

  lines.push(
    '# Documentation Index',
    '',
    '> **Auto-generated** - Do not edit manually. Run the documentation index generator to regenerate.',
    '',
    `**Generated:** ${now}`,
    `**Active Documents:** ${docs.length}`,
    `**Archived Documents:** ${archivedFiles.length}`,
    '',
    '---',
    '',
  );

  lines.push(
    '## Purpose',
    '',
    'This auto-generated index provides a comprehensive catalog of all documentation',
    'in the project. It includes summary statistics, categorization by tier',
    'and type, reference graphs showing document relationships, and identification of',
    'orphaned documents.',
    '',
    '---',
    '',
  );

  lines.push(
    '## Table of Contents',
    '',
    '1. [Summary Statistics](#summary-statistics)',
    '2. [Documents by Category](#documents-by-category)',
    '3. [Orphaned Documents](#orphaned-documents)',
    '4. [Full Document List](#full-document-list)',
    '5. [Archived Documents](#archived-documents)',
    '',
    '---',
    '',
  );

  lines.push(...generateSummaryStats(docs));
  lines.push(...generateDocsByCategorySection(docs, referenceGraph));

  // Orphaned Documents
  lines.push(
    '## Orphaned Documents',
    '',
    'Documents with no inbound links (not referenced by any other document):',
    '',
  );

  const orphaned = [...referenceGraph.entries()]
    .filter(([, refs]) => refs.inbound.length === 0)
    .map(([path]) => path)
    .sort();

  if (orphaned.length === 0) {
    lines.push('*No orphaned documents found.*');
  } else {
    lines.push(`**${orphaned.length} orphaned documents:**`, '');
    for (const path of orphaned) {
      const doc = docsByPath.get(path);
      const title = doc ? doc.title : basename(path, '.md');
      const linkPath = encodeMarkdownPath(path);
      lines.push(`- [${escapeLinkText(title)}](${linkPath})`);
    }
  }
  lines.push('', '---', '');

  // Full Document List
  lines.push(
    '## Full Document List',
    '',
    '| # | Path | Title | Tier | Status |',
    '|---|------|-------|------|--------|',
  );

  const sortedDocs = [...docs].sort((a, b) => a.path.localeCompare(b.path));
  let i = 1;
  for (const doc of sortedDocs) {
    const status = doc.frontmatter.status || '-';
    const linkPath = encodeMarkdownPath(doc.path);
    lines.push(
      `| ${i++} | [${escapeTableCell(doc.path)}](${linkPath}) | ${escapeTableCell(doc.title)} | ${doc.category.tier} | ${escapeTableCell(status)} |`,
    );
  }

  lines.push('', '---', '');

  // Archived Documents
  lines.push(
    '## Archived Documents',
    '',
    '*Historical and completed documentation preserved for reference.*',
    '',
  );

  if (archivedFiles.length === 0) {
    lines.push('*No archived documents.*');
  } else {
    lines.push('| # | Path |', '|---|------|');
    const sortedArchived = [...archivedFiles].sort();
    let archiveNum = 1;
    for (const filePath of sortedArchived) {
      const linkPath = encodeMarkdownPath(filePath);
      lines.push(`| ${archiveNum++} | [${escapeTableCell(filePath)}](${linkPath}) |`);
    }
  }

  lines.push(
    '',
    '---',
    '',
    '## Version History',
    '',
    '| Version | Date | Changes |',
    '|---------|------|---------|',
    `| Auto | ${now} | Auto-generated from codebase scan |`,
    '',
    '---',
    '',
    '*Generated by `scripts/generate-documentation-index.js`*',
    '',
  );

  return lines.join('\n');
}

function log(message) {
  if (!jsonOutput) console.log(message);
}

function main() {
  log('Documentation Index Generator');
  log('================================');
  log('');

  log('Scanning for markdown files...');
  const { active: activeFiles, archived: archivedFiles } = findMarkdownFiles(ROOT);
  log(`   Found ${activeFiles.length} active files, ${archivedFiles.length} archived files`);

  log('Processing active files...');
  const docs = [];
  for (const file of activeFiles) {
    if (verbose && !jsonOutput) console.log(`   Processing: ${file}`);
    const doc = processFile(file);
    if (doc) docs.push(doc);
  }
  log(`   Processed ${docs.length} active documents`);

  log('Building reference graph...');
  const referenceGraph = buildReferenceGraph(docs);

  let totalLinks = 0;
  for (const [, refs] of referenceGraph) {
    totalLinks += refs.outbound.length;
  }
  log(`   Found ${totalLinks} internal links`);

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
    log('Generating markdown index...');
    const markdown = generateMarkdown(docs, referenceGraph, archivedFiles);

    const outputPath = join(ROOT, CONFIG.outputFile);
    try {
      // eslint-disable-next-line framework/no-non-atomic-write -- non-critical ephemeral state file
      writeFileSync(outputPath, markdown, 'utf-8');
      log(`   Written to ${CONFIG.outputFile}`);
    } catch (writeError) {
      console.error(
        `Error writing to ${CONFIG.outputFile}: ${writeError instanceof Error ? writeError.message : String(writeError)}`, // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
      );
      process.exit(1);
    }

    log('');
    log('Documentation index generated successfully!');
    log('');
    log('Summary:');
    log(`   Active documents: ${docs.length}`);
    log(`   Archived documents: ${archivedFiles.length}`);
    log(`   Internal links: ${totalLinks}`);

    const orphaned = [...referenceGraph.entries()].filter(
      ([, refs]) => refs.inbound.length === 0,
    ).length;
    log(`   Orphaned docs: ${orphaned}`);
  }
}

main();
