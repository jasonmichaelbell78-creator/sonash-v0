#!/usr/bin/env node
/**
 * Update README.md status dashboard from ROADMAP.md
 *
 * Reads:
 * - ROADMAP.md status dashboard (Milestones Overview table)
 * - Individual milestone completion percentages
 *
 * Writes:
 * - README.md "Project Status" section
 * - Overall completion percentage
 * - Current milestone
 * - Recent completions
 *
 * Preserves:
 * - All other README.md content
 *
 * Usage: node scripts/update-readme-status.js [--dry-run] [--verbose]
 * Options:
 *   --dry-run   Show what would change without writing
 *   --verbose   Show detailed logging
 *
 * Exit codes: 0 = success, 1 = error
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// File paths
const ROADMAP_PATH = join(ROOT, 'ROADMAP.md');
const README_PATH = join(ROOT, 'README.md');

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

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
 * Validate that a milestone object has required fields
 * @param {object} milestone - Milestone object to validate
 * @param {number} index - Row index for error messages
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateMilestone(milestone, index) {
  const errors = [];

  if (!milestone.name || typeof milestone.name !== 'string') {
    errors.push(`Row ${index}: Missing or invalid milestone name`);
  }

  if (!milestone.status || typeof milestone.status !== 'string') {
    errors.push(`Row ${index}: Missing or invalid status`);
  }

  if (typeof milestone.progress !== 'number' || milestone.progress < 0 || milestone.progress > 100) {
    errors.push(`Row ${index}: Invalid progress value (must be 0-100): ${milestone.progress}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Parse the milestones table from ROADMAP.md
 * @param {string} content - ROADMAP.md content
 * @returns {{success: boolean, milestones?: Array, error?: string}}
 */
function parseMilestonesTable(content) {
  const milestones = [];
  const warnings = [];

  verbose('Looking for Milestones Overview table...');

  // Find the milestones table (starts after "## 📊 Milestones Overview")
  const tableMatch = content.match(/## 📊 Milestones Overview[\s\S]*?\n\|[^\n]+\|[\s\S]*?\n\|[-|\s]+\|[\s\S]*?\n((?:\|[^\n]+\|\n?)+)/);

  if (!tableMatch) {
    // Try alternative heading formats
    const altMatch = content.match(/## .*Milestones.*Overview[\s\S]*?\n\|[^\n]+\|[\s\S]*?\n\|[-|\s]+\|[\s\S]*?\n((?:\|[^\n]+\|\n?)+)/i);
    if (!altMatch) {
      return {
        success: false,
        error: 'Could not find Milestones Overview table in ROADMAP.md. Expected format:\n' +
               '## 📊 Milestones Overview\n\n| Milestone | Status | Progress | ...'
      };
    }
  }

  const tableContent = tableMatch ? tableMatch[1] : null;
  if (!tableContent) {
    return {
      success: false,
      error: 'Milestones table found but no data rows present'
    };
  }

  const tableRows = tableContent.trim().split('\n').filter(row => row.trim());
  verbose(`Found ${tableRows.length} table rows`);

  for (let i = 0; i < tableRows.length; i++) {
    const row = tableRows[i];

    // Skip empty rows or separator rows
    if (!row.includes('|') || row.match(/^\|[\s-|]+\|$/)) {
      verbose(`Skipping row ${i}: separator or empty`);
      continue;
    }

    // Parse table row: | **M0 - Baseline** | ✅ Complete | 100% | Q4 2025 | Foundation |
    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);

    if (cells.length < 3) {
      warnings.push(`Row ${i + 1}: Too few columns (${cells.length}), skipping`);
      continue;
    }

    const name = cells[0].replace(/\*\*/g, '').trim();
    const status = cells[1].trim();
    const progressStr = cells[2].trim();
    const target = cells[3]?.trim() || '';
    const priority = cells[4]?.trim() || '';

    // Parse progress percentage (handle "~50%", "100%", "0%")
    const progressMatch = progressStr.match(/~?(\d+)%/);
    const progress = progressMatch ? parseInt(progressMatch[1], 10) : 0;

    const milestone = { name, status, progress, target, priority };

    // Validate milestone
    const validation = validateMilestone(milestone, i + 1);
    if (!validation.valid) {
      warnings.push(...validation.errors);
      continue;
    }

    milestones.push(milestone);
    verbose(`Parsed milestone: ${name} (${progress}%)`);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Parsing warnings:');
    warnings.forEach(w => console.warn(`   ${w}`));
  }

  if (milestones.length === 0) {
    return {
      success: false,
      error: 'No valid milestones found in table'
    };
  }

  return { success: true, milestones };
}

/**
 * Get overall progress from ROADMAP.md
 * @param {string} content - ROADMAP.md content
 * @returns {string} - Overall progress string (e.g., "~35%")
 */
function getOverallProgress(content) {
  // Try multiple patterns for robustness
  const patterns = [
    /\*\*Overall Progress:\*\*\s*(~?\d+%)/,
    /Overall Progress[:\s]*(~?\d+%)/i,
    /Total Progress[:\s]*(~?\d+%)/i
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      verbose(`Found overall progress: ${match[1]}`);
      return match[1];
    }
  }

  // Calculate from milestones if not found
  verbose('Overall progress not found in text, will calculate from milestones');
  return null;
}

