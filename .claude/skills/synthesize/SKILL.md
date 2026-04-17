---
name: synthesize
description:
  Cross-source synthesis across all analyzed sources (repos, websites,
  documents, media). Produces emergent themes, ecosystem gaps, reading chains,
  mental model evolution, fit portfolio, knowledge map, and an interactive
  opportunity matrix that routes to the next action. Replaces /repo-synthesis,
  /website-synthesis, and the cross-type synthesis stub.
---

# /synthesize — Cross-Source Synthesis

> **Status:** v2.0 (active). Rewritten per `/skill-audit synthesize` Session
> #284 (109 decisions). Consolidates `/repo-synthesis` + `/website-synthesis`
> (v1.0 Session #271). See `.planning/synthesis-consolidation/DECISIONS.md` for
> the original 32 decisions and
> `.claude/state/task-skill-audit-synthesize.state.json` for the v2.0 decision
> record.

**Scope:** Cross-source synthesis only. Read-only on handler-owned artifacts.
Write-only to `.research/analysis/synthesis/`. All 4 paradigms share an
8-section skeleton with §3-6 shape-variance — each paradigm is a lens, not a
separate skill. Tested up to 50 sources; beyond that may require chunked runs.

## Critical Rules (MUST follow)

1. **Read, don't re-analyze.** Consumer skill — reads handler outputs
   (`analysis.json`, `creator-view.md`, `value-map.json`). Why: re-running
   analysis here duplicates handler work and drifts from canonical artifacts.
2. **Conversational, not clinical.** Output is interpretive prose, not a bullet
   dump. Per the "writer-not-filing-clerk" framing (DECISIONS.md D#11) —
   synthesize meaning, don't file data. Reinforced point-of-use in Phase 2.
3. **State on every phase.** Update `.claude/state/synthesize.state.json` after
   each phase. Why: enables `--resume` to skip completed work after crash or
   pause.
4. **Write to disk first, present second.** All artifacts (`synthesis.md`,
   `synthesis.json`, `opportunities-ledger.jsonl`, history archive) MUST hit
   disk before inline output. Why: crash recovery depends on this.
5. **No silent skips.** If a section can't be produced, say so explicitly in the
   output AND in the self-audit. Why: silent omission masks evidence problems
   and breaks downstream consumers.
6. **Maximum thoroughness.** No artificial caps on theme count, candidates, or
   sections. Why: macro-scale analysis loses signal under truncation. Verifiable
   floor: `min_themes >= ceil(log2(N_sources))` (1A — WARN-level).
7. **Verify before claiming.** Self-audit (10 dimensions) runs before present.
   Any FAIL blocks Present until acknowledged or fixed. Why: the audit is the
   contract — bypassing it ships broken artifacts.

## When to Use

- 3+ analyzed sources exist in `.research/analysis/` (any mix of types).
- After `/analyze` produces a new source and you want refreshed cross-source
  understanding.
- Periodic review of accumulated knowledge.
- Before brainstorming/planning to ground decisions in evidence.
- When the user runs `/analyze --synthesize` (router redirect — the only
  auto-trigger; handlers never auto-call /synthesize).

## When NOT to Use

- **Single source available** — run `/analyze <url>` first, then read
  `.research/analysis/<slug>/creator-view.md` directly.
- **2 sources** — synthesis runs but emits two warnings (min-sources + thin
  convergence) and treats output as low-confidence; suggest `/analyze <new-url>`
  to reach the 3-source floor.
- **Sources are all Quick Scan only** — pre-flight blocks; suggests upgrade.
- **Analyzing a single new source** — use `/analyze` (handler), not this.

## Routing Guide

| I want to...                                          | Use                                    |
| ----------------------------------------------------- | -------------------------------------- |
| Analyze a single new source (repo/web/doc/media)      | `/analyze <url>` (router)              |
| Query the existing knowledge base                     | `/recall` (retrieval / search)         |
| Cross-source synthesis (generation / interpretation)  | `/synthesize` (this skill)             |
| Synthesis filtered to one source type                 | `/synthesize --type=<repo\|...>`       |
| Apply a different synthesis paradigm                  | `/synthesize --paradigm=<matrix\|...>` |
| Resume an interrupted synthesis run                   | `/synthesize --resume`                 |
| Audit code/docs/process (reads source code)           | `/audit-*` or `/*-ecosystem-audit`     |
| Gather new external evidence (not in handler outputs) | `/deep-research`                       |
| Brainstorm next action from a synthesis opportunity   | `/brainstorm` (routed from Phase 6)    |
| Promote opportunity → milestone or task               | `/gsd:add-backlog` / `/gsd:add-todo`   |

## Output Sections (D#11)

The thematic paradigm produces 8 sections; other paradigms reshape §3-6 (see
REFERENCE.md §1.3 for per-paradigm reshape rules).

| #   | Section                   | Format / typical length                                               |
| --- | ------------------------- | --------------------------------------------------------------------- |
| 1   | Emergent Themes + Signals | Prose: 3-10 paragraphs × 80-150 words. Convergence band per theme.    |
| 2   | Ecosystem Gap Analysis    | Prose: 2-5 paragraphs. Domain + why_unfilled + suggested_action.      |
| 3   | Reading Chain             | List: 5-12 sources × 1-2 sentences (dependency > tier > tag cluster). |
| 4   | Mental Model Evolution    | Prose: 2-4 paragraphs. Interest/confidence shifts + emerging tags.    |
| 5   | Fit Portfolio             | Ranked list: all candidates dedupe-merged with convergence boost.     |
| 6   | Knowledge Map             | Table: covered domains + gap domains with suggested next scans.       |
| 7   | Opportunity Matrix        | Numbered interactive menu (Phase 6) — title, effort, impact, route.   |
| 8   | Changes Since Previous    | (re-synthesis only) All 6 dimensions per D#10.                        |

Length floors are SHOULD-level — drop below only when evidence is genuinely
sparse (and explain in the section). Schema reference: `synthesisRecord` in
`scripts/lib/analysis-schema.js` (Zod 4.3.6 per CLAUDE.md stack); Section Spec
details in REFERENCE.md §2.

**Flag combination semantics:** `--focus` narrows to one section; `--paradigm`
reshapes §3-6. Combined → `--focus` wins; paradigm shape applies if focus is in
§3-6 range.

## Input

```
/synthesize [flags]

Flags:
  --paradigm=<thematic|narrative|matrix|meta-pattern>   default: thematic
  --type=<repo|website|document|media>                  filter to one type
  --focus=<themes|gaps|portfolio|chain|map|matrix>      narrow output
  --min-sources=<N>                                     default: 3 (warn at 2)
  --resume                                              skip to incomplete sections
```

`/analyze --synthesize` invokes this skill with flags passed through plus a
router context (`source_count`, `type_breakdown`, `triggered_by`).

## Interactive Opening Menu (D#8)

State-aware — only contextually-valid options are shown. Before MENU, emit a
warm-up template:

```
/synthesize — N sources analyzed (R repos, W websites, D documents, M media).
Last synthesized: <date> (<count> sources). <K> new since.
Running {mode} synthesis with {paradigm} paradigm. Estimated runtime: ~5-10
min for <10 sources, ~15-30 min for 10-30 (subagent hybrid).

Run /synthesize now, or ask questions first?  [R = run / Q = question / C = cancel]
```

Then the MENU:

```
  [F] Full synthesis      — re-process all N sources (~est min)
  [I] Incremental         — fold K new sources into prior synthesis (~est min)
  [R] Re-synthesize       — full re-run with change detection vs prior
  [S] Scoped              — filter by --type or --focus
  [P] Pick paradigm       — switch paradigm; opens sub-menu of 4 lenses
  [Z] Resume              — pick up from last incomplete section
  [V] Review previous     — read existing synthesis with freshness context
  [D] Delegate            — Claude picks based on state (Full/Incremental/Re)
```

Visibility rules: **[I]** only if prior synthesis exists AND new sources
detected; **[R]** only if prior exists; **[Z]** only if state shows incomplete
sections; **[V]** only if `synthesis.md` exists.

## Process Overview

```
MENU         Interactive  → state-aware opening + warm-up gate
PRE-FLIGHT   Validation   → counts, artifacts, quick-scan upgrade, tier review
PHASE 1      Load         → read all artifacts; checkpoint to state
PHASE 2      Synthesize   → produce 8 outputs; subagent hybrid for 10+
PHASE 2.5    Convergence  → second-pass T20 tally + user gate (11A)
PHASE 3      Canonicalize → mutate evidence/dedup/convergence (active write)
PHASE 4      Verify       → 10-dim self-audit (read-only assertion)
PHASE 4.5    Convergence  → user gate before Present (11D)
PHASE 5      Present      → write artifacts; archive; rebuild SQLite
RETRO        Feedback     → 2 questions; persist to state (run BEFORE Phase 6)
PHASE 6      Opportunity  → interactive matrix → routes onward
```

### PRE-FLIGHT (MUST)

1. **Source count.** Read `.research/analysis/*/analysis.json`. Count by type.
   Below `--min-sources`: warn. Below 2: block.
2. **Artifact check.** Verify Standard-depth artifacts per source. Quick-scan-
   only sources flagged for upgrade.
3. **Quick scan upgrade gate.** If any are Quick-scan, present list + estimated
   per-source upgrade time. Ask `[Y/n]`. On yes: dispatch
   `/analyze <url> --depth=standard` per source (subset picker available); after
   upgrade, if mode was **Full** AND corpus changed, re-present MENU (4D).
4. **Source tier review.** Show handler-suggested tier per source. Batch reviews
   5-8 per prompt: `[k]eep / [s]tandard / [q]uick / [a]ccept-all- remaining`
   (4E + 10I). Overrides persist to `state.tier_overrides[]` for this run only —
   handler-written tier on `analysis.json` is NOT mutated.
5. **Flag-vs-corpus sanity.** E.g., `--paradigm=meta-pattern` with 1 handler
   type → warn `[y/N]` (extensible pattern for future mismatches).

### PHASE 1: Load

Read all qualifying sources into an internal graph. For each source:

- `analysis.json` (MUST), `value-map.json` (MUST for repos), `creator-view.md`
  (MUST), `findings.jsonl` (SHOULD — fields read: `id`, `claim`, `confidence`,
  `source_ref`), `summary.md` / `deep-read.md` (SHOULD).
- `extraction-journal.jsonl` — filters already-surfaced candidates during §5
  Portfolio and §7 Opportunity Matrix (prior-art suppression per 9E).
- Home context: `CLAUDE.md`, `SESSION_CONTEXT.md`, `ROADMAP.md`,
  `.research/EXTRACTIONS.md`, `.research/research-index.jsonl`, and the
  auto-loaded `MEMORY.md` (9D). Prefer dynamic discovery from
  `.research/home-context.json` when present; fall back to the listed 5 (3C).
- Surface MEMORY.md `feedback_*` entries (scope drift, workflow chain,
  don't-over-surface, never-bulk-accept) to gate interactive behavior (9F).
- Previous `synthesis.json` (if exists) for incremental/re-synthesis modes.

Checkpoint after load: `state.sources_loaded[]` populated.

**Resume granularity:** re-enters at the START of the last incomplete phase;
completed phases skipped entirely; completed sections within a phase skipped;
the active section restarts from scratch (2F).

### PHASE 2: Synthesize

For 10+ sources, dispatch subagents per group (max 10 sources per agent — see
REFERENCE.md §11). Merge and final interpretation always inline (D#20). For <
10, do all work inline.

**Inter-Phase Contracts (2E):** Subagent inputs =
`{slugs[], slice_id, synthesis_goal, output_schema}`. Outputs =
`{themes[], candidates[], gaps[], status, fallback_used?}`. Failure protocol
(6C): 1 retry with exponential backoff; second failure → inline fallback for
that slice; record to `state.subagent_dispatches[{id, status, fallback_used}]`.
Never silently skip a slice (Rule #5).

**Reinforce Rule #2 here:** Output is interpretive prose — each section reads as
a short essay citing evidence, not a bulleted dump (7F).

**Scope sanity check:** if `themes > ceil(sources*3)` OR
`candidates > sources*5`, prompt user to merge / cap / continue (6B). Preserves
Rule #6 no-caps while gating runaway.

Update `state.sections_completed[]` after each section finishes.

### PHASE 2.5: Convergence Pass (11A — KEYSTONE)

Second pass over the same sources to validate Phase 2 conclusions. Re-derive
themes inline, then run a T20 tally vs Pass 1: **Confirmed / Corrected /
Extended / New**. Present the tally + a convergence gate to the user before
Phase 3:

```
Pass 2 vs Pass 1: Confirmed N | Corrected M | Extended K | New J
Proceed to Phase 3 Canonicalize?  [Y / N / re-run pass with: <hint>]
```

Invoke via the `/convergence-loop` skill (quick profile, 2 passes minimum).
Post-merge for subagent runs: verify subagent themes still present in merged
output, no evidence refs dropped; drift → re-merge or escalate (11E + 6C).

### PHASE 3: Canonicalize

**Active mutation phase (2A).** For every theme: confirm evidence references
exist in source artifacts. Recompute convergence counts. Dedupe candidates by
name+tag intersect (D#23) and apply convergence boost. Any drift between claim
and evidence is a finding for the self-audit.

### PHASE 4: Verify

**Read-only assertion phase (2A).** Run all 10 self-audit dimensions
(REFERENCE.md §8) plus:

- **Dim 11 Contradiction surfaced (6A)** — cross-source theme conflicts detected
  via token-overlap + sentiment-polarity heuristic. WARN-level.
- **Dim 12 Cross-run drift (6I, re-synthesis only)** — themes diff vs prior ≤
  30% of prior count; exceed → WARN with diff listing in §8.
- **T20 tally vs previous run (11C)** — Confirmed / Corrected / Extended / New.
  Surfaced as part of the audit summary.

Generate audit summary appended to `synthesis.md`. Persist FAIL/WARN dimensions
to `.claude/state/synthesize-audit-log.jsonl` for longitudinal quality analysis
(6O1) — feeds 12H/9H pre-run feedforward.

**Empty-result handling (6H):** 0 themes AND 0 candidates AND 0 gaps →
`state.status = "no_signal"`, `synthesis.md` written with "None detected —
evidence listing" per section, exit 0.

**Fix cycle (11B):** any FAIL → user fix → re-run Phase 3 + Phase 4 on modified
output before Phase 5.

### PHASE 4.5: Convergence Gate (11D)

Present audit summary + gate:

```
Self-Audit: 8 PASS, 2 WARN, 0 FAIL.
Proceed to Phase 5 Present?  [Y / N / fix-specific-dim:<n>]
```

MUST per `/convergence-loop` skill contract (11F).

### PHASE 5: Present

1. Archive previous `synthesis.md` and `synthesis.json` to
   `.research/analysis/synthesis/history/synthesis-YYYY-MM-DD.md` (13B
   backup/rollback path; restore from history/ if self-audit detects
   prior-snapshot corruption).
2. Write new `synthesis.md` and `synthesis.json` to
   `.research/analysis/synthesis/` (UTF-8, LF line endings — 13E).
3. Update `last_synthesized_at` on every processed source's `analysis.json`.
   **Cross-skill contract (2B):** /synthesize MUTATES this field on
   handler-owned artifacts; handlers MUST preserve it during their own writes.
4. Run `node scripts/cas/rebuild-index.js` to sync SQLite. Non-zero exit → mark
   `state.status = "partial_present"`, warn user of potential stale /recall
   data; does NOT block synthesis.md/.json writes (Rule #4).
5. **Update opportunities-ledger.jsonl** — for each `opportunity_matrix` entry,
   normalize `title_key`. Existing keys → bump `last_seen_in_run` + `runs_seen`
   only. New keys → append `status: "pending"`. Never mutate `status`,
   `adopted_at`, `adopted_to`, `commit_sha`, `notes` on existing rows. Write
   atomically.
6. Present `synthesis.md` inline; emit closure signal:
   `✅ Done. N themes, M candidates, K opportunities, Z gaps. Files: [list]. Self-audit: {PASS|WARN|FAIL} with N WARN. Suggested next: Phase 6 / /recall.`
   (10E + 10H ✅/⚠️/❌ visual differentiation per project conventions.)

### RETRO

Solicit 2 questions BEFORE Phase 6 routing (2C — capture happens regardless of
chain-away):

1. Did synthesis surface anything new?
2. Was any section weak or missing?

Persist to `state.retros[]`. Cross-run retro aggregation is FUTURE work
(`scripts/cas/aggregate-synthesize-retros.js` — 9C); current = manual read
across state snapshots. Retro feed-forward (9H, MAY): if 3+ recent retros flag a
section weak, pre-flight shows a hint on the next run — wired through the
self-audit script's pre-run feedforward (decision 12H).

### PHASE 6: Opportunity Matrix

Interactive numbered menu (D#12). Each opportunity carries title, 1-line
description, effort (E0-E3), impact (low/medium/high), evidence count, and
suggested route (`/brainstorm`, `/deep-plan`, `/deep-research`, `/analyze`).

**Selection criteria (7E):** source sections (themes / portfolio / gaps); dedup
key (`title_key`); ranking formula
`impact_weight × convergence_count / effort_weight` boosted by ROADMAP-active
items (5F) and SESSION_CONTEXT.md Next Session Goals (5G).

**Handoff contract (5B):** route via Skill tool with `--context=<json>` carrying
`{title, rank, effort, impact, evidence_sources, synthesis_ref}`; degrade to
inline-paste prompt if the routed command lacks the flag. Record each handoff in
`state.routings[{opportunity_title, routed_command, handoff_context_hash, timestamp}]`
(1C). User picks by number, `[D]` to auto-pick top-ranked, or "skip / done for
now" exits cleanly.

## Self-Audit (D#27)

Phase 4 runs 10 dimensions (PASS / FAIL / WARN) — any FAIL blocks Present until
acknowledged or fixed. Dimensions cover artifact existence, schema validation,
section completeness, evidence grounding, candidate integrity, convergence math,
dedup, gap validity, opportunity grounding, and (re-synthesis) change accuracy.
Plus prose-quality WARN (1B) and the contradiction/drift extensions noted above.
Script: `scripts/skills/synthesize/self-audit.js`. See REFERENCE.md §8 for
per-dimension pass/fail criteria.

## State File & Resume

`.claude/state/synthesize.state.json` (D#17, D#19) tracks per-phase progress;
schema v2 per Session #284. Adds `tier_overrides[]`, `routings[]`, `invocation`,
`files_created[]` / `files_modified[]`, `decisions[].file_modified`,
`last_complete_run`, `phase_costs[]`, `blocked_reason` + `blocked_at`.
Parallel-run lock at `.claude/state/synthesize.lock` (1h stale timeout). UTF-8 /
LF encoding for all .md and .jsonl writes. Full schema, resume protocol,
parallel-run lock behavior, disengagement protocol, and phase guards:
**REFERENCE.md §9**.

## Output Contracts, Anti-Patterns, Integration

Consumers (`/recall`, Phase 6 routes, 4 handler skills, `/session-end`,
`/skill-audit`) and producers (4 analysis skills + `/analyze` router) — full
contracts including the `--context=<json>` schema, the only-auto-trigger rule
(`/analyze --synthesize`), the `last_synthesized_at` write-back contract,
ROADMAP/SESSION_CONTEXT.md ranking inputs, ecosystem impact map, anti-pattern
list, and the `patterns:check N/A` rationale: **REFERENCE.md §14**.

Replaces: `/repo-synthesis` (deprecated, redirect; retires once T29 Wave 4
complete), `/website-synthesis` (deprecated, redirect), `/analyze` cross-type
synthesis stub (rewritten to redirect).

## Opportunities Ledger

`.research/analysis/synthesis/opportunities-ledger.jsonl` is the durable
cross-run record of every opportunity surfaced. Unlike the per-run
`opportunity_matrix` snapshot inside `synthesis.json`, the ledger tracks
lifecycle status (`pending` / `adopted` / `skipped` / `deferred` / `stale`)
keyed by normalized `title_key`. Phase 5 step 5 upserts: existing keys bump
`last_seen_in_run` + `runs_seen`; new keys insert with `status: "pending"`.
Adoption / skip / deferral updates come from manual edits or helper scripts —
synthesis re-runs never mutate `status`, `adopted_at`, `adopted_to`,
`commit_sha`, or `notes` on existing rows. See REFERENCE.md §13 for full schema,
status enum, `title_key` normalization, write/update paths, and
cross-references.

## Version History

| Version | Date       | Changes                                                                                                                                                |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2.0     | 2026-04-16 | /skill-audit synthesize Phase 4 (Session #284, 109 decisions). Phase 2.5/4.5 convergence gates; 12-cat rewrite; canonical self-audit script; state v2. |
| 1.2     | 2026-04-14 | Step 15 audit fixes (Session #279): Routing Guide added; "2 sources" double-warning clarified; status banner sync.                                     |
| 1.1     | 2026-04-13 | Opportunities ledger (T29 Wave 5 Session #277). Phase 5 step 5 added; ledger schema doc.                                                               |
| 1.0     | 2026-04-09 | T29 Wave 2 — initial unified skill (Session #271).                                                                                                     |
