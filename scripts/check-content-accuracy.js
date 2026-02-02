#!/usr/bin/env node
/**
 * Content Accuracy Validation Script
 *
 * Checks documentation content for accuracy against codebase.
 *
 * Checks:
 * - Version numbers match package.json
 * - File paths mentioned actually exist
 * - npm script references exist
 * - Code snippet syntax validation (basic)
 *
 * Usage: node scripts/check-content-accuracy.js [options] [files...]
 *
 * Options:
 *   --output <file>   Output JSONL file (default: stdout)
 *   --verbose         Show detailed logging
 *   --quiet           Only output errors
 *   --json            Output as JSON array instead of JSONL
 *
 * Exit codes:
 *   0 - All content accurate
 *   1 - Inaccuracies found
 *   2 - Script error
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sanitizeError } from "./lib/sanitize-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// Parse command line arguments
const args = process.argv.slice(2);
const VERBOSE = args.includes("--verbose");
const QUIET = args.includes("--quiet");
const JSON_OUTPUT = args.includes("--json");
const outputIdx = args.indexOf("--output");
const OUTPUT_FILE = outputIdx >= 0 ? args[outputIdx + 1] : null;
const fileArgs = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--output");

// Load package.json for version checking
let packageJson = {};
try {
  const pkgPath = join(ROOT, "package.json");
  packageJson = JSON.parse(readFileSync(pkgPath, "utf-8"));
} catch (err) {
  console.error("Warning: Could not read package.json:", sanitizeError(err));
}

// Extract versions from package.json
const dependencyVersions = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
};

// Extract npm scripts
const npmScripts = packageJson.scripts || {};

/**
 * Find all markdown files recursively
 */
function findMarkdownFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    if (
      entry.startsWith(".") ||
      entry === "node_modules" ||
      entry === "out" ||
      entry === "dist" ||
      entry === "archive"
    ) {
      continue;
    }

    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        findMarkdownFiles(fullPath, files);
      } else if (extname(entry) === ".md") {
        files.push(fullPath);
      }
    } catch {
      // Skip files we can't stat
    }
  }

  return files;
}

/**
 * Check version number accuracy
 * Looks for version mentions in format: Package X.Y.Z or package@X.Y.Z
 */
