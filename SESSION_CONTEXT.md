# Session Context

**Document Version**: 8.36 **Purpose**: Quick session-to-session handoff **When
to Use**: **START OF EVERY SESSION** (read this first!) **Last Updated**:
2026-04-15 (Session #283 — sync to remote canon + full `/analyze` skill-audit
with ecosystem scope-expansion: `/analyze` v1.2 → v2.0, new
`scripts/skills/analyze/self-audit.js`, `validate-skill-config.js` extended to
enforce SKILL_STANDARDS §Required Sections on all 78 `.claude/skills/*/SKILL.md`
files, 11 other skills brought into compliance)

## Purpose

Quick session-to-session handoff context for AI coding sessions.

## AI Instructions

**This document is your session starting point:**

1. **Read this FIRST** every session
2. **Increment session counter** - track session frequency
3. **Check "Next Session Goals"** - understand priority
4. **Review "Current Blockers"** - know what's blocked
5. **Note "Pending PR Reviews"** - process if any
6. **Update at end of session** - keep current for next session

**When updating**: Keep session summaries to **last 3 sessions only**. Older
sessions move to [SESSION_HISTORY.md](docs/SESSION_HISTORY.md) during
`/session-end`. Keep this document focused and brief (<300 lines target).

---

## Quick Recovery

> **Use `/checkpoint` to update this section. Update before risky operations.**

**Last Checkpoint**: 2026-04-15 (Session #283 — `/analyze` audit + ecosystem
validator fix COMPLETE, committed `f1668a09`, ready to push). **Branch**:
`41526` (1 commit ahead of `origin/main`, unpushed). **Working On**: COMPLETE —
`/analyze` audit goal #2 from Session #282 handoff. `/analyze` v1.2 → v2.0 with
67 decisions applied, new `scripts/skills/analyze/self-audit.js`, and ecosystem
fix: `scripts/validate-skill-config.js` extended (scope .claude/skills/\*/
SKILL.md + multi-line YAML parser + required-section enforcement). Validator
baseline was 1 file scanned / silently passing; now 78 files / 0 errors / 8
warnings. State file `.claude/state/task-skill-audit-analyze.state.json`
(gitignored) status: "complete".

**Session #280 work (summary)**:

**Step 3 — per-skill self-audit pattern (4 sub-steps, 2 commits):**

1. **3.A** — `.claude/skills/_shared/SELF_AUDIT_PATTERN.md` (~230 lines).
   Canonical doc: location (`scripts/skills/<name>/self-audit.js`), CLI
   (`--target/--state/--json`; exit 0/1/2), `---SUMMARY---` JSON output,
   9-dimension mapping with tier requirements, required shared helpers,
   skip-list convention, state schema contract, SKILL.md Phase 5 wiring
   template, rollout protocol.
2. **3.B + 3.E folded** — `scripts/skills/skill-audit/self-audit.js` (~470
   lines). Reference impl + skill-audit's own self-audit. Reads
   `task-skill-audit-<name>.state.json`, runs all 9 SKILL_STANDARDS dimensions.
   Schema gaps reported as WARN for backward compat. Dim 3 stub-marker matching
   uses comment-context patterns + self-referential exclusion (avoids
   regex-literal false positives). `.claude/skills/skill-audit/SKILL.md` v3.6:
   new Phase 5.0 invokes script before existing 5.1-5.5 prose.
3. **3.C** — `.claude/skills/skill-creator/SKILL.md` v3.4. Phase 4.3 self-audit
   guidance now has TWO parts (prose phase + scaffolded script). Phase 5 step 7
   verifies BOTH presence. References section adds SELF_AUDIT_PATTERN.md link.
4. **3.D** — `.claude/skills/skill-audit/REFERENCE.md` Category 12. New
   "Canonical Fix Action" subsection: when Cat 12 scores <7, the canonical Phase
   4 implementation is 5 concrete steps (create script, wire SKILL.md, extend
   state schema, document skips, validate against known-good prior run).

**Plus**: `.claude/COMMAND_REFERENCE.md` v6.1 (cross-doc dependency
satisfaction).

**Commits this session**: `e3a9f93c` (3.A+3.B), `91444183` (3.C+3.D).

**Tests run before each commit**: `npm run skills:validate` (pass),
`npm run patterns:check` (pass), `npm run lint` (0 errors), self-audit script
PASS-path + FAIL-path + real stub detection + self-referential exclusion.

**Next session pickup point**: Step A — run `/skill-audit` on the 7 CAS skills
using W2 approach (parallel agents producing findings JSON, lead presents
per-target menu for user decisions). Order: handlers first (repo-analysis,
website-analysis, document-analysis, media-analysis), then synthesize, recall,
analyze. See `.planning/content-analysis-system/REMAINING_CAS_TASKS.md` Step A.
Each audit will likely add a `scripts/skills/<name>/self-audit.js` per the Cat
12 canonical fix action.

---

