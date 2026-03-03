#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * SessionStart Hook (Node.js)
 *
 * Cross-platform session initialization hook.
 * Works on Windows, macOS, and Linux.
 *
 * What it does:
 *   1. Tracks session state (begin/end counts)
 *   2. Checks MCP secrets status
 *   3. Installs npm dependencies (with lockfile hash caching)
 *   4. Rotates state log files when they grow too large
 */

const { _execSync, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { isSafeToWrite } = require('./lib/symlink-guard');
const { sanitizeInput } = require('./lib/sanitize-input');
const { projectDir } = require('./lib/git-utils');

// Detect environment (remote/local)
const isRemote = process.env.CLAUDE_CODE_REMOTE === 'true';
const envType = isRemote ? 'remote' : 'local';

process.chdir(projectDir);

let warnings = 0;

console.log(`SessionStart Hook (${envType})`);

// Log environment (secure: excludes PWD to avoid exposing sensitive paths)
console.log('Environment:');
console.log(`   Node: ${process.version}`);
const npmUA = process.env.npm_config_user_agent || '';
const npmVersion = npmUA.match(/npm\/([0-9][0-9.]*[0-9])/i)?.[1] || 'unknown';
console.log(`   npm:  ${npmVersion}`);
console.log('');

// =============================================================================
// Ephemeral File Cleanup
// =============================================================================
try {
  fs.unlinkSync(path.join(projectDir, '.claude', 'tmp-alerts.json'));
} catch {
  /* file may not exist */
}

// =============================================================================
// Cross-Session Validation (check if previous session ended properly)
// =============================================================================

const SESSION_STATE_FILE = path.join(projectDir, '.claude', 'hooks', '.session-state.json');

/**
 * Read session state from file
 */
function readSessionState() {
  try {
    if (fs.existsSync(SESSION_STATE_FILE)) {
      // eslint-disable-next-line framework/no-toctou-file-ops -- existence check is advisory; read is wrapped in try/catch
      return JSON.parse(fs.readFileSync(SESSION_STATE_FILE, 'utf8'));
    }
  } catch (err) {
    console.error(
      // eslint-disable-next-line framework/no-unsafe-error-access -- safe: instanceof check is inline
      `session-start: failed to read session state: ${sanitizeInput(err instanceof Error ? err.message : String(err))}`,
    );
  }
  return null;
}

/**
 * Write session state to file
 */
function writeSessionState(state) {
  const tmpPath = `${SESSION_STATE_FILE}.tmp`;
  try {
    fs.mkdirSync(path.dirname(SESSION_STATE_FILE), { recursive: true });
    if (!isSafeToWrite(tmpPath)) {
      console.error('session-start: refusing to write — symlink detected on session state');
      return;
    }
    // eslint-disable-next-line framework/no-non-atomic-write -- non-critical ephemeral state file
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
    try {
      fs.rmSync(SESSION_STATE_FILE, { force: true });
    } catch {
      // best-effort; destination may not exist
    }
    fs.renameSync(tmpPath, SESSION_STATE_FILE);
  } catch (err) {
    console.error(
      // eslint-disable-next-line framework/no-unsafe-error-access -- safe: instanceof check is inline
      `session-start: failed to write session state: ${err instanceof Error ? err.message : String(err)}`,
    );
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      // cleanup failure is non-critical
    }
  }
}

// Check previous session state
const previousState = readSessionState();
if (previousState && previousState.lastBegin) {
  const lastBegin = new Date(previousState.lastBegin);
  const lastEnd = previousState.lastEnd ? new Date(previousState.lastEnd) : null;

  // If begin exists but no end after it, warn about incomplete session
  if (!lastEnd || lastEnd < lastBegin) {
    const hoursAgo = Math.round((Date.now() - lastBegin.getTime()) / (1000 * 60 * 60));
    console.log(`WARNING: Previous session started ${hoursAgo}h ago without session-end`);
    warnings++;

    // Auto-close the previous session to keep begin/end counts approximately aligned
    previousState.lastEnd = previousState.lastBegin; // Mark as ended at the time it started
    previousState.endCount = (previousState.endCount || 0) + 1;
  }
}

// Update session state for this new session
const newState = previousState || {};
newState.lastBegin = new Date().toISOString();
newState.beginCount = (newState.beginCount || 0) + 1;
// Generate a simple session ID
newState.currentSessionId = `session-${Date.now()}`;
writeSessionState(newState);

// =============================================================================
// Encrypted Secrets Check (for MCP tokens)
// =============================================================================

const ENV_LOCAL_PATH = path.join(projectDir, '.env.local');
const ENCRYPTED_PATH = path.join(projectDir, '.env.local.encrypted');

/**
 * Check if a token value looks like a real token (not a placeholder)
 * @param {string|null} value - The token value to check
 * @returns {boolean} - True if it looks like a real token
 */
function looksLikeRealToken(value) {
  if (!value) return false;
  const lower = value.toLowerCase();
  // Reject common placeholder patterns used in templates/docs
  if (
    lower.includes('your_') ||
    lower.includes('_here') ||
    lower.includes('placeholder') ||
    lower.includes('example') ||
    lower.includes('xxx') ||
    lower === 'changeme' ||
    lower === 'todo'
  ) {
    return false;
  }
  // Real tokens are typically at least 12 characters
  return value.length >= 12;
}

/**
 * Read a variable value from env file content
 * @param {string} content - The env file content
 * @param {string} name - The variable name
 * @returns {string|null} - The variable value or null
 */
function readEnvVar(content, name) {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const line = lines.find((l) => l.startsWith(`${name}=`));
  if (!line) return null;
  return line.slice(name.length + 1).trim();
}