function checkVersionAccuracy(content, filePath) {
  const findings = [];
  const lines = content.split("\n");
  const relPath = relative(ROOT, filePath);

  // Pattern for version mentions
  // Match: "Package 1.2.3", "package@1.2.3", "Package v1.2.3", "Package: 1.2.3"
  const versionPatterns = [
    // Table format: | Package | Version |
    /\|\s*([\w@/-]+)\s*\|\s*v?(\d+\.\d+\.\d+)\s*\|/gi,
    // Prose format: "Next.js 15.0.0" or "React v19.0.0"
    /(next\.?js|react|firebase|tailwind(?:css)?|zod|typescript|node|npm)\s+v?(\d+\.\d+\.\d+)/gi,
    // Package@version format
    /([\w@/-]+)@(\d+\.\d+\.\d+)/g,
  ];

  // Known package name mappings
  const packageNameMap = {
    "next.js": "next",
    nextjs: "next",
    tailwindcss: "tailwindcss",
    tailwind: "tailwindcss",
    react: "react",
    firebase: "firebase",
    zod: "zod",
    typescript: "typescript",
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const pattern of versionPatterns) {
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(line)) !== null) {
        const rawPackageName = match[1].toLowerCase().replaceAll(".", "");
        const packageName = packageNameMap[rawPackageName] || rawPackageName;
        const mentionedVersion = match[2];

        // Check if this package exists in dependencies
        if (dependencyVersions[packageName]) {
          // Extract version from dependency (strip ^, ~, etc.)
          const actualVersion = dependencyVersions[packageName].replace(/^[\^~>=<]+/, "");

          // Compare major.minor versions
          const mentionedMajorMinor = mentionedVersion.split(".").slice(0, 2).join(".");
          const actualMajorMinor = actualVersion.split(".").slice(0, 2).join(".");

          if (mentionedMajorMinor !== actualMajorMinor) {
            findings.push({
              id: `DOC-CONTENT-VER-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              category: "documentation",
              severity: "S2",
              effort: "E0",
              confidence: "HIGH",
              verified: "TOOL_VALIDATED",
              file: relPath,
              line: i + 1,
              title: `Outdated version reference: ${packageName}`,
              description: `Documentation mentions ${packageName} ${mentionedVersion} but package.json has ${actualVersion}`,
              recommendation: `Update version reference to ${actualVersion}`,
              evidence: [
                `Mentioned: ${mentionedVersion}`,
                `Actual: ${actualVersion}`,
                `Line: ${line.trim().substring(0, 100)}`,
              ],
              cross_ref: "version_check",
            });
          }
        }
      }
    }
  }

  return findings;
}

/**
 * Check file path references
 * Looks for paths in backticks or quotes that look like file paths
 * TODO: Refactor to reduce cognitive complexity (currently 29, target 15)
 */
function checkPathReferences(content, filePath) {
  const findings = [];
  const lines = content.split("\n");
  const relPath = relative(ROOT, filePath);
  const docDir = dirname(filePath);

  // Patterns for file path references
  const pathPatterns = [
    // Backtick paths: `path/to/file.js`
    /`([^`]+\.[a-zA-Z]{1,5})`/g,
    // Relative paths in prose: ./path/to/file or ../path
    /(?:^|\s)(\.\.?\/[\w/.-]+\.[a-zA-Z]{1,5})(?:\s|$|[,)])/g,
  ];

  // Paths to skip (common false positives)
  const skipPatterns = [
    /^https?:\/\//,
    /^mailto:/,
    /^#/,
    /\.[a-z]+\([^)]*\)/, // function calls like .map()
    /^node_modules\//,
    /^<[^>]+>$/, // placeholder like <path>
    /\.\*/, // glob patterns
    /\$\{/, // template strings
    /example\.(js|ts|json)/i, // example files
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const pattern of pathPatterns) {
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(line)) !== null) {
        const path = match[1].trim();

        // Skip excluded patterns
        if (skipPatterns.some((p) => p.test(path))) {
          continue;
        }

        // Skip if path doesn't look like a real file
        if (!path.includes("/") && !path.includes("\\")) {
          continue;
        }

        // Try to resolve the path
        const resolvedPath =
          path.startsWith("./") || path.startsWith("../")
            ? resolve(docDir, path)
            : resolve(ROOT, path);

        // Security: prevent path traversal outside repository root
        const relToRoot = relative(ROOT, resolvedPath).replaceAll(/\\/g, "/");
        if (relToRoot.startsWith("../") || relToRoot === "..") {
          continue;
        }

        // Check if file exists
        if (!existsSync(resolvedPath)) {
          findings.push({
            id: `DOC-CONTENT-PATH-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            category: "documentation",
            severity: "S2",
            effort: "E1",
            confidence: "MEDIUM",
            verified: "TOOL_VALIDATED",
            file: relPath,
            line: i + 1,
            title: `Broken file path reference`,
            description: `Referenced file path "${path}" does not exist`,
            recommendation: "Update or remove the broken file reference",
            evidence: [
              `Path: ${path}`,
              `Resolved: ${relative(ROOT, resolvedPath)}`,
              `Line: ${line.trim().substring(0, 100)}`,
            ],
            cross_ref: "path_check",
          });
        }
      }
    }
  }

  return findings;
}

/**
 * Check npm script references
 * Looks for `npm run <script>` or `npm <script>` patterns
 */
function checkNpmScriptReferences(content, filePath) {
  const findings = [];
  const lines = content.split("\n");
  const relPath = relative(ROOT, filePath);

  // Patterns for npm script references
  const npmPatterns = [
    // npm run script
    /npm\s+run\s+([\w:-]+)/g,
    // npm script (built-in like test, start, build)
    /npm\s+(test|start|build|dev|lint)(?:\s|$|[,)])/g,
    // yarn script
    /yarn\s+([\w:-]+)/g,
    // pnpm script
    /pnpm\s+([\w:-]+)/g,
  ];

  // Built-in npm scripts that don't need to be in package.json
  const builtInScripts = new Set([
    "install",
    "uninstall",
    "update",
    "init",
    "publish",
    "help",
    "version",
  ]);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const pattern of npmPatterns) {
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(line)) !== null) {
        const scriptName = match[1];

        // Skip built-in commands
        if (builtInScripts.has(scriptName)) {
          continue;
        }

        // Check if script exists
        if (!npmScripts[scriptName]) {
          findings.push({
            id: `DOC-CONTENT-NPM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            category: "documentation",
            severity: "S1",
            effort: "E1",
            confidence: "HIGH",
            verified: "TOOL_VALIDATED",
            file: relPath,
            line: i + 1,
            title: `Unknown npm script: ${scriptName}`,
            description: `Documentation references npm script "${scriptName}" which does not exist in package.json`,
            recommendation: "Update the script name or add the script to package.json",
            evidence: [
              `Script: ${scriptName}`,
              `Available scripts: ${Object.keys(npmScripts).slice(0, 10).join(", ")}...`,
              `Line: ${line.trim().substring(0, 100)}`,
            ],
            cross_ref: "npm_script_check",
          });
        }
      }
    }
  }

  return findings;
}

/**
 * Check code block syntax (basic validation)
 * Looks for code blocks without language tags
 */
function checkCodeBlockSyntax(content, filePath) {
  const findings = [];
  const lines = content.split("\n");
  const relPath = relative(ROOT, filePath);

  let inCodeBlock = false;
  let codeBlockStart = 0;
  let codeBlockLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for code block start
    const startMatch = line.match(/^```(\w*)$/);
    if (startMatch && !inCodeBlock) {
      inCodeBlock = true;
      codeBlockStart = i + 1;
      codeBlockLang = startMatch[1];

      // Flag code blocks without language tag
      if (!codeBlockLang) {
        findings.push({
          id: `DOC-CONTENT-CODE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          category: "documentation",
          severity: "S3",
          effort: "E0",
          confidence: "HIGH",
          verified: "TOOL_VALIDATED",
          file: relPath,
          line: codeBlockStart,
          title: "Code block missing language tag",
          description: "Code block should specify a language for proper syntax highlighting",
          recommendation: "Add language identifier after opening ``` (e.g., ```javascript)",
          evidence: [`Line ${codeBlockStart}: ${line}`],
          cross_ref: "code_block_check",
        });
      }
      continue;
    }

    // Check for code block end
    if (line === "```" && inCodeBlock) {
      inCodeBlock = false;
    }
  }

  return findings;
}

