# Brainstorm: Research & Discovery Standard (v2 supplement)

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-04
**Status:** Complete
**Routing:** deep-research (supplemental) → deep-plan
**Prior research:** [RESEARCH_OUTPUT.md](./RESEARCH_OUTPUT.md) (2026-03-24, L1, 18 agents)
**Prior plan:** [../../.planning/research-discovery-standard/PLAN.md](../../.planning/research-discovery-standard/PLAN.md) (DRAFT, to be adjusted)
<!-- prettier-ignore-end -->

---

## Problem Space

The original Research & Discovery Standard deep-research (2026-03-24) produced a
solid 4-tier model, unified confidence labels, and a Phase 0 MVS implementation
path. But the landscape has shifted significantly since then, and several
dimensions were either missing at the time or unexplored:

1. **The `/brainstorm` skill did not exist.** The original standard went
   straight to deep-research. Creative discovery before research is now a
   first-class step and must be integrated into the pipeline.
2. **`/deep-research` has evolved from ~v1.5 to v1.9** with gap pursuit, dispute
   resolution, verification agents, custom pipeline agents, and Windows output
   fallback — the original research may be partially stale on its own subject.
3. **R&D tracking mechanism was never designed.** Work moves from idea →
   brainstorm → research → plan → implementation → test, but nothing tracks this
   pipeline across projects or surfaces status.
4. **Outside source analysis stopped at conceptual level.** The original studied
   7 AI dev tools and 12 multi-agent frameworks at a descriptive level, but did
   not deeply analyze real repos (`/repo-analysis` v3.0 with Creator View didn't
   exist) or mine web sources for solo-creator R&D methodology.
5. **Cross-project findings flow is unsolved.** Findings in one research
   artifact should be able to "color" other projects without forcing
   re-research.

This brainstorm frames how to supplement the original work without discarding
it, and opens the path to a portable R&D lifecycle that feeds SoNash, the dev
dashboard, JASON-OS, and the SWS CANON ecosystem simultaneously.

## Anti-Goals

- **Ceremony that kills exploration joy.** A little over-engineering is fine,
  but process overhead that discourages use is failure.
- **Tracking overhead that discourages the pipeline.** If surfacing status
  becomes a chore, people stop using the pipeline.
- **SoNash-specific lock-in that blocks JASON-OS portability.** The R&D standard
  must be portable.
- **Re-research when findings already exist.** Research done once should flow to
  wherever it's relevant — no forced re-investigation.
- **Losing manual `/todo` operations.** Existing add/edit/complete/delete/
  reprioritize/archive flows must survive any schema evolution.
- **Artificial constraints on scouting.** No time caps, no repo count caps, no
  session caps on outside-source investigation.
- **UI design details.** Dev dashboard R&D tab visual design is out of scope for
  this brainstorm (integration point only).

## Landscape

**Existing R&D infrastructure (all confirmed present in this worktree):**

- **Original research:** `.research/research-discovery-standard/` — 18 agents,
  14 findings files, 4 challenge files, 10 design decisions, 6 open questions, 4
  unresolved tensions. Confidence HIGH on most internal findings.
- **Original plan (DRAFT):** `.planning/research-discovery-standard/PLAN.md` — 4
  phases, 27 decisions. Gated on SWS unblocking.
- **Dev dashboard plan:** `.planning/dev-dashboard/PLAN.md` — 6 tabs (Debt →
  Health → Reviews → Planning → Pipeline → Audits). **No R&D tab.**
- **Repo analysis v3.0:** 4 repos scanned (CLI-Anything, MemSkill, autoresearch,
  build-your-own-x). 21 extraction candidates. 0 extracted. Creator View exists.
