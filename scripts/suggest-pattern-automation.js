#!/usr/bin/env node
/**
 * Pattern Automation Suggester
 *
 * Analyzes AI_REVIEW_LEARNINGS_LOG.md to find patterns that could be automated
 * in check-pattern-compliance.js but aren't yet.
 *
 * Usage: node scripts/suggest-pattern-automation.js [--add-to-checker]
 *
 * This closes the learning loop by:
 * 1. Finding "Wrong:" code examples in learnings
 * 2. Checking if they're already in the pattern checker
 * 3. Suggesting regex patterns for ones that aren't
 * 4. Optionally adding them to check-pattern-compliance.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const LEARNINGS_FILE = join(ROOT, 'AI_REVIEW_LEARNINGS_LOG.md');
const CHECKER_FILE = join(ROOT, 'scripts/check-pattern-compliance.js');

// Patterns we can extract and potentially automate
const EXTRACTABLE_PATTERNS = [
  {
    // "Wrong: `code`" or "- Wrong: `code`"
    regex: /(?:Wrong|Bad|INCORRECT|Anti-pattern):\s*`([^`]+)`/gi,
    type: 'wrong_code'
  },
  {
    // "Example: `code`" in negative context
    regex: /Example:\s*`([^`]+)`(?=.*(?:fails|breaks|crashes|bug|issue|problem))/gi,
    type: 'example_negative'
  },
  {
    // Code blocks after "Wrong:" headers
    regex: /#+\s*(?:Wrong|Bad|INCORRECT)[^\n]*\n```[\w]*\n([\s\S]*?)```/gi,
    type: 'wrong_block'
  }
];

// Known pattern categories that are automatable
const AUTOMATABLE_CATEGORIES = {
  'shell': {
    indicators: ['bash', 'shell', 'sh', '\\$\\?', 'exit code', 'for\\s+\\w+\\s+in', 'while.*read'],
    fileTypes: ['.sh', '.yml', '.yaml']
  },
  'javascript': {
    indicators: ['catch', 'error\\.message', 'instanceof', 'console\\.error', '\\.then', '\\.catch'],
    fileTypes: ['.js', '.ts', '.tsx', '.jsx']
  },
  'github_actions': {
    indicators: ['steps\\.', 'github\\.', '\\$\\{\\{', 'if:', 'workflow', 'actions'],
    fileTypes: ['.yml', '.yaml']
  },
  'security': {
    indicators: ['path', 'traversal', 'injection', 'sanitize', 'validate', 'unlink', 'exec'],
    fileTypes: ['.js', '.ts', '.sh']
  }
};

/**
 * Extract code patterns from learnings file
 */
function extractPatternsFromLearnings() {
  const content = readFileSync(LEARNINGS_FILE, 'utf-8');
  const extracted = [];

  // Find review sections
  const reviewSections = content.split(/####\s+Review\s+#\d+/i);

  for (const section of reviewSections) {
    if (!section.trim()) continue;

    // Extract "Wrong:" patterns
    for (const { regex, type } of EXTRACTABLE_PATTERNS) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(section)) !== null) {
        const code = match[1].trim();
        if (code.length > 10 && code.length < 200) { // Reasonable length
          extracted.push({
            code,
            type,
            context: section.slice(Math.max(0, match.index - 100), match.index + match[0].length + 100)
          });
        }
      }
    }
  }

  return extracted;
}

/**
 * Get existing patterns from checker
 */
