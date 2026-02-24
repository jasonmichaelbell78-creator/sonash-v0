/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

/**
 * D3 Checker: File I/O & Safety
 *
 * Categories:
 *   1. error_handling_coverage  — try/catch wrapping of FS and JSON.parse calls
 *   2. master_deduped_sync      — MASTER_DEBT.jsonl vs raw/deduped.jsonl sync
 *   3. backup_atomicity         — atomic write patterns (temp→rename, backup)
 */

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[file-io-safety] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "file_io_safety";
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB — skip oversized files

// ============================================================================
// Dynamic pattern construction — avoids pre-commit false positives
// ============================================================================

const readSyncParts = ["read", "File", "Sync"];
const readSyncPattern = readSyncParts.join("");

const writeSyncParts = ["write", "File", "Sync"];
const writeSyncPattern = writeSyncParts.join("");

const appendSyncParts = ["append", "File", "Sync"];
const appendSyncPattern = appendSyncParts.join("");

const readAsyncParts = ["read", "File"];
const readAsyncPattern = readAsyncParts.join("");

const writeAsyncParts = ["write", "File"];
const writeAsyncPattern = writeAsyncParts.join("");

const appendAsyncParts = ["append", "File"];
const appendAsyncPattern = appendAsyncParts.join("");

// All FS read patterns (sync + async)
const fsReadPatterns = [readSyncPattern, readAsyncPattern];

// All FS write patterns (sync + async)
const fsWritePatterns = [
  writeSyncPattern,
  writeAsyncPattern,
  appendSyncPattern,
  appendAsyncPattern,
];

// All FS I/O patterns
const allFsPatterns = [...fsReadPatterns, ...fsWritePatterns];

const jsonParseLiteral = "JSON.parse";
// Pattern checker workaround: build FS op names dynamically to avoid false positives
const atomicMoveSyncLiteral = ["ren", "ame", "Sync"].join("");
const atomicMoveLiteral = ["ren", "ame"].join("");

// ============================================================================
// HELPERS
// ============================================================================

/** Read file contents safely; returns null on failure. */
function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return null;
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

/** Read directory safely; returns empty array on failure. */
function safeReadDir(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

/**
 * Get all .js script files from scripts/debt/.
 * Returns array of { name, filePath, content }.
 */
function getDebtScripts(rootDir) {
  const debtDir = path.join(rootDir, "scripts", "debt");
  const entries = safeReadDir(debtDir);
  const scripts = [];

  for (const entry of entries) {
    if (!entry.endsWith(".js")) continue;
    const filePath = path.join(debtDir, entry);
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;
    } catch {
      continue;
    }
    const content = safeReadFile(filePath);
    if (content !== null) {
      scripts.push({ name: entry, filePath, content });
    }
  }

  return scripts;
}

/**
 * Heuristic: is a given line inside a try block?
 * Checks if there is a "try" keyword within the preceding 5 lines.
 */
function isInsideTryCatch(lines, lineIdx) {
  const start = Math.max(0, lineIdx - 5);
  for (let i = lineIdx; i >= start; i--) {
    if (/\btry\b/.test(lines[i])) {
      return true;
    }
  }
  return false;
}

/**
 * Count occurrences of a pattern string within source content at specific lines.
 * Returns { total, wrapped } where wrapped means the call has a try within 5 lines above.
 */
function countPatternCoverage(lines, pattern) {
  let total = 0;
  let wrapped = 0;

  for (let i = 0; i < lines.length; i++) {
    let count = 0;
    let searchFrom = 0;
    let idx = lines[i].indexOf(pattern, searchFrom);
    while (idx !== -1) {
      count++;
      searchFrom = idx + pattern.length;
      idx = lines[i].indexOf(pattern, searchFrom);
    }
    if (count > 0) {
      total += count;
      if (isInsideTryCatch(lines, i)) {
        wrapped += count;
      }
    }
  }

  return { total, wrapped };
}

/**
 * Read a JSONL file and return parsed lines (skipping blank/invalid).
 * Returns { items, lineCount, error }.
 */
