# Plan Orchestration: DIAGNOSIS

**Date:** 2026-03-24 **Task:** Sequence and prioritize all active plans for
execution

---

## ROADMAP Alignment

Meta-planning — aligns with all active work. Not a new feature, but a
coordination layer for existing plans. 3 of 7 plans (repo-cleanup,
custom-statusline, cli-tools) have no ROADMAP entry — they are developer
tooling/hygiene meta-work.

## Active Plans Inventory (Research-Verified)

| Plan                              | Effort                       | Status                 | Steps              | Files Touched           | Dependencies                |
| --------------------------------- | ---------------------------- | ---------------------- | ------------------ | ----------------------- | --------------------------- |
| **repo-cleanup**                  | S (1 session, 60-90 min)     | Ready                  | 14                 | 26                      | None (benefits 5 others)    |
| **custom-statusline**             | L (3-4 sessions)             | Ready                  | 14                 | ~14 new                 | None (most isolated)        |
| **cli-tools-implementation**      | L (3-4 sessions)             | Approved               | 25 (8 phases)      | 14 modified + externals | PS session-start.js first   |
| **passive-surfacing-remediation** | M (1-2 sessions)             | Ready                  | 11 (33 violations) | 21                      | None (execute before SWS)   |
| **propagation-research**          | L (4 waves, ~17h)            | Ready                  | 14                 | 100+ (mass refactor W2) | No DECISIONS.md (7 open)    |
| **agent-environment-analysis**    | M (2-4 sessions remaining)   | Ph 1-3 DONE, Ph 4 next | 23 (5 phases)      | 50+                     | Agent Teams SDK (validated) |
| **system-wide-standardization**   | XL (80-130+ sessions, FLOOR) | Phase 0 done           | 21 (18 ecosystems) | Massive                 | agent-env ALL phases (HARD) |

## Research Context (from /deep-research L3, 22 agents)

### Central Finding

The scheduling problem is **trivially solved** — a "star graph with one heavy
leaf." Only 1 hard dependency (agent-env → SWS). SWS dominates by 20x. The only
decision that materially affects timeline: when does SWS start?

### Key Corrections to Original DIAGNOSIS

1. **CANON is NOT external** — built within SWS Step 1. "Gated on CANON" was
   misleading. SWS can start immediately after agent-env completes.
2. **SWS effort is 80-130+ sessions** — header said 40-60, stale. User confirms
   this is a floor (plan-for-making-plans, scope grows).
3. **agent-env Phases 1-3 already done** — only Ph 4-5 remain (2-4 sessions).

### Shared Resource Conflicts (5 HIGH/MEDIUM)

- `.husky/pre-commit` — 4 plans (PS → PR → AE → SWS)
- `.claude/hooks/session-start.js` — 3 plans (PS → CLI → AE)
- `.husky/pre-push` — 3 plans (PR → AE → SWS)
- `CLAUDE.md` — 3 plans (CLI → AE → SWS)
- `.claude/skills/alerts/SKILL.md` — 3 plans (PS → AE → SWS)

### Challenge Findings (must-address)

1. **Feature drought** — 171 sessions since "feature development unblocked,"
   zero features shipped. Schedule extends to 300+.
2. **SWS start timing tension** — prep-first vs early-start to discover scope.
3. **Second System Effect** — SWS matches Brooks's pattern. Needs scope gates.
4. **M1.6 at 75% complete** — lowest-hanging user-facing fruit (~5-8 sessions).
5. **Only 2 of 32 S0 items addressed** — propagation is the only S0-resolver.

### Proposed Schedule (from research)

Wave 0: repo-cleanup (1 session) → Wave 1a-1c: all non-SWS interleaved (5-8
sessions) → Wave 2: SWS CANON (6-10 sessions) → Wave 3: SWS Steps 2-21 (74-120+
sessions). Total: ~86-139+ sessions.

Full report: `.research/plan-orchestration/RESEARCH_OUTPUT.md`

## Reframe Check

Research confirms this is exactly what it appears: a meta-plan for execution
ordering. The reframe: the real scheduling question is simpler than expected
(trivially solved graph), but the strategic questions are harder than expected
(SWS scope management, feature drought, Meta Pipeline enforcement).

**Recommendation:** Proceed to discovery. Focus questions on the strategic
decisions the research identified but couldn't answer.
