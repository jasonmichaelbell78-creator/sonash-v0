/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Config Health Checker — Domain 1 (D1)
 *
 * 1. Settings File Alignment
 * 2. Event Coverage & Matchers
 * 3. Global/Local Consistency
 */

"use strict";

/* eslint-disable no-unused-vars -- safeRequire is a safety wrapper */
function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[config-health] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "config_health";

/** All 4 hook event types that should have at least one handler. */
const REQUIRED_EVENT_TYPES = ["SessionStart", "PreCompact", "PostToolUse", "UserPromptSubmit"];

/** Directories to exclude when listing hook .js files. */
const EXCLUDED_DIRS = new Set(["lib", "global", "backup"]);

/**
 * Run all config health checks.
 * @param {object} ctx - { rootDir, benchmarks }
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
        id: "HEA-100",
        category: "settings_file_alignment",
        domain: DOMAIN,
        severity: "error",
        message: "settings.json is not valid JSON",
        details: `Failed to parse ${settingsPath}`,
        impactScore: 90,
        frequency: 1,
        blastRadius: 5,
      });
    }
  }

  const hooksSection = settings.hooks || {};

  // ── Category 1: Settings File Alignment ──────────────────────────────────
  const cat1 = checkSettingsFileAlignment(rootDir, hooksSection, findings);
  scores.settings_file_alignment = cat1;

  // ── Category 2: Event Coverage & Matchers ────────────────────────────────
  const cat2 = checkEventCoverageMatchers(hooksSection, findings);
  scores.event_coverage_matchers = cat2;

  // ── Category 3: Global/Local Consistency ─────────────────────────────────
  const cat3 = checkGlobalLocalConsistency(rootDir, hooksSection, findings);
  scores.global_local_consistency = cat3;

  return { domain: DOMAIN, findings, scores };
}

// ── Category 1: Settings File Alignment ────────────────────────────────────

/**
 * Extract .js filenames referenced in hook commands.
 * Commands look like:
 *   "node .claude/hooks/session-start.js"
 *   "CLAUDE_TOOL=write node .claude/hooks/post-write-validator.js $ARGUMENTS"
 * We extract the basename of the .js file.
 */
function extractReferencedJsFiles(hooksSection) {
  const referenced = new Set();
  for (const eventType of Object.keys(hooksSection)) {
    const groups = hooksSection[eventType];
    if (!Array.isArray(groups)) continue;
    for (const group of groups) {
      const hooks = group.hooks || [];
      for (const hook of hooks) {
        const cmd = hook.command || "";
        // Match .js file paths in .claude/hooks/ (not lib/ or global/)
        const jsMatch = cmd.match(/\.claude\/hooks\/([^/\s$]+\.js)/);
        if (jsMatch) {
          referenced.add(jsMatch[1]);
        }
      }
    }
  }
  return referenced;
}

/**
 * List all .js files directly in .claude/hooks/ (exclude lib/, global/, backup/).
 */
function listHookJsFiles(rootDir) {
  const hooksDir = path.join(rootDir, ".claude", "hooks");
  const files = new Set();
  try {
    const entries = fs.readdirSync(hooksDir, { withFileTypes: true });
    for (const entry of entries) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      if (entry.isFile() && entry.name.endsWith(".js")) {
        files.add(entry.name);
      }
    }
  } catch {
    // Directory not accessible
  }
  return files;
}