**Prior session (#279) work (summary)**:

**Phase A — /session-begin triage (4 of 5 items fixed):**

1. **github-health P0** — Backlog Enforcement workflow failing 3 weeks. Routed:
   F2 Dependabot fails → DEBT-45653 (new); F1 Backlog Enforcement →
   cross-referenced existing DEBT-0891 + DEBT-0398 with recurrence note in
   github-health-history.jsonl. F3 stale CI skipped (currently green).
2. **reviews disposition violations (3 S2)** — root cause: parser regex
   `(\d+)\s+(?:total|items)` matched prose. Fix: parseMarkdownReviews() filters
   records with total>0 + zero dispositions, plus empty placeholders. Removed 3
   stub records. Added #508 to KNOWN_SKIPPED_IDS.
3. **Rendered-view drift S3** — manual table at line 1295 of
   AI_REVIEW_LEARNINGS_LOG.md. Quick patch + structural: render-reviews-to-md.ts
   now auto-updates Active reviews + Main log lines metrics rows on every
   render. No future manual maintenance.
4. **roadmap:hygiene B3 + S4 false positives** — fuzzy substring match was too
   loose. Tightened scanCommitsForCompletions: word-boundary + structural marker
   preceding the ID (`(`, `[`, `#`, `:`, or start-of-line).

**Phase B — T29 synthesis-consolidation PLAN closed (Steps 13 + 15):**

1. **Step 13**: Functional verification (option B, no full-run clobber). 13a
   `--type=repo`: 35 → 26 repos in / 9 non-repos out (PASS). 13b
   `--paradigm=matrix`: Zod enum + REFERENCE.md §1.3 spec + 4 contract markers
   all PASS. Results at `.research/analysis/synthesis/test-step13/`.
2. **Step 15**: code-reviewer audit returned 8 findings. ALL FIXED in-session
   (none deferred):
   - F1 status banner v1.0 → v1.2; F2 opportunitySchema title_key (optional); F3
     opportunityLedgerRecord Zod schema added (validates 17/17 existing ledger
     rows) + ledgerStatusEnum + deferredToSchema; F4-F8 wording + routing
     guide + path correction + double-warning note.
3. **PLAN.md fully marked**: top status banner + 16 ✅/⏳ markers (15 steps
   - 8.5). T29 fully closed.

**Phase C — TODOS.md auto-render hook (drift prevention):**

1. **Discovered**: TODOS.md was 2 sessions stale (last regen 6a3eb32e Session
   #277). T47 + T48 invisible because they were after the last render.
2. **Fix**: New `.claude/hooks/post-todos-render.js` — fires on Write/Edit/
   MultiEdit when `.planning/todos.jsonl` is touched. Re-renders + auto-stages.
   Wired in `.claude/settings.json` with `if:` filter scoped to that exact path
   (governance-logger pattern). Failures non-blocking. Documented in TRIGGERS.md
   - DEVELOPMENT.md.

**Phase D — CAS PLAN hygiene + handoff doc:**

1. **Investigation**: Found 3 stale active todos: T29 (in-progress P1, but
   closed today), T37 (pending P3, but GitNexus analyzed Session #278), T40
   (pending P2, but full retag migration shipped Sessions #275-#276). Marked all
   three completed.
2. **CAS PLAN.md hygiene**: Added top status banner (⏳ NEAR-COMPLETE — 13/15)
   with wave-by-wave summary + corpus snapshot. Marked 13 steps ✅, 2 steps ⏳
   (Step 14 audit, Step 15 E2E). Same drift pattern as T29 PLAN had.
3. **Handoff doc** at `.planning/content-analysis-system/REMAINING_CAS_TASKS.md`
   — full step-by-step plan to close T28 (Steps A/B/C), optional follow-ups
   (T47, T48, T42), `/deep-plan` template gap analysis with 3-part fix, resume
   protocol.
4. **T49 added** (P2 pending) — Fix /deep-plan template (status banner +
   per-step ✅ markers + plans:hygiene checker).

**Commits this session (5 ahead of origin pre-/session-end commit)**: `8ec88846`
(triage 4 fixed + DEBT-45653), `9787b418` (T29 closure 8 audit fixes),
`b13bd2c4` (TODOS.md auto-render hook), `8a0f71a3` (T29 PLAN markers),
`8ec75ce7` (stale todos + CAS PLAN hygiene + handoff doc).

**Step status (T29 synthesis-consolidation PLAN)**: ALL 15 STEPS ✅ COMPLETE.
**Step status (T28 CAS PLAN)**: 13/15 ✅, Step 14 (audit) + Step 15 (E2E) ⏳.

---

## Session Tracking

**Current Session Count**: 284 (since Jan 1, 2026)

> **Session #281 handoff (skill-audit batch-mode plan + implementation,
> 2026-04-14):** Full thread: sync to remote canon (branch `41426`,
> `planning-41426` deleted) → /session-begin (triage: CI-stale confirmed,
> warnings acked) → user flagged that code-reviewer agents drift from
> /skill-audit 12-category rubric → 20-question /deep-plan designed new
> `batch` + `multi` modes with Shape Y orchestration (audit-all → decide-all →
> implement-all), removed code-reviewer agent layer from ALL /skill-audit modes
> (D11 scope expansion), decoupled /skill-audit from audit-review-team. Plan: 27
> decisions (7 seed + 20 discovery), 23 steps, 4 waves. Approved + executed all
> 4 waves in same session: (1) SKILL.md structural + self-audit.js Dim 6 rework
> (cross-reference integrity) + team config decouple; (2) REFERENCE.md batch
> appendix (schema + procedures + rendering + lifecycle); (3) SKILL.md v4.0 +
> Critical Rule #7 + mode-aware invocation tracking; (4) code-reviewer audit on
> diff → stale "three layers" + "Agent discrepancies" references cleaned. Parity
> test (PLAN Steps 19-20) deferred to next session due to context weight. **Next
> session priorities: (1) Run parity test on `recall` skill —
> `/skill-audit recall --mode=single` vs `--mode=batch`, document in
> `.planning/skill-audit-batch-mode/PARITY_TEST.md`; (2) CAS Step A can now
> proceed via `/skill-audit` with `mode=multi` on 7 CAS skills; (3) CAS Step B
> E2E /recall verification; (4) T48 Adoption Verdict backfill.** Branch: `41426`
> (4 commits ahead of origin pre-push).

> **Session #279 handoff (Triage 4 + T29 CLOSED + auto-render hook + CAS PLAN
> hygiene, 2026-04-14):** /session-begin surfaced 5 triage items — 4 fixed
> in-session (github-health P0 routed to DEBT-45653 + cross-refs; reviews
> disposition violations cleaned via parser tightening; rendered-view drift
> patched + auto-update added; roadmap:hygiene matcher tightened with
> word-boundary + structural-marker requirement); 5th was info-only. T29
> synthesis-consolidation PLAN fully closed: Step 13 functional verification
> PASS, Step 15 code-reviewer audit returned 8 findings ALL FIXED in-session
> (incl. new opportunityLedgerRecord Zod schema validating 17/17 existing rows).
> Discovered TODOS.md was 2 sessions stale → built post-todos-render.js hook
> that auto-regenerates + auto-stages on every todos.jsonl Write/Edit
> (governance-logger pattern). Closed 3 stale todos (T29/T37/T40). CAS PLAN.md
> hygienic banner + 13/15 ✅ + 2 ⏳ markers added. Handoff doc at
> .planning/content-analysis-system/REMAINING_CAS_TASKS.md. T49 added (fix
> /deep-plan template gap discovered today). **Next session priorities: (1) CAS
> Step A — skill-audit on 7 CAS skills (T38 unblocks); (2) CAS Step B — E2E
> /recall verification → close T28; (3) T48 Adoption Verdict backfill (~20
> product-repos, parallelizable); (4) T47 Wave 6 source seed; (5) T49 /deep-plan
> template fix.** Branch: `planning-41426`.

> **Session #278 handoff (T29 Step 12 COMPLETE + /repo-analysis v4.6 + GitNexus
> analysis, 2026-04-13):** Session #278 archived 12 completed planning/research
> dirs, ran full Standard analysis on `abhigyanpatwari/GitNexus` (new corpus
> source #33), discovered and fixed a real skill gap (Creator View had no
> Use-As-Is verdict — now MUST-produce for product repos in v4.6), and exercised
> T29 synthesis-consolidation PLAN Step 12 by running `/synthesize` in
> incremental mode. All 7 Step 12 requirements PASS. Self-audit 10/10.
> Opportunities ledger upserted: **5 new rows** (Rank 1 = Build eval harness —
> the S-tier insight from GitNexus creator-view Challenge). Vocabulary 180 → 187
> tags. EXTRACTIONS.md 309 → 343 candidates across 33 sources. Feedback memory +
> T48 (backfill adoption verdict on prior product-repos) saved. **Next session
> priorities: (1) Step 13 paradigm/scoped synthesize test + Step 15
> code-reviewer audit to close synthesis-consolidation PLAN; (2) T48 backfill or
> /deep-plan Rank 1 eval harness; (3) license check on GitNexus for
> trial-install decision.** Branch: `planning-41426`.

> **Increment this counter** at the start of each AI work session. **Note**:
> Session count may exceed "Recent Session Summaries" entries; review-focused
> sessions may not add major feature entries.

---

## Recent Session Summaries

**Session #283** (REMOTE SYNC + `/ANALYZE` SKILL-AUDIT + ECOSYSTEM VALIDATOR FIX
— 1 COMMIT):

