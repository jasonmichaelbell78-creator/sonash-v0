# DIAGNOSIS: Creator View Comprehensive Upgrade

**Date:** 2026-04-05 **Task:** Redesign repo-analysis Creator View to close 10
identified gaps and discover new ones. Full-build scope — craft, not MVP.

---

## ROADMAP Alignment

**Status: NEW DIRECTION (approved)**

The SoNash ROADMAP is app-focused (milestones M1-M8 cover sobriety features).
This work is AI tooling — it aligns with JASON-OS vision (user_os_vision memory:
"project-agnostic Claude Code OS with portable workflows, skills, agents") and
the repo-analysis skill's role as a knowledge acquisition tool. The user has
explicitly approved this work and scoped it across sessions #263+.

---

## Current System State

### Skill Architecture (v3.0, shipped 2026-04-03)

- **SKILL.md:** 274 lines, 6 phases (Validate → Quick Scan → Clone → Dimensions
  → Creator View → Engineer View → Value Map → Routing)
- **REFERENCE.md:** ~400 lines, 15 sections covering dimensions, schemas,
  absence patterns, scoring bands, portability rubric, temporal fingerprint,
  Creator View spec
- **Creator View:** 5 sections (Understands / Relevant / Differs / Challenge /
  Knowledge Candidates). Mandatory for Standard/Deep. Lightweight lens for
  Quick.
- **value-map.json schema:** Two candidate types — `pattern_candidates` (code to
  extract) and `knowledge_candidates` (understanding to gain). Single relevance
  axis per candidate.
- **Scoring:** 6 dimensions (Security/Reliability/Maintainability/Documentation/
  Process/Velocity), 4 bands (Critical/Needs Work/Healthy/Excellent), weighted
  average composite.
- **Absence patterns:** 7 defined (GHOST_SHIP, TEST_THEATER, SECURITY_FACADE,
  BORROWED_ARMOR, DEPENDENCY_FREEZE, LONE_WOLF, SILENT_FAILURE). No
  CURATED_LIST.
- **Repo type awareness:** Segmentation in Section 12 (language, project type,
  maturity, team size) but no curated-list/registry classification that would
  trigger different analysis behavior.

### Real-World Data (6 repos scanned)

- **EXTRACTIONS.md:** 29 candidates across 6 repos. 26 deferred, 0 extracted, 0
  skipped.
- **extraction-journal.jsonl:** 30 entries (29 candidates + 1 investigation
  flagged).
- **Creator View output (notebooklm-py):** 330 lines. Strong proof-of-concept.
  Demonstrates the 5-section structure works. Also demonstrates where it fails:
  no place for anti-ideas, no fit-separation in rankings, no link mining for
  curated repos.
- **Curated-list repos in tracker:** public-apis (Quick Scan only — link mining
  would be highest value), codecrafters-io/build-your-own-x (3 candidates, link
  mining would expand dramatically).

### Neighboring Systems

- **EXTRACTIONS.md:** Cross-repo aggregation file. Currently a flat table
  grouped by repo. No synthesis, no cross-cutting insights, no reading chain.
- **extraction-journal.jsonl:** Per-candidate decision log. Schema:
  `{repo, candidate, status, decision, decision_date, extracted_to, notes}`. No
  schema version field.
- **research-index.jsonl:** Cross-skill discoverability index. One record per
  analysis run.

---

## The 10 Known Gaps (from session #263 discussion)

Organized by the structural dimension they affect:

### Per-repo, per-scan gaps (affect individual analysis output)

- **G1** — Link mining for curated-list repos (no detection, no recursion)
- **G8** — Single relevance axis conflates objective + personal fit
- **G9** — No structural home for anti-ideas / cautionary learnings
- **G10** — Scoring penalizes long-tail repos that contain novel thinking

### Cross-repo gaps (affect synthesis across multiple analyses)

- **G2** — No emergent story / synthesis across analyzed repos
- **G5** — No ecosystem meta-pattern detection across N repos
- **G7** — No reading chain / next-repo recommendations

### Temporal gaps (affect how analysis evolves over time)

- **G3** — Home context doesn't weight recent work higher
- **G6** — No tracking of how creator's mental model shifts across scans

### Process gap

- **G4** — Only asks "what did they figure out?" Never asks "what did they NOT
  solve?" (negative-space detection)

---

## Reframe Check

**Is this task what it appears to be?**

Yes, but it's bigger than the gap list suggests. The 10 gaps cluster into three
architectural layers:

1. **Schema layer** — value-map.json, extraction-journal.jsonl, EXTRACTIONS.md
   all need schema changes (G8 fit-separation, G1 link mining output, G10
   scoring lens, G9 anti-ideas categorization). These are the hardest changes
   because they cascade through existing data.

2. **Analysis layer** — The Creator View process (Phase 4) gains new detection
   logic (G1 CURATED_LIST classifier, G4 negative-space, G10 scoring rebalance,
   G3 recency weighting). These are additions to the skill's analysis engine.

3. **Synthesis layer** — Entirely new capabilities that don't exist today (G2
   cross-repo synthesis, G5 ecosystem patterns, G6 mental model tracking, G7
   reading chain). These may require a new skill or major new phase.

Discovery should explore all three layers and whether additional gaps exist in
each.

---

## Prior Research

- **`.planning/repo-analysis-skill/`** — Original v3.0 deep-plan artifacts (24
  decisions, 9-step plan). Historical reference for how the current skill was
  designed. Not directly about this upgrade.
- **`.research/repo-analysis/`** — Output directory for 6 completed scans. Real
  data to design against.
- **`_workflow-phase-a.md`** — Session #263 workflow document with seed
  questions, repo type classification, locked decisions. Primary input for this
  deep-plan.
- **No `/deep-research` needed** — The domain knowledge is internal (our own
  skill, our own scan data, our own gap analysis). This isn't a technology
  landscape or external API we need to research. If discovery surfaces an
  external question (e.g., "how do other repo-analysis tools handle curated
  lists?"), we can spot-research then.

---

## Key Constraints

- `/deep-plan → skill-creator` ordering is locked
- The 6 already-scanned repos WILL be re-processed (migration matters)
- Full-build, not MVP — thoroughness over speed
- Discovery should expand the gap list, not just resolve the known 10
