# Outside-the-Box Analysis: Plan Orchestration

**Analyst:** deep-research-searcher (adjacent domain specialist) **Strategy:**
Adjacent domain insights and analogies **Date:** 2026-03-24 **Inputs:**
RESEARCH_OUTPUT.md, claims.jsonl, S-14, S-17

---

## Convergence Log

### Pass 1: Draft Insights

- 14 insights drafted from 7 adjacent domains
- Marked 5 as potentially "just interesting" vs actionable
- Flagged 3 insights that challenge core schedule assumptions

### Pass 2: Re-examination

- Added 2 missed domains: Theory of Constraints (Goldratt) and Bus Factor
  analysis
- Upgraded Insight #3 (WIP limits) from MEDIUM to HIGH after connecting to Wave
  1 interleaving decision
- Downgraded Insight #10 (game dev file locking) from HIGH to MEDIUM --
  Perforce-style locking has no direct mechanism in this git-based workflow
- Added Insight #14 (planning fallacy) after recognizing SWS 80-130 estimate is
  itself subject to the fallacy the research acknowledges but doesn't name
- Added Insight #15 (Second System Effect) connecting to SWS specifically

### Pass 3: Decision Connection Test

- Insight #1 (Theory of Constraints): Connects to R-2 (prioritize agent-env) and
  the entire wave structure. Stays HIGH.
- Insight #2 (Convoy Effect): Connects to Wave 3 design (SWS blocks everything).
  Stays HIGH.
- Insight #3 (WIP=1): Connects to Wave 1 interleaving recommendation. Stays
  HIGH.
- Insight #4 (Construction Last Planner): Connects to R-7 (section-ownership
  protocol). Stays HIGH.
- Insight #5 (Decision Fatigue): Connects to Wave 1 session priority protocol.
  Stays HIGH.
- Insight #6 (Feature Flags): Cannot connect to any specific schedule decision
  without infrastructure changes. Downgraded to MEDIUM.
- Insight #7 (Migration Squashing): Connects to R-1 (repo-cleanup first) and
  Wave 0 design. Stays HIGH.
- Insight #8 (AI Agent Parallelism): Connects to C-030 (parallelism benefit
  modest). Stays HIGH -- challenges a core assumption.
- Insight #9 (SAFe cadence): Cannot connect to specific decision (single
  developer, no cadence mismatch). Downgraded to LOW.
- Insight #10 (Game Dev File Locking): Connects loosely to R-7 (section
  ownership). Stays MEDIUM.
- Insight #11 (SJF scheduling): Connects to Wave 0-1 design. Stays HIGH.
- Insight #12 (Bus Factor): Cannot connect to schedule decision -- it's a
  meta-risk about the developer, not the schedule. MEDIUM.
- Insight #13 (Construction trades sequencing): Connects to shared file ordering
  in S-08. MEDIUM (confirms existing approach).
- Insight #14 (Planning Fallacy): Connects to R-8 (rolling wave) and C-029 (SWS
  scope growth). HIGH.
- Insight #15 (Second System Effect): Connects to SWS as a whole. HIGH -- most
  provocative insight.

---

## Insight Table

| #   | Insight                                                                                              | Source Domain        | Applicability     | Rating   |
| --- | ---------------------------------------------------------------------------------------------------- | -------------------- | ----------------- | -------- |
| 1   | SWS is THE constraint -- subordinate everything to it (Theory of Constraints)                        | Manufacturing / TOC  | Direct            | **HIGH** |
| 2   | Wave 3 creates a convoy effect -- small emergent tasks starve behind SWS                             | OS Scheduling        | Direct            | **HIGH** |
| 3   | Wave 1 should enforce WIP=1, not interleave 5 plans                                                  | Kanban / Lean        | Direct            | **HIGH** |
| 4   | Construction "Last Planner" pull-scheduling for shared files                                         | Construction PM      | Strong analogy    | **HIGH** |
| 5   | Decision fatigue will degrade quality in Wave 1's multi-plan interleaving                            | Cognitive Science    | Direct            | **HIGH** |
| 6   | Feature flags could decouple shared-file modifications                                               | Release Engineering  | Weak analogy      | MEDIUM   |
| 7   | Repo-cleanup is "migration squashing" -- consolidate before the big migration                        | Database Engineering | Strong analogy    | **HIGH** |
| 8   | AI agents fundamentally change the parallelism assumption (W=1 is wrong)                             | AI-Assisted Dev      | Direct            | **HIGH** |
| 9   | SAFe cadence alignment is irrelevant for solo developer                                              | Agile Portfolio Mgmt | None              | LOW      |
| 10  | Game dev uses exclusive file locks for unmergeable assets -- analogous to pre-commit                 | Game Development     | Moderate analogy  | MEDIUM   |
| 11  | SJF (Shortest Job First) for non-SWS work minimizes average wait time AND clears decision load       | OS Scheduling        | Direct            | **HIGH** |
| 12  | Bus factor = 1 means ANY interruption (illness, vacation, burnout) resets all context                | Risk Management      | Meta-risk         | MEDIUM   |
| 13  | Construction trades sequence by "who needs the wall open" -- same logic as session-start.js ordering | Construction PM      | Confirms existing | MEDIUM   |
| 14  | SWS's 80-130 estimate is subject to the Planning Fallacy + Hofstadter's Law recursively              | Cognitive Science    | Direct            | **HIGH** |
| 15  | SWS exhibits classic Second System Effect symptoms                                                   | Software Engineering | Direct            | **HIGH** |

