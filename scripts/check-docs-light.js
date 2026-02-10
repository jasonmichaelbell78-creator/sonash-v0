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
 * Usage: node scripts/check-docs-light.js [file...] [--verbose] [--fix] [--json] [--strict]
 * Options:
 *   file...     Specific files to check (default: all markdown files)
 *   --verbose   Show detailed logging
 *   --json      Output results as JSON
 *   --errors-only  Only show errors, not warnings
 *   --strict    Treat warnings as errors (exit 1 if any warnings)
 *
 * Exit codes: 0 = pass, 1 = errors found (or warnings in --strict mode)
 */

import { readFileSync, existsSync, readdirSync, statSync, lstatSync, realpathSync } from "node:fs";
import { join, dirname, basename, relative, extname, isAbsolute, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { sanitizeError } from "./lib/sanitize-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// Parse command line arguments
const args = process.argv.slice(2);
const VERBOSE = args.includes("--verbose");
const JSON_OUTPUT = args.includes("--json");
const ERRORS_ONLY = args.includes("--errors-only");
const STRICT_MODE = args.includes("--strict");
const fileArgs = args.filter((a) => !a.startsWith("--"));

/**
 * Tier definitions with required sections
 * Patterns are matched against heading text (case-insensitive)
 */
const TIER_DEFINITIONS = {
  1: {
    name: "Canonical",
    files: ["ROADMAP.md", "README.md", "ARCHITECTURE.md"],
    required: [/purpose|overview/i, /version history/i],
    recommended: [/ai instructions/i, /status/i],
  },
  2: {
    name: "Foundation",
    files: ["DOCUMENTATION_STANDARDS.md", "AI_WORKFLOW.md", "SECURITY.md", "DEVELOPMENT.md"],
    folders: ["docs/"],
    required: [/purpose|overview|scope/i, /version history/i],
    recommended: [/ai instructions/i, /quick start/i],
  },
  3: {
    name: "Planning",
    patterns: [/PLAN|ROADMAP|PROJECT_STATUS/i],
    required: [/purpose|overview|scope/i, /status|progress/i, /version history/i],
    recommended: [/ai instructions/i, /acceptance criteria/i],
  },
  4: {
    name: "Reference",
    patterns: [/PROCESS|CHECKLIST|WORKFLOW|STANDARDS/i],
    required: [/purpose|overview/i, /version history/i],
    recommended: [/ai instructions/i],
  },
  5: {
    name: "Guide",
    patterns: [/GUIDE|HOW.?TO|TUTORIAL/i],
    folders: ["docs/templates/"],
    required: [/overview|purpose/i, /version history/i],
    recommended: [/step|steps/i, /troubleshooting/i],
  },
};

/**
 * Check if file matches an explicit file list
 */
function matchExplicitFiles(fileName) {
  for (const [tier, def] of Object.entries(TIER_DEFINITIONS)) {
    if (def.files && def.files.includes(fileName)) {
      // Review #187: Always use radix 10 for predictable base-10 parsing
      return Number.parseInt(tier, 10);
    }
  }
  return null;
}

/**
 * Check if path matches folder patterns
 * Review #189: Enforce folder boundary to prevent "docs/" matching "docs-extra/"
 */
function matchFolderPatterns(relativePath) {
  for (const [tier, def] of Object.entries(TIER_DEFINITIONS)) {
    if (!def.folders) continue;
    for (const folder of def.folders) {
      // Ensure folder ends with / for proper boundary matching
      const normalizedFolder = folder.endsWith("/") ? folder : `${folder}/`;
      if (relativePath === folder || relativePath.startsWith(normalizedFolder)) {
        return Number.parseInt(tier, 10);
      }
    }
  }
  return null;
}

/**
 * Check if filename matches patterns
 */
function matchFilenamePatterns(fileName) {
  for (const [tier, def] of Object.entries(TIER_DEFINITIONS)) {
    if (!def.patterns) continue;
    for (const pattern of def.patterns) {
      if (pattern.test(fileName)) return Number.parseInt(tier, 10);
    }
  }
  return null;
}

/**
 * Determine the tier of a document
 */
function determineTier(filePath, _content) {
  const fileName = basename(filePath);
  // Review #187: Normalize Windows backslashes to forward slashes for cross-platform matching
  const relativePath = relative(ROOT, filePath).replaceAll("\\", "/");

  // Check in priority order
  const explicitMatch = matchExplicitFiles(fileName);
  if (explicitMatch !== null) return explicitMatch;

  const folderMatch = matchFolderPatterns(relativePath);
  if (folderMatch !== null) return folderMatch;

  const patternMatch = matchFilenamePatterns(fileName);
  if (patternMatch !== null) return patternMatch;

  // Default to tier 4 (Reference) for unknown docs
  return 4;
}

/**
 * Normalize line endings to LF (Unix style)
 * Fixes Windows CRLF files that break regex patterns with $ anchor
 * @param {string} content - Content with potentially mixed line endings
 * @returns {string} - Content with normalized LF line endings
 */
function normalizeLineEndings(content) {
  // S7781: Use string args with replaceAll() instead of regex
  return content.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

/**
 * Extract all headings from markdown content
 * @param {string} content - Markdown content
 * @returns {Array<{level: number, text: string, line: number}>}
 */
function extractHeadings(content) {
  const headings = [];
  const lines = normalizeLineEndings(content).split("\n");

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.{1,500})$/);
    if (match) {
      headings.push({
        level: match[1].length,
        // Review #215: Use \p{Extended_Pictographic} to match all emojis (reduces regex complexity)
        // and replaceAll() for ES2021+ idiom
        text: match[2].replaceAll(/\p{Extended_Pictographic}/gu, "").trim(),
        line: i + 1,
      });
    }
  }

  return headings;
}

