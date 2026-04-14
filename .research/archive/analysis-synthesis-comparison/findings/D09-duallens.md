# Findings: Dual-Lens & Multi-Perspective Design Comparison

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-06
**Sub-Question IDs:** SQ-009

---

## Summary

All four skills share a "Creator View first" philosophy but implement
multi-perspective analysis in fundamentally different ways. `repo-analysis` has
the most explicit and formalized dual-lens system (Adoption vs Creator with full
dimension weighting tables). `website-analysis` collapses to a single-lens
output (Creator only, Engineer is secondary/informational). The synthesis skills
do not re-apply lenses — they merge upstream Creator View prose and candidates,
operating at a layer above the per-item lens. Fit separation (objective vs
personal) is consistently implemented across all four skills using the same
`objective_score` / `personal_fit_score` / `fit_class` schema fields.

---

## Key Findings

### Finding 1: repo-analysis Has the Most Explicit Dual-Lens System [CONFIDENCE: HIGH]

`repo-analysis` is the only skill that formally names two scoring lenses,
computes BOTH on every analysis, and explicitly selects a primary based on repo
type. The two lenses are:

- **Adoption Lens** (6 dimensions): Security 25%, Reliability 20%,
  Maintainability 20%, Documentation 10%, Process 15%, Velocity 10%. Verdicts:
  Adopt/Trial/Extract/Avoid (thresholds: 75+/55-74/30-54/0-29).
- **Creator Lens** (7 dimensions, adds Knowledge): Security 5%, Reliability 10%,
  Maintainability 15%, Documentation 25%, Process 5%, Velocity 5%, Knowledge
  35%. Verdicts: Study/Explore/Extract/Note (thresholds: 80+/60-79/40-59/0-39).

The Knowledge dimension (35% weight in Creator Lens) is a composite of 5
sub-dimensions (KN-01 through KN-05): Domain knowledge map, Insight density,
Learning path potential, Methodology novelty, Relevance to active work. These
are intentionally low-automation (1-2/5 auto rating), requiring AI judgment.

Primary lens is auto-selected from repo type: `library/application/monorepo` →
Adoption; `curated-list/registry/documentation-hub` → Creator. Both lenses are
always shown, primary marked `[PRIMARY]`. User can override with
`--lens=adoption|creator` flag.

Source: `.claude/skills/repo-analysis/REFERENCE.md` lines 769-840 (Section
4.1-4.5), `.claude/skills/repo-analysis/SKILL.md` lines 316-320.

### Finding 2: website-analysis Uses a Single Creator Lens with No Adoption Equivalent [CONFIDENCE: HIGH]

`website-analysis` has no "adoption lens" counterpart. There is only a single
"Creator Verdict" (Study/Explore/Extract/Note), computed as:

`Creator Verdict Score = (Content Quality * 0.50) + (Technical Health * 0.20) + (Creator Value * 0.30)`

The three summary categories replace the 6-dimension adoption/creator split:

- **Content Quality** (50%): 13 value axes composite, normalized 0-100
- **Technical Health** (20%): 6 Engineer dimensions composite
- **Creator Value** (30%): Knowledge candidates quality + personal fit + novelty

The Engineer View (Performance, Security Headers, Accessibility, SEO, Technical
Stack, Mobile Readiness) is explicitly secondary — it answers "what technical
decisions shaped what this site can offer me?" rather than assessing whether to
adopt the site as a dependency. There is no equivalent to the Adoption verdict
(Adopt/Trial/Extract/Avoid) for websites.

The Creator verdict uses the exact same Study/Explore/Extract/Note band labels
as repo-analysis's Creator lens (score thresholds are identical:
80+/60-79/40-59/0-39).

Source: `.claude/skills/website-analysis/REFERENCE.md` lines 1429-1469 (Section
6), `.claude/skills/website-analysis/SKILL.md` lines 217-225.

### Finding 3: 13 Value Axes Are website-analysis-Specific — No Equivalent in repo-analysis [CONFIDENCE: HIGH]

`website-analysis` introduces 13 value axes that score a site's knowledge
character on a 1-5 scale. These have no parallel in repo-analysis:

1. Content Depth, 2. Content Freshness, 3. Editorial Stance, 4. Information
   Architecture,
2. Link Graph Quality, 6. Visual Design Philosophy, 7. Audience Assumed
   Expertise,