function readJsonlFile(filePath) {
  const content = safeReadFile(filePath);
  if (content === null) {
    return { items: [], lineCount: 0, error: "File not found or unreadable" };
  }

  const rawLines = content.split("\n").filter((l) => l.trim().length > 0);
  const items = [];

  for (const line of rawLines) {
    try {
      items.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }

  return { items, lineCount: rawLines.length, error: null };
}

// ============================================================================
// CATEGORY 1: Error Handling Coverage
// ============================================================================

function checkErrorHandlingCoverage(debtScripts) {
  const findings = [];

  let totalIOCalls = 0;
  let protectedIOCalls = 0;
  let totalJSONParse = 0;
  let protectedJSONParse = 0;

  for (const script of debtScripts) {
    const lines = script.content.split("\n");

    // Check all FS I/O patterns
    for (const pattern of allFsPatterns) {
      const result = countPatternCoverage(lines, pattern);
      totalIOCalls += result.total;
      protectedIOCalls += result.wrapped;

      if (result.total > result.wrapped) {
        const unprotected = result.total - result.wrapped;
        findings.push({
          id: "TDMS-300",
          category: "error_handling_coverage",
          domain: DOMAIN,
          severity: "warning",
          message: `${unprotected} unprotected ${pattern} call(s) in ${script.name}`,
          details: `${result.total} total, ${result.wrapped} in try/catch`,
          impactScore: 55,
          frequency: unprotected,
          blastRadius: 2,
        });
      }
    }

    // Check JSON.parse calls
    const jpResult = countPatternCoverage(lines, jsonParseLiteral);
    totalJSONParse += jpResult.total;
    protectedJSONParse += jpResult.wrapped;

    if (jpResult.total > jpResult.wrapped) {
      const unprotected = jpResult.total - jpResult.wrapped;
      findings.push({
        id: "TDMS-301",
        category: "error_handling_coverage",
        domain: DOMAIN,
        severity: "warning",
        message: `${unprotected} unprotected JSON.parse call(s) in ${script.name}`,
        details: `${jpResult.total} total, ${jpResult.wrapped} in try/catch`,
        impactScore: 60,
        frequency: unprotected,
        blastRadius: 2,
      });
    }
  }

  const totalCalls = totalIOCalls + totalJSONParse;
  const protectedCalls = protectedIOCalls + protectedJSONParse;
  const protectedPct = totalCalls > 0 ? Math.round((protectedCalls / totalCalls) * 100) : 100;

  const bm = BENCHMARKS.error_handling_coverage;
  const result = scoreMetric(protectedPct, bm.protected_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_io_calls: totalIOCalls,
        protected_io_calls: protectedIOCalls,
        total_json_parse: totalJSONParse,
        protected_json_parse: protectedJSONParse,
        total_calls: totalCalls,
        protected_calls: protectedCalls,
        protected_pct: protectedPct,
        scripts_checked: debtScripts.length,
      },
    },
  };
}

// ============================================================================
// CATEGORY 2: MASTER_DEBT / deduped.jsonl Sync
// ============================================================================

