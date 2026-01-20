#!/usr/bin/env node
/**
 * security-check.js
 *
 * Quick security pattern compliance check for modified files.
 * Run: npm run security:check
 *
 * Exit codes:
 *   0 = OK (no violations found)
 *   1 = Warning (violations found, but non-blocking by default)
 *   2 = Error (execution error)
 *
 * Usage:
 *   node scripts/security-check.js                 # Check staged files
 *   node scripts/security-check.js --all          # Check all source files
 *   node scripts/security-check.js --file path    # Check specific file
 *   node scripts/security-check.js --blocking     # Exit non-zero on violations
 */

import { existsSync, readFileSync, readdirSync, statSync, lstatSync, realpathSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname, extname, relative, resolve, isAbsolute, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

// Security patterns to check
const SECURITY_PATTERNS = [
  {
    id: "SEC-001",
    name: "execSync with shell interpolation",
    pattern: /execSync\s*\(\s*`[^`]*\$\{/g,
    severity: "HIGH",
    message: "Potential command injection: use execFileSync or spawnSync with args array",
    fileTypes: [".js", ".ts"],
  },
  {
    id: "SEC-002",
    name: "Unsafe eval usage",
    pattern: /\beval\s*\(/g,
    severity: "CRITICAL",
    message: "Avoid eval() - use safer alternatives",
    fileTypes: [".js", ".ts", ".tsx"],
    exclude: [
      /eslint/,
      /config/,
      /(?:^|[\\/])security-check\.js$/,
      /(?:^|[\\/])check-pattern-compliance\.js$/,
    ],
  },
  {
    id: "SEC-003",
    name: "innerHTML assignment",
    pattern: /\.innerHTML\s*=/g,
    severity: "MEDIUM",
    message: "Potential XSS: use textContent or sanitize HTML",
    fileTypes: [".js", ".ts", ".tsx"],
  },
  {
    id: "SEC-004",
    name: "Hardcoded secrets",
    pattern: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    severity: "CRITICAL",
    message: "Potential hardcoded secret - use environment variables",
    fileTypes: [".js", ".ts", ".tsx", ".json"],
    exclude: [/test/, /mock/, /example/, /\.d\.ts$/],
  },
  {
    id: "SEC-005",
    name: "URL without protocol validation",
    pattern: /new\s+URL\s*\([^)]+\)(?!\s*\.\s*protocol)/g,
    severity: "LOW",
    message: "Consider validating URL protocol (https only for external)",
    fileTypes: [".js", ".ts", ".tsx"],
  },
  {
    id: "SEC-006",
    name: "process.env in Cloud Functions",
    pattern: /process\.env\./g,
    severity: "MEDIUM",
    message: "Use defineString() instead of process.env in Cloud Functions",
    fileTypes: [".js", ".ts"],
    pathFilter: /functions\//,
  },
  {
    id: "SEC-007",
    name: "Unbounded regex quantifier on user input",
    pattern: /new\s+RegExp\s*\([^)]*[+*][^)]*\)/g,
    severity: "MEDIUM",
    message: "Use bounded quantifiers {1,N} to prevent ReDoS",
    fileTypes: [".js", ".ts", ".tsx"],
  },
  {
    id: "SEC-008",
    name: "Missing path containment check",
    pattern: /path\.resolve\s*\([^)]+\)(?![\s\S]{0,100}(?:relative|startsWith|includes))/g,
    severity: "LOW",
    message: "Verify resolved path stays within expected directory",
    fileTypes: [".js", ".ts"],
    pathFilter: /(?:hooks|scripts)\//,
  },
  {
    id: "SEC-009",
    name: "Direct localStorage access",
    pattern: /\blocalStorage\s*\.\s*(?:get|set|remove)Item/g,
    severity: "LOW",
    message: "Use SSR-safe storage utilities from lib/utils/storage.ts",
    fileTypes: [".ts", ".tsx"],
    exclude: [/storage\.ts$/, /test/],
  },
  {
    id: "SEC-010",
    name: "Unescaped template in shell",
    pattern: /execSync\s*\([^)]*\$\{[^}]+\}/g,
    severity: "HIGH",
    message: "Shell command with unescaped variable - use execFileSync",
    fileTypes: [".js", ".ts"],
  },
];

