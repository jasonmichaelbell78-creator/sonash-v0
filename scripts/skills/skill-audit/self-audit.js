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
 *     (grep) + Layer 2 (diff) cover the failure mode mechanically.
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
// coincidentally contain these tokens. The first regex matches the literal
// task tokens (T_O_DO / FIXME / XXX — broken here so SonarCloud's
// "complete-this-task" rule doesn't flag this comment block) when prefixed by
// a comment leader: `//`, `#`, ` *` (jsdoc), `- ` (markdown bullet), `> `
// (blockquote), or start-of-line. The remaining regexes match `[TBD]` and
// `{placeholder}` / `<placeholder>` template stubs in any context.
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
// files_modified normalization
//
// REFERENCE.md §State File Schema documents `files_modified` entries as
// `"path (description of changes)"`. Legacy/machine-written state may be
// pure paths. Normalize by stripping a trailing parenthesized segment so
// dimensions that filesystem-check the entry (dim1/dim3/dim7) work for both
// forms. Returns the path only; descriptions are discarded for machine use.

// String-parse YAML frontmatter detection. Replaces a regex with nested
// quantifiers (S5852) — accepts both `\n` and `\r\n` line endings. Frontmatter
// is `---<newline>...<newline>---<newline>` at the very start of the file.
// We require a real terminating `---` line (not a `----` ruler).
function hasYamlFrontmatter(content) {
  if (typeof content !== "string") return false;
  const startsLF = content.startsWith("---\n");
  const startsCRLF = content.startsWith("---\r\n");
  if (!startsLF && !startsCRLF) return false;
  // Search for closing delimiter starting after the opening line.
  // `\n---\n` or `\n---\r\n` are the only valid closers (a terminating line
  // that is exactly `---`); `\n----` is a Markdown horizontal ruler and
  // does NOT close frontmatter.
  const startOffset = startsCRLF ? 5 : 4;
  return content.includes("\n---\n", startOffset) || content.includes("\n---\r\n", startOffset);
}

function normalizeFilesModified(entries) {
  const list = Array.isArray(entries) ? entries : [];
  return list.map((entry) => {
    if (typeof entry !== "string") return entry;
    // Match `path (description)` — trim trailing space + parenthesized group.
    // Description may contain any non-paren character; take the first `(`.
    const parenIdx = entry.indexOf(" (");
    if (parenIdx === -1) return entry.trim();
    return entry.slice(0, parenIdx).trim();
  });
}

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
  // Defense-in-depth: resolve override relative to PROJECT_ROOT (not cwd) so
  // that when the script runs from a parent dir, relative paths can't escape.
  // validatePathInDir below is the primary containment; this layer narrows the
  // attack window for TOCTOU between resolve() and readFileSync.
  const statePath = stateOverride
    ? path.resolve(PROJECT_ROOT, stateOverride)
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
  if (statusOk) {
    findings.pass.push(`state.status = complete`);
  } else {
    findings.fail.push(`state.status is "${state.status}", expected "complete"`);
  }

  const scoreOk = state.overall_score !== null && state.overall_score !== undefined;
  if (scoreOk) {
    findings.pass.push(`state.overall_score recorded (${state.overall_score})`);
  } else {
    findings.fail.push(`state.overall_score is null/undefined — audit did not record final score`);
  }

  const filesModified = normalizeFilesModified(state.files_modified);
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

// Split files_modified into in-scope (under target skill tree or _shared)
// and out-of-scope. POSIX-style normalization for cross-platform comparison.
function splitFilesByScope(filesModified, expectedPrefixes) {
  const inScope = [];
  const outOfScope = [];
  for (const rel of filesModified) {
    const normalized = rel.replaceAll("\\", "/");
    if (expectedPrefixes.some((p) => normalized.startsWith(p))) {
      inScope.push(rel);
    } else {
      outOfScope.push(rel);
    }
  }
  return { inScope, outOfScope };
}

