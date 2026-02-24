/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * State Persistence & Handoff Checker — D2 Categories (Domain D2)
 *
 * 1. handoff_file_schema     — Validate .claude/state/handoff.json schema
 * 2. commit_log_integrity    — Validate .claude/state/commit-log.jsonl entries
 * 3. task_state_file_health  — Validate .claude/state/task-*.state.json files
 * 4. session_notes_quality   — Validate .claude/state/session-notes.json
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[state-persistence] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "state_persistence";

/**
 * Safely read a file, returning null if it does not exist or cannot be read.
 * @param {string} filePath - Absolute path to read
 * @returns {{ content: string } | { error: string }}
 */
function safeReadFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { error: "not_found" };
    }
    const content = fs.readFileSync(filePath, "utf8");
    return { content };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  }
}

/**
 * Run all state persistence & handoff checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const stateDir = path.join(rootDir, ".claude", "state");

  // ── Category 1: Handoff File Schema ─────────────────────────────────────
  scores.handoff_file_schema = checkHandoffFileSchema(stateDir, findings);

  // ── Category 2: Commit Log Integrity ────────────────────────────────────
  scores.commit_log_integrity = checkCommitLogIntegrity(stateDir, findings);

  // ── Category 3: Task State File Health ──────────────────────────────────
  scores.task_state_file_health = checkTaskStateFileHealth(stateDir, findings);

  // ── Category 4: Session Notes Quality ───────────────────────────────────
  scores.session_notes_quality = checkSessionNotesQuality(stateDir, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category 1: Handoff File Schema ──────────────────────────────────────────

const HANDOFF_REQUIRED_FIELDS = [
  "timestamp",
  "trigger",
  "sessionId",
  "gitState",
  "taskStates",
  "commitLog",
  "contextMetrics",
  "agentsUsed",
  "activePlan",
  "sessionNotes",
  "recoveryInstruction",
];

const GIT_STATE_REQUIRED_FIELDS = ["branch", "recentCommits", "uncommittedFiles"];

/**
 * Read .claude/state/handoff.json and validate required fields.
 * Score: present_fields / required_fields * 100
 */
function checkHandoffFileSchema(stateDir, findings) {
  const bench = BENCHMARKS.handoff_file_schema;
  const filePath = path.join(stateDir, "handoff.json");

  const result = safeReadFile(filePath);
  if (result.error) {
    const isNotFound = result.error === "not_found";
    findings.push({
      id: "SEA-200",
      category: "handoff_file_schema",
      domain: DOMAIN,
      severity: isNotFound ? "warning" : "error",
      message: isNotFound
        ? "handoff.json not found — file may not have been generated yet"
        : `handoff.json unreadable: ${result.error.slice(0, 120)}`,
      details: isNotFound
        ? "The handoff file is created by pre-compaction-save.js. If no compaction has occurred, this is expected."
        : "The handoff file exists but could not be read. It may be locked or corrupted.",
      impactScore: isNotFound ? 40 : 70,
      frequency: 1,
      blastRadius: isNotFound ? 2 : 4,
    });
    return {
      score: 0,
      rating: "poor",
      metrics: { presentFields: 0, requiredFields: HANDOFF_REQUIRED_FIELDS.length, validPct: 0 },
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(result.content);
  } catch {
    findings.push({
      id: "SEA-201",
      category: "handoff_file_schema",
      domain: DOMAIN,
      severity: "error",
      message: "handoff.json is not valid JSON",
      details:
        "The handoff file exists but cannot be parsed. It may have been truncated during write.",
      impactScore: 80,
      frequency: 1,
      blastRadius: 4,
    });
    return {
      score: 0,
      rating: "poor",
      metrics: { presentFields: 0, requiredFields: HANDOFF_REQUIRED_FIELDS.length, validPct: 0 },
    };
  }

  // Check top-level required fields
  let presentFields = 0;
  const missingFields = [];

  for (const field of HANDOFF_REQUIRED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(parsed, field)) {
      presentFields++;
    } else {
      missingFields.push(field);
    }
  }

  // Validate gitState sub-fields if gitState exists
  let gitStateSubIssues = 0;
  if (parsed.gitState && typeof parsed.gitState === "object") {
    for (const subField of GIT_STATE_REQUIRED_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(parsed.gitState, subField)) {
        gitStateSubIssues++;
        findings.push({
          id: "SEA-203",
          category: "handoff_file_schema",
          domain: DOMAIN,
          severity: "warning",
          message: `handoff.json gitState missing sub-field: ${subField}`,
          details: `The gitState object should contain ${GIT_STATE_REQUIRED_FIELDS.join(", ")}.`,
          impactScore: 45,
          frequency: 1,
          blastRadius: 2,
        });
      }
    }
  }

  if (missingFields.length > 0) {
    findings.push({
      id: "SEA-202",
      category: "handoff_file_schema",
      domain: DOMAIN,
      severity: missingFields.length > 3 ? "error" : "warning",
      message: `handoff.json missing ${missingFields.length} required field(s): ${missingFields.join(", ")}`,
      details: `Required fields: ${HANDOFF_REQUIRED_FIELDS.join(", ")}. Present: ${presentFields}/${HANDOFF_REQUIRED_FIELDS.length}.`,
      impactScore: Math.min(90, missingFields.length * 15),
      frequency: 1,
      blastRadius: missingFields.length > 3 ? 4 : 2,
    });
  }

  const validPct = Math.round((presentFields / HANDOFF_REQUIRED_FIELDS.length) * 100);
  const scored = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  return {
    score: scored.score,
    rating: scored.rating,
    metrics: {
      presentFields,
      requiredFields: HANDOFF_REQUIRED_FIELDS.length,
      missingFields,
      gitStateSubIssues,
      validPct,
    },
  };
}

