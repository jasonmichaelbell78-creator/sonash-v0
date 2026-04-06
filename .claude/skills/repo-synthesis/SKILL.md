---
name: repo-synthesis
description: >-
  Cross-repo synthesis across analyzed repositories. Produces emergent themes,
  ecosystem gaps, reading chains, mental model evolution, fit portfolio views,
  and cross-repo knowledge maps. Companion to /repo-analysis — consumes its
  output artifacts. Auto-offered when 3+ repos analyzed.
---

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-05
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Repo Synthesis

Cross-repo intelligence from your analyzed repositories. Where `/repo-analysis`
examines one repo at a time, `/repo-synthesis` finds the emergent story across
all of them — recurring themes, ecosystem gaps, how your thinking has shifted,
and what's brilliant regardless of your current sprint.

## Critical Rules (MUST follow)

1. **Minimum 3 repos.** Do NOT run with fewer than 3 analyzed repos. The value
   is in cross-cutting patterns — 2 repos is a comparison, not synthesis.
2. **Read, don't re-analyze.** Consume existing artifacts. Never re-clone,
   re-scan, or regenerate repo-analysis output. If artifacts are missing, report
   which repo lacks what and suggest re-scanning.
3. **Conversational, not clinical.** Match the Creator View prose style —
   written as you'd explain insights to a colleague, not as a compliance report.