- **Branch**: `41526` (1 commit ahead of `origin/main`, unpushed until
  session-end)
- **Commits**: `f1668a09` (feat(skills): /analyze v1.2 → v2.0 + ecosystem
  SKILL_STANDARDS compliance — 21 files, +3893/-3189 lines).
- **Arc**: /session-begin → goal #1 discovered DONE (PR #513 already merged) →
  goal #2 `/analyze` audit executed via `/skill-audit analyze --mode=single` →
  scope expansion approved mid-Phase 4 (USER-REQ-2 ii: fix ecosystem validator
  gap surfaced during Phase 2.5).
- **`/analyze` audit results**: 12 categories, 67 decisions, 0 rejected, 1
  revised (Cat 5 C REJECTED at Phase 2.5 — line 15 path `shared/CONVENTIONS.md`
  was already correct). Score 70/110 Fair → 98/110 Excellent (projected). Top
  concerns remediated: Cat 12 Completion Verification 1/10 → 9/10 (new
  self-audit.js), Cat 5 Integration 6/10 → 9/10 (required sections added), Cat 7
  Prompt Engineering 6/10 → 9/10 (Critical Rules moved to top third, RFC 2119
  MUST/SHOULD applied).
- **New artifacts**: `scripts/skills/analyze/self-audit.js` (326 lines,
  --target=\<slug\> + --all regression modes, dims 1/3/4/5/8/9 covered, 6+7
  skipped with rationale), REFERENCE.md §6.6 Failure Recovery Matrix, §7
  Routing-Decision Log schema at `.claude/state/analyze-routing-log.jsonl`.
- **Ecosystem scope expansion (USER-REQ-2 ii)**: Phase 2.5 discovered
  `npm run skills:validate` was silently passing 1 file for months due to two
  compounding bugs — (a) scope-limited to `.claude/commands/` only; (b) YAML
  parser treated `description: >-` and implicit multi-line continuations as
  empty. Extended: (1) scope added `.claude/skills/*/SKILL.md`, (2) YAML parser
  handles `>-`, `|`, and implicit multi-line, (3) REQUIRED_SKILL_MD_SECTIONS
  enforced with errors (not warnings). 11 non-analyze SKILL.md files updated to
  comply: deep-research (split combined heading), document/media/repo/website-
  analysis (inline NOT → ##), pr-retro (inline → ##), recall (2 new sections),
  frontend-design (title added), sonash-context (title + 3 sections), repo- and
  website-synthesis DEPRECATED stubs (minimal sections).
- **Verification**: `skills:validate` 1→78 files scanned; 51→0 errors.
  `scripts/skills/skill-audit/self-audit.js --target=analyze` overall PASS (0
  must_failed). `scripts/skills/analyze/self-audit.js --target=MinerU` PASS;
  `--all` regression surfaces 3 pre-existing known-bad slugs (synthesis meta,
  surya, tesseract) as FAILs — not new regressions.
- **Skill-creator crosscheck**: NO content gaps found. skill-creator v3.3+
  already requires self-audit.js scaffolding and required sections. Gap is
  **enforcement-at-creation**, not creator spec. /analyze v1.0 created Session
  #269 before v3.3 landed, explaining why it slipped through.
- **Cross-cutting USER-REQs**: 5 captured, all resolved in session (shared vs
  \_shared path verified correct; validator gap fixed; Cat 4 C/D/E walkback
  available for future; --target=<slug> semantics = one slug, --all =
  regression; v2.0 bump per handler pattern).
- **Next session priorities**: (1) push commit `f1668a09` to `origin/41526`
  - open PR with breaking-change callouts (SKILL_STANDARDS enforcement change
    affects any skill that doesn't comply); (2) T28 Step A remaining CAS skills
    (recall, synthesize); (3) T28 Step B E2E `/recall` verification; (4) T28
    closure. `/analyze` audit no longer blocking T38.

---

**Session #282** (SKILL-AUDIT BATCH `2026-04-15-analysis-quartet` — 7 WAVES, 9
COMMITS):

- **Branch**: `41526` (9 commits ahead of origin, ready to push + PR)
- **Commits**: `ccddea68` (Wave 1 foundation: \_shared/TAG_SUGGESTION.md +
  CONVENTIONS §18 Prior Feedback Replay + repo-analysis/ARCHIVE.md), `927c22f7`
  (Wave 2 repo-analysis v5.0, **breaking: phase 4b→3.5**), `b9df4ab8` (Wave 2
  website-analysis v2.0), `07b41daa` (Wave 2 document-analysis v2.0, **breaking:
  Cat 2-E + Pattern 10 phase renumber**), `2b3309a8` (Wave 2 media-analysis
  v2.0, **breaking: phase 4b→3.5**), `8bf4de31` (Wave 4 /analyze v1.2 handoff
  contract formalized), `2ae89115` (Wave 5 T28 tagline cleanup across CAS
  family), `dd4157a3` (Wave 6: 4 per-skill self-audit.js scripts), `397a9635`
  (Wave 7 validation: fix validatePathInDir arg order + graceful ENOENT).
- **Resumed paused batch from Phase 4 Wave 1**. Parent state file preserved 17
  cross-skill decisions across 15 patterns from prior discovery / Phase 3
  challenge waves. User confirmed judgment calls for each wave (version bumps,
  phase renumbers, line-count tolerance, script-last sequencing).
- **All 4 CAS handler SKILL.md files rewritten** with: /analyze router ack,
  Warm-up block, Routing Guide table, PHASE N of M markers, Delegation &
  Defaults table, consolidated top-5 Guard Rails, scope-explosion soft prompts
  (repo >100 curated-list entries / site >50 pages / doc >100 pages / media
  > 60 min), Done-when gates on MUST phases, Tag Suggestion body replaced with
  > `_shared/TAG_SUGGESTION.md` reference, Prior Feedback Replay pointer to
  > CONVENTIONS §18, enriched invocation tracking, NEW Integration + Retro +
  > Invocation sections for document + media (previously missing), output lists
  > reformatted as tables, REFERENCE.md absorption of Content Eval / Coverage
  > Audit / Extraction Tracking detail.
- **4 new self-audit scripts** under `scripts/skills/<name>/self-audit.js` —
  wrap shared `scripts/cas/self-audit.js` floor per SELF_AUDIT_PATTERN.md, add
  skill-specific checks (repomix / meta.json / deep-read.md / transcript.md
  - transcript_source). Validation bug found and fixed during Wave 7:
    validatePathInDir arg order was swapped; graceful missing-file handling via
    fs.existsSync pre-check.
- **COMMAND_REFERENCE.md bumped** through v8.3 → v8.10 with one entry per wave.
  T28 tagline cleanup in recall + synthesize descriptions; /synthesize "(T29)"
  title suffix removed; analyze REFERENCE §4.3 Handler Availability updated to
  current v2.0/v5.0 Mature status.
- **Line counts** (SKILL.md, aspirational 300-line target missed, justified by
  new sections): repo-analysis 661→563; website-analysis 371→385 (+15 net with
  much richer content); document-analysis 288→426 (gap-fill: +138); media-
  analysis 315→462 (gap-fill: +147).
- **Known follow-ups deferred**: full /analyze audit (separate skill-audit run),
  5 skill-creator gaps (TAG_SUGGESTION shared-template guidance, prior- feedback
  replay pattern, soft-prompt-vs-hard-block distinction, /analyze router ack
  guidance, Warm-up + PHASE N of M in UX checklist).
- **Smoke-test**: repo-analysis self-audit against
  `.research/analysis/archivebox-archivebox/` — source_type PASS, repomix FAIL
  (legitimate: repomix-output.txt is gitignored), phase_ordering WARN
  (legitimate: no state file). Script works as designed.

**Session #279** (TRIAGE 4 FIXED + T29 PLAN CLOSED + AUTO-RENDER HOOK + CAS
HYGIENE):