3. Source Attribution, 9. Content Authenticity, 10. Monetization Pressure,
4. Community Signal, 12. Entity Authority, 13. Structural Completeness.

These axes feed "What This Site Understands" (Creator View Section 2). They form
the Content Quality (50%) component of the Creator Verdict score. The closest
equivalent in repo-analysis is the Knowledge composite (KN-01 through KN-05),
but this is a single dimension within the Creator Lens rather than a first-class
scoring framework.

The value axes are site-specific analytical concepts (editorial stance,
monetization pressure, entity authority) with no meaningful equivalent in code
repo analysis.

Source: `.claude/skills/website-analysis/REFERENCE.md` lines 676-882 (Section
2).

### Finding 4: Both Skills Use Identical Fit Separation Schema [CONFIDENCE: HIGH]

Both `repo-analysis` and `website-analysis` implement the same objective vs
personal fit separation in their `value-map.json` candidates:

- `objective_score` (0-100): Context-independent brilliance/value score
- `personal_fit_score` (0-100): Fit to active projects, sprint-dependent
- `fit_class` (derived): Same thresholds in both skills:
  - `active-sprint`: personal_fit_score >= 60
  - `park-for-later`: personal_fit_score < 60 AND objective_score >= 60
  - `evergreen`: both >= 40
  - `not-relevant`: otherwise

The field definitions in REFERENCE.md are essentially identical word-for-word.
This is a deliberate shared design decision, noted in website-analysis
REFERENCE.md line 286: "Fit badge derivation (shared with repo-analysis)."

Source: `.claude/skills/repo-analysis/REFERENCE.md` lines 434-437,
`.claude/skills/website-analysis/REFERENCE.md` lines 273-293.

### Finding 5: Creator View Is Mandatory for Standard/Deep in Both Analysis Skills [CONFIDENCE: HIGH]

Both skills enforce Creator View as mandatory for Standard and Deep depth tiers:

- repo-analysis SKILL.md rule 9: "Creator View is mandatory for Standard/Deep"
- website-analysis SKILL.md rule 5: "Creator View is mandatory for
  Standard/Deep"

Both also specify the same conversational prose requirement (anti-goal: must NOT
read like a technical manual) and both load the same home context sources:
SESSION_CONTEXT.md, ROADMAP.md, CLAUDE.md, `.claude/skills/` listing, MEMORY.md.

