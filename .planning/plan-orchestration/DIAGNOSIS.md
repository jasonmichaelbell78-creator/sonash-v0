# Plan Orchestration: DIAGNOSIS

**Date:** 2026-03-23 **Task:** Sequence and prioritize all active plans for
execution

---

## ROADMAP Alignment

Meta-planning — aligns with all active work. Not a new feature, but a
coordination layer for existing plans.

## Active Plans Inventory

| Plan                              | Effort              | Status                 | Dependencies                            |
| --------------------------------- | ------------------- | ---------------------- | --------------------------------------- |
| **repo-cleanup**                  | M (60-75 min)       | Ready                  | None — cleans house for everything else |
| **custom-statusline**             | L (3-4 sessions)    | Ready                  | None — self-contained Go binary         |
| **cli-tools-implementation**      | L (multi-session)   | Approved, Phase 1 done | None                                    |
| **passive-surfacing-remediation** | M (1-2 sessions)    | Ready                  | None                                    |
| **propagation-research**          | M-L (4 waves)       | Ready                  | None                                    |
| **agent-environment-analysis**    | L (5 phases)        | Phase 1 research ready | Agent Teams SDK                         |
| **system-wide-standardization**   | XL (40-60 sessions) | DRAFT                  | CANON framework                         |

Also pending:

- **statusline-research/** — superseded, archive candidate (identified in
  repo-cleanup)

## Key Observation

Most plans have NO inter-dependencies. They can execute in any order or in
parallel. The exceptions:

- SWS is gated on CANON framework (not yet built)
- Agent-env-analysis depends on Agent Teams SDK working
- Repo-cleanup should go first (cleans up issues other plans would work around)

## Reframe Check

This is exactly what it appears: a meta-plan for execution ordering. The only
reframe consideration is whether this should be a simple priority list or a full
orchestration plan with session allocation. Given 7 active plans spanning S to
XL effort, a structured orchestration makes sense.