---

## Detailed Insights

### Insight #1: SWS Is THE Constraint -- Apply Goldratt's Theory of Constraints [HIGH]

**Source domain:** Manufacturing (Goldratt, "The Goal", 1984)

**The principle:** Every system has exactly one constraint that limits
throughput. The five focusing steps are: (1) Identify the constraint, (2)
Exploit it (maximize its throughput), (3) Subordinate everything else to it, (4)
Elevate it (invest to increase its capacity), (5) Repeat.

**Application:** The research correctly identifies that SWS dominates at 85% of
total effort [C-002]. But it then spends enormous analytical energy on
optimizing the other 15%. From a TOC perspective, the ONLY question that matters
is: "What maximizes SWS throughput?" Everything else -- Wave 0, Wave 1, file
conflict ordering -- is subordinate to that question.

**What the research missed:** The wave schedule is designed around "clear the
deck, THEN start SWS." But TOC would ask: "Does clearing the deck actually make
SWS go faster?" The answer is partially yes (synergies save ~7% [C-012]) but
partially no. The schedule treats Wave 1 completion as an entry gate for Wave 2,
but several non-SWS plans (custom-statusline, cli-tools) have ZERO synergy with
SWS [S-10]. Completing them before SWS does not make SWS faster -- it just
delays SWS start by 1-3 sessions.

**Specific decision impact:** The schedule could start SWS (Wave 2) AS SOON AS
agent-env P5 completes, even if statusline and cli-tools are unfinished. Those
can interleave with SWS chunks at checkpoint boundaries. This could save 2-4
sessions of elapsed time.

**Counterargument:** The research's synergy analysis [C-012] does show that
passive-surfacing and propagation provide SWS input. So "clear the high-synergy
plans first" is correct. But "clear ALL plans first" is not TOC-optimal.

---

### Insight #2: Wave 3 Creates a Convoy Effect [HIGH]

**Source domain:** Operating Systems (FCFS scheduling pathology)

**The principle:** In First-Come-First-Served scheduling, a single long-running
process blocks all shorter processes from completing, creating a "convoy" of
waiting tasks. The convoy effect is the most well-known pathology of
non-preemptive scheduling.

**Application:** Wave 3 (SWS Steps 2-21, 74-120+ sessions) is a massive convoy.
Any work that emerges DURING SWS execution -- bug fixes, security patches, new
features, the 3 unaddressed S0 items [C-020] -- must either (a) wait behind SWS,
(b) interrupt SWS at checkpoint boundaries, or (c) be done in parallel using AI
agents.

**What the research missed:** The schedule assumes the 7 plans are the ONLY work
for the next 43-70 working days. That is unrealistic. Real development generates
emergent work: production bugs, dependency updates, user-facing features. The
schedule has no "interrupt channel" for emergent work during Wave 3. The SWS
decomposition [S-16] mentions "non-SWS work can be inserted between chunks" but
doesn't formalize how, or what happens when emergent work conflicts with SWS's
shared resources.

**Specific decision impact:** The schedule should formalize an interrupt
protocol for Wave 3: (a) define which SWS sessions can be pre-empted, (b)
maintain a "parking lot" for emergent work, (c) use SWS checkpoint boundaries as
natural interrupt points. Without this, the developer faces an impossible choice
during a production bug: fix it immediately (breaking SWS flow) or defer it
(accumulating risk).

---

### Insight #3: Wave 1 Should Enforce WIP=1, Not Interleave 5 Plans [HIGH]

**Source domain:** Kanban / Lean Manufacturing

**The principle:** Work In Progress (WIP) limits are the single most effective
tool for improving throughput. Research consistently shows that completing tasks
sequentially (WIP=1) produces better average completion times than multitasking,
even without accounting for context-switching costs. A programmer completing 3
projects sequentially finishes with average completion time of 60 days;
multitasking the same 3 projects raises average completion to 89 days.