The Quick Scan tier in both skills produces a "lightweight creator lens teaser"
(2-3 sentences), not a full Creator View. The gate mechanism ("Run
Standard/Deep? [y/N]") is identical in both skills.

Source: `.claude/skills/repo-analysis/SKILL.md` lines 39-44, 105-109,
`.claude/skills/website-analysis/SKILL.md` lines 35-40, 170-178.

### Finding 6: Creator View Section Structures Diverge — 6 Sections (repo) vs 7 Sections (website) [CONFIDENCE: HIGH]

Despite sharing the same philosophy, the Creator View sections are structurally
different:

**repo-analysis Creator View (6 sections, SKILL.md lines 215-232):**

1. What This Repo Understands (+ Blindspots)
2. What's Relevant To Your Work (with Deep Read refs)
3. Where Your Approach Differs (Ahead/Different/Behind classification)
4. The Challenge
5. Knowledge Candidates (T1/T2/T3 tiered)
6. What's Worth Avoiding (anti-ideas with evidence)

**website-analysis Creator View (7 sections, SKILL.md lines 210-217):**

1. What's Relevant To Your Work (LEADS, not Section 2 as in repo-analysis)
2. What This Site Understands (13 value axes backbone)
3. Voice and Editorial POV (website-specific — no equivalent in repo-analysis)
4. Where Your Approach Differs
5. The Challenge
6. The Warning (OPTIONAL — genuine risks only)
7. Knowledge Candidates

Key differences: website-analysis leads with relevance (Section 1), while
repo-analysis leads with knowledge characterization (Section 1).
website-analysis adds "Voice and Editorial POV" (no repo equivalent).
repo-analysis adds "What's Worth Avoiding" (maps to the Warning but more
structured, with mandatory anti-pattern extraction). repo-analysis has no
"Warning" (optional) section — its equivalent concern is handled via Absence
Patterns.

Source: `.claude/skills/repo-analysis/SKILL.md` lines 214-236,
`.claude/skills/website-analysis/SKILL.md` lines 205-217,
`.claude/skills/website-analysis/REFERENCE.md` lines 1072-1270.

### Finding 7: Engineer View Role Differs Between Skills [CONFIDENCE: HIGH]

Despite sharing the same name and same 6-dimension count, the Engineer View
plays a structurally different role in each skill:

**repo-analysis Engineer View:** Combined with dual-lens scoring to produce the
primary output verdict. The adoption assessment (WR-01 through WR-06) is a
separate, dedicated dimension wave for whole-repo adoption decisions. The
Engineer View feeds BOTH lenses (different weights per lens). The `MUST` vs
`SHOULD` designation is not explicitly stated — it is always computed.

**website-analysis Engineer View:** Explicitly labeled "SHOULD" (SKILL.md line
219: "SHOULD for Standard/Deep"). It is secondary to the Creator View. The 6
dimensions (Performance, Security Headers, Accessibility, SEO, Technical Stack,
Mobile Readiness) are website-specific and have no overlap with repo-analysis
Engineer dimensions. The Engineer View contributes only 20% to the Creator
Verdict score.

The repo-analysis Engineer dimensions (Security, Reliability, Maintainability,
Documentation, Process, Velocity) differ entirely from website-analysis Engineer
dimensions. They share only the 4-band scoring scale (Critical/Needs
Work/Healthy/Excellent).

Source: `.claude/skills/repo-analysis/SKILL.md` lines 311-316,
`.claude/skills/website-analysis/SKILL.md` lines 218-225,
`.claude/skills/website-analysis/REFERENCE.md` lines 1272-1276.

### Finding 8: Synthesis Skills Do Not Re-Apply Lenses — They Aggregate Across Lenses [CONFIDENCE: HIGH]

Neither `repo-synthesis` nor `website-synthesis` applies a new dual-lens
framework. They consume upstream analysis artifacts and synthesize at a level
above per-item lens scoring.

**repo-synthesis approach:** Consumes `creator-view.md` (prose) and
`value-map.json` (all 4 candidate types) from each analyzed repo. The reading
chain uses `creator_verdict` (Study/Explore/Extract/Note) scores — it does NOT
reference adoption lens scores. The fit portfolio refreshes `synthesis_fit` from
session context but does not re-compute lens scores. Lenses are merged, not
split: repo-synthesis processes candidates from both lens types together.

**website-synthesis approach:** Consumes `SITE-ANALYSIS.md` (Creator View prose)
and `value-map.json`. Uses source tier weighting (T1-T4, weights 3x/2x/1x/0.5x)
rather than lens-based weighting. Source tiers correspond to content origin
quality, not the analysis lens. There is no adoption-equivalent lens in
website-synthesis.

The key structural difference: repo-synthesis has a "Fit Portfolio" output
(Section 2.5) that explicitly refreshes fit classes. website-synthesis
integrates fit into candidate ranking via source tier weighting rather than a
dedicated portfolio view.

Source: `.claude/skills/repo-synthesis/SKILL.md` lines 204-213,
`.claude/skills/website-synthesis/SKILL.md` lines 155-166,
`.claude/skills/repo-synthesis/REFERENCE.md` lines 124-165 (Reading Chain uses
creator_verdict).

### Finding 9: website-synthesis Introduces T1-T4 Source Tiers — No Equivalent in repo-synthesis [CONFIDENCE: HIGH]

`website-synthesis` REFERENCE.md Section 3 defines a formal source tier
weighting system:

- T1 Original research: 3.0x weight
- T2 Expert synthesis: 2.0x weight
- T3 Aggregation: 1.0x weight
- T4 Secondary aggregation: 0.5x weight

This tier system affects convergence scoring, divergence priority, theme
evidence strength, and candidate ranking. A T1 convergence (same claim, 3+
independent T1 sources) represents the strongest possible evidence signal.

`repo-synthesis` has no equivalent tier weighting for repos. Repos are treated
as roughly equal evidence sources. The reading chain does use `objective_score`
as an ordering signal (start with highest score), but this is not a weighting
multiplier — it is a traversal order decision.

This means website-synthesis has a more epistemically rigorous convergence
framework than repo-synthesis.

Source: `.claude/skills/website-synthesis/REFERENCE.md` lines 416-451 (Section
3), `.claude/skills/repo-synthesis/REFERENCE.md` (no equivalent section).

### Finding 10: repo-synthesis Has Unique Mental Model Evolution and Reading Chain Outputs [CONFIDENCE: HIGH]

`repo-synthesis` produces two outputs with no equivalent in `website-synthesis`:

**Reading Chain (Section 2.3):** An ordered study sequence across analyzed
repos, using relationship graph edges (inspired-by, uses, similar-to, contrast,
extends, referenced-in). Starts from the repo with the highest
`objective_score`, follows edges, branches when chains diverge. This produces a
curriculum-like output. No equivalent in website-synthesis.

**Mental Model Evolution (Section 2.4):** Tracks how the user's perspective has
shifted across scans chronologically — interest shifts, confidence shifts (what
was "Behind" is now "Different"), emerging focus tags. No equivalent in
website-synthesis.

`website-synthesis` compensates with the **Narrative paradigm** (one of 4
synthesis paradigms), which tracks evolution of an idea chronologically across
sources. But this is optional (selected by `--paradigm=narrative` flag) while
repo-synthesis always computes Mental Model Evolution.

`website-synthesis` also has a **Meta-pattern paradigm** (pattern taxonomy of
how sites frame knowledge) with no equivalent in repo-synthesis.

Source: `.claude/skills/repo-synthesis/REFERENCE.md` lines 124-215 (Sections
3-4), `.claude/skills/website-synthesis/SKILL.md` lines 95-119 (4 paradigms).

### Finding 11: Verdict Terminology Is Shared But Not Symmetric [CONFIDENCE: HIGH]

Creator lens verdict labels (Study/Explore/Extract/Note) are shared across:

- repo-analysis Creator Lens (REFERENCE.md Section 4.4)
- website-analysis Creator Verdict (REFERENCE.md Section 6.2)
- repo-synthesis Reading Chain display format (REFERENCE.md Section 3, line 143:
  "Study, 92")

Adoption lens verdict labels (Adopt/Trial/Extract/Avoid) are
repo-analysis-exclusive. The "Extract" verdict label appears in BOTH verdict
systems (adoption and creator, in both skills) at the mid-range score threshold,
but means different things:

- Adoption Extract: "Don't adopt whole — cherry-pick valuable parts"
- Creator Extract: "Cherry-pick specific insights or patterns"

There is a naming collision at the Extract level where the same word bridges two
semantically different verdicts. The distinction matters: adoption Extract
implies a component/dependency decision; creator Extract implies a
learning/inspiration decision.

Source: `.claude/skills/repo-analysis/REFERENCE.md` lines 815-831,
`.claude/skills/website-analysis/REFERENCE.md` lines 1432-1439.

### Finding 12: User Context Integration Is Structurally Identical Across All 4 Skills [CONFIDENCE: HIGH]

All four skills load the same 5 home context sources before writing Creator
View:

1. SESSION_CONTEXT.md (primary — current sprint)
2. ROADMAP.md (project direction)
3. CLAUDE.md (conventions, stack)
4. `.claude/skills/` directory listing (active skills inventory)
5. MEMORY.md user entries (project initiatives, decisions)

The synthesis skills re-load SESSION_CONTEXT.md and ROADMAP.md during the Fit
Portfolio phase to refresh fit classes against current sprint priorities, not
scan-time priorities. This is explicitly required in both synthesis REFERENCE.md
files.

The critical rule "Home context MUST be loaded for Creator View" appears
verbatim in both analysis skills' SKILL.md files.

Source: `.claude/skills/repo-analysis/SKILL.md` lines 196-206,
`.claude/skills/website-analysis/SKILL.md` lines 38-40 and REFERENCE.md lines
1106-1114, `.claude/skills/repo-synthesis/SKILL.md` lines 228-232,
`.claude/skills/website-synthesis` (fit via source tier weighting rather than
explicit reload).

---

## Lens Comparison Table

| Dimension                        | repo-analysis                                                            | website-analysis                                                                     | repo-synthesis                                | website-synthesis                                    |
| -------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------- | ---------------------------------------------------- |
| **Lens model**                   | Dual (Adoption + Creator)                                                | Single (Creator only)                                                                | No new lens — aggregates upstream             | No new lens — source tier weighting                  |
| **Primary lens**                 | Auto-selected by repo type                                               | N/A (single)                                                                         | Creator verdict reused from per-repo analysis | T1-T4 source tiers                                   |
| **Lens override**                | `--lens=adoption\|creator` flag                                          | No flag needed                                                                       | N/A                                           | N/A                                                  |
| **Both lenses always computed**  | YES — both always shown, primary marked                                  | N/A                                                                                  | N/A                                           | N/A                                                  |
| **Adoption verdict**             | Adopt/Trial/Extract/Avoid (75+/55-74/30-54/0-29)                         | NONE                                                                                 | N/A                                           | N/A                                                  |
| **Creator verdict**              | Study/Explore/Extract/Note (80+/60-79/40-59/0-39)                        | Study/Explore/Extract/Note (same thresholds)                                         | Reused from repo-analysis                     | N/A                                                  |
| **Engineer View**                | Always computed, feeds both lenses                                       | SHOULD (secondary, 20% weight)                                                       | Not re-computed                               | Not re-computed                                      |
| **Engineer dimensions**          | Security, Reliability, Maintainability, Documentation, Process, Velocity | Performance, Security Headers, Accessibility, SEO, Technical Stack, Mobile Readiness | N/A                                           | N/A                                                  |
| **Fit separation**               | objective_score / personal_fit_score / fit_class                         | Same schema (shared design)                                                          | Refreshed at synthesis time                   | Via source tier (indirect)                           |
| **Knowledge-specific dimension** | KN-01 to KN-05 (35% of Creator Lens)                                     | 13 value axes (50% of Creator Verdict as Content Quality)                            | Aggregated from per-repo Creator Views        | Aggregated from per-site Creator Views               |
| **Creator View sections**        | 6 sections                                                               | 7 sections                                                                           | N/A (consumes)                                | N/A (consumes)                                       |
| **Voice/editorial analysis**     | NONE                                                                     | Section 3 (website-specific)                                                         | N/A                                           | N/A                                                  |
| **Anti-ideas tracking**          | Section 6 ("What's Worth Avoiding") with mandatory extraction            | Warning section (optional, "genuine risks only")                                     | Anti-pattern candidate type                   | N/A                                                  |
| **Cross-item weighting**         | None (all repos equal)                                                   | N/A                                                                                  | Ordered by objective_score                    | T1-T4 weight multipliers                             |
| **Unique synthesis outputs**     | N/A                                                                      | N/A                                                                                  | Reading Chain, Mental Model Evolution         | 4 paradigms (Thematic/Narrative/Matrix/Meta-pattern) |

---

## Contradictions

**1. "Both lenses always computed" vs single-lens display in website-analysis.**
repo-analysis explicitly states "Both lenses always computed. Both shown,
primary marked" (REFERENCE.md line 835). website-analysis has only one verdict,
with Engineer View as a secondary input (20% weight), not a separate parallel
lens. This is not a bug — it is a deliberate design difference — but the
terminology "dual-lens" in the website-analysis SKILL.md frontmatter description
("Dual-lens (Creator View + Engineer View)") may suggest parity with
repo-analysis's dual-lens that doesn't actually exist. In repo-analysis, both
lenses produce independent verdicts; in website-analysis, the Engineer View
feeds a single combined verdict.

**2. Creator View section ordering diverges.** In repo-analysis, "What This Repo
Understands" leads (Section 1). In website-analysis, "What's Relevant To Your
Work" leads (Section 1). Both include both themes, but the priority signal
differs. This could cause confusion when comparing analyses across skill types,
since the "What's Relevant" section is Section 1 for websites but Section 2 for
repos.

---

## Gaps

**Gap 1: No adoption lens for websites.** website-analysis lacks any equivalent
to repo-analysis's adoption assessment (WR-01 through WR-06: stack
compatibility, integration complexity, maintenance burden, lock-in risk,
value-to-cost, ecosystem maturity). For websites, there is no structured answer
to "should I rely on this site as an ongoing reference source?" — only the
Creator Verdict covering knowledge quality.