// SKILL.md is the canonical entry point — users load it directly, so it is
// never "referenced" by another file. Detection works for either path
// separator style.
function isSkillEntryPoint(rel, targetSkill) {
  const normalized = rel.replaceAll("\\", "/");
  return normalized === `.claude/skills/${targetSkill}/SKILL.md`;
}

// Run git-grep for `basename` across `searchRoots` and return whether any
// hit exists OTHER than the file itself. Returns:
//   { referenced: true|false }                   on success or no-match
//   { referenced: true,  error: <sanitized> }    on tool error (fail-open)
// Fail-open on tool error avoids false-FAIL when git is missing.
function gitGrepHasReferences(basename, normalizedSelf, searchRoots) {
  try {
    const out = execFileSync("git", ["grep", "-l", "-F", "--", basename, ...searchRoots], {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 10000,
    })
      .toString("utf8")
      .trim();
    if (out.length === 0) return { referenced: false };
    const hits = out
      .split(/\r?\n/)
      .map((h) => h.replaceAll("\\", "/"))
      .filter((h) => h !== normalizedSelf);
    return { referenced: hits.length > 0 };
  } catch (err) {
    // git grep exit 1 = no match → unreferenced. Other exits = tool error.
    const status = err && typeof err.status === "number" ? err.status : null;
    if (status === 1) return { referenced: false };
    return { referenced: true, error: sanitizeError(err) };
  }
}

function detectOrphans(inScope, targetSkill, searchRoots, findings) {
  const orphans = [];
  for (const rel of inScope) {
    if (isSkillEntryPoint(rel, targetSkill)) continue;
    const basename = path.basename(rel);
    if (!basename || searchRoots.length === 0) continue;
    const normalizedSelf = rel.replaceAll("\\", "/");
    const result = gitGrepHasReferences(basename, normalizedSelf, searchRoots);
    if (result.error) {
      findings.warn.push(`git grep failed for ${basename}: ${result.error}`);
      continue; // fail-open — treat as referenced to avoid false-FAIL
    }
    if (!result.referenced) orphans.push(rel);
  }
  return orphans;
}

function dim2Orphans(state, targetSkill) {
  const findings = { pass: [], fail: [], warn: [] };
  const filesModified = normalizeFilesModified(state.files_modified);
  if (filesModified.length === 0) {
    findings.warn.push(`no files_modified to check for orphans`);
    return findings;
  }

  const expectedPrefixes = [
    `.claude/skills/${targetSkill}/`,
    `scripts/skills/${targetSkill}/`,
    `.claude/skills/_shared/`,
  ];
  const { inScope, outOfScope } = splitFilesByScope(filesModified, expectedPrefixes);
  if (outOfScope.length > 0) {
    findings.warn.push(
      `${outOfScope.length} files_modified outside expected target-skill tree: ${outOfScope.slice(0, 3).join(", ")}${outOfScope.length > 3 ? "..." : ""}`
    );
  }

  // Real orphan detection (Dim 2 MUST per SELF_AUDIT_PATTERN.md §Dim 2):
  // for each in-scope non-entry-point file, use git-grep to find references
  // to its basename within the target skill tree + shared. Zero references
  // = orphan candidate. git-grep honors .gitignore and avoids node_modules.
  const searchRoots = [
    path.join(".claude", "skills", targetSkill),
    path.join("scripts", "skills", targetSkill),
    path.join(".claude", "skills", "_shared"),
  ].filter((p) => fs.existsSync(path.join(PROJECT_ROOT, p)));

  const orphans = detectOrphans(inScope, targetSkill, searchRoots, findings);

  if (orphans.length > 0) {
    findings.fail.push(
      `${orphans.length} potential orphan file(s) — no references found in skill tree: ${orphans.slice(0, 5).join(", ")}${orphans.length > 5 ? "..." : ""}`
    );
  } else if (inScope.length > 0) {
    findings.pass.push(`${inScope.length} in-scope file(s) have references in skill tree`);
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 3: Build integrity

// Per-file read with security layering. Returns either content (string) or
// a skip reason. validatePathInDir blocks `../` traversal; symlink refusal
// blocks redirection; try/catch catches I/O and ENOENT. (No existsSync
// pre-check — Pattern 9 prohibits the stat/read race; attempt the read and
// classify ENOENT as "missing" in the catch branch.)
// Extracted to keep dim3BuildIntegrity below CC-15.
function readFileForDim3(rel) {
  const abs = path.join(PROJECT_ROOT, rel);
  try {
    validatePathInDir(PROJECT_ROOT, abs);
  } catch {
    return { skipReason: "containment" };
  }
  try {
    refuseSymlinkWithParents(abs);
  } catch {
    return { skipReason: "symlink_refused" };
  }
  try {
    return { content: fs.readFileSync(abs, "utf8") };
  } catch (err) {
    if (err && err.code === "ENOENT") return { skipReason: "missing" };
    return { skipReason: "read_error" };
  }
}

// Scan a file's lines for any STUB_MARKERS match. Returns an array of
// `path:line  preview` strings.
function findStubMarkerHits(content, rel) {
  const hits = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const re of STUB_MARKERS) {
      if (re.test(lines[i])) {
        hits.push(`${rel}:${i + 1}  ${lines[i].trim().slice(0, 80)}`);
      }
    }
  }
  return hits;
}