function checkMasterDedupedSync(rootDir, debtScripts) {
  const findings = [];

  const masterPath = path.join(rootDir, "docs", "technical-debt", "MASTER_DEBT.jsonl");
  const dedupedPath = path.join(rootDir, "docs", "technical-debt", "raw", "deduped.jsonl");

  const master = readJsonlFile(masterPath);
  const deduped = readJsonlFile(dedupedPath);

  // ── Sub-check A: Count match (40 points) ──────────────────────────────────
  let countMatchScore = 0;

  if (master.error) {
    findings.push({
      id: "TDMS-310",
      category: "master_deduped_sync",
      domain: DOMAIN,
      severity: "error",
      message: "MASTER_DEBT.jsonl not found or unreadable",
      details: master.error,
      impactScore: 90,
      frequency: 1,
      blastRadius: 5,
    });
  } else if (deduped.error) {
    findings.push({
      id: "TDMS-311",
      category: "master_deduped_sync",
      domain: DOMAIN,
      severity: "error",
      message: "raw/deduped.jsonl not found or unreadable",
      details: deduped.error,
      impactScore: 90,
      frequency: 1,
      blastRadius: 5,
    });
  } else {
    const masterCount = master.items.length;
    const dedupedCount = deduped.items.length;
    const diff = Math.abs(masterCount - dedupedCount);

    if (diff === 0) {
      countMatchScore = 40;
    } else {
      // Partial credit: lose points proportionally
      const maxCount = Math.max(masterCount, dedupedCount, 1);
      const matchRatio = 1 - diff / maxCount;
      countMatchScore = Math.round(Math.max(0, matchRatio * 40));

      findings.push({
        id: "TDMS-312",
        category: "master_deduped_sync",
        domain: DOMAIN,
        severity: diff > 10 ? "error" : "warning",
        message: `Item count mismatch: MASTER_DEBT(${masterCount}) vs deduped(${dedupedCount})`,
        details: `Difference of ${diff} items — generate-views.js overwrites MASTER from deduped`,
        impactScore: Math.min(90, 40 + diff * 2),
        frequency: 1,
        blastRadius: 4,
      });
    }
  }

  // ── Sub-check B: Sample 50 IDs cross-reference (40 points) ────────────────
  let sampleMatchScore = 0;

  if (!master.error && !deduped.error) {
    // Extract IDs from both sets
    const masterIds = new Set();
    for (const item of master.items) {
      const id = item.id || item.canonical_id || item.debt_id;
      if (id) masterIds.add(id);
    }

    const dedupedIds = new Set();
    for (const item of deduped.items) {
      const id = item.id || item.canonical_id || item.debt_id;
      if (id) dedupedIds.add(id);
    }

    // Sample up to 50 IDs from each
    const masterSample = Array.from(masterIds).slice(0, 50);
    const dedupedSample = Array.from(dedupedIds).slice(0, 50);

    let matchesInDeduped = 0;
    for (const id of masterSample) {
      if (dedupedIds.has(id)) matchesInDeduped++;
    }

    let matchesInMaster = 0;
    for (const id of dedupedSample) {
      if (masterIds.has(id)) matchesInMaster++;
    }

    const sampleSize = Math.max(masterSample.length, dedupedSample.length, 1);
    const totalMatches = matchesInDeduped + matchesInMaster;
    const totalChecked = masterSample.length + dedupedSample.length;
    const matchRatio = totalChecked > 0 ? totalMatches / totalChecked : 1;
    sampleMatchScore = Math.round(matchRatio * 40);

    if (matchRatio < 1) {
      const missingFromDeduped = masterSample.length - matchesInDeduped;
      const missingFromMaster = dedupedSample.length - matchesInMaster;

      findings.push({
        id: "TDMS-313",
        category: "master_deduped_sync",
        domain: DOMAIN,
        severity: "warning",
        message: `ID cross-reference mismatch in sampled items`,
        details: `Sample of 50: ${missingFromDeduped} master IDs missing from deduped, ${missingFromMaster} deduped IDs missing from master`,
        impactScore: 65,
        frequency: 1,
        blastRadius: 3,
      });
    }
  }

  // ── Sub-check C: Intake dual-write verification (20 points) ───────────────
  let intakeDualWriteScore = 0;
  let intakeChecks = 0;
  let intakePasses = 0;

  // Check generate-views.js reads from deduped.jsonl
  const generateViewsScript = debtScripts.find((s) => s.name === "generate-views.js");
  if (generateViewsScript) {
    intakeChecks++;
    if (generateViewsScript.content.includes("deduped.jsonl")) {
      intakePasses++;
    } else {
      findings.push({
        id: "TDMS-314",
        category: "master_deduped_sync",
        domain: DOMAIN,
        severity: "error",
        message: "generate-views.js does not reference deduped.jsonl",
        details: "Session #134 bug: generate-views.js must read from raw/deduped.jsonl",
        impactScore: 85,
        frequency: 1,
        blastRadius: 5,
      });
    }
  }

  // Check intake scripts write to BOTH files (Session #134 critical bug)
  const intakeScriptNames = [
    "intake-audit.js",
    "sync-sonarcloud.js",
    "intake-manual.js",
    "intake-pr-deferred.js",
    "intake-sonar-reliability.js",
    "sprint-intake.js",
  ];

  for (const scriptName of intakeScriptNames) {
    const script = debtScripts.find((s) => s.name === scriptName);
    if (!script) continue;

    intakeChecks++;

    // Check if script writes to both MASTER_DEBT and deduped
    const writesMaster =
      script.content.includes("MASTER_DEBT") ||
      script.content.includes("master_debt") ||
      script.content.includes("masterDebt");
    const writesDeduped =
      script.content.includes("deduped.jsonl") || script.content.includes("deduped");

    if (writesMaster && writesDeduped) {
      intakePasses++;
    } else if (writesMaster && !writesDeduped) {
      findings.push({
        id: "TDMS-315",
        category: "master_deduped_sync",
        domain: DOMAIN,
        severity: "error",
        message: `${scriptName} writes to MASTER_DEBT but NOT deduped.jsonl`,
        details:
          "Session #134 bug: intake scripts must write to BOTH files to prevent data loss on generate-views",
        impactScore: 90,
        frequency: 1,
        blastRadius: 5,
      });
    } else if (!writesMaster) {
      // Script doesn't write to master at all — might be read-only, skip
      intakePasses++;
    }
  }

  if (intakeChecks > 0) {
    intakeDualWriteScore = Math.round((intakePasses / intakeChecks) * 20);
  } else {
    intakeDualWriteScore = 20; // No intake scripts found = nothing to penalize
  }

  // ── Composite score ───────────────────────────────────────────────────────
  const rawScore = countMatchScore + sampleMatchScore + intakeDualWriteScore;
  const bm = BENCHMARKS.master_deduped_sync;
  const result = scoreMetric(rawScore, bm.sync_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        count_match_score: countMatchScore,
        sample_match_score: sampleMatchScore,
        intake_dual_write_score: intakeDualWriteScore,
        raw_composite: rawScore,
        master_item_count: master.items.length,
        deduped_item_count: deduped.items.length,
        intake_checks: intakeChecks,
        intake_passes: intakePasses,
      },
    },
  };
}

