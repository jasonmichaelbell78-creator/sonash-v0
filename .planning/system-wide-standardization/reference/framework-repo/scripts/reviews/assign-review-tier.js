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
 *   node scripts/reviews/assign-review-tier.js [files...]
 *   node scripts/reviews/assign-review-tier.js --pr <PR_NUMBER>
 *
 * Output:
 *   JSON: { tier: 0-4, reason: string, escalations: string[] }
 *   Exit code: 0 (success)
 *
 * Tier rules are configurable - modify TIER_RULES and ESCALATION_TRIGGERS
 * to match your project structure.
 */

const { readFileSync, existsSync, realpathSync } = require('node:fs');
const { resolve, relative, isAbsolute } = require('node:path');

function sanitizePath(filePath) {
  return String(filePath)
    .replace(/\/home\/[^/\s]+/g, '[HOME]')
    .replace(/\/Users\/[^/\s]+/g, '[HOME]')
    .replace(/[A-Z]:\\Users\\[^\\]+/gi, '[HOME]');
}

function normalizePath(filePath) {
  return String(filePath).replace(/\\/g, '/');
}

// Tier classification rules - CONFIGURABLE per project
const TIER_RULES = {
  // Tier 0: Exempt (auto-merge eligible)
  tier_0: {
    patterns: [
      /^docs\/archive\//,
      /\.log$/,
      /^\.vscode\//,
      /^\.github\/PULL_REQUEST_TEMPLATE\.md$/,
    ],
    conditional: [{ pattern: /^package-lock\.json$/, requires_unchanged: ['package.json'] }],
  },

  // Tier 1: Light (AI review only)
  tier_1: {
    patterns: [
      /^docs\/(?!ROADMAP|README|SECURITY|STANDARDS).*\.md$/,
      /\.test\.(ts|tsx|js|jsx)$/,
      /\.spec\.(ts|tsx|js|jsx)$/,
      /\.stories\.tsx$/,
      /^public\/locales\/.*\.json$/,
      /^styles\/.*\.css$/,
    ],
  },

  // Tier 2: Standard (AI + human review)
  tier_2: {
    patterns: [
      /^(?:app|src)\/.*\.(ts|tsx)$/,
      /^components\/.*\.tsx$/,
      /^lib\/(?!rate-limiter).*\.ts$/,
      /^hooks\/.*\.ts$/,
      /^context\/.*\.tsx$/,
    ],
  },

  // Tier 3: Heavy (multi-human + checklist)
  tier_3: {
    patterns: [
      /^(?:src|lib)\/auth\//,
      /^(?:src|lib)\/security\//,
      /^lib\/rate-limiter\.ts$/,
      /^middleware\/.*\.ts$/,
      /^\.env\.example$/,
    ],
  },

  // Tier 4: Critical (RFC + all-hands)
  tier_4: {
    patterns: [/^\.github\/workflows\//, /^package\.json$/, /^tsconfig\.json$/],
  },
};

// Content-based escalation triggers - CONFIGURABLE
const ESCALATION_TRIGGERS = [
  {
    pattern: /\beval\s*\(/,
    escalate_to: 4,
    reason: 'Code injection risk (eval usage)',
  },
  {
    pattern: /dangerouslySetInnerHTML/,
    escalate_to: 3,
    reason: 'XSS risk (dangerouslySetInnerHTML)',
  },
  {
    pattern: /BREAKING CHANGE:/,
    escalate_to: 3,
    reason: 'Breaking change declared in commit',
  },
  {
    pattern: /TODO:\s*SECURITY/i,
    escalate_to: 'BLOCK',
    reason: 'Incomplete security work',
  },
];

// Forbidden patterns (block merge) - CONFIGURABLE
const FORBIDDEN_PATTERNS = [
  {
    pattern: /sk_live_[A-Za-z0-9]+/,
    reason: 'Hardcoded API key detected',
    checkContent: true,
  },
  {
    pattern: /sk_test_[A-Za-z0-9]+/,
    reason: 'Hardcoded test API key detected',
    checkContent: true,
  },
  {
    pattern: /password\s*=\s*["'][^"']+["']/,
    reason: 'Hardcoded password detected',
    checkContent: true,
  },
  {
    pattern: /(^|[/\\])\.env(\.[a-zA-Z0-9_-]{1,30})*$/,
    reason: '.env file (or variant like .env.local) should not be committed',
    checkPath: true,
  },
];

function assignTierByPath(filePath, allFiles = []) {
  const normalizedPath = normalizePath(filePath);

  if (TIER_RULES.tier_4.patterns.some((p) => p.test(normalizedPath))) {
    return { tier: 4, reason: `Critical file: ${filePath}` };
  }

  if (TIER_RULES.tier_3.patterns.some((p) => p.test(normalizedPath))) {
    return { tier: 3, reason: `Security-sensitive file: ${filePath}` };
  }

  if (TIER_RULES.tier_2.patterns.some((p) => p.test(normalizedPath))) {
    return { tier: 2, reason: `Standard code file: ${filePath}` };
  }

  if (TIER_RULES.tier_1.patterns.some((p) => p.test(normalizedPath))) {
    return { tier: 1, reason: `Documentation/test file: ${filePath}` };
  }

  if (TIER_RULES.tier_0.patterns.some((p) => p.test(normalizedPath))) {
    return { tier: 0, reason: `Low-risk file: ${filePath}` };
  }

  if (TIER_RULES.tier_0.conditional) {
    for (const rule of TIER_RULES.tier_0.conditional) {
      if (rule.pattern.test(normalizedPath)) {
        const requiredUnchanged = rule.requires_unchanged || [];
        const allUnchanged = requiredUnchanged.every((req) => !allFiles.includes(req));
        if (allUnchanged) {
          return { tier: 0, reason: `Low-risk file (conditional): ${filePath}` };
        } else {
          return {
            tier: 2,
            reason: `${filePath} changed with ${requiredUnchanged.join(', ')} - requires standard review`,
          };
        }
      }
    }
  }

  return { tier: 2, reason: `Unknown file type (defaulting to standard review): ${filePath}` };
}

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

function isPathContained(filePath, projectRoot) {
  try {
    const resolvedPath = resolve(projectRoot, filePath);
    const rel = relative(projectRoot, resolvedPath);
    // eslint-disable-next-line framework/no-path-startswith, framework/no-empty-path-check -- safe: rel is from path.relative(); empty means same dir
    return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
  } catch {
    return false;
  }
}

function validateSymlink(resolvedFile, projectRoot) {
  try {
    const realProjectRoot = realpathSync(projectRoot);
    const realResolvedFile = realpathSync(resolvedFile);
    const realRel = relative(realProjectRoot, realResolvedFile);

    // eslint-disable-next-line framework/no-path-startswith -- safe: comparing against known constant prefix
    if (realRel === '' || realRel.startsWith('..') || isAbsolute(realRel)) {
      return { valid: false, warning: 'Skipping symlinked file outside project root' };
    }

    return { valid: true, realPath: realResolvedFile };
  } catch (error) {
    const errorMsg =
      error && typeof error === 'object' && 'message' in error
        ? error instanceof Error
          ? error.message // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
          : String(error)
        : String(error);
    return { valid: false, warning: `Could not resolve real path: ${sanitizePath(errorMsg)}` };
  }
}

function processFileContent(file, realResolvedFile) {
  const result = { escalations: [], violations: [], warning: null };

  try {
    const content = readFileSync(realResolvedFile, 'utf-8');
    result.escalations = checkEscalationTriggers(file, content);
    result.violations = checkForbiddenPatterns(file, content);
  } catch (error) {
    const errorMsg =
      error && typeof error === 'object' && 'message' in error
        ? error instanceof Error
          ? error.message // eslint-disable-line framework/no-unsafe-error-access -- safe: instanceof guard is in conditional expression
          : String(error)
        : String(error);
    result.warning = `Could not read file: ${sanitizePath(errorMsg)}`;
  }

  return result;
}

function updateTierTracking(currentTier, currentReasons, newTier, newReason) {
  if (newTier > currentTier) {
    return { tier: newTier, reasons: newReason ? [newReason] : [] };
  }
  if (newTier === currentTier && newReason) {
    return { tier: currentTier, reasons: [...currentReasons, newReason] };
  }
  return { tier: currentTier, reasons: currentReasons };
}

function assignReviewTier(files, options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  let highestTier = 0;
  let reasons = [];
  const escalations = [];
  const violations = [];
  const warnings = [];

  for (const file of files) {
    if (!isPathContained(file, projectRoot)) {
      warnings.push(`Skipping file outside project root: ${sanitizePath(file)}`);
      continue;
    }

    const resolvedFile = resolve(projectRoot, file);

    let realResolvedFile = resolvedFile;
    if (existsSync(resolvedFile)) {
      const symlinkResult = validateSymlink(resolvedFile, projectRoot);
      if (!symlinkResult.valid) {
        warnings.push(`${symlinkResult.warning}: ${sanitizePath(file)}`);
        continue;
      }
      realResolvedFile = symlinkResult.realPath;
    }

    const pathTier = assignTierByPath(file, files);
    const tierUpdate = updateTierTracking(highestTier, reasons, pathTier.tier, pathTier.reason);
    highestTier = tierUpdate.tier;
    reasons = tierUpdate.reasons;

    if (existsSync(realResolvedFile)) {
      const contentResult = processFileContent(file, realResolvedFile);

      if (contentResult.warning) {
        warnings.push(contentResult.warning);
      }

      escalations.push(...contentResult.escalations);
      for (const esc of contentResult.escalations) {
        if (esc.escalate_to === 'BLOCK') {
          violations.push({ pattern: esc.trigger, reason: esc.reason, file: esc.file });
        } else if (typeof esc.escalate_to === 'number' && esc.escalate_to > highestTier) {
          highestTier = esc.escalate_to;
          reasons.push(`Escalated to Tier ${esc.escalate_to}: ${esc.reason}`);
        }
      }

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

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: assign-review-tier.js [files...]');
    console.error('       assign-review-tier.js --pr <PR_NUMBER>');
    process.exit(1);
  }

  const prIndex = args.indexOf('--pr');
  if (prIndex !== -1) {
    console.error('Error: --pr flag is not yet implemented');
    process.exit(1);
  }

  const knownFlags = new Set(['--pr']);
  for (const arg of args) {
    if (arg.startsWith('--') && !knownFlags.has(arg.split('=')[0])) {
      console.error(`Error: Unknown flag "${arg}"`);
      process.exit(1);
    }
  }

  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pr' && args[i + 1]) {
      void args[++i];
    } else if (!args[i].startsWith('--')) {
      files.push(args[i]);
    }
  }

  if (files.length === 0) {
    console.error('Error: No files specified');
    process.exit(1);
  }

  const result = assignReviewTier(files);
  console.log(JSON.stringify(result, null, 2));

  if (result.blocked) {
    console.error('\nMERGE BLOCKED: Forbidden patterns detected');
    process.exit(1);
  }

  process.exit(0);
}

let isMainModule = false;
try {
  isMainModule = !!process.argv[1] && resolve(process.argv[1]) === __filename;
} catch {
  isMainModule = false;
}

if (isMainModule) {
  main();
}

module.exports = {
  assignReviewTier,
  assignTierByPath,
  checkEscalationTriggers,
  checkForbiddenPatterns,
};