**Gap 2: No source tier weighting in repo-synthesis.** repo-synthesis treats all
repos as equal evidence sources. website-synthesis has a formal T1-T4 weighting
system. A researcher comparing findings across many repos has no mechanism to
weight original research repos (e.g., an arXiv implementation) more heavily than
aggregator repos (e.g., an awesome-list).

**Gap 3: repo-analysis REFERENCE.md does not define value axes equivalent.**
website-analysis's 13 value axes have detailed scoring rubrics (1-5 per axis).
repo-analysis has only the 5 Knowledge dimensions (KN-01 to KN-05) as their
rough equivalent, but these are higher-level and lack the same rubric depth.
There is no equivalent axis for "Editorial Stance," "Monetization Pressure," or
"Entity Authority" in repo-analysis — nor should there be, but this means the
content characterization depth in website-analysis is richer.

**Gap 4: No "Mental Model Evolution" equivalent in website-synthesis.**
website-synthesis does not track how the user's perspective on web content has
shifted across scans. The Narrative paradigm provides a related but different
capability (tracking idea evolution in content, not analyst perspective shift).

**Gap 5: Lens transferability (investigation).** The question of whether
website-analysis could adopt repo-analysis's dual-lens was not directly
addressable from documentation alone. There is no DECISIONS.md entry in
website-analysis for this question (it was not evaluated during website-analysis
design). The design decision to use a single Creator Verdict appears to be
intentional simplification for websites (which have no adoption/dependency
concept equivalent to library adoption).

