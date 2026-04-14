## Summary

Bundles 9 commits across two work sessions (#278 + #279) that close the T29
synthesis-consolidation PLAN, add a corpus source via `/repo-analysis` v4.6, fix
4 of 5 `/session-begin` triage items, prevent future TODOS.md drift via a new
auto-render hook, and clean up planning hygiene across both T29 + T28 PLAN
files. **No production-app code touched** — entirely tooling, planning, state,
schema, hooks, and analysis artifacts.

**Headline outcomes:**

- T29 synthesis-consolidation PLAN: **ALL 15 STEPS ✅ COMPLETE**
- T28 (CAS) PLAN: **13/15 ✅ marked**, 2 ⏳ remain (Step 14 audit, Step 15 E2E)
- New corpus source #33 added (GitNexus) at Standard depth
- New `opportunityLedgerRecord` Zod schema (validates 17/17 existing rows)
- 1 new debt item created (DEBT-45653 — Dependabot npm_and_yarn fails)
- 3 stale todos closed (T29, T37, T40); 1 new todo created (T49 — fix /deep-plan
  template gap)
- Skill version bumps: `/synthesize` v1.0 → v1.2; `/repo-analysis` v4.5 → v4.6

---

## Commits in chronological order (oldest first)

### 1. `c92103cb` chore: archive 12 completed planning/research items + state drift (Session #278)

Archived 12 completed planning/research directories that were cluttering active
work areas: T40 cas-tag-quality, Wave 5 synthesis-wave5-agents, website-analysis
test fixtures, orphan-detection, 6 T39 hook-ecosystem files,
learning-system-effectiveness research, learning-analysis brainstorm,
github-health research, unified-content-intelligence stub, worktree-management
stub, analysis-synthesis-comparison.

Kept active per user decision: plan-orchestration (Wave 2+ pending),
multi-layer-memory (more research), research-discovery-standard,
content-analysis-system, synthesis-consolidation, dev-dashboard, jason-os,
skill-convergence, debt-runner-expansion, repo-analysis, t28-\*,
system-wide-standardization, creator-view-upgrade.

### 2. `0847aa6a` feat(T29): Step 12 complete + /repo-analysis v4.6 + GitNexus analysis (Session #278)

**Three things in one commit:**

**(a) GitNexus analyzed as corpus source #33** (Standard depth). 27K-star
TypeScript monorepo shipping zero-server client-side code intelligence with
multi-IDE MCP support (Claude Code, Cursor, Codex, Windsurf, OpenCode) and a
SWE-bench eval harness. 22 candidates extracted (6 patterns / 5 knowledge / 7
content / 4 anti-patterns). 37 tags. Creator Healthy 82, Adoption Healthy 64,
Use-As-Is verdict **Trial** (license NOASSERTION + 3 S2 security findings + no
incremental re-index are the blockers).

7 new vocabulary tags added (180 → 187): `knowledge-graph`, `graph-rag`,
`precomputed-intelligence`, `mcp-contract-block`, `signs-pattern`,
`tree-sitter`, `wasm`. Extraction journal +22 entries. EXTRACTIONS.md 309 → 343
candidates across 33 sources. SQLite index rebuilt (35 sources, 343 extractions,
280 tags, 0 FK violations).

**(b) /repo-analysis SKILL.md v4.5 → v4.6.** Discovered mid-session that the
Creator View spec had no explicit "would SoNash install and use this repo
as-is?" section — only pattern/knowledge extraction. Critical gap for
product-type repos (application/framework/tool-demo). Added Section 2b:
Use-As-Is Verdict as MUST-produce when taxonomic tag is in {application,
framework, tool-demo}. New analysis.json fields: `adoption_verdict`
(Adopt/Trial/Extract-only/Avoid), `adoption_blockers`,
`adoption_recommendation`. Backfilled into GitNexus artifacts immediately.

**(c) T29 Step 12 incremental synthesis test.** Ran `/synthesize` in incremental
mode. Menu correctly detected 1 new Standard source. Previous Wave 5 synthesis
archived to `history/synthesis-2026-04-13-wave5-baseline.{md,json}`. New
synthesis.md (10.9K) + synthesis.json (108K) generated with "Changes Since
Previous" as lead section: 4 themes strengthened, 1 added weak (graph-backed
code intelligence), 22 candidates added (16 high-relevance), 2 gaps partially
closed, 2 new gaps, 1 confidence shift, source impact = high. Opportunities
ledger upserted: 5 new rows (Rank 1 = "Build eval harness for agent-capability
measurement" — the S-tier insight from GitNexus Creator View Challenge). 12
prior preserved → 17 total. All 7 Step 12 requirements PASS. Self-audit 10/10
PASS.

T48 todo created (P2): backfill Use-As-Is Verdict on ~20 prior product-repo
analyses.

### 3. `d942a708` chore: post-commit hook drift (Session #278 close)

Auto-regenerated after Session #278 main commit: `llms.txt` (1-line metadata
refresh), `.claude/state/review-metrics.jsonl`,
`.claude/state/warned-files.json`. Standard hook-state batching pattern.

