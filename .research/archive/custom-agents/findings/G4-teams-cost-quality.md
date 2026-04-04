# Findings: Claude Code Agent Teams — Cost, Quality, and Architecture

**Searcher:** deep-research-gap-pursuit **Profile:** web (official docs +
practitioner reports) **Date:** 2026-03-29 **Sub-Questions:** Q1 (architecture),
Q2 (real-world cost), Q3 (quality vs subagents), Q4 (communication overhead), Q5
(when teams win), Q6 (when teams lose), Q7 (one-team-per-session limit), Q8
(idle cost)

---

## Key Findings

### Q1 — Architecture: How Agent Teams Work Internally [CONFIDENCE: HIGH]

Agent Teams shipped as a research preview on **February 5, 2026** alongside
Claude Opus 4.6, with the first Claude Code changelog entry appearing in
**v2.1.45 (February 17, 2026)**. It requires **Claude Code v2.1.32 or later**
and must be explicitly opted in via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. As
of March 2026, the feature remains experimental.

**Architecture:** A lead session spawns 1-N teammate sessions. Each teammate is
an independent Claude Code process with its own full context window. The entire
coordination layer is **file-based** at `~/.claude/`:

- `~/.claude/teams/{team-name}/config.json` — membership registry (name, agent
  ID, agent type)
- `~/.claude/teams/{team-name}/inboxes/{agent-name}.json` — per-agent JSON array
  mailboxes
- `~/.claude/tasks/{team-name}/` — shared task list with `.lock` and
  `.highwatermark` files

**Message protocol:** Messages are appended to recipient inbox JSON arrays
(append-only writes). Recipients poll their inbox. New messages appear as
synthetic conversation turns injected into the recipient's session. The outer
envelope contains `from`, `text`, `timestamp`, `read` fields. The `text` field
is JSON-in-JSON (the payload is a stringified JSON object inside the text
field).

**Eight message types:** `task_assignment`, `message`, `broadcast`,
`plan_approval_request`, `plan_approval_response`, `shutdown_request`,
`shutdown_response`, `idle_notification`.

**Key behaviors:**

- Task claiming uses `flock()` file locking to prevent race conditions
- Task dependencies enforced via `blocks`/`blockedBy` fields; blocked tasks
  auto-unblock when dependencies complete
- Teammates read CLAUDE.md, MCP servers, and skills at spawn time (same as a
  regular session), but do NOT inherit the lead's conversation history — only
  their spawn prompt
- Plan mode: teammates can be placed in read-only plan mode; the lead approves
  plans before implementation begins
- Teammates inherit the lead's permission settings at spawn time; individual
  modes can be changed afterward
- `v2.1.72` fix: team agents now inherit the leader's model by default

**Sources:** [1][2][3]

---

### Q2 — Real-World Token Cost Data [CONFIDENCE: HIGH]

Multiple independent sources converge on a range. The official docs state
**"approximately 7x more tokens than standard sessions when teammates run in
plan mode."** Practitioner sources triangulate a wider range based on usage
pattern:

| Scenario                        | Single Session    | Agent Team    | Multiplier           |
| ------------------------------- | ----------------- | ------------- | -------------------- |
| 3-agent standard (no plan mode) | ~200k tokens      | ~800k tokens  | ~4x                  |
| 3-agent subagent comparison     | ~440k (subagents) | ~800k (team)  | ~1.8x over subagents |
| 3-agent code review (30 min)    | ~$2.00 (200k)     | ~$4.50 (640k) | 2.25x                |
| Full-stack feature (2 hrs)      | $8–15 (400–600k)  | ~$20 (1.35M)  | 2.5–3x               |
| Complex debug (1 hr)            | ~$10 (500k)       | ~$13 (950k)   | 1.3x                 |
| Plan mode (3 agents)            | baseline          | 7x baseline   | 7x                   |

**The key variable:** 3x–7x range is correct — the spread depends on whether
plan mode is active and how long teammates remain alive. Sequential tasks that
could have been done by a single agent but were run as a team are at the high
end (7x). Tasks with genuine parallel independent workloads are at the low end
(2–3x).

