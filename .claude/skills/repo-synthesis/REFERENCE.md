<!-- prettier-ignore-start -->
**Document Version:** 1.3
**Last Updated:** 2026-04-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Repo Synthesis Reference

Output specifications, input contracts, synthesis heuristics, state schema,
guard rails, and complete synthesis.json schema for the `/repo-synthesis` skill.

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
- When multiple repos share a scan_date, order alphabetically by repo name
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

**Purpose:** All candidates ranked by relevance with refreshed fit classes.

**Refresh logic (updated for v4.2):**

v4.2 candidates use `novelty/effort/relevance` fields (not numeric scores).
There are 4 candidate types: pattern, knowledge, content, anti-pattern.

1. Load all 5 home context sources (MUST — see CONVENTIONS.md Section 9):
   - `SESSION_CONTEXT.md` — active sprint items, current projects, priorities
   - `ROADMAP.md` — directional goals
   - `CLAUDE.md` — conventions, stack, architecture constraints
   - `.claude/skills/` listing — active skills inventory
   - `MEMORY.md` user/project entries — project initiatives, decisions
2. For each candidate across all repos (ALL 4 types):
   - Keep scan-time `relevance` (high/medium/low) and `novelty`
     (High/Medium/Low)
   - Compute `synthesis_fit`:
     - `relevance: high` + keyword match with active sprint → `active-sprint`
     - `relevance: high` + no sprint match → `park-for-later`
     - `relevance: medium` + any sprint/roadmap match → `evergreen`
     - `relevance: low` or no match → `not-relevant`
   - Content candidates with URLs get an `actionable` flag
   - Anti-pattern candidates get a `caution` flag (applies to current work?)
3. Flag candidates whose synthesis_fit differs from scan-time relevance

**Output format:**

