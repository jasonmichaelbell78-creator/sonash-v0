#!/usr/bin/env node
/* global require, process, console */
/* eslint-disable @typescript-eslint/no-require-imports */
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
 *
 * === v1/v2 Script Status (INTG-06) ===
 * review-lifecycle.js: v2 orchestrator (sync, archive, rotate, validate, render)
 * run-consolidation.js: v1 (no full v2 replacement yet)
 * check-pattern-compliance.js: v1 (pre-commit gate, v2 partial overlap)
 * promote-patterns.js: v2 wrapper (calls scripts/reviews/lib/promote-patterns.ts)
 * Both v1 and v2 pipelines coexist: v2 handles new data (JSONL-first),
 * v1 scripts bridge legacy markdown data. Fallbacks at scripts/*.v1.js.
 */

const { execSync, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
let isSafeToWrite, sanitizeInput;
let sanitizeError;
try {
  ({ isSafeToWrite } = require("./lib/symlink-guard"));
} catch {
  isSafeToWrite = () => false;
}
try {
  ({ sanitizeInput } = require("./lib/sanitize-input"));
} catch {
  /* eslint-disable no-control-regex -- intentional: strip dangerous control chars in fallback */
  sanitizeInput = (v) =>
    String(v ?? "")
      .replaceAll(/[\x00-\x1f\x7f]/g, "")
      .slice(0, 500);
  /* eslint-enable no-control-regex */
}
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
if (/^\.\.(?:[/\\]|$)/.test(rel) || path.isAbsolute(rel)) {
  process.exit(0);
}

process.chdir(projectDir);

// Early lazy-load sanitizeError for all error logging in this file
if (!sanitizeError) {
  try {
    ({ sanitizeError } = require(path.join(projectDir, "scripts", "lib", "security-helpers.js")));
  } catch {
    sanitizeError = () => "error (details redacted)";
  }
}

let warnings = 0;
const warningEntries = []; // Collect for JSONL persistence
const runCommandFailures = [];

/**
 * Record a session-start warning for both counting and JSONL persistence.
 * @param {string} type - Warning category (e.g. "session-end-missing", "ratchet", "health")
 * @param {string} message - Human-readable warning message
 * @param {string} [action] - Suggested remediation action
 */
function addWarning(type, message, action) {
  warnings++;
  warningEntries.push({ type, message, action: action || null });
}

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
    return JSON.parse(fs.readFileSync(SESSION_STATE_FILE, "utf8"));
  } catch (err) {
    if (err && err.code !== "ENOENT") {
      console.error(`session-start: failed to read session state: ${sanitizeError(err)}`);
    }
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
    console.error(`session-start: failed to write session state: ${sanitizeError(err)}`);
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
    console.log(
      `⚠️  Previous session started ${hoursAgo}h ago without session-end. Action: review with /alerts`
    );
    addWarning(
      "session-end-missing",
      `Previous session started ${hoursAgo}h ago without session-end`,
      "Review with /alerts"
    );

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
      console.warn(`session-start: failed to read .env.local: ${sanitizeError(err)}`);
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
  addWarning(
    "mcp-secrets",
    "Encrypted but not decrypted",
    "node scripts/secrets/decrypt-secrets.js"
  );
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

    let cachedHash = "";
    try {
      cachedHash = fs.readFileSync(LOCKFILE_HASH_FILE, "utf8").trim();
    } catch {
      /* no cache */
    }
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

    let cachedHash = "";
    try {
      cachedHash = fs.readFileSync(FUNCTIONS_LOCKFILE_HASH_FILE, "utf8").trim();
    } catch {
      /* no cache */
    }
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
  const tmpPath = `${absPath}.tmp`;
  if (!isSafeToWrite(absPath) || !isSafeToWrite(tmpPath)) {
    console.error("session-start: refusing to write — symlink detected on lockfile hash");
    return;
  }
  try {
    fs.writeFileSync(tmpPath, hash, "utf-8");
    try {
      fs.renameSync(tmpPath, absPath);
    } catch {
      if (!isSafeToWrite(absPath) || !isSafeToWrite(tmpPath)) {
        try {
          fs.rmSync(tmpPath, { force: true });
        } catch {
          /* cleanup */
        }
        return;
      }
      try {
        fs.rmSync(absPath, { force: true });
      } catch {
        /* best-effort */
      }
      if (!isSafeToWrite(absPath) || !isSafeToWrite(tmpPath)) {
        try {
          fs.rmSync(tmpPath, { force: true });
        } catch {
          /* cleanup */
        }
        return;
      }
      fs.renameSync(tmpPath, absPath);
    }
  } catch (err) {
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      /* cleanup */
    }
    console.warn(`session-start: failed to save root lockfile hash: ${sanitizeError(err)}`);
  }
}

