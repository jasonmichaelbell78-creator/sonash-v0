#!/usr/bin/env node
/**
 * eval-sonarcloud-improvements.js - Test runner for PR #337 SonarCloud improvements
 *
 * Validates the security fixes, error handling, pattern compliance, and
 * infrastructure changes from Review #250.
 *
 * Usage:
 *   node scripts/eval/eval-sonarcloud-improvements.js [stage|all|automated]
 *
 * Stages:
 *   T1  - Skill loading (sonarcloud SKILL.md structure)
 *   T2  - State-utils path traversal prevention
 *   T3  - State-utils steps concat (no data loss)
 *   T4  - Sync-sonarcloud error handling (loadMasterDebt)
 *   T5  - Pattern compliance (zero violations)
 *   T6  - ESLint ignores archived scripts
 *   T7  - Archive references (no stale refs)
 *   T8  - Atomic write (tmp+rename in sync-sonarcloud)
 *   T9  - Agent-trigger-enforcer path normalization
 *   T10 - COMMAND_REFERENCE dedup validation
 *
 * Writes results to: /tmp/eval-sonarcloud-results.jsonl
 *
 * Status: TEMPORARY - Remove after PR #337 validation complete
 */

/* global __dirname */
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../..");
const RESULTS_FILE = "/tmp/eval-sonarcloud-results.jsonl";

// ============================================================================
// Helpers
// ============================================================================

function result(stage, name, pass, details) {
  const entry = {
    stage,
    name,
    pass,
    details,
    timestamp: new Date().toISOString(),
  };
  fs.appendFileSync(RESULTS_FILE, JSON.stringify(entry) + "\n");
  const icon = pass ? "✅" : "❌";
  console.log(`  ${icon} ${stage}: ${name}${pass ? "" : ` — ${details}`}`);
  return entry;
}

function runCmd(cmd, opts = {}) {
  try {
    return {
      ok: true,
      stdout: execSync(cmd, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 30000,
        ...opts,
      }).trim(),
    };
  } catch (err) {
    return {
      ok: false,
      stdout: (err.stdout || "").toString().trim(),
      stderr: (err.stderr || "").toString().trim(),
      code: err.status,
    };
  }
}

// ============================================================================
// T1: Skill Loading - Verify /sonarcloud SKILL.md structure
// ============================================================================

