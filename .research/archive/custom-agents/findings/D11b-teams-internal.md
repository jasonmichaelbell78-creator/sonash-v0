# Findings: SQ11 (Part B) — Current Team Configuration Analysis and Recommendations

**Searcher:** deep-research-searcher **Profile:** codebase **Date:**
2026-03-29T00:00:00Z **Sub-Question IDs:** SQ11-B

---

## Research Methodology

Direct filesystem reads of all relevant artifacts (ground truth, no training
data assertions):

- `.claude/teams/audit-review-team.md` (v1.0, 186 lines)
- `.claude/teams/research-plan-team.md` (v1.0, 290 lines)
- `.planning/agent-environment-analysis/AGENT_TEAMS_RESEARCH.md` (Session #225
  data)
- Prior wave findings cross-referenced: D2 (orchestration patterns), D8a
  (adversarial external), D8b (adversarial internal), D9a (pipeline agents
  external), D9b (pipeline agents internal), D10c (net-new internal gaps), D5a
  (workflow gaps), D5b (session hooks)

**Prior research synthesis:** Session #225 produced AGENT_TEAMS_RESEARCH.md with
empirical data on token costs, team composition, and frequency thresholds. W1-W3
from this research session (33 agents spawned) produced detailed gap analysis,
adversarial agent patterns, pipeline agent patterns, and new agent candidate
catalog.

---

## Section 1: Current Team Evaluations

### Team 1: audit-review-team

**Configuration (as documented):**

| Field          | Value                                                |
| -------------- | ---------------------------------------------------- |
| Members        | 2 (reviewer + fixer)                                 |
| Models         | Both Sonnet                                          |
| Coordination   | Sequential pipeline (reviewer → fixer)               |
| Persistence    | Ephemeral per audit invocation                       |
| Trigger        | 3+ audit targets, /skill-audit, /audit-comprehensive |
| Token overhead | ~3x solo                                             |

---

#### 1.1 Member Role Assessment [CONFIDENCE: HIGH]

**reviewer** (Read, Grep, Glob, Bash — Analyst): The read-only constraint is
correct and well-justified. reviewer's role maps cleanly to the "Parallel
Specialists" Pattern 1 from AGENT_TEAMS_RESEARCH.md. Its tool set is appropriate
for evaluation tasks: no Write needed, no web search needed (audit targets are
local artifacts).