function saveFunctionsHash() {
  const hash = computeHash("functions/package-lock.json");
  if (!hash) return; // Don't write invalid hash
  const dir = path.dirname(FUNCTIONS_LOCKFILE_HASH_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const absPath = path.resolve(FUNCTIONS_LOCKFILE_HASH_FILE);
  const tmpPath = `${absPath}.tmp`;
  if (!isSafeToWrite(absPath) || !isSafeToWrite(tmpPath)) {
    console.error("session-start: refusing to write — symlink detected on functions lockfile hash");
    return;
  }
  try {
    fs.writeFileSync(tmpPath, hash, "utf-8");
    try {
      fs.renameSync(tmpPath, absPath);
    } catch {
      if (!isSafeToWrite(absPath) || !isSafeToWrite(tmpPath)) {
        try {
          fs.rmSync(tmpPath, { force: true });
        } catch {
          /* cleanup */
        }
        return;
      }
      try {
        fs.rmSync(absPath, { force: true });
      } catch {
        /* best-effort */
      }
      if (!isSafeToWrite(absPath) || !isSafeToWrite(tmpPath)) {
        try {
          fs.rmSync(tmpPath, { force: true });
        } catch {
          /* cleanup */
        }
        return;
      }
      fs.renameSync(tmpPath, absPath);
    }
  } catch (err) {
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      /* cleanup */
    }
    console.warn(`session-start: failed to save functions lockfile hash: ${sanitizeError(err)}`);
  }
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
    const killed =
      typeof error === "object" && error !== null && "killed" in error && error.killed === true;
    const reason = killed ? "timed out" : "failed";
    const safeCmd = sanitizeInput(String(command));
    const fixCmd = `Fix: ${safeCmd}`;
    console.log(`   ⚠️ ${description} ${reason}. ${fixCmd}`);
    runCommandFailures.push({
      description,
      command: safeCmd,
      reason,
      timestamp: new Date().toISOString(),
    });
    addWarning(
      "install-" + sanitizeInput(String(description)),
      description + " " + reason,
      safeCmd
    );
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
    console.log(
      "   ⚠️ package-lock.json not found, falling back to npm install. Fix: npm install && git add package-lock.json"
    );
    addWarning(
      "missing-lockfile",
      "package-lock.json not found",
      "npm install && git add package-lock.json"
    );
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
      console.log(
        "   ⚠️ functions/package-lock.json not found, falling back to npm install. Fix: cd functions && npm install && git add package-lock.json"
      );
      addWarning(
        "missing-lockfile-functions",
        "functions/package-lock.json not found",
        "cd functions && npm install && git add package-lock.json"
      );
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
    if (fs.lstatSync(distTestsDir).isSymbolicLink()) {
      needsTestBuild = true;
    } else {
      const stat = fs.statSync(distTestsDir);
      if (Date.now() - stat.mtimeMs < TEST_BUILD_TTL_MS) {
        needsTestBuild = false;
      }
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

// Persist runCommand failures for /alerts surfacing
if (runCommandFailures.length > 0) {
  const failuresPath = path.join(projectDir, ".claude", "state", "session-start-failures.json");
  try {
    const failuresDir = path.dirname(failuresPath);
    if (!fs.existsSync(failuresDir)) fs.mkdirSync(failuresDir, { recursive: true });
    if (isSafeToWrite(failuresPath)) {
      const tmpFailPath = `${failuresPath}.tmp`;
      if (isSafeToWrite(tmpFailPath)) {
        fs.writeFileSync(
          tmpFailPath,
          JSON.stringify(
            { failures: runCommandFailures, timestamp: new Date().toISOString() },
            null,
            2
          )
        );
        try {
          fs.rmSync(failuresPath, { force: true });
        } catch {
          /* best-effort */
        }
        fs.renameSync(tmpFailPath, failuresPath);
      }
    }
  } catch (err) {
    console.error(
      "session-start: failed to write session-start-failures.json: " + sanitizeError(err)
    );
  }
} else {
  // Clear stale failures file from previous sessions
  try {
    fs.rmSync(path.join(projectDir, ".claude", "state", "session-start-failures.json"), {
      force: true,
    });
  } catch {
    /* best-effort */
  }
}

// Pattern compliance check (v1 — pre-commit gate, v2 partial overlap via verify-enforcement-manifest)
try {
  execFileSync(process.execPath, ["scripts/check-pattern-compliance.js"], {
    cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
    stdio: "pipe",
    maxBuffer: 10 * 1024 * 1024,
  });
  console.log("🔍 Patterns: ✓ compliant");
} catch (error) {
  const exitCode = error.status || 1;
  if (exitCode >= 2) {
    console.error(`🔍 Patterns: ❌ failed (exit ${exitCode})`);
  } else {
    console.warn("🔍 Patterns: ⚠️ violations detected — npm run patterns:check-all");
  }
  addWarning("pattern-violations", "Pattern violations detected", "npm run patterns:check-all");
}

// Auto-consolidation (v1 — no full v2 replacement yet, reads from v2 JSONL data)
try {
  const output = execFileSync(process.execPath, ["scripts/run-consolidation.js", "--auto"], {
    cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
    encoding: "utf8",
  });
  if (output.trim()) {
    console.log(output.trim());
  } else {
    console.log("🔍 Consolidation: ✓ not needed");
  }
} catch (error) {
  const exitCode = error.status || 1;
  if (exitCode >= 2) {
    console.error(
      `🔍 Consolidation: ❌ failed (exit ${exitCode}). Fix: node scripts/run-consolidation.js --verbose`
    );
    addWarning(
      "consolidation-failed",
      `Consolidation failed (exit ${exitCode})`,
      "node scripts/run-consolidation.js --verbose"
    );
  } else if (exitCode === 1) {
    const stdout = (error.stdout || "").toString().trim();
    if (stdout) console.log(stdout);
    console.warn(
      "🔍 Consolidation: ⚠️ exit code 1 (unexpected for --auto). Fix: node scripts/run-consolidation.js --verbose"
    );
  }
}

// Review lifecycle orchestrator (sync, archive, rotate, validate, render)
try {
  execFileSync(process.execPath, [path.join(projectDir, "scripts", "review-lifecycle.js")], {
    cwd: projectDir,
    stdio: "pipe",
    timeout: 30000,
    maxBuffer: 10 * 1024 * 1024,
    encoding: "utf8",
  });
  console.log("🔍 Review lifecycle: ✓ complete");
} catch (err) {
  if (err.status === 1) {
    // Validation issues — surface as blocking warning
    console.warn("⚠️ Review lifecycle validation issues found:");
    const stderrText = err.stderr ? err.stderr.toString() : "";
    const stdoutText = err.stdout ? err.stdout.toString() : "";
    let findings = null;
    try {
      findings = JSON.parse((stderrText || stdoutText || "").trim());
    } catch {
      findings = null;
    }
    if (Array.isArray(findings) && findings.length > 0) {
      const summary = findings
        .slice(0, 3)
        .map((f) => `[${f.severity}] ${f.description}`)
        .join("\n");
      console.warn(sanitizeInput(summary));
    } else {
      const output = stdoutText || stderrText || "Unknown validation issue";
      console.warn(sanitizeInput(output.split("\n").slice(0, 5).join("\n")));
    }
    console.warn("   Fix: npm run reviews:lifecycle");
    addWarning(
      "review-lifecycle",
      "Review lifecycle validation issues found",
      "npm run reviews:lifecycle"
    );
  } else if (err.status === 2) {
    // I/O error — surface as error
    const sanitized = sanitizeError ? sanitizeError(err) : "[review lifecycle error]";
    const line0 = String(sanitized).split("\n")[0].replace(/\r$/, "");
    console.error(
      "❌ Review lifecycle error: " + sanitizeInput(line0) + " Fix: npm run reviews:lifecycle"
    );
    addWarning(
      "review-lifecycle-error",
      "Review lifecycle error: " + sanitizeInput(line0),
      "npm run reviews:lifecycle"
    );
  } else {
    // Other/unexpected error
    console.warn(
      "   ⚠️ Review lifecycle: unexpected exit code " +
        (err.status || "unknown") +
        ". Fix: npm run reviews:lifecycle"
    );
    addWarning(
      "review-lifecycle-unknown",
      "Review lifecycle unexpected exit code " + (err.status || "unknown"),
      "npm run reviews:lifecycle"
    );
  }
}

// Unified JSONL rotation (D11/D25: tiered rotation per config/rotation-policy.json)
try {
  execFileSync(process.execPath, ["scripts/rotate-jsonl.js"], {
    cwd: projectDir,
    stdio: ["ignore", "ignore", "pipe"],
    timeout: 10000,
  });
} catch (rotateErr) {
  // Non-fatal: log but don't block session start
  const rotateMsg = rotateErr instanceof Error ? rotateErr.message : String(rotateErr);
  if (rotateMsg && !rotateMsg.includes("exit code 0")) {
    const redactedMsg = rotateMsg
      .replaceAll(/C:\\Users\\[^\\]+/gi, "[USER_PATH]")
      .replaceAll(/\/home\/[^/\s]+/gi, "[HOME]")
      .replaceAll(/\/Users\/[^/\s]+/gi, "[HOME]")
      .replaceAll(/[A-Z]:\\[^\s]+/gi, "[PATH]");
    console.log(
      "   ⚠️ JSONL rotation: " +
        sanitizeInput(redactedMsg.split("\n")[0].replace(/\r$/, "")) +
        ". Fix: node scripts/rotate-jsonl.js --verbose"
    );
    addWarning(
      "jsonl-rotation",
      sanitizeInput(redactedMsg.split("\n")[0].replace(/\r$/, "")),
      "node scripts/rotate-jsonl.js --verbose"
    );
  }
}

// =============================================================================
// D16: Regenerate hook-warnings.json from canonical JSONL + ack state
// =============================================================================

const stateDir = path.join(projectDir, ".claude", "state");

/**
 * Read and parse a JSONL file with symlink and size guards.
 * @returns {{ entries: object[], error: string|null }}
 */
function readWarningsJsonl(filePath) {
  try {
    const st = fs.lstatSync(filePath);
    if (st.isSymbolicLink()) {
      return { entries: [], error: "symlink" };
    }
    if (st.size > 2 * 1024 * 1024) {
      return { entries: [], error: "oversized" };
    }
    const content = fs.readFileSync(filePath, "utf8").trim();
    if (!content) return { entries: [], error: null };
    const entries = content
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    return { entries, error: null };
  } catch (err) {
    if (err && err.code === "ENOENT") return { entries: [], error: "ENOENT" };
    return { entries: [], error: sanitizeError(err) };
  }
}

/**
 * Read acknowledgment state from disk.
 * @returns {{ acknowledged: object, lastCleared: string|null }}
 */
function readAckState(ackPath) {
  try {
    const ack = JSON.parse(fs.readFileSync(ackPath, "utf8"));
    if (!ack || typeof ack !== "object") return { acknowledged: {}, lastCleared: null };
    if (!ack.acknowledged || typeof ack.acknowledged !== "object") ack.acknowledged = {};
    return ack;
  } catch {
    return { acknowledged: {}, lastCleared: null };
  }
}

/**
 * Check if a single entry is acknowledged based on per-type and bulk clear timestamps.
 */
function isEntryAcknowledged(entryTime, entryType, ack) {
  const ackTime = ack.acknowledged[entryType];
  if (ackTime) {
    const ackMs = new Date(ackTime).getTime();
    if (!Number.isNaN(ackMs) && entryTime <= ackMs) return true;
  }
  if (ack.lastCleared) {
    const clearedMs = new Date(ack.lastCleared).getTime();
    if (!Number.isNaN(clearedMs) && entryTime <= clearedMs) return true;
  }
  return false;
}

/**
 * Filter entries to only unacknowledged ones with valid type and timestamp.
 */
function filterUnacknowledged(entries, ack) {
  return entries.filter((e) => {
    if (!e || typeof e !== "object") return false;
    if (typeof e.type !== "string" || !e.type) return false;
    const entryTime = new Date(e.timestamp).getTime();
    if (Number.isNaN(entryTime)) return false;
    return !isEntryAcknowledged(entryTime, e.type, ack);
  });
}

/**
 * Pre-compute total and since-ack occurrence counts per type.
 * @returns {{ typeTotals: object, typeSinceAckTotals: object }}
 */
function computeTypeCounts(entries, ack) {
  const typeTotals = Object.create(null);
  const typeSinceAckTotals = Object.create(null);
  for (const x of entries) {
    const type = x?.type;
    if (typeof type !== "string" || !type) continue;
    typeTotals[type] = (typeTotals[type] || 0) + 1;
    const xTime = new Date(x.timestamp).getTime();
    if (Number.isNaN(xTime)) continue;
    const ackTimeRaw = ack.acknowledged?.[type] || ack.lastCleared || null;
    if (!ackTimeRaw) {
      typeSinceAckTotals[type] = (typeSinceAckTotals[type] || 0) + 1;
      continue;
    }
    const ackMs = new Date(ackTimeRaw).getTime();
    if (Number.isNaN(ackMs) || xTime > ackMs) {
      typeSinceAckTotals[type] = (typeSinceAckTotals[type] || 0) + 1;
    }
  }
  return { typeTotals, typeSinceAckTotals };
}

/**
 * Format a raw warning entry into the sanitized output shape.
 */
function formatWarningEntry(e, typeTotals, typeSinceAckTotals, ack) {
  const total = typeTotals[e.type] || 0;
  const sinceAck =
    ack.acknowledged?.[e.type] || ack.lastCleared ? typeSinceAckTotals[e.type] || 0 : total;
  return {
    hook: sanitizeInput(String(e.hook || "")),
    type: sanitizeInput(String(e.type || "")),
    severity: sanitizeInput(String(e.severity || "")),
    message: sanitizeInput(String(e.message || "")),
    action: e.action ? sanitizeInput(String(e.action)) : null,
    timestamp: e.timestamp,
    ...(e.files
      ? { files: Array.isArray(e.files) ? e.files.map((f) => sanitizeInput(String(f))) : [] }
      : {}),
    ...(e.pattern ? { pattern: sanitizeInput(String(e.pattern)) } : {}),
    occurrences: total,
    occurrences_since_ack: sinceAck,
  };
}

/**
 * Write the warnings JSON atomically via tmp+rename.
 */
function writeWarningsFile(warningsPath, data) {
  try {
    if (!isSafeToWrite(warningsPath)) return;
    const tmpPath = `${warningsPath}.tmp`;
    const bakPath = `${warningsPath}.bak`;
    if (!isSafeToWrite(tmpPath) || !isSafeToWrite(bakPath)) return;

    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n");

    const hadExisting = fs.existsSync(warningsPath);
    let backedUp = false;
    if (hadExisting) {
      try {
        fs.rmSync(bakPath, { force: true });
      } catch {
        /* best-effort */
      }
      try {
        fs.renameSync(warningsPath, bakPath);
        backedUp = true;
      } catch {
        // If backup fails (locks/permissions), still attempt to write the new file
        backedUp = false;
      }
    }

    try {
      fs.renameSync(tmpPath, warningsPath);
      if (backedUp) {
        try {
          fs.rmSync(bakPath, { force: true });
        } catch {
          /* best-effort */
        }
      }
    } catch (renameErr) {
      try {
        if (backedUp && fs.existsSync(bakPath)) {
          fs.renameSync(bakPath, warningsPath);
        }
      } catch {
        /* best-effort */
      }
      try {
        fs.rmSync(tmpPath, { force: true });
      } catch {
        /* best-effort */
      }
      throw renameErr;
    }
  } catch (err) {
    console.error("session-start: failed to regenerate hook-warnings.json: " + sanitizeError(err));
  }
}

/**
 * Regenerate hook-warnings.json from the canonical JSONL source + ack state.
 * hook-warnings-log.jsonl is the single source of truth (D16).
 * hook-warnings-ack.json holds acknowledgment state (D30).
 * hook-warnings.json becomes a regenerated view: { warnings: [...] }
 *
 * @returns {object[]} The list of current (unacknowledged, deduplicated) warnings
 */
function regenerateHookWarnings() {
  const warningsLogPath = path.join(stateDir, "hook-warnings-log.jsonl");
  const ackPath = path.join(stateDir, "hook-warnings-ack.json");
  const warningsPath = path.join(projectDir, ".claude", "hook-warnings.json");

  // Read canonical JSONL
  const { entries, error: readError } = readWarningsJsonl(warningsLogPath);
  if (readError === "symlink") {
    console.error("session-start: hook-warnings-log.jsonl is a symlink — skipping regeneration");
    return [];
  }
  if (readError === "oversized") {
    console.error("session-start: hook-warnings-log.jsonl exceeds 2MB — skipping regeneration");
    return [];
  }
  if (readError && readError !== "ENOENT") {
    console.error(
      "session-start: failed to read hook-warnings-log.jsonl: " + sanitizeInput(readError)
    );
  }
  if (entries.length === 0) {
    writeWarningsFile(warningsPath, { warnings: [] });
    return [];
  }

  // Read ack state
  const ack = readAckState(ackPath);

  // Filter out resolved entries, then filter to unacknowledged
  const unresolved = entries.filter((e) => !e.resolved);
  const unacked = filterUnacknowledged(unresolved, ack);

  // Deduplicate by (hook, type, message) — keep most recent
  const seen = new Map();
  for (const e of unacked) {
    const key = `${e.hook}|${e.type}|${e.message}`;
    const existing = seen.get(key);
    if (!existing || new Date(e.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
      seen.set(key, e);
    }
  }

  // Pre-compute counts in one pass (O(n) vs O(n*m)) — PR #444 R2 fix #9
  const { typeTotals, typeSinceAckTotals } = computeTypeCounts(entries, ack);

  // Compute occurrence counts from pre-computed maps
  const warningsList = [...seen.values()].map((e) =>
    formatWarningEntry(e, typeTotals, typeSinceAckTotals, ack)
  );

  // Cap at 50, most recent first
  warningsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const capped = warningsList.slice(0, 50);

  // Write regenerated view
  writeWarningsFile(warningsPath, { warnings: capped });

  return capped;
}

// Resolve stale warnings before regenerating the view
try {
  execFileSync("node", [path.join(projectDir, "scripts", "resolve-hook-warnings.js")], {
    cwd: projectDir,
    stdio: "pipe",
    timeout: 15000,
  });
} catch (resolveErr) {
  // Best-effort — don't block session-start on resolve failure
  const msg = resolveErr && resolveErr.stdout ? resolveErr.stdout.toString().trim() : "";
  if (msg) console.log(`   ${sanitizeInput(msg)}`);
}

// Regenerate hook-warnings.json from canonical JSONL before any display/pipeline
const currentWarnings = regenerateHookWarnings();
if (currentWarnings.length > 0) {
  const errorCount = currentWarnings.filter((w) => w.severity === "error").length;
  const warnCount = currentWarnings.filter((w) => w.severity === "warning").length;
  const parts = [];
  if (errorCount > 0) parts.push(`${errorCount} error(s)`);
  if (warnCount > 0) parts.push(`${warnCount} warning(s)`);
  console.log(`Hook warnings: ${parts.join(", ")} (${currentWarnings.length} total)`);
  warnings += errorCount;
} else {
  console.log("Hook warnings: none");
}

// ─── Enforcement pipeline: discover gaps → refine → verify → ratchet ───
// (Automation Gap Closure spec: 2026-03-14)

// Lazy-load sanitizeError for pipeline error handling
if (!sanitizeError) {
  try {
    ({ sanitizeError } = require(path.join(projectDir, "scripts", "lib", "security-helpers.js")));
  } catch {
    sanitizeError = () => "error (details redacted)";
  }
}

/**
 * Execute a pipeline script with sanitized error logging.
 * @param {string[]} scriptArgs - Args for execFileSync (script path + flags)
 * @param {string} description - Label for warning output
 * @param {number} timeout - Timeout in ms
 * @param {string} fixCommand - Command to include as Fix: action path
 */
function executePipelineScript(scriptArgs, description, timeout, fixCommand) {
  try {
    execFileSync(process.execPath, scriptArgs, {
      cwd: projectDir,
      stdio: ["ignore", "ignore", "pipe"],
      timeout,
    });
  } catch (err) {
    const sanitized = sanitizeError(err);
    const fixSuffix = fixCommand ? ` Fix: ${fixCommand}` : "";
    const msg =
      description + ": " + sanitizeInput(String(sanitized).split("\n")[0].replace(/\r$/, ""));
    console.log("   ⚠️ " + msg + fixSuffix);
    addWarning(
      "pipeline-" + description.toLowerCase().replace(/\s+/g, "-"),
      msg,
      fixCommand || null
    );
  }
}

// 1. Route lifecycle gaps (discover new gaps → scaffolded entries)
executePipelineScript(
  ["scripts/route-lifecycle-gaps.js"],
  "Lifecycle gaps",
  15000,
  "npm run lifecycle:gaps"
);

// 2. Route enforcement gaps (discover CLAUDE.md gaps → scaffolded entries)
executePipelineScript(
  ["scripts/route-enforcement-gaps.js"],
  "Enforcement gaps",
  15000,
  "node scripts/route-enforcement-gaps.js --verbose"
);

// 3. Refine scaffolded entries (scaffolded → enforced or refined)
executePipelineScript(
  ["scripts/refine-scaffolds.js"],
  "Scaffold refinement",
  20000,
  "node scripts/refine-scaffolds.js --verbose"
);

// 4. Verify enforced entries (enforced → verified, or flag for repair)
executePipelineScript(
  ["scripts/verify-enforcement.js"],
  "Enforcement verify",
  30000,
  "node scripts/verify-enforcement.js --verbose"
);

// 5. Ratchet baselines (tighten thresholds on improvement, check-only mode)
executePipelineScript(
  ["scripts/ratchet-baselines.js", "--check-only"],
  "Ratchet baselines",
  20000,
  "node scripts/ratchet-baselines.js --check-only --verbose"
);

// Sync commit log from git history (fills gaps when commit-tracker hook misses)
try {
  execFileSync(process.execPath, ["scripts/seed-commit-log.js", "--sync"], {
    cwd: projectDir,
    stdio: "ignore",
    timeout: 20000,
  });
} catch (err) {
  // Non-fatal: commit log sync failure doesn't block session start
  const safeLine0 = sanitizeInput(String(sanitizeError(err)).split("\n")[0].replace(/\r$/, ""));
  console.warn(
    "Commit log sync failed: " + safeLine0 + ". Fix: node scripts/seed-commit-log.js --sync"
  );
}

// Rotate other state logs with archive-on-rotation (Findings 3, 6)
try {
  const { archiveRotateJsonl, rotateJsonl } = require("./lib/rotate-state.js");
  const hookWarningsPath = path.join(projectDir, ".claude", "state", "hook-warnings-log.jsonl");
  // rotateJsonl/archiveRotateJsonl internally handle missing files gracefully
  const hwResult = archiveRotateJsonl(hookWarningsPath, 50, 30);
  if (hwResult && hwResult.rotated) {
    console.log(
      `   🔄 hook-warnings-log.jsonl rotated: ${hwResult.before} → ${hwResult.after} entries (${hwResult.archived} archived)`
    );
  }
  const healthScorePath = path.join(projectDir, ".claude", "state", "health-score-log.jsonl");
  const hsResult = rotateJsonl(healthScorePath, 30, 20);
  if (hsResult && hsResult.rotated) {
    console.log(
      `   🔄 health-score-log.jsonl rotated: ${hsResult.before} → ${hsResult.after} entries`
    );
  }
} catch {
  // Non-fatal
}

// Technical Debt health check (TDMS)
try {
  const metricsPath = path.join(projectDir, "docs", "technical-debt", "metrics.json");
  let metricsRaw;
  try {
    metricsRaw = fs.readFileSync(metricsPath, "utf8");
  } catch {
    metricsRaw = null;
  }
  if (metricsRaw !== null) {
    const metrics = JSON.parse(metricsRaw);
    const s0Count = metrics.by_severity?.S0 ?? 0;
    const s1Count = metrics.by_severity?.S1 ?? 0;
    const total = metrics.summary?.total ?? 0;
    const resolved = metrics.summary?.resolved ?? 0;
    console.log(`📊 TDMS: ${total} items (${resolved} resolved)`);
    if (s0Count > 0) {
      console.log(`   🔴 S0: ${s0Count} critical`);
      addWarning(
        "tdms-s0",
        `S0: ${s0Count} critical debt items`,
        "npm run debt:report --severity=S0"
      );
    }
    if (s1Count > 10) {
      console.log(
        `   🟡 S1: ${s1Count} high (threshold: 10). Action: npm run debt:report --severity=S1`
      );
    }
  } else {
    console.log("📊 TDMS: ⚠️ metrics not found — npm run debt:metrics");
    addWarning("tdms-missing", "TDMS metrics not found", "npm run debt:metrics");
  }
} catch (err) {
  console.error(`📊 TDMS: ❌ metrics read failed: ${sanitizeError(err)}`);
  addWarning("tdms-error", "TDMS metrics read failed", null);
}

// Step 13: Health quick check (non-blocking)
try {
  const healthOutput = execFileSync(
    process.execPath,
    ["scripts/health/run-health-check.js", "--quick"],
    {
      cwd: projectDir,
      encoding: "utf8",
      stdio: "pipe",
      timeout: 10000,
    }
  );
  const scoreLine = healthOutput.split("\n").find((l) => l.includes("Composite:"));
  if (scoreLine) {
    console.log(`Health: ${scoreLine.trim()}`);
  }
} catch {
  console.log("Health: skipped (non-fatal)");
}

// C5-G3: Health score delta from health-score-log.jsonl (grade + delta, 2+ grade drop = warning)
try {
  const gradeOrder = ["A", "B", "C", "D", "F"];
  const hsLogPath = path.join(projectDir, ".claude", "state", "health-score-log.jsonl");
  const hsContent = fs.readFileSync(hsLogPath, "utf8");
  const hsLines = hsContent.trim().split("\n").filter(Boolean);
  if (hsLines.length >= 2) {
    const current = JSON.parse(hsLines[hsLines.length - 1]);
    const previous = JSON.parse(hsLines[hsLines.length - 2]);
    const curIdx = gradeOrder.indexOf(current.grade);
    const prevIdx = gradeOrder.indexOf(previous.grade);
    const scoreDelta = current.score - previous.score;
    const deltaStr = scoreDelta >= 0 ? `+${scoreDelta}` : `${scoreDelta}`;
    if (curIdx >= 0 && prevIdx >= 0 && curIdx - prevIdx >= 2) {
      console.log(
        `   ⚠️ Health grade dropped ${previous.grade} → ${current.grade} (${deltaStr}pts). Action: run /alerts --full for details`
      );
      addWarning(
        "health-grade-drop",
        `Health grade dropped ${previous.grade} → ${current.grade} (${deltaStr}pts)`,
        "Run /alerts --full"
      );
    } else if (curIdx >= 0 && prevIdx >= 0 && curIdx !== prevIdx) {
      const arrow = curIdx < prevIdx ? "↑" : "↓";
      console.log(
        `   ${arrow} Health trend: ${previous.grade} → ${current.grade} (${deltaStr}pts)`
      );
    }
  }
} catch {
  // Non-fatal — health-score-log.jsonl may not exist yet
}

// DS-6: Log session start to session-activity.jsonl
try {
  execFileSync(process.execPath, ["scripts/log-session-activity.js", "--event=session_start"], {
    cwd: projectDir,
    encoding: "utf8",
    stdio: "pipe",
    timeout: 5000,
  });
} catch (error) {
  // Non-critical — log for debuggability but don't block session start
  console.error("session-start: activity logging failed:", sanitizeError(error));
}

// CLI tool detection from tool-manifest.json
try {
  const manifestPath = path.join(projectDir, ".claude", "tool-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const missing = [];
  for (const [name, info] of Object.entries(manifest.tools || {})) {
    const checkRaw = info?.check;
    const argv = Array.isArray(checkRaw)
      ? checkRaw.map((v) => String(v))
      : typeof checkRaw === "string" && checkRaw.trim()
        ? checkRaw.trim().split(/\s+/)
        : [];
    if (argv.length === 0) {
      missing.push(sanitizeInput(String(name)));
      continue;
    }
    const [bin, ...args] = argv;
    if (!/^(?!\.\.?$)[\w.-]+$/.test(bin)) {
      missing.push(sanitizeInput(String(name)));
      continue; // unsafe binary name
    }
    const joined = argv.join(" ");
    // eslint-disable-next-line no-control-regex -- intentional: reject control chars in manifest args
    if (args.length > 8 || joined.length > 200 || /[\x00-\x1f\x7f]/.test(joined)) {
      missing.push(sanitizeInput(String(name)));
      continue; // invalid arguments
    }
    try {
      execFileSync(bin, args, { stdio: "pipe", timeout: 3000 });
    } catch {
      missing.push(sanitizeInput(String(name)));
    }
  }
  if (missing.length > 0) {
    console.log(
      `   ⚠️ CLI tools missing: ${missing.join(", ")}. Fix: bash scripts/install-cli-tools.sh`
    );
    addWarning(
      "cli-tools-missing",
      `CLI tools missing: ${missing.join(", ")}`,
      "bash scripts/install-cli-tools.sh"
    );
  }
} catch {
  // Non-fatal — tool manifest may not exist or be unreadable
}

// Persist session-start warnings to JSONL so statusline can display them
if (warningEntries.length > 0) {
  try {
    const logDir = path.join(projectDir, ".claude", "state");
    const logPath = path.join(logDir, "hook-warnings-log.jsonl");
    let guardOk = false;
    try {
      const { isSafeToWrite: safe } = require(
        path.join(projectDir, ".claude", "hooks", "lib", "symlink-guard")
      );
      guardOk = Boolean(safe(logPath));
    } catch {
      // Guard missing/unloadable — fail closed, skip persistence
    }
    if (guardOk) {
      fs.mkdirSync(logDir, { recursive: true });
      // Read current lastCleared and set timestamps 1s after it,
      // so warnings survive even if a concurrent session set lastCleared
      // moments before this flush runs
      let ts = new Date().toISOString();
      try {
        const ackRaw = fs.readFileSync(path.join(logDir, "hook-warnings-ack.json"), "utf8");
        const ackData = JSON.parse(ackRaw);
        if (ackData.lastCleared) {
          const afterCleared = new Date(new Date(ackData.lastCleared).getTime() + 1000);
          const now = new Date();
          ts = (afterCleared > now ? afterCleared : now).toISOString();
        }
      } catch {
        /* no ack file — use current time */
      }
      const lines = warningEntries.map((w) =>
        JSON.stringify({
          hook: "session-start",
          type: w.type,
          severity: "warning",
          message: w.message,
          action: w.action,
          timestamp: ts,
          actor: "hook-system",
          user: "redacted",
          outcome: "warned",
        })
      );
      fs.appendFileSync(logPath, lines.join("\n") + "\n");
    }
  } catch (persistErr) {
    // Non-fatal — never block session start on warning persistence
    console.warn(`session-start: warning persistence failed: ${sanitizeError(persistErr)}`);
  }
}

// --- Todo summary ---
try {
  const todosPath = path.join(baseDir, ".planning", "todos.jsonl");
  if (fs.existsSync(todosPath)) {
    const todoLines = fs
      .readFileSync(todosPath, "utf-8")
      .split("\n")
      .filter((l) => l.trim())
      .slice(-500);
    const todos = [];
    for (const line of todoLines) {
      try {
        todos.push(JSON.parse(line));
      } catch {
        /* skip malformed */
      }
    }
    const active = todos.filter((t) => !["completed", "archived"].includes(t.status));
    if (active.length > 0) {
      const p0 = active.filter((t) => t.priority === "P0").length;
      const p1 = active.filter((t) => t.priority === "P1").length;
      const parts = [];
      if (p0 > 0) parts.push(`${p0} P0`);
      if (p1 > 0) parts.push(`${p1} P1`);
      const detail = parts.length > 0 ? ` (${parts.join(", ")})` : "";
      console.log(`📋 Todos: ${active.length} active${detail} — run /todo to manage`);
    }
  }
} catch {
  // Non-fatal — never block session start on todo read failure
}

console.log("");
if (warnings === 0) {
  console.log("✅ SessionStart complete");
} else {
  console.log(`⚠️ SessionStart completed with ${warnings} warning(s)`);
}
console.log("📋 Next: /session-begin or start working");
console.log("ok");
