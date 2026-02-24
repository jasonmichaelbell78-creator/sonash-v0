/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Integration & Configuration Checker — Categories 15-16 (Domain D5)
 *
 * 15. Hook Registration Alignment
 * 16. State File Management
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[integration-config] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "integration_config";

/**
 * Session-related hooks that should be registered and present.
 * Map of filename -> description for reporting.
 */
const SESSION_HOOKS = {
  "session-start.js": "SessionStart bootstrap",
  "check-mcp-servers.js": "SessionStart MCP availability check",
  "check-remote-session-context.js": "SessionStart remote branch context",
  "compact-restore.js": "SessionStart:compact context restore",
  "pre-compaction-save.js": "PreCompact state snapshot",
  "commit-tracker.js": "PostToolUse:Bash commit tracking",
  "track-agent-invocation.js": "PostToolUse:Task agent invocation tracking",
};

/**
 * Safe file read helper — wraps in try/catch for race-condition safety.
 * @param {string} filePath
 * @returns {string|null}
 */
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

/**
 * Run all integration & configuration checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // ── Category 15: Hook Registration Alignment ─────────────────────────────
  scores.hook_registration_alignment = checkHookRegistrationAlignment(rootDir, findings);

  // ── Category 16: State File Management ────────────────────────────────────
  scores.state_file_management = checkStateFileManagement(rootDir, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 15: Hook Registration Alignment ─────────────────────────────────

/**
 * For each expected session hook:
 *   - Check if the .js file exists in .claude/hooks/
 *   - Check if it is registered in .claude/settings.json hooks section
 * Also scan hooks dir for session-related files NOT in the expected list.
 */
