# Research Output: Optimal Sequencing and Interleaving of 7 Active Plans

**Version:** 1.0 **Date:** 2026-03-24 **Depth:** L3 (Investigation) **Question
Type:** Relational **Domain:** Technology / codebase orchestration **Agents
Used:** 17 searcher agents + 1 synthesizer

---

## Executive Summary

This research investigates the optimal sequencing and interleaving of 7 active
plans in the SoNash codebase: repo-cleanup, custom-statusline,
cli-tools-implementation, passive-surfacing-remediation, propagation-research,
agent-environment-analysis, and system-wide-standardization (SWS). The
investigation deployed 17 specialized agents across 4 waves -- 7 plan inventory
specialists, 4 cross-cutting analysts, and 6 domain specialists -- producing 18
findings files totaling over 40,000 words of verified analysis.

The central finding is that **the scheduling problem is trivially solved**. The
dependency graph is a "star graph with one heavy leaf" [1][14]: there is exactly
1 hard dependency (agent-env must complete all 5 phases before SWS Phase 1)
[9][10], and SWS dominates total effort by a factor of 20x (80-130+ sessions vs
~15-20 sessions for all 6 other plans combined) [7][14]. The 100:1 task duration
ratio (SWS vs repo-cleanup) renders formal scheduling algorithms irrelevant
[14]. The only scheduling decision that materially affects project completion
time is: _when does SWS start?_ -- and that is gated solely by agent-env Phase 5
completion.

Five shared resource conflicts create practical sequencing constraints even
where no formal dependencies exist [8]. The worst offender is
`.husky/pre-commit`, touched by 4 plans for different purposes [8][12].
`.claude/hooks/session-start.js` (37KB, 1077 lines) is modified by 3 plans and
requires strict ordering: passive-surfacing first (fixes 7 violations),
cli-tools second (adds tool detection), agent-env last (adds monitoring)
[8][12]. The recommended schedule resolves all 7 HIGH/MEDIUM file conflicts
through wave-level sequencing [14].

The recommended execution plan is 4 waves: Wave 0 (repo-cleanup, 1 session),
Wave 1 (all 5 remaining non-SWS plans interleaved, 5-8 sessions), Wave 2 (SWS
CANON Step 1, 6-10 sessions), Wave 3 (SWS Steps 2-21, 74-120 sessions). Total
elapsed time: ~86-139 sessions (~43-70 working days at 2 sessions/day) [14]. The
user has clarified that SWS is a "plan for making plans" whose 80-130 session
estimate is a floor, not a ceiling -- scope grows during execution [18]. This
makes completing all non-SWS plans quickly even more urgent.

Optimal ordering yields ~7% effort savings (~6-10 SWS sessions saved) through
synergy exploitation [10], with the primary value being risk reduction rather
than raw hour savings. Only 2 of 32 S0 critical debt items are resolved by any
plan (both by propagation-research) [11], and propagation is the only plan with
S0-level debt impact, making it the highest-value plan from a risk-reduction
perspective despite not being the largest.

---

## Key Findings

### Theme 1: The Dependency Graph Is Remarkably Shallow

There is exactly **1 hard dependency** across all 7 plans:
agent-environment-analysis (all 5 phases) must complete before SWS Phase 1 can
begin [9]. This is confirmed by the memory note ("All 5 phases must complete
before SWS Phase 1"), the STEP_3_14_COVERAGE_AUDIT.md (agent-env subsumes SWS
Step 3.14), and the fact that SWS Step 13 (Agents ecosystem) cannot standardize
agent definitions that agent-env is still rewriting [6][9].

All other dependencies are SOFT [9]:

- repo-cleanup benefits all 6 other plans by removing orphans and fixing stale
  docs [1][9]
- passive-surfacing pre-fixes 33 violations SWS would otherwise flag [4][10]
- propagation creates shared-lib and consolidated patterns SWS would standardize
  [5][10]
- cli-tools adds CLAUDE.md Section 6b for SWS to govern [3][9]
- agent-env provides token monitoring data for custom-statusline widgets (weak)
  [6][9]

5 of 7 plans have zero hard dependencies on each other. Custom-statusline is
completely independent [2][9]. The graph is a DAG with no cycles [9].

**CANON is NOT an external dependency.** The DIAGNOSIS.md statement "SWS is
gated on CANON framework" is misleading [13][7]. CANON is Step 1 OF SWS, built
within the plan itself. SWS's only external hard dependency is agent-env
completion [7][9].

### Theme 2: SWS Dominates Everything

SWS is estimated at 80-130 sessions, constituting ~85% of total effort across
all 7 plans [7][10]. The user has confirmed this is a floor -- SWS is a "plan
for making plans" whose scope grows during execution [18]. The plan defines 21
steps across 18 ecosystems, internally strictly sequential per Decision D63 [7].

All 6 non-SWS plans combined require ~15-20 sessions [10][14]:

