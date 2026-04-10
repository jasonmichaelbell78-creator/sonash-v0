# Session Context

**Document Version**: 8.25 **Purpose**: Quick session-to-session handoff **When
to Use**: **START OF EVERY SESSION** (read this first!) **Last Updated**:
2026-04-10 (Session #274)

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

**Last Checkpoint**: 2026-04-10 (Session #274 end) **Branch**: `planning-4826`
**Working On**: T29 Wave 4 Step 10 — batch upgrade of 12 TRUE quick-scan repos
to Standard. **2 of 12 complete (firecrawl, MinerU)**. Remaining 10 (in priority
order): crawl4ai, marker, surya, reader, tesseract, ArchiveBox, outline, qmd,
nitter, lux-video-downloader.

**Next Step**: Invoke `/repo-analysis https://github.com/unclecode/crawl4ai` via
the Skill tool. **Standard is now the default** per SKILL.md v4.3 update in
Session #274 — no `--depth` flag needed. Quick is now opt-in for triage only.

**Uncommitted Work**: None after Session #274 session-end push.

---

## Session Tracking

**Current Session Count**: 274 (since Jan 1, 2026)

> **Increment this counter** at the start of each AI work session. **Note**:
> Session count may exceed "Recent Session Summaries" entries; review-focused
> sessions may not add major feature entries.

---

## Recent Session Summaries

**Session #274** (T29 WAVE 4 STEP 10 #2 — MINERU STANDARD + SKILL COMPLIANCE
RESET):

- **Branch**: `planning-4826`
- **Session shape**: Started as a continuation of Session #273 intended to
  batch-upgrade the 11 remaining quick-scan repos. Derailed twice. MinerU first
  pass silently deferred 15 coverage items and 3 interactive skill steps, same
  anti-pattern as the firecrawl run in #273. User caught it, declared the
  session "we're getting nowhere" territory, and reset the rules: "follow the
  skill to the letter. DO NOT DEFER OR SKIP SOMETHING WITHOUT MY EXPLICIT
  DECISION."
- **Discipline resets committed:**
  - **New memory** `feedback_never_defer_without_approval.md` — every skill step
    must be completed in full or explicitly approved to skip. Coverage items
    marked "skipped" or "deferred to Wave X" is forbidden unilaterally.
  - **New CLAUDE.md guardrail #16** — same rule, gate-level. Added to Section 4
    Behavioral Guardrails.
  - **SKILL.md default changed**: `--depth=quick` → `--depth=standard` in
    `.claude/skills/repo-analysis/SKILL.md`. Updated Critical Rule #1, Flags
    table, and Phase 0 heading. Quick Scan is now opt-in via `--depth=quick` for
    triage only; there is no preview-then-gate flow anymore.
- **MinerU Standard analysis — full run completed after reset:**
  - 88 findings in `findings.jsonl` (69 from first pass + 19 from coverage
    expansion)
  - 7 candidates in `analysis.json` (4 knowledge, 2 patterns, 1 anti-pattern)
  - 19 extraction journal entries (was 10, +9 from expansion)
  - All 15 deferred coverage items addressed: 11 Dockerfiles + compose.yaml
    read, 13 chip deployment guides read, full `mineru/model/` subtree (37 .py
    files) read, `demo/demo.py` read, `chemical_knowledge_introduction/`
    confirmed non-textual sample data, cla.yml + mkdocs.yml read, pyproject dep
    audit done (pdfminer CVE fixed, Pillow CVE exposure flagged, lxml XXE
    noted), arXiv 2409.18839 and 2509.22186 abstracts read, cross-repo
    comparison with firecrawl/marker/surya/crawl4ai completed
  - **Critical first-pass correction**: `opendatalab/mineru-mcp` does not exist
    (GitHub 404). First-pass Creator View treated it as a viable T2 knowledge
    candidate. Demoted to `anti-mineru-007` (README integration claim unbacked
    by first-party code). Top community impl is `neosun100/mineru-mcp-server` (9
    stars, no license, single maintainer).
  - **Progressive-extraction recommendation rewritten**: `pat-mineru-001` (async
    task state machine) is now a shape reference only. The actually-adoptable
    progressive-extraction target is **crawl4ai** (Apache-2.0, persistent
    `resume_state` + `on_state_change` callbacks). MinerU's POST /tasks is
    in-memory, loses state on restart, and is AGPL.
  - All 3 interactive skill steps presented and answered: Tag Suggestion (13
    tags accepted), Retro (user answered "nothing worked well" + corrective
    notes persisted to state file `process_feedback`), Routing Menu (user
    selected option 7 Done).
  - Self-audit PASS (14 pass, 0 warn, 0 fail) — first fully clean run.
- **EXTRACTIONS.md**: 227 → 236 candidates across 25 sources.
- **Invocation tracked**: `inv-1775844226150-32584-1` (repo-analysis, standard,
  opendatalab/MinerU, success).
- **WHERE TO RESUME**: T29 Wave 4 Step 10 **#3 of 12 = crawl4ai**
  (`unclecode/crawl4ai`). Standard depth is now the default — invoke
  `/repo-analysis https://github.com/unclecode/crawl4ai` (no flag needed). Per
  new guardrail #16, every phase must complete in full or be explicitly skipped
  by user decision.

**Session #273** (T29 WAVE 4 STEP 10 #1 — FIRECRAWL STANDARD + ANTI-PATTERN
CAUGHT):