```markdown
## 5. Fit Portfolio

### [ACTIVE-SPRINT] (N candidates)

| Repo   | Candidate     | Type    | Novelty | Fit (refreshed) | Change   |
| ------ | ------------- | ------- | ------- | --------------- | -------- |
| repo-A | Skill Install | pattern | High    | active-sprint   | was park |

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
        "type": "pattern|knowledge|content|anti-pattern",
        "novelty": "High|Medium|Low",
        "relevance": "high|medium|low",
        "synthesis_fit": "active-sprint|park-for-later|evergreen|not-relevant",
        "scan_relevance": "high|medium|low",
        "changed": true,
        "actionable": false,
        "caution": false
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

## 7. Convergence Confidence Scoring

**Purpose:** Assign confidence levels to synthesized claims (themes, gaps,
patterns) based on how many independent repos confirm them.

**Confidence thresholds:**

| Level      | Agreement Count | Treatment                                      |
| ---------- | --------------- | ---------------------------------------------- |
| **HIGH**   | 3+ repos        | Present as established finding                 |
| **MEDIUM** | 2 repos         | Present with caveat: "confirmed by 2 repos"    |
| **LOW**    | 1 repo          | Flag as "single-source" — may be repo-specific |

**Independence check (MUST):** Repos that fork from each other count as 1
source, not 2. Check `related_repos[]` in value-map.json for `fork-of` or
`forked-by` relationships. If two repos share a fork relationship, consolidate
their evidence as a single source for confidence scoring purposes.

**No tier weighting:** All repos are first-party artifacts analyzed by the same
skill pipeline. Unlike web content (where source authority varies), repo
artifacts have uniform trust. Confidence is purely a function of independent
agreement count.

**Application:** Apply convergence confidence to:

- Each emergent theme (Section 1)
- Each ecosystem gap claim (Section 2)
- Each knowledge map coverage assertion (Section 6)
- Reading chain transitions are exempt (they are structural, not interpretive)

---

## 8. Complete synthesis.json Schema

Top-level structure combining all 6 output sections:

```json
{
  "schema_version": "1.3",
  "generated_at": "ISO8601",
  "repos_included": ["owner/repo"],
  "repos_excluded": [],
  "focus": null,
  "themes": [],
  "ecosystem_gaps": [],
  "reading_chain": [],
  "mental_model": {
    "interest_shifts": [],
    "confidence_shifts": [],
    "emerging_focus_tags": [],
    "scan_count": 0,
    "date_range": "string"
  },
  "fit_portfolio": {
    "refreshed_at": "ISO8601",
    "session_context_hash": "string",
    "candidates": []
  },
  "knowledge_map": {
    "covered": [],
    "gaps": []
  }
}
```

**Required keys:** `schema_version`, `generated_at`, `repos_included`. All 6
output keys MUST be present (empty arrays/objects if `--focus` excluded them).

---

## 9. Input Contract (cross-reference)

All input artifacts are produced by `/repo-analysis` v4.2+. Schemas defined in
repo-analysis REFERENCE.md.

**Per-repo artifacts:**

| Artifact               | Required | v4.2 Schema Notes                               |
| ---------------------- | -------- | ----------------------------------------------- |
| `analysis.json`        | MUST     | `skillVersion`, `repoType`, `scoring` lenses    |
| `value-map.json`       | MUST     | 4 candidate arrays + `cross_repo_connections[]` |
| `creator-view.md`      | MUST     | 6 sections. Section 2 references content items. |
| `content-eval.jsonl`   | MUST     | category/name/url/relevance/applicability       |
| `deep-read.md`         | SHOULD   | Internal artifact inventory and findings        |
| `coverage-audit.jsonl` | SHOULD   | Deferred/skipped/flagged items per repo         |
| `findings.jsonl`       | SHOULD   | Engineer View findings                          |
| `mined-links.jsonl`    | MAY      | Curated-list repos only                         |

**Cross-repo artifacts (root of `.research/analysis/`):**

| Artifact                   | Required | Notes                                   |
| -------------------------- | -------- | --------------------------------------- |
| `EXTRACTIONS.md`           | SHOULD   | 4 candidate types (P/K/C/AP)            |
| `extraction-journal.jsonl` | SHOULD   | Per-candidate records with `type` field |
| `reading-chain.jsonl`      | SHOULD   | Cross-repo relationship graph           |

**Version handling:** Check `skillVersion` in analysis.json. Repos older than
4.2 will be missing content-eval.jsonl, deep-read.md, coverage-audit.jsonl,
contentCandidates, antiPatternCandidates, and cross_repo_connections. Warn about
reduced synthesis capability but proceed.

---

## 10. Guard Rails

- **<3 repos:** Abort with clear message, suggest more scans.
- **2 repos with `--min-repos=2`:** Produces a comparison, not a synthesis. Use
  when repos are directly related (upstream/fork, competing implementations).
  Themes and Mental Model Evolution will be thin — consider
  `--focus=gaps|portfolio`.
- **Mixed schema versions:** Warn, proceed with available data, note
  limitations.
- **Stale fit scores:** Always refresh — never present scan-time fit as current.
- **Missing artifacts:** Exclude repo with warning, don't silently degrade.
- **Empty artifacts:** Warn when MUST artifacts have no meaningful content.
- **Candidate pool:** Present ALL candidates grouped by tier and type. No caps.
- **Web search unavailable:** Note gap without suggestion.
- **Contradictions between repos:** Route to Contrarian Signal, don't resolve.
- **Scope:** This skill synthesizes. It does NOT re-analyze, re-clone, or modify
  per-repo artifacts.

---

## 11. State File Schema

**Path:** `.claude/state/repo-synthesis.state.json`

```json
{
  "skill": "repo-synthesis",
  "version": "1.2",
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
  "follow_up_actions": [
    {
      "action": "explore-theme",
      "target": "agent-autonomy",
      "rationale": "user reason",
      "status": "complete|pending",
      "delegated": false
    }
  ],
  "refreshed_at": "ISO8601",
  "process_feedback": null,
  "startedAt": "ISO8601",
  "completedAt": null
}
```

---

## 12. Compaction Resilience

Each output section writes to SYNTHESIS.md incrementally. State file tracks
which sections are complete. On resume, skip completed sections. State file
updated after every phase boundary and every output section.

---

## 13. Version History

| Version | Date       | Description                                             |
| ------- | ---------- | ------------------------------------------------------- |
| 1.3     | 2026-04-06 | Convergence plan: add Section 7 (convergence scoring),  |
|         |            | schema_version key, 5 home context sources, Decision    |
|         |            | Coverage Map appendix. Renumber sections 8-13.          |
| 1.2     | 2026-04-06 | Skill audit (47 decisions): add synthesis.json schema,  |
|         |            | guard rails, 2-repo guidance, follow_up_actions in      |
|         |            | state, version bump to 1.2.                             |
| 1.1     | 2026-04-06 | Align with repo-analysis v4.2: 3 new input artifacts,   |
|         |            | 4 candidate types, cross_repo_connections, updated fit. |
| 1.0     | 2026-04-05 | Initial creation. Companion to repo-analysis v4.1.      |
|         |            | 6 synthesis outputs, fit refresh, conversational.       |
|         |            | Source: 30-decision deep-plan, Decisions #13/16/23/24.  |

---

## Appendix A: Decision Coverage Map

Maps key design decisions to their implementation location in SKILL.md and
REFERENCE.md. Source: 30-decision deep-plan + 47-decision skill audit +
20-decision convergence plan.

| #     | Decision                          | Implementation Location                                          |
| ----- | --------------------------------- | ---------------------------------------------------------------- |
| DP-13 | Warm-up phase with scope estimate | SKILL.md: Warm-Up section                                        |
| DP-16 | Fit refresh at synthesis time     | SKILL.md: Phase 2 Section 2.5; REFERENCE.md: Section 5           |
| DP-23 | Conversational prose style        | SKILL.md: Critical Rule #3; CONVENTIONS.md Section 3             |
| DP-24 | 6 synthesis outputs               | SKILL.md: Phase 2 (6 subsections); REFERENCE.md: Sections 1-6    |
| SA-V  | Verification pass (T20 tally)     | SKILL.md: Phase 2.5                                              |
| SA-SA | Self-audit phase                  | SKILL.md: Phase 3; CONVENTIONS.md Section 8                      |
| SA-RP | Retro persistence                 | SKILL.md: Retro section; REFERENCE.md: Section 11 (state schema) |
| SA-DL | Delegation protocol               | SKILL.md: Phase 4 (follow-up actions)                            |
| SA-RC | Reading chain construction        | REFERENCE.md: Section 3 (algorithm)                              |
| SA-ME | Mental model evolution            | REFERENCE.md: Section 4 (heuristics)                             |
| SA-CH | Candidate handling (4 types)      | REFERENCE.md: Section 5 (refresh logic)                          |
| SA-SS | State schema with resume          | REFERENCE.md: Section 11                                         |
| CP-7  | No silent skips                   | SKILL.md: Critical Rule #6; CONVENTIONS.md Section 7             |
| CP-10 | Convergence confidence scoring    | REFERENCE.md: Section 7                                          |
| CP-12 | 5 home context sources            | SKILL.md: Phase 2 Section 2.5; REFERENCE.md: Section 5           |
| CP-16 | schema_version key                | REFERENCE.md: Section 8 (synthesis.json schema)                  |

**Key:** DP = deep-plan decision, SA = skill-audit decision, CP = convergence
plan decision.
