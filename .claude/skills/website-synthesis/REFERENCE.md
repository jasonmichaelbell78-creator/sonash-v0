<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Website Synthesis Reference

Output specifications, paradigm templates, signal detection rubric, source
weighting details, and state schema for the `/website-synthesis` skill.

---

## 1. Paradigm Templates

### 1.1 Thematic Synthesis (default)

**Purpose:** Identify recurring themes, dominant patterns, and contrarian
signals across all analyzed websites.

**Heuristics:**

- **Theme detection:** A theme is "emergent" when 3+ sites independently exhibit
  it — in Creator View prose, knowledge candidates, or value axes.
- **Dominance:** A pattern is "dominant" when >50% of sites exhibit it.
- **Contrarian signal:** Exactly one site does the opposite of the dominant
  pattern. Often the most interesting finding.
- **Surprising connections:** Sites not sharing domains but overlapping on
  themes. Discovered by value axis overlap + prose keyword analysis.
- **Query fan-out:** Generate 8-12 thematic questions from the combined prose
  corpus. Score each site against each question (0-3 scale: absent, mentioned,
  discussed, primary focus). Themes emerge from the scoring matrix.
- **Saturation:** When 3 consecutive sites (ordered by analysis date) yield no
  new themes above the "mentioned" threshold, thematic synthesis is complete.

**Output format (in synthesis.md):**

```markdown
## Thematic Synthesis

### Theme: [Name]

**Sites:** [site-a], [site-b], [site-c] | **Source weight:** [weighted score]

[Conversational paragraph: what the theme is, which sites exhibit it, how their
treatments differ, why it matters to your work. Reference specific Creator View
sections. Weight evidence by source tier.]

### Dominant Pattern: [Name]

[What most sites agree on. Why consensus exists. Source tier breakdown.]

### Contrarian Signal: [Name]

[The one site that disagrees. Why their approach is worth studying.]

### Surprising Connection: [Site A] <-> [Site B]

[Sites not linked but sharing themes. What the connection implies.]

### Thematic Saturation

[When saturation was reached. How many sites contributed before diminishing
returns. Which questions had the broadest coverage.]
```

**Structured output (in synthesis.json):**

```json
{
  "schema_version": "1.0",
  "paradigm": "thematic",
  "themes": [
    {
      "name": "string",
      "type": "emergent|dominant|contrarian|connection",
      "sites": ["site-slug"],
      "source_tiers": { "T1": 1, "T2": 2, "T3": 0, "T4": 0 },
      "weighted_evidence_score": 8.0,
      "evidence": "string",
      "relevance_to_home": "string"
    }
  ],
  "saturation": {
    "reached": true,
    "at_site_count": 8,
    "total_sites": 10,
    "consecutive_no_new": 3
  }
}
```

---

### 1.2 Narrative Synthesis

**Purpose:** Track evolution of an idea, approach, or technology across sources
ordered chronologically.

**Heuristics:**

- Order sites by publication date, last-updated date, or analysis date
  (preference in that order).
- Identify claim evolution: how the same concept is described differently across
  the timeline.
- Mark inflection points: where claims shift direction (e.g., "best practice"
  becomes "anti-pattern").
- Track terminology drift: same concept, different names across time periods.

**Output format (in synthesis.md):**

```markdown
## Narrative Synthesis

### Timeline

**[Date range]** | **[N] sites** | **Topic:** [central concept]

#### Phase 1: [Label] ([date range])

[Sites from this period. What they claimed. Source tier context.]

#### Inflection: [What changed]

[The shift point. Which site(s) drove the change. Evidence.]

#### Phase 2: [Label] ([date range])

[How the narrative evolved. What new sites added.]

### Terminology Map

| Concept   | Early Term | Current Term | Shift Point |
| --------- | ---------- | ------------ | ----------- |
| [concept] | [old name] | [new name]   | [site/date] |
```

**Structured output:**

