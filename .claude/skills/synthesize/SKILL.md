---
name: synthesize
description:
  Cross-source synthesis across all analyzed sources (repos, websites,
  documents, media). Produces emergent themes, ecosystem gaps, reading chains,
  mental model evolution, fit portfolio, knowledge map, and an interactive
  opportunity matrix that routes to the next action. Replaces /repo-synthesis,
  /website-synthesis, and the cross-type synthesis stub. Part of T28 CAS.
---

# /synthesize — Cross-Source Synthesis (T29)

> **Status:** v1.0 (active). Consolidates `/repo-synthesis` (v1.3) and
> `/website-synthesis` (v1.1) into a single skill that handles all 4 source
> types (repo, website, document, media). See
> `.planning/synthesis-consolidation/DECISIONS.md` for the 32 decisions behind
> this design.

## Critical Rules (MUST follow)

1. **Read, don't re-analyze.** This is a consumer skill. It reads handler
   outputs (`analysis.json`, `creator-view.md`, `value-map.json`, etc.) and
   never re-runs analysis. If a source lacks Standard-depth artifacts, surface
   it in pre-flight — do not silently degrade.
2. **Conversational, not clinical.** Output is interpretive prose, not a
   bullet-point dump. Per the "writer-not-filing-clerk" framing — synthesize
   meaning, don't file data.
3. **State on every phase.** Update `.claude/state/synthesize.state.json` after
   each phase completes. Sections track in `sections_completed[]` so resume can
   skip done work.
4. **Write to disk first, present second.** All artifacts (`synthesis.md`,
   `synthesis.json`, history archive) MUST hit disk before inline output. Crash
   recovery depends on this.
5. **No silent skips.** If a section can't be produced (missing data,
   contradictions, etc.), say so explicitly in the output AND in the self-audit.
   Never quietly omit.
6. **Maximum thoroughness.** This is macro-scale analysis. Per the user's
   overarching constraint: maximize information, suggestions, and opportunities.
   No artificial caps on theme count, candidates, or sections.
7. **Verify before claiming.** Self-audit (10 dimensions) runs before present.
   Any FAIL blocks the present phase until acknowledged or fixed.

## When to Use

- 3+ analyzed sources exist in `.research/analysis/` (any mix of types)
- After `/analyze` produces a new source and you want to refresh cross-source
  understanding
