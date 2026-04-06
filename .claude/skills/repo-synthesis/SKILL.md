---
name: repo-synthesis
description: >-
  Cross-repo synthesis across analyzed repositories. Produces emergent themes,
  ecosystem gaps, reading chains, mental model evolution, fit portfolio view,
  and cross-repo knowledge map. Companion to /repo-analysis — consumes its
  output artifacts. Auto-offered when 3+ repos analyzed.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.2
**Last Updated:** 2026-04-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Repo Synthesis

Cross-repo intelligence from your analyzed repositories. Where `/repo-analysis`
examines one repo at a time, `/repo-synthesis` finds the emergent story across
all of them — recurring themes, ecosystem gaps, how your thinking has shifted,
and what's brilliant regardless of your current sprint.

## Critical Rules (MUST follow)

1. **Minimum 3 repos.** Do NOT run with fewer than 3 analyzed repos (override
   with `--min-repos=N`). See REFERENCE.md Section 9 for 2-repo guidance.
2. **Read, don't re-analyze.** Consume existing artifacts. Never re-clone,
   re-scan, or regenerate repo-analysis output. If artifacts are missing, report
   which repo lacks what and suggest re-scanning.
3. **Conversational, not clinical.** Match the Creator View prose style —
   written as you'd explain insights to a colleague, not as a compliance report.
4. **State file on every phase.** Synthesis can be long. Compaction will happen.
5. **Write-to-disk-first.** Each output written before proceeding to the next.

## When to Use

- User invokes `/repo-synthesis` explicitly
- Auto-offered by `/repo-analysis` when 3+ repos exist in
  `.research/repo-analysis/`
- User wants cross-repo insights, not per-repo analysis
- After completing a batch of repo analyses

**When NOT to Use:** Single-repo analysis → `/repo-analysis` | Home repo audit →
`/audit-comprehensive` | Domain research → `/deep-research` | Deep-diving a
single theme → use "Explore a theme" follow-up first; if insufficient, escalate
to `/deep-research`

## Input

**Argument:** `/repo-synthesis` (no arguments — reads all analyzed repos)

**Flags:** `--min-repos=N` (override minimum, default 3) |
`--focus=themes|gaps|chain|evolution|portfolio|map` (produce only selected
outputs)

**Input artifacts** (consumed from `.research/repo-analysis/*/`):

| Artifact               | Required | Purpose                                |
| ---------------------- | -------- | -------------------------------------- |
| `analysis.json`        | MUST     | Repo type, scoring, dimensions         |
| `value-map.json`       | MUST     | 4 candidate types, cross-repo links    |
| `creator-view.md`      | MUST     | Prose analysis for thematic extraction |
| `content-eval.jsonl`   | MUST     | Individual content items evaluated     |
| `deep-read.md`         | SHOULD   | Internal artifacts read beyond code    |
| `coverage-audit.jsonl` | SHOULD   | What was and wasn't analyzed           |
| `mined-links.jsonl`    | MAY      | Link mining results (curated-list)     |

**Cross-repo artifacts** (consumed from `.research/repo-analysis/`):

| Artifact                   | Required | Purpose                        |
| -------------------------- | -------- | ------------------------------ |
| `reading-chain.jsonl`      | SHOULD   | Cross-repo relationship graph  |
| `EXTRACTIONS.md`           | SHOULD   | Cross-repo candidate summary   |
| `extraction-journal.jsonl` | SHOULD   | Per-candidate decision history |

**Output:** `.research/repo-analysis/SYNTHESIS.md` (primary) +
`.research/repo-analysis/synthesis.json` (structured)

---

## Process Overview

```
VALIDATE      Check       -> 3+ repos? Artifacts present? --focus valid?
WARM-UP       Orient      -> Repo count, candidate count, effort estimate
PHASE 1       Load        -> Read all artifacts, build internal graph, checkpoint
PHASE 2       Synthesize  -> Produce 6 outputs (or --focus subset) + fit refresh
PHASE 2.5     Verify      -> Lightweight CL: evidence check + T20 tally
PHASE 3       Self-Audit  -> Completeness, integrity, contracts, regression
PHASE 4       Present     -> Write SYNTHESIS.md, present summary, offer actions
RETRO         Feedback    -> Process feedback, persist to state
```

Phase markers: `========== PHASE N: [NAME] ==========`

---

## Validate (MUST)

Check `.research/repo-analysis/*/analysis.json` — count repos with v4.2
artifacts (`skillVersion` field). If fewer than `--min-repos` (default 3):
report count and exit.

