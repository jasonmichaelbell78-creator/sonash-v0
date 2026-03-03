/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
'use strict';

/**
 * D3 Checker: Pre-commit Pipeline
 *
 * Analyzes the pre-commit hook script for three categories:
 *   Category 8:  stage_ordering_completeness
 *   Category 9:  bypass_override_controls
 *   Category 10: gate_effectiveness
 *
 * Finding IDs: HEA-3XX (300-series for Domain 3).
 *
 * The pre-commit hook path is configurable: checks .husky/pre-commit first,
 * then falls back to .git/hooks/pre-commit.
 */

function safeRequire(id) {
  try {
    return require(id);
  } catch (e) {
    // eslint-disable-next-line framework/no-unsafe-error-access -- guarded by ternary instanceof check
    const m = e instanceof Error ? e.message : String(e);
    throw new Error(`[precommit-pipeline] ${m}`);
  }
}

const fs = safeRequire('node:fs');
const path = safeRequire('node:path');
const { scoreMetric } = safeRequire('../lib/scoring');
const { BENCHMARKS } = safeRequire('../lib/benchmarks');

const DOMAIN = 'precommit_pipeline';

// ============================================================================
// EXPECTED STAGES (generic, logical order)
// ============================================================================

/**
 * Each stage entry: { name, label, pattern (regex matching the stage section) }
 * Patterns are designed to match comment headers or key commands in the pre-commit hook.
 * These are generic stages common across projects — each project may add more.
 */