**fixer** (Read, Write, Edit, Bash, Grep, Glob — Executor): The fixer's role is
well-scoped. The constraint that "fixer proposes, does not auto-apply" (per
CLAUDE.md guardrail #2) is correctly encoded. Tools are appropriate.

**Gap identified:** Neither member has WebSearch or WebFetch. For skill audits
involving pattern validation against external best practices (e.g., "is this
SKILL.md structure aligned with current agent design patterns?"), a web-search
capability on the reviewer would improve audit quality. This is a LOW-PRIORITY
gap since most audits target local artifacts.

**Verdict: member roles are appropriate for the defined use case.** No changes
needed.

---

#### 1.2 Team Size Assessment [CONFIDENCE: HIGH]

2 members is optimal for this sequential pipeline. Session #225 research
confirms:

- 2-member teams: ~3x solo cost
- 3+ members: 4-7x cost
- The reviewer → fixer pipeline is strictly sequential — adding a third member
  would idle-wait 50%+ of the time (confirmed by AGENT_TEAMS_RESEARCH.md finding
  on idle notification flood)

D2 (Google/MIT arxiv 2512.08296) empirically confirms: power-law scaling T =
2.72 × (n+0.5)^1.724 means adding a third team member yields diminishing
reasoning capacity per agent under fixed compute budgets. For a sequential
two-step pipeline, 2 members is the correct size.

**Verdict: team size is optimal. No change.**

---

#### 1.3 Coordination Model Assessment [CONFIDENCE: HIGH]

The sequential pipeline model (reviewer → fixer via SendMessage) is correct for
this workflow. The key benefit over subagents is the cross-target pattern
accumulation: the reviewer builds a shared mental model across all audit targets
within one session, recognizing systemic patterns that a fresh subagent per
target would miss.

The current model matches the "Sequential Pipeline with Parallel Support"
(Pattern 2) from AGENT_TEAMS_RESEARCH.md. This is the right pattern for audit
workflows.

**One weakness identified:** The coordination model diagram shows the team lead
sends audit targets to reviewer sequentially (one-at-a-time). For audits with
10+ targets, a round-robin batching strategy (reviewer processes 2-3 targets
simultaneously, fixer handles completed batches) could reduce wall-clock time.
However, this increases coordination complexity and idle-notification risk. The
current sequential model is safer and simpler.

**Verdict: coordination model is sound. No structural change recommended.**

---

#### 1.4 Trigger Conditions Assessment [CONFIDENCE: HIGH]

Current trigger: "3+ artifacts / /audit-comprehensive / 5+ components"

This is well-calibrated against the token overhead justification. 3-artifact
threshold aligns with the cross-target pattern accumulation benefit (emergent
only after 3+ targets, per team documentation). Below 3, the pattern benefit
does not materialize.

**Gap: the trigger does not mention the convergence-loop-verifier use case.**
D10c Finding 1 identified convergence-loop-verifier as a P1 new agent needed
across 6+ skills. When the convergence-loop-verifier is eventually created,
skill audits of the convergence-loop pipeline itself would benefit from the
audit-review-team. The trigger condition is broadly correct but will need a new
entry when the verifier ecosystem is implemented.

**Verdict: triggers are well-calibrated. Minor documentation update needed when
convergence-loop-verifier is created.**

---

#### 1.5 Overall audit-review-team Assessment [CONFIDENCE: HIGH]

**GRADE: SOUND — no structural changes needed.**

The team was thoughtfully designed against Session #225 learnings. The 2-member
sequential pipeline with the reviewer-fixer pattern is the right architecture.
The cross-target pattern accumulation rationale is sound and not achievable with
fresh subagents per target.

**One improvement opportunity:** If audit targets include external pattern
validation (comparing SoNash agent definitions against external community
standards, which D10a/D10b research now enables), the reviewer should have
WebSearch added to its tool set. This is a LOW priority change that depends on
whether external-comparison audits become a regular use case.

---

### Team 2: research-plan-team

**Configuration (as documented):**

| Field          | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| Members        | 3 (researcher + planner + verifier)                                            |
| Models         | researcher: Sonnet, planner: Opus, verifier: Sonnet                            |
| Coordination   | Progressive handoff + adversarial verification                                 |
| Persistence    | Ephemeral per research-plan cycle                                              |
| Trigger        | /deep-research + /deep-plan on same topic, complexity L/XL, multi-session plan |
| Token overhead | ~4x solo                                                                       |

---

#### 2.1 Member Role Assessment [CONFIDENCE: HIGH]

**researcher** (Read, Grep, Glob, Bash, WebSearch, WebFetch — Domain
investigator): This role correctly maps to what deep-research-searcher does, but
within a team for the integrated research-to-plan pipeline. The tool set is the
right multi-profile tool set (codebase + web). The progressive handoff to
planner (send findings after each sub-question) is a key benefit that
distinguishes this from subagent-based research.

**Critical gap identified:** The researcher member definition does NOT reference
the deep-research-searcher agent definition. It is defined from scratch with a
custom role prompt. This means the researcher member does not inherit any of the
searcher's rigor: no CRAAP+SIFT evaluation, no confidence calibration protocol,
no structured return format, no source hierarchy awareness. D1/D1b findings
established that the deep-research-searcher definition (344-386 lines with 11
sections) is what produces reliable, citation-backed findings. The team's
researcher role is a stripped-down approximation.

**planner** (Read, Write, Edit, Bash, Grep, Glob — Decision architect, Opus):
The Opus selection for planner is well-justified (Decision #18: lean Opus for
high-stakes output). The planner's core task — translating research findings
into numbered decisions with dependencies and effort estimates — is a
high-complexity reasoning task that justifies the Opus cost. Tool set is
appropriate for planning work.

**verifier** (Read, Grep, Glob, Bash — CL auditor): The verifier's role aligns
with the convergence-loop pattern. However, it has the same issue as researcher:
it does not reference an established custom agent definition. D10c Finding 1
established that convergence-loop-verifier is a P1 needed agent across 6+
skills. The team's verifier is an ad-hoc approximation of what that dedicated
agent should provide. When convergence-loop-verifier is created, the team's
verifier role should be updated to reference it (or spawn it).

**Verdict: roles are conceptually sound but both researcher and verifier are
ad-hoc approximations of agents that either already exist
(deep-research-searcher) or should be created (convergence-loop-verifier). This
is a MEDIUM priority gap.**

---

#### 2.2 Team Size Assessment [CONFIDENCE: HIGH]

3 members at ~4x solo cost. The token cost justification in the team
documentation is clear: justified when "research is complex (3+ sub-questions),
plan drives multi-session implementation, or claims need independent
verification."

D2's empirical data supports 3 as a reasonable team size — it is below the 3-4
agent hard limit where per-agent reasoning capacity degrades significantly under
fixed compute. The three distinct cognitive modes (divergent research,
convergent planning, adversarial verification) each genuinely benefit from their
own context window.

**Verdict: 3-member team size is appropriate for the defined complexity
threshold.**

---

#### 2.3 Coordination Model Assessment [CONFIDENCE: HIGH]

The progressive handoff model (researcher sends findings to planner per
sub-question convergence, then planner sends claims to verifier for multi-pass
challenge) is the primary justification for using a team instead of subagents.
This pattern enables:

1. Planner starts structuring before all research is complete (latency
   reduction)
2. Verifier challenges planner directly (adversarial without lead relay)
3. Planner can ask researcher for clarification directly (no round-trip through
   lead)

The D9a research (Step-DeepResearch architecture) confirms this pattern:
progressive handoff in a multi-role pipeline reduces latency and improves
intermediate result quality because downstream roles can begin work before
upstream work is complete.

**Weakness identified: the team's inter-agent communication protocol does not
define message schemas.** The team documentation says "researcher -> planner
(progressive): After each sub-question converges, sends findings with evidence
quality scores." But there is no defined schema for what "findings with evidence
quality scores" looks like. Without a schema, the planner receives free-form
text and cannot programmatically evaluate evidence quality. D9b Finding 3
identified this same gap in the pipeline: the dispute-resolver cannot parse how
many disputes were resolved without structured returns. The same problem applies
here.

**Verdict: coordination model is architecturally sound but lacks inter-agent
message schemas. This should be defined when the team is next invoked
seriously.**

---

#### 2.4 Trigger Conditions Assessment [CONFIDENCE: HIGH]

Current trigger: ALL of (/deep-research + /deep-plan on same topic) AND
(complexity L/XL) AND (plan drives multi-session implementation).

This is a conservative trigger — all three conditions must be met. This is
appropriate given the 4x token cost. The trigger correctly excludes:

- Simple /deep-research without a plan (subagents are sufficient)
- Quick plans (subagent planner is sufficient)
- 1-2 sub-question research (insufficient to justify team overhead)

**One trigger gap: the team does not define how to assess "complexity is L or
XL."** SKILL.md has scaling tables defining L1-L4 depth levels. But the team
documentation does not reference these levels — it uses vague "L or XL" labels
from a different classification system. This creates ambiguity when deciding
whether to spawn the team.

**Verdict: trigger logic is well-calibrated but the complexity assessment
criterion needs to reference SKILL.md's depth/complexity definitions for
clarity.**

---

#### 2.5 Researcher Role — Deep-Research Compatibility Assessment [CONFIDENCE: HIGH]

The research-plan-team's researcher runs at the same time as deep-research's
Phase 1 searchers. But the current deep-research skill (v1.8) has evolved
significantly from when the team was designed. The skill now includes:

- Phase 2.5 verification agents
- Phase 3 adversarial agents (contrarian, OTB)
- Phase 3.5 dispute resolution
- Phase 3.95-3.97 gap pursuit pipeline

None of these phases are represented in the research-plan-team's researcher
role. The team's researcher does basic domain research — it does not conduct the
multi-phase adversarial verification pipeline that the standalone /deep-research
skill executes.

This means research quality from the team's researcher is significantly lower
than research quality from a full /deep-research invocation. The team trades
research depth for inter-agent communication benefits (progressive handoff,
planner clarification).

**Is this trade-off acceptable?** For the defined trigger (integrated
research-to-plan in one session), yes — the planner's feedback loop can
substitute for some verification depth. But if the research topic is genuinely
complex and high-stakes, the team's researcher is a poor substitute for a full
/deep-research run.

**Verdict: the team's researcher is a simplified research mode, not a full
deep-research replacement. This should be explicitly documented in the team's
purpose section.**

---

#### 2.6 Overall research-plan-team Assessment [CONFIDENCE: HIGH]

**GRADE: CONCEPTUALLY SOUND, NEEDS REFINEMENT.**

The three-role design is correct and the inter-agent communication benefits are
real. However, three gaps need addressing:

1. **researcher role should reference deep-research-searcher protocols**
   (CRAAP+SIFT, confidence calibration, source hierarchy) — currently missing
2. **verifier role should reference convergence-loop-verifier** when that agent
   is created
3. **inter-agent message schemas should be defined** for researcher → planner
   handoffs
4. **complexity trigger should reference SKILL.md depth levels** instead of
   vague L/XL labels

---

## Section 2: New Team Opportunity Analysis

Based on W1-W3 findings across 33 agents, four potential new team configurations
were evaluated against the core decision rule: **"Use a team only if agents
would benefit from talking to each other during execution."
(AGENT_TEAMS_RESEARCH.md)**

---

### Opportunity A: Deep-Research Team [CONFIDENCE: HIGH]

**Proposed members:**

1. `deep-research-searcher` (Sonnet) — Phase 1 parallel research
2. `contrarian-challenger` (Sonnet) — Phase 3 adversarial challenge
3. `deep-research-verifier` (Sonnet) — Phase 2.5 + 3.96 verification

**Would agents benefit from talking to each other during execution?**

Partially. Searchers currently send findings to the synthesizer (via filesystem
writes, not direct messaging). The contrarian receives the synthesis output. The
verifier receives claims.jsonl. These interactions are already mediated by the
filesystem and the orchestrator.

**The critical question: does the deep-research pipeline need real-time
inter-agent communication, or is filesystem-mediated coordination sufficient?**

Evidence from D9b: the deep-research pipeline is structured as a sequential
phase pipeline (Phase 1 → 2 → 2.5 → 3 → 3.5 → 3.95 → 3.96 → 3.97). Each phase
waits for the previous to complete. There is no case where Phase 1 searchers
need to talk to Phase 3 contrarians in real time. The orchestrator mediates all
handoffs.

D2 Finding 3 empirically found: "Under fixed computational budgets, per-agent
reasoning capacity becomes severely constrained beyond 3-4 agents." The
deep-research pipeline at L3 spawns 3 searchers + 1 synthesizer + 2 verification
agents + 2 challengers + 1 dispute resolver = 9+ agents. This is well beyond the
3-4 agent sweet spot for team coordination.

**Additional constraint:** The one-team-per-session limit means a deep-research
team would block use of audit-review-team or research-plan-team in the same
session.

**Conclusion: RECOMMEND AGAINST a deep-research team configuration.** The
pipeline's sequential phase structure means searchers, verifiers, and
challengers do not benefit from real-time messaging — filesystem-mediated
handoffs are sufficient. The 3-7x token overhead is not justified when subagent
coordination already works well. The one-team-per-session constraint would block
other team uses.

**The correct pattern for deep-research is the current subagent pattern**,
improved with custom agent definitions for each pipeline role (as identified by
D8a, D8b, D9b).

---

### Opportunity B: PR Review Team [CONFIDENCE: HIGH]

**Proposed members:**

1. `code-reviewer` (Sonnet) — code quality analysis
2. `security-auditor` (Sonnet) — security finding analysis
3. `test-engineer` (Sonnet) — test coverage gap analysis

**Would agents benefit from talking to each other during execution?**

Analysis of the /pr-review skill workflow (from D5a Finding 2): pr-review
dispatches security-auditor, test-engineer, performance-engineer, and
code-reviewer in parallel at Step 3. Each produces independent findings. The
orchestrator aggregates results. There is no documented case where the
code-reviewer needs to ask the security-auditor a question in real time, or
where the test-engineer's output needs to influence the security-auditor
mid-analysis.

The primary benefit of parallel PR review is speed (parallel execution) and
coverage (each agent has its own context window, preventing context exhaustion).
Both of these benefits are achieved by the current subagent parallel dispatch
pattern.

**When would a PR review team genuinely help?** Only when reviews are
inter-dependent — e.g., the security-auditor discovers a vulnerability in the
same code that the code-reviewer is evaluating, and the code-reviewer should
know about it before writing its analysis. This is a real but edge-case scenario
(applies to security-sensitive PRs where vulnerabilities change the code quality
analysis).

**Token cost analysis:** A 3-agent PR review team costs ~4x solo. Compared to
current 3 subagent dispatch (~2.4x solo based on AGENT_TEAMS_RESEARCH.md table),
the team adds ~1.6x additional cost for primarily edge-case inter-agent
communication benefit.

**Conclusion: RECOMMEND AGAINST a PR review team for standard PR reviews.** The
subagent parallel dispatch pattern is correct for the typical case. A team-based
PR review would only be justified for high-security-sensitive PRs where
vulnerability findings materially affect code quality assessments — which is a
rare scenario at SoNash's current scale. When this scenario arises, the
audit-review-team (already configured) can serve this need with the lead passing
security findings to code-reviewer before finalizing.

---

### Opportunity C: Session Management Team [CONFIDENCE: MEDIUM]

**Proposed members:**

1. `session-begin-health-triage` (Sonnet) — health failure analysis (D10c Gap 3)
2. `session-end-compliance-enforcer` (Sonnet) — session closure validation (D10c
   Gap 4)
3. `session-end-continuity-writer` (Sonnet) — context/continuity documentation
   (D10c Gap 5)

**Would agents benefit from talking to each other during execution?**

In theory: session-begin-health-triage's findings (what failed during startup)
could inform session-end-compliance-enforcer's compliance check (was the startup
failure addressed?). This is a cross-boundary connection between two different
sessions' activities.

In practice: session-begin and session-end are temporally separated by the
entire work session. They cannot run simultaneously — one runs at the start, the
other at the end. An Agent Team cannot span this temporal gap (teams are
ephemeral per-invocation).

A session-management team would need to be spawned at session-begin and kept
alive until session-end. This violates the ephemeral pattern, accumulates idle
tokens throughout the session, and conflicts with the one-team-per-session limit
(blocking audit-review-team and research-plan-team for the duration of the
session).

**Conclusion: RECOMMEND AGAINST a session management team.** The session
lifecycle agents (when created) should remain independent subagents.
Session-begin-health-triage runs at startup and completes. Session-end agents
run at closure and complete. No real-time inter-agent communication is needed
because the session boundary separates their execution.

---

### Opportunity D: Development Team [CONFIDENCE: HIGH]

**Proposed members:**

1. `frontend-developer` (Sonnet) — React/UI implementation
2. `test-engineer` (Sonnet) — test writing for implemented components
3. `code-reviewer` (Sonnet) — review of implementation and tests

**Would agents benefit from talking to each other during execution?**

YES — this is the strongest case among the four opportunities.
AGENT_TEAMS_RESEARCH.md explicitly rates "Development (3+ files)" as HIGH
benefit for teams (P2 priority in Implementation Priority table). The rationale:

- **test-engineer needs to know what the frontend-developer is implementing** —
  test strategy should be co-designed with implementation, not after the fact. A
  test-engineer working in isolation may write tests for an API that the
  frontend-developer has already changed.
- **code-reviewer needs to see implementation + tests together** — reviewing
  code without the test coverage picture misses whether test paths cover the
  risky cases. A code-reviewer can ask "this function handles empty arrays — did
  the test-engineer add a case for that?"
- **frontend-developer can ask code-reviewer about patterns mid-implementation**
  — before committing to a specific approach, the developer can send a draft for
  quick review without requiring the lead to relay.

The current workflow for multi-file features (from CLAUDE.md Section 7):
"Multi-file feature (3+ files) → Development team." This entry already exists in
the trigger table but there is **no `.claude/teams/development-team.md` file**.
The trigger references a team that has not been configured.

**Cost analysis:** 3-member team at ~4x solo. For multi-file features spanning
3+ files, the current pattern spawns sequential subagents (implement → test →
review). The sequential cost is ~1.5-2x solo for 3 passes. A team costs ~4x. The
2x premium buys:

- Real-time inter-agent communication (test-engineer can adjust strategy
  mid-implementation)
- Parallel implementation + test writing after initial scaffolding
- Code review that sees implementation context directly from the developer

**For small features (3-5 files):** Cost premium may not be justified. Subagent
sequential pattern is acceptable. **For large features (5+ files, new UI
components, complex state management):** The parallelism and real-time
communication benefits justify the 4x cost. CLAUDE.md already indicates this
team should exist.

**Conclusion: RECOMMEND CREATING a development-team configuration.** This is the
highest- value new team opportunity because: (a) the CLAUDE.md trigger already
references it, (b) the agents (frontend-developer, test-engineer, code-reviewer)
already exist and are non-stub, (c) the inter-agent communication benefit is
genuine and not achievable with sequential subagents, and (d) D2's orchestration
research confirms development as HIGH benefit workflow.

---

## Section 3: Comprehensive Cost-Benefit Analysis

### 3.1 Token Cost Model (from AGENT_TEAMS_RESEARCH.md, ground truth) [CONFIDENCE: HIGH]

| Configuration            | Token Overhead | Justified For                                                   |
| ------------------------ | -------------- | --------------------------------------------------------------- |
| Solo agent               | 1x baseline    | Single-task work                                                |
| 2 subagents (sequential) | ~1.5x          | Two-phase work, no inter-agent communication needed             |
| 3 subagents (parallel)   | ~2.2x          | Parallel independent tasks                                      |
| 2-member team            | ~3x            | Sequential pipeline with persistent cross-target memory         |
| 3-member team            | ~4x            | Complex pipeline with real-time inter-agent communication       |
| 4-member team            | ~5-6x          | Rare; justified only when 4 distinct modes + high communication |
| 5-member team            | ~7x            | Not recommended unless communication density is very high       |

One-team-per-session limit creates an opportunity cost: whichever team is active
blocks other team use. This makes team selection a session-level resource
allocation decision.

---

### 3.2 Cost-Benefit Per Team [CONFIDENCE: HIGH]

**audit-review-team (2 members, ~3x solo):**

| Dimension               | Assessment                                                                                                                                                                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Benefit                 | Cross-target pattern accumulation (reviewer builds systemic understanding)                                                                                                                                                                                 |
| Benefit                 | Consistent reviewer-fixer context within a session                                                                                                                                                                                                         |
| Cost                    | ~3x vs ~1.5x for sequential subagents = 2x premium                                                                                                                                                                                                         |
| Justification threshold | 3+ audit targets (documented)                                                                                                                                                                                                                              |
| ROI assessment          | HIGH — systemic pattern detection after 3+ targets is the primary value. This is the "killer use case" for a team: the reviewer's context at target #5 explicitly references patterns from targets #2-4, producing insights no fresh subagent can produce. |
| Verdict                 | KEEP, currently justified at defined threshold                                                                                                                                                                                                             |

**research-plan-team (3 members, ~4x solo):**

| Dimension               | Assessment                                                                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Benefit                 | Progressive research → plan handoff (planner starts earlier)                                                                                                                                          |
| Benefit                 | Direct planner ↔ researcher clarification (no lead relay)                                                                                                                                             |
| Benefit                 | Adversarial verification of plan claims                                                                                                                                                               |
| Cost                    | ~4x vs ~2.2x for parallel subagents + sequential planner = ~2x premium for inter-agent communication benefits                                                                                         |
| Justification threshold | ALL of: (a) research + plan on same topic, (b) complexity L/XL, (c) multi-session plan                                                                                                                |
| ROI assessment          | MEDIUM-HIGH — justified when all three conditions met. The inter-agent communication benefits are real but the conservative threshold means this team is rarely spawned. When invoked, value is high. |
| Verdict                 | KEEP, improve researcher + verifier role definitions                                                                                                                                                  |

**development-team (proposed, 3 members, ~4x solo):**

| Dimension               | Assessment                                                                                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Benefit                 | Test-engineer co-designs tests with implementation (not after)                                                                                                                                       |
| Benefit                 | Code-reviewer sees implementation + test context from developer directly                                                                                                                             |
| Benefit                 | Parallel implementation + test writing after initial scaffolding                                                                                                                                     |
| Cost                    | ~4x vs ~2-3x for sequential subagents (implement → test → review) = 1.5-2x premium                                                                                                                   |
| Justification threshold | 5+ files, complex UI feature, new state management patterns                                                                                                                                          |
| ROI assessment          | HIGH for large features — the parallel implementation + test pattern reduces wall-clock time, and the inter-agent communication prevents rework from test-engineer writing against stale API design. |
| Verdict                 | CREATE — already referenced in CLAUDE.md; fills a documented gap                                                                                                                                     |

---

### 3.3 When Teams Are Worth the Cost — Decision Framework [CONFIDENCE: HIGH]

Based on all findings, teams are worth the cost multiplier when ALL of these are
true:

1. **Inter-agent communication is necessary (not just useful).** If agents can
   complete their tasks independently and report back to the lead, subagents are
   cheaper. Teams are worth it when Agent A needs to ask Agent B a question, or
   when Agent B's output needs to influence Agent A's still-in-progress work.

2. **Context accumulation across tasks within the session is a primary quality
   driver.** The audit-review-team's cross-target pattern detection is the
   clearest example: no fresh subagent can say "this is the same pattern I saw
   at targets #2, #4, #7." When this kind of session-scoped pattern recognition
   is the primary value, teams win.

3. **Task count meets the spawn-overhead amortization threshold.** For 2-member
   teams: 3+ tasks. For 3-member teams: 5+ tasks. Below threshold, the spawn
   overhead dominates. AGENT_TEAMS_RESEARCH.md frequency table: 5+
   invocations/session → team.

4. **The one-team-per-session constraint doesn't create unacceptable blocking.**
   If the session is likely to need both audit-review-team AND
   research-plan-team, pick the one that provides more value and use subagents
   for the other.

5. **The task type is NOT purely sequential reasoning.** D2 Finding 2
   (Google/MIT): multi-agent variants degraded performance by 39-70% for
   sequential reasoning tasks. Teams work for parallel/collaborative work; they
   hurt for linear reasoning chains.

**Which current workflows benefit most from persistent team context:**

- Comprehensive audits across 5+ targets (audit-review-team: HIGH fit)
- Research → plan pipelines with direct inter-agent clarification
  (research-plan-team: HIGH fit)
- Multi-file feature development with parallel impl + test (development-team:
  HIGH fit)

**Which should stick with sequential/parallel independent agents:**

- Deep-research pipeline phases (sequential, filesystem-mediated, already works)
- PR reviews (parallel independent, no real-time communication needed)
- Session management (temporally separated, cannot maintain team state)
- Single-target audits (insufficient tasks to amortize team overhead)

---

## Section 4: Structural Findings and Recommendations

### Finding 1: development-team Configuration is Missing [CONFIDENCE: HIGH]

CLAUDE.md Section 7 (agent triggers table) references "Development team" for
"Multi-file feature (3+ files)" but no `.claude/teams/development-team.md`
exists. This is a documented gap that should be filled. The agents exist
(frontend-developer, test-engineer, code-reviewer), the trigger is defined, only
the team configuration file is missing.

**Recommended configuration:**

| Member                                   | Role           | Model  | Tools                               |
| ---------------------------------------- | -------------- | ------ | ----------------------------------- |
| `developer` (maps to frontend-developer) | Implementation | Sonnet | Read, Write, Edit, Bash, Grep, Glob |
| `tester` (maps to test-engineer)         | Test writing   | Sonnet | Read, Write, Edit, Bash, Grep, Glob |
| `reviewer` (maps to code-reviewer)       | Code review    | Sonnet | Read, Grep, Glob, Bash              |

Coordination model: developer scaffolds implementation, tester begins test
design in parallel, developer → tester messaging for API contract details,
tester → reviewer for test coverage assessment, reviewer → developer for
patterns that need adjustment.

Spawn threshold: 5+ files OR new UI component with state management OR CLAUDE.md
signals "new UI feature with .protocol.json required."

---

### Finding 2: research-plan-team Researcher Does Not Inherit Deep-Research-Searcher Protocols [CONFIDENCE: HIGH]

The research-plan-team's researcher member is defined with a custom role prompt
that does not reference the CRAAP+SIFT evaluation protocol, confidence level
calibration, source hierarchy, or structured return format from
deep-research-searcher. This means research quality from the team's researcher
is lower than from a standalone /deep-research invocation.

**Recommended fix:** Update the researcher member's role definition to
explicitly call out the deep-research-searcher methodology. At minimum:

- Reference confidence level assignment (HIGH/MEDIUM/LOW/UNVERIFIED)
- Reference source trust hierarchy (T1/T2/T3/T4)
- Require structured returns with confidence distribution
- Cite the FINDINGS.md template as the expected output format

This is a medium priority documentation improvement that does not require a new
agent definition — it is a role description update within the existing team
file.

---

### Finding 3: No Team Should Span the Session Lifecycle [CONFIDENCE: HIGH]

The session management team proposal (Finding C above) reveals an architectural
constraint: Agent Teams are session-scoped and ephemeral. They cannot span
session-begin and session-end boundaries. Any workflow that requires
cross-session state should use persistent files (RESEARCH_OUTPUT.md, state JSONL
files, MEMORY.md) rather than team state. Session lifecycle agents should remain
independent subagents operating on shared file-based state.

---

### Finding 4: audit-review-team Should Add WebSearch to Reviewer for External-Pattern Audits [CONFIDENCE: MEDIUM]

D10a/D10b research has now produced a catalog of external agent patterns against
which SoNash agents can be benchmarked. When /skill-audit targets include
quality comparison against external community standards (e.g., "are our agent
definitions as complete as the patterns in
VoltAgent/awesome-claude-code-subagents?"), the reviewer needs WebSearch to
fetch external reference definitions. The current tool set (Read, Grep, Glob,
Bash) is read-only local — no web access.

This is a LOW priority improvement since most audits are local-artifact focused.

---

### Finding 5: Team Configurations Should Reference Team Agents by Agent File Name [CONFIDENCE: MEDIUM]

The audit-review-team and research-plan-team member tables list roles by
descriptive names ("reviewer," "fixer," "researcher," "planner," "verifier") but
do not reference which `.claude/agents/*.md` file each role maps to. As the
agent ecosystem grows and roles get formal agent definitions
(convergence-loop-verifier, deep-research-final- synthesizer, etc.), teams
should explicitly map their member roles to agent file names.

This enables agents to be reused across contexts (the convergence-loop-verifier
as the research-plan-team's verifier; the deep-research-searcher methodology
inherited by the research-plan-team's researcher).

---

## Sources

| #   | Path                                                           | Title                                      | Type              | Trust | CRAAP | Date       |
| --- | -------------------------------------------------------------- | ------------------------------------------ | ----------------- | ----- | ----- | ---------- |
| 1   | `.claude/teams/audit-review-team.md`                           | audit-review-team v1.0                     | filesystem        | HIGH  | 5/5   | 2026-03-24 |
| 2   | `.claude/teams/research-plan-team.md`                          | research-plan-team v1.0                    | filesystem        | HIGH  | 5/5   | 2026-03-24 |
| 3   | `.planning/agent-environment-analysis/AGENT_TEAMS_RESEARCH.md` | Session #225 Agent Teams Research          | filesystem        | HIGH  | 5/5   | 2026-03-17 |
| 4   | `findings/D2-orchestration-patterns-web.md`                    | Orchestration Patterns — External Research | prior findings    | HIGH  | 4.6/5 | 2026-03-29 |
| 5   | `findings/D8a-adversarial-patterns-web.md`                     | Adversarial Agent Patterns — External      | prior findings    | HIGH  | 4.5/5 | 2026-03-29 |
| 6   | `findings/D8b-adversarial-internal.md`                         | Adversarial Agents — Internal Pipeline     | prior findings    | HIGH  | 5/5   | 2026-03-29 |
| 7   | `findings/D9a-pipeline-agents-web.md`                          | Pipeline Agents — External Research        | prior findings    | HIGH  | 4.5/5 | 2026-03-29 |
| 8   | `findings/D9b-pipeline-agents-internal.md`                     | Pipeline Agents — Internal Analysis        | prior findings    | HIGH  | 5/5   | 2026-03-29 |
| 9   | `findings/D10c-netnew-internal.md`                             | Net-New Agents — Internal Gaps             | prior findings    | HIGH  | 5/5   | 2026-03-29 |
| 10  | `findings/D10a-netnew-github.md`                               | Net-New Agents — GitHub Catalog            | prior findings    | HIGH  | 4.5/5 | 2026-03-29 |
| 11  | `findings/D5a-workflow-gaps-skills.md`                         | Workflow Gaps — Skills Analysis            | prior findings    | HIGH  | 5/5   | 2026-03-29 |
| 12  | `findings/D7c-consolidation-synthesis.md`                      | Consolidation Synthesis                    | prior findings    | HIGH  | 5/5   | 2026-03-29 |
| 13  | `.claude/CLAUDE.md` Section 7                                  | Agent Triggers Table                       | filesystem        | HIGH  | 5/5   | 2026-03-24 |
| 14  | `arxiv 2512.08296` (via D2)                                    | Google/MIT Scaling Agent Systems           | Academic (via D2) | HIGH  | 4.6/5 | Dec 2025   |

---

## Contradictions

**CLAUDE.md references development-team but no file exists:** CLAUDE.md Section
7 trigger table lists "Development team" as the action for "Multi-file feature
(3+ files)." No `.claude/teams/development-team.md` exists. This is not a
logical contradiction — it is an implementation gap. The CLAUDE.md trigger was
likely written in anticipation of the team being created, or the team was
deleted. Either way, the gap should be filled.

**audit-review-team "fixer proposes, does not auto-apply" vs. CLAUDE.md
guardrail #2:** The team correctly encodes CLAUDE.md guardrail #2 (never
implement without explicit approval). No contradiction — the encoding is
correct.

**research-plan-team researcher scope vs. full /deep-research pipeline:** The
team's researcher does light research (sub-question focused); full
/deep-research runs 33+ agents across 3.97 phases. These are not contradictory —
they serve different use cases. The tension is that the team documentation does
not explicitly acknowledge this scope difference, which could lead to research
quality mismatches.

---

## Gaps

1. **No data on how frequently each team is actually spawned.**
   AGENT_TEAMS_RESEARCH.md notes a 5+ invocations/session threshold for team
   justification, but there is no invocation count log for either team. Without
   usage data, it is impossible to confirm whether the teams are being spawned
   at appropriate frequency or being over/under-used.

2. **No performance comparison data between team and subagent modes for
   equivalent tasks.** D2 Gap 1 confirmed this gap exists in the literature. For
   SoNash specifically, no experiment has compared audit-review-team quality
   against sequential subagent quality on the same audit target set.

3. **Inter-agent message schema for research-plan-team is undefined.** The
   researcher → planner progressive handoff lacks a structured schema. Free-form
   findings delivery means the planner receives variable-format input, reducing
   the reliability of early structuring.

4. **development-team does not exist.** Configuration file needs to be created
   before the trigger in CLAUDE.md Section 7 can be honored.

5. **No team observability.** AGENT_TEAMS_RESEARCH.md noted this gap in
   2026-03-17: "No team observability — no metrics tracking for team
   performance." No solution has been implemented since that finding.

---

## Serendipity

**Team member definitions as agent spawning proxies:** The research-plan-team's
researcher and verifier member definitions are essentially custom agent prompts
written inline in the team configuration. As the ecosystem creates formal agent
definitions for these roles (deep-research-searcher for researcher,
convergence-loop-verifier for verifier), the team configurations become thin
wrappers that spawn established agents — rather than inline prompt definitions.
This evolutionary path toward "teams spawn named agents" is cleaner than "teams
contain inline prompt definitions."

**The one-team-per-session limit is an architectural forcing function for clear
priority:** Because only one team can be active per session, the implicit
question becomes "which team provides the most value for this session's work
type?" This forces a triage decision that is healthy: audit sessions use
audit-review-team, research-plan sessions use research-plan-team, development
sessions (once created) use development-team. The limit prevents multi-team
sprawl.

**D2's 45% capability threshold finding has direct team design implications:**
When single-agent baseline performance exceeds ~45% accuracy on a task,
multi-agent coordination yields diminishing or negative returns. For
well-understood SoNash tasks (routine code review, simple research queries), the
lead agent alone may perform better than a team. This is an underutilized
signal: team activation criteria should include an implicit "does this task
genuinely challenge a single agent?" check before spawning.

---

## Summary Table: All Team Recommendations

| Team                      | Status         | Action                                                                                                                                                                                                   | Priority |
| ------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `audit-review-team`       | KEEP           | No structural changes; add WebSearch to reviewer if external-pattern audits become common                                                                                                                | LOW      |
| `research-plan-team`      | KEEP + IMPROVE | Update researcher role to inherit deep-research-searcher protocols; update verifier to reference convergence-loop-verifier when created; add complexity threshold definition referencing SKILL.md levels | MEDIUM   |
| `development-team`        | CREATE         | Configure 3-member team (developer + tester + reviewer); CLAUDE.md trigger already exists; threshold: 5+ files or new UI component                                                                       | HIGH     |
| `deep-research team`      | DO NOT CREATE  | Pipeline is sequential phase-based; filesystem coordination sufficient; would block other teams; 9+ agents exceeds 3-4 member sweet spot                                                                 | —        |
| `pr-review team`          | DO NOT CREATE  | Subagent parallel dispatch sufficient; no real-time inter-agent communication needed for standard PR reviews                                                                                             | —        |
| `session-management team` | DO NOT CREATE  | Cannot span session boundaries; would idle for entire session; subagents on shared file state are correct model                                                                                          | —        |

---

## Confidence Assessment

- HIGH claims: 13
- MEDIUM claims: 3
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH**

All findings derived from direct filesystem reads of team configurations, prior
wave findings (D2, D8a, D8b, D9a, D9b, D10c), and AGENT_TEAMS_RESEARCH.md. No
training-data-only assertions. External research cross-referenced from prior
findings files, which were themselves sourced from authoritative papers (arxiv,
ACL, official docs).