```json
{
  "schema_version": "1.0",
  "paradigm": "narrative",
  "phases": [
    {
      "label": "string",
      "date_range": "string",
      "sites": ["site-slug"],
      "claims": ["string"],
      "source_tiers": { "T1": 0, "T2": 1, "T3": 1, "T4": 0 }
    }
  ],
  "inflections": [
    {
      "description": "string",
      "trigger_site": "site-slug",
      "before_claim": "string",
      "after_claim": "string"
    }
  ],
  "terminology_map": [
    {
      "concept": "string",
      "early_term": "string",
      "current_term": "string",
      "shift_site": "site-slug"
    }
  ]
}
```

---

### 1.3 Matrix Synthesis

**Purpose:** Structured comparison across identical dimensions for all sites.

**Heuristics:**

- Dimensions come from the union of all value axes and Engineer View dimensions
  present in the analyzed sites.
- For each cell (site x dimension): extract the site's position from its Creator
  View and Engineer View, score as Strong/Present/Weak/Absent.
- Highlight outlier cells: a site that is "Strong" where all others are "Absent"
  or vice versa.
- Row summaries: characterize each site's overall profile.
- Column summaries: characterize each dimension's coverage across sites.

**Output format (in synthesis.md):**

```markdown
## Matrix Synthesis

### Comparison Matrix

| Dimension         | [site-a] | [site-b] | [site-c] | Coverage |
| ----------------- | -------- | -------- | -------- | -------- |
| Content Depth     | Strong   | Present  | Weak     | 3/3      |
| Original Research | Strong   | Absent   | Absent   | 1/3 \*   |
| Link Quality      | Present  | Strong   | Present  | 3/3      |

(\*) = outlier: only one site covers this dimension

### Site Profiles

**[site-a]:** [Characterization based on row pattern]

### Dimension Coverage

**Content Depth:** [All sites cover this. Consensus view. Strongest source.]
**Original Research:** [Only site-a. Outlier — worth studying specifically.]
```

**Structured output:**

```json
{
  "schema_version": "1.0",
  "paradigm": "matrix",
  "dimensions": ["string"],
  "sites": ["site-slug"],
  "matrix": [
    {
      "dimension": "string",
      "scores": {
        "site-slug": "strong|present|weak|absent"
      },
      "coverage_ratio": "3/5",
      "outlier": true
    }
  ],
  "site_profiles": [
    {
      "site": "site-slug",
      "characterization": "string",
      "strongest_dimensions": ["string"],
      "weakest_dimensions": ["string"]
    }
  ]
}
```

---

### 1.4 Meta-pattern Synthesis

**Purpose:** Find patterns in how sites organize and frame knowledge — a
synthesis of approaches rather than claims.

**Heuristics:**

- Classify each site's framing: tutorial, reference, opinion, case-study,
  comparison, tool-showcase, theoretical.
- Identify approach clusters: groups of sites that frame the problem space
  similarly.
- Find meta-patterns: structural choices that recur (e.g., "most sites lead with
  problems, not solutions" or "all expert sites separate concept from
  implementation").
- Assess knowledge structure quality: which framing approaches produce the most
  actionable knowledge for the creator.

**Output format (in synthesis.md):**

```markdown
## Meta-pattern Synthesis

### Framing Taxonomy

| Framing         | Sites              | Count |
| --------------- | ------------------ | ----- |
| Tutorial-first  | [site-a], [site-d] | 2     |
| Reference-first | [site-b], [site-c] | 2     |
| Opinion-driven  | [site-e]           | 1     |

### Approach Clusters

**Cluster: [Name]** — Sites: [list] [What they share in how they organize
knowledge. Why this framing works or doesn't for your purposes.]

### Meta-patterns

**Pattern: [Name]** [A structural choice visible across clusters. What it
implies about the field's maturity or the audience's needs.]

### Knowledge Structure Quality

[Which framing approach produces the most actionable output for your work.
Evidence from Creator View Section 1 across sites.]
```

**Structured output:**

```json
{
  "schema_version": "1.0",
  "paradigm": "meta-pattern",
  "framings": [
    {
      "type": "tutorial|reference|opinion|case-study|comparison|tool-showcase|theoretical",
      "sites": ["site-slug"],
      "count": 2
    }
  ],
  "clusters": [
    {
      "name": "string",
      "sites": ["site-slug"],
      "shared_approach": "string",
      "effectiveness_for_creator": "high|medium|low"
    }
  ],
  "meta_patterns": [
    {
      "name": "string",
      "description": "string",
      "evidence_sites": ["site-slug"]
    }
  ]
}
```

---

## 2. Signal Detection Rubric

Signals are detected in Phase 3 regardless of paradigm. Every claim carries
source tier weight.

### 2.1 Convergence

**Definition:** The same claim, finding, or recommendation appears in 3+
independent sites.

**Detection method:**

1. Extract key claims from each site's Creator View (Section 2: What This Site
   Understands).