**--focus validation (MUST):** If `--focus` provided, verify value is one of:
`themes`, `gaps`, `chain`, `evolution`, `portfolio`, `map`. Invalid value →
report error with valid options.

**Missing artifact handling (MUST):** For each repo, verify MUST artifacts
exist. If missing: exclude repo with warning. If <3 remain: abort.

**Empty artifact warning (MUST):** If a MUST artifact has no candidates (empty
arrays) or <10 lines (.md), warn: "Repo X has empty [artifact] — synthesis value
will be limited."

Mixed schema versions: warn about limited synthesis capability but proceed.

**Done when:** Repo count validated, artifacts verified, exclusions applied.

---

## Warm-Up (MUST)

Present after validation:

```
Repo Synthesis: Analyzing N repos ([list]).
Producing [6 or --focus subset] outputs: [list].
Candidates: ~N pattern, ~N knowledge, ~N content, ~N anti-pattern.
Estimated time: ~3-5 min (3 repos), ~8-15 min (6+ repos).
Outputs → .research/repo-analysis/SYNTHESIS.md
[If previous run: "Previous feedback: [X]. Adjusting accordingly."]
```

**Done when:** Summary presented.

---

## Phase 1: Load All Artifacts (MUST)

**Do NOT re-clone or re-analyze repos (Critical Rule #2).**

Read all artifacts from each repo directory. Build internal structures:

- **Candidate pool:** All candidates from all value-map.json files across ALL 4
  types, tagged by source repo and type.
- **Content items:** All entries from content-eval.jsonl files.
- **Tag cloud:** Aggregate repo types and topics from analysis.json files.
- **Relationship graph:** Load `reading-chain.jsonl` if it exists. Load all
  `related_repos[]` + `cross_repo_connections[]` from value-map.json. If
  `reading-chain.jsonl` missing, build chain from value-map.json only.
- **Prose corpus:** All `creator-view.md` files for thematic analysis.
- **Deep read corpus:** All `deep-read.md` files (where available).
- **Link pool:** All `mined-links.jsonl` entries (curated-list repos only).
- **Coverage gaps:** All `coverage-audit.jsonl` files.

**Checkpoint (MUST):** Present: "Loaded N repos (X candidates, Y content items,
Z anti-patterns). Proceed to synthesis?" Wait for confirmation.

Update state file.

**Done when:** All artifacts loaded, checkpoint confirmed by user.

---

## Phase 2: Produce Outputs (MUST, or --focus subset)

> Read `.claude/skills/repo-synthesis/REFERENCE.md` for output format
> specifications, JSON schemas, and heuristics for each synthesis section.

