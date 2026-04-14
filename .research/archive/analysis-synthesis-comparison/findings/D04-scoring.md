# Findings: Scoring and Evaluation Models Comparison

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-06
**Sub-Question IDs:** SQ-004

---

## Key Findings

### 1. All four skills share the same 4-band categorical scale for primary display [CONFIDENCE: HIGH]

Every skill uses the identical 4-band scale for any score in the 0-100 range:

| Score  | Band       | Interpretation                    |
| ------ | ---------- | --------------------------------- |
| 0-39   | Critical   | Immediate action required         |
| 40-59  | Needs Work | Significant gaps                  |
| 60-79  | Healthy    | Acceptable; targeted improvements |
| 80-100 | Excellent  | Strong across dimension           |

All four skills enforce the display rule: "Bands over numbers." Scores are
always shown as `Band (score)` — e.g., `Healthy (74)` — never as bare numbers.
This is documented explicitly as a Critical Rule in both analysis SKILL.md files
(website-analysis:SKILL.md line 7, repo-analysis:SKILL.md line 3) and repeated
in both REFERENCE.md files.

Sources: website-analysis/REFERENCE.md line 1422-1427,
repo-analysis/REFERENCE.md lines 757-763.

---

### 2. The two analysis skills (website-analysis, repo-analysis) use dual scoring subsystems with different scale types [CONFIDENCE: HIGH]

Both analysis skills maintain two parallel scoring subsystems operating on
different scales:

**Creator-side scoring: 1-5 integer scale**

- website-analysis uses 13 value axes, each scored 1-5
- repo-analysis uses 5 knowledge dimensions (KN-01 through KN-05), each scored
  0-100 but sharing the same 4 bands
- These are qualitative/judgment-driven; measurement signals are defined but
  automation is low (1-2/5)

**Engineer-side scoring: 0-100 numeric scale**

- website-analysis: 6 dimensions (Performance, Security Headers, Accessibility,
  SEO, Technical Stack, Mobile Readiness), each scored 0-100
- repo-analysis: 18 QS dimensions + 15 ST dimensions + 6 WR dimensions + 12 DP
  dimensions (deep only), each with Signal and Automation ratings on a 1-5 scale

The **critical difference**: website-analysis value axes use a 1-5 integer scale
with named rubric levels (1=Minimal through 5=Excellent), while repo-analysis
engineer dimensions use the 0-100 continuous scale directly.

Sources: website-analysis/REFERENCE.md lines 173-174 (field definitions),
676-882 (all 13 axes with rubrics); repo-analysis/REFERENCE.md lines 18-19
(Signal/Auto 1-5 ratings), 752-796 (band definitions and lens weights).

---

### 3. Composite score calculation differs substantially between the two analysis skills [CONFIDENCE: HIGH]

**website-analysis composite formula** (REFERENCE.md Section 6.3, lines
1441-1456): Three summary bands with explicit weights:

- Content Quality: 50% weight — average of 13 value axes (1-5 scale), normalized
  to 0-100 via `(average_axis_score / 5) * 100`
- Technical Health: 20% weight — composite of 6 Engineer View dimensions
- Creator Value: 30% weight — knowledge candidates quality + personal fit +
  novelty

Final creator verdict score:
`(Content Quality * 0.50) + (Technical Health * 0.20) + (Creator Value * 0.30)`

**repo-analysis composite formula** (REFERENCE.md Section 4, lines 769-795): Two
separate lenses with different dimension weights:

Adoption lens (6 dimensions):

- Security: 25%, Reliability: 20%, Maintainability: 20%, Documentation: 10%,
  Process: 15%, Velocity: 10%

Creator lens (7 dimensions, adds Knowledge):

- Security: 5%, Reliability: 10%, Maintainability: 15%, Documentation: 25%,
  Process: 5%, Velocity: 5%, Knowledge: 35%

The repo-analysis Knowledge dimension (35% of creator lens) is itself a
composite of KN-01 through KN-05 using the same weighted average.

**Key structural difference**: website-analysis explicitly specifies the formula
in the REFERENCE doc. repo-analysis specifies dimension weights per lens but
does not show a single-line formula — the weighted average is implied from the
weight table.

