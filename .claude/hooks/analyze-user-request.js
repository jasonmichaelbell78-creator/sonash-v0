#!/usr/bin/env node
/**
 * analyze-user-request.js - UserPromptSubmit hook for routing user requests
 * Cross-platform replacement for analyze-user-request.sh
 *
 * Priority order:
 * 1. Security (HIGHEST - "fix auth bug" should trigger security, not debugging)
 * 2. Bug/Error/Debugging
 * 3. Database
 * 4. UI/Frontend
 * 5. Planning/Architecture
 * 6. Exploration/Understanding
 * 7. Testing
 */

// Get user request from arguments
let userRequest = process.argv[2] || '';

// Try to parse as JSON if it looks like JSON
if (userRequest.startsWith('{')) {
  try {
    const parsed = JSON.parse(userRequest);
    userRequest = parsed.prompt || parsed.request || parsed.message || '';
  } catch {
    // Not JSON, use as-is
  }
}

if (!userRequest) {
  console.log('ok');
  process.exit(0);
}

// Truncate long input
const MAX_LENGTH = 2000;
if (userRequest.length > MAX_LENGTH) {
  userRequest = userRequest.slice(0, MAX_LENGTH);
}

const requestLower = userRequest.toLowerCase();

// Helper for word boundary matching
function matchesWord(pattern) {
  const regex = new RegExp(`(^|[^a-z0-9])(${pattern})([^a-z0-9]|$)`, 'i');
  return regex.test(requestLower);
}

// Priority 1: SECURITY (HIGHEST)
const securityPatterns = [
  'security', 'auth', 'authentication', 'token', 'password', 'credential',
  'secret', 'oauth', 'jwt', 'encrypt', 'decrypt', 'api.?key', 'session',
  'permission', 'access.?control'
];
for (const pattern of securityPatterns) {
  if (matchesWord(pattern)) {
    console.log('PRE-TASK: MUST use security-auditor agent');
    process.exit(0);
  }
}

// Priority 2: Bug/Error/Debugging
const bugPatterns = [
  'bug', 'error', 'fix', 'broken', 'not.?working', 'crash',
  'fail', 'issue', 'problem', 'debug'
];
for (const pattern of bugPatterns) {
  if (matchesWord(pattern)) {
    console.log('PRE-TASK: MUST use systematic-debugging skill FIRST');
    process.exit(0);
  }
}

// Priority 3: Database
const dbPatterns = [
  'database', 'query', 'schema', 'migration', 'sql', 'postgres',
  'mysql', 'firestore', 'mongodb'
];
for (const pattern of dbPatterns) {
  if (matchesWord(pattern)) {
    console.log('PRE-TASK: MUST use database-architect agent');
    process.exit(0);
  }
}

// Priority 4: UI/Frontend
const uiPatterns = [
  'ui', 'frontend', 'component', 'css', 'styling', 'design',
  'layout', 'responsive', 'tailwind', 'react', 'button', 'form'
];
for (const pattern of uiPatterns) {
  if (matchesWord(pattern)) {
    console.log('PRE-TASK: MUST use frontend-design skill');
    process.exit(0);
  }
}

// Priority 5: Planning/Architecture
const planPatterns = [
  'plan', 'design', 'architect', 'implement.?feature',
  'add.?feature', 'new.?feature', 'refactor'
];
for (const pattern of planPatterns) {
  if (matchesWord(pattern)) {
    console.log('PRE-TASK: SHOULD use Plan agent for multi-step work');
    process.exit(0);
  }
}

// Priority 6: Exploration/Understanding
const explorePatterns = [
  'explore', 'understand', 'find', 'where.?is', 'how.?does',
  'what.?is', 'explain', 'show.?me'
];
for (const pattern of explorePatterns) {
  if (matchesWord(pattern)) {
    console.log('PRE-TASK: SHOULD use Explore agent for codebase exploration');
    process.exit(0);
  }
}

// Priority 7: Testing
const testPatterns = [
  'test', 'testing', 'coverage', 'jest', 'cypress', 'playwright'
];
for (const pattern of testPatterns) {
  if (matchesWord(pattern)) {
    console.log('PRE-TASK: SHOULD use test-engineer agent');
    process.exit(0);
  }
}

console.log('ok');
