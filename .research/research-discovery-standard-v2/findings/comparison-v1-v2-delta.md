# Comparison: v1 (2026-03-24) vs v2 (2026-04-04)

**Agent:** deep-research-searcher (comparison mode) **Date:** 2026-04-04
**Purpose:** Delta analysis — what changed between the two research outputs

---

## Summary Metrics

| Metric               | v1                                                                             | v2                                                                 | Delta                                                                                   |
| -------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Sub-questions        | 10 (SQ1–SQ10 + W4a/W4b/W4c synthesis)                                          | 8 (SQ1–SQ8, labeled D1–D8)                                         | -2 top-level; synthesis wave replaced by direct design decisions                        |
| Claims/findings      | ~100 (14 findings files)                                                       | 112 across 8 files                                                 | +12 raw; scope shift makes direct count misleading                                      |
| Sources              | 100+ external + extensive internal                                             | 63 (22 Tier 1 codebase + 29 Tier 2 official + 12 Tier 3 community) | Smaller external count; significantly deeper internal codebase sourcing                 |
| Agent passes         | 18 (10 searchers + 4 external + 2 synthesizers + 2 contrarians + 2 OTB)        | 8 searchers only (no contrarian/OTB phase run)                     | No adversarial challenge agents in v2                                                   |
| Challenge documents  | 4 (contrarian-internal, contrarian-external, otb-alternative, otb-user)        | 0 (candidate challenge vectors documented but not executed)        | Challenge gap — acknowledged in v2 Challenges section                                   |
| Design decisions     | 10 (D1–D10) + 6 open questions                                                 | 8 (D1–D8 per sub-question) + 8 open questions                      | Scope shift: v1 decisions are architecture-level; v2 decisions are implementation-level |
| Synthesis waves      | 3 (W4a internal gap, W4b external-internal mapping, W4c standard architecture) | 0 (per-subquestion design tables replace synthesis wave)           | v2 integrates synthesis within each finding section                                     |
| Cross-cutting themes | 5 unresolved tensions documented                                               | 5 themes + 5 contradictions documented                             | Different taxonomy; v2 contradictions are more narrowly scoped                          |
| Overall confidence   | HIGH internal / MEDIUM-HIGH external / MEDIUM synthesis                        | HIGH overall (codebase-primary sourcing)                           | v2 higher internal confidence; less external landscape coverage                         |

---

## Net-New Claims in v2

### N1: /rnd pipeline as two orthogonal state dimensions (status + stage)

**v2 source:** SQ1/D1 (D1-F2) **Why not in v1:** v1 had no R&D pipeline tracking
concept at all. v1's focus was the research _methodology_ (tiers, quality gates,
confidence scales), not a tracking system for projects moving through the R&D
lifecycle. The brainstorm skill and the insight that `todos.jsonl` was already a
proto-tracker did not exist at v1 time. **Significance:** HIGH. This is the
architectural spine of what v2 is about. The claim that status and stage must be
orthogonal (not conflated) is a foundational design decision affecting schema,
UX, migration, and dashboard design simultaneously.

### N2: Guarded whitelist transition table as declarative data structure (not code logic)

**v2 source:** SQ1/D1 (D1-F4, D1-F11) **Why not in v1:** v1 did not address
pipeline state transitions. v1 architecture was about research quality gates
within a campaign, not lifecycle state across sessions/projects.
**Significance:** HIGH. The claim that allowed transitions are stored in
`.planning/rnd-config.json` (not embedded in skill logic) is a concrete
implementation decision with direct testability and auditability implications.

### N3: Append-only stage_history audit trail embedded in todo record

**v2 source:** SQ1/D1 (D1-F7) **Why not in v1:** v1 had no tracking artifact
concept. v1's CL-PROTOCOL artifact persistence was the closest analog, but that
was for verification records inside a planning session, not for cross-session
pipeline stage changes. **Significance:** MEDIUM-HIGH. The append-only
constraint and the specific schema (`from`, `to`, `at`, `by`, `skipped[]`,
`reason`) are new and have crash-recovery and audit implications.