| Plan                       | Sessions   |
| -------------------------- | ---------- |
| repo-cleanup               | 1          |
| custom-statusline          | 3-4        |
| cli-tools                  | 2          |
| passive-surfacing          | 1-2        |
| propagation                | 4-6        |
| agent-env (remaining P4-5) | 2-4        |
| **Non-SWS total**          | **~13-19** |

This means that even a 2x overrun on agent-env (4 sessions becoming 8) adds only
4 sessions to total project duration [14]. Even fully sequential execution of
non-SWS plans (no interleaving) adds only 7-11 sessions to total -- within SWS's
estimation uncertainty range [14].

SWS decomposes into 7 schedulable chunks aligned with checkpoint boundaries
[16]:

| Chunk | Steps                              | Sessions | Checkpoint |
| ----- | ---------------------------------- | -------- | ---------- |
| C1    | Step 1 (CANON)                     | 6-10     | --         |
| C2    | Steps 2-4 (Foundation + Pilot)     | 10-17    | CP#1       |
| C3    | Steps 5-7 (Core Infra)             | 9-15     | CP#2       |
| C4    | Steps 8-9 (Data-Heavy)             | 12-20    | --         |
| C5    | Steps 10-15 (Process-Layer)        | 18-30    | CP#3       |
| C6    | Steps 16-19 (App-Layer + Hub)      | 18-33    | --         |
| C7    | Steps 20-21 (Verification + Final) | 7-12     | CP#4       |

Between each chunk, non-SWS work can be inserted [16]. Born-compliant gates
activate progressively after C2 (new skills must meet L3) and after C3 (new docs
must meet L3) [16].

### Theme 3: Shared File Conflicts Drive Practical Sequencing

While only 1 hard dependency exists, 5 critical shared resources create real
sequencing constraints [8]:

| Resource                                | Plans                     | Conflict Risk                                                |
| --------------------------------------- | ------------------------- | ------------------------------------------------------------ |
| `.husky/pre-commit` (34KB)              | PS, PR, AE, SWS (4 plans) | **CRITICAL** -- broken pre-commit blocks ALL commits [8][17] |
| `.claude/hooks/session-start.js` (37KB) | CLI, PS, AE (3 plans)     | **HIGH** -- runs every session [8][12]                       |
| `.husky/pre-push` (32KB)                | PR, AE, SWS (3 plans)     | **HIGH** -- blocks pushes [8]                                |
| `CLAUDE.md` (12KB)                      | CLI, AE, SWS (3 plans)    | **MEDIUM** -- different sections [8]                         |
| `.claude/settings.json` (5.7KB)         | SL, CLI (2 plans)         | **MEDIUM** -- different JSON keys [8]                        |

The recommended ordering for `.husky/pre-commit` is: PS (Fix: command) then PR
(EXIT trap) then AE (agent triggers) then SWS (CANON gates) [8][12]. For
`session-start.js`: PS first (fixes 7 violations), CLI second (adds tool
detection), AE last (monitoring) [8][12].

16 redundancies were identified across plans, but most are coordination needs
rather than true duplicated work. Actual effort saved by deduplication is ~1
hour [10]. The 4 ecosystem audit skills (hook-, script-, session-,
health-ecosystem-audit) are the most meaningful overlap -- both PS and PR modify
the same 4 files for different purposes [10].

### Theme 4: Propagation Is the Only S0 Debt Resolver

Of 32 S0 critical debt entries in MASTER_DEBT.jsonl (representing 8 unique
issues after deduplication), only 2 unique issues are resolved by any of the 7
plans [11]:

1. **DEBT-2121** (command injection in resolve-item.js) -- resolved by
   propagation Step 9 [11]
2. **DEBT-9295** (CI quality gates non-blocking) -- resolved by propagation Step
   2 [11]

The remaining 6 active S0 issues (hard-coded password patterns, OS command
execution, fast-xml-parser vulnerability, pull_request_target vulnerability,
client-side filtering) are NOT addressed by any plan [11]. The fast-xml-parser
DoS vulnerability (DEBT-7544) is the only S0 item with status=NEW and requires a
firebase-admin upgrade [11].

Propagation is also the highest debt-reduction ROI plan: it resolves 2 S0 items
and 3-5 S1 items in ~17 hours of work [11]. SWS has the highest total debt
impact (10-30 S1 items) but lowest per-session ROI given its 80-130 session
duration [11].

### Theme 5: Agent-Env Is the Critical Path Bottleneck

Despite having only 2-4 sessions of remaining work (Phases 4-5), agent-env is on
the critical path [9]. Every session of delay on agent-env P4-5 is a session of
delay on SWS start [9][14].

Phase 4 (Improvements) is the highest-risk remaining phase due to interactive
per-agent decisions, prompt rewrites for 36+ agents, and scope creep potential
[6]. The mean audit score from Phase 3 was 51/100 (grade F) across 36 agents,
validating the plan's existence [6].