**Initialization overhead per agent (empirical estimate from aicosts.ai):**

- Context bootstrapping: 5,000–15,000 tokens
- Tool access verification: 2,000–8,000 tokens
- Project understanding (CLAUDE.md, skills, MCP): 10,000–50,000 tokens
- Communication protocol setup: 3,000–12,000 tokens
- Total per-agent initialization: ~20,000–85,000 tokens (varies with project
  size)

**Ongoing per-agent per-minute costs (while active):**

- Context maintenance: 500–2,000 tokens
- Inter-agent communication: 1,000–5,000 tokens per event
- Tool execution: 200–1,000 tokens per command
- Progress reporting: 300–1,500 tokens per update

**Broadcast multiplier:** Every broadcast doubles/triples the token consumption
proportional to team size, since the message is written to every teammate's
inbox and processed by every teammate.

**SoNash-specific benchmarks** (from existing team config files, validated
against published data):

- audit-review-team (2 members, sequential): ~3x solo cost — consistent with
  published data
- research-plan-team (3 members, partially parallel): ~4x solo cost — consistent
  with "3-4x sequential" figure

**Sources:** [1][4][5][6][7]

---

### Q3 — Quality Comparison: Teams vs Subagents [CONFIDENCE: MEDIUM]

No controlled study exists. All data is practitioner self-report or Anthropic
claims. The evidence is directional, not quantitative.

**Token-normalized comparison (alexop.dev):**

- Solo session: ~200k tokens
- 3 subagents: ~440k tokens (2.2x solo)
- 3-member team: ~800k tokens (4x solo, ~1.8x over subagents)

**For the ~1.8x premium over subagents, teams provide:**

1. **Direct inter-agent communication** — teammates message each other without
   routing through the lead. Benefit is clearest in adversarial workflows
   (competitor hypotheses, reviewer-fixer loops) where the exchange needs
   multiple rounds of back-and-forth that would require 2x lead round-trips with
   subagents.

2. **Progressive handoff** — planner can receive findings from researcher in
   real-time as sub-questions converge, rather than waiting for the entire
   research phase to complete. Reduces total wall-clock time on research-plan
   pipelines.

3. **Shared task list with self-coordination** — teammates can self-claim tasks
   without lead intervention. For workflows with many small tasks, this reduces
   lead context consumption.

4. **Error isolation risk (downside)** — direct peer-to-peer communication
   enables error propagation. A bad finding from researcher can be amplified by
   planner before the verifier catches it. Subagents have the lead as a natural
   checkpoint at every return.

