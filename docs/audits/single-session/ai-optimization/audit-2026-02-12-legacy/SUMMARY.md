# AI Optimization Audit — Summary Report

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-13
**Status:** DRAFT
<!-- prettier-ignore-end -->

**Date:** 2026-02-13 **Total Findings:** 88 **Domains:** 7 (format, dead-doc,
dead-script, hook, skill, ai-instructions, parsing)

## Severity Distribution

| Severity | Count | Description |
| -------- | ----- | ----------- |
| S0       | 5     | Critical    |
| S1       | 24    | High        |
| S2       | 39    | Medium      |
| S3       | 20    | Low         |

## Findings by Domain

| Domain               | Count | S0  | S1  | S2  | S3  |
| -------------------- | ----- | --- | --- | --- | --- |
| Format (MD→JSONL)    | 14    | 0   | 4   | 6   | 4   |
| Dead Documents       | 15    | 1   | 3   | 7   | 4   |
| Dead Scripts         | 11    | 0   | 1   | 6   | 4   |
| Hook Efficiency      | 15    | 1   | 4   | 7   | 3   |
| Skill Overlap        | 15    | 0   | 5   | 8   | 2   |
| AI Instruction Bloat | 8     | 1   | 2   | 2   | 3   |
| Fragile Parsing      | 10    | 2   | 5   | 3   | 0   |

## S0 — Critical (5 findings)

### OPT-H002: pattern-check.js spawns subprocess every Write/Edit/MultiEdit (~100ms latency)

**Category:** Hook Efficiency | **Effort:** E1

pattern-check.js runs spawnSync to execute scripts/check-pattern-compliance.js
on EVERY Write/Edit/MultiEdit operation, adding 100ms latency. File has
pre-filters (only runs on .js/.ts/.sh files >100 lines) but subprocess spawn is
expensive. Non-blocking warning only.

- **File:** `.claude/hooks/pattern-check.js`
- **Current State:** Spawns subprocess via spawnSync with 30s timeout on every
  applicable write. Pre-filters on file extension and line count.
- **Recommendation:** Cache pattern checker state or use native regex validation
  for common patterns. Add session-level cache of recently-checked files. Skip
  re-validation on already-validated files this session. Consider moving to
  async hook if possible.
- **Impact:** speed

**Decision:** [x] Act now — DONE (commit f228219, inlined patterns)

---

### OPT-A009: CRITICAL: 57 separate AI Instructions sections = ~4,500+ unnecessary tokens per session

**Category:** AI Instruction Bloat | **Effort:** E0

COMPREHENSIVE FINDING: The project maintains 57 separate 'AI Instructions'
sections across documentation. At ~80 tokens per section average (320-1,200
chars / 4 chars per token), this represents ~4,500+ tokens loaded per session.
However, claudee.md (118 lines, ~30 tokens) is the only file that MUST be loaded
every session for AI context. The other 56 sections are redundantly included in
documentation that's selectively read. Token waste estimate: 90% of AI
Instructions are never referenced in a given session (only 1-2 docs are read per
session on average). This violates the project's own principle (claude.md line
10-13: 'Kept minimal (~120 lines) to reduce token waste').

- **File:** `All 57 files with AI Instructions sections`
- **Current State:** DOCUMENTATION_STANDARDS.md prescribes: 'Tier 1 = essential,
  Tier 5 = archive'. Tier 1-2 (high-priority) docs should have AI Instructions;
  Tier 3-4 (reference) should not. Current count: Tier 1-2 docs with
  instructions: ~15-20 (justified). Tier 3-4 docs with instructions: ~30-37
  (unjustified bloat).
- **Recommendation:** IMMEDIATE: Audit all 57 docs by tier. Keep AI Instructions
  ONLY in Tier 1-2 docs (ROADMAP.md, SESSION_CONTEXT.md,
  DOCUMENTATION_STANDARDS.md, claude.md, maybe 10-15 others). Remove from Tier
  3-4 docs entirely. Instead, add single 'See claude.md Section X for
  instructions' pointer. Create centralized 'Per-Document AI Instructions'
  section in claude.md that covers all document types and scenarios. Estimated
  savings: ~4,000 tokens per session (90% reduction in AI Instructions bloat).
- **Impact:** tokens|all

