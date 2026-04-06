<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-05
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Repo Synthesis Reference

Output specifications, input contracts, synthesis heuristics, and state schema
for the `/repo-synthesis` skill.

---

## 1. Emergent Themes Report

**Purpose:** Identify recurring patterns, dominant themes, and contrarian
signals across all analyzed repos.

**Heuristics:**

- **Theme detection:** A theme is "emergent" when 3+ repos independently exhibit
  it — in Creator View prose, ecosystem tags, or Knowledge Candidates.
- **Dominance:** A pattern is "dominant" when >50% of repos exhibit it.
- **Contrarian signal:** Exactly one repo does the opposite of the dominant
  pattern. Often the most interesting finding.
- **Surprising connections:** Repos not linked in reading-chain.jsonl but
  sharing themes. Discovered by tag overlap + prose keyword analysis.

**Output format (in SYNTHESIS.md):**

```markdown
## 1. Emergent Themes

### Theme: [Name]

[Conversational paragraph: what the theme is, which repos exhibit it, why it
matters to your work. Reference specific Creator View sections.]

### Dominant Pattern: [Name]

[What most repos agree on. Why consensus exists.]

### Contrarian Signal: [Name]

[The one repo that disagrees. Why their approach is worth studying.]

### Surprising Connection: [Repo A] ↔ [Repo B]

[Repos not linked but sharing themes. What the connection implies.]
```

**Structured output (in synthesis.json):**

```json
{
  "themes": [
    {
      "name": "string",
      "type": "emergent|dominant|contrarian|connection",
      "repos": ["owner/repo"],
      "evidence": "string",
      "relevance_to_home": "string"
    }
  ]
}
```

---

## 2. Ecosystem Gap Analysis

**Purpose:** Identify what's missing across groups of similar repos.

**Heuristics:**

- Group repos by primary `ecosystem_tag`. Groups with <2 repos are noted but not
  gap-analyzed (insufficient data).
- Within each group, build a feature/capability matrix from Creator View Section
  1 (What They Understand) + Knowledge Candidates.
- A "gap" is a capability that appears in home-repo context (ROADMAP, skills,
  active projects) but NO analyzed repo in the group provides.

**Output format:**

```markdown
## 2. Ecosystem Gaps

### Group: [Tag Name] ([N] repos)

**Consensus:** All repos in this group [do X]. **Gap:** None of them [do Y],
which your [project/skill] needs. **Innovation:** [Repo] uniquely [does Z] —
consider studying.
```

**Structured output:**

```json
{
  "ecosystem_gaps": [
    {
      "group_tag": "string",
      "repos_in_group": ["owner/repo"],
      "consensus": "string",
      "gaps": [
        {
          "description": "string",
          "home_context_need": "string",
          "impact": "high|medium|low"
        }
      ],
      "innovations": [
        {
          "repo": "owner/repo",
          "description": "string"
        }
      ]
    }
  ]
}
```

---

## 3. Reading Chain

**Purpose:** Produce an ordered study sequence across analyzed repos.

**Construction algorithm:**

1. Start with the repo having the highest `objective_score` composite
2. Follow `reading-chain.jsonl` edges and `related_repos[]` relationships
3. When no edge exists, connect by ecosystem tag similarity
4. Label each transition: `inspired-by`, `uses`, `similar-to`, `contrast`,
   `extends`, `referenced-in`, or `tag-similarity`
5. Branch when chains diverge (repo leads to 2+ successors)

**Output format:**

```markdown
## 3. Reading Chain

1. **[repo-A]** (Study, 92) — Start here: [why] ↓ _inspired-by_
2. **[repo-B]** (Explore, 72) — [why this follows] ↓ _contrast_
3. **[repo-C]** (Extract, 55) — [why the contrast is valuable] ├→ **[repo-D]**
   (branch: [reason]) └→ **[repo-E]** (branch: [reason])
```

**Structured output:**

```json
{
  "reading_chain": [
    {
      "position": 1,
      "repo": "owner/repo",
      "creator_verdict": "Study",
      "creator_score": 92,
      "transition_from": null,
      "transition_type": "start",
      "rationale": "string"
    }
  ]
}
```