### 4. `8ec88846` feat(session-279): /session-begin triage #1-#4 — reviews + roadmap-hygiene fixes + DEBT-45653

**Closes 4 of 5 triage items surfaced by /session-begin pre-flight scripts.**

**Triage #1 — github-health P0 (Backlog Enforcement weekly cron failing):**

- Created **DEBT-45653** for the orthogonal Dependabot npm_and_yarn auto-update
  workflow failure (separate from the Backlog Enforcement issue).
- F1 (Backlog Enforcement) cross-referenced to existing **DEBT-0891** (workflow
  obsolete post-TDMS) + **DEBT-0398** (pattern checker non-blocking 93+
  violations); recurrence evidence (3 weekly failures: Mar 30, Apr 6, Apr 13)
  captured in `.claude/state/github-health-history.jsonl` notes field.
- Triage state persisted to
  `.claude/state/task-github-health-triage.state.json`.

**Triage #2 — review-lifecycle disposition violations (3 S2 records):**

- Tightened `parseMarkdownReviews()` in `scripts/review-lifecycle.js` to filter
  (i) integrity-failing records (mirrors `validateDispositions()` criterion:
  total > 0 but dispositions all 0) and (ii) empty placeholders (zero
  everything + no patterns/learnings). Common source: prose lines like "N items"
  matching the total fallback regex; legacy historical entries in the Patterns
  section of `AI_REVIEW_LEARNINGS_LOG.md`.
- Removed 3 stub records from `.claude/state/reviews.jsonl` (id=508 PR#499,
  id=85 PR#508, id='86-pr509' PR#509). Real data preserved in companions rev-66,
  rev-85, id='86'.
- Added #508 to `KNOWN_SKIPPED_IDS` in `scripts/check-review-archive.js` with
  provenance comment so the gap-coverage validator stops flagging the deleted
  numeric ID.

**Triage #3 — rendered-view drift S3 ("25 active reviews vs 26 headings"):**

- Manual patch: `~2048` → `~5330` (lines), `25` → `23` (active reviews) in line
  1294-1295 of `AI_REVIEW_LEARNINGS_LOG.md`.
- Structural fix: `scripts/reviews/render-reviews-to-md.ts` now auto-updates the
  Document Health Monitoring table on every RENDER (regex replace, bounded
  inputs, no ReDoS risk). Main log lines rounded to nearest 10 to keep diffs
  minimal. Prevents future drift.

**Triage #4 — roadmap:hygiene false positives (B3 + S4):**

- Tightened `scanCommitsForCompletions` matcher in
  `scripts/check-roadmap-hygiene.js`: word-boundary + structural marker
  preceding the ID (`(`, `[`, `#`, `:`, or start-of-line). Eliminates
  context-suffix false positives like "Cat B3", "Step T29" without losing
  structured refs like `(B3)`, `#T29`, `B3:`.
- Trade-off: false negatives for natural-language refs ("completes B3").
  Acceptable per skill scope-explosion guard.

**Triage #5 — hooks:analytics 8 false-positive overrides:** Skipped (info-only
audit recommendation, not actionable in triage scope).