/**
 * Extract metadata from document
 * @param {string} content - Document content
 * @returns {{lastUpdated?: string, version?: string, errors: string[]}}
 */
function extractMetadata(content) {
  const errors = [];
  let lastUpdated = null;
  let version = null;

  // Look for "Last Updated" in various formats
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

  // Look for version number
  const versionPatterns = [
    /\*\*(?:Document )?Version[:*]{0,20}\*{0,10}\s{0,100}[:]{0,10}\s{0,100}(\d+\.?\d*)/i,
    /Version[:\s]+(\d+\.?\d*)/i,
    /\| (\d+\.\d+) \|.*\|.*\|/, // Version history table
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

/**
 * Parse and validate a date string
 * @param {string} dateStr - Date string to parse
 * @returns {{valid: boolean, date?: Date, error?: string}}
 */
function parseDate(dateStr) {
  if (!dateStr) {
    return { valid: false, error: "No date provided" };
  }

  // Try various date formats
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return { valid: false, error: `Invalid date format: "${dateStr}"` };
  }

  // Sanity check: date should be between 2020 and 10 years from now
  const now = new Date();
  const minDate = new Date("2020-01-01");
  const maxDate = new Date(now.getFullYear() + 10, 11, 31);

  if (date < minDate || date > maxDate) {
    return { valid: false, error: `Date out of reasonable range: "${dateStr}"` };
  }

  return { valid: true, date };
}

/**
 * Check if a link looks like an instructional placeholder
 * Session #99 (CANON-0103): Filter false positives from template examples
 * @param {string} text - Link text
 * @param {string} target - Link target
 * @returns {boolean}
 */
function isPlaceholderLink(text, target) {
  // Common placeholder patterns in templates/documentation
  // Review #206: Refined patterns to avoid false negatives
  // Review #207: Add path/anchor detection to prevent skipping real links
  const normalizedTarget = target.trim();

  // Skip placeholder detection for things that look like real paths/anchors
  // This prevents skipping validation for links like "your-file.md" or "[something].md"
  const looksLikePathOrAnchor =
    normalizedTarget.startsWith("#") ||
    /[\\/]/.test(normalizedTarget) ||
    /\.[a-z0-9]+$/i.test(normalizedTarget);

  const placeholderPatterns = [
    /^<[a-z_-]+>$/i, // <path>, <url>, <filename> - specific angle bracket placeholders
    /^path$/i, // literal "path"
    /^url$/i, // literal "url"
    /^file$/i, // literal "file"
    /^link$/i, // literal "link"
    /^filename$/i, // literal "filename"
    /^\.\.\.$/i, // ellipsis
    /^example$/i, // exact "example" only (not "example.com")
  ];

  // Only check placeholder patterns if it doesn't look like a real path/anchor
  if (!looksLikePathOrAnchor) {
    // Check if target looks like a placeholder
    for (const pattern of placeholderPatterns) {
      if (pattern.test(normalizedTarget)) return true;
    }
  }

  // Check if text and target are the SAME generic word (instructional format)
  // Review #206: Require exact match, not just both being generic words
  const normalizedText = text.trim().toLowerCase();
  const normalizedTargetLower = normalizedTarget.toLowerCase();
  const genericWords = new Set(["text", "link", "file", "path", "url", "title", "name"]);
  if (normalizedText === normalizedTargetLower && genericWords.has(normalizedText)) {
    return true;
  }

  return false;
}

/**
 * Extract all markdown links from content
 * @param {string} content - Markdown content
 * @returns {Array<{text: string, target: string, line: number, isAnchor: boolean}>}
 */
function extractLinks(content) {
  const links = [];
  const lines = normalizeLineEndings(content).split("\n");

  for (let i = 0; i < lines.length; i++) {
    // Match [text](target) links
    const linkPattern = /\[([^\]]{1,2000})\]\(([^)]{1,2000})\)/g;
    let match;

    while ((match = linkPattern.exec(lines[i])) !== null) {
      const text = match[1];
      const target = match[2];

      // Skip external links
      if (
        target.startsWith("http://") ||
        target.startsWith("https://") ||
        target.startsWith("mailto:")
      ) {
        continue;
      }

      // Session #99 (CANON-0103): Skip placeholder links in templates
      if (isPlaceholderLink(text, target)) {
        continue;
      }

      links.push({
        text: text,
        target: target,
        line: i + 1,
        isAnchor: target.startsWith("#"),
      });
    }
  }

  return links;
}