---

## Serendipity

**Cross-type synthesis is planned but not implemented.** website-synthesis
REFERENCE.md Section 5 documents "Cross-Type Synthesis Hooks" — a future
capability to synthesize across repos AND websites together. The REFERENCE.md
notes that synthesis.json from both skills shares `schema_version`,
`synthesized_at`, `paradigm_output`, and `signals` structure deliberately, for
forward compatibility. This is a purposeful design decision to enable future
`/cross-synthesis` skill. Source:
`.claude/skills/website-synthesis/REFERENCE.md` lines 597-633.

**"Extract" verdict collision is semantically loaded.** The word "Extract"
appears as the mid-range verdict in both the Adoption lens
(Adopt/Trial/**Extract**/Avoid) and the Creator lens
(Study/Explore/**Extract**/Note). In adoption context it means "don't take the
whole repo, pick parts." In creator context it means "low learning priority,
cherry-pick insights." These are compatible meanings but the same word creating
ambiguity in any cross-lens display.

**repo-synthesis Reading Chain uses Creator verdict only** — the adoption
verdict is completely absent from synthesis outputs. This means that for library
repos (primary lens = Adoption), the synthesis reading chain orders and presents
them using only their creator scores, potentially inverted from their adoption
assessment. A repo that is `Avoid` for adoption but `Study` for learning would
be prioritized in the reading chain.