Agent-env has the widest modification footprint of any plan: Phase 4 modifies up
to 37 agent definition files, and Phase 5 touches CLAUDE.md, 4+ skills,
pre-commit hooks, hook config, invocation tracking scripts, statusline,
session-end, and alerts -- 50+ files total [6].

Recommended mitigation: time-box Phase 4 to 2 sessions. If not complete,
remaining agents go to SWS Step 13 backlog [14][17].

### Theme 6: ROADMAP Alignment and the Meta Pipeline Question

The ROADMAP defines a Meta Pipeline sequence: Tooling & Infrastructure -> Code
Quality -> Data Effectiveness -> SWS, all at P0 priority [13]. However, only SWS
is among the 7 active plans. The first three Meta Pipeline items exist as plan
directories under `.planning/system-wide-standardization/` but are NOT being
actively orchestrated [13].

This creates an ambiguity: either (a) the Meta Pipeline sequence is still
enforced and SWS cannot start until three additional plans complete, or (b) it
has been superseded by SWS's internal sequencing [13]. The DIAGNOSIS.md treats
SWS as having no external dependencies except agent-env, and SWS's own PLAN.md
says CANON (Step 1) has zero external prerequisites [7][13].

Three plans (repo-cleanup, custom-statusline, cli-tools) have no ROADMAP
milestone alignment at all -- they are developer tooling and hygiene work [13].

---

## The Schedule

This is the primary deliverable: a concrete wave-by-wave execution plan.

### Pre-Condition: Merge planning-32326 to Main

Before any plan execution begins, the current `planning-32326` branch should be
merged to main [15]. This ensures all plan branches start from a main that
includes the orchestration research artifacts.

### Wave Schedule

| Wave        | Plans/Phases                                                                                                         | Duration (sessions) | Parallel?                                                                                                                                                     | Entry Criteria                                                                                       | Exit Criteria                                                                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wave 0**  | repo-cleanup                                                                                                         | 1                   | No                                                                                                                                                            | Clean working tree on main                                                                           | 7 orphans deleted, 7 docs updated, 3 deps removed, all tests pass. PR-1 merged.                                                                                                                   |
| **Wave 1a** | agent-env P4 + passive-surfacing (Steps 1-7,9) + custom-statusline (Steps 1-4) + propagation W1 (Steps 1-5)          | 2-3                 | Interleaved. AE gets session priority (critical path). SL has zero file conflicts. PR W1 has zero file conflicts with PS.                                     | Wave 0 complete (clean repo state)                                                                   | AE Phase 4 complete. PS Steps 1-7 complete (session-start.js stable, hook violations fixed). PR W1 complete (CI hardened, baseline created). SL Steps 1-4 complete (Go module + config + parser). |
| **Wave 1b** | agent-env P5 + cli-tools (all) + propagation W2-W4 + passive-surfacing (Steps 8-11) + custom-statusline (Steps 5-12) | 2-3                 | Interleaved. AE P5 highest priority (completes critical path gate). CLI after PS session-start.js done. PS Steps 8-11 before PR W2 on ecosystem audit skills. | Wave 1a PS session-start.js work complete. PS ecosystem audit categories committed before PR Step 8. | AE ALL 5 phases complete. CLI all steps complete. PR all 4 waves complete. PS all 11 steps complete. SL Steps 1-12 complete.                                                                      |
| **Wave 1c** | custom-statusline (Steps 13-14) [if not done in 1b]                                                                  | 0-2                 | Solo or interleaved                                                                                                                                           | Previous Wave 1 plans complete                                                                       | All non-SWS plans complete. All PRs merged to main.                                                                                                                                               |
| **Wave 2**  | SWS Chunk C1 (Step 1: CANON)                                                                                         | 6-10                | Solo (SWS-focused). Can safely overlap with Wave 1c tail since `.canon/` is a new isolated directory.                                                         | **HARD GATE:** agent-env ALL 5 phases complete and merged. All other plans recommended complete.     | `.canon/` directory exists with schemas, tenets, registry, enforcement, changelog, tests. canon-v0.1.0 tagged.                                                                                    |
| **Wave 3**  | SWS Chunks C2-C7 (Steps 2-21)                                                                                        | 74-120+             | Strictly sequential within SWS per D63. Non-SWS project work can interleave between chunks (D71).                                                             | Wave 2 complete (CANON exists and self-validates).                                                   | All 18 ecosystems at target maturity. CANON at v1.0.0. All health checkers passing. Checkpoint #4 passed.                                                                                         |

### Session Priority Protocol (Within Wave 1)

When starting any Wave 1 session, choose work in this order [14][17]:

1. **agent-env P4-5** -- always first if work remains. Critical path.
2. **passive-surfacing** -- second. Stabilizes shared resources
   (session-start.js, pre-commit) for other plans.
