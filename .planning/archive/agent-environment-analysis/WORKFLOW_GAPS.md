# Workflow Gap Analysis

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Status:** ACTIVE
**Source:** Session #225, Phase 1 Step 1.2 (gap-analyst)
<!-- prettier-ignore-end -->

## Executive Summary

**Analysis Period:** Session #225 (2026-03-17) **Data Sources:**
invocations.jsonl (27 records), SESSION_CONTEXT.md, SESSION_HISTORY.md, 64
skills, CLAUDE.md Section 7

**Key Finding:** Agent ecosystem has strong platform coverage (convergence-loop,
deep-plan, skill-audit integrated), but **7 high-impact gaps** where
existing/new agents could eliminate manual effort totaling ~360-675 min/month
(10-18 hours).

---

## Invocation Pattern Mining

### Skill Usage (invocations.jsonl)

- **pr-review**: 14/27 (52%) — User + self-triggered cycles
- **skill-audit**: 6/27 (22%) — Interactive auditing
- **pr-retro**: 4/27 (15%) — User + internal trigger
- **deep-plan**: 1/27 (4%) — Agent-environment topic
- **hook-ecosystem-audit**: 1/27 (4%) — Manual scan

### Time Clustering

- 2026-03-01: 12 pr-review invocations (PR #407, 8-round convergence cycle)
- 2026-03-08, 2026-03-11, 2026-03-16: skill-audit cluster (capacity building)
- 2026-03-16: Shift to ecosystem work (deep-plan + agent-environment topic)

### Critical Absences (Zero Invocations)

- security-auditor (exists, mandate in CLAUDE.md)
- code-reviewer (POST-TASK mandate, not tracked)
- systematic-debugging (PRE-TASK mandate, no usage)
- Explore/Plan agents (CLAUDE.md triggers)
- Team/parallel orchestration (found in SESSION_CONTEXT, not invocations.jsonl)

---

## Gap Detection (CLAUDE.md Section 7 vs Reality)

### PRE-TASK Trigger Gaps

| Trigger          | Expected             | Found                              | Gap Type                    |
| ---------------- | -------------------- | ---------------------------------- | --------------------------- |
| Planning (XL)    | deep-plan            | 1/27                               | **UNDERUSED**               |
| Bug/error        | systematic-debugging | 0/27                               | **MISSING**                 |
| Code exploration | Explore agent        | 0/27                               | **MISSING**                 |
| Multi-file (3+)  | Team                 | 0/27 (GSD in SESSION_CONTEXT only) | **MISSING FORMAL DISPATCH** |

### POST-TASK Trigger Gaps

| What You Did | Expected           | Found         | Impact                                                   |
| ------------ | ------------------ | ------------- | -------------------------------------------------------- |
| Code mods    | code-reviewer      | 0 invocations | **CRITICAL** — pre-commit hook may bypass formal logging |
| Test suite   | test-suite --smoke | 0 invocations | **MISSING** — 9 PRs merged without visible tests         |

### Root Causes

1. **code-reviewer tracking:** Mandate exists, pre-commit hook likely calls it,
   but formal invocation not logged (no audit trail)
2. **deep-plan underuse:** 4 sessions with 21-44 decisions skipped deep-plan
   (Sessions #224: 44, #223: 21, #217: 35, #216: 17 decisions)
3. **Team orchestration:** Sessions #223-224 used 7-13 parallel gsd-\* agents
   (GSD framework), but coordination is ad-hoc
4. **systematic-debugging:** No error-heavy sessions in dataset — low demand but
   enforcement point missing
5. **Skill quality:** skill-creator asks good questions but no gate prevents
   <75/100 quality skills from circulating

---

## 7 High-Impact Gaps (Prioritized)

### Gap #1: code-reviewer Invocation Tracking [HIGH — 100-150 min/month]

**Current Cost:** 10-15 min/session (affects 10+ sessions/month) **Solution:**
Wire pre-commit hook's code-reviewer through write-invocation.ts (formal
logging)

### Gap #2: deep-plan Underutilization [HIGH — 120-240 min/month]

**Current Cost:** 30-60 min/session (affects 4 XL sessions/month, currently 1/4
use deep-plan) **Solution:** SESSION_CONTEXT.md "Next Session Goals" includes XL
heuristic + prompt to run `/deep-plan {topic}` if scope >10 items

### Gap #3: Team Orchestration (GSD→Formal) [MEDIUM — 60-120 min/month]

**Current Cost:** 20-30 min/session (3-4 parallel-heavy sessions/month)
**Solution:** `/team-dispatch` skill: takes roster + work items, parallelizes
with formal CL convergence checking

### Gap #4: Skill Quality Gate [MEDIUM — 20-45 min/month]

**Current Cost:** 10-15 min/skill (2-3 new skills/month), rework loop
**Solution:** skill-creator Phase 5: "Quality score {N}/100. If <75, revise."

### Gap #5: Convergence-Loop Audit-Skill Routing [MEDIUM — 5-10 min ongoing]

**Current Cost:** Uncertainty about finding stability (which audits converge?)
**Solution:** skill-audit Category 11 + audit-skill-routing.md (maps each skill
to CL requirement)

### Gap #6: Deferral Tracking [MEDIUM — 40-90 min/month]

**Current Cost:** 20-30 min/session (2-3 sessions/month with deferrals), silent
loss of items **Solution:** `/debt-runner` add `track-deferrals` mode (reads
DECISIONS_BY_PHASE deferred items, alerts if stale >30d)

### Gap #7: Systematic-Debugging Wire [LOW — 15-20 min/month]

**Current Cost:** 15-20 min per error (rare, ~1/month) **Solution:**
Error-handler hook detects error class + invokes
`/systematic-debugging {context}`

---

## T20 Convergence Tally

| Pass | Confirmed          | Corrected                           | Extended              | New                             |
| ---- | ------------------ | ----------------------------------- | --------------------- | ------------------------------- |
| 1    | 27 records         | origin refined                      | time-clustering + GSD | shift pattern                   |
| 2    | 7 triggers         | security-auditor deferred by design | root causes           | GSD + TDMS + quality            |
| 3    | CL platform strong | GSD deliberate                      | 7 gaps prioritized    | team-dispatch + deferral + gate |

**Convergence:** HIGH confidence. 7 gaps + root causes + solutions.

## Impact Summary

**Total Estimated Savings:** 360-675 min/month (~10-18 hours) **Highest-ROI
Gaps:** #1 (code-reviewer), #2 (deep-plan) = 220-390 min/month
