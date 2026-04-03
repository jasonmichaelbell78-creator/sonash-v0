# Findings: Scheduling Theory Applied to Plan Orchestration

**Searcher:** deep-research-searcher (scheduling theory specialist) **Profile:**
web + academic **Date:** 2026-03-24 **Sub-Question IDs:** S-14 (L3 scheduling
theory investigation) **Inputs:** S-01 through S-13 findings, web research on
scheduling algorithms

---

## 1. Algorithm Survey

### 1.1 Algorithms Evaluated

| Algorithm                                                   | Description                                                                                                                                                                                               | Applicability | Strengths                                                                                                                         | Weaknesses                                                                                                                                                 | Fit for Our Problem                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Critical Path Method (CPM)**                              | Identifies longest dependency chain; calculates earliest/latest start times and float for all activities                                                                                                  | HIGH          | Simple, well-understood. Identifies bottleneck chain. Calculates float precisely.                                                 | No resource constraints. Assumes unlimited parallelism. No shared-resource conflict modeling.                                                              | **GOOD for baseline analysis.** Already applied in S-09 (critical path = 82-133 sessions). Useful for identifying that SWS dominates and agent-env is the only gate. Does NOT address shared file conflicts.                                                                                                                                        |
| **Coffman-Graham Algorithm**                                | Schedules jobs with precedence constraints onto W identical processors, minimizing makespan. Uses topological sort + level-based assignment.                                                              | MEDIUM        | Optimal for W=2 processors with unit-time tasks. Within 2-2/W factor of optimal for W>2. Linear time implementation.              | Assumes unit execution times. Tasks must have equal duration. Does not model shared resources. Not designed for variable-duration tasks.                   | **POOR direct fit.** Our tasks have wildly variable durations (1 session for repo-cleanup vs 80-130 for SWS). The algorithm assumes unit execution time (UET), which is violated. The algorithm would treat SWS the same as repo-cleanup, which is nonsensical.                                                                                     |
| **Hu's Algorithm**                                          | Schedules UET tasks with tree-structured precedence constraints on m processors. Assigns by longest-chain-first priority.                                                                                 | LOW           | Optimal for tree-structured DAGs with UET. Simple greedy approach.                                                                | Requires tree-structured precedence (no DAG support). Requires unit execution times. No resource constraints.                                              | **POOR fit.** Our DAG is not a tree (multiple independent roots). Tasks are not UET. Algorithm is too restrictive for this problem.                                                                                                                                                                                                                 |
| **RCPSP (Resource-Constrained Project Scheduling Problem)** | NP-hard optimization: schedule activities with precedence constraints and renewable resource limits, minimizing makespan. Solved via heuristics (GA, SA, PSO) or priority-rule-based serial/parallel SGS. | HIGH          | Models both precedence AND resource constraints. Directly addresses shared resource conflicts. Rich heuristic literature.         | NP-hard -- overkill for 7 tasks. Metaheuristic approaches (GA, SA) designed for 30-120+ activity instances. Setup cost exceeds benefit for tiny instances. | **THEORETICALLY correct but PRACTICALLY overkill.** Our problem has only 7 activities and 5 shared resources. RCPSP machinery is designed for hundreds of activities. The overhead of formulating the problem exceeds the benefit. However, the RCPSP _conceptual framework_ (precedence + resource constraints) is exactly the right mental model. |
| **List Scheduling with Priority Rules**                     | Orders activities by priority (LPT, SPT, MTS, MIS), then greedily assigns to available processors/time slots respecting precedence and resource constraints.                                              | HIGH          | Simple. Fast. Flexible priority rules. Works with variable task durations. Adaptable to any number of processors.                 | Heuristic -- no optimality guarantee. Performance depends heavily on priority rule chosen.                                                                 | **GOOD practical fit.** Simple enough for 7 tasks. Priority rules (LPT = Longest Processing Time first, MTS = Most Total Successors first) can be combined. The LPT rule would prioritize SWS and agent-env -- exactly correct for our problem.                                                                                                     |
| **Resource Leveling**                                       | Adjusts start/finish dates to balance resource demand within available supply. Does not change scope, changes timing.                                                                                     | MEDIUM        | Smooths workload. Prevents over-allocation. Uses float to shift non-critical activities.                                          | May extend total project duration. Requires accurate resource availability data.                                                                           | **PARTIALLY applicable.** Useful concept for smoothing: don't try to run 5 plans simultaneously if you're a solo developer. But with 1 developer, "leveling" reduces to "pick one task per session" -- the concept becomes trivial.                                                                                                                 |
| **Resource Smoothing**                                      | Like leveling, but with a fixed deadline. Redistributes work within available float without extending total duration.                                                                                     | MEDIUM        | Maintains deadline. Reduces peak demand. Uses float intelligently.                                                                | Cannot resolve true resource conflicts (only shifts timing within float).                                                                                  | **APPLICABLE conceptually.** Non-SWS plans have 80+ sessions of float. Smoothing means spreading them across sessions to avoid overload, which naturally happens when a solo developer picks one thing per session.                                                                                                                                 |
| **Topological Sort (Kahn's / DFS)**                         | Produces a linear ordering of all nodes in a DAG such that every edge (u,v) has u before v. Foundation for all precedence-based scheduling.                                                               | HIGH          | Identifies valid execution orderings. Detects cycles. O(V+E) time. Natural wave decomposition when extended with level detection. | Does not optimize -- just produces _a_ valid order. Many valid orderings exist. No resource modeling.                                                      | **FOUNDATIONAL.** Already implicitly used in S-09 wave analysis. Topological sort of our DAG produces the wave structure. Adding level detection (BFS layers) gives the natural wave decomposition.                                                                                                                                                 |
| **Rolling Wave Planning**                                   | Plan in detail for near-term waves; plan at high level for future waves. Refine as you go.                                                                                                                | MEDIUM        | Handles uncertainty. Adapts to new information. Natural fit for iterative/agile workflows.                                        | Less predictable total duration. Requires ongoing re-planning.                                                                                             | **GOOD for execution strategy.** Our problem has uncertainty (SWS is 80-130 sessions -- 50-session range). Rolling wave planning acknowledges this: plan Wave 0-1 in detail, plan SWS waves at high level, refine as SWS progresses.                                                                                                                |
| **Shifting Bottleneck Heuristic**                           | Sequences resources one at a time, always picking the current bottleneck resource. Re-optimizes after each assignment.                                                                                    | LOW-MEDIUM    | Good for job-shop problems with multiple bottleneck machines. Identifies which resource to focus on.                              | Designed for manufacturing job-shop (many jobs, few machines). Our "machines" are shared files, not processors.                                            | **CONCEPTUALLY interesting but impractical.** The bottleneck in our system is not a shared file -- it's SWS's sheer duration. The bottleneck is structural (1 massive task), not resource-based.                                                                                                                                                    |

### 1.2 Algorithm Selection Summary

| Category                           | Best Algorithm(s)                | Why                                                                                                                                  |
| ---------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Baseline analysis**              | CPM                              | Already applied. Confirms critical path = agent-env -> SWS.                                                                          |
| **Wave decomposition**             | Topological Sort with BFS levels | Already applied in S-09. Gives 3-4 wave structure.                                                                                   |
| **Priority ordering within waves** | List Scheduling with LPT + MTS   | Assigns priority: agent-env (critical path, most successors) > passive-surfacing > propagation > cli-tools > custom-statusline.      |
| **Shared resource conflicts**      | RCPSP conceptual model           | Model shared files as renewable resources with capacity 1. But solve by hand -- the instance is too small for algorithmic machinery. |
| **Execution strategy**             | Rolling Wave Planning            | Plan Wave 0-1 in detail. Adapt SWS as it progresses.                                                                                 |

---

## 2. Best-Fit Analysis

### 2.1 Problem Characteristics

Our scheduling problem has the following specific characteristics that determine
algorithm fit:

| Characteristic             | Value                                                                                 | Implication                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Number of activities**   | 7 plans (decomposable to ~15 phases)                                                  | Too small for metaheuristics. Manual/heuristic solution is feasible.                                  |
| **Dependency depth**       | 1 hard dependency (agent-env -> SWS)                                                  | Shallow DAG. Most algorithms designed for deeper graphs.                                              |
| **Task duration variance** | 100:1 ratio (SWS 80-130 sessions vs repo-cleanup 1 session)                           | Extreme variance. Algorithms assuming UET (Coffman-Graham, Hu's) are disqualified.                    |
| **Dominant task**          | SWS = ~85% of total effort                                                            | Problem is bottleneck-dominated. Scheduling the other 6 tasks is almost irrelevant to total duration. |
| **Processors**             | 1 (solo developer)                                                                    | "Parallelism" = interleaving across sessions, not true simultaneous execution.                        |
| **Shared resources**       | 5 critical files (session-start.js, pre-commit, pre-push, CLAUDE.md, alerts SKILL.md) | Mutex constraints on concurrent modification. Modeled as renewable resources with capacity=1.         |
| **Workflow unit**          | 1 session = 1 unit of work                                                            | Discrete, human-paced. Not continuous-time optimization.                                              |

### 2.2 Why Most Formal Algorithms Are Overkill

**The fundamental insight:** When one task dominates total effort by 20:1, the
scheduling problem degenerates. The critical path is:

```
agent-env P4-5 (2-4 sessions) --> SWS (80-130 sessions) = 82-134 total
```

All 6 non-SWS plans combined take ~13-19 sessions. Even if they were ALL on the
critical path (they are not), they would add only 15-20% to total duration.
Since most have 80+ sessions of float, their scheduling is almost irrelevant to
project completion time.

**The optimization opportunity is narrow:** The only scheduling decision that
materially affects total project duration is: _"When does SWS start?"_ This is
gated solely by agent-env completion. Everything else is float management.

### 2.3 Best-Fit: Hybrid Approach

The best-fit algorithm for this specific problem is a **hybrid of three simple
techniques:**

1. **CPM** for identifying the critical path and float (DONE in S-09)
2. **Topological Sort with BFS levels** for wave decomposition (DONE in S-09)
3. **Priority-rule list scheduling** for ordering within waves, using a
   composite priority:
   - **P1: Critical path membership** (agent-env > all others)
   - **P2: Downstream successor count** (plans feeding SWS get priority)
   - **P3: Shared resource conflict resolution** (plans touching shared files
     run in dependency order per S-08)
   - **P4: Effort size** (smaller plans first within a wave -- SPT rule -- to
     clear the deck quickly)

**Resource constraints** (shared files) are resolved by **sequencing within
waves**, not by formal RCPSP solving. With only 5 shared resources and 7 tasks,
manual inspection (done in S-08) identifies the correct ordering more
efficiently than any algorithm.

---

## 3. Applied Schedule

### 3.1 Input Data Summary (from prior findings)

| Plan                   | Effort (sessions) | Hard Deps      | Soft Deps       | Shared File Conflicts                                                 |
| ---------------------- | ----------------- | -------------- | --------------- | --------------------------------------------------------------------- |
| repo-cleanup (RC)      | 1                 | None           | -> all others   | package.json                                                          |
| custom-statusline (SL) | 3-4               | None           | -> AE (soft)    | settings.json                                                         |
| cli-tools (CLI)        | 2                 | None           | -> SWS (soft)   | session-start.js, CLAUDE.md, settings.json, package.json              |
| passive-surfacing (PS) | 1-2               | None           | -> SWS (soft)   | session-start.js, pre-commit, ecosystem audit skills, alerts SKILL.md |
| propagation (PR)       | 4-6               | None           | -> SWS (soft)   | pre-commit, pre-push, ecosystem audit skills                          |
| agent-env (AE) P4-5    | 2-4               | -> SWS (HARD)  | -> SL (soft)    | session-start.js, CLAUDE.md, pre-commit, pre-push, alerts SKILL.md    |
| SWS                    | 80-130            | AE must finish | All others soft | Touches everything                                                    |

### 3.2 Priority Score Calculation

Using the composite priority rule (P1 critical path + P2 successors + P3 file
conflicts + P4 effort):

| Plan                  | P1 (Critical Path)    | P2 (Successor Count) | P3 (File Conflict Priority)                  | P4 (SPT -- smaller first)     | Composite Score | Priority Rank    |
| --------------------- | --------------------- | -------------------- | -------------------------------------------- | ----------------------------- | --------------- | ---------------- |
| **agent-env P4-5**    | 10 (ON critical path) | 1 (SWS)              | 5 (touches 5 shared files)                   | 4 (2-4 sessions)              | **20**          | **1**            |
| **passive-surfacing** | 0                     | 1 (SWS soft)         | 5 (session-start.js first, pre-commit first) | 8 (1-2 sessions, clears fast) | **14**          | **2**            |
| **propagation**       | 0                     | 1 (SWS soft)         | 4 (pre-commit, pre-push, ecosystem skills)   | 5 (4-6 sessions)              | **10**          | **3**            |
| **cli-tools**         | 0                     | 1 (SWS soft)         | 3 (session-start.js, CLAUDE.md)              | 7 (2 sessions)                | **11**          | **3** (tie)      |
| **repo-cleanup**      | 0                     | 5 (all others soft)  | 1 (package.json only)                        | 9 (1 session, fastest)        | **15**          | **2** (tie)      |
| **custom-statusline** | 0                     | 0                    | 1 (settings.json only)                       | 6 (3-4 sessions)              | **7**           | **5**            |
| **SWS**               | 10 (ON critical path) | 0 (terminal)         | N/A (runs last)                              | 1 (80-130, largest)           | N/A             | **LAST (gated)** |

### 3.3 Applied Wave Schedule

Applying the priority ordering with shared-resource conflict resolution from
S-08:

| Wave        | Plans/Phases                                                                        | Duration (sessions) | Parallel?          | Rationale                                                                                                                                                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------- | ------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wave 0**  | repo-cleanup                                                                        | 1 session           | Solo               | SPT rule: smallest task first. Clears orphans, fixes docs, removes noise for all downstream plans. SY-01 synergy: provides clean starting state. 60-90 minutes.                                                                                                  |
| **Wave 1a** | agent-env P4 + passive-surfacing (Steps 1-7) + custom-statusline (Steps 1-4)        | 2-3 sessions        | Interleaved        | Critical path priority: agent-env P4 gets session priority (every session should include AE work). PS and SL run in remaining time or alternate sessions. PS must run BEFORE CLI on session-start.js (CONFLICT-H1). SL has zero file conflicts with AE or PS.    |
| **Wave 1b** | agent-env P5 + propagation W1-W2 + cli-tools (all) + passive-surfacing (Steps 8-11) | 2-3 sessions        | Interleaved        | AE P5 completes the critical path gate. PR W1-W2 can run in parallel (different file domains). CLI runs AFTER PS completes session-start.js work. PS Steps 8-11 (ecosystem audit skills) must run BEFORE PR Step 8 (shared-lib extraction) per R-08/CONFLICT-M3. |
| **Wave 1c** | propagation W3-W4 + custom-statusline (Steps 5-12)                                  | 1-2 sessions        | Interleaved        | Tail work. PR W3-W4 (infrastructure hardening, cleanup). SL Steps 5-12 (Go binary build, widget system, deployment). Zero mutual conflicts.                                                                                                                      |
| **Wave 2**  | SWS Step 1 (CANON)                                                                  | 6-10 sessions       | Solo (SWS-focused) | HARD gate: agent-env ALL 5 phases must be complete. CANON creates .canon/ directory (isolated). Can safely overlap with any Wave 1c tail work since .canon/ is a new directory.                                                                                  |
| **Wave 3**  | SWS Steps 2-21                                                                      | 74-120 sessions     | Solo (SWS-focused) | Strictly sequential within SWS per D63. All other plans complete. SWS benefits from all synergies (SY-02 through SY-14). Some SWS steps can interleave with project feature work (D71) but NOT with any remaining plan work.                                     |

### 3.4 Wave Duration Summary

| Scenario        | Wave 0 | Wave 1 (a+b+c) | Wave 2 | Wave 3 | **Total**        |
| --------------- | ------ | -------------- | ------ | ------ | ---------------- |
| **Optimistic**  | 1      | 5              | 6      | 74     | **86 sessions**  |
| **Expected**    | 1      | 7              | 8      | 97     | **113 sessions** |
| **Pessimistic** | 1      | 8              | 10     | 120    | **139 sessions** |

### 3.5 Shared File Conflict Resolution (Embedded in Schedule)

The wave schedule resolves all 7 HIGH/MEDIUM conflicts identified in S-08:

| Conflict                                               | Resolution                                                                               | Wave Placement                                        |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **CONFLICT-H1:** session-start.js (CLI, PS, AE)        | PS first (Wave 1a) -> CLI second (Wave 1b) -> AE last (Wave 1b, Phase 5)                 | PS in 1a, CLI in 1b, AE P5 in 1b (after PS)           |
| **CONFLICT-H2:** pre-commit (PS, PR, AE, SWS)          | PS first (Wave 1a) -> PR second (Wave 1b) -> AE third (Wave 1b P5) -> SWS last (Wave 2+) | Sequential within waves, SWS naturally last           |
| **CONFLICT-H3:** pre-push (PR, AE, SWS)                | PR first (Wave 1b) -> AE second (Wave 1b P5) -> SWS last (Wave 2+)                       | Sequential within waves                               |
| **CONFLICT-H4:** scripts/ mass refactoring (PR vs SWS) | PR first (Waves 1b-1c) -> SWS (Wave 3, Steps 8-9+)                                       | PR completes ~70+ sessions before SWS reaches Scripts |
| **CONFLICT-M1:** CLAUDE.md (CLI, AE, SWS)              | CLI first (Wave 1b, Section 6b) -> AE second (Wave 1b P5, Section 7) -> SWS (Wave 3)     | Different sections, resolved by ordering              |
| **CONFLICT-M3:** ecosystem audit skills (PS, PR)       | PS first (Wave 1a-1b, adds categories) -> PR second (Wave 1b, shared-lib extraction)     | PS adds content before PR restructures                |
| **CONFLICT-M4:** check-agent-compliance.js (PS, AE)    | PS first (Wave 1a, Fix: command) -> AE second (Wave 1b P5, --strict mode)                | PS formats output before AE changes enforcement       |

### 3.6 Synergy Exploitation Verification

| Synergy                                   | Exploited? | How                                                                                               |
| ----------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| SY-01 (RC before all)                     | YES        | Wave 0 runs RC first                                                                              |
| SY-02 (PS before SWS)                     | YES        | PS in Wave 1a-1b, SWS in Wave 2+                                                                  |
| SY-03 (PR shared-lib before SWS Audits)   | YES        | PR in Wave 1b-1c, SWS Step 14 in Wave 3                                                           |
| SY-04 (AE before SWS -- HARD)             | YES        | AE P5 completes in Wave 1b, SWS starts Wave 2                                                     |
| SY-05 (SL before AE token monitoring)     | PARTIALLY  | SL starts in Wave 1a but may not complete before AE P5 in 1b. WEAK synergy -- acceptable to miss. |
| SY-06 (PS before CLI on session-start.js) | YES        | PS in Wave 1a, CLI in Wave 1b                                                                     |
| SY-08 (RC docs + PS hook behavior)        | YES        | RC in Wave 0, PS in Wave 1a                                                                       |
| SY-09 (PR scripts before SWS Scripts)     | YES        | PR in Wave 1b-1c, SWS Step 9 in Wave 3                                                            |
| SY-13 (PR + PS hook pipeline)             | YES        | Both in Wave 1a-1b                                                                                |

---

## 4. Sensitivity Analysis

### 4.1 SWS Duration Sensitivity

SWS is 85% of total effort. Its duration range (80-130 sessions) creates a
50-session uncertainty band.

| SWS Duration               | Total Project Duration | Impact                                                    |
| -------------------------- | ---------------------- | --------------------------------------------------------- |
| 80 sessions (optimistic)   | ~86 sessions           | Minimum viable. Non-SWS work is ~6 sessions of the total. |
| 105 sessions (expected)    | ~113 sessions          | Mid-range estimate. ~56 working days at 2 sessions/day.   |
| 130 sessions (pessimistic) | ~139 sessions          | Maximum. ~70 working days at 2 sessions/day.              |

**Key insight:** The 50-session range is entirely due to SWS internal
complexity. No scheduling algorithm can reduce this uncertainty -- only SWS
execution experience will narrow the range. This argues for **rolling wave
planning**: start SWS, measure actual velocity for 10 sessions, then
re-estimate.

### 4.2 Agent-Env Phase 4-5 Duration Sensitivity

Agent-env is the critical path bottleneck outside SWS. Its range is 2-4
sessions.

| AE P4-5 Duration         | SWS Start Delay       | Total Project Impact                                                     |
| ------------------------ | --------------------- | ------------------------------------------------------------------------ |
| 2 sessions (optimistic)  | SWS starts session 4  | Minimal -- 2-session delay on a 80-130 session project                   |
| 4 sessions (pessimistic) | SWS starts session 6  | Still minimal -- 4 sessions is <5% of total                              |
| 8 sessions (2x overrun)  | SWS starts session 10 | Noticeable but still <10% of total. 8-session delay barely moves needle. |

**Key insight:** Even a 2x overrun on agent-env (4 sessions -> 8 sessions) only
adds 4 sessions to total project duration. The critical path is so SWS-dominated
that agent-env overruns are absorbed. **However**, the risk is not duration --
it's that agent-env Phase 4 involves interactive per-agent decisions that could
reveal scope expansion needs (S-06 Key Finding #5). If agent-env discovers that
agents need more fundamental redesign, the delay could be unbounded.

**Mitigation:** Set a time-box for agent-env P4 (2 sessions maximum). If not
complete after 2 sessions, move remaining work to a backlog that SWS Step 13
(Agents ecosystem) can absorb.

### 4.3 Shared Resource Conflict Rework Sensitivity

What if a shared file conflict causes rework?

| Conflict Scenario                                          | Probability                 | Rework Cost   | Schedule Impact |
| ---------------------------------------------------------- | --------------------------- | ------------- | --------------- |
| session-start.js merge conflict (PS + CLI)                 | LOW (sequenced by schedule) | 0.5-1 session | ~0.5% of total  |
| pre-commit merge conflict (4 plans)                        | LOW (sequenced by schedule) | 0.5-1 session | ~0.5% of total  |
| Ecosystem audit skill conflict (PS + PR)                   | LOW (sequenced by schedule) | 0.25 session  | ~0.2% of total  |
| Unsequenced conflict due to wave interleaving              | MEDIUM                      | 1-2 sessions  | ~1% of total    |
| SWS encounters un-fixed pre-existing conflicts from Wave 1 | MEDIUM                      | 2-3 sessions  | ~2% of total    |

**Key insight:** Shared resource conflicts are LOW impact because (a) the
schedule sequences them correctly, and (b) even if rework occurs, the cost (1-3
sessions) is negligible relative to SWS's 80-130 sessions.

**Worst case:** If ALL shared resource conflicts materialize simultaneously AND
require rework, the total cost is ~5 sessions, or ~4% of total project duration.
This is within the SWS estimation uncertainty range and does not warrant more
complex scheduling.

### 4.4 Parallel Execution Intensity Sensitivity

The schedule assumes "interleaving" within waves (1 developer, 1 session at a
time). What if the developer can only do 1 plan per session (no interleaving)?

| Execution Mode                                                        | Wave 1 Duration | Total Duration | Notes                                                             |
| --------------------------------------------------------------------- | --------------- | -------------- | ----------------------------------------------------------------- |
| **Aggressive interleaving** (multiple plans per session)              | 5-6 sessions    | 86-113         | Wave 1 plans run in every session, progress on 2-3 simultaneously |
| **Session-focused** (1 plan per session, but switch between sessions) | 7-8 sessions    | 88-115         | Pick one plan per session. Switch next session.                   |
| **Fully sequential** (finish one plan before starting next)           | 13-19 sessions  | 94-149         | No parallelism at all. Adds 7-11 sessions to total.               |

**Key insight:** Even fully sequential execution of the 6 non-SWS plans adds
only 7-11 sessions to total, which is within the SWS estimation range. The
parallelism benefit for non-SWS plans is **real but modest**. The primary
benefit of interleaving is **flexibility** (pick the most valuable plan each
session) rather than duration reduction.

---

## 5. Recommendations

### 5.1 Algorithm Recommendation

**Use a simple hybrid of CPM + Topological Sort + Priority-Rule List
Scheduling.** [CONFIDENCE: HIGH]

Formal scheduling algorithms (Coffman-Graham, RCPSP, Hu's) are **overkill** for
this problem. The reasons are:

1. **Instance size is trivially small** (7 tasks, 1 hard dependency, 5 shared
   resources). Any NP-hard algorithm's formulation overhead exceeds its
   optimization benefit.
2. **One task dominates** (SWS = 85% of effort). No scheduling algorithm can
   reduce SWS's duration. The total project duration is fundamentally SWS's
   duration + agent-env's 2-4 sessions.
3. **The DAG is shallow** (depth = 2: agent-env -> SWS). There is almost nothing
   to optimize in the dependency structure.
4. **"Parallelism" is human interleaving**, not true multi-processor scheduling.
   A solo developer cannot literally run tasks in parallel -- they switch
   between plans across sessions.
5. **Shared resource conflicts are resolved by inspection** (S-08), not by
   algorithm. With 5 shared files and known modification patterns, manual
   sequencing is trivial and optimal.

The problem is better characterized as a **wave planning exercise** than a
scheduling optimization problem.

### 5.2 Is Formal Scheduling Theory Overkill?

**YES, but the conceptual framework is valuable.** [CONFIDENCE: HIGH]

The formal algorithms are overkill for _solving_ the problem, but the scheduling
theory concepts provide valuable vocabulary and validation:

| Concept                                          | Value Provided                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **Critical Path**                                | Confirms SWS dominates. Confirms agent-env is the only gate.                                |
| **Float analysis**                               | Shows 5 of 7 plans have 80+ sessions of float -- they can run anytime.                      |
| **Resource constraints as capacity=1 resources** | Models shared file conflicts correctly.                                                     |
| **Priority rules**                               | Provides principled ordering within waves (critical path first, then successors, then SPT). |
| **Rolling wave planning**                        | Acknowledges SWS duration uncertainty. Plan near-term in detail, adapt later.               |

The recommended approach: **use scheduling theory concepts for validation, but
solve by manual inspection.**

### 5.3 Recommended Schedule (Final)

The schedule from Section 3.3 is the recommendation. Summarized:

```
Wave 0 (1 session):     repo-cleanup (clean the deck)
Wave 1 (5-8 sessions):  [agent-env P4-5, passive-surfacing, propagation, cli-tools, custom-statusline]
                          -- interleaved across sessions
                          -- agent-env gets session priority (critical path)
                          -- file conflict ordering: PS before CLI, PS before PR on shared skills, PR before AE on hooks
Wave 2 (6-10 sessions): SWS Step 1 (CANON) -- starts immediately after agent-env P5 completes
Wave 3 (74-120 sessions): SWS Steps 2-21 -- strictly sequential internally
```

**Total: ~86-139 sessions (~43-70 working days at 2 sessions/day)**

### 5.4 Session Priority Protocol (Within Wave 1)

When starting a Wave 1 session, choose work in this order:

1. **agent-env P4-5** -- if ANY agent-env work remains, do it first. This is the
   critical path. Every session of delay here delays SWS start.
2. **passive-surfacing** -- second priority. Fixes 33 violations that would
   otherwise inflate SWS scope. Also must complete session-start.js work before
   CLI and ecosystem audit work before PR.
3. **propagation W1-W2** -- third priority. Consolidates code patterns that SWS
   would otherwise encounter as duplicates.
4. **cli-tools** -- fourth priority. Must wait for PS to complete
   session-start.js changes. Otherwise independent.
5. **custom-statusline** -- lowest priority. Fully independent. Can float to any
   session. Nice-to-have developer tooling.

### 5.5 Risk Mitigation Recommendations

| Risk                                        | Mitigation                                                                                                |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Agent-env P4 scope creep                    | Time-box at 2 sessions. Remaining work goes to SWS Step 13 backlog.                                       |
| SWS duration uncertainty (80-130 range)     | Measure velocity for first 10 SWS sessions. Re-estimate total at session 10.                              |
| Shared file merge conflict                  | Follow the sequencing in Section 3.5. If conflict occurs, resolve immediately (cost: 0.5-1 session).      |
| Wave 1 plans take longer than estimated     | Non-critical. They have 80+ sessions of float. Even if they double in effort, total project barely moves. |
| SWS interleaving with remaining Wave 1 work | Avoid. Complete ALL Wave 1 work before SWS Step 2 (CANON is safe to overlap since .canon/ is isolated).   |

---

## 6. Convergence Loop

### CL-1: Does the applied schedule respect ALL hard dependencies from S-09?

**Hard dependency:** agent-env (ALL 5 phases) --> SWS Step 1 (CANON)

- Schedule places agent-env P4 in Wave 1a, P5 in Wave 1b
- SWS starts in Wave 2, AFTER Wave 1b completes
- Wave 2 gate: "agent-env ALL 5 phases must be complete"

**VERIFIED.** The schedule explicitly gates SWS on agent-env completion.

### CL-2: Does the schedule respect ALL file overlap constraints from S-08?

Checking all 7 HIGH/MEDIUM conflicts:

| Conflict                                | S-08 Recommended Order | Schedule Order                               | Match? |
| --------------------------------------- | ---------------------- | -------------------------------------------- | ------ |
| CONFLICT-H1 (session-start.js)          | PS -> CLI -> AE        | PS (1a) -> CLI (1b) -> AE P5 (1b, after PS)  | YES    |
| CONFLICT-H2 (pre-commit)                | PS -> PR -> AE -> SWS  | PS (1a) -> PR (1b) -> AE P5 (1b) -> SWS (2+) | YES    |
| CONFLICT-H3 (pre-push)                  | PR -> AE -> SWS        | PR (1b) -> AE P5 (1b) -> SWS (2+)            | YES    |
| CONFLICT-H4 (scripts/)                  | PR -> SWS              | PR (1b-1c) -> SWS (3, Steps 8-9)             | YES    |
| CONFLICT-M1 (CLAUDE.md)                 | CLI -> AE -> SWS       | CLI (1b) -> AE P5 (1b) -> SWS (3)            | YES    |
| CONFLICT-M3 (ecosystem audit skills)    | PS -> PR               | PS (1a-1b) -> PR (1b)                        | YES    |
| CONFLICT-M4 (check-agent-compliance.js) | PS -> AE               | PS (1a) -> AE P5 (1b)                        | YES    |

**VERIFIED.** All file overlap constraints are respected.

### CL-3: Does the schedule align with synergy recommendations from S-10?

| S-10 Recommendation                           | Schedule Alignment                        | Match? |
| --------------------------------------------- | ----------------------------------------- | ------ |
| RC first (Tier 1)                             | RC in Wave 0                              | YES    |
| PS + PR early (Tier 2)                        | PS in Wave 1a, PR in Wave 1b              | YES    |
| SL + CLI independent (Tier 3)                 | SL in Wave 1a-1c, CLI in Wave 1b          | YES    |
| AE after PS (Tier 4)                          | AE P5 in Wave 1b, after PS                | YES    |
| SWS last (Tier 5)                             | SWS in Waves 2-3                          | YES    |
| PS before PR on ecosystem audit skills (R-08) | PS (1a) -> PR (1b)                        | YES    |
| Combined session opportunity for PS + PR W1   | Both available in Wave 1 for interleaving | YES    |

**VERIFIED.** All synergy recommendations are followed.

### CL-4: Are algorithm descriptions accurate?

| Algorithm             | Claim                                       | Verified?                              |
| --------------------- | ------------------------------------------- | -------------------------------------- |
| CPM                   | "Identifies longest dependency chain"       | YES -- standard definition [1][2]      |
| Coffman-Graham        | "Optimal for W=2 with UET"                  | YES -- Wikipedia confirms [3]          |
| Coffman-Graham        | "Within 2-2/W factor for W>2"               | YES -- Wikipedia confirms [3]          |
| Hu's Algorithm        | "Optimal for tree-structured DAGs with UET" | YES -- multiple sources confirm [4][5] |
| RCPSP                 | "NP-hard"                                   | YES -- standard result [6]             |
| List Scheduling       | "Greedy assignment by priority"             | YES -- standard definition [7]         |
| LPT                   | "Worst-case 4/3-1/(3m) factor"              | YES -- Wikipedia confirms [8]          |
| Rolling Wave Planning | "Plan near-term in detail, refine later"    | YES -- standard PM concept [9]         |

**VERIFIED.** All algorithm descriptions are accurate per sources.

### CL-5: Is the sensitivity analysis grounded in actual effort estimates from Wave 1?

| Estimate Used                   | Source                                     | Verified?                      |
| ------------------------------- | ------------------------------------------ | ------------------------------ |
| SWS: 80-130 sessions            | S-07 findings, effort table sum            | YES                            |
| Agent-env P4-5: 2-4 sessions    | S-06 findings, Phase 4-5 estimates         | YES                            |
| Repo-cleanup: 1 session         | S-01 findings, 60-90 min                   | YES                            |
| Passive-surfacing: 1-2 sessions | S-04 findings, 5-7h serial / 2-3h parallel | YES                            |
| Propagation: 4-6 sessions       | S-05 findings, ~17h total                  | YES                            |
| CLI-tools: 2 sessions           | S-03 findings, 3-4h                        | YES                            |
| Custom-statusline: 3-4 sessions | S-02 findings, 8-12h                       | YES                            |
| Non-SWS total: 13-19 sessions   | Sum of above                               | YES (computed from individual) |
| Critical path: 82-134 sessions  | S-09 findings                              | YES                            |

**VERIFIED.** All estimates are grounded in Wave 1 findings.

### Corrections Made During Convergence Loop

1. **Initial draft had CLI in Wave 1a alongside PS.** Corrected: CLI must wait
   for PS to complete session-start.js work (CONFLICT-H1). Moved CLI to Wave 1b.

2. **Initial draft did not explicitly gate AE P5 after PS.** Corrected: AE P5
   touches session-start.js (token monitoring), check-agent-compliance.js, and
   pre-commit. PS must complete its work on these files first. AE P5 is placed
   in Wave 1b explicitly AFTER PS completes.

3. **Initial sensitivity analysis omitted the "fully sequential" execution
   mode.** Added: even fully sequential execution of non-SWS plans only adds
   7-11 sessions, demonstrating that parallelism benefit is real but modest.

---

## Sources

| #   | URL/Path                                                                                                                                                                 | Title                                                        | Type                   | Trust  | CRAAP Avg | Date       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ---------------------- | ------ | --------- | ---------- |
| 1   | [CPM - Wikipedia](https://en.wikipedia.org/wiki/Critical_path_method)                                                                                                    | Critical Path Method                                         | Encyclopedia           | MEDIUM | 4.2       | Current    |
| 2   | [CPM Guide - Asana](https://asana.com/resources/critical-path-method)                                                                                                    | Critical Path Method: Steps, Float, Examples                 | Tutorial               | MEDIUM | 3.8       | 2026       |
| 3   | [Coffman-Graham - Wikipedia](https://en.wikipedia.org/wiki/Coffman%E2%80%93Graham_algorithm)                                                                             | Coffman-Graham Algorithm                                     | Encyclopedia           | MEDIUM | 4.0       | Current    |
| 4   | [Hu's Algorithm Proof - NJIT](https://researchwith.njit.edu/en/publications/hus-precedence-tree-scheduling-algorithm-a-simple-proof/)                                    | Hu's Precedence Tree Scheduling: A Simple Proof              | Academic paper         | HIGH   | 4.5       | 1984       |
| 5   | [Scheduling Algorithms - CVUT](https://rtime.felk.cvut.cz/scheduling-toolbox/manual/algorithms-scheduling.php)                                                           | Scheduling Algorithms Reference                              | Academic reference     | HIGH   | 4.2       | Current    |
| 6   | [RCPSP 50 Years Review - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0377221725002218)                                                             | Fifty Years of RCPSP Research                                | Academic survey        | HIGH   | 4.8       | 2025       |
| 7   | [List Scheduling Priority Rules - PMI](http://www.pmknowledgecenter.com/dynamic_scheduling/baseline/optimizing-regular-scheduling-objectives-priority-rule-calculations) | Optimizing Scheduling Objectives: Priority Rule Calculations | Professional reference | HIGH   | 4.0       | Current    |
| 8   | [LPT Scheduling - Wikipedia](https://en.wikipedia.org/wiki/Longest-processing-time-first_scheduling)                                                                     | Longest Processing Time First Scheduling                     | Encyclopedia           | MEDIUM | 4.0       | Current    |
| 9   | [Rolling Wave Planning - Wikipedia](https://en.wikipedia.org/wiki/Rolling-wave_planning)                                                                                 | Rolling-Wave Planning                                        | Encyclopedia           | MEDIUM | 3.8       | Current    |
| 10  | [RCPSP Heuristics Classification - Springer](https://link.springer.com/chapter/10.1007/978-1-4615-5533-9_7)                                                              | Heuristic Algorithms for RCPSP: Classification and Analysis  | Academic chapter       | HIGH   | 4.6       | 1999       |
| 11  | [Topological Sort Guide - Medium](https://medium.com/@amit.anjani89/topological-sorting-explained-a-step-by-step-guide-for-dependency-resolution-1a6af382b065)           | Topological Sorting Explained                                | Tutorial               | LOW    | 3.2       | 2024       |
| 12  | [Resource Leveling - Wikipedia](https://en.wikipedia.org/wiki/Resource_leveling)                                                                                         | Resource Leveling                                            | Encyclopedia           | MEDIUM | 4.0       | Current    |
| 13  | [Shifting Bottleneck - Wikipedia](https://en.wikipedia.org/wiki/Shifting_bottleneck_heuristic)                                                                           | Shifting Bottleneck Heuristic                                | Encyclopedia           | MEDIUM | 4.0       | Current    |
| 14  | S-08 findings                                                                                                                                                            | Cross-Plan File Overlap Map                                  | Internal analysis      | HIGH   | N/A       | 2026-03-24 |
| 15  | S-09 findings                                                                                                                                                            | Cross-Plan Dependency Graph and Critical Path                | Internal analysis      | HIGH   | N/A       | 2026-03-24 |
| 16  | S-10 findings                                                                                                                                                            | Cross-Plan Redundancy and Synergy Analysis                   | Internal analysis      | HIGH   | N/A       | 2026-03-24 |

---

## Contradictions

1. **S-09 Wave 0 placement vs S-10 Tier 1 placement.** S-09 proposes
   repo-cleanup as Wave 0 (separate wave). S-10 says repo-cleanup is "Tier 1:
   Execute First (Foundation Layer)." These are CONSISTENT -- both place
   repo-cleanup first. The terminology differs (wave vs tier) but the scheduling
   conclusion is identical.

2. **S-09 "3-wave alternative" vs this schedule's 5-sub-wave structure.** S-09
   proposes collapsing into 3 waves (repo-cleanup folded into Wave 1). This
   schedule expands to Wave 0 + Wave 1a/1b/1c + Wave 2 + Wave 3 for
   finer-grained conflict resolution. Both are valid -- the difference is
   granularity. The 5-sub-wave structure is more precise because it embeds the
   file conflict ordering within waves.

3. **No contradiction found between algorithm descriptions and sources.** All
   algorithm properties verified against source material.

---

## Gaps

1. **SWS internal phasing not modeled.** This analysis treats SWS as a
   monolithic 80-130 session block. S-07 shows SWS has 21 internal steps that
   could be further decomposed. However, SWS is internally sequential (D63), so
   decomposition would not change the total duration. It would only matter if
   some SWS steps could be parallelized with late-arriving non-SWS work, which
   is explicitly prohibited by the schedule (all non-SWS work completes before
   SWS Step 2).

2. **No empirical velocity data.** All duration estimates are planning-level.
   Actual session productivity is unknown. The rolling wave planning
   recommendation addresses this: measure velocity during first 10 SWS sessions,
   then re-estimate.

3. **Interleaving cost not modeled.** Switching between plans within a session
   has a context-switching cost (re-reading plan, re-orienting). This cost is
   not modeled. In practice, it may add 10-20% overhead to Wave 1 sessions
   compared to single-plan-per-session execution. This does not materially
   affect total project duration (adds 1-2 sessions to Wave 1).

---

## Serendipity

1. **The problem structure is a "star graph with one heavy leaf."** In
   scheduling theory, this is a known easy case: one dominant task with several
   small independent tasks feeding into it. The optimal strategy is trivial: run
   small tasks first (in any order), then run the dominant task. No
   sophisticated algorithm adds value beyond this insight.

2. **The 100:1 task duration ratio renders most scheduling algorithms
   irrelevant.** Algorithms like Coffman-Graham, Hu's, and even basic LPT are
   designed for tasks with comparable durations (typically within 10:1 ratio).
   At 100:1 (SWS vs repo-cleanup), the small tasks are rounding errors. The
   "scheduling problem" reduces to a single question: "when does SWS start?"

3. **Resource leveling degenerates for a solo developer.** With exactly 1
   "processor" (the developer), resource leveling = sequential execution. The
   interleaving within waves is possible because each "session" is a discrete
   unit, and the developer can choose which plan to work on each session. But
   within a session, work is sequential. This means the parallel execution
   benefit is purely about flexibility (choose the most valuable work) rather
   than throughput.

4. **Rolling wave planning is the most valuable scheduling concept for this
   problem.** Not because it optimizes the schedule, but because it acknowledges
   the 50-session uncertainty range in SWS. The non-SWS plan scheduling is
   essentially solved (clear priorities, clear ordering). The real scheduling
   challenge is managing SWS's 80-130 session journey, which requires adaptive
   re-planning.

---

## Confidence Assessment

- HIGH claims: 12 (algorithm descriptions, priority ordering, wave schedule,
  file conflict resolution, dependency respect, synergy alignment)
- MEDIUM claims: 4 (sensitivity analysis ranges, interleaving cost, SWS internal
  phasing implications, time-boxing recommendation)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**