function checkSettingsFileAlignment(rootDir, hooksSection, findings) {
  const bench = BENCHMARKS.settings_file_alignment;

  const referenced = extractReferencedJsFiles(hooksSection);
  const onDisk = listHookJsFiles(rootDir);

  // Cross-reference: find mismatches
  const missingOnDisk = []; // referenced in settings but file doesn't exist
  const unregistered = []; // file exists but not referenced in settings

  for (const ref of referenced) {
    if (!onDisk.has(ref)) {
      missingOnDisk.push(ref);
    }
  }

  for (const file of onDisk) {
    if (!referenced.has(file)) {
      unregistered.push(file);
    }
  }

  // Total unique entries across both sets
  const allUnique = new Set([...referenced, ...onDisk]);
  const total = allUnique.size;
  const matched = total - missingOnDisk.length - unregistered.length;
  const alignmentPct = total > 0 ? Math.round((matched / total) * 100) : 100;

  const result = scoreMetric(alignmentPct, bench.alignment_pct, "higher-is-better");

  if (missingOnDisk.length > 0) {
    findings.push({
      id: "HEA-101",
      category: "settings_file_alignment",
      domain: DOMAIN,
      severity: "error",
      message: `${missingOnDisk.length} hook(s) referenced in settings.json but file not found on disk`,
      details: `Missing files: ${missingOnDisk.join(", ")}. These hooks will fail at runtime.`,
      impactScore: 85,
      frequency: missingOnDisk.length,
      blastRadius: 4,
      patchType: "config_fix",
      patchTarget: ".claude/settings.json",
      patchContent: "Remove orphaned hook entries or create the missing .js files",
      patchImpact: "Prevent runtime hook failures",
    });
  }

  if (unregistered.length > 0) {
    findings.push({
      id: "HEA-102",
      category: "settings_file_alignment",
      domain: DOMAIN,
      severity: "warning",
      message: `${unregistered.length} hook file(s) on disk not registered in settings.json`,
      details: `Unregistered files: ${unregistered.join(", ")}. These hooks will never execute.`,
      impactScore: 50,
      frequency: unregistered.length,
      blastRadius: 2,
      patchType: "config_fix",
      patchTarget: ".claude/settings.json",
      patchContent: "Register orphaned hook files or remove them if no longer needed",
      patchImpact: "Ensure all hook files are either active or cleaned up",
    });
  }

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      alignmentPct,
      referencedCount: referenced.size,
      onDiskCount: onDisk.size,
      missingOnDisk: missingOnDisk.length,
      unregistered: unregistered.length,
    },
  };
}

// ── Category 2: Event Coverage & Matchers ──────────────────────────────────

function checkEventCoverageMatchers(hooksSection, findings) {
  const bench = BENCHMARKS.event_coverage_matchers;

  // Check coverage: all 4 event types should have at least one handler
  const coveredEvents = [];
  const uncoveredEvents = [];
  for (const eventType of REQUIRED_EVENT_TYPES) {
    const groups = hooksSection[eventType];
    if (Array.isArray(groups) && groups.length > 0) {
      coveredEvents.push(eventType);
    } else {
      uncoveredEvents.push(eventType);
    }
  }

  const coveragePct =
    REQUIRED_EVENT_TYPES.length > 0
      ? Math.round((coveredEvents.length / REQUIRED_EVENT_TYPES.length) * 100)
      : 0;

  // Validate all matcher strings as valid regexes
  const allMatchers = [];
  const invalidMatchers = [];
  const matchersByEvent = {};

  for (const eventType of Object.keys(hooksSection)) {
    const groups = hooksSection[eventType];
    if (!Array.isArray(groups)) continue;
    if (!matchersByEvent[eventType]) matchersByEvent[eventType] = [];
    for (const group of groups) {
      const matcher = group.matcher;
      if (matcher !== undefined && matcher !== null) {
        allMatchers.push({ eventType, matcher });
        matchersByEvent[eventType].push(matcher);
        try {
          // Claude Code supports (?i) inline flag for case-insensitive matching.
          // Strip it before validating since JS RegExp doesn't support inline flags.
          const normalized = matcher.replace(/\(\?i\)/g, "");
          new RegExp(normalized);
        } catch {
          invalidMatchers.push({ eventType, matcher });
        }
      }
    }
  }

  const totalMatchers = allMatchers.length;
  const validMatchers = totalMatchers - invalidMatchers.length;
  const validityPct = totalMatchers > 0 ? Math.round((validMatchers / totalMatchers) * 100) : 100;

  // Check for overlapping matchers on the same event type
  const overlaps = [];
  for (const [eventType, matchers] of Object.entries(matchersByEvent)) {
    if (matchers.length < 2) continue;
    for (let i = 0; i < matchers.length; i++) {
      for (let j = i + 1; j < matchers.length; j++) {
        if (matchersOverlap(matchers[i], matchers[j])) {
          overlaps.push({
            eventType,
            matcher1: matchers[i],
            matcher2: matchers[j],
          });
        }
      }
    }
  }

  // Score: average of coverage and validity
  const coverageResult = scoreMetric(coveragePct, bench.coverage_pct, "higher-is-better");
  const validityResult = scoreMetric(validityPct, bench.validity_pct, "higher-is-better");
  const avgScore = Math.round((coverageResult.score + validityResult.score) / 2);

  if (uncoveredEvents.length > 0) {
    findings.push({
      id: "HEA-110",
      category: "event_coverage_matchers",
      domain: DOMAIN,
      severity: uncoveredEvents.length >= 2 ? "error" : "warning",
      message: `${uncoveredEvents.length} event type(s) have no handlers: ${uncoveredEvents.join(", ")}`,
      details: `All 4 event types should have at least one handler. Coverage: ${coveragePct}%`,
      impactScore: uncoveredEvents.length >= 2 ? 80 : 55,
      frequency: 1,
      blastRadius: 3,
      patchType: "config_fix",
      patchTarget: ".claude/settings.json",
      patchContent: `Add hook handlers for: ${uncoveredEvents.join(", ")}`,
      patchImpact: "Ensure full lifecycle hook coverage",
    });
  }

  if (invalidMatchers.length > 0) {
    const details = invalidMatchers.map((m) => `${m.eventType}: "${m.matcher}"`).join("; ");
    findings.push({
      id: "HEA-111",
      category: "event_coverage_matchers",
      domain: DOMAIN,
      severity: "error",
      message: `${invalidMatchers.length} invalid regex matcher(s) found`,
      details: `Invalid matchers: ${details}. These will cause runtime errors.`,
      impactScore: 90,
      frequency: invalidMatchers.length,
      blastRadius: 4,
      patchType: "config_fix",
      patchTarget: ".claude/settings.json",
      patchContent: "Fix invalid regex patterns in matcher fields",
      patchImpact: "Prevent regex compilation failures at hook execution time",
    });
  }

  if (overlaps.length > 0) {
    const details = overlaps
      .map((o) => `${o.eventType}: "${o.matcher1}" overlaps "${o.matcher2}"`)
      .join("; ");
    findings.push({
      id: "HEA-112",
      category: "event_coverage_matchers",
      domain: DOMAIN,
      severity: "info",
      message: `${overlaps.length} overlapping matcher pair(s) detected on same event type`,
      details: `Overlapping matchers: ${details}. May cause duplicate hook execution.`,
      impactScore: 30,
      frequency: overlaps.length,
      blastRadius: 2,
    });
  }

  return {
    score: avgScore,
    rating: avgScore >= 90 ? "good" : avgScore >= 70 ? "average" : "poor",
    metrics: {
      coveragePct,
      validityPct,
      totalMatchers,
      invalidMatchers: invalidMatchers.length,
      overlaps: overlaps.length,
      coveredEvents: coveredEvents.length,
    },
  };
}

