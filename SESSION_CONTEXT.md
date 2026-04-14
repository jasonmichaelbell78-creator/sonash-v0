# Session Context

**Document Version**: 8.32 **Purpose**: Quick session-to-session handoff **When
to Use**: **START OF EVERY SESSION** (read this first!) **Last Updated**:
2026-04-13 (Session #278 — T29 Step 12 COMPLETE + /repo-analysis v4.6 + GitNexus
analysis)

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

**Last Checkpoint**: 2026-04-13 (Session #278 — /session-end in progress).
**Branch**: `planning-41426`. **Working On**: T29 Step 12 COMPLETE,
`/repo-analysis` v4.6 shipped with Section 2b Use-As-Is Verdict, GitNexus
analyzed + folded into corpus via incremental synthesis.

**This session's work (summary)**:

**Phase A — Planning/research cleanup:**

1. Archived 12 completed planning/research items (T40, Wave 5 agents, website
   skill, orphan-detection, T39, learning research, github-health research,
   unified-content-intelligence stub, worktree-management stub, analysis-
   synthesis-comparison). Commit: `c92103cb`.
2. Kept active per user decision: `plan-orchestration` (Wave 2+ pending),
   `multi-layer-memory` research (more to do), `research-discovery-standard`
   (more to do), `content-analysis-system` (CAS not finished),
   `synthesis-consolidation` (Step 12+ remaining).

**Phase B — GitNexus analysis (new corpus source #33):**

1. Ran `/repo-analysis` on `abhigyanpatwari/GitNexus` at Standard depth. 27K-
   star TypeScript monorepo shipping zero-server client-side code intelligence
   with multi-IDE MCP (Claude Code, Cursor, Codex, Windsurf, OpenCode) +
   SWE-bench eval harness. 22 candidates (6 patterns, 5 knowledge, 7 content, 4
   anti-patterns). 37 tags. Creator Healthy 82 / Adoption Healthy 64 / Use-as-is
   verdict **Trial** (license NOASSERTION + 3 S2 security findings + no
   incremental re-index are the blockers).
2. 7 new vocabulary tags added (180 → 187): `knowledge-graph`, `graph-rag`,
   `precomputed-intelligence`, `mcp-contract-block`, `signs-pattern`,
   `tree-sitter`, `wasm`.
3. Extraction journal +22 entries. EXTRACTIONS.md: 309 → 343 candidates across
   33 sources. SQLite index rebuilt (35 sources, 343 extractions, 280 tags).

**Phase C — Skill gap discovery + fix (mid-session):**

1. User surfaced gap: Creator View had no explicit "would SoNash install and use
   this repo as-is?" section, only pattern/knowledge extraction. Critical for
   product-type repos (application/framework/tool-demo).
2. Added new **Section 2b: Use-As-Is Verdict** to the GitNexus creator-view.md,
   summary.md, and analysis.json (verdict=trial, 5 blockers documented).
3. Updated `/repo-analysis` SKILL.md v4.5 → **v4.6**: Section 2b now
   MUST-produce when taxonomic tag is in {application, framework, tool-demo}.
   New analysis.json fields: `adoption_verdict`, `adoption_blockers`,
   `adoption_recommendation`.
4. Saved feedback memory `feedback_adoption_verdict_in_creator_view.md` + index
   entry in MEMORY.md.
5. Created **T48**: Backfill Use-As-Is Verdict on prior product-repo analyses
   (~20 candidates in existing corpus).

**Phase D — T29 synthesis-consolidation PLAN Step 12 test:**

1. Ran `/synthesize` in incremental mode. Menu correctly detected 1 new Standard
   source (GitNexus) with prior Wave 5 baseline present.
2. Archived prior synthesis to
   `history/synthesis-2026-04-13-wave5-baseline.{md,json}`.
3. Generated new synthesis.md (10.9K chars) + synthesis.json (108K) with
   "Changes Since Previous" as lead section covering themes strengthened (4),
   themes added weak (1 — graph-backed code intelligence), candidates added
   (22), gaps possibly closed (2 — marketplace reference, eval harness shape),
   gaps added (2 — SoNash still has no eval, license policy absent), confidence
   shifts (1), source impact ranking (GitNexus = high).
4. Updated `last_synthesized_at` on all 33 Standard sources.
5. Opportunities ledger upserted: 5 new rows (incl. Rank 1 "Build eval harness
   for agent-capability measurement" — the S-tier Challenge from GitNexus
   creator-view) + 12 prior preserved = 17 total entries.
6. All 7 Step 12 requirements PASS. Self-audit 10/10 PASS.

**Commits**: `c92103cb` (archive) landed. Remaining work batched into a single
session-end commit.

**Step status (synthesis-consolidation PLAN)**: Step 11 ✅, Step 12 ✅, Step 14
effectively ✅, Steps 13 + 15 remain (paradigm/scoped test + code-reviewer
audit).

---

## Session Tracking

**Current Session Count**: 279 (since Jan 1, 2026)

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

| Item                               | Status        | Progress                                                                                   |
| ---------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| **Orphan Detection (T21)**         | SCANNER DONE  | 428 findings, 110 resolved. `npm run orphans:detect`.                                      |
| **Website Analysis (T23)**         | SKILLS BUILT  | /website-analysis + /website-synthesis skills created.                                     |
| **Repo Analysis Skill**            | v4.6 ACTIVE   | Section 2b Use-As-Is Verdict now MUST for product repos. Bumped Session #278.              |
| **T28 Content Analysis System**    | E2E DONE      | 33 Standard sources (GitNexus added #278), 343 unique candidates. Vocabulary 187 tags.     |
| **T29 Synthesis Consolidation**    | STEP 12 DONE  | Steps 11-12 PASS. Step 14 effectively done. Remaining: Step 13 (paradigm/scoped), Step 15. |
| **Wave 5 Opportunity Ledger**      | 17 ENTRIES    | 12 Wave 5 + 5 new from #278 incremental. Rank 1 (eval harness) is the new S-tier.          |
| **T40 CAS tag quality**            | COMPLETE      | Session #276.                                                                              |
| **T39 Hook Drift Loop**            | CLOSED        | Session #275. Needs new PR (deferred).                                                     |
| **Research-Discovery-Standard v2** | IN-PROGRESS   | T13 plan updates needed.                                                                   |
| **Plan Orchestration**             | WAVE 1 DONE   | Waves 2-3 blocked on debt-runner.                                                          |
| **Dev Dashboard**                  | IN-PROGRESS   | Started #245, XL effort.                                                                   |
| **debt-runner Expansion**          | RESEARCH DONE | /deep-plan next. Gates plan-orchestration Waves 2-3.                                       |
| **Multi-layer Memory**             | RESEARCH DONE | 40 agents, 128 claims. Execution next.                                                     |
| **JASON-OS (Claude Code OS)**      | RESEARCHING   | Brainstorm + roadmap done. 16-domain research program.                                     |
| **T48 Adoption Verdict Backfill**  | NEW #278      | Backfill Section 2b on ~20 prior product-repo analyses.                                    |

**Current Branch**: `planning-41426`

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

1. **Close synthesis-consolidation PLAN** — two steps remain:
   - **Step 13**: Test scoped (`/synthesize --type=repo`) + paradigm
     (`/synthesize --paradigm=matrix`) modes.
   - **Step 15**: Run `code-reviewer` agent over `.claude/skills/synthesize/`,
     `scripts/lib/analysis-schema.js`, and deprecation redirects
     (`repo-synthesis/SKILL.md`, `website-synthesis/SKILL.md`).

2. **T48 Adoption Verdict backfill** — retroactively apply Creator View Section
   2b to ~20 prior product-repo analyses in `.research/analysis/`
   (application/framework/tool-demo taxonomic). Parallelizable via agents.

3. **/deep-plan Rank 1 opportunity: Build eval harness for agent-capability
   measurement** — S-tier insight from GitNexus analysis. 3-mode SWE-bench shape
   (baseline / native / native_augment), per-instance cached by
   `(repo, commit)`, fixed benchmark. SoNash adaptation needs: curated scenarios
   from review history + extraction journal, pattern-aware vs pattern-unaware
   agent comparison, per-scenario metrics.

4. **GitNexus trial** (if license resolves permissive) — Step 1: check `LICENSE`
   file. Step 2: install on throwaway branch (`npx gitnexus analyze`
   - `gitnexus setup`). Step 3: use for one real task (`/pr-review` or
     refactor). Step 4: adopt / extract-only decision.

5. **T47 — Wave 6 CAS source seed** (created Session #277) — Queue 10 gap-fill
   sources (Sober Grid, I Am Sober, InTheRooms, 42 CFR Part 2, Firebase
   reference, TS MCP SDK, whisper.cpp, monolith, readable-cli, SBOM).

6. **Remaining Wave 5 opportunity matrix items** — 9 entries pending status
   update in ledger (marketplace.json distribution, bidirectional doc-feature
   validator, zero-schema MCP, OAuth-filter MCP, skill retirement spec, etc.).

7. **T45 — Hook-based skill compliance enforcement** — 5 highest-risk skills.
8. **T46 — Cross-locale memory sync STRATEGY** (research only).
9. **T42 — Nous Research Hermes model series research** (P3).
10. **Dev dashboard implementation (T2)** — IN-PROGRESS since Session #245, XL.
11. **debt-runner `/deep-plan` (T3)** — Research done, needs plan.
12. **Multi-layer memory (T4)** — Research done.
13. **T30 todo JSONL data loss prevention** — P1 bug.
14. **JASON-OS Domain 02a (T16)** — Brainstorm complete.

### Backlog (run `/todo` for full list — 13 pending, 48 total)

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