// ── Category 2: Commit Log Integrity ─────────────────────────────────────────

const COMMIT_LOG_REQUIRED_FIELDS = ["timestamp", "hash", "message"];
const COMMIT_LOG_MAX_SIZE_MB = 5;

/**
 * Read .claude/state/commit-log.jsonl. Validate each line as JSON.
 * Check required fields per entry, session field on recent entries, file size <5MB.
 * Score: valid_entries / total_entries * 100
 */
function checkCommitLogIntegrity(stateDir, findings) {
  const bench = BENCHMARKS.commit_log_integrity;
  const filePath = path.join(stateDir, "commit-log.jsonl");

  const result = safeReadFile(filePath);
  if (result.error) {
    const isNotFound = result.error === "not_found";
    findings.push({
      id: "SEA-210",
      category: "commit_log_integrity",
      domain: DOMAIN,
      severity: isNotFound ? "warning" : "error",
      message: isNotFound
        ? "commit-log.jsonl not found — commit tracker may not be active"
        : `commit-log.jsonl unreadable: ${result.error.slice(0, 120)}`,
      details: isNotFound
        ? "The commit log is populated by the commit-tracker PostToolUse hook. If no commits have been made, this is expected."
        : "The commit log exists but could not be read.",
      impactScore: isNotFound ? 35 : 70,
      frequency: 1,
      blastRadius: isNotFound ? 2 : 3,
    });
    return {
      score: isNotFound ? 100 : 0,
      rating: isNotFound ? "good" : "poor",
      metrics: { totalEntries: 0, validEntries: 0, validPct: isNotFound ? 100 : 0 },
    };
  }

  // Check file size
  let fileSizeMB = 0;
  try {
    const stat = fs.statSync(filePath);
    fileSizeMB = stat.size / (1024 * 1024);
  } catch {
    // Non-critical — continue with content validation
  }

  if (fileSizeMB > COMMIT_LOG_MAX_SIZE_MB) {
    findings.push({
      id: "SEA-211",
      category: "commit_log_integrity",
      domain: DOMAIN,
      severity: "error",
      message: `commit-log.jsonl exceeds ${COMMIT_LOG_MAX_SIZE_MB}MB (${fileSizeMB.toFixed(1)}MB)`,
      details:
        "File is too large. Consider rotating or truncating old entries to maintain hook performance.",
      impactScore: 80,
      frequency: 1,
      blastRadius: 3,
    });
  }

  const lines = result.content
    .split("\n")
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.trim().length > 0);

  const totalEntries = lines.length;

  if (totalEntries === 0) {
    findings.push({
      id: "SEA-212",
      category: "commit_log_integrity",
      domain: DOMAIN,
      severity: "info",
      message: "commit-log.jsonl is empty",
      details: "The file exists but contains no entries. This is normal for a fresh setup.",
      impactScore: 10,
      frequency: 1,
      blastRadius: 1,
    });
    return {
      score: 100,
      rating: "good",
      metrics: { totalEntries: 0, validEntries: 0, validPct: 100, fileSizeMB },
    };
  }

  let validEntries = 0;
  let corruptLines = 0;
  let missingFieldEntries = 0;
  let recentWithoutSession = 0;

  // Consider last 20 entries as "recent"
  const recentThreshold = Math.max(0, totalEntries - 20);

  for (let i = 0; i < totalEntries; i++) {
    const line = lines[i];
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      corruptLines++;
      continue;
    }

    // Check required fields
    let hasAllRequired = true;
    for (const field of COMMIT_LOG_REQUIRED_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(entry, field)) {
        hasAllRequired = false;
        break;
      }
    }

    if (!hasAllRequired) {
      missingFieldEntries++;
      continue;
    }

    // Check session field on recent entries
    if (i >= recentThreshold && !Object.prototype.hasOwnProperty.call(entry, "session")) {
      recentWithoutSession++;
    }

    validEntries++;
  }

  if (corruptLines > 0) {
    findings.push({
      id: "SEA-213",
      category: "commit_log_integrity",
      domain: DOMAIN,
      severity: "error",
      message: `${corruptLines} corrupt JSON line(s) in commit-log.jsonl`,
      details: `${corruptLines} of ${totalEntries} lines failed JSON.parse(). Data may have been truncated during write.`,
      impactScore: 75,
      frequency: corruptLines,
      blastRadius: 3,
    });
  }

  if (missingFieldEntries > 0) {
    findings.push({
      id: "SEA-214",
      category: "commit_log_integrity",
      domain: DOMAIN,
      severity: "warning",
      message: `${missingFieldEntries} commit-log entries missing required fields (timestamp, hash, message)`,
      details: `${missingFieldEntries} entries parsed as valid JSON but lack one or more of: ${COMMIT_LOG_REQUIRED_FIELDS.join(", ")}.`,
      impactScore: 50,
      frequency: missingFieldEntries,
      blastRadius: 2,
    });
  }

  if (recentWithoutSession > 0) {
    findings.push({
      id: "SEA-215",
      category: "commit_log_integrity",
      domain: DOMAIN,
      severity: "info",
      message: `${recentWithoutSession} recent commit-log entries missing 'session' field`,
      details: "Recent entries should include a session identifier for cross-session correlation.",
      impactScore: 25,
      frequency: recentWithoutSession,
      blastRadius: 1,
    });
  }

  const validPct = Math.round((validEntries / totalEntries) * 100);
  const scored = scoreMetric(validPct, bench.valid_pct, "higher-is-better");

  return {
    score: scored.score,
    rating: scored.rating,
    metrics: {
      totalEntries,
      validEntries,
      corruptLines,
      missingFieldEntries,
      recentWithoutSession,
      fileSizeMB: Math.round(fileSizeMB * 100) / 100,
      validPct,
    },
  };
}

