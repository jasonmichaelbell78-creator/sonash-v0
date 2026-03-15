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
    return JSON.parse(fs.readFileSync(SESSION_STATE_FILE, "utf8"));
  } catch (err) {
    if (err && err.code !== "ENOENT") {
      console.error(
        `session-start: failed to read session state: ${sanitizeInput(err instanceof Error ? err.message : String(err))}`
      );
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
    console.warn(
      `session-start: failed to save root lockfile hash: ${sanitizeInput(err instanceof Error ? err.message : String(err))}`
    );
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
    console.warn(
      `session-start: failed to save functions lockfile hash: ${sanitizeInput(err instanceof Error ? err.message : String(err))}`
    );
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
    console.log(`🔍 Patterns: ❌ failed (exit ${exitCode})`);
  } else {
    console.log("🔍 Patterns: ⚠️ violations detected — npm run patterns:check-all");
  }
  warnings++;
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
    console.log(`🔍 Consolidation: ❌ failed (exit ${exitCode})`);
    warnings++;
  } else if (exitCode === 1) {
    const stdout = (error.stdout || "").toString().trim();
    if (stdout) console.log(stdout);
    console.log("🔍 Consolidation: ⚠️ exit code 1 (unexpected for --auto)");
  }
}

// Review lifecycle orchestrator (sync, archive, rotate, validate, render)
try {
  execFileSync(process.execPath, [
    path.join(__dirname, "..", "scripts", "review-lifecycle.js")
  ], {
    cwd: projectDir,
    stdio: "pipe",
    timeout: 30000,
  });
  console.log("🔍 Review lifecycle: ✓ complete");
} catch (err) {
  if (err.status === 1) {
    // Validation issues — surface as blocking warning
    console.error("⚠️ Review lifecycle validation issues found:");
    console.error(err.stdout ? err.stdout.toString() : err.stderr ? err.stderr.toString() : "Unknown validation issue");
    warnings++;
  } else if (err.status === 2) {
    // I/O error — surface as error
    const sanitized = sanitizeError ? sanitizeError(err) : (err instanceof Error ? err.message : String(err));
    console.error("❌ Review lifecycle error: " + sanitizeInput(String(sanitized).split("\n")[0]));
    warnings++;
  } else {
    // Other/unexpected error
    console.log("   ⚠️ Review lifecycle: unexpected exit code " + (err.status || "unknown"));
    warnings++;
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
    console.log("   ⚠️ JSONL rotation: " + sanitizeInput(redactedMsg.split("\n")[0]));
    warnings++;
  }
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
 */
function executePipelineScript(scriptArgs, description, timeout) {
  try {
    execFileSync(process.execPath, scriptArgs, {
      cwd: projectDir,
      stdio: ["ignore", "ignore", "pipe"],
      timeout,
    });
  } catch (err) {
    const sanitized = sanitizeError(err);
    console.log("   ⚠️ " + description + ": " + sanitizeInput(String(sanitized).split("\n")[0]));
    warnings++;
  }
}

// 1. Route lifecycle gaps (discover new gaps → scaffolded entries)
executePipelineScript(["scripts/route-lifecycle-gaps.js"], "Lifecycle gaps", 15000);

// 2. Route enforcement gaps (discover CLAUDE.md gaps → scaffolded entries)
executePipelineScript(["scripts/route-enforcement-gaps.js"], "Enforcement gaps", 15000);

// 3. Refine scaffolded entries (scaffolded → enforced or refined)
executePipelineScript(["scripts/refine-scaffolds.js"], "Scaffold refinement", 20000);

// 4. Verify enforced entries (enforced → verified, or flag for repair)
executePipelineScript(["scripts/verify-enforcement.js"], "Enforcement verify", 30000);

// 5. Ratchet baselines (tighten thresholds on improvement, check-only mode)
executePipelineScript(["scripts/ratchet-baselines.js", "--check-only"], "Ratchet baselines", 20000);

// Sync commit log from git history (fills gaps when commit-tracker hook misses)
try {
  execFileSync(process.execPath, ["scripts/seed-commit-log.js", "--sync"], {
    cwd: projectDir,
    stdio: "ignore",
    timeout: 20000,
  });
} catch (err) {
  // Non-fatal: commit log sync failure doesn't block session start
  console.warn("Commit log sync failed:", err instanceof Error ? err.message : String(err));
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
      warnings++;
    }
    if (s1Count > 10) {
      console.log(`   🟡 S1: ${s1Count} high (threshold: 10)`);
    }
  } else {
    console.log("📊 TDMS: ⚠️ metrics not found — npm run debt:metrics");
    warnings++;
  }
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.log(`📊 TDMS: ❌ metrics read failed: ${msg}`);
  warnings++;
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
        `   ⚠️ Health grade dropped ${previous.grade} → ${current.grade} (${deltaStr}pts)`
      );
      warnings++;
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
  console.error(
    "session-start: activity logging failed:",
    error instanceof Error ? error.message : String(error)
  );
}

console.log("");
if (warnings === 0) {
  console.log("✅ SessionStart complete");
} else {
  console.log(`⚠️ SessionStart completed with ${warnings} warning(s)`);
}
console.log("📋 Next: /session-begin or start working");
console.log("ok");