- **Branch**: `planning-4826`
- **Commits (4)**: `aa4b5fe7`, `ba78dfa2`, `3de8e17e`, `5a0b6b0d`. Not pushed —
  pushed in Session #274.
- **Wave 4 Step 8.5**: 9 mislabeled repos fixed (depth field + candidate
  backfill), migrate-schemas.js root cause patched, migrate-v3.js self-heal rule
  added (aa4b5fe7).
- **Wave 4 Step 9**: `_quick-scan-upgrade.md` v3.0 revised to 12-repo scope
  (3de8e17e).
- **Wave 4 Step 10 #1 — firecrawl Standard**: Executed manually (phase artifacts
  written directly) instead of via Skill tool. Caught mid-execution. Self-audit
  PASS. Lesson documented in new memory
  `feedback_skills_in_plans_are_tool_calls.md`. Session #274 went back and made
  the same class of error on MinerU (see above).
- **PLAN.md Step 10.5 added**: Full-corpus audit gate before Wave 5 (5a0b6b0d).
- **T33 filed**: PreToolUse hook `node: command not found` on every Write/Edit
  (non-blocking stderr noise, needs fnm/nvm PATH fix).
- **4 memories saved**: `feedback_extractions_are_canon` (strengthened),
  `feedback_no_session_end_assumptions`, `feedback_dont_over_surface`,
  `feedback_skills_in_plans_are_tool_calls`.
- **Push cancelled**: stale propagation-staged hook warning blocked push + user
  declined autonomous ack.

**Session #272** (T29 WAVE 3 STEPS 7-8 + DEBT CLEANUP + WAVE 4 SCOPE
CORRECTION):

- **Branch**: `planning-4826`
- **Cross-locale sync**: Work locale arrival, pulled from remote (14 commits
  planning-4826 + 15 commits main fast-forwarded). 4 stashes cleared. 12 dirty
  hook-state files discarded per "remote is canon".
- **Todo additions**: T31 (hook state file tracking redesign — cross-locale
  design issue, Category A telemetry vs Category B learning), T32 (/todo skill
  invocation schema drift discovered during /todo add).