---

## 4. Mental Model Evolution

**Purpose:** Track how the user's perspective has shifted across scans.

**Heuristics:**

- Order Creator Views by `scan_date` in analysis.json
- Track evolution vectors:
  - **Interest shift:** What was Tier 3 in early scans but Tier 1 in later
    scans?
  - **Confidence shift:** What was "Behind" early but "Different" or "Ahead"
    later?
  - **Focus shift:** What ecosystem tags appear in later scans but not earlier?
  - **Challenge evolution:** How do "The Challenge" sections evolve?

**Output format:**

```markdown
## 4. Mental Model Evolution

### Interest Shift

[Early scans focused on X. By scan N, attention shifted to Y. This suggests...]

### Confidence Shift

[Initially rated "Behind" on Z. After seeing 3 repos approach it differently,
reclassified as "Different." What changed...]

### Emerging Focus

[Tags that appear in recent scans but not early ones: ...]
```

**No structured output** — this is inherently narrative. The synthesis.json
includes only:

```json
{
  "mental_model": {
    "interest_shifts": ["string"],
    "confidence_shifts": ["string"],
    "emerging_focus_tags": ["string"],
    "scan_count": 6,
    "date_range": "2026-04-03 to 2026-04-10"
  }
}
```

---

## 5. Fit Portfolio View

**Purpose:** All candidates ranked by objective score with refreshed fit badges.