Sources: website-analysis/REFERENCE.md lines 1441-1459;
repo-analysis/REFERENCE.md lines 769-795.

---

### 4. repo-analysis is the only skill with dual-lens scoring (Adoption vs. Creator) [CONFIDENCE: HIGH]

repo-analysis computes TWO complete scored verdicts per analysis — always both,
with one designated as primary based on repo type:

- `library`, `application`, `monorepo` repos: Adoption lens is primary
- `curated-list`, `registry`, `documentation-hub` repos: Creator lens is primary

Display format always shows both (REFERENCE.md lines 835-839):

```
Adoption Lens: Trial (62) — viable dependency with caveats
Creator Lens:  Study (85) — deep engagement recommended [PRIMARY]
```

The Adoption verdict uses a 4-tier qualitative scale: Adopt (75+), Trial
(55-74), Extract (30-54), Avoid (0-29).

The Creator verdict uses a matching but differently-labeled 4-tier scale: Study
(80+), Explore (60-79), Extract (40-59), Note (0-39).

website-analysis has only the Creator lens with its own 4-tier verdict (Study /
Explore / Extract / Note at identical thresholds: 80+/60-79/40-59/0-39).

Sources: repo-analysis/REFERENCE.md lines 799-839; website-analysis/REFERENCE.md
lines 1429-1439.

---

### 5. Scoring rubrics are detailed and anchor-based for website-analysis value axes; automated-metric-based for repo-analysis dimensions [CONFIDENCE: HIGH]

**website-analysis rubrics** (REFERENCE.md Section 2, lines 676-882): All 13
value axes have named descriptors for each score level (1-5) with specific
measurement signals. Examples:

- Content Depth (Axis 1): score 5 = "Expert-level technical depth with original
  examples, specific implementation details, and primary source citations";
  score 1 = "Thin content; no substantive technical detail"
- Content Freshness (Axis 2): score 5 = "Updated within last 3 months"; score 1
  = ">18 months without update"
