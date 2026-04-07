# Research Output: Website-Analysis/Synthesis vs Repo-Analysis/Synthesis — Full Comparative Analysis

<!-- prettier-ignore-start -->
**Date:** 2026-04-06
**Topic:** Website-analysis/synthesis vs repo-analysis/synthesis — full comparative analysis
**Depth:** L1 (Exhaustive)
**Agent Count:** 17
**Status:** COMPLETE
<!-- prettier-ignore-end -->

---

## Executive Summary

- **repo-analysis is the structural anchor** of the family. At v4.2 with 22
  SKILL.md sections and 18 REFERENCE.md sections, it is the oldest and most
  evolved skill. website-analysis, website-synthesis, and repo-synthesis all
  mirrored its architecture — "mirrors /repo-analysis architecture" is stated
  explicitly in website-analysis SKILL.md. Lifting patterns from repo-analysis
  to the others is the primary convergence direction [D01-F7].

- **The two synthesis skills were built by different design priorities.**
  repo-synthesis prioritized operational robustness: warm-up phase, Phase 2.5
  verification pass, Phase 3 self-audit, pause command, delegation protocol,
  retro persisted to state. website-synthesis prioritized analytical rigor:
  formal convergence scoring formula, T1-T4 source tier weighting system, 4
  synthesis paradigms, 8-12 thematic question fan-out with 0-3 scoring matrix.
  Each has patterns the other needs [D06-F11].

- **The largest structural divergence is the SKILL/REFERENCE split.** Analysis
  skills delegate heavily to REFERENCE.md (ratios 1:3.9 to 1:8.2). Synthesis
  skills have near-equal files (1:1.1 to 1:1.8). This is not a size difference
  but a philosophy difference about what belongs where. repo-synthesis in
  particular has an incomplete split — Guard Rails and Compaction Resilience
  moved to REFERENCE.md while heuristics remain inline in SKILL.md [D01-F10].

- **Schema drift between specification and runtime is the most critical
  operational gap.** The repo-analysis REFERENCE.md documents a v2.0 schema with
  `extraction_candidates[]` and numeric `objective_score`/`personal_fit_score`.
  Actual v4.2 runtime artifacts use 4 typed candidate arrays with qualitative
  scoring — a fundamentally different structure. No update was made to
  REFERENCE.md. This gap is CRITICAL because repo-synthesis consumes these
  artifacts and will fail silently on schema mismatches [D05-F3].

- **Three conventions are perfectly unified across all four skills:** the phase
  transition marker format (`========== PHASE N: [NAME] ==========`), the
  write-to-disk-first rule, and the "conversational, not clinical" prose
  mandate. These should be protected as the canonical shared layer [D02-F1,
  D08-F1].

- **The extraction journal and extraction chain artifact paths are
  architecturally incompatible.** website-analysis places
  `extraction-journal.jsonl` and `reading-chain.jsonl` at `.research/` (root,
  shared). repo-analysis places both under `.research/repo-analysis/`. A future
  cross-type synthesizer would need to read from two different paths for the
  same conceptual artifact — this must be resolved before any cross-type
  synthesis can be implemented [D05-F6, D10-F3].

- **repo-synthesis's retro-feedback loop is the most novel UX pattern in the
  suite.** It is the only skill where retro responses are persisted to the state
  file AND replayed at the start of the next run (via the Warm-Up phase). This
  closes the feedback loop in a way the other three skills do not. The pattern
  should be adopted by all four skills [D07-F12].

---

## Dimension-by-Dimension Comparison

### D01 — Architecture & File Structure

All four skills use a two-file layout (SKILL.md + REFERENCE.md), but the split
principle is applied inconsistently. The stated principle — "process in
SKILL.md, specs in REFERENCE.md" — is best followed by website-analysis (HIGH
adherence) and website-synthesis (HIGH adherence). repo-analysis (MEDIUM) keeps
more process detail inline than it delegates. repo-synthesis (MEDIUM) has an
incomplete migration: Guard Rails and Compaction Resilience moved to
REFERENCE.md during a v1.2 skill audit, but Phase 2 in SKILL.md still contains
inline heuristics [D01-F10].

**Key measurements:**

| Skill             | SKILL:REFERENCE ratio | SKILL.md sections | REFERENCE.md sections |
| ----------------- | --------------------- | ----------------- | --------------------- |
| website-analysis  | 1:8.15                | 19                | 15 + appendix         |
| repo-analysis     | 1:3.91                | 22                | 18                    |
| website-synthesis | 1:1.78                | 17                | 9                     |
| repo-synthesis    | 1:1.07                | 14                | 12                    |

[D01-F1]

website-analysis is the only skill with a Decision Coverage Map appendix in
REFERENCE.md (all 36 design decisions mapped to their implementation location).
This is a navigation artifact no other skill has [D01-F9]. repo-analysis is the
only skill with a "Tools to Avoid" list including a live CVE reference (trivy
CVE-2026-33634) [D01-F9].

**Routing menu placement** is inconsistent: website-analysis keeps a brief
version in SKILL.md with a full spec in REFERENCE.md; repo-analysis keeps the
full routing table in SKILL.md; synthesis skills keep it inline in Phase 4
[D01-F4].

---

### D02 — Phase Design

All four skills use identical phase transition markers
(`========== PHASE N: [NAME] ==========`) and identical MUST/SHOULD language.
This is the most fully unified convention in the skill family [D02-F1].

Analysis skills have 5-9 phases plus pre-phases; synthesis skills have 4-6
phases with a flatter structure. The analysis-to-synthesis handoff is
architecturally clean: synthesis skills consume what analysis skills produce,
with no overlap [D02-F2].

**Self-audit asymmetry is the most consequential phase gap.** website-analysis
has a 9-dimension Self-Audit (MUST, penultimate). repo-synthesis has a
6-dimension Phase 3 Self-Audit (MUST). repo-analysis has only an artifact
verification checklist. website-synthesis has only an artifact existence check —
the weakest of the four [D02-F6, D07-F13].