### N4: FileChanged hook + watchPaths as auto-advance primary mechanism

**v2 source:** SQ2/D2 (D2-F1, D2-F2, D2-F3) **Why not in v1:** This is a Claude
Code native capability that v1 did not examine. v1's hook section (SQ6) focused
on research invocation triggers in `user-prompt-handler.js`, not on
file-state-change hooks for pipeline advancement. **Significance:** HIGH. The
dual-path architecture (lazy scan primary, FileChanged secondary) with explicit
Windows fs.watch debounce requirements is entirely new. The Windows-specific
requirements (100ms debounce, 1000ms ceiling, path normalization at every hook
boundary from `post-write-validator.js:117`) are implementation-critical.

### N5: "Done enough" L3 content checks for artifact presence detection

**v2 source:** SQ2/D2 (D2-F7) **Why not in v1:** v1 had no artifact-presence
detection concept. v1's quality gates were within a skill's execution, not
external to it. **Significance:** MEDIUM. The specific L3 thresholds
(BRAINSTORM.md size > 200 bytes AND contains('## '), RESEARCH_OUTPUT.md size >
1000 bytes, etc.) are concrete and immediately implementable.

### N6: findings_refs array with <slug>:<claim-id> stable addressing

**v2 source:** SQ3/D3 (D3-F1, D3-F10) **Why not in v1:** v1 did not address
cross-project findings flow. The brainstorm explicitly called this out as an
unsolved gap. v1's knowledge artifacts were siloed per-research-campaign.
**Significance:** HIGH. The `findings_refs` schema extension is a structural
innovation that enables research findings from one campaign to "color" active
projects without forcing re-research. The stable `<slug>:<claim-id>` addressing
and the three relationship types (informedBy/constrainedBy/contradicts) are
fully specified.

### N7: REFUTED claim propagation requirement

**v2 source:** SQ3/D3 (D3-F7) **Why not in v1:** v1 discussed confidence levels
but not what happens when a previously HIGH-confidence claim is downgraded. No
retraction propagation mechanism was designed. **Significance:** MEDIUM. The
95%+ post-retraction citation error rate from academic research provides an
evidence-based argument for why stale `findings_refs` must surface warnings.

### N8: capture-first (never block on type selection) as foundational UX principle

**v2 source:** SQ4/D4 (D4-F2, D4-F5) **Why not in v1:** v1 did not address
project tracking UX. v1's user-facing design concerned research invocation and
alert fatigue mitigation, not task-management capture flow. **Significance:**
MEDIUM. The GTD Inbox model (save first, type-last) and explicit "promote to
PROJECT is a subsequent action" pattern prevent UX bloat from impeding the
capture flow that already works in `/todo`.

### N9: /rnd as thin view-layer on shared todos.jsonl (not separate storage)

**v2 source:** SQ4/D4 (D4-F6) **Why not in v1:** v1 had no `/rnd` skill concept.
This architectural choice avoids sync state problems and is non-obvious without
first exploring Direction A (standalone skill) and B (data-layer) options.
**Significance:** HIGH. The explicit decision that `/rnd` shares `todos.jsonl`
rather than having its own backend prevents divergence bugs and keeps the data
model as a single source of truth.

### N10: Per-record schema_version integer migration using BaseRecord pattern

**v2 source:** SQ5/D5 (D5-F2, D5-F5, D5-F8) **Why not in v1:** v1 addressed
CL-PROTOCOL artifact persistence formats but did not touch JSONL schema
versioning. The observation that `scripts/reviews/lib/schemas/shared.ts` already
defines this pattern is a codebase-current finding. **Significance:**
MEDIUM-HIGH. The migration strategy (additive-only, Zod `.default()` for absent
fields, `migrate-todos-v2.js` script, `git checkout` as rollback) is a complete
and immediately actionable implementation path.

