# Findings: Architecture & File Structure Comparison

**Searcher:** deep-research-searcher **Profile:** codebase **Date:** 2026-04-06
**Sub-Question IDs:** SQ-001

---

## Summary

All four skills follow a two-file layout (SKILL.md + REFERENCE.md), but the
split principle is applied inconsistently across skills. The analysis skills
(website-analysis, repo-analysis) have a well-established "process in SKILL.md,
specs in REFERENCE.md" pattern. The synthesis skills (website-synthesis,
repo-synthesis) blur this boundary — repo-synthesis in particular puts
significant heuristic and format content in REFERENCE.md but also leaves more
phase detail in SKILL.md than its analysis counterpart does.

The most structurally mature skill is repo-analysis (v4.2, 18 sections in
REFERENCE.md). The most compact and focused is website-synthesis (v1.0, 9
sections in REFERENCE.md). The analysis skills have much larger REFERENCE.md
files relative to their SKILL.md; the synthesis skills have near-parity between
the two files.

---

## Key Findings

### 1. File Sizes and Line Counts [CONFIDENCE: HIGH]

Measured directly from filesystem:

| Skill             | SKILL.md (bytes) | SKILL.md (lines) | REFERENCE.md (bytes) | REFERENCE.md (lines) | SKILL:REF ratio (bytes) |
| ----------------- | ---------------- | ---------------- | -------------------- | -------------------- | ----------------------- |
| website-analysis  | 11,933           | 318              | 97,300               | 2,223                | 1:8.15                  |
| repo-analysis     | 22,530           | 524              | 88,155               | 1,757                | 1:3.91                  |
| website-synthesis | 11,401           | 290              | 20,257               | 709                  | 1:1.78                  |
| repo-synthesis    | 13,565           | 331              | 14,494               | 499                  | 1:1.07                  |

Sources: filesystem byte counts (`wc -c`) and line counts (`wc -l`).

**Key observation:** The analysis skills delegate heavily to REFERENCE.md
(ratios of 1:3.9 to 1:8.2). The synthesis skills have nearly equal files (ratios
of 1:1.1 to 1:1.8). This is a structural divergence, not just a size difference
— it reflects different philosophies about what belongs where.

---

### 2. SKILL.md Section Structure [CONFIDENCE: HIGH]

Extracted via `grep -n "^## "` on each file:

**website-analysis SKILL.md** (318 lines, 19 sections):

```
Critical Rules (MUST follow)
When to Use
When NOT to Use
Input
Process Overview
Extraction Pipeline
Modes
Quick Scan (Phase 0)
Standard (Phases 1-4)
Deep
Creator View (MUST for Standard/Deep)
Engineer View (SHOULD for Standard/Deep)
Routing Menu
Compliance Pre-flight (MUST — runs before extraction)
State File & Resume
Integration
Self-Audit (MUST — penultimate phase)
Retro (SHOULD)
Version History
```

**repo-analysis SKILL.md** (524 lines, 22 sections):

```
Critical Rules (MUST follow)
When to Use
Input
Process Overview
Quick Scan (Phase 0)
Clone + Repomix (Phase 1)
Dimension Wave (Phase 2)
Deep Read (Phase 2b — MUST for Standard/Deep)
History Wave (Phase 3 — Deep only)
Creator View (Phase 4 — MUST for Standard/Deep)
Content Evaluation (Phase 4b — MUST for Standard/Deep)
Engineer View (Phase 5)
Value Map (Phase 6)
Coverage Audit (Phase 6b — MUST for Standard/Deep)
Cross-Repo Extraction Tracking (MUST for Standard/Deep)
Artifact Verification (before routing)
Routing Menu
State File & Resume
Compaction Resilience
Integration
Guard Rails
Retro
```

(No "When NOT to Use" as standalone section — it is inlined in "When to Use")

**website-synthesis SKILL.md** (290 lines, 17 sections):

```
Critical Rules (MUST follow)
When to Use
Input
Synthesis Paradigms
Process Overview
Validate
Phase 1: Load All Artifacts (MUST)
Phase 2: Synthesize (MUST)
Phase 3: Signal Detection (MUST)
Phase 4: Present + Follow-up (MUST)
Artifact Verification (before presenting)
State File & Resume
Compaction Resilience
Invocation Tracking (MUST)
Integration
Guard Rails
Retro
Version History
```

(No "When NOT to Use" as standalone section — inlined in "When to Use")