**Phase patterns worth cross-pollinating:**

- WARM-UP phase (repo-synthesis only): scope estimate + candidate counts + prior
  feedback before work begins [D02-F10]
- Phase 2.5 Verification Pass (repo-synthesis only): T20 tally of
  confirmed/corrected/extended/new claims [D02-F7]
- Phase 3b Coverage Audit (repo-analysis only): interactive scan for unexplored
  content after main analysis [D02-F4]
- PREFLIGHT as a named pre-phase (website-analysis only): compliance check
  before extraction [D02-F2]

---

### D03 — Agent Orchestration

Analysis skills spawn agents; synthesis skills do not. This is a clean
architectural boundary, not a gap — synthesis skills "read, don't re-analyze"
[D03-F12].

Both analysis skills share an identical 5-step agent failure protocol (including
the Windows 0-byte output bug workaround, referencing CLAUDE.md guardrail #15).
This copy-equivalent protocol indicates deliberate cross-skill coordination
[D03-F5].

**repo-analysis uses named custom agents** (`gsd-codebase-mapper`,
`security-auditor`, `code-reviewer`, `test-engineer`, `deployment-engineer`,
`backend-architect`, `performance-engineer`) — the most agent-rich skill in the
set. website-analysis uses anonymous spawned agents with role descriptions but
no named identities [D03-F3].

**Hard cap of 4 concurrent agents** is documented identically in both analysis
skills, with website-analysis explicitly cross-referencing repo-analysis as its
precedent [D03-F2].

**State tracking diverges:** repo-analysis uses
`agent_budget: {allocated, spawned, completed}`; website-analysis uses flat
`agents_spawned`/`agents_completed`. The MEMORY.md behavioral rule
`feedback_no_agent_budgets.md` ("allocation formula is a planning floor, not a
spending cap") is in tension with the `agent_budget.allocated` field in
repo-analysis's state schema [D03-F7].

**Key gap:** website-analysis spawns agents "if content is substantial" with no
quantitative threshold. repo-analysis uses a concrete 20-file cutoff for inline
vs agent processing [D03-F8].

---

### D04 — Scoring Models

All four skills share the same 4-band categorical scale (Critical/Needs
Work/Healthy/Excellent) and the "Bands over numbers" display rule
(`Healthy (74)` not `74`) [D04-F1].

**The two analysis skills have materially different scoring architectures:**

- website-analysis: 13 value axes on a 1-5 integer scale with named rubric
  levels; 6 Engineer dimensions on 0-100; composite formula explicitly weighted
  (Content 50%, Technical Health 20%, Creator Value 30%) [D04-F3]
- repo-analysis: 56 total dimensions (39 without deep mode) on 0-100; dual-lens
  scoring (Adoption vs Creator, both computed on every analysis); no explicit
  composite formula document — implied from weight tables [D04-F3]

Both analysis skills share a critical floor metric — the minimum dimension score
displayed alongside the overall score to prevent a high average masking a
catastrophic failure on one dimension [D04-F9].

**The sharpest synthesis divergence:** website-synthesis has a formal weighted
convergence scoring formula
(`convergence_score = sum(source_tier_weight[site])`) with tier weights T1=3x
through T4=0.5x and explicit confidence thresholds (HIGH >=6.0, MEDIUM 3.0-5.9,
LOW 1.5-2.9). repo-synthesis uses a bare "3+ repos" threshold with no weighting,
no independence check, no confidence classification [D04-F7].

Fit scoring is perfectly shared across all four skills: `active-sprint`
(personal_fit >= 60), `park-for-later` (personal_fit < 60, objective >= 60),
`evergreen` (both >= 40), `not-relevant` (otherwise) [D04-F8].

---

### D05 — Output Artifacts & Schemas

**Schema drift between specification and runtime is critical.** The
repo-analysis REFERENCE.md v2.0 spec documents a single
`extraction_candidates[]` array with `objective_score` and `personal_fit_score`.
Actual v4.2 runtime files use 4 typed arrays (`patternCandidates`,
`knowledgeCandidates`, `contentCandidates`, `antiPatternCandidates`) with
qualitative (`novelty`/`effort`/`relevance`) fields — not the numeric scores.
The `schema_version` field itself uses `skillVersion: "4.1"` in actual files vs
`schema_version: "2.0"` in the spec [D05-F3].

**Findings.jsonl schema drift:** REFERENCE.md uses `detail`; actual files use
`description`. REFERENCE.md requires `schema_version`; actual files omit it
[D05-F4].

**Cross-entity artifact path conflict:**

- `extraction-journal.jsonl`: website-analysis → `.research/`; repo-analysis →
  `.research/repo-analysis/`
- `reading-chain.jsonl`: website-analysis → `.research/`; repo-analysis →
  `.research/repo-analysis/`
- `EXTRACTIONS.md`: website-analysis → `.research/EXTRACTIONS.md`; repo-analysis
  → `.research/repo-analysis/EXTRACTIONS.md`

These are three separate path conflicts for conceptually shared artifacts
[D05-F6].

**State file richness:** website-analysis (21 fields, most operational detail);
repo-synthesis (13 fields, follow_up_actions + process_feedback sub-objects);
repo-analysis (16 fields, agent_budget sub-object); website-synthesis (11
fields, leanest) [D08-F3].

**Synthesis output naming inconsistency:** repo-synthesis uses `SYNTHESIS.md`
(uppercase) at the root of `.research/repo-analysis/`. website-synthesis uses
`synthesis.md` (lowercase) in a `synthesis/` subdirectory. repo-synthesis JSON
uses `version: "1.2"` at top level; website-synthesis JSON uses
`schema_version: "1.0"` — different key names [D05-F8].

---

### D06 — Synthesis Design

The two synthesis skills were designed by fundamentally different priorities
that produced complementary strengths:

**website-synthesis strengths:** analytical rigor — formal convergence scoring
formula with tier weights, 4 synthesis paradigms
(thematic/narrative/matrix/meta-pattern), 8-12 thematic question fan-out with
0-3 scoring matrix, thematic saturation stopping rule, T1-T4 source tier
weighting (6:1 ratio), independence verification (citing sites count as 1
source) [D06-F5, D06-F6, D06-F7].

**repo-synthesis strengths:** operational robustness — Warm-Up phase with effort
estimate, Phase 1 checkpoint requiring user confirmation, Phase 2.5 Verification
Pass (T20 tally), Phase 3 Self-Audit (6 dimensions including regression
detection vs prior SYNTHESIS.md), pause command, delegation protocol, retro
persisted to state and reused next run, candidate cap (>100 → top 50 inline)
[D06-F4, D06-F11].

**Contradiction handling diverges in strength:** repo-synthesis makes "do not
resolve contradictions" a hard MUST with its own named output type (Contrarian
Signal section). website-synthesis has the same intent but expressed softly,
with no named output type [D06-F8].

**website-synthesis unique outputs:** Knowledge Portfolio with
`convergence_boost` flag on top candidates; 4 paradigms enable
narrative/matrix/meta-pattern synthesis not available in repo-synthesis [D06-F9,
D06-F11].

**repo-synthesis unique outputs:** Mental Model Evolution (chronological
perspective tracking across scans), Reading Chain (ordered study sequence from
relationship graph), Ecosystem Gap Analysis (by ecosystem_tag), Fit Portfolio
refresh (against current SESSION_CONTEXT.md and ROADMAP.md) [D06-F11].

Both synthesis skills enforce the minimum-3-instance threshold and offer
`--min-N` override. repo-synthesis alone documents the 2-instance edge case:
"comparison, not synthesis" with a `--focus=gaps|portfolio` recommendation
[D06-F2].

---

### D07 — UX & Interaction Design

All four skills share the "conversational, not clinical" prose mandate as an
exact phrase. All four use the phase transition marker format. All four end with
a routing/follow-up actions menu [D07-F6].

**The depth flag inconsistency between analysis skills is the most visible UX
friction.** website-analysis uses bare flags (`--standard`, `--deep`);
repo-analysis uses keyed flags (`--depth=standard`, `--depth=deep`). Not
interchangeable [D07-F1, D07-F9].

**Interactive checkpoints:**

- website-analysis: 4 checkpoints (Quick Scan gate, WARN acknowledgment, Site
  mode every-5-pages gate, routing menu)
- repo-analysis: 4 checkpoints (Quick Scan gate, Content Eval depth-2 gate,
  Coverage Audit [A/S/N], routing menu)
- website-synthesis: 1 checkpoint (follow-up actions menu)
- repo-synthesis: 2 checkpoints (Phase 1 "Proceed?" gate, follow-up actions
  menu) [D07-F4]

**Repo-synthesis retro loop** is the only closed cross-session feedback
mechanism: retro saved to state.process_feedback → replayed in next Warm-Up as
"Previous feedback: [X]. Adjusting accordingly." [D07-F12].

**Unique UX patterns worth considering for adoption:**

- repo-synthesis Warm-Up (scope brief before work): repo count, candidate count,
  effort estimate, prior feedback acknowledgment
- repo-synthesis delegation protocol ("you decide" → records rationale as
  delegated-action)
- repo-synthesis pause command (saves state and exits gracefully at any point)
- repo-analysis curated-list enriched gate (context-sensitive text when repo is
  a curated list)
- website-synthesis paradigm selection (4 named paradigms give explicit
  synthesis strategy control)
- website-analysis WARN acknowledgment (compliance warnings require explicit
  user action)
- website-analysis Expedition mode (multi-hop HITL navigation, unique to the
  family)

---

### D08 — Guard Rails & Resilience

Three guard rails are perfectly unified across all four skills:
write-to-disk-first, state-file-on-every-phase, conversational/non-clinical
output [D08-F1].

**Critical rule counts:** repo-analysis (10), website-analysis (8),
website-synthesis (8), repo-synthesis (5). repo-synthesis has significantly
fewer critical rules despite being a complex skill — this may explain why it
required a 47-decision skill audit for v1.2 [D08-F1].

**Data integrity spectrum:**

- website-analysis and repo-synthesis: most thorough — named multi-dimension
  self-audit phases (MUST)
- repo-analysis: artifact checklist + Coverage Audit (no named self-audit phase)
- website-synthesis: artifact existence check only — the weakest in the family

**Windows-specific gaps:** The 0-byte agent output workaround is explicitly
documented in both analysis skills. The MAX_PATH algorithm is documented only in
website-analysis (repo-analysis sidesteps it by cloning to `/tmp/`). Neither
synthesis skill documents Windows workarounds because they spawn no agents
[D08-F9].

**Anchoring prevention** (analyzing all instances independently BEFORE synthesis
begins) is specified only in website-synthesis. repo-synthesis has no equivalent
guard — it loads all artifacts in Phase 1 but does not explicitly prohibit
anchoring [D08-F11].

**TDMS anti-pollution rule** (opt-in only via routing menu) is
repo-analysis-only. website-analysis has no equivalent despite having a similar
routing menu structure with "Extract knowledge" as option 1 [D08-F11, D10-F1].

---

### D09 — Dual-Lens / Multi-Perspective Design

**repo-analysis has the most formalized dual-lens system:** Adoption Lens (6
dimensions, Adopt/Trial/Extract/Avoid) and Creator Lens (7 dimensions,
Study/Explore/Extract/Note). Both computed on every analysis. Primary lens
auto-selected by repo type. `--lens` override available [D09-F1].

**website-analysis uses a single Creator Verdict**, not a true dual-lens. The
Engineer View contributes 20% to the composite score but produces no independent
verdict. Calling it "Dual-lens" in the SKILL.md description is misleading
relative to repo-analysis's architecture [D09-F2].

**The "Extract" verdict collision** exists in both analysis skills: "Extract"
appears in both the Adoption lens (Extract: don't adopt whole, cherry-pick
parts) and the Creator lens (Extract: low learning priority, cherry-pick
insights). Same word, different decision context, can cause confusion in
cross-lens display [D09-F11].

**Creator View section ordering diverges:** website-analysis leads with "What's
Relevant To Your Work" (Section 1); repo-analysis leads with "What This Repo
Understands" (Section 1). Both include both themes but the priority signal
differs for users comparing across skill types [D09-F6].

**Both skills load the same 5 home context sources** before writing Creator
View: SESSION_CONTEXT.md, ROADMAP.md, CLAUDE.md, `.claude/skills/` listing,
MEMORY.md [D09-F12].

**Synthesis skills do not re-apply lenses** — they aggregate above the per-item
lens layer. repo-synthesis reading chain uses creator_verdict only (adoption
verdict absent), meaning a repo that is `Avoid` for adoption but `Study` for
learning will be prioritized in the reading chain [D09-F8].

---

### D10 — Integration & Downstream Routing

**TDMS integration exists only in repo-analysis** — not website-analysis, not
synthesis skills. This is the sharpest single integration asymmetry in the
family [D10-F1].

**Invocation tracking is inconsistent:**

- website-analysis: MUST, `write-invocation.ts` documented
- website-synthesis: explicit bash command shown
- repo-analysis: no `write-invocation.ts` call documented (uses state file
  timestamps instead)
- repo-synthesis: not documented [D10-F8]

**research-index.jsonl** is written by repo-analysis on every run and read at
session-begin. It is the only session-level integration point in the suite —
making repo-analysis the most "integrated" skill in the session lifecycle.
website-analysis, website-synthesis, and repo-synthesis have no session-begin
hook [D10-F3, D10-F7].

**Cross-skill routing is bidirectional:** Analysis skills conditionally offer
synthesis at options 7/8. Synthesis skills offer "Fill a gap" which queues the
parent analysis skill. repo-synthesis's "Explore a theme" explicitly escalates
to `/deep-research` — the only cross-skill escalation to a non-sibling skill
[D10-F4].

**The planned cross-type synthesis** (repos + websites together) is documented
in website-synthesis REFERENCE.md Section 5 with forward-compatibility hooks.
The shared fields between synthesis.json files (`schema_version`,
`synthesized_at`, `paradigm_output`, `signals`) were intentionally aligned. The
source_tier asymmetry (repos have no T1-T4 equivalent) is the key design
challenge to solve [D10-F6].

---

## Decision Matrix: What to Unify

| Feature / Pattern                                                  | Recommendation | From → To                                                                                     | Rationale                                                                                        |
| ------------------------------------------------------------------ | -------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Phase transition marker format                                     | KEEP-UNIFIED   | All 4                                                                                         | Already identical — protect this                                                                 |
| "Write-to-disk-first" critical rule                                | KEEP-UNIFIED   | All 4                                                                                         | Already identical — protect this                                                                 |
| "Conversational, not clinical" mandate                             | KEEP-UNIFIED   | All 4                                                                                         | Already identical — protect this                                                                 |
| Fit scoring thresholds (active-sprint/park/evergreen/not-relevant) | KEEP-UNIFIED   | All 4                                                                                         | Already identical — protect this                                                                 |
| Depth flag syntax                                                  | UNIFY          | `--standard`/`--deep` + `--depth=standard`/`--depth=deep` → `--depth=standard`/`--depth=deep` | website-analysis should adopt keyed syntax to match repo-analysis                                |
| `schema_version` key in JSON artifacts                             | UNIFY          | `version` (repo-synthesis) → `schema_version`                                                 | Forward-compatibility requires unified key name                                                  |
| Self-audit phase (named, MUST)                                     | UNIFY          | website-analysis + repo-synthesis → repo-analysis + website-synthesis                         | repo-analysis and website-synthesis need self-audit phases                                       |
| Retro persisted to state file                                      | UNIFY          | repo-synthesis → website-analysis, repo-analysis, website-synthesis                           | Closed feedback loop is universally valuable                                                     |
| Warm-Up phase / scope announcement                                 | UNIFY          | repo-synthesis → website-synthesis                                                            | Synthesis runs benefit from scope confirmation before committing                                 |
| Phase 2.5 Verification Pass (T20 tally)                            | UNIFY          | repo-synthesis → website-synthesis                                                            | Evidence verification before presentation strengthens outputs                                    |
| Invocation tracking (`write-invocation.ts`)                        | UNIFY          | website-analysis, website-synthesis → repo-analysis, repo-synthesis                           | All skills should track invocations consistently                                                 |
| Thematic saturation stopping rule                                  | UNIFY          | website-synthesis → repo-synthesis                                                            | Prevents unbounded theme extraction                                                              |
| SKILL.md vs REFERENCE.md split principle                           | UNIFY          | website-analysis principle → repo-analysis, repo-synthesis, website-synthesis                 | Make the split rule explicit and shared                                                          |
| Convergence scoring formula                                        | EVALUATE       | website-synthesis → repo-synthesis                                                            | Repos may not need tier weights but need a confidence formula and independence verification      |
| Source tier weighting (T1-T4)                                      | EVALUATE       | website-synthesis → repo-synthesis                                                            | Repos vary in quality (arXiv vs awesome-list) — a repo tier system could be designed             |
| Agent naming (named vs anonymous)                                  | EVALUATE       | repo-analysis named agents → website-analysis                                                 | website-analysis could benefit from named agents for self-audit and link scoring phases          |
| TDMS integration                                                   | EVALUATE       | repo-analysis → website-analysis                                                              | Website findings could enter TDMS — needs a field mapping spec first                             |
| Decision Coverage Map appendix                                     | EVALUATE       | website-analysis → all skills                                                                 | Valuable navigation artifact — adds maintenance cost                                             |
| "No silent skips" as an explicit critical rule                     | UNIFY          | website-analysis, repo-analysis → website-synthesis, repo-synthesis                           | Synthesis skills omit this from Critical Rules despite sharing the behavior                      |
| Extraction journal path (root vs subdirectory)                     | UNIFY          | Conflict resolution required                                                                  | Must pick one canonical location before cross-type synthesis can proceed                         |
| Home context loading (all 5 sources)                               | KEEP-UNIFIED   | All 4                                                                                         | Already consistent — protect this                                                                |
| Empty artifact warning                                             | UNIFY          | repo-synthesis → website-synthesis                                                            | Prevents silent synthesis with thin data                                                         |
| Anchoring prevention guard                                         | UNIFY          | website-synthesis → repo-synthesis                                                            | Prevents bias from reading one repo's analysis before loading others                             |
| Delegation protocol ("you decide")                                 | KEEP-SEPARATE  | repo-synthesis only                                                                           | Unique to longer-running multi-output synthesis — not needed in analysis or website-synthesis    |
| Pause command                                                      | KEEP-SEPARATE  | repo-synthesis only                                                                           | Unique value for long synthesis runs — website-synthesis runs are shorter                        |
| Expedition mode                                                    | KEEP-SEPARATE  | website-analysis only                                                                         | Website-specific HITL traversal — no repo equivalent                                             |
| Adoption Lens (Adopt/Trial/Extract/Avoid)                          | KEEP-SEPARATE  | repo-analysis only                                                                            | Websites have no "adopt as dependency" concept                                                   |
| 4 synthesis paradigms                                              | KEEP-SEPARATE  | website-synthesis only                                                                        | Paradigm switching adds overhead not needed for repo synthesis                                   |
| Mental Model Evolution                                             | KEEP-SEPARATE  | repo-synthesis only                                                                           | Tracks scan-date perspective shifts — website synthesis has Narrative paradigm as partial analog |
| Reading Chain                                                      | KEEP-SEPARATE  | repo-synthesis only                                                                           | Requires relationship graph from `related_repos[]` — websites lack equivalent                    |
| Compliance pre-flight (HARD_BLOCK/WARN)                            | KEEP-SEPARATE  | website-analysis only                                                                         | Web-specific compliance context (robots.txt, Cloudflare)                                         |
| GitHub API rate limit guard                                        | KEEP-SEPARATE  | repo-analysis only                                                                            | API-specific concern                                                                             |
| Clone safety (/tmp, LFS guard, cleanup)                            | KEEP-SEPARATE  | repo-analysis only                                                                            | Repo-specific infrastructure                                                                     |
| TDMS anti-pollution rule                                           | EVALUATE       | repo-analysis → website-analysis                                                              | Add equivalent "Extract Knowledge is opt-in only" guard                                          |
| research-index.jsonl session-begin hook                            | EVALUATE       | repo-analysis → website-analysis                                                              | Surfaces prior work at session start — valuable for all skills                                   |

---

## Gap Analysis: What Each Skill Is Missing

### website-analysis Gaps

| Gap                                                                             | Severity   | Notes                                                                                                         |
| ------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| Self-audit phase is informal                                                    | **HIGH**   | 9-dimension audit exists but as a SKILL.md section outside phase structure — should be a named phase [D02-F6] |
| Depth flag syntax inconsistency (`--standard`/`--deep` vs `--depth=`)           | **High**   | Creates UX friction at the family level [D07-F9]                                                              |
| No quantitative "substantial content" threshold for agent spawning              | **Medium** | repo-analysis has explicit 20-file cutoff; website-analysis uses judgment [D03-F8]                            |
| No Coverage Audit phase                                                         | **Medium** | repo-analysis Phase 6b scans for unexplored content — valuable for dense websites too [D02-F4]                |
| No TDMS integration                                                             | **Medium** | Website findings have no path into the tech debt pipeline [D10-F1]                                            |
| Invocation tracking not linked to `write-invocation.ts` in REFERENCE.md routing | **Medium** | SKILL.md declares it MUST; REFERENCE.md Done option doesn't call it [D10-F8]                                  |
| No TDMS anti-pollution guard                                                    | **Low**    | repo-analysis explicitly prohibits auto-population; website-analysis has no equivalent [D08-F11]              |
| "When NOT to Use" as standalone section vs inlined                              | **Low**    | Minor but creates asymmetry from repo-analysis [D01-F4]                                                       |

### repo-analysis Gaps

| Gap                                                                                   | Severity     | Notes                                                                                                                                   |
| ------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| REFERENCE.md v2.0 schema not updated to match v4.2 runtime                            | **Critical** | 4-typed-array candidate model vs single `extraction_candidates[]` — misleads downstream consumers including repo-synthesis [D05-F3]     |
| findings.jsonl `detail` vs `description` spec-to-reality drift                        | **High**     | REFERENCE.md says `detail`; actual files use `description` [D05-F4]                                                                     |
| REFERENCE.md version behind SKILL.md (v4.0 vs v4.2)                                   | **High**     | The only skill with file version mismatch [D01-F7]                                                                                      |
| No self-audit phase (only artifact checklist)                                         | **High**     | The most complex skill in the family lacks the systematic self-audit that website-analysis and repo-synthesis have [D08-F10]            |
| REFERENCE.md phase numbering stale                                                    | **High**     | Section 15 and agent allocation table use old phase numbering (pre-v4.0). SKILL.md is authoritative; REFERENCE.md is stale [D02-F4 gap] |
| No explicit convergence loop                                                          | **Medium**   | Creator View SHOULD self-verify exists but no formal CL with T20 tally [D08-F2]                                                         |
| Invocation tracking absent from SKILL.md                                              | **Medium**   | No `write-invocation.ts` call documented despite being MUST in website-analysis [D10-F8]                                                |
| "Substantial content" threshold missing in website-analysis sibling (cross-influence) | **Low**      | Above applies to website-analysis, noting here for completeness                                                                         |
| History Wave (Phase 3) agent types not documented                                     | **Low**      | REFERENCE.md §10 covers Dimension Wave but not History Wave agent identities [D03-F5 gap]                                               |

### website-synthesis Gaps

| Gap                                                                   | Severity     | Notes                                                                                                                                                            |
| --------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No self-audit phase (only artifact existence check)                   | **Critical** | Weakest data integrity mechanism in the family — synthesis outputs go unverified [D08-F10]                                                                       |
| No Phase 2.5 Verification Pass                                        | **High**     | Fabricated or poorly-supported themes can reach output unchanged — no T20 tally [D02-F3, D06-F4]                                                                 |
| No Warm-Up phase                                                      | **High**     | Users commit to synthesis without scope confirmation; repo-synthesis has this [D02-F2, D06-F6]                                                                   |
| No fit refresh against current SESSION_CONTEXT.md / ROADMAP.md        | **High**     | Candidates may be stale relative to sprint priorities that changed after analysis [D06-F3]                                                                       |
| Guard Rails section is 5-bullet summary; no REFERENCE.md section      | **High**     | Least guarded skill — no structured guard rails documentation [D08-F3 gap]                                                                                       |
| No empty artifact warning                                             | **Medium**   | Includes sites with thin data without warning user [D06-F2]                                                                                                      |
| No user checkpoint before synthesis (mid-flow confirmation)           | **Medium**   | Proceeds automatically after validation [D07-F4]                                                                                                                 |
| Retro not persisted to state                                          | **Medium**   | Retro response exists conversationally but has no state field [D06-F1 contradiction]                                                                             |
| Anchoring prevention not explicitly guarded in repo-synthesis sibling | **Medium**   | Note: anchoring prevention IS specified in website-synthesis; this gap is in repo-synthesis                                                                      |
| No anti-pattern candidate type                                        | **Medium**   | repo-synthesis inherits anti-pattern candidates from repo-analysis v4.2; website-synthesis has no equivalent "What's Worth Avoiding" at synthesis level [D06-F7] |
| No schema version checking on input artifacts                         | **Low**      | repo-synthesis checks `skillVersion`; website-synthesis checks only file presence [D10-F5]                                                                       |

### repo-synthesis Gaps

| Gap                                                     | Severity     | Notes                                                                                                                                                   |
| ------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No convergence scoring formula                          | **Critical** | "3+ repos" threshold with no weighting, no independence check, no confidence tier — significantly less rigorous than website-synthesis [D06-F6, D09-F2] |
| No source quality differentiation (all repos equal)     | **High**     | Original research repos and aggregator repos weighted identically — needs a tier system [D06-F7, D09-F2]                                                |
| Phase 2.5 split is incomplete                           | **Medium**   | Guard rails and compaction resilience moved to REFERENCE.md but Phase 2 SKILL.md still contains inline heuristics — incomplete migration [D01-F10]      |
| No thematic saturation stopping rule                    | **Medium**   | website-synthesis stops after 3 consecutive sites with no new themes; repo-synthesis has no stopping rule [D06-F5]                                      |
| No anchoring prevention guard                           | **Medium**   | Loading all repos in Phase 1 without explicit prohibition of reading-before-independence [D08-F11]                                                      |
| Invocation tracking not documented                      | **Low**      | website-synthesis explicitly shows bash command; repo-synthesis omits this [D10-F8]                                                                     |
| `version` key vs `schema_version` key in synthesis.json | **Low**      | Forward-compatibility requires alignment with website-synthesis [D05-F8]                                                                                |

---

## Convergence Design Spec: Concrete Recommendations

The following are actionable, prioritized recommendations for aligning the four
skills. Items are ordered: fix critical gaps first, then structural alignment,
then feature cross-pollination.

### Priority 1: Fix Critical Gaps (Do Now)

**1.1 Update repo-analysis REFERENCE.md §3.3 to reflect v4.2 candidate model.**
The documented v2.0 schema (single `extraction_candidates[]` with
`objective_score`/`personal_fit_score`) does not match runtime artifacts (4
typed arrays with `novelty`/`effort`/`relevance`). repo-synthesis consumes these
files — this gap creates silent failures. Update to document:
`patternCandidates[]`, `knowledgeCandidates[]`, `contentCandidates[]`,
`antiPatternCandidates[]` with the actual field schema from the real files.

**1.2 Update repo-analysis REFERENCE.md §3.2 findings.jsonl field name.**
`detail` → `description` to match actual runtime files.

**1.3 Sync repo-analysis REFERENCE.md to v4.2.** Bump REFERENCE.md from v4.0 to
v4.2. Update the phase numbering in Section 15 and agent allocation table to
match current SKILL.md phase numbers.

**1.4 Add self-audit phase to website-synthesis.** website-synthesis has the
weakest data integrity mechanism. Add a Phase 2.5 or pre-presentation self-audit
with at minimum: completeness check, schema contract verification, signal
detection section presence check. Adopt the T20 tally format from
repo-synthesis.

**1.5 Add convergence scoring formula to repo-synthesis.** The "3+ repos"
threshold alone is insufficient. Add a confidence formula and independence check
to REFERENCE.md Section 1. Minimum: define HIGH/MEDIUM/LOW thresholds. Evaluate
whether a repo quality tier system (analogous to T1-T4 for websites) is
appropriate.

### Priority 2: Structural Alignment

**2.1 Unify depth flag syntax to keyed format.** Update website-analysis to use
`--depth=standard`, `--depth=deep`, `--depth=quick` instead of `--standard`,
`--deep`. Update SKILL.md and REFERENCE.md. This aligns the user-facing
invocation pattern across both analysis skills.

**2.2 Unify synthesis.json top-level version key.** Change repo-synthesis
`version` to `schema_version` (matching website-synthesis). Update REFERENCE.md
§7 and any code that reads this field.

**2.3 Resolve cross-entity artifact path conflict.** Pick one canonical location
for `extraction-journal.jsonl`, `reading-chain.jsonl`, and `EXTRACTIONS.md` —
either `.research/` (root, as website-analysis intends) or
`.research/<skill-name>/` (as repo-analysis uses). Recommendation: root-level
`.research/` with a `source_type` discriminator field (website-analysis already
does this). Update repo-analysis SKILL.md and REFERENCE.md.

**2.4 Formalize the SKILL.md/REFERENCE.md split principle.** Add an explicit
"What belongs where" section to the REFERENCE.md of each skill (or a shared
skills-meta document). Use website-analysis's stated principle as the template.
Address: phase procedures (brief in SKILL.md, detailed in REFERENCE.md), guard
rails (currently inconsistent placement), routing menu (currently inconsistent
placement).

**2.5 Add "no silent skips" to Critical Rules of website-synthesis and
repo-synthesis.** This behavior exists in both synthesis skills but is not an
explicit Critical Rule. Align with website-analysis (Rule 6) and repo-analysis
(Rule 4).

### Priority 3: Feature Cross-Pollination

**3.1 Add Warm-Up phase to website-synthesis.** Before Phase 1, announce: site
count, candidate count estimate, selected paradigm, estimated duration, prior
retro feedback. Model on repo-synthesis SKILL.md lines 121-135.

**3.2 Add Phase 2.5 Verification Pass to website-synthesis.** After paradigm
synthesis (Phase 2) and before Signal Detection (Phase 3), add a lightweight
evidence verification pass. For each theme: confirm 3+ sites independently
support it. Produce a T20 tally. Model on repo-synthesis SKILL.md lines 232-239.

**3.3 Add retro persistence to all three non-repo-synthesis skills.** Add
`process_feedback` field to state schemas of website-analysis, repo-analysis,
and website-synthesis. Add retro prompt that saves response. Add replay of prior
feedback at session start (analysis skills in VALIDATE, synthesis skills in
Warm-Up / pre-Phase-1).

**3.4 Add self-audit phase to repo-analysis.** The most complex skill in the
family lacks the systematic self-audit others have. Add a pre-routing self-audit
phase with at minimum: completeness (all expected artifacts present), schema
drift detection (check `skillVersion` field matches expected), regression check
(finding count delta vs prior run), and REFERENCE.md contract verification.

**3.5 Add empty artifact warning to website-synthesis.** During VALIDATE / Phase
1 load: if a MUST artifact is present but has fewer than 10 lines or zero
candidates, warn "Synthesis value will be limited" before proceeding. Model on
repo-synthesis SKILL.md lines 112-114.

**3.6 Add anchoring prevention guard to repo-synthesis.** State explicitly in
Critical Rules: "Load all artifacts from all repos in Phase 1 before beginning
any synthesis. Do not read one repo's analysis and begin forming themes before
loading others." Model on website-synthesis Critical Rule.

**3.7 Add invocation tracking to repo-analysis and repo-synthesis.** Add
`write-invocation.ts` call in the Done routing option for repo-analysis and in
Phase 4 completion for repo-synthesis. Model on website-synthesis SKILL.md lines
251-255 (which shows the exact bash command format).

**3.8 Add thematic saturation stopping rule to repo-synthesis.** Add to Phase 2
Emergent Themes: "Stop adding themes when 3 consecutive repos (ordered by
scan_date) contribute no themes not already discovered." Store `saturation`
object in synthesis.json.

