#!/usr/bin/env node

/**
 * AI Review Script
 *
 * Applies specialized AI review prompts to different artifact types.
 *
 * Usage:
 *   node scripts/ai-review.js --type=documentation --file=docs/setup.md
 *   node scripts/ai-review.js --type=configuration --file=package.json
 *   node scripts/ai-review.js --type=security-policy --file=firestore.rules
 *   node scripts/ai-review.js --type=dependencies --staged
 */

import fs from 'fs';
import path from 'path';
import { execSync, execFileSync } from 'child_process';

const REVIEW_PROMPTS_FILE = '.claude/review-prompts.md';

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  type: null,
  file: null,
  staged: false,
  output: 'console', // console | json | yaml
};

args.forEach(arg => {
  const [key, value] = arg.split('=');
  if (key === '--type') config.type = value;
  if (key === '--file') config.file = value;
  if (key === '--staged') config.staged = true;
  if (key === '--output') config.output = value;
});

// Validation
if (!config.type) {
  console.error('Error: --type is required');
  console.error('Valid types: documentation, configuration, security-policy, process-change, dependencies');
  process.exit(1);
}

const REVIEW_TYPES = {
  'documentation': {
    section: '## 1. Documentation Review',
    extensions: ['.md', '.mdx'],
    description: 'Markdown documentation files',
  },
  'configuration': {
    section: '## 2. Configuration Review',
    extensions: ['.json', '.env', '.yaml', '.yml'],
    description: 'Configuration files',
  },
  'security-policy': {
    section: '## 3. Security Policy Review',
    extensions: ['.rules'],
    description: 'Security rules and policies',
  },
  'process-change': {
    section: '## 4. Process Change Review',
    extensions: ['.sh', '.yml', '.yaml'],
    description: 'Workflow and automation files',
  },
  'dependencies': {
    section: '## 5. Dependency Review',
    extensions: ['package.json'],
    description: 'Dependency changes',
  },
};

if (!REVIEW_TYPES[config.type]) {
  console.error(`Error: Invalid type "${config.type}"`);
  console.error(`Valid types: ${Object.keys(REVIEW_TYPES).join(', ')}`);
  process.exit(1);
}

/**
 * Extract prompt from review-prompts.md
 */
function extractPrompt(type) {
  const reviewTypeConfig = REVIEW_TYPES[type];
  const promptsFile = fs.readFileSync(REVIEW_PROMPTS_FILE, 'utf-8');

  const sectionStart = promptsFile.indexOf(reviewTypeConfig.section);
  if (sectionStart === -1) {
    throw new Error(`Section "${reviewTypeConfig.section}" not found in ${REVIEW_PROMPTS_FILE}`);
  }

  // Find the next section or end of file
  const nextSectionPattern = /\n## \d+\./g;
  nextSectionPattern.lastIndex = sectionStart + reviewTypeConfig.section.length;
  const match = nextSectionPattern.exec(promptsFile);
  const sectionEnd = match ? match.index : promptsFile.length;

  const section = promptsFile.substring(sectionStart, sectionEnd);

  // Extract the system prompt (between first ``` and next ```)
  const systemPromptMatch = section.match(/### System Prompt\s+```\s+([\s\S]+?)\s+```/);
  if (!systemPromptMatch) {
    throw new Error(`System prompt not found in section: ${reviewTypeConfig.section}`);
  }

  return systemPromptMatch[1].trim();
}

/**
 * Get files to review
 */
function getFilesToReview() {
  if (config.file) {
    return [config.file];
  }

  if (config.staged) {
    try {
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
        .split('\n')
        .filter(Boolean);

      const reviewTypeConfig = REVIEW_TYPES[config.type];
      return stagedFiles.filter(file => {
        if (reviewTypeConfig.extensions.includes(path.basename(file))) {
          return true;
        }
        const ext = path.extname(file);
        return reviewTypeConfig.extensions.includes(ext);
      });
    } catch (error) {
      console.error('Error getting staged files:', error.message);
      return [];
    }
  }

  console.error('Error: Either --file or --staged must be specified');
  process.exit(1);
}

/**
 * Read file content
 */
function readFileContent(filePath) {
  try {
    if (config.staged) {
      // Read staged version (use execFileSync to prevent command injection)
      return execFileSync('git', ['show', `:${filePath}`], { encoding: 'utf-8' });
    } else {
      // Read current version
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Format review request for AI
 */
function formatReviewRequest(prompt, files) {
  let request = prompt + '\n\n---\n\n';

  if (files.length === 1) {
    const content = readFileContent(files[0]);
    if (!content) return null;

    request += `# File: ${files[0]}\n\n`;
    request += '```\n';
    request += content;
    request += '\n```\n';
  } else {
    request += '# Files to Review\n\n';
    files.forEach(file => {
      const content = readFileContent(file);
      if (content) {
        request += `## ${file}\n\n`;
        request += '```\n';
        request += content;
        request += '\n```\n\n';
      }
    });
  }

  return request;
}

/**
 * Main execution
 */
function main() {
  console.log(`\n🔍 AI Review: ${REVIEW_TYPES[config.type].description}\n`);

  // Extract the appropriate prompt
  const prompt = extractPrompt(config.type);

  // Get files to review
  const files = getFilesToReview();

  if (files.length === 0) {
    console.log('No files to review.');
    return;
  }

  console.log(`Files to review (${files.length}):`);
  files.forEach(file => console.log(`  - ${file}`));
  console.log();

  // Format the review request
  const reviewRequest = formatReviewRequest(prompt, files);

  if (!reviewRequest) {
    console.error('Error: Could not format review request');
    process.exit(1);
  }

  // Output based on config
  if (config.output === 'json') {
    console.log(JSON.stringify({
      type: config.type,
      files: files,
      prompt: prompt,
      request: reviewRequest,
    }, null, 2));
  } else if (config.output === 'yaml') {
    console.log('---');
    console.log(`type: ${config.type}`);
    console.log('files:');
    files.forEach(file => console.log(`  - ${file}`));
    console.log('prompt: |');
    console.log(prompt.split('\n').map(line => `  ${line}`).join('\n'));
  } else {
    // Console output - ready for piping to Claude
    console.log('='.repeat(80));
    console.log('REVIEW REQUEST (pipe to Claude CLI or use in API)');
    console.log('='.repeat(80));
    console.log(reviewRequest);
    console.log('='.repeat(80));
    console.log('\nSuggested command:');
    console.log(`  claude chat < <(node scripts/ai-review.js --type=${config.type} ${config.file ? `--file=${config.file}` : '--staged'})`);
  }
}

// Run with top-level error handling
try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