/**
 * Validate internal file links
 * @param {Array} links - Extracted links
 * @param {string} docPath - Path to the document being checked
 * @returns {Array<string>} - List of errors
 */
function validateFileLinks(links, docPath) {
  const errors = [];
  const docDir = dirname(docPath);

  for (const link of links) {
    if (link.isAnchor) continue; // Skip anchor-only links

    // Handle paths with anchors
    const [filePath] = link.target.split("#");

    if (!filePath) continue; // Pure anchor link

    // Review #215: Decode URL-encoded paths (e.g., %20 for spaces)
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(filePath);
    } catch {
      decodedPath = filePath; // Use original if decode fails
    }

    // Resolve relative path
    const absolutePath = join(docDir, decodedPath);

    if (!existsSync(absolutePath)) {
      errors.push(`Line ${link.line}: Broken link to "${link.target}" (file not found)`);
    }
  }

  return errors;
}

/**
 * Validate anchor links within the same document
 * @param {Array} links - Extracted links
 * @param {Array} headings - Extracted headings
 * @returns {Array<string>} - List of errors
 */
function validateAnchorLinks(links, headings) {
  const errors = [];

  // Generate valid anchors from headings
  const validAnchors = new Set();
  for (const heading of headings) {
    // GitHub-style anchor generation
    const anchor = heading.text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    validAnchors.add(anchor);
  }

  for (const link of links) {
    // Review #213: Only validate same-file anchors (pure #anchor links)
    // Cross-file anchors (./file.md#anchor) would need to resolve the target file's headings
    // For now, skip cross-file anchor validation as it causes false positives
    if (!link.isAnchor) continue;
    if (!link.target.includes("#")) continue;

    const anchor = link.target.split("#")[1];
    if (!anchor) continue;

    // Normalize anchor for comparison
    const normalizedAnchor = anchor.toLowerCase().replace(/-+/g, "-");

    if (!validAnchors.has(normalizedAnchor)) {
      // Check for partial matches (emoji removal might cause mismatches)
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

/**
 * Check required sections for a tier
 * @param {number} tier - Document tier
 * @param {Array} headings - Extracted headings
 * @returns {{errors: string[], warnings: string[]}}
 */
function checkRequiredSections(tier, headings) {
  const errors = [];
  const warnings = [];

  const tierDef = TIER_DEFINITIONS[tier];
  if (!tierDef) {
    return { errors: [], warnings: ["Unknown tier, skipping section checks"] };
  }

  const headingTexts = headings.map((h) => h.text);

  // Check required sections
  for (const pattern of tierDef.required || []) {
    const found = headingTexts.some((text) => pattern.test(text));
    if (!found) {
      errors.push(`Missing required section matching: ${pattern.toString()}`);
    }
  }

  // Check recommended sections
  for (const pattern of tierDef.recommended || []) {
    const found = headingTexts.some((text) => pattern.test(text));
    if (!found) {
      warnings.push(`Missing recommended section matching: ${pattern.toString()}`);
    }
  }

  return { errors, warnings };
}

/**
 * Read document content safely
 * Review #196: Read via canonical path to mitigate TOCTOU symlink swap vulnerability
 * Review #197: Remove unsafe fallback, add root containment check
 */
function readDocumentContent(filePath) {
  try {
    // Read via canonical path to reduce symlink swap/TOCTOU risk
    const rootReal = realpathSync(ROOT);
    const effectivePath = realpathSync(filePath);

    // Review #197: Ensure canonicalized path is within project root
    const rel = relative(rootReal, effectivePath);
    if (!rel || rel.startsWith("..")) {
      return { content: null, error: "Path resolves outside project root" };
    }

    const content = readFileSync(effectivePath, "utf-8");
    if (!content || content.trim().length === 0) {
      return { content: null, error: "File is empty" };
    }
    return { content, error: null };
  } catch (err) {
    // Review #197: Do not fall back to reading a potentially non-canonical/symlink-swapped path
    const message = err instanceof Error ? err.message : String(err);
    return { content: null, error: `Cannot read file safely: ${message}` };
  }
}

/**
 * Validate document metadata (Last Updated date)
 */
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

  // Check if date is stale (> 90 days for active docs)
  const daysSinceUpdate = Math.floor((Date.now() - dateResult.date) / (1000 * 60 * 60 * 24));
  if (daysSinceUpdate > 90 && tier <= 3) {
    warnings.push(`Document may be stale: last updated ${daysSinceUpdate} days ago`);
  }
}

/**
 * Validate document version format
 */
function validateVersionFormat(metadata, warnings) {
  if (!metadata.version) return;
  if (!/^\d+(\.\d+)?$/.test(metadata.version)) {
    warnings.push(`Version number format should be X.Y, got: "${metadata.version}"`);
  }
}

/**
 * Lint a single document
 */
function lintDocument(filePath) {
  const errors = [];
  const warnings = [];

  // Read file
  const { content, error: readError } = readDocumentContent(filePath);
  if (readError) {
    // Review #186: Use relative path for consistency with success output
    return { file: relative(ROOT, filePath), tier: 0, errors: [readError], warnings: [] };
  }

  // Determine tier
  const tier = determineTier(filePath, content);

  if (VERBOSE) {
    console.log(
      `  Checking: ${relative(ROOT, filePath)} (Tier ${tier}: ${TIER_DEFINITIONS[tier]?.name || "Unknown"})`
    );
  }

  // Extract components
  const headings = extractHeadings(content);
  const metadata = extractMetadata(content);
  const links = extractLinks(content);

  // Check 1: Has title (H1)
  if (!headings.some((h) => h.level === 1)) {
    errors.push("Missing document title (H1 heading)");
  }

  // Check 2: Has metadata
  validateMetadataDate(metadata, tier, warnings);

  // Check 3: Version format
  validateVersionFormat(metadata, warnings);

  // Check 4: Required sections
  const sectionCheck = checkRequiredSections(tier, headings);
  errors.push(...sectionCheck.errors);
  warnings.push(...sectionCheck.warnings);

  // Check 5: File links
  errors.push(...validateFileLinks(links, filePath));

  // Check 6: Anchor links (warning only, as emoji handling is imperfect)
  const anchorErrors = validateAnchorLinks(links, headings);
  if (anchorErrors.length <= 3) {
    warnings.push(...anchorErrors);
  }

  return { file: relative(ROOT, filePath), tier, errors, warnings };
}

/**
 * Find all markdown files in a directory recursively
 * @param {string} dir - Directory to search
 * @param {Array} files - Accumulator array
 * @returns {Array<string>} - List of markdown file paths
 */
function findMarkdownFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    // Skip node_modules, .git, hidden directories, archive folders, and legacy/generated content
    if (
      entry.startsWith(".") ||
      entry === "node_modules" ||
      entry === "out" ||
      entry === "dist" ||
      entry === "archive" ||
      entry === "single-session" || // Legacy audit reports - exempt from current doc standards
      entry === "views" || // Auto-generated debt views
      entry === "dataconnect-generated" || // Auto-generated Firebase code
      entry === "plans" || // Legacy planning docs
      entry === "templates" // Templates have intentional placeholder links
    ) {
      continue;
    }

    try {
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        findMarkdownFiles(fullPath, files);
      } else if (extname(entry) === ".md") {
        // Skip legacy audit/planning files that predate current doc standards
        // Also skip auto-generated index files in technical-debt
        if (
          /^PHASE_\d+[A-Z]?_AUDIT\.md$/i.test(entry) ||
          entry === "FINAL_SYSTEM_AUDIT.md" ||
          entry === "SESSION_HISTORY.md" ||
          entry === "METRICS.md" ||
          entry === "roadmap-assignment-report.md" ||
          entry === "OPERATIONAL_VISIBILITY_SPRINT.md" || // Legacy sprint doc
          entry === "SONARCLOUD_CLEANUP_RUNBOOK.md" || // Legacy runbook
          entry === "LEARNING_METRICS.md" || // Legacy metrics
          entry === "PLAN_MAP.md" // Legacy planning
        ) {
          continue;
        }
        // Skip INDEX.md in technical-debt (managed by debt tooling)
        if (entry === "INDEX.md" && fullPath.includes("technical-debt")) {
          continue;
        }
        // Skip auto-generated documentation index
        if (entry === "DOCUMENTATION_INDEX.md") {
          continue;
        }
        // Skip comprehensive audit reports (auto-generated by audit tooling)
        if (fullPath.includes("audits") && fullPath.includes("comprehensive")) {
          continue;
        }
        // Skip auto-generated view files in technical-debt/views (managed by generate-views.js)
        if (fullPath.includes("technical-debt") && fullPath.includes("views")) {
          continue;
        }
        files.push(fullPath);
      }
    } catch {
      // Skip files we can't stat
    }
  }

  return files;
}