- Periodic review of accumulated knowledge ("what does my analysis pile actually
  say?")
- Before brainstorming/planning to ground decisions in evidence
- When the user runs `/analyze --synthesize` (router redirect)

## When NOT to Use

- Single source available — use the analysis output directly
- 2 sources of same type — synthesis runs but warns about thin convergence
- Sources are all Quick Scan only — pre-flight will block, suggesting upgrade
- Analyzing a single new source — use `/analyze` (handler skill), not this

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

`/analyze --synthesize` invokes this skill with flags passed through. The router
adds context (source count, type breakdown) before calling.

## Interactive Opening Menu (D#8)

State-aware — only contextually-valid options are shown.

```
/synthesize — N sources analyzed (R repos, W websites, D documents, M media)
Last synthesized: <date> (<count> sources). <K> new since.

  [F] Full synthesis      — re-process all sources
  [I] Incremental         — fold N new sources into prior synthesis
  [R] Re-synthesize       — full re-run with change detection vs prior
  [S] Scoped              — filter by --type or --focus
  [Z] Resume              — pick up from last incomplete section
  [V] Review previous     — read existing synthesis with freshness context
```

Visibility rules:

- **[I] Incremental** — only if prior synthesis exists AND new sources detected
- **[R] Re-synthesize** — only if prior synthesis exists
- **[Z] Resume** — only if state file shows incomplete sections
- **[V] Review previous** — only if `synthesis.md` exists

## Process Overview

```
MENU       Interactive  → 6-option opening (state-aware visibility)
PRE-FLIGHT Validation   → Source count, artifact check, quick-scan
                          upgrade suggestions, source_tier review
PHASE 1    Load         → Read all artifacts, build internal graph,
                          checkpoint to state
PHASE 2    Synthesize   → Produce 8 outputs per paradigm
                          Subagent hybrid for 10+ sources
PHASE 3    Verify       → Evidence check, convergence math, dedup
PHASE 4    Self-Audit   → 10-dimension audit
PHASE 5    Present      → Write synthesis.md + synthesis.json,
                          archive previous to history/, present inline
PHASE 6    Opportunity  → Interactive opportunity matrix routing
                          to /brainstorm, /deep-plan, /deep-research,
                          /analyze
RETRO      Feedback     → Process feedback, persist to state
```

### PRE-FLIGHT (MUST)

1. **Source count check.** Read `.research/analysis/*/analysis.json`. Count by
   type. Below `--min-sources`: warn. Below 2: block.
2. **Artifact check.** For each source, verify Standard-depth artifacts exist
   (`analysis.json`, `creator-view.md`, `value-map.json`, `findings.jsonl`).
   Quick-scan-only sources flagged for upgrade (D#18, D#21).
3. **Quick scan upgrade gate.** If any sources are Quick-scan only, present the
   list and ask: "Run Standard upgrades first? (recommended) [Y/n]". If yes:
   dispatch `/analyze <url> --depth=standard` for each, then return.
4. **Source tier review.** Show the tier assignment per source. Allow user to
   override via interactive prompt for any source where the handler-suggested
   tier feels wrong (D#32).

### PHASE 1: Load

Read all qualifying sources into an internal graph. For each source:

- `analysis.json` — full record (MUST)
- `value-map.json` — scoring + classification (MUST for repos)
- `creator-view.md` — narrative summary (MUST)
- `findings.jsonl` — per-finding evidence (SHOULD, when present)
- `summary.md`, `deep-read.md` — supplementary (SHOULD)
- `extraction-journal.jsonl` (project-wide) — prior decisions
- 5 home context files — `CLAUDE.md`, `SESSION_CONTEXT.md`, `ROADMAP.md`,
  `.research/EXTRACTIONS.md`, `.research/research-index.jsonl`
- Previous `synthesis.json` (if exists) — for incremental/re-synthesis modes

Checkpoint state after load: `sources_loaded[]` populated.

### PHASE 2: Synthesize

For 10+ sources, dispatch subagents per group (max sources per agent — see
REFERENCE.md). Each agent reads its slice and returns themes/candidates. Merge
and interpretation always inline (D#20). For < 10 sources, do all work inline.

Produce all 8 sections (see Output below). Update `sections_completed[]` after
each section finishes.

### PHASE 3: Verify

For every theme: confirm evidence references exist in source artifacts. For
convergence counts: recompute. For candidates: dedupe by name+tag intersect
(D#23) and apply convergence boost. Any drift between claim and evidence is a
finding for the self-audit.

### PHASE 4: Self-Audit

Run all 10 dimensions (D#27, REFERENCE.md §8). Any FAIL blocks present until
acknowledged or fixed. Generate audit summary appended to `synthesis.md`.

### PHASE 5: Present

1. Archive previous `synthesis.md` and `synthesis.json` to
   `.research/analysis/synthesis/history/synthesis-YYYY-MM-DD.md`.
2. Write new `synthesis.md` and `synthesis.json` to
   `.research/analysis/synthesis/` (D#4, D#5).
3. Update `last_synthesized_at` on every processed source's `analysis.json`.
4. Run `node scripts/cas/rebuild-index.js` to sync SQLite.
5. **Update opportunities-ledger.jsonl** — for each entry in
   `opportunity_matrix`, normalize `title_key` (lowercase + alnum-only + `_` for
   spaces). Read existing ledger. If `title_key` already present: update
   `last_seen_in_run` and increment `runs_seen`. If new: append row with
   `status: "pending"`, `first_seen_in_run` and `last_seen_in_run` both set to
   this run's date. Never mutate `status`, `adopted_at`, `adopted_to`,
   `commit_sha`, `notes` on existing rows — those fields are controlled by
   manual adoption updates, not by synthesis re-runs. Write atomically.
6. Present `synthesis.md` inline to the user.

### PHASE 6: Opportunity Matrix

Interactive numbered menu (D#12). Each opportunity carries:

- Title + 1-line description
- Effort (E0-E3), Impact (low/medium/high)
- Evidence count (which sources support it)
- Suggested route (`/brainstorm`, `/deep-plan`, `/deep-research`, `/analyze`)

User picks by number. Skill chains to the routed command with the opportunity
context as input. "Skip / done for now" exits cleanly.

### RETRO

Solicit 2 questions:

1. Did synthesis surface anything new?
2. Was any section weak or missing?

Persist to `synthesize.state.json` under `retros[]` for future quality metrics.

## Output Sections (D#11)

The thematic paradigm produces 8 sections. Other paradigms reshape sections 3-6
— see REFERENCE.md §1.

1. **Emergent Themes + Signals (merged)** — every theme carries convergence
   confidence (weak/medium/strong) based on independent source count.
2. **Ecosystem Gap Analysis** — domains present in home context but missing from
   analyzed sources, with suggested actions.
3. **Reading Chain** — cross-type study sequence ordered by dependency >
   pedagogical tier > tag cluster (D#25).
4. **Mental Model Evolution** — interest shifts, confidence shifts, emerging
   focus tags over the analyzed time range.
5. **Fit Portfolio** — all candidates from all sources, deduplicated and
   re-ranked with convergence boost.
6. **Knowledge Map** — domain coverage matrix (covered domains + gap domains
   with suggested next scans).
7. **Opportunity Matrix** — interactive next-action menu (see Phase 6).
8. **Changes Since Previous** — re-synthesis only. All 6 dimensions: themes,
   candidates, gaps, confidence shifts, contradictions, source impact (D#10).

## Self-Audit (D#27)

10 dimensions. Each is PASS / FAIL / WARN. Any FAIL blocks present.

| #   | Dimension             | Check                                                    |
| --- | --------------------- | -------------------------------------------------------- |
| 1   | Artifact existence    | Both `synthesis.md` and `synthesis.json` written         |
| 2   | Schema validation     | `synthesis.json` validates against `synthesisRecord` Zod |
| 3   | Section completeness  | All 8 sections present (or explicitly noted absent)      |
| 4   | Evidence grounding    | Every theme has ≥1 evidence ref to a real source         |
| 5   | Candidate integrity   | No duplicate candidates after dedup pass                 |
| 6   | Convergence math      | Convergence counts match unique source list              |
| 7   | Dedup check           | Re-running dedup produces no further merges              |
| 8   | Gap validity          | Gap domains exist in home context, not in sources        |
| 9   | Opportunity grounding | Each opportunity has ≥1 evidence reference               |
| 10  | Changes accuracy      | (re-synthesis only) Diff against prior is correct        |

See REFERENCE.md §8 for pass/fail criteria per dimension.

## State File & Resume

`.claude/state/synthesize.state.json` (D#17, D#19):

```json
{
  "schema_version": "1.0",
  "started_at": "ISO timestamp",
  "mode": "full|incremental|re-synthesis",
  "paradigm": "thematic|narrative|matrix|meta-pattern",
  "sources_loaded": ["slug1", "slug2", ...],
  "sections_completed": ["themes", "gaps", ...],
  "subagent_dispatches": [...],
  "self_audit": { "dimension_1": "pass", ... },
  "retros": [...]
}
```

Resume reads this and skips completed sections. Single file — parallel synthesis
runs are not supported.

## Integration

**Upstream (consumers of /synthesize output):**

- `/recall` — queries SQLite index updated by `rebuild-index.js`
- `/brainstorm`, `/deep-plan`, `/deep-research`, `/analyze` — routed from
  Opportunity Matrix

**Downstream (sources of /synthesize input):**

- `/repo-analysis`, `/website-analysis`, `/document-analysis`, `/media-analysis`
  — handler skills produce the artifacts read here
- `/analyze` — router skill that dispatches the right handler. Also exposes
  `/analyze --synthesize` as a smart redirect into this skill (D#31).

**Replaces:**

- `/repo-synthesis` (deprecated, redirect)
- `/website-synthesis` (deprecated, redirect)
- `/analyze` cross-type synthesis stub (rewritten to redirect)

## Opportunities Ledger

**File:** `.research/analysis/synthesis/opportunities-ledger.jsonl` (append or
update in place; never truncated).

The `opportunity_matrix` inside `synthesis.json` is a snapshot — it regenerates
every run. The ledger is the **durable** record that tracks lifecycle status of
every opportunity ever surfaced, across all synthesis runs.
Extraction-journal.jsonl does the same job for per-source candidates; this
ledger does it for cross-source opportunities.

### Schema (per JSONL line)

```json
{
  "title_key": "normalized_stable_key",
  "rank": 1,
  "title": "Human-readable opportunity title",
  "first_seen_in_run": "YYYY-MM-DD",
  "last_seen_in_run": "YYYY-MM-DD",
  "runs_seen": 1,
  "status": "pending",
  "effort": "E0|E1|E2|E3",
  "impact": "low|medium|high",
  "suggested_route": "/brainstorm|/deep-plan|/deep-research|/analyze",
  "evidence_sources": ["slug1", "slug2", "absence-signal:..."],
  "adopted_at": null,
  "adopted_to": null,
  "commit_sha": null,
  "deferred_to": null,
  "notes": null
}
```

### Status enum

- `pending` — opportunity surfaced by synthesis, not yet acted upon
- `adopted` — implemented; `adopted_at`, `adopted_to`, `commit_sha` filled
- `skipped` — explicitly decided not to pursue; `notes` should explain
- `deferred` — pushed to a todo or future milestone; `deferred_to` filled with
  `{type: "todo"|"roadmap"|"milestone", id, file?}`
- `stale` — auto-assigned to `pending` rows whose `last_seen_in_run` is 3+
  synthesis runs old (optional future refinement)

### `title_key` normalization

Lowercase, strip all non-alphanumeric, spaces become underscores. Used as the
dedup primary key across synthesis runs. Example:
`"Publish SoNash /llms.txt from CLAUDE.md + SKILL.md corpus"` →
`"publish_sonash_llms_txt_from_claude_md_skill_md_corpus"`. When this skill
writes a key longer than 60 chars, truncate to first 60 chars.

### Write path (during synthesis)

See Phase 5 step 5. Summary: for each opportunity produced this run, upsert by
`title_key`. New keys → insert with `status: "pending"`. Existing keys → update
`last_seen_in_run` and `runs_seen` only.

### Update path (adoption or deferral)

Manual (or via a future helper script). Find the row by `title_key` or
`rank+first_seen_in_run`, update `status` + the status-specific fields, atomic
rewrite of the file. This skill does NOT mutate adopted/skipped/ deferred rows
on re-synthesis.

### Cross-references

Synthesis runs with prior ledger data should suppress or annotate already-
`adopted`/`skipped` opportunities in the interactive Opportunity Matrix menu.
(Implementation deferred — first such run will add this.)

## Version History

| Version | Date       | Changes                                                                                  |
| ------- | ---------- | ---------------------------------------------------------------------------------------- |
| 1.1     | 2026-04-13 | Opportunities ledger (T29 Wave 5 Session #277). Phase 5 step 5 added; ledger schema doc. |
| 1.0     | 2026-04-09 | T29 Wave 2 — initial unified skill (Session #271)                                        |