**State drift batched:** SESSION_CONTEXT.md (counter 278 → 279), TDMS views
auto-regenerated for DEBT-45653, hook-warnings-ack.json with 4 type acks bumped
(jsonl-sync, agent, tdms-s0, review-lifecycle) + lastCleared synced,
review-metrics.jsonl reconciled (PR 499 round count corrected after stub
removal), `AI_REVIEW_LEARNINGS_LOG.md` re-rendered Active Reviews section (23
records).

### 5. `9787b418` feat(T29): synthesis-consolidation PLAN COMPLETE — Step 13 + Step 15 + 8 audit fixes

**Step 13 — Test scoped synthesis (PASS via functional verification):**

- 13a `--type=repo` filter: 35 sources analyzed → 26 repos IN, 9 non-repos OUT
  (6 websites: composio + 4 gists + sidbharath; 1 document; 2 youtube).
- 13b `--paradigm=matrix`: Zod `paradigmEnum` includes 'matrix' (line 57 of
  `analysis-schema.js`); REFERENCE.md §1.3 documents matrix structure
  (rows=sources, columns=dimensions, cells=values,
  reading-chain-becomes-routing). All 4 contract markers PASS.
- Functional verification chosen over full-run testing to preserve baseline
  `synthesis.json` from Session #278 (a full-run would clobber today's baseline
  for the same evidence). Results persisted to
  `.research/analysis/synthesis/test-step13/RESULTS.md` + ESM `test.js`
  (re-runnable).

**Step 15 — code-reviewer audit (8 findings, ALL FIXED):**

| #   | Sev | Area        | Fix                                                                                                                                                                                                 |
| --- | --- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | P1  | conventions | `synthesize/SKILL.md` status banner v1.0 → v1.2                                                                                                                                                     |
| F2  | P1  | schema      | `opportunitySchema.title_key` added (optional — current writers compute on-the-fly during ledger upsert)                                                                                            |
| F3  | P1  | schema      | `opportunityLedgerRecord` Zod schema added (16 fields). Includes `ledgerStatusEnum` (pending/adopted/skipped/deferred/stale) and nested `deferredToSchema`                                          |
| F4  | P2  | redirect    | `repo-synthesis` redirect "the same 6 outputs ... plus 2 new ones" reframed as "8 output sections supersetting the 6"                                                                               |
| F5  | P2  | conventions | `synthesize/SKILL.md` gains a Routing Guide table                                                                                                                                                   |
| F6  | P2  | redirect    | `website-synthesis` redirect output-path corrected. Was claiming paths "remain the same" but git history confirms parent dir was consolidated `website-analysis/synthesis/` → `analysis/synthesis/` |
| F7  | P3  | schema      | covered by F3's `deferredToSchema`                                                                                                                                                                  |
| F8  | P3  | conventions | `synthesize/SKILL.md` "2 sources of same type" line clarified to note double warning                                                                                                                |

**Verification:** 17/17 existing `opportunities-ledger.jsonl` rows validate
against the new Zod schema. `opportunityLedgerRecord` correctly REJECTS rows
missing title_key.

**Pre-existing schema drift FLAGGED (not addressed here):** `synthesisRecord`
does not validate the current `synthesis.json` — `sources_included` items are
strings vs schema expects objects, and `opportunity_matrix` entries have
free-form fields (`notes_new`, `evidence_sources`) that the schema doesn't
model. This drift predates Session #279 and was outside Step 15 audit scope.
Tracked for separate reconciliation task.

### 6. `b13bd2c4` fix(hooks): auto-render TODOS.md from todos.jsonl on Write/Edit

