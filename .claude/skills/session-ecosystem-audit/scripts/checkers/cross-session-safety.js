/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Cross-Session Safety Checker — Categories D4.1-D4.2 (Domain D4)
 *
 * D4.1: begin_end_balance — Session begin/end count balance & stale detection
 * D4.2: multi_session_validation — Cross-session validation logic & doc freshness
 */

"use strict";

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[cross-session-safety] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "cross_session_safety";
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB — skip oversized files

/**
 * Safely read a file and return its contents, or null on failure.
 * @param {string} filePath - Absolute path to read
 * @returns {{ content: string } | { error: string }}
 */
function safeReadFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { error: "file_not_found" };
    }
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) {
      return { error: "file_too_large" };
    }
    const content = fs.readFileSync(filePath, "utf8");
    return { content };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg.slice(0, 200) };
  }
}

/**
 * Safely parse JSON from a string.
 * @param {string} text - Raw JSON text
 * @returns {{ data: * } | { error: string }}
 */
function safeParseJSON(text) {
  try {
    return { data: JSON.parse(text) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg.slice(0, 200) };
  }
}

/**
 * Run all cross-session safety checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // ── Category D4.1: Begin/End Balance ────────────────────────────────────
  scores.begin_end_balance = checkBeginEndBalance(rootDir, findings);

  // ── Category D4.2: Multi-Session Validation ─────────────────────────────
  scores.multi_session_validation = checkMultiSessionValidation(rootDir, findings);

  return { domain: DOMAIN, findings, scores };
}

// ── Category D4.1: Begin/End Balance ──────────────────────────────────────────

/**
 * Read .claude/hooks/.session-state.json and compare beginCount vs endCount.
 * Flag orphaned sessions (begin > end) and stale lastBegin (> 24h with no end).
 * Score: 100 if balanced, -20 per orphaned session.
 */
function checkBeginEndBalance(rootDir, findings) {
  const bench = BENCHMARKS.begin_end_balance;
  const stateFilePath = path.join(rootDir, ".claude", "hooks", ".session-state.json");

  const readResult = safeReadFile(stateFilePath);
  if (readResult.error) {
    const severity = readResult.error === "file_not_found" ? "warning" : "error";
    findings.push({
      id: "CSS-100",
      category: "begin_end_balance",
      domain: DOMAIN,
      severity,
      message:
        readResult.error === "file_not_found"
          ? "Session state file .claude/hooks/.session-state.json not found"
          : `Failed to read session state: ${readResult.error}`,
      details:
        "Cannot assess begin/end balance without the session state file. " +
        "The SessionStart hook should create this file automatically.",
      impactScore: 70,
      frequency: 1,
      blastRadius: 3,
    });
    return {
      score: 0,
      rating: "poor",
      metrics: { beginCount: 0, endCount: 0, orphanedSessions: 0, balancePct: 0 },
    };
  }

  const parseResult = safeParseJSON(readResult.content);
  if (parseResult.error) {
    findings.push({
      id: "CSS-101",
      category: "begin_end_balance",
      domain: DOMAIN,
      severity: "error",
      message: `Session state file contains invalid JSON: ${parseResult.error}`,
      details: "The .session-state.json file is corrupted. Session tracking is unreliable.",
      impactScore: 80,
      frequency: 1,
      blastRadius: 4,
    });
    return {
      score: 0,
      rating: "poor",
      metrics: { beginCount: 0, endCount: 0, orphanedSessions: 0, balancePct: 0 },
    };
  }

  const state = parseResult.data;
  const beginCount = typeof state.beginCount === "number" ? state.beginCount : 0;
  const endCount = typeof state.endCount === "number" ? state.endCount : 0;
  const lastBegin = state.lastBegin ? new Date(state.lastBegin) : null;
  const lastEnd = state.lastEnd ? new Date(state.lastEnd) : null;

  // Calculate orphaned sessions (sessions that began but never ended)
  const orphanedSessions = Math.max(0, beginCount - endCount);

  // Score: start at 100, -20 per orphaned session
  let rawScore = Math.max(0, 100 - orphanedSessions * 20);

  // Check for stale lastBegin (> 24 hours with no matching end)
  const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
  let isStaleBegin = false;

  if (lastBegin && (!lastEnd || lastEnd.getTime() < lastBegin.getTime())) {
    const ageMs = Date.now() - lastBegin.getTime();
    if (ageMs > STALE_THRESHOLD_MS) {
      isStaleBegin = true;
      const hoursStale = Math.round(ageMs / (1000 * 60 * 60));
      findings.push({
        id: "CSS-102",
        category: "begin_end_balance",
        domain: DOMAIN,
        severity: "warning",
        message: `Stale session begin: last session started ${hoursStale}h ago without ending`,
        details:
          `lastBegin is ${state.lastBegin} but lastEnd is ` +
          `${state.lastEnd || "null"} (older or missing). ` +
          "This suggests a session crashed or was interrupted without running /session-end.",
        impactScore: 60,
        frequency: 1,
        blastRadius: 3,
      });
      // Penalize stale begin
      rawScore = Math.max(0, rawScore - 10);
    }
  }

  // Report orphaned sessions
  if (orphanedSessions > 0) {
    findings.push({
      id: "CSS-103",
      category: "begin_end_balance",
      domain: DOMAIN,
      severity: orphanedSessions > 5 ? "error" : "warning",
      message: `${orphanedSessions} orphaned session(s) detected (beginCount=${beginCount}, endCount=${endCount})`,
      details:
        "Sessions that begin without a proper /session-end leave state partially persisted. " +
        "This can cause missed documentation updates and stale handoff data. " +
        "The SessionStart hook auto-closes stale sessions, but the gap indicates frequent skips.",
      impactScore: Math.min(90, 40 + orphanedSessions * 10),
      frequency: orphanedSessions,
      blastRadius: 3,
    });
  }

  // Clamp rawScore to 0-100 for benchmark scoring
  const clampedScore = Math.max(0, Math.min(100, rawScore));
  const result = scoreMetric(clampedScore, bench.balance_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      beginCount,
      endCount,
      orphanedSessions,
      isStaleBegin,
      balancePct: clampedScore,
    },
  };
}

