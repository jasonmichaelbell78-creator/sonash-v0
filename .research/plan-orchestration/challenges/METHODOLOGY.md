# Methodology Critique: Plan Orchestration Research

**Contrarian Agent:** deep-research-searcher (methodology challenge strategy)
**Date:** 2026-03-24
**Target:** RESEARCH_OUTPUT.md, claims.jsonl (34 claims), 18 findings files
**Convergence Passes:** 3 (corrections documented at end)

---

## Research Design Critique

### 1. Was the 17-agent decomposition the right approach?

**Verdict: SOUND, with one structural concern.**

The 4-wave structure (7 plan inventories -> 4 cross-cutting -> 5 domain -> 1
risk) is a well-designed research pipeline. Each wave consumed prior findings,
building layered analysis. The plan inventory agents (S-01 through S-07) each
produced verifiable, filesystem-grounded outputs. The cross-cutting agents
(S-08 through S-11) synthesized across those inventories, and the domain
specialists (S-12 through S-16) added theoretical and strategic context.

**Structural concern: Wave 2+ agents were structurally unable to disagree with
Wave 1.** The Wave 2 agents consumed Wave 1 findings as inputs. If a Wave 1
agent made an error (e.g., wrong step count, missed dependency), Wave 2 agents
would propagate it unless they independently verified against the filesystem.
S-09 (dependency graph) did perform independent verification -- its convergence
loop CL-5 re-examined the "all 5 phases" constraint directly against the memory
note and PLAN.md. S-08 (file overlaps) verified against the filesystem. But
S-10 (redundancy/synergy) appears to have taken Wave 1 step-level claims at
face value -- its 16 redundancies and 14 synergies are based on step
descriptions from S-01 through S-07 without independent re-reading of the plan
files.

**Is this actually a problem?** Partially. The Wave 1 agents were thorough --
every S-01 through S-07 findings file includes 4-6 pass convergence loops with
filesystem verification. The risk of Wave 1 error propagation is low in
practice, even if the design does not structurally prevent it.

**Missing alternative: A "red team" agent in Wave 2.** One agent whose sole job
was to spot-check Wave 1 claims against the raw plan files would have added a
structural verification layer. The current design relies on convergence loops
within each agent rather than cross-agent verification.

### 2. Were the right sub-questions asked?

**Verdict: MOSTLY COMPLETE, with 3 notable gaps.**

The research covers: plan inventories, dependencies, file overlaps,
redundancies/synergies, debt impact, skill/hook impact, ROADMAP alignment,
scheduling theory, git strategy, SWS decomposition, and risk assessment. This
is comprehensive for the stated question ("how to sequence 7 plans").

**Gap 1: No agent analyzed VELOCITY or CAPACITY.** The research assumes 2
sessions/day but never examines whether this is realistic. How long are
sessions? How many sessions per week does the user actually achieve? Historical
session data exists in `data/ecosystem-v2/` but no agent was tasked with mining
it. This matters because the duration estimates (86-139 sessions = 43-70
working days) are load-bearing for planning decisions.

**Gap 2: No agent examined PLAN STALENESS.** Several plans were written weeks
or months before this research. The repo-cleanup plan has a wrong file path
(S-01 caught this), and the propagation plan has file count mismatches (S-05
caught this). But no agent systematically assessed: "How stale is each plan?
Should any be re-researched before execution?" The DIAGNOSIS.md SWS effort
figure (40-60 sessions) was stale -- S-07 caught this. But the catch was
incidental, not systematic.

**Gap 3: No agent addressed the USER's cognitive load.** With 7 plans, 5
critical shared files, a wave schedule with sub-waves and priority protocols --
how does a solo developer actually NAVIGATE this during daily work? The
research produces a schedule but no operational tooling. An agent focused on
"how does the user pick what to work on each session?" would have been
valuable. The "session priority protocol" in RESEARCH_OUTPUT.md (Section: The
Schedule) is the closest thing, but it emerged from S-14 as a secondary
finding, not from a dedicated analysis.

### 3. Is 15 dimensions overkill for a "trivially solved" problem?

**Verdict: THE RESEARCH ANSWERED ITS OWN QUESTION.**