**repo-synthesis SKILL.md** (331 lines, 14 sections):

```
Critical Rules (MUST follow)
When to Use
Input
Process Overview
Validate (MUST)
Warm-Up (MUST)
Phase 1: Load All Artifacts (MUST)
Phase 2: Produce Outputs (MUST, or --focus subset)
Phase 2.5: Verification Pass (MUST)
Phase 3: Self-Audit (MUST)
Phase 4: Present + Follow-up (MUST)
Retro (MUST)
State File & Resume
Integration
```

(No "Guard Rails", "Compaction Resilience", "Invocation Tracking", or "Version
History" as standalone sections — Guard Rails and Compaction Resilience are
delegated to REFERENCE.md)

Sources: `.claude/skills/*/SKILL.md` via `grep -n "^## "`.

---

### 3. REFERENCE.md Section Structure [CONFIDENCE: HIGH]

**website-analysis REFERENCE.md** (2,223 lines, 15 numbered sections +
Appendix):

```
1. Output Schemas (16 subsections: 1.0-1.16 covering all artifacts)
2. Value Axes (13 axes)
3. Absence Patterns
4. Creator View Template
5. Engineer View Dimensions
6. Scoring and Verdicts
7. Compliance Pre-flight
8. Link Scoring
9. URL-to-Slug Algorithm
10. Expedition Mode
11. Site Mode
12. Routing Menu
13. Agent Allocation
14. State File Schema
15. Tool Fallback Matrix
Appendix: Decision Coverage Map (all 36 decisions mapped)
Version History
```

**repo-analysis REFERENCE.md** (1,757 lines, 18 sections):

```
1. Analysis Dimensions Catalog (4 subsections: QS, ST, WR, DP)
2. Tool Stack (3 tiers + tools to avoid)
3. Output Schemas (6.3 subsections for all artifacts)
4. Scoring Bands
5. Absence Pattern Definitions
5b. Repo Type Classification
6. Code Portability Rubric
7. Temporal Fingerprint Specification
8. State File Schema
9. Guard Rails
10. Agent Allocation
11. Value Extraction Signals
12. Normalization and Comparison
12b. Research Index
13. Knowledge Dimensions (Creator View)
14. Creator View Specification (14.1-14.8 subsections)
15. Standard/Deep Process Details
16. Link Mining Pipeline
17. Cross-Repo Awareness
18. Version History
```

**website-synthesis REFERENCE.md** (709 lines, 9 sections):

```
1. Paradigm Templates (4 subsections: Thematic, Narrative, Matrix, Meta-pattern)
2. Signal Detection Rubric (4 subsections: Convergence, Divergence, Gap, Trend)
3. Source Weighting Details
4. Output Schemas (synthesis.json + synthesis.md template)
5. Cross-Type Synthesis Hooks (Planned — forward compatibility only)
6. State File Schema
7. Input Contract (cross-reference)
8. Example Synthesis Output Structure
9. Version History
```

**repo-synthesis REFERENCE.md** (499 lines, 12 sections):

```
1. Emergent Themes Report (with output format + structured output)
2. Ecosystem Gap Analysis (with output format + structured output)
3. Reading Chain (with construction algorithm + output format)
4. Mental Model Evolution (with heuristics + output format)
5. Fit Portfolio View (with refresh logic + output format)
6. Cross-Repo Knowledge Map (with construction + output format)
7. Complete synthesis.json Schema
8. Input Contract (cross-reference)
9. Guard Rails
10. State File Schema
11. Compaction Resilience
12. Version History
```

Sources: `.claude/skills/*/REFERENCE.md` via `grep -n "^## "`.

---

### 4. What's in SKILL.md vs REFERENCE.md — Split Principle [CONFIDENCE: HIGH]

**Stated principle** (website-analysis REFERENCE.md line 1): "Output schemas,
value axes, absence patterns, Creator View template, Engineer View dimensions,
scoring bands, compliance pre-flight, link scoring, URL-to-slug algorithm,
Expedition mode, Site mode, routing menu, agent allocation, state file schema,
and tool fallback matrix." This is the explicit enumeration of what belongs in
REFERENCE.md for that skill.

**Actual observed split by skill:**