/**
 * Test whether two regex matcher strings could overlap (match same input).
 * Uses a heuristic: compile both regexes and test against a set of common
 * tool names. If both match the same test string, they overlap.
 */
function matchersOverlap(m1, m2) {
  // Common tool names that hooks typically match against
  const testStrings = [
    "write",
    "Write",
    "WRITE",
    "edit",
    "Edit",
    "EDIT",
    "multiedit",
    "MultiEdit",
    "MULTIEDIT",
    "read",
    "Read",
    "READ",
    "bash",
    "Bash",
    "BASH",
    "task",
    "Task",
    "TASK",
    "askuserquestion",
    "AskUserQuestion",
    "ASKUSERQUESTION",
    "compact",
  ];

  try {
    // Normalize (?i) inline flags to JS-compatible 'i' flag
    const hasI1 = m1.includes("(?i)");
    const hasI2 = m2.includes("(?i)");
    const r1 = new RegExp(m1.replace(/\(\?i\)/g, ""), hasI1 ? "i" : "");
    const r2 = new RegExp(m2.replace(/\(\?i\)/g, ""), hasI2 ? "i" : "");
    for (const s of testStrings) {
      if (r1.test(s) && r2.test(s)) return true;
    }
  } catch {
    // If either regex is invalid, can't determine overlap
    return false;
  }
  return false;
}

// ── Category 3: Global/Local Consistency ───────────────────────────────────