function testT1() {
  console.log("\n📋 T1: Sonarcloud Skill Structure");
  const results = [];
  const skillPath = path.join(ROOT, ".claude/skills/sonarcloud/SKILL.md");

  // Check file exists
  if (!fs.existsSync(skillPath)) {
    results.push(result("T1.1", "SKILL.md exists", false, "File not found"));
    return results;
  }
  results.push(result("T1.1", "SKILL.md exists", true, ""));

  const content = fs.readFileSync(skillPath, "utf8");

  // Check frontmatter
  const hasFrontmatter = /^---\n[\s\S]*?name:\s*sonarcloud[\s\S]*?---/m.test(content);
  results.push(
    result("T1.2", "Valid YAML frontmatter", hasFrontmatter, "Missing or invalid frontmatter")
  );

  // Check all 6 modes documented
  const modes = ["sync", "resolve", "full", "report", "status", "sprint"];
  const missingModes = modes.filter((m) => !content.includes(`**${m}**`));
  results.push(
    result(
      "T1.3",
      "All 6 modes documented",
      missingModes.length === 0,
      `Missing: ${missingModes.join(", ")}`
    )
  );

  // Check no executable curl+token in sync/report/sprint code blocks (Review #250 fix)
  // Acceptable: inline backtick mentions in security notes, status mode read-only shortcut
  const beforeStatus = content.split(/## Mode:\s*status/)[0] || "";
  // Extract fenced code blocks (```...```) from sync/report/sprint sections
  const codeBlocks = beforeStatus.match(/```[\s\S]*?```/g) || [];
  const curlInCodeBlock = codeBlocks.some((block) =>
    /curl\s[^|]*-u\s+["']?\$SONAR_TOKEN/.test(block)
  );
  results.push(
    result(
      "T1.4",
      "No curl+SONAR_TOKEN in sync/report code blocks",
      !curlInCodeBlock,
      "Security: Token exposure in executable curl commands"
    )
  );

  // Check security note present
  const hasSecurityNote = /Security Note/i.test(content);
  results.push(
    result(
      "T1.5",
      "Security note present",
      hasSecurityNote,
      "Missing security note about token handling"
    )
  );

  return results;
}

// ============================================================================
// T2: State-utils Path Traversal Prevention
// ============================================================================

function testT2() {
  console.log("\n🔒 T2: State-utils Path Traversal Prevention");
  const results = [];

  // Load the module
  const stateUtils = require(path.join(ROOT, ".claude/hooks/state-utils.js"));

  // Test validateFilename with malicious inputs
  const maliciousInputs = [
    { input: "../etc/passwd", desc: "parent directory traversal" },
    { input: "../../etc/shadow", desc: "double parent traversal" },
    { input: "sub/dir/file.json", desc: "subdirectory path" },
    { input: "/etc/passwd", desc: "absolute path" },
    { input: "", desc: "empty string" },
    { input: null, desc: "null value" },
    { input: undefined, desc: "undefined value" },
    { input: 42, desc: "numeric value" },
    { input: "..\\windows\\system32", desc: "Windows-style traversal" },
  ];

  for (const { input, desc } of maliciousInputs) {
    const rejected = stateUtils.validateFilename(input) === false;
    results.push(
      result("T2.1", `Rejects ${desc}: ${JSON.stringify(input)}`, rejected, "Should return false")
    );
  }

  // Test valid filenames are accepted
  const validInputs = [
    "handoff.json",
    "task-sonar.state.json",
    "pending-reviews.json",
    "test-file.tmp",
  ];

  for (const input of validInputs) {
    const accepted = stateUtils.validateFilename(input) === true;
    results.push(result("T2.2", `Accepts valid: ${input}`, accepted, "Should return true"));
  }

  // Test readState/writeState/deleteState reject traversal
  const tmpDir = "/tmp/eval-state-test-" + Date.now();
  fs.mkdirSync(tmpDir, { recursive: true });

  const readResult = stateUtils.readState(tmpDir, "../etc/passwd");
  results.push(
    result(
      "T2.3",
      "readState rejects traversal",
      readResult === null,
      `Got: ${JSON.stringify(readResult)}`
    )
  );

  const writeResult = stateUtils.writeState(tmpDir, "../evil.json", { hack: true });
  results.push(
    result("T2.4", "writeState rejects traversal", writeResult === false, `Got: ${writeResult}`)
  );

  const deleteResult = stateUtils.deleteState(tmpDir, "../important.json");
  results.push(
    result("T2.5", "deleteState rejects traversal", deleteResult === false, `Got: ${deleteResult}`)
  );

  // Cleanup
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore
  }

  return results;
}

// ============================================================================
// T3: State-utils Steps Concat (No Data Loss)
// ============================================================================

function testT3() {
  console.log("\n📝 T3: State-utils Steps Concat");
  const results = [];
  const stateUtils = require(path.join(ROOT, ".claude/hooks/state-utils.js"));

  const tmpDir = "/tmp/eval-steps-test-" + Date.now();
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync(path.join(tmpDir, ".claude/state"), { recursive: true });

  // Create initial state with steps
  const initialSteps = [
    { name: "Step 1", status: "completed" },
    { name: "Step 2", status: "completed" },
  ];
  stateUtils.updateTaskState(tmpDir, "test-concat", { steps: initialSteps });

  // Update with new steps
  const newSteps = [{ name: "Step 3", status: "in_progress" }];
  const updated = stateUtils.updateTaskState(tmpDir, "test-concat", { steps: newSteps });

  // Verify ALL steps are preserved (concat, not overwrite)
  const totalSteps = updated.steps ? updated.steps.length : 0;
  results.push(
    result(
      "T3.1",
      "Steps are concatenated (3 total)",
      totalSteps === 3,
      `Expected 3 steps, got ${totalSteps}: ${JSON.stringify(updated.steps?.map((s) => s.name))}`
    )
  );

  // Verify original steps preserved
  const hasStep1 = updated.steps?.some((s) => s.name === "Step 1");
  const hasStep2 = updated.steps?.some((s) => s.name === "Step 2");
  const hasStep3 = updated.steps?.some((s) => s.name === "Step 3");
  results.push(result("T3.2", "Original Step 1 preserved", hasStep1 === true, "Step 1 missing"));
  results.push(result("T3.3", "Original Step 2 preserved", hasStep2 === true, "Step 2 missing"));
  results.push(result("T3.4", "New Step 3 appended", hasStep3 === true, "Step 3 missing"));

  // Test context merge (not overwrite)
  stateUtils.updateTaskState(tmpDir, "test-context", {
    context: { branch: "main", notes: "initial" },
  });
  const ctxUpdated = stateUtils.updateTaskState(tmpDir, "test-context", {
    context: { files_modified: ["a.js"] },
  });
  const hasBranch = ctxUpdated.context?.branch === "main";
  const hasFiles = Array.isArray(ctxUpdated.context?.files_modified);
  results.push(
    result(
      "T3.5",
      "Context merge preserves existing keys",
      hasBranch && hasFiles,
      "Context key lost"
    )
  );

  // Cleanup
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore
  }

  return results;
}