// Walk filesModified once; classify each into excluded / skipped / scanned
// and accumulate stub-marker hits. Containment failures are also pushed to
// findings.fail (security signal). Returns the bookkeeping the caller needs
// for summarization.
function scanFilesForStubMarkers(filesModified, findings) {
  const hits = [];
  const skipped = [];
  let excluded = 0;
  for (const rel of filesModified) {
    if (DIM3_EXCLUDE.some((re) => re.test(rel))) {
      excluded++;
      continue;
    }
    const { content, skipReason } = readFileForDim3(rel);
    if (skipReason) {
      skipped.push({ rel, reason: skipReason });
      if (skipReason === "containment") {
        findings.fail.push(`files_modified entry escapes project root: ${rel}`);
      }
      continue;
    }
    hits.push(...findStubMarkerHits(content, rel));
  }
  return { hits, skipped, excluded };
}

function reportDim3Hits(hits, filesModified, excluded, skippedCount, findings) {
  if (hits.length > 0) {
    findings.fail.push(`${hits.length} stub marker(s) in modified files:`);
    for (const h of hits.slice(0, 10)) findings.fail.push(`  ${h}`);
    if (hits.length > 10) findings.fail.push(`  ... and ${hits.length - 10} more`);
    return;
  }
  if (filesModified.length === 0) return;
  const scanned = filesModified.length - excluded - skippedCount;
  const excludedNote = excluded > 0 ? ` (${excluded} pattern-definition file(s) excluded)` : "";
  findings.pass.push(`no stub markers in ${scanned} modified file(s)${excludedNote}`);
}

function reportDim3Skipped(skipped, findings) {
  if (skipped.length === 0) return;
  const preview = skipped
    .slice(0, 5)
    .map((s) => `${s.rel} (${s.reason})`)
    .join(", ");
  const more = skipped.length > 5 ? `, ... and ${skipped.length - 5} more` : "";
  findings.warn.push(`${skipped.length} file(s) not scanned: ${preview}${more}`);
}