**Decision:** [x] Act now (modified) — DONE (Session #158). Removed AI
Instructions from 6 Tier 3-4 docs (CODE_PATTERNS, SECURITY_CHECKLIST,
SKILL_AGENT_POLICY, CANON_QUICK_REFERENCE, JSONL_SCHEMA_STANDARD,
scripts/README).

---

### OPT-P001: SESSION_CONTEXT.md Session Counter Regex in 5 hooks

**Category:** Fragile Parsing | **Effort:** E1

Multiple hooks parse **Current Session Count**: using regex /\*\*Current Session
Count\*\*:\s\*(\d+)/ to extract session numbers. This pattern appears in:
commit-tracker.js (line 130), compaction-handoff.js (line 165),
check-remote-session-context.js (line 63), pre-compaction-save.js (line 149),
and generate-pending-alerts.js (indirectly via check-session-gaps.js line 77).
If markdown formatting changes (spacing, capitalization, or bold marker),
session counter extraction fails silently, breaking compaction tracking.

- **File:** `/home/user/sonash-v0/.claude/hooks/commit-tracker.js`
- **Current State:** Hardcoded regex expecting exact markdown format: **Current
  Session Count**: N (with specific spacing)
- **Recommendation:** Extract to shared utility function with fallback parsing
  strategies (e.g., case-insensitive, flexible whitespace). Add validation to
  ensure extracted value is numeric.
- **Impact:** accuracy|tokens

**Decision:** [x] Act now — DONE (resilient regex: optional bold, flexible
spacing, case-insensitive)

---

### OPT-P002: SESSION_DECISIONS.md Decision Block Regex in auto-save-context.js

**Category:** Fragile Parsing | **Effort:** E1

auto-save-context.js (line 124) parses recent decisions using regex /^###
\[(\d{4}-\d{2}-\d{2})\] - (.+?)\n([\s\S]\*?)(?=^### \[|^## |$)/gm. This pattern
is brittle: requires exact date format (YYYY-MM-DD), assumes specific header
structure with dash separator, and expects newline immediately after header. Any
markdown reformatting (adding spaces, changing header level, altering date
format) breaks decision extraction, losing session context that survives
compaction.

- **File:** `/home/user/sonash-v0/.claude/hooks/auto-save-context.js`
- **Current State:** Regex expects: ### [YYYY-MM-DD] - Title\n followed by
  content. No flexibility for spacing or format variations.
- **Recommendation:** Use more flexible regex with optional whitespace:
  /^###\s+\[(\d{4}-\d{2}-\d{2})\]\s*-\s*(.+?)\n([\s\S]\*?)(?=^###|$)/gm. Add
  guard against empty date/title fields.
- **Impact:** accuracy|tokens

**Decision:** [x] Act now — DONE (flexible dash variants, spacing in decision
block regex)

---

### OPT-D001: SoNash_Technical_Ideation_Multi_AI 1.20.26.md - 4.1KB ideation document never linked

**Category:** Dead Documents | **Effort:** E0

Large ideation document (4118 lines) containing multi-AI technical proposals
that is never referenced by any script, hook, skill, or other documentation.
Listed as orphaned in DOCUMENTATION_INDEX.md.

- **File:**
  `/home/user/sonash-v0/docs/SoNash_Technical_Ideation_Multi_AI 1.20.26.md`
- **Current State:** 4,118-line document exists at
  docs/SoNash_Technical_Ideation_Multi_AI 1.20.26.md; marked as orphaned (↓0 ↑0
  references)
- **Recommendation:** Move to docs/archive/ or consolidate findings into
  EXPANSION_EVALUATION_TRACKER.md. The content appears to be exploratory
  AI-generated technical ideation that should either be integrated into active
  roadmaps or archived as historical reference.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit bf075e5)

---

## S1 — High (24 findings)

### OPT-F001: ROADMAP.md milestone tracking tables

**Category:** Format (MD→JSONL) | **Effort:** E2

ROADMAP.md contains 270 lines of markdown tables tracking milestones, status,
progress %, phases, and priorities. Large structure with frequent updates during
sprint work.

- **File:** `/home/user/sonash-v0/ROADMAP.md`
- **Current State:** Markdown tables: Milestones Overview (86-100), Progress
  tracking, status fields, metadata headers
- **Recommendation:** Extract milestone data to milestones.jsonl with schema:
  {id, name, status, progress, phase, priority, items, relatedDocs}. Keep
  ROADMAP.md as narrative + embedded reference. Add npm script to sync
  ROADMAP.md from milestones.jsonl.
- **Impact:** tokens|speed

**Decision:** [x] Defer — ROADMAP.md works as markdown. Gaps exist in completion
detection and archival automation; track separately as debt.

---

### OPT-F002: AUDIT_TRACKER.md audit log tables

**Category:** Format (MD→JSONL) | **Effort:** E2

AUDIT_TRACKER.md contains 96 table rows tracking audit completion dates, commits
covered, findings, and threshold reset status across 7 audit categories. Updated
after each audit cycle (Session #143 shows 258 findings).

- **File:** `/home/user/sonash-v0/docs/audits/AUDIT_TRACKER.md`
- **Current State:** Markdown tables: Current Thresholds (46-55), Single-Session
  Audit Log (80-138), Multi-AI Audit Log (150-159), Master Issue Aggregation
  (165-170)
- **Recommendation:** Extract to audits.jsonl with schema: {auditType, date,
  session, commitsCount, filesCount, findingsRaw, findingsUnique,
  findingsBySeverity, resetThreshold, relatedFile}. Create views by category and
  date for faster querying.
- **Impact:** tokens|speed|accuracy

**Decision:** [x] Defer — as debt item. Current format works; automation is
stable.

---

### OPT-F003: EXPANSION_EVALUATION_TRACKER.md decision log with 280 ideas

**Category:** Format (MD→JSONL) | **Effort:** E3

Tracks evaluation of ~280 expansion ideas across 21 modules (F1-F12, T1-T9) with
decision logs, placement metadata, milestone assignments, insertion points, and
relationships. Complex multi-session tracking document.

- **File:** `/home/user/sonash-v0/docs/EXPANSION_EVALUATION_TRACKER.md`
- **Current State:** Markdown with embedded decision logs, placement metadata
  (Placement, Insert After, Relationship fields) for ~85 items staged for
  ROADMAP. Quick Resume section summarizes status.
- **Recommendation:** Extract decisions to decisions.jsonl with schema:
  {moduleId, ideaNum, title, decision, rationale, milestone, insertAfter,
  relationship, stagedDate, decidedInSession, tags}. Keep
  EXPANSION_EVALUATION_TRACKER.md as UI summary with aggregates. AI processes
  decisions.jsonl directly.
- **Impact:** tokens|speed|accuracy

**Decision:** [x] Reject JSONL conversion — Archive doc instead. 100% complete
(280/280 ideas decided, 76 pushed to ROADMAP v3.9). Archive doc + remove
/expansion-evaluation skill.

---

### OPT-F004: AUDIT_TRACKER.md threshold matrix and version history

**Category:** Format (MD→JSONL) | **Effort:** E2

Contains 2 tables tracking threshold configuration (46 rows) and version history
(12 rows). Thresholds reset after each audit; version history appended
frequently.

- **File:** `/home/user/sonash-v0/docs/audits/AUDIT_TRACKER.md`
- **Current State:** Markdown tables: Single-Session Thresholds (lines 46-55),
  Multi-AI Thresholds (59-63), Version History (242-260)
- **Recommendation:** Extract to thresholds.jsonl and versions.jsonl. Thresholds
  schema: {category, lastAudit, commitsSince, filesSince, triggerAt,
  resetScript}. Allows automation of threshold checks via npm scripts. Version
  history is append-only log.
- **Impact:** speed|tokens

**Decision:** [x] Defer — Current format works, automation stable. Migrate if
check-triggers.js breaks.

---

### OPT-S010: sync-claude-settings.js - Unused Claude Code settings synchronization utility

**Category:** Dead Scripts | **Effort:** E1

Syncs Claude Code settings between local ~/.claude/ and repository .claude/ for
cross-platform portability. 508 lines with --export, --import, --diff flags.
REFERENCED IN DOCUMENTATION but never called from automation. Listed in
DEVELOPMENT.md table but not in package.json scripts. Users expected to run
manually.

- **File:** `/home/user/sonash-v0/scripts/sync-claude-settings.js`
- **Current State:** Fully functional settings sync tool with path containment
  validation (Review #224) and selective key exclusion. Documented in
  DEVELOPMENT.md but not in npm scripts.
- **Recommendation:** Add npm script entry 'npm run settings:sync' with sensible
  default (--diff or --import). Or remove from codebase if manual invocation via
  'node scripts/...' is sufficient. Currently confusing: documented but not in
  package.json scripts.
- **Impact:** accuracy

**Decision:** [x] Defer — manual utility, not dead

---

### OPT-H001: Write/Edit/MultiEdit share 8 redundant hooks (~530ms overhead)

**Category:** Hook Efficiency | **Effort:** E2

Write, Edit, and MultiEdit tools execute nearly identical hook chains with 8
shared hooks (pattern-check, component-size-check, firestore-write-block,
test-mocking-validator, app-check-validator, typescript-strict-check,
repository-pattern-check, agent-trigger-enforcer). Only difference: Write uses
check-write-requirements (test-first) vs Edit/MultiEdit use
check-edit-requirements (security-first). This causes ~530ms latency on every
file write operation.

- **File:** `.claude/settings.json`
- **Current State:** Write: 10 hooks, Edit: 9 hooks, MultiEdit: 9 hooks with 8
  duplicated
- **Recommendation:** Consolidate to single validation pipeline with tool-aware
  conditional logic. Create unified hook that checks file type once, then runs
  all applicable validators in sequence. Reuse file content across validators
  instead of re-reading.
- **Impact:** speed

**Decision:** [x] Defer — requires settings.json restructure

---

### OPT-H003: check-write-requirements vs check-edit-requirements duplication

**Category:** Hook Efficiency | **Effort:** E1

Two nearly identical hooks with different priority orders.
check-write-requirements (Write only) checks tests first, then security.
check-edit-requirements (Edit/MultiEdit) checks security first. Both perform
identical path validation and file classification but in different order. Adds
10ms overhead per tool call.

- **File:**
  `.claude/hooks/check-write-requirements.js, .claude/hooks/check-edit-requirements.js`
- **Current State:** Two separate 106-line scripts with ~95% identical code but
  different keyword priority order in lines 69-103
- **Recommendation:** Merge into single check-requirements.js hook that accepts
  tool parameter and applies correct priority. Use conditional branches for
  tool-specific behavior rather than duplicate files.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit f228219, unified requirements)

---

### OPT-H008: audit-s0s1-validator.js only triggers on audit files but runs full validation on Write

**Category:** Hook Efficiency | **Effort:** E3

audit-s0s1-validator.js (lines 216-218) only processes docs/audits/\*.jsonl
files but is registered on PostToolUse Write hook, meaning it runs on every file
write operation. Does JSON parsing of file argument and path matching checks
(~10-15ms wasted) on ~99% of writes that don't match audit file pattern.

- **File:** `.claude/hooks/audit-s0s1-validator.js`
- **Current State:** Registered globally on Write tool. Lines 216-218 check
  isAuditFile() pattern match. Non-blocking WARN mode (Phase 1).
- **Recommendation:** Create separate matcher condition in settings.json for
  audit files (similar to how Read, Bash, Task have matchers). Only register
  this hook when file path matches audit pattern. Or use very fast path-only
  check at top of hook before any other processing.
- **Impact:** speed

**Decision:** [x] Act now — DONE (commit f228219, fast-path audit)

---

### OPT-H009: Read hooks have no execution order guarantee - context tracking race condition potential

**Category:** Hook Efficiency | **Effort:** E2

large-context-warning, auto-save-context, and compaction-handoff run in
arbitrary order on every Read. They all touch .context-tracking-state.json. If
one fails/timeout, state could be corrupt or get reset by another hook.
Large-context-warning resets state if >30min old (line 98), which could wipe
data another hook just wrote.

- **File:**
  `.claude/hooks/large-context-warning.js, .claude/hooks/auto-save-context.js, .claude/hooks/compaction-handoff.js`
- **Current State:** Settings.json lists Read hooks in order:
  large-context-warning, auto-save-context, compaction-handoff. Each does atomic
  write to shared state file. large-context-warning unconditionally loads and
  potentially resets state (line 96-100).
- **Recommendation:** Establish clear execution order (orchestrate in single
  hook or specify in settings). Have one hook be state authority that handles
  reset logic. Others read-only or use state-utils shared module. Document
  dependency order.
- **Impact:** accuracy

**Decision:** [x] Defer — needs hook orchestration

---

### OPT-K001: Multiple audit skills with overlapping domain coverage

**Category:** Skill Overlap | **Effort:** E1

audit-code, audit-security, audit-performance, audit-refactoring,
audit-documentation, audit-process, and audit-engineering-productivity are
individual audits that are also orchestrated together via audit-comprehensive.
audit-enhancements is an enhancement-specific audit that partially overlaps
functionality.

- **File:** `.claude/skills/audit-*/SKILL.md`
- **Current State:** 7 domain-specific audit skills + 1 comprehensive
  orchestrator + 1 enhancement auditor = 9 total audit-related skills
- **Recommendation:** Clarify the relationship: are individual audits meant to
  be standalone or only called from comprehensive? Consider consolidating
  orchestration logic or creating a more explicit hierarchy to prevent confusion
  about when to use which.
- **Impact:** accuracy

**Decision:** [x] Reject — intentional hierarchy, orchestrator + domain audits
appropriately layered

---

### OPT-K003: Senior specialist skills vs audit-comprehensive coverage

**Category:** Skill Overlap | **Effort:** E1

6 senior-\* skills (architect, backend, devops, frontend, fullstack, qa) may
duplicate functionality already covered by audit-comprehensive and its 7 domain
audits.

- **File:** `.claude/skills/senior-*/SKILL.md`
- **Current State:** 6 senior specialist skills exist alongside audit-code,
  audit-performance, etc. Unclear how senior-\* roles relate to audit findings.
- **Recommendation:** Clarify: Are senior-\* skills meant for code
  review/consultation vs automated audits? If they're for architectural review,
  they should have distinct scope from audits. If they're redundant, consider
  consolidating review logic into audits.
- **Impact:** accuracy

**Decision:** [x] Reject — different intent: seniors build things, audits find
problems

---

### OPT-K007: Unclear relationship: audit-validation-wrapper vs audit-comprehensive

**Category:** Skill Overlap | **Effort:** E1

audit-validation-wrapper 'wraps' audit-comprehensive but also serves as a
standalone alternative. Uncertain if it should always run with comprehensive or
be independent.

- **File:** `.claude/skills/audit-validation-wrapper/SKILL.md`
- **Current State:** audit-validation-wrapper presented as both a wrapper and
  independent entry point. Recommended workflow in documentation is to run
  wrapper before comprehensive.
- **Recommendation:** Clarify: Is audit-validation-wrapper the authoritative
  entry point (call audit-comprehensive from it) or should they be independent?
  Current doc creates ambiguity about which to invoke.
- **Impact:** accuracy

**Decision:** [x] Act now — DONE (Session #158). Deleted expansion-evaluation
skill + archived tracker to docs/archive/

---

### OPT-K011: Audit skill explosion: 9 audit-related skills with inconsistent parameterization

**Category:** Skill Overlap | **Effort:** E2

audit-code, audit-security, audit-performance, audit-refactoring,
audit-documentation, audit-process, audit-engineering-productivity,
audit-comprehensive, audit-enhancements + audit-validation-wrapper and
audit-aggregator = 11 audit-related skills

- **File:** `.claude/skills/audit-*/SKILL.md`
- **Current State:** 11 skills devoted to auditing across different domains,
  dimensions (single/comprehensive/enhancements), and validation phases
- **Recommendation:** Evaluate consolidation: Could these be one 'audit' skill
  with domain parameters (e.g., /audit --domain code,security,performance)? Or
  are the individual skills appropriately specialized for standalone use?
  Current approach creates high cognitive load.
- **Impact:** accuracy

**Decision:** [x] Reject — current structure more maintainable than a monolith
skill

---

### OPT-K015: Deprecated or unclear purpose: artifacts-builder, markitdown, mcp-builder, expansion-evaluation, systematic-debugging

**Category:** Skill Overlap | **Effort:** E1

Five skills have unclear or potentially deprecated purposes: artifacts-builder
(build HTML artifacts), markitdown (convert markdown), mcp-builder (build MCP
servers), expansion-evaluation (evaluate expansions), systematic-debugging
(debug systematically).

- **File:**
  `.claude/skills/artifacts-builder/SKILL.md, markitdown/SKILL.md, mcp-builder/SKILL.md, expansion-evaluation/SKILL.md, systematic-debugging/SKILL.md`
- **Current State:** 5 specialized utility skills with niche use cases or
  potentially outdated purposes
- **Recommendation:** Audit usage: Are these actually used? If artifacts-builder
  is for creating Claude artifacts, verify it's still needed post-api-changes.
  If MCP-builder is for custom MCP servers, verify it's maintained. Mark
  deprecated if not actively used.
- **Impact:** accuracy

**Decision:** [x] Reject — none are deprecated, all serve specific purposes;
systematic-debugging is CLAUDE.md-required

---

### OPT-A001: 57 documents with duplicate/inconsistent AI Instructions sections

**Category:** AI Instruction Bloat | **Effort:** E2

Audit found 57 markdown files containing 'AI Instructions' sections. Many are
duplicated across docs with similar guidance (e.g., APPCHECK_SETUP.md,
RECAPTCHA_REMOVAL_GUIDE.md both have App Check-specific instructions that could
be consolidated). Each section ranges from ~100-800 chars (25-200 tokens). Total
estimated token waste: ~4,500+ tokens per session load.

- **File:**
  `docs/**/*.md, SESSION_CONTEXT.md, AUDIT_TRACKER.md, PLAN_MAP.md (and 54 others)`
- **Current State:** 57 separate AI Instructions sections scattered across
  documentation. Common patterns: 1) Process instructions (check this first, do
  X, then Y), 2) Scope instructions (this is for X only), 3) Validation
  instructions (verify before committing)
- **Recommendation:** Consolidate AI Instructions into 3-4 canonical sections in
  claude.md: (1) Universal Meta-Instructions (placement, format, scope), (2)
  Per-Document-Type Instructions (planning docs vs process docs vs setup
  guides), (3) Safety/Compliance Checks. Reference from docs using 'See
  claude.md Section X.Y' instead of duplicating.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (Session #158). Tier reclassification via
