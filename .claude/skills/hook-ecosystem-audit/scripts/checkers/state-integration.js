/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * State & Integration Checker — Categories 14-16 (Domain D5)
 *
 * 14. State File Health
 * 15. Cross-Hook Dependencies
 * 16. Compaction Resilience
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[state-integration] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "state_integration";

/**
 * Run all state & integration checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const stateDir = path.join(rootDir, ".claude", "state");
  const hooksDir = path.join(rootDir, ".claude", "hooks");

  // ── Category 14: State File Health ──────────────────────────────────────
  scores.state_file_health = checkStateFileHealth(stateDir, findings);

  // ── Category 15: Cross-Hook Dependencies ────────────────────────────────
  scores.cross_hook_dependencies = checkCrossHookDependencies(rootDir, hooksDir, findings);

  // ── Category 16: Compaction Resilience ──────────────────────────────────
  scores.compaction_resilience = checkCompactionResilience(rootDir, hooksDir, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 14: State File Health ──────────────────────────────────────────

/**
 * List all .jsonl files in .claude/state/, validate JSON lines,
 * check file sizes, and flag rotation candidates.
 */
function checkStateFileHealth(stateDir, findings) {
  const bench = BENCHMARKS.state_file_health;

  let totalFiles = 0;
  let validFiles = 0;
  const fileDetails = [];

  try {
    if (!fs.existsSync(stateDir)) {
      findings.push({
        id: "HEA-500",
        category: "state_file_health",
        domain: DOMAIN,
        severity: "error",
        message: "State directory .claude/state/ does not exist",
        details:
          "The state directory is missing entirely. Hooks that write state files will fail silently.",
        impactScore: 90,
        frequency: 1,
        blastRadius: 5,
      });
      return {
        score: 0,
        rating: "poor",
        metrics: { totalFiles: 0, validFiles: 0, validPct: 0 },
      };
    }

    const entries = fs.readdirSync(stateDir).filter((f) => f.endsWith(".jsonl"));
    totalFiles = entries.length;

    for (const entry of entries) {
      const filePath = path.join(stateDir, entry);
      let stat;
      try {
        stat = fs.statSync(filePath);
      } catch {
        continue;
      }

      const sizeBytes = stat.size;
      const sizeMB = sizeBytes / (1024 * 1024);
      let content;
      try {
        content = fs.readFileSync(filePath, "utf8");
      } catch {
        findings.push({
          id: "HEA-501",
          category: "state_file_health",
          domain: DOMAIN,
          severity: "error",
          message: `State file unreadable: ${entry}`,
          details: `Could not read ${entry} in .claude/state/. File may be locked or corrupted.`,
          impactScore: 70,
          frequency: 1,
          blastRadius: 2,
        });
        continue;
      }

      const lines = content
        .split("\n")
        .map((l) => l.replace(/\r$/, ""))
        .filter((l) => l.trim().length > 0);
      const lineCount = lines.length;
      let corruptLines = 0;

      for (const line of lines) {
        try {
          JSON.parse(line);
        } catch {
          corruptLines++;
        }
      }

      const isValid = corruptLines === 0;
      if (isValid) validFiles++;

      fileDetails.push({
        name: entry,
        sizeMB: Math.round(sizeMB * 100) / 100,
        lineCount,
        corruptLines,
      });

      // Size warnings
      if (sizeMB > 5) {
        findings.push({
          id: "HEA-502",
          category: "state_file_health",
          domain: DOMAIN,
          severity: "error",
          message: `State file exceeds 5MB: ${entry} (${sizeMB.toFixed(1)}MB)`,
          details:
            "File is dangerously large. Hooks reading this file will be slow. Rotate or truncate immediately.",
          impactScore: 85,
          frequency: 1,
          blastRadius: 4,
        });
      } else if (sizeMB > 1) {
        findings.push({
          id: "HEA-503",
          category: "state_file_health",
          domain: DOMAIN,
          severity: "warning",
          message: `State file exceeds 1MB: ${entry} (${sizeMB.toFixed(1)}MB)`,
          details: "File is growing large. Consider rotation to keep hook performance optimal.",
          impactScore: 50,
          frequency: 1,
          blastRadius: 2,
        });
      }

      // Rotation warning
      if (lineCount > 1000) {
        findings.push({
          id: "HEA-504",
          category: "state_file_health",
          domain: DOMAIN,
          severity: "warning",
          message: `State file has ${lineCount} lines (>1000): ${entry}`,
          details:
            "File may need rotation. Use .claude/hooks/lib/rotate-state.js to manage file size.",
          impactScore: 40,
          frequency: 1,
          blastRadius: 2,
        });
      }

      // Corruption
      if (corruptLines > 0) {
        findings.push({
          id: "HEA-505",
          category: "state_file_health",
          domain: DOMAIN,
          severity: "error",
          message: `${corruptLines} corrupt JSON line(s) in ${entry}`,
          details: `${corruptLines} of ${lineCount} lines failed JSON.parse(). Data loss or write interruption likely.`,
          impactScore: 75,
          frequency: corruptLines,
          blastRadius: 3,
        });
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    findings.push({
      id: "HEA-506",
      category: "state_file_health",
      domain: DOMAIN,
      severity: "error",
      message: `Failed to scan state directory: ${msg.slice(0, 150)}`,
      details: "Could not enumerate .claude/state/ files.",
      impactScore: 80,
      frequency: 1,
      blastRadius: 4,
    });
  }

  const validPct = totalFiles > 0 ? Math.round((validFiles / totalFiles) * 100) : 100;
  const result = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { totalFiles, validFiles, validPct, fileDetails },
  };
}

// ── Category 15: Cross-Hook Dependencies ────────────────────────────────────

/**
 * Patterns to detect state file reads and writes in hook source code.
 */
const readOps = ["read" + "FileSync", "read" + "File", "existsSync"];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const READ_PATTERNS = readOps.map(
  (op) => new RegExp(escapeRegex(op) + "\\s*\\([^)]*state[/\\\\]", "g")
);

const writeOps = ["write" + "FileSync", "append" + "FileSync", "write" + "File", "append" + "File"];
const WRITE_PATTERNS = writeOps.map(
  (op) => new RegExp(escapeRegex(op) + "\\s*\\([^)]*state[/\\\\]", "g")
);

/**
 * Extract referenced state file names from source code using a set of patterns.
 * @param {string} source - The hook source code
 * @param {RegExp[]} patterns - Array of regex patterns to match
 * @returns {string[]} - Array of state file names found
 */
function extractStateFileRefs(source, patterns) {
  const refs = new Set();
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      // Extract the filename from the matched context
      // Look at surrounding code for the actual filename
      const start = Math.max(0, match.index - 20);
      const end = Math.min(source.length, match.index + match[0].length + 80);
      const context = source.slice(start, end);

      // Try to find quoted filename after state/
      const fileMatch = context.match(/state[/\\]["']?\s*,?\s*["']([^"']+\.jsonl?)["']/);
      if (fileMatch) {
        refs.add(fileMatch[1]);
      } else {
        // Try path.join pattern: state", "filename.jsonl"
        const joinMatch = context.match(/["']state["']\s*,\s*["']([^"']+\.jsonl?)["']/);
        if (joinMatch) {
          refs.add(joinMatch[1]);
        }
      }
    }
  }
  return Array.from(refs);
}

/**
 * Build the event ordering from settings.json hooks configuration.
 * Returns a map of hookFile -> eventIndex (lower = earlier in execution).
 */
function buildEventOrdering(rootDir) {
  const settingsPath = path.join(rootDir, ".claude", "settings.json");
  const ordering = {};

  try {
    if (!fs.existsSync(settingsPath)) return ordering;
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    if (!settings.hooks) return ordering;

    // Define event execution order (Claude Code lifecycle)
    const eventOrder = [
      "SessionStart",
      "PreToolUse",
      "PostToolUse",
      "PreCompact",
      "UserPromptSubmit",
    ];

    let globalIndex = 0;
    for (const eventName of eventOrder) {
      const eventHooks = settings.hooks[eventName];
      if (!Array.isArray(eventHooks)) continue;

      for (const group of eventHooks) {
        const hooks = group.hooks || [];
        for (const hook of hooks) {
          if (hook.command) {
            // Extract the JS filename from the command
            const cmdMatch = hook.command.match(/node\s+(?:[^\s]*\s+)?([^\s$]+\.js)/);
            if (cmdMatch) {
              const hookFile = path.basename(cmdMatch[1]);
              ordering[hookFile] = {
                index: globalIndex++,
                event: eventName,
                matcher: group.matcher || null,
              };
            }
          }
        }
      }
    }
  } catch {
    // settings.json missing or malformed
  }

  return ordering;
}

/**
 * Scan hook source files and build dependency maps.
 */
function checkCrossHookDependencies(rootDir, hooksDir, findings) {
  const bench = BENCHMARKS.cross_hook_dependencies;
  let issuesCount = 0;

  const depMap = {}; // hookFile -> { reads: [...], writes: [...] }

  try {
    if (!fs.existsSync(hooksDir)) {
      findings.push({
        id: "HEA-510",
        category: "cross_hook_dependencies",
        domain: DOMAIN,
        severity: "warning",
        message: "Hooks directory .claude/hooks/ not found",
        details: "Cannot analyze cross-hook dependencies without hook source files.",
        impactScore: 40,
        frequency: 1,
        blastRadius: 2,
      });
      return {
        score: 100,
        rating: "good",
        metrics: { issuesCount: 0, hooksAnalyzed: 0 },
      };
    }

    // Collect all .js files in hooks dir (top-level only, not lib/)
    const hookFiles = fs.readdirSync(hooksDir).filter((f) => f.endsWith(".js") && f[0] !== ".");

    for (const hookFile of hookFiles) {
      const filePath = path.join(hooksDir, hookFile);
      let source;
      try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;
        source = fs.readFileSync(filePath, "utf8");
      } catch {
        continue;
      }

      const reads = extractStateFileRefs(source, READ_PATTERNS);
      const writes = extractStateFileRefs(source, WRITE_PATTERNS);

      if (reads.length > 0 || writes.length > 0) {
        depMap[hookFile] = { reads, writes };
      }
    }

    // Build write→file and read→file indexes
    const writersOf = {}; // stateFile -> [hookFile, ...]
    const readersOf = {}; // stateFile -> [hookFile, ...]

    for (const [hookFile, deps] of Object.entries(depMap)) {
      for (const wf of deps.writes) {
        if (!writersOf[wf]) writersOf[wf] = [];
        writersOf[wf].push(hookFile);
      }
      for (const rf of deps.reads) {
        if (!readersOf[rf]) readersOf[rf] = [];
        readersOf[rf].push(hookFile);
      }
    }

    // Check write-before-read ordering
    const eventOrdering = buildEventOrdering(rootDir);

    for (const [stateFile, readers] of Object.entries(readersOf)) {
      const writers = writersOf[stateFile] || [];
      if (writers.length === 0) continue; // No writer tracked, skip

      for (const reader of readers) {
        for (const writer of writers) {
          if (reader === writer) continue; // Same hook reads and writes — ok

          const readerOrder = eventOrdering[reader];
          const writerOrder = eventOrdering[writer];

          if (!readerOrder || !writerOrder) continue; // Not registered in settings

          if (readerOrder.index < writerOrder.index) {
            issuesCount++;
            findings.push({
              id: "HEA-511",
              category: "cross_hook_dependencies",
              domain: DOMAIN,
              severity: "warning",
              message: `Read-before-write: ${reader} reads ${stateFile} before ${writer} writes it`,
              details: `${reader} (${readerOrder.event}, index ${readerOrder.index}) reads ${stateFile} but ${writer} (${writerOrder.event}, index ${writerOrder.index}) writes it later. Data may be stale.`,
              impactScore: 60,
              frequency: 1,
              blastRadius: 3,
            });
          }
        }
      }
    }

    // Check circular dependencies
    for (const [hookA, depsA] of Object.entries(depMap)) {
      for (const [hookB, depsB] of Object.entries(depMap)) {
        if (hookA >= hookB) continue; // Avoid duplicates

        // A writes something B reads, AND B writes something A reads
        const aWritesBReads = depsA.writes.some((w) => depsB.reads.includes(w));
        const bWritesAReads = depsB.writes.some((w) => depsA.reads.includes(w));

        if (aWritesBReads && bWritesAReads) {
          issuesCount++;
          findings.push({
            id: "HEA-512",
            category: "cross_hook_dependencies",
            domain: DOMAIN,
            severity: "error",
            message: `Circular dependency: ${hookA} <-> ${hookB}`,
            details: `${hookA} writes state that ${hookB} reads, and vice versa. This creates an ordering paradox.`,
            impactScore: 80,
            frequency: 1,
            blastRadius: 4,
          });
        }
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    findings.push({
      id: "HEA-513",
      category: "cross_hook_dependencies",
      domain: DOMAIN,
      severity: "error",
      message: `Failed to analyze hook dependencies: ${msg.slice(0, 150)}`,
      details: "Could not scan hook source files for state file references.",
      impactScore: 60,
      frequency: 1,
      blastRadius: 3,
    });
  }

  const result = scoreMetric(issuesCount, bench.issues_count, "lower-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      issuesCount,
      hooksAnalyzed: Object.keys(depMap).length,
      dependencyMap: depMap,
    },
  };
}

// ── Category 16: Compaction Resilience ───────────────────────────────────────

/**
 * Check the 4 layers of compaction resilience:
 *   Layer A: commit-tracker.js exists and writes to commit-log.jsonl
 *   Layer B: pre-compaction-save.js exists and creates snapshots
 *   Layer C: PreCompact hooks registered in settings.json
 *   Layer D: compact-restore.js exists and registered for SessionStart:compact
 */
function checkCompactionResilience(rootDir, hooksDir, findings) {
  const bench = BENCHMARKS.compaction_resilience;
  let layersPresent = 0;
  const layerStatus = {
    A: { present: false, details: "" },
    B: { present: false, details: "" },
    C: { present: false, details: "" },
    D: { present: false, details: "" },
  };

  // ── Layer A: commit-tracker.js writes to commit-log.jsonl ──────────────

  const commitTrackerPath = path.join(hooksDir, "commit-tracker.js");
  try {
    if (fs.existsSync(commitTrackerPath)) {
      const source = fs.readFileSync(commitTrackerPath, "utf8");
      const writesCommitLog = source.includes("commit-log.jsonl") || source.includes("commit-log");
      if (writesCommitLog) {
        layerStatus.A = { present: true, details: "commit-tracker.js writes to commit-log.jsonl" };
        layersPresent++;
      } else {
        layerStatus.A = {
          present: false,
          details: "commit-tracker.js exists but does not reference commit-log.jsonl",
        };
        findings.push({
          id: "HEA-520",
          category: "compaction_resilience",
          domain: DOMAIN,
          severity: "warning",
          message: "Layer A: commit-tracker.js does not reference commit-log.jsonl",
          details:
            "The commit tracker hook exists but may not be writing to the expected state file.",
          impactScore: 55,
          frequency: 1,
          blastRadius: 3,
        });
      }
    } else {
      layerStatus.A = { present: false, details: "commit-tracker.js not found" };
      findings.push({
        id: "HEA-521",
        category: "compaction_resilience",
        domain: DOMAIN,
        severity: "error",
        message: "Layer A missing: commit-tracker.js not found in hooks directory",
        details:
          "Without Layer A, commits are not tracked across compactions. Session gap detection will fail.",
        impactScore: 80,
        frequency: 1,
        blastRadius: 4,
      });
    }
  } catch {
    layerStatus.A = { present: false, details: "Error reading commit-tracker.js" };
  }

  // ── Layer B: pre-compaction-save.js creates snapshots ──────────────────

  const preCompactionPath = path.join(hooksDir, "pre-compaction-save.js");
  try {
    if (fs.existsSync(preCompactionPath)) {
      const source = fs.readFileSync(preCompactionPath, "utf8");
      const createsSnapshot = source.includes("handoff.json") || source.includes("snapshot");
      if (createsSnapshot) {
        layerStatus.B = {
          present: true,
          details: "pre-compaction-save.js creates state snapshots",
        };
        layersPresent++;
      } else {
        layerStatus.B = {
          present: false,
          details: "pre-compaction-save.js exists but does not reference handoff.json or snapshot",
        };
        findings.push({
          id: "HEA-522",
          category: "compaction_resilience",
          domain: DOMAIN,
          severity: "warning",
          message: "Layer B: pre-compaction-save.js does not create recognizable snapshots",
          details: "The pre-compaction hook exists but may not be saving state to handoff.json.",
          impactScore: 55,
          frequency: 1,
          blastRadius: 3,
        });
      }
    } else {
      layerStatus.B = { present: false, details: "pre-compaction-save.js not found" };
      findings.push({
        id: "HEA-523",
        category: "compaction_resilience",
        domain: DOMAIN,
        severity: "error",
        message: "Layer B missing: pre-compaction-save.js not found",
        details:
          "Without Layer B, no state snapshot is taken before compaction. Context will be lost.",
        impactScore: 85,
        frequency: 1,
        blastRadius: 5,
      });
    }
  } catch {
    layerStatus.B = { present: false, details: "Error reading pre-compaction-save.js" };
  }

  // ── Layer C: PreCompact hooks registered in settings.json ──────────────

  const settingsPath = path.join(rootDir, ".claude", "settings.json");
  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
      const preCompactHooks = settings.hooks && settings.hooks.PreCompact;

      if (Array.isArray(preCompactHooks) && preCompactHooks.length > 0) {
        // Verify at least one hook references pre-compaction-save
        const hasPreCompSave = preCompactHooks.some((group) => {
          const hooks = group.hooks || [];
          return hooks.some((h) => h.command && h.command.includes("pre-compaction-save"));
        });

        if (hasPreCompSave) {
          layerStatus.C = {
            present: true,
            details: "PreCompact event registered with pre-compaction-save.js",
          };
          layersPresent++;
        } else {
          layerStatus.C = {
            present: false,
            details: "PreCompact event exists but does not reference pre-compaction-save.js",
          };
          findings.push({
            id: "HEA-524",
            category: "compaction_resilience",
            domain: DOMAIN,
            severity: "warning",
            message: "Layer C: PreCompact event does not reference pre-compaction-save.js",
            details: "The PreCompact event is registered but may be running a different hook.",
            impactScore: 50,
            frequency: 1,
            blastRadius: 3,
          });
        }
      } else {
        layerStatus.C = { present: false, details: "No PreCompact event in settings.json" };
        findings.push({
          id: "HEA-525",
          category: "compaction_resilience",
          domain: DOMAIN,
          severity: "error",
          message: "Layer C missing: No PreCompact event registered in settings.json",
          details:
            "Without a PreCompact hook, state snapshots cannot fire at the right moment before compaction.",
          impactScore: 80,
          frequency: 1,
          blastRadius: 4,
        });
      }
    } else {
      layerStatus.C = { present: false, details: "settings.json not found" };
    }
  } catch {
    layerStatus.C = { present: false, details: "Error parsing settings.json" };
  }

  // ── Layer D: compact-restore.js registered for SessionStart:compact ────

  const compactRestorePath = path.join(hooksDir, "compact-restore.js");
  try {
    if (fs.existsSync(compactRestorePath)) {
      // Also verify it is registered in settings.json under SessionStart with matcher "compact"
      let registeredForCompact = false;

      try {
        if (fs.existsSync(settingsPath)) {
          const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
          const sessionStartHooks = settings.hooks && settings.hooks.SessionStart;

          if (Array.isArray(sessionStartHooks)) {
            registeredForCompact = sessionStartHooks.some((group) => {
              if (group.matcher !== "compact") return false;
              const hooks = group.hooks || [];
              return hooks.some((h) => h.command && h.command.includes("compact-restore"));
            });
          }
        }
      } catch {
        // settings.json parse error
      }

      if (registeredForCompact) {
        // Verify recovery chain: does compact-restore.js read handoff.json?
        const source = fs.readFileSync(compactRestorePath, "utf8");
        const readsHandoff = source.includes("handoff.json");

        if (readsHandoff) {
          layerStatus.D = {
            present: true,
            details: "compact-restore.js registered for SessionStart:compact, reads handoff.json",
          };
          layersPresent++;
        } else {
          layerStatus.D = {
            present: false,
            details: "compact-restore.js registered but does not reference handoff.json",
          };
          findings.push({
            id: "HEA-526",
            category: "compaction_resilience",
            domain: DOMAIN,
            severity: "warning",
            message:
              "Layer D: compact-restore.js does not read handoff.json — recovery chain may be broken",
            details:
              "pre-compaction-save.js writes handoff.json, but compact-restore.js does not appear to read it.",
            impactScore: 65,
            frequency: 1,
            blastRadius: 4,
          });
        }
      } else {
        layerStatus.D = {
          present: false,
          details: "compact-restore.js exists but not registered for SessionStart:compact",
        };
        findings.push({
          id: "HEA-527",
          category: "compaction_resilience",
          domain: DOMAIN,
          severity: "error",
          message:
            "Layer D: compact-restore.js not registered for SessionStart with 'compact' matcher",
          details:
            "The restore hook exists but is not triggered after compaction. Register it in settings.json under SessionStart with matcher 'compact'.",
          impactScore: 75,
          frequency: 1,
          blastRadius: 4,
        });
      }
    } else {
      layerStatus.D = { present: false, details: "compact-restore.js not found" };
      findings.push({
        id: "HEA-528",
        category: "compaction_resilience",
        domain: DOMAIN,
        severity: "error",
        message: "Layer D missing: compact-restore.js not found in hooks directory",
        details:
          "Without Layer D, context cannot be restored after compaction. Sessions will lose all pre-compaction state.",
        impactScore: 85,
        frequency: 1,
        blastRadius: 5,
      });
    }
  } catch {
    layerStatus.D = { present: false, details: "Error checking compact-restore.js" };
  }

  const layersCoveredPct = Math.round((layersPresent / 4) * 100);
  const result = scoreMetric(layersCoveredPct, bench.layers_covered_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: { layersPresent, layersCoveredPct, layerStatus },
  };
}

module.exports = { run, DOMAIN };
