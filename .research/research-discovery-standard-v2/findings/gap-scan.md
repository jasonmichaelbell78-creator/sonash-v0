# Gap Scan: Research-Discovery-Standard v2

**Agent:** orchestrator (inline scan) **Date:** 2026-04-04 **Phase:** 3.95
(mandatory scan)

## Scan Sources

1. D1-D8 findings gap sections (8 files, ~35 individual gaps)
2. Serendipity items (8 files)
3. REFUTED claims from V1 + V2 (7 total — handled in Phase 3.9)
4. CONFLICTED claims from V2 (2 total — handled in Phase 3.5)
5. LOW/UNVERIFIABLE claims (27 total — mostly design choices)
6. Unresolved questions from RESEARCH_OUTPUT.md Open Questions section
7. Contrarian MITIGATE recommendations (5 MODERATE challenges, C4-C8)
8. OTB SUPPLEMENT alternatives (A4 time-in-stage, A5 TF-IDF advisory)

## Consolidated Gap Inventory (deduplicated by keyword overlap)

### Category A: Research-Actionable Gaps (could benefit from more research)

| #   | Gap                                                       | Actionability                                          |
| --- | --------------------------------------------------------- | ------------------------------------------------------ |
| A1  | watchPaths capacity / directory support (Open Q 6, C2)    | HIGH — empirical test of Claude Code API               |
| A2  | SCOUT-SUMMARY.md peer-review agent design (C7 mitigation) | MEDIUM — could validate via academic/industry patterns |

### Category B: User-Decision Gaps (not researchable)

| #   | Gap                                                        | Why not researchable  |
| --- | ---------------------------------------------------------- | --------------------- |
| B1  | Tab naming: R&D vs Initiatives vs Pipeline                 | Subjective preference |
| B2  | Stall threshold value for A4 time-in-stage                 | Operator preference   |
| B3  | Tier assignment rules for /rnd projects (Open Q 5)         | Design choice         |
| B4  | CL override mechanism interface (Resolution 5 impl detail) | Design choice         |
| B5  | relatesTo fourth relationship type (Open Q 7)              | Design choice         |
| B6  | PARKED state history semantics                             | Design choice         |

### Category C: Deep-Plan Phase Gaps (deferred by design)

| #   | Gap                                                        | Why deferred                           |
| --- | ---------------------------------------------------------- | -------------------------------------- |
| C1  | Slug field explicit in V2 schema (Open Q 3)                | Schema design for deep-plan            |
| C2  | blocks/blocked_by extraction pass                          | Migration script implementation detail |
| C3  | Retroactive inference heuristic edge cases                 | Migration script refinement            |
| C4  | build-rnd.js 3-source join implementation                  | Dashboard tab implementation           |
| C5  | GSD project vs /todo separation                            | Integration planning                   |
| C6  | CL obligation tier scale values                            | Policy table calibration               |
| C7  | Schema version deprecation policy (C4 challenge)           | Future v2→v3 planning                  |
| C8  | Prompt-to-register mechanism (C5 challenge)                | Phase 3 enhancement                    |
| C9  | Reconcile whitelist vs CL skip-to-IMPLEMENT (C8 challenge) | Policy reconciliation                  |

### Category D: Already-Handled Gaps

| #   | Gap                            | Resolution                              |
| --- | ------------------------------ | --------------------------------------- |
| D1  | migrate-todos-v2.js existence  | Resolution 1 — reframed as prescriptive |
| D2  | D5 → D3 citation error         | Resolution 2 — corrected inline         |
| D3  | /todo write-guard gap          | Resolution 3 — added to corrections     |
| D4  | FileChanged provisional status | Resolution 4 — downgraded inline        |
| D5  | Pre-verified false positives   | Resolution 5 — refined heuristic inline |

## Gap Pursuit Decision

Per deep-research Critical Rule 9: "Gap pursuit is mandatory scan, conditional
execution. After challenges + disputes, scan all findings for gaps. Spawn gap
agents only if actionable gaps exist."

**Research-actionable gaps: 2 (A1, A2).**

- **A1 (watchPaths capacity):** This is an empirical Claude Code API feasibility
  check, not a research question. It requires either (a) a quick prototype test
  using the actual Claude Code SessionStart hook output, or (b) reading Claude
  Code source / issues. A research agent would have to search the same Claude
  Code docs that were already searched in D2. **Verdict:** Not a research gap —
  it's a prototype test gap. Document as a blocking prerequisite for deep-plan
  Step 1.

- **A2 (SCOUT-SUMMARY.md peer-review agent design):** This is a design question
  about whether a skeptic agent can simulate external peer review. Addressable
  via a brief targeted search on AI self-critique patterns. **Verdict:** Low-
  priority enhancement for D7 governance model; addressable during deep-plan
  Phase 3 design without requiring a dedicated gap agent now.

**Conclusion:** 0 actionable research gaps warrant a dedicated gap pursuit agent
round. All remaining gaps are user-decision, deep-plan phase, or already handled
via Phase 3.5/3.9 corrections.

**Skipping Phase 3.96 (gap verification) and Phase 3.97 (final re-synthesis)**
per Critical Rule 9: "Skip Phases 3.96-3.97 if 0 actionable gaps."

Proceeding to Phase 4 (Self-Audit).