per-file overrides in doc-generator-config.json. Tier 1: 9→4, Tier 2: 62→7.

---

### OPT-A002: AI Instructions placement violates own DOCUMENTATION_STANDARDS

**Category:** AI Instruction Bloat | **Effort:** E1

DOCUMENTATION_STANDARDS.md (line 57-67) explicitly states: 'AI Instructions
section MUST be near the top (after title and metadata)' with rationale that
'LLMs read top-to-bottom; instructions at bottom are often missed'. However, at
least 8 sampled docs place AI Instructions at 90%+ through the document
(APPCHECK_SETUP.md at line 318/343, INCIDENT_RESPONSE.md at line 283/300),
making instructions invisible to most LLM attention spans.

- **File:**
  `docs/DOCUMENTATION_STANDARDS.md, docs/APPCHECK_SETUP.md, docs/INCIDENT_RESPONSE.md, docs/SONARCLOUD_CLEANUP_RUNBOOK.md (and others)`
- **Current State:** Self-contradictory standard: Document prescribes
  instruction placement near top, but enforcement is absent. Pre-commit hook
  check-docs-light.js exists but doesn't validate AI Instructions placement.
- **Recommendation:** (1) Add check to pre-commit hook: validate AI Instructions
  at line <50 for docs >100 lines. (2) Audit all 57 docs for placement
  violation. (3) Move misplaced instructions to line 20-30 (post-metadata).
- **Impact:** tokens|accuracy

**Decision:** [x] Defer — Do after A009/A001 sweep; fewer sections to reposition
once duplicates removed.

---

### OPT-P003: AUDIT_FINDINGS_BACKLOG.md markdown parsing in check-backlog-health.js

**Category:** Fragile Parsing | **Effort:** E2

