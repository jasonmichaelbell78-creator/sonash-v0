#!/usr/bin/env node
/**
 * Light documentation linting
 *
 * Checks:
 * - Required sections present (by tier)
 * - "Last Updated" dates within reasonable range (< 90 days for active docs)
 * - Version numbers follow X.Y format
 * - Cross-references point to existing files
 * - Internal anchor links are valid
 *
 * Outputs:
 * - List of validation errors
 * - List of warnings
 * - Exit 0 if pass, 1 if errors (warnings don't fail)
 *
 * Usage: node scripts/check-docs-light.js [file...] [--verbose] [--json] [--strict]
 * Options:
 *   file...     Specific files to check (default: all markdown files)
 *   --verbose   Show detailed logging
 *   --json      Output results as JSON
 *   --errors-only  Only show errors, not warnings
 *   --strict    Treat warnings as errors (exit 1 if any warnings)
 *
 * Exit codes: 0 = pass, 1 = errors found (or warnings in --strict mode)
 *
 * Tier definitions are configurable via TIER_DEFINITIONS below.
 */

const {
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
  lstatSync,
  realpathSync,
} = require('node:fs');
const {
  join,
  dirname,
  basename,
  relative,
  extname,
  isAbsolute,
  resolve,
  sep,
} = require('node:path');

const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const JSON_OUTPUT = args.includes('--json');
const ERRORS_ONLY = args.includes('--errors-only');
const STRICT_MODE = args.includes('--strict');
const fileArgs = args.filter((a) => !a.startsWith('--'));

/**
 * Tier definitions with required sections - CONFIGURABLE
 * Patterns are matched against heading text (case-insensitive)
 */
const TIER_DEFINITIONS = {
  1: {
    name: 'Canonical',
    files: ['ROADMAP.md', 'README.md', 'ARCHITECTURE.md'],
    required: [/purpose|overview/i, /version history/i],
    recommended: [/ai instructions/i, /status/i],
  },
  2: {
    name: 'Foundation',
    files: ['DOCUMENTATION_STANDARDS.md', 'SECURITY.md', 'DEVELOPMENT.md'],
    folders: ['docs/'],
    required: [/purpose|overview|scope/i, /version history/i],
    recommended: [/ai instructions/i, /quick start/i],
  },
  3: {
    name: 'Planning',
    patterns: [/PLAN|ROADMAP|PROJECT_STATUS/i],
    required: [/purpose|overview|scope/i, /status|progress/i, /version history/i],
    recommended: [/ai instructions/i, /acceptance criteria/i],
  },
  4: {
    name: 'Reference',
    patterns: [/PROCESS|CHECKLIST|WORKFLOW|STANDARDS/i],
    required: [/purpose|overview/i, /version history/i],
    recommended: [/ai instructions/i],
  },
  5: {
    name: 'Guide',
    patterns: [/GUIDE|HOW.?TO|TUTORIAL/i],
    folders: ['docs/templates/'],
    required: [/overview|purpose/i, /version history/i],
    recommended: [/step|steps/i, /troubleshooting/i],
  },
};

function matchExplicitFiles(fileName) {
  for (const [tier, def] of Object.entries(TIER_DEFINITIONS)) {
    if (def.files && def.files.includes(fileName)) {
      return Number.parseInt(tier, 10);
    }
  }
  return null;
}

function matchFolderPatterns(relativePath) {
  for (const [tier, def] of Object.entries(TIER_DEFINITIONS)) {
    if (!def.folders) continue;
    for (const folder of def.folders) {
      const normalizedFolder = folder.endsWith('/') ? folder : `${folder}/`;
      if (relativePath === folder || relativePath.startsWith(normalizedFolder)) {
        return Number.parseInt(tier, 10);
      }
    }
  }
  return null;
}

function matchFilenamePatterns(fileName) {
  for (const [tier, def] of Object.entries(TIER_DEFINITIONS)) {
    if (!def.patterns) continue;
    for (const pattern of def.patterns) {
      if (pattern.test(fileName)) return Number.parseInt(tier, 10);
    }
  }
  return null;
}

function determineTier(filePath, _content) {
  const fileName = basename(filePath);
  const relativePath = relative(ROOT, filePath).replaceAll('\\', '/');

  const explicitMatch = matchExplicitFiles(fileName);
  if (explicitMatch !== null) return explicitMatch;

  const folderMatch = matchFolderPatterns(relativePath);
  if (folderMatch !== null) return folderMatch;

  const patternMatch = matchFilenamePatterns(fileName);
  if (patternMatch !== null) return patternMatch;

  return 4;
}

function normalizeLineEndings(content) {
  return content.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
}

function extractHeadings(content) {
  const headings = [];
  const lines = normalizeLineEndings(content).split('\n');

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.{1,500})$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].replaceAll(/\p{Extended_Pictographic}/gu, '').trim(),
        line: i + 1,
      });
    }
  }

  return headings;
}