### N11: 7th standalone R&D dashboard tab (not folded into Planning)

**v2 source:** SQ6/D6 (D6-F4, D6-F6, D6-F9) **Why not in v1:** v1 mentioned the
dev dashboard as a future integration point but made no decision about tab
structure. The existing 6-tab plan was not examined in v1. **Significance:**
MEDIUM. The argument (distinct user intent, distinct data sources, new
stage-column kanban visualization) is well-grounded. The 3-source join
architecture (`build-rnd.js` joining todos + research metadata + plan metadata)
is concrete.

### N12: Saturation-based scouting stopping criteria (theoretical saturation + ≤5% threshold)

**v2 source:** SQ7/D7 (D7-F1, D7-F2, D7-F10) **Why not in v1:** v1 did not
address Phase 2 scouting governance because scouting was not a concept in the
original framework. v1's external research was bounded by sub-question scope,
not by saturation. **Significance:** HIGH. The ≤5% new-information threshold
(Hennig et al., PLOS ONE 2020) operationalizes a subjective judgment into an
auditable calculation. The Chesterton's Gate + Rogers' Five Factors + ADR
lifecycle exit artifact framework is a complete governance model for Phase 2.

### N13: AAER sustainability test for scale translation of external patterns

**v2 source:** SQ7/D7 (D7-F15) **Why not in v1:** v1's external landscape
section (SQ7a, SQ7b) evaluated transferability but relied on narrative analysis
rather than a formal filter. The AAER test ("if you removed the organizational
scaffolding, would this pattern still deliver value?") is a new tool.
**Significance:** MEDIUM. Provides a repeatable filter for any future external
pattern evaluation, not just scouting governance.

### N14: Skill-completed stages are pre-verified (conditional on CL state artifact presence)

**v2 source:** SQ8/D8 (D8-F8, with refinement from dispute-resolutions.md
Resolution 5) **Why not in v1:** v1 discussed CL-PROTOCOL independence from
convergence-loop (D3) but did not address how a pipeline orchestrator should
handle stages where the skill already ran convergence-loop internally. The /rnd
pipeline concept did not exist in v1. **Significance:** HIGH. Prevents ceremony
stacking: deep-research runs CL in Phase 2.5 + Phase 3; a naive /rnd pipeline
that also gates RESEARCH→PLAN transitions with CL would duplicate verification.
The refinement (claims.jsonl + V\*.md alone are insufficient — require CL state
artifact presence) closes a real false-positive failure mode.

### N15: Cross-cutting declarative-over-imperative theme confirmed across SQ1, SQ5, SQ8

**v2 source:** Cross-Cutting Theme 1 **Why not in v1:** v1 touched on
declarative transition tables in SQ8 (tiered complexity models) but did not
identify it as a unifying theme across state machines, Zod schemas, and CL
policy tables. v2's codebase-deep investigation made the convergence visible.
**Significance:** MEDIUM. Confirms SoNash tenets T17 and T5 have concrete
implementation anchors in the new design.

---

## Superseded Claims

### S1: Informal stage tracking in `progress` text field is the status quo

**v1 position:** Not explicitly stated; v1 had no tracking concept at all. **v2
position:** Explicitly identified and superseded by D4 (SQ4/D1-F). The ~15 of 20
active todos are already PROJECT-type items with stage implicitly encoded in
free-text `progress` field. The two-field formal model (`type` + `stage` with
`stage_history`) replaces this. [D5-F1, D4-F1] **Reason for change:** Codebase
inspection revealed the implicit tracking pattern; the brainstorm recognized the
extension path.

### S2: Citation of D3 as the CL-PROTOCOL independence decision

**v1 position:** v1's RESEARCH_OUTPUT.md at line 363 contains Decision D3
(CL-PROTOCOL stays independent from convergence-loop) — correctly numbered. **v2
position:** v2 SQ8 initially cited this as D5 in its synthesis, then issued a
formal correction in `dispute-resolutions.md` Resolution 2 to D3. [D8-F3,
dispute-resolutions.md R2] **Reason for change:** Internal citation error
discovered during dispute resolution phase. The underlying decision content is
unchanged; only the citation number was incorrect.

### S3: Phase 2 scouting governance was an open question

**v1 position:** Brainstorm explicitly listed "gate criteria for scouting done"
as an open question and flagged risk of Phase 2 becoming infinite.
[BRAINSTORM.md Contrarian Assessment item 1] **v2 position:** SQ7 fully resolves
this with a complete governance framework (saturation criteria, Chesterton's
Gate, Rogers Five Factors, ADR exit artifact, Category-Level Saturation Gate,
Phase-Level DONE criteria). [D7] **Reason for change:** SQ7 was scoped precisely
to answer this open question.

### S4: The "48% agent underuse" claim

**v1 position (original):** 48% of agents have no structured invocation pathway
[SQ3]. **v1 position (challenge-adjusted):** 11% are high-value without
triggers; 22% are retirement candidates [W5a-C1]. Already revised in v1 itself.
**v2 position:** Not re-examined. v2 focused exclusively on the /todo pipeline
extension, not agent inventory. The v1 challenge-adjusted position stands.
**Reason for change:** Not within v2's scope; this is a retained v1 claim.

### S5: Deep-research's own phases are the best internal reference for pipeline design

**v1 position:** Implicitly assumed the 4-tier tier model and deep-research
phases as the primary design vocabulary. **v2 position:** Explicitly elevates
deep-research's decimal sub-phase convention (3.5, 3.95, 3.97) as a directly
reusable pattern for the /rnd pipeline (inserting conditional stages without
renumbering). [D1-F9, Unexpected Finding 1] **Reason for change:** v2 examined
the deep-research pipeline at implementation depth for the first time, revealing
the decimal convention as a novel reusable primitive.

---

## Confirmed-Again Claims

### CA1: CL-PROTOCOL and convergence-loop must remain independent

**v1 source:** D3 in RESEARCH_OUTPUT.md (line 363) — "Keep independent." **v2
source:** D8-F3 — "CL-PROTOCOL (policy: which checks to run, when, which agents)
and /convergence-loop (execution: T20 tally machinery, state persistence) are
intentionally separate." Dispute-resolutions.md Resolution 2 explicitly traces
the independence decision back to v1 D3. **Strengthened by:** v2 examined both
skill files at implementation depth and confirmed the separation is structurally
grounded, not just a design preference.

### CA2: No polling daemons for artifact watching

**v1 source:** Implicit in SQ6 (hook approach limited to ~30 lines, Phase 1
only). **v2 source:** D2-F3 explicitly rejects polling. "Polling: Explicitly
rejected — Unnecessary overhead at solo-dev scale." **Strengthened by:** v2
confirmed lazy scan <5ms for 20 slugs on SSD; quantifies the non-problem.

### CA3: Graph databases and embedding-based retrieval are wrong for this scale

**v1 source:** W4b non-transfers list (Cursor/Windsurf persistent embeddings
rejected). **v2 source:** D3-F9 — "Triple stores are overkill at 800-claim
scale. JSONL with jq lookup is sufficient. No Neo4j, ArangoDB, or similar graph
infrastructure." **Strengthened by:** v2 provides a concrete scale figure (800
total claims across all research) justifying the rejection.

