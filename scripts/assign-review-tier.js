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

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
    conditional: [
      { pattern: /^package-lock\.json$/, requires_unchanged: ['package.json'] }
    ],
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
    reason: 'Code injection risk (eval usage)',
  },
  {
    pattern: /dangerouslySetInnerHTML/,
    escalate_to: 3,
    reason: 'XSS risk (dangerouslySetInnerHTML)',
  },
  {
    pattern: /firebase\.auth\(\)/,
    escalate_to: 3,
    reason: 'Auth flow modification',
  },
  {
    pattern: /admin\.firestore\(\)/,
    escalate_to: 3,
    reason: 'Direct Firestore admin access',
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

// Forbidden patterns (block merge)
const FORBIDDEN_PATTERNS = [
  {
    pattern: /sk_live_[A-Za-z0-9]+/,
    reason: 'Hardcoded API key detected',
  },
  {
    pattern: /sk_test_[A-Za-z0-9]+/,
    reason: 'Hardcoded test API key detected',
  },
  {
    pattern: /password\s*=\s*["'][^"']+["']/,
    reason: 'Hardcoded password detected',
  },
  {
    pattern: /^\.env$/,
    reason: '.env file should not be committed',
  },
];

/**
 * Assign tier based on file path
 */
function assignTierByPath(filePath) {
  // Check Tier 4 first (highest priority)
  if (TIER_RULES.tier_4.patterns.some(p => p.test(filePath))) {
    return { tier: 4, reason: `Critical file: ${filePath}` };
  }

  // Tier 3
  if (TIER_RULES.tier_3.patterns.some(p => p.test(filePath))) {
    return { tier: 3, reason: `Security-sensitive file: ${filePath}` };
  }

  // Tier 2
  if (TIER_RULES.tier_2.patterns.some(p => p.test(filePath))) {
    return { tier: 2, reason: `Standard code file: ${filePath}` };
  }

  // Tier 1
  if (TIER_RULES.tier_1.patterns.some(p => p.test(filePath))) {
    return { tier: 1, reason: `Documentation/test file: ${filePath}` };
  }

  // Tier 0
  if (TIER_RULES.tier_0.patterns.some(p => p.test(filePath))) {
    return { tier: 0, reason: `Low-risk file: ${filePath}` };
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

  for (const forbidden of FORBIDDEN_PATTERNS) {
    if (forbidden.pattern.test(content) || forbidden.pattern.test(filePath)) {
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
 * Main tier assignment logic
 */
function assignReviewTier(files, options = {}) {
  let highestTier = 0;
  let reasons = [];
  let escalations = [];
  let violations = [];

  for (const file of files) {
    // Assign tier by path
    const pathTier = assignTierByPath(file);
    if (pathTier.tier > highestTier) {
      highestTier = pathTier.tier;
      reasons.push(pathTier.reason);
    }

    // Check file content if it exists
    if (existsSync(file)) {
      try {
        const content = readFileSync(file, 'utf-8');

        // Check for escalation triggers
        const fileEscalations = checkEscalationTriggers(file, content);
        escalations.push(...fileEscalations);

        // Apply escalations
        for (const esc of fileEscalations) {
          if (esc.escalate_to === 'BLOCK') {
            violations.push({
              pattern: esc.trigger,
              reason: esc.reason,
              file: esc.file,
            });
          } else if (typeof esc.escalate_to === 'number' && esc.escalate_to > highestTier) {
            highestTier = esc.escalate_to;
            reasons.push(`Escalated to Tier ${esc.escalate_to}: ${esc.reason}`);
          }
        }

        // Check for forbidden patterns
        const fileViolations = checkForbiddenPatterns(file, content);
        violations.push(...fileViolations);

      } catch (error) {
        // File might be binary or unreadable, skip content checks
        console.error(`Warning: Could not read ${file}: ${error.message}`);
      }
    }
  }

  return {
    tier: highestTier,
    reasons,
    escalations,
    violations,
    blocked: violations.length > 0,
  };
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: assign-review-tier.js [files...]');
    console.error('       assign-review-tier.js --pr <PR_NUMBER>');
    process.exit(1);
  }

  // For now, just handle file arguments
  // TODO: Add --pr flag support (fetch changed files from GitHub API)
  const files = args.filter(arg => !arg.startsWith('--'));

  if (files.length === 0) {
    console.error('Error: No files specified');
    process.exit(1);
  }

  const result = assignReviewTier(files);

  // Output JSON result
  console.log(JSON.stringify(result, null, 2));

  // Exit with error if blocked
  if (result.blocked) {
    console.error('\n❌ MERGE BLOCKED: Forbidden patterns detected');
    process.exit(1);
  }

  // Exit successfully
  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { assignReviewTier, assignTierByPath, checkEscalationTriggers, checkForbiddenPatterns };