/**
 * Calculate overall progress from milestones
 * @param {Array} milestones - Parsed milestones
 * @returns {string} - Calculated progress string
 */
function calculateOverallProgress(milestones) {
  if (!milestones || milestones.length === 0) {
    return '0%';
  }

  const total = milestones.reduce((sum, m) => sum + m.progress, 0);
  const average = Math.round(total / milestones.length);
  return `~${average}%`;
}

/**
 * Get current focus from milestones
 * @param {Array} milestones - Parsed milestones
 * @returns {string} - Current focus description
 */
function getCurrentFocus(milestones) {
  const inProgress = milestones.filter(m =>
    m.status.includes('In Progress') || m.status.includes('🔄')
  );

  if (inProgress.length === 0) {
    const planned = milestones.find(m =>
      m.status.includes('Planned') || m.status.includes('📋')
    );
    return planned ? `Planning: ${planned.name.replace(/^M[\d.]+ - /, '')}` : 'Planning next milestone';
  }

  return inProgress.map(m => m.name.replace(/^M[\d.]+ - /, '')).join(' + ');
}

/**
 * Get recently completed milestones
 * @param {Array} milestones - Parsed milestones
 * @returns {Array<string>} - Names of completed milestones
 */
function getRecentCompletions(milestones) {
  return milestones
    .filter(m => m.status.includes('Complete') || m.status.includes('✅'))
    .map(m => m.name);
}

/**
 * Generate the new Project Status section
 * @param {Array} milestones - Parsed milestones
 * @param {string} overallProgress - Overall progress string
 * @returns {string} - New Project Status section content
 */
function generateStatusSection(milestones, overallProgress) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentFocus = getCurrentFocus(milestones);
  const completed = getRecentCompletions(milestones);
  const inProgress = milestones.filter(m =>
    m.status.includes('In Progress') || m.status.includes('🔄')
  );

  let section = `## Project Status

**Last Updated:** ${today}
**Overall Progress:** ${overallProgress}
**Current Focus:** ${currentFocus}

### Milestone Status

| Milestone | Status | Progress |
|-----------|--------|----------|
`;

  // Add milestone rows
  for (const m of milestones) {
    const statusIcon = m.status.includes('Complete') ? '✅' :
                       m.status.includes('In Progress') ? '🔄' :
                       m.status.includes('Planned') ? '📋' :
                       m.status.includes('Optional') ? '⏸️' :
                       m.status.includes('Research') ? '🔬' : '⏸️';
    const cleanStatus = m.status.replace(/✅|🔄|📋|⏸️|🔬/gu, '').trim();
    section += `| ${m.name} | ${statusIcon} ${cleanStatus} | ${m.progress}% |\n`;
  }

  section += `
### Recent Completions
`;

  if (completed.length > 0) {
    for (const name of completed.slice(0, 5)) {
      section += `- ✅ ${name}\n`;
    }
  } else {
    section += `- No milestones completed yet\n`;
  }

  section += `
### Current Sprint
`;

  if (inProgress.length > 0) {
    for (const m of inProgress) {
      section += `- 🔄 ${m.name} (${m.progress}%)\n`;
    }
  } else {
    section += `- Planning next milestone\n`;
  }

  section += `
See **[ROADMAP.md](./ROADMAP.md)** for detailed milestone information.
See **[AI_HANDOFF.md](./AI_HANDOFF.md)** for detailed development status.`;

  return section;
}