**Content operation case study (fullstackagents.substack.com):** 3-agent team
(Research, Draft, QA) for content production. QA agent caught 4 banned words and
1 AI tell the operator missed. Research came back with 6 publications checked.
Draft was "closer to final than usual." Human time: ~20 minutes vs 3–4 hours
single-agent. One failure: unverified stat from Draft agent (agent "didn't know
what it didn't know").

**QA swarm case study (alexop.dev):** 5 parallel agents tested 146+ URLs and 83
blog posts in ~3 minutes. Identified 10 issues (4 major, 2 medium, 4 minor).
This workload would be serial with subagents.

**Consensus:** Teams produce measurably better output for tasks requiring
**adversarial exchange, parallel independent investigation, or progressive
handoff between cognitive modes**. They do not produce better output than a
single well-prompted agent for tasks that are fundamentally sequential.

**Sources:** [4][6][7][8][9]

---

### Q4 — Team Communication Overhead [CONFIDENCE: HIGH]

**Architecture-level overhead (confirmed by reverse-engineering, official
docs):**

- All coordination is file-based polling; no in-memory shared state, no sockets
- Every message write triggers a file append to the recipient's inbox JSON array
- Every teammate polls their inbox on a timer to detect new messages (exact
  interval not published)
- Inbox reads inject a synthetic conversation turn — this costs tokens equal to
  the message content plus conversation context

**Broadcast cost scaling:** Broadcast writes an identical message to every
teammate's inbox. A broadcast in a 5-member team costs 5x the message length in
additional context injected across all sessions.

**Idle notification flood:** After each LLM turn, teammates automatically send
an `idle_notification` to the lead. In a typical team run, **idle notifications
dominate the lead's inbox, with over 50% of messages being idle pings**. This is
a known pattern, not a bug. The TeammateIdle hook was added specifically to
suppress noise and redirect idle teammates to pending tasks.

**Topology overhead (from prior Session #225 research, now cross-validated):**

- Independent parallel: +58% vs single agent
- Centralized (all route through lead): +285%
- Hybrid (some direct, some through lead): +515%

Agent Teams use a **hybrid topology** in practice — tasks are centralized
through the lead's task list, but messages can be peer-to-peer. This puts Agent
Teams in the hybrid cost range (+285%–515%) depending on how much direct
messaging is used.

**Sources:** [2][3][10]

---

### Q5 — When Teams Beat Subagents [CONFIDENCE: HIGH]

Official documentation and practitioner consensus converge on the same decision
criterion: use teams when **workers need to communicate with each other**.

**Specific scenarios where teams outperform:**

1. **Competing hypothesis debugging** — multiple agents investigate different
   theories and actively try to disprove each other. The adversarial exchange
   produces root cause identification that single-agent sequential investigation
   misses due to anchoring bias. Example: 5 agents investigate different
   theories, debate via direct messages, converge on surviving explanation.

2. **Parallel code review with isolated lenses** — 3 reviewers, each assigned a
   different filter (security, performance, test coverage). Works because
   reviewers operate fully independently with no shared files.

3. **Cross-layer feature development** — frontend, backend, and test agents each
   own separate directories with no file overlap. Works because separation
   prevents conflicts and parallel execution saves wall-clock time.

4. **Research-plan pipelines with clarification loops** — researcher sends
   progressive findings to planner; planner asks clarification questions back.
   Without direct messaging, every clarification requires a round-trip through
   the lead (2x latency per exchange).

5. **QA swarms with independent targets** — 5+ agents each test different URL
   sets or blog posts simultaneously. Pure parallel workload with no
   communication needed.

**Decision threshold (practitioner consensus):** Count the distinct skill sets
required. If 1–2, use a single agent. If 3+, teams earn their cost. A simpler
test: "Do my workers need to communicate with each other during execution?" If
yes → team. If they only report results back → subagents.

**Sources:** [1][6][7][9][11]

---

### Q6 — When Teams Lose [CONFIDENCE: HIGH]

**Confirmed failure modes:**

1. **Sequential tasks with dependencies** — if task B can't start until task A
   is done, extra teammates sit idle. Idle wait doesn't save time and costs
   tokens from idle notification overhead.

2. **Same-file editing** — two teammates editing the same file produces
   overwrites or merge conflicts. No coordination mechanism prevents this;
   domain separation must be enforced manually in spawn prompts.

3. **Tasks too small for coordination overhead** — initialization overhead
   (~20,000–85,000 tokens per agent) exceeds task cost for short tasks. If the
   task itself is <10,000 tokens of work, team overhead is not justified.

4. **Error propagation** — direct peer-to-peer communication with no lead
   checkpoint allows bad findings to propagate. A research error that would be
   caught by the lead's review in a subagent workflow can be incorporated
   directly by the planner in a team workflow.

5. **Lead shuts down prematurely** — the lead may decide work is done before all
   tasks complete, requiring user intervention. Not a quality issue but an
   operational reliability issue.

6. **Specification gaps amplify** — in the heeki.medium case study,
   specification gaps required extended iteration after teams completed initial
   work. The human reviewer remained the bottleneck despite agent parallelism,
   reducing the wall-clock benefit.

7. **Routine tasks** — official docs explicitly: "For routine tasks, a single
   session is more cost-effective."

**Quality ceiling:** Teams don't produce "smarter" output than a single Opus
session for any individual task. Quality benefit comes from parallelism
(breadth) and adversarial exchange (rigor), not from individual task execution
quality.

**Sources:** [1][6][8][9]

---

### Q7 — One-Team-Per-Session Limit [CONFIDENCE: HIGH]

**Status as of March 2026: The limit is still in effect.** Official
documentation lists it as a known limitation: "a lead can only manage one team
at a time."

**Additional constraint:** No nested teams. Teammates cannot spawn their own
teams. Only the lead manages teams.

**Verified workarounds (all with tradeoffs):**

| Workaround                               | How                                                            | Cost                                                          |
| ---------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| Sequential teams                         | Complete one team, delete it, spawn a new one in same session  | Wall-clock time increase; state must be passed via files      |
| Manual parallel sessions + git worktrees | Run two separate Claude Code sessions each with their own team | No coordination between sessions; user manages both           |
| Larger single team                       | Instead of two 3-member teams, one 5-6 member team             | Coordination overhead increases; diminishing returns beyond 5 |
| Subagents for the second workflow        | Use subagent dispatch for one pipeline, team for the other     | Subagents lack direct inter-agent communication               |

**No announced timeline** for removing this limitation as of March 2026.

**Impact on SoNash:** Both existing teams (audit-review-team,
research-plan-team) are ephemeral and cannot run simultaneously in the same
session. Per both team config files, the one-team-per-session limit is already
documented as a constraint and both teams use `TeamDelete` at the end of their
lifecycle. This is correctly handled.

**Sources:** [1][12]

---

### Q8 — Idle Cost: What Do Teammates Cost While Waiting? [CONFIDENCE: MEDIUM]

**Confirmed behavior:**

- After each LLM turn completes, the teammate automatically sends an
  `idle_notification` to the lead's inbox
- Teammates don't continuously generate tokens while waiting — they are inactive
  between turns
- Idle notifications dominate inbox volume: "over 50% of messages in a typical
  team run are idle pings"

**Token cost of idle state:** The cost is not from the teammate sitting idle
(it's not generating tokens), but from the **lead processing idle
notifications**. Each idle notification arrives as a synthetic conversation turn
in the lead's context, consuming tokens when the lead reads it.

**Official guidance to mitigate:** "Clean up teams when work is done. Active
teammates continue consuming tokens even if idle." This implies there is some
background cost to simply having an active teammate process — likely from the
inbox polling mechanism.

**Prior research claim (Session #225):** "idle notification flood at 50%+ inbox"
— this is confirmed by the reverse-engineering analysis. However, the token cost
impact is lead-side (processing notifications) rather than teammate-side
(generating output), which is a correction of how this was framed previously.

**TeammateIdle hook:** The official hook `TeammateIdle` fires when a teammate
finishes a turn and goes idle. Exiting with code 2 sends feedback to keep the
teammate working (useful for quality gate enforcement). This hook provides a
programmatic way to suppress idle waste by redirecting teammates immediately.

**Practical implication for SoNash:** Both existing teams are
sequential-pipeline designs (reviewer → fixer; researcher → planner → verifier).
In sequential designs, one member is always "waiting" while the other works, so
idle notification volume is inherent. The audit-review-team is particularly
exposed because reviewer and fixer alternate — one is always idle. At 2 members
this is manageable; at 3-4 it would compound.

**Sources:** [2][3][1]

---

## Sources

| #   | URL                                                                                            | Title                                                          | Type                         | Trust       | CRAAP     | Date       |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------- | ----------- | --------- | ---------- |
| 1   | https://code.claude.com/docs/en/agent-teams                                                    | Orchestrate teams of Claude Code sessions                      | Official docs                | HIGH        | 5/5/5/5/5 | 2026       |
| 2   | https://dev.to/nwyin/reverse-engineering-claude-code-agent-teams-architecture-and-protocol-o49 | Reverse-Engineering Claude Code Agent Teams                    | Technical analysis           | MEDIUM-HIGH | 4/5/4/4/5 | 2026       |
| 3   | https://code.claude.com/docs/en/costs                                                          | Manage costs effectively                                       | Official docs                | HIGH        | 5/5/5/5/5 | 2026       |
| 4   | https://blog.laozhang.ai/en/posts/claude-code-agent-teams                                      | Claude Code Agent Teams: The Practical Guide                   | Practitioner blog            | MEDIUM      | 3/5/3/4/4 | 2026       |
| 5   | https://www.aicosts.ai/blog/claude-code-subagent-cost-explosion-887k-tokens-minute-crisis      | The Claude Code Subagent Cost Explosion                        | Case study blog              | MEDIUM      | 3/5/3/4/3 | 2026       |
| 6   | https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/                      | From Tasks to Swarms: Agent Teams in Claude Code               | Technical blog               | MEDIUM      | 4/5/4/4/5 | 2026       |
| 7   | https://fullstackagents.substack.com/p/i-ran-my-entire-content-operation                       | I Ran My Entire Content Operation on Claude Code's Agent Teams | Practitioner case study      | MEDIUM      | 3/4/3/4/4 | 2026       |
| 8   | https://heeki.medium.com/collaborating-with-agents-teams-in-claude-code-f64a465f3c11           | Collaborating with Agent Teams in Claude Code                  | Practitioner report          | MEDIUM      | 3/4/3/4/4 | 2026       |
| 9   | https://getpushtoprod.substack.com/p/30-tips-for-claude-code-agent-teams                       | 30 Tips for Claude Code Agent Teams                            | Practitioner tips            | MEDIUM      | 3/4/3/4/4 | 2026       |
| 10  | https://addyosmani.com/blog/claude-code-agent-teams/                                           | Claude Code Swarms                                             | Technical blog (Addy Osmani) | MEDIUM-HIGH | 4/5/4/4/5 | 2026       |
| 11  | https://medium.com/@dev.aguillin/claude-subagents-vs-teams-3dfb93d7d201                        | Claude Subagents VS Teams                                      | Practitioner blog            | MEDIUM      | 3/4/3/3/4 | 2026       |
| 12  | https://www.anthropic.com/news/claude-opus-4-6                                                 | Introducing Claude Opus 4.6                                    | Official announcement        | HIGH        | 5/5/5/5/5 | 2026-02-05 |

---

## Contradictions

**1. Token multiplier variance (3x vs 7x vs "15x"):**

- Official docs state 7x for plan mode, and "roughly proportional to team size"
  for standard mode
- Practitioner sources report 3-4x for standard mode
- One source (aicosts.ai) reports "15x standard usage" in a different context —
  this appears to be from a different methodology (including subagents not
  teams, or plan mode active)
- Resolution: The 3-4x figure applies to standard mode with no plan mode; 7x
  applies when all teammates are in plan mode; 15x may apply to a 5+ member team
  with plan mode and broadcast-heavy coordination. These are not contradictory,
  they reflect different conditions.

**2. "Opus-exclusive" vs model-flexible:**

- Prior research (Session #225) described Agent Teams as "Opus-exclusive"
- Current official docs state any model can be used for teammates, and Sonnet is
  recommended for cost efficiency
- Resolution: Agent Teams launched alongside Opus 4.6 and was initially framed
  as an Opus feature, but the architecture is model-agnostic. v2.1.72 fixed
  "team agents inherit the leader's model" — before that fix, model propagation
  was inconsistent. Sonnet (or mixed-model) teams are fully supported and
  recommended for cost optimization.

**3. Per-member cost "3x" vs "linear scaling":**

- audit-review-team config states "2-member teams run ~3x solo cost; 3+ members
  push to 4-7x"
- Official docs state "token usage scales linearly with team size"
- Resolution: Linear scaling describes the teammate execution cost. The 3x vs
  4-7x in the team configs accounts for the additional coordination overhead
  (idle notifications, task list reads, inbox polling) which grows
  super-linearly with team size. A 2-member team has 1 coordination channel; a
  3-member team has 3; a 5-member team has 10. So cost is linear in teammate
  execution but super-linear in coordination.

---

## Gaps

**1. No controlled study on quality vs subagents.** All quality data is
practitioner self-report on specific use cases. No A/B test has been published
comparing identical tasks run as a team vs as subagents with quality metrics
(defect detection rate, plan accuracy, etc.).

**2. No per-idle-notification token cost published.** The idle notification
flood behavior is confirmed, but the exact token cost per notification (how many
tokens does processing one idle_notification inject into the lead's context) is
not published anywhere. Estimating it requires access to actual inbox JSON and
lead context traces.

**3. Session #225 topology overhead figures (+58%, +285%, +515%) not
re-verified.** These figures appear in SoNash's prior research and the current
team configs but were not confirmed by any source in this search. The
directional claim (hybrid costs more than centralized) is consistent with what's
known about Agent Teams architecture, but the specific percentages should be
treated as unconfirmed.

**4. Exact polling interval for inbox reads is not published.** The
reverse-engineering article confirms polling occurs but does not give the
interval. This matters for understanding how quickly idle notifications arrive
in the lead's context.

**5. No size-specific quality data for 2 vs 3 vs 4 member teams.** The existing
quality claims are directional ("3 focused teammates often outperform 5
scattered ones") but no data point compares a 2-member team to a 3-member team
on equivalent tasks.

---

## Serendipity

**Anthropic C compiler case study (Anthropic engineering blog):** Anthropic
internally validated Agent Teams at scale by having "16 agent teams" work across
~2,000 sessions to rewrite a C compiler in Rust, producing ~100,000 lines of
code at approximately $20,000 in API usage (2 billion input tokens, 140 million
output tokens). This is the only published case of teams at scale from a
first-party source. Key implication: "16 agent teams" likely means 16 sequential
team runs (given one-team-per-session limit), not 16 simultaneous teams.

**Mixed-model cost reduction:** Using Opus for the lead/planner and Sonnet for
researchers/verifiers/reviewers reduces costs by 40–60% on teams where only 1–2
tasks need top-tier reasoning. This validates the research-plan-team's existing
design (opus for planner only) and suggests the audit-review-team could stay on
Sonnet across all members (which it already does).

**TeammateIdle hook as quality gate:** The `TeammateIdle` hook (exit code 2 =
keep working with feedback) is a powerful quality enforcement mechanism not
mentioned in SoNash's current team configs. It can be used to prevent teammates
from going idle when their output doesn't meet criteria — effectively a
convergence loop enforced at the hook level rather than in the spawn prompt.

**Subagent cost explosion risk:** A 49-agent configuration burned $8,000–$15,000
in a single session. This confirms that Agent Teams (with their hard team-size
constraint and explicit cleanup lifecycle) are inherently safer than unbounded
subagent spawning. SoNash's ephemeral team design with explicit TeamDelete is
the right approach.

---

## SoNash Recommendation: Teams vs Subagent Dispatch

**Current team configs are correctly designed.** The audit-review-team (2
members) and research-plan-team (3 members) match the optimal range and use
cases documented by official sources and practitioners.

**Do not invest in more teams.** D11b's recommendation against creating more
teams (deep-research, PR review, session management) is validated by this
research for the following reasons:

1. **deep-research:** Already uses parallel subagent spawning (the current
   architecture with searcher agents). These are parallel workers that only
   report results back — the exact use case where subagents are sufficient and
   teams add cost without benefit. The searchers don't need to communicate with
   each other during execution.

2. **PR review:** A team would add direct inter-agent communication, but PR
   review agents (security, performance, test coverage) work independently on
   the same PR with no need to challenge each other during execution — they
   produce independent reports. Subagent dispatch is correct.

3. **session management:** Pure sequential orchestration. A single lead session
   is the correct topology.

**One specific team investment worth considering:** A `TeammateIdle` hook for
the audit-review-team that validates reviewer findings format before the fixer
receives them. This is a hook-level quality gate, not a new team member.

**The one-team-per-session limit is the binding constraint for future team
design.** Any workflow that might need to invoke a team should check whether it
could conflict with an existing active team in the same session. The ephemeral
lifecycle in both configs correctly handles this.

---

## Confidence Assessment

- HIGH claims: 5 (architecture, cost data, communication overhead, when teams
  win, one-team limit)
- MEDIUM claims: 3 (quality comparison, idle cost, team size effects)
- LOW claims: 0
- UNVERIFIED claims: 0 (Session #225 topology percentages are gap-noted, not
  asserted as findings)
- **Overall confidence: HIGH** for architecture and cost; **MEDIUM** for quality
  comparisons (no controlled study exists)