3. **propagation** -- third. Resolves 2 S0 debt items. Consolidates patterns SWS
   will standardize.
4. **cli-tools** -- fourth. Must wait for PS to complete session-start.js
   changes.
5. **custom-statusline** -- lowest priority. Fully independent. Can float to any
   session.

### PR Strategy

| PR    | Plans                                   | Branch                      | Estimated Files Changed | Merge Order                            |
| ----- | --------------------------------------- | --------------------------- | ----------------------- | -------------------------------------- |
| PR-0  | planning-32326 (orchestration research) | `planning-32326`            | Research artifacts only | First (before any plan execution)      |
| PR-1  | repo-cleanup                            | `cleanup/repo-hygiene`      | ~15 files               | After PR-0                             |
| PR-2  | passive-surfacing                       | `fix/passive-surfacing`     | ~21 files               | After PR-1                             |
| PR-3  | propagation W1 (Steps 1-5)              | `refactor/propagation`      | ~5-8 files              | Parallel with PR-2                     |
| PR-4  | propagation W2-W4 (Steps 6-14)          | `refactor/propagation`      | ~100-150 files          | After PR-2 (PS ecosystem audit skills) |
| PR-5  | cli-tools                               | `feature/cli-tools`         | ~15-20 files            | After PR-2 (PS session-start.js)       |
| PR-6  | custom-statusline                       | `feature/custom-statusline` | ~14 files               | Any time (fully independent)           |
| PR-7  | agent-env P4-5                          | `feature/agent-env-p4-p5`   | ~50+ files              | After PR-2 (PS shared files)           |
| PR-8+ | SWS (per checkpoint phase)              | `feature/sws-step-N`        | Varies per checkpoint   | After PR-7 (hard block)                |

### Duration Summary

| Scenario    | Wave 0 | Wave 1 | Wave 2 | Wave 3 | Total             |
| ----------- | ------ | ------ | ------ | ------ | ----------------- |
| Optimistic  | 1      | 5      | 6      | 74     | **86 sessions**   |
| Expected    | 1      | 7      | 8      | 97     | **113 sessions**  |
| Pessimistic | 1      | 8      | 10     | 120+   | **139+ sessions** |

At 2 sessions/day: **43-70+ working days**.

---

## Contradictions & Open Questions

### Contradictions Between Sources

| #   | Contradiction                                                                                          | Source A                                                          | Source B                                             | Resolution                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | SWS effort estimate: header says "40-60 sessions"                                                      | DIAGNOSIS.md [13]                                                 | S-07 effort table sums to 80-130 [7]                 | **S-07 table is authoritative.** The 40-60 header is stale, possibly from before review decisions increased scope.                                                                                                                            |
| 2   | CANON described as "external dependency" vs "SWS Step 1"                                               | DIAGNOSIS.md: "SWS gated on CANON framework (not yet built)" [13] | S-07: "CANON IS BUILT WITHIN THIS PLAN (Step 1)" [7] | **CANON is SWS Step 1.** DIAGNOSIS framing is misleading. SWS has no external hard blocks except agent-env.                                                                                                                                   |
| 3   | Agent-env "must complete ALL 5 phases before SWS Phase 1" vs CANON having "zero external dependencies" | Memory note [6]                                                   | SWS PLAN.md [7]                                      | **Both are correct at different granularities.** Agent-env informs SWS Step 13 (Agents), not Step 1 (CANON). CANON itself has no deps, but SWS broadly benefits from agent-env completing first. The memory note is the governing constraint. |
| 4   | Propagation file counts: plan says 9 sanitizeError copies, grep finds 55 files                         | PLAN.md [5]                                                       | Filesystem grep [5]                                  | **Both partially correct.** Plan counts "files needing modification" after filtering. Grep counts all files containing the pattern including tests, imports, and archives. Actual work scope needs triage during execution.                   |
| 5   | Effort sizing mismatch for passive-surfacing: PLAN.md says L (~6-8h), DIAGNOSIS says M (1-2 sessions)  | PLAN.md [4]                                                       | DIAGNOSIS.md [13]                                    | **Not contradictory.** L estimate is serial execution time. M (1-2 sessions) reflects parallelized execution with 8 agents.                                                                                                                   |
| 6   | Meta Pipeline sequence (T&I -> CQ -> DE -> SWS) vs DIAGNOSIS listing only SWS                          | ROADMAP.md [13]                                                   | DIAGNOSIS.md [13]                                    | **Ambiguous -- decision point for user.** Either Meta Pipeline is still enforced (blocking SWS start) or superseded by SWS internal sequencing.                                                                                               |
| 7   | Script count: plan says 37 scripts in `scripts/debt/`, filesystem shows 30                             | SWS PLAN.md [7]                                                   | Filesystem verification [7]                          | **Filesystem is ground truth.** Scripts may have been removed since plan was written (2026-03-04).                                                                                                                                            |