### CA4: Maximum 4 parallel agents per research wave

**v1 source:** D5 in v1 — "Max 4 parallel agents per wave (unchanged)." Grounded
in DeepMind coordination plateau finding. **v2 source:** Not directly
re-examined; v2 used 8 parallel searchers (one per sub-question) within the
deep-research skill's existing limits. **Strengthened by:** Usage in v2 confirms
the pattern in practice.

### CA5: JSONL-first (T4) and crash-proof state (T9) as correct persistence primitives

**v1 source:** Referenced indirectly through CL-PROTOCOL artifact persistence
(D4) and SWS tenet references. **v2 source:** Cross-Cutting Theme 4 (Minimal
Infrastructure, Maximum Compatibility) and D1-F14 explicitly confirm — "Stage
state embedded in todos.jsonl (the todo record IS the state file) satisfies T9
(crash-proof state)." **Strengthened by:** v2 grounded these tenets in specific
codebase patterns already in production.

### CA6: Research before implementation / behavioral enforcement as primary layer

**v1 source:** D8 (behavioral enforcement first) and proposed CLAUDE.md
guardrail #15. **v2 source:** CLAUDE.md guardrail #6 (acknowledgment-required
surfacing) confirmed in Cross-Cutting Theme 5. Session-begin digest with
acknowledgment-required pattern re-confirms the behavioral layer primacy.
**Strengthened by:** v2 adds a concrete implementation pattern (session-begin
findings_refs digest) that satisfies guardrail #6.