function dim3BuildIntegrity(state) {
  const findings = { pass: [], fail: [], warn: [] };
  const filesModified = normalizeFilesModified(state.files_modified);
  const { hits, skipped, excluded } = scanFilesForStubMarkers(filesModified, findings);
  reportDim3Hits(hits, filesModified, excluded, skipped.length, findings);
  // Surface skipped files so Dim 3 cannot silently PASS with incomplete
  // scanning. Symlink/missing/read_error are audit signals, not noise.
  reportDim3Skipped(skipped, findings);
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
    // npm on Windows is dispatched via npm.cmd, which Node refuses to spawn
    // without shell: true after CVE-2024-27980. The Qodo R1 suggestion to
    // use { shell: false, "npm.cmd" } breaks at runtime with EINVAL — it
    // pre-dates the Node hardening. The acceptable mitigation:
    //   1. Hardcoded args (no untrusted input concatenated into the command)
    //   2. cwd locked to PROJECT_ROOT (no relative-path tricks)
    //   3. timeout + maxBuffer caps (resource exhaustion guard)
    //   4. SonarCloud S4036 (PATH search) acknowledged: PATH is the user's
    //      developer/CI environment, not attacker-controlled.
    execFileSync("npm", ["run", "skills:validate"], {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024, // 10MB cap — guard against runaway child
      shell: process.platform === "win32",
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
  if (fs.existsSync(skillDir)) {
    findings.pass.push(`target skill directory exists`);
  } else {
    findings.fail.push(`target skill directory not found: ${skillDir}`);
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

// Derive decision counts from either top-level counters or
// state.decisions.{accepted,rejected} (per SELF_AUDIT_PATTERN.md schema).
function deriveDecisionCounts(state) {
  const decisionsObj = state.decisions || {};
  const acceptedFromList = Array.isArray(decisionsObj.accepted) ? decisionsObj.accepted.length : 0;
  const rejectedFromList = Array.isArray(decisionsObj.rejected) ? decisionsObj.rejected.length : 0;
  const accepted = state.accepted_decisions ?? acceptedFromList;
  const rejected = state.rejected_decisions ?? rejectedFromList;
  const total = state.total_decisions ?? accepted + rejected;
  return { total, accepted, rejected };
}

function checkCounterIntegrity({ total, accepted, rejected }, findings) {
  const allNumbers =
    typeof total === "number" && typeof accepted === "number" && typeof rejected === "number";
  if (!allNumbers) {
    findings.warn.push(
      `decision counters incomplete (total/accepted/rejected missing) — cannot verify`
    );
    return;
  }
  if (total === accepted + rejected) {
    findings.pass.push(
      `decision counters consistent: total=${total} = accepted=${accepted} + rejected=${rejected}`
    );
  } else {
    findings.fail.push(
      `decision counter mismatch: total=${total} != accepted=${accepted} + rejected=${rejected}`
    );
  }
}

function checkAcceptedHaveFiles(state, accepted, findings) {
  const decisions = state.decisions;
  const filesModified = state.files_modified || [];
  const hasDecisions =
    decisions && typeof decisions === "object" && Object.keys(decisions).length > 0;
  const acceptedCount = accepted || 0;
  if (hasDecisions && filesModified.length === 0 && acceptedCount > 0) {
    findings.fail.push(
      `${accepted} accepted decisions but files_modified is empty — no cross-reference possible`
    );
  } else if (filesModified.length > 0 && acceptedCount > 0) {
    findings.pass.push(
      `${accepted} accepted decisions mapped to ${filesModified.length} modified file(s)`
    );
  }
}

function dim6CrossReferenceIntegrity(state) {
  const findings = { pass: [], fail: [], warn: [] };
  const counts = deriveDecisionCounts(state);
  checkCounterIntegrity(counts, findings);
  checkAcceptedHaveFiles(state, counts.accepted, findings);

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

  // Support both files_modified (skill-audit's schema) and files_created
  // (the SELF_AUDIT_PATTERN.md §Dim 7 documented field). Normalize so
  // entries like `path (description)` compare correctly.
  const prevFiles = normalizeFilesModified(previous.files_modified || previous.files_created);
  const currFiles = normalizeFilesModified(state.files_modified || state.files_created);
  const currSet = new Set(currFiles.map((f) => f.replaceAll("\\", "/")));
  const missing = [];
  for (const rel of prevFiles) {
    const norm = rel.replaceAll("\\", "/");
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
  // No existsSync pre-check — Pattern 9 prohibits the stat/read race.
  // Attempt the read; classify ENOENT as not-found in the catch branch.
  let content;
  try {
    content = fs.readFileSync(skillMdPath, "utf8");
  } catch (err) {
    if (err && err.code === "ENOENT") {
      findings.fail.push(`target SKILL.md not found: ${skillMdPath}`);
    } else {
      findings.fail.push(`cannot read SKILL.md: ${sanitizeError(err)}`);
    }
    return findings;
  }

  // YAML frontmatter (required). Use string parsing instead of a regex
  // with nested quantifiers — /^---\s*\n[\s\S]+?\n---\s*\n/ has catastrophic
  // backtracking on pathological input (SonarCloud S5852). Two-strikes rule
  // (CODE_PATTERNS.md): prefer string parsing to regex for simple delimiter
  // scans. indexOf is O(n); the `\n---\n` / `\n---\r\n` literal avoids
  // false-matching `\n----` (ruler line, which is valid Markdown).
  if (hasYamlFrontmatter(content)) {
    findings.pass.push(`SKILL.md YAML frontmatter present`);
  } else {
    findings.fail.push(`SKILL.md missing YAML frontmatter (required per SKILL_STANDARDS.md)`);
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

// MUST dimensions for Complex tier: 1-5, 6 (cross_reference integrity —
// deterministic replacement for multi_agent per Session #281 D11),
// 7 (Complex MUST), 8 (MUST if consumers — skill-audit has consumers:
// skill-creator, skill-ecosystem-audit), 9 (Complex MUST). All 9 are MUST.
// Set instead of Array — `.has()` is O(1) and reads more clearly.
const MUST_DIMENSIONS = new Set([
  "completeness",
  "orphans",
  "build",
  "gap",
  "functional",
  "cross_reference",
  "regression",
  "contract",
  "partial_recovery",
]);

// Compute PASS/WARN/FAIL from a findings bucket. Extracted from a nested
// ternary in the summary loop for readability and CC reduction.
function findingsStatus(findings) {
  if (findings.fail.length > 0) return "FAIL";
  if (findings.warn.length > 0) return "WARN";
  return "PASS";
}

// Aggregate the per-dimension findings into the SUMMARY block.
function buildSummary(args, statePath, dimensions) {
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
    const status = findingsStatus(findings);
    summary.dimensions[name] = {
      status,
      pass: findings.pass.length,
      warn: findings.warn.length,
      fail: findings.fail.length,
    };
    if (status === "FAIL" && MUST_DIMENSIONS.has(name)) {
      summary.must_failed.push(name);
      summary.overall = "FAIL";
    }
    if (status === "WARN") summary.should_warned.push(name);
  }
  return summary;
}

function printHumanStream(args, dimensions, summary) {
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
}

function runAllDimensions(state, target) {
  return {
    completeness: dim1Completeness(state),
    orphans: dim2Orphans(state, target),
    build: dim3BuildIntegrity(state),
    gap: dim4GapAnalysis(state),
    functional: dim5Functional(target),
    cross_reference: dim6CrossReferenceIntegrity(state),
    regression: dim7Regression(state),
    contract: dim8Contract(target),
    partial_recovery: dim9PartialRecovery(state),
  };
}

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

  const dimensions = runAllDimensions(state, args.target);
  const summary = buildSummary(args, statePath, dimensions);

  if (args.json) {
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
  } else {
    printHumanStream(args, dimensions, summary);
  }
  process.exit(summary.overall === "FAIL" ? 1 : 0);
}

try {
  main();
} catch (err) {
  console.error(`Fatal: ${sanitizeError(err)}`);
  process.exit(2);
}