**Application:** Wave 1 recommends interleaving 5 plans across 5-8 sessions with
a session priority protocol [Schedule, Wave 1a/1b]. This means the solo
developer switches plans potentially every session. But context-switching
research shows it takes ~23 minutes to regain focus after switching contexts,
and switching between different plan contexts (different files, different mental
models, different risk profiles) is a deep context switch, not a shallow one.

**What the research missed:** The research treats "interleaving" as free. It
calculates parallel vs sequential as a 7-11 session difference [C-030] but does
not account for the cognitive overhead of interleaving. A solo developer
switching between agent-env (refactoring 37 agents), passive-surfacing (fixing
hook violations), propagation (mass file changes), cli-tools (binary
installation), and statusline (Go development) in a single week is performing 5
fundamentally different types of work. The mental model for each is
incompatible.

**Specific decision impact:** Instead of the session priority protocol (pick
from 5 plans each session), enforce WIP=1 within Wave 1: Complete agent-env P4-5
first (2-4 sessions, critical path), then passive-surfacing (1-2 sessions), then
propagation W1 (2 sessions), then cli-tools (2 sessions), then statusline (3-4
sessions). Total: 10-14 sessions sequentially. Yes, this is 3-6 sessions longer
than the interleaved estimate. But it eliminates context-switching overhead,
reduces decision fatigue (Insight #5), and provides clean rollback boundaries
per plan.

**The math:** If context switching costs even 15% per session (conservative --
research suggests 20%+), interleaving 5 plans across 8 sessions costs 1.2
effective sessions. Sequential execution of 10-14 sessions with zero switching
overhead may complete faster in EFFECTIVE hours even if more sessions are used.

---

### Insight #4: Construction "Last Planner" System for Shared Files [HIGH]

**Source domain:** Lean Construction (Last Planner System, Ballard 2000)

**The principle:** In construction, the Last Planner System uses "pull planning"
-- work backward from a milestone, then let the people closest to the work
(foremen, trade partners) make commitments about what they CAN do in the next
week. This replaces top-down scheduling with bottom-up commitment. Critically,
trades coordinate SHARED WORKSPACE access through explicit handoff protocols: "I
need the wall open Tuesday through Thursday for electrical; you can close it
Friday for drywall."

**Application:** The research identifies 5 critical shared resources [C-005,
C-006] and recommends a sequencing order [S-08]. But the sequencing is top-down:
the schedule TELLS plans when to modify shared files. The Last Planner approach
would instead formalize a PROTOCOL for shared file access:

1. **Make-Ready Planning:** Before modifying a shared file, verify that all
   prerequisite modifications are committed and tested.
2. **Weekly Commitment:** Each "plan execution session" declares which shared
   files it will modify, what sections, and what the post-condition will be.
3. **Percent Plan Complete (PPC):** Track how often planned shared-file
   modifications complete as promised. Low PPC signals systemic coordination
   problems.

**What the research missed:** R-7 recommends "section-based ownership" for
`.husky/pre-commit` but doesn't formalize the protocol. The construction analogy
makes this concrete: each plan "books" a section of the file (like booking a
wall section), declares entry/exit conditions, and tests the file after
modification. This is exactly what construction does with permits and handoff
inspections.

**Specific decision impact:** Formalize R-7 into a "Shared File Permit" system:
before any plan modifies a shared file, create a short declaration (which file,
which sections, what pre-condition, what post-condition, how to test). This adds
~5 minutes per shared-file modification but prevents the #1 failure scenario
(pre-commit breakage, [S-17 Scenario #1]).

---

### Insight #5: Decision Fatigue Will Degrade Wave 1 Quality [HIGH]

**Source domain:** Cognitive Science (Baumeister ego depletion, Kahneman System
1/2)

**The principle:** Every decision depletes willpower. Programmers experiencing
decision fatigue default to copy-paste over proper abstraction, choose the
easier path over the better path, and make riskier choices. The effect is
cumulative within a session and across days.

**Application:** The Wave 1 session priority protocol requires the developer to
make a 5-way prioritization decision at the START of every session: "Should I
work on agent-env, passive-surfacing, propagation, cli-tools, or statusline?"
This decision requires assessing current state across 5 plans, checking
shared-file pre-conditions, evaluating critical path impact, and estimating
remaining effort. That is a HARD decision -- exactly the type that depletes
willpower before productive coding begins.

**What the research missed:** The priority protocol is treated as a simple
lookup table. But in practice, "agent-env P4-5 if work remains" requires
checking whether Phase 4 is actually done (interactive decisions complicate
this), whether its changes are committed and tested, and whether the next
session should continue Phase 4 or move to Phase 5. This meta-decision ABOUT the
schedule consumes cognitive resources that should go to the WORK.

**Specific decision impact:** The schedule should pre-commit to a fixed sequence
for Wave 1 (per Insight #3's WIP=1 recommendation), eliminating the per-session
priority decision entirely. If interleaving is kept, at minimum pre-compute the
plan assignments for all Wave 1 sessions at Wave 1 start, so each session begins
with "today you work on X" rather than "decide what to work on."

---

### Insight #6: Feature Flags Could Decouple Shared-File Modifications [MEDIUM]

**Source domain:** Release Engineering / Trunk-Based Development

**The principle:** Feature flags allow incomplete code to exist in trunk without
being active. Multiple developers can modify the same codebase simultaneously
because their changes are isolated behind flags. This decouples deployment from
release.

**Application:** The 5 shared-file conflicts [S-08] exist because plans modify
the same files for different purposes. In principle, some of these modifications
could use a flag-like pattern: passive-surfacing adds violation checks behind a
`PS_ENABLED` guard, cli-tools adds tool detection behind a `CLI_TOOLS_ENABLED`
guard, etc. This would allow plans to modify files in any order without
conflict.

**Why MEDIUM, not HIGH:** The shared files in question (`.husky/pre-commit`,
`session-start.js`) are shell scripts and Node.js hooks, not application code.
Feature flags in shell scripts are awkward. The overhead of adding/removing
flags exceeds the coordination cost of sequential execution. This insight is
theoretically elegant but practically inferior to the simpler "sequence the
modifications" approach.

**Specific decision impact:** None directly. The existing section-ownership
approach is better for this specific case. But the principle applies if future
shared-resource conflicts involve application code (e.g., during SWS).

---

### Insight #7: Repo-Cleanup Is "Migration Squashing" [HIGH]

**Source domain:** Database Engineering

**The principle:** Before a major schema migration (analogous to SWS), database
teams "squash" existing migrations into a clean baseline. This reduces the
number of moving parts, prevents cascading conflicts, and creates a known-good
state from which the big migration proceeds. As one source notes: "Squashing
reduces the number of migrations and, by extension, the likelihood of
conflicts."

**Application:** Repo-cleanup (Wave 0) is exactly this pattern: remove 7
orphaned files, update 7 stale docs, remove 3 unused deps. It creates a "clean
baseline" before the real work begins. The research correctly places it first
[R-1] but frames it as a "confidence builder" [S-17]. The database analogy
reveals a stronger justification: it is a PREREQUISITE for reducing conflict
surface area. Every orphaned file, stale doc reference, and unused dep is a
potential false positive in future plan steps -- a "migration" that references
an artifact that shouldn't exist.

**What the research missed:** The migration squashing analogy extends further.
Passive-surfacing (fixing 33 violations) and propagation W1 (5 surgical fixes)
are ALSO squashing operations. They consolidate the codebase state before the
"major migration" (SWS). The schedule should frame Wave 0-1 not as "do small
tasks first" but as "establish a clean baseline before the major migration."
This reframing changes the justification from efficiency to risk management.

**Specific decision impact:** Strengthens R-1 justification and reframes Wave 1
as "baseline consolidation" rather than "clearing the deck."

---

### Insight #8: AI Agents Fundamentally Change the Parallelism Assumption [HIGH]

**Source domain:** AI-Assisted Development (2026 state of the art)

**The principle:** The research assumes W=1 (one processor: one solo developer).
But in 2026, Claude Code supports Agent Teams with up to 10 parallel sub-agents.
This means the "solo developer" is actually an "orchestrator with 1-10 parallel
workers." The parallelism constraint is not binary (1 developer = 1 task at a
time) but variable (1 developer = 1-10 tasks at a time, depending on task type).

**Application:** The schedule's core insight -- "the scheduling problem is
trivially solved because W=1" [C-013] -- may be WRONG for tasks that can be
delegated to AI agents. Agent-env Phase 4 (improving 36 agents) is a PERFECT
candidate for agent parallelism: each agent definition is an independent file,
improvements follow a common template, and verification is mechanical.
Similarly, propagation Wave 2 (mass refactoring) could be parallelized across
agents: each agent handles a subset of the 55 files, following the same
replacement pattern.

**What the research missed:** The scheduling theory analysis [S-14] evaluates
algorithms assuming W=1 (solo developer). But the SoNash codebase already uses
parallel agents (the deep-research skill deploys 17 agents). If plan execution
similarly uses parallel agents, the "one task per session" assumption breaks
down. The effective parallelism is not 1 but potentially 3-5 for certain task
types (independent file modifications, mechanical refactoring,
verification/audit tasks).

**What this DOESN'T change:** SWS CANON design (Step 1) is inherently serial --
it requires interactive human decisions about framework design. Shared-file
modifications are inherently serial (agents can't safely modify the same file in
parallel). But independent-file work like agent-env Phase 4 and propagation Wave
2 could compress significantly.

**Specific decision impact:** The schedule should distinguish between
"serial-only" tasks (CANON design, shared-file modifications, interactive
decisions) and "parallelizable" tasks (independent file modifications,
mechanical refactoring, verification). Parallelizable tasks in Wave 1 could
compress from 5-8 sessions to 2-3 sessions, making the "all non-SWS before SWS"
strategy even more viable. This directly impacts C-030's claim that "parallelism
benefit is real but modest."

---

### Insight #9: SAFe Cadence Alignment Is Irrelevant Here [LOW]

**Source domain:** Agile Portfolio Management (SAFe, LeSS)

**The principle:** SAFe's primary coordination mechanism is cadence alignment --
all teams plan on the same rhythm (PI Planning every 10 weeks). Cadence
misalignment is identified as the #1 failure mode.

**Why this doesn't apply:** This is a single-developer project. There are no
teams to align, no PI Planning to synchronize, no ARTs to coordinate. SAFe's
complexity exists to solve multi-team coordination problems. With W=1, these
problems don't exist.

**One useful takeaway:** SAFe's concept of "enablers" (technical work that
enables future features) maps to the Wave 0-1 plans. In SAFe, enablers are
explicitly tracked alongside features and given capacity allocation (typically
20-30%). The schedule implicitly does this: Wave 0-1 is "enabler work" that
enables SWS.

---

### Insight #10: Game Development Uses Exclusive File Locks for Unmergeable Assets [MEDIUM]

**Source domain:** Game Development (Perforce VCS)

**The principle:** In game development, binary assets (textures, 3D models,
audio) cannot be merged. The industry standard (Perforce) solves this with
exclusive checkout: when an artist opens a file for editing, it is LOCKED and no
other artist can edit it until the lock is released. This is the nuclear option
for shared resources: prevent concurrent modification entirely.

**Application:** The `.husky/pre-commit` file (34KB, modified by 4 plans) is
effectively a "binary asset" in the sense that concurrent modification is
dangerous and merging is unreliable (shell script merge conflicts are
notoriously hard to resolve). Git doesn't have native file locking, but the
CONCEPT applies: during each plan's modification of pre-commit, no other plan
should touch it.

**Why MEDIUM:** The existing sequential ordering [S-08] achieves the same effect
without formal locking. Since only one developer exists, "don't modify
pre-commit while another plan is modifying it" is naturally enforced by
sequential execution. The game dev analogy confirms the approach but doesn't add
new actionable insight beyond R-7.

---

### Insight #11: SJF for Non-SWS Work Minimizes Wait Time AND Clears Decision Load [HIGH]

**Source domain:** Operating Systems (Shortest Job First scheduling)

**The principle:** SJF minimizes average waiting time across all jobs. It is
provably optimal for this metric. The research mentions SPT (Shortest Processing
Time) as part of the priority rule [S-14] but applies it as P4 (lowest priority
tiebreaker). From a cognitive perspective, SJF has an additional benefit:
completing short tasks quickly produces dopamine reward signals and reduces the
"open loop" count in working memory.

**Application:** The schedule's priority order within Wave 1 is: agent-env
(critical path) > passive-surfacing > propagation > cli-tools > statusline. This
is correct for critical-path optimization. But for COGNITIVE optimization, the
order should be different. Agent-env Phase 4 is the HARDEST task (interactive
per-agent decisions, scope creep risk, 36+ files). Starting Wave 1 with the
hardest, most ambiguous task maximizes decision fatigue early.

**Alternative:** Start Wave 1 with passive-surfacing (1-2 sessions, mechanical,
LOW-MEDIUM risk [S-17]), then propagation W1 (2 sessions, surgical fixes, LOW
risk [S-17]). These quick wins build momentum and resolve shared-resource
pre-conditions. THEN tackle agent-env P4-5 (2-4 sessions, highest risk [S-17])
with a clean baseline. This reordering does NOT affect the critical path:
agent-env completion gates SWS, and SWS cannot start until agent-env is done
regardless of when agent-env runs within Wave 1.

**Wait -- does this actually affect critical path?** If agent-env runs LAST in
Wave 1 instead of FIRST, Wave 1 takes the same total sessions, but SWS start is
pushed to the END of Wave 1 instead of mid-Wave-1. So the critical path IS
affected. The research's priority order is correct for critical path. But the
cognitive case for "easy wins first" is strong enough to warrant consideration.

**Resolution:** If using WIP=1 (Insight #3), the critical path effect is:
agent-env-last adds 3-6 sessions to SWS start vs agent-env-first. This is a real
cost. The cognitive benefit must outweigh it. For a 2-4 session task, the
cognitive benefit is likely 0.5-1 effective sessions. So agent-env-first remains
correct for total project duration, but the MARGIN is smaller than it appears.

**Specific decision impact:** Confirms the research's priority order but adds
nuance: if agent-env Phase 4 stalls (scope creep, [S-17 Scenario #5]), switch to
easy wins immediately rather than pushing through. The time-box recommendation
[C-032] already handles this, but the SJF framing makes the rationale clearer.

---

### Insight #12: Bus Factor = 1 Means Any Interruption Resets All Context [MEDIUM]

**Source domain:** Risk Management / Team Resilience

**The principle:** Bus factor measures how many people must be unavailable
before a project stalls. A bus factor of 1 means a single person's absence halts
everything. For a solo developer, the bus factor is definitionally 1.

**Application:** The 43-70 working day timeline assumes continuous availability.
A week of illness, vacation, or burnout resets context on whichever plan is
active. The research acknowledges this implicitly (rolling wave planning) but
doesn't model it explicitly.

**What the research missed:** Context recovery cost after an interruption is
proportional to the complexity of the interrupted task. Interrupting agent-env
Phase 4 (36 agents, interactive decisions) has a higher recovery cost than
interrupting repo-cleanup (simple deletions). This is another argument for WIP=1
(Insight #3): if you complete repo-cleanup before starting agent-env, an
interruption during agent-env doesn't require remembering repo-cleanup state.

**Specific decision impact:** The schedule should minimize "in-flight" plan
count at any time. WIP=1 achieves this. The interleaving approach has up to 5
plans simultaneously in-flight, requiring context recovery for all 5 after any
interruption.

---

### Insight #13: Construction Trades Sequence by "Who Needs the Wall Open" [MEDIUM]

**Source domain:** Construction Project Management

**The principle:** In construction, multiple trades (electrical, plumbing, HVAC)
must access the same physical space (a wall cavity). The sequencing rule is:
rough-in first (whoever needs access to the structural elements), then close the
wall, then finish work. You can't do drywall before electrical rough-in because
the electrician needs the wall open.

**Application:** This is exactly the logic behind the session-start.js ordering:
PS first (fixes existing code = "rough-in"), CLI second (adds new functionality
= "running new lines"), AE last (adds monitoring = "inspection before closing").
The construction analogy validates the S-08 sequencing but doesn't add new
insight.

**What's mildly interesting:** Construction uses "inspections" between trades
(electrical inspector checks before drywall closes the wall). The schedule
should add explicit verification between plan modifications of shared files:
after PS modifies session-start.js, verify it works before CLI modifies it. The
research recommends this implicitly but the construction analogy makes the
"inspection gate" pattern concrete.

---

### Insight #14: SWS's Estimate Is Subject to the Planning Fallacy AND Hofstadter's Law [HIGH]

**Source domain:** Cognitive Science (Kahneman, Hofstadter)

**The principle:** The planning fallacy states that people systematically
underestimate task duration, even when they have experience with similar tasks.
Hofstadter's Law adds recursion: "It always takes longer than you expect, even
when you take into account Hofstadter's Law." Complex projects with many phases
are especially vulnerable because each phase's underestimate compounds.

**Application:** The research acknowledges SWS scope growth [C-029] and
recommends rolling wave planning [C-031, R-8]. But it treats the 80-130 session
estimate as a "floor" based on user input, not as a cognitive bias artifact. The
planning fallacy framework suggests the estimate is STRUCTURALLY underestimated:

1. **21 steps, each estimated individually.** Individual step estimates are
   optimistic. Summing optimistic estimates produces a more-optimistic total.
2. **"Plan for making plans"** means each step DISCOVERS new work. The 80-130
   estimate cannot account for work that is, by definition, unknown.
3. **No reference class.** SWS has no comparable project in this codebase's
   history. There is no base rate to anchor against.

**Specific calculation:** If each of the 21 SWS steps has a mean estimate of
~5.5 sessions (midpoint of 80-130 / 21 = 3.8-6.2) and each step has even a 20%
underestimate (conservative for novel work), the actual total is 21 _ 5.5 _ 1.2
= 138.6 sessions. If the underestimate is 50% (realistic for "plan for making
plans" scope discovery), the actual total is 21 _ 5.5 _ 1.5 = 173 sessions. At 2
sessions/day, that is 87 working days -- significantly beyond the "pessimistic"
70 days.

**Specific decision impact:** R-8 (rolling wave planning) is necessary but may
not be SUFFICIENT. The schedule should include explicit re-estimation gates at
SWS checkpoints CP#1, CP#2, CP#3 with a mandatory "outside view" comparison:
actual sessions completed vs planned sessions for that checkpoint. If actual
exceeds planned by >30%, trigger a full re-plan including potential scope
reduction. This is more aggressive than the current "measure velocity for 10
sessions" recommendation.

---

### Insight #15: SWS Exhibits Classic Second System Effect Symptoms [HIGH]

**Source domain:** Software Engineering (Brooks, "The Mythical Man-Month", 1975)

**The principle:** The Second System Effect occurs when the successor to a
successful system incorporates every improvement that was deferred from the
first system, every feature anyone ever wanted, and every generalization the
designer can imagine. The result is a system that is overengineered, hard to
build, and often never completed. Brooks called it "the most dangerous system a
man ever designs."

**Application:** SWS standardizes 18 ecosystems across 21 steps with a CANON
framework, maturity models, health checkers, born-compliant gates,
inter-ecosystem contracts, and progressive enforcement. It is the "second
system" after the organic growth of SoNash's infrastructure. The symptoms match
Brooks's description:

1. **Every deferred improvement included.** SWS addresses ALL ecosystems, not
   just the most critical ones. 18 ecosystems means 18 potential scope-creep
   vectors.
2. **Generalization over specificity.** CANON is a FRAMEWORK for
   standardization, not a specific standardization. It abstracts the problem
   rather than solving concrete instances.
3. **92 decisions already made.** The decision count (D1-D92) suggests extensive
   pre-design without execution feedback. Brooks specifically warns against
   this.
4. **Internally sequential constraint (D63).** This prevents learning from later
   steps from informing earlier steps without rework.

**What this means for the schedule:** The Second System Effect predicts that SWS
will take longer than estimated (aligning with Insight #14), discover
fundamental design problems late (risk identified in S-17 Scenario #3), and
potentially be partially abandoned in favor of incremental improvements. The
schedule mitigates this with checkpoints, but the underlying risk is structural.

**Counterargument:** The user explicitly designed SWS as a "plan for making
plans" [C-029], which acknowledges scope growth. The CANON framework is
DELIBERATELY abstract because it must govern diverse ecosystems. And the 92
decisions were made through structured analysis, not uncritical accumulation. So
this is a CONSCIOUS second system, not an accidental one.

**Specific decision impact:** The schedule should include an explicit "Second
System escape valve": at each checkpoint, evaluate whether the remaining SWS
steps should be executed as planned, REDUCED in scope (fewer ecosystems, lower
maturity targets), or converted to incremental improvement tasks. This is
different from R-8 (which adjusts TIMELINE) -- it adjusts SCOPE. The
construction analogy is: sometimes the architect's grand design is reduced to a
simpler building when the budget runs over.

---

## Answers to Specific Questions

### 1. What would a complete non-expert notice about this scheduling problem?

A non-expert would notice three things immediately:

**"Why are you planning for 4 months before doing any real work?"** The research
itself took 17 agents and produced 40,000+ words of analysis for what the
research itself calls a "trivially solved" scheduling problem [C-013]. The
meta-irony is thick: the plan orchestration analysis is more complex than the
plans it orchestrates (except SWS). A non-expert would say: "Just do the small
stuff, then do the big thing. Why do you need 18 findings files to figure that
out?"

**"You're one person. Why are you scheduling like a company?"** The wave
structure, PR strategy with 8+ PRs, session priority protocol, and shared-file
ownership protocol are coordination mechanisms designed for teams. A solo
developer doesn't need to coordinate with anyone -- they just need to NOT FORGET
what they were doing. The real tool is a checklist, not a Gantt chart.

**"The big thing (SWS) is going to take MONTHS. Are you sure you want to do
it?"** An outsider would question the fundamental assumption that SWS needs to
happen at all in its current scope. Is 18-ecosystem standardization necessary
for a solo-developer project? Could you standardize 3-5 critical ecosystems and
call it done?

### 2. What adjacent domains have solved similar problems more elegantly?

**Theory of Constraints (manufacturing):** Goldratt solved "one constraint
dominates everything" by subordinating all other work to the constraint. The
research partially does this but still treats non-SWS plans as independent work
items rather than SWS-preparation work.

**Kanban (lean manufacturing):** WIP limits solve "too many things in progress"
more elegantly than priority protocols. Enforce WIP=1, finish things, start new
things. No priority decisions needed.

**Database migration squashing:** "Consolidate before the big change" is simpler
and more robust than "interleave changes optimally."

**Trunk-based development with feature flags:** Decouples timing from ordering.
Changes can be integrated in any order and activated in the correct order.
Overkill for this case but elegant for the general problem.

### 3. What second-order effects were not considered?

1. **Motivation decay.** 43-70 working days of infrastructure work before any
   user-facing features. The ROADMAP has user-facing features (Meeting Timer,
   Journal V2) that are entirely absent from this schedule. Prolonged
   infrastructure-only work risks motivation collapse.

2. **Context loss during SWS.** By the time SWS reaches Step 15 (process layer,
   ~session 60), the developer may have forgotten the details of early steps.
   CANON is self-documenting, but human memory of design rationale degrades.

3. **Tool evolution.** Over 4+ months, Claude Code itself will update,
   potentially invalidating statusline implementation (stdin JSON schema), agent
   definitions (new capabilities), and hook mechanisms. Plans designed today may
   be partially obsolete by execution time.

4. **Opportunity cost.** Every session spent on infrastructure is a session NOT
   spent on user value. The ROADMAP's user-facing features generate feedback;
   infrastructure does not. Extended infrastructure-only periods create an
   information vacuum about what users actually need.

5. **Emergent plan interactions.** As plans execute, they may create NEW file
   conflicts or dependencies not in the current graph. The dependency analysis
   is a snapshot; the dependency graph is dynamic.

### 4. What emerging trends (AI-assisted development) could change these conclusions?

**Multi-agent parallelism (Insight #8):** The W=1 assumption is already
outdated. Agent Teams can parallelize independent file modifications, compress
Wave 1, and potentially even run SWS steps in modified parallel (one agent does
CANON schema design, another audits current ecosystem state simultaneously).

**AI-generated plans:** If SWS is a "plan for making plans," AI agents could
GENERATE the per-ecosystem standardization plans automatically, reducing SWS
from a manual 80-130 session effort to a review-and-approve workflow. The
research doesn't consider this possibility despite the codebase already having
deep-plan and deep-research skills that could be pointed at each SWS ecosystem.

**Context persistence improvements:** Claude Code's memory system, session
context, and compaction resilience reduce the context-switching cost that
Insight #3 warns about. If context recovery is nearly free (because the AI
retains it), interleaving becomes cheaper.

**Agentic code review:** With code-reviewer agents, the "test after modifying
shared files" recommendation becomes cheaper -- an agent can verify pre-commit
hook integrity after each modification without human cognitive cost.

### 5. Is the "complete all small plans first, then SWS" strategy actually a known anti-pattern in any domain?

**Yes, partially.** In OS scheduling, it is the inverse of the convoy effect:
completing short jobs before the long job is SJF (Shortest Job First), which IS
optimal for average waiting time. So the strategy is NOT an anti-pattern for
throughput.

**BUT** in project management, "clearing the deck" before starting the main
project IS a recognized procrastination pattern. The manager completes easy,
visible tasks to feel productive while deferring the hard, ambiguous main
project. The psychological term is "structured procrastination" -- doing less
important things to avoid starting the important thing.

**In construction:** You don't finish ALL the small buildings before starting
the skyscraper. You start the skyscraper's foundation (the long-lead item)
IMMEDIATELY and do small buildings in parallel.

**In Goldratt's TOC:** Subordinate everything to the constraint. If small tasks
don't feed the constraint, they should NOT delay the constraint's start.
Custom-statusline and cli-tools have zero synergy with SWS [S-10]. Completing
them before SWS is strictly wasteful from a TOC perspective.

**The nuanced answer:** "Complete high-synergy small plans first, then SWS" is
correct. "Complete ALL small plans first, then SWS" is a mild anti-pattern. The
schedule MOSTLY does the former (agent-env, PS, and propagation have SWS
synergy) but includes statusline and cli-tools in the "before SWS" group
unnecessarily.

---

## Summary: Top 5 Actionable Insights

| Priority | Insight                                                              | Action                                                                                                            | Schedule Impact                                                               |
| -------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1        | **WIP=1 for Wave 1** (Insights #3, #5, #12)                          | Replace session priority protocol with fixed sequential plan execution within Wave 1                              | Adds 3-6 sessions but reduces context-switching overhead and decision fatigue |
| 2        | **Formalize Wave 3 interrupt protocol** (Insight #2)                 | Define how emergent work interrupts SWS at checkpoint boundaries                                                  | Prevents ad-hoc SWS disruptions; reduces convoy-effect harm                   |
| 3        | **Decouple statusline/cli-tools from SWS gate** (Insight #1)         | Allow SWS to start once agent-env + PS + propagation W1 complete; statusline/cli-tools interleave with SWS chunks | Saves 3-5 sessions on SWS start time                                          |
| 4        | **Add scope-reduction gates to SWS checkpoints** (Insights #14, #15) | At each checkpoint, evaluate scope reduction (fewer ecosystems, lower targets) alongside timeline adjustment      | Mitigates planning fallacy and Second System Effect                           |
| 5        | **Use AI agent parallelism for independent-file tasks** (Insight #8) | Deploy Agent Teams for agent-env Phase 4 and propagation Wave 2                                                   | Could compress Wave 1 from 5-8 sessions to 2-4 sessions                       |