function checkSecretsStatus() {
  const hasEnvLocal = fs.existsSync(ENV_LOCAL_PATH);
  const hasEncrypted = fs.existsSync(ENCRYPTED_PATH);

  // Check if .env.local has actual tokens (not just template/placeholders)
  let hasTokens = false;
  if (hasEnvLocal) {
    try {
      const content = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
      hasTokens =
        looksLikeRealToken(readEnvVar(content, 'GITHUB_TOKEN')) ||
        looksLikeRealToken(readEnvVar(content, 'CONTEXT7_API_KEY'));
    } catch (err) {
      console.warn(
        // eslint-disable-next-line framework/no-unsafe-error-access -- safe: instanceof check is inline
        `session-start: failed to read .env.local: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { hasEnvLocal, hasEncrypted, hasTokens };
}

const secretsStatus = checkSecretsStatus();
if (secretsStatus.hasTokens) {
  console.log('MCP secrets: configured');
} else if (secretsStatus.hasEncrypted) {
  console.log(
    'MCP secrets: WARNING encrypted but not decrypted -> node scripts/secrets/decrypt-secrets.js',
  );
  warnings++;
} else {
  console.log('MCP secrets: not configured');
}

// =============================================================================
// Dependency Cache Check
// =============================================================================

const LOCKFILE_HASH_FILE = '.claude/.lockfile-hash';

function computeHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch {
    return null; // Return null on error to force reinstall
  }
}

function needsRootInstall() {
  if (!fs.existsSync('node_modules')) return true;
  if (!fs.existsSync('package-lock.json')) return true;

  try {
    const currentHash = computeHash('package-lock.json');
    if (!currentHash) return true; // Force reinstall if hash failed

    const cachedHash = fs.existsSync(LOCKFILE_HASH_FILE)
      ? // eslint-disable-next-line framework/no-toctou-file-ops -- existence check is advisory; read is wrapped in try/catch
        fs.readFileSync(LOCKFILE_HASH_FILE, 'utf8').trim()
      : '';
    return currentHash !== cachedHash;
  } catch {
    return true;
  }
}

function saveRootHash() {
  const hash = computeHash('package-lock.json');
  if (!hash) return; // Don't write invalid hash
  const dir = path.dirname(LOCKFILE_HASH_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const absPath = path.resolve(LOCKFILE_HASH_FILE);
  if (!isSafeToWrite(absPath)) {
    console.error('session-start: refusing to write — symlink detected on lockfile hash');
    return;
  }
  try {
    // eslint-disable-next-line framework/no-non-atomic-write -- non-critical ephemeral state file
    fs.writeFileSync(LOCKFILE_HASH_FILE, hash, 'utf-8');
  } catch (err) {
    console.warn(
      // eslint-disable-next-line framework/no-unsafe-error-access -- safe: instanceof check is inline
      `session-start: failed to save root lockfile hash: ${sanitizeInput(err instanceof Error ? err.message : String(err))}`,
    );
  }
}

function runCommand(description, command, timeoutMs = 120000) {
  console.log(`Installing: ${description}...`);
  try {
    // Use execFileSync with explicit args to avoid shell injection (C1 review finding)
    const parts = command.split(/\s+/);
    execFileSync(parts[0], parts.slice(1), {
      stdio: 'pipe',
      timeout: timeoutMs,
      encoding: 'utf8',
    });
    console.log(`   Done: ${description}`);
    return true;
  } catch (error) {
    if (error.killed) {
      console.log(`   WARNING: ${description} timed out (continuing anyway)`);
    } else {
      console.log(`   WARNING: ${description} failed (continuing anyway)`);
    }
    warnings++;
    return false;
  }
}

// Install root dependencies
if (needsRootInstall()) {
  if (fs.existsSync('package-lock.json')) {
    if (
      runCommand('Installing root dependencies', 'npm ci --prefer-offline --no-audit --no-fund')
    ) {
      saveRootHash();
    }
  } else {
    console.log('   WARNING: package-lock.json not found, falling back to npm install');
    warnings++;
    runCommand(
      'Installing root dependencies (no lockfile)',
      'npm install --prefer-offline --no-audit --no-fund',
    );
  }
} else {
  console.log('Skipping root dependencies (unchanged since last install)');
}

// Rotate state logs with archive-on-rotation
try {
  const { archiveRotateJsonl, rotateJsonl } = require('./lib/rotate-state.js');
  const hookWarningsPath = path.join(projectDir, '.claude', 'state', 'hook-warnings-log.jsonl');
  if (fs.existsSync(hookWarningsPath)) {
    const hwResult = archiveRotateJsonl(hookWarningsPath, 50, 30);
    if (hwResult && hwResult.rotated) {
      console.log(
        `   Rotated hook-warnings-log.jsonl: ${hwResult.before} -> ${hwResult.after} entries (${hwResult.archived} archived)`,
      );
    }
  }
  const healthScorePath = path.join(projectDir, '.claude', 'state', 'health-score-log.jsonl');
  if (fs.existsSync(healthScorePath)) {
    const hsResult = rotateJsonl(healthScorePath, 30, 20);
    if (hsResult) {
      console.log(
        `   Rotated health-score-log.jsonl: ${hsResult.before} -> ${hsResult.after} entries`,
      );
    }
  }
} catch {
  // Non-fatal
}

// Sync commit log from git history (fills gaps when commit-tracker hook misses)
try {
  execFileSync('node', ['scripts/seed-commit-log.js', '--sync'], {
    cwd: projectDir,
    stdio: 'ignore',
    timeout: 20000,
  });
} catch {
  // Non-fatal: commit log sync failure doesn't block session start
}

console.log('');
if (warnings === 0) {
  console.log('SessionStart complete');
} else {
  console.log(`SessionStart completed with ${warnings} warning(s)`);
}
console.log('Next: start working or run /session-begin if available');
console.log('ok');