/**
 * Resolve file arguments with path traversal and symlink protection
 * Review #190: Check for symlinks to prevent symlink traversal attacks
 * Review #193: Canonicalize ROOT, use resolvedPath for non-symlinks, deduplicate
 * Review #194: Canonicalize ALL paths to defend against symlinked parent directories
 */
function resolveFileArgs(files) {
  const resolved = [];
  const seen = new Set();
  const rootResolved = resolve(ROOT);

  // Review #193: Canonicalize ROOT to handle symlinked project directories
  // Review #194: Guard against realpathSync throwing (broken symlink/permission/missing dir)
  let rootRealResolved = rootResolved;
  try {
    rootRealResolved = resolve(realpathSync(ROOT));
  } catch (error) {
    console.warn(`Warning: Cannot resolve real path for ROOT, using resolved path`);
  }

  for (const file of files) {
    const fullPath = isAbsolute(file) ? file : join(ROOT, file);
    const resolvedPath = resolve(fullPath);

    // Check path traversal before checking existence
    if (resolvedPath !== rootResolved && !resolvedPath.startsWith(rootResolved + sep)) {
      console.error(`Error: Path traversal blocked: ${file}`);
      continue;
    }

    if (!existsSync(fullPath)) {
      console.error(`Warning: File not found: ${file}`);
      continue;
    }

    try {
      // Review #194: Canonicalize ALL paths to defend against symlinked parent directories
      const realResolved = resolve(realpathSync(fullPath));
      if (realResolved !== rootRealResolved && !realResolved.startsWith(rootRealResolved + sep)) {
        console.error(`Error: Symlink traversal blocked: ${file} -> outside project root`);
        continue;
      }

      // Keep lstatSync for diagnostics / future checks, but containment is enforced above
      lstatSync(fullPath);

      // Review #193: Deduplicate to prevent linting same file multiple times
      if (seen.has(realResolved)) continue;
      seen.add(realResolved);

      // Skip auto-generated view files in technical-debt/views (managed by generate-views.js)
      if (resolvedPath.includes("technical-debt") && resolvedPath.includes("views")) {
        continue;
      }

      // Skip auto-generated documentation index
      if (resolvedPath.endsWith("DOCUMENTATION_INDEX.md")) {
        continue;
      }

      // Skip comprehensive audit reports (auto-generated by audit tooling)
      if (resolvedPath.includes("audits") && resolvedPath.includes("comprehensive")) {
        continue;
      }

      // Review #195: Return project-local canonical path for stable relative() output/logging
      resolved.push(resolvedPath);
    } catch {
      console.error(`Warning: Cannot stat file: ${file}`);
    }
  }

  return resolved;
}