### Open Questions

1. **Is the Meta Pipeline sequence (T&I -> CQ -> DE -> SWS) still enforced?** If
   yes, SWS cannot start until three additional plans complete. If no, the
   7-plan schedule proceeds as recommended. [13]

2. **How should the `.husky/pre-commit` 4-way modification be formally
   coordinated?** A section-based ownership protocol is recommended but not yet
   formalized. [8][17]

3. **What happens when SWS scope grows during execution?** The user confirmed
   SWS is a "plan for making plans" [18]. The schedule allows interleaving
   between SWS chunks, but newly discovered work may add edges to the dependency
   graph.

4. **Should the 3 remaining unaddressed active S0 issues (hard-coded passwords,
   OS command execution, fast-xml-parser) get their own plan?** Currently no
   plan addresses them. [11]

5. **What is the actual file count for propagation Steps 6-7?** Plan says 9+23
   inline copies, grep finds 55+34. Triage is needed before W2 execution. [5]

---

## Confidence Assessment

| Category                                | Confidence      | Basis                                                                                                                                                                  |
| --------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency graph (1 hard, 5 soft)       | **HIGH**        | Verified across 3 sources: memory note, STEP_3_14_COVERAGE_AUDIT.md, PLAN.md. All dependency claims cite specific step-level evidence. No cycles found. [9]            |
| Wave schedule (4 waves)                 | **HIGH**        | Respects all hard dependencies, file overlap constraints, and synergy recommendations. Verified in convergence loops by S-09, S-14, S-15. [9][14][15]                  |
| SWS effort (80-130+ sessions)           | **MEDIUM**      | Effort table sums are grounded but user confirmed scope grows. Actual velocity unknown until execution begins. Rolling wave planning recommended. [7][14][18]          |
| File overlap map (5 critical resources) | **HIGH**        | All 16 files verified against filesystem with ls/Glob. All plan modifications cross-referenced across 7 findings files. [8]                                            |
| Per-plan effort estimates               | **MEDIUM-HIGH** | Estimates come directly from plans' own effort tables, verified against step detail and file complexity. Some plans lack per-step estimates (custom-statusline). [1-7] |
| Debt resolution impact                  | **HIGH**        | All DEBT IDs spot-checked (15/15 match). File-to-plan mappings verified against actual plan steps, not just file proximity. [11]                                       |
| Scheduling algorithm analysis           | **HIGH**        | Algorithm descriptions verified against 13 external sources. Applied schedule verified against all prior findings in 5-pass convergence loop. [14]                     |
| Synergy savings (~7%)                   | **MEDIUM**      | Savings are estimates based on SWS session avoidance. Actual savings depend on SWS execution patterns. Primary value is risk reduction, not hour savings. [10]         |
| Risk assessments                        | **HIGH**        | All 5 top failure scenarios grounded in specific plan content and findings. Rollback strategies verified for feasibility. [17]                                         |
| ROADMAP alignment                       | **MEDIUM**      | Gap identification is HIGH confidence. Interpretation of Meta Pipeline enforcement is genuinely ambiguous. [13]                                                        |

---

## Recommendations

### R-1: Execute repo-cleanup first (Wave 0) [HIGH confidence]

Repo-cleanup is zero-risk (all changes verified, 2 missing files already
documented) [1][17], easy to rollback (2 git commits) [17], and benefits 5 other
plans by removing orphans and fixing stale docs [1][10]. It takes 1 session
(60-90 min) and serves as a confidence builder for the orchestration process
[17]. DIAGNOSIS.md explicitly recommends it goes first [13].

### R-2: Prioritize agent-env P4-5 above all other Wave 1 work [HIGH confidence]

Agent-env is the only plan on the critical path [9]. Every session of delay on
P4-5 is a session of delay on SWS start. Time-box Phase 4 to 2 sessions;
remaining agents go to SWS Step 13 backlog [14][17]. This protects the critical
path while acknowledging Phase 4's scope creep risk [6][17].

### R-3: Run passive-surfacing early in Wave 1 [HIGH confidence]

PS stabilizes 3 critical shared resources (session-start.js, pre-commit,
ecosystem audit skills) before other plans modify them [8][12]. It fixes 33
violations that would inflate SWS scope by ~1-2 sessions [4][10]. Its
single-commit strategy (D17) provides clean rollback [4][17].

### R-4: Split propagation into W1 (low risk) and W2-4 (higher risk) [HIGH confidence]

Wave 1 (Steps 1-5) is 5 surgical fixes with near-zero risk [5][17]. Wave 2+
involves mass refactoring across 100+ files -- the highest-risk non-SWS work
[5][17]. Splitting lets W1's S0-level debt resolution value be captured
immediately while W2-4 waits for shared-resource stabilization [17].

### R-5: Enforce per-wave commits for propagation [HIGH confidence]

