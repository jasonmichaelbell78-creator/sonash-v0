# Research & Discovery Standard — DECISIONS

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-25
**Status:** ACTIVE
**Plan:** research-discovery-standard
**Session:** #238
**Questions Asked:** 23
**Decisions Captured:** 23 + 4 pre-decisions
**Research Input:** `.research/research-discovery-standard/RESEARCH_OUTPUT.md` (L1, 18 agents)
<!-- prettier-ignore-end -->

---

## Pre-Decisions (User-Approved Before Discovery)

| #    | Decision               | Choice                                                           | Rationale                                                            |
| ---- | ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| PD-1 | SWS sequence placement | Step 3 in D67 sequence (between Skills #2 and Hooks, now #4)     | Earliest non-disruptive. R&D spans skills, agents, teams, hooks.     |
| PD-2 | Tenet approach         | Expand T19 (`extensive_discovery_first`) to include tiered model | Open to edits after official CANON structure is set.                 |
| PD-3 | Model routing          | Sonnet default, Opus situational, Haiku out entirely             | Quality matters; use Opus when situation warrants, not by default.   |
| PD-4 | Governance level       | Full CANON-level governance. No cost concerns on quality.        | User directive: above-and-beyond with verifications and contrarians. |

---

## Discovery Decisions

### Batch 1: Architecture, Scope, Identity

| #   | Decision                    | Choice                                                                                          | Rationale                                                                                             |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| D1  | Ecosystem name              | `research-discovery` (key), "Research & Discovery" (display), "R&D" (prose)                     | Matches existing `.research/research-discovery-standard/` slug.                                       |
| D2  | Document set                | 3 docs: RDS-PROTOCOL.md, RDS-TOOLS+TEAMS.md, RDS-VERIFICATION+ENFORCEMENT.md                    | Separation of concerns: what / who / how-to-check. Per D80 full artifact structure.                   |
| D3  | Document location           | `.canon/ecosystems/research-discovery/`                                                         | CANON ecosystem artifacts belong under `.canon/`. Registered when ecosystem registry exists.          |
| D4  | Tier model                  | 4 tiers (T0-T3) with user override and approval prompts at all tiers                            | Cross-domain convergence on ~4 levels (SQ8). **Tiers are guidelines — user approves and can adjust.** |
| D5  | CL-PROTOCOL disposition     | Keep as protocol doc, move under R&D ecosystem governance. Not a skill.                         | Used across multiple plans, not user-invocable. General enough for R&D governance.                    |
| D6  | Artifact persistence format | JSONL (per T4). One file per CL run, appended per phase. Path: `.planning/<plan>/cl-runs.jsonl` | Per T4 `jsonl_first` and T2 `source_of_truth_generated_views`. Appendable, line-diffable.             |

### Batch 2: Behavior, Rules, Confidence

| #   | Decision                      | Choice                                                                                                              | Rationale                                                                                                |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| D7  | Confidence labels scope       | Unified labels (HIGH/MEDIUM/LOW/UNVERIFIED) with per-system assignment rules. Plan updates all 4 core systems.      | Per W5a-C4: forcing unified assignment is a category error. Each system assigns by its own criteria.     |
| D8  | T19 expansion wording         | Add tiered research structure to T19. Tier model is guideline, user approves and may adjust.                        | Adds structure without changing tenet's core meaning.                                                    |
| D9  | CLAUDE.md guardrail #15       | "Research before implementation in unfamiliar territory." Exclude dirs touched in last 5 sessions. T0/T1 invisible. | Per W4c Section 4C. Balances detection with low friction. "Beyond cutoff" applies to API questions only. |
| D10 | Hook-based research detection | Priority 5.5 in `user-prompt-handler.js`. Strong/phrase/weak keywords. Research replaces planning when both fire.   | Lightest-touch hook approach (~30 lines). Matches existing `suggestStderr` dedup pattern.                |
| D11 | Contrarian and verification   | **Verifications at ALL tiers (T0-T3).** Contrarians at T2+. T3 gets full contrarian + OTB.                          | User directive: above-and-beyond quality. Even T0 gets basic verification (source exists? recency OK?).  |

### Batch 3: Integration, Tools, Agents

| #    | Decision                        | Choice                                                                                                                                                                 | Rationale                                                                                                          |
| ---- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| D12  | Context7 deployment             | Add to ~9 agents: explore, plan, code-reviewer, security-auditor, frontend-developer, documentation-expert, test-engineer, dependency-manager, deep-research-searcher. | Agents that naturally benefit from library doc lookups. No value for non-research agents.                          |
| D12a | External resource investigation | Plan includes investigation step for additional MCP servers / external resources (Sequential Thinking MCP flagged as primary candidate).                               | User directive: investigate what else is available. Sequential Thinking MCP has zero invocations — worth trying.   |
| D13  | development-team.md             | Create definition file, mark experimental. Gate on controlled experiments. Teams need focused research.                                                                | Per W5a-C2: zero evidence of team value. Close compliance gap but don't assume effectiveness.                      |
| D14  | research-plan-team override     | Upgrade verifier to opus for T3 campaigns. Keep mixed model routing for T2.                                                                                            | Matches CL-PROTOCOL override pattern. T3 warrants highest-quality adversarial verification.                        |
| D15  | Tool selection enforcement      | MUST/SHOULD/MAY per tier. T2 MUST use multi-source, SHOULD use Context7, MAY use Sequential Thinking.                                                                  | Mandatory too rigid, advisory too loose for CANON governance. MUST/SHOULD/MAY gives structure with escape hatches. |
| D16  | .research/ schema               | Zod schema for metadata.json and research-index.jsonl. Validate on write. New files only — update existing only if non-breaking.                                       | Per T9 `crash_proof_state`. Schemas on machine-consumed files without over-structuring.                            |
| D17  | Pre-research duplicate check    | Check `research-index.jsonl` before any T2+ research. Git-tracked, works across both locales.                                                                          | Prevents duplicate campaigns. Episodic memory is local-only (per-machine), index is the right cross-locale source. |

### Batch 4: Implementation, Testing, CANON Registration

| #   | Decision             | Choice                                                                                                                                   | Rationale                                                                                                         |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| D18 | Health checker scope | 7 checks + retroactive compliance scan of existing artifacts with repair suggestions.                                                    | Standard CANON health checker pattern plus retroactive check. **Retroactive scanning is a CANON-global pattern.** |
| D19 | Enforcement manifest | 4 gates: pre-commit (confidence vocab), health checker (7+retroactive), code-reviewer (tier annotations), session-start (stale warning). | Multi-gate per T8 `automation_over_discipline`.                                                                   |
| D20 | Testing strategy     | 4 areas: hook detection (unit), Zod schemas (unit), health checker (integration), CL-PROTOCOL persistence (unit).                        | Hook and schema tests prevent regressions. Health checker confirms checker works. CL-PROTOCOL persistence is new. |
| D21 | D67 amendment        | Insert R&D as Step 3. All subsequent steps shift +1. Formal amendment DA-1 to SWS `decisions.jsonl`.                                     | Earliest non-disruptive placement. Approved by user 2026-03-25.                                                   |
| D22 | Maturity target      | L3 (Monitored) for Phase 3 Step 3. L4 in SWS Phase 4. L5 requires CANON Phase 1 infrastructure.                                          | Matches SWS progression pattern. L3 = protocol docs + health checker + enforcement manifest + monitoring.         |
| D23 | Effort estimate      | L (Large). 4-6 sessions. Front-loads protocol docs, confidence labels, hook detection. Back-loads CANON registration.                    | Comprehensive deliverable set across 3 protocol docs, 4 system updates, hooks, schemas, tests, health checker.    |

---

## Forward Findings

These findings affect other SWS ecosystems and should be captured for cross-plan
knowledge transfer.

| Source | Finding                                                                                               | Target Ecosystem/Phase                        |
| ------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| D13    | Teams need focused research to maximize value before standardization.                                 | SWS Phase 3 Step 12+ (Agents/Teams ecosystem) |
| D18    | Retroactive compliance scanning should be a CANON-global capability, not per-ecosystem.               | SWS Phase 1 (CANON Foundation)                |
| D19    | CANON needs a global enforcement layer running ALL ecosystem health checkers at each gate.            | SWS Phase 1 (CANON Foundation)                |
| D12a   | Sequential Thinking MCP and other external resources warrant investigation for research augmentation. | R&D implementation or future float work       |

---

## Tier Model Quick Reference (Per D4)

| Tier   | Name             | Visibility          | Verification (D11)                                    | Contrarian (D11) | Model (PD-3)                |
| ------ | ---------------- | ------------------- | ----------------------------------------------------- | ---------------- | --------------------------- |
| **T0** | Reflexive        | Invisible           | Source exists? Recency OK?                            | None             | Sonnet                      |
| **T1** | Quick Lookup     | One-line breadcrumb | Source exists + CRAAP >= 3 on primary source          | None             | Sonnet                      |
| **T2** | Focused Research | User approves plan  | CRAAP + SIFT + 2+ sources cross-ref + contradictions  | Contrarian pass  | Sonnet (Opus CL)            |
| **T3** | Full Campaign    | Full user gates     | All T2 + adversarial + cross-model + convergence-loop | Contrarian + OTB | Sonnet + Opus CL/contrarian |

**User override:** Tiers are guidelines. AI always presents tier assessment and
gets user approval before proceeding. User can adjust up or down at their
discretion.