function extractMetadata(content) {
  const errors = [];
  let lastUpdated = null;
  let version = null;

  const lastUpdatedPatterns = [
    /\*\*Last Updated[:*]{0,20}\*{0,10}\s{0,100}[:]{0,10}\s{0,100}(.{1,500})/i,
    /Last Updated[:\s]+(.+)/i,
    /Updated[:\s]+(.+)/i,
  ];

  for (const pattern of lastUpdatedPatterns) {
    const match = content.match(pattern);
    if (match) {
      lastUpdated = match[1].trim();
      break;
    }
  }

  const versionPatterns = [
    /\*\*(?:Document )?Version[:*]{0,20}\*{0,10}\s{0,100}[:]{0,10}\s{0,100}(\d+\.?\d*)/i,
    /Version[:\s]+(\d+\.?\d*)/i,
    /\| (\d+\.\d+) \|.*\|.*\|/,
  ];

  for (const pattern of versionPatterns) {
    const match = content.match(pattern);
    if (match) {
      version = match[1].trim();
      break;
    }
  }

  return { lastUpdated, version, errors };
}

function parseDate(dateStr) {
  if (!dateStr) {
    return { valid: false, error: 'No date provided' };
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return { valid: false, error: `Invalid date format: "${dateStr}"` };
  }

  const now = new Date();
  const minDate = new Date('2020-01-01');
  const maxDate = new Date(now.getFullYear() + 10, 11, 31);

  if (date < minDate || date > maxDate) {
    return { valid: false, error: `Date out of reasonable range: "${dateStr}"` };
  }

  return { valid: true, date };
}

function isPlaceholderLink(text, target) {
  const normalizedTarget = target.trim();

  const looksLikePathOrAnchor =
    normalizedTarget.startsWith('#') ||
    /[\\/]/.test(normalizedTarget) ||
    /\.[a-z0-9]+$/i.test(normalizedTarget);

  const placeholderPatterns = [
    /^<[a-z_-]+>$/i,
    /^path$/i,
    /^url$/i,
    /^file$/i,
    /^link$/i,
    /^filename$/i,
    /^\.\.\.$/i,
    /^example$/i,
  ];

  if (!looksLikePathOrAnchor) {
    for (const pattern of placeholderPatterns) {
      if (pattern.test(normalizedTarget)) return true;
    }
  }

  const normalizedText = text.trim().toLowerCase();
  const normalizedTargetLower = normalizedTarget.toLowerCase();
  const genericWords = new Set(['text', 'link', 'file', 'path', 'url', 'title', 'name']);
  if (normalizedText === normalizedTargetLower && genericWords.has(normalizedText)) {
    return true;
  }

  return false;
}

function extractLinks(content) {
  const links = [];
  const lines = normalizeLineEndings(content).split('\n');

  for (let i = 0; i < lines.length; i++) {
    const linkPattern = /\[([^\]]{1,2000})\]\(([^)]{1,2000})\)/g;
    let match;

    while ((match = linkPattern.exec(lines[i])) !== null) {
      const text = match[1];
      const target = match[2];

      if (
        target.startsWith('http://') ||
        target.startsWith('https://') ||
        target.startsWith('mailto:')
      ) {
        continue;
      }

      if (isPlaceholderLink(text, target)) continue;

      links.push({
        text: text,
        target: target,
        line: i + 1,
        isAnchor: target.startsWith('#'),
      });
    }
  }

  return links;
}

function validateFileLinks(links, docPath) {
  const errors = [];
  const docDir = dirname(docPath);

  for (const link of links) {
    if (link.isAnchor) continue;
    const [filePath] = link.target.split('#');
    if (!filePath) continue;

    let decodedPath;
    try {
      decodedPath = decodeURIComponent(filePath);
    } catch {
      decodedPath = filePath;
    }

    const absolutePath = join(docDir, decodedPath);
    if (!existsSync(absolutePath)) {
      errors.push(`Line ${link.line}: Broken link to "${link.target}" (file not found)`);
    }
  }

  return errors;
}

function validateAnchorLinks(links, headings) {
  const errors = [];

  const validAnchors = new Set();
  for (const heading of headings) {
    const anchor = heading.text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    validAnchors.add(anchor);
  }

  for (const link of links) {
    if (!link.isAnchor) continue;
    if (!link.target.includes('#')) continue;

    const anchor = link.target.split('#')[1];
    if (!anchor) continue;

    const normalizedAnchor = anchor.toLowerCase().replace(/-+/g, '-');

    if (!validAnchors.has(normalizedAnchor)) {
      let found = false;
      for (const valid of validAnchors) {
        if (valid.includes(normalizedAnchor) || normalizedAnchor.includes(valid)) {
          found = true;
          break;
        }
      }
      if (!found) {
        errors.push(`Line ${link.line}: Broken anchor link "#${anchor}" (heading not found)`);
      }
    }
  }

  return errors;
}