function checkGlobalLocalConsistency(rootDir, hooksSection, findings) {
  const bench = BENCHMARKS.global_local_consistency;

  const hooksDir = path.join(rootDir, ".claude", "hooks");
  const globalDir = path.join(hooksDir, "global");

  // List .js files in global/
  const globalFiles = new Set();
  try {
    const entries = fs.readdirSync(globalDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".js")) {
        globalFiles.add(entry.name);
      }
    }
  } catch {
    // global/ directory not accessible
  }

  // List .js files in hooks/ root (excluding subdirs)
  const localFiles = listHookJsFiles(rootDir);

  // Check for name collisions (same basename in both dirs)
  const nameCollisions = [];
  for (const globalFile of globalFiles) {
    if (localFiles.has(globalFile)) {
      // Compare content to see if they differ
      const globalPath = path.join(globalDir, globalFile);
      const localPath = path.join(hooksDir, globalFile);
      const globalContent = safeReadFile(globalPath);
      const localContent = safeReadFile(localPath);
      if (globalContent !== localContent) {
        nameCollisions.push(globalFile);
      }
    }
  }

  // Check if global hooks are registered in settings.json
  const referenced = extractReferencedJsFiles(hooksSection);
  // Also check for global/ path references in commands
  const globalReferenced = extractGlobalReferencedJsFiles(hooksSection);
  const unregisteredGlobal = [];
  for (const globalFile of globalFiles) {
    if (!referenced.has(globalFile) && !globalReferenced.has(globalFile)) {
      unregisteredGlobal.push(globalFile);
    }
  }

  const conflictCount = nameCollisions.length + unregisteredGlobal.length;
  const rawScore = 100 - conflictCount * 20;
  const score = Math.max(0, Math.min(100, rawScore));

  // Use lower-is-better scoring for conflict_count
  const result = scoreMetric(nameCollisions.length, bench.conflict_count, "lower-is-better");

  if (nameCollisions.length > 0) {
    findings.push({
      id: "HEA-120",
      category: "global_local_consistency",
      domain: DOMAIN,
      severity: "error",
      message: `${nameCollisions.length} filename collision(s) between global/ and local hooks with different content`,
      details: `Colliding files: ${nameCollisions.join(", ")}. Same filename in .claude/hooks/ and .claude/hooks/global/ with different content creates ambiguity.`,
      impactScore: 75,
      frequency: nameCollisions.length,
      blastRadius: 3,
      patchType: "refactor",
      patchTarget: ".claude/hooks/global/",
      patchContent: "Rename global hooks to avoid collision or consolidate into one location",
      patchImpact: "Eliminate hook execution ambiguity",
    });
  }

  if (unregisteredGlobal.length > 0) {
    findings.push({
      id: "HEA-121",
      category: "global_local_consistency",
      domain: DOMAIN,
      severity: "warning",
      message: `${unregisteredGlobal.length} global hook(s) not registered in settings.json`,
      details: `Unregistered global hooks: ${unregisteredGlobal.join(", ")}. These files exist but are not wired into any event handler.`,
      impactScore: 45,
      frequency: unregisteredGlobal.length,
      blastRadius: 2,
      patchType: "config_fix",
      patchTarget: ".claude/settings.json",
      patchContent: "Register global hooks or remove unused files",
      patchImpact: "Ensure global hooks are either active or cleaned up",
    });
  }

  return {
    score,
    rating: score >= 90 ? "good" : score >= 70 ? "average" : "poor",
    metrics: {
      globalFiles: globalFiles.size,
      localFiles: localFiles.size,
      nameCollisions: nameCollisions.length,
      unregisteredGlobal: unregisteredGlobal.length,
      conflictCount,
    },
  };
}

/**
 * Extract .js filenames referenced via global/ path in hook commands.
 * Commands might reference: "node .claude/hooks/global/statusline.js"
 */
function extractGlobalReferencedJsFiles(hooksSection) {
  const referenced = new Set();
  for (const eventType of Object.keys(hooksSection)) {
    const groups = hooksSection[eventType];
    if (!Array.isArray(groups)) continue;
    for (const group of groups) {
      const hooks = group.hooks || [];
      for (const hook of hooks) {
        const cmd = hook.command || "";
        const jsMatch = cmd.match(/\.claude\/hooks\/global\/([^/\s$]+\.js)/);
        if (jsMatch) {
          referenced.add(jsMatch[1]);
        }
      }
    }
  }
  return referenced;
}

// ── Utilities ──────────────────────────────────────────────────────────────

function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 10 * 1024 * 1024) return "";
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

module.exports = { run, DOMAIN };