Without per-wave commits, rolling back Wave 2 is a 275-file revert [17].
Per-wave commits enable independent rollback of each wave. This is a
recommendation, not yet a plan requirement -- formalize it before execution
[17].

### R-6: Merge planning-32326 to main before plan execution begins [MEDIUM confidence]

Plan execution branches should start from a main that includes orchestration
research artifacts [15]. If not merged first, plan branches will lack
`.research/plan-orchestration/` context [15].

### R-7: Establish a formal section-ownership protocol for `.husky/pre-commit` [MEDIUM confidence]

Four plans modify this file for different purposes. Each plan should declare
which lines/sections it owns to prevent accidental overlap [8][17]. A pre-commit
health check (test `git commit` after each modification) should be mandatory
[17].

### R-8: Use rolling wave planning for SWS [MEDIUM confidence]

SWS has a 50-session uncertainty range (80-130) that is a floor due to scope
growth [7][14][18]. Measure actual velocity for the first 10 SWS sessions, then
re-estimate total. Plan Wave 0-1 in detail; plan SWS at chunk level with
refinement at each checkpoint [14][16].

### R-9: Address unresolved S0 debt items outside the 7-plan scope [LOW confidence]

3 active S0 issues are not covered by any plan [11]: hard-coded password
patterns (likely false positives needing review/suppression), OS command
execution in check-review-needed.js, and fast-xml-parser DoS vulnerability
(requires firebase-admin upgrade). These should be triaged separately -- they
may warrant a dedicated remediation task.

---

## Unexpected Findings

1. **The scheduling problem is trivially solved.** The 100:1 task duration ratio
   and shallow dependency graph (depth=2) make formal scheduling algorithms
   overkill [14]. The problem degenerates into: "run small tasks first, then run
   the big task." Algorithms like Coffman-Graham, Hu's, and RCPSP are
   disqualified by basic problem characteristics. The "star graph with one heavy
   leaf" pattern is a known easy case in scheduling theory [14].

2. **Passive-surfacing's 33 violations exist OUTSIDE the MASTER_DEBT system.**
   These guardrail #6 violations are tracked in the plan's own research, not in
   MASTER_DEBT.jsonl. The TDMS system has no "passive-surfacing" or
   "fire-and-forget" category [11]. This reveals a coverage gap: behavioral
   compliance violations are invisible to debt analytics.

3. **SWS planning directory is already a CANON prototype.** The planning
   artifacts (decisions.jsonl, tenets.jsonl) use JSONL-first with generated MD
   views -- exactly the pattern CANON codifies [7]. CANON is partially validated
   by the process that designed it [13].

4. **13 of 32 S0 debt items are already RESOLVED.** The project has been
   actively addressing critical security debt (App Check, journalEntries).
   Remaining active S0 items are mostly false positives (SonarCloud hotspots),
   dependency issues, or CI configuration gaps [11].

5. **Agent quality scores average 51/100 (grade F).** Phase 3 audit of 36 agents
   revealed systemic quality issues [6]. This validates the agent-env plan's
   existence and raises the priority of Phase 4 improvements.

6. **SWS's inter-ecosystem contract system (D74) could be valuable for
   plan-orchestration itself** -- declaring dependencies between plans, not just
   ecosystems [7].

7. **The `ensure-fnm.sh` wrapper overhead is eliminated by custom-statusline.**
   The current invocation chain (`bash ensure-fnm.sh node statusline.js`,
   measured at 47-470ms) is replaced by a direct Go binary call [2]. This is a
   significant performance win beyond widget rendering speed.

---

## Challenges

### Contrarian Findings (CONTRA-01: Disconfirmation)

12 claims challenged against source plan files. **7 CONFIRMED, 5 WEAKENED, 0
REFUTED.**

Key weakenings:

- **cli-tools effort underestimated**: Plan says "multi-session" with 25 steps
  across 8 phases requiring two-locale installation. Research estimated 2
  sessions; corrected to 3-4 sessions.