4. **Refresh fit scores.** Always recompute `personal_fit_score` against current
   `SESSION_CONTEXT.md` — scan-time fit scores may be stale (Decision #24).
5. **State file on every phase.** Synthesis can be long. Compaction will happen.
6. **Write-to-disk-first.** Each output written before proceeding to the next.

## When to Use

- User invokes `/repo-synthesis` explicitly
- Auto-offered by `/repo-analysis` when 3+ repos exist in
  `.research/repo-analysis/`
- User wants cross-repo insights, not per-repo analysis
- After completing a batch of repo analyses

**When NOT to Use:** Single-repo analysis → `/repo-analysis` | Home repo audit →
`/audit-comprehensive` | Domain research → `/deep-research`

## Input

**Argument:** `/repo-synthesis` (no arguments — reads all analyzed repos)

**Flags:** `--min-repos=N` (override minimum, default 3) |
`--focus=themes|gaps|chain|portfolio` (produce only selected outputs)

**Input artifacts** (consumed from `.research/repo-analysis/*/`):

| Artifact                   | Required | Purpose                                                                                           |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `analysis.json`            | MUST     | Repo type, scoring, dimensions, absence patterns                                                  |
| `value-map.json`           | MUST     | 4 candidate types (pattern/knowledge/content/anti-pattern), cross_repo_connections, related_repos |
| `creator-view.md`          | MUST     | Prose analysis for thematic extraction                                                            |
| `content-eval.jsonl`       | MUST     | Individual content items evaluated for relevance                                                  |
| `deep-read.md`             | SHOULD   | Internal artifacts read beyond code                                                               |
| `coverage-audit.jsonl`     | SHOULD   | What was and wasn't analyzed — deferred items                                                     |
| `mined-links.jsonl`        | MAY      | Link mining results (curated-list repos)                                                          |
| `reading-chain.jsonl`      | SHOULD   | Cross-repo relationship graph                                                                     |
| `EXTRACTIONS.md`           | SHOULD   | Cross-repo candidate summary (all 4 types)                                                        |
| `extraction-journal.jsonl` | SHOULD   | Per-candidate decision history                                                                    |

**Output:** `.research/repo-analysis/SYNTHESIS.md` (primary) +
`.research/repo-analysis/synthesis.json` (structured)

---

## Process Overview

```
VALIDATE   Check       -> 3+ repos? Artifacts present? Rate: missing data
PHASE 1    Load        -> Read all artifacts, build internal graph
PHASE 2    Synthesize  -> Produce 6 outputs (or --focus subset)
PHASE 3    Refresh     -> Recompute fit against current SESSION_CONTEXT.md
PHASE 4    Present     -> Write SYNTHESIS.md, present inline, offer actions
VERIFY     Artifacts   -> Check all outputs produced
```

Phase markers: `========== PHASE N: [NAME] ==========`

---

## Validate

Check `.research/repo-analysis/*/analysis.json` — count repos with v4.2
artifacts (check `skillVersion` field). If fewer than 3: report count and exit.
If some repos have older skill versions: warn about limited synthesis capability
(missing content-eval, deep-read, coverage-audit) but proceed. List repos being
synthesized with their skill versions.

**Missing artifact handling (MUST):** For each repo, verify MUST artifacts
exist. If `creator-view.md` or `value-map.json` missing: exclude repo from
synthesis with warning, don't silently degrade. If <3 remain after exclusions:
abort.

---

## Phase 1: Load All Artifacts (MUST)

Read all artifacts from each repo directory. Build internal structures:

- **Candidate pool:** All candidates from all value-map.json files across ALL 4
  types (patternCandidates, knowledgeCandidates, contentCandidates,
  antiPatternCandidates), tagged by source repo and type. Preserve
  novelty/effort/relevance fields.
- **Content items:** All entries from content-eval.jsonl files — these are the
  specific tutorials, APIs, guides, papers evaluated for relevance.
- **Anti-patterns:** All antiPatternCandidates — what NOT to do, across repos.
- **Tag cloud:** Aggregate repo types and topics from all analysis.json files.
- **Relationship graph:** Load `reading-chain.jsonl` + all `related_repos[]` +
  all `cross_repo_connections[]` (typed: shared-pattern, complementary,
  referenced, overlapping-finding).
- **Prose corpus:** All `creator-view.md` files for thematic analysis.
- **Deep read corpus:** All `deep-read.md` files for internal artifact insights.
- **Link pool:** All `mined-links.jsonl` entries (curated-list repos only).
- **Coverage gaps:** All `coverage-audit.jsonl` files — what was deferred,
  flagged for investigation, or skipped across all repos.

Update state file.

---

## Phase 2: Produce 6 Outputs (MUST, or --focus subset)

### 2.1 Emergent Themes Report

Read all Creator View prose AND content-eval.jsonl entries chronologically.
Themes emerge from prose AND from specific content items. Identify:

- Recurring themes across 3+ repos (e.g., "agent autonomy," "skill
  distribution")
- Dominant patterns (what most repos agree on)
- Contrarian signals (what one repo does that contradicts the rest)
- Surprising connections between repos that weren't linked in reading-chain
- **Content-level themes:** Recurring content types (tutorials, APIs, guides,
  papers) that point to the same domain — even if the repos themselves are
  different. E.g., "3 repos surface React-related content" or "2 repos
  independently flag skill distribution mechanisms."
- **Anti-pattern themes:** Recurring warnings from antiPatternCandidates — what
  multiple repos independently caution against.

Output: conversational prose. Not a list of themes — a narrative that tells the
story of what these repos collectively teach. See REFERENCE.md Section 1.

### 2.2 Ecosystem Gap Analysis

Group repos by `ecosystem_tags`. Within each group:

- What do ALL repos in this group do? (consensus)
- What does NO repo do that they arguably should? (gap)
- What does exactly ONE repo do differently? (innovation or outlier)

Output: gap list with evidence + opportunity assessment. Each gap rated by
potential impact. See REFERENCE.md Section 2.

### 2.3 Reading Chain

Read `reading-chain.jsonl` + all `related_repos[]` + all
`cross_repo_connections[]` (typed relationships: shared-pattern, complementary,
referenced, overlapping-finding). Produce an ordered study sequence:

- Start with the highest-objective-score repo
- Follow relationship edges (inspired-by, uses, extends)
- Branch when chains diverge
- Label each transition with why this repo leads to the next

Output: visual chain + rationale. See REFERENCE.md Section 3.

### 2.4 Mental Model Evolution

Read Creator Views chronologically (by `scan_date` in analysis.json). Track:

- What the user found interesting in early scans vs later scans
- Shifts in what was classified as "Behind" vs "Ahead" vs "Different"
- Evolution of which Knowledge Candidates were rated Tier 1
- Changes in which ecosystem tags recur

Output: narrative of perspective shifts. NOT pre-defined schema — this emerges
from the data. See REFERENCE.md Section 4.

### 2.5 Fit Portfolio View

Aggregate ALL candidates across all repos — all 4 types (pattern, knowledge,
content, anti-pattern). For each candidate:

1. Keep original scoring fields (`novelty`, `effort`, `relevance`) from
   value-map.json. These are the scan-time assessments.
2. Compute `synthesis_fit_score` against current `SESSION_CONTEXT.md` (Phase 3)
   using relevance + home-context alignment.
3. Classify `fit_class` based on synthesis scoring.

Content candidates include URLs — these are the actionable items. Anti-pattern
candidates flag what to avoid — group separately.

Sort by relevance descending within each type. Group into fit classes.

Output: ranked portfolio table + narrative highlighting top candidates whose fit
changed since scan. See REFERENCE.md Section 5.

### 2.6 Cross-Repo Knowledge Map

Map what domains are well-covered by analyzed repos vs what has gaps:

- Build domain coverage matrix from `ecosystem_tags` + Creator View Section 1
- Identify well-covered domains (3+ repos)
- Identify gap domains (mentioned in home context but no repo covers them)
- Suggest repos to analyze next to fill gaps (MAY use web search)

Output: domain matrix + gap recommendations. See REFERENCE.md Section 6.

Update state file after each output.

---

## Phase 3: Refresh Fit Scores (MUST)

Load current `SESSION_CONTEXT.md` and `ROADMAP.md`. For every candidate in the
fit portfolio (Section 2.5):

- Recompute `personal_fit_score` based on current active sprint
- Update `fit_class` derivation
- Track which candidates changed class (e.g., `park → active-sprint`)

Write refreshed scores to `synthesis.json`. Do NOT modify per-repo
`value-map.json` files — synthesis overlay only.

---

## Phase 4: Present + Follow-up (MUST)

1. Write `SYNTHESIS.md` to `.research/repo-analysis/SYNTHESIS.md` (MUST)
2. Write `synthesis.json` for structured consumption (MUST)
3. Present synthesis inline — full narrative (MUST)
4. Offer follow-up actions:

| Action                     | Description                                    |
| -------------------------- | ---------------------------------------------- |
| **Explore a theme**        | Deep-dive into a specific emergent theme       |
| **Fill a gap**             | Queue a `/repo-analysis` scan for a gap domain |
| **Extract top candidates** | Start extraction workflow for highest-ranked   |
| **Save to memory**         | Persist key synthesis findings                 |
| **Done**                   | Cleanup, exit                                  |

---

## Artifact Verification (before presenting)

Verify all expected outputs exist based on `--focus` or full run:

- `SYNTHESIS.md` — always
- `synthesis.json` — always
- Each of 6 sections present in SYNTHESIS.md (or subset per `--focus`)

Flag missing outputs before presenting follow-up actions.

---

## State File & Resume

**Path:** `.claude/state/repo-synthesis.state.json`

Update after every phase. On re-invocation: offer Resume/Re-run. Resume skips
completed outputs. Schema in REFERENCE.md.

## Compaction Resilience

Each output section writes to SYNTHESIS.md incrementally. State file tracks
which sections are complete. On resume, skip completed sections.

## Integration

- **Upstream:** `/repo-analysis` (sole producer of input artifacts)
- **Downstream:** `/deep-plan` (inject as research), project memory, extraction
- **Neighbors:** `/repo-analysis` (companion), `/audit-comprehensive` (home
  repo)
- **References:** [REFERENCE.md](./REFERENCE.md),
  [repo-analysis REFERENCE.md](../repo-analysis/REFERENCE.md) (input schemas)

## Guard Rails

- **<3 repos:** Abort with clear message, suggest more scans
- **Mixed schema versions:** Warn, proceed with available data, note limitations
- **Stale fit scores:** Always refresh — never present scan-time fit as current
- **Missing artifacts:** Exclude repo with warning, don't silently degrade
- **Scope:** This skill synthesizes. It does NOT re-analyze, re-clone, or modify
  per-repo artifacts.

## Retro

After follow-up: "Any observations about the synthesis quality or process?"

---

_v1.1 | 2026-04-06 | Align with repo-analysis v4.2: add 3 new input artifacts
(deep-read.md, content-eval.jsonl, coverage-audit.jsonl), 4 candidate types
(pattern/knowledge/content/anti-pattern), cross_repo_connections in reading
chain, content-level + anti-pattern themes, fix fit portfolio scoring model._

_v1.0 | 2026-04-05 | Initial creation from 30-decision deep-plan. Companion to
repo-analysis v4.1. 6 synthesis outputs, fit refresh, conversational style._