---

## Sources

| #   | File Path                                       | Section                                              | Trust             | Notes                                              |
| --- | ----------------------------------------------- | ---------------------------------------------------- | ----------------- | -------------------------------------------------- |
| 1   | `.claude/skills/repo-analysis/SKILL.md`         | Full file (525 lines)                                | HIGH (filesystem) | Process overview, dual-lens declaration            |
| 2   | `.claude/skills/repo-analysis/REFERENCE.md`     | Lines 95-840 (Sections 1.3, 4.1-4.5, 13)             | HIGH (filesystem) | Dimension catalogs, lens scoring, KN dimensions    |
| 3   | `.claude/skills/website-analysis/SKILL.md`      | Full file (319 lines)                                | HIGH (filesystem) | Creator/Engineer View rules, 7-section template    |
| 4   | `.claude/skills/website-analysis/REFERENCE.md`  | Lines 80-295, 676-882, 1072-1469 (Sections 1-2, 4-6) | HIGH (filesystem) | Value axes, creator verdict formula, sections      |
| 5   | `.claude/skills/website-synthesis/SKILL.md`     | Full file (291 lines)                                | HIGH (filesystem) | 4 paradigms, source weighting                      |
| 6   | `.claude/skills/website-synthesis/REFERENCE.md` | Lines 1-453 (Sections 1-3)                           | HIGH (filesystem) | Paradigm templates, T1-T4 weighting                |
| 7   | `.claude/skills/repo-synthesis/SKILL.md`        | Full file (332 lines)                                | HIGH (filesystem) | 6 outputs, fit portfolio refresh                   |
| 8   | `.claude/skills/repo-synthesis/REFERENCE.md`    | Lines 1-430 (Sections 1-9)                           | HIGH (filesystem) | Reading chain, mental model, synthesis.json schema |

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are grounded in direct filesystem reads of canonical skill
definition files. No external sources or training-data claims were required.