2. Normalize claims to canonical form (strip site-specific examples).
3. Match claims by semantic similarity, not string matching.
4. Require independence: sites must not cite each other as sources. If site-b
   cites site-a, they count as 1 source, not 2.

**Scoring:**

```
convergence_score = sum(source_tier_weight[site] for site in matching_sites)

Example:
  T1 site + T2 site + T3 site = 3.0 + 2.0 + 1.0 = 6.0  (strong)
  T3 site + T3 site + T4 site = 1.0 + 1.0 + 0.5 = 2.5  (moderate)
  T4 site + T4 site + T4 site = 0.5 + 0.5 + 0.5 = 1.5  (weak)
```

**Confidence classification:**

| Weighted Score | Confidence | Label                |
| -------------- | ---------- | -------------------- |
| >= 6.0         | HIGH       | Strong convergence   |
| 3.0 - 5.9      | MEDIUM     | Moderate convergence |
| 1.5 - 2.9      | LOW        | Weak convergence     |
| < 1.5          | ---        | Not convergence      |

### 2.2 Divergence

**Definition:** Contradicting claims across sites on the same topic.

**Detection method:**

1. After convergence detection, check remaining claims for contradictions.
2. A divergence requires: same topic, opposite conclusion, both supported by
   evidence.
3. Surface to user with both positions and source tiers.

**Scoring:** Higher source tier divergence is more significant. T1 vs T1
divergence is a genuine field disagreement. T1 vs T4 divergence is likely T4
being wrong.

**Output:** Flag with both positions, source tiers, and recommended resolution
(study the T1 source, check recency, look for methodological differences).

### 2.3 Gap

**Definition:** A topic covered meaningfully by exactly 1 site but absent from
all others.

**Detection method:**

1. Build topic index from all sites' Creator Views and value axes.
2. For each topic, count sites that address it at "discussed" level or above.
3. Topics with count = 1 are gaps.
4. Rate gap significance by how relevant the topic is to home context
   (SESSION_CONTEXT.md, ROADMAP.md).

**Output:** Gap list with: the topic, the sole source site, its source tier,
relevance to home context, and whether to pursue (analyze more sites on this
topic) or accept (niche topic, one source is sufficient).

### 2.4 Trend

**Definition:** A pattern visible only across sites, not within any single site.

**Detection method:**

1. After per-site analysis, look for patterns that no individual site states
   explicitly but emerge from the collection.
2. Common trend types: technology adoption curves, methodology shifts, audience
   evolution, quality distribution patterns.
3. Require evidence from 3+ sites (not explicit claims, but observable
   patterns).

**Output:** Trend description with evidence trail (which sites, what was
observed, why the pattern is significant).

---

## 3. Source Weighting Details

### 3.1 Tier Classification

Assign during Phase 1 based on analysis.json metadata and Creator View content.

| Tier | Label                 | Weight | Criteria                                                                     |
| ---- | --------------------- | ------ | ---------------------------------------------------------------------------- |
| T1   | Original research     | 3.0x   | Contains primary data, experiments, datasets, original methodology           |
| T2   | Expert synthesis      | 2.0x   | Domain expert analysis, peer-reviewed, deep technical writing with citations |
| T3   | Aggregation           | 1.0x   | Curated collections, awesome lists, directories, link roundups               |
| T4   | Secondary aggregation | 0.5x   | Blog posts summarizing other posts, news aggregation, AI-generated summaries |