**3.9 Add schema version checking to website-synthesis.** During VALIDATE, check
`skillVersion` field in each `analysis.json`. If any site was analyzed with a
significantly older version, warn that synthesis capability may be limited.
Model on repo-synthesis REFERENCE.md §8, lines 411-415.

**3.10 Add Decision Coverage Map to repo-analysis, repo-synthesis, and
website-synthesis.** website-analysis REFERENCE.md's appendix mapping all design
decisions to their implementation location is the most useful navigability
feature in the family. Add equivalent appendices to the other three skills'
REFERENCE.md files.

---

## Serendipity Findings

**The cross-type synthesis schema is already partially aligned by design.**
website-synthesis REFERENCE.md Section 5 documents that both synthesis.json
files share `schema_version`, `synthesized_at`, `paradigm_output`, and `signals`
structure intentionally, for future forward compatibility. This cross-skill
design coordination is not visible from either skill alone — it only emerges
when both are read together [D06-F1 serendipity].

**repo-analysis is the only session-level integrated skill.** The
`research-index.jsonl` is documented as being read at "session-begin" — making
repo-analysis the only skill that surfaces prior work at the start of a new
session. If the website-analysis equivalent were implemented (a
`site-index.jsonl` at root `.research/`), both skills could contribute to a
unified research discovery surface at session start [D10-F3].