This is a genuine tension. The research concludes the scheduling problem is
"trivially solved" (C-013, HIGH confidence) with a "star graph with one heavy
leaf" pattern. If it is truly trivial, why did it take 17 agents and 40,000+
words?

The answer: **the research DISCOVERED the problem was trivial; it could not
have assumed it.** Before the research:

- DIAGNOSIS.md understated SWS effort by 2x (40-60 vs 80-130 sessions)
- DIAGNOSIS.md incorrectly framed CANON as an external dependency
- Nobody had mapped the 5 critical shared file conflicts
- Nobody had verified the dependency graph was so shallow (1 hard dep)
- The Meta Pipeline sequence ambiguity was unexamined

The "trivially solved" conclusion is a FINDING, not a precondition. The
research effort was justified to DISCOVER that simplicity. That said, a lighter
research design (e.g., 10 agents instead of 17) could have reached the same
conclusion. The 5 domain specialists (S-12 through S-16) added polish and
validation but did not change the core conclusions established by S-01 through
S-11. S-14 (scheduling theory) was the most valuable domain agent because it
formalized the "trivially solved" insight. S-12 (skill/hook impact) and S-15
(doc/git strategy) added practical value. S-16 (SWS decomposition) and S-13
(ROADMAP/CANON) were valuable for completeness but not essential.

---

## Agent Quality Assessment

### 4. Did Wave 1 agents read plans thoroughly or skim?

**Spot-check: S-01 (repo-cleanup) vs actual PLAN.md.**

S-01 reports 14 steps. The PLAN.md header structure confirms this (Steps 1-14).
S-01 caught:
- The wrong file path for rotation-policy.json (Step 6) -- this requires
  actually reading the script source
- The knip.json discrepancy (2 suppressions, not 3) -- requires reading the
  file
- 2 missing files (MASTER_DEBT.jsonl.bak, deep-plan-review-lifecycle.state.json)

**Verdict for S-01: THOROUGH.** This agent clearly read the plan and verified
against the filesystem. It caught errors the plan author missed.

**Spot-check: S-06 (agent-env) vs actual PLAN.md.**

S-06 reports 23 steps across 5 phases plus an audit checkpoint. The plan
structure confirms this. S-06 caught:
- The agent count discrepancy (36 in plan vs 37 on disk)
- The decision count (28) and its evolution during execution
- Phase 4 risk factors (interactive decisions, scope creep)
- All file path verifications passed (8/8 spot-checks)

**Verdict for S-06: THOROUGH.** Convergence loop included 5 passes. All claims
grounded.

**Spot-check: S-07 (SWS).**

S-07 reports 21 steps with 10 sub-steps in Step 1 = 30 distinct work units. It
caught the effort discrepancy between the DIAGNOSIS header (40-60) and the plan
table (80-130). It verified that 30 of 37 scripts in `scripts/debt/` exist
(plan claimed 37, filesystem shows 30 -- 7 removed since plan was written).

**Verdict for S-07: THOROUGH.** The SWS plan is the most complex (1374 lines,
92 decisions) and S-07 produced a 33KB findings file with detailed step-level
analysis.

**Overall Wave 1 quality: HIGH.** All three spot-checked agents demonstrate
genuine plan reading, filesystem verification, and error detection. These are
not summaries or skims.

### 5. Did Wave 2 agents actually cross-reference, or just summarize Wave 1?

**Spot-check: S-09 (dependency graph).**

S-09 constructed the dependency graph by cross-referencing:
- Memory note (for the hard dependency)
- STEP_3_14_COVERAGE_AUDIT.md (for agent-env/SWS relationship)
- All 7 Wave 1 inventories (for soft dependencies)
- Filesystem (for shared file conflicts)

S-09's convergence loop CL-5 independently re-examined whether "all 5 phases"
was correct by analyzing what each phase contributes to SWS. This is genuine
analysis, not summary. S-09 also CORRECTED the DIAGNOSIS.md's CANON framing
(calling it "misleading") and added the shared file conflict dimension that
DIAGNOSIS.md missed entirely.

**Spot-check: S-08 (file overlaps).**