/**
 * Output file errors and warnings
 */
function outputFileErrors(filesWithErrors) {
  if (filesWithErrors.length === 0) return;

  console.log("❌ FILES WITH ERRORS:\n");
  for (const result of filesWithErrors) {
    console.log(`  ${result.file} (Tier ${result.tier}):`);
    for (const error of result.errors) {
      console.log(`    ❌ ${error}`);
    }
    if (!ERRORS_ONLY) {
      for (const warning of result.warnings) {
        console.log(`    ⚠️  ${warning}`);
      }
    }
    console.log("");
  }
}

/**
 * Output file warnings only
 */
function outputFileWarnings(filesWithWarnings) {
  if (ERRORS_ONLY || filesWithWarnings.length === 0) return;

  console.log("⚠️  FILES WITH WARNINGS:\n");
  for (const result of filesWithWarnings) {
    console.log(`  ${result.file} (Tier ${result.tier}):`);
    for (const warning of result.warnings) {
      console.log(`    ⚠️  ${warning}`);
    }
    console.log("");
  }
}

/**
 * Output summary statistics
 */
function outputSummary(results, totalErrors, totalWarnings) {
  const cleanFiles = results.filter((r) => r.errors.length === 0 && r.warnings.length === 0);
  const filesWithErrors = results.filter((r) => r.errors.length > 0);
  const filesWithWarnings = results.filter((r) => r.warnings.length > 0 && r.errors.length === 0);

  console.log("─".repeat(50));
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Files checked: ${results.length}`);
  console.log(`   Files passing: ${cleanFiles.length}`);
  console.log(`   Files with errors: ${filesWithErrors.length}`);
  console.log(`   Files with warnings: ${filesWithWarnings.length}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log(`   Total warnings: ${totalWarnings}`);

  if (totalErrors === 0 && (totalWarnings === 0 || !STRICT_MODE)) {
    console.log("\n✅ All documentation checks passed!");
  } else if (totalErrors === 0 && totalWarnings > 0 && STRICT_MODE) {
    console.log("\n❌ Documentation checks failed (--strict mode: warnings treated as errors).");
  } else {
    console.log("\n❌ Documentation checks failed. Please fix errors above.");
  }
}