**Problem:** `.planning/TODOS.md` was last regenerated in commit `6a3eb32e`
(Session #277), 2 sessions ago. Since then T47 (Wave 6 CAS seed) and T48
(Adoption Verdict backfill) were appended to canonical `.planning/todos.jsonl`
but the .md view never got refreshed — so the user-facing list was missing 2
active todos. SessionStart hook reported "26 active" but only top 10 by priority
show in /todo's default view, so P2 todos like T47/T48 fell behind a "Show all?
(y/n)" prompt. Same drift pattern caught in triage #3 (rendered review view).

**Fix:** New PostToolUse Write/Edit/MultiEdit hook
`.claude/hooks/post-todos-render.js` that fires only when the user writes/edits
`.planning/todos.jsonl`, then runs `scripts/planning/render-todos.js` and
`git add`s the regenerated TODOS.md so the .md stays in lockstep with the .jsonl
on every commit.

Wired into `.claude/settings.json` with an `if:` filter scoped to that exact
file path — same pattern as the existing governance-logger hook for CLAUDE.md +
settings.json. Failures are non-blocking (log to stderr, exit ok) so a broken
renderer never blocks a Write/Edit operation.

Documented in:

- `docs/TRIGGERS.md` hooks table updated (alongside governance-logger)
- `DEVELOPMENT.md` "PostToolUse Hooks (Write/Edit — governance)" table updated
  with condition pattern `Write/Edit/MultiEdit(.planning/todos.jsonl)`

### 7. `8a0f71a3` docs(T29): mark all 15 PLAN steps complete with session anchors

PLAN.md tracking was uneven — only Steps 8.5, 13, 15 had ✅ markers in their
section headers. The other 13 steps (1–7, 8, 9, 10, 10.5, 11, 12, 14) were
functionally complete (per SESSION_CONTEXT.md and shipped commits) but had no
in-file marker.

Added:

- Top-level status banner:
  `✅ COMPLETE (all 15 steps, Sessions #269–#279, closed 2026-04-14)` with a
  1-line wave-by-wave summary.
- Per-step ✅ COMPLETE markers in section headers, each with session
  attribution. Anchors enable future readers to walk from PLAN to commit history
  quickly.

### 8. `8ec75ce7` chore(CAS): close stale todos T29/T37/T40 + CAS PLAN hygiene + handoff doc

**Stale todo closures (3):**

- **T29** (Synthesis consolidation, P1, in-progress) → completed (closed earlier
  this session, all 15 sub-steps marked ✅).
- **T37** (Explore GitNexus, P3, pending) → completed (analyzed Session #278, in
  corpus as source #33).
- **T40** (CAS tag taxonomy, P2, pending) → completed (full retag migration
  shipped Sessions #275-#276 — 295 entries, 78 new vocab; SESSION_CONTEXT.md
  v8.29 = "T40 complete handoff").

Counts: **27 → 24 active**, **20 → 23 completed** (TODOS.md auto-rendered).

**CAS PLAN.md hygiene update** — T28 PLAN file had no status tracking despite 13
of 15 steps being functionally complete. Same drift pattern T29 PLAN had. Added
top status banner (⏳ NEAR-COMPLETE — 13 of 15 steps done) with wave-by-wave
summary + corpus snapshot (35 sources, 343 candidates, 280 tags, 17 ledger
entries). Marked Steps 1-13 ✅ with session anchors. Steps 14 (skill-audit,
tracker T38) + 15 (E2E /recall verification) marked ⏳ PENDING.

**New handoff document:**
`.planning/content-analysis-system/REMAINING_CAS_TASKS.md` —

- Full step-by-step plan to close T28 (Steps A/B/C)
- Optional follow-ups (T47, T48, T42)
- **Documented `/deep-plan` template gap discovered today:** PLAN.md template at
  REFERENCE.md:119-154 has no status banner, no per-step markers, no hygiene
  rules — explains why both T29 and T28 PLANs needed manual backfilling.
  Three-part fix recommended (update template + add SKILL.md Critical Rule + add
  `npm run plans:hygiene` checker, parallel to `roadmap:hygiene`).
- Resume protocol for next session.

### 9. `ae699350` chore: Session #279 close — /session-end pipeline (state drift + TDMS regen + SESSION_CONTEXT)

Session-end batch covering all pending changes after the substantive commits:

**SESSION_CONTEXT.md updated (v8.32 → v8.33):**

- Quick Recovery rewritten for Session #279 (5 phases summarized).
- Session #279 handoff blockquote added (preserves #278 below per 3-session
  retention).
- Recent Session Summaries: full Session #279 entry added with all commits +
  retro.
- Next Session Goals rewritten — top priority is now CAS Step A/B/C to close
  T28; T49 (deep-plan template gap) added; goals re-ordered around now-closed
  T29 + T30.
- Backlog count updated to ~25 active / 48 total.

**TDMS regen (via session-end Phase 3 metrics scripts):**

- `consolidate-all.js` + `generate-metrics.js` ran clean.
- S0/S1 deltas: **26/1374 → 4/1269** (substantial reduction from session work +
  reconciliation).
- Views regenerated: by-category, by-severity, by-status, verification-queue.
- INDEX.md, METRICS.md, metrics.json, normalized-all.jsonl all updated.
- LEGACY_ID_MAPPING.json + dedup-log + metrics-log refreshed.

**Ecosystem health:** Composite trend 62 → 67 (+5, improving). New flags:
hook-pipeline-health D/67, learning-effectiveness F/0, review-quality D/67 — all
noted for next session triage.

**T49 added** (P2 pending) — Fix /deep-plan template (status banner + per-step
✅ markers + plans:hygiene checker). Tracks the gap discovered during today's
plan-hygiene work.

---

## Schema deltas (`scripts/lib/analysis-schema.js`)

```diff
+ // Optional title_key on snapshot opportunities
  const opportunitySchema = z.object({
    rank: z.number().int().positive(),
    title: z.string(),
+   title_key: z.string().max(60).optional(),
    description: z.string(),
    effort: effortEnum,
    impact: z.enum(["low", "medium", "high"]),
    evidence: z.array(z.string()),
    suggested_route: opportunityRouteEnum,
  });

+ // NEW: opportunities ledger row schema
+ const ledgerStatusEnum = z.enum(["pending", "adopted", "skipped",
+                                   "deferred", "stale"]);
+ const deferredToSchema = z.object({
+   type: z.enum(["todo", "roadmap", "milestone"]),
+   id: z.string(),
+   file: z.string().optional(),
+ }).nullable();
+ const opportunityLedgerRecord = z.object({
+   title_key: z.string().max(60),
+   rank: z.number().int().positive(),
+   title: z.string(),
+   first_seen_in_run: z.string(),
+   last_seen_in_run: z.string(),
+   runs_seen: z.number().int().positive(),
+   status: ledgerStatusEnum,
+   effort: effortEnum,
+   impact: z.enum(["low", "medium", "high"]),
+   suggested_route: opportunityRouteEnum,
+   evidence_sources: z.array(z.string()),
+   adopted_at: z.string().nullable(),
+   adopted_to: z.string().nullable(),
+   commit_sha: z.string().nullable(),
+   deferred_to: deferredToSchema.optional(),
+   notes: z.string().nullable(),
+ });

  module.exports = {
    ...
+   opportunityLedgerRecord,
+   deferredToSchema,
    ...
+   ledgerStatusEnum,
  };
```

---

## Skill version bumps

| Skill            | Was  | Now      | Why                                                                                                                                                                                                                  |
| ---------------- | ---- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/synthesize`    | v1.0 | **v1.2** | v1.1 = opportunities ledger Phase 5 step 5 (Session #277). v1.2 = Step 15 audit fixes (Session #279): Routing Guide added, double-warning clarified, status banner sync.                                             |
| `/repo-analysis` | v4.5 | **v4.6** | Section 2b Use-As-Is Verdict MUST-produce for product repos (application/framework/tool-demo). New analysis.json fields: `adoption_verdict`, `adoption_blockers`, `adoption_recommendation`. Backfilled on GitNexus. |

---

## New files of note

- `.claude/hooks/post-todos-render.js` — auto-render hook (~80 lines, ESLint
  clean, ESM-via-CJS-shim per project convention)
- `.planning/content-analysis-system/REMAINING_CAS_TASKS.md` — handoff doc (~160
  lines)
- `.research/analysis/abhigyanpatwari-gitnexus/*` — full Standard analysis
  artifact set (14 files: analysis.json, creator-view.md, deep-read.md,
  summary.md, value-map.json, content-eval.jsonl, coverage-audit.jsonl,
  findings.jsonl, dimensions/{architecture, documentation, security,
  testing}.md)
- `.research/analysis/synthesis/test-step13/{RESULTS.md, test.js}` — Step 13
  evidence + re-runnable functional test
- `.research/analysis/synthesis/history/synthesis-2026-04-13-wave5-baseline.{md,json}`
  — archived Wave 5 baseline before incremental synthesis ran

---

## Files NOT in this PR

Two files modified post-push, intentionally batched with next session:

- `.claude/hook-warnings.json`
- `.claude/state/hook-warnings-log.jsonl`

Both are auto-tracked hook state and will land in the next /session-end commit.

---

## Test plan

- [ ] `git checkout planning-41426 && git pull --ff-only`
- [ ] `npm install` (no dep changes expected)
- [ ] `npm run patterns:check` — should pass
- [ ] `npm run reviews:lifecycle` — VALIDATE should PASS (was 4 findings, now 0)
- [ ] `npm run roadmap:hygiene` — should show all ✅ (was 1 ⚠️ false positive)
- [ ] `node scripts/planning/render-todos.js` — should regenerate TODOS.md
      cleanly
- [ ] Schema parse smoke test:
      `node -e "require('./scripts/lib/analysis-schema.js').opportunityLedgerRecord; console.log('schema present')"`
- [ ] Existing 17 `.research/analysis/synthesis/opportunities-ledger.jsonl` rows
      validate via the new schema
- [ ] Manual: edit `.planning/todos.jsonl` via Edit tool — verify the new
      post-todos-render hook fires and auto-stages TODOS.md
- [ ] Manual: open `.planning/synthesis-consolidation/PLAN.md` — verify all 16
      step headers have ✅ markers + top status banner
- [ ] Manual: open `.planning/content-analysis-system/PLAN.md` — verify 13 ✅ +
      2 ⏳ markers + top status banner
- [ ] Manual: open `.planning/content-analysis-system/REMAINING_CAS_TASKS.md` —
      verify handoff doc is complete with 3 steps (A/B/C) + optional
      follow-ups + /deep-plan template gap analysis

---

## Risks / known issues

1. **Pre-existing schema drift** — `synthesisRecord` Zod schema does not match
   what `/synthesize` actually writes to `synthesis.json`. NOT addressed here
   (predates Session #279, outside scope). Needs separate reconciliation task.

2. **DEBT-45635 hook warnings** (cognitive-cc + triggers exit-2 noise) —
   appeared in pre-push output as warnings. Pre-existing, tracked separately.

3. **CAS PLAN Step 14 + Step 15 still pending** — T28 (parent CAS) is at 13/15
   steps. Closing requires the work outlined in
   `.planning/content-analysis-system/REMAINING_CAS_TASKS.md` (Steps A/B/C).
   This PR makes the remaining work clearly visible but does not perform it.

4. **`.planning/` artifacts in PR** — this PR includes planning + research
   artifacts (handoff doc, PLAN.md updates, `.research/analysis/` corpus
   additions). The codebase has a `gsd:pr-branch` skill that filters
   `.planning/` for review-focused PRs, but per user instruction this PR
   includes everything for full traceability.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