S-08 built its overlap matrix from the "Files Touched" columns in S-01 through
S-07, then verified every file path against the filesystem. It classified
conflicts by severity (HIGH/MEDIUM/LOW) and recommended ordering for each
conflict zone. The 16-file overlap matrix includes file sizes verified by `ls`.

**Verdict: Wave 2 agents performed genuine cross-referencing.** S-09 and S-08
both added analytical dimensions that did not exist in Wave 1 findings. They
are not summaries.

### 6. Was S-14 (scheduling theory) honest about algorithms being overkill?

**Verdict: YES, and it showed its work.**

S-14 evaluated 9 scheduling approaches (CPM, Coffman-Graham, Hu's, RCPSP,
List Scheduling, Resource Leveling, Resource Smoothing, Topological Sort,
Rolling Wave Planning). For each algorithm, it assessed applicability against
5 problem characteristics (7 tasks, 1 hard dep, 100:1 duration ratio, 1
processor, 5 shared resources).

The "algorithms are overkill" conclusion is well-grounded:
- Coffman-Graham assumes unit execution times -- violated by 100:1 ratio
- Hu's assumes tree-structured DAGs -- violated (multiple roots)
- RCPSP is NP-hard for 7 tasks -- formulation overhead exceeds benefit
- The problem degenerates because SWS = 85% of total effort

S-14 did NOT "phone it in." It produced a 37KB findings file with external
source verification (13 sources, including academic papers). The convergence
loop (5 passes) verified algorithm descriptions against sources, checked the
applied schedule against all prior findings, and corrected 3 issues in its own
draft.

**However:** S-14 could be accused of setting up straw men. Nobody would
seriously propose using Hu's algorithm or RCPSP for 7 tasks. The survey is
more academic exercise than practical decision point. The real value of S-14 is
the sensitivity analysis (Section 4) and the formalization of the priority
protocol (Section 3.2), not the algorithm survey itself.

---

## Synthesis Fidelity Check

### 7. Does RESEARCH_OUTPUT.md faithfully represent all 18 findings?

**Spot-check methodology: Compare 5 findings files against their synthesis
representation.**