check-backlog-health.js (lines 160, 179-191) parses backlog items using
split(/^### \[/gm) and multiple regex patterns for severity, status, and
CANON-ID extraction. The parser expects exact format: ### [Category] Item Name
with specific field formatting (**Severity**: S[0-3], **Status**:
PENDING|IN_PROGRESS|DONE|DEFERRED, **CANON-ID**: CANON-\d+). If fields are
reordered, spacing changes, or status values vary, parsing fails to identify
critical S0 items, creating blocker detection failures.

- **File:** `/home/user/sonash-v0/scripts/check-backlog-health.js`
- **Current State:** Uses split(/^### \[/gm) and
  section.match(/\*\*Severity\*\*:\s\*(S[0-3])/i) patterns. Relies on exact
  field names and format. Exit code 0 indicates health OK, but missing S0
  detection means blocker violations go undetected.
- **Recommendation:** Use multiline section parsing with flexible field
  detection. Support YAML-like format detection. Add fallback to unstructured
  search for severity keywords. Validate that all required fields exist before
  processing item.
- **Impact:** accuracy|speed

**Decision:** [x] Act now — DONE (resilient severity/status/CANON-ID regex,
optional bold)

---

### OPT-P004: Markdown table parsing in update-readme-status.js with pipe delimiter fragility

**Category:** Fragile Parsing | **Effort:** E2

update-readme-status.js (lines 156-171, 203) parses markdown tables from
ROADMAP.md using regex and split('|'). Line 203 uses split('|') on table rows
without escaping for pipe characters in cell content. Pattern expects exact
alignment (| header | ... |) but doesn't handle pipes in cell values. Line 156
regex /## 📊 Milestones Overview[\s\S]{0,5000}?\n\|[^\n]+\| requires specific
heading emoji; if changed, parsing fails. Table parsing is fragile to format
changes.

- **File:** `/home/user/sonash-v0/scripts/update-readme-status.js`
- **Current State:** Regex requires: ## 📊 Milestones Overview followed by
  pipe-delimited table. split('|') assumes pipes only as delimiters, not
  content. No escaping of pipes within cells.
- **Recommendation:** Detect table by structure (| + separator row) instead of
  emoji. Parse cells carefully: use regex match on table row including escaped
  pipes (\\|). Validate column count matches header. Consider using markdown
  parsing library instead of regex.
- **Impact:** accuracy|tokens

**Decision:** [x] Defer — E2 effort, needs markdown AST parser (DEBT-2835)

---

### OPT-P005: check-session-gaps.js relies on hardcoded Session Context markdown format

**Category:** Fragile Parsing | **Effort:** E1

check-session-gaps.js (line 59) extracts documented sessions using /\*\*Session
#(\d+) Summary\*\*/g and current counter using /\*\*Current Session
Count\*\*:\s\*(\d+)/ (line 77). The pattern is hardcoded to expect exact bold
formatting. If SESSION_CONTEXT.md switches to different header style (# Session
N Summary, or [Session N]), gap detection fails, missing undocumented sessions
and potentially allowing orphaned commits.

- **File:** `/home/user/sonash-v0/scripts/check-session-gaps.js`
- **Current State:** Hardcoded regex: /\*\*Session #(\d+) Summary\*\*/ expects
  exact bold format. Fails if heading level, format, or number syntax changes.
- **Recommendation:** Create markdown format abstraction. Support multiple
  formats: **Session #N Summary**, # Session N Summary, [Session N]. Use
  case-insensitive matching. Add logging for parsing failures.
- **Impact:** accuracy

**Decision:** [x] Act now — DONE (flexible session summary regex,
case-insensitive)

---

### OPT-P006: aggregate-audit-findings.js markdown parsing fragility in multiple functions

**Category:** Fragile Parsing | **Effort:** E2

aggregate-audit-findings.js has four fragile markdown parsing points: (1)
parseMarkdownBacklog (line 322) splits by '|' without handling escaped pipes,
assumes fixed column positions; (2) parseAuditFindingsBacklog (line 377) regex
/^### \[([^\]]+)\] / expects exact bracket format; (3) section.match() for
CANON-ID, Severity, Effort (lines 384-386) expect exact bold format and field
names. If backlog markdown structure changes—field reordering, different ID
format, heading changes—parsing silently skips items or extracts wrong data.

- **File:** `/home/user/sonash-v0/scripts/aggregate-audit-findings.js`
- **Current State:** Uses hardcoded regex patterns for: category headers (###
  [Cat]), table columns (split by |), field extraction (**CANON-ID**:
  CANON-\d+). Multiple single-point-of-failure patterns with no fallback.
- **Recommendation:** Implement markdown AST parsing or use remark/unified.
  Support format variants: ### [Cat] or ### Cat or # Cat/Item. For tables, parse
  cell-aware (handle escaped pipes). Add schema validation for required fields
  per item type.
- **Impact:** accuracy|tokens

**Decision:** [x] Defer — E2 effort, needs markdown AST parser (DEBT-2836)

---

### OPT-P007: generate-pending-alerts.js fragile DEFERRED item extraction

**Category:** Fragile Parsing | **Effort:** E1

generate-pending-alerts.js (lines 45-86) parses AI_REVIEW_LEARNINGS_LOG.md for
DEFERRED items using multiple regexes: /\*\*DEFERRED \(Review #(\d+)\)\*\*/
(line 45), /\*\*DEFERRED \((\d+)\):\*\*/ (line 67-68). The patterns expect exact
formatting with specific punctuation placement (colon inside or outside
asterisks). If deferred items are reformatted, patterns fail, causing DEFERRED
alerts to be missed entirely—losing visibility of deferred work.

- **File:** `/home/user/sonash-v0/scripts/generate-pending-alerts.js`
- **Current State:** Two separate regex patterns for DEFERRED detection: one
  expecting (Review #N) and another expecting (N): with colon position
  mattering. No unified pattern or fallback.
- **Recommendation:** Unify DEFERRED detection with flexible regex:
  /\*\*DEFERRED\s*\(\s*(?:Review\s*#)?(\d+)\s*\):\*\*/i. Test both colon-inside
  and colon-outside variants. Add logging for detected vs missed items.
- **Impact:** accuracy

**Decision:** [x] Act now — DONE (flexible bold, spacing, colon placement in
DEFERRED regex)

---

### OPT-D002: HOOKIFY_STRATEGY.md - 1.1KB implementation plan unused

**Category:** Dead Documents | **Effort:** E0

Hookify Strategy & Implementation Plan (1059 lines) documents a hooks
implementation strategy that is never referenced by any active documentation,
scripts, or hooks themselves.

- **File:** `/home/user/sonash-v0/docs/HOOKIFY_STRATEGY.md`
- **Current State:** 1,059-line document at docs/HOOKIFY_STRATEGY.md; marked
  orphaned (↓0 ↑0)
- **Recommendation:** Review content and either: (1) integrate strategy into
  .claude/HOOKS.md, (2) create references from hook files, or (3) move to
  archive if strategy was superseded. Check if hookification is still planned or
  completed.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit bf075e5, archived)

---

### OPT-D010: FIX_TEMPLATES.md - 0 outbound refs for Qodo PR fixes

**Category:** Dead Documents | **Effort:** E0

Fix Templates for Qodo PR Review Findings (docs/agent_docs/FIX_TEMPLATES.md)
provides copy-paste templates but is never referenced by code reviewer agents,
PR review skills, or documentation.

- **File:** `/home/user/sonash-v0/docs/agent_docs/FIX_TEMPLATES.md`
- **Current State:** Agent docs file at docs/agent_docs/FIX_TEMPLATES.md; ↓0 ↑0
- **Recommendation:** Link from code-reviewer skill, CODE_PATTERNS.md, and
  review process documentation. If templates are intended for use, ensure
  they're discoverable from agent workflows that need them.
- **Impact:** accuracy

**Decision:** [x] Act now — DONE (commit bf075e5, linked)

---

### OPT-D015: Technical debt view files - generated views without integration

**Category:** Dead Documents | **Effort:** E1

Three technical debt view files (by-category, by-severity, by-status) plus
views/unplaced-items are generated by TDMS but not integrated into monitoring
dashboards or alerting systems.

- **File:** `/home/user/sonash-v0/docs/technical-debt/views/`
- **Current State:** 4 view files generated, updated 2026-02-13, marked ↓0-1
  ↑0-2 in DOCUMENTATION_INDEX; appear to be output-only files
- **Recommendation:** Integrate into alerts system or create monitoring
  dashboard that references these views. Update
  TECHNICAL_DEBT_MANAGEMENT_SYSTEM_PLAN.md to document how views feed into
  workflows. Consider if view files should be excluded from docs and
  generated-only.
- **Impact:** speed

**Decision:** [x] Defer — TDMS views still generated

---

## S2 — Medium (39 findings)

### OPT-F005: DOCUMENT_DEPENDENCIES.md sync status tracking

**Category:** Format (MD→JSONL) | **Effort:** E2

Tracks 43 rows of template-instance relationships, sync status, and last-synced
dates. Manual sync protocol requires regex parsing to detect drift (placeholder
detection patterns).

- **File:** `/home/user/sonash-v0/docs/DOCUMENT_DEPENDENCIES.md`
- **Current State:** Markdown tables: Template→Instance Relationships (62-95),
  Sync Protocols description, Automated Validation script references, Manual
  Validation section (192-205)
- **Recommendation:** Extract to doc-sync-status.jsonl with schema:
  {templatePath, instancePath, lastSynced, syncStatus, driftDetected,
  issuesFound}. Enhance scripts/check-document-sync.js to read/write this file.
  Enables automated validation with clear history.
- **Impact:** tokens|speed|accuracy

**Decision:** [x] Defer — as debt item. Low frequency, working automation.

---

### OPT-F006: SESSION_CONTEXT.md quick status table

**Category:** Format (MD→JSONL) | **Effort:** E1

Contains 8-row status tracking table (lines 118-128) for track status
(Operational Visibility, Track A/B/C, GRAND PLAN, milestones). Updated
frequently at session start/end.

- **File:** `/home/user/sonash-v0/SESSION_CONTEXT.md`
- **Current State:** Markdown table: Quick Status (118-128) with Item, Status,
  Progress columns. 8 rows updated every session.
- **Recommendation:** Extract to session-status.jsonl with schema: {item,
  status, progress, percent, lastUpdated, session}. Keep SESSION_CONTEXT.md <300
  lines (current instruction). Allow automated session startup to read/write
  status atomically.
- **Impact:** speed|tokens

**Decision:** [x] Reject — 8-row table is ~50 tokens. Human-readability
outweighs cost. No script needs structured access.

---

### OPT-F007: DOCUMENT_DEPENDENCIES.md cross-document update triggers matrix

**Category:** Format (MD→JSONL) | **Effort:** E2

48-row trigger matrix (lines 309-342) mapping document changes to dependent
documents. Used to coordinate cross-document sync but stored as markdown table.

- **File:** `/home/user/sonash-v0/docs/DOCUMENT_DEPENDENCIES.md`
- **Current State:** Markdown table: 48 rows with When/Check
  These/Reason/Enforced columns. Manual lookup during document editing.
- **Recommendation:** Extract to doc-triggers.jsonl with schema: {sourceDoc,
  triggerCondition, targetDocs[], reason, enforced, blockingLevel}. Integrate
  into pre-commit hook to auto-warn on dependent document changes (currently
  'Manual' enforcement in 35/48 rows).
- **Impact:** speed|accuracy

**Decision:** [x] Reject JSONL conversion — Instead: (1) generate markdown table
FROM doc-dependencies.json, (2) run full repo dependency audit to find missing
entries in both files. Added as debt for this session.

---

### OPT-F008: ROADMAP.md detailed milestone specifications embedded

**Category:** Format (MD→JSONL) | **Effort:** E2

ROADMAP.md contains narrative milestone details mixed with data (status,
progress %, priority, items count). Detailed specifications for M1.5-M10
hardcoded inline with dependency references.

- **File:** `/home/user/sonash-v0/ROADMAP.md`
- **Current State:** Markdown text: Milestone sections (100+) with embedded
  metadata, task lists, dependencies marked inline. Hard to diff, refactor, or
  cross-reference programmatically.
- **Recommendation:** Create milestones-detail.jsonl with schema: {milestoneId,
  phase, priority, description, itemCount, dependencies[], risks[],
  successCriteria[], dependencies}. ROADMAP.md becomes curated narrative
  referencing milestones.jsonl data via embedded tables regenerated from data.
- **Impact:** tokens|speed|accuracy

**Decision:** [x] Reject — Duplicate of F001 scope. ROADMAP works as combined
narrative+data.

---

### OPT-F009: PR_WORKFLOW_CHECKLIST.md version history table

**Category:** Format (MD→JSONL) | **Effort:** E1

Version history table (lines 443-447) tracking 3 versions with dates and
changes. Append-only log stored as markdown.

- **File:** `/home/user/sonash-v0/docs/PR_WORKFLOW_CHECKLIST.md`
- **Current State:** Markdown table: Version, Date, Changes, Author. 3 versions
  documented (2.0, 1.1, 1.0).
- **Recommendation:** Extract to doc-versions.jsonl (append-only) with schema:
  {doc, version, date, changes, author}. All documentation version history
  consolidates to single source. Enables automated change tracking per document.
- **Impact:** tokens

**Decision:** [x] Reject — 3-row table (~30 tokens). Git provides real version
history.

---

### OPT-F010: EXPANSION_EVALUATION_TRACKER.md command reference table

**Category:** Format (MD→JSONL) | **Effort:** E2

Command reference table (lines 81-99) documenting 11 commands with descriptions.
Static reference data embedded as markdown.

- **File:** `/home/user/sonash-v0/docs/EXPANSION_EVALUATION_TRACKER.md`
- **Current State:** Markdown table: Command, Description, Parameters. Documents
  /expansion-evaluation sub-commands and decision actions.
- **Recommendation:** Extract to
  .claude/skills/expansion-evaluation/commands.jsonl with schema: {command,
  subcommands[], parameters, description, example}. Centralize skill command
  documentation to single source; .claude/COMMAND_REFERENCE.md references it.
- **Impact:** tokens

**Decision:** [x] Reject — Moot. Parent doc and /expansion-evaluation skill
being archived per F003.

---

### OPT-S001: ai-review.js - Unused AI review prompt applicator

**Category:** Dead Scripts | **Effort:** E0

Script applies specialized AI review prompts to different artifact types.
Despite having security features (sensitive file detection), it is never invoked
from package.json, workflows, hooks, skills, or documentation. Only historical
archive references exist in REVIEWS_42-60.md.

- **File:** `/home/user/sonash-v0/scripts/ai-review.js`
- **Current State:** 407 lines of functional code with --type and --staged CLI
  flags defined but unreachable
- **Recommendation:** Either add npm script entry or remove. If planned for
  future AI-driven reviews, add to DEVELOPMENT.md with clear invocation pattern.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit 79fddc2, f472ba1)

---

### OPT-S003: create-canonical-findings.js - Unused canonical findings generator

**Category:** Dead Scripts | **Effort:** E1

Script converts net-new findings from docs/aggregation/net-new-findings.jsonl
into canonical format with ROADMAP placement mapping. References deprecated
ROADMAP_INTEGRATION logic. 340 lines with clear purpose but never executed.

- **File:** `/home/user/sonash-v0/scripts/create-canonical-findings.js`
- **Current State:** Complete implementation that reads net-new aggregated
  findings and writes to MASTER_FINDINGS.jsonl
- **Recommendation:** Add to package.json scripts if part of audit pipeline
  (e.g., 'npm run canon:create'), or consolidate into
  aggregate-audit-findings.js workflow. Currently blocks on file that depends on
  aggregate-audit-findings.js output.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit 79fddc2)

---

### OPT-S004: generate-pending-alerts.js - Unused session-start alert generator

**Category:** Dead Scripts | **Effort:** E0

Script scans AI_REVIEW_LEARNINGS_LOG.md and AUDIT_FINDINGS_BACKLOG.md for
DEFERRED/S1+ items to write pending-alerts.json for Claude session start.
Functional but never called. Depends on legacy backlog files (now archived to
MASTER_DEBT.jsonl).

- **File:** `/home/user/sonash-v0/scripts/generate-pending-alerts.js`
- **Current State:** Scans 3 sources (learnings log, backlog, hook warnings) to
  generate .claude/pending-alerts.json, references archived backlog
- **Recommendation:** Either add to session-start hook or remove. If needed for
  alerts, update file paths to use MASTER_DEBT.jsonl instead of archived
  AUDIT_FINDINGS_BACKLOG.md.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (Session #158). Verified dead (no callers),
deleted generate-pending-alerts.js, removed references from hooks + run-alerts.

---

### OPT-S006: migrate-existing-findings.js - Unused legacy findings migration tool

**Category:** Dead Scripts | **Effort:** E1

One-time migration script to move ROADMAP findings to canonical location
(docs/audits/canonical/MASTER_FINDINGS.jsonl). References obsolete file
structures (REFACTOR_BACKLOG.md). Clear one-off purpose but permanently left in
codebase.

- **File:** `/home/user/sonash-v0/scripts/migrate-existing-findings.js`
- **Current State:** ~100+ lines of migration logic for Session #116
  canonicalization project, no ongoing use case
- **Recommendation:** Move to docs/archive/scripts/ or remove entirely. One-time
  migration utilities should be archived after successful migration to prevent
  accidental re-runs.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit 79fddc2)

---

### OPT-S008: regenerate-findings-index.js - Unused canonical findings index rebuilder

**Category:** Dead Scripts | **Effort:** E1

Reads MASTER_FINDINGS.jsonl and regenerates MASTER_FINDINGS_INDEX.md with
severity/category grouping. ~80 lines with clear, single-purpose functionality.
Related to Session #116 canonicalization but never invoked in workflows.

- **File:** `/home/user/sonash-v0/scripts/regenerate-findings-index.js`
- **Current State:** Functional index generator that groups findings by severity
  and category with ROADMAP placement metadata
- **Recommendation:** Add to npm scripts (e.g., 'npm run canon:index') or
  consolidate into debt management workflow. If MASTER_FINDINGS.jsonl is
  auto-updated, add regenerate-findings-index to post-intake hooks.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit 79fddc2)

---

### OPT-S011: update-legacy-lines.js - Unused legacy findings line number updater

**Category:** Dead Scripts | **Effort:** E1

One-time script to backfill line numbers for legacy findings (DEDUP-XXXX,
EFF-XXX, PERF-XXX, M-series IDs). Hardcoded mapping of 50+ finding IDs to file
locations. Session #116 artifact, 100+ lines.

- **File:** `/home/user/sonash-v0/scripts/update-legacy-lines.js`
- **Current State:** Complete hardcoded mapping table for legacy finding line
  numbers, reads/writes MASTER_FINDINGS.jsonl
- **Recommendation:** Move to docs/archive/scripts/ or remove. One-time
  canonicalization utility with no ongoing use. If legacy findings are still
  updated, consolidate logic into update script.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit 79fddc2)

---

### OPT-H004: agent-trigger-enforcer.js runs on every code file edit with double-write overhead

**Category:** Hook Efficiency | **Effort:** E2

Runs on every Write/Edit/MultiEdit (100ms latency) to track file modifications
and suggest agents. Loads config from disk every invocation. Uses double-write
pattern: writes .claude/hooks/.agent-trigger-state.json AND potentially
.claude/state/pending-reviews.json. Only matters for code files matching
AGENT_TRIGGERS patterns, but runs unconditionally then does pattern matching.

- **File:** `.claude/hooks/agent-trigger-enforcer.js`
- **Current State:** Lines 189-321: reads state, increments counters, writes
  state file, then conditionally loads and writes review queue if code-reviewer
  agent applies. No early exit check for applicable agents before file I/O.
- **Recommendation:** Add early check for applicable agent patterns BEFORE
  reading state file. Cache AGENT_TRIGGERS config at hook initialization. Batch
  state writes: consolidate review queue write into single atomic operation
  instead of separate writeJson call.
- **Impact:** speed

**Decision:** [x] Defer — needs settings.json matcher support

---

### OPT-H005: Three Read hooks contend for .context-tracking-state.json state file

**Category:** Hook Efficiency | **Effort:** E2

large-context-warning.js, auto-save-context.js, and compaction-handoff.js all
read/write .claude/hooks/.context-tracking-state.json on every Read operation.
Multiple hooks doing atomic writes (temp file + rename) creates contention and
potential race conditions. State resets if >30 minutes old
(large-context-warning line 98).

- **File:**
  `.claude/hooks/large-context-warning.js, .claude/hooks/auto-save-context.js, .claude/hooks/compaction-handoff.js`
- **Current State:** Each hook independently reads context-tracking-state.json,
  modifies it, and does atomic write. large-context-warning resets if stale
  (line 98). No coordination between hooks.
- **Recommendation:** Consolidate context tracking into single hook that: 1)
  reads state once, 2) updates all needed metrics, 3) writes once. Or create
  state-utils-based shared handler. Have large-context-warning handle reset
  logic for all three hooks.
