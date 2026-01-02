#!/usr/bin/env node
/**
 * Archive a document with full metadata preservation
 *
 * Usage: node scripts/archive-doc.js FILENAME.md [options]
 *
 * Process:
 * 1. Read source document
 * 2. Add/update YAML frontmatter:
 *    - archived_date
 *    - original_path
 *    - last_updated (from doc)
 *    - archive_reason
 * 3. Move to docs/archive/
 * 4. Update any cross-references in other docs
 * 5. Optionally add note to ROADMAP_LOG.md
 *
 * Options:
 *   --reason "reason"  Reason for archiving (default: "Superseded or outdated")
 *   --update-log       Also add entry to ROADMAP_LOG.md
 *   --dry-run          Show what would change without making changes
 *   --verbose          Show detailed logging
 *
 * Exit codes: 0 = success, 1 = error
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync, readdirSync, statSync, realpathSync } from 'fs';
import { join, dirname, basename, relative } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Directories
const ARCHIVE_DIR = join(ROOT, 'docs', 'archive');
const DOCS_DIR = join(ROOT, 'docs');
const ROADMAP_LOG_PATH = join(ROOT, 'ROADMAP_LOG.md');

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');
const UPDATE_LOG = args.includes('--update-log');

// Get reason flag value
const reasonIndex = args.indexOf('--reason');
const ARCHIVE_REASON = reasonIndex !== -1 && args[reasonIndex + 1]
  ? args[reasonIndex + 1]
  : 'Superseded or outdated';

// Get the filename (first non-flag argument)
const FILE_ARG = args.find(arg => !arg.startsWith('--') && (reasonIndex === -1 || args.indexOf(arg) !== reasonIndex + 1));

/**
 * Safely log verbose messages
 * @param {...any} messages - Messages to log
 */
function verbose(...messages) {
  if (VERBOSE) {
    console.log('[VERBOSE]', ...messages);
  }
}

/**
 * Validate that a path is within the repository root
 * Prevents arbitrary file deletion outside the repo
 * @param {string} filePath - Path to validate
 * @returns {{valid: boolean, error?: string}}
 */
function validatePathWithinRepo(filePath) {
  try {
    // Resolve to absolute path, following symlinks
    const resolvedPath = realpathSync(filePath);
    const resolvedRoot = realpathSync(ROOT);

    // Check if the resolved path starts with the repo root
    if (!resolvedPath.startsWith(resolvedRoot + '/') && resolvedPath !== resolvedRoot) {
      return {
        valid: false,
        error: `Path "${filePath}" resolves outside repository root`
      };
    }

    // Additional check: must be a markdown file
    if (!resolvedPath.endsWith('.md')) {
      return {
        valid: false,
        error: `Path "${filePath}" is not a markdown file`
      };
    }

    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: `Cannot validate path: ${err.message}`
    };
  }
}

/**
 * Safely read a file with error handling
 * @param {string} filePath - Path to file
 * @param {string} description - Human-readable description for errors
 * @returns {{success: boolean, content?: string, error?: string}}
 */
function safeReadFile(filePath, description) {
  verbose(`Reading ${description} from ${filePath}`);

  if (!existsSync(filePath)) {
    return {
      success: false,
      error: `${description} not found at: ${filePath}`
    };
  }

  try {
    const content = readFileSync(filePath, 'utf-8');

    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: `${description} is empty: ${filePath}`
      };
    }

    verbose(`Successfully read ${content.length} characters from ${description}`);
    return { success: true, content };
  } catch (error) {
    return {
      success: false,
      error: `Failed to read ${description}: ${error.message}`
    };
  }
}

/**
 * Safely write a file with error handling
 * @param {string} filePath - Path to file
 * @param {string} content - Content to write
 * @param {string} description - Human-readable description for errors
 * @returns {{success: boolean, error?: string}}
 */
function safeWriteFile(filePath, content, description) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would write ${content.length} characters to ${description}`);
    return { success: true };
  }

  verbose(`Writing ${content.length} characters to ${description}`);

  try {
    writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to write ${description}: ${error.message}`
    };
  }
}