**The 0-byte Windows agent output bug workaround is copy-equivalent across both
analysis skills** — suggesting a deliberate backport of CLAUDE.md guardrail #15
rather than independent discovery. This is unusually precise cross-skill
coordination and a model for how behavioral rules should be enforced [D03-F5
serendipity].

**repo-synthesis tracks delegation in state.** The `follow_up_actions` field
includes a `delegated: boolean` flag — enabling audit of which decisions the
user delegated vs. decided themselves across sessions. This behavioral
accountability mechanism has no equivalent in the other three skills and could
be valuable for understanding skill usage patterns over time [D08-F3].

**Expedition mode is the most structurally novel UX pattern in the suite.** Its
3-file state pattern (meta.json = session metadata, snap.json = tree snapshot,
.jsonl = append-only event log) was inspired by Chromium's flat-list history
design and can reconstruct state even if snap.json is corrupted. This resilience
pattern could be adopted by any long-running multi-hop operation [D08-F3
serendipity].

**website-synthesis's formal convergence scoring treats citing sites as 1
source**, not 2. This independence verification — if a site A and site B both
cite site C, sites A and B count as 1 convergence point, not 2 — is a formal
epistemics protocol absent from repo-synthesis. The pattern matters anywhere
aggregator repos (awesome lists) could artificially inflate theme confidence
[D06-F6].