- **Impact:** speed

**Decision:** [x] Defer — race condition low-probability

---

### OPT-H006: State file sprawl across .claude/hooks/ and .claude/state/

**Category:** Hook Efficiency | **Effort:** E1

10 separate state files created by hooks: 6 in .claude/hooks/ (.session-state,
.context-tracking-state, .auto-save-state, .handoff-state,
.commit-tracker-state, .agent-trigger-state) and 4 in .claude/state/
(handoff.json, pending-reviews.json, commit-log.jsonl, agent-invocations.jsonl).
Some files only read/written by single hook (redundant). No schema
documentation.

- **File:** `.claude/state/, .claude/hooks/`
- **Current State:** State files: .claude/hooks/.session-state.json
  (session-start, commit-tracker, compaction-handoff),
  .claude/hooks/.context-tracking-state.json (3 hooks),
  .claude/hooks/.auto-save-state.json (1 hook),
  .claude/hooks/.commit-tracker-state.json (1 hook),
  .claude/hooks/.handoff-state.json (1 hook), .claude/state/handoff.json (1
  hook), .claude/state/pending-reviews.json (1 hook),
  .claude/state/commit-log.jsonl (1 hook)
- **Recommendation:** Consolidate single-use state files. Establish clear naming
  convention: .claude/state/ for session-surviving data (compaction-safe),
  .claude/hooks/ for ephemeral session state. Create state-schema.md documenting
  all state files, their consumers, and retention policy.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit f228219, fast-path audit)

---

### OPT-H007: validation hooks could share file read to reduce I/O

**Category:** Hook Efficiency | **Effort:** E2

Multiple validation hooks on Write/Edit/MultiEdit independently read file
content: component-size-check, firestore-write-block, test-mocking-validator,
app-check-validator, typescript-strict-check, repository-pattern-check all do
fs.readFileSync on same file. Pattern-check also reads file. No caching between
hooks.

- **File:**
  `.claude/hooks/component-size-check.js, firestore-write-block.js, test-mocking-validator.js, app-check-validator.js, typescript-strict-check.js, repository-pattern-check.js`
- **Current State:** Each hook independently: 1) checks path format, 2) reads
  file content from disk, 3) validates against patterns. Example:
  typescript-strict-check reads file at line 108, repository-pattern-check at
  line 127, firestore-write-block at line 118.
- **Recommendation:** Implement hook file cache: pass file content through hook
  environment or temp file. Or create composite validator hook that reads file
  once and runs all applicable validators. At minimum, share path validation
  results.
- **Impact:** speed

**Decision:** [x] Defer — marginal I/O savings

---

### OPT-H012: session-start.js does heavy work at SessionStart (builds, installs, checks) - could be async

**Category:** Hook Efficiency | **Effort:** E2

session-start.js (561 lines) runs synchronously at SessionStart and does heavy
I/O: npm install, npm ci, build commands (up to 120s timeout each), pattern
checks, consolidation checks, TDMS metrics. Blocks session start if any step
hangs. SessionStart is synchronous hook context.

- **File:** `.claude/hooks/session-start.js`
- **Current State:** Uses execSync for all command execution (lines 316, 339,
  352, 365, 372, 390, 481). Timeouts specified per command (60-120s) but entire
  sequence blocks session start. One timeout blocks whole session.
- **Recommendation:** Split session-start into critical-path (check secrets,
  load alerts) and background tasks (npm install, build, pattern check).
  Document which steps are blocking vs can be skipped if time-constrained.
  Consider if builds should happen at all during hook vs on-demand.
- **Impact:** speed

**Decision:** [x] Defer — SessionStart is not latency-sensitive

---

### OPT-H013: Auto-save-context hook reads 4 files per Read operation to find recent decisions

**Category:** Hook Efficiency | **Effort:** E1

auto-save-context.js reads SESSION_DECISIONS.md and processes it with regex on
every Read operation to extract recent decisions (line 119-138). File could be
large. Regex does full content scan. Only saves if thresholds exceeded (~15min
interval), but reads every time.

- **File:** `.claude/hooks/auto-save-context.js`
- **Current State:** Lines 119-138: opens SESSION_DECISIONS.md, uses regex to
  match all decision blocks, filters for last 3. Does full file scan on every
  Read hook invocation.
- **Recommendation:** Cache recent decisions with timestamp. Only re-read
  SESSION_DECISIONS.md if modification time changed. Store cache in
  .auto-save-state.json. Reduces I/O from every Read to periodic
  (file-change-based).
- **Impact:** speed

**Decision:** [x] Defer — auto-save reads are fast

---

### OPT-H015: SessionStart hook chain is sequential with no parallelization

**Category:** Hook Efficiency | **Effort:** E2

session-start.js runs npm install, npm ci, builds, and checks sequentially
(lines 312-410). Each command waits for previous. Node installations could run
in parallel. Build after install requires wait, but pattern check and
consolidation check could run in parallel.

- **File:** `.claude/hooks/session-start.js`
- **Current State:** Lines 314-327 (root npm install), lines 333-361 (functions
  npm install + build), lines 365 (test build), lines 372 (pattern check), lines
  390 (consolidation). Each execSync blocks until completion.
- **Recommendation:** Use Promise.all() for parallelizable steps: npm install
  root + functions can run in parallel. Pattern check + consolidation check can
  run parallel. Build must wait for install. Requires async/await refactor but
  could cut session startup time by 40-50%.
- **Impact:** speed

**Decision:** [x] Defer — sequential is simpler

---

### OPT-K002: Skill overlap: docs-sync vs docs-update vs doc-optimizer

**Category:** Skill Overlap | **Effort:** E1

Three skills appear to address documentation updates/synchronization. Without
reading full content (files are empty/minimal in search), unclear if there's
genuine overlap or specialization.

- **File:**
  `.claude/skills/docs-sync/SKILL.md, docs-update/SKILL.md, doc-optimizer/SKILL.md`
- **Current State:** Three separate skills with similar-sounding names and
  likely overlapping purposes
- **Recommendation:** Verify the specialization of each: if docs-sync is for
  keeping docs in sync, docs-update is for content changes, and doc-optimizer is
  for quality, that's clear. If not, consolidate.
- **Impact:** accuracy

**Decision:** [x] Reject — appropriately specialized: validation → maintenance →
enhancement layers

---

### OPT-K004: Empty or minimal SKILL.md descriptions

**Category:** Skill Overlap | **Effort:** E0

Many skills have description fields with empty or placeholder values:
developer-growth-analysis, excel-analysis, find-skills, frontend-design, etc.

- **File:** `.claude/skills/[multiple]/SKILL.md`
- **Current State:** At least 15+ skills have missing or empty descriptions in
  their SKILL.md frontmatter
- **Recommendation:** Complete all description fields. Even a one-sentence
  summary helps users understand when to use each skill. This is a quick fix
  with high clarity benefit.
- **Impact:** accuracy