---

## Retained Open Questions (still unresolved)

### RQ1: Cross-model verification empirical value

**v1 source:** Unresolved tension — "Cross-model verification value: Models
share failure modes; agreement may be meaningless [W5a-C7F]. UNRESOLVED — needs
empirical data." **v2 status:** Not addressed. v2 focused on pipeline tracking
mechanics, not research methodology quality metrics.

### RQ2: Sequential Thinking MCP value

**v1 source:** "Zero invocations may mean native reasoning is sufficient
[W5a-C7C]. UNRESOLVED — try it in Phase 2 and measure." **v2 status:** Not
addressed. Still no invocations documented.

### RQ3: Baseline measurement of current research quality

**v1 source:** "No data on whether current deep-research outputs are good or bad
[W5a-C7B]. Needed before claiming the standard will improve things." **v2
status:** Not addressed. v2 produced outputs but no measurement framework
against a baseline.

### RQ4: Research volume risk from hook detection

**v1 source:** "Risk of research scope creep if volume increases with hook
detection and tier classification [W5a-C7G]." **v2 status:** Not addressed.

### RQ5: D67 amendment for R&D ecosystem (CANON placement)

**v1 source:** "Insert between Skills/Hooks (Option A) vs fold into Skills (B)
vs Step 22+ (C). User decision needed: YES." **v2 status:** Not explicitly
addressed in v2 (v2 focused on implementation mechanics, not CANON registration
sequencing). Deferred to Phase 4 of Direction E.

### RQ6: When to run team experiments

**v1 source:** "D4: Keep opt-in. Run 3-5 controlled team experiments first. User
decision needed: when to run." **v2 status:** Not addressed. v2 did not examine
team spawning patterns.

---

## New Open Questions (v2 only)

### NQ1: Retroactive stage inference heuristic for existing 19 todos

**v2 source:** Open Questions item 1 **Nature:** The 19 existing todos have
implicit stage encoded in free-text `progress` field. Should mapping be
manual-review or AI-assisted inference with confirmation? This is a concrete
implementation blocker for the migration.

### NQ2: /rnd SKILL.md menu design

**v2 source:** Open Questions item 2 **Nature:** The thin view layer needs a
formal skill definition. What pipeline-centric actions differentiate it from
`/todo`? What does the menu structure look like? Not designed in v2.

### NQ3: slug field as explicit vs derived field in V2 schema

**v2 source:** Open Questions item 3 **Nature:** The dashboard builder and
`findings_refs` both require a stable `slug`. Current heuristic derives slug
from `context.files` paths but may fail for edge cases. Should `slug` be a
mandatory explicit field in the V2 schema?

### NQ4: PARKED stage semantics and outgoing transitions