- **Branch**: `planning-41426` (5 commits this session pre-/session-end)
- **Commits**: `8ec88846` (triage #1-#4 + DEBT-45653 — 21 files), `9787b418`
  (T29 PLAN closure: Step 13 + Step 15 + 8 audit fixes — 8 files), `b13bd2c4`
  (TODOS.md auto-render hook — 6 files), `8a0f71a3` (T29 PLAN.md mark all 15
  steps complete — 2 files), `8ec75ce7` (close stale T29/T37/T40 + CAS PLAN
  hygiene + handoff doc — 5 files).
- **/session-begin triage** (5 items, 4 fixed, 1 info-skipped): F1 github-
  health P0 (Backlog Enforcement weekly fail) → DEBT-45653 + cross-ref
  DEBT-0891/0398 with recurrence note. F2 reviews disposition × 3 → parser
  filter for total>0 with zero dispositions + empty placeholders, removed 3 stub
  records, added #508 to KNOWN_SKIPPED_IDS. F3 rendered-view drift → manual
  patch + structural fix (render-reviews-to-md.ts auto-updates Doc Health
  Monitoring table). F4 roadmap:hygiene B3+S4 false positives → matcher
  tightened (word-boundary + structural marker preceding ID).
- **T29 synthesis-consolidation PLAN CLOSED**: All 15 steps marked ✅. Step 13
  functional verification (option B, no full-run clobber): 13a `--type=repo`
  filter PASS (26 in / 9 out); 13b `--paradigm=matrix` PASS (Zod + REFERENCE
  - 4 markers). Step 15 code-reviewer audit: 8 findings, ALL FIXED — F1 banner
    v1.0 → v1.2; F2 `opportunitySchema.title_key` optional; F3 new
    `opportunityLedgerRecord` schema validates 17/17 existing ledger rows; F4
    wording; F5 Routing Guide table added; F6 website-synthesis path correction;
    F7 covered by F3; F8 double-warning clarification.
- **TODOS.md auto-render hook**: Discovered .md was 2 sessions stale (T47 + T48
  invisible behind "Show all?" prompt). Built `post-todos-render.js` PostToolUse
  hook (governance-logger pattern, `if:` filter scoped to todos.jsonl).
  Documented in TRIGGERS.md + DEVELOPMENT.md.
- **CAS PLAN hygiene**: T28 PLAN.md got top status banner + 13 ✅ + 2 ⏳
  markers. Same drift pattern that bit T29 PLAN.
- **Stale todos closed**: T29 (synthesis consolidation, in-progress P1 →
  completed); T37 (GitNexus exploration P3 → completed, analyzed Session #278);
  T40 (CAS tag taxonomy P2 → completed, full retag migration shipped Sessions
  #275-#276). Counts: 27 → 24 active, 20 → 23 completed.
- **/deep-plan template gap discovered**: REFERENCE.md PLAN.md template (lines
  119-154) has no status banner, no per-step ✅ markers, no hygiene rules.
  Tracked as T49 (P2 pending). 3-part fix in REMAINING_CAS_TASKS.md.
- **Handoff doc**: `.planning/content-analysis-system/REMAINING_CAS_TASKS.md` —
  full plan to close T28 (Steps A/B/C), optional follow-ups, /deep-plan fix
  details, resume protocol.
- **Schema deltas** (`scripts/lib/analysis-schema.js`): added optional
  `title_key` to opportunitySchema; new `opportunityLedgerRecord` (16 fields,
  status enum, nested deferred_to). Exports updated. 17/17 existing ledger rows
  validate.
- **Pre-existing schema drift flagged** (NOT addressed): synthesisRecord vs
  current synthesis.json — sources_included items are strings vs schema expects
  objects, opportunity_matrix has free-form fields. Needs separate
  reconciliation task.
- **Retro**: Skill-flow worked smoothly. Triage #2 had a misstep (deletion
  approach broke things; reverted via git checkout, root-caused parser bug
  upstream, then proper fix). Per-finding pause-and-confirm pattern caught scope
  creep at the right moments.

**Session #278** (T29 STEP 12 COMPLETE + /REPO-ANALYSIS v4.6 + GITNEXUS):

- **Branch**: `planning-41426` (post-merge of PR #510, 1 prior commit `c92103cb`
  - session-end batch)
- **Prior commits this session**: `c92103cb` (archive 12 completed
  planning/research items + state drift).
- **Planning/research cleanup**: Archived 12 items (T40, Wave 5 agents,
  website-analysis, orphan-detection, 6 T39 md files, learning-system-
  effectiveness research, learning-analysis brainstorm, github-health research,
  unified-content-intelligence stub, worktree-management stub, analysis-
  synthesis-comparison). Kept active: plan-orchestration, multi-layer-memory,
  research-discovery-standard, content-analysis-system, synthesis-
  consolidation, dev-dashboard, jason-os, skill-convergence, debt-runner-
  expansion, repo-analysis, t28-\*, system-wide-standardization, creator-
  view-upgrade.
- **GitNexus repo-analysis** (corpus source #33): Standard depth. 2,213 files,
  643K repomix tokens. 4 dimension agents ran (security Adequate 68,
  architecture Clean 87, documentation Excellent 92, testing Robust 85). 22
  candidates (6P / 5K / 7C / 4A-P). Creator Healthy 82, Adoption Healthy 64,
  classification active-sprint, use-as-is verdict **Trial** (license
  NOASSERTION + 3 S2 security + no incremental re-index). Generated 7 new vocab
  tags (knowledge-graph, graph-rag, precomputed-intelligence, mcp-
  contract-block, signs-pattern, tree-sitter, wasm). Vocabulary 180 → 187.
- **Skill gap discovered mid-session**: user asked "where is the install-as-is
  verdict?" — Creator View spec had 6 sections focused on pattern extraction but
  no install-as-is answer. Backfilled Section 2b into GitNexus artifacts
  (creator-view.md + analysis.json adoption\_\* fields + summary.md scoring
  table).
- **/repo-analysis SKILL.md v4.5 → v4.6**: Section 2b Use-As-Is Verdict now
  MUST-produce when taxonomic tag is application/framework/tool-demo. New
  analysis.json fields documented: `adoption_verdict`
  (Adopt/Trial/Extract-only/Avoid), `adoption_blockers`,
  `adoption_recommendation`.
- **Memory**: Saved `feedback_adoption_verdict_in_creator_view.md` + indexed in
  MEMORY.md feedback section.
- **T48 todo created**: Backfill Use-As-Is Verdict on ~20 prior product-repo
  analyses in `.research/analysis/`. P2 pending.
- **T29 Step 12 incremental synthesis test**: `/synthesize` ran in incremental
  mode. Menu correctly detected 1 new Standard source. Previous Wave 5 synthesis
  archived to `history/synthesis-2026-04-13-wave5-baseline.{md,json}`. New
  synthesis.md (10.9K) + synthesis.json (108K) generated. Changes Since
  Previous: 4 themes strengthened, 1 theme added weak, 22 candidates added (16
  high-relevance), 2 gaps partially closed, 2 gaps reinforced, 1 confidence
  shift, source impact high. 33 Standard sources got `last_synthesized_at`
  updated. Ledger: 5 new rows upserted (Rank 1 = Build eval harness, the S-tier
  Challenge), 12 prior preserved, 17 total. Self-audit 10/10 PASS. **All 7 Step
  12 requirements PASS.**
- **SQLite index rebuilt**: 35 sources, 343 extractions, 280 tags, 0 FK
  violations.
- **Step status (synthesis-consolidation PLAN)**: Step 11 ✅ (Wave 5), Step 12
  ✅ (this session), Step 14 effectively ✅ (earlier verify). Remaining: Step 13
  (paradigm/scoped test), Step 15 (code-reviewer audit).
- **Retro**: User rated incremental synthesis output as "looks good." No
  weak/missing sections flagged.

**Session #277** (T29 STEP 10.5 CLOSED + WAVE 5 SYNTHESIS SHIPPED):

- **Branch**: `planning-41326` (15 commits this session on top of main)
- **Commits**: `2b63c79d` (Cat A+D+G), `84c34324` (Cat C), `f97f4a06` (Cat
  J+K+L), `c1dcd170` (Cat E), `803dc343` (Cat F4-gists), `6886d05b` (Cat H),
  `8c9599cd` (Cat B3), `db6a04b8` (Cat F4-composio re-analysis), `bfb2a6c6`
  (self-audit expansion), `f515acb3` (Cat E-extend + dedupe), `577667ab`
  (one-shot scripts cleanup), `1271adea` (3 description fills), `d1a2e30d`
  (aws-media promote quick→standard), `3936c5f1` (Wave 5 synthesis), `1dbeb891`
  (opportunities 1+2 + T47 + ledger + SKILL.md v1.1).
- **Step 10.5 remediation sprint (10 commits)**: Resolved 8 audit categories
  (A+D+G, C, E, F4 gists+composio, H, B3, I3 deferrals) + 3 unenumerated drifts
  surfaced during remediation (J absence_patterns, K gist candidate shape, L
  description backfill) + Cat E-extend (archivebox + public-apis surfaced by new
  strict check). Full-corpus self-audit: **31/31 PASS** with 8 new Step 10.5
  checks folded into `scripts/cas/self-audit.js` (5a, 5c, 6a, 6b, 6c, 7b, 7c, 8;
  skipped 5b heuristic; retired 7a per B3). Schema relaxed: `absence_patterns`
  now accepts string OR object form.
- **Wave 5 `/synthesize` full run**: 32-source corpus (excluded surya,
  tesseract). 4 parallel agents × 8 slices → 196 raw themes, 313 raw candidates.
  Merge + keyword-topic clustering: **20 meta-theme clusters** (10 strong 5+, 6
  medium 3-4, 4 weak 1-2) + 16 absence signals. Top convergence: extraction
  pipelines (16), plugin/hook governance (14), testing/coverage (14), Claude
  Code platform (13), agent orchestration (10 multi-directional), memory systems
  (10), MCP surface (7). Biggest gap: recovery-community UX (3-agent
  confirmation — entire corpus is tech- infrastructure biased; SoNash's product
  domain unaddressed). Wrote synthesis.md (prose, 8 sections) + synthesis.json
  (Zod-validated), updated `last_synthesized_at` on all 32 sources, rebuilt
  SQLite index (273 tags, 0 FK violations). 12-entry opportunity matrix ranked
  with routes.
- **Opportunities adopted**: Rank 1 — `scripts/docs/generate-llms-txt.js` +
  `llms.txt` (77 skills, 17 KB, Jeremy Howard 2024-09 spec). Rank 2 —
  `scripts/check-slopsquat.js` prototype (HEAD-checks npm registry for all deps;
  soft-warn only, NOT yet pre-commit). Rank 4 — deferred to todo T47 (Wave 6 CAS
  source seed: Sober Grid, I Am Sober, InTheRooms, 42 CFR Part 2, Firebase
  reference, TS MCP SDK, whisper.cpp, monolith, readable-cli, SBOM).
- **New tracking infrastructure**:
  `.research/analysis/synthesis/ opportunities-ledger.jsonl` (mirrors
  extraction-journal.jsonl pattern). Keyed by normalized `title_key`, status
  enum (pending/adopted/skipped/ deferred/stale). Persists across synthesis
  re-runs. Seeded with all 12 Wave 5 opportunities (2 adopted, 1 deferred to
  T47, 9 pending). SKILL.md `synthesize` v1.1 documents the schema, status
  lifecycle, write-path rules. eslint.config.mjs extended to allowlist new CJS
  scripts.
- **Retro**: (1) "Good overall. Many repos chosen specifically for CAS research,
  so low immediate adoption expected — synthesis is useful for consolidation
  even without new surprises." (2) "Looks good for now. Only time will tell."

**Session #276** (T40 COMPLETE + T29 WAVE 4 STEP 10 CLOSED):

- **Branch**: `planning-41226`
- **Commits — Phase A (6, already landed)**: `f300e3fb` (Part A), `7975f77b`
  (chore), `ac2fc999` (Part B1-B3), `b2f22b37` (Part C + B fix), `d5ed65b3`
  (retag migration), `24ec6eae` (chore). **Phase B commit pending session-end.**
- **Session arc**: Continued from pre-/clear checkpoint. Goal was to execute the
  approved CAS tag quality plan. User pushed for full automation mid- session
  when the scope of manual retag became clear ("find a way to automate this").
  Design pivoted to agent-dispatched parallel retag with strict vocabulary
  discipline. User attention minimized to design approval and post-dedupe vocab
  decision approval.
- **Part A — source-fix**: CONVENTIONS.md §14 rewritten (taxonomic vs semantic,
  minimum 3 semantic tags with no upper cap, expanded forbidden list, 8-category
  vocabulary
  `domain/technology/concept/technique/pattern/ applicability/quality/taxonomic`,
  vocabulary-first growth rules). Tag Suggestion sections in 4 handler SKILL.md
  files aligned. `tag- vocabulary.json` scaffolded.
- **Part B — retag CLI + seed vocab**: `scripts/cas/retag.js` with
  `apply --batch-file` / `validate` subcommands, `--dry-run` flag. Pure
  mutations extracted to `scripts/lib/retag-mutations.js`. Locked writes
  (pattern from `todos-cli.js`), atomic per-batch, regression guards, SQLite
  index rebuild. 97-tag seed vocabulary + 10 synonyms + 13 forbidden entries.
- **Part C — /recall category-aware display**: Results enriched with
  `semantic_tags` (grouped by category), `taxonomic_tags`, `orphan_tags`.
  `--stats` gained vocabulary breakdown + top tags per category + orphan /
  legacy counts. Synonym auto-resolution during display. Pattern- compliance fix
  folded in (structuredClone replacing JSON deep-clone, `n` → `count` rename).
- **Retag migration (automated)**:
  - Phase 1: 31 source-scoped agents in 6 waves. Each read creator- view.md +
    journal entries for its source. Each produced a batch JSON with discipline
    rules enforced.
  - Phase 2: Aggregated 89 proposed new vocab across sources. Semantic dedupe:
    10 merges became synonyms (speech-to-text→transcription, audio-
    video-extraction→media-extraction, pdf-processing→document-extraction,
    dependency-pinning→version-pinning, async-polling→async-task-api,
    queue-systems→background-jobs, self-describing-registry→registry,
    dynamic-discovery→auto-discovery, plus 2 more). 1 drop (marketplace). 2
    category conflict resolutions (transcription=domain, api-versioning=
    pattern). 78 new vocab tags landed.
  - Phase 3: 31 batches applied via `retag.js apply`. Two entry-level agent
    errors caught by `<3 semantic` guard (compromise.js NLP + MinerU technical
    report) — manually patched. Second pass clean.
- **Final state** (`retag.js validate --strict` → exit 0): 295/295 retagged. 0
  forbidden / 0 unknown / 0 <3-semantic / 0 zero-tag violations. Top
  applicability: jason-os-relevant=133, cas-relevant=95, sonash-relevant=65.
- **Memory saved**: `feedback_no_blanket_count_labels.md` — don't use
  frequency-based terms like "singleton" as category labels; describe substance,
  not count.
- **Design decisions (in-session)**:
  - Option B (three-way subject split) chosen for §14.3 categories.
  - Minimum tag rules: ≥3 semantic, no upper cap (user rejected "1 per batch"
    contrived limit).
  - Forbidden list expanded beyond plan's literal source-type to include
    entry-type values + `tool`.
  - Automation via agent dispatch after user direction: "find a way to automate
    this".
- **Audit trail**: `.planning/cas-tag-quality/batches/proposal-*.json` (31
  files) + `aggregated-new-vocab.json` preserved for retro.
- **Phase B — T29 Wave 4 Step 10 CLOSEOUT** (continued after T40):
  - `/repo-analysis https://github.com/jina-ai/reader` Standard run. 14
    candidates (3 patterns, 3 anti-patterns, 2 architecture-patterns, 3
    knowledge, 2 content, 1 knowledge/anti-pattern duplicate). Creator lens 72
    Healthy, adoption lens 42 Needs Work. Surfaced 3 S0 security findings
    (unvalidated `x-proxy-url`, `injectFrameScript` raw `fetch` with
    `setBypassCSP(true)`, global `SSL_VERIFYPEER=false`), zero tests, private
    submodule lock. 5 new vocab proposed + accepted (`puppeteer`, `cloud-run`,
    `html-to-markdown`, `tls-fingerprinting`, `multi-provider-fallback`).
    Vocabulary 175 → 180. Security dimension agent stalled mid-investigation;
    resumed via `SendMessage` per prior memory guidance.
  - Wave 4 Step 10 audit caught qmd/analysis.json in mixed
    nicholasgasior-quick/tobi-standard state (top-level fields stale, 18 journal
    entries + 8 Standard artifacts correct). §14.8 source-consistency violation
    would have made qmd invisible to `/synthesize` pre-flight. Rebuilt: new UUID
    `6b81e586-6cbe-4652-858c-4ccd995f983a`, source `tobi/qmd`, depth `standard`,
    18 candidates, 16 semantic tags. Journal entries linked to new UUID.
  - User decision: **surya + tesseract remain quick by decision** (preview-only
    per §17.6). Wave 4 Step 10 **CLOSED** = 10/12 upgraded + 2 skipped.
  - Orphan cleanup: deleted 4 quick dirs superseded by Standard twins (reader,
    nitter, marker, ArchiveBox). All had 0 linked journal entries.
  - `rebuild-index.js` → 34 sources / 309 extractions / 270 unique tags.
    `generate-extractions-md.js` → 309 candidates / 32 sources.
  - Synthesis corpus = **31 Standard sources**.
  - `_quick-scan-upgrade.md` checklist and `.planning/todos.jsonl` T29 progress
    both updated.
- **WHERE TO RESUME**: Push `planning-41226` → create PR → `/pr-review` cycle.
  After merge, **T29 Step 10.5** full-corpus audit (30 Standard sources pending;
  only firecrawl audited so far). Then **Wave 5** `/synthesize` E2E run.

---

## Quick Status

| Item                               | Status        | Progress                                                                                              |
| ---------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| **Orphan Detection (T21)**         | SCANNER DONE  | 428 findings, 110 resolved. `npm run orphans:detect`.                                                 |
| **Website Analysis (T23)**         | SKILLS BUILT  | /website-analysis + /website-synthesis skills created.                                                |
| **Repo Analysis Skill**            | v5.0 ACTIVE   | Phase 4b→3.5 breaking rewrite (Session #282). Warm-up + Routing Guide + Delegation + self-audit.js.   |
| **Website Analysis Skill**         | v2.0 ACTIVE   | Session #282 rewrite: Warm-up + Routing Guide + scope-explosion (>50 pages) + self-audit.js.          |
| **Document Analysis Skill**        | v2.0 ACTIVE   | Session #282 breaking rewrite: Cat 2-E + Pattern 10 phase renumber, NEW Integration/Retro/Invocation. |
| **Media Analysis Skill**           | v2.0 ACTIVE   | Session #282 rewrite: transcript.md MUST per §13.3, NEW Integration/Retro/Invocation + self-audit.js. |
| **T28 Content Analysis System**    | E2E DONE      | 33 Standard sources (GitNexus added #278), 343 unique candidates. Vocabulary 187 tags.                |
| **T29 Synthesis Consolidation**    | STEP 12 DONE  | Steps 11-12 PASS. Step 14 effectively done. Remaining: Step 13 (paradigm/scoped), Step 15.            |
| **Wave 5 Opportunity Ledger**      | 17 ENTRIES    | 12 Wave 5 + 5 new from #278 incremental. Rank 1 (eval harness) is the new S-tier.                     |
| **T40 CAS tag quality**            | COMPLETE      | Session #276.                                                                                         |
| **T39 Hook Drift Loop**            | CLOSED        | Session #275. Needs new PR (deferred).                                                                |
| **Research-Discovery-Standard v2** | IN-PROGRESS   | T13 plan updates needed.                                                                              |
| **Plan Orchestration**             | WAVE 1 DONE   | Waves 2-3 blocked on debt-runner.                                                                     |
| **Dev Dashboard**                  | IN-PROGRESS   | Started #245, XL effort.                                                                              |
| **debt-runner Expansion**          | RESEARCH DONE | /deep-plan next. Gates plan-orchestration Waves 2-3.                                                  |
| **Multi-layer Memory**             | RESEARCH DONE | 40 agents, 128 claims. Execution next.                                                                |
| **JASON-OS (Claude Code OS)**      | RESEARCHING   | Brainstorm + roadmap done. 16-domain research program.                                                |
| **T48 Adoption Verdict Backfill**  | NEW #278      | Backfill Section 2b on ~20 prior product-repo analyses.                                               |

**Current Branch**: `41526` (9 commits ahead of origin, skill-audit batch
complete)

**Test Status**: 3720 pass, 0 fail, 1 skip (last verified Session #275)

**Todos**: 48 total, 13 pending — run `/todo` to manage. T48 added Session #278
(adoption-verdict backfill).

**Active ROADMAP Tracks** (see
[ROADMAP.md §5](./ROADMAP.md#5--active-sprint-operational-visibility-p0)): Track
B (Dev Dashboard, in progress), Track T (Testing Infrastructure, Phase 1 done),
Track C (UI/UX, planned), Track D (CI Reliability, planned), Track E (Solo Dev
Automations, planned), Track P (Performance Critical, planned), Track O (Owner
Actions, manual setup).

---

## Next Session Goals

### Immediate Priority

1. **Open PR for branch 41526 + push** — Session #283 commit `f1668a09` (21
   files, +3893/-3189). PR body should call out: (a) `/analyze` v1.2 → v2.0
   structural rewrite (67-decision audit); (b) NEW
   `scripts/skills/analyze/ self-audit.js`; (c) **BREAKING** for ecosystem:
   `scripts/validate-skill- config.js` now errors on `.claude/skills/*/SKILL.md`
   missing REQUIRED sections (previously silently passing 1 file) — 11 other
   SKILL.md files brought into compliance in this PR, but any in-flight skill
   creation needs to include When to Use / When NOT to Use / Version History or
   it fails validate. Session #282 breaking-change phase-renumber note
   (repo/doc/media 4b → 3.5) already merged in PR #513.

2. **Close T28 — CAS Step A remaining skills** (recall, synthesize). /analyze
   done in Session #283. /skill-audit infrastructure battle-tested. Tracker T38
   still blocked on T28 closure.

3. **Close T28 — CAS Step B: E2E `/recall` verification** on a fresh source.
   `/analyze <new-url>` → handler → SQLite refresh → `/recall` queries (tag,
   type, FTS5, cross-source) → verify extraction-journal + last_synthesized_at.
   ~15-30 min. See REMAINING_CAS_TASKS.md Step B.

4. **Step C — T28 closure**: flip T28 todo to completed, update CAS PLAN.md
   banner to ✅ COMPLETE, unblock T38, SESSION_CONTEXT note.

5. **T48 Adoption Verdict backfill** — retroactively apply Creator View Section
   2b to ~20 prior product-repo analyses (application/framework/tool-demo
   taxonomic). Parallelizable via agents (1 per repo). Could pair naturally with
   Step A skill-audit since both touch the same artifacts.

6. **T49 — Fix /deep-plan template gap** (discovered Session #279). 3-part fix:
   (a) update REFERENCE.md PLAN.md template with status banner + per-step
   markers; (b) update SKILL.md Critical Rule for plan hygiene maintenance; (c)
   add `npm run plans:hygiene` checker. Prevents future drift in any new PLAN.md
   created via /deep-plan.

7. **T47 — Wave 6 CAS source seed** (created Session #277) — Queue 10 gap-fill
   sources (Sober Grid, I Am Sober, InTheRooms, 42 CFR Part 2, Firebase
   reference, TS MCP SDK, whisper.cpp, monolith, readable-cli, SBOM). Method:
   `/analyze` each, then `/synthesize --resume` to diff against current
   baseline.

8. **/deep-plan Rank 1 opportunity: Build eval harness for agent-capability
   measurement** — S-tier insight from GitNexus analysis. 3-mode SWE-bench
   shape, per-instance cached by `(repo, commit)`. SoNash adaptation: curated
   scenarios from review history + extraction journal, pattern-aware vs
   pattern-unaware agent comparison.

9. **GitNexus trial** (if license resolves permissive) — license check → install
   on throwaway branch → use for one real task → adopt/extract decision.

10. **Remaining Wave 5 opportunity matrix items** — entries pending status
    update in ledger (marketplace.json distribution, bidirectional doc-feature
    validator, zero-schema MCP, OAuth-filter MCP, skill retirement spec, etc.).

11. **T45** — Hook-based skill compliance enforcement (5 highest-risk skills).
12. **T46** — Cross-locale memory sync STRATEGY (research only).
13. **T42** — Nous Research Hermes model series research (P3).
14. **Dev dashboard implementation (T2)** — IN-PROGRESS since Session #245, XL.
15. **debt-runner `/deep-plan` (T3)** — Research done, needs plan.
16. **Multi-layer memory (T4)** — Research done.
17. **JASON-OS Domain 02a (T16)** — Brainstorm complete.

### Backlog (run `/todo` for full list — see TODOS.md, ~25 active, 48 total)

---

## Pending PR Reviews

**Status**: No pending reviews.

**Last Processed**: 2026-04-05 (Session #264)

---

## Known Issues

### Resolved in Session #263 (PR #493)

1. ~~**Missing velocity script**~~ — RESOLVED. Removed Step 7a row from
   `.claude/skills/session-end/SKILL.md` (script was intentionally removed in
   Session #260, caller was missed). Also removed velocity rows from
   `DEVELOPMENT.md` in PR #493 R1.
2. ~~**session-end-commit.js uses legacy skip flags**~~ — RESOLVED. Added
   `SKIP_REASON="automated session-end commit — only SESSION_CONTEXT.md"` to the
   env object at `scripts/session-end-commit.js:244` (user-authorized wording
   per CLAUDE.md Guardrail #14).
3. ~~**`.claire/worktrees/` not in .gitignore**~~ — RESOLVED. Added `.claire/`
   to `.gitignore` alongside `.claude/worktrees/`.

### Open

4. **Persistent cognitive-cc + trigger hook warnings** — tracked as
   **DEBT-45635**. Pre-push reports `cognitive-cc` errored (exit 2) and
   `triggers` flagged "Skill/agent files modified" on commits that don't touch
   skill/agent files. Trigger detector matches commit history beyond the current
   push diff. Requires investigation of `scripts/check-cc.js` exit 2 and the
   trigger detector's detection window.

## Pending Manual Actions

- Set up GitHub repository variables (Settings -> Secrets and variables ->
  Variables) for `NEXT_PUBLIC_FIREBASE_*` values. The preview deploy workflow
  now uses `vars.*` instead of `secrets.*` for these public config values.

---

## Blockers Resolved

### SonarCloud Cleanup Sprint (RESOLVED - Session #85)

PR 1-2 completed. Remaining work (PR 3-5) deferred to M2. Feature development
unblocked.

---

## Essential Reading

1. **[ROADMAP.md](./ROADMAP.md)** - Overall project priorities
2. **[AI_WORKFLOW.md](./AI_WORKFLOW.md)** - How to navigate documentation
3. **[AI_REVIEW_PROCESS.md](docs/AI_REVIEW_PROCESS.md)** - PR review process
4. **[TRIGGERS.md](./docs/TRIGGERS.md)** - Automation and enforcement mechanisms

**For deeper context**: [ARCHITECTURE.md](./ARCHITECTURE.md) |
[SECURITY.md](./docs/SECURITY.md) | [ROADMAP_LOG.md](./ROADMAP_LOG.md)

---

## Technical Context

### Stack

- Next.js 16.2.0, React 19.2.4, TypeScript 5.x
- Tailwind CSS v4, Framer Motion 12
- Firebase (Auth, Firestore, Functions, App Check)

### Key Commands

```bash
npm run dev          # Start dev server
npm test             # Run tests (3,646 total, 0 failures)
npm run lint         # Check code style
npm run build        # Production build
npm run patterns:check  # Anti-pattern detection
npm run docs:check   # Documentation linting
```

### Current Branch

- **Working on**: As specified by user
- **Main branch**: `main`
- **Default for PRs**: Create feature branches with
  `claude/description-<sessionId>` format

---

---

## Version History

| Version | Date | Changes |
| ------- | ---- | ------- |

| 8.8 | 2026-03-24 | Session #236 — Wave 0 + agent-env complete, SWS gate
cleared | | 8.7 | 2026-03-24 | Session #235 — Plan orchestration research
scrapped, redo needed | | 8.6 | 2026-03-23 | Session #234 — CLI tools +
statusline research + plan housecleaning | | 8.5 | 2026-03-22 | Session #233 —
/deep-research skill, ecosystem integration |

[Full version history](docs/SESSION_HISTORY.md#version-history-archived-from-session_contextmd)