**The `content-eval.jsonl` schema is the cleanest JSONL schema across all four
skills** — minimal fields, well-defined, no score inflation:
`{category, name, url, relevance, applicability, home_connection}`. It could
serve as a template for simplifying other JSONL schemas across the family
[D05-F4 serendipity].

---

## Confidence Distribution

| Level      | Count | Sources                                                                                                                                                                                            |
| ---------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HIGH       | 112   | All 10 findings files — direct filesystem reads of canonical skill files                                                                                                                           |
| MEDIUM     | 5     | Budget/cost parameters (D08-F8), background vs foreground agent parameter (D03-F11), error message text exactness (D07-F7), artifact cleanup lifecycle (D05-F15), UX adoption candidates (D07-F14) |
| LOW        | 0     | —                                                                                                                                                                                                  |
| UNVERIFIED | 0     | —                                                                                                                                                                                                  |

**Overall confidence: HIGH.** All findings are sourced directly from filesystem
reads of canonical SKILL.md and REFERENCE.md files, with additional
cross-verification against actual runtime artifacts in
`.research/repo-analysis/`. No external sources, training-data assertions, or
inference was required.

---

## Source References

All sources are ground-truth filesystem reads.

### Analysis Skills

| ID  | Path                                           | Version | Lines |
| --- | ---------------------------------------------- | ------- | ----- |
| D01 | `.claude/skills/website-analysis/SKILL.md`     | v1.0    | 318   |
| D02 | `.claude/skills/website-analysis/REFERENCE.md` | v1.0    | 2,223 |
| D03 | `.claude/skills/repo-analysis/SKILL.md`        | v4.2    | 524   |
| D04 | `.claude/skills/repo-analysis/REFERENCE.md`    | v4.0    | 1,757 |

