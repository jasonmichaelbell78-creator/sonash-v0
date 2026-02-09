#!/usr/bin/env node
/**
 * Skill/Agent Configuration Validator
 *
 * Validates skill and command configuration files for structural correctness.
 * Ensures skills follow the expected format and reference valid files.
 *
 * Checks:
 *   - YAML frontmatter present with description
 *   - Title heading present
 *   - Audit commands have required sections
 *   - File references in the document exist
 *   - No deprecated patterns
 *
 * Usage:
 *   node scripts/validate-skill-config.js [files...]
 *   node scripts/validate-skill-config.js --all
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation errors found
 *   2 - Script error
 */

const fs = require("node:fs");
const path = require("node:path");
const { loadConfigWithRegex } = require("./config/load-config");

// Configuration — single source of truth: scripts/config/skill-config.json
const SKILLS_DIR = ".claude/commands";
let skillConfig;
try {
  skillConfig = loadConfigWithRegex("skill-config");
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Error: failed to load skill-config: ${msg}`);
  process.exit(2);
}
const REQUIRED_SECTIONS = skillConfig.requiredSections;
const DEPRECATED_PATTERNS = skillConfig.deprecatedPatterns;

// Parse YAML frontmatter (supports both LF and CRLF line endings)
function parseFrontmatter(content) {
  // Handle both Unix (LF) and Windows (CRLF) line endings
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const frontmatter = {};

  // Split on \r?\n to handle both line ending styles
  for (const line of yaml.split(/\r?\n/)) {
    const colonIndex = line.indexOf(":");
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
  // Using bounded quantifiers to prevent ReDoS:
  // - Link text: max 500 chars (reasonable for any link text)
  // - Link href: max 1000 chars (reasonable for any file path)
  const linkRegex = /\[([^\]]{0,500})\]\(([^)]{0,1000})\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[2];
    // Skip external URLs, anchors, and regex-like patterns
    if (
      href.startsWith("http") ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.includes("*") || // Skip glob/regex patterns
      href.includes("\\") || // Skip regex escapes
      href.includes("|") // Skip regex alternation
    ) {
      continue;
    }
    // Remove anchor from path
    const cleanPath = href.split("#")[0];
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
    content = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { errors: [`Cannot read file: ${errMsg}`], warnings: [] };
  }

  const filename = path.basename(filePath);
  const isAudit = filename.startsWith("audit-");
  const isSession = filename.startsWith("session-");

  // Check 1: YAML frontmatter
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    errors.push("Missing YAML frontmatter (---\\n...\\n---)");
  } else if (!frontmatter.description) {
    errors.push("Missing 'description' in frontmatter");
  } else if (frontmatter.description.length < 10) {
    warnings.push("Description is very short (< 10 chars)");
  }

  // Check 2: Title heading
  const titleMatch = content.match(/^#\s+(.{1,500})$/m);
  if (!titleMatch) {
    errors.push("Missing title heading (# Title)");
  }

  // Check 3: Required sections for audit commands
  if (isAudit) {
    for (const section of REQUIRED_SECTIONS.audit) {
      const sectionRegex = new RegExp(`^#+\\s+${section}`, "mi");
      if (!sectionRegex.test(content)) {
        warnings.push(`Missing recommended section: '${section}'`);
      }
    }
  }

  // Check 4: File references exist
  const baseDir = path.dirname(filePath);
  const fileRefs = extractFileReferences(content);

  for (const ref of fileRefs) {
    // Resolve relative to the markdown file's directory
    const resolvedPath = path.resolve(baseDir, ref);

    // Check if file exists (allow some flexibility for generated paths)
    if (!fs.existsSync(resolvedPath)) {
      // Check from project root as fallback
      const fromRoot = path.resolve(process.cwd(), ref);
      if (!fs.existsSync(fromRoot)) {
        warnings.push(`File reference may not exist: ${ref}`);
      }
    }
  }

  // Check 5: Deprecated patterns
  for (const { pattern, message } of DEPRECATED_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(`Deprecated pattern: ${message}`);
    }
  }

  return { errors, warnings };
}

// Get all skill files
function getAllSkillFiles() {
  const skillsDir = path.join(process.cwd(), SKILLS_DIR);
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  return fs
    .readdirSync(skillsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(skillsDir, f));
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  let files = [];

  if (args.includes("--all") || args.length === 0) {
    files = getAllSkillFiles();
  } else {
    // Filter out flag arguments
    files = args.filter((a) => !a.startsWith("--"));
  }

  if (files.length === 0) {
    console.log("No skill files found to validate.");
    process.exit(0);
  }

  console.log("🔍 Validating skill/command configurations...\n");

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
    console.log(`✅ All ${files.length} skill file(s) validated successfully\n`);
    process.exit(0);
  }

  for (const { file, errors, warnings } of results) {
    console.log(`📄 ${file}`);

    for (const error of errors) {
      console.log(`   ❌ ERROR: ${error}`);
    }

    for (const warning of warnings) {
      console.log(`   ⚠️  WARN: ${warning}`);
    }

    console.log("");
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    `Summary: ${totalErrors} error(s), ${totalWarnings} warning(s) in ${results.length}/${files.length} file(s)`
  );

  if (totalErrors > 0) {
    console.log("\n❌ Validation failed. Fix errors before committing.");
    process.exit(1);
  }

  console.log("\n⚠️  Validation passed with warnings.");
  process.exit(0);
}

main();