**Refresh logic (Decision #24, updated for v4.2):**

v4.2 candidates use `novelty/effort/relevance` fields (not numeric scores).
There are 4 candidate types: pattern, knowledge, content, anti-pattern.

1. Load current `SESSION_CONTEXT.md` — extract active sprint items, current
   projects, immediate priorities
2. Load `ROADMAP.md` — extract directional goals
3. For each candidate across all repos (ALL 4 types):
   - Keep scan-time `relevance` (high/medium/low) and `novelty`
     (High/Medium/Low)
   - Compute `synthesis_fit`:
     - `relevance: high` + keyword match with active sprint → `active-sprint`
     - `relevance: high` + no sprint match → `park-for-later`
     - `relevance: medium` + any sprint/roadmap match → `evergreen`
     - `relevance: low` or no match → `not-relevant`
   - Content candidates with URLs get a `actionable` flag (can be acted on now)
   - Anti-pattern candidates get a `caution` flag (applies to current work?)
4. Flag candidates whose synthesis_fit differs from scan-time relevance

**Output format:**

```markdown
## 5. Fit Portfolio

### [ACTIVE-SPRINT] (N candidates)

| Repo   | Candidate     | Obj | Fit (refreshed) | Change               |
| ------ | ------------- | --- | --------------- | -------------------- |
| repo-A | Skill Install | 88  | 72 ↑ (was 25)   | park → active-sprint |

### [PARK] (N candidates)

...

### Fit Changes Since Scan

[Narrative: "3 candidates moved from PARK to ACTIVE-SPRINT since your sprint
priorities shifted to X..."]
```

**Structured output:**

```json
{
  "fit_portfolio": {
    "refreshed_at": "ISO8601",
    "session_context_hash": "string",
    "candidates": [
      {
        "repo": "owner/repo",
        "name": "string",
        "objective_score": 88,
        "original_fit_score": 25,
        "refreshed_fit_score": 72,
        "original_fit_class": "park-for-later",
        "refreshed_fit_class": "active-sprint",
        "changed": true
      }
    ]
  }
}
```

---

## 6. Cross-Repo Knowledge Map

**Purpose:** Domain coverage matrix — what's well-covered vs what has gaps.

**Construction:**

1. Collect all `ecosystem_tags` from analysis.json files
2. Collect all domains mentioned in Creator View Section 1 (keyword extraction)
3. Cross-reference with home repo domains (from ROADMAP.md, active skills,
   project memories)
4. Build coverage matrix: domain × repo presence
5. Identify gaps: domains in home context not covered by any analyzed repo

**Output format:**

```markdown
## 6. Knowledge Map

### Well-Covered Domains (3+ repos)

| Domain             | Repos                  | Coverage Quality |
| ------------------ | ---------------------- | ---------------- |
| agent-architecture | repo-A, repo-B, repo-C | Strong           |

### Gap Domains (0 repos)

| Domain                   | Home Context Source | Suggested Next Scan |
| ------------------------ | ------------------- | ------------------- |
| performance-optimization | ROADMAP M5          | [suggestion]        |
```

**Structured output:**

```json
{
  "knowledge_map": {
    "covered": [
      {
        "domain": "string",
        "repos": ["owner/repo"],
        "quality": "strong|moderate|weak"
      }
    ],
    "gaps": [
      {
        "domain": "string",
        "home_context_source": "string",
        "suggested_scan": "string|null"
      }
    ]
  }
}
```

---

## 7. Input Contract (cross-reference)

All input artifacts are produced by `/repo-analysis` v4.2+. Schemas defined in
repo-analysis REFERENCE.md.

**Per-repo artifacts:**

| Artifact               | Required | v4.2 Schema Notes                                                                                                                                                                                     |
| ---------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `analysis.json`        | MUST     | `skillVersion`, `repoType`, `scoring.adoptionLens/creatorLens`                                                                                                                                        |
| `value-map.json`       | MUST     | 4 candidate arrays: `patternCandidates`, `knowledgeCandidates`, `contentCandidates`, `antiPatternCandidates`. Plus `cross_repo_connections[]`. Fields: novelty/effort/relevance (not numeric scores). |
| `creator-view.md`      | MUST     | 6 sections. Section 2 references specific content items.                                                                                                                                              |
| `content-eval.jsonl`   | MUST     | Per-item evaluation: category/name/url/relevance/applicability/home_connection                                                                                                                        |
| `deep-read.md`         | SHOULD   | Internal artifact inventory and findings                                                                                                                                                              |
| `coverage-audit.jsonl` | SHOULD   | Deferred/skipped/flagged items per repo                                                                                                                                                               |
| `findings.jsonl`       | SHOULD   | Engineer View findings                                                                                                                                                                                |
| `mined-links.jsonl`    | MAY      | Curated-list repos only                                                                                                                                                                               |

**Cross-repo artifacts:**

| Artifact                   | Required | Notes                                                                                         |
| -------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `EXTRACTIONS.md`           | SHOULD   | Human-readable cross-repo summary. 4 candidate types (P/K/C/AP).                              |
| `extraction-journal.jsonl` | SHOULD   | Machine-readable per-candidate records. `type` field: pattern/knowledge/content/anti-pattern. |
| `reading-chain.jsonl`      | SHOULD   | Cross-repo relationship graph                                                                 |

**Version handling:** Check `skillVersion` in analysis.json. Repos with versions
older than 4.2 will be missing content-eval.jsonl, deep-read.md,
coverage-audit.jsonl, contentCandidates, antiPatternCandidates, and
cross_repo_connections. Warn user about reduced synthesis capability but
proceed.

---

## 8. State File Schema

**Path:** `.claude/state/repo-synthesis.state.json`

```json
{
  "skill": "repo-synthesis",
  "version": "1.0",
  "status": "in-progress|complete|failed",
  "phase": 0,
  "repos_loaded": ["owner/repo"],
  "repos_excluded": [
    { "repo": "owner/repo", "reason": "missing creator-view.md" }
  ],
  "outputs_completed": [
    "themes",
    "gaps",
    "chain",
    "evolution",
    "portfolio",
    "map"
  ],
  "focus": null,
  "refreshed_at": "ISO8601",
  "startedAt": "ISO8601",
  "completedAt": null
}
```

---

## 9. Version History

| Version | Date       | Description                                                   |
| ------- | ---------- | ------------------------------------------------------------- |
| 1.1     | 2026-04-06 | Align with repo-analysis v4.2: 3 new input artifacts,         |
|         |            | 4 candidate types, cross_repo_connections, updated fit logic. |
| 1.0     | 2026-04-05 | Initial creation. Companion to repo-analysis v4.1.            |
|         |            | 6 synthesis outputs, fit refresh, conversational.             |
|         |            | Source: 30-decision deep-plan, Decisions #13/16/23/24/26/27.  |