### 3.2 Tier Assignment Signals

| Signal                              | Suggests |
| ----------------------------------- | -------- |
| Dataset or raw data published       | T1       |
| Methodology section present         | T1       |
| Author has domain credentials       | T2       |
| Extensive citation/bibliography     | T2       |
| "Best of" or "awesome" in title     | T3       |
| Link list with brief descriptions   | T3       |
| "Summary of [other source]" pattern | T4       |
| No citations, derivative content    | T4       |

### 3.3 Weighting in Practice

Source weighting affects:

- **Convergence scoring:** Higher-tier agreement is worth more
- **Divergence priority:** T1 vs T1 is a real disagreement; T1 vs T4 is not
- **Theme evidence strength:** A theme supported only by T4 sources is flagged
  as weakly supported
- **Candidate ranking:** Knowledge candidates from T1 sources rank higher in the
  synthesis portfolio

---

## 4. Output Schemas

### 4.1 synthesis.json (full schema)

```json
{
  "schema_version": "1.0",
  "skill": "website-synthesis",
  "paradigm": "thematic|narrative|matrix|meta-pattern",
  "synthesized_at": "ISO8601",
  "site_count": 8,
  "sites": [
    {
      "slug": "site-slug",
      "url": "https://example.com",
      "source_tier": "T1|T2|T3|T4",
      "source_weight": 3.0,
      "analysis_date": "ISO8601",
      "excluded": false,
      "exclusion_reason": null
    }
  ],
  "paradigm_output": {
    "_comment": "One of the paradigm-specific objects from Section 1"
  },
  "signals": {
    "convergence": [
      {
        "claim": "string",
        "sites": ["site-slug"],
        "weighted_score": 6.0,
        "confidence": "HIGH|MEDIUM|LOW",
        "independence_verified": true
      }
    ],
    "divergence": [
      {
        "topic": "string",
        "position_a": {
          "claim": "string",
          "sites": ["site-slug"],
          "tier": "T1"
        },
        "position_b": {
          "claim": "string",
          "sites": ["site-slug"],
          "tier": "T2"
        },
        "resolution_hint": "string"
      }
    ],
    "gaps": [
      {
        "topic": "string",
        "sole_source": "site-slug",
        "source_tier": "T2",
        "home_relevance": "high|medium|low",
        "recommendation": "pursue|accept"
      }
    ],
    "trends": [
      {
        "pattern": "string",
        "evidence_sites": ["site-slug"],
        "significance": "string"
      }
    ]
  },
  "knowledge_portfolio": {
    "top_candidates": [
      {
        "name": "string",
        "source_site": "site-slug",
        "source_tier": "T1",
        "objective_score": 85,
        "convergence_boost": true,
        "cross_site_evidence": ["site-slug"]
      }
    ]
  },
  "meta": {
    "thematic_questions_generated": 10,
    "saturation_reached": true,
    "processing_notes": "string"
  }
}
```

### 4.2 synthesis.md Template

```markdown
# Website Synthesis

**Paradigm:** [Thematic|Narrative|Matrix|Meta-pattern] **Sites synthesized:**
[N] **Date:** [ISO8601] **Source tier distribution:** T1: [n], T2: [n], T3: [n],
T4: [n]

---

## [Paradigm-specific sections]

[Content per paradigm template from Section 1 of this document]

---

## Signal Map

### Convergence ([N] signals)

[Strongest convergences first, with source tier weights]

### Divergence ([N] signals)

[Contradictions with both positions and resolution hints]

### Gaps ([N] signals)

[Single-source topics with relevance assessment]

### Trends ([N] signals)

[Cross-site patterns not visible within individual sites]

---

## Knowledge Portfolio

### Top Candidates (cross-site reinforced)

| Candidate | Source Site | Tier | Score | Convergence |
| --------- | ----------- | ---- | ----- | ----------- |
| [name]    | [site]      | T1   | 85    | +3 sites    |

---

## Synthesis Notes

[Processing observations, limitations, suggestions for further analysis]
```