// Files/directories to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.next/,
  /dist/,
  /coverage/,
  /\.git/,
  /\.turbo/,
  /archive/,
  /\.d\.ts$/,
];

/**
 * Check if a pattern should be applied to a file
 */
function shouldApplyPattern(pattern, ext, relativePath) {
  // Check file type filter
  if (!pattern.fileTypes.includes(ext)) return false;

  // Check path filter
  if (pattern.pathFilter && !pattern.pathFilter.test(relativePath)) return false;

  // Check exclude patterns
  if (pattern.exclude && pattern.exclude.some((e) => e.test(relativePath))) return false;

  return true;
}

/**
 * Find pattern matches in content and return violations
 * Review #190: Use normalizedLines derived from normalizedContent for consistent lookup
 */
function findPatternViolations(pattern, content, _lines, relativePath) {
  const violations = [];

  // Review #189: Normalize CRLF to LF for consistent line number calculation
  // Review #195: Handle both CRLF (\r\n) and CR (\r) line endings
  const normalizedContent = content.replace(/\r\n?/g, "\n");
  // Review #190: Compute normalizedLines from normalizedContent for consistent line lookup
  const normalizedLines = normalizedContent.split("\n");

  // Review #187: Always use global regex to find ALL matches, not just the first.
  // Non-global regexes would only find the first occurrence, missing security issues.
  const flags = pattern.pattern.flags.includes("g")
    ? pattern.pattern.flags
    : pattern.pattern.flags + "g";
  const regex = new RegExp(pattern.pattern.source, flags);

  // Global regexes: iterate all matches
  let match;
  while ((match = regex.exec(normalizedContent)) !== null) {
    const beforeMatch = normalizedContent.slice(0, match.index);
    const lineNum = beforeMatch.split("\n").length;
    const lineContent = normalizedLines[lineNum - 1]?.slice(0, 80) || "";

    violations.push({
      file: relativePath,
      line: lineNum,
      pattern: pattern.id,
      name: pattern.name,
      severity: pattern.severity,
      message: pattern.message,
      snippet: lineContent.trim(),
    });

    // Prevent infinite loops on zero-length matches
    if (match[0].length === 0) {
      regex.lastIndex++;
    }
  }

  return violations;
}

/**
 * Group violations by severity level
 */
function groupViolationsBySeverity(violations) {
  return {
    critical: violations.filter((v) => v.severity === "CRITICAL"),
    high: violations.filter((v) => v.severity === "HIGH"),
    medium: violations.filter((v) => v.severity === "MEDIUM"),
    low: violations.filter((v) => v.severity === "LOW"),
  };
}

/**
 * Output violation summary
 */
function outputViolationSummary(groups, total) {
  console.log(`Found ${total} potential issue(s):`);
  console.log(`   CRITICAL: ${groups.critical.length}`);
  console.log(`   HIGH:     ${groups.high.length}`);
  console.log(`   MEDIUM:   ${groups.medium.length}`);
  console.log(`   LOW:      ${groups.low.length}`);
  console.log("");
}

/**
 * Output high/critical violation details
 */
function outputHighSeverityDetails(violations) {
  if (violations.length === 0) return;

  console.log("🛑 HIGH/CRITICAL Issues:");
  for (const v of violations) {
    console.log(`   ${v.file}:${v.line}`);
    console.log(`      [${v.pattern}] ${v.name}`);
    console.log(`      ${v.message}`);
    console.log(`      > ${v.snippet}`);
    console.log("");
  }
}

/**
 * Output medium/low violation summary
 */
function outputLowSeveritySummary(violations) {
  if (violations.length === 0) return;

  console.log("⚠️  MEDIUM/LOW Issues (summary):");
  for (const v of violations) {
    console.log(`   ${v.file}:${v.line} [${v.pattern}] ${v.name}`);
  }
  console.log("");
}

/**
 * Determine exit code based on violations and blocking mode
 */
function determineExitCode(groups, isBlocking) {
  const totalViolations =
    groups.critical.length + groups.high.length + groups.medium.length + groups.low.length;

  if (totalViolations === 0) return 0;
  if (isBlocking && (groups.critical.length > 0 || groups.high.length > 0)) return 1;
  return 0; // Non-blocking by default
}