**Decision:** [x] Act now — DONE (Session #157, commit 333d3e86). Populated all
empty skill description fields.

---

### OPT-K005: Skill overlap: debt tracking skills (add-deferred-debt, add-manual-debt, verify-technical-debt, sync-sonarcloud-debt)

**Category:** Skill Overlap | **Effort:** E1

Four skills handle technical debt in different ways. add-deferred-debt and
add-manual-debt both add debt but from different sources. verify-technical-debt
verifies. sync-sonarcloud-debt imports from SonarCloud.

- **File:**
  `.claude/skills/add-deferred-debt/SKILL.md, add-manual-debt/SKILL.md, verify-technical-debt/SKILL.md, sync-sonarcloud-debt/SKILL.md`
- **Current State:** 4 separate skills managing one system (MASTER_DEBT.jsonl)
- **Recommendation:** These may be appropriately specialized by source (deferred
  from PR, manual discovery, SonarCloud import, verification workflow). Verify
  each has distinct trigger criteria. If overlapping, consolidate intake logic.
- **Impact:** accuracy

**Decision:** [x] Act now — DONE (Session #157, commit 333d3e86). Merged
add-deferred-debt + add-manual-debt into /add-debt, deleted
sync-sonarcloud-debt.

---

### OPT-K006: Skill overlap: PR and review skills (pr-review, pr-retro, code-reviewer, requesting-code-review)

**Category:** Skill Overlap | **Effort:** E1

Four skills handle pull requests and code review. pr-review is a comprehensive
review skill. pr-retro does retrospective analysis. code-reviewer is a general
code review tool. requesting-code-review initiates code review.

- **File:**
  `.claude/skills/pr-review/SKILL.md, pr-retro/SKILL.md, code-reviewer/SKILL.md, requesting-code-review/SKILL.md`
- **Current State:** 4 PR/review-related skills with overlapping names and
  likely overlapping functionality
- **Recommendation:** Clarify workflow: Does requesting-code-review trigger
  pr-review? Is pr-retro a post-PR analysis? Is code-reviewer the general tool
  used by pr-review? Map the relationships clearly.
- **Impact:** accuracy

**Decision:** [x] Act now — DONE (Session #157, commit 333d3e86). Clarified
separation in descriptions; merged requesting-code-review into code-reviewer.

---

### OPT-K009: Potential deprecation: skill-creator, skill-related skills in favor of ai-native workflow

**Category:** Skill Overlap | **Effort:** E1

skill-creator and find-skills manage skills as artifacts. But skills may be
better managed through evolving the codebase or agent instructions rather than
as files.

- **File:** `.claude/skills/skill-creator/SKILL.md, find-skills/SKILL.md`
- **Current State:** 2 skills devoted to creating and finding skills suggest
  skill-based architecture is manual and ad-hoc
- **Recommendation:** Evaluate whether skill-creator and find-skills can be
  automated or replaced by better skill discovery mechanisms. If skill
  management is becoming a bottleneck, consider refactoring.
- **Impact:** speed

**Decision:** [x] Reject — complementary ecosystem roles (create vs discover),
not overlapping

---

### OPT-K012: Skill naming inconsistency: enhancement vs audit-enhancements, process vs audit-process

**Category:** Skill Overlap | **Effort:** E1

Most audits are prefixed 'audit-' (audit-code, audit-security) but
audit-enhancements uses 'enhancement' alone. audit-process is standalone but
part of audit-comprehensive.

- **File:** `.claude/skills/audit-enhancements/SKILL.md, audit-process/SKILL.md`
- **Current State:** Inconsistent naming convention for audit-related skills
- **Recommendation:** Standardize: Either all audit skills are audit-\*
  (audit-enhancements, audit-process are correct) or domain names are standalone
  (code, security, enhancements are correct). Pick one pattern.
- **Impact:** accuracy

**Decision:** [x] Reject — naming is already consistent (all use audit-\*
prefix)

---

### OPT-K013: Marketing-focused skills in technical codebase (content-research-writer, market-research-reports, ux-researcher-designer)

**Category:** Skill Overlap | **Effort:** E0

Three skills are marketing/content/design focused and may be out of scope for a
technical codebase audit toolkit.

- **File:**
  `.claude/skills/content-research-writer/SKILL.md, market-research-reports/SKILL.md, ux-researcher-designer/SKILL.md`
- **Current State:** 3 content/marketing skills mixed with 54 technical skills
  in the skill portfolio
- **Recommendation:** Verify these belong in the codebase. If the project is
  web-based with UX concerns, keep them. If purely backend/technical, consider
  moving to separate skill repository or marking as optional.
- **Impact:** accuracy

**Decision:** [x] Reject — legitimate project needs (SoNash is a web app with UX
concerns), no overlap between them

---

### OPT-K014: Undefined skill descriptions create discovery problem (50% of skills missing meaningful descriptions)

**Category:** Skill Overlap | **Effort:** E1

At least 25+ skills have empty description fields, preventing skill discovery
via /find-skills or skill index searches.

- **File:** `.claude/skills/*/SKILL.md`
- **Current State:** Description field is empty for: developer-growth-analysis,
  excel-analysis, expand-evaluation, find-skills, frontend-design, gh-fix-ci,
  market-research-reports, markitdown, mcp-builder, multi-ai-audit,
  pre-commit-fixer, quick-fix, requesting-code-review, save-context,
  senior-architect, senior-backend, senior-devops, senior-frontend,
  senior-fullstack, senior-qa, skill-creator, sonarcloud, sonarcloud-sprint,
  sync-sonarcloud-debt, systematic-debugging, webapp-testing, and more.
- **Recommendation:** Populate all descriptions with 1-2 sentence summaries.
  This is foundational metadata for a 57-skill portfolio.
- **Impact:** accuracy

**Decision:** [x] Act now — DONE (Session #157, merged with K004). All empty
skill descriptions populated.

---

### OPT-A003: Redundant App Check instructions across 3 documents

**Category:** AI Instruction Bloat | **Effort:** E2

App Check setup guidance appears in 3 separate files: (1) APPCHECK_SETUP.md
(tier 3 setup guide), (2) RECAPTCHA_REMOVAL_GUIDE.md (tier 3 procedure), (3)
claude.md Section 2 (security rule about App Check Required). Each has
overlapping instructions: check env var → verify config → test deployment.
Estimated 3-5 tokens wasted per session per doc.

- **File:** `docs/APPCHECK_SETUP.md, docs/RECAPTCHA_REMOVAL_GUIDE.md, claude.md`
- **Current State:** Three sources of truth: (1) APPCHECK_SETUP.md AI
  Instructions say 'First check
  NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY' (2)
  RECAPTCHA_REMOVAL_GUIDE.md AI Instructions say 'For fresh setup: Use Monitor
  mode first' (3) claude.md Section 2 states App Check as mandatory security
  rule
- **Recommendation:** Keep only one authoritative guide (APPCHECK_SETUP.md).
  Remove App Check instructions from RECAPTCHA_REMOVAL_GUIDE.md and
  cross-reference. Simplify claude.md Section 2 security rule to: 'App Check
  Required - see APPCHECK_SETUP.md for troubleshooting' (reduce from current
  advisory to single pointer).
- **Impact:** tokens

**Decision:** [x] Defer — A009/A001 sweep will remove Tier 3 AI Instructions
from these docs implicitly.

---

### OPT-A004: Outdated IMS references in SESSION_HISTORY.md and AI_REVIEW_LEARNINGS_LOG.md

**Category:** AI Instruction Bloat | **Effort:** E1

Session #152 (2026-02-12) merged IMS (Improvement Management System) into TDMS
(Technical Debt Management System). Multiple documents contain historical
references to 'IMS', 'docs/improvements/', and 'MASTER_IMPROVEMENTS.jsonl' that
are now obsolete. While SESSION_HISTORY.md correctly documents the merge in
version history, the operational guidance hasn't been updated. Risk: AI agents
reading outdated session logs may attempt to reference deleted systems.

- **File:**
  `docs/SESSION_HISTORY.md (lines 25-50), docs/AI_REVIEW_LEARNINGS_LOG.md (lines with 'IMS→TDMS'), docs/audits/AUDIT_TRACKER.md (version 2.6-2.7)`
- **Current State:** PLAN_MAP.md v2.1 (2026-02-12) documents: 'IMS merged into
  TDMS — removed docs/improvements/ hierarchy, updated refs'. Verified:
  /home/user/sonash-v0/docs/improvements/ does not exist (deleted). However,
  historical entries in SESSION_HISTORY.md still reference IMS operations. No AI
  Instructions updated to reflect post-merge state.
- **Recommendation:** (1) Update SESSION_HISTORY.md entries for Sessions
  #150-152 to add post-merge callout: [IMS DEPRECATED - see Session #152 for
  merger details]. (2) Update AI Instructions in AUDIT_TRACKER.md to reference
  TDMS exclusively. (3) Add one-time cross-reference in SESSION_DECISIONS.md:
  'IMS merged to TDMS in Session #152 - historical refs may be outdated'.
- **Impact:** accuracy

**Decision:** [x] Act now — DONE (Session #158). Added IMS→TDMS deprecation
notes to SESSION_HISTORY.md, updated AUDIT_TRACKER.md references.

---

### OPT-P008: check-roadmap-health.js version parsing regex scoped to section only

**Category:** Fragile Parsing | **Effort:** E1

check-roadmap-health.js (line 56) extracts version header using /\*\*Document
Version:\*\*\s*(\d+\.\d+)/ but this appears once per document. Line 69 further
restricts version history parsing to a specific section using
/##\s*🗓️?\s*Version History[\s\S]*?(?=\r?\n##\s|\r?\n---\s\*$|$)/. While scoped
(good), the patterns are fragile: emoji optional but section name hardcoded;
line number regex assumes specific format. If document structure changes,
version validation silently passes or fails incorrectly.

- **File:** `/home/user/sonash-v0/scripts/check-roadmap-health.js`
- **Current State:** Emoji-optional in section header (🗓️?), but section name
  'Version History' is hardcoded. Version format assumes X.Y (digits.digits).
- **Recommendation:** Make section header detection case-insensitive and
  emoji-agnostic: /##\s*version\s*history/i. Support version formats: X.Y,
  X.Y.Z, vX.Y. Validate at least one version entry exists in history section.
- **Impact:** speed

**Decision:** [x] Act now — DONE (emoji-independent, case-insensitive
section/version detection)

---

### OPT-P009: Multi-AI normalize-format.js markdown table detection and parsing

**Category:** Fragile Parsing | **Effort:** E2

normalize-format.js (line 194) detects markdown tables using
/\|[^\n]+\|\s*\n\|[-:\s|]+\|\s*\n/, but this pattern assumes: (1) first row has
pipes, (2) separator row immediately follows, (3) separator contains only
hyphens/colons/pipes/spaces. If table has leading/trailing spaces, multiple
blank lines, or non-standard separators, detection fails. Line 485, 507 split by
'|' without handling escaped pipes in content. Multi-AI uses this to parse ANY
audit input format; parsing failures cascade to all downstream processing.

- **File:** `/home/user/sonash-v0/scripts/multi-ai/normalize-format.js`
- **Current State:** Markdown table detection requires: header row | separator
  row with no gaps. Pipe-splitting (lines 485, 507) naive: split('|') assumes
  pipes only delimit columns.
- **Recommendation:** Add flexible whitespace:
  /\|[^\n]_\|\s_\n\s*\|\s*[-:\s|]+\s*\|/. Detect separator row by content: all
  cells match /^\s*[-:]+\s\*$/. Parse cells aware of escaped pipes: split by
  unescaped pipes only. Test with real audit markdown examples.
- **Impact:** accuracy|tokens

**Decision:** [x] Act now — DONE (flexible trailing pipe, CRLF-tolerant table
detection)

---

### OPT-P010: verify-sonar-phase.js hardcoded security section header detection

**Category:** Fragile Parsing | **Effort:** E1

verify-sonar-phase.js (line 163) detects security section by exact string match:
if (line.startsWith('## 🔒 Security Hotspots')). If emoji changes, section name
varies, or spacing differs, detection fails, causing hotspots to be
miscategorized as regular issues. Line 203 regex /### 📁 `([^`]+)`/ for file
sections also hardcodes emoji; changing it breaks file grouping. Phase
verification is used to validate sonar fixes; parsing failure allows
miscategorized issues to slip through.

- **File:** `/home/user/sonash-v0/scripts/verify-sonar-phase.js`
- **Current State:** Hardcoded section headers with emoji: '## 🔒 Security
  Hotspots' (line 163), '### 📁 `file`' (line 203). String startsWith() instead
  of regex; no flexibility.
- **Recommendation:** Use regex for section detection:
  /##\s+(?:🔒)?\s*security\s+hotspots/i. For files: /###\s+📁?\s*`([^`]+)`/.
  Fall back to text search without emoji. Log parse warnings.
- **Impact:** accuracy

**Decision:** [x] Act now — DONE (regex-based emoji-independent section
detection)

---

### OPT-D003: RECAPTCHA_REMOVAL_GUIDE.md - 745 lines about Firebase configuration rarely used

**Category:** Dead Documents | **Effort:** E0

Comprehensive guide (745 lines) for reCAPTCHA removal and fresh App Check setup.
While server-side docs reference it (2 refs), it has zero inbound document
references and is primarily a reference/procedural doc.

- **File:** `/home/user/sonash-v0/docs/RECAPTCHA_REMOVAL_GUIDE.md`
- **Current State:** 745-line standalone guide at
  docs/RECAPTCHA_REMOVAL_GUIDE.md; DOCUMENTATION_INDEX shows ↓0 ↑2
- **Recommendation:** Integrate into APPCHECK_SETUP.md or
  SERVER_SIDE_SECURITY.md as a section. Update README or index to reference it,
  or move obsolete sections to archive if reCAPTCHA removal was already
  completed.
- **Impact:** tokens

**Decision:** [x] Defer — reference doc still needed

---

### OPT-D004: REVIEW_POLICY_INDEX.md - 370 lines index without inbound refs

**Category:** Dead Documents | **Effort:** E0

Review Policy Index (370 lines) serves as a directory for review policies but
has zero inbound references despite 9 upward references. Not referenced by
README, DOCUMENTATION_INDEX, or navigation docs.

- **File:** `/home/user/sonash-v0/docs/REVIEW_POLICY_INDEX.md`
- **Current State:** 370-line document at docs/REVIEW_POLICY_INDEX.md; ↓0 ↑9
  (referenced by policy docs but not from main docs)
- **Recommendation:** Add explicit reference in DOCUMENTATION_INDEX.md index
  section and link from REVIEW_POLICY_ARCHITECTURE.md. If serving as index,
  ensure it's discoverable from main navigation (README, DOCUMENTATION_INDEX).
- **Impact:** accuracy

**Decision:** [x] Act now — DONE (commit bf075e5, linked)

---

### OPT-D005: PLAN_MAP.md - 242 lines documentation hierarchy map never referenced

**Category:** Dead Documents | **Effort:** E0

SoNash Documentation Plan Map (242 lines) provides visual hierarchy and
relationships but is completely orphaned with zero inbound references.

- **File:** `/home/user/sonash-v0/docs/PLAN_MAP.md`
- **Current State:** 242-line document at docs/PLAN_MAP.md; ↓0 ↑0 (completely
  isolated)
- **Recommendation:** Either (1) add reference from DOCUMENTATION_INDEX.md as
  navigation aid, (2) integrate content into README.md or
  DOCUMENTATION_STANDARDS.md, or (3) move to docs/archive/ if superseded by
  DOCUMENTATION_INDEX.md.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit bf075e5, linked)

---

### OPT-D006: MCP_SERVER_AUDIT.md - 374 lines about MCP consumption never referenced

**Category:** Dead Documents | **Effort:** E0

MCP Server Usage Audit (374 lines) designed to identify MCP servers consuming
context but never referenced by any documentation or audit processes.

- **File:** `/home/user/sonash-v0/docs/MCP_SERVER_AUDIT.md`
- **Current State:** 374-line document at docs/MCP_SERVER_AUDIT.md; ↓0 ↑0
- **Recommendation:** Link from multi-ai-audit coordinator or create reference
  in relevant audit plans. If this audit should be run, add to AUDIT_TRACKER.md.
  Consider if this aligns with actual audit workflows.
- **Impact:** speed

**Decision:** [x] Act now — DONE (commit bf075e5, archived)

---

### OPT-D011: SKILL_AGENT_POLICY.md - 0 refs despite defining usage policy

**Category:** Dead Documents | **Effort:** E0

Skill and Agent Usage Policy (docs/agent_docs/SKILL_AGENT_POLICY.md) defines
critical policies for skill/agent creation but has zero inbound references
despite having 3 upward references.

- **File:** `/home/user/sonash-v0/docs/agent_docs/SKILL_AGENT_POLICY.md`
- **Current State:** Policy doc at docs/agent_docs/SKILL_AGENT_POLICY.md; ↓0 ↑3
  (referenced by policies but not from discoverable locations)
- **Recommendation:** Link from agent creation guides, DEVELOPMENT.md, and main
  agent documentation README. Add to onboarding checklist. Ensure policy is
  discoverable before agents are created.
- **Impact:** accuracy

**Decision:** [x] Act now — DONE (commit bf075e5, linked)

---

### OPT-D012: Audit inventory stage files (6 files) - generated but unreferenced

**Category:** Dead Documents | **Effort:** E0

Six stage-1 audit inventory files (stage-1a through stage-1f) generated
2026-02-09 but never integrated into audit workflows or referenced by audit
aggregation processes.

- **File:**
  `/home/user/sonash-v0/docs/audits/single-session/process/audit-2026-02-09/stage-1*.md`
- **Current State:** 6 generated markdown files, all with ↓0 ↑0 in
  DOCUMENTATION_INDEX; date-stamped as 2026-02-09
- **Recommendation:** Either (1) integrate into AUDIT_TRACKER with findings
  aggregation, or (2) move dated audit outputs to completed audit archive with
  clear retention policy. If stage outputs are intermediate, don't persist in
  docs.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit bf075e5, deleted)

---

### OPT-D014: Plan documents with zero inbound refs - 5 planning files orphaned

**Category:** Dead Documents | **Effort:** E0

Five planning documents (CI_GATES_BLOCKING_PLAN, SESSION_CONTEXT_REDUCTION_PLAN,
TRACK_A_MANUAL_TEST_CHECKLIST, alerts-enhancement-plan, and
roadmap-assignment-report) all marked orphaned in DOCUMENTATION_INDEX.

- **File:**
  `/home/user/sonash-v0/docs/plans/CI_GATES_BLOCKING_PLAN.md and 4 others`
- **Current State:** 5 plan files with ↓0 ↑0 or minimal refs; mixed completion
  status
- **Recommendation:** For each plan: (1) check if completed and archive to
  docs/archive/completed-plans/, or (2) if active, add explicit reference from
  ROADMAP.md and PLAN_MAP.md. Consolidate similar plans (e.g., testing
  checklists).
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit bf075e5, deleted)