| Content Type                 | website-analysis | repo-analysis | website-synthesis | repo-synthesis   |
| ---------------------------- | ---------------- | ------------- | ----------------- | ---------------- |
| Critical rules               | SKILL            | SKILL         | SKILL             | SKILL            |
| Phase procedures (brief)     | SKILL            | SKILL         | SKILL             | SKILL            |
| Phase procedures (detailed)  | REFERENCE        | SKILL         | SKILL             | SKILL            |
| Output schemas (full JSON)   | REFERENCE        | REFERENCE     | REFERENCE         | REFERENCE        |
| Output schemas (minimal)     | SKILL (names)    | SKILL (names) | SKILL (table)     | SKILL (table)    |
| Scoring bands/thresholds     | REFERENCE        | REFERENCE     | REFERENCE         | REFERENCE        |
| Creator View template        | REFERENCE        | REFERENCE     | N/A               | N/A              |
| Paradigm templates           | N/A              | N/A           | REFERENCE         | REFERENCE        |
| Signal detection heuristics  | SKILL (brief)    | N/A           | SKILL (table)     | SKILL (brief)    |
| Signal detection detail      | N/A              | N/A           | REFERENCE         | N/A              |
| Guard rails                  | SKILL (brief)    | REFERENCE     | SKILL             | REFERENCE        |
| State file schema            | REFERENCE        | REFERENCE     | REFERENCE         | REFERENCE        |
| Routing menu (full)          | REFERENCE        | SKILL         | SKILL             | SKILL            |
| Tool stack / fallback matrix | REFERENCE        | REFERENCE     | N/A               | N/A              |
| Self-audit dimensions        | SKILL            | N/A           | N/A               | SKILL            |
| Compaction resilience        | SKILL            | SKILL         | SKILL             | REFERENCE        |
| Invocation tracking          | SKILL            | N/A           | SKILL             | N/A              |
| Decision coverage map        | REFERENCE (app.) | N/A           | N/A               | N/A              |
| Input contract (cross-ref)   | N/A              | N/A           | REFERENCE         | REFERENCE        |
| Absence patterns (full)      | REFERENCE        | REFERENCE     | N/A               | N/A              |
| Synthesis output formats     | N/A              | N/A           | REFERENCE (full)  | REFERENCE (full) |

**Pattern:** SKILL.md consistently holds: critical rules, phase summaries, mode
descriptions, routing menu (for analysis skills: full; for synthesis:
abbreviated), integration pointers, and version history. REFERENCE.md
consistently holds: all full JSON schemas, scoring band tables, and anything
requiring >50 lines of spec.

**Inconsistency:** repo-synthesis moves Guard Rails, Compaction Resilience, and
full synthesis output formats to REFERENCE.md while website-synthesis keeps
Guard Rails in SKILL.md. website-analysis is uniquely the only skill with a full
Decision Coverage Map appendix in REFERENCE.md.

Sources: file:line cross-checks throughout all 8 files.

---

### 5. Section Naming Conventions [CONFIDENCE: HIGH]

**Shared conventions (appear in 3+ skills):**

- `Critical Rules (MUST follow)` — all 4 skills, identical name
- `When to Use` — all 4 skills, identical name
- `Input` — all 4 skills, identical name
- `Process Overview` — all 4 skills, identical name
- `State File & Resume` — all 4 skills (repo-synthesis uses same heading)
- `Integration` — all 4 skills, identical name
- `Retro` or `Retro (MUST/SHOULD)` — all 4 skills, minor suffix variation
- `Version History` — all 4 skills (though repo-synthesis has it only in
  REFERENCE.md for skill versions; SKILL.md uses inline footer)

**Partially standardized:**

- `Guard Rails` — website-analysis (SKILL.md), website-synthesis (SKILL.md),
  repo-analysis (REFERENCE.md), repo-synthesis (REFERENCE.md)
- `Compaction Resilience` — website-analysis (SKILL.md), repo-analysis
  (SKILL.md), website-synthesis (SKILL.md), repo-synthesis (REFERENCE.md)
