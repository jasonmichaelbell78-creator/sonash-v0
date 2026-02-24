#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports, security/detect-non-literal-fs-filename */
/**
 * SessionStart Hook for SoNash (Node.js version)
 *
 * Cross-platform replacement for session-start.sh
 * Works on Windows, macOS, and Linux
 *
 * What it does:
 *   1. Installs npm dependencies (root and functions)
 *   2. Builds Firebase Functions
 *   3. Compiles test files
 *   4. Checks pattern compliance
 *   5. Checks consolidation status
 */

const { execSync, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { isSafeToWrite } = require("./lib/symlink-guard");

// Detect environment (remote/local)
const isRemote = process.env.CLAUDE_CODE_REMOTE === "true";
const envType = isRemote ? "remote" : "local";

// Validate project directory before chdir
const baseDir = path.resolve(process.cwd());
const projectDirInput = process.env.CLAUDE_PROJECT_DIR || baseDir;
const projectDir = path.resolve(baseDir, projectDirInput);

// Security: Ensure projectDir is within baseDir using path.relative() (prevent path traversal)
// Note: rel === '' means projectDir equals baseDir, which is valid for session startup
const rel = path.relative(baseDir, projectDir);
if (rel.startsWith(".." + path.sep) || rel === ".." || path.isAbsolute(rel)) {
  process.exit(0);
}

process.chdir(projectDir);

let warnings = 0;

console.log(`🚀 SessionStart Hook for sonash-v0 (${envType})`);

// Log environment (secure: excludes PWD to avoid exposing sensitive paths)
console.log("📋 Environment:");
console.log(`   Node: ${process.version}`);
const npmUA = process.env.npm_config_user_agent || "";
const npmVersion = npmUA.match(/npm\/([0-9][0-9.]*[0-9])/i)?.[1] || "unknown";
console.log(`   npm:  ${npmVersion}`);
console.log("");

// =============================================================================
// Ephemeral File Cleanup
// =============================================================================
try {
  fs.unlinkSync(path.join(projectDir, ".claude", "tmp-alerts.json"));
} catch {
  /* file may not exist */
}

// =============================================================================
// Cross-Session Validation (check if previous session ended properly)
// =============================================================================

const SESSION_STATE_FILE = path.join(projectDir, ".claude", "hooks", ".session-state.json");

/**
 * Read session state from file
 */
function readSessionState() {
  try {
    if (fs.existsSync(SESSION_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(SESSION_STATE_FILE, "utf8"));
    }
  } catch (err) {
    console.error(
      `session-start: failed to read session state: ${err instanceof Error ? err.message : String(err)}`
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
      console.error("session-start: refusing to write — symlink detected on session state");
      return;
    }
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
    try {
      fs.rmSync(SESSION_STATE_FILE, { force: true });
    } catch {
      // best-effort; destination may not exist
    }
    fs.renameSync(tmpPath, SESSION_STATE_FILE);
  } catch (err) {
    console.error(
      `session-start: failed to write session state: ${err instanceof Error ? err.message : String(err)}`
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
    console.log(`⚠️  Previous session started ${hoursAgo}h ago without session-end`);
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

const ENV_LOCAL_PATH = path.join(projectDir, ".env.local");
const ENCRYPTED_PATH = path.join(projectDir, ".env.local.encrypted");

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
    lower.includes("your_") ||
    lower.includes("_here") ||
    lower.includes("placeholder") ||
    lower.includes("example") ||
    lower.includes("xxx") ||
    lower === "changeme" ||
    lower === "todo"
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
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
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
      const content = fs.readFileSync(ENV_LOCAL_PATH, "utf8");
      hasTokens =
        looksLikeRealToken(readEnvVar(content, "GITHUB_TOKEN")) ||
        looksLikeRealToken(readEnvVar(content, "SONAR_TOKEN")) ||
        looksLikeRealToken(readEnvVar(content, "CONTEXT7_API_KEY"));
    } catch (err) {
      console.warn(
        `session-start: failed to read .env.local: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return { hasEnvLocal, hasEncrypted, hasTokens };
}

const secretsStatus = checkSecretsStatus();
if (secretsStatus.hasTokens) {
  console.log("🔐 MCP secrets: ✓ configured");
} else if (secretsStatus.hasEncrypted) {
  console.log(
    "🔐 MCP secrets: ⚠️ encrypted but not decrypted → node scripts/secrets/decrypt-secrets.js"
  );
  warnings++;
} else {
  console.log("🔐 MCP secrets: ℹ️ not configured");
}

// =============================================================================
// Dependency Cache Check
// =============================================================================

const LOCKFILE_HASH_FILE = ".claude/.lockfile-hash";
const FUNCTIONS_LOCKFILE_HASH_FILE = ".claude/.functions-lockfile-hash";

function computeHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch {
    return null; // Return null on error to force reinstall
  }
}

function needsRootInstall() {
  if (!fs.existsSync("node_modules")) return true;
  if (!fs.existsSync("package-lock.json")) return true;

  try {
    const currentHash = computeHash("package-lock.json");
    if (!currentHash) return true; // Force reinstall if hash failed

    const cachedHash = fs.existsSync(LOCKFILE_HASH_FILE)
      ? fs.readFileSync(LOCKFILE_HASH_FILE, "utf8").trim()
      : "";
    return currentHash !== cachedHash;
  } catch {
    return true;
  }
}

function needsFunctionsInstall() {
  if (!fs.existsSync("functions/node_modules")) return true;
  if (!fs.existsSync("functions/package-lock.json")) return true;

  try {
    const currentHash = computeHash("functions/package-lock.json");
    if (!currentHash) return true; // Force reinstall if hash failed

    const cachedHash = fs.existsSync(FUNCTIONS_LOCKFILE_HASH_FILE)
      ? fs.readFileSync(FUNCTIONS_LOCKFILE_HASH_FILE, "utf8").trim()
      : "";
    return currentHash !== cachedHash;
  } catch {
    return true;
  }
}

function saveRootHash() {
  const hash = computeHash("package-lock.json");
  if (!hash) return; // Don't write invalid hash
  const dir = path.dirname(LOCKFILE_HASH_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const absPath = path.resolve(LOCKFILE_HASH_FILE);
  if (!isSafeToWrite(absPath)) {
    console.error("session-start: refusing to write — symlink detected on lockfile hash");
    return;
  }
  fs.writeFileSync(LOCKFILE_HASH_FILE, hash, "utf-8");
}

function saveFunctionsHash() {
  const hash = computeHash("functions/package-lock.json");
  if (!hash) return; // Don't write invalid hash
  const dir = path.dirname(FUNCTIONS_LOCKFILE_HASH_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const absPath = path.resolve(FUNCTIONS_LOCKFILE_HASH_FILE);
  if (!isSafeToWrite(absPath)) {
    console.error("session-start: refusing to write — symlink detected on functions lockfile hash");
    return;
  }
  fs.writeFileSync(FUNCTIONS_LOCKFILE_HASH_FILE, hash, "utf-8");
}

function runCommand(description, command, timeoutMs = 120000) {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, {
      stdio: "pipe",
      timeout: timeoutMs,
      encoding: "utf8",
      shell: true,
    });
    console.log(`   ✓ ${description} complete`);
    return true;
  } catch (error) {
    if (error.killed) {
      console.log(`   ⚠️ ${description} timed out (continuing anyway)`);
    } else {
      console.log(`   ⚠️ ${description} failed (continuing anyway)`);
    }
    warnings++;
    return false;
  }
}

// Install root dependencies
if (needsRootInstall()) {
  if (fs.existsSync("package-lock.json")) {
    if (
      runCommand("Installing root dependencies", "npm ci --prefer-offline --no-audit --no-fund")
    ) {
      saveRootHash();
    }
  } else {
    console.log("   ⚠️ package-lock.json not found, falling back to npm install");
    warnings++;
    runCommand(
      "Installing root dependencies (no lockfile)",
      "npm install --prefer-offline --no-audit --no-fund"
    );
  }
} else {
  console.log("📦 Skipping root dependencies (unchanged since last install)");
}

// Install Firebase Functions dependencies
if (fs.existsSync("functions")) {
  if (needsFunctionsInstall()) {
    if (fs.existsSync("functions/package-lock.json")) {
      if (
        runCommand(
          "Installing Firebase Functions dependencies",
          "cd functions && npm ci --prefer-offline --no-audit --no-fund --legacy-peer-deps"
        )
      ) {
        saveFunctionsHash();
      }
    } else {
      console.log("   ⚠️ functions/package-lock.json not found, falling back to npm install");
      warnings++;
      runCommand(
        "Installing Firebase Functions dependencies (no lockfile)",
        "cd functions && npm install --prefer-offline --no-audit --no-fund --legacy-peer-deps"
      );
    }
    runCommand("Building Firebase Functions", "cd functions && npm run build", 60000);
  } else {
    console.log("📦 Skipping Firebase Functions dependencies (unchanged since last install)");
    // Still build if lib/ is missing or stale
    if (!fs.existsSync("functions/lib")) {
      runCommand("Building Firebase Functions", "cd functions && npm run build", 60000);
    } else {
      console.log("📦 Skipping Firebase Functions build (already up to date)");
    }
  }
}

// Build test files (TTL guard: skip if dist-tests exists and is <1h old)
const distTestsDir = path.join(projectDir, "dist-tests");
const TEST_BUILD_TTL_MS = 60 * 60 * 1000; // 1 hour
let needsTestBuild = true;
try {
  if (fs.existsSync(distTestsDir)) {
    const stat = fs.statSync(distTestsDir);
    if (Date.now() - stat.mtimeMs < TEST_BUILD_TTL_MS) {
      needsTestBuild = false;
    }
  }
} catch (err) {
  // Stat failed (permissions, race condition, etc.) — rebuild as fallback
  if (process.env.DEBUG) {
    const code =
      err && typeof err === "object" && "code" in err && typeof err.code === "string"
        ? err.code
        : "unknown";
    console.log(`  dist-tests stat failed (${code})`);
  }
}
if (needsTestBuild) {
  runCommand("Building test files", "npm run test:build", 60000);
} else {
  console.log("📦 Skipping test build (dist-tests fresh, <1h old)");
}

// Pattern compliance check
try {
  execSync("node scripts/check-pattern-compliance.js", { stdio: "pipe" });
  console.log("🔍 Patterns: ✓ compliant");
} catch (error) {
  const exitCode = error.status || 1;
  if (exitCode >= 2) {
    console.log(`🔍 Patterns: ❌ failed (exit ${exitCode})`);
  } else {
    console.log("🔍 Patterns: ⚠️ violations detected — npm run patterns:check-all");
  }
  warnings++;
}

// Auto-consolidation
try {
  const output = execSync("node scripts/run-consolidation.js --auto", { encoding: "utf8" });
  if (output.trim()) {
    console.log(output.trim());
  } else {
    console.log("🔍 Consolidation: ✓ not needed");
  }
} catch (error) {
  const exitCode = error.status || 1;
  if (exitCode >= 2) {
    console.log(`🔍 Consolidation: ❌ failed (exit ${exitCode})`);
    warnings++;
  } else if (exitCode === 1) {
    const stdout = (error.stdout || "").toString().trim();
    if (stdout) console.log(stdout);
    console.log("🔍 Consolidation: ⚠️ exit code 1 (unexpected for --auto)");
  }
}

// Archive health check: rotate reviews.jsonl when it exceeds 50 entries (OPT #74)
try {
  const reviewsPath = path.join(projectDir, ".claude", "state", "reviews.jsonl");
  if (fs.existsSync(reviewsPath)) {
    const reviewCount = fs
      .readFileSync(reviewsPath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean).length;
    if (reviewCount > 50) {
      try {
        const { rotateJsonl } = require("./lib/rotate-state.js");
        const result = rotateJsonl(reviewsPath, 50, 30);
        if (result.rotated) {
          console.log(`   🔄 reviews.jsonl rotated: ${result.before} → ${result.after} entries`);
          // Re-sync from markdown source immediately after rotation to prevent
          // data loss. Without this, the audit checkers see only 30 entries until
          // session-begin runs reviews:sync. (PEA-501, PR #379 ecosystem audit)
          try {
            execFileSync("npm", ["run", "reviews:sync", "--", "--apply"], {
              cwd: projectDir,
              stdio: "inherit",
              timeout: 15000,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(
              `   ⚠️ reviews:sync failed after rotation, will retry in session-begin: ${msg}`
            );
          }
        }
      } catch {
        // Fallback: warn if rotation fails
        console.log(
          `   ⚠️ Archive recommended: ${reviewCount} reviews in reviews.jsonl (threshold: 50)`
        );
        warnings++;
      }
    }
  }
} catch {
  // Non-fatal
}

// Rotate other state logs (same pattern as reviews.jsonl)
try {
  const { rotateJsonl } = require("./lib/rotate-state.js");
  const hookWarningsPath = path.join(projectDir, ".claude", "state", "hook-warnings-log.jsonl");
  if (fs.existsSync(hookWarningsPath)) {
    const hwResult = rotateJsonl(hookWarningsPath, 50, 30);
    if (hwResult) {
      console.log(
        `   🔄 hook-warnings-log.jsonl rotated: ${hwResult.before} → ${hwResult.after} entries`
      );
    }
  }
  const healthScorePath = path.join(projectDir, ".claude", "state", "health-score-log.jsonl");
  if (fs.existsSync(healthScorePath)) {
    const hsResult = rotateJsonl(healthScorePath, 30, 20);
    if (hsResult) {
      console.log(
        `   🔄 health-score-log.jsonl rotated: ${hsResult.before} → ${hsResult.after} entries`
      );
    }
  }
} catch {
  // Non-fatal
}

// Technical Debt health check (TDMS)
try {
  const metricsPath = path.join(projectDir, "docs", "technical-debt", "metrics.json");
  if (fs.existsSync(metricsPath)) {
    const metrics = JSON.parse(fs.readFileSync(metricsPath, "utf8"));
    const s0Count = metrics.by_severity?.S0 ?? 0;
    const s1Count = metrics.by_severity?.S1 ?? 0;
    const total = metrics.summary?.total ?? 0;
    const resolved = metrics.summary?.resolved ?? 0;
    console.log(`📊 TDMS: ${total} items (${resolved} resolved)`);
    if (s0Count > 0) {
      console.log(`   🔴 S0: ${s0Count} critical`);
      warnings++;
    }
    if (s1Count > 10) {
      console.log(`   🟡 S1: ${s1Count} high (threshold: 10)`);
    }
  } else {
    console.log("📊 TDMS: ⚠️ metrics not found — npm run debt:metrics");
    warnings++;
  }
} catch (error) {
  console.log(`📊 TDMS: ❌ metrics read failed`);
  warnings++;
}

console.log("");
if (warnings === 0) {
  console.log("✅ SessionStart complete");
} else {
  console.log(`⚠️ SessionStart completed with ${warnings} warning(s)`);
}
console.log("📋 Next: /session-begin or start working");