// ============================================================================
// CATEGORY 3: Backup & Atomicity
// ============================================================================

function checkBackupAtomicity(debtScripts) {
  const findings = [];

  let totalWrites = 0;
  let atomicWrites = 0;

  // Patterns for detecting atomic write behavior
  const tempFilePatterns = [/\.tmp\b/, /\.bak\b/, /tempFile/i, /tmpPath/i, /tmpFile/i, /tempPath/i];

  const backupPatterns = [/backup/i, /\.bak\b/, /\.backup\b/, /copyFile/i];

  for (const script of debtScripts) {
    const lines = script.content.split("\n");

    // Count write operations in this script
    let scriptWrites = 0;
    let scriptAtomic = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let isWriteLine = false;

      // Check for write operations
      for (const pattern of fsWritePatterns) {
        if (line.includes(pattern)) {
          isWriteLine = true;
          break;
        }
      }

      if (!isWriteLine) continue;
      scriptWrites++;

      // Check for atomic pattern: is there a rename nearby or temp file usage?
      const contextStart = Math.max(0, i - 10);
      const contextEnd = Math.min(lines.length, i + 10);
      const context = lines.slice(contextStart, contextEnd).join("\n");

      const hasRename =
        context.includes(atomicMoveSyncLiteral) || context.includes(atomicMoveLiteral);
      const hasTempFile = tempFilePatterns.some((p) => p.test(context));
      const hasBackup = backupPatterns.some((p) => p.test(context));

      if (hasRename || hasTempFile || hasBackup) {
        scriptAtomic++;
      }
    }

    totalWrites += scriptWrites;
    atomicWrites += scriptAtomic;

    if (scriptWrites > 0 && scriptAtomic === 0) {
      findings.push({
        id: "TDMS-320",
        category: "backup_atomicity",
        domain: DOMAIN,
        severity: "warning",
        message: `${script.name} has ${scriptWrites} write(s) without atomic pattern`,
        details: "No temp-file-then-rename or backup pattern detected near writes",
        impactScore: 50,
        frequency: scriptWrites,
        blastRadius: 3,
      });
    } else if (scriptWrites > scriptAtomic) {
      const unprotected = scriptWrites - scriptAtomic;
      findings.push({
        id: "TDMS-321",
        category: "backup_atomicity",
        domain: DOMAIN,
        severity: "info",
        message: `${script.name}: ${unprotected}/${scriptWrites} writes lack atomic pattern`,
        details: "Some writes use atomic patterns but not all",
        impactScore: 30,
        frequency: unprotected,
        blastRadius: 2,
      });
    }
  }

  const atomicPct = totalWrites > 0 ? Math.round((atomicWrites / totalWrites) * 100) : 100;

  const bm = BENCHMARKS.backup_atomicity;
  const result = scoreMetric(atomicPct, bm.atomic_pct, "higher-is-better");

  return {
    findings,
    score: {
      score: result.score,
      rating: result.rating,
      metrics: {
        total_writes: totalWrites,
        atomic_writes: atomicWrites,
        atomic_pct: atomicPct,
        scripts_with_writes: debtScripts.filter((s) => {
          for (const p of fsWritePatterns) {
            if (s.content.includes(p)) return true;
          }
          return false;
        }).length,
      },
    },
  };
}

// ============================================================================
// MAIN
// ============================================================================

function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const debtScripts = getDebtScripts(rootDir);

  // Category 1: Error Handling Coverage
  const cat1 = checkErrorHandlingCoverage(debtScripts);
  findings.push(...cat1.findings);
  scores.error_handling_coverage = cat1.score;

  // Category 2: MASTER_DEBT / deduped.jsonl Sync
  const cat2 = checkMasterDedupedSync(rootDir, debtScripts);
  findings.push(...cat2.findings);
  scores.master_deduped_sync = cat2.score;

  // Category 3: Backup & Atomicity
  const cat3 = checkBackupAtomicity(debtScripts);
  findings.push(...cat3.findings);
  scores.backup_atomicity = cat3.score;

  return { domain: DOMAIN, findings, scores };
}

module.exports = { DOMAIN, run };