const EXPECTED_STAGES = [
  {
    name: 'linting',
    label: 'Linting (e.g. ESLint/TSLint)',
    pattern: /eslint|tslint|npm run lint|yarn lint/i,
    orderGroup: 1,
  },
  {
    name: 'type_check',
    label: 'Type checking (e.g. tsc)',
    pattern: /tsc\b|type-?check|npm run (type|check)/i,
    orderGroup: 1,
  },
  {
    name: 'tests',
    label: 'Tests',
    pattern: /npm (run )?test|yarn test|vitest|jest|mocha/i,
    orderGroup: 2,
  },
  {
    name: 'lint_staged',
    label: 'lint-staged',
    pattern: /lint-staged/i,
    orderGroup: 3,
  },
  {
    name: 'format_check',
    label: 'Formatting check (e.g. Prettier)',
    pattern: /prettier|format[- ]check|npm run format/i,
    orderGroup: 4,
  },
  {
    name: 'build',
    label: 'Build verification',
    pattern: /npm run build|yarn build|tsc --build/i,
    orderGroup: 5,
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 10 * 1024 * 1024) return '';
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Escape special regex characters in a string.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find the pre-commit hook file. Checks husky first, then git hooks.
 * @param {string} rootDir
 * @returns {string} path to pre-commit file
 */
function findPrecommitPath(rootDir) {
  const candidates = [
    path.join(rootDir, '.husky', 'pre-commit'),
    path.join(rootDir, '.git', 'hooks', 'pre-commit'),
  ];
  for (const candidate of candidates) {
    try {
      fs.statSync(candidate);
      return candidate;
    } catch {
      // not found, try next
    }
  }
  return candidates[0]; // return husky path as default (will be missing/empty)
}

// ============================================================================
// MAIN
// ============================================================================

function run(ctx) {
  const { rootDir } = ctx;
  const findings = [];
  const scores = {};

  const precommitPath = findPrecommitPath(rootDir);
  const content = safeReadFile(precommitPath);

  if (!content) {
    findings.push({
      id: 'HEA-300',
      category: 'stage_ordering_completeness',
      domain: DOMAIN,
      severity: 'error',
      message: 'Pre-commit hook file is missing or empty',
      details:
        'The pre-commit hook file could not be read. All pipeline checks ' +
        'depend on this file existing.',
      impactScore: 95,
      frequency: 1,
      blastRadius: 5,
    });

    scores.stage_ordering_completeness = { score: 0, rating: 'poor', metrics: {} };
    scores.bypass_override_controls = { score: 0, rating: 'poor', metrics: {} };
    scores.gate_effectiveness = { score: 0, rating: 'poor', metrics: {} };

    return { domain: DOMAIN, findings, scores };
  }

  // Split content into lines for position-aware analysis
  const lines = content.split('\n');

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

  const stagesPresentPct =
    EXPECTED_STAGES.length > 0
      ? Math.round((foundStages.length / EXPECTED_STAGES.length) * 100)
      : 0;

  // Report missing stages
  if (missingStages.length > 0) {
    findings.push({
      id: 'HEA-301',
      category: 'stage_ordering_completeness',
      domain: DOMAIN,
      severity: missingStages.length >= 3 ? 'error' : 'warning',
      message: `${missingStages.length} expected stage(s) missing from pre-commit pipeline`,
      details:
        'Missing stages: ' +
        missingStages.map((s) => s.label).join(', ') +
        `. Expected at least ${Math.ceil(EXPECTED_STAGES.length * 0.8)} stages in the pipeline.`,
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
    // Same orderGroup is fine (parallel stages like linting + type checks)
    if (curr.orderGroup < prev.orderGroup) {
      orderingViolations.push({
        expected: prev.label + ' before ' + curr.label,
        actual: curr.label + ' appears before ' + prev.label,
      });
    }
  }

  if (orderingViolations.length > 0) {
    findings.push({
      id: 'HEA-302',
      category: 'stage_ordering_completeness',
      domain: DOMAIN,
      severity: 'warning',
      message: `${orderingViolations.length} stage ordering violation(s) detected`,
      details:
        'Stages should follow logical order: linting before tests, ' +
        'tests before build. Violations: ' +
        orderingViolations.map((v) => v.actual).join('; '),
      impactScore: 40,
      frequency: 1,
      blastRadius: 2,
    });
  }

  // Check that linting runs before tests (critical ordering)
  const lintStage = foundStages.find((s) => s.name === 'linting');
  const testStage = foundStages.find((s) => s.name === 'tests');
  if (lintStage && testStage && lintStage.position > testStage.position) {
    findings.push({
      id: 'HEA-304',
      category: 'stage_ordering_completeness',
      domain: DOMAIN,
      severity: 'error',
      message: 'Linting must run before tests',
      details:
        'Linting catches syntax errors that would cause tests ' +
        'to produce misleading results. Linting should always run first.',
      impactScore: 70,
      frequency: 1,
      blastRadius: 3,
    });
  }

  const benchmark = BENCHMARKS.stage_ordering_completeness.stages_present_pct;
  const scored = scoreMetric(stagesPresentPct, benchmark, 'higher-is-better');

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

// eslint-disable-next-line complexity -- audit checker with many branches
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
    // Not a finding — many projects don't use the is_skipped pattern.
    // Give a neutral score.
    scores.bypass_override_controls = {
      score: 70,
      rating: 'average',
      metrics: { skippableChecks: 0, note: 'No is_skipped pattern detected' },
    };
    return;
  }

  // For each skippable check, verify proper controls
  let checksWithProperControls = 0;
  const controlIssues = [];

  for (const checkName of skippableChecks) {
    let hasSkipReason = false;
    let hasLogOverride = false;

    // Look for require_skip_reason enforcement (global or per-check)
    const hasGlobalSkipChecksGuard = /if\s+\[\s+-n\s+"\$\{SKIP_CHECKS:-\}"/.test(content);
    const hasGlobalRequireSkipReason =
      hasGlobalSkipChecksGuard && /require_skip_reason/.test(content);

    if (hasGlobalRequireSkipReason) {
      hasSkipReason = true;
    }

    // Check for log-override.js call associated with this check.
    const isSkippedCallRe = new RegExp(
      `is_skipped\\s*(?:\\(\\s*['"]?${escapeRegex(checkName)}['"]?\\s*\\)|\\s+${escapeRegex(checkName)})`,
    );
    const isSkippedMatch = content.match(isSkippedCallRe);
    const isSkippedIdx =
      isSkippedMatch && typeof isSkippedMatch.index === 'number' ? isSkippedMatch.index : -1;

    if (isSkippedIdx !== -1) {
      const lineStart = content.lastIndexOf('\n', isSkippedIdx) + 1;
      const isSkippedLine = content.slice(lineStart, isSkippedIdx + checkName.length + 30);
      const isInverted = /!\s*is_skipped/.test(isSkippedLine);

      if (isInverted) {
        const blockAfter = content.slice(isSkippedIdx, isSkippedIdx + 1500);
        if (/log-override\.js/.test(blockAfter)) {
          hasLogOverride = true;
        }
      } else {
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
      if (!hasSkipReason) missing.push('SKIP_REASON enforcement');
      if (!hasLogOverride) missing.push('log-override.js call');
      controlIssues.push({ check: checkName, missing });
    }
  }

  // Report control issues
  if (controlIssues.length > 0) {
    findings.push({
      id: 'HEA-311',
      category: 'bypass_override_controls',
      domain: DOMAIN,
      severity: controlIssues.length > 2 ? 'error' : 'warning',
      message: `${controlIssues.length} skippable check(s) lack proper override controls`,
      details:
        'Each skippable check should enforce SKIP_REASON and call ' +
        'log-override.js for audit trail. Issues: ' +
        controlIssues.map((c) => `${c.check} (missing: ${c.missing.join(', ')})`).join('; '),
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
  const scored = scoreMetric(controlledPct, benchmark, 'higher-is-better');

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

  const fnMatch = content.match(/require_skip_reason\s*\(\)\s*\{/);
  if (!fnMatch) {
    // Not all projects use require_skip_reason — not a finding if there are no skip checks
    return validations;
  }

  const fnStart = fnMatch.index + fnMatch[0].length;
  let braceDepth = 1;
  let fnEnd = fnStart;
  for (let i = fnStart; i < content.length && braceDepth > 0; i++) {
    if (content[i] === '{') braceDepth++;
    if (content[i] === '}') braceDepth--;
    fnEnd = i;
  }
  const fnBody = content.slice(fnStart, fnEnd);

  if (/SKIP_REASON.*-z/.test(fnBody) || /-z.*SKIP_REASON/.test(fnBody)) {
    validations.non_empty = true;
  }
  if (/wc -l/.test(fnBody) || /\\r|cr/.test(fnBody)) {
    validations.single_line = true;
  }
  if (/\[:cntrl:\]/.test(fnBody)) {
    validations.no_control_chars = true;
  }
  if (/-lt\s+10/.test(fnBody)) {
    validations.min_length = true;
  }
  if (/-gt\s+500/.test(fnBody)) {
    validations.max_length = true;
  }

  const missingValidations = Object.entries(validations)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missingValidations.length > 0) {
    findings.push({
      id: 'HEA-313',
      category: 'bypass_override_controls',
      domain: DOMAIN,
      severity: 'warning',
      message: `require_skip_reason missing ${missingValidations.length} validation(s)`,
      details:
        'The skip reason validator should enforce: non-empty, single-line, ' +
        'no control chars, min 10 chars, max 500 chars. Missing: ' +
        missingValidations.join(', '),
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

// eslint-disable-next-line complexity -- audit checker with many branches
function checkGateEffectiveness(content, lines, findings, scores) {
  // Identify all stages and classify as blocking vs non-blocking
  const gates = [];

  // Find all "exit 1" lines and their context
  const exitPattern = /exit\s+1/g;
  for (const exitMatch of content.matchAll(exitPattern)) {
    const pos = exitMatch.index;
    const contextBefore = content.slice(Math.max(0, pos - 300), pos);

    // Determine which stage this exit belongs to (nearest match wins)
    let stageName = 'unknown';
    let nearestPos = -1;
    for (const stage of EXPECTED_STAGES) {
      const stageMatch = stage.pattern.exec(contextBefore);
      if (stageMatch) {
        const matchPos = contextBefore.lastIndexOf(stageMatch[0]);
        if (matchPos > nearestPos) {
          nearestPos = matchPos;
          stageName = stage.name;
        }
      }
    }

    const lineIdx = content.slice(0, pos).split('\n').length - 1;
    const line = lines[lineIdx] || '';
    const trimmed = line.trim();
    const isCommented = trimmed.startsWith('#');
    const isReachable = !isCommented;

    gates.push({
      stageName,
      lineNumber: lineIdx + 1,
      isBlocking: true,
      isReachable,
      line: trimmed,
    });
  }

  // Check for non-blocking warnings (echo with warning or WARNING text but no exit 1)
  const warningPattern = /echo\b[^\n]*(?:\u26a0(?:\ufe0f)?|\bWARNING\b)/gi;
  const warningPositions = [];
  for (const warnMatch of content.matchAll(warningPattern)) {
    const pos = warnMatch.index;
    const lineIdx = content.slice(0, pos).split('\n').length - 1;
    const nextChunk = content.slice(pos, pos + 300);
    const hasExitNearby = /exit\s+1/.test(nextChunk.split('\n').slice(0, 5).join('\n'));
    if (!hasExitNearby) {
      warningPositions.push({
        lineNumber: lineIdx + 1,
        line: (lines[lineIdx] || '').trim(),
      });
    }
  }

  // Identify unreachable gates
  const unreachableGates = gates.filter((g) => !g.isReachable);
  if (unreachableGates.length > 0) {
    findings.push({
      id: 'HEA-320',
      category: 'gate_effectiveness',
      domain: DOMAIN,
      severity: 'error',
      message: `${unreachableGates.length} blocking gate(s) are unreachable (commented out)`,
      details:
        'Exit gates that are commented out provide no protection. Lines: ' +
        unreachableGates.map((g) => g.lineNumber).join(', '),
      impactScore: 75,
      frequency: unreachableGates.length,
      blastRadius: 4,
    });
  }

  // Check for silent failures (|| true without warning)
  const silentFailPattern = /\|\|\s*true/g;
  const silentFails = [];
  for (const silentMatch of content.matchAll(silentFailPattern)) {
    const pos = silentMatch.index;
    const lineIdx = content.slice(0, pos).split('\n').length - 1;
    const line = (lines[lineIdx] || '').trim();

    // Exclude common acceptable || true uses
    if (
      /log-override\.js/.test(line) ||
      /rm\s+-f/.test(line) ||
      /kill\s+/.test(line) ||
      /2>\/dev\/null/.test(line) ||
      /=\$\(.*\bgrep\b.*\|\|\s*true\)/.test(line)
    ) {
      continue;
    }

    const context = content.slice(Math.max(0, pos - 200), pos + 200);
    const hasWarning = /\u26a0\ufe0f/.test(context);

    if (!hasWarning) {
      silentFails.push({ lineNumber: lineIdx + 1, line });
    }
  }

  if (silentFails.length > 0) {
    findings.push({
      id: 'HEA-321',
      category: 'gate_effectiveness',
      domain: DOMAIN,
      severity: 'warning',
      message: `${silentFails.length} silent failure(s) detected (no warning, no exit)`,
      details:
        'Non-blocking stages should emit warnings rather than silently ' +
        'swallowing errors. Lines: ' +
        silentFails.map((s) => `L${s.lineNumber}`).join(', '),
      impactScore: 40,
      frequency: silentFails.length,
      blastRadius: 2,
    });
  }

  // Check temp file cleanup
  const mktempPattern = /\$\(mktemp\)/g;
  const tempFiles = [];
  for (const mktempMatch of content.matchAll(mktempPattern)) {
    const pos = mktempMatch.index;
    const lineIdx = content.slice(0, pos).split('\n').length - 1;
    const line = (lines[lineIdx] || '').trim();
    const assignMatch = line.match(/^([A-Z_]+)="\$\(mktemp\)"/);
    const varName = assignMatch ? assignMatch[1] : null;
    tempFiles.push({ lineNumber: lineIdx + 1, varName });
  }

  let tempFilesWithCleanup = 0;
  const tempFilesWithoutCleanup = [];

  for (const tf of tempFiles) {
    if (!tf.varName) {
      tempFilesWithCleanup++;
      continue;
    }
    const varRef = `(?:\\$\\{${escapeRegex(tf.varName)}\\}|\\$${escapeRegex(tf.varName)})`;
    const cleanupPattern = new RegExp(
      `(?:add_exit_trap|trap)\\s+['"'][^'"]*${varRef}[^'"]*['"']`,
      'm',
    );
    if (cleanupPattern.test(content)) {
      tempFilesWithCleanup++;
    } else {
      tempFilesWithoutCleanup.push(tf);
    }
  }

  if (tempFilesWithoutCleanup.length > 0) {
    findings.push({
      id: 'HEA-322',
      category: 'gate_effectiveness',
      domain: DOMAIN,
      severity: 'warning',
      message: `${tempFilesWithoutCleanup.length} temp file(s) without cleanup trap`,
      details:
        "Every mktemp call should have a corresponding trap 'rm -f ...' to prevent temp file leaks. " +
        'Missing cleanup for: ' +
        tempFilesWithoutCleanup.map((t) => `${t.varName} (L${t.lineNumber})`).join(', '),
      impactScore: 35,
      frequency: tempFilesWithoutCleanup.length,
      blastRadius: 1,
    });
  }

  const effectiveGates = gates.filter((g) => g.isReachable).length;
  const totalGates = gates.length;
  const blockingPct = totalGates > 0 ? Math.round((effectiveGates / totalGates) * 100) : 100;

  const benchmark = BENCHMARKS.gate_effectiveness.blocking_pct;
  const scored = scoreMetric(blockingPct, benchmark, 'higher-is-better');

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

module.exports = { run, DOMAIN };