- **"Repo-cleanup benefits 5 plans" is overstated**: Benefits are real but minor
  for most plans (removing orphan files they'd work around anyway). The
  strongest benefit is to propagation (stale baselines) and SWS (cleaner
  starting state).
- **Meta Pipeline sequence may still apply**: T&I PLAN.md contains
  forward-compatibility requirements for SWS (T7, T18, D72), suggesting the Meta
  Pipeline was designed as a coherent sequence. Whether it's still enforced is a
  user decision.
- **"Passive-surfacing saves 1-2 SWS sessions"**: Grounded in violation count
  (33) but the actual session savings are speculative — SWS might flag them
  differently.
- **SWS 80-130 estimate methodology**: S-07's independent summation (80-137) is
  more reliable than the stale header (40-60), but per-step estimates themselves
  are plan-author guesses.

Full details: `challenges/CONTRARIAN.md`

### Contrarian Findings (CONTRA-02: Methodology)

**Overall verdict: SOUND.** No significant methodological flaws.

3 actionable concerns:

1. **Confidence conflation**: 2-3 MEDIUM claims are recommendations (opinions)
   tagged as factual claims. Minor presentation issue.
2. **No operational tooling**: The schedule lacks a concrete tool/checklist for
   navigating Wave 1 interleaving constraints session-by-session.
3. **SWS start timing underweighted**: Given SWS scope growth, the argument for
   starting SWS earlier (to discover scope sooner) deserves analysis against the
   prep-work-first strategy. This is the single most important unresolved
   strategic question.

Full details: `challenges/METHODOLOGY.md`

### Outside-the-Box Insights (OTB-01: Adjacent Domains)

15 cross-domain insights from 7 adjacent domains. Top 5 actionable:

1. **WIP=1 in Wave 1** (from solo-developer research): Eliminate
   context-switching between plans within a session. Pick one plan per session,
   finish it, move on. HIGH.
2. **SWS interrupt protocol** (from construction management): Formalize how
   emergent work during SWS gets handled — queue, absorb, or defer. HIGH.
3. **Decouple statusline/cli-tools from SWS gate**: They have zero SWS synergy;
   no reason to block SWS start on them. HIGH.
4. **Scope-reduction gates at SWS checkpoints** (from Second System Effect): SWS
   matches Brooks's "most dangerous system" pattern (92 decisions, 18
   ecosystems, meta-framework). Add explicit scope-reduction escape valves, not
   just timeline gates. HIGH.
5. **Use AI Agent Teams for Wave 1 parallelizable tasks** (from OS scheduling):
   agent-env P4 and propagation W2 have internal parallelism that agents could
   exploit. MEDIUM.

Full details: `challenges/OUTSIDE_THE_BOX.md`

### Outside-the-Box Insights (OTB-02: Second-Order Effects)

7 second-order effects analyzed. Most impactful:

1. **Feature drought**: Session #65 declared "feature development unblocked" 171
   sessions ago. Zero user-facing features shipped since. This schedule extends
   the drought to 300+ sessions. HIGH.
2. **Optimizing 1% of remaining work**: The 7-plan sequencing saves ~6-10
   sessions out of ~709 remaining to product completion. The highest-leverage
   optimization is the ROADMAP dependency chain itself, not plan sequencing.
   HIGH.
3. **M1.6 opportunity**: At 75% complete and paused, M1.6 is the lowest-hanging
   fruit for user-facing value. ~5-8 sessions could complete it during an SWS
   interleaving point. HIGH.
4. **SWS scope explosion risk**: If SWS generates 5 sub-plans of 20 sessions
   each, total timeline becomes 200+ sessions. A scope cap or "good enough"
   threshold is recommended. MEDIUM.
5. **Context decay**: Over 100+ sessions, earlier decisions may need
   revalidation. A periodic re-assessment cadence is recommended. MEDIUM.

Full details: `challenges/SECOND_ORDER.md`

---

## Sources

### Tier 1: Ground Truth (Filesystem-verified)

| #    | Source                                                                 | Type                   | Trust   | Date       |
| ---- | ---------------------------------------------------------------------- | ---------------------- | ------- | ---------- |
| [1]  | `.research/plan-orchestration/findings/S-01-repo-cleanup.md`           | Plan inventory         | HIGH    | 2026-03-24 |
| [2]  | `.research/plan-orchestration/findings/S-02-custom-statusline.md`      | Plan inventory         | HIGH    | 2026-03-24 |
| [3]  | `.research/plan-orchestration/findings/S-03-cli-tools.md`              | Plan inventory         | HIGH    | 2026-03-24 |
| [4]  | `.research/plan-orchestration/findings/S-04-passive-surfacing.md`      | Plan inventory         | HIGH    | 2026-03-24 |
| [5]  | `.research/plan-orchestration/findings/S-05-propagation.md`            | Plan inventory         | HIGH    | 2026-03-24 |
| [6]  | `.research/plan-orchestration/findings/S-06-agent-env.md`              | Plan inventory         | HIGH    | 2026-03-24 |
| [7]  | `.research/plan-orchestration/findings/S-07-sws.md`                    | Plan inventory         | HIGH    | 2026-03-24 |
| [8]  | `.research/plan-orchestration/findings/S-08-file-overlaps.md`          | Cross-cutting analysis | HIGH    | 2026-03-24 |
| [9]  | `.research/plan-orchestration/findings/S-09-dependency-graph.md`       | Cross-cutting analysis | HIGH    | 2026-03-24 |
| [10] | `.research/plan-orchestration/findings/S-10-redundancy-synergy.md`     | Cross-cutting analysis | HIGH    | 2026-03-24 |
| [11] | `.research/plan-orchestration/findings/S-11-master-debt.md`            | Cross-cutting analysis | HIGH    | 2026-03-24 |
| [12] | `.research/plan-orchestration/findings/S-12-skill-hook-impact.md`      | Domain analysis        | HIGH    | 2026-03-24 |
| [13] | `.research/plan-orchestration/findings/S-13-roadmap-canon.md`          | Domain analysis        | HIGH    | 2026-03-24 |
| [14] | `.research/plan-orchestration/findings/S-14-scheduling-theory.md`      | Scheduling theory      | HIGH    | 2026-03-24 |
| [15] | `.research/plan-orchestration/findings/S-15-doc-git-strategy.md`       | Domain analysis        | HIGH    | 2026-03-24 |
| [16] | `.research/plan-orchestration/findings/S-16-sws-decomposition.md`      | Domain analysis        | HIGH    | 2026-03-24 |
| [17] | `.research/plan-orchestration/findings/S-17-risk-rollback.md`          | Risk analysis          | HIGH    | 2026-03-24 |
| [18] | `.research/plan-orchestration/findings/CONSTRAINT-sws-scope-growth.md` | User constraint        | HIGHEST | 2026-03-24 |