function checkHookRegistrationAlignment(rootDir, findings) {
  const bench = BENCHMARKS.hook_registration_alignment;
  const hooksDir = path.join(rootDir, ".claude", "hooks");
  const settingsPath = path.join(rootDir, ".claude", "settings.json");

  const expectedFiles = Object.keys(SESSION_HOOKS);
  let registeredAndPresent = 0;
  const totalExpected = expectedFiles.length;
  const details = {};

  // Parse settings.json to build a set of registered hook filenames
  const registeredFiles = new Set();
  let settingsParsed = false;

  const settingsContent = safeReadFile(settingsPath);
  if (settingsContent) {
    try {
      const settings = JSON.parse(settingsContent);
      if (settings.hooks && typeof settings.hooks === "object") {
        settingsParsed = true;
        for (const eventHooks of Object.values(settings.hooks)) {
          if (!Array.isArray(eventHooks)) continue;
          for (const group of eventHooks) {
            const hooks = group.hooks || [];
            for (const hook of hooks) {
              if (hook.command) {
                // Extract .js filename from command string
                // Patterns: "node .claude/hooks/foo.js" or "VAR=val node .claude/hooks/foo.js $ARGUMENTS"
                const cmdStr = hook.command;
                const jsIdx = cmdStr.indexOf(".claude/hooks/");
                if (jsIdx !== -1) {
                  const afterPrefix = cmdStr.slice(jsIdx + ".claude/hooks/".length);
                  // Take characters until whitespace or end
                  const endIdx = afterPrefix.search(/\s/);
                  const filename = endIdx === -1 ? afterPrefix : afterPrefix.slice(0, endIdx);
                  if (filename.endsWith(".js")) {
                    registeredFiles.add(filename);
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      findings.push({
        id: "SEA-D5-001",
        category: "hook_registration_alignment",
        domain: DOMAIN,
        severity: "error",
        message: "Failed to parse .claude/settings.json — hook registration cannot be verified",
        details: "The settings file exists but contains invalid JSON.",
        impactScore: 80,
        frequency: 1,
        blastRadius: 5,
      });
    }
  } else {
    findings.push({
      id: "SEA-D5-002",
      category: "hook_registration_alignment",
      domain: DOMAIN,
      severity: "error",
      message: ".claude/settings.json not found — no hooks are registered",
      details:
        "Without settings.json, no hooks will fire. All session lifecycle automation is inactive.",
      impactScore: 95,
      frequency: 1,
      blastRadius: 5,
    });
  }

  // Check each expected session hook
  for (const hookFile of expectedFiles) {
    const hookPath = path.join(hooksDir, hookFile);
    let fileExists = false;
    try {
      fileExists = fs.existsSync(hookPath);
    } catch {
      // FS access error — treat as missing
    }

    const isRegistered = registeredFiles.has(hookFile);

    details[hookFile] = {
      description: SESSION_HOOKS[hookFile],
      fileExists,
      isRegistered,
    };

    if (fileExists && isRegistered) {
      registeredAndPresent++;
    } else if (fileExists && !isRegistered) {
      findings.push({
        id: "SEA-D5-010",
        category: "hook_registration_alignment",
        domain: DOMAIN,
        severity: "warning",
        message: `${hookFile} exists in hooks/ but is NOT registered in settings.json`,
        details: `${SESSION_HOOKS[hookFile]} — file is present but will never fire because it has no registration.`,
        impactScore: 60,
        frequency: 1,
        blastRadius: 3,
      });
    } else if (!fileExists && isRegistered) {
      findings.push({
        id: "SEA-D5-011",
        category: "hook_registration_alignment",
        domain: DOMAIN,
        severity: "error",
        message: `${hookFile} is registered in settings.json but file is MISSING from hooks/`,
        details: `${SESSION_HOOKS[hookFile]} — the hook will fail at runtime because the file does not exist.`,
        impactScore: 85,
        frequency: 1,
        blastRadius: 4,
      });
    } else {
      // Neither exists nor registered
      findings.push({
        id: "SEA-D5-012",
        category: "hook_registration_alignment",
        domain: DOMAIN,
        severity: "warning",
        message: `${hookFile} is neither present nor registered`,
        details: `${SESSION_HOOKS[hookFile]} — expected session hook is completely absent.`,
        impactScore: 50,
        frequency: 1,
        blastRadius: 2,
      });
    }
  }

  // Scan hooks dir for session-related files not in the expected list
  // (only flag files whose names suggest session/compaction/state purpose)
  const sessionNamePatterns = ["session", "compact", "handoff", "state", "restore"];
  try {
    if (fs.existsSync(hooksDir)) {
      const allHookFiles = fs.readdirSync(hooksDir).filter((f) => f.endsWith(".js"));
      for (const hookFile of allHookFiles) {
        if (expectedFiles.includes(hookFile)) continue;
        const lowerName = hookFile.toLowerCase();
        const looksSessionRelated = sessionNamePatterns.some((p) => lowerName.includes(p));
        if (looksSessionRelated && !registeredFiles.has(hookFile)) {
          findings.push({
            id: "SEA-D5-013",
            category: "hook_registration_alignment",
            domain: DOMAIN,
            severity: "info",
            message: `Possible unregistered session hook: ${hookFile}`,
            details: `File name suggests session-related purpose but it is not in the expected list or registered in settings.json.`,
            impactScore: 30,
            frequency: 1,
            blastRadius: 1,
          });
        }
      }
    }
  } catch {
    // FS scan error — non-fatal
  }

  const alignmentPct =
    totalExpected > 0 ? Math.round((registeredAndPresent / totalExpected) * 100) : 0;
  const result = scoreMetric(alignmentPct, bench.alignment_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      registeredAndPresent,
      totalExpected,
      alignmentPct,
      settingsParsed,
      registeredFiles: Array.from(registeredFiles),
      details,
    },
  };
}

// ── Category 16: State File Management ───────────────────────────────────────

/**
 * Checks:
 *   1. .gitignore includes .claude/state/ (or patterns covering state files)
 *   2. .claude/state/ directory exists
 *   3. No state file exceeds 10MB
 *   4. .claude/tmp/ cleanup (files > 7 days flagged)
 */
function checkStateFileManagement(rootDir, findings) {
  const bench = BENCHMARKS.state_file_management;
  let checksPassed = 0;
  let totalChecks = 4;
  const checkResults = {};

  // ── Check 1: .gitignore covers .claude/state/ ────────────────────────────

  const gitignorePath = path.join(rootDir, ".gitignore");
  const gitignoreContent = safeReadFile(gitignorePath);

  if (gitignoreContent) {
    // Look for broad coverage: ".claude/state/" or ".claude/state/*"
    // or individual file patterns like ".claude/state/*.jsonl"
    const lines = gitignoreContent.split("\n").map((l) => l.trim());
    const statePatterns = lines.filter(
      (l) => !l.startsWith("#") && l.length > 0 && l.includes(".claude/state")
    );

    // Check if there is broad coverage (directory-level ignore)
    const hasBroadCoverage = statePatterns.some((p) => {
      const normalized = p.replace(/\\/g, "/");
      return (
        normalized === ".claude/state/" ||
        normalized === ".claude/state/*" ||
        normalized === ".claude/state/**"
      );
    });

    // Or at least individual file coverage
    const hasIndividualCoverage = statePatterns.length >= 3;

    if (hasBroadCoverage) {
      checkResults.gitignore_coverage = {
        passed: true,
        detail: "Broad .claude/state/ pattern found in .gitignore",
      };
      checksPassed++;
    } else if (hasIndividualCoverage) {
      checkResults.gitignore_coverage = {
        passed: true,
        detail: `${statePatterns.length} individual state file patterns in .gitignore (no broad pattern)`,
      };
      checksPassed++;
      findings.push({
        id: "SEA-D5-020",
        category: "state_file_management",
        domain: DOMAIN,
        severity: "info",
        message:
          "State files are gitignored individually — consider adding .claude/state/ as a directory pattern",
        details: `Found ${statePatterns.length} individual patterns. A single .claude/state/ entry would cover all future state files automatically.`,
        impactScore: 20,
        frequency: 1,
        blastRadius: 1,
      });
    } else {
      checkResults.gitignore_coverage = {
        passed: false,
        detail: "Insufficient .claude/state/ coverage in .gitignore",
      };
      findings.push({
        id: "SEA-D5-021",
        category: "state_file_management",
        domain: DOMAIN,
        severity: "error",
        message: ".claude/state/ files are not adequately covered in .gitignore",
        details:
          "State files may be committed to git, leaking session data and bloating the repository.",
        impactScore: 80,
        frequency: 1,
        blastRadius: 4,
      });
    }
  } else {
    checkResults.gitignore_coverage = { passed: false, detail: ".gitignore not found" };
    findings.push({
      id: "SEA-D5-022",
      category: "state_file_management",
      domain: DOMAIN,
      severity: "error",
      message: ".gitignore file not found — state files may be committed to git",
      details:
        "No .gitignore exists at the project root. All state files are at risk of being tracked.",
      impactScore: 85,
      frequency: 1,
      blastRadius: 5,
    });
  }

  // ── Check 2: .claude/state/ directory exists ──────────────────────────────

  const stateDir = path.join(rootDir, ".claude", "state");
  let stateDirExists = false;
  try {
    stateDirExists = fs.existsSync(stateDir);
  } catch {
    // FS error
  }

  if (stateDirExists) {
    checkResults.state_dir_exists = { passed: true, detail: ".claude/state/ directory exists" };
    checksPassed++;
  } else {
    checkResults.state_dir_exists = {
      passed: false,
      detail: ".claude/state/ directory is missing",
    };
    findings.push({
      id: "SEA-D5-023",
      category: "state_file_management",
      domain: DOMAIN,
      severity: "error",
      message: ".claude/state/ directory does not exist",
      details:
        "Hooks that write state files (commit-tracker, pre-compaction-save) will fail. Create the directory.",
      impactScore: 90,
      frequency: 1,
      blastRadius: 5,
    });
  }

  // ── Check 3: No state file exceeds 10MB ───────────────────────────────────

  let oversizedFiles = [];
  if (stateDirExists) {
    try {
      const entries = fs.readdirSync(stateDir);
      for (const entry of entries) {
        const filePath = path.join(stateDir, entry);
        try {
          const stat = fs.statSync(filePath);
          if (!stat.isFile()) continue;
          const sizeMB = stat.size / (1024 * 1024);
          if (sizeMB > 10) {
            oversizedFiles.push({ name: entry, sizeMB: Math.round(sizeMB * 100) / 100 });
          }
        } catch {
          // stat error — skip
        }
      }
    } catch {
      // readdir error
    }
  }

  if (oversizedFiles.length === 0) {
    checkResults.no_oversized_state = {
      passed: true,
      detail: stateDirExists ? "No state file exceeds 10MB" : "Skipped (state dir missing)",
    };
    if (stateDirExists) checksPassed++;
    else totalChecks--; // Don't penalize if dir missing (already caught above)
  } else {
    checkResults.no_oversized_state = {
      passed: false,
      detail: `${oversizedFiles.length} state file(s) exceed 10MB`,
      files: oversizedFiles,
    };
    for (const f of oversizedFiles) {
      findings.push({
        id: "SEA-D5-024",
        category: "state_file_management",
        domain: DOMAIN,
        severity: "error",
        message: `State file exceeds 10MB: ${f.name} (${f.sizeMB}MB)`,
        details:
          "Oversized state files degrade hook performance and risk OOM errors. Rotate or truncate immediately.",
        impactScore: 85,
        frequency: 1,
        blastRadius: 4,
      });
    }
  }

  // ── Check 4: .claude/tmp/ cleanup (files > 7 days flagged) ────────────────

  const tmpDir = path.join(rootDir, ".claude", "tmp");
  let staleFiles = [];
  let tmpDirExists = false;

  try {
    tmpDirExists = fs.existsSync(tmpDir);
  } catch {
    // FS error
  }

  if (tmpDirExists) {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - sevenDaysMs;

    try {
      const entries = fs.readdirSync(tmpDir);
      for (const entry of entries) {
        const filePath = path.join(tmpDir, entry);
        try {
          const stat = fs.statSync(filePath);
          if (!stat.isFile()) continue;
          if (stat.mtimeMs < cutoff) {
            const ageDays = Math.round((Date.now() - stat.mtimeMs) / (24 * 60 * 60 * 1000));
            staleFiles.push({ name: entry, ageDays });
          }
        } catch {
          // stat error — skip
        }
      }
    } catch {
      // readdir error
    }

    if (staleFiles.length === 0) {
      checkResults.tmp_cleanup = {
        passed: true,
        detail: "No stale files in .claude/tmp/ (>7 days)",
      };
      checksPassed++;
    } else {
      checkResults.tmp_cleanup = {
        passed: false,
        detail: `${staleFiles.length} stale file(s) in .claude/tmp/ older than 7 days`,
        files: staleFiles,
      };
      findings.push({
        id: "SEA-D5-025",
        category: "state_file_management",
        domain: DOMAIN,
        severity: "warning",
        message: `${staleFiles.length} stale file(s) in .claude/tmp/ older than 7 days`,
        details: `Stale files: ${staleFiles
          .slice(0, 5)
          .map((f) => `${f.name} (${f.ageDays}d)`)
          .join(
            ", "
          )}${staleFiles.length > 5 ? ` and ${staleFiles.length - 5} more` : ""}. Clean up to avoid disk bloat.`,
        impactScore: 35,
        frequency: staleFiles.length,
        blastRadius: 1,
      });
    }
  } else {
    // tmp dir not existing is fine — nothing to clean up
    checkResults.tmp_cleanup = {
      passed: true,
      detail: ".claude/tmp/ does not exist (nothing to clean)",
    };
    checksPassed++;
  }

  const managedPct = totalChecks > 0 ? Math.round((checksPassed / totalChecks) * 100) : 0;
  const result = scoreMetric(managedPct, bench.managed_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      checksPassed,
      totalChecks,
      managedPct,
      checkResults,
      oversizedFiles,
      staleFiles,
    },
  };
}

module.exports = { DOMAIN, run };
