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
const SKILL_MD_DIR = ".claude/skills";
// Required sections for SKILL.md files under .claude/skills/<name>/ (enforces SKILL_STANDARDS.md §Required Sections)
const REQUIRED_SKILL_MD_SECTIONS = ["## When to Use", "## When NOT to Use", "## Version History"];
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

// Parse YAML frontmatter (supports LF/CRLF line endings + multi-line block
// scalars using `>-`, `>`, `|-`, `|` markers — continuation lines must be
// indented).
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const frontmatter = {};
  const lines = yaml.split(/\r?\n/);

  let currentKey = null;
  let currentBlockLines = null; // array of indented lines collected after a block-scalar marker

  const flushBlock = () => {
    if (currentKey && currentBlockLines !== null) {
      // Join continuation lines with a single space, trim; preserves enough
      // for description length / presence checks without full YAML semantics.
      frontmatter[currentKey] = currentBlockLines
        .map((l) => l.replace(/^\s+/, ""))
        .join(" ")
        .trim();
      currentKey = null;
      currentBlockLines = null;
    }
  };

  for (const rawLine of lines) {
    // Indented lines belong to an in-progress block scalar (including blank
    // lines within the block — whitespace-only indented lines are valid YAML
    // block scalar content and must not terminate the block early).
    if (currentBlockLines !== null && (/^\s+\S/.test(rawLine) || /^\s+$/.test(rawLine))) {
      currentBlockLines.push(rawLine);
      continue;
    }
    // New key line encountered — flush any in-progress block first
    flushBlock();

    const colonIndex = rawLine.indexOf(":");
    if (colonIndex <= 0) continue;
    const key = rawLine.slice(0, colonIndex).trim();
    const rawValue = rawLine.slice(colonIndex + 1).trim();

    // Block-scalar markers: >- | >-| |- | > | |  (possibly followed by nothing
    // or chomp/keep indicators we don't need to distinguish for length checks)
    if (/^[>|][+-]?\s*$/.test(rawValue)) {
      currentKey = key;
      currentBlockLines = [];
      continue;
    }

    // Implicit multi-line: value empty, continuation lines indented on next
    // lines. Common in skill frontmatter (`description:\n  Long text…`).
    if (rawValue === "") {
      currentKey = key;
      currentBlockLines = [];
      continue;
    }
    frontmatter[key] = rawValue;
  }
  flushBlock();
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

function checkFrontmatter(content) {
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) return { error: String.raw`Missing YAML frontmatter (---\n...\n---)` };
  if (!frontmatter.description) return { error: "Missing 'description' in frontmatter" };
  if (frontmatter.description.length < 10)
    return { warning: "Description is very short (< 10 chars)" };
  return {};
}

function checkRequiredSections(content, sections, isError) {
  const results = [];
  for (const section of sections) {
    const escaped = section.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const sectionRegex = new RegExp(String.raw`^${escaped}\s*$`, "mi");
    if (!sectionRegex.test(content)) {
      const msg = isError
        ? `SKILL.md missing REQUIRED section: '${section}' (per SKILL_STANDARDS.md)`
        : `Missing recommended section: '${section}'`;
      results.push({ msg, isError });
    }
  }
  return results;
}

function checkFileReferences(content, filePath) {
  const warnings = [];
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
  return warnings;
}

// Validate a single skill file
function validateSkillFile(filePath) {
  const errors = [];
  const warnings = [];

  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { errors: [`Cannot read file: ${errMsg}`], warnings: [] };
  }

  const filename = path.basename(filePath);

  // Check 1: YAML frontmatter
  const fm = checkFrontmatter(content);
  if (fm.error) errors.push(fm.error);
  if (fm.warning) warnings.push(fm.warning);

  // Check 2: Title heading
  if (!content.match(/^#\s+(.{1,500})$/m)) {
    errors.push("Missing title heading (# Title)");
  }

  // Check 3: Required sections for audit commands
  if (filename.startsWith("audit-")) {
    for (const r of checkRequiredSections(content, REQUIRED_SECTIONS.audit, false)) {
      warnings.push(r.msg);
    }
  }

  // Check 3b: Required sections for SKILL.md files under .claude/skills/<name>/
  const normalized = path.resolve(filePath).replaceAll("\\", "/");
  const isSkillMd = filename === "SKILL.md" && normalized.includes("/.claude/skills/");
  if (isSkillMd) {
    for (const r of checkRequiredSections(content, REQUIRED_SKILL_MD_SECTIONS, true)) {
      errors.push(r.msg);
    }
  }

  // Check 4+5: File references + deprecated patterns
  warnings.push(...checkFileReferences(content, filePath), ...checkDeprecatedPatterns(content));

  return { errors, warnings };
}

function checkDeprecatedPatterns(content) {
  const warnings = [];
  for (const { pattern, message } of DEPRECATED_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(`Deprecated pattern: ${message}`);
    }
  }
  return warnings;
}

// Get all command files in .claude/commands/
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

// Get all SKILL.md files under .claude/skills/<name>/SKILL.md
// These get the SKILL_STANDARDS.md §Required Sections check.
function getAllSkillMdFiles() {
  const skillsDir = path.join(process.cwd(), SKILL_MD_DIR);
  if (!fs.existsSync(skillsDir)) {
    return [];
  }
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // Skip shared/_shared (not skill dirs, contain shared assets/docs)
    if (entry.name === "shared" || entry.name === "_shared") continue;
    const skillMd = path.join(skillsDir, entry.name, "SKILL.md");
    if (fs.existsSync(skillMd)) results.push(skillMd);
  }
  return results;
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  let files = [];

  if (args.includes("--all") || args.length === 0) {
    files = [...getAllSkillFiles(), ...getAllSkillMdFiles()];
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