function checkRequiredSections(tier, headings) {
  const errors = [];
  const warnings = [];

  const tierDef = TIER_DEFINITIONS[tier];
  if (!tierDef) {
    return { errors: [], warnings: ['Unknown tier, skipping section checks'] };
  }

  const headingTexts = headings.map((h) => h.text);

  for (const pattern of tierDef.required || []) {
    const found = headingTexts.some((text) => pattern.test(text));
    if (!found) {
      errors.push(`Missing required section matching: ${pattern.toString()}`);
    }
  }

  for (const pattern of tierDef.recommended || []) {
    const found = headingTexts.some((text) => pattern.test(text));
    if (!found) {
      warnings.push(`Missing recommended section matching: ${pattern.toString()}`);
    }
  }

  return { errors, warnings };
}

function readDocumentContent(filePath) {
  try {
    const rootReal = realpathSync(ROOT);
    const effectivePath = realpathSync(filePath);

    const rel = relative(rootReal, effectivePath);
    // eslint-disable-next-line framework/no-path-startswith, framework/no-empty-path-check -- safe: rel is from path.relative(); empty means same dir
    if (!rel || rel.startsWith('..')) {
      return { content: null, error: 'Path resolves outside project root' };
    }

    const content = readFileSync(effectivePath, 'utf-8');
    if (!content || content.trim().length === 0) {
      return { content: null, error: 'File is empty' };
    }
    return { content, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err); // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
    return { content: null, error: `Cannot read file safely: ${message}` };
  }
}

function validateMetadataDate(metadata, tier, warnings) {
  if (!metadata.lastUpdated) {
    warnings.push('Missing "Last Updated" date in metadata');
    return;
  }

  const dateResult = parseDate(metadata.lastUpdated);
  if (!dateResult.valid) {
    warnings.push(`Invalid "Last Updated" date: ${dateResult.error}`);
    return;
  }

  const daysSinceUpdate = Math.floor((Date.now() - dateResult.date) / (1000 * 60 * 60 * 24));
  if (daysSinceUpdate > 90 && tier <= 3) {
    warnings.push(`Document may be stale: last updated ${daysSinceUpdate} days ago`);
  }
}

function validateVersionFormat(metadata, warnings) {
  if (!metadata.version) return;
  if (!/^\d+(\.\d+)?$/.test(metadata.version)) {
    warnings.push(`Version number format should be X.Y, got: "${metadata.version}"`);
  }
}

function lintDocument(filePath) {
  const errors = [];
  const warnings = [];

  const { content, error: readError } = readDocumentContent(filePath);
  if (readError) {
    return { file: relative(ROOT, filePath), tier: 0, errors: [readError], warnings: [] };
  }

  const tier = determineTier(filePath, content);

  if (VERBOSE) {
    console.log(
      `  Checking: ${relative(ROOT, filePath)} (Tier ${tier}: ${TIER_DEFINITIONS[tier]?.name || 'Unknown'})`,
    );
  }

  const headings = extractHeadings(content);
  const metadata = extractMetadata(content);
  const links = extractLinks(content);

  if (!headings.some((h) => h.level === 1)) {
    errors.push('Missing document title (H1 heading)');
  }

  validateMetadataDate(metadata, tier, warnings);
  validateVersionFormat(metadata, warnings);

  const sectionCheck = checkRequiredSections(tier, headings);
  errors.push(...sectionCheck.errors);
  warnings.push(...sectionCheck.warnings);

  errors.push(...validateFileLinks(links, filePath));

  const anchorErrors = validateAnchorLinks(links, headings);
  if (anchorErrors.length <= 3) {
    warnings.push(...anchorErrors);
  }

  return { file: relative(ROOT, filePath), tier, errors, warnings };
}

function findMarkdownFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    if (
      // eslint-disable-next-line framework/no-path-startswith -- safe: comparing against known constant prefix
      entry.startsWith('.') ||
      entry === 'node_modules' ||
      entry === 'out' ||
      entry === 'dist' ||
      entry === 'archive' ||
      entry === 'templates'
    ) {
      continue;
    }

    try {
      // eslint-disable-next-line framework/no-stat-without-lstat -- path is constructed internally, not from user input
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        findMarkdownFiles(fullPath, files);
      } else if (extname(entry) === '.md') {
        if (entry === 'DOCUMENTATION_INDEX.md') continue;
        files.push(fullPath);
      }
    } catch {
      // Skip files we can't stat
    }
  }

  return files;
}