// ── Category 3: Task State File Health ───────────────────────────────────────

/**
 * Glob .claude/state/task-*.state.json. Each must be valid JSON.
 * Check no orphaned state files (task completed but state still exists).
 * Score: healthy_files / total_files * 100 (100 if no files exist)
 */
function checkTaskStateFileHealth(stateDir, findings) {
  const bench = BENCHMARKS.task_state_file_health;

  let taskFiles;
  try {
    if (!fs.existsSync(stateDir)) {
      return {
        score: 100,
        rating: "good",
        metrics: { totalFiles: 0, healthyFiles: 0, healthPct: 100 },
      };
    }

    const allEntries = fs.readdirSync(stateDir);
    // Match task-*.state.json pattern using character-index check approach
    taskFiles = allEntries.filter((f) => {
      const prefix = "task-";
      const suffix = ".state.json";
      return (
        f.length > prefix.length + suffix.length &&
        f.slice(0, prefix.length) === prefix &&
        f.slice(f.length - suffix.length) === suffix
      );
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    findings.push({
      id: "SEA-220",
      category: "task_state_file_health",
      domain: DOMAIN,
      severity: "error",
      message: `Failed to scan state directory for task files: ${msg.slice(0, 120)}`,
      details: "Could not enumerate .claude/state/ for task-*.state.json files.",
      impactScore: 60,
      frequency: 1,
      blastRadius: 3,
    });
    return {
      score: 0,
      rating: "poor",
      metrics: { totalFiles: 0, healthyFiles: 0, healthPct: 0 },
    };
  }

  const totalFiles = taskFiles.length;

  if (totalFiles === 0) {
    return {
      score: 100,
      rating: "good",
      metrics: { totalFiles: 0, healthyFiles: 0, healthPct: 100 },
    };
  }

  let healthyFiles = 0;
  const orphanedFiles = [];
  const invalidFiles = [];

  for (const taskFile of taskFiles) {
    const filePath = path.join(stateDir, taskFile);
    const readResult = safeReadFile(filePath);

    if (readResult.error) {
      invalidFiles.push({ file: taskFile, reason: "unreadable" });
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(readResult.content);
    } catch {
      invalidFiles.push({ file: taskFile, reason: "invalid_json" });
      continue;
    }

    // Check for orphaned state (completed tasks with lingering state files)
    const status = parsed.status || parsed.state || "";
    const statusStr = String(status).toLowerCase();
    const isCompleted =
      statusStr === "completed" || statusStr === "done" || statusStr === "finished";

    if (isCompleted) {
      orphanedFiles.push(taskFile);
    } else {
      healthyFiles++;
    }
  }

  if (invalidFiles.length > 0) {
    findings.push({
      id: "SEA-221",
      category: "task_state_file_health",
      domain: DOMAIN,
      severity: "error",
      message: `${invalidFiles.length} task state file(s) are invalid`,
      details: invalidFiles
        .map((f) => `${f.file}: ${f.reason}`)
        .join("; ")
        .slice(0, 200),
      impactScore: 65,
      frequency: invalidFiles.length,
      blastRadius: 2,
    });
  }

  if (orphanedFiles.length > 0) {
    findings.push({
      id: "SEA-222",
      category: "task_state_file_health",
      domain: DOMAIN,
      severity: "warning",
      message: `${orphanedFiles.length} orphaned task state file(s) (completed but not cleaned up)`,
      details: `Files: ${orphanedFiles.join(", ").slice(0, 200)}. These can be safely deleted.`,
      impactScore: 30,
      frequency: orphanedFiles.length,
      blastRadius: 1,
    });
  }

  const healthPct = totalFiles > 0 ? Math.round((healthyFiles / totalFiles) * 100) : 100;
  const scored = scoreMetric(healthPct, bench.health_pct, "higher-is-better");

  return {
    score: scored.score,
    rating: scored.rating,
    metrics: {
      totalFiles,
      healthyFiles,
      invalidFiles: invalidFiles.length,
      orphanedFiles: orphanedFiles.length,
      healthPct,
    },
  };
}

// ── Category 4: Session Notes Quality ────────────────────────────────────────

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Read .claude/state/session-notes.json. Check it's valid JSON array.
 * Each entry should have timestamp and text. Check no entries older than 30 days.
 * Score: quality_checks_passed / total_checks * 100
 */
function checkSessionNotesQuality(stateDir, findings) {
  const bench = BENCHMARKS.session_notes_quality;
  const filePath = path.join(stateDir, "session-notes.json");

  const result = safeReadFile(filePath);
  if (result.error) {
    const isNotFound = result.error === "not_found";
    findings.push({
      id: "SEA-230",
      category: "session_notes_quality",
      domain: DOMAIN,
      severity: isNotFound ? "info" : "error",
      message: isNotFound
        ? "session-notes.json not found — no session notes have been recorded"
        : `session-notes.json unreadable: ${result.error.slice(0, 120)}`,
      details: isNotFound
        ? "Session notes are optional. They will be created when a session records notes."
        : "The session notes file exists but could not be read.",
      impactScore: isNotFound ? 10 : 60,
      frequency: 1,
      blastRadius: isNotFound ? 1 : 2,
    });
    return {
      score: isNotFound ? 100 : 0,
      rating: isNotFound ? "good" : "poor",
      metrics: { totalChecks: 0, passedChecks: 0, qualityPct: isNotFound ? 100 : 0 },
    };
  }

  // Quality checks:
  // 1. Is valid JSON
  // 2. Is an array
  // 3. All entries have 'timestamp'
  // 4. All entries have 'text'
  // 5. No entries older than 30 days (stale note cleanup)
  let totalChecks = 5;
  let passedChecks = 0;
  const checkResults = {};

  // Check 1: Valid JSON
  let parsed;
  try {
    parsed = JSON.parse(result.content);
    passedChecks++;
    checkResults.validJson = true;
  } catch {
    findings.push({
      id: "SEA-231",
      category: "session_notes_quality",
      domain: DOMAIN,
      severity: "error",
      message: "session-notes.json is not valid JSON",
      details: "The file exists but cannot be parsed as JSON.",
      impactScore: 70,
      frequency: 1,
      blastRadius: 3,
    });
    return {
      score: 0,
      rating: "poor",
      metrics: { totalChecks, passedChecks: 0, qualityPct: 0 },
    };
  }

  // Check 2: Is array
  if (Array.isArray(parsed)) {
    passedChecks++;
    checkResults.isArray = true;
  } else {
    checkResults.isArray = false;
    findings.push({
      id: "SEA-232",
      category: "session_notes_quality",
      domain: DOMAIN,
      severity: "error",
      message: "session-notes.json is not a JSON array",
      details: `Expected an array of note entries but got ${typeof parsed}.`,
      impactScore: 65,
      frequency: 1,
      blastRadius: 3,
    });
    // Cannot do further entry-level checks
    const qualityPct = Math.round((passedChecks / totalChecks) * 100);
    const scored = scoreMetric(qualityPct, bench.quality_pct, "higher-is-better");
    return {
      score: scored.score,
      rating: scored.rating,
      metrics: { totalChecks, passedChecks, qualityPct, checkResults },
    };
  }

  // Empty array is valid
  if (parsed.length === 0) {
    // All remaining checks pass trivially
    passedChecks += 3;
    checkResults.allHaveTimestamp = true;
    checkResults.allHaveText = true;
    checkResults.noStaleEntries = true;

    return {
      score: 100,
      rating: "good",
      metrics: { totalChecks, passedChecks, qualityPct: 100, entryCount: 0, checkResults },
    };
  }

  // Check 3: All entries have 'timestamp'
  const missingTimestamp = parsed.filter(
    (entry) => !entry || !Object.prototype.hasOwnProperty.call(entry, "timestamp")
  ).length;

  if (missingTimestamp === 0) {
    passedChecks++;
    checkResults.allHaveTimestamp = true;
  } else {
    checkResults.allHaveTimestamp = false;
    findings.push({
      id: "SEA-233",
      category: "session_notes_quality",
      domain: DOMAIN,
      severity: "warning",
      message: `${missingTimestamp} session note(s) missing 'timestamp' field`,
      details: "Each session note should have a timestamp for chronological ordering.",
      impactScore: 40,
      frequency: missingTimestamp,
      blastRadius: 1,
    });
  }

  // Check 4: All entries have 'text'
  const missingText = parsed.filter(
    (entry) => !entry || !Object.prototype.hasOwnProperty.call(entry, "text")
  ).length;

  if (missingText === 0) {
    passedChecks++;
    checkResults.allHaveText = true;
  } else {
    checkResults.allHaveText = false;
    findings.push({
      id: "SEA-234",
      category: "session_notes_quality",
      domain: DOMAIN,
      severity: "warning",
      message: `${missingText} session note(s) missing 'text' field`,
      details: "Each session note should contain a text field with the note content.",
      impactScore: 40,
      frequency: missingText,
      blastRadius: 1,
    });
  }

  // Check 5: No entries older than 30 days
  const now = Date.now();
  let staleEntries = 0;

  for (const entry of parsed) {
    if (!entry || !entry.timestamp) continue;

    let entryTime;
    if (typeof entry.timestamp === "number") {
      entryTime = entry.timestamp;
    } else if (typeof entry.timestamp === "string") {
      entryTime = new Date(entry.timestamp).getTime();
    } else {
      continue;
    }

    if (!isNaN(entryTime) && now - entryTime > THIRTY_DAYS_MS) {
      staleEntries++;
    }
  }

  if (staleEntries === 0) {
    passedChecks++;
    checkResults.noStaleEntries = true;
  } else {
    checkResults.noStaleEntries = false;
    findings.push({
      id: "SEA-235",
      category: "session_notes_quality",
      domain: DOMAIN,
      severity: "info",
      message: `${staleEntries} session note(s) older than 30 days`,
      details: "Consider pruning stale notes to keep session-notes.json focused on recent context.",
      impactScore: 20,
      frequency: staleEntries,
      blastRadius: 1,
    });
  }

  const qualityPct = Math.round((passedChecks / totalChecks) * 100);
  const scored = scoreMetric(qualityPct, bench.quality_pct, "higher-is-better");

  return {
    score: scored.score,
    rating: scored.rating,
    metrics: {
      totalChecks,
      passedChecks,
      entryCount: parsed.length,
      missingTimestamp,
      missingText,
      staleEntries,
      qualityPct,
      checkResults,
    },
  };
}

module.exports = { DOMAIN, run };
