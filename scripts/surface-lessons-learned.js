#!/usr/bin/env node
/**
 * Surface Lessons Learned - Session Start Helper
 *
 * Searches AI_REVIEW_LEARNINGS_LOG.md for relevant past issues
 * based on current work context (modified files, keywords).
 *
 * Usage:
 *   node scripts/surface-lessons-learned.js                    # Auto-detect from git changes
 *   node scripts/surface-lessons-learned.js --topic firebase   # Search for specific topic
 *   node scripts/surface-lessons-learned.js --topic auth,tests # Multiple topics
 *
 * Exit codes:
 *   0 = Success (lessons may or may not be found)
 *   1 = Error (file not found, etc.)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const LEARNINGS_FILE = 'AI_REVIEW_LEARNINGS_LOG.md';

// Common topic keywords and their aliases
const TOPIC_ALIASES = {
  firebase: ['firebase', 'firestore', 'auth', 'cloud functions', 'app check'],
  auth: ['authentication', 'auth', 'login', 'session', 'jwt', 'oauth'],
  tests: ['test', 'testing', 'jest', 'coverage', 'mock'],
  security: ['security', 'xss', 'injection', 'owasp', 'vulnerability', 'sanitize'],
  hooks: ['hook', 'useEffect', 'useState', 'custom hook'],
  api: ['api', 'endpoint', 'fetch', 'request', 'response'],
  build: ['build', 'compile', 'typescript', 'tsc', 'webpack', 'next.js'],
  lint: ['lint', 'eslint', 'prettier', 'format'],
  ci: ['ci', 'github actions', 'workflow', 'pipeline', 'deploy'],
  docs: ['documentation', 'readme', 'markdown', 'docs'],
  performance: ['performance', 'bundle', 'lazy', 'optimize', 'memory'],
  react: ['react', 'component', 'jsx', 'tsx', 'props', 'state'],
  regex: ['regex', 'regexp', 'pattern', 'match']
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const topicIndex = args.indexOf('--topic');
  let topics = null;

  if (topicIndex !== -1) {
    const nextArg = args[topicIndex + 1];
    // Validate: value exists, not another flag, not empty
    if (!nextArg || nextArg.startsWith('--') || nextArg.trim() === '') {
      console.error('Error: --topic requires a value (comma-separated topics)');
      console.error('Usage: node scripts/surface-lessons-learned.js --topic firebase,auth');
      process.exit(1);
    }
    // Deduplicate topics
    topics = Array.from(new Set(
      nextArg.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
    ));
    if (topics.length === 0) {
      console.error('Error: --topic value cannot be empty');
      process.exit(1);
    }
  }

  return { topics };
}

/**
 * Auto-detect topics from git changes
 * Cross-platform compatible (no shell-specific syntax)
 */
function detectTopicsFromGitChanges() {
  try {
    // Get recently modified files - try HEAD~5 first, fall back to HEAD
    let changedFilesOutput = '';
    try {
      changedFilesOutput = execSync('git diff --name-only HEAD~5', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore']
      });
    } catch {
      // Fall back to diff against HEAD (no commits to compare)
      changedFilesOutput = execSync('git diff --name-only', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore']
      });
    }

    // Also include untracked and staged files from git status
    let statusOutput = '';
    try {
      statusOutput = execSync('git status --porcelain', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore']
      });
    } catch {
      // Ignore errors - continue with diff files only
    }

    const diffFiles = changedFilesOutput.trim().split('\n').filter(Boolean);
    const statusFiles = statusOutput
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        const path = l.slice(3); // drop "XY " prefix
        // Handle renamed files: "R  old -> new" format - extract the new filename
        if (path.includes(' -> ')) {
          return path.split(' -> ')[1];
        }
        return path;
      });

    // Deduplicate using Set
    const changedFiles = Array.from(new Set([...diffFiles, ...statusFiles])).filter(Boolean);

    const detectedTopics = new Set();

    for (const file of changedFiles) {
      const fileLower = file.toLowerCase();

      // Detect topics from file paths
      if (fileLower.includes('firebase') || fileLower.includes('firestore')) detectedTopics.add('firebase');
      if (fileLower.includes('auth')) detectedTopics.add('auth');
      if (fileLower.includes('test')) detectedTopics.add('tests');
      if (fileLower.includes('security')) detectedTopics.add('security');
      if (fileLower.includes('hook')) detectedTopics.add('hooks');
      if (fileLower.includes('api') || fileLower.includes('endpoint')) detectedTopics.add('api');
      if (fileLower.includes('.yml') || fileLower.includes('workflow')) detectedTopics.add('ci');
      if (fileLower.includes('.md') || fileLower.includes('doc')) detectedTopics.add('docs');
    }

    return Array.from(detectedTopics);
  } catch {
    return [];
  }
}

