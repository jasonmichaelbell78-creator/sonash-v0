/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Compaction Resilience Checker — Domain 3 (D3)
 *
 * Validates the four compaction-resilience layers:
 * 1. Layer A: Commit Tracker (PostToolUse Bash hook)
 * 2. Layer C: PreCompact Save (PreCompact hook)
 * 3. Layer D: Gap Detection (check-session-gaps.js)
 * 4. Restore Output Quality (SessionStart compact matcher)
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[compaction-resilience] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "compaction_resilience";

/**
 * Safely read a file, returning empty string on any error.
 * Caps reads at 10 MB to avoid memory issues.
 * @param {string} filePath
 * @returns {string}
 */
function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 10 * 1024 * 1024) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

/**
 * Check whether a hook file is registered under a given event type.
 * Returns the matching group entry or null.
 * @param {object} hooksSection - The hooks object from settings.json
 * @param {string} eventType - e.g. "PostToolUse", "PreCompact", "SessionStart"
 * @param {string} filename - e.g. "commit-tracker.js"
 * @param {string|null} matcher - Optional matcher value to require on the group
 * @returns {{ found: boolean, hasMatcher: boolean }}
 */
function checkHookRegistration(hooksSection, eventType, filename, matcher) {
  const groups = hooksSection[eventType];
  if (!Array.isArray(groups)) return { found: false, hasMatcher: false };

  for (const group of groups) {
    const hooks = group.hooks || [];
    for (const hook of hooks) {
      const cmd = hook.command || "";
      // Check if command references the target filename
      const idx = cmd.indexOf(filename);
      if (idx >= 0) {
        const hasMatcher = matcher ? group.matcher === matcher : true;
        return { found: true, hasMatcher };
      }
    }
  }
  return { found: false, hasMatcher: false };
}