---

## S3 — Low (20 findings)

### OPT-F011: SESSION_CONTEXT.md recent session summaries

**Category:** Format (MD→JSONL) | **Effort:** E1

3 session summaries (lines 82-112) capturing major work completed. Append-only
archive with manual rotation to SESSION_HISTORY.md every session.

- **File:** `/home/user/sonash-v0/SESSION_CONTEXT.md`
- **Current State:** Markdown text: Session #155-153 summaries with bullet-point
  work items. Instructions say 'keep last 3 sessions, archive older to
  SESSION_HISTORY.md'.
- **Recommendation:** Extract to session-summaries.jsonl with schema:
  {sessionNum, date, title, workItems[], impact, nextSteps}. SESSION_CONTEXT.md
  reads latest 3 automatically. /session-end skill handles archive rotation.
  Centralize all session history.
- **Impact:** tokens

**Decision:** [x] Reject — 3 summaries (~200 tokens) is fine as markdown.
/session-end rotation works.

---

### OPT-F012: PLAN_MAP.md version history table

**Category:** Format (MD→JSONL) | **Effort:** E1

Version history table (lines 228-242) tracking 14 versions. Append-only log with
dates, descriptions, authors.

- **File:** `/home/user/sonash-v0/docs/PLAN_MAP.md`
- **Current State:** Markdown table: 14 version entries from 2026-02-12 back to
  2026-01-20. Version, Date, Description, Author columns.
- **Recommendation:** Extract to doc-versions.jsonl (see OPT-F009 for
  consolidation). PLAN_MAP.md can remove version history table entirely.
- **Impact:** tokens

**Decision:** [x] Reject — Same as F009. Version history tables are low-impact.
Git tracks real history.

---

### OPT-F013: AI_REVIEW_LEARNINGS_LOG.md large append-only learning journal (317KB)

**Category:** Format (MD→JSONL) | **Effort:** E2

Large document (1587 lines, 317KB) containing review-level learning entries.
Used by /pr-review skill but stored as markdown prose without structured
extraction.

- **File:** `/home/user/sonash-v0/docs/AI_REVIEW_LEARNINGS_LOG.md`
- **Current State:** Markdown document with 'Review #NNN' sections containing
  narrative learnings, patterns, decisions. Searchable via grep but not
  structured for querying.
- **Recommendation:** Parallel reviews.jsonl with schema: {reviewNum, prNum,
  date, category, finding, rationale, pattern, linkedDocs[], status}. Keep
  AI_REVIEW_LEARNINGS_LOG.md as human-readable summary; skill reads from
  structured reviews.jsonl for automation.
- **Impact:** tokens|speed|accuracy

**Decision:** [x] Defer — .claude/state/reviews.jsonl already serves as
structured source. Consider archiving old entries instead.

---

### OPT-F014: ROADMAP_LOG.md completed items history (31KB, 1,129 lines)

**Category:** Format (MD→JSONL) | **Effort:** E1

Archive of completed milestones and features in markdown. Append-only log with
dates, completion summaries, version history.

- **File:** `/home/user/sonash-v0/ROADMAP_LOG.md`
- **Current State:** Markdown: Completed milestones M0-M1, historical entries
  with dates, narrative descriptions of what was completed.
- **Recommendation:** Create roadmap-history.jsonl (append-only) with schema:
  {completedItem, completedDate, milestone, summary, session, commits, impact}.
  ROADMAP_LOG.md becomes human-readable narrative referencing jsonl data. Allows
  automated timeline generation.
- **Impact:** tokens

**Decision:** [x] Reject — Archive doc, fine as markdown. 31KB is reasonable. No
automation needs structured access.

---

### OPT-S002: check-review-triggers.sh - Dead shell script for multi-AI triggers

**Category:** Dead Scripts | **Effort:** E0

Bash script checks git commit/file counts to determine if code review triggers
are active. Appears to duplicate functionality of check-triggers.js (which IS
referenced in package.json). Script prints colored output to console but has no
output targets.

- **File:** `/home/user/sonash-v0/scripts/check-review-triggers.sh`
- **Current State:** Functional bash script with color-coded trigger detection
  logic, never invoked
- **Recommendation:** Remove in favor of the active check-triggers.js npm
  script. Consolidate shell logic into Node.js for consistency.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit 79fddc2)

---

### OPT-S005: generate-placement-report.js - Unused roadmap placement suggester

**Category:** Dead Scripts | **Effort:** E1

Reads net-new findings from docs/aggregation/net-new-findings.jsonl and
generates roadmap placement suggestions in NET_NEW_ROADMAP_PLACEMENT.md. Depends
on external file that may or may not exist. Complements
create-canonical-findings.js.

- **File:** `/home/user/sonash-v0/scripts/generate-placement-report.js`
- **Current State:** 86 lines reading net-new findings and categorizing by
  severity with ROADMAP placement metadata
- **Recommendation:** Remove or consolidate into create-canonical-findings.js.
  If placement suggestions are valuable, add explicit npm script and document
  workflow.
- **Impact:** speed

**Decision:** [x] Act now — DONE (commit 79fddc2)

---

### OPT-S007: redeploy-admin-dashboard.sh - Firebase deployment helper for admin functions

**Category:** Dead Scripts | **Effort:** E2

Shell script for deleting and redeploying admin dashboard Cloud Functions
(adminHealthCheck, adminGetDashboardStats) to ensure clean App Check
configuration. Hardcoded to 'sonash-app' Firebase project. 20 lines.

- **File:** `/home/user/sonash-v0/scripts/redeploy-admin-dashboard.sh`
- **Current State:** Functional deployment script with hardcoded project name
  'sonash-app', no way to invoke except manual execution
- **Recommendation:** Either parameterize Firebase project and add to npm
  scripts, or document as manual troubleshooting tool with clear prerequisites.
- **Impact:** speed

**Decision:** [x] Act now — DONE (commit f472ba1)

---

### OPT-S009: seed-commit-log.js - One-time commit log backfill utility

**Category:** Dead Scripts | **Effort:** E0

One-time script to initialize .claude/state/commit-log.jsonl with recent git
commits for commit tracking system. Self-documenting with clear 'only run once'
semantics. Part of Session #138 state persistence setup.

- **File:** `/home/user/sonash-v0/scripts/seed-commit-log.js`
- **Current State:** Functional one-time backfill utility that checks for
  existing entries before overwriting, includes --force flag
- **Recommendation:** Document as one-time setup script in DEVELOPMENT.md or
  move to docs/setup/. No need to run again unless --force is used. Safe to
  leave but consider archiving.
- **Impact:** tokens

**Decision:** [x] Reject — utility still needed for seeding

---

### OPT-H010: Bash hook (commit-tracker) does fast-path regex on every command but mostly bails (~1ms overhead)

**Category:** Hook Efficiency | **Effort:** E1

commit-tracker.js runs on every Bash command but uses COMMIT_COMMAND_REGEX
(line 50) to bail out fast for non-commit commands. Estimated ~1ms overhead per
Bash call for non-commit operations (regex + argument parsing). Non-critical
since bail-out is very fast.

- **File:** `.claude/hooks/commit-tracker.js`
- **Current State:** Lines 156-160 do fast regex check and exit. Only commits
  (~5% of bash calls) proceed to git operations (execFileSync).
- **Recommendation:** Move regex check to settings matcher instead of hook code.
  Create specific 'git commit' matcher rather than catching all Bash and bailing
  out. Would eliminate overhead entirely.
- **Impact:** speed

**Decision:** [x] Reject — 1ms overhead acceptable

---

### OPT-H011: check-write-requirements and check-edit-requirements could be unified with tool parameter

**Category:** Hook Efficiency | **Effort:** E1

Both hooks (106 lines each) contain ~95% identical code. Only difference is
keyword priority order (test-first vs security-first). Could merge into single
hook that accepts tool name parameter and applies correct priority matrix.

- **File:**
  `.claude/hooks/check-write-requirements.js, .claude/hooks/check-edit-requirements.js`
- **Current State:** Two separate hook files with identical structure: line
  70-103 defines priority order differently. check-write-requirements:
  tests→security→code→markdown→config. check-edit-requirements:
  security→tests→code→markdown.