**v2 source:** Open Questions item 4 **Nature:** PARKED is proposed as a
non-terminal pause state with history-state semantics. The whitelist table
includes `PARKED → (to any prior stage, via history state)` but the concrete
outgoing entries and `returnAfter` field semantics are not specified.

### NQ5: Tier assignment for PROJECT-type todos

**v2 source:** Open Questions item 5 **Nature:** CL obligation level scales with
project tier (T0-T3 from v1 framework). How is tier set on a PROJECT-type todo?
Explicit field? Inferred from tags? This is a cross-doc dependency between the
v1 tier model and the v2 implementation.

### NQ6: watchPaths directory vs explicit file path support

**v2 source:** Open Questions item 6 — explicitly flagged as "not confirmed"
**Nature:** Whether Claude Code's `watchPaths` accepts directories (watching all
files within) or requires explicit file paths is unverified. 20 active slugs × 4
artifact paths = 80 entries; feasibility limit unknown. FileChanged hook
classified as "provisional secondary" pending this verification. This is a hard
blocker for the auto-advance implementation.

### NQ7: relatesTo as fourth findings_refs relationship type

**v2 source:** Open Questions item 7 and Contradictions table (D3-C1)
**Nature:** scite.ai data shows neutral "mentioning" is the most common citation
type. The three-type model (informedBy/constrainedBy/contradicts) may force
false categorization of loose connections. Adding `relatesTo` reduces cognitive
friction. User decision deferred.

### NQ8: R&D tab naming ("R&D" vs "Initiatives" vs "Projects")

**v2 source:** Open Questions item 8 **Nature:** Minor but a user decision
point. "Pipeline" is already taken by the build-pipeline hooks tab.

---

## Scope Differences

### v1 covered but v2 did not

| v1 Coverage Area                                                                                      | v1 Sub-question   | Notes                                                                                                    |
| ----------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------- |
| External AI development workflow landscape (Cursor, Windsurf, Devin, OpenHands, SWE-agent, Aider)     | SQ7a              | v2 had no external AI tool landscape analysis                                                            |
| Multi-agent research frameworks (CrewAI, STORM, GPT-Researcher, AutoGen, LangGraph, 12+ systems)      | SQ7b              | v2 had no multi-agent framework survey                                                                   |
| Tiered complexity models cross-domain (DAAO, model routing from other domains)                        | SQ8               | v2's SQ8 was CL integration, not cross-domain tier patterns                                              |
| Adversarial challenge passes (contrarian-internal, contrarian-external, OTB-alternative, OTB-user)    | W5a–W5d           | v2 documents candidate challenge vectors but ran 0 challenge agents                                      |
| SWS CANON integration assessment (L1 maturity, 16-item checklist)                                     | SQ10              | v2 defers CANON to Phase 4; no SWS maturity assessment                                                   |
| Agent inventory and utilization analysis (41 agents, model distribution, underuse)                    | SQ3               | v2 did not re-examine agent inventory                                                                    |
| Hook-based natural invocation detection (user-prompt-handler.js analysis)                             | SQ6               | v2's SQ2 covered file-change hooks for pipeline advance, not research-invocation hooks                   |
| Convergence verification system audit (convergence-loop patterns, composability)                      | SQ9               | v1 studied verification patterns broadly; v2 studied CL integration specifically within /rnd             |
| Tool utilization analysis (Sequential Thinking MCP, Memory Knowledge Graph, Chrome Superpowers)       | SQ5               | v2 did not re-examine tool utilization across the full inventory                                         |
| External landscape — what does NOT transfer (persistent embeddings, git worktrees, full desktop envs) | W4b non-transfers | v2 confirmed a few rejections (graph databases, auto-propagation) but no systematic non-transfer catalog |

### v2 covered but v1 did not