**Write conversationally, not clinically (Critical Rule #3).** These are
synthesized interpretations — after each section, note: "Override or rerank if
your context differs."

Show progress: `--- Output N of 6: [Name] ---`

### 2.1 Emergent Themes Report

Read all Creator View prose AND content-eval.jsonl entries. Identify recurring
themes (3+ repos), dominant patterns (>50%), contrarian signals (1 repo
disagrees), surprising connections, content-level themes, anti-pattern themes.

**Contradiction handling (MUST):** When repos contradict each other, present
both as a Contrarian Signal with evidence. Do not resolve — let the user decide.

### 2.2 Ecosystem Gap Analysis

Group repos by `ecosystem_tags`. Within each group: consensus, gaps,
innovations.

### 2.3 Reading Chain

Build ordered study sequence from relationship graph. Start with highest
`objective_score` repo, follow edges, branch when chains diverge.

### 2.4 Mental Model Evolution

Read Creator Views chronologically by `scan_date`. When multiple repos share a
scan_date, order alphabetically by repo name. Track interest shifts, confidence
shifts, emerging focus.

### 2.5 Fit Portfolio View

Aggregate ALL candidates across all repos — all 4 types. For each candidate:

1. Keep original `novelty`, `effort`, `relevance` from value-map.json.
2. Load current `SESSION_CONTEXT.md` and `ROADMAP.md` (MUST — do not use
   scan-time fit scores).
3. Compute `synthesis_fit`:
   - `relevance: high` + active sprint keyword match → `active-sprint`
   - `relevance: high` + no sprint match → `park-for-later`
   - `relevance: medium` + any sprint/roadmap match → `evergreen`
   - `relevance: low` or no match → `not-relevant`
4. Flag candidates whose synthesis_fit differs from scan-time relevance.

**Candidate cap (MUST):** If total >100, present top 50 by relevance: "Showing
top 50 of N. Full list in synthesis.json."

### 2.6 Cross-Repo Knowledge Map

Build domain coverage matrix. Identify well-covered (3+ repos) and gap domains.
Suggest repos to fill gaps (MAY use web search). If web search unavailable: "Gap
identified but no scan suggestion available."

Update state file after each output.

**Done when:** All 6 outputs (or --focus subset) produced and written to disk.

---

## Phase 2.5: Verification Pass (MUST)

Quick verification of interpretive claims:

1. Each emergent theme: confirm 3+ repos provide evidence (check Creator Views).
2. Each gap: confirm no analyzed repo covers it.
3. Each reading chain transition: confirm relationship exists in value-map.json.
4. Correct any outputs that fail verification.

Present T20 tally: N confirmed, M corrected, K extended, J new.

**Done when:** All claims verified, corrections applied, T20 tally presented.

---

## Phase 3: Self-Audit (MUST)

1. **Completeness:** SYNTHESIS.md has all 6 sections (or --focus subset).
   synthesis.json exists.
2. **Orphan detection:** No unreferenced files in `.research/repo-analysis/`.
3. **Build integrity:** Grep outputs for TODO/FIXME/placeholder/TBD.
4. **Gap analysis:** Compare `outputs_completed` in state against expected.
5. **Contract verification:** Validate synthesis.json against REFERENCE.md
   schema — all required keys present, arrays are arrays, fields non-null.
6. **Regression detection:** If previous SYNTHESIS.md exists, verify current
   covers at least the same sections. Flag missing as REGRESSION.

**Done when:** All dimensions pass. If failures: fix and re-verify.

---

## Phase 4: Present + Follow-up (MUST)

1. **SYNTHESIS.md** (MUST) — include doc header per project standards (version,
   date, repos included).
2. **synthesis.json** (MUST) — structured data matching REFERENCE.md schema.
3. **Previous comparison** (SHOULD) — if prior SYNTHESIS.md existed, add
   "Changes Since Last Synthesis": new themes, resolved gaps, fit movements.
4. **Present inline** (MUST) — 2-3 paragraphs per section, top findings. Do NOT
   dump the entire file into conversation.
5. **Follow-up actions:**

| Action                     | Description                                                 |
| -------------------------- | ----------------------------------------------------------- |
| **Explore a theme**        | Deep-dive a theme; escalate to `/deep-research` if needed   |
| **Fill a gap**             | Queue `/repo-analysis` scan for a gap domain                |
| **Extract top candidates** | Future — manually copy candidates to project location       |
| **Save to memory**         | 3-5 most actionable insights as project memory              |
| **Inject into deep-plan**  | `/deep-plan --context=.research/repo-analysis/SYNTHESIS.md` |
| **Done**                   | Exit                                                        |

**Delegation:** User says "you decide" → select highest-impact action, record as
`delegated-action`. When user selects an action, ask: "Why this one?" Save
rationale to state.

**Closure (MUST):** "Synthesis complete. Artifacts: SYNTHESIS.md (N sections),
synthesis.json, state updated."

**Done when:** Artifacts written, summary presented, follow-up offered.

---

## Retro (MUST)

"Any observations about the synthesis quality or process?" Save to state file
`process_feedback`. Accept empty/"none".

## State File & Resume

> See REFERENCE.md for full state schema and guard rails.

**Path:** `.claude/state/repo-synthesis.state.json`

Update after every phase. On re-invocation: offer Resume/Re-run. Resume skips
completed outputs (per `outputs_completed`), restarts at first incomplete
output.

**Pause:** User says "pause" → save state, print progress (completed/pending
outputs), exit.

**Session-end:** State retained as record — no cleanup needed.

## Integration

- **Upstream:** `/repo-analysis` (sole producer of input artifacts)
- **Downstream:** `/deep-plan` (inject as research), project memory
- **Neighbors:** `/repo-analysis` (companion), `/audit-comprehensive` (home
  repo), `/deep-research` (theme escalation)
- **References:** [REFERENCE.md](./REFERENCE.md),
  [repo-analysis REFERENCE.md](../repo-analysis/REFERENCE.md)

---

_v1.2 | 2026-04-06 | Skill audit (47 decisions): add self-audit phase,
verification pass, warm-up/progress/closure, pause/resume, candidate cap,
contradiction handling, previous-synthesis comparison, inference disclosure.
Merge Phase 3 into 2.5, extract guard rails to REFERENCE.md._

_v1.1 | 2026-04-06 | Align with repo-analysis v4.2: 3 new input artifacts, 4
candidate types, cross_repo_connections, content + anti-pattern themes._

_v1.0 | 2026-04-05 | Initial creation from 30-decision deep-plan._
