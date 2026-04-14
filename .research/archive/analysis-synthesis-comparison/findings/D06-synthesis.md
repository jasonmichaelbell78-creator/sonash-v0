# Findings: Synthesis Skill Design Comparison

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-06
**Sub-Question IDs:** SQ-006

---

## Key Findings

### 1. Trigger Conditions — Both skills auto-offer at the 3-instance threshold [CONFIDENCE: HIGH]

Both synthesis skills share an identical trigger model: explicit user invocation
or auto-offer from the parent analysis skill routing menu when 3+ analyzed
instances exist in the research directory.

- `website-analysis` routing menu option 7: "Cross-site synthesis — if 3+ sites
  analyzed, suggest `/website-synthesis`" (`website-analysis/SKILL.md:241`)
- `repo-analysis` routing menu option 8: "Cross-repo synthesis — If 3+ repos
  analyzed, offer /repo-synthesis." (`repo-analysis/SKILL.md:483`)
- Both synthesis skills also include a high-link-density trigger in
  `website-analysis`: ">40 external links on a page suggests cross-site"
  (`website-synthesis/SKILL.md:51`)
- Neither skill auto-invokes without user acknowledgment — the parent always
  "offers" or "suggests," not "runs."

The minimum instance default is 3 in both skills. `repo-synthesis` allows
`--min-repos=N` override (with a documented guard rail for 2-repo use being "a
comparison, not synthesis"). `website-synthesis` allows `--min-sites=N`.

Source: `website-synthesis/SKILL.md:26`, `repo-synthesis/SKILL.md:30`,
`website-analysis/SKILL.md:241`, `repo-analysis/SKILL.md:483`

---

### 2. Minimum Instance Requirements — Identical threshold, different documentation of edge cases [CONFIDENCE: HIGH]

Both skills set 3 as the hard minimum. The nuance differs:

- `repo-synthesis` has an explicit 2-repo guidance in `REFERENCE.md Section 9`:
  when `--min-repos=2` is used, the skill notes this "produces a comparison, not
  a synthesis" and recommends `--focus=gaps|portfolio` to get maximum value from
  thin data. This is documented explicitly.
- `website-synthesis` has no equivalent 2-site guidance. The rule is simply:
  abort if fewer than 3 sites survive artifact validation.
- `repo-synthesis` also documents an empty artifact warning: if a MUST artifact
  has no candidates or <10 lines, warn that "synthesis value will be limited"
  rather than silently including it (`repo-synthesis/SKILL.md:112-114`).
- `website-synthesis` has no equivalent empty-artifact warning — it either
  includes or excludes based solely on MUST artifact presence.

Source: `repo-synthesis/SKILL.md:100-117`,
`repo-synthesis/REFERENCE.md:420-427`, `website-synthesis/SKILL.md:139-147`

---

### 3. Cross-Instance Aggregation Methodology — Structurally similar but semantically different [CONFIDENCE: HIGH]

Both skills follow the same aggregation architecture: read all per-instance
artifacts, build internal structures (candidate pool, prose corpus, relationship
graph), then produce synthesis outputs. The internal representation differs:

**Website synthesis aggregation (Phase 1):**

- Candidate pool tagged by source site + source tier weight
- Prose corpus (all `SITE-ANALYSIS.md` files)
- Link pool (all `links.json` entries)
- Metadata index (all `meta.json` files)

**Repo synthesis aggregation (Phase 1):**

- Candidate pool from all 4 candidate types across all repos
- Content items (all `content-eval.jsonl` entries)
- Tag cloud (aggregate repo types and topics)
- Relationship graph (from `reading-chain.jsonl` + `related_repos[]` +
  `cross_repo_connections[]`)
- Prose corpus (all `creator-view.md` files)
- Deep read corpus (all `deep-read.md` files where available)
- Link pool (all `mined-links.jsonl` — curated-list repos only)
- Coverage gaps (all `coverage-audit.jsonl` files)

The critical structural difference: repo synthesis aggregates 7-8 distinct data
streams vs website synthesis's 4. This reflects the richer per-instance artifact
set produced by `repo-analysis` v4.2. Repo synthesis also builds an explicit
relationship graph from cross-repo connections, while website synthesis treats
sites as independent unless links.json reveals relationships.

Source: `website-synthesis/SKILL.md:149-166`, `repo-synthesis/SKILL.md:138-160`

---

### 4. Synthesis-Specific Phases Unique to Each Skill [CONFIDENCE: HIGH]

**Phases unique to `repo-synthesis` (no website-synthesis equivalent):**

| Phase              | Name              | Description                                                                                                                                                                                                                |
| ------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Warm-Up            | Orient            | Presents repo count, candidate count, effort estimate BEFORE loading. User sees: "Analyzing N repos. Producing 6 outputs. Candidates: ~N. Est. 8-15 min."                                                                  |
| Phase 1 Checkpoint | User Confirmation | After loading all artifacts, presents summary and waits for "Proceed?" confirmation before synthesis begins.                                                                                                               |
| Phase 2.5          | Verification Pass | Lightweight convergence loop: each emergent theme confirmed against 3+ repo Creator Views, each gap confirmed as absent from all repos, each reading chain transition verified against value-map.json. Presents T20 tally. |
| Phase 3            | Self-Audit        | Completeness check (all 6 sections present), orphan detection, build integrity (grep for TODO/FIXME), gap analysis, JSON schema contract verification, regression detection against prior SYNTHESIS.md.                    |
| Retro              | Process Feedback  | Explicit retro prompt saved to state file `process_feedback`.                                                                                                                                                              |

**Phases unique to `website-synthesis` (no repo-synthesis equivalent):**

| Phase                      | Name                   | Description                                                                                                                                                               |
| -------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 2 Paradigm Selection | Multi-paradigm routing | Thematic/Narrative/Matrix/Meta-pattern. Only one paradigm runs per invocation unless `--focus` selects all.                                                               |
| Phase 3                    | Signal Detection       | Explicit convergence scoring (weighted sum formula), divergence classification, gap detection, trend detection — all run regardless of paradigm as a cross-cutting layer. |

**Shared phases (structural parallels):**

- VALIDATE, PHASE 1 (Load), PHASE 2 (Synthesize), final PRESENT phase — both
  skills.
- Both have state-file-on-every-phase.

Source: `repo-synthesis/SKILL.md:82-94`, `website-synthesis/SKILL.md:123-132`

---

### 5. Theme Extraction Methodology — Website synthesis is more rigorous and formalized [CONFIDENCE: HIGH]

The two skills use the same definition ("emergent when 3+ instances
independently exhibit it") but diverge significantly in method:

**Website-synthesis theme extraction (REFERENCE.md Section 1.1):**

- Generates 8-12 explicit thematic questions from the combined prose corpus
- Scores each site against each question on a 0-3 scale
  (absent/mentioned/discussed/primary focus)
- Themes emerge from the scoring matrix
- Has a formal thematic saturation stopping rule: 3 consecutive sites (ordered
  by analysis date) yield no new themes above the "mentioned" threshold
- Produces `saturation` JSON object with `at_site_count`, `total_sites`,
  `consecutive_no_new` fields
- Source tier weight explicitly multiplied into theme evidence strength

**Repo-synthesis theme extraction (REFERENCE.md Section 1):**

- Reads "all Creator View prose AND content-eval.jsonl entries"
- Identifies "recurring themes (3+ repos), dominant patterns (>50%), contrarian
  signals, surprising connections, content-level themes, anti-pattern themes"
- No structured question fan-out methodology documented
- No saturation stopping rule
- No scoring matrix — purely prose-driven identification
- Source: `repo-synthesis/SKILL.md:178-184`

The website-synthesis query fan-out + 0-3 scoring matrix is a meaningfully more
structured approach. Repo synthesis relies on the skill's qualitative reading of
prose corpora.

Source: `website-synthesis/REFERENCE.md:25-91`,
`repo-synthesis/REFERENCE.md:17-66`

---

### 6. Convergence Scoring — Website synthesis has a formal weighted scoring formula; repo synthesis has none [CONFIDENCE: HIGH]

This is the sharpest design divergence between the two skills.

**Website-synthesis convergence scoring (REFERENCE.md Section 2.1):**

```
convergence_score = sum(source_tier_weight[site] for site in matching_sites)

Example:
  T1 + T2 + T3 = 3.0 + 2.0 + 1.0 = 6.0  (strong)
  T3 + T3 + T4 = 1.0 + 1.0 + 0.5 = 2.5  (moderate)
  T4 + T4 + T4 = 0.5 + 0.5 + 0.5 = 1.5  (weak)
```

Confidence classification thresholds: | Weighted Score | Confidence | Label |
|---|---|---| | >= 6.0 | HIGH | Strong convergence | | 3.0 - 5.9 | MEDIUM |
Moderate convergence | | 1.5 - 2.9 | LOW | Weak convergence | | < 1.5 | — | Not
convergence |

Independence verification is also formalized: sites that cite each other count
as 1 source, not 2.

**Repo-synthesis convergence:** No equivalent scoring formula or confidence
thresholds. Themes are emergent when "3+ repos independently exhibit" the
pattern — but no weighting formula, no independence check, no convergence score
is specified. The "convergence" concept is embedded in the general Phase 2.5
verification pass, not given its own scoring rubric.

Source: `website-synthesis/REFERENCE.md:329-379`,
`repo-synthesis/SKILL.md:229-239`

---

### 7. Signal Weighting — Website synthesis has a 4-tier source weighting system; repo synthesis treats all repos equally [CONFIDENCE: HIGH]

**Website synthesis source tiers:** | Tier | Label | Weight | Criteria |
|------|-------|--------|----------| | T1 | Original research | 3.0x | Primary
data, experiments, datasets, original methodology | | T2 | Expert synthesis |
2.0x | Domain expert analysis, peer-reviewed | | T3 | Aggregation | 1.0x |
Curated collections, awesome lists | | T4 | Secondary aggregation | 0.5x | Blog
posts summarizing other posts, AI-generated summaries |

This 6:1 ratio (T1 vs T4) is explicitly enforced across convergence scoring,
divergence priority, theme evidence strength, and candidate ranking.

**Repo synthesis source weighting:** No equivalent tier system exists. Repos are
not weighted by source quality. The fit portfolio uses
`novelty/effort/relevance` fields from individual candidates (inherited from
per-repo analysis), but no repo-level weight multiplier is applied during
synthesis. All repos contribute equally to emergent themes regardless of whether
one repo is primary research vs. a blog-style explainer.

This is a significant architectural gap in repo-synthesis relative to
website-synthesis.

Source: `website-synthesis/REFERENCE.md:419-453`, `repo-synthesis/REFERENCE.md`
(no equivalent section)

---

### 8. Contradiction Handling — Both skills surface contradictions; repo-synthesis is more explicit [CONFIDENCE: HIGH]

**Website synthesis divergence handling (REFERENCE.md Section 2.2):**

- Detected after convergence: same topic, opposite conclusion, both supported by
  evidence
- Surfaces to user with both positions and source tiers
- Scoring: T1 vs T1 = genuine field disagreement; T1 vs T4 = likely T4 is wrong
- Output: flag with both positions, source tiers, and recommended resolution
  hint
- "Do not resolve — present the tension" is implied but not stated as a MUST

**Repo synthesis contradiction handling (SKILL.md:182-184):**

- Explicitly stated as a MUST with its own bullet: "Contradiction handling
  (MUST): When repos contradict each other, present both as a Contrarian Signal
  with evidence. Do not resolve — let the user decide."
- Routes contradictions to the "Contrarian Signal" section of Emergent Themes
- The guard rail in REFERENCE.md Section 9 also states: "Contradictions between
  repos: Route to Contrarian Signal, don't resolve."
- No source-tier weighting in the contradiction evaluation (since repos lack
  tiers)

Both skills prohibit autonomous resolution. Repo synthesis makes this a harder
MUST with its own named output type (Contrarian Signal). Website synthesis has
the same intent but expresses it more softly.

Source: `repo-synthesis/SKILL.md:182-184`, `repo-synthesis/REFERENCE.md:435`,
`website-synthesis/REFERENCE.md:369-380`

---

### 9. Output Format Differences [CONFIDENCE: HIGH]

The two skills produce structurally different output sets:

**Website synthesis outputs:** | Output | Format | Required |
|--------|--------|----------| | `synthesis.md` | Paradigm-specific sections +
Signal Map + Knowledge Portfolio | Always | | `synthesis.json` | Full structured
schema (paradigm_output + signals + knowledge_portfolio) | Always |

Path: `.research/website-analysis/synthesis/`

**Repo synthesis outputs:** | Output | Format | Required |
|--------|--------|----------| | `SYNTHESIS.md` | 6 fixed sections (Emergent
Themes, Ecosystem Gaps, Reading Chain, Mental Model Evolution, Fit Portfolio,
Cross-Repo Knowledge Map) | Always | | `synthesis.json` | 6 output keys matching
section structure | Always |

Path: `.research/repo-analysis/SYNTHESIS.md` (root of repo-analysis dir, not a
subdirectory)

Key format differences:

1. Website synthesis output lives in a `synthesis/` subdirectory; repo synthesis
   output goes to the root of `.research/repo-analysis/`.
2. Repo synthesis has 6 fixed sections; website synthesis has paradigm-driven
   sections (1-4 paradigms) plus always-on signal detection.
3. Repo synthesis `synthesis.json` schema requires all 6 keys even when
   `--focus` excludes them (empty arrays). Website synthesis only requires keys
   for selected paradigm + signals.
4. Mental Model Evolution in repo synthesis has no structured JSON equivalent —
   only narrative text plus a thin `mental_model` object. Website synthesis has
   no equivalent section at all.
5. Website synthesis includes an explicit Knowledge Portfolio section
   (cross-site reinforced top candidates ranked by convergence boost). Repo
   synthesis integrates this into the Fit Portfolio View (which also refreshes
   fit classes against current SESSION_CONTEXT.md/ROADMAP.md).

Source: `website-synthesis/SKILL.md:76-78`, `repo-synthesis/SKILL.md:76-78`,
`website-synthesis/REFERENCE.md:456-593`, `repo-synthesis/REFERENCE.md:347-379`

---

### 10. Mixed-Quality Input Handling [CONFIDENCE: HIGH]

**Website synthesis:**

- Missing MUST artifacts: exclude site with warning, abort if fewer than 3
  remain
- Sites with partial SHOULD artifacts: include with "reduced synthesis
  capability noted"
- No empty-artifact warning
- No mixed schema version handling (all sites analyzed by same v1.0 skill)

**Repo synthesis:**

- Missing MUST artifacts: exclude repo with warning, abort if fewer than 3
  remain
- Empty artifacts (MUST artifact with no candidates or <10 lines): warn "Repo X
  has empty [artifact] — synthesis value will be limited" but proceed
- Mixed schema versions: warn about limited synthesis capability but proceed
- Specific documentation of what's missing in pre-v4.2 repos (no
  content-eval.jsonl, deep-read.md, coverage-audit.jsonl, contentCandidates,
  antiPatternCandidates, cross_repo_connections)
- `skillVersion` field checked to detect schema version

Repo synthesis is demonstrably more robust in handling degraded inputs,
reflecting its more mature versioning history (v1.2 vs v1.0 for website
synthesis).

Source: `repo-synthesis/SKILL.md:100-117`,
`repo-synthesis/REFERENCE.md:410-416`, `website-synthesis/SKILL.md:139-147`

---

### 11. Synthesis Patterns Unique to Each Skill [CONFIDENCE: HIGH]

**Unique to website synthesis:**

- **4 synthesis paradigms** (Thematic/Narrative/Matrix/Meta-pattern) — repo
  synthesis has only the thematic approach with no paradigm switching
- **Narrative paradigm** — traces claim evolution over time with inflection
  points and terminology drift mapping (no repo equivalent)
- **Matrix paradigm** — structured sites × dimensions comparison table with
  outlier detection (no repo equivalent)
- **Meta-pattern paradigm** — classifies how sites frame knowledge, not just
  what they claim (no repo equivalent)
- **Formal convergence scoring** with weighted sum formula and independence
  verification
- **T1-T4 source tier weighting** system applied throughout synthesis
- **8-12 thematic question fan-out** with 0-3 per-site scoring
- **Thematic saturation stopping rule** (3 consecutive no-new-themes)
- **High-link-density trigger** (>40 external links suggests cross-site)
- **Cross-type synthesis hooks** (planned, documented in REFERENCE.md Section 5)
  for future repos+websites unified synthesis
- **`convergence_boost`** flag on top candidates in knowledge_portfolio

**Unique to repo synthesis:**

- **Mental Model Evolution** — tracks user interest/confidence/focus shifts
  chronologically across scan dates (no website equivalent)
- **Reading Chain** — ordered study sequence with transition type labels
  (inspired-by, uses, contrast, etc.) built from relationship graph
- **Ecosystem Gap Analysis** — groups repos by ecosystem_tag, identifies feature
  gaps relative to home context
- **Fit Portfolio refresh** — re-classifies all candidates against CURRENT
  SESSION_CONTEXT.md and ROADMAP.md (not scan-time fit). Flags any candidate
  whose fit class changed since scan.
- **`active-sprint` / `park-for-later` / `evergreen` / `not-relevant`** fit
  taxonomy applied at synthesis time
- **Warm-up phase** with effort estimate before loading
- **Phase 2.5 Verification Pass** (T20 tally: confirmed/corrected/extended/new)
- **Phase 3 Self-Audit** (schema contract verification, orphan detection,
  regression detection vs prior SYNTHESIS.md)
- **Previous synthesis comparison** ("Changes Since Last Synthesis" section)
- **User confirmation checkpoint** after Phase 1 load
- **Pause capability** (user says "pause" → save state, print progress, exit)
- **Delegation protocol** (user says "you decide" → skill selects highest-impact
  action, records as delegated-action, asks rationale)
- **`process_feedback`** field in state file from retro
- **Candidate cap** (>100 candidates → present top 50 inline, full list in
  synthesis.json)
- **Anti-pattern candidates** as a synthesis-time dimension (inherited from
  repo-analysis v4.2)

Source: `website-synthesis/SKILL.md`, `website-synthesis/REFERENCE.md`,
`repo-synthesis/SKILL.md`, `repo-synthesis/REFERENCE.md`

---

## Synthesis Design Comparison Table

| Dimension                     | website-synthesis                                   | repo-synthesis                                      |
| ----------------------------- | --------------------------------------------------- | --------------------------------------------------- |
| Version                       | 1.0                                                 | 1.2                                                 |
| Minimum instances             | 3 (--min-sites override)                            | 3 (--min-repos override)                            |
| Auto-offer trigger            | Parent routing menu option 7                        | Parent routing menu option 8                        |
| Additional auto-offer trigger | >40 external links                                  | None                                                |
| 2-instance guidance           | None (abort only)                                   | Documented: "comparison, not synthesis"             |
| Empty artifact handling       | None documented                                     | Warn but proceed                                    |
| Mixed schema versions         | N/A (single v1.0)                                   | Warn, proceed with limitations                      |
| Synthesis paradigms           | 4 (thematic/narrative/matrix/meta-pattern)          | 1 (thematic only)                                   |
| Theme detection method        | 8-12 question fan-out + 0-3 scoring matrix          | Qualitative prose reading                           |
| Thematic saturation rule      | Yes (3 consecutive no-new)                          | No                                                  |
| Convergence scoring           | Weighted sum formula (T1=3x, T2=2x, T3=1x, T4=0.5x) | None                                                |
| Convergence thresholds        | HIGH ≥6.0, MEDIUM 3.0-5.9, LOW 1.5-2.9              | None                                                |
| Independence verification     | Yes (citing sites count as 1)                       | No                                                  |
| Source tier weighting         | Yes (T1-T4, 6:1 ratio)                              | No (all repos equal)                                |
| Signal detection              | Phase 3 (convergence/divergence/gap/trend)          | Embedded in Phase 2 themes                          |
| Contradiction handling        | Surface both positions + resolution hint            | MUST: Contrarian Signal section                     |
| Verification pass             | None                                                | Phase 2.5 (T20 tally)                               |
| Self-audit phase              | Artifact verification only                          | Phase 3 (6 dimensions)                              |
| Mental model evolution        | None                                                | Yes (chronological scan tracking)                   |
| Reading chain                 | None                                                | Yes (relationship graph + transition labels)        |
| Ecosystem gap analysis        | None                                                | Yes (grouped by ecosystem_tag)                      |
| Fit portfolio refresh         | None                                                | Yes (refreshed against current context)             |
| Fit taxonomy                  | None                                                | active-sprint/park-for-later/evergreen/not-relevant |
| Previous synthesis comparison | No                                                  | Yes (if prior SYNTHESIS.md exists)                  |
| Warm-up phase                 | No                                                  | Yes (effort estimate + repo list)                   |
| User confirmation checkpoint  | No                                                  | Yes (after Phase 1 load)                            |
| Pause capability              | No                                                  | Yes                                                 |
| Delegation protocol           | No                                                  | Yes                                                 |
| Candidate cap                 | No                                                  | Yes (>100 → top 50 inline)                          |
| Anti-pattern candidates       | No                                                  | Yes (inherited from v4.2)                           |
| Output path                   | `.research/website-analysis/synthesis/`             | `.research/repo-analysis/SYNTHESIS.md`              |
| Output files                  | synthesis.md + synthesis.json                       | SYNTHESIS.md + synthesis.json                       |
| State file                    | `website-synthesis.state.json`                      | `repo-synthesis.state.json`                         |
| Cross-type synthesis          | Planned (documented hooks)                          | Referenced as future only                           |
| Retro saved to state          | No                                                  | Yes (`process_feedback` field)                      |
| Invocation tracking           | Yes                                                 | Not mentioned                                       |

---

## Sources

| #   | File Path                                       | Type             | Trust               |
| --- | ----------------------------------------------- | ---------------- | ------------------- |
| 1   | `.claude/skills/website-synthesis/SKILL.md`     | SKILL definition | HIGH (ground truth) |
| 2   | `.claude/skills/website-synthesis/REFERENCE.md` | REFERENCE        | HIGH (ground truth) |
| 3   | `.claude/skills/repo-synthesis/SKILL.md`        | SKILL definition | HIGH (ground truth) |
| 4   | `.claude/skills/repo-synthesis/REFERENCE.md`    | REFERENCE        | HIGH (ground truth) |
| 5   | `.claude/skills/website-analysis/SKILL.md`      | Parent skill     | HIGH (ground truth) |
| 6   | `.claude/skills/repo-analysis/SKILL.md`         | Parent skill     | HIGH (ground truth) |

All sources are filesystem ground truth (codebase profile). No external sources
consulted.

---

## Contradictions

**Contradiction 1: Invocation tracking** `website-synthesis/SKILL.md:253-256`
includes an explicit "Invocation Tracking (MUST)" section with a
`write-invocation.ts` call. `repo-synthesis/SKILL.md` has no equivalent
invocation tracking section. This is inconsistent — both should track
invocations, but only website-synthesis mandates it.

**Contradiction 2: Signal detection framing** Website synthesis names Phase 3
"Signal Detection" and makes it an independent post-synthesis phase. Repo
synthesis embeds signal-equivalent logic (convergence, divergence, contrarian
signals) inside Phase 2 synthesis outputs rather than as a separate phase. The
SKILL.md phase overview for repo-synthesis (`SKILL.md:83-92`) has no Signal
Detection equivalent phase.

**Contradiction 3: Retro handling** Both skills have a "Retro" section.
Website-synthesis retro asks "Any observations..." but has no state file field
for the response. Repo-synthesis explicitly saves feedback to `process_feedback`
in the state file. The website-synthesis state schema (`REFERENCE.md:640-657`)
has no `process_feedback` field.

---

## Gaps

1. **Repo synthesis convergence scoring is undefined.** The skill identifies
   themes by "3+ repos independently exhibit it" but provides no scoring
   formula, no independence verification, and no confidence classification
   thresholds. This is a meaningful design gap relative to website-synthesis.

2. **Repo synthesis has no source quality differentiation.** All repos
   contribute equally to emergent themes regardless of whether the repo is
   primary research vs. derivative summary. Website-synthesis solves this with
   the T1-T4 tier system. Repo-synthesis relies entirely on per-candidate
   `novelty/relevance/effort` fields inherited from individual analyses.

3. **Website synthesis has no fit refresh.** The Knowledge Portfolio in
   website-synthesis ranks candidates by convergence boost and source tier, but
   does not re-evaluate fit against current SESSION_CONTEXT.md and ROADMAP.md.
   Repo-synthesis explicitly loads both and refreshes fit classes at synthesis
   time. If a project's sprint priorities change between analysis and synthesis,
   website-synthesis candidates may be stale.

4. **Website synthesis has no Mental Model Evolution equivalent.** There is no
   mechanism to track how the user's perspective has shifted across website
   analyses over time. This seems like a planned gap (the two skills were built
   simultaneously on 2026-04-06) rather than an oversight.

5. **Cross-type synthesis is documented but not implemented.**
   `website-synthesis/REFERENCE.md Section 5` explicitly documents cross-type
   synthesis hooks (repos + websites together) with status "PLANNED. Do not
   implement." No timeline or triggering condition is specified.

6. **Warm-up and user checkpoint asymmetry.** Repo synthesis has a Warm-Up phase
   (effort estimate) and a Phase 1 Checkpoint (user confirmation before
   synthesis begins). Website synthesis has neither — it proceeds directly from
   validation to loading to synthesis without a user checkpoint. This may be an
   intentional design choice for a faster skill, but it's not documented as
   such.

7. **Anti-pattern synthesis in website-synthesis.** Repo-synthesis inherits
   anti-pattern candidates from `repo-analysis` v4.2 and flags them during fit
   portfolio synthesis. Website-synthesis has no anti-pattern dimension —
   "What's Worth Avoiding" from website analysis isn't surfaced at the synthesis
   level.

---

## Serendipity

**Forward-compatibility architecture.**
`website-synthesis/REFERENCE.md Section 5` documents the schema differences
between the two synthesis skills' output JSONs that would need to be bridged for
cross-type synthesis: `synthesis.json` from both skills shares `schema_version`,
`synthesized_at`, `paradigm_output`, and `signals` structure. Differs in source
metadata (repo has `owner/repo`, website has `url`/`slug`) and source weighting
(repos lack T1-T4 tiers). A future cross-type schema would need a `source_type`
discriminator. This is the only place in the entire skill system where the two
synthesis skills' output schemas are directly compared — a useful reference for
any future cross-type synthesis work.

**Repo synthesis is architecturally more mature.** Despite being listed as v1.2
vs website-synthesis v1.0, repo-synthesis was the pioneer (created 2026-04-05,
one day before website-synthesis). The 47-decision skill audit that produced
v1.2 is documented in the version history. Website-synthesis was designed after
repo-synthesis and explicitly described as a "companion" and "sibling" — yet
paradoxically has more rigorous formalism in convergence scoring and theme
extraction methodology. The two skills appear to have been designed by different
priorities: website-synthesis prioritized analytical rigor, repo-synthesis
prioritized operational robustness (verification pass, self-audit, pause/resume,
delegation).

---

## Confidence Assessment

- HIGH claims: 11
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are based directly on filesystem ground truth (SKILL.md and
REFERENCE.md files read in full). No external sources, training data, or
inferences were required.