| v2 Coverage Area                                                                                   | v2 Sub-question     | Notes                                                                                             |
| -------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| /rnd pipeline state machine design (two-axis model, guarded whitelist, FSM primitives)             | SQ1/D1              | Entirely new concept                                                                              |
| Auto-advance architecture (FileChanged hook, lazy scan, Windows fs.watch requirements)             | SQ2/D2              | Entirely new concept                                                                              |
| Cross-project findings flow (findings_refs schema, stable addressing, retraction propagation)      | SQ3/D3              | Identified as gap in brainstorm; no v1 coverage                                                   |
| /todo UX split (PROJECT vs TASK, capture-first, progressive disclosure limits)                     | SQ4/D4              | Entirely new concept                                                                              |
| todos.jsonl schema versioning (per-record version, additive migration, Zod defaults)               | SQ5/D5              | New (v1 touched artifact persistence formats but not todo schema migration)                       |
| Dev dashboard R&D tab decision (7th tab, builder architecture, cross-tab links)                    | SQ6/D6              | New (v1 mentioned dashboard as integration point only)                                            |
| Phase 2 scouting governance framework (saturation, Chesterton's Gate, Rogers, ADR exit artifacts)  | SQ7/D7              | New (emerged from brainstorm open question)                                                       |
| Convergence-loop integration across the /rnd pipeline stages (skill-completed stages pre-verified) | SQ8/D8              | New (v1 D3 established CL independence; v2 D8 specifies how pipeline interacts with CL per-stage) |
| Current codebase state verification (todos.jsonl, render-todos.js, migration scripts, hook files)  | All SQs             | v2 includes current-state-assessment section; v1 had no equivalent ground-truth verification      |
| Brainstorm skill integration into the R&D pipeline                                                 | BRAINSTORM.md input | brainstorm skill did not exist at v1 time                                                         |

---

## Conclusion

**What v2 is:** An implementation-depth supplement. v1 was a methodology
research (what should the research standard look like?). v2 is a design
specification (how should the /rnd tracking pipeline be built?). The two outputs
answer different questions — they are additive, not competitive.

**The most significant delta** is the entire /rnd pipeline concept: state
machine (D1), auto-advance (D2), findings flow (D3), UX split (D4), schema
migration (D5), dashboard (D6), scouting governance (D7), and CL integration
(D8). None of these 8 sub-questions had any counterpart in v1. They emerged
directly from the brainstorm's observation that `/todo` was already a
proto-tracker and that cross-project findings flow was unsolved.

**What v1 established that v2 assumes:** The 4-tier research model, unified
confidence labels, CL-PROTOCOL independence (D3 = v1's D3), behavioral
enforcement primacy, Phase 0 MVS approach, and the JSONL-first/T4/T9 tenets. v2
references these as settled and builds on top of them.

**The confidence asymmetry:** v1's HIGH confidence rested on extensive external
validation (100+ external sources, adversarial challenge passes). v2's HIGH
confidence rests on direct codebase inspection (22 Tier 1 ground-truth sources)
but skipped the challenge pass. The adversarial gap in v2 means N14
(skill-completed stages pre-verified), N9 (/rnd as thin view layer), and N6
(findings_refs manual registration) carry unvalidated assumptions that would
benefit from a contrarian pass before implementation.

**Key unresolved dependency between v1 and v2:** NQ5 (tier assignment for
PROJECT-type todos) is a cross-doc dependency. v1's 4-tier model specifies CL
obligations per tier; v2's CL integration (D8) references T0-T3 but does not
specify how a PROJECT-type todo gets its tier assigned. This gap sits precisely
at the seam between the two research outputs.

---

## Confidence Assessment

- HIGH claims: 12 (N1, N2, N4, N6, N9, N12, N14, CA1–CA6)
- MEDIUM-HIGH claims: 4 (N3, N7, N10, N11)
- MEDIUM claims: 6 (N5, N8, N13, N15, S1, S2)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH (all claims grounded in specific document sections
  with cited IDs)