---

## 5. Cross-Type Synthesis Hooks (Planned)

Future capability: synthesize across repos AND websites together. This section
documents the integration points for when cross-type synthesis is implemented.

**Status:** PLANNED. Do not implement. Document here for forward compatibility.

### 5.1 Shared Abstractions

Both `/repo-synthesis` and `/website-synthesis` produce:

- Themes with evidence
- Knowledge candidates with scores
- Signal detection (convergence, gaps)
- Source attribution

A cross-type synthesizer would consume both `synthesis.json` files and:

1. Merge candidate pools with source-type tags (repo vs website)
2. Detect cross-type convergence (a repo implements what a website recommends)
3. Detect cross-type divergence (a repo's approach contradicts website guidance)
4. Produce a unified knowledge map spanning code and content

### 5.2 Schema Compatibility Notes

- `synthesis.json` from both skills shares: `schema_version`, `synthesized_at`,
  `paradigm_output`, `signals` structure
- Differs in: source metadata (repo has `owner/repo`, website has `url`/`slug`),
  source weighting (repos don't have T1-T4 tiers)
- A future cross-type schema would need a `source_type` discriminator field

### 5.3 Invocation (future)

```
/cross-synthesis                          # All repos + all websites
/cross-synthesis --type=websites,repos    # Explicit
```

---

## 6. State File Schema

**Path:** `.claude/state/website-synthesis.state.json`

```json
{
  "skill": "website-synthesis",
  "version": "1.0",
  "status": "in-progress|complete|failed",
  "phase": 0,
  "paradigm": "thematic",
  "sites_loaded": ["site-slug"],
  "sites_excluded": [
    { "site": "site-slug", "reason": "missing SITE-ANALYSIS.md" }
  ],
  "outputs_completed": ["paradigm", "signals", "portfolio"],
  "focus": null,
  "startedAt": "ISO8601",
  "completedAt": null
}
```

---

## 7. Input Contract (cross-reference)

All input artifacts are produced by `/website-analysis` v1.0+. Key schemas:

- `analysis.json` -> website-analysis REFERENCE.md (core analysis artifact)
- `value-map.json` -> website-analysis REFERENCE.md (knowledge candidates)
- `SITE-ANALYSIS.md` -> website-analysis REFERENCE.md (Creator View prose)
- `links.json` -> website-analysis REFERENCE.md (scored link graph)
- `meta.json` -> website-analysis REFERENCE.md (site metadata)
- `findings.jsonl` -> website-analysis REFERENCE.md (individual findings)

**Missing artifact handling:** Sites without MUST artifacts are excluded with a
warning. Sites with partial SHOULD artifacts are included with reduced synthesis
capability noted.

---

## 8. Example Synthesis Output Structure

Illustrative directory structure after a thematic synthesis of 7 sites:

```
.research/website-analysis/
├── synthesis/
│   ├── synthesis.json          # Structured output (full schema per 4.1)
│   └── synthesis.md            # Human-readable synthesis (template per 4.2)
├── example-blog-com/
│   ├── analysis.json
│   ├── SITE-ANALYSIS.md
│   ├── value-map.json
│   └── ...
├── docs-tool-dev/
│   ├── analysis.json
│   ├── SITE-ANALYSIS.md
│   ├── value-map.json
│   └── ...
└── ... (5 more site directories)
```

---

## 9. Version History

| Version | Date       | Description                                             |
| ------- | ---------- | ------------------------------------------------------- |
| 1.0     | 2026-04-06 | Initial creation. Companion to website-analysis v1.0.   |
|         |            | 4 paradigm templates, signal rubric, source weighting,  |
|         |            | output schemas, cross-type hooks (planned).             |
|         |            | Source: DECISIONS.md #19/#20, RESEARCH_OUTPUT.md Sec 9. |