### Tier 2: Plan Documents (Verified via filesystem)

| #    | Source                                                       | Type            | Trust   | Date       |
| ---- | ------------------------------------------------------------ | --------------- | ------- | ---------- |
| [19] | `.planning/plan-orchestration/DIAGNOSIS.md`                  | Diagnosis       | HIGH    | 2026-03-23 |
| [20] | `.planning/system-wide-standardization/PLAN.md` (PLAN-v3.md) | SWS plan        | HIGH    | 2026-03-04 |
| [21] | `.planning/system-wide-standardization/DECISIONS.md`         | 92 decisions    | HIGH    | 2026-03-04 |
| [22] | Memory: `project_agent_env_analysis.md`                      | Phase status    | HIGH    | 2026-03-19 |
| [23] | `ROADMAP.md`                                                 | Product roadmap | HIGHEST | 2026-03-20 |

### Tier 3: External References (Scheduling Theory)

| #    | Source                                                | Type            | Trust  |
| ---- | ----------------------------------------------------- | --------------- | ------ |
| [24] | Critical Path Method -- Wikipedia                     | Encyclopedia    | MEDIUM |
| [25] | Coffman-Graham Algorithm -- Wikipedia                 | Encyclopedia    | MEDIUM |
| [26] | Fifty Years of RCPSP Research -- ScienceDirect (2025) | Academic survey | HIGH   |
| [27] | Hu's Precedence Tree Scheduling Proof -- NJIT (1984)  | Academic paper  | HIGH   |
| [28] | Rolling-Wave Planning -- Wikipedia                    | Encyclopedia    | MEDIUM |

---

## Methodology

### Research Design

- **Depth:** L3 (Investigation) -- 17 searcher agents across 4 waves
- **Wave 1 (7 agents):** Plan inventory specialists (S-01 through S-07). Each
  agent read one plan's PLAN.md, DECISIONS.md, and RESEARCH_OUTPUT.md, verified
  all file paths against filesystem, and produced a step inventory with effort,
  risk, and dependency analysis.
- **Wave 2 (4 agents):** Cross-cutting analysts (S-08 through S-11). Consumed
  all 7 inventory findings plus DIAGNOSIS.md. Produced file overlap map,
  dependency graph, redundancy/synergy analysis, and MASTER_DEBT
  cross-reference.
- **Wave 3 (5 agents):** Domain specialists (S-12 through S-16). Consumed all
  prior findings. Produced skill/hook impact analysis, ROADMAP/CANON alignment,
  scheduling theory evaluation, doc cascade/git strategy, and SWS decomposition.
- **Wave 4 (1 agent):** Risk analyst (S-17). Consumed all prior findings.
  Produced risk assessment, rollback blast radius, failure scenarios, and
  stop-loss criteria.
- **User constraint:** CONSTRAINT-sws-scope-growth.md injected between Waves 3
  and 4.
- **Synthesis (this document):** 1 synthesizer agent consumed all 18 findings
  files.

### Verification

Every findings file included a convergence loop with 4-6 verification passes.
Across all 17 searcher agents:

- **File path spot-checks:** 150+ paths verified against filesystem (all passed)
- **Step count verification:** All 7 plans' step counts match inventory tables
- **Effort estimate grounding:** All estimates traceable to plan text or
  filesystem complexity
- **Dependency verification:** All dependency claims cite specific step-level
  evidence
- **Cross-file consistency:** Cross-cutting analysts (S-08 through S-17)
  verified their claims against all prior findings

### Confidence Methodology

- If 2+ searchers found the same claim independently: confidence increased
- If 2 searchers found contradicting claims: confidence capped at MEDIUM
- If only 1 searcher found a claim: confidence stays as-is
- Filesystem-verified claims: HIGH regardless of searcher count
- All claims against training data marked UNVERIFIED (none in this report -- all
  claims are filesystem-grounded)