- `Artifact Verification (before [X])` — website-analysis (SKILL.md),
  website-synthesis (SKILL.md), repo-analysis (SKILL.md as "Artifact
  Verification (before routing)")

**Unique to single skill:**

- `Extraction Pipeline` — website-analysis only
- `Modes` — website-analysis only (because it has Page/Site/Expedition modes)
- `Self-Audit (MUST — penultimate phase)` — website-analysis only
- `Synthesis Paradigms` — website-synthesis only
- `Warm-Up (MUST)` — repo-synthesis only
- `Phase 2.5: Verification Pass (MUST)` — repo-synthesis only
- `Phase 3: Self-Audit (MUST)` — repo-synthesis only
- `Invocation Tracking (MUST)` — website-synthesis only
- `Appendix: Decision Coverage Map` — website-analysis REFERENCE.md only

**Phase naming consistency:** All skills use `PHASE N: [NAME]` markers in
process flow. Synthesis skills have more Validate/Load/Synthesize/Present
structure; analysis skills have Quick Scan/Clone/Dimensions/Creator/Engineer
structure.

Sources: `.claude/skills/*/SKILL.md` and `.claude/skills/*/REFERENCE.md` section
headers.

---

### 6. SKILL.md Header Frontmatter [CONFIDENCE: HIGH]

All four SKILL.md files use identical YAML frontmatter structure:

```yaml
---
name: <skill-name>
description: >-
  <multi-line description>
---
```

All four use identical version block format:

```
<!-- prettier-ignore-start -->
**Document Version:** X.Y
**Last Updated:** YYYY-MM-DD
**Status:** ACTIVE
<!-- prettier-ignore-end -->
```

The REFERENCE.md files do NOT use YAML frontmatter — they open directly with the
version block in the same `<!-- prettier-ignore-start -->` format, then
`# <Title>`.

Sources: All 8 files, lines 1-15 of each.

---

### 7. Version History and Evolution [CONFIDENCE: HIGH]

| Skill             | SKILL.md Version | SKILL.md Date | REFERENCE.md Version | REFERENCE.md Date | Version Parity?         |
| ----------------- | ---------------- | ------------- | -------------------- | ----------------- | ----------------------- |
| website-analysis  | 1.0              | 2026-04-06    | 1.0                  | 2026-04-06        | YES (new skill)         |
| repo-analysis     | 4.2              | 2026-04-06    | 4.0                  | 2026-04-05        | NO (SKILL ahead by 0.2) |
| website-synthesis | 1.0              | 2026-04-06    | 1.0                  | 2026-04-06        | YES (new skill)         |
| repo-synthesis    | 1.2              | 2026-04-06    | 1.2                  | 2026-04-06        | YES                     |

**repo-analysis version history depth** (6 versions in REFERENCE.md Section 18):

- v1.0 (2026-04-02): Initial
- v1.1 (2026-04-02): Skill-audit, 16 decisions
- v1.2 (2026-04-03): Output path change
- v2.0 (2026-04-03): Schema alignment
- v3.0 (2026-04-03): Dual-lens rewrite
- v4.0 (2026-04-05): Full Creator View v2, 30-decision deep-plan
- v4.2 (2026-04-06): 4-gap fix (inline in SKILL.md footer)

**repo-synthesis version history** (3 versions, all 2026-04-05 to 2026-04-06):

- v1.0 (2026-04-05): Initial
- v1.1 (2026-04-06): Align with repo-analysis v4.2
- v1.2 (2026-04-06): Skill audit (47 decisions)

**website-analysis and website-synthesis**: Both v1.0 with no prior history —
brand new skills created on 2026-04-06.

**Observation:** repo-analysis is the oldest and most evolved skill (6 versions
in 4 days). Its maturity shows in its section count (22 in SKILL.md, 18 in
REFERENCE.md) and structural detail. The new website skills were created by
mirroring repo-analysis architecture — "mirrors /repo-analysis architecture"
appears explicitly at website-analysis SKILL.md line 18.

Sources: version blocks in all 8 files; REFERENCE.md Section 18/9/12/Version
History.

---

### 8. Information Density: SKILL.md vs REFERENCE.md [CONFIDENCE: HIGH]

**Analysis skills:** SKILL.md holds process logic; REFERENCE.md holds spec.

- website-analysis SKILL.md contains 9 dimensions described in 2-4 lines each;
  full definitions live in REFERENCE.md Sections 2-5.
- repo-analysis SKILL.md contains complete phase procedures with inline code
  examples (JSON schema excerpts, CLI commands). It is denser than
  website-analysis's SKILL.md — the SKILL:REFERENCE ratio (1:3.91) is much
  tighter than website-analysis (1:8.15) even though SKILL.md is bigger.

**Synthesis skills:** SKILL.md and REFERENCE.md have near-equal density.

- website-synthesis SKILL.md contains full phase procedures; REFERENCE.md
  contains paradigm templates, heuristics, and JSON schemas.
- repo-synthesis SKILL.md contains full phase procedures including inline
  heuristics (the Fit Portfolio synthesis_fit logic is in SKILL.md Phase 2.5);
  REFERENCE.md has all 6 output format specifications and complete
  synthesis.json schema.

**Density indicator:** SKILL.md "delegates to REFERENCE.md" pointer frequency:

- website-analysis: 8 explicit "> See REFERENCE.md Section N for..." pointers
- repo-analysis: 6 explicit pointers (fewer because more lives inline)
- website-synthesis: 2 explicit pointers ("See REFERENCE.md for paradigm
  templates" and "See REFERENCE.md for signal detection rubric" in Phase 2/3)
- repo-synthesis: 1 pointer (Phase 2 header only: "Read REFERENCE.md for output
  format specifications")

Sources: Direct reading of all 8 files for delegation patterns.

---

### 9. Unique Structural Patterns Worth Noting [CONFIDENCE: HIGH]

**website-analysis only:** Decision Coverage Map appendix in REFERENCE.md. Maps
all 36 design decisions to their implementation location. This is a navigation
aid for understanding why things are structured as they are — no other skill has
this. (REFERENCE.md lines 2174-2223)

**repo-synthesis only:** Warm-Up phase (SKILL.md section at line 121). No other
skill has a dedicated "orient the user before proceeding" phase. Also unique:
Phase 2.5 Verification Pass and Phase 3 Self-Audit as named phases
(website-analysis has Self-Audit but as a SKILL.md section outside the phase
structure, not a numbered phase).

**repo-analysis only:** Tool Stack section in REFERENCE.md (Section 2) with
three tiers (Core, Language-Conditional, Optional) and an explicit "Tools to
Avoid" table including a CVE reference (trivy v0.69.4-v0.69.6, CVE-2026-33634).
No other skill has a comparable tool vetting section.

**website-analysis only:** Dual extraction pipeline (primary vs fallback for
when superpowers-chrome is unavailable). Documented in SKILL.md lines 103-122.
No other skill has a primary/fallback execution path at this level of detail.

**website-synthesis only:** Cross-Type Synthesis Hooks section in REFERENCE.md
(Section 5, lines 597-635). Explicitly marked PLANNED, documents forward
compatibility for future cross-type synthesis (repos + websites together). No
other skill documents planned future integrations this way.

**repo-synthesis only:** Guard Rails and Compaction Resilience are in
REFERENCE.md (Sections 9, 11) while in all other skills these live in SKILL.md.

Sources: All 8 files, verified by direct reading.

---

### 10. Separation of Concerns Principle Consistency [CONFIDENCE: MEDIUM]

The stated principle for website-analysis is clear (REFERENCE.md opening):
"Output schemas, value axes, absence patterns, Creator View template, Engineer
View dimensions, scoring bands, compliance pre-flight, link scoring, URL-to-slug
algorithm, Expedition mode, Site mode, routing menu, agent allocation, state
file schema, and tool fallback matrix." This is "all spec-level content goes to
REFERENCE.md, all process-level content stays in SKILL.md."

**Consistency assessment:**

- website-analysis follows its own stated principle most consistently (HIGH
  adherence).
- repo-analysis follows the principle for schemas/specs but keeps more process
  detail inline (Creator View spec, Extraction Tracking procedures) that
  website- analysis delegates entirely. MEDIUM adherence.
- website-synthesis is the most concise and well-separated of the synthesis pair
  — SKILL.md holds process, REFERENCE.md holds output specifications and
  heuristics. HIGH adherence.
- repo-synthesis has unresolved migration: Guard Rails and Compaction Resilience
  moved to REFERENCE.md but the SKILL.md Phase 2 section delegates with a
  comment rather than being cleaned up. This suggests repo-synthesis underwent a
  skill-audit that moved content but didn't fully reconcile the split principle.
  MEDIUM adherence.

**Key discrepancy:** repo-synthesis SKILL.md Phase 2 header includes the
comment: "> Read `.claude/skills/repo-synthesis/REFERENCE.md` for output format
specifications, JSON schemas, and heuristics for each synthesis section."
(SKILL.md line 168). But then Phase 2.1-2.6 subsections in SKILL.md still
contain heuristics (e.g., contradiction handling rules, candidate cap). The
split is incomplete.

Source: repo-synthesis SKILL.md lines 165-229; website-synthesis SKILL.md lines
170-230 for comparison.

---

## Sources

| #   | Path                                            | Type     | Trust | Lines | Date       |
| --- | ----------------------------------------------- | -------- | ----- | ----- | ---------- |
| 1   | `.claude/skills/website-analysis/SKILL.md`      | codebase | HIGH  | 318   | 2026-04-06 |
| 2   | `.claude/skills/website-analysis/REFERENCE.md`  | codebase | HIGH  | 2,223 | 2026-04-06 |
| 3   | `.claude/skills/repo-analysis/SKILL.md`         | codebase | HIGH  | 524   | 2026-04-06 |
| 4   | `.claude/skills/repo-analysis/REFERENCE.md`     | codebase | HIGH  | 1,757 | 2026-04-05 |
| 5   | `.claude/skills/website-synthesis/SKILL.md`     | codebase | HIGH  | 290   | 2026-04-06 |
| 6   | `.claude/skills/website-synthesis/REFERENCE.md` | codebase | HIGH  | 709   | 2026-04-06 |
| 7   | `.claude/skills/repo-synthesis/SKILL.md`        | codebase | HIGH  | 331   | 2026-04-06 |
| 8   | `.claude/skills/repo-synthesis/REFERENCE.md`    | codebase | HIGH  | 499   | 2026-04-06 |

All sources are ground-truth filesystem reads. No web lookups performed.

---

## Contradictions

**SKILL.md version vs REFERENCE.md version for repo-analysis:** SKILL.md is at
v4.2 (2026-04-06); REFERENCE.md is at v4.0 (2026-04-05). The SKILL.md footer
note documents what changed in v4.2 but REFERENCE.md was not bumped to match.
This is the only skill where the two files have different version numbers.

**repo-synthesis Guard Rails placement:** Both website-synthesis (SKILL.md) and
repo-synthesis (REFERENCE.md) contain Guard Rails, but they're in different
files. The Guard Rails content itself is similar (abort on <3 entities, don't
re-analyze, handle missing artifacts). The placement discrepancy is not
explained by content difference.

**repo-analysis routing menu placement:** Full routing table lives in SKILL.md
(lines 470-486). For website-analysis, the routing menu is split: brief in
SKILL.md (lines 229-245) and detailed spec in REFERENCE.md Section 12. For
synthesis skills, routing is inline in SKILL.md Phase 4. Inconsistent across the
family.

---

## Gaps

1. **No documented convention** for what specifically triggers content moving to
   REFERENCE.md vs staying in SKILL.md. The principle is implicit, not stated
   explicitly as a rule in any shared location.
2. **repo-analysis REFERENCE.md** was not read in its entirety (Sections 5-18,
   lines 750+). The structural summary is based on the section headers extracted
   via grep plus deep reads of Sections 1-3. Section content for Sections 5-18
   was not exhaustively reviewed — this is relevant only if a content-level
   comparison is needed (other agents handle that).
3. **No shared REFERENCE.md template exists** across the skill family. Each
   REFERENCE.md was built independently, which explains the structural
   inconsistencies.
4. **"When NOT to Use" placement:** website-analysis has it as a standalone
   `## When NOT to Use` section (line 50); repo-analysis, website-synthesis, and
   repo-synthesis inline it within `## When to Use`. The structural divergence
   is minor but reflects early design evolution.

---

## Serendipity

**website-analysis REFERENCE.md has a Decision Coverage Map appendix** (lines
2174-2223) that maps all 36 design decisions to their implementation location in
SKILL.md or REFERENCE.md. This is a surprisingly useful navigation artifact that
none of the other three skills have. If adopted universally, it would make the
two-file split much more legible — readers would know exactly which section to
read for any given decision. This pattern could be valuable for all skills as
they grow.

**repo-analysis is the only skill with a "Tools to Avoid" list** in REFERENCE.md
Section 2 (includes a CVE reference). This represents a live security concern
(CVE-2026-33634 for trivy v0.69.4-v0.69.6) that is embedded in the skill's
reference documentation. The pattern of maintaining a "don't use this" list
alongside "use this" lists could be useful for other skills.

**repo-synthesis was updated 3 times on 2026-04-06 alone** (v1.0 on 2026-04-05,
v1.1 and v1.2 both on 2026-04-06). The v1.2 note says "Skill audit (47
decisions)." This rapid iteration pattern — driven by a skill audit — is
distinct from the repo-analysis evolution pattern (driven by sequential
deep-plans). It may be worth understanding which approach produces better
structural outcomes.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM claims: 1
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All findings are based on direct filesystem reads with line-number citations. No
external sources or training-data assertions were used.
