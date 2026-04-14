/* global __dirname */
"use strict";

/**
 * skill-audit Self-Audit
 *
 * Penultimate-phase verification for /skill-audit runs. Validates that
 * accepted decisions were actually implemented and that the audit's own
 * process was followed.
 *
 * Reference implementation for the self-audit pattern documented at
 * .claude/skills/_shared/SELF_AUDIT_PATTERN.md. Future per-skill self-audit
 * scripts should mirror this shape (CLI, exit codes, dimension coverage,
 * SUMMARY block).
 *
 * Usage:
 *   node scripts/skills/skill-audit/self-audit.js --target=<skill-name>
 *   node scripts/skills/skill-audit/self-audit.js --target=<name> --state=<path>
 *   node scripts/skills/skill-audit/self-audit.js --target=<name> --json
 *
 * Exit codes:
 *   0 = all MUST dimensions pass (SHOULD may be WARN)
 *   1 = one or more MUST dimensions fail
 *   2 = script failure (missing input, malformed state, security refusal)
 *
 * Tier classification: skill-audit is Complex (>300 lines, 1 companion).
 * All 9 dimensions MUST be covered.
 *
 * Skipped / degraded from full coverage (documented per pattern doc):
 *   - Dim 6 Multi-agent: REMOVED (Session #281 — skill-audit-batch-mode D11).
 *     Replaced with a deterministic cross-reference integrity check. Rationale:
 *     another LLM reading state+files is echo, not independent verification;
 *     same drift class as the rejected pattern for findings production. Layer 1
 *     (grep) + Layer 3 (diff) cover the failure mode mechanically.
 *   - Dim 7 Regression: degrades to WARN when no previous state file exists.
 *     No history file is kept post-completion in the current schema.
 *   - Dim 2 Orphan detection: checks that files_modified are grep-referenced
 *     from the target skill's tree. Does NOT detect orphan files CREATED
 *     outside files_modified (skill-audit is not supposed to create new files;
 *     if it did, that's itself a finding).
 *
 * State schema gaps (reported as WARN, not FAIL, for backward compatibility):
 *   - decisions[].file_modified: optional. If missing, Dim 4 (Gap analysis)
 *     cannot map decision to diff; reports as "unmappable."
 *   - previous_run: optional. If missing, Dim 7 (Regression) is WARN.
 *
 * @see .claude/skills/_shared/SELF_AUDIT_PATTERN.md
 * @see .claude/skills/_shared/SKILL_STANDARDS.md §Self-Audit
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const {
  sanitizeError,
  validatePathInDir,
  refuseSymlinkWithParents,
} = require("../../lib/security-helpers.js");

const PROJECT_ROOT = path.resolve(__dirname, "../../.."); // validatePathInDir: constant-path (no user input)
const STATE_DIR = path.join(PROJECT_ROOT, ".claude", "state");
const SKILLS_DIR = path.join(PROJECT_ROOT, ".claude", "skills");

// Required SKILL.md sections (per SKILL_STANDARDS.md). Grep against target
// skill for Dim 8 Contract verification.
const REQUIRED_SKILL_SECTIONS = ["## When to Use", "## When NOT to Use", "## Version History"];

// Stub markers for Dim 3 Build Integrity. Match only in comment/prose context
// to avoid false positives from regex literals and string values that
// coincidentally contain these tokens. Documented patterns:
//   - `// TODO`, `// FIXME`, `// XXX` (JS/TS comments)
//   - `# TODO` (shell/markdown heading)
//   - ` * TODO` (jsdoc comment line)
//   - `- TODO:` (markdown bullet)
//   - `> TODO` (markdown blockquote)
//   - start-of-line `TODO`
//   - `[TBD]` literal (any context)
//   - `{placeholder}` or `<placeholder>` template stub
const STUB_MARKERS = [
  /(?:\/\/|#|\*|^|\s-\s|>\s)\s*(?:TODO|FIXME|XXX)(?:\s|:|$)/,
  /\[TBD\]/,
  /[{<]placeholder[}>]/i,
];

// Files excluded from Dim 3 — they DEFINE the stub markers and will always
// match themselves. Pattern-definition files, not skill artifacts.
const DIM3_EXCLUDE = [
  /scripts[\\/]skills[\\/][^\\/]+[\\/]self-audit\.js$/,
  /\.claude[\\/]skills[\\/]_shared[\\/]SELF_AUDIT_PATTERN\.md$/,
  /scripts[\\/]cas[\\/]self-audit\.js$/,
];

// ---------------------------------------------------------------------------
// Arg parsing

function parseArgs(argv) {
  const args = { target: null, state: null, json: false };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--target=")) {
      args.target = arg.slice("--target=".length);
    } else if (arg.startsWith("--state=")) {
      args.state = arg.slice("--state=".length);
    } else if (arg === "--json") {
      args.json = true;
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// State loading (security-hardened)

function loadState(targetSkill, stateOverride) {
  const statePath = stateOverride
    ? path.resolve(stateOverride)
    : path.join(STATE_DIR, `task-skill-audit-${targetSkill}.state.json`);

  // Containment: if override path, must still be inside project root
  if (stateOverride) validatePathInDir(PROJECT_ROOT, statePath);
  refuseSymlinkWithParents(statePath);

  let raw;
  try {
    raw = fs.readFileSync(statePath, "utf8");
  } catch (err) {
    throw new Error(`Cannot read state file ${statePath}: ${sanitizeError(err)}`);
  }

  try {
    return { state: JSON.parse(raw), statePath };
  } catch (err) {
    throw new Error(`State file is not valid JSON: ${sanitizeError(err)}`);
  }
}

// ---------------------------------------------------------------------------
// Dimension 1: Completeness

function dim1Completeness(state) {
  const findings = { pass: [], fail: [], warn: [] };
  const statusOk = state.status === "complete";
  if (!statusOk) {
    findings.fail.push(`state.status is "${state.status}", expected "complete"`);
  } else {
    findings.pass.push(`state.status = complete`);
  }

  const scoreOk = state.overall_score !== null && state.overall_score !== undefined;
  if (!scoreOk) {
    findings.fail.push(`state.overall_score is null/undefined — audit did not record final score`);
  } else {
    findings.pass.push(`state.overall_score recorded (${state.overall_score})`);
  }

  const filesModified = state.files_modified || [];
  if (filesModified.length === 0) {
    findings.warn.push(`state.files_modified is empty — no artifacts to verify`);
  }
  let missingCount = 0;
  for (const rel of filesModified) {
    const abs = path.join(PROJECT_ROOT, rel);
    try {
      validatePathInDir(PROJECT_ROOT, abs);
    } catch {
      findings.fail.push(`files_modified entry escapes project root: ${rel}`);
      missingCount++;
      continue;
    }
    if (!fs.existsSync(abs)) {
      findings.fail.push(`files_modified entry missing on disk: ${rel}`);
      missingCount++;
    }
  }
  if (filesModified.length > 0 && missingCount === 0) {
    findings.pass.push(`all ${filesModified.length} files_modified present on disk`);
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 2: Orphan detection

function dim2Orphans(state, targetSkill) {
  const findings = { pass: [], fail: [], warn: [] };
  const filesModified = state.files_modified || [];
  if (filesModified.length === 0) {
    findings.warn.push(`no files_modified to check for orphans`);
    return findings;
  }

  // Heuristic: any file modified by skill-audit should live under the target
  // skill's tree, under scripts/skills/<target>/, or under shared skill dirs.
  const expectedPrefixes = [
    `.claude/skills/${targetSkill}/`,
    `scripts/skills/${targetSkill}/`,
    `.claude/skills/_shared/`,
  ];
  const outOfScope = [];
  for (const rel of filesModified) {
    const normalized = rel.replace(/\\/g, "/");
    const inScope = expectedPrefixes.some((p) => normalized.startsWith(p));
    if (!inScope) outOfScope.push(rel);
  }

  if (outOfScope.length > 0) {
    findings.warn.push(
      `${outOfScope.length} files_modified outside expected target-skill tree (review if intentional): ${outOfScope.slice(0, 3).join(", ")}${outOfScope.length > 3 ? "..." : ""}`
    );
  } else {
    findings.pass.push(`all files_modified in-scope under target skill or shared`);
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 3: Build integrity

function dim3BuildIntegrity(state) {
  const findings = { pass: [], fail: [], warn: [] };
  const filesModified = state.files_modified || [];
  const hits = [];
  let excluded = 0;
  for (const rel of filesModified) {
    if (DIM3_EXCLUDE.some((re) => re.test(rel))) {
      excluded++;
      continue;
    }
    const abs = path.join(PROJECT_ROOT, rel);
    try {
      refuseSymlinkWithParents(abs);
    } catch {
      continue;
    }
    if (!fs.existsSync(abs)) continue;
    let content;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      for (const re of STUB_MARKERS) {
        if (re.test(lines[i])) {
          hits.push(`${rel}:${i + 1}  ${lines[i].trim().slice(0, 80)}`);
        }
      }
    }
  }

  if (hits.length > 0) {
    findings.fail.push(`${hits.length} stub marker(s) in modified files:`);
    for (const h of hits.slice(0, 10)) findings.fail.push(`  ${h}`);
    if (hits.length > 10) findings.fail.push(`  ... and ${hits.length - 10} more`);
  } else if (filesModified.length > 0) {
    const scanned = filesModified.length - excluded;
    const excludedNote = excluded > 0 ? ` (${excluded} pattern-definition file(s) excluded)` : "";
    findings.pass.push(`no stub markers in ${scanned} modified file(s)${excludedNote}`);
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 4: Gap analysis

function dim4GapAnalysis(state) {
  const findings = { pass: [], fail: [], warn: [] };
  const decisions = state.decisions;
  if (!decisions || (typeof decisions === "object" && Object.keys(decisions).length === 0)) {
    findings.warn.push(`state.decisions is empty — nothing to map`);
    return findings;
  }

  // decisions may be an object keyed by ID or an array. Normalize.
  const decisionList = Array.isArray(decisions) ? decisions : Object.values(decisions);
  const accepted = decisionList.filter(
    (d) => d && (d.status === "accepted" || d.accepted === true)
  );
  if (state.accepted_decisions && state.accepted_decisions !== accepted.length) {
    findings.warn.push(
      `accepted_decisions counter (${state.accepted_decisions}) disagrees with decision list (${accepted.length})`
    );
  }

  // Count decisions with a file_modified reference (schema extension from
  // pattern doc). If missing, schema gap — WARN not FAIL.
  const mappable = accepted.filter((d) => d.file_modified || d.diff_hunk);
  if (mappable.length < accepted.length) {
    findings.warn.push(
      `${accepted.length - mappable.length} of ${accepted.length} accepted decisions lack file_modified/diff_hunk (schema gap — see SELF_AUDIT_PATTERN.md §State File Contract)`
    );
  }

  if (accepted.length === 0) {
    findings.warn.push(`no accepted decisions to verify`);
  } else if (mappable.length === accepted.length) {
    findings.pass.push(`all ${accepted.length} accepted decisions mapped to file/diff`);
  } else if (mappable.length > 0) {
    findings.pass.push(`${mappable.length}/${accepted.length} accepted decisions mapped`);
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 5: Functional verification

function dim5Functional(targetSkill) {
  const findings = { pass: [], fail: [], warn: [] };
  try {
    // Use execFileSync (not exec) to avoid shell interpretation
    execFileSync("npm", ["run", "skills:validate"], {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
      timeout: 60000,
      shell: process.platform === "win32", // npm on Windows requires shell
    });
    findings.pass.push(`npm run skills:validate exited 0`);
  } catch (err) {
    findings.fail.push(`npm run skills:validate failed: ${sanitizeError(err)}`);
  }

  // Target skill dir must exist
  const skillDir = path.join(SKILLS_DIR, targetSkill);
  try {
    validatePathInDir(SKILLS_DIR, skillDir);
  } catch {
    findings.fail.push(`target skill name escapes skills dir: ${targetSkill}`);
    return findings;
  }
  if (!fs.existsSync(skillDir)) {
    findings.fail.push(`target skill directory not found: ${skillDir}`);
  } else {
    findings.pass.push(`target skill directory exists`);
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 6: Cross-reference integrity (deterministic, Session #281 rework)
//
// Previously: MANUAL block asking human to dispatch code-reviewer.
// Now: deterministic check that decision count matches accepted+rejected,
// and that accepted decisions have implementation references.
// Rationale: see skill-audit-batch-mode/DECISIONS.md D11.

function dim6CrossReferenceIntegrity(state) {
  const findings = { pass: [], fail: [], warn: [] };
  const total = state.total_decisions;
  const accepted = state.accepted_decisions;
  const rejected = state.rejected_decisions;

  // Counter integrity: total == accepted + rejected (when all present)
  if (typeof total === "number" && typeof accepted === "number" && typeof rejected === "number") {
    if (total === accepted + rejected) {
      findings.pass.push(
        `decision counters consistent: total=${total} = accepted=${accepted} + rejected=${rejected}`
      );
    } else {
      findings.fail.push(
        `decision counter mismatch: total=${total} != accepted=${accepted} + rejected=${rejected}`
      );
    }
  } else {
    findings.warn.push(
      `decision counters incomplete (total/accepted/rejected missing) — cannot verify`
    );
  }

  // Accepted decisions should have at least one file reference
  const decisions = state.decisions;
  const filesModified = state.files_modified || [];
  if (
    decisions &&
    typeof decisions === "object" &&
    Object.keys(decisions).length > 0 &&
    filesModified.length === 0 &&
    (accepted || 0) > 0
  ) {
    findings.fail.push(
      `${accepted} accepted decisions but files_modified is empty — no cross-reference possible`
    );
  } else if (filesModified.length > 0 && (accepted || 0) > 0) {
    findings.pass.push(
      `${accepted} accepted decisions mapped to ${filesModified.length} modified file(s)`
    );
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 7: Regression detection

function dim7Regression(state) {
  const findings = { pass: [], fail: [], warn: [] };
  const previous = state.previous_run;
  if (!previous) {
    findings.warn.push(
      `no previous_run in state — regression check skipped (first audit or schema gap)`
    );
    return findings;
  }

  const prevFiles = previous.files_modified || [];
  const currFiles = state.files_modified || [];
  const currSet = new Set(currFiles.map((f) => f.replace(/\\/g, "/")));
  const missing = [];
  for (const rel of prevFiles) {
    const norm = rel.replace(/\\/g, "/");
    if (!currSet.has(norm)) missing.push(rel);
  }

  if (missing.length > 0) {
    findings.fail.push(
      `${missing.length} file(s) modified in previous run are not in current run (potential regression): ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "..." : ""}`
    );
  } else if (prevFiles.length > 0) {
    findings.pass.push(`no regression vs previous run (${prevFiles.length} files still covered)`);
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 8: Contract verification

function dim8Contract(targetSkill) {
  const findings = { pass: [], fail: [], warn: [] };
  const skillMdPath = path.join(SKILLS_DIR, targetSkill, "SKILL.md");
  try {
    validatePathInDir(SKILLS_DIR, skillMdPath);
    refuseSymlinkWithParents(skillMdPath);
  } catch (err) {
    findings.fail.push(`SKILL.md path invalid: ${sanitizeError(err)}`);
    return findings;
  }
  if (!fs.existsSync(skillMdPath)) {
    findings.fail.push(`target SKILL.md not found: ${skillMdPath}`);
    return findings;
  }

  let content;
  try {
    content = fs.readFileSync(skillMdPath, "utf8");
  } catch (err) {
    findings.fail.push(`cannot read SKILL.md: ${sanitizeError(err)}`);
    return findings;
  }

  // YAML frontmatter (required)
  if (!/^---\s*\n[\s\S]+?\n---\s*\n/.test(content)) {
    findings.fail.push(`SKILL.md missing YAML frontmatter (required per SKILL_STANDARDS.md)`);
  } else {
    findings.pass.push(`SKILL.md YAML frontmatter present`);
  }

  // Required sections
  const missingSections = [];
  for (const section of REQUIRED_SKILL_SECTIONS) {
    if (!content.includes(section)) missingSections.push(section);
  }
  if (missingSections.length > 0) {
    findings.fail.push(`SKILL.md missing required section(s): ${missingSections.join(", ")}`);
  } else {
    findings.pass.push(`all required SKILL.md sections present`);
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 9: Partial execution recovery

function dim9PartialRecovery(state) {
  const findings = { pass: [], fail: [], warn: [] };
  if (state.status !== "complete") {
    findings.fail.push(`state.status is "${state.status}" — audit not complete`);
    return findings;
  }

  // If an `updated` timestamp is present and `started_at` is also present,
  // verify updated > started_at (sanity).
  const started = state.started_at ? Date.parse(state.started_at) : null;
  const updated = state.updated ? Date.parse(state.updated) : null;
  if (started && updated && updated < started) {
    findings.fail.push(
      `state.updated (${state.updated}) is before state.started_at (${state.started_at})`
    );
  } else if (updated) {
    findings.pass.push(`state timestamps consistent`);
  } else {
    findings.warn.push(`state.updated absent — cannot verify timestamp consistency`);
  }

  // Check phase marker is terminal
  if (state.current_phase && state.current_phase < 5) {
    findings.warn.push(
      `state.current_phase is ${state.current_phase}; expected >=5 for completed audit`
    );
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Main

function main() {
  const args = parseArgs(process.argv);
  if (!args.target) {
    console.error("Usage: node scripts/skills/skill-audit/self-audit.js --target=<skill-name>");
    process.exit(2);
  }

  // Validate target is a bare skill name (no path traversal)
  if (!/^[a-zA-Z0-9_-]+$/.test(args.target)) {
    console.error(`Invalid target skill name: ${args.target}`);
    process.exit(2);
  }

  let state, statePath;
  try {
    ({ state, statePath } = loadState(args.target, args.state));
  } catch (err) {
    console.error(sanitizeError(err));
    process.exit(2);
  }

  const dimensions = {
    completeness: dim1Completeness(state),
    orphans: dim2Orphans(state, args.target),
    build: dim3BuildIntegrity(state),
    gap: dim4GapAnalysis(state),
    functional: dim5Functional(args.target),
    cross_reference: dim6CrossReferenceIntegrity(state),
    regression: dim7Regression(state),
    contract: dim8Contract(args.target),
    partial_recovery: dim9PartialRecovery(state),
  };

  // MUST dimensions for Complex tier: 1-5, 6 (now cross_reference integrity —
  // deterministic replacement for multi_agent per Session #281 D11),
  // 7 (Complex MUST), 8 (MUST if consumers — skill-audit has consumers:
  // skill-creator, skill-ecosystem-audit), 9 (Complex MUST). All 9 are MUST.
  const mustDimensions = [
    "completeness",
    "orphans",
    "build",
    "gap",
    "functional",
    "cross_reference",
    "regression",
    "contract",
    "partial_recovery",
  ];

  const summary = {
    skill: "skill-audit",
    target: args.target,
    state_path: path.relative(PROJECT_ROOT, statePath),
    dimensions: {},
    overall: "PASS",
    must_failed: [],
    should_warned: [],
    timestamp: new Date().toISOString(),
  };

  for (const [name, findings] of Object.entries(dimensions)) {
    const status = findings.fail.length > 0 ? "FAIL" : findings.warn.length > 0 ? "WARN" : "PASS";
    summary.dimensions[name] = {
      status,
      pass: findings.pass.length,
      warn: findings.warn.length,
      fail: findings.fail.length,
    };
    if (status === "FAIL" && mustDimensions.includes(name)) {
      summary.must_failed.push(name);
      summary.overall = "FAIL";
    }
    if (status === "WARN") summary.should_warned.push(name);
  }

  if (args.json) {
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
    process.exit(summary.overall === "FAIL" ? 1 : 0);
  }

  // Human-readable stream
  console.log(`skill-audit Self-Audit: ${args.target}`);
  console.log(`State: ${summary.state_path}`);
  console.log("---");
  for (const [name, findings] of Object.entries(dimensions)) {
    const status = summary.dimensions[name].status;
    console.log(`\n[Dim ${name}] ${status}`);
    for (const p of findings.pass) console.log(`  + ${p}`);
    for (const w of findings.warn) console.log(`  ~ ${w}`);
    for (const f of findings.fail) console.log(`  x ${f}`);
  }

  console.log("\n---SUMMARY---");
  console.log(JSON.stringify(summary, null, 2));
  console.log("---END---");
  process.exit(summary.overall === "FAIL" ? 1 : 0);
}

try {
  main();
} catch (err) {
  console.error(`Fatal: ${sanitizeError(err)}`);
  process.exit(2);
}
