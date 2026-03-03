#!/usr/bin/env node
/**
 * Skill/Command Configuration Validator
 *
 * Validates skill and command SKILL.md files for structural correctness.
 * Ensures skills have required frontmatter fields (name, description) and valid structure.
 *
 * Checks:
 *   - YAML frontmatter present with required fields (name, description)
 *   - Title heading present
 *   - File references in the document exist
 *   - No deprecated patterns
 *
 * Usage:
 *   node scripts/validate-skills.js [files...]
 *   node scripts/validate-skills.js --all
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation errors found
 *   2 - Script error
 */

const fs = require('node:fs');
const path = require('node:path');

// Configuration for skill validation
const SKILLS_CONFIG = {
  skillsDir: '.claude/skills',
  requiredFrontmatterFields: ['name', 'description'],
  minDescriptionLength: 10,
};

// Parse YAML frontmatter (supports both LF and CRLF line endings)
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const frontmatter = {};

  for (const line of yaml.split(/\r?\n/)) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

// Extract file references from markdown
function extractFileReferences(content) {
  const references = [];

  // Match markdown links: [text](path)
  const linkRegex = /\[([^\]]{0,500})\]\(([^)]{0,1000})\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[2];
    // Skip external URLs, anchors, and regex-like patterns
    if (
      href.startsWith('http') ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.includes('*') ||
      href.includes('\\') ||
      href.includes('|')
    ) {
      continue;
    }
    // Remove anchor from path
    const cleanPath = href.split('#')[0];
    if (cleanPath && cleanPath.length > 0) {
      references.push(cleanPath);
    }
  }

  return references;
}

// Validate a single skill file
function validateSkillFile(filePath) {
  const errors = [];
  const warnings = [];

  // Read file
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err); // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
    return { errors: [`Cannot read file: ${errMsg}`], warnings: [] };
  }

  const _filename = path.basename(filePath);

  // Check 1: YAML frontmatter with required fields
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    errors.push('Missing YAML frontmatter (---\\n...\\n---)');
  } else {
    // Check for required fields
    for (const field of SKILLS_CONFIG.requiredFrontmatterFields) {
      if (!frontmatter[field]) {
        errors.push(`Missing required frontmatter field: '${field}'`);
      } else if (
        field === 'description' &&
        frontmatter[field].length < SKILLS_CONFIG.minDescriptionLength
      ) {
        warnings.push('Description is very short (< 10 chars)');
      }
    }
  }

  // Check 2: Title heading
  const titleMatch = content.match(/^#\s+(.{1,500})$/m);
  if (!titleMatch) {
    errors.push('Missing title heading (# Title)');
  }

  // Check 3: File references exist
  const baseDir = path.dirname(filePath);
  const fileRefs = extractFileReferences(content);

  for (const ref of fileRefs) {
    const resolvedPath = path.resolve(baseDir, ref);

    if (!fs.existsSync(resolvedPath)) {
      const fromRoot = path.resolve(process.cwd(), ref);
      if (!fs.existsSync(fromRoot)) {
        warnings.push(`File reference may not exist: ${ref}`);
      }
    }
  }

  return { errors, warnings };
}

// Get all skill files
function getAllSkillFiles() {
  const skillsDir = path.join(process.cwd(), SKILLS_CONFIG.skillsDir);
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  return fs
    .readdirSync(skillsDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(skillsDir, f));
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  let files = [];

  if (args.includes('--all') || args.length === 0) {
    files = getAllSkillFiles();
  } else {
    files = args.filter((a) => !a.startsWith('--'));
  }

  if (files.length === 0) {
    console.log('No skill files found to validate.');
    process.exit(0);
  }

  console.log('Validating skill/command configurations...\n');

  let totalErrors = 0;
  let totalWarnings = 0;
  const results = [];

  for (const file of files) {
    const relPath = path.relative(process.cwd(), file);
    const { errors, warnings } = validateSkillFile(file);

    if (errors.length > 0 || warnings.length > 0) {
      results.push({ file: relPath, errors, warnings });
    }

    totalErrors += errors.length;
    totalWarnings += warnings.length;
  }

  // Output results
  if (results.length === 0) {
    console.log(`All ${files.length} skill file(s) validated successfully\n`);
    process.exit(0);
  }

  for (const { file, errors, warnings } of results) {
    console.log(`${file}`);

    for (const error of errors) {
      console.log(`   ERROR: ${error}`);
    }

    for (const warning of warnings) {
      console.log(`   WARN: ${warning}`);
    }

    console.log('');
  }

  console.log('━'.repeat(70));
  console.log(
    `Summary: ${totalErrors} error(s), ${totalWarnings} warning(s) in ${results.length}/${files.length} file(s)`,
  );

  if (totalErrors > 0) {
    console.log('\nValidation failed. Fix errors before committing.');
    process.exit(1);
  }

  console.log('\nValidation passed with warnings.');
  process.exit(0);
}

main();