| Finding | In Synthesis? | Faithful? | Notes |
|---------|--------------|-----------|-------|
| S-01 (wrong rotation-policy path) | Yes (C-021) | Yes | Path error correctly reported |
| S-06 (Phase 4 is highest risk) | Yes (Theme 5) | Yes | Risk accurately characterized with 51/100 audit score |
| S-09 (1 hard dependency) | Yes (Theme 1) | Yes | Core finding of the research |
| S-11 (2/32 S0 resolved) | Yes (Theme 4) | Yes | Propagation correctly identified as only S0 resolver |
| S-14 (trivially solved) | Yes (Unexpected Finding #1) | Yes | Algorithm overkill conclusion preserved |

**Missing or underrepresented findings:**

1. **S-12's cascade ordering details** are compressed. S-12 produced a detailed
   24-skill modification map and 13-hook modification map. The synthesis
   references S-12 but condenses it into a few mentions of session-start.js
   and pre-commit ordering. This is reasonable compression -- the detail exists
   in the findings file for anyone who needs it.

2. **S-15's branch naming and PR strategy** is represented in the schedule's
   PR table but the rationale for branch isolation is compressed. Again,
   reasonable.

3. **S-13's Meta Pipeline ambiguity** is faithfully represented as
   Contradiction #6 and Open Question #1. The synthesis does NOT resolve this
   ambiguity, which is correct -- it is genuinely unresolved.

**Verdict: The synthesis is faithful.** No cherry-picking detected. The
compression from 40,000 words to 10,000 words necessarily loses detail, but
the core claims, contradictions, and confidence levels are accurately
represented.

### 8. Are the 7 contradictions real?

**Assessment of each:**

| # | Contradiction | Real? | Assessment |
|---|--------------|-------|------------|
| 1 | SWS effort 40-60 vs 80-130 | YES | DIAGNOSIS header is demonstrably stale |
| 2 | CANON as external dep vs Step 1 | YES | DIAGNOSIS framing is genuinely misleading |
| 3 | "All 5 phases" vs "zero external deps" | PARTIAL | This is a granularity difference, not a true contradiction. Both are correct at different scopes. The synthesis correctly explains this. |
| 4 | Propagation file counts (9 vs 55) | YES | Plan counts vs grep counts are genuinely different. The synthesis explains both are "partially correct" at different filtering levels. |
| 5 | PS effort L vs M | NO | This is not a contradiction -- it is two different measurement units (serial hours vs parallel sessions). The synthesis says "Not contradictory" itself -- so why is it listed as a contradiction? |
| 6 | Meta Pipeline sequence enforced? | YES | Genuinely ambiguous. No resolution available without user decision. |
| 7 | Script count 37 vs 30 | YES | Filesystem changed since plan was written |

**Verdict: 5 of 7 are real contradictions. 1 is a granularity difference
correctly explained. 1 (contradiction #5) is not a contradiction at all and
should not have been listed.** The synthesis itself notes "Not contradictory"
for #5 but still includes it in the contradictions table. This inflates the
contradiction count by ~14%.

### 9. Is the confidence distribution well-calibrated?

**Distribution: 25 HIGH, 9 MEDIUM, 0 LOW, 0 UNVERIFIED.**

**Concern: Zero LOW and zero UNVERIFIED claims is suspicious.** In any research
with 34 claims, finding zero low-confidence claims suggests either:
(a) The research is exceptionally well-grounded, OR
(b) The confidence methodology has an upward bias.

**Evidence for (a):** Every claim is filesystem-grounded. The research used a
codebase profile where the filesystem IS ground truth. Unlike web research
where sources may be unreliable, reading a file and counting its steps is
deterministic. When the confidence methodology says "Filesystem-verified claims:
HIGH regardless of searcher count," this produces systematically high
confidence for a codebase-profile investigation.

**Evidence for (b):** Some MEDIUM claims could arguably be LOW:
- C-012 (synergy savings ~7%) rests on estimates of SWS session avoidance
  that are themselves estimates. The "~7%" figure compounds multiple
  uncertainties. MEDIUM is generous.
- C-031 (rolling wave planning "most valuable") is an opinion, not a
  verifiable claim. MEDIUM confidence for an opinion statement is odd.
- C-032 (time-box agent-env P4 to 2 sessions) is a recommendation, not a
  finding. Assigning MEDIUM confidence to a recommendation conflates
  "confidence in the evidence" with "confidence in the advice."

**Verdict: SLIGHTLY INFLATED but not dramatically.** The zero-LOW distribution
is explained by the codebase research profile. However, the methodology does
not distinguish well between factual claims (step counts, file existence) and
evaluative claims (savings estimates, priority recommendations). The HIGH
claims are genuinely HIGH. The MEDIUM claims include 2-3 that are more like
opinions or recommendations and should arguably be flagged differently.

---

## Schedule Walkthrough

### 10. Does the proposed schedule actually work?

**Walking through wave by wave:**

**Wave 0 (repo-cleanup, 1 session):** Start from clean main. Delete 7 files,
archive 4, fix rotation policy, update indexes, remove 3 deps, fix test
comments, update 7 docs. Two commits. Verify. Push.

Feasible? YES. This is well-defined mechanical work. The wrong path for
rotation-policy.json (caught by S-01) is the only trap, and it is documented.

**Wave 1a (agent-env P4 + PS Steps 1-7 + SL Steps 1-4 + PR W1):** This is
where the schedule gets complex. Four plans interleaved across 2-3 sessions.

- AE P4 involves interactive decisions for 36+ agents. The schedule says "2
  sessions max." If the user opens one session and starts AE P4, how do they
  know when to switch to PS or SL or PR? The session priority protocol says
  "AE first if work remains" -- so every session starts with AE work, then
  switches to something else. This is workable but requires discipline.

- PS Steps 1-7 are parallelizable (each fixes a different hook file). But
  they must complete before CLI starts on session-start.js.

- SL Steps 1-4 are truly independent (Go toolchain setup, project init,
  config format). Zero file conflicts.

- PR W1 Steps 1-5 are surgical fixes in different files. Zero conflicts with
  PS or SL.

Feasible? YES, with one caveat: the "interleaving" assumes the user can
context-switch between 4 plans within a session. Each plan switch requires
re-reading the plan, understanding where work left off, and navigating
different file domains. For a solo developer, this context-switching cost may
make "1 plan per session" more efficient than "2-3 plans per session."

**Wave 1b (AE P5 + CLI + PR W2-W4 + PS Steps 8-11 + SL Steps 5-12):** Five
plans, some with ordering constraints (CLI after PS on session-start.js, PS
Steps 8-11 before PR Step 8 on ecosystem audit skills).

The constraint graph within Wave 1b is:
- PS Steps 8-11 must complete before PR Step 8
- PS session-start.js must be done before CLI starts
- AE P5 must complete (critical path gate)
- SL has no constraints

This is manageable but the user needs to track 3 ordering constraints
simultaneously across interleaved sessions.

Feasible? YES, but tight. The schedule assumes the user can track these
constraints without tooling. A simple checklist or gate-tracking mechanism
would help.

**Wave 1c (SL Steps 13-14 if not done):** Tail work. Trivial.

**Wave 2 (SWS Step 1, CANON):** Hard-gated on AE P5 completion. CANON creates
`.canon/` directory (new, isolated). Can overlap with Wave 1c tail.

Feasible? YES. The gate is clear, the work is well-defined (10 sub-steps in
S-07).

**Wave 3 (SWS Steps 2-21):** 74-120+ sessions, strictly sequential.

Feasible? By definition -- SWS is the plan, this is just "do SWS."

**Overall schedule verdict: WORKABLE but operationally demanding.** The
schedule is logically sound. All dependencies are respected. All file conflicts
are sequenced. But the Wave 1 interleaving assumes a level of context-switching
discipline that may not be realistic for a solo developer without operational
tooling (checklists, gate trackers).

### 11. Are the "safe parallel" claims actually safe?

**Testing shared file lists:**

- SL + AE in Wave 1a: SL touches `tools/statusline/` (new), `.claude/settings.json`,
  `.gitignore`. AE P4 touches `.claude/agents/*.md` files. ZERO overlap.
  **SAFE.**

- PR W1 + PS in Wave 1a: PR W1 touches `scripts/debt/intake-audit.js`,
  `.github/workflows/ci.yml`, GitHub repo settings, `scripts/lib/sanitize-error.cjs`
  (new), `known-propagation-baseline.json` (new), `scripts/check-propagation.js`.
  PS touches `.claude/hooks/session-start.js`, `.claude/hooks/post-write-validator.js`,
  etc., `.husky/pre-commit`, `scripts/check-agent-compliance.js`, etc. ZERO
  overlap on specific files. **SAFE.**

- CLI + PS (session-start.js): The schedule correctly sequences PS before CLI.
  **SAFE as sequenced.**

- PS + PR on ecosystem audit skills: The schedule correctly sequences PS before
  PR (R-08). **SAFE as sequenced.**

**Verdict: The parallel safety claims check out.** I could not find a case
where two plans claimed as "safe to parallel" actually share files. The schedule
correctly identifies and sequences the 7 conflict zones.

### 12. Is "all non-SWS plans first" optimal, or does it delay SWS?

**The schedule does NOT actually delay SWS.** The only hard gate is agent-env
P4-5. Even if all other non-SWS plans ran AFTER SWS started (interleaved
during SWS chunk boundaries), SWS would start at the same time -- after
agent-env P5 completes.

The "all non-SWS plans first" strategy's value is:
1. Shared file stabilization (pre-commit, session-start.js)
2. Synergy exploitation (~7% SWS effort savings)
3. Complexity reduction (fewer active plans during SWS)

But there is a subtle cost: the strategy adds 5-8 sessions of Wave 1 work
before SWS CANON starts. If agent-env P5 finishes in session 3, but Wave 1 is
not fully complete until session 8, should SWS start in session 4 (when its
hard gate is met) or session 9 (when all non-SWS plans are done)?

The RESEARCH_OUTPUT says "Wave 2... Can safely overlap with Wave 1c tail since
`.canon/` is a new isolated directory." This is the correct nuance -- SWS
CANON can start as soon as AE P5 is done, even if SL or PR W3-W4 are still
in progress. The schedule does allow this overlap.

**Verdict: The strategy is sound.** It does not unnecessarily delay SWS
because it allows CANON overlap with Wave 1c. The only mandatory wait is
agent-env, which is also the critical path.

### 13. Given SWS scope growth, should SWS START earlier?

**This is the strongest challenge I can make to the research conclusions.**

The user constraint (CONSTRAINT-sws-scope-growth.md) says SWS is a "plan for
making plans" whose scope grows during execution. If SWS discovers scope
during execution, then STARTING SWS earlier means DISCOVERING scope earlier.
Earlier scope discovery allows more informed planning.

**Counter-argument from the research:** Starting SWS before agent-env
completes means SWS Step 13 (Agents) would standardize agents that are still
being improved. Starting SWS before PS completes means encountering 33
violations that inflate SWS scope. These are real costs.

**But there is a middle ground the research does not explore:** Could SWS
Step 1 (CANON) start before ALL 5 agent-env phases complete? The memory note
says "all 5 phases must complete before SWS Phase 1." But S-09's CL-5
analysis found that Phase 5 contributes process integration (CLAUDE.md,
hooks, schemas) that SWS could absorb. The hard technical requirement is
Phases 1-4 (the agent definitions that SWS Step 13 standardizes). Phase 5
is arguably a convenience, not a necessity, for CANON specifically.

If CANON could start after agent-env Phase 4 instead of Phase 5, that
saves ~1 session on the critical path. This is a small gain. But more
importantly, it starts the scope discovery process 1 session earlier.

**However:** The memory note's constraint is the USER's decision, recorded
as a project rule. The research correctly treated it as authoritative. Relaxing
it is a decision for the user, not for this research. The research DID surface
this question explicitly in the "Challenges" section placeholder.

**Verdict: The research is correct to not challenge the "all 5 phases"
constraint, but it should have more forcefully surfaced the tension between
"start SWS early to discover scope" and "finish prep work to reduce SWS
scope." The SWS scope growth constraint amplifies the value of early SWS
start in a way the research underweights.**

---

## Bias Assessment

### 14. Were agents biased toward confirming DIAGNOSIS.md claims?

**DIAGNOSIS.md made 5 claims:**
1. Most plans have no inter-dependencies -> CONFIRMED but nuanced (soft deps)
2. SWS gated on CANON framework -> CORRECTED (CANON is Step 1 of SWS)
3. Agent-env depends on Agent Teams SDK -> CONFIRMED but downgraded (proven functional)
4. Repo-cleanup should go first -> CONFIRMED
5. SWS is XL (40-60 sessions) -> CORRECTED (80-130 sessions)

**2 of 5 DIAGNOSIS claims were corrected.** This is strong evidence against
confirmation bias. If agents were biased toward confirming the DIAGNOSIS, they
would not have caught the stale effort estimate or the misleading CANON framing.

The research consistently treated DIAGNOSIS.md as a starting hypothesis, not
as ground truth. S-09 explicitly says "The DIAGNOSIS was a reasonable first-pass
but too dismissive of soft dependencies and shared file conflicts." S-07
caught the effort discrepancy. S-13 surfaced the Meta Pipeline ambiguity that
DIAGNOSIS ignored.

**Verdict: NO significant confirmation bias detected.** The research corrected
the DIAGNOSIS where it was wrong and preserved it where it was right.

### 15. Is there a "consensus illusion"?

**Risk: Wave 2+ agents read Wave 1 findings. Could they artificially agree?**

**Evidence for consensus illusion:**
- All 17 agents agree that agent-env -> SWS is the only hard dependency
- All agree SWS dominates effort
- All agree repo-cleanup should go first
- The schedule emerged without meaningful disagreement between agents

**Evidence against consensus illusion:**
- Wave 1 agents worked independently (each read only one plan)
- The consensus is on VERIFIABLE facts (file counts, step structures, the
  existence of a memory note), not on interpretive claims
- Where interpretation was involved (Meta Pipeline enforcement, effort
  estimates, synergy values), agents assigned MEDIUM confidence or flagged
  ambiguity
- The 7 contradictions represent genuine disagreements between sources

**The key question:** Would a DIFFERENT decomposition of the same problem
(e.g., 3 generalist agents instead of 17 specialists) have reached a
different conclusion?

Almost certainly not. The dependency graph has 1 hard dependency. This is a
structural property of the plans. Any agent reading the plans would find it.
SWS dominates effort at 80-130 sessions vs 13-19 for everything else. This is
arithmetic. The "consensus" reflects reality, not echo-chamber dynamics.

**Verdict: No consensus illusion.** The agreement is because the facts are
clear, not because the agents read each other. The research design
(Wave 1 agents independent, Wave 2+ agents cross-referencing) is the correct
structure for building layered analysis.

---

## Overall Methodology Verdict: SOUND

The research methodology is fundamentally sound. The 17-agent, 4-wave design
produced a comprehensive, filesystem-grounded analysis with genuine error
detection (correcting 2 DIAGNOSIS claims, catching 3 plan file errors). The
synthesis is faithful to the findings. The confidence distribution is slightly
inflated but not dramatically. The schedule is logically correct and
operationally workable.

**3 actionable concerns:**

1. **Confidence methodology does not distinguish facts from recommendations.**
   Claims like C-031 (rolling wave planning is "most valuable") and C-032
   (time-box AE P4 to 2 sessions) are recommendations, not verifiable findings.
   They should be flagged differently than factual claims like C-001 (1 hard
   dependency) or C-005 (pre-commit touched by 4 plans).

2. **Operational tooling gap.** The schedule is correct but operationally
   demanding for a solo developer. The research should have recommended a
   lightweight gate-tracking mechanism for Wave 1 ordering constraints.

3. **SWS start timing tension underweighted.** Given the user's constraint
   that SWS scope grows during execution, the argument for starting SWS as
   early as possible (to discover scope earlier) deserves more weight against
   the argument for completing all prep work first (to reduce SWS scope). The
   research surfaces this as a challenge placeholder but does not analyze it.
   This is the single most important unresolved strategic question.

**NOT actionable concerns (removed in Pass 2-3):**

- The algorithm survey in S-14 was not a straw man -- it was a justified
  evaluation that happened to conclude the obvious. The value was in the
  formalization, not the surprise factor.
- The 17-agent count is not overkill -- the research discovered the problem's
  simplicity rather than assuming it. A lighter design might have missed the
  file overlap analysis or the debt cross-reference.
- Contradiction #5 being "not a contradiction" is a minor presentation issue,
  not a methodology flaw.

---

## Convergence Loop Corrections

### Pass 1 -> Pass 2 Corrections

1. **Removed: "Wave 2 agents did not independently verify."** Upon re-reading,
   S-09 CL-5 and S-08 both performed independent filesystem verification.
   S-10 did rely on Wave 1 step descriptions, but this is reasonable given
   Wave 1's thorough verification.

2. **Softened: "S-14 set up straw men."** The algorithm survey is academic
   but not dishonest. It showed its work and its conclusion is correct. The
   "straw man" framing was contrarian for its own sake.

3. **Removed: "The research should have had fewer agents."** This is
   hindsight bias. The research could not know the problem was trivial before
   investigating it.

### Pass 2 -> Pass 3 Corrections

1. **Removed: "The confidence distribution is meaningfully inflated."** The
   slight inflation (2-3 claims that are recommendations not findings) does
   not change any decision. Downgrading C-031 and C-032 from MEDIUM to LOW
   would not affect the schedule. This concern is theoretical, not actionable.

2. **Promoted: "SWS start timing tension underweighted."** This moved from
   a minor note to a headline concern. Upon reflection, this IS the most
   important unresolved question. The research surfaces it but does not
   analyze it, and the user constraint document amplifies it.

3. **Clarified: "Contradiction #5 is not a contradiction."** Verified that
   the synthesis ITSELF says "Not contradictory" for this item. So the issue
   is purely presentation (why list it in the contradictions table?) rather
   than analytical error.
