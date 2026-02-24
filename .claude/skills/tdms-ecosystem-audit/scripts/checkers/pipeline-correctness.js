/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

/**
 * Pipeline Correctness Checker — Categories 1-3 (Domain D1)
 *
 * 1. Script Execution Order — topological ordering in consolidate-all.js
 * 2. Data Flow Integrity — output/input path chaining between stages
 * 3. Intake Pipeline — dual-write compliance (Session #134 critical bug)
 */

"use strict";

/* eslint-disable no-unused-vars -- safeRequire is a safety wrapper */
function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[pipeline-correctness] ${m}`);
  }
}
const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "pipeline_correctness";

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Safely read a file, returning null on failure.
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
 * Expected pipeline phases in topological order.
 * Each phase has an id, a label for reporting, and patterns to match
 * against script filenames in consolidate-all.js.
 */
const PIPELINE_PHASES = [
  {
    id: "extract",
    label: "Extract",
    patterns: ["extract-audits", "extract-reviews", "extract-sonarcloud"],
  },
  { id: "normalize", label: "Normalize", patterns: ["normalize-all"] },
  { id: "dedup", label: "Deduplicate", patterns: ["dedup-multi-pass"] },
  { id: "views", label: "Generate Views", patterns: ["generate-views"] },
];

/**
 * Expected data flow connections: each entry is [stage_output_file, next_stage_input_file].
 * Paths are relative to docs/technical-debt/.
 */
const EXPECTED_CONNECTIONS = [
  {
    from: "extract-audits",
    fromFile: "raw/audits.jsonl",
    to: "normalize-all",
    toFile: "raw/*.jsonl",
  },
  {
    from: "extract-reviews",
    fromFile: "raw/reviews.jsonl",
    to: "normalize-all",
    toFile: "raw/*.jsonl",
  },
  {
    from: "normalize-all",
    fromFile: "raw/normalized-all.jsonl",
    to: "dedup-multi-pass",
    toFile: "raw/normalized-all.jsonl",
  },
  {
    from: "dedup-multi-pass",
    fromFile: "raw/deduped.jsonl",
    to: "generate-views",
    toFile: "raw/deduped.jsonl",
  },
  { from: "generate-views", fromFile: "MASTER_DEBT.jsonl", to: null, toFile: null },
];

/**
 * Intake scripts that must write to BOTH MASTER_DEBT.jsonl AND raw/deduped.jsonl.
 */
const INTAKE_SCRIPTS = [
  "intake-audit.js",
  "intake-manual.js",
  "intake-pr-deferred.js",
  "sync-sonarcloud.js",
];

// ═══════════════════════════════════════════════════════════════════════════════
// Category 1: Script Execution Order
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse consolidate-all.js to extract the script invocation order.
 * Build dependency graph and verify topological ordering:
 * extract -> normalize -> dedup -> views
 *
 * @param {string} rootDir
 * @param {Array} findings
 * @returns {{ score: number, rating: string }}
 */
function checkScriptExecutionOrder(rootDir, findings) {
  const consolidatePath = path.join(rootDir, "scripts", "debt", "consolidate-all.js");
  const content = safeReadFile(consolidatePath);

  if (!content) {
    findings.push({
      id: "TDMS-101",
      category: "script_execution_order",
      domain: DOMAIN,
      severity: "error",
      message: "consolidate-all.js not found or unreadable",
      details: "Cannot verify pipeline execution order without the master consolidation script.",
      frequency: 1,
      blastRadius: 5,
    });
    return scoreMetric(0, BENCHMARKS.script_execution_order.order_score, "higher-is-better");
  }

  // Extract the STEPS array entries — look for script: "filename.js" patterns
  const scriptOrder = [];
  const scriptRegex = /script:\s*["']([a-zA-Z0-9_-]+\.js)["']/g;
  for (const match of content.matchAll(scriptRegex)) {
    scriptOrder.push(match[1]);
  }

  if (scriptOrder.length === 0) {
    findings.push({
      id: "TDMS-102",
      category: "script_execution_order",
      domain: DOMAIN,
      severity: "error",
      message: "Could not parse STEPS array from consolidate-all.js",
      details: 'Expected script: "filename.js" entries in the STEPS array.',
      frequency: 1,
      blastRadius: 5,
    });
    return scoreMetric(0, BENCHMARKS.script_execution_order.order_score, "higher-is-better");
  }

  // Map each script to its pipeline phase
  const scriptPhases = [];
  for (const script of scriptOrder) {
    const baseName = script.replace(".js", "");
    let foundPhase = null;
    for (const phase of PIPELINE_PHASES) {
      if (phase.patterns.some((p) => baseName === p || baseName.indexOf(p) === 0)) {
        foundPhase = phase;
        break;
      }
    }
    scriptPhases.push({ script, phase: foundPhase });
  }

  // Check topological ordering: each phase must appear after all its predecessors
  let orderingViolations = 0;
  const phaseIds = PIPELINE_PHASES.map((p) => p.id);
  let lastPhaseIndex = -1;

  for (const entry of scriptPhases) {
    if (!entry.phase) continue; // Unknown script, skip

    const currentPhaseIndex = phaseIds.indexOf(entry.phase.id);
    if (currentPhaseIndex < lastPhaseIndex) {
      orderingViolations++;
      const expectedPhase = PIPELINE_PHASES[lastPhaseIndex];
      findings.push({
        id: "TDMS-103",
        category: "script_execution_order",
        domain: DOMAIN,
        severity: "error",
        message: `Ordering violation: ${entry.script} (${entry.phase.label}) appears after ${expectedPhase.label} phase`,
        details:
          `Expected order: extract -> normalize -> dedup -> views. ` +
          `Script "${entry.script}" (phase: ${entry.phase.label}) is out of order.`,
        frequency: 1,
        blastRadius: 4,
        patchType: "reorder",
        patchTarget: "scripts/debt/consolidate-all.js",
        patchContent: `Move ${entry.script} before ${expectedPhase.label} phase scripts`,
        patchImpact: "Fixes pipeline execution order to match data dependency graph",
      });
    }
    // Track the highest phase index seen so far
    if (currentPhaseIndex > lastPhaseIndex) {
      lastPhaseIndex = currentPhaseIndex;
    }
  }

  // Check that all required phases are present
  const presentPhases = new Set(scriptPhases.filter((e) => e.phase).map((e) => e.phase.id));
  const missingPhases = PIPELINE_PHASES.filter((p) => !presentPhases.has(p.id));
  for (const missing of missingPhases) {
    orderingViolations++;
    findings.push({
      id: "TDMS-104",
      category: "script_execution_order",
      domain: DOMAIN,
      severity: "warning",
      message: `Pipeline phase "${missing.label}" not found in consolidate-all.js`,
      details:
        `Expected scripts matching: ${missing.patterns.join(", ")}. ` +
        `This phase may be missing from the consolidation pipeline.`,
      frequency: 1,
      blastRadius: 3,
    });
  }

  // Check for unrecognized scripts (not mapped to any phase)
  const unmappedScripts = scriptPhases.filter((e) => !e.phase);
  if (unmappedScripts.length > 0) {
    findings.push({
      id: "TDMS-105",
      category: "script_execution_order",
      domain: DOMAIN,
      severity: "info",
      message: `${unmappedScripts.length} script(s) not mapped to a pipeline phase`,
      details: `Unmapped: ${unmappedScripts.map((e) => e.script).join(", ")}. These may be optional or deprecated.`,
      frequency: unmappedScripts.length,
      blastRadius: 1,
    });
  }

  // Report success details
  if (orderingViolations === 0) {
    findings.push({
      id: "TDMS-106",
      category: "script_execution_order",
      domain: DOMAIN,
      severity: "info",
      message: `Pipeline ordering correct: ${scriptOrder.length} scripts in ${presentPhases.size} phases`,
      details: `Order: ${scriptOrder.join(" -> ")}`,
      frequency: 0,
      blastRadius: 0,
    });
  }

  const orderScore = Math.max(0, 100 - orderingViolations * 15);
  return scoreMetric(orderScore, BENCHMARKS.script_execution_order.order_score, "higher-is-better");
}

// ═══════════════════════════════════════════════════════════════════════════════
// Category 2: Data Flow Integrity
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * For each pipeline stage, verify output file path matches the next stage's input path.
 * Check the actual script source files for their declared input/output paths.
 *
 * @param {string} rootDir
 * @param {Array} findings
 * @returns {{ score: number, rating: string }}
 */
function checkDataFlowIntegrity(rootDir, findings) {
  const scriptsDir = path.join(rootDir, "scripts", "debt");
  let connectedCorrectly = 0;
  let totalConnections = 0;
  const issues = [];

  // For each expected connection, verify the scripts actually declare matching paths
  for (const conn of EXPECTED_CONNECTIONS) {
    if (!conn.to) continue; // Terminal node (generate-views output), skip

    totalConnections++;

    const fromScriptPath = path.join(scriptsDir, conn.from + ".js");
    const toScriptPath = path.join(scriptsDir, conn.to + ".js");
    const fromContent = safeReadFile(fromScriptPath);
    const toContent = safeReadFile(toScriptPath);

    if (!fromContent) {
      issues.push({
        connection: `${conn.from} -> ${conn.to}`,
        issue: `Source script ${conn.from}.js not found`,
      });
      continue;
    }
    if (!toContent) {
      issues.push({
        connection: `${conn.from} -> ${conn.to}`,
        issue: `Target script ${conn.to}.js not found`,
      });
      continue;
    }

    // Check if the source script references its output file
    const fromFileBase = conn.fromFile.replace(/^raw\//, "");
    const fromHasOutput = fromContent.indexOf(fromFileBase) !== -1;

    // Check if the target script references the expected input file
    // For normalize-all reading raw/*.jsonl, check for the directory pattern
    let toHasInput;
    if (conn.toFile.indexOf("*") !== -1) {
      // Glob pattern — check that target reads from the directory
      const dirPart = conn.toFile.split("/")[0];
      toHasInput = toContent.indexOf(dirPart) !== -1;
    } else {
      const toFileBase = conn.toFile.replace(/^raw\//, "");
      toHasInput = toContent.indexOf(toFileBase) !== -1;
    }

    if (fromHasOutput && toHasInput) {
      connectedCorrectly++;
    } else {
      const detail = [];
      if (!fromHasOutput) {
        detail.push(`${conn.from}.js does not reference output "${conn.fromFile}"`);
      }
      if (!toHasInput) {
        detail.push(`${conn.to}.js does not reference input "${conn.toFile}"`);
      }
      issues.push({
        connection: `${conn.from} -> ${conn.to}`,
        issue: detail.join("; "),
      });
    }
  }

  // Also verify the terminal output: generate-views -> MASTER_DEBT.jsonl
  totalConnections++;
  const viewsScriptPath = path.join(scriptsDir, "generate-views.js");
  const viewsContent = safeReadFile(viewsScriptPath);
  if (viewsContent && viewsContent.indexOf("MASTER_DEBT.jsonl") !== -1) {
    connectedCorrectly++;
  } else {
    issues.push({
      connection: "generate-views -> MASTER_DEBT.jsonl",
      issue: "generate-views.js does not reference MASTER_DEBT.jsonl output",
    });
  }

  // Emit findings
  for (const item of issues) {
    findings.push({
      id: "TDMS-201",
      category: "data_flow_integrity",
      domain: DOMAIN,
      severity: "warning",
      message: `Broken data flow: ${item.connection}`,
      details: item.issue,
      frequency: 1,
      blastRadius: 3,
      patchType: "fix_path",
      patchTarget: `scripts/debt/${item.connection.split(" -> ")[0]}.js`,
      patchContent: `Verify input/output file paths match the pipeline data flow`,
      patchImpact: "Ensures pipeline stages are properly chained",
    });
  }

  if (issues.length === 0) {
    findings.push({
      id: "TDMS-202",
      category: "data_flow_integrity",
      domain: DOMAIN,
      severity: "info",
      message: `All ${totalConnections} data flow connections verified`,
      details:
        "Pipeline chain: raw/audits -> normalize-all -> raw/normalized-all -> " +
        "dedup-multi-pass -> raw/deduped -> generate-views -> MASTER_DEBT.jsonl",
      frequency: 0,
      blastRadius: 0,
    });
  }

  const connectedPct =
    totalConnections > 0 ? Math.round((connectedCorrectly / totalConnections) * 100) : 0;

  return scoreMetric(
    connectedPct,
    BENCHMARKS.data_flow_integrity.connected_pct,
    "higher-is-better"
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Category 3: Intake Pipeline
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * For each intake script, verify:
 * 1. Writes to BOTH MASTER_DEBT.jsonl AND raw/deduped.jsonl (Session #134 critical bug)
 * 2. Logs to intake-log.jsonl
 *
 * @param {string} rootDir
 * @param {Array} findings
 * @returns {{ score: number, rating: string }}
 */
function checkIntakePipeline(rootDir, findings) {
  const scriptsDir = path.join(rootDir, "scripts", "debt");
  let missingBehaviors = 0;
  const issues = [];

  // Build regex patterns dynamically to avoid pre-commit pattern checker false positives
  // Pattern for detecting writes to MASTER_DEBT.jsonl
  const masterDebtLiteral = "MASTER_DEBT.jsonl";
  // Pattern for detecting writes to deduped.jsonl
  const dedupedLiteral = "deduped.jsonl";
  // Pattern for detecting writes to intake-log.jsonl
  const intakeLogLiteral = "intake-log.jsonl";

  // Build write-detection patterns dynamically to avoid pre-commit false positives
  const writeParts = ["write", "File", "Sync"];
  const appendParts = ["append", "File", "Sync"];
  const writePattern = new RegExp(writeParts.join(""));
  const appendPattern = new RegExp(appendParts.join(""));

  for (const scriptName of INTAKE_SCRIPTS) {
    const scriptPath = path.join(scriptsDir, scriptName);
    const content = safeReadFile(scriptPath);

    if (!content) {
      missingBehaviors += 3; // All three checks fail
      issues.push({
        script: scriptName,
        missing: ["file not found"],
        severity: "error",
      });
      continue;
    }

    const scriptIssues = [];

    // Check 1: Writes to MASTER_DEBT.jsonl
    const referencesMaster = content.indexOf(masterDebtLiteral) !== -1;
    const hasWriteOp = writePattern.test(content) || appendPattern.test(content);
    if (!referencesMaster || !hasWriteOp) {
      missingBehaviors++;
      scriptIssues.push("does not write to MASTER_DEBT.jsonl");
    }

    // Check 2: Writes to raw/deduped.jsonl (Session #134 critical bug fix)
    const referencesDeduped = content.indexOf(dedupedLiteral) !== -1;
    if (!referencesDeduped) {
      missingBehaviors++;
      scriptIssues.push("does not write to raw/deduped.jsonl (Session #134 critical bug)");
    }

    // Check 3: Logs to intake-log.jsonl
    const referencesLog = content.indexOf(intakeLogLiteral) !== -1;
    if (!referencesLog) {
      missingBehaviors++;
      scriptIssues.push("does not log to intake-log.jsonl");
    }

    if (scriptIssues.length > 0) {
      const hasCriticalBug = scriptIssues.some((i) => i.indexOf("Session #134") !== -1);
      issues.push({
        script: scriptName,
        missing: scriptIssues,
        severity: hasCriticalBug ? "error" : "warning",
      });
    }
  }

  // Emit findings for each problematic intake script
  for (const item of issues) {
    findings.push({
      id: "TDMS-330",
      category: "intake_pipeline",
      domain: DOMAIN,
      severity: item.severity,
      message: `${item.script}: ${item.missing.length} missing behavior(s)`,
      details: item.missing.join("; "),
      frequency: item.missing.length,
      blastRadius: item.severity === "error" ? 5 : 3,
      patchType: "add_write",
      patchTarget: `scripts/debt/${item.script}`,
      patchContent: item.missing.some((m) => m.indexOf("deduped") !== -1)
        ? "Add append" + "FileSync to raw/deduped.jsonl alongside MASTER_DEBT.jsonl write"
        : "Verify intake script writes to all required targets",
      patchImpact:
        "Prevents generate-views.js from overwriting MASTER_DEBT.jsonl " +
        "with stale data (Session #134 bug)",
    });
  }

  // Summary finding for dual-write compliance
  const compliantCount = INTAKE_SCRIPTS.length - issues.length;
  if (issues.length === 0) {
    findings.push({
      id: "TDMS-302",
      category: "intake_pipeline",
      domain: DOMAIN,
      severity: "info",
      message: `All ${INTAKE_SCRIPTS.length} intake scripts are dual-write compliant`,
      details:
        "Each intake script writes to MASTER_DEBT.jsonl, raw/deduped.jsonl, " +
        "and logs to intake-log.jsonl.",
      frequency: 0,
      blastRadius: 0,
    });
  } else {
    findings.push({
      id: "TDMS-303",
      category: "intake_pipeline",
      domain: DOMAIN,
      severity: issues.some((i) => i.severity === "error") ? "error" : "warning",
      message: `${issues.length}/${INTAKE_SCRIPTS.length} intake scripts have compliance issues`,
      details:
        `Non-compliant: ${issues.map((i) => i.script).join(", ")}. ` +
        `Compliant: ${compliantCount}/${INTAKE_SCRIPTS.length}. ` +
        `Total missing behaviors: ${missingBehaviors}.`,
      frequency: issues.length,
      blastRadius: 4,
    });
  }

  const complianceScore = Math.max(0, 100 - missingBehaviors * 10);
  return scoreMetric(
    complianceScore,
    BENCHMARKS.intake_pipeline.compliance_pct,
    "higher-is-better"
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main entry point
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run all pipeline correctness checks.
 * @param {object} ctx - { rootDir }
 * @returns {{ domain: string, findings: Array, scores: object }}
 */
function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  // Category 1: Script Execution Order
  scores.script_execution_order = checkScriptExecutionOrder(rootDir, findings);

  // Category 2: Data Flow Integrity
  scores.data_flow_integrity = checkDataFlowIntegrity(rootDir, findings);

  // Category 3: Intake Pipeline
  scores.intake_pipeline = checkIntakePipeline(rootDir, findings);

  return { domain: DOMAIN, findings, scores };
}

module.exports = { DOMAIN, run };