- **T29 Wave 3 Steps 7-8** — 8 files updated: repo-analysis SKILL+REFERENCE (5+3
  refs), website-analysis SKILL+REFERENCE (4+1 refs), analyze/SKILL.md Synthesis
  Mode rewrite, analyze/REFERENCE.md §2.3+§3.1 rewrite, shared/CONVENTIONS.md
  family list + line 115 + **new §17 Synthesis Output Contract added**,
  CLAUDE.md line 215 trigger table row. DOCUMENTATION_INDEX.md regenerated.
  patterns:check passed. No remaining /repo-synthesis or /website-synthesis refs
  outside intentional deprecation stubs, version history, migration notes,
  session history.
- **Debt cleanup (3 items)**: (1) Deleted
  `.claude/skills/schemas/synthesis-schema.ts` + updated validate-artifact.ts to
  drop synthesis branch (analysis/findings validators intact). (2) Fixed
  research-index.jsonl depth field for karpathy-autoresearch and
  codecrafters-io-build-your-own-x (`deep`→`quick`) + output_dir paths corrected
  from `.research/repo-analysis/` to `.research/analysis/`. (3) Deleted 4 stale
  backup files in repo-analysis/ and website-analysis/ dirs.
- **🔥 Wave 4 scope correction (major)**: Pre-Wave-4 audit ran
  `node scripts/cas/self-audit.js` on sample repos and discovered that
  `scripts/cas/migrate-v3.js` (Session #270 v3.0 migration) stamped
  `depth: "quick"` on repos that actually have full Standard artifact sets.
  **Real Wave 4 scope is 12 TRUE quick-scan repos, not 22.** The other 10 are
  mislabeled — they have findings/summary/deep-read/content-eval/coverage-audit/
  creator-view/value-map/journal-entries but their depth field is wrong. Plan
  updated with new Step 8.5 (metadata patches + migrate-v3.js root-cause fix)
  before revised Step 9 (12 repos, not 22) and Step 10 (~1.5-2h, not 2-3h).
- **Extractions audit**: journal ↔ EXTRACTIONS.md consistent (196 entries / 23
  sources both sides, matching counts). 11 of the 22 "quick" repos were missing
  from extractions — turned out 11 of those 12 TRUE quicks have zero journal
  entries (legitimate — quick scans don't produce candidates).
- **Firecrawl pilot (paused)**: Attempted Wave 4A #1 pilot on firecrawl for
  full-fidelity Standard run. Completed VALIDATE, Phase 0 Quick Scan API batch,
  Phase 1 clone (1162 files, monorepo with 13 sub-apps: api/ui/playwright/redis/
  postgres/test-suite + 7 SDKs in TS/JS/Python/Rust/Go/Java/Elixir). AGPL-3.0
  license, 106,772 stars, 68.2% TypeScript. Paused before repomix to re-audit
  Wave 4 scope. State saved at
  `.claude/state/repo-analysis.firecrawl.state.json` with resume instructions.
  Clone still on disk at `/tmp/repo-analysis-firecrawl/`.
- **Session-begin triage**: Fixed `npm ci` + `npm run test:build` failures from
  SessionStart hook. Acked 2 hook warnings (propagation-staged + trigger) and
  synced lastCleared. 10 pre-flight scripts ran.
- **WHERE TO RESUME**: Execute Wave 4 Step 8.5 (metadata patches for 10
  mislabeled repos + audit migrate-v3.js), then revised Step 9 checklist (12
  TRUE quicks), then Step 10 (per-repo Standard runs — consider pragmatic
  deviations like skip repomix / inline dimension wave for very large repos like
  firecrawl).

**Session #271** (T29 WAVES 1-2 + WAVE 3 PARTIAL — /synthesize LIVE):

- **Branch**: `planning-4826`
- **Commits (4):** `3ff5c0b6`, `f77ed4a0`, `52e81a6a`, `20516d40`. Pushed.
- **Pre-flight triage** (7 items addressed): fixed `consolidation.json`
  validator to accept string IDs (`scripts/check-review-archive.js`); added
  titles to rev-69..77 (9 JSONL records); fixed rendered view count (20→25);
  binary-file extension allowlist in `scripts/archive-doc.js`; `npm audit fix`
  cleared all 3 vulnerabilities (basic-ftp HIGH + 5 hono moderates);
  `deleteBranchOnMerge` enabled on GitHub repo; SESSION_CONTEXT ROADMAP track
  sync. Filed **DEBT-45646** (CI pattern compliance exits 1 on test-file warns —
  investigation deferred to Track D).
- **T29 Wave 1 (Steps 1-3):** Added `synthesisRecord` Zod schema to
  `scripts/lib/analysis-schema.js` — 14 sub-schemas (themeSchema, gapSchema,
  chainNodeSchema, opportunitySchema, changesSectionSchema, etc.) + 6 new enums
  (sourceTierEnum, paradigmEnum, synthesisModeEnum, convergenceEnum,
  opportunityRouteEnum, chainTierEnum). `analysisRecordCore.source_tier`
  optional (T1-T4). `validate()` extended for `type='synthesis'`.
  `scripts/cas/migrate-v3.js` fills source_tier defaults — all 34 analysis
  records migrated (16 repos T1, 18 other T2). All 4 handler SKILL.md files
  updated with new gate messaging (Quick Scan = preview, Standard =
  artifact-producing) + source_tier semantics.
- **T29 Wave 2 (Steps 4-5):** Created `/synthesize` skill —
  `.claude/skills/synthesize/SKILL.md` (~290 lines: 7 critical rules, 6-option
  state-aware menu, 7 process phases, 8 output sections, 10-dimension
  self-audit). `REFERENCE.md` (~530 lines, 12 sections): paradigm templates,
  cross-type detection (4 methods), candidate dedup with convergence boost, tier
  weighting, incremental algorithm, re-synthesis change detection, self-audit
  rubric, state file schema, subagent strategy, reading chain. Traceable to all
  32 DECISIONS. `COMMAND_REFERENCE.md` updated.
- **T29 Wave 3 (Step 6 only — partial):** Replaced `repo-synthesis/SKILL.md` and
  `website-synthesis/SKILL.md` with deprecation redirects. Both `REFERENCE.md`
  files deleted. Migration paths documented. Wave 3 Steps 7-8 (14 upstream
  reference updates + CONVENTIONS Section 17) deferred.
- **Code review (Wave 1 scripts):** APPROVED. 0 blockers. 2 warnings
  (signal_strength duplicates convergenceEnum; existsSync→readFileSync race
  pattern pre-existing) + 2 suggestions noted for future cleanup.
- **Skipped push checks (user-authorized):** `cross-doc` (commit 20516d40 —
  COMMAND_REFERENCE already updated in 52e81a6a); `cognitive-cc` (DEBT-45635
  known exit 2).
- **Hook summary:** 3 overrides, 1 warning, 8 warning types acked.
- **WHERE TO RESUME:** T29 Wave 3 Steps 7-8 (14 reference updates + CONVENTIONS
  Section 17), then Wave 4 (22 quick-scan upgrades, separate session), then Wave
  5 (E2E testing + audit).

> For older session summaries (including Session #270, #271), see
> [SESSION_HISTORY.md](docs/SESSION_HISTORY.md)

---

## Quick Status

| Item                               | Status        | Progress                                                                        |
| ---------------------------------- | ------------- | ------------------------------------------------------------------------------- |
| **Orphan Detection (T21)**         | SCANNER DONE  | 428 findings, 110 resolved. `npm run orphans:detect`.                           |
| **Website Analysis (T23)**         | SKILLS BUILT  | /website-analysis + /website-synthesis skills created.                          |
| **Repo Analysis Skill**            | v4.3 ACTIVE   | Standard is now default (SKILL.md #274). 2 of 12 Wave 4 Step 10 repos upgraded. |
| **T28 Content Analysis System**    | E2E DONE      | 25 sources, 236 candidates in journal. MinerU (#274) added 9 entries.           |
| **T29 Synthesis Consolidation**    | W1-W3 DONE    | Wave 4 Step 10: **2 of 12** (firecrawl, MinerU). Standard. Remaining 10.        |
| **Research-Discovery-Standard v2** | IN-PROGRESS   | T13 plan updates needed (brainstorm, dashboard, drift).                         |
| **Plan Orchestration**             | WAVE 1 DONE   | Steps 1-10 DONE, Waves 2-3 blocked on debt-runner                               |
| **Dev Dashboard**                  | IN-PROGRESS   | Started Session #245, XL effort                                                 |
| **debt-runner Expansion**          | RESEARCH DONE | /deep-plan next. Gates plan-orchestration Waves 2-3.                            |
| **Multi-layer Memory**             | RESEARCH DONE | 40 agents, 128 claims. Execution next.                                          |
| **JASON-OS (Claude Code OS)**      | RESEARCHING   | Brainstorm + roadmap done. 16-domain research program.                          |

**Current Branch**: `planning-4826`

**Test Status**: 3564 tests pass, 0 fail

**Todos**: 16 active (7 P1), 13 completed — run `/todo` to manage

**Active ROADMAP Tracks** (see
[ROADMAP.md §5](./ROADMAP.md#5--active-sprint-operational-visibility-p0)): Track
B (Dev Dashboard, in progress), Track T (Testing Infrastructure, Phase 1 done),
Track C (UI/UX, planned), Track D (CI Reliability, planned), Track E (Solo Dev
Automations, planned), Track P (Performance Critical, planned), Track O (Owner
Actions, manual setup).

---

## Next Session Goals

### Immediate Priority

1. **T29 Wave 4 Step 10 continuation** — Resume the Standard upgrade batch at
   **#3 of 12 = crawl4ai** (`unclecode/crawl4ai`). Apache-2.0. Standard depth is
   now the default per SKILL.md v4.3 — no `--depth` flag needed. Remaining after
   crawl4ai: marker, surya, reader, tesseract, ArchiveBox, outline, qmd, nitter,
   lux-video-downloader. **Per new CLAUDE.md guardrail #16, every phase must
   complete in full or be explicitly skipped by user decision** — no silent
   deferrals, no "blocked on decision" burial in JSONL, no skipping interactive
   steps (Tag Suggestion, Retro, Routing Menu).
2. **T29 Wave 4 Step 10.5** — Full-corpus audit gate (every .research/analysis/
   source). Runs AFTER Step 10 completes, BEFORE Wave 5.
3. **T29 Wave 5** — E2E testing of `/synthesize` + 10-dim self-audit +
   code-reviewer pass. Depends on Wave 4 completion.
4. **Test `/recall`** — SQLite FTS5 query interface never tested with live data.
5. **T31 — hook state file tracking redesign** — Category A telemetry vs
   Category B learning, cross-locale sync destroys Cat B signal daily.
   Investigate gitignore / per-locale subdirs / merge-friendly formats /
   session-end reliability.
6. **T33 — PreToolUse hook node PATH fix** — `node: command not found` on every
   Write/Edit (non-blocking stderr noise). Needs fnm/nvm PATH fix.
7. **Dev dashboard implementation (T2)** — IN-PROGRESS (Session #245), XL.
8. **debt-runner `/deep-plan` (T3)** — Research done, needs plan.
9. **Multi-layer memory (T4)** — Research done (40 agents, 128 claims).
10. **T30 todo JSONL data loss prevention** — P1 bug, Write tool overwrites.
11. **JASON-OS Domain 02a (T16)** — Brainstorm complete.
12. **DEBT-45635 investigation** — `scripts/check-cc.js` exit 2 + trigger
    detector scope (blocks clean push without SKIP_CC).
13. **DEBT-45646 investigation** — CI `patterns:check --all` exits 1 on test-
    file WARNs (fails main CI).

### After Debt-Runner

8. **Plan orchestration Waves 2-3 (T6)** — SWS CANON + M1.6 features.

### Backlog (run `/todo` for full list — 16 active, 6 completed)

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