### Synthesis Skills

| ID  | Path                                            | Version | Lines |
| --- | ----------------------------------------------- | ------- | ----- |
| D05 | `.claude/skills/website-synthesis/SKILL.md`     | v1.0    | 290   |
| D06 | `.claude/skills/website-synthesis/REFERENCE.md` | v1.0    | 709   |
| D07 | `.claude/skills/repo-synthesis/SKILL.md`        | v1.2    | 331   |
| D08 | `.claude/skills/repo-synthesis/REFERENCE.md`    | v1.2    | 499   |

### Runtime Artifacts (ground truth for schema verification)

| ID  | Path                                                                      | Notes                           |
| --- | ------------------------------------------------------------------------- | ------------------------------- |
| R01 | `.research/repo-analysis/codecrafters-io-build-your-own-x/analysis.json`  | v4.2 runtime schema             |
| R02 | `.research/repo-analysis/codecrafters-io-build-your-own-x/findings.jsonl` | `description` vs `detail` drift |
| R03 | `.research/repo-analysis/codecrafters-io-build-your-own-x/value-map.json` | 4-typed-array vs spec           |
| R04 | `.research/repo-analysis/extraction-journal.jsonl`                        | Cross-repo schema               |
| R05 | `.research/repo-analysis/hkuds-cli-anything/trends.jsonl`                 | Trends actual schema            |

