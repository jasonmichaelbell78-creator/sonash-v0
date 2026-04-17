/* global __dirname */
"use strict";

/**
 * synthesize Self-Audit
 *
 * Penultimate-phase verification for /synthesize runs. Validates synthesis
 * artifacts (synthesis.md, synthesis.json, opportunities-ledger.jsonl) and
 * the run's state file against the 12 dimensions defined in SKILL.md
 * (REFERENCE.md §8). Implements the canonical fix action for /skill-audit
 * Category 12 (Completion Verification Design) per Session #284 decisions
 * 12A/B/C/D/E/F/G/H.
 *
 * Modeled on .claude/skills/_shared/SELF_AUDIT_PATTERN.md.
 *
 * Usage:
 *   node scripts/skills/synthesize/self-audit.js
 *   node scripts/skills/synthesize/self-audit.js --state=<path>
 *   node scripts/skills/synthesize/self-audit.js --json
 *
 * Exit codes:
 *   0 = all MUST dimensions pass (SHOULD may be WARN)
 *   1 = one or more MUST dimensions fail
 *   2 = script failure (missing input, malformed state, security refusal)
 *
 * Tier classification: synthesize is Complex (>300-line SKILL.md, REFERENCE
 * companion, multi-phase). All 8 implemented dimensions are MUST.
 *
 * Scripted dimensions (per HANDOFF Wave 2 + decisions 12A-H):
 *   - artifacts          (12A)  synthesis.md + synthesis.json + ledger present
 *   - schema             (12A)  Zod validate synthesis.json :: synthesisRecord
 *   - sections           (12A)  all 8 sections present in synthesis.md
 *   - gaps               (12A)  gap domains in home context, not in sources
 *   - orphans            (12B)  sources referenced but missing on disk
 *   - partial_recovery   (12E)  state.status + pre-run stale-artifact check
 *   - contract           (12D)  opportunities-ledger matches opportunity_matrix
 *   - preflight          (12F)  rebuild-index.js exists + executable
 *
 * Non-scripted (deferred to Phase 5 prose, per pattern doc §Skip List):
 *   - SKILL.md Dim 4 Evidence grounding: emitted as MANUAL Explore-agent
 *     block per decision 12C — judgment check, costly to fully script
 *     (requires loading every source artifact and resolving refs).
 *   - SKILL.md Dim 5 Candidate integrity: requires re-running dedup pass
 *     across all sources (expensive load).
 *   - SKILL.md Dim 6 Convergence math: requires evidence-graph traversal.
 *   - SKILL.md Dim 7 Dedup check: same load profile as Dim 5.
 *   - SKILL.md Dim 9 Opportunity grounding: judgment-only, similar to Dim 4.
 *   - SKILL.md Dim 10 Changes accuracy: only meaningful in re-synthesis mode,
 *     and requires diff against archived prior — handled inline by Phase 5.
 *
 * Pre-run feedforward (decision 12H):
 *   Reads .claude/state/synthesize-audit-log.jsonl (when present) for the
 *   last 5 runs. If 3+ runs flagged the same section weak/incomplete, the
 *   script emits a WARN before dimensions run, surfacing the section name.
 *
 * State schema fields read (decision 12G):
 *   status, paradigm, mode, sections_completed[], sources_loaded[],
 *   subagent_dispatches[], invocation, last_complete_run.
 *   Missing fields degrade individual checks to WARN, never FAIL —
 *   backward compatibility with state schema v1.
 *
 * @see .claude/skills/_shared/SELF_AUDIT_PATTERN.md
 * @see .claude/skills/synthesize/SKILL.md (Self-Audit section)
 * @see .claude/skills/synthesize/REFERENCE.md §8 (full rubric)
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const {
  sanitizeError,
  validatePathInDir,
  refuseSymlinkWithParents,
} = require("../../lib/security-helpers.js");
const { safeParseLine } = require("../../lib/parse-jsonl-line.js");

const PROJECT_ROOT = path.resolve(__dirname, "../../.."); // validatePathInDir: constant-path (no user input)
const STATE_DIR = path.join(PROJECT_ROOT, ".claude", "state");
const SYNTHESIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis", "synthesis");
const ANALYSIS_DIR = path.join(PROJECT_ROOT, ".research", "analysis");
const REBUILD_INDEX_SCRIPT = path.join(PROJECT_ROOT, "scripts", "cas", "rebuild-index.js");
const AUDIT_LOG = path.join(STATE_DIR, "synthesize-audit-log.jsonl");

// Required sections in synthesis.md (per SKILL.md Output Sections §1-8).
// Match against H2 headings (## ...) using any of the listed needles for that
// section — accommodates both the canonical name (e.g. "Emergent Themes") and
// shortened forms in legacy outputs (e.g. "Themes"). Section 8 is
// re-synthesis only — checked only when state.mode === 're-synthesis'.
const REQUIRED_SECTIONS = [
  { id: "themes", needles: ["Emergent Themes", "Themes"] },
  { id: "gaps", needles: ["Ecosystem Gap"] },
  { id: "reading_chain", needles: ["Reading Chain"] },
  { id: "mental_model", needles: ["Mental Model"] },
  { id: "fit_portfolio", needles: ["Fit Portfolio"] },
  { id: "knowledge_map", needles: ["Knowledge Map"] },
  { id: "opportunity_matrix", needles: ["Opportunity Matrix"] },
];
const RESYNTHESIS_SECTION = { id: "changes", needles: ["Changes Since Previous"] };

// Stub markers indicating an unfinished synthesis. Same pattern family as the
// skill-audit reference but trimmed for prose output (no JSDoc context here).
const STUB_MARKERS = [
  /(?:\/\/|#|\*|^|\s-\s|>\s)\s*(?:TODO|FIXME|XXX)(?:\s|:|$)/,
  /\[TBD\]/,
  /[{<]placeholder[}>]/i,
];

// ---------------------------------------------------------------------------
// Arg parsing

function parseArgs(argv) {
  const args = { state: null, json: false };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--state=")) {
      args.state = arg.slice("--state=".length);
    } else if (arg === "--json") {
      args.json = true;
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// State loading (security-hardened)

function loadState(stateOverride) {
  const statePath = stateOverride
    ? path.resolve(PROJECT_ROOT, stateOverride) // validatePathInDir: enforced below
    : path.join(STATE_DIR, "synthesize.state.json");

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

// Read a JSON file under PROJECT_ROOT with full security layering.
// Returns { data } on success or { error: <reason> } when the file is
// missing/invalid. Never throws — callers branch on the return shape.
function safeReadJson(absPath) {
  try {
    validatePathInDir(PROJECT_ROOT, absPath);
  } catch {
    return { error: "containment" };
  }
  try {
    refuseSymlinkWithParents(absPath);
  } catch {
    return { error: "symlink_refused" };
  }
  let raw;
  try {
    raw = fs.readFileSync(absPath, "utf8");
  } catch (err) {
    if (err?.code === "ENOENT") return { error: "missing" };
    return { error: "read_error" };
  }
  try {
    return { data: JSON.parse(raw) };
  } catch {
    return { error: "invalid_json" };
  }
}

function safeReadText(absPath) {
  try {
    validatePathInDir(PROJECT_ROOT, absPath);
  } catch {
    return { error: "containment" };
  }
  try {
    refuseSymlinkWithParents(absPath);
  } catch {
    return { error: "symlink_refused" };
  }
  try {
    return { text: fs.readFileSync(absPath, "utf8") };
  } catch (err) {
    if (err?.code === "ENOENT") return { error: "missing" };
    return { error: "read_error" };
  }
}

// ---------------------------------------------------------------------------
// Pre-run feedforward (decision 12H) — emits WARNs from recent audit log
// before dimensions run. Non-blocking. Surfaces sections flagged weak in 3+
// of the last 5 runs so the user can address before re-running synthesis.

function readAuditLogTail() {
  const { text, error } = safeReadText(AUDIT_LOG);
  if (error) return [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  // Take the last 5 entries (each line = one run summary).
  const tail = lines.slice(-5);
  const entries = [];
  for (const line of tail) {
    const obj = safeParseLine(line);
    if (obj) entries.push(obj);
  }
  return entries;
}

function runFeedforward() {
  const entries = readAuditLogTail();
  if (entries.length < 3) return [];
  const sectionCounts = new Map();
  for (const entry of entries) {
    const flagged = entry?.weak_sections;
    if (!Array.isArray(flagged)) continue;
    for (const section of flagged) {
      if (typeof section !== "string") continue;
      sectionCounts.set(section, (sectionCounts.get(section) || 0) + 1);
    }
  }
  const warnings = [];
  for (const [section, count] of sectionCounts.entries()) {
    if (count >= 3) {
      warnings.push(
        `pre-run hint: section "${section}" flagged weak in ${count} of last ${entries.length} runs`
      );
    }
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// Dimension 1: Artifacts (12A)
//
// synthesis.md + synthesis.json + opportunities-ledger.jsonl all present
// under .research/analysis/synthesis/.

function dim1Artifacts() {
  const findings = { pass: [], fail: [], warn: [] };
  const required = [
    { name: "synthesis.md", abs: path.join(SYNTHESIS_DIR, "synthesis.md") },
    { name: "synthesis.json", abs: path.join(SYNTHESIS_DIR, "synthesis.json") },
    {
      name: "opportunities-ledger.jsonl",
      abs: path.join(SYNTHESIS_DIR, "opportunities-ledger.jsonl"),
    },
  ];
  for (const { name, abs } of required) {
    try {
      validatePathInDir(SYNTHESIS_DIR, abs);
    } catch {
      findings.fail.push(`${name} path escapes synthesis dir`);
      continue;
    }
    if (fs.existsSync(abs)) {
      findings.pass.push(`${name} present`);
    } else {
      findings.fail.push(`${name} missing — required artifact`);
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 2: Schema (12A)
//
// Validate synthesis.json against synthesisRecord Zod schema.

function dim2Schema() {
  const findings = { pass: [], fail: [], warn: [] };
  const synthJsonPath = path.join(SYNTHESIS_DIR, "synthesis.json");
  const { data, error } = safeReadJson(synthJsonPath);
  if (error === "missing") {
    findings.fail.push(`synthesis.json missing — cannot validate schema`);
    return findings;
  }
  if (error) {
    findings.fail.push(`synthesis.json read failed: ${error}`);
    return findings;
  }

  let validate;
  try {
    ({ validate } = require(path.join(PROJECT_ROOT, "scripts", "lib", "analysis-schema.js")));
  } catch (err) {
    findings.fail.push(`cannot load synthesisRecord schema: ${sanitizeError(err)}`);
    return findings;
  }

  const result = validate(data, "synthesis");
  if (result.success) {
    findings.pass.push(`synthesis.json validates against synthesisRecord`);
  } else {
    findings.fail.push(`synthesis.json schema validation failed: ${result.error}`);
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 3: Sections (12A)
//
// All 8 sections present in synthesis.md. Section 8 (Changes Since Previous)
// is re-synthesis only — checked only when state.mode === 're-synthesis'.
// Section MAY be marked absent with explicit "(none detected)" prose; that
// counts as present per Critical Rule #5 ("no silent skips").

function findSectionInMarkdown(content, needles) {
  // Match an H2 heading containing any of the supplied needles
  // (case-insensitive). String search (not regex) avoids catastrophic
  // backtracking and dollar-sign issues in section names.
  const lines = content.split(/\r?\n/);
  const lowered = needles.map((n) => n.toLowerCase());
  for (const line of lines) {
    if (!line.startsWith("## ")) continue;
    const lc = line.toLowerCase();
    if (lowered.some((n) => lc.includes(n))) return true;
  }
  return false;
}

function findStubMarkers(text) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const re of STUB_MARKERS) {
      if (re.test(lines[i])) {
        hits.push(`synthesis.md:${i + 1}  ${lines[i].trim().slice(0, 80)}`);
      }
    }
  }
  return hits;
}

function findMissingSections(text, mode) {
  const missing = [];
  for (const section of REQUIRED_SECTIONS) {
    if (!findSectionInMarkdown(text, section.needles)) missing.push(section.needles[0]);
  }
  if (mode === "re-synthesis" && !findSectionInMarkdown(text, RESYNTHESIS_SECTION.needles)) {
    missing.push(RESYNTHESIS_SECTION.needles[0]);
  }
  return missing;
}

function dim3Sections(state) {
  const findings = { pass: [], fail: [], warn: [] };
  const synthMdPath = path.join(SYNTHESIS_DIR, "synthesis.md");
  const { text, error } = safeReadText(synthMdPath);
  if (error === "missing") {
    findings.fail.push(`synthesis.md missing — cannot check sections`);
    return findings;
  }
  if (error) {
    findings.fail.push(`synthesis.md read failed: ${error}`);
    return findings;
  }

  const missing = findMissingSections(text, state.mode);

  const stubHits = findStubMarkers(text);
  if (stubHits.length > 0) {
    findings.fail.push(`${stubHits.length} stub marker(s) in synthesis.md:`);
    for (const h of stubHits.slice(0, 5)) findings.fail.push(`  ${h}`);
    if (stubHits.length > 5) findings.fail.push(`  ... and ${stubHits.length - 5} more`);
  }

  if (missing.length > 0) {
    findings.fail.push(`missing required section(s) in synthesis.md: ${missing.join(", ")}`);
  } else {
    const expected = REQUIRED_SECTIONS.length + (state.mode === "re-synthesis" ? 1 : 0);
    findings.pass.push(`all ${expected} required sections present`);
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 4: Gaps (12A — SKILL.md Dim 8)
//
// Each ecosystem_gaps[].domain MUST appear in home context (CLAUDE.md,
// ROADMAP.md, SESSION_CONTEXT.md, EXTRACTIONS.md, research-index.jsonl)
// AND MUST NOT appear as a tag/topic in any analyzed source. Reading every
// source's tags is expensive — we instead verify the gap's
// home_context_source field references a real, readable file.

const HOME_CONTEXT_FILES = [
  "CLAUDE.md",
  "ROADMAP.md",
  "SESSION_CONTEXT.md",
  ".research/EXTRACTIONS.md",
  ".research/research-index.jsonl",
];

function isRecognizedCitation(ref) {
  const knownFile = HOME_CONTEXT_FILES.some((f) => {
    const base = f.split("/").pop();
    return ref.includes(base);
  });
  if (knownFile) return true;
  if (/\bmemory:/i.test(ref)) return true;
  if (/\b[a-z0-9_-]+\.md\b/i.test(ref)) return true;
  return false;
}

function classifyGaps(gaps) {
  const ungrounded = [];
  const schemaGaps = [];
  for (const gap of gaps) {
    const domain = typeof gap?.domain === "string" ? gap.domain : null;
    if (!domain) continue;
    const ref = typeof gap?.home_context_source === "string" ? gap.home_context_source : null;
    if (ref) {
      if (!isRecognizedCitation(ref)) {
        ungrounded.push(`${domain} (citation format unrecognized: "${ref.slice(0, 60)}")`);
      }
    } else {
      schemaGaps.push(domain);
    }
  }
  return { ungrounded, schemaGaps };
}

function dim4Gaps() {
  const findings = { pass: [], fail: [], warn: [] };
  const synthJsonPath = path.join(SYNTHESIS_DIR, "synthesis.json");
  const { data, error } = safeReadJson(synthJsonPath);
  if (error) {
    findings.warn.push(`cannot read synthesis.json (${error}) — gap check skipped`);
    return findings;
  }

  const gaps = Array.isArray(data?.ecosystem_gaps) ? data.ecosystem_gaps : [];
  if (gaps.length === 0) {
    findings.warn.push(`ecosystem_gaps empty — no gaps to validate`);
    return findings;
  }

  const { ungrounded, schemaGaps } = classifyGaps(gaps);

  if (ungrounded.length > 0) {
    findings.fail.push(
      `${ungrounded.length} of ${gaps.length} gap(s) cite unknown home context file: ${ungrounded.slice(0, 3).join(", ")}${ungrounded.length > 3 ? "..." : ""}`
    );
  }
  if (schemaGaps.length > 0) {
    findings.warn.push(
      `${schemaGaps.length} of ${gaps.length} gap(s) lack home_context_source field (schema gap — Wave 3 fix)`
    );
  }
  if (ungrounded.length === 0 && schemaGaps.length === 0) {
    findings.pass.push(`all ${gaps.length} gap domain(s) grounded with valid home_context_source`);
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 5: Orphans (12B)
//
// Sources referenced in synthesis.json (themes[].evidence[].source_slug,
// fit_portfolio.candidates[].finding_refs source_slugs, opportunity_matrix
// .evidence[]) MUST exist as analyzed sources under .research/analysis/.

function collectSlugsFromThemes(themes) {
  const slugs = new Set();
  for (const theme of themes) {
    const evidence = Array.isArray(theme?.evidence) ? theme.evidence : [];
    for (const e of evidence) {
      if (typeof e?.source_slug === "string") slugs.add(e.source_slug);
    }
  }
  return slugs;
}

function collectSlugsFromOpportunities(opps) {
  const slugs = new Set();
  for (const opp of opps) {
    const evidence = Array.isArray(opp?.evidence) ? opp.evidence : [];
    for (const slug of evidence) {
      if (typeof slug === "string" && !slug.startsWith("absence-signal:")) slugs.add(slug);
    }
  }
  return slugs;
}

function collectReferencedSlugs(data) {
  const themes = Array.isArray(data?.themes) ? data.themes : [];
  const opps = Array.isArray(data?.opportunity_matrix) ? data.opportunity_matrix : [];
  return new Set([...collectSlugsFromThemes(themes), ...collectSlugsFromOpportunities(opps)]);
}

function dim5Orphans() {
  const findings = { pass: [], fail: [], warn: [] };
  const synthJsonPath = path.join(SYNTHESIS_DIR, "synthesis.json");
  const { data, error } = safeReadJson(synthJsonPath);
  if (error) {
    findings.warn.push(`cannot read synthesis.json (${error}) — orphan check skipped`);
    return findings;
  }

  const slugs = collectReferencedSlugs(data);
  if (slugs.size === 0) {
    findings.warn.push(`no source slugs referenced in synthesis — nothing to orphan-check`);
    return findings;
  }

  const orphans = [];
  for (const slug of slugs) {
    // Validate slug shape — paranoid containment, but the synthesis writer
    // is trusted; this just rejects obviously hostile values before joining.
    if (!/^[a-zA-Z0-9._-]+$/.test(slug)) {
      orphans.push(`${slug} (invalid slug shape)`);
      continue;
    }
    const sourceDir = path.join(ANALYSIS_DIR, slug);
    try {
      validatePathInDir(ANALYSIS_DIR, sourceDir);
    } catch {
      orphans.push(`${slug} (path escapes analysis dir)`);
      continue;
    }
    if (!fs.existsSync(sourceDir)) {
      orphans.push(slug);
    }
  }

  if (orphans.length > 0) {
    findings.fail.push(
      `${orphans.length} of ${slugs.size} referenced source(s) missing on disk: ${orphans.slice(0, 5).join(", ")}${orphans.length > 5 ? "..." : ""}`
    );
  } else {
    findings.pass.push(`all ${slugs.size} referenced source(s) present`);
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 6: Partial recovery (12E)
//
// (a) state.status MUST be a recognized terminal state.
// (b) Pre-run stale-artifact check: if synthesis.md/json on disk is newer
//     than state.last_complete_run, a previous run left orphans. WARN.

const TERMINAL_STATUSES = new Set(["complete", "no_signal", "blocked", "paused", "failed"]);

function dim6PartialRecovery(state) {
  const findings = { pass: [], fail: [], warn: [] };
  const status = state?.status;
  if (!status) {
    findings.warn.push(`state.status absent — cannot verify completion`);
  } else if (TERMINAL_STATUSES.has(status)) {
    findings.pass.push(`state.status = "${status}" (terminal)`);
  } else if (status === "in_progress") {
    findings.fail.push(`state.status = "in_progress" — synthesis did not complete`);
  } else {
    findings.warn.push(`state.status = "${status}" (unrecognized terminal state)`);
  }

  // Stale artifact check
  const lastComplete = state?.last_complete_run ? Date.parse(state.last_complete_run) : null;
  if (!lastComplete) {
    findings.warn.push(`state.last_complete_run absent — stale-artifact check skipped`);
    return findings;
  }

  const synthMd = path.join(SYNTHESIS_DIR, "synthesis.md");
  const synthJson = path.join(SYNTHESIS_DIR, "synthesis.json");
  for (const [name, abs] of [
    ["synthesis.md", synthMd],
    ["synthesis.json", synthJson],
  ]) {
    let stat;
    try {
      stat = fs.statSync(abs);
    } catch {
      continue; // missing artifact already reported by Dim 1
    }
    if (stat.mtimeMs > lastComplete + 60_000) {
      findings.warn.push(
        `${name} mtime newer than state.last_complete_run by >1min — possible stale artifact from prior incomplete run`
      );
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 7: Contract (12D)
//
// opportunity_matrix in synthesis.json and opportunities-ledger.jsonl entries
// for this run MUST be consistent: every opportunity in the matrix has a
// matching ledger row with last_seen_in_run >= state.last_complete_run.

function loadLedger() {
  const ledgerPath = path.join(SYNTHESIS_DIR, "opportunities-ledger.jsonl");
  const { text, error } = safeReadText(ledgerPath);
  if (error) return { error };
  const rows = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  for (const line of lines) {
    const obj = safeParseLine(line);
    if (obj) rows.push(obj);
  }
  return { rows };
}

function normalizeTitleKey(title) {
  if (typeof title !== "string") return "";
  return title
    .toLowerCase()
    .replaceAll(/[^a-z0-9 ]/g, "")
    .trim()
    .replaceAll(/\s+/g, "_")
    .slice(0, 60);
}

function checkLedgerConsistency(matrix, ledgerByKey, lastCompleteRun) {
  const unledgered = [];
  const stale = [];
  for (const opp of matrix) {
    const key = typeof opp?.title_key === "string" ? opp.title_key : normalizeTitleKey(opp?.title);
    if (!key) {
      unledgered.push("(unkeyable opportunity)");
      continue;
    }
    const row = ledgerByKey.get(key);
    if (!row) {
      unledgered.push(key);
      continue;
    }
    if (lastCompleteRun && typeof row.last_seen_in_run === "string") {
      if (row.last_seen_in_run < lastCompleteRun) stale.push(key);
    }
  }
  return { unledgered, stale };
}

function formatSliceList(items, limit) {
  const shown = items.slice(0, limit).join(", ");
  return items.length > limit ? `${shown}...` : shown;
}

function dim7Contract(state) {
  const findings = { pass: [], fail: [], warn: [] };
  const synthJsonPath = path.join(SYNTHESIS_DIR, "synthesis.json");
  const { data, error } = safeReadJson(synthJsonPath);
  if (error) {
    findings.warn.push(`cannot read synthesis.json (${error}) — contract check skipped`);
    return findings;
  }

  const matrix = Array.isArray(data?.opportunity_matrix) ? data.opportunity_matrix : [];
  if (matrix.length === 0) {
    findings.warn.push(`opportunity_matrix empty — no contract to verify`);
    return findings;
  }

  const ledger = loadLedger();
  if (ledger.error === "missing") {
    findings.fail.push(`opportunities-ledger.jsonl missing — contract broken (write-first rule)`);
    return findings;
  }
  if (ledger.error) {
    findings.fail.push(`opportunities-ledger.jsonl read failed: ${ledger.error}`);
    return findings;
  }

  const ledgerByKey = new Map();
  for (const row of ledger.rows) {
    if (typeof row?.title_key === "string") ledgerByKey.set(row.title_key, row);
  }

  const lastCompleteRun = state?.last_complete_run
    ? new Date(state.last_complete_run).toISOString().slice(0, 10)
    : null;
  const { unledgered, stale } = checkLedgerConsistency(matrix, ledgerByKey, lastCompleteRun);

  if (unledgered.length > 0) {
    findings.fail.push(
      `${unledgered.length} of ${matrix.length} opportunities not in ledger: ${formatSliceList(unledgered, 3)}`
    );
  }
  if (stale.length > 0) {
    findings.fail.push(
      `${stale.length} of ${matrix.length} opportunities have stale ledger rows (last_seen < last_complete_run): ${formatSliceList(stale, 3)}`
    );
  }
  if (unledgered.length === 0 && stale.length === 0) {
    findings.pass.push(`all ${matrix.length} opportunities present and fresh in ledger`);
  }

  // /recall SQLite check is informational — synthesize doesn't own the DB
  // schema, only invokes rebuild-index.js. Surface as a hint.
  const sqlitePath = path.join(PROJECT_ROOT, ".research", "knowledge.sqlite");
  if (fs.existsSync(sqlitePath)) {
    findings.pass.push(`/recall SQLite index present`);
  } else {
    findings.warn.push(
      `.research/knowledge.sqlite absent — /recall index not built (run scripts/cas/rebuild-index.js)`
    );
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Dimension 8: Preflight (12F)
//
// scripts/cas/rebuild-index.js MUST exist and be syntactically valid (node
// --check). Phase 5 step 4 invokes it; missing/broken script breaks /recall.

function dim8Preflight() {
  const findings = { pass: [], fail: [], warn: [] };
  if (!fs.existsSync(REBUILD_INDEX_SCRIPT)) {
    findings.fail.push(`scripts/cas/rebuild-index.js missing — Phase 5 step 4 will fail`);
    return findings;
  }

  // node --check verifies the script parses — no execution side effects.
  // shell: true on Windows for npm-style dispatch consistency with the
  // skill-audit reference; here node is invoked directly so plain false is
  // fine on POSIX. Hardcoded args, cwd locked, timeout capped.
  try {
    execFileSync("node", ["--check", REBUILD_INDEX_SCRIPT], {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
      timeout: 15000,
      maxBuffer: 1024 * 1024,
      shell: false,
    });
    findings.pass.push(`rebuild-index.js exists and parses cleanly`);
  } catch (err) {
    findings.fail.push(`rebuild-index.js failed parse check: ${sanitizeError(err)}`);
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Manual block (decision 12C) — Evidence grounding sample.
//
// Printed after dimensions when running interactively. Selects up to 3
// themes by index and emits a recommended Explore-agent dispatch prompt.
// NOT counted toward MUST — judgment-only check.

function buildManualEvidenceBlock() {
  const synthJsonPath = path.join(SYNTHESIS_DIR, "synthesis.json");
  const { data, error } = safeReadJson(synthJsonPath);
  if (error) return null;
  const themes = Array.isArray(data?.themes) ? data.themes : [];
  if (themes.length === 0) return null;

  // Sample first / middle / last theme (or fewer if N<3).
  const indices = [];
  if (themes.length >= 1) indices.push(0);
  if (themes.length >= 3) indices.push(Math.floor(themes.length / 2));
  if (themes.length >= 2) indices.push(themes.length - 1);

  const sample = indices.map((i) => ({
    index: i,
    name: typeof themes[i]?.name === "string" ? themes[i].name : `(theme ${i})`,
    evidence_count: Array.isArray(themes[i]?.evidence) ? themes[i].evidence.length : 0,
  }));

  return {
    instruction: "MANUAL: Dispatch Explore agent for evidence-grounding spot-check on these themes",
    sample,
    suggested_prompt:
      "For each theme below, read the named source artifacts and verify the evidence " +
      "quotes/refs actually appear there. Report any mismatches as orphan-evidence findings.",
  };
}

// ---------------------------------------------------------------------------
// Main

const MUST_DIMENSIONS = new Set([
  "artifacts",
  "schema",
  "sections",
  "gaps",
  "orphans",
  "partial_recovery",
  "contract",
  "preflight",
]);

function findingsStatus(findings) {
  if (findings.fail.length > 0) return "FAIL";
  if (findings.warn.length > 0) return "WARN";
  return "PASS";
}

function buildSummary(statePath, dimensions, feedforward, manualBlock) {
  const summary = {
    skill: "synthesize",
    state_path: path.relative(PROJECT_ROOT, statePath),
    dimensions: {},
    overall: "PASS",
    must_failed: [],
    should_warned: [],
    feedforward_warnings: feedforward,
    manual_blocks: manualBlock ? [manualBlock] : [],
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

function printHumanStream(dimensions, summary, feedforward, manualBlock) {
  console.log(`synthesize Self-Audit`);
  console.log(`State: ${summary.state_path}`);
  if (feedforward.length > 0) {
    console.log("\n[Feedforward — recent retros]");
    for (const w of feedforward) console.log(`  ~ ${w}`);
  }
  console.log("---");
  for (const [name, findings] of Object.entries(dimensions)) {
    const status = summary.dimensions[name].status;
    console.log(`\n[Dim ${name}] ${status}`);
    for (const p of findings.pass) console.log(`  + ${p}`);
    for (const w of findings.warn) console.log(`  ~ ${w}`);
    for (const f of findings.fail) console.log(`  x ${f}`);
  }
  if (manualBlock) {
    console.log("\n[Manual — evidence grounding sample (decision 12C)]");
    console.log(`  ${manualBlock.instruction}`);
    for (const s of manualBlock.sample) {
      console.log(`  - theme[${s.index}] "${s.name}" (${s.evidence_count} evidence ref(s))`);
    }
    console.log(`  Suggested prompt: ${manualBlock.suggested_prompt}`);
  }
  console.log("\n---SUMMARY---");
  console.log(JSON.stringify(summary, null, 2));
  console.log("---END---");
}

function runAllDimensions(state) {
  return {
    artifacts: dim1Artifacts(),
    schema: dim2Schema(),
    sections: dim3Sections(state),
    gaps: dim4Gaps(),
    orphans: dim5Orphans(),
    partial_recovery: dim6PartialRecovery(state),
    contract: dim7Contract(state),
    preflight: dim8Preflight(),
  };
}

function main() {
  const args = parseArgs(process.argv);

  let state, statePath;
  try {
    ({ state, statePath } = loadState(args.state));
  } catch (err) {
    console.error(sanitizeError(err));
    process.exit(2);
  }

  const feedforward = runFeedforward();
  const dimensions = runAllDimensions(state);
  const manualBlock = buildManualEvidenceBlock();
  const summary = buildSummary(statePath, dimensions, feedforward, manualBlock);

  if (args.json) {
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
  } else {
    printHumanStream(dimensions, summary, feedforward, manualBlock);
  }
  process.exit(summary.overall === "FAIL" ? 1 : 0);
}

try {
  main();
} catch (err) {
  console.error(`Fatal: ${sanitizeError(err)}`);
  process.exit(2);
}
