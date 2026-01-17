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

  for (const pattern of SECURITY_PATTERNS) {
    // Check file type filter
    if (!pattern.fileTypes.includes(ext)) continue;

    // Check path filter
    if (pattern.pathFilter && !pattern.pathFilter.test(relativePath)) continue;

    // Check exclude patterns
    if (pattern.exclude && pattern.exclude.some((e) => e.test(relativePath))) continue;

    // Reset regex state
    pattern.pattern.lastIndex = 0;

    // Find matches
    let match;
    const lines = content.split("\n");

    // Re-create regex to avoid state issues
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);

    while ((match = regex.exec(content)) !== null) {
      // Find line number
      const beforeMatch = content.slice(0, match.index);
      const lineNum = beforeMatch.split("\n").length;

      // Get line content (truncated)
      const lineContent = lines[lineNum - 1]?.slice(0, 80) || "";

      violations.push({
        file: relativePath,
        line: lineNum,
        pattern: pattern.id,
        name: pattern.name,
        severity: pattern.severity,
        message: pattern.message,
        snippet: lineContent.trim(),
      });
    }
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
      if (!isQuiet) {
        console.log("✅ No files to check");
      }
      process.exitCode = 0;
      return;
    }

    if (!isQuiet) {
      console.log("🔒 Security Pattern Check");
      console.log("═".repeat(50));
      console.log(`   Checking ${files.length} file(s)`);
      console.log("");
    }

    const allViolations = [];

    for (const file of files) {
      const violations = checkFile(file);
      allViolations.push(...violations);
    }

    // Group by severity
    const critical = allViolations.filter((v) => v.severity === "CRITICAL");
    const high = allViolations.filter((v) => v.severity === "HIGH");
    const medium = allViolations.filter((v) => v.severity === "MEDIUM");
    const low = allViolations.filter((v) => v.severity === "LOW");

    if (!isQuiet) {
      if (allViolations.length === 0) {
        console.log("✅ No security violations found");
      } else {
        console.log(`Found ${allViolations.length} potential issue(s):`);
        console.log(`   CRITICAL: ${critical.length}`);
        console.log(`   HIGH:     ${high.length}`);
        console.log(`   MEDIUM:   ${medium.length}`);
        console.log(`   LOW:      ${low.length}`);
        console.log("");

        // Show details for high+ severity
        const importantViolations = [...critical, ...high];
        if (importantViolations.length > 0) {
          console.log("🛑 HIGH/CRITICAL Issues:");
          for (const v of importantViolations) {
            console.log(`   ${v.file}:${v.line}`);
            console.log(`      [${v.pattern}] ${v.name}`);
            console.log(`      ${v.message}`);
            console.log(`      > ${v.snippet}`);
            console.log("");
          }
        }

        // Show summary for medium/low
        if (medium.length + low.length > 0) {
          console.log("⚠️  MEDIUM/LOW Issues (summary):");
          for (const v of [...medium, ...low]) {
            console.log(`   ${v.file}:${v.line} [${v.pattern}] ${v.name}`);
          }
          console.log("");
        }
      }
    }

    // Determine exit code
    if (allViolations.length === 0) {
      process.exitCode = 0;
    } else if (isBlocking && (critical.length > 0 || high.length > 0)) {
      if (!isQuiet) {
        console.log("🛑 Blocking due to CRITICAL/HIGH severity issues");
      }
      process.exitCode = 1;
    } else {
      process.exitCode = 0; // Non-blocking by default
    }
  } catch (err) {
    if (!isQuiet) {
      console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exitCode = 2;
  }
}

main();