- **Deep-research v1.9:** Now includes gap pursuit, dispute resolution, Phase
  2.5/3.5/3.9/3.95 verification passes, custom pipeline agents, Windows output
  fallback (guardrail #15).
- **Brainstorm skill v1.1:** Exists at `.claude/skills/brainstorm/`. As of this
  session's migration commit (`04ce6c77`), writes to `.research/<slug>/` instead
  of `.planning/<slug>/`.
- **Todo skill:** 19 active todos in `.planning/todos.jsonl`. Analysis reveals
  **nearly every todo is already an R&D project** with informal stage tracking
  in the `progress` text field.

**Data locations the R&D pipeline must watch:**

1. `.research/<slug>/` — research outputs
2. `.research/repo-analysis/<repo>/` — repo analyses (reusable form of research)
3. `.planning/<slug>/` — plans, decisions, diagnoses
4. `.research/<slug>/BRAINSTORM.md` — brainstorms (post-migration canonical
   location)

**Key insight from landscape:** The `/todo` skill is already a proto-R&D tracker
— stages are informally recorded in text fields. Formalizing this is far less
work than building a new skill from scratch.

## Directions Explored

Six directions were generated and explored during Phase 1 of this brainstorm.
Directions A and B collapsed into F during exploration when the `/todo`
connection was recognized.

### Direction A: Pipeline-First — New `/rnd` Skill (collapsed into F)

Build a standalone `/rnd` skill as an orchestrator for the R&D lifecycle.
**Collapsed:** The existing `/todo` schema and usage already represents what a
standalone `/rnd` skill would manage. Building parallel tooling would duplicate
the data model and split attention.

### Direction B: Data-Layer-First — Connect Existing Sources (collapsed into F)

Build connective tissue between research-index.jsonl, brainstorm state files,
deep-plan state files, todos.jsonl, extraction-journal.jsonl without a new
skill. **Collapsed:** Same reason as A — the aggregation layer and the
orchestration layer are both `/todo` with extensions.

### Direction C: CANON-Template-First — Portable Spec First (repositioned as Phase 4 of E)

Design the R&D ecosystem as a portable CANON specification before
implementation. SoNash implements the spec as the first consumer. JASON-OS
adopts the same spec with a different implementation.

**Vision:** The spec defines stages, data contracts, surfacing rules, and
outside-source integration protocol. The implementation is an expression of the
spec.

**Strengths:** Portable from day one. Produces the CANON category needed for
SWS. Template for other CANON categories.

**Weaknesses:** Abstract before tangible. May over-engineer. Delays the "I can
see my R&D threads" experience.

**Repositioning:** C is not a standalone direction — it is the endpoint of the
chosen direction. The spec is crystallized from validated experience, not
declared up-front.

### Direction D: Scout-and-Learn-First — Outside Sources Drive Design (phase of E)

Go deep on how other creators handle R&D pipelines before committing to an
implementation. Unconstrained scope — no caps on repos, time, or sessions.
Expands to include web research (articles, blog posts, talks, newsletter content
on solo-creator R&D methodology) in addition to `/repo-analysis` runs.

**Vision:** Analyze repos like Karpathy's autoresearch (already scanned),
MemSkill, ThePrimeagen, Simon Willison, George Hotz (tinygrad), and others
specifically for R&D process patterns — not just code. Combine with web research
on TRIZ, Design Thinking, Lean Startup, Toyota Kata, and indie hacker
build-in-public methodologies adapted for solo AI-assisted development.

**Strengths:** Evidence-based. Fills the creator-lens gap. Produces reusable
extraction candidates regardless of pipeline outcome. Anti-assumption.

**Weaknesses:** Time-unbounded by design — risk of scope drift if no discipline.
Findings may not translate to solo Claude Code context. Creator-lens analysis is
subjective.

### Direction E: The Phased Hybrid (CHOSEN)

Sequences F, D, and C into a phased plan rather than treating them as
alternatives. Each phase produces tangible output, CANON is earned from
experience, and the ordering respects the user's preference to ground design in
evidence before committing to implementation.

**Phases:**

```
Phase 0: Brainstorm (this session, complete)
   ↓
Phase 1: Supplemental deep-research
   - Fill gaps in original research using deep-research v1.9
   - Account for brainstorm skill integration
   - Verify original claims with gap pursuit + dispute resolution phases
   ↓
Phase 2: Scout outside sources (Direction D)
   - Unconstrained repo analysis (via /repo-analysis v3.0 Creator View)
   - Unconstrained web research (articles, blogs, frameworks)
   - Findings feed implementation design
   ↓
Phase 3: Implement /rnd via /todo evolution (Direction F)
   - Schema extension for stages, artifacts, findings_refs
   - 4-location watching with auto-advance
   - Retroactive migration of existing 19 todos
   - Preserve manual operations
   - Dev dashboard integration (tab or Planning extension)
   ↓
Phase 4: SWS CANON registration (Direction C)
   - Adjust existing research-discovery-standard PLAN.md content
   - Crystallize spec from validated implementation
   - Template for other CANON categories
   - JASON-OS portability handoff
```

**Strengths:** Sequences all insights coherently. Each phase has tangible
output. CANON earned not declared. Feeds SWS, dev dashboard, and JASON-OS
simultaneously. Respects the "no artificial constraints" principle.

**Weaknesses:** Long total timeline. Phase gates need clarity on "done."
Coordination across 4 phases is overhead.

### Direction F: Evolve /todo into the R&D Pipeline (component of E Phase 3)

The implementation mechanism for Phase 3 of E. The `/todo` schema extends to
track pipeline stages without replacing the existing skill.

**Schema additions:**

- `stage`: IDEA | BRAINSTORM | RESEARCH | PLAN | IMPLEMENT | TEST | COMPLETE
- `type`: PROJECT (full pipeline) | TASK (simple, skips stages)
- `artifacts`: typed pointers —
  `{brainstorm: path, research: path, plan: path, commits: [sha]}`
- `findings_refs`: references to research claims that "color" other projects
- `blocks` / `blocked_by`: explicit cross-links (already partially in text)

**Auto-advance:** A watcher (hook or on-demand script) detects when a canonical
artifact is written in any of the 4 watched locations and advances the linked
todo's stage. Session-begin and dev dashboard read the same JSONL source of
truth.

**Preserves:** All manual todo operations (add/edit/complete/delete/
reprioritize/archive) remain the primary interface. Auto-advance is
augmentation, not replacement.

**Strengths:** Single source of truth. Builds on proven data. Zero-cost
migration of the 19 existing todos (retroactive stage tagging). Solves
cross-project findings via `findings_refs`.

**Weaknesses:** UX bloat risk if PROJECT vs TASK modes aren't cleanly separated.
Schema versioning needed. Watcher complexity.

## Contrarian Assessment

The leading direction (E — Phased Hybrid) has real risks that must be
acknowledged:

**1. Phase 2 scouting could expand infinitely.** Unconstrained is the user's
explicit preference, but without discipline the scouting phase could become its
own multi-month project that never produces `/rnd`. Mitigation: gate criteria
for "scouting done" are themselves an open question for Phase 1 supplemental
research.

**2. Phase 4 CANON may never land.** SWS is currently BLOCKED on
plan-orchestration Waves 2-3, which are blocked on debt-runner expansion. If SWS
stays blocked, Phase 4 remains theoretical and JASON-OS portability arguments
weaken. Mitigation: Phase 4 can proceed as a standalone spec document even if
SWS CANON infrastructure is not yet available to register it.

**3. Direction F has hidden UX debt.** Simple todos (T15 "audit .gitignore") and
complex projects (T13 "research-discovery-standard") must coexist cleanly in one
interface. If the PROJECT mode bloats the TASK experience, quick capture stops
happening and a real workflow loss occurs.

**4. Scouting may produce diminishing returns.** The original research already
studied 19 external systems. Adding more may not reveal new patterns —
especially for well-understood areas like multi-agent frameworks. The creator
lens is where diminishing returns have NOT yet been reached, so Phase 2 should
prioritize that lens explicitly.

**5. Sequence assumption.** E assumes brainstorm → research → scout → implement
→ CANON is the right order. An alternative sequencing — ship a minimal `/rnd`
first, learn from using it, then scout based on what's actually missing — was
not chosen. The user's preference for evidence before commitment justifies the
chosen ordering, but this is a real design choice, not an obvious truth.

## Evaluation Summary

| Direction | Strengths                                                     | Weaknesses                                           | Feasibility |
| --------- | ------------------------------------------------------------- | ---------------------------------------------------- | ----------- |
| F         | Single source of truth; zero migration; proven data           | UX bloat risk; schema versioning; watcher complexity | HIGH        |
| C         | Portable; produces CANON; template for other CANON categories | Abstract; gated on SWS; may over-engineer            | MEDIUM      |
| D         | Evidence-based; fills creator gap; reusable extractions       | Time-unbounded; subjective; may not translate        | HIGH        |
| E         | Sequences all; tangible output per phase; CANON earned        | Long timeline; coordination overhead; gates unclear  | HIGH        |

## Chosen Direction

**Direction:** E — The Phased Hybrid (F + D + C sequenced over 4 phases)

**Rationale:** The hybrid sequences validation before commitment. Scouting and
supplemental research ground the `/rnd` implementation in evidence, and CANON
crystallizes from lived experience rather than theory, while respecting that
this work feeds SWS, the dev dashboard, and JASON-OS simultaneously. F and D
collapse into phases of E rather than competing with it. C repositions from a
starting point to an endpoint — the CANON spec is the crystallization of a
validated pattern, not a guess.

**Prerequisite completed:** Brainstorm artifact location migration
(`.planning/<slug>/BRAINSTORM.md` → `.research/<slug>/BRAINSTORM.md`) was
executed during this session (commit `04ce6c77`). All 4 existing brainstorms
migrated, all upstream/downstream references updated, DOCUMENTATION_INDEX.md
regenerated.

## Integration Points (must be referenced in Phase 3 plan)

- **Dev dashboard plan** (`.planning/dev-dashboard/PLAN.md`) — currently 6 tabs.
  Phase 3 must decide: add R&D as 7th tab, or fold R&D visibility into the
  existing Planning tab.
- **Existing research-discovery-standard PLAN.md** — Phase 4 adjusts existing
  content rather than replacing it. Do not discard the 27 decisions already
  captured.
- **SWS plan-orchestration** — Phase 4 CANON registration sequences into the SWS
  Phase 3 Step 3 flow. Currently blocked on debt-runner expansion.
- **JASON-OS RESEARCH_ROADMAP** — marks `research-discovery-standard` as
  HIGH-relevance existing work. Phase 4's portable CANON spec is the handoff to
  JASON-OS.
- **Brainstorm location migration** — prerequisite complete. All downstream
  phases assume `.research/<slug>/BRAINSTORM.md` as canonical.

## Open Questions for Phase 1 Supplemental Deep-Research

1. How should `stage` transitions work when shortcuts/off-ramps are taken?
   What's the state machine? Must handle: skip-stage, backtrack, parallel
   stages, branched projects.
2. What does the `findings_refs` pattern look like concretely? How does research
   in one project "color" another without re-research? What data shape, what
   lookup pattern, what surfacing mechanism?
3. How should the 4-location watcher work? Options: hook-based real-time,
   polling script at session-start, on-demand scan via `/rnd refresh`.
   Trade-offs on accuracy, latency, and reliability.
4. How do PROJECT items and TASK items share `/todo` UX without degradation?
   Must preserve quick-capture for simple items while enabling rich pipeline
   view for projects.
5. What's the auto-advance logic — when is an artifact "done enough" to advance
   the stage? File exists? File has specific sections? File has confidence
   metadata?
6. Dev dashboard integration — new R&D tab, or fold into Planning tab? What data
   visualizations make sense for the R&D pipeline view?
7. What does "scouting is done" look like? Gate criteria for Phase 2 to prevent
   unbounded drift without imposing artificial caps. Qualitative signals, not
   quantitative.
8. Which creator lenses translate to solo Claude Code context and which are
   cargo-cult risks? How to distinguish in advance?
9. What's the correct schema versioning strategy for the `/todo` JSONL
   extension? Migration path for the 19 existing todos without data loss.
10. How does the R&D pipeline handle the convergence-loop discipline already
    canonical in SoNash? Should CL be embedded as a stage verifier, a
    cross-cutting concern, or remain invoked separately?

## Routing

**Next:** `/deep-research "Research & Discovery Standard — supplemental gaps"`
with the 10 open questions above as sub-question seeds.

**After deep-research:** Direction D scouting phase — `/repo-analysis` on new
repos selected for R&D methodology depth + `/deep-research` with web profile on
solo-creator R&D workflows, frameworks, and methodologies.

**After scouting:** `/deep-plan` incorporating original research (2026-03-24),
supplemental research (Phase 1), scouting findings (Phase 2), and the chosen
direction into a phased executable plan that adjusts rather than replaces the
existing `.planning/research-discovery-standard/PLAN.md`.

---

## Session Context

- **Worktree:** `worktree-rnd4426` (based on `main` + merged `planning-4326` for
  repo-analysis v3.0 Creator View)
- **Brainstorm skill version:** 1.1
- **Deep-research skill version:** 1.9
- **Repo-analysis skill version:** 3.0
- **Migration commit:** `04ce6c77` (brainstorm location `.planning` →
  `.research`)
- **Brainstorm session duration:** Phase 0 through Phase 4 inclusive
- **Prior art consumed:** Original RESEARCH_OUTPUT.md (765 lines, 18 agents),
  existing PLAN.md (DRAFT, 27 decisions), dev dashboard PLAN.md, JASON-OS
  project memory, all 19 existing todos (T1-T19)
