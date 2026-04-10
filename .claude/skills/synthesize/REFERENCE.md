# /synthesize — Reference Material

Companion to `SKILL.md`. Detailed specs, schemas, algorithms, and heuristics
that would bloat the main skill file. Read on demand during execution.

> **Source:** Merged from `repo-synthesis/REFERENCE.md` (v1.3) and
> `website-synthesis/REFERENCE.md` (v1.1) per
> `.planning/synthesis-consolidation/DECISIONS.md`.

---

## Table of Contents

1. [Paradigm Templates](#1-paradigm-templates)
2. [Output Section Specs](#2-output-section-specs)
3. [Cross-Type Detection Methods (D#22)](#3-cross-type-detection-methods)
4. [Candidate Deduplication Algorithm (D#23)](#4-candidate-deduplication-algorithm)
5. [Source Tier Weighting (D#13)](#5-source-tier-weighting)
6. [Incremental Synthesis Algorithm (D#14)](#6-incremental-synthesis-algorithm)
7. [Re-synthesis Change Detection (D#10)](#7-re-synthesis-change-detection)
8. [Self-Audit Rubric (D#27)](#8-self-audit-rubric)
9. [State File Schema (D#17, D#19)](#9-state-file-schema)
10. [Synthesis JSON Schema (D#6)](#10-synthesis-json-schema)
11. [Subagent Strategy (D#20)](#11-subagent-strategy)
12. [Reading Chain Algorithm (D#25)](#12-reading-chain-algorithm)

---

## 1. Paradigm Templates

`--paradigm` reshapes how sections 1-6 are organized. All paradigms still
produce all 8 sections — only the framing differs.

### 1.1 Thematic (default)

Sections in standard order. Themes are emergent (clustering of evidence across
sources). Best for "what does my analysis pile actually say?" queries.

### 1.2 Narrative

Reorders to a timeline:

1. Origin themes (oldest analyzed sources)
2. Evolution (mental model section moves to position 2)
3. Convergence (current dominant themes)
4. Frontier (gaps + opportunity matrix)

Best for "how has my thinking evolved?" reflection.

### 1.3 Matrix

Replaces themes section with a comparison table:

- Rows = sources
- Columns = dimensions (purpose, novelty, fit, evidence quality, etc.)
- Cells = source-specific values

Reading chain becomes a routing column. Best for "which of these is the right
fit for X?" decision support.

### 1.4 Meta-Pattern

Themes section becomes a taxonomy:

- Top-level: pattern families (architecture, workflow, anti-pattern, etc.)
- Sub-level: specific patterns
- Leaf: source references

Best for "what kinds of things keep showing up?" abstraction.

---

## 2. Output Section Specs

### 2.1 Themes + Signals (merged)

```json
{
  "name": "string",
  "description": "string (1-3 sentences)",
  "evidence": [
    { "source_slug": "...", "source_type": "repo|...", "quote_or_ref": "..." }
  ],
  "convergence_count": "int (unique source count)",
  "convergence_confidence": "weak|medium|strong",
  "source_types": ["repo", "website"],
  "signal_strength": "weak|medium|strong (optional, for trending themes)"
}
```

Heuristic: `convergence_confidence`:

- 1 source = `weak`
- 2 sources = `medium`
- 3+ sources = `strong`
- Boost by `+1` band if cross-type (sources span 2+ types)

Theme detection: cluster candidates and findings by tag intersection + semantic
similarity + explicit candidate name overlap. Minimum cluster size: 1
(single-source themes are listed but flagged `weak`).

### 2.2 Ecosystem Gap Analysis

```json
{
  "domain": "string",
  "description": "what's missing",
  "why_unfilled": "explanation",
  "suggested_action": "next analysis or scan",
  "home_context_source": "where in home context this domain is referenced"
}
```

Algorithm: extract domains from `CLAUDE.md`, `ROADMAP.md`, `SESSION_CONTEXT.md`
(home context). Cross-reference against tags from analyzed sources. Domains in
home context but absent from analyzed tags → gap.

### 2.3 Reading Chain

See §12.

### 2.4 Mental Model Evolution

```json
{
  "interest_shifts": [...],
  "confidence_shifts": [...],
  "emerging_focus_tags": ["tag1", "tag2"],
  "date_range": "YYYY-MM-DD..YYYY-MM-DD"
}
```

Compare tag frequency, candidate extraction rates, and theme distribution across
`analyzed_at` time windows (early third vs middle vs recent third).

### 2.5 Fit Portfolio

All candidates from all sources, deduplicated (§4) and re-ranked. Each candidate
retains:

- All `finding_refs` from contributing sources
- Convergence boost (per §4)
- Tags accumulated across sources

### 2.6 Knowledge Map

```json
{
  "covered": [{ "domain": "...", "sources": [...], "quality": "..." }],
  "gaps": [{ "domain": "...", "home_context_source": "...", "suggested_scan": "..." }]
}
```

Domain extraction: union of all `tags` from analyzed sources. Quality: average
`quality_band` of sources covering the domain.

### 2.7 Opportunity Matrix

See SKILL.md Phase 6. Spec:

```json
{
  "rank": "int (1-N)",
  "title": "string",
  "description": "string",
  "effort": "E0|E1|E2|E3",
  "impact": "low|medium|high",
  "evidence": ["source_slug1", ...],
  "suggested_route": "/brainstorm|/deep-plan|/deep-research|/analyze"
}
```

Ranking: `impact_weight × convergence_count / effort_weight`. Effort weights:
E0=1, E1=2, E2=4, E3=8. Impact weights: low=1, medium=3, high=8.

Routing rule:

- Pure ideation → `/brainstorm`
- Concrete implementation needed → `/deep-plan`
- Knowledge gap to fill → `/deep-research`
- New source to analyze → `/analyze`

### 2.8 Changes Since Previous

See §7.

---

## 3. Cross-Type Detection Methods

D#22: highest recall — use all 4 methods, merge results.

### 3.1 Tag matching

For each (source A, source B) pair, compute
`len(A.tags ∩ B.tags) / len(A.tags ∪ B.tags)` (Jaccard). ≥ 0.3 → cross-type
connection.

### 3.2 Semantic similarity

Compare candidate names + descriptions across sources. Token overlap (after
stop-word removal) ≥ 0.5 → semantic match.

### 3.3 Candidate matching

Same `candidate.name` (case-insensitive) in 2+ sources → strong cross-source
signal. Always include in convergence.

### 3.4 Explicit connections

Source's `creator-view.md` or `findings.jsonl` references another analyzed
source by URL/slug → record explicit edge.

---

## 4. Candidate Deduplication Algorithm

D#23: dedupe within type, then promote across types with convergence boost.

### Steps

1. **Within-type pass:** group by (`name` lowercased, `type` enum). Merge
   members:
   - `tags` = union
   - `finding_refs` = union
   - `description` = longest non-empty
   - `novelty` = max (high > medium > low)
   - `effort` = max (E3 > E2 > E1 > E0)
   - `relevance` = max
   - Track `source_slugs` count.
2. **Cross-type pass:** group merged candidates by `name` lowercased. Merging
   crosses type boundaries. Track `source_types` count.
3. **Convergence boost:** rank by:
   `base_score + 5 × (source_slugs - 1) + 10 × (source_types - 1)`

A pattern in 3 independent sources is **validated**, not 3 separate candidates.

---

## 5. Source Tier Weighting

D#13: full tier assignment. Tier multiplier applies to evidence weight in theme
convergence calculations.

| Tier | Multiplier | Description                 |
| ---- | ---------- | --------------------------- |
| T1   | 3.0        | First-party / authoritative |
| T2   | 2.0        | Reliable secondary          |
| T3   | 1.0        | Community / informal        |
| T4   | 0.5        | Anonymous / unverified      |

### Default tier per source type (handler-suggested)

| Source type | Default | T1 examples             | T3-T4 examples    |
| ----------- | ------- | ----------------------- | ----------------- |
| `repo`      | T1      | All repos (first-party) | (n/a)             |
| `website`   | T2      | docs.python.org, arxiv  | random blogs      |
| `document`  | T2      | peer-reviewed PDFs      | anonymous gists   |
| `media`     | T2      | named expert talks      | anonymous YouTube |

User can override during pre-flight or via tags (`tier:T1`, `tier:T4`, etc.).

### Effective convergence weight

`weight(source) = tier_multiplier(source.tier)`

A theme with `[T1, T1, T2]` evidence has effective convergence `3 + 3 + 2 = 8`,
vs `[T2, T2, T2]` = `6`. The `convergence_count` in output remains the raw
count; the weighted score informs ranking.

---

## 6. Incremental Synthesis Algorithm

D#14: hybrid — new sources checked against previous conclusions.

### Steps

1. **Load previous synthesis** (`synthesis.json`).
2. **Identify new sources:** `analyzed_at > previous.generated_at`.
3. **For each new source:**
   - Extract candidates and findings.
   - For each existing theme: check whether new source provides supporting
     evidence (confirm), refuting evidence (contradict), or new dimension
     (extend).
4. **Confirm:** boost `convergence_count` and `convergence_confidence`.
5. **Extend:** add new evidence ref to existing theme. May upgrade confidence
   band.
6. **Contradict:** flag the theme. If contradiction is strong, **escalate to
   full re-run** — incremental can't safely patch contradictory evidence.
7. **New themes:** new source patterns not in any existing theme become new
   `weak`-confidence themes.
8. **Update Changes Since Previous:** see §7.

### Escalation rules

- ≥ 1 strong contradiction → escalate to full
- ≥ 3 weak contradictions → escalate to full
- Ratio of new themes to existing themes > 0.5 → escalate to full

Escalated runs notify the user before proceeding ("incremental detected
contradictions, switching to full re-synthesis").

---

## 7. Re-synthesis Change Detection

D#10: all 6 dimensions. Always populated in `changes_since_previous` for
re-synthesis mode.

```json
{
  "themes": {
    "new": ["theme name", ...],
    "removed": ["theme name (no longer supported by evidence)", ...],
    "strengthened": ["theme name (confidence band ↑)", ...],
    "weakened": ["theme name (confidence band ↓)", ...]
  },
  "candidates": {
    "new": ["candidate name", ...],
    "promoted": ["candidate name (rank ↑)", ...],
    "demoted": ["candidate name (rank ↓)", ...]
  },
  "gaps": {
    "filled": ["domain (now covered)", ...],
    "new": ["domain (newly identified)", ...]
  },
  "confidence_shifts": [
    { "theme": "name", "from": "weak|medium|strong", "to": "weak|medium|strong" }
  ],
  "contradictions": [
    { "description": "...", "sources": ["slug1", "slug2"] }
  ],
  "source_impact": [
    { "source_slug": "...", "impact": "introduced 3 themes, 2 candidates" }
  ]
}
```

### Comparison methodology

- **Themes:** match by name (case-insensitive). New = in current, not in prior.
  Removed = in prior, not in current.
- **Strengthened/Weakened:** compare `convergence_confidence` band.
- **Candidates:** match by deduplicated name. Promoted/demoted via rank delta in
  fit_portfolio.
- **Gaps:** filled = in prior gaps, not in current. New = reverse.
- **Confidence shifts:** any theme with band change.
- **Contradictions:** new contradictions surfaced during verification phase.
- **Source impact:** for each source `analyzed_at > prior.generated_at`, compute
  themes/candidates introduced.

---

## 8. Self-Audit Rubric

10 dimensions (per SKILL.md "Self-Audit" section). Per-dimension criteria:

| #   | Dim                   | PASS                                     | FAIL                             |
| --- | --------------------- | ---------------------------------------- | -------------------------------- |
| 1   | Artifact existence    | Both `.md` and `.json` exist on disk     | Either missing                   |
| 2   | Schema validation     | `validate(json, 'synthesis').success`    | Validation error                 |
| 3   | Section completeness  | All 8 sections present (or noted absent) | Missing without explicit note    |
| 4   | Evidence grounding    | All themes have ≥1 evidence ref          | Any theme with empty `evidence`  |
| 5   | Candidate integrity   | No duplicate names after dedup           | Duplicate found                  |
| 6   | Convergence math      | `convergence_count == unique(evidence)`  | Mismatch                         |
| 7   | Dedup check           | Re-running dedup is no-op                | Re-dedup produces merges         |
| 8   | Gap validity          | All gap domains in home context          | Domain not found in home context |
| 9   | Opportunity grounding | All ops have ≥1 evidence ref             | Any op with empty `evidence`     |
| 10  | Changes accuracy      | (re-synthesis) Diff matches prior        | Diff is wrong                    |

WARN states: dimensions 4 and 9 may WARN (not FAIL) when a theme/op has only 1
evidence ref to a T3/T4 source. WARN does not block.

Audit summary appended to `synthesis.md`:

```markdown
## Self-Audit

| Dim | Status | Notes |
| --- | ------ | ----- |
| 1   | PASS   |       |
| ... | ...    | ...   |

Result: 10 PASS, 0 FAIL, 2 WARN. Acknowledged WARNs: dim 4, dim 9.
```

---

## 9. State File Schema

`.claude/state/synthesize.state.json`:

```json
{
  "schema_version": "1.0",
  "started_at": "ISO 8601",
  "completed_at": "ISO 8601 (null until done)",
  "mode": "full|incremental|re-synthesis",
  "paradigm": "thematic|narrative|matrix|meta-pattern",
  "scope": {
    "type_filter": "repo|website|document|media|null",
    "focus_filter": "themes|gaps|portfolio|chain|map|matrix|null"
  },
  "sources_loaded": [
    { "slug": "...", "tier": "T1", "depth": "standard" }
  ],
  "sources_excluded": [
    { "slug": "...", "reason": "quick-scan only" }
  ],
  "sections_completed": ["themes", "gaps", "chain", "evolution", "portfolio", "map", "matrix", "changes"],
  "subagent_dispatches": [
    { "agent": "...", "sources_assigned": [...], "result": "ok|error" }
  ],
  "self_audit": {
    "dimension_1": "pass", "dimension_2": "pass", ...
  },
  "previous_synthesis_archived_to": "history/synthesis-YYYY-MM-DD.md",
  "retros": [
    { "ts": "...", "q1": "...", "q2": "..." }
  ]
}
```

### Resume protocol

1. Read state file.
2. If `completed_at` is set: refuse resume (already done).
3. Else: skip phases per `sections_completed[]`. Re-validate inputs to ensure no
   source has been re-analyzed since `started_at` (would invalidate resume).

---

## 10. Synthesis JSON Schema

See `scripts/lib/analysis-schema.js` `synthesisRecord`. Top-level fields:

```
schema_version       string  ("1.0")
generated_at         string  (ISO 8601)
paradigm             enum    (thematic|narrative|matrix|meta-pattern)
mode                 enum    (full|incremental|re-synthesis)
sources_included     array   ([{ slug, source, source_type, source_tier, depth }])
sources_excluded     array   ([{ slug, reason }])
themes               array   (themeSchema, see §2.1)
ecosystem_gaps       array   (gapSchema, see §2.2)
fit_portfolio        object  ({ refreshed_at, candidates: [candidateSchema] })
knowledge_map        object  ({ covered, gaps })
opportunity_matrix   array   (opportunitySchema, see §2.7)
reading_chain        array   (chainNodeSchema, optional, see §12)
mental_model         object  (optional, see §2.4)
changes_since_previous  object  (re-synthesis only, see §7)
```

Validate via:

```js
const { validate } = require("./scripts/lib/analysis-schema.js");
const result = validate(synthesisJsonObj, "synthesis");
```

---

## 11. Subagent Strategy

D#20: hybrid. Inline for small counts, agents for large counts. Merge always
inline.

| Source count | Strategy                    |
| ------------ | --------------------------- |
| 1-9          | Fully inline                |
| 10-19        | 2 agents, ~7 sources each   |
| 20-29        | 3 agents, ~7-8 sources each |
| 30-49        | 4 agents, ~10 sources each  |
| 50+          | 6 agents, ~10 sources each  |

**Max sources per agent: 10.** Above this, agents start losing cross-source
connections (per "agent stalling pattern" feedback memory).

### Agent prompt template

Each agent gets:

- A slice of sources (slugs + paths to artifacts)
- The synthesis goal (themes, candidates, gaps relevant to its slice)
- Output format (JSON matching themeSchema, candidateSchema, gapSchema)
- Explicit instruction: "do not synthesize across YOUR slice — return raw
  per-source extractions plus initial clusters. Final synthesis is inline."

### Merge protocol

1. Collect all agent outputs.
2. Inline pass: dedupe candidates (§4), merge themes by name, recompute
   convergence across the full source set.
3. Run verification (Phase 3) on merged results.

If any agent returns empty or errors: do NOT silently skip. Per the "no empty
agent results" feedback, surface the failure and either retry the agent or fall
back to inline processing for that slice.

---

## 12. Reading Chain Algorithm

D#25: hybrid — dependency links > pedagogical ordering > tag clusters.

### Algorithm

1. **Dependency edges (highest quality):**
   - Repo fork relationships (`metadata.fork`, parent links)
   - Explicit references in `creator-view.md` (URL or slug)
   - Citation graphs in academic documents
2. **Pedagogical ordering (fallback):**
   - Classify each source into a tier:
     - `overview` — broad surveys, lists, intro articles
     - `tutorial` — step-by-step guides
     - `implementation` — production codebases, full systems
     - `theory` — academic papers, deep theoretical content
   - Order: overview → tutorial → implementation → theory
3. **Tag cluster ordering (final fallback):**
   - Group by primary tag.
   - Within group: order by `quality_score` descending.

### Output

```json
[
  {
    "order": 1,
    "source_slug": "...",
    "source_type": "website",
    "rationale": "Overview tier — broad survey of the domain",
    "tier": "overview"
  },
  ...
]
```

Length cap: none (per "no artificial caps" feedback). All analyzed sources
appear in the chain. The user can choose to read partially.

---

## Cross-References

- **DECISIONS.md:** `.planning/synthesis-consolidation/DECISIONS.md` — 32
  decisions backing every choice in this skill.
- **PLAN.md:** `.planning/synthesis-consolidation/PLAN.md` — 5 waves, 15 steps.
- **CONVENTIONS.md:** `.claude/skills/shared/CONVENTIONS.md` — Section 17
  (Synthesis Output Contract) and Section 12 (Handler Output Contract, for
  context).
- **Schema:** `scripts/lib/analysis-schema.js` — `synthesisRecord` Zod.