/**
 * Extract lessons from the learnings log file
 */
function extractLessons(content) {
  const lessons = [];

  // Pattern: Review #XX: Title (uses #### headings in AI_REVIEW_LEARNINGS_LOG.md)
  const reviewPattern = /#### Review #(\d+):?\s*(.+?)(?=\n#### Review #|\n## |\n---|$)/gs;
  let match;

  while ((match = reviewPattern.exec(content)) !== null) {
    const reviewNum = match[1];
    const reviewContent = match[2];
    const titleMatch = reviewContent.match(/^([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : 'Unknown';

    // Extract key takeaways or lessons
    const takeawayPatterns = [
      /\*\*(?:Key )?(?:Takeaway|Lesson|Pattern|Fix)\*\*:?\s*([^\n]+)/gi,
      /- \*\*([^*]+)\*\*:?\s*([^\n]+)/gi,
      /(?:✅|❌)\s*([^\n]+)/g
    ];

    const takeaways = [];
    for (const pattern of takeawayPatterns) {
      let takeawayMatch;
      const tempContent = reviewContent;
      pattern.lastIndex = 0;
      while ((takeawayMatch = pattern.exec(tempContent)) !== null) {
        // For patterns with label:value (capture group 2), combine them
        if (takeawayMatch[2]) {
          takeaways.push(`${takeawayMatch[1].trim()}: ${takeawayMatch[2].trim()}`);
        } else {
          takeaways.push((takeawayMatch[1] || takeawayMatch[0]).trim());
        }
      }
    }

    lessons.push({
      reviewNum,
      title,
      content: reviewContent.slice(0, 500),
      takeaways: takeaways.slice(0, 5),
      keywords: extractKeywords(reviewContent)
    });
  }

  return lessons;
}

/**
 * Extract keywords from lesson content
 */
function extractKeywords(content) {
  const keywords = new Set();
  const contentLower = content.toLowerCase();

  for (const [topic, aliases] of Object.entries(TOPIC_ALIASES)) {
    for (const alias of aliases) {
      if (contentLower.includes(alias)) {
        keywords.add(topic);
        break;
      }
    }
  }

  return Array.from(keywords);
}

/**
 * Find relevant lessons for given topics
 */
function findRelevantLessons(lessons, topics) {
  if (!topics || topics.length === 0) {
    return lessons.slice(-5); // Return last 5 if no topics specified
  }

  const expandedTopics = new Set();
  for (const topic of topics) {
    expandedTopics.add(topic);
    // Add aliases - use Object.hasOwn for safe property access
    if (Object.hasOwn(TOPIC_ALIASES, topic)) {
      TOPIC_ALIASES[topic].forEach(alias => expandedTopics.add(alias));
    }
  }

  return lessons.filter(lesson => {
    const lessonKeywords = new Set([...lesson.keywords, ...lesson.content.toLowerCase().split(/\W+/)]);
    for (const topic of expandedTopics) {
      if (lessonKeywords.has(topic) || lesson.content.toLowerCase().includes(topic)) {
        return true;
      }
    }
    return false;
  }).slice(0, 10); // Max 10 relevant lessons
}

/**
 * Format lessons for display
 */
function formatLessons(lessons, _topics) {
  if (lessons.length === 0) {
    return '  📚 No specific lessons found for these topics.\n     Check AI_REVIEW_LEARNINGS_LOG.md for all patterns.';
  }

  let output = '';

  for (const lesson of lessons.slice(0, 5)) {
    output += `\n  📖 Review #${lesson.reviewNum}: ${lesson.title.slice(0, 60)}`;
    if (lesson.title.length > 60) output += '...';
    output += '\n';

    if (lesson.takeaways.length > 0) {
      output += `     Key points:\n`;
      for (const takeaway of lesson.takeaways.slice(0, 2)) {
        output += `       - ${takeaway.slice(0, 80)}${takeaway.length > 80 ? '...' : ''}\n`;
      }
    }
  }

  if (lessons.length > 5) {
    output += `\n  ... and ${lessons.length - 5} more lessons (see AI_REVIEW_LEARNINGS_LOG.md)\n`;
  }

  return output;
}

async function main() {
  console.log('');
  console.log('━━━ LESSONS LEARNED SURFACE ━━━');
  console.log('');

  // Find the learnings file
  const projectRoot = process.cwd();
  const learningsPath = path.join(projectRoot, LEARNINGS_FILE);

  if (!fs.existsSync(learningsPath)) {
    console.log(`  ❌ ${LEARNINGS_FILE} not found`);
    process.exit(1);
  }

  // Parse arguments
  const { topics: specifiedTopics } = parseArgs();

  // Detect topics if not specified
  let topics = specifiedTopics;
  if (!topics || topics.length === 0) {
    topics = detectTopicsFromGitChanges();
    if (topics.length > 0) {
      console.log(`  🔍 Auto-detected topics from recent changes: ${topics.join(', ')}`);
    } else {
      console.log('  🔍 No specific topics detected, showing recent lessons');
    }
  } else {
    console.log(`  🔍 Searching for topics: ${topics.join(', ')}`);
  }

  console.log('');

  // Read and parse the learnings file
  let content;
  try {
    content = fs.readFileSync(learningsPath, 'utf-8');
  } catch (err) {
    console.error(`  ❌ Error reading ${LEARNINGS_FILE}: ${err.code || 'unknown error'}`);
    process.exit(1);
  }
  const allLessons = extractLessons(content);

  console.log(`  📚 Found ${allLessons.length} documented reviews`);

  // Find relevant lessons
  const relevantLessons = findRelevantLessons(allLessons, topics);

  if (relevantLessons.length > 0) {
    console.log(`  ✅ ${relevantLessons.length} relevant lessons found:`);
    console.log(formatLessons(relevantLessons, topics));
  } else {
    console.log('  ℹ️  No lessons matched the detected topics');
    console.log('     Recent reviews may still be relevant:');
    console.log(formatLessons(allLessons.slice(-3), []));
  }

  console.log('');
  console.log('  📖 Full log: AI_REVIEW_LEARNINGS_LOG.md');
  console.log('');

  process.exit(0);
}

main().catch(err => {
  // Avoid exposing sensitive paths in error messages
  // Use .split('\n')[0] to ensure only first line (no stack trace in String(err))
  // Strip control chars (ANSI escapes) to prevent log/terminal injection in CI
  const safeMessage = String(err?.message ?? err ?? 'Unknown error')
    .split('\n')[0]
    // eslint-disable-next-line no-control-regex -- intentional: strip ANSI/control chars for security
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\/home\/[^/\s]+/g, '[HOME]')
    .replace(/\/Users\/[^/\s]+/g, '[HOME]')
    .replace(/C:\\Users\\[^\\]+/gi, '[HOME]');
  console.error('Script error:', safeMessage);
  process.exit(1);
});