### Findings Sources

| ID           | Path                           | Dimension Covered                |
| ------------ | ------------------------------ | -------------------------------- |
| D01-findings | `findings/D01-architecture.md` | Architecture & file structure    |
| D02-findings | `findings/D02-phases.md`       | Phase design                     |
| D03-findings | `findings/D03-agents.md`       | Agent orchestration              |
| D04-findings | `findings/D04-scoring.md`      | Scoring models                   |
| D05-findings | `findings/D05-output.md`       | Output artifacts & schemas       |
| D06-findings | `findings/D06-synthesis.md`    | Synthesis skill design           |
| D07-findings | `findings/D07-ux.md`           | UX & interaction design          |
| D08-findings | `findings/D08-guardrails.md`   | Guard rails & resilience         |
| D09-findings | `findings/D09-duallens.md`     | Dual-lens / multi-perspective    |
| D10-findings | `findings/D10-integration.md`  | Integration & downstream routing |

---

## Methodology

**Research design:** 10 searcher agents, each assigned one dimension of
comparison. Each agent performed direct filesystem reads of all 8 skill files
plus runtime artifacts. No external sources, web searches, or training-data
assertions were used.

**Synthesis approach:** Cross-file themes were extracted by clustering findings
that address the same underlying concept across multiple sub-questions.
Contradictions were surfaced explicitly rather than silently resolved.
Confidence levels were not inflated — two agents finding the same claim
independently increased confidence; contradicting claims were held at MEDIUM.

**Verification:** Schema findings were cross-checked against actual runtime
artifacts in `.research/repo-analysis/` where available. website-analysis has no
runtime artifacts yet (skill not yet executed in this codebase) — those findings
rely on REFERENCE.md spec only.

**Depth:** L1 (Exhaustive). All 10 findings files read in full. All 8 skill
files read or summarized by dimension-specific searchers.

**Agents used:** 10 dimension searchers + 7 support agents (orchestration,
verification) = 17 total.