/**
 * Update README.md with new status section
 * @param {string} readmeContent - Current README.md content
 * @param {string} newStatusSection - New status section content
 * @returns {{success: boolean, content?: string, error?: string, unchanged?: boolean}}
 */
function updateReadme(readmeContent, newStatusSection) {
  // Find and replace the Project Status section
  // Match from "## Project Status" to the next "## " heading or end of file
  const statusPattern = /## Project Status[\s\S]*?(?=\n## [^#]|\n## $|$)/;

  if (statusPattern.test(readmeContent)) {
    const updated = readmeContent.replace(statusPattern, newStatusSection + '\n\n');

    // Check if content actually changed
    if (updated === readmeContent) {
      return { success: true, content: updated, unchanged: true };
    }

    return { success: true, content: updated };
  } else {
    // If no Project Status section exists, try to add it after specific sections
    const insertPoints = [
      /\n## Tech Stack/,
      /\n## Current Features/,
      /\n## Overview/
    ];

    for (const pattern of insertPoints) {
      const match = readmeContent.match(pattern);
      if (match) {
        const insertPos = readmeContent.indexOf(match[0]);
        const updated = readmeContent.slice(0, insertPos) + '\n\n' + newStatusSection + '\n' + readmeContent.slice(insertPos);
        return { success: true, content: updated };
      }
    }

    // Fallback: add after first heading
    const firstHeadingEnd = readmeContent.indexOf('\n## ', readmeContent.indexOf('#'));
    if (firstHeadingEnd > 0) {
      const updated = readmeContent.slice(0, firstHeadingEnd) + '\n\n' + newStatusSection + '\n' + readmeContent.slice(firstHeadingEnd);
      return { success: true, content: updated };
    }

    return {
      success: false,
      error: 'Could not find suitable location to insert Project Status section'
    };
  }
}

/**
 * Main function
 */
function main() {
  console.log('📊 Updating README.md status from ROADMAP.md...');
  if (DRY_RUN) console.log('   (DRY RUN - no files will be modified)\n');
  else console.log('');

  // Step 1: Read ROADMAP.md
  const roadmapResult = safeReadFile(ROADMAP_PATH, 'ROADMAP.md');
  if (!roadmapResult.success) {
    console.error(`❌ Error: ${roadmapResult.error}`);
    process.exit(1);
  }

  // Step 2: Read README.md
  const readmeResult = safeReadFile(README_PATH, 'README.md');
  if (!readmeResult.success) {
    console.error(`❌ Error: ${readmeResult.error}`);
    process.exit(1);
  }

  // Step 3: Parse milestones
  const parseResult = parseMilestonesTable(roadmapResult.content);
  if (!parseResult.success) {
    console.error(`❌ Error: ${parseResult.error}`);
    process.exit(1);
  }

  const milestones = parseResult.milestones;
  console.log(`Found ${milestones.length} milestones:`);
  for (const m of milestones) {
    console.log(`  - ${m.name}: ${m.progress}% (${m.status.replace(/✅|🔄|📋|⏸️|🔬/gu, '').trim()})`);
  }

  // Step 4: Get overall progress
  let overallProgress = getOverallProgress(roadmapResult.content);
  if (!overallProgress) {
    overallProgress = calculateOverallProgress(milestones);
    console.log(`\nCalculated overall progress: ${overallProgress}`);
  } else {
    console.log(`\nOverall progress from ROADMAP.md: ${overallProgress}`);
  }

  // Step 5: Generate new status section
  const newStatusSection = generateStatusSection(milestones, overallProgress);
  verbose('Generated new status section');

  // Step 6: Update README
  const updateResult = updateReadme(readmeResult.content, newStatusSection);
  if (!updateResult.success) {
    console.error(`❌ Error: ${updateResult.error}`);
    process.exit(1);
  }

  if (updateResult.unchanged) {
    console.log('\n✅ README.md is already up to date (no changes needed)');
    process.exit(0);
  }

  // Step 7: Write updated README
  const writeResult = safeWriteFile(README_PATH, updateResult.content, 'README.md');
  if (!writeResult.success) {
    console.error(`❌ Error: ${writeResult.error}`);
    process.exit(1);
  }

  console.log('\n✅ README.md updated successfully!');
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