// ── Category D4.2: Multi-Session Validation ───────────────────────────────────

/**
 * Verify cross-session validation infrastructure:
 *   1. session-start.js has cross-session validation logic (checks lastBegin without lastEnd)
 *   2. SESSION_CONTEXT.md has "Current Session" counter
 *   3. SESSION_CONTEXT.md "Last Updated" date is not stale (> 7 days)
 * Score: checks_passed / total_checks * 100
 */
function checkMultiSessionValidation(rootDir, findings) {
  const bench = BENCHMARKS.multi_session_validation;
  const totalChecks = 3;
  let checksPassed = 0;

  // ── Check 1: session-start.js has cross-session validation ──────────────
  const sessionStartPath = path.join(rootDir, ".claude", "hooks", "session-start.js");
  const ssResult = safeReadFile(sessionStartPath);

  if (ssResult.error) {
    findings.push({
      id: "CSS-200",
      category: "multi_session_validation",
      domain: DOMAIN,
      severity: "error",
      message:
        ssResult.error === "file_not_found"
          ? "session-start.js not found in .claude/hooks/"
          : `Failed to read session-start.js: ${ssResult.error}`,
      details:
        "The SessionStart hook is the primary cross-session validation point. " +
        "Without it, orphaned sessions will never be detected or auto-closed.",
      impactScore: 85,
      frequency: 1,
      blastRadius: 5,
    });
  } else {
    const source = ssResult.content;

    // Check for cross-session validation logic:
    // The hook should check lastBegin vs lastEnd and warn about incomplete sessions
    const hasLastBeginCheck =
      source.indexOf("lastBegin") !== -1 && source.indexOf("lastEnd") !== -1;
    const hasOrphanDetection =
      source.indexOf("without") !== -1 || source.indexOf("incomplete") !== -1;
    const hasSessionStateRead =
      source.indexOf("session-state") !== -1 || source.indexOf(".session-state") !== -1;

    if (hasLastBeginCheck && hasSessionStateRead) {
      checksPassed++;
      // Bonus: check for orphan detection messaging
      if (!hasOrphanDetection) {
        findings.push({
          id: "CSS-201",
          category: "multi_session_validation",
          domain: DOMAIN,
          severity: "info",
          message: "session-start.js checks begin/end but may lack explicit orphan warning",
          details:
            "The hook reads session state and compares timestamps, but no clear " +
            "'incomplete session' or 'without session-end' messaging was found.",
          impactScore: 20,
          frequency: 1,
          blastRadius: 1,
        });
      }
    } else {
      findings.push({
        id: "CSS-202",
        category: "multi_session_validation",
        domain: DOMAIN,
        severity: "error",
        message: "session-start.js lacks cross-session validation logic",
        details:
          "Expected the hook to read .session-state.json and compare lastBegin vs lastEnd " +
          "to detect orphaned sessions. This check is critical for maintaining session integrity.",
        impactScore: 75,
        frequency: 1,
        blastRadius: 4,
      });
    }
  }

  // ── Check 2: SESSION_CONTEXT.md has "Current Session" counter ───────────
  const sessionContextPath = path.join(rootDir, "SESSION_CONTEXT.md");
  const scResult = safeReadFile(sessionContextPath);

  if (scResult.error) {
    findings.push({
      id: "CSS-210",
      category: "multi_session_validation",
      domain: DOMAIN,
      severity: "error",
      message:
        scResult.error === "file_not_found"
          ? "SESSION_CONTEXT.md not found in project root"
          : `Failed to read SESSION_CONTEXT.md: ${scResult.error}`,
      details:
        "SESSION_CONTEXT.md is the primary handoff document between sessions. " +
        "Without it, session continuity is compromised.",
      impactScore: 80,
      frequency: 1,
      blastRadius: 4,
    });
  } else {
    const content = scResult.content;

    // Check for session counter pattern: "Current Session Count" or "Current Session"
    const hasSessionCounter =
      content.indexOf("Current Session Count") !== -1 || content.indexOf("Current Session") !== -1;

    if (hasSessionCounter) {
      checksPassed++;
    } else {
      findings.push({
        id: "CSS-211",
        category: "multi_session_validation",
        domain: DOMAIN,
        severity: "warning",
        message: "SESSION_CONTEXT.md missing session counter",
        details:
          'Expected a "Current Session Count" or "Current Session" field in SESSION_CONTEXT.md. ' +
          "This counter helps track session frequency and detect gaps.",
        impactScore: 50,
        frequency: 1,
        blastRadius: 2,
      });
    }

    // ── Check 3: SESSION_CONTEXT.md "Last Updated" not stale (> 7 days) ───
    const STALE_DOC_DAYS = 7;
    let lastUpdatedDate = null;

    // Search for "Last Updated" pattern — common formats:
    //   **Last Updated**: 2026-02-23
    //   Last Updated: 2026-02-23
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const idx = line.indexOf("Last Updated");
      if (idx !== -1) {
        // Extract date after "Last Updated" — look for YYYY-MM-DD pattern
        const afterTag = line.slice(idx);
        const dateMatch = afterTag.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
          const year = parseInt(dateMatch[1], 10);
          const month = parseInt(dateMatch[2], 10);
          const day = parseInt(dateMatch[3], 10);
          // Basic validation
          if (year >= 2020 && year <= 2030 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            lastUpdatedDate = new Date(year, month - 1, day);
          }
        }
        break;
      }
    }

    if (lastUpdatedDate) {
      const daysSinceUpdate = Math.floor(
        (Date.now() - lastUpdatedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate <= STALE_DOC_DAYS) {
        checksPassed++;
      } else {
        findings.push({
          id: "CSS-212",
          category: "multi_session_validation",
          domain: DOMAIN,
          severity: "warning",
          message: `SESSION_CONTEXT.md is stale: last updated ${daysSinceUpdate} days ago (threshold: ${STALE_DOC_DAYS})`,
          details:
            "The handoff document has not been updated recently. " +
            "Stale context leads to repeated work and missed priorities. " +
            "Run /session-end to update it.",
          impactScore: 55,
          frequency: 1,
          blastRadius: 3,
        });
      }
    } else {
      findings.push({
        id: "CSS-213",
        category: "multi_session_validation",
        domain: DOMAIN,
        severity: "warning",
        message: 'SESSION_CONTEXT.md has no parseable "Last Updated" date',
        details:
          'Expected a "Last Updated: YYYY-MM-DD" field in SESSION_CONTEXT.md. ' +
          "Cannot determine document freshness without this.",
        impactScore: 40,
        frequency: 1,
        blastRadius: 2,
      });
    }
  }

  const validationPct = totalChecks > 0 ? Math.round((checksPassed / totalChecks) * 100) : 0;
  const result = scoreMetric(validationPct, bench.validation_pct, "higher-is-better");

  return {
    score: result.score,
    rating: result.rating,
    metrics: {
      checksPassed,
      totalChecks,
      validationPct,
    },
  };
}

module.exports = { DOMAIN, run };