/**
 * Get files to check based on mode
 */
function getFilesToCheck(args) {
  // Check specific file
  const fileIndex = args.indexOf("--file");
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    const input = args[fileIndex + 1];

    // Resolve path relative to project root for security (including symlink escapes)
    const rootReal = resolve(PROJECT_ROOT);
    const abs = resolve(rootReal, input);

    // Try to resolve symlinks if file exists
    let absReal = abs;
    try {
      absReal = realpathSync(abs);
    } catch {
      // If the file doesn't exist, keep the resolved path and let the not-found logic handle it
    }

    const rel = relative(rootReal, absReal);

    // Path traversal protection: reject paths outside project (incl. symlinks pointing out)
    if (rel.startsWith(".." + sep) || rel === "..") {
      console.error(`Refusing to scan outside project: ${input}`);
      return [];
    }

    if (existsSync(absReal)) {
      return [absReal];
    }
    console.error(`File not found: ${input}`);
    return [];
  }

  // Check all source files
  if (args.includes("--all")) {
    return getAllSourceFiles(PROJECT_ROOT);
  }

  // Check staged files (default)
  return getStagedFiles();
}

/**
 * Get staged files from git
 */
function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
    });
    return output
      .split("\n")
      .filter((f) => f.trim())
      .map((f) => join(PROJECT_ROOT, f))
      .filter((f) => existsSync(f));
  } catch {
    return [];
  }
}

/**
 * Get all source files recursively
 */
function getAllSourceFiles(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    // Skip directories we can't read (permissions, etc.)
    return files;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    // Skip ignored paths
    if (SKIP_PATTERNS.some((p) => p.test(fullPath))) continue;

    let stat;
    try {
      stat = lstatSync(fullPath);
    } catch {
      // Skip files we can't stat (broken symlinks, etc.)
      continue;
    }

    // Skip symlinks to avoid escaping project boundaries or cycles
    if (stat.isSymbolicLink()) {
      continue;
    }

    if (stat.isDirectory()) {
      getAllSourceFiles(fullPath, files);
    } else if ([".js", ".ts", ".tsx", ".json"].includes(extname(entry))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Check a file against security patterns
 */
function checkFile(filePath) {
  const violations = [];
  const ext = extname(filePath);
  const relativePath = relative(PROJECT_ROOT, filePath);

  let content;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    return violations;
  }

  const lines = content.split("\n");

  for (const pattern of SECURITY_PATTERNS) {
    if (!shouldApplyPattern(pattern, ext, relativePath)) continue;

    // Reset regex state
    pattern.pattern.lastIndex = 0;

    const patternViolations = findPatternViolations(pattern, content, lines, relativePath);
    violations.push(...patternViolations);
  }

  return violations;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const isBlocking = args.includes("--blocking");
  const isQuiet = args.includes("--quiet");

  try {
    const files = getFilesToCheck(args);

    if (files.length === 0) {
      if (!isQuiet) console.log("✅ No files to check");
      process.exitCode = 0;
      return;
    }

    if (!isQuiet) {
      console.log("🔒 Security Pattern Check");
      console.log("═".repeat(50));
      console.log(`   Checking ${files.length} file(s)`);
      console.log("");
    }

    // Collect all violations
    const allViolations = files.flatMap((file) => checkFile(file));
    const groups = groupViolationsBySeverity(allViolations);

    // Output results
    if (!isQuiet) {
      if (allViolations.length === 0) {
        console.log("✅ No security violations found");
      } else {
        outputViolationSummary(groups, allViolations.length);
        outputHighSeverityDetails([...groups.critical, ...groups.high]);
        outputLowSeveritySummary([...groups.medium, ...groups.low]);
      }
    }

    // Determine exit code
    const exitCode = determineExitCode(groups, isBlocking);
    if (exitCode === 1 && !isQuiet) {
      console.log("🛑 Blocking due to CRITICAL/HIGH severity issues");
    }
    process.exitCode = exitCode;
  } catch (err) {
    if (!isQuiet) {
      console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exitCode = 2;
  }
}

main();
