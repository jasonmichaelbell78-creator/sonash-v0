#!/usr/bin/env node

/**
 * Review Tier Assignment Script
 *
 * Automatically assigns review tier based on:
 * - File paths changed
 * - Content patterns (escalation triggers)
 * - Commit message patterns
 *
 * Usage:
 *   node scripts/assign-review-tier.js [files...]
 *   node scripts/assign-review-tier.js --pr <PR_NUMBER>
 *
 * Output:
 *   JSON: { tier: 0-4, reason: string, escalations: string[] }
 *   Exit code: 0 (success)
 */

import { readFileSync, existsSync, realpathSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Sanitize file paths in error messages to avoid exposing absolute paths
 */
function sanitizePath(filePath) {
  return (
    String(filePath)
      .replace(/\/home\/[^/\s]+/g, "[HOME]")
      .replace(/\/Users\/[^/\s]+/g, "[HOME]")
      // Handle any Windows drive letter, case-insensitive
      .replace(/[A-Z]:\\Users\\[^\\]+/gi, "[HOME]")
  );
}

/**
 * Normalize path separators for cross-platform regex matching
 */
function normalizePath(filePath) {
  return String(filePath).replace(/\\/g, "/");
}

// Tier classification rules
const TIER_RULES = {
  // Tier 0: Exempt (auto-merge eligible)
  tier_0: {
    patterns: [
      /^docs\/archive\//,
      /\.log$/,
      /^\.vscode\//,
      /^\.github\/PULL_REQUEST_TEMPLATE\.md$/,
    ],
    // Only Tier 0 if package.json unchanged
    conditional: [{ pattern: /^package-lock\.json$/, requires_unchanged: ["package.json"] }],
  },

  // Tier 1: Light (AI review only)
  tier_1: {
    patterns: [
      /^docs\/(?!ROADMAP|README|DOCUMENTATION_STANDARDS|GLOBAL_SECURITY_STANDARDS|TRIGGERS).*\.md$/,
      /\.test\.(ts|tsx)$/,
      /\.spec\.(ts|tsx)$/,
      /\.stories\.tsx$/,
      /^public\/locales\/.*\.json$/,
      /^styles\/.*\.css$/,
    ],
  },

  // Tier 2: Standard (AI + human review)
  tier_2: {
    patterns: [
      /^app\/.*\.(ts|tsx)$/,
      /^components\/.*\.tsx$/,
      /^lib\/(?!firebase-config|rate-limiter).*\.ts$/,
      /^hooks\/.*\.ts$/,
      /^context\/.*\.tsx$/,
      /^functions\/src\/(?!auth|security).*\.ts$/,
    ],
  },

  // Tier 3: Heavy (multi-human + checklist)
  tier_3: {
    patterns: [
      /^functions\/src\/auth\//,
      /^functions\/src\/security\//,
      /^lib\/rate-limiter\.ts$/,
      /^middleware\/.*\.ts$/,
      /^firestore\.rules$/,
      /^storage\.rules$/,
      /^\.env\.example$/,
    ],
  },

  // Tier 4: Critical (RFC + all-hands)
  tier_4: {
    patterns: [
      /^\.github\/workflows\//,
      /^firebase\.json$/,
      /^\.firebaserc$/,
      /^package\.json$/,
      /^tsconfig\.json$/,
      /^next\.config\.(js|mjs)$/,
      /^firestore\.indexes\.json$/,
      /^lib\/firebase-config\.ts$/,
    ],
  },
};

// Content-based escalation triggers
const ESCALATION_TRIGGERS = [
  {
    pattern: /\beval\s*\(/,
    escalate_to: 4,
    reason: "Code injection risk (eval usage)",
  },
  {
    pattern: /dangerouslySetInnerHTML/,
    escalate_to: 3,
    reason: "XSS risk (dangerouslySetInnerHTML)",
  },
  {
    pattern: /firebase\.auth\(\)/,
    escalate_to: 3,
    reason: "Auth flow modification",
  },
  {
    pattern: /admin\.firestore\(\)/,
    escalate_to: 3,
    reason: "Direct Firestore admin access",
  },
  {
    pattern: /BREAKING CHANGE:/,
    escalate_to: 3,
    reason: "Breaking change declared in commit",
  },
  {
    pattern: /TODO:\s*SECURITY/i,
    escalate_to: "BLOCK",
    reason: "Incomplete security work",
  },
];

// Forbidden patterns (block merge)
// checkContent: true = pattern should match file content
// checkPath: true = pattern should match file path
const FORBIDDEN_PATTERNS = [
  {
    pattern: /sk_live_[A-Za-z0-9]+/,
    reason: "Hardcoded API key detected",
    checkContent: true,
  },
  {
    pattern: /sk_test_[A-Za-z0-9]+/,
    reason: "Hardcoded test API key detected",
    checkContent: true,
  },
  {
    pattern: /password\s*=\s*["'][^"']+["']/,
    reason: "Hardcoded password detected",
    checkContent: true,
  },
  {
    // Matches .env, .env.local, .env.production, etc. (limited extension length for safety)
    // eslint-disable-next-line security/detect-unsafe-regex -- validated: bounded quantifier, no catastrophic backtracking
    pattern: /(^|[/\\])\.env(\.[a-zA-Z0-9_-]{1,30})*$/,
    reason:
      ".env file (or variant like .env.local, .env.development.local) should not be committed",
    checkPath: true, // Path-only check
  },
];

/**
 * Assign tier based on file path
 * @param {string} filePath - The file path to classify
 * @param {string[]} allFiles - All changed files (for conditional checks)
 */
function assignTierByPath(filePath, allFiles = []) {
  // Normalize path for cross-platform regex matching
  const normalizedPath = normalizePath(filePath);

  // Check Tier 4 first (highest priority)
  if (TIER_RULES.tier_4.patterns.some((p) => p.test(normalizedPath))) {
    return { tier: 4, reason: `Critical file: ${filePath}` };
  }

  // Tier 3
  if (TIER_RULES.tier_3.patterns.some((p) => p.test(normalizedPath))) {
    return { tier: 3, reason: `Security-sensitive file: ${filePath}` };
  }

  // Tier 2
  if (TIER_RULES.tier_2.patterns.some((p) => p.test(normalizedPath))) {
    return { tier: 2, reason: `Standard code file: ${filePath}` };
  }

  // Tier 1
  if (TIER_RULES.tier_1.patterns.some((p) => p.test(normalizedPath))) {
    return { tier: 1, reason: `Documentation/test file: ${filePath}` };
  }

  // Tier 0 - check both patterns and conditional rules
  if (TIER_RULES.tier_0.patterns.some((p) => p.test(normalizedPath))) {
    return { tier: 0, reason: `Low-risk file: ${filePath}` };
  }

  // Check conditional tier 0 rules (e.g., package-lock.json only if package.json unchanged)
  if (TIER_RULES.tier_0.conditional) {
    for (const rule of TIER_RULES.tier_0.conditional) {
      if (rule.pattern.test(normalizedPath)) {
        // Check if required files are unchanged (not in allFiles)
        const requiredUnchanged = rule.requires_unchanged || [];
        const allUnchanged = requiredUnchanged.every((req) => !allFiles.includes(req));
        if (allUnchanged) {
          return { tier: 0, reason: `Low-risk file (conditional): ${filePath}` };
        } else {
          // If conditional not met, escalate to Tier 2 (standard review)
          return {
            tier: 2,
            reason: `${filePath} changed with ${requiredUnchanged.join(", ")} - requires standard review`,
          };
        }
      }
    }
  }

  // Default to Tier 2 for unknown files
  return { tier: 2, reason: `Unknown file type (defaulting to standard review): ${filePath}` };
}

/**
 * Check for content-based escalation triggers
 */
function checkEscalationTriggers(filePath, content) {
  const escalations = [];

  for (const trigger of ESCALATION_TRIGGERS) {
    if (trigger.pattern.test(content)) {
      escalations.push({
        trigger: trigger.pattern.toString(),
        escalate_to: trigger.escalate_to,
        reason: trigger.reason,
        file: filePath,
      });
    }
  }

  return escalations;
}

/**
 * Check for forbidden patterns
 */
function checkForbiddenPatterns(filePath, content) {
  const violations = [];
  const normalizedPath = normalizePath(filePath);

  for (const forbidden of FORBIDDEN_PATTERNS) {
    const matchesContent = forbidden.checkContent && forbidden.pattern.test(content);
    const matchesPath = forbidden.checkPath && forbidden.pattern.test(normalizedPath);
    if (matchesContent || matchesPath) {
      violations.push({
        pattern: forbidden.pattern.toString(),
        reason: forbidden.reason,
        file: filePath,
      });
    }
  }

  return violations;
}

/**
 * Check if a file path is safely contained within project root
 * Prevents path traversal attacks when reading files from CLI args
 */
function isPathContained(filePath, projectRoot) {
  try {
    const resolvedPath = resolve(projectRoot, filePath);
    const rel = relative(projectRoot, resolvedPath);
    // Path is contained if:
    // 1. Not empty (exact root match)
    // 2. Doesn't start with '..' (traversal)
    // 3. Isn't absolute (Windows edge case)
    return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
  } catch {
    return false;
  }
}

/**
 * Validate symlink stays within project root (prevents symlink escape attacks)
 * @returns {{ valid: boolean, realPath?: string, warning?: string }}
 */
function validateSymlink(resolvedFile, projectRoot) {
  try {
    const realProjectRoot = realpathSync(projectRoot);
    const realResolvedFile = realpathSync(resolvedFile);
    const realRel = relative(realProjectRoot, realResolvedFile);

    if (realRel === "" || realRel.startsWith("..") || isAbsolute(realRel)) {
      return { valid: false, warning: "Skipping symlinked file outside project root" };
    }

    return { valid: true, realPath: realResolvedFile };
  } catch (error) {
    const errorMsg =
      error && typeof error === "object" && "message" in error ? error.message : String(error);
    return { valid: false, warning: `Could not resolve real path: ${sanitizePath(errorMsg)}` };
  }
}

/**
 * Process file content for escalations and violations
 * @returns {{ escalations: Array, violations: Array, warning?: string }}
 */
function processFileContent(file, realResolvedFile) {
  const result = { escalations: [], violations: [], warning: null };

  try {
    const content = readFileSync(realResolvedFile, "utf-8");

    // Check for escalation triggers
    result.escalations = checkEscalationTriggers(file, content);

    // Check for forbidden patterns
    result.violations = checkForbiddenPatterns(file, content);
  } catch (error) {
    const errorMsg =
      error && typeof error === "object" && "message" in error ? error.message : String(error);
    result.warning = `Could not read file: ${sanitizePath(errorMsg)}`;
  }

  return result;
}

/**
 * Update tier tracking based on a new file's tier
 * @returns {{ tier: number, reasons: string[] }}
 */
function updateTierTracking(currentTier, currentReasons, newTier, newReason) {
  if (newTier > currentTier) {
    return { tier: newTier, reasons: newReason ? [newReason] : [] };
  }
  if (newTier === currentTier && newReason) {
    return { tier: currentTier, reasons: [...currentReasons, newReason] };
  }
  return { tier: currentTier, reasons: currentReasons };
}

/**
 * Main tier assignment logic
 */
function assignReviewTier(files, options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  let highestTier = 0;
  let reasons = [];
  const escalations = [];
  const violations = [];
  const warnings = [];

  for (const file of files) {
    // SECURITY: Skip files outside project root (path traversal protection)
    if (!isPathContained(file, projectRoot)) {
      warnings.push(`Skipping file outside project root: ${sanitizePath(file)}`);
      continue;
    }

    // Resolve the path once for all file operations (prevents TOCTOU vulnerabilities)
    const resolvedFile = resolve(projectRoot, file);

    // SECURITY: Validate symlinks stay within project root
    let realResolvedFile = resolvedFile;
    if (existsSync(resolvedFile)) {
      const symlinkResult = validateSymlink(resolvedFile, projectRoot);
      if (!symlinkResult.valid) {
        warnings.push(`${symlinkResult.warning}: ${sanitizePath(file)}`);
        continue;
      }
      realResolvedFile = symlinkResult.realPath;
    }

    // Assign tier by path and update tracking
    const pathTier = assignTierByPath(file, files);
    const tierUpdate = updateTierTracking(highestTier, reasons, pathTier.tier, pathTier.reason);
    highestTier = tierUpdate.tier;
    reasons = tierUpdate.reasons;

    // Check file content if it exists
    if (existsSync(realResolvedFile)) {
      const contentResult = processFileContent(file, realResolvedFile);

      if (contentResult.warning) {
        warnings.push(contentResult.warning);
      }

      // Collect escalations and apply tier escalations
      escalations.push(...contentResult.escalations);
      for (const esc of contentResult.escalations) {
        if (esc.escalate_to === "BLOCK") {
          violations.push({ pattern: esc.trigger, reason: esc.reason, file: esc.file });
        } else if (typeof esc.escalate_to === "number" && esc.escalate_to > highestTier) {
          highestTier = esc.escalate_to;
          reasons.push(`Escalated to Tier ${esc.escalate_to}: ${esc.reason}`);
        }
      }

      // Collect violations
      violations.push(...contentResult.violations);
    }
  }

  return {
    tier: highestTier,
    reasons,
    escalations,
    violations,
    warnings,
    blocked: violations.length > 0,
  };
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: assign-review-tier.js [files...]");
    console.error("       assign-review-tier.js --pr <PR_NUMBER>");
    process.exit(1);
  }

  // Check for --pr flag (not yet implemented)
  const prIndex = args.indexOf("--pr");
  if (prIndex !== -1) {
    console.error("Error: --pr flag is not yet implemented");
    console.error("Please specify files directly: assign-review-tier.js [files...]");
    process.exit(1);
  }

  // Check for unknown flags (reject early rather than silently ignoring)
  const knownFlags = ["--pr"];
  for (const arg of args) {
    if (arg.startsWith("--") && !knownFlags.includes(arg.split("=")[0])) {
      console.error(`Error: Unknown flag "${arg}"`);
      console.error("Usage: assign-review-tier.js [files...]");
      console.error("       assign-review-tier.js --pr <PR_NUMBER>");
      process.exit(1);
    }
  }

  // Filter out flags and their values explicitly
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--pr") {
      i++; // Skip the value too
    } else if (!args[i].startsWith("--")) {
      files.push(args[i]);
    }
  }

  if (files.length === 0) {
    console.error("Error: No files specified");
    process.exit(1);
  }

  const result = assignReviewTier(files);

  // Output JSON result
  console.log(JSON.stringify(result, null, 2));

  // Exit with error if blocked
  if (result.blocked) {
    console.error("\n❌ MERGE BLOCKED: Forbidden patterns detected");
    process.exit(1);
  }

  // Exit successfully
  process.exit(0);
}

// Run if called directly (cross-platform: pathToFileURL handles Windows paths)
// Wrap in try-catch for robust handling of edge cases (relative paths, symlinks, etc.)
let isMainModule = false;
try {
  isMainModule =
    !!process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
} catch {
  isMainModule = false;
}

if (isMainModule) {
  main();
}

export { assignReviewTier, assignTierByPath, checkEscalationTriggers, checkForbiddenPatterns };