function resolveFileArgs(files) {
  const resolved = [];
  const seen = new Set();
  const rootResolved = resolve(ROOT);

  let rootRealResolved = rootResolved;
  try {
    rootRealResolved = resolve(realpathSync(ROOT));
  } catch {
    console.warn(`Warning: Cannot resolve real path for ROOT, using resolved path`);
  }

  for (const file of files) {
    const fullPath = isAbsolute(file) ? file : join(ROOT, file);
    const resolvedPath = resolve(fullPath);

    if (resolvedPath !== rootResolved && !resolvedPath.startsWith(rootResolved + sep)) {
      console.error(`Error: Path traversal blocked: ${file}`);
      continue;
    }

    if (!existsSync(fullPath)) {
      console.error(`Warning: File not found: ${file}`);
      continue;
    }

    try {
      const realResolved = resolve(realpathSync(fullPath));
      if (realResolved !== rootRealResolved && !realResolved.startsWith(rootRealResolved + sep)) {
        console.error(`Error: Symlink traversal blocked: ${file} -> outside project root`);
        continue;
      }

      lstatSync(fullPath);

      if (seen.has(realResolved)) continue;
      seen.add(realResolved);

      if (resolvedPath.endsWith('DOCUMENTATION_INDEX.md')) continue;

      resolved.push(resolvedPath);
    } catch {
      console.error(`Warning: Cannot stat file: ${file}`);
    }
  }

  return resolved;
}

function outputFileErrors(filesWithErrors) {
  if (filesWithErrors.length === 0) return;

  console.log('FILES WITH ERRORS:\n');
  for (const result of filesWithErrors) {
    console.log(`  ${result.file} (Tier ${result.tier}):`);
    for (const error of result.errors) {
      console.log(`    ERROR: ${error}`);
    }
    if (!ERRORS_ONLY) {
      for (const warning of result.warnings) {
        console.log(`    WARN: ${warning}`);
      }
    }
    console.log('');
  }
}

function outputFileWarnings(filesWithWarnings) {
  if (ERRORS_ONLY || filesWithWarnings.length === 0) return;

  console.log('FILES WITH WARNINGS:\n');
  for (const result of filesWithWarnings) {
    console.log(`  ${result.file} (Tier ${result.tier}):`);
    for (const warning of result.warnings) {
      console.log(`    WARN: ${warning}`);
    }
    console.log('');
  }
}

function outputSummary(results, totalErrors, totalWarnings) {
  const cleanFiles = results.filter((r) => r.errors.length === 0 && r.warnings.length === 0);
  const filesWithErrors = results.filter((r) => r.errors.length > 0);
  const filesWithWarnings = results.filter((r) => r.warnings.length > 0 && r.errors.length === 0);

  console.log('-'.repeat(50));
  console.log(`\nSUMMARY:`);
  console.log(`   Files checked: ${results.length}`);
  console.log(`   Files passing: ${cleanFiles.length}`);
  console.log(`   Files with errors: ${filesWithErrors.length}`);
  console.log(`   Files with warnings: ${filesWithWarnings.length}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log(`   Total warnings: ${totalWarnings}`);

  if (totalErrors === 0 && (totalWarnings === 0 || !STRICT_MODE)) {
    console.log('\nAll documentation checks passed!');
  } else if (totalErrors === 0 && totalWarnings > 0 && STRICT_MODE) {
    console.log('\nDocumentation checks failed (--strict mode: warnings treated as errors).');
  } else {
    console.log('\nDocumentation checks failed. Please fix errors above.');
  }
}

function main() {
  console.log('Running documentation linter...\n');

  const filesToCheck = fileArgs.length > 0 ? resolveFileArgs(fileArgs) : findMarkdownFiles(ROOT);

  if (filesToCheck.length === 0) {
    console.log('No markdown files found to check.');
    process.exit(0);
  }

  console.log(`Checking ${filesToCheck.length} file(s)...\n`);

  const results = filesToCheck.map((file) => lintDocument(file));
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  if (JSON_OUTPUT) {
    console.log(JSON.stringify({ results, totalErrors, totalWarnings }, null, 2));
  } else {
    const filesWithErrors = results.filter((r) => r.errors.length > 0);
    const filesWithWarnings = results.filter((r) => r.warnings.length > 0 && r.errors.length === 0);

    outputFileErrors(filesWithErrors);
    outputFileWarnings(filesWithWarnings);
    outputSummary(results, totalErrors, totalWarnings);
  }

  const hasFailures = totalErrors > 0 || (STRICT_MODE && totalWarnings > 0);
  process.exit(hasFailures ? 1 : 0);
}

try {
  main();
} catch (error) {
  const msg =
    error instanceof Error
      ? error instanceof Error
        ? error.message // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
        : String(error)
      : 'Unknown error';
  console.error('Unexpected error:', msg);
  process.exit(1);
}