/**
 * Ensure the archive directory exists
 * @returns {{success: boolean, error?: string}}
 */
function ensureArchiveDir() {
  verbose('Checking archive directory:', ARCHIVE_DIR);

  if (existsSync(ARCHIVE_DIR)) {
    verbose('Archive directory already exists');
    return { success: true };
  }

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would create directory: ${ARCHIVE_DIR}`);
    return { success: true };
  }

  try {
    mkdirSync(ARCHIVE_DIR, { recursive: true });
    console.log(`Created archive directory: ${ARCHIVE_DIR}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create archive directory: ${error.message}`
    };
  }
}

/**
 * Extract "Last Updated" date from document content
 * @param {string} content - Document content
 * @returns {string|null} - Date string or null if not found
 */
function extractLastUpdated(content) {
  const patterns = [
    /\*\*Last Updated:\*\*\s*(.+?)(?:\n|$)/i,
    /Last Updated:\s*(.+?)(?:\n|$)/i,
    /Updated:\s*(.+?)(?:\n|$)/i,
    /Date:\s*(.+?)(?:\n|$)/i
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Add or update frontmatter for archived document
 * @param {string} content - Original document content
 * @param {string} originalPath - Original file path (relative to ROOT)
 * @param {string} reason - Archive reason
 * @returns {string} - Updated content with frontmatter
 */
function addArchiveFrontmatter(content, originalPath, reason) {
  const parsed = matter(content);
  const lastUpdated = extractLastUpdated(content);
  const today = new Date().toISOString().split('T')[0];

  // Merge with existing frontmatter if any
  const newFrontmatter = {
    ...parsed.data,
    archived_date: today,
    original_path: originalPath,
    archive_reason: reason
  };

  if (lastUpdated) {
    newFrontmatter.last_updated = lastUpdated;
  }

  verbose('Generated frontmatter:', JSON.stringify(newFrontmatter, null, 2));

  // Reconstruct document with frontmatter
  return matter.stringify(parsed.content, newFrontmatter);
}

/**
 * Get all markdown files recursively in a directory
 * @param {string} dir - Directory to scan
 * @param {string[]} files - Accumulated file list
 * @returns {string[]} - List of markdown file paths
 */
function getMarkdownFiles(dir, files = []) {
  if (!existsSync(dir)) {
    return files;
  }

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);

      // Skip archive directory and node_modules
      if (entry === 'archive' || entry === 'node_modules' || entry === '.git') {
        continue;
      }

      try {
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          getMarkdownFiles(fullPath, files);
        } else if (entry.endsWith('.md')) {
          files.push(fullPath);
        }
      } catch {
        // Skip files we can't access
      }
    }
  } catch {
    // Skip directories we can't access
  }

  return files;
}

/**
 * Update cross-references in other markdown files
 * @param {string} oldPath - Original file path (relative or filename)
 * @param {string} newPath - New archive path (relative)
 * @returns {{success: boolean, updated: Array<{file: string, line: number}>, error?: string}}
 */
function updateCrossReferences(oldPath, newPath) {
  const updated = [];
  const oldFilename = basename(oldPath);

  verbose(`Searching for references to: ${oldFilename}`);

  // Get all markdown files in root and docs
  const markdownFiles = [
    ...getMarkdownFiles(ROOT).filter(f => !f.includes('/docs/') && f !== oldPath),
    ...getMarkdownFiles(DOCS_DIR)
  ];

  verbose(`Found ${markdownFiles.length} markdown files to check`);

  // Patterns to match links to the old file
  // Match: [text](./FILENAME.md), [text](FILENAME.md), [text](./docs/FILENAME.md), etc.
  const patterns = [
    new RegExp(`\\]\\(\\.?\\/?${escapeRegex(oldFilename)}\\)`, 'g'),
    new RegExp(`\\]\\(\\.?\\/?(?:docs\\/)?${escapeRegex(oldFilename)}\\)`, 'g')
  ];

  for (const filePath of markdownFiles) {
    // Skip the file we're archiving
    if (filePath === oldPath || basename(filePath) === oldFilename) {
      continue;
    }

    const readResult = safeReadFile(filePath, basename(filePath));
    if (!readResult.success) {
      continue;
    }

    let content = readResult.content;
    let modified = false;

    // Check each line for matches (to track line numbers)
    const lines = content.split('\n');
    const newLines = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      for (const pattern of patterns) {
        if (pattern.test(line)) {
          // Calculate relative path from this file to archive
          const fileDir = dirname(filePath);
          const relativePath = relative(fileDir, join(ARCHIVE_DIR, oldFilename));

          // Replace the link
          const newLine = line.replace(
            new RegExp(`\\]\\(\\.?\\/?(?:docs\\/)?${escapeRegex(oldFilename)}\\)`, 'g'),
            `](./${relativePath})`
          );

          if (newLine !== line) {
            verbose(`  Line ${i + 1}: ${line.trim()}`);
            verbose(`       → ${newLine.trim()}`);
            updated.push({ file: filePath, line: i + 1 });
            line = newLine;
            modified = true;
          }
        }
      }

      newLines.push(line);
    }

    if (modified) {
      const writeResult = safeWriteFile(filePath, newLines.join('\n'), basename(filePath));
      if (!writeResult.success) {
        return { success: false, updated, error: writeResult.error };
      }
    }
  }

  return { success: true, updated };
}

/**
 * Escape special regex characters in a string
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Add entry to ROADMAP_LOG.md
 * @param {string} filename - Archived filename
 * @param {string} reason - Archive reason
 * @returns {{success: boolean, error?: string}}
 */
function updateRoadmapLog(filename, reason) {
  const readResult = safeReadFile(ROADMAP_LOG_PATH, 'ROADMAP_LOG.md');
  if (!readResult.success) {
    console.warn(`⚠️  Warning: ${readResult.error}`);
    console.warn('   Skipping ROADMAP_LOG.md update');
    return { success: true }; // Non-fatal
  }

  const today = new Date().toISOString().split('T')[0];
  const entry = `\n## [${today}] Archived: ${filename}\n\n**Reason:** ${reason}\n\nMoved to \`docs/archive/${filename}\`\n`;

  // Find the right place to insert (after main heading)
  let content = readResult.content;
  const firstHeadingMatch = content.match(/^# .+\n/m);

  if (firstHeadingMatch) {
    const insertPos = content.indexOf(firstHeadingMatch[0]) + firstHeadingMatch[0].length;
    content = content.slice(0, insertPos) + entry + content.slice(insertPos);
  } else {
    // Fallback: prepend after any frontmatter
    const parsed = matter(content);
    content = matter.stringify(entry + '\n' + parsed.content, parsed.data);
  }

  return safeWriteFile(ROADMAP_LOG_PATH, content, 'ROADMAP_LOG.md');
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Usage: node scripts/archive-doc.js FILENAME.md [options]

Archives a document by:
1. Adding YAML frontmatter with archive metadata
2. Moving to docs/archive/
3. Updating cross-references in other docs

Options:
  --reason "text"    Reason for archiving (default: "Superseded or outdated")
  --update-log       Also add entry to ROADMAP_LOG.md
  --dry-run          Show what would change without making changes
  --verbose          Show detailed logging

Examples:
  node scripts/archive-doc.js OLD_DOC.md
  node scripts/archive-doc.js OLD_DOC.md --reason "Replaced by NEW_DOC.md"
  node scripts/archive-doc.js OLD_DOC.md --update-log --dry-run
`);
}

/**
 * Main function
 */
function main() {
  console.log('📦 Document Archive Tool');
  if (DRY_RUN) console.log('   (DRY RUN - no files will be modified)\n');
  else console.log('');

  // Validate input
  if (!FILE_ARG) {
    console.error('❌ Error: No filename provided\n');
    printUsage();
    process.exit(1);
  }

  // Resolve file path
  let sourcePath;
  if (existsSync(FILE_ARG)) {
    sourcePath = FILE_ARG;
  } else if (existsSync(join(ROOT, FILE_ARG))) {
    sourcePath = join(ROOT, FILE_ARG);
  } else if (existsSync(join(DOCS_DIR, FILE_ARG))) {
    sourcePath = join(DOCS_DIR, FILE_ARG);
  } else {
    console.error(`❌ Error: File not found: ${FILE_ARG}`);
    console.error('   Searched in: current directory, project root, docs/');
    process.exit(1);
  }

  // SECURITY: Validate path is within repository root
  const pathValidation = validatePathWithinRepo(sourcePath);
  if (!pathValidation.valid) {
    console.error(`❌ Security Error: ${pathValidation.error}`);
    console.error('   This script only operates on files within the repository');
    process.exit(1);
  }

  const filename = basename(sourcePath);
  const originalRelPath = relative(ROOT, sourcePath);
  const archivePath = join(ARCHIVE_DIR, filename);

  console.log(`Source: ${sourcePath}`);
  console.log(`Destination: ${archivePath}`);
  console.log(`Reason: ${ARCHIVE_REASON}\n`);

  // Check if already archived
  if (sourcePath.includes('/archive/')) {
    console.error('❌ Error: File is already in the archive directory');
    process.exit(1);
  }

  // Check if destination exists
  if (existsSync(archivePath)) {
    console.error(`❌ Error: Destination already exists: ${archivePath}`);
    console.error('   Remove or rename the existing file first');
    process.exit(1);
  }

  // Step 1: Ensure archive directory exists
  const dirResult = ensureArchiveDir();
  if (!dirResult.success) {
    console.error(`❌ Error: ${dirResult.error}`);
    process.exit(1);
  }

  // Step 2: Read source file
  const readResult = safeReadFile(sourcePath, 'source document');
  if (!readResult.success) {
    console.error(`❌ Error: ${readResult.error}`);
    process.exit(1);
  }

  // Step 3: Add archive frontmatter
  const archivedContent = addArchiveFrontmatter(
    readResult.content,
    originalRelPath,
    ARCHIVE_REASON
  );
  verbose('Added archive frontmatter');

  // Step 4: Write to archive location
  const writeResult = safeWriteFile(archivePath, archivedContent, `archive/${filename}`);
  if (!writeResult.success) {
    console.error(`❌ Error: ${writeResult.error}`);
    process.exit(1);
  }
  console.log(`✅ Created archived version: ${archivePath}`);

  // Step 5: Remove original (unless dry run)
  if (!DRY_RUN) {
    try {
      unlinkSync(sourcePath);
      console.log(`✅ Removed original: ${sourcePath}`);
    } catch (error) {
      console.error(`❌ Error removing original: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log(`[DRY RUN] Would remove original: ${sourcePath}`);
  }

  // Step 6: Update cross-references
  console.log('\nUpdating cross-references...');
  const refResult = updateCrossReferences(sourcePath, archivePath);
  if (!refResult.success) {
    console.error(`❌ Error: ${refResult.error}`);
    process.exit(1);
  }

  if (refResult.updated.length > 0) {
    console.log(`Updated ${refResult.updated.length} references:`);
    for (const update of refResult.updated) {
      console.log(`  - ${relative(ROOT, update.file)}:${update.line}`);
    }
  } else {
    console.log('No cross-references found to update');
  }

  // Step 7: Update ROADMAP_LOG.md if requested
  if (UPDATE_LOG) {
    console.log('\nUpdating ROADMAP_LOG.md...');
    const logResult = updateRoadmapLog(filename, ARCHIVE_REASON);
    if (!logResult.success) {
      console.error(`❌ Error: ${logResult.error}`);
      process.exit(1);
    }
    console.log('✅ Added entry to ROADMAP_LOG.md');
  }

  console.log('\n✅ Archive complete!');
  process.exit(0);
}

// Run main function
try {
  main();
} catch (error) {
  console.error('❌ Unexpected error:', error.message);
  if (VERBOSE) {
    console.error(error.stack);
  }
  process.exit(1);
}