function getExistingPatterns() {
  const content = readFileSync(CHECKER_FILE, 'utf-8');
  const patterns = [];

  // Extract pattern IDs and regexes
  const patternRegex = /id:\s*['"`]([^'"`]+)['"`][\s\S]*?pattern:\s*\/([^/]+)\/[gim]*/g;
  let match;
  while ((match = patternRegex.exec(content)) !== null) {
    patterns.push({
      id: match[1],
      pattern: match[2]
    });
  }

  return patterns;
}

/**
 * Check if a code snippet is already covered by existing patterns
 */
function isAlreadyCovered(code, existingPatterns) {
  for (const { pattern } of existingPatterns) {
    try {
      const regex = new RegExp(pattern, 'gi');
      if (regex.test(code)) {
        return true;
      }
    } catch {
      // Invalid regex, skip
    }
  }
  return false;
}

/**
 * Categorize a code pattern
 */
function categorizePattern(code, context) {
  for (const [category, { indicators }] of Object.entries(AUTOMATABLE_CATEGORIES)) {
    for (const indicator of indicators) {
      const indicatorRegex = new RegExp(indicator, 'i');
      if (indicatorRegex.test(code) || indicatorRegex.test(context)) {
        return category;
      }
    }
  }
  return 'unknown';
}

/**
 * Suggest a regex pattern for a code snippet
 * Returns a simplified pattern - human review required
 */
function suggestRegex(code, _category) {
  // Extract the key identifiable part of the pattern
  // Don't try to be too clever - let humans refine it

  // For common anti-patterns, suggest known good patterns
  const knownPatterns = {
    'pipe.*while': 'cmd \\| while.*done(?!.*< <)',
    '$?': '\\$\\(.*\\)\\s*;\\s*if\\s+\\[\\s*\\$\\?',
    'for.*in.*do': 'for\\s+\\w+\\s+in\\s+\\$',
    'startsWith': '\\.startsWith\\s*\\(',
    '.message': '\\.message(?![^}]*instanceof)',
    'console.error': '\\.catch\\s*\\(\\s*console\\.error',
    'user.type': '\\.user\\.type\\s*===',
  };

  for (const [key, pattern] of Object.entries(knownPatterns)) {
    if (code.includes(key) || code.toLowerCase().includes(key.toLowerCase())) {
      return pattern;
    }
  }

  // Fallback: return escaped literal (needs human review)
  return code.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '...';
}

/**
 * Generate a pattern entry for the checker
 */
function generatePatternEntry(code, category, context) {
  const id = `auto-suggested-${Date.now()}`;
  const regex = suggestRegex(code, category);
  const fileTypes = AUTOMATABLE_CATEGORIES[category]?.fileTypes || ['.js', '.ts'];

  // Try to extract review number from context
  const reviewMatch = context.match(/Review\s+#(\d+)/i);
  const review = reviewMatch ? `#${reviewMatch[1]}` : 'auto-detected';

  return {
    id,
    pattern: regex,
    message: `Potential anti-pattern detected (auto-suggested from learnings)`,
    fix: 'See AI_REVIEW_LEARNINGS_LOG.md for the correct pattern',
    review,
    fileTypes,
    originalCode: code
  };
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const addToChecker = args.includes('--add-to-checker');

  console.log('🔍 Analyzing AI_REVIEW_LEARNINGS_LOG.md for automatable patterns...\n');

  // Extract patterns from learnings
  const extracted = extractPatternsFromLearnings();
  console.log(`Found ${extracted.length} code examples in learnings\n`);

  // Get existing patterns
  const existing = getExistingPatterns();
  console.log(`Pattern checker has ${existing.length} existing patterns\n`);

  // Find patterns that aren't covered
  const uncovered = [];
  for (const item of extracted) {
    if (!isAlreadyCovered(item.code, existing)) {
      const category = categorizePattern(item.code, item.context);
      if (category !== 'unknown') {
        uncovered.push({
          ...item,
          category,
          suggested: generatePatternEntry(item.code, category, item.context)
        });
      }
    }
  }

  if (uncovered.length === 0) {
    console.log('✅ All extractable patterns are already covered by the checker!');
    console.log('\nNote: Some patterns require human judgment and cannot be automated.');
    return;
  }

  console.log(`⚠️  Found ${uncovered.length} pattern(s) that could potentially be automated:\n`);

  for (let i = 0; i < uncovered.length; i++) {
    const { code, category, suggested } = uncovered[i];
    console.log(`${i + 1}. Category: ${category}`);
    console.log(`   Code: ${code.slice(0, 60)}${code.length > 60 ? '...' : ''}`);
    console.log(`   Suggested regex: /${suggested.pattern.slice(0, 50)}${suggested.pattern.length > 50 ? '...' : ''}/`);
    console.log(`   File types: ${suggested.fileTypes.join(', ')}`);
    console.log('');
  }

  console.log('---');
  console.log('To add these to the pattern checker:');
  console.log('1. Review each suggestion for accuracy');
  console.log('2. Adjust the regex as needed');
  console.log('3. Add to scripts/check-pattern-compliance.js');
  console.log('\nOr run with --add-to-checker to append suggestions (requires manual review)');

  if (addToChecker) {
    console.log('\n⚠️  --add-to-checker not fully implemented yet.');
    console.log('Suggestions saved to: scripts/suggested-patterns.json');

    writeFileSync(
      join(__dirname, 'suggested-patterns.json'),
      JSON.stringify(uncovered.map(u => u.suggested), null, 2)
    );
  }
}

main();