/**
 * Check a single document for content accuracy
 */
function checkDocument(filePath) {
  const findings = [];

  try {
    const content = readFileSync(filePath, "utf-8");

    if (VERBOSE) {
      console.log(`  Checking: ${relative(ROOT, filePath)}`);
    }

    // Run all checks
    findings.push(
      ...checkVersionAccuracy(content, filePath),
      ...checkPathReferences(content, filePath),
      ...checkNpmScriptReferences(content, filePath),
      ...checkCodeBlockSyntax(content, filePath)
    );
  } catch (err) {
    if (!QUIET) {
      console.warn(`Warning: Could not check ${relative(ROOT, filePath)}: ${sanitizeError(err)}`);
    }
  }

  return findings;
}

/**
 * Main function
 * TODO: Refactor to reduce cognitive complexity (currently 19, target 15)
 */
function main() {
  if (!QUIET) {
    console.log("🔍 Checking documentation content accuracy...\n");
  }

  // Determine files to check
  const filesToCheck =
    fileArgs.length > 0 ? fileArgs.filter((f) => existsSync(f)) : findMarkdownFiles(ROOT);

  if (filesToCheck.length === 0) {
    console.log("No markdown files found to check.");
    process.exit(0);
  }

  if (!QUIET) {
    console.log(`Checking ${filesToCheck.length} file(s)...\n`);
  }

  // Check all files
  const allFindings = [];
  for (const file of filesToCheck) {
    const findings = checkDocument(file);
    allFindings.push(...findings);
  }

  // Output results
  if (OUTPUT_FILE) {
    const output = JSON_OUTPUT
      ? JSON.stringify(allFindings, null, 2)
      : allFindings.map((f) => JSON.stringify(f)).join("\n");

    writeFileSync(OUTPUT_FILE, output + "\n");

    if (!QUIET) {
      console.log(`\n📄 Results written to: ${OUTPUT_FILE}`);
    }
  } else if (JSON_OUTPUT) {
    console.log(JSON.stringify(allFindings, null, 2));
  } else if (allFindings.length > 0) {
    console.log("\n📋 JSONL Findings:\n");
    for (const finding of allFindings) {
      console.log(JSON.stringify(finding));
    }
  }

  // Group findings by type for summary
  const versionIssues = allFindings.filter((f) => f.title.includes("version"));
  const pathIssues = allFindings.filter((f) => f.title.includes("path"));
  const npmIssues = allFindings.filter((f) => f.title.includes("npm"));
  const codeIssues = allFindings.filter((f) => f.title.includes("Code"));

  // Summary
  if (!QUIET) {
    console.log("\n─".repeat(50));
    console.log("\n📊 Summary:");
    console.log(`   Files checked: ${filesToCheck.length}`);
    console.log(`   Total findings: ${allFindings.length}`);
    console.log(`     - Version mismatches: ${versionIssues.length}`);
    console.log(`     - Broken paths: ${pathIssues.length}`);
    console.log(`     - Unknown npm scripts: ${npmIssues.length}`);
    console.log(`     - Code block issues: ${codeIssues.length}`);

    if (allFindings.length === 0) {
      console.log("\n✅ All documentation content is accurate!");
    } else {
      console.log(`\n❌ ${allFindings.length} accuracy issue(s) found.`);
    }
  }

  process.exit(allFindings.length > 0 ? 1 : 0);
}

// Run main function
try {
  main();
} catch (error) {
  console.error("❌ Unexpected error:", sanitizeError(error));
  process.exit(2);
}