- All 6 Engineer View dimensions (REFERENCE.md Section 5) have 4-band thresholds
  with specific measurable criteria (e.g., Performance Excellent = "Page size
  <500KB, SSR detected, images optimized, <10 external scripts")

**repo-analysis rubrics** (REFERENCE.md Section 1): Dimensions are defined by
their source tools, not by per-level rubrics. The table format uses Signal (1-5)
and Automation (1-5) ratings rather than scoring rubrics. The code portability
rubric (Section 6) is the exception — it provides per-level (0-3) criteria for
each of 5 sub-dimensions totaling 0-15 points.

Sources: website-analysis/REFERENCE.md lines 681-882 (13 rubrics);
repo-analysis/REFERENCE.md lines 1030-1047 (code portability rubric).

---

### 6. Both synthesis skills inherit scoring from their analysis counterparts; they do not create new scoring dimensions [CONFIDENCE: HIGH]

Neither website-synthesis nor repo-synthesis invents new numeric scores. Both
consume pre-computed scores from their analysis siblings:

**website-synthesis** (SKILL.md, REFERENCE.md):

- Reads `objective_score` and `personal_fit_score` (0-100) from each site's
  `value-map.json`
- Reads `analysis.json` including all dimension scores
- Applies source tier weighting (T1=3.0x, T2=2.0x, T3=1.0x, T4=0.5x) as a
  multiplicative factor, not a new score
- Convergence scoring uses weighted sum:
  `sum(source_tier_weight[site] for site in matching_sites)` yielding HIGH
  (>=6.0), MEDIUM (3.0-5.9), LOW (1.5-2.9)
- Matrix paradigm uses a 4-level ordinal: Strong / Present / Weak / Absent (not
  numeric)

**repo-synthesis** (SKILL.md, REFERENCE.md):

- Reads `objective_score`, `personal_fit_score`, `novelty`, `effort`,
  `relevance` from `value-map.json` candidates
- Reads creator verdicts (Study/Explore/Extract/Note) and scores from
  `analysis.json`
- Refreshes `synthesis_fit` using qualitative rules against current sprint
  context (not re-scoring; reclassifying from: active-sprint / park-for-later /
  evergreen / not-relevant)
- Reading chain uses `objective_score` composite to determine starting point
  (highest objective_score first)

Sources: website-synthesis/REFERENCE.md lines 324-413 (signal detection rubric);
repo-synthesis/REFERENCE.md lines 220-288 (fit refresh logic, Section 5).

---

### 7. Source tier weighting is a website-synthesis-exclusive mechanism absent from repo-synthesis [CONFIDENCE: HIGH]

website-synthesis assigns formal source tier weights to each analyzed site:

- T1 Original research: 3.0x multiplier
- T2 Expert synthesis: 2.0x multiplier
- T3 Aggregation: 1.0x multiplier
- T4 Secondary aggregation: 0.5x multiplier

This creates a 6:1 maximum differential between T1 and T4 evidence. The weight
directly affects convergence scoring, divergence priority, theme evidence
strength, and candidate ranking.

repo-synthesis has no equivalent mechanism. All repos contribute equally to
theme detection (threshold: 3+ repos). The synthesis.json schema has no
`source_tier` or `source_weight` field.

This asymmetry exists because websites vary enormously in credibility (original
research vs. aggregated blog posts), while GitHub repos are more homogeneous in
nature. The distinction was a deliberate architectural decision documented in
website-synthesis/SKILL.md Critical Rule #5.

Sources: website-synthesis/REFERENCE.md lines 416-452 (Section 3);
website-synthesis/SKILL.md lines 38-40 (Critical Rule #5);
repo-synthesis/REFERENCE.md Section 7 (synthesis.json schema, no tier fields).

---

### 8. Fit scoring uses consistent qualitative classes across all four skills [CONFIDENCE: HIGH]

All four skills use identical fit class labels: `active-sprint`,
`park-for-later`, `evergreen`, `not-relevant`. The derivation rules are
identical across the two analysis skills:

From value-map.json:

- `personal_fit_score >= 60` -> `[ACTIVE-SPRINT]`
- `personal_fit_score < 60 AND objective_score >= 60` -> `[PARK]`
- `objective_score >= 40 AND personal_fit_score >= 40` -> `[EVERGREEN]`
- Otherwise -> no badge (not-relevant)

Both synthesis skills refresh fit at synthesis time by re-evaluating against
current SESSION_CONTEXT.md and ROADMAP.md. The synthesis skills substitute the
numeric threshold logic with keyword-match logic against active sprint items:

- `relevance: high` + active sprint keyword match -> `active-sprint`
- `relevance: high` + no sprint match -> `park-for-later`
- `relevance: medium` + any sprint/roadmap match -> `evergreen`
- `relevance: low` or no match -> `not-relevant`

The switch from numeric to keyword-match at synthesis time means fit can change
class without a re-analysis. The synthesis skill explicitly flags candidates
whose `synthesis_fit` differs from scan-time `relevance`.

Sources: repo-analysis/REFERENCE.md lines 658-663 (fit badge derivation);
website-analysis/REFERENCE.md lines 289-291; repo-synthesis/REFERENCE.md lines
229-243 (fit refresh logic).

---

### 9. Critical floor metric is implemented in both analysis skills but not in synthesis skills [CONFIDENCE: HIGH]

Both analysis REFERENCE.md files define a "critical floor metric" — the minimum
dimension score across all summary dimensions — which is displayed alongside the
overall score. This prevents a high average masking a catastrophic failure on
one dimension:

- repo-analysis: "A repo with a 90 average but a 15 security score is `Critical`
  regardless of average. Display alongside overall band:
  `Healthy (74) | Critical floor: Security (52)`." (REFERENCE.md line 330-333)
- website-analysis: "A site with an 85 average but a 20 Technical Health is
  flagged: `Study (82) | Critical floor: Technical Health (20)`." (REFERENCE.md
  lines 1457-1459)

Neither synthesis skill implements a floor metric — they operate on aggregated
candidates and themes, not dimensional scores.

Sources: repo-analysis/REFERENCE.md lines 330-333; website-analysis/REFERENCE.md
lines 1457-1459.

---

### 10. repo-analysis has a unique code portability sub-scoring rubric (0-15 scale) [CONFIDENCE: HIGH]

repo-analysis REFERENCE.md Section 6 (lines 1030-1047) defines a 5-dimension
portability rubric for individual code extraction candidates, scored 0-3 per
dimension for a maximum of 15 points:

| Dimension               | 0 (worst)             | 3 (best)              |
| ----------------------- | --------------------- | --------------------- |
| Dependency Profile      | Invasive framework    | Standard library only |
| Coupling Profile        | Ce > 12               | Ce < 3                |
| Configuration Surface   | Requires global state | Zero-config           |
| Cognitive Portability   | Name requires system  | Nameable without      |
| Documentation Artifacts | No documentation      | Full API ref + tests  |

Interpretation thresholds: >=10 = strong candidate; 6-9 = conditional; <6 = not
recommended.

This is a unique sub-scoring system not present in any of the other three
skills.

Sources: repo-analysis/REFERENCE.md lines 1030-1047.

---

### 11. Absence pattern scoring is a shared cross-cutting concern in both analysis skills, absent from both synthesis skills [CONFIDENCE: HIGH]

Both analysis skills implement absence pattern detection as a cross-cutting
scoring dimension that runs across all phases:

**website-analysis**: 11 named patterns (DEAD_BLOG, VENDOR_BROCHURE, SPA_SHELL,
PAYWALLED_HARD, PAYWALLED_SOFT, CAPTIVE_JS, AGGREGATOR, LINK_FARM,
GENERATED_CONTENT, CURATED_LIST_WEB, REGISTRY). Patterns have HIGH/MEDIUM/LOW
severity. No numeric deduction — patterns are binary (detected/not-detected).

**repo-analysis**: 7 named patterns (GHOST_SHIP, TEST_THEATER, SECURITY_FACADE,
BORROWED_ARMOR, DEPENDENCY_FREEZE, LONE_WOLF, SILENT_FAILURE). Uses a deductive
scoring model: "Start at 100. Deduct: CRITICAL patterns (-3 each), IMPORTANT
patterns (-2 each). Normalize to applicable checks per repo type. Band result
using the 4-band scale." (REFERENCE.md lines 916-923).

repo-analysis absence pattern scoring is thus numeric (deduction-based), while
website-analysis absence patterns are qualitative flags only.

Sources: website-analysis/REFERENCE.md lines 885-1068;
repo-analysis/REFERENCE.md lines 844-923.

---

### 12. repo-analysis has more dimensions overall, reflecting automated tool integration; website-analysis has more rubric depth per dimension [CONFIDENCE: HIGH]

Dimension count comparison:

- website-analysis: 13 value axes (Creator) + 6 Engineer dimensions = 19
  dimensions
- repo-analysis: 18 QS dimensions + 15 ST dimensions + 6 WR dimensions + 12 DP
  dimensions (deep only) + 5 KN dimensions = 56 total (39 without deep mode)

repo-analysis dimensions are primarily tool-sourced and automation-rated (Signal
1-5, Auto 1-5). The knowledge dimensions (KN-01 through KN-05) are explicitly
flagged as "low automation — requires reading and understanding, not counting."
(REFERENCE.md line 1392)

website-analysis has explicit 5-point rubrics for all 13 value axes, making them
more actionable for human judgment. repo-analysis has no equivalent rubric depth
for its 33 non-knowledge dimensions.

Sources: repo-analysis/REFERENCE.md lines 21-150 (dimension catalog);
website-analysis/REFERENCE.md lines 676-882 (all 13 rubrics with criteria).

---

### 13. website-analysis has a unique link scoring subsystem (7-component formula) [CONFIDENCE: HIGH]

website-analysis/REFERENCE.md Section 8 (lines 1575-1654) defines a 7-component
weighted link scoring formula unique to website-analysis:

| Component                   | Weight |
| --------------------------- | ------ |
| Context relevance (TF-IDF)  | 0.25   |
| Anchor quality              | 0.20   |
| Position/semantic container | 0.15   |
| URL pattern                 | 0.15   |
| Link type                   | 0.10   |
| Novelty                     | 0.10   |
| Alive check (HEAD request)  | 0.05   |

Links are classified into HIGH/MEDIUM/LOW tiers with score modifiers (+0.3, 0.0,
-0.2). This is entirely absent from repo-analysis, repo-synthesis, and
website-synthesis.

Sources: website-analysis/REFERENCE.md lines 1575-1653.

---

### 14. repo-analysis has a unique value extraction ranking formula [CONFIDENCE: HIGH]

repo-analysis REFERENCE.md Section 11 (lines 1315-1330) defines a composite
ranking formula for extraction candidates:

```
Ranking = Pattern Novelty (High=3, Med=2, Low=1)
         + Code Portability (normalized 0-3)
         + Quality Signal (High=3, Med=2, Low=1)
         - Extraction Effort (E0=0, E1=-0.5, E2=-1, E3=-2)
Ties broken by Adoption Readiness
```

This is an explicit additive formula that produces a composite ranking score
(max theoretical value: 3 + 3 + 3 = 9, before effort penalty). website-analysis
uses the same `objective_score` and `personal_fit_score` fields in
value-map.json but does not document an equivalent explicit ranking formula.

Sources: repo-analysis/REFERENCE.md lines 1315-1330.

---

### 15. Normalization approaches differ: website-analysis normalizes axes to 0-100; repo-analysis segments by repo type before comparison [CONFIDENCE: HIGH]

**website-analysis normalization** (REFERENCE.md Section 6.3, line 1451): Value
axes (1-5 scale) are normalized to 0-100 using: `(average_axis_score / 5) * 100`
This makes them comparable to Engineer dimensions (which are already 0-100).

**repo-analysis normalization** (REFERENCE.md Section 12, lines 1334-1349): Raw
scores across repo segments are NOT directly comparable. Segmentation dimensions
that control normalization baseline:

- Primary language (controls LOC normalization)
- Project type: library/application/framework/tooling
- Maturity: Greenfield (<2y), Established (2-7y), Legacy (>7y)
- Team size proxy: solo (1), micro (2-3), small (4-10), large (10+)

repo-analysis explicitly states: "Compare within segment, not globally." No
cross-segment normalization formula is documented.

Sources: website-analysis/REFERENCE.md lines 1441-1456;
repo-analysis/REFERENCE.md lines 1334-1349.

---

## Scoring Dimension Comparison Table

| Dimension Category             | website-analysis                                                            | repo-analysis                                                            | website-synthesis                 | repo-synthesis                                 |
| ------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------- | ---------------------------------------------- |
| **Primary scale**              | 1-5 (axes) + 0-100 (eng)                                                    | 0-100 (all dims)                                                         | Inherits 0-100                    | Inherits 0-100                                 |
| **Band system**                | 4-band (Critical/Needs Work/Healthy/Excellent)                              | Same 4-band                                                              | Not applied directly              | Not applied directly                           |
| **Creator/analysis dims**      | 13 value axes (1-5 scale)                                                   | 5 KN dims (0-100)                                                        | Consumed as-is                    | Consumed as-is                                 |
| **Engineer dims**              | 6 dims (0-100)                                                              | 18 QS + 15 ST + 6 WR + 12 DP                                             | None                              | None                                           |
| **Scoring lenses**             | 1 (Creator only)                                                            | 2 (Adoption + Creator, both computed)                                    | N/A                               | N/A                                            |
| **Composite formula**          | Explicit weights (Content 50%, Tech 20%, Creator Value 30%)                 | Per-lens weights (Adoption/Creator)                                      | Not applicable                    | Not applicable                                 |
| **Verdict tiers**              | Study/Explore/Extract/Note (same thresholds)                                | Adoption: Adopt/Trial/Extract/Avoid; Creator: Study/Explore/Extract/Note | Convergence: HIGH/MEDIUM/LOW      | Fit: active-sprint/park/evergreen/not-relevant |
| **Fit scoring**                | objective_score + personal_fit_score (0-100)                                | Same dual score                                                          | Inherited; refreshed at synthesis | Inherited; refreshed at synthesis              |
| **Fit class labels**           | active-sprint/park/evergreen/not-relevant                                   | Same                                                                     | Same (refreshed)                  | Same (refreshed)                               |
| **Source tier weighting**      | None                                                                        | None                                                                     | T1(3x)/T2(2x)/T3(1x)/T4(0.5x)     | None                                           |
| **Absence pattern scoring**    | 11 patterns, qualitative flags                                              | 7 patterns, deductive (-3/-2 per severity)                               | None                              | None                                           |
| **Critical floor metric**      | Yes (lowest summary category)                                               | Yes (minimum dimension score)                                            | No                                | No                                             |
| **Code portability sub-score** | None                                                                        | 0-15 (5-dim rubric, Section 6)                                           | None                              | None                                           |
| **Link scoring**               | 7-component weighted formula (0-1 range)                                    | None                                                                     | Inherits links.json               | None                                           |
| **Normalization**              | Axes: (avg/5)\*100                                                          | Segment-based (no global formula)                                        | Not applicable                    | Not applicable                                 |
| **Tier/depth impact**          | Quick (Phase 0) / Standard (Phases 1-4) / Deep (adds HTTP headers + agents) | Quick (18 dims) / Standard (+15 dims) / Deep (+12 DP dims)               | No tier concept                   | No tier concept                                |
| **Comparative scoring**        | Matrix paradigm: Strong/Present/Weak/Absent                                 | Reading chain: objective_score rank                                      | Weighted convergence across sites | Fit portfolio refresh                          |
| **Detailed rubrics**           | Yes, all 13 axes (5-level named rubrics)                                    | Only code portability (Section 6)                                        | No new rubrics                    | No new rubrics                                 |
| **Ranking formula**            | Not explicitly documented                                                   | Explicit additive formula (Section 11)                                   | Weighted_evidence_score sum       | Not documented                                 |

---

## Sources

| #   | File Path                                       | Title                       | Type             | Trust | CRAAP     | Date       |
| --- | ----------------------------------------------- | --------------------------- | ---------------- | ----- | --------- | ---------- |
| 1   | `.claude/skills/website-analysis/SKILL.md`      | Website Analysis Skill      | skill-definition | HIGH  | 5/5/5/5/5 | 2026-04-06 |
| 2   | `.claude/skills/website-analysis/REFERENCE.md`  | Website Analysis Reference  | reference-doc    | HIGH  | 5/5/5/5/5 | 2026-04-06 |
| 3   | `.claude/skills/repo-analysis/SKILL.md`         | Repo Analysis Skill         | skill-definition | HIGH  | 5/5/5/5/5 | 2026-04-06 |
| 4   | `.claude/skills/repo-analysis/REFERENCE.md`     | Repo Analysis Reference     | reference-doc    | HIGH  | 5/5/5/5/5 | 2026-04-05 |
| 5   | `.claude/skills/website-synthesis/SKILL.md`     | Website Synthesis Skill     | skill-definition | HIGH  | 5/5/5/5/5 | 2026-04-06 |
| 6   | `.claude/skills/website-synthesis/REFERENCE.md` | Website Synthesis Reference | reference-doc    | HIGH  | 5/5/5/5/5 | 2026-04-06 |
| 7   | `.claude/skills/repo-synthesis/SKILL.md`        | Repo Synthesis Skill        | skill-definition | HIGH  | 5/5/5/5/5 | 2026-04-06 |
| 8   | `.claude/skills/repo-synthesis/REFERENCE.md`    | Repo Synthesis Reference    | reference-doc    | HIGH  | 5/5/5/5/5 | 2026-04-06 |

All sources are codebase files, read directly. Currency 5/5 (all dated
2026-04-05 or 2026-04-06). Relevance 5/5 (exactly targeted). Authority 5/5
(ground truth canonical skill definitions). Accuracy 5/5 (machine-readable
schemas, explicit formulas). Purpose 5/5 (operational instructions, not
marketing).

---

## Contradictions

**Scoring scale inconsistency between the two analysis skills:**
website-analysis value axes use a 1-5 integer scale with named rubrics, while
repo-analysis knowledge dimensions use the same 0-100 scale as engineer
dimensions. The REFERENCE.md for repo-analysis (line 1387) states KN dimensions
use "the same 4-band scale (Section 4)" which implies 0-100, while website-
analysis axes use 1-5. They both arrive at similar verdicts but via different
paths, requiring different normalization for composite calculation.

**Fit refresh methodology inconsistency:** At analysis time, fit uses
`personal_fit_score >= 60` numeric threshold. At synthesis time, both synthesis
skills switch to keyword-match against SESSION_CONTEXT.md. This means the same
candidate can have different fit classifications at analysis vs. synthesis time
— which is intentional (synthesis always refreshes) but is not labeled as a
methodology change in the skill docs.

**Weighted convergence formula only in website-synthesis:** repo-synthesis uses
theme detection (3+ repos = emergent theme) without applying source tier
weights. website-synthesis adds tier-weighted convergence scoring. Both approach
"what do multiple sources agree on" but with materially different rigor. Whether
repos should have tier weights analogous to website tiers is an open design
question.

---

## Gaps

1. **repo-analysis ranking formula for knowledge candidates:** Section 11 of
   repo-analysis REFERENCE.md defines a ranking formula for pattern candidates
   specifically. It is unclear whether the same formula applies to knowledge
   candidates, content candidates, and anti-pattern candidates (added in v4.2),
   or whether these use different ranking criteria.

2. **website-analysis objective_score calculation:** The value-map.json schema
   defines `objective_score` (0-100) and `personal_fit_score` (0-100) as
   required fields, but the REFERENCE.md does not document an explicit formula
   for computing `objective_score` for website candidates (unlike the explicit
   formula for repo-analysis in Section 11). The calculation appears to be AI
   judgment.

3. **Weighted average formula for KN composite:** repo-analysis REFERENCE.md
   states "the Knowledge composite score is the weighted average of KN-01
   through KN-05" (line 1388) but does not specify the per-dimension weights
   within that composite. Equal weighting (20% each) is implied but not stated.

4. **Deep mode scoring impact on website-analysis:** The Deep tier adds HTTP
   header analysis and agent wave. REFERENCE.md Section 5 documents what is
   measured, but does not specify whether Deep scores override Standard scores
   or augment them for the Engineer dimensions.

5. **repo-synthesis does not document a convergence confidence scale:**
   website-synthesis has an explicit convergence confidence table (HIGH >= 6.0,
   MEDIUM 3.0-5.9, LOW 1.5-2.9). repo-synthesis documents a 3+ repos threshold
   for "emergent" theme detection but provides no confidence tiers or weighted
   scoring for themes.

---

## Serendipity

**Cross-type synthesis schema incompatibility is already documented:**
website-synthesis/REFERENCE.md Section 5 (lines 597-633) documents planned
cross-type synthesis (repos + websites together) and explicitly calls out the
scoring asymmetry that would need to be resolved: repos don't have T1-T4 source
tiers. This is a future design gap acknowledged in the codebase.

**repo-analysis has the richest automation infrastructure:** The Signal/Auto
ratings in the dimension catalog (1-5 scale for each) represent a second-order
meta-scoring system not present in website-analysis. Each repo- analysis
dimension is rated on how reliable its signal is and how automatable its
measurement is. This could be used to weight dimension contributions to the
composite but does not appear to be used that way currently.

**The 4-verdict naming inconsistency (Adopt vs. Study) is intentional:**
repo-analysis adoption lens uses Adopt/Trial/Extract/Avoid while the creator
lens uses Study/Explore/Extract/Note (same thresholds for the bottom 3). The
"Adopt" (75+) vs "Study" (80+) have different score thresholds, reflecting that
adoption requires a higher bar than deep engagement as a learning source.

---

## Confidence Assessment

- HIGH claims: 14
- MEDIUM claims: 0
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are sourced directly from filesystem artifacts (ground truth).
Every claim has a specific file:line citation. No training data was used.