/**
 * Main function
 */
function main() {
  console.log("📝 Running documentation linter...\n");

  // Determine files to check
  const filesToCheck = fileArgs.length > 0 ? resolveFileArgs(fileArgs) : findMarkdownFiles(ROOT);

  if (filesToCheck.length === 0) {
    console.log("No markdown files found to check.");
    process.exit(0);
  }

  console.log(`Checking ${filesToCheck.length} file(s)...\n`);

  // Lint all files
  const results = filesToCheck.map((file) => lintDocument(file));
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  // Output results
  if (JSON_OUTPUT) {
    console.log(JSON.stringify({ results, totalErrors, totalWarnings }, null, 2));
  } else {
    const filesWithErrors = results.filter((r) => r.errors.length > 0);
    const filesWithWarnings = results.filter((r) => r.warnings.length > 0 && r.errors.length === 0);

    outputFileErrors(filesWithErrors);
    outputFileWarnings(filesWithWarnings);
    outputSummary(results, totalErrors, totalWarnings);
  }

  // Exit with appropriate code (in strict mode, warnings also cause failure)
  const hasFailures = totalErrors > 0 || (STRICT_MODE && totalWarnings > 0);
  process.exit(hasFailures ? 1 : 0);
}

// Run main function
try {
  main();
} catch (error) {
  // Defensive wrapper to prevent error handling from failing
  const safe = (value) => {
    try {
      return sanitizeError(value);
    } catch {
      return "Unknown error";
    }
  };

  // Use sanitizeError to avoid exposing sensitive paths in CI logs
  console.error("❌ Unexpected error:", safe(error));
  // Show sanitized stack trace in verbose mode for debugging
  if (VERBOSE && error && typeof error === "object" && "stack" in error && error.stack) {
    console.error(safe(error.stack));
  }
  process.exit(1);
}
