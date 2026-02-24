/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
"use strict";

/**
 * D3 Checker: Pre-commit Pipeline
 *
 * Analyzes .husky/pre-commit for three categories:
 *   Category 8:  stage_ordering_completeness
 *   Category 9:  bypass_override_controls
 *   Category 10: gate_effectiveness
 *
 * Finding IDs: HEA-3XX (300-series for Domain 3).
 */

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[precommit-pipeline] ${m}`);
  }
}

const fs = safeRequire("node:fs");
const path = safeRequire("node:path");
const { scoreMetric } = safeRequire("../lib/scoring");
const { BENCHMARKS } = safeRequire("../lib/benchmarks");

const DOMAIN = "precommit_pipeline";

// ============================================================================
// EXPECTED STAGES (logical order)
// ============================================================================

/**
 * Each stage entry: { name, label, pattern (regex matching the stage section) }
 * Patterns are designed to match comment headers or key commands in .husky/pre-commit.
 */
const EXPECTED_STAGES = [
  {
    name: "eslint",
    label: "ESLint (Wave 1)",
    pattern: /Running ESLint|npm run lint/,
    orderGroup: 1,
  },
  {
    name: "tests",
    label: "Tests (Wave 1 parallel)",
    pattern: /Running tests|npm test/,
    orderGroup: 1,
  },
  {
    name: "cc_regression",
    label: "CC regression check (1b)",
    pattern: /CC regression|check-cc-regression/,
    orderGroup: 2,
  },
  {
    name: "lint_staged",
    label: "lint-staged (2)",
    pattern: /lint-staged|Running lint-staged/,
    orderGroup: 3,
  },
  {
    name: "pattern_compliance",
    label: "Pattern compliance (3)",
    pattern: /pattern compliance|check-pattern-compliance/,
    orderGroup: 4,
  },
  {
    name: "audit_validation",
    label: "S0/S1 audit validation (4)",
    pattern: /S0\/S1|validate-audit|Audit file S0/,
    orderGroup: 5,
  },
  {
    name: "canon_schema",
    label: "CANON schema validation (5)",
    pattern: /CANON schema|validate:canon/,
    orderGroup: 6,
  },
  {
    name: "skill_validation",
    label: "Skill validation (6)",
    pattern: /Skill.*validation|skills:validate/,
    orderGroup: 7,
  },
  {
    name: "cross_doc_deps",
    label: "Cross-doc dependency check (7)",
    pattern: /cross-document dependenc|check-cross-doc-deps\.js/i,
    orderGroup: 8,
  },
  {
    name: "doc_index",
    label: "Doc index auto-update (8)",
    pattern: /Documentation Index auto|docs:index/,
    orderGroup: 9,
  },
  {
    name: "doc_header",
    label: "Doc header validation (9)",
    pattern: /Document header validation|check-doc-headers\.js/,
    orderGroup: 10,
  },
  {
    name: "agent_compliance",
    label: "Agent compliance (10)",
    pattern: /agent compliance|check-agent-compliance/i,
    orderGroup: 11,
  },
  {
    name: "debt_schema",
    label: "Debt schema validation (11)",
    pattern: /debt.*schema|validate-schema|debt-schema/i,
    orderGroup: 12,
  },
];

// ============================================================================
// MAIN
// ============================================================================

function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const precommitPath = path.join(rootDir, ".husky", "pre-commit");
  const content = safeReadFile(precommitPath);

  if (!content) {
    findings.push({
      id: "HEA-300",
      category: "stage_ordering_completeness",
      domain: DOMAIN,
      severity: "error",
      message: ".husky/pre-commit file is missing or empty",
      details:
        "The pre-commit hook file could not be read. All pipeline checks " +
        "depend on this file existing.",
      impactScore: 95,
      frequency: 1,
      blastRadius: 5,
    });

    scores.stage_ordering_completeness = { score: 0, rating: "poor", metrics: {} };
    scores.bypass_override_controls = { score: 0, rating: "poor", metrics: {} };
    scores.gate_effectiveness = { score: 0, rating: "poor", metrics: {} };

    return { domain: DOMAIN, findings, scores };
  }

  // Split content into lines for position-aware analysis
  const lines = content.split("\n");

  // ── Category 8: stage_ordering_completeness ──────────────────────────────
  checkStageOrdering(content, lines, findings, scores);

  // ── Category 9: bypass_override_controls ─────────────────────────────────
  checkBypassControls(content, lines, findings, scores);

  // ── Category 10: gate_effectiveness ──────────────────────────────────────
  checkGateEffectiveness(content, lines, findings, scores);

  return { domain: DOMAIN, findings, scores };
}

// ============================================================================
// Category 8: Stage Ordering & Completeness
// ============================================================================

function checkStageOrdering(content, lines, findings, scores) {
  const foundStages = [];
  const missingStages = [];

  for (const stage of EXPECTED_STAGES) {
    const match = stage.pattern.exec(content);
    if (match) {
      // Record the position (line index) of first match for ordering check
      const matchPos = content.indexOf(match[0]);
      foundStages.push({ ...stage, position: matchPos });
    } else {
      missingStages.push(stage);
    }
  }

  const stagesPresentPct = Math.round((foundStages.length / EXPECTED_STAGES.length) * 100);

  // Report missing stages
  if (missingStages.length > 0) {
    findings.push({
      id: "HEA-301",
      category: "stage_ordering_completeness",
      domain: DOMAIN,
      severity: missingStages.length >= 3 ? "error" : "warning",
      message: `${missingStages.length} expected stage(s) missing from pre-commit pipeline`,
      details:
        "Missing stages: " +
        missingStages.map((s) => s.label).join(", ") +
        ". Expected at least 11 stages in the pipeline.",
      impactScore: Math.min(90, missingStages.length * 15),
      frequency: 1,
      blastRadius: missingStages.length >= 3 ? 4 : 2,
    });
  }

  // Check ordering: stages should appear in ascending orderGroup
  const orderingViolations = [];
  const sorted = [...foundStages].sort((a, b) => a.position - b.position);

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    // Same orderGroup is fine (parallel stages like ESLint + Tests)
    if (curr.orderGroup < prev.orderGroup) {
      orderingViolations.push({
        expected: prev.label + " before " + curr.label,
        actual: curr.label + " appears before " + prev.label,
      });
    }
  }

  if (orderingViolations.length > 0) {
    findings.push({
      id: "HEA-302",
      category: "stage_ordering_completeness",
      domain: DOMAIN,
      severity: "warning",
      message: `${orderingViolations.length} stage ordering violation(s) detected`,
      details:
        "Stages should follow logical order: ESLint before patterns, " +
        "patterns before commit gates. Violations: " +
        orderingViolations.map((v) => v.actual).join("; "),
      impactScore: 40,
      frequency: 1,
      blastRadius: 2,
    });
  }

  // Check that at least 11 stages are present
  if (foundStages.length < 11) {
    findings.push({
      id: "HEA-303",
      category: "stage_ordering_completeness",
      domain: DOMAIN,
      severity: "warning",
      message: `Only ${foundStages.length} of ${EXPECTED_STAGES.length} stages present (minimum 11 expected)`,
      details:
        "The pre-commit pipeline should have at least 11 stages to provide " +
        "comprehensive commit-time validation. Found " +
        foundStages.length +
        " stages.",
      impactScore: 35,
      frequency: 1,
      blastRadius: 3,
    });
  }

  // Check ESLint runs before pattern compliance (critical ordering)
  const eslintStage = foundStages.find((s) => s.name === "eslint");
  const patternStage = foundStages.find((s) => s.name === "pattern_compliance");
  if (eslintStage && patternStage && eslintStage.position > patternStage.position) {
    findings.push({
      id: "HEA-304",
      category: "stage_ordering_completeness",
      domain: DOMAIN,
      severity: "error",
      message: "ESLint must run before pattern compliance check",
      details:
        "ESLint catches syntax errors that would cause pattern compliance " +
        "to produce misleading results. ESLint should always run first.",
      impactScore: 70,
      frequency: 1,
      blastRadius: 3,
    });
  }

  const benchmark = BENCHMARKS.stage_ordering_completeness.stages_present_pct;
  const scored = scoreMetric(stagesPresentPct, benchmark, "higher-is-better");

  scores.stage_ordering_completeness = {
    score: scored.score,
    rating: scored.rating,
    metrics: {
      stages_present: foundStages.length,
      stages_expected: EXPECTED_STAGES.length,
      stages_present_pct: stagesPresentPct,
      ordering_violations: orderingViolations.length,
      missing_stages: missingStages.map((s) => s.name),
    },
  };
}

// ============================================================================
// Category 9: Bypass & Override Controls
// ============================================================================

function checkBypassControls(content, lines, findings, scores) {
  // Extract all is_skipped calls to find skippable checks
  const skippableChecks = [];
  const isSkippedPattern = /is_skipped\s*\(\s*['"]?([\w-]+)['"]?\s*\)|is_skipped\s+([\w-]+)/g;
  for (const match of content.matchAll(isSkippedPattern)) {
    const checkName = (match[1] || match[2]).trim();
    if (!skippableChecks.includes(checkName)) {
      skippableChecks.push(checkName);
    }
  }

  if (skippableChecks.length === 0) {
    findings.push({
      id: "HEA-310",
      category: "bypass_override_controls",
      domain: DOMAIN,
      severity: "warning",
      message: "No skippable checks found in pre-commit pipeline",
      details:
        "Expected is_skipped function calls for skip-controlled checks. " +
        "Either the pipeline has no override mechanism or the pattern " +
        "could not be detected.",
      impactScore: 50,
      frequency: 1,
      blastRadius: 3,
    });

    scores.bypass_override_controls = { score: 0, rating: "poor", metrics: {} };
    return;
  }

  // For each skippable check, verify proper controls
  let checksWithProperControls = 0;
  const controlIssues = [];

  for (const checkName of skippableChecks) {
    let hasSkipReason = false;
    let hasLogOverride = false;

    // Look for require_skip_reason enforcement (global or per-check)
    // The global enforcement at the top covers all checks:
    //   if [ -n "${SKIP_CHECKS:-}" ]; then
    //     require_skip_reason ...
    //   fi
    // This is a multiline pattern so we check for both parts separately.
    const hasGlobalSkipChecksGuard = /if\s+\[\s+-n\s+"\$\{SKIP_CHECKS:-\}"/.test(content);
    const hasGlobalRequireSkipReason =
      hasGlobalSkipChecksGuard && /require_skip_reason/.test(content);

    if (hasGlobalRequireSkipReason) {
      hasSkipReason = true;
    }

    // Check for log-override.js call associated with this check.
    // Two patterns exist:
    //   Pattern A: if is_skipped X; then log-override ... fi
    //   Pattern B: if ! is_skipped X; then <main logic> else log-override ... fi
    // We search within ~1500 chars of the is_skipped call for log-override.js
    // associated with the same check's surrounding if/else/fi block.
    const isSkippedIdx = content.indexOf("is_skipped " + checkName);
    if (isSkippedIdx !== -1) {
      // Find the line containing is_skipped to detect inverted pattern
      const lineStart = content.lastIndexOf("\n", isSkippedIdx) + 1;
      const isSkippedLine = content.slice(lineStart, isSkippedIdx + checkName.length + 15);
      const isInverted = /!\s*is_skipped/.test(isSkippedLine);

      if (isInverted) {
        // Pattern B: log-override is in the else block — search wider
        const blockAfter = content.slice(isSkippedIdx, isSkippedIdx + 1500);
        if (/log-override\.js/.test(blockAfter)) {
          hasLogOverride = true;
        }
      } else {
        // Pattern A: log-override is in the then block — search narrower
        const blockAfter = content.slice(isSkippedIdx, isSkippedIdx + 500);
        const blockEnd = blockAfter.search(/\n(?:else|fi)\b/);
        const skipBlock = blockEnd > 0 ? blockAfter.slice(0, blockEnd) : blockAfter;
        if (/log-override\.js/.test(skipBlock)) {
          hasLogOverride = true;
        }
      }
    }

    if (hasSkipReason && hasLogOverride) {
      checksWithProperControls++;
    } else {
      const missing = [];
      if (!hasSkipReason) missing.push("SKIP_REASON enforcement");
      if (!hasLogOverride) missing.push("log-override.js call");
      controlIssues.push({ check: checkName, missing });
    }
  }

  // Report control issues
  if (controlIssues.length > 0) {
    findings.push({
      id: "HEA-311",
      category: "bypass_override_controls",
      domain: DOMAIN,
      severity: controlIssues.length > 2 ? "error" : "warning",
      message: `${controlIssues.length} skippable check(s) lack proper override controls`,
      details:
        "Each skippable check should enforce SKIP_REASON and call " +
        "log-override.js for audit trail. Issues: " +
        controlIssues.map((c) => `${c.check} (missing: ${c.missing.join(", ")})`).join("; "),
      impactScore: Math.min(80, controlIssues.length * 20),
      frequency: controlIssues.length,
      blastRadius: 3,
    });
  }

  // Verify require_skip_reason validation quality
  const reasonValidations = checkReasonValidation(content, findings);

  const controlledPct =
    skippableChecks.length > 0
      ? Math.round((checksWithProperControls / skippableChecks.length) * 100)
      : 0;

  const benchmark = BENCHMARKS.bypass_override_controls.controlled_pct;
  const scored = scoreMetric(controlledPct, benchmark, "higher-is-better");

  scores.bypass_override_controls = {
    score: scored.score,
    rating: scored.rating,
    metrics: {
      total_skippable_checks: skippableChecks.length,
      checks_with_proper_controls: checksWithProperControls,
      controlled_pct: controlledPct,
      skippable_checks: skippableChecks,
      control_issues: controlIssues.map((c) => c.check),
      reason_validations: reasonValidations,
    },
  };
}

/**
 * Verify that require_skip_reason validates all required aspects:
 * - Non-empty
 * - Single-line (no CR/LF)
 * - No control chars
 * - Min 10 chars
 * - Max 500 chars
 */
function checkReasonValidation(content, findings) {
  const validations = {
    non_empty: false,
    single_line: false,
    no_control_chars: false,
    min_length: false,
    max_length: false,
  };

  // Check for require_skip_reason function
  const hasRequireSkipReason = /require_skip_reason\s*\(\)\s*\{/.test(content);
  if (!hasRequireSkipReason) {
    findings.push({
      id: "HEA-312",
      category: "bypass_override_controls",
      domain: DOMAIN,
      severity: "error",
      message: "require_skip_reason function not found",
      details:
        "The pre-commit hook should define a require_skip_reason function " +
        "that validates skip reasons before allowing overrides.",
      impactScore: 80,
      frequency: 1,
      blastRadius: 4,
    });
    return validations;
  }

  // Check each validation within the function body
  // Non-empty check
  if (/SKIP_REASON.*-z/.test(content) || /-z.*SKIP_REASON/.test(content)) {
    validations.non_empty = true;
  }

  // Single-line check (wc -l or CR check)
  if (/wc -l/.test(content) || /\\r|cr/.test(content)) {
    validations.single_line = true;
  }

  // Control char check
  if (/\[:cntrl:\]/.test(content)) {
    validations.no_control_chars = true;
  }

  // Min length
  if (/-lt\s+10/.test(content)) {
    validations.min_length = true;
  }

  // Max length
  if (/-gt\s+500/.test(content)) {
    validations.max_length = true;
  }

  const missingValidations = Object.entries(validations)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missingValidations.length > 0) {
    findings.push({
      id: "HEA-313",
      category: "bypass_override_controls",
      domain: DOMAIN,
      severity: "warning",
      message: `require_skip_reason missing ${missingValidations.length} validation(s)`,
      details:
        "The skip reason validator should enforce: non-empty, single-line, " +
        "no control chars, min 10 chars, max 500 chars. Missing: " +
        missingValidations.join(", "),
      impactScore: 45,
      frequency: 1,
      blastRadius: 2,
    });
  }

  return validations;
}

// ============================================================================
// Category 10: Gate Effectiveness
// ============================================================================

function checkGateEffectiveness(content, lines, findings, scores) {
  // Identify all stages and classify as blocking vs non-blocking
  const gates = [];

  // Find all "exit 1" lines and their context
  const exitPattern = /exit\s+1/g;
  for (const exitMatch of content.matchAll(exitPattern)) {
    const pos = exitMatch.index;
    // Get surrounding context (200 chars before)
    const contextBefore = content.slice(Math.max(0, pos - 300), pos);

    // Determine which stage this exit belongs to
    let stageName = "unknown";
    for (const stage of EXPECTED_STAGES) {
      if (stage.pattern.test(contextBefore)) {
        stageName = stage.name;
      }
    }

    // Check if exit is reachable (not commented out, not inside a function definition
    // that isn't called, etc.)
    const lineIdx = content.slice(0, pos).split("\n").length - 1;
    const line = lines[lineIdx] || "";
    const trimmed = line.trim();
    const isCommented = trimmed.startsWith("#");
    const isReachable = !isCommented;

    gates.push({
      stageName,
      lineNumber: lineIdx + 1,
      isBlocking: true,
      isReachable,
      line: trimmed,
    });
  }

  // Check for non-blocking warnings (echo with warning emoji but no exit 1)
  const warningPattern = /echo\s+"?\s*\u26a0\ufe0f/g;
  const warningPositions = [];
  for (const warnMatch of content.matchAll(warningPattern)) {
    const pos = warnMatch.index;
    const lineIdx = content.slice(0, pos).split("\n").length - 1;

    // Check if there's an exit 1 within the next few lines of the same block
    const nextChunk = content.slice(pos, pos + 300);
    const hasExitNearby = /exit\s+1/.test(nextChunk.split("\n").slice(0, 5).join("\n"));

    if (!hasExitNearby) {
      warningPositions.push({
        lineNumber: lineIdx + 1,
        line: (lines[lineIdx] || "").trim(),
      });
    }
  }

  // Identify unreachable gates
  const unreachableGates = gates.filter((g) => !g.isReachable);
  if (unreachableGates.length > 0) {
    findings.push({
      id: "HEA-320",
      category: "gate_effectiveness",
      domain: DOMAIN,
      severity: "error",
      message: `${unreachableGates.length} blocking gate(s) are unreachable (commented out)`,
      details:
        "Exit gates that are commented out or otherwise unreachable " +
        "provide no protection. Lines: " +
        unreachableGates.map((g) => g.lineNumber).join(", "),
      impactScore: 75,
      frequency: unreachableGates.length,
      blastRadius: 4,
    });
  }

  // Check for stages that silently fail (no warning, no exit)
  // Look for stages that swallow errors with "|| true" but don't warn
  const silentFailPattern = /\|\|\s*true/g;
  const silentFails = [];
  for (const silentMatch of content.matchAll(silentFailPattern)) {
    const pos = silentMatch.index;
    const lineIdx = content.slice(0, pos).split("\n").length - 1;
    const line = (lines[lineIdx] || "").trim();

    // Exclude: log-override.js calls (expected), temp file cleanup (expected),
    // process kill (expected), and 2>/dev/null (expected stderr suppression)
    if (
      /log-override\.js/.test(line) ||
      /rm\s+-f/.test(line) ||
      /kill\s+/.test(line) ||
      /append-hook-warning/.test(line) ||
      /2>\/dev\/null/.test(line)
    ) {
      continue;
    }

    // Check if there's a warning echo nearby
    const context = content.slice(Math.max(0, pos - 200), pos + 200);
    const hasWarning = /\u26a0\ufe0f/.test(context);

    if (!hasWarning) {
      silentFails.push({ lineNumber: lineIdx + 1, line });
    }
  }

  if (silentFails.length > 0) {
    findings.push({
      id: "HEA-321",
      category: "gate_effectiveness",
      domain: DOMAIN,
      severity: "warning",
      message: `${silentFails.length} silent failure(s) detected (no warning, no exit)`,
      details:
        "Non-blocking stages should emit warnings rather than silently " +
        "swallowing errors. Silent failures make debugging difficult. Lines: " +
        silentFails.map((s) => `L${s.lineNumber}`).join(", "),
      impactScore: 40,
      frequency: silentFails.length,
      blastRadius: 2,
    });
  }

  // Check temp file cleanup: every mktemp should have a matching add_exit_trap rm
  const mktempPattern = /\$\(mktemp\)/g;
  const tempFiles = [];
  for (const mktempMatch of content.matchAll(mktempPattern)) {
    const pos = mktempMatch.index;
    const lineIdx = content.slice(0, pos).split("\n").length - 1;
    const line = (lines[lineIdx] || "").trim();

    // Extract the variable name the temp file is assigned to
    const assignMatch = line.match(/^([A-Z_]+)="\$\(mktemp\)"/);
    const varName = assignMatch ? assignMatch[1] : null;

    tempFiles.push({
      lineNumber: lineIdx + 1,
      varName,
    });
  }

  // Check for corresponding add_exit_trap 'rm -f ...' for each temp file
  let tempFilesWithCleanup = 0;
  const tempFilesWithoutCleanup = [];

  for (const tf of tempFiles) {
    if (!tf.varName) {
      // Can't verify without a variable name, assume okay
      tempFilesWithCleanup++;
      continue;
    }

    // Look for: add_exit_trap 'rm -f "$VARNAME"'
    const cleanupPattern = new RegExp(
      "add_exit_trap\\s+['\"]rm\\s+-f\\s+[\"']?\\$" +
        escapeRegex('"' + tf.varName + '"') +
        "|add_exit_trap\\s+['\"]rm\\s+-f\\s+.*\\$" +
        escapeRegex(tf.varName)
    );
    if (cleanupPattern.test(content)) {
      tempFilesWithCleanup++;
    } else {
      tempFilesWithoutCleanup.push(tf);
    }
  }

  if (tempFilesWithoutCleanup.length > 0) {
    findings.push({
      id: "HEA-322",
      category: "gate_effectiveness",
      domain: DOMAIN,
      severity: "warning",
      message: `${tempFilesWithoutCleanup.length} temp file(s) without cleanup trap`,
      details:
        "Every mktemp call should have a corresponding " +
        "add_exit_trap 'rm -f ...' to prevent temp file leaks. " +
        "Missing cleanup for: " +
        tempFilesWithoutCleanup.map((t) => `${t.varName} (L${t.lineNumber})`).join(", "),
      impactScore: 35,
      frequency: tempFilesWithoutCleanup.length,
      blastRadius: 1,
    });
  }

  // Calculate score
  const effectiveGates = gates.filter((g) => g.isReachable).length;
  const totalGates = gates.length;
  const blockingPct = totalGates > 0 ? Math.round((effectiveGates / totalGates) * 100) : 100;

  const benchmark = BENCHMARKS.gate_effectiveness.blocking_pct;
  const scored = scoreMetric(blockingPct, benchmark, "higher-is-better");

  scores.gate_effectiveness = {
    score: scored.score,
    rating: scored.rating,
    metrics: {
      total_gates: totalGates,
      effective_gates: effectiveGates,
      unreachable_gates: unreachableGates.length,
      blocking_pct: blockingPct,
      warning_stages: warningPositions.length,
      silent_fails: silentFails.length,
      temp_files_total: tempFiles.length,
      temp_files_with_cleanup: tempFilesWithCleanup,
      temp_files_without_cleanup: tempFilesWithoutCleanup.length,
    },
  };
}

// ============================================================================
// HELPERS
// ============================================================================

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
 * Escape special regex characters in a string.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { run, DOMAIN };
