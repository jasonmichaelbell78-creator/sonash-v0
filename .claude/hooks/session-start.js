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

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Only run in Claude Code on the web (remote environments)
if (process.env.CLAUDE_CODE_REMOTE !== "true") {
  process.exit(0);
}

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

console.log("🚀 SessionStart Hook for sonash-v0");
console.log("━".repeat(66));

// Log environment (secure: excludes PWD to avoid exposing sensitive paths)
console.log("📋 Environment:");
try {
  const nodeVersion = execSync("node -v", { encoding: "utf8" }).trim();
  console.log(`   Node: ${nodeVersion}`);
} catch {
  console.log("   Node: not found");
}
try {
  const npmVersion = execSync("npm -v", { encoding: "utf8" }).trim();
  console.log(`   npm:  ${npmVersion}`);
} catch {
  console.log("   npm:  not found");
}
console.log("");

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
  fs.writeFileSync(LOCKFILE_HASH_FILE, hash);
}

function saveFunctionsHash() {
  const hash = computeHash("functions/package-lock.json");
  if (!hash) return; // Don't write invalid hash
  const dir = path.dirname(FUNCTIONS_LOCKFILE_HASH_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FUNCTIONS_LOCKFILE_HASH_FILE, hash);
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

// Build test files
runCommand("Building test files", "npm run test:build", 60000);

console.log("");

// Pattern compliance check
console.log("🔍 Checking for known anti-patterns...");
try {
  execSync("node scripts/check-pattern-compliance.js", { stdio: "pipe" });
  console.log("   ✓ No pattern violations found");
} catch (error) {
  const exitCode = error.status || 1;
  if (exitCode >= 2) {
    console.log(`   ❌ Pattern checker failed (exit ${exitCode})`);
  } else {
    console.log("   ⚠️ Pattern violations detected - see docs/agent_docs/CODE_PATTERNS.md");
    console.log("   Run: npm run patterns:check-all for details");
  }
  warnings++;
}

console.log("");

// Consolidation status check
console.log("🔍 Checking consolidation status...");
try {
  const output = execSync("node scripts/check-consolidation-status.js", { encoding: "utf8" });
  console.log(output.trim());
} catch (error) {
  const exitCode = error.status || 1;
  if (exitCode === 1) {
    console.log(error.stdout || "");
    console.log("   ⚠️ Consolidation or archiving action needed - see output above");
  } else {
    console.log(`   ❌ Consolidation checker failed (exit ${exitCode})`);
  }
  warnings++;
}

console.log("");

// Backlog health check
console.log("🔍 Checking backlog health...");
try {
  const output = execSync("node scripts/check-backlog-health.js", {
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 10 * 1024 * 1024,
  });
  console.log(output.trim());
} catch (error) {
  const exitCode = error.status || 1;
  if (exitCode === 1) {
    console.log(error.stdout || "");
    console.log("   ⚠️ Backlog needs attention - see output above");
  } else {
    console.log(`   ❌ Backlog checker failed (exit ${exitCode})`);
  }
  warnings++;
}

console.log("");
console.log("━".repeat(66));
if (warnings === 0) {
  console.log("✅ SessionStart hook completed successfully!");
} else {
  console.log(`⚠️ SessionStart hook completed with ${warnings} warning(s)`);
  console.log("   Some steps may have failed - check output above.");
}

console.log("");
console.log("━".repeat(66));
console.log("📋 SESSION CHECKLIST (from AI_WORKFLOW.md):");
console.log("");
console.log("  1. ☐ Read SESSION_CONTEXT.md (current status, next goals)");
console.log("  2. ☐ Increment session counter in SESSION_CONTEXT.md");
console.log("  3. ☐ Check ROADMAP.md for priority changes");
console.log("  4. ☐ Check available skills BEFORE starting:");
console.log("");
console.log("      SKILL DECISION TREE:");
console.log("      ├─ Bug/Error? → Use 'systematic-debugging' skill FIRST");
console.log("      ├─ Writing code? → Use 'code-reviewer' agent AFTER");
console.log("      ├─ Security work? → Use 'security-auditor' agent");
console.log("      ├─ UI/Frontend? → Use 'frontend-design' skill");
console.log("      └─ Complex task? → Check ls .claude/skills/ for matches");
console.log("");
console.log("  5. ☐ Review active blockers before starting work");
console.log("");
console.log("━".repeat(66));
console.log("");
console.log("💡 Tips:");
console.log("   - Review claude.md + docs/agent_docs/CODE_PATTERNS.md for anti-patterns");
console.log("   - Use TodoWrite for complex tasks (3+ steps)");
console.log("   - Update SESSION_CONTEXT.md at end of session");