// ============================================================================
// T4: Sync-Sonarcloud Error Handling
// ============================================================================

function testT4() {
  console.log("\n🛡️ T4: Sync-Sonarcloud Error Handling");
  const results = [];

  const syncPath = path.join(ROOT, "scripts/debt/sync-sonarcloud.js");
  const content = fs.readFileSync(syncPath, "utf8");

  // Check loadMasterDebt has try/catch around readFileSync
  const loadFnMatch = content.match(
    /function\s+loadMasterDebt[\s\S]*?(?=\nfunction\s|\n\/\/\s*(?:Load|Resolve|Log|Map|Main))/
  );
  if (!loadFnMatch) {
    results.push(result("T4.1", "loadMasterDebt function found", false, "Function not found"));
    return results;
  }
  results.push(result("T4.1", "loadMasterDebt function found", true, ""));

  const loadFn = loadFnMatch[0];
  const hasReadTryCatch = /try\s*\{[\s\S]*?readFileSync[\s\S]*?\}\s*catch/.test(loadFn);
  results.push(
    result("T4.2", "readFileSync wrapped in try/catch", hasReadTryCatch, "Missing try/catch")
  );

  // Check instanceof Error pattern in error handling functions (Review #250 scope)
  // Scoped to loadMasterDebt, logResolution, resolveStaleItems — not the
  // top-level main().catch which is outside Review #250 scope
  const scopedFunctions =
    content.match(
      /function\s+(?:loadMasterDebt|logResolution|resolveStaleItems)[\s\S]*?(?=\nfunction\s|\nasync\s+function\s|\nmodule\.exports)/g
    ) || [];
  // Extract catch blocks and verify each one with err.message also has instanceof
  let rawErrFound = false;
  for (const fn of scopedFunctions) {
    const catches = fn.match(/catch\s*\(\s*err\s*\)\s*\{[^}]*\}/g) || [];
    for (const catchBlock of catches) {
      if (catchBlock.includes("err.message") && !catchBlock.includes("instanceof")) {
        rawErrFound = true;
      }
    }
  }
  results.push(
    result(
      "T4.3",
      "Uses instanceof Error in scoped functions",
      !rawErrFound,
      "Found raw err.message without instanceof check"
    )
  );

  // Check logResolution has try/catch
  const logResFnMatch = content.match(
    /function\s+logResolution[\s\S]*?(?=\n\n\/\/|\nfunction\s|\nasync\s+function)/
  );
  if (logResFnMatch) {
    const logResFn = logResFnMatch[0];
    const hasLogTryCatch = /try\s*\{[\s\S]*?\}\s*catch/.test(logResFn);
    results.push(
      result("T4.4", "logResolution wrapped in try/catch", hasLogTryCatch, "Missing try/catch")
    );

    const hasWarnLevel = /console\.warn/.test(logResFn);
    results.push(
      result(
        "T4.5",
        "logResolution uses console.warn (non-fatal)",
        hasWarnLevel,
        "Should use warn, not error"
      )
    );
  }

  // Check title guard
  const hasTitleGuard = /typeof\s+item\.title\s*===?\s*["']string["']/.test(content);
  results.push(
    result(
      "T4.6",
      "Title guard (typeof check)",
      hasTitleGuard,
      "Missing typeof check for item.title"
    )
  );

  // Check atomic write pattern (template literal creates .tmp suffix)
  const hasAtomicWrite =
    /\.tmp[`'"]/.test(content) && /writeFileSync/.test(content) && /renameSync/.test(content);
  results.push(
    result("T4.7", "Atomic write (tmp+rename)", hasAtomicWrite, "Missing atomic write pattern")
  );

  return results;
}

// ============================================================================
// T5: Pattern Compliance (Zero Violations)
// ============================================================================

function testT5() {
  console.log("\n🔍 T5: Pattern Compliance");
  const results = [];

  const cmd = runCmd("node scripts/check-pattern-compliance.js 2>&1");
  const combinedOut = (cmd.stdout || "") + (cmd.stderr || "");
  const violationMatch = combinedOut.match(/(\d+)\s+violation/i);
  const count = violationMatch ? parseInt(violationMatch[1], 10) : 0;

  results.push(
    result("T5.1", "Pattern compliance check passes", cmd.ok, `Exit code ${cmd.code || 0}`)
  );
  results.push(result("T5.2", "Zero violations", count === 0, `Found ${count} violations`));

  // Verify GLOBAL_EXCLUDE includes docs/archive/
  const complianceScript = fs.readFileSync(
    path.join(ROOT, "scripts/check-pattern-compliance.js"),
    "utf8"
  );
  const hasArchiveExclude = /docs\/archive/.test(complianceScript);
  results.push(
    result(
      "T5.3",
      "GLOBAL_EXCLUDE includes docs/archive/",
      hasArchiveExclude,
      "Missing archive exclusion"
    )
  );

  return results;
}

// ============================================================================
// T6: ESLint Ignores Archived Scripts
// ============================================================================

function testT6() {
  console.log("\n📦 T6: ESLint Archive Exclusion");
  const results = [];

  const archiveDir = path.join(ROOT, "docs/archive");
  if (!fs.existsSync(archiveDir)) {
    results.push(result("T6.1", "Archive directory exists", false, "docs/archive/ not found"));
    return results;
  }
  results.push(result("T6.1", "Archive directory exists", true, ""));

  // Check .eslintignore or eslint config excludes docs/archive
  const eslintIgnorePath = path.join(ROOT, ".eslintignore");
  let archiveIgnored = false;

  if (fs.existsSync(eslintIgnorePath)) {
    const ignoreContent = fs.readFileSync(eslintIgnorePath, "utf8");
    archiveIgnored = /docs\/archive/.test(ignoreContent);
  }

  // Also check eslint.config or package.json eslintConfig
  if (!archiveIgnored) {
    const pkgPath = path.join(ROOT, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      const eslintConfig = pkg.eslintConfig || {};
      archiveIgnored = JSON.stringify(eslintConfig).includes("docs/archive");
    }
  }

  // Check eslint flat config files
  if (!archiveIgnored) {
    const eslintConfigFiles = [
      "eslint.config.js",
      "eslint.config.mjs",
      ".eslintrc.js",
      ".eslintrc.json",
    ];
    for (const configFile of eslintConfigFiles) {
      const configPath = path.join(ROOT, configFile);
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, "utf8");
        if (/docs\/archive/.test(configContent)) {
          archiveIgnored = true;
          break;
        }
      }
    }
  }

  results.push(
    result(
      "T6.2",
      "Archive excluded from ESLint config",
      archiveIgnored,
      "docs/archive/ not found in ESLint ignore/config"
    )
  );

  // Run ESLint on archive to verify
  const eslintResult = runCmd(
    'npx eslint "docs/archive/**/*.js" --no-error-on-unmatched-pattern 2>&1'
  );
  const lintPassed =
    eslintResult.ok || eslintResult.stdout.includes("0 errors") || eslintResult.stdout === "";
  results.push(
    result(
      "T6.3",
      "ESLint on docs/archive/ returns no errors",
      lintPassed,
      eslintResult.stderr || ""
    )
  );

  return results;
}

// ============================================================================
// T7: Archive References (No Stale Refs)
// ============================================================================

function testT7() {
  console.log("\n🗂️ T7: Archive Reference Hygiene");
  const results = [];

  // Check that extract-sonarcloud references in scripts/ are only archive-aware
  // Exclude: this eval script (self-reference), and lines mentioning archive/ARCHIVED/obsolete
  const grepResult = runCmd(
    'grep -rn "extract-sonarcloud" scripts/ --include="*.js" 2>/dev/null || true'
  );

  if (grepResult.stdout) {
    const lines = grepResult.stdout.split("\n").filter((l) => l.trim());
    // Filter out: archive-aware refs, this eval script, and consolidation manifests
    // consolidate-all.js lists historical scripts by name with DEPRECATED label on adjacent line
    const staleRefs = lines.filter(
      (l) =>
        !/(archive|ARCHIVED|obsolete|deprecated|DEPRECATED|consolidate-all)/i.test(l) &&
        !l.includes("eval-sonarcloud-improvements.js")
    );
    results.push(
      result(
        "T7.1",
        "No stale extract-sonarcloud refs in scripts/",
        staleRefs.length === 0,
        `Found ${staleRefs.length} stale references:\n${staleRefs.join("\n")}`
      )
    );
  } else {
    results.push(result("T7.1", "No extract-sonarcloud refs in scripts/ (clean)", true, ""));
  }

  // Check COMMAND_REFERENCE.md doesn't have duplicate sonarcloud entries
  const cmdRefPath = path.join(ROOT, ".claude/COMMAND_REFERENCE.md");
  if (fs.existsSync(cmdRefPath)) {
    const cmdRef = fs.readFileSync(cmdRefPath, "utf8");
    const sonarMatches = cmdRef.match(/^\|\s*`?sonarcloud`?\s*\|/gm) || [];
    results.push(
      result(
        "T7.2",
        "No duplicate sonarcloud in COMMAND_REFERENCE.md",
        sonarMatches.length <= 1,
        `Found ${sonarMatches.length} entries (expected 0-1)`
      )
    );

    // Check deprecated skill references are updated
    const hasOldSprint = /\/sonarcloud-sprint\b/.test(cmdRef);
    const hasOldSync = /\/sync-sonarcloud-debt\b/.test(cmdRef);
    results.push(
      result(
        "T7.3",
        "No deprecated skill invocations",
        !hasOldSprint && !hasOldSync,
        `Found: ${hasOldSprint ? "/sonarcloud-sprint " : ""}${hasOldSync ? "/sync-sonarcloud-debt" : ""}`
      )
    );
  }

  return results;
}

// ============================================================================
// T8: Atomic Write Verification
// ============================================================================

function testT8() {
  console.log("\n⚛️ T8: Atomic Write Patterns");
  const results = [];

  // Verify sync-sonarcloud.js uses tmp+rename
  const syncContent = fs.readFileSync(path.join(ROOT, "scripts/debt/sync-sonarcloud.js"), "utf8");

  // Find the resolve section that writes MASTER_FILE
  const writeSection = syncContent.match(
    /console\.log\([^)]*Updating MASTER_DEBT[\s\S]*?renameSync/
  );
  results.push(
    result(
      "T8.1",
      "sync-sonarcloud uses atomic write for MASTER_DEBT",
      !!writeSection,
      "Missing tmp+rename pattern"
    )
  );

  // Verify state-utils.js uses tmp+rename
  const stateContent = fs.readFileSync(path.join(ROOT, ".claude/hooks/state-utils.js"), "utf8");
  const stateAtomicWrite = /tmpPath[\s\S]*?writeFileSync\(tmpPath[\s\S]*?renameSync\(tmpPath/.test(
    stateContent
  );
  results.push(
    result("T8.2", "state-utils uses atomic write", stateAtomicWrite, "Missing tmp+rename pattern")
  );

  // Verify cleanup on failure in state-utils
  const hasCleanup = /catch[\s\S]*?rmSync\(tmpPath/.test(stateContent);
  results.push(
    result(
      "T8.3",
      "state-utils cleans up tmp on failure",
      hasCleanup,
      "Missing tmp cleanup in catch"
    )
  );

  return results;
}

// ============================================================================
// T9: Agent-Trigger-Enforcer Path Normalization
// ============================================================================

function testT9() {
  console.log("\n🔧 T9: Agent-Trigger-Enforcer Path Normalization");
  const results = [];

  const enforcerPath = path.join(ROOT, ".claude/hooks/agent-trigger-enforcer.js");
  const content = fs.readFileSync(enforcerPath, "utf8");

  // Check path normalization exists
  const hasNormalization = /path\.relative\([\s\S]*?path\.resolve\(/.test(content);
  results.push(
    result(
      "T9.1",
      "Uses path.relative + path.resolve normalization",
      hasNormalization,
      "Missing path normalization"
    )
  );

  // Check forward slash join
  const hasForwardSlash = /\.split\(path\.sep\)[\s\S]*?\.join\(["']\//i.test(content);
  results.push(
    result(
      "T9.2",
      "Normalizes to forward slashes",
      hasForwardSlash,
      "Missing forward slash normalization"
    )
  );

  // Check deduplication with normalized path
  const hasDedup = /includes\(normalizedFile\)/.test(content);
  results.push(
    result(
      "T9.3",
      "Deduplicates using normalized path",
      hasDedup,
      "Not using normalizedFile for dedup"
    )
  );

  return results;
}

// ============================================================================
// T10: COMMAND_REFERENCE Dedup
// ============================================================================

function testT10() {
  console.log("\n📖 T10: COMMAND_REFERENCE Validation");
  const results = [];

  const cmdRefPath = path.join(ROOT, ".claude/COMMAND_REFERENCE.md");
  const content = fs.readFileSync(cmdRefPath, "utf8");

  // Check no duplicate sonarcloud entries (Review #250 removed one)
  const sonarcloudRows = content.match(/^\|\s*`sonarcloud`\s*\|/gm) || [];
  results.push(
    result(
      "T10.1",
      "No duplicate sonarcloud entries",
      sonarcloudRows.length <= 1,
      `Found ${sonarcloudRows.length} sonarcloud rows (expected 0-1)`
    )
  );

  // Check document version updated (format: **Version:** X.Y)
  const versionMatch = content.match(/\*\*Version:\*\*\s*([\d.]+)/);
  const version = versionMatch ? parseFloat(versionMatch[1]) : 0;
  results.push(
    result("T10.2", "Version >= 3.2 (Review #250 update)", version >= 3.2, `Version: ${version}`)
  );

  return results;
}

// ============================================================================
// Main Runner
// ============================================================================

const STAGES = {
  T1: testT1,
  T2: testT2,
  T3: testT3,
  T4: testT4,
  T5: testT5,
  T6: testT6,
  T7: testT7,
  T8: testT8,
  T9: testT9,
  T10: testT10,
};

function main() {
  const arg = process.argv[2] || "all";

  // Clear previous results
  if (fs.existsSync(RESULTS_FILE)) fs.unlinkSync(RESULTS_FILE);

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  SonarCloud Improvements Validation (PR #337 / Review #250) ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\nMode: ${arg}`);
  console.log(`Results: ${RESULTS_FILE}\n`);

  let allResults = [];

  if (arg === "all" || arg === "automated") {
    for (const [stage, fn] of Object.entries(STAGES)) {
      try {
        allResults = allResults.concat(fn());
      } catch (err) {
        result(stage, "STAGE CRASHED", false, err instanceof Error ? err.message : String(err));
      }
    }
  } else if (STAGES[arg.toUpperCase()]) {
    try {
      allResults = STAGES[arg.toUpperCase()]();
    } catch (err) {
      result(
        arg.toUpperCase(),
        "STAGE CRASHED",
        false,
        err instanceof Error ? err.message : String(err)
      );
    }
  } else {
    console.error(`Unknown stage: ${arg}`);
    console.error(`Valid stages: ${Object.keys(STAGES).join(", ")}, all, automated`);
    process.exit(1);
  }

  // Summary
  const passed = allResults.filter((r) => r.pass).length;
  const failed = allResults.filter((r) => !r.pass).length;
  const total = allResults.length;

  console.log("\n" + "═".repeat(60));
  console.log(`\n📊 Results: ${passed}/${total} passed, ${failed} failed`);

  if (failed > 0) {
    console.log("\n❌ Failures:");
    for (const r of allResults.filter((r) => !r.pass)) {
      console.log(`   ${r.stage}: ${r.name} — ${r.details}`);
    }
  }

  console.log(`\n📄 Full results: ${RESULTS_FILE}`);

  // Write summary
  fs.appendFileSync(
    RESULTS_FILE,
    JSON.stringify({
      type: "summary",
      total,
      passed,
      failed,
      timestamp: new Date().toISOString(),
    }) + "\n"
  );

  process.exit(failed > 0 ? 1 : 0);
}

main();