/**
 * Run all compaction resilience checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // Load settings.json
  const settingsPath = path.join(rootDir, ".claude", "settings.json");
  const settingsRaw = safeReadFile(settingsPath);
  let settings = {};
  if (settingsRaw) {
    try {
      settings = JSON.parse(settingsRaw);
    } catch {
      findings.push({
        id: "CR-100",
        category: "layer_a_commit_tracker",
        domain: DOMAIN,
        severity: "error",
        message: "settings.json is not valid JSON",
        details: "Cannot validate any hook registrations without a parseable settings.json",
        impactScore: 95,
        frequency: 1,
        blastRadius: 5,
      });
    }
  }

  const hooksSection = settings.hooks || {};

  // ── Category 1: Layer A — Commit Tracker ──────────────────────────────
  scores.layer_a_commit_tracker = checkLayerACommitTracker(rootDir, hooksSection, findings);

  // ── Category 2: Layer C — PreCompact Save ─────────────────────────────
  scores.layer_c_precompact_save = checkLayerCPrecompactSave(rootDir, hooksSection, findings);

  // ── Category 3: Layer D — Gap Detection ───────────────────────────────
  scores.layer_d_gap_detection = checkLayerDGapDetection(rootDir, findings);

  // ── Category 4: Restore Output Quality ────────────────────────────────
  scores.restore_output_quality = checkRestoreOutputQuality(rootDir, hooksSection, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 1: Layer A — Commit Tracker ────────────────────────────────────

function checkLayerACommitTracker(rootDir, hooksSection, findings) {
  const bench = BENCHMARKS.layer_a_commit_tracker;
  let passed = 0;
  const total = 4;

  // Check 1: commit-tracker.js registered under PostToolUse
  const reg = checkHookRegistration(hooksSection, "PostToolUse", "commit-tracker.js", null);
  if (reg.found) {
    passed++;
  } else {
    findings.push({
      id: "CR-110",
      category: "layer_a_commit_tracker",
      domain: DOMAIN,
      severity: "error",
      message: "commit-tracker.js not registered under PostToolUse in settings.json",
      details:
        "Layer A requires commit-tracker.js to fire on Bash tool calls. Without registration, commits are not tracked.",
      impactScore: 90,
      frequency: 1,
      blastRadius: 5,
      patchType: "config_fix",
      patchTarget: ".claude/settings.json",
      patchContent: "Add commit-tracker.js hook under PostToolUse with Bash matcher",
      patchImpact: "Restore automatic commit tracking",
    });
  }

  // Check 2: Bash matcher present on the PostToolUse group containing commit-tracker
  const bashReg = checkHookRegistration(hooksSection, "PostToolUse", "commit-tracker.js", null);
  let hasBashMatcher = false;
  if (bashReg.found) {
    // Verify the group has a bash-matching matcher
    const groups = hooksSection.PostToolUse || [];
    for (const group of groups) {
      const hooks = group.hooks || [];
      for (const hook of hooks) {
        const cmd = hook.command || "";
        const idx = cmd.indexOf("commit-tracker.js");
        if (idx >= 0 && group.matcher) {
          // Test if matcher would match "bash" or "Bash"
          try {
            const normalized = group.matcher.replace(/\(\?i\)/g, "");
            const hasInlineI = group.matcher.indexOf("(?i)") >= 0;
            const re = new RegExp(normalized, hasInlineI ? "i" : "");
            if (re.test("bash") || re.test("Bash")) {
              hasBashMatcher = true;
            }
          } catch {
            // Invalid regex — matcher won't work
          }
        }
      }
    }
  }
  if (hasBashMatcher) {
    passed++;
  } else if (bashReg.found) {
    findings.push({
      id: "CR-111",
      category: "layer_a_commit_tracker",
      domain: DOMAIN,
      severity: "warning",
      message: "commit-tracker.js group lacks a Bash-matching matcher pattern",
      details:
        "The PostToolUse group containing commit-tracker.js should have a matcher that matches 'bash' or 'Bash'.",
      impactScore: 70,
      frequency: 1,
      blastRadius: 4,
      patchType: "config_fix",
      patchTarget: ".claude/settings.json",
      patchContent: 'Add matcher "^(?i)bash$" to the PostToolUse group for commit-tracker.js',
      patchImpact: "Ensure commit tracker only fires on Bash tool calls",
    });
  }

  // Check 3: commit-tracker.js file exists on disk
  const trackerPath = path.join(rootDir, ".claude", "hooks", "commit-tracker.js");
  const trackerContent = safeReadFile(trackerPath);
  if (trackerContent.length > 0) {
    passed++;
  } else {
    findings.push({
      id: "CR-112",
      category: "layer_a_commit_tracker",
      domain: DOMAIN,
      severity: "error",
      message: "commit-tracker.js file not found or empty",
      details: `Expected file at .claude/hooks/commit-tracker.js. Layer A cannot function without this file.`,
      impactScore: 95,
      frequency: 1,
      blastRadius: 5,
      patchType: "create_file",
      patchTarget: ".claude/hooks/commit-tracker.js",
      patchContent: "Recreate commit-tracker.js from session #138 specification",
      patchImpact: "Restore commit tracking capability",
    });
  }

  // Check 4: Content validates — handles Bash events and writes to commit-log.jsonl
  if (trackerContent.length > 0) {
    const mentionsBash =
      trackerContent.indexOf("bash") >= 0 ||
      trackerContent.indexOf("Bash") >= 0 ||
      trackerContent.indexOf("BASH") >= 0;
    const mentionsCommitLog =
      trackerContent.indexOf("commit-log") >= 0 || trackerContent.indexOf("commit_log") >= 0;
    const writesJsonl =
      trackerContent.indexOf(".jsonl") >= 0 ||
      trackerContent.indexOf("appendFile") >= 0 ||
      trackerContent.indexOf("writeFile") >= 0;

    if (mentionsBash && mentionsCommitLog && writesJsonl) {
      passed++;
    } else {
      const missing = [];
      if (!mentionsBash) missing.push("Bash event handling");
      if (!mentionsCommitLog) missing.push("commit-log reference");
      if (!writesJsonl) missing.push("JSONL write operation");
      findings.push({
        id: "CR-113",
        category: "layer_a_commit_tracker",
        domain: DOMAIN,
        severity: "warning",
        message: "commit-tracker.js missing expected functionality",
        details: `Missing: ${missing.join(", ")}. The tracker should handle Bash events and write to commit-log.jsonl.`,
        impactScore: 65,
        frequency: 1,
        blastRadius: 3,
      });
    }
  }

  const healthPct = Math.round((passed / total) * 100);
  const result = scoreMetric(healthPct, bench.health_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { healthPct, passed, total },
  };
}

// ── Category 2: Layer C — PreCompact Save ───────────────────────────────────

function checkLayerCPrecompactSave(rootDir, hooksSection, findings) {
  const bench = BENCHMARKS.layer_c_precompact_save;
  let passed = 0;
  const total = 4;

  // Check 1: pre-compaction-save.js registered under PreCompact
  const reg = checkHookRegistration(hooksSection, "PreCompact", "pre-compaction-save.js", null);
  if (reg.found) {
    passed++;
  } else {
    findings.push({
      id: "CR-120",
      category: "layer_c_precompact_save",
      domain: DOMAIN,
      severity: "error",
      message: "pre-compaction-save.js not registered under PreCompact in settings.json",
      details:
        "Layer C requires pre-compaction-save.js to fire before compaction. Without registration, state snapshots are lost.",
      impactScore: 90,
      frequency: 1,
      blastRadius: 5,
      patchType: "config_fix",
      patchTarget: ".claude/settings.json",
      patchContent: "Add pre-compaction-save.js hook under PreCompact event",
      patchImpact: "Restore pre-compaction state capture",
    });
  }

  // Check 2: File exists on disk
  const savePath = path.join(rootDir, ".claude", "hooks", "pre-compaction-save.js");
  const saveContent = safeReadFile(savePath);
  if (saveContent.length > 0) {
    passed++;
  } else {
    findings.push({
      id: "CR-121",
      category: "layer_c_precompact_save",
      domain: DOMAIN,
      severity: "error",
      message: "pre-compaction-save.js file not found or empty",
      details:
        "Expected file at .claude/hooks/pre-compaction-save.js. Layer C cannot function without this file.",
      impactScore: 95,
      frequency: 1,
      blastRadius: 5,
      patchType: "create_file",
      patchTarget: ".claude/hooks/pre-compaction-save.js",
      patchContent: "Recreate pre-compaction-save.js from session #138 specification",
      patchImpact: "Restore pre-compaction state snapshot capability",
    });
  }

  // Check 3: Writes to handoff.json
  if (saveContent.length > 0) {
    const writesHandoff =
      saveContent.indexOf("handoff.json") >= 0 || saveContent.indexOf("handoff") >= 0;
    if (writesHandoff) {
      passed++;
    } else {
      findings.push({
        id: "CR-122",
        category: "layer_c_precompact_save",
        domain: DOMAIN,
        severity: "error",
        message: "pre-compaction-save.js does not reference handoff.json",
        details:
          "The PreCompact hook should write state to .claude/state/handoff.json for post-compaction recovery.",
        impactScore: 80,
        frequency: 1,
        blastRadius: 4,
      });
    }
  }

  // Check 4: Captures key fields (timestamp, sessionId, gitState, taskStates, commitLog)
  if (saveContent.length > 0) {
    const requiredFields = [
      { name: "timestamp", patterns: ["timestamp", "Date.now", "new Date", "toISOString"] },
      {
        name: "sessionId",
        patterns: ["sessionId", "session_id", "sessionNumber", "session_number"],
      },
      { name: "gitState", patterns: ["gitState", "git_state", "branch", "HEAD"] },
      { name: "taskStates", patterns: ["taskState", "task_state", "task-", ".state.json"] },
      { name: "commitLog", patterns: ["commitLog", "commit_log", "commit-log"] },
    ];

    let fieldsFound = 0;
    const missingFields = [];
    for (const field of requiredFields) {
      const found = field.patterns.some((p) => saveContent.indexOf(p) >= 0);
      if (found) {
        fieldsFound++;
      } else {
        missingFields.push(field.name);
      }
    }

    if (fieldsFound >= 4) {
      passed++;
    } else {
      findings.push({
        id: "CR-123",
        category: "layer_c_precompact_save",
        domain: DOMAIN,
        severity: missingFields.length >= 3 ? "error" : "warning",
        message: `pre-compaction-save.js missing ${missingFields.length} key field(s)`,
        details:
          `Missing fields: ${missingFields.join(", ")}. The snapshot should capture: timestamp, session` +
          `Id, gitState, taskStates, commitLog.`,
        impactScore: missingFields.length >= 3 ? 75 : 50,
        frequency: 1,
        blastRadius: 3,
      });
    }
  }

  const completenessPct = Math.round((passed / total) * 100);
  const result = scoreMetric(completenessPct, bench.completeness_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { completenessPct, passed, total },
  };
}

// ── Category 3: Layer D — Gap Detection ─────────────────────────────────────

function checkLayerDGapDetection(rootDir, findings) {
  const bench = BENCHMARKS.layer_d_gap_detection;
  let passed = 0;
  const total = 4;

  // Check 1: check-session-gaps.js exists
  const gapScriptPath = path.join(rootDir, "scripts", "check-session-gaps.js");
  const gapContent = safeReadFile(gapScriptPath);
  if (gapContent.length > 0) {
    passed++;
  } else {
    findings.push({
      id: "CR-130",
      category: "layer_d_gap_detection",
      domain: DOMAIN,
      severity: "error",
      message: "check-session-gaps.js not found or empty",
      details:
        "Expected file at scripts/check-session-gaps.js. Layer D gap detection requires this script.",
      impactScore: 85,
      frequency: 1,
      blastRadius: 4,
      patchType: "create_file",
      patchTarget: "scripts/check-session-gaps.js",
      patchContent: "Recreate check-session-gaps.js from session #138 specification",
      patchImpact: "Restore session gap detection capability",
    });
  }

  // Check 2: npm run session:gaps script exists in package.json
  const pkgPath = path.join(rootDir, "package.json");
  const pkgContent = safeReadFile(pkgPath);
  let hasSessionGapsScript = false;
  if (pkgContent.length > 0) {
    try {
      const pkg = JSON.parse(pkgContent);
      const scripts = pkg.scripts || {};
      if (scripts["session:gaps"]) {
        hasSessionGapsScript = true;
        passed++;
      }
    } catch {
      // Invalid package.json
    }
  }
  if (!hasSessionGapsScript) {
    findings.push({
      id: "CR-131",
      category: "layer_d_gap_detection",
      domain: DOMAIN,
      severity: "warning",
      message: 'No "session:gaps" script found in package.json',
      details: 'Expected "session:gaps" npm script for easy gap detection invocation.',
      impactScore: 45,
      frequency: 1,
      blastRadius: 2,
      patchType: "config_fix",
      patchTarget: "package.json",
      patchContent: 'Add "session:gaps": "node scripts/check-session-gaps.js" to scripts',
      patchImpact: "Provide convenient npm script for gap detection",
    });
  }

  // Check 3: Script reads commit-log.jsonl
  if (gapContent.length > 0) {
    const readsCommitLog =
      gapContent.indexOf("commit-log") >= 0 || gapContent.indexOf("commit_log") >= 0;
    if (readsCommitLog) {
      passed++;
    } else {
      findings.push({
        id: "CR-132",
        category: "layer_d_gap_detection",
        domain: DOMAIN,
        severity: "error",
        message: "check-session-gaps.js does not reference commit-log",
        details:
          "The gap detection script should read commit-log.jsonl to find undocumented commits.",
        impactScore: 75,
        frequency: 1,
        blastRadius: 4,
      });
    }
  }

  // Check 4: Script compares with SESSION_CONTEXT.md
  if (gapContent.length > 0) {
    const readsSessionContext =
      gapContent.indexOf("SESSION_CONTEXT") >= 0 || gapContent.indexOf("session_context") >= 0;
    if (readsSessionContext) {
      passed++;
    } else {
      findings.push({
        id: "CR-133",
        category: "layer_d_gap_detection",
        domain: DOMAIN,
        severity: "warning",
        message: "check-session-gaps.js does not reference SESSION_CONTEXT.md",
        details:
          "The gap detector should compare commit log against SESSION_CONTEXT.md to find undocumented sessions.",
        impactScore: 55,
        frequency: 1,
        blastRadius: 3,
      });
    }
  }

  const detectionPct = Math.round((passed / total) * 100);
  const result = scoreMetric(detectionPct, bench.detection_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { detectionPct, passed, total },
  };
}

// ── Category 4: Restore Output Quality ──────────────────────────────────────

function checkRestoreOutputQuality(rootDir, hooksSection, findings) {
  const bench = BENCHMARKS.restore_output_quality;
  let passed = 0;
  const total = 4;

  // Check 1: compact-restore.js registered under SessionStart with "compact" matcher
  const reg = checkHookRegistration(hooksSection, "SessionStart", "compact-restore.js", "compact");
  if (reg.found && reg.hasMatcher) {
    passed++;
  } else if (reg.found) {
    findings.push({
      id: "CR-140",
      category: "restore_output_quality",
      domain: DOMAIN,
      severity: "warning",
      message: 'compact-restore.js registered under SessionStart but missing "compact" matcher',
      details:
        'The hook should have matcher: "compact" so it only fires after compaction, not on every session start.',
      impactScore: 60,
      frequency: 1,
      blastRadius: 3,
      patchType: "config_fix",
      patchTarget: ".claude/settings.json",
      patchContent: 'Add "matcher": "compact" to the SessionStart group for compact-restore.js',
      patchImpact: "Prevent unnecessary restore output on normal session starts",
    });
  } else {
    findings.push({
      id: "CR-141",
      category: "restore_output_quality",
      domain: DOMAIN,
      severity: "error",
      message: "compact-restore.js not registered under SessionStart in settings.json",
      details:
        "Without registration, post-compaction context recovery will not execute automatically.",
      impactScore: 90,
      frequency: 1,
      blastRadius: 5,
      patchType: "config_fix",
      patchTarget: ".claude/settings.json",
      patchContent: 'Add compact-restore.js hook under SessionStart with "compact" matcher',
      patchImpact: "Restore automatic post-compaction context recovery",
    });
  }

  // Check 2: File exists on disk
  const restorePath = path.join(rootDir, ".claude", "hooks", "compact-restore.js");
  const restoreContent = safeReadFile(restorePath);
  if (restoreContent.length > 0) {
    passed++;
  } else {
    findings.push({
      id: "CR-142",
      category: "restore_output_quality",
      domain: DOMAIN,
      severity: "error",
      message: "compact-restore.js file not found or empty",
      details:
        "Expected file at .claude/hooks/compact-restore.js. Post-compaction recovery requires this file.",
      impactScore: 95,
      frequency: 1,
      blastRadius: 5,
      patchType: "create_file",
      patchTarget: ".claude/hooks/compact-restore.js",
      patchContent: "Recreate compact-restore.js from session #138 specification",
      patchImpact: "Restore post-compaction context recovery capability",
    });
  }

  // Check 3: Reads handoff.json
  if (restoreContent.length > 0) {
    const readsHandoff =
      restoreContent.indexOf("handoff.json") >= 0 || restoreContent.indexOf("handoff") >= 0;
    if (readsHandoff) {
      passed++;
    } else {
      findings.push({
        id: "CR-143",
        category: "restore_output_quality",
        domain: DOMAIN,
        severity: "error",
        message: "compact-restore.js does not reference handoff.json",
        details:
          "The restore hook should read .claude/state/handoff.json to retrieve the pre-compaction state snapshot.",
        impactScore: 80,
        frequency: 1,
        blastRadius: 4,
      });
    }
  }

  // Check 4: Outputs recovery context (stdout or console.log)
  if (restoreContent.length > 0) {
    const outputsContext =
      restoreContent.indexOf("console.log") >= 0 ||
      restoreContent.indexOf("process.stdout") >= 0 ||
      restoreContent.indexOf("stdout") >= 0;
    if (outputsContext) {
      passed++;
    } else {
      findings.push({
        id: "CR-144",
        category: "restore_output_quality",
        domain: DOMAIN,
        severity: "warning",
        message: "compact-restore.js does not appear to output recovery context",
        details:
          "The restore hook should write to stdout (console.log) so Claude receives the recovery context after compaction.",
        impactScore: 65,
        frequency: 1,
        blastRadius: 3,
      });
    }
  }

  const qualityPct = Math.round((passed / total) * 100);
  const result = scoreMetric(qualityPct, bench.quality_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { qualityPct, passed, total },
  };
}

module.exports = { DOMAIN, run };