- **Recommendation:** Create single unified hook: check-file-requirements.js.
  Accept tool parameter. Build priority array based on tool. Use loop through
  priority array instead of separate if-blocks for each type. Saves 1 file and
  reduces maintenance burden.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (commit f228219, unified requirements)

---

### OPT-H014: TypeScript strict check runs on every Write/Edit/MultiEdit but skips for small files

**Category:** Hook Efficiency | **Effort:** E1

typescript-strict-check.js (100ms cost) runs on every Write/Edit/MultiEdit but
skips test files (.test.ts), .d.ts files, and scripts/ directory. Still does
full file read even for pre-filtered file types.

- **File:** `.claude/hooks/typescript-strict-check.js`
- **Current State:** Lines 93-103 skip test files and scripts early. But still
  reads file at line 108 even for non-TS files (line 81 checks extension but
  still reads for files >100 lines).
- **Recommendation:** Move file read behind secondary filter check. Check file
  extension AND skip patterns before fs.readFileSync. Add cache for
  recently-checked files so repeated edits don't re-scan.
- **Impact:** speed

**Decision:** [x] Reject — small file skip is fine

---

### OPT-K008: Placeholder skills with minimal utility (using-superpowers, task-next, validate-claude-folder)

**Category:** Skill Overlap | **Effort:** E0

Several skills appear to be utilities or helpers with limited scope.
using-superpowers presumably activates advanced features. task-next shows next
task. validate-claude-folder validates .claude folder.

- **File:**
  `.claude/skills/using-superpowers/SKILL.md, task-next/SKILL.md, validate-claude-folder/SKILL.md`
- **Current State:** 3 lightweight utility skills mixed with 50+ other skills in
  the skill index
- **Recommendation:** These are fine as utilities, but ensure they're documented
  clearly. Consider a separate 'utilities' section in skill index to avoid
  confusion with major skills.
- **Impact:** speed

**Decision:** [x] Reject — fine as lightweight utilities with clear distinct
purposes

---

### OPT-K010: Session lifecycle skills (session-begin, session-end, checkpoint) could be consolidated

**Category:** Skill Overlap | **Effort:** E0

Three skills handle session management: session-begin starts sessions,
session-end ends sessions, checkpoint saves state. These are tightly coupled.

- **File:**
  `.claude/skills/session-begin/SKILL.md, session-end/SKILL.md, checkpoint/SKILL.md`
- **Current State:** 3 separate skills for session lifecycle management
- **Recommendation:** Consider consolidating into a single 'session-management'
  skill with subcommands for begin/end/checkpoint. This reduces skill index
  clutter.
- **Impact:** speed

**Decision:** [x] Reject — appropriate separation by lifecycle event,
consolidating would create a massive partially-irrelevant skill

---

### OPT-A006: Inconsistent AI Instructions format across document tiers

**Category:** AI Instruction Bloat | **Effort:** E1

Different document tiers use different AI Instructions formats: (1) Tier 2 docs
(setup guides) use numbered lists with actions (e.g., APPCHECK_SETUP.md), (2)
Tier 4 docs (references) use bullet lists with guidelines (e.g.,
REVIEW_POLICY_QUICK_REF.md), (3) Some use 'When X do Y' format, others use
'Rules are', others use 'Do not'. DOCUMENTATION_STANDARDS.md doesn't prescribe a
format for AI Instructions subsections. This inconsistency costs ~50-100 tokens
per doc as LLMs must re-parse format variations.

- **File:** `docs/*.md (all 57 files)`
- **Current State:** Sampled formats: APPCHECK_SETUP.md (4 numbered action
  steps), DOCUMENTATION_STANDARDS.md (4 bulleted guidelines),
  GLOBAL_SECURITY_STANDARDS.md (3 rules), HOOKIFY_STRATEGY.md (4 bulleted
  practices), SESSION_CONTEXT.md (6 numbered steps). No canonical format.
- **Recommendation:** Add Section 5 to DOCUMENTATION_STANDARDS.md: 'AI
  Instructions Format Spec'. Prescribe: (1) Use bulleted list (not numbered) for
  generality, (2) Start each bullet with imperative verb:
  'Check/Validate/Review/When/Always/Never', (3) Keep <15 words per bullet, (4)
  Max 5-8 bullets per section, (5) Example: '- Check file status before
  modifying
- Validate with npm run docs:check
- Reference ROADMAP.md for sync triggers'.
- **Impact:** tokens

**Decision:** [x] Defer — Standardize remaining ~15-20 docs after A009/A001
sweep completes.

---

### OPT-A007: Disconnected AI Instructions from actual automation - TESTING_PLAN.md example

**Category:** AI Instruction Bloat | **Effort:** E2

TESTING_PLAN.md AI Instructions (line ~1050) say 'First run npm test to check
automated test status'. But there is no automatic test runner integrated into
the documented workflow. The instruction assumes synchronous CLI execution,
while modern SoNash uses async /test-suite skill. The instruction is not
obsolete but outdated (pre-skill era). Similar issue in 3-5 other docs.

- **File:**
  `docs/TESTING_PLAN.md, docs/SONARCLOUD_CLEANUP_RUNBOOK.md, docs/RECAPTCHA_REMOVAL_GUIDE.md`
- **Current State:** TESTING_PLAN.md AI Instructions reference direct 'npm test'
  execution. Modern workflow uses /test-suite skill (created Session #141). Docs
  list both paths but AI Instructions anchor to old path only.
- **Recommendation:** (1) Update TESTING_PLAN.md AI Instructions: 'Use
  /test-suite skill (recommended) or npm test for local verification'. (2) Add
  'Preferred Automation' subsection to claude.md Section 7 that lists 10 core
  skills with their trigger contexts. (3) Mark AI Instructions with version
  (['Updated Session #X'] to help AI understand freshness.
- **Impact:** accuracy|speed

**Decision:** [x] Act now (modified) — DONE (Session #158). Updated 3 docs
(TESTING_PLAN, SONARCLOUD_CLEANUP_RUNBOOK, RECAPTCHA_REMOVAL_GUIDE) to reference
/test-suite.

---

### OPT-A008: AI Instructions in SESSION_CONTEXT.md creates circular reference risk

**Category:** AI Instruction Bloat | **Effort:** E1

SESSION_CONTEXT.md AI Instructions (line 7-43) prescribe 6 steps for session
start and 5 rules for updating, concluding with 'Check Navigation' section that
links to ROADMAP.md, AI_WORKFLOW.md, etc. These links then loop back and
reference SESSION_CONTEXT.md. While not contradictory, this creates a 3-hop
dependency (SESSION_CONTEXT → AI_WORKFLOW → ROADMAP → SESSION_CONTEXT) that
costs tokens every session load and makes updates harder.

- **File:** `SESSION_CONTEXT.md, AI_WORKFLOW.md, ROADMAP.md`
- **Current State:** SESSION_CONTEXT.md reads: 'Check Roadmap → /ROADMAP.md'
  (line 49). ROADMAP.md has no explicit 'return' link but SESSION_CONTEXT.md
  documentation calls it central. AI_WORKFLOW.md (not examined but mentioned)
  likely also references SESSION_CONTEXT.md.
- **Recommendation:** (1) Establish clear hierarchy: ROADMAP.md is canonical,
  SESSION_CONTEXT.md is current-state read-only snapshot, AI_WORKFLOW.md is
  navigation. (2) Simplify SESSION_CONTEXT.md AI Instructions to 3 points: 'Read
  first → check Next Session Goals → see ROADMAP for priorities'. Remove
  internal navigation links. (3) Move navigation links to ai-navigation section
  in claude.md.
- **Impact:** tokens

**Decision:** [x] Act now — DONE (Session #158). Trimmed SESSION_CONTEXT.md AI
Instructions from 36 to ~10 lines.

---

### OPT-D007: MCP_SETUP.md - 178 lines configuration guide without traction

**Category:** Dead Documents | **Effort:** E0

MCP Server Setup Guide (178 lines) provides configuration instructions but is
unused - no references from setup docs, deployment guides, or DEVELOPMENT.md.

- **File:** `/home/user/sonash-v0/docs/MCP_SETUP.md`
- **Current State:** 178-line document at docs/MCP_SETUP.md; ↓0 ↑0
- **Recommendation:** Integrate into DEVELOPMENT.md or
  .claude/REQUIRED_PLUGINS.md. If MCP is critical for setup, ensure onboarding
  docs reference it. Otherwise archive as legacy.
- **Impact:** speed

**Decision:** [x] Defer — setup guide still needed

---

### OPT-D008: LEARNING_METRICS.md - 84 lines metrics tracking document

**Category:** Dead Documents | **Effort:** E0

Learning Effectiveness Metrics (84 lines) auto-generated tracker showing pattern
learning effectiveness but with zero inbound references despite being produced
by scripts/analyze-learning-effectiveness.js.

- **File:** `/home/user/sonash-v0/docs/LEARNING_METRICS.md`
- **Current State:** 84-line document at docs/LEARNING_METRICS.md; ↓0 ↑0;
  auto-generated by scripts/analyze-learning-effectiveness.js
- **Recommendation:** Add reference from AUDIT_TRACKER.md or alerts system. If
  auto-generated, ensure output is mentioned in the generating script's
  documentation. Consider if metrics should feed into decision-making workflows.
- **Impact:** accuracy

**Decision:** [x] Act now — DONE (commit bf075e5, deleted)

---

### OPT-D009: AUTOMATION_AUDIT_REPORT.md - 255 lines audit results never integrated

**Category:** Dead Documents | **Effort:** E0

Automation Audit Report (255 lines) appears to be a standalone audit report with
no inbound references, likely superseded by newer audit structure in
docs/audits/ subdirectory.

- **File:** `/home/user/sonash-v0/docs/AUTOMATION_AUDIT_REPORT.md`
- **Current State:** 255-line document at docs/AUTOMATION_AUDIT_REPORT.md; ↓0
  ↑0; similar content exists at
  docs/audits/single-session/process/audit-2026-02-09/AUTOMATION_AUDIT_REPORT.md
- **Recommendation:** Remove duplicate at root level (keep versioned audit in
  subdirectory). Update references to point to dated audit instance in
  docs/audits/. Consider if root-level report should be generated or archived.
- **Impact:** tokens

**Decision:** [x] Defer — recent audit, keep for reference

---

### OPT-D013: ADR template and decisions/README - decision framework underutilized

**Category:** Dead Documents | **Effort:** E0

Architecture Decision Records framework (docs/decisions/README.md) with template
(docs/decisions/TEMPLATE.md) but only one ADR documented; framework appears
unused.

- **File:** `/home/user/sonash-v0/docs/decisions/`
- **Current State:** ADR framework present but dormant; README marked ↓0 ↑1;
  TEMPLATE marked ↓1 ↑0
- **Recommendation:** Either (1) activate ADR process and link from
  ARCHITECTURE.md + AI_WORKFLOW.md, or (2) consolidate decision tracking into
  SESSION_DECISIONS.md format. Clean up if not part of current workflow.
- **Impact:** accuracy

**Decision:** [x] Defer — keep ADR framework

---

## How to Use This Report

1. Review each finding above
2. Mark your decision (Act now / Defer / Reject / Modify)
3. Findings marked "Act now" will be added to TDMS as actionable items
4. Deferred findings stay in this report for future consideration
5. Raw data: `docs/audits/single-session/ai-optimization/findings.jsonl`
